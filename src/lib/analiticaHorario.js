// ============================================================================
// HT · Fase 11/12 — ANALÍTICA PERSONAL
//
// *"El sistema dejará de limitarse a decirte qué tienes que hacer y empezará a
// analizar cómo está funcionando tu vida organizada."*
//
// ⚠️ Esta fase tiene la especificación más corta de las doce: **veintitrés
// puntos y ninguna letra pequeña.** Uno de ellos, sin embargo, dice cómo hay
// que construir todo lo demás:
//
//   *"…y un sistema de aprendizaje que mejore las sugerencias **sin
//   convertirlo en una caja negra**."*
//
// Así que aquí no hay ni un número que no se pueda explicar. Cada dato viene
// con **de dónde sale**, y lo que el sistema "aprende" son patrones que se
// pueden leer en una frase: *"los martes sueles saltarte el estudio de la
// tarde"*. Nada de pesos ocultos.
//
// ── LAS TRES REGLAS ────────────────────────────────────────────────────────
//
// **1. Describe, no juzga.** Es la misma línea de HT F7 (*"sin castigo"*), de
// HT F9 (*"no castigar"*) y de D2-02 (*"no sobregamificar"*). Un 40 % de
// cumplimiento es un dato, no una nota. Hay pruebas que buscan reproches.
//
// **2. Sin datos no se inventa una tendencia.** Con tres días no hay
// tendencia; hay tres días. Toda estadística dice **cuántos datos la
// sostienen**, y por debajo del mínimo se dice que no se puede saber todavía.
//
// **3. Nada se guarda.** Todo se deriva del historial que ya existe: los
// completados de HT F8, la mochila de F7, las tareas de Productividad. Una
// estadística guardada es una estadística que empieza a mentir.
// ============================================================================

import { todayISO, addDays } from './helpers';
import {
  normalizarHorarioTop, resolverDia, duracionMinutos, diaDeFecha, DIAS_SEMANA,
} from './horario';
import { completadasDe, claveEvento, tablonDelDia } from './automatizaciones';
import { mochilaDeFecha, progresoMochila } from './mochila';
import { estadoDelDia, describirMinutos, diasEntre } from './hoy';

/* ===========================================================================
   1 · EL MÍNIMO PARA PODER DECIR ALGO
   ===========================================================================
   ⚠️ La regla 2 de la fase, en una constante. Con menos de esto, las funciones
   devuelven `suficientesDatos: false` y **no dan un número**: dar un 33 % de
   cumplimiento con tres días es dar una cifra que no significa nada. */
export const MINIMO_DIAS = 7;
export const MINIMO_OCURRENCIAS = 3;

/* ===========================================================================
   2 · PLANIFICADO VS. REALIZADO
   ===========================================================================
   *"Tiempo planificado vs. realizado."* Lo primero sale del horario; lo
   segundo, de lo que Josué confirmó en HT F8. */

export function cumplimiento(estado, { desde = todayISO(), dias = 14, asignaturas = [], hasta = null } = {}) {
  const e = normalizarHorarioTop(estado);
  const completadas = completadasDe(e);
  const fin = hasta || todayISO();

  let planificadas = 0;
  let hechas = 0;
  let minutosPlan = 0;
  let minutosHechos = 0;
  const porDia = [];

  for (let i = 0; i < dias; i++) {
    const f = addDays(desde, i);
    // ⚠️ Solo cuentan los días que YA pasaron: incluir el futuro daría un
    // cumplimiento que baja solo según avanza la semana.
    if (f > fin) break;
    const eventos = resolverDia(e, f, { asignaturas });
    const hechasHoy = eventos.filter((ev) => completadas.includes(claveEvento(ev, f)));
    planificadas += eventos.length;
    hechas += hechasHoy.length;
    minutosPlan += eventos.reduce((t, ev) => t + (duracionMinutos(ev.inicio, ev.fin) || 0), 0);
    minutosHechos += hechasHoy.reduce((t, ev) => t + (duracionMinutos(ev.inicio, ev.fin) || 0), 0);
    porDia.push({ fecha: f, planificadas: eventos.length, hechas: hechasHoy.length });
  }

  const diasConDatos = porDia.filter((d) => d.planificadas > 0).length;
  return {
    planificadas,
    hechas,
    minutosPlan,
    minutosHechos,
    porDia,
    diasConDatos,
    /* ⚠️ Hacen falta clases planificadas Y ALGUNA CONFIRMACIÓN.
       Sin ninguna, un 0 % no mide el cumplimiento: mide que Josué no usa el
       botón de confirmar. Decir "esta semana 0 %, la anterior 0 %" con eso es
       dar por hecho que no hizo nada, y no es lo que dice el dato. */
    suficientesDatos: diasConDatos >= MINIMO_OCURRENCIAS && planificadas > 0 && hechas > 0,
    porcentaje: planificadas > 0 ? Math.round((hechas / planificadas) * 100) : null,
    // De dónde sale el número. Sin esto sería una caja negra.
    origen: hechas === 0
      ? `Hay ${planificadas} ${planificadas === 1 ? 'actividad' : 'actividades'} en esos días, pero ninguna confirmada todavía.`
      : `De ${diasConDatos} ${diasConDatos === 1 ? 'día' : 'días'} con clases, confirmadas a mano.`,
  };
}

