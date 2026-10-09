/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 4 — datos dinámicos, listas, gráficas y estados

   Se ejecuta con:  node --import ./scripts/resolver-vite.mjs scripts/test-motion-f4.mjs

   Lo que se comprueba aquí es la DECISIÓN —cómo se anima una gráfica en cada
   modo, qué hace una cifra que cambia, cuántas pueden contar a la vez— y que la
   aplicación la cablee (las tres gráficas de Recharts, las cifras principales,
   los vacíos, el cambio de periodo de Fitness). Lo que necesita un navegador
   —que el saldo cuente al borrar un gasto y no al abrir, cuánto tarda de verdad
   la línea de Sueño— está en la sección «MS F4» de `test-app-real.mjs`.
   =========================================================================== */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  animacionDeGrafica, animacionDeTooltip, decimalesDe, interpolarCifra, curvaDeCuenta,
  CUENTAS_A_LA_VEZ, reservarCuenta, liberarCuenta, cuentasActivas, planDeCifra,
  AUDITORIA_F4, NO_EN_F4, JERARQUIA_DATOS_F4,
} from '../src/lib/datosMotion.js';
import { contextoMotion, CURVAS_MOTION, DURACIONES_MOTION, PRESETS_MOTION } from '../src/lib/motion.js';
import { MOTION_MAP, HALLAZGOS_F0, DEUDA_F0, auditarMotion } from '../src/lib/motionMapa.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const CSS = leer('src/index.css');
const CSS_LIMPIO = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
const COMP = leer('src/components/motion.jsx');

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

const NORMAL = contextoMotion();
const LENTA = contextoMotion({ velocidad: 'lenta' });
const REDUCIDO = contextoMotion({ reducirMovimiento: true });
const SISTEMA = contextoMotion({ sistemaReduce: true });
const OFF = contextoMotion({ animaciones: 'desactivadas' });

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Las gráficas de Recharts, gobernadas (apartados 21-27, hallazgo `graficas_sin_control`) ──');

const g = animacionDeGrafica(NORMAL);
ok(g.isAnimationActive && g.animationDuration === DURACIONES_MOTION.cinematic && g.animationEasing === CURVAS_MOTION.standard && g.animationBegin === 0,
  `🐛 en Normal, la línea se mueve ${g.animationDuration} ms con la curva de JosStyle (Recharts traía 1500 ms y la suya)`);
ok(animacionDeGrafica(LENTA).animationDuration === Math.round(DURACIONES_MOTION.cinematic * 1.3), '…y obedece a la velocidad: en Pausada, ×1,3');
ok(animacionDeGrafica(REDUCIDO).isAnimationActive === false && animacionDeGrafica(SISTEMA).isAnimationActive === false,
  '🚨 en Reducido —el de Ajustes y el del iPhone— no se dibuja: aparece en su sitio (C-52)');
ok(animacionDeGrafica(OFF).isAnimationActive === false, '…y con «Sin movimiento», tampoco');
const t = animacionDeTooltip(NORMAL);
ok(t.isAnimationActive && t.animationDuration === DURACIONES_MOTION.fast && !animacionDeTooltip(REDUCIDO).isAnimationActive,
  `el tooltip aparece y se va en \`fast\` (${t.animationDuration} ms), y en Reducido sin moverse (apartado 27)`);
