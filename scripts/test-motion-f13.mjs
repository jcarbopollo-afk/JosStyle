/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 13 — rendimiento extremo, GPU, frame budget y optimización

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f13.mjs

   Lo que se comprueba aquí es la REFERENCIA que no deja empeorar el rendimiento (apartado 47): qué
   cuesta cada propiedad, que index.css no anime nada caro sin decir por qué, que ningún desenfoque se
   anime, que no haya `will-change` ni escuchadores de scroll que no sean pasivos, los tres arreglos de la
   fase (la sombra que se funde, el fundido que lee antes de escribir, los orígenes que caducan) y el
   monitor de fotogramas (que se para con la pestaña escondida). Lo que necesita un navegador —contar los
   pintados de una pulsación, los recálculos de estilo de un scroll, la memoria tras tres rondas— está en
   la sección «MS F13» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  PRESUPUESTO_FOTOGRAMA, UMBRAL_TAREA_LARGA_MS, presupuestoDe, hzProbable, resumenDeFotogramas,
  COSTE_PROPIEDAD, costeDe, propiedadesDeTransicion, keyframesConPropiedades, animacionesDelCss,
  COSTES_DECLARADOS, costeDeclarado, PIEZAS_MOTION, REGLAS_COSTE, problemasDeFuente, problemasDeCss, auditarCosteMotion,
  CALIDADES_MOTION, calidadDeModo, REBAJAS_AUTOMATICAS, TOPE_MUESTRAS, crearMonitorDeFotogramas, exponerMonitor,
  CINCO_CRITERIOS, HALLAZGOS_F13, REVISADO_Y_BIEN_F13, NO_EN_F13,
} from '../src/lib/rendimientoMotion.js';
import { forzarDepuracion } from '../src/lib/orquestadorMotion.js';
import { registrarOrigen, cuantosOrigenes, olvidarOrigenes, tomarOrigen, TTL_ORIGEN_MS } from '../src/lib/continuidad.js';
import { MODOS_MOTION } from '../src/lib/motion.js';
import { ADAPTACION } from '../src/lib/accesibilidadMotion.js';
import { entradaMotion } from '../src/lib/motionMapa.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}

