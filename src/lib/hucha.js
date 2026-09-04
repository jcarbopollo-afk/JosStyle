/* ===========================================================================
   ENTREGA 3 · FASE 4 — LA HUCHA DE ECONOMÍA
   ===========================================================================

   *"El apartado Economía actual está muy bien planteado y su estructura general
   debe mantenerse. […] Esta fase debe centrarse únicamente en pequeños ajustes
   funcionales y en mejorar la Hucha sin hacer que ocupe más espacio ni
   convertirla en un módulo independiente."*

   🚨 **ESTO NO SALE DE ECONOMÍA, Y ESTÁ ESCRITO EN EL APARTADO 8:** *"Este
   objetivo de ahorro NO debe aparecer en el apartado global de Objetivos. No
   crear una relación innecesaria con objetivos personales, rachas,
   productividad, dashboard u otros módulos."* Así que:

     · no se toca `objetivos`, ni `rachas`, ni `productividad`;
     · no hay una línea en el Dashboard;
     · y hay pruebas que leen este archivo y fallan si aparece cualquiera de
       esos nombres.

   ── CÓMO SE SABE SI ESTÁ CUMPLIENDO (apartado 7) ───────────────────────────

   El apartado 7 pide usar *"los movimientos de Economía para determinar el
   progreso cuando sea posible"*, y remata: *"sin obligar al usuario a
   introducir constantemente información duplicada"*.

   ⚠️ **Un movimiento de Economía no dice si el dinero fue a la hucha.** Un
   gasto es dinero que sale y un ingreso dinero que entra; ninguno lleva un
   campo que diga "esto es ahorro". Adivinarlo por el concepto —buscar la
   palabra "hucha"— sería inventarse un dato.

   Lo que sí existe es el botón que el propio apartado 4 dibuja: **`+ Añadir
   ahorro`**. Cada vez que Josué lo usa, eso ES el movimiento destinado a la
   hucha, y queda apuntado con su fecha. De ahí sale el progreso del periodo,
   **sin pedirle el dato dos veces**, que es exactamente lo que pide el
   apartado 7.

   ⚠️ **`hucha` sigue siendo el total, y no se toca.** Es el campo que existe
   desde siempre; las aportaciones son el historial que faltaba para poder
   contestar "¿voy bien esta semana?". Editar el total a mano sigue funcionando.
   =========================================================================== */

import { uid, todayISO, fechaLocalISO } from './helpers';

/* Las tres del apartado 5, ni una más: *"cada día, cada semana, cada mes"*. */
export const FRECUENCIAS_HUCHA = [
  { id: 'dia', label: 'Cada día', singular: 'día', dias: 1 },
  { id: 'semana', label: 'Cada semana', singular: 'semana', dias: 7 },
  { id: 'mes', label: 'Cada mes', singular: 'mes', dias: 30 },
];

export const frecuenciaHucha = (id) => FRECUENCIAS_HUCHA.find((f) => f.id === id) || FRECUENCIAS_HUCHA[1];

export const DEFAULT_OBJETIVO_HUCHA = { cantidad: null, porPeriodo: null, frecuencia: 'semana' };

/* ⚠️ **Al añadir un campo a una entidad, añadirlo a su normalizador**, o el
   siguiente guardado se lo lleva (regla 5). Es la lección que este proyecto ha
   aprendido dieciocho veces. `objetivoHucha` y `aportaciones` son campos nuevos
   de `economia`, así que aquí están los dos. */
export function normalizarObjetivoHucha(guardado) {
  const g = guardado || {};
  const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);
  return {
    cantidad: num(g.cantidad),
    porPeriodo: num(g.porPeriodo),
    frecuencia: frecuenciaHucha(g.frecuencia).id,
  };
}

export function normalizarAportaciones(guardadas) {
  return (Array.isArray(guardadas) ? guardadas : [])
    .filter((a) => a && a.id && Number.isFinite(Number(a.cantidad)) && typeof a.fecha === 'string')
    .map((a) => ({ id: a.id, fecha: a.fecha, cantidad: Number(a.cantidad) }));
}

export function normalizarEconomiaHucha(economia) {
  const e = economia || {};
  return {
    ...e,
    hucha: Number.isFinite(Number(e.hucha)) ? Number(e.hucha) : 0,
    objetivoHucha: normalizarObjetivoHucha(e.objetivoHucha),
    aportaciones: normalizarAportaciones(e.aportaciones),
  };
}

/** ¿Hay objetivo de verdad? Sin cantidad no hay nada que seguir (apartado 10). */
export const tieneObjetivo = (economia) => normalizarObjetivoHucha(economia?.objetivoHucha).cantidad !== null;

/* ── Añadir ahorro (apartado 4) ────────────────────────────────────────────
   Devuelve la `economia` entera, porque toca DOS cosas —el total y el
   historial— y devolver solo una de ellas dejaría la otra sin guardar. */
export function anadirAhorro(economia, cantidad, hoy = todayISO()) {
  const c = Number(cantidad);
  if (!Number.isFinite(c) || c === 0) return economia;
  const e = normalizarEconomiaHucha(economia);
  return {
    ...e,
    hucha: Math.round((e.hucha + c) * 100) / 100,
    aportaciones: [...e.aportaciones, { id: uid(), fecha: hoy, cantidad: c }],
  };
}

export function eliminarAportacion(economia, id) {
  const e = normalizarEconomiaHucha(economia);
  const fuera = e.aportaciones.find((a) => a.id === id);
  if (!fuera) return e;
  return {
    ...e,
    hucha: Math.round((e.hucha - fuera.cantidad) * 100) / 100,
    aportaciones: e.aportaciones.filter((a) => a.id !== id),
  };
}

