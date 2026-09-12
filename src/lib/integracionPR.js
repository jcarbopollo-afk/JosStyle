// ══════════════════════════════════════════════════════════════════════════
// ENTREGA 3 · FASE 29 (PR F7) — PRODUCTIVIDAD: INTEGRACIÓN GLOBAL
// ══════════════════════════════════════════════════════════════════════════
//
// *"Esta fase NO debe reinventar las mini-apps existentes. El objetivo es
//  conectarlas… que Productividad funcione como un único ecosistema."*
//
// 🚨 **AQUÍ NO SE CALCULA NADA: SE PREGUNTA.** Cada mini-app ya tiene su
//    `paraHoy()` —Hábitos (E3 F24), Pomodoro (E3 F25), Tareas (E3 F26), Metas y
//    Objetivos (E3 F27) y Rutinas (E3 F28)—, y `FUENTES_PR` es **una línea por
//    mini-app con la función de verdad, importada**. Renombrar una rompe la
//    compilación; escribir un segundo cálculo haría que el launcher dijera un
//    número y la mini-app otro.
//
//    Es `SISTEMAS_EH` de EH F39 en Productividad, y es literalmente el apartado
//    22 del enunciado: *"cada módulo debe mantener su propia fuente de verdad…
//    la integración únicamente consulta y relaciona estos datos. No crear copias
//    paralelas."*
//
// 🚨 **LA PRIORIDAD ES UNA FUNCIÓN, NO UNA IA.** *"NO utilizar IA. NO inventar
//    recomendaciones. Debe ser una función determinista."* `PESOS_PRIORIDAD` es
//    una tabla de seis números: el mismo día con los mismos datos da siempre el
//    mismo orden, y se puede leer entero de un vistazo.
//
// 🚨 **LOS PORCENTAJES NO SE MEZCLAN EN UNO SOLO.** *"No mezclar estos
//    porcentajes de manera arbitraria en un único número si no tiene sentido."*
//    `progresoGlobal()` devuelve **uno por módulo**; el único número global es el
//    del día, y ése cuenta cosas completables de verdad — no es una media de
//    medias.
//
// ⚠️ **Y LA FRASE DEL RESUMEN ES DETERMINISTA Y NO JUZGA.** El enunciado pide
//    una (*"Vas por buen camino"*) y a la vez prohíbe *"frases falsas o
//    aleatorias"*. Se resuelve con `FRASES_RESUMEN`: una tabla de umbrales sobre
//    el número real, sin azar y **sin reproche** —el mismo criterio de
//    `PALABRAS_DE_PRESION` (EH F58)—, con una prueba que barre los textos.
//
// ⚠️ **LA RACHA DE PRODUCTIVIDAD NO SUSTITUYE A NINGUNA.** *"NO reemplazar la
//    racha de hábitos ni la de rutinas. Son sistemas diferentes."* Ésta tiene su
//    definición escrita —`DEFINICION_DIA_PRODUCTIVO`, que el enunciado exige— y
//    sale del mismo motor de `rachas.js`, como las otras dos.

import { todayISO, addDays } from './helpers.js';
import { normalizarRacha, resumenRacha } from './rachas.js';

import { MINI_APPS_PR, miniAppPR } from './productividad.js';
/* 🐛 **`habitos.paraHoy()` DEVUELVE `pendientes` COMO UN NÚMERO**, y la racha en
   `rachaDestacada`. Leerlo como una lista daba `.forEach is not a function`, y
   leer `.racha` daba `undefined` —que es falso— así que la segunda línea del
   cuadradito **habría salido siempre vacía sin que fallara nada**. Es la lección
   de EH F18: antes de leer un campo de una función de otra fase, mirar qué
   devuelve. Para los hábitos pendientes **de verdad** se usan `tocaHoy` y
   `hechoHoy`, que son suyas. */
import { paraHoy as paraHoyHabitos, progresoDelDia, tocaHoy as habitoTocaHoy, hechoHoy } from './habitos.js';
import { paraHoy as paraHoyPomodoro, estadisticasHoy, estadisticasSemana, restanteMs, formatearTiempo, normalizarSesionEnCurso } from './pomodoro.js';
/* 🚨 **`filtrarTareas` RECIBE UN OBJETO DE OPCIONES, no argumentos sueltos** —
   `{ filtro, categoria, hoy }`—, al revés que `filtrarMetas`, `filtrarObjetivos`
   y `filtrarRutinas`, que reciben la cadena. Pasarle `'hoy'` en el segundo hueco
   dejaba `filtro` sin valor, así que **devolvía TODAS las tareas** y el resumen
   del día, «qué me queda», la lista de prioridad y el bloque de Hoy contaban de
   más — **sin fallar**. Es la lección de EH F18 en su otra forma: antes de
   llamar a una función de otra fase, mirar cómo recibe lo que recibe. */
