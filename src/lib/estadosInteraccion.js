/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F9 — MICROINTERACCIONES, ESTADOS Y FEEDBACK DE INTERFAZ

   *"Cada movimiento debe comunicar algo. La interfaz debe sentirse viva sin
   sentirse animada constantemente."* La F3 hizo los componentes y su
   pulsación; esta fase hace **sus estados** (`SOLAPES_ROADMAP`: F3 + F9):
   foco, cargando, hecho, error y la salida de un aviso. Y deja escrito, en
   un solo sitio, qué estado tiene cada pieza interactiva de JosStyle y quién
   lo resuelve —para que ningún componente nuevo invente el suyo (apartado 51)—.

   Lo que toca el DOM vive en `ui.jsx` (`PrimaryButton`, `GhostBtn`, los
   campos, `MensajeDeCampo`) y en `index.css`; esto es la decisión, que se
   prueba en Node.
   =========================================================================== */
import { DURACIONES_MOTION } from './motion';

/* ───────────────────────────────────────────────────────────────────────────
   1 · LOS ESTADOS ESTÁNDAR (apartados 2 y 3)

   *"No todos necesitan todos los estados. No inventar estados innecesarios."*
   Cada uno dice CÓMO se ve en JosStyle y quién lo pone; `usado: false` es un
   estado que hoy no tiene sentido aquí, con su motivo.
   ─────────────────────────────────────────────────────────────────────────── */
export const ESTADOS_COMPONENTE = Object.freeze([
  { id: 'default', como: 'Su aspecto de siempre.', quien: 'Cada componente', usado: true },
  { id: 'hover', como: 'Solo con un puntero de verdad (`hoverOnlyWhenSupported`, F2).', quien: 'Tailwind', usado: false, porque: 'JosStyle se usa en un iPhone: no hay puntero que se pose, y ninguna pantalla lleva `hover:` (F3).' },
  { id: 'focus', como: 'Con el teclado, el anillo del acento (F3); un campo de texto, su borde con el acento al enfocarlo (F9).', quien: '`index.css` (`:focus-visible`, `.campo:focus`)', usado: true },
  { id: 'pressed', como: 'La escalera de `active:scale` (EH F50, F3): pulsar en `ultraFast`, soltar en `normal`. Lo destructivo baja la opacidad.', quien: '`index.css`', usado: true },
  { id: 'active', como: 'Es «pressed» mientras dura el toque.', quien: '—', usado: false, porque: 'En un móvil no hay otro «activo» que pulsar: un segundo estado igual sería uno inventado (apartado 2).' },
  { id: 'selected', como: 'Color y `aria-pressed` / `aria-checked` / `aria-current`; la pestaña funde su color (F3).', quien: '`ToggleTab`, `Switch`, `PastillaFiltro`, la barra de abajo', usado: true },
  { id: 'disabled', como: 'Se apaga (opacidad 0,6) y no encoge: no reacciona como algo que se puede tocar (apartado 4).', quien: '`disabled:` en `ui.jsx`', usado: true },
  { id: 'loading', como: '`estado="cargando"`: el texto cambia AL MOMENTO, el giro aparece solo si tarda (`RETARDO_INDICADOR`), `aria-busy` y no se puede repetir la acción.', quien: '`PrimaryButton` / `GhostBtn` (`estado`)', usado: true },
  { id: 'success', como: 'Breve: ✓ en el propio botón (`estado="hecho"`) o el aviso de «añadido» (`AvisoAccion`). Nunca una celebración por guardar.', quien: '`PrimaryButton`, `AvisoAccion`', usado: true },
  { id: 'error', como: 'Donde se espera encontrarlo: bajo el campo (`MensajeDeCampo`, `aria-invalid` en rojo) o el aviso con su icono (FIT F37). Sin temblar.', quien: '`MensajeDeCampo`, los campos de `ui.jsx`, `AvisoAccion`', usado: true },
]);

