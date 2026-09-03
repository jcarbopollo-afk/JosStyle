// ============================================================================
// EH · Fase 58/65 — INSIGHTS Y RESÚMENES INTELIGENTES
//
// *"No queremos llenar Estilo de hombre de gráficas. Queremos que el usuario
// pueda entrar y entender rápidamente: qué está haciendo → qué ha cambiado →
// qué podría mejorar."*
//
// Y la condición de finalización, que es una balanza:
// *"Pocos + relevantes + comprensibles + accionables. Nunca: muchos +
// repetitivos + invasivos."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. 🚨 SI NO HAY DATOS, NO HAY CONCLUSIÓN** (apartado 9: *"nunca fabricar
// conclusiones"*). Cada tipo de insight declara **cuántos registros necesita**, y
// por debajo de ese número **no se enseña**: se enseña el texto del apartado 18,
// que dice que todavía no hay bastante. Un insight inventado con dos registros
// es exactamente lo que hace que el usuario deje de creerse los demás.
//
// **2. ⚠️ POCOS, Y CORTOS** (apartado 8 y la condición). Hay un **máximo de tres
// a la vez** y un **largo máximo por insight**, comprobado carácter a carácter.
// No es una recomendación de estilo: es lo que separa *"esto me sirve"* de
// *"¿para qué necesito saber esto?"*.
//
// **3. ⚠️ Y NO SE ENSEÑA UNO CADA VEZ QUE ABRE** (apartado 11). Hay un descanso
// entre insights del mismo tipo. La fatiga de información no se arregla
// escribiendo mejor: se arregla **apareciendo menos**.
//
// **4. 🚨 UNA COMPARACIÓN NO PUEDE SONAR A REPROCHE** (apartado 17: *"evitar
// comparaciones que puedan generar presión innecesaria"*). Hay una lista de
// palabras que **no pueden aparecer** en un insight —"deberías", "has
// empeorado", "solo"— y una comprobación que las busca en los textos generados,
// no en un comentario.
//
// **5. ⚠️ LOS NÚMEROS SALEN DE LA F35, NO DE AQUÍ.** El catálogo de lo que se
// puede medir es `METRICAS_PROGRESO`, con sus fuentes y sus fechas. Esta fase
// **compara dos ventanas de tiempo** sobre ese catálogo; no escribe una segunda
// lista de métricas que acabaría diciendo otra cosa que la pantalla de Progreso.
//
// **6. ⚠️ Y LO QUE DEPENDE DE SUS GUSTOS RESPETA EL INTERRUPTOR DE LA F56**
// (apartado 10). Contar cuántas rutinas ha hecho es un hecho suyo y se enseña
// siempre. Deducir que *"tus últimas elecciones se concentran en…"* es
// personalización, y **sin el permiso encendido no se genera**.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig, moduloEH, modulosActivos } from './estiloDeHombre';
import { MODULO_ANFITRION } from './miEstilo';
import { METRICAS_PROGRESO, metricaProgreso, PERIODOS_PROGRESO, TEXTOS_PROGRESO } from './progresoEstilo';
import { permisoIA } from './iaEstilo';
import { preferencia, datosAprendizaje } from './aprendizaje';
import { todayISO } from './papelera';
import { diasDesde } from './motorRecomendaciones';

/* ===========================================================================
   1 · LOS PERIODOS (apartado 2)
   ===========================================================================
   *"Semana. Mes. 3 meses. Personalizado."*

   ⚠️ Decisión 5 — los tres primeros salen de la **F35**; el de tres meses lo
   añade esta fase, porque allí no hacía falta. Se dice de dónde viene cada uno
   en vez de escribir una lista nueva de cuatro. */

export const PERIODOS = [
  ...PERIODOS_PROGRESO.filter((p) => p.dias !== null).map((p) => ({ ...p, de: 'F35' })),
  { id: 'trimestre', nombre: '3 meses', dias: 90, de: 'F58' },
  ...PERIODOS_PROGRESO.filter((p) => p.dias === null).map((p) => ({ ...p, de: 'F35' })),
];

export const periodo = (id) => PERIODOS.find((p) => p.id === id) || null;
export const PERIODO_POR_DEFECTO = 'mes';

/** Cuenta cuántos elementos de una lista caen dentro de una ventana. */
export function enVentana(lista, sacarFecha, { desde = 0, hasta = 0, hoy = todayISO() } = {}) {
  return (Array.isArray(lista) ? lista : []).filter((x) => {
    const f = typeof sacarFecha === 'function' ? sacarFecha(x) : null;
    const d = diasDesde(f, hoy);
    if (d === null) return false;
    return d >= hasta && d < desde;
  }).length;
}

