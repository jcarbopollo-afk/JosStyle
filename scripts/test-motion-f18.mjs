/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 18 — motion visual polish, brand language, transiciones premium y coherencia sensorial

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f18.mjs

   Lo que se comprueba aquí: la auditoría total (las quince auditorías a la vez sobre todo el código que pinta, y
   que ve lo que cada fase no le dio: el «Verificando…» de `App.jsx`); la personalidad y la temperatura con su
   garantía; el lenguaje familia por familia, buscando cada pieza en el código; la jerarquía sobre las
   prioridades de la F11; los atípicos (iconos que saltan, marcas que laten al abrir, entradas que se quedan) y
   sus arreglos; los tokens sin uso, declarados uno a uno; los guardarraíles con su ejemplo malo; la inspección
   de la consola. Lo que necesita un navegador —el ✓ que no late al abrir y sí al marcar, play ↔ pausa, la barra
   de volver sin transform puesto e `inspeccionar` de verdad— está en la sección «MS F18» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  PERSONALIDAD_MOTION, EVITAR_MOTION, TEMPERATURA_JOSSTYLE, LENGUAJE_JOSSTYLE, JERARQUIA_F18, PRESUPUESTOS_F18,
  PRIMERA_IMPRESION, SISTEMAS_AUDITADOS, auditoriaTotalMotion, codigoQuePinta, inventarioMotion, PARES_DE_ICONOS,
  FINALES_QUE_SE_QUEDAN, auditarPulido, EJEMPLOS_MALOS_F18, ATIPICOS_REVISADOS, TOKENS_DE_RESERVA, tokensSinUso,
  GUARDARRAILES_MOTION, API_MOTION, REGLA_PERMANENTE_MOTION, AUDITORIA_F18, NO_EN_F18, familiasSinPieza,
} from '../src/lib/pulidoMotion.js';
import { PRESETS_MOTION, DURACIONES_MOTION, tokenDeDuracion, tokenDeCurva } from '../src/lib/motion.js';
import { MOTION_MAP, auditarMotion } from '../src/lib/motionMapa.js';
import { ROL_POR_CLASE, rolDe } from '../src/lib/lenguajeMotion.js';
import { PRIORIDADES_MOTION, PRESUPUESTO_ORQUESTADOR, inspeccionar, apiDeDepuracion, animarOrquestado, olvidarTodo, auditarOrquestacion } from '../src/lib/orquestadorMotion.js';
import { CLASES_LATIDO, claseDeLatido, siguienteIcono, siguienteLatido } from '../src/lib/microinteraccionesMotion.js';
import { auditarEstadosInteraccion } from '../src/lib/estadosInteraccion.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');

let ok_ = 0;
let mal = 0;
function ok(cond, msg) {
  if (cond) { ok_ += 1; console.log(`  \x1b[32m✓\x1b[0m ${msg}`); } else { mal += 1; console.log(`  \x1b[31m✗ ${msg}\x1b[0m`); }
}

const CSS = leer('src/index.css');
const TODOS = {};
const recorrer = (d) => readdirSync(join(RAIZ, d)).forEach((f) => {
  const p = `${d}/${f}`;
  if (statSync(join(RAIZ, p)).isDirectory()) recorrer(p);
  else if (/\.(jsx?)$/.test(f)) TODOS[p] = leer(p);
});
recorrer('src');
const VISTA = (n) => leer(`src/views/${n}.jsx`);

