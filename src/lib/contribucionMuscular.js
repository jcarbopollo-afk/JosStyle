/* ===========================================================================
   ENTREGA 4 · FASE 21/45 — QUÉ EJERCICIOS SOSTIENEN UN RANGO MUSCULAR

   *"Cuando el usuario entre en un rango muscular debe poder entender: ¿qué
   ejercicios están contribuyendo a este rango?"*

   🚨 **No hay un sistema nuevo de rangos** (apartado 0): la puntuación de cada
   ejercicio es la del motor (F19) y el reparto muscular es **el del catálogo**
   (F2). Aquí solo se juntan las dos cosas y se ordenan.

   ⚠️ **Y se miden dos cosas distintas, que no hay que confundir:**

   - **Participación** — lo que dice el catálogo: unas dominadas son 50 %
     dorsales. Es una propiedad del ejercicio, igual para todo el mundo, y
     **no se suma entre ejercicios** (apartado 16: tres ejercicios al 60, 50 y
     40 no hacen «150 % del músculo»).
   - **Peso en el cálculo** — cuánto pesa ESE ejercicio en ESTE rango frente a
     los demás: `puntuación × participación`, normalizado entre los que tienen
     datos (apartado 17). Es interno: sirve para ordenar y para decir cuál
     manda, no para enseñar otro porcentaje que nadie sabría interpretar.

   🚨 **Y nada de esto es hipertrofia** (apartado 6): que un ejercicio pese
   mucho aquí no significa que sea «el mejor para desarrollar el músculo». Se
   mide rendimiento.
   =========================================================================== */

import { subgrupoMuscular } from './fitness.js';
import { todayISO } from './helpers.js';
import { ejercicioPorId, ejerciciosParaLeer, PAPELES as PAPELES_CATALOGO } from './ejercicios.js';
import { repartoMuscular } from './progresoMuscular.js';
import { rangoEfectivoDeEjercicio } from './motorRangos.js';
import { progresoDeEjercicio, indiceDeProgresion } from './progresion.js';
import { grupoMuscular } from './detalleMuscular.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* Los papeles que el catálogo ya distingue (F2). ⚠️ Se enseñan porque explican
   por qué un ejercicio pesa poco: en las dominadas, el antebrazo es
   estabilizador, no el objetivo. */
export const PAPELES = Object.fromEntries(PAPELES_CATALOGO.map((p) => [p.id, p.nombre]));
/* 🔓 FIT F35, apartado 34 — *"No repetir arrays equivalentes en distintos
   archivos"*: este mapa estaba escrito a mano con los tres papeles de la F2.
   Ahora se **deriva** de `PAPELES` de `ejercicios.js`, y se sigue exportando con
   el mismo nombre porque lo leen la pantalla y su prueba. */

/* La etiqueta del apartado 15: lo que significa esa barra, dicho al lado. 🚨 No
   es «el 60 % de tu desarrollo». */
export const ETIQUETA_PARTICIPACION = 'Participación estimada en este grupo muscular';

/* Apartado 6, escrito donde se lee: esto mide rendimiento, no músculo. */
export const AVISO_CONTRIBUCION = 'Mide cuánto pesa cada ejercicio en este rango, no cuál desarrolla más músculo.';

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LA CONTRIBUCIÓN DE UN EJERCICIO (apartados 3 y 4)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `getExerciseMuscleContribution`: lo que aporta un ejercicio a **ese** músculo.
 *
 * 🚨 Apartado 4 — se usa el porcentaje **del músculo que se está mirando**, no
 * el del ejercicio entero: unas dominadas cuentan por su 50 % en Espalda y por
 * su 20 % en Brazos, no por el 100 % en las dos.
 */
