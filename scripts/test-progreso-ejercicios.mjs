/* Entrega 4 · FIT F12/45 — Pantalla de progreso por ejercicio.
   ═══════════════════════════════════════════════════════════════════════════
   Lo que más se vigila:
   1. Que NO haya matemática propia: todo sale de la F11 (apartados 13 y 38).
   2. Que el progreso y el historial digan lo mismo (apartado 31).
   3. Que sin datos, con uno, con dos y con muchos cada cosa se distinga
      (apartados 23, 36, 39 y 40).
   4. Que la gráfica no mezcle métricas ni rompa con 0, 1, 2 o muchos puntos. */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ESTADOS_PROGRESO, estadoProgreso, estadoDe, FILTROS_PROGRESO, tarjetaDeProgreso, tarjetasDeProgreso,
  ordenarTarjetas, consultarProgreso, PROGRESO_VACIO, CAMBIOS_RECIENTES, resumenDeProgreso,
  RANGOS_GRAFICA, PUNTOS_MINIMOS_GRAFICA, graficaDeProgreso, geometriaGrafica, detalleDeProgreso, NO_EN_FIT12,
} from '../src/lib/progresoEjercicios.js';
import { progresoDeEjercicio } from '../src/lib/progresion.js';
import { detalleDeSesion, sesionDelHistorial } from '../src/lib/historial.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion, quitarSerie,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { DEFAULT_FITNESS } from '../src/lib/fitness.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (src) => src.replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1 ');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const HOY = '2026-09-17';
function sesion(exerciseId, valores, fecha, cambios = {}) {
  let r = crearRutina({ nombre: exerciseId });
  r = anadirEjercicio(r, exerciseId);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length, ...cambios });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    if (v === 'omitir') { s = quitarSerie(s, e.id, e.series[i].id); return; }
    if (!v) return;
    s = editarSerie(s, e.id, e.series[i].id, v);
    s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
}
const con = (...ss) => ss.reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS });
const r = (reps, peso = null) => ({ reps, peso });

console.log('\n═══ FIT F12/45 · Progreso por ejercicio ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Sin entrenamientos, uno y dos (apartados 5, 14, 16, 23 y 39) ──');

const VACIO = { ...DEFAULT_FITNESS };
const rv = resumenDeProgreso(VACIO, tarjetasDeProgreso(VACIO));
ok(rv.suficiente === false && rv.entrenamientos === 0, '🚨 Sin entrenamientos, el resumen NO tiene datos suficientes');
ok(PROGRESO_VACIO.titulo === 'Tu progreso aparecerá aquí' && PROGRESO_VACIO.cta === 'Entrenar ahora', '…con el texto y el botón del apartado 5');
ok(tarjetasDeProgreso(VACIO).length === 0, '…y ni una tarjeta');

const UNO = con(sesion('press-banca-barra', [r(8, 60), r(8, 60)], '2026-09-10'));
const t1 = tarjetasDeProgreso(UNO)[0];
ok(t1.estado === 'primer_registro' && t1.estadoNombre === 'Primer registro', '🚨 Con un entrenamiento: «Primer registro» (apartado 39)');
ok(t1.cambio === '' && t1.anterior === '', '…sin ninguna comparación falsa');
ok(resumenDeProgreso(UNO, [t1]).suficiente === false, '🚨 …y el resumen sigue sin cifras: «0 mejorando» con un solo entrenamiento sería falso');
const d1 = detalleDeProgreso(UNO, 'press-banca-barra', { hoy: HOY });
ok(d1.soloUna === true && d1.comparacion === null && d1.mejor.texto === '60 kg × 8', 'El detalle con una vez: sin comparación, y «Primer registro» en vez de un falso mejor');
ok(d1.grafica.mostrar === false && /tres registros/.test(d1.grafica.motivo), '🚨 …y SIN gráfica, diciendo por qué (apartado 23)');

