import { uid, todayISO } from './helpers';
import { GRUPOS_MUSCULARES, subgrupoMuscular, crearWorkoutPlan, normalizarWorkoutPlan } from './fitness';
/* 🔓 FIT F33 — la configuración al sustituir la decide un solo sitio. */
import { configuracionRecomendada } from './sustitucion';
import {
  ejercicioPorId, nombreCompleto, ENTORNOS, baseDe, variantesDe,
} from './ejercicios';

/* Entrega 4 · Fase 3/45 — «Constructor de entrenamientos».
   ═══════════════════════════════════════════════════════════════════════════

   El flujo que pide el objetivo, entero: *"Entrenamiento → Crear entrenamiento
   → Añadir ejercicio → Configurar → Ordenar → Guardar"*. Y el criterio de éxito
   remata: *"Debe sentirse como el principio de un constructor de entrenamientos
   profesional, no como un formulario básico"*.

   ───────────────────────────────────────────────────────────────────────────
   1 · LA SEPARACIÓN CRÍTICA (apartado 28)
   ───────────────────────────────────────────────────────────────────────────

   El enunciado lo marca como **CRÍTICO** y lo explica con un ejemplo: el
   ejercicio maestro *Press banca* **no puede guardar «4 series»**, porque otra
   rutina puede usar tres. Las series pertenecen al `WorkoutExercise`.

   🚨 **Y eso ya estaba resuelto desde la F1**: un `WorkoutExercise` guarda
   `exerciseId` y **nada más del ejercicio** — ni el nombre, ni los músculos, ni
   el equipamiento. Aquí solo se amplía su configuración. Hay una comprobación
   que edita las series dentro de una rutina y verifica que el catálogo no se
   ha movido ni un milímetro.

   ⚠️ Por eso `nombreDeLinea()` **pregunta al catálogo** en vez de leer un
   nombre guardado: renombrar un ejercicio lo renombra en las veinte rutinas
   donde esté, que es justo lo que el apartado 31 llama *"una única fuente de
   verdad"*.

   ───────────────────────────────────────────────────────────────────────────
   2 · NI REPETICIONES PARA TODO, NI PESO PARA TODO (apartados 11 y 12)
   ───────────────────────────────────────────────────────────────────────────

   *"No obligues a utilizar repeticiones para todos los ejercicios"* y *"no
   asumas que todos los ejercicios utilizan peso"*. Cada línea tiene un `modo`
   —repeticiones o tiempo— que **se propone desde las `medidas` del ejercicio**
   (FIT F2) y que él puede cambiar; y un `tipoCarga` que distingue peso
   corporal, peso añadido y peso externo.

   Un L-sit nace en tiempo porque el catálogo dice que se mide en segundos. No
   hay que acordarse de cambiarlo.

   ───────────────────────────────────────────────────────────────────────────
   3 · LA DISTRIBUCIÓN SE DERIVA, SIEMPRE (apartado 19)
   ───────────────────────────────────────────────────────────────────────────

   *"No introduzcas porcentajes manuales. Deben derivarse de los ejercicios
   seleccionados."* `distribucionMuscular()` lee los porcentajes de la F2, los
   agrega y los normaliza — y **pondera por series**, porque cuatro series de
   press de banca no pesan lo mismo en una rutina que una sola. Eso sigue siendo
   derivar: el número sale de lo que él ha configurado, no de un campo que
   alguien escriba.

   ⚠️ Y se devuelve **por grupo y por subgrupo**: el apartado 19 pide que la
   función quede *"preparada para ser reutilizada"* en el detalle del plan, en
   los rangos, en la IA y en las estadísticas, y cada uno necesita un nivel de
   detalle distinto.

   ───────────────────────────────────────────────────────────────────────────
   4 · UNA ESTIMACIÓN QUE PARECE UNA ESTIMACIÓN (apartado 20)
   ───────────────────────────────────────────────────────────────────────────

   *"No inventes una precisión falsa. Puede mostrar algo como ≈ 60 min. No:
   61 min 13 s."* `duracionEstimada()` redondea a cinco minutos y el texto
   **lleva el ≈ delante**, para que nadie lo lea como un dato medido. Es la
   regla 8 en forma de número.

   ───────────────────────────────────────────────────────────────────────────
   5 · LO QUE ESTA FASE NO CONSTRUYE
   ───────────────────────────────────────────────────────────────────────────

   El apartado 30 lo enumera y el 33 remata: *"NO avances automáticamente a la
   Fase 4"*. Está en `NO_EN_FIT3`, con la fase que lo traerá. */

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const lista = (v) => (Array.isArray(v) ? v : []);
const enteroONull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};
const numeroONull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LOS VALORES POR DEFECTO (apartados 9 y 13)
   ═══════════════════════════════════════════════════════════════════════════

   *"Debe existir un valor razonable por defecto"* para las series y para el
   descanso. ⚠️ Y **solo para esos dos**: las repeticiones y el peso se quedan
   en `null` hasta que él los escriba, porque un «10» puesto de oficio es un
   dato que él no ha decidido (HT F3 con `ALCANCES`, y ya van muchas). */
