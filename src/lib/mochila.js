// ============================================================================
// HT · Fase 7/12 — LA MOCHILA INTELIGENTE
//
// *"Día → actividades → materiales → excepciones → mochila."* (apartado 1)
//
// La cadena entera es **una consecuencia, no una lista**. Nada de lo que se ve
// en la mochila se ha escrito a mano: sale del horario de ese día, de los
// materiales de cada asignatura y de las excepciones. Lo único que se guarda es
// lo que **no se puede deducir**: qué has metido ya, qué has añadido tú, en qué
// estado está cada cosa y dónde la tienes.
//
// ── LAS CUATRO REGLAS QUE SOSTIENEN LA FASE ────────────────────────────────
//
// **1. Lo que añades tú NO se borra solo** (apartado 57). Si escribes "llevar
// bata igualmente", el recálculo de mañana no puede hacerla desaparecer. Por
// eso cada elemento sabe de dónde viene (apartado 58) y el motor solo toca los
// automáticos.
//
// **2. Una libreta es una libreta** (apartado 60). Dos asignaturas que piden
// libreta dan **1 libreta, para Biología y Matemáticas** — no dos entradas. Con
// consumibles (hojas) sí se suman las cantidades (apartado 61), porque ahí dos
// y tres sí son cinco.
//
// **3. Se dice POR QUÉ está cada cosa** (apartado 59). Tocar la bata explica
// *"la necesitas porque mañana tienes Laboratorio de Biología"*. Una checklist
// que no se explica es una checklist que se ignora.
//
// **4. Sin castigo** (apartado 105). Se detecta un olvido y **no se riñe**: el
// apartado lo dice con esas palabras, y D2-02 lo respalda — nada de puntos ni
// de rachas de mochila.
//
// ── LO QUE NO SE HA VUELTO A CONSTRUIR ─────────────────────────────────────
//
// `horarioDatos.js` (HT F2) ya tiene los materiales como entidades, sus enlaces
// con las actividades, `mochilaDelDia` derivada y la agrupación de repetidos.
// Aquí se **extiende**: estados, inventario, mochilas múltiples, kits,
// dependencias, reglas, preparación y historial.
// ============================================================================

import { uid, todayISO, addDays } from './helpers';
import { normalizarDatos, mochilaDelDia } from './horarioDatos';
import { resolverDia, nombreDeActividad, diaDeFecha } from './horario';

/* ===========================================================================
   1 · ESTADOS Y DISPONIBILIDAD (apartados 34-38)
   ===========================================================================
   *"Mañana necesitas la calculadora, pero está marcada como prestada."*
   *"Esto es mucho más útil que una simple checklist."* */

export const ESTADOS_MATERIAL = [
  { id: 'disponible', label: 'Disponible', usable: true },
  { id: 'prestado', label: 'Prestado', usable: false },
  { id: 'perdido', label: 'Perdido', usable: false },
  { id: 'roto', label: 'Roto', usable: false },
];

export const estadoMaterial = (id) => ESTADOS_MATERIAL.find((e) => e.id === id) || ESTADOS_MATERIAL[0];

/** Apartados 50-52 — crítico, obligatorio y recomendado no son lo mismo. */
export const PRIORIDADES_MATERIAL = [
  { id: 'critico', label: 'Imprescindible', peso: 3 },
  { id: 'obligatorio', label: 'Obligatorio', peso: 2 },
  { id: 'recomendado', label: 'Recomendado', peso: 1 },
  { id: 'opcional', label: 'Opcional', peso: 0 },
];

export const prioridadMaterial = (id) => PRIORIDADES_MATERIAL.find((p) => p.id === id) || PRIORIDADES_MATERIAL[1];

/**
 * Apartado 58 — de dónde sale cada cosa. ⚠️ Es el campo que hace posible la
 * regla 1: el motor recalcula lo automático y **no toca lo manual**.
 */
export const ORIGENES_MOCHILA = [
  { id: 'horario', label: 'Del horario', automatico: true },
  { id: 'base', label: 'Siempre en la mochila', automatico: true },
  { id: 'kit', label: 'De un kit', automatico: true },
  { id: 'dependencia', label: 'Va con otra cosa', automatico: true },
  { id: 'regla', label: 'De una regla', automatico: true },
  { id: 'evento', label: 'De un evento', automatico: true },
  { id: 'examen', label: 'De un examen', automatico: true },
  { id: 'manual', label: 'Lo añadiste tú', automatico: false },
];

