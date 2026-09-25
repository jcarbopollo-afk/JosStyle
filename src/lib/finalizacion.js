import { todayISO } from './helpers';
import { VISIBILIDADES, ESTADOS_SESION } from './fitness';
import { ejercicioPorId } from './ejercicios';
import { nombreDeLinea } from './constructor';
import {
  ejerciciosDeSesion, duracionSesion, reloj, reanudarSesion, guardarSesion,
} from './entrenamiento';

/* Entrega 4 · Fase 8/45 — «Finalización y guardado del entrenamiento».
   ═══════════════════════════════════════════════════════════════════════════

   El criterio de finalización: *"Empezar entrenamiento → entrenar → Terminar →
   revisar resumen → modificar nombre/notas → guardar → cerrar aplicación →
   volver y encontrar la sesión correctamente guardada."* Y también *"entrenar
   parcialmente → guardar"* y *"entrenar → descartar"* **sin generar registros
   incorrectos**.

   ───────────────────────────────────────────────────────────────────────────
   1 · LO QUE YA EXISTÍA (el enunciado lo pide antes de tocar nada)
   ───────────────────────────────────────────────────────────────────────────

   🚨 **LA SESIÓN, EL SNAPSHOT Y LAS SERIES SON LOS DE LA F7**, y las notas por
   ejercicio también. Esta fase **no vuelve a registrar nada**: el apartado 3 lo
   prohíbe con todas las letras (*"No dupliques la lógica de registro de
   series"*). Lo que hace es **leer** lo que la F7 dejó y convertirlo en un
   resumen, más los cuatro campos que el resumen necesita y no existían.

   🚨 **Y `notas` YA ERA UN CAMPO DE LA SESIÓN** desde la F1. La nota general del
   apartado 13 es ésa, no una nueva: dos campos para lo mismo acaban diciendo
   cosas distintas (E3 F44, con el `nombre` que un examen ya tenía).

   ───────────────────────────────────────────────────────────────────────────
   2 · «FINALIZANDO» ES UN ESTADO, Y HACE FALTA (apartado 28)
   ───────────────────────────────────────────────────────────────────────────

   *"Si la aplicación se cierra en la pantalla de finalización antes de guardar:
   la información debe seguir recuperable. Al volver: mostrar la opción de
   continuar con la finalización."*

   🚨 Sin un estado propio habría que elegir entre **perder lo revisado** o
   **darlo por completado sin que él lo confirme**, y el apartado 16 prohíbe lo
   segundo. Así que Terminar la pasa a `finalizando` **y la guarda ahí mismo**:
   a partir de ese momento el entrenamiento existe aunque se caiga la
   aplicación, y sigue sin contar como hecho.

   ⚠️ **Y el reloj se para al entrar**, no al guardar: `terminadaEn` es cuándo
   acabó de entrenar. Si se sumara el rato que pasa escribiendo la nota, una
   sesión de 45 minutos saldría de 52 (apartado 22).

   ───────────────────────────────────────────────────────────────────────────
   3 · UNA SERIE CUENTA SI ÉL LA MARCÓ, NUNCA POR ESTAR PLANIFICADA
   ───────────────────────────────────────────────────────────────────────────

   Apartado 6, literal: *"No contar como completada una serie simplemente porque
   estaba planificada."* Y el 10 lo extiende al ejercicio: sin ninguna serie
   hecha es **No realizado**, con algunas es **parcial** (*"2/3 series"*).

   ───────────────────────────────────────────────────────────────────────────
   4 · Y NINGUNA MÉTRICA QUE NO SE PUEDA CALCULAR (apartados 8 y 9)
   ───────────────────────────────────────────────────────────────────────────

   *"No mostrar métricas que no puedan calcularse correctamente. Por ejemplo: NO
   mostrar calorías quemadas si no existe un modelo fiable."* Y con el volumen:
   *"no contar ejercicios sin peso como si tuvieran una carga inventada […] Si el
   cálculo no es fiable: simplemente no mostrar volumen."*

   🚨 Así que el volumen sale **solo de las series que tienen peso Y
   repeticiones**, se dice **de cuántas**, y si no hay ninguna vale `null` y la
   pantalla no lo pinta. Unas dominadas a peso corporal no son «0 kg» ni «70 kg»:
   son un ejercicio que no se mide así. */

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const lista = (v) => (Array.isArray(v) ? v : []);

