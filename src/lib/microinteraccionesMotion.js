/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · F3 — MICROINTERACCIONES, COMPONENTES Y FEEDBACK

   La F3 lleva el movimiento de la navegación (F2) al toque de cada día:
   pulsar, encender, desplegar, marcar. Su enunciado dice *"No quiero «más
   animaciones». Quiero: MEJOR FEEDBACK"* (resultado final), y su apartado 35
   es la regla que manda sobre los demás: *"La ausencia de movimiento también
   forma parte del Motion System"*.

   Esta librería no anima nada: guarda **lo que se encontró** (la auditoría de
   los componentes reales, apartado 1), **lo que se hizo** con cada uno, **lo
   que es de otra fase** y las comprobaciones que impiden que vuelva lo que se
   arregló —un interruptor dibujado a mano, un chevron que se cambia por otro—.
   El movimiento vive donde dice la F1: en `index.css` (las clases) y en
   `src/components/motion.jsx` (las piezas de React).

   ⚠️ No importa nada de React ni del DOM: se prueba en Node, y la prueba le pasa
   el contenido de los archivos (una librería del navegador no lee del disco).

   🐛 **Y NO ES `microinteracciones.js`**, que es de la EH F50 y declara las
   veinticuatro de Estilo de hombre con la escalera de pulsar (`ESCALAS_AL_TOCAR`:
   0,96 una tarjeta grande, 0,98 una fila, 0,95 un botón, 0,90 un icono). Esta
   fase se escribió primero con ese nombre y lo pisó: lo cantaron seis suites al
   no encontrar sus exportaciones. Es la lección de la E3 F9 (`accionesRapidas.js`)
   otra vez: **antes de crear un archivo, mirar si ese nombre ya es de alguien.**
   La escalera sigue siendo la de allí; aquí solo cambia CÓMO se pulsa.
   =========================================================================== */

/* ───────────────────────────────────────────────────────────────────────────
   1 · EL GIRO DE UN CHEVRON (apartados 14 y 27)

   Veinte desplegables cambiaban un icono por otro al abrirse (`ChevronDown`
   por `ChevronUp`, o por `ChevronRight`): el icono se sustituía de golpe. Ahora
   es UN icono que gira, y estas son sus posiciones. El de la derecha que abre
   hacia arriba gira por el camino corto (−90° → −180°), nunca media vuelta y un
   cuarto.
   ─────────────────────────────────────────────────────────────────────────── */
export const POSICIONES_CHEVRON = { abajo: 0, derecha: -90, arriba: 180 };

export function giroDeChevron({ abierto = false, cerrado = 'abajo', alAbrir = 'arriba' } = {}) {
  const desde = POSICIONES_CHEVRON[cerrado] ?? 0;
  let hasta = POSICIONES_CHEVRON[alAbrir] ?? 180;
  if (desde < 0 && hasta === 180) hasta = -180;
  return abierto ? hasta : desde;
}

/* ───────────────────────────────────────────────────────────────────────────
   2 · EL LATIDO DE UNA MARCA (apartado 29)

   Marcar un favorito late una vez; quitarlo, no (se apaga, y el color ya lo
   dice). Y al pintar por primera vez tampoco: una lista de favoritos que latiera
   entera al abrirse no le diría nada. `LatidoAlMarcar` lleva la cuenta con esto.
   ─────────────────────────────────────────────────────────────────────────── */
export function siguienteLatido(estado, activo) {
  const previo = estado || { activo: !!activo, veces: 0 };
  const veces = activo && !previo.activo ? previo.veces + 1 : previo.veces;
  return { activo: !!activo, veces, late: !!activo && veces > 0 };
}

/* ───────────────────────────────────────────────────────────────────────────
   3 · LA AUDITORÍA DE LOS COMPONENTES REALES (apartado 1)

   *"No asumas que todos existen. Busca los reales en el proyecto."* Uno por
   cada clase que enumera el apartado: qué hay en JosStyle, qué movimiento tenía
   y qué queda. Lo que es de otra fase lo dice en `fase`.
   ─────────────────────────────────────────────────────────────────────────── */