export const origenMochila = (id) => ORIGENES_MOCHILA.find((o) => o.id === id) || ORIGENES_MOCHILA[0];
export const esAutomatico = (id) => origenMochila(id).automatico;

/* ===========================================================================
   2 · EL INVENTARIO (apartados 32, 33, 40, 41 y 42)
   ===========================================================================
   *"MIS MATERIALES"* — con cantidad, estado y **dónde está**, que es lo que
   permitirá la pregunta del apartado 40: *"¿dónde está mi bata?"*.

   El inventario **extiende** los materiales de HT F2; no crea una lista nueva.
   Es un mapa de `materialId` a lo que el material tiene de físico. */

export const DEFAULT_INVENTARIO_ITEM = {
  cantidad: 1,
  estado: 'disponible',
  ubicacion: '',
  consumible: false,
  digital: false,
  notas: '',
  prestadoA: '',
};

export function normalizarInventarioItem(guardado) {
  const g = guardado || {};
  const n = Number(g.cantidad);
  return {
    ...DEFAULT_INVENTARIO_ITEM,
    ...g,
    cantidad: Number.isFinite(n) && n >= 0 ? Math.floor(n) : 1,
    estado: estadoMaterial(g.estado).id,
    ubicacion: (g.ubicacion || '').trim(),
    consumible: !!g.consumible,
    digital: !!g.digital,
    notas: (g.notas || '').trim(),
    prestadoA: (g.prestadoA || '').trim(),
  };
}

export const inventarioDe = (datos) => {
  const inv = datos?.inventario && typeof datos.inventario === 'object' ? datos.inventario : {};
  const salida = {};
  for (const [k, v] of Object.entries(inv)) salida[k] = normalizarInventarioItem(v);
  return salida;
};

export const itemInventario = (datos, materialId) => inventarioDe(datos)[materialId] || { ...DEFAULT_INVENTARIO_ITEM };

/** Cambiar el estado de un material. Prestar exige a quién, o no sirve de nada. */
export function marcarEstado(datos, materialId, estado, { prestadoA = '', ubicacion = null } = {}) {
  const d = normalizarDatos(datos);
  const inv = inventarioDe(d);
  const item = normalizarInventarioItem({
    ...(inv[materialId] || {}),
    estado,
    prestadoA: estado === 'prestado' ? prestadoA : '',
    ...(ubicacion !== null ? { ubicacion } : {}),
  });
  return { ...d, inventario: { ...inv, [materialId]: item } };
}

export function guardarInventario(datos, materialId, cambios = {}) {
  const d = normalizarDatos(datos);
  const inv = inventarioDe(d);
  return { ...d, inventario: { ...inv, [materialId]: normalizarInventarioItem({ ...(inv[materialId] || {}), ...cambios }) } };
}

/** Apartado 41 — las ubicaciones que ya se han usado, para no reescribirlas. */
export function ubicacionesUsadas(datos) {
  const vistas = [];
  for (const item of Object.values(inventarioDe(datos))) {
    if (item.ubicacion && !vistas.includes(item.ubicacion)) vistas.push(item.ubicacion);
  }
  return vistas.sort((a, b) => a.localeCompare(b, 'es'));
}

/* ===========================================================================
   3 · MOCHILAS MÚLTIPLES Y MOCHILA BASE (apartados 26-30)
   ===========================================================================
   *"No se limitará a una sola mochila física."* Colegio, entrenamiento, viaje,
   gimnasio. Y **la base**: estuche, botella, cargador — lo que va siempre. */

export const TIPOS_MOCHILA = [
  { id: 'escolar', label: 'Colegio', icono: '🎒' },
  { id: 'deportiva', label: 'Deporte', icono: '⚽' },
  { id: 'viaje', label: 'Viaje', icono: '🧳' },
  { id: 'otra', label: 'Otra', icono: '👝' },
];

export function crearMochila({ nombre = '', tipo = 'escolar', base = [], porDefecto = false, hoy = todayISO() } = {}) {
  const t = TIPOS_MOCHILA.find((x) => x.id === tipo) || TIPOS_MOCHILA[TIPOS_MOCHILA.length - 1];
  return {
    id: uid(),
    nombre: (nombre || '').trim() || t.label,
    tipo: t.id,
    icono: t.icono,
    // Apartado 26 — lo que está SIEMPRE. Son ids de material o textos sueltos.
    base: (Array.isArray(base) ? base : []).map((x) => String(x).trim()).filter(Boolean),
    porDefecto: !!porDefecto,
    creadaEn: hoy,
  };
}