export function contribucionDeEjercicio(fitness, exerciseId, { grupoId = null, subgrupoId = null } = {}, { propios = [], perfil = null } = {}) {
  const ej = ejercicioPorId(texto(exerciseId), lista(propios));
  if (!ej) return null;
  const reparto = repartoMuscular(ej).filter((x) => (subgrupoId ? x.subgrupoId === subgrupoId : x.grupoId === grupoId));
  if (!reparto.length) return null;
  const participacion = reparto.reduce((n, x) => n + x.peso, 0);
  /* El papel más importante de los que toca en este músculo. */
  const papeles = lista(ej.musculos).filter((m) => reparto.some((r) => r.subgrupoId === m.subgrupoId));
  /* 🔓 FIT F35, apartado 34 — el orden sale de `PAPELES` de la F2, la lista
     central: aquí había una copia escrita a mano, y el día que se añadiera un
     papel esta línea no se habría enterado. */
  const papel = PAPELES_CATALOGO.map((x) => x.id).find((p) => papeles.some((m) => m.papel === p)) || null;

  const r = rangoEfectivoDeEjercicio(fitness || {}, exerciseId, { propios, perfil });
  const p = r.sinRango ? null : progresoDeEjercicio(fitness || {}, exerciseId, { propios: lista(propios) });
  return {
    exerciseId: ej.id,
    nombre: ej.nombre,
    grupoId: subgrupoId ? (reparto[0] ? reparto[0].grupoId : null) : texto(grupoId),
    subgrupoId: texto(subgrupoId) || null,
    /* Lo que dice el catálogo, en tanto por uno y en porcentaje redondeado. */
    participacion,
    porcentaje: Math.round(participacion * 100),
    papel,
    papelNombre: papel ? PAPELES[papel] : null,
    /* Lo que dice el motor (F19): puntuación, rango, confianza, tendencia. */
    sinDatos: r.sinRango,
    rango: r.sinRango ? null : r.rango,
    nombreRango: r.nombre,
    score: r.sinRango ? null : r.score,
    confianza: r.confianza,
    fuente: r.fuente,
    tendencia: r.sinRango ? null : r.tendencia,
    dataPoints: r.dataPoints,
    /* Apartado 13 — el último resultado con la unidad que le corresponde: lo
       escribe la F11, que sabe en qué clase está cada aparición. */
    ultima: p && p.ultima ? p.ultima.mejor : '',
    fecha: p && p.ultima ? p.ultima.fecha : '',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LA LISTA, ORDENADA Y NORMALIZADA (apartados 9 y 17)
   ═══════════════════════════════════════════════════════════════════════════ */

export const ORDENES_CONTRIBUCION = [
  { id: 'reciente', nombre: 'Más reciente' },
  { id: 'contribucion', nombre: 'Contribución' },
  { id: 'progreso', nombre: 'Progreso' },
];

const PESO_TENDENCIA = { mejora: 2, estable: 1, descenso: 0 };

/**
 * Los ejercicios de un músculo, separados en **los que sostienen el rango** y
 * **los que todavía no** (apartado 10: *"visualmente separado"*).
 *
 * El peso relativo se calcula como dice el apartado 17: `puntuación ×
 * participación`, normalizado entre los que tienen datos. ⚠️ Es interno —
 * ordena la lista y dice cuál manda—; lo que se enseña es la participación del
 * catálogo, que es lo único que se puede afirmar sin interpretar.
 */
export function contribucionesDeMusculo(fitness, { grupoId = null, subgrupoId = null } = {}, { propios = [], perfil = null, orden = 'reciente', hoy = todayISO() } = {}) {
  /* 🔓 FIT F35, apartado 37: un archivado con datos sigue en el reparto de su
     músculo, porque sigue contando en su rango. */
  const conHistoria = [...indiceDeProgresion(fitness, lista(propios)).keys()];
  const todas = ejerciciosParaLeer(lista(propios), conHistoria)
    .map((ej) => contribucionDeEjercicio(fitness, ej.id, { grupoId, subgrupoId }, { propios, perfil }))
    .filter(Boolean);

  const conDatos = todas.filter((c) => !c.sinDatos);
  const sinDatos = todas.filter((c) => c.sinDatos)
    .sort((a, b) => b.participacion - a.participacion || a.nombre.localeCompare(b.nombre));

  /* Normalización del apartado 17, entre los que tienen datos válidos. */
  const bruto = conDatos.map((c) => ({ c, w: (c.score || 0) * c.participacion }));
  const suma = bruto.reduce((n, x) => n + x.w, 0);
  const conPeso = bruto.map(({ c, w }) => ({
    ...c,
    /* 0 si nadie tiene puntuación: no se reparte un 100 % entre ceros. */
    pesoRelativo: suma > 0 ? w / suma : 0,
  }));

  const ordenados = [...conPeso].sort((a, b) => {
    if (orden === 'contribucion') return b.pesoRelativo - a.pesoRelativo || a.nombre.localeCompare(b.nombre);
    if (orden === 'progreso') {
      return (PESO_TENDENCIA[b.tendencia] ?? -1) - (PESO_TENDENCIA[a.tendencia] ?? -1)
        || b.pesoRelativo - a.pesoRelativo;
    }
    /* Por defecto (apartado 9): lo reciente primero, luego lo que más pesa, y a
       igualdad, lo que tiene más datos detrás. */
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
    return b.pesoRelativo - a.pesoRelativo || b.dataPoints - a.dataPoints;
  });

  const principal = ordenados.length
    ? [...ordenados].sort((a, b) => b.pesoRelativo - a.pesoRelativo)[0]
    : null;

  return {
    conDatos: ordenados,
    sinDatos,
    total: todas.length,
    /* Para la cabecera: cuántos sostienen el rango y cuál manda. */
    cuantos: ordenados.length,
    principal,
    /* Apartado 28 — el estado, en palabras. */
    estado: ordenados.length === 0 ? 'sin_datos' : (ordenados.length === 1 ? 'limitado' : 'suficiente'),
    aviso: AVISO_CONTRIBUCION,
    vacio: 'Entrena ejercicios de este grupo para empezar a generar datos.',
    hoy,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · POR SUBGRUPOS (apartados 7 y 26)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * El desglose del apartado 7: grupo → subgrupo → ejercicios. ⚠️ Cada subgrupo
 * enseña **solo** los suyos (apartado 26: *"desde Bíceps, no mostrar toda la
 * lista de brazos"*).
 */
export function contribucionesPorSubgrupo(fitness, grupoId, { propios = [], perfil = null, limite = 4 } = {}) {
  const g = grupoMuscular(grupoId);
  if (!g) return [];
  return lista(g.subgrupos).map((sg) => {
    const c = contribucionesDeMusculo(fitness, { subgrupoId: sg.id }, { propios, perfil, orden: 'contribucion' });
    return {
      id: sg.id,
      nombre: subgrupoMuscular(sg.id)?.nombre || sg.nombre,
      ejercicios: c.conDatos.slice(0, limite),
      cuantos: c.cuantos,
      sinDatos: c.cuantos === 0,
    };
  });
}

export const NO_EN_FIT21 = [
  { que: 'Recomendaciones de entrenamiento y «ejercicios óptimos»', porque: 'Apartado 32: esta fase **explica** la composición del rango, no aconseja.' },
  { que: 'Lenguaje de hipertrofia («el mejor para desarrollar el músculo»)', porque: 'Apartado 6: se mide rendimiento, no tamaño. La lista lleva el aviso escrito.' },
  { que: 'Enseñar el peso normalizado como un segundo porcentaje', porque: 'Apartado 17 dice normalizar **internamente**. Dos porcentajes en la misma tarjeta —participación y peso en el cálculo— se leerían como el mismo número mal sumado; se enseña el del catálogo, que es el que se puede afirmar.' },
  { que: 'IA, predicciones, comparación con otros, XP y logros', porque: 'Apartado 32.' },
];

export const DECISIONES_FIT21 = [
  { que: 'La participación es la del catálogo y NO se suma entre ejercicios', porque: 'Apartado 16: tres ejercicios al 60, 50 y 40 no hacen «150 % del músculo». Cada barra es de su ejercicio, y la etiqueta lo dice.' },
  { que: 'Los que no tienen datos salen aparte, no mezclados', porque: 'Apartado 10: un ejercicio del grupo sin entrenar no influye en el rango, así que no puede aparecer como si lo sostuviera — pero sigue en pantalla, porque es por donde seguir.' },
  { que: 'El orden por defecto es lo reciente, después lo que más pesa', porque: 'Apartado 9. Alfabético escondería justo lo que está entrenando ahora.' },
];
