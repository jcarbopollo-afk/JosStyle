/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 15 — motion responsive, orientación, áreas seguras y adaptación multidispositivo

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f15.mjs

   Lo que se comprueba aquí: los cortes de verdad del proyecto (y que solo uno es de movimiento), las
   áreas seguras de los LADOS y de abajo en el CSS y en cada sitio que las necesitaba, la auditoría
   (limpia con el código de hoy y roja con cada fallo de antes), el teclado del iPhone, asentar lo que
   viaja al cambiar el diseño (con dobles del navegador), las capas que cambian de forma al girar, los
   bordes de la pantalla que son del sistema, la matriz de contextos y que una sola pieza escuche la
   ventana. Lo que necesita un navegador —la matriz de verdad, girar a mitad de una entrada, redimensionar a
   golpes, el teclado, el zoom al 200 %— está en la sección «MS F15» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ANCHO_COLUMNA, BREAKPOINTS_REALES, MOTION_BREAKPOINTS, capaSegunAncho, UMBRAL_TECLADO, escribeConTeclado, tecladoAbierto,
  LENGUAJE_POR_CONTEXTO, ENTRADAS_MOTION, CONTEXTOS_QUE_AMPLIAN, CONTEXTOS_FISICOS, COMBINACIONES_MATRIZ, DECISIONES_F15,
  REVISADO_Y_BIEN_F15, NO_EN_F15, CLASES_AREA_SEGURA, auditarResponsive, EJEMPLOS_MALOS_F15,
} from '../src/lib/responsiveMotion.js';
import { DISPOSITIVOS_DE_PRUEBA } from '../src/lib/movilFitness.js';
import {
  SISTEMAS_QUE_SE_ASIENTAN, asentarMovimiento, animarOrquestado, SISTEMAS_MOTION, enMarcha, olvidarTodo, PIEZAS_DE_MOVIMIENTO,
} from '../src/lib/orquestadorMotion.js';
import { PIEZAS_MOTION } from '../src/lib/rendimientoMotion.js';
import { UMBRALES_GESTO } from '../src/lib/umbralesGesto.js';
import { empiezaEnBordeDelSistema } from '../src/lib/gestosMotion.js';
import { cambioDeDiseno } from '../src/lib/layoutMotion.js';
import { HOJA } from '../src/lib/acabadoFitness.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}

const CSS = leer('src/index.css');
const CSS_LIMPIO = sinComentarios(CSS);
const APP = leer('src/App.jsx');
const UI = leer('src/components/ui.jsx');
const LIB = leer('src/lib/responsiveMotion.js');
const HOOK = leer('src/components/responsiveMotion.js');

