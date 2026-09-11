// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 38 (NU F6) — ESTADÍSTICAS Y EVOLUCIÓN NUTRICIONAL
// ══════════════════════════════════════════════════════════════════════════
//
// El apartado 13 es el que manda: *"Todas las estadísticas deben utilizar
// exclusivamente los datos realmente almacenados. NO: inventar datos, rellenar
// días automáticamente, mostrar porcentajes falsos, simular una evolución."*
// Así que buena parte de estas comprobaciones miran que un día sin registrar
// **sea un hueco y no un cero**, que un porcentaje sin objetivo **sea `null`**,
// y que la constancia **no sea una racha** (apartado 8, literal).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  IDS_PERIODO_NUT, PERIODOS_NUT, PERIODO_NUT_POR_DEFECTO, periodoNut,
  diasDelPeriodo, MINIMO_DIAS_ESTADISTICA, promediosDelPeriodo, cumplimientoDelPeriodo,
  evolucion, inicialDeDia, MACROS_EVOLUCION,
  NO_ES_RACHA, constancia,
  MINIMO_DIAS_MEJOR_PEOR, TEXTO_SIN_DATOS_NUT, cumplimientoDeUnDia, mejorYPeorDia,
  analisisProteina, TENDENCIAS, MARGEN_TENDENCIA, analisisCalorias,
  VACIO_ESTADISTICAS, ACCESO_ESTADISTICAS, hayEstadisticas,
  NO_EN_NU6, AUDITORIA_NU6, condicionNU6,
} from '../src/lib/estadisticasNutricion.js';
import { PERIODOS } from '../src/lib/estadisticasPlan.js';
import { INDICADORES } from '../src/lib/nutricion.js';
import { objetivosParaResumen } from '../src/lib/objetivosNutricion.js';
import { addDays } from '../src/lib/helpers.js';

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

const HOY = '2026-09-07';
const VISTA = leer('src/views/NutritionView.jsx');
const CODIGO_VISTA = soloCodigo(VISTA);
const LIB = leer('src/lib/estadisticasNutricion.js');
const CODIGO = soloCodigo(LIB);

const OBJETIVOS = {
  configurado: true, kcal: 2400, proteinas: 140, carbohidratos: 300, grasas: 70,
  actividad: 'moderado', objetivo: 'mantener', manual: {}, pesoAlCalcular: 72, fecha: HOY,
};
/* Tres días registrados de siete: hoy corto, ayer justo y anteayer muy corto. */
const NUT = {
  comidas: [
    { id: 'a', fecha: HOY, nombre: 'A', calorias: 2000, proteinas: 120, carbohidratos: 250, grasas: 60 },
    { id: 'b', fecha: addDays(HOY, -1), nombre: 'B', calorias: 2400, proteinas: 140, carbohidratos: 300, grasas: 70 },
    { id: 'c', fecha: addDays(HOY, -2), nombre: 'C', calorias: 1600, proteinas: 100, carbohidratos: 200, grasas: 50 },
  ],
  objetivos: OBJETIVOS,
};
const SIN_OBJETIVOS = { comidas: NUT.comidas };

console.log('\n══ E3 · Fase 38 (NU F6) — las estadísticas de Nutrición ══');

console.log('\n── 1. 🚨 Ni una cifra guardada, ni una segunda fuente (16) ──────');
eq(AUDITORIA_NU6.cifrasGuardadas, 0, 'no se guarda ni un promedio');
eq(AUDITORIA_NU6.clavesNuevas, 0, '⚠️ ni una clave nueva de `app_data`');
eq(AUDITORIA_NU6.datosInventados, 0, '⚠️ ni un dato inventado (apartado 13)');
ok(!/saveData|snapshotAndSave|setNutricion/.test(CODIGO),
  '🚨 y el archivo NO ESCRIBE: una estadística guardada miente en cuanto él borra un registro (E3 F13)');
ok(!/normalizar[A-Z]/.test(CODIGO), '⚠️ por eso tampoco tiene normalizador propio: no hay nada que normalizar');
/* Y sale de lo que ya existe, no de una lista paralela (apartado 16). */
ok(/from '\.\/nutricion\.js'/.test(LIB) && /from '\.\/objetivosNutricion\.js'/.test(LIB),
  '⚠️ lee las comidas y los objetivos que ya existen');
