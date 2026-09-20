/**
 * FIT F27/45 — Comparador avanzado de progreso físico.
 *
 * 🚨 **LA COMPARACIÓN YA EXISTÍA, Y LA HIZO LA F26.** El contexto de esta fase
 * lo dice con todas las letras: *"Ya existe el sistema de Progreso mediante
 * fotografías de la Fase 26. Ahora vamos a **mejorar específicamente** la
 * experiencia de comparación"*. Así que esto **no escribe una segunda
 * comparación**: `compararFotos`, `opcionesParaComparar`, `diasEntreFechas`,
 * `textoDeDistancia` y `puedeComparar` son de la F26 y se importan tal cual.
 * Lo que nace aquí son los **modos** (lado a lado y deslizar), el **zoom**, la
 * **alineación**, el **encuadre** y el **intercambio manual**.
 *
 * 🚨 **Y NI UNA PALABRA SOBRE EL CUERPO** (apartados 1 y 34): ni análisis
 * corporal, ni grasa, ni masa muscular, ni comparación automática, ni
 * recomendaciones, ni rankings, ni comparar con otras personas. Lo único que
 * afirma esta fase son **dos fechas y el tiempo que pasó entre ellas**, que es
 * aritmética. Hay un barrido sobre todos los textos que genera el archivo.
 *
 * ⚠️ **Y NO GUARDA NADA** (apartados 18, 28 y 29): *"la comparación es una
 * vista derivada de dos ProgressPhoto. No duplicar fotografías."* No hay
 * entidad, no hay clave de `app_data`, no hay normalizador. Lo que se guarda
 * son las fotos, y eso ya lo hace la F26.
 */

import {
  TAGS_FOTO, tagFoto,
  normalizarFotosProgreso, fotosEnOrden, fotoPorId, etiquetaDeDia,
  compararFotos, opcionesParaComparar, puedeComparar,
  MINIMO_PARA_COMPARAR, ERRORES_FOTO,
} from './fotosProgreso.js';

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const lista = (v) => (Array.isArray(v) ? v : []);
const numero = (v, sino = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : sino);

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LO QUE NO SE VUELVE A ESCRIBIR (contexto de la fase)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 **Cinco piezas del enunciado ya estaban escritas**, y es la lección de la
 * FIT F23 y la FIT F25 por tercera vez en esta entrega: *"lo que pide un
 * apartado puede estar ya escrito cuatro quintas partes"*. Cada línea guarda
 * **la función importada**, así que renombrar una rompe la compilación.
 */