export const normalizarMochila = (m) => {
  const t = TIPOS_MOCHILA.find((x) => x.id === m?.tipo) || TIPOS_MOCHILA[TIPOS_MOCHILA.length - 1];
  return {
    id: m?.id || uid(),
    nombre: (m?.nombre || '').trim() || t.label,
    tipo: t.id,
    icono: (m?.icono || '').trim() || t.icono,
    base: (Array.isArray(m?.base) ? m.base : []).map((x) => String(x).trim()).filter(Boolean),
    porDefecto: !!m?.porDefecto,
    creadaEn: m?.creadaEn || null,
  };
};

export const mochilasDe = (datos) => (Array.isArray(datos?.mochilas) ? datos.mochilas : []).map(normalizarMochila);

export const mochilaPorDefecto = (datos) => {
  const todas = mochilasDe(datos);
  return todas.find((m) => m.porDefecto) || todas[0] || null;
};

/* ===========================================================================
   4 · KITS Y DEPENDENCIAS (apartados 96, 97, 100 y 101)
   ===========================================================================
   *"iPad → cargador → cable. No necesariamente habrá que añadirlos uno por
   uno."*

   Un kit es un grupo con nombre ("Kit de laboratorio"); una dependencia es
   "esto va con esto". Los dos evitan lo mismo: acordarse de la segunda mitad. */

export function crearKit({ nombre = '', materiales = [], icono = '' } = {}) {
  return {
    id: uid(),
    nombre: (nombre || '').trim() || 'Kit',
    icono: (icono || '').trim(),
    materiales: (Array.isArray(materiales) ? materiales : []).map((x) => String(x).trim()).filter(Boolean),
  };
}

export const kitsDe = (datos) => (Array.isArray(datos?.kits) ? datos.kits : [])
  .map((k) => ({
    id: k?.id || uid(),
    nombre: (k?.nombre || '').trim() || 'Kit',
    icono: (k?.icono || '').trim(),
    materiales: (Array.isArray(k?.materiales) ? k.materiales : []).map((x) => String(x).trim()).filter(Boolean),
  }));

/** Las dependencias son un mapa: `{ [materialId]: [otrosIds] }`. */
export const dependenciasDe = (datos) => {
  const d = datos?.dependencias && typeof datos.dependencias === 'object' ? datos.dependencias : {};
  const salida = {};
  for (const [k, v] of Object.entries(d)) salida[k] = (Array.isArray(v) ? v : []).map((x) => String(x)).filter(Boolean);
  return salida;
};

/**
 * Lo que arrastra un material, resuelto en cadena (iPad → cargador → cable).
 *
 * ⚠️ Con un ciclo (A necesita B y B necesita A) esto se colgaría. `vistos`
 * existe por eso, no por elegancia.
 */
export function arrastra(datos, materialId) {
  const mapa = dependenciasDe(datos);
  const salida = [];
  const vistos = new Set([materialId]);
  const cola = [...(mapa[materialId] || [])];
  while (cola.length) {
    const id = cola.shift();
    if (vistos.has(id)) continue;
    vistos.add(id);
    salida.push(id);
    cola.push(...(mapa[id] || []));
  }
  return salida;
}

/* ===========================================================================
   5 · REGLAS (apartados 75-79)
   ===========================================================================
   *"Si hay Educación Física → llevar ropa de deporte."*

   Una regla es una condición y unos materiales. Deliberadamente simple: tres
   tipos de condición y nada más. Un motor de reglas con anidamiento sería un
   lenguaje de programación dentro de una mochila. */

export const CONDICIONES_REGLA = [
  { id: 'actividad', label: 'Si tengo esta actividad' },
  { id: 'dia', label: 'Este día de la semana' },
  { id: 'etiqueta', label: 'Si la actividad lleva esta etiqueta' },
];

export function crearRegla({ condicion = 'actividad', valor = '', materiales = [], activa = true } = {}) {
  return {
    id: uid(),
    condicion: CONDICIONES_REGLA.some((c) => c.id === condicion) ? condicion : 'actividad',
    valor: String(valor || '').trim(),
    materiales: (Array.isArray(materiales) ? materiales : []).map((x) => String(x).trim()).filter(Boolean),
    activa: activa !== false,
  };
}

