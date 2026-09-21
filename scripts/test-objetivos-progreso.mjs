/* Entrega 4 · FIT F14/45 — Objetivos y metas de progreso.
   ═══════════════════════════════════════════════════════════════════════════
   El criterio del apartado 31, literal: crear «Dominadas · 15 repeticiones» y
   registrar entrenamientos reales hasta ver 15 / 15 · ✓ Objetivo conseguido,
   sin inventar datos ni tocar el historial. Y la frase que más importa del
   enunciado: **0 % ≠ sin datos** (apartado 23). */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TIPOS_OBJETIVO, ESTADOS_OBJETIVO, crearObjetivo, normalizarObjetivo, metricasDeEjercicio, validarObjetivo,
  valorActual, conseguido, estadoDeObjetivo, progresoDeObjetivo, FILTROS_OBJETIVOS, listaDeObjetivos,
  objetivosActivos, objetivosCompletados, anadirObjetivo, editarObjetivo, cancelarObjetivo,
  AVISO_CANCELAR_OBJETIVO, AVISO_ELIMINAR_OBJETIVO, OBJETIVOS_VACIO, objetivosQueConsigueLaSesion, NO_EN_FIT14,
} from '../src/lib/objetivosProgreso.js';
import { DEFAULT_FITNESS, normalizarFitness } from '../src/lib/fitness.js';
import { ejercicioPorId } from '../src/lib/ejercicios.js';
import { normalizarFitnessConSesiones } from '../src/lib/entrenamiento.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';
import { CATALOGO_PAPELERA, prepararEliminacion } from '../src/lib/papelera.js';
import { addDays } from '../src/lib/helpers.js';

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
const hace = (n) => addDays(HOY, -n);
function sesion(exerciseId, valores, fecha, cambios = {}) {
  let r = crearRutina({ nombre: exerciseId });
  r = anadirEjercicio(r, exerciseId);
  r = editarLinea(r, r.lineas[0].id, { series: valores.length, ...cambios });
  const inicio = new Date(`${fecha}T18:00:00`).getTime();
  let s = empezarSesion({ nombre: exerciseId, lineas: r.lineas, hoy: fecha, ahora: inicio });
  const e = ejerciciosDeSesion(s)[0];
  valores.forEach((v, i) => {
    if (!v) return;
    s = editarSerie(s, e.id, e.series[i].id, v);
    s = marcarSerie(s, e.id, e.series[i].id, true);
  });
  return guardarEntrenamiento(pasarAFinalizacion(s, { ahora: inicio + 3600000 }), { confirmado: true, ahora: inicio + 3601000 }).sesion;
}
const r = (reps, peso = null) => ({ reps, peso });
const corp = { tipoCarga: 'corporal' };

console.log('\n═══ FIT F14/45 · Objetivos y metas de progreso ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. El criterio del apartado 31, de principio a fin ──');

let F = { ...DEFAULT_FITNESS };
const creado = anadirObjetivo(F, { exerciseId: 'dominada-prona', tipo: 'reps', valor: '15' }, { ahora: Date.UTC(2026, 8, 1) });
ok(creado.ok && creado.fitness.objetivos.length === 1, '+ Crear objetivo → Dominadas → 15 repeticiones (apartado 31)');
F = creado.fitness;
const ID = creado.objetivo.id;
const ver = () => progresoDeObjetivo(F, F.objetivos[0], { hoy: HOY });

ok(ver().sinDatos === true && ver().porcentaje === null && ver().progresoTexto === 'Sin datos todavía',
  '🚨 Sin ningún entrenamiento: «Sin datos todavía», y el porcentaje es NULL, no 0 % (apartado 23: 0 % ≠ sin datos)');
ok(ver().estado === 'activo' && ver().estadoNombre === 'En progreso', '…y está en progreso');

F = guardarSesion(F, sesion('dominada-prona', [r(8), r(7), r(6)], hace(20), corp));
ok(ver().actual === 8 && ver().progresoTexto === '8 / 15 reps' && ver().porcentaje === 53,
  `Primer entrenamiento 8/7/6: «${ver().progresoTexto}» · ${ver().porcentaje} % — la MEJOR serie, no la suma de 21 (apartado 9)`);
