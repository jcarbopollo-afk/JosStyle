/* ===========================================================================
   CORRECCIONES A1–A4 — los cuatro fallos que encontró la auditoría de la fase 3
   ===========================================================================
   Uso:  node --import ./scripts/resolver-vite.mjs scripts/test-correcciones-a1-a4.mjs

   · A1 — `calcularEdad` con una fecha que falta o no vale (helpers.js) y quien la usa.
   · A2 — el 99,6 % de la hucha se pintaba como 100 % (hucha.js).
   · A3 — la hucha solo suma: ni aportaciones negativas ni un total por debajo de 0.
   · A4 — una escritura vieja que termina DESPUÉS de una nueva dejaba la cuenta con
     el valor viejo, sin nada pendiente (sincronizacion.js + supabase.js).

   ⚠️ A4 se prueba con el `saveData` DE VERDAD, no con las funciones sueltas: un
   cargador cambia `import.meta.env` (que solo existe con Vite) en `supabase.js`, y el
   cliente se sustituye por un servidor simulado con la semántica del `upsert` de
   `app_data` —gana la escritura que se APLICA la última—. Cada petición se resuelve
   cuando la prueba lo dice: el orden es determinista, no una carrera de relojes.
   El tope de la cola (10 s) es el de verdad, así que esta suite tarda unos segundos.
   =========================================================================== */
import { register } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const leer = (rel) => readFileSync(join(RAIZ, rel), 'utf8');

const CARGADOR = `export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  if (url.endsWith('/lib/supabase.js')) {
    const src = String(r.source).replace(/import\\.meta\\.env/g, "({ VITE_SUPABASE_URL: 'http://127.0.0.1:9', VITE_SUPABASE_ANON_KEY: 'prueba' })");
    return { ...r, source: src, shortCircuit: true };
  }
  return r;
}`;
register('data:text/javascript,' + encodeURIComponent(CARGADOR));

/* `A5_SRC=<dir>` carga las librerías de otra carpeta: así se demuestra que la suite FALLA con versiones
   defectuosas (las vistas se siguen leyendo del proyecto). */
const LIB = process.env.A5_SRC ? join(process.env.A5_SRC, 'lib') : join(RAIZ, 'src/lib');
const { calcularEdad } = await import(join(LIB, 'helpers.js'));
const H = await import(join(LIB, 'hucha.js'));
const Y = await import(join(LIB, 'sincronizacion.js'));
const S = await import(join(LIB, 'supabase.js'));

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };
/* A5 (P1) — JSON.stringify(NaN) es 'null': un `eq` por JSON daba por bueno un NaN donde se esperaba null, y el
   caso principal de A1 («NaN años») salía verde con el código de antes. Ahora NaN, ±Infinity y undefined se
   escriben con su nombre, así que nunca se confunden con null. */
const serial = (x) => JSON.stringify(x, (_, v) => (typeof v === 'number' && !Number.isFinite(v) ? `‹${v}›` : v === undefined ? '‹undefined›' : v)) ?? '‹undefined›';
const eq = (a, b, m) => ok(serial(a) === serial(b), `${m} — esperado ${serial(b)}, salió ${serial(a)}`);
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/* ─────────────────────────────────────────────────────────────────────────
   A1 · LA EDAD
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n── A1 · calcularEdad y quien la usa ──');
const HOY = new Date(2026, 9, 10); // 10 de octubre de 2026, en local
for (const [v, nombre] of [[null, 'null'], [undefined, 'undefined'], ['', 'vacía'], ['   ', 'espacios'], ['abc', 'texto'],
  ['2010-13-45', 'mes imposible'], ['2010-02-30', '30 de febrero'], [20100729, 'un número'], ['2030-01-01', 'futura']]) {
  eq(calcularEdad(v, HOY), null, `🚨 A1 — fecha de nacimiento ${nombre}: null, nunca NaN ni una edad de 1970`);
}
eq(calcularEdad('2010-07-29', HOY), 16, 'A1 — cumpleaños ya cumplido este año: 16');
eq(calcularEdad('2010-10-10', HOY), 16, 'A1 — cumple HOY: ya cuenta');
eq(calcularEdad('2010-10-11', HOY), 15, 'A1 — cumple MAÑANA: todavía 15');
eq(calcularEdad('2010-12-31', HOY), 15, 'A1 — cumple a final de año: todavía 15');
eq(calcularEdad('2026-10-10', HOY), 0, 'A1 — nacido hoy: 0, no null');
eq(calcularEdad('2008-02-29', new Date(2026, 1, 28)), 17, 'A1 — nacido un 29 de febrero, el 28 de febrero de un año no bisiesto: 17');
eq(calcularEdad('2008-02-29', new Date(2026, 2, 1)), 18, '…y el 1 de marzo: 18');
ok(typeof calcularEdad('2010-07-29') === 'number', 'A1 — sin `hoy` sigue usando el reloj, como hacían los dos que la llaman');
/* La fecha se lee en LOCAL: en un huso negativo, `new Date('2010-10-11')` es el día 10. */
const enNuevaYork = spawnSync(process.execPath, ['--import', './scripts/resolver-vite.mjs', '--input-type=module', '-e',
  `import { calcularEdad } from ${JSON.stringify(pathToFileURL(join(LIB, 'helpers.js')).href)}; console.log(calcularEdad('2010-10-11', new Date(2026, 9, 10, 12)));`],
{ cwd: RAIZ, env: { ...process.env, TZ: 'America/New_York' }, encoding: 'utf8' });
eq(enNuevaYork.stdout.trim(), '15', '🚨 A1 — en un huso negativo (Nueva York) el cumpleaños de mañana NO cuenta hoy (lección de UTC)');

const AJUSTES = sinComentarios(leer('src/views/SettingsView.jsx'));
ok(/const bmr = edad === null \? null :/.test(AJUSTES) && /const tdee = bmr === null \? null :/.test(AJUSTES),
  'A1 — Ajustes: sin edad no se calcula ni el BMR ni el TDEE (null, no NaN)');
ok(/edad === null \? '—' : `\$\{edad\} años`/.test(AJUSTES) && /bmr === null \? '—' : Math\.round\(bmr\)/.test(AJUSTES)
  && /tdee === null \? '—' : Math\.round\(tdee\)/.test(AJUSTES) && /edad === null \? '—' : edad/.test(AJUSTES),
  'A1 — …y lo que no está se pinta «—» en los cuatro sitios (campo, edad, BMR, TDEE)');
