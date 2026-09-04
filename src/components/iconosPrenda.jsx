/* ===========================================================================
   ENTREGA 3 · FASE 3 — ICONOGRAFÍA DEL ARMARIO (apartados 3, 4 y 5)
   ===========================================================================

   *"Actualmente algunas categorías utilizan iconos demasiado genéricos, por
   ejemplo una camiseta para representar accesorios. Esto debe sustituirse. Cada
   categoría debe utilizar un icono que represente realmente su contenido."*

   🐛 **El fallo era peor de lo que parecía:** `CATEGORIAS_ARMARIO` ya declaraba
   un `icono` por categoría desde AR F1 —`Shirt`, `Watch`, `Footprints`…— y
   **nadie lo leía**. La pantalla pintaba `<Shirt>` a pelo en todas partes, así
   que el campo estaba ahí sin hacer nada y los accesorios salían con una
   camiseta. Esta fase lo conecta y amplía el catálogo.

   ── POR QUÉ HAY ICONOS PROPIOS ─────────────────────────────────────────────

   El apartado 4 es explícito: *"No utilizar emojis directamente si el sistema
   visual actual utiliza iconos vectoriales. Si el proyecto utiliza Lucide […]
   utilizar los iconos disponibles más apropiados. Si no existe un icono
   suficientemente preciso, seleccionar la alternativa más cercana y mantener
   coherencia de estilo."*

   Lucide tiene **una** prenda: `Shirt`. No hay pantalón, ni sudadera, ni
   calcetín, ni gorra. Con solo Lucide, ocho categorías compartirían icono — que
   es exactamente lo que esta fase viene a arreglar. Así que se hace lo que pide
   el apartado 4: *"crear una biblioteca de iconos suficientemente amplia"*,
   **en la gramática visual de Lucide** para que no se noten de otra familia:

     · lienzo de 24×24, dibujo dentro de un margen de 2
     · solo trazo, nunca relleno (`fill: none`)
     · `stroke: currentColor`, grosor 2, esquinas y extremos redondeados
     · `size` en la prop, como cualquier icono de Lucide

   ⚠️ **Lo que SÍ existe en Lucide se usa de Lucide**, no se redibuja: camiseta,
   reloj, huellas, gafas y caja. Redibujarlas sería tener dos versiones del mismo
   icono, y la segunda envejecería sola.

   ⚠️ **Y no se inventa precisión que no hay.** Un jersey y una sudadera sin
   capucha se parecen mucho; el jersey lleva cuello redondo marcado y la sudadera
   capucha y bolsillo. Donde la diferencia no cabe en 24 píxeles, la categoría
   comparte familia con la más cercana **y se dice aquí**, en vez de fingir un
   dibujo distinto que nadie distinguiría.
   =========================================================================== */

import React from 'react';
import { Shirt, Watch, Footprints, Glasses, Package } from 'lucide-react';

/* La base común: todos los iconos propios salen de aquí, así que si algún día
   cambia el grosor de trazo de la aplicación se cambia en UN sitio. */
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

/** Camisa — cuello abierto en pico y botonadura central. */
export const IconoCamisa = (p) => (
  <Trazo {...p}>
    <path d="M6 3 4 5v16h16V5l-2-2-3 1-3 2-3-2Z" />
    <path d="M12 6v13" />
  </Trazo>
);

/** Polo — cuello pequeño y manga corta. */
export const IconoPolo = (p) => (
  <Trazo {...p}>
    <path d="M8 3 4 5l1 5h2v11h10V10h2l1-5-4-2" />
    <path d="M10 3h4l-2 3Z" />
  </Trazo>
);

/** Sudadera — capucha y bolsillo delantero. */
export const IconoSudadera = (p) => (
  <Trazo {...p}>
    <path d="M8 3 3 6l2 6h2v9h10v-9h2l2-6-5-3" />
    <path d="M9 3a3 3 0 0 0 6 0" />
    <path d="M9 15h6" />
  </Trazo>
);

/** Jersey — cuello redondo y puños marcados. */
export const IconoJersey = (p) => (
  <Trazo {...p}>
    <path d="M8 4 3 7l2 6h2v8h10v-8h2l2-6-5-3" />
    <path d="M9 4a3 2.5 0 0 0 6 0" />
    <path d="M5 17h2M17 17h2" />
  </Trazo>
);

