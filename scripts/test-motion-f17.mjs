/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 17 — motion de datos, paneles, métricas, gráficas y visualización

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f17.mjs

   Lo que se comprueba aquí: el motor de datos de la F4, mejorado —la cuenta dura según cuánto cambia, los
   relevos seguidos se agrupan, una cuenta interrumpida sigue desde lo que se ve y el lector de pantalla oye el
   valor final—; la clase de cada cifra; el eje que no baila (`dominioEstable`); el mapa de los datos (cada
   sitio lo busca la prueba en su archivo); las barras al mismo ritmo; el ranking que se filtra; la auditoría
   (limpia hoy y roja con cada fallo de antes); y que nada de eso sea un segundo motor. Lo que necesita un
   navegador —la cuenta interrumpida fotograma a fotograma, el valor final para VoiceOver, el ritmo de las
   barras, el eje de Sueño al mover la semana— está en la sección «MS F17» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  planDeCifra, TALLAS_DE_CUENTA, tallaDeCuenta, duracionDeCuenta, CLASES_DE_CIFRA, claseDeCifra, CUENTAS_A_LA_VEZ,
  pasoBonito, dominioEstable, PRESUPUESTO_DATOS, MAPA_DATOS, auditarDatos, EJEMPLOS_MALOS_F17, MAXIMO_CUENTAS_POR_ARCHIVO,
  DECISIONES_F17, REVISADO_Y_BIEN_F17, NO_EN_F17, CUANDO_F17, animacionDeGrafica,
} from '../src/lib/datosMotion.js';
import { DURACIONES_MOTION } from '../src/lib/motion.js';
import { HALLAZGOS_F0, MOTION_MAP } from '../src/lib/motionMapa.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const NORMAL = { modo: 'normal', velocidad: 'normal', intensidad: 1, espacial: true, reducido: false, apagado: false, factorTiempo: 1 };
const REDUCIDO = { ...NORMAL, modo: 'reducido', reducido: true, espacial: false, intensidad: 0 };
const OFF = { ...NORMAL, modo: 'off', apagado: true, espacial: false, intensidad: 0 };
const MOTION = leer('src/components/motion.jsx');
const CIFRA = MOTION.slice(MOTION.indexOf('export function CifraQueCambia'), MOTION.indexOf('/* La caja de un elemento relativa'));

const ARCHIVOS = { 'src/App.jsx': leer('src/App.jsx') };
['src/views', 'src/components'].forEach((d) => readdirSync(join(RAIZ, d)).forEach((f) => {
  const p = `${d}/${f}`;
  if (statSync(join(RAIZ, p)).isFile() && /\.(jsx?|mjs)$/.test(f)) ARCHIVOS[p] = leer(p);
}));

/* ---------------------------------------------------------------------------
   1 · LA CUENTA, SEGÚN CUÁNTO CAMBIA (apartado 5)
   --------------------------------------------------------------------------- */
{
  console.log('\n1 · La duración de una cuenta');
  ok(tallaDeCuenta(72, 74) === 'fast' && tallaDeCuenta(88, 100) === 'normal' && tallaDeCuenta(100, 160) === 'medium' && tallaDeCuenta(1, 100000) === 'slow',
    'relativa a la cifra: 72 → 74 rápida, 88 → 100 normal, 100 → 160 media, 1 → 100 000 lenta… y nunca más');
  ok(TALLAS_DE_CUENTA.every((t) => DURACIONES_MOTION[t.talla] <= DURACIONES_MOTION.slow), '🚨 ninguna cuenta pasa de una transición de página (`slow`): nada interminable');
  ok(tallaDeCuenta(12, 24) !== tallaDeCuenta(1850, 1862), '12 de 88 no es lo mismo que 12 de 1850');
  ok(duracionDeCuenta(88, 100, NORMAL) === DURACIONES_MOTION.normal, 'y sale en milisegundos del token, con la velocidad de Ajustes');
  ok(planDeCifra(88, 100, { modo: 'cuenta', ctx: NORMAL }).duracion === DURACIONES_MOTION.normal && planDeCifra(1, 100000, { modo: 'cuenta', ctx: NORMAL }).duracion === DURACIONES_MOTION.slow,
    'la cuenta usa esa duración por defecto (`auto`)…');
  ok(planDeCifra(1, 100000, { modo: 'cuenta', ctx: NORMAL, duracion: 'medium' }).duracion === DURACIONES_MOTION.medium,
    '…y una cifra que va con su barra, la de su barra (apartado 11)');
  ok(planDeCifra(1, 2, { modo: 'cuenta', ctx: REDUCIDO }).tipo === 'relevo' && planDeCifra(1, 2, { modo: 'cuenta', ctx: OFF }) === null,
    'en Reducido no cuenta (relevo); sin movimiento, nada (apartado 55)');
}

