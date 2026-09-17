import { ejerciciosDeSesion } from './entrenamiento';
import { ejercicioPorId } from './ejercicios';

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

export function serieLimpia(serie) {
  const h = serie?.hecho || {};
  const peso = noNegativo(h.peso);
  return {
    /* Un peso de 0 no es carga: es que no hay peso externo. */
    peso: peso !== null && peso > 0 ? peso : null,
    reps: enteroPositivo(h.reps),
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
      nombre: ej ? ej.nombre : exerciseId,
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
    });
  }
  return salida;
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
    for (const a of aparicionesDeSesion(s, propios)) {
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

const decimal = (n) => {
  const r = Math.round(n * 100) / 100;
  return String(r).replace('.', ',');
};
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
  if (clase === 'repeticiones') return `${s.reps} ${s.reps === 1 ? 'rep' : 'reps'}`;
  return `${clase === 'lastre' ? '+' : ''}${decimal(s.peso)} kg × ${s.reps}`;
}

/** *"10 · 9 · 8"* (apartado 6). */
export function textoSeries(clase, series) {
  return lista(series).map((s) => {
    if (clase === 'tiempo') return `${s.duracion} s`;
    if (clase === 'repeticiones') return `${s.reps}`;
    return `${decimal(s.peso)}×${s.reps}`;
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
    nombre: ultima ? ultima.nombre : (ejercicioPorId(texto(exerciseId), propios)?.nombre || texto(exerciseId)),
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

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LO QUE NO SE CONSTRUYE
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT11 = [
  { que: 'Gráficas, pantalla de récords, rankings y rangos', porque: 'Apartado 41. Aquí está la lógica que usarán: `aparicionesDeEjercicio`, `mejorHistorico` y `progresoDeEjercicio`.' },
  { que: 'Estimación de 1RM', porque: 'Apartado 41, y el 14: nada de fórmulas que conviertan repeticiones en kilos.' },
  { que: '«Última vez» durante el entrenamiento en vivo', porque: 'Apartado 35: solo se prepara. `ultimaVez()` ya lo devuelve.' },
  { que: 'Distinguir dos máquinas distintas del mismo ejercicio', porque: 'Apartado 19. El catálogo separa barra, mancuernas, polea o máquina en ejercicios distintos, y eso sí se respeta; pero dos máquinas de dos gimnasios con el mismo id no se pueden distinguir, porque la sesión no guarda cuál era. Se dice en vez de fingirlo.' },
  { que: 'Porcentajes en primer plano', porque: 'Apartado 24: son secundarios, y solo existen cuando hay denominador.' },
];
