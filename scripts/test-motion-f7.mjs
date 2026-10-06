/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 7 — continuidad espacial, elementos compartidos y
   transiciones entre vistas

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f7.mjs

   Lo que se comprueba aquí es la DECISIÓN —el mapa de transiciones, el registro
   de orígenes (que caduca y se gasta), el recorte que crece desde una tarjeta, el
   viaje de un elemento compartido y la llegada al volver— y que la aplicación la
   cablee. Lo que necesita un navegador —que la pantalla de un módulo nazca de su
   tarjeta y que el nombre de un ejercicio viaje hasta su ficha— está en la
   sección «MS F7» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  NIVELES_TRANSICION, MAPA_TRANSICIONES, TTL_ORIGEN_MS, TTL_EFIMERO_MS, registrarOrigen, hayOrigen, tomarOrigen, olvidarOrigenes,
  recorteDesde, planDeContenedor, FORMAS_COMPARTIDO, flipEntre, planDeCompartido, MAX_ESCALA_COMPARTIDO,
  planDeLlegada, AUDITORIA_F7, NO_EN_F7,
} from '../src/lib/continuidad.js';
import { contextoMotion, DURACIONES_MOTION, CURVAS_MOTION } from '../src/lib/motion.js';
import { ultimoDePila, tipoDeNavegacion, TIPOS_NAVEGACION } from '../src/lib/transicionNavegacion.js';
import { MOTION_MAP, auditarMotion } from '../src/lib/motionMapa.js';
import { DEPENDENCIAS_PERMITIDAS } from '../src/lib/arquitecturaFitness.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}

const NORMAL = contextoMotion();
const LENTA = contextoMotion({ velocidad: 'lenta' });
const REDUCIDO = contextoMotion({ reducirMovimiento: true });
const SISTEMA = contextoMotion({ sistemaReduce: true });
const OFF = contextoMotion({ animaciones: 'desactivadas' });

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Los niveles y el mapa de transiciones (apartados 1, 2, 12 y 13) ──');

ok(NIVELES_TRANSICION.map((n) => n.id).join() === 'micro,contextual,estructural,capa', 'cuatro niveles: micro, contextual, estructural y capa (apartado 12)');
ok(NIVELES_TRANSICION.every((n) => n.que && /F\d/.test(n.sistema)), '…cada uno dice qué pieza del sistema lo lleva');
const relaciones = MAPA_TRANSICIONES.map((t) => t.relacion);
for (const r of ['seccion → seccion', 'tarjeta → pantalla', 'pantalla → tarjeta', 'padre → hijo', 'hijo → padre', 'lista → detalle', 'pestaña → pestaña', 'detalle → capa', 'capa → capa anidada']) {
  ok(relaciones.includes(r), `el mapa tiene «${r}»`);
}
ok(MAPA_TRANSICIONES.every((t) => t.ejemplo && t.movimiento && t.protagonista && t.donde && [2, 3, 4].includes(t.nivel)), '…y cada relación dice su ejemplo REAL, su movimiento, su protagonista y dónde vive');
ok(new Set(MAPA_TRANSICIONES.map((t) => t.movimiento)).size === MAPA_TRANSICIONES.length, 'no hay dos relaciones con el mismo movimiento: la dirección tiene significado (apartado 13)');
ok(Object.keys(TIPOS_NAVEGACION).every((k) => k === 'quieto' || MAPA_TRANSICIONES.some((t) => t.donde.includes(`\`${k}\``))), 'los tipos de navegación de la F2 están todos en el mapa');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. El registro de orígenes: caduca y se gasta (apartados 4, 16-18) ──');

olvidarOrigenes();
const R = { top: 300, left: 16, width: 358, height: 82 };
ok(registrarOrigen('pantalla:x', { rect: R, radio: 24 }, 1000) === true, 'se apunta un origen con su rectángulo y sus esquinas');
ok(registrarOrigen('pantalla:y', { rect: { top: 0, left: 0, width: 0, height: 10 } }, 1000) === false && registrarOrigen('', { rect: R }, 1000) === false,
  'un rectángulo vacío o sin id no se apunta (no hay de dónde salir)');
