/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 14 — easings, curvas, ritmo, aceleración y lenguaje visual del movimiento

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f14.mjs

   Lo que se comprueba aquí es la GRAMÁTICA del movimiento (`src/lib/lenguajeMotion.js`): que cada curva
   tenga un papel y cada animación del mapa el suyo, que la duración quepa en su talla, que abrir y cerrar,
   entrar y salir, no sean lo mismo al revés, que lo equivalente vaya al mismo ritmo, que la velocidad que
   se ve esté en la banda del sistema, y que la auditoría lea el CSS de verdad: con el `index.css` de hoy
   sale limpia y con cada fallo inventado se pone roja. Lo que necesita un navegador —la curva que le queda
   de verdad a cada clase, el Historial de Salud abriéndose y cerrándose, la pasada global por toda la
   aplicación— está en la sección «MS F14» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  TEMPERATURA_MOTION, FIRMA_MOTION, ROLES_MOTION, CATEGORIAS_QUE_APARECEN, ROL_POR_CLASE, CURVAS_DOBLES, curvaDeVar, rolDe, curvasEsperadas,
  ESCALA_MOVIMIENTO, tallaDeNivel, BANDA_VELOCIDAD, VELOCIDAD_A_PROPOSITO, velocidadesPercibidas,
  LENGUAJE_CAPAS, LENGUAJE_NAVEGACION, LENGUAJE_GESTOS, PAREJAS, EQUIVALENTES, movimientoDeClase, auditarLenguaje,
  CORREGIDO_F14, REVISADO_Y_BIEN_F14, NO_EN_F14,
} from '../src/lib/lenguajeMotion.js';
import { CURVAS_MOTION, DURACIONES_MOTION, DISTANCIAS_MOTION, PRESETS_MOTION, STAGGER_MOTION, TOPES_ESCALA, SPRINGS_MOTION } from '../src/lib/motion.js';
import { MOTION_MAP, NIVELES_MOTION, escanearCss } from '../src/lib/motionMapa.js';
import { JERARQUIA_MUELLES, MUELLES_EN_USO } from '../src/lib/fisicaMotion.js';
import { ANIMACIONES_HC } from '../src/lib/pulidoHC.js';
import { auditarMovimiento } from '../src/lib/feedbackFitness.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}