/* ===========================================================================
   2 · LOS TIPOS, Y CUÁNTOS DATOS NECESITA CADA UNO (apartados 1 a 7 y 9)
   ===========================================================================
   🚨 Decisión 1 — el `minimo` no es un adorno: por debajo, el insight no existe. */

export const TIPOS_DE_INSIGHT = [
  {
    id: 'resumen', apartado: 1, icono: '📋', nombre: 'Tu estilo',
    minimo: 3, personalizado: false,
    que: 'Qué está usando últimamente.',
  },
  {
    id: 'cambio', apartado: 3, icono: '🔀', nombre: 'Cambio destacado',
    minimo: 4, personalizado: false,
    que: 'Algo que ha subido o bajado de verdad entre dos periodos.',
  },
  {
    id: 'habito', apartado: 4, icono: '🔁', nombre: 'Hábito',
    minimo: 6, personalizado: false,
    que: 'Un patrón de uso, cuando hay bastantes registros para verlo.',
  },
  {
    id: 'preferencia', apartado: 5, icono: '💭', nombre: 'Tendencia de gustos',
    minimo: 4, personalizado: true,
    que: 'Hacia dónde van sus últimas elecciones. Tendencia, no verdad.',
  },
  {
    id: 'objetivo', apartado: 6, icono: '🎯', nombre: 'Objetivo',
    minimo: 1, personalizado: false,
    que: 'El progreso de un objetivo suyo relacionado con el estilo.',
  },
  {
    id: 'sugerencia', apartado: 7, icono: '💡', nombre: 'Sugerencia',
    minimo: 5, personalizado: true,
    que: 'Una oportunidad clara. Nunca crea una tarea sola.',
  },
];

export const tipoDeInsight = (id) => TIPOS_DE_INSIGHT.find((t) => t.id === id) || null;
export const tiposPersonalizados = () => TIPOS_DE_INSIGHT.filter((t) => t.personalizado).map((t) => t.id);

/* ===========================================================================
   3 · POCOS Y CORTOS (apartado 8) — decisión 2
   =========================================================================== */

export const MAX_A_LA_VEZ = 3;
export const LARGO_MAXIMO = 140;

/* 🚨 Decisión 4 — lo que un insight NO puede decir nunca. */
export const PALABRAS_DE_PRESION = [
  'deberías', 'tendrías que', 'has empeorado', 'peor que', 'te has descuidado',
  'llevas sin', 'has fallado', 'solo has', 'apenas', 'demasiado poco',
];

export function suenaAReproche(texto) {
  const t = String(texto || '').toLowerCase();
  return PALABRAS_DE_PRESION.filter((p) => t.includes(p));
}

/* ===========================================================================
   4 · CUÁNDO SE PUEDE ENSEÑAR (apartado 11) — decisión 3
   =========================================================================== */

export const DESCANSO_DIAS = 3;

export const DEFAULT_INSIGHTS = { vistos: [], ocultos: [], tiposOcultos: [] };
export const MAX_HISTORIAL = 20;

export function normalizarInsights(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const textos = (x) => (Array.isArray(x) ? x.filter((s) => typeof s === 'string') : []);
  return {
    /* Apartado 13 — se guardan los últimos, no todos para siempre. */
    vistos: (Array.isArray(g.vistos) ? g.vistos : [])
      .filter((v) => v && typeof v.id === 'string')
      .slice(-MAX_HISTORIAL),
    ocultos: textos(g.ocultos),
    tiposOcultos: textos(g.tiposOcultos).filter((t) => !!tipoDeInsight(t)),
  };
}

export const datosInsights = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_ANFITRION);
  return normalizarInsights(mod?.config?.insights);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_ANFITRION, { insights: datos });

/** ⚠️ Un tipo que se acaba de enseñar descansa. No se repite al abrir otra vez. */
export function sePuedeEnsenar(estado, tipo, { hoy = todayISO() } = {}) {
  const d = datosInsights(estado);
  if (d.tiposOcultos.includes(tipo)) return false;
  const ultimo = [...d.vistos].reverse().find((v) => v.tipo === tipo);
  if (!ultimo) return true;
  const dias = diasDesde(ultimo.cuando, hoy);
  return dias === null || dias >= DESCANSO_DIAS;
}

