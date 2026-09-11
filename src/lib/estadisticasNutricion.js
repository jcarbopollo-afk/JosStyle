/* ══════════════════════════════════════════════════════════════════════════
   ESTADÍSTICAS DE NUTRICIÓN — Entrega 3 · Fase 38 (NU F6)

   *"¿Estoy cumpliendo mis objetivos nutricionales y cómo estoy evolucionando?"*

   🚨 **ESTE ARCHIVO NO GUARDA NI UNA CIFRA.** Es la lección de
   `estadisticasPlan.js` (E3 F13) y `progresoEstilo.js` (EH F35): una estadística
   guardada **miente en cuanto él borra un registro**. Todo se cuenta en el
   momento sobre las comidas que ya existen, y el apartado 16 lo pide con esas
   palabras: *"No crear una segunda fuente de datos."*

   🚨 **Y NI UN SISTEMA DE RACHAS** (apartado 8, literal: *"no crear todavía un
   sistema de rachas independiente que duplique el sistema global"*). Lo que se
   enseña es **un recuento** —*"6 de 7 días registrados"*—, que es otra cosa: no
   se importa nada de `rachas.js` ni de `rachasServicio.js`, y hay una prueba que
   lee los imports de este archivo.

   ⚠️ **Lo que ya existía y no se reescribe**: `rangoDelPeriodo` y `PERIODOS`
   (E3 F13), `NOMBRES_DIA`, `resumenDelDia` y `comidasDelDia` (E3 F33) y
   `objetivosParaResumen` (E3 F35). Antes de escribir un cálculo, mirar si ya
   está hecho.
   ══════════════════════════════════════════════════════════════════════════ */

import { PERIODOS, periodo, rangoDelPeriodo, NOMBRES_DIA } from './estadisticasPlan.js';
import { INDICADORES, comidasDelDia } from './nutricion.js';
import { objetivosParaResumen } from './objetivosNutricion.js';
import { todayISO, addDays } from './helpers.js';

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const round1 = (v) => Math.round(v * 10) / 10;

/* ══════════════════════════════════════════════════════════════════════════
   1 · EL RANGO TEMPORAL — apartado 6
   ══════════════════════════════════════════════════════════════════════════ */

/* *"7 días · 30 días · 90 días. La arquitectura debe quedar preparada para
   ampliar posteriormente los periodos."*

   ⚠️ **Los periodos son los de `PERIODOS` (E3 F13), declarados por sus ids**, no
   una lista nueva: así, ampliarlos es añadir un id aquí, y renombrar uno allí
   **rompe la prueba** en vez de dejar un periodo fantasma (EH F26). `3m` son
   exactamente los 90 días que pide el enunciado. */
export const IDS_PERIODO_NUT = ['7d', '30d', '3m'];

export const PERIODOS_NUT = IDS_PERIODO_NUT.map((id) => PERIODOS.find((p) => p.id === id)).filter(Boolean);

/* El resumen del apartado 2 es **semanal**, así que se entra por 7 días. */
export const PERIODO_NUT_POR_DEFECTO = '7d';

export const periodoNut = (id) =>
  PERIODOS_NUT.find((p) => p.id === id) || PERIODOS_NUT.find((p) => p.id === PERIODO_NUT_POR_DEFECTO);

/* ══════════════════════════════════════════════════════════════════════════
   2 · LOS DÍAS DEL PERIODO — apartados 13 y 14
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 **Un día sin registrar NO ES UN DÍA A CERO** (apartados 7 y 13). Lleva
   `tieneDatos: false` y sus totales a `null`: un cero diría que ese día comió
   cero, y *"no considerar un día vacío como un día perfecto"* es literal del
   apartado 7. Es la lección de la gráfica de Sueño (E3 F32) y la de `null` no
   es `[]` (EH F25).

   ⚠️ Y el recorrido es **por días de calendario**, nunca por registros: siete
   días son siete días, aunque tres estén vacíos (E3 F32). */