/* ===========================================================================
   3 · CARGA Y HORAS LIBRES
   =========================================================================== */
export function analisisDeSemana(estado, { desde = todayISO(), dias = 7, ...opciones } = {}) {
  const dd = [];
  for (let i = 0; i < dias; i++) {
    const f = addDays(desde, i);
    const d = estadoDelDia(estado, f, { ...opciones, fecha: f });
    dd.push({ ...d, dia: DIAS_SEMANA[(diaDeFecha(f) || 1) - 1]?.corto || '' });
  }
  const conAlgo = dd.filter((d) => !d.vacio);
  return {
    dias: dd,
    actividades: dd.reduce((t, d) => t + d.actividades, 0),
    minutos: dd.reduce((t, d) => t + d.minutos, 0),
    diasOcupados: conAlgo.length,
    diasLibres: dd.length - conAlgo.length,
    // La media solo de los días que tienen algo: incluir los domingos vacíos
    // la hunde y deja de describir cómo es un día de instituto.
    mediaPorDiaOcupado: conAlgo.length ? Math.round(conAlgo.reduce((t, d) => t + d.minutos, 0) / conAlgo.length) : 0,
    masCargado: [...dd].sort((a, b) => b.minutos - a.minutos)[0] || null,
    masLibre: [...conAlgo].sort((a, b) => a.minutos - b.minutos)[0] || null,
  };
}

/* ===========================================================================
   4 · TAREAS: COMPLETADAS Y APLAZADAS
   =========================================================================== */
export function estadisticasTareas({ productividad = null, hoy = todayISO(), dias = 30 } = {}) {
  const tareas = productividad?.tareas || [];
  const desde = addDays(hoy, -dias);
  const conFecha = tareas.filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t?.fecha || '') && t.fecha >= desde && t.fecha <= hoy);
  const hechas = conFecha.filter((t) => t.hecha);
  const vencidas = conFecha.filter((t) => !t.hecha && t.fecha < hoy);

  return {
    total: conFecha.length,
    hechas: hechas.length,
    vencidas: vencidas.length,
    sinFecha: tareas.filter((t) => !t.hecha && !t.fecha).length,
    suficientesDatos: conFecha.length >= MINIMO_OCURRENCIAS,
    porcentaje: conFecha.length ? Math.round((hechas.length / conFecha.length) * 100) : null,
    origen: `De ${conFecha.length} ${conFecha.length === 1 ? 'tarea' : 'tareas'} con fecha en los últimos ${dias} días.`,
  };
}

/* ===========================================================================
   5 · LA MOCHILA
   =========================================================================== */
export function estadisticasDeMochila(estado, { hasta = todayISO(), dias = 14, ...opciones } = {}) {
  let conMochila = 0;
  let completas = 0;
  const flojos = [];

  for (let i = 1; i <= dias; i++) {
    const f = addDays(hasta, -i);
    const p = progresoMochila(mochilaDeFecha(estado, f, opciones));
    if (p.vacia) continue;
    conMochila++;
    if (p.completa) completas++;
    else flojos.push({ fecha: f, faltaron: p.faltanObligatorios });
  }

  return {
    dias: conMochila,
    completas,
    flojos,
    suficientesDatos: conMochila >= MINIMO_OCURRENCIAS,
    porcentaje: conMochila ? Math.round((completas / conMochila) * 100) : null,
    origen: `De ${conMochila} ${conMochila === 1 ? 'día' : 'días'} con mochila que preparar.`,
  };
}

/* ===========================================================================
   6 · PATRONES: LO QUE EL SISTEMA "APRENDE"
   ===========================================================================
   ⚠️ **Aquí es donde una app se convierte en caja negra**, y donde la
   especificación dice expresamente que no.

   Así que un patrón es siempre **una frase que se puede leer y comprobar**:
   *"los martes sueles saltarte el estudio de la tarde (3 de 4 martes)"*. Lleva
   los números que lo sostienen, y por debajo del mínimo **no se dice nada**. */