ok(!/\{edad\}<\/p>|\{Math\.round\(bmr\)\}<\/p>|\{Math\.round\(tdee\)\}<\/p>/.test(AJUSTES), 'A1 — ya no queda ninguno pintado sin su guarda');
const NUTRI = sinComentarios(leer('src/views/NutritionView.jsx'));
ok(/calcularEdad\(perfil\?\.fechaNacimiento\) === null \? '' :/.test(NUTRI),
  'A1 — Nutrición: una fecha inválida deja el campo de edad vacío (lo pide su validación), no la cadena «NaN»');
ok(!/String\(calcularEdad\([^)]*\)\)\s*:/.test(NUTRI.replace(/=== null \? '' : String\(calcularEdad\(perfil\.fechaNacimiento\)\)/, '')),
  '…y no queda otro String(calcularEdad(…)) sin guarda');

/* ─────────────────────────────────────────────────────────────────────────
   A2 · EL PORCENTAJE DE LA HUCHA
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n── A2 · el 100 % solo si se alcanzó ──');
const conObjetivo = (hucha, cantidad = 1000) => ({ saldoInicial: 0, hucha, movimientos: [], aportaciones: [], objetivoHucha: { cantidad, porPeriodo: null, frecuencia: 'semana' } });
const LLENA = '█'.repeat(H.LARGO_BARRA);
for (const ahorrado of [996, 999, 999.99, 995, 960]) {
  const p = H.panelHucha(conObjetivo(ahorrado));
  ok(p.porcentaje < 100 && p.estado === H.ESTADOS_HUCHA.EN_CURSO && p.detalle === null && p.barra !== LLENA,
    `🚨 A2 — ${ahorrado} de 1000: ${p.porcentaje} %, en curso, sin «Objetivo alcanzado» y la barra NO llena (${p.barra})`);
}
eq(H.panelHucha(conObjetivo(996)).porcentaje, 99, 'A2 — 996 de 1000 es 99 %');
const mil = H.panelHucha(conObjetivo(1000));
ok(mil.porcentaje === 100 && mil.estado === H.ESTADOS_HUCHA.ALCANZADO && mil.detalle === 'Objetivo alcanzado' && mil.barra === LLENA,
  'A2 — 1000 de 1000: 100 %, alcanzado, con su frase y la barra llena');
const masDeMil = H.panelHucha(conObjetivo(1250));
ok(masDeMil.porcentaje === 100 && masDeMil.estado === H.ESTADOS_HUCHA.ALCANZADO, 'A2 — pasarse sigue siendo 100 % y alcanzado (como antes)');
eq(H.panelHucha(conObjetivo(57, 100)).porcentaje, 57, 'A2 — 57 de 100 es 57 % (sin la trampa de coma flotante de 57/100*100)');
eq(H.panelHucha(conObjetivo(125, 500)).porcentaje, 25, 'A2 — los casos de siempre no cambian (125 de 500 = 25 %)');
const cero = H.panelHucha(conObjetivo(0));
ok(cero.porcentaje === 0 && cero.barra === '░'.repeat(H.LARGO_BARRA) && cero.estado === H.ESTADOS_HUCHA.EN_CURSO, 'A2 — sin ahorro: 0 %, barra vacía, en curso');
const negativoViejo = H.panelHucha(conObjetivo(-50));
ok(negativoViejo.porcentaje === 0 && negativoViejo.barra === '░'.repeat(H.LARGO_BARRA),
  'A2 — un total negativo guardado de antes no se pinta como «-5 %»: 0 % y la barra vacía');
for (const [cantidad, nombre] of [[null, 'sin objetivo'], [0, 'objetivo 0'], [-10, 'objetivo negativo'], ['abc', 'objetivo que no es un número']]) {
  const p = H.panelHucha({ hucha: 50, objetivoHucha: { cantidad } });
  ok(p.estado === H.ESTADOS_HUCHA.SIN_OBJETIVO && p.porcentaje === null && p.barra === null, `A2 — ${nombre}: sin objetivo, sin porcentaje ni barra (como antes)`);
}
eq([H.barraDeProgreso(96) === LLENA, H.barraDeProgreso(99) === LLENA, H.barraDeProgreso(100) === LLENA], [false, false, true],
  'A2 — la barra solo se llena al 100 %');
/* Y la invariante: 100 % ⇔ alcanzado ⇔ barra llena, en una tabla de casos. */
const coherente = [0, 1, 250, 499.99, 500, 950, 995, 996, 999.99, 1000, 1000.01, 2000].every((a) => {
  const p = H.panelHucha(conObjetivo(a));
  const alcanzado = p.estado === H.ESTADOS_HUCHA.ALCANZADO;
  return (p.porcentaje === 100) === alcanzado && (p.barra === LLENA) === alcanzado && (p.detalle === 'Objetivo alcanzado') === alcanzado;
});
ok(coherente, '🚨 A2 — en todos los casos: porcentaje 100 ⇔ estado alcanzado ⇔ barra llena ⇔ «Objetivo alcanzado»');
/* La coma flotante (revisión adversarial): 0,57 × 100 es 56,99…, y truncar quitaba un punto entero. */
eq([H.panelHucha(conObjetivo(0.57, 1)).porcentaje, H.panelHucha(conObjetivo(2.55, 5)).porcentaje, H.panelHucha(conObjetivo(0.29, 1)).porcentaje],
  [57, 51, 29], '🚨 A2 — 0,57 de 1 € es 57 %, 2,55 de 5 € es 51 % y 0,29 de 1 € es 29 % (la cuenta va en céntimos enteros)');
let barridoMal = 0;
for (let c = 1; c <= 20; c++) for (let x = 0; x < c * 100; x++) if (H.panelHucha(conObjetivo(x / 100, c)).porcentaje !== Math.min(99, Math.floor(x / c))) barridoMal++;
eq(barridoMal, 0, 'A2 — todos los importes en céntimos contra objetivos de 1 a 20 €: el porcentaje truncado exacto');
ok([[0, 0.004], [0.001, 0.004]].every(([a, c]) => { const p = H.panelHucha(conObjetivo(a, c)); return p.estado === H.ESTADOS_HUCHA.SIN_OBJETIVO && p.porcentaje === null && !/NaN/.test(p.titulo); }),
  'A2/A5 — un objetivo por debajo del céntimo no es un objetivo: «sin objetivo», nunca 0/0 ni «NaN %»');
