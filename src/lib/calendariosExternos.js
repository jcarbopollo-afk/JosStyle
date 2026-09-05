/* ===========================================================================
   ENTREGA 3 · FASE 12 (HC F7) — CALENDARIOS EXTERNOS
   ===========================================================================

   *"Permitir conectar Apple Calendar / iCloud, Google Calendar y Outlook."* Y la
   regla que abre el enunciado: *"las integraciones externas NO deben sustituir al
   calendario interno. JosStyle debe seguir funcionando aunque el usuario no
   conecte ningún servicio externo."*

   ─────────────────────────────────────────────────────────────────────────
   ⏸ **LO QUE NO SE PUEDE CONSTRUIR HOY, Y POR QUÉ** (regla 49)
   ─────────────────────────────────────────────────────────────────────────

   **Google y Outlook necesitan OAuth, y OAuth necesita dos cosas que solo puede
   dar Josué:**

   1. **Registrar la aplicación** en Google Cloud Console y en el portal de
      Microsoft, que devuelve un identificador de cliente y un secreto. Nadie
      más puede hacerlo: van atados a su cuenta.
   2. **Un sitio seguro donde guardar los tokens.** El apartado 26 es tajante:
      *"nunca almacenar en localStorage, código frontend o variables accesibles
      públicamente"*. Hoy JosStyle tiene **una** función serverless
      (`api/ask-ai.js`) y ninguna tabla para esto.

   🚨 **Así que el botón «Conectar Google Calendar» NO se construye.** Un botón
   que no puede conectar nada es exactamente el control decorativo que prohíbe la
   regla 8, y fingir una conexión sería peor: haría creer a Josué que sus
   exámenes están sincronizados cuando no lo están.

   Lo que sí queda hecho es **todo lo demás**, que es la mayor parte de la fase:

   - 🍎 **El camino de Apple, ENTERO Y FUNCIONANDO.** El apartado 4 lo dice con
     sus palabras: *"si el acceso directo completo a iCloud no es viable…
     implementar la alternativa oficialmente soportada más segura. Por ejemplo:
     importación mediante archivo `.ics`"*. Eso **no necesita credenciales de
     nadie**, funciona con iCloud, con Google y con Outlook por igual, y está
     construido aquí: se lee el archivo, se convierten sus eventos y entran en el
     Calendario de siempre.
   - **La arquitectura de un evento externo** (apartados 13, 22, 23 y 32):
     `origen`, `idExterno`, `calendarioExterno`, `cuentaExterna`. Sin ella, la
     conexión del día que exista tendría que reescribir el calendario entero.
   - **Que no se dupliquen** (13, 21 y 32): *"solo vincularlos mediante
     identificadores reales"*, nunca por el título.
   - **La desconexión sin pérdida** (25): *"no borrar automáticamente los eventos
     internos"*.
   - **La última sincronización** (31) y **los estados de error** (28, 29).

   Y `LO_QUE_NECESITA_JOSUE` dice, con nombre y apellidos, qué hace falta para
   encender Google y Outlook. No es una tarea pendiente mía: es una decisión suya.
   =========================================================================== */

import { uid, fechaValida, horaValida } from './helpers';

/* ── Los proveedores, y en qué estado está cada uno (apartados 1 y 4) ──────

   ⚠️ Cada línea dice **qué se puede hacer hoy de verdad**. `conexionDirecta`
   es lo que necesita OAuth; `porArchivo` es lo que funciona ya. */
export const PROVEEDORES = [
  {
    id: 'apple', nombre: 'Apple Calendar / iCloud', icono: '🍎',
    conexionDirecta: false,
    porArchivo: true,
    comoVa: 'Exporta el calendario desde tu iPhone o desde iCloud y añade aquí el archivo.',
    porque: 'Apple no ofrece una forma de conectarse a iCloud desde una aplicación web como ésta. El propio enunciado pide usar la alternativa oficial, que es el archivo.',
  },
  {
    id: 'google', nombre: 'Google Calendar', icono: '🟦',
    conexionDirecta: false,
    porArchivo: true,
    comoVa: 'Por ahora, exportando el calendario desde Google y añadiendo aquí el archivo.',
    porque: 'Conectarse directamente exige registrar JosStyle en Google y un sitio seguro donde guardar el acceso. Las dos cosas las tiene que dar Josué.',
  },
  {
    id: 'outlook', nombre: 'Outlook', icono: '🟦',
    conexionDirecta: false,
    porArchivo: true,
    comoVa: 'Por ahora, exportando el calendario desde Outlook y añadiendo aquí el archivo.',
    porque: 'Igual que Google: hay que registrar JosStyle en Microsoft y tener dónde guardar el acceso de forma segura.',
  },
];