ok(hayOrigen('pantalla:x', 1500) && hayOrigen('pantalla:x', 1500), 'preguntar no lo gasta (lo pregunta el pintado)');
const t1 = tomarOrigen('pantalla:x', 1500);
ok(t1 && t1.radio === 24 && t1.rect.width === 358, 'tomarlo lo devuelve…');
ok(tomarOrigen('pantalla:x', 1501) === null && !hayOrigen('pantalla:x', 1501), '🚨 …y lo GASTA: dos destinos no pueden salir del mismo toque (apartado 17)');
registrarOrigen('pantalla:z', { rect: R }, 1000);
ok(tomarOrigen('pantalla:z', 1000 + TTL_ORIGEN_MS + 1) === null, `🚨 caduca a los ${TTL_ORIGEN_MS} ms: una pantalla que llega tarde (una carga lenta) no sale de un sitio que ya no tiene que ver (apartado 18)`);
registrarOrigen('compartido:a', { rect: R, fuente: 14 }, 1000);
ok(tomarOrigen('compartido:a', 1100)?.fuente === 14, 'un texto apunta también su tamaño de letra');
/* 🐛 Lo cazó el recorrido: al volver de una ficha viajaban los veinte nombres de la lista. */
registrarOrigen('compartido:b', { rect: R }, 2000, { efimero: true });
ok(hayOrigen('compartido:b', 2000 + TTL_EFIMERO_MS) && tomarOrigen('compartido:b', 2000 + TTL_EFIMERO_MS) !== null, `🐛 el origen de algo que DESAPARECE vale para ese mismo cambio (${TTL_EFIMERO_MS} ms)…`);
registrarOrigen('compartido:c', { rect: R }, 2000, { efimero: true });
ok(TTL_EFIMERO_MS < 500 && !hayOrigen('compartido:c', 2500) && tomarOrigen('compartido:c', 2500) === null, '🐛 …y no para los siguientes: volver a una lista no hace viajar a todos sus nombres, solo al que vuelve (apartado 6)');
registrarOrigen('compartido:d', { rect: R }, 3000);
registrarOrigen('compartido:d', { rect: { ...R, top: 77 } }, 3050, { efimero: true });
const d_f7 = tomarOrigen('compartido:d', 3600);
ok(d_f7 !== null && d_f7.rect.top === 77, '…y si lo que se va es lo que se TOCÓ, su origen sigue siendo el del toque (dura lo de un toque) con el rectángulo de justo antes de irse');
{
  const nodo = {};
  registrarOrigen('compartido:e', { rect: R, elemento: nodo }, 4000, { efimero: true });
  ok(tomarOrigen('compartido:e', 4001)?.elemento === nodo, 'el origen dice QUÉ elemento lo dejó…');
}
/* 🐛 Lo cazó el recorrido entero: el mismo ejercicio dos veces en la biblioteca (Recientes y la lista). */
{
  const tocado = {}, hermana = {};
  registrarOrigen('compartido:f', { rect: { ...R, top: 100 }, elemento: tocado }, 5000);
  registrarOrigen('compartido:f', { rect: { ...R, top: 120 }, elemento: tocado }, 5010, { efimero: true });
  ok(registrarOrigen('compartido:f', { rect: { ...R, top: 600 }, elemento: hermana }, 5020, { efimero: true }) === false,
    '🐛 una copia con el MISMO id que se va no pisa el toque de la otra…');
  const f_f7 = tomarOrigen('compartido:f', 5100);
  ok(f_f7 && f_f7.rect.top === 120 && f_f7.elemento === tocado, '…y el nombre sale de donde se puso el dedo, con su rectángulo de justo antes de irse (no 600)');
  registrarOrigen('compartido:g', { rect: { ...R, top: 100 }, elemento: tocado }, 6000);
  registrarOrigen('compartido:g', { rect: { ...R, top: 300 } }, 6010, { efimero: true });
  ok(tomarOrigen('compartido:g', 6020)?.rect.top === 300, 'sin elemento que comparar (un origen apuntado a mano), se actualiza como siempre');
  registrarOrigen('compartido:h', { rect: { ...R, top: 50 }, elemento: tocado }, 7000, { efimero: true });
  registrarOrigen('compartido:h', { rect: { ...R, top: 90 }, elemento: hermana }, 7010, { efimero: true });
  ok(tomarOrigen('compartido:h', 7020)?.elemento === hermana, 'entre dos despedidas no hay toque que proteger: manda la última (lo que React quita en el mismo cambio)');
}
olvidarOrigenes();

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. El contenedor que crece desde su tarjeta (apartados 5, 20, 21, 24, 33 y 34) ──');

