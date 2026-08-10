// Fase 17 — Predicciones: apoyado en el mismo principio que el motor de correlaciones (Fase 16),
// todas estas funciones son honestas sobre cuándo NO hay datos suficientes en vez de forzar una
// lectura, y ninguna decide nada por Josué — solo proyecta hacia delante lo que ya está registrado,
// con el mismo tono "prudente y directo" del resto de la IA de la app. Nada aquí es un modelo
// estadístico complejo: son medias, tasas y regresiones lineales simples, siempre explicables.

import { todayISO } from './helpers';

function diasEntre(fechaA, fechaB) {
  return Math.round((new Date(fechaB + 'T00:00:00') - new Date(fechaA + 'T00:00:00')) / 86400000);
}

// Regresión lineal simple (mínimos cuadrados) sobre pares [x, y]. Devuelve pendiente e intercept,
// o null si hay menos de 2 puntos o si todos comparten la misma x (no se puede trazar una recta).
function regresionLineal(puntos) {
  const n = puntos.length;
  if (n < 2) return null;
  const sumX = puntos.reduce((s, p) => s + p.x, 0);
  const sumY = puntos.reduce((s, p) => s + p.y, 0);
  const mediaX = sumX / n;
  const mediaY = sumY / n;
  const numerador = puntos.reduce((s, p) => s + (p.x - mediaX) * (p.y - mediaY), 0);
  const denominador = puntos.reduce((s, p) => s + (p.x - mediaX) ** 2, 0);
  if (denominador === 0) return null;
  const pendiente = numerador / denominador;
  return { pendiente, intercept: mediaY - pendiente * mediaX };
}

// --- 1. Objetivos: tiempo estimado según el plazo que Josué mismo eligió al crearlo ---
const DIAS_POR_PLAZO = { '30 días': 30, '90 días': 90, '1 año': 365, '5 años': 1825, '10 años': 3650 };

export function prediccionObjetivo(objetivo) {
  const plazoDias = DIAS_POR_PLAZO[objetivo.plazo];
  if (!plazoDias || !objetivo.fechaCreacion) return { suficientesDatos: false };
  const hoy = todayISO();
  const fechaLimite = new Date(objetivo.fechaCreacion + 'T00:00:00');
  fechaLimite.setDate(fechaLimite.getDate() + plazoDias);
  const fechaLimiteISO = fechaLimite.toISOString().slice(0, 10);
  const diasRestantes = diasEntre(hoy, fechaLimiteISO);
  return { suficientesDatos: true, fechaLimiteISO, diasRestantes, superado: diasRestantes < 0 };
}

// --- 2. Hábitos: probabilidad de abandono a partir de la constancia reciente ---
// "historial" solo guarda los días marcados como hechos (ver ProductivityView), así que la
// ventana de cálculo empieza en el primer día marcado, no en una fecha de creación que no existe.
export function prediccionAbandonoHabito(habito) {
  const fechas = Object.keys(habito.historial || {}).sort();
  if (fechas.length === 0) return { suficientesDatos: false };
  const hoy = todayISO();
  const primera = fechas[0];
  const diasDesdeInicio = diasEntre(primera, hoy) + 1;
  if (diasDesdeInicio < 5) return { suficientesDatos: false, diasDesdeInicio };

  const ventana = Math.min(14, diasDesdeInicio);
  const cutoff = new Date(hoy + 'T00:00:00');
  cutoff.setDate(cutoff.getDate() - (ventana - 1));
  const cutoffISO = cutoff.toISOString().slice(0, 10);
  const marcasVentana = fechas.filter((f) => f >= cutoffISO).length;
  const tasa = marcasVentana / ventana;
  const riesgo = tasa < 0.4 ? 'alto' : tasa < 0.7 ? 'medio' : 'bajo';

  return { suficientesDatos: true, ventana, marcasVentana, tasa: Math.round(tasa * 100), riesgo };
}

// --- 3. Peso: tendencia lineal sobre las medidas de Salud con campo "peso" ---
export function prediccionPeso(medidas) {
  const conPeso = (medidas || []).filter((m) => m.peso).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  if (conPeso.length < 3) return { suficientesDatos: false, registros: conPeso.length };
  const primera = conPeso[0].fecha;
  const puntos = conPeso.map((m) => ({ x: diasEntre(primera, m.fecha), y: Number(m.peso) }));
  const rango = puntos[puntos.length - 1].x;
  if (rango < 7) return { suficientesDatos: false, registros: conPeso.length };

  const recta = regresionLineal(puntos);
  if (!recta) return { suficientesDatos: false, registros: conPeso.length };

  const pesoActual = Number(conPeso[conPeso.length - 1].peso);
  const tendenciaSemana = Math.round(recta.pendiente * 7 * 100) / 100;
  const pesoEstimado30d = Math.round((recta.intercept + recta.pendiente * (rango + 30)) * 10) / 10;

  return { suficientesDatos: true, pesoActual, tendenciaSemana, pesoEstimado30d };
}

