/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 5 — física, gestos, touch y comportamiento táctil

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f5.mjs

   Lo que se comprueba aquí es la DECISIÓN —de qué eje es un gesto, qué velocidad
   lleva, cuánto resiste un borde, cuándo se cierra una hoja o se cambia de
   ejercicio, cómo vuelve un muelle— y que la aplicación la cablee (el asa en las
   once hojas que salen por abajo, la tarjeta del entrenamiento en vivo, los
   umbrales en un solo sitio). Lo que necesita un navegador —que la tarjeta y la
   hoja SIGAN al dedo, que un lanzamiento corto cierre y uno lento vuelva— está en
   la sección «MS F5» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  UMBRALES_GESTO, ejeDeGesto, velocidadDeMuestras, resistencia, conResistencia,
  decidirSoltar, decidirCambio, vueltaConMuelle, salidaConInercia,
  MUELLE_POR_MASA, muelleDe, AUDITORIA_F5, NO_EN_F5,
} from '../src/lib/gestosMotion.js';
import { UMBRALES_GESTO as HOJA_DE_UMBRALES } from '../src/lib/umbralesGesto.js';
import { UMBRAL_GESTO_PX, PROPORCION_GESTO, direccionDeGesto } from '../src/lib/entrenamientoUx.js';
import { contextoMotion, DURACIONES_MOTION, SPRINGS_MOTION, amortiguacionRelativa, muestrearSpring } from '../src/lib/motion.js';
import { MOTION_MAP, auditarMotion } from '../src/lib/motionMapa.js';
import { DEPENDENCIAS_PERMITIDAS } from '../src/lib/arquitecturaFitness.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

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
console.log('\n── 1. Los umbrales, una sola vez (apartado 10) ──');

ok(UMBRALES_GESTO === HOJA_DE_UMBRALES && Object.isFrozen(UMBRALES_GESTO),
  '🚨 los umbrales viven en `umbralesGesto.js`, congelados, y el motor reexporta ese mismo objeto');
const HOJA = leer('src/lib/umbralesGesto.js');
ok(!/^\s*import\b/m.test(HOJA), '…que es una hoja del árbol de imports: la puede leer un motor de Fitness sin traerse el de movimiento');
for (const k of ['arranque', 'proporcionEje', 'velocidadMinima', 'velocidadCierre', 'velocidadMaxima', 'distanciaCierre', 'distanciaCambio', 'resistencia', 'ventanaVelocidadMs', 'reposoPx', 'reposoVelocidad']) {
  ok(Number.isFinite(UMBRALES_GESTO[k]) && UMBRALES_GESTO[k] > 0, `\`${k}\` es un número positivo (${UMBRALES_GESTO[k]})`);
}
ok(UMBRALES_GESTO.velocidadMinima < UMBRALES_GESTO.velocidadCierre && UMBRALES_GESTO.velocidadCierre < UMBRALES_GESTO.velocidadMaxima,
  'la velocidad mínima, la de cierre y la máxima van en ese orden (apartado 10)');
ok(UMBRAL_GESTO_PX === UMBRALES_GESTO.distanciaCambio && PROPORCION_GESTO === UMBRALES_GESTO.proporcionEje,
  '🚨 la FIT F9 lee los mismos números: `UMBRAL_GESTO_PX` y `PROPORCION_GESTO` SON los del motor, no una segunda copia');
ok(direccionDeGesto(-140, 6) === 'siguiente' && direccionDeGesto(140, -4) === 'anterior' && direccionDeGesto(-60, 240) === null,
  '…y su `direccionDeGesto` sigue diciendo lo mismo que antes (la usan sus pruebas)');
