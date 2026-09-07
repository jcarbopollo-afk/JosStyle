// ══════════════════════════════════════════════════════════════════════════
// E3 · FASE 37 (NU F5) — BASE DE ALIMENTOS, PERSONALIZADOS Y FAVORITOS
// ══════════════════════════════════════════════════════════════════════════
//
// El apartado 15 pide separar cuatro cosas —alimentos globales, alimentos del
// usuario, favoritos y recientes— y termina con *"no duplicar innecesariamente
// el mismo alimento"*. Buena parte de estas comprobaciones miran justo eso: que
// un favorito sea **un id**, que los recientes **no se guarden** y que el
// buscador de la F4 no se haya escrito otra vez.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  CATEGORIAS_ALIMENTO, categoria, categoriaDe, porCategoria, CATEGORIA_POR_DEFECTO,
  CAMPOS_PROPIO, MAXIMO_POR_100, validarPropio, crearAlimentoPropio,
  esProtegido, AVISO_PROTEGIDO, editarAlimentoPropio, NO_SE_REESCRIBE,
  normalizarAlimentoPropio, normalizarMisAlimentosDe,
  alternarFavoritoAlimento, esFavorito, alimentosFavoritos,
  ARQUITECTURA_RECIENTES, DIAS_RECIENTES, recientesPorDia, recientes,
  reutilizarComida, catalogoCompleto, buscarEnTodos, resumenNutricional,
  SECCIONES_SELECTOR, ACCION_CREAR, selectorInicial,
  NO_EN_NU5, SIGUE_EXISTIENDO, AUDITORIA_NU5, condicionNU5,
} from '../src/lib/misAlimentos.js';
import { BASE_ALIMENTOS, alimentoDeBase, escalar, crearComidaDesdeAlimento, UNIDADES } from '../src/lib/alimentos.js';

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
const APP = leer('src/App.jsx');
const LIB = leer('src/lib/misAlimentos.js');
const CODIGO = soloCodigo(LIB);

const YOGUR = crearAlimentoPropio({ nombre: 'Yogur X', marca: 'Mi marca', calorias: 80, proteinas: 8, carbohidratos: 5, grasas: 3, tipo: 'lácteo' }).alimento;
const CATALOGO = catalogoCompleto([YOGUR]);
const COMIDAS = [
  { id: 'c1', fecha: HOY, momento: 'desayuno', nombre: 'Avena', calorias: 233, proteinas: 10.1, carbohidratos: 39.8, grasas: 4.1, alimentoId: 'avena', cantidad: 60, unidad: 'g', por100: alimentoDeBase('avena').por100 },
  { id: 'c2', fecha: HOY, momento: 'desayuno', nombre: 'Leche entera', calorias: 153, alimentoId: 'leche_entera', cantidad: 250, unidad: 'ml', por100: alimentoDeBase('leche_entera').por100 },
  { id: 'c3', fecha: '2026-09-06', momento: 'comida', nombre: 'Pechuga de pollo', calorias: 248, alimentoId: 'pollo_pechuga' },
  { id: 'c4', fecha: '2026-09-06', momento: 'comida', nombre: 'Tortilla de mi madre', calorias: 400 },
];

console.log('\n══ E3 · Fase 37 (NU F5) — la base de alimentos, los propios y los favoritos ══');