/* ---------------------------------------------------------------------------
   1 · LA AUDITORÍA TOTAL (apartado 1)
   --------------------------------------------------------------------------- */
{
  console.log('\n1 · La auditoría total: las quince, a la vez, sobre todo lo que pinta');
  const fases = SISTEMAS_AUDITADOS.map((s) => s.fase);
  ok([0, 1, 3, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].every((f) => fases.includes(f)),
    `los sistemas del apartado 1, cada uno con la auditoría de su fase (${SISTEMAS_AUDITADOS.length})`);
  const t = auditoriaTotalMotion({ css: CSS, archivos: TODOS });
  ok(t.total === 0, `🚨 hoy, ni un hallazgo en ${t.archivos} archivos${t.total ? `: ${JSON.stringify(t.porSistema.filter((s) => s.hallazgos.length).map((s) => [s.id, s.hallazgos.slice(0, 2)]))}` : ''}`);
  ok(t.archivos > 80 && Object.keys(codigoQuePinta(TODOS)).every((r) => !r.startsWith('src/lib/')) && 'src/App.jsx' in codigoQuePinta(TODOS),
    'mira las vistas, los componentes y `App.jsx`; no las librerías, que guardan las reglas y sus ejemplos malos');
  /* El hallazgo de la fase: el bloqueo por inactividad escribía a mano su «Verificando…». */
  const appVieja = TODOS['src/App.jsx'].replace(/<TextoDeBoton estado=\{verificando \? 'cargando' : 'reposo'\} textoCargando="Verificando…">\s*Desbloquear con Face ID \/ Touch ID\s*<\/TextoDeBoton>/,
    "{verificando ? 'Verificando…' : 'Desbloquear con Face ID / Touch ID'}");
  ok(appVieja !== TODOS['src/App.jsx'], '(se reconstruye el `App.jsx` de antes de la F18 para la prueba)');
  const conViejo = auditoriaTotalMotion({ css: CSS, archivos: { ...TODOS, 'src/App.jsx': appVieja } });
  const est = conViejo.porSistema.find((s) => s.id === 'estados');
  ok(est.hallazgos.some((h) => h.archivo === 'src/App.jsx' && h.tipo === 'cargando_a_mano'),
    '🐛 con el `App.jsx` de antes, la auditoría total caza el «Verificando…» escrito a mano que la F9 no vio (nunca le dio ese archivo)');
  ok(auditarEstadosInteraccion({ vistas: { 'src/App.jsx': TODOS['src/App.jsx'] } }).hallazgos.length === 0, '…y con el de ahora, `App.jsx` está limpio');
  const app = TODOS['src/App.jsx'];
  const bloqueo = app.slice(app.indexOf('function BloqueoAutomaticoGate'), app.indexOf('// FO Fase 1', app.indexOf('function BloqueoAutomaticoGate')));
  ok(/<TextoDeBoton estado=\{verificando \? 'cargando' : 'reposo'\}/.test(bloqueo) && /aria-busy=\{verificando \|\| undefined\}/.test(bloqueo) && !/disabled=\{verificando\}/.test(bloqueo.slice(bloqueo.indexOf('intentarBiometria}'))),
    '🔓 el botón de Face ID espera como todos: `TextoDeBoton`, sin cambiar de ancho y sin apagarse (`aria-busy`, F9)');
  ok(/if \(verificando\) return;/.test(bloqueo), '…y un segundo toque mientras espera no repite la verificación');
}

/* ---------------------------------------------------------------------------
   2 · LA PERSONALIDAD Y LA TEMPERATURA (apartados 4, 5, 49-51)
   --------------------------------------------------------------------------- */
{
  console.log('\n2 · La personalidad y la temperatura');
  const rasgos = PERSONALIDAD_MOTION.map((p) => p.rasgo);
  ok(['precisión', 'control', 'calma', 'tecnología', 'premium', 'claridad', 'energía contenida'].every((r) => rasgos.includes(r)),
    'los siete rasgos del apartado 4');
  const exportado = (nombre) => Object.values(TODOS).some((src) => new RegExp(`export (?:function|const|class) ${nombre}\\b`).test(src));
  ok(PERSONALIDAD_MOTION.every((p) => (p.garantia.match(/[a-zA-Z_]{6,}/g) || []).some((n) => exportado(n))),
    '🚨 cada rasgo con una garantía que EXISTE en el código (una función o una tabla exportada): un rasgo sin comprobación es un adjetivo');
  ok(EVITAR_MOTION.length === 5 && /rebote/i.test(EVITAR_MOTION[0].que) && EVITAR_MOTION.every((e) => e.impide.length > 20), 'lo que el apartado 4 prohíbe, cada cosa con quién lo impide');
  ok(TEMPERATURA_JOSSTYLE.josstyle.map((r) => r.rasgo).join('+') === 'preciso+responsive+controlado',
    'la temperatura del apartado 5: preciso + responsive + controlado');
  ok(TEMPERATURA_JOSSTYLE.josstyle.filter((r) => r.lado === 'frio').length === 2 && TEMPERATURA_JOSSTYLE.josstyle.find((r) => r.rasgo === 'responsive').lado === 'calido',
    '…dos rasgos fríos y uno cálido, cada uno con lo que lo hace así');
}