export function guardarObjetivoHucha(economia, objetivo) {
  return { ...normalizarEconomiaHucha(economia), objetivoHucha: normalizarObjetivoHucha(objetivo) };
}

export function quitarObjetivoHucha(economia) {
  return { ...normalizarEconomiaHucha(economia), objetivoHucha: { ...DEFAULT_OBJETIVO_HUCHA } };
}

/* ── El periodo actual ─────────────────────────────────────────────────────
   ⚠️ **Todo en local, nunca `toISOString()`.** Ésa es la trampa que ha roto
   este proyecto seis veces: sobre una medianoche local retrocede un día en
   España, y aquí eso movería el lunes de la semana y con él el cumplimiento. */
function inicioDePeriodo(frecuenciaId, hoy) {
  const [a, m, d] = hoy.split('-').map(Number);
  const f = new Date(a, m - 1, d);
  if (frecuenciaId === 'dia') return hoy;
  if (frecuenciaId === 'mes') return fechaLocalISO(new Date(a, m - 1, 1));
  // Semana: lunes primero, como en España. `getDay()` da 0 para domingo.
  const diaSemana = (f.getDay() + 6) % 7;
  f.setDate(f.getDate() - diaSemana);
  return fechaLocalISO(f);
}

export function periodoActual(economia, hoy = todayISO()) {
  const obj = normalizarObjetivoHucha(economia?.objetivoHucha);
  return { desde: inicioDePeriodo(obj.frecuencia, hoy), hasta: hoy, frecuencia: obj.frecuencia };
}

/** Lo ahorrado dentro del periodo en curso. */
export function ahorradoEnPeriodo(economia, hoy = todayISO()) {
  const e = normalizarEconomiaHucha(economia);
  const { desde } = periodoActual(e, hoy);
  return e.aportaciones
    .filter((a) => a.fecha >= desde && a.fecha <= hoy)
    .reduce((t, a) => t + a.cantidad, 0);
}

/* ── El panel de la tarjeta (apartados 6 y 10) ─────────────────────────────

   Los tres estados del apartado 10 —sin objetivo, con objetivo, cumplido— con
   la barra de doce bloques del ejemplo.

   ⚠️ **La barra son caracteres, como el "gráfico" de EH F35.** Ni una librería,
   ni un `<canvas>`: el apartado 9 pide *"una barra de progreso pequeña"* dentro
   de la tarjeta de siempre, y el 6 dice *"no crear gráficos grandes ni
   estadísticas complejas"*. */
export const LARGO_BARRA = 12;

export function barraDeProgreso(porcentaje, largo = LARGO_BARRA) {
  const llenos = Math.max(0, Math.min(largo, Math.round((porcentaje / 100) * largo)));
  return '█'.repeat(llenos) + '░'.repeat(largo - llenos);
}

export const ESTADOS_HUCHA = {
  SIN_OBJETIVO: 'sin_objetivo',
  EN_CURSO: 'en_curso',
  ALCANZADO: 'alcanzado',
};

export function panelHucha(economia, hoy = todayISO()) {
  const e = normalizarEconomiaHucha(economia);
  const obj = e.objetivoHucha;
  const ahorrado = e.hucha;

  // Apartado 10 — *"la hucha debe funcionar correctamente aunque no exista
  // objetivo"*. Sin él se enseña lo que hay y la puerta para ponerlo.
  if (obj.cantidad === null) {
    return {
      estado: ESTADOS_HUCHA.SIN_OBJETIVO,
      ahorrado,
      objetivo: null,
      porcentaje: null,
      barra: null,
      titulo: `${ahorrado.toFixed(2)} € ahorrados`,
      detalle: null,
      periodo: null,
    };
  }

  const porcentaje = Math.min(100, Math.round((ahorrado / obj.cantidad) * 100));
  const alcanzado = ahorrado >= obj.cantidad;

  /* Apartado 6 — el seguimiento del periodo, y solo si él ha puesto cuánto
     quiere ahorrar por periodo. Sin ese dato no hay nada que comparar, y
     ⚠️ **inventarse un objetivo semanal a partir del total sería una cifra que
     él no ha dicho** (regla 8). */
  let periodo = null;
  if (obj.porPeriodo !== null) {
    const enPeriodo = ahorradoEnPeriodo(e, hoy);
    const faltan = Math.round((obj.porPeriodo - enPeriodo) * 100) / 100;
    const f = frecuenciaHucha(obj.frecuencia);
    periodo = {
      frecuencia: obj.frecuencia,
      objetivo: obj.porPeriodo,
      ahorrado: Math.round(enPeriodo * 100) / 100,
      cumplido: faltan <= 0,
      faltan: faltan > 0 ? faltan : 0,
      linea: `Ahorrar ${obj.porPeriodo.toFixed(2)} € cada ${f.singular}`,
      // Las dos frases del apartado 6, tal cual.
      estado: faltan <= 0
        ? `Est${obj.frecuencia === 'dia' ? 'e día' : obj.frecuencia === 'mes' ? 'e mes' : 'a semana'}: cumplido`
        : `Est${obj.frecuencia === 'dia' ? 'e día' : obj.frecuencia === 'mes' ? 'e mes' : 'a semana'}: faltan ${faltan.toFixed(2)} €`,
    };
  }

  return {
    estado: alcanzado ? ESTADOS_HUCHA.ALCANZADO : ESTADOS_HUCHA.EN_CURSO,
    ahorrado,
    objetivo: obj.cantidad,
    porcentaje,
    barra: barraDeProgreso(porcentaje),
    titulo: `${ahorrado.toFixed(2)} € / ${obj.cantidad.toFixed(2)} €`,
    detalle: alcanzado ? 'Objetivo alcanzado' : null,
    periodo,
  };
}
