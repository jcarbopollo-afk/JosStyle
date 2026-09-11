// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 39 (NU F7) — INTELIGENCIA Y ANÁLISIS NUTRICIONAL
// ══════════════════════════════════════════════════════════════════════════
//
// El apartado 7 lleva escrito *"MUY IMPORTANTE"* en el propio enunciado:
// **«no registrado» no es «no consumido»**. Y el 10 dice que las
// interpretaciones tienen que mirar **su objetivo**. Buena parte de estas
// comprobaciones barren TODOS los textos generados buscando las dos cosas: que
// ninguno afirme lo que no come, y que ninguno juzgue sin mirar lo que él busca.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  NIVELES_CONFIANZA, nivelDeConfianza, permite,
  NO_REGISTRADO_NO_ES_NO_CONSUMIDO, FORMAS_PROHIBIDAS, hablaDeRegistros,
  MARGEN_CERCA, analisisProteinaInteligente,
  MARGEN_LIGERO, MARGEN_BASTANTE, analisisCaloriasInteligente,
  UMBRAL_VARIACION, regularidad,
  UMBRAL_POCO_FRECUENTE, distribucionComidas,
  TITULO_PANEL, MAX_FRASES_RESUMEN, analizarNutricion,
  resumenParaHoy, LO_QUE_VIAJA_A_LA_IA, LO_QUE_NO_VIAJA, contextoIANutricion, FALLBACK,
  NO_EN_NU7, PALABRAS_PROHIBIDAS_NUT, sinAlarmismo, AUDITORIA_NU7, condicionNU7,
} from '../src/lib/inteligenciaNutricion.js';
import { MOMENTOS } from '../src/lib/nutricion.js';

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
const dia = (n) => { const d = new Date(`${HOY}T00:00:00`); d.setDate(d.getDate() - n); return d.toLocaleDateString('sv-SE'); };
const VISTA = leer('src/views/NutritionView.jsx');
const CODIGO_VISTA = soloCodigo(VISTA);
const LIB = leer('src/lib/inteligenciaNutricion.js');
const CODIGO = soloCodigo(LIB);

const OBJ = (objetivo) => ({
  configurado: true, kcal: 2400, proteinas: 140, carbohidratos: 300, grasas: 70,
  actividad: 'moderado', objetivo, manual: {}, pesoAlCalcular: 72, fecha: HOY,
});
/* Ocho días con desayuno y comida —nunca merienda— y proteína corta. */
const comidas = [];
for (let i = 0; i < 8; i += 1) {
  comidas.push({ id: `d${i}`, fecha: dia(i), momento: 'comida', nombre: 'C', calorias: 2000 + (i % 2 ? 100 : -100), proteinas: 110, carbohidratos: 250, grasas: 60 });
  comidas.push({ id: `e${i}`, fecha: dia(i), momento: 'desayuno', nombre: 'D', calorias: 300, proteinas: 15, carbohidratos: 40, grasas: 8 });
}
const NUT = { comidas, objetivos: OBJ('ganar') };
const SIN_OBJ = { comidas };
/* Un día suelto: por debajo del mínimo para decir nada. */
const UN_DIA = { comidas: [comidas[0]], objetivos: OBJ('mantener') };

console.log('\n══ E3 · Fase 39 (NU F7) — la inteligencia nutricional ══');

console.log('\n── 1. 🚨 La IA NO se llama en ningún renderizado (13 y 15) ──────');
/* *"Si el proyecto ya utiliza un sistema de IA, NO conectar automáticamente la
   API a cada renderizado."* Se busca el MECANISMO —los imports y las llamadas—,
   no la palabra: el archivo NOMBRA la IA para declarar que no la llama. */