/* ---------------------------------------------------------------------------
   3 · EL LENGUAJE, FAMILIA POR FAMILIA (apartados 9-30)
   --------------------------------------------------------------------------- */
{
  console.log('\n3 · El lenguaje de JosStyle');
  const ids = LENGUAJE_JOSSTYLE.map((f) => f.id);
  ok(['entrada', 'salida', 'modal', 'hoja', 'popover', 'tooltip', 'toast', 'navegacion', 'atras', 'pestanas', 'boton', 'iconos', 'microinteracciones', 'formularios', 'exito', 'error', 'carga', 'datos', 'profundidad'].every((i) => ids.includes(i)),
    `las familias del enunciado, una por una (${ids.length})`);
  const existePieza = (p) => {
    if (p.tipo === 'preset') return !!PRESETS_MOTION[p.nombre];
    if (p.tipo === 'clase') return new RegExp(`\\.${p.nombre}(?![\\w-])[^{]*\\{`).test(CSS);
    return new RegExp(`export (?:function|const|class) ${p.nombre}\\b`).test(leer(p.archivo));
  };
  const faltan = LENGUAJE_JOSSTYLE.flatMap((f) => f.piezas.filter((p) => !existePieza(p)).map((p) => `${f.id}:${p.nombre}`));
  ok(faltan.length === 0, `🚨 cada pieza del lenguaje existe donde dice (${LENGUAJE_JOSSTYLE.reduce((n, f) => n + f.piezas.length, 0)} piezas)${faltan.length ? `: ${faltan.join(', ')}` : ''}`);
  ok(familiasSinPieza().length === 0 && LENGUAJE_JOSSTYLE.find((f) => f.id === 'tooltip').existe === false,
    'solo el tooltip no tiene pieza, y es porque no existe (en el iPhone no hay puntero que se pose)');
  const entradas = Object.entries(PRESETS_MOTION).filter(([, p]) => p.desde);
  ok(entradas.every(([, p]) => !(('x' in p.desde) && ('y' in p.desde)) && Object.keys(p.desde).length <= 3),
    'apartado 9 — una entrada combina la opacidad con un desplazamiento O una escala de superficie: nunca un desplazamiento en dos ejes, ni las cuatro cosas a la vez');
  const parejas = [['pageEnter', 'pageExit'], ['cardEnter', 'cardExit'], ['modalEnter', 'modalExit'], ['sheetEnter', 'sheetExit'], ['toastEnter', 'toastExit']];
  ok(parejas.every(([e, s]) => DURACIONES_MOTION[PRESETS_MOTION[s].duracion] < DURACIONES_MOTION[PRESETS_MOTION[e].duracion] && PRESETS_MOTION[s].curva === 'exit'),
    'apartado 10 — toda salida dura menos que su entrada y acelera hacia fuera (`exit`)');
}