ok(/from '\.\/estadisticasPlan\.js'/.test(LIB),
  '⚠️ y reutiliza `rangoDelPeriodo` y los nombres de día de la E3 F13');
ok(!/function rangoDelPeriodo|const NOMBRES_DIA/.test(CODIGO), '⚠️ sin reescribirlos');

console.log('\n── 2. 🚨 Y NI UN SISTEMA DE RACHAS (apartado 8, literal) ────────');
/* *"No crear todavía un sistema de rachas independiente que duplique el sistema
   global."* Se busca el MECANISMO —los imports—, no la palabra: el propio
   archivo la nombra para prometer que no la construye. */
const imports = (LIB.match(/^import[\s\S]*?from\s+'[^']+';/gm) || []).join('\n');
ok(!/rachas/i.test(imports),
  '🚨 no importa NADA de `rachas.js` ni de `rachasServicio.js`');
/* 🐛 **Y aquí saltaba con la frase que hace la promesa**: la constante se llama
   `NO_ES_RACHA`, y un barrido de «racha» la encontraba. Decimotercera vez de
   esta lección, así que se comprueba **el comportamiento**, que es lo que de
   verdad distingue un recuento de una racha: tres días **sueltos** cuentan lo
   mismo que tres **seguidos**. Una racha diría 1 y 3. */
const seguidos = constancia([
  { id: '1', fecha: HOY, calorias: 100 },
  { id: '2', fecha: addDays(HOY, -1), calorias: 100 },
  { id: '3', fecha: addDays(HOY, -2), calorias: 100 },
], '7d', HOY);
const sueltos = constancia([
  { id: '1', fecha: HOY, calorias: 100 },
  { id: '2', fecha: addDays(HOY, -3), calorias: 100 },
  { id: '3', fecha: addDays(HOY, -6), calorias: 100 },
], '7d', HOY);
eq(sueltos.registrados, seguidos.registrados,
  '🚨 y NO CALCULA UNA RACHA: tres días sueltos cuentan lo mismo que tres seguidos');
eq(sueltos.registrados, 3, '⚠️ los tres, en los dos casos');
eq(AUDITORIA_NU6.rachasPropias, 0, '⚠️ y está declarado');
ok(/no mira si son seguidos/i.test(NO_ES_RACHA),
  '🚨 Y LA PANTALLA LO DICE: es un recuento, no una racha');
ok(CODIGO_VISTA.includes('NO_ES_RACHA'), '⚠️ y lo enseña de verdad');
ok(NO_EN_NU6.some((x) => /rachas/i.test(x.que)), '⚠️ con su línea en lo que no se hace');

console.log('\n── 3. El rango temporal (apartado 6) ────────────────────────────');
eq(PERIODOS_NUT.map((p) => p.dias), [7, 30, 90], '7, 30 y 90 días, los tres del enunciado');
ok(IDS_PERIODO_NUT.every((id) => PERIODOS.some((p) => p.id === id)),
  '🚨 y son los periodos de la E3 F13, declarados por su id: renombrar uno allí rompe esto (EH F26)');
ok(!/dias:\s*\d+/.test(CODIGO), '⚠️ sin reescribir cuántos días son');
eq(PERIODO_NUT_POR_DEFECTO, '7d', '⚠️ se entra por 7 días, que es el resumen semanal del apartado 2');
eq(periodoNut('inventado').id, '7d', '⚠️ y un periodo que no existe cae en el de siempre');
eq(diasDelPeriodo(NUT.comidas, '30d', HOY).length, 30, '⚠️ 30 días son 30 días');
eq(diasDelPeriodo(NUT.comidas, '3m', HOY).length, 90, '⚠️ y 90, noventa');

console.log('\n── 4. 🚨 Un día sin registrar NO es un cero (apartados 7 y 13) ──');
const dias = diasDelPeriodo(NUT.comidas, '7d', HOY);
eq(dias.length, 7, 'siete días de CALENDARIO, aunque solo tres tengan datos (E3 F32)');
eq(dias.filter((d) => d.tieneDatos).length, 3, '⚠️ tres con datos');
ok(dias.filter((d) => !d.tieneDatos).every((d) => d.totales.calorias === null),
  '🚨 Y LOS OTROS CUATRO SON `null`, NO CERO: un cero diría que ese día comió cero');
eq(dias[dias.length - 1].fecha, HOY, '⚠️ el último es hoy');
eq(dias[0].fecha, addDays(HOY, -6), '⚠️ y el primero, seis días atrás');
eq(diasDelPeriodo([], '7d', HOY).filter((d) => d.tieneDatos).length, 0, '⚠️ sin comidas no revienta');

console.log('\n── 5. El promedio, sobre los días CON datos (apartado 14) ───────');
const prom = promediosDelPeriodo(NUT.comidas, '7d', HOY);
eq(prom.promedio.calorias, 2000, '🚨 (2000 + 2400 + 1600) / 3 = 2000, el criterio literal del apartado 14');
eq(prom.diasConDatos, 3, '⚠️ con cuántos días se ha calculado');
eq(prom.diasDelRango, 7, '⚠️ y de cuántos');
eq(prom.promedio.proteinas, 120, '⚠️ y lo mismo con los macros');
ok(prom.promedio.calorias !== Math.round((2000 + 2400 + 1600) / 7),
  '🚨 NO se divide entre los 7 días: castigaría por los días que no registró (E3 F24)');
eq(promediosDelPeriodo([], '7d', HOY).promedio.calorias, null,
  '🚨 y sin ni un día con datos es `null`, no un cero (apartado 12)');
eq(promediosDelPeriodo([], '7d', HOY).suficientes, false, '⚠️ y se dice que no son suficientes');
ok(MINIMO_DIAS_ESTADISTICA >= 2, '⚠️ el mínimo está declarado, no escrito a mano en la vista');

console.log('\n── 6. El cumplimiento (apartado 3) ──────────────────────────────');
const cump = cumplimientoDelPeriodo(NUT, '7d', HOY);
eq(cump.lineas.length, 4, 'los cuatro indicadores de siempre');
eq(cump.lineas[0].porcentaje, 83, '2000 de 2400 es un 83 %');
eq(cump.lineas[0].texto, '2000 / 2400 kcal', '⚠️ con el mismo texto que la pantalla principal');
ok(cump.hayObjetivos, '⚠️ y se sabe que hay objetivos');
/* 🚨 Sin objetivos no hay cumplimiento: `null`, nunca un 0 %. */
const sinObj = cumplimientoDelPeriodo(SIN_OBJETIVOS, '7d', HOY);
ok(sinObj.lineas.every((l) => l.porcentaje === null && l.objetivo === null),
  '🚨 SIN OBJETIVOS NO HAY CUMPLIMIENTO: `null`, no un 0 % que diría que va fatal');
ok(sinObj.lineas.every((l) => l.promedio !== null),
  '⚠️ pero los promedios se siguen enseñando: eso sí es un dato suyo');
eq(sinObj.hayObjetivos, false, '⚠️ y la pantalla lo sabe para decir dónde se configuran');
/* La barra se topa y el dato no — la decisión de la E3 F35 y la E3 F36. */
const pasado = cumplimientoDelPeriodo({ comidas: [{ id: 'x', fecha: HOY, calorias: 3000, proteinas: 200, carbohidratos: 400, grasas: 100 }], objetivos: OBJETIVOS }, '7d', HOY);
ok(pasado.lineas[0].porcentaje > 100, 'pasarse del objetivo da más del 100 % en el dato');
eq(pasado.lineas[0].porcentajePintado, 100, '🚨 pero la barra se topa en 100: no se rompe (E3 F36)');

console.log('\n── 7. La evolución (apartados 4 y 5) ────────────────────────────');
const evo = evolucion(NUT, 'calorias', '7d', HOY);
eq(evo.puntos.length, 7, 'un punto por día de calendario');
eq(evo.objetivo, 2400, '⚠️ con el objetivo, para verlo en la gráfica (apartado 4)');
eq(evo.puntos.filter((p) => p.valor === null).length, 4,
  '🚨 Y LOS DÍAS SIN DATOS SON HUECOS (`null`), que la línea NO cruza (E3 F32)');
eq(evo.huecos, 4, '⚠️ y se dice cuántos son, en vez de disimularlos');
ok(evo.pintable, '⚠️ con tres días registrados sí se pinta');
ok(!evolucion({ comidas: [NUT.comidas[0]] }, 'calorias', '7d', HOY).pintable,
  '🚨 pero con UNO no: una línea de un punto no es una evolución (apartado 12)');
ok(CODIGO_VISTA.includes('connectNulls={false}'),
  '🚨 y la vista lo pinta con `connectNulls` en falso: cruzar el hueco inventaría un dato');
/* Apartado 4 — el eje horizontal es L M X J V S D. */
eq(['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13'].map(inicialDeDia).join(' '),
  'L M X J V S D', '🚨 el eje es «L M X J V S D», con la X del miércoles (apartado 4)');
ok(evolucion(NUT, 'calorias', '30d', HOY).puntos[0].etiqueta.length <= 2,
  '⚠️ y en 30 días la etiqueta es el día del mes: treinta «L M X» seguidos no se leen');
eq(MACROS_EVOLUCION.length, 3, 'los tres macros del selector (apartado 5)');
ok(!MACROS_EVOLUCION.includes('calorias'), '⚠️ las kcal tienen su propia gráfica, no están en el selector');
eq(evolucion(NUT, 'proteinas', '7d', HOY).indicador.id, 'proteinas', '⚠️ y cada macro tiene la suya');
eq(evolucion(NUT, 'inventado', '7d', HOY).indicador.id, INDICADORES[0].id, '⚠️ uno que no existe cae en el principal');

console.log('\n── 8. La constancia (apartados 7 y 8) ───────────────────────────');
const cons = constancia(NUT.comidas, '7d', HOY);
eq(cons.texto, '3 de 7 días registrados', '«3 de 7 días registrados»');
eq(cons.registrados, 3, '⚠️ con su número');
ok(cons.hayAlgo, '⚠️ y con algo registrado se enseña');
eq(constancia([], '7d', HOY).hayAlgo, false,
  '⚠️ pero sin nada NO se enseña un «0 de 7», que parece un reproche');
/* *"No considerar un día vacío como un día perfecto"* (apartado 7). */
ok(cons.registrados < cons.total, '🚨 un día vacío no cuenta como registrado (apartado 7)');

console.log('\n── 9. Mejor y peor día (apartado 9) ─────────────────────────────');
const mp = mejorYPeorDia(NUT, '7d', HOY);
ok(mp.hay, 'con tres días y objetivos, se puede comparar');
eq(mp.mejor.nombre, 'Domingo', 'el mejor es el domingo, que cumplió al 100 %');
eq(mp.mejor.cumplimiento, 100, '⚠️ con su porcentaje');
eq(mp.peor.nombre, 'Sábado', '⚠️ y el peor, el sábado, que fue el que más corto se quedó');
ok(mp.peor.cumplimiento < mp.mejor.cumplimiento, '⚠️ y el peor cumple menos que el mejor');
/* 🚨 Las dos puertas que lo apagan, cada una con su motivo. */
eq(mejorYPeorDia(SIN_OBJETIVOS, '7d', HOY).motivo, 'sin_objetivos',
  '🚨 SIN OBJETIVOS no hay cumplimiento que comparar');
eq(mejorYPeorDia({ comidas: [NUT.comidas[0]], objetivos: OBJETIVOS }, '7d', HOY).motivo, 'pocos_dias',
  '🚨 y con un solo día tampoco (apartado 9)');
ok(/más datos/i.test(TEXTO_SIN_DATOS_NUT), '⚠️ con la frase del enunciado, no dos tarjetas vacías');
ok(MINIMO_DIAS_MEJOR_PEOR >= 3, '⚠️ el mínimo está declarado');
/* ⚠️ Pasarse de un macro no compensa quedarse corto de otro. */
/* ⚠️ **Y se le pasa lo que devuelve `objetivosParaResumen`**, no lo guardado:
   ahí las calorías se llaman `kcal` y aquí `calorias`, así que darle la forma
   guardada dejaba las kcal fuera del cálculo **sin fallar**. Antes de pasarle un
   objeto a una función de otra fase, mirar qué forma espera (EH F18). */
const OBJ_RESUMEN = objetivosParaResumen(NUT);
eq(OBJ_RESUMEN.calorias, 2400, 'las kcal llegan como `calorias`, traducidas por la F35');
eq(cumplimientoDeUnDia({ tieneDatos: true, totales: { calorias: 4800, proteinas: 70, carbohidratos: 150, grasas: 35 } }, OBJ_RESUMEN), 63,
  '🚨 y pasarse de kcal NO compensa quedarse corto de proteína: cada indicador se topa al 100 %');
eq(cumplimientoDeUnDia({ tieneDatos: false, totales: {} }, OBJ_RESUMEN), null, '⚠️ un día sin datos no tiene cumplimiento');
eq(cumplimientoDeUnDia({ tieneDatos: true, totales: { calorias: 2400 } }, null), null, '⚠️ ni sin objetivos');

console.log('\n── 10. Proteína y calorías (apartados 10 y 11) ──────────────────');
const prot = analisisProteina(NUT, '7d', HOY);
eq(prot.texto, '120 g / 140 g', '«120 g / 140 g», como el ejemplo del apartado 10');
eq(prot.porcentaje, 86, '⚠️ con su porcentaje del objetivo');
eq(prot.diasAlcanzados, 1, '⚠️ y en cuántos días se alcanzó: solo uno de los tres');
eq(prot.diasConDatos, 3, '⚠️ sobre los días con datos, el mismo criterio de siempre');
eq(analisisProteina(SIN_OBJETIVOS, '7d', HOY).porcentaje, null, '⚠️ sin objetivo no hay porcentaje');
eq(analisisProteina(SIN_OBJETIVOS, '7d', HOY).texto, '120 g', '⚠️ pero el promedio se sigue enseñando');

const kcal = analisisCalorias(NUT, '7d', HOY);
eq(kcal.promedio, 2000, 'el promedio de kcal');
eq(kcal.objetivo, 2400, '⚠️ su objetivo');
eq(kcal.diferencia, -400, '🚨 y la diferencia CON SU SIGNO: −400 kcal (apartado 11)');
eq(analisisCalorias(SIN_OBJETIVOS, '7d', HOY).diferencia, null, '⚠️ sin objetivo no hay diferencia');
/* La tendencia compara con el periodo anterior de verdad, no con una estimación. */
const conAnterior = {
  comidas: [...NUT.comidas, { id: 'v', fecha: addDays(HOY, -8), nombre: 'V', calorias: 1000, proteinas: 50, carbohidratos: 100, grasas: 30 }],
  objetivos: OBJETIVOS,
};
eq(analisisCalorias(conAnterior, '7d', HOY).tendencia.id, 'sube',
  '⚠️ la tendencia sale de comparar con el periodo anterior de verdad');
eq(analisisCalorias(conAnterior, '7d', HOY).tendencia.diferencia, 1000, '⚠️ con su número');
eq(kcal.tendencia, null, '🚨 y sin periodo anterior con datos NO se inventa una tendencia (apartado 13)');
ok(MARGEN_TENDENCIA > 0, '⚠️ hay un margen: un gramo de diferencia no es una tendencia');
eq(TENDENCIAS.length, 3, '⚠️ sube, baja y parecido');

console.log('\n── 11. 🚨 Ni una interpretación (apartados 11, 14 y 25) ─────────');
/* *"No interpretar automáticamente esta diferencia como buena o mala."* Es la
   lección de la E3 F13 y la de EH F58, barriendo TODOS los textos generados. */
const TEXTOS = [
  ...TENDENCIAS.map((t) => t.nombre),
  NO_ES_RACHA, TEXTO_SIN_DATOS_NUT, VACIO_ESTADISTICAS.titulo, VACIO_ESTADISTICAS.detalle,
  ...NO_EN_NU6.map((x) => `${x.que} ${x.porque}`),
  constancia(NUT.comidas, '7d', HOY).texto,
  analisisProteina(NUT, '7d', HOY).texto,
];
const JUICIOS = /(vas bien|vas mal|mejor que|peor que|deberías|has fallado|te has pasado|demasiado|insuficiente|excelente|flojo|mal día|buen día)/i;
const conJuicio = TEXTOS.filter((t) => JUICIOS.test(String(t)));
ok(conJuicio.length === 0, `🚨 ningún texto generado juzga${conJuicio.length ? `: ${conJuicio.join(' | ')}` : ''}`);
ok(TENDENCIAS.every((t) => t.flecha), '⚠️ la tendencia es una FLECHA y un número, nunca un adjetivo');
ok(!/bueno|malo|correcto|incorrecto/i.test(TENDENCIAS.map((t) => t.nombre).join(' ')),
  '⚠️ «Más que antes» y «Menos que antes», nunca «mejor» y «peor»');

console.log('\n── 12. El estado sin datos (apartado 12) ────────────────────────');
eq(hayEstadisticas([], '7d', HOY), false, 'sin comidas no hay estadísticas');
eq(hayEstadisticas([NUT.comidas[0]], '7d', HOY), false, '⚠️ ni con un solo día: no se pinta una gráfica de un punto');
eq(hayEstadisticas(NUT.comidas, '7d', HOY), true, '⚠️ con tres, sí');
ok(/Tu evolución aparecerá aquí/.test(VACIO_ESTADISTICAS.titulo), 'con el texto del apartado 12, literal');
ok(/Registra tus comidas/.test(VACIO_ESTADISTICAS.detalle), '⚠️ y su explicación');
ok(!/error/i.test(VACIO_ESTADISTICAS.titulo + VACIO_ESTADISTICAS.detalle), '⚠️ que no suena a mensaje de error');

console.log('\n── 13. La pantalla (apartados 1, 15 y 17) ───────────────────────');
ok(CODIGO_VISTA.includes('EstadisticasNutricion'), 'la pantalla existe');
ok(/ACCESO_ESTADISTICAS/.test(CODIGO_VISTA), '⚠️ con su acceso dentro de Nutrición (apartado 1)');
ok(ACCESO_ESTADISTICAS.emoji === '📊' && CODIGO_VISTA.includes('ACCESO_ESTADISTICAS.emoji'),
  '⚠️ con su icono, que sale del catálogo y no escrito a mano en la pantalla');
ok(CODIGO_VISTA.includes('useMemo'),
  '⚠️ y los siete cálculos salen de UN solo `useMemo`: no se recalcula en cada pintado (apartado 17)');
ok(CODIGO_VISTA.includes('ResponsiveContainer'), '⚠️ la gráfica se adapta al ancho: nada de scroll horizontal (apartado 15)');
ok(!/#[0-9a-fA-F]{6}/.test(CODIGO_VISTA.split('EstadisticasNutricion')[1]?.slice(0, 9000) || ''),
  '🚨 y ni un hex suelto en lo nuevo: los colores son tokens (regla 2)');

console.log('\n── 14. Lo que esta fase NO hace (apartado 18) ───────────────────');
ok(NO_EN_NU6.length >= 4 && NO_EN_NU6.every((x) => x.que && x.porque), 'lo aplazado está declarado con su motivo');
ok(!/askAI|contextoParaIA|prediccion/i.test(CODIGO), '⚠️ ni IA, ni predicciones');
ok(NO_EN_NU6.some((x) => /IA/.test(x.que)) && NO_EN_NU6.some((x) => /predicciones/i.test(x.que)),
  '⚠️ las dos, con su fase');

console.log('\n── 15. 🚨 La condición de finalización se CALCULA (apartado 19) ─');
const cond = condicionNU6({ vista: VISTA });
eq(cond.length, 17, 'los diecisiete puntos del criterio');
const rojos = cond.filter((c) => !c.ok);
ok(rojos.length === 0, `🚨 y ninguno rojo${rojos.length ? `: ${rojos.map((r) => r.texto).join(', ')}` : ''}`);
ok(condicionNU6({ vista: '' }).some((c) => !c.ok),
  '🚨 con una pantalla vacía se pone roja: una auditoría que no puede fallar no sirve (EH F42)');

console.log('\n' + '═'.repeat(70));
if (fallos.length) {
  console.log(`✗ ${fallos.length} fallos de ${pasa + fallos.length}`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F38 (NU F6) · Estadísticas y evolución`);
