/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 2 — navegación, transiciones y continuidad espacial

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f2.mjs

   Lo que se comprueba aquí es la DECISIÓN —qué clase de movimiento es cada
   cambio de la pila (entrar, volver, cambiar de sección, quedarse), a dónde va
   el scroll, dónde está el indicador— y que la aplicación la cablee de verdad
   (App.jsx, index.css, las vistas con pestañas). Lo que necesita un navegador
   —que volver no repita la cascada, que el scroll vuelva a su sitio, que el
   indicador viaje— está en la sección «MS F2» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  TIPOS_NAVEGACION, tipoDeNavegacion, claseDeNavegacion, ENTRADAS_QUE_NO_SE_REPITEN, esEntradaQueNoSeRepite,
  claveDeScroll, destinoDeScroll, podarMemoriaDeScroll, indiceDePestana, estiloDelIndicador,
  AUDITORIA_F2, NO_EN_F2,
} from '../src/lib/transicionNavegacion.js';
import { abrir, irAPrincipal, atras } from '../src/lib/navegacion.js';
import { PRESETS_MOTION, fotogramas, contextoMotion } from '../src/lib/motion.js';
import { MOTION_MAP, auditarMotion, escanearCss, keyframesDe } from '../src/lib/motionMapa.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const CSS = leer('src/index.css');
const APP = leer('src/App.jsx');
const HOOK = leer('src/components/navegacionMotion.js');
const COMP = leer('src/components/motion.jsx');
const SEGURA = leer('src/components/areaSegura.jsx');
const TAIL = leer('tailwind.config.js');
const sinComentarios = (s) => String(s).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const sinComentariosCss = (s) => String(s).replace(/\/\*[\s\S]*?\*\//g, '');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}
const eq = (a, b, msg) => ok(JSON.stringify(a) === JSON.stringify(b), `${msg}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — es ${JSON.stringify(a)}, se esperaba ${JSON.stringify(b)}`}`);

const PRINCIPALES = ['hoy', 'area-salud', 'area-vida', 'area-gestion', 'ajustes'];
const opt = (principal) => ({ principal, principales: PRINCIPALES });

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Qué clase de movimiento es cada cambio de la pila (apartados 5, 6, 8 y 24) ──');

const raiz = [{ id: 'hoy' }];
const enVida = irAPrincipal(raiz, 'area-vida');
const enProd = abrir(enVida, 'productividad');
eq(tipoDeNavegacion(raiz, enVida, opt(true)), 'seccion', 'Inicio → Vida con la barra: cambiar de sección (son hermanas), aunque la pila crezca');
eq(tipoDeNavegacion(enVida, enProd, opt(false)), 'entrar', 'Vida → Productividad (una tarjeta): entrar');
eq(tipoDeNavegacion(enProd, atras(enProd), opt(false)), 'volver', '🚨 Productividad → atrás: VOLVER, no entrar otra vez (apartado 6)');
eq(tipoDeNavegacion(enProd, irAPrincipal(enProd, 'area-vida'), opt(true)), 'volver', 'dentro de un módulo de Vida, tocar Vida en la barra es volver a su hub');
eq(tipoDeNavegacion(enProd, irAPrincipal(enProd, 'hoy'), opt(true)), 'volver', '…y tocar Inicio desde un módulo también vuelve (Inicio es el fondo de toda la pila)');
eq(tipoDeNavegacion(enVida, irAPrincipal(enVida, 'hoy'), opt(true)), 'seccion', '…pero de Vida a Inicio son dos secciones: cambiar de sección');
eq(tipoDeNavegacion(enProd, irAPrincipal(enProd, 'area-gestion'), opt(true)), 'seccion', 'de un módulo de Vida a Gestión: cambiar de sección');
eq(tipoDeNavegacion(enVida, irAPrincipal(enVida, 'ajustes'), opt(true)), 'seccion', '…y a Ajustes también (antes deslizaba desde la derecha como si fuera un nivel más hondo)');
const a3 = abrir(abrir(raiz, 'productividad'), 'organizacion');
eq(tipoDeNavegacion(a3, abrir(a3, 'productividad'), opt(false)), 'volver', 'abrir algo que ya está más abajo en la pila (abrir() recorta) es volver a ello');
eq(tipoDeNavegacion(enProd, abrir(enProd, 'productividad', { foco: 'x' }), opt(false)), 'quieto', 'el mismo sitio con otro foco: ni entrar ni volver');
eq(tipoDeNavegacion(raiz, raiz, opt(true)), 'quieto', 'tocar la pestaña en la que ya estás no es una transición');
eq(tipoDeNavegacion(null, [{ id: 'hoy' }, { id: 'diario' }]), 'entrar', 'con una pila vacía o rara, se normaliza (nunca revienta)');

ok(Object.keys(TIPOS_NAVEGACION).every((k) => TIPOS_NAVEGACION[k].que && TIPOS_NAVEGACION[k].movimiento && TIPOS_NAVEGACION[k].scroll), 'cada tipo dice qué es, cómo se mueve y qué pasa con el scroll');
eq(claseDeNavegacion('entrar'), 'module-enter', 'entrar es la entrada de siempre (module-enter, Fase N1/N2)');
eq(claseDeNavegacion('volver'), 'nav-vuelve', 'volver tiene la suya');
eq(claseDeNavegacion('seccion'), 'nav-seccion', 'cambiar de sección, la suya');
eq(claseDeNavegacion('quieto'), '', 'quedarse, ninguna');
eq(claseDeNavegacion('inventado'), '', 'un tipo que no existe, ninguna (no revienta)');
ok(new Set(['entrar', 'volver', 'seccion'].map(claseDeNavegacion)).size === 3, '🚨 NO siempre el mismo movimiento (apartado 24: «TODAS LAS PÁGINAS: fade in 300 ms» es lo que no quiere)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. El scroll (apartado 13) ──');

eq(claveDeScroll(enProd), 'hoy>area-vida>productividad', 'la clave es la ruta entera, no solo el id');
const mem = new Map([['hoy', 640], ['hoy>area-vida', 120]]);
eq(destinoDeScroll('volver', mem, 'hoy'), 640, '🐛 volver deja la página donde estaba');
eq(destinoDeScroll('entrar', mem, 'hoy>area-vida>productividad'), 0, 'entrar empieza arriba');
eq(destinoDeScroll('seccion', mem, 'hoy>area-vida'), 0, 'cambiar de sección empieza arriba');
eq(destinoDeScroll('quieto', mem, 'hoy'), null, 'quedarse no toca el scroll');
eq(destinoDeScroll('volver', new Map(), 'hoy'), 0, 'volver a algo que no se apuntó, arriba (nunca NaN)');
eq(destinoDeScroll('volver', new Map([['hoy', 'basura']]), 'hoy'), 0, '…y un valor raro tampoco cuela');
const mem2 = new Map([['hoy', 1], ['hoy>area-vida', 2], ['hoy>area-vida>productividad', 3], ['hoy>area-gestion', 4]]);
podarMemoriaDeScroll(mem2, 'hoy>area-vida');
eq([...mem2.keys()].sort(), ['hoy', 'hoy>area-vida'], 'se olvida lo que ya no está en el camino: volver a entrar es entrar de nuevo, arriba');
const mem3 = new Map([['hoy>area-vid', 9], ['hoy', 1]]);
podarMemoriaDeScroll(mem3, 'hoy>area-vida');
eq([...mem3.keys()], ['hoy'], '…y un prefijo de texto que no es un antepasado (area-vid ≠ area-vida) también se olvida');
ok(!/app_data|saveData|localStorage/.test(sinComentarios(leer('src/lib/transicionNavegacion.js')) + sinComentarios(HOOK)), 'el scroll vive en la sesión: ni app_data ni localStorage (NAVO F1, EH F40)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. El indicador de la barra (apartados 2 y 3) ──');

eq(indiceDePestana(PRINCIPALES, 'area-vida'), 2, 'Vida es la tercera');
eq(indiceDePestana(PRINCIPALES, 'productividad'), null, 'un id que no es pestaña: sin indicador');
eq(indiceDePestana(PRINCIPALES, null), null, '…y sin pestaña activa, tampoco');
eq(estiloDelIndicador(2, 5), { width: '20%', transform: 'translateX(200%)', opacity: 1 }, 'el indicador mide una pestaña y se mueve por porcentajes de sí mismo');
eq(estiloDelIndicador(null, 5), { width: '20%', transform: 'translateX(0%)', opacity: 0 }, '…y sin pestaña se apaga en su sitio, sin saltar a ninguna');
eq(estiloDelIndicador(9, 5).opacity, 0, '…y un índice fuera de la barra tampoco se pinta');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. El CSS: tres movimientos, de los tokens, y que no dejan un transform puesto ──');

const css = sinComentariosCss(CSS);
const regla = (sel) => { const m = css.match(new RegExp(`(^|\\n)\\${sel}\\s*\\{([^}]*)\\}`)); return m ? m[2] : ''; };
ok(/animation:\s*moduleSlideIn\s+var\(--motion-dur-slow\)\s+var\(--ease-premium\)\s+backwards/.test(regla('.module-enter')), '🔓 module-enter termina con `backwards`: fuera de la entrada no queda un transform que ancle los `fixed` de dentro (regla 3)');
ok(/animation:\s*navVuelve\s+var\(--motion-dur-normal\)\s+var\(--ease-premium\)\s+backwards/.test(regla('.nav-vuelve')), 'volver: `normal`, la curva de siempre, `backwards`');
ok(/animation:\s*navSeccion\s+var\(--motion-dur-normal\)\s+var\(--ease-premium\)\s+backwards/.test(regla('.nav-seccion')), 'cambiar de sección: igual de corto');
ok(/animation:\s*contenidoCambia\s+var\(--motion-dur-fast\)\s+var\(--ease-premium\)\s+backwards/.test(regla('.contenido-cambia')), 'una pestaña de dentro: más corta todavía (`fast`)');
const kf = (nombre) => { const m = css.match(new RegExp(`@keyframes\\s+${nombre}\\s*\\{([\\s\\S]*?)\\n\\}`)); return m ? m[1] : ''; };
ok(/translateX\(calc\(-1 \* var\(--motion-dist-small\)\)\)/.test(kf('navVuelve')) && /var\(--motion-opac-secondary\)/.test(kf('navVuelve')), '🚨 volver llega desde la IZQUIERDA (el lado del que salió), con un token de distancia: en Reducido vale 0');
ok(/translateY\(var\(--motion-dist-small\)\)/.test(kf('navSeccion')) && !/translateX/.test(kf('navSeccion')), 'cambiar de sección no desliza de lado (apartado 5: «NO utilices siempre slide»)');
ok(!/transform/.test(kf('contenidoCambia')) && /var\(--motion-opac-secondary\)/.test(kf('contenidoCambia')), 'una pestaña de dentro no se mueve: solo el fundido');
ok(/var\(--motion-opac-secondary\)/.test(kf('navVuelve')) && /var\(--motion-opac-secondary\)/.test(kf('navSeccion')), 'volver y cambiar de sección arrancan medio visibles: ni un instante vacío entre una pantalla y otra (apartado 28)');
ok(!/calc\([^)]*ms/.test(kf('navVuelve') + kf('navSeccion') + kf('contenidoCambia')), 'ni un calc() con milisegundos (Safari)');
const ind = regla('.nav-indicador');
ok(/transition:\s*transform var\(--motion-dur-medium\) var\(--motion-curva-emphasized\)/.test(ind) && /pointer-events:\s*none/.test(ind), 'el indicador viaja con la curva enfática y no se interpone al pulsar');
ok(/html\[data-motion='reducido'\] \.nav-indicador\s*\{\s*transition-property:\s*opacity;/.test(css)
  && /@media \(prefers-reduced-motion: reduce\)\s*\{\s*html:not\(\[data-motion='off'\]\) \.nav-indicador\s*\{\s*transition-property:\s*opacity;/.test(css),
  '🚨 en Reducido (el de Ajustes y el del iPhone) el indicador no viaja: aparece');
ok(/\.nav-tab:active \.nav-tab-icon\s*\{\s*transform:\s*scale\(var\(--motion-escala-normal\)\);/.test(css), 'pulsar una pestaña: el icono se encoge un poco, con un token (en Reducido vale 1)');
ok(ENTRADAS_QUE_NO_SE_REPITEN.every((e) => keyframesDe(CSS).includes(e.keyframe) && new RegExp(`\\.${e.clase}\\b`).test(css)), `las ${ENTRADAS_QUE_NO_SE_REPITEN.length} entradas que no se repiten al volver existen de verdad en el CSS`);
ok(esEntradaQueNoSeRepite('hubCardIn') && !esEntradaQueNoSeRepite('latido') && !esEntradaQueNoSeRepite('hubCardExpand') && !esEntradaQueNoSeRepite(undefined),
  '…y solo ésas: ni el latido de un esqueleto ni la expansión al tocar una tarjeta');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. El motor y el mapa ──');

ok(['pageBack', 'sectionSwitch', 'contentChange'].every((k) => PRESETS_MOTION[k] && PRESETS_MOTION[k].que), 'los tres presets nuevos están en el motor (F1, apartado 24: lo que falta se añade allí)');
eq(PRESETS_MOTION.pageBack.clase, 'nav-vuelve', '…y dicen su clase');
const N = contextoMotion();
const R = contextoMotion({ animaciones: 'reducida' });
const pb = fotogramas('pageBack', N);
ok(/translateX\(-8px\)/.test(pb.keyframes[0].transform) && pb.keyframes[0].opacity === '0.65' && pb.opciones.duration === 220,
  `pageBack en Normal: −8 px, 0,65 y 220 ms (${pb.keyframes[0].transform}, ${pb.keyframes[0].opacity}, ${pb.opciones.duration})`);
eq(fotogramas('pageBack', R).keyframes[0].transform, 'none', '…y en Reducido, sin desplazarse');
eq(fotogramas('contentChange', N).keyframes[0].transform, 'none', 'contentChange no se mueve ni en Normal');
const MAPA = Object.fromEntries(MOTION_MAP.map((e) => [e.id, e]));
ok(['volver_pantalla', 'cambio_seccion', 'cambio_contenido', 'indicador_barra'].every((id) => MAPA[id] && MAPA[id].fase === 2), 'el MOTION_MAP tiene las cuatro piezas nuevas, con su fase');
ok(MAPA.entrada_modulo.estado === 'existe', '🔓 «entrar en un módulo» ya no está inconsistente: la dirección cambia al volver');
ok(/Se funde en su sitio/.test(MAPA.cambio_seccion.reducido || '') || /Se funde en su sitio/.test(MAPA.volver_pantalla.reducido || ''), '🐛 el texto de «reducido» del mapa ya dice lo que hace desde la F1 (fundir), no que aparece en su estado final');
const vistas = {};
['src/App.jsx', 'src/components/motion.jsx', 'src/views/NutritionView.jsx'].forEach((f) => { vistas[f] = leer(f); });
const au = auditarMotion({ css: CSS, vistas });
eq(au.sinMapa, [], 'ninguna regla animada sin mapear');
eq(au.keyframesHuerfanos, [], 'ningún @keyframes huérfano');
eq(au.curvasAjenas, [], 'ninguna curva ajena');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. App.jsx: el cableado ──');

const app = sinComentarios(APP);
ok(/const navegarA = \(calcular, principal\) =>/.test(app) && /tipoDeNavegacion\(antes, despues, \{ principal, principales: PESTANAS_PRINCIPALES \}\)/.test(app), 'las tres puertas pasan por `navegarA`, que clasifica el cambio');
ok(/const setTab = \(destino, foco\) => navegarA\(\(p\) => abrirNav\(p, destino, foco\), false\)/.test(app)
  && /const irAPestana = \(destino\) => navegarA\(\(p\) => irAPrincipalNav\(p, destino\), true\)/.test(app)
  && /const volverAtras = \(\) => navegarA\(\(p\) => atrasNav\(p\), false\)/.test(app), '…entrar, la barra y atrás; solo la barra es `principal`');
ok(/pilaNavRef\.current = despues/.test(app), '…sobre una referencia: dos navegaciones en el mismo toque parten de la pila buena (apartado 23)');
ok(/const PESTANAS_PRINCIPALES = \['hoy', \.\.\.AREAS_NAV\.map\(\(a\) => a\.id\), 'ajustes'\]/.test(app), 'las pestañas salen de AREAS_NAV (un área nueva entra sola; siguen siendo cinco)');
const posHook = app.indexOf('useNavegacionEnLaPagina(pantallaRef');
const primerReturn = app.indexOf("if (session === undefined) return");
ok(posHook > 0 && primerReturn > 0 && posHook < primerReturn, '🚨 REGLA 4: el hook de la navegación va antes de cualquier `return` condicional');
/* 🔓 MS F7 — el contenedor sigue siendo UNO, con su clase, su clave y su ref; lo único nuevo es que,
   cuando la pantalla crece desde su tarjeta, no lleva además la entrada desde la derecha. */
/* MS F12 — y con su nombre para VoiceOver (`role="region"` y `aria-label`). */
ok(/<div key=\{tab\} ref=\{pantallaRef\} tabIndex=\{-1\} role="region" aria-label=\{nombrePantalla\} data-navegacion=\{tipoNav\} data-continuidad=\{desdeTarjeta \? 'desde-tarjeta' : undefined\} className=\{`outline-none \$\{desdeTarjeta \? '' : claseDeNavegacion\(tipoNav\)\}`\.trim\(\)\}>/.test(app), 'TODAS las pantallas van en el mismo contenedor, con su clase, su clave y su ref (y la F7 no le pone dos entradas a la vez)');
ok(/if \(!enModulo \|\| !puedeVolverNav\(pilaNav\)\) return contenedor\(protegido\);/.test(app), '…también Inicio y los hubs, que antes aparecían de golpe');
ok(!/<div key=\{tab\} className="module-enter">/.test(app), '…y ya no hay un `module-enter` puesto a pelo');
ok(/<AreaSegura clave=\{tab\} nombre=\{nombrePantalla\}[^>]*texto="Las demás pantallas y la barra de abajo siguen funcionando/.test(app), '🐛 un límite de error por pantalla (apartado 18): un fallo al pintar no deja la aplicación en blanco');
ok(/texto = TEXTO_FITNESS/.test(SEGURA) && /\{texto\}/.test(SEGURA), '…`AreaSegura` admite su texto, y en Fitness sigue diciendo lo de siempre');
ok(/className="nav-indicador"/.test(app) && /estiloDelIndicador\(pestanaActivaIndice, PESTANAS_PRINCIPALES\.length\)/.test(app), 'la barra pinta el indicador con su sitio calculado');
eq((app.match(/aria-current=\{[^}]+\? 'page' : undefined\}/g) || []).length, 3, 'las tres formas de pestaña (Inicio, áreas, Ajustes) dicen cuál es la actual a VoiceOver');
eq((app.match(/className="nav-tab relative flex-1/g) || []).length, 3, '…y todas llevan `nav-tab` (la respuesta al pulsar)');
ok(/tab === 'hoy' \|\| tab === 'ajustes' \? tab : \(areaActual \? areaActual\.id : null\)/.test(app), 'el indicador sigue el MISMO criterio que el color de la pestaña');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. El hook: scroll, entradas y foco ──');

const hook = sinComentarios(HOOK);
eq((hook.match(/addEventListener\('scroll'/g) || []).length, 1, 'un solo escuchador de scroll para toda la navegación (apartado 23)');
ok(/removeEventListener\('scroll'/.test(hook), '…y se quita al desmontar');
ok(/useEfectoAntesDePintar\(\(\) => \{[\s\S]*irA\(destino\)/.test(hook), 'el scroll se pone ANTES de pintar: ni un fotograma en el sitio equivocado');
ok(/if \(tipo === 'volver'\) terminarEntradas\(ref\.current\)/.test(hook), 'al volver se terminan las entradas de lo que ya habías visto');
ok(/getAnimations\(\{ subtree: true \}\)/.test(hook) && /esEntradaQueNoSeRepite\(a\.animationName\)/.test(hook) && /a\.finish\(\)/.test(hook), '…con la Web Animations API, y solo las de la lista');
ok(/focus\(\{ preventScroll: true \}\)/.test(hook) && /activo === document\.body \|\| !activo\.isConnected/.test(hook), 'el foco solo se mueve si se perdió, y sin mover la página (apartado 20)');
ok(/typeof window === 'undefined' \? useEffect : useLayoutEffect/.test(HOOK), 'en el servidor (banco de renderizado) no avisa de useLayoutEffect');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Transición de contenido: otra pestaña dentro de una pantalla (apartados 15 y 16) ──');

ok(/export function CambioDeContenido\(\{ clave/.test(COMP) && /cambiado\.current \? 'contenido-cambia '/.test(COMP) && /key=\{clave\}/.test(COMP), '`CambioDeContenido`: un nodo nuevo por pestaña, y la animación solo cuando cambia');
const CON_PESTANAS = {
  'src/views/NutritionView.jsx': 'sub', 'src/views/WellbeingView.jsx': 'sub', 'src/views/FaithView.jsx': 'sub',
  'src/views/RelationView.jsx': 'sub', 'src/views/AchievementsView.jsx': 'tab', 'src/views/ArmarioView.jsx': 'pestana',
  'src/views/CalendarView.jsx': 'vista',
};
for (const [f, clave] of Object.entries(CON_PESTANAS)) {
  const src = leer(f);
  /* ⚠️ Lo que se protege es que la importación esté UNA vez (la ArmarioView llegó a tener una
     por línea), no su forma exacta: desde la MS F3 la misma línea trae también otras piezas. */
  const deMotion = src.match(/import \{[^}]*\} from '\.\.\/components\/motion';/g) || [];
  ok(new RegExp(`<CambioDeContenido clave=\\{${clave}\\}`).test(src) && deMotion.length === 1 && /\bCambioDeContenido\b/.test(deMotion[0]),
    `${f.replace('src/views/', '')}: cambiar de pestaña es una transición de contenido (importada una vez)`);
}
ok(/<CambioDeContenido clave=\{vista\} className="space-y-4">/.test(leer('src/views/CalendarView.jsx')), 'el Calendario conserva su espaciado (la vista del mes son varias piezas sueltas)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Hover, la auditoría y lo que no hace ──');

ok(/future:\s*\{\s*hoverOnlyWhenSupported:\s*true\s*\}/.test(TAIL), '`hover:` solo donde hay un puntero de verdad: en el iPhone no se queda pegado (apartado 21)');
const conHover = [];
for (const d of ['src/views', 'src/components']) {
  for (const f of readdirSync(join(RAIZ, d))) {
    if (/\.(jsx|js)$/.test(f) && /[\s"'`]hover:[a-z]/.test(sinComentarios(leer(`${d}/${f}`)))) conHover.push(`${d}/${f}`);
  }
}
if (/[\s"'`]hover:[a-z]/.test(sinComentarios(APP))) conHover.push('src/App.jsx');
eq(conHover, [], 'ninguna pantalla depende del hover: ni una clase `hover:` en las vistas, los componentes ni App.jsx');
ok(/[\s"'`]hover:[a-z]/.test(' className="hover:bg-white/10"'), '…y el barrido sí reconoce una si aparece');
ok(AUDITORIA_F2.length >= 10 && AUDITORIA_F2.every((x) => x.que && x.hay && x.queda), `la auditoría de la navegación real (apartado 1): ${AUDITORIA_F2.length} piezas, cada una con lo que había y lo que queda`);
ok(NO_EN_F2.length >= 4 && NO_EN_F2.every((x) => x.que && x.porque), 'y lo que no hace la F2, con la fase que lo hace o el motivo');
ok(NO_EN_F2.some((x) => /pushState/.test(x.que)) && NO_EN_F2.some((x) => /F6/.test(x.porque)) && NO_EN_F2.some((x) => /F10/.test(x.porque)), '…el atrás del sistema (C-53), las ventanas (F6) y los filtros (F10)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. La documentación ──');

const SIS = leer('docs/MOTION_SYSTEM.md');
ok(/nav-vuelve/.test(SIS) && /nav-seccion/.test(SIS) && /CambioDeContenido/.test(SIS) && /tipoDeNavegacion/.test(SIS), 'MOTION_SYSTEM.md explica los tres movimientos de navegación y la transición de contenido');
ok(/\*\*F2\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F2');
ok(/C-53/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), 'C-53 está escrita');

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
