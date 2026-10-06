/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 10 — EL DISEÑO QUE CAMBIA (layout motion, listas,
   contenido dinámico)

   *"El layout puede cambiar. La percepción del usuario no debe romperse."*

   La F1 dejó la pieza (`deltaFlip`, `flip`, `useFlip`) y nadie la usaba: borrar
   una tarea o añadir una comida hacía que el resto de la lista saltara de sitio
   (hallazgo `listas_que_saltan` de la F0). La F10 no escribe un segundo motor:
   decide QUÉ se mueve cuando una lista cambia —lo que entra, lo que sale, lo
   que se recoloca—, con un presupuesto, y `ListaAnimada` y `Plegable`
   (src/components/layoutMotion.jsx) lo aplican.

   ⚠️ Esta librería NO toca el DOM: recibe medidas y devuelve un plan. Así se
   prueba en Node, y la pantalla no decide nada.
   ═══════════════════════════════════════════════════════════════════════════ */

import { DURACIONES_MOTION } from './motion';

/* ───────────────────────────────────────────────────────────────────────────
   1 · EL PRESUPUESTO (apartados 38 y 39)

   *"Evitar animar simultáneamente cientos de nodos."* JosStyle no virtualiza
   ninguna lista —las largas se pintan de veinte en veinte (`paginar`, EH F44;
   la biblioteca de ejercicios, FIT F34)—, así que el tope es de lo que se ANIMA,
   no de lo que se pinta: por encima, la lista cambia con un fundido corto, sin
   que cada fila viaje.
   ─────────────────────────────────────────────────────────────────────────── */
export const PRESUPUESTO_LAYOUT = Object.freeze({
  /** Filas que se miden en una lista: por encima, ni se mide (cambia sin moverse). */
  maxMedidos: 160,
  /** Filas que se animan a la vez (entran, salen o se recolocan). */
  maxAnimados: 24,
  /** Copias que salen a la vez: más que esto es un filtro, no un borrado. */
  maxSalidas: 6,
  /** Por debajo de esto no es un movimiento: es redondeo. */
  umbralPx: 0.5,
  /** Lo que cambia de ancho más que esto es otro diseño (girar el iPhone, el teclado): no se anima. */
  cambioDeAncho: 1,
});

/* ───────────────────────────────────────────────────────────────────────────
   2 · LOS TIEMPOS (de la F1, nunca escritos aquí)

   Salir es más corto que entrar (apartado 11 de la F1), y lo que se recoloca
   espera a que lo que se va haya empezado a irse: *"item → exit → remaining
   items move"*. Ninguna cifra es nueva.
   ─────────────────────────────────────────────────────────────────────────── */
export const TIEMPOS_F10 = Object.freeze({
  sale: { duracion: 'fast', curva: 'exit' },
  entra: { duracion: 'normal', curva: 'entrance' },
  recoloca: { duracion: 'normal', curva: 'standard' },
  /** Cuánto espera lo que se recoloca cuando algo sale: media salida. */
  esperaTrasSalida: Math.round(DURACIONES_MOTION.fast / 2),
  plegar: { duracion: 'normal', curva: 'standard' },
  /** Cuando una lista cambia entera (por encima del presupuesto), un fundido. */
  cambioEntero: { duracion: 'fast', curva: 'standard' },
});

/* ───────────────────────────────────────────────────────────────────────────
   3 · EL PLAN DE UNA LISTA (apartados 2, 3, 10-13)

   `antes` y `ahora` son medidas: `{ [id]: { x, y, w, h, padre, xr, yr } }`,
   con `x, y` relativas al elemento animado que lo contiene (`padre`, o la
   lista) y `xr, yr` relativas a la lista. `arriba` es dónde empieza la lista en
   la ventana y `alto`, la altura de la ventana: lo que no se ve ni antes ni
   después cambia de sitio sin animarse (nadie lo vería).

   Devuelve qué se recoloca (y cuánto), qué entra y qué sale. Un elemento que
   cambia de padre —una tarea que pasa de «Hoy» a «Hecho»— no viaja entre dos
   cajas: sale de una y entra en la otra.
   ─────────────────────────────────────────────────────────────────────────── */