const DOS = con(sesion('dominada-prona', [r(8)], '2026-09-01', { tipoCarga: 'corporal' }), sesion('dominada-prona', [r(10)], '2026-09-12', { tipoCarga: 'corporal' }));
const d2 = detalleDeProgreso(DOS, 'dominada-prona', { hoy: HOY });
const p2 = progresoDeEjercicio(DOS, 'dominada-prona');
ok(d2.estado === 'mejora' && d2.estadoNombre === 'Mejorando', `Con dos: «Mejorando» (${d2.estado})`);
ok(d2.comparacion.antes === '8 reps' && d2.comparacion.despues === '10 reps' && d2.comparacion.resultado === '+2 reps',
  `🚨 Anterior «${d2.comparacion.antes}» → «${d2.comparacion.despues}», resultado «${d2.comparacion.resultado}» (apartado 13, su ejemplo)`);
ok(d2.comparacion.resultado === p2.comparacion.texto && d2.estado === p2.comparacion.estado,
  '🚨 …EXACTAMENTE lo que dice la F11: no hay una segunda matemática (apartado 38)');
ok(d2.grafica.mostrar === false, '…y con dos todavía no hay gráfica: ya lo dice la comparación (apartado 23)');
ok(d2.comparacion.porcentaje === null, '…ni porcentaje sin peso');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Varios entrenamientos: historial, mejor y gráfica (apartados 12-17, 21-25) ──');

const MUCHOS = con(
  sesion('press-banca-barra', [r(8, 60), r(8, 60)], '2026-06-01'),
  sesion('press-banca-barra', [r(5, 80)], '2026-07-01'),
  sesion('press-banca-barra', [r(8, 70), r(7, 70)], '2026-09-01'),
  sesion('press-banca-barra', [r(8, 72.5), 'omitir', r(6, 72.5)], '2026-09-12'),
);
const dm = detalleDeProgreso(MUCHOS, 'press-banca-barra', { hoy: HOY });
ok(dm.ultima.texto === '72,5 kg × 8' && dm.ultima.fechaTexto === '12 septiembre 2026', `Última vez destacada: «${dm.ultima.texto}» (apartado 12)`);
ok(dm.mejor.texto === '80 kg × 5', `Mejor resultado: «${dm.mejor.texto}» (apartado 14)`);
ok(dm.historial.map((h) => h.fecha).join() === '2026-09-12,2026-09-01,2026-07-01,2026-06-01', 'El historial del ejercicio, cronológico y de lo más reciente a lo más antiguo (apartado 16)');
ok(dm.historial[0].series.join(' | ') === 'Serie 1 — 72,5 kg × 8 | Serie 2 — 72,5 kg × 6',
  `🚨 Las series numeradas como el historial: la omitida no cuenta (${dm.historial[0].series.join(' | ')})`);

/* 🚨 Y el caso que obliga a guardar el número: una serie SIN HACER en medio
   (no omitida) sí cuenta en el historial. Numerando por posición, Progreso
   diría «Serie 2» donde el historial dice «Serie 3». */
const HUECO = con(sesion('press-banca-barra', [r(8, 60), null, r(6, 60)], '2026-09-12'));
const dh = detalleDeProgreso(HUECO, 'press-banca-barra', { hoy: HOY });
ok(dh.historial[0].series.join(' | ') === 'Serie 1 — 60 kg × 8 | Serie 3 — 60 kg × 6',
  `🚨 Con la serie 2 sin hacer, la última es la «Serie 3», como en el historial (${dh.historial[0].series.join(' | ')})`);

/* 🚨 Apartado 31 — idéntico al historial de la F10. */
const s12 = sesionDelHistorial(MUCHOS, dm.historial[0].sesionId);
const filasHist = detalleDeSesion(s12, { fitness: MUCHOS }).ejercicios[0].filas.filter((f) => f.estado === 'hecha');
const lineaDesdeHistorial = filasHist.map((f) => `Serie ${f.numero} — ${f.peso} × ${f.medida}`).join(' | ');
ok(lineaDesdeHistorial === dm.historial[0].series.join(' | '),
  `🚨 Progreso e historial dicen LO MISMO de esa sesión, serie a serie (apartado 31): ${lineaDesdeHistorial}`);