/* ═══════════════════════════════════════════════════════════════════════════
   5 · EL NOMBRE (apartado 3)
   ═══════════════════════════════════════════════════════════════════════════ */

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/* ⚠️ En LOCAL, con `T00:00:00`: la trampa del UTC ya va por muchas, y aquí
   devolvería el día anterior en España. */
const comoFecha = (iso) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto(iso))) return null;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** *"Entrenamiento del sábado"*, o el nombre que traía del plan (apartado 3).
 *  ⚠️ Lo del plan **manda**: si la sesión salió de «Push», llamarla
 *  «Entrenamiento del sábado» sería perder información que él ya tenía. */
export function nombrePorDefecto(sesion) {
  const propio = texto(sesion?.nombre);
  if (propio && propio !== 'Entrenamiento') return propio;
  const d = comoFecha(sesion?.fecha);
  return d ? `Entrenamiento del ${DIAS[d.getDay()]}` : 'Entrenamiento';
}

/** *"12 septiembre 2026"* (apartado 4). */
export function fechaLarga(iso) {
  const d = comoFecha(iso);
  return d ? `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}` : '';
}

/** *"18:05"* a partir de una marca de tiempo. ⚠️ Del reloj del dispositivo, que
 *  es donde entrenó; `null` si no hay marca — nunca una hora inventada. */
