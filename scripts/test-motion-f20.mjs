/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 20 — consolidación, contratos y sellado

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f20.mjs

   La última fase no añade efectos: comprueba que el sistema entero dice UNA cosa. El mapa definitivo con
   los nombres que existen; una sola fuente por categoría; nada repetido ni muerto entre todos los archivos;
   el legado clasificado (y lo retirado, retirado de verdad); los dos huecos que el apartado 57 manda
   implementar; los diecinueve contratos, cada uno con su garantía; los diez antipatrones, cada uno cazado
   con su ejemplo; la revisión final de tokens y muelles; la última búsqueda del código; la documentación y
   las reglas que quedan; y el SELLADO, que se calcula. Cada comprobación que vigila algo trae su caso malo:
   una prueba que no puede ponerse roja no prueba nada. La sesión entera —cuatro tamaños, Reducido,
   interrumpida y medida— está en la sección «MS F20» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  INVENTARIO_F20, MAPA_DEFINITIVO, simbolosQueNoExisten, FUENTE_UNICA, fuenteUnicaRota, archivosDelSistema, auditarDuplicacion,
  exportacionesMuertas, LEGADO_MOTION, legadoPendiente, desplazamientosSinToken, piezasSinRevisarLimpieza, GRUPOS_PRIORIDAD,
  NIVELES_DE_PROFUNDIDAD_F20, CONTRATOS_MOTION, ANTIPATRONES_MOTION, antipatronesQueNoSeCazan, REVISION_TOKENS,
  tokensRevisadosQueNoExisten, REPOSO_MAXIMO_MS, muellesSinProposito, CAMPOS_CONTRATO_MAPA, comprobacionesDeContrato,
  REVISIONES_FINALES, revisionesSinPrueba, RAF_DECLARADOS, RELOJES_DECLARADOS, ESPERAS_DECLARADAS, auditoriaFuenteFinal,
  PREGUNTAS_DX, EJEMPLOS_DEL_PROYECTO, ejemplosQueNoExisten, TEMAS_DOCUMENTACION, documentacionIncompleta,
  LIMITACIONES_MOTION, REGLAS_PERMANENTES_F20, reglasSinEscribir, auditoriaSellado, contratosSinGarantia, informeFinal,
  HALLAZGOS_F20, NO_EN_F20, AUDITORIA_F20,
} from '../src/lib/contratosMotion.js';
import { SPRINGS_MOTION, muestrearSpring, DURACIONES_MOTION, contextoMotion } from '../src/lib/motion.js';
import { PRIORIDADES_MOTION, resolverConflicto, CATEGORIAS_TOKENS, PIEZAS_DE_MOVIMIENTO, auditarOrquestacion } from '../src/lib/orquestadorMotion.js';
import { MOTION_MAP } from '../src/lib/motionMapa.js';
import { GUARDARRAILES_MOTION, TOKENS_DE_RESERVA } from '../src/lib/pulidoMotion.js';
import { CAPAS_MOTION, auditarCapas, REGRESION_POR_FASE, ARCHIVOS_CON_EJEMPLOS } from '../src/lib/qaMotion.js';
import { esperaDelFeedback, DURACION_FEEDBACK_MS } from '../src/lib/rachasHoy.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}

const CSS = leer('src/index.css');
const SRC = {};
const recorrer = (d) => readdirSync(join(RAIZ, d)).forEach((f) => {
  const p = `${d}/${f}`;
  if (statSync(join(RAIZ, p)).isDirectory()) recorrer(p);
  else if (/\.(jsx?|mjs)$/.test(f)) SRC[p] = leer(p);
});
recorrer('src');
const SCRIPTS = {};
readdirSync(join(RAIZ, 'scripts')).filter((f) => /\.(mjs|sh)$/.test(f)).forEach((f) => { SCRIPTS[`scripts/${f}`] = leer(`scripts/${f}`); });
const ARCHIVOS = { ...SRC, ...SCRIPTS };
const VERIFICAR = leer('scripts/verificar.sh');
const RECORRIDO = SCRIPTS['scripts/test-app-real.mjs'];
const DOC = leer('docs/MOTION_SYSTEM.md');
const CLAUDE = leer('CLAUDE.md');
const conCambio = (archivo, de, a) => ({ ...SRC, [archivo]: SRC[archivo].replace(de, a) });