/* A5 — lo guardado con más decimales se lee al céntimo, igual en el título, el porcentaje y «alcanzado». */
{
  const p = H.panelHucha(conObjetivo(999.999, 1000));
  ok(p.titulo === '1000.00 € / 1000.00 €' && p.porcentaje === 100 && p.detalle === 'Objetivo alcanzado',
    `🚨 A5 — 999,999 € guardados con objetivo 1000: «1000.00 € / 1000.00 €» al 100 % y alcanzado, nunca al 99 % (${p.titulo}, ${p.porcentaje} %)`);
}

/* ─────────────────────────────────────────────────────────────────────────
   A3 · LA HUCHA SOLO SUMA
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n── A3 · solo aportaciones ──');
const base = (extra = {}) => ({ saldoInicial: 0, hucha: 100, movimientos: [], aportaciones: [], ...extra });
const tras = H.anadirAhorro(base(), 25, '2026-10-10');
ok(tras.hucha === 125 && tras.aportaciones.length === 1 && tras.aportaciones[0].cantidad === 25, 'A3 — una aportación positiva suma y se apunta');
for (const [v, nombre] of [[0, 'cero'], [-50, 'negativa'], [-0.01, 'un céntimo negativo'], [null, 'null'], [undefined, 'undefined'], ['', 'vacía'],
  ['abc', 'texto'], [NaN, 'NaN'], [Infinity, 'Infinity'], [-Infinity, '-Infinity']]) {
  const e = base();
  const r = H.anadirAhorro(e, v, '2026-10-10');
  ok(r === e && r.hucha === 100 && r.aportaciones.length === 0, `🚨 A3 — una aportación ${nombre} no se apunta ni cambia el total`);
}
eq(H.anadirAhorro(base(), '12.5', '2026-10-10').hucha, 112.5, 'A3 — lo que llega del campo como texto sigue valiendo si es positivo');
eq([H.cantidadValida(5), H.cantidadValida('0.01'), H.cantidadValida(0), H.cantidadValida(-1), H.cantidadValida(''), H.cantidadValida(null)],
  [true, true, false, false, false, false], 'A3 — cantidadValida: mayor que 0 y número');
/* Por debajo del céntimo (revisión adversarial): el total no sumaba y el historial sí la apuntaba. A5: lo
   escrito se lleva al céntimo UNA vez (la mitad hacia arriba): 0,004 → 0 (no vale), 0,005 → 0,01 (vale). */
eq([H.cantidadValida('0.004'), H.cantidadValida(0.001), H.cantidadValida('0.005')], [false, false, true], '🚨 A3/A5 — una aportación es de al menos un céntimo, contada al céntimo');
let micro = {}; for (let i = 0; i < 300; i++) micro = H.anadirAhorro(micro, '0.004', '2026-09-03');
ok(H.normalizarEconomiaHucha(micro).hucha === 0 && H.normalizarEconomiaHucha(micro).aportaciones.length === 0,
  '🚨 A3 — 300 aportaciones de 0,004 € no se apuntan: el historial no dice 1,20 € con el total en 0');
const redondo = H.anadirAhorro({}, '12.345', '2026-09-03');
ok(redondo.hucha === 12.35 && redondo.aportaciones[0].cantidad === 12.35, 'A3 — se guarda la misma cifra en céntimos en el total y en el historial (12,35)');
/* 🐛 A5 — la coma flotante: 1,005 × 100 = 100,4999…, y redondear a secas daba 1,00 €. */
eq([H.anadirAhorro({}, '1.005', 'x').hucha, H.anadirAhorro({}, '0.005', 'x').hucha, H.anadirAhorro({}, '2.675', 'x').hucha, H.anadirAhorro({}, '1.015', 'x').hucha],
  [1.01, 0.01, 2.68, 1.02], '🚨 A5 — 1,005 → 1,01; 0,005 → 0,01; 2,675 → 2,68; 1,015 → 1,02 (la mitad hacia arriba, sin el error de la coma flotante)');
{
  const d = H.anadirAhorro({ hucha: 0.1, aportaciones: [] }, '0.2', 'x');
  ok(d.hucha === 0.3 && d.aportaciones[0].cantidad === 0.2, `A5 — 0,1 + 0,2 da 0,3 exacto en el total (${d.hucha})`);
}
/* 🐛 A5 — el desbordamiento: 1e307 pasaba la validación, el total llegaba a Infinity, JSON lo escribía como
   null y al recargar se perdían los ahorros. */
{
  const base120 = { hucha: 120, aportaciones: [{ id: 'a', fecha: '2026-09-01', cantidad: 120 }] };
  const r = H.anadirAhorro(base120, '1e307', 'x');
  ok(r === base120 && H.cantidadValida('1e307') === false && H.motivoAportacion(base120, '1e307') === H.MOTIVOS_HUCHA.maximo,
    '🚨 A5 — 1e307 € no se apunta (fuera del máximo) y se dice por qué: los 120 € no se tocan');
  const casi = { hucha: 999999999.99, aportaciones: [] };
  ok(H.anadirAhorro(casi, '0.01', 'x').hucha === 1000000000 && H.anadirAhorro(casi, '0.02', 'x') === casi && H.motivoAportacion(casi, '0.02') === H.MOTIVOS_HUCHA.maximo,
    'A5 — se puede llegar justo al máximo (1.000.000.000,00 €), no pasarse');
  const json = JSON.parse(JSON.stringify(H.anadirAhorro(casi, '0.01', 'x')));
  ok(Number.isFinite(json.hucha) && json.aportaciones.every((a) => Number.isFinite(a.cantidad)), 'A5 — lo que se guarda nunca lleva un número no finito (no se serializa como null)');
  ok(H.totalValido('1e10') === false && H.motivoTotal('1e10') === H.MOTIVOS_HUCHA.maximo && H.eurosDelTotal('1e10') === null, 'A5 — un total a mano fuera del máximo tampoco se guarda');
  ok(Number.isSafeInteger(H.HUCHA_MAX_CENTIMOS * 2), 'A5 — el máximo en céntimos, sumado dos veces, sigue siendo un entero seguro de JavaScript');
}
/* A5 — un número a medias no es un negativo (H6), y el total escrito se guarda al céntimo. */
eq([H.motivoTotal('', false), H.motivoTotal('', true), H.motivoTotal('-5'), H.motivoTotal('-0.004'), H.motivoTotal('abc'), H.motivoTotal('120.50')],
  [null, H.MOTIVOS_HUCHA.totalFormato, H.MOTIVOS_HUCHA.total, H.MOTIVOS_HUCHA.total, H.MOTIVOS_HUCHA.totalFormato, null],
  '🚨 A5 — total: vacío vale (0); a medias pide cifras; negativo dice negativo; texto pide cifras');