F = guardarSesion(F, sesion('dominada-prona', [r(11), r(10), r(9)], hace(10), corp));
ok(ver().progresoTexto === '11 / 15 reps' && ver().porcentaje === 73, `Segundo: «11 / 15 reps» · 73 %, el ejemplo exacto del apartado 9 (${ver().porcentaje} %)`);
ok(ver().tendencia === 'mejora' && ver().tendenciaNombre === 'Mejorando', '…con la tendencia de la F11: Mejorando');
const antesDeConseguir = JSON.stringify(F.sesiones);
const sesionFinal = sesion('dominada-prona', [r(15), r(12), r(10)], hace(1), corp);
F = guardarSesion(F, sesionFinal);
ok(ver().progresoTexto === '15 / 15 reps' && ver().porcentaje === 100, '🚨 Tercero con una serie de 15: «15 / 15 reps» · 100 %');
ok(ver().estado === 'completado' && ver().estadoNombre === 'Objetivo conseguido' && ver().simbolo === '✓',
  '🚨 «✓ Objetivo conseguido» (apartados 12 y 31)');
ok(F.objetivos[0].estado === 'activo', '⚠️ …DEDUCIDO de las sesiones: lo guardado sigue igual, sin un «conseguido» que se quede viejo');
ok(JSON.stringify(F.sesiones.slice(0, 2)) === antesDeConseguir, '🚨 …y el historial no se ha tocado (apartado 31)');
ok(objetivosQueConsigueLaSesion(F, sesionFinal.id).includes(ID),
  '🚨 La lógica sabe QUÉ sesión lo consiguió, para el entrenamiento en vivo de una fase futura (apartado 28)');
ok(objetivosQueConsigueLaSesion(F, F.sesiones[1].id).length === 0, '…y que la anterior no lo consiguió');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. El modelo y la persistencia (apartados 2 y 24) ──');

const o = crearObjetivo({ exerciseId: 'l-sit', tipo: 'duracion', valor: '60', fechaObjetivo: '2026-12-15', nota: '  Con calma ' });
ok(['id', 'exerciseId', 'tipo', 'valor', 'unidad', 'creadoEn', 'actualizadoEn', 'fechaObjetivo', 'estado', 'nota'].every((k) => k in o),
  'El `ProgressGoal` tiene todos los campos del apartado 2');
ok(o.unidad === 's' && o.valor === 60 && o.nota === 'Con calma' && o.estado === 'activo', '…con la unidad según el tipo, el número limpio y la nota recortada');
/* 🔓 **ESTA COMPROBACIÓN SE DA LA VUELTA CON LA FIT F30, NO SE BORRA** (SU F1 →
   SU F2 y E3 F44 otra vez). La F14 afirmaba «tres tipos» y su apartado 2 tenía
   razón entonces; el apartado 3 de la F30 añade el cuarto —**habilidad**—, así
   que lo que se vigila ahora es que **los tres numéricos sigan intactos** y que
   el nuevo NO sea numérico. Los ESTADOS siguen siendo tres: el apartado 29 de la
   F30 es literal, *"No añadir failed todavía"*. */
ok(ESTADOS_OBJETIVO.join() === 'activo,completado,cancelado',
  'Tres estados, ni uno más: «failed» sigue sin existir (F14 apartado 2, F30 apartado 29)');
ok(TIPOS_OBJETIVO.filter((t) => t.numerico).map((t) => t.id).join() === 'peso,reps,duracion',
  '…y los tres tipos NUMÉRICOS de la F14 siguen siendo los mismos');
ok(TIPOS_OBJETIVO.filter((t) => !t.numerico).map((t) => t.id).join() === 'skill',
  '🔓 …más la habilidad de la FIT F30, declarada como NO numérica (su apartado 14)');
ok(normalizarObjetivo({ id: 'x' }) === null && normalizarObjetivo(null) === null, 'Un objetivo sin ejercicio no se carga');
ok(crearObjetivo({ exerciseId: 'a', fechaObjetivo: 'mañana' }).fechaObjetivo === '', 'Una fecha rota se queda vacía');
ok(Array.isArray(DEFAULT_FITNESS.objetivos) && DEFAULT_FITNESS.objetivos.length === 0, '🚨 Nace sin NINGÚN objetivo de ejemplo (apartado 22)');
const recargado = normalizarFitnessConSesiones(JSON.parse(JSON.stringify(F)));
ok(recargado.objetivos.length === 1 && recargado.objetivos[0].id === ID && recargado.objetivos[0].valor === 15,
  '🚨 Tras guardar y recargar, el objetivo vuelve entero por la puerta de carga (apartado 24)');
