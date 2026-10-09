/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 19 — testing extremo, validación, regresión y motion QA automatizado

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f19.mjs

   Lo que se comprueba aquí, sobre el sistema ENTERO: la infraestructura que ya había; la matriz de QA (cada
   fila con la comprobación que la prueba, buscada en su archivo); la regresión contra las diecinueve fases;
   las primitivas por sus PROPIEDADES (curvas, cuenta, cascada, intensidad, FLIP); los tokens (referencias
   rotas, repetidos, literales sueltos); los `@keyframes`; de quién es cada animación (el mapa contra el CSS);
   las máquinas de estado recorridas enteras; los muelles barridos con valores extremos e imposibles; las
   peticiones que contestan desordenadas; las capas contra los imports de verdad; la cámara lenta y la
   inspección de toda la página. Cada auditoría con su ejemplo malo, y las de los hallazgos reconstruyendo
   el código de antes: una prueba que no puede ponerse roja no prueba nada (apartado 53).
   Lo que necesita fotogramas de verdad —interrumpir, repetir, desmontar, girar, Reducido, una sesión
   entera— está en la sección «MS F19» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  INFRAESTRUCTURA_PRUEBAS, PRIORIDADES_QA, MATRIZ_QA_MOTION, matrizSinPrueba, REGRESION_POR_FASE, regresionIncompleta,
  variablesDefinidas, referenciasRotas, ARCHIVOS_CON_EJEMPLOS, valoresRepetidosCss, valoresRepetidosJs,
  LITERALES_CLASIFICADOS, literalesSueltos, MAXIMO_PARADAS, keyframesConCuerpo, reposaEn, auditarKeyframes, auditarPropiedad,
  MAQUINAS_DE_ESTADO, recorrerMaquina, estabilidadDeMuelle, barridoDeMuelles, CAPAS_MOTION, capaDe, grafoDeImports,
  alcanzablesDesde, auditarCapas, PRUEBAS_DE_ESTRES, MODOS_DE_PRUEBA, HALLAZGOS_F19, REVISADO_Y_BIEN_F19, NO_EN_F19,
  REGLA_QA_PERMANENTE, EJEMPLOS_MALOS_F19, AUDITORIA_F19, auditoriaQA,
} from '../src/lib/qaMotion.js';
import {
  CURVAS_MOTION, SPRINGS_MOTION, STAGGER_MOTION, TOPES_ESCALA, TOPE_DISTANCIA_PX, DISTANCIAS_MOTION, ESCALAS_MOTION, PULSOS_MOTION,
  muestrearSpring, escalonDe, escalonado, intensificar, deltaFlip,
} from '../src/lib/motion.js';
import { MOTION_MAP } from '../src/lib/motionMapa.js';
import { decimalesDe, interpolarCifra, curvaDeCuenta, reservarCuenta, liberarCuenta, cuentasActivas, CUENTAS_A_LA_VEZ } from '../src/lib/datosMotion.js';
import { TRANSICIONES_ASINCRONAS, siguienteEstadoAsincrono, crearTurnos, MAPA_ASINCRONO, ESTADOS_ASINCRONOS } from '../src/lib/estadosAsincronos.js';
import { MUELLES_EN_USO } from '../src/lib/fisicaMotion.js';
import {
  camaraLenta, ritmoDeCamara, CAMARA_LENTA_MAXIMA, inspeccionarTodo, apiDeDepuracion, animarOrquestado, olvidarTodo,
  forzarDepuracion, auditarOrquestacion,
} from '../src/lib/orquestadorMotion.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}

const CSS = leer('src/index.css');
const ARCHIVOS = {};
const recorrer = (d) => readdirSync(join(RAIZ, d)).forEach((f) => {
  const p = `${d}/${f}`;
  if (statSync(join(RAIZ, p)).isDirectory()) recorrer(p);
  else if (/\.(jsx?|mjs)$/.test(f)) ARCHIVOS[p] = leer(p);
});
recorrer('src');
readdirSync(join(RAIZ, 'scripts')).filter((f) => /\.mjs$/.test(f)).forEach((f) => { ARCHIVOS[`scripts/${f}`] = leer(`scripts/${f}`); });
const VERIFICAR = leer('scripts/verificar.sh');
const RECORRIDO = ARCHIVOS['scripts/test-app-real.mjs'];

/* ---------------------------------------------------------------------------
   1 · LA INFRAESTRUCTURA QUE YA HABÍA (apartado 1)
   --------------------------------------------------------------------------- */
{
  console.log('\n1 · La infraestructura que ya había, sin instalar nada');
  const hay = INFRAESTRUCTURA_PRUEBAS.filter((i) => i.hay);
  ok(['unitarias', 'renderizado', 'invariantes', 'e2e', 'e2e_parcial', 'build', 'puerta'].every((id) => hay.some((i) => i.id === id)), `las siete piezas que hay (${hay.length})`);
  ok(hay.filter((i) => /^[\w./-]+$/.test(i.donde)).length >= 5 && hay.filter((i) => /^[\w./-]+$/.test(i.donde)).every((i) => existsSync(join(RAIZ, i.donde))), '…y cada archivo que nombra existe');
  ok(INFRAESTRUCTURA_PRUEBAS.filter((i) => !i.hay).every((i) => i.porque && i.porque.length > 40), 'lo que no hay (lint, tipos, CI, capturas) lleva su motivo');
  ok(!existsSync(join(RAIZ, '.github/workflows')), 'y es verdad que no hay CI: ni `.github/workflows`');
  const pkg = JSON.parse(leer('package.json'));
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  ok(!['jest', 'vitest', 'eslint', 'typescript', '@testing-library/react', 'framer-motion', 'storybook'].some((d) => d in deps),
    'apartado 1 — no se ha instalado ninguna herramienta: ni un framework de pruebas, ni lint, ni tipos, ni una librería de animación');
}