export const proveedor = (id) => PROVEEDORES.find((p) => p.id === id) || null;
export const ORIGEN_INTERNO = 'josstyle';

/* ── Qué hace falta para encender Google y Outlook (regla 49) ──────────────

   🚨 Esto **no es una lista de tareas mías**: son decisiones y credenciales de
   Josué, y hasta que existan no hay nada que programar. Se declara aquí para
   que ninguna fase futura lo dé por hecho ni lo "resuelva" inventándoselo. */
export const LO_QUE_NECESITA_JOSUE = [
  {
    id: 'registro_google',
    que: 'Registrar JosStyle en Google Cloud Console',
    decide: 'Josué',
    porque: 'El identificador de cliente va atado a su cuenta; nadie más puede crearlo.',
    permisos: 'Solo el calendario. Nunca Gmail, Drive ni Contactos (apartado 5).',
  },
  {
    id: 'registro_microsoft',
    que: 'Registrar JosStyle en el portal de Microsoft',
    decide: 'Josué',
    porque: 'Lo mismo que Google: la aplicación se registra con su cuenta.',
    permisos: 'Solo el calendario (apartado 5).',
  },
  {
    id: 'guardado_seguro',
    que: 'Un sitio seguro donde guardar el acceso a esas cuentas',
    decide: 'Josué',
    porque: 'El apartado 26 prohíbe guardarlo en el navegador o en el código. Hoy JosStyle tiene una sola función de servidor y ninguna tabla para esto.',
    permisos: null,
  },
];

/* ── Un evento externo: los cuatro campos (apartados 13, 22 y 23) ──────────

   *"Guardar conceptualmente: source = internal / google / outlook / apple"*, y
   *"guardar referencias externas: external_event_id, external_calendar_id,
   external_account_id. **Nunca utilizar el título como identificador**."*

   ⚠️ Son campos **del evento del calendario que ya existe**, no de una tabla
   nueva: un evento externo se ve en Hoy, en la Agenda y en el Calendario
   (apartados 10, 11 y 12) **porque es un evento**, no porque nadie lo copie. */
export const CAMPOS_EXTERNOS = ['origen', 'idExterno', 'calendarioExterno', 'cuentaExterna'];

export const esExterno = (ev) => !!(ev && ev.origen && ev.origen !== ORIGEN_INTERNO);

/** La etiqueta del apartado 9: *"evento interno ⚡ JosStyle · evento externo
 *  🔗 Google Calendar"*. ⚠️ Se distingue, **sin una interfaz distinta**. */
export function etiquetaDeOrigen(ev) {
  if (!esExterno(ev)) return { icono: '⚡', nombre: 'JosStyle', externo: false };
  const p = proveedor(ev.origen);
  return {
    icono: '🔗',
    nombre: p ? p.nombre : 'Calendario externo',
    externo: true,
    // Apartado 8 — *"Google Calendar · Estudios"*: también el calendario concreto.
    calendario: ev.calendarioExterno || null,
  };
}

/* ── No duplicar (apartados 13, 21 y 32) ───────────────────────────────────

   🚨 *"Si un evento externo y uno interno tienen el mismo título/hora: **NO
   asumir automáticamente que son el mismo evento**. Solo vincularlos mediante
   identificadores reales."*

   Por eso esto compara `idExterno` **y nada más**. Dos eventos que se llaman
   igual a la misma hora pueden ser dos cosas distintas —una clase y el recordatorio
   de esa clase—, y unirlos haría desaparecer uno de los dos. */
export function yaImportado(eventos, idExterno, cuentaExterna = null) {
  if (!idExterno) return false;
  return (eventos || []).some((e) => e.idExterno === idExterno
    && (!cuentaExterna || e.cuentaExterna === cuentaExterna));
}

/* ── Leer un archivo .ics (apartado 4) ─────────────────────────────────────

   🍎 **Éste es el camino que el enunciado pide para Apple**, y funciona igual
   con Google y con Outlook: los tres exportan `.ics`, que es el formato estándar
   del calendario (RFC 5545).

   ⚠️ **Se lee lo que hace falta y nada más.** Un `.ics` puede traer zonas
   horarias, alarmas, adjuntos y participantes; aquí se toman título, fecha,
   hora, descripción, lugar y su identificador. Lo demás se ignora a propósito:
   guardar campos que ninguna pantalla lee sería el campo muerto de la E3 F3. */

/** Deshace el plegado de líneas del formato: una línea larga continúa en la
 *  siguiente empezando por un espacio. Sin esto, un título largo se parte. */
function desplegar(texto) {
  return String(texto || '').replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
}

