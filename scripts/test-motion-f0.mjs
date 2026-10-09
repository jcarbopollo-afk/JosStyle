/* Motion System · Fase 0 — auditoría total, arquitectura y plan maestro.
 *
 * Lo que la F0 dice de JosStyle se comprueba contra los archivos de verdad: el
 * índice contra la especificación literal, el MOTION_MAP contra index.css y
 * ANIMACIONES_HC, la deuda contra las vistas y los documentos contra la
 * librería de la que salen. Y cada barrido trae su caso rojo (EH F42): una
 * comprobación que no puede fallar no comprueba nada.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  NIVELES_MOTION, nivelMotion, PRESUPUESTO_MOTION, CONTEXTOS_MOTION, contextoDe, CATEGORIAS_MOTION,
  MOTION_MAP, HALLAZGOS_F0, aMs, escanearCss, keyframesDe, escanearVista, graficasSinGobierno,
  DEUDA_F0, auditarMotion, AJUSTES_MOVIMIENTO, ARQUITECTURA_MOTION, REGLA_HEREDA_MOTION,
  ROADMAP_MOTION, SOLAPES_ROADMAP, ESTADOS_MAPA, motionMapMarkdown,
} from '../src/lib/motionMapa.js';
import { ANIMACIONES_HC, MAX_ANIMACION_MS } from '../src/lib/pulidoHC.js';
import { NIVELES_ANIMACION, DEFAULT_APARIENCIA } from '../src/tokens.js';
import { STAGGER_MOTION, tokensRaiz, movimientoReducidoEnCss, escalonado } from '../src/lib/motion.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const CSS = leer('src/index.css');
const APP = leer('src/App.jsx');
const AJUSTES = leer('src/views/SettingsView.jsx');
const ESPEC = leer('especificaciones/ORIGINAL_MOTION_SYSTEM.txt').split('\n');
const VISTAS = {};
for (const d of ['src/views', 'src/components']) {
  for (const f of readdirSync(join(RAIZ, d))) if (/\.jsx?$/.test(f)) VISTAS[`${d}/${f}`] = leer(`${d}/${f}`);
}
VISTAS['src/App.jsx'] = APP;

console.log('\n── 1. El índice: las 21 fases, en orden, contra la especificación literal ──');
ok(ROADMAP_MOTION.length === 21 && ROADMAP_MOTION.every((f, i) => f.fase === i),
  'el plan tiene las 21 fases, de la F0 a la F20, en orden');
/* 🚨 Cada fase empieza donde dice: la línea es la cabecera «JOS STYLE — MOTION SYSTEM» y la
   siguiente con texto es su título con su número. Si alguien reordena o recorta el archivo, salta. */
const cabeceraEn = (linea) => {
  const n = linea - 1;
  if (ESPEC[n] !== 'JOS STYLE — MOTION SYSTEM') return null;
  const t = ESPEC.slice(n + 1, n + 4).find((x) => x.trim());
  return t || null;
};
ROADMAP_MOTION.forEach((f) => {
  const t = cabeceraEn(f.lineas[0]);
  ok(!!t && new RegExp(`^FASE ${f.fase} —`).test(t), `F${f.fase} empieza en la línea ${f.lineas[0]}: «${(t || '').slice(0, 60)}»`);
});
ok(ROADMAP_MOTION.every((f) => f.lineas[1] > f.lineas[0]), 'cada fase acaba después de empezar');
const DOC13 = leer('docs/13_MOTION_SYSTEM_ORDEN.md');
ok(ROADMAP_MOTION.every((f) => DOC13.includes(`| ${f.lineas[0]}–${f.lineas[1]} |`)),
  '🚨 docs/13 dice las mismas líneas que el plan, fase a fase');
ok(/F16\*\*( ✅ \*\*v[\d.]+\*\*)? \| Estados de sistema/.test(DOC13) && /F0\*\*/.test(DOC13), '…con la F0 primero y la F16 donde le toca');