/* ---------------------------------------------------------------------------
   2 · LA MATRIZ DE QA (apartados 2 y 54)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · La matriz de QA: cada fila con la comprobación que la prueba');
  const campos = ['interaccion', 'estado', 'dispositivo', 'entrada', 'preferencia', 'esperado'];
  ok(MATRIZ_QA_MOTION.length >= 20 && MATRIZ_QA_MOTION.every((f) => campos.every((c) => f[c])), `las seis columnas del apartado 2 en cada fila (${MATRIZ_QA_MOTION.length} filas)`);
  ok(new Set(MATRIZ_QA_MOTION.map((f) => f.id)).size === MATRIZ_QA_MOTION.length, 'sin filas repetidas');
  ok(MATRIZ_QA_MOTION.every((f) => PRIORIDADES_QA.includes(f.prioridad)) && PRIORIDADES_QA.every((p) => MATRIZ_QA_MOTION.some((f) => f.prioridad === p)),
    'apartado 54 — cada fila con su prioridad, y hay filas de todas, de la interacción crítica a lo decorativo');
  ok(PRIORIDADES_QA[0] === 'interaccion_critica' && PRIORIDADES_QA.at(-1) === 'decorativo', '…en el orden del enunciado');
  ok(['normal', 'reducido', 'off'].every((p) => MATRIZ_QA_MOTION.some((f) => f.preferencia === p)), 'cubre Normal, Reducido y Sin movimiento');
  ok(['tacto', 'ratón', 'teclado'].every((e) => MATRIZ_QA_MOTION.some((f) => f.entrada === e)), 'cubre tacto, ratón y teclado (apartado 23)');
  const sinPrueba = matrizSinPrueba(MATRIZ_QA_MOTION, ARCHIVOS);
  ok(sinPrueba.length === 0, `🚨 cada fila dice dónde se prueba, y la comprobación ESTÁ en ese archivo${sinPrueba.length ? `: ${sinPrueba.map((f) => f.id).join(', ')}` : ''}`);
  ok(MATRIZ_QA_MOTION.every((f) => VERIFICAR.includes(f.prueba.archivo.replace('scripts/', '')) || f.prueba.archivo === 'scripts/test-app-real.mjs'),
    '…y ese archivo lo ejecuta `verificar.sh`');
  const falsa = [{ ...MATRIZ_QA_MOTION[0], id: 'inventada', prueba: { archivo: 'scripts/test-app-real.mjs', marca: 'MS F19 — una comprobación que nadie escribió' } }];
  ok(matrizSinPrueba(falsa, ARCHIVOS).length === 1, '…y una fila que dice estar probada sin estarlo se caza');
}

/* ---------------------------------------------------------------------------
   3 · LA REGRESIÓN CONTRA TODAS LAS FASES (apartado 57)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · La regresión: las diecinueve fases, con su suite y su sección');
  ok(REGRESION_POR_FASE.length === 20 && REGRESION_POR_FASE.every((f, i) => f.fase === i), 'de la F0 a la F19, en orden');
  const faltas = regresionIncompleta({ archivos: ARCHIVOS, verificar: VERIFICAR, recorrido: RECORRIDO });
  ok(faltas.length === 0, `🚨 cada fase tiene su suite, \`verificar.sh\` la ejecuta y su sección está en el recorrido${faltas.length ? `: ${JSON.stringify(faltas)}` : ''}`);
  ok(REGRESION_POR_FASE.filter((f) => !f.seccion).every((f) => f.sinSeccion), 'la que no tiene sección (la F0) dice por qué');
  const sinF5 = VERIFICAR.replace(/test-motion-f5\.mjs/g, 'quitada.mjs');
  ok(regresionIncompleta({ archivos: ARCHIVOS, verificar: sinF5, recorrido: RECORRIDO }).some((f) => f.fase === 5 && f.falta === 'verificar'),
    '…y si `verificar.sh` dejara de ejecutar una, se caza');
  const sinSeccion = RECORRIDO.replace('/* ── MS F7 ', '/* ── otra cosa ');
  ok(regresionIncompleta({ archivos: ARCHIVOS, verificar: VERIFICAR, recorrido: sinSeccion }).some((f) => f.fase === 7 && f.falta === 'seccion'), '…y si se perdiera una sección del recorrido, también');
}

/* ---------------------------------------------------------------------------
   4 · LAS PRIMITIVAS, POR SUS PROPIEDADES (apartado 3)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Las primitivas por sus propiedades: curvas, cuenta, cascada, intensidad y FLIP');
  /* Una curva de CSS: x(t) y y(t) de un Bézier cúbico con P0 = (0, 0) y P3 = (1, 1). */
  const bezier = (c) => {
    const [x1, y1, x2, y2] = c.match(/-?\d*\.?\d+/g).map(Number);
    const B = (p1, p2, t) => 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3;
    return { x1, y1, x2, y2, en: (t) => ({ x: B(x1, x2, t), y: B(y1, y2, t) }) };
  };
  const curvas = Object.entries(CURVAS_MOTION).filter(([, v]) => v.startsWith('cubic-bezier'));
  ok(curvas.length === 5 && curvas.every(([, v]) => { const b = bezier(v); return b.x1 >= 0 && b.x1 <= 1 && b.x2 >= 0 && b.x2 <= 1; }),
    'cada curva es una función del tiempo válida: sus puntos de control en x caen entre 0 y 1 (si no, el navegador la descarta)');
  const muestras = (v) => { const b = bezier(v); return Array.from({ length: 101 }, (_, i) => b.en(i / 100)); };
  ok(curvas.every(([, v]) => { const m = muestras(v); return m.every((p, i) => i === 0 || p.x >= m[i - 1].x - 1e-12); }), 'el tiempo avanza siempre (x monótona)');
  ok(curvas.every(([, v]) => muestras(v).every((p) => p.y >= -1e-9 && p.y <= 1 + 1e-9)),
    'ninguna curva se pasa ni retrocede: JosStyle no rebota con las curvas (lo que rebota sería un muelle, y ninguno de los que se usan lo hace)');
  ok(curvas.every(([, v]) => { const m = muestras(v); return Math.abs(m[0].y) < 1e-12 && Math.abs(m[100].y - 1) < 1e-12; }), 'empiezan en 0 y acaban en 1');
  const ts = Array.from({ length: 51 }, (_, i) => i / 50);
  ok(curvaDeCuenta(0) === 0 && curvaDeCuenta(1) === 1 && curvaDeCuenta(-3) === 0 && curvaDeCuenta(7) === 1 && ts.every((t, i) => i === 0 || curvaDeCuenta(t) >= curvaDeCuenta(ts[i - 1])),
    'la curva de una cuenta empieza en 0, acaba en 1, nunca retrocede y no se sale fuera de [0, 1]');
  ok(interpolarCifra(1, 40, 0) === 1 && interpolarCifra(1, 40, 1) === 40 && interpolarCifra(80, 40, 1) === 40 && interpolarCifra(5, 80, 2) === 80 && interpolarCifra(5, 80, -1) === 5,
    'una cifra que cuenta acaba EXACTAMENTE en su valor, también si el tiempo se pasa (lo que garantiza el «40» del apartado 33)');
  ok(ts.every((t, i) => i === 0 || interpolarCifra(20, 5, t) <= interpolarCifra(20, 5, ts[i - 1])) && ts.every((t) => { const v = interpolarCifra(1.25, 3.5, t, 2); return Number(v.toFixed(2)) === v; }),
    '…bajando sin rebotar, y con los decimales de la cifra (ni uno de más)');
  ok(decimalesDe(12.5) === 1 && decimalesDe(1850) === 0 && decimalesDe(NaN) === 0 && decimalesDe(1e-9) === 0, 'los decimales de una cifra, también de lo que no es un número');
  ok([0, 1, 5, 6, 50, 500, -3, NaN, 'x'].every((i) => { const e = escalonDe(i); return e >= 0 && e <= STAGGER_MOTION.escalones - 1; }),
    `una cascada tiene como mucho ${STAGGER_MOTION.escalones} escalones, con cualquier índice (también negativo o que no es un número)`);
  ok(escalonDe(0, { total: 5, direccion: 'inversa' }) === 4 && escalonDe(4, { total: 5, direccion: 'inversa' }) === 0 && escalonDe(0, { total: 5, direccion: 'centro' }) === escalonDe(4, { total: 5, direccion: 'centro' }),
    'la inversa empieza por el final y la del centro es simétrica');
  const definidas = variablesDefinidas({ css: CSS });
  ok([0, 3, 9, 600].every((i) => { const v = escalonado(i)['--motion-retraso']; const n = v.match(/--motion-retraso-\d+/)[0]; return definidas.has(n); }),
    'cada retraso de una cascada apunta a un token que existe en `index.css`');
  const intensidades = [0, 0.4, 1, 1.6, 3, 50];
  ok(Object.keys(DISTANCIAS_MOTION).every((id) => intensidades.every((I) => { const d = intensificar('distancia', id, I); return d >= 0 && d <= TOPE_DISTANCIA_PX; })),
    `con cualquier intensidad, una distancia se queda entre 0 y su tope (${TOPE_DISTANCIA_PX} px)`);
  ok(Object.keys(ESCALAS_MOTION).every((id) => intensidades.every((I) => { const e = intensificar('escala', id, I); return e >= TOPES_ESCALA.marca.min && e <= 1; }))
    && Object.keys(PULSOS_MOTION).every((id) => intensidades.every((I) => { const p = intensificar('pulso', id, I); return p >= 1 && p <= TOPES_ESCALA.marca.max; })),
    'una escala nunca pasa de sus dos techos (F1, C-52), ni con una intensidad absurda');
  ok(intensificar('distancia', 'large', 0) === 0 && intensificar('escala', 'normal', 0) === 1 && intensificar('pulso', 'firma', 0) === 1, 'con intensidad 0 no hay movimiento: «Sin movimiento» de verdad');
  ok(Object.keys(DISTANCIAS_MOTION).every((id) => intensidades.every((I, i) => i === 0 || intensificar('distancia', id, I) >= intensificar('distancia', id, intensidades[i - 1]))),
    'más intensidad nunca recorre menos');
  const a = { left: 10, top: 40, width: 200, height: 50 };
  const b = { left: 10, top: 90, width: 200, height: 50 };
  const d = deltaFlip(a, b);
  ok(deltaFlip(a, a) === null && d && d.dy === -50 && d.dx === 0 && d.sx === 1 && b.top + d.dy === a.top, 'FLIP: lo que no se ha movido no se anima, y la diferencia devuelve la fila a donde estaba');
  ok(deltaFlip(null, b) === null && deltaFlip(a, { ...b, width: 0, height: 0 }).sx === 1, '…sin medidas, nada; con una caja de ancho 0, sin dividir entre cero');
}

