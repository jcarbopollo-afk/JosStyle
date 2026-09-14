import { uid, todayISO } from './helpers';
import { crearWorkoutSession, normalizarWorkoutSession, ESTADOS_SESION } from './fitness';
import {
  ejercicioPorId, nombreCompleto, musculoPrincipal, musculosDe,
} from './ejercicios';
import {
  nombreDeLinea, variantesDeLinea, DESCANSO_POR_DEFECTO, MAX_SERIES,
} from './constructor';
import { normalizarFitnessConPlanes, CATALOGO_PLANES } from './planes';

/* Entrega 4 · Fase 7/45 — «Motor de entrenamiento en vivo».
   ═══════════════════════════════════════════════════════════════════════════

   El criterio de finalización pide poder hacer **una sesión completa de
   verdad**: *Empezar → navegar ejercicios → introducir peso/reps → completar
   series → añadir series → descansar → añadir notas → sustituir un ejercicio →
   salir/reanudar* **sin perder datos**, y *"El usuario debe sentir que está
   utilizando un tracker de entrenamiento real, no una demo."*

   ───────────────────────────────────────────────────────────────────────────
   1 · LO QUE YA EXISTÍA (el enunciado lo pide antes de tocar nada)
   ───────────────────────────────────────────────────────────────────────────

   🚨 **`WorkoutSession` EXISTE DESDE LA F1**, con su clave `fitness.sesiones` y
   su normalizador corriendo en cada carga. El apartado 2 pide *"un modelo
   equivalente a WorkoutSession"* — pues es ése, **ampliado**, no uno nuevo al
   lado: los seis campos del motor viven en `crearWorkoutSession`, porque lo que
   ese normalizador no conozca se lo lleva el siguiente guardado (regla 5).

   🚨 **EL SELECTOR DE EJERCICIOS ES `EjerciciosView`** (F2), con su búsqueda y
   sus filtros por músculo, entorno, equipo y dificultad — que es exactamente lo
   que pide el apartado 26. La F3 ya lo reutilizó con `onElegir`; aquí igual.

   🚨 **Y EL TEMPORIZADOR SE HACE CON MARCAS DE TIEMPO**, que es la lección del
   Pomodoro (E3 F25) y lo que piden los apartados 6 y 7 con todas las letras:
   *"No utilizar un contador que se reinicie con cada render. Guardar la hora de
   inicio y calcular la duración a partir de ella."* Safari **congela** los
   temporizadores de una pestaña que no se ve: un contador que resta segundos se
   queda diez minutos por detrás al bloquear el iPhone.

   ───────────────────────────────────────────────────────────────────────────
   2 · EL SNAPSHOT: LA ÚNICA COPIA QUE ESTE PROYECTO SÍ DEBE HACER
   ───────────────────────────────────────────────────────────────────────────

   El apartado 3 lo marca como **MUY IMPORTANTE**: *"Cuando comienza una sesión,
   no dependas exclusivamente de que el plan siga igual. Crear un snapshot de la
   estructura que se va a entrenar […] La sesión debe trabajar con los datos que
   tenía al iniciarse."*

   🚨 **Y eso NO contradice las veinte fases que llevan prohibiendo copiar.** Lo
   que este proyecto prohíbe es duplicar un dato **que puede cambiar y del que
   hay una fuente viva**; una sesión es **historial**, y el historial se rompe si
   depende de algo que se edita después. Es exactamente la E3 F28: *"un registro
   histórico sí lleva copia, y es la única cosa que debe"* — allí, la ejecución
   de una rutina guardaba el título del paso para que renombrarlo no reescribiera
   el pasado.

   ⚠️ **Lo que el snapshot NO copia es el ejercicio.** Guarda su `exerciseId`,
   como toda línea desde la F3: el nombre, los músculos y la técnica se le siguen
   preguntando al catálogo, así que corregir un porcentaje llega también a las
   sesiones viejas. Lo que se congela es **la estructura que él iba a entrenar**
   —qué ejercicios, en qué orden, con cuántas series y qué decía el plan—, no la
   ficha de cada ejercicio.

   ───────────────────────────────────────────────────────────────────────────
   3 · PLANIFICADO Y REALIZADO SON DOS COSAS (apartados 14 y 20)
   ───────────────────────────────────────────────────────────────────────────

   *"No confundir: Planificado, lo que la rutina decía. Realizado, lo que el
   usuario realmente hizo. Esta separación será fundamental para las fases
   posteriores."* Y el apartado 20 lo remata con el caso que lo explica: si el
   plan dice **8–12**, eso **no son ocho repeticiones exactas**; él registra un
   10, y la serie guarda `hecho.reps = 10` **conservando** `plan.reps = 8` y
   `plan.repsHasta = 12`.

   🚨 Por eso una serie tiene **dos objetos**, `plan` y `hecho`, y no un campo
   que se pisa. Con uno solo, la F11 —progresión y comparación— no tendría con
   qué comparar.

   ───────────────────────────────────────────────────────────────────────────
   4 · Y TRES CLASES DE SERIE, NO UNA LISTA QUE SE RECORTA (apartado 19)
   ───────────────────────────────────────────────────────────────────────────

   *"Si la serie es una de las originalmente planificadas: puede ser mejor
   marcarla como eliminada/omitida que destruir la estructura original. La
   arquitectura debe diferenciar: planned / added / removed-skipped."*

   Así que `origen` dice de dónde salió (`planificada` o `anadida`) y `estado`
   qué pasó con ella (`pendiente`, `hecha`, `omitida`). **Una planificada nunca
   se borra**: se omite, y sigue contando en «lo que decía el plan». Una añadida
   sí se puede quitar, porque la puso él. */

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const lista = (v) => (Array.isArray(v) ? v : []);
const enteroONull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
};
/* ⚠️ El peso admite decimales (apartado 15: *"60, 60.5, 62.5"*), así que NO
   pasa por `enteroONull`. Redondearlo habría convertido sus 62,5 kg en 63 sin
   decírselo. */