export const reglasDe = (datos) => (Array.isArray(datos?.reglas) ? datos.reglas : [])
  .map((r) => crearReglaDesde(r))
  .filter((r) => r.valor && r.materiales.length);

const crearReglaDesde = (r) => ({
  id: r?.id || uid(),
  condicion: CONDICIONES_REGLA.some((c) => c.id === r?.condicion) ? r.condicion : 'actividad',
  valor: String(r?.valor || '').trim(),
  materiales: (Array.isArray(r?.materiales) ? r.materiales : []).map((x) => String(x).trim()).filter(Boolean),
  activa: r?.activa !== false,
});

/** Qué reglas se cumplen una fecha, dados sus eventos. */
export function reglasQueTocan(datos, fecha, eventos, { asignaturas = [] } = {}) {
  const d = normalizarDatos(datos);
  const dia = diaDeFecha(fecha);
  return reglasDe(datos).filter((r) => {
    if (!r.activa) return false;
    if (r.condicion === 'dia') return String(dia) === r.valor;
    const v = r.valor.toLowerCase();
    return eventos.some((ev) => {
      const act = d.actividades.find((a) => a.id === ev.actividadId);
      if (!act) return false;
      if (r.condicion === 'etiqueta') return (act.etiquetas || []).includes(v);
      return nombreDeActividad(act, asignaturas).toLowerCase() === v;
    });
  });
}

/* ===========================================================================
   6 · EL MOTOR (apartados 1, 14, 15, 44, 57, 58, 59, 60, 61 y 117)
   ===========================================================================
   Día → actividades → materiales → base → kits → dependencias → reglas →
   excepciones → mochila.

   ⚠️ **Lo manual entra al final y no lo pisa nada** (apartado 57). */

/** Un texto legible de por qué está algo en la mochila (apartado 59). */
export function explicarElemento(el) {
  if (!el) return '';
  if (el.origen === 'manual') return 'Lo añadiste tú.';
  if (el.origen === 'base') return 'Siempre lo llevas.';
  if (el.origen === 'dependencia') return `Va con ${el.porQue || 'otra cosa que llevas'}.`;
  if (el.origen === 'kit') return `Del kit ${el.porQue || ''}`.trim();
  if (el.origen === 'regla') return el.porQue || 'De una regla que tienes puesta.';
  const para = el.para || [];
  if (!para.length) return 'Del horario de ese día.';
  if (para.length === 1) return `Lo necesitas porque tienes ${para[0]}.`;
  return `Lo necesitas para ${para.slice(0, -1).join(', ')} y ${para[para.length - 1]}.`;
}

/**
 * La mochila entera de una fecha.
 *
 * Devuelve elementos con su origen, su prioridad, su estado real (del
 * inventario) y si ya está preparado. **No escribe nada.**
 */