const num = (v) => (Number.isFinite(v) ? v : 0);

export function seVe(m, { arriba = 0, alto = Infinity } = {}) {
  if (!m) return false;
  const top = num(m.yr) + num(arriba);
  return top < alto && top + num(m.h) > 0;
}

export function planDeLista(antes, ahora, { arriba = 0, alto = Infinity, presupuesto = PRESUPUESTO_LAYOUT } = {}) {
  const vacio = { movidos: [], entradas: [], salidas: [], saltar: false, motivo: null };
  if (!antes || !ahora) return { ...vacio, motivo: 'sin_medidas' };
  const ventana = { arriba, alto };
  const movidos = [];
  const entradas = [];
  const salidas = [];
  Object.entries(ahora).forEach(([id, m]) => {
    const a = antes[id];
    if (!a || a.padre !== m.padre) {
      if (seVe(m, ventana)) entradas.push(id);
      return;
    }
    const dx = num(a.x) - num(m.x);
    const dy = num(a.y) - num(m.y);
    if (Math.abs(dx) < presupuesto.umbralPx && Math.abs(dy) < presupuesto.umbralPx) return;
    if (!seVe(a, ventana) && !seVe(m, ventana)) return;
    movidos.push({ id, dx: Math.round(dx * 100) / 100, dy: Math.round(dy * 100) / 100 });
  });
  Object.entries(antes).forEach(([id, a]) => {
    const m = ahora[id];
    if (m && m.padre === a.padre) return;
    if (seVe(a, ventana)) salidas.push(id);
  });
  const total = movidos.length + entradas.length + salidas.length;
  if (total > presupuesto.maxAnimados) {
    return { ...vacio, saltar: true, motivo: 'presupuesto' };
  }
  return {
    movidos,
    entradas,
    /* Más copias saliendo que esto es un filtro que vacía media lista: lo que
       queda se recoloca, y lo que se va, se va sin copia. */
    salidas: salidas.length > presupuesto.maxSalidas ? [] : salidas,
    saltar: false,
    motivo: total ? null : 'quieta',
  };
}

/** ¿Ha cambiado de ancho la lista? Entonces es otro diseño, no un cambio de contenido (apartado 16). */
export const cambioDeDiseno = (anchoAntes, anchoAhora, presupuesto = PRESUPUESTO_LAYOUT) =>
  Number.isFinite(anchoAntes) && Number.isFinite(anchoAhora) && Math.abs(anchoAntes - anchoAhora) > presupuesto.cambioDeAncho;

/** La escala de una caja transformada (una hoja que entra desde 0,95): las medidas se dividen por ella. */
export const escalaDe = (anchoVisual, anchoDeDiseno) =>
  (anchoVisual > 0 && anchoDeDiseno > 0 ? anchoVisual / anchoDeDiseno : 1);

/* ───────────────────────────────────────────────────────────────────────────
   4 · LAS FUENTES (apartado 6)

   Manrope e Inter llegan de Google Fonts con `display=swap`: si llegan DESPUÉS
   de pintar, el texto cambia de ancho y los botones se mueven. Pero una fuente
   no se pide hasta que algo la usa, y la pantalla de carga no tiene texto, así
   que llegaban justo al pintar Hoy. La estrategia: **pedirlas mientras se
   cargan los datos** y no enseñar la aplicación hasta que estén —o hasta un
   tope, para que una red lenta no retenga nada—. La segunda vez ya están en la
   caché y no se espera nada.
   ─────────────────────────────────────────────────────────────────────────── */
export const FUENTES_DE_LA_APP = Object.freeze([
  '600 1em Manrope', '700 1em Manrope', '800 1em Manrope',
  '400 1em Inter', '500 1em Inter', '600 1em Inter',
]);
export const TOPE_FUENTES_MS = 800;