/* ---------------------------------------------------------------------------
   4 · LA JERARQUÍA, EL PRESUPUESTO Y LA PRIMERA IMPRESIÓN (apartados 45-48)
   --------------------------------------------------------------------------- */
{
  console.log('\n4 · Jerarquía, presupuesto y primera impresión');
  const agrupadas = JERARQUIA_F18.flatMap((n) => n.prioridades);
  ok(PRIORIDADES_MOTION.every((p) => agrupadas.filter((x) => x === p.id).length === 1) && agrupadas.length === PRIORIDADES_MOTION.length,
    'los cuatro niveles del apartado 45 agrupan las siete prioridades de la F11, cada una en uno: no hay una escala nueva');
  ok(JERARQUIA_F18[0].prioridades.includes('critica') && JERARQUIA_F18[3].prioridades.includes('decorativa') && JERARQUIA_F18.map((n) => n.nivel).join() === '1,2,3,4',
    '…lo crítico arriba y lo decorativo abajo');
  ok(PRESUPUESTO_ORQUESTADOR.cedenPorPresupuesto.every((p) => !JERARQUIA_F18[0].prioridades.includes(p)) && PRESUPUESTO_ORQUESTADOR.cedenPorPresupuesto.includes('decorativa'),
    'apartado 46 — cuando hay demasiado, cede lo menos importante, nunca lo crítico');
  ok(PRESUPUESTOS_F18.length >= 3 && PRESUPUESTOS_F18[0].valor === PRESUPUESTO_ORQUESTADOR.simultaneas, 'los presupuestos que ya existen, con su valor de verdad (no uno nuevo)');
  ok(PRIMERA_IMPRESION.every((p) => MOTION_MAP.some((e) => e.id === p.mapa)), `apartado 48 — cada momento de la primera impresión es una línea del mapa (${PRIMERA_IMPRESION.length})`);
}

/* ---------------------------------------------------------------------------
   5 · EL INVENTARIO (apartado 2)
   --------------------------------------------------------------------------- */
{
  console.log('\n5 · El inventario');
  const inv = inventarioMotion({ css: CSS, archivos: TODOS });
  ok(inv.keyframes >= 30 && inv.animarOrquestado > 0 && inv.mapa.lineas === MOTION_MAP.length, `cuenta lo que hay: ${inv.keyframes} @keyframes, ${inv.animarOrquestado} llamadas al orquestador, ${inv.mapa.lineas} líneas del mapa`);
  ok(inv.keyframesPorPropiedad.opacity + inv.keyframesPorPropiedad.transform > inv.keyframesPorPropiedad.otras * 10,
    `casi todo se anima con opacidad y transform (${JSON.stringify(inv.keyframesPorPropiedad)})`);
  ok(inv.hover === 0, 'ni un `hover:` en lo que pinta: en el iPhone no se posa nada (F2)');
  ok(inv.iconosQueCambian === 4 && inv.latidos >= 21, `los iconos que cambian (${inv.iconosQueCambian}) y las marcas que laten (${inv.latidos})`);
  ok(inv.muellesEnUso.length > 0 && !inv.muellesEnUso.includes('bouncy'), 'los muelles en uso, y ninguno rebota');
}

