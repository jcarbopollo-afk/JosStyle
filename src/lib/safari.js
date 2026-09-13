/* ===========================================================================
   EL BARRIDO DE SAFARI — SF F1
   ===========================================================================

   🚨 **ESTA FASE NACE DE LO QUE ENSEÑÓ LA SC F1, Y ES LA LECCIÓN MÁS
   INCÓMODA DEL PROYECTO HASTA AHORA.**

   El cuadrado vacío que Josué veía debajo de la tarjeta desplegable llevaba ahí
   **desde la v1.21.0**. La causa era que un elemento de rejilla con la fila a
   `0fr` recibe dos órdenes contradictorias, y **Chromium resuelve a favor de la
   fila mientras Safari resuelve a favor del contenido**. Por eso funcionaba en
   el ordenador y fallaba en el iPhone.

   Y lo que importa de verdad: **ninguna de las 19 578 comprobaciones podía
   verlo**, porque todas —el build, el renderizado y el recorrido— corren en
   Chromium. La aplicación, en cambio, **solo se usa en un iPhone**.

   Así que esto no es una fase de funciones: es **buscar más casos de esa misma
   familia antes de que los encuentre él**. Cosas que las pruebas aprueban y que
   Safari hace de otra manera.

   ⚠️ **LO QUE ESTE ARCHIVO NO ES.** No es una lista de "buenas prácticas" ni un
   catálogo de todo lo que Safari hace distinto: es **lo que este código tiene**,
   comprobado contra los archivos de verdad. Un catálogo genérico se queda viejo
   y nadie lo vuelve a mirar (la lección de los sonidos).
   =========================================================================== */

/* ---------------------------------------------------------------------------
   1 · POR QUÉ NINGUNA PRUEBA PODÍA VER ESTO.

   Es el hueco que hay que tener presente al leer cualquier verde de este
   proyecto, y está escrito aquí para que no se olvide.
   --------------------------------------------------------------------------- */
export const POR_QUE_NO_SE_VE = {
  donde_corren_las_pruebas: 'Chromium',
  donde_se_usa_la_aplicacion: 'Safari, en el iPhone de Josué',
  consecuencia: 'Todo lo que los dos navegadores resuelven de forma distinta sale VERDE en la verificación y mal en su pantalla. No es que la prueba esté mal escrita: es que mira otro navegador.',
  loQueSeHace: 'Buscar en el código los patrones concretos donde se sabe que difieren, arreglarlos, y dejar una regla invariante por cada uno para que el siguiente caiga el mismo día.',
  loQueNoSeHace: 'Prometer que ya no queda ninguno. Lo único que lo demuestra es él abriéndola (R1).',
};

/* ---------------------------------------------------------------------------
   2 · LOS TRES HALLAZGOS, CON SU CONSECUENCIA REAL.

   ⚠️ Cada uno dice **qué se ve en el iPhone**, no "podría fallar". Un hallazgo
   sin consecuencia concreta no se puede priorizar ni comprobar.
   --------------------------------------------------------------------------- */
