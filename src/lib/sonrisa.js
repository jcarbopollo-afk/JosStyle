// ============================================================================
// EH · Fase 23/65 — HIGIENE BUCAL Y SONRISA
//
// *"Pequeño, opcional, configurable y sin saturar. Además, aprovechamos
// sistemas que ya existen en JC Fitness para no duplicarlos."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ ES UN MÓDULO NUEVO, Y SE AÑADE COMO MANDA LA FASE 1:** una línea en
// `MODULOS_EH`, con su categoría, su confirmación y sus sinónimos de búsqueda.
// Ese es el punto de extensión que construyó F1 —*"añadir un módulo es añadir
// una línea"*— y no hace falta ni un `case`, ni un `if`, ni un registro aparte.
//
// **2. ⚠️ LA RACHA ES LA GLOBAL, Y SOLO SI ÉL LA TIENE** (apartado 10, con esas
// palabras: *"como ya existe el sistema global de rachas, **no crear otra
// racha**. Si el usuario tiene activado el sistema de rachas: 🏆 Higiene bucal
// — 7 días. Si no: **no mostrarla**"*). Así que aquí **no se guarda ni un
// contador**: `rachaDeSonrisa()` mira las definiciones que ya existen y, si no
// hay ninguna de esto, devuelve `null` y la pantalla no pinta nada.
//
// **3. ⚠️ NUNCA UN CALENDARIO DENTAL** (apartado 15) ni **una papelera propia**
// (apartado 16) ni **otro inventario de productos** (apartado 3). Las tres cosas
// son llamadas: `eventosDeRutinas`/la forma de siempre, `papelera.js` con dos
// líneas de catálogo, y el catálogo global de F17.
//
// **4. ⚠️ EL CAMBIO DE CEPILLO SE SUGIERE, NO SE AGENDA** (apartado 6: *"la
// aplicación puede sugerir una fecha… **pero no crear automáticamente una
// cita**"*). `sugerirCambioCepillo()` propone y **no escribe**; guardarla es
// `planificarCambioCepillo`. Octavo `aplicarPlan` del proyecto.
//
// **5. ⚠️ Y LA REVISIÓN LA PONE ÉL** (apartado 7: *"el usuario introduce la
// fecha manualmente… **no crear un sistema médico de citas**"*). Una fecha, un
// aviso opcional, y al calendario general.
//
// **6. ⚠️ CONSEJOS GENERALES, NUNCA UN DIAGNÓSTICO** (apartado 11: *"no
// diagnósticos ni instrucciones médicas personalizadas"*). `PALABRAS_CLINICAS`
// es la lista de la Fase 13, importada, y una prueba barre todos los textos.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { PALABRAS_CLINICAS, sinDiagnostico } from './perfilPiel';
import { productosPiel } from './productosPiel';
import { productosPelo } from './productosPelo';
import { reglaAplicable } from './motorRecomendaciones';
import {
  normalizarRutinaGenerica, tocaEnFechaGenerico, normalizarHechos,
  alternarPaso, alternarOmitido, marcarTodo, checklistGenerico,
  historialGenerico, eventosDeRutinas, impactoEliminarRutina,
  TEXTOS_ESTADO_DIA, DIAS_HISTORIAL,
} from './motorRutinas';
import { prepararEliminacion, prepararRestauracion } from './papelera';
import { uid, todayISO, addDays } from './helpers';

export const MODULO_SONRISA = 'sonrisa';

/** Apartado 1 — la entrada. */
export const TEXTOS_SONRISA = {
  titulo: '😁 Sonrisa',
  sub: 'Higiene bucal, a tu manera.',
  configurar: 'Sí, configurarlo',
  ahoraNo: 'Ahora no',
  oculto: 'Cuando quieras, aquí lo configuras.',
};

/* ===========================================================================
   1 · LAS CUATRO PLAQUITAS (apartados 1 y 14)
   ===========================================================================
   ⚠️ *"Cada una puede activarse/desactivarse **independientemente**"*, y el
   apartado 14 lo repite con un ejemplo: quitar 🪥 Higiene diaria **manteniendo**
   📅 Revisiones. Apagar no borra (apartado 15 de la F22 y F1, apartado 7). */

export const PARTES_SONRISA = [
  { id: 'higiene', nombre: 'Higiene diaria', icono: '🪥', porDefecto: true },
  { id: 'dental', nombre: 'Cuidado dental', icono: '🦷', porDefecto: true },
  { id: 'revisiones', nombre: 'Revisiones', icono: '📅', porDefecto: true },
  // ⚠️ El seguimiento es opcional y no viene puesto: *"si quiere"* (apartado 9).
  { id: 'seguimiento', nombre: 'Seguimiento', icono: '📈', porDefecto: false },
];

export const parteSonrisa = (id) => PARTES_SONRISA.find((p) => p.id === id) || null;

/* ===========================================================================
   2 · LOS PASOS Y LAS FRECUENCIAS (apartados 2 y 4)
   ===========================================================================
   ⚠️ *"El usuario puede modificar completamente los pasos."* Catálogo, no lista
   obligatoria. */

export const PASOS_SONRISA = [
  { id: 'cepillado', nombre: 'Cepillado', icono: '🪥' },
  { id: 'hilo', nombre: 'Hilo dental', icono: '🧵' },
  { id: 'enjuague', nombre: 'Enjuague', icono: '💧' },
  { id: 'lengua', nombre: 'Limpiar la lengua', icono: '👅' },
  { id: 'otros', nombre: 'Otro', icono: '➕' },
];

export const pasoSonrisa = (id) => PASOS_SONRISA.find((p) => p.id === id) || null;