const CSS = leer('src/index.css');
const LIB = leer('src/lib/lenguajeMotion.js');
const tipos = (r) => [...new Set(r.problemas.map((p) => p.tipo))];
/** El CSS con UNA regla cambiada: falla si el trozo no está (así una mutación que ya no muerde no pasa en silencio). */
const conCambio = (de, a) => {
  if (!CSS.includes(de)) throw new Error(`La mutación no encuentra «${de}» en index.css`);
  return CSS.replace(de, a);
};

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. La firma y la temperatura (apartados 44, 45, 49 y 50) ──');
ok(TEMPERATURA_MOTION.punto && /linear/.test(TEMPERATURA_MOTION.noFrio) && /rebota|elástico/.test(TEMPERATURA_MOTION.noCaliente), 'la temperatura dice el punto (preciso, premium, natural) y los dos extremos que se evitan: lo mecánico y lo de dibujos');
ok(FIRMA_MOTION.length >= 6 && FIRMA_MOTION.every((f) => f.que && f.como && f.donde), 'la firma de JosStyle está escrita rasgo a rasgo, cada uno con dónde vive');
{
  const exportados = { CURVAS_MOTION, DISTANCIAS_MOTION, TOPES_ESCALA, STAGGER_MOTION, PRESETS_MOTION, NIVELES_MOTION };
  const nombres = FIRMA_MOTION.map((f) => f.donde.split(/[\s.]/)[0]).filter((n) => /^[A-Z_]+$/.test(n));
  ok(nombres.length >= 5 && nombres.every((n) => exportados[n]), `cada rasgo de la firma apunta a un token que existe (${nombres.join(', ')})`);
}
ok(/button\.hub-card::after|button\.hub-card:not\(\[class\*='active:scale'\]\)::after/.test(CSS), 'el rasgo «las sombras se funden» está en index.css (la capa de la F13)');
ok(!/\b(bounce|elastic|wobble|shake|jello|rubberBand|confetti)\b/i.test(sinComentarios(CSS)), 'ni un rebote, ni una elástica, ni un temblor, ni confeti en index.css (apartados 49 y 50)');
ok(!/cubic-bezier\(/.test(sinComentarios(LIB)) && !/\b\d{2,4}\s*ms\b/.test(sinComentarios(LIB).replace(/'[^'\n]*'|`[^`]*`|"[^"\n]*"/g, '')),
  'el lenguaje no escribe ni una curva ni una duración propias: todo son ids de los tokens de la F1 (apartado 51)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Las curvas tienen papel (apartados 1-6, 13 y 14) ──');
ok(ROLES_MOTION.every((r) => CURVAS_MOTION[r.curva]) && Object.keys(CURVAS_MOTION).every((c) => ROLES_MOTION.some((r) => r.curva === c)),
  `las seis curvas de la F1 tienen UN papel cada una, y ningún papel usa una curva que no exista (${ROLES_MOTION.map((r) => `${r.id}→${r.curva}`).join(', ')})`);
ok(new Set(ROLES_MOTION.map((r) => r.curva)).size === ROLES_MOTION.length, 'ningún papel comparte curva con otro: una curva, un significado');
ok(curvaDeVar('var(--ease-premium)') === 'standard' && curvaDeVar('var(--motion-curva-entrance)') === 'entrance' && curvaDeVar('--motion-curva-exit') === 'exit', 'la curva de una variable CSS se lee como su id (la estándar es `--ease-premium`, la de la Fase N2)');
{
  const sinPapel = MOTION_MAP.filter((e) => !ROLES_MOTION.some((r) => r.id === rolDe(e)));
  ok(sinPapel.length === 0, `cada una de las ${MOTION_MAP.length} líneas del mapa tiene papel`);
  const momentos = MOTION_MAP.filter((e) => e.nivel >= 4);
  ok(momentos.length >= 3 && momentos.every((e) => rolDe(e) === 'momento' && curvasEsperadas(e).includes('emphasized')),
    `los niveles Momento y Firma del mapa (${momentos.map((e) => e.id).join(', ')}) tienen el papel de momento: \`emphasized\``);
  const aparecen = MOTION_MAP.filter((e) => CATEGORIAS_QUE_APARECEN.includes(e.categoria) && e.nivel < 4 && !ROL_POR_CLASE[e.clase]);
  ok(aparecen.every((e) => rolDe(e) === 'aparece'), `lo de las categorías que aparecen (capas, hojas, menús, avisos) aparece (${aparecen.length})`);
}
ok(Object.entries(ROL_POR_CLASE).every(([c, x]) => MOTION_MAP.some((e) => e.clase === c) && ROLES_MOTION.some((r) => r.id === x.rol) && x.porque),
  'cada excepción de papel es de una clase que está en el mapa, con un papel que existe y su motivo');
ok(Object.entries(CURVAS_DOBLES).every(([c, x]) => MOTION_MAP.some((e) => e.clase === c) && x.curvas.every((v) => CURVAS_MOTION[v]) && x.porque),
  'las tres clases con dos curvas (una por propiedad) están en el mapa y dicen por qué');
{
  const enMapa = MOTION_MAP.filter((e) => e.clase && e.easing);
  const malas = enMapa.filter((e) => !CURVAS_MOTION[curvaDeVar(e.easing)]);
  ok(enMapa.length >= 40 && malas.length === 0, `cada línea del mapa con clase dice su curva con un token (${enMapa.length}; ${malas.map((e) => e.id).join(', ')})`);
}
{
  const reglas = escanearCss(CSS).filter((r) => r.tipo === 'animation' || r.tipo === 'transition');
  const aMano = reglas.filter((r) => /cubic-bezier\(|(?<![-\w])ease(-in|-out|-in-out)?(?![-\w])|steps\(/.test(r.valor));
  ok(reglas.length > 40 && aMano.length === 0, `ni una animación ni una transición de index.css con una curva escrita a mano o un \`ease\` suelto: ${reglas.length} reglas, todas con su token (apartado 2${aMano.length ? `; ${aMano.map((r) => r.selector).join(', ')}` : ''})`);
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. La escala del movimiento y la velocidad que se ve (apartados 7-9 y 16-19) ──');
ok(ESCALA_MOVIMIENTO.map((t) => t.talla).join() === 'XS,SM,MD,LG,XL' && ESCALA_MOVIMIENTO.every((t) => NIVELES_MOTION.some((n) => n.nivel === t.nivel && n.nombre === t.nombre)),
  'cinco tallas, XS a XL, una por cada nivel que se mueve del mapa de la F0, con su mismo nombre');
ok(ESCALA_MOVIMIENTO.every((t) => t.duraciones.every((d) => d in DURACIONES_MOTION) && t.distanciaMax in DISTANCIAS_MOTION),
  'cada talla dice qué duraciones le caben y cuánto se desplaza como mucho, con ids de los tokens');
ok(ESCALA_MOVIMIENTO.every((t, i, a) => i === 0 || DURACIONES_MOTION[t.duraciones[t.duraciones.length - 1]] >= DURACIONES_MOTION[a[i - 1].duraciones[a[i - 1].duraciones.length - 1]]),
  'a más talla, más tiempo: el techo de cada talla no baja del de la anterior (apartado 18)');
ok(MOTION_MAP.every((e) => e.nivel === 0 || tallaDeNivel(e.nivel)) && !tallaDeNivel(0), 'toda línea del mapa que se mueve cae en una talla (el nivel 0, «Estático», no tiene: no se mueve)');
ok(ESCALA_MOVIMIENTO.find((t) => t.talla === 'XL').duraciones.join() === 'firma' && MOTION_MAP.filter((e) => e.nivel === 5).length === 1,
  'la talla Firma tiene una sola duración y una sola animación: el «+1» de una racha');
{
  const v = velocidadesPercibidas(CSS);
  const medidas = v.filter((x) => x.pxPorMs !== null);
  const fuera = medidas.filter((x) => !VELOCIDAD_A_PROPOSITO[x.keyframe] && (x.pxPorMs < BANDA_VELOCIDAD.minPxMs || x.pxPorMs > BANDA_VELOCIDAD.maxPxMs));
  ok(medidas.length >= 15 && fuera.length === 0,
    `la velocidad que se ve de las ${medidas.length} entradas que se desplazan está en la banda del sistema (${BANDA_VELOCIDAD.minPxMs}-${BANDA_VELOCIDAD.maxPxMs} px/ms: de ${Math.min(...medidas.filter((x) => !VELOCIDAD_A_PROPOSITO[x.keyframe]).map((x) => x.pxPorMs))} a ${Math.max(...medidas.map((x) => x.pxPorMs))}; apartados 7 y 8)`);
  const masUno = v.find((x) => x.keyframe === 'masUnoSube');
  ok(masUno && masUno.pxPorMs < BANDA_VELOCIDAD.minPxMs && VELOCIDAD_A_PROPOSITO.masUnoSube, `…salvo el «+1», que va despacio A PROPÓSITO y lo dice (${masUno && masUno.pxPorMs} px/ms)`);
  const pantalla = v.find((x) => x.keyframe === 'moduleSlideIn');
  ok(pantalla && pantalla.distancia === DISTANCIAS_MOTION.large && pantalla.duracion === 'slow', 'la pantalla que entra recorre `large` en `slow`: lo más lejos, lo que más tarda (apartado 7)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. La auditoría lee el CSS de verdad: hoy limpia, y roja con cada fallo inventado (apartados 46 y 47) ──');
{
  const hoy = auditarLenguaje({ css: CSS });
  ok(hoy.problemas.length === 0, `🚨 con el index.css de hoy, el lenguaje no tiene ni un problema${hoy.problemas.length ? `: ${JSON.stringify(hoy.problemas).slice(0, 400)}` : ''}`);
  const medidas = MOTION_MAP.filter((e) => e.clase && movimientoDeClase(CSS, e.clase).reglas > 0);
  ok(medidas.length >= 50, `…y no es porque no mire: mide ${medidas.length} líneas del mapa contra sus reglas`);
}
const casos = [
  ['un momento con la curva estándar', '.fuego-sube {\n  display: inline-flex;\n  animation: fuegoSube var(--motion-dur-momento) var(--motion-curva-emphasized) both;', '.fuego-sube {\n  display: inline-flex;\n  animation: fuegoSube var(--motion-dur-momento) var(--ease-premium) both;', ['curva_fuera_de_su_papel', 'mapa_dice_otra_curva']],
  ['una hoja que entra con la curva de salida', '.hoja-entra {\n  animation: calendarSheetIn var(--motion-dur-normal) var(--motion-curva-entrance) backwards;', '.hoja-entra {\n  animation: calendarSheetIn var(--motion-dur-normal) var(--motion-curva-exit) backwards;', ['curva_fuera_de_su_papel']],
  ['una cifra (talla XS) que dura como una cinemática', '.cifra-sube {\n  animation: cifraSube var(--motion-dur-normal)', '.cifra-sube {\n  animation: cifraSube var(--motion-dur-cinematic)', ['duracion_fuera_de_su_talla']],
  ['una pantalla que entra más despacio de lo que dice su preset', '.module-enter {\n  animation: moduleSlideIn var(--motion-dur-slow)', '.module-enter {\n  animation: moduleSlideIn var(--motion-dur-medium)', ['preset_y_css_distintos']],
  ['una barra de progreso a otro ritmo que las demás', '.nu-progreso {\n  transition: width var(--motion-dur-medium)', '.nu-progreso {\n  transition: width var(--motion-dur-cinematic)', ['equivalentes_a_distinto_ritmo']],
  ['una pantalla que cruza 24 px en 120 ms', '.module-enter {\n  animation: moduleSlideIn var(--motion-dur-slow)', '.module-enter {\n  animation: moduleSlideIn var(--motion-dur-ultrafast)', ['velocidad_fuera_de_banda']],
  ['un chevron que gira con otra curva que su desplegable', 'transition: transform var(--motion-dur-normal) var(--motion-curva-smooth);', 'transition: transform var(--motion-dur-normal) var(--ease-premium);', ['curva_fuera_de_su_papel']],
];
casos.forEach(([que, de, a, esperados]) => {
  const r = auditarLenguaje({ css: conCambio(de, a) });
  const t = tipos(r);
  ok(esperados.every((e) => t.includes(e)), `se pone roja con ${que} (${t.join(', ') || 'nada'})`);
});
{
  const dosReglas = conCambio('hojaSubeDelBorde var(--motion-dur-normal) var(--motion-curva-entrance)', 'hojaSubeDelBorde var(--motion-dur-normal) var(--ease-premium)')
    .replace('calendarSheetIn var(--motion-dur-normal) var(--motion-curva-entrance) backwards;\n}\n\n/* MS F6', 'calendarSheetIn var(--motion-dur-normal) var(--ease-premium) backwards;\n}\n\n/* MS F6');
  const t = tipos(auditarLenguaje({ css: dosReglas }));
  ok(t.includes('preset_y_css_distintos') && t.includes('curva_fuera_de_su_papel'), `se pone roja si las dos reglas de la hoja vuelven a la estándar mientras su preset dice \`entrance\` (${t.join(', ') || 'nada'})`);
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Entrar y salir, abrir y cerrar (apartados 4-6, 38, 39 y 42) ──');
ok(PAREJAS.every((p) => PRESETS_MOTION[p.ida] && PRESETS_MOTION[p.vuelta]), `cada pareja de acciones tiene sus dos presets (${PAREJAS.length})`);
ok(PAREJAS.every((p) => DURACIONES_MOTION[PRESETS_MOTION[p.vuelta].duracion] <= DURACIONES_MOTION[PRESETS_MOTION[p.ida].duracion]),
  'en todas, lo que se va o vuelve dura lo mismo o menos que lo que llega (apartado 6)');
ok(Object.entries(PRESETS_MOTION).filter(([id]) => /Exit$/.test(id)).every(([, p]) => p.curva === 'exit'),
  'toda salida acelera hacia fuera con `exit`, y ninguna entrada la usa (apartado 5)');
ok(Object.entries(PRESETS_MOTION).filter(([id]) => /Enter$/.test(id)).every(([, p]) => p.curva !== 'exit'), '…ninguna entrada sale con la curva de salida');
ok(PRESETS_MOTION.expand.curva === 'smooth' && PRESETS_MOTION.collapse.curva === 'smooth' && DURACIONES_MOTION[PRESETS_MOTION.collapse.duracion] < DURACIONES_MOTION[PRESETS_MOTION.expand.duracion],
  'desplegar y plegar son la curva simétrica, y plegar es más corto (apartado 42)');
ok(DURACIONES_MOTION[PRESETS_MOTION.pageBack.duracion] < DURACIONES_MOTION[PRESETS_MOTION.pageEnter.duracion] && !PRESETS_MOTION.pageBack.desde.escala,
  'volver es más corto que entrar y sin escala: se vuelve a algo que ya estaba (apartado 39)');
{
  const plegable = escanearCss(CSS).filter((r) => /^\.plegable(\[|$)/.test(r.selector));
  ok(/--motion-dur-fast\)\s+var\(--motion-curva-smooth\)/.test(CSS.slice(CSS.indexOf('.plegable {'), CSS.indexOf('.plegable {') + 900)) && /\.plegable\[data-plegable='abriendo'\]\s*\{\s*transition-duration:\s*var\(--motion-dur-medium\)/.test(CSS) && plegable.length >= 1,
    '🐛 el CSS del desplegable lo cumple: cierra en `fast`, abre en `medium` (`[data-plegable=abriendo]`), los dos con `smooth`');
  ok(/duracionMs\(estado === 'abriendo' \? 'medium' : 'fast', ctx\)/.test(leer('src/components/layoutMotion.jsx')),
    '…y el respaldo de `Plegable` espera lo suyo en cada sentido (si esperara siempre lo de cerrar, cortaría la apertura)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Lo equivalente va al mismo ritmo, y lo corregido se queda corregido (apartados 8, 46, 47 y 53) ──');
EQUIVALENTES.forEach((g) => {
  const durs = g.clases.map((c) => movimientoDeClase(CSS, c).duraciones.join('/'));
  ok(durs.every((d) => d) && new Set(durs).size === 1, `${g.que}: ${g.clases.map((c, i) => `${c} ${durs[i] || '—'}`).join(' · ')}`);
});
ok(['barras_progreso_css', 'progreso_libro', 'progreso_nutricion', 'barra_fitness'].every((id) => (MOTION_MAP.find((e) => e.id === id) || {}).duracion === DURACIONES_MOTION.medium),
  'el mapa dice lo mismo que el CSS de las cuatro barras (280 ms)');
ok(['progreso_dia', 'progreso_nutricion'].every((id) => (ANIMACIONES_HC.find((a) => a.id === id) || {}).ms === DURACIONES_MOTION.medium),
  'y el catálogo de la E3 F14 también (el que compara la FIT F37 duración a duración)');
ok(PRESETS_MOTION.heroReveal.duracion === 'medium' && PRESETS_MOTION.heroReveal.curva === 'emphasized',
  '🐛 el preset de subir de rango decía `momento` y el CSS duraba `medium`: ahora dice lo que hace');
ok(PRESETS_MOTION.sheetEnter.curva === 'entrance' && PRESETS_MOTION.toastEnter.curva === 'entrance' && PRESETS_MOTION.modalEnter.curva === 'entrance',
  'las tres capas que aparecen —ventana, hoja y aviso— entran con `entrance`, como ya hacían las capas de la F6');
ok(CORREGIDO_F14.length >= 5 && CORREGIDO_F14.every((c) => c.que && c.antes && c.ahora), 'lo corregido en la fase está escrito, con el antes y el ahora (apartado 47)');
{
  const curva = auditarMovimiento({ css: CSS }).casillas.find((c) => c.id === 'una_sola_curva');
  ok(curva && curva.ok && !auditarMovimiento({ css: CSS.replace('fitRangoSube var(--motion-dur-medium) var(--motion-curva-emphasized)', 'fitRangoSube var(--motion-dur-medium) ease-out') }).casillas.find((c) => c.id === 'una_sola_curva').ok, `la auditoría de movimiento de Fitness (FIT F37) sigue en verde con las curvas nuevas: aceptó evolucionar de «una sola curva» a «los tokens de curva» (apartado 53; y con un \`ease-out\` a mano se sigue poniendo roja: ${curva && curva.dato})`);
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Muelles, cascada y escala: lo que ya estaba bien sigue bien (apartados 10-15, 20-24, 28-32) ──');
ok(!MUELLES_EN_USO.includes('bouncy') && MUELLES_EN_USO.every((m) => SPRINGS_MOTION[m]), `los muelles que se usan (${MUELLES_EN_USO.join(', ')}) existen y ninguno es el que rebota (apartados 12 y 13)`);
ok(JERARQUIA_MUELLES.length >= 5, 'la jerarquía de muelles de la F8 sigue siendo la del lenguaje (apartado 11)');
ok(STAGGER_MOTION.pasoMs === 60 && STAGGER_MOTION.escalones <= 6, 'la cascada: un paso de 60 ms y como mucho seis escalones (apartados 21 y 22)');
ok(TOPES_ESCALA.superficie.max <= 1.03 && TOPES_ESCALA.superficie.min >= 0.95, `una superficie se escala entre ${TOPES_ESCALA.superficie.min} y ${TOPES_ESCALA.superficie.max}: ni un 1,05 de anuncio (apartado 32)`);
{
  const tokens = Object.values(DURACIONES_MOTION).filter((v) => v > 0).sort((a, b) => a - b);
  const huecos = tokens.slice(1).map((v, i) => v - tokens[i]);
  ok(Math.min(...huecos) >= 40, `las duraciones están separadas al menos 40 ms (${tokens.join(', ')}): ni un 190 junto a un 195 (apartado 19)`);
}
ok(REVISADO_Y_BIEN_F14.length >= 8 && REVISADO_Y_BIEN_F14.every((r) => r.que && r.porque), 'lo que se miró y está bien, dicho (para no volver a barrerlo)');
ok(NO_EN_F14.length >= 4 && NO_EN_F14.every((n) => n.que && n.porque) && NO_EN_F14.some((n) => /Parallax/.test(n.que)) && NO_EN_F14.some((n) => /Tooltip/.test(n.que)),
  'lo que no se construye, con su motivo (ni parallax, ni tooltips, ni un muelle en cada cosa, ni tokens de más)');
ok(!/parallax|background-attachment:\s*fixed/i.test(sinComentarios(CSS)), 'ni un parallax en index.css (apartado 29)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. El lenguaje de las capas, la navegación y los gestos (apartados 33-43) ──');
ok(LENGUAJE_CAPAS.length >= 5 && LENGUAJE_CAPAS.every((c) => c.capa && c.como && c.donde), 'cada capa —ventana, hoja, menú, aviso y la información pequeña que no existe— dice cómo entra y dónde vive');
ok(LENGUAJE_CAPAS.filter((c) => c.entra && c.sale).every((c) => DURACIONES_MOTION[c.sale.duracion] <= DURACIONES_MOTION[c.entra.duracion] && c.sale.curva === 'exit'), '…y cada una se va más deprisa de lo que llega, con `exit`');
ok(LENGUAJE_NAVEGACION.every((n) => PRESETS_MOTION[n.preset]) && LENGUAJE_NAVEGACION.length >= 5, 'la navegación tiene un preset por nivel: raíz, dentro de una pantalla, detalle, volver y lo que se apila');
ok(LENGUAJE_GESTOS.every((g) => leer(g.donde.split(' ')[0]) && g.como), 'el lenguaje de los gestos apunta a los archivos que lo cumplen (F5, F8 y F11)');
{
  const capas = leer('src/lib/profundidad.js');
  ok(/CURVAS_MOTION/.test(capas) && /entrance/.test(capas), 'las capas de la F6 siguen entrando con `entrance` (de ahí salió la regla de lo que aparece)');
}

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. La regla permanente, el recorrido y la documentación (apartados 52, 54 y 56) ──');
{
  const recorrido = leer('scripts/test-app-real.mjs');
  ok(/── MS F14 · El lenguaje del movimiento/.test(recorrido) && /__lenguaje_ms14/.test(recorrido) && /Desplegar Historial/.test(recorrido.slice(recorrido.indexOf('── MS F14'))),
    'el recorrido lee las curvas de verdad en Chromium, abre y cierra el Historial de Salud y hace la pasada global por la aplicación');
}
const SIS = leer('docs/MOTION_SYSTEM.md');
ok(/auditarLenguaje/.test(SIS) && /ROLES_MOTION/.test(SIS) && /ESCALA_MOVIMIENTO/.test(SIS) && /BANDA_VELOCIDAD/.test(SIS) && /PAREJAS/.test(SIS),
  'MOTION_SYSTEM.md tiene la filosofía, las curvas con su papel, la escala, la velocidad y las parejas (apartado 52)');
ok(/\*\*F14\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F14');
ok(!/framer-motion|react-spring|gsap|animejs|popmotion|motion-one/.test(leer('package.json')), 'ni una librería de animación en el paquete');

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
