/* Entrega 4 · FIT F40/45 — Rendimiento y optimización técnica de Fitness.
   ═══════════════════════════════════════════════════════════════════════════
   *"Primero medir. Después optimizar."* Y el apartado 59, que es lo que más
   pesa aquí: *"Después de optimizar, los resultados deben ser idénticos a
   antes"*. Lo que se mide en Node: que el historial de rangos incremental dé
   EXACTAMENTE lo mismo que calcular cada día entero, sobre escenarios con todo
   lo que puede torcerlo; que la memoria reutilice lo que no cambió y rehaga lo
   que sí; que la caché del historial se tire al clasificar (el fallo que
   destapó medir); que cada caché nueva devuelva lo mismo que sin ella; los
   presupuestos sobre el escenario grande; y la auditoría del código, con su
   ejemplo malo por casilla. Lo que pasa al escribir un peso, en Chromium. */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RETARDO_AUTOGUARDADO_MS, ESCENARIO_PRESUPUESTO, PRESUPUESTOS_FITNESS, presupuestoFitness, escenarioGrande,
  HOOKS_FITNESS, RELOJES_PERMITIDOS, CASILLAS_RENDIMIENTO, auditarRendimientoFitness,
  intervalosSinLimpiar, escuchadoresSinQuitar, clavesPorIndice, relojFueraDeSuSitio, guardadoPorTecla,
  YA_EXISTIA_F40, OPTIMIZACIONES_F40, DESCARTADO_F40, NO_EN_FIT40, DECISIONES_FIT40,
} from '../src/lib/rendimientoFitness.js';
import { ARCHIVOS_FITNESS } from '../src/lib/feedbackFitness.js';
import { DEFAULT_FITNESS, GRUPOS_MUSCULARES } from '../src/lib/fitness.js';
import { CATALOGO_EJERCICIOS, ejercicioPorId } from '../src/lib/ejercicios.js';
import { normalizarFitnessConSesiones } from '../src/lib/entrenamiento.js';
import { historialDeRango, momentosDe, rangoDeDestino } from '../src/lib/historialRangos.js';
import { rangosEfectivos, rangoGlobalEfectivo } from '../src/lib/motorRangos.js';
import { rangoDeGrupo, rangoDeSubgrupo } from '../src/lib/rangos.js';
import { repartoMuscular } from '../src/lib/progresoMuscular.js';
import { relevanciaDeEjercicio } from '../src/lib/clasificacion.js';
import { progresoDeEjercicio } from '../src/lib/progresion.js';
import { indicesConMarca, MARCAS_MAXIMAS_GRAFICA } from '../src/lib/progresoEjercicios.js';
import { resumenDeRangos } from '../src/lib/resumenRangos.js';
import { centroDeProgreso } from '../src/lib/resumenProgreso.js';
import { consultarBiblioteca } from '../src/lib/bibliotecaEjercicios.js';
import { sesionesDelHistorial, fichaDeHistorial, consultarHistorial } from '../src/lib/historial.js';
import { resumenDeActividad } from '../src/lib/actividadEntrenamiento.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const HOY = '2026-09-17';

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}
const cargar = (crudo) => normalizarFitnessConSesiones({ ...DEFAULT_FITNESS, ...crudo });

/* ═══ 1 · El historial incremental da lo mismo (apartados 11, 12 y 59) ═════ */
console.log('\n── 1 · El historial incremental da lo mismo que el cálculo entero (apartado 59) ──');

/* La referencia es el algoritmo de antes, escrito con las funciones públicas:
   para cada día, el rango con LO QUE HABÍA HASTA ESE DÍA (F22, apartado 12),
   calculado entero, sin memoria. */
