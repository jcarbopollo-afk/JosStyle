/* Entrega 4 · FIT F16/45 — La pantalla de Rangos.
   ═══════════════════════════════════════════════════════════════════════════
   Las veintiuna comprobaciones del apartado 27, y sobre todo la 15: **no hay
   datos falsos**. Sin sesiones no hay rango, un grupo sin entrenar no recibe
   uno de consolación, y el recuento de «clasificados» solo cuenta ejercicios
   que de verdad tienen rango.

   ⚠️ Esta pantalla **no puede calcular**: lo que se vigila aquí, aparte de los
   números, es que `RangosView` siga siendo un dibujante —si algún día aparece
   ahí un umbral o una media, esta prueba se pone roja—. */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  pantallaDeRangos, escalaDeRangos, detalleDeRango, textoDeCobertura,
  clasificacionDeEjercicios, rankingsMusculares, explicacionSinRango,
  MOTIVOS_SIN_RANGO, NO_EN_FIT16, DECISIONES_FIT16,
} from '../src/lib/pantallaRangos.js';
import { RANK_THRESHOLDS, rangoGlobal, rangosDeEjercicios, rangoDeGrupo, progresoHaciaSiguiente } from '../src/lib/rangos.js';
import { DEFAULT_FITNESS, SIN_RANGO, GRUPOS_MUSCULARES, CTA_CLASIFICAR, crearEjercicio } from '../src/lib/fitness.js';
import { todosLosEjercicios } from '../src/lib/ejercicios.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { addDays } from '../src/lib/helpers.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
/* ⚠️ Los comentarios fuera antes de buscar: esta prueba se puso roja porque el
   propio comentario que explica que `InsigniaRango` se ha retirado contiene la
   palabra. Lo que se vigila es el CÓDIGO, no lo que cuenta de sí mismo. */
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
let dia = 0;
function sesion(exerciseId, valores, cambios = {}) {
  dia += 1;
  const fecha = addDays(HOY, -60 + dia);
  let r = crearRutina({ nombre: exerciseId });
  r = anadirEjercicio(r, exerciseId);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length, ...cambios });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    if (!v) return;
    s = editarSerie(s, e.id, e.series[i].id, v);
    if (!v.sinMarcar) s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
}
const con = (...ss) => ss.reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS });
const r = (reps, peso = null) => ({ reps, peso });

console.log('\n\x1b[1m1 · SIN DATOS: «SIN RANGO», NUNCA EL RANGO 1 (apartados 4 y 12)\x1b[0m');

const vacio = pantallaDeRangos({ ...DEFAULT_FITNESS });
ok(vacio.global.sinRango === true, 'Sin sesiones no hay rango global');
ok(vacio.nivel === null && vacio.descripcion === null, '…y no hay nivel ni descripción de un rango que no existe');
ok(vacio.sinRango && vacio.sinRango.que === SIN_RANGO.que,
  '🚨 Se explica con la MISMA frase que la pantalla de Fitness, no con una versión nueva');
ok(!/Iniciación|Principiante/.test(JSON.stringify(vacio.global)),
  '🚨 Y no aparece «Iniciación» por defecto: el rango 1 se gana');
ok(vacio.siguiente === null, 'Sin rango no hay «próximo rango»: una barra a 0 diría que va mal');
ok(vacio.cobertura.texto === '0 de 7 grupos con datos' && vacio.cobertura.fraccion === 0,
  'La cobertura de partida es 0 de 7, dicha con palabras');
ok(vacio.escala.length === 10 && vacio.escala.every((n) => n.estado === 'no_disponible'),
  'Los diez rangos aparecen, y sin rango todos están «sin clasificar»');
ok(vacio.musculos.length === 7 && vacio.musculos.every((m) => m.sinRango && m.rango === null && m.datos === 'Sin datos'),
  '🚨 Los siete grupos aparecen sin datos, y ninguno recibe un rango artificial (apartado 12)');
ok(vacio.musculos.every((m) => m.siguiente === null),
  '…ni una barra de progreso: sin datos no hay camino que enseñar');
ok(vacio.clasificacion.clasificados === 0 && vacio.clasificacion.total === todosLosEjercicios().length,
  'Clasificados: 0 del catálogo entero');

