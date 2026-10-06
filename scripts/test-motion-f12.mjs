/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 12 — accesibilidad, reduced motion, adaptive motion y calidad de experiencia

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f12.mjs

   Lo que se comprueba aquí es la POLÍTICA —una intensidad que sale de una sola fuente, qué pasa en cada
   área y dónde se cumple, los bucles, las celebraciones, los hápticos, el desplazamiento automático, el
   foco que no se pierde— y la auditoría que caza lo que no puede volver. Lo que necesita un navegador
   —que en Reducido el esqueleto y el giro se queden quietos, que borrar una fila o plegar un desplegable
   con el teclado no pierda el foco, que VoiceOver oiga a dónde se ha llegado— está en la sección
   «MS F12» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  INTENSIDADES_MOTION, intensidadDe, POLITICA_MOTION, BUCLES_INFINITOS, UTILIDADES_EN_BUCLE, CELEBRACIONES, HAPTICOS,
  patronHaptico, comportamientoDeScroll, desplazarHasta, filaParaElFoco, ENFOCABLES, JERARQUIA_F12, TOPE_NIVELES_ALTOS,
  ADAPTACION, MATRIZ_QA, LEEN_REDUCIR, VIBRAN, auditarAccesibilidadMotion, PREGUNTAS_DE_UN_MOVIMIENTO, AUDITORIA_F12, NO_EN_F12,
} from '../src/lib/accesibilidadMotion.js';
import { contextoMotion, MODOS_MOTION, guardadoDeModo } from '../src/lib/motion.js';
import { MOTION_MAP, NIVELES_MOTION } from '../src/lib/motionMapa.js';
import { PATRONES_VIBRACION } from '../src/lib/sonidoProduccion.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}