const importsLib = (LIB.match(/^import[\s\S]*?from\s+'[^']+';/gm) || []).join('\n');
ok(!/ai|anthropic|askAI/i.test(importsLib),
  '🚨 la librería no importa NADA de la IA');
ok(!/askAI|fetch\(/.test(CODIGO), '🚨 y no llama a ninguna API');
eq(AUDITORIA_NU7.llamadasAutomaticasIA, 0, '⚠️ y está declarado');
ok(FALLBACK.hay && /local/i.test(FALLBACK.como),
  '🚨 Y POR ESO EL FALLBACK DEL APARTADO 15 SALE GRATIS: el análisis nunca dependió de la IA');
/* El panel de un toque sigue siendo el de siempre (regla 7). */
ok(/AIPanel/.test(VISTA) && /Analizar mi semana/.test(VISTA),
  '⚠️ la IA generativa sigue siendo un panel de UN TOQUE, con el nombre del apartado 13');

console.log('\n── 2. Y se le manda el ANÁLISIS, no las comidas (apartado 14) ───');
const ctx = contextoIANutricion(NUT, '7d', HOY);
ok(!('comidas' in ctx), '🚨 el contexto de la IA NO lleva las comidas una a una');
ok(ctx.promedios && ctx.objetivos && typeof ctx.diasConDatos === 'number',
  '⚠️ lleva los promedios, los objetivos y cuántos días hay');
ok(Array.isArray(ctx.patrones), '⚠️ y los patrones detectados, por su id');
ok(!JSON.stringify(ctx).includes('pesoAlCalcular') && !('peso' in ctx) && !('altura' in ctx),
  '🚨 NI EL PESO NI LA ALTURA: *"no exponer información sensible innecesariamente"* (apartado 14)');
ok(LO_QUE_VIAJA_A_LA_IA.length >= 3 && LO_QUE_NO_VIAJA.length >= 3, '⚠️ con las dos listas declaradas');
ok(CODIGO_VISTA.includes('contextoIANutricion'),
  '⚠️ y la pantalla usa ese contexto, no `nutricion.comidas.slice(-20)` como antes');
ok(!/comidas\.slice\(-20\)/.test(CODIGO_VISTA), '⚠️ que ya no está');

console.log('\n── 3. 🚨 «No registrado» NO es «no consumido» (6 y 7) ───────────');
const a = analizarNutricion(NUT, '7d', HOY);
const TODOS = [
  a.resumen, a.aviso, a.sinDatos,
  ...a.patrones.map((p) => p.texto), ...a.recomendaciones,
  a.proteina.texto, a.proteina.accion, a.proteina.titulo,
  a.calorias.texto, a.calorias.segunObjetivo,
  a.regularidad.texto, a.regularidad.matiz,
  ...(a.distribucion.textos || []),
  ...NIVELES_CONFIANZA.map((n) => n.texto),
].filter(Boolean);
ok(TODOS.length >= 8, `se barren ${TODOS.length} textos generados`);
const afirman = TODOS.filter((t) => !hablaDeRegistros(t));
ok(afirman.length === 0,
  `🚨 NINGUNO AFIRMA LO QUE NO COME${afirman.length ? `: ${afirman.join(' | ')}` : ''} — el apartado 7 lo marca como MUY IMPORTANTE`);
/* El ejemplo exacto del apartado 6, en las dos direcciones. */
ok(a.distribucion.textos.some((t) => /merienda no suele aparecer en tus registros/i.test(t)),
  '🚨 «La merienda no suele aparecer en tus registros» — la forma del apartado 6');
ok(!TODOS.some((t) => /nunca meriendas/i.test(t)), '🚨 y NUNCA «nunca meriendas», que es la que prohíbe');
ok(!hablaDeRegistros('Nunca meriendas'), '⚠️ y el barrido caza esa frase de verdad');
ok(hablaDeRegistros('La merienda no suele aparecer en tus registros.'), '⚠️ y deja pasar la correcta');
ok(/no quiere decir que no lo comieras/i.test(NO_REGISTRADO_NO_ES_NO_CONSUMIDO),
  '🚨 Y EL PANEL LO DICE ENTERO, debajo de todo');
ok(CODIGO_VISTA.includes('a.aviso'), '⚠️ y se enseña de verdad');
ok(FORMAS_PROHIBIDAS.length >= 5, '⚠️ con su lista de formas prohibidas');

console.log('\n── 4. El nivel de confianza (apartado 8) ────────────────────────');
eq(NIVELES_CONFIANZA.map((n) => n.minimo), [0, 3, 7, 30], 'la escala del enunciado: 1, 3-6, 7+ y 30+');
eq(nivelDeConfianza(1).id, 'ninguno', 'con un día, ninguno');
eq(nivelDeConfianza(4).id, 'basico', 'con cuatro, observaciones básicas');
eq(nivelDeConfianza(8).id, 'tendencias', 'con ocho, tendencias');
eq(nivelDeConfianza(40).id, 'solido', 'y con cuarenta, análisis sólido');
eq(nivelDeConfianza(null).id, 'ninguno', '⚠️ y sin dato, ninguno: `Number(null)` es 0 y aquí no engaña');
ok(!permite(nivelDeConfianza(1), 'observacion'), '🚨 con un día NO se permite ni una observación');
ok(!permite(nivelDeConfianza(4), 'tendencia'), '🚨 y con cuatro, ninguna tendencia (apartado 8)');
ok(permite(nivelDeConfianza(8), 'tendencia'), '⚠️ con ocho, sí');
/* 🚨 Y con un día no se dice NADA específico. */
const pocos = analizarNutricion(UN_DIA, '7d', HOY);
eq(pocos.resumen, null, '🚨 CON UN DÍA NO HAY RESUMEN');
ok(/más datos/i.test(pocos.sinDatos), '⚠️ se dice que hacen falta más datos, literal del apartado 8');
eq(pocos.patrones.length, 0, '⚠️ y ni un patrón');
eq(pocos.recomendaciones.length, 0, '⚠️ ni una recomendación');

console.log('\n── 5. La proteína (apartado 3) ──────────────────────────────────');
const prot = analisisProteinaInteligente(NUT, '7d', HOY);
eq(prot.estado, 'baja', '125 de 140 está por debajo');
ok(/11 % por debajo/.test(prot.texto), '⚠️ con su porcentaje, como el ejemplo del apartado 3');
eq(prot.faltan, 15, '⚠️ y cuántos gramos faltan');
ok(/15 g de proteína/.test(prot.accion),
  '🚨 Y LA RECOMENDACIÓN LLEVA EL NÚMERO: *"te faltan 35 g"* es mejor que un párrafo (apartado 9)');
ok(/fuente de proteína/.test(prot.accion), '⚠️ con la sugerencia del enunciado');
/* La otra rama: en objetivo, con la frase literal del apartado 3. */
const enObjetivo = analisisProteinaInteligente({ comidas: comidas.map((c) => ({ ...c, proteinas: c.momento === 'comida' ? 125 : 15 })), objetivos: OBJ('mantener') }, '7d', HOY);
eq(enObjetivo.estado, 'en_objetivo', 'con 140 justos, en objetivo');
eq(enObjetivo.titulo, 'Proteína en objetivo', '⚠️ con el título del apartado 3');
ok(/muy cerca de tu objetivo diario/.test(enObjetivo.texto), '⚠️ y su frase, literal');
eq(enObjetivo.accion, null, '⚠️ y sin acción: no hay nada que sugerir');
ok(MARGEN_CERCA > 0, '⚠️ hay un margen: un gramo de más no es un aviso');
/* 🚨 Sin objetivo no se interpreta. */
eq(analisisProteinaInteligente(SIN_OBJ, '7d', HOY).motivo, 'sin_objetivo',
  '🚨 SIN OBJETIVO NO SE INTERPRETA: es lo que la F6 pedía');

console.log('\n── 6. 🔒 Las calorías, SEGÚN SU objetivo (apartados 4 y 10) ─────');
/* *"Una desviación calórica no debe interpretarse igual para todos."* La misma
   desviación, tres objetivos, tres frases. */
const bajo = { comidas: comidas.map((c) => ({ ...c, calorias: c.momento === 'comida' ? 1500 : 300 })) };
const perder = analisisCaloriasInteligente({ ...bajo, objetivos: OBJ('perder') }, '7d', HOY);
const ganar = analisisCaloriasInteligente({ ...bajo, objetivos: OBJ('ganar') }, '7d', HOY);
ok(/va en esa dirección/.test(perder.segunObjetivo),
  '🚨 COMER POR DEBAJO, QUERIENDO PERDER GRASA: «va en esa dirección»');
ok(/has comido por debajo de lo que calculaste/.test(ganar.segunObjetivo),
  '🚨 Y LA MISMA CIFRA, QUERIENDO GANAR MASA, SE CUENTA DISTINTO (apartado 10)');
ok(perder.segunObjetivo !== ganar.segunObjetivo, '🚨 son dos frases distintas, que es todo el apartado 10');
eq(perder.objetivoUsuario, 'Perder grasa', '⚠️ con el nombre de su objetivo');
ok(/bastante por debajo/.test(perder.texto), '⚠️ y el cuánto, con las palabras del apartado 4');
/* Cerca también significa algo según el objetivo. */
const cerca = analisisCaloriasInteligente(NUT, '7d', HOY);
eq(cerca.estado, 'cerca', 'con 2286 de 2400 está cerca');
ok(/ganar masa/i.test(cerca.segunObjetivo),
  '⚠️ y estar cerca TAMBIÉN se cuenta según su objetivo: dejarlo fuera era el apartado 10 a medias');
eq(analisisCaloriasInteligente(SIN_OBJ, '7d', HOY).motivo, 'sin_objetivo', '🚨 y sin objetivo no se interpreta');
ok(MARGEN_LIGERO < MARGEN_BASTANTE, '⚠️ «ligeramente» y «bastante» son dos umbrales distintos');

console.log('\n── 7. La regularidad (apartado 5) ───────────────────────────────');
const reg = regularidad(NUT, '7d', HOY);
ok(reg.hay && reg.estable, 'con días parecidos, estable');
ok(/bastante estable/.test(reg.texto), '⚠️ con su frase');
/* 🐛 **Y este escenario estaba mal construido**, que es la lección de la E3 F29:
   `comidas` lleva DOS entradas por día —comida y desayuno, alternadas—, así que
   un `i % 2` sobre el array daba 900 y 3500 **el mismo día** y todos sumaban lo
   mismo: variación cero, con el código bien. Se alterna **por día**, no por
   posición en la lista. */
const irregular = regularidad({
  comidas: comidas.map((c) => {
    const diasAtras = Math.round((new Date(`${HOY}T00:00:00`) - new Date(`${c.fecha}T00:00:00`)) / 86400000);
    return { ...c, calorias: diasAtras % 2 ? 3400 : 800 };
  }),
  objetivos: OBJ('mantener'),
}, '7d', HOY);
ok(!irregular.estable, 'con días muy distintos, no');
ok(/cambia bastante entre días/.test(irregular.texto), '⚠️ con la frase del apartado 5');
ok(/no tiene por qué ser algo malo/i.test(irregular.matiz),
  '🚨 Y CON SU MATIZ: *"el objetivo no es que todos los días sean idénticos"*');
/* 🚨 Con pocos días no se mide: dos altos y uno bajo parecen un patrón y son casualidad. */
eq(regularidad({ comidas: comidas.slice(0, 6), objetivos: OBJ('mantener') }, '7d', HOY).motivo, 'pocos_datos',
  '🚨 y con menos de siete días NO se habla de variación (apartado 8)');
ok(UMBRAL_VARIACION > 0, '⚠️ el umbral está declarado');

console.log('\n── 8. La distribución de comidas (apartado 6) ───────────────────');
const dist = distribucionComidas(NUT, '7d', HOY);
ok(dist.hay, 'con datos, se mira qué comidas aparecen');
eq(dist.momentos.length, MOMENTOS.length, '⚠️ los cinco momentos de siempre');
ok(dist.pocoFrecuentes.some((m) => m.id === 'merienda'), '🚨 la merienda sale como poco frecuente');
ok(!dist.pocoFrecuentes.some((m) => m.id === 'desayuno'), '⚠️ y el desayuno no, porque sí aparece');
ok(!dist.pocoFrecuentes.some((m) => m.id === 'extras'),
  '⚠️ Y EXTRAS NUNCA: es el cajón de lo que no encaja, no una comida que se salte');
ok(UMBRAL_POCO_FRECUENTE > 0 && UMBRAL_POCO_FRECUENTE < 1, '⚠️ con su umbral declarado');
eq(distribucionComidas(UN_DIA, '7d', HOY).motivo, 'pocos_datos', '⚠️ y con un día no se dice nada');

console.log('\n── 9. El panel y el resumen (apartados 1 y 16) ──────────────────');
ok(/Análisis nutricional/i.test(TITULO_PANEL), 'el título del apartado 1');
ok(typeof a.resumen === 'string' && a.resumen.length > 0, 'hay resumen');
ok((a.resumen.match(/\./g) || []).length <= MAX_FRASES_RESUMEN,
  '🚨 Y ES CORTO: dos frases como mucho (*"evitar textos largos"*, apartado 1)');
ok(a.resumen.length < 160, '⚠️ y cabe en dos líneas de un móvil');
ok(a.patrones.length >= 2, 'se detectan patrones de verdad (apartado 2)');
ok(a.patrones.every((p) => p.id && p.texto), '⚠️ cada uno con su id y su texto');
/* ⚠️ *"Días con registros incompletos"* (apartado 2) solo sale **cuando los
   hay**: en este escenario están los siete, así que no aparece — y eso es lo
   correcto. Se comprueba en uno con huecos. */
const conHuecos = analizarNutricion({ comidas: comidas.filter((c) => c.fecha !== dia(2) && c.fecha !== dia(4)), objetivos: OBJ('ganar') }, '7d', HOY);
ok(conHuecos.patrones.some((p) => p.id === 'dias_sin_registrar'),
  '⚠️ y con días sin registrar sale *"días con registros incompletos"* (apartado 2)');
ok(!a.patrones.some((p) => p.id === 'dias_sin_registrar'),
  '⚠️ pero con los siete días registrados NO, porque no hay ninguno incompleto');
ok(CODIGO_VISTA.includes('AnalisisNutricional'), '⚠️ y la pantalla lo pinta');
ok(CODIGO_VISTA.includes('useMemo'), '⚠️ de una sola pasada, sin recalcular en cada pintado');

console.log('\n── 10. El resumen reutilizable para Hoy (apartados 11 y 12) ─────');
const rh = resumenParaHoy(NUT, HOY);
ok(!!rh && /Te quedan \d+ g de proteína/.test(rh.texto),
  '«Te quedan 15 g de proteína» — el ejemplo del apartado 12');
eq(resumenParaHoy({ comidas: [] }, HOY), null,
  '🚨 Y SIN DATOS DE HOY DEVUELVE `null`, no una plaquita vacía (apartado 12)');
const lleno = resumenParaHoy({ comidas: [{ id: 'x', fecha: HOY, momento: 'comida', calorias: 2500, proteinas: 150, carbohidratos: 300, grasas: 70 }], objetivos: OBJ('mantener') }, HOY);
ok(/objetivo calórico/.test(lleno.texto), '⚠️ y con el objetivo alcanzado, lo dice');
const sinObjHoy = resumenParaHoy({ comidas: [{ id: 'y', fecha: HOY, momento: 'comida', calorias: 1200, proteinas: 60 }] }, HOY);
ok(/1200 kcal registradas hoy/.test(sinObjHoy.texto),
  '⚠️ y sin objetivos, lo registrado a secas: no se inventa uno');
/* ⚠️ Y la función se USA: una que nadie llama no falla nunca (E3 F1, F5, F16). */
ok(CODIGO_VISTA.includes('resumenParaHoy'),
  '🚨 y el panel la llama de verdad: una función que nadie llama no falla nunca');

console.log('\n── 11. 🚨 Ni alarmismo ni diagnóstico (apartados 4 y 17) ────────');
const conAlarma = TODOS.filter((t) => !sinAlarmismo(t));
ok(conAlarma.length === 0,
  `🚨 ningún texto es alarmista ni clínico${conAlarma.length ? `: ${conAlarma.join(' | ')}` : ''}`);
ok(!sinAlarmismo('Esto es peligroso para tu salud'), '⚠️ y el barrido caza una frase así de verdad');
ok(PALABRAS_PROHIBIDAS_NUT.length >= 10, '⚠️ con su lista');
eq(AUDITORIA_NU7.diagnosticos, 0, '⚠️ y cero diagnósticos declarados');
ok(NO_EN_NU7.length >= 4 && NO_EN_NU7.every((x) => x.que && x.porque), 'lo excluido está declarado (apartado 17)');
ok(NO_EN_NU7.some((x) => /dietas médicas/i.test(x.que)) && NO_EN_NU7.some((x) => /Diagnósticos/i.test(x.que)),
  '⚠️ las dietas médicas y los diagnósticos, con su motivo');
ok(!/prescrib|dieta médica|diagnostic/i.test(TODOS.join(' ')), '⚠️ y ni una palabra de eso en los textos');

console.log('\n── 12. Ni una clave nueva, ni una cifra guardada ────────────────');
eq(AUDITORIA_NU7.clavesNuevas, 0, 'ni una clave nueva de `app_data`');
eq(AUDITORIA_NU7.cifrasGuardadas, 0, '⚠️ ni una cifra guardada: es una vista, como la F6');
ok(!/saveData|snapshotAndSave|setNutricion/.test(CODIGO), '🚨 y el archivo no escribe');
ok(!/normalizar[A-Z]\w*\s*\(/.test(CODIGO.replace(/normalizarObjetivosNut/g, '')),
  '⚠️ ni tiene normalizador propio: no hay nada nuevo que guardar');

console.log('\n── 13. 🚨 La condición de finalización se CALCULA (apartado 18) ──');
const cond = condicionNU7({ vista: VISTA });
eq(cond.length, 17, 'los diecisiete puntos del criterio');
const rojos = cond.filter((c) => !c.ok);
ok(rojos.length === 0, `🚨 y ninguno rojo${rojos.length ? `: ${rojos.map((r) => r.texto).join(', ')}` : ''}`);
ok(condicionNU7({ vista: '' }).some((c) => !c.ok),
  '🚨 con una pantalla vacía se pone roja: una auditoría que no puede fallar no sirve (EH F42)');

console.log('\n' + '═'.repeat(70));
if (fallos.length) {
  console.log(`✗ ${fallos.length} fallos de ${pasa + fallos.length}`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F39 (NU F7) · Inteligencia nutricional`);