/* ⚠️ Los dos «sin rango» NO se dicen igual: con un ejercicio repetido cien
   veces sigue sin haber rango global, y hay que explicar por qué. */
const soloUno = pantallaDeRangos(con(
  sesion('press-banca-barra', [r(8, 60), r(8, 60), r(7, 60)]),
  sesion('press-banca-barra', [r(8, 65), r(8, 65), r(8, 65)]),
));
ok(soloUno.global.sinRango === true && soloUno.global.motivo === 'poca_cobertura',
  '🐛 Con un solo ejercicio NO hay rango global (lo que destapó la prueba de la F15)');
ok(soloUno.sinRango.que === MOTIVOS_SIN_RANGO.poca_cobertura.que
  && soloUno.sinRango.que !== MOTIVOS_SIN_RANGO.sin_datos.que,
  '🚨 …y se dice distinto que «no has entrenado»: le falta variedad, no esfuerzo');
ok(/más ejercicios clasificados/i.test(soloUno.sinRango.que), 'La explicación dice qué hacer (apartado 4)');
ok(soloUno.clasificacion.clasificados === 1, 'Aunque sin rango global, ese ejercicio SÍ está clasificado');
ok(soloUno.musculos.find((m) => m.id === 'pecho').sinRango === false,
  '…y su grupo tiene rango aunque el global todavía no');
ok(explicacionSinRango({ sinRango: false }) === null, 'Con rango no hay explicación de ausencia');
ok(explicacionSinRango({ sinRango: true, motivo: 'lo-que-sea' }).que === MOTIVOS_SIN_RANGO.sin_datos.que,
  'Un motivo desconocido cae en el mensaje neutro, no rompe la pantalla (apartado 21)');

console.log('\n\x1b[1m2 · CON DATOS: EL RANGO GLOBAL Y SU COBERTURA (apartados 3, 5 y 6)\x1b[0m');

/* Tres ejercicios de zonas distintas: el mínimo del apartado 20 de la F15. */
const fit = con(
  sesion('press-banca-barra', [r(8, 60), r(8, 60), r(8, 60)]),
  sesion('press-banca-barra', [r(8, 70), r(8, 70), r(7, 70)]),
  sesion('sentadilla-barra', [r(6, 90), r(6, 90), r(5, 90)]),
  sesion('sentadilla-barra', [r(6, 100), r(5, 100), r(5, 100)]),
  sesion('dominada-prona', [r(8), r(7), r(6)]),
  sesion('dominada-prona', [r(9), r(8), r(7)]),
);
const p = pantallaDeRangos(fit);
const esperado = rangoGlobal(fit, { propios: [] });

ok(p.global.sinRango === false && p.global.rango >= 1 && p.global.rango <= 10, 'Con tres ejercicios ya hay rango global');
ok(p.global.rango === esperado.rango && p.global.score === esperado.score,
  '🚨 Y es EXACTAMENTE el de `rangoGlobal` (F15): la pantalla no recalcula nada');
ok(p.nivel && p.descripcion === p.nivel.que,
  'La descripción corta es la del propio rango, no una frase nueva por pantalla');
ok(p.cobertura.grupos === esperado.cobertura.grupos && p.cobertura.total === 7,
  'La cobertura es la que cuenta la F15');
ok(p.cobertura.texto === `${esperado.cobertura.grupos} de 7 grupos con datos`,
  'Y se dice «con datos», no «completado»: mide información, no forma física');
ok(Math.abs(p.cobertura.fraccion - esperado.cobertura.grupos / 7) < 1e-9, 'La barra de cobertura es esa fracción');
ok(p.siguiente && p.siguiente.siguiente === p.global.rango + 1,
  'El «próximo rango» es el de después del actual (apartado 6)');
ok(p.siguiente.fraccion >= 0 && p.siguiente.fraccion <= 1, '…con una fracción dentro de la barra');
ok(progresoHaciaSiguiente(1000).siguiente === null,
  '🚨 En el rango más alto no se inventa un undécimo rango');
ok(textoDeCobertura({}).texto === '0 de 7 grupos con datos', 'Sin cobertura, el texto no se rompe (apartado 21)');

