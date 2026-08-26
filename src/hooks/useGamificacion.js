// ============================================================================
// RA · Fase 3/4 — El hook de gamificación (apartado 33)
//
// *"Si corresponde con la arquitectura React: useGamification(). Debe exponer
// los datos necesarios para la futura UI."*
//
// Igual que `useRachas`, **no añade lógica**: envuelve `rachasGamificacion.js` y
// memoiza lo caro, para cumplir el apartado 30 (*"No calcules todos los logros
// de todos los usuarios. Evita consultas innecesarias."*). Las definiciones de
// logro son estáticas y globales, así que se leen una vez y no se recalculan.
// ============================================================================

import { useMemo, useCallback } from 'react';
import { todayISO } from '../lib/helpers';
import {
  GAMIFICACION_INICIAL, normalizarGamificacion, evaluar,
  panelGamificacion, listaLogros, estadisticasGamificacion, diasDelMes,
  progresoHaciaHito, revisarLogros, revocarLogro, olvidarRacha,
  STREAK_MILESTONES, DEFINICIONES_LOGRO, EVENTOS_GAMIFICACION, ESTADOS_LOGRO,
  NIVELES_CELEBRACION, celebracionDeHito,
} from '../lib/rachasGamificacion';

/**
 * @param {object} rachas         el estado de rachas (RA F2)
 * @param {object} gamificacion   lo desbloqueado hasta ahora
 * @param {(nuevo: object) => void} onCambiar  cómo se persiste
 */
export default function useGamificacion(rachas, gamificacion, onCambiar, hoy = todayISO()) {
  const estado = useMemo(() => normalizarGamificacion(gamificacion), [gamificacion]);
  const panel = useMemo(() => panelGamificacion(rachas, estado, hoy), [rachas, estado, hoy]);

  return {
    estado,
    panel,
    logros: panel.logros,
    desbloqueados: panel.desbloqueados,
    estadisticas: panel.estadisticas,

    // Configuración estática — se expone tal cual, sin copiarla ni recalcularla.
    hitos: STREAK_MILESTONES,
    definiciones: DEFINICIONES_LOGRO,
    EVENTOS: EVENTOS_GAMIFICACION,
    ESTADOS: ESTADOS_LOGRO,
    CELEBRACIONES: NIVELES_CELEBRACION,
    celebracionDe: celebracionDeHito,
    progresoHacia: progresoHaciaHito,

    /**
     * La única operación que escribe. Devuelve **solo los eventos nuevos**: los
     * hitos ya anunciados y los logros ya desbloqueados no vuelven a salir
     * (apartados 6 y 12), así que llamarla dos veces no celebra dos veces.
     *
     * Quien la llame decide qué hacer con los eventos: RA F4 los pintará, y el
     * sistema de audio podrá consumirlos sin tocar nada de esto (apartado 25).
     */
    evaluar: useCallback(() => {
      const { gamificacion: nuevo, eventos } = evaluar(rachas, estado, hoy);
      if (eventos.length) onCambiar(nuevo);
      return eventos;
    }, [rachas, estado, hoy, onCambiar]),

    // Apartado 21 — el estado de cada día, para el calendario de RA F4.
    diasDelMes: useCallback((rachaId, anio, mes) => diasDelMes(rachas, rachaId, anio, mes, hoy), [rachas, hoy]),

    lista: useCallback(() => listaLogros(rachas, estado, hoy), [rachas, estado, hoy]),
    stats: useCallback(() => estadisticasGamificacion(rachas, estado, hoy), [rachas, estado, hoy]),

    // Apartado 28 — revisar INFORMA; revocar es una decisión explícita, nunca
    // automática. Un logro conseguido no se pierde porque después se corrija un
    // dato: eso sería castigar a Josué por ordenar su historial.
    revisar: useCallback(() => revisarLogros(rachas, estado, hoy), [rachas, estado, hoy]),
    revocar: useCallback((definicionId, rachaId) => onCambiar(revocarLogro(estado, definicionId, rachaId)), [estado, onCambiar]),
    olvidarRacha: useCallback((rachaId) => onCambiar(olvidarRacha(estado, rachaId)), [estado, onCambiar]),
  };
}

export { GAMIFICACION_INICIAL };
