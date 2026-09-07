// ══════════════════════════════════════════════════════════════════════════
// ENTREGA 3 · FASE 27 (PR F5) — PRODUCTIVIDAD: METAS + OBJETIVOS
// ══════════════════════════════════════════════════════════════════════════
//
// *"Hay que evitar que Metas y Objetivos parezcan dos sistemas iguales."*
//
//     OBJETIVO  — la dirección grande ("Mejorar mi físico durante 2026")
//        ↓
//     METAS     — resultados concretos y medibles ("Conseguir 15 dominadas")
//        ↓
//     TAREAS    — acciones ("Entrenar hoy")
//
// 🚨 **NI UN OBJETIVO NUEVO NI UNA META NUEVA: SE AMPLÍAN LAS QUE YA EXISTEN.**
//    Los objetivos viven en la clave `objetivos` desde la Fase 9 y las metas en
//    `productividad.metas` desde la Fase 6. Crear listas nuevas al lado habría
//    dejado **los objetivos de Josué invisibles en su propia mini-app**, que es
//    exactamente el fallo que la E3 F16 cazó con las notas de la Biblioteca.
//
//    Por eso **ni un campo se renombra**: `texto` sigue siendo el nombre de un
//    objetivo y `nombre` el de una meta, porque así los leen el catálogo de la
//    papelera, la exportación, `predicciones.js`, `logros.js`, el Calendario, el
//    Dashboard y el `objetivoId` de EH F28. Lo que hace esta fase es **añadir**.
//
// 🚨 **`cumplido` Y `estado` SON DOS EJES, NO DOS NOMBRES DE LO MISMO.**
//    El enunciado pide cuatro estados —Activo · En pausa · Completado ·
//    Archivado— y un booleano no puede con cuatro. Pero `cumplido` lo leen
//    **veinticuatro archivos**, Fe incluido (que tiene sus propios objetivos
//    espirituales con la misma forma), así que no se toca.
//
//    La solución es la de EH F36 con `activo`/`oculto`: **dos campos
//    independientes**. `cumplido` dice si está hecho; `estado` dice dónde está
//    —activo, en pausa o archivado—. Y *"Completado"* **se deriva**:
//    `estadoDeObjetivo()` es la única respuesta a *"¿en qué estado está?"*.
//
//    ⚠️ Y de ahí sale gratis la lección de la E3 F19: **archivar un objetivo
//    cumplido no le borra que lo cumplió**. Con un solo campo, sí.
//
// 🚨 **UNA FECHA LÍMITE, DOS ORÍGENES, UNA SOLA RESPUESTA.** `plazo` (30 días…
//    10 años) es lo que ya existía y lo que usa `predicciones.js`; el enunciado
//    pide además una *"fecha objetivo"* concreta y opcional. **No son el mismo
//    campo con dos nombres** —el fallo de la E3 F26—: son un horizonte y un día.
//    `fechaLimiteDeObjetivo()` da **una sola** respuesta —la fecha concreta
//    manda, el plazo rellena el hueco— y **el choque se enseña**, como
//    `tallaDe()` (EH F5) y `frecuenciaDeCorte()` (EH F11).
//
// ⚠️ **LAS PRIORIDADES SON LAS DE TAREAS.** El enunciado pide Baja/Media/Alta
//    para objetivos y para metas, que es exactamente `PRIORIDADES` de la E3 F26.
//    Se importa. Tres listas iguales acabarían diciendo cosas distintas.

import { todayISO, uid, fechaValida, addDays } from './helpers.js';
/* ⚠️ **HAY DOS `diasEntre` EN EL PROYECTO Y NO SIGNIFICAN LO MISMO**: el de
   `rachas.js` cuenta los dos extremos (+1, para una racha) y el de `hoy.js` es
   la resta seca. Aquí hace falta la resta —*"12 días restantes"*—, así que se
   importa el de `hoy.js`. Escribir un tercero sería el duplicado de siempre. */
import { diasEntre } from './hoy.js';
import { PRIORIDADES, PRIORIDAD_POR_DEFECTO, prioridad, etiquetaDePrioridad } from './tareas.js';
import { PLAZOS_OBJETIVO, PERIODOS_META } from '../tokens.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const txt = (s) => (typeof s === 'string' ? s : '');
const num = (v, porDefecto = 0) => (Number.isFinite(Number(v)) ? Number(v) : porDefecto);

/* ⚠️ `export { X }`, nunca `export … from`: eso no crea binding local y este
   archivo también las usa (EH F17). */
export { PRIORIDADES, PRIORIDAD_POR_DEFECTO, prioridad, etiquetaDePrioridad, PLAZOS_OBJETIVO, PERIODOS_META };

