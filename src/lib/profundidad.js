/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F6 — PROFUNDIDAD, CAPAS, Z-INDEX Y CONTEXTO VISUAL

   *"Jos Style debe tener una sensación clara de espacio: contenido → superficie
   → elemento elevado → interacción → modal → sistema. Todo debe parecer
   pertenecer al mismo universo físico."*

   Aquí vive el **sistema de profundidad** (apartado 40): qué capa va encima de
   cuál (`CAPAS_Z`), cuánto se eleva cada cosa (`NIVELES_PROFUNDIDAD`), las
   sombras, los desenfoques y el velo, y cómo entra y sale una capa
   (`tipoDeCapa`, `animacionDeCapa`). Lo que toca el DOM —el vigilante que da
   entrada y salida a TODAS las ventanas sin que ninguna escriba la suya— está
   en `src/components/capasMotion.js`.

   🚨 Ni un z-index, una sombra de elevación, un desenfoque ni un velo escritos a
   mano en una vista: `auditarProfundidad` lee el código y la suite se pone roja.
   Los valores viven aquí **y** en `index.css` (`--z-*`, `--sombra-*`,
   y los desenfoques son los de la F1), y `auditarTokensProfundidad` compara las dos cosas.
   =========================================================================== */
import { CAPAS } from '../tokens';
import { contextoMotion, duracionMs, CURVAS_MOTION, fotogramas, distancia, DESENFOQUES_MOTION } from './motion';

/* ───────────────────────────────────────────────────────────────────────────
   1 · LA JERARQUÍA DE CAPAS (apartado 2)

   Una sola escala, con nombre. Los valores son los que ya había —la F6 no
   mueve nada de sitio—, pero ahora tienen nombre y nadie escribe un número.
   ⚠️ Entre dos capas del mismo nivel manda el orden de apertura: un portal se
   añade al final del `body`, así que la que se abre después queda encima —que
   es justo lo que pide el apartado 21: una capa secundaria nunca detrás de la
   que la abrió—. `alerta` existe para lo que tiene que quedar encima aunque se
   haya montado antes.
   ─────────────────────────────────────────────────────────────────────────── */
export const CAPAS_Z = Object.freeze([
  { id: 'fondo', valor: -1, que: 'El fondo de pantalla, su luz y su velo (App.jsx): detrás de todo.' },
  { id: 'base', valor: 0, que: 'El contenido de la página.' },
  { id: 'elevado', valor: 5, que: 'Una tarjeta que se levanta sobre sus vecinas mientras se abre (`hub-card-expanding`).' },
  { id: 'pegajoso', valor: 20, que: 'Lo que se queda fijo arriba al desplazar: la cabecera de un área y la del entrenamiento en vivo.' },
  { id: 'flotante', valor: 30, que: 'Los accesos que flotan sobre todo el contenido: la lupa y las sugerencias (siempre por encima de la cabecera fija, SC F1).' },
  { id: 'aviso', valor: 40, que: 'Un aviso pequeño (añadido, deshacer): encima del contenido y debajo de cualquier ventana.' },
  { id: 'capa', valor: 50, que: 'Hojas, ventanas, pantallas superpuestas y visores.' },
  { id: 'alerta', valor: 70, que: 'Lo que se abre desde una capa y tiene que quedar encima aunque se haya montado antes (los avisos de Imagen personal).' },
]);

export const valorZ = (id) => {
  const c = CAPAS_Z.find((x) => x.id === id);
  if (!c) throw new Error(`valorZ: capa desconocida «${id}»`);
  return c.valor;
};

/* ───────────────────────────────────────────────────────────────────────────
   2 · LOS NIVELES DE PROFUNDIDAD (apartados 3 y 4)

   No todo lo elevado se eleva igual, y la elevación no es solo una sombra: en
   una interfaz oscura una sombra negra aporta poco (apartado 35), así que cada
   nivel dice con qué se separa de lo de debajo —superficie, borde, sombra,
   desenfoque, velo— y en qué capa vive.
   ─────────────────────────────────────────────────────────────────────────── */
