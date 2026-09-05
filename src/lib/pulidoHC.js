/* ===========================================================================
   ENTREGA 3 · FASE 14 (HC F9) — PULIDO VISUAL, UX Y ANIMACIONES
   ===========================================================================

   *"Hoy + Agenda + Calendario deben sentirse como una única aplicación
   premium."* Y el enunciado acota la fase en su primera línea: *"NO rediseñar
   módulos que no estén relacionados con este sistema. NO añadir funcionalidades
   nuevas innecesarias. El objetivo es pulir lo existente, no cambiar su
   lógica."*

   Así que aquí **no se rediseña nada**: se declara qué tiene que cumplir cada
   pantalla del bloque y **se comprueba leyendo el código**, igual que
   `revisarPantalla()` en EH F42. Una regla escrita en un comentario se olvida;
   una que se ejecuta en cada `verificar.sh` no.

   ─────────────────────────────────────────────────────────────────────────
   **LO QUE DE VERDAD FALTABA, Y ES LO QUE SE CONSTRUYE**
   ─────────────────────────────────────────────────────────────────────────

   Gran parte del pulido ya estaba: los tokens (`COLORS`), las cards, los
   botones, `--ease-premium` con *"Reducir movimiento"* respetado desde
   `index.css`, el revisor de accesibilidad de EH F42 y la coherencia de tokens
   de EH F49. Lo que **no existía**:

   1. **Los esqueletos de carga** (apartados 23 y 24): *"nunca mostrar una
      pantalla completamente vacía mientras se cargan datos"*. No había ninguno.
   2. **Los estados vacíos del bloque** (26, 27, 28 y 29), con la regla honesta
      del 29: *"no mostrar falsamente «Todo hecho» si realmente existen elementos
      pendientes"*.
   3. **Los textos de error** (25): *"no mostrar error técnico"*.
   4. **Un revisor que lo compruebe**, para que no se deshaga en la fase 15.
   =========================================================================== */

/* ── Las pantallas del bloque (apartados 1 a 6) ────────────────────────────
   ⚠️ Solo estas: el enunciado prohíbe expresamente tocar lo que no es de aquí. */
export const PANTALLAS_HC = [
  { id: 'hoy', nombre: 'Hoy', archivo: 'src/views/DashboardView.jsx', pregunta: '¿Qué tengo ahora?' },
  { id: 'agenda', nombre: 'Agenda', archivo: 'src/views/CalendarView.jsx', pregunta: '¿Cómo está organizado este día?' },
  { id: 'calendario', nombre: 'Calendario', archivo: 'src/views/CalendarView.jsx', pregunta: '¿Qué ocurre durante el mes?' },
  { id: 'semana', nombre: 'Semana', archivo: 'src/views/CalendarView.jsx', pregunta: '¿Cómo está organizada mi semana?' },
  { id: 'stats', nombre: 'Estadísticas', archivo: 'src/views/CalendarView.jsx', pregunta: '¿En qué uso mi tiempo?' },
];

export const pantallaHC = (id) => PANTALLAS_HC.find((p) => p.id === id) || null;

/* ── Los esqueletos de carga (apartados 23 y 24) ───────────────────────────

   *"Nunca mostrar una pantalla completamente vacía mientras se cargan datos.
   Utilizar skeletons… deben respetar la forma real de las cards."*

   ⚠️ **Respetar la forma real** es la parte que importa: un esqueleto que no se
   parece a lo que viene después produce un salto al cargar, que es justo lo que
   el apartado 21 pide evitar. Por eso cada uno declara **cuántas cards** y de
   qué alto, sacado de la pantalla que imita. */
export const ESQUELETOS = [
  { id: 'hoy', cards: 4, alturas: [56, 92, 120, 72], porque: 'El resumen, el progreso, la agenda del día y los apuntes.' },
  { id: 'agenda', cards: 3, alturas: [92, 140, 88], porque: 'La cabecera con la tira de días, la línea temporal y lo que no tiene hora.' },
  { id: 'calendario', cards: 2, alturas: [280, 96], porque: 'La cuadrícula del mes y el panel del día seleccionado.' },
  { id: 'semana', cards: 2, alturas: [120, 160], porque: 'La tira de siete días y la planificación del seleccionado.' },
  { id: 'stats', cards: 4, alturas: [72, 88, 104, 88], porque: 'El resumen, el gráfico, la carga por día y la distribución.' },
];

