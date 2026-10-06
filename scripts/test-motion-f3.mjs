/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 3 — microinteracciones, componentes y feedback

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f3.mjs

   Lo que se comprueba aquí es lo que se puede leer sin un navegador: que las
   reglas de `index.css` estén y digan lo que tienen que decir (la pulsación, el
   interruptor, el chevron, el latido, el foco), que los componentes las usen, que
   lo retirado no vuelva (`auditarComponentesMotion`) y la lógica de los dos
   ayudantes (`giroDeChevron`, `siguienteLatido`). Lo que necesita un navegador
   —que una tarjeta encoja de verdad, que la bola viaje, que la estrella lata—
   está en la sección «MS F3» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  POSICIONES_CHEVRON, giroDeChevron, siguienteLatido, AUDITORIA_F3, NO_EN_F3, PATRONES_F3,
  auditarComponentesMotion, JERARQUIA_F3, CUANDO_F3,
} from '../src/lib/microinteraccionesMotion.js';
import { PRESETS_MOTION, PULSOS_MOTION, DURACIONES_MOTION, CURVAS_MOTION } from '../src/lib/motion.js';
import { MOTION_MAP, HALLAZGOS_F0, DEUDA_F0, auditarMotion } from '../src/lib/motionMapa.js';
import { ESCALAS_AL_TOCAR } from '../src/lib/microinteracciones.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const CSS = leer('src/index.css');
const UI = leer('src/components/ui.jsx');
const COMP = leer('src/components/motion.jsx');
const sinComentariosCss = (s) => String(s).replace(/\/\*[\s\S]*?\*\//g, '');
const CSS_LIMPIO = sinComentariosCss(CSS);
/** El cuerpo de la PRIMERA regla cuyo selector es exactamente `sel`. */
const regla = (sel) => {
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = CSS_LIMPIO.match(new RegExp(`(?:^|\\})\\s*${esc}\\s*\\{([^}]*)\\}`));
  return m ? m[1] : null;
};

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}

const VISTAS = {};
for (const d of ['src/views', 'src/components']) {
  for (const f of readdirSync(join(RAIZ, d))) if (/\.jsx?$/.test(f)) VISTAS[`${d}/${f}`] = leer(`${d}/${f}`);
}
VISTAS['src/App.jsx'] = leer('src/App.jsx');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. La pulsación: entra deprisa y vuelve con calma (apartados 2-5) ──');

const sinTransicion = regla("[class*='active:scale']:not([class*='transition'])");
ok(!!sinTransicion && /transition-property:\s*transform,\s*opacity/.test(sinTransicion),
  '🐛 un botón que encoge y no tenía transición la tiene ahora (transform y opacidad)');
const conColores = regla("[class*='active:scale'][class*='transition-colors']");
ok(!!conColores && /transform/.test(conColores) && /background-color/.test(conColores),
  '🐛 …y uno que solo animaba el color (`transition-colors`) anima también la escala, sin perder el color');
const suelto = regla("[class*='active:scale']");
ok(!!suelto && /transition-duration:\s*var\(--motion-dur-normal\)/.test(suelto) && /transition-timing-function:\s*var\(--motion-curva-entrance\)/.test(suelto),
  '🚨 al soltar vuelve en `normal` con la curva `entrance`, que llega y se posa sin rebotar (apartado 5)');
const pulsado = regla("[class*='active:scale']:active");
ok(!!pulsado && /transition-duration:\s*var\(--motion-dur-ultrafast\)/.test(pulsado) && /var\(--ease-premium\)/.test(pulsado),
  '🚨 al pulsar responde en `ultrafast`: el dedo no espera (apartado 2)');
ok(DURACIONES_MOTION.ultraFast < DURACIONES_MOTION.normal, `…y pulsar (${DURACIONES_MOTION.ultraFast} ms) es más rápido que soltar (${DURACIONES_MOTION.normal} ms)`);
ok(CSS_LIMPIO.indexOf("[class*='active:scale']") < CSS_LIMPIO.indexOf('.hub-card {\n  transition'),
  '⚠️ las reglas de la pulsación van ANTES de `.hub-card`: sus tarjetas conservan su propia vuelta (Fase N3)');