const CSS = leer('src/index.css');
const FUENTES = {};
const recorrer = (dir) => readdirSync(join(RAIZ, dir)).forEach((f) => {
  const p = `${dir}/${f}`;
  if (statSync(join(RAIZ, p)).isDirectory()) recorrer(p);
  else if (/\.(jsx?|mjs)$/.test(f)) FUENTES[p] = leer(p);
});
recorrer('src');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. El presupuesto de un fotograma (apartados 3 y 4) ──');
ok(Math.abs(PRESUPUESTO_FOTOGRAMA[60] - 16.67) < 0.01 && Math.abs(PRESUPUESTO_FOTOGRAMA[120] - 8.33) < 0.01, '60 Hz ≈ 16,67 ms y 120 Hz ≈ 8,33 ms por fotograma');
ok(presupuestoDe(120) < presupuestoDe(60) && UMBRAL_TAREA_LARGA_MS === 50, 'en una pantalla de 120 Hz el presupuesto es la mitad, y una tarea larga pasa de 50 ms');
{
  const fluido = resumenDeFotogramas(Array(30).fill(1000 / 60));
  ok(fluido.fotogramas === 30 && fluido.fps === 60 && fluido.perdidos === 0 && fluido.largos === 0 && fluido.enPresupuesto === 1, `treinta fotogramas a tiempo: 60 FPS, ninguno perdido (${JSON.stringify(fluido)})`);
  const tirones = resumenDeFotogramas([16.7, 16.7, 50, 16.7, 100]);
  ok(tirones.perdidos === 2 + 5 && tirones.largos === 1 && tirones.peorMs === 100, `un intervalo de tres presupuestos son DOS perdidos, y uno de 100 ms es además una tarea larga (${JSON.stringify(tirones)})`);
  const vacio = resumenDeFotogramas([]);
  ok(vacio.fotogramas === 0 && vacio.fps === null && vacio.mediaMs === null, 'sin fotogramas, sin cifras: `null`, nunca 0 FPS (EH F23)');
  ok(resumenDeFotogramas(['x', -3, null, 16.7]).fotogramas === 1, 'lo que no es un intervalo de verdad no cuenta');
  const a120 = resumenDeFotogramas(Array(20).fill(1000 / 60), { hz: 120 });
  ok(a120.perdidos === 20, '🚨 a 120 Hz, ir a 60 FPS es perder uno de cada dos (apartado 3: *"no asumir que 60 FPS es suficiente"*)');
  ok(hzProbable(Array(10).fill(8.3)) === 120 && hzProbable(Array(10).fill(16.7)) === 60 && hzProbable([]) === 60, 'la frecuencia se deduce de la mediana de los intervalos');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Lo que cuesta cada propiedad (apartados 9-17) ──');
ok(costeDe('transform') === 'composicion' && costeDe('opacity') === 'composicion', 'transform y opacity solo componen');
ok(costeDe('box-shadow') === 'pintado' && costeDe('filter') === 'pintado' && costeDe('backdrop-filter') === 'pintado' && costeDe('border-top-color') === 'pintado', 'una sombra, un filtro, un desenfoque o un color de borde repintan');
ok(costeDe('width') === 'diseno' && costeDe('margin-top') === 'diseno' && costeDe('grid-template-rows') === 'diseno' && costeDe('padding') === 'diseno', 'el ancho, un margen, las filas de una rejilla o el relleno recolocan');
ok(costeDe('all') === 'todo' && costeDe('') === 'desconocido', '`all` es lo peor: anima cualquier cosa que cambie');
ok(COSTE_PROPIEDAD.composicion.length >= 2 && COSTE_PROPIEDAD.pintado.length >= 10 && COSTE_PROPIEDAD.diseno.length >= 10, 'el catálogo de las tres clases');
ok(JSON.stringify(propiedadesDeTransicion('transform var(--motion-dur-fast) var(--ease-premium), opacity 1s')) === '["transform","opacity"]', 'de una transición se leen las propiedades que nombra');
ok(JSON.stringify(propiedadesDeTransicion('var(--motion-dur-fast) var(--ease-premium)')) === '["all"]' && JSON.stringify(propiedadesDeTransicion('none !important')) === '[]', 'una transición sin propiedad es `all`; `none` no anima nada');
{
  const kf = keyframesConPropiedades('@keyframes a { from { opacity: 0; transform: x; } to { opacity: 1; } } @keyframes b { 50% { filter: blur(4px); } }');
  ok(kf.a && kf.a.propiedades.join() === 'opacity,transform' && kf.b && /blur/.test(kf.b.valores.filter[0]), 'de unos fotogramas se leen sus propiedades y sus valores');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Lo que anima index.css, y lo caro, declarado (apartados 11-17 y 47) ──');
const ANIM = animacionesDelCss(CSS);
const porCoste = ANIM.reduce((acc, a) => { acc[a.coste] = (acc[a.coste] || 0) + 1; return acc; }, {});
ok(ANIM.length >= 100 && porCoste.composicion > (porCoste.pintado || 0) + (porCoste.diseno || 0), `index.css anima sobre todo lo que solo compone (${JSON.stringify(porCoste)})`);
ok(!ANIM.some((a) => a.coste === 'todo'), '🚨 ni un `transition: all` en index.css');
const PROB_CSS = problemasDeCss(CSS);
ok(PROB_CSS.length === 0, `🚨 nada caro sin declarar: cada animación de pintado o de diseño tiene su motivo en \`COSTES_DECLARADOS\`${PROB_CSS.length ? ` — ${PROB_CSS.map((p) => `${p.regla} ${p.propiedad} ${p.selector}:${p.linea}`).join(' · ')}` : ''}`);
ok(COSTES_DECLARADOS.every((d) => d.selector instanceof RegExp && d.propiedad && d.motivo && d.motivo.length > 40), 'cada coste declarado dice qué regla, qué propiedad y por qué es el justo');
{
  const sinUso = COSTES_DECLARADOS.filter((d) => !ANIM.some((a) => a.propiedad === d.propiedad && d.selector.test(a.selector)));
  ok(sinUso.length === 0, `y ninguna declaración sobra: cada una cubre una animación que existe${sinUso.length ? ` — sobran: ${sinUso.map((d) => d.propiedad).join(', ')}` : ''}`);
}
ok(!ANIM.some((a) => /backdrop-filter/.test(a.propiedad)), '🚨 ningún desenfoque se anima: el cristal es material fijo (apartados 13 y 14)');
ok(costeDeclarado({ selector: '.plegable', propiedad: 'grid-template-rows' }) && !costeDeclarado({ selector: '.otra', propiedad: 'grid-template-rows' }), 'una declaración vale para SU regla, no para cualquiera');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Los arreglos de la fase (apartados 6, 7, 15, 21 y 37) ──');
{
  const hub = ANIM.filter((a) => /hub-card/.test(a.selector));
  ok(hub.length > 0 && !hub.some((a) => a.propiedad === 'box-shadow'), `🚨 ninguna regla de las tarjetas de la portada anima \`box-shadow\` (antes: la pulsación y la expansión, 24 y 64 pintados medidos)`);
  const kfExp = keyframesConPropiedades(CSS).hubCardExpand;
  ok(kfExp && kfExp.propiedades.includes('transform') && !kfExp.propiedades.includes('box-shadow'), 'la expansión crece (transform y brillo) sin animar la sombra');
  const limpio = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  ok(/button\.hub-card:not\(\[class\*='active:scale'\]\)::after\s*\{\s*box-shadow:\s*var\(--sombra-elevada\);/.test(limpio)
    && /button\.hub-card:not\(\[class\*='active:scale'\]\)::before\s*\{\s*box-shadow:\s*var\(--sombra-maxima\);/.test(limpio),
    '🔓 la sombra levantada y la máxima están ya pintadas en dos pseudo-elementos…');
  ok(/::after\s*\{\s*content: '';[^}]*inset: -1px;[^}]*z-index: var\(--z-fondo\);[^}]*opacity: 0;[^}]*transition: opacity var\(--motion-dur-fast\)/.test(limpio.replace(/::before,\s*button\.hub-card:not\(\[class\*='active:scale'\]\)/, '')),
    '…empiezan fuera del borde, detrás del contenido, invisibles, y lo único que se anima es su opacidad');
  ok(/:active:not\(:disabled\)::after\s*\{\s*opacity: 1;/.test(limpio) && /\.hub-card-expanding::before\s*\{\s*opacity: 1;/.test(limpio) && !/\.hub-card-expanding::after\s*\{\s*opacity: 1/.test(limpio),
    'al pulsar se ve la levantada; al expandirse, la levantada se va mientras llega la máxima (lo que hacía la interpolación)');
  ok(/button\.hub-card:not\(\[class\*='active:scale'\]\)\s*\{\s*position: relative;\s*isolation: isolate;/.test(limpio), 'la tarjeta aísla su apilamiento: la sombra no pasa por detrás de la página');
  const mapa = entradaMotion('pulsar_tarjeta_area');
  ok(mapa && !/box-shadow/.test(mapa.transicion) && /MS F13/.test(mapa.relacion), 'el mapa del movimiento lo cuenta: la pulsación ya no anima la sombra');
}
{
  const F = sinComentarios(leer('src/components/fundidoBajoCabecera.js'));
  const lee = F.indexOf('const bordes = tarjetas.map((el) => borde - el.getBoundingClientRect().top);');
  const escribe = F.indexOf('tarjetas.forEach((el, i) => ponerMascara(el, mascaraBajoCabecera(bordes[i])));');
  ok(lee > 0 && escribe > lee && !/forEach\(\(el\) => \{\s*ponerMascara\(el, mascaraBajoCabecera\(borde - el\.getBoundingClientRect/.test(F),
    '🐛 el fundido bajo la cabecera LEE todas las tarjetas y DESPUÉS escribe todas: ni un recálculo forzado por tarjeta (apartados 6 y 7)');
}
{
  olvidarOrigenes();
  registrarOrigen('compartido:viejo', { rect: { top: 1, left: 1, width: 10, height: 10 } }, 1000, { efimero: true });
  registrarOrigen('pantalla:viejo', { rect: { top: 1, left: 1, width: 10, height: 10 } }, 1000);
  ok(cuantosOrigenes(1001) === 2, 'un origen recién apuntado está en el registro…');
  ok(cuantosOrigenes(1000 + TTL_ORIGEN_MS + 1) === 0, '🐛 …y en cuanto caduca, sale: no se queda guardado (con su nodo) hasta que alguien lo tome (apartado 21)');
  registrarOrigen('compartido:a', { rect: { top: 1, left: 1, width: 10, height: 10 }, elemento: { nodo: 1 } }, 5000, { efimero: true });
  registrarOrigen('compartido:b', { rect: { top: 1, left: 1, width: 10, height: 10 } }, 5000 + 200);
  ok(cuantosOrigenes(5200) === 1 && tomarOrigen('compartido:a', 5200) === null, 'apuntar uno nuevo poda los caducados (la despedida de un nombre que nadie tomó)');
  ok(/podarOrigenes\(ahora\);\s*const antes = ORIGENES\.get\(id\);/.test(leer('src/lib/continuidad.js')), 'la poda va en `registrarOrigen`, antes de mirar lo que había');
  olvidarOrigenes();
}
ok(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>/.test(leer('index.html')) && /<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin \/>/.test(leer('index.html')),
  '🔓 index.html abre ya la conexión con las tipografías: el cambio de la letra de respaldo a la buena llega antes (apartado 37)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. La auditoría: lo que no puede volver (apartados 13, 18-20, 23, 25 y 41) ──');
{
  const malas = REGLAS_COSTE.map((r) => {
    const css = /^[.@]/.test(r.ejemploMalo) ? r.ejemploMalo : '';
    const archivo = r.id === 'intervalo_en_motion' ? 'src/lib/motion.js' : 'src/views/X.jsx';
    const encontrados = css ? problemasDeCss(css) : problemasDeFuente(r.ejemploMalo, archivo);
    return { id: r.id, caza: encontrados.some((p) => p.regla === r.id) };
  });
  ok(REGLAS_COSTE.length === 6 && malas.every((m) => m.caza), `cada regla CAZA su propio ejemplo malo (EH F42)${malas.some((m) => !m.caza) ? ` — no caza: ${malas.filter((m) => !m.caza).map((m) => m.id).join(', ')}` : ''}`);
}
ok(problemasDeFuente("window.addEventListener('scroll', medir, { passive: true });").length === 0
  && problemasDeFuente("el.addEventListener('touchmove', mover, { passive: false });").length === 0
  && problemasDeFuente("el.addEventListener('touchmove', mover);").length === 1,
  'un escuchador de scroll o de toque tiene que DECIR si es pasivo: `passive: false` es una decisión, no decir nada no lo es');
ok(problemasDeFuente('// will-change: transform\nconst x = 1;').length === 0 && problemasDeFuente("const t = 'will-change';").length === 0, 'un comentario o un texto que nombra `will-change` no lo usa');
ok(problemasDeFuente('setInterval(tic, 1000);', 'src/views/Reloj.jsx').length === 0, 'un intervalo fuera de las piezas de movimiento (un reloj) no es asunto de esta auditoría');
ok(PIEZAS_MOTION.every((p) => existsSync(join(RAIZ, p))), `las ${PIEZAS_MOTION.length} piezas de movimiento existen`);
{
  const r = auditarCosteMotion({ css: CSS, fuentes: FUENTES });
  ok(r.problemas.length === 0, `🚨 la aplicación entera pasa la auditoría: ni un \`will-change\`, ni un escuchador de scroll sin decir si es pasivo, ni un intervalo en una pieza de movimiento, ni nada caro sin declarar${r.problemas.length ? ` — ${r.problemas.slice(0, 6).map((p) => `${p.regla} ${p.archivo || p.selector}:${p.linea}`).join(' · ')}` : ''}`);
  ok(Object.keys(FUENTES).length > 150, `…sobre los ${Object.keys(FUENTES).length} archivos de \`src/\``);
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. La calidad adaptativa: una política interna, con lo que se mide (apartados 38, 44 y 45, C-64) ──');
ok(CALIDADES_MOTION.map((c) => c.id).join() === 'full,standard,reduced,minimal', 'cuatro calidades: FULL, STANDARD, REDUCED y MINIMAL');
ok(MODOS_MOTION.every((m) => CALIDADES_MOTION.some((c) => c.modos.includes(m.id))) && calidadDeModo('ultra') === 'full' && calidadDeModo('normal') === 'standard' && calidadDeModo('reducido') === 'reduced' && calidadDeModo('off') === 'minimal',
  'cada uno de los cinco modos de la F1 es una calidad: la calidad SALE del modo, no es otro ajuste');
ok(REBAJAS_AUTOMATICAS.length >= 3 && REBAJAS_AUTOMATICAS.every((r) => r.senal && r.mide && r.rebaja && leer(r.donde).includes(r.trozo)),
  'las rebajas automáticas son las que se MIDEN, y cada una se encuentra en su archivo (el presupuesto del orquestador, el de las listas, la cascada)');
ok(ADAPTACION.some((a) => /memoria|núcleos/i.test(a.senal) && !a.fiable && /Ninguno/.test(a.efecto)) && NO_EN_F13.some((n) => /núcleos/.test(n.que) && /C-64/.test(n.porque)),
  '🔓 C-64: ni los núcleos ni la memoria rebajan nada —lo decidió la F12 y la F13 lo respeta—');
ok(!/hardwareConcurrency|deviceMemory|getBattery/.test(sinComentarios(Object.entries(FUENTES).filter(([p]) => p.startsWith('src/')).map(([, s]) => s).join('\n'))), '…y ningún archivo de la aplicación lee los núcleos, la memoria ni la batería');
ok(!/data-calidad|dataset\.calidad/.test(sinComentarios(leer('src/App.jsx')) + CSS.replace(/\/\*[\s\S]*?\*\//g, '')), 'no hay un atributo de calidad que nadie lea: la calidad la dice el monitor');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. El monitor de fotogramas (apartados 41, 42 y 46) ──');
{
  const fotogramas = [];
  let t = 0;
  let siguiente = 1;
  const pendientes = new Map();
  const raf = (fn) => { const id = siguiente++; pendientes.set(id, fn); return id; };
  const cancelar = (id) => pendientes.delete(id);
  const tic = (ms = 16.7) => { t += ms; const fns = [...pendientes.values()]; pendientes.clear(); fns.forEach((fn) => fn(t)); };
  const escuchas = {};
  const documento = {
    visibilityState: 'visible',
    documentElement: { dataset: { motion: 'premium' } },
    addEventListener: (e, f) => { escuchas[e] = f; },
    removeEventListener: (e, f) => { if (escuchas[e] === f) delete escuchas[e]; },
    querySelector: () => ({ getAttribute: () => 'Bienestar' }),
  };
  let desconectado = false;
  const m = crearMonitorDeFotogramas({ raf, cancelar, documento, estado: () => ({ enMarcha: 3, porSistema: { layout: 3 }, grupos: {} }), observarTareasLargas: (contar) => { contar(2); return { disconnect: () => { desconectado = true; } }; } });
  ok(m.empezar() === true && m.empezar() === false, 'empezar una vez (y no dos)');
  for (let i = 0; i < 11; i += 1) tic();
  const vivo = m.leer();
  fotogramas.push(vivo.fotogramas);
  ok(vivo.fotogramas === 10 && vivo.fps === 60 && vivo.animaciones === 3 && vivo.pantalla === 'Bienestar' && vivo.calidad === 'full' && vivo.tareasLargas === 2,
    `dice los fotogramas, la pantalla, la calidad (Premium es «full»), las animaciones del orquestador y las tareas largas (${JSON.stringify({ f: vivo.fotogramas, fps: vivo.fps, a: vivo.animaciones, p: vivo.pantalla, c: vivo.calidad, l: vivo.tareasLargas })})`);
  documento.visibilityState = 'hidden';
  escuchas.visibilitychange();
  for (let i = 0; i < 5; i += 1) tic();
  ok(m.leer().pausado === true && m.leer().fotogramas === 10 && pendientes.size === 0, '🚨 con la pestaña escondida se PARA: no cuenta ni deja un fotograma pedido (apartados 41 y 42)');
  documento.visibilityState = 'visible';
  escuchas.visibilitychange();
  tic(5000);
  for (let i = 0; i < 3; i += 1) tic();
  const vuelto = m.leer();
  ok(vuelto.pausado === false && vuelto.fotogramas === 13 && vuelto.peorMs < 20, '…y al volver sigue, sin contar el rato escondido como un fotograma de cinco segundos');
  const fin = m.parar();
  ok(fin.activo === false && pendientes.size === 0 && !escuchas.visibilitychange && desconectado, 'pararlo cancela su fotograma, quita su escuchador y desconecta el observador: no queda nada vivo (apartado 22)');
  for (let i = 0; i < 40; i += 1) { m.empezar(); for (let j = 0; j < 30; j += 1) tic(); m.parar(); }
  ok(TOPE_MUESTRAS >= 300, `guarda como mucho ${TOPE_MUESTRAS} muestras: el monitor no crece sin fin`);
}
{
  forzarDepuracion(false);
  globalThis.window = { __motion: { estado: () => 'x' } };
  ok(exponerMonitor() === false && !window.__motion.fotogramas, 'sin la marca de depuración, el monitor no existe');
  forzarDepuracion(true);
  ok(exponerMonitor() === true && typeof window.__motion.fotogramas.empezar === 'function' && typeof window.__motion.estado === 'function', 'con la marca, `window.__motion.fotogramas` se suma a la consola de la F11 sin pisarla');
  forzarDepuracion(null);
  delete globalThis.window;
  const R = sinComentarios(leer('src/lib/rendimientoMotion.js'));
  ok(/if \(typeof window === 'undefined' \|\| !depurando\(\)\) return false;/.test(R) && /\nexponerMonitor\(\);\s*$/.test(R), 'solo en desarrollo y con la marca (`depurando()` de la F11): en producción no hace nada');
  ok(/^import '\.\/lib\/rendimientoMotion';$/m.test(leer('src/App.jsx')), 'App.jsx lo carga (solo por lo que hace al cargar)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. La regla permanente y lo decidido (apartados 53-57) ──');
{
  const mods = {
    'src/lib/motionMapa.js': await import('../src/lib/motionMapa.js'),
    'src/lib/accesibilidadMotion.js': await import('../src/lib/accesibilidadMotion.js'),
    'src/lib/rendimientoMotion.js': await import('../src/lib/rendimientoMotion.js'),
    'src/lib/orquestadorMotion.js': await import('../src/lib/orquestadorMotion.js'),
  };
  ok(CINCO_CRITERIOS.map((c) => c.id).join() === 'calidad,accesibilidad,rendimiento,interrumpible,limpieza' && CINCO_CRITERIOS.every((c) => typeof (mods[c.archivo] || {})[c.vigila] === 'function'),
    '🚨 los cinco criterios de toda animación nueva —calidad, accesibilidad, rendimiento, que se pueda interrumpir y que se limpie— tienen cada uno la auditoría que lo vigila, y existe');
}
ok(HALLAZGOS_F13.length >= 4 && HALLAZGOS_F13.every((h) => h.apartados.length && h.que && h.queda && leer(h.donde).includes(h.trozo)), 'cada hallazgo de la fase dice qué era, qué se hizo, y su arreglo se encuentra en su archivo');
ok(REVISADO_Y_BIEN_F13.length >= 8 && REVISADO_Y_BIEN_F13.every((r) => r.que && r.porque), 'lo que se miró y está bien, dicho (para no volver a barrerlo)');
ok(NO_EN_F13.length >= 5 && NO_EN_F13.every((n) => n.que && n.porque), 'lo que no se construye, con su motivo (ni typecheck ni lint, ni listas virtuales, ni capas forzadas, ni un ajuste de calidad)');
ok(!/framer-motion|react-spring|gsap|animejs|popmotion|motion-one/.test(leer('package.json')), 'ni una librería de animación en el paquete (apartado 34)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. El recorrido y la documentación ──');
{
  const recorrido = leer('scripts/test-app-real.mjs');
  ok(/── MS F13 · Rendimiento: lo que cuesta/.test(recorrido) && /pintadosDurante_ms13/.test(recorrido) && /HeapProfiler\.collectGarbage/.test(recorrido) && /RecalcStyleCount/.test(recorrido),
    'el recorrido mide en Chromium los pintados de una pulsación, los recálculos de un scroll y la memoria tras recoger la basura');
}
const SIS = leer('docs/MOTION_SYSTEM.md');
ok(/PRESUPUESTO_FOTOGRAMA/.test(SIS) && /auditarCosteMotion/.test(SIS) && /COSTES_DECLARADOS/.test(SIS) && /window\.__motion\.fotogramas/.test(SIS) && /16,67/.test(SIS), 'MOTION_SYSTEM.md tiene el presupuesto, las reglas de rendimiento y el monitor (apartados 52 y 57)');
ok(/\*\*F13\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F13');
ok(/C-64/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), 'C-64 está escrita');

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