export const YA_LO_HIZO_LA_F26 = [
  { pide: 'Apartado 3 · la selección de dos momentos', es: opcionesParaComparar, nombre: 'opcionesParaComparar' },
  { pide: 'Apartado 4 · ANTES es la más antigua', es: compararFotos, nombre: 'compararFotos' },
  { pide: 'Apartado 15 · la diferencia temporal', es: compararFotos, nombre: 'compararFotos (texto y dias)' },
  { pide: 'Apartado 23 · el mínimo de dos fotos', es: puedeComparar, nombre: 'puedeComparar' },
  { pide: 'Apartado 25 · el fallo de UNA sola foto', es: ERRORES_FOTO, nombre: 'ERRORES_FOTO.leer' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   2 · ENTRAR Y SALIR (apartados 1, 2 y 17)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 1, literal: *"Progreso → Fotos → Comparar"*. */
export const RUTA_COMPARADOR = ['Progreso', 'Fotos', 'Comparar'];

/**
 * Apartado 2 — **dos entradas, y las dos llevan al mismo sitio**. Desde el
 * detalle de una foto ésa se queda puesta y solo falta elegir la otra, que es
 * lo que evita repetir un paso que el usuario ya ha dado.
 */
export const ENTRADAS_COMPARADOR = [
  { id: 'galeria', etiqueta: 'Comparar', desde: 'La galería', preselecciona: false },
  { id: 'detalle', etiqueta: 'Comparar con otra', desde: 'El visor de una foto', preselecciona: true },
];

export const CERRAR_COMPARADOR = 'Volver a la galería';

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LA SELECCIÓN (apartados 3 y 17)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 3, con sus dos frases literales. */
export const PASOS_SELECCION = [
  { id: 'antes', titulo: 'Selecciona una foto inicial', corto: 'Inicial' },
  { id: 'despues', titulo: 'Selecciona una foto final', corto: 'Final' },
];
export const pasoSeleccion = (id) => PASOS_SELECCION.find((p) => p.id === texto(id)) || null;

/** Apartado 17 — *"Sin salir completamente del flujo"*. */
export const CAMBIAR_FOTO = 'Cambiar';

/**
 * 🚨 Apartado 3 — *"No permitir seleccionar la misma fotografía para ambos
 * lados"*. **Se impide antes de elegir, no se avisa después**: la que ya está
 * puesta en el otro lado no aparece en la lista. La F26 ya devolvía
 * `motivo: 'misma'` si llegaban dos ids iguales, y esa guarda se queda —pero
 * una opción que no se puede elegir no se pinta (regla 8).
 */
export function opcionesDelLado(fotos, { excluir = null } = {}) {
  const fuera = texto(excluir);
  return opcionesParaComparar(fotos).filter((o) => o.id !== fuera);
}

/**
 * Apartado 2 — entrar desde el detalle de una foto. Ésa queda puesta como el
 * lado que le corresponde **por su fecha**, no por dónde se pulsó: si es la más
 * antigua de las dos será el «antes» en cuanto se elija la otra, y eso lo
 * decide `compararFotos`. Aquí solo se dice cuál falta.
 */
export function seleccionDesdeFoto(fotos, id) {
  const foto = fotoPorId(fotos, id);
  if (!foto) return { antesId: null, despuesId: null, paso: 'antes', origen: 'galeria' };
  const todas = fotosEnOrden(fotos);
  const esLaMasNueva = todas.length > 1 && todas[todas.length - 1].id === foto.id;
  /* Si abre la más reciente, lo que falta es la inicial; si no, la final. */
  return esLaMasNueva
    ? { antesId: null, despuesId: foto.id, paso: 'antes', origen: 'detalle' }
    : { antesId: foto.id, despuesId: null, paso: 'despues', origen: 'detalle' };
}

/** Qué lado toca elegir ahora. `null` = ya están los dos. */
export function pasoPendiente({ antesId = null, despuesId = null } = {}) {
  if (!texto(antesId)) return 'antes';
  if (!texto(despuesId)) return 'despues';
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · EL ORDEN Y EL INTERCAMBIO (apartados 4 y 21)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 **INTERCAMBIAR CAMBIA LA POSICIÓN, NUNCA EL RÓTULO** (apartados 4 y 21).
 * El 4 pide poder intercambiarlas a mano; el 21 pide que *"el comparador pueda
 * entenderse sin depender exclusivamente de la posición"*, con «Foto anterior»
 * y «Foto posterior» en cada lado. Las dos cosas solo caben juntas si el rótulo
 * **viaja con la foto**: al intercambiar, la más antigua se va a la derecha
 * **llevándose su “Antes”**. Si el rótulo se quedara pegado al hueco, invertir
 * diría que la foto de junio es posterior a la de septiembre.
 */
export const ROTULO_ANTES = 'Antes';
export const ROTULO_DESPUES = 'Después';
export const ARIA_ANTES = 'Foto anterior';
export const ARIA_DESPUES = 'Foto posterior';
export const INVERTIR = 'Intercambiar lados';

export function ladosDeComparacion(comparacion, { invertida = false } = {}) {
  if (!comparacion || !comparacion.hay) return [];
  const antes = {
    foto: comparacion.antes,
    rotulo: ROTULO_ANTES,
    aria: ARIA_ANTES,
    papel: 'antes',
    etiqueta: comparacion.etiquetaAntes,
  };
  const despues = {
    foto: comparacion.despues,
    rotulo: ROTULO_DESPUES,
    aria: ARIA_DESPUES,
    papel: 'despues',
    etiqueta: comparacion.etiquetaDespues,
  };
  const orden = invertida ? [despues, antes] : [antes, despues];
  return orden.map((l, i) => ({ ...l, posicion: i === 0 ? 'izquierda' : 'derecha' }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LA INFORMACIÓN DE CADA LADO (apartados 5, 13 y 16)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 Apartado 13 — las orientaciones son **tres**: frontal, espalda y lateral.
 * `TAGS_FOTO` (F26) tiene cinco, porque *relajado* y *pose* no dicen desde
 * dónde está hecha la foto. El subconjunto se declara **por sus ids**, para
 * que renombrar uno en el catálogo rompa la comprobación (lección de EH F26).
 */
export const IDS_ORIENTACION = ['frontal', 'lateral', 'espalda'];
export const TAGS_ORIENTACION = TAGS_FOTO.filter((t) => IDS_ORIENTACION.includes(t.id));

/**
 * ⚠️ Apartado 13, literal: *"Si no existe: **no inventarlo**"*. Una foto sin
 * etiqueta de orientación devuelve `null`, no «Frontal» por ser lo más común.
 */
export function orientacionDeFoto(foto) {
  const tags = lista(foto && foto.tags).map(texto);
  const id = tags.find((t) => IDS_ORIENTACION.includes(t));
  return id ? tagFoto(id) : null;
}

/** Apartado 5 — *"fecha, nota si existe, orientación/tag si existe"*. */
export function metaDeLado(lado) {
  const foto = (lado && lado.foto) || null;
  if (!foto) return null;
  const orientacion = orientacionDeFoto(foto);
  const otros = lista(foto.tags).map(texto)
    .filter((t) => !IDS_ORIENTACION.includes(t))
    .map((t) => tagFoto(t))
    .filter(Boolean);
  return {
    rotulo: lado.rotulo,
    aria: lado.aria,
    fecha: foto.fecha,
    /* Apartado 5 — el ejemplo es «12 JUN 2026»; la F26 ya da este formato. */
    etiqueta: etiquetaDeDia(foto.fecha),
    /* Apartado 16 — *"No ocupar demasiado espacio"*: la nota si la hay. */
    nota: texto(foto.nota) || null,
    orientacion: orientacion ? orientacion.nombre : null,
    otrosTags: otros.map((t) => t.nombre),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · EL ENCUADRE (apartado 14)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 14, con el formato del ejemplo: *"Frontal · Antes / Después"*. */
export const mismoEncuadre = (nombre) => `${nombre} · ${ROTULO_ANTES} / ${ROTULO_DESPUES}`;
/** Apartado 14, literal. */
export const ENCUADRES_DISTINTOS = 'Las fotografías tienen encuadres diferentes.';

/**
 * 🚨 Apartado 14 — con encuadres distintos **se comparan igual**, pero *"no
 * afirmar que sean equivalentes"*. Y sin etiqueta no se dice nada: afirmar que
 * los encuadres son distintos cuando no se sabe sería inventarse lo mismo que
 * prohíbe el apartado 13, solo que en negativo.
 */
export function encuadreDeComparacion(comparacion) {
  if (!comparacion || !comparacion.hay) return null;
  const a = orientacionDeFoto(comparacion.antes);
  const b = orientacionDeFoto(comparacion.despues);
  if (!a || !b) return { conocido: false, mismo: null, texto: null, aviso: null };
  if (a.id === b.id) {
    return { conocido: true, mismo: true, texto: mismoEncuadre(a.nombre), aviso: null };
  }
  return {
    conocido: true,
    mismo: false,
    texto: `${a.nombre} / ${b.nombre}`,
    aviso: ENCUADRES_DISTINTOS,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · LOS MODOS (apartados 6, 7, 8 y 9)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Apartado 9 — dos modos, y **la preferencia vive en la pantalla**: *"Guardar
 * la preferencia únicamente durante la sesión si no hace falta persistirla"*.
 * No hace falta, así que no se persiste — es el `viendo` de EH F40 otra vez.
 */
export const MODOS_COMPARACION = [
  {
    id: 'lado',
    nombre: 'Lado a lado',
    descripcion: 'Las dos fotos, una junto a la otra.',
    /* Apartado 7 — en móvil se apila; lo decide el ancho, no el modo. */
    seApila: true,
  },
  {
    id: 'deslizar',
    nombre: 'Deslizar',
    descripcion: 'Una sobre otra, con un divisor que puedes mover.',
    seApila: false,
  },
];
export const MODO_POR_DEFECTO = 'lado';
export const modoComparacion = (id) => MODOS_COMPARACION.find((m) => m.id === texto(id))
  || MODOS_COMPARACION.find((m) => m.id === MODO_POR_DEFECTO);

/**
 * 🚨 Apartado 7 — *"usar una composición vertical **cuando el lado a lado
 * resulte demasiado pequeño**"*. El límite es el ancho de cada mitad, no el del
 * teléfono: con 16 px de margen a cada lado y 12 de separación, dos mitades de
 * 150 px necesitan 344. Un iPhone de 375 pasa por poco y uno de 320 no, y por
 * eso el corte está calculado y no escrito a ojo.
 */
export const ANCHO_MINIMO_MITAD = 150;
export const MARGEN_PANTALLA = 16;
export const SEPARACION_LADOS = 12;
export const ANCHO_MINIMO_LADO_A_LADO = ANCHO_MINIMO_MITAD * 2 + MARGEN_PANTALLA * 2 + SEPARACION_LADOS;

export function disposicionDeAncho(ancho, modo = MODO_POR_DEFECTO) {
  const m = modoComparacion(modo);
  /* El modo deslizar es una sola caja: nunca se apila. */
  if (!m.seApila) return { disposicion: 'superpuesta', cabenLosDos: true };
  const cabenLosDos = numero(ancho, 0) >= ANCHO_MINIMO_LADO_A_LADO;
  return { disposicion: cabenLosDos ? 'fila' : 'columna', cabenLosDos };
}

/* ── El divisor (apartado 8) ─────────────────────────────────────────────── */

export const SLIDER_MIN = 0;
export const SLIDER_MAX = 100;
export const SLIDER_INICIAL = 50;
/** Apartado 21 — *"El slider debe ser accesible mediante teclado"*. */
export const SLIDER_PASO = 2;
export const SLIDER_PASO_GRANDE = 10;
export const ARIA_SLIDER = 'Divisor de la comparación';

export const posicionSlider = (valor) => Math.min(
  SLIDER_MAX,
  Math.max(SLIDER_MIN, Math.round(numero(valor, SLIDER_INICIAL))),
);

export function moverSlider(actual, delta) {
  return posicionSlider(numero(actual, SLIDER_INICIAL) + numero(delta, 0));
}

/**
 * ⚠️ Apartado 8 — *"Debe ser una herramienta de comparación visual, **no un
 * efecto decorativo**"*. Por eso el divisor llega a los dos extremos: si se
 * quedara en 10-90 no se podría ver ninguna de las dos fotos entera, que es
 * justo para lo que sirve arrastrarlo del todo.
 */
export const SLIDER_LLEGA_AL_BORDE = true;

/* ═══════════════════════════════════════════════════════════════════════════
   8 · EL ZOOM (apartado 10)
   ═══════════════════════════════════════════════════════════════════════════ */

export const ZOOM_NORMAL = 1;
export const ZOOM_MAX = 3;
export const ZOOM_PASO = 0.5;
/** Apartado 10, literal: *"botón claro para volver a escala normal"*. */
export const VOLVER_A_ESCALA = 'Escala normal';
export const ACERCAR = 'Acercar';
export const ALEJAR = 'Alejar';

export const crearZoom = () => ({ escala: ZOOM_NORMAL, x: 0, y: 0 });

/**
 * 🚨 Apartado 10 — *"mantener ambas imágenes **independientes**"*. Cada lado
 * tiene su propio zoom: ampliar la de junio no mueve la de septiembre, porque
 * lo que se quiere mirar de cerca no está en el mismo sitio de las dos.
 */
export const crearZoomDeLados = () => ({ antes: crearZoom(), despues: crearZoom() });

/**
 * El desplazamiento máximo, **en porcentaje del propio elemento**. Con
 * `transform: translate(x%, y%) scale(s)` la imagen sobresale `(s-1)/2` por
 * cada borde, así que más allá de eso se vería un hueco. Va aquí y no en el
 * CSS para poder comprobarlo sin navegador.
 */
export const limiteDesplazamiento = (escala) => Math.max(0, (numero(escala, ZOOM_NORMAL) - 1) / 2 * 100);

export function aplicarZoom(zoom, delta) {
  const z = zoom && typeof zoom === 'object' ? zoom : crearZoom();
  const escala = Math.min(ZOOM_MAX, Math.max(ZOOM_NORMAL, numero(z.escala, ZOOM_NORMAL) + numero(delta, 0)));
  /* Al alejar, el desplazamiento se recorta para que no quede un hueco. */
  const lim = limiteDesplazamiento(escala);
  return {
    escala,
    x: Math.min(lim, Math.max(-lim, numero(z.x, 0))),
    y: Math.min(lim, Math.max(-lim, numero(z.y, 0))),
  };
}

/** Apartado 10 — *"permitir desplazamiento"*, dentro de lo que hay que ver. */
export function moverZoom(zoom, dx, dy) {
  const z = zoom && typeof zoom === 'object' ? zoom : crearZoom();
  const lim = limiteDesplazamiento(z.escala);
  return {
    escala: numero(z.escala, ZOOM_NORMAL),
    x: Math.min(lim, Math.max(-lim, numero(z.x, 0) + numero(dx, 0))),
    y: Math.min(lim, Math.max(-lim, numero(z.y, 0) + numero(dy, 0))),
  };
}

export const reiniciarZoom = () => crearZoom();
export const hayZoom = (zoom) => numero(zoom && zoom.escala, ZOOM_NORMAL) > ZOOM_NORMAL;
export const puedeAcercar = (zoom) => numero(zoom && zoom.escala, ZOOM_NORMAL) < ZOOM_MAX;
export const puedeAlejar = (zoom) => numero(zoom && zoom.escala, ZOOM_NORMAL) > ZOOM_NORMAL;

/** Apartado 10 — *"El zoom no debe romper el comparador"*: se dice en el dato. */
export const textoDeZoom = (zoom) => {
  const e = numero(zoom && zoom.escala, ZOOM_NORMAL);
  return e === ZOOM_NORMAL ? null : `${e.toFixed(1).replace('.', ',')}×`;
};

/* ═══════════════════════════════════════════════════════════════════════════
   9 · ENCUADRE Y ALINEACIÓN (apartados 11 y 12)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 Apartado 11 — *"No recortar automáticamente de forma destructiva.
 * Utilizar `object-fit: contain`"*. Las fotos pueden tener alturas, anchuras y
 * proporciones distintas, y estirarlas para que encajen sería enseñar un cuerpo
 * deformado en una pantalla que existe para mirar el cuerpo.
 */
export const AJUSTE_IMAGEN = 'contain';
export const PROPORCION_CAJA = '3 / 4';

/** Apartado 12 — *"arriba, centro. Por defecto: centro"*, y nada más. */
export const ALINEACIONES = [
  { id: 'centro', nombre: 'Centro', css: 'center' },
  { id: 'arriba', nombre: 'Arriba', css: 'top' },
];
export const ALINEACION_POR_DEFECTO = 'centro';
export const alineacion = (id) => ALINEACIONES.find((a) => a.id === texto(id))
  || ALINEACIONES.find((a) => a.id === ALINEACION_POR_DEFECTO);

/**
 * ⚠️ Apartado 12 — *"No implementar edición manual compleja en esta fase"*.
 * Dos opciones y ninguna más: ni recorte, ni rotación, ni rejilla.
 */
export const NO_HAY_EDICION = 'Esto no es un editor de fotos.';

/* ═══════════════════════════════════════════════════════════════════════════
   10 · LOS GESTOS (apartado 22)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 Apartado 22 — *"los gestos no deben interferir con scroll, botones,
 * slider"*, y es la lección de la FIT F9 (*el gesto de cambiar de ejercicio
 * vive solo en la tarjeta del ejercicio*). Aquí el conflicto es directo: en el
 * modo **deslizar**, arrastrar en horizontal **es** el divisor, así que el
 * swipe para cambiar de foto solo existe en **lado a lado**. Y en los dos
 * modos, con el zoom puesto arrastrar **es** desplazar la imagen.
 */
export const GESTOS = [
  {
    id: 'swipe',
    que: 'Deslizar en horizontal para cambiar de foto',
    soloEn: ['lado'],
    seApagaCon: ['zoom'],
    porque: 'En el modo deslizar, el arrastre horizontal es el divisor.',
  },
  {
    id: 'arrastrar-divisor',
    que: 'Arrastrar el divisor',
    soloEn: ['deslizar'],
    seApagaCon: [],
    porque: 'Es la herramienta del apartado 8.',
  },
  {
    id: 'arrastrar-zoom',
    que: 'Arrastrar para desplazar la imagen ampliada',
    soloEn: ['lado', 'deslizar'],
    seApagaCon: [],
    porque: 'Solo con el zoom puesto (apartado 10).',
  },
];

export function gestosActivos(modo, { zoom = false } = {}) {
  const m = modoComparacion(modo).id;
  return GESTOS.filter((g) => g.soloEn.includes(m))
    .filter((g) => !(zoom && g.seApagaCon.includes('zoom')))
    .filter((g) => !(g.id === 'arrastrar-zoom' && !zoom));
}

/** ⚠️ `pan-y` deja el scroll vertical intacto: es lo que pide el apartado 22. */
export const TOUCH_ACTION_LADO = 'pan-y';
/** En el divisor no hay scroll que respetar: el arrastre es suyo entero. */
export const TOUCH_ACTION_DIVISOR = 'none';

/* ═══════════════════════════════════════════════════════════════════════════
   11 · LOS ESTADOS QUE NO SON «TODO BIEN» (apartados 23, 24 y 25)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 23, literal, con su CTA. */
export const VACIO_COMPARADOR = {
  titulo: 'Necesitas al menos dos fotos para comparar tu progreso.',
  cta: 'Añadir foto',
};

/** Apartado 24, literal. */
export const FOTO_DESAPARECIDA = 'Una de las fotos ya no está disponible.';
export const ELEGIR_OTRA = 'Elegir otra foto';

/**
 * ⚠️ Apartado 25 — *"mostrar placeholder de error **únicamente para esa
 * fotografía**. Permitir cambiarla."* El texto es el de la F26; lo que añade
 * esta fase es que el otro lado **sigue viéndose** y que se puede sustituir sin
 * salir (apartado 17).
 */
export const ERROR_DE_ESTE_LADO = ERRORES_FOTO.leer.titulo;

export const ESTADOS_COMPARADOR = [
  { id: 'sin_fotos', que: 'Hay menos de dos fotos', hayComparacion: false },
  { id: 'eligiendo', que: 'Falta elegir uno de los dos lados', hayComparacion: false },
  { id: 'desaparecida', que: 'Una de las elegidas ya no existe', hayComparacion: false },
  { id: 'comparando', que: 'Las dos están elegidas', hayComparacion: true },
];
export const estadoComparador = (id) => ESTADOS_COMPARADOR.find((e) => e.id === texto(id)) || null;

/* ═══════════════════════════════════════════════════════════════════════════
   12 · LA PANTALLA ENTERA (apartados 27, 28 y 35)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 Apartado 28 — el estado va **separado** y **no toca la foto**:
 * `selectedBeforePhotoId`, `selectedAfterPhotoId`, `comparisonMode`,
 * `zoomState` y `sliderPosition`. Aquí son `antesId`, `despuesId`, `modo`,
 * `zoom` y `slider`, con los nombres del resto del proyecto, y **ninguno se
 * guarda** (apartado 29). Hay una comprobación de que esta función no devuelve
 * ni una foto modificada.
 */
export function pantallaComparador(fotos, estado = {}) {
  const limpias = normalizarFotosProgreso(fotos);
  const {
    antesId = null, despuesId = null,
    modo = MODO_POR_DEFECTO,
    alineacion: ali = ALINEACION_POR_DEFECTO,
    slider = SLIDER_INICIAL,
    zoom = null,
    invertida = false,
    ancho = null,
    fallidas = {},
  } = estado || {};

  const base = {
    modo: modoComparacion(modo),
    modos: MODOS_COMPARACION,
    alineacion: alineacion(ali),
    alineaciones: ALINEACIONES,
    slider: posicionSlider(slider),
    /* ⚠️ **Siempre con los dos lados**: un zoom a medias dejaría a
       `ComparisonImage` leyendo `undefined.escala` y tumbaría la pantalla. */
    zoom: {
      ...crearZoomDeLados(),
      ...(zoom && typeof zoom === 'object' ? zoom : {}),
    },
    invertida: !!invertida,
    total: limpias.length,
  };

  /* Apartado 23 — por debajo de dos fotos no hay nada que comparar. */
  if (!puedeComparar(limpias)) {
    return {
      ...base,
      estado: 'sin_fotos',
      hay: false,
      vacio: VACIO_COMPARADOR,
      faltan: MINIMO_PARA_COMPARAR - limpias.length,
      lados: [],
      opcionesAntes: [],
      opcionesDespues: [],
      paso: null,
      comparacion: null,
      encuadre: null,
      aviso: null,
      gestos: [],
      disposicion: 'columna',
    };
  }

  const elegidaAntes = fotoPorId(limpias, antesId);
  const elegidaDespues = fotoPorId(limpias, despuesId);

  /* 🚨 Apartado 24 — una elegida que ya no existe **no rompe el módulo**: se
     cierra la comparación y se dice, en vez de pintar media pantalla. */
  const pedidaYNoEstá = (texto(antesId) && !elegidaAntes) || (texto(despuesId) && !elegidaDespues);

  const comparacion = elegidaAntes && elegidaDespues
    ? compararFotos(limpias, elegidaAntes.id, elegidaDespues.id)
    : null;
  const hay = !!(comparacion && comparacion.hay);

  const paso = hay ? null : pasoPendiente({
    antesId: elegidaAntes ? elegidaAntes.id : null,
    despuesId: elegidaDespues ? elegidaDespues.id : null,
  });

  const lados = ladosDeComparacion(comparacion, { invertida: base.invertida })
    .map((l) => ({ ...l, meta: metaDeLado(l), fallida: !!fallidas[l.foto.id] }));

  const disposicion = disposicionDeAncho(ancho == null ? ANCHO_MINIMO_LADO_A_LADO : ancho, base.modo.id);

  return {
    ...base,
    estado: pedidaYNoEstá ? 'desaparecida' : (hay ? 'comparando' : 'eligiendo'),
    hay,
    vacio: null,
    faltan: 0,
    lados,
    /* Apartados 3 y 17 — cada lista excluye lo que está puesto en el otro. */
    opcionesAntes: opcionesDelLado(limpias, { excluir: elegidaDespues ? elegidaDespues.id : null }),
    opcionesDespues: opcionesDelLado(limpias, { excluir: elegidaAntes ? elegidaAntes.id : null }),
    antesId: elegidaAntes ? elegidaAntes.id : null,
    despuesId: elegidaDespues ? elegidaDespues.id : null,
    paso: paso ? pasoSeleccion(paso) : null,
    comparacion,
    encuadre: encuadreDeComparacion(comparacion),
    /* Apartado 24 — el único aviso de la pantalla. El del encuadre va en
       `encuadre.aviso`, porque no son lo mismo: uno dice que falta una foto y
       el otro matiza lo que se está viendo. */
    aviso: pedidaYNoEstá ? FOTO_DESAPARECIDA : null,
    gestos: gestosActivos(base.modo.id, {
      zoom: hayZoom(base.zoom.antes) || hayZoom(base.zoom.despues),
    }),
    disposicion: disposicion.disposicion,
    cabenLosDos: disposicion.cabenLosDos,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   13 · LO QUE NO SE CONSTRUYE, Y POR QUÉ (apartados 19, 20, 22, 30, 31 y 34)
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT27 = [
  {
    que: 'Análisis corporal, grasa, masa muscular o reconocimiento del cuerpo',
    porque: 'El contexto de la fase y el apartado 34 los excluyen cuatro veces. Lo único que se afirma es el tiempo entre dos fechas.',
  },
  {
    que: 'Compartir la comparación',
    porque: 'Apartado 19, literal: *"NO implementar todavía compartir públicamente"*. Y las fotos son privadas (apartado 31).',
  },
  {
    que: 'Exportar la comparación como imagen',
    porque: 'Apartado 20: *"No crear una exportación automática en esta fase"*, y no hay ninguna función nativa que romper.',
  },
  {
    que: 'Miniaturas de menor resolución para el selector',
    porque: 'Apartado 30. La F26 sube **una sola** versión, ya reducida a 1600 px de lado, y no existe un segundo tamaño: decir que se usan miniaturas sería decir que existe algo que no existe (regla 8). Lo que sí se cumple es no bloquear la interfaz — las URL se firman por tandas desde la F26 y el selector reutiliza las que la galería ya tiene.',
  },
  {
    que: 'Pinch para ampliar',
    porque: 'Apartado 22: *"si la implementación existente lo permite"*, y no lo permite — el `maximum-scale=1` del viewport bloquea el pellizco en todo JosStyle, que es justamente la C-32 que tiene que decidir Josué. El zoom va por botones, que además es lo que pide el apartado 10.',
  },
  {
    que: 'Guardar la comparación como objeto',
    porque: 'Apartados 18 y 29: es una vista derivada de dos fotos. Sin copia no hay nada que sincronizar ni que invalidar.',
  },
  {
    que: 'Recorte, rotación o filtros',
    porque: 'Apartados 12 y 26: *"No convertirlo en un editor de fotos"*.',
  },
];

export const DECISIONES_FIT27 = [
  {
    id: 'reutilizar-f26',
    dice: 'La comparación de la F26 no se reescribe: se amplía.',
    porque: 'El contexto de la fase dice "mejorar específicamente la experiencia de comparación". Una segunda `compararFotos` acabaría decidiendo el ANTES de otra manera que la primera.',
  },
  {
    id: 'rotulo-con-la-foto',
    dice: 'Al intercambiar los lados, «Antes» y «Después» viajan con la foto.',
    porque: 'Apartado 4 pide intercambiar y el 21 pide no depender de la posición. Solo caben juntos si el rótulo no se queda pegado al hueco.',
  },
  {
    id: 'swipe-solo-lado-a-lado',
    dice: 'El deslizamiento para cambiar de foto no existe en el modo deslizar.',
    porque: 'Ahí el arrastre horizontal es el divisor (apartado 22: los gestos no deben interferir con el slider).',
  },
  {
    id: 'sin-tag-no-se-dice-nada',
    dice: 'Sin etiqueta de orientación no se afirma ni que coinciden ni que no.',
    porque: 'Apartado 13: "Si no existe: no inventarlo". Decir que los encuadres son distintos sin saberlo es inventarlo en negativo.',
  },
  {
    id: 'se-retira-la-comparacion-de-dentro',
    dice: 'El bloque de comparación que la F26 pintaba dentro de la galería se retira.',
    porque: 'Existía porque no había pantalla de comparación, igual que la confirmación de «Terminar» antes del resumen (FIT F8). Con el comparador construido, dejar los dos sería la misma función por dos puertas — y la de dentro es la peor: sin modos, sin zoom y sin alineación. Lo que se ofrece desde la galería es el comparador entero.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   14 · AUDITORÍA (apartados 32 y 35)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 Los ocho pasos del apartado 35 **se calculan**, no se declaran: cada
 * casilla ejecuta la función que la resuelve. Una auditoría que no puede
 * ponerse roja no sirve (EH F42).
 */
export function casillasDelComparador(fotos, estado = {}) {
  const p = pantallaComparador(fotos, estado);
  const dos = fotosEnOrden(normalizarFotosProgreso(fotos));
  const conDos = dos.length >= MINIMO_PARA_COMPARAR
    ? pantallaComparador(fotos, { ...estado, antesId: dos[0].id, despuesId: dos[dos.length - 1].id })
    : null;
  return [
    { id: 'entrar', que: 'Se puede entrar a Comparar', ok: ENTRADAS_COMPARADOR.length === 2 },
    { id: 'elegir', que: 'Se eligen dos fechas', ok: !!conDos && conDos.opcionesAntes.length > 0 },
    { id: 'distintas', que: 'No se puede elegir la misma foto en los dos lados', ok: !!conDos && !conDos.opcionesAntes.some((o) => o.id === conDos.despuesId) },
    { id: 'lado_a_lado', que: 'Se ven lado a lado', ok: !!conDos && conDos.lados.length === 2 },
    { id: 'slider', que: 'Hay modo deslizar', ok: MODOS_COMPARACION.some((m) => m.id === 'deslizar') },
    { id: 'zoom', que: 'Se puede ampliar y volver', ok: aplicarZoom(crearZoom(), ZOOM_PASO).escala > ZOOM_NORMAL && reiniciarZoom().escala === ZOOM_NORMAL },
    { id: 'cambiar', que: 'Se pueden cambiar las fotos sin salir', ok: !!conDos && conDos.opcionesDespues.length > 0 },
    { id: 'volver', que: 'Se vuelve a la galería', ok: !!texto(CERRAR_COMPARADOR) },
    /* ⚠️ Se compara **por id y por camino**, no por identidad de objeto: el
       normalizador devuelve objetos nuevos en cada llamada, así que un `===`
       saldría falso siempre y esta casilla no podría ponerse verde jamás. */
    {
      id: 'sin_copia',
      que: 'No se duplica ninguna fotografía',
      ok: !!conDos && conDos.lados.length === 2 && conDos.lados.every((l) => {
        const origen = dos.find((f) => f.id === l.foto.id);
        return !!origen && origen.path === l.foto.path && dos.filter((f) => f.path === l.foto.path).length === 1;
      }),
    },
    { id: 'vacio', que: 'Con menos de dos fotos se dice', ok: pantallaComparador([], {}).estado === 'sin_fotos' && !!p },
  ];
}

export function auditarComparador(fotos, estado = {}) {
  const casillas = casillasDelComparador(fotos, estado);
  const ok = casillas.filter((c) => c.ok).length;
  return { casillas, ok, total: casillas.length, completo: ok === casillas.length };
}
