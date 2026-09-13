/* ===========================================================================
   Los iconos de las sub-apps de Mente y de Organización.

   ⚠️ **Van aquí y no en `agrupadores.js` a propósito**, y es el mismo reparto
   que `APPS_NUMEROS` / `ICONOS_NUMEROS` (NAV F1), `MINI_APPS` /
   `ICONOS_MINI_APP` (E3 F16) y `CATEGORIAS_ARMARIO` / `ICONOS_CATEGORIA`
   (E3 F3): uno es un catálogo de **datos** y el otro de **componentes de
   React**. Un icono que falte aquí sale como un hueco y **no falla en ninguna
   parte**, así que hay una prueba que comprueba que cada línea de
   `APPS_MENTE` y `APPS_ORGANIZACION` tiene el suyo.

   🚨 **Y SON LOS MISMOS SEIS QUE ESOS MÓDULOS YA TENÍAN EN `MORE_NAV`.** Josué
   (DIST F1): *"No reutilices iconos de manera arbitraria si ya existe un sistema
   de iconografía establecido"* y *"No introduzcas una nueva librería de iconos
   si no es necesaria"*. Existe —Lucide, en toda la aplicación— y los seis
   dibujos ya eran los suyos, así que Josué encuentra cada cosa donde la
   reconoce. No se ha inventado ni uno.

   ⚠️ `Tareas` es la excepción: nunca estuvo en `MORE_NAV` porque era una
   mini-app de Productividad. Se trae **el suyo de allí** (`ListChecks`, de
   `MINI_APPS_PR`), que es igual de reconocible y tampoco es nuevo.
   =========================================================================== */
import React from 'react';
import { Church, Heart, Smartphone, ListChecks, Calendar, CalendarClock } from 'lucide-react';

export const ICONOS_AGRUPADORES = {
  // Mente
  fe: Church,
  relacion: Heart,
  bienestar: Smartphone,
  // Organización
  tareas: ListChecks,
  calendario: Calendar,
  horario: CalendarClock,
};

export function IconoAgrupador({ id, size = 20, ...rest }) {
  const Icono = ICONOS_AGRUPADORES[id];
  if (!Icono) return null;
  return <Icono size={size} {...rest} />;
}
