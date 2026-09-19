/* ===========================================================================
   ENTREGA 4 · FASE 24/45 — PRIORIZACIÓN INTELIGENTE DE CLASIFICACIÓN

   🚨 **ESTO NO ES IA, Y EL ENUNCIADO LO DICE DOS VECES** (contexto y apartado
   35). Es una priorización **determinista** sobre los datos que ya existen: el
   catálogo de la F2, las sesiones de la F8 y las clasificaciones de la F17.
   Cada número sale de una constante declarada en `PESOS`, y cada ejercicio de
   la cola puede explicar por qué está ahí (apartados 16 y 36).

   🚨 **LA F17 DECIDE CÓMO SE PREGUNTA; ESTA FASE, SOLO A QUIÉN** (apartado 8,
   literal: *"No crear otro sistema de preguntas"*). Aquí no hay ni una opción,
   ni una puntuación de respuesta, ni un guardado: eso sigue siendo
   `clasificacion.js`, y hay una comprobación que lee este archivo para
   asegurarse de que no escribe nada.

   ⚠️ **LA COLA NO SE GUARDA** (apartados 21 y 32, literal: *"No guardar una
   cola rígida"*). Se calcula al leer, así que clasificar un ejercicio la
   recalcula sola — igual que los rangos de la F15 y el historial de la F22. Un
   orden guardado tendría que limpiarse a mano cada vez que él entrena.
   =========================================================================== */

import { GRUPOS_MUSCULARES, TODOS_LOS_SUBGRUPOS, grupoMuscular, subgrupoMuscular } from './fitness.js';
import { todosLosEjercicios, ejercicioPorId } from './ejercicios.js';
import { repartoMuscular } from './progresoMuscular.js';
import { aparicionesDeEjercicio } from './progresion.js';
/* 🚨 Los umbrales NO son nuevos: son los de la F19, los mismos que deciden qué
   fuente manda en un rango. Escribir aquí un «3» a mano habría sido un segundo
   criterio de *"datos suficientes"*, y el día que uno cambiara, la cola y el
   rango dirían cosas distintas sobre el mismo ejercicio. */
import { UMBRALES_FUENTE } from './motorRangos.js';
import { claseDePregunta, clasificacionDe, relevanciaDeEjercicio } from './clasificacion.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · EN QUÉ ESTADO ESTÁN SUS DATOS (apartados 6 y 7)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 Los tres estados del apartado 6 y del 7, **y el umbral es el de la F19**.
 *
 * - `datos_suficientes` (≥ 3 sesiones): *"NO debe aparecer como prioridad"*. La
 *   fuente real manda, y preguntarle por unas dominadas que lleva diez sesiones
 *   haciendo sería pedirle que estime algo que el sistema ya sabe mejor que él.
 * - `datos_parciales` (1 o 2): *"puede aparecer como clasificación secundaria"*,
 *   con la frase «Datos limitados» y **sin obligar** (apartado 7).
 * - `sin_datos`: la cola de verdad.
 */
export const ESTADOS_DATO = [
  { id: 'sin_datos', nombre: 'Sin datos', que: 'Todavía no lo has entrenado.' },
  { id: 'datos_parciales', nombre: 'Datos limitados', que: 'Lo has entrenado poco: tu estimación todavía aporta.' },
  { id: 'datos_suficientes', nombre: 'Datos reales', que: 'Tus entrenamientos ya hablan por ti.' },
];
export const estadoDato = (id) => ESTADOS_DATO.find((e) => e.id === id) || null;