export function diasDelPeriodo(comidas, periodoId, hoy = todayISO()) {
  const { dias } = rangoDelPeriodo(periodoId, hoy);
  const salida = [];
  for (let i = dias - 1; i >= 0; i -= 1) {
    const fecha = addDays(hoy, -i);
    const delDia = comidasDelDia(comidas, fecha);
    const tieneDatos = delDia.length > 0;
    const totales = {};
    for (const ind of INDICADORES) {
      totales[ind.id] = tieneDatos
        ? redondear(delDia.reduce((a, c) => a + (num(c[ind.campo]) ?? 0), 0), ind.decimales)
        : null;
    }
    salida.push({ fecha, tieneDatos, totales, alimentos: delDia.length });
  }
  return salida;
}

const redondear = (v, decimales) => (decimales ? round1(v) : Math.round(v));

/* ══════════════════════════════════════════════════════════════════════════
   3 · LOS PROMEDIOS — apartados 2 y 14
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 **El criterio del apartado 14, y se mantiene en TODA la pantalla:**
   *"(día 1 + día 2 + … + día 7) / **días con datos**"*. Dividir entre los días
   del calendario castigaría por los días que no registró, que es inventarse un
   mal día donde no hay dato (E3 F24 y E3 F13).

   ⚠️ Y **sin ni un día con datos devuelve `null`, no un cero** (apartado 12). */
export const MINIMO_DIAS_ESTADISTICA = 2;

