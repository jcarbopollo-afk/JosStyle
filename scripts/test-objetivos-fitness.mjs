/* Entrega 4 · FIT F30/45 — Sistema avanzado de objetivos fitness.
   ═══════════════════════════════════════════════════════════════════════════
   Las 22 pruebas del apartado 42 y los casos límite del 43, más lo que esta
   fase promete y hay que poder poner rojo:

   1. Que NO se prediga nada (contexto y apartado 34, tres veces).
   2. Que una habilidad no tenga porcentaje ni gráfico (apartados 3 y 14).
   3. Que una sesión posterior PEOR no descomplete un objetivo (apartado 27).
   4. Que el duplicado avise y, sin confirmar, NO escriba (apartado 24).
   5. Que el objetivo NO toque el rango (apartado 37). */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  YA_LO_RESUELVE_LA_F14, tiposDeObjetivoPara, SIN_PORCENTAJE, progresionDeSkill,
  distanciaAlObjetivo, historialDelObjetivo, PUNTOS_MINIMOS_OBJETIVO, SIN_GRAFICO_SKILL,
  graficaDelObjetivo, AVISO_DUPLICADO, objetivoIgual, crearObjetivoConAviso,
  reactivarObjetivo, CELEBRACION, FECHA_SUPERADA, detalleDeObjetivo,
  CTA_VER_OBJETIVO, CTA_CREAR_OBJETIVO, objetivoParaEjercicio, objetivoEnVivo,
  EL_OBJETIVO_NO_TOCA_EL_RANGO, NO_EN_FIT30, DECISIONES_FIT30, COMPONENTES_FIT30,
  AUDITORIA_FIT30, casillasDelCiclo, auditarObjetivos,
} from '../src/lib/objetivosFitness.js';
import {
  validarObjetivo, valorActual, conseguido, listaDeObjetivos, cancelarObjetivo,
  editarObjetivo, metricasDeEjercicio,
} from '../src/lib/objetivosProgreso.js';
import { DEFAULT_FITNESS, TIPOS_OBJETIVO, crearObjetivo, ESTADOS_OBJETIVO } from '../src/lib/fitness.js';
import { ejercicioPorId } from '../src/lib/ejercicios.js';
import { rangoEfectivoDeEjercicio } from '../src/lib/motorRangos.js';
import {
  empezarSesion, ejerciciosDeSesion, editarSerie, marcarSerie, guardarSesion,
} from '../src/lib/entrenamiento.js';
import { pasarAFinalizacion, guardarEntrenamiento } from '../src/lib/finalizacion.js';
import { crearRutina, anadirEjercicio, editarLinea } from '../src/lib/constructor.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(RAIZ, p), 'utf8');
const sinComentarios = (src) => src
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/.*$/gm, '$1 ');

let fallos = 0;
let total = 0;
function ok(cond, msg) {
  total += 1;
  if (cond) { console.log(`  \x1b[32m✓\x1b[0m ${msg}`); return; }
  fallos += 1;
  console.log(`  \x1b[31m✗ ${msg}\x1b[0m`);
}

const HOY = '2026-09-17';

/* 🐛 LO QUE SE BARRE ES EL CÓDIGO, NO LA DECLARACIÓN (FIT F25, F28 y F29, y
   aquí por tres veces en la misma fase). Las tres tablas de abajo NOMBRAN
   `completedAt`, `motorRangos` y «predicciones» **justamente para declarar que
   no se construyen**; barrerlas pondría roja la fase con el código bien.
   Y `sin_prediccion` —el id de una casilla de la auditoría— es lo mismo dentro
   de una función: se excluye a mano y con su motivo, porque estrechar la
   expresión hasta que calle sola es como se le escapa una de verdad.
   Cada barrido lleva debajo su comprobación de que SIGUE cazando una de
   verdad: un arreglo que tapa lo que busca no se ve de ninguna otra forma. */
const LIB = sinComentarios(leer('src/lib/objetivosFitness.js'));
const SIN_DECLARACIONES = LIB
  .replace(/export const EL_OBJETIVO_NO_TOCA_EL_RANGO = \{[\s\S]*?\n\};/, ' ')
  .replace(/export const NO_EN_FIT30 = \[[\s\S]*?\n\];/, ' ')
  .replace(/export const DECISIONES_FIT30 = \[[\s\S]*?\n\];/, ' ')
  .replace(/sin_prediccion/g, ' ');