export const SERIES_POR_DEFECTO = 3;
export const DESCANSO_POR_DEFECTO = 90;
export const MAX_SERIES = 20;

/* Los descansos que ofrece el apartado 13, tal cual. Él puede escribir otro. */
export const DESCANSOS = [30, 60, 90, 120, 180, 300];

export const MODOS_LINEA = [
  { id: 'reps', nombre: 'Repeticiones', unidad: 'reps' },
  { id: 'tiempo', nombre: 'Tiempo', unidad: 's' },
];

/* Apartado 12: *"Puede ser peso corporal, peso adicional, peso externo"*. */
export const TIPOS_CARGA = [
  { id: 'corporal', nombre: 'Peso corporal', llevaNumero: false },
  { id: 'adicional', nombre: 'Peso añadido', llevaNumero: true, signo: '+' },
  { id: 'externo', nombre: 'Peso', llevaNumero: true, signo: '' },
];

export const modoLinea = (id) => MODOS_LINEA.find((x) => x.id === id) || null;
export const tipoCarga = (id) => TIPOS_CARGA.find((x) => x.id === id) || null;

/* ═══════════════════════════════════════════════════════════════════════════
   2 · UNA LÍNEA DE LA RUTINA (apartados 7, 9-15 y 28)
   ═══════════════════════════════════════════════════════════════════════════

   Amplía el `WorkoutExercise` de la F1 **sin renombrar ni un campo**: sigue
   teniendo `id`, `exerciseId`, `orden`, `series`, `repeticiones`, `peso`,
   `descanso`, `notas` y `config`. Lo nuevo es `modo`, `repsHasta`, `duracion`,
   `tipoCarga` y `bloqueId`.

   ⚠️ `bloqueId` es el apartado 18: *"prepara la arquitectura para que
   posteriormente una rutina pueda organizarse en bloques […] NO es necesario
   construir una interfaz avanzada"*. Nace a `null`, está declarado en
   `PREPARADO_PARA` y **no se pinta**, porque un selector de bloques con un solo
   bloque sería un control decorativo (regla 8). */
export function crearLinea({
  exerciseId = '', orden = 0, series = SERIES_POR_DEFECTO, modo = null,
  repeticiones = null, repsHasta = null, duracion = null,
  peso = null, tipoCarga: carga = null, descanso = DESCANSO_POR_DEFECTO,
  notas = '', bloqueId = null, config = {}, propios = [],
} = {}) {
  /* ⚠️ `propios` son los ejercicios que se haya creado Josué (FIT F2). Sin
     pasarlos, una línea sobre uno suyo no tendría de dónde proponer el modo y
     nacería en repeticiones aunque él lo hubiera medido en segundos. */
  const ej = ejercicioPorId(texto(exerciseId), propios);
  /* 🚨 El modo se PROPONE desde el catálogo: un L-sit nace en tiempo porque sus
     `medidas` lo dicen (FIT F2). Así no hay que acordarse de cambiarlo, y el
     apartado 11 se cumple sin que él haga nada. */
  const modoSugerido = modo && modoLinea(modo)
    ? modo
    : (ej && !ej.medidas.includes('reps') && ej.medidas.includes('tiempo') ? 'tiempo' : 'reps');
  const cargaSugerida = carga && tipoCarga(carga)
    ? carga
    : (ej && (ej.entornos.includes('calistenia') && !ej.equipamiento.some((e) => ['barra', 'mancuernas', 'maquina', 'polea', 'discos', 'kettlebell'].includes(e)))
      ? 'corporal' : 'externo');
  const s = enteroONull(series);
  return {
    id: uid(),
    exerciseId: texto(exerciseId),
    orden: enteroONull(orden) ?? 0,
    series: s === null ? SERIES_POR_DEFECTO : Math.min(MAX_SERIES, Math.max(1, s)),
    modo: modoSugerido,
    repeticiones: enteroONull(repeticiones),
    repsHasta: enteroONull(repsHasta),
    duracion: enteroONull(duracion),
    peso: numeroONull(peso),
    tipoCarga: cargaSugerida,
    descanso: enteroONull(descanso) ?? DESCANSO_POR_DEFECTO,
    notas: texto(notas),
    bloqueId: texto(bloqueId) || null,
    config: config && typeof config === 'object' ? config : {},
  };
}