/* ---------------------------------------------------------------------------
   2 · LOS RELEVOS SEGUIDOS SE AGRUPAN (apartado 7)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · Cambios seguidos');
  ok(planDeCifra(10, 11, { ctx: NORMAL }).tipo === 'relevo', 'un cambio suelto: relevo');
  ok(planDeCifra(11, 12, { ctx: NORMAL, desdeUltimo: 60 }).tipo === 'agrupado', '🚨 otro a los 60 ms: se agrupa (se escribe, sin repetir el fundido)');
  ok(planDeCifra(11, 12, { ctx: NORMAL, desdeUltimo: DURACIONES_MOTION.normal + 1 }).tipo === 'relevo', '…pasado el relevo anterior, otro relevo');
  ok(planDeCifra(11, 12, { modo: 'cuenta', ctx: NORMAL, desdeUltimo: 10 }).tipo === 'cuenta', 'una cuenta no se agrupa así: la interrumpida sigue desde lo que se ve');
  ok(/ultimoRelevo\.current = ahora;/.test(CIFRA) && /desdeUltimo: ultimoRelevo\.current === null \? null : ahora - ultimoRelevo\.current/.test(CIFRA)
    && /if \(plan && plan\.tipo === 'relevo'\)/.test(CIFRA), '`CifraQueCambia` apunta cuándo fue su último relevo y no repite uno agrupado');
}

/* ---------------------------------------------------------------------------
   3 · LA CUENTA INTERRUMPIDA Y EL LECTOR DE PANTALLA (apartados 6, 8 y 9)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Interrumpir una cuenta y lo que oye VoiceOver');
  ok(/const desde = visible\.current !== null \? visible\.current : previo\.current;/.test(CIFRA),
    '🐛 apartado 6 — una cuenta que cambia de objetivo a mitad sale de lo que SE VE (antes, del objetivo de antes: la cifra saltaba)');
  ok(/visible\.current = v;/.test(CIFRA) && (CIFRA.match(/visible\.current = null/g) || []).length >= 3, '…lo que se ve se apunta en cada fotograma y se olvida al terminar');
  ok(/aria-hidden=\{contando \|\| undefined\}/.test(CIFRA) && /\{contando && <span className="sr-only">\{final\}<\/span>\}/.test(CIFRA),
    '♿ apartado 9 — mientras cuenta, lo que se ve va oculto al lector y el valor final va al lado; quieta, una sola cifra');
  ok(/const final = children !== undefined \? children : \(formato \? formato\(valor\) : valor\);/.test(CIFRA),
    'apartado 8 — y el final es EXACTAMENTE lo de siempre (decimales, unidades y moneda los pone quien la usa)');
  ok(/className=\{`cifra /.test(CIFRA) && /data-cifra=/.test(CIFRA), '…la cifra sigue siendo `.cifra` con su `data-cifra` (la F4 la lee así)');
  ok(CUENTAS_A_LA_VEZ === 4, 'el presupuesto de la F4: como mucho cuatro contando a la vez');
}

/* ---------------------------------------------------------------------------
   4 · QUÉ CLASE DE CIFRA ES (apartados 4, 14, 45)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · La clase de cada cifra');
  ok(['principal', 'con_barra', 'secundaria', 'estatica', 'reloj', 'identificador'].every((id) => claseDeCifra(id) && claseDeCifra(id).como),
    'principal, con su barra, secundaria, estática, reloj e identificador, cada una con cómo se mueve');
  ok(claseDeCifra('reloj').modo === null && claseDeCifra('identificador').modo === null && claseDeCifra('estatica').modo === null,
    '🚨 un reloj, un identificador y una cifra que no cambia NO se animan nunca');
  ok(claseDeCifra('con_barra').duracion === 'medium' && claseDeCifra('principal').modo === 'cuenta' && claseDeCifra('secundaria').modo === 'relevo',
    'la principal cuenta, la de una barra cuenta a su ritmo, el resto se releva');
  ok(claseDeCifra('inventada') === null, 'una clase que no existe no se inventa');
}

/* ---------------------------------------------------------------------------
   5 · EL EJE QUE NO BAILA (apartados 31 y 32)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Un eje estable');
  ok(pasoBonito(2400) === 1000 && pasoBonito(10) === 5 && pasoBonito(7, 4) === 2, 'pasos bonitos: 1, 2 o 5 × 10ⁿ');
  ok(igual(dominioEstable([7.5, 6, null, 8.2], { desdeCero: true, paso: 2, alMenos: 10 }), [0, 10]), 'Sueño: 0-10 h aunque la semana no pase de 8,2');
  ok(igual(dominioEstable([6, 7, 8.9], { desdeCero: true, paso: 2, alMenos: 10 }), dominioEstable([5, 9.5], { desdeCero: true, paso: 2, alMenos: 10 })),
    '🚨 dos semanas distintas, la misma escala: la línea viaja y el eje no salta');
  ok(igual(dominioEstable([7, 11.2], { desdeCero: true, paso: 2, alMenos: 10 }), [0, 12]), '…y si una noche pasa de 10 h, sube a un número redondo');
  ok(igual(dominioEstable([72.4, 71.8, 73.1], { desdeCero: false, paso: 2 }), [70, 76]), 'el peso: un eje redondo alrededor de los valores, no desde cero');
  ok(igual(dominioEstable([1850, 2100, 2400], { desdeCero: true }), [0, 3000]), 'las calorías: de 0 a un redondo');
  ok(igual(dominioEstable([], {}), ['auto', 'auto']) && igual(dominioEstable([null, undefined, NaN], {}), ['auto', 'auto']), 'sin datos no se inventa una escala');
  ok(/domain=\{dominioSueno\}/.test(leer('src/views/SleepView.jsx')) && /domain=\{dominioPeso\}/.test(leer('src/views/HealthView.jsx'))
    && /domain=\{dominioEstable\(\[\.\.\.evo\.puntos\.map\(\(p\) => p\.valor\), evo\.objetivo\]/.test(leer('src/views/NutritionView.jsx')),
  'las tres gráficas de Recharts llevan su eje estable (y la de Nutrición, con el objetivo dentro)');
  ok(animacionDeGrafica(REDUCIDO).isAnimationActive === false && animacionDeGrafica(NORMAL).animationDuration === DURACIONES_MOTION.cinematic, 'y siguen gobernadas por el motor (F4)');
}

/* ---------------------------------------------------------------------------
   6 · EL MAPA DE LOS DATOS Y LO QUE SE APLICA (apartados 1, 3, 10-14, 41-43)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · El mapa de los datos');
  ok(MAPA_DATOS.length >= 15 && MAPA_DATOS.every((m) => m.id && m.que && m.archivo && m.clase && m.patron && m.como), `cada dato que cambia, con su clase y cómo se mueve (${MAPA_DATOS.length})`);
  MAPA_DATOS.forEach((m) => ok(leer(m.archivo).includes(m.patron), `«${m.id}»: ${m.que} — en ${m.archivo}`));
  const clases = new Set([...CLASES_DE_CIFRA.map((c) => c.id), 'barra', 'grafica', 'ranking']);
  ok(MAPA_DATOS.every((m) => clases.has(m.clase)), 'cada uno, de una clase que existe');
  ok(MAPA_DATOS.some((m) => m.clase === 'reloj'), 'el mapa dice también lo que NO se anima (los relojes)');
  const BARRAS = ['src/views/ProductivityView.jsx', 'src/views/ObjectivesView.jsx', 'src/views/WellbeingView.jsx', 'src/views/RachasView.jsx'];
  ok(BARRAS.every((f) => /barra-progreso/.test(leer(f)) && !/transicion\(\s*['"]width['"]/.test(leer(f))),
    '🐛 apartados 10 y 11 — las seis barras que iban a `slow` escrito en su estilo, ahora con la clase compartida (`medium`, como las de la F14)');
  ok(!/import \{ transicion \} from '\.\.\/lib\/motion';/.test(leer('src/views/WellbeingView.jsx')), '…y sin importar lo que ya no usan');
  const CONTRIB = leer('src/components/contribucionMuscular.jsx');
  ok(/<ListaAnimada className="space-y-2">/.test(CONTRIB) && /\{visibles\.length === 0 && <EmptyHint/.test(CONTRIB) && !/visibles\.length === 0 \? \(/.test(CONTRIB),
    '🔓 apartados 41-43 — el ranking que se filtra es una `ListaAnimada`, montada aunque el filtro la vacíe');
  ok(/\{ modulo: 'layoutMotion', solo: \['ListaAnimada', 'Plegable'\]/.test(leer('src/lib/arquitecturaFitness.js')) && /import \{ ListaAnimada \} from '\.\/layoutMotion';/.test(CONTRIB),
    '…con la dependencia que Fitness ya tenía declarada (MS F10)');
  const F0 = HALLAZGOS_F0.find((h) => h.id === 'cifras_de_golpe');
  ok(F0 && F0.resuelto === 17, '🔓 el hallazgo `cifras_de_golpe` de la F0, resuelto en la F17');
  const cif = MOTION_MAP.find((e) => e.id === 'cifras');
  ok(cif && cif.estado !== 'sin_motion' && /MS F17/.test(cif.relacion), '…y el MOTION_MAP ya no dice «sin movimiento» para las cifras');
}

/* ---------------------------------------------------------------------------
   7 · EL PRESUPUESTO Y LA AUDITORÍA (apartados 4, 28, 45, 58, 63)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · El presupuesto y la auditoría');
  ok(PRESUPUESTO_DATOS.length === 4 && PRESUPUESTO_DATOS[0].orden === 1 && /Nada más/.test(PRESUPUESTO_DATOS[3].que), 'lo que se mueve en una actualización, por orden, y lo que no');
  const hoy = auditarDatos({ archivos: ARCHIVOS });
  ok(hoy.length === 0, `🚨 la auditoría, limpia con el código de hoy${hoy.length ? `: ${JSON.stringify(hoy.slice(0, 4))}` : ''}`);
  EJEMPLOS_MALOS_F17.forEach((e) => {
    ok(auditarDatos({ archivos: { [e.ruta]: e.src } }).some((x) => x.regla === e.regla), `…y caza su ejemplo malo: ${e.regla}`);
  });
  ok(auditarDatos({ archivos: { 'src/views/X.jsx': "<div style={{ width: `${p}%`, transition: transicion('width', 'slow') }} />" } }).length === 1,
    '🐛 caza las barras de antes de la fase, tal y como estaban escritas');
  ok(auditarDatos({ archivos: { 'src/views/X.jsx': '<CifraQueCambia valor={saldo} modo="cuenta">' } }).length === 0, '…y no salta con una cifra de verdad');
  ok(MAXIMO_CUENTAS_POR_ARCHIVO === 2, 'una pantalla tiene una cifra principal (dos, como mucho, por archivo)');
}

/* ---------------------------------------------------------------------------
   8 · LO QUE SE DECIDIÓ, LOS DOCUMENTOS Y EL RECORRIDO
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Decisiones, documentos y recorrido');
  ok(DECISIONES_F17.length >= 7 && DECISIONES_F17.every((d) => d.apartados.length && d.que && d.porque), 'las decisiones, con sus apartados y su motivo');
  ok(DECISIONES_F17.some((d) => /scaleX/.test(d.porque) && /width/.test(d.porque)), '…y por qué las barras siguen con `width` y no con `scaleX` (apartado 10)');
  ok(REVISADO_Y_BIEN_F17.length >= 5 && NO_EN_F17.length >= 3 && NO_EN_F17.every((n) => n.porque), 'lo revisado y bien, y lo que no se hace con su motivo');
  ok(NO_EN_F17.some((n) => /inventa/.test(n.porque)), '…sin inventar datos intermedios en una gráfica (apartado 30)');
  ok(CUANDO_F17.length >= 6, 'cuándo usar cada pieza');
  const recorrido = leer('scripts/test-app-real.mjs');
  const sec = recorrido.slice(recorrido.indexOf('── MS F17'));
  ok(/── MS F17 · Datos que cambian/.test(recorrido) && /trasCambio/.test(sec) && /sr-only/.test(sec) && /barra-progreso/.test(sec) && /recharts-yAxis/.test(sec),
    'el recorrido mide en Chromium la cuenta interrumpida, el valor final para VoiceOver, el ritmo de las barras y el eje de Sueño');
  const SIS = leer('docs/MOTION_SYSTEM.md');
  ok(/tallaDeCuenta/.test(SIS) && /dominioEstable/.test(SIS) && /MAPA_DATOS/.test(SIS) && /auditarDatos/.test(SIS) && /CLASES_DE_CIFRA/.test(SIS),
    'MOTION_SYSTEM.md explica el motor de datos, las cifras, las gráficas, los paneles y la auditoría (apartado 59)');
  ok(/¿Qué aporta este movimiento a la comprensión del dato\?/.test(SIS), '…con la regla permanente del apartado 63');
  ok(/\*\*F17\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F17');
  ok(!/framer-motion|react-spring|gsap|animejs|popmotion|motion-one|d3-transition/.test(leer('package.json')), 'ni una librería de animación en el paquete (apartado 60: ni una segunda arquitectura)');
}

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
