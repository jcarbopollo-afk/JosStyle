/* ===========================================================================
   ENTREGA 3 · FASE 10 (HC F5) — PLANIFICACIÓN AVANZADA Y VISTA SEMANAL
   ===========================================================================

   *"Permitir que el usuario pueda pasar de Hoy → Día → Semana → Mes
   manteniendo siempre los mismos datos."* Y la capa nueva contesta una pregunta
   que ninguna de las otras contestaba: **"¿cómo tengo organizada mi semana?"**

   🚨 **Y EL MOTOR DE RECURRENCIAS YA EXISTE.** El apartado 14 pide *"no duplicar
   manualmente toda la serie"* y el 9 *"implementar recurrencias básicas"* — pero
   `expandirRecurrentes` (Calendario Universal F3) ya hace las cinco cosas:
   expande sin materializar (regla 11), acepta un intervalo (*"cada 2 semanas"*),
   guarda las **excepciones** de los días saltados, guarda los **cambios** de un
   día suelto y respeta `hasta`. Escribir un segundo motor habría sido la
   duplicación que el propio enunciado prohíbe.

   Lo que **faltaba** es que las TAREAS pudieran repetirse: el apartado 10 lo pide
   —*"☐ Leer, repetir cada día"*— y `productividad.tareas` no tenía `recurrencia`.
   Aquí se le añade **pasándolas por el motor que ya existe**, no por uno nuevo.

   🚨 **UNA TAREA RECURRENTE NO SON TRES TAREAS** (apartados 23 y 24): se guarda
   **la regla**, y las apariciones se calculan. Completar el martes marca **ese
   día**, no la serie: por eso `hechas` es una lista de fechas dentro de la regla,
   y no una tarea por día.

   ⚠️ **Y LAS RACHAS SIGUEN SIENDO DE HÁBITOS** (apartado 25): *"no duplicar el
   sistema de rachas. Hábitos debe seguir siendo la fuente de verdad."* Este
   archivo no toca `rachas` ni `rachasServicio`, y hay una prueba que lee el
   código para comprobarlo.
   =========================================================================== */

import { todayISO, addDays, fechaLocalISO, horaValida, fechaValida } from './helpers';
import { expandirRecurrentes, eventosDelDia } from './calendario';
import { tareasDelDia, cargaDelDia } from './calendarioMes';

/* ── La semana (apartados 2, 5 y 6) ────────────────────────────────────────

   ⚠️ **La semana empieza el LUNES**, como la de la hucha (E3 F4) y como las
   columnas `L M X J V S D` del apartado 2. Y se calcula **en local**: un
   `toISOString()` sobre una medianoche local retrocede un día en España y
   devolvería la semana equivocada la mitad de los domingos (séptima vez). */
export function inicioDeSemana(fechaISO) {
  const [a, m, d] = fechaISO.split('-').map(Number);
  const f = new Date(a, m - 1, d);
  // getDay(): domingo = 0. Lunes = 0 en el índice del proyecto.
  const desdeLunes = (f.getDay() + 6) % 7;
  f.setDate(f.getDate() - desdeLunes);
  return fechaLocalISO(f);
}

export const finDeSemana = (fechaISO) => addDays(inicioDeSemana(fechaISO), 6);
export const semanaAnterior = (fechaISO) => addDays(inicioDeSemana(fechaISO), -7);
export const semanaSiguiente = (fechaISO) => addDays(inicioDeSemana(fechaISO), 7);
export const esSemanaActual = (fechaISO, hoy = todayISO()) => inicioDeSemana(fechaISO) === inicioDeSemana(hoy);

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** La cabecera del apartado 2: *"24 — 30 AGOSTO"*, y con los dos meses cuando la
 *  semana los cruza — decir solo uno sería mentir la mitad de las veces. */
export function tituloSemana(fechaISO) {
  const desde = inicioDeSemana(fechaISO);
  const hasta = finDeSemana(fechaISO);
  const [, m1, d1] = desde.split('-').map(Number);
  const [a2, m2, d2] = hasta.split('-').map(Number);
  if (m1 === m2) return `${d1} — ${d2} ${MESES[m2 - 1]}`;
  return `${d1} ${MESES[m1 - 1]} — ${d2} ${MESES[m2 - 1]} ${a2}`;
}

