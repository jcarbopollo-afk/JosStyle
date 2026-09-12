/* ===========================================================================
   Los iconos de las sub-apps de Números.

   ⚠️ **Van aquí y no en `numeros.js` a propósito**, y es el mismo reparto que
   `MINI_APPS` / `ICONOS_MINI_APP` (E3 F16) y `CATEGORIAS_ARMARIO` /
   `ICONOS_CATEGORIA` (E3 F3): uno es un catálogo de **datos** y el otro de
   **componentes de React**. Un icono que falte aquí sale como un hueco y **no
   falla en ninguna parte**, así que hay una prueba que comprueba que cada línea
   de `APPS_NUMEROS` tiene el suyo.

   ⚠️ Y son los **mismos tres iconos que esas pantallas ya tenían en el menú**
   —BarChart3, TrendingUp y Trophy—, para que Josué las reconozca donde estaban.
   El que es nuevo es el de Números, que vive en `App.jsx` con el resto de la
   navegación.
   =========================================================================== */
import React from 'react';
import { BarChart3, TrendingUp, Trophy } from 'lucide-react';

export const ICONOS_NUMEROS = {
  estadisticas: BarChart3,
  predicciones: TrendingUp,
  logros: Trophy,
};

export function IconoNumeros({ id, size = 20, ...rest }) {
  const Icono = ICONOS_NUMEROS[id];
  if (!Icono) return null;
  return <Icono size={size} {...rest} />;
}