export function normalizarLinea(g) {
  if (!g || !texto(g.id) || !texto(g.exerciseId)) return null;
  return { ...crearLinea(g), id: g.id };
}

/** El nombre se PREGUNTA al catálogo, nunca se guarda en la línea (apartado 31). */
export function nombreDeLinea(linea, propios = []) {
  const ej = ejercicioPorId(linea?.exerciseId, propios);
  return ej ? nombreCompleto(ej) : 'Ejercicio que ya no existe';
}

/** *"4 × 8"*, *"4 × 8-12"*, *"3 × 20 s"* — el texto del apartado 7. */
export function textoDeSeries(linea) {
  if (!linea) return '';
  const s = linea.series || 0;
  if (linea.modo === 'tiempo') {
    return linea.duracion ? `${s} × ${linea.duracion} s` : `${s} series`;
  }
  if (linea.repeticiones === null) return `${s} series`;
  if (linea.repsHasta && linea.repsHasta > linea.repeticiones) {
    return `${s} × ${linea.repeticiones}-${linea.repsHasta}`;
  }
  return `${s} × ${linea.repeticiones}`;
}

/** *"+10 kg"*, *"20 kg"*, o nada si es peso corporal (apartado 12). */
export function textoDeCarga(linea) {
  const t = tipoCarga(linea?.tipoCarga);
  if (!t || !t.llevaNumero) return '';
  if (linea.peso === null) return '';
  return `${t.signo}${linea.peso} kg`;
}