export function horaDe(ms) {
  if (ms === null || ms === undefined) return '';
  const d = new Date(Number(ms));
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** *"57 min"* (apartado 5). ⚠️ Redondeado a minutos, que es la precisión que
 *  tiene sentido enseñar de un entrenamiento — y **no se estima**: sale de las
 *  marcas de tiempo de la F7. */
export function duracionEnMinutos(ms) {
  const min = Math.round((Number(ms) || 0) / 60000);
  if (min < 1) return 'menos de 1 min';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LAS CUENTAS (apartados 6, 9, 10 y 11)
   ═══════════════════════════════════════════════════════════════════════════ */

export const ESTADOS_EJERCICIO = [
  { id: 'realizado', nombre: 'Realizado', que: 'Todas las series que contaban, hechas.' },
  { id: 'parcial', nombre: 'Parcial', que: 'Algunas hechas y otras no (apartado 10).' },
  { id: 'no_realizado', nombre: 'No realizado', que: 'Ninguna serie marcada. Estar en el plan no cuenta.' },
];

/** El resumen de UN ejercicio (apartados 7 y 10). */
export function resumenDeEjercicio(ejercicio, propios = []) {
  const e = ejercicio;
  if (!e) return null;
  const series = lista(e.series);
  /* 🚨 Las omitidas salen del denominador, como en el progreso de la F7: no se
     hicieron **y no tocaba hacerlas** (`NO_TOCA`, E3 F24). Pero se cuentan
     aparte, porque el apartado 6 quiere enseñarlas. */
  const cuentan = series.filter((s) => s.estado !== 'omitida');
  const hechas = cuentan.filter((s) => s.estado === 'hecha');
  const omitidas = series.filter((s) => s.estado === 'omitida');
  const anadidas = series.filter((s) => s.origen === 'anadida');

  let estado = 'no_realizado';
  if (hechas.length > 0) estado = hechas.length === cuentan.length ? 'realizado' : 'parcial';

  /* Lo que de verdad hizo: peso y repeticiones **de las series marcadas**. */
  const pesos = hechas.map((s) => s.hecho?.peso).filter((v) => v !== null && v !== undefined);
  const reps = hechas.map((s) => s.hecho?.reps).filter((v) => v !== null && v !== undefined);
  const duraciones = hechas.map((s) => s.hecho?.duracion).filter((v) => v !== null && v !== undefined);
  const rango = (l) => (l.length === 0 ? '' : (Math.min(...l) === Math.max(...l)
    ? `${Math.min(...l)}` : `${Math.min(...l)}–${Math.max(...l)}`));

  const ej = ejercicioPorId(e.exerciseId, propios);
  return {
    id: e.id,
    exerciseId: e.exerciseId,
    nombre: nombreDeLinea(e, propios),
    existe: !!ej,
    estado,
    hechas: hechas.length,
    total: cuentan.length,
    /* *"2/3 series"* (apartado 10, su ejemplo). */
    texto: `${hechas.length}/${cuentan.length} ${cuentan.length === 1 ? 'serie' : 'series'}`,
    omitidas: omitidas.length,
    anadidas: anadidas.length,
    peso: rango(pesos),
    reps: rango(reps),
    duracion: rango(duraciones),
    modo: e.modo,
    notas: texto(e.notas),
    /* Apartado 12 — si se sustituyó, los DOS: el que hizo y el que el plan
       pedía. *"La sesión final debe conservar: ejercicio original, ejercicio
       realmente realizado."* */
    sustituido: !!e.sustituyeA,
    original: e.sustituyeA
      ? (ejercicioPorId(e.sustituyeA, propios)?.nombre || e.sustituyeA)
      : '',
  };
}

/** 🚨 El volumen del apartado 9, **solo si se puede calcular**. */
export function volumenDeSesion(sesion) {
  let kg = 0;
  let conPeso = 0;
  let sinPeso = 0;
  for (const e of ejerciciosDeSesion(sesion)) {
    for (const s of lista(e.series)) {
      if (s.estado !== 'hecha') continue;
      const p = s.hecho?.peso;
      const r = s.hecho?.reps;
      /* Las dos cosas, y un peso de verdad: `0 kg` es peso corporal, no carga. */
      if (p !== null && p !== undefined && p > 0 && r !== null && r !== undefined && r > 0) {
        kg += p * r;
        conPeso += 1;
      } else sinPeso += 1;
    }
  }
  /* ⚠️ Sin ni una serie con carga **no hay volumen**, y no es un cero: una
     rutina de calistenia entera no levantó 0 kg, es que no se mide así
     (apartado 9, literal: *"simplemente no mostrar volumen"*). */
  if (conPeso === 0) return null;
  return {
    kg: Math.round(kg),
    texto: `${Math.round(kg).toLocaleString('es-ES')} kg`,
    series: conPeso,
    /* Y se DICE cuántas quedan fuera, para que el número no parezca el total. */
    fuera: sinPeso,
    parcial: sinPeso > 0,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · EL RESUMEN ENTERO (apartados 2, 7 y 8)
   ═══════════════════════════════════════════════════════════════════════════ */

export function resumenDeSesion(sesion, { propios = [], ahora = Date.now() } = {}) {
  if (!sesion) return null;
  const ejercicios = ejerciciosDeSesion(sesion)
    .map((e) => resumenDeEjercicio(e, propios))
    .filter(Boolean);

  let hechas = 0;
  let total = 0;
  let omitidas = 0;
  let anadidas = 0;
  for (const e of ejercicios) {
    hechas += e.hechas;
    total += e.total;
    omitidas += e.omitidas;
    anadidas += e.anadidas;
  }
  const ms = duracionSesion(sesion, ahora);

  return {
    id: sesion.id,
    nombre: nombrePorDefecto(sesion),
    fecha: sesion.fecha,
    fechaTexto: fechaLarga(sesion.fecha),
    inicio: horaDe(sesion.iniciadaEn),
    fin: horaDe(sesion.terminadaEn),
    /* *"18:05 → 19:02"* (apartado 4). Sin una de las dos, no se dibuja la
       flecha: media franja horaria no dice nada. */
    franja: horaDe(sesion.iniciadaEn) && horaDe(sesion.terminadaEn)
      ? `${horaDe(sesion.iniciadaEn)} → ${horaDe(sesion.terminadaEn)}` : '',
    duracion: duracionEnMinutos(ms),
    duracionMs: ms,
    reloj: reloj(ms),
    ejercicios,
    ejerciciosHechos: ejercicios.filter((e) => e.estado !== 'no_realizado').length,
    seriesCompletadas: hechas,
    seriesPlanificadas: total,
    /* *"16/20 series completadas"* (apartado 25). */
    seriesTexto: `${hechas}/${total} ${total === 1 ? 'serie completada' : 'series completadas'}`,
    seriesOmitidas: omitidas,
    seriesAnadidas: anadidas,
    volumen: volumenDeSesion(sesion),
    notas: texto(sesion.notas),
    visibilidad: sesion.visibilidad || 'privado',
    /* Apartado 26 — un entrenamiento sin ni una serie marcada. */
    vacio: hechas === 0,
    sustituciones: ejercicios.filter((e) => e.sustituido).length,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · PASAR A LA FINALIZACIÓN (apartados 1 y 28)
   ═══════════════════════════════════════════════════════════════════════════ */

/** 🚨 Terminar **no guarda como completada** (apartado 16): pasa a `finalizando`
 *  y **se guarda ahí**, que es lo que hace recuperable la pantalla de resumen.
 *
 *  ⚠️ Y el reloj se para aquí: `terminadaEn` es cuándo acabó de entrenar, no
 *  cuándo pulsó guardar (apartado 22). */
export function pasarAFinalizacion(sesion, { ahora = Date.now() } = {}) {
  if (!sesion) return null;
  /* Si estaba en pausa, se cierra la pausa antes: el rato parado no cuenta. */
  const base = sesion.estado === 'pausada' ? reanudarSesion(sesion, ahora) : sesion;
  return {
    ...base,
    estado: 'finalizando',
    terminadaEn: base.terminadaEn || ahora,
    /* El nombre por defecto se calcula ya, para que el campo llegue relleno
       (apartado 3). ⚠️ Se calcula, no se inventa: sale de lo que ya tiene. */
    nombre: nombrePorDefecto(base),
  };
}

/** La que quedó en la pantalla de resumen sin guardar (apartado 28). */
export function sesionEnFinalizacion(fitness) {
  return lista((fitness || {}).sesiones)
    .filter((s) => s && s.estado === 'finalizando')
    .sort((a, b) => (b.terminadaEn || 0) - (a.terminadaEn || 0))[0] || null;
}

export const AVISO_RECUPERAR_FINAL = {
  titulo: 'Te quedó un entrenamiento sin guardar',
  texto: 'Lo terminaste pero no llegaste a guardarlo. Sigue donde lo dejaste.',
  continuar: 'Terminar de guardarlo',
  descartar: 'Descartar entrenamiento',
};

/* ═══════════════════════════════════════════════════════════════════════════
   9 · GUARDAR (apartados 16, 17, 18 y 21)
   ═══════════════════════════════════════════════════════════════════════════ */

/* Apartado 26 — casi vacío. ⚠️ **Se pregunta, no se bloquea**: el apartado 25
   dice *"No penalizar ni bloquear"*, así que se puede guardar igualmente. */
export const AVISO_SIN_SERIES = {
  titulo: 'No has completado ninguna serie',
  texto: '¿Quieres guardar igualmente este entrenamiento?',
  seguir: 'Seguir entrenando',
  guardar: 'Guardar igualmente',
};

/* Apartado 27 — descartar desde el resumen. ⚠️ Su texto NO es el de la F7: allí
   se descartaba una sesión en curso; aquí ya está terminada, y lo que se pierde
   es lo registrado. */
export const AVISO_DESCARTAR_FINAL = {
  titulo: '¿Descartar entrenamiento?',
  texto: 'Se perderán los datos registrados en esta sesión.',
  cancelar: 'Cancelar',
  descartar: 'Descartar',
};

export const TEXTO_GUARDANDO = 'Guardando entrenamiento…';

/** Qué día del plan se completó (apartado 21). ⚠️ Se guarda **lo que hace falta
 *  para reconstruirlo**, no una referencia que puede desaparecer (apartado 23):
 *  si él borra el plan, la sesión sigue sabiendo que aquel día se llamaba
 *  «Push». */
export function diaDePlanDe(sesion) {
  const o = sesion?.origen;
  if (!o || !texto(o.id)) return null;
  return {
    planId: sesion.planId || null,
    tipo: texto(o.tipo) || 'plan',
    diaId: texto(o.id),
    nombre: texto(sesion.nombre) || '',
  };
}

/** 🚨 **GUARDADO IDEMPOTENTE** (apartado 17, marcado como MUY IMPORTANTE):
 *  *"Evitar que pulsar dos veces rápidamente cree dos sesiones."*
 *
 *  Y sale de la forma del dato, no de un candado: una sesión **ya completada
 *  se devuelve tal cual**, sin tocar `guardadaEn` ni nada más. Pulsar cinco
 *  veces deja exactamente la misma sesión, con el mismo id, en el mismo sitio —
 *  `guardarSesion` sustituye por id desde la F7, así que tampoco puede
 *  duplicarla en la lista. */
export function guardarEntrenamiento(sesion, {
  nombre = null, notas = null, visibilidad = null,
  confirmado = false, ahora = Date.now(),
} = {}) {
  if (!sesion) return { ok: false, motivo: 'No hay ninguna sesión.', aviso: null, sesion: null };

  /* Idempotencia: ya está guardada, no se vuelve a guardar. */
  if (sesion.estado === 'completada') {
    return { ok: true, motivo: 'ya_guardada', aviso: null, sesion };
  }
  if (!ESTADOS_SESION.includes(sesion.estado)) {
    return { ok: false, motivo: 'La sesión tiene un estado que no existe.', aviso: null, sesion };
  }

  const resumen = resumenDeSesion(sesion, { ahora });
  /* Apartado 26 — sin ni una serie marcada, se pregunta una vez. */
  if (resumen.vacio && !confirmado) {
    return { ok: false, motivo: 'vacio', aviso: AVISO_SIN_SERIES, sesion };
  }

  const elegida = texto(visibilidad);
  return {
    ok: true,
    motivo: null,
    aviso: null,
    sesion: {
      ...sesion,
      estado: 'completada',
      /* Apartado 22 — `terminadaEn` es el fin del entrenamiento y no se mueve. */
      terminadaEn: sesion.terminadaEn || ahora,
      guardadaEn: ahora,
      nombre: nombre === null ? nombrePorDefecto(sesion) : (texto(nombre) || nombrePorDefecto(sesion)),
      notas: notas === null ? texto(sesion.notas) : texto(notas),
      visibilidad: VISIBILIDADES.some((v) => v.id === elegida && v.existe)
        ? elegida : (sesion.visibilidad || 'privado'),
      diaDePlan: sesion.diaDePlan || diaDePlanDe(sesion),
    },
  };
}

/** Descartar desde el resumen (apartado 27). ⚠️ **No borra otras sesiones**, y
 *  la suya se marca en vez de desaparecer: el historial de la F10 la verá. */
export function descartarEntrenamiento(sesion, { confirmado = false, ahora = Date.now() } = {}) {
  if (!sesion) return { ok: false, motivo: 'No hay ninguna sesión.', aviso: null, sesion: null };
  if (!confirmado) return { ok: false, motivo: 'confirmacion', aviso: AVISO_DESCARTAR_FINAL, sesion };
  return {
    ok: true,
    motivo: null,
    aviso: null,
    sesion: { ...sesion, estado: 'descartada', terminadaEn: sesion.terminadaEn || ahora },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   10 · LA PANTALLA DE ÉXITO (apartados 19 y 20)
   ═══════════════════════════════════════════════════════════════════════════

   *"No convertirlo en una pantalla llena de estadísticas. Priorizar: sensación
   de finalización, datos importantes, siguiente acción."* */

/* ⚠️ Los mensajes son **una tabla por umbrales**, sin azar y sin juicio: ni
   *"flojo"*, ni *"podrías más"*. Es `FRASES_RESUMEN` de la E3 F29. */
export const MENSAJES_FINAL = [
  { desde: 0, texto: 'Queda registrado.' },
  { desde: 1, texto: 'Sesión guardada.' },
  { desde: 10, texto: 'Buen trabajo.' },
  { desde: 20, texto: 'Sesión larga. Bien hecho.' },
];

export const mensajeFinal = (series) => [...MENSAJES_FINAL]
  .reverse().find((m) => (series || 0) >= m.desde).texto;

export function pantallaDeExito(sesion, { propios = [], ahora = Date.now() } = {}) {
  const r = resumenDeSesion(sesion, { propios, ahora });
  if (!r) return null;
  return {
    titulo: '¡Entrenamiento completado!',
    nombre: r.nombre,
    duracion: r.duracion,
    series: r.seriesCompletadas,
    seriesTexto: `${r.seriesCompletadas} ${r.seriesCompletadas === 1 ? 'serie' : 'series'}`,
    mensaje: mensajeFinal(r.seriesCompletadas),
    /* Apartado 20 — las dos que existen de verdad. ⚠️ **Compartir no está**: no
       hay sistema social, y el propio apartado lo dice — *"Si no existe una
       funcionalidad real de compartir, no mostrar un botón muerto."* */
    acciones: [
      { id: 'ver', nombre: 'Ver entrenamiento', que: 'Consultar el resumen guardado.' },
      { id: 'volver', nombre: 'Volver a Tu Plan', que: 'Regresar a la pantalla principal.' },
    ],
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   11 · LO QUE NO SE CONSTRUYE, CON SU MOTIVO
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT8 = [
  { que: 'El historial de entrenamientos y su pantalla', porque: 'Apartado 29: *"NO construir todavía la pantalla completa de historial. Simplemente garantizar que los datos estén bien estructurados."* Ya lo están: `fitness.sesiones`.' },
  { que: 'Gráficas, progresión y análisis de rendimiento', porque: 'El contexto los excluye, y con una sesión no hay nada que comparar (regla 8).' },
  { que: 'Rangos y progreso fotográfico', porque: 'El contexto los excluye. Las fotos, además, ya existen en Salud (`saludFotos`, FIT F1).' },
  { que: 'Compartir y cualquier cosa social', porque: 'Apartado 20: *"Si no existe una funcionalidad real de compartir, no mostrar un botón muerto."* Y el 15 deja la visibilidad preparada, no construida.' },
  { que: 'Calorías quemadas', porque: 'Apartado 8, con ese ejemplo: *"NO mostrar calorías quemadas si no existe un modelo fiable."*' },
  { que: 'Un sistema de adherencia al plan', porque: 'Apartado 21: *"No construir todavía un sistema avanzado de adherencia."* Lo que sí queda es qué día se completó.' },
];

/* 🚨 Apartado 14 — la foto o el vídeo. **La estructura sí; el botón no.**
   JosStyle tiene cinco buckets —salud, biblioteca, armario, fondos, relacion— y
   **ninguno es de entrenamientos**. Un sexto necesita que Josué ejecute su SQL,
   y hasta entonces «Añadir foto o vídeo» fallaría en silencio en su iPhone: es
   exactamente lo que pasó con la foto de perfil, donde dos de los cinco buckets
   llevaban meses sin existir de verdad. El campo `media` está y vale `null`. */
export const MEDIA_PENDIENTE = {
  campo: 'media',
  que: 'Asociar una foto o un vídeo al entrenamiento (apartado 14).',
  porQueNoHayBoton: 'No existe un bucket de Storage para entrenamientos, y el apartado prohíbe inventar almacenamiento. Un botón que no guarda nada es peor que no tenerlo.',
  necesita: 'Un bloque de SQL que cree el bucket con sus políticas `auth.uid()`, ejecutado por Josué.',
  quienDecide: 'Josué',
};

/* Lo que queda preparado, con dónde vive (EH F55). */
export const PREPARADO_PARA_FIT8 = [
  { que: 'El historial de entrenamientos', donde: '`fitness.sesiones`, con las completadas y su `guardadaEn`.' },
  { que: 'La adherencia al plan', donde: '`diaDePlan` en cada sesión completada (apartado 21).' },
  { que: 'La progresión por ejercicio', donde: 'Cada serie guarda `plan` y `hecho` por separado desde la F7.' },
  { que: 'La visibilidad social', donde: '`VISIBILIDADES`, con dos opciones declaradas y apagadas (apartado 15).' },
  { que: 'La foto o el vídeo de la sesión', donde: '`MEDIA_PENDIENTE`: falta el bucket, y lo decide Josué.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   12 · LA AUDITORÍA DEL APARTADO 37
   ═══════════════════════════════════════════════════════════════════════════

   Se **ejecuta** sobre la sesión que se le pase: una casilla puesta a `true` a
   mano es una auditoría que no puede fallar (EH F42). */
export function auditarFinalizacion(sesion, propios = []) {
  const problemas = [];
  if (!sesion) return { ok: false, problemas: [{ que: 'No hay sesión que auditar.' }] };

  if (sesion.estado !== 'completada') problemas.push({ que: `No está guardada: ${sesion.estado}` });
  if (!sesion.iniciadaEn) problemas.push({ que: 'No guarda cuándo empezó, así que la duración no se puede recalcular (apartado 22).' });
  if (!sesion.terminadaEn) problemas.push({ que: 'No guarda cuándo acabó (apartado 22).' });
  if (sesion.terminadaEn && sesion.iniciadaEn && sesion.terminadaEn < sesion.iniciadaEn) {
    problemas.push({ que: 'Acabó antes de empezar.' });
  }
  if (!texto(sesion.nombre)) problemas.push({ que: 'Se quedó sin nombre (apartado 3).' });
  if (!VISIBILIDADES.some((v) => v.id === sesion.visibilidad)) {
    problemas.push({ que: `Visibilidad desconocida: ${sesion.visibilidad}` });
  }
  if (!ejerciciosDeSesion(sesion).length) problemas.push({ que: 'Perdió el snapshot: no se podrá enseñar en el historial (apartado 23).' });

  const r = resumenDeSesion(sesion, { propios });
  if (r && r.seriesCompletadas > r.seriesPlanificadas) {
    problemas.push({ que: 'Hay más series hechas que series que contaran.' });
  }
  return { ok: problemas.length === 0, problemas };
}

/** Guardar y dejarlo en `fitness`, que es lo que llama la pantalla.
 *  ⚠️ Quien escribe sigue siendo `App.jsx`: esto solo devuelve el siguiente. */
export function aplicarGuardado(fitness, sesion, opciones = {}) {
  const r = guardarEntrenamiento(sesion, opciones);
  if (!r.ok) return { ...r, fitness };
  return { ...r, fitness: guardarSesion(fitness, r.sesion) };
}