const numeroONull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LOS CATÁLOGOS
   ═══════════════════════════════════════════════════════════════════════════ */

/** De dónde salió una serie (apartado 19). */
export const ORIGENES_SERIE = [
  { id: 'planificada', nombre: 'Del plan', que: 'La que decía el entrenamiento. No se borra: se omite.' },
  { id: 'anadida', nombre: 'Añadida', que: 'La que añadió él durante la sesión. Ésta sí se puede quitar.' },
];

/** Qué ha pasado con ella. ⚠️ `omitida` es el tercer estado, y es el que
 *  permite no destruir la estructura original (apartado 19). */
export const ESTADOS_SERIE = [
  { id: 'pendiente', nombre: 'Pendiente', cuenta: false },
  { id: 'hecha', nombre: 'Hecha', cuenta: true },
  { id: 'omitida', nombre: 'Omitida', cuenta: false },
];

/* Cómo se mide una serie. ⚠️ **Lo decide el ejercicio del catálogo** (F2), no la
   pantalla: un L-sit se mide en segundos y un press de banca en repeticiones
   (apartados 21 y 22). El `modo` de la línea ya lo trae desde la F3. */
export const MEDIDAS_SERIE = [
  { id: 'reps', nombre: 'Repeticiones', unidad: '', campo: 'reps' },
  { id: 'tiempo', nombre: 'Tiempo', unidad: 's', campo: 'duracion' },
];
export const medidaDeSerie = (id) => MEDIDAS_SERIE.find((m) => m.id === id) || MEDIDAS_SERIE[0];

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LA SERIE (apartados 13, 14, 17, 19, 20 y 21)
   ═══════════════════════════════════════════════════════════════════════════ */

export function crearSerie({
  id = null, origen = 'planificada', estado = 'pendiente',
  plan = {}, hecho = {}, modo = 'reps',
} = {}) {
  const p = plan && typeof plan === 'object' ? plan : {};
  const h = hecho && typeof hecho === 'object' ? hecho : {};
  return {
    id: texto(id) || uid(),
    origen: ORIGENES_SERIE.some((o) => o.id === origen) ? origen : 'planificada',
    estado: ESTADOS_SERIE.some((e) => e.id === estado) ? estado : 'pendiente',
    modo: MEDIDAS_SERIE.some((m) => m.id === modo) ? modo : 'reps',
    /* Lo que decía el plan. **No se toca nunca** después de crear la sesión. */
    plan: {
      reps: enteroONull(p.reps),
      repsHasta: enteroONull(p.repsHasta),
      duracion: enteroONull(p.duracion),
      peso: numeroONull(p.peso),
    },
    /* Lo que hizo de verdad. ⚠️ Nace **vacío**: escribirle de oficio las
       repeticiones del plan sería registrar por él algo que todavía no ha hecho
       (HT F3 con `ALCANCES`, y ya van muchas). */
    hecho: {
      reps: enteroONull(h.reps),
      duracion: enteroONull(h.duracion),
      peso: numeroONull(h.peso),
    },
  };
}

export function normalizarSerie(g) {
  if (!g || !texto(g.id)) return null;
  return crearSerie(g);
}

/** Lo que el plan decía de esa serie, en texto. *"8–12"*, no *"8"* (apartado 20). */
export function textoPlanificado(serie) {
  const s = serie || {};
  if (s.modo === 'tiempo') return s.plan?.duracion ? `${s.plan.duracion} s` : '';
  const { reps, repsHasta } = s.plan || {};
  if (!reps) return '';
  return repsHasta && repsHasta !== reps ? `${reps}–${repsHasta}` : `${reps}`;
}

/** Y lo que hizo, en texto. ⚠️ Vacío si no lo ha registrado: un cero diría que
 *  hizo cero repeticiones, y lo que pasa es que no lo ha apuntado (E3 F31). */