/* ⚠️ Lanza con el nombre del ejercicio si el id no está en el catálogo: sin
   eso, `anadirEjercicio` no añade nada y revienta doce llamadas más abajo
   (FIT F22). */
function sesion(exerciseId, valores, fecha, cambios = {}) {
  let r = crearRutina({ nombre: exerciseId });
  r = anadirEjercicio(r, exerciseId);
  if (!r.lineas.length) throw new Error(`«${exerciseId}» no está en el catálogo de ejercicios`);
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
const con = (...ss) => ss.reduce((f, s) => guardarSesion(f, s), { ...DEFAULT_FITNESS });
const r = (reps, peso = null) => ({ reps, peso });
const seg = (duracion) => ({ duracion });
const CREADO = Date.parse('2026-07-01T10:00:00');

/** Crea un objetivo y devuelve `{ fitness, objetivo }`, fallando con su motivo. */
function conObjetivo(f, datos) {
  const res = crearObjetivoConAviso(f, datos, { ahora: CREADO, confirmado: true });
  if (!res.ok) throw new Error(`No se pudo crear el objetivo: ${res.motivo}`);
  return { fitness: res.fitness, objetivo: res.objetivo };
}

console.log('\n═══ FIT F30/45 · Sistema avanzado de objetivos fitness ═══');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 1. Crear los cuatro tipos (pruebas 1-4, apartados 3 y 7) ──');

const REPS = con(
  sesion('dominada-prona', [r(10)], '2026-08-01', { tipoCarga: 'corporal' }),
  sesion('dominada-prona', [r(11)], '2026-08-20', { tipoCarga: 'corporal' }),
  sesion('dominada-prona', [r(12)], '2026-09-05', { tipoCarga: 'corporal' }),
);
const o1 = conObjetivo(REPS, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 15 });
ok(o1.objetivo.tipo === 'reps' && o1.objetivo.valor === 15 && o1.objetivo.unidad === 'reps',
  'Prueba 1 · Objetivo de repeticiones, con su unidad automática (apartado 8)');

const CARGA = con(
  sesion('press-banca-barra', [r(8, 60)], '2026-08-01'),
  sesion('press-banca-barra', [r(8, 65)], '2026-09-05'),
);
const o2 = conObjetivo(CARGA, { exerciseId: 'press-banca-barra', tipo: 'peso', valor: 80 });
ok(o2.objetivo.tipo === 'peso' && o2.objetivo.unidad === 'kg', 'Prueba 2 · Objetivo de carga, en kg');

const ISO = con(sesion('plancha-frontal', [seg(30)], '2026-09-05'));
const o3 = conObjetivo(ISO, { exerciseId: 'plancha-frontal', tipo: 'duracion', valor: 45 });
ok(o3.objetivo.tipo === 'duracion' && o3.objetivo.unidad === 's', 'Prueba 3 · Objetivo isométrico, en segundos');

const SKILL = con(sesion('sentadilla-aire', [r(20)], '2026-08-10', { tipoCarga: 'corporal' }));
const o4 = conObjetivo(SKILL, { exerciseId: 'sentadilla-pistol', tipo: 'skill' });
ok(o4.objetivo.tipo === 'skill', 'Prueba 4 · Objetivo de habilidad');
ok(o4.objetivo.valor === null,
  '🚨 …SIN valor numérico: *"No inventar valores numéricos para skills"* (apartado 3)');
ok(tiposDeObjetivoPara(ejercicioPorId('sentadilla-pistol')).some((t) => t.id === 'skill'),
  '…y se ofrece solo donde hay progresión estructurada');
ok(!tiposDeObjetivoPara(ejercicioPorId('press-banca-barra')).some((t) => t.id === 'skill'),
  '⚠️ …y NO donde no la hay: sería un tipo que no se puede medir (regla 8)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 2. Validaciones (prueba 5, apartados 7 y 8) ──');

