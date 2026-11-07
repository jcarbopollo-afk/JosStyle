import { ejerciciosDeSesion } from './entrenamiento';
import { ejercicioPorId, nombreSinCatalogo } from './ejercicios';
/* 🧹 FIT F44 (apartado 39) — el número con coma, de un solo sitio. */
import { decimal, repeticionValida, textoReps } from './numerosFitness';
import { idPlantillaDeDia } from './planes';
import { MODOS_PROGRESION_IDS } from './fitness';

/* Entrega 4 · Fase 11/45 — «Progresión y comparación del rendimiento».
   ═══════════════════════════════════════════════════════════════════════════

   *"¿Estoy mejorando realmente en mis ejercicios?"* Y el criterio: poder
   responder **cuál fue mi última marca, cuál la anterior, cuál la mejor y si he
   mejorado, empeorado o me he mantenido** — sin tocar los datos originales.

   🚨 **TODO ES DERIVADO** (apartados 2 y 36). La fuente son las sesiones
   COMPLETADAS de `fitness.sesiones`, las mismas del historial de la F10. Aquí no
   se guarda nada: ni un «récord», ni una «mejora», ni un campo nuevo en la
   sesión. Si mañana cambia una regla de comparación, el progreso entero se
   recalcula solo y ninguna sesión queda con una conclusión vieja pegada.

   Las reglas matemáticas, que es donde este archivo tiene que explicarse
   (apartado 43):

   ── QUÉ ES COMPARABLE (apartados 3, 4, 18 y 19) ─────────────────────────────
   Dos apariciones son comparables si son **el mismo `exerciseId`** y **la misma
   clase de medida**. El id ya separa variante, agarre y material, porque en el
   catálogo de la F2 cada uno es un ejercicio propio: «dominada prona», «dominada
   supina» y «dominada lastrada» son tres ids. Y la clase separa lo que el id no
   ve: las mismas dominadas **con lastre** no se comparan con las mismas **a peso
   corporal**. Ser sustitutos o de la misma familia **no las hace comparables**
   (apartado 4).

   Las clases:
     · `carga`        — peso externo y repeticiones (press de banca a 60 kg).
     · `lastre`       — peso AÑADIDO al corporal (dominadas +10 kg).
     · `repeticiones` — sin peso: peso corporal o explosivos.
     · `tiempo`       — isométricos, en segundos.

   ── LA MEJOR SERIE (apartado 14) ────────────────────────────────────────────
   Nada de una fórmula que mezcle todo. Por clase:
     · carga y lastre → **más peso**; a igual peso, **más repeticiones**.
     · repeticiones   → **más repeticiones**.
     · tiempo         → **más segundos**.

   ── CÓMO SE COMPARAN DOS SESIONES (apartados 8-13, 22, 25 y 26) ──────────────
   1. **Mejor serie contra mejor serie.** Si una es mejor según la regla de
      arriba, eso decide. Con un caso que la regla sola no resuelve: **menos peso
      y más repeticiones**. Ahí, y solo ahí, desempata el volumen de esa serie
      (peso × repeticiones) — como métrica auxiliar, que es lo que dice el
      apartado 11.
   2. **Si las mejores series empatan, serie a serie**, emparejadas por orden y
      **solo hasta el número de series que hay en las DOS**: si hoy hizo 2 de 3,
      la tercera de la vez anterior no cuenta en contra (apartado 26). La suma de
      las diferencias decide: 10/9/8 frente a 10/10/9 es una mejora aunque la
      primera serie sea igual (apartado 25).
   3. Si todo empata dentro de la tolerancia → **estable**.

   ── LA TOLERANCIA (apartado 22) ─────────────────────────────────────────────
   Repeticiones y segundos son enteros: una unidad ya es un cambio (8 → 9 es una
   mejora, lo pide el enunciado). El peso es decimal, y una diferencia de menos
   de 0,01 kg es ruido de coma flotante, no un cambio.

   ── CUÁNDO SE IGNORA UN DATO (apartados 17, 26 y 32) ────────────────────────
   Solo cuentan las series **marcadas como hechas**. Un peso negativo, unas
   repeticiones negativas o no numéricas, unos segundos negativos: se ignora
   **ese dato**, no la serie ni la sesión. Una serie que se queda sin nada útil
   para su clase no participa. Y un dato que falta **no se estima**: si hoy no
   apuntó el peso, se comparan las repeticiones si se puede, y el peso no. */

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LIMPIAR UNA SERIE (apartados 32 y 33)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Un número válido y ≥ 0, sin redondear (22,5 sigue siendo 22,5). */
const noNegativo = (v) => {
  if (v === null || v === undefined || v === '' || typeof v === 'boolean') return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
/** Un entero positivo: cero repeticiones no es una serie, es que no la hizo. */
const enteroPositivo = (v) => {
  const n = noNegativo(v);
  return n !== null && n > 0 ? Math.round(n) : null;
};

/** 🔓 FIT 5/8 (prompt 5 §8) — unas repeticiones positivas, enteras o de media
 *  en media, **sin redondear**. Una de 8,2 (que no se puede escribir, pero
 *  podría llegar de fuera) no se redondea a 8: se ignora como dato. */
const repsPositivas = (v) => {
  const n = noNegativo(v);
  return n !== null && n > 0 && repeticionValida(n) ? n : null;
};

export function serieLimpia(serie) {
  const h = serie?.hecho || {};
  const peso = noNegativo(h.peso);
  return {
    /* Un peso de 0 no es carga: es que no hay peso externo. */
    peso: peso !== null && peso > 0 ? peso : null,
    reps: repsPositivas(h.reps),
    duracion: enteroPositivo(h.duracion),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LA CLASE DE MEDIDA Y LA MEJOR SERIE (apartados 5, 12, 13 y 14)
   ═══════════════════════════════════════════════════════════════════════════ */

export const CLASES = [
  { id: 'carga', nombre: 'Peso y repeticiones', unidad: 'kg' },
  { id: 'lastre', nombre: 'Peso añadido y repeticiones', unidad: 'kg' },
  { id: 'repeticiones', nombre: 'Repeticiones', unidad: 'reps' },
  { id: 'tiempo', nombre: 'Tiempo', unidad: 's' },
];

/** Qué se mide en ESTA aparición, a partir de las series que valen. */
export function claseDe(modo, series, tipoCarga = '') {
  if (modo === 'tiempo') return 'tiempo';
  if (lista(series).some((s) => s.peso !== null && s.reps !== null)) {
    return tipoCarga === 'adicional' ? 'lastre' : 'carga';
  }
  return 'repeticiones';
}

/** Las series que sirven para comparar en esa clase. Una sin el dato de su
 *  clase se queda fuera (apartado 17): un «peso desconocido × 10» no entra en
 *  una comparación de carga. */
export function seriesComparables(clase, series) {
  return lista(series).filter((s) => {
    if (clase === 'tiempo') return s.duracion !== null;
    if (clase === 'carga' || clase === 'lastre') return s.peso !== null && s.reps !== null;
    return s.reps !== null;
  });
}

/** ¿Es `a` mejor que `b` como serie? 1 sí, -1 no, 0 empate. La regla del
 *  apartado 14, sin mezclar métricas. */
export function compararSeries(clase, a, b) {
  if (!a && !b) return 0;
  if (!b) return 1;
  if (!a) return -1;
  if (clase === 'tiempo') return Math.sign(difEntera(a.duracion, b.duracion));
  if (clase === 'repeticiones') return Math.sign(difEntera(a.reps, b.reps));
  const dPeso = difPeso(a.peso, b.peso);
  if (dPeso !== 0) return Math.sign(dPeso);
  return Math.sign(difEntera(a.reps, b.reps));
}

export function mejorSerie(clase, series) {
  return seriesComparables(clase, series)
    .reduce((mejor, s) => (compararSeries(clase, s, mejor) > 0 ? s : mejor), null);
}

/* Tolerancia (apartado 22). */
export const TOLERANCIA_PESO_KG = 0.01;
const difPeso = (a, b) => {
  const d = (a || 0) - (b || 0);
  return Math.abs(d) < TOLERANCIA_PESO_KG ? 0 : d;
};
const difEntera = (a, b) => (a || 0) - (b || 0);

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LAS APARICIONES DE UN EJERCICIO (apartados 6, 7, 28, 29 y 31)
   ═══════════════════════════════════════════════════════════════════════════ */

const momento = (s) => s?.terminadaEn || s?.iniciadaEn || 0;

/** Una sesión completada, reducida a lo que dice de un ejercicio.
 *  ⚠️ Si el ejercicio aparece dos veces en la misma sesión (dos líneas), sus
 *  series se juntan: fue el mismo día y el mismo ejercicio. */
function aparicionesDeSesion(sesion, propios = []) {
  const porEjercicio = new Map();
  for (const e of ejerciciosDeSesion(sesion)) {
    const id = texto(e?.exerciseId);
    if (!id) continue;
    /* 🔓 FIT F12 — cada serie lleva su NÚMERO, contado igual que el historial
       (`filasDeSeries`: las omitidas no cuentan). Sin él, «Serie 2» en Progreso
       podía ser la «Serie 3» del historial, y las dos pantallas se contradirían. */
    let n = 0;
    const hechas = [];
    for (const s of lista(e.series)) {
      if (!s) continue;
      if (s.estado !== 'omitida') n += 1;
      if (s.estado === 'hecha') hechas.push({ ...serieLimpia(s), numero: n });
    }
    if (!porEjercicio.has(id)) {
      porEjercicio.set(id, { modo: e.modo === 'tiempo' ? 'tiempo' : 'reps', tipoCarga: texto(e.linea?.tipoCarga), series: [] });
    }
    porEjercicio.get(id).series.push(...hechas);
  }

  const salida = [];
  for (const [exerciseId, x] of porEjercicio) {
    const clase = claseDe(x.modo, x.series, x.tipoCarga);
    const series = seriesComparables(clase, x.series);
    /* Una aparición sin ni una serie útil no es una marca: no hizo nada medible. */
    if (!series.length) continue;
    const ej = ejercicioPorId(exerciseId, propios);
    const volumen = clase === 'carga'
      ? series.reduce((n, s) => n + s.peso * s.reps, 0)
      : null;
    salida.push({
      sesionId: sesion.id,
      fecha: sesion.fecha,
      momento: momento(sesion),
      exerciseId,
      /* Apartado 3 — lo que identifica al ejercicio, conservado aunque se compare
         por id: para decirlo en pantalla y por si una fase futura lo necesita. */
      nombre: ej ? ej.nombre : nombreSinCatalogo(exerciseId),
      variante: ej?.variante || '',
      agarre: ej?.agarre || null,
      equipamiento: ej ? lista(ej.equipamiento) : [],
      clase,
      series,
      mejor: mejorSerie(clase, series),
      /* 🚨 Apartados 11 y 12 — volumen SOLO con carga externa. Ni con lastre (el
         peso corporal no está en el número) ni sin peso: 72 kg × 10 sería
         inventárselo. */
      volumen,
      /* 🔓 FIT F36, apartado 39 — el peso corporal de ESE día, si la sesión lo
         guardó: lo lee el rango (F15) para no medir el pasado con el de hoy. */
      pesoCorporal: sesion.pesoCorporal ?? null,
    });
  }
  return salida;
}

/* 🔓 FIT F40 (apartados 11, 12 y 42) — **y las apariciones de cada sesión, una
   vez por sesión.** El índice se reutilizaba por lista, pero el historial de
   un rango (F22) calcula el rango de CADA día con las sesiones hasta ese día
   —una lista nueva por punto—, así que volvía a leer, serie a serie, todas las
   sesiones anteriores: con 1 000 sesiones el resumen de Rangos tardaba casi
   cinco segundos. Una sesión guardada no cambia (editarla crea otro objeto,
   como la lista), así que su objeto sirve de llave igual que la lista sirve
   para el índice: si cambia, es otra sesión y se lee de nuevo. Mismo resultado,
   ni una regla distinta. */
const APARICIONES = new WeakMap();
function aparicionesMemorizadas(sesion, propios = []) {
  const guardado = APARICIONES.get(sesion);
  const mismosPropios = guardado && (guardado.propios === propios
    || (lista(guardado.propios).length === 0 && lista(propios).length === 0));
  if (mismosPropios) return guardado.apariciones;
  const apariciones = aparicionesDeSesion(sesion, propios);
  APARICIONES.set(sesion, { propios, apariciones });
  return apariciones;
}

/* 🚨 Apartado 31 — el índice se construye **una vez por lista de sesiones**. La
   lista de `fitness.sesiones` es inmutable (cada guardado crea una nueva), así
   que su referencia sirve de llave: mientras no cambie, se reutiliza. */
const CACHE = new WeakMap();

/** exerciseId → apariciones, de la más reciente a la más antigua. */
export function indiceDeProgresion(fitness, propios = []) {
  const sesiones = lista((fitness || {}).sesiones);
  const guardado = CACHE.get(sesiones);
  /* ⚠️ Dos listas de propios vacías son la misma: sin esto, el `[]` por defecto
     de cada llamada es un objeto nuevo y el caché no acertaría nunca. */
  const mismosPropios = guardado && (guardado.propios === propios
    || (lista(guardado.propios).length === 0 && lista(propios).length === 0));
  if (mismosPropios) return guardado.indice;

  const indice = new Map();
  for (const s of sesiones) {
    if (!s || !s.id || s.estado !== 'completada') continue;
    for (const a of aparicionesMemorizadas(s, propios)) {
      if (!indice.has(a.exerciseId)) indice.set(a.exerciseId, []);
      indice.get(a.exerciseId).push(a);
    }
  }
  for (const l of indice.values()) {
    l.sort((a, b) => (a.fecha === b.fecha ? b.momento - a.momento : (a.fecha < b.fecha ? 1 : -1)));
  }
  if (sesiones.length) CACHE.set(sesiones, { propios, indice });
  return indice;
}

/** Apartado 29 — todas las apariciones de un ejercicio. */
export function aparicionesDeEjercicio(fitness, exerciseId, propios = []) {
  return indiceDeProgresion(fitness, propios).get(texto(exerciseId)) || [];
}

/** Apartado 7 y 28 — la aparición comparable ANTERIOR a otra: la más reciente
 *  de antes **de la misma clase**, aunque haya muchas sesiones de por medio. */
export function anteriorComparable(apariciones, actual) {
  if (!actual) return null;
  const i = apariciones.indexOf(actual);
  const previas = i === -1
    ? apariciones.filter((a) => a.momento < actual.momento)
    : apariciones.slice(i + 1);
  return previas.find((a) => a.clase === actual.clase) || null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · COMPARAR DOS APARICIONES (apartados 8-13, 16-18 y 22-26)
   ═══════════════════════════════════════════════════════════════════════════ */

export const TENDENCIAS = [
  { id: 'mejora', nombre: 'Mejora' },
  { id: 'estable', nombre: 'Estable' },
  { id: 'descenso', nombre: 'Descenso' },
  { id: 'sin_datos', nombre: 'Sin datos suficientes' },
];

const conSigno = (n, unidad) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${decimal(Math.abs(n))}${unidad}`;

/** Un cambio de A a B, con porcentaje **solo cuando tiene sentido** (apartado 24). */
function cambio(antes, despues, { unidad = '', esPeso = false } = {}) {
  if (antes === null || antes === undefined || despues === null || despues === undefined) return null;
  const diferencia = esPeso ? difPeso(despues, antes) : difEntera(despues, antes);
  return {
    antes,
    despues,
    diferencia,
    /* «+1 rep», no «+1 reps». */
    texto: diferencia === 0 ? 'igual' : conSigno(diferencia, unidad === ' reps' && Math.abs(diferencia) === 1 ? ' rep' : unidad),
    /* Sin denominador no hay porcentaje, y un «+100 %» de 0 a algo no dice nada. */
    porcentaje: antes > 0 && diferencia !== 0 ? Math.round((diferencia / antes) * 1000) / 10 : null,
  };
}

/** *"20 kg × 8"*, *"10 reps"*, *"12 s"*, *"+10 kg × 6"*. */
export function textoSerie(clase, s) {
  if (!s) return '';
  if (clase === 'tiempo') return `${s.duracion} s`;
  if (clase === 'repeticiones') return `${textoReps(s.reps)} ${s.reps === 1 ? 'rep' : 'reps'}`;
  return `${clase === 'lastre' ? '+' : ''}${decimal(s.peso)} kg × ${textoReps(s.reps)}`;
}

/** *"10 · 9 · 8"* (apartado 6). */
export function textoSeries(clase, series) {
  return lista(series).map((s) => {
    if (clase === 'tiempo') return `${s.duracion} s`;
    if (clase === 'repeticiones') return textoReps(s.reps);
    return `${decimal(s.peso)}×${textoReps(s.reps)}`;
  }).join(' · ');
}

/**
 * 🚨 La comparación de apartado 23: *Anterior → Actual*. Nunca devuelve un
 * «+100 %» para un primer registro (apartado 16), y nunca compara clases
 * distintas (apartado 18).
 */
export function compararApariciones(anterior, actual) {
  if (!actual) return { estado: 'sin_datos', texto: 'Sin datos', cambios: null };
  if (!anterior) {
    return { estado: 'primer_registro', tendencia: 'sin_datos', texto: 'Primer registro', cambios: null, actual };
  }
  if (anterior.exerciseId !== actual.exerciseId || anterior.clase !== actual.clase) {
    return {
      estado: 'no_comparable',
      tendencia: 'sin_datos',
      texto: 'No comparable: cambió cómo se mide',
      motivo: anterior.exerciseId !== actual.exerciseId ? 'otro_ejercicio' : 'otra_medida',
      cambios: null,
      anterior,
      actual,
    };
  }

  const { clase } = actual;
  const A = anterior.mejor;
  const B = actual.mejor;

  /* 1 · Mejor serie contra mejor serie. */
  let decision = compararSeries(clase, B, A);
  let porQue = decision !== 0 ? 'mejor_serie' : '';
  const menosPesoMasReps = (clase === 'carga' || clase === 'lastre')
    && difPeso(B.peso, A.peso) < 0 && difEntera(B.reps, A.reps) > 0;
  if (menosPesoMasReps) {
    /* El único caso que la regla sola no resuelve: desempata el volumen de esa
       serie (apartado 11), como métrica auxiliar. */
    const dv = B.peso * B.reps - A.peso * A.reps;
    decision = Math.abs(dv) < TOLERANCIA_PESO_KG ? 0 : Math.sign(dv);
    porQue = 'volumen_mejor_serie';
  }

  /* 2 · Serie a serie, solo hasta las que hay en las dos (apartados 25 y 26). */
  const pares = Math.min(anterior.series.length, actual.series.length);
  const porSerie = [];
  let suma = 0;
  for (let i = 0; i < pares; i += 1) {
    const a = anterior.series[i];
    const b = actual.series[i];
    const d = {
      serie: i + 1,
      reps: clase === 'tiempo' ? null : difEntera(b.reps, a.reps),
      duracion: clase === 'tiempo' ? difEntera(b.duracion, a.duracion) : null,
      peso: clase === 'carga' || clase === 'lastre' ? difPeso(b.peso, a.peso) : null,
    };
    porSerie.push(d);
    suma += compararSeries(clase, b, a);
  }
  if (decision === 0 && !menosPesoMasReps) {
    decision = Math.sign(suma);
    if (decision !== 0) porQue = 'serie_a_serie';
  }

  const principal = clase === 'tiempo' ? 'duracion' : 'reps';
  const cambios = {
    peso: clase === 'carga' || clase === 'lastre' ? cambio(A.peso, B.peso, { unidad: ' kg', esPeso: true }) : null,
    reps: clase !== 'tiempo' ? cambio(A.reps, B.reps, { unidad: ' reps' }) : null,
    duracion: clase === 'tiempo' ? cambio(A.duracion, B.duracion, { unidad: ' s' }) : null,
    volumen: clase === 'carga' && anterior.volumen !== null && actual.volumen !== null
      ? cambio(anterior.volumen, actual.volumen, { unidad: ' kg', esPeso: true }) : null,
    series: cambio(anterior.series.length, actual.series.length),
  };
  /* Apartado 44 — *"+1 rep en cada serie"* si la estructura lo permite. */
  const campo = clase === 'tiempo' ? 'duracion' : 'reps';
  const igualEnTodas = porSerie.length > 0 && porSerie.every((d) => d[campo] === porSerie[0][campo])
    && (clase === 'tiempo' || clase === 'repeticiones' || porSerie.every((d) => d.peso === 0));
  /* ⚠️ Con UNA serie, «+2 reps en cada serie» no significa nada: hacen falta dos. */
  const enCadaSerie = igualEnTodas && pares >= 2 && porSerie[0][campo] !== 0 && pares === actual.series.length && pares === anterior.series.length
    ? `${conSigno(porSerie[0][campo], campo === 'duracion' ? ' s' : (Math.abs(porSerie[0][campo]) === 1 ? ' rep' : ' reps'))} en cada serie`
    : '';

  const estado = decision > 0 ? 'mejora' : decision < 0 ? 'descenso' : 'estable';
  return {
    estado,
    tendencia: estado,
    porQue,
    texto: textoDeComparacion(estado, clase, cambios, enCadaSerie, principal),
    enCadaSerie,
    cambios,
    porSerie,
    anterior,
    actual,
  };
}

/** La frase corta: *"+2,5 kg"*, *"+2 reps"*, *"+1 rep en cada serie"*,
 *  *"Igual que la última vez"*. ⚠️ Con los datos originales al lado, nunca
 *  reducida a un número inventado (apartado 10). */
function textoDeComparacion(estado, clase, c, enCadaSerie, principal) {
  if (enCadaSerie) return enCadaSerie;
  const partes = [];
  if (c.peso && c.peso.diferencia !== 0) partes.push(c.peso.texto);
  if (c[principal] && c[principal].diferencia !== 0) partes.push(c[principal].texto);
  if (partes.length) return partes.join(' · ');
  if (estado === 'estable') return 'Igual que la última vez';
  return estado === 'mejora' ? 'Más trabajo en el conjunto de series' : 'Menos trabajo en el conjunto de series';
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · EL PROGRESO DE UN EJERCICIO (apartados 15, 20, 21 y 27)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 15 — el mejor resultado registrado, **por clase**: la mejor serie
 *  con lastre no se compara con la mejor a peso corporal. */
export function mejorHistorico(apariciones, clase = null) {
  const l = lista(apariciones);
  /* Sin clase pedida, la de la aparición más reciente: es la forma en que lo
     hace ahora. */
  const objetivo = clase || (l[0] ? l[0].clase : null);
  let mejor = null;
  for (const a of l) {
    if (a.clase !== objetivo) continue;
    /* `> 0` estricto: en un empate se queda la más reciente, que va primero. */
    if (!mejor || compararSeries(objetivo, a.mejor, mejor.serie) > 0) {
      mejor = { clase: a.clase, serie: a.mejor, fecha: a.fecha, sesionId: a.sesionId, texto: textoSerie(a.clase, a.mejor) };
    }
  }
  return mejor;
}

/**
 * 🚨 **`progresoDeEjercicio`**, el `getExerciseProgress` del apartado 20.
 * Responde las cuatro preguntas del criterio de finalización: última marca,
 * anterior, mejor resultado y tendencia.
 */
export function progresoDeEjercicio(fitness, exerciseId, { propios = [] } = {}) {
  const apariciones = aparicionesDeEjercicio(fitness, exerciseId, propios);
  const ultima = apariciones[0] || null;
  const anterior = anteriorComparable(apariciones, ultima);
  const inmediataPrevia = apariciones[1] || null;
  /* 🐛 Si ya lo hizo antes pero de otra forma (con peso y hoy sin apuntarlo, con
     lastre…), **no es un primer registro**: decirlo sería mentir. Es «no
     comparable», y se dice así (apartados 16, 17 y 18). */
  const comparacion = !anterior && ultima && inmediataPrevia
    ? compararApariciones(inmediataPrevia, ultima)
    : compararApariciones(anterior, ultima);
  /* ⚠️ Apartado 18 — si justo antes lo hizo de otra forma (con lastre, por
     tiempo…), se DICE: no se compara, pero tampoco se esconde el cambio. */
  const inmediata = apariciones[1] || null;
  const cambioDeMedida = !!(ultima && inmediata && inmediata.clase !== ultima.clase);
  return {
    exerciseId: texto(exerciseId),
    nombre: ultima ? ultima.nombre : (ejercicioPorId(texto(exerciseId), propios)?.nombre || nombreSinCatalogo(exerciseId)),
    /* Apartado 27 — sin ninguna aparición: «Nuevo ejercicio». */
    nuevo: apariciones.length === 0,
    veces: apariciones.length,
    ultima: ultima ? { fecha: ultima.fecha, clase: ultima.clase, series: ultima.series, texto: textoSeries(ultima.clase, ultima.series), mejor: textoSerie(ultima.clase, ultima.mejor) } : null,
    anterior: anterior ? { fecha: anterior.fecha, clase: anterior.clase, series: anterior.series, texto: textoSeries(anterior.clase, anterior.series), mejor: textoSerie(anterior.clase, anterior.mejor) } : null,
    mejor: ultima ? mejorHistorico(apariciones, ultima.clase) : null,
    tendencia: apariciones.length === 0 ? 'sin_datos' : (comparacion.tendencia || 'sin_datos'),
    comparacion,
    cambioDeMedida,
    apariciones,
  };
}

/** Apartado 34 — la comparación de UNA sesión del historial con la vez
 *  anterior. `null` si no hay vez anterior comparable: el historial se calla. */
export function comparacionEnSesion(fitness, sesionId, exerciseId, { propios = [] } = {}) {
  const apariciones = aparicionesDeEjercicio(fitness, exerciseId, propios);
  const actual = apariciones.find((a) => a.sesionId === sesionId) || null;
  if (!actual) return null;
  const anterior = anteriorComparable(apariciones, actual);
  if (!anterior) return null;
  return compararApariciones(anterior, actual);
}

/** Apartado 35 — *"Última vez: 20 kg × 10"*, para una fase futura del
 *  entrenamiento en vivo. `antesDe` deja fuera la sesión que se está haciendo. */
export function ultimaVez(fitness, exerciseId, { propios = [], antesDe = null } = {}) {
  const a = aparicionesDeEjercicio(fitness, exerciseId, propios)
    .find((x) => !antesDe || x.sesionId !== antesDe);
  return a ? { fecha: a.fecha, clase: a.clase, texto: textoSerie(a.clase, a.mejor), series: textoSeries(a.clase, a.series) } : null;
}

/**
 * 🔓 Fase 1C — **el primer récord personal verificable**, para el logro «Primer PR»
 * (`logros.js`). Un récord es una aparición cuya mejor serie **supera** —`compararSeries`,
 * la regla del apartado 14, la misma de `mejorHistorico`— a la mejor de **todas las
 * anteriores** del mismo ejercicio y **la misma clase**. Así:
 *   · la primera vez que se hace un ejercicio **no** es un récord: no hay marca que superar
 *     (por eso la Fase 1B no podía contar «la primera sesión»);
 *   · igualar la mejor marca tampoco, ni bajar de ella;
 *   · con lastre y sin lastre, o con y sin peso apuntado, son marcas distintas (apartado 4).
 * Derivado, como todo aquí: no se guarda nada, y borrar la sesión del récord lo deshace.
 * Devuelve el **primero** en el tiempo, o `null`.
 */
export function primerRecordPersonal(fitness) {
  let primero = null;
  for (const apariciones of indiceDeProgresion(fitness).values()) {
    /* El índice va de la más reciente a la más antigua: se recorre al revés. */
    const cronologico = [...apariciones].reverse();
    const mejorPorClase = new Map();
    for (const a of cronologico) {
      if (!a || !a.mejor) continue;
      const previa = mejorPorClase.get(a.clase);
      const supera = !!previa && compararSeries(a.clase, a.mejor, previa) > 0;
      if (supera) {
        const antes = !primero || a.fecha < primero.fecha
          || (a.fecha === primero.fecha && (a.momento || 0) < (primero.momento || 0));
        if (antes) {
          primero = {
            exerciseId: a.exerciseId, nombre: a.nombre, fecha: a.fecha, momento: a.momento,
            sesionId: a.sesionId, clase: a.clase, texto: textoSerie(a.clase, a.mejor),
          };
        }
      }
      if (!previa || supera) mejorPorClase.set(a.clase, a.mejor);
    }
  }
  return primero;
}

/* ═══════════════════════════════════════════════════════════════════════════
   🔓 FITNESS 5/8 — LOS MODOS DE PROGRESIÓN Y SUS PROPUESTAS
   (prompt 5, ARQUITECTURA_TECNICA.md §11)
   ═══════════════════════════════════════════════════════════════════════════

   Sobre el mismo motor (`serieLimpia`, `claseDe`, `seriesComparables`,
   `compararApariciones`): aquí se añade **un filtro por plantilla y por línea**
   y la regla que convierte la última ejecución en una propuesta. No hay un
   segundo motor ni una segunda fuente de verdad.

   🚨 Lo que dice el prompt, punto por punto:
   - **Tres modos**, globales (PD-13, propuesta aplicada): `fitness.preferencias
     .progresion` = `manual` (por defecto) · `progresivo` · `experto`.
   - **Manual no propone nada.** Ni una cifra, ni una flecha.
   - **Un interruptor por línea** (`config.progresion`). Sin guardar, activado
     (AJ-20). Apagado, esa línea no recibe propuestas.
   - **Se compara dentro de la misma plantilla** (`plantillaDeSesion`) **y la
     misma línea** (`linea.id`) **y el mismo ejercicio** (`exerciseId`: una
     línea sustituida durante una sesión es otro ejercicio). Push A y Push B no
     se mezclan aunque las dos tengan press de banca.
   - **Sesiones de antes** (sin `linea.id`): solo si es inequívoco — un único
     ejercicio con ese `exerciseId` en la sesión antigua y una única línea con
     él en la plantilla de ahora (§11.3). Si no, no se compara.
   - **La propuesta es una propuesta**: se guarda en `serie.plan.propuesta` al
     empezar y nunca toca `hecho`. Lo que él escribe manda.
   - **«Completar entrenamiento» no es referencia** (D-03): no tiene valores.

   ── LA REGLA DE CÁLCULO ─────────────────────────────────────────────────────
   Referencia = la última ejecución completada de esa línea en esa plantilla
   con al menos una serie hecha y con valores. Por serie se empareja por su
   número (las omitidas no cuentan, como en el historial).

   · Repeticiones, peso y repeticiones, peso añadido: el peso que se propone es
     **el de la referencia** (nunca se sube el peso por él: el incremento de los
     discos no se sabe, y sería un aumento arbitrario).
       – Progresivo: todas las series repiten lo que hizo, y **una sola** —la
         más baja; si empatan, la última— sube **1 repetición**. Solo si la
         referencia tiene **todas** las series que pide hoy (si no, mantener) y
         si la anterior a ella no fue mejor (si bajó, mantener).
       – Experto: **cada serie** sube **media repetición** sobre lo que hizo en
         esa misma serie. Una serie sin referencia no recibe propuesta.
       – Con un rango (8–12), nada pasa del máximo: al llegar, se mantiene y se
         dice («Has llegado al máximo del rango: tú decides si subir el peso»).
       – Si el peso que pide la plantilla hoy es otro que el de la referencia
         (él lo ha cambiado), no se propone: esas repeticiones eran con otra
         carga.
   · Tiempo (isométricos): **no hay una regla fiable** de cuántos segundos
     subir, así que se propone **mantener** lo de la última vez como
     referencia, sin flecha (prompt 5 §11: documentar la limitación).
   ═══════════════════════════════════════════════════════════════════════════ */

export const MODOS_PROGRESION = Object.freeze([
  Object.freeze({ id: 'manual', nombre: 'Manual', que: 'Tú decides todos los pesos y repeticiones. No se propone nada.' }),
  Object.freeze({ id: 'progresivo', nombre: 'Progresivo', que: 'Te propone una pequeña mejora cuando tiene sentido. Solo es una propuesta.' }),
  Object.freeze({ id: 'experto', nombre: 'Experto', que: 'Te propone un objetivo para cada serie, de media en media repetición.' }),
]);
export const MODO_PROGRESION_POR_DEFECTO = 'manual';

/** El modo guardado, o Manual. */
export function modoDeProgresion(fitness) {
  const m = fitness && fitness.preferencias && fitness.preferencias.progresion;
  /* Los ids viven en el modelo (`fitness.js`, su normalizador): aquí, sus nombres. */
  return MODOS_PROGRESION_IDS.includes(m) ? m : MODO_PROGRESION_POR_DEFECTO;
}

/** Cambia el modo. Devuelve el `fitness` entero (regla 5). */
export function cambiarModoProgresion(fitness, modo) {
  if (!MODOS_PROGRESION.some((x) => x.id === modo)) return fitness;
  const f = fitness || {};
  return { ...f, preferencias: { ...(f.preferencias || {}), progresion: modo } };
}

/** El interruptor de una línea de una plantilla o rutina (sin guardar: activado). */
export const progresionActivaEnLinea = (linea) => !(linea && linea.config && linea.config.progresion === false);

/** Pone el interruptor de una línea: lo guarda en su `config` (que se conserva
 *  entero al editar y al duplicar). */
export function conProgresionEnLinea(linea, activa) {
  if (!linea) return linea;
  return { ...linea, config: { ...(linea.config || {}), progresion: !!activa } };
}

/** El ejercicio de la sesión de una línea: ¿tenía la progresión puesta ese día? */
const lineaConProgresion = (e) => !(e && e.linea && e.linea.progresion === false);

/** La plantilla que se ejecutó en una sesión. Lo que escribe la Fase 4
 *  (`diaDePlan.plantillaId`) y, para lo de antes, la regla del §14.6. */
export function plantillaDeSesion(sesion, fitness = null) {
  const d = (sesion && sesion.diaDePlan) || {};
  if (texto(d.plantillaId)) return texto(d.plantillaId);
  const o = (sesion && sesion.origen) || {};
  const id = texto(o.id);
  if (!id) return null;
  if (o.tipo === 'plantilla') return id;
  if (o.tipo === 'plan' || o.tipo === 'preset') return idPlantillaDeDia(id);
  if (o.tipo === 'rutina') {
    for (const r of lista(fitness && fitness.rutinas)) {
      const dia = lista(r && r.dias).find((x) => x && x.id === id);
      if (dia) return texto(dia.plantillaId) || null;
    }
  }
  return null;
}

const momentoDe = (s) => s?.terminadaEn || s?.iniciadaEn || s?.guardadaEn || 0;

/** Las series hechas de un ejercicio de sesión, limpias y con su número. */
function seriesNumeradas(e) {
  let n = 0;
  const out = [];
  for (const s of lista(e && e.series)) {
    if (!s) continue;
    if (s.estado !== 'omitida') n += 1;
    if (s.estado === 'hecha') out.push({ ...serieLimpia(s), numero: n });
  }
  return out;
}

/** ¿Este ejercicio de una sesión antigua es, sin ninguna duda, esta línea? */
function correspondeA(e, ej, ejerciciosSesion, lineaActual) {
  if (!e || texto(e.exerciseId) !== texto(ej.exerciseId)) return false;
  const id = texto(lineaActual && lineaActual.id);
  const suya = texto(e.linea && e.linea.id);
  if (suya) return !!id && suya === id;
  /* Sin `linea.id` (antes de la Fase 5): solo si es inequívoco (§11.3). */
  const enLaVieja = lista(ejerciciosSesion).filter((x) => x && texto(x.exerciseId) === texto(ej.exerciseId)).length;
  return enLaVieja === 1 && !!(lineaActual && lineaActual.unica);
}

/**
 * Las ejecuciones anteriores de una línea en su plantilla, de la más reciente a
 * la más antigua. `ej` es el ejercicio de la sesión de hoy (con su `linea`);
 * `unica` dice si en la plantilla de hoy no hay otra línea con el mismo
 * ejercicio (lo necesita la compatibilidad).
 */
/** 🔓 Fitness 6/8 — la MISMA correspondencia para la progresión y para las
 *  anotaciones: las sesiones completadas de esa plantilla con un ejercicio que es,
 *  sin duda, esta línea (mismo `linea.id` y mismo `exerciseId`; sin id, solo si es
 *  inequívoco). De la más reciente a la más antigua. */
export function ejerciciosDeLineaEnSesiones(fitness, {
  plantillaId, ej, unica = true, antesDe = null, sinCompletar = true, hasta = null,
}) {
  if (!plantillaId || !ej) return [];
  const lineaActual = { id: texto(ej.linea && ej.linea.id), unica };
  const out = [];
  for (const s of lista(fitness && fitness.sesiones)) {
    if (!s || !s.id || s.estado !== 'completada' || s.id === antesDe) continue;
    if (sinCompletar && s.completadaCon === 'completar') continue;
    if (plantillaDeSesion(s, fitness) !== plantillaId) continue;
    /* `hasta` — solo lo que pasó ANTES de una sesión dada (el historial de esa fecha). */
    if (hasta && !((s.fecha || '') < hasta.fecha || ((s.fecha || '') === hasta.fecha && momentoDe(s) < hasta.momento))) continue;
    const ejs = ejerciciosDeSesion(s);
    const suyos = ejs.filter((e) => correspondeA(e, ej, ejs, lineaActual));
    /* Dos ejercicios de la misma sesión que encajan con una sola línea: ambiguo. */
    if (suyos.length !== 1) continue;
    out.push({ sesion: s, ejercicio: suyos[0], fecha: s.fecha, momento: momentoDe(s) });
  }
  return out.sort((a, b) => (a.fecha === b.fecha ? b.momento - a.momento : (a.fecha < b.fecha ? 1 : -1)));
}

/**
 * Las ejecuciones anteriores de una línea en su plantilla, de la más reciente a
 * la más antigua. `ej` es el ejercicio de la sesión de hoy (con su `linea`);
 * `unica` dice si en la plantilla de hoy no hay otra línea con el mismo
 * ejercicio (lo necesita la compatibilidad).
 */
export function ejecucionesDeLinea(fitness, { plantillaId, ej, unica = true, antesDe = null }) {
  const out = [];
  for (const { sesion: s, ejercicio: e } of ejerciciosDeLineaEnSesiones(fitness, { plantillaId, ej, unica, antesDe })) {
    const series = seriesNumeradas(e);
    const modo = e.modo === 'tiempo' ? 'tiempo' : 'reps';
    const clase = claseDe(modo, series, texto(e.linea && e.linea.tipoCarga));
    const utiles = seriesComparables(clase, series);
    if (!utiles.length) continue;
    out.push({
      sesionId: s.id, fecha: s.fecha, momento: momentoDe(s), exerciseId: texto(ej.exerciseId),
      clase, series: utiles, mejor: mejorSerie(clase, utiles), volumen: null,
    });
  }
  return out;
}

export const TEXTOS_PROGRESION = Object.freeze({
  sinDatos: 'Todavía no hay una vez anterior de este ejercicio en esta plantilla.',
  mantener: 'Repite lo de la última vez: hoy no hay una mejora razonable que proponer.',
  mantenerTiempo: 'Lo de la última vez, como referencia: en los ejercicios por tiempo no se propone subir.',
  alTope: 'Has llegado al máximo del rango: tú decides si subir el peso.',
  otroPeso: 'Hoy la plantilla pide otro peso que la última vez: no se compara.',
  incompleta: 'La última vez faltaron series: hoy se propone repetirla.',
  bajo: 'La última vez fue un poco menos que la anterior: hoy se propone repetirla.',
  sube: 'Una pequeña mejora sobre la última vez. Es solo una propuesta.',
  experto: 'Un objetivo para cada serie, sobre lo que hiciste en ella. Tú decides.',
  noPasaNada: 'No pasa nada. No todos los días se mejora. Lo importante es mantener la constancia.',
  conseguido: 'Has progresado',
});

const valorRef = (ref, numero) => lista(ref && ref.series).find((x) => x.numero === numero) || null;

/**
 * 🚨 La propuesta para UN ejercicio de una sesión que empieza. Devuelve
 * `{ modo, motivo, texto, referencia, porSerie }`, donde `porSerie` es un mapa
 * id de serie → `{ reps, peso, duracion, mejora }` o `null`. No escribe nada.
 */
export function propuestaParaEjercicio(fitness, sesion, ej, { modo = null, unica = true } = {}) {
  const m = modo || modoDeProgresion(fitness);
  const vacio = (motivo, extra = {}) => ({ modo: m, motivo, texto: TEXTOS_PROGRESION[motivo] || '', referencia: null, porSerie: {}, ...extra });
  if (m === 'manual') return vacio('manual');
  /* Un ejercicio sin línea (añadido durante la sesión) no tiene con qué compararse. */
  if (!ej || !texto(ej.linea && ej.linea.id)) return vacio('sin_linea');
  if (!lineaConProgresion(ej)) return vacio('desactivada');
  const plantillaId = plantillaDeSesion(sesion, fitness);
  const previas = ejecucionesDeLinea(fitness, { plantillaId, ej, unica, antesDe: sesion && sesion.id });
  const ref = previas[0] || null;
  if (!ref) return vacio('sinDatos');

  const planificadas = lista(ej.series).filter((s) => s && s.origen !== 'anadida' && s.estado !== 'omitida');
  const numeroDe = new Map();
  let n = 0;
  for (const s of lista(ej.series)) { if (s && s.estado !== 'omitida') { n += 1; numeroDe.set(s.id, n); } }
  const porSerie = {};
  const referencia = { fecha: ref.fecha, sesionId: ref.sesionId, clase: ref.clase, texto: textoSeries(ref.clase, ref.series) };

  if (ref.clase === 'tiempo') {
    for (const s of planificadas) {
      const r = valorRef(ref, numeroDe.get(s.id));
      porSerie[s.id] = r ? { reps: null, peso: null, duracion: r.duracion, mejora: false } : null;
    }
    return { modo: m, motivo: 'mantenerTiempo', texto: TEXTOS_PROGRESION.mantenerTiempo, referencia, porSerie };
  }

  const conPeso = ref.clase === 'carga' || ref.clase === 'lastre';
  const pesoPlan = ej.linea && Number.isFinite(Number(ej.linea.peso)) && ej.linea.peso !== null ? Number(ej.linea.peso) : null;
  if (conPeso && pesoPlan !== null && pesoPlan > 0
    && ref.series.some((r) => Math.abs(r.peso - pesoPlan) >= TOLERANCIA_PESO_KG)) {
    return vacio('otroPeso', { referencia });
  }
  const tope = ej.linea && Number(ej.linea.repsHasta) > 0 ? Number(ej.linea.repsHasta) : null;
  const base = (s) => {
    const r = valorRef(ref, numeroDe.get(s.id));
    return r ? { reps: r.reps, peso: conPeso ? r.peso : null, duracion: null } : null;
  };

  if (m === 'experto') {
    let sube = false;
    let alTope = false;
    for (const s of planificadas) {
      const b = base(s);
      if (!b) { porSerie[s.id] = null; continue; }
      const objetivo = tope !== null ? Math.min(tope, b.reps + 0.5) : b.reps + 0.5;
      const mejora = objetivo > b.reps;
      if (mejora) sube = true; else alTope = true;
      porSerie[s.id] = { ...b, reps: Math.max(b.reps, objetivo), mejora };
    }
    const motivo = sube ? 'experto' : (alTope ? 'alTope' : 'mantener');
    return { modo: m, motivo, texto: TEXTOS_PROGRESION[motivo], referencia, porSerie };
  }

  /* Progresivo. */
  const bases = planificadas.map((s) => ({ s, b: base(s) }));
  bases.forEach(({ s, b }) => { porSerie[s.id] = b ? { ...b, mejora: false } : null; });
  const completa = bases.length > 0 && bases.every((x) => x.b);
  if (!completa) return { modo: m, motivo: 'incompleta', texto: TEXTOS_PROGRESION.incompleta, referencia, porSerie };
  const anterior = previas.find((p, i) => i > 0 && p.clase === ref.clase) || null;
  if (anterior && compararApariciones(anterior, ref).estado === 'descenso') {
    return { modo: m, motivo: 'bajo', texto: TEXTOS_PROGRESION.bajo, referencia, porSerie };
  }
  /* La serie más baja (si empatan, la última) que todavía puede subir. */
  let elegida = null;
  for (const x of bases) {
    if (tope !== null && x.b.reps + 1 > tope) continue;
    if (!elegida || x.b.reps <= elegida.b.reps) elegida = x;
  }
  if (!elegida) return { modo: m, motivo: 'alTope', texto: TEXTOS_PROGRESION.alTope, referencia, porSerie };
  porSerie[elegida.s.id] = { ...elegida.b, reps: elegida.b.reps + 1, mejora: true };
  return { modo: m, motivo: 'sube', texto: TEXTOS_PROGRESION.sube, referencia, porSerie };
}

/**
 * 🚨 Al EMPEZAR: escribe en cada serie su `plan.propuesta` (solo ahí). Una
 * sesión de Manual, sin referencia o con la línea apagada sale igual que entra.
 * No toca `hecho`, ni el resto de `plan`, ni nada fuera de la sesión.
 */
export function conPropuestas(fitness, sesion, { modo = null } = {}) {
  if (!sesion || !sesion.origen) return sesion;
  const m = modo || modoDeProgresion(fitness);
  if (m === 'manual') return sesion;
  const ejs = ejerciciosDeSesion(sesion);
  const cuenta = new Map();
  ejs.forEach((e) => { if (e && e.linea) cuenta.set(texto(e.exerciseId), (cuenta.get(texto(e.exerciseId)) || 0) + 1); });
  let cambia = false;
  const ejercicios = ejs.map((e) => {
    const p = propuestaParaEjercicio(fitness, sesion, e, { modo: m, unica: cuenta.get(texto(e && e.exerciseId)) === 1 });
    if (!Object.keys(p.porSerie).length) return e;
    cambia = true;
    return {
      ...e,
      series: lista(e.series).map((s) => {
        const pr = p.porSerie[s.id];
        return pr ? { ...s, plan: { ...(s.plan || {}), propuesta: pr } } : s;
      }),
    };
  });
  return cambia ? { ...sesion, origen: { ...sesion.origen, ejercicios } } : sesion;
}

/**
 * Lo que dice cada serie de una sesión sobre su propuesta (prompt 5 §12): para
 * el historial y las estadísticas. Derivado: se lee de `plan.propuesta` y de
 * `hecho`, no se guarda nada. `estado`: `supera` · `igual` · `por_debajo` ·
 * `sin_hacer` · `sin_propuesta`.
 */
export function resultadoFrenteAPropuesta(serie) {
  const pr = serie && serie.plan && serie.plan.propuesta;
  if (!pr) return { estado: 'sin_propuesta', propuesta: null, hecho: null, diferencia: null };
  const h = serieLimpia(serie);
  const campo = pr.duracion !== null && pr.duracion !== undefined ? 'duracion' : 'reps';
  const objetivo = pr[campo];
  const hecho = h[campo];
  if (serie.estado !== 'hecha' || hecho === null || objetivo === null || objetivo === undefined) {
    return { estado: 'sin_hacer', propuesta: pr, hecho: hecho ?? null, diferencia: null, campo };
  }
  const d = Math.round((hecho - objetivo) * 2) / 2;
  return { estado: d > 0 ? 'supera' : d < 0 ? 'por_debajo' : 'igual', propuesta: pr, hecho, diferencia: d, campo };
}

/** El resumen de una sesión frente a sus propuestas: cuántas series llegaron. */
export function resumenFrenteAPropuestas(sesion) {
  const r = { conPropuesta: 0, supera: 0, igual: 0, por_debajo: 0, sin_hacer: 0 };
  for (const e of ejerciciosDeSesion(sesion)) {
    for (const s of lista(e && e.series)) {
      const x = resultadoFrenteAPropuesta(s);
      if (x.estado === 'sin_propuesta') continue;
      r.conPropuesta += 1;
      r[x.estado] += 1;
    }
  }
  return r;
}

export const DECISIONES_FASE5 = Object.freeze([
  Object.freeze({ id: 'PD-13', que: 'El modo es global (`preferencias.progresion`), y una plantilla duplicada empieza su propio historial (ids nuevos).', estado: 'propuesta aplicada' }),
  Object.freeze({ id: 'AJ-20', que: 'Una línea sin interruptor guardado tiene la progresión activada.', estado: 'ajuste sobre ARQUITECTURA §5.4 (decía `false`)' }),
  Object.freeze({ id: 'AJ-21', que: 'Por tiempo no se propone subir: se enseña lo de la última vez como referencia.', estado: 'limitación documentada (prompt 5 §11)' }),
  Object.freeze({ id: 'AJ-22', que: 'Nunca se propone subir el peso: se propone el de la última vez.', estado: 'decisión de cálculo' }),
]);

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LO QUE NO SE CONSTRUYE
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT11 = [
  { que: 'Gráficas, pantalla de récords, rankings y rangos', porque: 'Apartado 41. Aquí está la lógica que usarán: `aparicionesDeEjercicio`, `mejorHistorico` y `progresoDeEjercicio`.' },
  { que: 'Estimación de 1RM', porque: 'Apartado 41, y el 14: nada de fórmulas que conviertan repeticiones en kilos.' },
  { que: '«Última vez» durante el entrenamiento en vivo', porque: 'Apartado 35: solo se prepara. `ultimaVez()` ya lo devuelve. 🔓 La FIT F38 lo enseña, con esta misma función (`ultimaVezEnVivo`).' },
  { que: 'Distinguir dos máquinas distintas del mismo ejercicio', porque: 'Apartado 19. El catálogo separa barra, mancuernas, polea o máquina en ejercicios distintos, y eso sí se respeta; pero dos máquinas de dos gimnasios con el mismo id no se pueden distinguir, porque la sesión no guarda cuál era. Se dice en vez de fingirlo.' },
  { que: 'Porcentajes en primer plano', porque: 'Apartado 24: son secundarios, y solo existen cuando hay denominador.' },
];
