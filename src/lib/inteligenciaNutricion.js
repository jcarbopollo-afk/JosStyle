/* ══════════════════════════════════════════════════════════════════════════
   INTELIGENCIA NUTRICIONAL — Entrega 3 · Fase 39 (NU F7)

   *"¿Cómo lo estoy haciendo y qué debería tener en cuenta?"*, contestado con
   **sus datos**, no con consejos de revista.

   ── 🔒 LA TENSIÓN QUE ESTA FASE RESUELVE ────────────────────────────────────
   El apartado 11 de la **NU F6** prohibía interpretar una desviación *"como
   buena o mala **sin tener en cuenta el objetivo del usuario**"*, y el apartado
   10 de **esta** fase dice exactamente eso: *"las interpretaciones deben tener
   en cuenta el objetivo configurado… una desviación calórica no debe
   interpretarse igual para todos"*. No son dos enunciados que se contradigan:
   la F6 prohibía interpretar **sin** el objetivo, y ésta es la fase que lo trae
   (E3 F21 — *cuando dos fases se contradicen, manda la que construye la
   función*). Por eso aquí **no hay ni una frase que no mire su objetivo**.

   ⚠️ Y los límites siguen puestos, porque los pone el propio enunciado:
   *"evitar mensajes alarmistas"* (4), *"no prescribir dietas médicas"* (9) y
   **nunca** *"nunca meriendas"* (6). Se describe la relación con **su** objetivo;
   no se le pone nota.

   🚨 **Y NADA DE ESTO LLAMA A LA IA** (apartado 13: *"NO conectar automáticamente
   la API a cada renderizado"*). El análisis es **local y de reglas**, siempre; la
   IA generativa sigue siendo el panel de un toque que ya existe (regla 7). Por
   eso el apartado 15 —*"si la IA no está disponible, la aplicación debe seguir
   funcionando perfectamente"*— **sale gratis**: la IA nunca fue el camino
   principal.
   ══════════════════════════════════════════════════════════════════════════ */

import {
  promediosDelPeriodo, cumplimientoDelPeriodo, diasDelPeriodo, constancia,
  PERIODO_NUT_POR_DEFECTO,
} from './estadisticasNutricion.js';
import { MOMENTOS, INDICADORES } from './nutricion.js';
import { objetivosParaResumen, objetivoNut, normalizarObjetivosNut } from './objetivosNutricion.js';
import { todayISO } from './helpers.js';

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const round1 = (v) => Math.round(v * 10) / 10;

/* ══════════════════════════════════════════════════════════════════════════
   1 · EL NIVEL DE CONFIANZA — apartado 8
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 *"No mostrar análisis demasiado específicos con pocos datos."* El enunciado
   da la escala entera, y **cada nivel declara qué permite**: así una regla no se
   puede disparar con menos datos de los que necesita — es `requiere` de
   `motorRecomendaciones.js` (EH F16) en otra forma.

   ⚠️ Y con un día **no se dice nada**: *"necesitamos más datos para detectar
   tendencias"* es literal del apartado 8. */
export const NIVELES_CONFIANZA = [
  { id: 'ninguno', minimo: 0, permite: [], texto: 'Necesitamos más datos para detectar tendencias.' },
  { id: 'basico', minimo: 3, permite: ['observacion'], texto: 'Con los días que llevas se pueden ver algunas cosas básicas.' },
  { id: 'tendencias', minimo: 7, permite: ['observacion', 'tendencia'], texto: 'Ya hay datos para ver tendencias.' },
  { id: 'solido', minimo: 30, permite: ['observacion', 'tendencia', 'solido'], texto: 'Hay datos de sobra para ver tu patrón.' },
];

export function nivelDeConfianza(diasConDatos) {
  const n = num(diasConDatos) ?? 0;
  return [...NIVELES_CONFIANZA].reverse().find((x) => n >= x.minimo) || NIVELES_CONFIANZA[0];
}

export const permite = (nivel, clase) => !!nivel && nivel.permite.includes(clase);

/* ══════════════════════════════════════════════════════════════════════════
   2 · «NO REGISTRADO» NO ES «NO CONSUMIDO» — apartados 6 y 7
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 El enunciado lo marca como *"MUY IMPORTANTE"*: *"si el usuario no registra
   una comida, no asumir que no ha comido"*. Y da el ejemplo exacto de cómo se
   dice y cómo no:

       ✅ «La merienda no suele aparecer en tus registros.»
       ❌ «Nunca meriendas.»

   Así que **toda frase de esta fase habla de los REGISTROS**, no de lo que comió.
   Hay una prueba que barre todos los textos generados buscando la forma
   prohibida. */
