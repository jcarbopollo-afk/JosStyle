import { todayISO } from './helpers';
import {
  detalleDeProgreso, graficaDeProgreso, PERIODOS, periodo, PERIODO_TODO,
  PUNTOS_MINIMOS_GRAFICA, inicioDePeriodo,
} from './progresoEjercicios';
import {
  progresoDeEjercicio, aparicionesDeEjercicio, CLASES,
} from './progresion';
import {
  ejercicioPorId, nombreCompleto, musculoPrincipal, variantesDe, baseDe, equipo, agarre,
} from './ejercicios';
import { sesionDelHistorial, etiquetaDeFecha } from './historial';
import { ejerciciosDeSesion } from './entrenamiento';
import { resumenDeEjercicio, ESTADOS_EJERCICIO } from './finalizacion';
import { rangoEfectivoDeEjercicio } from './motorRangos';
import { tarjetaSiguienteRango } from './siguienteRango';
import { listaDeObjetivos } from './objetivosProgreso';

/* ===========================================================================
   ENTREGA 4 · FASE 29/45 — ANÁLISIS AVANZADO DE RENDIMIENTO POR EJERCICIO
   ===========================================================================

   *"¿Cómo estoy progresando realmente en este ejercicio?"*, contestado con las
   ocho preguntas del apartado 40: última marca, anterior, mejor, si mejora,
   cómo ha evolucionado, qué rango tiene, si hay objetivo y qué hizo antes.

   🚨 **NO SE CREA UNA LÓGICA DE PROGRESO NUEVA** (contexto y apartados 8 y 39,
   que además prohíben tocar `getExerciseProgress` y el RankEngine). Toda la
   comparación es de la **F11** (`progresion.js`) y llega ya ordenada por la
   **F12** (`detalleDeProgreso`): esta fase **añade** lo que faltaba alrededor
   —cabecera, rango, objetivo, selector de métrica, variantes, series omitidas
   y estados— y no vuelve a decidir ni una tendencia.

   🚨 **Y NO SE GUARDA NADA** (apartado 32): el detalle se deriva de
   `WorkoutSession` + `ExerciseProgress` + `RankEngine` + `ProgressGoal`. Es la
   F15, la F22, la F24 y la F28 por quinta vez en esta entrega.
   =========================================================================== */

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LO QUE YA LO RESOLVÍA (y por eso no se escribe aquí)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ Cinco de los nueve datos del apartado 1 **ya los daba la F12**, y el
   apartado 31 lo dice: *"No duplicar componentes existentes"*. Se guardan **las
   funciones**, no sus nombres: renombrar una rompe la compilación (F27). */

