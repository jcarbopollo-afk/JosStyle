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
/* ── El dinero, en céntimos (A5) ────────────────────────────────────────────
   🐛 La auditoría encontró tres caras del mismo fallo: la coma flotante (1,005 € se guardaba como 1,00 y
   0,005 como 0,01), el desbordamiento (1e307 € pasaba la validación, el total llegaba a `Infinity`, JSON lo
   escribía como `null` y al recargar se perdían los ahorros) y el redondeo distinto en cada sitio. Ahora
   TODA la cuenta se hace en céntimos enteros, con estas reglas, iguales en la librería, la pantalla y
   `App.jsx`:
     · lo que ESCRIBE él (una aportación, el total a mano, un objetivo) se lleva al céntimo UNA vez, la mitad
       hacia arriba y sin el error de la coma flotante (1,005 € → 1,01; 0,005 € → 0,01; 0,004 € → 0, que no es
       una aportación), y no pasa de `HUCHA_MAX_CENTIMOS`. Esa misma cifra es la que va al total y al
       historial (E3 F4 ya redondeaba a céntimos: «nada de 110.55499999»);
     · lo ya GUARDADO se lee sin rechazar nada (es suyo) y se lleva al céntimo más cercano solo para contar
       y pintar (`centimosGuardados`): así 999,999 € se lee como 1000,00 € y llega al objetivo de 1000;
     · se guarda en euros, como siempre (`hucha`, `cantidad`), pero siempre con céntimos exactos.
   El máximo deja muchísimo margen a los enteros seguros de JavaScript (2^53), así que ninguna suma de
   céntimos pierde precisión ni se va a `Infinity`. */
export const HUCHA_MAX_CENTIMOS = 100000000000; // 1 000 000 000,00 €

/** Céntimos enteros de lo que ESCRIBE él, redondeado al céntimo (la mitad hacia arriba), o `null` si no es
 *  un número (vacío, texto, `NaN`, `Infinity`) o se sale de cualquier importe posible. El signo se conserva:
 *  decidir si vale es de quien llama. `toPrecision(15)` quita el error de la coma flotante antes de redondear
 *  (1,005 × 100 = 100,4999…, que redondeado a secas daba 1,00 €). */
const NUMERO_DECIMAL = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
export function centimosEscritos(v) {
  /* Solo un número o una cadena decimal: ni hexadecimal («0x10»), ni listas, ni espacios sueltos (A5). */
  if (typeof v !== 'number' && (typeof v !== 'string' || !NUMERO_DECIMAL.test(v.trim()))) return null;
  const n = Number(typeof v === 'string' ? v.trim() : v);
  if (!Number.isFinite(n) || Math.abs(n) > HUCHA_MAX_CENTIMOS) return null;
  const c = Math.round(Number((Math.abs(n) * 100).toPrecision(15)));
  return n < 0 ? -c : c;
}
const escritoNegativo = (v) => centimosEscritos(v) !== null && Number(v) < 0;

/** Céntimos de algo ya GUARDADO (puede venir de antes, con más decimales): el céntimo más cercano, o 0. Un
 *  total antiguo fuera de cualquier importe posible (de antes de A5 se podía escribir 1e308) se acota a
 *  ±`Number.MAX_SAFE_INTEGER` para contar y pintar: nunca `Infinity` (que JSON guardaría como null). */
export function centimosGuardados(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  const c = Math.round(Number((n * 100).toPrecision(15)));
  return Number.isFinite(c) ? Math.max(-Number.MAX_SAFE_INTEGER, Math.min(Number.MAX_SAFE_INTEGER, c)) : (n < 0 ? -Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER);
}
/** ¿Un importe guardado está dentro de lo que la hucha admite? Fuera de ahí no se reescribe nada (no se toca). */
const dentroDelMaximo = (v) => Math.abs(centimosGuardados(v)) <= HUCHA_MAX_CENTIMOS;

const aEuros = (c) => c / 100;

export function normalizarObjetivoHucha(guardado) {
  const g = guardado || {};
  /* Un objetivo de menos de un céntimo no es un objetivo (sería 0/0 en el porcentaje): no hay objetivo. */
  const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 && centimosGuardados(v) >= 1 ? Number(v) : null);
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

