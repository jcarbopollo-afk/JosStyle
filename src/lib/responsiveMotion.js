/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F15 — MOTION RESPONSIVE, ORIENTACIÓN, ÁREAS SEGURAS Y
   ADAPTACIÓN A CADA DISPOSITIVO

   *"No queremos simplemente: mobile = desktop pero más pequeño. Queremos: el
   mismo lenguaje de movimiento adaptado al contexto físico."* Y la regla
   permanente (apartado 56): *"¿Esta diferencia existe porque cambia realmente la
   interacción o simplemente porque el viewport es diferente?"*

   Lo que dice la auditoría (apartado 1), MEDIDO en el código y no supuesto:
     · JosStyle es UNA columna de `max-w-md` (448 px) centrada en todos los
       tamaños, con la barra de cinco pestañas abajo SIEMPRE. No hay barra
       lateral, ni una navegación de escritorio que aparezca a partir de un
       ancho: no hay nada que transformar entre las dos (apartados 28 y 29).
     · `index.css` no tiene ni una media query de ancho —solo la de «Reducir
       movimiento» y, desde aquí, la de las tarjetas que flotan—, ni una
       container query. Los cortes reales son los de Tailwind que usan las
       vistas: `min-[360px]`, `sm`, `md` y `xl` (`BREAKPOINTS_REALES`).
     · De los cuatro, UNO cambia la interacción: en `sm` una hoja que sube del
       borde (el pulgar, el táctil) pasa a ser una ventana centrada. Es el único
       corte de movimiento (`MOTION_BREAKPOINTS`); los otros tres cambian un
       texto o un número de columnas, y el movimiento es el mismo.

   Lo que esta fase hace, además de declararlo:
     · las ÁREAS SEGURAS de los lados y de abajo (index.css: `accion-izquierda`,
       `accion-derecha`, `visor-seguro`, `velo-pie-seguro`, `velo-arriba`,
       `caja-cabe`, `flotante-cabe`), que `auditarResponsive` vigila;
     · ASENTAR lo que viaja al girar el teléfono o cambiar el ancho
       (`asentarMovimiento`, en el orquestador) y volver a leer cómo sale una
       capa abierta (`reevaluarCapas`);
     · el TECLADO del iPhone: la barra de abajo se aparta mientras se escribe
       (`tecladoAbierto`, y el atributo `data-teclado`);
     · los gestos dejan al sistema los bordes de la pantalla
       (`empiezaEnBordeDelSistema`, `UMBRALES_GESTO.bordeSistema`).
   Una sola pieza escucha la ventana: `useContextoFisico` (App.jsx), con UN
   escuchador por evento y un fotograma de por medio (apartados 41 y 42).
   =========================================================================== */

import { DISPOSITIVOS_DE_PRUEBA } from './movilFitness';

/* ───────────────────────────────────────────────────────────────────────────
   1 · LOS CORTES DE VERDAD (apartados 1 y 2)
   ─────────────────────────────────────────────────────────────────────────── */

/** El ancho de la columna de la aplicación (`max-w-md`): no pasa de aquí en ningún dispositivo. */
export const ANCHO_COLUMNA = 448;

/** Los cortes que usa el código, con lo que cambia en cada uno. `auditarResponsive` los busca en las vistas. */
export const BREAKPOINTS_REALES = Object.freeze([
  { id: 'min-[360px]', px: 360, cambia: 'texto', donde: 'FitnessView: el nombre corto de una pestaña (FIT F38).' },
  { id: 'sm', px: 640, cambia: 'interaccion', donde: 'Las hojas de Fitness (`HOJA.velo`, `HOJA.veloConfirmacion`), las fichas del Armario y la rejilla de Rangos: la hoja de abajo pasa a ventana centrada.' },
  { id: 'md', px: 768, cambia: 'columnas', donde: 'Las rejillas de la biblioteca de ejercicios, las alternativas y los rangos.' },
  { id: 'xl', px: 1280, cambia: 'columnas', donde: 'La biblioteca de ejercicios (FIT F34).' },
]);