/* ---------------------------------------------------------------------------
   5 · LOS TOKENS: REFERENCIAS ROTAS, REPETIDOS Y LITERALES SUELTOS (apartados 4-7)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · Los tokens: ni una referencia rota, ni un valor repetido sin querer, ni un literal suelto');
  const rotas = referenciasRotas({ css: CSS, archivos: ARCHIVOS });
  ok(rotas.length === 0, `🚨 ni un \`var(--…)\` que no defina nadie, en el CSS ni en las piezas${rotas.length ? `: ${JSON.stringify(rotas.slice(0, 5))}` : ''}`);
  ok(referenciasRotas({ css: EJEMPLOS_MALOS_F19.referenciaRota.css }).some((r) => r.variable === '--motion-dur-rapido'), '…y un token mal escrito se caza (el CSS no se queja: se queda sin duración)');
  ok(referenciasRotas({ css: CSS, archivos: { 'src/x.jsx': 'const e = { animation: `var(--motion-inventado-${n})` };' } }).some((r) => /--motion-inventado-/.test(r.variable)),
    '…y un prefijo dinámico que no empieza ningún token, también');
  ok(referenciasRotas({ css: CSS, archivos: { ...ARCHIVOS, 'src/x.jsx': 'const e = { opacity: `var(--motion-opac-${n})` };' } }).length === 0, '…pero no uno que sí (`--motion-opac-`)');
  ok(ARCHIVOS_CON_EJEMPLOS.every((a) => a in ARCHIVOS), 'los archivos que se saltan (los que guardan ejemplos malos) existen todos');
  ok(valoresRepetidosCss(CSS).length === 0 && valoresRepetidosJs().length === 0, 'ni dos tokens de una familia con el mismo valor, en `index.css` ni en `motion.js` (fuera del alias declarado)');
  ok(valoresRepetidosCss(EJEMPLOS_MALOS_F19.repetido.css).some((g) => g.nombres.includes('--motion-dur-rapida')), '…y uno de más se caza');
  ok(valoresRepetidosJs({ duracion: { fast: 160, rapida: 160 } }).length === 1, '…también en una tabla');
  ok(/--ease-premium:\s*cubic-bezier\(0\.32, 0\.72, 0, 1\)/.test(CSS) && !/--motion-curva-standard\s*:/.test(CSS) && CURVAS_MOTION.standard === 'cubic-bezier(0.32, 0.72, 0, 1)', 'la curva estándar tiene UN nombre en el CSS (`--ease-premium`), con el valor de `standard` en `motion.js`');
  const literales = literalesSueltos({ css: CSS, archivos: ARCHIVOS });
  ok(literales.filter((l) => l.clase === 'accidental').length === 0, `🚨 apartado 6 — ni un literal de tiempo o de curva accidental${literales.some((l) => l.clase === 'accidental') ? `: ${JSON.stringify(literales.filter((l) => l.clase === 'accidental'))}` : ''}`);
  ok(literales.length === LITERALES_CLASIFICADOS.length && literales.every((l) => l.clase === 'correcto'), `los que hay (${literales.length}) son los de «Sin movimiento» y un retraso a cero, clasificados uno a uno`);
  ok(literalesSueltos({ css: EJEMPLOS_MALOS_F19.literal.css }).some((l) => l.clase === 'accidental'), '…y un `250ms` escrito a mano se caza');
  ok(literalesSueltos({ css: CSS, archivos: { 'src/views/X.jsx': "const s = { transition: 'opacity .2s cubic-bezier(.1,.2,.3,1)' };" } }).some((l) => l.archivo === 'src/views/X.jsx'), '…y un `cubic-bezier` en una vista');
  const todo = Object.entries(ARCHIVOS).filter(([a]) => /^src\/(views|components)\/|^src\/App\.jsx$/.test(a)).map(([, s]) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')).join('\n');
  ok(!/className="[^"]*\btransition-all\b/.test(todo) && !/transition:\s*all\b/.test(CSS.replace(/\/\*[\s\S]*?\*\//g, '')), '🚨 apartado 7 — ni un `transition-all` en una clase ni un `transition: all` en el CSS');
}

/* ---------------------------------------------------------------------------
   6 · LOS @keyframes (apartado 8)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Los @keyframes: ni repetidos, ni sin uso, ni demasiado complejos, ni entradas que no reposan');
  const k = auditarKeyframes(CSS);
  ok(k.total > 30, `los ${k.total} del CSS`);
  ok(k.repetidos.length === 0 && k.sinUso.length === 0 && k.complejos.length === 0 && k.noReposan.length === 0, `🚨 hoy, ni uno de los cuatro (${JSON.stringify({ repetidos: k.repetidos, sinUso: k.sinUso, complejos: k.complejos, noReposan: k.noReposan })})`);
  const antes = CSS.replace('@keyframes marcaAparece {', '@keyframes iconoCambia {\n  from { opacity: var(--motion-opac-subtle); transform: scale(var(--motion-escala-hero)); }\n  to { opacity: 1; transform: none; }\n}\n@keyframes marcaAparece {')
    .replace('.icono-cambia {\n  animation: marcaAparece', '.icono-cambia {\n  animation: iconoCambia');
  ok(auditarKeyframes(antes).repetidos.some((r) => r.nombres.includes('iconoCambia') && r.nombres.includes('marcaAparece')),
    '🐛 hallazgo `keyframe_repetido` — con el CSS de la F18 (el `iconoCambia` aparte), se caza: eran el mismo cuerpo');
  ok(/@keyframes marcaAparece/.test(CSS) && /\.icono-cambia \{\n  animation: marcaAparece/.test(CSS) && /\.fit-serie-hecha \{\n  animation: marcaAparece/.test(CSS) && !/@keyframes (iconoCambia|fitSerieHecha)/.test(CSS),
    '…y ahora es UNO, `marcaAparece`, para el icono que cambia y el ✓ de una serie');
  ok(auditarKeyframes(EJEMPLOS_MALOS_F19.keyframeRepetido.css).repetidos.length === 1, 'dos `@keyframes` iguales se cazan');
  ok(auditarKeyframes(EJEMPLOS_MALOS_F19.keyframeQueNoReposa.css).noReposan.some((n) => n.nombre === 'c'), 'una entrada que acaba fuera de su reposo se caza (saltaría al terminar)');
  ok(auditarKeyframes(EJEMPLOS_MALOS_F19.keyframeComplejo.css).complejos.some((c) => c.nombre === 'd' && c.paradas > MAXIMO_PARADAS), `más de ${MAXIMO_PARADAS} paradas se caza`);
  ok(auditarKeyframes('@keyframes z { from { opacity: 0; } to { opacity: 1; } }').sinUso.includes('z'), 'uno que no nombra ninguna regla se caza');
  ok(reposaEn('opacity: 1; transform: none') && reposaEn('transform: translateY(0) scale(1)') && reposaEn('opacity: 1') && !reposaEn('opacity: 0.9') && !reposaEn('transform: scale(1.02)'),
    'reposar es opacidad 1 y sin transformar (un `translateY(0) scale(1)` también lo es)');
  ok(keyframesConCuerpo('@keyframes p { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }')[0].paradas.length === 2, 'una parada con dos instantes (`0%, 100%`) cuenta como una');
}

/* ---------------------------------------------------------------------------
   7 · DE QUIÉN ES CADA ANIMACIÓN (apartado 9)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · De quién es cada animación: el mapa contra el CSS que la mueve');
  const p = auditarPropiedad({ css: CSS });
  ok(p.discrepancias.length === 0 && p.ambiguas.length === 0 && p.sinDueno.length === 0, `🚨 hoy, cada clase del mapa dice la duración, la curva y el @keyframes que le pone el CSS${p.discrepancias.length ? `: ${JSON.stringify(p.discrepancias)}` : ''}`);
  const mapaViejo = MOTION_MAP.map((e) => (e.id === 'menus' ? { ...e, duracion: 220 } : e.id === 'plegable' ? { ...e, duracion: 220 } : e.id === 'cifras' ? { ...e, easing: '--motion-curva-standard' } : e));
  const viejo = auditarPropiedad({ css: CSS, mapa: mapaViejo });
  ok(viejo.discrepancias.some((d) => d.id === 'menus' && d.campo === 'duracion' && d.css.includes(160)), '🐛 hallazgo `mapa_menus` — con el mapa de antes, los menús decían 220 y su clase va en 160: se caza');
  ok(viejo.discrepancias.some((d) => d.id === 'plegable' && d.campo === 'duracion' && d.css.includes(280)), '🐛 hallazgo `mapa_plegable` — y `Plegable` decía 220, la de antes de la F14 (abre en 280)');
  ok(viejo.ambiguas.some((a) => a.clase === 'despliegue-entra'), '…y una clase que dos entradas describen con duraciones distintas es ambigua');
  ok(viejo.discrepancias.some((d) => d.id === 'cifras' && d.campo === 'curva_inexistente'), '🐛 hallazgo `mapa_cifras` — y las cifras nombraban `--motion-curva-standard`, que no existe en el CSS: se caza');
  ok(MOTION_MAP.find((e) => e.id === 'cifras').easing === '--ease-premium' && MOTION_MAP.find((e) => e.id === 'menus').duracion === 160 && MOTION_MAP.find((e) => e.id === 'plegable').duracion === 280, 'el mapa, arreglado');
  ok(auditarPropiedad(EJEMPLOS_MALOS_F19.propiedad).discrepancias.some((d) => d.id === 'cosa' && d.campo === 'duracion'), 'el ejemplo malo se caza');
  ok(auditarPropiedad({ css: CSS, mapa: [{ id: 'huerfana', clase: 'x-y', duracion: 100 }] }).sinDueno.includes('huerfana'), 'una entrada sin componente ni ubicación no tiene dueño');
  const doc = leer('docs/MOTION_MAP.md');
  ok(/Menús «⋯» y desplegables[\s\S]{0,1600}\| Duración \| 160 ms/.test(doc) || doc.includes('MS F19 — decía 220'), '`docs/MOTION_MAP.md` se ha generado otra vez con el mapa arreglado');
}

/* ---------------------------------------------------------------------------
   8 · LAS MÁQUINAS DE ESTADO, RECORRIDAS ENTERAS (apartado 10)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Las máquinas de estado: todos los estados, todos los eventos');
  const r = Object.fromEntries(MAQUINAS_DE_ESTADO.map((m) => [m.id, recorrerMaquina(m)]));
  const sana = (x) => x.inalcanzables.length === 0 && x.invalidos.length === 0 && x.sinVuelta.length === 0 && x.desconocido.length === 0;
  ok(sana(r.presencia), `la máquina de la presencia: se llega a todo, nada imposible, desde todo se vuelve al reposo (${JSON.stringify(r.presencia)})`);
  ok(sana(r.gesto), `la máquina del gesto: igual, con sus ocho eventos (${r.gesto.alcanzables.length} estados)`);
  ok(sana(r.asincrona), `🚨 la máquina asíncrona: los ${ESTADOS_ASINCRONOS.length} estados alcanzables, y desde todos se vuelve al reposo (${JSON.stringify(r.asincrona.inalcanzables)})`);
  const vieja = { ...MAQUINAS_DE_ESTADO.find((m) => m.id === 'asincrona'), siguiente: (e, ev) => (ev === 'sinConexion' && e !== 'saving' ? e : siguienteEstadoAsincrono(e, ev)) };
  ok(recorrerMaquina(vieja).inalcanzables.includes('offline'), '🐛 hallazgo `offline_inalcanzable` — con las transiciones de antes, «Sin conexión» no se alcanzaba nunca: se caza');
  ok(siguienteEstadoAsincrono('saved', 'sinConexion') === 'offline' && siguienteEstadoAsincrono('offline', 'reconectar') === 'saving' && siguienteEstadoAsincrono('saving', 'sinConexion') === 'pending' && siguienteEstadoAsincrono('loading', 'sinConexion') === 'loading',
    '…ahora: perder la conexión con algo guardado lleva ahí y volver manda lo pendiente; a medio guardado queda pendiente; a media carga es la carga la que falla');
  const conexion = MAPA_ASINCRONO.find((o) => o.id === 'conexion');
  ok(conexion && conexion.estados.join() === 'offline,saving,saved', 'la operación de la conexión pasa por «Guardando», que es lo que hace la máquina (no por «Reintentando», que es de una carga)');
  ok(Object.values(TRANSICIONES_ASINCRONAS).every((t) => Object.values(t).every((d) => ESTADOS_ASINCRONOS.some((e) => e.id === d))), 'ninguna transición lleva a un estado que no existe');
  const rota = recorrerMaquina(EJEMPLOS_MALOS_F19.maquina);
  ok(rota.inalcanzables.includes('c') && rota.sinVuelta.includes('b'), 'el ejemplo malo: un estado al que no se llega y uno del que no se vuelve, los dos cazados');
  ok(recorrerMaquina({ id: 'x', estados: ['a', 'b'], inicial: 'a', reposo: ['a'], eventos: ['ir'], siguiente: (e) => (e === 'a' ? 'zeta' : e) }).invalidos.length === 1, '…y una transición a un estado que no existe');
  ok(recorrerMaquina({ id: 'y', estados: ['a', 'b'], inicial: 'a', reposo: ['a'], eventos: ['ir'], siguiente: (e, ev) => (ev === 'ir' ? (e === 'a' ? 'b' : 'a') : 'b') }).desconocido.length > 0, '…y un evento desconocido que cambia el estado');
}

/* ---------------------------------------------------------------------------
   9 · LOS MUELLES, CON VALORES EXTREMOS E IMPOSIBLES (apartado 16)
   --------------------------------------------------------------------------- */
{
  console.log('\n9 · Los muelles: extremos, al revés, a tope e imposibles');
  const problemas = barridoDeMuelles();
  ok(problemas.length === 0, `🚨 ningún muelle devuelve un fotograma que no sea un número, ni deja de terminar, ni rebota si se usa, ni oscila${problemas.length ? `: ${JSON.stringify(problemas.slice(0, 3))}` : ''}`);
  ok(MUELLES_EN_USO.length > 0 && MUELLES_EN_USO.every((id) => estabilidadDeMuelle(id, { desde: 0, hasta: 300, reposo: { distancia: 0.25, velocidad: 5 } }).cruces === 0), `los que se usan (${MUELLES_EN_USO.join(', ')}) llegan sin cruzar su destino`);
  const imposibles = [{ desde: 0, hasta: 100, velocidad: NaN }, { desde: NaN, hasta: 100 }, { desde: 0, hasta: Infinity }, { desde: 0, hasta: 100, fps: 0 }];
  ok(imposibles.every((o) => { const m = muestrearSpring('normal', o); return m.valores.every(Number.isFinite) && Number.isFinite(m.duracionMs); }),
    '🐛 hallazgo `muelle_imposible` — una velocidad, un origen o un destino que no son números, o `fps` 0: fotogramas que son números y una duración finita');
  ok([{ rigidez: 0, amortiguacion: 0, masa: 1 }, { rigidez: 170, amortiguacion: 26, masa: 0 }, { rigidez: 170, amortiguacion: -5, masa: 1 }].every((s) => { const e = estabilidadDeMuelle(s, { desde: 0, hasta: 100 }); return e.finito && e.sobrepaso < 0.5; }),
    '…y lo que no es un muelle (rigidez 0, masa 0, amortiguación negativa) no oscila hasta el infinito: es el `normal`');
  const normal = muestrearSpring('normal', { desde: 0, hasta: 100 });
  ok(JSON.stringify(normal) === JSON.stringify(muestrearSpring(SPRINGS_MOTION.normal, { desde: 0, hasta: 100 })) && normal.valores.at(-1) === 100,
    'con valores de verdad, el muelle es el de siempre (el arreglo no cambia ni un fotograma)');
  ok(estabilidadDeMuelle('normal', { desde: 0, hasta: 100, velocidad: NaN }).finito, 'el detector mide lo que dice (un muelle sano sale sano)');
}