eq([H.eurosDelTotal(''), H.eurosDelTotal('999.999'), H.eurosDelTotal('1.005'), H.eurosDelTotal('-1')], [0, 1000, 1.01, null], 'A5 — el total escrito se guarda al céntimo, con la misma regla');
/* Revisión de A5 — lo que NO es un número decimal no vale, aunque `Number()` lo convierta (H2). */
eq(['0x10', [5], '  ', [], '5,5', true, {}].map((v) => H.centimosEscritos(v)), [null, null, null, null, null, null, null],
  '🚨 A5 — ni hexadecimal, ni listas, ni espacios, ni coma, ni booleanos: solo números y cadenas decimales');
eq([H.eurosDelTotal('  '), H.eurosDelTotal([]), H.cantidadValida('0x10')], [null, null, false], 'A5 — unos espacios o una lista no dejan el total a 0, y «0x10» no es una aportación de 16 €');
/* H3 — un total positivo de menos de un céntimo no se guarda como 0 sin decirlo. */
ok(H.motivoTotal('0.004') === H.MOTIVOS_HUCHA.totalCentimo && H.eurosDelTotal('0.004') === null, '🚨 A5 — 0,004 € en el total se dice («se cuenta al céntimo») en vez de dejarlo en 0 en silencio');
/* H1 — un total antiguo imposible (de antes de A5 se podía escribir 1e308) no da Infinity ni se reescribe. */
{
  ok(Number.isFinite(H.centimosGuardados(1e308)) && !/Infinity/.test(H.panelHucha({ hucha: 1e308, objetivoHucha: { cantidad: 1000 } }).titulo),
    '🚨 A5 — un total antiguo de 1e308 se acota para contar y pintar: nunca «Infinity»');
  const raro = { hucha: 1e307, aportaciones: [{ id: 'a', fecha: '2026-09-01', cantidad: 5 }] };
  ok(H.eliminarAportacion(raro, 'a').hucha === 1e307 && H.anadirAhorro(raro, '5', 'x') === raro,
    '🚨 A5 — y no se reescribe (ni al quitar ni al añadir): lo guardado no se toca y nada se guarda como null');
}
/* 🚨 A5 (auditoría final) — la hucha solo suma: el total escrito no puede BAJAR de lo guardado. */
eq([H.motivoTotal('10', false, 500), H.motivoTotal('', false, 500), H.motivoTotal('0', false, 500), H.motivoTotal('500', false, 500), H.motivoTotal('650', false, 500)],
  [H.MOTIVOS_HUCHA.totalBaja, H.MOTIVOS_HUCHA.totalBaja, H.MOTIVOS_HUCHA.totalBaja, null, null], '🚨 A5 — con 500 € guardados: ni 10, ni vacío, ni 0 (eso es retirar); 500 y 650 sí');
eq([H.eurosDelTotal('10', 500), H.eurosDelTotal('', 500), H.eurosDelTotal('650', 500)], [null, null, 650], 'A5 — y eurosDelTotal (lo que usa App.jsx) tampoco deja bajarlo');
{
  const e500 = { hucha: 500, aportaciones: [{ id: 'a', fecha: '2026-09-01', cantidad: 500 }] };
  ok(H.economiaPermitida(e500, H.anadirAhorro(e500, '20', '2026-09-02')) === true, 'A5 — economiaPermitida: añadir ahorro sí');
  ok(H.economiaPermitida(e500, { ...e500, hucha: 100 }) === false, '🚨 A5 — economiaPermitida: bajar el total NO (sin retiradas, aunque llegue por updateEconomia)');
  ok(H.economiaPermitida(e500, { ...e500, hucha: Infinity }) === false && H.economiaPermitida(e500, { ...e500, hucha: 1e300 }) === false, 'A5 — …ni un total infinito o fuera del máximo');
  ok(H.economiaPermitida(e500, { ...e500, hucha: 480, aportaciones: [...e500.aportaciones, { id: 'n', fecha: 'x', cantidad: -20 }] }) === false
    && H.economiaPermitida(e500, { ...e500, aportaciones: [...e500.aportaciones, { id: 'n', fecha: 'x', cantidad: 0.004 }] }) === false,
    'A5 — …ni una aportación nueva negativa o de menos de un céntimo');
  ok(H.economiaPermitida(e500, H.guardarObjetivoHucha(e500, { cantidad: '900', porPeriodo: '', frecuencia: 'mes' })) === true, 'A5 — guardar un objetivo (el total no cambia) sí');
}
/* A5 — un total antiguo imposible (negativo enorme) no se reescribe con una cifra inventada al aportar. */
{
  const raroNeg = { hucha: -1e308, aportaciones: [] };
  ok(H.anadirAhorro(raroNeg, '5', 'x') === raroNeg && H.motivoAportacion(raroNeg, '5') === H.MOTIVOS_HUCHA.totalInvalido, 'A5 — con un total guardado imposible no se aporta: se pide corregirlo');
}
ok(H.motivoObjetivo({ cantidad: '2000000000' }) === H.MOTIVOS_HUCHA.maximo, 'A5 — un objetivo por encima del máximo dice el del máximo');

