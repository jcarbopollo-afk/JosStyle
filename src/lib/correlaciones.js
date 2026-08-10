// Motor mínimo de correlaciones entre módulos. Se crea en la Fase 6 para la primera correlación
// real del proyecto (sueño → horas de estudio), pero está pensado desde el nombre de archivo y
// la forma de las funciones para reutilizarse en la Fase 16 (Estadísticas y correlaciones), donde
// se espera que aparezcan más pares de módulos (sueño-ánimo, entreno-energía, etc.).
//
// Principio igual que en el resto de la IA de la app: esto solo calcula y muestra datos — nunca
// decide nada por el usuario, y cualquier lectura ("parece que..." ) debe poder señalar el dato
// concreto en el que se basa.

import { calcularDuracion } from './helpers';

/**
 * Cruza dos series por fecha (mismo día) y devuelve solo los pares donde hay dato en ambas series.
 * Genérica a propósito: no sabe nada de sueño ni de estudio, para poder reutilizarse con
 * cualquier otro par de módulos en el futuro motor de correlaciones (Fase 16).
 */
export function cruzarPorFecha(serieA, fechaKeyA, valorA, serieB, fechaKeyB, valorB) {
  const mapaB = {};
  serieB.forEach((item) => {
    const v = valorB(item);
    if (v !== undefined && v !== null) mapaB[item[fechaKeyB]] = v;
  });
  return serieA
    .map((item) => ({ fecha: item[fechaKeyA], a: valorA(item), b: mapaB[item[fechaKeyA]] }))
    .filter((p) => p.a !== undefined && p.a !== null && p.b !== undefined && p.b !== null);
}

/**
 * Primera correlación real del proyecto: ¿los días con más horas de estudio coinciden con noches
 * de sueño más largas la noche anterior? Umbral simple y explicable (7h), no un modelo estadístico
 * complejo — coherente con el tono "prudente y directo" que debe tener la IA de toda la app.
 * Exige al menos 2 días de cada grupo (sueño largo / sueño corto) antes de mostrar nada, para no
 * sacar conclusiones con casi ningún dato.
 */
export function correlacionSuenoEstudio(sueno, horas) {
  const pares = cruzarPorFecha(
    horas, 'fecha', (h) => Number(h.horas),
    sueno, 'fecha', (s) => calcularDuracion(s.horaDormir, s.horaDespertar)
  );
  const buenSueno = pares.filter((p) => p.b >= 7);
  const suenoCorto = pares.filter((p) => p.b < 7);
  const media = (arr) => (arr.length ? Math.round((arr.reduce((s, p) => s + p.a, 0) / arr.length) * 10) / 10 : null);

  return {
    pares,
    suficientesDatos: buenSueno.length >= 2 && suenoCorto.length >= 2,
    mediaHorasConBuenSueno: media(buenSueno),
    mediaHorasConSuenoCorto: media(suenoCorto),
    diasBuenSueno: buenSueno.length,
    diasSuenoCorto: suenoCorto.length,
  };
}

/**
 * Fase 16 — segunda correlación: ¿duermo mejor influye en cómo me siento al día siguiente
 * (ánimo del Diario, mismo día)? Mismo umbral de 7h y mismo criterio de "al menos 2 días en
 * cada grupo" que la correlación de arriba, por coherencia.
 */
export function correlacionSuenoAnimo(sueno, entradasDiario) {
  const pares = cruzarPorFecha(
    entradasDiario, 'fecha', (e) => Number(e.animo),
    sueno, 'fecha', (s) => calcularDuracion(s.horaDormir, s.horaDespertar)
  );
  const buenSueno = pares.filter((p) => p.b >= 7);
  const suenoCorto = pares.filter((p) => p.b < 7);
  const media = (arr) => (arr.length ? Math.round((arr.reduce((s, p) => s + p.a, 0) / arr.length) * 10) / 10 : null);

  return {
    pares,
    suficientesDatos: buenSueno.length >= 2 && suenoCorto.length >= 2,
    mediaAnimoConBuenSueno: media(buenSueno),
    mediaAnimoConSuenoCorto: media(suenoCorto),
    diasBuenSueno: buenSueno.length,
    diasSuenoCorto: suenoCorto.length,
  };
}

/**
 * Fase 16 — tercera correlación: los días que entreno calistenia (cualquier habilidad, sesión
 * registrada en cualquiera de las 7), ¿el ánimo del Diario ese mismo día tiende a ser distinto?
 * Las sesiones viven anidadas por habilidad, así que primero se juntan en un solo conjunto de
 * fechas (sin duplicar si se entrena más de una habilidad el mismo día) antes de comparar.
 * Exige al menos 3 días en cada grupo (con entreno / sin entreno) — algo más que el resto porque
 * aquí se compara contra "el resto de mis días", un grupo casi siempre más grande y variado.
 */
function fechasConSesionCalistenia(calistenia) {
  const fechas = new Set();
  Object.values(calistenia || {}).forEach((skill) => {
    (skill.sesiones || []).forEach((s) => fechas.add(s.fecha));
  });
  return fechas;
}

export function correlacionEntrenoAnimo(calistenia, entradasDiario) {
  const fechasEntreno = fechasConSesionCalistenia(calistenia);
  const conEntreno = entradasDiario.filter((e) => fechasEntreno.has(e.fecha));
  const sinEntreno = entradasDiario.filter((e) => !fechasEntreno.has(e.fecha));
  const media = (arr) => (arr.length ? Math.round((arr.reduce((s, e) => s + Number(e.animo), 0) / arr.length) * 10) / 10 : null);

  return {
    suficientesDatos: conEntreno.length >= 3 && sinEntreno.length >= 3,
    mediaAnimoConEntreno: media(conEntreno),
    mediaAnimoSinEntreno: media(sinEntreno),
    diasConEntreno: conEntreno.length,
    diasSinEntreno: sinEntreno.length,
  };
}
