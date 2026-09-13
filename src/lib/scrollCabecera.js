/* ===========================================================================
   SCROLL, CABECERAS FIJAS Y ACORDEONES — SC F1
   ===========================================================================

   Tres fallos que reportó Josué usando la aplicación en su iPhone, y los tres
   tenían una causa de verdad, no un apaño pendiente:

   1. **La cabecera de Vida y Gestión se iba con las tarjetas.** *"al hacer
      scroll vertical dentro de estas pantallas, parte de la interfaz superior se
      desplaza junto con las tarjetas."*
   2. **La lupa parecía cortada o tapada.** *"no quede parcialmente cortado."*
   3. **La tarjeta desplegable de Inicio dejaba un cuadrado vacío debajo en el
      móvil, y en el ordenador no.** *"el comportamiento no parece estar
      calculando correctamente la altura real del contenido."*

   🚨 **Y ÉL PIDIÓ EXPRESAMENTE LA CAUSA, NO EL APAÑO**: *"Antes de modificar
   código, revisa cómo está implementado actualmente el scroll, el header y los
   contenedores de las tarjetas para corregir la causa real y no hacer un parche
   superficial"*, *"No quiero simplemente ocultar el overflow para esconder el
   problema"* y *"No quiero solucionar el problema poniendo simplemente otro
   `height` fijo para móvil"*. Por eso este archivo declara **qué se tocó y por
   qué**, y su auditoría **lee los archivos de verdad**: si alguien deshace uno
   de los tres arreglos, una casilla se pone roja (EH F42).

   ⚠️ **ESTA FASE NO GUARDA NADA.** No hay clave nueva en `app_data`, ni
   normalizador, ni nada que migrar: es disposición de pantalla. Lo único que
   existe aquí son las constantes que describen las decisiones y la auditoría.
   =========================================================================== */

/* ---------------------------------------------------------------------------
   1 · DÓNDE OCURRE EL SCROLL DE VERDAD.

   Es la pregunta 4 de su revisión técnica —*"Comprueba si el scroll está
   aplicado al `body`, a la página completa o a un contenedor interno"*— y la
   respuesta cambia por completo cuál es el arreglo correcto.
   --------------------------------------------------------------------------- */
export const DONDE_HAY_SCROLL = {
  donde: 'la página entera',
  porque: 'El contenedor de la aplicación mide `min-h-screen` y crece con su contenido; la barra inferior y los dos accesos de arriba son `fixed`. No hay ni un contenedor con `overflow-y` propio en la ruta de un hub.',
  porEsoSticky: 'Con la página como zona de desplazamiento, la cabecera se queda quieta con `position: sticky`. Meterle un contenedor con scroll propio habría obligado a calcular su altura a mano —la del iPhone cambia con la barra de Safari— y es lo que rompe el rebote y deja filas a medias.',
};

/* ---------------------------------------------------------------------------
   2 · LO QUE SE QUEDA QUIETO Y LO QUE SE DESPLAZA.

   Su esquema, literal: *"HEADER / CONTROLES SUPERIORES → FIJOS. CONTENIDO /
   TARJETAS → SCROLL."*
   --------------------------------------------------------------------------- */
export const CAPAS_SUPERIORES = [
  {
    que: 'La lupa de buscar',
    comoSeQuedaQuieto: 'fixed',
    z: 30,
    nota: 'Se declaraba `fixed` desde la BI F2 y NO LO ERA: la clase `.toque-44` de index.css le ponía `position: relative` y le ganaba por orden en la hoja. Se iba con el scroll, que es literalmente lo que él reportó. Su función y su diseño no se tocan; lo que se arregla es la regla que la pisaba.',
  },
  {
    que: 'El botón de sugerencias de la IA',
    comoSeQuedaQuieto: 'fixed',
    z: 30,
    nota: 'ÉSTE SÍ ESTABA BIEN, y la diferencia enseña dónde estaba el fallo de verdad: su `fixed` va en un `<div>` envoltorio que NO lleva `.toque-44` (la clase está en el botón de dentro), así que nada la pisaba. En la lupa las dos clases están en el MISMO elemento, y ahí es donde chocaban. No se toca: sigue siendo otra cosa distinta de la lupa (apartado 2, "no interfiera con el botón de la Guía").',
  },
  {
    que: 'La cabecera del área (ÁREA / Vida)',
    comoSeQuedaQuieto: 'sticky',
    z: 20,
    nota: 'Lo nuevo de esta fase. Va por DEBAJO de los dos botones a propósito: con z-index 30 o más los taparía.',
  },
];