const mal = (datos) => validarObjetivo(datos, {});
ok(mal({ exerciseId: 'no-existe', tipo: 'reps', valor: 10 }).ok === false, 'Prueba 5 · Un ejercicio que no está en el catálogo');
ok(mal({ exerciseId: 'dominada-prona', tipo: 'reps', valor: 0 }).ok === false, '…un objetivo de cero');
ok(mal({ exerciseId: 'dominada-prona', tipo: 'reps', valor: -5 }).ok === false, '…uno negativo');
ok(mal({ exerciseId: 'dominada-prona', tipo: 'reps', valor: 10.5 }).ok === false, '…repeticiones con decimales');
ok(mal({ exerciseId: 'dominada-prona', tipo: 'reps', valor: 99999 }).ok === false, '…un número imposible');
ok(mal({ exerciseId: 'dominada-prona', tipo: 'reps', valor: 'diez' }).ok === false, '…y un texto');
ok(mal({ exerciseId: 'plancha-frontal', tipo: 'peso', valor: 50 }).ok === false,
  '🚨 …y una unidad INCOMPATIBLE: una plancha no se mide en kilos (apartado 8)');
ok(mal({ exerciseId: 'press-banca-barra', tipo: 'skill' }).ok === false,
  '🚨 …ni una habilidad en un ejercicio sin progresión (apartado 3)');
ok(mal({ exerciseId: 'dominada-prona', tipo: 'reps', valor: 10, fechaObjetivo: 'mañana' }).ok === false, '…ni una fecha rota');
ok(validarObjetivo({ exerciseId: 'dominada-prona', tipo: 'reps', valor: 1 }, {}).ok === true,
  '⚠️ Apartado 43 · pero un objetivo de UNA repetición sí vale');
ok(validarObjetivo({ exerciseId: 'plancha-frontal', tipo: 'duracion', valor: 1 }, {}).ok === true,
  '…y uno de UN segundo también');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 3. Fecha objetivo (pruebas 6, 7 y 13, apartados 9 y 28) ──');

const sinFecha = conObjetivo(REPS, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 20 });
ok(sinFecha.objetivo.fechaObjetivo === '', 'Prueba 6 · Un objetivo sin fecha: es opcional');
const conFecha = conObjetivo(REPS, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 20, fechaObjetivo: '2026-10-15' });
ok(conFecha.objetivo.fechaObjetivo === '2026-10-15', 'Prueba 7 · …y uno con fecha la guarda');
const dFecha = detalleDeObjetivo(conFecha.fitness, conFecha.objetivo, { hoy: HOY });
ok(!!dFecha.fechaObjetivo && !dFecha.avisoFecha, '…y estando en plazo no avisa de nada');

const vencido = conObjetivo(REPS, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 20, fechaObjetivo: '2026-08-01' });
const dVenc = detalleDeObjetivo(vencido.fitness, vencido.objetivo, { hoy: HOY });
ok(dVenc.avisoFecha === FECHA_SUPERADA, `🚨 Prueba 13 · «${FECHA_SUPERADA}» (apartado 28)`);
ok(dVenc.estado === 'activo', '🚨 …y SIGUE EN PROGRESO: ni «fallido» ni un estado nuevo (apartados 28 y 29)');
ok(!ESTADOS_OBJETIVO.includes('fallido') && ESTADOS_OBJETIVO.length === 3,
  '…y «failed» no existe en el modelo (apartado 29, literal)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 4. El progreso, desde la MEJOR marca (pruebas 8-10, apartados 11-13) ──');

const sinNada = conObjetivo({ ...DEFAULT_FITNESS }, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 15 });
const dNada = detalleDeObjetivo(sinNada.fitness, sinNada.objetivo, { hoy: HOY });
ok(dNada.sinDatos === true && dNada.porcentaje === null,
  '🚨 Prueba 8 · Sin entrenamientos NO hay 0 %: es «sin datos» (apartado 43)');
ok(dNada.distancia === '',
  '⚠️ …y no se dice cuánto falta: sin marca no se sabe de dónde parte (apartado 33)');

const dParcial = detalleDeObjetivo(o1.fitness, o1.objetivo, { hoy: HOY });
ok(dParcial.progresoTexto === '12 / 15 reps' && dParcial.porcentaje === 80,
  `Prueba 9 · Progreso parcial: «${dParcial.progresoTexto}» (apartado 11, su ejemplo)`);
ok(dParcial.actual === 12,
  '🚨 …de la MEJOR marca, no de la última: *"No utilizar el último entrenamiento si existe una mejor marca válida"*');
ok(dParcial.distancia === 'Te faltan 3 reps', `🚨 Apartado 33 · «${dParcial.distancia}»`);