const CONT = { top: 0, left: 0, width: 390, height: 1400 };
const origen = { rect: R, radio: 24 };
ok(recorteDesde(origen, CONT) === 'inset(300px 16px 1018px 16px round 24px)', `el recorte empieza EXACTAMENTE en la tarjeta, con sus esquinas (${recorteDesde(origen, CONT)})`);
ok(recorteDesde(origen, { ...CONT, width: 0 }) === null && recorteDesde(null, CONT) === null, 'sin contenedor o sin origen, no hay recorte');
ok(/inset\(0px 0px 0px 0px round 0px\)/.test(recorteDesde({ rect: { top: -50, left: -10, width: 500, height: 2000 }, radio: 0 }, CONT)), 'un origen que se sale del contenedor se recorta a él (nunca un inset negativo)');
const pc = planDeContenedor({ origen, contenedor: CONT, ctx: NORMAL });
ok(pc && pc.keyframes[0].clipPath === recorteDesde(origen, CONT) && pc.keyframes[1].clipPath === 'inset(0px 0px 0px 0px round 0px)',
  '🚨 se abre hasta la pantalla entera mientras las esquinas se enderezan: 24 px → 0 interpolados, nunca de golpe (apartado 20)');
ok(pc && !pc.keyframes.some((k) => k.transform), 'nada se deforma: no hay escala, solo el recorte (apartado 21)');
ok(pc && Number(pc.keyframes[0].opacity) > 0 && Number(pc.keyframes[0].opacity) < 1 && pc.keyframes[1].opacity === '1', 'lo de dentro se revela: empieza medio visible (apartado 24)');
ok(pc && pc.opciones.duration === DURACIONES_MOTION.slow && pc.opciones.easing === CURVAS_MOTION.emphasized && pc.opciones.fill === 'backwards',
  `dura lo que entrar (\`slow\`, ${pc?.opciones.duration} ms), con la curva enfatizada, sin dejar nada puesto`);
ok(planDeContenedor({ origen, contenedor: CONT, ctx: LENTA }).opciones.duration === Math.round(DURACIONES_MOTION.slow * 1.3), '…y obedece a la velocidad');
ok([REDUCIDO, SISTEMA, OFF].every((ctx) => planDeContenedor({ origen, contenedor: CONT, ctx }) === null),
  '🚨 en Reducido —el de Ajustes y el del iPhone— y sin movimiento, no hay recorte: queda la entrada de siempre, que en Reducido ya es un fundido (apartados 33 y 34)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. El elemento compartido (apartados 3, 4, 19, 22, 23 y 34) ──');