/* ── Las tareas que se repiten (apartados 9, 10, 23 y 24) ──────────────────

   ⚠️ **Las opciones son las del catálogo que ya existe**, `FRECUENCIAS_RECURRENCIA`
   de `tokens.js`: los eventos y las tareas se repiten igual, y dos listas de
   frecuencias acabarían diciendo cosas distintas.

   🚨 **`hechas` es una lista de FECHAS dentro de la regla.** *"Completar una
   instancia no debe marcar automáticamente todas las demás. La regla
   permanece."* (apartado 24). Con una tarea por día habría que sincronizar N
   copias; con una lista de fechas no hay nada que sincronizar. */

/** ¿Esta tarea se repite? Una tarea normal no tiene `recurrencia`. */
export const seRepite = (tarea) => !!(tarea && tarea.recurrencia && tarea.recurrencia.frecuencia);

/** El id de una aparición concreta. ⚠️ Lleva la fecha dentro **a propósito**:
 *  es lo que permite que la pantalla distinga el martes del miércoles sin que
 *  exista una tarea por día. */
export const idInstancia = (tarea, fechaISO) => (seRepite(tarea) ? `${tarea.id}@${fechaISO}` : tarea.id);

/** ¿Está hecha la aparición de ESE día? */
export function instanciaHecha(tarea, fechaISO) {
  if (!seRepite(tarea)) return !!tarea?.hecha;
  const hechas = Array.isArray(tarea.recurrencia.hechas) ? tarea.recurrencia.hechas : [];
  return hechas.includes(fechaISO);
}

/** Marcar o desmarcar **un día**, dejando la regla intacta (apartado 24).
 *  Devuelve la tarea; quien guarda sigue siendo `App.jsx`. */
export function marcarInstancia(tarea, fechaISO) {
  if (!tarea || !fechaValida(fechaISO)) return null;
  if (!seRepite(tarea)) return { ...tarea, hecha: !tarea.hecha };
  const hechas = Array.isArray(tarea.recurrencia.hechas) ? tarea.recurrencia.hechas : [];
  const siguiente = hechas.includes(fechaISO)
    ? hechas.filter((f) => f !== fechaISO)
    : [...hechas, fechaISO].sort();
  return { ...tarea, recurrencia: { ...tarea.recurrencia, hechas: siguiente } };
}

/* ── Este día o toda la serie (apartados 12, 13 y 14) ──────────────────────

   *"¿Qué quieres modificar? Solo este día · Toda la serie. Esto es importante
   para evitar modificar accidentalmente todas las repeticiones."*

   ⚠️ Es el mismo reparto que `ALCANCES` en HT F3, y **tampoco tiene valor por
   defecto**: elegir por él se cargaría todos los lunes del curso sin avisar. */
export const ALCANCES_SERIE = [
  { id: 'dia', nombre: 'Solo este día', explica: 'El resto de las repeticiones se quedan como están.' },
  { id: 'serie', nombre: 'Toda la serie', explica: 'Cambia todas las repeticiones, pasadas y futuras.' },
];

export const alcanceSerie = (id) => ALCANCES_SERIE.find((a) => a.id === id) || null;

/** Quitar UNA aparición sin romper la serie (apartado 13). Es la `excepciones`
 *  que `expandirRecurrentes` ya entiende desde el Calendario Universal: aquí no
 *  se inventa nada, se usa. */
export function saltarInstanciaTarea(tarea, fechaISO) {
  if (!seRepite(tarea) || !fechaValida(fechaISO)) return null;
  const previas = Array.isArray(tarea.recurrencia.excepciones) ? tarea.recurrencia.excepciones : [];
  if (previas.includes(fechaISO)) return tarea;
  return { ...tarea, recurrencia: { ...tarea.recurrencia, excepciones: [...previas, fechaISO].sort() } };
}

/* ── Las tareas de un día, con sus repeticiones (apartados 10 y 23) ────────

   🚨 *"No crear tres instancias independientes."* Una tarea recurrente sale en
   Hoy, en la Agenda y en el Calendario **porque las tres preguntan por su día**,
   no porque exista tres veces.

   ⚠️ Y pasa por `expandirRecurrentes`, el motor del Calendario: una tarea con
   `{ fecha, recurrencia }` tiene exactamente la forma que ese motor espera. */
