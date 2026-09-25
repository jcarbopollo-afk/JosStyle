import { todayISO, addDays } from './helpers';
import { GRUPOS_MUSCULARES } from './fitness';
import { ejercicioPorId, musculosDe } from './ejercicios';
import { indiceDeProgresion, progresoDeEjercicio } from './progresion';
import {
  tarjetaDeProgreso, estadoDe, estadoProgreso, periodo, inicioDePeriodo,
} from './progresoEjercicios';

/* Entrega 4 · Fase 13/45 — «Progreso por grupos musculares».
   ═══════════════════════════════════════════════════════════════════════════

   *"¿Cómo está evolucionando cada grupo muscular?"* — y con un límite que el
   enunciado pone en su apartado 2: **esto mide RENDIMIENTO, no músculo**. Nunca
   *"tu bíceps ha crecido un 12 %"*; sí *"rendimiento: mejorando"*.

   🚨 **NI UNA COMPARACIÓN NUEVA.** La tendencia de cada ejercicio es la de la F11
   (`progresoDeEjercicio`) y la tarjeta la de la F12 (`tarjetaDeProgreso`). Aquí
   solo se **reparte** esa señal entre los músculos y se **vota**.

   Las reglas, documentadas como pide el apartado 10:

   ── CUÁNTO APORTA UN EJERCICIO A UN MÚSCULO (apartados 9 y 10) ──────────────
   Su **peso** es el porcentaje de implicación del catálogo (F2) en ese músculo,
   sobre el total del ejercicio. Un press de banca con pecho 70 % y tríceps 30 %
   vota con 0,7 en Pecho y con 0,3 en Brazos. En un grupo se suman los de sus
   subgrupos. Los porcentajes son **estimaciones**, no mediciones: sirven para
   repartir, no para afirmar nada del músculo.

   ── QUÉ EJERCICIO TIENE DATOS (apartados 4, 11, 13 y 14) ────────────────────
   Solo los que la F11 puede comparar: mejora, estable o descenso. Un primer
   registro o un cambio de medida **no vota**. Y dos filtros de tiempo:
     · el **periodo** elegido: con «30 días» solo cuentan las sesiones de esos
       30 días — si no hay con qué comparar dentro, ese ejercicio no tiene datos,
       en vez de usar en silencio datos viejos (apartado 13);
     · con «Todo», una **recencia** de 90 días: una mejora de hace seis meses no
       puede seguir diciendo «mejorando» para siempre (apartado 14).

   ── EL ESTADO DEL GRUPO (apartado 4) ────────────────────────────────────────
     · Sin ningún ejercicio con datos → **Sin datos**. Nunca «Descenso» por no
       entrenarlo (apartado 11, MUY IMPORTANTE).
     · Con **uno** → su tendencia, marcada como **poca información**.
     · Con varios → **mayoría ponderada**: mejora si su peso supera al de
       estable y descenso juntos; descenso igual al revés; y si nadie tiene
       mayoría (un empate, o todo repartido) → **Estable**. Así un único ejercicio
       no decide el grupo cuando hay otros. */

const lista = (v) => (Array.isArray(v) ? v : []);
const COMPARABLES = ['mejora', 'estable', 'descenso'];

/** Con «Todo», lo que se sigue considerando actual (apartado 14). */
export const RECENCIA_DIAS = 90;

/* ═══════════════════════════════════════════════════════════════════════════
   1 · EL PERIODO (apartado 13)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ Se filtran las SESIONES y se le pasa a la F11 un `fitness` con solo esas.
   Y la lista filtrada se guarda por (lista original, periodo, día): así su
   referencia es estable y el índice de la F11 —que se cachea por lista— no se
   recalcula en cada render (apartado 19). */
const CACHE_PERIODO = new WeakMap();