/** Los pesos que pide el `@import` de `index.css`, para comprobar que la lista de arriba no se queda vieja. */
export function fuentesDelImport(css) {
  const m = String(css || '').match(/@import url\('https:\/\/fonts\.googleapis\.com\/css2\?([^']+)'\)/);
  if (!m) return null;
  const familias = [...m[1].matchAll(/family=([^:&]+):wght@([\d;]+)/g)];
  const out = [];
  familias.forEach(([, fam, pesos]) => pesos.split(';').forEach((p) => out.push(`${p} 1em ${fam.replace(/\+/g, ' ')}`)));
  const display = (m[1].match(/display=(\w+)/) || [])[1] || null;
  return { fuentes: out, display };
}

/* ───────────────────────────────────────────────────────────────────────────
   5 · EL INVENTARIO (apartado 1): lo que cambia de tamaño o de sitio
   ─────────────────────────────────────────────────────────────────────────── */
export const INVENTARIO_F10 = Object.freeze([
  { que: 'Listas que se editan (tareas, la agenda de un día, comidas)', antes: 'Borrar, añadir o completar hacía saltar el resto (`listas_que_saltan`).', queda: '🔓 `ListaAnimada`: lo que entra aparece en su sitio, lo que sale se va con una copia inerte y lo demás se recoloca.' },
  { que: 'Listas que se reordenan con flechas (temas, pasos de una rutina, apartados de Imagen personal, ejercicios de una plantilla)', antes: 'La fila saltaba a su sitio nuevo (`reordenar`, sin movimiento).', queda: '🔓 La fila viaja de un sitio a otro (A B C D → A C D B, apartado 12).' },
  { que: 'Resultados de una búsqueda', antes: 'Se reemplazaban enteros en cada letra.', queda: '🔓 Los que siguen se quedan y se recolocan; los nuevos entran (apartado 14: actualización, no recarga).' },
  { que: 'Desplegables (detalles, ajustes, formularios que se abren)', antes: 'Aparecían con un fundido (F3) y al cerrar desaparecían de golpe: lo de debajo subía de un salto (C-54).', queda: '🔓 `Plegable`: la altura crece y decrece (`grid-template-rows`), y lo de debajo se mueve con ella.' },
  { que: 'Acordeones de Inicio', antes: 'Ya crecían con `grid-template-rows` (SC F1).', queda: 'Así: son el modelo de `Plegable`.' },
  { que: 'Botones que cambian de texto (Guardar → Guardando…)', antes: 'Cambiaban de ancho.', queda: 'Resuelto en la F9: las capas se apilan y el botón mide lo que la más ancha.' },
  { que: 'Cifras que cambian', antes: 'Cifras proporcionales: el número bailaba.', queda: 'Tabulares (FIT F42) y `CifraQueCambia` (F4): ni cuentan cada actualización ni mueven lo de al lado.' },
  { que: 'Imágenes', antes: 'Casi todas con su hueco reservado (cuadrado, alto fijo o `width`/`height`). 🐛 El tutorial de un ejercicio no: medía 0 hasta cargar.', queda: '🔓 Todas con su hueco; `imagenesSinHueco` caza la siguiente.' },
  { que: 'Fuentes', antes: '`display=swap` y pedidas al pintar: el primer Hoy cambiaba de ancho al llegar Manrope.', queda: '🔓 Se piden mientras cargan los datos (`useFuentesListas`), con un tope de `TOPE_FUENTES_MS`.' },
  { que: 'Esqueleto de carga → contenido', antes: 'El esqueleto tiene la forma de Hoy (E3 F14).', queda: 'Así. Cómo se funde con el contenido es la F16 (estados del sistema).' },
  { que: 'Cabeceras fijas', antes: 'Las de los hubs y las de Fitness son `sticky` sin cambiar de tamaño (SC F1, SF2).', queda: 'Así: no hay una cabecera grande que se compacte, así que no hay nada que coordinar (apartado 32).' },
  { que: 'Acciones flotantes (lupa, sugerencias)', antes: 'Fijas en su sitio (SF F1) y en su capa (F6).', queda: 'Así: no cambian de posición según la pantalla, así que no pueden teletransportarse (apartado 34).' },
  { que: 'Avisos', antes: 'Flotantes (`AvisoAccion`, F9) o en línea (`MensajeDeCampo`, F9).', queda: 'Cada uno con su patrón (apartado 30): el flotante no empuja nada; el de línea es corto y aparece donde se le espera.' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   6 · DÓNDE ESTÁ CABLEADO (para que nadie lo descablee sin que se note)

   Una línea por pantalla, con el trozo que la cablea: la prueba abre el
   archivo y lo busca (FIT F36).
   ─────────────────────────────────────────────────────────────────────────── */
export const CONEXIONES_F10 = Object.freeze([
  { donde: 'Tareas (Productividad)', archivo: 'src/views/ProductivityView.jsx', trozo: '<ListaAnimada', fila: "data-flip-id={`t-${t.id}`}" },
  { donde: 'La agenda de un día (Calendario)', archivo: 'src/views/CalendarView.jsx', trozo: '<ListaAnimada', fila: "data-flip-id={e.id ? `a-${e.id}` : undefined}" },
  { donde: 'Las comidas del día (Nutrición)', archivo: 'src/views/NutritionView.jsx', trozo: '<ListaAnimada', fila: "data-flip-id={`c-${c.id}`}" },
  { donde: 'Los temas de una asignatura (Estudios)', archivo: 'src/views/EstudiosView.jsx', trozo: '<ListaAnimada', fila: "data-flip-id={`tema-${t.id}`}" },
  { donde: 'Los pasos de una rutina (Productividad)', archivo: 'src/views/ProductivityView.jsx', trozo: '<ListaAnimada', fila: "data-flip-id={`paso-${p.id}`}" },
  { donde: 'Los ejercicios de una plantilla (Fitness)', archivo: 'src/views/ConstructorView.jsx', trozo: '<ListaAnimada', fila: "data-flip-id={`l-${l.id}`}" },
  { donde: 'Los apartados de Imagen personal (Gestionar)', archivo: 'src/views/EstiloHombreView.jsx', trozo: '<ListaAnimada', fila: "data-flip-id={`m-${m.id}`}" },
  { donde: 'Los resultados del buscador', archivo: 'src/components/ui.jsx', trozo: '<ListaAnimada', fila: "data-flip-id={`r-${r.id}`}" },
  { donde: 'Las fuentes antes de pintar', archivo: 'src/App.jsx', trozo: 'useFuentesListas()' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   7 · LO QUE NO PUEDE VOLVER (apartado 45)

   Lee el código y caza, con su línea:
     · un desplegable que aparece con `{abierto && <div className="despliegue-entra…">}`:
       al cerrarse, lo de debajo sube de un salto. Es `<Plegable abierto>`;
     · una imagen sin su hueco: ni alto, ni proporción, ni `width`/`height`.
   ─────────────────────────────────────────────────────────────────────────── */
const sinComentarios = (src) => String(src)
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`])\/\/.*$/gm, (m, a) => a + ' '.repeat(m.length - a.length));
const lineaDe = (src, i) => src.slice(0, i).split('\n').length;

export const PATRONES_F10 = Object.freeze([
  { id: 'desplegable_que_salta', re: /&&\s*\(?\s*<div\s+className="despliegue-entra/g, que: 'Un desplegable que se monta y se desmonta de golpe: al cerrarse, lo de debajo sube de un salto. Es `<Plegable abierto>`' },
  { id: 'imagen_sin_hueco', que: 'Una imagen sin su hueco reservado (alto, proporción o `width`/`height`): al cargar empuja lo de debajo' },
]);

/** Una `<img …>` reserva su sitio si trae alto (`h-…`, `max-h-…`), proporción (`aspect-…`), `width` y `height`, o un `height` en su estilo. */
const RESERVA = /\b(?:h-(?:\d|full|\[)|max-h-|aspect-|size-)|\bheight=\{?|style=\{\{[^}]*\bheight\s*:/;
/** Las imágenes que reciben su tamaño de quien las llama (la clase llega en una prop). */
export const IMAGENES_CON_TAMANO_DE_FUERA = Object.freeze([
  { archivo: 'src/components/estadosFitness.jsx', porque: '`MissingImage` es un respaldo genérico: cada llamada le pasa su `className` con el tamaño (`w-16 h-16`, `aspect-square`, el lado de una miniatura), y la prueba mira las llamadas.' },
]);

export function imagenesSinHueco(archivo, src) {
  if (IMAGENES_CON_TAMANO_DE_FUERA.some((x) => x.archivo === archivo)) return [];
  const limpio = sinComentarios(src);
  const out = [];
  const re = /<(img|MissingImage)\b/g;
  let m;
  while ((m = re.exec(limpio))) {
    /* La etiqueta entera, contando llaves: un `onError={() => …}` lleva un `>` dentro. */
    let i = m.index + m[0].length;
    let llaves = 0;
    for (; i < limpio.length; i += 1) {
      const c = limpio[i];
      if (c === '{') llaves += 1;
      else if (c === '}') llaves -= 1;
      else if (c === '>' && llaves === 0) break;
    }
    let etiqueta = limpio.slice(m.index, i + 1);
    /* Un tamaño que llega en una constante del mismo archivo (`const lado = grande ? 'w-16 h-16' : …`) cuenta. */
    [...etiqueta.matchAll(/\$\{(\w+)\}/g)].forEach(([, nombre]) => {
      const def = new RegExp(`\\bconst ${nombre}\\s*=\\s*([^;\\n]+)`).exec(limpio);
      if (def) etiqueta += ` ${def[1]}`;
    });
    if (!RESERVA.test(etiqueta)) out.push(lineaDe(limpio, m.index));
  }
  return out;
}

export function auditarLayout({ vistas = {} } = {}) {
  const hallazgos = [];
  Object.entries(vistas).forEach(([archivo, src]) => {
    if (!/\.jsx$/.test(archivo)) return;
    const limpio = sinComentarios(src);
    const re = new RegExp(PATRONES_F10[0].re.source, PATRONES_F10[0].re.flags);
    let m;
    while ((m = re.exec(limpio))) hallazgos.push({ tipo: 'desplegable_que_salta', archivo, linea: lineaDe(limpio, m.index), que: PATRONES_F10[0].que });
    imagenesSinHueco(archivo, src).forEach((linea) => hallazgos.push({ tipo: 'imagen_sin_hueco', archivo, linea, que: PATRONES_F10[1].que }));
  });
  const cuentas = Object.fromEntries(PATRONES_F10.map((p) => [p.id, hallazgos.filter((h) => h.tipo === p.id).length]));
  return { hallazgos, cuentas };
}

/* ───────────────────────────────────────────────────────────────────────────
   8 · LA AUDITORÍA DEL ENUNCIADO, LO QUE NO SE HACE Y CUÁNDO USAR CADA COSA
   ─────────────────────────────────────────────────────────────────────────── */
export const AUDITORIA_F10 = Object.freeze([
  { apartados: [2, 3], que: 'El motor de layout', queda: '`ListaAnimada` (FLIP con `getSnapshotBeforeUpdate`: mide justo ANTES de cada cambio y justo después, así que nunca compara con una medida vieja) y `Plegable` (altura con `grid-template-rows`). Sin librería: la Web Animations API y el CSS de siempre.' },
  { apartados: [10, 11, 12, 13], que: 'Añadir, quitar, reordenar y filtrar', queda: 'Lo que entra aparece en su sitio (fundido y un leve ascenso); lo que sale deja una copia inerte que se desvanece, y lo demás se recoloca después de que empiece a irse. Un filtro que vacía media lista: lo que queda se recoloca y lo que se va, se va sin copia.' },
  { apartados: [14], que: 'Buscar', queda: 'Los resultados que siguen se quedan (su `key` es su id) y se recolocan; una búsqueda nueva entera, por encima del presupuesto, es un fundido.' },
  { apartados: [16, 35], que: 'Girar el iPhone, el teclado, cambiar el tamaño', queda: 'Nada se anima: una lista que cambia de ancho es otro diseño (`cambioDeDiseno`), y el recorrido comprueba que cambiar el tamaño de la ventana no arranca ni una animación.' },
  { apartados: [17, 18, 28], que: 'Acordeones, altura dinámica y lo que se pliega', queda: '`Plegable`, sin alturas escritas a mano: crece de 0 a su contenido y al cerrarse se encoge y luego se desmonta. Mientras se mueve recorta; quieto, no (un halo de foco no se corta).' },
  { apartados: [5], que: 'Imágenes', queda: 'Todas con su hueco; el tutorial de un ejercicio reserva 16:9.' },
  { apartados: [6], que: 'Fuentes', queda: 'Pedidas durante la carga, con tope.' },
  { apartados: [7, 8, 9], que: 'Textos y cifras que cambian', queda: 'F9 (capas que se apilan), FIT F42 (cifras tabulares) y F4 (`CifraQueCambia`).' },
  { apartados: [23, 24, 46], que: 'Inicio y el aislamiento', queda: 'Cada lista anima solo lo suyo: una tarea que se borra en la agenda no mueve nada fuera de su tarjeta. Ninguna pantalla entera es una `ListaAnimada`.' },
  { apartados: [37], que: 'Volver', queda: 'F2: el scroll se recuerda por pantalla y las entradas no se repiten.' },
  { apartados: [40], que: 'Reducido', queda: 'Nada se desplaza: lo que entra y lo que sale se funden en su sitio y lo demás se coloca sin viajar. Un desplegable cambia de altura sin animarse.' },
  { apartados: [41], que: 'Accesibilidad', queda: 'Se anima con `transform`: el orden del documento no cambia. La copia que sale es `inert` y `aria-hidden`, sin `id`: ni el lector de pantalla ni el foco la encuentran.' },
]);

export const NO_EN_F10 = Object.freeze([
  { que: 'Un indicador que viaja entre las pestañas de dentro de una pantalla (C-58, que la F7 dejó para aquí)', porque: '`ToggleTab` son pastillas SEPARADAS, cada una con su fondo y su borde, y se parten en dos líneas cuando no caben (GE F1): un indicador tendría que cruzar huecos y saltar en diagonal de una línea a otra, que es la transformación extraña que prohíbe el apartado 15. La pestaña funde su color al ritmo del contenido (F3). Donde sí hay una pista —la barra de abajo— el indicador ya viaja (F2). C-61.' },
  { que: 'Una cabecera que pasa de grande a compacta (apartado 32)', porque: 'JosStyle no tiene ninguna: las cabeceras fijas no cambian de tamaño (SC F1, SF2). Inventar una para animarla sería la regla 8.' },
  { que: 'Datos en tiempo real, actualización optimista y su vuelta atrás (apartados 25-27)', porque: 'No hay datos que lleguen solos —el último en escribir gana (EH F41)— y cada cambio se pinta al momento desde el estado de React: no hay una espera al servidor que deshacer. El fallo al guardar ya tiene su aviso (FIT F37).' },
  { que: 'Esqueleto → contenido, carga → vacío y carga → error (apartados 20-22)', porque: 'Son los estados del sistema: la F16. El esqueleto ya tiene la forma de Hoy (E3 F14).' },
  { que: 'Badges que cuentan notificaciones (apartado 31)', porque: 'No hay bandeja de notificaciones (F9, regla 8).' },
  { que: 'Animar cada cambio de tamaño de la ventana (apartado 16)', porque: '*"Prioridad: estabilidad > animación."*' },
  { que: 'Listas virtualizadas (apartado 38)', porque: 'No hay ninguna: las largas se pintan de veinte en veinte. El presupuesto (`PRESUPUESTO_LAYOUT`) es lo que impide animar cientos de nodos.' },
]);

export const CUANDO_F10 = Object.freeze([
  { patron: '`<ListaAnimada>` con `data-flip-id` en cada fila', cuando: 'Una lista que él edita: añadir, borrar, completar, reordenar o filtrar. El id va en la fila (o en un envoltorio), nunca el índice.' },
  { patron: '`data-flip-id` también en un bloque', cuando: 'Bloques que se recolocan cuando cambia uno de dentro (las secciones de Tareas): la fila se mide dentro de su bloque, así que no se mueve dos veces.' },
  { patron: '`<Plegable abierto>`', cuando: 'Algo que se abre y se cierra en su sitio y empuja lo de debajo: un detalle, un formulario, un grupo de ajustes.' },
  { patron: 'Nada', cuando: 'Lo que cambia sin que él lo haya pedido y no se lee como un cambio (un reloj, un número que se actualiza): eso es la F4.' },
]);