export const TIPOS_PATRON = ['dia_flojo', 'hora_floja', 'actividad_floja', 'dia_fuerte'];

export function patrones(estado, { desde = todayISO(), dias = 28, asignaturas = [], hasta = null } = {}) {
  const e = normalizarHorarioTop(estado);
  const completadas = completadasDe(e);
  const fin = hasta || todayISO();

  const porDiaSemana = new Map();      // 1-7 → { total, hechas }
  const porActividad = new Map();      // titulo → { total, hechas }
  const porFranja = new Map();         // 'mañana' | 'tarde' → { total, hechas }

  const sumar = (mapa, clave, hecha) => {
    const x = mapa.get(clave) || { total: 0, hechas: 0 };
    x.total++;
    if (hecha) x.hechas++;
    mapa.set(clave, x);
  };

  for (let i = 0; i < dias; i++) {
    const f = addDays(desde, i);
    if (f > fin) break;
    const dia = diaDeFecha(f);
    for (const ev of resolverDia(e, f, { asignaturas })) {
      const hecha = completadas.includes(claveEvento(ev, f));
      sumar(porDiaSemana, dia, hecha);
      sumar(porActividad, ev.titulo, hecha);
      sumar(porFranja, (Number((ev.inicio || '').slice(0, 2)) || 0) < 14 ? 'mañana' : 'tarde', hecha);
    }
  }

  const salida = [];
  const revisar = (mapa, tipo, texto) => {
    for (const [clave, x] of mapa) {
      // ⚠️ Sin ocurrencias suficientes NO se dice nada. "Los martes te saltas
      // el estudio" basado en un martes es una afirmación inventada.
      if (x.total < MINIMO_OCURRENCIAS) continue;
      const ratio = x.hechas / x.total;
      if (ratio <= 0.5) salida.push({ tipo, clave, ...x, ratio, texto: texto(clave, x, false) });
      else if (ratio >= 0.9 && tipo === 'dia_flojo') salida.push({ tipo: 'dia_fuerte', clave, ...x, ratio, texto: texto(clave, x, true) });
    }
  };

  revisar(porDiaSemana, 'dia_flojo', (d, x, bien) => {
    const nombre = DIAS_SEMANA[(d || 1) - 1]?.label || '';
    return bien
      ? `Los ${nombre.toLowerCase()} cumples casi todo (${x.hechas} de ${x.total}).`
      : `Los ${nombre.toLowerCase()} se te escapan más cosas (${x.hechas} de ${x.total}).`;
  });
  revisar(porFranja, 'hora_floja', (f, x) => `Por la ${f} confirmas menos (${x.hechas} de ${x.total}).`);
  revisar(porActividad, 'actividad_floja', (a, x) => `${a}: confirmada ${x.hechas} de ${x.total} veces.`);

  return salida.sort((a, b) => a.ratio - b.ratio || b.total - a.total);
}

/* ===========================================================================
   7 · TENDENCIA (comparar dos periodos)
   ===========================================================================
   ⚠️ **Con tres días no hay tendencia; hay tres días.** Por eso hace falta que
   los DOS periodos tengan datos: comparar una semana llena con una de
   vacaciones diría "has bajado un 80 %", y sería mentira. */

export function tendencia(estado, { hasta = todayISO(), dias = 7, ...opciones } = {}) {
  const finAnterior = addDays(hasta, -dias);
  const actual = cumplimiento(estado, { ...opciones, desde: addDays(hasta, -dias + 1), dias, hasta });
  const anterior = cumplimiento(estado, { ...opciones, desde: addDays(hasta, -(dias * 2) + 1), dias, hasta: finAnterior });

  if (!actual.suficientesDatos || !anterior.suficientesDatos) {
    return {
      suficientesDatos: false,
      direccion: 'sin_datos',
      texto: 'Todavía no hay suficientes semanas para comparar.',
      actual, anterior,
    };
  }

  const dif = actual.porcentaje - anterior.porcentaje;
  // Menos de 10 puntos no es una tendencia: es ruido de una semana.
  const direccion = Math.abs(dif) < 10 ? 'igual' : dif > 0 ? 'sube' : 'baja';
  return {
    suficientesDatos: true,
    diferencia: dif,
    direccion,
    // ⚠️ Ni "vas mejor" ni "vas peor": lo que cambió y cuánto.
    texto: direccion === 'igual'
      ? `Parecido a la semana anterior (${actual.porcentaje} % y ${anterior.porcentaje} %).`
      : `Esta semana ${actual.porcentaje} %, la anterior ${anterior.porcentaje} %.`,
    actual, anterior,
  };
}