const ARCHIVOS = {};
const recorrer = (dir) => readdirSync(join(RAIZ, dir)).forEach((f) => {
  const p = `${dir}/${f}`;
  if (statSync(join(RAIZ, p)).isDirectory()) recorrer(p);
  else if (/\.(jsx?|mjs)$/.test(f)) ARCHIVOS[p] = leer(p);
});
recorrer('src');
const CSS = leer('src/index.css');
const CSS_LIMPIO = sinComentarios(CSS);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Una intensidad, de una sola fuente (apartados 2, 3, 4, 5, 6 y 7) ──');
ok(INTENSIDADES_MOTION.map((i) => i.id).join() === 'full,reduced,none' && INTENSIDADES_MOTION.every((i) => i.que), 'tres intensidades —completa, reducida, ninguna—, cada una con lo que significa');
{
  const todos = INTENSIDADES_MOTION.flatMap((i) => i.modos).sort().join();
  ok(todos === MODOS_MOTION.map((m) => m.id).sort().join(), '🚨 cada modo de Ajustes cae en UNA intensidad, y ninguno se queda fuera');
}
ok(intensidadDe(contextoMotion({ animaciones: guardadoDeModo('normal') })) === 'full' && intensidadDe(contextoMotion({ animaciones: guardadoDeModo('ultra') })) === 'full', 'Normal y Ultra: completa');
ok(intensidadDe(contextoMotion({ animaciones: guardadoDeModo('reducido') })) === 'reduced' && intensidadDe(contextoMotion({ reducirMovimiento: true })) === 'reduced', '«Reducido» y «Reducir movimiento» de Ajustes: reducida');
ok(intensidadDe(contextoMotion({ sistemaReduce: true })) === 'reduced', '🚨 …y el «Reducir movimiento» del iPhone también: es la MISMA preferencia, no una segunda (apartado 46)');
ok(intensidadDe(contextoMotion({ animaciones: guardadoDeModo('off') })) === 'none', '«Sin movimiento»: ninguna');
{
  const a = auditarAccesibilidadMotion({ archivos: ARCHIVOS, css: CSS });
  ok(a.cuentas.reducir_por_su_cuenta === 0 && LEEN_REDUCIR.join() === 'src/lib/motion.js,src/components/motion.jsx', `🚨 solo el motor pregunta al navegador si reducir: ninguna pantalla lo hace por su cuenta (apartado 3)${a.cuentas.reducir_por_su_cuenta ? ` — ${a.hallazgos.filter((h) => h.tipo === 'reducir_por_su_cuenta').map((h) => `${h.archivo}:${h.linea}`).join(', ')}` : ''}`);
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Qué pasa en cada área, y dónde se cumple (apartados 5-13, 33 y 46) ──');
ok(POLITICA_MOTION.length >= 12 && POLITICA_MOTION.every((p) => p.area && p.full && p.reduced && p.none && p.donde && p.trozo), `la política de ${POLITICA_MOTION.length} áreas: qué pasa con cada intensidad`);
{
  const faltan = POLITICA_MOTION.filter((p) => !existsSync(join(RAIZ, p.donde)) || !leer(p.donde).includes(p.trozo)).map((p) => p.area);
  ok(faltan.length === 0, `🚨 …y cada línea se cumple DONDE dice: la prueba abre el archivo y busca el trozo${faltan.length ? ` — no se encuentra en: ${faltan.join(', ')}` : ''}`);
}
ok(['Navegación', 'Elementos compartidos', 'Capas (hojas y ventanas)', 'Listas', 'Desplegables', 'Microinteracciones', 'Gestos', 'Carga y bucles', 'Celebraciones', 'Desplazamiento automático', 'Hápticos'].every((a) => POLITICA_MOTION.some((p) => p.area === a)), '…con la navegación, los compartidos, las capas, las listas, los desplegables, lo micro, los gestos, la carga, las celebraciones, el desplazamiento y los hápticos');
ok(/funci[oó]n/.test(POLITICA_MOTION.find((p) => p.area === 'Gestos').reduced), '🚨 en Reducido el dedo SIGUE moviendo la hoja: un gesto que cumple una función no desaparece (apartado 8)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Los bucles (apartados 13, 14, 15 y 42) ──');
{
  const enCss = [...CSS_LIMPIO.matchAll(/animation:\s*([\w-]+)[^;]*\binfinite\b/g)].map((m) => m[1]);
  ok(enCss.length >= 1 && enCss.every((k) => BUCLES_INFINITOS.some((b) => b.keyframe === k)), `todo lo que se repite sin fin en el CSS está en \`BUCLES_INFINITOS\` (${enCss.join(', ')})`);
  ok(BUCLES_INFINITOS.every((b) => b.aporta && b.reduced && b.none), '…cada uno con lo que aporta y su estrategia (apartado 15: ¿informa o adorna?)');
  ok(UTILIDADES_EN_BUCLE.includes('animate-spin') && UTILIDADES_EN_BUCLE.includes('animate-pulse'), 'las utilidades de Tailwind que repiten sin fin están vigiladas');
  BUCLES_INFINITOS.forEach((b) => {
    const enReducido = new RegExp(`html\\[data-motion='reducido'\\][^{]*\\.${b.clase}[^{]*\\{[^}]*animation:\\s*none`).test(CSS_LIMPIO.replace(/\n/g, ' '));
    const enSistema = new RegExp(`@media \\(prefers-reduced-motion: reduce\\)\\s*\\{[^@]*html:not\\(\\[data-motion='off'\\]\\) \\.${b.clase}[^{]*\\{\\s*animation:\\s*none`).test(CSS_LIMPIO);
    ok(enReducido && enSistema, `🐛 «${b.id}» se queda QUIETO en Reducido —el de Ajustes y el del iPhone—: antes seguía en bucle`);
  });
  ok(/html\[data-motion='off'\] \*[\s\S]{0,300}animation-iteration-count: 1 !important/.test(CSS_LIMPIO), '…y con «Sin movimiento», una sola vuelta de 0,01 ms (F1)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. El significado sin el movimiento (apartados 2, 13 y 26) ──');
{
  const a = auditarAccesibilidadMotion({ archivos: ARCHIVOS, css: CSS });
  ok(a.cuentas.giro_sin_texto === 0, `🐛 ningún giro de carga va solo: quieto o para VoiceOver tiene que decir algo —su texto al lado, un botón ocupado o \`GiroDeCarga\`${a.cuentas.giro_sin_texto ? ` — ${a.hallazgos.filter((h) => h.tipo === 'giro_sin_texto').map((h) => `${h.archivo}:${h.linea}`).join(', ')}` : ''}`);
  ok(a.cuentas.bucle_sin_estrategia === 0, 'ningún bucle sin estrategia');
  const G = sinComentarios(leer('src/components/accesibilidadMotion.jsx'));
  ok(/role="status"/.test(G) && /<span className="sr-only">\{texto\}<\/span>/.test(G) && /aria-hidden="true"/.test(G), '`GiroDeCarga`: el icono fuera de VoiceOver y su texto dentro, como estado');
  ok(['src/components/BarcodeScanner.jsx', 'src/views/ObjectivesView.jsx', 'src/views/ArmarioView.jsx', 'src/views/RelationView.jsx', 'src/views/SettingsView.jsx'].every((f) => /<GiroDeCarga\b/.test(leer(f))), '…en la cámara, la revisión, las fotos del Armario y del Álbum y la foto de perfil');
  ok(/aria-busy=\{loading \|\| undefined\}/.test(leer('src/components/ui.jsx')), '…y el botón de preguntar a la IA dice que está ocupado');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Las celebraciones: completa, reducida y estática (apartados 16, 18 y 19) ──');
CELEBRACIONES.forEach((c) => {
  const regla = new RegExp(`\\.${c.clase}\\b[^{]*\\{[^}]*animation:\\s*${c.keyframe}\\b`).test(CSS_LIMPIO);
  const fot = (CSS_LIMPIO.match(new RegExp(`@keyframes ${c.keyframe}\\s*\\{([\\s\\S]*?)\\n\\}`)) || [])[1] || '';
  const escalaConToken = !/scale\((?!1\)|var\()/.test(fot) && !/translate[XY]?\((?!0\)|var\(|calc\(var)/.test(fot);
  ok(regla && fot && escalaConToken && c.completa && c.reducida && c.estatica, `«${c.id}»: su escala y su desplazamiento salen de los tokens del motor (en Reducido valen 1 y 0) — completa, reducida y estática`);
});
ok(/--motion-pulso-firma: 1;/.test(CSS_LIMPIO) && /--motion-dist-micro: 0px;/.test(CSS_LIMPIO), '🚨 …y en Reducido los pulsos valen 1 y las distancias 0: una confirmación, no un salto');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Los hápticos (apartados 20, 21 y 22) ──');
ok(['light', 'medium', 'strong', 'success', 'warning', 'error', 'selection'].every((h) => HAPTICOS.some((x) => x.id === h)), 'los siete nombres del enunciado');
ok(HAPTICOS.every((h) => PATRONES_VIBRACION.some((p) => p.id === h.patron)) && patronHaptico('success').id === 'doble' && patronHaptico('nada') === null, '…cada uno sobre un patrón que YA existe (`PATRONES_VIBRACION`, SO F2): ni uno nuevo');
{
  const a = auditarAccesibilidadMotion({ archivos: ARCHIVOS, css: CSS });
  ok(a.cuentas.vibra_por_su_cuenta === 0 && VIBRAN.join() === 'src/lib/audioEngine.js', '🚨 ningún componente vibra por su cuenta: se emite al bus y decide el motor de audio (apartado 21)');
  const malo = auditarAccesibilidadMotion({ archivos: { 'src/views/X.jsx': 'navigator.vibrate(20);\nconst t = "lo llama vibrar(x)";' } });
  ok(malo.cuentas.vibra_por_su_cuenta === 1, '…y la auditoría caza una vibración de verdad, no una frase que la nombra');
  const motor = sinComentarios(leer('src/lib/audioEngine.js')) + sinComentarios(leer('src/lib/sonidoProduccion.js'));
  ok(!/reducirMovimiento|data-motion|prefers-reduced-motion/.test(motor), '🚨 reducir el movimiento NO apaga la vibración: el motor de audio no lo mira (apartado 22, dos preferencias)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. El desplazamiento automático (apartados 32, 33 y 34) ──');
ok(comportamientoDeScroll(contextoMotion()) === 'smooth' && comportamientoDeScroll(contextoMotion({ reducirMovimiento: true })) === 'auto' && comportamientoDeScroll(contextoMotion({ animaciones: guardadoDeModo('off') })) === 'auto', '🚨 con movimiento completo se desliza; en Reducido o sin movimiento, SALTA');
{
  const llamadas = [];
  const el = { scrollIntoView: (o) => llamadas.push(o) };
  desplazarHasta(el, { block: 'nearest' }, contextoMotion({ reducirMovimiento: true }));
  desplazarHasta(el, {}, contextoMotion());
  ok(llamadas[0].behavior === 'auto' && llamadas[0].block === 'nearest' && llamadas[1].behavior === 'smooth' && llamadas[1].block === 'center', '`desplazarHasta` respeta lo que se le pide y pone el comportamiento que toca');
  ok(desplazarHasta(null) === false && desplazarHasta({}) === false && desplazarHasta({ scrollIntoView: () => { throw new Error('x'); } }) === false, '…y sin elemento, o si el navegador falla, no pasa nada');
}
{
  const a = auditarAccesibilidadMotion({ archivos: ARCHIVOS, css: CSS });
  ok(a.cuentas.scroll_suave_a_mano === 0, `🐛 ni un \`behavior: 'smooth'\` escrito a mano: eran siete, e ignoraban «Reducir movimiento»${a.cuentas.scroll_suave_a_mano ? ` — ${a.hallazgos.filter((h) => h.tipo === 'scroll_suave_a_mano').map((h) => `${h.archivo}:${h.linea}`).join(', ')}` : ''}`);
  const usan = Object.entries(ARCHIVOS).filter(([, src]) => /\bdesplazarHasta\(/.test(sinComentarios(src))).map(([a]) => a);
  ok(['src/views/EstudiosView.jsx', 'src/views/EntrenamientoVivoView.jsx', 'src/views/ObjectivesView.jsx', 'src/views/ProductivityView.jsx', 'src/views/EstiloHombreView.jsx', 'src/views/TrainingView.jsx'].every((f) => usan.includes(f)), '…ahora son `desplazarHasta`, en las seis pantallas');
  ok(/\{ modulo: 'accesibilidadMotion', solo: \['desplazarHasta'\]/.test(leer('src/lib/arquitecturaFitness.js')), '…y Fitness solo toma eso de aquí (FIT F44)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. El foco durante una animación (apartados 23, 24 y 25) ──');
ok(filaParaElFoco(['a', 'b', 'c'], ['a', 'c'], 'b') === 'c', '🐛 al borrar una fila con el foco, el foco pasa a la que ocupa su sitio…');
ok(filaParaElFoco(['a', 'b', 'c'], ['a', 'b'], 'c') === 'b', '…a la anterior si era la última…');
ok(filaParaElFoco(['a'], [], 'a') === null && filaParaElFoco(['a', 'b'], ['a', 'b'], 'b') === null && filaParaElFoco(['a'], ['a'], 'z') === null, '…y si la fila sigue ahí, o no queda ninguna, no decide nada');
{
  const L = sinComentarios(leer('src/components/layoutMotion.jsx'));
  ok(/foco: focoEnLista\(this\.raiz\.current\)/.test(L) && /devolverFoco\(this\.raiz\.current, antes && antes\.foco\)/.test(L) && /activo !== document\.body && activo\.isConnected\) return;/.test(L), '`ListaAnimada` apunta dónde estaba el foco ANTES del cambio y, solo si se ha perdido, lo devuelve');
  ok(/filaParaElFoco\(foco\.hermanas, ahora, foco\.id\) \|\| filaParaElFoco\(foco\.orden, ahora, foco\.id\)/.test(L), '…primero entre sus hermanas (una tarea pasa a la siguiente tarea, no al bloque de al lado)');
  ok(/if \(!abierto && caja\.current && typeof document !== 'undefined' && caja\.current\.contains\(document\.activeElement\)\)/.test(L) && /botonDelPlegable\(caja\.current\)/.test(L), '🐛 `Plegable`: plegarlo con el foco dentro lo devuelve a su botón ANTES de volverse inerte (o desmontarse en Reducido)');
  ok(/\[aria-expanded\]/.test(L), '…el botón con `aria-expanded`, o lo enfocable justo antes');
}
ok(/button:not\(\[disabled\]\)/.test(ENFOCABLES) && /\[role="switch"\]/.test(ENFOCABLES), 'lo enfocable incluye botones, campos, enlaces e interruptores');
ok(/\.plegable\[data-plegable='abierto'\] > \.plegable-dentro\s*\{\s*overflow:\s*visible;/.test(CSS_LIMPIO), 'un desplegable quieto no recorta el anillo de foco (apartado 25, F10)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. VoiceOver y la navegación (apartados 9 y 26) ──');
{
  const A = sinComentarios(leer('src/App.jsx'));
  const G = sinComentarios(leer('src/components/accesibilidadMotion.jsx'));
  ok(/<AnuncioDeNavegacion nombre=\{nombrePantalla\} clave=\{claveDeScroll\(pilaNav\)\} \/>/.test(A), '🐛 un aviso dice a dónde se ha llegado al navegar: antes, cambiar de pestaña dejaba la pantalla nueva en silencio');
  ok(/role="region" aria-label=\{nombrePantalla\}/.test(A), '…y el contenedor de la pantalla tiene su nombre: es lo que lee VoiceOver cuando la navegación le da el foco (F2)');
  ok(/aria-live="polite"/.test(G) && /aria-atomic="true"/.test(G) && /className="sr-only"/.test(G), '…un aviso educado, invisible y completo');
  ok(/if \(primera\.current\) \{ primera\.current = false; return undefined; \}/.test(G), '…que no habla al abrir la aplicación (ya se lee la pantalla entera)');
  ok(A.indexOf('<AnuncioDeNavegacion') < A.indexOf('<div key={tab} ref={pantallaRef}'), '…y va FUERA del contenedor con `key`: sobrevive al cambio de pantalla');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Jerarquía, adaptación, matriz y la regla (apartados 37-39, 44, 47 y 50) ──');
ok(JERARQUIA_F12.length === 6 && JERARQUIA_F12.every((j) => NIVELES_MOTION.some((n) => n.nivel === j.nivel && n.id === j.f0)), 'los seis niveles del enunciado son los de la F0, uno a uno');
{
  const altos = MOTION_MAP.filter((e) => e.nivel >= 4);
  ok(MOTION_MAP.every((e) => Number.isInteger(e.nivel) && e.nivel >= 0 && e.nivel <= 5), 'cada animación del mapa tiene su nivel');
  ok(altos.length <= TOPE_NIVELES_ALTOS, `🚨 los niveles altos (énfasis y firma) se usan con moderación: ${altos.length} de ${MOTION_MAP.length}, tope ${TOPE_NIVELES_ALTOS} (apartado 44)`);
}
ok(ADAPTACION.some((a) => /móvil/.test(a.senal) && !a.fiable && /NINGUNO/.test(a.efecto)), '🚨 ser un móvil NO reduce nada (apartado 39)');
ok(ADAPTACION.filter((a) => a.fiable).length >= 2 && ADAPTACION.every((a) => a.senal && a.efecto), 'solo señales fiables: Reducir y los presupuestos');
{
  const recorrido = leer('scripts/test-app-real.mjs');
  const faltan = MATRIZ_QA.filter((m) => !recorrido.includes(m.donde)).map((m) => `${m.entorno}/${m.motion}`);
  ok(MATRIZ_QA.length >= 7 && faltan.length === 0, `la matriz de QA del apartado 47: cada fila con la sección del recorrido que la prueba${faltan.length ? ` — no se encuentra: ${faltan.join(', ')}` : ''}`);
}
ok(PREGUNTAS_DE_UN_MOVIMIENTO.length === 9, 'las nueve preguntas que responde todo movimiento nuevo (apartado 50)');
ok(AUDITORIA_F12.length >= 12 && AUDITORIA_F12.every((a) => a.apartados.length && a.que && a.queda), 'la auditoría de lo que pide el enunciado');
ok(NO_EN_F12.length >= 4 && NO_EN_F12.every((n) => n.que && n.porque), 'lo que no se construye, con su motivo (ni «minimal», ni adaptar por dispositivo, ni otra preferencia)');
{
  const malo = auditarAccesibilidadMotion({ archivos: {
    'src/views/X.jsx': "el.scrollIntoView({ behavior: 'smooth' });\nconst q = window.matchMedia('(prefers-reduced-motion: reduce)');\n<Loader2 className=\"animate-spin\" />\n<i className=\"animate-bounce\" />",
  }, css: '.x { animation: girar 1s linear infinite; }' });
  ok(malo.cuentas.scroll_suave_a_mano === 1 && malo.cuentas.reducir_por_su_cuenta === 1 && malo.cuentas.giro_sin_texto === 1 && malo.cuentas.bucle_sin_estrategia === 2, 'la auditoría CAZA un desplazamiento suave a mano, una pantalla que pregunta por su cuenta, un giro sin texto y dos bucles sin estrategia');
}

console.log('\n── 11. La documentación ──');
const SIS = leer('docs/MOTION_SYSTEM.md');
ok(/intensidadDe/.test(SIS) && /desplazarHasta/.test(SIS) && /GiroDeCarga/.test(SIS) && /AnuncioDeNavegacion/.test(SIS), 'MOTION_SYSTEM.md tiene la accesibilidad del movimiento');
ok(/\*\*F12\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F12');
ok(/C-63/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), 'C-63 está escrita');

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