export const AUDITORIA_F3 = [
  { que: 'Botones', hay: '`PrimaryButton`, `GhostBtn`, `QuickActionButton` y unos 130 escritos en las vistas con la escalera de `active:scale` (EH F50).', antes: '57 de los 138 que encogen no tenían transición: saltaban a 0,95 y volvían de golpe. Y pulsar y soltar iban al mismo ritmo.', queda: 'Todos con transición: pulsar en `ultrafast` y soltar en `normal` con la curva `entrance` (llega y se posa, sin rebote). En Reducido no encogen: bajan la opacidad.' },
  { que: 'Botones de icono', hay: 'Papeleras, estrellas, flechas, el `⋯` de un elemento.', antes: 'Lo mismo que los botones; y la papelera encogía al 0,90 como cualquier icono.', queda: 'La papelera (`BotonBorrar`, `BotonBorrarDefinitivo`) ya no encoge: baja la opacidad (`toque-destructivo`), como lo destructivo de Fitness (FIT F37, apartado 28).' },
  { que: 'Tarjetas (cards)', hay: 'Las de la portada de un área (`hub-card`, Fase N3), las de Inicio y las de Fitness (`fit-pulsable`).', antes: '🐛 Las que entran en cascada (`hub-card`) **no encogían al pulsarlas**: la entrada terminaba con `both`, y su último fotograma ganaba a `:active` y a `.hub-card-receding` para siempre.', queda: 'La entrada termina con `backwards`: la tarjeta encoge al pulsarla y, en la portada, las demás retroceden al tocar una, que es lo que la Fase N3 escribió y nunca se vio.' },
  { que: 'Interruptores (toggles y switches)', hay: 'Tres: el `Switch` de `ui.jsx`, cinco dibujados a mano en Ajustes y uno en Gestión de temas, y cuatro filas con su pista aparte (Calendario ×2, Relación, la legibilidad de Ajustes).', antes: 'Los tres movían la bola con `left` (recalcula el diseño en cada fotograma), a 150, 200 y 220 ms, y los de Ajustes no decían si estaban encendidos (`aria-checked`) a VoiceOver.', queda: 'Uno: `Switch` y, dentro de una fila, `PistaInterruptor`. La bola viaja con `transform`, se estira al pulsar y en Reducido salta a su sitio; la fila entera es el control, con `role="switch"`.' },
  { que: 'Casillas (checkboxes)', hay: 'Las de completar una tarea o un hábito (✓ en Hoy, la Agenda, Productividad).', antes: 'Ya animan: `tarea-hecha` y `habito-hecho` (E3 F14 y F24), breves y sin confeti.', queda: 'Se quedan como están (apartado 21: *"no hacer una animación lenta para una acción que se realiza cientos de veces"*).' },
  { que: 'Radios y segmentos', hay: 'No hay radios: las elecciones son pestañas (`ToggleTab`) y segmentos de Fitness (`OpcionSegmentada`).', antes: 'La pestaña elegida cambiaba de color de golpe mientras su contenido se fundía (F2).', queda: 'La pestaña (`pestana-cambia`) funde su color al ritmo del contenido, y anuncia cuál está elegida (`aria-pressed`): una sola acción (apartado 24).' },
  { que: 'Sliders', hay: 'Cuatro `input type="range"` nativos: el zoom del Horario, el nivel de una skill y dos en Ajustes.', antes: 'El valor se actualiza mientras se arrastra (`onChange` de React salta en cada movimiento).', queda: 'Nada que añadir: un valor que siguiera al dedo con retraso sería peor (apartado 23).' },
  { que: 'Pestañas (tabs)', hay: '`ToggleTab` en diez pantallas y la barra de abajo.', antes: 'La barra ya tiene su indicador (F2); las de dentro, su transición de contenido (F2).', queda: 'Color e indicador coordinados con el contenido (ver «Radios y segmentos»).' },
  { que: 'Desplegables y acordeones', hay: 'Veintitrés que abren con un chevron, más el acordeón de Inicio (SC F1).', antes: 'Veinte cambiaban `ChevronDown` por `ChevronUp` de golpe; tres giraban. El contenido aparecía plantado.', queda: '`ChevronDespliegue`: el mismo icono gira, en Reducido sin girar. Y lo de dentro aparece con un fundido corto (`despliegue-entra`). Cerrar recolocando el resto con suavidad es la F10 (C-54).' },
  { que: 'Menús (dropdowns)', hay: 'Los desplegables nativos (`SelectInput`, la rueda de iOS) y el `⋯` de las plantillas, que despliega sus acciones dentro de la tarjeta.', antes: 'Las acciones del `⋯` aparecían de golpe.', queda: 'Aparecen desde la propia tarjeta (`despliegue-entra`), conectadas a lo que las abrió. Las hojas y ventanas (el `⋯` de la Agenda abre una) son la F6.' },
  { que: 'Tooltips', hay: 'Ninguno: solo `title` en algunos botones, que el iPhone no enseña.', antes: '—', queda: 'No se crea uno: en un móvil no hay puntero que se pose (apartado 26). Lo que necesita explicarse lo dice el propio botón.' },
  { que: 'Favoritos y selecciones', hay: 'Trece estrellas y corazones que marcan algo como favorito (Biblioteca, Nutrición, Armario, Horario, planes, ejercicios, colores, apariencias).', antes: 'Solo dos (Biblioteca) latían, y latían al pulsar —también al quitarlo—; las demás cambiaban de color sin más.', queda: '`LatidoAlMarcar`: las trece laten una vez al marcar, nunca al quitar ni al abrir la pantalla (apartado 29).' },
  { que: 'Foco', hay: 'El anillo de Fitness (`.fit-foco`, FIT F39).', antes: 'Fuera de Fitness, el anillo azul del navegador, o ninguno.', queda: 'El mismo anillo con el acento en toda la aplicación, solo con teclado (`:focus-visible`) y solo en controles: los campos de texto no cambian (C-32).' },
  { que: 'Hover', hay: 'Ni una clase `hover:` en las pantallas.', antes: '—', queda: 'Sigue sin haber: JosStyle se usa en un iPhone, y Tailwind solo generaría un `hover:` con puntero de verdad (F2). Una tarjeta que se eleva al pasar el ratón no se añade: haría flotar a todas (apartado 13).' },
  { que: 'Elementos arrastrables y reordenar', hay: 'Ninguno: se reordena con flechas (EH F50), que funcionan con VoiceOver.', antes: '—', queda: 'Es la F5 (el gesto) y la F8 (la física al soltar).' },
  { que: 'Acciones destructivas y de confirmación', hay: '`BotonBorrar` (va a la papelera, no pregunta) y `BotonBorrarDefinitivo` (pregunta).', antes: 'Encogían como cualquier icono.', queda: 'No encogen (ver «Botones de icono»), y la confirmación es una ventana: su entrada es la F6.' },
  { que: 'Botón que carga, éxito y error', hay: 'Botones que dicen «Guardando…» o se apagan mientras esperan.', antes: '—', queda: 'Son estados, y los estados son la F9 (`SOLAPES_ROADMAP`: la F3 hace el componente y su pulsación; la F9, sus estados).' },
  { que: 'Listas: añadir, quitar y deshacer', hay: 'Tareas, comidas, movimientos… y la papelera con «Deshacer».', antes: 'El resto de la lista salta (hallazgo `listas_que_saltan` de la F0).', queda: 'Es la F10 (el diseño que cambia: FLIP), que tiene `useFlip` de la F1 esperándola.' },
  { que: 'Respuesta háptica', hay: 'La vibración del bus de sonido (SO), que respeta el 📳 de Ajustes.', antes: '—', queda: 'Ninguna pantalla vibra por su cuenta (FIT F9), y ninguna acción depende de la vibración para entenderse (apartado 37).' },
];