const CON_GRAFICA = ['src/views/SleepView.jsx', 'src/views/HealthView.jsx', 'src/views/NutritionView.jsx'];
CON_GRAFICA.forEach((f) => {
  const src = VISTAS[f];
  const lineas = src.match(/<Line\b[^>]*>/g) || [];
  const tooltips = src.match(/<Tooltip\b[\s\S]*?\/>/g) || [];
  ok(/const animGrafica = useAnimacionDeGrafica\(\);/.test(src) && lineas.length >= 1
    && lineas.every((l) => /isAnimationActive=\{animGrafica\.linea\.isAnimationActive\}/.test(l) && /animationDuration=\{animGrafica\.linea\.animationDuration\}/.test(l))
    && tooltips.every((x) => /isAnimationActive=\{animGrafica\.tooltip\.isAnimationActive\}/.test(x)),
  `${f.replace('src/views/', '')}: la serie y el tooltip piden su movimiento al motor`);
  /* El gancho, arriba del todo: ningún `return` puede ir antes que él (regla 4). */
  const cuerpo = src.slice(src.indexOf('const animGrafica'));
  const antes = src.slice(0, src.indexOf('const animGrafica'));
  const funcion = antes.slice(antes.lastIndexOf('function '));
  /* ⚠️ Sin comentarios: el que acompaña al gancho DICE «antes de cualquier `return`», y un barrido
     que no los quita se encuentra a sí mismo (la lección de siempre). */
  const codigo = funcion.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  ok(codigo.length > 20 && !/\breturn\b/.test(codigo), `…y el gancho va antes de cualquier \`return\` del componente (${f.replace('src/views/', '')})`);
  ok(!/<LineChart\b[^>]*\bkey=/.test(src), '…y la gráfica no cambia de `key` con los datos: interpola en vez de rehacerse (apartado 22)');
});
const a = auditarMotion({ css: CSS, vistas: VISTAS });
ok(a.cuentas.series_sin_gobierno === 0 && DEUDA_F0.series_sin_gobierno === 0, `🔓 ni una serie de Recharts sin gobernar (${a.cuentas.series_sin_gobierno}; eran 3)`);
ok(HALLAZGOS_F0.find((h) => h.id === 'graficas_sin_control')?.resuelto === 4, '🔓 el hallazgo `graficas_sin_control` lo cierra la F4');
ok(!MOTION_MAP.some((e) => e.estado === 'fuera_de_control'), '…y en el mapa ya no queda nada «fuera de control»');
ok(/useAnimacionDeGrafica/.test(COMP) && /animacionDeGrafica\(ctx\)/.test(COMP) && /useMotion\(\)/.test(COMP.slice(COMP.indexOf('export function useAnimacionDeGrafica'))),
  'el gancho vuelve a leer el contexto cuando él cambia un ajuste (`useMotion`)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Una cifra que cambia (apartados 2-6) ──');

ok(planDeCifra(null, 72) === null && planDeCifra(undefined, 72) === null, '🚨 la primera vez no hay nada que contar: nunca un 0 → 100 al aparecer (apartado 4)');
ok(planDeCifra(72, null) === null, '…ni hacia un hueco: sin dato no se anima nada');
ok(planDeCifra(72, 72) === null, '…ni si no ha cambiado');
ok(planDeCifra(72, 73, { ctx: OFF }) === null, '…y con «Sin movimiento» el valor cambia sin más');
/* 🔓 MS F17 (apartado 5) — la duración de una cuenta depende de cuánto cambia: con la duración por
   defecto (`auto`) 72 → 73 es un cambio pequeño y va en `fast`; con una duración dada, la de siempre. */
let p = planDeCifra(72, 73, { modo: 'cuenta', ctx: NORMAL, duracion: 'normal' });
ok(p.tipo === 'cuenta' && p.direccion === 1 && p.decimales === 0 && p.duracion === DURACIONES_MOTION.normal, '72 → 73 cuenta, hacia arriba, sin decimales, en `normal` cuando se pide');
ok(planDeCifra(72, 73, { modo: 'cuenta', ctx: NORMAL }).duracion === DURACIONES_MOTION.fast, '🔓 …y por defecto (MS F17) un cambio pequeño es una cuenta corta');
p = planDeCifra(88, 100, { modo: 'cuenta', ctx: NORMAL, duracion: 'cinematic' });
ok(p.duracion === DURACIONES_MOTION.cinematic, '…y la de la puntuación, al ritmo del aro (`cinematic`)');
p = planDeCifra(420, 465.5, { modo: 'cuenta', ctx: NORMAL });
ok(p.decimales === 1, '420 € → 465,5 €: la precisión es la del más preciso de los dos');
p = planDeCifra(37, 42, { modo: 'cuenta', ctx: REDUCIDO });
ok(p.tipo === 'relevo' && p.clase === 'cifra-sube', '🚨 en Reducido una cuenta se vuelve relevo: el valor nuevo ya está y llega con un fundido');
p = planDeCifra(5, 4, { ctx: NORMAL });
ok(p.tipo === 'relevo' && p.direccion === -1 && p.clase === 'cifra-baja', '5 tareas → 4: se releva desde arriba, porque BAJA (apartado 6: sin colores ni sustos)');
ok(planDeCifra(-3, -1.5, { modo: 'cuenta', ctx: NORMAL }).direccion === 1, 'los negativos también: de −3 a −1,5 sube');
ok(decimalesDe(1850) === 0 && decimalesDe(12.5) === 1 && decimalesDe(0.125) === 3 && decimalesDe(1e21) === 0 && decimalesDe(0.1 + 0.2) === 6 && decimalesDe(null) === 0,
  'los decimales se leen del número, con un tope (0,1 + 0,2 no pide diecisiete)');
ok(interpolarCifra(88, 100, 0, 2) === 88 && interpolarCifra(88, 100, 1, 2) === 100 && interpolarCifra(88, 100, 0.5, 2) === 94,
  'la cuenta empieza en el valor de antes y acaba EXACTAMENTE en el nuevo');