/* Las vistas y los componentes, como los lee la auditoría. */
const ARCHIVOS = { 'src/App.jsx': APP };
['src/views', 'src/components'].forEach((d) => readdirSync(join(RAIZ, d)).forEach((f) => {
  const p = `${d}/${f}`;
  if (statSync(join(RAIZ, p)).isFile() && /\.(jsx?|mjs)$/.test(f)) ARCHIVOS[p] = leer(p);
}));
const TODO_SRC = {};
const recorrer = (d) => readdirSync(join(RAIZ, d)).forEach((f) => {
  const p = `${d}/${f}`;
  if (statSync(join(RAIZ, p)).isDirectory()) recorrer(p);
  else if (/\.(jsx?|mjs)$/.test(f)) TODO_SRC[p] = leer(p);
});
recorrer('src');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Los cortes de verdad (apartados 1 y 2) ──');
{
  const usados = new Set();
  Object.values(ARCHIVOS).forEach((src) => {
    const re = /className=\{?[`"']([^`"']*)[`"']/g;
    let m;
    while ((m = re.exec(sinComentarios(src)))) m[1].split(/\s+/).forEach((c) => { const k = /^((?:sm|md|lg|xl|2xl|min-\[\d+px\]|max-\[\d+px\])):/.exec(c); if (k) usados.add(k[1]); });
  });
  Object.values(TODO_SRC).forEach((src) => {
    const re = /['"`]([^'"`\n]*\b(?:sm|md|xl):[a-z][^'"`\n]*)['"`]/g;
    let m;
    while ((m = re.exec(sinComentarios(src)))) m[1].split(/\s+/).forEach((c) => { const k = /^(sm|md|xl):/.exec(c); if (k) usados.add(k[1]); });
  });
  const ids = BREAKPOINTS_REALES.map((b) => b.id);
  ok([...usados].every((u) => ids.includes(u)), `cada corte que usa el código está en \`BREAKPOINTS_REALES\` (${[...usados].join(', ')})`);
  ok(ids.every((id) => usados.has(id)), '…y cada uno de la lista se usa de verdad: no hay cortes de costumbre (apartado 2)');
  ok(BREAKPOINTS_REALES.every((b) => b.px > 0 && b.cambia && b.donde), '…con su ancho, qué cambia y dónde');
  ok(MOTION_BREAKPOINTS.length === 1 && MOTION_BREAKPOINTS[0].id === 'sm' && BREAKPOINTS_REALES.find((b) => b.id === 'sm').cambia === 'interaccion',
    '🚨 de los cuatro cortes, UNO es de movimiento: el que cambia la interacción (`sm`, la hoja pasa a ventana)');
  ok(BREAKPOINTS_REALES.filter((b) => b.cambia !== 'interaccion').length === 3, '…los otros tres cambian un texto o unas columnas, y el movimiento es el mismo (apartado 2)');
  ok(capaSegunAncho(390) === 'hoja' && capaSegunAncho(639) === 'hoja' && capaSegunAncho(640) === 'modal' && capaSegunAncho(1440) === 'modal',
    'la misma hoja: hoja por debajo de 640 px y ventana desde ahí');
  ok(/max-w-md mx-auto px-4 pantalla-segura/.test(APP) && ANCHO_COLUMNA === 448, 'la aplicación es UNA columna de `max-w-md` (448 px) en todos los tamaños');
  const medias = [...CSS_LIMPIO.matchAll(/@media\s*\(([^)]*)\)/g)].map((m) => m[1].trim());
  const deAncho = medias.filter((m) => /width/.test(m));
  ok(deAncho.length === 1 && deAncho[0] === `min-width: ${MOTION_BREAKPOINTS[0].px}px`,
    `\`index.css\` no tiene más media queries de ancho que la del corte de movimiento (${deAncho.join(' · ')})`);
  ok(!/@container|container-type/.test(CSS_LIMPIO), 'ni una container query (apartado 43): está dicho en `DECISIONES_F15`');
  ok(!/\b(lg|2xl):[a-z]/.test(Object.values(ARCHIVOS).map(sinComentarios).join('\n')), '…y `lg:` no lo usa ninguna vista (el `lg: 72` de los rangos es un tamaño, no un corte)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Las áreas seguras de los lados y de abajo (apartados 9-12, 17, 18) ──');
{
  const regla = (clase) => { const m = new RegExp(`\\.${clase}\\s*\\{([^}]*)\\}`).exec(CSS_LIMPIO); return m ? m[1] : ''; };
  ok(/left:\s*calc\(var\(--safe-left\)\s*\+\s*14px\)/.test(regla('accion-izquierda')) && /right:\s*calc\(var\(--safe-right\)\s*\+\s*14px\)/.test(regla('accion-derecha')),
    '🚨 `accion-izquierda` y `accion-derecha` salen del área segura de su lado más los 14 px de siempre');
  ok(/:root\s*\{[^}]*--safe-left:\s*env\(safe-area-inset-left,\s*0px\)[^}]*--safe-right:\s*env\(safe-area-inset-right,\s*0px\)/.test(CSS_LIMPIO),
    '…que existen desde la E3 F1 con su respaldo a 0: en vertical y en un ordenador, nada se mueve');
  const lupa = (APP.match(/<button[\s\S]{0,600}?aria-label="Buscar funciones o preguntar a la IA"/) || [''])[0];
  ok(/accion-izquierda/.test(lupa) && !/\bleft:\s*14/.test(lupa), '🚨 la lupa ya no lleva `left: 14` escrito: lleva `accion-izquierda`');
  const sug = (UI.match(/<div className=\{`accion-superior[\s\S]{0,200}/) || [''])[0];
  ok(/accion-derecha/.test(sug) && /accion-izquierda/.test(sug) && !/right:\s*14|left:\s*14/.test(sug), '🚨 …y el botón de sugerencias tampoco: su lado sale de una clase');
  ok(/padding-left:\s*var\(--safe-left\)/.test(regla('visor-seguro')) && /padding-right:\s*var\(--safe-right\)/.test(regla('visor-seguro')), '`visor-seguro` deja los dos lados');
  ok(/visor-seguro/.test(HOJA.visor), '…y es parte de `HOJA.visor`: la foto y el comparador de Fitness, en horizontal, dejan la isla');
  const scanner = leer('src/components/BarcodeScanner.jsx');
  ok(/visor-seguro/.test(scanner) && /paddingTop: 'calc\(var\(--safe-top\) \+ 1rem\)'/.test(scanner) && /aria-label="Cerrar escáner"/.test(scanner) && /toque-44[^"]*" style=\{\{ background: COLORS\.surface2 \}\} aria-label="Cerrar escáner"/.test(scanner),
    '🐛 el escáner de códigos: su cabecera empezaba a 16 px del borde —debajo de la batería— y su cerrar medía 28 px. Ahora empieza bajo la isla y llega a 44');
  ok(/padding-bottom:\s*calc\(var\(--safe-bottom\)\s*\+\s*0\.75rem\)/.test(regla('velo-pie-seguro')) && /@media \(min-width: 640px\)\s*\{\s*\.velo-pie-seguro\s*\{\s*padding-bottom:\s*0;/.test(CSS_LIMPIO),
    '🚨 `velo-pie-seguro`: una tarjeta flotante deja la barra de inicio y 12 px; desde `sm`, centrada, nada');
  ok(/velo-pie-seguro/.test(HOJA.veloConfirmacion) && !/\bpb-3\b/.test(HOJA.veloConfirmacion), '…las confirmaciones de Fitness la usan (`HOJA.veloConfirmacion`), sin el `pb-3` que dejaba sus botones sobre la barra de inicio');
  const armario = leer('src/views/ArmarioView.jsx');
  ok((armario.match(/items-end sm:items-center justify-center px-3 velo-pie-seguro/g) || []).length === 3 && !/pb-3 sm:pb-0/.test(armario),
    '…y las tres fichas del Armario también');
  ok(/max-height:\s*86vh;\s*max-height:\s*min\(86dvh,\s*calc\(100dvh - var\(--safe-top\) - var\(--safe-bottom\) - 1\.5rem\)\)/.test(regla('caja-cabe')),
    '🚨 `caja-cabe`: cabe entre las dos áreas seguras, con `vh` delante como respaldo y `dvh` después (en un `style` la segunda borraría a la primera)');
  ok((armario.match(/caja-cabe/g) || []).length === 3 && !/maxHeight: '86vh'/.test(armario), '…y el Armario ya no escribe `86vh` en sus `style`: su cabecera se salía por arriba');
  ['src/components/ColorPicker.jsx', 'src/components/TemaBuilder.jsx'].forEach((p) => {
    const s = leer(p);
    ok(/paddingBottom: 'calc\(var\(--safe-bottom\) \+ 1\.75rem\)'/.test(s) && /hoja-movil/.test(s) && !/max-h-\[90vh\]/.test(s),
      `${p.split('/').pop()}: la hoja deja la barra de inicio (eran 28 px fijos) y su tope es \`hoja-movil\` (\`dvh\`), no \`90vh\``);
  });
  ok(/paddingBottom: 'calc\(var\(--safe-bottom\) \+ 1rem\)'/.test(leer('src/views/EstiloHombreView.jsx')), 'la ficha de un apartado de Imagen personal deja la barra de inicio');
  ok(/padding-top:\s*max\(var\(--velo-arriba,\s*4rem\),\s*calc\(var\(--safe-top\)\s*\+\s*1rem\)\)/.test(regla('velo-arriba')),
    '🚨 `velo-arriba`: el margen de siempre, o el área segura y un poco más si es mayor (nunca a dos píxeles de la hora)');
  ok(/velo-arriba px-4" style=\{\{ background: CAPAS\.veloHoja, '--velo-arriba': '5rem' \}\}/.test(UI) && /velo-arriba px-4/.test(leer('src/views/CalendarView.jsx')),
    '…en el buscador (sus 80 px) y en el día del Calendario (sus 64)');
  ok(/max-height:\s*calc\(100vh[^;]*;\s*max-height:\s*calc\(100dvh - var\(--safe-top\) - var\(--safe-bottom\) - 80px\);\s*overflow-y:\s*auto;\s*overscroll-behavior:\s*contain/.test(regla('flotante-cabe')),
    '`flotante-cabe`: un panel que cuelga de un botón de arriba cabe en lo que se ve y desplaza dentro');
  ok(/menu-entra flotante-cabe/.test(UI) && /aria-label="Cerrar sugerencias" className="toque-44/.test(UI), '…el de sugerencias lo lleva, y su cerrar (12 px de icono) llega a 44 de toque');
  ok(CLASES_AREA_SEGURA.every((c) => new RegExp(`\\.${c}\\s*\\{`).test(CSS_LIMPIO)), `las ${CLASES_AREA_SEGURA.length} clases de área segura existen en el CSS`);
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. La auditoría: limpia hoy, roja con cada fallo (apartados 10, 11 y 53) ──');
{
  const r = auditarResponsive({ archivos: ARCHIVOS, css: CSS });
  ok(r.ok, `🚨 las ${Object.keys(ARCHIVOS).length} vistas y componentes, y \`App.jsx\`: ni un lado sin área segura, ni una hoja pegada a la barra de inicio, ni una caja alta en \`vh\`, ni un corte desconocido (${JSON.stringify(r.problemas.slice(0, 4))})`);
  const reglas = [...new Set(EJEMPLOS_MALOS_F15.map((e) => e.regla))];
  ok(reglas.length === 5 && EJEMPLOS_MALOS_F15.every((e) => auditarResponsive({ archivos: { 'x.jsx': e.src }, css: CSS }).problemas.some((p) => p.regla === e.regla)),
    `cada regla caza su ejemplo malo (${reglas.join(', ')}): una regla que no puede fallar no sirve (EH F42)`);
  /* Los fallos de antes de la fase, escritos como estaban: la auditoría los habría cazado. */
  const antes = {
    'lupa.jsx': '<button onClick={a} className="accion-superior toque-44 fixed z-flotante w-9 h-9" style={{ left: 14, background: x }} aria-label="Buscar" />',
    'sug.jsx': "<div className=\"accion-superior fixed z-flotante\" style={lado === 'derecha' ? { right: 14 } : { left: 14 }}>",
    'color.jsx': '<div className="fixed inset-0 z-capa flex items-end justify-center" onClick={c}>\n  <div ref={caja} className="w-full max-w-md rounded-t-3xl p-4" style={{ background: s, paddingBottom: 28 }}>x</div>\n</div>',
    'armario.jsx': '<div className="fixed inset-0 z-capa flex items-end sm:items-center justify-center px-3 pb-3 sm:pb-0" onClick={c}>\n  <div ref={caja} className="w-full max-w-md rounded-3xl" style={{ background: s, maxHeight: \'86vh\' }}>x</div>\n</div>',
  };
  const rAntes = auditarResponsive({ archivos: antes, css: CSS }).problemas;
  ok(['lupa.jsx', 'sug.jsx'].every((f) => rAntes.some((p) => p.archivo === f && p.regla === 'lado_sin_area_segura'))
    && ['color.jsx', 'armario.jsx'].every((f) => rAntes.some((p) => p.archivo === f && p.regla === 'hoja_sin_pie_seguro'))
    && rAntes.some((p) => p.archivo === 'armario.jsx' && p.regla === 'caja_alta_en_vh'),
  '🚨 …y el código de ANTES de esta fase sale rojo: la lupa, las sugerencias, el selector de color y el Armario');
  const bien = {
    'a.jsx': '<button className="accion-superior fixed z-flotante accion-izquierda w-9" />',
    'b.jsx': '<div className="fixed left-0 right-0 z-aviso flex" style={{ bottom: \'calc(var(--safe-bottom) + 5.5rem)\' }} />',
    'c.jsx': '<div className="fixed inset-0 flex items-end velo-pie-seguro">\n  <div className="rounded-3xl">x</div>\n</div>',
    'd.jsx': '<div className="fixed inset-0 flex items-end">\n  <div className={HOJA.caja} style={{ paddingBottom: HOJA.abajo }}>x</div>\n</div>',
    'e.jsx': '<div style={{ maxHeight: \'40vh\', overflowY: \'auto\' }} />',
  };
  const rBien = auditarResponsive({ archivos: bien, css: CSS });
  ok(rBien.ok, `…y lo que está bien no lo marca: una clase de lado, una banda de borde a borde, una tarjeta con su pie, una hoja de Fitness y una lista interior de un tercio de pantalla (${JSON.stringify(rBien.problemas)})`);
  ok(auditarResponsive({ archivos: { 'y.jsx': '<div className="visor-seguro" />' }, css: '' }).problemas.some((p) => p.regla === 'clase_sin_regla'),
    'una clase de área segura que el CSS no define también sale');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. El teclado del iPhone (apartados 13-16) ──');
{
  const campo = (tag, extra = {}) => ({ nodeType: 1, tagName: tag, readOnly: false, disabled: false, getAttribute: () => null, ...extra });
  ok(escribeConTeclado(campo('INPUT', { type: 'text' })) && escribeConTeclado(campo('INPUT', { type: 'number' })) && escribeConTeclado(campo('INPUT', { type: 'search' })) && escribeConTeclado(campo('TEXTAREA')),
    'un campo de texto, de número, de búsqueda o un área de texto sacan el teclado');
  ok(!escribeConTeclado(campo('INPUT', { type: 'checkbox' })) && !escribeConTeclado(campo('INPUT', { type: 'range' })) && !escribeConTeclado(campo('BUTTON')) && !escribeConTeclado(null),
    '…una casilla, un deslizador o un botón, no');
  ok(!escribeConTeclado(campo('INPUT', { type: 'text', readOnly: true })) && !escribeConTeclado(campo('TEXTAREA', { disabled: true })) && escribeConTeclado({ nodeType: 1, tagName: 'DIV', isContentEditable: true }),
    '…uno de solo lectura o apagado, tampoco; un `contenteditable`, sí');
  const texto = campo('INPUT', { type: 'text' });
  ok(tecladoAbierto({ altoPagina: 844, altoVisible: 500, enfocado: texto }), '🚨 un campo enfocado y lo que se ve 344 px más bajo que la página: el teclado está abierto');
  ok(!tecladoAbierto({ altoPagina: 844, altoVisible: 760, enfocado: texto }), '…84 px menos es la barra de Safari, no el teclado');
  ok(!tecladoAbierto({ altoPagina: 844, altoVisible: 500, escala: 1.6, enfocado: texto }), '…con un pellizco de zoom, lo que encoge es el zoom');
  ok(!tecladoAbierto({ altoPagina: 844, altoVisible: 500, enfocado: campo('BUTTON') }) && !tecladoAbierto({ altoPagina: 844, altoVisible: 500 }), '…y sin un campo de escribir enfocado, no');
  ok(!tecladoAbierto({ altoPagina: NaN, altoVisible: 500, enfocado: texto }) && !tecladoAbierto({ altoPagina: 844, altoVisible: 0, enfocado: texto }), '…ni con medidas imposibles');
  ok(UMBRAL_TECLADO === 150, `el umbral (${UMBRAL_TECLADO} px) queda entre la barra de Safari (< 100) y un teclado (> 250)`);
  const reglaTeclado = /html\[data-teclado='abierto'\] \.nav-segura\s*\{([^}]*)\}/.exec(CSS_LIMPIO);
  ok(reglaTeclado && /visibility:\s*hidden/.test(reglaTeclado[1]) && !/transition|animation|transform|display/.test(reglaTeclado[1]),
    '🚨 con el teclado abierto la barra de abajo se aparta con `visibility`: al momento, sin animarlo y sin mover ni un píxel de nada (apartado 52)');
  ok(/\.nav-segura\s*\{[^}]*padding-bottom:\s*var\(--safe-bottom\)/.test(CSS_LIMPIO), '…y sigue dejando su área segura cuando se ve');
  const h = sinComentarios(HOOK);
  ok(/visualViewport/.test(h) && /raiz\.clientHeight/.test(h) && /document\.activeElement/.test(h) && /vv\.scale/.test(h),
    'el hook lee lo que se ve (`visualViewport`), la página, el foco y la escala');
  ok(/setAttribute\('data-teclado', 'abierto'\)/.test(h) && /removeAttribute\('data-teclado'\)/.test(h), '…pone y quita `data-teclado` en la raíz, y al desmontarse la deja limpia');
  ok(/addEventListener\('focusin'/.test(h) && /addEventListener\('focusout'/.test(h) && /vv\.addEventListener\('resize'/.test(h), '…y se entera del foco y del tamaño de lo que se ve');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Girar y redimensionar: lo que viaja se asienta (apartados 19, 20, 34, 42 y 52) ──');
{
  function animacionDoble(fotogramas, opciones, { finishFalla = false } = {}) {
    let resolver; let rechazar;
    const a = {
      id: opciones.id || '', playState: 'running', fotogramas, opciones,
      effect: { getKeyframes: () => fotogramas, getTiming: () => ({ duration: opciones.duration }) },
      finished: new Promise((r, j) => { resolver = r; rechazar = j; }),
      cancel() { if (this.playState === 'idle' || this.playState === 'finished') return; this.playState = 'idle'; rechazar(new Error('cancelada')); },
      finish() { if (finishFalla) throw new Error('infinita'); if (this.playState === 'idle' || this.playState === 'finished') return; this.playState = 'finished'; resolver(this); },
    };
    a.finished.catch(() => {});
    return a;
  }
  const el = (cfg) => ({ style: {}, todas: [], animate(f, o = {}) { const a = animacionDoble(f, o, cfg); this.todas.push(a); return a; }, getAnimations() { return this.todas.filter((a) => a.playState === 'running'); } });
  olvidarTodo();
  const ids = SISTEMAS_MOTION.map((s) => s.id);
  ok(SISTEMAS_QUE_SE_ASIENTAN.every((s) => ids.includes(s)), `los sistemas que se asientan existen en el orquestador (${SISTEMAS_QUE_SE_ASIENTAN.join(', ')})`);
  ok(!SISTEMAS_QUE_SE_ASIENTAN.some((s) => ['micro', 'datos', 'estados', 'decorativa', 'gestos', 'scroll'].includes(s)),
    '…y no está ninguno que no dependa de la geometría: un color, una cifra, un toque, un bucle o el dedo siguen a lo suyo');
  const capa = animarOrquestado(el(), [{ transform: 'translateY(300px)' }, { transform: 'none' }], { duration: 280 }, { sistema: 'profundidad' });
  const viaje = animarOrquestado(el(), [{ transform: 'translate(10px, 200px) scale(0.4)' }, { transform: 'none' }], { duration: 340 }, { sistema: 'continuidad' });
  const flip = animarOrquestado(el(), [{ transform: 'translateY(64px)' }, { transform: 'none' }], { duration: 220 }, { sistema: 'layout' });
  const toque = animarOrquestado(el(), [{ opacity: 0.6 }, { opacity: 1 }], { duration: 120 }, { sistema: 'micro' });
  const cifra = animarOrquestado(el(), [{ opacity: 0 }, { opacity: 1 }], { duration: 220 }, { sistema: 'datos' });
  const bucle = animarOrquestado(el({ finishFalla: true }), [{ transform: 'translateX(0)' }, { transform: 'translateX(4px)' }], { duration: 900, iterations: Infinity }, { sistema: 'motor' });
  ok(enMarcha() === 6, 'seis animaciones en marcha antes de girar');
  const n = asentarMovimiento('cambio_de_diseno');
  ok(n === 4 && capa.playState === 'finished' && viaje.playState === 'finished' && flip.playState === 'finished',
    `🚨 al girar, la capa que subía, la tarjeta que crecía y la fila que se recolocaba SALTAN A SU FINAL —el del DOM—: no cruzan el diseño nuevo con las medidas del viejo (${n})`);
  ok(toque.playState === 'running' && cifra.playState === 'running', '…el toque y la cifra siguen a lo suyo: no dependen de la geometría');
  ok(bucle.playState === 'idle', '…y una que no se puede terminar (infinita) se cancela: nunca queda a medias');
  ok(enMarcha() === 2 && asentarMovimiento('cambio_de_diseno') === 0, '…en marcha solo quedan las dos que no se asientan, y asentar otra vez no hace nada');
  olvidarTodo();
  const h = sinComentarios(HOOK);
  ok(/if \(cambioDeDiseno\(ancho, ahora\)\) \{\s*ancho = ahora;\s*asentarMovimiento\('cambio_de_diseno'\);\s*reevaluarCapas\(\);/.test(h),
    '🚨 el hook asienta solo si cambia el ANCHO (`cambioDeDiseno`, el de la F10): la barra de Safari que aparece al desplazar cambia el alto a cada rato y no asienta nada');
  ok(cambioDeDiseno(390, 844) && !cambioDeDiseno(390, 390) && !cambioDeDiseno(390, 391), '…girar es otro diseño; un píxel no');
  ok(/requestAnimationFrame\(revisar\)/.test(h) && /if \(!pendiente\)/.test(h), 'una ráfaga de eventos —redimensionar arrastrando— es UNA lectura por fotograma (apartado 42)');
  ok(!/useState|setState|dispatch\(/.test(h), '…y ni un estado de React: girar no repinta la aplicación');
  const capas = sinComentarios(leer('src/components/capasMotion.js'));
  ok(/export function reevaluarCapas\(\)/.test(capas) && /tipoDeCapa\(\{ alignItems: cs\.alignItems, overflowY: cs\.overflowY, fondo: cs\.backgroundColor \}\)/.test(capas.slice(capas.indexOf('export function reevaluarCapas'))),
    '🚨 `reevaluarCapas` vuelve a leer el tipo de cada capa abierta del estilo calculado: la hoja que pasa a ventana al girar sale como ventana');
  ok(/MARCA_SALIENDO\] !== undefined\) return;/.test(capas.slice(capas.indexOf('export function reevaluarCapas'))), '…y no toca la copia de una que ya se va');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Los gestos y los bordes del sistema (apartados 47 y 48) ──');
{
  ok(UMBRALES_GESTO.bordeSistema === 20, 'el borde del sistema es un umbral más de `UMBRALES_GESTO`: 20 px por lado');
  ok(empiezaEnBordeDelSistema({ x: 10, ancho: 390 }) && empiezaEnBordeDelSistema({ x: 380, ancho: 390 }) && empiezaEnBordeDelSistema({ x: 5, ancho: 390, tipo: 'pen' }),
    '🚨 un dedo o un lápiz apoyados en un lado dejan el gesto al sistema («atrás» en Safari)');
  ok(!empiezaEnBordeDelSistema({ x: 195, ancho: 390 }) && !empiezaEnBordeDelSistema({ x: 20, ancho: 390 }), '…en el resto de la pantalla, el gesto es de la aplicación');
  ok(!empiezaEnBordeDelSistema({ x: 2, ancho: 1280, tipo: 'mouse' }), '…y un ratón nunca: no hay gesto del sistema que proteger');
  ok(!empiezaEnBordeDelSistema({ x: 'a', ancho: 390 }) && !empiezaEnBordeDelSistema({ x: 10, ancho: 0 }), '…ni con medidas imposibles');
  const g = sinComentarios(leer('src/components/gestosMotion.jsx'));
  const abajo = g.slice(g.indexOf('export function useDeslizarParaCambiar'));
  ok(abajo.indexOf('empiezaEnBordeDelSistema(') > 0 && abajo.indexOf('empiezaEnBordeDelSistema(') < abajo.indexOf('tomarControl('),
    '…`useDeslizarParaCambiar` lo mira ANTES de tomar el control: desde el borde, la tarjeta ni se entera');
  ok(DECISIONES_F15.some((d) => d.apartados.includes(25) && /distanciaCambio/.test(d.decision) && /448/.test(d.decision)),
    'el umbral de cambiar de ejercicio (56 px) se queda fijo, con su motivo: la columna nunca pasa de 448 px (apartado 25)');
  ok(UMBRALES_GESTO.distanciaCambio / ANCHO_COLUMNA > 0.1 && UMBRALES_GESTO.distanciaCambio / (375 - 32) < 0.2, '…y es entre el 10 y el 20 % del ancho de la tarjeta en cualquier pantalla');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. La matriz y cada contexto (apartados 3-8, 40 y 49) ──');
{
  ok(CONTEXTOS_FISICOS.length === DISPOSITIVOS_DE_PRUEBA.length + CONTEXTOS_QUE_AMPLIAN.length,
    '🚨 la matriz AMPLÍA los siete tamaños de Fitness (`DISPOSITIVOS_DE_PRUEBA`, FIT F38): no es una segunda lista');
  ok(DISPOSITIVOS_DE_PRUEBA.every((d) => CONTEXTOS_FISICOS.some((c) => c.id === d.id && c.ancho === d.ancho && c.alto === d.alto)), '…cada uno de aquéllos está, con sus medidas');
  ok(new Set(CONTEXTOS_FISICOS.map((c) => c.id)).size === CONTEXTOS_FISICOS.length, '…y ningún id se repite');
  const hay = (f) => CONTEXTOS_FISICOS.some(f);
  ok(hay((c) => c.ancho < 640 && c.alto > c.ancho) && hay((c) => c.ancho > c.alto && c.alto <= 400) && hay((c) => c.ancho >= 640 && c.ancho < 900 && c.alto > c.ancho)
    && hay((c) => c.ancho >= 1000 && c.ancho < 1100 && c.ancho > c.alto && c.entrada === 'touch') && hay((c) => c.ancho < 1000 && c.entrada === 'mouse' && c.ancho > c.alto) && hay((c) => c.ancho >= 1440),
  'están los seis del apartado 49: móvil en vertical y en horizontal, tablet en vertical y en horizontal, escritorio pequeño y grande');
  ok(hay((c) => c.ancho === 640 && c.alto === 450), '…y el zoom al 200 % (un escritorio de 1280 × 900 es una ventana de 640 × 450)');
  ok(CONTEXTOS_FISICOS.every((c) => c.capa === capaSegunAncho(c.ancho) && ['touch', 'mouse'].includes(c.entrada)), '…cada uno con la forma que tiene ahí una hoja y su entrada');
  ok(COMBINACIONES_MATRIZ.includes('reducido') && COMBINACIONES_MATRIZ.includes('teclado_abierto') && COMBINACIONES_MATRIZ.includes('teclado_cerrado'), '…y lo que se combina con todos: «Reducir movimiento» y el teclado');
  ok(LENGUAJE_POR_CONTEXTO.length === 3 && LENGUAJE_POR_CONTEXTO.every((l) => l.prioriza && l.cambia), 'el móvil, la tablet y el escritorio dicen qué priorizan y qué cambia de verdad (apartados 3-5)');
  ok(/mini|gigante|pequeño/.test(LENGUAJE_POR_CONTEXTO.find((l) => l.contexto === 'Tablet').cambia), '…la tablet, ni «móvil gigante» ni «escritorio pequeño»');
  ok(['touch', 'mouse', 'trackpad', 'keyboard', 'stylus'].every((e) => ENTRADAS_MOTION.some((x) => x.entrada === e)), 'las cinco entradas del apartado 6, cada una con cómo se nota');
  const tw = leer('tailwind.config.js');
  ok(/hoverOnlyWhenSupported:\s*true/.test(tw), '🚨 el hover solo existe con un puntero que lo tiene (MS F2): ninguna función depende de él (apartado 7)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Una sola escucha, ni densidad, ni intervalos (apartados 41, 45 y 46) ──');
{
  const h = sinComentarios(HOOK);
  const add = (h.match(/addEventListener\(/g) || []).length;
  const rem = (h.match(/removeEventListener\(/g) || []).length;
  ok(add === 5 && rem === 5 && /cancelAnimationFrame\(pendiente\)/.test(h), `el hook escucha cinco cosas y las suelta las cinco al desmontarse, también el fotograma pendiente (${add}/${rem})`);
  ok((h.match(/passive: true/g) || []).length === 5, '…todas pasivas: ninguna puede retrasar el scroll');
  const vvEn = Object.entries(TODO_SRC).filter(([p, s]) => /visualViewport|orientationchange/.test(sinComentarios(s))).map(([p]) => p);
  ok(vvEn.length === 1 && vvEn[0] === 'src/components/responsiveMotion.js', `🚨 nadie más escucha el giro ni lo que se ve: una sola pieza para toda la aplicación (${vvEn.join(', ')}; apartado 41)`);
  const montaje = APP.indexOf('useContextoFisico();');
  const primerReturn = APP.search(/\n {2}if \([^)]*\) return /);
  ok(montaje > 0 && (APP.match(/useContextoFisico\(\);/g) || []).length === 1 && (primerReturn < 0 || montaje < primerReturn),
    'se monta UNA vez, en `App.jsx`, antes de cualquier `return` (regla 4)');
  ok(/import \{ useContextoFisico \} from '\.\/components\/responsiveMotion';/.test(APP), '…importado de su sitio');
  const dpr = Object.entries(TODO_SRC).filter(([p, s]) => p !== 'src/lib/responsiveMotion.js' && /devicePixelRatio/.test(sinComentarios(s))).map(([p]) => p);
  ok(dpr.length === 0, `ni una línea del código lee \`devicePixelRatio\`: el movimiento se mide en píxeles CSS (apartado 45${dpr.length ? `: ${dpr.join(', ')}` : ''})`);
  ok(!/\bsetInterval\s*\(/.test(sinComentarios(HOOK)) && !/\bsetInterval\s*\(/.test(sinComentarios(LIB)), '…y ni un `setInterval`: lo que se mueve va con el tiempo real del fotograma (apartado 46)');
  ok(PIEZAS_DE_MOVIMIENTO.includes('src/components/responsiveMotion.js') && PIEZAS_MOTION.includes('src/components/responsiveMotion.js') && PIEZAS_MOTION.includes('src/lib/responsiveMotion.js'),
    'el hook entra en las piezas que vigilan la limpieza (F11) y el coste (F13)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Lo que cambia, lo que no, el recorrido y la documentación (apartados 21-27, 50-56) ──');
{
  [21, 22, 23, 24, 25, 26, 27, 35, 36, 38, 39, 43, 44, 45, 46].forEach((a) => {
    if (!DECISIONES_F15.some((d) => d.apartados.includes(a))) ok(false, `el apartado ${a} tiene su decisión`);
  });
  ok(DECISIONES_F15.every((d) => d.que && d.decision && d.apartados.length), `las ${DECISIONES_F15.length} decisiones de lo que cambia y lo que no, cada una con su apartado y su motivo`);
  ok(REVISADO_Y_BIEN_F15.length >= 6 && REVISADO_Y_BIEN_F15.every((r) => r.que && r.porque), 'lo que se miró y estaba bien, para no volver a barrerlo');
  ok(NO_EN_F15.length >= 4 && NO_EN_F15.every((r) => r.que && r.porque) && NO_EN_F15.some((n) => /C-32/.test(n.porque)), 'lo que no se hace, con su motivo (el zoom al enfocar es la C-32 de Josué)');
  const recorrido = leer('scripts/test-app-real.mjs');
  const sec = recorrido.slice(recorrido.indexOf('── MS F15'));
  ok(/── MS F15 · Responsive/.test(recorrido) && /CONTEXTOS_FISICOS/.test(sec) && /capa-giro-ms15/.test(sec) && /data-teclado/.test(sec) && /areaSegura_ms15\(\{ top: 0, bottom: 21, left: 47, right: 47 \}\)/.test(sec),
    'el recorrido mide en Chromium las áreas seguras, la matriz entera, girar a mitad de una entrada, redimensionar a golpes y el teclado');
  const SIS = leer('docs/MOTION_SYSTEM.md');
  ok(/auditarResponsive/.test(SIS) && /asentarMovimiento/.test(SIS) && /data-teclado/.test(SIS) && /bordeSistema/.test(SIS) && /CONTEXTOS_FISICOS/.test(SIS),
    'MOTION_SYSTEM.md explica el movimiento responsive, la orientación, las áreas seguras, el teclado y los gestos (apartado 55)');
  ok(/¿Esta diferencia existe porque cambia realmente la interacción/.test(SIS), '…con la regla permanente del apartado 56');
  ok(/\*\*F15\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F15');
  ok(!/framer-motion|react-spring|gsap|animejs|popmotion|motion-one/.test(leer('package.json')), 'ni una librería de animación en el paquete');
}

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