const hastaElDia = (f, fecha) => ({
  ...f,
  sesiones: (f.sesiones || []).filter((s) => s && s.estado === 'completada' && typeof s.fecha === 'string' && s.fecha && s.fecha <= fecha),
  clasificaciones: (f.clasificaciones || []).filter((c) => {
    if (!c || c.puntuacion === null || c.puntuacion === undefined) return false;
    const t = Number.isFinite(c.actualizadoEn) ? c.actualizadoEn : c.creadoEn;
    if (!Number.isFinite(t)) return false;
    const x = new Date(t);
    const dia = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    return dia <= fecha;
  }),
});
function historialDeReferencia(f, destino, propios) {
  const puntos = [];
  momentosDe(f, destino, { propios }).forEach((d) => {
    const r = rangoDeDestino(hastaElDia(f, d.fecha), destino, { propios });
    if (!r || r.sinRango) return;
    const previo = puntos[puntos.length - 1];
    if (previo && previo.rango === r.rango && previo.score === r.score) return;
    puntos.push({ fecha: d.fecha, rango: r.rango, score: r.score, confianza: r.confianza ?? null, fuente: r.fuente ?? null });
  });
  return puntos;
}
const resumir = (p) => ({ fecha: p.fecha, rango: p.rango, score: p.score, confianza: p.confianza ?? null, fuente: p.fuente ?? null });

/* Un escenario con todo lo que puede torcer una memoria: sesiones desordenadas,
   dos el mismo día, una sin fecha, una en curso, una descartada, estimaciones y
   una RECLASIFICACIÓN (que hace desaparecer la anterior, apartado 9). */