export const NO_REGISTRADO_NO_ES_NO_CONSUMIDO =
  'Todo esto sale de lo que has registrado. Si un día no apuntaste algo, aquí no aparece — pero eso no quiere decir que no lo comieras.';

export const FORMAS_PROHIBIDAS = [
  'nunca comes', 'nunca meriendas', 'nunca desayunas', 'no comes', 'no desayunas',
  'no meriendas', 'no cenas', 'te saltas',
];

/** El barrido que lo comprueba: una frase que afirme lo que **no** come, en vez
 *  de lo que no registró, es la que el apartado 6 prohíbe. */
export const hablaDeRegistros = (texto) => {
  const t = String(texto || '').toLowerCase();
  return !FORMAS_PROHIBIDAS.some((f) => t.includes(f));
};

/* ══════════════════════════════════════════════════════════════════════════
   3 · LA PROTEÍNA — apartado 3
   ══════════════════════════════════════════════════════════════════════════ */

/** Cuánto se considera «cerca» del objetivo: sin un margen, un gramo de más o
 *  de menos ya sería un aviso. */
export const MARGEN_CERCA = 0.1;

export function analisisProteinaInteligente(nutricion, periodoId = PERIODO_NUT_POR_DEFECTO, hoy = todayISO()) {
  const objetivos = objetivosParaResumen(nutricion);
  const { promedio, diasConDatos } = promediosDelPeriodo(nutricion?.comidas, periodoId, hoy);
  const nivel = nivelDeConfianza(diasConDatos);
  const media = promedio.proteinas;
  const objetivo = objetivos ? num(objetivos.proteinas) : null;

  if (!permite(nivel, 'observacion')) return { hay: false, motivo: 'pocos_datos', nivel };
  if (media === null || objetivo === null || objetivo <= 0) return { hay: false, motivo: 'sin_objetivo', nivel };

  const desvio = (media - objetivo) / objetivo;
  const faltan = Math.max(0, Math.round(objetivo - media));

  if (Math.abs(desvio) <= MARGEN_CERCA) {
    return {
      hay: true, nivel, estado: 'en_objetivo', faltan: 0,
      titulo: 'Proteína en objetivo',
      /* La frase del apartado 3, literal. */
      texto: 'Tu promedio de esta semana está muy cerca de tu objetivo diario.',
      accion: null,
    };
  }
  if (desvio < 0) {
    return {
      hay: true, nivel, estado: 'baja', faltan,
      titulo: 'Proteína por debajo',
      texto: `Tu promedio está un ${Math.abs(Math.round(desvio * 100))} % por debajo de tu objetivo.`,
      /* Apartado 9 — *"simples y accionables"*, con el número: *"te faltan 35 g
         de proteína"* es mejor que un párrafo. */
      accion: `Te faltan ${faltan} g de proteína al día para llegar a tu objetivo. Podrías añadir una fuente de proteína en alguna comida.`,
    };
  }
  return {
    hay: true, nivel, estado: 'alta', faltan: 0,
    titulo: 'Proteína por encima',
    texto: `Tu promedio está un ${Math.round(desvio * 100)} % por encima de tu objetivo.`,
    accion: null,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   4 · LAS CALORÍAS, SEGÚN SU OBJETIVO — apartados 4 y 10
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 **Aquí es donde el apartado 10 cambia las cosas.** Comer por debajo del
   objetivo no significa lo mismo si está **perdiendo grasa** que si está
   **ganando masa**, así que la misma desviación se cuenta con palabras
   distintas — y en los tres casos **describiendo**, nunca alarmando
   (apartado 4).

   ⚠️ Sin objetivo configurado **no se interpreta nada**: se dice el número y ya,
   que es lo que hacía la F6. */
export const MARGEN_LIGERO = 0.05;
export const MARGEN_BASTANTE = 0.15;

export function analisisCaloriasInteligente(nutricion, periodoId = PERIODO_NUT_POR_DEFECTO, hoy = todayISO()) {
  const objetivos = objetivosParaResumen(nutricion);
  const guardados = normalizarObjetivosNut(nutricion?.objetivos);
  const { promedio, diasConDatos } = promediosDelPeriodo(nutricion?.comidas, periodoId, hoy);
  const nivel = nivelDeConfianza(diasConDatos);
  const media = promedio.calorias;
  const objetivo = objetivos ? num(objetivos.calorias) : null;
  const suObjetivo = objetivoNut(guardados.objetivo);

  if (!permite(nivel, 'observacion')) return { hay: false, motivo: 'pocos_datos', nivel };
  if (media === null || objetivo === null || objetivo <= 0) return { hay: false, motivo: 'sin_objetivo', nivel };

  const desvio = (media - objetivo) / objetivo;
  const diferencia = Math.round(media - objetivo);
  const cerca = Math.abs(desvio) <= MARGEN_LIGERO;
  const mucho = Math.abs(desvio) >= MARGEN_BASTANTE;
  const lado = desvio < 0 ? 'debajo' : 'encima';

  const cuanto = cerca ? 'bastante cerca de' : mucho ? `bastante por ${lado} de` : `ligeramente por ${lado} de`;
  let texto = `Tu consumo está ${cuanto} tu objetivo esta semana.`;

  /* 🔒 El apartado 10 en una frase: **qué significa eso PARA LO QUE ÉL QUIERE**.
     Y nunca un juicio: se dice hacia dónde va respecto a lo que él eligió. */
  let segunObjetivo = null;
  if (suObjetivo) {
    /* ⚠️ **También cuando está cerca**, porque estar cerca significa una cosa
       distinta según lo que él busque: para mantener es justo el sitio, y para
       ganar o perder es quedarse donde estaba. Dejarlo fuera del caso «cerca»
       era construir el apartado 10 a medias. */
    if (cerca) {
      segunObjetivo = suObjetivo.id === 'mantener'
        ? 'Tu objetivo es mantener, y quedarte cerca de esa cifra es justo lo que buscas.'
        : `Tu objetivo es ${suObjetivo.nombre.toLowerCase()}, y esa cifra ya lleva el ajuste puesto: quedarte cerca de ella va en esa dirección.`;
    } else if (suObjetivo.id === 'perder') {
      segunObjetivo = lado === 'debajo'
        ? 'Tu objetivo es perder grasa, así que comer algo por debajo va en esa dirección.'
        : 'Tu objetivo es perder grasa, y estos días has comido por encima de lo que calculaste.';
    } else if (suObjetivo.id === 'ganar') {
      segunObjetivo = lado === 'encima'
        ? 'Tu objetivo es ganar masa, así que comer algo por encima va en esa dirección.'
        : 'Tu objetivo es ganar masa, y estos días has comido por debajo de lo que calculaste.';
    } else {
      segunObjetivo = 'Tu objetivo es mantener, así que lo que buscas es quedarte cerca de esa cifra.';
    }
  }

  return {
    hay: true, nivel, estado: cerca ? 'cerca' : `${mucho ? 'mucho' : 'poco'}_${lado}`,
    diferencia, texto, segunObjetivo,
    objetivoUsuario: suObjetivo ? suObjetivo.nombre : null,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   5 · LA REGULARIDAD — apartado 5
   ══════════════════════════════════════════════════════════════════════════ */

/* *"Detectar variaciones importantes… el objetivo no es que todos los días sean
   idénticos, sino detectar patrones que puedan ser relevantes."*

   ⚠️ Se mide con el **coeficiente de variación** sobre los días con datos: una
   desviación de 400 kcal no significa lo mismo comiendo 1500 que 3500. Y hace
   falta el nivel de tendencias: con tres días, dos altos y uno bajo parecen una
   variación y son una casualidad. */
export const UMBRAL_VARIACION = 0.2;

export function regularidad(nutricion, periodoId = PERIODO_NUT_POR_DEFECTO, hoy = todayISO()) {
  const { promedio, diasConDatos, dias } = promediosDelPeriodo(nutricion?.comidas, periodoId, hoy);
  const nivel = nivelDeConfianza(diasConDatos);
  const media = promedio.calorias;
  if (!permite(nivel, 'tendencia') || media === null || media <= 0) {
    return { hay: false, motivo: permite(nivel, 'tendencia') ? 'sin_datos' : 'pocos_datos', nivel };
  }
  const valores = dias.filter((d) => d.tieneDatos).map((d) => d.totales.calorias ?? 0);
  const varianza = valores.reduce((a, v) => a + (v - media) ** 2, 0) / valores.length;
  const cv = Math.sqrt(varianza) / media;
  return {
    hay: true, nivel,
    variacion: round1(cv * 100),
    estable: cv < UMBRAL_VARIACION,
    texto: cv < UMBRAL_VARIACION
      ? 'Tu consumo se mantiene bastante estable entre días.'
      : 'Tu consumo cambia bastante entre días.',
    /* ⚠️ Y se dice que eso no es un problema en sí: lo dice el propio apartado. */
    matiz: cv < UMBRAL_VARIACION ? null : 'No tiene por qué ser algo malo: es solo un patrón que se ve en tus registros.',
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   6 · LA DISTRIBUCIÓN DE COMIDAS — apartados 6 y 7
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 El ejemplo del apartado 6, en código: si la merienda casi no aparece, se
   dice **que no aparece en sus registros**, nunca que no merienda. */
export const UMBRAL_POCO_FRECUENTE = 0.25;

export function distribucionComidas(nutricion, periodoId = PERIODO_NUT_POR_DEFECTO, hoy = todayISO()) {
  const dias = diasDelPeriodo(nutricion?.comidas, periodoId, hoy);
  const conDatos = dias.filter((d) => d.tieneDatos);
  const nivel = nivelDeConfianza(conDatos.length);
  if (!permite(nivel, 'observacion')) return { hay: false, motivo: 'pocos_datos', nivel, momentos: [] };

  const comidas = Array.isArray(nutricion?.comidas) ? nutricion.comidas : [];
  const fechasConDatos = new Set(conDatos.map((d) => d.fecha));
  const momentos = MOMENTOS.map((m) => {
    const diasCon = new Set(
      comidas.filter((c) => c && fechasConDatos.has(c.fecha) && (c.momento || 'extras') === m.id).map((c) => c.fecha),
    ).size;
    return { id: m.id, nombre: m.nombre, emoji: m.emoji, dias: diasCon, proporcion: diasCon / conDatos.length };
  });

  /* ⚠️ Extras no se cuenta como una comida que «falta»: es el cajón de lo que no
     encaja en las otras cuatro, no un momento del día que él se salte. */
  const pocoFrecuentes = momentos.filter((m) => m.id !== 'extras' && m.proporcion < UMBRAL_POCO_FRECUENTE);
  return {
    hay: true, nivel, momentos, pocoFrecuentes,
    textos: pocoFrecuentes.map((m) => `${m.emoji} La ${m.nombre.toLowerCase()} no suele aparecer en tus registros.`),
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   7 · LOS PATRONES Y EL PANEL — apartados 1 y 2
   ══════════════════════════════════════════════════════════════════════════ */

export const TITULO_PANEL = '🧠 Análisis nutricional';

/* ⚠️ *"Evitar textos largos"* (apartado 1): el resumen son **dos frases como
   mucho**, y hay una prueba que lo comprueba. */
export const MAX_FRASES_RESUMEN = 2;

/** El análisis entero, de **una sola pasada** (apartado 13 de la F6: no
 *  recalcular en cada pintado). Devuelve lo que la pantalla necesita y nada más. */
export function analizarNutricion(nutricion, periodoId = PERIODO_NUT_POR_DEFECTO, hoy = todayISO()) {
  const { diasConDatos, diasDelRango } = promediosDelPeriodo(nutricion?.comidas, periodoId, hoy);
  const nivel = nivelDeConfianza(diasConDatos);
  const prot = analisisProteinaInteligente(nutricion, periodoId, hoy);
  const kcal = analisisCaloriasInteligente(nutricion, periodoId, hoy);
  const reg = regularidad(nutricion, periodoId, hoy);
  const dist = distribucionComidas(nutricion, periodoId, hoy);
  const cons = constancia(nutricion?.comidas, periodoId, hoy);

  /* Apartado 2 — los patrones detectados, **solo los que sus datos sostienen**.

     🐛 **Y la puerta del nivel se cierra ANTES de construirlos.** El patrón de
     *"días con registros incompletos"* no depende de ninguno de los análisis de
     arriba, así que **se colaba con un solo día registrado** — justo lo que el
     apartado 8 prohíbe: *"no mostrar análisis demasiado específicos con pocos
     datos"*. La comprobación del nivel va una sola vez, aquí, y vale para todos. */
  const patrones = [];
  if (!permite(nivel, 'observacion')) {
    return {
      nivel, diasConDatos, diasDelRango,
      resumen: null, sinDatos: nivel.texto, patrones: [],
      proteina: prot, calorias: kcal, regularidad: reg, distribucion: dist,
      recomendaciones: [], aviso: NO_REGISTRADO_NO_ES_NO_CONSUMIDO,
    };
  }
  if (prot.hay) patrones.push({ id: `proteina_${prot.estado}`, texto: prot.texto });
  if (kcal.hay) patrones.push({ id: `calorias_${kcal.estado}`, texto: kcal.texto });
  if (reg.hay && !reg.estable) patrones.push({ id: 'variacion', texto: reg.texto });
  for (const t of dist.textos || []) patrones.push({ id: 'comida_poco_frecuente', texto: t });
  /* *"Días con registros incompletos"* (apartado 2), dicho como registros. */
  if (cons.hayAlgo && cons.registrados < cons.total) {
    patrones.push({ id: 'dias_sin_registrar', texto: `Has registrado ${cons.registrados} de los ${cons.total} días.` });
  }

  /* Apartado 1 — el resumen corto, hecho de lo que de verdad se ha detectado. */
  const frases = [];
  if (prot.hay) frases.push(prot.estado === 'en_objetivo' ? 'Tu proteína está cerca de tu objetivo' : prot.estado === 'baja' ? 'Tu proteína va por debajo de tu objetivo' : 'Tu proteína va por encima de tu objetivo');
  if (reg.hay) frases.push(reg.estable ? 'y tu consumo calórico se mantiene bastante estable' : 'y tu consumo calórico cambia bastante entre días');
  else if (kcal.hay) frases.push(kcal.estado === 'cerca' ? 'y tus calorías están cerca de tu objetivo' : 'y tus calorías se separan de tu objetivo');

  return {
    nivel,
    diasConDatos,
    diasDelRango,
    /* 🚨 Con pocos datos **no hay resumen**, hay la frase del apartado 8. */
    resumen: permite(nivel, 'observacion') && frases.length ? `${frases.join(' ')}.` : null,
    sinDatos: permite(nivel, 'observacion') ? null : nivel.texto,
    patrones,
    proteina: prot,
    calorias: kcal,
    regularidad: reg,
    distribucion: dist,
    /* Apartado 9 — las recomendaciones, simples y con su número. */
    recomendaciones: [prot.accion].filter(Boolean),
    aviso: NO_REGISTRADO_NO_ES_NO_CONSUMIDO,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   8 · EL RESUMEN REUTILIZABLE — apartados 11 y 12
   ══════════════════════════════════════════════════════════════════════════ */

/* *"Preparar un resumen pequeño que pueda aparecer posteriormente en HOY… el
   componente debe ser reutilizable."*

   ⚠️ **Y se usa de verdad**, en la cabecera del propio panel: una función que
   nadie llama no falla nunca, y este proyecto ya ha tenido tres (E3 F1, E3 F5,
   E3 F16). El día que Hoy la quiera, la llama y ya está.

   ⚠️ *"Mostrar alertas únicamente cuando aporten valor"* (apartado 12): sin
   objetivos o sin datos devuelve `null`, no una plaquita vacía. */
export function resumenParaHoy(nutricion, hoy = todayISO()) {
  const objetivos = objetivosParaResumen(nutricion);
  const dia = diasDelPeriodo(nutricion?.comidas, '7d', hoy).find((d) => d.fecha === hoy);
  if (!dia || !dia.tieneDatos) return null;
  if (!objetivos) {
    return { id: 'consumido', texto: `${dia.totales.calorias} kcal registradas hoy`, emoji: '🔥' };
  }
  const objetivoKcal = num(objetivos.calorias);
  const objetivoProt = num(objetivos.proteinas);
  const restanKcal = objetivoKcal !== null ? Math.round(objetivoKcal - (dia.totales.calorias ?? 0)) : null;
  const restanProt = objetivoProt !== null ? Math.round(objetivoProt - (dia.totales.proteinas ?? 0)) : null;

  /* Los tres ejemplos del apartado 12, por orden de utilidad: lo que falta
     primero, y si ya llegó, que llegó. */
  if (restanProt !== null && restanProt > 0) {
    return { id: 'falta_proteina', texto: `Te quedan ${restanProt} g de proteína`, emoji: '💪' };
  }
  if (restanKcal !== null && restanKcal > 0) {
    return { id: 'falta_kcal', texto: `Te quedan ${restanKcal} kcal`, emoji: '🔥' };
  }
  if (restanKcal !== null && restanKcal <= 0) {
    return { id: 'objetivo_kcal', texto: 'Has alcanzado tu objetivo calórico', emoji: '✅' };
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════════════════
   9 · LA IA GENERATIVA — apartados 13, 14 y 15
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 *"NO conectar automáticamente la API a cada renderizado"* (13) y *"no
   enviar datos innecesarios"* (14). Esto **no llama a nadie**: construye el
   contexto que el panel de un toque ya existente mandará, y solo lo necesario
   —promedios, objetivos y cuántos días hay—, **nunca las comidas una a una**.

   ⚠️ El apartado 15 se cumple solo: el análisis de arriba es local y de reglas,
   así que si la IA no contesta, la pantalla no pierde nada. */
export const LO_QUE_VIAJA_A_LA_IA = ['promedios', 'objetivos', 'días con datos', 'patrones detectados'];
export const LO_QUE_NO_VIAJA = ['cada comida una a una', 'el peso y la altura', 'nada de otros módulos'];

export function contextoIANutricion(nutricion, periodoId = PERIODO_NUT_POR_DEFECTO, hoy = todayISO()) {
  const a = analizarNutricion(nutricion, periodoId, hoy);
  const { promedio } = promediosDelPeriodo(nutricion?.comidas, periodoId, hoy);
  const objetivos = objetivosParaResumen(nutricion);
  const guardados = normalizarObjetivosNut(nutricion?.objetivos);
  return {
    diasConDatos: a.diasConDatos,
    diasDelRango: a.diasDelRango,
    promedios: promedio,
    objetivos: objetivos || null,
    objetivoDelUsuario: guardados.objetivo || null,
    patrones: a.patrones.map((p) => p.id),
  };
}

export const FALLBACK = {
  hay: true,
  como: 'El análisis es local y de reglas: la IA es un extra de un toque, no el camino principal.',
};

/* ══════════════════════════════════════════════════════════════════════════
   10 · LO QUE ESTA FASE NO HACE — apartado 17
   ══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_NU7 = [
  { que: 'Dietas médicas y prescripción nutricional', porque: 'el apartado 17 las excluye, y la regla 7 del proyecto también.', fase: '—' },
  { que: 'Diagnósticos y predicciones médicas', porque: 'el apartado 17 las excluye.', fase: '—' },
  { que: 'La automatización de comidas y la compra de alimentos', porque: 'el apartado 17 las excluye.', fase: '—' },
  { que: 'El pulido final y la QA del apartado', porque: 'son la Fase 8.', fase: 'NU F8' },
];

/* ⚠️ Las palabras que no pueden salir de aquí: las clínicas son la lista de
   EH F13 en espíritu, y las alarmistas las prohíbe el apartado 4. */
export const PALABRAS_PROHIBIDAS_NUT = [
  'debes', 'tienes que', 'obligatorio', 'peligroso', 'grave', 'riesgo',
  'déficit peligroso', 'malnutrición', 'trastorno', 'enfermedad', 'diagnóstico',
  'prescribo', 'receta', 'dieta médica', 'urgente', 'alarma',
];

export const sinAlarmismo = (texto) => {
  const t = String(texto || '').toLowerCase();
  return !PALABRAS_PROHIBIDAS_NUT.some((p) => t.includes(p));
};

export const AUDITORIA_NU7 = { clavesNuevas: 0, llamadasAutomaticasIA: 0, cifrasGuardadas: 0, diagnosticos: 0 };

/* ══════════════════════════════════════════════════════════════════════════
   11 · LA CONDICIÓN DE FINALIZACIÓN — apartado 18
   ══════════════════════════════════════════════════════════════════════════ */

export function condicionNU7({ vista } = {}) {
  const codigo = String(vista || '');
  const HOY = '2026-09-07';
  const dia = (n) => {
    const d = new Date(`${HOY}T00:00:00`);
    d.setDate(d.getDate() - n);
    return d.toLocaleDateString('sv-SE');
  };
  const comidas = [];
  for (let i = 0; i < 8; i += 1) {
    comidas.push({ id: `d${i}`, fecha: dia(i), momento: 'comida', nombre: 'C', calorias: 2000 + (i % 2 ? 100 : -100), proteinas: 110, carbohidratos: 250, grasas: 60 });
    comidas.push({ id: `e${i}`, fecha: dia(i), momento: 'desayuno', nombre: 'D', calorias: 300, proteinas: 15, carbohidratos: 40, grasas: 8 });
  }
  const nut = {
    comidas,
    objetivos: { configurado: true, kcal: 2400, proteinas: 140, carbohidratos: 300, grasas: 70, actividad: 'moderado', objetivo: 'ganar', manual: {}, pesoAlCalcular: 72, fecha: HOY },
  };
  const a = analizarNutricion(nut, '7d', HOY);
  const pocos = analizarNutricion({ comidas: [comidas[0]], objetivos: nut.objetivos }, '7d', HOY);
  const sinObj = analizarNutricion({ comidas }, '7d', HOY);
  const todos = [
    a.resumen, a.aviso, ...a.patrones.map((p) => p.texto), ...a.recomendaciones,
    a.proteina.texto, a.proteina.accion, a.calorias.texto, a.calorias.segunObjetivo,
    a.regularidad.texto, a.regularidad.matiz, ...(a.distribucion.textos || []),
  ].filter(Boolean);

  return [
    { id: 1, texto: 'Existe el análisis nutricional', ok: !!a.resumen && codigo.includes('AnalisisNutricional') },
    { id: 2, texto: 'Detecta patrones reales, sacados de sus datos', ok: a.patrones.length >= 2 && a.patrones.every((p) => p.id && p.texto) },
    { id: 3, texto: 'Analiza la proteína, con su número', ok: a.proteina.hay && a.proteina.estado === 'baja' && a.proteina.faltan === 15 },
    { id: 4, texto: 'Analiza las calorías', ok: a.calorias.hay && typeof a.calorias.diferencia === 'number' },
    { id: 5, texto: 'Analiza la regularidad', ok: a.regularidad.hay && a.regularidad.estable === true },
    { id: 6, texto: 'Diferencia «no registrado» de «no consumido»', ok: todos.every(hablaDeRegistros) && /no quiere decir que no lo comieras/i.test(a.aviso) },
    { id: 7, texto: 'Y la comida que no aparece se dice como registro', ok: (a.distribucion.textos || []).every((t) => /no suele aparecer en tus registros/.test(t)) },
    { id: 8, texto: '🔒 Respeta el objetivo del usuario', ok: /ganar masa/i.test(a.calorias.segunObjetivo || '') && a.calorias.objetivoUsuario === 'Ganar masa' },
    { id: 9, texto: 'Adapta el nivel de análisis a la cantidad de datos', ok: NIVELES_CONFIANZA.length === 4 && a.nivel.id === 'tendencias' && pocos.nivel.id === 'ninguno' },
    { id: 10, texto: 'Y con un solo día no dice nada: pide más datos', ok: pocos.resumen === null && /más datos/i.test(pocos.sinDatos || '') },
    { id: 11, texto: 'Sin objetivos no interpreta, que es lo que pedía la F6', ok: !sinObj.proteina.hay && sinObj.proteina.motivo === 'sin_objetivo' },
    { id: 12, texto: 'Da recomendaciones simples, con su cifra', ok: a.recomendaciones.length === 1 && /15 g de proteína/.test(a.recomendaciones[0]) },
    { id: 13, texto: 'Tiene fallback sin IA: el análisis es local', ok: FALLBACK.hay && AUDITORIA_NU7.llamadasAutomaticasIA === 0 },
    { id: 14, texto: 'Y el resumen para Hoy es reutilizable', ok: !!resumenParaHoy(nut, HOY) && resumenParaHoy({ comidas: [] }, HOY) === null },
    { id: 15, texto: 'Ni una palabra alarmista ni un diagnóstico', ok: todos.every(sinAlarmismo) && AUDITORIA_NU7.diagnosticos === 0 },
    { id: 16, texto: 'Ni una clave nueva ni una cifra guardada', ok: AUDITORIA_NU7.clavesNuevas === 0 && AUDITORIA_NU7.cifrasGuardadas === 0 },
    { id: 17, texto: 'Y el resumen es corto: dos frases como mucho', ok: (a.resumen.match(/\./g) || []).length <= MAX_FRASES_RESUMEN },
  ];
}