/* ===========================================================================
   8 · EL INFORME
   ===========================================================================
   Todo junto, y **cada cifra con su origen**. */
export function informe(estado, { hoy = todayISO(), dias = 14, ...opciones } = {}) {
  const desde = addDays(hoy, -dias + 1);
  const cump = cumplimiento(estado, { ...opciones, desde, dias, hasta: hoy });
  const semana = analisisDeSemana(estado, { ...opciones, desde: addDays(hoy, -6), dias: 7, hoy });
  const tareas = estadisticasTareas({ ...opciones, hoy });
  const mochila = estadisticasDeMochila(estado, { ...opciones, hasta: hoy });
  const pats = patrones(estado, { ...opciones, desde: addDays(hoy, -27), dias: 28, hasta: hoy });
  const tend = tendencia(estado, { ...opciones, hasta: hoy });

  return {
    desde,
    hasta: hoy,
    cumplimiento: cump,
    semana,
    tareas,
    mochila,
    patrones: pats,
    tendencia: tend,
    // ⚠️ Un resumen honesto: si no hay datos, se dice, no se rellena con ceros.
    resumen: resumenHonesto({ cump, semana, tareas }),
  };
}

function resumenHonesto({ cump, semana, tareas }) {
  const trozos = [];
  if (semana.actividades > 0) trozos.push(`${semana.actividades} ${semana.actividades === 1 ? 'actividad' : 'actividades'} esta semana (${describirMinutos(semana.minutos)})`);
  if (cump.suficientesDatos) trozos.push(`${cump.porcentaje} % confirmadas`);
  if (tareas.suficientesDatos) trozos.push(`${tareas.porcentaje} % de las tareas hechas`);
  if (!trozos.length) return 'Todavía no hay bastantes datos para decir nada útil.';
  return `${trozos.join(' · ')}.`;
}

/* ===========================================================================
   9 · RECOMENDACIONES
   ===========================================================================
   *"Recomendaciones de IA."*

   ⚠️ Estas **no las hace la IA y no se disparan solas** (regla 7). Son
   consecuencias directas de un patrón que ya está medido, con su número
   delante, y se enseñan cuando Josué mira el informe. Nada más. */
export function recomendaciones(inf) {
  if (!inf) return [];
  const salida = [];

  for (const p of (inf.patrones || []).filter((x) => x.tipo !== 'dia_fuerte').slice(0, 3)) {
    salida.push({
      motivo: p.texto,
      // Se sugiere mirarlo, no se dice qué hacer: el apartado de F9 es claro,
      // no decide por ti.
      sugerencia: p.tipo === 'dia_flojo'
        ? 'Quizá ese día tengas demasiado encima.'
        : p.tipo === 'hora_floja'
          ? 'Puede que esa franja no sea tu mejor momento.'
          : 'Igual conviene mirar cómo la tienes colocada.',
    });
  }

  if (inf.mochila?.suficientesDatos && inf.mochila.porcentaje < 60) {
    salida.push({
      motivo: `La mochila salió completa ${inf.mochila.completas} de ${inf.mochila.dias} días.`,
      sugerencia: 'Prepararla la noche antes suele funcionar mejor que por la mañana.',
    });
  }

  if (inf.semana?.masCargado && inf.semana.masCargado.carga === 'alta') {
    salida.push({
      motivo: `${inf.semana.masCargado.nombreDia} es tu día más cargado (${describirMinutos(inf.semana.masCargado.minutos)}).`,
      sugerencia: inf.semana.masLibre ? `${inf.semana.masLibre.nombreDia} lo tienes más despejado.` : 'Puedes mover algo a otro día.',
    });
  }

  return salida;
}

/* ===========================================================================
   10 · COMPROBACIÓN DE QUE NO SE JUZGA
   ===========================================================================
   Una lista de palabras que **no pueden salir** en ningún texto de este
   archivo. No es decoración: la prueba la usa para recorrer todo lo que se
   genera, y una frase de más se cazaría sola. */
export const PALABRAS_PROHIBIDAS = [
  'fallado', 'fallaste', 'has fallado', 'mal', 'peor', 'vago', 'deberías',
  'castigo', 'penaliz', 'suspenso', 'inaceptable', 'excusa',
];

export function contieneReproche(texto) {
  const t = (texto || '').toLowerCase();
  // `mal` como palabra suelta; "normal" o "material" no cuentan.
  return PALABRAS_PROHIBIDAS.some((p) => (p === 'mal' ? /\bmal\b/.test(t) : t.includes(p)));
}