export const HALLAZGOS_SF = [
  {
    id: 'backdrop_sin_prefijo',
    que: '`backdrop-filter` sin su versión con prefijo `-webkit-`',
    enElIphone: 'En un iPhone con iOS anterior al 18 el desenfoque NO se aplica: la barra inferior, la lupa, el botón de sugerencias, las tarjetas y dos paneles de Ajustes pierden el efecto de cristal y se ven como un bloque plano, a veces con el texto de detrás asomando.',
    porQueDuele: 'El proyecto YA SABÍA esto: `HubView.jsx` lo lleva desde la Fase N4 con un comentario que dice literalmente que hace falta para Safari/iOS. Estaba puesto en UNO de los ocho sitios.',
    arreglo: 'Añadir `WebkitBackdropFilter` (o `-webkit-backdrop-filter` en el CSS) al lado de cada uno.',
    regla: 'Regla invariante en `test-imports.mjs`: todo `backdropFilter` lleva su pareja.',
  },
  {
    id: 'vh_en_la_raiz',
    que: '`min-height: 100vh` en el contenedor raíz de la aplicación',
    enElIphone: 'En Safari de iOS `100vh` NO es la altura visible: incluye la zona que tapan la barra de direcciones y la de herramientas. Así que el contenedor raíz mide más que la pantalla y la página se puede arrastrar hacia abajo dejando una franja vacía, aunque el contenido quepa.',
    porQueDuele: 'Es el fallo de iOS más conocido que existe, y estaba en la raíz de todo — debajo de las 46 fases.',
    arreglo: '`100dvh`, que sí es la altura VISIBLE y cambia con la barra, **dejando `100vh` escrito antes como respaldo** para un navegador que no conozca `dvh`. Y va en `index.css` (clase `alto-visible`), no en el `style` de React: allí dos claves iguales no son un respaldo, la segunda borra a la primera.',
    regla: 'Comprobación de que la clase declara las dos, en ese orden, y de que no queda un `100vh` suelto en el estilo en línea.',
  },
  {
    id: 'localstorage_sin_guarda',
    que: '`localStorage.setItem` sin `try` en el emisor de avisos',
    enElIphone: 'En una ventana privada de Safari —o con el almacenamiento lleno— escribir en `localStorage` LANZA. Y esa escritura está antes de mandar el aviso, así que no es que se pierda la marca: **es que el aviso no llega**, y el error se lleva por delante la llamada entera.',
    porQueDuele: 'El mismo archivo ya comprueba `window.localStorage` antes de leer, o sea que la preocupación estaba — pero comprobar que EXISTE no es lo mismo que comprobar que DEJA escribir. Y en el resto del proyecto (`horarioEstructura.js`) sí está bien hecho, con su `try` y su comentario.',
    arreglo: 'Envolver la marca en `try`, y que un fallo al guardarla no impida el aviso: perder la marca repite un aviso como mucho; perder el aviso lo pierde del todo.',
    regla: 'Comprobación de que toda escritura en `localStorage` de `src/lib/` va dentro de un `try`.',
  },
];

/* ---------------------------------------------------------------------------
   3 · LO QUE SE MIRÓ Y ESTABA BIEN.

   🚨 Esto importa tanto como los hallazgos: sin ello, la siguiente sesión vuelve
   a barrer lo mismo. Y son sitios donde el proyecto YA había aprendido la
   lección, así que dice qué funciona.
   --------------------------------------------------------------------------- */
export const MIRADO_Y_CORRECTO = [
  {
    que: 'Las fechas construidas desde una cadena',
    porque: 'Las 25 llamadas usan la forma `new Date(`${iso}T00:00:00`)`. Safari NO acepta `new Date("2026-09-13 10:00")` —con espacio en vez de T— y devuelve una fecha inválida donde Chrome funciona. Aquí no hay ni una: es la lección del UTC, que este proyecto ya pagó siete veces.',
  },
  {
    que: 'La Notification API',
    porque: '`notificaciones.js` comprueba `!(\'Notification\' in window)` antes de tocarla y envuelve `new Notification` en un `try` que explica que en el móvil puede exigir un Service Worker. En Safari de iOS eso es exactamente lo que pasa.',
  },
  {
    que: 'Las preferencias del horario en `localStorage`',
    porque: '`leerVisual` y `guardarVisual` van con `try` y con `typeof localStorage === \'undefined\'`. Es el modelo de cómo se hace, y por eso el hallazgo 3 se arregla igual que ellas.',
  },
  {
    que: 'La Safe Area',
    porque: '`--safe-top`/`--safe-bottom` con `env(safe-area-inset-*)` y `viewport-fit=cover` en el manifiesto (E3 F15). Sin ese `viewport-fit` las variables valen cero y no se nota hasta que se prueba en un iPhone con isla.',
  },
];

/* ---------------------------------------------------------------------------
   4 · LO QUE SE MIRÓ Y SE DEJA COMO ESTÁ, CON SU MOTIVO.

   ⚠️ No todo lo que Safari tardó en soportar hay que cambiarlo. Cambiar algo
   por si acaso es como se acaba con código que nadie entiende.
   --------------------------------------------------------------------------- */
export const MIRADO_Y_SE_QUEDA = [
  {
    que: '`Array.prototype.at(-1)`, en cuatro librerías',
    porque: 'Safari lo tiene desde la 15.4 (marzo de 2022). Un iPhone que abra una PWA hoy lo tiene; sustituirlo por `[x.length - 1]` haría el código peor a cambio de nada. Queda escrito para que nadie lo "arregle" sin motivo.',
  },
  {
    que: '`gap` dentro de un `flex`',
    porque: 'Safari lo tiene desde la 14.1. Es la mitad del diseño de esta aplicación; si eso fallara, no habría pantalla que se viera bien y se habría notado el primer día.',
  },
];