/* ---------------------------------------------------------------------------
   6 · LOS ATÍPICOS Y SUS ARREGLOS (apartados 3, 20, 23 y 52)
   --------------------------------------------------------------------------- */
{
  console.log('\n6 · Los atípicos');
  const hoy = auditarPulido({ archivos: codigoQuePinta(TODOS), css: CSS });
  ok(hoy.length === 0, `🚨 hoy, ni un icono que salta, ni una marca que late al abrir, ni una entrada que se queda${hoy.length ? `: ${JSON.stringify(hoy.slice(0, 3))}` : ''}`);
  ok(EJEMPLOS_MALOS_F18.every((e) => auditarPulido({ archivos: e.archivos || {}, css: e.css || '' }).some((p) => p.regla === e.regla)),
    'cada regla caza su ejemplo malo (una que no puede ponerse roja no sirve)');
  /* Lo de antes, reconstruido: la casilla del hábito con su clase escrita y play/pausa a pelo. */
  const prodVieja = VISTA('ProductivityView').replace(/<LatidoAlMarcar activo=\{!!hecho\} latido="habito">\s*\{hecho\s*\? <CheckCircle2 size=\{24\} style=\{\{ color: accent \}\} \/>/,
    '{hecho\n              ? <CheckCircle2 size={24} style={{ color: accent }} className="habito-hecho" />');
  ok(auditarPulido({ archivos: { 'src/views/ProductivityView.jsx': prodVieja } }).some((p) => p.regla === 'marca_que_late_al_montar' && p.clase === 'habito-hecho'),
    '🐛 la casilla de un hábito con su clase escrita (lo de antes) se caza: latía al abrir la pantalla, todas a la vez');
  const bienVieja = VISTA('WellbeingView').replace(/<IconoQueCambia clave=\{corriendo \? 'pausa' : 'play'\}>\s*(\{corriendo \? <Pause size=\{22\} \/> : <Play size=\{22\} \/>\})\s*<\/IconoQueCambia>/, '$1');
  ok(auditarPulido({ archivos: { 'src/views/WellbeingView.jsx': bienVieja } }).some((p) => p.regla === 'icono_que_salta'),
    '🐛 y play ↔ pausa a pelo (lo de antes) también: el icono se sustituía de golpe');
  ok(Object.keys(FINALES_QUE_SE_QUEDAN).every((c) => new RegExp(`\\.${c}\\s*\\{[^}]*\\bboth\\b`).test(CSS)), 'lo que termina con `both` a propósito (el «+1»), declarado y con su motivo');
  for (const c of ['tarea-hecha', 'habito-hecho', 'back-bar', 'hub-header', 'fuego-sube', 'celebracion-libro', 'rutina-fin']) {
    const regla = CSS.match(new RegExp(`\\.${c}\\s*\\{[^}]*animation:[^;]*;`));
    ok(regla && /\bbackwards\b/.test(regla[0]) && !/\bboth\b/.test(regla[0]), `🔓 \`.${c}\` termina con \`backwards\`: no deja su último fotograma puesto (la regla de la F3)`);
  }
  ok(PARES_DE_ICONOS.some(([a, b]) => a === 'Play' && b === 'Pause') && PARES_DE_ICONOS.some(([a, b]) => a === 'Check' && b === 'Plus') && PARES_DE_ICONOS.some(([a, b]) => a === 'X' && b === 'MoreHorizontal'),
    'los pares del apartado 20: play ↔ pausa, ＋ ↔ ✓, ⋯ ↔ ✕');
  ok(ATIPICOS_REVISADOS.length >= 5 && ATIPICOS_REVISADOS.every((a) => a.decision && a.porque.length > 20), 'lo que se miró y se queda, uno a uno y con su motivo (apartado 3)');
}

/* ---------------------------------------------------------------------------
   7 · ICONOS QUE CAMBIAN Y MARCAS QUE LATEN (apartados 20, 21 y 23)
   --------------------------------------------------------------------------- */
{
  console.log('\n7 · El icono que cambia y la marca que late');
  let e = siguienteIcono(null, 'play');
  ok(e.veces === 0 && !e.cambia, 'al pintarse por primera vez, el icono no se mueve');
  e = siguienteIcono(e, 'play');
  ok(e.veces === 0 && !e.cambia, '…ni al repintarse con lo mismo');
  e = siguienteIcono(e, 'pausa');
  ok(e.veces === 1 && e.cambia, 'al cambiar de sentido, aparece el nuevo');
  ok(siguienteIcono(e, 'pausa').veces === 1, '…y pintarlo dos veces con lo mismo (el doble pintado de `StrictMode`) no lo anima otra vez');
  ok(siguienteIcono(siguienteIcono(e, 'play'), 'pausa').veces === 3, 'cada cambio de verdad, otra vez');
  const MOT = leer('src/components/motion.jsx');
  ok(/export function IconoQueCambia\(\{ clave, children, className = '' \}\)/.test(MOT) && /siguienteIcono\(estado\.current, clave\)/.test(MOT) && /'icono-cambia '/.test(MOT),
    '`IconoQueCambia` lleva la cuenta con `siguienteIcono` y pone `icono-cambia` solo cuando cambia');
  const regla = CSS.match(/\.icono-cambia\s*\{[^}]*\}/);
  ok(regla && /marcaAparece var\(--motion-dur-fast\) var\(--motion-curva-entrance\) backwards/.test(regla[0]), 'el icono nuevo aparece en `fast` con la curva de lo que aparece, y termina con `backwards`');
  const kf = CSS.slice(CSS.indexOf('@keyframes marcaAparece'), CSS.indexOf('@keyframes marcaAparece') + 200);
  const reducido = CSS.slice(CSS.indexOf("html[data-motion='reducido'] {"), CSS.indexOf("html[data-motion='reducido'] {") + 1500);
  ok(/scale\(var\(--motion-escala-hero\)\)/.test(kf) && /--motion-escala-hero:\s*1;/.test(reducido), 'su escala es la de una marca (`escala-hero`), que en Reducido vale 1: solo se funde');
  const linea = MOTION_MAP.find((x) => x.id === 'icono_cambia');
  ok(linea && linea.clase === 'icono-cambia' && linea.nivel === 1 && linea.fase === 18 && rolDe(linea) === 'aparece' && ROL_POR_CLASE['icono-cambia'],
    'tiene su línea en el mapa (nivel 1, F18) y su papel en el lenguaje de la F14: aparece en su sitio');
  const usos = { WellbeingView: "clave={corriendo ? 'pausa' : 'play'}", EntrenamientoVivoView: "clave={pausado ? 'play' : 'pausa'}", PlantillasView: "clave={abierto ? 'cerrar' : 'acciones'}", LibraryView: "clave={marcada ? 'puesta' : 'anadir'}" };
  ok(Object.entries(usos).every(([v, s]) => VISTA(v).includes(`<IconoQueCambia ${s}>`)), 'en los cuatro sitios donde un icono cambiaba de sentido: concentración, descanso, el menú de una plantilla y una colección');
  ok(/aria-label=\{corriendo \? 'Pausar la concentración' : 'Empezar la concentración'\}/.test(VISTA('WellbeingView')) && /aria-label="Reiniciar la concentración"/.test(VISTA('WellbeingView')),
    '🐛 y los dos botones de solo icono de la concentración ya dicen qué hacen (no tenían `aria-label`)');
  ok(CLASES_LATIDO.favorito === 'favorito-guardado' && CLASES_LATIDO.tarea === 'tarea-hecha' && CLASES_LATIDO.habito === 'habito-hecho' && claseDeLatido('otro') === 'favorito-guardado',
    'tres latidos, cada uno con su clase; uno desconocido late como un favorito');
  ok(Object.values(CLASES_LATIDO).every((c) => new RegExp(`\\.${c}\\s*\\{`).test(CSS)), '…y las tres existen en el CSS');
  const l = siguienteLatido(siguienteLatido(null, true), true);
  ok(l.veces === 0 && !l.late, 'una marca que ya estaba puesta al abrir no late (la regla de la F3, ahora también para el ✓)');
  ok(/latido = 'favorito'/.test(MOT) && /claseDeLatido\(latido\)/.test(MOT), '`LatidoAlMarcar` recibe `latido`, y por defecto es el de un favorito (las trece marcas de la F3 no cambian)');
  const tareas = ['CalendarView', 'ProductivityView', 'FaithView', 'TrainingView'].reduce((n, v) => n + (VISTA(v).match(/latido="tarea"/g) || []).length, 0);
  ok(tareas === 8 && /latido="habito"/.test(VISTA('ProductivityView')), `el ✓ de las tareas (${tareas}: Calendario, Productividad, Fe, Entrenamiento) y el del hábito, por \`LatidoAlMarcar\``);
  ok(Object.keys(TODOS).filter((r) => !r.startsWith('src/lib/')).every((r) => !/className=["'{`][^"'}`]*\b(tarea-hecha|habito-hecho)\b/.test(TODOS[r])),
    '🚨 y ninguna pantalla escribe la clase en el icono: latiría al abrir');
  ok(/aria-pressed=\{!!p\.hecho\}/.test(VISTA('TrainingView')), '🐛 la casilla de un paso de progresión dice si está marcada (`aria-pressed`): siempre decía «Marcar hecho»');
}

/* ---------------------------------------------------------------------------
   8 · LOS TOKENS (apartado 53)
   --------------------------------------------------------------------------- */
{
  console.log('\n8 · Los tokens');
  const sinUso = tokensSinUso({ css: CSS, archivos: TODOS });
  ok(JSON.stringify([...sinUso].sort()) === JSON.stringify(Object.keys(TOKENS_DE_RESERVA).sort()),
    `🚨 los tokens que no usa nadie son exactamente los declarados, con su motivo (${sinUso.join(', ')})`);
  ok(Object.values(TOKENS_DE_RESERVA).every((m) => /F1|F8/.test(m) && m.length > 40), '…y cada uno lo exige la F1 o lo mide la F8 (C-67)');
  const sinLatido = CSS.replace(/var\(--motion-dur-latido\)/g, '0ms');
  ok(tokensSinUso({ css: sinLatido, archivos: TODOS }).includes('duracion.latido'),
    'el trinquete: si un token deja de usarse sin declararlo, aparece y la suite se pone roja');
  ok(/C-67/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), 'la contradicción con la F1 está anotada en docs/03 (C-67)');
}

/* ---------------------------------------------------------------------------
   9 · LOS GUARDARRAÍLES, LA API Y LA REGLA PERMANENTE (apartados 54, 55 y 64)
   --------------------------------------------------------------------------- */
{
  console.log('\n9 · Guardarraíles, API y regla permanente');
  const caza = (g) => {
    if (g.id === 'transition_all') return auditarMotion({ css: CSS, vistas: g.ejemplo.vistas }).deudaQueCrece.some((d) => d.tipo === 'transition_all');
    if (g.id === 'duracion_suelta') return auditarMotion({ css: CSS, vistas: g.ejemplo.vistas }).deudaQueCrece.some((d) => /linea|en_linea/.test(d.tipo));
    if (g.id === 'curva_suelta') return auditarMotion({ css: `${CSS}\n${g.ejemplo.css}`, vistas: {} }).curvasAjenas.length > 0;
    if (g.id === 'segundo_sistema') return auditarOrquestacion({ archivos: g.ejemplo.archivos }).hallazgos.length > 0;
    return false;
  };
  for (const g of GUARDARRAILES_MOTION) ok(caza(g), `🚨 «No: ${g.no}» — ${g.caza} caza su ejemplo malo`);
  ok(GUARDARRAILES_MOTION.length === 4, 'los cuatro «No» del apartado 55');
  ok(!/framer-motion|react-spring|gsap|animejs|popmotion|motion-one/.test(leer('package.json')), '…y el package.json sigue sin una librería de animación (ni un segundo sistema)');
  ok(API_MOTION.length === 6 && API_MOTION.every((a) => a.donde.split(' · ').every((d) => { try { leer(d); return true; } catch { return false; } })),
    'apartado 54 — seis recetas para quien empieza, cada una con el archivo donde está');
  ok(REGLA_PERMANENTE_MOTION.length === 9 && REGLA_PERMANENTE_MOTION.every((r) => /\?$/.test(r.pregunta) && r.contesta.length > 20),
    'apartado 64 — las nueve preguntas, cada una con quién la contesta');
}

/* ---------------------------------------------------------------------------
   10 · LA INSPECCIÓN (apartados 56 y 57)
   --------------------------------------------------------------------------- */
{
  console.log('\n10 · La inspección');
  ok(typeof apiDeDepuracion().inspeccionar === 'function', '`window.__motion.inspeccionar` existe (solo en desarrollo, como el resto de la consola)');
  ok(tokenDeDuracion(DURACIONES_MOTION.fast) === 'fast' && tokenDeDuracion(364, 'lenta') === 'medium' && tokenDeDuracion(333) === null,
    'una duración medida se nombra como su token, a la velocidad de ahora; un número suelto se queda sin nombre');
  ok(tokenDeCurva('cubic-bezier(0.16, 1, 0.3, 1)') === 'entrance' && tokenDeCurva('cubic-bezier(0.32,0.72,0,1)') === 'standard' && tokenDeCurva('ease') === null,
    'una curva, como la suya (con o sin espacios); `ease` no es de JosStyle');
  const animCss = { animationName: 'marcaAparece', playState: 'running', effect: { getTiming: () => ({ duration: 160, delay: 0, easing: 'linear' }), getKeyframes: () => [{ easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }, {}] } };
  const elCss = { tagName: 'SPAN', classList: ['inline-flex', 'icono-cambia'], getAnimations: () => [animCss] };
  const l = inspeccionar(elCss)[0];
  ok(l && l.nombre === 'marcaAparece' && l.fuente === 'index.css' && l.sistema === 'css' && l.duracion === 160 && l.tokenDuracion === 'fast' && l.tokenCurva === 'entrance' && l.elemento === 'span.inline-flex.icono-cambia',
    `una animación de CSS: nombre, fuente, duración y curva con sus tokens (la curva, de los fotogramas) y el elemento (${JSON.stringify(l)})`);
  olvidarTodo();
  const animJs = { playState: 'running', effect: { getTiming: () => ({ duration: 280, delay: 0, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }) }, addEventListener: () => {}, cancel() { this.playState = 'idle'; }, finished: Promise.resolve(), onfinish: null, oncancel: null };
  const elJs = { tagName: 'DIV', classList: [], animate: () => animJs, getAnimations: () => [animJs], style: {}, setAttribute: () => {}, removeAttribute: () => {} };
  animarOrquestado(elJs, [{ opacity: 0 }, { opacity: 1 }], { duration: 280 }, { sistema: 'datos', id: 'prueba_f18' });
  const j = inspeccionar(elJs)[0];
  ok(j && j.fuente === 'orquestador' && j.sistema === 'datos' && j.nombre === 'prueba_f18' && j.prioridad && j.tokenDuracion === 'medium' && j.tokenCurva === 'standard',
    `una del orquestador: su id, su sistema y su prioridad, con sus tokens (${JSON.stringify(j && { nombre: j.nombre, sistema: j.sistema, prioridad: j.prioridad, tokenDuracion: j.tokenDuracion })})`);
  ok(inspeccionar({ getAnimations: () => [] }).length === 0 && inspeccionar(null).length === 0, 'un elemento quieto (o ninguno) devuelve una lista vacía, sin romper nada');
  ok(!/^import /m.test(leer('src/lib/orquestadorMotion.js').replace(/\/\*[\s\S]*?\*\//g, '')), '🚨 el orquestador sigue siendo una hoja: los tokens se los cuenta `motion.js` (`describirInspeccionCon`)');
  olvidarTodo();
}

/* ---------------------------------------------------------------------------
   11 · LA AUDITORÍA DEL ENUNCIADO, LA DOCUMENTACIÓN Y EL RECORRIDO
   --------------------------------------------------------------------------- */
{
  console.log('\n11 · El enunciado, la documentación y el recorrido');
  const cubiertos = new Set(AUDITORIA_F18.flatMap((a) => a.apartados));
  ok([1, 2, 3, 4, 5, 9, 20, 23, 45, 48, 52, 53, 55, 56, 57, 58, 64].every((a) => cubiertos.has(a)), `la auditoría del enunciado cubre los apartados que construyen algo (${cubiertos.size})`);
  ok(NO_EN_F18.length >= 4 && NO_EN_F18.every((n) => n.porque.length > 20), 'lo que no se hace, con su motivo');
  const SIS = leer('docs/MOTION_SYSTEM.md');
  const lang = SIS.slice(SIS.indexOf('## Jos Style Motion Language'));
  ok(SIS.includes('## Jos Style Motion Language') && ['personalidad', 'principios', 'jerarquía', 'curvas', 'duraciones', 'muelles', 'gestos', 'profundidad', 'responsive', 'accesibilidad'].every((p) => new RegExp(p, 'i').test(lang)),
    'apartado 58 — MOTION_SYSTEM.md tiene «Jos Style Motion Language» con lo que el enunciado enumera');
  ok(/¿Qué comunica\?/.test(lang) && /IconoQueCambia/.test(lang) && /inspeccionar/.test(lang), '…con la regla permanente, las piezas nuevas y la inspección');
  ok(/\*\*F18\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F18');
  const recorrido = leer('scripts/test-app-real.mjs');
  const sec = recorrido.slice(recorrido.indexOf('── MS F18 · El lenguaje, pulido'));
  ok(/tarea-hecha/.test(sec) && /icono-cambia/.test(sec) && /back-bar/.test(sec) && /inspeccionar/.test(sec),
    'el recorrido mide en Chromium el ✓ que no late al abrir y sí al marcar, play ↔ pausa, la barra de volver y la inspección');
  ok(/test-motion-f18\.mjs/.test(leer('scripts/verificar.sh')), 'y `verificar.sh` ejecuta esta suite');
}

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