ok(interpolarCifra(420, 465, 0.33, 0) === Math.round(420 + 45 * 0.33) && Number.isInteger(interpolarCifra(1, 1000000, 0.37, 0)),
  '…con la precisión de la cifra: un entero no pasa por 434,85');
ok(interpolarCifra(-3, -1.5, 0.5, 2) === -2.25, '…y con negativos');
ok(curvaDeCuenta(0) === 0 && curvaDeCuenta(1) === 1 && curvaDeCuenta(0.5) > 0.5 && curvaDeCuenta(2) === 1,
  'la curva arranca deprisa y se posa (la `standard` de JosStyle, aproximada)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. El presupuesto: no veinte cuentas a la vez (apartados 38-39) ──');

ok(cuentasActivas() === 0, 'empieza sin ninguna');
const turnos = Array.from({ length: CUENTAS_A_LA_VEZ + 2 }, () => reservarCuenta());
ok(turnos.filter(Boolean).length === CUENTAS_A_LA_VEZ && turnos.slice(-2).every((x) => x === false),
  `🚨 como mucho ${CUENTAS_A_LA_VEZ} cifras cuentan a la vez; las demás se relevan`);
ok(planDeCifra(1, 2, { modo: 'cuenta', ctx: NORMAL, hayTurno: false }).tipo === 'relevo', '…y una cifra sin turno se releva');
for (let i = 0; i < CUENTAS_A_LA_VEZ + 3; i += 1) liberarCuenta();
ok(cuentasActivas() === 0, '…y liberar de más no deja la cuenta en negativo');
ok(JERARQUIA_DATOS_F4.length >= 4 && JERARQUIA_DATOS_F4.some((j) => /Cuenta/.test(j.como)) && JERARQUIA_DATOS_F4.some((j) => /Relevo/.test(j.como)),
  'la jerarquía dice qué cuenta y qué se releva (apartado 30)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. `CifraQueCambia`, el CSS y dónde está ──');

const cifra = COMP.slice(COMP.indexOf('export function CifraQueCambia'));
ok(/planDeCifra\(desde, valor/.test(cifra) && /reservarCuenta\(\)/.test(cifra) && /liberarCuenta\(\)/.test(cifra), 'la pieza decide con `planDeCifra` y respeta el presupuesto');
ok(/children !== undefined \? children/.test(cifra), '🚨 al acabar pinta EXACTAMENTE `children`: el formato final no depende de la cuenta (lo lee VoiceOver y lo lee una prueba)');
ok(/cancelAnimationFrame/.test(cifra), '…y una cuenta interrumpida se cancela y suelta su turno');
ok(/\.cifra\s*\{[^}]*display:\s*inline-block[^}]*font-variant-numeric:\s*tabular-nums/.test(CSS_LIMPIO),
  'una cifra es `inline-block` (para que el desplazamiento exista) y TABULAR (contando, no baila el ancho)');
