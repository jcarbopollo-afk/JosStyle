/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  /* MS F2, apartado 21 — *"Hover debe existir únicamente donde tenga sentido. En móvil: NO depender de
     hover."* Hoy ninguna pantalla usa `hover:`; con esto, una que lo use mañana solo lo tendrá donde hay
     un puntero de verdad, y en el iPhone no se quedará «pegado» después de tocar. */
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      /* MS F1 — las clases `transition`, `transition-transform`, `transition-colors`… de Tailwind
         usaban su propia duración (150 ms) y su propia curva, así que el pulsar de un botón y el de
         una tarjeta no frenaban igual (hallazgo `dos_curvas` de la F0). Por defecto usan ahora el
         token `fast` y la curva de JosStyle, y por eso respetan el modo y la velocidad de Ajustes
         sin tocar una sola de las cien clases. */
      transitionDuration: { DEFAULT: 'var(--motion-dur-fast)' },
      transitionTimingFunction: { DEFAULT: 'var(--ease-premium)' },
      /* MS F6 — la jerarquía de capas con nombre (`z-capa`, `z-flotante`…), desde las variables de
         `index.css`, que salen de `CAPAS_Z` (src/lib/profundidad.js). Un `z-50` suelto pone la suite
         roja (`auditarProfundidad`). */
      zIndex: {
        fondo: 'var(--z-fondo)',
        base: 'var(--z-base)',
        elevado: 'var(--z-elevado)',
        pegajoso: 'var(--z-pegajoso)',
        flotante: 'var(--z-flotante)',
        aviso: 'var(--z-aviso)',
        capa: 'var(--z-capa)',
        alerta: 'var(--z-alerta)',
      },
    },
  },
  plugins: [],
};