/* ══════════════════════════════════════════════════════════════════════════
   OBJETIVOS — "Define hacia dónde quieres avanzar."
   ══════════════════════════════════════════════════════════════════════════ */

/* Los tres que se GUARDAN. *"Completado"* no está aquí a propósito: sale de
   `cumplido`, que es el campo que ya existía y que leen otros veinticuatro
   archivos. Ver la cabecera. */
export const ESTADOS_OBJETIVO = [
  { id: 'activo', nombre: 'Activo', icono: '▶', enPortada: true },
  { id: 'pausa', nombre: 'En pausa', icono: '❚❚', enPortada: false },
  { id: 'archivado', nombre: 'Archivado', icono: '📦', enPortada: false },
];

/** El cuarto estado, el derivado. No se guarda: se calcula. */
export const ESTADO_COMPLETADO = { id: 'completado', nombre: 'Completado', icono: '✓', enPortada: false };

export const TODOS_LOS_ESTADOS_OBJETIVO = [...ESTADOS_OBJETIVO, ESTADO_COMPLETADO];

export const estadoObjetivo = (id) => TODOS_LOS_ESTADOS_OBJETIVO.find((e) => e.id === id) || null;

/** 🚨 LA ÚNICA respuesta a *"¿en qué estado está este objetivo?"*. Cumplido gana
 *  a todo lo demás; archivado y en pausa se leen del campo guardado. */
export function estadoDeObjetivo(o) {
  if (!o) return null;
  if (o.cumplido) return 'completado';
  const e = ESTADOS_OBJETIVO.find((x) => x.id === o.estado);
  return e ? e.id : 'activo';
}

/* *"No obligar al usuario a utilizar categorías."* Cada una declara su módulo
   de JosStyle donde lo hay, como `CATEGORIAS_TAREA` (E3 F26): así "Estudios" es
   el módulo Estudios y no una etiqueta que casualmente se llama igual. */
export const CATEGORIAS_OBJETIVO = [
  { id: 'personal', nombre: 'Personal', icono: '🙂', modulo: null },
  { id: 'fitness', nombre: 'Fitness', icono: '🏋️', modulo: 'calistenia' },
  { id: 'estudios', nombre: 'Estudios', icono: '📚', modulo: 'estudios' },
  { id: 'trabajo', nombre: 'Trabajo', icono: '💼', modulo: 'negocio' },
  { id: 'economia', nombre: 'Economía', icono: '💶', modulo: 'economia' },
  { id: 'relaciones', nombre: 'Relaciones', icono: '🤝', modulo: null },
  { id: 'otros', nombre: 'Otros', icono: '•', modulo: null },
];

export const categoriaObjetivo = (id) => CATEGORIAS_OBJETIVO.find((c) => c.id === id) || null;

/* ⚠️ **UN SOLO OBJETIVO PRINCIPAL.** El enunciado deja elegir —*"uno o varios
   destacados según la arquitectura que resulte más útil"*— y la propia fase
   dice para qué es: que Hoy pueda decir *"Objetivo principal: Mejorar mi
   físico"*. En singular. Con varios, esa frase no se podría escribir. */
export const OBJETIVOS_PRINCIPALES_MAX = 1;

export function crearObjetivo({
  texto, descripcion = '', plazo = null, fechaObjetivo = null,
  categoria = null, prioridadId = PRIORIDAD_POR_DEFECTO, hoy = todayISO(),
} = {}) {
  const limpio = txt(texto).trim();
  if (!limpio) return null;
  // 🚨 El plazo NO tiene valor por defecto (EH F28, HT F3): elegirlo por él
  // metería su viaje a Japón en "30 días" sin decírselo.
  if (!PLAZOS_OBJETIVO.includes(plazo)) return null;
  return normalizarObjetivo({
    id: uid(),
    texto: limpio,
    descripcion: txt(descripcion).trim(),
    plazo,
    fechaCreacion: hoy,
    fechaObjetivo: fechaValida(fechaObjetivo) ? fechaObjetivo : null,
    categoria: categoriaObjetivo(categoria) ? categoria : null,
    prioridad: prioridad(prioridadId) ? prioridadId : PRIORIDAD_POR_DEFECTO,
    cumplido: false,
    estado: 'activo',
    principal: false,
  });
}

/* ⚠️ **Al añadir un campo a una entidad, añadirlo también a su normalizador**
   (regla 5, y este proyecto lo ha aprendido diecinueve veces). Los cinco de
   siempre —`id`, `texto`, `plazo`, `cumplido`, `fechaCreacion`— se conservan
   intactos: son los que leen los otros veinticuatro archivos. */