/* ---------------------------------------------------------------------------
   10 · LAS PETICIONES QUE CONTESTAN DESORDENADAS (apartados 36 y 38)
   --------------------------------------------------------------------------- */
{
  console.log('\n10 · La carrera: tres peticiones, tres respuestas en otro orden');
  const turnos = crearTurnos();
  const pantalla = { valor: null };
  const a = turnos.nuevo();
  const b = turnos.nuevo();
  const c = turnos.nuevo();
  const responder = (t, v) => { if (t.vigente()) pantalla.valor = v; };
  responder(c, 'C');
  responder(a, 'A');
  responder(b, 'B');
  ok(pantalla.valor === 'C' && !a.vigente() && !b.vigente() && c.vigente(), 'apartado 36 — A, B y C contestan C, A, B: gana C, la última pedida; las respuestas viejas no tocan la pantalla');
  const t2 = crearTurnos();
  const carga = t2.nuevo();
  t2.cerrar();
  ok(!carga.vigente() && !t2.nuevo().vigente(), 'apartado 38 — cargar y navegar a otra pantalla: la respuesta que llega después no toca una pantalla que ya no está');
  const t3 = crearTurnos();
  const x = t3.nuevo();
  t3.cancelar();
  const y = t3.nuevo();
  ok(!x.vigente() && y.vigente(), '…y cancelar invalida lo que había sin impedir pedir otra vez');
  const base = cuentasActivas();
  const reservas = Array.from({ length: CUENTAS_A_LA_VEZ + 3 }, () => reservarCuenta());
  ok(reservas.filter(Boolean).length === CUENTAS_A_LA_VEZ - base, `como mucho ${CUENTAS_A_LA_VEZ} cifras cuentan a la vez: las demás se relevan`);
  reservas.filter(Boolean).forEach(() => liberarCuenta());
  liberarCuenta(); liberarCuenta();
  ok(cuentasActivas() === Math.max(0, base - 2) || cuentasActivas() === 0, 'y liberar de más nunca deja el contador por debajo de cero');
}

