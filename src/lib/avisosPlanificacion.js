/* ===========================================================================
   ENTREGA 3 · FASE 11 (HC F6) — NOTIFICACIONES Y RECORDATORIOS REALES
   ===========================================================================

   *"El usuario debe poder configurar «avísame de esto a las 17:00» y recibir una
   notificación real cuando corresponda."*

   🚨 **Y EL ENUNCIADO ABRE CON LA REGLA QUE GOBIERNA TODO:** *"NO crear un
   sistema paralelo de recordatorios. Las notificaciones deben utilizar las
   tareas, eventos y recordatorios existentes."*

   Así que aquí **no nace ninguna entidad**. Un recordatorio es un evento del
   calendario con `tipo: 'recordatorio'` (E3 F8); una tarea es la de
   Productividad. Lo único nuevo son **dos campos** en lo que ya existe —
   `notificar` y `anticipacion`— y **quién decide** cuándo toca avisar.

   ⚠️ **Este archivo DECIDE; `notificaciones.js` MANDA.** Es el mismo reparto que
   `avisosHorario.js` (HT F10) y `avisosEstilo.js` (EH F38), y por el mismo
   motivo: **un segundo emisor sería un segundo horario de silencio**, y el día
   que Josué cambie uno el otro seguiría despertándole. Hay una prueba que lee
   este archivo y falla si aparece `new Notification`.

   ─────────────────────────────────────────────────────────────────────────
   🚨 **LO QUE NO SE PUEDE PROMETER, Y SE DICE** (apartados 23 y 24)
   ─────────────────────────────────────────────────────────────────────────

   *"No prometer funcionalidad que la plataforma no soporte."* Y JosStyle **no
   tiene Service Worker con `push`**, así que:

   - Con la aplicación **abierta**, un aviso sale de verdad: la Notification API
     del navegador, que es lo que ya hace `notificaciones.js`.
   - Con la aplicación **cerrada**, **no sale nada**. Eso no es un fallo que se
     pueda arreglar aquí: hace falta un Service Worker, una tabla de
     suscripciones y una función que las dispare — infraestructura nueva, no una
     ampliación. Y en un iPhone, además, exige que la PWA esté **instalada en la
     pantalla de inicio**.

   Por eso `CAPACIDADES` declara cada cosa con `disponible: true/false` y su
   frase, que es la que se lee en pantalla. **Fingir que un aviso quedó
   programado sería exactamente el control decorativo que prohíbe la regla 8**, y
   el apartado 7 lo dice con sus palabras: *"si no hay permisos, no fingir que se
   programó"*.
   =========================================================================== */

import { todayISO, horaValida, fechaValida } from './helpers';
import { permisoNotificaciones } from './notificaciones';

/* ── La anticipación (apartado 8) ──────────────────────────────────────────
   *"En el momento · 5 min antes · 10 · 15 · 30 · 1 h · 1 día antes."*

   ⚠️ Una lista, no un número libre: son las siete del enunciado y ni una más.
   Y **el valor por defecto es "en el momento"**, que es lo que el usuario
   entiende por *"avísame a las 17:00"*. */
export const ANTICIPACIONES = [
  { id: 'momento', nombre: 'En el momento', minutos: 0 },
  { id: '5min', nombre: '5 minutos antes', minutos: 5 },
  { id: '10min', nombre: '10 minutos antes', minutos: 10 },
  { id: '15min', nombre: '15 minutos antes', minutos: 15 },
  { id: '30min', nombre: '30 minutos antes', minutos: 30 },
  { id: '1h', nombre: '1 hora antes', minutos: 60 },
  { id: '1dia', nombre: '1 día antes', minutos: 1440 },
];

export const anticipacion = (id) => ANTICIPACIONES.find((a) => a.id === id) || ANTICIPACIONES[0];
export const MINUTOS_POR_DEFECTO = 0;

/* ── Qué avisa, y su interruptor (apartado 27) ─────────────────────────────

   *"Eventos · Tareas · Recordatorios · Hábitos · Pomodoro. No crear
   configuraciones innecesariamente complejas."*

   ⚠️ **Cada tipo apunta a la categoría que YA existe** en `notificaciones.js`
   (Fase A4): no se crea un segundo juego de interruptores, se traduce al que
   Josué ya tiene en Ajustes. Un segundo sitio donde apagar lo mismo es cómo se
   acaba con un interruptor apagado y avisos que siguen llegando.

   ⏸ Y el **Pomodoro** se declara con lo que de verdad puede hacer: sus sesiones
   no se programan a una hora (E3 F9), así que lo único posible es avisar **al
   terminar una que está corriendo**, con la aplicación abierta. */