/**
 * Los cortes de MOVIMIENTO (apartado 2: *"Diferenciar layout breakpoint de motion breakpoint"*): solo donde
 * cambia la interacción. En `sm` la hoja que sube del borde pasa a ser una ventana que crece en su sitio, y
 * de eso se encarga solo `tipoDeCapa` (F6), que lo lee del estilo calculado. Ni una duración cambia.
 */
export const MOTION_BREAKPOINTS = Object.freeze([
  { id: 'sm', px: 640, debajo: 'hoja', encima: 'modal', porque: 'Debajo, la tarjeta sale del borde que toca el pulgar y se arrastra para cerrarla; encima, es una ventana centrada para un puntero, que crece desde su sitio. Cambia la interacción, así que cambia el movimiento.' },
]);

/** El tipo de capa que tiene una hoja con `items-end sm:items-center` en una ventana de este ancho. */
export const capaSegunAncho = (ancho) => (Number(ancho) >= MOTION_BREAKPOINTS[0].px ? 'modal' : 'hoja');

/* ───────────────────────────────────────────────────────────────────────────
   2 · EL TECLADO (apartados 13-16)

   Safari de iOS no encoge la página al abrir el teclado: encoge lo que SE VE
   (`visualViewport`). Así que «está abierto» es: hay un campo de escribir con el
   foco Y lo que se ve es bastante más bajo que la página, sin pellizco de por
   medio (un zoom también encoge lo que se ve). Un teclado del iPhone mide más
   de 250 px; la barra de Safari que aparece y desaparece, menos de 100.
   ─────────────────────────────────────────────────────────────────────────── */
export const UMBRAL_TECLADO = 150;

const TIPOS_SIN_TECLADO = ['button', 'submit', 'reset', 'checkbox', 'radio', 'range', 'color', 'file', 'image', 'hidden'];

/** ¿Este elemento saca el teclado al enfocarlo? */
export function escribeConTeclado(el) {
  if (!el || el.nodeType !== 1) return false;
  const etiqueta = String(el.tagName || '').toLowerCase();
  if (etiqueta === 'textarea') return !el.readOnly && !el.disabled;
  if (etiqueta === 'input') {
    const tipo = String(el.type || el.getAttribute?.('type') || 'text').toLowerCase();
    return !TIPOS_SIN_TECLADO.includes(tipo) && !el.readOnly && !el.disabled;
  }
  return el.isContentEditable === true;
}

/** ¿Está el teclado abierto? Las tres cosas a la vez; con una que falte, no. */
export function tecladoAbierto({ altoPagina, altoVisible, escala = 1, enfocado = null } = {}) {
  if (!escribeConTeclado(enfocado)) return false;
  const pagina = Number(altoPagina);
  const visible = Number(altoVisible);
  if (!Number.isFinite(pagina) || !Number.isFinite(visible) || visible <= 0) return false;
  if (Math.abs((Number(escala) || 1) - 1) > 0.01) return false;
  return pagina - visible > UMBRAL_TECLADO;
}

/* ───────────────────────────────────────────────────────────────────────────
   3 · CADA CONTEXTO, Y LO QUE CAMBIA EN ÉL (apartados 3-8)
   ─────────────────────────────────────────────────────────────────────────── */
export const LENGUAJE_POR_CONTEXTO = Object.freeze([
  { contexto: 'Móvil', prioriza: 'Respuesta inmediata, el dedo, las hojas que suben del borde, la barra de abajo y el área segura.', cambia: 'Las hojas suben de su borde y se arrastran para cerrarlas (F5); pulsar encoge (F3); los bordes de la pantalla son del sistema.' },
  { contexto: 'Tablet', prioriza: 'Lo que diga su ancho y su entrada, no una etiqueta.', cambia: 'Nada propio (apartado 5): a 820 px en vertical es una ventana centrada con el dedo; si lleva ratón, además el hover. No es un «móvil gigante» ni un «escritorio pequeño»: es la misma columna con el corte `sm` y la entrada que tenga.' },
  { contexto: 'Escritorio', prioriza: 'Precisión, puntero, teclado y foco.', cambia: 'Las hojas son ventanas centradas (`sm`); el hover existe solo con un puntero de verdad (`hoverOnlyWhenSupported`, F2); el foco se ve con `:focus-visible` (FIT F39). Las duraciones son las mismas.' },
]);