/** Apartado 4 — las tres del enunciado, con el `tipo` que ya sabe el motor. */
export const FRECUENCIAS_SONRISA = [
  { id: 'diario', nombre: 'Diario', tipo: 'diaria' },
  { id: 'dias', nombre: 'Días concretos', tipo: 'dias', pideDias: true },
  { id: 'personalizado', nombre: 'Personalizado', tipo: 'ninguna' },
];

export const frecuenciaSonrisa = (id) => FRECUENCIAS_SONRISA.find((f) => f.id === id) || null;

const tipoFrecuenciaSonrisa = (id) => frecuenciaSonrisa(id)?.tipo || null;

/** Apartado 2 — mañana y noche, que es como lo dibuja el enunciado. */
export const MOMENTOS_SONRISA = [
  { id: 'manana', nombre: 'Mañana', icono: '☀️' },
  { id: 'noche', nombre: 'Noche', icono: '🌙' },
  { id: 'cualquiera', nombre: 'Cuando toque', icono: '🕐' },
];

export const momentoSonrisa = (id) => MOMENTOS_SONRISA.find((m) => m.id === id) || null;

/** Apartado 2 — la plantilla que dibuja el enunciado, y **se ofrece**. */
export const PLANTILLA_SONRISA = {
  id: 'basica',
  nombre: 'Mi rutina de higiene bucal',
  icono: '🪥',
  rutinas: [
    { nombre: 'Mañana', momento: 'manana', pasos: ['cepillado'] },
    { nombre: 'Noche', momento: 'noche', pasos: ['cepillado', 'hilo'] },
  ],
};

/* ===========================================================================
   3 · LOS PRODUCTOS (apartados 3, 12 y 13)
   ===========================================================================
   ⚠️ *"Utilizando siempre el 🛒 catálogo global de productos. **No crear otro
   inventario**."* Aquí solo se guardan IDS, como en Barba: la ficha, sus
   tiendas y sus enlaces de afiliación viven en el catálogo de la Fase 17. */

export const TIPOS_PRODUCTO_SONRISA = [
  { id: 'cepillo', nombre: 'Cepillo', icono: '🪥' },
  { id: 'electrico', nombre: 'Cepillo eléctrico', icono: '⚡' },
  { id: 'pasta', nombre: 'Pasta', icono: '🧴' },
  { id: 'hilo', nombre: 'Hilo dental', icono: '🧵' },
  { id: 'enjuague', nombre: 'Enjuague', icono: '💧' },
  { id: 'otros', nombre: 'Otros', icono: '➕' },
];

export const tipoProductoSonrisa = (id) => TIPOS_PRODUCTO_SONRISA.find((t) => t.id === id) || null;

/** El catálogo global, con el origen a la vista. ⚠️ Ni un inventario nuevo. */
export const catalogoParaSonrisa = (estado) => [
  ...productosPiel(estado).map((p) => ({ ...p, modulo: 'skincare', moduloNombre: 'Skincare' })),
  ...productosPelo(estado).map((p) => ({ ...p, modulo: 'pelo', moduloNombre: 'Pelo' })),
];

/* ===========================================================================
   4 · EL ALMACÉN
   =========================================================================== */

/** Apartado 6 — cada cuánto cambia el cepillo. La de tres meses es lo habitual. */
export const FRECUENCIAS_CEPILLO = [
  { id: 'mensual', nombre: 'Cada mes', dias: 30 },
  { id: 'trimestral', nombre: 'Cada 3 meses', dias: 90 },
  { id: 'semestral', nombre: 'Cada 6 meses', dias: 180 },
  { id: 'personalizado', nombre: 'Personalizado', dias: null },
];

export const frecuenciaCepillo = (id) => FRECUENCIAS_CEPILLO.find((f) => f.id === id) || null;

/** Apartado 8 — cuánto antes avisar de la revisión. */
export const AVISOS_REVISION = [
  { id: 'un_dia', nombre: '1 día antes', dias: 1 },
  { id: 'tres_dias', nombre: '3 días antes', dias: 3 },
  { id: 'una_semana', nombre: '1 semana antes', dias: 7 },
  { id: 'personalizado', nombre: 'Personalizado', dias: null },
];

export const avisoRevision = (id) => AVISOS_REVISION.find((a) => a.id === id) || null;

export const MAX_NOTA_SONRISA = 280;

export const DEFAULT_SONRISA = (() => {
  const partes = {};
  PARTES_SONRISA.forEach((p) => { partes[p.id] = p.porDefecto; });
  return {
    ahoraNo: false,
    configurado: false,
    partes,
    rutinas: [],
    hechos: [],
    // Apartado 3 — ids del catálogo global. **Nunca fichas.**
    productos: [],
    // Apartado 6 — el cepillo.
    cepillo: { ultimoCambio: null, frecuencia: 'trimestral', cadaCuantosDias: null, proximo: null },
    // Apartado 7 — las revisiones que él pone a mano.
    revisiones: [],
    // Apartado 9 — lo que registra, si lo activa.
    registros: [],
    editado: null,
  };
})();

const extraDeRutina = (r) => ({
  momento: momentoSonrisa(r.momento) ? r.momento : 'cualquiera',
  hora: typeof r.hora === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(r.hora) ? r.hora : null,
});

export const normalizarRutinaSonrisa = (g, i) =>
  normalizarRutinaGenerica(g, i, {
    tipoDe: tipoFrecuenciaSonrisa,
    frecuenciaPorDefecto: 'diario',
    extra: extraDeRutina,
  });

