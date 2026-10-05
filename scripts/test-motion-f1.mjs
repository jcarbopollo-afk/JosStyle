/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 1 — el motor de movimiento, sus tokens y sus primitivas

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f1.mjs

   Lo que se comprueba es lo que pide el apartado 22 —montar, desmontar,
   interrumpir, movimiento reducido, ajustes, navegación, cambios de diseño y
   transiciones compartidas— y, sobre todo, que **la tabla de `motion.js` y el
   CSS digan lo mismo**: si alguien cambia un número en un sitio y no en el
   otro, esto se pone rojo. Lo que necesita un navegador de verdad (que un modo
   cambie lo que se ve, la velocidad, el del sistema operativo, la Web
   Animations API) está en la sección «MS F1» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  DURACIONES_MOTION, CURVAS_MOTION, SPRINGS_MOTION, amortiguacionRelativa, muestrearSpring,
  DISTANCIAS_MOTION, ESCALAS_MOTION, PULSOS_MOTION, OPACIDADES_MOTION, DESENFOQUES_MOTION, TOPES_ESCALA,
  STAGGER_MOTION, DIRECCIONES_STAGGER, escalonDe, escalonado,
  VELOCIDADES_MOTION, velocidadMotion, duracionesDeVelocidad, retrasosDe,
  MODOS_MOTION, GUARDADOS_ANTIGUOS, modoMotion, modoDeGuardado, guardadoDeModo, valorSelector,
  intensificar, TOPE_DISTANCIA_PX, pasoDeStagger, springDeModo, desenfoqueDelVelo,
  tokensDeModo, tokensDeTiempo, tokensFijos,
  contextoMotion, atributoMotion, contextoDelDocumento, duracionMs, EVENTO_MOTION,
  transicion, PRESETS_MOTION, fotogramas,
  estadoVisual, animar, animandose, ESTADOS_PRESENCIA, siguientePresencia, estaMontado,
  deltaFlip, flip, compartirElemento,
  variablesDeBloque, tokensRaiz, resolverDuraciones, auditarTokensCss, movimientoReducidoEnCss,
  REGLA_DE_FUTURO_F1, NO_EN_F1, varDuracion, varCurva,
} from '../src/lib/motion.js';
import { auditarMotion, escanearCss, HALLAZGOS_F0, DEUDA_F0, MOTION_MAP, AJUSTES_MOVIMIENTO, PRESUPUESTO_MOTION } from '../src/lib/motionMapa.js';
import { NIVELES_ANIMACION, VELOCIDADES_ANIMACION, DEFAULT_APARIENCIA } from '../src/tokens.js';
import { ANIMACIONES_HC } from '../src/lib/pulidoHC.js';
import { DEPENDENCIAS_PERMITIDAS } from '../src/lib/arquitecturaFitness.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const CSS = leer('src/index.css');
const APP = leer('src/App.jsx');
const AJUSTES = leer('src/views/SettingsView.jsx');
const HUB = leer('src/views/HubView.jsx');
const COMP = leer('src/components/motion.jsx');
const LIB = leer('src/lib/motion.js');
const sinComentarios = (s) => String(s).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const sinComentariosCss = (s) => String(s).replace(/\/\*[\s\S]*?\*\//g, '');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}
const eq = (a, b, msg) => ok(JSON.stringify(a) === JSON.stringify(b), `${msg}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — es ${JSON.stringify(a)}, se esperaba ${JSON.stringify(b)}`}`);

const VISTAS = {};
for (const d of ['src/views', 'src/components']) {
  for (const f of readdirSync(join(RAIZ, d))) if (/\.(jsx|js)$/.test(f)) VISTAS[`${d}/${f}`] = leer(`${d}/${f}`);
}
VISTAS['src/App.jsx'] = APP;

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Los tokens (apartados 2-7) ──');

const REQ_DUR = ['instant', 'ultraFast', 'fast', 'normal', 'medium', 'slow', 'cinematic'];
ok(REQ_DUR.every((k) => k in DURACIONES_MOTION), `las siete duraciones del apartado 2 (${REQ_DUR.join(', ')})`);
const durs = REQ_DUR.map((k) => DURACIONES_MOTION[k]);
ok(durs.every((d, i) => i === 0 || d > durs[i - 1]), '…de menos a más, sin dos iguales');
ok(DURACIONES_MOTION.instant === 0 && DURACIONES_MOTION.cinematic <= PRESUPUESTO_MOTION.duracionTransicionMaxMs,
  `…y la más larga de una transición cabe en el presupuesto de la F0 (${PRESUPUESTO_MOTION.duracionTransicionMaxMs} ms)`);
ok(DURACIONES_MOTION.momento <= 700 && DURACIONES_MOTION.firma <= 1000, '…el momento y la firma, por debajo del segundo');
const REQ_CURVA = ['standard', 'smooth', 'entrance', 'exit', 'emphasized', 'linear'];
ok(REQ_CURVA.every((k) => CURVAS_MOTION[k]), 'las seis curvas del apartado 2');
eq(tokensRaiz(CSS)['--ease-premium'], CURVAS_MOTION.standard, '🚨 la `standard` ES `--ease-premium`, la de la Fase N2: no se sustituye, se nombra');
eq(varCurva('standard'), '--ease-premium', '…y su variable sigue llamándose así');
const REQ_SPRING = ['soft', 'normal', 'responsive', 'bouncy', 'heavy'];
ok(REQ_SPRING.every((k) => SPRINGS_MOTION[k]), 'los cinco muelles del apartado 2');
ok(REQ_SPRING.every((k) => amortiguacionRelativa(SPRINGS_MOTION[k]) >= 0.6),
  `🚨 *"No abuses del rebote"*: ninguno baja de ζ 0,6 (${REQ_SPRING.map((k) => `${k} ${amortiguacionRelativa(SPRINGS_MOTION[k]).toFixed(2)}`).join(', ')})`);
const bote = muestrearSpring('bouncy', { desde: 0, hasta: 1 });
ok(bote.pasoMaximo > 1 && bote.pasoMaximo <= 1.12, `…el que más rebota se pasa como mucho un 12 % y vuelve (${bote.pasoMaximo.toFixed(3)})`);
ok(REQ_SPRING.every((k) => { const m = muestrearSpring(k); return m.valores[m.valores.length - 1] === 1 && m.duracionMs <= 1200 && m.duracionMs > 0; }),
  '…y todos llegan exactamente a su destino, en menos de 1,2 s');
ok(muestrearSpring('soft', { desde: 0, hasta: 1 }).pasoMaximo <= 1.02, '…el suave casi no se pasa');
const dist = Object.values(DISTANCIAS_MOTION);
ok(['micro', 'small', 'medium', 'large', 'hero'].every((k) => k in DISTANCIAS_MOTION) && dist.every((d, i) => i === 0 || d > dist[i - 1]),
  `las cinco distancias del apartado 3, de menos a más (${dist.join(', ')} px)`);
ok(['micro', 'subtle', 'normal', 'hero'].every((k) => k in ESCALAS_MOTION), 'las cuatro escalas del apartado 4');
ok(ESCALAS_MOTION.micro > ESCALAS_MOTION.subtle && ESCALAS_MOTION.subtle > ESCALAS_MOTION.normal && ESCALAS_MOTION.normal > ESCALAS_MOTION.hero,
  '…y cuanto más «hero», más lejos de 1');
ok([ESCALAS_MOTION.micro, ESCALAS_MOTION.subtle, ESCALAS_MOTION.normal].every((s) => s >= TOPES_ESCALA.superficie.min) && ESCALAS_MOTION.hero >= TOPES_ESCALA.marca.min,
  `🚨 *"No utilizar scale excesivo"*: una superficie entra desde ${TOPES_ESCALA.superficie.min} como poco`);
ok(PULSOS_MOTION.sobrepaso <= TOPES_ESCALA.superficie.max && Object.entries(PULSOS_MOTION).every(([, v]) => v <= TOPES_ESCALA.marca.max),
  `…una superficie no crece de ${TOPES_ESCALA.superficie.max} y una marca no late de ${TOPES_ESCALA.marca.max}`);
const ops = Object.values(OPACIDADES_MOTION);
ok(['hidden', 'subtle', 'secondary', 'visible', 'full'].every((k) => k in OPACIDADES_MOTION) && ops.every((o, i) => i === 0 || o > ops[i - 1]) && ops[0] === 0 && ops[4] === 1,
  'las cinco opacidades del apartado 5, de 0 a 1');
const blurs = Object.values(DESENFOQUES_MOTION);
ok(['none', 'subtle', 'medium', 'strong'].every((k) => k in DESENFOQUES_MOTION) && blurs[0] === 0 && blurs.every((b, i) => i === 0 || b > blurs[i - 1]),
  'los cuatro desenfoques del apartado 6');
eq(DIRECCIONES_STAGGER, ['normal', 'inversa', 'centro'], 'el escalonado del apartado 7 tiene dirección');
ok(STAGGER_MOTION.pasoMs <= PRESUPUESTO_MOTION.staggerPasoMaxMs && STAGGER_MOTION.pasoMs * (STAGGER_MOTION.escalones - 1) <= PRESUPUESTO_MOTION.staggerTotalMaxMs,
  `…con paso de ${STAGGER_MOTION.pasoMs} ms y ${STAGGER_MOTION.escalones} escalones, dentro del presupuesto de la F0`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. La tabla y el CSS dicen lo mismo ──');

const dif = auditarTokensCss(CSS);
ok(dif.length === 0, `🚨 cada variable de index.css es la de la tabla de motion.js, en :root, en cada modo, en cada velocidad y en el bloque del sistema${dif.length ? `: ${JSON.stringify(dif.slice(0, 4))}` : ''}`);
ok(auditarTokensCss(CSS.replace('--motion-dist-large: 30px', '--motion-dist-large: 31px')).some((d) => d.variable === '--motion-dist-large' && d.selector === "html[data-motion='premium']"),
  '…y se pone roja si un número cambia en el CSS y no en la tabla');
ok(auditarTokensCss(CSS.replace("html[data-velocidad='lenta'] {", "html[data-velocidad='lenta'] {\n  --motion-dur-inventada: 10ms;")).some((d) => d.variable === '--motion-dur-inventada'),
  '…y si el CSS declara una variable del motor que la tabla no conoce');
ok(auditarTokensCss(CSS.replace("html[data-motion='ultra'] {", "html[data-motion='ultrax'] {")).some((d) => d.selector === "html[data-motion='ultra']"),
  '…y si falta el bloque de un modo');
const conCalcDeTiempo = sinComentariosCss(CSS).match(/calc\([^;{}]*\d+m?s\b[^;{}]*\)/g) || [];
ok(conCalcDeTiempo.length === 0, `🚨 ni un \`calc()\` con milisegundos en el CSS: si Safari no lo resolviera, la aplicación se quedaría sin animaciones sin que fallara nada en Chromium${conCalcDeTiempo.length ? `: ${conCalcDeTiempo[0]}` : ''}`);
const reglas = escanearCss(CSS);
const literales = reglas.filter((r) => /\b\d*\.?\d+m?s\b/.test(r.valor) && !/^html\[data-(motion|animaciones)/.test(r.selector));
ok(reglas.length >= 30 && literales.length === 0, `🚨 todas las animaciones y transiciones de index.css (${reglas.length}) usan una duración del motor, ni una escrita a mano${literales.length ? `: ${literales.map((r) => r.selector).join(', ')}` : ''}`);
const keyframes = [...sinComentariosCss(CSS).matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)];
const fotogramasSueltos = keyframes.filter(([, , cuerpo]) => /translate[XY]?\(\s*-?\d+(\.\d+)?px|scale\(\s*(0\.\d+|1\.\d+)\s*\)/.test(cuerpo)).map(([, n]) => n);
ok(keyframes.length >= 20 && fotogramasSueltos.length === 0, `🚨 ningún @keyframes (${keyframes.length}) desplaza ni escala con un número suyo: todos con los tokens, así que respetan el modo${fotogramasSueltos.length ? `: ${fotogramasSueltos.join(', ')}` : ''}`);
const rm = movimientoReducidoEnCss(CSS);
ok(rm.ajuste && rm.sistema, '🚨 Reducido (el ajuste) y el «Reducir movimiento» del sistema dejan los desplazamientos a cero, no la duración: reducir no es romper (apartado 17)');
ok(rm.apagado && /html\[data-motion='off'\][\s\S]{0,400}animation-iteration-count:\s*1 !important/.test(sinComentariosCss(CSS)),
  '…«Sin movimiento» lo lleva todo a 0,01 ms, y lo que no para se queda en una vuelta');
ok(!movimientoReducidoEnCss(CSS.replace(/@media \(prefers-reduced-motion: reduce\) \{\s*html:not/, '@media (min-width: 1px) {\n  html:not')).ok,
  '…y la comprobación se pone roja sin el bloque del sistema');
ok(!/html\[data-reducir-movimiento='true'\][^{]*\{[^}]*0\.01ms/.test(sinComentariosCss(CSS)),
  '🔓 el interruptor de Ajustes ya no lo lleva todo a 0,01 ms (eso era romper)');
ok(/html\[data-motion='ultra'\] \.fondo-entra\s*\{[^}]*backdrop-filter:\s*blur\(var\(--motion-velo-desenfoque\)\)/.test(CSS)
  && !/transition[^;]*backdrop-filter/.test(sinComentariosCss(CSS)),
  '🔓 la profundidad de Ultra: el velo de una hoja desenfoca, solo en Ultra y nunca animado');
eq(resolverDuraciones('a var(--motion-dur-slow) b', tokensRaiz(CSS)), 'a 340ms b', 'una auditoría que mide milisegundos resuelve el token');
const me = reglas.find((r) => r.selector === '.module-enter');
ok(!!me && me.ms[0] === 340, '…y la de la F0 sigue leyendo 340 ms en `.module-enter`');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Los modos (apartado 14) ──');

eq(MODOS_MOTION.map((m) => m.id), ['off', 'reducido', 'normal', 'premium', 'ultra'], 'OFF, REDUCED, NORMAL, PREMIUM y ULTRA, de menos a más');
eq(MODOS_MOTION.slice(0, 3).map((m) => m.guardado), ['desactivadas', 'reducida', 'completa'], '🚨 los tres de antes guardan el id que ya tenían: lo guardado no se toca');
eq(NIVELES_ANIMACION, MODOS_MOTION.map((m) => ({ value: m.guardado, label: m.nombre })), '…y el selector de Ajustes sale del motor, no de una segunda lista');
eq(DEFAULT_APARIENCIA.animaciones, 'completa', '…con Normal de serie');
eq(modoDeGuardado('minima'), 'reducido', '🔓 lo guardado como «minima» (el cuarto nivel de antes) se lee como Reducido (C-52)');
eq(GUARDADOS_ANTIGUOS, { minima: 'reducido' }, '…y es el único id antiguo');
eq(valorSelector('minima'), 'reducida', '…y el selector marca Reducido');
eq(modoDeGuardado('inventado'), 'normal', '…y un valor que no se conoce es Normal, no un modo inventado');
eq(guardadoDeModo('ultra'), 'ultra', 'Premium y Ultra se guardan con su nombre');
ok(MODOS_MOTION.every((m) => m.explica && m.explica.length > 30), 'cada modo dice qué hace, con una frase entera');
ok(!MODOS_MOTION.some((m) => /dura más|más lent/i.test(m.explica)), '🚨 ULTRA no es *"más duración"*: ningún modo lo promete');
ok(MODOS_MOTION.every((m) => !Object.keys(tokensDeModo(m.id)).some((k) => /--motion-dur-|--motion-retraso-/.test(k))),
  '…y ningún modo toca una duración: el tiempo es de la velocidad');

const n = tokensDeModo('normal');
const p = tokensDeModo('premium');
const u = tokensDeModo('ultra');
ok(parseInt(p['--motion-dist-large'], 10) > parseInt(n['--motion-dist-large'], 10) && parseInt(u['--motion-dist-large'], 10) > parseInt(p['--motion-dist-large'], 10),
  `🔓 Premium y Ultra se notan: una pantalla entra desde ${n['--motion-dist-large']}, ${p['--motion-dist-large']} y ${u['--motion-dist-large']}`);
ok(parseInt(p['--motion-dist-medium'], 10) > parseInt(n['--motion-dist-medium'], 10), `…y una tarjeta desde ${n['--motion-dist-medium']} y ${p['--motion-dist-medium']}`);
ok(desenfoqueDelVelo('ultra') > 0 && desenfoqueDelVelo('premium') === 0 && desenfoqueDelVelo('normal') === 0,
  `…y Ultra añade profundidad (el velo desenfoca ${desenfoqueDelVelo('ultra')} px) que los demás no tienen`);
const r = tokensDeModo('reducido');
ok(Object.keys(DISTANCIAS_MOTION).every((k) => r[`--motion-dist-${k}`] === '0px') && Object.keys(ESCALAS_MOTION).every((k) => r[`--motion-escala-${k}`] === '1'),
  'Reducido: ni un desplazamiento ni una escala');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. La intensidad: una función inteligente (apartado 16) ──');

ok(intensificar('distancia', 'hero', 0) === 0 && intensificar('escala', 'normal', 0) === 1 && intensificar('pulso', 'firma', 0) === 1, 'sin intensidad no hay movimiento');
ok(Object.keys(DISTANCIAS_MOTION).every((k) => intensificar('distancia', k, 1) === DISTANCIAS_MOTION[k]), 'a intensidad 1, los valores de la tabla');
for (const I of [0.5, 0.75, 1, 1.25, 1.4, 2, 3]) {
  const d = Object.keys(DISTANCIAS_MOTION).map((k) => intensificar('distancia', k, I));
  ok(d.every((x, i) => i === 0 || x > d[i - 1] || x === TOPE_DISTANCIA_PX), `🚨 a intensidad ${I} la jerarquía se conserva (${d.join(' < ')} px)`);
}
const mitad = Object.fromEntries(Object.keys(DISTANCIAS_MOTION).map((k) => [k, intensificar('distancia', k, 0.5) / DISTANCIAS_MOTION[k]]));
ok(mitad.micro > mitad.hero && mitad.micro !== 0.5,
  `🚨 *"Intensidad 50 % no significa todo × 0,5"*: lo micro conserva el ${Math.round(mitad.micro * 100)} % y lo hero el ${Math.round(mitad.hero * 100)} %`);
ok(['micro', 'subtle', 'normal'].every((k) => intensificar('escala', k, 5) >= TOPES_ESCALA.superficie.min) && intensificar('pulso', 'sobrepaso', 5) <= TOPES_ESCALA.superficie.max,
  '🚨 por mucha intensidad que se pida, una superficie no pasa del presupuesto');
ok(['micro', 'suave', 'medio', 'fuerte', 'firma'].every((k) => intensificar('pulso', k, 5) <= TOPES_ESCALA.marca.max) && intensificar('distancia', 'hero', 5) <= TOPE_DISTANCIA_PX,
  '…ni una marca ni un desplazamiento');
let lanza = false;
try { intensificar('color', 'micro', 1); } catch { lanza = true; }
ok(lanza, '…y un tipo que no existe no se inventa: lanza');
eq(pasoDeStagger('off'), 0, 'el escalonado se apaga con «Sin movimiento»');
eq([pasoDeStagger('reducido'), pasoDeStagger('normal'), pasoDeStagger('ultra')], [60, 60, 60], '…y se conserva en Reducido: el orden sigue diciendo cómo se lee (apartado 17)');
eq(springDeModo('bouncy', 'reducido'), null, 'en Reducido no hay muelle: lo que suelta el dedo llega con la curva');
eq(springDeModo('bouncy', 'ultra'), SPRINGS_MOTION.bouncy, '🚨 Ultra no rebota más que el de serie (*"No abuses del rebote"*)');
eq(springDeModo('inventado', 'normal'), null, '…y un muelle que no existe no se inventa');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. La velocidad global (apartado 15) ──');

eq(VELOCIDADES_MOTION.map((v) => v.id), ['lenta', 'normal', 'rapida'], 'Pausada, Normal y Rápida');
eq(VELOCIDADES_ANIMACION, VELOCIDADES_MOTION.map((v) => ({ value: v.id, label: v.nombre })), '…y el selector de Ajustes sale del motor');
eq(DEFAULT_APARIENCIA.velocidadMovimiento, 'normal', '…con Normal de serie, dentro de `apariencia` (regla 5)');
eq(duracionesDeVelocidad('lenta').cinematic, Math.round(420 * 1.3), 'Pausada multiplica todas las duraciones');
eq(duracionesDeVelocidad('rapida').fast, Math.round(160 * 0.75), '…y Rápida también');
ok(duracionesDeVelocidad('lenta').instant === 0 && duracionesDeVelocidad('rapida').instant === 0, '…y lo instantáneo sigue siendo instantáneo');
eq(retrasosDe('normal'), [0, 60, 120, 180, 240, 300], 'los retrasos del escalonado, seis escalones');
eq(retrasosDe('lenta')[5], Math.round(300 * 1.3), '…que también escalan con la velocidad');
eq(velocidadMotion('inventada').id, 'normal', 'una velocidad que no se conoce es la normal');
ok(VELOCIDADES_MOTION.every((v) => v.explica), '…y cada una dice qué hace');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. El contexto: modo, velocidad y reducir (apartados 13 y 17) ──');

const c1 = contextoMotion({ animaciones: 'completa', sistemaReduce: true });
ok(c1.modo === 'reducido' && c1.motivo === 'sistema' && c1.elegido === 'normal', '🚨 con «Reducir movimiento» en el iPhone, Normal se ve como Reducido —no como «Sin movimiento»—');
const c2 = contextoMotion({ animaciones: 'ultra', reducirMovimiento: true });
ok(c2.modo === 'reducido' && c2.motivo === 'ajuste', '…y con el interruptor de Ajustes, Ultra también');
const c3 = contextoMotion({ animaciones: 'desactivadas', sistemaReduce: true });
ok(c3.modo === 'off' && c3.apagado && c3.motivo === null, '…pero «Sin movimiento» sigue siendo «Sin movimiento»: es lo que él ha pedido');
eq(contextoMotion({ animaciones: 'reducida', sistemaReduce: true }).motivo, null, '…y Reducido no necesita motivo para serlo');
eq(atributoMotion({ animaciones: 'premium', reducirMovimiento: true }), 'reducido', 'el atributo de <html> lleva dentro el interruptor de Ajustes');
eq(atributoMotion({ animaciones: 'premium' }), 'premium', '…y no el del sistema: ése lo aplica el CSS con su @media, al momento');
eq(contextoDelDocumento().modo, 'normal', 'sin documento (Node), el contexto es el de serie');
eq([duracionMs('slow', contextoMotion()), duracionMs('slow', contextoMotion({ velocidad: 'lenta' })), duracionMs('slow', contextoMotion({ animaciones: 'desactivadas' }))],
  [340, 442, 0], 'cuánto dura un token: normal, pausado y apagado');
let lanzaDur = false;
try { duracionMs('eterno'); } catch { lanzaDur = true; }
ok(lanzaDur, '…y una duración que no existe lanza en vez de inventarse un número');
eq(EVENTO_MOTION, 'josstyle:motion', 'el aviso de que algo ha cambiado tiene nombre propio');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. El escalonado (apartado 7) ──');

eq([0, 1, 2, 3, 4, 5, 6, 40].map((i) => escalonDe(i)), [0, 1, 2, 3, 4, 5, 5, 5], '🚨 seis escalones como mucho: el elemento cuarenta entra con el sexto, no 2,4 s después');
eq([0, 1, 2, 3].map((i) => escalonDe(i, { total: 4, direccion: 'inversa' })), [3, 2, 1, 0], 'en dirección inversa');
eq([0, 1, 2, 3, 4].map((i) => escalonDe(i, { total: 5, direccion: 'centro' })), [2, 1, 0, 1, 2], 'desde el centro');
eq([escalonDe(-3), escalonDe(NaN), escalonDe('x')], [0, 0, 0], 'un índice imposible es el primero');
eq(escalonado(2), { '--motion-retraso': 'var(--motion-retraso-2)' }, '🚨 el retraso es una VARIABLE que apunta al token: la vista no sabe ni un milisegundo');
ok(/\.hub-card\s*\{[^}]*animation-delay:\s*var\(--motion-retraso,\s*0ms\)/.test(CSS), '…y la cascada de siempre la lee');
ok(/\.hub-card-expanding\s*\{[^}]*animation-delay:\s*0ms/.test(CSS), '…y la expansión al pulsar arranca ya, sin heredar el retraso');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. La API para las vistas: transicion() (apartados 19 y 21) ──');

eq(transicion('width', 'slow'), 'width var(--motion-dur-slow) var(--ease-premium)', '*"Quiero una barra que avance"* sin saber milisegundos');
eq(transicion(['box-shadow', 'opacity'], 'medium', 'exit'), 'box-shadow var(--motion-dur-medium) var(--motion-curva-exit), opacity var(--motion-dur-medium) var(--motion-curva-exit)', '…varias propiedades a la vez');
eq(transicion('opacity', 'medium', 'standard', { retraso: 'ultraFast' }), 'opacity var(--motion-dur-medium) var(--ease-premium) var(--motion-dur-ultrafast)', '…con un retraso que también es un token');
let lanzaT = 0;
try { transicion('width', '437ms'); } catch { lanzaT += 1; }
try { transicion('width', 'slow', 'cubic-bezier(1,1,1,1)'); } catch { lanzaT += 1; }
ok(lanzaT === 2, '🚨 *"duration: 437ms"* y una curva suelta no se aceptan: lanza');
eq(varDuracion('ultraFast'), '--motion-dur-ultrafast', 'las variables de duración, en minúsculas como en el CSS');
const a = auditarMotion({ css: CSS, vistas: VISTAS });
eq([a.cuentas.transicion_en_linea, a.cuentas.retraso_en_linea, a.cuentas.tailwind_duracion, a.cuentas.tailwind_curva], [0, 0, 0, 0],
  '🔓 ni una transición, un retraso, una duración ni una curva de Tailwind escritos a mano en una vista (eran 25, 13, 2 y 1)');
eq([DEUDA_F0.transicion_en_linea, DEUDA_F0.retraso_en_linea, DEUDA_F0.tailwind_duracion, DEUDA_F0.tailwind_curva], [0, 0, 0, 0], '…y el trinquete de la F0 baja a cero: desde hoy no puede volver a crecer');
ok(a.deudaQueCrece.length === 0, `…y ninguna deuda ha crecido — ${JSON.stringify(a.cuentas)}`);
ok(auditarMotion({ css: CSS, vistas: { ...VISTAS, 'x.jsx': "const b = <div style={{ transition: 'width 0.4s ease' }} />;" } }).deudaQueCrece.some((d) => d.tipo === 'transicion_en_linea'),
  '…y una vista nueva con `0.4s ease` la pone roja');
ok(auditarMotion({ css: CSS, vistas: { ...VISTAS, 'x.jsx': "const b = <div style={{ transition: transicion('width', 'slow') }} />;" } }).deudaQueCrece.length === 0,
  '…y una que usa `transicion()`, no');
const TW = leer('tailwind.config.js');
ok(/transitionDuration:\s*\{\s*DEFAULT:\s*'var\(--motion-dur-fast\)'/.test(TW) && /transitionTimingFunction:\s*\{\s*DEFAULT:\s*'var\(--ease-premium\)'/.test(TW),
  '🔓 las cien clases `transition-*` de Tailwind usan el token `fast` y la curva de JosStyle (hallazgo `dos_curvas`)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Los presets (apartado 20) ──');

const NOMBRES = ['pageEnter', 'pageExit', 'cardEnter', 'cardExit', 'modalEnter', 'modalExit', 'sheetEnter', 'sheetExit', 'listReveal', 'success', 'error', 'selection', 'press', 'hover', 'expand', 'collapse', 'dataChange', 'heroReveal'];
ok(NOMBRES.every((k) => PRESETS_MOTION[k]), `los ${NOMBRES.length} presets del apartado 20`);
ok(Object.values(PRESETS_MOTION).every((x) => DURACIONES_MOTION[x.duracion] !== undefined && CURVAS_MOTION[x.curva] && x.que),
  '…cada uno con una duración y una curva del motor, y diciendo qué hace');
ok(!/\d/.test(JSON.stringify(Object.values(PRESETS_MOTION).map(({ que, ...resto }) => resto))),
  '🚨 ningún preset lleva un número propio: todo sale de los tokens (apartado 21)');
const conClase = Object.values(PRESETS_MOTION).filter((x) => x.clase);
ok(conClase.every((x) => new RegExp(`\\.${x.clase}\\b`).test(CSS)), `…los que ya hace el CSS dicen su clase, y existe (${conClase.length})`);
const N = contextoMotion();
const RED = contextoMotion({ animaciones: 'reducida' });
const OFF = contextoMotion({ animaciones: 'desactivadas' });
const pe = fotogramas('pageEnter', N);
ok(/translateX\(24px\)/.test(pe.keyframes[0].transform) && pe.keyframes[0].opacity === '0' && pe.opciones.duration === 340,
  `pageEnter en Normal: desde 24 px, transparente, 340 ms (${pe.keyframes[0].transform})`);
const peR = fotogramas('pageEnter', RED);
ok(peR.keyframes[0].transform === 'none' && peR.keyframes[0].opacity === '0' && peR.opciones.duration > 0,
  '🚨 …en Reducido, sin desplazamiento ni escala pero con su fundido: se conserva el aviso de que algo ha cambiado');
eq(fotogramas('pageEnter', OFF).opciones.duration, 0, '…y apagado, duración 0');
ok(fotogramas('heroReveal', N).keyframes.some((k) => /scale\(1\.03\)/.test(k.transform || '')) && !fotogramas('heroReveal', RED).keyframes.some((k) => k.offset),
  'heroReveal se pasa un 3 % y vuelve en Normal; en Reducido, no');
ok(fotogramas('error', N).keyframes.some((k) => /translateX\(-4px\)/.test(k.transform || '')) && fotogramas('error', RED).keyframes.every((k) => !k.transform),
  'el error es un vaivén de 4 px —sin agresividad— y en Reducido un parpadeo de opacidad');
ok(fotogramas('sheetExit', N).opciones.fill === 'forwards' && fotogramas('sheetEnter', N).opciones.fill === 'backwards',
  '🚨 lo que entra no deja un `transform` puesto (FIT F37: rompería los `fixed` de dentro); lo que sale se queda hasta desmontarse');
ok(fotogramas('expand', N).acordeon && fotogramas('collapse', N).opciones.duration < fotogramas('expand', N).opciones.duration, 'cerrar es más rápido que abrir');
let lanzaP = false;
try { fotogramas('confeti'); } catch { lanzaP = true; }
ok(lanzaP, '…y un preset que no existe no se inventa');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Las primitivas: interrumpir, presencia, FLIP y elemento compartido (apartados 9-12) ──');

function elementoFalso(caja = { left: 0, top: 0, width: 100, height: 40 }) {
  const el = { style: { opacity: '1', transform: 'none' }, caja, animaciones: [] };
  el.getBoundingClientRect = () => ({ ...el.caja });
  el.animate = (frames, opciones) => {
    const an = { frames, opciones, playState: 'running', cancelada: false, cancel() { this.cancelada = true; this.playState = 'idle'; }, finished: new Promise(() => {}) };
    el.animaciones.push(an);
    return an;
  };
  return el;
}
const e1 = elementoFalso();
const an1 = animar(e1, 'modalExit', { ctx: N });
ok(!!an1 && an1.frames[0].opacity === '1' && an1.interrumpida === false && animandose(e1), 'animar: la primera empieza desde su estado de partida');
e1.style = { opacity: '0.4', transform: 'translateY(5px)' };
const an2 = animar(e1, 'modalEnter', { ctx: N });
ok(an1.cancelada && an2.interrumpida && an2.frames[0].opacity === '0.4' && an2.frames[0].transform === 'translateY(5px)',
  '🚨 *"pulsa atrás antes de terminar"*: la nueva arranca desde donde está AHORA y la anterior se cancela (apartado 12)');
ok(an2.frames[an2.frames.length - 1].opacity === '1', '…y va hasta su destino');
const e2 = elementoFalso();
ok(animar(e2, 'modalEnter', { ctx: OFF }) === null && e2.animaciones.length === 0, 'apagado no anima nada');
eq(estadoVisual({ style: { opacity: '', transform: '' } }), { opacity: '1', transform: 'none' }, 'un estado sin valores es el de reposo');

eq(ESTADOS_PRESENCIA, ['oculto', 'entrando', 'visible', 'saliendo'], 'la presencia tiene cuatro estados');
const vida = [];
let est = 'oculto';
for (const ev of ['mostrar', 'fin', 'ocultar', 'fin']) { est = siguientePresencia(est, ev); vida.push(est); }
eq(vida, ['entrando', 'visible', 'saliendo', 'oculto'], 'montar, entrar, salir y desmontar (apartado 9)');
ok(estaMontado('saliendo') && !estaMontado('oculto'), '🚨 al ocultar NO desaparece de golpe: sigue montado mientras sale, y desmontado no ocupa sitio');
eq(siguientePresencia('saliendo', 'mostrar'), 'entrando', '🚨 volver a mostrar a mitad de la salida invierte, sin desmontar: ni parpadeo');
eq([siguientePresencia('entrando', 'mostrar'), siguientePresencia('visible', 'mostrar')], ['entrando', 'visible'], '🚨 …ni doble montaje');
eq([siguientePresencia('oculto', 'ocultar'), siguientePresencia('oculto', 'fin'), siguientePresencia('visible', 'fin')], ['oculto', 'oculto', 'visible'], '…y lo que no toca no cambia nada');

eq(deltaFlip({ left: 0, top: 100, width: 50, height: 20 }, { left: 0, top: 40, width: 50, height: 20 }), { dx: 0, dy: 60, sx: 1, sy: 1 }, 'FLIP: de dónde viene cada cosa');
eq(deltaFlip({ left: 0, top: 0, width: 50, height: 20 }, { left: 0.2, top: 0.1, width: 50, height: 20 }), null, '…y lo que no se ha movido no se anima');
const fa = elementoFalso({ left: 0, top: 0, width: 100, height: 40 });
const fb = elementoFalso({ left: 0, top: 50, width: 100, height: 40 });
let cambiado = false;
const flips = flip([fa, fb], () => { cambiado = true; fa.caja = { left: 0, top: 50, width: 100, height: 40 }; fb.caja = { left: 0, top: 0, width: 100, height: 40 }; }, { ctx: N });
ok(cambiado && flips.length === 2 && /translate\(0px, -50px\)/.test(fa.animaciones[0].frames[0].transform) && fa.animaciones[0].frames[1].transform === 'none',
  '🚨 *"una card que aumenta de tamaño mueve el resto… NO deben saltar"*: cada una viaja desde donde estaba (apartado 10)');
const fc = elementoFalso();
const flipsR = flip([fc], () => { fc.caja = { left: 0, top: 80, width: 100, height: 40 }; }, { ctx: RED });
ok(flipsR.length === 0 && fc.animaciones.length === 0, '…en Reducido el diseño cambia igual, pero nada se desplaza');
const destino = elementoFalso({ left: 0, top: 0, width: 300, height: 200 });
const comp = compartirElemento({ left: 20, top: 400, width: 60, height: 40 }, destino, { ctx: N });
ok(!!comp && /scale\(0\.2, 0\.2\)/.test(comp.frames[0].transform) && /translate\(20px, 400px\)/.test(comp.frames[0].transform),
  'elemento compartido (CARD → DETAIL): el destino nace donde estaba el origen y crece hasta su sitio (apartado 11)');
const destinoR = elementoFalso({ left: 0, top: 0, width: 300, height: 200 });
const compR = compartirElemento({ left: 20, top: 400, width: 60, height: 40 }, destinoR, { ctx: RED });
ok(!!compR && compR.frames[0].opacity === 0 && !compR.frames[0].transform, '…en Reducido, un fundido en su sitio');
ok(compartirElemento({ left: 0, top: 0, width: 1, height: 1 }, elementoFalso(), { ctx: OFF }) === null, '…y apagado, nada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Cableado: Ajustes, App.jsx y las vistas (apartados 13, 15 y 25) ──');

ok(/dataset\.motion = atributoMotion\(apariencia\)/.test(APP) && /dataset\.velocidad = velocidadMotion\(apariencia\.velocidadMovimiento\)\.id/.test(APP),
  'App.jsx escribe el modo y la velocidad en <html>: un solo punto que leen el CSS y el motor');
ok(/avisarCambioDeMotion\(\)/.test(APP) && /apariencia\.velocidadMovimiento\]\)/.test(APP), '…avisa al cambiar, y la velocidad está en sus dependencias');
ok(/dataset\.animaciones = apariencia\.animaciones/.test(APP), '…y sigue escribiendo `data-animaciones`, que leen el CSS y la comprobación de verificar.sh');
const AJ = sinComentarios(AJUSTES);
const pieza = AJ.slice(AJ.indexOf('function AjusteMovimiento('), AJ.indexOf('function OpcionesFila('));
ok(/<AjusteMovimiento apariencia=\{apariencia\}/.test(AJ), 'Apariencia pinta el ajuste del movimiento');
ok(/opciones=\{NIVELES_ANIMACION\} valor=\{valorSelector\(apariencia\.animaciones\)\}/.test(pieza), '…con los cinco modos, marcando el que corresponde a lo guardado (también «minima»)');
ok(/opciones=\{VELOCIDADES_ANIMACION\}/.test(pieza) && /velocidadMovimiento: v/.test(pieza), '…la velocidad, guardada en `apariencia` (apartado 15)');
ok(/<Switch checked=\{!!apariencia\.reducirMovimiento\}[\s\S]{0,200}label="Reducir movimiento"/.test(pieza), '…el interruptor de «Reducir movimiento», que ya es el `Switch` común (y deja un `transition-all` menos)');
ok(/ctx\.motivo/.test(pieza) && /tu iPhone tiene activado «Reducir movimiento»/.test(pieza), '…dice cuándo el modo elegido no es el que se ve, y por qué');
ok(/ctx\.apagado \?/.test(pieza) && /no hay nada que acelerar/.test(pieza), '🚨 …y con «Sin movimiento» dice que la velocidad no tiene nada que acelerar, en vez de dejar un control que no cambia nada (regla 8)');
ok(/Ver cómo se mueve/.test(pieza) && /\.\.\.escalonado\(i\)/.test(pieza) && /className="hub-card/.test(pieza), '…y una muestra que repite la cascada de verdad con lo elegido');
ok(!/pocas animaciones propias/.test(AJUSTES), '🔓 la pantalla ya no confiesa que los niveles no hacen nada');
const HUB_C = sinComentarios(HUB);
ok(!/EXPAND_MS|setTimeout\([^)]*,\s*\d+\)/.test(HUB_C) && /duracionMs\('fast', contextoDelDocumento\(\)\)/.test(HUB_C),
  '🔓 tocar un módulo espera lo que dura su expansión (el token `fast`), no 190 ms escritos aparte');
ok(/\.\.\.escalonado\(i\)/.test(HUB_C) && !/animationDelay/.test(HUB_C), '…y la portada escalona con el motor');
const sinCascadaPropia = Object.entries(VISTAS).filter(([, src]) => /animationDelay|retrasoDeTarjeta/.test(sinComentarios(src))).map(([r]) => r);
ok(sinCascadaPropia.length === 0, `🚨 ninguna vista calcula su propio retraso de cascada${sinCascadaPropia.length ? `: ${sinCascadaPropia.join(', ')}` : ''}`);
const VERIF = leer('scripts/verificar.sh');
ok(/for attr in radio densidad animaciones motion velocidad; do/.test(VERIF), 'verificar.sh comprueba que `data-motion` y `data-velocidad` tienen CSS de verdad');
ok(/test-motion-f1\.mjs/.test(VERIF), '…y ejecuta esta suite');
ok(DEPENDENCIAS_PERMITIDAS.some((d) => d.modulo === 'motion' && d.porque), 'Fitness declara el motor como dependencia, con su motivo (FIT F44)');

/* Las piezas de React no escriben su animación: usan el motor. */
const C = sinComentarios(COMP);
ok(/export function useMotion/.test(C) && /export function Presencia/.test(C) && /export function useFlip/.test(C), 'las piezas de React: useMotion, Presencia y useFlip');
ok(!/\d+ms|cubic-bezier|\bease\b/.test(C), '🚨 …y ni una duración ni una curva escritas a mano: piden todo al motor');
ok(/siguientePresencia\(e, visible \? 'mostrar' : 'ocultar'\)/.test(C) && /animar\(el,/.test(C), '…Presencia es la máquina de estados del motor y anima con `animar`, así que interrumpe desde donde está');
ok(/useEfectoDeDiseno = typeof window !== 'undefined' \? useLayoutEffect : useEffect/.test(C), '…y en el banco de renderizado no avisa por usar `useLayoutEffect` en el servidor');
const L = sinComentarios(LIB);
ok(!/^import /m.test(L), '🚨 el motor no importa nada: lo puede leer cualquier capa sin un ciclo');
ok(!/localStorage|saveData|setItem/.test(L), '…y no guarda nada: los ajustes viven en `apariencia`');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. Lo que la F0 dejó escrito, al día ──');

ok(['niveles_decorativos', 'duraciones_sueltas', 'mismo_numero_dos_sitios', 'fuera_del_catalogo', 'reducido_rompe', 'cadencias', 'dos_curvas']
  .every((id) => HALLAZGOS_F0.find((h) => h.id === id).resuelto === 1), 'los siete hallazgos de la F0 que resuelve la F1 lo dicen (`resuelto: 1`)');
ok(HALLAZGOS_F0.filter((h) => !h.resuelto).every((h) => h.fase > 1), '…y los que quedan son de fases que vienen');
eq(AJUSTES_MOVIMIENTO.niveles.map((x) => x.id), NIVELES_ANIMACION.map((x) => x.value), 'los ajustes que describe la F0 son los que hay');
ok(/Pausada/.test(AJUSTES_MOVIMIENTO.velocidad) && /Premium|Ultra/.test(AJUSTES_MOVIMIENTO.premiumYUltra), '…con la velocidad y Premium/Ultra');
const enCatalogo = ANIMACIONES_HC.filter((x) => !x.repetida);
ok(enCatalogo.every((x) => Object.values(DURACIONES_MOTION).includes(x.ms)), `🚨 cada duración de ANIMACIONES_HC es un token del motor (${[...new Set(enCatalogo.map((x) => x.ms))].sort((x, y) => x - y).join(', ')} ms)`);
ok(MOTION_MAP.filter((e) => e.duracion && !e.bucle && e.estado !== 'fuera_de_control').every((e) => Object.values(DURACIONES_MOTION).includes(e.duracion)),
  '…y cada duración del mapa (salvo la de Recharts, que es de la F4)');
ok(REGLA_DE_FUTURO_F1.length >= 3 && NO_EN_F1.length >= 4 && NO_EN_F1.every((x) => x.que && x.porque), 'la regla de futuro (apartado 24) y lo que la F1 no hace, con su motivo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 13. La documentación ──');

const SIS = leer('docs/MOTION_SYSTEM.md');
ok(MODOS_MOTION.every((m) => SIS.includes(`**${m.nombre}**`)) && VELOCIDADES_MOTION.every((v) => SIS.includes(v.nombre)), 'MOTION_SYSTEM.md nombra los cinco modos y las tres velocidades');
ok(['transicion(', 'escalonado(', 'animar(', 'Presencia', 'useFlip', 'compartirElemento', 'flip('].every((x) => SIS.includes(x)), '…y la API que usa una pantalla nueva');
ok(/Ningún componente nuevo/.test(SIS), '…y la regla de futuro');
const ORDEN = leer('docs/13_MOTION_SYSTEM_ORDEN.md');
ok(/\*\*F1\*\* ✅/.test(ORDEN), 'el índice de fases marca la F1');

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