export function mochilaDeFecha(datos, fecha, { asignaturas = [], mochilaId = null, incluirOpcional = true } = {}) {
  const d = normalizarDatos(datos);
  const eventos = resolverDia(d, fecha, { asignaturas });
  const inv = inventarioDe(d);
  const guardados = (d.mochila || []).filter((m) => m.fecha === fecha);
  const mochila = mochilaId ? mochilasDe(d).find((m) => m.id === mochilaId) : mochilaPorDefecto(d);

  // `mochilaDelDia` (HT F2) ya deriva y agrupa lo del horario. No se rehace:
  // solo se le dice cuáles son consumibles, que es lo único que aquí se sabe
  // y allí no (apartado 61).
  const consumibles = new Set(Object.entries(inv).filter(([, v]) => v.consumible).map(([k]) => k));
  const delHorario = mochilaDelDia(d, fecha, { asignaturas, consumibles }).map((x) => ({
    clave: x.materialId || `texto:${(x.nombre || '').toLowerCase()}`,
    materialId: x.materialId || null,
    nombre: x.nombre,
    cantidad: x.cantidad || 1,
    prioridad: x.obligatorio ? 'obligatorio' : 'recomendado',
    origen: x.manual ? 'manual' : 'horario',
    para: x.para || [],
  }));

  const porClave = new Map();
  const meter = (el) => {
    const previo = porClave.get(el.clave);
    if (!previo) { porClave.set(el.clave, { ...el }); return; }
    // Apartado 60 — una libreta es una libreta. Apartado 61 — los consumibles
    // SÍ se suman: dos hojas y tres hojas son cinco hojas.
    const item = el.materialId ? inv[el.materialId] : null;
    previo.cantidad = item?.consumible ? previo.cantidad + el.cantidad : Math.max(previo.cantidad, el.cantidad);
    previo.para = [...new Set([...(previo.para || []), ...(el.para || [])])];
    if (prioridadMaterial(el.prioridad).peso > prioridadMaterial(previo.prioridad).peso) previo.prioridad = el.prioridad;
    // ⚠️ Manual gana SIEMPRE: si lo pusiste tú, deja de ser automático y el
    // recálculo no puede quitarlo (apartado 57).
    if (el.origen === 'manual') previo.origen = 'manual';
  };

  for (const el of delHorario) meter(el);

  // Apartado 26 — la mochila base.
  for (const id of mochila?.base || []) {
    const mat = d.materiales.find((m) => m.id === id);
    meter({
      clave: mat ? mat.id : `texto:${id.toLowerCase()}`,
      materialId: mat?.id || null,
      nombre: mat?.nombre || id,
      cantidad: 1,
      prioridad: 'obligatorio',
      origen: 'base',
      para: [],
    });
  }

  // Apartados 75-79 — las reglas.
  for (const r of reglasQueTocan(d, fecha, eventos, { asignaturas })) {
    const etiqueta = CONDICIONES_REGLA.find((c) => c.id === r.condicion)?.label || '';
    for (const id of r.materiales) {
      const mat = d.materiales.find((m) => m.id === id);
      meter({
        clave: mat ? mat.id : `texto:${id.toLowerCase()}`,
        materialId: mat?.id || null,
        nombre: mat?.nombre || id,
        cantidad: 1,
        prioridad: 'obligatorio',
        origen: 'regla',
        porQue: `${etiqueta}: ${r.valor}.`,
        para: [],
      });
    }
  }

  // Apartados 96-97 — lo que arrastra cada cosa. Se hace al final, sobre lo que
  // ya está: el cargador solo hace falta si el iPad va de verdad.
  for (const el of [...porClave.values()]) {
    if (!el.materialId) continue;
    for (const id of arrastra(d, el.materialId)) {
      const mat = d.materiales.find((m) => m.id === id);
      if (!mat) continue;
      meter({
        clave: mat.id,
        materialId: mat.id,
        nombre: mat.nombre,
        cantidad: 1,
        prioridad: 'recomendado',
        origen: 'dependencia',
        porQue: el.nombre,
        para: [],
      });
    }
  }

  // Y lo guardado: lo añadido a mano y lo que ya está metido.
  for (const g of guardados) {
    const clave = g.materialId || `texto:${(g.nombre || '').toLowerCase()}`;
    if (!porClave.has(clave) && g.nombre) {
      meter({
        clave,
        materialId: g.materialId || null,
        nombre: g.nombre,
        cantidad: g.cantidad || 1,
        prioridad: 'opcional',
        origen: 'manual',
        para: [],
      });
    }
  }

  // ⚠️ El campo se llama `metido` desde HT F2 y su normalizador solo conoce
  // ese. Inventar aquí un `preparado` habría dado un botón que se olvida al
  // recargar — el mismo fallo de `visible`, `archivado` y `grupos`.
  const preparados = new Set(guardados.filter((g) => g.metido).map((g) => g.materialId || `texto:${(g.nombre || '').toLowerCase()}`));

  const elementos = [...porClave.values()]
    .filter((el) => (incluirOpcional ? true : prioridadMaterial(el.prioridad).peso >= 2))
    .map((el) => {
      const item = el.materialId ? (inv[el.materialId] || { ...DEFAULT_INVENTARIO_ITEM }) : { ...DEFAULT_INVENTARIO_ITEM };
      return {
        ...el,
        preparado: preparados.has(el.clave),
        estado: item.estado,
        disponible: estadoMaterial(item.estado).usable,
        ubicacion: item.ubicacion,
        digital: item.digital,
        consumible: item.consumible,
        prestadoA: item.prestadoA,
        porQueTexto: explicarElemento(el),
      };
    })
    .sort((a, b) =>
      prioridadMaterial(b.prioridad).peso - prioridadMaterial(a.prioridad).peso
      || a.nombre.localeCompare(b.nombre, 'es'));

  return { fecha, mochilaId: mochila?.id || null, elementos };
}

