/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 6 — profundidad, capas, z-index y contexto visual

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f6.mjs

   Lo que se comprueba aquí es el SISTEMA —la jerarquía de capas, los niveles de
   profundidad, las sombras, los desenfoques y el velo, qué tipo de capa es cada
   ventana y cómo entra y sale— y que la aplicación no se lo salte: ni un z-index,
   un velo, un desenfoque ni una sombra de elevación escritos a mano. Lo que
   necesita un navegador —que una ventana entre ANTES de pintarse, que al cerrarla
   quede una copia inerte haciendo el camino de vuelta— está en la sección «MS F6»
   de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  CAPAS_Z, valorZ, NIVELES_PROFUNDIDAD, SOMBRAS, DESENFOQUES, desenfoque, sombra, VELO,
  alfaDe, tipoDeCapa, sinAlfa, animacionDeCapa, MAX_NODOS_COPIA, salidaPosible, ENTRADAS_CSS_DE_CAPA,
  REGLAS_PROFUNDIDAD, DECLARAN_LO_QUE_BUSCAN, auditarProfundidad, auditarTokensProfundidad,
  INVENTARIO_CAPAS, NO_EN_F6,
} from '../src/lib/profundidad.js';
import { contextoMotion, DURACIONES_MOTION, DESENFOQUES_MOTION, fotogramas } from '../src/lib/motion.js';
import { CAPAS } from '../src/tokens.js';
import { MOTION_MAP, HALLAZGOS_F0, auditarMotion } from '../src/lib/motionMapa.js';
import { Z_CABECERA, Z_ACCESOS_FIJOS } from '../src/lib/scrollCabecera.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}

const VISTAS = {};
for (const d of ['src', 'src/views', 'src/components', 'src/lib']) {
  for (const f of readdirSync(join(RAIZ, d))) if (/\.jsx?$/.test(f)) VISTAS[`${d}/${f}`] = leer(`${d}/${f}`);
}
const CSS = leer('src/index.css');
const NORMAL = contextoMotion();
const REDUCIDO = contextoMotion({ reducirMovimiento: true });
const SISTEMA = contextoMotion({ sistemaReduce: true });
const OFF = contextoMotion({ animaciones: 'desactivadas' });

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. La jerarquía de capas, con nombre (apartado 2) ──');

ok(Object.isFrozen(CAPAS_Z) && CAPAS_Z.every((c, i) => i === 0 || c.valor > CAPAS_Z[i - 1].valor), `${CAPAS_Z.length} capas, en orden creciente y congeladas`);
ok(CAPAS_Z.every((c) => c.id && c.que), '…cada una dice qué vive en ella');
ok(valorZ('pegajoso') < valorZ('flotante') && valorZ('flotante') < valorZ('aviso') && valorZ('aviso') < valorZ('capa') && valorZ('capa') < valorZ('alerta'),
  'la cabecera fija bajo la lupa, la lupa bajo un aviso, un aviso bajo cualquier capa, y la alerta encima de todo');
let lanza = false; try { valorZ('inventada'); } catch { lanza = true; }
ok(lanza, 'una capa que no existe no devuelve un número cualquiera: lanza');
ok(Z_CABECERA === valorZ('pegajoso') && Z_ACCESOS_FIJOS === valorZ('flotante'), '🔓 los dos números de la SC F1 salen ahora de la jerarquía (`scrollCabecera.js`)');
const TW = leer('tailwind.config.js');
ok(CAPAS_Z.every((c) => new RegExp(`${c.id}: 'var\\(--z-${c.id}\\)'`).test(TW)), 'Tailwind tiene una clase por capa (`z-capa`, `z-flotante`…), desde su variable');
ok(auditarTokensProfundidad(CSS).length === 0, `los tokens de aquí y los de index.css dicen lo mismo, valor a valor (${JSON.stringify(auditarTokensProfundidad(CSS))})`);
ok(auditarTokensProfundidad(CSS.replace('--z-capa: 50;', '--z-capa: 51;')).some((d) => d.token === '--z-capa'), '…y la comparación se pone roja si uno cambia sin el otro');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Ni un z-index, velo, desenfoque ni sombra de elevación a mano (apartados 2, 5-7 y 40) ──');