export const TIPOS_AVISO = [
  {
    id: 'evento', nombre: 'Eventos', icono: '📅', categoria: 'objetivos',
    de: 'calendario.eventos', programable: true,
  },
  {
    id: 'tarea', nombre: 'Tareas', icono: '📋', categoria: 'productividad',
    de: 'productividad.tareas', programable: true,
  },
  {
    id: 'recordatorio', nombre: 'Recordatorios', icono: '🔔', categoria: 'sistema',
    de: 'calendario.eventos (tipo: recordatorio)', programable: true,
  },
  {
    id: 'habito', nombre: 'Hábitos', icono: '🔥', categoria: 'productividad',
    de: 'productividad.habitos', programable: true,
    /* ⚠️ Apartado 11 — *"NO duplicar el sistema de hábitos"*. Un hábito no tiene
       hora hoy, así que lo que se puede avisar es que **queda pendiente**, no una
       hora que nadie ha guardado. Ponerle una sería inventarse el dato. */
    sinHora: true,
    porque: 'Un hábito no guarda una hora, así que el aviso es "queda pendiente", no una hora inventada.',
  },
  {
    id: 'pomodoro', nombre: 'Pomodoro', icono: '🍅', categoria: 'productividad',
    de: 'productividad.pomodoros', programable: false,
    porque: 'Las sesiones no se programan a una hora: lo único posible es avisar al terminar una que está corriendo, con la aplicación abierta.',
  },
];

export const tipoAviso = (id) => TIPOS_AVISO.find((t) => t.id === id) || null;
export const tiposProgramables = () => TIPOS_AVISO.filter((t) => t.programable);

/* ── Lo que la plataforma puede y no puede (apartados 23, 24, 25 y 26) ─────

   *"Si una capacidad no puede garantizarse desde Safari/PWA: mostrar una
   explicación clara. No simularla."*

   🚨 Esto es lo más importante de la fase, y por eso está escrito como datos y
   no como un comentario: la pantalla lee estas frases. */
export const CAPACIDADES = [
  {
    id: 'app_abierta', nombre: 'Avisos con la aplicación abierta', disponible: true,
    explica: 'Funcionan: el navegador muestra el aviso aunque la pestaña no esté delante.',
  },
  {
    id: 'app_cerrada', nombre: 'Avisos con la aplicación cerrada', disponible: false,
    explica: 'Todavía no. Para eso hace falta una pieza que JosStyle no tiene aún: algo que siga despierto y mande el aviso cuando la app no está abierta.',
  },
  {
    id: 'iphone_instalada', nombre: 'Avisos en el iPhone', disponible: false,
    explica: 'En el iPhone los avisos solo llegan si añades JosStyle a la pantalla de inicio, y aun así hace falta lo de arriba.',
  },
  {
    id: 'accion_al_tocar', nombre: 'Abrir el elemento al tocar el aviso', disponible: false,
    explica: 'Se abre la aplicación, pero todavía no lleva directamente al elemento: eso depende de lo mismo.',
  },
  {
    id: 'vibracion', nombre: 'Vibración', disponible: false,
    explica: 'La decide el teléfono según sus propios ajustes de notificaciones; desde aquí no se puede cambiar.',
  },
];

export const capacidad = (id) => CAPACIDADES.find((c) => c.id === id) || null;
export const loQueFunciona = () => CAPACIDADES.filter((c) => c.disponible);
export const loQueNo = () => CAPACIDADES.filter((c) => !c.disponible);

/* ── El estado del permiso (apartados 1, 2 y 7) ────────────────────────────

   *"Permitidas · Denegadas · No solicitadas · No disponibles."* Cada una con lo
   que el usuario puede hacer, que es lo que faltaba: un estado sin salida es una
   pantalla rota (la lección de EH F41).

   🚨 Y el apartado 1: *"NO solicitarlo automáticamente nada más abrir la
   aplicación."* Este archivo **no llama a `requestPermission`** — solo dice en
   qué estado está y si toca ofrecerlo; hay una prueba que lo lee. */
export const ESTADOS_PERMISO = {
  granted: {
    id: 'granted', nombre: 'Activadas',
    explica: 'Los avisos llegan mientras la aplicación está abierta.',
    puedeActivar: false,
  },
  denied: {
    id: 'denied', nombre: 'Bloqueadas',
    explica: 'Las bloqueaste en el navegador. Para volver a activarlas hay que cambiarlo en sus ajustes, no desde aquí.',
    puedeActivar: false,
  },
  default: {
    id: 'default', nombre: 'Sin decidir',
    explica: 'Todavía no te lo hemos preguntado.',
    puedeActivar: true,
  },
  'no-soportado': {
    id: 'no-soportado', nombre: 'No disponibles',
    explica: 'Este navegador no sabe mostrar avisos del sistema.',
    puedeActivar: false,
  },
};

export function estadoPermiso() {
  return ESTADOS_PERMISO[permisoNotificaciones()] || ESTADOS_PERMISO['no-soportado'];
}