const dCarga = detalleDeObjetivo(o2.fitness, o2.objetivo, { hoy: HOY });
ok(dCarga.progresoTexto === '65 / 80 kg', `Apartado 12 · carga: «${dCarga.progresoTexto}»`);
ok(dCarga.distancia === 'Te faltan 15 kg', `…y «${dCarga.distancia}»`);

const dIso = detalleDeObjetivo(o3.fitness, o3.objetivo, { hoy: HOY });
ok(dIso.progresoTexto === '30 / 45 s', `Apartado 13 · isométrico: «${dIso.progresoTexto}»`);
ok(dIso.distancia === 'Te faltan 15 s', `…y «${dIso.distancia}»`);

const logrado = con(
  sesion('dominada-prona', [r(10)], '2026-08-01', { tipoCarga: 'corporal' }),
  sesion('dominada-prona', [r(15)], '2026-09-05', { tipoCarga: 'corporal' }),
);
const oLogrado = conObjetivo(logrado, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 15 });
const dLogrado = detalleDeObjetivo(oLogrado.fitness, oLogrado.objetivo, { hoy: HOY });
ok(dLogrado.estado === 'completado',
  '🚨 Prueba 10 · Al alcanzarlo se marca SOLO: nadie lo toca a mano (apartados 15 y 26)');
ok(!!dLogrado.conseguidoEn && dLogrado.distancia === '',
  `…con su fecha real —«${dLogrado.conseguidoEn}»— y sin decir que falta nada`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 5. Ya completado y sesión posterior PEOR (pruebas 11 y 12, apartado 27) ──');

const peorDespues = guardarSesion(oLogrado.fitness, sesion('dominada-prona', [r(11)], '2026-09-14', { tipoCarga: 'corporal' }));
const dPeor = detalleDeObjetivo(peorDespues, oLogrado.objetivo, { hoy: HOY });
ok(dPeor.estado === 'completado',
  '🚨 Pruebas 11 y 12 · Entrenar PEOR después NO lo descompleta (apartado 27, su ejemplo exacto)');
ok(dPeor.actual === 15,
  '🚨 …y sale gratis: `valorActual` devuelve la mejor marca histórica, y un máximo no baja al añadir');
ok(!SIN_DECLARACIONES.includes('completedAt'),
  '⚠️ …así que NO hace falta guardar `completedAt`: se deriva de la sesión que lo superó');
ok(`${SIN_DECLARACIONES} completedAt: ahora`.includes('completedAt'),
  '…y el barrido SIGUE cazando un `completedAt` guardado de verdad');
ok(DECISIONES_FIT30.some((d) => d.que.includes('completedAt')),
  '…y la decisión SÍ lo nombra, que es por lo que hay que sacarla del barrido');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 6. Cancelar, recuperar y eliminar (pruebas 14 y 15, apartados 20 y 23) ──');

const cancelado = cancelarObjetivo(o1.fitness, o1.objetivo.id, { ahora: Date.now() });
ok(cancelado.objetivos.find((o) => o.id === o1.objetivo.id).estado === 'cancelado', 'Prueba 14 · Se cancela');
ok(listaDeObjetivos(cancelado, { filtro: 'todos', hoy: HOY }).objetivos.every((o) => o.id !== o1.objetivo.id),
  '…y desaparece de la lista normal (apartado 20: sección secundaria)');
const recuperado = reactivarObjetivo(cancelado, o1.objetivo.id, { ahora: Date.now() });
ok(recuperado.objetivos.find((o) => o.id === o1.objetivo.id).estado === 'activo',
  '🔓 Apartado 20 · …y se RECUPERA, volviendo a activo');
ok(recuperado.objetivos.find((o) => o.id === o1.objetivo.id).creadoEn === o1.objetivo.creadoEn,
  '🚨 …*"sin modificar su historial original"*: su fecha de creación no se toca');
ok(reactivarObjetivo(o1.fitness, o1.objetivo.id) === o1.fitness,
  '⚠️ …y reactivar uno que NO está cancelado no hace nada (misma firma que su hermana, E3 F29)');
ok(reactivarObjetivo(o1.fitness, 'no-existe') === o1.fitness, '…ni uno que ya no está');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 7. Duplicados (prueba 16, apartado 24) ──');

const dup = crearObjetivoConAviso(o1.fitness, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 15 }, {});
ok(dup.ok === false && dup.duplicado === true && dup.aviso.titulo === AVISO_DUPLICADO.titulo,
  `🚨 Prueba 16 · «${AVISO_DUPLICADO.titulo}» (apartado 24)`);