console.log('\n\x1b[1m3 · LOS DIEZ RANGOS Y SU HOJA (apartados 7 y 8)\x1b[0m');

const escala = escalaDeRangos(5);
ok(escala.length === 10, 'Aparecen los diez');
ok(escala.filter((n) => n.estado === 'actual').length === 1 && escala.find((n) => n.estado === 'actual').orden === 5,
  '🚨 Exactamente uno está destacado como actual');
ok(escala.filter((n) => n.estado === 'conseguido').length === 4, 'Los cuatro de debajo, conseguidos');
ok(escala.filter((n) => n.estado === 'bloqueado').length === 5, 'Los cinco de encima, bloqueados');
ok(escala.every((n, i) => n.umbral === RANK_THRESHOLDS[i]),
  'Cada rango lleva el umbral de `RANK_THRESHOLDS`, sin copiar la escala');
ok(escalaDeRangos(null).every((n) => n.estado === 'no_disponible'), 'Sin rango, ninguno está «bloqueado por poco»');

const hoja = detalleDeRango(9, 5);
ok(hoja.nombre === 'Experto' && hoja.que && hoja.umbral === RANK_THRESHOLDS[8],
  'La hoja de un rango trae nombre, descripción y el umbral en el que empieza');
ok(/Continúa mejorando/i.test(hoja.mensaje), 'Un rango bloqueado dice cómo se alcanza, no cuánto le falta a él');
ok(detalleDeRango(3, 5).estado === 'conseguido' && /superado/i.test(detalleDeRango(3, 5).mensaje), 'Uno conseguido lo dice');
ok(detalleDeRango(5, 5).estado === 'actual', 'Y el suyo se reconoce');
ok(detalleDeRango(99, 5) === null && detalleDeRango(0, null) === null, 'Un rango que no existe no devuelve una hoja vacía');

console.log('\n\x1b[1m4 · CLASIFICAR EJERCICIOS (apartado 9)\x1b[0m');

ok(p.clasificacion.clasificados === 3, 'Tres ejercicios entrenados, tres clasificados');
ok(p.clasificacion.total === todosLosEjercicios().length, 'Sobre el catálogo real, no sobre un número inventado');
ok(p.clasificacion.texto === `3 de ${todosLosEjercicios().length} clasificados`, 'Y se dice tal cual («12 de 35 clasificados»)');
ok(p.clasificacion.restantes === todosLosEjercicios().length - 3, 'Los restantes son los que faltan de verdad');

/* 🚨 La comprobación que más vale: un ejercicio apuntado y NO hecho no cuenta. */
const sinMarcar = pantallaDeRangos(con(sesion('curl-barra', [{ reps: 10, peso: 20, sinMarcar: true }])));
ok(sinMarcar.clasificacion.clasificados === 0,
  '🚨 Un ejercicio con las series sin marcar NO está clasificado: sería el dato falso del apartado 25');

const propio = crearEjercicio({ nombre: 'Remo en anillas', grupos: [{ id: 'espalda', porcentaje: 100 }] });
ok(clasificacionDeEjercicios(rangoGlobal(fit, { propios: [propio] }), [propio]).total === todosLosEjercicios().length + 1,
  'Un ejercicio propio de Josué también cuenta en el total');

/* 🔓 FIT F17 — el cuestionario ya existe, así que lo que se comprueba cambia:
   antes, que la F16 no prometiera un botón; ahora, que ese botón lleve a algo
   real. Lo que NO cambia es la regla 8, y sigue vigilada abajo: el CTA nunca
   ofrece cero preguntas. */
ok(CTA_CLASIFICAR.existe === true, '🔓 El cuestionario de clasificación existe desde la FIT F17…');
ok(!/catálogo de ejercicios esté construido/i.test(CTA_CLASIFICAR.mientrasTanto),
  '🐛 …y ya no se dice que falta el catálogo, que existe desde la F2: era una frase falsa en pantalla');
ok(/entrenarlo|marcar/i.test(CTA_CLASIFICAR.mientrasTanto),
  '…lo que se dice es cómo se clasifica un ejercicio hoy: entrenándolo');

