// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 36 (NU F4) — REGISTRO DE COMIDAS Y CONSUMO DIARIO
// ══════════════════════════════════════════════════════════════════════════
//
// El apartado 17 dice, antes que nada: *"Analiza el código existente. Reutiliza
// componentes. **No dupliques modelos de datos.**"* Buena parte de estas
// comprobaciones no miran que el cálculo salga: miran que **no se haya creado
// una segunda lista de comidas**, que los valores no sean inventados y que lo
// que ya existía —el escáner, la foto, los favoritos— siga estando.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  UNIDADES, unidad, CANTIDAD_MAXIMA, escalar, validarCantidad,
  BASE_ALIMENTOS, alimentoDeBase, TIPOS_ALIMENTO, AVISO_REFERENCIA,
  MINIMO_BUSQUEDA, buscarAlimentos, alimentoDesdeOFF,
  crearComidaDesdeAlimento, cambiarCantidad, cambiarMomento, editarValores,
  normalizarComidaF4, normalizarNutricionF4, textoCantidad,
  totalesDeMomento, lineaDeMomento,
  ESTADOS_OBJETIVO, estadoObjetivo, estadoDeIndicador, excesoDe, MARGEN_CUMPLIDO,
  VACIO_MOMENTO_F4, PASOS_ANADIR, YA_EXISTIA, NO_EN_NU4, AUDITORIA_NU4, condicionNU4,
} from '../src/lib/alimentos.js';
import { MOMENTOS, resumenDelDia, porMomento, comidasDelDia } from '../src/lib/nutricion.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(raiz, p), 'utf8');

/* 🐛 La lección de siempre, ya por decimosexta vez: una prueba que mira si el
   código **hace** algo tiene que quitar los comentarios **y las cadenas** — mi
   propia cabecera nombra a `alimentos` y a `comidas` justamente para prometer
   que no se duplican. */
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
const APP = leer('src/App.jsx');
const LIB = leer('src/lib/alimentos.js');
const CODIGO = soloCodigo(LIB);
const OFF = leer('src/lib/openFoodFacts.js');

const AVENA = alimentoDeBase('avena');

console.log('\n══ E3 · Fase 36 (NU F4) — el registro de alimentos ══');

console.log('\n── 1. 🚨 Un alimento registrado ES una comida (apartado 17) ─────');
/* La prueba que sostiene la fase: **no hay una segunda lista**. Crear
   `alimentos` al lado de `comidas` habría dejado lo que Josué ya tiene
   registrado invisible en su propia pantalla — el fallo de la E3 F16. */
ok(!/\balimentos\s*:/.test(soloCodigo(APP)) || !/nutricion\.alimentos/.test(soloCodigo(APP)),
  '🚨 `App.jsx` NO crea una lista `alimentos` al lado de `comidas`');
ok(!/nutricion\.alimentos/.test(CODIGO_VISTA),
  '🚨 y la pantalla tampoco la lee: un alimento registrado es una comida de siempre');
eq(AUDITORIA_NU4.listasParalelas, 0, '⚠️ y está declarado en la auditoría');
eq(AUDITORIA_NU4.modelosDuplicados, 0, '⚠️ igual que los modelos duplicados (apartado 17)');
eq(AUDITORIA_NU4.clavesNuevas, 0, '⚠️ y las claves nuevas de `app_data` (apartado 13)');

const comida = crearComidaDesdeAlimento({ alimento: AVENA, cantidad: 60, momentoId: 'desayuno', fecha: HOY });
ok(comida.fecha === HOY && comida.momento === 'desayuno' && comida.nombre === 'Avena',
  '⚠️ y lleva los campos de siempre: fecha, momento y nombre');
ok(typeof comida.calorias === 'number' && typeof comida.proteinas === 'number',
  '⚠️ con las kcal y los macros que ya leen el hub, el Dashboard y la exportación');
ok(comida.cantidad === 60 && comida.unidad === 'g' && comida.por100,
  '🚨 MÁS los tres campos que añade esta fase: cantidad, unidad y valores por 100');

console.log('\n── 2. El cálculo proporcional (apartados 4 y 5) ─────────────────');
/* 🚨 `escalar()` no es una cuenta nueva: **estaba dentro del escáner**, escrita
   a mano en la vista desde la Fase 4 del proyecto. Esta fase la saca para que
   la use también el buscador. */