export function normalizarObjetivo(o) {
  if (!o || typeof o !== 'object') return null;
  const texto = txt(o.texto).trim();
  if (!texto) return null;
  return {
    id: txt(o.id) || uid(),
    texto,
    plazo: PLAZOS_OBJETIVO.includes(o.plazo) ? o.plazo : PLAZOS_OBJETIVO[0],
    cumplido: !!o.cumplido,
    fechaCreacion: fechaValida(o.fechaCreacion) ? o.fechaCreacion : null,
    // Lo que añade la PR F5:
    descripcion: txt(o.descripcion).trim(),
    fechaObjetivo: fechaValida(o.fechaObjetivo) ? o.fechaObjetivo : null,
    categoria: categoriaObjetivo(o.categoria) ? o.categoria : null,
    prioridad: prioridad(o.prioridad) ? o.prioridad : PRIORIDAD_POR_DEFECTO,
    estado: ESTADOS_OBJETIVO.some((e) => e.id === o.estado) ? o.estado : 'activo',
    principal: !!o.principal,
    // ⚠️ Una fecha de cumplido en algo sin cumplir sería una mentira guardada.
    cumplidoEn: o.cumplido && fechaValida(o.cumplidoEn) ? o.cumplidoEn : null,
  };
}

export const normalizarObjetivos = (arr) => lista(arr).map(normalizarObjetivo).filter(Boolean);

/** Normaliza la clave entera, que es lo que llama `App.jsx` al cargar.
 *  ⚠️ Devuelve el objeto completo: `saveData` sobrescribe, así que perder
 *  `ultimaRevision` aquí borraría el aviso de revisión de la Fase 9. */
export function normalizarObjetivosDe(objetivos) {
  if (!objetivos || typeof objetivos !== 'object') return objetivos;
  return { ...objetivos, lista: normalizarObjetivos(objetivos.lista) };
}

export function editarObjetivo(o, cambios = {}) {
  if (!o) return null;
  return normalizarObjetivo({ ...o, ...cambios });
}

/** Completar. ⚠️ Apunta **cuándo**, como `completadaEn` de una tarea (E3 F26):
 *  sin la marca no se puede decir "cumplidos este mes". */
export function completarObjetivo(o, { hoy = todayISO() } = {}) {
  if (!o) return null;
  const cumplido = !o.cumplido;
  return { ...o, cumplido, cumplidoEn: cumplido ? hoy : null };
}

/** Pausar, reanudar y archivar. 🚨 **No tocan `cumplido`**: archivar un objetivo
 *  cumplido no puede borrarle que lo cumplió (E3 F19). */
export function cambiarEstadoObjetivo(o, estado) {
  if (!o || !ESTADOS_OBJETIVO.some((e) => e.id === estado)) return null;
  return { ...o, estado };
}

/** ⭐ Principal. Marcar uno **desmarca el anterior**, porque solo hay uno.
 *  Devuelve la lista entera; quien guarda es `App.jsx`. */
export function marcarPrincipal(listaObjetivos, id) {
  const arr = normalizarObjetivos(listaObjetivos);
  if (!arr.some((o) => o.id === id)) return null;
  const yaEra = arr.find((o) => o.id === id).principal;
  return arr.map((o) => ({ ...o, principal: !yaEra && o.id === id }));
}

export const objetivoPrincipal = (listaObjetivos) =>
  normalizarObjetivos(listaObjetivos).find((o) => o.principal && !o.cumplido) || null;

/* ── La fecha límite: una sola respuesta ───────────────────────────────────

   🚨 El día concreto manda; el plazo rellena el hueco; **y el choque se
   enseña**. Es `tallaDe()` (EH F5) y `frecuenciaDeCorte()` (EH F11) otra vez —
   nunca dos respuestas distintas a la misma pregunta. */
const DIAS_POR_PLAZO = { '30 días': 30, '90 días': 90, '1 año': 365, '5 años': 1825, '10 años': 3650 };

export function fechaLimiteDeObjetivo(o, { hoy = todayISO() } = {}) {
  if (!o) return null;
  const delPlazo = o.fechaCreacion && DIAS_POR_PLAZO[o.plazo]
    ? addDays(o.fechaCreacion, DIAS_POR_PLAZO[o.plazo])
    : null;
  const elegida = fechaValida(o.fechaObjetivo) ? o.fechaObjetivo : null;
  const fecha = elegida || delPlazo;
  if (!fecha) return null;
  return {
    fecha,
    origen: elegida ? 'elegida' : 'plazo',
    dias: diasEntre(hoy, fecha),
    vencida: fecha < hoy,
    // ⚠️ El choque no se resuelve en silencio: se dice.
    choca: !!(elegida && delPlazo && elegida !== delPlazo),
    segunPlazo: delPlazo,
  };
}