/* ---------------------------------------------------------------------------
   11 · LA SALUD DEL SISTEMA: LAS CAPAS (apartado 68)
   --------------------------------------------------------------------------- */
{
  console.log('\n11 · La salud del sistema: las capas, contra los imports de verdad');
  const c = auditarCapas({ archivos: ARCHIVOS });
  ok(c.noExisten.length === 0 && c.fueraDelMapa.length === 0, `cada archivo del movimiento está en su capa, y no hay ninguno fuera del mapa (${JSON.stringify({ noExisten: c.noExisten, fuera: c.fueraDelMapa })})`);
  ok(c.haciaArriba.length === 0, `🚨 nadie importa hacia arriba: las hojas no importan nada del movimiento, el motor solo el orquestador, los sistemas el motor y las piezas los sistemas${c.haciaArriba.length ? `: ${JSON.stringify(c.haciaArriba)}` : ''}`);
  ok(c.hojasConImports.length === 0 && grafoDeImports(ARCHIVOS)['src/lib/orquestadorMotion.js'].length === 0, 'el orquestador es una hoja: no importa nada (recibe valores ya resueltos)');
  ok(c.auditoriasEnLaApp.length === 0, `🚨 la aplicación no importa las auditorías (el mapa, el lenguaje, el pulido ni este QA) — ${CAPAS_MOTION.find((x) => x.id === 'auditorias').archivos.length} archivos que solo leen las pruebas`);
  ok(c.sinUsar.length === 0, `todo lo que está en las capas del motor, los sistemas y las piezas lo usa la aplicación de verdad (alcanzable desde \`main.jsx\`)${c.sinUsar.length ? `: ${c.sinUsar.join(', ')}` : ''}`);
  const alc = alcanzablesDesde(grafoDeImports(ARCHIVOS));
  ok(alc.has('src/lib/motion.js') && alc.has('src/lib/orquestadorMotion.js') && alc.has('src/components/motion.jsx') && !alc.has('src/lib/qaMotion.js'), 'el recorrido de imports sale de `main.jsx` y llega al motor, al orquestador y a las piezas, no a este archivo');
  const roto = { ...ARCHIVOS, 'src/lib/motion.js': `${ARCHIVOS['src/lib/motion.js']}\nimport { X } from './pulidoMotion';` };
  ok(auditarCapas({ archivos: roto }).haciaArriba.some((h) => h.archivo === 'src/lib/motion.js' && h.importa === 'src/lib/pulidoMotion.js'), '…y si el motor importara una auditoría, se caza');
  const enLaApp = { ...ARCHIVOS, 'src/App.jsx': `import { auditoriaQA } from './lib/qaMotion';\n${ARCHIVOS['src/App.jsx']}` };
  ok(auditarCapas({ archivos: enLaApp }).auditoriasEnLaApp.includes('src/lib/qaMotion.js'), '…y si la aplicación importara el QA, también');
  ok(auditarCapas({ archivos: { ...ARCHIVOS, 'src/lib/otroMotion.js': 'export const x = 1;' } }).fueraDelMapa.includes('src/lib/otroMotion.js'), '…y un sistema de movimiento nuevo sin capa (un sistema paralelo) se caza');
  ok(capaDe('src/lib/orquestadorMotion.js') === 0 && capaDe('src/lib/motion.js') === 1 && capaDe('src/components/motion.jsx') === 3, 'hoja → motor → sistemas → piezas');
}