ok(/@keyframes cifraSube\s*\{\s*from\s*\{\s*opacity:\s*var\(--motion-opac-secondary\);\s*transform:\s*translateY\(var\(--motion-dist-micro\)\)/.test(CSS_LIMPIO)
  && /@keyframes cifraBaja\s*\{\s*from\s*\{[^}]*translateY\(calc\(-1 \* var\(--motion-dist-micro\)\)\)/.test(CSS_LIMPIO),
  'sube desde abajo y baja desde arriba, con tokens (en Reducido la distancia es 0: solo el fundido)');
ok(/\.cifra-sube\s*\{[^}]*cifraSube var\(--motion-dur-normal\)[^;]*backwards/.test(CSS_LIMPIO) && /\.cifra-baja\s*\{[^}]*backwards/.test(CSS_LIMPIO),
  '…en `normal`, que es el preset `dataChange` del motor, y con `backwards` (F3)');
ok(PRESETS_MOTION.dataChange.duracion === 'normal' && PRESETS_MOTION.dataChange.desde.y === 'micro', '…y el preset dice lo mismo');
const usos = [
  ['src/views/DashboardView.jsx', /<CifraQueCambia valor=\{puntuacion\.valor\} modo="cuenta" duracion="cinematic">/, 'la puntuación del día cuenta al ritmo de su aro'],
  ['src/views/DashboardView.jsx', /<CifraQueCambia valor=\{progreso\.porcentaje\} modo="cuenta">/, 'el porcentaje de Hoy cuenta'],
  ['src/views/DashboardView.jsx', /<CifraQueCambia valor=\{progreso\.hechos\}>/, '«2/3 hechos» se releva'],
  ['src/views/NutritionView.jsx', /<CifraQueCambia valor=\{dato\.consumido\} modo="cuenta"/, 'las calorías y los macros de Nutrición cuentan (MS F17: al ritmo de su barra)'],
  ['src/views/FinanceView.jsx', /<CifraQueCambia valor=\{saldo\} modo="cuenta" formato=\{\(v\) => v\.toFixed\(2\)\}>\{saldo\.toFixed\(2\)\}<\/CifraQueCambia>/, 'el saldo cuenta con sus dos decimales'],
];
usos.forEach(([f, re, msg]) => ok(re.test(VISTAS[f]), msg));

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Vacíos, periodos y lo que no es de la F4 ──');

ok(/\.vacio-entra\s*\{[^}]*vacioEntra var\(--motion-dur-fast\)[^;]*backwards/.test(CSS_LIMPIO), 'un vacío entra en `fast`, sin ser protagonista (apartado 14)');
ok(/className="vacio-entra /.test(leer('src/components/ui.jsx')), '…y lo lleva `EmptyHint`, el vacío de toda la aplicación');
const PROG = VISTAS['src/views/ProgresoView.jsx'];
ok(/<CambioDeContenido clave=\{`\$\{rango\}·\$\{metrica \|\| d\.metrica\}`\} className="mt-3">\s*<GraficaProgreso/.test(PROG),
  'la gráfica de un ejercicio se funde al cambiar de periodo o de métrica: un cambio de datos, no de página (apartados 22 y 28)');
ok(/<CambioDeContenido clave=\{periodo\} className="space-y-2">/.test(PROG), '…y la lista de músculos, al cambiar de periodo');
['cifra-sube', 'cifra-baja', 'vacio-entra'].forEach((c) => ok(MOTION_MAP.some((e) => e.clase === c && e.fase === 4), `\`${c}\` está en el MOTION_MAP (F4)`));
ok(a.sinMapa.length === 0 && a.keyframesHuerfanos.length === 0 && a.mapaSinCss.length === 0 && a.curvasAjenas.length === 0 && a.deudaQueCrece.length === 0,
  `🚨 la auditoría de la F0 sigue limpia (${JSON.stringify({ sinMapa: a.sinMapa.length, huerfanos: a.keyframesHuerfanos, sinCss: a.mapaSinCss, deuda: a.deudaQueCrece })})`);
['Gráficas', 'Cifras', 'Barras', 'vacíos', 'Carga', 'Listas', 'Búsqueda', 'estado', 'Calendarios', 'Sincronización'].forEach((k) => {
  ok(AUDITORIA_F4.some((x) => x.que.includes(k) && x.hay && x.queda), `la auditoría del apartado 1 cubre «${k}»`);
});
ok(NO_EN_F4.some((x) => /F10/.test(x.porque)) && NO_EN_F4.some((x) => /F17/.test(x.porque)) && NO_EN_F4.some((x) => /F16/.test(x.porque)),
  'lo que no es de la F4 dice de quién es: las listas (F10), todas las cifras (F17) y la sincronización (F16)');
ok(HALLAZGOS_F0.find((h) => h.id === 'cifras_de_golpe')?.fase === 17 && !HALLAZGOS_F0.find((h) => h.id === 'cifras_de_golpe').resuelto,
  '⚠️ `cifras_de_golpe` sigue siendo de la F17: la F4 deja el sistema y las cifras principales, no las cierra todas');
/* Ninguna cifra cuenta al montar: el texto de una cuenta solo existe DESPUÉS de un cambio. */
ok(/useRef\(valor\)/.test(cifra) && /previo\.current = valor/.test(cifra), 'lo de antes se recuerda desde el primer pintado, así que al aparecer no hay nada que contar');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. La documentación ──');

const SIS = leer('docs/MOTION_SYSTEM.md');
ok(/CifraQueCambia/.test(SIS) && /useAnimacionDeGrafica/.test(SIS) && /vacio-entra/.test(SIS), 'MOTION_SYSTEM.md dice cuándo usar cada pieza de la F4');
ok(/\*\*F4\*\* ✅/.test(leer('docs/13_MOTION_SYSTEM_ORDEN.md')), 'el índice de fases marca la F4');
ok(/C-55/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), 'C-55 está escrita');

console.log(`\n${mal === 0 ? '\x1b[32m' : '\x1b[31m'}${ok_} de ${ok_ + mal} comprobaciones en verde\x1b[0m`);
if (mal > 0) { console.log(`\x1b[31m✗ ${mal} de ${ok_ + mal} comprobaciones han fallado\x1b[0m`); process.exit(1); }