ok(FORMAS_COMPARTIDO.join() === 'texto,icono,imagen,superficie', 'cuatro formas: texto, icono, imagen y superficie');
const card = { top: 420, left: 72, width: 200, height: 20 };
const titulo = { top: 96, left: 100, width: 220, height: 56 };
const fT = flipEntre(card, titulo, 'texto', { fuenteOrigen: 14, fuenteDestino: 20 });
ok(fT && fT.dx === -28 && fT.dy === 324 && fT.sx === 0.7 && fT.sy === 0.7,
  `🚨 un TEXTO escala por su LETRA (14/20 = 0,7), no por su caja: el título se parte en dos líneas y escalar por el alto lo encogería de más (apartado 22) — ${JSON.stringify(fT)}`);
ok(flipEntre(card, titulo, 'texto').sx === flipEntre(card, titulo, 'texto').sy, '…sin letra, también escala igual en los dos ejes: un texto nunca se estira');
const fS = flipEntre(card, titulo, 'superficie');
ok(fS.sx !== fS.sy, 'una SUPERFICIE sí puede estirarse');
ok(flipEntre(card, { ...titulo, width: 0 }) === null, 'un destino sin tamaño no viaja');
const pT = planDeCompartido({ origen: { rect: card, radio: 0, fuente: 14 }, destino: titulo, forma: 'texto', fuenteDestino: 20, ctx: NORMAL });
ok(pT && pT.tipo === 'viaje' && /^translate\(-28px, 324px\) scale\(0\.7, 0\.7\)$/.test(pT.keyframes[0].transform) && pT.keyframes[1].transform === 'none' && pT.keyframes[0].transformOrigin === 'top left',
  'el viaje: del rectángulo de la tarjeta al suyo, desde su esquina (FLIP)');
ok(pT.opciones.duration === DURACIONES_MOTION.medium && pT.opciones.easing === CURVAS_MOTION.emphasized, `en \`medium\` (${pT.opciones.duration} ms), con la curva enfatizada`);
const pS = planDeCompartido({ origen: { rect: card, radio: 16 }, destino: titulo, forma: 'superficie', radioDestino: 24, ctx: NORMAL });
ok(pS.keyframes[0].borderRadius === '16px' && pS.keyframes[1].borderRadius === '24px', 'una superficie o una imagen interpolan también sus esquinas (apartados 19 y 20)');
ok(!pT.keyframes[0].borderRadius, '…un texto no tiene esquinas que interpolar');
for (const [nombre, ctx] of [['Reducido', REDUCIDO], ['el del iPhone', SISTEMA]]) {
  const r = planDeCompartido({ origen: { rect: card, fuente: 14 }, destino: titulo, ctx });
  ok(r && r.tipo === 'fundido' && r.keyframes.every((k) => !k.transform), `🚨 en ${nombre}, se funde en su sitio: la continuidad sin recorrido (apartado 34)`);
}
ok(planDeCompartido({ origen: { rect: card }, destino: titulo, ctx: OFF }) === null, 'sin movimiento, nada');
const lejos = planDeCompartido({ origen: { rect: { top: 0, left: 0, width: 10, height: 10 } }, destino: { top: 0, left: 0, width: 10 * (MAX_ESCALA_COMPARTIDO + 1), height: 10 * (MAX_ESCALA_COMPARTIDO + 1) }, forma: 'icono', ctx: NORMAL });
ok(lejos && lejos.tipo === 'fundido', `🚨 un viaje desmesurado (más de ×${MAX_ESCALA_COMPARTIDO}) se cambia por un fundido: un salto no es continuidad (apartado 33, fallback)`);
ok(planDeCompartido({ origen: null, destino: titulo, ctx: NORMAL }) === null, 'sin origen no se inventa ninguno');

console.log('\n── 5. La llegada al volver (apartado 6) ──');

const ll = planDeLlegada(NORMAL);
ok(/^scale\(1\.0[0-3]\d*\)$/.test(ll.keyframes[0].transform) && ll.keyframes[0].filter && ll.keyframes[1].transform === 'none',
  `la tarjeta de la que se salió se posa: de un poco más grande —nunca por encima del tope de una superficie, 1,03— y más clara, a su sitio (${ll.keyframes[0].transform})`);