const hallazgos = auditarProfundidad({ vistas: VISTAS, css: CSS });
ok(hallazgos.length === 0, `🚨 la auditoría de profundidad está limpia en toda la aplicación (${JSON.stringify(hallazgos.slice(0, 5))})`);
for (const r of REGLAS_PROFUNDIDAD) {
  const caza = auditarProfundidad({ vistas: { 'src/views/Falsa.jsx': r.ejemploMalo } });
  ok(caza.some((h) => h.regla === r.id), `la regla \`${r.id}\` caza su propio ejemplo malo («${r.ejemploMalo}»)`);
}
ok(auditarProfundidad({ vistas: { 'src/views/Falsa.jsx': '// className="fixed inset-0 z-50"\n/* zIndex: 4 */' } }).length === 0, '…y un comentario que nombra lo prohibido no lo incumple');
ok(auditarProfundidad({ css: '.x { z-index: 9; }' }).length === 1 && auditarProfundidad({ css: '.x { z-index: var(--z-capa); }' }).length === 0,
  'en el CSS, un z-index con número salta y uno con su variable no');
ok(Object.keys(DECLARAN_LO_QUE_BUSCAN).length === 2 && Object.values(DECLARAN_LO_QUE_BUSCAN).every((p) => /ejemplo/.test(p)),
  '⚠️ los dos archivos que NOMBRAN lo que se busca (sus `ejemploMalo`) se declaran con su motivo, no se esconden');
const APP = leer('src/App.jsx');
ok((APP.match(/zIndex: 'var\(--z-fondo\)'/g) || []).length === 3, 'las tres capas del fondo de pantalla (App.jsx) usan `--z-fondo`');
ok(/\.hub-sticky\s*\{[^}]*z-index:\s*var\(--z-pegajoso\)/.test(CSS) && /\.hub-card-expanding\s*\{[^}]*z-index:\s*var\(--z-elevado\)/.test(CSS),
  'la cabecera fija y la tarjeta que se levanta, con su capa');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Los niveles de profundidad, las sombras, los desenfoques y el velo (apartados 3-7 y 35) ──');

ok(NIVELES_PROFUNDIDAD.map((n) => n.nivel).join() === '0,1,2,3,4,5', 'seis niveles, del contenido al sistema (apartado 3)');
ok(NIVELES_PROFUNDIDAD.every((n) => CAPAS_Z.some((c) => c.id === n.capa) && n.separa && n.ejemplos), '…cada uno con su capa, con qué se separa de lo de debajo y ejemplos reales');
ok(NIVELES_PROFUNDIDAD.every((n) => n.sombra === null || SOMBRAS[n.sombra]) && NIVELES_PROFUNDIDAD.every((n) => n.desenfoque === null || DESENFOQUES[n.desenfoque]),
  '…y las sombras y desenfoques que nombra existen');
ok(NIVELES_PROFUNDIDAD.filter((n) => n.nivel >= 3).every((n) => n.velo) && NIVELES_PROFUNDIDAD.filter((n) => n.nivel < 3).every((n) => !n.velo),
  'el velo empieza en el nivel 3: lo de debajo sigue ahí, pero ya no es la prioridad (apartado 7)');
ok(Object.entries(SOMBRAS).every(([id, v]) => new RegExp(`--sombra-${id}: ${v.replace(/[()]/g, '\\$&')};`).test(CSS)), `${Object.keys(SOMBRAS).length} sombras de elevación con nombre, en index.css`);
ok(sombra('flotante') === 'var(--sombra-flotante)', '`sombra(id)` devuelve su variable');
ok(Object.entries(DESENFOQUES).every(([id, d]) => d.px === DESENFOQUES_MOTION[id] && d.cuando),
  '🚨 los desenfoques son los de la F1 (`DESENFOQUES_MOTION`): la F6 dice CUÁNDO, no inventa otra escala');