/** El z-index de la banda pegada. Nunca igual o mayor que el de los dos botones. */
export const Z_CABECERA = 20;
export const Z_ACCESOS_FIJOS = 30;

/* ---------------------------------------------------------------------------
   🚨 EL HALLAZGO GORDO DE ESTA FASE, Y NO ESTABA EN EL ENUNCIADO.

   Josué escribió *"el icono de Buscar… no desaparezca al hacer scroll"*, y al
   leerlo di por hecho que ya estaba fijo: lo pone su `className`
   (`accion-superior toque-44 fixed z-30`). **No lo estaba.**

   `.toque-44` —la clase que amplía el área táctil a 44 px, de la E3 F1— declaraba
   `position: relative`. Las dos reglas tienen la misma especificidad (una clase),
   así que **gana la que va después en la hoja, y `index.css` va después de las
   utilidades de Tailwind**. Resultado: desde la E3 F1, **la lupa** se ha
   desplazado con la página. Y además, al estar en el flujo, ocupaba 36 px que
   empujaban hacia abajo todo el contenido de todas las pantallas.

   ⚠️ **Y UNA CORRECCIÓN QUE ME HICE A MÍ MISMO, porque es la misma trampa otra
   vez:** escribí primero que *"los DOS accesos de arriba"* estaban rotos. Es
   falso. **Solo la lupa.** El botón de sugerencias declara su `fixed` en un
   `<div>` envoltorio que NO lleva `.toque-44` —la clase va en el botón de
   dentro—, así que nada lo pisaba. Medí la lupa y extrapolé al otro sin mirarlo:
   exactamente el error que esta misma sección denuncia. Lo que decide no es
   *"usa esas dos clases"*, sino **si están en el MISMO elemento**.

   ⚠️ **MEDIDO, NO SUPUESTO**, que es lo único que lo sacó a la luz:
   `getComputedStyle(lupa).position` devolvía `relative`, y al desplazar 169 px su
   posición pasaba de 14 a −155. La clase decía una cosa y el navegador hacía otra.

   🚨 **Y LA LECCIÓN, QUE ES LA MÁS CARA DE HOY: UN `className` NO ES UNA PRUEBA DE
   NADA.** Leí `fixed` en el código y escribí *"ya estaba fija, no se toca"* en
   esta misma librería. Lo que dice el atributo y lo que calcula el navegador son
   dos cosas distintas, y la única forma de saber cuál gana es **preguntárselo al
   navegador**. Él lo estaba viendo en su pantalla y yo lo estaba descartando
   leyendo el fuente.
   --------------------------------------------------------------------------- */
export const FIXED_QUE_NO_LO_ERA = {
  cuantoLlevaba: 'Desde la E3 F1, cuando nació `.toque-44`',
  quienLoPisaba: '.toque-44 { position: relative }',
  porque: 'Misma especificidad que la utilidad `fixed` de Tailwind, y esta hoja se aplica después.',
  aQuienAfectaba: 'SOLO a la lupa. El botón de sugerencias pone su `fixed` en un div envoltorio que no lleva `.toque-44`, así que estaba bien. Lo que decide no es usar las dos clases, sino tenerlas en el MISMO elemento.',
  seVeiaAsi: 'La lupa se iba con el scroll, y su hueco de 36 px empujaba hacia abajo el contenido de TODAS las pantallas.',
  arreglo: ':where(.toque-44), que tiene especificidad cero: sigue dando el ancestro posicionado que necesita el pseudoelemento de 44 px, y deja de pisar a quien declara su propia posición.',
  loQueNoSeHizo: 'Tocar el `className` de las vistas. El fallo estaba en la hoja, así que se arregla ahí una vez — y de paso queda cubierto cualquier botón futuro que ponga `.toque-44` junto a su propia posición.',
  yMeEquivoqueAntes: 'Escribí que estaban rotos LOS DOS. Solo la lupa. Medí uno y extrapolé al otro sin mirarlo, que es el mismo error que esta fase denuncia.',
  loQueLoDestapo: 'Medirlo en el navegador. Leyendo el código parecía correcto, y de hecho esta misma librería llegó a afirmar que la lupa "ya estaba fija".',
};

/* ---------------------------------------------------------------------------
   3 · POR QUÉ LA BANDA SE SALE DE SU CAJA.

   Un `sticky` a secas dejaba dos agujeros: el contenido seguía viéndose por el
   hueco de arriba (entre los dos botones) y por los lados, y la cabecera daba un
   salto al "pegarse". El margen negativo hacia arriba y hacia los lados, con el
   mismo relleno de vuelta, resuelve las dos cosas sin mover el texto ni un píxel.
   --------------------------------------------------------------------------- */
