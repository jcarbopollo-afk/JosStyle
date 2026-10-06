/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F7 — CONTINUIDAD ESPACIAL Y ELEMENTOS COMPARTIDOS

   *"La aplicación no debe sentirse como un conjunto de pantallas
   independientes. Debe sentirse como un único espacio que cambia de estado."*

   Aquí vive el sistema de continuidad: el MAPA de cómo se pasa de un sitio a
   otro (`MAPA_TRANSICIONES`, con sus cuatro niveles), el REGISTRO de orígenes
   —dónde estaba lo que se tocó, para que lo que aparece salga de ahí— y los
   PLANES de las dos formas de continuidad que tiene JosStyle:
     · el CONTENEDOR que crece desde la tarjeta que lo abrió (una tarjeta de
       la portada de un área → su módulo), y
     · el ELEMENTO COMPARTIDO que viaja de un sitio a otro (`Compartido`: un
       título, un icono, una imagen).
   Lo que toca el DOM está en `src/components/continuidad.jsx`.

   ⚠️ JosStyle pinta UNA pantalla cada vez (F2), así que la de antes ya no
   existe cuando la nueva aparece. Por eso la continuidad no puede ser «dos
   elementos vivos que se cruzan»: el origen se APUNTA (su rectángulo) al
   tocarlo o al desaparecer, y lo nuevo sale de ese rectángulo.
   =========================================================================== */
import { contextoMotion, duracionMs, CURVAS_MOTION, OPACIDADES_MOTION, escala } from './motion';

/* ───────────────────────────────────────────────────────────────────────────
   1 · LOS CUATRO NIVELES Y EL MAPA DE TRANSICIONES (apartados 2, 12 y 13)
   ─────────────────────────────────────────────────────────────────────────── */
export const NIVELES_TRANSICION = Object.freeze([
  { nivel: 1, id: 'micro', que: 'Cambios pequeños dentro de algo: color, opacidad, un interruptor, una cifra.', sistema: 'F3 y F4 (`Switch`, `CifraQueCambia`, `ChevronDespliegue`).' },
  { nivel: 2, id: 'contextual', que: 'Cambiar de sección o de pestaña: lo de dentro cambia, el sitio no.', sistema: 'F2 (`nav-seccion`, `CambioDeContenido`, el indicador de la barra).' },
  { nivel: 3, id: 'estructural', que: 'Entrar más hondo: una sección → un detalle, con continuidad cuando la hay.', sistema: 'F2 (`entrar`/`volver`) y F7 (el contenedor desde su tarjeta, `Compartido`).' },
  { nivel: 4, id: 'capa', que: 'Una ventana, una hoja o un menú por encima.', sistema: 'F6 (`useCapasMotion`, `menu-entra`).' },
]);