console.log('\n\x1b[1m5 · RANKINGS MUSCULARES (apartados 11 a 15)\x1b[0m');

const ORDEN = ['brazos', 'piernas', 'espalda', 'pecho', 'hombros', 'abdominales', 'cuello'];
ok(p.musculos.map((m) => m.id).join() === ORDEN.join(),
  '🚨 Orden anatómico fijo (apartado 14): Brazos, Piernas, Espalda, Pecho, Hombros, Abdominales, Cuello');
ok(GRUPOS_MUSCULARES.map((g) => g.id).join() === ORDEN.join(), '…que es el del catálogo, no una lista aparte');

/* Y no se reordena por puntuación aunque un grupo vaya muy por delante. */
const conEspaldaFuerte = pantallaDeRangos(con(
  sesion('dominada-prona', [r(15), r(14), r(13)]),
  sesion('dominada-prona', [r(16), r(15), r(14)]),
  sesion('press-banca-barra', [r(5, 40), r(5, 40), r(5, 40)]),
  sesion('sentadilla-barra', [r(5, 50), r(5, 50), r(5, 50)]),
));
ok(conEspaldaFuerte.musculos.map((m) => m.id).join() === ORDEN.join(),
  '🚨 Ni aun con un grupo muy por encima: una lista que se reordena sola esconde el grupo flojo');

const ejercicios = rangosDeEjercicios(fit, { propios: [] });
ok(p.musculos.every((m) => {
  const real = rangoDeGrupo(ejercicios, m.id);
  return m.sinRango === real.sinRango && m.rango === real.rango;
}), '🚨 Cada tarjeta muscular usa `getMuscleGroupRank` de la F15 (apartado 13), sin cálculo propio');

const cuello = p.musculos.find((m) => m.id === 'cuello');
ok(cuello.sinRango && cuello.rango === null && cuello.nombreRango === SIN_RANGO.nombre,
  '🚨 El cuello, sin entrenar, sigue «Sin rango»: no se le asigna Novato (apartado 12)');
ok(cuello.datos === 'Sin datos' && cuello.siguiente === null, '…y su tarjeta dice «Sin datos», sin barra');
ok(p.global.score === Math.round(esperado.grupos.filter((g) => !g.sinRango).reduce((n, g) => n + g.score, 0) / esperado.cobertura.grupos),
  '🚨 Y no penaliza el rango global: la media es de los grupos CON datos');

const pecho = p.musculos.find((m) => m.id === 'pecho');
ok(pecho.datos === `${pecho.ejercicios} ${pecho.ejercicios === 1 ? 'ejercicio' : 'ejercicios'}`,
  'El indicador de datos dice cuántos ejercicios hay detrás, en singular o plural');
ok(pecho.siguiente && pecho.siguiente.siguiente === pecho.rango + 1, 'Y su progreso va al rango siguiente');
ok(rankingsMusculares({}).length === 7 && rankingsMusculares({}).every((m) => m.sinRango),
  'Sin nada que repartir, los siete siguen apareciendo (apartado 21)');
ok(rankingsMusculares(null).length === 7, 'Con datos corruptos tampoco se rompe la sección');

console.log('\n\x1b[1m6 · LA PANTALLA NO CALCULA (apartados 13, 22 y 25)\x1b[0m');

const vista = leer('src/views/RangosView.jsx');
ok(/pantallaDeRangos/.test(vista) && /useMemo/.test(vista),
  'La pantalla pide `pantallaDeRangos` una sola vez por render (apartado 22)');