ok(ll.opciones.duration === DURACIONES_MOTION.medium && ll.opciones.easing === CURVAS_MOTION.entrance, '…en `medium`, con la curva que se posa');
ok(planDeLlegada(REDUCIDO).keyframes.every((k) => !k.transform && !k.filter) && planDeLlegada(OFF) === null, 'en Reducido solo se funde, y sin movimiento nada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. El cableado ──');

const APP = leer('src/App.jsx');
const APP_L = sinComentarios(APP);
const HUB = sinComentarios(leer('src/views/HubView.jsx'));
const COMP = leer('src/components/continuidad.jsx');
const COMP_L = sinComentarios(COMP);
ok(/if \(origen && origen\.elemento !== el && !deUnaHermanaQueSigue\)/.test(COMP_L) && /elemento: el \}/.test(COMP_L), '🐛 …y un elemento no sale de su propio origen: con el efecto que se deshace y se rehace (StrictMode) no viajaba a su propio sitio');
ok(/const deUnaHermanaQueSigue = !!origen && origen\.efimero && !!origen\.elemento && origen\.elemento\.isConnected;/.test(COMP_L),
  '🐛 …ni de la despedida de una HERMANA que sigue en la pantalla (el ensayo de StrictMode con el mismo id dos veces): al volver viajaba más de un nombre');
ok(/apuntarOrigen\(`pantalla:\$\{id\}`, tarjetas\.current\[id\]\);\s*onOpenModulo\(id\);/.test(HUB),
  '🚨 la tarjeta de la portada apunta su rectángulo JUSTO antes de navegar, ya crecida');