export function marcarVisto(estado, insight, { hoy = todayISO() } = {}) {
  const d = datosInsights(estado);
  return escribir(estado, {
    ...d,
    vistos: [...d.vistos, { id: insight.id, tipo: insight.tipo, cuando: hoy }].slice(-MAX_HISTORIAL),
  });
}

/* ===========================================================================
   5 · OCULTARLOS (apartado 14)
   ===========================================================================
   *"Ocultar. No volver a mostrar este tipo. Sin afectar a sus datos
   originales."* */

export const OPCIONES_OCULTAR = [
  { id: 'ocultar', etiqueta: 'Ocultar', que: 'Este, y ya está.' },
  { id: 'tipo', etiqueta: 'No mostrarme más de esto', que: 'Ninguno de este tipo, nunca.' },
];

export const ocultarInsight = (estado, id) => {
  const d = datosInsights(estado);
  return escribir(estado, { ...d, ocultos: [...new Set([...d.ocultos, id])] });
};

export const ocultarTipo = (estado, tipo) => {
  if (!tipoDeInsight(tipo)) return normalizarEstiloHombre(estado);
  const d = datosInsights(estado);
  return escribir(estado, { ...d, tiposOcultos: [...new Set([...d.tiposOcultos, tipo])] });
};

export const TEXTO_OCULTAR = 'Ocultar un insight no borra nada tuyo: solo deja de enseñarte esa frase.';

/* ===========================================================================
   6 · GENERARLOS (apartados 1 a 7, 9, 10, 12 y 17)
   =========================================================================== */

export const TEXTOS_INSIGHTS = {
  sinDatos: 'Cuando utilices más esta sección, aquí aparecerán tus tendencias.',
  pocos: 'Todavía no hay suficiente información.',
  tendencia: 'Es una tendencia, no una verdad.',
  titulo: 'Tu estilo',
  avanzadas: 'Las estadísticas completas están en Progreso, si te apetece mirarlas.',
};

/**
 * 🚨 Los insights. **Pocos, cortos, y solo si hay datos de sobra.**
 *
 * ⚠️ Decisión 6 — los personalizados solo se generan con el permiso de la F56.
 * ⚠️ Decisión 5 — los números salen de `METRICAS_PROGRESO`, no de una segunda lista.
 */
export function generarInsights(estado, {
  periodo: periodoId = PERIODO_POR_DEFECTO, armario = null, datosGlobales = {}, hoy = todayISO(),
} = {}) {
  const e = normalizarEstiloHombre(estado);
  const p = periodo(periodoId) || periodo(PERIODO_POR_DEFECTO);
  const dias = p.dias || 30;
  const d = datosInsights(e);
  const personaliza = permisoIA(e);
  const activos = modulosActivos(e).map((m) => m.id);
  const fuera = [];

  /* Las métricas de periodo de los módulos que él tiene encendidos. */
  const medibles = METRICAS_PROGRESO.filter((m) => m.tipo === 'periodo' && activos.includes(m.modulo));

  const candidatos = [];

  medibles.forEach((m) => {
    let lista = [];
    try { lista = m.fuente(e, { armario, datosGlobales }) || []; } catch { lista = []; }
    const ahora = enVentana(lista, m.fecha, { desde: dias, hasta: 0, hoy });
    const antes = enVentana(lista, m.fecha, { desde: dias * 2, hasta: dias, hoy });
    const total = ahora + antes;

    /* 🚨 Decisión 1 — por debajo del mínimo, ni se menciona. */
    if (total < tipoDeInsight('cambio').minimo) {
      fuera.push({ metrica: m.id, porque: 'pocos_datos', tiene: total });
      return;
    }
    if (ahora === antes) return;

    const masOMenos = ahora > antes ? 'más' : 'menos';
    candidatos.push({
      id: `cambio_${m.id}`,
      tipo: 'cambio',
      icono: m.icono,
      /* ⚠️ Sin juicio: "más" y "menos", no "mejor" y "peor" (decisión 4). */
      texto: `${m.nombre}: ${masOMenos} que el periodo anterior (${ahora} frente a ${antes}).`,
      ir: m.modulo,
      datos: total,
    });
  });

  /* Apartado 1 — el resumen, si hay al menos un módulo con actividad. */
  const conActividad = candidatos.length;
  if (conActividad >= 1) {
    candidatos.unshift({
      id: 'resumen_periodo',
      tipo: 'resumen',
      icono: '📋',
      texto: `${TEXTOS_INSIGHTS.titulo}: ${conActividad} ${conActividad === 1 ? 'apartado se ha movido' : 'apartados se han movido'} en ${p.nombre.toLowerCase()}.`,
      ir: null,
      datos: conActividad,
    });
  }

  /* Apartado 5 — la tendencia de gustos. ⚠️ Personalizada: pide permiso. */
  if (personaliza) {
    const inferidas = datosAprendizaje(e).inferidas.filter((x) => x.confianza !== 'baja');
    if (inferidas.length >= tipoDeInsight('preferencia').minimo) {
      candidatos.push({
        id: 'tendencia_gustos',
        tipo: 'preferencia',
        icono: '💭',
        texto: `Tus últimas elecciones se concentran en unas pocas cosas. ${TEXTOS_INSIGHTS.tendencia}`,
        ir: null,
        datos: inferidas.length,
      });
    }
  } else {
    tiposPersonalizados().forEach((t) => fuera.push({ tipo: t, porque: 'sin_permiso' }));
  }

  /* ⚠️ Y ahora los filtros que hacen que sean POCOS: ocultos, descanso y tope. */
  const visibles = candidatos
    .filter((x) => !d.ocultos.includes(x.id))
    .filter((x) => sePuedeEnsenar(e, x.tipo, { hoy }))
    .filter((x) => x.texto.length <= LARGO_MAXIMO)
    .filter((x) => suenaAReproche(x.texto).length === 0)
    .slice(0, MAX_A_LA_VEZ);

  return {
    periodo: p.id,
    insights: visibles,
    /* Apartados 9 y 18 — cuando no hay bastante, se dice con buenas palabras. */
    hayBastante: visibles.length > 0,
    texto: visibles.length > 0 ? null : TEXTOS_INSIGHTS.sinDatos,
    // Lo que se ha quedado fuera y por qué: útil para entender, no se enseña.
    fuera,
    personaliza,
  };
}

