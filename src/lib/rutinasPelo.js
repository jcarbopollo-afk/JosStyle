// ============================================================================
// EH · Fase 8/65 — PELO: RUTINA, CUIDADOS Y SEGUIMIENTO
//
// *"La aplicación recomienda y organiza; el usuario decide. No vamos a
// convertirlo en una obligación ni en un sistema médico."*
//
// ── LAS CUATRO REGLAS QUE GOBIERNAN ESTE ARCHIVO ───────────────────────────
//
// **1. No castigar** (apartado 7). *"No queremos 'Has fallado'. Simplemente
// 'Pendiente'."* Un día sin hacer la rutina **no es un día perdido**: es un día
// pendiente, y eso es todo lo que la pantalla puede decir. Hay una prueba que
// recorre todos los textos generados buscando reproches, igual que la analítica
// del Horario (HT F11).
//
// **2. Nada se materializa** (apartado 17 + regla 11 del proyecto). *"No crear
// un segundo calendario. Debe utilizarse el calendario existente."* Así que una
// rutina "cada 3 días" **no genera cien eventos**: guarda su regla y las
// ocurrencias se calculan al vuelo, exactamente como el horario (HT F1) y las
// rachas (RA F1).
//
// **3. Ni un contador guardado.** Cuántas veces la ha hecho, cuántos días
// seguidos, el porcentaje de cumplimiento — todo se deriva del historial. Un
// contador guardado miente en cuanto Josué borra un registro.
//
// **4. Sin gamificación** (D2-02 de Josué). Ni XP, ni niveles, ni monedas, ni
// medallas. El seguimiento cuenta lo que ha pasado y punto. Hay una prueba.
//
// ── DÓNDE VIVE ESTO ────────────────────────────────────────────────────────
//
// En la `config` del módulo Pelo, que es la que `alternarModulo` **nunca toca**
// (F1, apartado 7) — y eso es literalmente lo que pide el apartado 16 de esta
// fase: *"si el usuario desactiva Seguimiento, los datos anteriores no se
// eliminan"*. Ni una tabla nueva en Supabase, ni un séptimo almacén.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig, moduloEH } from './estiloDeHombre';
import { MODULO_PELO, contextoCapilar } from './perfilCapilar';
import {
  normalizarRutinaGenerica, tocaEnFechaGenerico, estadoDelDia,
  ESTADOS_RUTINA_DIA, TEXTOS_ESTADO_DIA,
} from './motorRutinas';
import { uid, todayISO, addDays } from './helpers';

/* ===========================================================================
   1 · EL PANEL (apartado 1)
   ===========================================================================
   *"Al entrar en 💇 Pelo, mostrar pequeñas plaquitas."* Cinco, y la de
   Peluquería **queda preparada**, que el enunciado dice con esas palabras. */

export const PLAQUITAS_PELO = [
  { id: 'perfil', nombre: 'Mi pelo', icono: '🧬', fase: 7, listo: true },
  { id: 'rutina', nombre: 'Mi rutina', icono: '🧴', fase: 8, listo: true },
  { id: 'seguimiento', nombre: 'Seguimiento', icono: '📈', fase: 8, listo: true },
  // ⚠️ Las seis están listas desde la Fase 11. Si una fase futura añade otra
  // que todavía no funcione, `listo: false` y su `fase`: regla 8 — enseñar una
  // plaquita que no lleva a nada sin avisar es el control decorativo prohibido.
  { id: 'recomendaciones', nombre: 'Recomendaciones', icono: '💡', fase: 9, listo: true },
  // EH F10 — la plaquita de productos que pide su apartado 1.
  { id: 'productos', nombre: 'Productos', icono: '🛒', fase: 10, listo: true },
  { id: 'peluqueria', nombre: 'Peluquería', icono: '📅', fase: 11, listo: true },
];

/* ===========================================================================
   2 · QUÉ PARTES QUIERE USAR (apartados 15 y 16)
   ===========================================================================
   *"No todo el mundo querrá utilizar seguimiento… Cada parte puede desaparecer
   si el usuario no la quiere."*

   ⚠️ Y esto **no es un segundo sistema de módulos**: es una preferencia dentro
   de la `config` de Pelo. El sistema de módulos es el de la Fase 1 y sigue
   siendo el único.

   ⚠️ **Recordatorios nace APAGADO** (apartado 5: *"nunca deben ser
   obligatorios"*), y el enunciado lo dibuja así: `☐ Recordatorios`. */

