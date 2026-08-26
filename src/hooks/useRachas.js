// ============================================================================
// RA · Fase 2/4 — El hook central (apartado 23)
//
// *"Si la arquitectura del proyecto utiliza React hooks, crea un hook central
// equivalente a useStreak() o useStreaks(). No pongas toda la lógica
// directamente dentro del componente visual."*
//
// El proyecto no tenía carpeta `hooks/`: toda la lógica vive en `lib/` (pura,
// probable con Node) y el estado en `App.jsx`. Ese reparto es bueno y no se
// toca. Este hook no añade lógica ninguna — solo **envuelve el servicio** para
// que un componente no tenga que acordarse de pasar `estado` y `hoy` a cada
// llamada, ni de memoizar lo caro.
//
// El apartado 24 pide justo eso: *"No recalcules todas las rachas
// constantemente. Evita: cada render → consulta Supabase → recalcular todo."*
// Aquí el panel se calcula una vez por cambio real de estado y no una por
// render, y no hay ninguna consulta: los datos ya están en memoria.
// ============================================================================

import { useMemo, useCallback } from 'react';
import { todayISO } from '../lib/helpers';
import {
  normalizarEstado, panelRachas, panelRacha, panelHabitos,
  crearRacha, eliminarRacha, completarDia, deshacerDia,
  recalcularRacha, recalcularTodo, revisarIntegridad, repararEstado,
  invalidarPorOrigen, encolar, vaciarCola, hayPendientes,
  eventosDeRacha, eventosDeHabitos, siguienteHito,
} from '../lib/rachasServicio';

/**
 * @param {object} rachas   el estado guardado (clave `rachas` de app_data)
 * @param {(nuevo: object) => void} onCambiar  cómo se persiste — normalmente el
 *        `setRachas` de App.jsx, que ya se encarga de `saveData`. El hook NO
 *        habla con Supabase: el apartado 14 pide exactamente eso, que la
 *        escritura pase por un solo sitio y no por cada componente.
 * @param {object[]} [habitos]  los hábitos de Productividad, que tienen su
 *        historial en su propio módulo pero se consultan por aquí igualmente.
 */
export default function useRachas(rachas, onCambiar, habitos = [], hoy = todayISO()) {
  const estado = useMemo(() => normalizarEstado(rachas), [rachas]);

  // Lo caro (recorrer historiales) se hace una vez por cambio de estado.
  const panel = useMemo(() => panelRachas(estado, hoy), [estado, hoy]);
  const panelDeHabitos = useMemo(() => panelHabitos(habitos, hoy), [habitos, hoy]);
  const avisos = useMemo(
    () => [...eventosDeRacha(estado, hoy), ...eventosDeHabitos(habitos, hoy)],
    [estado, habitos, hoy],
  );

  const aplicar = useCallback((nuevo) => { if (nuevo) onCambiar(nuevo); }, [onCambiar]);

  return {
    estado,
    panel,
    habitos: panelDeHabitos,
    // Los avisos son una LECTURA del estado, no notificaciones lanzadas: quien
    // quiera avisar decidirá cuándo, en su fase (apartado 25).
    avisos,
    hayPendientes: hayPendientes(estado),

    detalle: useCallback((rachaId) => panelRacha(estado, rachaId, hoy), [estado, hoy]),
    hito: siguienteHito,

    crear: useCallback((datos) => {
      const { estado: nuevo, error, racha } = crearRacha(estado, datos, hoy);
      if (!error) aplicar(nuevo);
      return { error, racha };
    }, [estado, hoy, aplicar]),

    eliminar: useCallback((rachaId) => aplicar(eliminarRacha(estado, rachaId)), [estado, aplicar]),

    completar: useCallback((datos) => {
      const { estado: nuevo, error } = completarDia(estado, { fecha: hoy, ...datos });
      if (!error) aplicar(nuevo);
      return { error };
    }, [estado, hoy, aplicar]),

    deshacer: useCallback((rachaId, fecha = hoy) => aplicar(deshacerDia(estado, rachaId, fecha)), [estado, hoy, aplicar]),

    // Apartado 18: cuando desaparece la actividad que generó un día, desaparece
    // el día. La racha se corrige sola porque nunca estuvo guardada.
    invalidarOrigen: useCallback((origen, origenId) => aplicar(invalidarPorOrigen(estado, origen, origenId)), [estado, aplicar]),

    // Cola offline (apartado 16). Reintentar es idempotente, así que vaciarla
    // dos veces da el mismo resultado que vaciarla una.
    encolar: useCallback((cumplimiento) => aplicar(encolar(estado, cumplimiento)), [estado, aplicar]),
    sincronizar: useCallback(() => aplicar(vaciarCola(estado)), [estado, aplicar]),

    // Apartados 12 y 13. Aquí recalcular no es reparar: es la única forma de
    // saber el número, porque no se guarda ninguno.
    recalcular: useCallback((rachaId) => recalcularRacha(estado, rachaId, hoy), [estado, hoy]),
    recalcularTodo: useCallback(() => recalcularTodo(estado, hoy), [estado, hoy]),
    revisar: useCallback(() => revisarIntegridad(estado, hoy), [estado, hoy]),
    reparar: useCallback(() => aplicar(repararEstado(estado, hoy)), [estado, hoy, aplicar]),
  };
}