ok(progresoDeObjetivo(recargado, recargado.objetivos[0], { hoy: HOY }).estado === 'completado', '…y sigue conseguido');
ok(normalizarFitness({ objetivos: [{ id: 'a', exerciseId: 'l-sit', valor: 30, tipo: 'duracion' }, { basura: 1 }] }).objetivos.length === 1,
  '…y lo roto se descarta sin romper lo demás');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Unidades y validación (apartados 3 y 5) ──');

ok(metricasDeEjercicio(ejercicioPorId('l-sit')).join() === 'duracion', '🚨 Un isométrico solo admite SEGUNDOS (apartado 3)');
ok(metricasDeEjercicio(ejercicioPorId('press-banca-barra')).join() === 'peso,reps', 'El press de banca: peso primero, y repeticiones');
ok(metricasDeEjercicio(ejercicioPorId('dominada-prona'))[0] === 'reps', 'Las dominadas, repeticiones primero');
const v = (datos) => validarObjetivo(datos);
ok(!v({ exerciseId: 'l-sit', tipo: 'reps', valor: 10 }).ok && /no se mide en repeticiones/.test(v({ exerciseId: 'l-sit', tipo: 'reps', valor: 10 }).motivo),
  '🚨 «L-sit en repeticiones» no se puede crear: unidad incompatible (apartado 5)');
ok(!v({ exerciseId: 'ya-no-existe', tipo: 'reps', valor: 10 }).ok, '…ni un ejercicio que no existe');
ok(!v({ exerciseId: 'dominada-prona', tipo: 'reps', valor: '' }).ok, '…ni un valor vacío');
ok(!v({ exerciseId: 'dominada-prona', tipo: 'reps', valor: 0 }).ok && !v({ exerciseId: 'dominada-prona', tipo: 'reps', valor: -3 }).ok, '…ni cero ni negativos');
ok(!v({ exerciseId: 'dominada-prona', tipo: 'reps', valor: 10.5 }).ok, '…ni repeticiones con decimales');
ok(v({ exerciseId: 'press-banca-barra', tipo: 'peso', valor: '82,5' }).ok && v({ exerciseId: 'press-banca-barra', tipo: 'peso', valor: '82,5' }).valor === 82.5,
  '🚨 Pesos con decimales razonables, y la coma española: «82,5» → 82,5 kg');
ok(!v({ exerciseId: 'press-banca-barra', tipo: 'peso', valor: 82.555 }).ok, '…pero no con tres decimales');
ok(!v({ exerciseId: 'dominada-prona', tipo: 'reps', valor: 'muchas' }).ok, '…ni un texto');
ok(!v({ exerciseId: 'press-banca-barra', tipo: 'peso', valor: 5000 }).ok, '…ni una cifra absurda');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. Peso, isométricos y variantes (apartados 7, 8, 10 y 19) ──');

const P = [
  sesion('press-banca-barra', [r(8, 80), r(5, 90), r(12, 60)], hace(8)),
  sesion('l-sit', [{ duracion: 12 }, { duracion: 18 }], hace(6)),
  sesion('dominada-supina', [r(20)], hace(3), corp),
].reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS });
const objPeso = crearObjetivo({ exerciseId: 'press-banca-barra', tipo: 'peso', valor: 100 });
ok(valorActual(P, objPeso).valor === 90, '🚨 Objetivo de peso: el mayor peso de una serie hecha, 90 kg (apartado 7)');
ok(progresoDeObjetivo(P, objPeso, { hoy: HOY }).progresoTexto === '90 / 100 kg', '…«90 / 100 kg»');
const objIso = crearObjetivo({ exerciseId: 'l-sit', tipo: 'duracion', valor: 30 });
ok(progresoDeObjetivo(P, objIso, { hoy: HOY }).progresoTexto === '18 / 30 s' && progresoDeObjetivo(P, objIso, { hoy: HOY }).porcentaje === 60,
  '🚨 Isométrico: «18 / 30 s» · 60 %, el ejemplo del apartado 8');
const objProna = crearObjetivo({ exerciseId: 'dominada-prona', tipo: 'reps', valor: 15 });
ok(progresoDeObjetivo(P, objProna, { hoy: HOY }).sinDatos === true,
  '🚨 Las 20 dominadas SUPINAS no cuentan para un objetivo de dominadas PRONAS: variantes separadas (apartado 19)');