console.log('\n── 2. Lo que el documento trae repetido (C-51) ──');
const trozo = (a, b) => ESPEC.slice(a - 1, b).join('\n');
/* La F11 de orquestación está dos veces, idéntica: se comprueba en vez de suponerlo. */
ok(trozo(13290, 14127) === trozo(14128, 14965), '🚨 la F11 de orquestación está copiada dos veces, idéntica línea a línea');
ok(/naveg\s*$/.test(trozo(5491, 6037).trimEnd()), '…la primera F2 está cortada a media palabra («naveg»)');
ok(/^FASE 11 — NAVEGACIÓN GLOBAL/.test(cabeceraEn(12785) || '') && /Si el proyecto\s*$/.test(trozo(12785, 13289).trimEnd()),
  '…y la F11 alternativa de navegación global se corta en su apartado 41');
ok(/No generar una FASE 21/.test(trozo(3118, 4045)), 'y la F20 dice que no hay una F21');
ok(SOLAPES_ROADMAP.length >= 5 && SOLAPES_ROADMAP.every((s) => s.fases.every((n) => n >= 0 && n <= 20) && s.reparto.length > 60),
  '⚠️ los temas que se pisan entre fases se reparten por escrito, con fases que existen');
const DOC03 = leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md');
ok(/### C-51 /.test(DOC03) && /F11/.test(DOC03.split('### C-51')[1] || ''), 'y la decisión está anotada como C-51 en docs/03');

console.log('\n── 3. La jerarquía y el presupuesto ──');
ok(NIVELES_MOTION.length === 6 && NIVELES_MOTION.every((n, i) => n.nivel === i), 'seis niveles, del 0 al 5');
ok(NIVELES_MOTION.every((n, i) => i === 0 || n.maxMs > NIVELES_MOTION[i - 1].maxMs), '…y cada uno puede durar más que el anterior');
ok(nivelMotion(0).maxMs === 0 && nivelMotion(5).id === 'signature', 'el 0 no se mueve y el 5 es la firma');
ok(PRESUPUESTO_MOTION.duracionAbsolutaMaxMs === MAX_ANIMACION_MS, '🚨 el tope absoluto es el de la E3 F14, no un número nuevo');
ok(PRESUPUESTO_MOTION.staggerPasoMaxMs * (PRESUPUESTO_MOTION.staggerElementosMax - 1) <= PRESUPUESTO_MOTION.staggerTotalMaxMs + PRESUPUESTO_MOTION.staggerPasoMaxMs,
  'el escalonado cabe en su total');
/* La portada de un área era el caso que fijaba el presupuesto: cabecera + 5 tarjetas a 80 ms.
   🔓 MS F1 — desde la F1 la cascada es `escalonado(i)` del motor, con un solo paso para toda la
   aplicación (60 ms), que cabe en ese presupuesto. */
ok(/\.\.\.escalonado\(i\)/.test(leer('src/views/HubView.jsx')) && STAGGER_MOTION.pasoMs <= PRESUPUESTO_MOTION.staggerPasoMaxMs,
  `🔓 la portada de un área escalona con el motor, y su paso (${STAGGER_MOTION.pasoMs} ms) cabe en el presupuesto (MS F1)`);
ok(PRESUPUESTO_MOTION.reglas.length >= 5 && PRESUPUESTO_MOTION.reglas.every((r) => r.si && r.no),
  'cuándo sí y cuándo no: spring, blur, escala, parallax y bucles');

console.log('\n── 4. El carácter de cada área cubre la aplicación de verdad ──');
/* Los ids se leen de AREAS_NAV en App.jsx: un módulo nuevo sin contexto pone esto rojo. */
const modulosArea = [...APP.matchAll(/\{ id: '(area-[a-z]+)', label: '[^']+', icon: \w+, modulos: \[([^\]]+)\] \}/g)]
  .flatMap((x) => [x[1], ...x[2].split(',').map((y) => y.trim().replace(/'/g, ''))]);
ok(modulosArea.length >= 18, `se leen las tres áreas y sus módulos de App.jsx (${modulosArea.length})`);
const sinContexto = [...modulosArea, 'hoy', 'ajustes'].filter((id) => !contextoDe(id));
ok(sinContexto.length === 0, `🚨 todas las áreas y módulos tienen su carácter${sinContexto.length ? ` (faltan: ${sinContexto.join(', ')})` : ''}`);
ok(CONTEXTOS_MOTION.every((c) => c.nivelMax >= 0 && c.nivelMax <= 5 && c.regla.length > 30), '…cada uno con su nivel máximo y su regla');
ok(contextoDe('ajustes').nivelMax < contextoDe('entreno').nivelMax, 'Ajustes es más discreto que el entrenamiento');

console.log('\n── 5. El MOTION_MAP ──');
const ids = MOTION_MAP.map((e) => e.id);
ok(new Set(ids).size === ids.length, `cada elemento tiene un id único (${ids.length})`);
const cats = new Set(CATEGORIAS_MOTION.map((c) => c.id));
ok(CATEGORIAS_MOTION.length === 24 && MOTION_MAP.every((e) => cats.has(e.categoria)), 'las 24 categorías del apartado 2, y cada elemento en una');
ok(MOTION_MAP.every((e) => nivelMotion(e.nivel) && e.fase >= 0 && e.fase <= 20 && ESTADOS_MAPA[e.estado]),
  'cada elemento con su nivel, su estado y la fase que lo trata');
const CAMPOS = ['nombre', 'ubicacion', 'funcion', 'inicial', 'final', 'entrada', 'salida', 'interaccion', 'transicion', 'easing', 'prioridad', 'relacion', 'movil', 'desktop', 'reducido'];
ok(MOTION_MAP.every((e) => CAMPOS.every((k) => k in e)), '⚠️ con todos los campos del apartado 3');
/* Un elemento que se da por bueno respeta el tope de su nivel. Los bucles se miden aparte. */
const fueraDeNivel = MOTION_MAP.filter((e) => e.estado === 'existe' && !e.bucle && e.duracion && e.duracion > nivelMotion(e.nivel).maxMs);
ok(fueraDeNivel.length === 0, `🚨 lo que está «bien» cabe en el tope de su nivel${fueraDeNivel.length ? `: ${fueraDeNivel.map((e) => e.id).join(', ')}` : ''}`);
ok(MOTION_MAP.find((e) => e.id === 'favorito').estado === 'existe' && MOTION_MAP.find((e) => e.id === 'favorito').duracion <= nivelMotion(1).maxMs,
  '🔓 …y la estrella de favorito, que era 240 ms en un nivel de 220, ya cabe en su nivel con el token `normal` (MS F1)');
/* Todo ANIMACIONES_HC está en el mapa: el mapa amplía el catálogo, no lo sustituye. */
const enMapa = new Set(MOTION_MAP.map((e) => e.catalogo).filter(Boolean));
const fueraDelMapa = ANIMACIONES_HC.filter((a) => !enMapa.has(a.id)).map((a) => a.id);
ok(fueraDelMapa.length === 0, `🚨 las ${ANIMACIONES_HC.length} animaciones de ANIMACIONES_HC están en el mapa${fueraDelMapa.length ? ` (faltan: ${fueraDelMapa.join(', ')})` : ''}`);
ok(MOTION_MAP.some((e) => e.id === 'graficas_recharts' && e.estado === 'existe' && e.fase === 4) && !MOTION_MAP.some((e) => e.estado === 'fuera_de_control'),
  '🔓 las gráficas de Recharts ya no están fuera de control: obedecen al modo y a «Reducir movimiento» (MS F4)');

console.log('\n── 6. La auditoría, sobre los archivos de verdad ──');
const a = auditarMotion({ css: CSS, vistas: VISTAS });
ok(a.reglas.length >= 30, `lee las reglas animadas de index.css (${a.reglas.length})`);
ok(a.sinMapa.length === 0, `🚨 ninguna regla animada de index.css se queda fuera del mapa${a.sinMapa.length ? `: ${a.sinMapa.map((x) => `${x.selector}:${x.linea}`).join(', ')}` : ''}`);
ok(a.keyframesHuerfanos.length === 0, `ningún @keyframes sin usar (${keyframesDe(CSS).length} declarados)`);
ok(a.mapaSinCss.length === 0, `toda clase que el mapa nombra existe y se mueve en el CSS${a.mapaSinCss.length ? `: ${a.mapaSinCss.join(', ')}` : ''}`);
ok(a.catalogoDistinto.length === 0, `⚠️ el mapa y ANIMACIONES_HC dicen la misma duración${a.catalogoDistinto.length ? `: ${JSON.stringify(a.catalogoDistinto)}` : ''}`);
ok(a.curvasAjenas.length === 0, 'index.css usa una sola curva (--ease-premium, y linear para un reloj)');
ok(a.deudaQueCrece.length === 0, `🚨 la deuda medida en la F0 no ha crecido${a.deudaQueCrece.length ? `: ${JSON.stringify(a.deudaQueCrece)}` : ''} — ${JSON.stringify(a.cuentas)}`);
/* La duración y la curva de una regla conocida, leídas de verdad. */
const me = a.reglas.find((r) => r.selector === '.module-enter');
ok(!!me && me.ms[0] === 340 && me.curvas.includes('var(--ease-premium)') && me.keyframe === 'moduleSlideIn',
  'escanearCss lee de verdad: .module-enter, 340 ms, --ease-premium, moduleSlideIn');

console.log('\n── 7. Y cada barrido se pone rojo cuando debe (EH F42) ──');
const cssMalo = `${CSS}\n.cosa-nueva { animation: algoNuevo 300ms var(--ease-premium) both; }\n@keyframes huerfanoNuevo { from { opacity: 0; } }`;
const rojo = auditarMotion({ css: cssMalo, vistas: VISTAS });
ok(rojo.sinMapa.some((x) => x.selector === '.cosa-nueva'), '🚨 una animación nueva que nadie ha mapeado salta (la regla 19, hecha prueba)');
ok(rojo.keyframesHuerfanos.includes('huerfanoNuevo'), '…y un @keyframes que nadie usa también');
ok(auditarMotion({ css: `${CSS}\n.fit-entra-nueva { animation: fitEntra 220ms var(--ease-premium) backwards; }`, vistas: VISTAS }).sinMapa
  .some((x) => x.selector === '.fit-entra-nueva'), '⚠️ …también si su nombre EMPIEZA como el de una que sí está (no vale el parecido)');
ok(auditarMotion({ css: `${CSS}\n.x-y { transition: width 300ms ease-in-out; }`, vistas: VISTAS }).curvasAjenas.length === 1,
  '…y una curva que no es la común');
const vistaMala = { ...VISTAS, 'src/views/Nueva.jsx': "const B = () => <div style={{ width: 3, transition: 'width 0.4s ease' }} className=\"transition-all\" />;" };
const deuda = auditarMotion({ css: CSS, vistas: vistaMala }).deudaQueCrece.map((x) => x.tipo);
ok(deuda.includes('transicion_en_linea') && deuda.includes('transition_all'), '🚨 una vista nueva con su propia duración y `transition-all` pone la deuda en rojo');
ok(escanearVista("// transition: 'width 0.4s ease'\n/* transition-all */ const x = 1;").length === 0,
  '…y un comentario que lo NOMBRA no cuenta (la lección de siempre)');
ok(escanearCss('/* .a { animation: z 1s ease; } */ .b { color: red; }').length === 0, '…tampoco en el CSS');
ok(graficasSinGobierno('<Line dataKey="v" />').length === 1 && graficasSinGobierno('<Line isAnimationActive={false} />').length === 0,
  'una serie de Recharts sin gobernar se cuenta; una gobernada, no');
ok(aMs('340ms') === 340 && aMs('0.4s') === 400 && aMs('.35s') === 350 && aMs('1s') === 1000 && aMs('ease') === null,
  'las duraciones se leen en ms, en s y sin cero delante');
ok(Object.keys(DEUDA_F0).every((k) => k in a.cuentas), 'la deuda se mide en las mismas categorías en las que se declaró');

console.log('\n── 8. Los hallazgos dicen lo que se ve, y lo que dicen es verdad hoy ──');
ok(HALLAZGOS_F0.length >= 10 && HALLAZGOS_F0.every((h) => h.fase >= 1 && h.fase <= 20 && h.seVe.length > 60),
  'cada hallazgo dice qué se ve y qué fase lo arregla');
/* Estas se dan la vuelta cuando llega su fase: son promesas, no adornos. */
ok(!/pocas animaciones propias/.test(AJUSTES) && NIVELES_ANIMACION.length === 5 && HALLAZGOS_F0.find((h) => h.id === 'niveles_decorativos').resuelto === 1,
  '🔓 niveles decorativos: la pantalla ya no lo confiesa, porque cada modo hace algo (MS F1)');
ok(a.cuentas.series_sin_gobierno === 0 && HALLAZGOS_F0.find((h) => h.id === 'graficas_sin_control').resuelto === 4,
  `🔓 gráficas gobernadas: ni una serie de Recharts sin \`isAnimationActive\` (MS F4; eran 3)`);
const togglesAMano = (AJUSTES.match(/rounded-full transition-all/g) || []).length;
ok(togglesAMano === 0 && !/transicion\('left'/.test(leer('src/views/CalendarView.jsx')) && HALLAZGOS_F0.find((h) => h.id === 'tres_interruptores').resuelto === 3,
  '🔓 tres interruptores: ni uno a mano en Ajustes ni en el Calendario, y ninguno mueve la bola con `left` (MS F3)');
ok(!/EXPAND_MS|190/.test(leer('src/views/HubView.jsx').replace(/\/\/.*$/gm, '')) && /duracionMs\('fast'/.test(leer('src/views/HubView.jsx')) && /hubCardExpand var\(--motion-dur-fast\)/.test(CSS),
  '🔓 el mismo 190 ms en la vista y en el CSS es ya UN token: `fast`, leído por los dos (MS F1)');

console.log('\n── 9. Los ajustes y la arquitectura ──');
ok(AJUSTES_MOVIMIENTO.niveles.map((n) => n.id).join() === NIVELES_ANIMACION.map((n) => n.value).join(),
  '🚨 los niveles del plan son los ids que ya se guardan (ni uno renombrado)');
ok(NIVELES_ANIMACION.some((n) => n.value === DEFAULT_APARIENCIA.animaciones), '…y el de serie es uno de ellos');
ok(/app_data/.test(AJUSTES_MOVIMIENTO.dondeSeGuarda) && /localStorage/.test(AJUSTES_MOVIMIENTO.dondeSeGuarda),
  'se guardan donde el resto de Apariencia, y se dice por qué no en localStorage');
ok(/dataset\.animaciones = apariencia\.animaciones/.test(APP) && /dataset\.reducirMovimiento = /.test(APP), '…y App.jsx ya los lleva a <html> (data-animaciones, data-reducir-movimiento)');
const PKG = JSON.parse(leer('package.json'));
const deps = Object.keys({ ...PKG.dependencies, ...PKG.devDependencies });
ok(!deps.some((d) => /framer-motion|^motion$|react-spring|gsap|popmotion|animejs/.test(d)),
  '🚨 ninguna librería de animación: la decisión de la arquitectura se cumple en package.json');
ok(['sinLibreria', 'tokens', 'css', 'js'].every((k) => ARQUITECTURA_MOTION[k] && ARQUITECTURA_MOTION[k].length > 60), 'la arquitectura dice qué va en CSS y qué en JavaScript');
ok(REGLA_HEREDA_MOTION.length >= 4 && REGLA_HEREDA_MOTION.some((r) => /suite roja/.test(r)), 'la regla permanente dice cómo se hace cumplir');

console.log('\n── 10. Los documentos salen de la librería ──');
ok(leer('docs/MOTION_MAP.md') === motionMapMarkdown(), '🚨 docs/MOTION_MAP.md es exactamente lo que genera el mapa (si no, regenerar)');
ok(motionMapMarkdown().includes('| Movimiento reducido |') && MOTION_MAP.every((e) => motionMapMarkdown().includes(`\`${e.id}\``)),
  '…con la ficha de cada elemento');
const SIS = leer('docs/MOTION_SYSTEM.md');
ok(NIVELES_MOTION.every((n) => SIS.includes(`**${n.nombre}**`)), 'MOTION_SYSTEM.md nombra los seis niveles');
ok(CONTEXTOS_MOTION.every((c) => SIS.includes(c.caracter)), '…el carácter de cada contexto');
ok(/todo lo nuevo hereda motion/i.test(SIS) && /Sin librería de animación/.test(SIS), '…la regla permanente y la decisión de arquitectura');
ok(SIS.includes(`**${PRESUPUESTO_MOTION.duracionAbsolutaMaxMs} ms**`) && SIS.includes(`Como mucho ${PRESUPUESTO_MOTION.simultaneosMax} elementos`),
  '…y los números del presupuesto, los mismos que la librería');

console.log(fallos === 0
  ? `\n  \x1b[32m✓\x1b[0m Motion System · F0 (auditoría, mapa y plan) — ${total} comprobaciones`
  : `\n  \x1b[31m✗ ${fallos} de ${total} comprobaciones han fallado\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