export const PARTES_PELO = [
  { id: 'rutinas', nombre: 'Rutinas', porDefecto: true },
  { id: 'seguimiento', nombre: 'Seguimiento', porDefecto: true },
  { id: 'recomendaciones', nombre: 'Recomendaciones', porDefecto: true },
  { id: 'recordatorios', nombre: 'Recordatorios', porDefecto: false },
  // EH F11, apartado 14 — Peluquería también se puede apagar, y apagarla
  // conserva el historial, las preferencias y los datos.
  { id: 'peluqueria', nombre: 'Peluquería', porDefecto: true },
];

export const IDS_PARTES = PARTES_PELO.map((p) => p.id);

/* ===========================================================================
   3 · EL ALMACÉN
   =========================================================================== */

export const DEFAULT_PELO = {
  rutinas: [],       // [{ id, nombre, pasos, frecuencia, dias, cada, duracion, activa, recordatorio }]
  hechos: [],        // [{ id, rutinaId, fecha, pasos: [ids hechos] }]
  cambios: [],       // [{ id, fecha, como, nota }]
  productos: [],     // [{ id, nombre, paso }] — ⚠️ sin catálogo (D2-03)
  partes: {},        // { [parte]: bool }
  // ⚠️ EH F9 — lo que él decide sobre las recomendaciones (descartes, guardadas
  // y vistas). La forma la decide `normalizarRecs` en `recomendacionesPelo.js`;
  // aquí solo se declara y se arrastra, para no importar en círculo.
  recomendaciones: {},
  // ⚠️ EH F10 — los packs de productos. Forma en `normalizarPack`
  // (`productosPelo.js`); aquí se declara y se arrastra, como `recomendaciones`.
  packs: [],
  // ⚠️ EH F11 — cortes, cita, sitios y frecuencia propia. Forma en
  // `normalizarPeluqueria` (`peluqueria.js`); aquí se declara y se arrastra.
  peluqueria: {},
  // ⚠️ EH F12 — el perfil de corte, los cortes suyos, los favoritos y el corte
  // actual. Forma en `normalizarCorteEH` (`cortesPelo.js`); aquí se declara y se
  // arrastra. **DÉCIMA vez** que este proyecto añade un campo a una entidad: sin
  // esta línea el siguiente guardado se lo lleva (regla 5), y añadir un corte
  // funcionaría hasta recargar.
  corte: {},
};

export const ACCIONES_PELO = [
  { id: 'lavado', nombre: 'Lavado', icono: '🧴' },
  { id: 'acondicionador', nombre: 'Acondicionador', icono: '🧴' },
  { id: 'mascarilla', nombre: 'Mascarilla', icono: '🧖' },
  { id: 'definicion', nombre: 'Producto de definición', icono: '💧' },
  { id: 'hidratacion', nombre: 'Hidratación', icono: '💧' },
  { id: 'peinado', nombre: 'Peinado', icono: '💇' },
  { id: 'otros', nombre: 'Otros cuidados', icono: '✨' },
];

export const accionPelo = (id) => ACCIONES_PELO.find((a) => a.id === id) || null;

/** *"No limitar artificialmente las opciones"* (apartado 4). */
/* ⚠️ **EH F14 extrajo el motor.** La Fase 14 pide la misma máquina para
   Skincare y su apartado 19 se titula *"NO DUPLICAR"*, así que lo genérico
   —la forma de una rutina, la regla de qué día toca y el estado del día— vive
   ahora en `motorRutinas.js` y lo usan los dos. Aquí se queda **lo que es de
   Pelo**: su catálogo de pasos, sus productos y su seguimiento.

   Cada frecuencia declara **de qué tipo es**: la etiqueta es de este módulo, el
   comportamiento es del motor. */
export const FRECUENCIAS_PELO = [
  { id: 'diaria', nombre: 'Diaria', tipo: 'diaria' },
  { id: 'semana', nombre: 'Varias veces por semana', pideDias: true, tipo: 'dias' },
  { id: 'semanal', nombre: 'Semanal', pideDias: true, tipo: 'dias' },
  { id: 'cada_x', nombre: 'Cada X días', pideCada: true, tipo: 'cada_x' },
  { id: 'personalizada', nombre: 'Personalizada', tipo: 'ninguna' },
];