/* ---------------------------------------------------------------------------
   1 y 2 · LA AUDITORÍA Y EL MAPA DEFINITIVO
   --------------------------------------------------------------------------- */
{
  console.log('\n1 y 2 · El inventario y el mapa definitivo, con los nombres que existen');
  ok(INVENTARIO_F20.length === 17 && INVENTARIO_F20.every((c) => c.archivos.every((a) => existsSync(join(RAIZ, a)))),
    `apartado 1 — las diecisiete categorías del enunciado, cada una con sus archivos de verdad (${INVENTARIO_F20.length})`);
  ok(MAPA_DEFINITIVO.length === 8 && MAPA_DEFINITIVO[0].nivel === 'Motion Tokens' && MAPA_DEFINITIVO[7].nivel === 'Visual Output',
    'apartado 2 — la cadena del enunciado, de los tokens a lo que se pinta, en su orden');
  ok(simbolosQueNoExisten(SRC).length === 0, `🚨 cada nombre del mapa existe exportado en su archivo: ni uno inventado (${MAPA_DEFINITIVO.reduce((n, l) => n + l.simbolos.length, 0)} nombres)`);
  ok(simbolosQueNoExisten(conCambio('src/lib/orquestadorMotion.js', 'export function tomarControl', 'function tomarControl')).some((s) => s.nombre === 'tomarControl'),
    '…y uno que deja de existir se caza');
}

/* ---------------------------------------------------------------------------
   3 · UNA SOLA FUENTE POR CATEGORÍA
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · Una sola fuente por categoría');
  ok(['durations', 'easings', 'springs', 'motion distances', 'intensity', 'depth', 'stagger', 'responsive rules'].every((p) => FUENTE_UNICA.some((f) => f.pide === p)),
    'las ocho categorías del apartado 3');
  ok(FUENTE_UNICA.every((f) => CATEGORIAS_TOKENS.some((c) => c.categoria === f.categoria)), '…cada una en `CATEGORIAS_TOKENS` (F11): no hay una tabla nueva');
  ok(CATEGORIAS_TOKENS.some((c) => c.categoria === 'responsive' && c.nombre === 'MOTION_BREAKPOINTS'), '…y la que faltaba (las reglas responsive) se añadió allí');
  ok(FUENTE_UNICA.every((f) => f.segunda && f.segunda.length > 40), '…y cada una dice qué auditoría cazaría una SEGUNDA fuente');
  ok(fuenteUnicaRota(SRC).length === 0, '🚨 todas las fuentes existen donde dicen');
  ok(fuenteUnicaRota(conCambio('src/lib/motion.js', 'export const DURACIONES_MOTION', 'const DURACIONES_MOTION')).some((f) => f.pide === 'durations'),
    '…y una que desaparece se caza');
}

/* ---------------------------------------------------------------------------
   4 y 5 · LO REPETIDO Y LO MUERTO
   --------------------------------------------------------------------------- */
{
  console.log('\n4 y 5 · Lo repetido y lo muerto, entre todos los archivos del sistema a la vez');
  const dup = auditarDuplicacion({ archivos: SRC });
  ok(archivosDelSistema().length >= 30 && archivosDelSistema().every((a) => existsSync(join(RAIZ, a))), `los archivos del sistema son los del mapa de capas (${archivosDelSistema().length})`);
  ok(dup.nombresRepetidos.length === 0 && dup.muellesIguales.length === 0 && dup.presetsIguales.length === 0,
    `🚨 ni un nombre exportado dos veces, ni dos muelles con la misma física, ni dos presets iguales (${JSON.stringify(dup)})`);
  ok(/trozo: 'export function contextoMotion'/.test(SRC['src/lib/rendimientoMotion.js']),
    '…y lo que una tabla CITA dentro de una cadena no cuenta como una segunda exportación (`trozo: \'export function contextoMotion\'`)');
  ok(auditarDuplicacion({ archivos: conCambio('src/lib/datosMotion.js', 'export function decimalesDe', 'export function contextoMotion() {}\nexport function decimalesDe') }).nombresRepetidos.some((n) => n.nombre === 'contextoMotion'),
    '…pero un segundo `contextoMotion` de verdad se caza');
  ok(exportacionesMuertas({ archivos: SRC, otros: SCRIPTS }).length === 0, '🚨 ni una exportación que no lea nadie (también se busca en las pruebas)');
  ok(exportacionesMuertas({ archivos: conCambio('src/lib/rendimientoMotion.js', 'export const COSTE_PROPIEDAD', 'export const COSTES = 1;\nexport const COSTE_PROPIEDAD'), otros: SCRIPTS })
    .some((m) => m.nombre === 'COSTES'), '🐛 …y con el `COSTES` de la F13 de vuelta, se caza (era una de las cuatro retiradas)');
  /* Como cadenas, no como expresiones: así este archivo no «usa» lo que comprueba que se fue (`NOMBRAN_LO_RETIRADO`). */
  ok(!new RegExp('export const COSTES\\b').test(SRC['src/lib/rendimientoMotion.js']) && !new RegExp('MUELLES_DEL_LENGUAJE|NIVELES_DEL_LENGUAJE|CURVAS_DEL_LENGUAJE').test(SRC['src/lib/lenguajeMotion.js']),
    'las cuatro exportaciones muertas ya no están');
}