export function textoRealizado(serie) {
  const s = serie || {};
  if (s.modo === 'tiempo') return s.hecho?.duracion ? `${s.hecho.duracion} s` : '';
  return s.hecho?.reps ? `${s.hecho.reps}` : '';
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · EL EJERCICIO DE LA SESIÓN (apartados 3, 10, 26 y 27)
   ═══════════════════════════════════════════════════════════════════════════ */

export function crearEjercicioDeSesion({
  id = null, exerciseId = '', orden = 0, series = [], notas = '',
  descanso = null, modo = 'reps', sustituyeA = null, linea = null,
} = {}) {
  return {
    id: texto(id) || uid(),
    /* ⚠️ **Solo el id**: el nombre, los músculos y la técnica se le preguntan al
       catálogo (F2 y F3). El snapshot congela la ESTRUCTURA, no la ficha. */
    exerciseId: texto(exerciseId),
    orden: enteroONull(orden) ?? 0,
    series: lista(series).map(normalizarSerie).filter(Boolean),
    /* Apartado 27 — la nota por ejercicio, que persiste dentro de la sesión. */
    notas: texto(notas),
    descanso: enteroONull(descanso),
    modo: MEDIDAS_SERIE.some((m) => m.id === modo) ? modo : 'reps',
    /* Apartado 26 — si lo sustituyó, de cuál venía. ⚠️ Es una **referencia**,
       para poder decirlo en pantalla; el plan original no se entera de nada. */
    sustituyeA: texto(sustituyeA) || null,
    /* Lo que decía la línea del plan, por si una fase futura lo necesita. */
    linea: linea && typeof linea === 'object' ? linea : null,
  };
}

export function normalizarEjercicioDeSesion(g) {
  if (!g || !texto(g.id) || !texto(g.exerciseId)) return null;
  return crearEjercicioDeSesion(g);
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · EMPEZAR (apartados 2 y 3)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Las series que el plan pedía para una línea. ⚠️ Si no dice cuántas, **una**:
 *  cero series sería un ejercicio que no se puede registrar. */
export function seriesDeLinea(linea, propios = []) {
  const l = linea || {};
  const cuantas = Math.max(1, Math.min(MAX_SERIES, enteroONull(l.series) ?? 1));
  const modo = l.modo === 'tiempo' ? 'tiempo' : 'reps';
  return Array.from({ length: cuantas }, () => crearSerie({
    origen: 'planificada',
    modo,
    plan: {
      reps: l.repeticiones ?? null,
      repsHasta: l.repsHasta ?? null,
      duracion: l.duracion ?? null,
      peso: l.peso ?? null,
    },
  }));
}

/** 🚨 El snapshot del apartado 3. Recibe **la rutina que se va a entrenar** —un
 *  día de un plan, una plantilla, lo que sea— y devuelve una sesión que ya no
 *  depende de ella. */
export function empezarSesion({
  nombre = '', lineas = [], planId = null, origenTipo = 'plan', origenId = null,
  ahora = Date.now(), hoy = todayISO(), propios = [],
} = {}) {
  const ls = lista(lineas);
  const ejercicios = ls.map((l, i) => crearEjercicioDeSesion({
    exerciseId: l.exerciseId,
    orden: i,
    modo: l.modo === 'tiempo' ? 'tiempo' : 'reps',
    descanso: enteroONull(l.descanso) ?? DESCANSO_POR_DEFECTO,
    series: seriesDeLinea(l, propios),
    linea: {
      series: enteroONull(l.series),
      repeticiones: enteroONull(l.repeticiones),
      repsHasta: enteroONull(l.repsHasta),
      duracion: enteroONull(l.duracion),
      peso: numeroONull(l.peso),
      tipoCarga: texto(l.tipoCarga) || null,
    },
  }));

  return {
    ...crearWorkoutSession({
      planId,
      nombre: texto(nombre) || 'Entrenamiento',
      fecha: hoy,
      estado: 'en_curso',
      iniciadaEn: ahora,
      actual: 0,
      /* El snapshot vive aquí, no en `ejercicios`: aquél es el campo de la F1 y
         lo leen el historial y la exportación con su forma de siempre. */
      origen: { tipo: texto(origenTipo) || 'plan', id: texto(origenId) || null, ejercicios },
    }),
  };
}

/** Los ejercicios de la sesión — que viven en el snapshot. */
export const ejerciciosDeSesion = (sesion) => lista(sesion?.origen?.ejercicios);

/** El ejercicio en el que va. ⚠️ Acotado: un índice fuera de rango dejaría la
 *  pantalla en blanco sin decir por qué. */
export function ejercicioActual(sesion) {
  const ejs = ejerciciosDeSesion(sesion);
  if (!ejs.length) return null;
  const i = Math.max(0, Math.min(ejs.length - 1, enteroONull(sesion?.actual) ?? 0));
  return ejs[i];
}

/* Escribir el snapshot de vuelta, que es lo único que cambia durante la sesión.
   ⚠️ Devuelve **la sesión entera**: `saveData` sobrescribe (regla 5). */
const conEjercicios = (sesion, ejercicios) => ({
  ...sesion,
  origen: { ...(sesion.origen || {}), ejercicios },
});

const mapEjercicio = (sesion, ejercicioId, fn) => {
  const ejs = ejerciciosDeSesion(sesion);
  if (!ejs.some((e) => e.id === ejercicioId)) return sesion;
  return conEjercicios(sesion, ejs.map((e) => (e.id === ejercicioId ? fn(e) : e)));
};

/* ═══════════════════════════════════════════════════════════════════════════
   9 · EL CRONÓMETRO (apartados 6 y 7)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 **Ni un contador.** Lo que se guarda es cuándo empezó y cuánto tiempo lleva
   pausada; lo que dura **se resta**. Así sobrevive al segundo plano, a recargar
   y a cambiar de ejercicio, que es literalmente lo que pide el apartado 7. */

export function duracionSesion(sesion, ahora = Date.now()) {
  const s = sesion || {};
  if (!s.iniciadaEn) return 0;
  const hasta = s.terminadaEn || (s.estado === 'pausada' && s.pausadaEn ? s.pausadaEn : ahora);
  return Math.max(0, hasta - s.iniciadaEn - (s.pausadoMs || 0));
}

/** `00:00`, `01:24`, y con horas `1:02:03` (apartado 6). */
export function reloj(ms) {
  const t = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const dd = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${dd(m)}:${dd(s)}` : `${dd(m)}:${dd(s)}`;
}

export function pausarSesion(sesion, ahora = Date.now()) {
  if (!sesion || sesion.estado !== 'en_curso') return sesion;
  return { ...sesion, estado: 'pausada', pausadaEn: ahora };
}

export function reanudarSesion(sesion, ahora = Date.now()) {
  if (!sesion || sesion.estado !== 'pausada') return sesion;
  const parado = sesion.pausadaEn ? Math.max(0, ahora - sesion.pausadaEn) : 0;
  return { ...sesion, estado: 'en_curso', pausadaEn: null, pausadoMs: (sesion.pausadoMs || 0) + parado };
}

/* ═══════════════════════════════════════════════════════════════════════════
   10 · NAVEGAR (apartado 9)
   ═══════════════════════════════════════════════════════════════════════════

   *"Cuando cambia de ejercicio: todos los datos del ejercicio actual deben
   conservarse. Nunca perder peso, repeticiones, series completadas, notas ni
   series añadidas."* ⚠️ Y sale gratis: cambiar de ejercicio **solo mueve un
   índice**. No hay estado repartido por componentes que se pueda desincronizar
   (apartado 28). */

export function irAEjercicio(sesion, indice) {
  const ejs = ejerciciosDeSesion(sesion);
  if (!ejs.length) return sesion;
  const i = enteroONull(indice);
  if (i === null || i < 0 || i >= ejs.length) return sesion;
  return { ...sesion, actual: i };
}

export const siguienteEjercicio = (sesion) => irAEjercicio(sesion, (sesion?.actual ?? 0) + 1);
export const anteriorEjercicio = (sesion) => irAEjercicio(sesion, (sesion?.actual ?? 0) - 1);

/* ═══════════════════════════════════════════════════════════════════════════
   11 · LAS SERIES (apartados 15-19)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartados 15 y 16 — peso y repeticiones. ⚠️ Escribe en `hecho`, jamás en
 *  `plan`: eso es lo que decía la rutina y no cambia (apartado 14). */
export function editarSerie(sesion, ejercicioId, serieId, cambios = {}) {
  return mapEjercicio(sesion, ejercicioId, (e) => ({
    ...e,
    series: e.series.map((s) => {
      if (s.id !== serieId) return s;
      const hecho = { ...s.hecho };
      if ('peso' in cambios) hecho.peso = numeroONull(cambios.peso);
      if ('reps' in cambios) hecho.reps = enteroONull(cambios.reps);
      if ('duracion' in cambios) hecho.duracion = enteroONull(cambios.duracion);
      return { ...s, hecho };
    }),
  }));
}

/** Apartado 17 — marcar y desmarcar. *"No borrar los datos al desmarcar. Debe
 *  poder: marcar → desmarcar → volver a marcar."* */
export function marcarSerie(sesion, ejercicioId, serieId, hecha = true) {
  return mapEjercicio(sesion, ejercicioId, (e) => ({
    ...e,
    series: e.series.map((s) => (s.id === serieId
      /* 🚨 Solo cambia `estado`. `hecho` se queda intacto, que es lo que pide el
         apartado con todas las letras. */
      ? { ...s, estado: hecha ? 'hecha' : 'pendiente' }
      : s)),
  }));
}

/** Apartado 18 — añadir una serie. *"Debe heredar valores razonables si es
 *  posible. Pero el usuario debe poder modificarlos."* ⚠️ Hereda **lo que él ya
 *  ha registrado en la última**, no lo que decía el plan: si lleva tres series a
 *  60 kg, la cuarta empieza en 60. */
export function anadirSerie(sesion, ejercicioId) {
  return mapEjercicio(sesion, ejercicioId, (e) => {
    if (e.series.length >= MAX_SERIES) return e;
    const ultima = [...e.series].reverse().find((s) => s.hecho?.peso !== null || s.hecho?.reps !== null)
      || e.series[e.series.length - 1] || null;
    return {
      ...e,
      series: [...e.series, crearSerie({
        origen: 'anadida',
        modo: e.modo,
        plan: ultima ? { ...ultima.plan } : {},
        hecho: ultima ? { ...ultima.hecho } : {},
      })],
    };
  });
}

/** Apartado 19 — quitar. 🚨 **Una planificada no se destruye: se omite**, y así
 *  la estructura original sigue entera para comparar. Una añadida sí se va. */
export function quitarSerie(sesion, ejercicioId, serieId) {
  return mapEjercicio(sesion, ejercicioId, (e) => {
    const serie = e.series.find((s) => s.id === serieId);
    if (!serie) return e;
    if (serie.origen === 'anadida') {
      return { ...e, series: e.series.filter((s) => s.id !== serieId) };
    }
    return { ...e, series: e.series.map((s) => (s.id === serieId ? { ...s, estado: 'omitida' } : s)) };
  });
}

/** Y devolverla a pendiente, porque omitir no es irreversible. */
export function recuperarSerie(sesion, ejercicioId, serieId) {
  return mapEjercicio(sesion, ejercicioId, (e) => ({
    ...e,
    series: e.series.map((s) => (s.id === serieId && s.estado === 'omitida'
      ? { ...s, estado: 'pendiente' } : s)),
  }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   12 · SUSTITUIR Y NOTAS (apartados 26 y 27)
   ═══════════════════════════════════════════════════════════════════════════ */

/** 🚨 Apartado 26: *"La sustitución afecta solamente a WorkoutSession. No
 *  modifica: Exercise, plan, plantilla."* Y por construcción no puede: esta
 *  función recibe **la sesión** y devuelve **la sesión**. Hay una comprobación
 *  que sustituye un ejercicio y mira que el plan y la plantilla sigan iguales.
 *
 *  ⚠️ Las series **se conservan**: cambiar un press de banca por uno de
 *  mancuernas no tiene por qué borrarle las cuatro series que llevaba puestas
 *  (es `cambiarVariante` de la F3). Lo que se descarta es el peso registrado, y
 *  eso sí, porque era de otro ejercicio. */
export function sustituirEjercicio(sesion, ejercicioId, exerciseIdNuevo, propios = []) {
  const nuevo = ejercicioPorId(texto(exerciseIdNuevo), propios);
  if (!nuevo) return sesion;
  return mapEjercicio(sesion, ejercicioId, (e) => {
    const modo = !nuevo.medidas.includes('reps') && nuevo.medidas.includes('tiempo') ? 'tiempo' : e.modo;
    return {
      ...e,
      exerciseId: nuevo.id,
      sustituyeA: e.sustituyeA || e.exerciseId,
      modo,
      series: e.series.map((s) => crearSerie({
        id: s.id,
        origen: s.origen,
        estado: s.estado,
        modo,
        plan: s.plan,
        /* El peso de un press de banca no dice nada del de mancuernas. */
        hecho: { reps: s.hecho.reps, duracion: s.hecho.duracion, peso: null },
      })),
    };
  });
}

/** Los ejercicios que se le proponen al sustituir (apartado 26: *"Priorizar
 *  ejercicios compatibles"*). ⚠️ Es `variantesDeLinea` de la F3: la misma
 *  familia, no una lista nueva. */
export function sustitutosSugeridos(ejercicioSesion, propios = []) {
  return variantesDeLinea({ exerciseId: ejercicioSesion?.exerciseId }, propios);
}

/** Apartado 27 — la nota del ejercicio, que persiste dentro de la sesión. */
export function notaDeEjercicio(sesion, ejercicioId, nota) {
  return mapEjercicio(sesion, ejercicioId, (e) => ({ ...e, notas: texto(nota) }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   13 · EL DESCANSO (apartados 23, 24 y 25)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 **Es OTRO temporizador, independiente del cronómetro** (apartado 23), y
   también de marcas de tiempo. ⚠️ Y **no vive en la sesión guardada**: es de la
   pantalla, dura lo que dura y no tiene sentido recuperarlo tres horas después
   (EH F40). Lo que sí se guarda es el descanso configurado de cada ejercicio. */

export function crearDescanso({ segundos = DESCANSO_POR_DEFECTO, ahora = Date.now() } = {}) {
  return { segundos: Math.max(1, enteroONull(segundos) ?? DESCANSO_POR_DEFECTO), desde: ahora, pausadoEn: null, pausadoMs: 0 };
}

export function restanteDescanso(d, ahora = Date.now()) {
  if (!d || !d.desde) return 0;
  const hasta = d.pausadoEn || ahora;
  const pasado = Math.max(0, hasta - d.desde - (d.pausadoMs || 0));
  return Math.max(0, d.segundos * 1000 - pasado);
}

export const descansoTerminado = (d, ahora = Date.now()) => !!d && restanteDescanso(d, ahora) === 0;

export function pausarDescanso(d, ahora = Date.now()) {
  if (!d || d.pausadoEn) return d;
  return { ...d, pausadoEn: ahora };
}

export function reanudarDescanso(d, ahora = Date.now()) {
  if (!d || !d.pausadoEn) return d;
  return { ...d, pausadoMs: (d.pausadoMs || 0) + Math.max(0, ahora - d.pausadoEn), pausadoEn: null };
}

export const reiniciarDescanso = (d, ahora = Date.now()) =>
  (d ? crearDescanso({ segundos: d.segundos, ahora }) : null);

/* 🚨 Apartado 25 — el sonido al terminar el descanso **se EMITE al bus**, y es
   un evento que YA EXISTE. La biblioteca es de SO F4 y tiene sus 46 archivos;
   ninguno es una campana de descanso, y declarar uno nuevo sin archivo sería
   declarar un sonido que no suena (E3 F25, con el Pomodoro, palabra por
   palabra). Quien decide si suena, a qué volumen y si está silenciado es el
   motor de audio: ninguna pantalla hace `new Audio(...)` (SO F1). */
export const EVENTO_FIN_DESCANSO = 'success';

export const SONIDO_DESCANSO = {
  propio: false,
  evento: EVENTO_FIN_DESCANSO,
  quienDecide: 'El motor de audio (SO F1): volumen, silencio y activación son suyos.',
  porQueNoUnoNuevo: 'La biblioteca de SO F4 no tiene ninguna campana de descanso. Un evento sin archivo es un sonido que no suena.',
};

/* Apartado 25 — y la vibración, **si el dispositivo la tiene**. ⚠️ Cada acceso
   en `try`: en un iPhone `navigator.vibrate` no existe, y el apartado pide que
   *"degrade correctamente. No debe generar errores."* */
export function vibrarSiSePuede(ms = 120) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms);
      return true;
    }
  } catch { /* vacío: que no haya vibración no es un error */ }
  return false;
}

/* ═══════════════════════════════════════════════════════════════════════════
   14 · TERMINAR, SALIR Y RECUPERAR (apartados 30, 31 y 32)
   ═══════════════════════════════════════════════════════════════════════════ */

/* Apartado 31 — salir no termina. */
export const AVISO_SALIR = {
  titulo: '¿Salir del entrenamiento?',
  texto: 'Tu sesión está en curso. Si sales, la encontrarás aquí para seguirla.',
  seguir: 'Seguir entrenando',
  salir: 'Salir',
};

/* 🚨 Apartado 32: *"NO debe guardar automáticamente como completada sin
   confirmación."* Así que Terminar **pregunta**, y es el patrón `aplicarPlan`
   del proyecto, que ya va por más de veinte: sin `confirmado` no escribe nada.

   ⚠️ Y la pantalla de finalización —el resumen, la sensación, las notas de la
   sesión— **es la FIT F8**. Lo que esta fase hace es dejar la sesión guardada y
   completa; aquélla se mete en medio sin cambiar nada de esto. */
export const AVISO_TERMINAR = {
  titulo: '¿Terminar el entrenamiento?',
  texto: 'Se guardará lo que has registrado y podrás verlo después.',
  seguir: 'Seguir entrenando',
  /* ⚠️ **No se llama «Terminar»**, que es el botón de la cabecera: dos botones
     con el mismo nombre en la misma pantalla es el fallo de la E3 F30 y de la
     E3 F42 —y aquí, además, pulsar el de arriba por error no confirmaría nada—.
     Y de paso dice lo que pasa al pulsarlo. */
  terminar: 'Terminar y guardar',
};

export function terminarSesion(sesion, { confirmado = false, ahora = Date.now() } = {}) {
  if (!sesion) return { ok: false, motivo: 'No hay ninguna sesión.', aviso: null, sesion: null };
  if (!confirmado) return { ok: false, motivo: 'confirmacion', aviso: AVISO_TERMINAR, sesion };
  const enCurso = sesion.estado === 'pausada' ? reanudarSesion(sesion, ahora) : sesion;
  return {
    ok: true,
    motivo: null,
    aviso: null,
    sesion: { ...enCurso, estado: 'completada', terminadaEn: ahora },
  };
}

/* Apartado 31 — descartar. ⚠️ **No borra la sesión**: la marca, para que no
   vuelva a ofrecerse como activa y siga estando en el historial de la F10. */
export const AVISO_DESCARTAR = {
  titulo: '¿Descartar este entrenamiento?',
  texto: 'Lo que has registrado dejará de contar como un entrenamiento hecho.',
  cancelar: 'Cancelar',
  descartar: 'Descartar',
};

export function descartarSesion(sesion, { confirmado = false, ahora = Date.now() } = {}) {
  if (!sesion) return { ok: false, motivo: 'No hay ninguna sesión.', aviso: null, sesion: null };
  if (!confirmado) return { ok: false, motivo: 'confirmacion', aviso: AVISO_DESCARTAR, sesion };
  return { ok: true, motivo: null, aviso: null, sesion: { ...sesion, estado: 'descartada', terminadaEn: ahora } };
}

/** Apartado 30 — *"Si al abrir la aplicación existe WorkoutSession.status =
 *  active, mostrar Continuar entrenamiento"*. ⚠️ Se busca en lo guardado, no en
 *  un rastro aparte: la sesión ES el dato. */
export function sesionActiva(fitness) {
  return lista((fitness || {}).sesiones)
    .filter((s) => s && (s.estado === 'en_curso' || s.estado === 'pausada'))
    .sort((a, b) => (b.iniciadaEn || 0) - (a.iniciadaEn || 0))[0] || null;
}

/** Lo que la tarjeta de recuperación enseña: nombre, duración y ejercicio
 *  actual (apartado 30, literal). */
export function avisoDeRecuperacion(sesion, { ahora = Date.now(), propios = [] } = {}) {
  if (!sesion) return null;
  const ej = ejercicioActual(sesion);
  return {
    titulo: 'Tienes un entrenamiento en curso',
    nombre: texto(sesion.nombre) || 'Entrenamiento',
    duracion: reloj(duracionSesion(sesion, ahora)),
    ejercicio: ej ? nombreDeLinea(ej, propios) : '',
    continuar: 'Continuar entrenamiento',
    descartar: 'Descartar sesión',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   15 · GUARDAR (apartados 24 y 29)
   ═══════════════════════════════════════════════════════════════════════════

   *"No esperar únicamente al final para guardar."* ⚠️ Y quien escribe sigue
   siendo `App.jsx`, la puerta de siempre: esto solo devuelve el `fitness`
   siguiente con la sesión dentro. Ni un `saveData` aquí. */
export function guardarSesion(fitness, sesion) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  if (!sesion || !sesion.id) return f;
  const sesiones = lista(f.sesiones);
  const i = sesiones.findIndex((s) => s && s.id === sesion.id);
  /* Sustituye por id; no acumula una copia por cada cambio. */
  const siguientes = i === -1 ? [...sesiones, sesion] : sesiones.map((s, k) => (k === i ? sesion : s));
  return { ...f, sesiones: siguientes };
}

/* ═══════════════════════════════════════════════════════════════════════════
   16 · LO QUE LEE LA PANTALLA
   ═══════════════════════════════════════════════════════════════════════════ */

/* Cuántos músculos se enseñan bajo la ilustración. Tres: con la lista entera el
   pie de la tarjeta ocupa más que el propio dibujo. */
export const MUSCULOS_EN_FICHA = 3;

/** El ejercicio actual con todo lo que el apartado 10 pide enseñar. */
export function fichaDeEjercicio(ejercicioSesion, propios = []) {
  const e = ejercicioSesion;
  if (!e) return null;
  const ej = ejercicioPorId(e.exerciseId, propios);
  const principal = ej ? musculoPrincipal(ej) : null;
  return {
    id: e.id,
    exerciseId: e.exerciseId,
    nombre: ej ? ej.nombre : e.exerciseId,
    /* ⚠️ Si el ejercicio ya no está, se dice — no se rompe la sesión (E3 F25 y
       la F5 con las líneas de un plan). */
    existe: !!ej,
    variante: ej ? (nombreCompleto(ej) !== ej.nombre ? nombreCompleto(ej) : '') : '',
    musculo: principal ? principal.nombre : '',
    dificultad: ej ? ej.dificultad : '',
    equipo: ej ? lista(ej.equipamiento) : [],
    tipos: ej ? lista(ej.tipos) : [],
    modo: e.modo,
    descanso: e.descanso,
    notas: e.notas,
    sustituido: !!e.sustituyeA,
    sustituyeA: e.sustituyeA
      ? (ejercicioPorId(e.sustituyeA, propios)?.nombre || e.sustituyeA)
      : '',
    /* El tutorial del apartado 12, con los datos REALES del catálogo. */
    tutorial: ej ? {
      instrucciones: ej.instrucciones,
      recursos: ej.recursos,
      tutorial: ej.tutorial,
    } : null,
    /* 🚨 Los músculos, con su grupo y su porcentaje, para el hueco anatómico del
       apartado 11. ⚠️ **No es `musculosResumidos`**, que devuelve una CADENA
       —«Pecho · Hombros»— para pintar una línea de texto: aquí hacen falta los
       objetos, y llamar a aquélla dejaba la pantalla llamando a `.map()` sobre
       un texto. Es la lección de siempre: antes de leer lo que devuelve una
       función de otra fase, mirar QUÉ devuelve. */
    musculos: (ej ? musculosDe(ej) : [])
      .slice()
      .sort((a, b) => (b.porcentaje || 0) - (a.porcentaje || 0))
      .slice(0, MUSCULOS_EN_FICHA),
  };
}

/** Las series de un ejercicio, listas para la tabla del apartado 13. */
export function filasDeSeries(ejercicioSesion) {
  const e = ejercicioSesion;
  if (!e) return [];
  let n = 0;
  return lista(e.series).map((s) => {
    if (s.estado !== 'omitida') n += 1;
    return {
      ...s,
      numero: s.estado === 'omitida' ? null : n,
      planificado: textoPlanificado(s),
      realizado: textoRealizado(s),
      medida: medidaDeSerie(s.modo),
      /* Una planificada se omite; una añadida se quita (apartado 19). */
      seQuita: s.origen === 'anadida',
    };
  });
}

/** El progreso de la sesión (apartado 17: *"actualizar el progreso"*).
 *  ⚠️ El denominador son las series **que cuentan**: una omitida no penaliza,
 *  que es la lección de `NO_TOCA` de la E3 F24. */
export function progresoSesion(sesion) {
  const ejs = ejerciciosDeSesion(sesion);
  let hechas = 0;
  let total = 0;
  for (const e of ejs) {
    for (const s of lista(e.series)) {
      if (s.estado === 'omitida') continue;
      total += 1;
      if (s.estado === 'hecha') hechas += 1;
    }
  }
  return {
    hechas,
    total,
    /* Sin series que hacer no hay porcentaje: un 0 % diría que va mal cuando lo
       que pasa es que no hay nada que contar (E3 F13, EH F25). */
    porcentaje: total ? Math.round((hechas / total) * 100) : null,
    ejerciciosHechos: ejs.filter((e) => lista(e.series).some((s) => s.estado === 'hecha')).length,
    ejercicios: ejs.length,
  };
}

/** El estado de un ejercicio en el carrusel (apartado 8). */
export function estadoDeEjercicio(sesion, indice) {
  const ejs = ejerciciosDeSesion(sesion);
  const e = ejs[indice];
  if (!e) return 'pendiente';
  if ((sesion?.actual ?? 0) === indice) return 'actual';
  const cuentan = lista(e.series).filter((s) => s.estado !== 'omitida');
  if (cuentan.length && cuentan.every((s) => s.estado === 'hecha')) return 'completado';
  return 'pendiente';
}

/** El carrusel entero (apartado 8). */
export function carruselDeSesion(sesion, propios = []) {
  return ejerciciosDeSesion(sesion).map((e, i) => ({
    id: e.id,
    indice: i,
    numero: i + 1,
    nombre: nombreDeLinea(e, propios),
    estado: estadoDeEjercicio(sesion, i),
    existe: !!ejercicioPorId(e.exerciseId, propios),
  }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   17 · LO QUE NO SE CONSTRUYE (apartados 32 y 36)
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT7 = [
  { que: 'La pantalla de finalización con su resumen', porque: 'Apartado 32: es la fase siguiente. Aquí Terminar pregunta, guarda la sesión completa y vuelve — no un botón muerto, y la F8 se mete en medio sin tocar nada de esto.' },
  { que: 'El historial de entrenamientos y su detalle', porque: 'Apartado 36. La sesión ya se guarda en `fitness.sesiones`, que es de donde leerá la F10.' },
  { que: 'Estadísticas, gráficas y progresión automática', porque: 'Apartado 36, y es la regla 8: sin más de una sesión no hay nada que comparar.' },
  { que: 'Rangos, Progreso y las fotos', porque: 'Apartado 36. Las fotos, además, ya existen en Salud (`saludFotos`, FIT F1).' },
  { que: 'La IA y las recomendaciones automáticas', porque: 'Apartado 36, y la regla 7: la IA nunca se dispara sola.' },
  { que: 'Una UI propia para cada skill', porque: 'Apartado 22: *"No crear una UI específica enorme para cada skill todavía."* Lo que sí está es el modelo: cada serie declara su medida.' },
  { que: 'Un sistema anatómico avanzado', porque: 'Apartado 11: *"En esta fase no hace falta."* El hueco existe y dibuja el grupo muscular del ejercicio; ni una URL inventada (apartado 11 y regla 8).' },
];

/* Lo que el enunciado pide dejar preparado, con dónde está (EH F55). */
export const PREPARADO_PARA_FIT7 = [
  { que: 'Comparar lo planificado con lo realizado', donde: 'Cada serie guarda `plan` y `hecho` por separado (apartados 14 y 20).' },
  { que: 'Distinguir las series del plan de las que añadió', donde: '`origen` en cada serie, y `estado: omitida` en vez de borrar (apartado 19).' },
  { que: 'Medir un isométrico o un skill', donde: '`modo` de la serie, que sale de las `medidas` del ejercicio (F2, apartados 21 y 22).' },
  { que: 'La anatomía con músculos resaltados', donde: 'Falta el recurso. `recursos.anatomia` existe en el catálogo y vale `null` (F2).' },
  { que: 'El historial y la progresión', donde: '`fitness.sesiones`, que esta fase ya llena de verdad.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   18 · LA AUDITORÍA DEL APARTADO 37
   ═══════════════════════════════════════════════════════════════════════════ */

export function auditarSesion(sesion, propios = []) {
  const problemas = [];
  const s = sesion || null;
  if (!s) return { ok: false, problemas: [{ que: 'No hay sesión que auditar.' }] };

  if (!ESTADOS_SESION.includes(s.estado)) problemas.push({ que: `Estado desconocido: ${s.estado}` });
  if (!s.iniciadaEn) problemas.push({ que: 'La sesión no guarda cuándo empezó, así que no se puede cronometrar.' });
  const ejs = ejerciciosDeSesion(s);
  if (!ejs.length) problemas.push({ que: 'La sesión no tiene ni un ejercicio.' });
  if ((s.actual ?? 0) >= Math.max(1, ejs.length)) problemas.push({ que: 'El ejercicio actual queda fuera de la sesión.' });

  for (const e of ejs) {
    if (!e.exerciseId) problemas.push({ que: 'Un ejercicio de la sesión no apunta a ninguno del catálogo.' });
    if (!lista(e.series).length) problemas.push({ que: `«${nombreDeLinea(e, propios)}» se quedó sin series.` });
    for (const x of lista(e.series)) {
      if (!ESTADOS_SERIE.some((y) => y.id === x.estado)) problemas.push({ que: `Serie con un estado desconocido: ${x.estado}` });
      if (!x.plan || typeof x.plan !== 'object') problemas.push({ que: 'Una serie perdió lo que decía el plan.' });
      if (!x.hecho || typeof x.hecho !== 'object') problemas.push({ que: 'Una serie perdió lo registrado.' });
    }
  }
  return { ok: problemas.length === 0, problemas };
}

/* Y el normalizador de la sesión entera, que es el de la F1 más el snapshot.
   ⚠️ El de `fitness.js` no conoce ni las series ni los ejercicios de la sesión,
   así que sin esta capa **el siguiente guardado se llevaría el snapshot entero**
   (regla 5): los pesos, las repeticiones, las series marcadas y las notas. Es la
   misma razón por la que la F2 y la F5 añadieron la suya. */
export function normalizarSesionCompleta(g) {
  const base = normalizarWorkoutSession(g);
  if (!base) return null;
  const origen = g.origen && typeof g.origen === 'object' ? g.origen : null;
  return {
    ...base,
    origen: origen ? {
      tipo: texto(origen.tipo) || 'plan',
      id: texto(origen.id) || null,
      ejercicios: lista(origen.ejercicios).map(normalizarEjercicioDeSesion).filter(Boolean),
    } : null,
  };
}

/* 🚨 **LA CUARTA CAPA DE LA PUERTA DE CARGA, Y `App.jsx` LLAMA A ÉSTA.**

   | Capa | Sabe de | Puede limpiar |
   |---|---|---|
   | `normalizarFitness` (F1) | la forma | lo que no tiene la forma |
   | `normalizarFitnessCompleto` (F2) | el catálogo de ejercicios | los ejercicios propios |
   | `normalizarFitnessConPlanes` (F5) | la biblioteca de planes | favoritos y plan activo colgados |
   | `normalizarFitnessConSesiones` (F7) | el snapshot de una sesión | series, notas y ejercicios de sesión |

   Cada una **solo puede limpiar lo que conoce**, y llamar a la de en medio
   dejaría fuera lo de abajo. Hay una comprobación que le pasa una sesión con su
   snapshot a la puerta de la F5 y **exige que el snapshot se pierda**: si no
   pudiera perderse, esta capa no haría nada y la comprobación no podría ponerse
   roja (EH F42). */
export function normalizarFitnessConSesiones(guardado, planes = CATALOGO_PLANES) {
  const base = normalizarFitnessConPlanes(guardado, planes);
  return {
    ...base,
    /* ⚠️ Se normaliza **lo guardado**, no lo que devolvió la capa anterior:
       aquélla ya recortó el snapshot con el modelo reducido de la F1, así que
       leerlo de ahí no encontraría nunca nada (EH F41 y EH F45). Y por índice
       tampoco: esa capa puede haber descartado una sesión y correrlos todos. */
    sesiones: lista((guardado || {}).sesiones).map(normalizarSesionCompleta).filter(Boolean),
  };
}