export const esqueleto = (id) => ESQUELETOS.find((e) => e.id === id) || null;

/** ⚠️ Un esqueleto que se queda para siempre es peor que no tenerlo: si la carga
 *  falla, lo que toca es el texto de error del apartado 25, no una animación
 *  eterna. Este es el tope. */
export const MAX_ESQUELETO_MS = 8000;

/* ── Los estados vacíos (apartados 26, 27, 28 y 29) ────────────────────────

   *"Cada pantalla debe tener un empty state elegante."* Con sus palabras, y
   **cada uno con su salida**: un vacío sin botón es una pantalla rota (la
   lección de EH F41).

   🚨 **Y el apartado 29 es el que se puede romper sin darse cuenta:** *"no
   mostrar falsamente «Todo hecho» si realmente existen elementos pendientes
   ocultos"*. Por eso Hoy tiene **dos** vacíos distintos, y `vacioDeHoy()` mira
   los datos de verdad para elegir. */
export const VACIOS_HC = {
  hoy_libre: {
    id: 'hoy_libre', titulo: 'Día libre ✨', explica: 'No tienes nada programado.', boton: 'Añadir',
  },
  hoy_hecho: {
    id: 'hoy_hecho', titulo: 'Todo hecho', explica: 'No te queda nada pendiente para hoy.', boton: 'Añadir',
  },
  agenda: {
    id: 'agenda', titulo: 'Día libre ✨', explica: 'Disfruta del día.', boton: 'Añadir',
  },
  calendario: {
    id: 'calendario', titulo: 'Tu calendario está libre ✨', explica: 'No tienes nada programado para este periodo.', boton: 'Añadir',
  },
  semana: {
    id: 'semana', titulo: 'Semana libre ✨', explica: 'No tienes nada programado esta semana.', boton: 'Añadir',
  },
  stats: {
    id: 'stats', titulo: 'Todavía no hay nada que contar', explica: 'Cuando planifiques algo, aquí verás cómo va.', boton: null,
  },
};

export const vacioHC = (id) => VACIOS_HC[id] || null;

/** 🚨 Apartado 29 — *"Todo hecho o Día libre **dependiendo del estado real**"*.
 *  Con pendientes no se dice ninguna de las dos: hay cosas que hacer. */
export function vacioDeHoy({ total = 0, pendientes = 0 } = {}) {
  if (pendientes > 0) return null;          // No está vacío: hay cosas pendientes.
  if (total > 0) return VACIOS_HC.hoy_hecho; // Había cosas y están todas hechas.
  return VACIOS_HC.hoy_libre;                // No había nada.
}

/* ── Los textos de error (apartado 25) ─────────────────────────────────────

   *"Si algo falla: no mostrar error técnico. Mostrar «No se ha podido cargar
   esto. Reintentar». El detalle técnico queda para consola/logs."*

   ⚠️ Y EH F62 lo tiene como regla del proyecto: un error dice **qué hacer**,
   nunca *"Error"* a secas ni una palabra técnica. */
export const TEXTOS_ERROR_HC = {
  cargar: { titulo: 'No se ha podido cargar esto', accion: 'Reintentar' },
  guardar: { titulo: 'No se ha podido guardar', accion: 'Reintentar' },
  archivo: { titulo: 'No se ha podido leer ese archivo', accion: 'Elegir otro' },
};

export const PALABRAS_TECNICAS = [
  'null', 'undefined', 'token', 'json', 'api', 'endpoint', 'fetch',
  'stacktrace', 'exception', 'error 500', 'timeout', 'service worker',
];

export function sinPalabrasTecnicas(texto) {
  const t = String(texto || '').toLowerCase();
  return !PALABRAS_TECNICAS.some((p) => t.includes(p));
}