ok(dup.fitness.objetivos.length === o1.fitness.objetivos.length,
  '🚨 …y SIN confirmar NO escribe nada: el patrón `aplicarPlan`, y ya van más de veinte');
const dupSi = crearObjetivoConAviso(o1.fitness, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 15 }, { confirmado: true });
ok(dupSi.ok === true && dupSi.fitness.objetivos.length === o1.fitness.objetivos.length + 1,
  '…y confirmando se crea: *"Permitir crear otro solo si el usuario confirma"*');
ok(!objetivoIgual(o1.fitness, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 20 }),
  '⚠️ …otro valor NO es duplicado');
ok(!objetivoIgual(o1.fitness, { exerciseId: 'press-banca-barra', tipo: 'reps', valor: 15 }),
  '…ni otro ejercicio');
ok(!objetivoIgual(cancelado, { exerciseId: 'dominada-prona', tipo: 'reps', valor: 15 }),
  '⚠️ …y uno CANCELADO no estorba para volver a proponérselo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 8. Variantes y ejercicio archivado (pruebas 17 y 18, apartados 25 y 43) ──');

const VAR = con(
  sesion('dominada-prona', [r(12)], '2026-09-05', { tipoCarga: 'corporal' }),
  sesion('dominada-lastrada', [r(6, 10)], '2026-09-08', { tipoCarga: 'adicional' }),
);
const oVar = conObjetivo(VAR, { exerciseId: 'dominada-lastrada', tipo: 'peso', valor: 20 });
const dVar = detalleDeObjetivo(oVar.fitness, oVar.objetivo, { hoy: HOY });
ok(dVar.actual === 10,
  '🚨 Prueba 17 · El objetivo de la LASTRADA cuenta solo lo suyo: *"No mezclar Dominadas con Dominadas lastradas"* (apartado 25)');
ok(dVar.nombre.toLowerCase().includes('lastrad'), `…y se identifica por su variante: «${dVar.nombre}»`);

const ARCH = (() => {
  const base = con(sesion('press-banca-barra', [r(8, 60)], '2026-08-10'));
  return {
    ...base,
    sesiones: base.sesiones.map((s) => ({
      ...s,
      origen: { ...s.origen, ejercicios: s.origen.ejercicios.map((e) => ({ ...e, exerciseId: 'press-antiguo' })) },
    })),
  };
})();
const objArch = crearObjetivo({ id: 'arch', exerciseId: 'press-antiguo', tipo: 'peso', valor: 80, creadoEn: CREADO });
const dArch = detalleDeObjetivo({ ...ARCH, objetivos: [objArch] }, objArch, { hoy: HOY });
ok(dArch.existe === false && dArch.actual === 60,
  '🚨 Prueba 18 · Un ejercicio archivado NO rompe su objetivo: el progreso sigue saliendo (apartado 43)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 9. Habilidades: ni porcentaje ni gráfico (apartados 3 y 14) ──');

const dSkill = detalleDeObjetivo(o4.fitness, o4.objetivo, { hoy: HOY });
ok(dSkill.porcentaje === null && dSkill.numerico === false,
  '🚨 Una habilidad NO tiene porcentaje: *"No mostrar «73 % completado»"* (apartado 14)');
ok(dSkill.grafica.mostrar === false && dSkill.grafica.motivo === SIN_GRAFICO_SKILL,
  `🚨 …ni gráfico: «${SIN_GRAFICO_SKILL}» (apartado 32)`);
ok(dSkill.distancia === '', '…ni «te faltan X»: no hay número que restar');
ok(dSkill.skill && dSkill.skill.porcentaje === null && dSkill.skill.sinPorcentaje === SIN_PORCENTAJE,
  '…y se dice por qué, en vez de dejar el hueco');
ok(dSkill.skill.peldanos.length === 3 && dSkill.skill.peldanos.filter((p) => p.hecho).length === 1,
  `🚨 …lo que se enseña son sus peldaños: ${dSkill.skill.peldanos.filter((p) => p.hecho).length} de ${dSkill.skill.peldanos.length} hechos, como LISTA`);
