/* Gestión de entrenamientos y plantillas propias (Entrega 4 · FIT F4/45).
 *
 * El apartado 25 es una lista de validaciones obligatorias agrupadas en Crear,
 * Abrir, Editar, Duplicar, Eliminar, UX y Técnica. Las de datos se ejecutan
 * aquí; las de pantalla, en el recorrido de Chromium.
 *
 * 🚨 Lo que más se vigila es el apartado 7, que el enunciado pide comprobar
 * **explícitamente**: *"cualquier modificación posterior de la copia NO debe
 * modificar la original"*. No basta con un id nuevo para el plan — si las
 * LÍNEAS comparten id, editar una serie en la copia edita la del original.
 *
 * Y el apartado 2: `UserTemplate` **ya existe** y es `fitness.plantillas`. Hay
 * un barrido que comprueba que esta librería no ha creado un modelo paralelo.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  ORDENACIONES, ORDEN_POR_DEFECTO, MINIMO_PARA_BUSCAR, FILTRO_TODOS, filtrosDeEntorno,
  plantillasDe, plantillaPorId, textoEditado, grupoDominante, fichaDePlantilla,
  lineasDePlantilla, buscarPlantillas, filtrarPlantillas, ordenarPlantillas,
  plantillasVisibles, contarPorEntorno, nombreDeCopia, SUFIJO_COPIA, duplicarPlantilla,
  planEliminarPlantilla, avisoDeEliminar, ESTADO_VACIO_PLANTILLAS, SIN_OBJETIVO, NO_EN_FIT4,
} from '../src/lib/plantillas.js';
import {
  crearRutina, anadirEjercicio, editarLinea, rutinaAPlan, planARutina, guardarRutina,
} from '../src/lib/constructor.js';
import { CATALOGO_PAPELERA } from '../src/lib/papelera.js';
import { crearWorkoutPlan } from '../src/lib/fitness.js';

const RAIZ_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ_DIR, p), 'utf8');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

/* ⚠️ La lección de siempre: un barrido que mira si el código HACE algo tiene
   que quitar los comentarios **y las cadenas**. Esta librería nombra
   «UserTemplate», «entrenamiento en vivo» y «biblioteca de planes» justamente
   para prometer que no están. */