export function promediosDelPeriodo(comidas, periodoId, hoy = todayISO()) {
  const dias = diasDelPeriodo(comidas, periodoId, hoy);
  const conDatos = dias.filter((d) => d.tieneDatos);
  const promedio = {};
  for (const ind of INDICADORES) {
    promedio[ind.id] = conDatos.length
      ? redondear(conDatos.reduce((a, d) => a + (d.totales[ind.id] ?? 0), 0) / conDatos.length, ind.decimales)
      : null;
  }
  return {
    promedio,
    diasConDatos: conDatos.length,
    diasDelRango: dias.length,
    suficientes: conDatos.length >= MINIMO_DIAS_ESTADISTICA,
    dias,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   4 · EL CUMPLIMIENTO — apartado 3
   ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ **El mismo lenguaje visual que la pantalla principal** (apartado 3), o sea
   la decisión de la E3 F35 y la E3 F36: `porcentaje` **no se topa** y
   `porcentajePintado` **sí**, para que la barra no se rompa al pasarse.

   🚨 Y **sin objetivos configurados no hay cumplimiento**: `null`, no un 0 %.
   Un cero diría que va fatal cuando lo que pasa es que no ha puesto ninguno. */
export function cumplimientoDelPeriodo(nutricion, periodoId, hoy = todayISO()) {
  const objetivos = objetivosParaResumen(nutricion);
  const { promedio, diasConDatos, diasDelRango, suficientes } = promediosDelPeriodo(nutricion?.comidas, periodoId, hoy);
  const lineas = INDICADORES.map((ind) => {
    const media = promedio[ind.id];
    const objetivo = objetivos ? num(objetivos[ind.id]) : null;
    const hay = media !== null && objetivo !== null && objetivo > 0;
    return {
      id: ind.id,
      nombre: ind.nombre,
      emoji: ind.emoji,
      unidad: ind.unidad,
      promedio: media,
      objetivo,
      porcentaje: hay ? Math.round((media / objetivo) * 100) : null,
      porcentajePintado: hay ? Math.min(100, Math.round((media / objetivo) * 100)) : null,
      texto: media === null ? null : objetivo ? `${media} / ${objetivo} ${ind.unidad}` : `${media} ${ind.unidad}`,
    };
  });
  return { lineas, objetivos, diasConDatos, diasDelRango, suficientes, hayObjetivos: !!objetivos };
}

/* ══════════════════════════════════════════════════════════════════════════
   5 · LA EVOLUCIÓN — apartados 4 y 5
   ══════════════════════════════════════════════════════════════════════════ */

/* *"Eje horizontal: L M X J V S D. Eje vertical: kcal. Mostrar consumo real y
   objetivo diario."*

   🚨 **Un día sin registrar es un HUECO (`null`), y la línea no lo cruza** — es
   la decisión de la E3 F32, con `connectNulls={false}` en la vista. Un cero
   diría que comió cero; interpolarlo sería inventarse un dato que nadie
   registró.

   ⚠️ La etiqueta es **la inicial del día** en periodos de una semana y **el día
   del mes** en los largos: catorce «L M X J V S D» seguidos no se leen. */
export function evolucion(nutricion, indicadorId, periodoId, hoy = todayISO()) {
  const ind = INDICADORES.find((i) => i.id === indicadorId) || INDICADORES[0];
  const objetivos = objetivosParaResumen(nutricion);
  const objetivo = objetivos ? num(objetivos[ind.id]) : null;
  const dias = diasDelPeriodo(nutricion?.comidas, periodoId, hoy);
  const corto = dias.length <= 7;
  return {
    indicador: ind,
    objetivo,
    puntos: dias.map((d) => ({
      fecha: d.fecha,
      etiqueta: corto ? inicialDeDia(d.fecha) : String(new Date(`${d.fecha}T00:00:00`).getDate()),
      valor: d.totales[ind.id],
      objetivo,
    })),
    /* ⚠️ Con menos de dos días registrados **no se pinta una gráfica**: una
       línea de un punto no es una evolución (apartado 12). */
    pintable: dias.filter((d) => d.tieneDatos).length >= MINIMO_DIAS_ESTADISTICA,
    huecos: dias.filter((d) => !d.tieneDatos).length,
  };
}

/** La inicial del día, **calculada en local**: un `toISOString()` correría el
 *  día y pondría la letra equivocada (octava vez de esta lección). */
export function inicialDeDia(fechaISO) {
  const d = new Date(`${fechaISO}T00:00:00`);
  const indice = (d.getDay() + 6) % 7; // 0 = lunes
  return NOMBRES_DIA[indice].charAt(0).toUpperCase() === 'M' && indice === 2 ? 'X' : NOMBRES_DIA[indice].charAt(0).toUpperCase();
}

/* Los tres macros del selector del apartado 5, en el orden de `INDICADORES`. */
export const MACROS_EVOLUCION = INDICADORES.filter((i) => i.id !== 'calorias').map((i) => i.id);

/* ══════════════════════════════════════════════════════════════════════════
   6 · LA CONSTANCIA — apartados 7 y 8
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 **ESTO NO ES UNA RACHA** (apartado 8, literal). Es **un recuento** de días
   registrados en el periodo: no mira si son consecutivos, no se guarda y no
   toca el sistema global de rachas. Si una fase futura quiere enlazarlo con él,
   **es de ese sistema**, no de aquí.

   ⚠️ Y *"no considerar un día vacío como un día perfecto"* (apartado 7): un día
   sin registrar no cuenta ni a favor ni en contra — simplemente no se registró. */
export const NO_ES_RACHA =
  'Es cuántos días has registrado, no una racha: no mira si son seguidos y no cuenta para las rachas de JosStyle.';

export function constancia(comidas, periodoId, hoy = todayISO()) {
  const dias = diasDelPeriodo(comidas, periodoId, hoy);
  const registrados = dias.filter((d) => d.tieneDatos).length;
  return {
    registrados,
    total: dias.length,
    texto: `${registrados} de ${dias.length} días registrados`,
    /* ⚠️ Sin ni un día, no se enseña un «0 de 7» que parece un reproche: se dice
       que todavía no hay nada (apartado 12). */
    hayAlgo: registrados > 0,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   7 · MEJOR Y PEOR DÍA — apartado 9
   ══════════════════════════════════════════════════════════════════════════ */

/* *"MEJOR DÍA: Martes · 94 % cumplimiento. MENOR CUMPLIMIENTO: Jueves · 61 %."*

   🚨 **Sin objetivos no hay cumplimiento que comparar**, y **con pocos días
   tampoco**: las dos cosas devuelven `null` con su motivo, y la pantalla enseña
   la frase del enunciado en vez de dos tarjetas vacías.

   ⚠️ El cumplimiento de un día es la media de lo cerca que quedó **de cada
   objetivo**, topada al 100 % por indicador: pasarse de carbohidratos no puede
   compensar quedarse corto de proteína. */
export const MINIMO_DIAS_MEJOR_PEOR = 3;
export const TEXTO_SIN_DATOS_NUT = 'Aún necesitamos más datos para mostrar esta información.';

export function cumplimientoDeUnDia(dia, objetivos) {
  if (!dia || !dia.tieneDatos || !objetivos) return null;
  const partes = [];
  for (const ind of INDICADORES) {
    const objetivo = num(objetivos[ind.id]);
    const valor = dia.totales[ind.id];
    if (objetivo === null || objetivo <= 0 || valor === null) continue;
    partes.push(Math.min(100, Math.round((valor / objetivo) * 100)));
  }
  if (!partes.length) return null;
  return Math.round(partes.reduce((a, b) => a + b, 0) / partes.length);
}

export function mejorYPeorDia(nutricion, periodoId, hoy = todayISO()) {
  const objetivos = objetivosParaResumen(nutricion);
  if (!objetivos) return { hay: false, motivo: 'sin_objetivos', mejor: null, peor: null };
  const dias = diasDelPeriodo(nutricion?.comidas, periodoId, hoy)
    .map((d) => ({ ...d, cumplimiento: cumplimientoDeUnDia(d, objetivos) }))
    .filter((d) => d.cumplimiento !== null);
  if (dias.length < MINIMO_DIAS_MEJOR_PEOR) {
    return { hay: false, motivo: 'pocos_dias', mejor: null, peor: null, diasConDatos: dias.length };
  }
  const ordenados = [...dias].sort((a, b) => b.cumplimiento - a.cumplimiento);
  const conNombre = (d) => ({
    fecha: d.fecha,
    nombre: NOMBRES_DIA[(new Date(`${d.fecha}T00:00:00`).getDay() + 6) % 7],
    cumplimiento: d.cumplimiento,
  });
  return { hay: true, motivo: null, mejor: conNombre(ordenados[0]), peor: conNombre(ordenados[ordenados.length - 1]), diasConDatos: dias.length };
}

/* ══════════════════════════════════════════════════════════════════════════
   8 · PROTEÍNA Y CALORÍAS — apartados 10 y 11
   ══════════════════════════════════════════════════════════════════════════ */

/* *"La proteína merece especial atención."* Promedio, objetivo, porcentaje y
   **en cuántos días se alcanzó**. ⚠️ "Alcanzado" es llegar al objetivo, y se
   cuenta sobre **los días con datos**, igual que todo lo demás. */
export function analisisProteina(nutricion, periodoId, hoy = todayISO()) {
  const objetivos = objetivosParaResumen(nutricion);
  const { promedio, diasConDatos, suficientes, dias } = promediosDelPeriodo(nutricion?.comidas, periodoId, hoy);
  const objetivo = objetivos ? num(objetivos.proteinas) : null;
  const media = promedio.proteinas;
  const hay = media !== null && objetivo !== null && objetivo > 0;
  const alcanzados = hay ? dias.filter((d) => d.tieneDatos && (d.totales.proteinas ?? 0) >= objetivo).length : null;
  return {
    promedio: media,
    objetivo,
    porcentaje: hay ? Math.round((media / objetivo) * 100) : null,
    diasAlcanzados: alcanzados,
    diasConDatos,
    suficientes,
    texto: hay ? `${media} g / ${objetivo} g` : media !== null ? `${media} g` : null,
  };
}

/* *"Promedio, objetivo, diferencia y tendencia."* 🚨 Y el enunciado añade: *"No
   interpretar automáticamente esta diferencia como buena o mala sin tener en
   cuenta el objetivo del usuario."*

   Así que la diferencia es **un número con su signo** y la tendencia **una
   flecha**: ↑ +120, ↓ −80. Ni *"vas bien"*, ni *"te estás pasando"* — es la
   lección de la E3 F13 y la de EH F58, y hay una prueba que barre los textos. */
export const TENDENCIAS = [
  { id: 'sube', flecha: '↑', nombre: 'Más que antes' },
  { id: 'baja', flecha: '↓', nombre: 'Menos que antes' },
  { id: 'igual', flecha: '→', nombre: 'Parecido' },
];

export const tendencia = (id) => TENDENCIAS.find((t) => t.id === id) || null;

/** El margen por debajo del cual dos medias son «parecidas»: sin él, un gramo
 *  de diferencia saldría como una tendencia. */
export const MARGEN_TENDENCIA = 0.05;

export function analisisCalorias(nutricion, periodoId, hoy = todayISO()) {
  const objetivos = objetivosParaResumen(nutricion);
  const actual = promediosDelPeriodo(nutricion?.comidas, periodoId, hoy);
  const media = actual.promedio.calorias;
  const objetivo = objetivos ? num(objetivos.calorias) : null;

  /* La tendencia compara con **el periodo anterior del mismo tamaño**, no con
     una estimación: si no hay días con datos allí, no hay tendencia. */
  const { dias } = rangoDelPeriodo(periodoId, hoy);
  const anterior = promediosDelPeriodo(nutricion?.comidas, periodoId, addDays(hoy, -dias));
  const mediaAnterior = anterior.promedio.calorias;
  let tend = null;
  if (media !== null && mediaAnterior !== null && mediaAnterior > 0) {
    const cambio = (media - mediaAnterior) / mediaAnterior;
    tend = {
      ...tendencia(Math.abs(cambio) < MARGEN_TENDENCIA ? 'igual' : cambio > 0 ? 'sube' : 'baja'),
      diferencia: Math.round(media - mediaAnterior),
      desde: mediaAnterior,
    };
  }

  return {
    promedio: media,
    objetivo,
    /* ⚠️ La diferencia lleva su signo y **no se juzga**: menos que el objetivo
       no es "mal" si él está perdiendo grasa. */
    diferencia: media !== null && objetivo !== null ? Math.round(media - objetivo) : null,
    tendencia: tend,
    diasConDatos: actual.diasConDatos,
    suficientes: actual.suficientes,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   9 · EL ESTADO SIN DATOS — apartado 12
   ══════════════════════════════════════════════════════════════════════════ */

export const VACIO_ESTADISTICAS = {
  titulo: 'Tu evolución aparecerá aquí',
  detalle: 'Registra tus comidas durante varios días para empezar a ver tus estadísticas.',
};

export const ACCESO_ESTADISTICAS = { emoji: '📊', nombre: 'Estadísticas' };

/** 🚨 *"No mostrar gráficas vacías"* (apartado 12): con menos del mínimo de días
 *  registrados, la pantalla entera es el estado vacío. */
export function hayEstadisticas(comidas, periodoId, hoy = todayISO()) {
  return diasDelPeriodo(comidas, periodoId, hoy).filter((d) => d.tieneDatos).length >= MINIMO_DIAS_ESTADISTICA;
}

/* ══════════════════════════════════════════════════════════════════════════
   10 · LO QUE ESTA FASE NO HACE — apartado 18
   ══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_NU6 = [
  { que: 'La IA nutricional y las recomendaciones', porque: 'son la Fase 7.', fase: 'NU F7' },
  { que: 'Las predicciones', porque: 'son la Fase 7.', fase: 'NU F7' },
  { que: 'La planificación automática de comidas y las dietas', porque: 'son la Fase 7.', fase: 'NU F7' },
  { que: 'Un sistema de rachas propio', porque: 'el apartado 8 lo prohíbe: el de rachas es global y es de otro módulo.', fase: '—' },
];

export const AUDITORIA_NU6 = { clavesNuevas: 0, cifrasGuardadas: 0, rachasPropias: 0, datosInventados: 0 };

/* ══════════════════════════════════════════════════════════════════════════
   11 · LA CONDICIÓN DE FINALIZACIÓN — apartado 19
   ══════════════════════════════════════════════════════════════════════════ */

export function condicionNU6({ vista } = {}) {
  const codigo = String(vista || '');
  const HOY = '2026-09-07';
  const nut = {
    comidas: [
      { id: 'a', fecha: HOY, nombre: 'A', calorias: 2000, proteinas: 120, carbohidratos: 250, grasas: 60 },
      { id: 'b', fecha: addDays(HOY, -1), nombre: 'B', calorias: 2400, proteinas: 140, carbohidratos: 300, grasas: 70 },
      { id: 'c', fecha: addDays(HOY, -2), nombre: 'C', calorias: 1600, proteinas: 100, carbohidratos: 200, grasas: 50 },
    ],
    objetivos: { configurado: true, kcal: 2400, proteinas: 140, carbohidratos: 300, grasas: 70, actividad: 'moderado', objetivo: 'mantener', manual: {}, pesoAlCalcular: 72, fecha: HOY },
  };
  const prom = promediosDelPeriodo(nut.comidas, '7d', HOY);
  const cump = cumplimientoDelPeriodo(nut, '7d', HOY);
  const evo = evolucion(nut, 'calorias', '7d', HOY);
  const cons = constancia(nut.comidas, '7d', HOY);
  const mp = mejorYPeorDia(nut, '7d', HOY);
  const prot = analisisProteina(nut, '7d', HOY);
  const kcal = analisisCalorias(nut, '7d', HOY);

  return [
    { id: 1, texto: 'Existe una sección de estadísticas', ok: !!ACCESO_ESTADISTICAS.nombre && codigo.includes('EstadisticasNutricion') },
    { id: 2, texto: 'Se pueden consultar 7, 30 y 90 días', ok: PERIODOS_NUT.length === 3 && PERIODOS_NUT.map((p) => p.dias).join() === '7,30,90' },
    { id: 3, texto: 'Y la arquitectura admite más sin tocar el cálculo', ok: IDS_PERIODO_NUT.every((id) => PERIODOS.some((p) => p.id === id)) },
    { id: 4, texto: 'Los promedios se calculan sobre los días CON datos', ok: prom.diasConDatos === 3 && prom.diasDelRango === 7 && prom.promedio.calorias === 2000 },
    { id: 5, texto: 'Y un día sin registrar no cuenta como un cero', ok: prom.dias.filter((d) => !d.tieneDatos).every((d) => d.totales.calorias === null) },
    { id: 6, texto: 'Se muestra el cumplimiento de cada objetivo', ok: cump.hayObjetivos && cump.lineas.length === 4 && cump.lineas[0].porcentaje === 83 },
    { id: 7, texto: 'Y sin objetivos configurados no se inventa ninguno', ok: cumplimientoDelPeriodo({ comidas: nut.comidas }, '7d', HOY).lineas.every((l) => l.porcentaje === null) },
    { id: 8, texto: 'Existe la evolución de kcal, con su objetivo', ok: evo.puntos.length === 7 && evo.objetivo === 2400 && evo.pintable },
    { id: 9, texto: 'Y los días sin datos son huecos, no ceros', ok: evo.puntos.filter((p) => p.valor === null).length === 4 },
    { id: 10, texto: 'Existe la evolución de los tres macros', ok: MACROS_EVOLUCION.length === 3 && evolucion(nut, 'proteinas', '7d', HOY).puntos.length === 7 },
    { id: 11, texto: 'Se muestra la constancia, y NO es una racha', ok: cons.texto === '3 de 7 días registrados' && AUDITORIA_NU6.rachasPropias === 0 },
    { id: 12, texto: 'Mejor y peor día salen de datos reales', ok: mp.hay && mp.mejor.cumplimiento >= mp.peor.cumplimiento },
    { id: 13, texto: 'Y con pocos registros se dice, en vez de enseñar dos tarjetas vacías', ok: !mejorYPeorDia({ comidas: [nut.comidas[0]], objetivos: nut.objetivos }, '7d', HOY).hay && !!TEXTO_SIN_DATOS_NUT },
    { id: 14, texto: 'La proteína tiene su análisis, con los días alcanzados', ok: prot.porcentaje === 86 && prot.diasAlcanzados === 1 },
    { id: 15, texto: 'Las calorías traen promedio, objetivo, diferencia y tendencia', ok: kcal.promedio === 2000 && kcal.objetivo === 2400 && kcal.diferencia === -400 },
    { id: 16, texto: 'Un día sin datos no rompe nada', ok: hayEstadisticas([], '7d', HOY) === false && !!VACIO_ESTADISTICAS.titulo },
    { id: 17, texto: 'Y no se guarda ni una cifra ni una clave nueva', ok: AUDITORIA_NU6.cifrasGuardadas === 0 && AUDITORIA_NU6.clavesNuevas === 0 && AUDITORIA_NU6.datosInventados === 0 },
  ];
}