/* ---------------------------------------------------------------------------
   6 y 7 · EL LEGADO
   --------------------------------------------------------------------------- */
{
  console.log('\n6 y 7 · El legado: KEEP, MIGRATE y REMOVE');
  ok(LEGADO_MOTION.every((l) => ['KEEP', 'MIGRATE', 'REMOVE'].includes(l.decision) && l.porque && l.porque.length > 30), 'cada cosa de antes, clasificada y con su motivo');
  ok(['KEEP', 'MIGRATE', 'REMOVE'].every((d) => LEGADO_MOTION.some((l) => l.decision === d)), '…y hay de las tres');
  ok(legadoPendiente({ css: CSS, archivos: SRC }).length === 0, '🚨 lo que dice que se migró o se quitó, está migrado o quitado');
  const cssViejo = CSS.replace("html[data-motion='off'] *, html[data-motion='off'] *::before, html[data-motion='off'] *::after {",
    "html[data-motion='off'] *, html[data-motion='off'] *::before, html[data-motion='off'] *::after,\nhtml[data-animaciones='desactivadas'] * {");
  ok(legadoPendiente({ css: cssViejo, archivos: SRC }).includes('data_animaciones'), '…con la regla de `data-animaciones` de vuelta, se caza');
  ok(legadoPendiente({ css: CSS, archivos: conCambio('src/App.jsx', '/* MS F1 — el modo de movimiento', 'document.documentElement.dataset.reducirMovimiento = String(apariencia.reducirMovimiento);\n    /* MS F1 — el modo de movimiento') }).includes('data_reducir'),
    '…y con `data-reducir-movimiento` de vuelta, también');
  ok(legadoPendiente({ css: CSS, archivos: conCambio('src/lib/rachasHoy.js', 'export const DURACION_FEEDBACK_MS = DURACIONES_MOTION.firma;', 'export const DURACION_FEEDBACK_MS = 900;') }).includes('feedback_racha'),
    '🐛 …y con los 900 ms del «+1» escritos a mano, también');
  ok(!/data-animaciones=/.test(CSS.replace(/\/\*[\s\S]*?\*\//g, '')) && !/dataset\.(animaciones|reducirMovimiento)\s*=/.test(SRC['src/App.jsx']) && /dataset\.motion = atributoMotion/.test(SRC['src/App.jsx']),
    '«Sin movimiento» es un solo atributo: `data-motion` (los dos de antes, consolidados)');
  ok(contextoMotion({ animaciones: 'desactivadas' }).modo === 'off' && contextoMotion({ animaciones: 'desactivadas', reducirMovimiento: true }).modo === 'off',
    '…y era seguro: `desactivadas` ES `off`, con o sin «Reducir movimiento»');
}

/* ---------------------------------------------------------------------------
   57 · LO QUE FALTABA, IMPLEMENTADO
   --------------------------------------------------------------------------- */
{
  console.log('\n57 · Los dos huecos que había que implementar');
  ok(desplazamientosSinToken(CSS).length === 0, '🚨 ni un `translate` ni un `scale` con un número escrito a mano en `index.css`: todos se quedan quietos en Reducido');
  ok(desplazamientosSinToken('@keyframes a { from { transform: translateY(12px) scale(0.9); } }').length === 2, '…y uno con píxeles y otro con una escala a mano se cazan');
  ok(desplazamientosSinToken('.a { transform: translateX(0) scale(1) translate(-50%, -50%); } .b { transform: translateY(var(--motion-dist-small)); }').length === 0,
    '…pero el reposo (0, 1, el -50 % de centrar) y los tokens no');
  ok(piezasSinRevisarLimpieza({ archivos: SRC }).length === 0, '🚨 toda pieza del mapa que usa temporizadores, fotogramas, escuchadores u observadores está en la revisión de limpieza de la F11');
  ok(['src/lib/sincronizacion.js', 'src/lib/rendimientoMotion.js', 'src/components/accesibilidadMotion.jsx'].every((a) => PIEZAS_DE_MOVIMIENTO.includes(a)),
    '🐛 …y entraron las tres que se habían quedado fuera');
  ok(piezasSinRevisarLimpieza({ archivos: { 'src/lib/datosMotion.js': 'const t = setTimeout(f, 10);' } }).includes('src/lib/datosMotion.js'), '…y una pieza que empiece a usar uno sin entrar en la lista se caza');
  ok(auditarOrquestacion({ archivos: { 'src/lib/rendimientoMotion.js': SRC['src/lib/rendimientoMotion.js'] } }).cuentas.sin_limpieza === 0,
    '🐛 la revisión de limpieza ya no cuenta el `addEventListener` de un EJEMPLO escrito en una cadena (el de la F13)');
  ok(auditarOrquestacion({ archivos: { 'src/lib/rendimientoMotion.js': "const ejemplo = 'x';\nwindow.addEventListener('scroll', f);" } }).cuentas.sin_limpieza === 1,
    '…pero uno de verdad, en el código, sí');
}

/* ---------------------------------------------------------------------------
   8-26 · LOS CONTRATOS
   --------------------------------------------------------------------------- */
{
  console.log('\n8-26 · Los diecinueve contratos, cada uno con su garantía');
  ok(CONTRATOS_MOTION.length === 19 && CONTRATOS_MOTION.map((c) => c.apartado).join(',') === Array.from({ length: 19 }, (_, i) => i + 8).join(','),
    'del apartado 8 al 26, uno por apartado');
  ok(CONTRATOS_MOTION.every((c) => c.exige.length && c.como && c.como.length > 40 && c.garantias.length), '…cada uno con lo que exige, cómo se cumple aquí y al menos una garantía');
  ok(contratosSinGarantia({ verificar: VERIFICAR, recorrido: RECORRIDO, archivos: ARCHIVOS }).length === 0,
    `🚨 cada garantía resuelve a algo que existe: una auditoría, una cuenta, una suite que corre verificar.sh o una marca del recorrido (${CONTRATOS_MOTION.reduce((n, c) => n + c.garantias.length, 0)})`);
  ok(contratosSinGarantia({ verificar: VERIFICAR, recorrido: RECORRIDO.replace(/MS F19, apartado 13/g, 'MS F19, ap. 13'), archivos: ARCHIVOS }).includes('20:recorrido:MS F19, apartado 13'),
    '…y una que deja de existir se caza');
  const c = comprobacionesDeContrato({ css: CSS, mapa: MOTION_MAP });
  ok(Object.values(c).every((x) => x.length === 0), `🚨 lo que comprueba cada contrato sobre el sistema, a cero (${JSON.stringify(Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v.length])))})`);
  ok(MOTION_MAP.every((e) => CAMPOS_CONTRATO_MAPA.every((k) => e[k] !== undefined)), `apartado 8 — cada línea del mapa trae su trigger, su intención, su prioridad, su tipo, su duración, su curva y su Reducido (${MOTION_MAP.length})`);
  ok(comprobacionesDeContrato({ css: CSS, mapa: [{ id: 'sin_campos', duracion: 200 }] }).mapaIncompleto.includes('sin_campos'), '…y una línea sin su contrato se caza');
  ok(comprobacionesDeContrato({ css: CSS.replace(/\.nav-seccion\b/g, '.otra-cosa'), mapa: [] }).navegacionIncompleta.includes('seccion'), 'apartado 10 — una navegación sin su clase en el CSS se caza');
  ok(comprobacionesDeContrato({ css: `${CSS}\n.brilla { animation: brillo 1s linear infinite; }`, mapa: [] }).buclesSinDeclarar.includes('brillo'), 'apartados 22 y 23 — un bucle sin declarar se caza');
  const agrupadas = GRUPOS_PRIORIDAD.flatMap((g) => g.prioridades);
  ok(GRUPOS_PRIORIDAD.map((g) => g.id).join() === 'P0,P1,P2,P3' && PRIORIDADES_MOTION.every((p) => agrupadas.filter((x) => x === p.id).length === 1),
    'apartado 19 — los siete pesos del orquestador, cada uno en uno de los cuatro grupos P0–P3');
  const rango = (id) => GRUPOS_PRIORIDAD.findIndex((g) => g.prioridades.includes(id));
  const malos = [];
  PRIORIDADES_MOTION.forEach((a) => PRIORIDADES_MOTION.forEach((b) => {
    if (a.id === 'gesto' || b.id === 'gesto' || rango(b.id) >= rango(a.id)) return;
    if (resolverConflicto({ prioridad: a.id, propiedades: ['opacity'], sistema: 'x' }, { prioridad: b.id, propiedades: ['opacity'], sistema: 'y' }).accion !== 'interrumpe') malos.push(`${b.id} no interrumpe a ${a.id}`);
    if (resolverConflicto({ prioridad: b.id, propiedades: ['opacity'], sistema: 'x' }, { prioridad: a.id, propiedades: ['opacity'], sistema: 'y' }).accion !== 'cede') malos.push(`${a.id} no cede ante ${b.id}`);
  }));
  ok(malos.length === 0, `🚨 lo de un grupo inferior nunca bloquea al superior: lo interrumpe el de arriba y cede ante él (${malos.join('; ') || 'todas las parejas'})`);
  ok(/export function tomarControl/.test(SRC['src/lib/orquestadorMotion.js']), '…y el gesto (P0) va por encima de cualquier peso: `tomarControl`, el dedo manda (F11)');
  ok(NIVELES_DE_PROFUNDIDAD_F20.map((n) => n.pide).join() === 'base,raised,floating,overlay,modal,system', 'apartado 18 — los seis niveles del enunciado, con los de JosStyle');
}

/* ---------------------------------------------------------------------------
   29 · LOS ANTIPATRONES
   --------------------------------------------------------------------------- */
{
  console.log('\n29 · Los diez antipatrones, cazados con su ejemplo');
  const pide = ['random duration', 'random easing', 'transition: all', 'z-index arbitrary', 'per-component motion engine', 'uncontrolled RAF',
    'permanent animation', 'motion without reduced-motion', 'blocking animation', 'decorative motion over interaction'];
  ok(pide.every((p) => ANTIPATRONES_MOTION.some((a) => a.no === p)) && ANTIPATRONES_MOTION.length === 10, 'los diez del apartado 29, por su nombre');
  ok(ANTIPATRONES_MOTION.filter((a) => a.guardarrail).every((a) => GUARDARRAILES_MOTION.some((g) => g.id === a.guardarrail)) && ANTIPATRONES_MOTION.filter((a) => a.guardarrail).length === 4,
    '…cuatro reutilizan los guardarraíles de la F18 con su ejemplo: no hay una lista paralela');
  const fallan = antipatronesQueNoSeCazan({ css: CSS });
  ok(fallan.length === 0, `🚨 cada uno lo CAZA de verdad su auditoría, ejecutada sobre su ejemplo malo (${fallan.join(', ') || '10 de 10'})`);
  ok(ANTIPATRONES_MOTION.every((a) => typeof a.cazar === 'function' && a.caza.length > 20), '…y dice cuál es');
}

/* ---------------------------------------------------------------------------
   30 y 31 · LOS TOKENS Y LOS MUELLES
   --------------------------------------------------------------------------- */
{
  console.log('\n30 y 31 · La revisión final de los tokens y de los muelles');
  const familias = { duracion: 6, curva: 5, distancia: 4, escala: 4, opacidad: 3 };
  ok(Object.entries(familias).every(([f, n]) => REVISION_TOKENS[f].length === n), 'apartado 30 — cada nombre del enunciado, con el suyo de JosStyle');
  ok(tokensRevisadosQueNoExisten(CSS).length === 0, '🚨 todos existen en `motion.js` y, los de CSS, en `:root` (en minúsculas: `ultraFast` es `--motion-dur-ultrafast`)');
  ok(tokensRevisadosQueNoExisten(CSS.replace(/--motion-dur-ultrafast:/g, '--motion-dur-otra:')).some((t) => t.real === 'ultraFast'), '…y uno que desaparece del CSS se caza');
  ok(REVISION_TOKENS.curva.find(([p]) => p === 'spring')[1] === null, '…y el `spring` no se finge curva: es una física de JavaScript');
  ok(muellesSinProposito().length === 0, `🚨 apartado 31 — cada muelle con su papel, ninguno tarda más de ${REPOSO_MAXIMO_MS} ms en reposar y los que se usan no rebotan`);
  ok(Object.keys(SPRINGS_MOTION).every((id) => muestrearSpring(id, { desde: 0, hasta: 1 }).duracionMs <= REPOSO_MAXIMO_MS), '…medido muestreándolos');
  ok(muestrearSpring({ rigidez: 20, amortiguacion: 2, masa: 3 }, { desde: 0, hasta: 1 }).duracionMs > REPOSO_MAXIMO_MS, '…y un muelle de los que no acaban nunca pasaría el tope: el umbral caza');
  ok(!!TOKENS_DE_RESERVA['muelle.bouncy'] && /C-69/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')),
    '`bouncy` se queda con su propósito —el contraejemplo medido de la F8, y la F1 exige los cinco—, anotado como C-69');
}

/* ---------------------------------------------------------------------------
   33-39 · LAS REVISIONES FINALES
   --------------------------------------------------------------------------- */
{
  console.log('\n33-39 · Las revisiones finales, con la prueba de cada una');
  ok([33, 34, 35, 36, 37, 38, 39].every((n) => REVISIONES_FINALES.some((r) => r.apartado === n)), 'de la 33 a la 39, y la sesión entera');
  ok(revisionesSinPrueba({ archivos: ARCHIVOS, verificar: VERIFICAR, recorrido: RECORRIDO }).length === 0, '🚨 cada una con una suite que corre verificar.sh y una sección del recorrido que existen');
}

/* ---------------------------------------------------------------------------
   46 · LA ÚLTIMA BÚSQUEDA DEL CÓDIGO
   --------------------------------------------------------------------------- */
{
  console.log('\n46 · La última búsqueda del código, sobre todo lo que pinta');
  const ff = auditoriaFuenteFinal({ archivos: SRC });
  ok(Object.keys(ff.porPatron).length === 10, 'las diez búsquedas del apartado 46');
  ok(ff.sinClasificar.length === 0, `🚨 nada se salta el sistema: cada aparición la clasifica una regla o está declarada con su motivo (${JSON.stringify(ff.porPatron)})`);
  ok(ff.porPatron['transition:'] > 0 && ff.porPatron.setTimeout > 0 && ff.porPatron.setInterval > 0 && ff.porPatron.requestAnimationFrame > 0, '…y no sale a cero por no mirar: encuentra lo que hay');
  ok(ff.porPatron['animation:'] === 0 && ff.porPatron['@keyframes'] === 0 && ff.porPatron['cubic-bezier'] === 0 && ff.porPatron.spring === 0 && ff.porPatron['will-change'] === 0,
    '…y en lo que pinta no hay ni un `animation:`, ni un `@keyframes`, ni una curva, ni un muelle, ni un `will-change`');
  ok([...RAF_DECLARADOS, ...RELOJES_DECLARADOS, ...ESPERAS_DECLARADAS].every((d) => existsSync(join(RAIZ, d.archivo)) && d.porque.length > 30), 'lo declarado existe y dice por qué');
  const caza = (src) => auditoriaFuenteFinal({ archivos: { 'src/views/Nueva.jsx': src } }).sinClasificar.map((x) => x.patron);
  ok(caza('setTimeout(() => setVisible(false), 300);').includes('setTimeout'), '…una espera de animación escrita a mano se caza');
  ok(!caza('setTimeout(() => setAviso(\'\'), 2600);').length, '…pero un plazo para leer un aviso, no');
  ok(caza('const id = requestAnimationFrame(paso);').includes('requestAnimationFrame'), '…un fotograma sin cancelar en una vista nueva, se caza');
  ok(caza('const t = setInterval(f, 1000); return () => clearInterval(t);').includes('setInterval'), '…un intervalo que no es un reloj declarado, también');
  ok(caza("<div style={{ transition: 'opacity 200ms' }} />").includes('transition:') && caza('const m = { rigidez: 200, amortiguacion: 20 };').includes('spring'),
    '…y una transición sin `transicion()` o un muelle fuera de `motion.js`');
  ok(caza("<div style={{ transition: transicion('opacity', 'fast') }} />").length === 0, '…pero `transicion()` sí es el sistema');
}

/* ---------------------------------------------------------------------------
   🐛 · EL «+1» DE LAS RACHAS
   --------------------------------------------------------------------------- */
{
  console.log('\n🐛 · El «+1» de una racha se queda lo que dura su animación');
  ok(DURACION_FEEDBACK_MS === DURACIONES_MOTION.firma, '`DURACION_FEEDBACK_MS` ES el token `firma`, con el que se anima el «+1» (`racha-mas-uno`)');
  ok(/\.racha-mas-uno\s*\{\s*animation:\s*masUnoSube var\(--motion-dur-firma\)/.test(CSS), '…que es, de verdad, el que pone el CSS');
  ok(esperaDelFeedback(contextoMotion({ velocidad: 'lenta' })) === Math.round(DURACIONES_MOTION.firma * 1.3),
    `🐛 con «Pausada» se queda los ${Math.round(DURACIONES_MOTION.firma * 1.3)} ms que dura su animación: antes se desmontaba a los 900, al 77 %`);
  ok(esperaDelFeedback(contextoMotion()) === 900 && esperaDelFeedback(contextoMotion({ velocidad: 'rapida' })) === 900 && esperaDelFeedback(contextoMotion({ animaciones: 'desactivadas' })) === 900,
    '…y nunca menos que el token: con «Sin movimiento» o «Rápida», «N días» se sigue leyendo lo mismo que antes');
  ok(/esperaDelFeedback\(contextoDelDocumento\(\)\)/.test(SRC['src/views/RachasView.jsx']), '…y la pantalla lo pide así, con la velocidad de ahora');
}

/* ---------------------------------------------------------------------------
   27, 28, 48, 50, 54, 55 y 62 · LO ESCRITO
   --------------------------------------------------------------------------- */
{
  console.log('\n27, 28, 48 y 50 · La documentación y las limitaciones');
  ok(PREGUNTAS_DX.length === 7 && EJEMPLOS_DEL_PROYECTO.length === 10, 'las siete preguntas del apartado 27 y los diez ejemplos del 28');
  ok(ejemplosQueNoExisten(SRC).length === 0, '🚨 cada ejemplo apunta a una pieza que existe en el proyecto (*"utilizar ejemplos del propio proyecto"*)');
  ok(TEMAS_DOCUMENTACION.length === 15, 'los quince temas del apartado 48');
  const falta = documentacionIncompleta(DOC);
  ok(falta.length === 0, `🚨 \`docs/MOTION_SYSTEM.md\` los tiene todos: temas, preguntas, ejemplos, antipatrones y el sellado (${falta.join(', ') || 'completo'})`);
  ok(documentacionIncompleta(DOC.replace('## Los contratos', '## Otra cosa')).includes('tema:contracts'), '…y un tema que se borra se caza');
  ok(LIMITACIONES_MOTION.length >= 5 && LIMITACIONES_MOTION.every((l) => l.porque.length > 40), 'apartado 50 — las limitaciones, dichas con su motivo');
  console.log('\n54, 55 y 62 · Las reglas que quedan');
  ok(reglasSinEscribir(CLAUDE).length === 0, `🚨 las reglas de los apartados 54, 55, 62 y la permanente están en CLAUDE.md`);
  ok(reglasSinEscribir(CLAUDE.replace(/MOTION ES INFRAESTRUCTURA, NO DECORACIÓN/g, '…')).includes(55), '…y una que se borra se caza');
}

/* ---------------------------------------------------------------------------
   58-60 · EL SELLADO
   --------------------------------------------------------------------------- */
{
  console.log('\n58-60 · El sellado, calculado');
  const sello = auditoriaSellado({ css: CSS, archivos: ARCHIVOS, otros: {}, verificar: VERIFICAR, recorrido: RECORRIDO, doc: DOC, claude: CLAUDE, mapa: MOTION_MAP });
  ok(Object.keys(sello.partes).length >= 25, `todo lo anterior, más las auditorías de la F18 y la F19, en una cuenta (${Object.keys(sello.partes).length} partes)`);
  ok(sello.sellado && sello.total === 0 && sello.estado === 'MOTION SYSTEM — SEALED', `🚨 MOTION SYSTEM — SEALED: todo a cero (${JSON.stringify(Object.fromEntries(Object.entries(sello.partes).filter(([, v]) => v)))})`);
  const roto = auditoriaSellado({ css: `${CSS}\n@keyframes x { from { transform: translateY(9px); } }`, archivos: ARCHIVOS, verificar: VERIFICAR, recorrido: RECORRIDO, doc: DOC, claude: CLAUDE, mapa: MOTION_MAP });
  ok(!roto.sellado && roto.estado === 'SIN SELLAR' && roto.partes.desplazamientosSinToken === 1, '…y con un solo píxel escrito a mano, el sello se rompe: no es un rótulo, es una cuenta');
  const inf = informeFinal(sello);
  ok(inf.estado === 'MOTION SYSTEM — SEALED' && inf.eliminado.length >= 3 && inf.creado.length >= 5 && inf.limitaciones.length === LIMITACIONES_MOTION.length && inf.encontrado.length === HALLAZGOS_F20.length,
    'apartado 59 — el informe final: qué se consolidó, qué se quitó, qué se creó, qué se encontró, qué queda y el estado');
  ok(informeFinal(roto).estado === 'SIN SELLAR', '…y su estado sale del sellado, no de una frase');
  ok(HALLAZGOS_F20.every((h) => h.resuelto === 20 && h.que.length > 40), 'los hallazgos de la fase, resueltos en ella');
  const cubiertos = new Set(AUDITORIA_F20.flatMap((a) => a.apartados));
  ok(Array.from({ length: 63 }, (_, i) => i + 1).every((n) => cubiertos.has(n)), 'los 63 apartados dicen dónde se resuelven');
}

/* ---------------------------------------------------------------------------
   61 · SIN FASE 21, Y LA PUERTA
   --------------------------------------------------------------------------- */
{
  console.log('\n61 · Sin Fase 21, y lo que deja la fase');
  ok(NO_EN_F20.some((n) => /Fase 21/.test(n.que)), 'apartado 61 — no se genera una Fase 21, y está dicho');
  const indice = leer('docs/13_MOTION_SYSTEM_ORDEN.md');
  ok(!/\|\s*\*?\*?F21\b/.test(indice) && /F20[^\n]*✅/.test(indice), '…el índice acaba en la F20, hecha');
  const capas = auditarCapas({ archivos: SRC });
  ok(CAPAS_MOTION.find((c) => c.id === 'auditorias').archivos.includes('src/lib/contratosMotion.js') && capas.auditoriasEnLaApp.length === 0 && capas.fueraDelMapa.length === 0,
    'el sellado es una auditoría: está en su capa y la aplicación no lo importa (C-68)');
  ok(ARCHIVOS_CON_EJEMPLOS.includes('src/lib/contratosMotion.js'), '…y sus ejemplos malos están declarados como ejemplos (F19)');
  ok(REGRESION_POR_FASE.at(-1).fase === 20 && REGRESION_POR_FASE.at(-1).seccion === '/* ── MS F20 ', '…y la F20 entra en la regresión de todas las fases');
  ok(/test-motion-f20\.mjs/.test(VERIFICAR), 'verificar.sh ejecuta esta suite');
  ok(/\/\* ── MS F20 /.test(RECORRIDO), 'y el recorrido tiene la sección «MS F20»');
  const log = leer('CHANGELOG.md');
  const desde = log.indexOf('## v');
  const primera = log.slice(desde, log.indexOf('\n## v', desde + 4));
  ok(/v3\.150\.0/.test(primera) && /FINALIZADO/.test(primera) && /MOTION SYSTEM — SEALED/.test(primera),
    'apartado 49 — el CHANGELOG dice FINALIZADO y SEALED en la entrada de la F20 (y esta suite solo pasa con el sellado a cero)');
  ok(JSON.parse(leer('package.json')).version === '3.150.0', 'package.json en la 3.150.0');
}

console.log(`\n${mal ? `\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m` : `\x1b[32m${ok_} de ${ok_} comprobaciones en verde\x1b[0m`}`);
if (mal) process.exit(1);