const sinComentarios = (src) => src
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ');
const sinCadenas = (src) => src
  .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
  .replace(/`(?:[^`\\]|\\.)*`/g, '``');
const LIB = leer('src/lib/plantillas.js');
const LIB_CODIGO = sinCadenas(sinComentarios(LIB));

const PRESS = 'press-banca-barra';
const DOMINADA = 'dominada-prona';
const LSIT = 'l-sit';
const HOY = '2026-09-13';

/* Un escenario de verdad: tres plantillas guardadas por el camino de la F3, que
   es el único que existe. ⚠️ Un escenario con los campos mal no falla, calla
   (EH F44, E3 F33), así que se construyen con sus fábricas. */
function plantilla(nombre, entornos, ejercicios, fecha) {
  let r = crearRutina({ nombre, entornos });
  for (const e of ejercicios) r = anadirEjercicio(r, e);
  return { ...rutinaAPlan(r), creadoEn: fecha, editadoEn: fecha };
}
const PUSH = plantilla('Push Hipertrofia', ['gym'], [PRESS, DOMINADA], '2026-09-11');
const PULL = plantilla('Pull Calistenia', ['calistenia'], [DOMINADA], '2026-09-12');
const CORE = plantilla('Core en casa', ['casa'], [LSIT], '2026-09-01');
const TRES = [PUSH, PULL, CORE];

console.log('\n── 1. Los catálogos de la pantalla (apartados 14, 15 y 16) ──');
ok(ORDENACIONES.map((o) => o.id).join(',') === 'recientes,antiguas,az,za',
  'Las cuatro ordenaciones que pide el apartado 14, y ni una más');
ok(ORDEN_POR_DEFECTO === 'recientes', 'Se entra por las más recientes');
ok(typeof MINIMO_PARA_BUSCAR === 'number' && MINIMO_PARA_BUSCAR > 1,
  '⚠️ El buscador solo aparece cuando tiene sentido (apartado 15)');
const filtros = filtrosDeEntorno();
ok(filtros[0].id === FILTRO_TODOS && filtros.length === 4,
  'Todos + los tres entornos del apartado 16');
ok(!/ENTORNOS\s*=/.test(LIB_CODIGO),
  '🚨 Y los entornos NO se redefinen: son los de la F2, importados');

console.log('\n── 2. Leer una plantilla: todo derivado (apartados 10 y 11) ──');
const ficha = fichaDePlantilla(PUSH, [], HOY);
ok(ficha.nombre === 'Push Hipertrofia', 'La ficha trae el nombre');
ok(ficha.ejercicios === 2, '…el número de ejercicios, contado (apartado 21 de la F3)');
ok(ficha.duracion.startsWith('≈'),
  '🚨 …la duración con su «≈»: es una estimación y tiene que parecerlo (apartado 11)');
ok(ficha.entornos.join() === 'Gimnasio', '…el entorno con su nombre');
ok(ficha.distribucion.grupos.length > 0,
  '🚨 …y la distribución muscular DERIVADA de los porcentajes de la F2 (apartado 10)');
ok(Math.abs(ficha.distribucion.grupos.reduce((a, g) => a + g.porcentaje, 0) - 100) <= 2,
  '…normalizada a 100');
ok(ficha.editado === 'Editado hace 2 días',
  '🚨 …y «Editado hace 2 días», que es el ejemplo literal del apartado 3');
ok(textoEditado({ editadoEn: HOY }, HOY) === 'Editado hoy', 'Hoy se dice «Editado hoy»');
ok(textoEditado({ editadoEn: '2026-09-12' }, HOY) === 'Editado ayer', '…y ayer, «Editado ayer»');
ok(textoEditado({}, HOY) === '',
  '⚠️ Y sin fecha no se inventa ninguna: no se dice nada (regla 8)');
/* 🐛 Y la vigésima quinta vez de la lección: esto barría el ARCHIVO buscando
   «minutos», y la cabecera de la librería nombra «hace 20 min» justamente para
   prometer que no está. Se comprueba **lo que sale**, no lo que se escribe. */
ok(![HOY, '2026-09-12', '2026-09-01', '2025-01-01']
  .map((f) => textoEditado({ editadoEn: f }, HOY))
  .some((t) => /min|hora|segundo/i.test(t)),
  '⚠️ Nunca «hace 20 min»: lo guardado es el día, sin hora (E3 F22)');
ok(grupoDominante(PUSH)?.nombre, 'El grupo dominante sale de la propia rutina, no de una foto');
ok(fichaDePlantilla(null) === null, 'Una plantilla que no existe devuelve nada, sin reventar');

console.log('\n── 3. Las filas del detalle (apartado 9) ──');
const filas = lineasDePlantilla(PUSH);
ok(filas.length === 2, 'Una fila por ejercicio');
ok(filas[0].nombre === 'Press de banca · Con barra', '…con su nombre y su variante');
ok(filas.every((f) => f.existe), '…y todas apuntan a un ejercicio que existe');
const conFantasma = { ...PUSH, ejercicios: [{ ...PUSH.ejercicios[0], exerciseId: 'ya-no-existe' }] };
const filasFantasma = lineasDePlantilla(conFantasma);
ok(filasFantasma.length === 1 && filasFantasma[0].existe === false,
  '🚨 Un ejercicio que ya no está en el catálogo se marca, no rompe la plantilla (apartado 24)');
ok(/no existe|no disponible/i.test(filasFantasma[0].nombre),
  '…y se dice con palabras, no con un hueco en blanco (EH F62)');

console.log('\n── 4. Buscar, filtrar y ordenar (apartados 14, 15 y 16) ──');
ok(buscarPlantillas(TRES, 'push').length === 1, 'Buscar «push» encuentra la suya');
ok(buscarPlantillas(TRES, 'PUSH').length === 1, '…sin importar las mayúsculas');
ok(buscarPlantillas(TRES, 'hipertrofia').length === 1, '…y por una palabra de en medio');
ok(buscarPlantillas(TRES, '').length === 3, 'Sin consulta salen todas');
ok(buscarPlantillas(TRES, 'nada de nada').length === 0, 'Y lo que no está, no sale');
ok(filtrarPlantillas(TRES, 'gym').length === 1, 'El filtro de entorno trabaja sobre los datos reales');
ok(filtrarPlantillas(TRES, FILTRO_TODOS).length === 3, '«Todos» no filtra nada');
const cuenta = contarPorEntorno(TRES);
ok(cuenta.gym === 1 && cuenta.calistenia === 1 && cuenta.casa === 1 && cuenta[FILTRO_TODOS] === 3,
  '⚠️ Y cada pastilla sabe cuántas quedarían: un filtro que deja la lista vacía sin avisar es peor que no tenerlo');
ok(ordenarPlantillas(TRES, 'recientes')[0].id === PULL.id, 'Más recientes primero');
ok(ordenarPlantillas(TRES, 'antiguas')[0].id === CORE.id, '…y al revés, las más antiguas');
ok(ordenarPlantillas(TRES, 'az')[0].nombre === 'Core en casa', 'A-Z por nombre');
ok(ordenarPlantillas(TRES, 'za')[0].nombre === 'Push Hipertrofia', '…y Z-A');
ok(ordenarPlantillas(TRES, 'recientes').length === 3 && TRES[0].id === PUSH.id,
  '⚠️ Y ordenar NO muta la lista original: devuelve una copia');
ok(plantillasVisibles(TRES, { consulta: '', entorno: 'gym', orden: 'az' }).length === 1,
  'Los tres se combinan en una sola llamada');
ok(!/saveData|localStorage|app_data/.test(LIB_CODIGO),
  '⚠️ Buscar, filtrar y ordenar NO guardan nada: son estado de la pantalla (EH F40)');

console.log('\n── 5. 🚨 Duplicar, y que la copia sea INDEPENDIENTE (apartado 7) ──');
ok(nombreDeCopia('Push Hipertrofia') === `Push Hipertrofia — ${SUFIJO_COPIA}`,
  'La copia se llama como el ejemplo del apartado 7');
const dup = duplicarPlantilla(TRES, PUSH.id, HOY);
ok(dup.ok && dup.plantillas.length === 4, 'Duplicar añade una plantilla más');
ok(dup.plantillas[1].id === dup.copia.id, '…justo debajo del original');
ok(dup.copia.id !== PUSH.id, '🚨 Con un id NUEVO');
ok(dup.copia.ejercicios.length === PUSH.ejercicios.length, '…los mismos ejercicios');
ok(dup.copia.ejercicios.map((e) => e.exerciseId).join() === PUSH.ejercicios.map((e) => e.exerciseId).join(),
  '…en el mismo orden (apartado 12)');
ok(dup.copia.ejercicios.every((e, i) => e.id !== PUSH.ejercicios[i].id),
  '🚨 Y cada LÍNEA con su propio id: con el mismo, editar la copia editaría el original');
const fichaCopia = fichaDePlantilla(dup.copia, [], HOY);
ok(fichaCopia.duracion === ficha.duracion, '…conserva la duración estimada');
ok(fichaCopia.distribucion.grupos[0].porcentaje === ficha.distribucion.grupos[0].porcentaje,
  '…y la distribución muscular');
/* 🚨 La comprobación que el enunciado pide EXPLÍCITAMENTE. */
const rutinaCopia = planARutina(dup.copia);
const copiaEditada = editarLinea(rutinaCopia, rutinaCopia.lineas[0].id, { series: 9 });
ok(copiaEditada.lineas[0].series === 9, 'Se edita la copia…');
ok(planARutina(PUSH).lineas[0].series !== 9,
  '🚨 …y el ORIGINAL no se entera: *"cualquier modificación posterior de la copia NO debe modificar la original"*');
ok(duplicarPlantilla(TRES, 'no-existe').ok === false, 'Duplicar algo que no está no hace nada');
ok(duplicarPlantilla(TRES, 'no-existe').plantillas.length === 3, '…y no toca la lista');

console.log('\n── 6. Eliminar: con confirmación, y sin mentir (apartado 8) ──');
const sinConfirmar = planEliminarPlantilla(TRES, PUSH.id);
ok(sinConfirmar.ok === false && sinConfirmar.plantillas.length === 3,
  '🚨 Sin confirmar NO borra nada: es el `aplicarPlan` de siempre');
ok(sinConfirmar.aviso.titulo === '¿Eliminar esta plantilla?',
  '…y devuelve el aviso, con las palabras del apartado 8');
ok(/Push Hipertrofia/.test(sinConfirmar.aviso.que), '…nombrando cuál');
ok(/2 ejercicios/.test(sinConfirmar.aviso.que), '…y lo que se lleva');
ok(/Eliminados recientes/.test(sinConfirmar.aviso.vuelve),
  '🚨 …y que se recupera: la plantilla va a la papelera, así que prometer lo contrario sería mentir (E3 F26)');
ok(!/no se puede deshacer|para siempre|definitivamente/i.test(JSON.stringify(sinConfirmar.aviso)),
  '⚠️ Y por eso el aviso NO dice que sea definitivo');
const confirmado = planEliminarPlantilla(TRES, PUSH.id, { confirmado: true });
ok(confirmado.ok && confirmado.plantillas.length === 2, 'Confirmando, se va');
ok(!confirmado.plantillas.some((p) => p.id === PUSH.id), '…y es la que se eligió');
ok(TRES.length === 3, '⚠️ Y la lista original no se muta');
ok(planEliminarPlantilla(TRES, 'no-existe').ok === false,
  'Eliminar algo que ya no está no revienta (apartado 24)');
ok(avisoDeEliminar(CORE).que.includes('1 ejercicio') && !avisoDeEliminar(CORE).que.includes('1 ejercicios'),
  '⚠️ Y el singular está bien escrito: lo lee Josué');

console.log('\n── 7. La plantilla va a la papelera (apartado 8 + EH F45) ──');
ok(!!CATALOGO_PAPELERA['fitness.plantillas'],
  '🚨 `fitness.plantillas` está en `CATALOGO_PAPELERA`: sin esa línea se borraría PARA SIEMPRE');
ok(CATALOGO_PAPELERA['fitness.plantillas']?.modulo === 'fitness'
  && CATALOGO_PAPELERA['fitness.plantillas']?.coleccion === 'plantillas',
  '…indexada por módulo y colección, que es como se indexa la papelera');
ok(!/eliminarConPapelera/.test(LIB_CODIGO),
  '⚠️ Y quien borra sigue siendo `App.jsx`: esta librería devuelve un plan, no escribe');

console.log('\n── 8. El estado vacío y lo que NO existe (apartados 13 y 19) ──');
ok(ESTADO_VACIO_PLANTILLAS.titulo === 'Aún no tienes plantillas',
  'El vacío del apartado 13, con sus palabras');
ok(ESTADO_VACIO_PLANTILLAS.accion === 'Crear entrenamiento',
  '🚨 …y con salida: un vacío sin botón es una pantalla rota (EH F41)');
ok(SIN_OBJETIVO.que && SIN_OBJETIVO.porque && SIN_OBJETIVO.loPide,
  '⚠️ El «objetivo» que el enunciado nombra y no se puede rellenar, declarado con su motivo');
ok(!/objetivo:/.test(LIB_CODIGO), '…y sin un campo vacío en el dato (regla 8)');
ok(NO_EN_FIT4.length >= 7, `Lo que el contexto excluye, declarado (${NO_EN_FIT4.length})`);
ok(NO_EN_FIT4.every((n) => n.que && n.porque), 'Cada cosa con su motivo');
ok(NO_EN_FIT4.some((n) => /Empezar entrenamiento/.test(n.que)),
  '🚨 «Empezar entrenamiento» NO se pinta: el apartado 19 prefiere no enseñarlo a enseñarlo muerto');

console.log('\n── 9. Lo que NO se ha duplicado (apartados 2, 22 y 23) ──');
ok(!/UserTemplate\s*=|crearUserTemplate|DEFAULT_PLANTILLAS/.test(LIB_CODIGO),
  '🚨 Ni un modelo `UserTemplate` nuevo: ya existe y es `fitness.plantillas` (apartado 2)');
ok(/from '\.\/constructor'/.test(LIB), 'El constructor se importa, no se reescribe (apartado 23)');
ok(!/crearLinea\s*\(|anadirEjercicio\s*\(/.test(LIB_CODIGO),
  '…y esta librería no construye rutinas: para eso está la F3');
ok(!/CATALOGO_EJERCICIOS\s*=/.test(LIB_CODIGO),
  '🚨 Ni una copia del catálogo: las plantillas referencian por id (apartado 22)');
ok(!/#[0-9a-fA-F]{6}/.test(LIB_CODIGO), 'Ni un color escrito a mano (regla 2)');

console.log('\n── 10. El ida y vuelta con el constructor (apartados 5, 6 y 23) ──');
let nueva = crearRutina({ nombre: 'Torso', entornos: ['gym'] });
nueva = anadirEjercicio(nueva, PRESS);
const guardada = guardarRutina([], nueva);
ok(guardada.ok && guardada.planes.length === 1, 'Guardar desde el constructor crea la plantilla');
const reabierta = planARutina(guardada.planes[0]);
ok(reabierta.nombre === 'Torso' && reabierta.lineas.length === 1,
  '…y se vuelve a abrir con sus datos (apartado 6)');
const editada = guardarRutina(guardada.planes, editarLinea(reabierta, reabierta.lineas[0].id, { series: 5 }));
ok(editada.planes.length === 1,
  '🚨 Guardar una que ya existía la SUSTITUYE: *"no crear una nueva plantilla accidentalmente"* (apartado 6)');
ok(editada.planes[0].id === guardada.planes[0].id, '…con el mismo id');
ok(editada.planes[0].ejercicios[0].series === 5, '…y el cambio dentro');
ok(plantillasDe({ plantillas: editada.planes }).length === 1, 'Y se leen del sitio de siempre');
ok(plantillaPorId(editada.planes, guardada.planes[0].id)?.nombre === 'Torso',
  '…y se encuentran por id');

console.log('\n── 11. Casos límite (apartado 24) ──');
const vacia = { ...rutinaAPlan(crearRutina({ nombre: 'Vacía' })), creadoEn: HOY, editadoEn: HOY };
const fichaVacia = fichaDePlantilla(vacia, [], HOY);
ok(fichaVacia.vacia === true && fichaVacia.ejercicios === 0,
  'Una plantilla sin ejercicios se marca como vacía, no deja la tarjeta en blanco');
ok(fichaVacia.duracion === '',
  '⚠️ …y no dice «≈ 0 min»: un cero inventado (regla 8)');
ok(lineasDePlantilla(vacia).length === 0, '…y no tiene filas');
ok(fichaDePlantilla(crearWorkoutPlan({ nombre: 'Sin id' })) !== null,
  'Un plan recién fabricado se puede leer');
ok(plantillasDe(undefined).length === 0 && plantillasDe({}).length === 0,
  '⚠️ Y sin la clave `plantillas` no revienta: es como lo tiene quien ya usaba la aplicación (regla 5)');
ok(buscarPlantillas(undefined, 'x').length === 0 && ordenarPlantillas(undefined).length === 0,
  'Ni con la lista sin llegar');

console.log('\n── 12. Las comprobaciones pueden ponerse rojas (EH F42) ──');
ok(duplicarPlantilla([PUSH], PUSH.id).copia.ejercicios[0].id !== PUSH.ejercicios[0].id,
  '⚠️ Si las líneas compartieran id, esta comprobación se pondría roja');
ok(planEliminarPlantilla([PUSH], PUSH.id, { confirmado: true }).plantillas.length === 0
  && planEliminarPlantilla([PUSH], PUSH.id).plantillas.length === 1,
  '…y la de confirmar distingue los dos casos, no dice siempre lo mismo');

console.log(`\n${fallos === 0 ? '\x1b[32m✓' : '\x1b[31m✗'} ${total - fallos}/${total} comprobaciones\x1b[0m`);
process.exit(fallos === 0 ? 0 : 1);