/* ---------------------------------------------------------------------------
   12 · LA CÁMARA LENTA Y LA INSPECCIÓN DE TODA LA PÁGINA (apartados 41-43)
   --------------------------------------------------------------------------- */
{
  console.log('\n12 · La cámara lenta y la inspección de toda la página (solo depuración)');
  const escuchas = [];
  const animFalsa = (target) => ({ playState: 'running', playbackRate: 1, effect: { target, getTiming: () => ({ duration: 220, delay: 0, easing: 'linear' }) }, finished: new Promise(() => {}), cancel() { this.playState = 'idle'; } });
  const elFalso = (nombre) => { const el = { tagName: 'DIV', classList: [nombre], dataset: {}, anims: [], animate(f, o) { const a = animFalsa(el); el.anims.push(a); return a; }, getAnimations: () => el.anims.filter((a) => a.playState === 'running') }; return el; };
  const viejo = elFalso('ya-moviendose');
  viejo.anims.push(animFalsa(viejo));
  const docFalso = {
    documentElement: { getAttribute: () => 'normal' },
    addEventListener: (t, f, c) => escuchas.push({ t, f, c }),
    removeEventListener: (t, f) => { const i = escuchas.findIndex((e) => e.t === t && e.f === f); if (i >= 0) escuchas.splice(i, 1); },
    getAnimations: () => viejo.getAnimations(),
  };
  const docAntes = globalThis.document;
  globalThis.document = docFalso;
  try {
    forzarDepuracion(false);
    ok(camaraLenta(4) === 1 && escuchas.length === 0, 'sin la consola de depuración (producción) no existe: no hace nada');
    forzarDepuracion(true);
    ok(camaraLenta(4) === 4 && ritmoDeCamara() === 0.25, 'con ella, `camaraLenta(4)` pone a un cuarto');
    ok(escuchas.length === 2 && escuchas.every((e) => e.c === true) && escuchas.map((e) => e.t).sort().join() === 'animationstart,transitionrun', '…escuchando lo que empieza en el CSS (`animationstart`, `transitionrun`)');
    ok(viejo.anims[0].playbackRate === 0.25, '…y lo que ya se movía, a un cuarto también');
    olvidarTodo();
    const el = elFalso('nueva');
    const a = animarOrquestado(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 220 }, { sistema: 'motor' });
    ok(a && a.playbackRate === 0.25, 'lo que pasa por el orquestador nace a un cuarto');
    const cssNueva = elFalso('css');
    cssNueva.anims.push(animFalsa(cssNueva));
    escuchas.find((e) => e.t === 'animationstart').f({ target: cssNueva });
    ok(cssNueva.anims[0].playbackRate === 0.25, 'y una animación de CSS que empieza después, también (por su `animationstart`)');
    ok(camaraLenta(400) === CAMARA_LENTA_MAXIMA && escuchas.length === 2, `con un tope (×${CAMARA_LENTA_MAXIMA}), y cambiarla no apila escuchadores`);
    ok(camaraLenta(1) === 1 && escuchas.length === 0 && viejo.anims[0].playbackRate === 1 && ritmoDeCamara() === 1, '`camaraLenta(1)` quita los escuchadores y devuelve el ritmo');
    ok(camaraLenta(NaN) === 1 && camaraLenta(-2) === 1 && escuchas.length === 0, 'un factor que no es un número, o menor que 1, la deja quitada');
    const b = animarOrquestado(elFalso('despues'), [{ opacity: 0 }, { opacity: 1 }], { duration: 220 }, { sistema: 'motor' });
    ok(b && b.playbackRate === 1, '…y lo que empieza después va a su ritmo');
    const lineas = inspeccionarTodo({ getAnimations: () => [...viejo.getAnimations(), ...el.getAnimations()] });
    ok(lineas.length === 2 && lineas.some((l) => l.fuente === 'orquestador' && l.sistema === 'motor') && lineas.some((l) => l.fuente === 'index.css'),
      'apartado 43 — `inspeccionarTodo()`: una línea por animación de la página, con su dueño (el orquestador y su sistema, o el CSS)');
    ok(inspeccionarTodo(null).length === 0 && inspeccionarTodo({}).length === 0, '…y sin documento, nada');
    ok(typeof apiDeDepuracion().camaraLenta === 'function' && typeof apiDeDepuracion().inspeccionarTodo === 'function', 'las dos en `window.__motion`');
  } finally {
    forzarDepuracion(null);
    olvidarTodo();
    if (docAntes === undefined) delete globalThis.document; else globalThis.document = docAntes;
  }
  const o = auditarOrquestacion({ archivos: { 'src/lib/orquestadorMotion.js': ARCHIVOS['src/lib/orquestadorMotion.js'] } });
  ok(o.hallazgos.length === 0, `la cámara lenta limpia sus escuchadores: la auditoría de fugas de la F11 sigue a cero en el orquestador (${JSON.stringify(o.cuentas)})`);
  ok(MODOS_DE_PRUEBA.length === 4 && MODOS_DE_PRUEBA.find((m) => m.id === 'camara_lenta').solo.includes('desarrollo'), 'apartado 41 — los modos de prueba: instantáneo, normal, lento y la cámara lenta, que solo existe en desarrollo');
}