ok(dSkill.skill.actual && dSkill.skill.actual.exerciseId === 'sentadilla-aire',
  `…con «Ahora mismo: ${dSkill.skill.actual.nombre}»`);
ok(dSkill.estado === 'activo', '…y sin haberla hecho todavía, sigue activo');

const hecha = guardarSesion(o4.fitness, sesion('sentadilla-pistol', [r(3)], '2026-09-12', { tipoCarga: 'corporal' }));
const dHecha = detalleDeObjetivo(hecha, o4.objetivo, { hoy: HOY });
ok(dHecha.estado === 'completado' && dHecha.skill.conseguida === true,
  '🚨 …y se consigue HACIÉNDOLA una vez: no hay umbral que superar');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 10. Historial y gráfico (pruebas 9 y 19, apartados 31 y 32) ──');

ok(dParcial.historial.length === 3, `Apartado 31 · las ${dParcial.historial.length} sesiones que han contribuido`);
ok(dParcial.historial[0].fecha > dParcial.historial[1].fecha, '…de la más reciente a la más antigua');
ok(dParcial.historial.every((h) => typeof h.valor === 'number'), '…cada una con el valor de ESTA métrica');
ok(new Set(dParcial.historial.map((h) => h.sesionId)).size === dParcial.historial.length,
  '🚨 …y sin duplicar sesiones (apartado 31, literal)');
ok(dParcial.grafica.mostrar === true && dParcial.grafica.linea === 15,
  `🚨 Apartado 32 · la evolución con su LÍNEA de objetivo en ${dParcial.grafica.linea}`);
ok(dParcial.grafica.puntos[0].valor === 10 && dParcial.grafica.puntos[2].valor === 12,
  '…de la más antigua a la más reciente: 10 → 11 → 12, que es como se lee una evolución');
ok(dParcial.grafica.unidad === 'reps', '…con la unidad de su métrica');
ok(PUNTOS_MINIMOS_OBJETIVO === 3 && graficaDelObjetivo(o3.fitness, o3.objetivo, { hoy: HOY }).mostrar === false,
  '⚠️ …y con un solo registro no se dibuja: *"Si existen suficientes datos"*');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 11. Integraciones (pruebas 19, 20 y 21, apartados 35, 36 y 37) ──');

const conObj = objetivoParaEjercicio(o1.fitness, 'dominada-prona', { hoy: HOY });
ok(conObj.hay === true && conObj.cta === CTA_VER_OBJETIVO,
  `🚨 Prueba 20 · Con objetivo, la pantalla del ejercicio ofrece «${CTA_VER_OBJETIVO}» (apartado 35)`);
ok(!!conObj.progreso && !!conObj.guardado,
  '⚠️ …y devuelve el progreso Y el objetivo guardado: `listaDeObjetivos` da progresos, no objetivos crudos');
ok(objetivoParaEjercicio(o1.fitness, 'remo-barra', { hoy: HOY }).cta === CTA_CREAR_OBJETIVO,
  `…y sin él, «${CTA_CREAR_OBJETIVO}»`);

const vivo = objetivoEnVivo(o1.fitness, 'dominada-prona', { hoy: HOY });
ok(vivo && vivo.objetivoTexto === '15 reps' && vivo.actualTexto === '12',
  `🚨 Prueba 19 · En el entrenamiento: «Objetivo: ${vivo.objetivoTexto} · Actual: ${vivo.actualTexto}» (apartado 36)`);
ok(Object.keys(vivo).join() === 'id,objetivoTexto,actualTexto,numerico',
  '🚨 …y NADA más: ni una serie sugerida ni un peso propuesto (*"no debe modificar automáticamente la rutina"*)');
ok(objetivoEnVivo(oLogrado.fitness, 'dominada-prona', { hoy: HOY }) === null,
  '⚠️ …y uno ya conseguido no se enseña en vivo: no queda nada que perseguir');
ok(objetivoEnVivo(o1.fitness, 'remo-barra', { hoy: HOY }) === null, '…ni un ejercicio sin objetivo');

/* 🚨 Prueba 21 — el objetivo NO toca el rango. */
const rangoSin = rangoEfectivoDeEjercicio(REPS, 'dominada-prona', {});
const rangoCon = rangoEfectivoDeEjercicio(o1.fitness, 'dominada-prona', {});
ok(JSON.stringify(rangoSin) === JSON.stringify(rangoCon),
  '🚨 Prueba 21 · Crear un objetivo NO mueve ni un punto del rango (apartado 37, literal)');