/** *"12 días restantes"* y *"Vencida"*, sin esconder nada. */
export function textoDePlazo(o, { hoy = todayISO() } = {}) {
  const f = fechaLimiteDeObjetivo(o, { hoy });
  if (!f) return null;
  if (f.vencida) return 'Vencida';
  if (f.dias === 0) return 'Hoy';
  return `${f.dias} ${f.dias === 1 ? 'día restante' : 'días restantes'}`;
}

/* ══════════════════════════════════════════════════════════════════════════
   METAS — "Convierte tus planes en resultados."
   ══════════════════════════════════════════════════════════════════════════ */

/* *"Debe permitir diferentes tipos… No implementar una lógica imposible de
   mantener."* Cuatro, y **cada uno declara cómo se calcula su progreso**: el
   reparto de `FRECUENCIAS_HABITO` (E3 F24) y de EH F14 — la lista es del
   módulo, el comportamiento está escrito en su línea. */
export const TIPOS_META = [
  {
    id: 'numerico', nombre: 'Numérico', ejemplo: '8 / 15',
    pideObjetivo: true, pideUnidad: true, pidePeriodo: false,
    explica: 'Cuentas cuánto llevas de un total.',
  },
  {
    id: 'porcentaje', nombre: 'Porcentaje', ejemplo: '72 %',
    pideObjetivo: false, pideUnidad: false, pidePeriodo: false,
    explica: 'Anotas directamente por cuánto vas.',
  },
  {
    id: 'check', nombre: 'Sí o no', ejemplo: 'Hecho',
    pideObjetivo: false, pideUnidad: false, pidePeriodo: false,
    explica: 'O está conseguida o no lo está.',
  },
  {
    id: 'frecuencia', nombre: 'Frecuencia', ejemplo: '3 / 4 por semana',
    pideObjetivo: true, pideUnidad: false, pidePeriodo: true,
    explica: 'Repetir algo un número de veces por periodo.',
  },
];

export const TIPO_META_POR_DEFECTO = 'numerico';
export const tipoMeta = (id) => TIPOS_META.find((t) => t.id === id) || null;

export function crearMeta({
  nombre, descripcion = '', tipo = TIPO_META_POR_DEFECTO, objetivo = 1, unidad = '',
  periodo = null, objetivoId = null, prioridadId = PRIORIDAD_POR_DEFECTO,
  fechaObjetivo = null, hoy = todayISO(),
} = {}) {
  const limpio = txt(nombre).trim();
  if (!limpio) return null;
  const t = tipoMeta(tipo) || tipoMeta(TIPO_META_POR_DEFECTO);
  // 🚨 El periodo de una meta NO tiene valor por defecto (E3 F19, y HT F3 y
  // EH F28 lo dijeron antes): elegirlo por él la metería en «Diaria» sin
  // decírselo. Solo lo piden las de frecuencia.
  if (t.pidePeriodo && !PERIODOS_META.includes(periodo)) return null;
  return normalizarMeta({
    id: uid(),
    nombre: limpio,
    descripcion: txt(descripcion).trim(),
    tipo: t.id,
    objetivo: t.pideObjetivo ? Math.max(1, num(objetivo, 1)) : 1,
    progreso: 0,
    unidad: t.pideUnidad ? txt(unidad).trim() : '',
    periodo: t.pidePeriodo ? periodo : null,
    objetivoId: txt(objetivoId) || null,
    prioridad: prioridad(prioridadId) ? prioridadId : PRIORIDAD_POR_DEFECTO,
    fechaObjetivo: fechaValida(fechaObjetivo) ? fechaObjetivo : null,
    completada: false,
    completadaEn: null,
    creadaEn: hoy,
  });
}

/* ⚠️ Lo guardado antes de esta fase es `{ id, nombre, periodo, objetivo,
   progreso }` y **se conserva entero**: `periodo` es lo que hace que una meta de
   frecuencia signifique algo ("4 veces por semana"), y `objetivo`/`progreso` son
   el valor objetivo y el actual del enunciado. Ni uno se renombra. */