ok(desenfoque('medium') === 'blur(var(--motion-blur-medium))' && desenfoque('none') === 'none', '`desenfoque(id)` sale de su variable');
let lanza2 = false; try { desenfoque('enorme'); } catch { lanza2 = true; }
ok(lanza2, '…y un nivel que no existe lanza');
const desenfoquesUsados = Object.values(VISTAS).join('\n').match(/desenfoque\('(\w+)'\)/g) || [];
ok(desenfoquesUsados.length >= 12 && desenfoquesUsados.every((d) => /'(medium|strong)'/.test(d)),
  `los ${desenfoquesUsados.length} desenfoques de la aplicación son \`medium\` o \`strong\`: el cristal pequeño y lo que tapa una franja ancha`);
ok(VELO === CAPAS.veloHoja, '🚨 el velo es UNO, el de `tokens.js` (regla 2)');
ok((Object.values(VISTAS).join('\n').match(/background: CAPAS\.veloHoja/g) || []).length >= 17, '…y lo usan las diecisiete ventanas que escribían el suyo (0,5, 0,55 y 0,6)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Qué capa es cada ventana (apartados 8-11 y 36) ──');

ok(alfaDe('rgba(0, 0, 0, 0.55)') === 0.55 && alfaDe('rgb(10, 10, 10)') === 1 && alfaDe('transparent') === 0 && alfaDe('') === 0, '`alfaDe` lee la transparencia de un color calculado');
ok(sinAlfa('rgba(0, 0, 0, 0.55)') === 'rgba(0, 0, 0, 0)', '`sinAlfa`: el mismo velo, transparente');
ok(tipoDeCapa({ alignItems: 'flex-end', fondo: 'rgba(0, 0, 0, 0.55)' }) === 'hoja', 'pegada abajo → hoja');
ok(tipoDeCapa({ alignItems: 'center', fondo: 'rgba(0, 0, 0, 0.55)' }) === 'modal' && tipoDeCapa({ alignItems: 'flex-start', fondo: 'rgba(0, 0, 0, 0.55)' }) === 'modal', 'centrada o arriba → ventana');
ok(tipoDeCapa({ overflowY: 'auto', fondo: 'rgb(12, 12, 14)' }) === 'pantalla', 'opaca y con su propio scroll → pantalla por encima');
ok(tipoDeCapa({ alignItems: 'normal', fondo: 'rgba(0, 0, 0, 0.92)' }) === 'visor' && tipoDeCapa({ fondo: 'rgb(0, 0, 0)' }) === 'visor', 'casi negra → visor');

console.log('\n── 5. Cómo entra y sale cada una (apartados 8-11, 24 y 34) ──');

const hojaE = animacionDeCapa('hoja', 'entrar', { ctx: NORMAL, alto: 400, fondo: CAPAS.veloHoja });
ok(hojaE.caja.keyframes[0].transform === 'translateY(400px)' && hojaE.caja.keyframes[0].opacity === undefined && hojaE.caja.keyframes[1].transform === 'none',
  '🚨 una hoja sube desde su borde —todo su alto—, sin fundido ni escala (apartado 11)');
ok(hojaE.duracionMs === DURACIONES_MOTION.medium && hojaE.caja.opciones.fill === 'backwards', '…en `medium`, sin dejar nada puesto al acabar');
ok(hojaE.velo && hojaE.velo.keyframes[0].backgroundColor === 'rgba(0, 0, 0, 0)' && hojaE.velo.opciones.duration === hojaE.caja.opciones.duration,
  '🚨 el velo y la caja son DOS animaciones con la misma duración: fondo → velo → hoja (apartado 8)');