/* ---------------------------------------------------------------------------
   LA AUDITORÍA DE LA FASE — se CALCULA leyendo los archivos.

   ⚠️ Nadie pone una casilla a `true`: cada una busca el arreglo en el archivo
   real (EH F42). Recibe el contenido porque una librería del navegador no lee
   del disco; se lo pasa la prueba.
   --------------------------------------------------------------------------- */

/** Cuenta cuántos `backdropFilter` de un archivo NO llevan su pareja con prefijo. */
export function backdropSinPrefijo(src = '') {
  const codigo = String(src)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ');
  const conPrefijo = (codigo.match(/WebkitBackdropFilter|-webkit-backdrop-filter/g) || []).length;
  const total = (codigo.match(/(?<!Webkit)backdropFilter|(?<!-webkit-)backdrop-filter/g) || []).length;
  return Math.max(0, total - conPrefijo);
}

/**
 * ¿Hay alguna escritura en `localStorage` fuera de un `try`? Devuelve las líneas.
 *
 * 🐛 **VIGESIMOPRIMERA VEZ DE LA LECCIÓN DE SIEMPRE, y la pisé aquí dentro.** La primera versión
 * solo quitaba los comentarios de `//`, así que señalaba **el comentario que explica el fallo** —el
 * que dice que `localStorage.setItem` lanza en Safari— como si fuera el fallo. Los bloques `/* *\/`
 * se quitan **conservando los saltos de línea**, porque lo que se devuelve son números de línea y
 * borrarlos los desplazaría todos.
 */
export function escriturasSinTry(src = '') {
  const sinBloques = String(src).replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const lineas = sinBloques.split('\n');
  const fuera = [];
  let profundidadTry = 0;
  lineas.forEach((linea, i) => {
    const limpia = linea.replace(/\/\/.*$/, '');
    if (/\btry\s*\{/.test(limpia)) profundidadTry += 1;
    if (profundidadTry > 0 && /\}\s*catch/.test(limpia)) profundidadTry -= 1;
    if (/localStorage\.setItem|localStorage\.removeItem/.test(limpia) && profundidadTry === 0) {
      fuera.push(i + 1);
    }
  });
  return fuera;
}

export function condicionSF({ css = '', app = '', ui = '', ajustes = '', notificaciones = '' } = {}) {
  const casillas = [
    {
      id: 'blur_en_todas_partes',
      texto: 'Todo desenfoque lleva su versión con prefijo, así que también se ve en un iPhone antiguo',
      ok: backdropSinPrefijo(css) === 0 && backdropSinPrefijo(app) === 0
        && backdropSinPrefijo(ui) === 0 && backdropSinPrefijo(ajustes) === 0,
    },
    {
      id: 'altura_visible',
      texto: 'La raíz mide la altura VISIBLE del iPhone, no la que incluye las barras de Safari',
      ok: /\.alto-visible\s*\{[^}]*min-height:\s*100vh;[^}]*min-height:\s*100dvh/.test(css)
        && /className="alto-visible"/.test(app) && !/minHeight: '100vh'/.test(app),
    },
    {
      id: 'marca_de_aviso_protegida',
      texto: 'Un fallo al guardar la marca del aviso no impide que el aviso llegue',
      ok: escriturasSinTry(notificaciones).length === 0,
    },
    {
      id: 'se_declara_lo_mirado',
      texto: 'Lo que se miró y estaba bien queda escrito, para no volver a barrerlo',
      ok: MIRADO_Y_CORRECTO.length >= 4 && MIRADO_Y_SE_QUEDA.length >= 2,
    },
  ];
  return { casillas, ok: casillas.every((c) => c.ok) };
}

/* ---------------------------------------------------------------------------
   Lo que esta fase NO puede demostrar, dicho (E3 F46).
   --------------------------------------------------------------------------- */
export const FUERA_DEL_ALCANCE_SF = [
  {
    que: 'Que los tres arreglos se vean bien EN SAFARI',
    porque: 'Es la pescadilla: la verificación corre en Chromium, que es justo el navegador donde ninguno de los tres fallaba. Lo que aquí se comprueba es que el arreglo está puesto en todos los sitios, no en uno de ocho.',
    decide: 'Josué, abriéndola en su iPhone',
  },
  {
    que: 'Que no queden más casos de esta familia',
    porque: 'Se han barrido los patrones que este código usa —desenfoque, alturas de ventana, fechas desde cadena, almacenamiento local, la API de avisos—. Safari se diferencia en más cosas, y las que no estén aquí es porque hoy no se usan. Cuando él reporte algo que solo pasa en el iPhone, este archivo es el primer sitio donde mirar.',
    decide: 'Josué, usándola',
  },
];