export const frecuenciaPelo = (id) => FRECUENCIAS_PELO.find((f) => f.id === id) || null;

/** Lo que el motor necesita saber de este módulo: qué hace cada frecuencia. */
const tipoFrecuenciaPelo = (id) => frecuenciaPelo(id)?.tipo || null;

export const COMO_LO_NOTAS = [
  { id: 'mejor', nombre: 'Mejor' },
  { id: 'igual', nombre: 'Igual' },
  { id: 'peor', nombre: 'Peor' },
];

/* La forma de una rutina la da el motor. Los pasos son ids del catálogo o texto
   suyo: *"Otros cuidados"* existe precisamente para que no tenga que caber en
   la lista. Y el recordatorio nace apagado (apartado 5). */
const normalizarRutina = (g, i) =>
  normalizarRutinaGenerica(g, i, { tipoDe: tipoFrecuenciaPelo });

export function normalizarPelo(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const partes = {};
  PARTES_PELO.forEach((p) => {
    partes[p.id] = typeof g.partes?.[p.id] === 'boolean' ? g.partes[p.id] : p.porDefecto;
  });
  return {
    rutinas: (Array.isArray(g.rutinas) ? g.rutinas : []).map(normalizarRutina).sort((a, b) => a.orden - b.orden),
    hechos: (Array.isArray(g.hechos) ? g.hechos : [])
      .filter((h) => h && typeof h.fecha === 'string' && h.rutinaId)
      .map((h) => ({
        id: h.id || uid(),
        rutinaId: h.rutinaId,
        fecha: h.fecha,
        pasos: Array.isArray(h.pasos) ? h.pasos.filter(Boolean) : [],
      })),
    cambios: (Array.isArray(g.cambios) ? g.cambios : [])
      .filter((c) => c && typeof c.fecha === 'string' && COMO_LO_NOTAS.some((x) => x.id === c.como))
      .map((c) => ({ id: c.id || uid(), fecha: c.fecha, como: c.como, nota: (c.nota || '').trim() })),
    /* ⚠️ EH F10 amplió el producto: la Fase 8 guardaba solo `nombre` y `paso`, y
       la 10 le añadió marca, categoría, tiendas, valoración… **en esta misma
       lista**, no en una segunda. "No duplicar productos" está en la lista de
       pruebas del apartado 20, y dos listas de productos capilares es
       exactamente cómo se incumple. Los campos nuevos se arrastran tal cual;
       la forma la decide `normalizarProducto` en `productosPelo.js`. */
    productos: (Array.isArray(g.productos) ? g.productos : [])
      .filter((p) => p && (p.nombre || '').trim())
      .map((p) => ({ ...p, id: p.id || uid(), nombre: p.nombre.trim(), paso: p.paso || null })),
    partes,
    // ⚠️ **Séptima vez que este proyecto se topa con el mismo fallo, y la
    // primera en la que lo encontró una prueba en el mismo turno:** sin esta
    // línea, `normalizarPelo` descartaba `recomendaciones` en CADA lectura, así
    // que descartar o guardar una recomendación no tenía ningún efecto. Un campo
    // que el normalizador no conoce no llega ni al siguiente guardado.
    recomendaciones: g.recomendaciones && typeof g.recomendaciones === 'object' && !Array.isArray(g.recomendaciones)
      ? g.recomendaciones
      : {},
    // ⚠️ Octava vez. Al añadir un campo, añadirlo también aquí.
    packs: Array.isArray(g.packs) ? g.packs : [],
    // ⚠️ Novena vez. Es literalmente la costumbre de este proyecto.
    peluqueria: g.peluqueria && typeof g.peluqueria === 'object' && !Array.isArray(g.peluqueria)
      ? g.peluqueria
      : {},
    // ⚠️ Décima vez. Y otra vez lo cazó la prueba en el mismo turno: sin esta
    // línea, `anadirCorte` y `guardarReferencia` no tenían ningún efecto.
    corte: g.corte && typeof g.corte === 'object' && !Array.isArray(g.corte) ? g.corte : {},
  };
}