/* A5 — un objetivo que no vale no se guarda en silencio como «sin objetivo». */
{
  const conObj = { hucha: 10, aportaciones: [], objetivoHucha: { cantidad: 500, porPeriodo: 50, frecuencia: 'semana' } };
  ok(H.guardarObjetivoHucha(conObj, { cantidad: '-3', porPeriodo: '', frecuencia: 'mes' }) === conObj && H.motivoObjetivo({ cantidad: '-3' }) === H.MOTIVOS_HUCHA.objetivo,
    '🚨 A5 — un objetivo negativo no borra el que había: no se escribe nada y se dice por qué');
  const g = H.guardarObjetivoHucha(conObj, { cantidad: '1000.004', porPeriodo: '12.345', frecuencia: 'mes' });
  ok(g.objetivoHucha.cantidad === 1000 && g.objetivoHucha.porPeriodo === 12.35, `A5 — un objetivo se guarda al céntimo (${g.objetivoHucha.cantidad}, ${g.objetivoHucha.porPeriodo})`);
  ok(H.guardarObjetivoHucha(conObj, { cantidad: '', porPeriodo: '', frecuencia: 'semana' }).objetivoHucha.cantidad === null, 'A5 — vaciar el objetivo sigue quitándolo (como antes)');
}
eq([H.totalValido(0), H.totalValido('150'), H.totalValido(-0.01), H.totalValido(''), H.totalValido('abc'), H.totalValido(Infinity)],
  [true, true, false, false, false, false], 'A3 — totalValido: 0 o más, y número');
/* Quitar una aportación. */
const conDos = H.anadirAhorro(H.anadirAhorro(base({ hucha: 0 }), 30, '2026-10-01'), 20, '2026-10-02');
const quitada = H.eliminarAportacion(conDos, conDos.aportaciones[0].id);
ok(quitada.hucha === 20 && quitada.aportaciones.length === 1, 'A3 — quitar una aportación en condiciones normales resta y la saca del historial');
const editadoAMano = { ...conDos, hucha: 5 };
const rechazada = H.eliminarAportacion(editadoAMano, conDos.aportaciones[0].id);
ok(rechazada.hucha === 5 && rechazada.aportaciones.length === 2,
  '🚨 A3 — si el total se editó a 5 €, quitar la de 30 € se RECHAZA: ni total negativo, ni recortado a 0, ni el historial a medias');
const justa = H.eliminarAportacion({ ...conDos, hucha: 30 }, conDos.aportaciones[0].id);
ok(justa.hucha === 0 && justa.aportaciones.length === 1, 'A3 — dejarlo exactamente en 0 sí se puede');
/* Lo guardado antes se respeta. */
const viejo = H.normalizarEconomiaHucha({ hucha: 40, aportaciones: [{ id: 'a1', fecha: '2026-09-01', cantidad: 50 }, { id: 'a2', fecha: '2026-09-02', cantidad: -10 }] });
ok(viejo.hucha === 40 && viejo.aportaciones.length === 2 && viejo.aportaciones[1].cantidad === -10,
  'A3 — lo guardado antes no se borra ni se reescribe al cargar (historial suyo); la regla vale para lo nuevo');
/* La pantalla y App.jsx usan la misma regla. */
const VISTA = sinComentarios(leer('src/views/FinanceView.jsx'));
const APP = sinComentarios(leer('src/App.jsx'));
ok(/const motivo = motivoAportacion\(economia, ahorro\);\s*if \(motivo\) \{ setErrorAhorro\(motivo\); return; \}/.test(VISTA), 'A3/A5 — la pantalla usa la misma regla que la librería y dice por qué al rechazar');
ok(/const motivo = motivoTotal\(v, totalAMedias, economia\.hucha\);/.test(VISTA) && /if \(motivo\) \{ setErrorTotal\(motivo\); return; \}/.test(VISTA),
  'A3/A5 — el total a mano también, con su mensaje y contra lo guardado (la hucha solo suma)');