/* ───────────────────────────────────────────────────────────────────────────
   2 · LOS TIEMPOS (apartados 6, 7, 31 y 45)

   El giro de un botón que carga solo aparece si la acción dura más que una
   transición de página (`slow`): *"no mostrar spinner para operaciones
   prácticamente instantáneas"*. Lo pone el CSS con un retraso de transición
   (`--motion-dur-slow`), sin un temporizador en cada botón. Y lo que confirma
   que algo salió bien se queda lo justo para leerlo.
   ─────────────────────────────────────────────────────────────────────────── */
export const RETARDO_INDICADOR = 'slow';
export const RETARDO_INDICADOR_MS = DURACIONES_MOTION.slow;
export const TIEMPOS_F9 = Object.freeze([
  { que: 'Pulsar', token: 'ultraFast', porque: 'Respuesta inmediata (F3).' },
  { que: 'Enfocar un campo: su borde y su halo', token: 'fast', porque: '*"El focus no debe aparecer de manera violenta"* (apartado 21), y tampoco lento.' },
  { que: 'Cambiar el texto de un botón (Guardar → Guardando…)', token: 'fast', porque: 'Un fundido en su sitio, sin que el botón cambie de ancho.' },
  { que: 'El giro de un botón que carga', token: 'slow', porque: 'Solo aparece si la acción dura más que esto (`RETARDO_INDICADOR`).' },
  { que: 'Un mensaje de error bajo un campo', token: 'fast', porque: 'Aparece donde se le espera, sin temblar (apartados 8, 22 y 23).' },
  { que: 'Un aviso que se va', token: 'fast', porque: 'Sale hacia donde vino, con la curva de salida (apartado 33).' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   3 · EL ESTADO DE UN BOTÓN (apartados 4, 6 y 7)

   Lo que el botón enseña según su `estado`: qué capa se ve, si está ocupado
   (no se puede repetir la acción: apartado 6) y qué anuncia. Un estado que no
   existe se lee como reposo: nunca un botón bloqueado por un valor raro.
   ─────────────────────────────────────────────────────────────────────────── */
export const ESTADOS_BOTON = Object.freeze(['reposo', 'cargando', 'hecho', 'fallo']);

export function estadoDeBoton(estado) {
  const e = ESTADOS_BOTON.includes(estado) ? estado : 'reposo';
  return {
    estado: e,
    capa: e === 'reposo' ? 'texto' : e,
    ocupado: e === 'cargando',
    ariaBusy: e === 'cargando' ? true : undefined,
  };
}

/** El texto de cada capa: lo que él le haya dado al botón, o el de siempre. */
export const TEXTOS_ESTADO_BOTON = Object.freeze({ cargando: 'Guardando…', hecho: 'Guardado', fallo: 'No se ha podido' });

/* ───────────────────────────────────────────────────────────────────────────
   4 · EL INVENTARIO (apartado 1)

   *"Recorrer toda la aplicación e identificar todos los elementos
   interactivos."* Uno por clase del apartado, con lo que hay en JosStyle, sus
   estados y quién los resuelve. Lo que es de otra fase lo dice.
   ─────────────────────────────────────────────────────────────────────────── */
export const INVENTARIO_F9 = Object.freeze([
  { que: 'Botones', hay: '`PrimaryButton`, `GhostBtn` y los escritos con la escalera de `active:scale`.', estados: ['default', 'focus', 'pressed', 'disabled', 'loading', 'success'], queda: 'Cargar y confirmar ya son del componente (`estado`); los cuatro botones que decían «Guardando…» a mano lo usan.' },
  { que: 'Botones de icono', hay: 'Papeleras, estrellas, flechas, `⋯`.', estados: ['default', 'focus', 'pressed', 'selected'], queda: 'Como los dejó la F3: una estrella late al marcarla, una papelera no encoge.' },
  { que: 'Tarjetas', hay: '`hub-card`, las de Inicio, `fit-pulsable`.', estados: ['default', 'focus', 'pressed'], queda: 'Las que abren algo crecen desde sí mismas (F7).' },
  { que: 'Interruptores', hay: '`Switch` y `PistaInterruptor`.', estados: ['default', 'focus', 'pressed', 'selected', 'disabled'], queda: 'La bola y el color van juntos (F3, apartado 15): `role="switch"` y `aria-checked`.' },
  { que: 'Casillas (completar)', hay: 'El ✓ de una tarea, de un hábito y de una serie.', estados: ['default', 'pressed', 'selected'], queda: '`tarea-hecha`, `habito-hecho` y `fit-serie-hecha`: una transición pequeña (apartado 16).' },
  { que: 'Radios y segmentos', hay: 'No hay radios: `ToggleTab` y `OpcionSegmentada` (Fitness).', estados: ['default', 'focus', 'selected'], queda: 'La pestaña funde su color al ritmo del contenido (F3). Un indicador que viaje entre pestañas es la F10 (C-58).' },
  { que: 'Desplegables nativos (select)', hay: '`SelectInput` y `Select`, que abren la rueda de iOS.', estados: ['default', 'focus', 'disabled'], queda: 'Con el borde de foco de un campo (F9).' },
  { que: 'Menús', hay: 'El `⋯` de las plantillas, el panel de sugerencias.', estados: ['default', 'focus'], queda: 'Se despliegan desde lo que los abre (F3, F6).' },
  { que: 'Pestañas', hay: '`ToggleTab` en diez pantallas, la barra de abajo.', estados: ['default', 'focus', 'selected'], queda: 'F2 y F3.' },
  { que: 'Deslizadores', hay: 'Cuatro `input type="range"` nativos y el divisor del comparador.', estados: ['default', 'focus'], queda: 'El pulgar va pegado al dedo (F8); el divisor, también con las flechas.' },
  { que: 'Campos de texto y áreas', hay: '`TextInput`, `Textarea`.', estados: ['default', 'focus', 'disabled', 'error'], queda: '🔓 F9: al enfocarlos, su borde pasa al acento con un halo suave (`fast`); con un error, `aria-invalid` lo pinta de rojo y `MensajeDeCampo` lo dice debajo.' },
  { que: 'Búsqueda', hay: 'El buscador global y los de cada módulo.', estados: ['default', 'focus'], queda: 'Respuesta inmediata (F4): sin entrada para los resultados.' },
  { que: 'Filtros y chips', hay: '`PastillaFiltro` (Fitness), las pastillas de cada módulo.', estados: ['default', 'focus', 'selected', 'disabled'], queda: 'Cada pastilla lleva cuántos quedarían, y la que dejaría cero se apaga (FIT F2): el «count» del apartado 25.' },
  { que: 'Navegación y enlaces', hay: 'La barra de abajo, volver, los enlaces de una tarjeta a su módulo.', estados: ['default', 'focus', 'pressed', 'selected'], queda: 'F2.' },
  { que: 'Acciones flotantes', hay: 'La lupa y las sugerencias.', estados: ['default', 'focus', 'pressed'], queda: 'F6 (capa `flotante`).' },
  { que: 'Acciones destructivas y de confirmación', hay: '`BotonBorrar`, `BotonBorrarDefinitivo`, «Eliminar» de cada hoja.', estados: ['default', 'focus', 'pressed'], queda: 'No encogen: bajan la opacidad (F3). Lo que se va, a la papelera, con «Deshacer» en el aviso de la misma acción (apartado 34).' },
  { que: 'Avisos (toasts)', hay: '`AvisoAccion` en Hoy, el Calendario y Fitness.', estados: ['default', 'success', 'error'], queda: '🔓 F9: entran y SE VAN (`toastExit`), y el de un error lleva su icono y su color.' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   5 · LO QUE NO PUEDE VOLVER (apartado 51)

   *"Ningún nuevo componente interactivo puede inventar su propio
   comportamiento."* Lee el código y caza, con su línea:
     · un botón que se escribe su «Guardando…» a mano en vez de `estado`;
     · un temblor (shake) como respuesta a un error (apartados 22 y 23).
   ─────────────────────────────────────────────────────────────────────────── */
const sinComentarios = (src) => String(src)
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`])\/\/.*$/gm, (m, a) => a + ' '.repeat(m.length - a.length));
const lineaDe = (src, i) => src.slice(0, i).split('\n').length;

export const PATRONES_F9 = Object.freeze([
  { id: 'cargando_a_mano', que: 'Un botón que escribe a mano su «Guardando…», «Subiendo…» o «Analizando…»: es `estado="cargando"` de `PrimaryButton` / `GhostBtn`, o `TextoDeBoton` dentro de uno propio' },
  { id: 'temblor', re: /\b(shake|temblor|animate-wiggle|wiggle)\b/gi, que: 'Un temblor como respuesta a un error: el error se dice debajo del campo, sin que tiemble (apartado 23)' },
]);

/** Botones (PrimaryButton, GhostBtn, <button> o la etiqueta de un selector de archivo) cuyo texto cambia
 *  con un ternario a un gerundio con puntos suspensivos —«Guardando…», «Subiendo…», «Analizando…»—. */
const GERUNDIO_ESPERANDO = /\?\s*['"`][A-ZÁÉÍÓÚ][^'"`\n]{0,40}?(?:ando|endo)\b[^'"`\n]*…['"`]/g;
const ABREN = ['<PrimaryButton', '<GhostBtn', '<button', '<label'];
function cargandoAMano(limpio) {
  const hallados = [];
  const re = new RegExp(GERUNDIO_ESPERANDO.source, GERUNDIO_ESPERANDO.flags);
  let m;
  while ((m = re.exec(limpio))) {
    /* El texto de «cargando» que se le PASA al botón (`textoCargando={…}`) es justo lo que se pide. */
    if (/textoCargando=\{[^}]*$/.test(limpio.slice(Math.max(0, m.index - 160), m.index))) continue;
    const antes = limpio.slice(Math.max(0, m.index - 600), m.index);
    const apertura = Math.max(...ABREN.map((a) => antes.lastIndexOf(a)));
    if (apertura === -1) continue;
    const cierre = antes.slice(apertura).search(/<\/(PrimaryButton|GhostBtn|button|label)>/);
    if (cierre !== -1) continue; /* el botón se cerró antes: este texto no es suyo */
    hallados.push(m.index);
  }
  return hallados;
}

export function auditarEstadosInteraccion({ vistas = {} } = {}) {
  const hallazgos = [];
  Object.entries(vistas).forEach(([archivo, src]) => {
    const limpio = sinComentarios(src);
    cargandoAMano(limpio).forEach((i) => hallazgos.push({ tipo: 'cargando_a_mano', archivo, linea: lineaDe(limpio, i), que: PATRONES_F9[0].que }));
    if (/\.css$/.test(archivo) || /\.jsx?$/.test(archivo)) {
      const re = new RegExp(PATRONES_F9[1].re.source, PATRONES_F9[1].re.flags);
      let m;
      while ((m = re.exec(limpio))) hallazgos.push({ tipo: 'temblor', archivo, linea: lineaDe(limpio, m.index), que: PATRONES_F9[1].que });
    }
  });
  const cuentas = Object.fromEntries(PATRONES_F9.map((p) => [p.id, hallazgos.filter((h) => h.tipo === p.id).length]));
  return { hallazgos, cuentas };
}

/* ───────────────────────────────────────────────────────────────────────────
   6 · LA AUDITORÍA DE LO QUE PIDE EL ENUNCIADO Y LO QUE NO SE HACE
   ─────────────────────────────────────────────────────────────────────────── */
export const AUDITORIA_F9 = Object.freeze([
  { apartados: [4, 6], que: 'Botones que cargan', antes: 'Cuatro botones cambiaban su texto a «Guardando…» a mano y se apagaban (opacidad 0,6), así que **parecían rotos** justo mientras trabajaban; el lector de pantalla no sabía que estaban ocupados.', queda: '`estado="cargando"`: el texto cambia en su sitio sin mover el ancho, no se apaga, `aria-busy`, y el toque no repite la acción. El giro, solo si tarda.' },
  { apartados: [7], que: 'Éxito', antes: 'El aviso de «añadido» y la pantalla de éxito de Fitness.', queda: 'Se quedan, y `estado="hecho"` deja un ✓ breve en el botón para lo que se queda en pantalla. Nunca una celebración por guardar.' },
  { apartados: [8, 20, 21, 22, 23], que: 'Campos y errores', antes: '🐛 **Un campo enfocado no cambiaba nada**: `outline-none` le quitaba el anillo del navegador y no había otro, así que con el teclado no se sabía dónde se estaba escribiendo (salvo en Fitness, FIT F39). Y un error de formulario aparecía plantado.', queda: 'Al enfocarlo, el borde pasa al acento con un halo (`fast`); `aria-invalid` lo pinta de rojo; `MensajeDeCampo` dice el error debajo con un fundido corto, sin temblar.' },
  { apartados: [33, 34], que: 'Avisos y deshacer', antes: 'El aviso entraba (`aviso-entra`) y **desaparecía de golpe** a los segundos o al pulsar «Deshacer».', queda: 'Entra y sale (`toastExit`). «Deshacer» va en el aviso de la acción que se acaba de hacer: la relación es temporal y de sitio.' },
  { apartados: [13, 14], que: 'Acordeones y tarjetas que se abren', antes: 'El de Inicio abre y cierra con `grid-template-rows` (SC F1) y su chevron gira (F3).', queda: 'Así: abrir y cerrar son transiciones, no saltos. Que lo de alrededor se recoloque con suavidad es la F10.' },
  { apartados: [15, 16, 17, 18, 19], que: 'Interruptores, casillas, radios, segmentos y pestañas', antes: 'Resueltos en la F3.', queda: 'Así (`INVENTARIO_F9`).' },
  { apartados: [41], que: 'Sin conexión', antes: 'Se detecta con `navigator.onLine` y tiene su estado y su aviso (EH F41).', queda: 'Así: se dice sin romper la pantalla. Animarlo es la F16.' },
  { apartados: [43, 44, 46], que: 'Celebraciones y presupuesto', antes: 'Pocas y escasas: completar, la racha, un libro, subir de rango (F4).', queda: 'Así: ni confeti ni una celebración por guardar.' },
]);

export const NO_EN_F9 = Object.freeze([
  { que: 'Temblar un campo con un error (apartados 22 y 23)', porque: 'El enunciado lo desaconseja como respuesta universal; aquí el error se dice debajo del campo, y un temblor en un iPhone se lee como «el teléfono se ha colgado». El preset `error` de la F1 sigue sin usarse en una pantalla.' },
  { que: 'Eliminar un elemento de una lista con salida y hueco que se cierra (apartados 10, 11 y 26)', porque: 'Es el diseño que cambia: la F10 (`listas_que_saltan`, `useFlip`).' },
  { que: 'Esqueletos, giros de carga, sincronización y error → reintentar (apartados 30, 31, 37, 38 y 40)', porque: 'Son los estados del sistema: la F16 («Pensando…» y el esqueleto de la carga ya están en el mapa con su fase).' },
  { que: 'Contadores y badges (apartados 27 y 28)', porque: '`CifraQueCambia` (F4) y la F17, que la lleva a todas las cifras.' },
  { que: 'Notificaciones leídas y no leídas (apartado 42)', porque: 'JosStyle no tiene una bandeja de notificaciones: no hay nada leído ni sin leer que animar (regla 8).' },
  { que: 'Un indicador que viaja entre pestañas de dentro de una pantalla (apartado 18)', porque: 'Es la F10 (C-58): `ToggleTab` se parte en dos líneas cuando no cabe.' },
]);

export const CUANDO_F9 = Object.freeze([
  { patron: '`<PrimaryButton estado="cargando" textoCargando="Subiendo…">Guardar</PrimaryButton>`', cuando: 'Un botón que espera algo que tarda (subir, guardar en la cuenta). El texto cambia en su sitio, el giro solo si tarda y el toque no repite la acción.' },
  { patron: '`estado="hecho"`', cuando: 'La acción terminó y el botón SIGUE en pantalla. Si la pantalla se cierra, el aviso o el propio cierre ya lo confirman.' },
  { patron: '`<TextInput aria-invalid />` + `<MensajeDeCampo>`', cuando: 'Un campo que no vale: rojo y la frase debajo, que diga qué corregir (EH F62).' },
  { patron: '`AvisoAccion`', cuando: 'Confirmar una acción sin parar a nadie, con «Deshacer» si se puede. Montarlo SIEMPRE (con `accion` vacía) para que pueda salir.' },
  { patron: 'Nada', cuando: 'Lo que se repite cien veces y ya se entiende (apartado 46: la acción del usuario manda sobre la decoración).' },
]);