/* ---------------------------------------------------------------------------
   13 · EL INFORME, LOS HALLAZGOS Y LO QUE QUEDA ESCRITO (apartados 53, 55-60, 66-69)
   --------------------------------------------------------------------------- */
{
  console.log('\n13 · El informe, los hallazgos y lo que queda escrito');
  const informe = auditoriaQA({ css: CSS, archivos: ARCHIVOS, verificar: VERIFICAR, recorrido: RECORRIDO });
  ok(informe.sano && informe.total === 0, `🚨 el informe entero, a cero: ${JSON.stringify(informe.partes)}`);
  ok(Object.keys(informe.partes).length === 13, 'trece cosas que mira, cada una con su cuenta');
  ok(HALLAZGOS_F19.length >= 6 && HALLAZGOS_F19.every((h) => ['P0', 'P1', 'P2', 'P3'].includes(h.prioridad) && h.arreglo && h.caza && h.resuelto === 19),
    `apartados 66 y 67 — cada hallazgo clasificado (P0-P3), con su arreglo y la auditoría que lo caza, y resuelto en esta fase (${HALLAZGOS_F19.map((h) => `${h.id}:${h.prioridad}`).join(', ')})`);
  ok(!HALLAZGOS_F19.some((h) => h.prioridad === 'P0' || h.prioridad === 'P1'), 'ninguno bloqueaba ni rompía la experiencia: los de esta fase son de coherencia (P2) y de pulido (P3)');
  ok(REVISADO_Y_BIEN_F19.length >= 8 && NO_EN_F19.every((n) => n.porque && n.porque.length > 40), 'lo revisado y bien, y lo que no se hace, cada uno con su motivo');
  ok(PRUEBAS_DE_ESTRES.every((p) => RECORRIDO.includes(`MS F19, apartado ${p.apartado}`)), `cada prueba de estrés está en la sección «MS F19» del recorrido (${PRUEBAS_DE_ESTRES.length})`);
  ok(REGLA_QA_PERMANENTE.como.length === 5 && /Reducir movimiento/.test(REGLA_QA_PERMANENTE.regla), 'apartado 69 — la regla permanente: funcional, tamaños, Reducido, rendimiento y visual');
  const cubiertos = new Set(AUDITORIA_F19.flatMap((a) => a.apartados));
  ok(Array.from({ length: 69 }, (_, i) => i + 1).every((n) => cubiertos.has(n)), 'los 69 apartados dicen dónde se resuelven');
  ok(Object.keys(EJEMPLOS_MALOS_F19).length >= 8, 'apartado 53 — cada auditoría trae su ejemplo malo, y esta suite comprueba que lo caza');
  const ui = leer('src/components/ui.jsx');
  ok(!/camaraLenta|inspeccionarTodo/.test(ui) && !/console\.log\(/.test(ARCHIVOS['src/lib/orquestadorMotion.js'].replace(/\/\*[\s\S]*?\*\//g, '')), 'apartado 60 — ni una herramienta de depuración fuera de la consola de desarrollo, ni un `console.log` suelto en el orquestador');
}

/* ---------------------------------------------------------------------------
   14 · LA DOCUMENTACIÓN Y LA PUERTA (apartados 58, 59 y 61)
   --------------------------------------------------------------------------- */
{
  console.log('\n14 · La documentación y la puerta');
  const SIS = leer('docs/MOTION_SYSTEM.md');
  const qa = SIS.slice(SIS.indexOf('## Motion QA'));
  ok(SIS.includes('## Motion QA') && ['estrategia', 'matriz', 'limitaciones', 'depuración', 'reducido', 'tamaños', 'rendimiento'].every((p) => new RegExp(p, 'i').test(qa)),
    'apartado 58 — MOTION_SYSTEM.md tiene «Motion QA» con la estrategia, la matriz, las limitaciones, la depuración, Reducido, los tamaños y el rendimiento');
  ok(/camaraLenta/.test(qa) && /inspeccionarTodo/.test(qa) && /auditoriaQA/.test(qa), '…con las herramientas nuevas y el informe');
  const ORDEN = leer('docs/13_MOTION_SYSTEM_ORDEN.md');
  ok(/\*\*F19\*\* ✅/.test(ORDEN) && /Deuda técnica/i.test(ORDEN) && /Problemas conocidos/i.test(ORDEN), 'apartado 59 — el índice real marca la F19 y dice la deuda técnica y los problemas conocidos');
  const sec = RECORRIDO.slice(RECORRIDO.indexOf('── MS F19 · QA extremo'));
  ok(/__lab_ms19/.test(sec) && /camaraLenta/.test(sec) && /reducedMotion: 'reduce'/.test(sec) && /setViewportSize/.test(sec), 'el recorrido monta el laboratorio, gira, cambia el ancho, usa la cámara lenta y recorre en Reducido');
  ok(/test-motion-f19\.mjs/.test(VERIFICAR), 'y `verificar.sh` ejecuta esta suite');
}

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