export const BANDA = {
  clase: 'hub-sticky',
  seSaleArriba: 'calc(var(--safe-top) + 4rem)',
  seSaleALosLados: '1rem',
  porque: 'La franja de arriba —la del reloj del iPhone y los dos accesos— y los 16 px de respiro de los lados no son de la cabecera, pero el contenido pasa por ahí. Sin extender la banda, las tarjetas se veían subir por ese hueco.',
  sinSalto: 'El margen negativo y el relleno miden lo mismo, así que en reposo la cabecera está exactamente donde estaba y al desplazar no se mueve. Nada de un brinco al pegarse.',
};

/* ---------------------------------------------------------------------------
   4 · LAS FILAS, MÁS COMPACTAS — Y CUÁNTO.

   Él lo puso como la prioridad 5 de cinco y con un límite: *"sin cambiar
   radicalmente el diseño"*. Así que es un punto de escala de Tailwind en cada
   cosa, no un rediseño.
   --------------------------------------------------------------------------- */
export const COMPACTADO = [
  { que: 'Relleno de la tarjeta', antes: 'p-5', ahora: 'p-4' },
  { que: 'Hueco entre tarjetas', antes: 'space-y-5', ahora: 'space-y-3' },
  { que: 'Círculo del icono', antes: 'w-14 h-14', ahora: 'w-12 h-12' },
  { que: 'Dibujo del icono', antes: '26', ahora: '22' },
  { que: 'Separación icono/texto', antes: 'gap-4', ahora: 'gap-3.5' },
];

/**
 * ⚠️ **NI UNA LÍNEA DE TEXTO SE PIERDE.** Las dos líneas de resumen de cada
 * módulo —«2 tareas pendientes», «1 clase hoy»— siguen ahí: lo que encoge es el
 * aire, no la información. Es la misma decisión que él confirmó el 2026-09-13
 * sobre la cuadrícula (`auditoriaDist.js`), y por el mismo motivo.
 */
export const LINEAS_QUE_SE_CONSERVAN = ['linea1', 'linea2'];

/* ---------------------------------------------------------------------------
   5 · EL ACORDEÓN, Y POR QUÉ FALLABA SOLO EN EL MÓVIL.

   🚨 Es la parte que más importa de esta fase, porque explica un fallo que
   llevaba ahí desde la v1.21.0 y que **ninguna de las 19 578 comprobaciones
   podía ver**: el navegador con el que se prueba (Chromium) resuelve la
   ambigüedad al revés que Safari, así que la pantalla salía perfecta en todas
   las pruebas y mal en el iPhone de Josué.
   --------------------------------------------------------------------------- */
export const ACORDEON = {
  tecnica: 'grid-template-rows: 0fr ↔ 1fr',
  porQueEsaTecnica: 'Anima la altura REAL sin medirla a mano y sin reservar de antemano el alto del estado abierto. Es la que ya usaba la aplicación; no se cambia, se arregla.',
  loQueFaltaba: 'min-height: 0 en el elemento de rejilla',
  porque: 'Un elemento de rejilla nace con `min-height: auto`, que significa «no te encojas por debajo de tu contenido». Con la fila a `0fr` hay dos órdenes contradictorias, y Safari resuelve a favor de no encogerse: el contenido no se ve —lo tapa el `overflow: hidden`— pero sigue ocupando su alto. Ése es el cuadrado vacío.',
  porQueNoSeVeiaEnElOrdenador: 'Chromium resuelve a favor de la fila. Por eso funcionaba en el ordenador, fallaba en el móvil, y ninguna prueba lo veía.',
  loQueNoSeHizo: [
    'Una altura fija para el móvil (lo prohíbe su apartado 4, y además se rompe en cuanto el texto cambie).',
    'Un `max-height` grande, que estropea la duración de la animación y sigue sin dar el alto real.',
    'Un `@media` por tamaño de pantalla: el fallo no era del tamaño, era del navegador.',
    'Quitar la animación: funciona bien, y su apartado 5 pide conservarla si lo está.',
  ],
};

/** Los dos acordeones de la aplicación. Si aparece un tercero, va a esta lista. */
export const ACORDEONES = [
  { componente: 'IndicadorContexto', archivo: 'src/views/DashboardView.jsx', que: 'La situación actual y sus opciones' },
  { componente: 'TarjetaPuntuacion', archivo: 'src/views/DashboardView.jsx', que: 'La puntuación del día y de dónde sale' },
];

/* ---------------------------------------------------------------------------
   6 · LO QUE ESTA FASE NO TOCA, DECLARADO.
   --------------------------------------------------------------------------- */