export const YA_LO_RESUELVE = [
  { pide: 'Apartados 4, 5 y 6 · último, anterior y mejor resultado', es: detalleDeProgreso, nombre: 'detalleDeProgreso', de: 'FIT F12' },
  { pide: 'Apartado 8 · la tendencia', es: progresoDeEjercicio, nombre: 'progresoDeEjercicio', de: 'FIT F11' },
  { pide: 'Apartado 9 · el gráfico, con la unidad de su métrica', es: graficaDeProgreso, nombre: 'graficaDeProgreso', de: 'FIT F12' },
  { pide: 'Apartados 3 y 25 · el rango del ejercicio', es: rangoEfectivoDeEjercicio, nombre: 'rangoEfectivoDeEjercicio', de: 'FIT F19' },
  { pide: 'Apartado 25 · el progreso hacia el siguiente rango', es: tarjetaSiguienteRango, nombre: 'tarjetaSiguienteRango', de: 'FIT F23' },
  { pide: 'Apartados 23 y 24 · el objetivo y si está conseguido', es: listaDeObjetivos, nombre: 'listaDeObjetivos', de: 'FIT F14' },
  { pide: 'Apartados 18 y 19 · series omitidas, añadidas y sesión parcial', es: resumenDeEjercicio, nombre: 'resumenDeEjercicio', de: 'FIT F8' },
  { pide: 'Apartado 20 · qué variantes tiene un ejercicio', es: variantesDe, nombre: 'variantesDe', de: 'FIT F2' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LOS PERIODOS (apartado 12)
   ═══════════════════════════════════════════════════════════════════════════
   *"7 días, 30 días, 3 meses, 6 meses, 1 año, Todo. Por defecto 3 meses si
   existen suficientes datos; si no, Todo."*

   ⚠️ **Son los del catálogo de la F12, no una copia.** El resumen de la F28
   ofrece cuatro y esta pantalla seis: dos subconjuntos declarados por ids sobre
   **un solo catálogo**, que es lo que impide que «3 meses» acabe valiendo una
   cosa aquí y otra allí. */

export const PERIODOS_EJERCICIO = PERIODOS;
export const PERIODO_PREFERIDO = '3m';

/**
 * ⚠️ *"si existen suficientes datos"* es **los que hacen falta para la gráfica**
 * (`PUNTOS_MINIMOS_GRAFICA`, F12), no un número nuevo: entrar en «3 meses» y ver
 * el hueco de «hacen falta tres registros» sería empezar por la pantalla vacía.
 */
export function periodoPorDefecto(apariciones, { hoy = todayISO() } = {}) {
  const p = periodo(PERIODO_PREFERIDO);
  const desde = inicioDePeriodo(p.dias, hoy);
  const dentro = lista(apariciones).filter((a) => texto(a.fecha) >= desde).length;
  return dentro >= PUNTOS_MINIMOS_GRAFICA ? PERIODO_PREFERIDO : PERIODO_TODO;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LA CABECERA (apartados 2 y 28)
   ═══════════════════════════════════════════════════════════════════════════ */

export const EJERCICIO_ARCHIVADO = 'Ejercicio archivado';
export const TEXTO_ARCHIVADO = 'Este ejercicio ya no está en el catálogo, pero tus entrenamientos siguen aquí.';

/**
 * *"DOMINADAS / Agarre pronado · Peso corporal / Espalda"* (apartado 2).
 *
 * 🚨 Apartado 28 — **si el ejercicio ya no está en el catálogo, los datos NO se
 * borran**: los resultados y las fechas se conservan enteros, y se dice
 * «Ejercicio archivado».
 *
 * ⚠️ **Pero el «nombre histórico» que pide ese apartado no existe en ninguna
 * parte, y es a propósito** (C-36). La FIT F3 decidió que una línea guarda
 * `exerciseId` *"y nada más del ejercicio — ni el nombre, ni los músculos, ni el
 * equipamiento"*, para que renombrar uno lo renombre en las veinte rutinas donde
 * esté (AS F1); y `aparicionesDeSesion` hace `nombre: ej ? ej.nombre :
 * exerciseId`. Así que lo único que sobrevive a que se borre del catálogo es
 * **su id**, y es lo que se enseña: inventarle un nombre ahora sería reescribir
 * el pasado (F22), y esconderlo dejaría varios archivados indistinguibles.
 */
export function cabeceraDeEjercicio(exerciseId, { propios = [], apariciones = [] } = {}) {
  const id = texto(exerciseId);
  const ej = ejercicioPorId(id, propios);
  const historica = lista(apariciones)[0] || null;
  if (!ej) {
    return {
      exerciseId: id,
      existe: false,
      archivado: true,
      /* El nombre que tenía cuando lo entrenó, nunca el id pelado. */
      nombre: (historica && texto(historica.nombre)) || id,
      variante: (historica && texto(historica.variante)) || '',
      linea: '',
      grupo: '',
      grupoId: null,
      aviso: EJERCICIO_ARCHIVADO,
      avisoTexto: TEXTO_ARCHIVADO,
    };
  }
  const principal = musculoPrincipal(ej);
  /* ⚠️ `agarre` y `equipo` son los buscadores del catálogo de la F2: el
     ejercicio guarda **ids** (`ej.agarre`, `ej.equipamiento`), no las fichas. */
  const elAgarre = agarre(texto(ej.agarre));
  const elEquipo = lista(ej.equipamiento).map((e) => equipo(texto(e))).filter(Boolean);
  /* ⚠️ Solo lo que de verdad tiene: un «· » suelto porque falta el agarre deja
     la cabecera diciendo que hay un dato donde no lo hay (regla 8). */
  const trozos = [
    elAgarre ? `Agarre ${elAgarre.nombre.toLowerCase()}` : '',
    elEquipo.map((e) => e.nombre).join(', '),
  ].filter(Boolean);
  return {
    exerciseId: id,
    existe: true,
    archivado: false,
    nombre: nombreCompleto(ej),
    variante: texto(ej.variante),
    linea: trozos.join(' · '),
    grupo: principal ? principal.grupo : '',
    grupoId: principal ? principal.grupoId : null,
    aviso: '',
    avisoTexto: '',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · EL SELECTOR DE MÉTRICA (apartados 10 y 11)
   ═══════════════════════════════════════════════════════════════════════════
   🚨 *"No crear un gráfico «Rendimiento total» sumando kg + reps + segundos"*
   (apartado 10). Cada clase de la F11 —carga, lastre, repeticiones, tiempo— es
   **su propia línea, con su unidad**, y lo único que hace el selector es elegir
   cuál se mira.

   ⚠️ *"Pero solo cuando ambas existan realmente. No mostrar selectores
   inútiles"* (apartado 11): con una sola clase registrada no hay selector. */

export function metricasDisponibles(apariciones) {
  const vistas = [];
  lista(apariciones).forEach((a) => {
    if (!a || !a.clase || vistas.some((v) => v.id === a.clase)) return;
    const c = CLASES.find((x) => x.id === a.clase);
    if (c) vistas.push({ id: c.id, nombre: c.nombre, registros: 0 });
  });
  vistas.forEach((v) => { v.registros = lista(apariciones).filter((a) => a.clase === v.id).length; });
  return vistas;
}

/** La que se enseña: la pedida si existe de verdad, y si no la de la última vez. */
export function metricaElegida(apariciones, pedida = null) {
  const hay = metricasDisponibles(apariciones);
  const p = texto(pedida);
  if (p && hay.some((m) => m.id === p)) return p;
  return lista(apariciones)[0]?.clase || null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LAS VARIANTES (apartados 20 y 21)
   ═══════════════════════════════════════════════════════════════════════════ */

export const AVISO_VARIANTE = 'Esta variante tiene un historial separado.';

/**
 * 🚨 *"No mezclar sus gráficos automáticamente"* (apartado 20). Cada variante es
 * un `exerciseId` distinto —y la F11 solo compara el mismo id—, así que aquí no
 * hay nada que separar: **ya están separadas**. Lo que se hace es **decirlo** y
 * ofrecer ir a la otra, con cuántos registros tiene cada una.
 *
 * 🐛 **Y se mira la FAMILIA ENTERA, no los hijos.** `variantesDe` solo baja: de
 * las dominadas lastradas devuelve **nada**, porque su `base` es la prona y ella
 * no tiene hijas. Así que el aviso no salía nunca **justo en el caso del
 * apartado 21** —*"Si el usuario cambia de variante"*—, que es estando EN una.
 * La familia es la raíz (`baseDe(ej) || ej`) más sus variantes, que es el
 * ejemplo del apartado 20: *"Dominadas / Dominadas neutras / Dominadas
 * lastradas"* son hermanas, no madre e hijas. **Lo cazó el recorrido.**
 */
export function variantesDelEjercicio(fitness, exerciseId, { propios = [] } = {}) {
  const id = texto(exerciseId);
  const ej = ejercicioPorId(id, propios);
  if (!ej) return { hay: false, aviso: '', otras: [] };
  const raiz = baseDe(ej, propios) || ej;
  const familia = [raiz, ...variantesDe(raiz, propios)];
  const otras = familia
    .filter((v, i) => v.id !== id && familia.findIndex((x) => x.id === v.id) === i)
    .map((v) => ({
      exerciseId: v.id,
      nombre: nombreCompleto(v),
      registros: aparicionesDeEjercicio(fitness, v.id, propios).length,
    }))
    /* ⚠️ Una variante que nunca ha hecho no aporta: llevaría a una pantalla
       vacía. Se ofrecen las que tienen historial. */
    .filter((v) => v.registros > 0);
  return {
    hay: otras.length > 0,
    aviso: otras.length > 0 ? AVISO_VARIANTE : '',
    otras,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · EL RANGO (apartados 3, 25 y 26)
   ═══════════════════════════════════════════════════════════════════════════ */

export const VER_HISTORIAL_RANGO = 'Ver evolución del rango';

/**
 * ⚠️ *"Utilizar RankEngine. No duplicar cálculos"* (apartado 3) y *"Reutilizar
 * Fase 23"* (apartado 25). Aquí no se calcula ni un punto: se piden los dos y se
 * reenvía lo que hace falta.
 *
 * ⚠️ Y el destino del historial es el de la **F22**, no otro (apartado 26).
 */
export function rangoDelEjercicio(fitness, exerciseId, { propios = [], perfil = null } = {}) {
  const id = texto(exerciseId);
  const r = rangoEfectivoDeEjercicio(fitness, id, { propios, perfil });
  if (!r || r.sinRango) {
    return { hay: false, nombre: '', rango: null, siguiente: null, destinoHistorial: null, vacio: 'Todavía no hay rango para este ejercicio.' };
  }
  const destino = { tipo: 'exercise', id };
  return {
    hay: true,
    rango: r.rango,
    nombre: r.nombre,
    score: r.score,
    confianzaNombre: r.confianzaNombre || null,
    provisional: !!r.provisional,
    estimado: !!r.estimado,
    /* La tarjeta del siguiente rango, con su barra y su «68 % hacia Experto». */
    siguiente: tarjetaSiguienteRango(fitness, destino, { propios, perfil }),
    destinoHistorial: destino,
    ctaHistorial: VER_HISTORIAL_RANGO,
    vacio: '',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · EL OBJETIVO (apartados 23 y 24)
   ═══════════════════════════════════════════════════════════════════════════ */

export const OBJETIVO_CONSEGUIDO = 'Objetivo conseguido';

/**
 * ⚠️ *"Utilizar ProgressGoal. No crear un objetivo nuevo"* (apartado 23): se
 * piden los de la F14 y se elige el de este ejercicio. Y un objetivo conseguido
 * se enseña **con su fecha real** (apartado 24), que la F14 saca de la sesión en
 * la que lo superó — no de hoy.
 */
export function objetivoDelEjercicio(fitness, exerciseId, { propios = [], hoy = todayISO() } = {}) {
  const id = texto(exerciseId);
  const todos = listaDeObjetivos(fitness, { filtro: 'todos', propios, hoy }).objetivos
    .filter((o) => o.exerciseId === id);
  /* Activo primero; si no hay, el conseguido más reciente. */
  const activo = todos.find((o) => o.estado === 'activo') || null;
  const completado = todos.find((o) => o.estado === 'completado') || null;
  const o = activo || completado;
  if (!o) return { hay: false, objetivo: null, conseguido: false, texto: '', fecha: '' };
  return {
    hay: true,
    objetivo: o,
    conseguido: o.estado === 'completado',
    /* *"12 / 15"*, que es lo que ya redacta la F14: ni un porcentaje inventado. */
    texto: o.progresoTexto,
    etiqueta: o.estado === 'completado' ? OBJETIVO_CONSEGUIDO : o.objetivoTexto,
    fecha: o.conseguidoEn || '',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · EL HISTORIAL, CON SUS SERIES (apartados 16, 17, 18, 19 y 27)
   ═══════════════════════════════════════════════════════════════════════════ */

export const ENTRENAMIENTO_PARCIAL = 'Entrenamiento parcial';

/**
 * Cada sesión donde aparece el ejercicio, con sus series **tal y como se
 * guardaron**: *"No ocultar los datos originales"* (apartado 17).
 *
 * 🚨 Apartado 18 — completada, omitida y añadida se distinguen, y **una omitida
 * no cuenta como rendimiento**: eso ya lo garantiza la F11, que solo indexa las
 * `hecha`. Aquí se enseñan las tres para que él vea lo que pasó de verdad.
 *
 * ⚠️ Apartado 19 — una sesión parcial **aparece igual**, marcada. Descartarla
 * sería esconder un entrenamiento que hizo.
 */
export function historialDelEjercicio(fitness, exerciseId, { propios = [], hoy = todayISO(), limite = null, filas = null } = {}) {
  const id = texto(exerciseId);
  /* 🚨 **Las filas ya vienen redactadas por la F12** —«65 kg × 10» y
     «Serie 1 — 65 kg × 10», numeradas como el historial—, así que aquí NO se
     vuelven a formatear: se **enriquecen**. Escribir un segundo formateador
     acabaría enseñando la misma serie de dos maneras (FIT F27). */
  const base = filas !== null
    ? lista(filas)
    : detalleDeProgreso(fitness, id, { propios, rango: PERIODO_TODO, hoy }).historial;
  const usadas = typeof limite === 'number' ? base.slice(0, Math.max(1, limite)) : base;
  return usadas.map((f) => {
    const sesion = sesionDelHistorial(fitness, f.sesionId);
    const enSesion = sesion
      ? ejerciciosDeSesion(sesion).find((e) => texto(e.exerciseId) === id) || null
      : null;
    const resumen = enSesion ? resumenDeEjercicio(enSesion, propios) : null;
    /* ⚠️ `resumenDeEjercicio` devuelve `estado`, **no `estadoNombre`**: el
       nombre vive en el catálogo de la F8. Leerlo del resumen daba `undefined`
       y la etiqueta se habría quedado muda para siempre (FIT F25 y F22). */
    const cat = resumen ? ESTADOS_EJERCICIO.find((e) => e.id === resumen.estado) : null;
    return {
      ...f,
      fechaTexto: etiquetaDeFecha(f.fecha, hoy),
      nombreSesion: sesion ? texto(sesion.nombre) : '',
      /* El desglose entero, con las omitidas y las añadidas (apartado 18). */
      estado: resumen ? resumen.estado : null,
      estadoNombre: cat ? cat.nombre : '',
      seriesTexto: resumen ? resumen.texto : '',
      omitidas: resumen ? resumen.omitidas : 0,
      anadidas: resumen ? resumen.anadidas : 0,
      /* Apartado 19 — parcial se dice, no se descarta. */
      parcial: !!resumen && resumen.estado === 'parcial',
      avisoParcial: resumen && resumen.estado === 'parcial' ? ENTRENAMIENTO_PARCIAL : '',
      /* 🚨 Apartado 27 — *"Mostrar las notas de las sesiones"*, y *"No analizar
         automáticamente el texto"*: tal cual, sin resumen ni sentimiento. */
      nota: sesion ? texto(sesion.notas) : '',
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · DATOS CORRUPTOS Y ALTERNATIVA TEXTUAL (apartados 29 y 35)
   ═══════════════════════════════════════════════════════════════════════════ */

export const AVISO_CORRUPTOS = (n) => (n === 1
  ? 'Un registro de este periodo no se ha podido representar y se ha dejado fuera del gráfico.'
  : `${n} registros de este periodo no se han podido representar y se han dejado fuera del gráfico.`);

/** A partir de cuántos descartes el hueco deja de ser anecdótico (apartado 29). */
export const CORRUPTOS_SIGNIFICATIVOS = 1;

/**
 * 🚨 Apartado 29 — *"no romper todo el gráfico: ignorar únicamente el punto
 * inválido"*. Eso ya lo hace la F12, que filtra los valores no finitos; lo que
 * faltaba era **decirlo**, porque un punto que desaparece en silencio deja una
 * gráfica que miente por omisión.
 */
export function descartadosDelGrafico(apariciones, grafica, { rango = PERIODO_TODO, hoy = todayISO() } = {}) {
  const p = periodo(rango);
  const desde = inicioDePeriodo(p.dias, hoy);
  const candidatos = lista(apariciones)
    .filter((a) => a && a.clase === grafica.clase && a.mejor && (!desde || a.fecha >= desde)).length;
  const fuera = Math.max(0, candidatos - lista(grafica.puntos).length);
  return {
    cuantos: fuera,
    significativo: fuera >= CORRUPTOS_SIGNIFICATIVOS,
    aviso: fuera >= CORRUPTOS_SIGNIFICATIVOS ? AVISO_CORRUPTOS(fuera) : '',
  };
}

/**
 * 🚨 Apartado 35 — *"El gráfico debe tener una alternativa textual"*. Y dice lo
 * que dice el gráfico, ni una palabra más: el mejor resultado con su fecha, y
 * cuántos registros hay en el periodo. Nada que el dato no sostenga.
 */
export function alternativaTextual(detalle, grafica) {
  const puntos = lista(grafica && grafica.puntos);
  if (!puntos.length) return '';
  const mejor = puntos.reduce((a, b) => (b.valor > a.valor ? b : a));
  const cuantos = puntos.length === 1 ? '1 registro' : `${puntos.length} registros`;
  const marca = detalle && detalle.mejor ? detalle.mejor.texto : mejor.texto;
  return `${grafica.etiqueta}: ${cuantos} en este periodo. Tu mejor resultado fue ${marca}, el ${mejor.fechaTexto}.`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   10 · LOS ESTADOS (apartado 36)
   ═══════════════════════════════════════════════════════════════════════════ */

export const ESTADOS_DETALLE = [
  { id: 'cargando', nombre: 'Cargando', deLaPantalla: true, donde: 'La pantalla de carga de la aplicación (E3 F14): `app_data` llega entero al entrar.' },
  { id: 'sin_datos', nombre: 'Sin registros todavía' },
  { id: 'primer_registro', nombre: 'Un solo registro' },
  { id: 'pocos_registros', nombre: 'Pocos registros' },
  { id: 'suficientes', nombre: 'Con datos suficientes' },
  { id: 'archivado', nombre: 'Ejercicio archivado' },
  { id: 'error', nombre: 'No se ha podido calcular' },
];
export const estadoDetalle = (id) => ESTADOS_DETALLE.find((e) => e.id === texto(id)) || null;

export const VACIOS_DETALLE = {
  sin_datos: 'Todavía no has registrado este ejercicio.',
  primer_registro: 'Primer registro: repítelo para poder comparar.',
  pocos_registros: 'Con más registros aparecerá la evolución.',
};

/** 🚨 Apartado 13 — con un solo registro **se enseña el resultado**, pero no se
 *  inventa una tendencia: eso es «Primer registro», que ya dice la F12. */
export function estadoDelDetalle(veces, { archivado = false } = {}) {
  if (archivado) return 'archivado';
  if (!veces) return 'sin_datos';
  if (veces === 1) return 'primer_registro';
  if (veces < PUNTOS_MINIMOS_GRAFICA) return 'pocos_registros';
  return 'suficientes';
}

export const ERROR_DETALLE = {
  titulo: 'No hemos podido calcular este ejercicio.',
  texto: 'Puede ser un dato guardado que no se entiende. Tus entrenamientos siguen ahí.',
  cta: 'Reintentar',
};

/* ═══════════════════════════════════════════════════════════════════════════
   11 · LA PANTALLA ENTERA (apartados 1, 31 y 40)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `ExerciseProgressDetail` en datos.
 *
 * 🚨 Las ocho preguntas del apartado 40 se contestan **todas desde la misma
 * fuente**: lo que aquí se junta ya venía decidido por la F11, la F12, la F19,
 * la F23, la F14 y la F8. Ni una comparación nueva, ni un récord guardado.
 */
export function detalleCompletoDeEjercicio(fitness, exerciseId, {
  propios = [], perfil = null, hoy = todayISO(), rango = null, metrica = null, limiteHistorial = null,
} = {}) {
  const id = texto(exerciseId);
  try {
    const apariciones = aparicionesDeEjercicio(fitness, id, propios);
    const cabecera = cabeceraDeEjercicio(id, { propios, apariciones });
    const elegido = rango && periodo(rango).id === rango ? rango : periodoPorDefecto(apariciones, { hoy });
    const clase = metricaElegida(apariciones, metrica);
    const base = detalleDeProgreso(fitness, id, { propios, rango: elegido, hoy });
    /* ⚠️ La gráfica se vuelve a pedir **con la métrica elegida**: la de `base`
       es la de la última vez, que es lo correcto por defecto (F12). */
    const p = progresoDeEjercicio(fitness, id, { propios });
    const grafica = graficaDeProgreso(p, { rango: elegido, hoy, clase });
    const metricas = metricasDisponibles(apariciones);
    const estado = estadoDelDetalle(apariciones.length, { archivado: !cabecera.existe && apariciones.length > 0 });
    return {
      error: null,
      exerciseId: id,
      estado,
      estadoNombre: estadoDetalle(estado).nombre,
      vacio: VACIOS_DETALLE[estado] || '',
      cabecera,
      /* Lo que ya daba la F12: último, anterior, mejor, tendencia e historial. */
      progreso: base,
      tendencia: { estado: base.estado, nombre: base.estadoNombre, simbolo: base.simbolo },
      periodo: elegido,
      periodos: PERIODOS_EJERCICIO,
      grafica,
      /* Apartado 11 — el selector solo si hay más de una métrica de verdad. */
      metricas,
      metrica: clase,
      hayselector: metricas.length > 1,
      descartados: descartadosDelGrafico(apariciones, grafica, { rango: elegido, hoy }),
      alternativa: alternativaTextual(base, grafica),
      rango: rangoDelEjercicio(fitness, id, { propios, perfil }),
      objetivo: objetivoDelEjercicio(fitness, id, { propios, hoy }),
      variantes: variantesDelEjercicio(fitness, id, { propios }),
      /* ⚠️ Se le pasan **las filas que la F12 ya ha redactado**: pedirle el
         detalle otra vez sería recorrer las sesiones dos veces para obtener
         exactamente lo mismo. Y su historial **no lo recorta el periodo** (es
         `p.apariciones` entero), que es lo correcto: el periodo filtra la
         gráfica, no lo que hizo (apartado 12). */
      historial: historialDelEjercicio(fitness, id, { propios, hoy, limite: limiteHistorial, filas: base.historial }),
      veces: apariciones.length,
    };
  } catch (e) {
    return {
      error: { ...ERROR_DETALLE, detalle: (e && e.message) || '' },
      exerciseId: id,
      estado: 'error',
      estadoNombre: estadoDetalle('error').nombre,
      vacio: '',
      cabecera: { exerciseId: id, existe: false, archivado: false, nombre: id, variante: '', linea: '', grupo: '', grupoId: null, aviso: '', avisoTexto: '' },
      progreso: null,
      tendencia: null,
      periodo: PERIODO_TODO,
      periodos: PERIODOS_EJERCICIO,
      grafica: { puntos: [], mostrar: false, etiqueta: '', unidad: '' },
      metricas: [],
      metrica: null,
      hayselector: false,
      descartados: { cuantos: 0, significativo: false, aviso: '' },
      alternativa: '',
      rango: { hay: false, nombre: '', rango: null, siguiente: null, destinoHistorial: null, vacio: '' },
      objetivo: { hay: false, objetivo: null, conseguido: false, texto: '', fecha: '' },
      variantes: { hay: false, aviso: '', otras: [] },
      historial: [],
      veces: 0,
    };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   12 · LO QUE NO SE CONSTRUYE (apartados 7, 22, 30 y 39)
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT29 = [
  { que: 'Un sistema de récords personales aparte', porque: 'Apartado 7, literal: «No crear un sistema de PR separado». El mejor histórico es el de la F11, y si coincide se dice «Mejor marca registrada».' },
  { que: 'Un gráfico de «rendimiento total»', porque: 'Apartado 10: sumar kg + reps + segundos es dibujar tres cosas distintas como si fueran una. Cada clase conserva su unidad.' },
  { que: 'Un dato de «última vez» dentro del entrenamiento en vivo', porque: 'Apartado 22: la fuente es el historial, y la F11 ya tiene `ultimaVez()`. Duplicarlo sería la segunda verdad de siempre.' },
  { que: 'Conversión automática de unidades', porque: 'Apartado 30: si él trabaja en kg, se enseñan kg. Convertir sin necesidad es cambiarle el dato que escribió.' },
  { que: 'IA, predicciones y estimación de hipertrofia', porque: 'Apartado 39.' },
  { que: 'Recomendaciones automáticas', porque: 'Apartado 39, y regla 7: la IA sugiere a un toque, nunca sola.' },
  { que: 'Comparación social, leaderboard, XP y gamificación', porque: 'Apartado 39, y D2-02.' },
  { que: 'Un resumen guardado del detalle', porque: 'Apartado 32: se deriva de WorkoutSession + ExerciseProgress + RankEngine + ProgressGoal.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   12 bis · LOS COMPONENTES DEL APARTADO 31
   ═══════════════════════════════════════════════════════════════════════════
   *"Crear/reutilizar"* y, dos líneas después, *"No duplicar componentes
   existentes"*. De los catorce, **cinco ya estaban escritos** — es la F23, la
   F24 y la F25 por cuarta vez en esta entrega.

   ⚠️ Se declaran por **nombre y archivo**, no importando el componente: una
   librería que importara JSX de `components/` cerraría el ciclo que la F24 y la
   F27 ya evitaron. La prueba **abre cada archivo** y busca la definición: una
   tabla que solo se cuenta a sí misma no demuestra nada (EH F42). */

export const COMPONENTES_FIT29 = [
  { nombre: 'ExerciseProgressDetail', es: 'DetalleProgreso', archivo: 'src/views/ProgresoView.jsx', nuevo: false, de: 'FIT F12' },
  { nombre: 'ExerciseProgressHeader', es: 'ExerciseProgressHeader', archivo: 'src/components/detalleEjercicio.jsx', nuevo: true, de: 'FIT F29' },
  { nombre: 'ExercisePerformanceSummary', es: 'ExercisePerformanceSummary', archivo: 'src/components/detalleEjercicio.jsx', nuevo: true, de: 'FIT F29' },
  { nombre: 'ExerciseLatestResult', es: 'ExerciseLatestResult', archivo: 'src/components/detalleEjercicio.jsx', nuevo: true, de: 'FIT F29' },
  { nombre: 'ExercisePreviousResult', es: 'ExercisePreviousResult', archivo: 'src/components/detalleEjercicio.jsx', nuevo: true, de: 'FIT F29' },
  { nombre: 'ExerciseBestResult', es: 'ExerciseBestResult', archivo: 'src/components/detalleEjercicio.jsx', nuevo: true, de: 'FIT F29' },
  { nombre: 'ExerciseTrend', es: 'EtiquetaEstado', archivo: 'src/components/resumenProgreso.jsx', nuevo: false, de: 'FIT F12 y F28' },
  { nombre: 'ExerciseProgressChart', es: 'GraficaProgreso', archivo: 'src/views/ProgresoView.jsx', nuevo: false, de: 'FIT F12' },
  { nombre: 'ExerciseMetricSelector', es: 'ExerciseMetricSelector', archivo: 'src/components/detalleEjercicio.jsx', nuevo: true, de: 'FIT F29' },
  { nombre: 'ExerciseHistory', es: 'ExerciseHistory', archivo: 'src/components/detalleEjercicio.jsx', nuevo: true, de: 'FIT F29' },
  { nombre: 'ExerciseSessionEntry', es: 'FilaHistoria', archivo: 'src/views/ProgresoView.jsx', nuevo: false, de: 'FIT F12' },
  { nombre: 'ExerciseSetBreakdown', es: 'ExerciseSetBreakdown', archivo: 'src/components/detalleEjercicio.jsx', nuevo: true, de: 'FIT F29' },
  { nombre: 'ExerciseGoalPreview', es: 'ExerciseGoalPreview', archivo: 'src/components/detalleEjercicio.jsx', nuevo: true, de: 'FIT F29' },
  { nombre: 'ExerciseRankPreview', es: 'ExerciseRankPreview', archivo: 'src/components/detalleEjercicio.jsx', nuevo: true, de: 'FIT F29' },
];

export const DECISIONES_FIT29 = [
  {
    que: 'Los seis periodos salen del catálogo de la F12, que pasa a tener seis',
    porque: 'El apartado 12 pide seis aquí y el 16 de la F28 pide cuatro allí. Con dos catálogos, el día que uno cambiara «3 meses» valdría 91 días en una pantalla y otra cosa en la otra: hay uno solo y dos subconjuntos por ids (FIT F27 con TAGS_ORIENTACION).',
  },
  {
    que: '«Suficientes datos» para entrar en 3 meses son los de la gráfica',
    porque: 'Apartado 12. Si fuera un número nuevo, entrar en «3 meses» podría dejar el hueco de «hacen falta tres registros»: empezar por la pantalla vacía.',
  },
  {
    que: 'El selector de métrica pide la gráfica con una clase, y la F12 la acepta',
    porque: 'Apartado 11. Omitida, `graficaDeProgreso` sigue usando la de la última vez, que es lo que decidió la F12: esto amplía su firma, no cambia lo que ya hacía (C-34, FIT F25).',
  },
  {
    que: 'Las variantes NO hay que separarlas: ya lo están',
    porque: 'Apartado 20. Cada variante es un `exerciseId` distinto y la F11 solo compara el mismo id. Lo que faltaba era decirlo (apartado 21) y ofrecer ir a la otra.',
  },
  {
    que: 'Una variante sin registros no se ofrece',
    porque: 'Llevaría a una pantalla vacía. Se ofrecen las que tienen historial (regla 8).',
  },
  {
    que: 'Un punto descartado del gráfico se dice, no desaparece en silencio',
    porque: 'Apartado 29. La F12 ya ignoraba los valores no finitos; lo que faltaba era el aviso, porque una gráfica con un hueco callado miente por omisión.',
  },
  {
    que: 'De un ejercicio archivado sobrevive su id, no un «nombre histórico»',
    porque: 'Apartado 28 pide conservarlo y **no existe**: la FIT F3 decidió que una línea guarda solo `exerciseId` —para que renombrar uno llegue a las veinte rutinas donde esté (AS F1)—, así que al borrarlo del catálogo no queda ningún nombre que conservar. Lo que sí se conserva entero son los resultados y las fechas, que es lo que ese apartado protege de verdad. C-36 en docs/03.',
  },
  {
    que: 'El aviso de datos descartados es defensivo, y se declara como tal',
    porque: 'Apartado 29. Medido: un peso no finito NO llega a la gráfica —`numeroONull` lo deja en `null` y la aparición se reclasifica de «carga» a «repeticiones»—, así que el registro no se pierde, cambia de métrica. El aviso queda para el caso que `graficaDeProgreso` sí filtra (`Number.isFinite`), con una prueba que lo pone rojo a mano: un detector correcto que hoy no salta es distinto de un control decorativo (regla 8).',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   13 · AUDITORÍA (apartados 37 y 40)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ Recibe el detalle ya calculado a propósito (EH F42): así una prueba puede
   darle uno fabricado y ver las casillas ponerse rojas. */

export const AUDITORIA_FIT29 = {
  tablasNuevas: 0,
  clavesNuevas: 0,
  politica: 'auth.uid() = user_id',
  guardaAlgo: false,
  normalizador: false,
  /* Apartado 32 — de dónde sale cada cosa. */
  fuentes: ['WorkoutSession', 'ExerciseProgress (F11)', 'RankEngine (F19)', 'ProgressGoal (F14)'],
};

/** Las ocho preguntas del apartado 40, comprobadas sobre el detalle de verdad. */
export function casillasDelDetalle(detalle) {
  const d = detalle || {};
  const p = d.progreso || {};
  return [
    { id: 'ultima', ok: !!p.ultima, que: '¿Cuál fue mi última marca?' },
    { id: 'anterior', ok: !!p.comparacion || p.soloUna === true, que: '¿Cuál fue la anterior?' },
    { id: 'mejor', ok: !!p.mejor || p.soloUna === true, que: '¿Cuál es mi mejor resultado?' },
    { id: 'mejorando', ok: !!(d.tendencia && d.tendencia.nombre), que: '¿Estoy mejorando?' },
    { id: 'evolucion', ok: !!(d.grafica && (d.grafica.mostrar || d.grafica.motivo)), que: '¿Cómo ha evolucionado?' },
    { id: 'rango', ok: !!(d.rango && (d.rango.hay || d.rango.vacio)), que: '¿Cuál es mi rango?' },
    { id: 'objetivo', ok: !!d.objetivo, que: '¿Tengo algún objetivo?' },
    { id: 'historial', ok: Array.isArray(d.historial), que: '¿Qué hice en entrenamientos anteriores?' },
    { id: 'no_guarda', ok: AUDITORIA_FIT29.guardaAlgo === false, que: 'El detalle se deriva, no se guarda' },
    { id: 'una_unidad', ok: !!(d.grafica && (!d.grafica.mostrar || !!d.grafica.unidad)), que: 'El gráfico conserva la unidad de su métrica' },
  ];
}

export function auditarDetalle(fitness, exerciseId, opciones = {}) {
  const detalle = detalleCompletoDeEjercicio(fitness, exerciseId, opciones);
  const casillas = casillasDelDetalle(detalle);
  return { detalle, casillas, ok: casillas.every((c) => c.ok) };
}

export default detalleCompletoDeEjercicio;