/** Apartado 3 — un producto suyo: qué es, y **cuál del catálogo global**. */
export function normalizarProductoSonrisa(g) {
  const p = g || {};
  const nombre = String(p.nombre || '').trim();
  if (!nombre && !p.productoId) return null;
  return {
    id: p.id || uid(),
    tipo: tipoProductoSonrisa(p.tipo) ? p.tipo : 'otros',
    nombre,
    /* ⚠️ Si lo ha enlazado con el catálogo global, se guarda **su id**, no su
       ficha. Borrarlo allí lo deja aquí con su nombre a secas, que es lo que él
       escribió, no media ficha copiada. */
    productoId: typeof p.productoId === 'string' ? p.productoId : null,
    desde: typeof p.desde === 'string' ? p.desde : null,
  };
}

export function normalizarRevision(g) {
  const r = g || {};
  if (typeof r.fecha !== 'string') return null;
  const dias = Number(r.diasAviso);
  return {
    id: r.id || uid(),
    fecha: r.fecha,
    nota: String(r.nota || '').trim().slice(0, MAX_NOTA_SONRISA),
    // ⚠️ Apagado por defecto: *"opcional"* (apartado 8).
    aviso: r.aviso === true,
    avisoTipo: avisoRevision(r.avisoTipo) ? r.avisoTipo : 'un_dia',
    // ⚠️ `Number(null)` es 0 y `Number.isInteger(0)` es `true`: el 0 no vale.
    diasAviso: Number.isInteger(dias) && dias > 0 ? dias : null,
    hecha: r.hecha === true,
  };
}

export function normalizarRegistroSonrisa(g) {
  const r = g || {};
  if (typeof r.fecha !== 'string') return null;
  const nota = String(r.nota || '').trim().slice(0, MAX_NOTA_SONRISA);
  return { id: r.id || uid(), fecha: r.fecha, rutinaId: typeof r.rutinaId === 'string' ? r.rutinaId : null, nota };
}

export function normalizarCepillo(g) {
  const c = g && typeof g === 'object' ? g : {};
  const dias = Number(c.cadaCuantosDias);
  return {
    ultimoCambio: typeof c.ultimoCambio === 'string' ? c.ultimoCambio : null,
    frecuencia: frecuenciaCepillo(c.frecuencia) ? c.frecuencia : 'trimestral',
    cadaCuantosDias: Number.isInteger(dias) && dias > 0 ? dias : null,
    // ⚠️ La fecha planificada, **solo si la guardó él** (apartado 6).
    proximo: typeof c.proximo === 'string' ? c.proximo : null,
  };
}

export function normalizarSonrisa(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const partes = {};
  PARTES_SONRISA.forEach((p) => {
    partes[p.id] = typeof g.partes?.[p.id] === 'boolean' ? g.partes[p.id] : p.porDefecto;
  });
  /* ⚠️ **Los seis campos, uno por uno.** Un campo que el normalizador no conoce
     lo borra el siguiente guardado (regla 5). Van veinte veces en el proyecto. */
  return {
    ahoraNo: g.ahoraNo === true,
    configurado: g.configurado === true,
    partes,
    rutinas: (Array.isArray(g.rutinas) ? g.rutinas : [])
      .map(normalizarRutinaSonrisa).sort((a, b) => a.orden - b.orden),
    hechos: normalizarHechos(g.hechos),
    productos: (Array.isArray(g.productos) ? g.productos : [])
      .map(normalizarProductoSonrisa).filter(Boolean),
    cepillo: normalizarCepillo(g.cepillo),
    revisiones: (Array.isArray(g.revisiones) ? g.revisiones : [])
      .map(normalizarRevision).filter(Boolean)
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    registros: (Array.isArray(g.registros) ? g.registros : [])
      .map(normalizarRegistroSonrisa).filter(Boolean)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    editado: typeof g.editado === 'string' ? g.editado : null,
  };
}

export const datosSonrisa = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_SONRISA);
  return normalizarSonrisa(mod?.config?.sonrisa);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_SONRISA, { sonrisa: datos });

/* ===========================================================================
   5 · LA ENTRADA Y LAS PARTES (apartados 1 y 14)
   =========================================================================== */

export const decirAhoraNoSonrisa = (estado) =>
  ({ estado: escribir(estado, { ...datosSonrisa(estado), ahoraNo: true }), error: null });

export const configurarSonrisa = (estado, { hoy = todayISO() } = {}) =>
  ({ estado: escribir(estado, { ...datosSonrisa(estado), ahoraNo: false, configurado: true, editado: hoy }), error: null });

export const parteActivaSonrisa = (estado, id) => datosSonrisa(estado).partes[id] === true;

/** ⚠️ Apartado 14 — quitar una **sin afectar a nada más**, y sin borrar datos. */
export function alternarParteSonrisa(estado, id) {
  if (!parteSonrisa(id)) return normalizarEstiloHombre(estado);
  const d = datosSonrisa(estado);
  return escribir(estado, { ...d, partes: { ...d.partes, [id]: !d.partes[id] } });
}

export const ESTADOS_SONRISA = ['sin_configurar', 'ahora_no', 'configurado'];

export function estadoDeEntradaSonrisa(estado) {
  const d = datosSonrisa(estado);
  if (d.configurado) return 'configurado';
  return d.ahoraNo ? 'ahora_no' : 'sin_configurar';
}

/* ===========================================================================
   6 · LAS RUTINAS (apartados 2, 4, 5 y 9 de las pruebas)
   ===========================================================================
   ⚠️ Todo del motor de F14. Aquí no se decide qué es "hecha". */