/* 🐛 A3 (auditoría de la fase 3) — **la hucha solo suma** (decisión de Josué: sin
   retiradas). «Añadir ahorro» aceptaba un número negativo como si fuera sacar dinero
   y el total quedaba en -40 €; editar el total a mano también admitía negativos.
   Una sola regla para cada cosa, la misma en la librería, en la pantalla y en
   `App.jsx`: una aportación es una cantidad mayor que 0, y el total no baja de 0.
   ⚠️ Lo que ya estaba guardado no se toca al cargar —ni una aportación negativa
   de antes, ni un total—: es historial suyo, y la regla vale para lo nuevo. */
/* Una aportación se cuenta en céntimos: por debajo de uno, el total (redondeado a céntimos) no sumaría
   nada y el historial sí la apuntaría, y los dos dirían cifras distintas del mismo ahorro. */
export const cantidadValida = (v) => { const c = centimosEscritos(v); return c !== null && !escritoNegativo(v) && c >= 1 && c <= HUCHA_MAX_CENTIMOS; };
export const totalValido = (v) => { const c = centimosEscritos(v); return c !== null && !escritoNegativo(v) && c <= HUCHA_MAX_CENTIMOS; };

/** Lo que se dice cuando algo no vale: con palabras, y qué hacer (EH F62). */
export const MOTIVOS_HUCHA = Object.freeze({
  cantidad: 'Escribe una cantidad de al menos 0,01 € (se cuenta al céntimo): la hucha solo suma ahorro.',
  total: 'El total ahorrado no puede ser negativo.',
  totalFormato: 'Escribe el total con cifras, por ejemplo 120,50.',
  totalCentimo: 'El total se cuenta al céntimo: escribe al menos 0,01 € o déjalo vacío (0).',
  objetivo: 'Escribe el objetivo con cifras: al menos 0,01 € (se cuenta al céntimo).',
  maximo: 'La hucha admite como mucho 1.000.000.000,00 €.',
  totalBaja: 'La hucha solo suma: el total no puede bajar de lo que ya tienes ahorrado.',
  totalInvalido: 'El total guardado no es un importe válido: corrígelo (hacia arriba) antes de añadir.',
});

/** Por qué no se puede añadir esta aportación (o `null` si se puede): también si el total pasaría del máximo. */
export function motivoAportacion(economia, v) {
  if (!cantidadValida(v)) return Number(v) * 100 > HUCHA_MAX_CENTIMOS ? MOTIVOS_HUCHA.maximo : MOTIVOS_HUCHA.cantidad;
  const e = normalizarEconomiaHucha(economia);
  if (!dentroDelMaximo(e.hucha)) return MOTIVOS_HUCHA.totalInvalido; // un total imposible de antes no se reescribe con una cifra inventada
  return centimosGuardados(e.hucha) + centimosEscritos(v) > HUCHA_MAX_CENTIMOS ? MOTIVOS_HUCHA.maximo : null;
}

/** Por qué no vale este total escrito a mano (o `null`). `aMedias` es un número a medio escribir («1e», «-»):
 *  el navegador lo da vacío, y no es ni un negativo ni vaciar el campo. Vacío de verdad es 0.
 *  🚨 A5 (auditoría final) — **la hucha solo suma**: con `actual` (el total guardado), el total escrito no puede
 *  BAJAR de él. Bajarlo a mano era una retirada por la puerta de atrás: borrar el campo dejaba 500 € en 0. */
export function motivoTotal(v, aMedias = false, actual = null) {
  if (aMedias) return MOTIVOS_HUCHA.totalFormato;
  const baja = (c) => actual !== null && actual !== undefined && dentroDelMaximo(actual) && c < centimosGuardados(actual);
  if (v === '') return baja(0) ? MOTIVOS_HUCHA.totalBaja : null;
  const c = centimosEscritos(v);
  if (c === null) return Number(v) < 0 ? MOTIVOS_HUCHA.total : Math.abs(Number(v)) > HUCHA_MAX_CENTIMOS / 100 ? MOTIVOS_HUCHA.maximo : MOTIVOS_HUCHA.totalFormato;
  if (escritoNegativo(v)) return MOTIVOS_HUCHA.total;
  if (c === 0 && Number(v) > 0) return MOTIVOS_HUCHA.totalCentimo; // 0,004 € no se guarda como 0 sin decirlo
  if (c > HUCHA_MAX_CENTIMOS) return MOTIVOS_HUCHA.maximo;
  return baja(c) ? MOTIVOS_HUCHA.totalBaja : null;
}

/** Los euros exactos de un total escrito válido (vacío = 0), para guardarlo. `null` si no vale (también si
 *  BAJA de `actual`: la hucha solo suma). */