const COMP = leer('src/components/gestosMotion.jsx');
const COMP_LIMPIO = sinComentarios(COMP);
ok(!/\b(56|0\.35|0\.5|1\.5|0\.11)\b/.test(COMP_LIMPIO.replace(/['"`][^'"`\n]*['"`]/g, '')),
  '🚨 ningún umbral escrito a mano en las piezas de React: todos salen del motor');
const VIVO = leer('src/views/EntrenamientoVivoView.jsx');
ok(!/inicioGesto|direccionDeGesto/.test(sinComentarios(VIVO)),
  '…y el entrenamiento en vivo ya no tiene su gesto propio: usa `useDeslizarParaCambiar`');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. El eje: primero se decide, y el scroll es del navegador (apartados 12 y 13) ──');

ok(ejeDeGesto(3, 2) === null && ejeDeGesto(0, 7) === null, 'menos del arranque es un toque que tiembla: todavía no hay eje');
ok(ejeDeGesto(-20, 4) === 'x' && ejeDeGesto(30, -19) === 'x', 'claramente horizontal → x');
ok(ejeDeGesto(4, 20) === 'y' && ejeDeGesto(-6, 120) === 'y', 'claramente vertical → y (el scroll)');
ok(ejeDeGesto(20, 18) === 'libre', 'una diagonal no es de nadie: se deja al scroll');
ok(ejeDeGesto('a', null) === null, '…y una entrada que no es un número no decide nada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. La velocidad (apartado 9) ──');

ok(JSON.stringify(velocidadDeMuestras([])) === JSON.stringify({ vx: 0, vy: 0 }) && velocidadDeMuestras([{ t: 0, x: 0, y: 0 }]).vx === 0,
  'sin dos muestras no hay velocidad');
const v1 = velocidadDeMuestras([{ t: 0, x: 0, y: 0 }, { t: 10, x: -10, y: 0 }, { t: 30, x: -30, y: 2 }]);
ok(Math.abs(v1.vx + 1) < 1e-9 && Math.abs(v1.vy - 2 / 30) < 1e-9, `30 px en 30 ms son 1 px/ms (${v1.vx})`);
const v2 = velocidadDeMuestras([{ t: 0, x: 0, y: 0 }, { t: 100, x: -60, y: 0 }, { t: 250, x: -60, y: 0 }, { t: 400, x: -60, y: 0 }]);
ok(v2.vx === 0, '🚨 solo cuentan los últimos 100 ms: un dedo que se paró antes de soltar no lanza nada');
ok(velocidadDeMuestras([{ t: 0, x: 0, y: 0 }, { t: 1, x: 900, y: 0 }]).vx === UMBRALES_GESTO.velocidadMaxima,
  'una muestra imposible (900 px en 1 ms) es un salto del puntero: se recorta al tope');
ok(velocidadDeMuestras([{ t: 5, x: 0, y: 0 }, { t: 5, x: 40, y: 0 }]).vx === 0, '…y dos muestras en el mismo instante no dividen entre cero');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. La resistencia: solo en el borde (apartados 15 y 16) ──');

ok(resistencia(0, 400) === 0, 'sin exceso, nada');
const r100 = resistencia(100, 400);
ok(r100 > 0 && r100 < 100, `100 px de exceso mueven ${r100.toFixed(1)} px: cada píxel cuesta más`);
ok(resistencia(1e6, 400) < 400, '🚨 y nunca llega al tamaño de lo que se arrastra: no sigue linealmente indefinidamente');
ok(resistencia(200, 400) - resistencia(100, 400) < resistencia(100, 400), '…cada tramo cuesta más que el anterior');
ok(conResistencia(60, { min: 0, tamano: 400 }) === 60, 'dentro de lo libre, el dedo manda: 60 px son 60 px');
ok(conResistencia(-80, { min: 0, tamano: 400 }) < 0 && conResistencia(-80, { min: 0, tamano: 400 }) > -80,
  'una hoja arrastrada hacia ARRIBA resiste (no se despega de su borde)');
ok(conResistencia(100, { min: -Infinity, max: 0, tamano: 360 }) < 60 && conResistencia(-100, { min: -Infinity, max: 0, tamano: 360 }) === -100,
  'el primer ejercicio resiste hacia el anterior y es libre hacia el siguiente');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Soltar: cerrar o volver (apartados 14 y 17) ──');

ok(decidirSoltar({ desplazamiento: 0, velocidad: 2, tamano: 400 }) === 'volver', 'sin moverse no se cierra nada, por rápido que vaya el puntero');
ok(decidirSoltar({ desplazamiento: 45, velocidad: 1.5, tamano: 400 }) === 'cerrar', '🚨 un lanzamiento hacia abajo cierra aunque haya recorrido poco');
ok(decidirSoltar({ desplazamiento: 60, velocidad: 0, tamano: 400 }) === 'volver', 'arrastrar despacio 60 px y soltar es «me lo he pensado»: vuelve');
ok(decidirSoltar({ desplazamiento: 160, velocidad: 0, tamano: 400 }) === 'cerrar', 'pasar del 35 % de su altura y soltar quieto la cierra');
ok(decidirSoltar({ desplazamiento: 160, velocidad: -0.6, tamano: 400 }) === 'volver', '🚨 …salvo que al soltar vuelva hacia arriba deprisa: cancelar se respeta');
ok(decidirSoltar({ desplazamiento: -40, velocidad: 0, tamano: 400 }) === 'volver', 'hacia arriba nunca cierra');

console.log('\n── 6. Cambiar de ejercicio: distancia Y velocidad (apartados 9-11) ──');

ok(decidirCambio({ dx: -30, vx: 0 }) === null, 'corto y lento: no cambia');
ok(decidirCambio({ dx: -30, vx: -1 }) === 'siguiente', '🚨 corto pero rápido: cambia al siguiente (antes hacían falta 56 px)');
ok(decidirCambio({ dx: 30, vx: 1 }) === 'anterior', '…y al anterior hacia el otro lado');
ok(decidirCambio({ dx: -80, vx: 0 }) === 'siguiente', 'largo y lento: cambia');
ok(decidirCambio({ dx: -80, vx: 0.4 }) === null, '🚨 largo, pero volviendo deprisa al soltar: no cambia (cancelar)');
ok(decidirCambio({ dx: -10, vx: -2 }) === null, 'un temblor rápido sin recorrido no es un lanzamiento');
ok(decidirCambio({ dx: -40, vx: 1 }) === null, 'una velocidad en contra del recorrido no lanza');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. El muelle y la inercia (apartados 4-6, 14, 17 y 19) ──');

ok(amortiguacionRelativa(SPRINGS_MOTION.responsive) >= 0.9, `el muelle de la vuelta es \`responsive\` (ζ = ${amortiguacionRelativa(SPRINGS_MOTION.responsive).toFixed(2)}): llega sin rebotar`);
for (const d of [10, 30, 60, 200, -45]) {
  const r = vueltaConMuelle({ desde: d, velocidad: 0, ctx: NORMAL });
  const pasa = r.valores.some((v) => Math.sign(v) === -Math.sign(d) && Math.abs(v) > UMBRALES_GESTO.reposoPx);
  ok(r.valores[0] === d && r.valores.at(-1) === 0 && !pasa && r.duracionMs >= 150 && r.duracionMs <= 650,
    `desde ${d} px vuelve exactamente a 0, sin pasarse, en ${r.duracionMs} ms (apartado 17: «volver exactamente al estado correcto»)`);
}
const conVel = vueltaConMuelle({ desde: 60, velocidad: 1.5, ctx: NORMAL });
ok(conVel.valores[1] > 60, '🚨 la vuelta arranca con la velocidad que llevaba el dedo: un cambio de dirección no reinicia nada (apartado 19)');
ok(vueltaConMuelle({ desde: 60, ctx: LENTA }).duracionMs > vueltaConMuelle({ desde: 60, ctx: NORMAL }).duracionMs, 'en Pausada, la vuelta tarda más (C-52: la velocidad cambia el tiempo)');
ok([REDUCIDO, SISTEMA, OFF].every((ctx) => vueltaConMuelle({ desde: 60, velocidad: 1, ctx }).duracionMs === 0),
  '🚨 en Reducido —el de Ajustes y el del iPhone— y sin movimiento, la vuelta es al momento: sin muelle (apartado 34)');
ok(vueltaConMuelle({ desde: 0, ctx: NORMAL }).duracionMs === 0, 'si no se movió, no hay nada que devolver');
const def = muestrearSpring('responsive', { desde: 30, hasta: 0 });
const vis = muestrearSpring('responsive', { desde: 30, hasta: 0, reposo: { distancia: UMBRALES_GESTO.reposoPx, velocidad: UMBRALES_GESTO.reposoVelocidad } });
ok(vis.duracionMs < def.duracionMs && def.duracionMs > 800,
  `🐛 el reposo en píxeles acorta lo que ya no se ve (${def.duracionMs} → ${vis.duracionMs} ms): con el genérico, un arrastre nuevo se peleaba con una vuelta invisible`);
const s1 = salidaConInercia({ desde: 45, hasta: 420, velocidad: 4, ctx: NORMAL });
const s2 = salidaConInercia({ desde: 45, hasta: 420, velocidad: 0.5, ctx: NORMAL });
ok(s1.duracionMs === DURACIONES_MOTION.fast && s2.duracionMs === DURACIONES_MOTION.normal,
  `la salida sigue la inercia —cuanto más rápido el lanzamiento, más corta— entre \`fast\` y \`normal\` (${s1.duracionMs}–${s2.duracionMs} ms)`);
ok(salidaConInercia({ desde: 45, hasta: 420, velocidad: 2, ctx: REDUCIDO }).duracionMs === 0, '…y en Reducido se va en su sitio');
ok(Object.values(MUELLE_POR_MASA).every((n) => SPRINGS_MOTION[n]) && muelleDe('hoja') === SPRINGS_MOTION.responsive && muelleDe('inventado') === SPRINGS_MOTION.normal,
  'cada masa tiene su muelle del motor, y ninguno es global (apartados 5 y 6)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Las piezas de React: seguir al dedo con transform, nunca con estado (apartados 7, 8, 13 y 35) ──');

ok(/export function AsaHoja/.test(COMP) && /export function useDeslizarParaCambiar/.test(COMP), 'existen `AsaHoja` y `useDeslizarParaCambiar`');
ok(!/useState/.test(COMP_LIMPIO), '🚨 ni un estado de React por fotograma: el dedo mueve el `transform` directamente (apartado 35)');
ok(/translateY\(/.test(COMP_LIMPIO) && /translateX\(/.test(COMP_LIMPIO) && !/style\.(top|left|bottom|height)\s*=/.test(COMP_LIMPIO),
  '…con `translate`, nunca con `top`, `left` ni la altura');
ok(/touchAction:\s*'none'/.test(COMP_LIMPIO) && /aria-hidden="true"/.test(COMP_LIMPIO) && /sm:hidden/.test(COMP_LIMPIO),
  'el asa es su propia zona de gesto (`touch-action: none`), fuera de VoiceOver —la hoja tiene su botón de cerrar— y solo en el móvil');
ok(/closest\('button, input, textarea, select, a'\)/.test(COMP_LIMPIO), 'un gesto que empieza sobre un botón o un campo no cuenta');
ok(/a\.id === 'deslizar-ejercicio'/.test(COMP_LIMPIO) && /a\.id === 'asa-hoja'/.test(COMP_LIMPIO) && /DOMMatrix/.test(COMP_LIMPIO),
  '🐛 un gesto nuevo para la vuelta en marcha y sigue DESDE DONDE ESTÁ (apartado 19)');
ok(/onPointerCancel/.test(COMP_LIMPIO) && (COMP_LIMPIO.match(/cancelado/g) || []).length >= 4,
  'un gesto cancelado por el sistema vuelve: nunca cierra ni cambia (apartado 17, «cancel state»)');
/* 🔓 MS F8 — el estado al acabar de cerrar es «cerrada» (la máquina de estados de la F8). */
ok(/caja\.isConnected && caja\.dataset\.arrastre === 'cerrada'/.test(COMP_LIMPIO),
  '🐛 si quien abrió la hoja no la cierra, la hoja vuelve a su sitio: nunca se queda fuera de la pantalla (apartado 37)');
ok(/if \(!g\.eje\) g\.eje = ejeDeGesto\(ev\.clientX - g\.x0/.test(COMP_LIMPIO) && /if \(!g\.eje\) \{\s*g\.eje = ejeDeGesto\(ev\.clientX - g\.x0/.test(COMP_LIMPIO),
  'un lanzamiento que llega sin ningún `pointermove` en medio se decide con el punto donde se suelta');
ok(/CURVAS_MOTION\.exit/.test(COMP_LIMPIO) && /contextoDelDocumento\(\)/.test(COMP_LIMPIO),
  'la salida usa la curva `exit` del motor, y el modo lo lee del documento (Reducido incluido)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Dónde se usan: todas las hojas que salen por abajo, y la tarjeta del ejercicio ──');

const HOJAS = {
  'src/components/explicacionRango.jsx': 'onCerrar',
  'src/components/sustitucion.jsx': 'onCerrar',
  'src/components/historialRango.jsx': 'onCerrar',
  'src/views/RangosView.jsx': 'onCerrar',
  'src/components/quickAdd.jsx': 'onCerrar',
  'src/components/ColorPicker.jsx': 'onClose',
  'src/components/TemaBuilder.jsx': 'onClose',
  'src/views/ArmarioView.jsx': 'onCerrar',
};
for (const [f, cerrar] of Object.entries(HOJAS)) {
  const c = sinComentarios(leer(f));
  ok(/import \{ AsaHoja \} from '(\.\.\/components|\.)\/gestosMotion'/.test(c) && new RegExp(`<AsaHoja cajaRef=\\{caja\\} onCerrar=\\{${cerrar}\\}`).test(c) && /ref=\{caja\}/.test(c) && /const caja = (useRef\(null\)|useDialogoAccesible\()/.test(c),
    `${f.split('/').pop()}: su hoja lleva el asa, sobre su caja, y cierra con la MISMA función que su botón`);
}
ok((sinComentarios(leer('src/views/ArmarioView.jsx')).match(/<AsaHoja /g) || []).length === 3, 'las tres hojas del Armario (prenda, outfit y día)');
ok(!/AsaHoja/.test(leer('src/views/EstiloHombreView.jsx')), '⚠️ Imagen personal está congelada (EH F65): sus hojas no se tocan, y está dicho en `NO_EN_F5`');
ok(/useDeslizarParaCambiar\(zonaGesto/.test(VIVO) && /ref=\{zonaGesto\}/.test(VIVO) && /\{\.\.\.gestoEjercicio\}/.test(VIVO) && /touchAction: 'pan-y'/.test(VIVO),
  '🚨 el entrenamiento en vivo: la zona del gesto es la tarjeta, con `pan-y`, y el hook la mueve');
const usoHook = VIVO.indexOf('useDeslizarParaCambiar(zonaGesto');
/* El `return` que importa es el del MISMO componente: el primero que haya después de que empiece. */
const inicioComp = Math.max(...[...VIVO.slice(0, usoHook).matchAll(/\n(export (default )?)?function [A-Z]\w*\(/g)].map((m) => m.index));
const primerReturn = VIVO.slice(inicioComp).search(/\n  (if \([^\n]*\) )?return\b/);
ok(usoHook > 0 && inicioComp > 0 && primerReturn > 0 && usoHook < inicioComp + primerReturn,
  `…llamado antes del primer \`return\` de su componente (regla 4)`);
ok(/ejercicio-entra-\$\{entradaDesde\}/.test(VIVO) && /setEntradaDesde\('izquierda'\)/.test(VIVO) && /setEntradaDesde\('derecha'\)/.test(VIVO),
  'el ejercicio nuevo entra por el lado del gesto, y los botones Anterior y Siguiente hacen lo mismo');
ok(DEPENDENCIAS_PERMITIDAS.some((d) => d.modulo === 'gestosMotion') && DEPENDENCIAS_PERMITIDAS.some((d) => d.modulo === 'umbralesGesto'),
  'Fitness declara las dos dependencias nuevas, con su motivo (FIT F44)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. El CSS y el mapa ──');

const CSS = leer('src/index.css');
for (const [clase, kf] of [['ejercicio-entra-derecha', 'ejercicioEntraDerecha'], ['ejercicio-entra-izquierda', 'ejercicioEntraIzquierda']]) {
  const re = new RegExp(`\\.${clase}\\s*\\{[^}]*animation:\\s*${kf}\\s+var\\(--motion-dur-normal\\)\\s+var\\(--ease-premium\\)\\s+backwards`);
  ok(re.test(CSS), `\`.${clase}\`: \`normal\`, la curva de JosStyle y \`backwards\` (no deja un transform puesto)`);
}
ok(/@keyframes ejercicioEntraDerecha \{\s*from \{[^}]*translateX\(var\(--motion-dist-medium\)\)/.test(CSS)
  && /@keyframes ejercicioEntraIzquierda \{\s*from \{[^}]*translateX\(calc\(-1 \* var\(--motion-dist-medium\)\)\)/.test(CSS),
  '…y su recorrido es el token de distancia, que en Reducido vale 0: queda solo el fundido');
const mapa = (id) => MOTION_MAP.find((e) => e.id === id);
ok(mapa('asa_hoja')?.fase === 5 && mapa('asa_hoja')?.spring === 'responsive' && mapa('cambiar_ejercicio')?.fase === 5 && mapa('cambiar_ejercicio')?.spring === 'responsive',
  'el MOTION_MAP tiene el asa y el gesto del ejercicio, con su muelle');
ok(mapa('ejercicio_entra_derecha')?.clase === 'ejercicio-entra-derecha' && mapa('ejercicio_entra_izquierda')?.keyframe === 'ejercicioEntraIzquierda', '…y las dos entradas del ejercicio');
const aud = auditarMotion({ css: CSS, vistas: {} });
ok(aud && aud.sinMapa.length === 0, `la auditoría de la F0 sigue limpia (${JSON.stringify(aud && aud.sinMapa)})`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. La auditoría y lo que no se hace (apartados 1, 18, 26-28 y 30) ──');

ok(AUDITORIA_F5.length >= 10 && AUDITORIA_F5.every((a) => a.gesto && a.hay && a.queda), `la auditoría de gestos reales tiene ${AUDITORIA_F5.length} líneas, cada una con lo que hay y lo que queda`);
for (const g of ['Toque', 'Deslizar en horizontal', 'Arrastrar para cerrar (hojas)', 'Scroll', 'Reordenar', 'Deslizar para volver']) {
  ok(AUDITORIA_F5.some((a) => a.gesto === g), `…incluido «${g}»`);
}
ok(NO_EN_F5.length >= 4 && NO_EN_F5.every((n) => n.que && n.porque), 'lo que no se construye está declarado con su motivo');
ok(NO_EN_F5.some((n) => /C-56/.test(n.porque)) && NO_EN_F5.some((n) => /EH F50/.test(n.porque)) && NO_EN_F5.some((n) => /C-32/.test(n.porque)),
  '…deslizar para volver (C-56), mantener pulsado (EH F50) y el foco de un campo (C-32)');
ok(NO_EN_F5.some((n) => /Imagen personal/.test(n.que) && /EH F65/.test(n.porque)), '…y las hojas de Imagen personal, congelada');
const TODO = JSON.stringify([AUDITORIA_F5, NO_EN_F5]);
ok(!/rebote|bounce|confeti/i.test(TODO.replace(/El rebote de la página|el rebote/gi, '')), 'ni un rebote nuevo: *"No quiero una app llena de rebotes"*');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. La documentación ──');

const SIS = leer('docs/MOTION_SYSTEM.md');
ok(/AsaHoja/.test(SIS) && /useDeslizarParaCambiar/.test(SIS) && /UMBRALES_GESTO/.test(SIS), 'MOTION_SYSTEM.md dice cuándo usar cada pieza de la F5');
ok(/\*\*F5\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F5');
ok(/C-56/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), 'C-56 está escrita');

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