function escenarioRevuelto({ dividida }) {
  const e = escenarioGrande({ sesiones: 90, propios: 3, clasificaciones: 12, hoy: HOY, dividida });
  const s = e.fitness.sesiones;
  const revueltas = s.map((x, i) => [((i * 37) % 97) + i / 1000, x]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const mismoDia = { ...s[40], id: 'mismo-dia', origen: { ...s[40].origen, ejercicios: s[41].origen.ejercicios.map((l) => ({ ...l, id: `md-${l.id}` })) } };
  const sinFecha = { ...s[10], id: 'sin-fecha', fecha: '' };
  const enCurso = { ...s[89], id: 'en-curso', estado: 'en_curso' };
  const descartada = { ...s[88], id: 'descartada', estado: 'descartada' };
  const propio = e.fitness.ejercicios[0];
  const conPropio = { ...s[70], id: 'con-propio', origen: { ...s[70].origen, ejercicios: [{ ...s[70].origen.ejercicios[0], id: 'cp-0', exerciseId: propio.id }] } };
  return cargar({ ...e.fitness, sesiones: [...revueltas, mismoDia, sinFecha, enCurso, descartada, conPropio] });
}

let comparados = 0;
let conCambios = 0;
for (const dividida of [false, true]) {
  const f = escenarioRevuelto({ dividida });
  const propios = f.ejercicios;
  const ids = [...new Set(f.sesiones.flatMap((s) => (s.origen?.ejercicios || []).map((l) => l.exerciseId)))];
  const destinos = [
    { tipo: 'overall', id: '' },
    ...GRUPOS_MUSCULARES.map((g) => ({ tipo: 'muscleGroup', id: g.id })),
    ...GRUPOS_MUSCULARES.flatMap((g) => g.subgrupos.slice(0, 1)).map((sg) => ({ tipo: 'subgroup', id: sg.id })),
    ...ids.slice(0, 4).map((id) => ({ tipo: 'exercise', id })),
    { tipo: 'exercise', id: f.clasificaciones[0].exerciseId },
    { tipo: 'exercise', id: propios[0].id },
  ];
  let iguales = true;
  let primero = null;
  for (const d of destinos) {
    const h = historialDeRango(f, d, { propios });
    const ref = historialDeReferencia(f, d, propios);
    const a = JSON.stringify(h.puntos.map(resumir));
    const b = JSON.stringify(ref);
    comparados += ref.length;
    if (h.cambios.length) conCambios += 1;
    if (a !== b) { iguales = false; if (!primero) primero = `${d.tipo}:${d.id} (${h.puntos.length} frente a ${ref.length} puntos)`; }
    const actual = rangoDeDestino(f, d, { propios });
    if (JSON.stringify(h.actual && resumir({ ...h.actual, fecha: '' })) !== JSON.stringify(actual && !actual.sinRango ? resumir({ ...actual, fecha: '' }) : null)) {
      iguales = false; if (!primero) primero = `${d.tipo}:${d.id} (el rango actual)`;
    }
  }
  ok(iguales, `🚨 ${dividida ? 'Rutina dividida' : 'Cuerpo completo'} — los ${destinos.length} historiales (global, cada grupo, subgrupos y ejercicios) son IDÉNTICOS punto a punto al cálculo entero${primero ? ` — distinto en ${primero}` : ''}`);
}
ok(comparados > 200 && conCambios >= 3,
  `…y no es un empate por vacío: se han comparado ${comparados} puntos y ${conCambios} historiales con cambios de rango`);

/* ═══ 2 · La memoria reutiliza lo que no cambió (apartado 12) ═══════════════ */
console.log('\n── 2 · La memoria reutiliza lo que no cambió y rehace lo que sí (apartado 12) ──');
{
  const f = cargar(escenarioGrande({ sesiones: 30, hoy: HOY }).fitness);
  const memo = { filas: new Map(), afectados: new Set() };
  const primera = rangosEfectivos(f, { memo });
  const sinMemo = rangosEfectivos(f);
  ok(JSON.stringify(primera) === JSON.stringify(sinMemo), 'Con memoria vacía, la lista es la misma que sin ella (mismo orden, mismos rangos)');
  const tocado = primera[0].exerciseId;
  memo.afectados = new Set([tocado]);
  const segunda = rangosEfectivos(f, { memo });
  ok(segunda.slice(1).every((x, i) => x === primera[i + 1]), '🚨 Los ejercicios que no cambiaron se REUTILIZAN (el mismo objeto): no se recalcula todo Fitness');
  ok(segunda[0] !== primera[0] && JSON.stringify(segunda[0]) === JSON.stringify(primera[0]),
    '…y el que cambió se RECALCULA (otro objeto, mismo resultado porque aquí no cambió nada de verdad)');
  const g1 = rangoGlobalEfectivo(f);
  const g2 = rangoGlobalEfectivo(f, { efectivos: segunda });
  ok(JSON.stringify(g1) === JSON.stringify(g2), 'El rango global con las filas de la memoria es el mismo que calculándolas');
}

/* ═══ 3 · La caché del historial se tira al cambiar lo que importa (apartado 13) ═ */
console.log('\n── 3 · 🐛 La caché del historial se tira al clasificar y al cambiar los propios (apartado 13) ──');
{
  const base = cargar(escenarioGrande({ sesiones: 12, hoy: HOY }).fitness);
  const sinEntrenar = CATALOGO_EJERCICIOS.find((e) => !e.archivado && !base.sesiones.some((s) => (s.origen?.ejercicios || []).some((l) => l.exerciseId === e.id))
    && (e.medidas || []).includes('reps'));
  const d = { tipo: 'exercise', id: sinEntrenar.id };
  const antes = historialDeRango(base, d);
  ok(antes.actual === null && historialDeRango(base, d) === antes, 'Sin datos de ese ejercicio no hay rango, y pedirlo dos veces da el MISMO objeto (la caché funciona)');
  const t = new Date(2026, 8, 15, 12).getTime();
  const conClas = { ...base, clasificaciones: [{ id: 'c-f40', exerciseId: sinEntrenar.id, respuesta: 'x', puntuacion: 520, fuente: 'cuestionario', confianza: 'baja', creadoEn: t, actualizadoEn: null }] };
  ok(conClas.sesiones === base.sesiones, '(guardar una clasificación deja la MISMA lista de sesiones: es lo que engañaba a la caché)');
  const despues = historialDeRango(conClas, d);
  const fresco = historialDeRango({ ...conClas, sesiones: [...conClas.sesiones] }, d);
  ok(despues.actual !== null && despues.puntos.length === fresco.puntos.length && JSON.stringify(despues.actual) === JSON.stringify(fresco.actual),
    `🐛 FIT F40 — tras clasificar, el historial dice lo nuevo (${despues.puntos.length} punto${despues.puntos.length === 1 ? '' : 's'}, rango ${despues.actual && despues.actual.nombre}), no lo de antes de clasificar`);
  const propiosA = [{ ...ejercicioPorId('press-banca-barra'), id: 'mi-press', nombre: 'Mi press' }];
  const propiosB = [{ ...ejercicioPorId('sentadilla-barra'), id: 'mi-press', nombre: 'Mi press' }];
  const hA = historialDeRango(base, { tipo: 'muscleGroup', id: GRUPOS_MUSCULARES[0].id }, { propios: propiosA });
  const hB = historialDeRango(base, { tipo: 'muscleGroup', id: GRUPOS_MUSCULARES[0].id }, { propios: propiosB });
  ok(hA !== hB, '…y con otros ejercicios propios (aunque sean los mismos en número) no reutiliza el de antes: la llave contaba cuántos, no cuáles');
}

/* ═══ 4 · Cada caché nueva devuelve lo mismo que sin ella (apartados 35 y 58) ═ */
console.log('\n── 4 · Cada caché nueva devuelve lo mismo que sin ella (apartados 35 y 58) ──');
{
  const ej = ejercicioPorId('dominada-prona');
  const r1 = repartoMuscular(ej);
  const copia = JSON.parse(JSON.stringify(ej));
  const r2 = repartoMuscular(copia);
  ok(repartoMuscular(ej) === r1, 'El reparto de una ficha se calcula una vez (la segunda vez, el mismo objeto)');
  ok(r1 !== r2 && JSON.stringify(r1) === JSON.stringify(r2), '…y es igual al de una copia recién hecha, que no tiene caché');
  ok(Object.isFrozen(r1) && r1.every((x) => Object.isFrozen(x)), '⚠️ …y está CONGELADO: compartido entre todos, nadie puede estropearlo en silencio');
  let lanza = false;
  try { r1.push({}); } catch { lanza = true; }
  ok(lanza, '…intentar tocarlo lanza un error en vez de callar');
  ok(relevanciaDeEjercicio(ej) === relevanciaDeEjercicio(copia), 'La relevancia (F17) memorizada es la misma que la de una copia sin memoria');

  const f = cargar(escenarioGrande({ sesiones: 40, hoy: HOY }).fitness);
  const filas = rangosEfectivos(f);
  const desnudas = filas.map((x) => ({ ...x, reparto: x.reparto.map((p) => ({ ...p })) }));
  ok(!Object.isFrozen(desnudas[0].reparto), '(una lista con repartos sin congelar, escritos a mano)');
  ok(GRUPOS_MUSCULARES.every((g) => JSON.stringify(rangoDeGrupo(filas, g.id)) === JSON.stringify(rangoDeGrupo(desnudas, g.id)))
    && GRUPOS_MUSCULARES.flatMap((g) => g.subgrupos).every((sg) => JSON.stringify(rangoDeSubgrupo(filas, sg.id)) === JSON.stringify(rangoDeSubgrupo(desnudas, sg.id))),
    '🚨 Los rangos de los siete grupos y de todos sus subgrupos son idénticos con los pesos memorizados y sumando cada vez');

  const id = f.sesiones[0].origen.ejercicios[0].exerciseId;
  const otraVez = cargar(escenarioGrande({ sesiones: 40, hoy: HOY }).fitness);
  ok(otraVez.sesiones[0] !== f.sesiones[0] && JSON.stringify(progresoDeEjercicio(f, id)) === JSON.stringify(progresoDeEjercicio(otraVez, id)),
    'Las apariciones memorizadas por sesión dan el mismo progreso (F11) que unas sesiones recién cargadas');
}

/* ═══ 5 · La gráfica (apartado 41) ══════════════════════════════════════════ */
console.log('\n── 5 · La gráfica: como mucho 40 puntos que tocar, sin perder lo importante (apartado 41) ──');
{
  const pocos = Array.from({ length: 12 }, (_, i) => ({ valor: i }));
  ok(JSON.stringify(indicesConMarca(pocos)) === JSON.stringify(pocos.map((_, i) => i)), 'Con pocos registros, todos llevan marca: no se esconde nada');
  const muchos = Array.from({ length: 300 }, (_, i) => ({ valor: 50 + Math.round(20 * Math.sin(i / 7)) + (i === 137 ? 90 : 0) - (i === 211 ? 70 : 0) }));
  const m = indicesConMarca(muchos);
  ok(m.length <= MARCAS_MAXIMAS_GRAFICA && m.length >= MARCAS_MAXIMAS_GRAFICA - 4, `Con 300, se tocan ${m.length} (como mucho ${MARCAS_MAXIMAS_GRAFICA})`);
  ok(m.includes(0) && m.includes(299), '…siempre el primero y el último');
  ok(m.includes(137) && m.includes(211), '🚨 …y el MEJOR y el PEOR, aunque caigan entre dos marcas: son lo que no se puede perder');
  ok(m.every((x, i) => i === 0 || x > m[i - 1]), '…en orden y sin repetir');
  const vista = leer('src/views/ProgresoView.jsx');
  ok(/indicesConMarca\(puntos\)/.test(vista) && /const camino = puntos\.map/.test(vista),
    '…y la línea sigue pasando por TODOS los puntos: se limitan las marcas, no los datos');
}

/* ═══ 6 · Los presupuestos, sobre el escenario grande (apartados 50-54) ═════ */
console.log('\n── 6 · Los presupuestos, sobre el escenario grande (apartados 50 a 54) ──');
{
  const e = escenarioGrande({ ...ESCENARIO_PRESUPUESTO, hoy: HOY });
  ok(e.fitness.sesiones.length === ESCENARIO_PRESUPUESTO.sesiones && e.fitness.ejercicios.length === ESCENARIO_PRESUPUESTO.propios
    && e.fitness.objetivos.length === ESCENARIO_PRESUPUESTO.objetivos && e.fotos.length === ESCENARIO_PRESUPUESTO.fotos,
    `El escenario tiene lo pedido: ${ESCENARIO_PRESUPUESTO.sesiones} sesiones, ${ESCENARIO_PRESUPUESTO.propios} ejercicios propios, ${ESCENARIO_PRESUPUESTO.objetivos} objetivos y ${ESCENARIO_PRESUPUESTO.fotos} fotos`);
  ok(JSON.stringify(escenarioGrande({ sesiones: 20, hoy: HOY })) === JSON.stringify(escenarioGrande({ sesiones: 20, hoy: HOY })), '…y sin azar: dos veces, lo mismo');
  const medir = (id, fn) => {
    const t0 = performance.now();
    fn();
    const ms = performance.now() - t0;
    const p = presupuestoFitness(id);
    ok(p && ms <= p.ms, `${p ? p.nombre : id}: ${Math.round(ms)} ms (techo ${p ? p.ms : '?'} ms; antes: ${p ? p.antes : '?'})`);
  };
  /* ⚠️ Cada medida con su propia carga: las cachés van por objeto, y medir la
     segunda con lo que dejó la primera sería medir la caché. */
  { const f = cargar(e.fitness); medir('resumen_rangos', () => resumenDeRangos(f, { propios: f.ejercicios })); }
  { const f = cargar(e.fitness); medir('centro_progreso', () => centroDeProgreso(f, e.fotos, { propios: f.ejercicios, hoy: HOY })); }
  { const f = cargar(e.fitness); medir('biblioteca', () => consultarBiblioteca({ consulta: 'press', filtros: {}, propios: f.ejercicios })); }
  { const f = cargar(e.fitness); medir('historial', () => consultarHistorial(sesionesDelHistorial(f).map((s) => fichaDeHistorial(s, { fitness: f, hoy: HOY })), {}, { hoy: HOY })); }
  { const f = cargar(e.fitness); medir('actividad', () => resumenDeActividad(f, { hoy: HOY })); }
  ok(PRESUPUESTOS_FITNESS.every((p) => p.ms > 0 && p.antes), 'Cada presupuesto es un número, con lo que había antes');
  const div = escenarioGrande({ sesiones: 30, hoy: HOY, dividida: true }).fitness.sesiones;
  ok(div.every((s) => new Set(s.origen.ejercicios.map((l) => l.exerciseId)).size >= 1) && div.length === 30, 'El escenario dividido (push/pull/pierna) también se genera');
}

/* ═══ 7 · La auditoría del código (apartados 25-28, 37, 40, 55-57) ═══════════ */
console.log('\n── 7 · La auditoría del código (apartados 25-28, 29, 37, 40 y 55-57) ──');
{
  const rutas = [...ARCHIVOS_FITNESS, ...HOOKS_FITNESS].filter((p) => existsSync(join(RAIZ, p)));
  ok(rutas.length === ARCHIVOS_FITNESS.length + HOOKS_FITNESS.length, `Lee los ${rutas.length} archivos de Fitness y sus dos ganchos, sin que falte ninguno`);
  const a = auditarRendimientoFitness({ archivos: Object.fromEntries(rutas.map((p) => [p, leer(p)])) });
  a.casillas.forEach((c) => ok(c.ok, `${c.texto}${c.ok ? '' : ` — ${JSON.stringify(c.problemas.slice(0, 3))}`}`));
  CASILLAS_RENDIMIENTO.forEach((c) => ok(c.revisa(c.ejemploMalo).length > 0, `⚠️ «${c.id}» caza su ejemplo malo (una auditoría que no puede ponerse roja no sirve)`));
  ok(clavesPorIndice("['L','M'].map((l, i) => <span key={i}>{l}</span>)").length === 0,
    '…y una lista SIN id (las letras de la semana) sí puede ir por posición: no hay otra cosa');
  ok(clavesPorIndice('xs.map((x, i) => <G key={x.sesionId + i} onClick={() => f(x.id)} />)').length === 0, '…ni la caza si la clave ya lleva el id');
  ok(relojFueraDeSuSitio('function useAhora(a) { return 1; }\nexport function RelojSesion() { const t = useAhora(true); }').length === 0,
    `…el reloj solo puede latir en ${RELOJES_PERMITIDOS.join(', ')}`);
  ok(intervalosSinLimpiar('useEffect(() => { const t = setInterval(f, 1); return () => clearInterval(t); }, []);').length === 0
    && escuchadoresSinQuitar("addEventListener('keydown', f); removeEventListener('keydown', f);").length === 0,
    '…y lo que se limpia bien no la pone roja');
  ok(guardadoPorTecla('onChange={(ev) => { setTexto(ev.target.value); confirmarLuego(ev.target.value); }}').length === 0,
    '…programar el guardado (confirmarLuego) no es guardar en cada tecla');
}

/* ═══ 8 · El autoguardado (apartados 29-34) ═════════════════════════════════ */
console.log('\n── 8 · Lo que se escribe se guarda una vez, y no se pierde (apartados 29 a 34) ──');
{
  const vivo = leer('src/views/EntrenamientoVivoView.jsx');
  ok(RETARDO_AUTOGUARDADO_MS > 0 && RETARDO_AUTOGUARDADO_MS <= 1000, `Un solo retardo para guardar lo escrito: ${RETARDO_AUTOGUARDADO_MS} ms (perceptiblemente inmediato, apartado 5)`);
  ok((vivo.match(/RETARDO_AUTOGUARDADO_MS/g) || []).length >= 3, '…el mismo para el peso y para la nota: no dos números para lo mismo');
  ok(/document\.addEventListener\('visibilitychange'/.test(vivo) && /window\.addEventListener\('pagehide'/.test(vivo),
    '🚨 Lo pendiente se guarda al esconderse la página (apartado 33: *"por cerrar accidentalmente la aplicación"*)');
  ok(/onBlur=\{\(ev\) => \{ setTocando\(false\); if \(reloj\.current\) confirmar/.test(vivo), '…y al salir del campo, al momento: pulsar ✓ no espera');
  ok(/guardarNotaPendiente\(\);\s*\n\s*notaPara\.current/.test(vivo) && /useEffect\(\(\) => \(\) => guardarNotaPendiente\(\)/.test(vivo),
    '🐛 La nota pendiente se guarda al cerrar el panel, al cambiar de ejercicio y al salir');
  ok(/editarSerie\(sesionViva\.current/.test(vivo), '⚠️ …y lo que se confirma tarde va sobre la sesión de AHORA (dos escrituras seguidas se pisan, E3 F26)');
}

/* ═══ 9 · Lo que ya existía, lo optimizado, lo descartado ════════════════════ */
console.log('\n── 9 · Lo que ya existía, lo optimizado, lo descartado y lo que no se hace ──');
{
  const aps = YA_EXISTIA_F40.map((y) => y.apartado);
  ok(aps.length === new Set(aps).size && YA_EXISTIA_F40.every((y) => y.que && y.donde), `${YA_EXISTIA_F40.length} apartados ya los resolvía otra fase, cada uno con dónde`);
  ok(OPTIMIZACIONES_F40.every((o) => o.medido && o.archivo.split(' · ').every((r) => existsSync(join(RAIZ, r)))),
    `${OPTIMIZACIONES_F40.length} optimizaciones, cada una con su medida y archivos que existen`);
  ok(DESCARTADO_F40.every((d) => d.que && d.porque.length > 40) && DESCARTADO_F40.some((d) => /8 %/.test(d.porque)),
    'Lo medido y descartado, con su porqué (reutilizar grupos enteros: un 8 %)');
  ok(NO_EN_FIT40.every((n) => n.que && n.porque.length > 40) && NO_EN_FIT40.some((n) => /C-42/.test(n.porque)),
    'Lo que no se hace, con su motivo —dividir el bundle es la C-42, que decide Josué—');
  ok(DECISIONES_FIT40.length === 4 && DECISIONES_FIT40.every((d) => d.id && d.texto), 'Las cuatro decisiones');
  ok(/C-42/.test(leer('docs/03_CONTRADICCIONES_DUPLICADOS_DEPENDENCIAS.md')), '…y la C-42 está escrita en docs/03');
  /* ⚠️ Sin comentarios NI cadenas: `NO_EN_FIT40` nombra `localStorage` justo
     para declarar que no se toca, y un barrido que mira la tabla que declara lo
     que busca salta con el código bien (FIT F25, F28 y F30). */
  const codigo = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''").replace(/`(?:[^`\\]|\\.)*`/g, '``');
  const lib = codigo(leer('src/lib/rendimientoFitness.js'));
  ok(!/saveData|localStorage|setItem|guardarFitness/.test(lib), '🚨 La fase no guarda nada por su cuenta');
  ok(/saveData\(/.test(codigo("const x = 'hola'; saveData(uid, 'fitness', f);")), '…y el barrido sigue cazando una escritura de verdad');
  ok(!/from '\.\/(motorRangos|rangos|historialRangos)\.js'/.test(lib) && !/RANK_THRESHOLDS/.test(lib),
    '🚨 …y no toca ni una fórmula de rangos ni de progreso: optimiza CÓMO se calcula, no QUÉ');
}

console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}FIT F40: ${total - fallos}/${total} — ${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