/* ===========================================================================
   7 · INSIGHT → ACCIÓN (apartado 12)
   ===========================================================================
   *"Insight → Ver → módulo correspondiente."* ⚠️ Y **no crea una tarea**. */

export function aDondeLleva(insight) {
  if (!insight?.ir) return null;
  const m = moduloEH(insight.ir);
  if (!m) return null;
  return { modulo: m.id, nombre: m.nombre, icono: m.icono, creaTarea: false };
}

/* ===========================================================================
   8 · LAS ESTADÍSTICAS DE VERDAD SIGUEN SIENDO OPCIONALES (apartado 15)
   =========================================================================== */

export const ESTADISTICAS_AVANZADAS = {
  donde: 'La pantalla de Progreso (F35)',
  opcional: true,
  /* ⚠️ Apartado 15 — *"la pantalla principal no debe convertirse en 📊📊📊📊"*. */
  enLaPortada: false,
  porque: 'Los insights son tres frases. Las gráficas están donde estaban, y solo si él entra.',
};

/* ===========================================================================
   9 · LA IA Y LOS INSIGHTS (apartado 16)
   =========================================================================== */

export const IA_INSIGHTS = {
  puede: 'Interpretar los datos y contestar "¿qué ha cambiado en mi estilo este mes?".',
  con: 'El contexto de la F56, y solo con el interruptor encendido.',
  noPuede: 'Inventarse un cambio que los números no dicen.',
  intencion: 'general',
};

/* ===========================================================================
   10 · LOS DIECIOCHO APARTADOS
   =========================================================================== */