export const eurosDelTotal = (v, actual = null) => (motivoTotal(v, false, actual) ? null : v === '' ? 0 : totalValido(v) ? aEuros(centimosEscritos(v)) : null);

/** 🚨 A5 — la última barrera, la de `App.jsx`: ¿se puede guardar esta economía en lugar de la de ahora? Solo si
 *  el total no BAJA (sin retiradas), es un importe finito dentro del máximo (o no cambia), y cada aportación
 *  NUEVA es de al menos un céntimo. Lo que ya estaba guardado no se juzga. */
export function economiaPermitida(antes, despues) {
  const a = normalizarEconomiaHucha(antes);
  const d = despues || {};
  if (!Number.isFinite(Number(d.hucha ?? 0))) return false;
  const totalAntes = centimosGuardados(a.hucha);
  const totalDespues = centimosGuardados(d.hucha ?? 0);
  if (totalDespues !== totalAntes) {
    if (totalDespues < totalAntes && dentroDelMaximo(a.hucha)) return false;
    if (!dentroDelMaximo(d.hucha ?? 0)) return false;
  }
  const ids = new Set(a.aportaciones.map((x) => x.id));
  return (Array.isArray(d.aportaciones) ? d.aportaciones : []).every((x) => ids.has(x && x.id) || (x && cantidadValida(x.cantidad)));
}

/** Por qué no vale este objetivo (o `null`). Cada campo puede ir vacío (= sin ese dato). */
export function motivoObjetivo({ cantidad, porPeriodo } = {}) {
  const vacio = (v) => v === '' || v === null || v === undefined;
  const excede = (v) => !vacio(v) && Number(v) * 100 > HUCHA_MAX_CENTIMOS;
  if (excede(cantidad) || excede(porPeriodo)) return MOTIVOS_HUCHA.maximo;
  return (vacio(cantidad) || cantidadValida(cantidad)) && (vacio(porPeriodo) || cantidadValida(porPeriodo)) ? null : MOTIVOS_HUCHA.objetivo;
}

/** ¿Hay objetivo de verdad? Sin cantidad no hay nada que seguir (apartado 10). */
export const tieneObjetivo = (economia) => normalizarObjetivoHucha(economia?.objetivoHucha).cantidad !== null;

/* ── Añadir ahorro (apartado 4) ────────────────────────────────────────────
   Devuelve la `economia` entera, porque toca DOS cosas —el total y el
   historial— y devolver solo una de ellas dejaría la otra sin guardar. */
export function anadirAhorro(economia, cantidad, hoy = todayISO()) {
  if (motivoAportacion(economia, cantidad)) return economia;
  const c = centimosEscritos(cantidad); // la misma cifra, en céntimos, para el total y para el historial
  const e = normalizarEconomiaHucha(economia);
  return {
    ...e,
    hucha: aEuros(centimosGuardados(e.hucha) + c),
    aportaciones: [...e.aportaciones, { id: uid(), fecha: hoy, cantidad: aEuros(c) }],
  };
}

/* ⚠️ A3 — si el total se editó a mano por debajo de lo aportado, quitar una aportación lo
   dejaría negativo. No se recorta a 0 (sería inventarse el total) ni se quita a medias:
   se rechaza y todo queda como estaba —total e historial—. Hoy ninguna pantalla la llama. */
export function eliminarAportacion(economia, id) {
  const e = normalizarEconomiaHucha(economia);
  const fuera = e.aportaciones.find((a) => a.id === id);
  if (!fuera) return e;
  if (!dentroDelMaximo(e.hucha) || !dentroDelMaximo(fuera.cantidad)) return e; // un total imposible de antes no se reescribe
  const queda = centimosGuardados(e.hucha) - centimosGuardados(fuera.cantidad);
  if (queda < 0) return e;
  return {
    ...e,
    hucha: aEuros(queda),
    aportaciones: e.aportaciones.filter((a) => a.id !== id),
  };
}

/* A5 — un objetivo negativo, de menos de un céntimo o fuera de rango no se guarda en silencio como «sin
   objetivo»: no se escribe nada (la pantalla dice por qué con `motivoObjetivo`). Lo que vale se guarda contado al
   céntimo, con la misma regla que todo lo escrito (12,335 → 12,34). */