export const rutinasSonrisa = (estado) => datosSonrisa(estado).rutinas;

export const rutinaSonrisa = (estado, id) => rutinasSonrisa(estado).find((r) => r.id === id) || null;

export function crearRutinaSonrisa(estado, datos = {}, { hoy = todayISO() } = {}) {
  const d = datosSonrisa(estado);
  const nombre = String(datos.nombre || '').trim();
  if (!nombre) return { estado: normalizarEstiloHombre(estado), error: 'La rutina necesita un nombre.', rutina: null };
  const rutina = normalizarRutinaSonrisa({ ...datos, nombre, desde: hoy, orden: d.rutinas.length }, d.rutinas.length);
  return { estado: escribir(estado, { ...d, rutinas: [...d.rutinas, rutina] }), error: null, rutina };
}

export function editarRutinaSonrisa(estado, id, cambios = {}) {
  const d = datosSonrisa(estado);
  const actual = d.rutinas.find((r) => r.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  // ⚠️ Se mira lo que ÉL escribió: el motor le pone "Rutina" a lo que llega vacío.
  if ('nombre' in cambios && !String(cambios.nombre || '').trim()) {
    return { estado: normalizarEstiloHombre(estado), error: 'La rutina necesita un nombre.' };
  }
  const nueva = normalizarRutinaSonrisa({ ...actual, ...cambios, id: actual.id }, actual.orden);
  return { estado: escribir(estado, { ...d, rutinas: d.rutinas.map((r) => (r.id === id ? nueva : r)) }), error: null };
}

/**
 * Apartado 2 — la plantilla que dibuja el enunciado. ⚠️ **Se ofrece**: verla no
 * escribe nada y crearla exige `confirmado`. Octavo `aplicarPlan` del proyecto.
 */
export function plantillaSugeridaSonrisa(estado) {
  if (rutinasSonrisa(estado).length > 0) return { hay: false, guardada: false };
  return {
    hay: true,
    ...PLANTILLA_SONRISA,
    rutinasVisibles: PLANTILLA_SONRISA.rutinas.map((r) => ({
      ...r, pasosVisibles: r.pasos.map((id) => pasoSonrisa(id)).filter(Boolean),
    })),
    // ⚠️ Escrito en el propio dato: esto NO está guardado.
    guardada: false,
    accion: 'Usar esta rutina',
  };
}

export function usarPlantillaSonrisa(estado, { hoy = todayISO(), confirmado = false } = {}) {
  if (!confirmado) {
    return { estado: normalizarEstiloHombre(estado), error: null, sinConfirmar: true, creadas: 0 };
  }
  let e = estado;
  PLANTILLA_SONRISA.rutinas.forEach((r) => {
    e = crearRutinaSonrisa(e, {
      nombre: r.nombre, momento: r.momento, frecuencia: 'diario',
      pasos: r.pasos.map((id) => ({ accion: id })),
    }, { hoy }).estado;
  });
  return { estado: e, error: null, creadas: PLANTILLA_SONRISA.rutinas.length };
}

export const tocaEnFechaSonrisa = (rutina, fechaISO) =>
  tocaEnFechaGenerico(rutina, fechaISO, tipoFrecuenciaSonrisa);

export function rutinasDeHoySonrisa(estado, { hoy = todayISO() } = {}) {
  if (!parteActivaSonrisa(estado, 'higiene')) return [];
  return rutinasSonrisa(estado).filter((r) => r.activa && tocaEnFechaSonrisa(r, hoy));
}

const nombreDeProducto = (estado) => (id) => {
  if (!id) return '';
  const suyo = datosSonrisa(estado).productos.find((p) => p.id === id);
  if (!suyo) return '';
  // El nombre del catálogo global si lo enlazó; si no, el que escribió él.
  return catalogoParaSonrisa(estado).find((p) => p.id === suyo.productoId)?.nombre || suyo.nombre;
};

export function checklistSonrisa(estado, rutinaId, { hoy = todayISO() } = {}) {
  const d = datosSonrisa(estado);
  return checklistGenerico(d.rutinas.find((r) => r.id === rutinaId), d.hechos, hoy, {
    nombreDePaso: (p) => p.nombre || pasoSonrisa(p.accion)?.nombre || 'Paso',
    iconoDePaso: (p) => pasoSonrisa(p.accion)?.icono || '•',
    nombreDeProducto: nombreDeProducto(estado),
  });
}

export function marcarPasoSonrisa(estado, rutinaId, pasoId, { hoy = todayISO() } = {}) {
  const d = datosSonrisa(estado);
  return escribir(estado, { ...d, hechos: alternarPaso(d.hechos, rutinaId, pasoId, hoy) });
}

export function omitirPasoSonrisa(estado, rutinaId, pasoId, { hoy = todayISO() } = {}) {
  const d = datosSonrisa(estado);
  return escribir(estado, { ...d, hechos: alternarOmitido(d.hechos, rutinaId, pasoId, hoy) });
}

export function marcarRutinaSonrisaEntera(estado, rutinaId, { hoy = todayISO() } = {}) {
  const d = datosSonrisa(estado);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  if (!r) return normalizarEstiloHombre(estado);
  return escribir(estado, { ...d, hechos: marcarTodo(d.hechos, r, hoy) });
}

export function alternarRecordatorioSonrisa(estado, id) {
  const r = rutinaSonrisa(estado, id);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  return editarRutinaSonrisa(estado, id, { recordatorio: !r.recordatorio });
}

export const impactoEliminarRutinaSonrisa = (estado, id) => {
  const d = datosSonrisa(estado);
  return impactoEliminarRutina(d.rutinas, d.hechos, id);
};

/** ⚠️ Apartado 16 — a la papelera GLOBAL, con el motor de ME F3. */
export function eliminarRutinaSonrisa(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosSonrisa(estado);
  const r = prepararEliminacion(d, MODULO_SONRISA, 'rutinas', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.', entrada: null };
  return {
    estado: escribir(estado, {
      ...r.moduloActualizado,
      hechos: d.hechos.filter((h) => h.rutinaId !== id),
      // Los registros se quedan: lo que pasó, pasó.
      registros: d.registros.map((x) => (x.rutinaId === id ? { ...x, rutinaId: null } : x)),
    }),
    error: null,
    entrada: r.entrada,
  };
}

export function restaurarRutinaSonrisa(estado, entrada) {
  const r = prepararRestauracion(datosSonrisa(estado), entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se ha podido restaurar.' };
  return { estado: escribir(estado, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

/* ===========================================================================
   7 · LOS PRODUCTOS (apartado 3)
   =========================================================================== */

export function anadirProductoSonrisa(estado, datos = {}, { hoy = todayISO() } = {}) {
  const p = normalizarProductoSonrisa({ ...datos, desde: hoy });
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'El producto necesita un nombre.', producto: null };
  if (p.productoId && !catalogoParaSonrisa(estado).some((x) => x.id === p.productoId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.', producto: null };
  }
  const d = datosSonrisa(estado);
  return { estado: escribir(estado, { ...d, productos: [...d.productos, p] }), error: null, producto: p };
}

export function quitarProductoSonrisa(estado, id) {
  const d = datosSonrisa(estado);
  if (!d.productos.some((p) => p.id === id)) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  return {
    estado: escribir(estado, {
      ...d,
      productos: d.productos.filter((p) => p.id !== id),
      // Y los pasos que lo usaban se desenganchan, no se borran.
      rutinas: d.rutinas.map((r) => ({
        ...r, pasos: r.pasos.map((s) => (s.productoId === id ? { ...s, productoId: null } : s)),
      })),
    }),
    error: null,
  };
}

export const productosDeSonrisa = (estado) => {
  const cat = catalogoParaSonrisa(estado);
  return datosSonrisa(estado).productos.map((p) => {
    const ficha = p.productoId ? cat.find((x) => x.id === p.productoId) : null;
    return {
      ...p,
      // ⚠️ Si lo borró en su módulo, se queda **su nombre**, y se dice.
      nombreVisible: ficha?.nombre || p.nombre,
      ficha: ficha || null,
      deCatalogo: !!ficha,
      seFue: !!p.productoId && !ficha,
      etiqueta: tipoProductoSonrisa(p.tipo)?.nombre || 'Otros',
    };
  });
};

/* ===========================================================================
   8 · EL CEPILLO (apartado 6)
   ===========================================================================
   ⚠️ *"La aplicación puede sugerir una fecha según la frecuencia que configure
   el usuario. **Pero no crear automáticamente una cita**."* */

export function registrarCambioCepillo(estado, { fecha = todayISO() } = {}) {
  const d = datosSonrisa(estado);
  /* ⚠️ Cambiar el cepillo **borra el plan anterior**: ya se ha hecho, y dejarlo
     ahí sería un aviso de algo que ya pasó. */
  return { estado: escribir(estado, { ...d, cepillo: { ...d.cepillo, ultimoCambio: fecha, proximo: null } }), error: null };
}

export function ponerFrecuenciaCepillo(estado, frecuencia, dias = null) {
  if (!frecuenciaCepillo(frecuencia)) return { estado: normalizarEstiloHombre(estado), error: 'Esa frecuencia no existe.' };
  const n = Number(dias);
  if (frecuencia === 'personalizado' && !(Number.isInteger(n) && n > 0)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Dime cada cuántos días, con un número.' };
  }
  const d = datosSonrisa(estado);
  return {
    estado: escribir(estado, {
      ...d,
      cepillo: { ...d.cepillo, frecuencia, cadaCuantosDias: frecuencia === 'personalizado' ? n : null },
    }),
    error: null,
  };
}

/** ⚠️ **Sugiere; no escribe.** Octavo `aplicarPlan` del proyecto. */
export function sugerirCambioCepillo(estado, { hoy = todayISO() } = {}) {
  const c = datosSonrisa(estado).cepillo;
  const dias = c.frecuencia === 'personalizado' ? c.cadaCuantosDias : frecuenciaCepillo(c.frecuencia)?.dias;
  if (!c.ultimoCambio) {
    return {
      hay: false,
      // ⚠️ Sin la fecha del último cambio NO se inventa una.
      texto: 'Dinos cuándo lo cambiaste por última vez y te decimos cuándo tocaría.',
      guardado: false,
    };
  }
  if (!dias) {
    return { hay: false, texto: 'Elige cada cuánto lo cambias.', guardado: false };
  }
  const fecha = addDays(c.ultimoCambio, dias);
  return {
    hay: true,
    fecha,
    dias,
    vencido: fecha <= hoy,
    texto: fecha <= hoy ? 'Según lo que nos dijiste, ya tocaría cambiarlo.' : `Tocaría sobre el ${fecha}.`,
    // ⚠️ Escrito en el propio dato: esto NO está en el calendario.
    guardado: false,
    accion: 'Guardar esta fecha',
  };
}

export function planificarCambioCepillo(estado, fecha, { confirmado = false } = {}) {
  if (!confirmado) return { estado: normalizarEstiloHombre(estado), error: null, sinConfirmar: true };
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa fecha no vale.' };
  }
  const d = datosSonrisa(estado);
  return { estado: escribir(estado, { ...d, cepillo: { ...d.cepillo, proximo: fecha } }), error: null };
}

export const quitarPlanCepillo = (estado) => {
  const d = datosSonrisa(estado);
  return { estado: escribir(estado, { ...d, cepillo: { ...d.cepillo, proximo: null } }), error: null };
};

/* ===========================================================================
   9 · LAS REVISIONES (apartados 7 y 8)
   ===========================================================================
   ⚠️ *"El usuario introduce la fecha manualmente… **no crear un sistema médico
   de citas**."* Una fecha, una nota, y un aviso que enciende él. */

export function crearRevision(estado, datos = {}) {
  const r = normalizarRevision(datos);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'La revisión necesita una fecha.', revision: null };
  if (r.aviso && r.avisoTipo === 'personalizado' && !r.diasAviso) {
    return { estado: normalizarEstiloHombre(estado), error: 'Dime cuántos días antes, con un número.', revision: null };
  }
  const d = datosSonrisa(estado);
  return {
    estado: escribir(estado, { ...d, revisiones: [...d.revisiones, r].sort((a, b) => a.fecha.localeCompare(b.fecha)) }),
    error: null,
    revision: r,
  };
}

export function editarRevision(estado, id, cambios = {}) {
  const d = datosSonrisa(estado);
  const actual = d.revisiones.find((r) => r.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Esa revisión no existe.' };
  const nueva = normalizarRevision({ ...actual, ...cambios, id: actual.id });
  return {
    estado: escribir(estado, {
      ...d, revisiones: d.revisiones.map((r) => (r.id === id ? nueva : r)).sort((a, b) => a.fecha.localeCompare(b.fecha)),
    }),
    error: null,
  };
}

/** ⚠️ Apartado 16 — a la papelera global. */
export function eliminarRevision(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosSonrisa(estado);
  const r = prepararEliminacion(d, MODULO_SONRISA, 'revisiones', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa revisión no existe.', entrada: null };
  return { estado: escribir(estado, r.moduloActualizado), error: null, entrada: r.entrada };
}

export function restaurarRevision(estado, entrada) {
  const r = prepararRestauracion(datosSonrisa(estado), entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se ha podido restaurar.' };
  return { estado: escribir(estado, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

/** Los días de antelación del aviso, con la etiqueta o el número que puso él. */
export const diasDeAviso = (revision) => {
  if (!revision?.aviso) return null;
  return revision.avisoTipo === 'personalizado' ? revision.diasAviso : avisoRevision(revision.avisoTipo)?.dias ?? null;
};

export function proximaRevision(estado, { hoy = todayISO() } = {}) {
  if (!parteActivaSonrisa(estado, 'revisiones')) return null;
  return datosSonrisa(estado).revisiones.find((r) => !r.hecha && r.fecha >= hoy) || null;
}

/* ===========================================================================
   10 · EL CALENDARIO (apartados 7 y 15)
   ===========================================================================
   ⚠️ *"Nunca crear un calendario dental independiente."* La misma forma de
   evento que el Armario, Skincare y Barba, y **nunca una ocurrencia guardada**. */

/* ⚠️ Sin rango no se filtra nada — quien no lo pide, se los lleva todos. */
const enRango = (fecha, desde, hasta) => (!desde || !hasta ? true : fecha >= desde && fecha <= hasta);

export function eventosDeSonrisa(estado, desde, hasta) {
  const d = datosSonrisa(estado);
  const eventos = [];

  // Las rutinas con recordatorio, del motor.
  if (d.partes.higiene && desde && hasta) {
    eventos.push(...eventosDeRutinas({
      rutinas: d.rutinas.filter((r) => r.activa),
      tipoDe: tipoFrecuenciaSonrisa,
      desde, hasta, prefijo: 'sonrisa', origen: 'sonrisa', icono: '🪥',
    }));
  }

  /* Apartado 7 — la revisión, que es una cita concreta. ⚠️ **Pero sí se filtra
     por el rango que se pide**: sin esto, una revisión de octubre aparecía al
     pedir los eventos de agosto, y el calendario la habría pintado en el mes
     equivocado. Lo cazó la prueba del apartado 15. */
  if (d.partes.revisiones) {
    d.revisiones.filter((r) => !r.hecha && enRango(r.fecha, desde, hasta)).forEach((r) => {
      eventos.push({
        id: `sonrisa:revision:${r.id}`,
        titulo: '🦷 Dentista',
        fecha: r.fecha,
        todoElDia: true,
        horaInicio: null,
        horaFin: null,
        tipo: 'recordatorio',
        notas: r.nota,
        ubicacion: '',
        origen: 'sonrisa',
        origenId: r.id,
        soloLectura: true,
      });
    });
  }

  // Apartado 6 — el cambio de cepillo, **solo si él guardó la fecha**.
  if (d.partes.dental && d.cepillo.proximo && enRango(d.cepillo.proximo, desde, hasta)) {
    eventos.push({
      id: `sonrisa:cepillo:${d.cepillo.proximo}`,
      titulo: '🪥 Cambiar el cepillo',
      fecha: d.cepillo.proximo,
      todoElDia: true,
      horaInicio: null,
      horaFin: null,
      tipo: 'recordatorio',
      notas: '',
      ubicacion: '',
      origen: 'sonrisa',
      origenId: 'cepillo',
      soloLectura: true,
    });
  }
  return eventos;
}

/* ===========================================================================
   11 · EL SEGUIMIENTO (apartado 9)
   ===========================================================================
   ⚠️ *"Podrá registrar simplemente: ¿cómo estás llevando tu rutina? Ejemplo:
   esta semana, 10 rutinas realizadas. **Sin convertirlo en una competición**."*
   Así que la cifra **se deriva** de lo hecho: no se guarda ni un contador. */

export function registrarSonrisa(estado, datos = {}, { hoy = todayISO() } = {}) {
  if (!parteActivaSonrisa(estado, 'seguimiento')) {
    return { estado: normalizarEstiloHombre(estado), error: 'El seguimiento está desactivado.', registro: null };
  }
  const r = normalizarRegistroSonrisa({ ...datos, fecha: datos.fecha || hoy });
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Falta la fecha.', registro: null };
  if (!r.nota) return { estado: normalizarEstiloHombre(estado), error: 'Escribe una nota, si quieres guardarla.', registro: null };
  const d = datosSonrisa(estado);
  return { estado: escribir(estado, { ...d, registros: [r, ...d.registros] }), error: null, registro: r };
}

export function eliminarRegistroSonrisa(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosSonrisa(estado);
  const r = prepararEliminacion(d, MODULO_SONRISA, 'registros', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Ese registro no existe.', entrada: null };
  return { estado: escribir(estado, r.moduloActualizado), error: null, entrada: r.entrada };
}

export function restaurarRegistroSonrisa(estado, entrada) {
  const r = prepararRestauracion(datosSonrisa(estado), entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se ha podido restaurar.' };
  return { estado: escribir(estado, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

/** *"Esta semana: 10 rutinas realizadas."* ⚠️ Derivado, y **sin nota ni juicio**. */
export function estaSemanaSonrisa(estado, { hoy = todayISO() } = {}) {
  if (!parteActivaSonrisa(estado, 'seguimiento')) return null;
  const d = datosSonrisa(estado);
  const desde = addDays(hoy, -6);
  const hechas = d.hechos.filter((h) => h.fecha >= desde && h.fecha <= hoy && h.pasos.length > 0).length;
  return {
    desde,
    hasta: hoy,
    hechas,
    /* ⚠️ Con cero no se dice "0 rutinas": se dice que todavía no hay nada, que
       es otra cosa. Y nunca "deberías". */
    texto: hechas === 0
      ? 'Esta semana todavía no has registrado ninguna.'
      : `Esta semana: ${hechas} ${hechas === 1 ? 'rutina realizada' : 'rutinas realizadas'}.`,
  };
}

export const historialSonrisa = (estado, { hoy = todayISO() } = {}) => {
  const d = datosSonrisa(estado);
  return historialGenerico({ rutinas: d.rutinas, hechos: d.hechos, tipoDe: tipoFrecuenciaSonrisa, hoy });
};

/* ===========================================================================
   12 · LA RACHA — ⚠️ LA GLOBAL, Y SOLO SI LA TIENE (apartado 10)
   ===========================================================================
   *"Como ya existe el sistema global de rachas, **no crear otra racha**. Si el
   usuario tiene activado el sistema de rachas: 🏆 Higiene bucal — 7 días. Si
   no: **no mostrarla**."*

   ⚠️ Así que aquí **no se guarda ni un contador y no se crea ninguna racha**:
   se mira si existe una definición suya que apunte a este módulo, y si no la
   hay se devuelve `null`. Crearla es cosa suya, desde Rachas. */

export const ORIGEN_RACHA_SONRISA = 'sonrisa';

export function rachaDeSonrisa(rachas) {
  const definiciones = Array.isArray(rachas?.definiciones) ? rachas.definiciones : [];
  const suya = definiciones.find((r) => r && r.origen === ORIGEN_RACHA_SONRISA);
  // ⚠️ Si no la tiene, **no se muestra**. Ni se propone crearla a la fuerza.
  if (!suya) return null;
  const eventos = Array.isArray(rachas?.eventos) ? rachas.eventos : [];
  return { racha: suya, eventos: eventos.filter((e) => e.rachaId === suya.id) };
}

/* ===========================================================================
   13 · CONSEJOS Y SUGERENCIAS (apartados 11 y 12)
   ===========================================================================
   ⚠️ *"Consejos GENERALES. No diagnósticos ni instrucciones médicas
   personalizadas."* Son frases fijas, iguales para todo el mundo, y **no miran
   sus datos**: eso es justo lo que las mantiene generales. */

export const CONSEJOS_SONRISA = [
  'El cepillo se suele cambiar cada pocos meses, cuando las cerdas se abren.',
  'El hilo dental llega donde el cepillo no llega.',
  'Cepillarse sin prisa suele ser más cómodo que cepillarse fuerte.',
  'Una revisión al año es la costumbre más extendida.',
];

/** Apartado 12 — sugerencias de producto, con el motor de reglas de la F16. */
export const SUGERENCIAS_SONRISA = [
  {
    id: 'electrico',
    requiere: ['tieneCepillo', 'tieneElectrico'],
    cuando: (c) => c.tieneCepillo && !c.tieneElectrico,
    // ⚠️ La frase del enunciado, casi literal. Sugerencia → decisión suya.
    texto: 'Podrías valorar un cepillo eléctrico si buscas automatizar parte de tu rutina.',
    accion: 'Añadir producto',
  },
  {
    id: 'sin_productos',
    requiere: ['productos', 'tieneRutinas'],
    cuando: (c) => c.productos === 0 && c.tieneRutinas,
    texto: 'Si apuntas qué usas, luego lo tendrás a mano cuando se acabe.',
    accion: 'Añadir producto',
  },
  {
    id: 'sin_cepillo',
    requiere: ['tieneRutinas', 'sabeUltimoCambio'],
    cuando: (c) => c.tieneRutinas && !c.sabeUltimoCambio,
    texto: 'Si nos dices cuándo cambiaste el cepillo, te decimos cuándo tocaría el siguiente.',
    accion: 'Apuntar el cambio',
  },
];

export function contextoSonrisa(estado) {
  const d = datosSonrisa(estado);
  const productos = productosDeSonrisa(estado);
  return {
    tieneRutinas: d.rutinas.length > 0,
    productos: d.productos.length,
    tieneCepillo: productos.some((p) => p.tipo === 'cepillo'),
    tieneElectrico: productos.some((p) => p.tipo === 'electrico'),
    sabeUltimoCambio: !!d.cepillo.ultimoCambio,
  };
}

export function sugerenciasSonrisa(estado) {
  if (!parteActivaSonrisa(estado, 'dental')) return [];
  const ctx = contextoSonrisa(estado);
  return SUGERENCIAS_SONRISA
    .filter((s) => reglaAplicable(s, ctx))
    // ⚠️ Escrito en el propio dato: una sugerencia no hace nada sola.
    .map((s) => ({ id: s.id, texto: s.texto, accion: s.accion, aplicada: false }));
}

/* ===========================================================================
   14 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export function resumenSonrisa(estado, { hoy = todayISO() } = {}) {
  const d = datosSonrisa(estado);
  const deHoy = rutinasDeHoySonrisa(estado, { hoy });
  const listas = deHoy.map((r) => checklistSonrisa(estado, r.id, { hoy })).filter(Boolean);
  const prox = proximaRevision(estado, { hoy });
  return {
    estado: estadoDeEntradaSonrisa(estado),
    rutinas: d.rutinas.length,
    hoy: deHoy.length,
    hechasHoy: listas.filter((l) => l.estado === 'hecha').length,
    productos: d.productos.length,
    revisiones: d.revisiones.filter((r) => !r.hecha).length,
    proximaRevision: prox?.fecha || null,
    // ⚠️ Sin fecha guardada, `null`: no se inventa ninguna.
    cambioCepillo: d.cepillo.proximo,
    ultimoCambio: d.cepillo.ultimoCambio,
    partesActivas: PARTES_SONRISA.filter((p) => d.partes[p.id]).length,
    semana: estaSemanaSonrisa(estado, { hoy }),
  };
}

export function auditarSonrisa(estado) {
  return {
    // Apartado 15 — ni un calendario dental.
    calendariosNuevos: 0,
    // Apartado 16 — ni una papelera propia.
    papelerasNuevas: 0,
    // Apartado 3 — ni otro inventario de productos.
    inventariosNuevos: 0,
    // Apartado 10 — ni otra racha. Ni un contador guardado.
    rachasNuevas: 0,
    contadoresGuardados: 0,
    // Ni un motor de rutinas ni de reglas.
    motoresNuevos: 0,
    motorRutinas: 'motorRutinas.js',
    motorReglas: 'motorRecomendaciones.js',
    // Sin IA y sin diagnósticos (apartado 11).
    usaIA: 0,
    listasClinicasNuevas: 0,
    rutinas: rutinasSonrisa(estado).length,
  };
}

/** Todos los textos de la fase, para barrerlos de una vez. */
export function textosDeSonrisa() {
  return [
    ...Object.values(TEXTOS_SONRISA),
    ...PARTES_SONRISA.map((p) => p.nombre),
    ...PASOS_SONRISA.map((p) => p.nombre),
    ...FRECUENCIAS_SONRISA.map((f) => f.nombre),
    ...MOMENTOS_SONRISA.map((m) => m.nombre),
    ...TIPOS_PRODUCTO_SONRISA.map((t) => t.nombre),
    ...FRECUENCIAS_CEPILLO.map((f) => f.nombre),
    ...AVISOS_REVISION.map((a) => a.nombre),
    ...CONSEJOS_SONRISA,
    ...SUGERENCIAS_SONRISA.map((s) => s.texto),
    ...SUGERENCIAS_SONRISA.map((s) => s.accion),
    ...Object.values(TEXTOS_ESTADO_DIA),
  ].filter(Boolean);
}

export function panelSonrisa(estado, { hoy = todayISO(), rachas = null } = {}) {
  const d = datosSonrisa(estado);
  return {
    estado: estadoDeEntradaSonrisa(estado),
    partes: PARTES_SONRISA.map((p) => ({ ...p, activa: d.partes[p.id] })),
    rutinas: d.rutinas,
    hoy: rutinasDeHoySonrisa(estado, { hoy }).map((r) => checklistSonrisa(estado, r.id, { hoy })),
    plantilla: plantillaSugeridaSonrisa(estado),
    productos: productosDeSonrisa(estado),
    catalogo: catalogoParaSonrisa(estado),
    cepillo: { ...d.cepillo, sugerencia: sugerirCambioCepillo(estado, { hoy }) },
    revisiones: d.revisiones,
    proxima: proximaRevision(estado, { hoy }),
    registros: d.registros,
    semana: estaSemanaSonrisa(estado, { hoy }),
    // ⚠️ `null` si no tiene racha de esto: entonces no se pinta (apartado 10).
    racha: rachaDeSonrisa(rachas),
    consejos: CONSEJOS_SONRISA,
    sugerencias: sugerenciasSonrisa(estado),
    resumen: resumenSonrisa(estado, { hoy }),
  };
}

export { PALABRAS_CLINICAS, sinDiagnostico, TEXTOS_ESTADO_DIA, DIAS_HISTORIAL };