ok(/onBlur=\{confirmarTotal\}/.test(VISTA) && /value=\{totalEscrito \?\? economia\.hucha\}/.test(VISTA) && !/onUpdateHucha\(/.test(VISTA.split('const confirmarTotal')[0]),
  '🚨 A5 — el total se guarda UNA vez al salir del campo (o con Intro), nunca en cada tecla');
ok(/const motivo = motivoObjetivo\(\{ cantidad: meta, porPeriodo \}\);\s*if \(motivo\) \{ setErrorObjetivo\(motivo\); return; \}/.test(VISTA) && /<MensajeDeCampo id="hucha-error-objetivo">/.test(VISTA),
  'A5 — y el objetivo: si no vale, se dice debajo y no se guarda');
ok(/<MensajeDeCampo id="hucha-error-ahorro">/.test(VISTA) && /aria-describedby=\{errorAhorro \? 'hucha-error-ahorro'/.test(VISTA)
  && /<MensajeDeCampo id="hucha-error-total">/.test(VISTA) && /aria-describedby=\{errorTotal \? 'hucha-error-total'/.test(VISTA),
  'A3 — los dos campos avisan con MensajeDeCampo, aria-invalid y aria-describedby (MS F9)');
ok(/const updateHucha = \(v\) => \{ const euros = eurosDelTotal\(v, economia\?\.hucha\); if \(euros !== null\)/.test(APP), 'A3/A5 — y App.jsx no escribe un total no válido (ni que BAJE) aunque le llegue, y el válido al céntimo');
ok(/if \(!economiaPermitida\(economia, siguiente\)\) return;/.test(APP), '🚨 A5 — y updateEconomia tampoco guarda una economía que baje el total o traiga aportaciones no válidas');
ok(!/c === 0\) return/.test(VISTA), 'A3 — ya no queda la guarda vieja que solo rechazaba el cero');
ok(/setTotalAMedias\(!!e\.target\.validity\?\.badInput\)/.test(VISTA) && /if \(aMedias\) return MOTIVOS_HUCHA\.totalFormato;/.test(leer('src/lib/hucha.js')),
  '🚨 A3 — un total a medio escribir («-», «1e»: llega vacío con badInput) no se guarda como 0: se avisa');

/* ─────────────────────────────────────────────────────────────────────────
   A4 · ESCRITURAS FUERA DE ORDEN, CON EL saveData DE VERDAD
   ───────────────────────────────────────────────────────────────────────── */
console.log('\n── A4 · escrituras fuera de orden (saveData real + servidor simulado) ──');
/* El servidor: una fila por clave; una escritura se APLICA cuando la prueba la resuelve. */
const servidor = new Map();
let peticiones = [];
S.supabase.from = () => ({
  upsert: (fila) => new Promise((responder) => {
    const p = { clave: fila.key, valor: fila.value, hecha: false };
    p.resolver = (modo = 'ok') => {
      if (p.hecha) return; p.hecha = true;
      if (modo === 'ok' || modo === 'red_tras_aplicar') servidor.set(fila.key, fila.value);
      if (modo === 'ok') responder({ error: null });
      else if (modo === '500') responder({ error: { status: 500, message: 'error del servidor' } });
      else responder({ error: { message: 'Failed to fetch' } });
    };
    peticiones.push(p);
  }),
});
const pausa = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const hasta = async (cond, tope = 15000) => { const t0 = Date.now(); while (!cond()) { if (Date.now() - t0 > tope) return false; await pausa(5); } return true; };
const nuevaRonda = () => { servidor.clear(); peticiones = []; Y.empezarSesionDeDatos('u1'); };
const de = (clave) => peticiones.filter((p) => p.clave === clave);
const enCola = () => { const r = Y.resumenSincronizacion(); return { pendientes: r.pendientes, guardando: r.guardando }; };
const TOPE = Y.TOPE_ESPERA_ANTERIOR_MS;

/* 1 · La vieja termina ANTES que la nueva (la cola normal). */
nuevaRonda();
const g1 = S.saveData('u1', 'k1', 'v1');
const g2 = S.saveData('u1', 'k1', 'v2');
await hasta(() => de('k1').length === 1);
ok(de('k1').length === 1, 'A4.1 — con la cola, la segunda escritura ESPERA a la primera (no sale a la vez)');
de('k1')[0].resolver('ok');
await hasta(() => de('k1').length === 2);
de('k1')[1].resolver('ok');
await Promise.all([g1, g2]);
ok(servidor.get('k1') === 'v2' && de('k1').length === 2 && enCola().pendientes.length === 0 && enCola().guardando === 0,
  'A4.1 — la vieja termina antes: la cuenta acaba con v2, dos escrituras, nada pendiente ni en vuelo');

/* 2 · Las respuestas llegan al revés (las dos ya enviadas) — la regla de despuesDeGuardar sola. */
nuevaRonda();
const tA = Y.antesDeGuardar('k2', { usuario: 'u1' }); Y.marcarEnviado('k2', tA, 'viejo');
const tB = Y.antesDeGuardar('k2', { usuario: 'u1' }); Y.marcarEnviado('k2', tB, 'nuevo');
eq(Y.despuesDeGuardar('k2', tB, { ok: true, valor: 'nuevo' }), null, 'A4.2 — la nueva llega primero: nada que reescribir');
const dA = Y.despuesDeGuardar('k2', tA, { ok: true, valor: 'viejo' });
ok(dA && dA.reescribir === true && dA.valor === 'nuevo' && Y.pendientesParaReintentar()[0]?.valor === 'nuevo',
  '🚨 A4.2 — la vieja llega DESPUÉS bien: pudo pisar la cuenta, así que el último valor (nuevo) queda pendiente y se pide reescribirlo');
/* Una vieja que el servidor RECHAZÓ (500: la transacción se deshizo) no pudo pisar nada — la regla de antes se queda. */
nuevaRonda();
const tC = Y.antesDeGuardar('k2b', { usuario: 'u1' }); Y.marcarEnviado('k2b', tC, 'viejo');
const tD = Y.antesDeGuardar('k2b', { usuario: 'u1' }); Y.marcarEnviado('k2b', tD, 'nuevo');
Y.despuesDeGuardar('k2b', tD, { ok: true, valor: 'nuevo' });
eq(Y.despuesDeGuardar('k2b', tC, { ok: false, error: { code: 'XX000', message: 'error del servidor', status: 500 }, valor: 'viejo' }), null, 'A4.2 — una vieja que la base de datos rechazó (500 con su código: deshecha) después de la nueva no pide reescribir…');
eq(Y.pendientesParaReintentar(), [], '…ni deja nada pendiente (apartado 41 de la MS F16, intacto)');
/* A5 (auditoría final) — un 500 SIN código no es de la base de datos (un proxy): pudo aplicarse detrás → se reescribe. */
nuevaRonda();
const tC2 = Y.antesDeGuardar('k2e', { usuario: 'u1' }); Y.marcarEnviado('k2e', tC2, 'viejo');
const tD2 = Y.antesDeGuardar('k2e', { usuario: 'u1' }); Y.marcarEnviado('k2e', tD2, 'nuevo');
Y.despuesDeGuardar('k2e', tD2, { ok: true, valor: 'nuevo' });
ok(Y.despuesDeGuardar('k2e', tC2, { ok: false, error: { message: 'Internal Server Error', status: 500 }, valor: 'viejo' })?.reescribir === true,
  'A5 — una vieja que contesta un 500 SIN código (no lo dio la base de datos) pudo aplicarse: se pide reescribir');
/* Y una vieja que se quedó sin red: no se sabe si se aplicó → se reescribe. */
nuevaRonda();
const tE = Y.antesDeGuardar('k2c', { usuario: 'u1' }); Y.marcarEnviado('k2c', tE, 'viejo');
const tF = Y.antesDeGuardar('k2c', { usuario: 'u1' }); Y.marcarEnviado('k2c', tF, 'nuevo');
Y.despuesDeGuardar('k2c', tF, { ok: true, valor: 'nuevo' });
ok(Y.despuesDeGuardar('k2c', tE, { ok: false, error: { message: 'Failed to fetch' }, valor: 'viejo' })?.reescribir === true,
  'A4.2 — una vieja que falla por la RED después de la nueva sí pide reescribir: la respuesta se pierde también después de aplicarse');
/* Mientras espera en la cola, una escritura todavía no compite: no hay reescrituras falsas. */
nuevaRonda();
const tG = Y.antesDeGuardar('k2d', { usuario: 'u1' }); Y.marcarEnviado('k2d', tG, 'v1');
Y.antesDeGuardar('k2d', { usuario: 'u1' }); // la segunda, encolada: aún no ha salido
eq(Y.despuesDeGuardar('k2d', tG, { ok: true, valor: 'v1' }), null, 'A4.2 — una escritura que termina con la siguiente todavía EN COLA (sin salir) no pide reescribir nada');

/* 3 · El caso de la auditoría: la vieja se cuelga, la nueva sale por el tope, y la vieja llega después. */
nuevaRonda();
const tope0 = Date.now();
const lenta = S.saveData('u1', 'diario', 'VIEJO');
const nueva = S.saveData('u1', 'diario', 'NUEVO');
await hasta(() => de('diario').length === 2, TOPE + 5000);
ok(de('diario').length === 2 && Date.now() - tope0 >= TOPE - 50, `A4.3 — la nueva sale cuando vence el tope (${Math.round((Date.now() - tope0) / 1000)} s), con la vieja colgada`);
de('diario')[1].resolver('ok');
await nueva;
eq(servidor.get('diario'), 'NUEVO', 'A4.3 — la nueva se aplica');
de('diario')[0].resolver('ok'); // la colgada llega ahora y pisa la cuenta
await lenta;
eq(servidor.get('diario'), 'VIEJO', 'A4.3 — (la vieja acaba de pisar la cuenta: es el fallo reproducido)');
ok(enCola().pendientes.includes('diario'), '🚨 A4.3 — y ahora SÍ queda pendiente: ya no es silencioso');
await hasta(() => de('diario').length === 3);
ok(de('diario').length === 3 && de('diario')[2].valor === 'NUEVO', '🚨 A4.3 — se reescribe sola, una vez, con el ÚLTIMO valor (NUEVO)');
de('diario')[2].resolver('ok');
await hasta(() => enCola().guardando === 0 && enCola().pendientes.length === 0);
ok(servidor.get('diario') === 'NUEVO' && enCola().pendientes.length === 0 && enCola().guardando === 0,
  '🚨 A4.3 — tras recuperarse, la cuenta y la pantalla coinciden (NUEVO), sin pendientes ni nada en vuelo');
await pausa(50);
eq(de('diario').length, 3, 'A4.3 — y no hay una cuarta escritura: sin bucle');

/* 4 · La nueva falla un momento (sin red) y se recupera al reintentar. */
nuevaRonda();
const a4 = S.saveData('u1', 'k4', 'v1');
await hasta(() => de('k4').length === 1); de('k4')[0].resolver('ok'); await a4;
const b4 = S.saveData('u1', 'k4', 'v2');
await hasta(() => de('k4').length === 2); de('k4')[1].resolver('sin_red'); await b4;
ok(servidor.get('k4') === 'v1' && enCola().pendientes.includes('k4') && Y.pendientesParaReintentar()[0]?.valor === 'v2',
  'A4.4 — la nueva falla por la red: la cuenta sigue en v1 y v2 queda pendiente con su valor');
const r4 = S.reintentarGuardados();
await hasta(() => de('k4').length === 3); de('k4')[2].resolver('ok');
ok(await r4 === true && servidor.get('k4') === 'v2' && enCola().pendientes.length === 0, 'A4.4 — al reintentar llega: cuenta = v2 y nada pendiente');

/* 5 · La nueva falla de forma definitiva: se queda pendiente y se dice. */
nuevaRonda();
const a5 = S.saveData('u1', 'k5', 'v1');
await hasta(() => de('k5').length === 1); de('k5')[0].resolver('ok'); await a5;
const b5 = S.saveData('u1', 'k5', 'v2');
await hasta(() => de('k5').length === 2); de('k5')[1].resolver('500'); await b5;
const r5 = S.reintentarGuardados();
await hasta(() => de('k5').length === 3); de('k5')[2].resolver('500');
ok(await r5 === false && servidor.get('k5') === 'v1', 'A4.5 — el reintento también falla: la cuenta no cambia y el reintento dice que no llegó');
const res5 = Y.resumenSincronizacion();
ok(res5.pendientes.includes('k5') && res5.motivos.includes('servidor') && Y.pendientesParaReintentar()[0]?.valor === 'v2',
  '🚨 A4.5 — un fallo definitivo NO se pierde: v2 sigue pendiente con su motivo, y el indicador lo enseña');
await pausa(50);
eq(de('k5').length, 3, 'A4.5 — y no se reintenta solo en bucle: espera a la conexión o al botón');

/* 6 · Varios cambios seguidos de la misma clave. */
nuevaRonda();
const varios = ['a', 'b', 'c', 'd', 'e'].map((v) => S.saveData('u1', 'k6', v));
for (let i = 0; i < 5; i += 1) { await hasta(() => de('k6').length === i + 1); de('k6')[i].resolver('ok'); }
await Promise.all(varios);
ok(servidor.get('k6') === 'e' && de('k6').map((p) => p.valor).join('') === 'abcde' && enCola().pendientes.length === 0,
  'A4.6 — cinco cambios seguidos salen en orden (a→e), la cuenta acaba en «e», sin reescrituras ni pendientes');

/* 7 · Otra clave no se contamina — mientras una sufre el desorden. */
nuevaRonda();
const x1 = S.saveData('u1', 'kx', 'X-VIEJO');
const x2 = S.saveData('u1', 'kx', 'X-NUEVO');
const y1 = S.saveData('u1', 'ky', 'Y1');
await hasta(() => de('ky').length === 1);
ok(de('ky').length === 1 && de('kx').length === 1, 'A4.7 — otra clave no espera en la cola de la primera');
de('ky')[0].resolver('ok'); await y1;
await hasta(() => de('kx').length === 2, TOPE + 5000);
de('kx')[1].resolver('ok'); await x2;
de('kx')[0].resolver('ok'); await x1;
await hasta(() => de('kx').length === 3); de('kx')[2].resolver('ok');
await hasta(() => enCola().guardando === 0);
ok(servidor.get('kx') === 'X-NUEVO' && servidor.get('ky') === 'Y1' && de('ky').length === 1 && enCola().pendientes.length === 0,
  'A4.7 — la clave del desorden se recupera (X-NUEVO) y la otra no se toca: una sola escritura de Y1, sin pendientes');

/* 8 · Tres escrituras que se cuelgan en cadena: las reescrituras están acotadas y la última gana. */
nuevaRonda();
const c1 = S.saveData('u1', 'kc', 'C1');
const c2 = S.saveData('u1', 'kc', 'C2');
await hasta(() => de('kc').length === 2, TOPE + 5000); // C2 sale por el tope con C1 colgada
const c3 = S.saveData('u1', 'kc', 'C3');
await hasta(() => de('kc').length === 3, TOPE + 5000); // C3 sale por el tope con C2 colgada
de('kc')[2].resolver('ok'); await c3;
de('kc')[1].resolver('ok'); await c2; // C2 llega tarde → se reescribe C3
de('kc')[0].resolver('ok'); await c1; // C1 llega más tarde todavía
await hasta(() => de('kc').length >= 4);
await pausa(30);
de('kc').slice(3).forEach((p) => p.resolver('ok'));
await hasta(() => enCola().guardando === 0 && enCola().pendientes.length === 0);
await pausa(30);
de('kc').slice(3).forEach((p) => p.resolver('ok'));
await hasta(() => enCola().guardando === 0 && enCola().pendientes.length === 0);
const reescrituras = de('kc').length - 3;
ok(servidor.get('kc') === 'C3' && reescrituras >= 1 && reescrituras <= 2 && de('kc').slice(3).every((p) => p.valor === 'C3'),
  `🚨 A4.8 — dos viejas tardías: ${reescrituras} reescritura(s), todas con C3 (≤ una por vieja), y la cuenta acaba en C3`);
ok(enCola().pendientes.length === 0 && enCola().guardando === 0, 'A4.8 — la cola no se queda bloqueada: nada en vuelo ni pendiente');

/* 9 · Una respuesta de una sesión que ya se cerró no reescribe nada en la nueva. */
nuevaRonda();
const tS = Y.antesDeGuardar('ks', { usuario: 'u1' }); Y.marcarEnviado('ks', tS, 'de u1');
const tS2 = Y.antesDeGuardar('ks', { usuario: 'u1' }); Y.marcarEnviado('ks', tS2, 'de u1 (nuevo)');
Y.despuesDeGuardar('ks', tS2, { ok: true, valor: 'de u1 (nuevo)' });
Y.empezarSesionDeDatos('u2');
eq(Y.despuesDeGuardar('ks', tS, { ok: true, valor: 'de u1' }), null, 'A4.9 — una vieja de la sesión anterior no pide reescribir en la nueva…');
eq(Y.pendientesParaReintentar(), [], '…ni deja nada de la otra cuenta pendiente');

/* 10 · La vieja llega tarde, pero detrás de la nueva ya hay OTRA en cola (sin salir): esa sale después de
   todo lo enviado, así que corrige la cuenta sola. Reescribir aquí el último ENVIADO lo pondría detrás de
   ella y pisaría el último cambio (lo cazó la revisión adversarial: [A,B,C,B] y la cuenta en B). */
for (const llegaAntes of ['vieja', 'nueva']) {
  nuevaRonda();
  const k = `k10-${llegaAntes}`;
  const a10 = S.saveData('u1', k, 'A');
  const b10 = S.saveData('u1', k, 'B');
  await hasta(() => de(k).length === 2, TOPE + 5000); // B sale por el tope con A colgada
  const c10 = S.saveData('u1', k, 'C'); // C espera en la cola detrás de B
  await pausa(20);
  if (llegaAntes === 'vieja') {
    /* A responde con C todavía EN COLA: C saldrá después de A, así que no hace falta reescribir nada. */
    de(k)[0].resolver('ok'); await a10; de(k)[1].resolver('ok'); await b10;
    await hasta(() => de(k).length >= 3);
    de(k)[2].resolver('ok'); await c10;
    await pausa(50);
    de(k).slice(3).forEach((p) => p.resolver('ok'));
    await hasta(() => enCola().guardando === 0);
    ok(servidor.get(k) === 'C' && enCola().pendientes.length === 0 && enCola().guardando === 0 && de(k).length === 3,
      `🚨 A4.10 — vieja tardía con otra EN COLA: peticiones [${de(k).map((p) => p.valor)}], la cuenta acaba en C, sin reescritura ni pendientes`);
  } else {
    /* B llega y C SALE; A responde después: pudo aplicarse detrás de C, así que hay que reescribir — con C. */
    de(k)[1].resolver('ok'); await b10;
    await hasta(() => de(k).length >= 3); // C ya ha salido
    de(k)[0].resolver('ok'); await a10;
    de(k)[2].resolver('ok'); await c10;
    await hasta(() => de(k).length >= 4);
    de(k).slice(3).forEach((p) => p.resolver('ok'));
    await hasta(() => enCola().guardando === 0 && enCola().pendientes.length === 0);
    ok(servidor.get(k) === 'C' && enCola().pendientes.length === 0 && de(k).length === 4 && de(k)[3].valor === 'C',
      `🚨 A4.10 — vieja tardía con la nueva YA ENVIADA: peticiones [${de(k).map((p) => p.valor)}], una reescritura con C y la cuenta en C`);
  }
}

/* El cableado, leído del código. */
const SUPA = sinComentarios(leer('src/lib/supabase.js'));
{
  const iEsp = SUPA.indexOf('await esperarAnterior(turno.anterior);');
  const iSal = SUPA.indexOf('const salida = alSalir(key, turno, value);');
  const iVal = SUPA.indexOf('value = salida.valor;');
  const iMar = SUPA.indexOf('marcarEnviado(key, turno, value);');
  const iUps = SUPA.indexOf(".from('app_data')\n      .upsert(");
  ok(iEsp > 0 && iEsp < iSal && iSal < iVal && iVal < iMar && iMar < iUps,
    'A4/A5 — saveData espera a su anterior, DECIDE qué sale (alSalir), apunta lo enviado y solo entonces sale (si no, la cola normal daría reescrituras falsas)');
}
ok(/if \(decision && decision\.reescribir\) saveData\(userId, key, decision\.valor, \{ reintento: true \}\);/.test(SUPA),
  'A4/A5 — reescribe por la puerta de siempre (cola, número y pendiente), en modo reintento: decide su valor al salir');
ok(Y.TOPE_ESPERA_ANTERIOR_MS === 10000, 'A4 — el tope de la cola no se ha tocado (10 s)');

console.log(`\n${fallos === 0 ? '✅' : '❌'} ${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos === 0 ? 0 : 1);