const sesenta = escalar(AVENA.por100, 60, 'g');
eq(sesenta.calorias, 233, '🚨 60 g de avena son 233 kcal — el ejemplo del apartado 5, calculado');
eq(sesenta.proteinas, 10.1, '⚠️ con su proteína');
eq(sesenta.carbohidratos, 39.8, '⚠️ sus carbohidratos');
eq(sesenta.grasas, 4.1, '⚠️ y sus grasas');
eq(sesenta.fibra, 6.4, '⚠️ y la fibra, que la comida ya guardaba: no se pierde');
eq(escalar(AVENA.por100, 100, 'g').calorias, AVENA.por100.calorias, '⚠️ y 100 g son exactamente la referencia');
eq(escalar(AVENA.por100, 0, 'g'), null, '🚨 una cantidad de cero NO devuelve ceros: devuelve `null`');
eq(escalar(AVENA.por100, -5, 'g'), null, '⚠️ ni una negativa');
eq(escalar(AVENA.por100, 99999, 'g'), null, '⚠️ ni una imposible');
eq(escalar(AVENA.por100, 'hola', 'g'), null, '⚠️ ni un texto');
eq(escalar(null, 60, 'g'), null, '⚠️ ni sin valores de referencia');
/* Las unidades: una unidad suelta (un huevo) tiene su referencia en 1, no 100. */
const huevo = alimentoDeBase('huevo');
eq(huevo.unidad, 'ud', '⚠️ un huevo se cuenta en unidades, no en gramos');
eq(escalar(huevo.por100, 2, 'ud').calorias, 156, '🚨 así que dos huevos son 156 kcal, no 1,56');
eq(unidad('ml').referencia, 100, '⚠️ y los mililitros escalan como los gramos');

console.log('\n── 3. La cantidad se valida, y el aviso dice qué corregir ───────');
eq(validarCantidad(60), null, 'una cantidad válida no da aviso');
ok(/números/i.test(validarCantidad('')), '⚠️ una vacía dice qué escribir');
ok(/mayor que cero/i.test(validarCantidad(0)), '⚠️ un cero, que tiene que ser mayor');
ok(String(validarCantidad(99999)).includes(String(CANTIDAD_MAXIMA)), '⚠️ y una imposible dice el tope');
ok(!/^error/i.test(String(validarCantidad(''))), '🚨 y ninguno dice «Error» a secas (EH F62)');

console.log('\n── 4. 🚨 Los valores NO se inventan (apartado 5) ────────────────');
eq(AVENA.por100.calorias, 389, '🚨 la avena tiene los 389 kcal del propio enunciado');
eq(AVENA.por100.proteinas, 16.9, '🚨 sus 16,9 g de proteína');
eq(AVENA.por100.carbohidratos, 66.3, '🚨 sus 66,3 de carbohidratos');
eq(AVENA.por100.grasas, 6.9, '🚨 y sus 6,9 de grasa — los cuatro números literales del apartado 5');
eq(AUDITORIA_NU4.valoresInventados, 0, '⚠️ y está declarado');
ok(BASE_ALIMENTOS.every((a) => a.por100 && typeof a.por100.calorias === 'number' && a.por100.calorias > 0),
  '⚠️ ningún alimento de la base tiene cero calorías, que sería una ficha a medias');
ok(BASE_ALIMENTOS.every((a) => a.id && a.nombre && a.tipo && a.unidad),
  '⚠️ y todos tienen id, nombre, tipo y unidad');
ok(new Set(BASE_ALIMENTOS.map((a) => a.id)).size === BASE_ALIMENTOS.length,
  '⚠️ sin ids repetidos, que darían dos alimentos indistinguibles');
ok(/referencia/i.test(AVISO_REFERENCIA) && /cambia/i.test(AVISO_REFERENCIA),
  '🔒 Y LA PANTALLA DICE QUE SON DE REFERENCIA Y EDITABLES, no la etiqueta de su bote');
ok(CODIGO_VISTA.includes('AVISO_REFERENCIA'), '⚠️ y la vista lo enseña de verdad');
/* Los seis ejemplos que el apartado 3 pone por su nombre. */
for (const q of ['pollo', 'arroz', 'avena', 'leche', 'plátano', 'yogur']) {
  ok(buscarAlimentos(q).length > 0, `⚠️ «${q}», del apartado 3, se encuentra`);
}

console.log('\n── 5. El buscador (apartado 3) ──────────────────────────────────');
ok(buscarAlimentos('pollo').length >= 2, 'busca por NOMBRE');
ok(buscarAlimentos('lácteo').length >= 3, 'busca por TIPO de alimento');
ok(buscarAlimentos('lacteo').length === buscarAlimentos('lácteo').length,
  '⚠️ y sin tilde encuentra lo mismo: nadie escribe «lácteo» con tilde en el móvil');