console.log('\n── 1. 🚨 Nada de la F4 se reescribe (apartado 16) ───────────────');
ok(/from '\.\/alimentos\.js'/.test(LIB), 'este archivo IMPORTA la base de la F4');
ok(!/BASE_ALIMENTOS = \[/.test(CODIGO), '🚨 y NO la redefine: una segunda base diría números distintos');
ok(!/function buscarAlimentos\b/.test(CODIGO), '🚨 ni reescribe el buscador: `buscarAlimentos` ya recibía la base por parámetro');
eq(AUDITORIA_NU5.buscadoresNuevos, 0, '⚠️ y está declarado');
eq(AUDITORIA_NU5.basesDuplicadas, 0, '⚠️ igual que las bases duplicadas (apartado 15)');
ok(!/function escalar\b/.test(CODIGO), '⚠️ ni el cálculo proporcional, que es de la F4 (apartado 11)');
eq(escalar(alimentoDeBase('avena').por100, 60, 'g').calorias, 233, '⚠️ y sigue dando 233 kcal para 60 g de avena');
eq(crearComidaDesdeAlimento({ alimento: YOGUR, cantidad: 125, fecha: HOY }).calorias, 100,
  '🚨 Y UN ALIMENTO PROPIO SE REGISTRA CON LA MISMA FUNCIÓN: 125 g de Yogur X son 100 kcal');

console.log('\n── 2. 🚨 Ni una clave nueva de `app_data` (apartado 14) ─────────');
eq(AUDITORIA_NU5.clavesNuevas, 0, 'los propios y los favoritos viven dentro de `nutricion`');
ok(!/saveData\(\s*['"]alimentos/.test(soloCodigo(APP)), '⚠️ y `App.jsx` no escribe en una clave nueva');
const mod = normalizarMisAlimentosDe({ comidas: COMIDAS, agua: { [HOY]: 1500 }, favoritos: [{ id: 'f' }], objetivos: { configurado: true }, alimentosPropios: [YOGUR], favoritosAlimentos: ['avena'] });
eq(mod.agua[HOY], 1500, '🚨 Y EL NORMALIZADOR DEVUELVE EL MÓDULO ENTERO: el agua sigue ahí (regla 5)');
eq(mod.favoritos.length, 1, '⚠️ las comidas favoritas de la Fase 4 también');
eq(mod.comidas.length, 4, '⚠️ y las comidas');
eq(mod.objetivos.configurado, true, '⚠️ y los objetivos de la F35');
eq(mod.alimentosPropios.length, 1, '⚠️ con los alimentos propios');
eq(mod.favoritosAlimentos, ['avena'], '⚠️ y los favoritos de alimento');

console.log('\n── 3. ⚠️ «Favoritos» ya significaba otra cosa aquí ──────────────');
/* `nutricion.favoritos` son COMIDAS guardadas desde la Fase 4; lo que pide el
   apartado 7 son ALIMENTOS marcados. Dos listas del mismo módulo no pueden
   llamarse igual (EH F22). */
ok(/favoritosAlimentos/.test(LIB), 'los alimentos marcados son `favoritosAlimentos`');
ok(SIGUE_EXISTIENDO.some((x) => /favoritas/i.test(x.que)), '🚨 y se declara que `nutricion.favoritos` es otra cosa');
ok(/FavoritosTab/.test(VISTA), '⚠️ y la pestaña de comidas favoritas sigue en la pantalla');
eq(mod.favoritos[0].id, 'f', '⚠️ intacta tras normalizar');

console.log('\n── 4. Los favoritos son REFERENCIAS (apartados 7 y 15) ──────────');
eq(alternarFavoritoAlimento([], 'avena'), ['avena'], 'marcar guarda el id');
eq(alternarFavoritoAlimento(['avena'], 'avena'), [], '⚠️ y desmarcar lo quita');
ok(esFavorito(['avena'], 'avena') && !esFavorito(['avena'], 'pollo_pechuga'), '⚠️ y se sabe cuál está marcado');
const favs = alimentosFavoritos(['avena', YOGUR.id], CATALOGO);
eq(favs.length, 2, 'los favoritos se resuelven contra el catálogo');
eq(favs[0].por100.calorias, 389, '🚨 CON LOS VALORES DEL ALIMENTO, NO UNA COPIA: editarlo cambia su favorito');
/* 🚨 La comprobación que de verdad lo demuestra: lo guardado son **cadenas**,
   no objetos. Un `{ id, nombre, kcal }` sería la copia que el apartado 15
   prohíbe, y se quedaría vieja al editar el alimento. */
ok(alternarFavoritoAlimento([], 'avena').every((x) => typeof x === 'string'),
  '🚨 y lo guardado son IDS, no fichas: una copia se quedaría vieja al editar el alimento (apartado 15)');
eq(alternarFavoritoAlimento([{ id: 'avena', nombre: 'Avena' }], 'x'), ['x'],
  '⚠️ y una ficha guardada por error se descarta al tocar la lista');
eq(alimentosFavoritos(['borrado'], CATALOGO), [], '⚠️ un favorito de algo que ya no existe no se pinta');
eq(normalizarMisAlimentosDe({ favoritosAlimentos: ['borrado', 'avena'] }).favoritosAlimentos, ['avena'],
  '🚨 y el normalizador lo limpia: guardar el id de algo borrado es guardar una mentira (EH F24)');
eq(normalizarMisAlimentosDe({ favoritosAlimentos: ['avena', 'avena'] }).favoritosAlimentos, ['avena'],
  '⚠️ y no se repite');

console.log('\n── 5. 🚨 Los recientes NO se guardan: se derivan (apartado 8) ───');
eq(ARQUITECTURA_RECIENTES.guardado, false, 'no hay una lista `recientes` guardada');
eq(AUDITORIA_NU5.historialesGuardados, 0, '⚠️ y está declarado');
ok(/comidas/.test(ARQUITECTURA_RECIENTES.deDonde), '⚠️ salen de las comidas, que ya llevan `alimentoId` desde la F4');
ok(/persist/i.test(ARQUITECTURA_RECIENTES.persiste), '🚨 y persisten igual, porque las comidas persisten (apartado 14)');
const rec = recientesPorDia(COMIDAS, CATALOGO, HOY);
eq(rec.length, 2, 'dos días con alimentos');
eq(rec[0].etiqueta, 'Hoy', '⚠️ el más reciente primero, con su etiqueta');
eq(rec[1].etiqueta, 'Ayer', '⚠️ y el siguiente');
eq(rec[0].alimentos.map((a) => a.nombre), ['Avena', 'Leche entera'], '🚨 «Hoy: Avena, Leche» — el ejemplo del apartado 8');
eq(rec[1].alimentos.map((a) => a.nombre), ['Pechuga de pollo'], '⚠️ y «Ayer: Pollo»');
ok(!rec[1].alimentos.some((a) => a.nombre === 'Tortilla de mi madre'),
  '⚠️ una comida escrita a mano no tiene alimento al que volver, así que no sale como reciente');
const repetido = recientesPorDia([...COMIDAS, { id: 'c5', fecha: '2026-09-06', alimentoId: 'avena' }], CATALOGO, HOY);
eq(repetido[1].alimentos.map((a) => a.id), ['pollo_pechuga'],
  '🚨 y un alimento que ya salió hoy NO se repite ayer: verlo dos veces no ayuda a encontrarlo');
eq(recientes([], CATALOGO, HOY), [], '⚠️ sin comidas no hay recientes, y no revienta');
eq(recientesPorDia(COMIDAS, CATALOGO, '2026-09-05').length, 0,
  '⚠️ y los de un día futuro no se cuentan: no han pasado todavía');
ok(DIAS_RECIENTES >= 7, '⚠️ la ventana está declarada, no escrita a mano en la vista');

console.log('\n── 6. Los alimentos personalizados (apartados 4 y 5) ────────────');
ok(YOGUR && YOGUR.por100.calorias === 80, 'se crea con sus valores por 100 g');
eq(YOGUR.propio, true, '⚠️ marcado como propio, que es lo único que lo distingue de uno global');
eq(YOGUR.marca, 'Mi marca', '⚠️ con su marca, que es opcional');
ok(YOGUR.id.startsWith('propio_'), '⚠️ y un id que no puede chocar con los de la base');
ok(CAMPOS_PROPIO.length === 6 && CAMPOS_PROPIO.filter((c) => c.obligatorio).length === 5,
  '⚠️ seis campos, cinco obligatorios: la marca es opcional (apartado 5)');
/* *"Validar todos los campos"* (apartado 5). */
ok(!crearAlimentoPropio({ calorias: 80, proteinas: 8, carbohidratos: 5, grasas: 3 }).ok, 'sin nombre no se crea');
ok(!!validarPropio({}).errores.nombre && !!validarPropio({}).errores.calorias, '⚠️ y se dice qué falta');
ok(/nombre/i.test(validarPropio({}).errores.nombre), '⚠️ con qué corregir, no «Error» a secas (EH F62)');
ok(!!validarPropio({ nombre: 'X', calorias: -5, proteinas: 1, carbohidratos: 1, grasas: 1 }).errores.calorias,
  '⚠️ un negativo no vale');
ok(!!validarPropio({ nombre: 'X', calorias: 5000, proteinas: 1, carbohidratos: 1, grasas: 1 }).errores.calorias,
  `⚠️ ni más de ${MAXIMO_POR_100.calorias} kcal por 100 g`);
ok(!!validarPropio({ nombre: 'X', calorias: 0, proteinas: 1, carbohidratos: 1, grasas: 1 }).errores.calorias,
  '🚨 ni CERO kcal: sería registrar un plato que no suma nada (regla 8)');
eq(validarPropio({ nombre: 'X', calorias: 80, proteinas: 8, carbohidratos: 5, grasas: 3 }).valido, true,
  '⚠️ y uno correcto pasa');

console.log('\n── 7. Editar y eliminar los propios (apartado 6) ────────────────');
const editado = editarAlimentoPropio(YOGUR, { calorias: 85 });
ok(editado.ok, 'un alimento propio se puede editar');
eq(editado.alimento.por100.calorias, 85, '⚠️ con su valor nuevo');
eq(editado.alimento.id, YOGUR.id, '🚨 Y CONSERVA EL ID: si no, sus favoritos apuntarían al viejo');
eq(editado.alimento.nombre, YOGUR.nombre, '⚠️ y lo que no se toca se queda');
ok(!editarAlimentoPropio(YOGUR, { calorias: -1 }).ok, '⚠️ y la edición se valida igual que la creación');
/* 🚨 Apartado 6 — *"no permitir modificar accidentalmente alimentos globales"*. */
ok(esProtegido('avena') && esProtegido('pollo_pechuga'), 'los de la base están protegidos');
ok(!esProtegido(YOGUR.id), '⚠️ y los suyos no');
const intento = editarAlimentoPropio(alimentoDeBase('avena'), { calorias: 1 });
ok(!intento.ok && intento.protegido, '🚨 EDITAR UNO DE LA BASE NO ESCRIBE NADA');
ok(/copia propia/i.test(AVISO_PROTEGIDO), '🚨 y se le ofrece la salida: hacerse una copia suya (regla 8)');
ok(/no toca lo que ya tienes registrado/i.test(NO_SE_REESCRIBE),
  '⚠️ y editar un alimento NO reescribe lo ya registrado: aquello es historial (apartado 16)');
eq(COMIDAS[0].calorias, 233, '⚠️ que sigue con sus números');

console.log('\n── 8. Reutilizar una comida (apartado 9) ────────────────────────');
const otra = reutilizarComida(COMIDAS[0], { fecha: HOY, momentoId: 'merienda' });
eq(otra.calorias, 233, 'se copian sus números');
eq(otra.cantidad, 60, '⚠️ y su cantidad, que es lo que ahorra el trabajo');
eq(otra.momento, 'merienda', '⚠️ en el momento que se diga');
ok(otra.id !== COMIDAS[0].id, '🚨 con un id NUEVO: es otra comida, no la misma movida');
const aMano = reutilizarComida(COMIDAS[3], { fecha: HOY });
eq(aMano.calorias, 400,
  '🚨 Y FUNCIONA CON LAS ESCRITAS A MANO, que son justo las que más cuesta volver a escribir');
eq(reutilizarComida(null), null, '⚠️ y con basura no revienta');

console.log('\n── 9. Las categorías (apartado 3) ───────────────────────────────');
ok(CATEGORIAS_ALIMENTO.length >= 10, 'hay diez categorías o más');
ok(CATEGORIAS_ALIMENTO.every((c) => c.id && c.nombre && c.emoji), '⚠️ cada una con su nombre y su icono');
eq(categoriaDe(alimentoDeBase('avena')).id, 'cereal', 'la avena es un cereal');
eq(categoriaDe(alimentoDeBase('leche_entera')).nombre, 'Lácteos', '⚠️ y la leche, un lácteo');
eq(categoriaDe({}).id, CATEGORIA_POR_DEFECTO, '⚠️ y lo que no encaja cae en Otros, no se pierde');
ok(porCategoria(CATALOGO).length >= 8, 'los alimentos se agrupan por categoría');
ok(porCategoria(CATALOGO).every((c) => c.alimentos.length > 0),
  '⚠️ y una categoría vacía no se pinta vacía: no se pinta');
ok(porCategoria([]).length === 0, '⚠️ sin catálogo no hay categorías');
/* 🚨 Agrupar es el catálogo más la palabra que el alimento ya lleva, no un mapa
   `id → grupo` aparte (EH F30). */
ok(!/const MAPA_CATEGORIA|categoriaPorId\s*=\s*\{/.test(CODIGO),
  '🚨 y NO hay un mapa `alimento → categoría` aparte: cada alimento ya trae su `tipo`');

console.log('\n── 10. El buscador mejorado (apartado 2) ────────────────────────');
ok(buscarEnTodos('yogur', [YOGUR]).some((a) => a.id === YOGUR.id), 'encuentra los propios');
ok(buscarEnTodos('avena', [YOGUR]).some((a) => a.id === 'avena'), '⚠️ y los de la base');
eq(buscarEnTodos('YOGUR', [YOGUR]).length, buscarEnTodos('yogur', [YOGUR]).length,
  '⚠️ sin distinguir mayúsculas (apartado 2)');
ok(buscarEnTodos('mi marca', [YOGUR]).length > 0, '⚠️ y también por marca');
eq(catalogoCompleto([YOGUR])[0].id, YOGUR.id,
  '⚠️ y los suyos salen primero: los ha creado a propósito');
eq(resumenNutricional(alimentoDeBase('avena')), '389 kcal · 16.9 P · 66.3 C · 6.9 G / 100 g',
  '🚨 con la línea resumida del apartado 2, con los números del enunciado');
eq(resumenNutricional(alimentoDeBase('leche_entera')), '61 kcal · 3.2 P · 4.8 C · 3.3 G / 100 ml',
  '⚠️ y la leche en mililitros, que es su unidad');
eq(resumenNutricional(null), null, '⚠️ y sin alimento no se inventa una línea');
eq(catalogoCompleto(null).length, BASE_ALIMENTOS.length, '⚠️ sin alimentos propios queda la base');
eq(catalogoCompleto([{ nombre: '' }]).length, BASE_ALIMENTOS.length, '⚠️ y uno corrupto no entra');

console.log('\n── 11. El selector (apartado 12) ────────────────────────────────');
eq(SECCIONES_SELECTOR.map((s) => s.id), ['favoritos', 'recientes', 'todos'],
  'las tres secciones del apartado 12, en su orden');
ok(SECCIONES_SELECTOR.every((s) => s.vacio && !/error/i.test(s.vacio)),
  '⚠️ cada una con su estado vacío, y ninguno suena a error');
ok(/Crear alimento/i.test(ACCION_CREAR), '⚠️ y el botón de crear');
const sel = selectorInicial({ favoritos: ['avena'], alimentosPropios: [YOGUR], comidas: COMIDAS, hoy: HOY });
eq(sel.favoritos.length, 1, 'el selector abre con sus favoritos');
eq(sel.recientes.length, 3, '⚠️ y sus recientes, sin escribir nada');
eq(sel.propios.length, 1, '⚠️ y sus alimentos propios');
eq(sel.total, BASE_ALIMENTOS.length + 1, '⚠️ sobre el catálogo entero');

console.log('\n── 12. Las unidades (apartado 10) ───────────────────────────────');
eq(UNIDADES.map((u) => u.id), ['g', 'ml', 'ud'], 'gramos, mililitros y unidades');
eq(escalar(alimentoDeBase('huevo').por100, 2, 'ud').calorias, 156, '🚨 dos huevos son 156 kcal');
eq(escalar(alimentoDeBase('leche_entera').por100, 250, 'ml').calorias, 153, '⚠️ y 250 ml de leche, 153');
eq(crearAlimentoPropio({ nombre: 'Batido', calorias: 60, proteinas: 3, carbohidratos: 7, grasas: 2, unidad: 'ml' }).alimento.unidad, 'ml',
  '⚠️ y un alimento propio puede tener la suya');
eq(crearAlimentoPropio({ nombre: 'X', calorias: 60, proteinas: 3, carbohidratos: 7, grasas: 2, unidad: 'kg' }).alimento.unidad, 'g',
  '⚠️ una unidad que no existe cae en gramos, no rompe nada');

console.log('\n── 13. El normalizador — vigesimoprimera vez ────────────────────');
eq(normalizarAlimentoPropio({ id: 'x', nombre: 'A', por100: { calorias: 100 } }).por100.proteinas, 0,
  'lo que falte se queda en cero, no en `undefined`');
eq(normalizarAlimentoPropio({ id: 'x', nombre: '', por100: { calorias: 100 } }), null, '⚠️ sin nombre no es un alimento');
eq(normalizarAlimentoPropio({ nombre: 'A', por100: { calorias: 100 } }), null, '⚠️ ni sin id: sería un duplicado esperando (EH F45)');
eq(normalizarAlimentoPropio({ id: 'x', nombre: 'A', por100: { calorias: 0 } }), null, '⚠️ ni con cero calorías');
eq(normalizarAlimentoPropio(null), null, '⚠️ y con basura no revienta');
eq(normalizarAlimentoPropio({ id: 'x', nombre: 'A', tipo: 'inventado', por100: { calorias: 50 } }).tipo, CATEGORIA_POR_DEFECTO,
  '⚠️ una categoría que no existe cae en Otros');
ok(/normalizarMisAlimentosDe/.test(APP), '⚠️ y `App.jsx` lo llama AL CARGAR, antes de que nadie lo lea');

console.log('\n── 14. La pantalla y lo que no se hace (apartados 13 y 17) ──────');
ok(CODIGO_VISTA.includes('FormularioAlimento'), 'la pantalla tiene el formulario de alimento propio');
ok(CODIGO_VISTA.includes('onEliminarAlimentoPropio'), '⚠️ y se pueden eliminar');
ok(CODIGO_VISTA.includes('SECCIONES_SELECTOR') || CODIGO_VISTA.includes('selectorInicial'),
  '⚠️ y el selector se pinta recorriendo el catálogo, no con bloques a mano');
/* ⚠️ **Y cada uno en su sitio**: la ★ es de la pantalla, y quien escribe la
   lista es `App.jsx`, que es el dueño del almacén — el mismo reparto que
   `gestionModulos.js` / `estiloDeHombre.js`. Buscar la función en la vista
   habría sido buscarla donde no le toca estar. */
ok(/<Star/.test(VISTA) && /onFavorito\(alimento\.id\)/.test(CODIGO_VISTA),
  '⚠️ con su ★ para marcar, en la pantalla');
ok(/alternarFavoritoAlimento\(nutricion\.favoritosAlimentos, id\)/.test(soloCodigo(APP)),
  '⚠️ y quien escribe la lista es `App.jsx`, el dueño del almacén');
ok(CODIGO_VISTA.includes('reutilizarComida'), '⚠️ y el botón de repetir una comida de otro día');
ok(NO_EN_NU5.length >= 3 && NO_EN_NU5.every((x) => x.que && x.porque && x.fase),
  'lo aplazado está declarado con su fase');
ok(!/askAI|estadistic/i.test(CODIGO), '⚠️ y aquí no hay ni IA ni estadísticas');
/* ⚠️ Tercera vez del mismo aviso en este bloque. */
ok(SIGUE_EXISTIENDO.some((x) => /escáner/i.test(x.que)) && /Barcode/.test(VISTA),
  '🚨 y el escáner SIGUE en la pantalla: «no implementar» no es «quitar» (E3 F34 y F36)');

console.log('\n── 15. 🚨 La condición de finalización se CALCULA (apartado 18) ─');
const cond = condicionNU5({ vista: VISTA });
eq(cond.length, 17, 'los diecisiete puntos del criterio');
const rojos = cond.filter((c) => !c.ok);
ok(rojos.length === 0, `🚨 y ninguno rojo${rojos.length ? `: ${rojos.map((r) => r.texto).join(', ')}` : ''}`);
ok(condicionNU5({ vista: '' }).some((c) => !c.ok),
  '🚨 con una pantalla vacía se pone roja: una auditoría que no puede fallar no sirve (EH F42)');

console.log('\n' + '═'.repeat(70));
if (fallos.length) {
  console.log(`✗ ${fallos.length} fallos de ${pasa + fallos.length}`);
  fallos.forEach((f) => console.log(`   · ${f}`));
  process.exit(1);
}
console.log(`✓ ${pasa} comprobaciones correctas — E3 F37 (NU F5) · Base de alimentos, propios y favoritos`);