export function tareasConRepeticion(productividad, fechaISO) {
  const todas = (productividad?.tareas || []).filter(Boolean);
  const sueltas = todas.filter((t) => !seRepite(t));
  const series = todas.filter(seRepite);

  const apariciones = expandirRecurrentes(series, fechaISO, fechaISO).map((ap) => {
    // `expandirRecurrentes` devuelve la ocurrencia con su `fecha`; el original
    // es quien guarda `hechas`, así que se busca por su id.
    const original = series.find((t) => t.id === (ap.eventoOrigenId || ap.id)) || ap;
    return {
      ...original,
      fecha: fechaISO,
      id: idInstancia(original, fechaISO),
      tareaId: original.id,
      esInstancia: true,
      hecha: instanciaHecha(original, fechaISO),
    };
  });

  return [
    ...sueltas.filter((t) => t.fecha === fechaISO).map((t) => ({ ...t, tareaId: t.id, esInstancia: false })),
    ...apariciones,
  ];
}

/* ── El orden dentro de un día (apartado 17) ───────────────────────────────

   *"1. Eventos · 2. Elementos con hora · 3. Tareas prioritarias · 4. Tareas
   normales · 5. Elementos sin hora. Mantener consistencia con Agenda."*

   ⚠️ Es una lista, no un `switch`: si una fase futura añade un tipo, añade su
   línea. Y **coincide con la Agenda** (E3 F7) a propósito — dos órdenes
   distintos para lo mismo es cómo se pierde la consistencia que pide el
   apartado. */
export const ORDEN_PRIORIDAD = [
  { id: 'evento', peso: 1, que: 'Eventos' },
  { id: 'con_hora', peso: 2, que: 'Elementos con hora' },
  { id: 'tarea_prioritaria', peso: 3, que: 'Tareas prioritarias' },
  { id: 'tarea', peso: 4, que: 'Tareas normales' },
  { id: 'sin_hora', peso: 5, que: 'Elementos sin hora' },
];

export function pesoDe(elemento) {
  if (elemento?.tipoElemento === 'evento') return horaValida(elemento.horaInicio) ? 1 : 5;
  if (horaValida(elemento?.hora)) return 2;
  if (elemento?.prioridad === 'alta') return 3;
  return elemento?.esTarea === false ? 5 : 4;
}

/* ── Un día de la semana (apartados 2, 15 y 16) ────────────────────────────

   ⚠️ **La carga es la de la E3 F8** (`cargaDelDia`): *"no crear una puntuación
   artificial"*, dice el apartado 15, y ya existían tres estados con su umbral.
   Una segunda escala diría un número distinto del de la vista de mes. */
export const TEXTO_DIA_LIBRE = 'Libre';

export function diaDeLaSemana(eventos, fechaISO, productividad = null, hoy = todayISO()) {
  const evs = eventosDelDia(eventos, fechaISO).map((e) => ({ ...e, tipoElemento: 'evento' }));
  const tareas = tareasConRepeticion(productividad, fechaISO).map((t) => ({ ...t, tipoElemento: 'tarea', esTarea: true }));
  const elementos = [...evs, ...tareas].sort((a, b) => {
    const p = pesoDe(a) - pesoDe(b);
    if (p !== 0) return p;
    return (a.horaInicio || a.hora || '').localeCompare(b.horaInicio || b.hora || '');
  });

  const [, , d] = fechaISO.split('-').map(Number);
  return {
    fecha: fechaISO,
    dia: d,
    esHoy: fechaISO === hoy,
    elementos,
    total: elementos.length,
    // Apartado 16 — *"un día sin elementos: Libre. No rellenar con tarjetas vacías."*
    libre: elementos.length === 0,
    /* ⚠️ La carga se calcula sobre las tareas de la E3 F8 —las que tienen ese día
       escrito—, y las apariciones de una serie se suman aparte: `cargaDelDia` no
       sabe de repeticiones y no tiene por qué. */
    carga: cargaDelDia(eventos, fechaISO, {
      tareas: tareas.filter((t) => !t.esInstancia).concat(tareas.filter((t) => t.esInstancia).map((t) => ({ ...t, fecha: fechaISO }))),
    }),
  };
}