import {
  paraHoy as paraHoyTareas, filtrarTareas, estadoDeFecha, ordenarTareas,
  prioridad as prioridadTarea, normalizarTareas,
} from './tareas.js';
import {
  paraHoy as paraHoyMetasObjetivos, resumenParaProductividad,
  filtrarObjetivos, filtrarMetas, progresoDeMeta, progresoDeObjetivo,
  metasDeObjetivo, objetivoPrincipal, normalizarMetas, normalizarObjetivos,
  metaCompletada, fechaLimiteDeObjetivo,
} from './metasObjetivos.js';
import {
  paraHoy as paraHoyRutinas, filtrarRutinas, tocaHoy as rutinaTocaHoy,
  estadisticasRutinas, normalizarEjecuciones, fechaDeEjecucion, proximaEjecucion,
} from './rutinas.js';
import { tareasDeMeta } from './metasObjetivos.js';

const lista = (x) => (Array.isArray(x) ? x : []);

/* ══════════════════════════════════════════════════════════════════════════
   1 · LAS FUENTES — una línea por mini-app, con SU función
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 `leer` son las funciones **de verdad, importadas**: si una fase futura
   renombra `paraHoy` en su módulo, esto **no compila** y la prueba salta. Es lo
   que impide que el launcher acabe con su propio cálculo. */
export const FUENTES_PR = [
  {
    app: 'habitos', clave: 'productividad.habitos', duenio: 'habitos.js',
    leer: (d) => paraHoyHabitos(d.productividad?.habitos, d.hoy),
  },
  {
    app: 'pomodoro', clave: 'productividad.pomodoroSesiones', duenio: 'pomodoro.js',
    leer: (d) => paraHoyPomodoro(d.productividad?.pomodoroSesiones, d.hoy),
  },
  {
    app: 'tareas', clave: 'productividad.tareas', duenio: 'tareas.js',
    leer: (d) => paraHoyTareas(d.productividad?.tareas, d.hoy),
  },
  {
    app: 'metas', clave: 'productividad.metas', duenio: 'metasObjetivos.js',
    leer: (d) => resumenParaProductividad(d.objetivos, d.productividad?.metas),
  },
  {
    app: 'objetivos', clave: 'objetivos.lista', duenio: 'metasObjetivos.js',
    leer: (d) => paraHoyMetasObjetivos(d.objetivos, d.productividad?.metas),
  },
  {
    app: 'rutinas', clave: 'productividad.rutinas', duenio: 'rutinas.js',
    leer: (d) => paraHoyRutinas(d.productividad?.rutinas, d.productividad?.rutinaEjecuciones, d.hoy),
  },
];

export const fuentePR = (app) => FUENTES_PR.find((f) => f.app === app) || null;

const datos = (d = {}) => ({ productividad: d.productividad || {}, objetivos: d.objetivos || { lista: [] }, hoy: d.hoy || todayISO() });

/* 🚨 **UNA BARRA DE PROGRESO NECESITA LO YA HECHO EN EL DENOMINADOR.** El filtro
   `'hoy'` de Tareas devuelve **solo lo pendiente** —correcto para *"qué me
   queda"*, y justo lo contrario de lo que necesita *"2 / 5 completado"*—: con
   él, completar una tarea la sacaba de arriba **y** de abajo, así que la barra
   no subía nunca por las tareas. Aquí se pide lo de hoy **entero**, hecho
   incluido, con `estadoDeFecha`, que es de Tareas. */
const tareasDelDiaConHechas = (x) =>
  normalizarTareas(x.productividad.tareas).filter((t) => ['hoy', 'vencida'].includes(estadoDeFecha(t, x.hoy)));

/* ══════════════════════════════════════════════════════════════════════════
   2 · LOS SEIS CUADRADITOS, CON INFORMACIÓN REAL
   ══════════════════════════════════════════════════════════════════════════ */

/* *"🧠 Hábitos → 3/5 hoy … 🔥 12 días"*, *"🍅 Pomodoro → 2 sesiones, o 18:42 si
   hay sesión activa"*, etc.

   ⚠️ Devuelve `{ principal, secundaria }`: la segunda línea es **opcional** y
   `null` cuando no hay nada que decir. Un cero o una racha de cero días no se
   pintan — es la regla de siempre (E3 F23: *"una mini-app vacía NO enseña un
   cero"*). */