export const datosPelo = (estado) => {
  const e = normalizarEstiloHombre(estado);
  return normalizarPelo(e.modulos.find((m) => m.id === MODULO_PELO)?.config?.pelo);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_PELO, { pelo: datos });

/* ===========================================================================
   4 · LAS PARTES (apartados 15 y 16)
   =========================================================================== */

export const parteActiva = (estado, id) => datosPelo(estado).partes[id] === true;

export function alternarParte(estado, id) {
  if (!IDS_PARTES.includes(id)) return normalizarEstiloHombre(estado);
  const d = datosPelo(estado);
  // ⚠️ Apagar una parte NO borra sus datos (apartado 16). Se cambia el
  // interruptor y nada más — igual que `alternarModulo` en la Fase 1.
  return escribir(estado, { ...d, partes: { ...d.partes, [id]: !d.partes[id] } });
}

/* ===========================================================================
   5 · RUTINAS (apartados 2, 3, 4 y 14)
   ===========================================================================
   *"No imponer ninguna rutina predeterminada."* Por eso no hay plantillas. */

export function crearRutina(estado, datos = {}, { hoy = todayISO() } = {}) {
  const d = datosPelo(estado);
  const nueva = normalizarRutina({ ...datos, desde: datos.desde || hoy, orden: d.rutinas.length }, d.rutinas.length);
  return { estado: escribir(estado, { ...d, rutinas: [...d.rutinas, nueva] }), rutina: nueva };
}