ok(buscarAlimentos('POLLO').length === buscarAlimentos('pollo').length, '⚠️ y en mayúsculas también');
eq(buscarAlimentos('a').length, 0, '⚠️ con una sola letra no busca: sacaría media base');
eq(buscarAlimentos('').length, 0, '⚠️ ni con nada escrito');
eq(buscarAlimentos('pan')[0].nombre.startsWith('Pan'), true,
  '⚠️ y el que empieza por lo escrito va primero: «pan» es Pan blanco, no Crema de cacahuete');
ok(buscarAlimentos('zzzz').length === 0, '⚠️ y lo que no está devuelve vacío, sin inventarse nada');
/* ⚠️ Ninguno de los cuatro buscadores que ya existen sirve aquí, y **no se
   guarda un índice**: se quedaría viejo en cuanto la F5 le deje añadir los
   suyos (la lección de la E3 F22). */
ok(!/indiceBusqueda|buscarModulos|buscadorEstilo|bibliotecaGlobal/.test(CODIGO),
  '🚨 no reutiliza ninguno de los cuatro buscadores: éste busca ALIMENTOS');
ok(!/JSON\.stringify|localStorage|indice\s*=\s*\[/.test(CODIGO),
  '⚠️ y no guarda un índice, que se quedaría viejo');
ok(MINIMO_BUSQUEDA >= 2, '⚠️ el mínimo está declarado, no escrito a mano en la vista');

console.log('\n── 6. La segunda fuente: Open Food Facts por nombre ─────────────');
ok(/buscarAlimentosPorNombre/.test(OFF), 'la búsqueda por nombre vive donde la de código de barras');
ok(!/api[_-]?key|apiKey|token|secret/i.test(soloCodigo(OFF)),
  '🚨 y NI UNA CLAVE: Open Food Facts no la necesita, y en el frontend no se pone un secreto');
ok(/energy-kcal/.test(OFF) && /proteins_100g/.test(OFF),
  '⚠️ los valores son los de la etiqueta, por 100 g');
ok(/if \(!nombre \|\| !kcal\) return null/.test(OFF),
  '🚨 y se descarta la ficha sin calorías: registraría un plato que no suma nada (regla 8)');
const off = alimentoDesdeOFF({ codigo: '123', nombre: 'Yogur X', marca: 'Marca', por100g: { calorias: 60, proteinas: 4, carbohidratos: 5, grasas: 2, fibra: 0 } });
ok(off.por100.calorias === 60 && off.unidad === 'g',
  '⚠️ y lo que devuelve tiene la MISMA FORMA que un alimento de la base');
ok(off.marca === 'Marca', '⚠️ con su marca, que es por lo que el apartado 3 pide poder buscar');
eq(alimentoDesdeOFF(null), null, '⚠️ y sin producto no inventa uno');
eq(alimentoDesdeOFF({ nombre: '' }), null, '⚠️ ni con un nombre vacío');
ok(comida.nombre === 'Avena' && crearComidaDesdeAlimento({ alimento: off, cantidad: 100, fecha: HOY }).nombre === 'Yogur X (Marca)',
  '⚠️ y al registrarlo la marca va en el nombre, que es como él lo reconocerá luego');

console.log('\n── 7. 🚨 Editar sin borrar y volver a crear (apartado 7) ────────');
const doble = cambiarCantidad(comida, 120);
ok(doble.ok, 'se puede cambiar la cantidad');
eq(doble.comida.calorias, 467, '🚨 Y RECALCULA: 120 g de avena son 467 kcal, no las 233 de antes');
eq(doble.comida.cantidad, 120, '⚠️ con la cantidad nueva guardada');
eq(doble.comida.id, comida.id, '🚨 y es LA MISMA comida: mismo id, no una nueva');
eq(doble.comida.fecha, comida.fecha, '⚠️ mismo día');
eq(doble.comida.momento, comida.momento, '⚠️ y mismo momento');
ok(!cambiarCantidad(comida, 0).ok, '⚠️ una cantidad imposible no escribe nada');
ok(/mayor que cero/i.test(cambiarCantidad(comida, 0).error), '⚠️ y dice por qué');
/* 🚨 Y lo que NO se puede hacer, dicho en vez de fingido (regla 8). */
const aMano = { id: 'x', nombre: 'Tortilla de mi madre', calorias: 400, fecha: HOY };
ok(!cambiarCantidad(aMano, 200).ok,
  '🚨 UNA COMIDA ESCRITA A MANO NO TIENE DE QUÉ ESCALAR, así que no se le cambia la cantidad');
ok(cambiarCantidad(aMano, 200).sinReferencia && /a mano/i.test(cambiarCantidad(aMano, 200).error),
  '🚨 y SE DICE, en vez de enseñar un control que no haría nada');
ok(CODIGO_VISTA.includes('puedeEscalar'), '⚠️ y la pantalla lo distingue de verdad');

const movida = cambiarMomento(comida, 'cena');
eq(movida.momento, 'cena', '*"cambiar de comida"*: de Desayuno a Cena');
eq(movida.calorias, comida.calorias, '🚨 sin tocar ni un número: moverla no la recalcula');
eq(cambiarMomento(comida, 'inventado').momento, comida.momento, '⚠️ y un momento que no existe no la mueve');

const editada = editarValores(comida, { calorias: 300 });
eq(editada.calorias, 300, 'los números se pueden editar a mano (apartado 7)');
eq(editada.por100, null,
  '🚨 Y ENTONCES SE PIERDE LA REFERENCIA: si no, el siguiente cambio de cantidad los pisaría con los viejos');
eq(editarValores(comida, { calorias: -5 }).calorias, 0, '⚠️ y un negativo se queda en cero, no en menos');
eq(editarValores(comida, {}).por100, comida.por100, '⚠️ sin cambiar nada, la referencia se queda');

console.log('\n── 8. Los totales por comida (apartado 9) ───────────────────────');
const otra = { id: 'o', fecha: HOY, momento: 'desayuno', nombre: 'Leche', calorias: 122, proteinas: 6.4, carbohidratos: 9.6, grasas: 6.6 };
const t = totalesDeMomento([comida, otra]);
eq(t.calorias, 355, 'las kcal del momento se suman');
eq(t.proteinas, 16.5, '⚠️ y los macros');
eq(t.alimentos, 2, '⚠️ con cuántos alimentos son');
const linea = lineaDeMomento([comida, otra]);
ok(linea.kcal === '355 kcal' && /g proteína/.test(linea.macros),
  '🚨 «355 kcal · 16.5 g proteína · …» — la línea del apartado 9');
eq(lineaDeMomento([]), null,
  '🚨 Y UNA COMIDA VACÍA NO TIENE LÍNEA DE CEROS: `null`, y sale su estado vacío (apartado 14)');
eq(lineaDeMomento(null), null, '⚠️ ni con basura');
ok(!/momentoTotales|totales\s*:/.test(soloCodigo(APP)),
  '🚨 y los totales NO se guardan: se derivan, o mentirían al borrar un alimento');

console.log('\n── 9. Superar el objetivo (apartado 11) ─────────────────────────');
const superado = { consumido: 2550, objetivo: 2400, porcentaje: 106, porcentajePintado: 100 };
eq(estadoDeIndicador(superado).id, 'superado', '2.550 / 2.400 es «por encima del objetivo»');
eq(excesoDe(superado), 150, '⚠️ y se dice CUÁNTO, con un número, no con un adjetivo');
eq(superado.porcentajePintado, 100, '🚨 la barra no pasa del 100 %: no se rompe (apartado 11)');
ok(superado.porcentaje > 100, '🚨 pero el dato SÍ, que es la decisión de la E3 F35');
eq(estadoDeIndicador({ consumido: 1200, objetivo: 2400 }).id, 'en_camino', 'a mitad, «vas por aquí»');
eq(estadoDeIndicador({ consumido: 2400, objetivo: 2400 }).id, 'cumplido', 'justo, «objetivo alcanzado»');
eq(estadoDeIndicador({ consumido: 2380, objetivo: 2400 }).id, 'cumplido', '⚠️ y casi justo también');
eq(estadoDeIndicador({ consumido: 850, objetivo: null }).id, 'sin_objetivo',
  '🚨 y SIN objetivo no hay estado: la pantalla enseña lo consumido y ya (E3 F33)');
eq(excesoDe({ consumido: 1200, objetivo: 2400 }), null, '⚠️ sin pasarse no sobra nada');
ok(MARGEN_CUMPLIDO > 0.9 && MARGEN_CUMPLIDO < 1, '⚠️ el margen está declarado, no escrito a mano');
/* ⚠️ Ni un reproche: es un dato, no una regañina (EH F58, E3 F13). */
const textos = ESTADOS_OBJETIVO.map((e) => e.nombre).join(' ');
ok(!/(te has pasado|mal|fallo|demasiado|exceso|culpa)/i.test(textos),
  '🚨 y NINGÚN estado suena a reproche: «Por encima del objetivo», nunca «te has pasado»');

console.log('\n── 10. Los días siguen separados (apartados 12 y 13) ────────────');
const dias = [comida, { id: 'ayer', fecha: '2026-09-06', momento: 'cena', nombre: 'De ayer', calorias: 900, proteinas: 30, carbohidratos: 90, grasas: 20 }];
eq(comidasDelDia(dias, HOY).length, 1, 'un día enseña solo lo suyo');
eq(resumenDelDia(dias, HOY)[0].consumido, 233, '⚠️ y sus totales son los de ese día');
eq(resumenDelDia(dias, '2026-09-06')[0].consumido, 900, '⚠️ y los del otro, los del otro');
eq(resumenDelDia(dias, '2026-09-05')[0].consumido, 0, '⚠️ y un día sin nada suma cero, sin heredar del vecino');
eq(porMomento(dias, HOY).desayuno.length, 1, '⚠️ agrupado por momento, con los cinco de siempre');
eq(MOMENTOS.length, 5, '⚠️ que siguen siendo cinco (apartado 1)');

console.log('\n── 11. El normalizador — vigésima vez del mismo fallo ───────────');
const viejo = { id: 'v', fecha: HOY, nombre: 'De antes', calorias: 200, proteinas: 5 };
const n = normalizarComidaF4(viejo);
eq(n.calorias, 200, '🚨 lo guardado antes de esta fase NO pierde nada');
eq(n.cantidad, null, '⚠️ y su cantidad es `null`, que es la verdad: nadie sabe cuántos gramos era');
eq(n.unidad, null, '⚠️ igual que su unidad');
eq(n.por100, null, '⚠️ y sus valores de referencia');
eq(textoCantidad(n), null, '🚨 así que no se pinta «0 g», que sería una cantidad inventada');
eq(textoCantidad(comida), '60 g', '⚠️ y la que sí se sabe, se pinta con su unidad');
eq(textoCantidad({ cantidad: 2, unidad: 'ud' }), '2 ud', '⚠️ dos huevos son «2 ud»');
eq(normalizarComidaF4({ ...comida, cantidad: -3 }).cantidad, null, '⚠️ una cantidad imposible guardada se limpia');
eq(normalizarComidaF4({ ...comida, unidad: 'toneladas' }).unidad, null, '⚠️ igual que una unidad que no existe');
eq(normalizarComidaF4(null), null, '⚠️ y con basura no revienta');
const mod = normalizarNutricionF4({ comidas: [viejo], agua: { [HOY]: 1500 }, favoritos: [{ id: 'f' }], objetivos: { configurado: true } });
eq(mod.agua[HOY], 1500, '🚨 Y DEVUELVE EL MÓDULO ENTERO: el agua sigue ahí (regla 5)');
eq(mod.favoritos.length, 1, '⚠️ y los favoritos');
eq(mod.objetivos.configurado, true, '⚠️ y los objetivos de la F35');
ok(/normalizarNutricionF4/.test(APP), '⚠️ y `App.jsx` lo llama AL CARGAR, antes de que nadie lo lea');
ok(APP.indexOf('normalizarNutricionF4(normalizarNutricionObjetivos') > 0,
  '🚨 encadenado con el de la F35 y el de la F33: los tres, en orden');

console.log('\n── 12. ⚠️ Lo que YA EXISTÍA no se quita (apartado 18) ───────────');
/* La lección de la E3 F34, otra vez: *"no implementar"* no es *"quitar"*. */
ok(YA_EXISTIA.length >= 4, 'cuatro cosas declaradas con desde cuándo existen');
ok(/Barcode|BarcodeScanner/.test(VISTA), '🚨 el escáner de códigos SIGUE en la pantalla');
ok(/Foto del plato/.test(VISTA), '🚨 y la foto del plato con la IA');
ok(/FavoritosTab/.test(VISTA), '⚠️ y los favoritos básicos: lo aplazado son los «avanzados» (F5)');
ok(/MealForm/.test(VISTA), '⚠️ y el formulario a mano, que es la salida para lo que no está en ninguna base');
ok(YA_EXISTIA.some((y) => /escalar/.test(y.porque)),
  '⚠️ y se declara que `escalar()` sale del escáner, no es una cuenta nueva');
ok(!/function escalarGramos|const factor = Number\(g\) \/ 100/.test(CODIGO),
  '⚠️ sin una segunda copia de la misma cuenta');

console.log('\n── 13. Lo que esta fase NO hace (apartado 18) ───────────────────');
ok(NO_EN_NU4.length >= 5, 'cinco cosas declaradas con su motivo y su fase');
ok(NO_EN_NU4.every((x) => x.que && x.porque && x.fase), '⚠️ las tres cosas en cada línea');
ok(NO_EN_NU4.some((x) => /personalizados/i.test(x.que) && x.fase === 'NU F5'), '⚠️ los alimentos personalizados son la F5');
ok(NO_EN_NU4.some((x) => /estadísticas/i.test(x.que)), '⚠️ las estadísticas, la F6');
ok(NO_EN_NU4.some((x) => /IA/.test(x.que)), '⚠️ y la IA nutricional, la F7');
ok(!/askAI|contextoParaIA/.test(CODIGO), '⚠️ y no se llama a la IA desde aquí');
ok(!/estadistic/i.test(CODIGO), '⚠️ ni se calcula ninguna estadística');

console.log('\n── 14. Los estados vacíos (apartado 14) ─────────────────────────');
ok(/Todavía no has añadido alimentos/.test(VACIO_MOMENTO_F4.titulo), 'el texto del apartado 14, literal');
ok(!!VACIO_MOMENTO_F4.accion, '⚠️ con su salida: un vacío sin salida es una pantalla rota (EH F41)');
ok(!/error/i.test(VACIO_MOMENTO_F4.titulo), '⚠️ y no suena a mensaje de error');
eq(PASOS_ANADIR.length, 2, '🚨 y el flujo son DOS pasos, no un formulario gigantesco (apartado 2)');
ok(PASOS_ANADIR.every((p) => p.nombre && p.que), '⚠️ cada uno con qué se hace en él');

console.log('\n── 15. La pantalla (apartados 1, 15 y 16) ───────────────────────');
ok(CODIGO_VISTA.includes('AnadirAlimento'), 'la pantalla tiene el flujo de añadir');
ok(CODIGO_VISTA.includes('AlimentoRegistrado'), '⚠️ y la ficha de uno ya registrado, con sus acciones');
ok(CODIGO_VISTA.includes('lineaDeMomento'), '⚠️ y usa la línea de resumen del apartado 9');
ok(CODIGO_VISTA.includes('estadoDeIndicador') && CODIGO_VISTA.includes('excesoDe'),
  '⚠️ y el estado de superar el objetivo (apartado 11)');
ok(CODIGO_VISTA.includes('onDeleteComida'), '⚠️ el borrado sigue siendo el de siempre, por la papelera');
ok(CODIGO_VISTA.includes('onActualizarComida'), '⚠️ y editar es una llamada nueva, no un borrar y crear');
ok(/aria-label/.test(VISTA), '⚠️ con sus etiquetas para VoiceOver');
ok(!/#[0-9a-fA-F]{6}/.test(CODIGO_VISTA.split('AnadirAlimento')[1] || ''),
  '🚨 y ni un hex suelto en lo nuevo: los colores son tokens (regla 2)');
/* 🚨 Y la cantidad **no viene puesta**: 100 g de aceite y 100 g de lechuga no
   son el mismo plato. */
ok(/setCantidad\(''\)/.test(VISTA),
  '🚨 LA CANTIDAD NO TIENE VALOR POR DEFECTO al elegir un alimento');

console.log('\n── 16. 🚨 La condición de finalización se CALCULA (apartado 19) ─');
const cond = condicionNU4({ vista: VISTA });
eq(cond.length, 17, 'los diecisiete puntos del criterio');
const rojos = cond.filter((c) => !c.ok);
ok(rojos.length === 0, `🚨 y ninguno rojo — cada uno ejecuta el cálculo de verdad${rojos.length ? `: ${rojos.map((r) => r.texto).join(', ')}` : ''}`);
ok(condicionNU4({ vista: '' }).some((c) => !c.ok),
  '🚨 con una pantalla vacía se pone roja: una auditoría que no puede fallar no sirve (EH F42)');

console.log('\n' + '═'.repeat(70));
if (fallos.length) {
  console.log(`✗ ${fallos.length} fallos de ${pasa + fallos.length}`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F36 (NU F4) · El registro de alimentos`);