ok(!/RANK_THRESHOLDS|REFERENCIAS|puntuacionDe|rangoGlobal\(|rangoDeGrupo\(/.test(vista),
  '🚨 Y no contiene ni umbrales ni fórmulas: la lógica vive en la F15');
ok(!/\.score\b/.test(vista),
  '🚨 La puntuación de Josué no se enseña en ningún sitio (F15, apartado 5)');
ok(/<RankBadge/.test(vista) && !/clipPath/.test(vista),
  '🚨 El hexágono es `RankBadge`: la pantalla no dibuja el suyo (apartado 17)');
ok(/createPortal/.test(vista), 'La hoja del apartado 8 va con `createPortal` (regla 3 del proyecto)');
ok(/Conseguido/.test(vista) && /Bloqueado/.test(vista) && /Actual/.test(vista),
  '🚨 Los estados llevan palabra además de color (apartado 20)');
ok(/aria-label/.test(vista) && /role="img"/.test(vista), 'Las barras y las insignias se leen con lector de pantalla');
ok(!/Próximamente|próximamente/.test(vista),
  '🚨 Sin pantallas «próximamente»: sería el control decorativo de la regla 8');
ok(/onClasificar/.test(vista) && /pendientesCuestionario > 0/.test(vista),
  '🔓 FIT F17 — y el botón de clasificar solo se ofrece con preguntas que hacer, nunca «0 restantes»');

const fitnessView = sinComentarios(leer('src/views/FitnessView.jsx'));
ok(/<RangosView/.test(fitnessView) && !/InsigniaRango|TarjetaGrupoMuscular/.test(fitnessView),
  '⚠️ Fitness renderiza la pantalla entera, y los dos componentes que sustituye ya no están sueltos');
ok(!/fitness\?\.rangos|fitness\.rangos/.test(fitnessView),
  '🚨 Y no pinta `fitness.rangos`: los rangos se calculan, no se leen de una copia vieja');
/* 🔓 FIT F18 — tocar un grupo abre su detalle **dentro de Rangos** (el de
   rangos), no el de Progreso. Lo que se sigue vigilando es que no haya dos
   pantallas calculando lo mismo: el detalle nuevo consume la F15 y la F13, y la
   ficha de un ejercicio sigue siendo la de la F12. */
ok(/<DetalleMuscularView/.test(vista) && /onMusculo=\{setMusculo\}/.test(vista),
  '🔓 Tocar un grupo abre su detalle de rangos, dentro de Rangos (FIT F18)');
const progreso = sinComentarios(leer('src/views/ProgresoView.jsx'));
ok(/focoEjercicio/.test(progreso) && /setAbierto\(focoEjercicio\)/.test(progreso),
  '🚨 …y un ejercicio abre la pantalla de progreso de la F12: no se duplica');
ok(/onFocoEjercicioConsumido/.test(progreso),
  '…y el foco se consume, para que volver a Progreso no reabra el mismo ejercicio una semana después');
ok(/perfil=\{perfilFitness\}/.test(leer('src/App.jsx')),
  'El peso corporal llega desde Salud, donde vive, en vez de duplicarse en Fitness');

console.log('\n\x1b[1m7 · LO QUE NO TRAE ESTA FASE (apartado 26)\x1b[0m');

ok(NO_EN_FIT16.length >= 4 && NO_EN_FIT16.every((x) => x.que && x.porque),
  'Lo que no está, declarado con su motivo (y no omitido)');
ok(NO_EN_FIT16.some((x) => /cuestionario/i.test(x.que)), 'El cuestionario de clasificación es de la fase siguiente');
ok(NO_EN_FIT16.some((x) => /anatómica|anatomía/i.test(x.que)),
  '⚠️ La ilustración anatómica no existe en el proyecto y no se inventa una');
ok(DECISIONES_FIT16.length >= 3 && DECISIONES_FIT16.every((x) => x.que && x.porque),
  'Y las decisiones visibles quedan escritas');
ok(!/leaderboard|ranking público|\bXP\b|logros|recompensa/i.test(vista),
  'Nada de leaderboard, XP ni logros (apartado 26)');

/* Datos corruptos: la pantalla no se cae, que es el apartado 21. */
let rompe = false;
try {
  pantallaDeRangos(null);
  pantallaDeRangos({ sesiones: [null, 'roto', { id: 1 }] });
  pantallaDeRangos({ sesiones: [{ ejercicios: [{ series: [{ estado: 'hecha' }] }] }] });
} catch { rompe = true; }
ok(!rompe, '🚨 Con datos corruptos la pantalla sigue en pie (apartado 21)');

console.log(`\n${fallos === 0 ? '\x1b[32mTODO EN VERDE\x1b[0m' : `\x1b[31m${fallos} FALLO(S)\x1b[0m`} — ${total} comprobaciones\n`);
process.exit(fallos === 0 ? 0 : 1);