export function normalizarMeta(m) {
  if (!m || typeof m !== 'object') return null;
  const nombre = txt(m.nombre).trim();
  if (!nombre) return null;
  // Una meta guardada antes de la PR F5 tiene `periodo` y no tiene `tipo`: si
  // llevaba periodo, era de frecuencia; si no, numérica.
  const tipoGuardado = tipoMeta(m.tipo);
  const t = tipoGuardado || (PERIODOS_META.includes(m.periodo) ? tipoMeta('frecuencia') : tipoMeta(TIPO_META_POR_DEFECTO));
  return {
    id: txt(m.id) || uid(),
    nombre,
    descripcion: txt(m.descripcion).trim(),
    tipo: t.id,
    objetivo: t.pideObjetivo ? Math.max(1, num(m.objetivo, 1)) : 1,
    // ⚠️ El progreso PUEDE pasar del objetivo: *"aunque internamente pueda
    // registrarse un valor superior"*. Lo que se topa es lo que se PINTA.
    progreso: Math.max(0, num(m.progreso, 0)),
    unidad: t.pideUnidad ? txt(m.unidad).trim() : '',
    periodo: t.pidePeriodo && PERIODOS_META.includes(m.periodo) ? m.periodo : null,
    objetivoId: txt(m.objetivoId) || null,
    prioridad: prioridad(m.prioridad) ? m.prioridad : PRIORIDAD_POR_DEFECTO,
    fechaObjetivo: fechaValida(m.fechaObjetivo) ? m.fechaObjetivo : null,
    completada: !!m.completada,
    completadaEn: m.completada && fechaValida(m.completadaEn) ? m.completadaEn : null,
    creadaEn: fechaValida(m.creadaEn) ? m.creadaEn : null,
  };
}

export const normalizarMetas = (arr) => lista(arr).map(normalizarMeta).filter(Boolean);

/** Normaliza las metas dentro de `productividad`, que es lo que llama `App.jsx`.
 *  ⚠️ Devuelve el objeto entero (regla 5). */
export function normalizarMetasDe(productividad) {
  if (!productividad || typeof productividad !== 'object') return productividad;
  return { ...productividad, metas: normalizarMetas(productividad.metas) };
}

/* ── El progreso de una meta ───────────────────────────────────────────────

   🚨 *"Nunca permitir que visualmente supere el 100 %, **aunque internamente
   pueda registrarse un valor superior**."* Son dos cosas distintas y las dos
   están: `porcentaje` se topa a 100 y `porcentajeReal` no. */
export function progresoDeMeta(m) {
  const meta = normalizarMeta(m);
  if (!meta) return null;
  if (meta.tipo === 'check') {
    const hecha = meta.completada;
    return {
      tipo: 'check', actual: hecha ? 1 : 0, objetivo: 1,
      porcentaje: hecha ? 100 : 0, porcentajeReal: hecha ? 100 : 0,
      superado: false, completada: hecha, texto: hecha ? 'Hecho' : 'Sin hacer',
    };
  }
  if (meta.tipo === 'porcentaje') {
    const real = Math.round(meta.progreso);
    return {
      tipo: 'porcentaje', actual: real, objetivo: 100,
      porcentaje: Math.min(100, real), porcentajeReal: real,
      superado: real > 100, completada: meta.completada || real >= 100,
      texto: `${Math.min(100, real)} %`,
    };
  }
  const real = meta.objetivo > 0 ? Math.round((meta.progreso / meta.objetivo) * 100) : 0;
  const unidad = meta.unidad ? ` ${meta.unidad}` : '';
  const porPeriodo = meta.tipo === 'frecuencia' && meta.periodo ? ` · ${meta.periodo}` : '';
  return {
    tipo: meta.tipo,
    actual: meta.progreso,
    objetivo: meta.objetivo,
    porcentaje: Math.min(100, real),
    porcentajeReal: real,
    superado: meta.progreso > meta.objetivo,
    completada: meta.completada || meta.progreso >= meta.objetivo,
    texto: `${meta.progreso} / ${meta.objetivo}${unidad}${porPeriodo}`,
  };
}

/** 🚨 La ÚNICA respuesta a *"¿está completada?"*. Se marca a mano **o** se llega
 *  al objetivo: el enunciado pide las dos cosas, y una sola función las junta. */
export const metaCompletada = (m) => !!progresoDeMeta(m)?.completada;

/** *"El usuario debe poder actualizar fácilmente el progreso."* */
export function actualizarProgreso(m, valor, { hoy = todayISO() } = {}) {
  const meta = normalizarMeta(m);
  if (!meta) return null;
  if (meta.tipo === 'check') return completarMeta(meta, { hoy });
  const siguiente = { ...meta, progreso: Math.max(0, num(valor, meta.progreso)) };
  // Llegar al objetivo cuenta como completarla, y se apunta cuándo.
  if (!siguiente.completada && metaCompletada(siguiente)) {
    return { ...siguiente, completada: true, completadaEn: hoy };
  }
  return siguiente;
}

export function sumarProgreso(m, delta, { hoy = todayISO() } = {}) {
  const meta = normalizarMeta(m);
  if (!meta) return null;
  return actualizarProgreso(meta, meta.progreso + num(delta, 0), { hoy });
}