const g = dm.grafica;
ok(g.mostrar === true && g.puntos.length === 4, `Con cuatro registros hay gráfica (${g.puntos.length} puntos)`);
ok(g.etiqueta === 'Mejor peso por sesión' && g.unidad === 'kg', `🚨 …con su métrica dicha: «${g.etiqueta}» (apartado 22)`);
ok(g.puntos.map((p) => p.valor).join() === '60,80,70,72.5', `…de la más antigua a la más reciente, sin redondear (${g.puntos.map((p) => p.valor).join(', ')})`);
ok(g.puntos.every((p) => p.sesionId && p.fechaTexto && p.texto), '…y cada punto sabe su fecha, su resultado y su sesión (apartado 25)');
const g30 = detalleDeProgreso(MUCHOS, 'press-banca-barra', { hoy: HOY, rango: '30d' }).grafica;
ok(g30.puntos.length === 2 && g30.mostrar === false, `🚨 En 30 días solo hay dos: se enseñan los que hay y no se inventan puntos (apartado 24)`);
const g7 = detalleDeProgreso(MUCHOS, 'press-banca-barra', { hoy: HOY, rango: '7d' }).grafica;
ok(g7.puntos.length === 1 && g7.mostrar === false && g7.motivo, '…y en 7 días, uno: sin gráfica y con su motivo');
const gVacia = detalleDeProgreso(MUCHOS, 'press-banca-barra', { hoy: '2027-06-01', rango: '7d' }).grafica;
ok(gVacia.puntos.length === 0 && /No hay registros/.test(gVacia.motivo), '…y con ninguno, lo dice');
ok(RANGOS_GRAFICA.map((x) => x.id).join() === '7d,30d,3m,todo' && PUNTOS_MINIMOS_GRAFICA === 3, 'Los cuatro rangos del apartado 24');

/* Apartado 40 — la geometría con 0, 1, 2 y muchos puntos. */
ok(geometriaGrafica([]).length === 0, '🚨 La gráfica no rompe con 0 puntos');
const uno = geometriaGrafica([{ valor: 10 }], { ancho: 320, alto: 140, margen: 16 });
ok(uno.length === 1 && uno[0].x === 160 && uno[0].y === 70, '…ni con 1 (centrado)');
const dosG = geometriaGrafica([{ valor: 8 }, { valor: 10 }], { ancho: 320, alto: 140, margen: 16 });
ok(dosG[0].x === 16 && dosG[1].x === 304 && dosG[0].y > dosG[1].y, '…con 2, de lado a lado y el mayor más arriba');
const iguales = geometriaGrafica([{ valor: 5 }, { valor: 5 }, { valor: 5 }], { alto: 140 });
ok(iguales.every((p) => p.y === 70), '…con todos iguales no divide entre cero: línea en medio');
const cien = geometriaGrafica(Array.from({ length: 100 }, (_, i) => ({ valor: Math.sin(i) * 10 + 50 })), { ancho: 320, alto: 140, margen: 16 });
ok(cien.every((p) => p.x >= 16 && p.x <= 304 && p.y >= 16 && p.y <= 124 && Number.isFinite(p.y)), '🚨 …y con 100 puntos, todos DENTRO del dibujo: sin desbordar (apartado 40)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Tipos de ejercicio y variantes (apartados 18, 19, 20 y 22) ──');