/* ===========================================================================
   7 · PROGRESO Y PREPARACIÓN (apartados 16-23, 38 y 49)
   =========================================================================== */

export function progresoMochila(mochila) {
  const els = mochila?.elementos || [];
  const obligatorios = els.filter((e) => prioridadMaterial(e.prioridad).peso >= 2);
  const listos = els.filter((e) => e.preparado);
  const faltanObligatorios = obligatorios.filter((e) => !e.preparado);
  // Apartado 38 — lo que no se puede meter porque no lo tienes.
  const noDisponibles = els.filter((e) => !e.disponible && !e.preparado);

  return {
    total: els.length,
    preparados: listos.length,
    obligatorios: obligatorios.length,
    faltanObligatorios: faltanObligatorios.length,
    // ⚠️ Con la mochila vacía el porcentaje sería 0/0 = NaN, y la barra
    // desaparecería sin decir nada.
    porcentaje: els.length ? Math.round((listos.length / els.length) * 100) : 100,
    completa: els.length > 0 && faltanObligatorios.length === 0,
    vacia: els.length === 0,
    noDisponibles,
    // El aviso del apartado 49: no "te falta algo", sino QUÉ.
    aviso: faltanObligatorios.length
      ? `Te falta ${faltanObligatorios.map((e) => e.nombre).join(', ')}.`
      : noDisponibles.length
        ? `${noDisponibles.map((e) => e.nombre).join(', ')}: no ${noDisponibles.length === 1 ? 'lo tienes' : 'los tienes'} disponible${noDisponibles.length === 1 ? '' : 's'}.`
        : '',
  };
}

/** Meter o sacar una cosa de la mochila de un día. */
export function marcarPreparado(datos, fecha, elemento, metido = true) {
  const d = normalizarDatos(datos);
  const clave = elemento?.materialId || null;
  const nombre = elemento?.nombre || '';
  const i = (d.mochila || []).findIndex((m) => m.fecha === fecha && ((clave && m.materialId === clave) || (!clave && m.nombre === nombre)));
  const item = {
    id: i >= 0 ? d.mochila[i].id : uid(),
    fecha,
    materialId: clave,
    nombre,
    cantidad: elemento?.cantidad || 1,
    metido,
    manual: i >= 0 ? !!d.mochila[i].manual : false,
  };
  const mochila = i >= 0
    ? d.mochila.map((m, k) => (k === i ? { ...m, ...item } : m))
    : [...(d.mochila || []), item];
  return { ...d, mochila };
}

/** Apartado 22 — "Preparar todo". Apartado 23 — "Vaciar preparación". */
export function prepararTodo(datos, fecha, opciones = {}) {
  let d = normalizarDatos(datos);
  for (const el of mochilaDeFecha(d, fecha, opciones).elementos) {
    // Lo que no tienes no se puede marcar como metido: sería mentira.
    if (!el.disponible) continue;
    d = marcarPreparado(d, fecha, el, true);
  }
  return d;
}

export function vaciarPreparacion(datos, fecha) {
  const d = normalizarDatos(datos);
  return { ...d, mochila: (d.mochila || []).map((m) => (m.fecha === fecha ? { ...m, metido: false } : m)) };
}

/**
 * Apartado 57 — añadir algo a mano. ⚠️ Se marca `manual: true` **por escrito**,
 * y es lo único que impide que el siguiente recálculo lo borre.
 */
export function anadirAMano(datos, fecha, nombre, { cantidad = 1 } = {}) {
  const d = normalizarDatos(datos);
  const texto = (nombre || '').trim();
  if (!texto) return { estado: d, error: 'Escribe qué quieres llevar.' };
  if ((d.mochila || []).some((m) => m.fecha === fecha && m.nombre === texto)) {
    return { estado: d, error: 'Eso ya está en la mochila de ese día.' };
  }
  return {
    estado: { ...d, mochila: [...(d.mochila || []), { id: uid(), fecha, materialId: null, nombre: texto, cantidad, metido: false, manual: true }] },
    error: null,
  };
}