const objPressReps = crearObjetivo({ exerciseId: 'press-banca-barra', tipo: 'reps', valor: 10 });
ok(valorActual(P, objPressReps).valor === 12, 'Un objetivo de repeticiones cuenta la mejor serie en repeticiones (12), sea cual sea el peso');

const leer5 = leer('src/lib/objetivosProgreso.js');
ok(/mejorHistorico\(/.test(leer5) && /aparicionesDeEjercicio\(/.test(leer5),
  '🚨 El mejor resultado sale de la F11 (`mejorHistorico`, `aparicionesDeEjercicio`): una sola fuente de verdad (apartado 10)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Fechas, edición, cancelación y eliminación (apartados 13, 14, 17 y 18) ──');

let G = anadirObjetivo({ ...DEFAULT_FITNESS }, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 10, fechaObjetivo: '2026-09-01' }, { ahora: 1 }).fitness;
const g0 = G.objetivos[0];
const pg = progresoDeObjetivo(G, g0, { hoy: HOY });
ok(pg.fechaSuperada === true && pg.estado === 'activo', '🚨 Fecha pasada: «Fecha superada», pero sigue ACTIVO — nunca «fallido» (apartado 18)');
ok(pg.fechaObjetivo === '1 septiembre 2026', `…y se enseña la fecha que él puso: «${pg.fechaObjetivo}» (apartado 17)`);
const texto5 = JSON.stringify(pg) + leer('src/views/ProgresoView.jsx');
ok(!/conseguirás|lo lograrás|en \d+ días|predic/i.test(sinComentarios(texto5)), '🚨 …sin ninguna predicción (apartados 1 y 17)');

const e1 = editarObjetivo(G, g0.id, { valor: 15 }, { ahora: 999 });
ok(e1.ok && e1.fitness.objetivos[0].id === g0.id && e1.fitness.objetivos[0].valor === 15 && e1.fitness.objetivos[0].actualizadoEn === 999,
  '🚨 Editar 10 → 15 conserva el MISMO id y apunta la fecha de edición (apartado 13)');
ok(e1.fitness.objetivos[0].creadoEn === g0.creadoEn, '…sin cambiar cuándo se creó');
ok(!editarObjetivo(G, g0.id, { valor: -1 }).ok, '…y valida igual que al crear');
ok(editarObjetivo(G, g0.id, { exerciseId: 'l-sit', valor: 15 }).fitness.objetivos[0].exerciseId === 'dominada-prona',
  '⚠️ …y no deja cambiar el ejercicio por la puerta de atrás');
ok(!editarObjetivo(G, 'no-existe', { valor: 3 }).ok, 'Editar uno que no existe no revienta');

const C = cancelarObjetivo(G, g0.id);
ok(C.objetivos[0].estado === 'cancelado' && estadoDeObjetivo(C.objetivos[0], null) === 'cancelado', 'Cancelar lo deja cancelado (apartado 14)');
ok(!editarObjetivo(C, g0.id, { valor: 20 }).ok, '…y un cancelado no se edita');
ok(listaDeObjetivos(C, { hoy: HOY }).objetivos.length === 0 && listaDeObjetivos(C, { filtro: 'cancelado', hoy: HOY }).objetivos.length === 1,
  '⚠️ Los cancelados se ocultan por defecto y salen con su filtro (apartado 15)');
ok(AVISO_CANCELAR_OBJETIVO.titulo && /no se tocan/.test(AVISO_CANCELAR_OBJETIVO.texto) && /Papelera/.test(AVISO_ELIMINAR_OBJETIVO.texto),
  'Cancelar y eliminar preguntan, y dicen que los entrenamientos no se tocan (apartado 14)');
ok(!!CATALOGO_PAPELERA['fitness.objetivos'], '🚨 Eliminar va a la papelera: `fitness.objetivos` está en ella');
const conSesion = guardarSesion(G, sesion('dominada-prona', [r(9)], hace(2), corp));
const elim = prepararEliminacion(conSesion, 'fitness', 'objetivos', g0.id, '2026-09-17T10:00:00.000Z');
ok(elim && elim.moduloActualizado.objetivos.length === 0 && elim.moduloActualizado.sesiones.length === 1,
  '🚨 …y quita el objetivo SIN borrar ningún entrenamiento (apartado 14)');
ok(prepararEliminacion(elim.moduloActualizado, 'fitness', 'objetivos', g0.id, 'x') === null, '…y eliminar dos veces no hace nada');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Lista, filtros, vacío y datos rotos (apartados 15, 21, 22 y 23) ──');

let L = { ...DEFAULT_FITNESS };
ok(listaDeObjetivos(L, { hoy: HOY }).total === 0 && OBJETIVOS_VACIO.titulo === 'Sin objetivos todavía' && OBJETIVOS_VACIO.cta === '+ Crear objetivo',
  'Sin objetivos, el estado vacío del apartado 22');
L = guardarSesion(L, sesion('press-banca-barra', [r(5, 95)], hace(4)));
for (const d of [
  { exerciseId: 'press-banca-barra', tipo: 'peso', valor: 100 },
  { exerciseId: 'press-banca-barra', tipo: 'peso', valor: 90 },
  { exerciseId: 'l-sit', tipo: 'duracion', valor: 30 },
]) L = anadirObjetivo(L, d).fitness;
const lista = listaDeObjetivos(L, { hoy: HOY });
ok(lista.objetivos.map((x) => x.estado).join() === 'activo,activo,completado', 'Activos primero, conseguidos después (apartado 15)');
ok(lista.objetivos[0].porcentaje === 95 && lista.objetivos[1].sinDatos === true, '…los más avanzados arriba, y sin datos detrás de los que tienen');
ok(objetivosActivos(L, { hoy: HOY }).length === 2 && objetivosCompletados(L, { hoy: HOY }).length === 1, 'Las funciones de activos y completados (apartado 26)');
ok(FILTROS_OBJETIVOS.map((x) => x.id).join() === 'todos,activo,completado,cancelado', 'Filtros Todos, Activos, Completados (y Cancelados)');
ok(listaDeObjetivos(L, { grupo: 'piernas', hoy: HOY }).objetivos.length === 1 && listaDeObjetivos(L, { grupo: 'abdominales', hoy: HOY }).objetivos.length === 3,
  'Y por grupo muscular, con la implicación del catálogo: en Piernas solo el L-sit; en Abdominales también el press, que implica el core (apartado 21)');
ok(conseguido(null, { valor: 10 }) === false && conseguido({ valor: 10 }, { valor: 10 }) === true, 'Alcanzar exactamente el objetivo ya es conseguirlo (apartado 12)');

const fantasma = { ...DEFAULT_FITNESS, objetivos: [crearObjetivo({ exerciseId: 'ya-no-existe', tipo: 'reps', valor: 5 })] };
let noRompe = true;
try { listaDeObjetivos(fantasma, { hoy: HOY }); } catch { noRompe = false; }
ok(noRompe && listaDeObjetivos(fantasma, { hoy: HOY }).objetivos[0].nombre === 'Ejercicio desconocido', 'Un objetivo de un ejercicio borrado no rompe la lista');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. La pantalla y lo que no se construye ──');

const VISTA = sinComentarios(leer('src/views/ProgresoView.jsx'));
ok(/<EjerciciosView/.test(VISTA) && /onElegir=/.test(VISTA), '🚨 El ejercicio se elige con el catálogo de siempre, no con un selector nuevo (apartado 4)');
ok(/o\.porcentaje !== null && \(/.test(VISTA), '🚨 Sin datos, la tarjeta NO dibuja una barra vacía (apartado 23)');
ok(/Ver progreso del ejercicio/.test(VISTA) && /setAbierto\(guardado\.exerciseId\)/.test(VISTA), 'El detalle lleva a la pantalla de la F12 (apartado 16)');
ok(!/confeti|\bXP\b|medalla|monedas|puntos de|recompensa/i.test(VISTA), 'Sin logros, medallas, XP ni recompensas (apartado 29)');
ok(/role="alert"/.test(VISTA), 'Un error de validación se anuncia');
ok(/<ProgresoView[\s\S]{0,1200}onEliminarObjetivo/.test(leer('src/views/FitnessView.jsx')) && /eliminarConPapelera\('fitness', 'objetivos'/.test(leer('src/App.jsx')),
  'La pantalla está enganchada: guardar y eliminar llegan a `App.jsx`');
ok(NO_EN_FIT14.length >= 4, 'Lo que no se construye, dicho');

console.log(`\n  ${total - fallos}/${total} comprobaciones correctas.`);
if (fallos) {
  console.log(`  \x1b[31m${fallos} fallo(s).\x1b[0m\n`);
  process.exit(1);
}