ok(!/motorRangos|rangoDeEjercicio|RANK_THRESHOLDS|rangoGlobal/.test(SIN_DECLARACIONES),
  '🚨 …y esta librería ni siquiera conoce el motor de rangos');
ok(/motorRangos/.test(`${SIN_DECLARACIONES} import { rangoGlobal } from './motorRangos'`),
  '…y el barrido SIGUE cazando una llamada al motor de verdad');
ok(!!EL_OBJETIVO_NO_TOCA_EL_RANGO.porque, '…declarado con su motivo');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 12. Persistencia y consistencia (prueba 22, apartados 40 y 41) ──');

ok(AUDITORIA_FIT30.clavesNuevas === 0 && AUDITORIA_FIT30.tablasNuevas === 0,
  '🚨 Prueba 22 · Ni una clave ni una tabla nuevas: viven en `fitness.objetivos` (apartado 2)');
ok(!/saveData|localStorage|sessionStorage/.test(LIB),
  '…y esta librería no guarda nada por su cuenta');
const vuelto = crearObjetivo(JSON.parse(JSON.stringify(o1.objetivo)));
ok(vuelto.id === o1.objetivo.id && vuelto.valor === 15 && vuelto.tipo === 'reps',
  '🚨 …y un objetivo sobrevive a ida y vuelta por el normalizador (apartado 40)');
const skillVuelto = crearObjetivo(JSON.parse(JSON.stringify(o4.objetivo)));
ok(skillVuelto.tipo === 'skill' && skillVuelto.valor === null,
  '⚠️ …y una habilidad NO gana un valor al normalizarse (regla 5)');

/* Apartado 41 — editar el objetivo no borra el progreso del ejercicio. */
const editado = editarObjetivo(o1.fitness, o1.objetivo.id, { valor: 20 }, {});
ok(editado.ok && editado.objetivo.id === o1.objetivo.id && editado.objetivo.valor === 20,
  'Apartado 22 · Cambiar 15 → 20 conserva el MISMO id');
ok(typeof editado.objetivo.actualizadoEn === 'number', '…y guarda `updatedAt`');
ok(detalleDeObjetivo(editado.fitness, editado.objetivo, { hoy: HOY }).actual === 12,
  '🚨 …y NO borra el progreso histórico del ejercicio (apartado 22, literal)');
ok(historialDelObjetivo(editado.fitness, editado.objetivo, { hoy: HOY }).length === 3,
  '…sus tres sesiones siguen ahí');

/* Apartado 41 — borrar una sesión recalcula: no hay copia que invalidar. */
const menosUna = { ...o1.fitness, sesiones: o1.fitness.sesiones.filter((s) => s.fecha !== '2026-09-05') };
ok(detalleDeObjetivo(menosUna, o1.objetivo, { hoy: HOY }).actual === 11,
  '🚨 Apartado 41 · Borrar una sesión recalcula el progreso: no hay nada que invalidar porque no hay copia');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 13. NO se predice nada (apartado 34, tres veces) ──');

const TEXTOS = [
  dParcial.distancia, dParcial.progresoTexto, dVenc.avisoFecha, dSkill.progresoTexto,
  dSkill.skill.sinPorcentaje, CELEBRACION.titulo, AVISO_DUPLICADO.texto, FECHA_SUPERADA,
  ...dParcial.historial.map((h) => h.fechaTexto),
].join(' · ');
ok(!/quedan \d|conseguirás|en \d+ (días|semanas)|velocidad|ritmo de progreso/i.test(TEXTOS),
  `🚨 Apartado 34 · ni una predicción en los textos que genera la fase`);
/* Y el barrido del código, sin las tablas que DECLARAN lo que no se hace
   (FIT F25, F28 y F29: lo que se barre es el código, no la declaración). */
ok(!/predicc|estimarFecha|proyectar/i.test(SIN_DECLARACIONES), '…ni una función que lo intente');
ok(/predicc/i.test(LIB), '…y la tabla SÍ lo nombra, para declarar que no se construye');
ok(/predicc/i.test(`${SIN_DECLARACIONES} predicciones()`),
  '…y el barrido SIGUE cazando una predicción de verdad si alguien la mete');