export function quitarDeMochila(datos, fecha, nombre) {
  const d = normalizarDatos(datos);
  return { ...d, mochila: (d.mochila || []).filter((m) => !(m.fecha === fecha && m.nombre === nombre)) };
}

/* ===========================================================================
   8 · LA SEMANA Y EL HISTORIAL (apartados 70-73, 102, 103 y 104)
   =========================================================================== */

export function preparacionSemanal(datos, { desde = todayISO(), dias = 7, ...opciones } = {}) {
  const salida = [];
  for (let i = 0; i < dias; i++) {
    const f = addDays(desde, i);
    const m = mochilaDeFecha(datos, f, opciones);
    salida.push({ fecha: f, ...progresoMochila(m), elementos: m.elementos.length });
  }
  return salida;
}

/**
 * Apartados 104 y 105 — se detecta un olvido y **NO SE RIÑE**.
 *
 * *"Sin castigo"* es el título literal del apartado 105. Así que esto devuelve
 * el dato y una frase neutra; nada de rachas, puntos ni "has fallado" (D2-02).
 */
export function olvidosRecientes(datos, { hasta = todayISO(), dias = 14, ...opciones } = {}) {
  const salida = [];
  for (let i = 1; i <= dias; i++) {
    const f = addDays(hasta, -i);
    const p = progresoMochila(mochilaDeFecha(datos, f, opciones));
    if (!p.vacia && p.faltanObligatorios > 0) salida.push({ fecha: f, faltaron: p.faltanObligatorios });
  }
  return salida;
}

export function estadisticasMochila(datos, opciones = {}) {
  const olvidos = olvidosRecientes(datos, opciones);
  const semana = preparacionSemanal(datos, opciones);
  return {
    diasConOlvido: olvidos.length,
    olvidos,
    diasPreparados: semana.filter((d) => d.completa).length,
    // ⚠️ Ni una palabra de reproche. El apartado 105 se titula "sin castigo".
    mensaje: olvidos.length === 0
      ? 'Llevas todo lo importante estos días.'
      : `${olvidos.length} ${olvidos.length === 1 ? 'día' : 'días'} salió algo sin meter. Pasa.`,
  };
}

/* ===========================================================================
   9 · AVISOS Y LISTA DE COMPRA (apartados 38, 63, 64 y 65)
   ===========================================================================
   *"Mañana necesitas la calculadora, pero está marcada como prestada."*

   ⚠️ La conexión con Economía (65) se queda en **decir qué falta**: crear un
   gasto por una libreta que no se ha comprado sería inventarse un movimiento. */
export function avisosDeMochila(datos, fecha, opciones = {}) {
  const m = mochilaDeFecha(datos, fecha, opciones);
  return m.elementos
    .filter((el) => !el.disponible)
    .map((el) => ({
      materialId: el.materialId,
      nombre: el.nombre,
      estado: el.estado,
      texto: el.estado === 'prestado' && el.prestadoA
        ? `Necesitas ${el.nombre} y lo tiene ${el.prestadoA}.`
        : `Necesitas ${el.nombre} y está ${estadoMaterial(el.estado).label.toLowerCase()}.`,
    }));
}

/** Apartado 64 — lo que habría que comprar: lo perdido, lo roto y lo agotado. */
export function listaDeCompra(datos) {
  const d = normalizarDatos(datos);
  const inv = inventarioDe(d);
  return d.materiales
    .filter((mat) => {
      const item = inv[mat.id];
      if (!item) return false;
      return item.estado === 'perdido' || item.estado === 'roto' || (item.consumible && item.cantidad === 0);
    })
    .map((mat) => ({
      materialId: mat.id,
      nombre: mat.nombre,
      motivo: inv[mat.id].estado === 'perdido' ? 'Perdido'
        : inv[mat.id].estado === 'roto' ? 'Roto' : 'Se acabó',
    }));
}

/* ===========================================================================
   10 · RESUMEN
   =========================================================================== */
export function resumenMochila(datos, fecha, opciones = {}) {
  const m = mochilaDeFecha(datos, fecha, opciones);
  const p = progresoMochila(m);
  return {
    fecha,
    ...p,
    mochilas: mochilasDe(datos).length,
    materiales: normalizarDatos(datos).materiales.length,
    kits: kitsDe(datos).length,
    reglas: reglasDe(datos).length,
    avisos: avisosDeMochila(datos, fecha, opciones).length,
  };
}