export function guardarObjetivoHucha(economia, objetivo) {
  const o = objetivo || {};
  if (motivoObjetivo(o)) return economia;
  const exacto = (v) => (v === '' || v === null || v === undefined ? null : aEuros(centimosEscritos(v)));
  return { ...normalizarEconomiaHucha(economia), objetivoHucha: normalizarObjetivoHucha({ ...o, cantidad: exacto(o.cantidad), porPeriodo: exacto(o.porPeriodo) }) };
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
  return aEuros(e.aportaciones
    .filter((a) => a.fecha >= desde && a.fecha <= hoy)
    .reduce((t, a) => t + centimosGuardados(a.cantidad), 0));
}

/* ── El panel de la tarjeta (apartados 6 y 10) ─────────────────────────────

   Los tres estados del apartado 10 —sin objetivo, con objetivo, cumplido— con
   la barra de doce bloques del ejemplo.

   ⚠️ **La barra son caracteres, como el "gráfico" de EH F35.** Ni una librería,
   ni un `<canvas>`: el apartado 9 pide *"una barra de progreso pequeña"* dentro
   de la tarjeta de siempre, y el 6 dice *"no crear gráficos grandes ni
   estadísticas complejas"*. */
export const LARGO_BARRA = 12;

/* A2 — un bloque se llena cuando está cubierto entero (`floor`): con `round`, un 96 %
   ya pintaba los doce bloques y la barra parecía completa sin serlo. */
export function barraDeProgreso(porcentaje, largo = LARGO_BARRA) {
  const llenos = Math.max(0, Math.min(largo, Math.floor((porcentaje * largo) / 100)));
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
  /* A5 — se cuenta y se pinta en céntimos, los mismos para el título, el porcentaje y «alcanzado»: con euros
     sueltos, 999,999 € se pintaba «1000.00 € / 1000.00 €» al 99 %. */
  const ahorradoC = centimosGuardados(ahorrado);
  const euros = (c) => aEuros(c).toFixed(2);

  // Apartado 10 — *"la hucha debe funcionar correctamente aunque no exista
  // objetivo"*. Sin él se enseña lo que hay y la puerta para ponerlo.
  if (obj.cantidad === null) {
    return {
      estado: ESTADOS_HUCHA.SIN_OBJETIVO,
      ahorrado,
      objetivo: null,
      porcentaje: null,
      barra: null,
      titulo: `${euros(ahorradoC)} € ahorrados`,
      detalle: null,
      periodo: null,
    };
  }

  /* 🐛 A2 (auditoría de la fase 3) — el 100 % solo existe si se alcanzó. Redondear daba
     100 % con 996 de 1000 €: barra llena y sin «Objetivo alcanzado». El porcentaje sale
     del mismo criterio que el estado: alcanzado → 100; si no, se trunca y se topa en 99.
     La cuenta va en céntimos enteros: en coma flotante 0,57 × 100 es 56,99…, y truncar le quitaba un punto
     entero (0,57 € de 1 € decía 56 %). Un objetivo por debajo del céntimo no es un objetivo (el normalizador
     lo deja en «sin objetivo»: nunca 0/0). Un total negativo guardado de antes no baja de 0 %. */
  const objetivoC = Math.max(1, centimosGuardados(obj.cantidad));
  const alcanzado = ahorradoC >= objetivoC;
  const porcentaje = alcanzado ? 100 : Math.max(0, Math.min(99, Math.floor((ahorradoC * 100) / objetivoC)));

  /* Apartado 6 — el seguimiento del periodo, y solo si él ha puesto cuánto
     quiere ahorrar por periodo. Sin ese dato no hay nada que comparar, y
     ⚠️ **inventarse un objetivo semanal a partir del total sería una cifra que
     él no ha dicho** (regla 8). */
  let periodo = null;
  if (obj.porPeriodo !== null) {
    const enPeriodo = ahorradoEnPeriodo(e, hoy);
    const faltan = aEuros(centimosGuardados(obj.porPeriodo) - centimosGuardados(enPeriodo));
    const f = frecuenciaHucha(obj.frecuencia);
    periodo = {
      frecuencia: obj.frecuencia,
      objetivo: obj.porPeriodo,
      ahorrado: Math.round(enPeriodo * 100) / 100,
      cumplido: faltan <= 0,
      faltan: faltan > 0 ? faltan : 0,
      linea: `Ahorrar ${euros(centimosGuardados(obj.porPeriodo))} € cada ${f.singular}`,
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
    titulo: `${euros(ahorradoC)} € / ${euros(objetivoC)} €`,
    detalle: alcanzado ? 'Objetivo alcanzado' : null,
    periodo,
  };
}