/** Cada relación entre dos sitios, con su movimiento y su protagonista (apartados 2 y 13). */
export const MAPA_TRANSICIONES = Object.freeze([
  { relacion: 'seccion → seccion', ejemplo: 'Inicio → Vida (la barra de abajo)', nivel: 2, movimiento: 'Fundido con un leve ascenso: son hermanas, ninguna está dentro de otra.', protagonista: 'El indicador de la barra, que VIAJA hasta la pestaña nueva (F2).', donde: '`tipoDeNavegacion` → `seccion`' },
  { relacion: 'tarjeta → pantalla', ejemplo: 'Una tarjeta de la portada de Vida → Productividad', nivel: 3, movimiento: 'La pantalla nueva CRECE DESDE LA TARJETA: su recorte empieza en el rectángulo de la tarjeta, con sus esquinas, y se abre hasta la pantalla entera.', protagonista: 'La superficie de la tarjeta, que se convierte en la pantalla (apartado 21).', donde: '`registrarOrigen` (HubView) + `useContenedorDesdeOrigen` (App.jsx)' },
  { relacion: 'pantalla → tarjeta', ejemplo: 'Volver de Productividad a la portada de Vida', nivel: 3, movimiento: 'La portada vuelve desde la izquierda, en su scroll y sin repetir su entrada (F2), y la tarjeta de la que se salió SE POSA: baja de un poco más grande y más clara a su sitio.', protagonista: 'La tarjeta de la que se salió (apartado 6).', donde: '`vieneDe` (App.jsx → HubView) + `planDeLlegada`' },
  { relacion: 'padre → hijo', ejemplo: 'Inicio → un módulo, una lista → su detalle sin tarjeta propia', nivel: 3, movimiento: 'Llega desde la derecha y un poco por delante: se acerca (F2, `entrar`).', protagonista: 'La pantalla entera.', donde: '`tipoDeNavegacion` → `entrar`' },
  { relacion: 'hijo → padre', ejemplo: 'Atrás', nivel: 3, movimiento: 'Llega desde la izquierda, más corto: se retira (F2, `volver`).', protagonista: 'Lo que había antes, en su sitio.', donde: '`tipoDeNavegacion` → `volver`' },
  { relacion: 'lista → detalle', ejemplo: 'Un ejercicio de la biblioteca → su ficha', nivel: 3, movimiento: 'El nombre que se tocó VIAJA hasta el título de la ficha (`Compartido`).', protagonista: 'El nombre (apartados 3 y 22).', donde: '`Compartido` en la tarjeta y en la ficha' },
  { relacion: 'pestaña → pestaña', ejemplo: 'Las pestañas de dentro de Nutrición o de Progreso', nivel: 2, movimiento: 'Lo de dentro se funde; la página no se rehace (F2, `CambioDeContenido`).', protagonista: 'El contenido.', donde: '`CambioDeContenido`' },
  { relacion: 'detalle → capa', ejemplo: 'Un detalle → su hoja de acciones o su confirmación', nivel: 4, movimiento: 'La capa entra según lo que es (F6): una hoja sube desde su borde, una ventana aparece desde el centro.', protagonista: 'La capa nueva; lo de debajo se queda tras el velo.', donde: '`useCapasMotion`' },
  { relacion: 'capa → capa anidada', ejemplo: 'Una hoja → su confirmación', nivel: 4, movimiento: 'La nueva queda ENCIMA (orden de apertura, o la capa `alerta`), nunca detrás de la que la abrió (F6, apartado 21).', protagonista: 'La de arriba.', donde: '`CAPAS_Z`' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   2 · EL REGISTRO DE ORÍGENES (apartados 4, 16 y 17)

   Lo que se tocó se APUNTA con su rectángulo y sus esquinas; lo que aparece en
   los `TTL_ORIGEN_MS` siguientes y tiene el mismo id sale de ahí. Pasado ese
   rato el origen caduca: una pantalla que llega tarde (una carga lenta) no
   sale de un sitio que ya no tiene nada que ver (apartado 18). Tomar un origen
   lo GASTA: dos destinos no pueden salir del mismo toque (apartado 17).
   ─────────────────────────────────────────────────────────────────────────── */
export const TTL_ORIGEN_MS = 700;
/* 🐛 **El origen que deja algo al DESAPARECER vale para ese mismo cambio, no para
   los 700 ms siguientes.** Al abrir la ficha de un ejercicio se desmontan los
   veinte nombres de la lista y cada uno apuntaba dónde estaba; volver antes de
   que caducaran hacía viajar a los veinte —no solo al que se tocó— (apartado 6:
   *"solo ella"*). React quita lo que se va y monta lo que llega en el MISMO
   commit, así que el origen de una despedida solo tiene que durar eso. El de un
   toque sí dura `TTL_ORIGEN_MS`: la tarjeta crece antes de navegar. */
export const TTL_EFIMERO_MS = 120;
const ORIGENES = new Map();
const ttlDe = (o) => (o && o.efimero ? TTL_EFIMERO_MS : TTL_ORIGEN_MS);
const ahoraMs = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());

const rectValido = (r) => !!r && [r.top, r.left, r.width, r.height].every((n) => Number.isFinite(n)) && r.width > 0 && r.height > 0;

/**
 * Apunta un origen. Con `efimero` es el de algo que desaparece: vale para ese
 * cambio (`TTL_EFIMERO_MS`). Si ya había uno de un TOQUE vivo para el mismo id,
 * se queda su duración y solo se actualiza el rectángulo (lo que se ve justo
 * antes de irse es lo más fiel).
 */
export function registrarOrigen(id, { rect, radio = 0, fuente = null, elemento = null } = {}, ahora = ahoraMs(), { efimero = false } = {}) {
  if (!id || !rectValido(rect)) return false;
  const antes = ORIGENES.get(id);
  const deUnToque = !!antes && !antes.efimero && ahora - antes.t <= TTL_ORIGEN_MS;
  ORIGENES.set(id, {
    rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    radio: Math.max(0, Number(radio) || 0),
    fuente: Number(fuente) > 0 ? Number(fuente) : null,
    t: deUnToque ? antes.t : ahora,
    efimero: !!efimero && !deUnToque,
    /* Quién lo dejó: un elemento no sale de su propio origen (ver `Compartido`). */
    elemento,
  });
  return true;
}

/** ¿Hay un origen vivo para este id? No lo gasta (lo puede preguntar el pintado). */
export function hayOrigen(id, ahora = ahoraMs()) {
  const o = ORIGENES.get(id);
  return !!o && ahora - o.t <= ttlDe(o);
}

/** Lo devuelve y lo gasta; caducado o inexistente, `null`. */
export function tomarOrigen(id, ahora = ahoraMs()) {
  const o = ORIGENES.get(id);
  ORIGENES.delete(id);
  if (!o || ahora - o.t > ttlDe(o)) return null;
  return o;
}

export const olvidarOrigenes = () => ORIGENES.clear();

/* ───────────────────────────────────────────────────────────────────────────
   3 · EL CONTENEDOR QUE CRECE DESDE SU TARJETA (apartados 5, 20, 21 y 24)

   El recorte (`clip-path: inset(... round R)`) empieza en el rectángulo de la
   tarjeta, CON SUS ESQUINAS, y se abre hasta la pantalla entera mientras las
   esquinas se enderezan (apartado 20: *"no 20px → 0px instantáneamente"*). Lo
   de dentro se va revelando: empieza medio visible (apartado 24). Nada se
   deforma: no hay escala, solo el recorte.
   En Reducido —o si el origen no sirve— no hay recorte: es la entrada de
   siempre, que en Reducido ya es un fundido (apartado 33: *"fallback elegante"*).
   ─────────────────────────────────────────────────────────────────────────── */
const px = (n) => `${Math.max(0, Math.round(n * 10) / 10)}px`;

export function recorteDesde(origen, contenedor) {
  if (!origen || !rectValido(origen.rect) || !rectValido(contenedor)) return null;
  const o = origen.rect;
  const arriba = o.top - contenedor.top;
  const izquierda = o.left - contenedor.left;
  const derecha = contenedor.left + contenedor.width - (o.left + o.width);
  const abajo = contenedor.top + contenedor.height - (o.top + o.height);
  /* Un origen que se sale del contenedor (una tarjeta a medio desplazar) se recorta a él. */
  return `inset(${px(arriba)} ${px(derecha)} ${px(abajo)} ${px(izquierda)} round ${px(origen.radio)})`;
}

export function planDeContenedor({ origen, contenedor, ctx = contextoMotion() } = {}) {
  if (!ctx.espacial || ctx.apagado || ctx.reducido) return null;
  const desde = recorteDesde(origen, contenedor);
  if (!desde) return null;
  return {
    keyframes: [
      { clipPath: desde, opacity: String(OPACIDADES_MOTION.secondary) },
      { clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: '1' },
    ],
    opciones: { duration: duracionMs('slow', ctx), easing: CURVAS_MOTION.emphasized, fill: 'backwards' },
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   4 · EL ELEMENTO COMPARTIDO (apartados 3, 4, 19, 22 y 23)

   FLIP: el elemento ya está en su sitio nuevo; se le pone el transform que lo
   devuelve al rectángulo de origen y se le quita. Un TEXTO o un ICONO escalan
   igual en los dos ejes y desde su esquina —nunca se estiran (apartado 22)—;
   una SUPERFICIE puede estirarse, y sus esquinas se interpolan.
   ─────────────────────────────────────────────────────────────────────────── */
export const FORMAS_COMPARTIDO = Object.freeze(['texto', 'icono', 'imagen', 'superficie']);

export function flipEntre(origen, destino, forma = 'texto', { fuenteOrigen = null, fuenteDestino = null } = {}) {
  if (!rectValido(origen) || !rectValido(destino)) return null;
  const uniforme = forma !== 'superficie';
  const sx = origen.width / destino.width;
  const sy = origen.height / destino.height;
  /* Un TEXTO escala por su letra: su caja cambia de alto si se parte en dos líneas, y escalar por ella
     lo encogería de más (apartado 22: *"evitar saltos causados por cambios de ancho"*). */
  const s = !uniforme ? null
    : (forma === 'texto' && fuenteOrigen > 0 && fuenteDestino > 0 ? fuenteOrigen / fuenteDestino : sy);
  return {
    dx: origen.left - destino.left,
    dy: origen.top - destino.top,
    sx: uniforme ? s : sx,
    sy: uniforme ? s : sy,
  };
}

/** Por encima de esto el viaje se nota como un salto, no como continuidad: mejor el fundido. */
export const MAX_ESCALA_COMPARTIDO = 3;
export const MAX_VIAJE_PX = 900;

export function planDeCompartido({ origen, destino, forma = 'texto', radioDestino = 0, fuenteDestino = null, ctx = contextoMotion() } = {}) {
  if (ctx.apagado) return null;
  const f = origen && flipEntre(origen.rect, destino, forma, { fuenteOrigen: origen.fuente, fuenteDestino });
  const duracion = duracionMs('medium', ctx);
  const fundido = { keyframes: [{ opacity: String(OPACIDADES_MOTION.subtle) }, { opacity: '1' }], opciones: { duration: duracion, easing: CURVAS_MOTION.standard, fill: 'backwards' }, tipo: 'fundido' };
  if (!f) return null;
  const desmesurado = Math.max(f.sx, f.sy, 1 / f.sx, 1 / f.sy) > MAX_ESCALA_COMPARTIDO || Math.hypot(f.dx, f.dy) > MAX_VIAJE_PX;
  /* Reducido: la continuidad se cuenta sin recorrido —el elemento se funde en su sitio— (apartado 34). */
  if (ctx.reducido || !ctx.espacial || desmesurado) return fundido;
  const inicio = { transformOrigin: 'top left', transform: `translate(${Math.round(f.dx * 10) / 10}px, ${Math.round(f.dy * 10) / 10}px) scale(${Math.round(f.sx * 1000) / 1000}, ${Math.round(f.sy * 1000) / 1000})` };
  const fin = { transformOrigin: 'top left', transform: 'none' };
  if (forma === 'superficie' || forma === 'imagen') { inicio.borderRadius = `${origen.radio}px`; fin.borderRadius = `${radioDestino}px`; }
  return { keyframes: [inicio, fin], opciones: { duration: duracion, easing: CURVAS_MOTION.emphasized, fill: 'backwards' }, tipo: 'viaje' };
}

/* ───────────────────────────────────────────────────────────────────────────
   5 · LA LLEGADA AL VOLVER (apartado 6)

   *"La card debe reaparecer en su posición/contexto correspondiente."* La
   pantalla de la que se vuelve ya no existe, así que la tarjeta no viaja desde
   ella: SE POSA —baja de un poco más grande (el tope de una superficie, 1,03) y
   más clara a su sitio—, y así el ojo encuentra de dónde salió.
   ─────────────────────────────────────────────────────────────────────────── */
export function planDeLlegada(ctx = contextoMotion()) {
  if (ctx.apagado) return null;
  const quieto = ctx.reducido || !ctx.espacial;
  const s = 1 / escala('micro', ctx);
  return {
    keyframes: quieto
      ? [{ opacity: String(OPACIDADES_MOTION.secondary) }, { opacity: '1' }]
      : [{ transform: `scale(${Math.min(1.03, Math.round(s * 1000) / 1000)})`, filter: 'brightness(1.12)' }, { transform: 'none', filter: 'none' }],
    opciones: { duration: duracionMs('medium', ctx), easing: CURVAS_MOTION.entrance, fill: 'backwards' },
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   6 · LA AUDITORÍA DE LAS TARJETAS QUE ABREN ALGO (apartados 1 y 5)
   ─────────────────────────────────────────────────────────────────────────── */
export const AUDITORIA_F7 = Object.freeze([
  { que: 'Una tarjeta de la portada de un área → su módulo', decision: 'Continuidad de CONTENEDOR', porque: 'La tarjeta ES el módulo (su icono, su nombre, su resumen): la pantalla nace de ella. Ya crecía al pulsarla (Fase N3) y luego la pantalla llegaba desde la derecha como si no tuviera nada que ver.' },
  { que: 'Volver de un módulo a la portada de su área', decision: 'La tarjeta se posa', porque: 'Reconstruye la relación inversa sin un viaje desde una pantalla que ya no existe (apartado 6).' },
  { que: 'Un ejercicio de la biblioteca de Fitness → su ficha', decision: 'El nombre viaja (`Compartido`)', porque: 'Lo que se tocó es el nombre y la ficha empieza por él: es el elemento con más valor semántico (apartado 3). La lista se va y la ficha se monta en el mismo sitio de la pantalla.' },
  { que: 'Una tarjeta de Inicio → su módulo', decision: 'Entrar (F2), sin continuidad', porque: 'Es un RESUMEN del módulo, no el módulo: hacerla crecer prometería que dentro está lo mismo que en la tarjeta.' },
  { que: 'Una tarjeta de lista → una ventana o una hoja', decision: 'La capa de la F6', porque: 'Una capa no sustituye a lo de debajo: se pone encima y lo de debajo sigue ahí (nivel 4).' },
  { que: 'Las pestañas de dentro de una pantalla', decision: 'Fundido del contenido (F2) y pestaña marcada (F3)', porque: 'Es una transición de contenido, no de sitio.' },
  { que: 'La barra de abajo', decision: 'El indicador viaja (F2)', porque: 'Es el elemento que existe antes y después: el resto cambia.' },
]);

export const NO_EN_F7 = Object.freeze([
  { que: 'Dos pantallas vivas a la vez para cruzar un elemento (apartado 27)', porque: 'JosStyle pinta una sola pantalla (F2): mantener la de antes montada para la transición es lo mismo que pide deslizar para volver (C-56), y es arquitectura de navegación. El origen se apunta y lo nuevo sale de él.' },
  { que: 'Un indicador que viaja entre las pestañas de dentro de una pantalla (apartado 9)', porque: 'Las pestañas de `ToggleTab` las usan diez vistas y se parten en dos líneas cuando no caben (GE F1): un indicador que viaje entre filas es el trabajo de la F10 (el diseño que cambia). Hoy la pestaña marcada cambia con transición (F3) y su contenido se funde (F2).' },
  { que: 'La imagen de un libro o una foto que viaja a su detalle (apartado 19)', porque: 'Esos detalles son capas por encima (F6) cuya entrada mueve la capa entera: un viaje dentro de algo que también se mueve se ve doble. Se deja para cuando la capa sepa ceder el protagonismo (F11, la orquestación).' },
  { que: 'El progreso del gesto controlando una transición de página (apartado 14)', porque: 'No hay gesto de página (C-56). El de las hojas sí sigue al dedo (F5) y su velo se apaga al soltar (F6).' },
]);