/** Chaqueta — dos solapas y cremallera al centro. */
export const IconoChaqueta = (p) => (
  <Trazo {...p}>
    <path d="M9 3 4 6v15h16V6l-5-3" />
    <path d="M9 3l3 4 3-4" />
    <path d="M12 7v14" />
  </Trazo>
);

/** Abrigo — largo, solapas anchas y cinturón. */
export const IconoAbrigo = (p) => (
  <Trazo {...p}>
    <path d="M9 3 4 6v15h16V6l-5-3" />
    <path d="M9 3l3 5 3-5" />
    <path d="M12 8v13" />
    <path d="M4 13h16" />
  </Trazo>
);

/** Pantalón — dos perneras. El que antes era una rejilla. */
export const IconoPantalon = (p) => (
  <Trazo {...p}>
    <path d="M6 3h12l-1 18h-4l-1-9-1 9H7L6 3Z" />
    <path d="M6 7h12" />
  </Trazo>
);

/** Shorts — mismas perneras, cortas. */
export const IconoShorts = (p) => (
  <Trazo {...p}>
    <path d="M5 5h14l-1 11h-5l-1-6-1 6H6L5 5Z" />
    <path d="M5 9h14" />
  </Trazo>
);

/** Chándal — pantalón con la banda lateral. */
export const IconoChandal = (p) => (
  <Trazo {...p}>
    <path d="M6 3h12l-1 18h-4l-1-9-1 9H7L6 3Z" />
    <path d="M6 7h12" />
    <path d="M8.5 9v10M15.5 9v10" />
  </Trazo>
);

/** Zapato — de vestir, con suela y empeine. */
export const IconoZapato = (p) => (
  <Trazo {...p}>
    <path d="M2 17h13l4-2 3 2v2H2v-2Z" />
    <path d="M2 17V9h4l3 4h6" />
  </Trazo>
);

/** Ropa interior — la categoría nueva del apartado 1. */
export const IconoRopaInterior = (p) => (
  <Trazo {...p}>
    <path d="M3 7h18v3a7 7 0 0 1-7 7h-1l-2-5-2 5H8a5 5 0 0 1-5-5V7Z" />
    <path d="M3 10h18" />
  </Trazo>
);

/** Gorra — visera. Para accesorios de cabeza, si algún día se separan. */
export const IconoGorra = (p) => (
  <Trazo {...p}>
    <path d="M4 15a8 8 0 0 1 16 0" />
    <path d="M4 15h17a2 2 0 0 1-2 2H4Z" />
  </Trazo>
);

/* ===========================================================================
   EL MAPA — una línea por categoría
   ===========================================================================
   ⚠️ Como `MODULOS_EH` o `LINEAS_DE_PLAQUITA`: **añadir una categoría al armario
   es añadir su línea aquí**. Ni un `case`, ni un `if` en la vista. Si falta,
   `iconoDeCategoria` devuelve la caja de "Otros" en vez de romperse — pero hay
   una prueba que comprueba que no falte ninguna, para que nadie se entere tarde. */
export const ICONOS_CATEGORIA = {
  camisetas: Shirt,
  camisas: IconoCamisa,
  polos: IconoPolo,
  sudaderas: IconoSudadera,
  jerseis: IconoJersey,
  chaquetas: IconoChaqueta,
  abrigos: IconoAbrigo,
  pantalones: IconoPantalon,
  shorts: IconoShorts,
  chandal: IconoChandal,
  zapatillas: Footprints,
  zapatos: IconoZapato,
  ropa_interior: IconoRopaInterior,
  accesorios: Watch,
  otros: Package,
};

/* Iconos disponibles que no son de una categoría, pero que el apartado 5 pide
   tener a mano para las prendas de dentro ("reloj, gafas, gorra, cinturón"). */
export const ICONOS_EXTRA = {
  gafas: Glasses,
  gorra: IconoGorra,
  reloj: Watch,
};

/** El icono de una categoría. Nunca devuelve `undefined`: una categoría que ya
 *  no está en el catálogo sigue pintando algo (misma regla que `categoriaDe`). */
export function iconoDeCategoria(categoriaId) {
  return ICONOS_CATEGORIA[categoriaId] || Package;
}

/** Para pintarlo directamente: `<IconoCategoria categoria="pantalones" size={18} />`. */
export function IconoCategoria({ categoria, ...props }) {
  const Icono = iconoDeCategoria(categoria);
  return <Icono {...props} />;
}
