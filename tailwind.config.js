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
    },
  },
  plugins: [],
};