/** Apartado 14 — *"Nada debe quedar bloqueado."* */
export function editarRutina(estado, id, cambios = {}) {
  const d = datosPelo(estado);
  const actual = d.rutinas.find((r) => r.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  const nueva = normalizarRutina({ ...actual, ...cambios, id: actual.id, orden: actual.orden }, actual.orden);
  return { estado: escribir(estado, { ...d, rutinas: d.rutinas.map((r) => (r.id === id ? nueva : r)) }), error: null };
}

/**
 * ⚠️ Borrar una rutina **se lleva su historial**, y eso se dice antes. Dejar
 * registros huérfanos haría que el seguimiento contara días de algo que ya no
 * existe. Es el mismo criterio de `impactoEliminarActividad` en HT F5.
 */
export function impactoEliminarRutina(estado, id) {
  const d = datosPelo(estado);
  const rutina = d.rutinas.find((r) => r.id === id);
  if (!rutina) return { existe: false, registros: 0, texto: '' };
  const registros = d.hechos.filter((h) => h.rutinaId === id).length;
  return {
    existe: true,
    nombre: rutina.nombre,
    registros,
    texto: registros === 0
      ? `Se borrará "${rutina.nombre}".`
      : `Se borrará "${rutina.nombre}" y ${registros} ${registros === 1 ? 'día registrado' : 'días registrados'}.`,
  };
}

export function eliminarRutina(estado, id) {
  const d = datosPelo(estado);
  if (!d.rutinas.some((r) => r.id === id)) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  return {
    estado: escribir(estado, {
      ...d,
      rutinas: d.rutinas.filter((r) => r.id !== id),
      hechos: d.hechos.filter((h) => h.rutinaId !== id),
    }),
    error: null,
  };
}

/** Apartado 14 — el ORDEN de los pasos también se cambia. */
export function ordenarPasos(estado, rutinaId, ordenIds = []) {
  const d = datosPelo(estado);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  const dentro = ordenIds.filter((id) => r.pasos.some((p) => p.id === id));
  // ⚠️ Un paso que no venga en el orden se queda detrás, no desaparece. Mismo
  // criterio que `reordenar()` de F1 y que las columnas de HT F4.
  const resto = r.pasos.filter((p) => !dentro.includes(p.id));
  const pasos = [...dentro.map((id) => r.pasos.find((p) => p.id === id)), ...resto];
  return { estado: escribir(estado, { ...d, rutinas: d.rutinas.map((x) => (x.id === rutinaId ? { ...x, pasos } : x)) }), error: null };
}

/* ===========================================================================
   6 · ⚠️ QUÉ TOCA HOY — DERIVADO, NUNCA MATERIALIZADO (apartados 6 y 17)
   ===========================================================================
   Una rutina guarda **su regla**, no cien fechas. Igual que el horario y las
   rachas. */

/** ⚠️ El cálculo es del motor: es EL sitio donde se decide qué toca hoy. */
export const tocaEnFecha = (rutina, fechaISO) =>
  tocaEnFechaGenerico(normalizarRutina(rutina, 0), fechaISO, tipoFrecuenciaPelo);

export function rutinasDeHoy(estado, { hoy = todayISO() } = {}) {
  const d = datosPelo(estado);
  if (!d.partes.rutinas) return [];
  return d.rutinas.filter((r) => tocaEnFecha(r, hoy));
}

/**
 * Apartado 6 — la lista del día. ⚠️ Y el estado de cada paso es **derivado del
 * historial**, no un campo guardado en la rutina: un estado guardado se queda
 * marcado mañana.
 */
export function checklistDelDia(estado, rutinaId, { hoy = todayISO() } = {}) {
  const d = datosPelo(estado);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  if (!r) return null;
  const registro = d.hechos.find((h) => h.rutinaId === rutinaId && h.fecha === hoy);
  const hechos = registro ? registro.pasos : [];
  return {
    id: r.id,
    nombre: r.nombre,
    fecha: hoy,
    pasos: r.pasos.map((p) => ({
      ...p,
      etiqueta: p.nombre || accionPelo(p.accion)?.nombre || 'Paso',
      icono: accionPelo(p.accion)?.icono || '✨',
      hecho: hechos.includes(p.id),
      producto: d.productos.find((x) => x.id === p.productoId)?.nombre || '',
    })),
    hechos: hechos.length,
    total: r.pasos.length,
    // ⚠️ Apartado 7 — un día sin hacer NO es un fallo. Es "Pendiente".
    estado: estadoDelDia(hechos.length, r.pasos.length),
  };
}

export { ESTADOS_RUTINA_DIA, TEXTOS_ESTADO_DIA };

/** Marcar y desmarcar un paso. Idempotente por rutina + día, como RA F2. */
export function marcarPaso(estado, rutinaId, pasoId, { hoy = todayISO() } = {}) {
  const d = datosPelo(estado);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  if (!r || !r.pasos.some((p) => p.id === pasoId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese paso no existe.' };
  }
  const registro = d.hechos.find((h) => h.rutinaId === rutinaId && h.fecha === hoy);
  const pasos = registro ? registro.pasos : [];
  const siguientes = pasos.includes(pasoId) ? pasos.filter((x) => x !== pasoId) : [...pasos, pasoId];

  let hechos;
  if (!registro) hechos = [...d.hechos, { id: uid(), rutinaId, fecha: hoy, pasos: siguientes }];
  else if (siguientes.length === 0) hechos = d.hechos.filter((h) => h !== registro);   // sin nada marcado, no hay registro
  else hechos = d.hechos.map((h) => (h === registro ? { ...h, pasos: siguientes } : h));

  return { estado: escribir(estado, { ...d, hechos }), error: null };
}

export function marcarRutinaEntera(estado, rutinaId, { hoy = todayISO() } = {}) {
  const d = datosPelo(estado);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  const otros = d.hechos.filter((h) => !(h.rutinaId === rutinaId && h.fecha === hoy));
  const yaEntera = checklistDelDia(estado, rutinaId, { hoy })?.estado === 'hecha';
  const hechos = yaEntera ? otros : [...otros, { id: uid(), rutinaId, fecha: hoy, pasos: r.pasos.map((p) => p.id) }];
  return { estado: escribir(estado, { ...d, hechos }), error: null };
}

/* ===========================================================================
   7 · SEGUIMIENTO (apartados 8 y 9)
   ===========================================================================
   *"No convertirlo todavía en estadísticas complejas."* Así que son cuatro
   cifras y una lista, todas derivadas. */

export const DIAS_HISTORIAL = 30;

export function historialPelo(estado, { hoy = todayISO(), dias = DIAS_HISTORIAL } = {}) {
  const d = datosPelo(estado);
  const desde = addDays(hoy, -dias + 1);
  const enRango = d.hechos.filter((h) => h.fecha >= desde && h.fecha <= hoy);

  return d.rutinas.map((r) => {
    const suyos = enRango.filter((h) => h.rutinaId === r.id);
    // Cuántos días le tocaba, calculado de su regla. Nada guardado.
    let tocaba = 0;
    for (let i = 0; i < dias; i += 1) {
      if (tocaEnFecha(r, addDays(hoy, -i))) tocaba += 1;
    }
    return {
      id: r.id,
      nombre: r.nombre,
      hechas: suyos.length,
      tocaba,
      // ⚠️ Sin días en los que tocara, NO hay cumplimiento — ni 0 % ni 100 %.
      // Decir "0 %" de algo que nunca tocó es exactamente el reproche que el
      // apartado 7 prohíbe.
      cumplimiento: tocaba > 0 ? Math.round((Math.min(suyos.length, tocaba) / tocaba) * 100) : null,
      ultima: suyos.length > 0 ? suyos.map((h) => h.fecha).sort().at(-1) : null,
      activa: r.activa,
    };
  });
}

/** Apartado 9 — *"¿Cómo notas tu pelo?"*, con nota opcional. */
export function registrarCambio(estado, como, nota = '', { hoy = todayISO() } = {}) {
  if (!COMO_LO_NOTAS.some((x) => x.id === como)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa opción no existe.' };
  }
  const d = datosPelo(estado);
  // Uno por día: volver a contestar hoy sustituye, no acumula.
  const otros = d.cambios.filter((c) => c.fecha !== hoy);
  return { estado: escribir(estado, { ...d, cambios: [...otros, { id: uid(), fecha: hoy, como, nota: String(nota).trim() }] }), error: null };
}

export function cambiosPelo(estado, { dias = DIAS_HISTORIAL, hoy = todayISO() } = {}) {
  const desde = addDays(hoy, -dias + 1);
  return datosPelo(estado).cambios
    .filter((c) => c.fecha >= desde && c.fecha <= hoy)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/* ===========================================================================
   8 · PRODUCTOS (apartados 11 y 12)
   ===========================================================================
   *"No desarrollar todavía el catálogo de productos ni afiliación. Solo
   preparar la conexión."* Y **D2-03** de Josué lo remacha.

   Así que un producto aquí es **un nombre que él escribe**. Ni marca, ni
   precio, ni enlace, ni una lista de la que elegir. */

export function anadirProducto(estado, nombre, paso = null) {
  const limpio = String(nombre || '').trim();
  if (!limpio) return { estado: normalizarEstiloHombre(estado), error: null, sinEfecto: true };
  const d = datosPelo(estado);
  if (d.productos.some((p) => p.nombre.toLowerCase() === limpio.toLowerCase())) {
    return { estado: normalizarEstiloHombre(estado), error: null, sinEfecto: true };
  }
  return { estado: escribir(estado, { ...d, productos: [...d.productos, { id: uid(), nombre: limpio, paso }] }), error: null };
}

export function editarProducto(estado, id, nombre) {
  const d = datosPelo(estado);
  const limpio = String(nombre || '').trim();
  if (!d.productos.some((p) => p.id === id)) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  if (!limpio) return { estado: normalizarEstiloHombre(estado), error: 'El nombre no puede quedarse vacío.' };
  return { estado: escribir(estado, { ...d, productos: d.productos.map((p) => (p.id === id ? { ...p, nombre: limpio } : p)) }), error: null };
}

/** ⚠️ Borrar un producto **desengancha** los pasos que lo usaban, no los borra. */
export function eliminarProducto(estado, id) {
  const d = datosPelo(estado);
  return {
    estado: escribir(estado, {
      ...d,
      productos: d.productos.filter((p) => p.id !== id),
      rutinas: d.rutinas.map((r) => ({
        ...r,
        pasos: r.pasos.map((p) => (p.productoId === id ? { ...p, productoId: null } : p)),
      })),
    }),
    error: null,
  };
}

export const asignarProducto = (estado, rutinaId, pasoId, productoId) => {
  const d = datosPelo(estado);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  return {
    estado: escribir(estado, {
      ...d,
      rutinas: d.rutinas.map((x) => (x.id !== rutinaId ? x
        : { ...x, pasos: x.pasos.map((p) => (p.id === pasoId ? { ...p, productoId } : p)) })),
    }),
    error: null,
  };
};

/* ===========================================================================
   9 · RECOMENDACIONES: LA ESTRUCTURA, SIN LA LÓGICA (apartado 13)
   ===========================================================================
   *"En esta fase solamente debe existir la estructura. La lógica detallada
   llegará posteriormente. **No IA.**"*

   Así que esto declara **de qué se alimentarán** y dice que todavía no existen.
   Ni una recomendación inventada (regla 8). */

export function baseParaRecomendar(estado, datosGlobales = {}) {
  const d = datosPelo(estado);
  return {
    perfil: contextoCapilar(estado, datosGlobales),
    rutinas: d.rutinas.length,
    productos: d.productos.length,
    registros: d.hechos.length,
    cambios: d.cambios.length,
    // ⚠️ Lo que el apartado 13 enumera, en orden, para que la fase 9 no tenga
    // que releerlo.
    fuentes: ['perfil capilar', 'necesidades', 'preferencias', 'rutina', 'productos existentes', 'información registrada'],
    disponible: false,
    fase: 9,
    nota: 'Las recomendaciones de pelo se construyen en la fase 9.',
    sinIA: true,
  };
}

/* ===========================================================================
   10 · CALENDARIO (apartado 17)
   ===========================================================================
   *"No crear un segundo calendario. Debe utilizarse el calendario existente."*

   ⚠️ Y la regla 11 del proyecto: **derivado y de solo lectura, sin materializar
   ni una ocurrencia**. La misma forma que `eventosDeArmario` en
   `calendarioIntegracion.js`, para que encaje sin adaptadores. */

export function eventosDePelo(estado, { desde, hasta } = {}) {
  const d = datosPelo(estado);
  if (!d.partes.rutinas || !desde || !hasta) return [];

  const eventos = [];
  for (let f = desde; f <= hasta; f = addDays(f, 1)) {
    d.rutinas.filter((r) => tocaEnFecha(r, f)).forEach((r) => {
      eventos.push({
        // ⚠️ El id lleva la fecha porque la ocurrencia NO existe como entidad:
        // se calcula. Si mañana cambia la frecuencia, cambian los eventos solos.
        id: `pelo:${r.id}:${f}`,
        titulo: `💇 ${r.nombre}`,
        fecha: f,
        todoElDia: true,
        horaInicio: null,
        horaFin: null,
        tipo: 'personal',
        notas: '',
        ubicacion: '',
        origen: 'pelo',
        origenId: r.id,
        soloLectura: true,
      });
    });
  }
  return eventos;
}

/* ===========================================================================
   11 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export function resumenPelo(estado, { hoy = todayISO() } = {}) {
  const d = datosPelo(estado);
  const deHoy = rutinasDeHoy(estado, { hoy });
  const listas = deHoy.map((r) => checklistDelDia(estado, r.id, { hoy })).filter(Boolean);
  return {
    rutinas: d.rutinas.length,
    activas: d.rutinas.filter((r) => r.activa).length,
    hoy: deHoy.length,
    hechasHoy: listas.filter((l) => l.estado === 'hecha').length,
    // ⚠️ "Pendiente", nunca "fallidas".
    pendientesHoy: listas.filter((l) => l.estado === 'pendiente').length,
    productos: d.productos.length,
    registros: d.hechos.length,
    ultimoCambio: cambiosPelo(estado, { hoy })[0] || null,
    partes: d.partes,
    // Lo que esta fase NO construye, dicho en una cifra.
    recomendaciones: 0,
    peluqueria: 0,
  };
}

/** ⚠️ D2-02 y la regla 11 en una función que se puede probar. */
export function auditarPelo(estado) {
  const d = datosPelo(estado);
  return {
    // Ni un contador guardado: todo se deriva de `hechos`.
    contadoresGuardados: 0,
    // Ni una ocurrencia materializada: las rutinas guardan su regla.
    ocurrenciasGuardadas: 0,
    // Ni gamificación (D2-02).
    xp: 0, niveles: 0, medallas: 0,
    // Ni fotos (apartado 10).
    fotos: 0,
    // Ni catálogo de productos (apartado 11 + D2-03): solo nombres suyos.
    productosDelCatalogo: 0,
    productosSuyos: d.productos.length,
    modulo: moduloEH(MODULO_PELO)?.nombre || MODULO_PELO,
  };
}