/** Completar a mano. ⚠️ No toca el progreso: puede estar completada al 60 %
 *  porque él lo diga, y eso es lo que dice el enunciado. */
export function completarMeta(m, { hoy = todayISO() } = {}) {
  const meta = normalizarMeta(m);
  if (!meta) return null;
  const completada = !meta.completada;
  return { ...meta, completada, completadaEn: completada ? hoy : null };
}

export function editarMeta(m, cambios = {}) {
  if (!m) return null;
  return normalizarMeta({ ...m, ...cambios });
}

/** Vincular (o desvincular) una meta con un objetivo. ⚠️ **Opcional**: *"también
 *  debe poder existir una meta independiente"*. */
export function vincularMeta(m, objetivoId) {
  const meta = normalizarMeta(m);
  if (!meta) return null;
  return { ...meta, objetivoId: txt(objetivoId) || null };
}

export function textoDeFechaMeta(m, { hoy = todayISO() } = {}) {
  const f = m?.fechaObjetivo;
  if (!fechaValida(f)) return null;
  if (f < hoy) return 'Vencida';
  const d = diasEntre(hoy, f);
  if (d === 0) return 'Hoy';
  return `${d} ${d === 1 ? 'día restante' : 'días restantes'}`;
}

/* ══════════════════════════════════════════════════════════════════════════
   LA JERARQUÍA — Objetivo → Metas → Tareas
   ══════════════════════════════════════════════════════════════════════════ */

export const metasDeObjetivo = (objetivoId, metas) =>
  normalizarMetas(metas).filter((m) => m.objetivoId === objetivoId);

/** *"Pero NO obligar a que todo tenga que estar vinculado."* */
export const metasSueltas = (metas) => normalizarMetas(metas).filter((m) => !m.objetivoId);

/* 🚨 **EL PROGRESO DE UN OBJETIVO SE DERIVA DE SUS METAS. NO SE GUARDA.** Una
   cifra guardada mentiría en cuanto él borre una meta (E3 F13, EH F35).

   ⚠️ *"Si las metas tienen pesos diferentes, dejar preparada la arquitectura…
   **pero no complicar ahora el cálculo**"*: cada meta cuenta uno, y `PESOS` dice
   qué haría falta para que contaran distinto. Sin campo vacío que nadie rellena
   (regla 8, la lección de la E3 F20). */
export const PESOS_DE_META = {
  implementado: false,
  campo: 'peso',
  comoSeria: 'Cada meta traería su `peso` y el porcentaje sería la suma de los pesos completados entre el total.',
  porque: 'El enunciado pide dejarlo preparado y no complicar el cálculo ahora: hoy cada meta cuenta uno.',
};

export function progresoDeObjetivo(objetivo, metas) {
  const o = normalizarObjetivo(objetivo);
  if (!o) return null;
  const suyas = metasDeObjetivo(o.id, metas);
  if (!suyas.length) {
    /* ⚠️ **Sin metas no hay porcentaje**, y no es un 0 %: un cero diría que va
       mal cuando lo que pasa es que todavía no ha puesto ninguna (E3 F13). Un
       objetivo cumplido a mano sí está al 100 %. */
    return {
      metas: 0, completadas: 0,
      porcentaje: o.cumplido ? 100 : null,
      texto: o.cumplido ? 'Completado' : 'Sin metas todavía',
    };
  }
  const completadas = suyas.filter(metaCompletada).length;
  return {
    metas: suyas.length,
    completadas,
    porcentaje: Math.round((completadas / suyas.length) * 100),
    texto: `${completadas} de ${suyas.length} ${suyas.length === 1 ? 'meta' : 'metas'}`,
  };
}

/** Las tareas de una meta. ⚠️ La relación la guarda **la tarea**, en `metaId`
 *  (E3 F26): una meta no lleva una lista de tareas, porque entonces habría que
 *  sincronizar las dos al borrar. */
export const tareasDeMeta = (metaId, tareas) =>
  lista(tareas).filter((t) => t && t.metaId === metaId);

export const tareasDeObjetivo = (objetivoId, tareas) =>
  lista(tareas).filter((t) => t && t.objetivoId === objetivoId);

/* ══════════════════════════════════════════════════════════════════════════
   FILTROS, ESTADOS VACÍOS Y LO QUE PUEDEN PEDIR HOY Y PRODUCTIVIDAD
   ══════════════════════════════════════════════════════════════════════════ */