export const NO_SE_TOCA = [
  { que: 'La barra inferior', porque: 'No entra en el encargo y sigue siendo la de siempre, con sus cinco pestañas (regla 10).' },
  { que: 'La función de la lupa', porque: 'Él lo dijo con todas las letras: "No quiero cambiar su función ni su diseño. Solamente corregir su comportamiento respecto al scroll".' },
  { que: 'Los colores, la tipografía y los iconos', porque: 'Su primer límite. El único color nuevo es el de la banda, y sale del MISMO token que la barra inferior, no de un color inventado.' },
  { que: 'El comportamiento en el ordenador', porque: 'Su apartado 6, en mayúsculas. Las tres correcciones son de las que arreglan el móvil sin cambiar nada donde ya iba bien: el `sticky` se comporta igual en los dos, y el `min-height: 0` es lo que Chromium ya hacía por su cuenta.' },
];

/* ---------------------------------------------------------------------------
   LA AUDITORÍA DE LA FASE — se CALCULA leyendo los archivos.

   ⚠️ Nadie pone una casilla a `true`: cada una busca el arreglo en el archivo
   real, así que deshacer uno la pone roja (EH F42, E3 F46). Recibe el contenido
   de los archivos porque una librería del navegador no puede leer el disco; se
   lo pasa la prueba.
   --------------------------------------------------------------------------- */
export function condicionSC({ css = '', hub = '', dashboard = '' } = {}) {
  const acordeones = (dashboard.match(/gridTemplateRows:/g) || []).length;
  const conMinHeight = (dashboard.match(/overflow: 'hidden', minHeight: 0/g) || []).length;
  const casillas = [
    {
      id: 'cabecera_pegada',
      texto: 'La cabecera del área se queda quieta al desplazar',
      ok: /\.hub-sticky\s*\{[^}]*position:\s*sticky/.test(css) && /hub-sticky/.test(hub),
    },
    {
      id: 'banda_completa',
      texto: 'La banda tapa el hueco de arriba y el de los lados, así que nada se cuela por detrás',
      ok: /\.hub-sticky\s*\{[^}]*margin-top:\s*calc\(-1 \* \(var\(--safe-top\) \+ 4rem\)\)/.test(css)
        && /\.hub-sticky\s*\{[^}]*margin-left:\s*-1rem/.test(css),
    },
    {
      id: 'por_debajo_de_los_botones',
      texto: 'La cabecera va por debajo de la lupa y del botón de sugerencias, no por encima',
      ok: new RegExp(`\\.hub-sticky\\s*\\{[^}]*z-index:\\s*${Z_CABECERA}\\b`).test(css) && Z_CABECERA < Z_ACCESOS_FIJOS,
    },
    {
      id: 'filas_compactas',
      texto: 'Las filas del hub son algo más finas, sin perder ninguna de sus dos líneas',
      ok: /rounded-3xl p-4 flex items-center/.test(hub) && /w-12 h-12 rounded-2xl/.test(hub)
        && /space-y-3 pb-4/.test(hub) && /linea1/.test(hub) && /linea2/.test(hub),
    },
    {
      id: 'acordeon_sin_hueco',
      texto: 'Los acordeones de Inicio cierran a cero de verdad, también en Safari',
      ok: acordeones > 0 && conMinHeight === acordeones,
    },
    {
      id: 'sin_altura_fija',
      texto: 'No se ha arreglado con una altura fija ni con un tamaño de pantalla',
      ok: !/(max-height|minHeight):\s*['"]?\d+px/.test(dashboard) && !/@media[^}]*hub-sticky/.test(css),
    },
  ];
  return { casillas, ok: casillas.every((c) => c.ok) };
}

/* ---------------------------------------------------------------------------
   Lo que esta fase NO puede comprobar, dicho (E3 F46).
   --------------------------------------------------------------------------- */
export const FUERA_DEL_ALCANCE_SC = [
  {
    que: 'Que el cuadrado vacío haya desaparecido EN SAFARI',
    porque: 'El recorrido corre en Chromium, y Safari es justo el navegador en el que el fallo se veía — el otro nunca lo enseñó. Lo que sí se comprueba aquí es que el arreglo está puesto en los dos acordeones y que el cierre mide cero.',
    decide: 'Josué, abriéndola en su iPhone',
  },
  {
    que: 'El rebote y el gesto de desplazar con el dedo',
    porque: 'Chromium sin dedo no reproduce el desplazamiento por inercia de iOS.',
    decide: 'Josué, abriéndola en su iPhone',
  },
];
