// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 33 (NU F1) — REDISEÑO PREMIUM DEL APARTADO NUTRICIÓN
// ══════════════════════════════════════════════════════════════════════════
//
// 🚨 Lo que más hay que demostrar en esta fase es **lo que NO se ha hecho**: el
// enunciado enumera siete cosas que son de fases posteriores, y su criterio de
// finalización pide expresamente que *"no haya funcionalidad falsa o inventada"*.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  INDICADORES, indicador, INDICADOR_PRINCIPAL, MACROS,
  MOMENTOS, momento, IDS_MOMENTOS, MOMENTO_POR_DEFECTO,
  normalizarComida, normalizarComidas, normalizarNutricionDe,
  etiquetaDeDia, esFuturo, comidasDelDia, porMomento,
  resumenDelDia, hayAlgoRegistrado, VACIO_DIA, VACIO_MOMENTO,
  NO_EN_NU1, AUDITORIA_NU1, condicionNU1,
} from '../src/lib/nutricion.js';

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
const AYER = '2026-09-06';
const VISTA = leer('src/views/NutritionView.jsx');
const CODIGO_VISTA = soloCodigo(VISTA);
const APP = leer('src/App.jsx');
const LIB = leer('src/lib/nutricion.js');

const comidas = [
  { id: 'c1', fecha: HOY, nombre: 'Avena', calorias: 350, proteinas: 12, carbohidratos: 55, grasas: 8, fibra: 6, momento: 'desayuno' },
  { id: 'c2', fecha: HOY, nombre: 'Pollo con arroz', calorias: 500, proteinas: 45, carbohidratos: 10, grasas: 15, fibra: 2, momento: 'comida' },
  { id: 'c3', fecha: HOY, nombre: 'De antes de esta fase', calorias: 200, proteinas: 5, carbohidratos: 30, grasas: 4, fibra: 1 },
  { id: 'c4', fecha: AYER, nombre: 'Cena de ayer', calorias: 900, proteinas: 30, carbohidratos: 90, grasas: 20, fibra: 5, momento: 'cena' },
];

console.log('\n══ E3 · Fase 33 (NU F1) — el apartado Nutrición ══');

console.log('\n── 1. Los cuatro indicadores (apartados 2, 3 y 4) ───────────────');
eq(INDICADORES.map((i) => i.id), ['calorias', 'proteinas', 'carbohidratos', 'grasas'],
  '🔥 Calorías · 💪 Proteína · 🍚 Carbohidratos · 🥑 Grasas');
ok(INDICADORES.every((i) => i.emoji && i.nombre && i.unidad && i.campo),
  '⚠️ cada uno con icono, nombre, unidad y **de qué campo de la comida sale** (apartado 3)');
eq(INDICADOR_PRINCIPAL.id, 'calorias',
  '🚨 y las kcal tienen jerarquía superior: son el indicador principal (apartado 4)');
eq(MACROS.length, 3, 'los otros tres van juntos, en 2×2 (apartado 9)');
eq(indicador('proteinas').unidad, 'g', '`indicador` responde por id');
eq(indicador('no-existe'), null, '⚠️ y con un id que no existe devuelve `null`');
ok(VISTA.includes('<Indicador'), '⚠️ y la pantalla los pinta con un solo componente, no con cuatro copias');

console.log('\n── 2. 🚨 Los números son REALES, y sin objetivo no hay objetivo ──');
const r = resumenDelDia(comidas, HOY);
eq(r[0].consumido, 1050, '🚨 las kcal salen de las comidas de verdad, sumadas');
eq(r[1].consumido, 62, 'y las proteínas');
eq(r[2].consumido, 95, 'y los carbohidratos');
eq(r[3].consumido, 27, 'y las grasas');
eq(resumenDelDia(comidas, AYER)[0].consumido, 900, '⚠️ y solo las del día que se está mirando');
eq(resumenDelDia(comidas, '2026-01-01')[0].consumido, 0, '⚠️ un día sin comidas suma cero, que aquí SÍ es un dato');
/* 🚨 El corazón de la fase. */
ok(r.every((x) => x.objetivo === null), '🚨 NINGÚN OBJETIVO: son la Fase 3, y el apartado 2 prohíbe hardcodear los del ejemplo');
ok(r.every((x) => x.porcentaje === null), '🚨 y por tanto ningún porcentaje: sin objetivo no se puede calcular');
eq(r[0].texto, '1050 kcal', '🚨 el texto es lo consumido a secas, sin un «/ 2.400» inventado');
/* 🐛 **Esta comprobación buscaba el número «2400» en la librería, y saltaba con
   código que estaba bien**: `condicionNU1` lo usa justo para DEMOSTRAR que el
   indicador sabe pintar un objetivo cuando se lo dan. Es la lección de siempre —
   se busca el **mecanismo**, no la cifra—, así que lo que se comprueba es que la
   pantalla llame a `resumenDelDia` **sin objetivos**, que es lo que de verdad
   impide que aparezca un «/ 2.400» inventado. */