/** Cuántas sesiones comparables tiene ese ejercicio, y en qué estado lo dejan. */
export function estadoDeDato(fitness, exerciseId, { propios = [] } = {}) {
  const sesiones = aparicionesDeEjercicio(fitness || {}, texto(exerciseId), lista(propios)).length;
  const id = sesiones >= UMBRALES_FUENTE.entrenamiento
    ? 'datos_suficientes'
    : (sesiones >= UMBRALES_FUENTE.combinado ? 'datos_parciales' : 'sin_datos');
  return { exerciseId: texto(exerciseId), sesiones, ...estadoDato(id) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · COBERTURA MUSCULAR (apartados 9 y 10)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ⚠️ **Un grupo está cubierto por lo que el sistema SABE de él**, venga de una
 * clasificación o de entrenamientos de verdad. Contar solo las clasificaciones
 * habría dicho que el pecho está a 0 con veinte sesiones de press detrás, y le
 * habría pedido clasificar justo lo que ya tiene medido.
 *
 * El `Cuello = 0/3` del apartado 9 es esto: de los ejercicios de cuello que hay
 * en el catálogo, cuántos aportan ya información.
 */
export function coberturaDeClasificacion(fitness, { propios = [] } = {}) {
  const catalogo = todosLosEjercicios(lista(propios)).filter((ej) => claseDePregunta(ej));
  /* ⚠️ **El reparto de cada ejercicio se calcula UNA vez** (EH F44). Preguntarle
     a cada grupo y a cada subgrupo por separado —siete más dieciséis pasadas
     sobre el catálogo entero— eran más de dos mil llamadas a `repartoMuscular`
     para pintar una sola pantalla, y esta función la llama cada ejercicio. */
  const fichas = catalogo.map((ej) => {
    const reparto = repartoMuscular(ej);
    return {
      grupos: new Set(reparto.map((m) => m.grupoId)),
      subgrupos: new Set(reparto.map((m) => m.subgrupoId)),
      sabido: estadoDeDato(fitness, ej.id, { propios }).sesiones > 0 || !!clasificacionDe(fitness, ej.id),
    };
  });

  const cuenta = (toca) => {
    let totalN = 0;
    let con = 0;
    for (const f of fichas) {
      if (!toca(f)) continue;
      totalN += 1;
      if (f.sabido) con += 1;
    }
    return {
      total: totalN,
      con,
      /* ⚠️ Sin ni un ejercicio en el catálogo la fracción es `null`, **no 1 ni
         0**: no es que esté cubierto ni descubierto, es que no hay nada que
         cubrir. Un 0 dispararía la prioridad de un grupo vacío para siempre. */
      fraccion: totalN ? con / totalN : null,
    };
  };

  const grupos = GRUPOS_MUSCULARES.map((g) => ({
    grupoId: g.id, nombre: g.nombre, ...cuenta((f) => f.grupos.has(g.id)),
  }));
  const subgrupos = TODOS_LOS_SUBGRUPOS.map((s) => ({
    subgrupoId: s.id, nombre: s.nombre, grupoId: s.grupoId, ...cuenta((f) => f.subgrupos.has(s.id)),
  }));

  const conDatos = grupos.filter((g) => g.con > 0).length;
  return {
    grupos,
    subgrupos,
    gruposConDatos: conDatos,
    gruposTotales: GRUPOS_MUSCULARES.length,
    /* La cobertura global, para el aviso del apartado 29. */
    fraccion: GRUPOS_MUSCULARES.length ? conDatos / GRUPOS_MUSCULARES.length : null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · EQUIVALENTES: REPRESENTATIVIDAD Y REDUNDANCIA (apartados 11 y 12)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 **Los equivalentes salen del catálogo, no de parecerse de nombre.** El
 * ejemplo del apartado 11 —pull-up, chin-up, neutral pull-up— son `variantes` y
 * `sustitutos` de la F2, dos campos que ya existen y que una auditoría de
 * aquella fase valida como ids. Agruparlos por texto sería *"vincular dos cosas
 * por el título"*, que es justo lo que prohíbe la E3 F12.
 *
 * ⚠️ Y la relación se lee **en los dos sentidos**: si A declara a B como
 * sustituto, B es equivalente de A aunque su ficha no lo diga.
 */
export function mapaDeEquivalentes({ propios = [] } = {}) {
  const catalogo = todosLosEjercicios(lista(propios));
  const mapa = new Map(catalogo.map((e) => [e.id, new Set()]));
  for (const ej of catalogo) {
    for (const otro of [...lista(ej.sustitutos), ...lista(ej.variantes)].map(texto)) {
      /* Un id que ya no está en el catálogo se descarta: apuntar a algo que no
         existe sería el equivalente fantasma de EH F24. */
      if (!otro || otro === ej.id || !mapa.has(otro)) continue;
      mapa.get(ej.id).add(otro);
      mapa.get(otro).add(ej.id);
    }
  }
  return new Map([...mapa].map(([k, v]) => [k, [...v].sort()]));
}

export function equivalentesDe(exerciseId, { propios = [], mapa = null } = {}) {
  const m = mapa || mapaDeEquivalentes({ propios });
  return m.get(texto(exerciseId)) || [];
}

/**
 * De un conjunto de equivalentes, cuál se pregunta primero (apartado 11:
 * *"Elegir primero el ejercicio más representativo"*). El más representativo es
 * el que más información muscular aporta — la relevancia de la F17, que ya
 * pondera el reparto, si es compuesto y la dificultad. **No se escribe una
 * segunda fórmula**: se importa la suya.
 */
export function masRepresentativo(ids, { propios = [], mapa = null } = {}) {
  const fichas = lista(ids).map((x) => ejercicioPorId(texto(x), lista(propios))).filter(Boolean);
  if (!fichas.length) return null;
  const m = mapa || mapaDeEquivalentes({ propios });
  const grado = (id) => (m.get(id) || []).length;
  /* 🐛 **EL EJEMPLO DEL PROPIO ENUNCIADO EMPATABA.** Las tres dominadas del
     apartado 11 —prona, supina y neutra— tienen **los mismos cinco subgrupos,
     la misma dificultad y las dos son compuestas**, así que la relevancia y la
     riqueza las dejan exactamente iguales y el desempate por id habría elegido
     la **neutra**, que no es la representativa de nada.
     Lo que sí las distingue está en el catálogo: **a cuántos ejercicios está
     conectada**. La prona tiene grado 9 —supina, neutra, lastrada, jalón, remo
     invertido, remo en anillas…— frente a 5, 2 y 2: es el movimiento al que
     sustituyen los demás, o sea el de referencia. Eso es representatividad
     medida, no un orden alfabético. */
  return fichas.slice().sort((a, b) =>
    ((relevanciaDeEjercicio(b) * factorRiqueza(b)) - (relevanciaDeEjercicio(a) * factorRiqueza(a)))
    || (grado(b.id) - grado(a.id))
    /* Y por id al final: sin él, dos pasadas podían elegir uno distinto. */
    || a.id.localeCompare(b.id))[0].id;
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LA PRIORIDAD (apartados 5, 12, 13, 14 y 16)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 **Todos los números de la fase, en un sitio.** El apartado 36 exige que las
 * decisiones sean *"deterministas, explicables"*: con los factores repartidos
 * por el código nadie podría decir por qué un ejercicio va antes que otro, y
 * hay una comprobación que busca multiplicadores sueltos fuera de aquí.
 */
export const PESOS = {
  /* Apartado 6 — con datos de sobra ni se puntúa: sale de la cola. */
  datos: { sin_datos: 1, datos_parciales: 0.35, datos_suficientes: 0 },
  /* Apartado 5.2 — «clasificación inexistente» va antes que una ya hecha. */
  yaClasificado: 0.25,
  /* Apartados 9 y 10 — cuanto menos cubierto, más prioridad. Lo que multiplica
     es lo que FALTA: un grupo al 0 % se lleva el factor entero. */
  cobertura: { grupo: 1.5, subgrupo: 0.8 },
  /* Apartado 14 — qué tipos se prefieren. Lo que no está aquí vale 1.
     🚨 **Y NO hay factor de movilidad, aunque el apartado lo nombre**: la F17
     ya devuelve `null` en `claseDePregunta` para todo lo que sea movilidad
     —*"«cuánta movilidad tienes» no tiene referencia razonable"*—, así que un
     face-pull no es que baje de prioridad: **no entra en la cola**. Un peso
     que no se puede aplicar nunca es un control decorativo (regla 8). */
  tipo: { habilidadSinProgresiones: 0.5, fuerzaOHipertrofia: 1.15 },
  /* Apartado 12 — *"Simplemente bajar prioridad"*, nunca sacarlo del catálogo. */
  redundancia: 0.45,
  /* 🐛 **Apartado 2, *"tengan relación muscular clara"*, y aquí hay un hallazgo
     real de la F17**: su `relevancia` dice sumar *"lo que implica del catálogo"*
     para medir cuánta información muscular aporta… pero `repartoMuscular`
     **normaliza los pesos a 1**, así que esa suma vale exactamente 1 para todos
     los ejercicios y el término no distingue nada: lo único que acaba pesando
     es si es compuesto y su dificultad. No se toca allí —cambiarlo movería el
     orden del cuestionario de la F17 y sus comprobaciones—, así que **la
     riqueza la aporta esta fase**, contando cuántos subgrupos toca de verdad. */
  riqueza: { porSubgrupo: 0.15, tope: 3 },
  /* Apartado 11 — el representativo del conjunto, primero. */
  representativo: { si: 1.15, no: 0.85 },
};

/**
 * Las razones del apartado 16, **con su orden de precedencia**. La que se
 * enseña es la primera que se cumple: un ejercicio puede estar en la cola por
 * cuatro motivos a la vez y enseñar los cuatro no explica nada.
 *
 * ⚠️ *"No mostrar necesariamente el score técnico al usuario"* (apartado 16):
 * `priorityScore` viaja en el dato porque la cola lo necesita para ordenar, y
 * **ninguna pantalla lo pinta**. Hay una comprobación que barre los textos.
 */
export const MOTIVOS = [
  { id: 'cobertura_grupo', texto: (d) => `Mejora tu cobertura de ${d.grupo}` },
  { id: 'subgrupo_sin_datos', texto: (d) => `Subgrupo sin datos: ${d.subgrupo}` },
  { id: 'datos_insuficientes', texto: () => 'Datos insuficientes' },
  { id: 'representativo', texto: () => 'Ejercicio representativo' },
  { id: 'sin_clasificacion', texto: () => 'Sin clasificación' },
];
export const motivoCola = (id) => MOTIVOS.find((m) => m.id === id) || null;

/** Cuántos subgrupos distintos toca de verdad, y el factor que sale de ahí.
 *  🚨 Una sola definición: la usan el `priorityScore` y la representatividad.
 *  Con dos, acabarían ordenando distinto la misma lista. */
export const subgruposDe = (ej) => new Set(repartoMuscular(ej).map((m) => m.subgrupoId)).size;
export const factorRiqueza = (ej) =>
  1 + PESOS.riqueza.porSubgrupo * Math.min(Math.max(subgruposDe(ej) - 1, 0), PESOS.riqueza.tope);

const tipoFactor = (ej) => {
  const tipos = lista(ej.tipos);
  /* ⚠️ Apartados 13 y 14 leídos juntos: el 13 quiere fuera los *"ejercicios
     puramente técnicos"* y el 14 **prefiere** las *"skills con progresiones
     definidas"*. No se contradicen: lo que las separa es si el catálogo les ha
     escrito una progresión. La que la tiene se puede preguntar; la que no, es
     la habilidad ambigua del 13. */
  if (tipos.includes('habilidad') && !lista(ej.progresiones).length) {
    return PESOS.tipo.habilidadSinProgresiones;
  }
  if (tipos.includes('fuerza') || tipos.includes('hipertrofia')) return PESOS.tipo.fuerzaOHipertrofia;
  return 1;
};

/** El grupo que más peso se lleva, que es con el que se presenta la tarjeta. */
export function grupoPrincipalDe(ej) {
  const mejor = repartoMuscular(ej).reduce((x, y) => (!x || y.peso > x.peso ? y : x), null);
  return mejor ? mejor.grupoId : null;
}

/**
 * La prioridad de UN ejercicio, con su razón. Es el corazón de la fase y es
 * todo multiplicativo a propósito: así cada factor se puede explicar por
 * separado y la cobertura del apartado 13 puede levantar un ejercicio difícil
 * *"si es importante para la cobertura del usuario"* sin un caso especial.
 */
export function prioridadDeEjercicio(fitness, exerciseId, { propios = [], cobertura = null, equivalencias = null } = {}) {
  const ej = ejercicioPorId(texto(exerciseId), lista(propios));
  if (!ej || !claseDePregunta(ej)) return null;

  /* ⚠️ La cobertura y el mapa de equivalentes se calculan **una vez por cola**
     y se pasan: recalcularlos por ejercicio es recorrer el catálogo entero cien
     veces (apartado 32, *"No calcular prioridades completas en cada render"*). */
  const cob = cobertura || coberturaDeClasificacion(fitness, { propios });
  const mapaEq = equivalencias || mapaDeEquivalentes({ propios });
  const dato = estadoDeDato(fitness, ej.id, { propios });
  const estimacion = clasificacionDe(fitness, ej.id);
  const reparto = repartoMuscular(ej);

  const fDatos = PESOS.datos[dato.id] ?? 1;
  const fClas = estimacion ? PESOS.yaClasificado : 1;

  /* Cobertura: se mira la del grupo y la del subgrupo que más pesan de este
     ejercicio. ⚠️ Una fracción `null` (grupo sin ejercicios) no aporta nada. */
  const grupoId = grupoPrincipalDe(ej);
  const filaGrupo = cob.grupos.find((g) => g.grupoId === grupoId) || null;
  const subMejor = reparto.reduce((x, y) => (!x || y.peso > x.peso ? y : x), null);
  const filaSub = subMejor ? cob.subgrupos.find((s) => s.subgrupoId === subMejor.subgrupoId) : null;
  const faltaGrupo = filaGrupo && filaGrupo.fraccion !== null ? 1 - filaGrupo.fraccion : 0;
  const faltaSub = filaSub && filaSub.fraccion !== null ? 1 - filaSub.fraccion : 0;
  const fCobertura = (1 + PESOS.cobertura.grupo * faltaGrupo) * (1 + PESOS.cobertura.subgrupo * faltaSub);

  /* Equivalentes: redundancia si alguno ya aporta, y representatividad dentro
     del conjunto. Con un solo ejercicio en el conjunto, ninguno de los dos
     factores se aplica — no hay de qué ser representativo. */
  const equis = equivalentesDe(ej.id, { propios, mapa: mapaEq });
  const conjunto = [ej.id, ...equis];
  const algunoSabido = equis.some((id) =>
    estadoDeDato(fitness, id, { propios }).sesiones > 0 || clasificacionDe(fitness, id));
  const fRedundancia = algunoSabido ? PESOS.redundancia : 1;
  const esRepresentativo = equis.length
    ? masRepresentativo(conjunto, { propios, mapa: mapaEq }) === ej.id
    : null;
  const fRepresentativo = esRepresentativo === null
    ? 1
    : (esRepresentativo ? PESOS.representativo.si : PESOS.representativo.no);

  const fRiqueza = factorRiqueza(ej);

  const score = relevanciaDeEjercicio(ej) * fRiqueza * fDatos * fClas * fCobertura * tipoFactor(ej)
    * fRedundancia * fRepresentativo;

  /* La razón, por precedencia (apartado 16). */
  let motivoId = 'sin_clasificacion';
  let datos = {};
  if (filaGrupo && filaGrupo.con === 0 && filaGrupo.total > 0) {
    motivoId = 'cobertura_grupo';
    datos = { grupo: filaGrupo.nombre.toLowerCase() };
  } else if (filaSub && filaSub.con === 0 && filaSub.total > 0) {
    motivoId = 'subgrupo_sin_datos';
    datos = { subgrupo: filaSub.nombre };
  } else if (dato.id === 'datos_parciales') {
    motivoId = 'datos_insuficientes';
  } else if (esRepresentativo === true) {
    motivoId = 'representativo';
  }

  return {
    exerciseId: ej.id,
    nombre: ej.nombre,
    priorityScore: Math.round(score * 1000) / 1000,
    motivo: motivoId,
    reason: motivoCola(motivoId).texto(datos),
    /* Lo que pide el apartado 4, con los nombres ya resueltos para la tarjeta. */
    muscleGroups: [...new Set(reparto.map((m) => m.grupoId))]
      .map((id) => (grupoMuscular(id) || {}).nombre).filter(Boolean),
    subgroup: subMejor ? (subgrupoMuscular(subMejor.subgrupoId) || {}).nombre || null : null,
    grupoPrincipal: grupoId,
    currentDataState: dato.id,
    sesiones: dato.sesiones,
    currentClassification: estimacion || null,
    estimatedImpact: impactoEstimado(cob, ej, { propios }),
    /* Para la auditoría y las pruebas: los factores, no un número opaco. */
    factores: {
      relevancia: relevanciaDeEjercicio(ej),
      riqueza: fRiqueza,
      datos: fDatos,
      clasificacion: fClas,
      cobertura: fCobertura,
      tipo: tipoFactor(ej),
      redundancia: fRedundancia,
      representativo: fRepresentativo,
    },
  };
}

/**
 * `estimatedImpact` (apartado 4) medido **en cobertura**, nunca en puntos de
 * rango. 🚨 Es la lección de la F23, apartados 12 y 13: un score combina varias
 * métricas, así que *"clasificarlo te subirá 40 puntos"* se inventaría una
 * precisión que el dato no tiene. Lo que sí se puede afirmar es cuántos
 * subgrupos pasarían de no tener nada a tener algo.
 */
export function impactoEstimado(cobertura, ej, { propios = [] } = {}) {
  void propios;
  const reparto = repartoMuscular(ej);
  const nuevos = reparto.filter((m) => {
    const fila = cobertura.subgrupos.find((s) => s.subgrupoId === m.subgrupoId);
    return fila && fila.con === 0 && fila.total > 0;
  });
  const gruposNuevos = [...new Set(reparto.map((m) => m.grupoId))].filter((g) => {
    const fila = cobertura.grupos.find((x) => x.grupoId === g);
    return fila && fila.con === 0 && fila.total > 0;
  });
  return {
    subgruposNuevos: nuevos.length,
    gruposNuevos: gruposNuevos.length,
    texto: nuevos.length
      ? `Daría información nueva sobre ${nuevos.length} ${nuevos.length === 1 ? 'subgrupo' : 'subgrupos'}`
      : 'Afinaría lo que ya se sabe de estos músculos',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LA COLA (apartados 3, 4, 15 y 21)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 3 — *"Te recomendamos empezar con 8 ejercicios"*, no 87. */
export const RECOMENDADOS = 8;
/** Apartado 15 — *"evitar 10 ejercicios consecutivos de espalda"*. */
export const MAX_SEGUIDOS = 2;

/**
 * Apartado 15. Reordena lo justo: recorre la lista ya puntuada y, si el
 * siguiente repetiría grupo más de `MAX_SEGUIDOS` veces seguidas, adelanta al
 * primero de otro grupo. **Si no hay ninguno, entra igual**: dejar fuera un
 * ejercicio prioritario por estética sería esconder información.
 */
export function equilibrar(items, { maximo = MAX_SEGUIDOS } = {}) {
  const pendientes = lista(items).slice();
  const salida = [];
  let ultimo = null;
  let seguidos = 0;
  while (pendientes.length) {
    let i = 0;
    if (ultimo !== null && seguidos >= maximo) {
      const otro = pendientes.findIndex((x) => x.grupoPrincipal !== ultimo);
      if (otro !== -1) i = otro;
    }
    const elegido = pendientes.splice(i, 1)[0];
    if (elegido.grupoPrincipal === ultimo) seguidos += 1;
    else { ultimo = elegido.grupoPrincipal; seguidos = 1; }
    salida.push(elegido);
  }
  return salida;
}

/**
 * `getClassificationQueue()` (apartado 4). La cola priorizada, equilibrada y
 * recortada.
 *
 * 🚨 **Fuera los de datos suficientes** (apartado 6) y fuera los que el
 * catálogo no sabe preguntar. Los **saltados** (apartado 24) tampoco salen:
 * son de la sesión, no un dato guardado — pulsar «No sé» deja el ejercicio
 * pendiente, no le asigna un nivel.
 */
export function colaDeClasificacion(fitness, { propios = [], limite = RECOMENDADOS, saltados = [] } = {}) {
  const fuera = new Set(lista(saltados).map(texto).filter(Boolean));
  const cobertura = coberturaDeClasificacion(fitness, { propios });
  const equivalencias = mapaDeEquivalentes({ propios });
  const items = todosLosEjercicios(lista(propios))
    .filter((ej) => claseDePregunta(ej))
    .filter((ej) => !fuera.has(ej.id))
    .map((ej) => prioridadDeEjercicio(fitness, ej.id, { propios, cobertura, equivalencias }))
    .filter((x) => x && x.priorityScore > 0)
    .sort((a, b) => (b.priorityScore - a.priorityScore) || a.exerciseId.localeCompare(b.exerciseId));

  const primarios = items.filter((x) => x.currentDataState === 'sin_datos' && !x.currentClassification);
  /* Apartado 7 — los de datos parciales y los ya clasificados existen, pero
     **detrás**: son secundarios, y el apartado dice *"No obligar"*. */
  const secundarios = items.filter((x) => !primarios.includes(x));

  return {
    cola: equilibrar(primarios).slice(0, Math.max(0, limite)),
    secundarios,
    /* Todo lo puntuado, para el contador secundario del apartado 18. */
    todos: items,
    cobertura,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LA PANTALLA (apartados 17, 18, 19, 28 y 29)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 29 — por debajo de esto, el aviso de que puede mejorar sus rangos. */
export const COBERTURA_BAJA = 0.6;

export const VACIOS_COLA = {
  completa: {
    titulo: 'Tu clasificación inicial está completa.',
    que: 'Los nuevos ejercicios se añadirán cuando sea necesario.',
  },
  /* ⚠️ No es lo mismo no tener nada que clasificar que haberlo saltado todo. */
  todo_saltado: {
    titulo: 'Has saltado todos los ejercicios recomendados.',
    que: 'Siguen pendientes: puedes volver a ellos cuando quieras.',
  },
  sin_catalogo: {
    titulo: 'Todavía no hay ejercicios que clasificar.',
    que: 'Aparecerán en cuanto el catálogo tenga ejercicios que se puedan estimar.',
  },
};

export const AVISO_COBERTURA_BAJA = 'Puedes mejorar la calidad de tus Rangos clasificando algunos ejercicios más.';

/**
 * Todo lo que necesita el hub, ya redactado. 🚨 **La pantalla no calcula**, que
 * es la regla que dejó la F16 para Rangos: aquí se resuelve, y
 * `ClassificationHub` dibuja.
 */
export function pantallaDeClasificacion(fitness, { propios = [], limite = RECOMENDADOS, saltados = [] } = {}) {
  const q = colaDeClasificacion(fitness, { propios, limite, saltados });
  const hayCatalogo = todosLosEjercicios(lista(propios)).some((ej) => claseDePregunta(ej));
  const sinClasificar = q.todos.filter((x) => !x.currentClassification && x.currentDataState !== 'datos_suficientes').length;
  const hechos = lista(fitness?.clasificaciones).filter(Boolean).length;

  let vacio = null;
  if (!hayCatalogo) vacio = { id: 'sin_catalogo', ...VACIOS_COLA.sin_catalogo };
  else if (!q.cola.length) {
    vacio = lista(saltados).length
      ? { id: 'todo_saltado', ...VACIOS_COLA.todo_saltado }
      : { id: 'completa', ...VACIOS_COLA.completa };
  }

  return {
    cola: q.cola,
    secundarios: q.secundarios,
    cobertura: q.cobertura,
    vacio,
    /* Apartado 17 — la frase de la cabecera. */
    titulo: 'Te recomendamos empezar por estos ejercicios.',
    /* 🚨 Apartado 18 — el contador **es el de recomendados**, y el de «sin
       clasificación» va detrás y en pequeño: *"no debe dominar la interfaz"*.
       Decir «87 restantes» sería contar una lista que el sistema no espera que
       conteste. */
    contador: q.cola.length
      ? `${q.cola.length} ${q.cola.length === 1 ? 'ejercicio recomendado' : 'ejercicios recomendados'}`
      : null,
    contadorSecundario: sinClasificar
      ? `${sinClasificar} sin clasificación`
      : null,
    /* Apartado 19 — «3 / 8 recomendados». ⚠️ Es progreso de la clasificación,
       jamás XP ni un nivel (apartado 35 y D2-02). */
    progreso: q.cola.length || hechos
      ? { hechos, total: hechos + q.cola.length, texto: `${hechos} / ${hechos + q.cola.length} recomendados` }
      : null,
    /* Apartado 29 — solo si de verdad está baja. */
    avisoCobertura: q.cobertura.fraccion !== null && q.cobertura.fraccion < COBERTURA_BAJA
      ? AVISO_COBERTURA_BAJA
      : null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · RECLASIFICAR (apartados 23 y 26)
   ═══════════════════════════════════════════════════════════════════════════ */

export const AVISO_DATOS_MANDAN = 'Tus entrenamientos reales tienen prioridad sobre esta clasificación.';

/**
 * Apartado 23 — se **puede** reclasificar siempre; lo que cambia es que, con
 * datos reales suficientes, se le avisa de que esa estimación ya no es lo que
 * manda. ⚠️ Y no se le impide (apartado 23: *"debe poder hacerlo"*): el aviso
 * informa, no bloquea, que es la diferencia entre avisar e imponer (EH F36).
 */
export function avisoDeReclasificar(fitness, exerciseId, { propios = [] } = {}) {
  const dato = estadoDeDato(fitness, exerciseId, { propios });
  return {
    puede: true,
    sesiones: dato.sesiones,
    aviso: dato.id === 'datos_suficientes' ? AVISO_DATOS_MANDAN : null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · AUDITORÍA (y una que SÍ se puede poner roja)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ⚠️ Recibe la cola ya calculada a propósito (EH F42): así una prueba puede
 * darle una fabricada y ver las casillas ponerse rojas. Una auditoría que solo
 * se llama a sí misma no puede fallar, y entonces no sirve.
 */
export function casillasDeCola(pantalla, { limite = RECOMENDADOS } = {}) {
  const cola = lista(pantalla && pantalla.cola);
  const seguidosMax = cola.reduce((acc, x, i) => {
    if (i && x.grupoPrincipal === cola[i - 1].grupoPrincipal) return { n: acc.n + 1, max: Math.max(acc.max, acc.n + 1) };
    return { n: 1, max: Math.max(acc.max, 1) };
  }, { n: 0, max: 0 }).max;
  return [
    { id: 'acotada', ok: cola.length <= limite, que: `La cola no pide más de ${limite} ejercicios` },
    { id: 'sin_datos_reales', ok: cola.every((x) => x.currentDataState !== 'datos_suficientes'), que: 'Ningún ejercicio con datos suficientes está en la cola' },
    { id: 'sin_clasificados', ok: cola.every((x) => !x.currentClassification), que: 'Ningún ejercicio ya clasificado está en la cola' },
    { id: 'con_razon', ok: cola.every((x) => typeof x.reason === 'string' && x.reason.length > 0), que: 'Cada ejercicio explica por qué está' },
    { id: 'ordenada', ok: cola.every((x, i) => !i || x.priorityScore <= cola[i - 1].priorityScore || cola[i].grupoPrincipal !== cola[i - 1].grupoPrincipal), que: 'El orden respeta la prioridad salvo por el equilibrio' },
    { id: 'equilibrada', ok: seguidosMax <= MAX_SEGUIDOS, que: `Nunca más de ${MAX_SEGUIDOS} seguidos del mismo grupo` },
  ];
}

export function auditarCola(fitness, { propios = [], limite = RECOMENDADOS } = {}) {
  const pantalla = pantallaDeClasificacion(fitness, { propios, limite });
  const casillas = casillasDeCola(pantalla, { limite });
  return { casillas, ok: casillas.every((c) => c.ok), pantalla };
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · LO QUE NO SE CONSTRUYE, Y POR QUÉ
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT24 = [
  {
    que: 'Un tipo «calentamiento» en la priorización',
    porque: 'El apartado 14 le da menor prioridad a los ejercicios de calentamiento, pero el catálogo de la F2 tiene ocho tipos y ninguno es ése: compuesto, aislamiento, fuerza, hipertrofia, isométrico, explosivo, movilidad y habilidad. Decidir por mi cuenta qué ejercicio «es de calentamiento» sería inventarme una clasificación que el catálogo no hace, y la regla 8 lo prohíbe. Lo que sí existe es «movilidad», que es el caso que el apartado nombra junto a él, y ése sí baja de prioridad.',
  },
  {
    que: 'Un factor de prioridad para los ejercicios de movilidad',
    porque: 'El apartado 14 les da menor prioridad, pero la F17 ya los deja fuera del todo: claseDePregunta devuelve null para cualquier ejercicio de movilidad, porque «cuánta movilidad tienes» no tiene una referencia razonable. Un face-pull no baja de prioridad, es que no entra en la cola. Escribir aquí un multiplicador que no se puede aplicar nunca sería un control decorativo, y hay una comprobación que lo demuestra buscándolo en la cola.',
  },
  {
    que: 'IA, predicciones o recomendaciones de entrenamiento',
    porque: 'El apartado 35 las excluye una por una, y el contexto abre diciendo que esto NO es IA. Toda la prioridad sale de multiplicar constantes declaradas en PESOS por datos que ya existen.',
  },
  {
    que: 'XP, logros, recompensas, competición o comparación social',
    porque: 'El apartado 19 lo dice del progreso («No utilizar XP») y el 35 los enumera todos. Es además D2-02: los niveles y la experiencia no salen de Sonido y Rachas. El progreso de esta pantalla es «3 / 8 recomendados», un recuento, no una puntuación que se gane.',
  },
  {
    que: 'Una cola guardada en fitness',
    porque: 'El apartado 21 pide justo lo contrario —«No guardar una cola rígida»— y el 32 dice que se invalide cuando cambien clasificaciones, sesiones, catálogo o cobertura. Calculándola al leer no hay nada que invalidar: es la misma decisión que la F15 con los rangos y la F22 con el historial.',
  },
  {
    que: 'Un segundo sistema de preguntas',
    porque: 'El apartado 8 es literal: «No crear otro sistema de preguntas». Esta fase decide a qué ejercicio se pregunta; cómo se pregunta, cómo se puntúa la respuesta y cómo se guarda siguen siendo la F17.',
  },
];

export const DECISIONES_FIT24 = [
  {
    que: 'Los umbrales de «datos suficientes» son los de la F19, no unos nuevos',
    porque: 'UMBRALES_FUENTE ya define que con tres sesiones manda el entrenamiento y con una empieza a contar. El apartado 6 habla de «suficientes datos reales» y el 7 de «pocos datos»: son exactamente esos dos umbrales. Escribir aquí un número a mano habría creado un segundo criterio, y el día que uno cambiara la cola y el rango dirían cosas distintas del mismo ejercicio.',
  },
  {
    que: 'Un grupo cuenta como cubierto por entrenamientos O por clasificación',
    porque: 'El apartado 9 habla de «ejercicios clasificados», pero contar solo las clasificaciones habría dicho que el pecho está a cero con veinte sesiones de press detrás, y le habría pedido clasificar justo lo que ya tiene medido. La cobertura mide qué sabe el sistema, y los datos reales también lo saben (apartado 6).',
  },
  {
    que: 'Los equivalentes salen de «sustitutos» y «variantes» del catálogo',
    porque: 'El apartado 11 pone de ejemplo pull-up, chin-up y neutral pull-up, que en la F2 son exactamente esos dos campos. Agruparlos por parecido de nombre sería vincular dos cosas por el título, que prohíbe la E3 F12, y se rompería con el primer ejercicio que él se cree.',
  },
  {
    que: 'Una habilidad con progresiones declaradas sí se pregunta',
    porque: 'El apartado 13 quiere fuera los ejercicios «puramente técnicos» y el 14 prefiere las «skills con progresiones definidas». No se contradicen: lo que las separa es si el catálogo le ha escrito una progresión, que es un dato real y no una opinión.',
  },
  {
    que: 'El equilibrio adelanta, nunca descarta',
    porque: 'El apartado 15 quiere evitar diez de espalda seguidos, y para eso basta con adelantar al siguiente de otro grupo. Si no hay ninguno, el ejercicio entra igual: dejar fuera uno prioritario por estética sería esconderle información.',
  },
];

export default colaDeClasificacion;
