/* ===========================================================================
   ENTREGA 4 · FIT F1 — ICONOGRAFÍA DE FITNESS
   ===========================================================================

   El apartado 8 dice *"Utiliza el sistema de iconos ya existente"* y *"NO crees
   una segunda librería visual paralela"*. El sistema es **lucide-react**, y lo
   que hay en lucide se usa de lucide: `Dumbbell`, `Trophy`, `Camera`,
   `ChevronRight`, `Lock`.

   ⚠️ **Los siete grupos musculares no están en lucide**, y ése es justo el
   problema que ya tuvo el Armario en la E3 F3: el campo `icono` existía, nadie
   lo leía, y los accesorios salían con una camiseta porque ocho categorías
   compartían dibujo. Con un solo icono genérico para brazos, piernas, espalda,
   pecho, hombros, abdominales y cuello, **los siete rankings parecerían el
   mismo**. Así que se dibujan, en la gramática de lucide para que no se noten
   de otra familia:

     · lienzo de 24×24, dibujo dentro de un margen de 2
     · solo trazo, nunca relleno (`fill: none`)
     · `stroke: currentColor`, grosor 2, extremos y esquinas redondeados
     · `size` en la prop, como cualquier icono de lucide

   ⚠️ **Y no se inventa precisión que no cabe en 24 píxeles.** Un icono de
   músculo no es una lámina de anatomía: cada uno representa **la zona del
   cuerpo** con la silueta más reconocible que entra en ese lienzo. La anatomía
   de verdad es un sistema aparte, de una fase posterior (apartado 22).

   ⚠️ Cada id de `GRUPOS_MUSCULARES` necesita su línea aquí. Un icono que falte
   sale como un hueco y **no falla en ninguna parte**, así que hay una
   comprobación que cruza las dos listas — la lección de `MINI_APPS` /
   `ICONOS_MINI_APP` (E3 F16).
   =========================================================================== */

import React from 'react';
import { Dumbbell, Trophy, Camera } from 'lucide-react';

/* La base común: si algún día cambia el grosor de trazo de la aplicación, se
   cambia en UN sitio. Es la misma `Trazo` que el Armario, y está repetida a
   propósito: importarla desde `iconosPrenda.jsx` ataría la iconografía de
   Fitness a la del Armario, y son dos catálogos que evolucionan por su cuenta. */
function Trazo({ size = 24, children, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/* ── Las tres áreas ──────────────────────────────────────────────────────── */

/** Rango — la insignia hexagonal del apartado 9, en versión icono. */
export const IconoRangos = (p) => (
  <Trazo {...p}>
    <path d="M12 2.5 20 7v10l-8 4.5L4 17V7Z" />
    <path d="M12 8.5 14 12l-2 3.5L10 12Z" />
  </Trazo>
);

/* ── Los siete grupos musculares ─────────────────────────────────────────── */

/** Brazos — brazo flexionado: hombro, bíceps marcado y antebrazo. */
export const IconoBrazos = (p) => (
  <Trazo {...p}>
    <path d="M4 19v-4a4 4 0 0 1 4-4h3" />
    <path d="M11 11a4 4 0 0 0 4-4V4" />
    <path d="M15 4h5v6a5 5 0 0 1-5 5h-2" />
  </Trazo>
);

/** Piernas — las dos piernas desde la cadera, con la rodilla marcada. */
export const IconoPiernas = (p) => (
  <Trazo {...p}>
    <path d="M6 3h12" />
    <path d="M9 3v7l-2 5v6" />
    <path d="M15 3v7l2 5v6" />
    <path d="M7 15h10" />
  </Trazo>
);

/** Espalda — el triángulo dorsal y la línea de la columna. */
export const IconoEspalda = (p) => (
  <Trazo {...p}>
    <path d="M12 3v18" />
    <path d="M5 6c0 6 2 9 7 12" />
    <path d="M19 6c0 6-2 9-7 12" />
    <path d="M5 6h14" />
  </Trazo>
);

/** Pecho — los dos pectorales y el esternón entre ellos. */
export const IconoPecho = (p) => (
  <Trazo {...p}>
    <path d="M12 6v10" />
    <path d="M12 6c-2-2-7-2-8 1-1 4 2 8 5 8 2 0 3-2 3-4" />
    <path d="M12 6c2-2 7-2 8 1 1 4-2 8-5 8-2 0-3-2-3-4" />
  </Trazo>
);

/** Hombros — el deltoide sobre la línea del brazo. */
export const IconoHombros = (p) => (
  <Trazo {...p}>
    <path d="M3 12a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5" />
    <path d="M8 7V4M16 7V4" />
    <path d="M6 12v3a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-3" />
  </Trazo>
);

/** Abdominales — la rejilla del recto abdominal con los oblicuos al lado. */
export const IconoAbdominales = (p) => (
  <Trazo {...p}>
    <rect x="7" y="4" width="10" height="16" rx="3" />
    <path d="M12 4v16" />
    <path d="M7 9.5h10M7 15h10" />
  </Trazo>
);

/** Cuello — la cabeza, el cuello y la línea de los trapecios. */
export const IconoCuello = (p) => (
  <Trazo {...p}>
    <circle cx="12" cy="6" r="3" />
    <path d="M10 9v3M14 9v3" />
    <path d="M4 18c2-4 5-6 8-6s6 2 8 6" />
  </Trazo>
);

/* ── Los mapas ───────────────────────────────────────────────────────────── */

/** Una línea por área de `AREAS_FITNESS`. */
export const ICONOS_AREA_FITNESS = {
  rangos: IconoRangos,
  progreso: Camera,
  entrenamiento: Dumbbell,
};

/** Una línea por grupo de `GRUPOS_MUSCULARES`. */
export const ICONOS_GRUPO_MUSCULAR = {
  brazos: IconoBrazos,
  piernas: IconoPiernas,
  espalda: IconoEspalda,
  pecho: IconoPecho,
  hombros: IconoHombros,
  abdominales: IconoAbdominales,
  cuello: IconoCuello,
};

/** El icono de un área. Nunca devuelve `undefined`: un área que no estuviera en
 *  el mapa seguiría pintando algo en vez de dejar un hueco. */
export function iconoDeArea(areaId) {
  return ICONOS_AREA_FITNESS[areaId] || Dumbbell;
}

/** El icono de un grupo muscular, con la misma garantía. */
export function iconoDeGrupo(grupoId) {
  return ICONOS_GRUPO_MUSCULAR[grupoId] || Trophy;
}