const ISO = con(sesion('l-sit', [{ duracion: 10 }], '2026-09-01'), sesion('l-sit', [{ duracion: 12 }], '2026-09-05'), sesion('l-sit', [{ duracion: 15 }], '2026-09-12'));
const di = detalleDeProgreso(ISO, 'l-sit', { hoy: HOY });
ok(di.ultima.texto === '15 s' && di.comparacion.antes === '12 s' && di.comparacion.resultado === '+3 s', `🚨 Isométrico en SEGUNDOS: 12 s → 15 s, «${di.comparacion.resultado}» (apartado 18, su ejemplo)`);
ok(di.grafica.etiqueta === 'Mejor tiempo por sesión' && di.grafica.unidad === 's', '…y la gráfica mide tiempo');

const CORP = con(
  sesion('dominada-prona', [r(8)], '2026-09-01', { tipoCarga: 'corporal' }),
  sesion('dominada-prona', [r(9)], '2026-09-05', { tipoCarga: 'corporal' }),
  sesion('dominada-prona', [r(10)], '2026-09-12', { tipoCarga: 'corporal' }),
);
const dc = detalleDeProgreso(CORP, 'dominada-prona', { hoy: HOY });
ok(dc.grafica.etiqueta === 'Mejores repeticiones por sesión' && dc.grafica.unidad === 'reps', '🚨 Peso corporal: la gráfica cuenta repeticiones');
ok(!/kg/.test(JSON.stringify(dc)), '🚨 …y en todo el detalle NO aparece ni un «kg»: sin volumen artificial (apartado 19)');

const VAR = con(
  sesion('dominada-prona', [r(8)], '2026-09-01', { tipoCarga: 'corporal' }),
  sesion('dominada-supina', [r(12)], '2026-09-05', { tipoCarga: 'corporal' }),
);
const tv = tarjetasDeProgreso(VAR);
ok(tv.length === 2 && tv.every((t) => t.estado === 'primer_registro'), '🚨 Prona y supina son DOS tarjetas, cada una su primer registro: no se mezclan (apartado 20)');
ok(tv.some((t) => /Supina/i.test(t.nombre)) && tv.some((t) => !/Supina/i.test(t.nombre)), '…y el nombre dice cuál es');

const MEZCLA = con(
  sesion('dominada-prona', [r(10)], '2026-09-01', { tipoCarga: 'corporal' }),
  sesion('dominada-prona', [r(8)], '2026-09-03', { tipoCarga: 'corporal' }),
  sesion('dominada-prona', [r(6, 10)], '2026-09-12', { tipoCarga: 'adicional' }),
);
const dx = detalleDeProgreso(MEZCLA, 'dominada-prona', { hoy: HOY });
ok(dx.estado === 'no_comparable' && dx.comparacion === null && !!dx.avisoMedida, '🚨 Con lastre tras hacerlo sin él: «No comparable», sin comparación y diciéndolo');
ok(dx.grafica.puntos.length === 1, '🚨 …y la gráfica NO mezcla kilos con repeticiones: solo la forma de ahora (apartado 22)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Resumen, lista, orden, filtros y búsqueda (apartados 4, 6-10 y 26) ──');

const TODO = con(
  sesion('press-banca-barra', [r(8, 60)], '2026-09-01'), sesion('press-banca-barra', [r(8, 65)], '2026-09-10'),
  sesion('dominada-prona', [r(10)], '2026-08-01', { tipoCarga: 'corporal' }), sesion('dominada-prona', [r(10)], '2026-08-05', { tipoCarga: 'corporal' }),
  sesion('l-sit', [{ duracion: 20 }], '2026-09-02'), sesion('l-sit', [{ duracion: 15 }], '2026-09-14'),
  sesion('sentadilla-barra', [r(5, 100)], '2026-09-15'),
);
const T = tarjetasDeProgreso(TODO);
const R = resumenDeProgreso(TODO, T);
ok(R.suficiente && R.mejorando === 1 && R.estables === 1 && R.descenso === 1 && R.entrenamientos === 7,
  `🚨 Las cifras salen de datos reales: ${R.mejorando} mejorando, ${R.estables} estable, ${R.descenso} descenso, ${R.entrenamientos} entrenamientos (apartado 4)`);