const reducido = regla("html[data-motion='reducido'] [class*='active:scale']:active:not(:disabled)");
ok(!!reducido && /--tw-scale-x:\s*1/.test(reducido) && /--tw-scale-y:\s*1/.test(reducido) && /opacity:\s*0\.72/.test(reducido),
  '🚨 en Reducido no encoge: baja la opacidad (C-52; la escala de Tailwind no es un token)');
ok(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*html:not\(\[data-motion='off'\]\) \[class\*='active:scale'\]:active:not\(:disabled\)\s*\{[^}]*--tw-scale-x:\s*1/.test(CSS_LIMPIO),
  '…y con el «Reducir movimiento» del iPhone, igual');
/* Los 57 que saltaban: se cuentan para que la cifra del CHANGELOG sea un dato. */
const conEscala = Object.values(VISTAS).flatMap((src) => src.match(/className=("[^"]*active:scale[^"]*"|\{`[^`]*active:scale[^`]*`\})/g) || []);
const saltaban = conEscala.filter((c) => !/transition/.test(c));
ok(conEscala.length >= 130 && saltaban.length >= 50,
  `la escalera se usa en ${conEscala.length} sitios, y ${saltaban.length} no tenían transición propia (las cubre la regla global)`);
ok(ESCALAS_AL_TOCAR.length === 4 && ESCALAS_AL_TOCAR.every((e) => /^active:scale-/.test(e.clase)),
  '⚠️ la escalera sigue siendo la de la EH F50 (`ESCALAS_AL_TOCAR`): la F3 cambia cómo se pulsa, no cuánto');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Las tarjetas que entran en cascada encogen al pulsarlas ──');

const hubCard = regla('.hub-card');
ok(!!hubCard && /animation:\s*hubCardIn[^;]*\bbackwards\b/.test(hubCard) && !/hubCardIn[^;]*\bboth\b/.test(hubCard),
  '🐛 la entrada de `hub-card` termina con `backwards`: con `both` su último fotograma ganaba a `:active` y a `.hub-card-receding`');
ok(/button\.hub-card:not\(\[class\*='active:scale'\]\):active:not\(:disabled\)\s*\{[^}]*scale\(var\(--motion-escala-subtle\)\)/.test(CSS_LIMPIO)
  && !/(^|\})\s*\.hub-card:active/.test(CSS_LIMPIO),
  '🐛 …pero así solo encoge un BOTÓN de portada: una tarjeta-contenedor (`div.hub-card`) no encoge entera al tocar algo de dentro, y una fila conserva su 0,99');
ok(/\.hub-card-receding\s*\{[^}]*opacity:\s*var\(--motion-opac-subtle\)/.test(CSS_LIMPIO),
  '…así que las demás tarjetas retroceden de verdad al tocar una (Fase N3)');
ok(/hub-card-receding/.test(MOTION_MAP.find((e) => e.id === 'pulsar_tarjeta_area')?.relacion || ''),
  '…y el mapa lo cuenta en la entrada de la tarjeta de la portada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Lo destructivo no encoge (apartado 28) ──');

const destructivo = regla('.toque-destructivo:active:not(:disabled)');
ok(!!destructivo && /opacity:\s*0\.72/.test(destructivo) && !/transform|scale/.test(destructivo), '`toque-destructivo` baja la opacidad y no escala');
const bloqueBorrar = UI.slice(UI.indexOf('export function BotonBorrar('), UI.indexOf('export function ListRow('));
ok(/toque-destructivo/.test(bloqueBorrar) && !/active:scale/.test(bloqueBorrar),
  '🚨 `BotonBorrar` y `BotonBorrarDefinitivo` llevan `toque-destructivo`, no la escala de un icono');
ok(auditarComponentesMotion({ vistas: VISTAS }).cuentas.papelera_que_encoge === 0, '…y ninguna papelera de la aplicación encoge');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Un solo interruptor (hallazgo `tres_interruptores`, apartado 20) ──');

const bola = regla('.interruptor-bola');
ok(!!bola && /transition:\s*transform var\(--motion-dur-normal\) var\(--motion-curva-entrance\)/.test(bola) && !/\bleft\s+var/.test(bola),
  '🚨 la bola viaja con `transform` (y la curva que se posa), no con `left` (apartado 38)');