ok(/ref=\{\(el\) => \{ tarjetas\.current\[id\] = el; \}\}/.test(HUB) && /data-modulo=\{id\}/.test(HUB), '…cada tarjeta se guarda por su id');
ok(/if \(vieneDe && tarjetas\.current\[vieneDe\]\) animarLlegada\(tarjetas\.current\[vieneDe\]\);/.test(HUB) && /useLayoutEffect\(/.test(HUB), '…y al volver, la de la que se salió se posa, antes de pintarse');
ok(/useContenedorDesdeOrigen\(pantallaRef, \{ id: tipoNav === 'entrar' \? `pantalla:\$\{tab\}` : null, clave: claveDeScroll\(pilaNav\) \}\);/.test(APP_L),
  'App.jsx hace crecer la pantalla desde su origen, SOLO al entrar');
const posNav = APP.indexOf('useNavegacionEnLaPagina(pantallaRef');
const posCont = APP.indexOf('useContenedorDesdeOrigen(pantallaRef');
const primerReturn = APP.indexOf('if (session === undefined) return');
ok(posNav > 0 && posCont > posNav && posCont < primerReturn, '🚨 después de poner el scroll arriba (se mide en su sitio) y antes de cualquier `return` (regla 4)');
ok(/const desdeTarjeta = tipoNav === 'entrar' && hayOrigen\(`pantalla:\$\{tab\}`\) && !contextoDelDocumento\(\)\.reducido && contextoDelDocumento\(\)\.espacial;/.test(APP_L)
  && /className=\{`outline-none \$\{desdeTarjeta \? '' : claseDeNavegacion\(tipoNav\)\}`\.trim\(\)\}/.test(APP_L),
  '…y entonces la pantalla NO lleva además la entrada desde la derecha: dos movimientos para la misma llegada serían uno de más');
ok(/setVieneDe\(tipo === 'volver' \? ultimoDePila\(antes\) : null\);/.test(APP_L) && /vieneDe=\{vieneDe\}/.test(APP_L), 'App.jsx sabe de qué pantalla se vuelve y se lo dice a la portada');
ok(ultimoDePila(['hoy', 'area-vida', 'productividad']) === 'productividad' && ultimoDePila([{ id: 'hoy' }, { id: 'area-gestion' }]) === 'area-gestion',
  '`ultimoDePila` devuelve la pantalla de arriba, con la pila escrita de las dos formas (la raíz siempre está, NAVO F1)');
ok(tipoDeNavegacion(['hoy', 'area-vida'], ['hoy', 'area-vida', 'productividad']) === 'entrar' && tipoDeNavegacion(['hoy', 'area-vida', 'productividad'], ['hoy', 'area-vida']) === 'volver',
  'entrar en un módulo desde su portada es `entrar` y salir es `volver` (la F2 no cambia)');
ok(/export function Compartido/.test(COMP) && /onPointerDownCapture=\{apuntar\}/.test(COMP_L) && /return \(\) => \{ apuntarOrigen\(`compartido:\$\{id\}`, el, \{ efimero: true \}\); \};/.test(COMP_L),
  '`Compartido` apunta su origen al tocarlo Y al desaparecer: funciona en los dos sentidos (apartados 4 y 6)');
ok(/animacion\.effect\.setKeyframes\(plan\.keyframes\)/.test(COMP_L) && /requestAnimationFrame/.test(COMP_L), '🐛 si el padre mueve el scroll después de medir, el viaje se corrige antes del primer fotograma');
ok(!/useState/.test(COMP_L) && !/saveData|app_data/.test(COMP_L), 'no guarda nada ni repinta React: el origen es de la pantalla (EH F40)');
const BIB = leer('src/components/bibliotecaEjercicios.jsx');
ok((BIB.match(/<Compartido as="p" id=\{`ejercicio:\$\{(ejercicio|ficha\.ejercicio)\.id\}`\}/g) || []).length === 2, '🚨 el nombre de un ejercicio es el MISMO elemento en la tarjeta y en la ficha (`ejercicio:<id>`)');
ok(DEPENDENCIAS_PERMITIDAS.some((d) => d.modulo === 'continuidad'), 'Fitness declara la dependencia nueva, con su motivo (FIT F44)');
ok((leer('src/views/DashboardView.jsx').match(/apuntarOrigen/g) || []).length === 0, '⚠️ las tarjetas de Inicio NO crecen: son un resumen, no el módulo (AUDITORIA_F7)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. El mapa, la auditoría y lo que no se hace ──');

const mapa = (id) => MOTION_MAP.find((e) => e.id === id);
ok(mapa('contenedor_desde_tarjeta')?.fase === 7 && mapa('llegada_tarjeta')?.fase === 7 && mapa('compartido_ejercicio')?.componente === 'Compartido', 'el MOTION_MAP tiene las tres continuidades de la F7');
ok(mapa('expandir_tarjeta_area')?.estado === 'existe', 'la expansión de la tarjeta ya no está «inconsistente»: ahora lleva a algún sitio');
const aud = auditarMotion({ css: leer('src/index.css'), vistas: {} });
ok(aud.sinMapa.length === 0 && aud.keyframesHuerfanos.length === 0, 'la auditoría de la F0 sigue limpia');
ok(AUDITORIA_F7.length >= 6 && AUDITORIA_F7.every((a) => a.que && a.decision && a.porque), `la auditoría de las tarjetas que abren algo (apartado 5): ${AUDITORIA_F7.length} decisiones con su motivo`);
ok(NO_EN_F7.length >= 3 && NO_EN_F7.every((n) => n.que && n.porque), 'lo que no se construye, con su motivo');
ok(NO_EN_F7.some((n) => /C-56/.test(n.porque)), '…dos pantallas vivas a la vez es la C-56');

console.log('\n── 8. La documentación ──');
const SIS = leer('docs/MOTION_SYSTEM.md');
ok(/Compartido/.test(SIS) && /useContenedorDesdeOrigen/.test(SIS) && /MAPA_TRANSICIONES/.test(SIS), 'MOTION_SYSTEM.md dice cuándo usar cada pieza de la F7');
ok(/\*\*F7\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F7');
ok(/C-58/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), 'C-58 está escrita');

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
