// ============================================================================
// ENTREGA 3 · FASE 2 — RACHAS: MANTENIMIENTO DIARIO Y FEEDBACK DE RECOMPENSA
//
// Las trece condiciones del criterio final de aceptación, más las trampas que
// esta fase podía pisar:
//
//   · que el bloque **no aparezca** sin rachas activas (apartado 2) — y que
//     devuelva `null`, no un objeto con ceros, que es lo que acaba pintando
//     "0 por mantener hoy" todos los días (la lección de EH F25);
//   · que **no se dupliquen registros** (apartado 10): esta capa no escribe;
//   · que **no exista un "sumar racha"** independiente (apartado 9);
//   · que la lógica de rachas siga siendo la de RA F1 (apartado 12).
// ============================================================================

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mantenimientoHoy, textoMantenimiento, feedbackDeSubida, DURACION_FEEDBACK_MS, TEXTOS_MANTENIMIENTO } from '../src/lib/rachasHoy.js';
import { crearRacha, registrarCumplimiento } from '../src/lib/rachas.js';

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} — esperado ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`);

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const HOY = '2026-09-04';
const AYER = '2026-09-03';

// Un estado de rachas con `n` definiciones, y los cumplimientos que se le pidan.
function estado(nombres, cumplidos = []) {
  const definiciones = nombres.map((nombre, i) => ({ ...crearRacha({ nombre, hoy: HOY }), id: `r${i}` }));
  let eventos = [];
  for (const { i, fecha } of cumplidos) eventos = registrarCumplimiento(eventos, { rachaId: `r${i}`, fecha });
  return { definiciones, eventos };
}

console.log('\n═══ 1. CUÁNTAS HAY QUE MANTENER HOY (apartados 1, 4 y 5) ═══\n');

// Test 1 — sin ninguna racha, el bloque no existe (apartado 2).
eq(mantenimientoHoy({ definiciones: [], eventos: [] }, [], HOY), null,
  '🚨 sin rachas activas devuelve null: el bloque NO se pinta (apartado 2)');
eq(mantenimientoHoy(null, null, HOY), null, 'y sin nada guardado, igual');

// Test 2 — tres rachas sin registrar hoy.
const tres = mantenimientoHoy(estado(['Agua', 'Leer', 'Estirar']), [], HOY);
ok(!!tres, 'con tres rachas activas, el bloque existe');
eq(tres.total, 3, 'las cuenta todas');
eq(tres.pendientes, 3, 'y las tres están pendientes');
eq(tres.completadas, 0, 'ninguna completada todavía');
eq(tres.todoHecho, false, 'así que no está todo hecho');

// Test 3 — los dos textos del apartado 5.
eq(textoMantenimiento(tres), { titulo: TEXTOS_MANTENIMIENTO.pendiente, detalle: '3 rachas necesitan registro' },
  '🚨 el estado Pendiente dice "Mantén tus rachas · 3 rachas necesitan registro"');

const todasHechas = mantenimientoHoy(
  estado(['Agua', 'Leer', 'Estirar'], [{ i: 0, fecha: HOY }, { i: 1, fecha: HOY }, { i: 2, fecha: HOY }]),
  [], HOY,
);
eq(todasHechas.todoHecho, true, 'con las tres registradas, está todo hecho');
eq(textoMantenimiento(todasHechas), { titulo: TEXTOS_MANTENIMIENTO.completado, detalle: '3/3 completadas' },
  '🚨 y el estado Completado dice "Rachas mantenidas · 3/3 completadas"');

// Test 4 — una sola, en singular. Un "1 rachas necesitan" delata que nadie lo miró.
const una = mantenimientoHoy(estado(['Agua']), [], HOY);
eq(textoMantenimiento(una).detalle, '1 racha necesita registro', '⚠️ una sola va en singular');

// Test 5 — mezcla.
const mezcla = mantenimientoHoy(estado(['Agua', 'Leer'], [{ i: 0, fecha: HOY }]), [], HOY);
eq([mezcla.pendientes, mezcla.completadas], [1, 1], 'con una hecha y otra no, cuenta las dos por separado');
eq(mezcla.nombresPendientes, ['Leer'], 'y sabe cuál falta (apartado: "el bloque indica qué rachas necesitan mantenimiento")');

// Test 6 — los hábitos de Productividad cuentan (apartados 9 y 10).
const conHabito = mantenimientoHoy(
  estado(['Agua']),
  [{ id: 'h1', nombre: 'Estudiar', historial: {} }],
  HOY,
);
eq(conHabito.total, 2, '⚠️ un hábito de Productividad es una racha que mantener: cuenta igual');
ok(conHabito.lista.some((r) => r.origen === 'habito'), 'y se sabe de dónde viene cada una');

// Test 7 — un hábito ya registrado hoy NO se vuelve a pedir (apartado 10).
const habitoHecho = mantenimientoHoy({ definiciones: [], eventos: [] }, [{ id: 'h1', nombre: 'Estudiar', historial: { [HOY]: true } }], HOY);
eq([habitoHecho.pendientes, habitoHecho.completadas], [0, 1],
  '🚨 registrar el hábito en Hábitos YA mantiene su racha: no se pide dos veces (apartado 10)');

// Test 8 — lo de ayer no se arrastra a hoy.
const soloAyer = mantenimientoHoy(estado(['Agua'], [{ i: 0, fecha: AYER }]), [], HOY);
eq(soloAyer.pendientes, 1, 'lo cumplido ayer no cuenta como cumplido hoy');

console.log('\n═══ 2. EL FEEDBACK DE SUBIR (apartados 6, 7 y 8) ═══\n');

eq(feedbackDeSubida(6, 7), { dias: 7, subida: 1, texto: '+1', textoDias: '7 días' },
  '🚨 de 6 a 7 días sale "🔥 7 días +1"');
eq(feedbackDeSubida(0, 1).textoDias, '1 día', '⚠️ el primer día va en singular');
eq(feedbackDeSubida(7, 7), null, 'sin subida no se celebra nada');
eq(feedbackDeSubida(7, 6), null, 'y bajar tampoco es una celebración');
eq(feedbackDeSubida(null, 3), null,
  '🚨 `null` NO es cero: sin saber cómo estaba antes no hay subida que celebrar (EH F32)');
eq(feedbackDeSubida(undefined, 3), null, 'y sin dato, igual');
ok(DURACION_FEEDBACK_MS <= 1000,
  '⚠️ dura menos de un segundo: el apartado 7 pide expresamente que NO sea larga');

console.log('\n═══ 3. LO QUE ESTA FASE NO PUEDE HACER (apartados 9, 10 y 12) ═══\n');

const LIB = readFileSync(join(RAIZ, 'src/lib/rachasHoy.js'), 'utf8');
const soloCodigo = LIB.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

ok(!/\bexport function (sumar|incrementar|marcar|completar|registrar)/i.test(soloCodigo),
  '🚨 NO existe una función que sume un día: la racha es consecuencia del registro real (apartado 9)');
for (const escribe of ['completarDia', 'registrarCumplimiento', 'saveData']) {
  ok(!new RegExp(`\\b${escribe}\\s*\\(`).test(soloCodigo),
    `⚠️ esta capa no llama a \`${escribe}\`: solo lee (apartado 10, no duplicar registros)`);
}
ok(/panelRachas|panelHabitos/.test(soloCodigo),
  '⚠️ los números salen de los paneles que ya existen (RA F1 y RA F4), no de un cálculo nuevo (apartado 12)');