export function fitnessEnPeriodo(fitness, rango = 'todo', hoy = todayISO()) {
  const f = fitness || {};
  const sesiones = lista(f.sesiones);
  /* ⚠️ Por id, nunca por posición (FIT F29): el catálogo de periodos creció a
     seis y un `RANGOS_GRAFICA[3]` se habría quedado señalando otra cosa. */
  const r = periodo(rango);
  if (!r.dias) return f;
  /* 🐛 FIT F31 — N días, no N + 1: lo decide `inicioDePeriodo`. */
  const desde = inicioDePeriodo(r.dias, hoy);
  let porClave = CACHE_PERIODO.get(sesiones);
  if (!porClave) { porClave = new Map(); CACHE_PERIODO.set(sesiones, porClave); }
  const clave = `${rango}|${hoy}`;
  if (!porClave.has(clave)) porClave.set(clave, sesiones.filter((s) => s && typeof s.fecha === 'string' && s.fecha >= desde));
  return { ...f, sesiones: porClave.get(clave) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LA SEÑAL DE CADA EJERCICIO (apartados 4, 5, 12 y 14)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Qué parte de un ejercicio va a cada subgrupo, sumando 1. ⚠️ Si el catálogo
 *  no suma 100, se reparte sobre lo que sume: los porcentajes son relativos. */
export function repartoMuscular(ejercicio) {
  const ms = musculosDe(ejercicio).filter((m) => m.grupoId && (m.porcentaje || 0) > 0);
  const total = ms.reduce((n, m) => n + m.porcentaje, 0);
  if (!total) return [];
  return ms.map((m) => ({ subgrupoId: m.subgrupoId, grupoId: m.grupoId, peso: m.porcentaje / total, porcentaje: m.porcentaje }));
}

/**
 * Las señales: un ejercicio hecho, su estado según la F11 y su reparto.
 * 🚨 Un ejercicio que ya no está en el catálogo **no se atribuye a ningún grupo**
 * (apartado 12): sin su ficha no se sabe qué músculos trabaja, y adivinarlo sería
 * inventar. Sigue en la lista de ejercicios de la F12.
 */
export function senalesDeEjercicios(fitness, { rango = 'todo', hoy = todayISO(), propios = [] } = {}) {
  const enPeriodo = fitnessEnPeriodo(fitness, rango, hoy);
  const indice = indiceDeProgresion(enPeriodo, propios);
  const limiteRecencia = addDays(hoy, -RECENCIA_DIAS);
  const salida = [];
  for (const id of indice.keys()) {
    const ej = ejercicioPorId(id, propios);
    if (!ej) continue;
    const p = progresoDeEjercicio(enPeriodo, id, { propios });
    let estado = estadoDe(p);
    /* Apartado 14 — con «Todo», una comparación de hace más de 90 días ya no es
       el estado actual. */
    const antiguo = rango === 'todo' && p.ultima && p.ultima.fecha < limiteRecencia;
    if (antiguo && COMPARABLES.includes(estado)) estado = 'sin_datos';
    salida.push({
      exerciseId: id,
      estado,
      conDatos: COMPARABLES.includes(estado),
      antiguo: !!antiguo,
      reparto: repartoMuscular(ej),
      tarjeta: tarjetaDeProgreso(p, propios),
      fecha: p.ultima ? p.ultima.fecha : '',
    });
  }
  return salida;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · EL VOTO (apartado 4)
   ═══════════════════════════════════════════════════════════════════════════ */

export const POCOS_DATOS = 1;

/** El estado de un músculo a partir de sus señales ponderadas. */
export function votoMuscular(senales) {
  const conDatos = lista(senales).filter((s) => s.conDatos && s.peso > 0);
  const pesos = { mejora: 0, estable: 0, descenso: 0 };
  for (const s of conDatos) pesos[s.estado] += s.peso;
  const n = conDatos.length;
  const cuenta = (e) => conDatos.filter((s) => s.estado === e).length;
  let estado = 'sin_datos';
  if (n === 1) estado = conDatos[0].estado;
  else if (n > 1) {
    const total = pesos.mejora + pesos.estable + pesos.descenso;
    if (pesos.mejora > total - pesos.mejora) estado = 'mejora';
    else if (pesos.descenso > total - pesos.descenso) estado = 'descenso';
    else estado = 'estable';
  }
  return {
    estado,
    pocaInformacion: n === POCOS_DATOS,
    ejerciciosConDatos: n,
    mejoran: cuenta('mejora'),
    estables: cuenta('estable'),
    bajan: cuenta('descenso'),
    /* Apartado 3 — la barra sale de CONTAR, no de un porcentaje inventado:
       cuántos de los que tienen datos mejoran. */
    fraccion: n ? cuenta('mejora') / n : 0,
    pesos,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · GRUPOS, SUBGRUPOS Y SUS EJERCICIOS (apartados 3, 6, 9 y 18)
   ═══════════════════════════════════════════════════════════════════════════ */

const DE_ESTADO = (id) => {
  const e = estadoProgreso(id);
  return { estado: id, estadoNombre: id === 'sin_datos' ? 'Sin datos' : e.nombre, simbolo: e.simbolo };
};

/** Las señales de un músculo, con el peso que le toca a cada ejercicio. */
function senalesDe(senales, { grupoId = null, subgrupoId = null }) {
  return lista(senales)
    .map((s) => {
      const peso = s.reparto
        .filter((r) => (subgrupoId ? r.subgrupoId === subgrupoId : r.grupoId === grupoId))
        .reduce((n, r) => n + r.peso, 0);
      return { ...s, peso };
    })
    .filter((s) => s.peso > 0);
}

/** Apartado 6 — los ejercicios de un músculo: los que lo implican, primero los
 *  que más, y a igualdad los más recientes. */
export function ejerciciosDeMusculo(senales, filtro) {
  return senalesDe(senales, filtro)
    .sort((a, b) => b.peso - a.peso || (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))
    .map((s) => ({ ...s.tarjeta, implicacion: Math.round(s.peso * 100), estadoMuscular: s.estado }));
}

function textoResumen(v) {
  if (!v.ejerciciosConDatos) return 'Todavía no hay datos comparables';
  if (v.pocaInformacion) return 'Poca información: un solo ejercicio';
  return `${v.mejoran} de ${v.ejerciciosConDatos} ejercicios mejoran`;
}

export function progresoDeSubgrupo(senales, subgrupo) {
  const propias = senalesDe(senales, { subgrupoId: subgrupo.id });
  const v = votoMuscular(propias);
  return {
    id: subgrupo.id,
    nombre: subgrupo.nombre,
    ...DE_ESTADO(v.estado),
    ...v,
    ejercicios: propias.length,
    resumen: textoResumen(v),
  };
}

/** El `getMuscleGroupProgress` del apartado 4. */
export function progresoDeGrupo(senales, grupo) {
  const propias = senalesDe(senales, { grupoId: grupo.id });
  const v = votoMuscular(propias);
  return {
    id: grupo.id,
    nombre: grupo.nombre,
    icono: grupo.icono,
    ...DE_ESTADO(v.estado),
    ...v,
    ejercicios: propias.length,
    resumen: textoResumen(v),
    subgrupos: lista(grupo.subgrupos).map((sg) => progresoDeSubgrupo(senales, sg)),
  };
}

/** El resumen de los siete grupos (apartado 3). */
export function resumenMuscular(fitness, { rango = 'todo', hoy = todayISO(), propios = [] } = {}) {
  const senales = senalesDeEjercicios(fitness, { rango, hoy, propios });
  const grupos = GRUPOS_MUSCULARES.map((g) => progresoDeGrupo(senales, g));
  return {
    rango,
    grupos,
    senales,
    /* Apartado 22 — distinguir «nunca ha entrenado» de «no hay nada comparable
       en este periodo». */
    hayEjercicios: senales.length > 0,
    hayDatos: grupos.some((g) => g.ejerciciosConDatos > 0),
  };
}

/** Apartado 8 — ¿un ejercicio pertenece a un grupo? El MISMO criterio que el
 *  detalle: implicación mayor que cero en el catálogo. */
export function ejercicioEnGrupo(exerciseId, grupoId, propios = []) {
  if (!grupoId || grupoId === 'todos') return true;
  const ej = ejercicioPorId(exerciseId, propios);
  if (!ej) return false;
  return repartoMuscular(ej).some((r) => r.grupoId === grupoId);
}

export const FILTROS_GRUPO = [{ id: 'todos', nombre: 'Todos' }, ...GRUPOS_MUSCULARES.map((g) => ({ id: g.id, nombre: g.nombre }))];

export const AVISO_RENDIMIENTO = 'Esto mide el rendimiento de tus ejercicios, no el tamaño del músculo.';

export const NO_EN_FIT13 = [
  { que: 'Hipertrofia, medidas o composición corporal', porque: 'Apartado 2: con datos de rendimiento no se puede afirmar que un músculo crezca. La pantalla lo dice.' },
  { que: 'Rangos, ranking global, IA y recomendaciones', porque: 'Apartado 25.' },
  { que: 'Anatomía interactiva o intensidad muscular', porque: 'Apartado 16. Cada grupo lleva su icono, que ya existía.' },
  { que: 'Un decaimiento temporal complejo', porque: 'Apartado 14: basta con el periodo y una recencia de 90 días con «Todo».' },
  { que: 'Estado de carga y de error propios', porque: 'Apartado 22. Como en la F10: no hay una lectura aparte que pueda fallar; se lee `fitness`, ya cargado. Sí están sin datos, datos insuficientes, sin resultados, grupo sin ejercicios y ejercicio eliminado.' },
];