ok(/\.interruptor\[data-encendido='true'\] \.interruptor-bola\s*\{[^}]*translateX\(var\(--recorrido\)\)/.test(CSS_LIMPIO), 'encendida, recorre su pista (`--recorrido`)');
ok(/\[role='switch'\]:active \.interruptor-bola\s*\{[^}]*scaleX\(var\(--motion-pulso-micro\)\)/.test(CSS_LIMPIO),
  'al pulsar, la bola se estira (`pulso-micro`, que en Reducido vale 1)');
ok(/html\[data-motion='reducido'\] \.interruptor-bola\s*\{[^}]*transition-property:\s*background-color/.test(CSS_LIMPIO)
  && /html:not\(\[data-motion='off'\]\) \.interruptor-bola\s*\{[^}]*transition-property:\s*background-color/.test(CSS_LIMPIO),
  '🚨 en Reducido —el de Ajustes y el del iPhone— la bola salta a su sitio: viajar es desplazarse (C-52)');
ok(/\.interruptor\s*\{[^}]*--recorrido:\s*19px/.test(CSS_LIMPIO) && /\.interruptor-pequeno\s*\{[^}]*--recorrido:\s*16px/.test(CSS_LIMPIO),
  'dos tamaños —el suelto y el de una fila— y un solo comportamiento');
const sw = UI.slice(UI.indexOf('export function Switch('), UI.indexOf('export function PistaInterruptor('));
ok(/role="switch"/.test(sw) && /aria-checked=\{!!checked\}/.test(sw) && /data-encendido=/.test(sw) && /className="interruptor /.test(sw) && /interruptor-bola/.test(sw) && !/left:/.test(sw),
  '`Switch` usa las clases, dice su estado (`aria-checked`) y no mueve nada con `left`');
