/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F5 — LOS UMBRALES DE LOS GESTOS (apartado 10)

   *"Crear tokens/configuración para minimum velocity, dismiss velocity, maximum
   velocity. No hardcodear arbitrariamente en múltiples componentes."* Una sola
   vez, aquí, y sin importar nada: es una hoja del árbol de imports, así que la
   puede leer un motor de Fitness (el de cambiar de ejercicio, FIT F9) sin
   traerse el motor de movimiento. El motor de gestos (`gestosMotion.js`) los
   reexporta y es quien los usa.
   =========================================================================== */
export const UMBRALES_GESTO = Object.freeze({
  /** Lo que el dedo tiene que moverse antes de decidir nada: menos es un toque que tiembla. */
  arranque: 8,
  /** Un gesto es de un eje si su recorrido en él es esta vez y media el del otro (FIT F9). */
  proporcionEje: 1.5,
  /** Por debajo de esta velocidad (px/ms) no hay lanzamiento: el dedo se ha parado. */
  velocidadMinima: 0.11,
  /** Un lanzamiento hacia fuera a esta velocidad cierra aunque haya recorrido poco. */
  velocidadCierre: 0.5,
  /** Tope: una muestra más rápida es un salto del puntero, no un dedo. */
  velocidadMaxima: 4,
  /** Fracción del tamaño de lo que se arrastra a partir de la cual soltar lo cierra. */
  distanciaCierre: 0.35,
  /** Lo que hay que deslizar para pasar de ejercicio (era `UMBRAL_GESTO_PX`, FIT F9). */
  distanciaCambio: 56,
  /** MS F15 (apartados 47 y 48) — la franja de cada lado que es del SISTEMA: deslizar desde el borde
   *  izquierdo es «atrás» en Safari. Un dedo que se apoya ahí no empieza un gesto de la aplicación. */
  bordeSistema: 20,
  /** La constante de la resistencia: la de iOS. Más grande, más blando. */
  resistencia: 0.55,
  /** Las muestras que cuentan para la velocidad: las de los últimos 100 ms. */
  ventanaVelocidadMs: 100,
  /** Un muelle que mueve píxeles está en reposo a un cuarto de píxel (lo que ya no se ve en una
   *  pantalla de 3×) y a menos de 4 px/s. Con el reposo genérico del motor, una vuelta de 30 px
   *  seguía «animando» 900 ms, y un arrastre nuevo en ese rato se peleaba con ella (MS F5). */
  reposoPx: 0.25,
  reposoVelocidad: 4,
});
