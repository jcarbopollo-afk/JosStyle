/* ===========================================================================
   ENTREGA 3 · FASE 6 (HC F1) — HOY: EL CENTRO DEL DÍA
   ===========================================================================

   *"Transformar Hoy en el auténtico centro operativo. Al abrir la aplicación, el
   usuario debe poder entender en pocos segundos qué tiene hoy."*

   🚨 **LO PRIMERO FUE MIRAR QUÉ EXISTE YA**, que es la lección que dejó HT F6:
   *"el 90 % de esa fase fue no duplicar"*. De los veinticinco apartados, **la
   mayor parte ya estaban construidos**:

     · la cabecera con saludo y fecha dinámica (apartado 1) → `DashboardView`;
     · la agenda del día en orden (apartado 5) → `agendaCompleta` (HT F6);
     · el próximo evento y el "en 2 h 15 min" (apartado 4) → `ahoraMismo` y
       `siguiente`, con `describirMinutos`, también de HT F6;
     · las tareas y su marcado (apartados 6 y 19) → `pendientes()` y
       `toggleTarea`, que escriben en la tarea original;
     · los hábitos y su racha (apartado 7) → `productividad.habitos` y RA F1;
     · entrenamiento, estudios, nutrición, sueño y economía (9-13) → sus
       tarjetas del Dashboard, con los datos de sus módulos.

   Lo que **no** contestaba nadie, y es lo que hay aquí:

     · **el resumen del día** (apartado 2): *"4 tareas · 2 eventos · 5 hábitos"*;
     · **el progreso del día** (apartado 20), contando SOLO lo completable;
     · **los apuntes de hoy** (apartado 17), la captura rápida que no existía.

   🚨 **Y NADA DE ESTO GUARDA UNA COPIA** (apartados 24 y 25): *"no crear
   today_tasks, agenda_tasks y calendar_tasks como tres copias independientes"*.
   Los recuentos se derivan en el momento de las entidades originales, así que
   marcar una tarea en Hoy la marca en Agenda **porque son la misma**. Lo único
   que se guarda aquí son los apuntes, que no existían en ningún sitio.
   =========================================================================== */

import { uid, todayISO } from './helpers';
import { agendaCompleta } from './hoy';

/* ===========================================================================
   1 · EL RESUMEN DEL DÍA (apartado 2)
   ===========================================================================
   *"4 tareas · 2 eventos · 5 hábitos. Los números deben proceder de datos
   reales."*

   ⚠️ **Se derivan, no se guardan.** Una capa de resumen que guarda sus cifras
   miente en cuanto él borra algo — es la lección de EH F29 y F35. */

/** ¿Toca hoy este hábito? Un hábito sin días marcados es diario. */
export function tocaHoy(habito, hoy = todayISO()) {
  const dias = Array.isArray(habito?.dias) ? habito.dias : null;
  if (!dias || dias.length === 0) return true;
  // `getDay()` da 0 para domingo; en España la semana empieza el lunes.
  const [a, m, d] = hoy.split('-').map(Number);
  const indice = (new Date(a, m - 1, d).getDay() + 6) % 7;
  return dias.includes(indice);
}

export const habitoHecho = (habito, hoy = todayISO()) => !!(habito?.historial || {})[hoy];

/** Las tareas cuya fecha es hoy. ⚠️ Sin fecha NO es "de hoy": meterla aquí sería
 *  decidir por él que hoy le toca algo que no ha programado. */
export function tareasDeHoy(productividad, hoy = todayISO()) {
  return (productividad?.tareas || []).filter((t) => t && t.fecha === hoy);
}

export function habitosDeHoy(productividad, hoy = todayISO()) {
  return (productividad?.habitos || []).filter((h) => h && tocaHoy(h, hoy));
}

export function resumenDelDia(estado, opciones = {}) {
  const { hoy = todayISO(), productividad = null, ...resto } = opciones;
  const agenda = agendaCompleta(estado, hoy, { ...resto, hoy });
  const tareas = tareasDeHoy(productividad, hoy);
  const habitos = habitosDeHoy(productividad, hoy);

  const piezas = [];
  if (tareas.length > 0) piezas.push(`${tareas.length} ${tareas.length === 1 ? 'tarea' : 'tareas'}`);
  if (agenda.total > 0) piezas.push(`${agenda.total} ${agenda.total === 1 ? 'evento' : 'eventos'}`);
  if (habitos.length > 0) piezas.push(`${habitos.length} ${habitos.length === 1 ? 'hábito' : 'hábitos'}`);

  return {
    tareas: tareas.length,
    eventos: agenda.total,
    habitos: habitos.length,
    // ⚠️ `null`, no una cadena vacía ni un "0 tareas · 0 eventos": un día sin
    // nada no se anuncia con tres ceros (la lección de EH F25 y F35).
    linea: piezas.length > 0 ? piezas.join(' · ') : null,
    vacio: piezas.length === 0,
  };
}

/* ===========================================================================
   2 · EL PROGRESO DEL DÍA (apartado 20)
   ===========================================================================
   *"68 % completado. Basado en elementos realmente completables: tareas,
   hábitos, acciones programadas. **NO contar eventos que simplemente ocurren.**
   El cálculo debe estar claramente definido."*

   🚨 **Eso último es literal, así que el cálculo se declara aquí**, en una lista
   que se lee: cada fuente dice qué cuenta y por qué. Un evento no entra —una
   clase de las 8:00 no se "completa"—, y por eso este número **no es** la
   puntuación del día de `puntuacion.js`, que mide otra cosa (cuántas áreas ha
   registrado). Dos números distintos porque contestan dos preguntas distintas.

   ⚠️ **Y sin nada completable NO hay porcentaje**: `null`, no un 0 %. Un 0 %
   todos los domingos sería un reproche por un día en el que no tocaba nada
   (la lección de EH F8 y F35). */