ok(!/rachaActual|historialDeRachas|estadoDeDia\s*\(/.test(soloCodigo),
  '🚨 y no recalcula rachas por su cuenta: eso sería el segundo sistema que el contexto prohíbe');

// D2-02: no sobregamificar. Ni puntos, ni niveles, ni monedas.
for (const palabra of ['xp', 'nivel', 'moneda', 'punto', 'medalla']) {
  ok(!new RegExp(`\\b${palabra}`, 'i').test(soloCodigo),
    `⚠️ ni una \`${palabra}\` (D2-02: no sobregamificar)`);
}

console.log('\n═══ 4. EN LA PANTALLA ═══\n');

const VISTA = readFileSync(join(RAIZ, 'src/views/RachasView.jsx'), 'utf8');
const CSS = readFileSync(join(RAIZ, 'src/index.css'), 'utf8');
const DASH = readFileSync(join(RAIZ, 'src/views/DashboardView.jsx'), 'utf8');

ok(/mantenimientoHoy/.test(VISTA) && /textoMantenimiento/.test(VISTA),
  'el bloque de Hoy usa la capa de esta fase');
ok(/<ResumenRachaHoy/.test(DASH),
  '⚠️ y sigue siendo UN bloque en el Dashboard, no dos: no se ha creado una segunda tarjeta de rachas');
ok(/onAbrir=\{\(\) => onNavegar && onNavegar\('rachas'\)\}/.test(DASH),
  '🚨 pulsarlo lleva directo a Rachas, sin pantalla intermedia (apartado 3)');

for (const clase of ['fuego-sube', 'racha-mas-uno']) {
  ok(new RegExp(`\\.${clase}\\s*\\{`).test(CSS), `la animación \`${clase}\` existe en index.css`);
  ok(new RegExp(`className="[^"]*${clase}`).test(VISTA), `y la pantalla la usa`);
}
ok(/animation: fuegoSube \d+ms/.test(CSS) && Number((CSS.match(/animation: fuegoSube (\d+)ms/) || [])[1]) <= 1000,
  '⚠️ el pulso del fuego dura menos de un segundo (apartado 7)');

// ⚠️ Regla 4 del proyecto: todos los hooks antes de cualquier `return` condicional.
// RachasView tiene un `return` para el estado vacío, y el `useEffect` del feedback
// va por encima. Ya se produjo una vez el "Rendered more hooks than during the
// previous render" por esto exacto.
const cuerpo = VISTA.slice(VISTA.indexOf('export default function RachasView'));
const iEfecto = cuerpo.indexOf('useEffect(');
const iReturn = cuerpo.indexOf('if (!todas.length');
ok(iEfecto !== -1 && iReturn !== -1 && iEfecto < iReturn,
  '🚨 el useEffect del feedback va ANTES del return del estado vacío (regla 4)');

// El resto del apartado Rachas sigue intacto (apartado 12).
for (const pieza of ['CalendarioRacha', 'TarjetaRacha', 'BarraHito', 'panelGamificacion']) {
  ok(VISTA.includes(pieza), `⚠️ \`${pieza}\` sigue en su sitio: el apartado Rachas no se ha rediseñado (apartado 12)`);
}

// Y ninguna vista se ha puesto a reproducir sonido ni a escribir rachas por su cuenta.
const vistas = readdirSync(join(RAIZ, 'src/views')).filter((f) => f.endsWith('.jsx'));
const conNewAudio = vistas.filter((f) => /new Audio\s*\(/.test(readFileSync(join(RAIZ, 'src/views', f), 'utf8')));
eq(conNewAudio, [], '⚠️ ninguna pantalla reproduce sonido por su cuenta (SO F1: el motor es el único)');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