ok(!/\bXP\b|monedas|leaderboard|confeti/i.test(SIN_DECLARACIONES),
  '🚨 …ni XP, ni monedas, ni leaderboard, ni confeti (apartado 16 y D2-02)');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 14. Lo que ya resolvía la F14, y los componentes (apartados 2 y 39) ──');

ok(YA_LO_RESUELVE_LA_F14.length >= 10 && YA_LO_RESUELVE_LA_F14.every((y) => typeof y.es === 'function'),
  `⚠️ ${YA_LO_RESUELVE_LA_F14.length} cosas que ya daba la F14, guardadas como FUNCIONES importadas`);
ok(YA_LO_RESUELVE_LA_F14.every((y) => y.es.name === y.nombre),
  '🚨 …y renombrar una rompe la compilación: no es una lista de nombres sueltos');
ok(['peso', 'reps', 'duracion'].every((id) => TIPOS_OBJETIVO.some((t) => t.id === id)),
  '🚨 Apartado 2 · los tres tipos de la F14 siguen intactos: *"REUTILIZARLOS. No crear duplicados."*');

ok(COMPONENTES_FIT30.length === 9, `Los nueve del apartado 39: ${COMPONENTES_FIT30.filter((c) => !c.nuevo).length} reutilizados y ${COMPONENTES_FIT30.filter((c) => c.nuevo).length} nuevos`);
COMPONENTES_FIT30.forEach((c) => {
  const existe = existsSync(join(RAIZ, c.archivo));
  const definido = existe && new RegExp(`function ${c.es}\\b`).test(leer(c.archivo));
  ok(existe && definido, `  ${c.nombre} → ${c.es} en ${c.archivo}${c.nuevo ? '' : ` (ya estaba, ${c.de})`}`);
});
const reutilizados = COMPONENTES_FIT30.filter((c) => !c.nuevo);
ok(reutilizados.length > 0 && reutilizados.every((c) => c.archivo !== 'src/components/objetivosFitness.jsx'),
  `🚨 …y ${reutilizados.length} YA estaban escritos, fuera del archivo nuevo: «Crear/reutilizar» (apartado 39)`);

const COMP = leer('src/components/objetivosFitness.jsx');
ok(!/#[0-9a-fA-F]{6}\b/.test(sinComentarios(COMP)), '🚨 Regla 2 · ni un hex suelto en los componentes');
ok(!/fixed inset-0/.test(sinComentarios(COMP)), '⚠️ Regla 3 · y ni un overlay, así que no hace falta portal');
ok(/toque-44/.test(COMP), '…y los controles llevan su zona de toque (EH F42)');

ok(NO_EN_FIT30.length === 6 && NO_EN_FIT30.every((n) => n.que && n.porque),
  `⚠️ Lo que no se construye, con su motivo: ${NO_EN_FIT30.length} entradas`);
ok(NO_EN_FIT30.some((n) => /general/i.test(n.que)),
  '…incluidos los objetivos generales, que el apartado 4 aplaza expresamente');
ok(DECISIONES_FIT30.length >= 6 && DECISIONES_FIT30.every((d) => d.que && d.porque),
  `⚠️ Y las decisiones de la fase, escritas: ${DECISIONES_FIT30.length}`);

/* ═════════════════════════════════════════════════════════════════════════ */
console.log('\n── 15. El criterio de finalización (apartado 45) ──');

const auditoria = auditarObjetivos(o1.fitness, o1.objetivo, { hoy: HOY });
auditoria.casillas.forEach((c) => ok(c.ok, `  ${c.que}`));
ok(auditoria.ok === true, '🚨 El ciclo entero del apartado 45, sobre datos de verdad');
/* Y que puede ponerse roja (EH F42). */
ok(casillasDelCiclo({}, null, {}).some((c) => !c.ok),
  '…y sin objetivo se pone roja: la auditoría PUEDE fallar');

/* ═════════════════════════════════════════════════════════════════════════ */
console.log(`\n${fallos === 0 ? '\x1b[32m' : '\x1b[31m'}${total - fallos}/${total} comprobaciones correctas\x1b[0m`);
if (fallos > 0) {
  console.log(`\x1b[31m${fallos} fallo(s) en FIT F30\x1b[0m`);
  process.exit(1);
}