/* Lo que pide el enunciado de la F3 y es, palabra por palabra, el tema de otra fase. */
export const NO_EN_F3 = [
  { que: 'Botón que pasa de normal a cargando y a «Guardado» (apartados 8-10)', porque: 'Son los estados de un componente, que son la F9 (`SOLAPES_ROADMAP`). La F3 hace el componente y su pulsación.' },
  { que: 'Añadir, quitar y deshacer en una lista sin que salte (apartados 17-19)', porque: 'Es la F10 (el diseño que cambia), con `useFlip` de la F1.' },
  { que: 'Arrastrar y reordenar (apartados 30-31)', porque: 'No hay nada arrastrable en JosStyle; cuando lo haya es la F5 (el gesto) y la F8 (la física).' },
  { que: 'Cerrar un desplegable recolocando el resto con suavidad (apartado 15)', porque: 'Que la pantalla se recoloque es diseño que cambia: la F10 (C-54). La F3 hace que lo de dentro aparezca.' },
  { que: 'Elevar una tarjeta al pasar el ratón (apartados 6 y 13)', porque: 'JosStyle se usa en un iPhone; con un puntero, una tarjeta que flota es una más que se mueve sin decir nada (apartado 35). Declarado en C-54.' },
  { que: 'Tooltips (apartado 26)', porque: 'No hay ninguno, y en un móvil no hay puntero que se pose.' },
];

/* ───────────────────────────────────────────────────────────────────────────
   4 · LO QUE NO PUEDE VOLVER (apartado 40: *"nuevo elemento = motion automático"*)

   Lee el código de las vistas y los componentes y devuelve, con su línea, lo
   que la F3 retiró: un interruptor con la bola en `left`, un chevron que se
   cambia por otro, una papelera que encoge. Una pantalla nueva que dibuje el
   suyo pone la suite roja.
   ─────────────────────────────────────────────────────────────────────────── */