/* ── Las animaciones (apartados 14, 15, 16, 19 y 20) ───────────────────────

   *"Transición ligera. No hacer pantalla blanca. No utilizar animaciones
   exageradas."* Y el 16: *"no hacer confeti exagerado para cada tarea"*.

   ⚠️ Cada una declara **su duración**, y hay una prueba que comprueba que
   ninguna pasa del tope: una animación larga en una acción que se repite veinte
   veces al día deja de ser elegante y pasa a estorbar.

   🚨 Y **todas viven en `index.css`**, no en un `style` de una vista: así
   respetan *"Reducir movimiento"* solas, que es como se cumple el apartado 18
   sin escribir una línea (RA F2 lo dejó dicho). */
export const MAX_ANIMACION_MS = 700;

export const ANIMACIONES_HC = [
  { id: 'entrada_pantalla', apartado: 14, nombre: 'Cambiar de vista', ms: 420, clase: 'module-enter' },
  { id: 'completar', apartado: 16, nombre: 'Completar una tarea', ms: 300, clase: 'tarea-hecha' },
  { id: 'aviso', apartado: 17, nombre: 'El aviso de "añadido"', ms: 260, clase: 'aviso-entra' },
  { id: 'cambio_mes', apartado: 19, nombre: 'Cambiar de mes', ms: 260, clase: 'calendar-month-grid' },
  { id: 'esqueleto', apartado: 23, nombre: 'El latido del esqueleto', ms: 1400, clase: 'esqueleto', repetida: true },
];

export const animacionHC = (id) => ANIMACIONES_HC.find((a) => a.id === id) || null;

/** ⚠️ La del esqueleto se repite mientras carga, así que su duración no es un
 *  retraso: se mide aparte. */
export const animacionesLargas = () => ANIMACIONES_HC.filter((a) => !a.repetida && a.ms > MAX_ANIMACION_MS);

/* ── El revisor (apartados 7, 8, 9 y 25) ───────────────────────────────────

   Lee el código de una vista y devuelve lo que incumple, **con su línea**, como
   `revisarPantalla()` en EH F42.

   🚨 **Y cada regla trae un `ejemploMalo`**, con una prueba de que lo caza: un
   revisor que no puede fallar da siempre cero problemas y su silencio parece un
   aprobado (EH F42 y F48). */