export const FUENTES_PROGRESO = [
  { id: 'tareas', nombre: 'Tareas de hoy', cuenta: 'las que tienen fecha de hoy', porque: 'se marcan una a una' },
  { id: 'habitos', nombre: 'Hábitos de hoy', cuenta: 'los que tocan hoy', porque: 'se marcan una a una' },
];

export function progresoDelDia(productividad, hoy = todayISO()) {
  const tareas = tareasDeHoy(productividad, hoy);
  const habitos = habitosDeHoy(productividad, hoy);
  const total = tareas.length + habitos.length;
  if (total === 0) {
    return { total: 0, hechos: 0, porcentaje: null, texto: null, completo: false };
  }
  const hechos = tareas.filter((t) => t.hecha).length + habitos.filter((h) => habitoHecho(h, hoy)).length;
  const porcentaje = Math.round((hechos / total) * 100);
  return {
    total,
    hechos,
    porcentaje,
    texto: `${porcentaje} % completado`,
    completo: hechos === total,
  };
}

/* ===========================================================================
   3 · LOS APUNTES DE HOY (apartado 17)
   ===========================================================================
   *"📝 Apuntes de hoy — escribe algo que no quieras olvidar. […] Estos apuntes
   pertenecen al día. Posteriormente podrían convertirse en tarea, evento, nota
   o recordatorio. Pero **inicialmente son simplemente apuntes**."*

   Es lo único de esta fase que no existía en ninguna parte. Y es deliberadamente
   pequeño: **un texto y su día**. Nada de categoría, prioridad ni etiquetas —
   *"no obligar a clasificarlo antes"* (apartado 16).

   ⚠️ **Viven en `productividad.apuntes`**, no en una clave nueva de Supabase:
   son de Productividad como las tareas, y una clave nueva significaría un
   almacén más que normalizar, exportar y meter en la papelera. Y su entrada en
   `CATALOGO_PAPELERA` está puesta: **toda lista que se pueda borrar va ahí**
   (EH F45).

   ⏸ **Convertirlo en tarea o evento es de la HC F4**, *"acciones rápidas e
   integración"*, que es la fase que el propio documento dedica a eso. Aquí no se
   finge: `PUEDE_CONVERTIRSE_EN` declara en qué, con la fase que lo construirá. */
export const MAX_APUNTE = 280;

export const PUEDE_CONVERTIRSE_EN = [
  { id: 'tarea', nombre: 'Tarea', donde: 'productividad.tareas' },
  { id: 'evento', nombre: 'Evento', donde: 'calendario.eventos' },
  { id: 'nota', nombre: 'Nota del diario', donde: 'diario.entradas' },
];

export const TEXTOS_APUNTES = {
  titulo: 'Apuntes de hoy',
  invita: 'Escribe algo que no quieras olvidar.',
  campo: '¿Qué tienes en mente?',
  guardar: 'Guardar',
  vacio: 'Todavía no has apuntado nada hoy.',
};

export function normalizarApunte(guardado) {
  const g = guardado || {};
  const texto = String(g.texto || '').trim().slice(0, MAX_APUNTE);
  if (!texto) return null;
  return {
    // ⚠️ Un elemento guardado sin `id` es un duplicado esperando a pasar
    // (EH F45): al releerlo, cada dispositivo le pondría uno distinto.
    id: g.id || uid(),
    texto,
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(g.fecha || '') ? g.fecha : todayISO(),
    creadoEn: g.creadoEn || null,
  };
}

export const normalizarApuntes = (guardados) =>
  (Array.isArray(guardados) ? guardados : []).map(normalizarApunte).filter(Boolean);

/** Los apuntes de un día. El apartado dice *"pertenecen al día"*, así que ayer
 *  no se arrastra a hoy: sigue estando, pero en su día. */
export const apuntesDe = (productividad, hoy = todayISO()) =>
  normalizarApuntes(productividad?.apuntes).filter((a) => a.fecha === hoy);

/** Devuelve la `productividad` entera, porque quien guarda es `App.jsx`. */
export function anadirApunte(productividad, texto, hoy = todayISO()) {
  const limpio = String(texto || '').trim();
  if (!limpio) return productividad;
  const p = productividad || {};
  return {
    ...p,
    apuntes: [
      ...normalizarApuntes(p.apuntes),
      { id: uid(), texto: limpio.slice(0, MAX_APUNTE), fecha: hoy, creadoEn: new Date().toISOString() },
    ],
  };
}

/* ===========================================================================
   4 · EL ORDEN (apartado 18)
   ===========================================================================
   *"No mostrar todos los módulos con el mismo peso. El contenido que requiere
   acción debe estar arriba."*

   Se declara aquí en vez de quedar implícito en el JSX, para que se pueda leer
   —y comprobar— cuál es el orden de verdad. */
export const ORDEN_HOY = [
  { id: 'ahora', nombre: 'Próximo evento o situación inmediata', accionable: true },
  { id: 'tareas', nombre: 'Tareas pendientes', accionable: true },
  { id: 'agenda', nombre: 'Agenda del día', accionable: false },
  { id: 'habitos', nombre: 'Hábitos', accionable: true },
  { id: 'modulos', nombre: 'Entrenamiento, Estudios y Objetivos', accionable: true },
  { id: 'secundario', nombre: 'Información secundaria', accionable: false },
];