/** La semana entera (apartados 2, 3 y 4). Siete días con sus cosas. */
export function semanaDe(eventos, fechaISO, { productividad = null, hoy = todayISO() } = {}) {
  const desde = inicioDeSemana(fechaISO);
  const hasta = finDeSemana(fechaISO);
  // ⚠️ Se expande UNA vez para toda la semana, no siete (apartado 39 de la F8:
  // *"utilizar rangos de fechas"*).
  const expandidos = expandirRecurrentes(eventos, desde, hasta);
  const dias = [];
  for (let i = 0; i < 7; i += 1) {
    const f = addDays(desde, i);
    dias.push({ ...diaDeLaSemana(expandidos, f, productividad, hoy), seleccionado: f === fechaISO });
  }
  return {
    desde,
    hasta,
    titulo: tituloSemana(fechaISO),
    esActual: esSemanaActual(fechaISO, hoy),
    dias,
    total: dias.reduce((n, d) => n + d.total, 0),
    vacia: dias.every((d) => d.libre),
  };
}

/* ── Lo que ya estaba, y no se rehace ──────────────────────────────────────
   Como `YA_RESUELTO` en la E3 F9: declarado **con la función real**, para que
   renombrar una rompa la compilación. */
export const YA_RESUELTO_SEMANA = [
  { apartado: 9, que: 'El motor de recurrencias', con: 'expandirRecurrentes — expande sin materializar, con intervalo, excepciones y cambios (Calendario Universal F3)' },
  { apartado: 14, que: 'Las excepciones de una serie', con: 'recurrencia.excepciones + saltarOcurrencia, que ya existían para eventos' },
  { apartado: 20, que: 'Las acciones rápidas', con: 'QuickAdd de la E3 F9 — *"no crear otro Quick Add específico para Semana"*' },
  { apartado: 21, que: 'Los filtros por tipo', con: 'los chips de tipo del Calendario (Calendario Universal F3)' },
  { apartado: 22, que: 'La búsqueda', con: 'el buscador del Calendario y el global de BI F3' },
  { apartado: 25, que: 'Las rachas', con: 'rachasServicio.js — Hábitos sigue siendo la fuente de verdad' },
  { apartado: 26, que: 'Crear en una fecha futura', con: 'contextoDeAdd de la E3 F9 — la fecha del día seleccionado' },
  { apartado: 27, que: 'Lo futuro no sale en Hoy', con: 'tareasDeHoy filtra por fecha, así que sale cuando le toca' },
];

/* ⚠️ **Y lo que el enunciado deja preparado, no hecho** (apartado 30): los
   campos que necesitará el sistema de notificaciones. `fecha` y `hora` ya están
   en la tarea; `estado` es `hecha`; y el **recordatorio** no existe todavía como
   campo de una tarea, así que se declara en vez de fingirlo (regla 8). */
export const PREPARADO_PARA_AVISOS = [
  { campo: 'fecha', existe: true, donde: 'tarea.fecha' },
  { campo: 'hora', existe: true, donde: 'tarea.hora' },
  { campo: 'estado', existe: true, donde: 'tarea.hecha (o recurrencia.hechas en una serie)' },
  {
    campo: 'reminder', existe: false, donde: null,
    porque: 'Una tarea no tiene todavía un aviso propio. Los avisos del proyecto los manda notificaciones.js, y añadirle uno aquí sería un segundo emisor (HT F10 y EH F38).',
  },
];

/* ── Lo que esta fase NO hace ──────────────────────────────────────────────
   Escrito para que una fase futura no lo dé por pendiente sin querer. */
export const NO_EN_LA_SEMANA = [
  { que: 'Arrastrar y soltar entre días', porque: 'El apartado 8 lo deja en "si resulta estable" y pide "Cambiar fecha" en móvil; eso ya existe (E3 F9), y EH F50 prohíbe que una acción dependa de un gesto.' },
  { que: 'Un historial independiente', porque: 'El apartado 29 lo excluye: *"el propio sistema de tareas/eventos ya conserva la información"*.' },
  { que: 'Notificaciones push completas', porque: 'El apartado 30 pide dejar los campos preparados, no desarrollarlas.' },
  { que: 'Una recurrencia "personalizada" libre', porque: 'El apartado 9 la nombra; lo que hay es el intervalo de `expandirRecurrentes` ("cada 2 semanas"). Un editor de reglas libres es una fase entera y no está pedida.' },
];