/* ⚠️ **Y esta comprobación cambió de guardia en la E3 F35**, como la de la
   ventana de Sueño entre la SU F1 y la SU F2. Mientras los objetivos no
   existían, vigilaba que la pantalla pidiera el resumen **con `null`**; la F35
   es la fase que los trae, así que ahora vigila lo de después: que se los pase
   **derivados de lo guardado** —nunca una cifra escrita a mano— y que la NU F1
   siga siendo verdad **sin ellos**, que es lo que esta fase construyó. */
ok(/resumenDelDia\(comidas, fecha, objetivos\)/.test(soloCodigo(VISTA)),
  '🚨 la pantalla pide el resumen con los objetivos que él haya configurado (E3 F35)');
ok(/objetivosParaResumen\(/.test(soloCodigo(VISTA)),
  '⚠️ y salen de lo guardado, no de un número escrito en la pantalla');
eq(resumenDelDia(comidas, HOY, null)[0].texto, '1050 kcal',
  '🚨 y SIN configurarlos sigue siendo lo consumido a secas: la NU F1 no se ha roto');
ok(!/objetivos\s*=\s*\{/.test(CODIGO_VISTA),
  '⚠️ y no hay ningún objeto de objetivos escrito en la vista');
ok(!/2\.?400|1\.?850/.test(CODIGO_VISTA), '⚠️ ni los números del ejemplo del enunciado');
eq(AUDITORIA_NU1.cifrasInventadas, 0, 'ni una cifra inventada');
/* ⚠️ Pero el componente ya sabe hacerlo: la Fase 3 solo tendrá que pasárselo. */
const conObj = resumenDelDia(comidas, HOY, { calorias: 2400, proteinas: 140 });
eq(conObj[0].objetivo, 2400, '⚠️ y con objetivos, el indicador los coge');
eq(conObj[0].porcentaje, 44, 'con su porcentaje');
eq(conObj[0].texto, '1050 / 2400 kcal', 'y su texto «X / Y»');
eq(conObj[2].objetivo, null, '⚠️ y los que no tengan objetivo siguen sin él: se pasan uno a uno');
eq(resumenDelDia(comidas, HOY, { calorias: 500 })[0].porcentaje, 210,
  '⚠️ el porcentaje real puede pasar del 100…');
eq(resumenDelDia(comidas, HOY, { calorias: 500 })[0].porcentajePintado, 100,
  '🚨 …pero lo que se PINTA se topa en 100 (E3 F27)');
eq(resumenDelDia(comidas, HOY, { calorias: 0 })[0].objetivo, null,
  '⚠️ y un objetivo de cero no es un objetivo');

console.log('\n── 3. Los cinco momentos del día (apartado 6) ───────────────────');
eq(MOMENTOS.map((m) => m.id), ['desayuno', 'comida', 'merienda', 'cena', 'extras'],
  'DESAYUNO · COMIDA · MERIENDA · CENA · EXTRAS, en ese orden');
ok(MOMENTOS.every((m) => m.nombre && m.emoji), 'cada uno con su nombre y su icono');
eq(momento('cena').nombre, 'Cena', '`momento` responde por id');
eq(momento('brunch'), null, '⚠️ y uno que no existe es `null`');
const g = porMomento(comidas, HOY);
eq(g.desayuno.length, 1, 'el desayuno tiene su comida');
eq(g.comida.length, 1, 'la comida, la suya');
eq(g.merienda.length, 0, 'y la merienda, ninguna');
/* 🚨 Y la que no tiene momento no se pierde. */
eq(g.extras.length, 1, '🚨 UNA COMIDA SIN MOMENTO NO SE PIERDE: cae en Extras, que es el cajón del enunciado');
eq(g.extras[0].id, 'c3', 'y es la de antes de esta fase');
eq(Object.values(g).reduce((a, l) => a + l.length, 0), 3,
  '⚠️ las tres del día están, ni una de más ni una de menos');
eq(MOMENTO_POR_DEFECTO, 'extras', 'el cajón por defecto es Extras');

console.log('\n── 4. 🚨 Y a lo guardado antes NO se le inventa un momento ───────');
eq(normalizarComida({ id: 'x' }).momento, null,
  '🚨 `momento` se queda en `null`: decir que aquella tostada fue un desayuno sería inventarse cuándo se la comió');
eq(normalizarComida({ id: 'x', momento: 'cena' }).momento, 'cena', 'y el que sí lo tiene se conserva');
eq(normalizarComida({ id: 'x', momento: 'brunch' }).momento, null, '⚠️ y un momento que no existe se limpia');
eq(normalizarComida({ id: 'x', nombre: 'Algo', calorias: 200 }).calorias, 200,
  '⚠️ sin tocar ningún otro campo de la comida');
eq(normalizarComidas([{ id: 'a' }, null, 'basura']).length, 1, 'y la lista se limpia de lo que no es una comida');
/* 🚨 El normalizador del módulo devuelve el objeto ENTERO (regla 5). */
const n = normalizarNutricionDe({ comidas: [{ id: 'a' }], agua: { [HOY]: 1500 }, favoritos: [{ id: 'f' }] });
eq(n.agua[HOY], 1500, '🚨 `normalizarNutricionDe` devuelve el módulo ENTERO: perder `agua` la borraría (regla 5)');
eq(n.favoritos.length, 1, 'y los favoritos');
eq(normalizarNutricionDe(null).comidas.length, 0, '⚠️ con basura tampoco revienta');
/* ⚠️ La E3 F35 y la E3 F36 lo envolvieron con los suyos —`normalizarNutricionF4(
   normalizarNutricionObjetivos(normalizarNutricionDe(nut)))`—, así que lo que se
   comprueba es que **siga siendo el de dentro**: el orden importa, porque cada
   uno amplía lo que devuelve el anterior. */
ok(/setNutricion\([^)]*normalizarNutricionDe\(nut\)/.test(APP),
  '🚨 y corre AL CARGAR, antes de que nadie lo lea (EH F46)');
ok(APP.indexOf('normalizarNutricionObjetivos(normalizarNutricionDe(nut)') > 0,
  '⚠️ con los de las fases siguientes por encima, en su orden');

console.log('\n── 5. El selector de días (apartado 5) ──────────────────────────');
eq(etiquetaDeDia(HOY, HOY), 'Hoy', '«HOY»');
eq(etiquetaDeDia(AYER, HOY), 'Ayer', '«AYER»');
eq(etiquetaDeDia('2026-09-08', HOY), 'Mañana', '«MAÑANA»');
ok(/sept|sep/.test(etiquetaDeDia('2026-09-01', HOY)),
  '⚠️ y más atrás, la fecha de verdad con su día de la semana');
eq(esFuturo('2026-09-08', HOY), true, '`esFuturo` distingue lo que todavía no ha pasado');
eq(esFuturo(HOY, HOY), false, 'y hoy no es futuro');
/* 🚨 Y funciona: no es un control decorativo. */
/* ⚠️ Desde la F2 la pantalla llama a `tituloDelDia`, que usa `etiquetaDeDia`
   por dentro: se comprueba lo que la vista usa, no un import que podría sobrar. */
ok(CODIGO_VISTA.includes('setFecha') && CODIGO_VISTA.includes('tituloDelDia'),
  '🚨 EL SELECTOR FUNCIONA DE VERDAD: cambia el día que se mira (regla 8)');
ok(CODIGO_VISTA.includes('fecha={fecha}') && /fecha: fecha \|\| todayISO\(\)/.test(soloCodigo(VISTA)),
  '🚨 y lo que se guarda va al DÍA ELEGIDO: escribir `todayISO()` a pelo lo habría dejado decorativo');
ok(CODIGO_VISTA.includes('momentoId'),
  '⚠️ y al momento desde el que se abrió el formulario');
eq(comidasDelDia(comidas, HOY).length, 3, '`comidasDelDia` filtra por fecha');
eq(comidasDelDia(null, HOY).length, 0, '⚠️ y con basura, ninguna');

console.log('\n── 6. Los estados vacíos (apartado 7) ───────────────────────────');
ok(VACIO_DIA.titulo && VACIO_DIA.detalle && VACIO_DIA.accion,
  '🚨 el vacío del día trae título, explicación **y una salida**: un vacío sin salida es una pantalla rota (EH F41)');
ok(!/error|Error|vacío|no hay nada/i.test(VACIO_DIA.titulo),
  '⚠️ y no suena a mensaje de error, que es lo que el apartado 7 prohíbe');
eq(VACIO_MOMENTO, 'Nada todavía', 'y un momento sin comidas lo dice en corto');
eq(hayAlgoRegistrado(comidas, HOY), true, '`hayAlgoRegistrado` ve las comidas del día');
eq(hayAlgoRegistrado(comidas, '2026-01-01'), false, 'y sabe cuándo no hay ninguna');
ok(VISTA.includes('VACIO_DIA'), '⚠️ y la pantalla lo usa');

console.log('\n── 7. 🚨 Lo que esta fase NO hace (apartados 13 y 14) ────────────');
ok(NO_EN_NU1.length >= 6 && NO_EN_NU1.every((x) => x.que && x.porque),
  'seis cosas declaradas con su motivo');
ok(NO_EN_NU1.some((x) => /objetivos de kcal/i.test(x.que) && x.fase === 'NU F3'),
  '⚠️ los objetivos, con la fase que los traerá');
ok(NO_EN_NU1.some((x) => /historial/i.test(x.que) && x.fase === 'NU F2'), '⚠️ el historial');
ok(NO_EN_NU1.some((x) => /base de alimentos/i.test(x.que) && x.fase === 'NU F5'), '⚠️ la base de alimentos');
ok(NO_EN_NU1.some((x) => /Inteligencia/i.test(x.que) && x.fase === 'NU F7'), '⚠️ y la IA nutricional');
/* 🚨 Y el objetivo calórico no lo pone la aplicación: la regla 7. */
ok(NO_EN_NU1.some((x) => /regla 7/i.test(x.porque)),
  '🚨 y un objetivo calórico puesto por la app está prohibido por la regla 7, no solo aplazado');
ok(!/tdee|TDEE|bmr|BMR/.test(soloCodigo(LIB)) && !/tdee|TDEE/.test(CODIGO_VISTA),
  '🚨 así que NO se usa el TDEE de Ajustes como objetivo: sería la app poniéndole una cifra');
eq(AUDITORIA_NU1.clavesNuevas, 0, 'ni una clave nueva en `app_data`: sigue siendo `nutricion`');
eq(AUDITORIA_NU1.botonesDecorativos, 0, '🚨 y ni un botón decorativo (regla 8)');

console.log('\n── 8. Y no se ha roto nada de lo que ya funcionaba (apartado 11) ─');
ok(VISTA.includes('BarcodeScanner') && VISTA.includes('buscarProductoPorCodigoBarras'),
  '🚨 el escáner de códigos de barras sigue');
ok(VISTA.includes('askAIWithImage'), '🚨 y la foto del plato');
ok(VISTA.includes('FavoritosTab') && VISTA.includes('AguaTab'), '⚠️ y las pestañas de Agua y Favoritos');
ok(VISTA.includes('AIPanel') && VISTA.includes('Analizar mi nutrición'), '⚠️ y el panel de IA');
ok(VISTA.includes('No des objetivos calóricos estrictos'),
  '🚨 con su prompt intacto: la IA sigue sin dar objetivos calóricos estrictos (regla 7)');
ok(VISTA.includes('BotonBorrar') && VISTA.includes('onDeleteComida'), '⚠️ y se puede seguir borrando una comida');
eq(AUDITORIA_NU1.funcionesEliminadas, 0, 'ni una función eliminada');

console.log('\n── 9. 🚨 La condición de finalización se CALCULA (apartado 14) ───');
const cond = condicionNU1({ vista: VISTA });
eq(cond.length, 15, 'los quince puntos del criterio');
eq(cond.filter((c) => !c.ok).map((c) => c.id), [], '🚨 y ninguno rojo — se calculan sobre datos de verdad');
const rota = condicionNU1({ vista: 'export default function Nada() { return null; }' });
ok(rota.filter((c) => !c.ok).length >= 4,
  '🚨 con una pantalla vacía se pone roja: una auditoría que no puede fallar no sirve (EH F42)');

console.log('\n══════════════════════════════════════════════════════════════════════');
if (fallos.length) {
  console.log(`✗ ${fallos.length} comprobación(es) fallida(s):`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F33 (NU F1) · El apartado Nutrición`);