/* Los caracteres escapados del formato: `\,` `\;` `\n` `\\`. */
function desescapar(v) {
  return String(v || '')
    .replace(/\\n/gi, ' ')
    .replace(/\\([,;\\])/g, '$1')
    .trim();
}

/** `20260903` o `20260903T170000Z` → `{ fecha, hora }`, **en local**.
 *  🐛 Y aquí el UTC importa de verdad: una hora en Z hay que pasarla a la del
 *  usuario, o un evento de las 23:30 sale el día siguiente (apartado 24 y la
 *  séptima vez de esta lección en el proyecto). */
export function fechaHoraDeICS(valor) {
  const v = String(valor || '').trim();
  const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, a, mes, d, h, min, , z] = m;
  if (h === undefined) return { fecha: `${a}-${mes}-${d}`, hora: '', todoElDia: true };
  if (z) {
    // Viene en UTC: se convierte al reloj del usuario.
    const utc = new Date(Date.UTC(+a, +mes - 1, +d, +h, +min));
    const p = (x) => String(x).padStart(2, '0');
    return {
      fecha: `${utc.getFullYear()}-${p(utc.getMonth() + 1)}-${p(utc.getDate())}`,
      hora: `${p(utc.getHours())}:${p(utc.getMinutes())}`,
      todoElDia: false,
    };
  }
  return { fecha: `${a}-${mes}-${d}`, hora: `${h}:${min}`, todoElDia: false };
}

/** Convierte el contenido de un `.ics` en eventos de JosStyle.
 *  ⚠️ Devuelve **eventos ya con la forma de siempre**: quien los guarda es
 *  `App.jsx`, y entran en `calendario.eventos` como cualquier otro. */
export function leerICS(contenido, { origen = 'apple', calendario = null, cuenta = null } = {}) {
  const texto = desplegar(contenido);
  if (!/BEGIN:VCALENDAR/i.test(texto)) {
    return { eventos: [], error: 'Ese archivo no es un calendario.' };
  }

  const eventos = [];
  const bloques = texto.split(/BEGIN:VEVENT/i).slice(1);
  for (const bloque of bloques) {
    const cuerpo = bloque.split(/END:VEVENT/i)[0];
    const campo = (nombre) => {
      const m = cuerpo.match(new RegExp(`^${nombre}(?:;[^:\\n]*)?:(.*)$`, 'im'));
      return m ? desescapar(m[1]) : '';
    };
    const inicio = fechaHoraDeICS(campo('DTSTART'));
    if (!inicio || !fechaValida(inicio.fecha)) continue;
    const fin = fechaHoraDeICS(campo('DTEND'));
    const titulo = campo('SUMMARY');
    if (!titulo) continue;

    eventos.push({
      id: uid(),
      titulo,
      tipo: 'personal',
      fecha: inicio.fecha,
      todoElDia: inicio.todoElDia,
      horaInicio: inicio.todoElDia ? '' : inicio.hora,
      // ⚠️ La hora de fin solo si es del mismo día: un evento de varios días no
      // se puede pintar hoy, y fingir que acaba a medianoche sería inventarlo.
      horaFin: !inicio.todoElDia && fin && fin.fecha === inicio.fecha && horaValida(fin.hora) ? fin.hora : '',
      ubicacion: campo('LOCATION'),
      notas: campo('DESCRIPTION'),
      recurrencia: null,
      estado: 'activo',
      /* 🚨 Los cuatro campos del apartado 23. `UID` es el identificador de
         verdad del formato: **nunca el título** (apartado 32). */
      origen,
      idExterno: campo('UID') || null,
      calendarioExterno: calendario,
      cuentaExterna: cuenta,
      // Un evento importado no se edita aquí: se cambia en su calendario.
      soloLectura: true,
      notificar: false,
      anticipacion: 'momento',
    });
  }

  if (eventos.length === 0) return { eventos: [], error: 'Ese calendario no tiene ningún evento que se pueda leer.' };
  return { eventos, error: null };
}

/** Apartados 13 y 21 — *"si el evento ya está sincronizado, mostrar
 *  «Sincronizado». No volver a crear otro."* Devuelve qué entra y qué se salta,
 *  para poder decírselo. */
export function planDeImportacion(eventosActuales, nuevos) {
  const nuevosLimpios = [];
  let repetidos = 0;
  for (const ev of nuevos) {
    if (ev.idExterno && (yaImportado(eventosActuales, ev.idExterno, ev.cuentaExterna)
      || nuevosLimpios.some((x) => x.idExterno === ev.idExterno))) {
      repetidos += 1;
      continue;
    }
    nuevosLimpios.push(ev);
  }
  return { entran: nuevosLimpios, repetidos, total: nuevos.length };
}