const pista = UI.slice(UI.indexOf('export function PistaInterruptor('), UI.indexOf('export function ToggleTab('));
ok(/aria-hidden="true"/.test(pista) && /interruptor interruptor-pequeno/.test(pista), '`PistaInterruptor` es solo el dibujo (aria-hidden): el control es la fila');
const AJ = VISTAS['src/views/SettingsView.jsx'];
ok((AJ.match(/<Switch\b/g) || []).length >= 7, `Ajustes: los interruptores dibujados a mano son \`Switch\` (${(AJ.match(/<Switch\b/g) || []).length} en total)`);
ok(/label=\{`Proteger \$\{a\.label\} con PIN`\}/.test(AJ) && /title=\{esRelacion \?/.test(AJ),
  '🐛 …y la protección de un área se llama igual encendida o apagada: el estado lo dice `aria-checked`, y Relación explica por qué no se toca');
ok(/<Switch[\s\S]{0,200}label="Modo avanzado de color"/.test(VISTAS['src/components/GestionTemas.jsx']), 'Gestión de temas: el suyo también es `Switch`');
const filas = [
  ['src/views/CalendarView.jsx', 2], ['src/views/RelationView.jsx', 1], ['src/views/SettingsView.jsx', 1],
];
filas.forEach(([f, n]) => {
  const src = VISTAS[f];
  const usos = (src.match(/<PistaInterruptor\b/g) || []).length;
  const rol = (src.match(/role="switch"\s*\n\s*aria-checked=\{/g) || []).length;
  ok(usos === n && rol >= n, `${f.replace(/^src\/(views|components)\//, '')}: ${n} fila(s) con \`PistaInterruptor\`, y la fila es el interruptor (\`role="switch"\` + \`aria-checked\`)`);
});
ok(!/aria-pressed=\{(auto|!!ev\.notificar)\}/.test(AJ + VISTAS['src/views/CalendarView.jsx']),
  '…ya no son botones «pulsados» (`aria-pressed`): un interruptor se anuncia como interruptor');
const aud = auditarComponentesMotion({ vistas: VISTAS });
ok(aud.cuentas.interruptor_a_mano === 0, `🚨 ni una bola movida con \`left\` en toda la aplicación (${aud.cuentas.interruptor_a_mano})`);
ok(HALLAZGOS_F0.find((h) => h.id === 'tres_interruptores')?.resuelto === 3, '🔓 el hallazgo `tres_interruptores` de la F0 lo cierra la F3');
ok(DEUDA_F0.transition_all === 0, '🔓 …y la deuda de `transition-all` baja de 6 a 0 (es un trinquete: ya no puede volver)');
const a = auditarMotion({ css: CSS, vistas: VISTAS });
ok(a.cuentas.transition_all === 0 && a.deudaQueCrece.length === 0, `…y la auditoría de la F0 lo confirma (${a.cuentas.transition_all})`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. El chevron gira; no se cambia por otro (apartados 14 y 27) ──');

ok(giroDeChevron({ abierto: false }) === 0 && giroDeChevron({ abierto: true }) === 180, 'abajo → arriba: de 0° a 180°');
ok(giroDeChevron({ abierto: false, cerrado: 'derecha', alAbrir: 'abajo' }) === -90 && giroDeChevron({ abierto: true, cerrado: 'derecha', alAbrir: 'abajo' }) === 0,
  'derecha → abajo: de −90° a 0°');
ok(giroDeChevron({ abierto: true, cerrado: 'derecha', alAbrir: 'arriba' }) === -180,
  '🚨 derecha → arriba: −180°, por el camino corto (con +180 daría tres cuartos de vuelta)');
ok(Object.keys(POSICIONES_CHEVRON).join() === 'abajo,derecha,arriba', 'tres posiciones, ninguna inventada');
const chevron = regla('.chevron-gira');
ok(!!chevron && /rotate\(var\(--giro, 0deg\)\)/.test(chevron) && /transition:\s*transform var\(--motion-dur-normal\)/.test(chevron), '`chevron-gira` gira con `--giro` en `normal`');
ok(/html\[data-motion='reducido'\] \.chevron-gira\s*\{[^}]*transition-property:\s*none/.test(CSS_LIMPIO), '…y en Reducido llega sin girar');
ok(/export function ChevronDespliegue/.test(COMP) && /giroDeChevron/.test(COMP) && /'--giro'/.test(COMP), '`ChevronDespliegue` (motion.jsx) pone el giro que decide la librería');
const usosChevron = Object.values(VISTAS).reduce((n, src) => n + (src.match(/<ChevronDespliegue\b/g) || []).length, 0);
ok(usosChevron >= 23, `🚨 los ${usosChevron} desplegables usan el mismo icono que gira`);
ok(aud.cuentas.chevron_que_se_cambia === 0 && aud.cuentas.chevron_girado_a_mano === 0,
  '…y ni uno cambia un icono por otro ni gira el suyo a mano');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Lo que se despliega aparece (apartado 14) ──');

ok(/@keyframes despliegueEntra\s*\{\s*from\s*\{\s*opacity:\s*0;\s*transform:\s*translateY\(calc\(-1 \* var\(--motion-dist-micro\)\)\)/.test(CSS_LIMPIO),
  'entra desde 4 px más arriba con un fundido, y la distancia es un token (en Reducido, 0)');
ok(/\.despliegue-entra\s*\{[^}]*despliegueEntra var\(--motion-dur-fast\)[^;]*backwards/.test(CSS_LIMPIO), '…en `fast`, y con `backwards`: no deja ningún `transform` puesto');
/* 🔓 MS F10 — desde la F10 el contenido de un desplegable va dentro de `Plegable`, que le pone él
   la clase (y además cambia la altura al cerrar, C-54). La promesa es la misma: que lo lleven. */
const usosDespliegue = Object.values(VISTAS).reduce((n, src) => n + (src.match(/despliegue-entra|<Plegable abierto=/g) || []).length, 0);
ok(usosDespliegue >= 17, `lo llevan ${usosDespliegue} desplegables y el ⋯ de las plantillas`);
ok(/className=\{`despliegue-entra \$\{className\}`/.test(VISTAS['src/components/layoutMotion.jsx'] || ''), '…y `Plegable` pone `despliegue-entra` a lo de dentro');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Una marca late al ponerla (apartado 29) ──');

let e = siguienteLatido(null, true);
ok(e.veces === 0 && !e.late, '🚨 al pintarse por primera vez —ya marcada— no late');
e = siguienteLatido(siguienteLatido(null, false), true);
ok(e.veces === 1 && e.late, 'al ponerla, late una vez');
e = siguienteLatido(e, true);
ok(e.veces === 1 && e.late, '…y volver a pintarse marcada no la hace latir otra vez');
e = siguienteLatido(e, false);
ok(e.veces === 1 && !e.late, 'al quitarla, no late: el color ya lo dice');
e = siguienteLatido(e, true);
ok(e.veces === 2 && e.late, '…y al volver a ponerla, late de nuevo');
ok(/\.favorito-guardado\s*\{[^}]*favoritoPulso var\(--motion-dur-normal\)[^;]*backwards/.test(CSS_LIMPIO) && !/\.favorito-guardado:active/.test(CSS_LIMPIO),
  '🔓 la clase late AL MARCAR, no mientras se pulsa (antes latía también al quitarla)');
ok(/scale\(var\(--motion-pulso-fuerte\)\)/.test(CSS_LIMPIO.slice(CSS_LIMPIO.indexOf('@keyframes favoritoPulso'), CSS_LIMPIO.indexOf('@keyframes favoritoPulso') + 200)) && PRESETS_MOTION.selection.pulso === 'fuerte',
  '🐛 el preset `selection` late lo mismo que el CSS (`fuerte`): decía `suave`, y la misma marca latía distinto');
ok(PULSOS_MOTION.fuerte <= 1.35, '…y se queda bajo el techo de una marca pequeña (C-52)');
const usosLatido = Object.values(VISTAS).reduce((n, src) => n + (src.match(/<LatidoAlMarcar activo=/g) || []).length, 0);
ok(usosLatido === 13, `🚨 las trece marcas de favorito de la aplicación laten (${usosLatido})`);
ok(!Object.entries(VISTAS).some(([f, src]) => f !== 'src/components/motion.jsx' && /className="[^"]*favorito-guardado/.test(src)),
  '…y ninguna vista pone la clase a mano (la pone `LatidoAlMarcar`, que sabe cuándo)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Las pestañas y el foco (apartados 7, 24 y 27) ──');

const tab = UI.slice(UI.indexOf('export function ToggleTab('), UI.indexOf('export function EmptyHint('));
ok(/pestana-cambia/.test(tab) && /aria-pressed=\{!!active\}/.test(tab), '`ToggleTab` funde su color (`pestana-cambia`) y dice cuál está elegida');
ok(/\.pestana-cambia\s*\{[^}]*background-color var\(--motion-dur-fast\)/.test(CSS_LIMPIO) && /contenidoCambia var\(--motion-dur-fast\)/.test(CSS_LIMPIO),
  '…al mismo ritmo (`fast`) que el contenido que cambia debajo (F2): una sola acción');
/* El selector lleva paréntesis dentro (`:not([tabindex='-1'])`): se corta por la llave, no por el paréntesis. */
const iFoco = CSS_LIMPIO.indexOf(':where(button');
const foco = iFoco < 0 ? null : (() => { const t = CSS_LIMPIO.slice(iFoco, CSS_LIMPIO.indexOf('}', iFoco)); const [sel, cuerpo] = t.split('{'); return [t, sel, cuerpo]; })();
ok(!!foco && /outline:\s*2px solid var\(--accent/.test(foco[2]) && /button/.test(foco[1]) && /\[role='switch'\]/.test(foco[1]),
  '🚨 el foco de teclado se ve en toda la aplicación, con el acento');
ok(!!foco && !/\binput\b|textarea|select/.test(foco[1]), '⚠️ …y no toca los campos de texto: su aspecto en el iPhone es la C-32, de Josué');
ok(!!foco && !/transition|animation/.test(foco[2]), '…sin animarlo: aparecer en su sitio ya se entiende');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Lo que no puede volver: cada patrón caza su ejemplo malo ──');

const malos = {
  interruptor_a_mano: '<span style={{ left: activo ? 22 : 2 }} />',
  chevron_que_se_cambia: '{abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}',
  chevron_girado_a_mano: "<ChevronDown size={16} style={{ transform: x ? 'rotate(180deg)' : 'none' }} />",
  papelera_que_encoge: '<button className="p-1 active:scale-90" onClick={f}><Trash2 size={13} /></button>',
};
PATRONES_F3.forEach((p) => {
  const r = auditarComponentesMotion({ vistas: { 'src/views/Nueva.jsx': `export default () => (<div>${malos[p.id]}</div>);` } });
  ok(r.cuentas[p.id] === 1 && r.hallazgos[0].linea === 1, `\`${p.id}\` caza su ejemplo malo, con su línea`);
});
ok(auditarComponentesMotion({ vistas: { 'x.jsx': `/* ${malos.interruptor_a_mano} */\nconst a = 1;` } }).hallazgos.length === 0,
  '…y no salta con un comentario que lo menciona');
ok(Object.values(aud.cuentas).every((n) => n === 0), `🚨 hoy, en toda la aplicación, ni uno (${JSON.stringify(aud.cuentas)})`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. El mapa, la auditoría y lo que es de otra fase ──');

['interruptor-bola', 'interruptor', 'chevron-gira', 'despliegue-entra', 'pestana-cambia', 'toque-destructivo', 'favorito-guardado'].forEach((c) => {
  ok(MOTION_MAP.some((x) => x.clase === c), `\`${c}\` está en el MOTION_MAP`);
});
ok(a.sinMapa.length === 0 && a.keyframesHuerfanos.length === 0 && a.mapaSinCss.length === 0 && a.curvasAjenas.length === 0,
  `🚨 la auditoría de la F0 sigue limpia: ni una regla fuera del mapa, ni un keyframe huérfano, ni una curva ajena (${JSON.stringify({ sinMapa: a.sinMapa.length, huerfanos: a.keyframesHuerfanos, sinCss: a.mapaSinCss, curvas: a.curvasAjenas.length })})`);
ok(!MOTION_MAP.some((x) => x.fase === 3 && x.estado === 'inconsistente'), '…y ninguna entrada de la F3 se queda «inconsistente»');
['Botones', 'Tarjetas', 'Interruptores', 'Casillas', 'Radios', 'Sliders', 'Pestañas', 'Desplegables', 'Menús', 'Tooltips', 'Favoritos', 'Foco', 'Hover', 'arrastrables', 'destructivas'].forEach((k) => {
  ok(AUDITORIA_F3.some((x) => x.que.includes(k) && x.hay && x.queda), `la auditoría del apartado 1 cubre «${k}» con lo que hay y lo que queda`);
});
ok(NO_EN_F3.every((x) => /F\d+|C-5\d|no hay|iPhone/.test(x.porque)), 'lo que no es de la F3 dice de quién es, o por qué no se hace');
ok(NO_EN_F3.some((x) => /F9/.test(x.porque)) && NO_EN_F3.some((x) => /F10/.test(x.porque)) && NO_EN_F3.some((x) => /F5/.test(x.porque)),
  '…los estados de un botón (F9), las listas (F10) y arrastrar (F5 y F8)');
ok(JERARQUIA_F3.every((j, i, arr) => j.ms === DURACIONES_MOTION[j.token]) && JERARQUIA_F3[0].ms < JERARQUIA_F3.at(-1).ms,
  'la jerarquía de velocidades sale de los tokens: pulsar es lo más rápido, entrar en una pantalla lo más lento (apartado 36)');
ok(CUANDO_F3.length >= 8 && CUANDO_F3.some((c) => c.patron === 'Nada'), 'y el CUÁNDO de cada patrón, también el de no mover nada (apartados 35 y 42)');
ok(CURVAS_MOTION.entrance === 'cubic-bezier(0.16, 1, 0.3, 1)', 'ni una curva nueva: la de soltar es `entrance`, de la F1 (las curvas son de la F14)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. La documentación ──');

const SIS = leer('docs/MOTION_SYSTEM.md');
ok(/ChevronDespliegue/.test(SIS) && /PistaInterruptor/.test(SIS) && /LatidoAlMarcar/.test(SIS) && /toque-destructivo/.test(SIS), 'MOTION_SYSTEM.md dice cuándo usar cada pieza de la F3');
ok(/\*\*F3\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F3');
ok(/C-54/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), 'C-54 está escrita');
ok(/microinteraccionesMotion/.test(leer('scripts/test-auditoria-final.mjs')), '⚠️ y la auditoría de Imagen personal sabe que esta librería no es suya (décima exclusión a mano)');

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