ok(R.recientes.length === 1 && R.recientes[0].antes === '60 kg × 8' && R.recientes[0].despues === '65 kg × 8',
  `Progreso reciente: solo cambios REALES, «${R.recientes[0].antes} → ${R.recientes[0].despues}» (apartado 26)`);
ok(CAMBIOS_RECIENTES <= 5, '…y pocos');

const orden = ordenarTarjetas(T).map((t) => t.exerciseId);
ok(orden[orden.length - 1] === 'sentadilla-barra', '🚨 Lo que no tiene comparación (primer registro) va DETRÁS aunque sea lo más reciente (apartado 8)');
ok(orden[0] === 'l-sit', `…y entre los que sí, lo más reciente primero (${orden.join(', ')})`);

const tPress = T.find((t) => t.exerciseId === 'press-banca-barra');
ok(tPress.ultima === '65 kg × 8' && tPress.cambio === '+5 kg' && tPress.estadoNombre === 'Mejorando' && tPress.simbolo === '↗',
  `La tarjeta: «${tPress.ultima}», «${tPress.cambio}», «${tPress.simbolo} ${tPress.estadoNombre}» (apartado 7)`);
ok(tPress.grupo !== '', `…y el grupo muscular principal (${tPress.grupo}, apartado 28)`);

const cq = (o) => consultarProgreso(T, o).tarjetas.map((t) => t.exerciseId);
ok(cq({ filtro: 'mejora' }).join() === 'press-banca-barra', 'Filtro «Mejorando»');
ok(cq({ filtro: 'estable' }).join() === 'dominada-prona' && cq({ filtro: 'descenso' }).join() === 'l-sit', '«Estables» y «Descenso»');
ok(cq({ filtro: 'sin_datos' }).join() === 'sentadilla-barra', '«Sin datos» recoge lo que todavía no se puede comparar');
ok(FILTROS_PROGRESO.length === 5, 'Cinco filtros, ni uno más (apartado 10)');
ok(cq({ busqueda: 'PRESS' }).join() === 'press-banca-barra', 'Buscar sin importar mayúsculas');
const planche = consultarProgreso(T, { busqueda: 'planche' });
ok(planche.tarjetas.length === 0 && planche.nuncaHechos.length > 0,
  '🚨 Un ejercicio que nunca ha hecho sale APARTE, como «Sin datos», sin mezclarse con su progreso (apartado 9)');
ok(consultarProgreso(T, {}).nuncaHechos.length === 0, '…y sin búsqueda no aparece el catálogo entero');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Estados distintos y datos rotos (apartados 35 y 36) ──');

ok(ESTADOS_PROGRESO.map((e) => e.id).join() === 'mejora,estable,descenso,primer_registro,no_comparable,sin_datos',
  '🚨 Sin datos, primer registro, no comparable y los tres de tendencia son estados DISTINTOS (apartado 36)');
ok(ESTADOS_PROGRESO.every((e) => e.simbolo && e.nombre), '…cada uno con símbolo y palabra, nunca solo color (apartado 34)');
ok(estadoDe(null) === 'sin_datos' && estadoDe({ nuevo: true }) === 'sin_datos' && estadoProgreso('inventado').id === 'sin_datos', 'Un progreso vacío o raro cae en «Sin datos»');
ok(!ESTADOS_PROGRESO.some((e) => /malo|peor|fracas|fall/i.test(e.nombre)), '…y ninguno suena a reproche (apartado 15)');