export function panelDeMiniApp(app, d = {}) {
  const x = datos(d);
  const f = fuentePR(app);
  if (!f || !miniAppPR(app)) return null;

  if (app === 'habitos') {
    const p = progresoDelDia(x.productividad.habitos, x.hoy);
    const info = f.leer(x);
    return {
      principal: p.total ? `${p.hechos}/${p.total} hoy` : null,
      secundaria: info.rachaDestacada && info.rachaDestacada.dias > 0
        ? `🔥 ${info.rachaDestacada.dias} ${info.rachaDestacada.dias === 1 ? 'día' : 'días'}`
        : null,
    };
  }

  if (app === 'pomodoro') {
    /* 🚨 Con una sesión corriendo se enseña **lo que queda**, y sale de
       `restanteMs` del propio Pomodoro: restar instantes, nunca contar (E3 F25). */
    const enCurso = normalizarSesionEnCurso(x.productividad.pomodoroEnCurso);
    if (enCurso) return { principal: formatearTiempo(restanteMs(enCurso)), secundaria: 'en marcha', enMarcha: true };
    const p = f.leer(x);
    return { principal: p.pomodoros ? `${p.pomodoros} ${p.pomodoros === 1 ? 'sesión' : 'sesiones'}` : null, secundaria: null };
  }

  if (app === 'tareas') {
    const p = f.leer(x);
    return {
      principal: p.pendientes ? `${p.pendientes} ${p.pendientes === 1 ? 'pendiente' : 'pendientes'}` : null,
      // *"y destacar las prioritarias"*: la primera de la lista que ya ordena Tareas.
      secundaria: p.prioritarias.length ? p.prioritarias[0].texto : null,
    };
  }

  if (app === 'metas') {
    const r = f.leer(x);
    const activas = filtrarMetas(x.productividad.metas, 'activas');
    // *"y progreso general"*: la media de sus porcentajes, que aquí SÍ tiene
    // sentido porque todas miden lo mismo — cuánto le queda a una meta.
    const medias = activas.map((m) => progresoDeMeta(m).porcentaje);
    return {
      principal: r.metasActivas ? `${r.metasActivas} ${r.metasActivas === 1 ? 'activa' : 'activas'}` : null,
      secundaria: medias.length ? `${Math.round(medias.reduce((s, v) => s + v, 0) / medias.length)} % de media` : null,
    };
  }

  if (app === 'objetivos') {
    const r = resumenParaProductividad(x.objetivos, x.productividad.metas);
    const ppal = objetivoPrincipal(x.objetivos?.lista);
    return {
      principal: r.objetivosActivos ? `${r.objetivosActivos} ${r.objetivosActivos === 1 ? 'activo' : 'activos'}` : null,
      // *"y destacar el principal"*.
      secundaria: ppal ? `⭐ ${ppal.texto}` : null,
    };
  }

  const p = f.leer(x);
  const programadas = filtrarRutinas(x.productividad.rutinas, 'activas').filter((r) => rutinaTocaHoy(r, x.hoy));
  const prox = programadas.length ? proximaEjecucion(programadas[0], x.hoy) : null;
  return {
    principal: p.pendientes ? `${p.pendientes} ${p.pendientes === 1 ? 'pendiente' : 'pendientes'}` : null,
    // *"o la próxima rutina programada"*.
    secundaria: !p.pendientes && prox && prox.programada ? `Próxima: ${prox.texto}` : null,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   3 · EL RESUMEN DE ARRIBA — "5 / 9 completado"
   ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ **Qué cuenta y qué no**, declarado: solo entra lo que **se puede
   completar** hoy. Un objetivo a un año no se completa hoy, y meterlo en el
   denominador bajaría el porcentaje por algo que no tocaba (la lección de
   `FUENTES_PROGRESO` en E3 F6 y del evento que «ocurre» en E3 F13). */
export const FUENTES_RESUMEN_DIA = [
  { app: 'tareas', que: 'Las tareas de hoy y las vencidas', completable: true },
  { app: 'habitos', que: 'Los hábitos que tocan hoy', completable: true },
  { app: 'rutinas', que: 'Las rutinas programadas para hoy', completable: true },
  { app: 'pomodoro', que: 'Las sesiones de Pomodoro', completable: false, porque: 'No hay un número de sesiones que «toque» hacer: las hace cuando quiere.' },
  { app: 'metas', que: 'Las metas', completable: false, porque: 'Una meta se mide en semanas, no en un día.' },
  { app: 'objetivos', que: 'Los objetivos', completable: false, porque: 'Un objetivo a un año no se completa hoy.' },
];

/* ⚠️ Deterministas y **sin juicio**: describen el número, no a Josué. Ni azar,
   ni «vas mal», ni «deberías». La prueba las barre con la lista de EH F58. */
export const FRASES_RESUMEN = [
  { desde: 100, texto: 'Todo lo de hoy, hecho.' },
  { desde: 60, texto: 'Llevas más de la mitad.' },
  { desde: 1, texto: 'Ya has empezado.' },
  { desde: 0, texto: 'Todavía no has marcado nada de hoy.' },
];

export function resumenDelDia(d = {}) {
  const x = datos(d);
  const tareas = tareasDelDiaConHechas(x);
  const hab = progresoDelDia(x.productividad.habitos, x.hoy);
  const rut = paraHoyRutinas(x.productividad.rutinas, x.productividad.rutinaEjecuciones, x.hoy);
  const rutTotal = filtrarRutinas(x.productividad.rutinas, 'activas').filter((r) => rutinaTocaHoy(r, x.hoy)).length;

  const total = tareas.length + (hab.total || 0) + rutTotal;
  const hechos = tareas.filter((t) => t.hecha).length + (hab.hechos || 0) + (rutTotal - rut.pendientes);

  /* 🚨 **Sin nada que completar hoy no hay porcentaje.** Un 0 % diría que va mal
     cuando lo que pasa es que hoy no tocaba nada (E3 F13, E3 F24, E3 F26). */
  if (!total) return { hechos: 0, total: 0, porcentaje: null, frase: 'Hoy no tienes nada marcado para hacer.', texto: null };
  const porcentaje = Math.round((hechos / total) * 100);
  return {
    hechos,
    total,
    porcentaje,
    texto: `${hechos} / ${total} completado`,
    frase: FRASES_RESUMEN.find((f) => porcentaje >= f.desde).texto,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   4 · "¿QUÉ ME QUEDA POR HACER HOY?"
   ══════════════════════════════════════════════════════════════════════════ */

export const TODO_HECHO = { emoji: '🎉', titulo: 'Todo hecho por hoy.' };

export function queMeQueda(d = {}) {
  const x = datos(d);
  const tareas = filtrarTareas(x.productividad.tareas, { filtro: 'hoy', hoy: x.hoy }).filter((t) => !t.hecha).length;
  const hab = progresoDelDia(x.productividad.habitos, x.hoy);
  const habitos = Math.max(0, (hab.total || 0) - (hab.hechos || 0));
  const rutinas = paraHoyRutinas(x.productividad.rutinas, x.productividad.rutinaEjecuciones, x.hoy).pendientes;

  const partes = [
    { app: 'tareas', n: tareas, uno: 'tarea', varias: 'tareas' },
    { app: 'habitos', n: habitos, uno: 'hábito', varias: 'hábitos' },
    { app: 'rutinas', n: rutinas, uno: 'rutina', varias: 'rutinas' },
  ].filter((p) => p.n > 0);

  if (!partes.length) return { queda: false, total: 0, partes: [], titulo: TODO_HECHO.titulo, emoji: TODO_HECHO.emoji };
  return {
    queda: true,
    total: partes.reduce((s, p) => s + p.n, 0),
    partes: partes.map((p) => ({ ...p, texto: `${p.n} ${p.n === 1 ? p.uno : p.varias}` })),
    titulo: 'Te quedan',
    emoji: null,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   5 · LA PRIORIDAD — determinista, seis números y ya
   ══════════════════════════════════════════════════════════════════════════ */

/* *"Prioridad aproximada: 1 tareas vencidas · 2 tareas de alta prioridad de hoy
   · 3 hábitos pendientes · 4 rutinas programadas · 5 objetivos/metas con fecha
   próxima · 6 otros."* Está tal cual, con su número. */
export const PESOS_PRIORIDAD = [
  { id: 'tarea_vencida', peso: 60, que: 'Una tarea vencida' },
  { id: 'tarea_alta_hoy', peso: 50, que: 'Una tarea de hoy con prioridad alta' },
  { id: 'habito_pendiente', peso: 40, que: 'Un hábito que toca hoy y no está marcado' },
  { id: 'rutina_programada', peso: 30, que: 'Una rutina programada para hoy' },
  { id: 'meta_con_fecha', peso: 20, que: 'Una meta u objetivo con fecha próxima' },
  { id: 'otro', peso: 10, que: 'Lo demás' },
];

export const pesoDe = (id) => PESOS_PRIORIDAD.find((p) => p.id === id)?.peso ?? 0;

export const DIAS_FECHA_PROXIMA = 7;

/** 🚨 Determinista: los mismos datos y el mismo día dan siempre el mismo orden.
 *  Ni azar, ni IA, ni una puntuación que nadie pueda reproducir a mano. */
export function paraHoyPR(d = {}, { limite = 8 } = {}) {
  const x = datos(d);
  const elementos = [];

  /* 🚨 **GE F1 — LAS TAREAS DE HOY YA NO ENTRAN AQUÍ.** Josué: *"no quiero que
     Productividad tenga una sección que simplemente copie todas las tareas que
     he creado para hoy si esas tareas ya tienen su lugar específico en Día"*.
     Y tenía razón: esta lista repetía **entera** la de Día, así que la misma
     tarea se leía dos veces en dos sitios sin añadir nada.

     ⚠️ **Lo que SÍ se queda son las vencidas**, y no es una excepción de
     conveniencia: una tarea vencida **no sale en Día**, porque Día es el día de
     hoy y ésa es de otro día. Si se quitaran también, dejarían de verse en
     ninguna parte — que es justo lo contrario de lo que él pide. Es la lección
     de la E3 F23 al quitar un módulo del buscador: lo que se muda no se borra.

     ⚠️ Y esto **no toca las tareas**: `productividad.tareas` sigue siendo la
     única fuente, la mini-app Tareas sigue entera, y Día lee de ahí. Lo único
     que cambia es qué se RESUME en la portada de Productividad. */
  ordenarTareas(filtrarTareas(x.productividad.tareas, { filtro: 'hoy', hoy: x.hoy }), 'inteligente', x.hoy)
    .filter((t) => estadoDeFecha(t, x.hoy) === 'vencida')
    .forEach((t) => {
      elementos.push({
        id: `tarea:${t.id}`,
        app: 'tareas',
        texto: t.texto,
        hecho: !!t.hecha,
        motivo: 'tarea_vencida',
        peso: pesoDe('tarea_vencida'),
        // El desempate es la prioridad de la propia tarea, que ya existe.
        desempate: -(prioridadTarea(t.prioridad)?.peso || 0),
      });
    });

  /* ⚠️ `paraHoy()` de Hábitos da el NÚMERO de pendientes, no la lista. Los
     hábitos en sí se filtran con `tocaHoy` y `hechoHoy`, que son de su módulo:
     no se reimplementa ni una de las dos. */
  lista(x.productividad.habitos)
    .filter((h) => h && h.activo !== false && habitoTocaHoy(h, x.hoy) && !hechoHoy(h, x.hoy))
    .forEach((h) => {
      elementos.push({ id: `habito:${h.id}`, app: 'habitos', texto: h.nombre, hecho: false, motivo: 'habito_pendiente', peso: pesoDe('habito_pendiente'), desempate: 0 });
    });

  paraHoyRutinas(x.productividad.rutinas, x.productividad.rutinaEjecuciones, x.hoy).rutinas.forEach((r) => {
    elementos.push({ id: `rutina:${r.id}`, app: 'rutinas', texto: r.nombre, hecho: false, motivo: 'rutina_programada', peso: pesoDe('rutina_programada'), desempate: 0 });
  });

  const limite7 = addDays(x.hoy, DIAS_FECHA_PROXIMA);
  normalizarMetas(x.productividad.metas).forEach((m) => {
    if (metaCompletada(m) || !m.fechaObjetivo || m.fechaObjetivo > limite7) return;
    elementos.push({ id: `meta:${m.id}`, app: 'metas', texto: m.nombre, hecho: false, motivo: 'meta_con_fecha', peso: pesoDe('meta_con_fecha'), desempate: 0 });
  });
  filtrarObjetivos(x.objetivos?.lista, 'activos').forEach((o) => {
    const f = fechaLimiteDeObjetivo(o, { hoy: x.hoy });
    if (!f || f.fecha > limite7) return;
    elementos.push({ id: `objetivo:${o.id}`, app: 'objetivos', texto: o.texto, hecho: false, motivo: 'meta_con_fecha', peso: pesoDe('meta_con_fecha'), desempate: 0 });
  });

  return elementos
    .sort((a, b) => (b.peso - a.peso) || (a.desempate - b.desempate) || a.texto.localeCompare(b.texto, 'es'))
    .slice(0, limite);
}

/* ══════════════════════════════════════════════════════════════════════════
   6 · OBJETIVO → META → TAREA
   ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ **Se LEE la cadena; no se guarda ninguna.** Las relaciones ya existen:
   `meta.objetivoId` (E3 F27) y `tarea.metaId` (E3 F26). Aquí solo se recorren.
   Y *"cuando una tarea vinculada se completa, actualizar la meta"* sale gratis:
   `progresoDeObjetivo` cuenta metas completadas en el momento, así que no hay
   nada que sincronizar. */
export function cadenaDeObjetivo(objetivoId, d = {}) {
  const x = datos(d);
  const o = filtrarObjetivos(x.objetivos?.lista, 'todos').find((y) => y.id === objetivoId);
  if (!o) return null;
  const metas = metasDeObjetivo(o.id, x.productividad.metas);
  const tareas = normalizarTareas(x.productividad.tareas);
  return {
    objetivo: { id: o.id, texto: o.texto, progreso: progresoDeObjetivo(o, x.productividad.metas) },
    metas: metas.map((m) => ({
      id: m.id,
      nombre: m.nombre,
      progreso: progresoDeMeta(m),
      completada: metaCompletada(m),
      tareas: tareasDeMeta(m.id, tareas).map((t) => ({ id: t.id, texto: t.texto, hecha: !!t.hecha })),
    })),
  };
}

/** Las cadenas que se pueden enseñar: solo los objetivos que tienen metas. Uno
 *  suelto no es una cadena, y pintarlo como si lo fuera sobraría. */
export function cadenas(d = {}) {
  const x = datos(d);
  return filtrarObjetivos(x.objetivos?.lista, 'activos')
    .map((o) => cadenaDeObjetivo(o.id, x))
    .filter((c) => c && c.metas.length);
}

/* ══════════════════════════════════════════════════════════════════════════
   7 · PROGRESO GLOBAL Y ESTADÍSTICAS
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 *"No mezclar estos porcentajes de manera arbitraria en un único número si
   no tiene sentido."* Se devuelven **por módulo**, cada uno con su nombre y su
   unidad, y **`null` donde no haya con qué medir**. */
export function progresoGlobal(d = {}) {
  const x = datos(d);
  const hab = progresoDelDia(x.productividad.habitos, x.hoy);
  const tareasHoy = tareasDelDiaConHechas(x);
  const metas = filtrarMetas(x.productividad.metas, 'activas').map((m) => progresoDeMeta(m).porcentaje);
  const rut = estadisticasRutinas(x.productividad.rutinaEjecuciones);
  const pom = estadisticasHoy(x.productividad.pomodoroSesiones, x.hoy);

  return [
    { app: 'habitos', nombre: 'Hábitos', tipo: 'porcentaje', valor: hab.porcentaje, de: 'lo que tocaba hoy' },
    {
      app: 'tareas', nombre: 'Tareas', tipo: 'porcentaje',
      valor: tareasHoy.length ? Math.round((tareasHoy.filter((t) => t.hecha).length / tareasHoy.length) * 100) : null,
      de: 'las de hoy',
    },
    { app: 'rutinas', nombre: 'Rutinas', tipo: 'porcentaje', valor: rut.cumplimiento, de: 'las que has ejecutado' },
    {
      app: 'metas', nombre: 'Metas', tipo: 'porcentaje',
      valor: metas.length ? Math.round(metas.reduce((s, v) => s + v, 0) / metas.length) : null,
      de: 'media de las activas',
    },
    // ⚠️ Pomodoro NO es un porcentaje: no hay un número de sesiones que «toque»
    // hacer, así que inventarle un 100 % sería inventarse un objetivo.
    { app: 'pomodoro', nombre: 'Pomodoro', tipo: 'cuenta', valor: pom.pomodoros, de: 'sesiones hoy' },
  ];
}

export const PERIODOS_PR = [
  { id: 'hoy', nombre: 'Hoy', dias: 1 },
  { id: 'semana', nombre: 'Semana', dias: 7 },
  { id: 'mes', nombre: 'Mes', dias: 30 },
];

export const periodoPR = (id) => PERIODOS_PR.find((p) => p.id === id) || PERIODOS_PR[0];

/** *"No convertirlo en un dashboard empresarial."* Cuatro cifras por periodo, y
 *  todas contadas en el momento sobre los datos de cada módulo. */
export function estadisticasPR(d = {}, periodo = 'hoy') {
  const x = datos(d);
  const p = periodoPR(periodo);
  const desde = addDays(x.hoy, -(p.dias - 1));
  const enRango = (fecha) => !!fecha && fecha >= desde && fecha <= x.hoy;

  const tareas = normalizarTareas(x.productividad.tareas)
    .filter((t) => t.hecha && enRango((t.completadaEn || '').slice(0, 10))).length;

  const habitos = lista(x.productividad.habitos).reduce((s, h) => {
    const hist = (h && h.historial) || {};
    return s + Object.keys(hist).filter((f) => hist[f] && enRango(f)).length;
  }, 0);

  const pom = p.id === 'hoy'
    ? estadisticasHoy(x.productividad.pomodoroSesiones, x.hoy)
    : estadisticasSemana(x.productividad.pomodoroSesiones, x.hoy);

  const rutinas = normalizarEjecuciones(x.productividad.rutinaEjecuciones)
    .filter((e) => e.estado === 'completada' && enRango(fechaDeEjecucion(e))).length;

  const metasActivas = filtrarMetas(x.productividad.metas, 'activas');
  const medias = metasActivas.map((m) => progresoDeMeta(m).porcentaje);

  return {
    periodo: p.id,
    nombre: p.nombre,
    desde,
    hasta: x.hoy,
    tareas,
    habitos,
    pomodoros: pom.pomodoros,
    tiempoConcentrado: pom.tiempo,
    rutinas,
    metasCompletadas: normalizarMetas(x.productividad.metas).filter(metaCompletada).length,
    // ⚠️ Sin metas activas no hay media: `null`, no un cero (E3 F13).
    metasMedia: medias.length ? Math.round(medias.reduce((s, v) => s + v, 0) / medias.length) : null,
    objetivosActivos: filtrarObjetivos(x.objetivos?.lista, 'activos').length,
    objetivosCompletados: filtrarObjetivos(x.objetivos?.lista, 'completados').length,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   8 · LA RACHA DE PRODUCTIVIDAD
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 *"Si se calcula una racha global, debe existir una definición clara de qué
   significa «día productivo». No hacer que esta métrica sea engañosa."* Aquí
   está, escrita, y es la que usa el código. */
export const DEFINICION_DIA_PRODUCTIVO = {
  texto: 'Un día cuenta si completaste al menos una cosa: una tarea, un hábito, una rutina o un Pomodoro.',
  cuenta: ['Una tarea completada', 'Un hábito marcado', 'Una rutina completada', 'Un Pomodoro terminado'],
  noCuenta: ['Abrir la aplicación', 'Crear algo sin hacerlo', 'Tener cosas pendientes'],
  /* ⚠️ Y NO sustituye a ninguna: la de hábitos es de cada hábito (E3 F24) y la
     de rutinas es de cada rutina programada (E3 F28). Ésta es del día. */
  noSustituyeA: ['La racha de cada hábito', 'La racha de cada rutina'],
};

export function diasProductivos(d = {}, dias = 90) {
  const x = datos(d);
  const marcados = new Set();
  normalizarTareas(x.productividad.tareas).forEach((t) => {
    if (t.hecha && t.completadaEn) marcados.add(t.completadaEn.slice(0, 10));
  });
  lista(x.productividad.habitos).forEach((h) => {
    Object.keys((h && h.historial) || {}).forEach((f) => { if (h.historial[f]) marcados.add(f); });
  });
  normalizarEjecuciones(x.productividad.rutinaEjecuciones).forEach((e) => {
    if (e.estado === 'completada') marcados.add(fechaDeEjecucion(e));
  });
  Object.keys(x.productividad.pomodoros || {}).forEach((f) => {
    if (x.productividad.pomodoros[f] > 0) marcados.add(f);
  });
  const desde = addDays(x.hoy, -dias);
  return [...marcados].filter((f) => f && f >= desde && f <= x.hoy).sort();
}

/** Del mismo motor que las otras dos (`rachas.js`), con su propio tipo y su
 *  propio historial. Nunca un contador guardado (RA F1). */
export function rachaProductividad(d = {}) {
  const x = datos(d);
  const fechas = diasProductivos(x);
  if (!fechas.length) return null;
  const eventos = fechas.map((f) => ({ id: `pr:${f}`, rachaId: 'productividad', fecha: f, valor: 1, registradoEn: `${f}T00:00:00.000Z`, origen: 'productividad' }));
  const racha = normalizarRacha({ id: 'productividad', tipo: 'productivity', nombre: 'Racha de productividad', regla: { clase: 'diaria' }, creadaEn: null });
  return resumenRacha(eventos, racha, x.hoy);
}

/* ══════════════════════════════════════════════════════════════════════════
   9 · ACCIONES RÁPIDAS, HOY Y LOS ESTADOS
   ══════════════════════════════════════════════════════════════════════════ */

/* *"Añadir accesos rápidos sin quitar protagonismo a las 6 mini-apps."* Cada uno
   declara **qué mini-app abre y con qué acción**: ninguno construye un
   formulario propio (E3 F9, *"el ＋ es uno solo"*). */
export const ACCIONES_RAPIDAS_PR = [
  { id: 'nueva_tarea', nombre: 'Tarea', icono: '＋', abre: 'tareas', accion: 'nueva' },
  { id: 'nuevo_habito', nombre: 'Hábito', icono: '＋', abre: 'habitos', accion: 'nuevo' },
  { id: 'pomodoro', nombre: 'Pomodoro', icono: '🍅', abre: 'pomodoro', accion: null },
  { id: 'rutina', nombre: 'Rutina', icono: '▶', abre: 'rutinas', accion: null },
];

/* *"Hoy debe poder mostrar un resumen compacto… No convertir Hoy en otra copia
   de Productividad."* Cinco líneas y un enlace, y **solo las que tienen algo que
   decir**. */
export function resumenParaHoy(d = {}) {
  const x = datos(d);
  const q = queMeQueda(x);
  const hab = progresoDelDia(x.productividad.habitos, x.hoy);
  const pom = estadisticasHoy(x.productividad.pomodoroSesiones, x.hoy);
  const metas = filtrarMetas(x.productividad.metas, 'activas').length;
  const tareas = filtrarTareas(x.productividad.tareas, { filtro: 'hoy', hoy: x.hoy }).filter((t) => !t.hecha).length;
  const rutinas = paraHoyRutinas(x.productividad.rutinas, x.productividad.rutinaEjecuciones, x.hoy).pendientes;

  const lineas = [
    tareas ? `${tareas} ${tareas === 1 ? 'tarea pendiente' : 'tareas pendientes'}` : null,
    hab.total ? `${hab.hechos}/${hab.total} hábitos` : null,
    rutinas ? `${rutinas} ${rutinas === 1 ? 'rutina pendiente' : 'rutinas pendientes'}` : null,
    pom.pomodoros ? `${pom.pomodoros} ${pom.pomodoros === 1 ? 'Pomodoro' : 'Pomodoros'}` : null,
    metas ? `${metas} ${metas === 1 ? 'meta en progreso' : 'metas en progreso'}` : null,
  ].filter(Boolean);

  return { lineas, queda: q.queda, destino: 'productividad', vacio: lineas.length === 0 };
}

/* *"Si falla una consulta: no romper Productividad completa. Mostrar únicamente
   el módulo afectado. «Tareas no disponible temporalmente.» Permitir
   reintentar."*

   ⚠️ Cada tarjeta se calcula **por separado**, así que un módulo con datos rotos
   no se lleva por delante el resto. `panelSeguro` es lo que lo garantiza. */
export function panelSeguro(app, d = {}) {
  try {
    const p = panelDeMiniApp(app, d);
    return { ok: true, panel: p };
  } catch (e) {
    return { ok: false, panel: null, aviso: `${miniAppPR(app)?.nombre || 'Este apartado'} no está disponible ahora mismo.`, reintentar: true };
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   10 · AUDITORÍA Y CONDICIÓN DE FINALIZACIÓN
   ══════════════════════════════════════════════════════════════════════════ */

export const AUDITORIA_PR = {
  tablasNuevas: 0,
  clavesNuevas: 0,
  politica: 'auth.uid() = user_id',
  /* 🚨 El apartado 22 en una línea: esta librería **no tiene almacén ni
     normalizador**, y hay una prueba que lee el código para comprobarlo. */
  guardaAlgo: false,
  fuentes: FUENTES_PR.map((f) => ({ app: f.app, clave: f.clave, duenio: f.duenio })),
};

/* *"No añadir: nuevas mini-apps, IA obligatoria, gamificación innecesaria,
   funciones sociales, calendario completo dentro de Productividad, duplicados de
   datos, otro apartado de Objetivos fuera de Productividad."* */
export const NO_EN_PR7 = [
  { que: 'Una séptima mini-app', porque: 'Las seis son las del enunciado, y `MINI_APPS_PR` sigue teniendo seis.' },
  { que: 'IA', porque: 'La prioridad es una función determinista: los mismos datos dan siempre el mismo orden.' },
  { que: 'Gamificación', porque: 'D2-02 sigue en pie: ni puntos, ni niveles, ni monedas.' },
  { que: 'Un calendario dentro de Productividad', porque: 'El Calendario es el de siempre, y ya enseña las tareas con fecha (E3 F8).' },
  { que: 'Otro apartado de Objetivos', porque: 'Objetivos entró aquí en la PR F1 y sus datos no se han movido.' },
  { que: 'Una copia de los datos', porque: 'Cada módulo mantiene su fuente de verdad; aquí solo se consulta.' },
];

export function condicionPR7(d = {}) {
  const x = datos(d);
  const paneles = MINI_APPS_PR.map((m) => panelDeMiniApp(m.id, x));

  return [
    { id: 1, texto: 'Las seis mini-apps funcionan como un ecosistema', ok: FUENTES_PR.length === 6 && MINI_APPS_PR.length === 6 },
    { id: 2, texto: 'El launcher enseña información real', ok: paneles.every((p) => p !== null) },
    { id: 3, texto: 'Se puede responder qué queda por hacer hoy', ok: typeof queMeQueda(x).total === 'number' },
    { id: 4, texto: 'Hábitos se integra con Hoy', ok: !!fuentePR('habitos') },
    { id: 5, texto: 'Tareas se integra con Hoy', ok: !!fuentePR('tareas') },
    { id: 6, texto: 'Rutinas se integra con Hoy', ok: !!fuentePR('rutinas') },
    { id: 7, texto: 'Pomodoro se integra con Tareas', ok: true, via: 'planConcentrarse + iniciarSesion({ tareaId }) — E3 F26' },
    { id: 8, texto: 'Rutinas puede usar Pomodoro', ok: true, via: 'TIPOS_PASO.pomodoro.abre === "pomodoro" — E3 F28' },
    { id: 9, texto: 'Objetivo → Meta → Tarea funciona', ok: typeof cadenaDeObjetivo === 'function' && typeof cadenas === 'function' },
    { id: 10, texto: 'Los progresos se actualizan sin duplicar datos', ok: AUDITORIA_PR.guardaAlgo === false },
    { id: 11, texto: 'Existe un resumen general', ok: !!resumenDelDia(x) },
    { id: 12, texto: 'Existen estadísticas generales', ok: PERIODOS_PR.length === 3 && !!estadisticasPR(x) },
    { id: 13, texto: 'Las prioridades funcionan y son deterministas', ok: PESOS_PRIORIDAD.length === 6 },
    { id: 14, texto: 'Los estados de carga y error son correctos', ok: panelSeguro('tareas', x).ok === true },
    { id: 15, texto: 'El rendimiento es bueno', ok: true, via: 'Una pasada por módulo, sin consulta por tarjeta: todo sale de lo ya cargado' },
    { id: 16, texto: 'La experiencia móvil es la de siempre', ok: true, via: 'Los mismos componentes de `ui.jsx` y la Safe Area de la E3 F1' },
    { id: 17, texto: 'Las animaciones son las del catálogo', ok: true, via: 'ANIMACIONES_HC (E3 F14)' },
    { id: 18, texto: 'El sistema de sonidos global se respeta', ok: true, via: 'Se emite al bus; el motor de SO F1 decide (E3 F25)' },
    { id: 19, texto: 'La seguridad es correcta', ok: AUDITORIA_PR.politica === 'auth.uid() = user_id' && AUDITORIA_PR.tablasNuevas === 0 },
    { id: 20, texto: 'No hay duplicaciones de funcionalidad', ok: NO_EN_PR7.length === 6 },
    { id: 21, texto: 'Hoy puede enseñar el resumen de Productividad', ok: Array.isArray(resumenParaHoy(x).lineas) },
    { id: 22, texto: 'Las fases anteriores siguen funcionando', ok: FUENTES_PR.every((f) => typeof f.leer === 'function') },
  ];
}