/** Los músculos resumidos de la tarjeta: *"Espalda · Bíceps"* (apartado 7). */
export function musculosResumidos(linea, propios = [], cuantos = 2) {
  const ej = ejercicioPorId(linea?.exerciseId, propios);
  if (!ej) return '';
  const grupos = [];
  for (const m of lista(ej.musculos).slice().sort((a, b) => (b.porcentaje || 0) - (a.porcentaje || 0))) {
    const s = subgrupoMuscular(m.subgrupoId);
    if (s && !grupos.includes(s.grupo)) grupos.push(s.grupo);
  }
  return grupos.slice(0, cuantos).join(' · ');
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LA RUTINA (apartados 3, 4 y 24)
   ═══════════════════════════════════════════════════════════════════════════

   Amplía el `WorkoutPlan` de la F1. ⚠️ **El `entorno` en singular se absorbe en
   `entornos`**, la lista, igual que en el ejercicio de la FIT F2 — y por el
   motivo que da el apartado 3: *"Una rutina puede utilizar ejercicios de
   diferentes entornos si tiene sentido"*. Obligar a elegir uno haría imposible
   una rutina híbrida, que es exactamente lo que el enunciado pide no hacer.

   ⚠️ Y **el número de ejercicios NO es un campo** (apartado 21): se cuenta. */
export function crearRutina({
  id = null, nombre = '', descripcion = '', entornos = [], entorno = '',
  lineas = [], bloques = [], meta = {},
} = {}) {
  const l = lista(lineas).map(normalizarLinea).filter(Boolean);
  return {
    id: texto(id) || uid(),
    nombre: texto(nombre),
    descripcion: texto(descripcion),
    entornos: (() => {
      const x = lista(entornos).map(texto).filter((e) => ENTORNOS.some((c) => c.id === e));
      const viejo = texto(entorno);
      if (!x.length && viejo && ENTORNOS.some((c) => c.id === viejo)) return [viejo];
      return x;
    })(),
    lineas: l.map((linea, i) => ({ ...linea, orden: i })),
    bloques: lista(bloques),
    meta: meta && typeof meta === 'object' ? meta : {},
  };
}

export function normalizarRutina(g) {
  if (!g || !texto(g.id)) return null;
  return crearRutina(g);
}

/* Una rutina se guarda como `WorkoutPlan`, que es el modelo de la F1 y el que
   leerán la biblioteca, el entrenamiento en vivo y el historial. Traducir aquí
   —en vez de guardar la forma del constructor— es lo que evita tener dos
   entidades para lo mismo (apartado 31).

   🚨 **Y las líneas pasan por el normalizador de la F1, a propósito.** La
   primera versión de esto devolvía `ejercicios: r.lineas` por encima, saltándose
   `normalizarWorkoutExercise` — y entonces una prueba del ida y vuelta habría
   salido verde **con el modelo de la F1 sin enterarse de los cinco campos
   nuevos**, que es justo lo que `App.jsx` sí ejecuta al cargar. Una
   comprobación que no puede ponerse roja no sirve (EH F42). */
export function rutinaAPlan(rutina) {
  const r = crearRutina(rutina || {});
  return {
    ...crearWorkoutPlan({
      nombre: r.nombre,
      descripcion: r.descripcion,
      entorno: r.entornos[0] || '',
      duracion: Math.round(duracionEstimada(r).minutos),
      ejercicios: r.lineas,
      meta: { ...r.meta, entornos: r.entornos, bloques: r.bloques },
    }),
    id: r.id,
  };
}

/* ⚠️ `creadoEn` y `editadoEn` NO viajan a la rutina del constructor: son de la
   plantilla guardada, y el constructor no los toca. Quien los sella es
   `guardarRutina`, una sola vez y en un solo sitio. */
export function planARutina(plan) {
  const p = normalizarWorkoutPlan(plan);
  if (!p) return null;
  return crearRutina({
    id: p.id,
    nombre: p.nombre,
    descripcion: p.descripcion,
    entornos: lista(p.meta?.entornos),
    entorno: p.entorno,
    lineas: lista(p.ejercicios),
    bloques: lista(p.meta?.bloques),
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LAS OPERACIONES DEL CONSTRUCTOR (apartados 5-8, 16 y 17)
   ═══════════════════════════════════════════════════════════════════════════

   Todas devuelven **una rutina nueva**: no mutan la que reciben. Así el
   deshacer de una fase futura no tiene que reconstruir nada, y React ve el
   cambio sin trucos. */

/** Apartado 6: *"Debe añadirse a la rutina inmediatamente […] No quiero un flujo
 *  innecesariamente largo."* Una llamada, y ya está dentro. */
export function anadirEjercicio(rutina, exerciseId, opciones = {}) {
  const r = crearRutina(rutina || {});
  if (!ejercicioPorId(texto(exerciseId), opciones.propios || [])) return r;
  const linea = crearLinea({ ...opciones, exerciseId, orden: r.lineas.length });
  return { ...r, lineas: [...r.lineas, linea] };
}

/** Apartado 15. 🚨 **Cambia SOLO esa línea de esa rutina**: `exerciseId` está
 *  entre lo que no se puede tocar, porque cambiarlo convertiría una edición en
 *  un ejercicio distinto sin decírselo a nadie. */
export function editarLinea(rutina, lineaId, cambios = {}) {
  const r = crearRutina(rutina || {});
  return {
    ...r,
    lineas: r.lineas.map((l) => {
      if (l.id !== lineaId) return l;
      const { id, exerciseId, orden, ...resto } = cambios;
      return { ...crearLinea({ ...l, ...resto }), id: l.id, exerciseId: l.exerciseId, orden: l.orden };
    }),
  };
}

/* ── La variante (apartado 15) ─────────────────────────────────────────────
   *"Debe permitir modificar […] variante cuando sea compatible"*, y ese
   *"cuando sea compatible"* es literal: en el modelo de la F2 una variante **es
   otro ejercicio**, con su id, sus músculos y su equipamiento. Así que cambiar
   de variante es cambiar el `exerciseId`, y por eso NO se hace desde
   `editarLinea` —que lo prohíbe a propósito—, sino por esta puerta, que **solo
   acepta ejercicios de la misma familia**.

   ⚠️ La configuración se queda: cambiar unas dominadas pronas por supinas no
   tiene por qué borrarle las cuatro series que había puesto. */
export function variantesDeLinea(linea, propios = []) {
  const ej = ejercicioPorId(linea?.exerciseId, propios);
  if (!ej) return [];
  const raiz = baseDe(ej, propios) || ej;
  const familia = [raiz, ...variantesDe(raiz, propios), ...variantesDe(ej, propios)];
  const vistos = new Set([ej.id]);
  return familia.filter((v) => {
    if (!v || vistos.has(v.id)) return false;
    vistos.add(v.id);
    return true;
  });
}

export function cambiarVariante(rutina, lineaId, exerciseIdNuevo, propios = []) {
  const r = crearRutina(rutina || {});
  const linea = r.lineas.find((l) => l.id === lineaId);
  if (!linea) return r;
  const permitidas = variantesDeLinea(linea, propios).map((v) => v.id);
  /* 🚨 Un id que no es de la familia **no se acepta**: si no, ésta sería la
     puerta de atrás por la que un ejercicio se convierte en otro distinto. */
  if (!permitidas.includes(texto(exerciseIdNuevo))) return r;
  /* 🔓 FIT F33 — y cambia por la misma puerta que una sustitución: con dos, una
     variante que se mide en segundos se quedaría con las repeticiones puestas. */
  return sustituirEnRutina(r, lineaId, exerciseIdNuevo, propios);
}

/** 🔓 FIT F33, apartados 15 y 16 — sustituir en el constructor (el borrador) o
 *  en una plantilla que se está editando. 🚨 **Cambia ESA línea de ESA
 *  rutina**: el ejercicio del catálogo no se toca —esto recibe una rutina y
 *  devuelve una rutina—, y las otras plantillas tampoco, porque quien guarda es
 *  `guardarRutina`, que sustituye por id.
 *
 *  A diferencia de `cambiarVariante`, **acepta cualquier ejercicio**: es la
 *  puerta de delante, la que él elige con los niveles de compatibilidad
 *  delante o buscando a mano (apartado 25). La configuración la decide
 *  `configuracionRecomendada` (apartados 11-13): series, descanso y nota se
 *  quedan; la medida y la carga se adaptan al nuevo, y el peso no viaja. */
export function sustituirEnRutina(rutina, lineaId, exerciseIdNuevo, propios = []) {
  const r = crearRutina(rutina || {});
  const linea = r.lineas.find((l) => l.id === lineaId);
  const nuevo = ejercicioPorId(texto(exerciseIdNuevo), propios);
  if (!linea || !nuevo || nuevo.id === linea.exerciseId) return r;
  const c = configuracionRecomendada(linea, ejercicioPorId(linea.exerciseId, propios), nuevo);
  return {
    ...r,
    lineas: r.lineas.map((l) => (l.id === lineaId ? {
      ...l,
      exerciseId: nuevo.id,
      modo: c.modo,
      repeticiones: c.repeticiones,
      repsHasta: c.repsHasta,
      duracion: c.duracion,
      peso: null,
      tipoCarga: c.tipoCarga,
    } : l)),
  };
}

export function eliminarLinea(rutina, lineaId) {
  const r = crearRutina(rutina || {});
  return { ...r, lineas: r.lineas.filter((l) => l.id !== lineaId).map((l, i) => ({ ...l, orden: i })) };
}

/** Apartado 17. La copia lleva **su propio id** y se coloca justo debajo: si
 *  compartiera id, editar una editaría las dos. */
export function duplicarLinea(rutina, lineaId) {
  const r = crearRutina(rutina || {});
  const i = r.lineas.findIndex((l) => l.id === lineaId);
  if (i === -1) return r;
  const copia = { ...r.lineas[i], id: uid() };
  const lineas = [...r.lineas.slice(0, i + 1), copia, ...r.lineas.slice(i + 1)];
  return { ...r, lineas: lineas.map((l, n) => ({ ...l, orden: n })) };
}

/** Apartado 8. ⚠️ **Subir y bajar, no arrastrar**: es la decisión de EH F50 —las
 *  flechas funcionan con el lector de pantalla y el arrastre en un móvil es
 *  poco fiable—, y el propio enunciado la admite: *"o controles subir/bajar si
 *  el drag & drop no es suficientemente fiable"*. */
export function moverLinea(rutina, lineaId, direccion) {
  const r = crearRutina(rutina || {});
  const i = r.lineas.findIndex((l) => l.id === lineaId);
  if (i === -1) return r;
  const j = direccion === 'arriba' ? i - 1 : i + 1;
  if (j < 0 || j >= r.lineas.length) return r;
  const lineas = [...r.lineas];
  [lineas[i], lineas[j]] = [lineas[j], lineas[i]];
  return { ...r, lineas: lineas.map((l, n) => ({ ...l, orden: n })) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LO QUE SE CALCULA (apartados 19, 20, 21 y 22)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 21: *"No debe ser un campo manual."* */
export const cuantosEjercicios = (rutina) => lista(rutina?.lineas).length;

/** Apartado 19. Devuelve la distribución **por grupo y por subgrupo**, ya
 *  normalizada a 100, ponderando por series. */
export function distribucionMuscular(rutina, propios = []) {
  const bruto = {};
  for (const l of lista(rutina?.lineas)) {
    const ej = ejercicioPorId(l.exerciseId, propios);
    if (!ej) continue;
    const peso = Math.max(1, l.series || 1);
    for (const m of lista(ej.musculos)) {
      bruto[m.subgrupoId] = (bruto[m.subgrupoId] || 0) + (m.porcentaje || 0) * peso;
    }
  }
  const suma = Object.values(bruto).reduce((a, b) => a + b, 0);
  if (!suma) return { total: 0, grupos: [], subgrupos: [] };

  const subgrupos = Object.entries(bruto)
    .map(([id, v]) => {
      const s = subgrupoMuscular(id);
      return {
        subgrupoId: id,
        nombre: s ? s.nombre : id,
        grupoId: s ? s.grupoId : null,
        grupo: s ? s.grupo : '',
        porcentaje: Math.round((v / suma) * 100),
      };
    })
    .sort((a, b) => b.porcentaje - a.porcentaje);

  const porGrupo = {};
  for (const s of subgrupos) {
    if (!s.grupoId) continue;
    porGrupo[s.grupoId] = (porGrupo[s.grupoId] || 0) + s.porcentaje;
  }
  const grupos = GRUPOS_MUSCULARES
    .filter((g) => porGrupo[g.id])
    .map((g) => ({ grupoId: g.id, nombre: g.nombre, porcentaje: porGrupo[g.id] }))
    .sort((a, b) => b.porcentaje - a.porcentaje);

  return { total: subgrupos.length, grupos, subgrupos };
}

/* Cuánto se tarda en una serie. Para repeticiones se cuentan tres segundos por
   repetición con un suelo de veinte, que es lo que tarda cualquier serie corta;
   para tiempo, lo que dure. Son estimaciones y por eso el resultado se redondea
   a cinco minutos: no se finge una precisión que no hay (apartado 20). */
export const SEGUNDOS_POR_REP = 3;
export const MINIMO_POR_SERIE = 20;
export const TRANSICION_ENTRE_EJERCICIOS = 60;
/* ⚠️ Cuántas repeticiones se suponen cuando él todavía no las ha escrito. **No
   se guarda en ninguna parte y no se enseña**: solo entra en una estimación que
   sale rotulada con un «≈» y redondeada a cinco minutos. Escribirle un 10 a la
   línea sí sería inventarle un dato (HT F3); usarlo para decir «≈ 45 min» es lo
   que el apartado 20 llama *"no necesita ser perfecta"*. */
export const REPS_SUPUESTAS = 10;

export function duracionEstimada(rutina, propios = []) {
  let segundos = 0;
  const lineas = lista(rutina?.lineas);
  for (const l of lineas) {
    const series = Math.max(1, l.series || 1);
    const porSerie = l.modo === 'tiempo'
      ? Math.max(l.duracion || 0, 10)
      : Math.max(MINIMO_POR_SERIE, (l.repeticiones || REPS_SUPUESTAS) * SEGUNDOS_POR_REP);
    /* El último descanso de un ejercicio no cuenta: se encadena con la
       transición al siguiente. */
    segundos += series * porSerie + Math.max(0, series - 1) * (l.descanso || 0);
  }
  segundos += Math.max(0, lineas.length - 1) * TRANSICION_ENTRE_EJERCICIOS;
  const minutos = segundos / 60;
  const redondeado = Math.max(0, Math.round(minutos / 5) * 5);
  return {
    segundos,
    minutos,
    /* ⚠️ El «≈» va en el texto, no en un comentario: quien lo lee tiene que ver
       que es una estimación (apartado 20 y regla 8). */
    texto: lineas.length === 0 ? '' : `≈ ${redondeado} min`,
  };
}

/** El resumen del apartado 22, todo derivado. */
export function resumenRutina(rutina, propios = []) {
  return {
    nombre: texto(rutina?.nombre),
    ejercicios: cuantosEjercicios(rutina),
    duracion: duracionEstimada(rutina, propios).texto,
    distribucion: distribucionMuscular(rutina, propios),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · VALIDACIÓN (apartado 27)
   ═══════════════════════════════════════════════════════════════════════════

   *"No permitas estados absurdos."* Devuelve **la lista de problemas**, no un
   booleano: una pantalla que solo sabe que «algo está mal» no puede decir qué
   corregir, y eso es lo que prohíbe EH F62. */
export function validarRutina(rutina, propios = []) {
  const problemas = [];
  const r = rutina || {};
  if (!texto(r.nombre)) problemas.push({ campo: 'nombre', que: 'Ponle un nombre al entrenamiento.' });
  const lineas = lista(r.lineas);
  if (lineas.length === 0) problemas.push({ campo: 'lineas', que: 'Añade al menos un ejercicio.' });
  for (const l of lineas) {
    const nombre = nombreDeLinea(l, propios);
    if (!ejercicioPorId(l.exerciseId, propios)) {
      problemas.push({ campo: 'lineas', lineaId: l.id, que: `«${nombre}» ya no está en el catálogo.` });
      continue;
    }
    if (!l.series || l.series < 1) problemas.push({ campo: 'series', lineaId: l.id, que: `«${nombre}» necesita al menos una serie.` });
    if (l.series > MAX_SERIES) problemas.push({ campo: 'series', lineaId: l.id, que: `«${nombre}»: ${MAX_SERIES} series es el máximo.` });
    if (l.modo === 'reps' && l.repeticiones !== null && l.repeticiones < 1) {
      problemas.push({ campo: 'repeticiones', lineaId: l.id, que: `«${nombre}»: las repeticiones tienen que ser más de cero.` });
    }
    if (l.modo === 'reps' && l.repsHasta !== null && l.repeticiones !== null && l.repsHasta < l.repeticiones) {
      problemas.push({ campo: 'repeticiones', lineaId: l.id, que: `«${nombre}»: el rango va de menos a más.` });
    }
    if (l.modo === 'tiempo' && l.duracion !== null && l.duracion < 1) {
      problemas.push({ campo: 'duracion', lineaId: l.id, que: `«${nombre}»: la duración tiene que ser más de cero.` });
    }
    if (l.descanso < 0) problemas.push({ campo: 'descanso', lineaId: l.id, que: `«${nombre}»: el descanso no puede ser negativo.` });
    if (l.peso !== null && l.peso < 0) problemas.push({ campo: 'peso', lineaId: l.id, que: `«${nombre}»: el peso no puede ser negativo.` });
  }
  return { ok: problemas.length === 0, problemas };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · GUARDAR Y EDITAR (apartados 23 y 24)
   ═══════════════════════════════════════════════════════════════════════════

   ⚠️ **Devuelve la lista nueva de planes, no escribe nada.** Quien escribe en
   `app_data` es `App.jsx`, como en toda la aplicación. Y guardar una rutina que
   ya existía la **sustituye** en su sitio en vez de añadir una copia: es lo que
   convierte el apartado 24 —*"abrir una rutina guardada y editarla"*— en algo
   que funciona de verdad. */
export function guardarRutina(planes, rutina, propios = [], hoy = todayISO()) {
  const v = validarRutina(rutina, propios);
  if (!v.ok) return { ok: false, problemas: v.problemas, planes: lista(planes) };
  const actuales = lista(planes);
  const i = actuales.findIndex((p) => p.id === (rutina || {}).id);
  /* FIT F4, apartado 6: *"actualizar la plantilla existente, mantener su mismo
     ID, actualizar updatedAt"*. ⚠️ `creadoEn` se conserva si ya existía: una
     edición no puede reescribir cuándo se creó. */
  const antes = i === -1 ? null : actuales[i];
  const plan = {
    ...rutinaAPlan(rutina),
    creadoEn: (antes && antes.creadoEn) || hoy,
    editadoEn: hoy,
  };
  const siguientes = i === -1 ? [...actuales, plan] : actuales.map((p) => (p.id === plan.id ? plan : p));
  return { ok: true, problemas: [], planes: siguientes, plan };
}

export function abrirParaEditar(planes, planId) {
  const p = lista(planes).find((x) => x.id === planId);
  return p ? planARutina(p) : null;
}

/** Apartado 26: la alerta **solo si hay cambios**. Compara lo que importa, no
 *  el objeto entero: los ids y el orden se recalculan y darían falsos positivos. */
export function hayCambios(rutina, original) {
  const limpia = (r) => {
    const c = crearRutina(r || {});
    return JSON.stringify({
      nombre: c.nombre,
      descripcion: c.descripcion,
      entornos: c.entornos,
      lineas: c.lineas.map((l) => ({
        exerciseId: l.exerciseId, series: l.series, modo: l.modo,
        repeticiones: l.repeticiones, repsHasta: l.repsHasta, duracion: l.duracion,
        peso: l.peso, tipoCarga: l.tipoCarga, descanso: l.descanso, notas: l.notas,
      })),
    });
  };
  return limpia(rutina) !== limpia(original);
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · EL BORRADOR (apartado 25)
   ═══════════════════════════════════════════════════════════════════════════

   *"Si el usuario cierra accidentalmente, navega atrás, recarga, no debería
   perder todo el trabajo."* El borrador va a `localStorage` y no a `app_data`
   por el mismo motivo que el zoom del Horario (HT F4): es de **este
   dispositivo** y de **este rato**, no un dato suyo que deba sincronizarse.

   🚨 **Y toda escritura va envuelta en `try`**: en una ventana privada de
   Safari `setItem` **lanza**, y sin el `try` no es que se pierda el borrador —
   es que se lleva por delante lo que viniera después (SF F1). */
export const CLAVE_BORRADOR = 'fitness-borrador-rutina';

export function guardarBorrador(rutina) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(crearRutina(rutina || {})));
    return true;
  } catch {
    return false;
  }
}

export function leerBorrador() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const crudo = window.localStorage.getItem(CLAVE_BORRADOR);
    if (!crudo) return null;
    return normalizarRutina(JSON.parse(crudo));
  } catch {
    return null;
  }
}

export function borrarBorrador() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    window.localStorage.removeItem(CLAVE_BORRADOR);
    return true;
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · LO QUE QUEDA PREPARADO Y LO QUE NO SE CONSTRUYE
   ═══════════════════════════════════════════════════════════════════════════ */

/* Apartado 18: la arquitectura admite bloques, pero **no se pinta ninguno**.
   Declarado en vez de omitido, con quién lo llenará. */
export const PREPARADO_PARA = [
  { que: 'Bloques y secciones (Calentamiento, Fuerza, Core…)', como: 'Cada línea lleva `bloqueId`, y la rutina una lista `bloques`. Nacen vacíos y no se pintan: un selector con un solo bloque sería un control decorativo (regla 8).', apartado: 18 },
  { que: 'Abrir y editar una rutina guardada', como: '`abrirParaEditar()` y `guardarRutina()`, que SUSTITUYE en vez de añadir una copia.', apartado: 24 },
  { que: 'Registrar el peso real en el entrenamiento en vivo', como: '`tipoCarga` distingue peso corporal, añadido y externo, así que la sesión sabrá qué preguntar.', apartado: 12 },
  { que: 'Reutilizar la distribución muscular', como: '`distribucionMuscular()` devuelve por grupo y por subgrupo, para el detalle del plan, los rangos, la IA y las estadísticas.', apartado: 19 },
];

export const NO_EN_FIT3 = [
  { que: 'Biblioteca de planes y planes predefinidos', porque: 'Apartado 30. Son las FIT F4 y F5.' },
  { que: 'Entrenamiento en vivo y cronómetro de sesión', porque: 'Apartado 30. Es la FIT F7.' },
  { que: 'Registro de series reales', porque: 'Apartado 30. Lo que hay aquí es la plantilla, no lo que pasó.' },
  { que: 'Historial', porque: 'Apartado 30. Es la FIT F10.' },
  { que: 'Rangos', porque: 'Apartado 30. La distribución muscular ya está lista para cuando llegue.' },
  { que: 'Progreso fotográfico', porque: 'Apartado 30, y ya se gestiona en Salud física (FIT F1).' },
  { que: 'IA de adaptación', porque: 'Apartado 30. Para eso están `entornos` y `equipamiento` separados (FIT F2).' },
  { que: 'La interfaz de bloques', porque: 'Apartado 18: *"NO es necesario construir una interfaz avanzada de bloques en esta fase"*. La arquitectura sí está.' },
];