const sinComentarios = (src) => String(src)
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`])\/\/.*$/gm, (m, a) => a + ' '.repeat(m.length - a.length));

const lineaDe = (src, indice) => src.slice(0, indice).split('\n').length;

export const PATRONES_F3 = [
  { id: 'interruptor_a_mano', re: /left:\s*[\w.!?[\]'"]+\s*\?\s*\d+\s*:\s*\d+/g, que: 'Una bola de interruptor movida con `left`: es `Switch`, o `PistaInterruptor` dentro de una fila' },
  { id: 'chevron_que_se_cambia', re: /\?\s*<Chevron(?:Up|Down|Right)\b[^>]*\/>\s*:\s*<Chevron(?:Up|Down|Right)\b/g, que: 'Un chevron que se cambia por otro al abrir: es `ChevronDespliegue`, que gira' },
  { id: 'chevron_girado_a_mano', re: /<ChevronDown\b[^>]*rotate\(180deg\)/g, que: 'Un chevron girado a mano en el `style`: es `ChevronDespliegue`' },
  { id: 'papelera_que_encoge', re: /className="[^"]*active:scale[^"]*"[^>]*>\s*<Trash2\b/g, que: 'Una papelera que encoge al pulsar: lo destructivo baja la opacidad (`toque-destructivo`)' },
];

export function auditarComponentesMotion({ vistas = {} } = {}) {
  const hallazgos = [];
  Object.entries(vistas).forEach(([archivo, src]) => {
    const limpio = sinComentarios(src);
    PATRONES_F3.forEach((p) => {
      const re = new RegExp(p.re.source, p.re.flags);
      let m;
      while ((m = re.exec(limpio))) {
        hallazgos.push({ tipo: p.id, archivo, linea: lineaDe(limpio, m.index), que: p.que });
      }
    });
  });
  const cuentas = Object.fromEntries(PATRONES_F3.map((p) => [p.id, hallazgos.filter((h) => h.tipo === p.id).length]));
  return { hallazgos, cuentas };
}

/* ───────────────────────────────────────────────────────────────────────────
   5 · LA REGLA PARA LO QUE VENGA (apartados 36 y 40)

   La jerarquía de velocidades: una microinteracción es más rápida que una
   transición de página, y una de página más que un momento. Y el «cuándo» de
   cada patrón, que es lo que pide el apartado 42 que se documente.
   ─────────────────────────────────────────────────────────────────────────── */
export const JERARQUIA_F3 = [
  { que: 'Pulsar (el dedo baja)', token: 'ultraFast', ms: 120 },
  { que: 'Soltar, encender un interruptor, girar un chevron, latir una marca', token: 'normal', ms: 220 },
  { que: 'Lo que aparece al desplegar, el color de una pestaña', token: 'fast', ms: 160 },
  { que: 'Volver o cambiar de sección (F2)', token: 'normal', ms: 220 },
  { que: 'Entrar en una pantalla (F2)', token: 'slow', ms: 340 },
];

export const CUANDO_F3 = [
  { patron: '`active:scale-*` (la escalera de `ui.jsx`)', cuando: 'Cualquier cosa que se toca y no es destructiva. El escalón lo decide su tamaño (`ESCALAS_AL_TOCAR`, EH F50): 0,96 una tarjeta grande, 0,98 una fila, 0,95 un botón, 0,90 un icono.' },
  { patron: '`toque-destructivo`', cuando: 'Lo que borra o descarta. No encoge: baja la opacidad.' },
  { patron: '`Switch`', cuando: 'Encender o apagar algo, suelto a la derecha de su texto.' },
  { patron: '`PistaInterruptor`', cuando: 'Lo mismo, cuando la fila entera es lo que se toca: la fila lleva `role="switch"` y `aria-checked`.' },
  { patron: '`ChevronDespliegue`', cuando: 'Todo lo que se abre y se cierra en su sitio. Nunca dos iconos que se cambian.' },
  { patron: '`despliegue-entra`', cuando: 'El contenido que aparece al abrir un desplegable o un menú dentro de una tarjeta.' },
  { patron: '`LatidoAlMarcar`', cuando: 'Una marca que él pone y quita (favorito, estrella, corazón). Late al ponerla.' },
  { patron: 'Nada', cuando: 'Lo que se repite cien veces al día y ya se entiende sin moverse, lo decorativo y lo informativo (apartados 32 y 35).' },
];
