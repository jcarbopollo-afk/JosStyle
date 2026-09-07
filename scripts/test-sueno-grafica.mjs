// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 32 (SU F2) — SUEÑO: LA GRÁFICA DE 7 DÍAS MÓVILES
// ══════════════════════════════════════════════════════════════════════════
//
// 🚨 La frase que sostiene toda la fase está en el apartado 13: **"7 días de
// calendario, no 7 registros"**. Hasta aquí la gráfica hacía `sueno.slice(-7)`,
// que es literalmente lo que el apartado 18 prohíbe.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  DIAS_VENTANA, etiquetaDeDia, primeraFechaConRegistro, indicePorFecha,
  ventanaDeDias, puedeRetroceder, puedeAvanzar, TITULO_ACTUAL, tituloDeVentana,
  mediaDeVentana, huecosDeVentana,
  ANALISIS_LARGO, NO_EN_SU2, AUDITORIA_SU2, condicionSU2,
} from '../src/lib/sueno.js';
import { correlacionSuenoEstudio, correlacionSuenoAnimo } from '../src/lib/correlaciones.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(raiz, p), 'utf8');

const soloCodigo = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/\/\/.*$/gm, ' ')
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');

let pasa = 0;
const fallos = [];
const ok = (c, m) => { if (c) { pasa += 1; console.log(`  ✓ ${m}`); } else { fallos.push(m); console.log(`  ✗ ${m}`); } };
const eq = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m}${JSON.stringify(a) === JSON.stringify(b) ? '' : ` — esperaba ${JSON.stringify(b)}, salió ${JSON.stringify(a)}`}`);

const VISTA = leer('src/views/SleepView.jsx');
const CODIGO_VISTA = soloCodigo(VISTA);

/* El ejemplo real del apartado 14, con dos días sin registrar metidos a
   propósito para comprobar que se quedan como huecos. */
const HOY = '2026-08-30';
const H = [
  { id: 'a', fecha: '2026-08-24', horaDormir: '23:00', horaDespertar: '07:00' },  // 8 h
  { id: 'b', fecha: '2026-08-25', horaDormir: '23:30', horaDespertar: '07:00' },  // 7,5 h
  /* 26 y 27: sin registrar */
  { id: 'c', fecha: '2026-08-28', horaDormir: '00:00', horaDespertar: '07:00' },  // 7 h
  /* 29: sin registrar */
  { id: 'd', fecha: '2026-08-30', horaDormir: '23:00', horaDespertar: '07:30' },  // 8,5 h
];

console.log('\n══ E3 · Fase 32 (SU F2) — la ventana móvil de 7 días ══');

console.log('\n── 1. 🚨 7 días de CALENDARIO, no 7 registros (apartados 13 y 18) ──');
eq(DIAS_VENTANA, 7, 'la ventana son siete días');
const v = ventanaDeDias(H, { hoy: HOY });
eq(v.puntos.length, 7, '🚨 SIETE PUNTOS con solo cuatro noches registradas: los días existen igual');
eq([v.inicio, v.fin], ['2026-08-24', '2026-08-30'], 'y van del 24 al 30, que es hoy menos seis');
eq(v.puntos.map((p) => p.fecha.slice(8)), ['24', '25', '26', '27', '28', '29', '30'],
  '🚨 los siete días consecutivos, sin saltarse los que no registró');
eq(v.puntos.filter((p) => p.sinRegistro).length, 3, 'tres de ellos sin registro');
/* 🚨 Y esto es lo que hacía antes: los 7 últimos REGISTROS. */
eq(H.slice(-7).length, 4,
  '🚨 con `sueno.slice(-7)` solo habría CUATRO puntos, y el 26 y el 27 no existirían: eso es lo que prohíbe el apartado 18');
ok(!/sueno\.slice\(-VENTANA_GRAFICA\)[\s\S]{0,300}chartData/.test(VISTA),
  '⚠️ y la vista ya no alimenta la gráfica con los últimos registros');
ok(CODIGO_VISTA.includes('ventanaDeDias'), '⚠️ sino con la ventana de días');

console.log('\n── 2. 🚨 Un día sin registro NO inventa un dato (apartados 3 y 18) ──');
eq(v.puntos.filter((p) => p.sinRegistro).every((p) => p.horas === null), true,
  '🚨 los huecos valen `null`, ni cero ni la media');
eq(v.puntos.find((p) => p.fecha === '2026-08-26').horas, null, 'el 26 no tiene horas');
eq(v.puntos.find((p) => p.fecha === '2026-08-24').horas, 8, 'y el 24 tiene las suyas');
ok(/connectNulls={false}/.test(VISTA),
  '🚨 y la línea NO cruza el hueco: `connectNulls` en falso, o la gráfica dibujaría una recta inventada');
eq(huecosDeVentana(v), 3, 'la pantalla puede decir cuántas noches faltan');
eq(AUDITORIA_SU2.diasInventados, 0, 'ni un día inventado');

console.log('\n── 3. La ventana avanza sola con la fecha del sistema (ap. 2 y 13) ──');
const manana = ventanaDeDias(H, { hoy: '2026-08-31' });
eq([manana.inicio, manana.fin], ['2026-08-25', '2026-08-31'],
  '🚨 al llegar el 31, la ventana pasa a 25 → 31: el ejemplo literal del apartado 14');
eq(manana.puntos.some((p) => p.fecha === '2026-08-24'), false, 'el 24 sale de la gráfica…');
eq(H.some((r) => r.fecha === '2026-08-24'), true,
  '🚨 …PERO NO SE BORRA DE LOS DATOS (apartado 12): sigue en la lista');
eq(AUDITORIA_SU2.datosBorrados, 0, 'ni un dato borrado');
eq(ventanaDeDias(H, { hoy: '2026-09-30' }).puntos.length, 7,
  '⚠️ y un mes después sigue siendo de siete: la gráfica no crece (apartado 1)');

console.log('\n── 4. Volver atrás, y volver al presente (apartados 4 y 5) ──────');
const anterior = ventanaDeDias(H, { hoy: HOY, desplazamiento: 1 });
eq([anterior.inicio, anterior.fin], ['2026-08-17', '2026-08-23'],
  '🚨 la semana anterior es el bloque de siete días de antes');
eq(anterior.puntos.length, 7, 'con sus siete días');
eq(anterior.esActual, false, 'y sabe que no es el presente');
eq(v.esActual, true, 'mientras que la de hoy sí lo es');
eq(tituloDeVentana(v), TITULO_ACTUAL, `en el presente el rótulo es "${TITULO_ACTUAL}" (apartado 5)`);
eq(tituloDeVentana(anterior), '17–23 ago', '⚠️ y al retroceder, el rango de fechas de verdad');
/* Para el caso de dos meses hace falta historia más vieja: si no, el recorte del
   apartado 15 mueve el inicio a la primera noche registrada, que es de agosto. */
const conJulio = [{ id: 'j', fecha: '2026-07-01', horaDormir: '23:00', horaDespertar: '07:00' }, ...H];
eq(tituloDeVentana(ventanaDeDias(conJulio, { hoy: '2026-09-10', desplazamiento: 1 })), '28 ago – 3 sept',
  '⚠️ con los dos meses cuando la semana los cruza');
eq(tituloDeVentana(ventanaDeDias(H, { hoy: '2026-09-02', desplazamiento: 1 })), '24–26 ago',
  '🚨 y sin historia anterior la ventana empieza en su primera noche, no en días que no existían (apartado 15)');
/* 🐛 El fallo que cazó mi propia prueba de humo. */
ok(anterior.inicio <= anterior.fin,
  '🐛 y el inicio nunca queda DESPUÉS del fin: el recorte del apartado 15 dejaba la gráfica en blanco sin decir por qué');
eq(puedeAvanzar(0), false, '🚨 desde el presente no se avanza: no hay noches del futuro');
eq(puedeAvanzar(1), true, 'desde una semana atrás, sí');
eq(puedeRetroceder(H, { hoy: HOY }), false,
  '🚨 y no se retrocede a un periodo sin ni un dato: la flecha se apaga en vez de enseñar siete días en blanco');
eq(puedeRetroceder([{ id: 'z', fecha: '2026-08-10', horaDormir: '23:00', horaDespertar: '07:00' }, ...H], { hoy: HOY }), true,
  '⚠️ con historia más vieja, sí se puede');
ok(VISTA.includes('setDesplazamiento(0)') && VISTA.includes('TITULO_ACTUAL'),
  '⚠️ y hay una forma de volver al presente de un toque (apartado 5)');
ok(/aria-label="Semana anterior"/.test(VISTA) && /aria-label="Semana siguiente"/.test(VISTA),
  '⚠️ las dos flechas tienen nombre para el lector de pantalla (EH F42)');

console.log('\n── 5. Fechas reales y HOY marcado (apartados 9 y 10) ────────────');
eq(etiquetaDeDia('2026-08-24'), 'L 24', '🚨 *"L 24 · M 25 · X 26…"*, el formato literal del apartado 9');
eq(etiquetaDeDia('2026-08-26'), 'X 26', '⚠️ con la X del miércoles, como se escribe en España');
eq(etiquetaDeDia('2026-08-30'), 'D 30', 'y el domingo');
eq(v.puntos.map((p) => p.etiqueta), ['L 24', 'M 25', 'X 26', 'J 27', 'V 28', 'S 29', 'D 30'],
  '🚨 y nunca «1 2 3 4 5 6 7», que no dice de qué días habla');
eq(v.puntos.filter((p) => p.esHoy).length, 1, '🚨 uno de los siete es HOY');
eq(v.puntos.find((p) => p.esHoy).fecha, HOY, 'y es el de la fecha del sistema');
eq(anterior.puntos.filter((p) => p.esHoy).length, 0, '⚠️ y en una semana vieja no hay ninguno');

console.log('\n── 6. Con poca historia, solo los días que hay (apartado 15) ────');
const pocos = ventanaDeDias([{ id: 'x', fecha: '2026-08-29', horaDormir: '23:00', horaDespertar: '07:00' }], { hoy: HOY });
eq(pocos.puntos.map((p) => p.fecha.slice(8)), ['29', '30'],
  '🚨 con una sola noche registrada se enseñan dos días, no siete: *"no inventar los días restantes"*');
eq(pocos.inicio, '2026-08-29', 'la ventana empieza en su primera noche');
eq(ventanaDeDias([], { hoy: HOY }).puntos.length, 7,
  '⚠️ y sin ninguna noche se enseñan los siete vacíos: no hay una primera fecha por la que recortar');
eq(primeraFechaConRegistro(H), '2026-08-24', '`primeraFechaConRegistro` da la más vieja');
eq(primeraFechaConRegistro([]), null, '⚠️ y sin nada, `null`');
eq(primeraFechaConRegistro(null), null, '⚠️ con basura tampoco revienta');

console.log('\n── 7. Rendimiento: se filtra, no se recorre todo (apartado 17) ──');
const mapa = indicePorFecha(H);
eq(mapa.size, 4, 'el historial se indexa por fecha una sola vez');
eq(mapa.get('2026-08-24').id, 'a', 'y se busca por día en tiempo constante');
eq(indicePorFecha([{ id: 'v1', fecha: HOY }, { id: 'v2', fecha: HOY }]).get(HOY).id, 'v2',
  '⚠️ con dos registros del mismo día gana el último, que es el que acaba de escribir');
/* Con años de historial la ventana tiene que seguir costando lo mismo. */
const enorme = Array.from({ length: 1500 }, (_, i) => ({
  id: `g${i}`, fecha: `20${20 + Math.floor(i / 365)}-01-01`, horaDormir: '23:00', horaDespertar: '07:00',
}));
const t0 = Date.now();
ventanaDeDias(enorme, { hoy: HOY });
ok(Date.now() - t0 < 200, '⚠️ y con 1500 noches guardadas la ventana se monta en menos de 200 ms');

console.log('\n── 8. 🚨 El análisis largo NO se toca (apartados 6, 7 y 18) ─────');
eq(ANALISIS_LARGO.length, 3, 'el análisis de periodo largo que existe está declarado');
ok(ANALISIS_LARGO.every((a) => a.que && a.donde && a.lee), 'con qué es, dónde vive y qué lee');
eq(AUDITORIA_SU2.analisisSustituidos, 0, '🚨 y ninguno se sustituye: el apartado 6 lo llama MUY IMPORTANTE');
eq(AUDITORIA_SU2.graficasNuevas, 0, '🚨 ni se crea un sistema de análisis nuevo (apartado 18)');
/* 🚨 Y se comprueba de verdad: las correlaciones siguen leyendo la lista entera. */
const cEst = correlacionSuenoEstudio(H, [{ fecha: '2026-08-24', horas: 2 }, { fecha: '2026-08-28', horas: 1 }]);
ok(cEst && typeof cEst === 'object', '🚨 la correlación sueño ↔ estudio sigue funcionando con estos registros');
const cAni = correlacionSuenoAnimo(H, [{ fecha: '2026-08-24', animo: 4 }, { fecha: '2026-08-28', animo: 3 }]);
ok(cAni && typeof cAni === 'object', '🚨 y la de sueño ↔ ánimo también');
ok(VISTA.includes('AIPanel') && VISTA.includes('Analizar mi sueño'),
  '⚠️ y el panel de IA de la propia pantalla sigue ahí');
ok(NO_EN_SU2.length >= 6 && NO_EN_SU2.every((n) => n.que && n.porque),
  'y lo que esta fase NO hace está declarado con su motivo');
ok(NO_EN_SU2.some((n) => /mensual|30 días/i.test(n.que)),
  '⚠️ incluido convertir la gráfica en mensual, que el apartado 18 prohíbe');

console.log('\n── 9. La media de lo que se ve ─────────────────────────────────');
eq(mediaDeVentana(v), 7.8, 'la media es la de las noches registradas de esta ventana');
eq(mediaDeVentana({ puntos: [{ registro: null, sinRegistro: true }] }), null,
  '🚨 y una ventana sin ni una noche registrada no tiene media: `null`, no cero');
ok(mediaDeVentana(v) > 7 && mediaDeVentana(v) < 9,
  '⚠️ y los tres huecos NO bajan la media: no se cuentan como noches de cero horas');
eq(mediaDeVentana(null), null, '⚠️ sin ventana tampoco revienta');

console.log('\n── 10. 🚨 La condición de finalización se CALCULA ───────────────');
const cond = condicionSU2({ vista: VISTA });
eq(cond.length, 14, 'los catorce puntos que salen del criterio del apartado 19');
eq(cond.filter((c) => !c.ok).map((c) => c.id), [], '🚨 y ninguno rojo — cada uno ejecuta la ventana de verdad');
const rota = condicionSU2({ vista: 'export default function Nada() { return null; }' });
ok(rota.filter((c) => !c.ok).length >= 3,
  '🚨 con una pantalla vacía se pone roja: una auditoría que no puede fallar no sirve (EH F42)');

console.log('\n══════════════════════════════════════════════════════════════════════');
if (fallos.length) {
  console.log(`✗ ${fallos.length} comprobación(es) fallida(s):`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F32 (SU F2) · La ventana móvil de 7 días`);