export const REGLAS_PULIDO = [
  {
    id: 'sin_hex',
    apartado: 7,
    nombre: 'Ningún color escrito a mano',
    // ⚠️ El acento y los tokens cambian con el tema; un hex fijo no.
    prohibido: /#[0-9a-fA-F]{6}\b/,
    ejemploMalo: 'style={{ color: "#3b82f6" }}',
    arreglo: 'Usa COLORS o el acento que llega por props.',
  },
  {
    id: 'sin_radio_suelto',
    apartado: 7,
    nombre: 'Ningún radio de esquina inventado',
    prohibido: /borderRadius:\s*['"`]?\d+px/,
    ejemploMalo: "style={{ borderRadius: '7px' }}",
    arreglo: 'Usa las clases `rounded-xl` / `rounded-2xl` / `rounded-3xl`, como el resto.',
  },
  {
    id: 'sin_animacion_larga',
    apartado: 14,
    nombre: 'Ninguna animación larga escrita en la vista',
    /* 🐛 La primera versión excluía las comillas del hueco, así que se paraba
       en `transition: '` y **no cazaba su propio ejemplo malo**: la prueba que
       comprueba que cada regla caza su ejemplo lo encontró en el primer intento.
       Un revisor que no puede fallar da siempre cero problemas. */
    prohibido: /transition[^;]{0,40}\b[1-9]\d{3,}ms/,
    ejemploMalo: "style={{ transition: 'all 2000ms' }}",
    arreglo: 'Las animaciones viven en index.css con --ease-premium, y así respetan "Reducir movimiento" solas.',
  },
  {
    id: 'sin_error_tecnico',
    apartado: 25,
    nombre: 'Ningún error técnico en pantalla',
    prohibido: /(?:>|["'`])\s*(?:Error|error)\s*:\s*\{/,
    ejemploMalo: '<p>Error: {e.message}</p>',
    arreglo: 'Usa TEXTOS_ERROR_HC: qué ha pasado y qué puede hacer. El detalle va a la consola.',
  },
];

export const reglaPulido = (id) => REGLAS_PULIDO.find((r) => r.id === id) || null;

/* ⚠️ Antes de barrer hay que quitar los comentarios **y las propias reglas**:
   este archivo escribe los patrones que busca, y una prueba que se encuentre a
   sí misma salta con algo que está bien. Van catorce veces en el proyecto. */
export function sinComentariosNiReglas(codigo) {
  return String(codigo || '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/^\s*(?:prohibido|ejemploMalo|arreglo):.*$/gm, '');
}

/** Revisa el código de una vista. Devuelve `[{ regla, linea, texto }]`. */
export function revisarPulido(codigo, { soloReglas = null } = {}) {
  const limpio = sinComentariosNiReglas(codigo);
  const lineas = limpio.split('\n');
  const problemas = [];
  for (const regla of REGLAS_PULIDO) {
    if (soloReglas && !soloReglas.includes(regla.id)) continue;
    lineas.forEach((linea, i) => {
      if (regla.prohibido.test(linea)) {
        problemas.push({ regla: regla.id, apartado: regla.apartado, linea: i + 1, texto: linea.trim().slice(0, 90) });
      }
    });
  }
  return problemas;
}

/* ── Lo que ya estaba pulido, y no se rehace ───────────────────────────────

   Declarado con lo que de verdad lo resuelve, como `YA_RESUELTO` en la E3 F9.
   El enunciado pide *"pulir lo existente"*: la mitad de sus apartados ya los
   cumplía el proyecto, y rehacerlos sería el rediseño que su primera línea
   prohíbe. */
export const YA_PULIDO = [
  { apartado: 7, que: 'Las cards unificadas', con: 'el componente Card de ui.jsx, usado por todas las vistas' },
  { apartado: 8, que: 'Un solo sistema de iconos', con: 'lucide-react — y los propios del armario en su gramática (E3 F3)' },
  { apartado: 9, que: 'Los botones unificados', con: 'PrimaryButton, GhostBtn, BotonBorrar y BotonBorrarDefinitivo de ui.jsx' },
  { apartado: 10, que: 'El botón ＋', con: 'BotonAnadir de quickAdd.jsx (E3 F9), el mismo en las tres pantallas' },
  { apartado: 11, que: 'El Quick Add rápido', con: 'la Hoja de quickAdd.jsx: una hoja inferior, con Escape para cerrar' },
  { apartado: 12, que: 'Las hojas inferiores', con: 'la misma Hoja — no hay dos formas de abrir una acción rápida' },
  { apartado: 18, que: '"Reducir movimiento"', con: 'el bloque prefers-reduced-motion de index.css: las animaciones lo respetan solas' },
  { apartado: 24, que: 'Los toques de 44 px', con: 'la clase .toque-44 y el revisor de accesibilidad de EH F42' },
  { apartado: 26, que: 'Los vacíos con salida', con: 'EmptyHint y los VACIO_* de cada fase' },
];

/* ── Lo que no se toca en esta fase ────────────────────────────────────────
   *"NO rediseñar módulos que no estén relacionados con este sistema."* */
export const NO_EN_EL_PULIDO = [
  { que: 'Rediseñar módulos fuera de Hoy, Agenda, Calendario, Semana y Estadísticas', porque: 'La primera línea del enunciado lo prohíbe expresamente.' },
  { que: 'Cambiar la lógica de lo que ya funciona', porque: '*"El objetivo es pulir lo existente, no cambiar su lógica."*' },
  { que: 'Añadir confeti al completar una tarea', porque: 'El apartado 16 lo dice con esas palabras: *"no hacer confeti exagerado para cada tarea"*.' },
  { que: 'Guardar la posición del scroll entre pantallas (apartado 22)', porque: 'JosStyle no tiene rutas: cambiar de vista es cambiar un estado, y el navegador mantiene el scroll de la página. Guardar una posición propia sería un segundo mecanismo para algo que ya pasa.' },
];