/* ── Desconectar sin perder nada (apartado 25) ─────────────────────────────

   *"Al desconectar: NO borrar automáticamente los eventos internos. Los eventos
   externos pueden dejar de mostrarse. Preguntar si se desea conservar una copia
   importada cuando corresponda."*

   ⚠️ Devuelve un **plan**, no un borrado, y **sin `confirmado` no hace nada**
   (el `aplicarPlan` de siempre). Y enumera lo que se va y lo que se queda, como
   `impactoDeEliminar` en EH F39. */
export function planDeDesconexion(eventos, origenId, { confirmado = false, conservar = true } = {}) {
  const externos = (eventos || []).filter((e) => e.origen === origenId);
  const internos = (eventos || []).filter((e) => e.origen !== origenId);
  const plan = {
    seVan: conservar ? 0 : externos.length,
    seQuedan: conservar ? eventos.length : internos.length,
    internosIntactos: internos.length,
    explica: conservar
      ? 'Los eventos que ya se importaron se quedan como están, y dejarán de actualizarse.'
      : 'Los eventos que vinieron de ese calendario se quitan. Lo que creaste en JosStyle no se toca.',
  };
  // 🚨 Sin confirmar no se escribe nada.
  if (!confirmado) return { ...plan, eventos: null };
  return { ...plan, eventos: conservar ? eventos : internos };
}

/* ── El estado de una conexión (apartados 28, 29, 30 y 31) ─────────────────

   *"Sincronizado hace 5 min"*, *"la conexión ha caducado"*, *"no se ha podido
   sincronizar"*. Cada uno con lo que Josué puede hacer, que es lo que
   distingue un aviso de un callejón sin salida (EH F41).

   ⚠️ Y los tres dicen lo mismo al final: **los eventos internos siguen
   funcionando**. El enunciado lo repite en los apartados 29 y 30. */
export const ESTADOS_CONEXION = {
  sin_conectar: { id: 'sin_conectar', nombre: 'Sin conectar', puedeReintentar: false, internosOk: true },
  al_dia: { id: 'al_dia', nombre: 'Al día', puedeReintentar: false, internosOk: true },
  caducada: {
    id: 'caducada', nombre: 'La conexión ha caducado', puedeReintentar: true, internosOk: true,
    explica: 'Vuelve a conectarla cuando quieras. Mientras tanto, tus eventos de JosStyle siguen igual.',
  },
  error: {
    id: 'error', nombre: 'No se ha podido sincronizar', puedeReintentar: true, internosOk: true,
    explica: 'Puedes volver a intentarlo. Tus eventos de JosStyle siguen igual.',
  },
  sin_conexion: {
    id: 'sin_conexion', nombre: 'Sin conexión', puedeReintentar: true, internosOk: true,
    explica: 'Se ve lo último que se importó. Tus eventos de JosStyle siguen igual.',
  },
};

/** Apartado 31 — *"sincronizado hace 5 min"*. ⚠️ `null` si nunca se ha
 *  importado nada: inventarse una fecha daría una confianza falsa. */
export function ultimaSincronizacion(iso, ahora = new Date()) {
  if (!iso) return null;
  const cuando = new Date(iso);
  if (Number.isNaN(cuando.getTime())) return null;
  const minutos = Math.floor((ahora - cuando) / 60000);
  if (minutos < 1) return 'Sincronizado hace un momento';
  if (minutos < 60) return `Sincronizado hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Sincronizado hace ${horas} h`;
  const p = (x) => String(x).padStart(2, '0');
  return `Última sincronización: ${p(cuando.getDate())}/${p(cuando.getMonth() + 1)}`;
}

/* ── Lo que esta fase NO hace, y por qué ───────────────────────────────────
   Declarado para que una fase futura no lo dé por pendiente ni lo invente. */
export const NO_EN_ESTA_FASE_EXTERNOS = [
  { que: 'Conectar Google y Outlook con su cuenta', porque: 'Necesita que Josué registre JosStyle en Google y en Microsoft, y un sitio seguro donde guardar el acceso. Está en LO_QUE_NECESITA_JOSUE.' },
  { que: 'Enviar eventos de JosStyle a un calendario externo (apartados 19 y 20)', porque: 'Es la otra mitad de la conexión: sin ella no hay a dónde enviarlos.' },
  { que: 'Sincronización automática (apartado 16)', porque: 'Sincronizar automáticamente exige la conexión; con un archivo, quien decide cuándo actualizar es él.' },
  { que: 'Importar recurrencias externas (apartado 33)', porque: 'El apartado dice "cuando la API lo permita". De un archivo se leen los eventos; la regla de repetición se dejará al conectar la cuenta, para no convertirla en cientos de eventos sueltos.' },
];
