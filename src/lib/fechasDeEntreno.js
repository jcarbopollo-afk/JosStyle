/* ═══════════════════════════════════════════════════════════════════════════
   LOS DÍAS EN QUE ENTRENÓ — una sola lectura para Estadísticas, la puntuación
   del día y Predicciones (Fase 1B · CX-09 y CX-12)
   ═══════════════════════════════════════════════════════════════════════════

   Un día «con entreno» es un día con al menos un entrenamiento **completado** de
   Fitness (`fechasConEntrenamiento`, la regla del historial de la FIT F10) **o**
   con una sesión de la calistenia que registraba antes de la v3.158.0. Las dos
   cosas fueron días de entreno: dejar fuera la calistenia contaría esos días como
   «sin entreno», que es justo el error que invertía la correlación (CX-09).

   🚨 De lo antiguo solo se toma **la fecha**: ni niveles, ni habilidades, ni
   récords, que no tienen equivalente en Fitness. Y es un conjunto de **días**: dos
   entrenamientos el mismo día, o el mismo día apuntado en los dos sistemas, son
   un día. Nada se borra ni se reescribe: es una lectura.

   ⚠️ Las tarjetas que abren Fitness (Inicio y el hub) no usan esto: describen el
   último entrenamiento de Fitness, que es lo que se ve al tocarlas. */

import { fechaValida } from './helpers';
import { fechasConEntrenamiento } from './sesionesCompletadas';

const lista = (v) => (Array.isArray(v) ? v : []);

/** Fechas válidas de las sesiones de la calistenia anterior (solo lectura). */
function fechasDeCalistenia(calistenia) {
  const fechas = new Set();
  const habilidades = calistenia && typeof calistenia === 'object' && !Array.isArray(calistenia) ? calistenia : {};
  Object.values(habilidades).forEach((skill) => {
    lista(skill && skill.sesiones).forEach((s) => {
      if (s && fechaValida(s.fecha)) fechas.add(s.fecha);
    });
  });
  return fechas;
}

/** Los días con entreno, de dónde sale cada grupo, el primero y el último. */
export function fechasDeEntreno({ fitness = null, calistenia = null } = {}) {
  const deFitness = fechasConEntrenamiento(fitness);
  const deCalistenia = fechasDeCalistenia(calistenia);
  const todas = new Set([...deFitness, ...deCalistenia]);
  const ordenadas = [...todas].sort();
  return {
    todas,
    deFitness: deFitness.size,
    deCalistenia: deCalistenia.size,
    primera: ordenadas.length ? ordenadas[0] : null,
    /* 🔓 Fase 1C — el último día con un entrenamiento registrado: el final del tramo en el
       que se sabe que apuntaba (`correlacionEntrenoAnimo`). */
    ultima: ordenadas.length ? ordenadas[ordenadas.length - 1] : null,
  };
}