/** Apartado 1 — *"la primera solicitud debe producirse en un contexto lógico…
 *  usuario crea un recordatorio → ¿quieres recibir una notificación?"*.
 *  Devuelve si TOCA ofrecerlo; pedirlo sigue siendo un toque suyo. */
export function tocaOfrecerPermiso(acabaDeCrearAlgoConAviso) {
  return !!acabaDeCrearAlgoConAviso && estadoPermiso().puedeActivar;
}

/* ── Los dos campos nuevos, y solo dos (apartado 5) ────────────────────────

   Un recordatorio ya tenía título, fecha, hora, nota (`notas`), repetición
   (`recurrencia`) y estado (`estado`) por ser un evento. Le faltaban
   **`notificar`** y **`anticipacion`**, y son los que se añaden — a los eventos
   y a las tareas por igual, que es lo que piden los apartados 9 y 10.

   ⚠️ **`notificar` nace en `false`.** Todo aviso nace apagado (EH F38), y aquí
   además lo pide el apartado 7 al revés de como parece: *"notificación ON si el
   usuario ha concedido permisos"* — sin permiso, encenderlo sería prometer algo
   que no va a pasar. `avisoPorDefecto()` lo resuelve mirando el permiso real. */
export const CAMPOS_DE_AVISO = ['notificar', 'anticipacion'];

export const avisoPorDefecto = () => estadoPermiso().id === 'granted';

/** Apartado 20 — *"si el usuario desactiva una notificación, no eliminar el
 *  evento/tarea. Simplemente `notification_enabled = false`."* Y el 21, al
 *  revés. Devuelve el elemento; quien guarda es `App.jsx`. */
export function alternarAviso(elemento) {
  if (!elemento) return null;
  return { ...elemento, notificar: !elemento.notificar };
}

export function ponerAnticipacion(elemento, anticipacionId) {
  if (!elemento || !ANTICIPACIONES.some((a) => a.id === anticipacionId)) return null;
  return { ...elemento, anticipacion: anticipacionId };
}

/* ── A qué minuto toca avisar ──────────────────────────────────────────────
   La hora del elemento menos su anticipación. `null` si no tiene hora: no se
   inventa una (apartado 8: *"no obligar a configurar anticipación si no tiene
   sentido para el elemento"*). */
export function minutoDelAviso(elemento) {
  const hora = elemento?.horaInicio || elemento?.hora || '';
  if (!horaValida(hora)) return null;
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m - anticipacion(elemento.anticipacion).minutos;
}

/* ── Qué toca avisar AHORA (apartados 9, 10, 13, 17 y 22) ──────────────────

   🚨 **Apartado 22 — nada de avisos atrasados.** *"El dispositivo estuvo
   offline… el usuario vuelve a abrir la aplicación a las 18:00. NO mostrar
   «evento de hace 3 horas»."* Por eso hay una ventana: un aviso solo vale
   dentro de los minutos siguientes a su momento, y pasada esa ventana **no se
   da**. Es la diferencia entre avisar y dar la lata.

   ⚠️ Y esto **devuelve una lista**, no manda nada. Mandar es de
   `notificaciones.js`, que además comprueba el permiso, el interruptor global,
   la categoría y el horario de silencio (apartado 28: **el de la Fase A4**, no
   uno nuevo). */
export const VENTANA_AVISO_MIN = 10;

export function avisosPendientes(estado, { hoy = todayISO(), ahora = null } = {}) {
  const minutosAhora = minutosDe(ahora);
  if (minutosAhora === null) return [];

  const salida = [];
  const mirar = (elemento, tipoId, titulo) => {
    // Apartado 20 — sin `notificar` no hay aviso, y el elemento sigue existiendo.
    if (!elemento?.notificar) return;
    if (elemento.fecha !== hoy) return;
    const minuto = minutoDelAviso(elemento);
    if (minuto === null) return;
    // 🚨 Apartado 22 — la ventana. Ni antes, ni tres horas después.
    if (minutosAhora < minuto || minutosAhora > minuto + VENTANA_AVISO_MIN) return;
    salida.push({
      id: `${tipoId}:${elemento.id}`,
      elementoId: elemento.id,
      tipo: tipoId,
      categoria: tipoAviso(tipoId).categoria,
      titulo,
      cuerpo: cuerpoDelAviso(elemento, tipoId),
      minuto,
    });
  };

  (estado?.calendario?.eventos || []).forEach((ev) => {
    const tipoId = ev.tipo === 'recordatorio' ? 'recordatorio' : 'evento';
    mirar(ev, tipoId, ev.titulo || 'Sin título');
  });
  (estado?.productividad?.tareas || []).forEach((t) => mirar(t, 'tarea', t.texto || 'Tarea'));

  return salida.sort((a, b) => a.minuto - b.minuto);
}