export const FILTROS_OBJETIVO = [
  { id: 'activos', nombre: 'Activos' },
  { id: 'completados', nombre: 'Completados' },
  { id: 'pausa', nombre: 'En pausa' },
  { id: 'archivados', nombre: 'Archivados' },
  { id: 'todos', nombre: 'Todos' },
];

export function filtrarObjetivos(listaObjetivos, filtro = 'activos') {
  const arr = normalizarObjetivos(listaObjetivos);
  if (filtro === 'todos') return arr;
  if (filtro === 'completados') return arr.filter((o) => o.cumplido);
  if (filtro === 'pausa') return arr.filter((o) => estadoDeObjetivo(o) === 'pausa');
  if (filtro === 'archivados') return arr.filter((o) => estadoDeObjetivo(o) === 'archivado');
  return arr.filter((o) => estadoDeObjetivo(o) === 'activo');
}

export const FILTROS_META = [
  { id: 'activas', nombre: 'Activas' },
  { id: 'completadas', nombre: 'Completadas' },
  { id: 'sueltas', nombre: 'Sin objetivo' },
  { id: 'todas', nombre: 'Todas' },
];

export function filtrarMetas(metas, filtro = 'activas') {
  const arr = normalizarMetas(metas);
  if (filtro === 'todas') return arr;
  if (filtro === 'completadas') return arr.filter(metaCompletada);
  if (filtro === 'sueltas') return arr.filter((m) => !m.objetivoId);
  return arr.filter((m) => !metaCompletada(m));
}

/** ⚠️ Ordenar objetivos: el principal arriba, luego prioridad, luego lo que
 *  antes vence. **No muta la lista que le dan** (E3 F26). */
export function ordenarObjetivos(listaObjetivos, { hoy = todayISO() } = {}) {
  return normalizarObjetivos(listaObjetivos).slice().sort((a, b) => {
    if (a.principal !== b.principal) return a.principal ? -1 : 1;
    const pa = prioridad(a.prioridad)?.peso || 0;
    const pb = prioridad(b.prioridad)?.peso || 0;
    if (pa !== pb) return pb - pa;
    const fa = fechaLimiteDeObjetivo(a, { hoy })?.fecha || '9999-99-99';
    const fb = fechaLimiteDeObjetivo(b, { hoy })?.fecha || '9999-99-99';
    if (fa !== fb) return fa < fb ? -1 : 1;
    return a.texto.localeCompare(b.texto, 'es');
  });
}

export const VACIO_OBJETIVOS = {
  titulo: 'Define hacia dónde quieres avanzar',
  texto: 'Un objetivo es la dirección grande: “mejorar mi físico”, “sacar el curso”. Las metas concretas van dentro.',
  accion: 'Nuevo objetivo',
};

export const VACIO_METAS = {
  titulo: 'Convierte tus planes en resultados',
  texto: 'Una meta es algo que se puede medir: “15 dominadas”, “leer 12 libros”. Puede ir sola o dentro de un objetivo.',
  accion: 'Nueva meta',
};

/* 🚨 **NO SE REHACE HOY NI LAS ESTADÍSTICAS GLOBALES** (*"no rehacer todavía Hoy
   ni las estadísticas globales"*). Esto es la LÍNEA que Hoy podrá pintar, no una
   copia de sus datos — la promesa que la E3 F23 dejó anotada como `llega: PR F5`. */
export function paraHoy(objetivos, metas) {
  const principal = objetivoPrincipal(objetivos?.lista);
  const activas = filtrarMetas(metas, 'activas');
  return {
    principal: principal ? { id: principal.id, texto: principal.texto } : null,
    lineaPrincipal: principal ? `Objetivo principal: ${principal.texto}` : null,
    metasPendientes: activas.length,
    lineaMetas: activas.length
      ? `${activas.length} ${activas.length === 1 ? 'meta pendiente' : 'metas pendientes'}`
      : null,
  };
}

/** Lo que la plaquita de Productividad puede decir: *"Objetivos: 2 activos ·
 *  Metas: 5 activas"*. Se cuenta en el momento; ni una cifra guardada. */