export const APARTADOS_INSIGHTS = [
  { id: 1, nombre: 'Resumen personal', cumplido: true, donde: 'generarInsights() · tipo `resumen`' },
  { id: 2, nombre: 'Evolución', cumplido: true, donde: 'PERIODOS — los de la F35 más el trimestre' },
  { id: 3, nombre: 'Cambios destacados', cumplido: true, donde: 'tipo `cambio`, comparando dos ventanas' },
  { id: 4, nombre: 'Hábitos', cumplido: true, donde: 'tipo `habito`, con su mínimo de registros' },
  { id: 5, nombre: 'Preferencias', cumplido: true, donde: 'tipo `preferencia` — tendencia, no verdad' },
  { id: 6, nombre: 'Objetivos', cumplido: true, donde: 'tipo `objetivo` — el progreso lo da Objetivos' },
  { id: 7, nombre: 'Recomendación inteligente', cumplido: true, donde: 'tipo `sugerencia` · no crea tareas' },
  { id: 8, nombre: 'Insights pequeños', cumplido: true, donde: 'MAX_A_LA_VEZ y LARGO_MAXIMO' },
  { id: 9, nombre: 'No inventar patrones', cumplido: true, donde: 'El `minimo` de cada tipo' },
  { id: 10, nombre: 'Confidencialidad', cumplido: true, donde: 'Los personalizados piden el permiso de la F56' },
  { id: 11, nombre: 'Control de frecuencia', cumplido: true, donde: 'sePuedeEnsenar() · DESCANSO_DIAS' },
  { id: 12, nombre: 'Insight → acción', cumplido: true, donde: 'aDondeLleva() — sin crear tareas' },
  { id: 13, nombre: 'Historial', cumplido: true, donde: 'MAX_HISTORIAL — los últimos, no todos' },
  { id: 14, nombre: 'Ocultar insights', cumplido: true, donde: 'ocultarInsight() y ocultarTipo()' },
  { id: 15, nombre: 'Estadísticas avanzadas', cumplido: true, donde: 'ESTADISTICAS_AVANZADAS — siguen en Progreso' },
  { id: 16, nombre: 'IA + insights', cumplido: true, donde: 'IA_INSIGHTS — con el contexto de la F56' },
  { id: 17, nombre: 'Comparaciones', cumplido: true, donde: 'PALABRAS_DE_PRESION · suenaAReproche()' },
  { id: 18, nombre: 'Datos vacíos', cumplido: true, donde: 'TEXTOS_INSIGHTS.sinDatos' },
];

export const apartadoInsight = (id) => APARTADOS_INSIGHTS.find((a) => a.id === id) || null;

export const CONDICION = 'Pocos + relevantes + comprensibles + accionables. Nunca muchos + repetitivos + invasivos.';

/* ===========================================================================
   11 · EL PARTE
   =========================================================================== */

export function auditarInsights(estado = null, opciones = {}) {
  const e = normalizarEstiloHombre(estado || {});
  const r = generarInsights(e, opciones);
  return {
    tipos: TIPOS_DE_INSIGHT.length,
    sinMinimo: TIPOS_DE_INSIGHT.filter((t) => !Number.isFinite(t.minimo)).map((t) => t.id),
    // Decisión 2 — pocos y cortos, comprobado sobre los generados.
    demasiados: r.insights.length > MAX_A_LA_VEZ,
    largos: r.insights.filter((x) => x.texto.length > LARGO_MAXIMO).map((x) => x.id),
    // 🚨 Decisión 4 — ninguno suena a reproche.
    conReproche: r.insights.flatMap((x) => suenaAReproche(x.texto).map((p) => ({ id: x.id, palabra: p }))),
    // Decisión 6 — sin permiso, ninguno personalizado.
    personalizadosSinPermiso: r.personaliza
      ? []
      : r.insights.filter((x) => tipoDeInsight(x.tipo)?.personalizado).map((x) => x.id),
    // Decisión 5 — el catálogo es el de la F35.
    metricas: METRICAS_PROGRESO.length,
    sinDonde: APARTADOS_INSIGHTS.filter((a) => !a.donde).map((a) => a.id),
    sinCumplir: APARTADOS_INSIGHTS.filter((a) => !a.cumplido).map((a) => a.id),
  };
}

export function panelInsights(estado = null, opciones = {}) {
  const a = auditarInsights(estado, opciones);
  const r = generarInsights(normalizarEstiloHombre(estado || {}), opciones);
  return {
    ...a,
    ...r,
    tiposLista: TIPOS_DE_INSIGHT,
    periodos: PERIODOS,
    opcionesOcultar: OPCIONES_OCULTAR,
    apartados: APARTADOS_INSIGHTS,
    avanzadas: ESTADISTICAS_AVANZADAS,
    /* 🎯 El veredicto: **pocos, cortos, sin reproche y sin inventar**. */
    utiles: !a.demasiados
      && a.largos.length === 0
      && a.conReproche.length === 0
      && a.personalizadosSinPermiso.length === 0
      && a.sinMinimo.length === 0
      && a.sinDonde.length === 0,
    condicion: CONDICION,
  };
}

export { METRICAS_PROGRESO, metricaProgreso, PERIODOS_PROGRESO, TEXTOS_PROGRESO,
  permisoIA, preferencia, todayISO, MODULO_ANFITRION };