/* El texto del apartado 9: *"Entrenamiento empieza en 15 minutos."* ⚠️ Y con
   "en el momento" no se dice *"en 0 minutos"*, que no es español. */
export function cuerpoDelAviso(elemento, tipoId) {
  const mins = anticipacion(elemento?.anticipacion).minutos;
  const hora = elemento?.horaInicio || elemento?.hora || '';
  if (mins === 0) return tipoId === 'tarea' ? `Te toca a las ${hora}.` : `Empieza ahora (${hora}).`;
  if (mins === 1440) return `Es mañana a las ${hora}.`;
  if (mins >= 60) return `${tipoId === 'tarea' ? 'Te toca' : 'Empieza'} en ${mins / 60} h (${hora}).`;
  return `${tipoId === 'tarea' ? 'Te toca' : 'Empieza'} en ${mins} minutos (${hora}).`;
}

/* ⚠️ `minutosDe` acepta texto o `Date`, nunca un número: un número caería al
   reloj de verdad y una prueba dejaría de ser determinista (la lección de la
   E3 F7). */
function minutosDe(ahora) {
  if (typeof ahora === 'string') {
    if (!horaValida(ahora)) return null;
    const [h, m] = ahora.split(':').map(Number);
    return h * 60 + m;
  }
  const d = ahora instanceof Date ? ahora : new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/* ── Editar, eliminar y desactivar (apartados 18, 19 y 21) ─────────────────

   *"Si se cambia 17:00 → 18:00, la notificación correspondiente debe
   actualizarse. No dejar programada la antigua."*

   🚨 **Y eso sale gratis, por la misma razón que todo en esta entrega: no hay
   nada programado que cancelar.** `avisosPendientes` se calcula en el momento a
   partir del elemento, así que cambiar su hora cambia el aviso, borrarlo lo
   quita y saltar una instancia se la salta. Un sistema que guardara avisos
   programados tendría que cancelarlos uno a uno — y se olvidaría uno. */
export const POR_QUE_NO_HAY_QUE_CANCELAR = {
  apartados: [18, 19, 21],
  porque: 'No hay avisos guardados que cancelar: se calculan en el momento desde el propio elemento, así que cambiar su hora, borrarlo o desactivarlo cambia el aviso solo.',
  loQueSeria: 'Un sistema que guardara avisos programados tendría que cancelarlos uno a uno, y acabaría dejando alguno vivo.',
};

/* ── Lo que ya estaba, y no se rehace ──────────────────────────────────────
   Declarado con la función real, como `YA_RESUELTO` en la E3 F9. */
export const YA_RESUELTO_AVISOS = [
  { apartado: 2, que: 'El estado del permiso', con: 'permisoNotificaciones() — Fase A4' },
  { apartado: 4, que: 'El interruptor general y el sonido', con: 'DEFAULT_NOTIFICACIONES.activadas y el motor de audio de SO F1' },
  { apartado: 16, que: 'Los recordatorios recurrentes', con: 'expandirRecurrentes — el motor del Calendario Universal (E3 F10)' },
  { apartado: 17, que: 'Completar una instancia no borra las futuras', con: 'marcarInstancia de la E3 F10: hechas es una lista de fechas dentro de la regla' },
  { apartado: 27, que: 'Los interruptores por tipo', con: 'notificaciones.categorias — cada tipo apunta a la suya, no se crea un segundo juego' },
  { apartado: 28, que: 'El horario de silencio', con: 'horarioDescansoActivo/Inicio/Fin de la Fase A4 — nunca un segundo horario' },
  { apartado: 30, que: 'El sonido', con: 'audioEngine.js — el único que reproduce (SO F1)' },
  { apartado: 34, que: 'El recordatorio en el Calendario', con: 'indicadoresDelDia de la E3 F8: es un evento, ya sale' },
];

/* ── Lo que esta fase NO hace (apartados 29, 35 y el 23) ───────────────────
   Escrito para que una fase futura no lo dé por pendiente sin querer. */
export const NO_EN_ESTA_FASE_AVISOS = [
  { que: 'Web Push con la aplicación cerrada', porque: 'Hace falta un service worker con `push`, una tabla de suscripciones y una función que las dispare: es una pieza nueva del sistema, no una ampliación.' },
  { que: 'Categorías de prioridad', porque: 'El apartado 29 dice expresamente "no crear todavía categorías complejas de prioridad".' },
  { que: 'Estadísticas de notificaciones', porque: 'El apartado 35 las excluye: son de la HC F8.' },
  { que: 'Un router con rutas propias', porque: 'El apartado 15 pide adaptarlo al router existente, y JosStyle navega con `setTab` y `navegarDesdeHoy` (EH F28), no con URLs.' },
];