export const ENTRADAS_MOTION = Object.freeze([
  { entrada: 'touch', como: 'Pulsar encoge (`ESCALAS_AL_TOCAR`, F3), arrastrar mueve (F5), y un dedo en el borde es del sistema.' },
  { entrada: 'mouse', como: 'El hover lo genera Tailwind solo con `(hover: hover) and (pointer: fine)` (F2): en el iPhone no se queda pegado. Un ratón nunca empieza un gesto de borde.' },
  { entrada: 'trackpad', como: 'Es un puntero fino: lo mismo que el ratón, sin nada propio.' },
  { entrada: 'keyboard', como: 'El foco con su anillo (`:focus-visible`), Escape cierra las hojas (`useDialogoAccesible`), y el tabulador no sale de una capa abierta.' },
  { entrada: 'stylus', como: 'Un lápiz es un puntero (`pointerType: "pen"`): toca como el dedo y, como el dedo, deja los bordes al sistema.' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   4 · LA MATRIZ DE COMPROBACIÓN (apartado 49)

   ⚠️ **No es una segunda lista**: los siete tamaños de Fitness
   (`DISPOSITIVOS_DE_PRUEBA`, FIT F38) ya son el móvil pequeño, el SE, el
   estándar, el grande, el iPhone en horizontal, el iPad y el escritorio. Esta
   matriz los AMPLÍA con lo que el apartado 49 pide y aquélla no tenía —el iPad
   en horizontal, un escritorio pequeño y uno grande, y el zoom al 200 % (un
   escritorio de 1280 × 900 a 200 % es una ventana de 640 × 450 en píxeles
   CSS)—, y a cada uno le pone su entrada y la forma que tiene ahí una hoja.
   ─────────────────────────────────────────────────────────────────────────── */
export const CONTEXTOS_QUE_AMPLIAN = Object.freeze([
  { id: 'ipad-horizontal', nombre: 'iPad en horizontal', ancho: 1024, alto: 768, entrada: 'touch' },
  { id: 'escritorio-pequeno', nombre: 'Escritorio pequeño', ancho: 900, alto: 620, entrada: 'mouse' },
  { id: 'escritorio-grande', nombre: 'Escritorio grande', ancho: 1600, alto: 1000, entrada: 'mouse' },
  { id: 'zoom-200', nombre: 'Zoom al 200 %', ancho: 640, alto: 450, entrada: 'mouse' },
]);
export const CONTEXTOS_FISICOS = Object.freeze([
  ...DISPOSITIVOS_DE_PRUEBA.map((d) => ({ ...d, entrada: d.ancho >= 1100 ? 'mouse' : 'touch' })),
  ...CONTEXTOS_QUE_AMPLIAN,
].map((c) => Object.freeze({ ...c, capa: capaSegunAncho(c.ancho) })));

/** Lo que se combina con cada contexto (apartados 40 y 49): «Reducir movimiento» y el teclado. */
export const COMBINACIONES_MATRIZ = Object.freeze(['reducido', 'teclado_abierto', 'teclado_cerrado']);

/* ───────────────────────────────────────────────────────────────────────────
   5 · LO QUE CAMBIA, Y LO QUE NO (apartados 21-27, 43-46)
   ─────────────────────────────────────────────────────────────────────────── */
export const DECISIONES_F15 = Object.freeze([
  { apartados: [25], que: 'Las distancias', decision: 'Se quedan. Los recorridos de entrada (16-24 px) y el umbral de cambiar de ejercicio (`distanciaCambio`, 56 px) se miden contra una columna que nunca pasa de 448 px: son el 13-15 % de su ancho en un iPhone de 375 y el 12 % en el escritorio. Lo que sí escala ya escalaba: una hoja sube TODO su alto (`--hoja-recorrido: 100%`) y cerrarla es el 35 % de su tamaño (`distanciaCierre`).' },
  { apartados: [26], que: 'Las duraciones', decision: 'Las mismas en todos los tamaños. Lo que cambia la duración es la velocidad elegida en Ajustes (`data-velocidad`), nunca el ancho de la ventana.' },
  { apartados: [27], que: 'La cascada de una lista', decision: 'Ya tiene tope en todos los tamaños (`escalonado`: retraso máximo y número de elementos que escalonan, F1), así que una lista larga en el móvil no tarda más. No hace falta un segundo tope por pantalla.' },
  { apartados: [22, 23], que: 'La profundidad y el desenfoque', decision: 'El velo de una hoja no desenfoca (`CAPAS.veloHoja`, un color), y el único desenfoque de fondo animado es el de «Ultra» (`--motion-velo-desenfoque`), que el usuario elige. Los desenfoques fijos son los de dos botones de 36 px y la barra de abajo: área pequeña, no toda la pantalla.' },
  { apartados: [24], que: 'Las sombras', decision: 'Los mismos cinco tokens de la F6 (`--sombra-*`) en todos los tamaños. Una colección por pantalla es lo que pide no crear.' },
  { apartados: [21], que: 'Los elementos compartidos', decision: 'La continuidad (F7) apunta el rectángulo de verdad al tocar y lo mide al llegar, en ese ancho: no supone ninguna geometría. Si el ancho cambia a mitad del viaje, `asentarMovimiento` lo termina.' },
  { apartados: [35, 36], que: 'Las rejillas que cambian de columnas', decision: 'Se recolocan al momento: una lista que cambia de ancho es otro diseño (`cambioDeDiseno`, F10) y no se anima. Lo que no pasa es que una fila se vaya con un FLIP de antes.' },
  { apartados: [43, 44], que: 'Container queries', decision: 'No hay ninguna, y una tarjeta no cambia de diseño por su ancho: la columna es la misma en todos los tamaños. Cuando haga falta, el sitio es el componente, sin duplicarlo.' },
  { apartados: [45], que: 'La densidad de píxeles', decision: 'Nada del movimiento lee `devicePixelRatio`: se mide en píxeles CSS. Lo único que mira la densidad es el reposo de un muelle (un cuarto de píxel, F5), y es el mismo en todas.' },
  { apartados: [46], que: 'La frecuencia de refresco', decision: 'Todo lo que se mueve va por CSS, por la Web Animations API o con `requestAnimationFrame` y el tiempo real del fotograma. `auditarCosteMotion` (F13) caza un `setInterval` en una pieza de movimiento.' },
  { apartados: [38, 39], que: 'La letra grande y el zoom', decision: 'Las tarjetas que flotan caben en lo que se ve (`caja-cabe`, `hoja-movil`, `flotante-cabe`) y desplazan dentro, así que el botón de cerrar sigue a la vista al 200 %. El recorrido lo mide a 640 × 450.' },
]);

/** Lo que se miró y estaba bien: para no volver a barrerlo. */
export const REVISADO_Y_BIEN_F15 = Object.freeze([
  { que: 'La barra de abajo y la cabecera', porque: '`nav-segura` y `pantalla-segura` ya dejaban el área segura de abajo y de arriba (E3 F1), y la columna de 448 px centrada queda siempre lejos de la isla en horizontal (en el iPhone más estrecho, 667 px, sobran 109 por lado y la isla ocupa 47).' },
  { que: 'Las hojas de Fitness, el ＋ y las de los rangos', porque: 'Dejan su `--safe-bottom` (`HOJA.abajo`, FIT F38) y tienen tope en `dvh` (`hoja-movil`).' },
  { que: 'Los visores de fotos', porque: 'Ya empezaban debajo de la hora y acababan encima de la barra de inicio; solo les faltaban los lados, que ahora pone `visor-seguro`.' },
  { que: 'El hover', porque: 'Tailwind solo lo genera con un puntero que lo tiene (`hoverOnlyWhenSupported`, MS F2): ninguna función depende de él y en el iPhone no se queda pegado.' },
  { que: 'Los menús y los avisos', porque: 'Los menús de las tarjetas se despliegan DENTRO de la tarjeta (sin `fixed`): no pueden chocar con un borde. Los avisos van centrados a lo ancho, encima de la barra.' },
  { que: 'Las áreas de toque', porque: 'Pulsar escala el DIBUJO, nunca el área: `toque-44` es un pseudoelemento que no encoge con el `transform` del botón… y el que sí encogería es el del dibujo, de 36 px, que ya pasaba de 44 con él.' },
  { que: 'Girar con el dedo apoyado', porque: 'iOS cancela los toques al girar (`pointercancel`), y la máquina de estados de la F8 (`gestoAbandonado`) suelta el gesto: la hoja vuelve a su sitio.' },
]);

/** Lo que no se hace, con su motivo. */
export const NO_EN_F15 = Object.freeze([
  { que: 'Una navegación lateral en escritorio y su transformación', porque: 'No existe: la barra de cinco pestañas es la misma en todos los tamaños (regla 10). Inventar una barra lateral para tener algo que animar es lo que pide el apartado 52 no hacer.' },
  { que: 'Recolocar las hojas encima del teclado con JavaScript', porque: 'Safari ya desplaza lo que se ve para enseñar el campo enfocado; moverlo otra vez es justo el «foco → scroll → animación → teclado → segundo scroll» del apartado 16. Lo que se aparta es la barra de abajo, que es lo que flotaba encima.' },
  { que: 'El zoom que hace Safari al enfocar un campo de 14 px', porque: 'Es la C-32, y la decide Josué: arreglarlo cambia la letra de todos los formularios.' },
  { que: 'Reposicionar un menú que choca con un borde', porque: 'Ningún menú de JosStyle flota libre: el único panel anclado a un botón (las sugerencias) nace en su esquina, hacia dentro de la pantalla, y cabe en lo que se ve (`flotante-cabe`).' },
  { que: 'Animar el cambio de orientación o de corte', porque: 'Apartado 52: la estabilidad tiene prioridad. Al cambiar el diseño, lo que viajaba se asienta y lo nuevo aparece quieto.' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   6 · LA AUDITORÍA

   Lee el código de las vistas y de los componentes, y el CSS:
     · `lado_sin_area_segura` — algo `fixed` (que no cubre la pantalla) con su
       `left` o `right` en un número: en horizontal queda debajo de la isla;
     · `hoja_sin_pie_seguro` — un velo con su tarjeta abajo (`items-end`) sin
       dejar la barra de inicio: ni `velo-pie-seguro` en el velo, ni
       `--safe-bottom` en la tarjeta;
     · `caja_alta_en_vh` — una caja de más del 60 % del alto, en `vh` y escrita
       en un `style` de React: en Safari `vh` es la altura con la barra
       escondida (unos 100 px más que lo que se ve), y en un `style` no cabe el
       respaldo con `dvh`. Una lista interior de un tercio de pantalla no
       importa: la diferencia no la saca de la vista;
     · `corte_desconocido` — un corte de Tailwind que no está en
       `BREAKPOINTS_REALES`: se decide si cambia la interacción antes de usarlo;
     · `densidad_en_movimiento` — `devicePixelRatio` en el código;
     · `clase_sin_regla` — una de las clases de área segura que el código usa y
       el CSS no define.
   ─────────────────────────────────────────────────────────────────────────── */
export const CLASES_AREA_SEGURA = Object.freeze(['accion-izquierda', 'accion-derecha', 'visor-seguro', 'velo-pie-seguro', 'velo-arriba', 'caja-cabe', 'flotante-cabe']);

const sinComentarios = (src) => String(src || '')
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`])\/\/[^\n]*/g, (m, a) => a + ' '.repeat(m.length - a.length));

const lineaDe = (src, i) => String(src).slice(0, i).split('\n').length;

/** El trozo de una etiqueta desde un punto: hasta el `>` que la cierra, contando llaves (un `=>` no la cierra). */
function etiquetaDesde(src, i) {
  let llaves = 0;
  for (let j = i; j < src.length && j < i + 1600; j += 1) {
    const c = src[j];
    if (c === '{') llaves += 1;
    else if (c === '}') llaves -= 1;
    else if (c === '>' && llaves === 0 && src[j - 1] !== '=') return src.slice(i, j + 1);
  }
  return src.slice(i, i + 1600);
}

export function auditarResponsive({ archivos = {}, css = '' } = {}) {
  const problemas = [];
  const cssLimpio = sinComentarios(css);
  Object.entries(archivos).forEach(([ruta, crudo]) => {
    const src = sinComentarios(crudo);
    const re = /className=\{?[`"']([^`"']*)[`"']/g;
    let m;
    while ((m = re.exec(src))) {
      const clases = m[1].split(/\s+/);
      const etiqueta = etiquetaDesde(src, m.index);
      const fijo = clases.includes('fixed') && !clases.includes('inset-0');
      if (fijo) {
        const enEstilo = /\b(left|right)\s*:\s*-?\d/.test(etiqueta);
        const enClase = clases.some((c) => /^(left|right)-(?!0$)[\d[]/.test(c));
        if (enEstilo || enClase) problemas.push({ regla: 'lado_sin_area_segura', archivo: ruta, linea: lineaDe(src, m.index) });
      }
      if (clases.includes('fixed') && clases.includes('inset-0') && clases.includes('items-end') && !clases.includes('velo-pie-seguro')) {
        /* La tarjeta es lo siguiente que se abre después del velo. */
        const resto = src.slice(m.index + etiqueta.length, m.index + etiqueta.length + 900);
        const caja = etiquetaDesde(resto, Math.max(0, resto.indexOf('<')));
        if (!/safe-bottom|HOJA\.(caja|confirmacion|abajo)/.test(caja)) problemas.push({ regla: 'hoja_sin_pie_seguro', archivo: ruta, linea: lineaDe(src, m.index) });
      }
    }
    const vh = /maxHeight:\s*['"`](\d+)vh['"`]/g;
    while ((m = vh.exec(src))) if (Number(m[1]) > 60) problemas.push({ regla: 'caja_alta_en_vh', archivo: ruta, linea: lineaDe(src, m.index) });
    const corte = /className=\{?[`"']([^`"']*)[`"']/g;
    while ((m = corte.exec(src))) {
      m[1].split(/\s+/).forEach((c) => {
        const k = /^((?:sm|md|lg|xl|2xl|min-\[\d+px\]|max-\[\d+px\]|max-sm|max-md|landscape|portrait)):/.exec(c);
        if (k && !BREAKPOINTS_REALES.some((b) => b.id === k[1])) problemas.push({ regla: 'corte_desconocido', archivo: ruta, linea: lineaDe(src, m.index), corte: k[1] });
      });
    }
    if (/devicePixelRatio/.test(src)) problemas.push({ regla: 'densidad_en_movimiento', archivo: ruta, linea: lineaDe(src, src.indexOf('devicePixelRatio')) });
    CLASES_AREA_SEGURA.forEach((c) => {
      if (new RegExp(`[\\s\`"'{]${c}[\\s\`"'}]`).test(src) && !new RegExp(`\\.${c}\\s*\\{`).test(cssLimpio)) {
        problemas.push({ regla: 'clase_sin_regla', archivo: ruta, clase: c });
      }
    });
  });
  return { ok: problemas.length === 0, problemas };
}

/** Cada regla, con un ejemplo que tiene que cazar (EH F42: una regla que no puede fallar no sirve). */
export const EJEMPLOS_MALOS_F15 = Object.freeze([
  { regla: 'lado_sin_area_segura', src: '<button className="fixed z-flotante w-9" style={{ left: 14 }} />' },
  { regla: 'lado_sin_area_segura', src: '<div className="fixed right-4 bottom-4" />' },
  { regla: 'hoja_sin_pie_seguro', src: '<div className="fixed inset-0 z-capa flex items-end pb-3">\n  <div className="rounded-3xl p-4" style={{ background: x }}>hola</div>\n</div>' },
  { regla: 'caja_alta_en_vh', src: '<div style={{ maxHeight: \'86vh\' }} />' },
  { regla: 'corte_desconocido', src: '<div className="grid lg:grid-cols-4" />' },
  { regla: 'densidad_en_movimiento', src: 'const d = window.devicePixelRatio;' },
]);