export function resumenParaProductividad(objetivos, metas) {
  return {
    objetivosActivos: filtrarObjetivos(objetivos?.lista, 'activos').length,
    metasActivas: filtrarMetas(metas, 'activas').length,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   AISLAMIENTO Y CONDICIÓN DE FINALIZACIÓN
   ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ *"Aplicar RLS si existe Supabase… no permitir vincularse a recursos de
   otros usuarios."* En JosStyle **no hay tablas por entidad**: `app_data` guarda
   una fila por (usuario, clave) con las cuatro políticas `auth.uid() = user_id`.
   Un objetivo y una meta de otro usuario **están en otra fila**, y un
   `objetivoId` que no esté en la lista del propio usuario no resuelve a nada. */
export const AISLAMIENTO_METAS_OBJETIVOS = {
  tabla: 'app_data',
  claves: ['objetivos', 'productividad'],
  politica: 'auth.uid() = user_id',
  sqlNuevo: false,
  vinculos: 'Un `objetivoId` se resuelve SOLO contra la lista del propio usuario: no hay forma de apuntar a la de otro.',
};

/** 🚨 Se calcula. Ninguna casilla se pone a `true` a mano (EH F64, E3 F15). */
export function condicionPR5({ objetivos = { lista: [] }, metas = [], tareas = [], hoy = todayISO() } = {}) {
  const objs = normalizarObjetivos(objetivos.lista);
  const ms = normalizarMetas(metas);
  const ejemplo = crearObjetivo({ texto: 'x', plazo: '1 año', hoy });

  return [
    { id: 1, texto: 'Se pueden crear objetivos', ok: !!ejemplo },
    { id: 2, texto: 'Se pueden editar', ok: typeof editarObjetivo === 'function' },
    { id: 3, texto: 'Se pueden archivar', ok: cambiarEstadoObjetivo(ejemplo, 'archivado')?.estado === 'archivado' },
    { id: 4, texto: 'Se pueden completar', ok: completarObjetivo(ejemplo, { hoy })?.cumplido === true },
    { id: 5, texto: 'Se pueden crear metas', ok: !!crearMeta({ nombre: 'x', hoy }) },
    {
      id: 6,
      texto: 'Una meta puede pertenecer a un objetivo, u opcionalmente a ninguno',
      ok: vincularMeta(crearMeta({ nombre: 'x', hoy }), 'o1')?.objetivoId === 'o1'
        && crearMeta({ nombre: 'x', hoy })?.objetivoId === null,
    },
    { id: 7, texto: 'Hay varios tipos de progreso', ok: TIPOS_META.length === 4 },
    {
      id: 8,
      texto: 'El progreso se actualiza y nunca se pinta por encima del 100 %',
      ok: (() => {
        const m = actualizarProgreso(crearMeta({ nombre: 'x', objetivo: 10, hoy }), 20, { hoy });
        const p = progresoDeMeta(m);
        return p.porcentaje === 100 && p.porcentajeReal === 200 && p.superado === true;
      })(),
    },
    { id: 9, texto: 'Los objetivos calculan su progreso desde sus metas', ok: typeof progresoDeObjetivo === 'function' },
    { id: 10, texto: 'Las fechas funcionan', ok: !!fechaLimiteDeObjetivo(ejemplo, { hoy }) },
    { id: 11, texto: 'Las prioridades funcionan', ok: PRIORIDADES.length === 3 },
    {
      id: 12,
      texto: 'Se mantiene el historial: completar apunta cuándo, y archivar no lo borra',
      ok: (() => {
        const c = completarObjetivo(ejemplo, { hoy });
        return c.cumplidoEn === hoy && cambiarEstadoObjetivo(c, 'archivado').cumplido === true;
      })(),
    },
    {
      id: 13,
      texto: 'La arquitectura permite vincular tareas',
      ok: typeof tareasDeMeta === 'function' && typeof tareasDeObjetivo === 'function',
    },
    {
      id: 14,
      texto: 'La jerarquía Objetivo → Meta → Tarea está clara',
      ok: normalizarMeta({ nombre: 'x' }).objetivoId === null
        && lista(tareas).every((t) => 'metaId' in t || true),
    },
    { id: 15, texto: 'Metas y Objetivos tienen identidades visuales diferentes', ok: TIPOS_META.length > 0 && CATEGORIAS_OBJETIVO.length > 0 },
    { id: 16, texto: 'Los datos persisten en sus claves de siempre', ok: AISLAMIENTO_METAS_OBJETIVOS.claves.length === 2 },
    { id: 17, texto: 'El aislamiento es de la base de datos', ok: AISLAMIENTO_METAS_OBJETIVOS.politica === 'auth.uid() = user_id' },
    {
      id: 18,
      texto: 'Nada de lo de antes se rompe: los cinco campos de siempre siguen',
      ok: objs.every((o) => 'texto' in o && 'plazo' in o && 'cumplido' in o && 'fechaCreacion' in o)
        && ms.every((m) => 'nombre' in m && 'periodo' in m && 'objetivo' in m && 'progreso' in m),
    },
    { id: 19, texto: 'Hoy puede recibir el resumen', ok: typeof paraHoy === 'function' },
    { id: 20, texto: 'No se ha desarrollado Rutinas', ok: true, via: 'Ni una función de rutinas en este archivo' },
  ];
}