const hojaS = animacionDeCapa('hoja', 'salir', { ctx: NORMAL, alto: 400, fondo: CAPAS.veloHoja });
ok(hojaS.caja.keyframes.at(-1).transform === 'translateY(400px)' && hojaS.duracionMs === DURACIONES_MOTION.fast && hojaS.caja.opciones.fill === 'forwards',
  '…y baja hacia ese mismo borde, más deprisa (`fast`) y quedándose fuera hasta que se quita');
const modalE = animacionDeCapa('modal', 'entrar', { ctx: NORMAL, fondo: CAPAS.veloHoja });
ok(JSON.stringify(modalE.caja.keyframes) === JSON.stringify(fotogramas('modalEnter', NORMAL).keyframes), '🚨 una ventana entra con el preset del motor (`modalEnter`): ni una cifra propia');
ok(/scale\(0\.9[5-9]/.test(modalE.caja.keyframes[0].transform), '…con una escala que no es excesiva (apartado 9)');
ok(JSON.stringify(animacionDeCapa('modal', 'salir', { ctx: NORMAL, fondo: CAPAS.veloHoja }).caja.keyframes) === JSON.stringify(fotogramas('modalExit', NORMAL).keyframes),
  '…y sale con `modalExit`: conserva la dirección, no solo se apaga (apartado 10)');
const pant = animacionDeCapa('pantalla', 'salir', { ctx: NORMAL, fondo: 'rgb(12, 12, 14)' });
ok(pant.velo === null && /translateX\(\d+px\)/.test(pant.raiz.keyframes.at(-1).transform) && Number(pant.raiz.keyframes.at(-1).opacity) === 0,
  'una pantalla por encima no tiene velo, y se va hacia la derecha, por donde llegó');
ok(animacionDeCapa('visor', 'entrar', { ctx: NORMAL, fondo: 'rgb(0, 0, 0)' }).raiz.keyframes.every((k) => !k.transform), 'un visor solo se funde');
for (const [nombre, ctx] of [['Reducido', REDUCIDO], ['el del iPhone', SISTEMA]]) {
  const r = animacionDeCapa('hoja', 'entrar', { ctx, alto: 400, fondo: CAPAS.veloHoja });
  ok(r && r.caja.keyframes.every((k) => !k.transform) && Number(r.caja.keyframes[0].opacity) === 0 && r.velo,
    `🚨 en ${nombre} la profundidad se queda —el velo y el fundido— y el recorrido se va (apartado 34)`);
}
ok(animacionDeCapa('hoja', 'entrar', { ctx: OFF, alto: 400, fondo: CAPAS.veloHoja }) === null, 'sin movimiento, ninguna');

console.log('\n── 6. La salida: una copia inerte, salvo cuando no conviene (apartados 37 y 38) ──');

ok(salidaPosible({ nodos: 40 }) === 'completa', 'lo normal: la copia hace el camino de vuelta');
ok(salidaPosible({ nodos: 40, conVideo: true }) === 'ninguna', 'con vídeo o lienzo (el escáner) no se copia: la copia saldría en negro');
ok(salidaPosible({ nodos: MAX_NODOS_COPIA + 1 }) === 'ninguna', `con más de ${MAX_NODOS_COPIA} nodos tampoco: copiarlo cuesta más de lo que aporta (apartado 38)`);
ok(salidaPosible({ nodos: 40, arrastrada: true }) === 'solo_velo', 'una hoja que ya se fue arrastrándola (F5): solo se apaga su velo');
ok(ENTRADAS_CSS_DE_CAPA.every((c) => new RegExp(`\\.${c}\\b`).test(CSS)), 'las capas que traen su entrada en CSS (Fitness, Calendario) la conservan, y esas clases existen');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. El vigilante de capas, en el DOM ──');

const VIG = leer('src/components/capasMotion.js');
const VIG_L = sinComentarios(VIG);
ok(/vigia\.observe\(document\.body, \{ childList: true \}\)/.test(VIG_L), 'mira SOLO los hijos directos del `body`: cada capa es un portal (regla 3), y nada de dentro le cuesta nada');
ok(/cs\.position === 'fixed' && cs\.top === '0px' && cs\.left === '0px' && cs\.right === '0px' && cs\.bottom === '0px'/.test(VIG_L) && /n\.id === 'root'/.test(VIG_L),
  '…y solo las que cubren la pantalla: ni la raíz de la aplicación ni un aviso pequeño');
{
  /* MS F11 — entre el tipo y el `return` va también la prioridad (lo mismo: al salir no hay estilo). */
  const iTipo = VIG_L.indexOf('n.dataset.capa = tipo;');
  const iRet = VIG_L.indexOf('if (traeSuEntrada(n)) return;');
  ok(iTipo > 0 && iRet > iTipo && !/return\b/.test(VIG_L.slice(iTipo, iRet)) && /n\.dataset\.capaPrioridad = prioridad;/.test(VIG_L.slice(iTipo, iRet)),
    '🐛 el tipo (y su prioridad) se apuntan SIEMPRE al entrar: fuera del documento ya no se pueden calcular, y es lo que dice cómo sale');
}
for (const [re, que] of [
  [/copia\.removeAttribute\('role'\)/, 'sin `role` (el recorrido y VoiceOver no la confunden con la ventana)'],
  [/copia\.setAttribute\('aria-hidden', 'true'\)/, 'fuera de VoiceOver'],
  [/copia\.inert = true/, 'inerte'],
  [/copia\.style\.pointerEvents = 'none'/, 'sin recibir toques'],
  [/removeAttribute\('id'\)/, 'sin ids repetidos'],
  [/padre\.insertBefore\(copia, siguiente\)/, 'en su MISMO sitio: una capa que se abre a la vez queda encima (apartado 21)'],
  [/e\.value = origen\[i\]\.value/, 'con lo que había escrito en sus campos'],
  [/SCROLL\.get\(e\)/, 'con su scroll de dentro'],
  [/setTimeout\(quitar, anim\.duracionMs \+ 400\)/, 'y que se quita aunque una animación no llegue a acabar'],
]) ok(re.test(VIG_L), `la copia que sale va ${que}`);
ok(/\[data-capa-saliendo\],\s*\[data-capa-saliendo\] \* \{\s*animation: none !important;\s*transition: none !important;/.test(CSS), '…y no repite ninguna entrada ni transición de dentro (index.css)');
ok(!/useState/.test(VIG_L) && !/saveData|app_data/.test(VIG_L), 'no guarda nada ni repinta React: toca el DOM que ya está');
const usoVigia = APP.indexOf('useCapasMotion();');
const inicioApp = APP.indexOf('export default function App(');
const primerReturn = APP.slice(inicioApp).search(/\n  (if \([^\n]*\) )?return\b/);
ok(usoVigia > inicioApp && usoVigia < inicioApp + primerReturn, '🚨 se monta UNA vez, en App.jsx, antes del primer `return` (regla 4)');
ok((Object.values(VISTAS).join('\n').match(/(?<!function )useCapasMotion\(\)/g) || []).length === 1, '…y solo ahí');
const ASA = sinComentarios(leer('src/components/gestosMotion.jsx'));
ok(/tomarControl\(caja, \['transform'\], 'gestos'\)/.test(ASA), 'si el dedo agarra una hoja mientras sube, manda el dedo (F5 + F6; desde la F11, `tomarControl` para cualquier animación de la caja)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. La hoja, el menú y el CSS ──');

ok(/@keyframes hojaSubeDelBorde \{\s*from \{ opacity: var\(--hoja-opacidad-inicial\); transform: translateY\(var\(--hoja-recorrido\)\); \}/.test(CSS)
  && /\[data-capa='hoja'\] > \.hoja-entra \{\s*animation: hojaSubeDelBorde var\(--motion-dur-normal\) var\(--motion-curva-entrance\) backwards;/.test(CSS),
  '🚨 una hoja de Fitness sube desde su borde cuando ES una hoja (el iPhone), con su duración y la curva de lo que aparece (`entrance`, MS F14)');
ok((CSS.match(/--hoja-recorrido: 0%;/g) || []).length === 2 && (CSS.match(/--hoja-opacidad-inicial: 0;/g) || []).length === 2,
  '…y en Reducido —el de Ajustes y el del iPhone— no se desplaza: se funde');
ok(/\.calendar-sheet \{[\s\S]{0,300}animation: calendarSheetIn var\(--motion-dur-normal\) var\(--motion-curva-entrance\) backwards;/.test(CSS),
  '🐛 las ventanas del Calendario terminan con `backwards`: el `both` dejaba un `transform` puesto');
ok(/\.menu-entra \{\s*animation: menuEntra var\(--motion-dur-fast\) var\(--motion-curva-entrance\) backwards;/.test(CSS), 'un menú que nace de su botón: corto y discreto (apartados 12 y 14)');
const UI = leer('src/components/ui.jsx');
/* 🔓 MS F15 — el panel lleva además `flotante-cabe` (cabe en lo que se ve): la esquina es la misma. */
ok(/menu-entra[^"]*"[\s\S]{0,300}transformOrigin: lado === 'derecha' \? 'top right' : 'top left'/.test(UI), '…el panel de sugerencias crece desde la esquina de su botón');
ok(/if \(ev\.key === 'Escape'\) onClose\(\);/.test(UI.slice(UI.indexOf('resolverConsulta(indice, query)') - 2000)), '🐛 el buscador por fin se cierra con Escape, como el resto de capas (apartado 33)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. El mapa, el inventario y lo que no se hace ──');

const mapa = (id) => MOTION_MAP.find((e) => e.id === id);
ok(mapa('modales_resto')?.estado === 'existe' && mapa('modales_resto')?.fase === 6 && mapa('modales_resto')?.componente === 'useCapasMotion', 'las cuarenta ventanas ya no están «sin movimiento»');
ok(HALLAZGOS_F0.find((h) => h.id === 'modales_de_golpe')?.resuelto === 6, '🔓 el hallazgo `modales_de_golpe` de la F0 lo cierra la F6');
ok(mapa('hoja_borde')?.keyframe === 'hojaSubeDelBorde' && mapa('menu_flotante')?.clase === 'menu-entra' && mapa('hoja_calendario')?.estado === 'existe', 'el mapa tiene la hoja que sube de su borde, el menú y el Calendario arreglado');
const aud = auditarMotion({ css: CSS, vistas: {} });
ok(aud.sinMapa.length === 0 && aud.keyframesHuerfanos.length === 0 && aud.mapaSinCss.length === 0, `la auditoría de la F0 sigue limpia (${JSON.stringify({ sinMapa: aud.sinMapa, huerfanos: aud.keyframesHuerfanos, sinCss: aud.mapaSinCss })})`);
ok(INVENTARIO_CAPAS.length >= 12 && INVENTARIO_CAPAS.every((i) => i.que && CAPAS_Z.some((c) => c.id === i.capa) && i.donde), `el inventario de capas (apartado 1): ${INVENTARIO_CAPAS.length} piezas, cada una en su capa y con dónde vive`);
ok(NO_EN_F6.length >= 5 && NO_EN_F6.every((n) => n.que && n.porque), 'lo que no se construye aquí, con su motivo');
ok(NO_EN_F6.some((n) => /F7/.test(n.porque) && /card/i.test(n.que)), '…card → detalle es la F7 (continuidad espacial)');

console.log('\n── 10. La documentación ──');
const SIS = leer('docs/MOTION_SYSTEM.md');
ok(/CAPAS_Z/.test(SIS) && /useCapasMotion/.test(SIS) && /z-capa/.test(SIS) && /sombra\(/.test(SIS), 'MOTION_SYSTEM.md dice la jerarquía, las reglas de capas, sombras y desenfoques');
ok(/\*\*F6\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F6');
ok(/C-57/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), 'C-57 está escrita');

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