const rota = sesion('press-banca-barra', [r(8, 60)], '2026-09-01');
const rotaMas = { ...rota, origen: { ...rota.origen, ejercicios: [...rota.origen.ejercicios, null, { id: 'q' }, { id: 'w', exerciseId: 'ya-no-existe', series: [{ id: 's', estado: 'hecha', hecho: { reps: 5 } }] }] } };
let noRompe = true;
let dFantasma = null;
try {
  const FR = con(rotaMas);
  tarjetasDeProgreso(FR);
  dFantasma = detalleDeProgreso(FR, 'ya-no-existe', { hoy: HOY });
  detalleDeProgreso(FR, 'nunca-existio', { hoy: HOY });
} catch { noRompe = false; }
ok(noRompe, '🚨 Ejercicios nulos, sin id o eliminados del catálogo no rompen la pantalla (apartado 35)');
ok(dFantasma && dFantasma.existe === false && dFantasma.ultima.texto === '5 reps', '…y uno que ya no está en el catálogo conserva su historia');
ok(detalleDeProgreso(UNO, 'nunca-existio', { hoy: HOY }).ultima === null, '…y uno que nunca hizo, no se inventa una última vez');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Arquitectura: ni matemática propia ni gamificación (apartados 27, 32 y 38) ──');

const LIB = sinComentarios(leer('src/lib/progresoEjercicios.js'));
const VISTA = sinComentarios(leer('src/views/ProgresoView.jsx'));
ok(/from '\.\/progresion'/.test(LIB) && /progresoDeEjercicio\(/.test(LIB) && /indiceDeProgresion\(/.test(LIB),
  '🚨 La F12 llama a la F11: `progresoDeEjercicio` e `indiceDeProgresion`');
ok(!/compararSeries|difPeso|\.reps\s*[<>]=?\s*\w+\.reps|\.peso\s*[<>]=?\s*\w+\.peso|\.duracion\s*[<>]=?\s*\w+\.duracion/.test(LIB),
  '🚨 …y no compara ni una serie por su cuenta (apartado 38)');
ok(!/from '\.\.\/lib\/progresion'/.test(VISTA) && !/\.reps\s*[<>]|\.peso\s*[<>]/.test(VISTA),
  '🚨 La pantalla no importa la F11 ni compara nada: solo pinta');
ok(!/confeti|confetti|\bXP\b|puntos de|nivel \d|monedas/i.test(VISTA), 'Sin confeti, XP, niveles ni monedas (apartado 27)');
ok(/useMemo\(\(\) => tarjetasDeProgreso/.test(VISTA), 'Las tarjetas se calculan una vez por cambio de sesiones (apartado 32)');
ok(/role="button"/.test(VISTA) && /tabIndex=\{0\}/.test(VISTA) && /onKeyDown/.test(VISTA), 'Los puntos de la gráfica se tocan y se alcanzan con el teclado (apartados 25 y 34)');
ok(/strokeWidth="2"/.test(VISTA) && /r="16"/.test(VISTA), '…con línea de 2 px y zona de toque mayor que el punto');
ok(/viewBox=/.test(VISTA) && /w-full h-auto/.test(VISTA), '…y escala con el ancho: sin desbordar de lado');
ok(/DetalleSesionHistorial/.test(VISTA) && /DetalleEjercicio/.test(VISTA),
  '🚨 «Ver entrenamiento» es la pantalla de la F10 y «Ver ejercicio» la ficha de la F2: sin duplicarlas (apartados 29 y 30)');
ok(/<ProgresoView/.test(leer('src/views/FitnessView.jsx')), 'Fitness → Progreso pinta esta pantalla (apartado 1)');
ok(NO_EN_FIT12.length >= 3, 'Lo que no se construye, dicho');

/* Y nada de esto toca lo guardado. */
const ANTES = JSON.stringify(TODO);
tarjetasDeProgreso(TODO); detalleDeProgreso(TODO, 'press-banca-barra', { hoy: HOY, rango: '3m' });
ok(JSON.stringify(TODO) === ANTES, '🚨 Calcular el progreso no cambia ni un byte de las sesiones');

console.log(`\n  ${total - fallos}/${total} comprobaciones correctas.`);
if (fallos) {
  console.log(`  \x1b[31m${fallos} fallo(s).\x1b[0m\n`);
  process.exit(1);
}