export const NIVELES_PROFUNDIDAD = Object.freeze([
  { nivel: 0, nombre: 'Contenido', capa: 'base', sombra: null, desenfoque: null, velo: false, separa: 'Nada: es la página.', ejemplos: 'Texto, listas, el fondo de una pantalla.' },
  { nivel: 1, nombre: 'Ligeramente destacado', capa: 'base', sombra: 'reposo', desenfoque: null, velo: false, separa: 'Superficie y borde; la sombra de reposo, casi imperceptible.', ejemplos: 'Una tarjeta, un pomo de un selector de color.' },
  { nivel: 2, nombre: 'Flotante', capa: 'flotante', sombra: 'elevada', desenfoque: 'medium', velo: false, separa: 'Cristal: superficie translúcida con un desenfoque sutil.', ejemplos: 'La lupa, las sugerencias, una tarjeta que se levanta al abrirse.' },
  { nivel: 3, nombre: 'Hoja o menú', capa: 'capa', sombra: 'flotante', desenfoque: null, velo: true, separa: 'El velo oscurece lo de detrás; la hoja queda pegada a su borde.', ejemplos: 'El ＋ de Hoy, las hojas de Fitness, el panel de sugerencias.' },
  { nivel: 4, nombre: 'Ventana', capa: 'capa', sombra: null, desenfoque: null, velo: true, separa: 'Velo y una superficie que aparece desde el centro.', ejemplos: 'Confirmar un borrado, el buscador, la papelera.' },
  { nivel: 5, nombre: 'Sistema', capa: 'alerta', sombra: null, desenfoque: null, velo: true, separa: 'Velo encima de cualquier otra capa.', ejemplos: 'Los avisos que no pueden quedar debajo de nada.' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   3 · SOMBRAS Y DESENFOQUES (apartados 5 y 6)

   Las sombras de ELEVACIÓN que había, con nombre. Un anillo de selección
   (`0 0 0 2px …`) no es elevación —dice «elegido»— y no está aquí, ni el
   brillo de un rango que sube (FIT F37), ni el recorte del visor del escáner.
   ─────────────────────────────────────────────────────────────────────────── */
export const SOMBRAS = Object.freeze({
  reposo: '0 1px 2px rgba(0,0,0,0.06)',
  pomo: '0 1px 4px rgba(0,0,0,0.5)',
  elevada: '0 10px 26px rgba(0,0,0,0.32)',
  flotante: '0 12px 28px rgba(0,0,0,0.45)',
  maxima: '0 18px 40px rgba(0,0,0,0.4)',
});

/** Cuándo se desenfoca (apartado 6): nunca porque «se ve Apple», siempre porque separa. ⚠️ Los
 *  niveles y sus píxeles son los de la F1 (`DESENFOQUES_MOTION`, `--motion-blur-*`): la F6 dice CUÁNDO,
 *  no inventa una segunda escala. */
export const DESENFOQUES = Object.freeze({
  none: { px: DESENFOQUES_MOTION.none, cuando: 'Lo que no flota sobre nada.' },
  subtle: { px: DESENFOQUES_MOTION.subtle, cuando: 'El velo de una hoja en Ultra (F1, `desenfoqueDelVelo`): lo de detrás se intuye.' },
  medium: { px: DESENFOQUES_MOTION.medium, cuando: 'Un control o una tarjeta de cristal sobre el contenido: la lupa, las sugerencias, los segmentos de Ajustes, las tarjetas con superficie translúcida.' },
  strong: { px: DESENFOQUES_MOTION.strong, cuando: 'Lo que tapa una franja ancha de contenido que pasa por debajo: la barra de abajo y las tarjetas de una portada sobre su foto.' },
});

/** `backdrop-filter` para un nivel de desenfoque: siempre desde su variable de `index.css`. */
export const desenfoque = (id) => {
  if (!DESENFOQUES[id]) throw new Error(`desenfoque: nivel desconocido «${id}»`);
  return id === 'none' ? 'none' : `blur(var(--motion-blur-${id}))`;
};
export const sombra = (id) => {
  if (!SOMBRAS[id]) throw new Error(`sombra: sombra desconocida «${id}»`);
  return `var(--sombra-${id})`;
};

/** El velo de una capa (apartado 7): uno solo, el de `tokens.js` (regla 2). */
export const VELO = CAPAS.veloHoja;

/* ───────────────────────────────────────────────────────────────────────────
   4 · QUÉ CAPA ES (apartados 8-11 y 36)

   Se decide por cómo se pinta, no por quién la escribió —así una ventana nueva
   no tiene que declarar nada—, y con el estilo YA calculado, así que cambia con
   el ancho: una hoja del Armario es una hoja en el iPhone y una ventana en el
   escritorio (`items-end sm:items-center`), que es lo que pide el apartado 36.
     · `hoja`     — pegada al borde de abajo: entra desde él y sale hacia él.
     · `modal`    — centrada o arriba: aparece desde el centro, un poco escalada.
     · `pantalla` — opaca y con su propio scroll: una pantalla por encima.
     · `visor`    — casi negra (una foto, el escáner): solo se funde.
   ─────────────────────────────────────────────────────────────────────────── */
export function alfaDe(color) {
  const s = String(color || '').trim();
  if (!s || s === 'transparent') return 0;
  const m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (!m) return 1;
  const p = m[1].split(/[\s,/]+/).filter(Boolean);
  return p.length >= 4 ? Number(p[3]) : 1;
}

export function tipoDeCapa({ alignItems = '', overflowY = '', fondo = '' } = {}) {
  const a = alfaDe(fondo);
  if ((overflowY === 'auto' || overflowY === 'scroll') && a >= 0.99) return 'pantalla';
  if (a >= 0.9) return 'visor';
  if (alignItems === 'flex-end' || alignItems === 'end') return 'hoja';
  return 'modal';
}

/** El mismo color con transparencia 0: de donde sale el velo. */
export function sinAlfa(color) {
  const m = /^rgba?\(([^)]+)\)$/.exec(String(color || '').trim());
  if (!m) return 'rgba(0, 0, 0, 0)';
  const p = m[1].split(/[\s,/]+/).filter(Boolean);
  return `rgba(${p[0]}, ${p[1]}, ${p[2]}, 0)`;
}

/* ───────────────────────────────────────────────────────────────────────────
   5 · CÓMO ENTRA Y SALE UNA CAPA (apartados 8-11, 22, 24 y 34)

   *"Un modal debe tener: background → backdrop → modal. Cada capa debe tener su
   propia animación coordinada."* El velo y la caja son DOS animaciones, con la
   misma duración: el velo se funde y la caja hace lo suyo.
     · Una hoja sube desde su borde —su propia altura, sin fundido ni escala— y
       baja hacia él (apartado 11: *"no utilizar una animación genérica de
       modal"*).
     · Una ventana aparece desde el centro con los presets del motor
       (`modalEnter`/`modalExit`): un poco de escala, nunca excesiva (apartado 9),
       y al salir conserva la dirección en vez de solo apagarse (apartado 10).
     · Una pantalla por encima entra como entrar en un módulo y se va hacia el
       lado del que llegó.
     · Un visor solo se funde.
   En Reducido se queda la profundidad estática —el velo y el fundido— y se van
   la escala y el recorrido (apartado 34). Sin movimiento, nada.
   ─────────────────────────────────────────────────────────────────────────── */
export function animacionDeCapa(tipo, fase, { ctx = contextoMotion(), alto = 0, fondo = '' } = {}) {
  if (ctx.apagado) return null;
  const entrar = fase === 'entrar';
  const duracion = duracionMs(entrar ? (tipo === 'hoja' ? 'medium' : 'normal') : 'fast', ctx);
  if (duracion === 0) return null;
  const curva = entrar ? CURVAS_MOTION.entrance : CURVAS_MOTION.exit;
  const opciones = { duration: duracion, easing: curva, fill: entrar ? 'backwards' : 'forwards' };
  const quieto = ctx.reducido || !ctx.espacial;
  const velo = (tipo === 'hoja' || tipo === 'modal') && alfaDe(fondo) > 0
    ? { keyframes: entrar ? [{ backgroundColor: sinAlfa(fondo) }, { backgroundColor: fondo }] : [{ backgroundColor: fondo }, { backgroundColor: sinAlfa(fondo) }], opciones: { ...opciones, easing: CURVAS_MOTION.standard } }
    : null;
  let caja = null;
  let raiz = null;
  const fundido = entrar ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
  if (tipo === 'hoja') {
    const fuera = `translateY(${Math.max(0, Math.round(alto))}px)`;
    caja = { keyframes: quieto ? fundido : (entrar ? [{ transform: fuera }, { transform: 'none' }] : [{ transform: 'none' }, { transform: fuera }]), opciones };
  } else if (tipo === 'modal') {
    const f = fotogramas(entrar ? 'modalEnter' : 'modalExit', ctx);
    caja = { keyframes: quieto ? fundido : f.keyframes, opciones };
  } else if (tipo === 'pantalla') {
    /* Entra como entrar en un módulo (`pageEnter`); sale hacia la DERECHA, por donde llegó —el
       `pageExit` del motor va a la izquierda porque es la pantalla de antes cuando se entra—. */
    const k = entrar ? fotogramas('pageEnter', ctx).keyframes
      : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${distancia('small', ctx)}px)` }];
    raiz = { keyframes: quieto ? fundido : k, opciones };
  } else if (tipo === 'visor') {
    raiz = { keyframes: fundido, opciones };
  }
  return { tipo, velo, caja, raiz, duracionMs: duracion };
}

/* ───────────────────────────────────────────────────────────────────────────
   6 · CUÁNDO NO HAY SALIDA (apartados 35, 37 y 38)

   Para salir, la capa se copia y la copia se va (la de verdad ya la ha quitado
   React). No se copia:
     · lo que lleva vídeo o lienzo —el escáner—: la copia saldría en negro;
     · lo enorme —una pantalla con cientos de filas—: copiarla cuesta más que
       lo que aporta (apartado 38);
     · una hoja que ya se fue arrastrándola (F5): ya está fuera; solo se apaga
       su velo.
   ─────────────────────────────────────────────────────────────────────────── */
export const MAX_NODOS_COPIA = 1500;

export function salidaPosible({ nodos = 0, conVideo = false, arrastrada = false } = {}) {
  if (conVideo) return 'ninguna';
  if (nodos > MAX_NODOS_COPIA) return 'ninguna';
  if (arrastrada) return 'solo_velo';
  return 'completa';
}

/** Las clases con las que una capa ya trae su entrada en CSS (Fitness y Calendario): no se le pone otra. */
export const ENTRADAS_CSS_DE_CAPA = Object.freeze(['fondo-entra', 'hoja-entra', 'calendar-sheet']);

/* ───────────────────────────────────────────────────────────────────────────
   7 · LA AUDITORÍA (apartados 1, 2, 5, 6 y 40)

   Lee el código —sin comentarios— y devuelve lo que se sale del sistema, con
   la línea. Recibe el contenido: una librería del navegador no lee del disco.
   ─────────────────────────────────────────────────────────────────────────── */
const sinComentariosConLineas = (s) => String(s || '')
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, a) => a + ' '.repeat(m.length - a.length));
const lineaDe = (txt, i) => txt.slice(0, i).split('\n').length;

export const REGLAS_PROFUNDIDAD = Object.freeze([
  { id: 'z_numerico', que: 'Un z-index escrito con un número', re: /\bz-(\d+|\[-?\d+\])(?![\w-])|zIndex:\s*-?\d/g, ejemploMalo: '<div className="fixed inset-0 z-50">' },
  { id: 'velo_a_mano', que: 'Un velo negro escrito a mano en vez de `CAPAS.veloHoja`', re: /background:\s*['"`]rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0?\.\d+\s*\)['"`]/g, ejemploMalo: "style={{ background: 'rgba(0,0,0,0.6)' }}" },
  { id: 'desenfoque_a_mano', que: 'Un desenfoque con píxeles escritos a mano', re: /[Bb]ackdropFilter:\s*['"`]blur\(\d/g, ejemploMalo: "backdropFilter: 'blur(12px)'" },
  { id: 'sombra_a_mano', que: 'Una sombra de elevación escrita a mano', re: /boxShadow:\s*['"`]0\s+\d+px\s+\d+px\s+rgba/g, ejemploMalo: "boxShadow: '0 12px 28px rgba(0,0,0,0.45)'" },
]);

/** Los dos archivos que NOMBRAN lo que se busca para declararlo —sus `ejemploMalo`—, y por eso no se
 *  barren (la lección de `NO_EN_FIT25`, otra vez). La suite comprueba aparte que cada ejemplo se caza. */
export const DECLARAN_LO_QUE_BUSCAN = Object.freeze({
  'src/lib/profundidad.js': 'Las reglas de esta auditoría y sus ejemplos malos.',
  'src/lib/acabadoFitness.js': 'Las reglas del acabado de Fitness (FIT F42) y sus ejemplos malos: un color escrito a mano.',
});

export function auditarProfundidad({ vistas = {}, css = '' } = {}) {
  const hallazgos = [];
  for (const [archivo, fuente] of Object.entries(vistas)) {
    if (DECLARAN_LO_QUE_BUSCAN[archivo]) continue;
    const limpio = sinComentariosConLineas(fuente);
    for (const r of REGLAS_PROFUNDIDAD) {
      for (const m of limpio.matchAll(r.re)) hallazgos.push({ regla: r.id, archivo, linea: lineaDe(limpio, m.index), trozo: m[0] });
    }
  }
  const cssLimpio = sinComentariosConLineas(css);
  for (const m of cssLimpio.matchAll(/z-index:\s*-?\d+/g)) hallazgos.push({ regla: 'z_numerico', archivo: 'src/index.css', linea: lineaDe(cssLimpio, m.index), trozo: m[0] });
  for (const m of cssLimpio.matchAll(/box-shadow:\s*0\s+\d+px\s+\d+px\s+rgba/g)) hallazgos.push({ regla: 'sombra_a_mano', archivo: 'src/index.css', linea: lineaDe(cssLimpio, m.index), trozo: m[0] });
  return hallazgos;
}

/** Los tokens de aquí contra los de `index.css`, valor a valor (como `auditarTokensCss` de la F1). */
export function auditarTokensProfundidad(css = '') {
  const raiz = /:root\s*\{([^}]*)\}/g;
  const vars = {};
  for (const b of String(css).matchAll(raiz)) {
    for (const d of b[1].matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) vars[d[1]] = d[2].trim();
  }
  const distintos = [];
  for (const c of CAPAS_Z) if (vars[`z-${c.id}`] !== String(c.valor)) distintos.push({ token: `--z-${c.id}`, js: String(c.valor), css: vars[`z-${c.id}`] ?? null });
  for (const [id, v] of Object.entries(SOMBRAS)) if (vars[`sombra-${id}`] !== v) distintos.push({ token: `--sombra-${id}`, js: v, css: vars[`sombra-${id}`] ?? null });
  return distintos;
}

/* ───────────────────────────────────────────────────────────────────────────
   8 · EL INVENTARIO DE CAPAS (apartado 1) Y LO QUE NO SE HACE AQUÍ
   ─────────────────────────────────────────────────────────────────────────── */
export const INVENTARIO_CAPAS = Object.freeze([
  { que: 'Página', capa: 'base', donde: 'Cada pantalla, dentro del contenedor de la navegación (F2).' },
  { que: 'Fondo de pantalla, luz y velo', capa: 'fondo', donde: 'App.jsx: tres capas fijas detrás de todo.' },
  { que: 'Cabecera fija de un área y del entrenamiento en vivo', capa: 'pegajoso', donde: '`.hub-sticky` (index.css) y la cabecera de EntrenamientoVivoView.' },
  { que: 'Barra de abajo', capa: 'base', donde: 'App.jsx (`nav-segura`): sin z-index; va después del contenido en el documento, así que queda encima de él, y cualquier capa la tapa.' },
  { que: 'Lupa y sugerencias', capa: 'flotante', donde: 'App.jsx y ui.jsx (`accion-superior`).' },
  { que: 'Panel de sugerencias', capa: 'flotante', donde: 'ui.jsx: un menú que nace de su botón (arriba a la izquierda o a la derecha).' },
  { que: 'Avisos pequeños (añadido, deshacer)', capa: 'aviso', donde: 'quickAdd.jsx (`AvisoAccion`) y los de Fitness.' },
  { que: 'Hojas', capa: 'capa', donde: 'El ＋ (quickAdd), Fitness (`HOJA`), el Armario, el editor de color y de temas, Imagen personal.' },
  { que: 'Ventanas (confirmar, buscador, papelera, Calendario)', capa: 'capa', donde: 'ui.jsx, CalendarView, ClasificacionView.' },
  { que: 'Pantallas por encima', capa: 'capa', donde: 'Biblioteca (cinco), Productividad (una).' },
  { que: 'Visores', capa: 'capa', donde: 'Las fotos de progreso, el comparador y el escáner de códigos.' },
  { que: 'Avisos de Imagen personal', capa: 'alerta', donde: 'EstiloHombreView: encima de su propia hoja.' },
  { que: 'Menús desplegables', capa: 'base', donde: 'Dentro de su tarjeta (Tu Plan, Plantillas): sin portal, debajo de quien los abre (F3, `despliegue-entra`).' },
  { que: 'Tooltips', capa: 'base', donde: 'Solo los de Recharts, dentro de su gráfica (F4: `fast`, sin moverse en Reducido).' },
]);

export const NO_EN_F6 = Object.freeze([
  { que: 'Card → detalle con un elemento que viaja (apartados 16 y 17)', porque: 'Es la F7 (continuidad espacial), que es la que pide el elemento compartido. La F6 deja la profundidad de cada capa; la F7, el viaje entre dos.' },
  { que: 'Las capas de carga y de error (apartados 30 y 31)', porque: 'Son los estados de la F9 y la F16. Hoy ya se muestran donde pertenecen: el límite de error es por pantalla (F2, `AreaSegura`) y en Fitness por área (FIT F36).' },
  { que: 'Un centro de notificaciones (apartado 28)', porque: 'No existe: los avisos son los del sistema (E3 F11). Construirlo sería la regla 8.' },
  { que: 'Menús contextuales y popovers anclados con posición calculada (apartados 12, 14 y 15)', porque: 'JosStyle no tiene ninguno flotante: los «⋯» se despliegan dentro de su tarjeta (F3) y el panel de sugerencias nace de su botón con `transform-origin`. El día que haya uno, va aquí.' },
  { que: 'Cambiar la cabecera al compactarse (apartado 25)', porque: 'La de los hubs es transparente a propósito y las tarjetas se funden al pasar por debajo (SF2, `useFundidoBajoCabecera`): no hay un fondo que recalcular.' },
  { que: 'Oscurecer o desenfocar el contenido de debajo además del velo (apartado 22)', porque: 'Con moderación: el velo ya separa. En Ultra, además, desenfoca lo de detrás (F1, `--motion-velo-desenfoque`).' },
]);