// --- 4. Fuerza (calistenia): sin un valor numérico fiable (los PRs son texto libre, ej. "30s
// hold"), la proyección honesta aquí es de constancia, no de una cifra inventada: ¿va a más o a
// menos la frecuencia de sesiones de la habilidad que más entrena? ---
export function prediccionFuerza(calistenia) {
  const skills = Object.entries(calistenia || {});
  const [nombreSkill, data] = skills.reduce(
    (mejor, actual) => ((actual[1].sesiones || []).length > (mejor[1]?.sesiones || []).length ? actual : mejor),
    [null, { sesiones: [] }]
  );
  const sesiones = data?.sesiones || [];
  if (!nombreSkill || sesiones.length < 4) return { suficientesDatos: false };

  const hoy = todayISO();
  const cutoffReciente = new Date(hoy + 'T00:00:00'); cutoffReciente.setDate(cutoffReciente.getDate() - 13);
  const cutoffRecienteISO = cutoffReciente.toISOString().slice(0, 10);
  const cutoffAnterior = new Date(hoy + 'T00:00:00'); cutoffAnterior.setDate(cutoffAnterior.getDate() - 27);
  const cutoffAnteriorISO = cutoffAnterior.toISOString().slice(0, 10);

  const recientes = sesiones.filter((s) => s.fecha >= cutoffRecienteISO).length;
  const anteriores = sesiones.filter((s) => s.fecha >= cutoffAnteriorISO && s.fecha < cutoffRecienteISO).length;
  const tendencia = recientes > anteriores ? 'subiendo' : recientes < anteriores ? 'bajando' : 'estable';

  return { suficientesDatos: true, skill: nombreSkill, sesionesRecientes: recientes, sesionesAnteriores: anteriores, tendencia };
}

// --- 5. Ahorro: media mensual de (ingresos - gastos) sobre los últimos meses con movimientos ---
export function prediccionAhorro(economia) {
  const movimientos = economia?.movimientos || [];
  if (movimientos.length === 0) return { suficientesDatos: false };

  const porMes = {};
  movimientos.forEach((m) => {
    const mes = m.fecha.slice(0, 7);
    porMes[mes] = (porMes[mes] || 0) + (m.tipo === 'ingreso' ? m.cantidad : -m.cantidad);
  });
  const meses = Object.keys(porMes).sort();
  if (meses.length < 2) return { suficientesDatos: false, meses: meses.length };

  const ultimosMeses = meses.slice(-3);
  const netoMedioMensual = Math.round((ultimosMeses.reduce((s, m) => s + porMes[m], 0) / ultimosMeses.length) * 100) / 100;
  const huchaActual = economia.hucha || 0;
  const proyeccion3Meses = Math.round((huchaActual + netoMedioMensual * 3) * 100) / 100;

  return { suficientesDatos: true, mesesConsiderados: ultimosMeses.length, netoMedioMensual, huchaActual, proyeccion3Meses };
}

// --- 6. Notas: media de las notas obtenidas más recientes, como estimación honesta de la
// próxima (no una regresión sobre 2-3 puntos, que daría una falsa sensación de precisión) ---
export function prediccionNotas(estudios) {
  const conNota = (estudios?.examenes || [])
    .map((e) => ({ ...e, notaNum: Number(e.notaObtenida) }))
    .filter((e) => e.notaObtenida !== '' && e.notaObtenida !== undefined && !Number.isNaN(e.notaNum))
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  if (conNota.length < 3) return { suficientesDatos: false, registros: conNota.length };

  const ultimas3 = conNota.slice(-3);
  const anteriores = conNota.slice(0, -3);
  const media = (arr) => Math.round((arr.reduce((s, e) => s + e.notaNum, 0) / arr.length) * 100) / 100;
  const notaMediaReciente = media(ultimas3);
  const tendencia = anteriores.length === 0 ? 'sin comparación previa' : notaMediaReciente > media(anteriores) ? 'subiendo' : notaMediaReciente < media(anteriores) ? 'bajando' : 'estable';

  return { suficientesDatos: true, notaMediaReciente, tendencia, registros: conNota.length };
}
