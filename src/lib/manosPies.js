// ============================================================================
// EH · Fase 22/65 — MANOS, UÑAS Y PIES: CONFIGURACIÓN
//
// *"Un bloque pequeño. No todo el mundo lo necesita. Por eso será completamente
// modular y aparecerá únicamente si el usuario lo activa."*
//
// ── DÓNDE VIVE ESTO, Y POR QUÉ ─────────────────────────────────────────────
//
// 🔓 **C-25, respuesta 2 de Josué:** *"Cuidado de manos y Cuidado de pies son la
// Fase 22"*, y las casillas de la **F18 solo las encienden**. Así que esto vive
// **dentro del módulo `higiene`** —que es su *"🧼 Cuidado personal"*— y **no hay
// una segunda configuración**: `manos` y `pies` son las partes que ya escribió
// la F18, y lo único que añade esta fase al catálogo es **`unas`**, que su
// apartado 1 pide con su propio interruptor y que no estaba en la lista de
// casillas del apartado 1 de la F18.
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ AQUÍ TAMPOCO SE CONSTRUYE UNA MÁQUINA.** Las rutinas y el checklist
// son `motorRutinas.js` (F14), el calendario sale del mismo motor, la papelera
// es la global (ME F3) y los productos son **el catálogo compartido que ya
// resuelve `catalogoParaCuerpo` (F19)** — no un tercer sitio donde juntarlos.
//
// **2. ⚠️ EL SEGUIMIENTO SÍ SE GUARDA AQUÍ, Y NO ES UNA CONTRADICCIÓN CON LA
// F19.** La F19 lo dejó **derivado** porque su enunciado no describía ninguna
// pantalla de registro; el de esta fase la describe con todas las letras
// —*"📈 ¿Quieres registrar cuándo lo haces?"* (apartado 12) y *"cada registro
// puede tener 📝 Nota"* (apartado 13)—. Se construye **lo que pide cada
// enunciado**, no lo que hizo la fase anterior. Y empieza **apagado**: *"si dice
// que no: perfecto, no aparece"*.
//
// **3. ⚠️ DESACTIVAR UNA SECCIÓN NO TOCA LAS OTRAS NI BORRA NADA** (apartados
// 14 y 15, los dos con esas palabras: *"muy importante"*, *"todo sigue
// exactamente donde estaba"*). Cada sección es un interruptor de `PARTES_HIGIENE`
// y su configuración vive aparte, así que apagar `pies` no roza a `unas`.
//
// **4. ⚠️ DOS LISTAS DE RUTINAS DENTRO DEL MISMO MÓDULO, Y HAY QUE NOMBRARLAS.**
// La F19 ya guardó `rutinas` dentro de `higiene`, y la papelera global se indexa
// por `módulo.colección`: una segunda lista llamada igual habría hecho que
// restaurar una rutina de uñas la metiera entre las de la ducha. Por eso aquí se
// llaman **`rutinasManosPies`** y **`registrosManosPies`**.
//
// **5. ⚠️ NUNCA UN DIAGNÓSTICO** (apartado 5, con esas palabras: *"no realizar
// diagnósticos ni convertirlo en un apartado médico"*). Se reutilizan
// `PALABRAS_CLINICAS` y `sinDiagnostico()` de la F13 —no una segunda lista— y
// hay una prueba que barre todos los textos de la fase.
//
// **6. ⚠️ Y NADA SE ENCIENDE SOLO.** Las tres secciones nacen apagadas, el
// recordatorio de cada una también (apartado 7: *"completamente opcional"*), y
// el checklist **no penaliza** (apartado 9: *"no crear penalizaciones ni rachas
// obligatorias"*).
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import {
  MODULO_HIGIENE, datosCH, parteActivaCH, PARTES_HIGIENE,
} from './cuerpoHigiene';
import { PALABRAS_CLINICAS, sinDiagnostico } from './perfilPiel';
import { catalogoParaCuerpo } from './rutinasCuerpo';
import {
  normalizarRutinaGenerica, tocaEnFechaGenerico, normalizarHechos,
  alternarPaso, marcarTodo, checklistGenerico, eventosDeRutinas,
  impactoEliminarRutina, TEXTOS_ESTADO_DIA,
} from './motorRutinas';
import { prepararEliminacion, prepararRestauracion } from './papelera';
import { uid, todayISO } from './helpers';

/* ===========================================================================
   1 · LAS TRES SECCIONES (apartado 1)
   ===========================================================================
   ⚠️ *"Cada una con su propio interruptor."* Y el interruptor **es una parte de
   `PARTES_HIGIENE`**, no un campo nuevo: `manos` y `pies` ya estaban desde la
   F18 con `enFase: 22`, y `unas` la añade esta fase. Así apagar una sección y
   apagar su casilla son la misma acción, y no hay dos verdades. */

export const SECCION_UNAS = 'unas';
export const SECCION_MANOS = 'manos';
export const SECCION_PIES = 'pies';

export const SECCIONES_MP = [
  { id: SECCION_UNAS, nombre: 'Uñas', icono: '💅', titulo: 'Cuidado de uñas' },
  { id: SECCION_MANOS, nombre: 'Manos', icono: '🤲', titulo: 'Cuidado de manos' },
  { id: SECCION_PIES, nombre: 'Pies', icono: '🦶', titulo: 'Cuidado de pies' },
];

export const IDS_SECCIONES_MP = SECCIONES_MP.map((s) => s.id);
export const seccionMP = (id) => SECCIONES_MP.find((s) => s.id === id) || null;

/** ⚠️ Una sección está activa si lo está **su casilla de la F18**. */
export const seccionActiva = (estado, id) =>
  IDS_SECCIONES_MP.includes(id) && parteActivaCH(estado, MODULO_HIGIENE, id);

export const seccionesActivas = (estado) => SECCIONES_MP.filter((s) => seccionActiva(estado, s.id));

/* ===========================================================================
   2 · LO QUE SE CONFIGURA DENTRO (apartados 2, 3, 4, 5 y 6)
   ===========================================================================
   ⚠️ *"No hace falta crear una rutina enorme"* (apartado 2). Son cuatro listas
   cortas y **todo opcional**: se puede activar la sección y no tocar nada. */

/** Apartado 3 — las cinco opciones, con sus palabras. */
export const LONGITUDES_UNAS = [
  { id: 'muy_cortas', nombre: 'Muy cortas' },
  { id: 'cortas', nombre: 'Cortas' },
  { id: 'medias', nombre: 'Medias' },
  { id: 'largas', nombre: 'Largas' },
  { id: 'personalizado', nombre: 'Personalizado' },
];

export const longitudUnas = (id) => LONGITUDES_UNAS.find((l) => l.id === id) || null;

/**
 * Apartados 4 y 5 — lo que cada sección puede llevar dentro, *"opcionalmente"*.
 * ⚠️ Uñas no tiene lista propia: lo suyo son sus dos frecuencias y su longitud,
 * que es exactamente lo que pide su apartado 2.
 */
export const COSAS_DE_SECCION = {
  [SECCION_UNAS]: [],
  [SECCION_MANOS]: [
    { id: 'hidratacion', nombre: 'Hidratación', icono: '💧' },
    { id: 'proteccion', nombre: 'Protección', icono: '🧤' },
    { id: 'unas', nombre: 'Cuidado de uñas', icono: '💅' },
    { id: 'otros', nombre: 'Otros', icono: '➕' },
  ],
  [SECCION_PIES]: [
    { id: 'higiene', nombre: 'Higiene', icono: '🧼' },
    { id: 'hidratacion', nombre: 'Hidratación', icono: '💧' },
    { id: 'unas', nombre: 'Uñas', icono: '💅' },
    { id: 'general', nombre: 'Cuidado general', icono: '🦶' },
  ],
};

export const cosasDeSeccion = (id) => COSAS_DE_SECCION[id] || [];

/* Apartado 6 — *"cada elemento puede tener su propia frecuencia"*. Cuatro
   etiquetas sobre **dos comportamientos del motor**: cada X días, y ninguno. */
export const FRECUENCIAS_MP = [
  { id: 'semanal', nombre: 'Cada semana', tipo: 'cada_x', cada: 7 },
  { id: 'quincenal', nombre: 'Cada 2 semanas', tipo: 'cada_x', cada: 14 },
  { id: 'mensual', nombre: 'Cada mes', tipo: 'cada_x', cada: 30 },
  { id: 'personalizado', nombre: 'Personalizado', tipo: 'ninguna' },
];

export const frecuenciaMP = (id) => FRECUENCIAS_MP.find((f) => f.id === id) || null;
const tipoFrecuenciaMP = (id) => frecuenciaMP(id)?.tipo || null;
const cadaDeFrecuencia = (id) => frecuenciaMP(id)?.cada || null;

export const MAX_NOTA_MP = 280;

/* ===========================================================================
   3 · LOS PASOS Y LAS PLANTILLAS (apartado 8)
   ===========================================================================
   ⚠️ *"Pero todos los pasos son editables."* Así que esto es un catálogo, no una
   lista obligatoria, y "Otro" existe para lo que no quepa. */

export const PASOS_MP = [
  // Los tres del ejemplo del apartado 8.
  { id: 'cortar', nombre: 'Cortar', icono: '✂️', de: SECCION_UNAS },
  { id: 'limar', nombre: 'Limar', icono: '💅', de: SECCION_UNAS },
  { id: 'hidratar', nombre: 'Hidratar', icono: '💧', de: null },
  { id: 'proteger', nombre: 'Proteger', icono: '🧤', de: SECCION_MANOS },
  { id: 'lavar', nombre: 'Lavar', icono: '🧼', de: SECCION_PIES },
  { id: 'otros', nombre: 'Otro', icono: '➕', de: null },
];

export const pasoMP = (id) => PASOS_MP.find((p) => p.id === id) || null;

export const pasosDeSeccion = (seccionId) =>
  PASOS_MP.filter((p) => p.de === seccionId || p.de === null);

/** ⚠️ Propone; no escribe. Y solo de las secciones que él ha encendido. */
export const PLANTILLAS_MP = [
  {
    id: 'unas',
    seccion: SECCION_UNAS,
    nombre: 'Cuidado de uñas',
    icono: '💅',
    // Los tres del ejemplo, en su orden.
    pasos: ['cortar', 'limar', 'hidratar'],
    frecuencia: 'quincenal',
  },
  {
    id: 'manos',
    seccion: SECCION_MANOS,
    nombre: 'Cuidado de manos',
    icono: '🤲',
    pasos: ['hidratar'],
    frecuencia: 'semanal',
  },
  {
    id: 'pies',
    seccion: SECCION_PIES,
    nombre: 'Cuidado de pies',
    icono: '🦶',
    pasos: ['lavar', 'hidratar'],
    frecuencia: 'semanal',
  },
];

export const plantillaMP = (id) => PLANTILLAS_MP.find((p) => p.id === id) || null;

/* ===========================================================================
   4 · EL ALMACÉN
   ===========================================================================
   ⚠️ **Decisión 4** — `rutinasManosPies` y `registrosManosPies`, con ese nombre,
   porque la F19 ya guardó unas `rutinas` dentro de este mismo módulo y la
   papelera global se indexa por `módulo.colección`. */

export const DEFAULT_MANOS_PIES = {
  secciones: {},
  rutinasManosPies: [],
  hechos: [],
  registrosManosPies: [],
  productos: [],
  // Apartado 12 — *"¿quieres registrar cuándo lo haces?"*. Nace apagado.
  seguimiento: false,
};

export function normalizarSeccionMP(g, seccionId) {
  const s = g && typeof g === 'object' ? g : {};
  const cosas = {};
  cosasDeSeccion(seccionId).forEach((c) => { cosas[c.id] = s.cosas?.[c.id] === true; });
  return {
    // Apartado 2 — las dos frecuencias de uñas; para manos y pies, una.
    frecuencia: frecuenciaMP(s.frecuencia) ? s.frecuencia : null,
    frecuenciaCuidado: seccionId === SECCION_UNAS && frecuenciaMP(s.frecuenciaCuidado)
      ? s.frecuenciaCuidado : null,
    longitud: seccionId === SECCION_UNAS && longitudUnas(s.longitud) ? s.longitud : null,
    // Apartado 7 — *"completamente opcional"*, y por eso apagado.
    recordatorio: s.recordatorio === true,
    notas: String(s.notas || '').trim().slice(0, MAX_NOTA_MP),
    cosas,
    // Desde cuándo cuenta su frecuencia. Sin esto, "cada 2 semanas" no tiene
    // desde dónde contar y el motor no dispara nunca (y así está bien).
    desde: typeof s.desde === 'string' ? s.desde : null,
  };
}

const extraDeRutinaMP = (r) => ({
  seccion: IDS_SECCIONES_MP.includes(r.seccion) ? r.seccion : SECCION_UNAS,
  plantilla: PLANTILLAS_MP.some((p) => p.id === r.plantilla) ? r.plantilla : null,
});

export const normalizarRutinaMP = (g, i) =>
  normalizarRutinaGenerica(g, i, {
    tipoDe: tipoFrecuenciaMP,
    frecuenciaPorDefecto: 'personalizado',
    extra: extraDeRutinaMP,
  });

/** Apartados 12 y 13 — un registro es una fecha, su sección y una nota. */
export function normalizarRegistroMP(g) {
  const r = g || {};
  if (typeof r.fecha !== 'string') return null;
  return {
    id: r.id || uid(),
    fecha: r.fecha,
    seccion: IDS_SECCIONES_MP.includes(r.seccion) ? r.seccion : SECCION_UNAS,
    // ⚠️ Y nada más: ni una valoración que nadie ha pedido.
    nota: String(r.nota || '').trim().slice(0, MAX_NOTA_MP),
  };
}

export function normalizarManosPies(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const secciones = {};
  IDS_SECCIONES_MP.forEach((id) => { secciones[id] = normalizarSeccionMP(g.secciones?.[id], id); });
  return {
    secciones,
    rutinasManosPies: (Array.isArray(g.rutinasManosPies) ? g.rutinasManosPies : [])
      .map(normalizarRutinaMP)
      .sort((a, b) => a.orden - b.orden),
    hechos: normalizarHechos(g.hechos),
    registrosManosPies: (Array.isArray(g.registrosManosPies) ? g.registrosManosPies : [])
      .map(normalizarRegistroMP).filter(Boolean)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    // ⚠️ Ids del catálogo compartido, nunca fichas (apartado 11).
    productos: [...new Set((Array.isArray(g.productos) ? g.productos : []).filter((x) => typeof x === 'string'))],
    seguimiento: g.seguimiento === true,
  };
}

export const datosManosPies = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_HIGIENE);
  return normalizarManosPies(mod?.config?.manosPies);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_HIGIENE, { manosPies: datos });

/* ===========================================================================
   5 · CONFIGURAR CADA SECCIÓN (apartados 2 a 7, 14 y 15)
   =========================================================================== */

export const configDeSeccion = (estado, seccionId) => datosManosPies(estado).secciones[seccionId] || null;

export function configurarSeccion(estado, seccionId, cambios = {}, { hoy = todayISO() } = {}) {
  if (!seccionMP(seccionId)) return { estado: normalizarEstiloHombre(estado), error: 'Esa sección no existe.' };
  const d = datosManosPies(estado);
  const actual = d.secciones[seccionId];
  /* La fecha desde la que cuenta la frecuencia se pone sola la primera vez que
     elige una: pedírsela sería una pregunta más para nada. */
  const desde = actual.desde || (cambios.frecuencia ? hoy : null);
  const nueva = normalizarSeccionMP({ ...actual, ...cambios, desde }, seccionId);
  return {
    estado: escribir(estado, { ...d, secciones: { ...d.secciones, [seccionId]: nueva } }),
    error: null,
  };
}

/** Apartado 7 — el recordatorio de una sección, que enciende él. */
export function alternarRecordatorioSeccion(estado, seccionId, { hoy = todayISO() } = {}) {
  const actual = configDeSeccion(estado, seccionId);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Esa sección no existe.' };
  return configurarSeccion(estado, seccionId, { recordatorio: !actual.recordatorio }, { hoy });
}

/** Apartados 4 y 5 — lo de dentro, que es una lista de cosas opcionales. */
export function alternarCosaSeccion(estado, seccionId, cosaId) {
  const actual = configDeSeccion(estado, seccionId);
  if (!actual || !cosasDeSeccion(seccionId).some((c) => c.id === cosaId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Eso no existe.' };
  }
  return configurarSeccion(estado, seccionId, { cosas: { ...actual.cosas, [cosaId]: !actual.cosas[cosaId] } });
}

/**
 * Apartado 12 — *"¿Quieres registrar cuándo lo haces?"*, y *"si dice que no:
 * perfecto, no aparece"*. ⚠️ Apagarlo **no borra** lo registrado (apartado 15).
 */
export function alternarSeguimientoMP(estado) {
  const d = datosManosPies(estado);
  return escribir(estado, { ...d, seguimiento: !d.seguimiento });
}

/* ===========================================================================
   6 · LAS RUTINAS (apartados 8 y 9)
   =========================================================================== */

export const rutinasMP = (estado) => datosManosPies(estado).rutinasManosPies;
export const rutinaMP = (estado, id) => rutinasMP(estado).find((r) => r.id === id) || null;

export function plantillasSugeridasMP(estado) {
  const yaTiene = rutinasMP(estado).map((r) => r.plantilla).filter(Boolean);
  return PLANTILLAS_MP
    // ⚠️ Solo de lo que él ha encendido: a quien no cuida los pies no se le propone.
    .filter((p) => seccionActiva(estado, p.seccion) && !yaTiene.includes(p.id))
    .map((p) => ({
      ...p,
      pasosVisibles: p.pasos.map((id) => pasoMP(id)).filter(Boolean),
      frecuenciaNombre: frecuenciaMP(p.frecuencia)?.nombre || '',
      // ⚠️ Escrito en el propio dato: verla no la crea.
      guardada: false,
      accion: 'Usar esta rutina',
    }));
}

export function crearRutinaMP(estado, datos = {}, { hoy = todayISO() } = {}) {
  const nombre = String(datos.nombre || '').trim();
  if (!nombre) return { estado: normalizarEstiloHombre(estado), error: 'La rutina necesita un nombre.', rutina: null };
  if (!seccionMP(datos.seccion)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa sección no existe.', rutina: null };
  }
  const d = datosManosPies(estado);
  const rutina = normalizarRutinaMP(
    { ...datos, nombre, desde: datos.desde || hoy, orden: d.rutinasManosPies.length },
    d.rutinasManosPies.length,
  );
  return {
    estado: escribir(estado, { ...d, rutinasManosPies: [...d.rutinasManosPies, rutina] }),
    error: null,
    rutina,
  };
}

export function usarPlantillaMP(estado, plantillaId, { hoy = todayISO(), confirmado = false } = {}) {
  const p = plantillaMP(plantillaId);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Esa plantilla no existe.', rutina: null };
  if (!seccionActiva(estado, p.seccion)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa sección está desactivada.', rutina: null };
  }
  // ⚠️ Sin confirmar no escribe. Noveno `aplicarPlan` del proyecto.
  if (!confirmado) return { estado: normalizarEstiloHombre(estado), error: null, rutina: null, sinConfirmar: true };
  return crearRutinaMP(estado, {
    nombre: p.nombre,
    seccion: p.seccion,
    pasos: p.pasos.map((id) => ({ accion: id })),
    frecuencia: p.frecuencia,
    cada: cadaDeFrecuencia(p.frecuencia),
    plantilla: p.id,
  }, { hoy });
}

export function editarRutinaMP(estado, id, cambios = {}) {
  const d = datosManosPies(estado);
  const actual = d.rutinasManosPies.find((r) => r.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  // Se mira lo que ÉL escribió, no lo normalizado (la lección de la F21).
  if ('nombre' in cambios && !String(cambios.nombre || '').trim()) {
    return { estado: normalizarEstiloHombre(estado), error: 'La rutina necesita un nombre.' };
  }
  const nueva = normalizarRutinaMP({ ...actual, ...cambios, id: actual.id }, actual.orden);
  return {
    estado: escribir(estado, {
      ...d,
      rutinasManosPies: d.rutinasManosPies.map((r) => (r.id === id ? nueva : r)),
    }),
    error: null,
  };
}

/** Apartado 8 — *"todos los pasos son editables"*. */
export function anadirPasoMP(estado, rutinaId, accion) {
  const r = rutinaMP(estado, rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  if (!pasosDeSeccion(r.seccion).some((p) => p.id === accion)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese paso no es de esta sección.' };
  }
  return editarRutinaMP(estado, rutinaId, { pasos: [...r.pasos, { accion }] });
}

export function quitarPasoMP(estado, rutinaId, pasoId) {
  const r = rutinaMP(estado, rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  return editarRutinaMP(estado, rutinaId, { pasos: r.pasos.filter((p) => p.id !== pasoId) });
}

export function alternarRecordatorioRutinaMP(estado, id) {
  const r = rutinaMP(estado, id);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  return editarRutinaMP(estado, id, { recordatorio: !r.recordatorio });
}

/* ── El día (apartado 9) ─────────────────────────────────────────────────── */

export const tocaEnFechaMP = (rutina, fechaISO) =>
  tocaEnFechaGenerico(rutina, fechaISO, tipoFrecuenciaMP);

export function rutinasDeHoyMP(estado, { hoy = todayISO() } = {}) {
  return rutinasMP(estado)
    // ⚠️ Una rutina de una sección apagada no sale hoy — pero sigue guardada.
    .filter((r) => r.activa && seccionActiva(estado, r.seccion) && tocaEnFechaMP(r, hoy));
}

const nombreDeProductoMP = (estado) => (id) => {
  if (!id) return '';
  return catalogoParaCuerpo(estado).find((p) => p.id === id)?.nombre || '';
};

export function checklistMP(estado, rutinaId, { hoy = todayISO() } = {}) {
  const d = datosManosPies(estado);
  return checklistGenerico(d.rutinasManosPies.find((r) => r.id === rutinaId), d.hechos, hoy, {
    nombreDePaso: (p) => p.nombre || pasoMP(p.accion)?.nombre || 'Paso',
    iconoDePaso: (p) => pasoMP(p.accion)?.icono || '•',
    nombreDeProducto: nombreDeProductoMP(estado),
  });
}

export function marcarPasoMP(estado, rutinaId, pasoId, { hoy = todayISO() } = {}) {
  const d = datosManosPies(estado);
  return escribir(estado, { ...d, hechos: alternarPaso(d.hechos, rutinaId, pasoId, hoy) });
}

export function marcarRutinaMPEntera(estado, rutinaId, { hoy = todayISO() } = {}) {
  const d = datosManosPies(estado);
  const r = d.rutinasManosPies.find((x) => x.id === rutinaId);
  if (!r) return normalizarEstiloHombre(estado);
  return escribir(estado, { ...d, hechos: marcarTodo(d.hechos, r, hoy) });
}

/* ===========================================================================
   7 · LOS PRODUCTOS (apartado 11)
   ===========================================================================
   ⚠️ *"Utilizar el catálogo global. **No crear otro sistema de productos**."*
   Es el mismo `catalogoParaCuerpo` de la F19: aquí solo se apuntan **ids**. */

export const productosDeMP = (estado) => {
  const catalogo = catalogoParaCuerpo(estado);
  return datosManosPies(estado).productos
    .map((id) => catalogo.find((p) => p.id === id))
    .filter(Boolean);
};

export function anadirProductoMP(estado, productoId) {
  const d = datosManosPies(estado);
  if (!catalogoParaCuerpo(estado).some((p) => p.id === productoId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  }
  if (d.productos.includes(productoId)) {
    return { estado: normalizarEstiloHombre(estado), error: null, sinEfecto: true };
  }
  return { estado: escribir(estado, { ...d, productos: [...d.productos, productoId] }), error: null };
}

/* ⚠️ Quitarlo de aquí no lo borra de su módulo, así que esto no pasa por la
   papelera: no se está eliminando nada. */
export function quitarProductoMP(estado, productoId) {
  const d = datosManosPies(estado);
  return {
    estado: escribir(estado, { ...d, productos: d.productos.filter((x) => x !== productoId) }),
    error: null,
  };
}

/* ===========================================================================
   8 · EL SEGUIMIENTO (apartados 12 y 13)
   ===========================================================================
   ⚠️ **Solo si lo ha encendido**, y con una nota como único contenido: el
   enunciado no pide ni una valoración más. */

export function registrarMP(estado, datos = {}, { hoy = todayISO() } = {}) {
  const d = datosManosPies(estado);
  if (!d.seguimiento) {
    return { estado: normalizarEstiloHombre(estado), error: 'El seguimiento está desactivado.', registro: null };
  }
  if (!seccionActiva(estado, datos.seccion)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa sección está desactivada.', registro: null };
  }
  const registro = normalizarRegistroMP({ ...datos, fecha: datos.fecha || hoy });
  if (!registro) return { estado: normalizarEstiloHombre(estado), error: 'Falta la fecha.', registro: null };
  return {
    estado: escribir(estado, { ...d, registrosManosPies: [registro, ...d.registrosManosPies] }),
    error: null,
    registro,
  };
}

export function editarRegistroMP(estado, id, cambios = {}) {
  const d = datosManosPies(estado);
  const actual = d.registrosManosPies.find((r) => r.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Ese registro no existe.' };
  const nuevo = normalizarRegistroMP({ ...actual, ...cambios, id: actual.id });
  return {
    estado: escribir(estado, {
      ...d,
      registrosManosPies: d.registrosManosPies.map((r) => (r.id === id ? nuevo : r)),
    }),
    error: null,
  };
}

/** Apartado 12 — *"¿cuándo lo hago?"*, una línea por vez. */
export function historialMP(estado, { seccion = null, limite = 20 } = {}) {
  const d = datosManosPies(estado);
  return d.registrosManosPies
    .filter((r) => (seccion ? r.seccion === seccion : true))
    .slice(0, limite)
    .map((r) => ({ ...r, seccionNombre: seccionMP(r.seccion)?.nombre || '', icono: seccionMP(r.seccion)?.icono || '' }));
}

/* ===========================================================================
   9 · ELIMINAR — POR LA PAPELERA GLOBAL (apartado 16)
   ===========================================================================
   ⚠️ *"Cualquier eliminación utilizará 🗑️ Eliminados recientemente global. **No
   crear una papelera nueva**."* Octava vez que un módulo entra ahí sin tocar ni
   una función del motor — y con **nombres de colección propios** (decisión 4). */

export const impactoEliminarRutinaMP = (estado, id) => {
  const d = datosManosPies(estado);
  return impactoEliminarRutina(d.rutinasManosPies, d.hechos, id);
};

export function eliminarRutinaMP(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosManosPies(estado);
  const r = prepararEliminacion(d, MODULO_HIGIENE, 'rutinasManosPies', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.', entrada: null };
  return {
    estado: escribir(estado, {
      ...r.moduloActualizado,
      // Sus marcas se van con ella; los registros no, porque pasaron.
      hechos: d.hechos.filter((h) => h.rutinaId !== id),
    }),
    error: null,
    entrada: r.entrada,
  };
}

export function eliminarRegistroMP(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosManosPies(estado);
  const r = prepararEliminacion(d, MODULO_HIGIENE, 'registrosManosPies', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Ese registro no existe.', entrada: null };
  return { estado: escribir(estado, r.moduloActualizado), error: null, entrada: r.entrada };
}

export function restaurarEnMP(estado, entrada) {
  const d = datosManosPies(estado);
  const r = prepararRestauracion(d, entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se ha podido restaurar.' };
  return { estado: escribir(estado, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

/* ===========================================================================
   10 · EL CALENDARIO (apartado 10)
   ===========================================================================
   ⚠️ *"Nunca crear un calendario independiente."* Y el ejemplo del enunciado
   —*"💅 Cortar uñas — domingo"*— no sale de una rutina: sale de **la frecuencia
   de la propia sección**. Así que las secciones se convierten en lo que el motor
   ya sabe leer, en vez de escribir un segundo cálculo de "cada cuánto". */

const seccionComoRutina = (estado, seccion) => {
  const c = configDeSeccion(estado, seccion.id);
  return {
    id: `seccion-${seccion.id}`,
    nombre: seccion.id === SECCION_UNAS ? 'Cortar uñas' : seccion.titulo,
    activa: true,
    recordatorio: c.recordatorio,
    frecuencia: c.frecuencia,
    cada: cadaDeFrecuencia(c.frecuencia),
    dias: [],
    desde: c.desde,
  };
};

export function eventosDeManosPies(estado, desde, hasta) {
  const activas = seccionesActivas(estado);
  if (activas.length === 0) return [];
  return eventosDeRutinas({
    rutinas: [
      // Las secciones con recordatorio y frecuencia.
      ...activas.map((s) => seccionComoRutina(estado, s)),
      // Y las rutinas propiamente dichas, de secciones encendidas.
      ...rutinasMP(estado).filter((r) => r.activa && seccionActiva(estado, r.seccion)),
    ],
    tipoDe: tipoFrecuenciaMP,
    desde,
    hasta,
    prefijo: 'manospies',
    // ⚠️ El mismo origen que la F19: para el calendario esto es Higiene.
    origen: MODULO_HIGIENE,
    icono: '💅',
  });
}

/* ===========================================================================
   11 · RESUMEN, PANEL Y AUDITORÍA
   =========================================================================== */

export const TEXTOS_MP = {
  titulo: '🤲 Manos, uñas y pies',
  sub: 'Solo lo que actives. Nada de esto aparece si no lo quieres.',
  // Apartado 1 — *"no todo el mundo lo necesita"*.
  opcional: 'Es un bloque pequeño y opcional.',
  // Apartados 14 y 15, dichos en la propia pantalla.
  independientes: 'Puedes quitar una y quedarte con las otras. Lo que tengas guardado no se borra.',
  // Apartado 12.
  preguntaSeguimiento: '¿Quieres registrar cuándo lo haces?',
  sinSeguimiento: 'Perfecto, no aparece.',
  // Apartado 9 — sin penalizaciones.
  sinRachas: 'Sin rachas ni penalizaciones: es una lista, no una competición.',
  // Apartado 11.
  productos: 'Los productos son los que ya tienes apuntados.',
  vacio: 'Todavía no has activado ninguno.',
};

export function resumenMP(estado, { hoy = todayISO() } = {}) {
  const d = datosManosPies(estado);
  const activas = seccionesActivas(estado);
  return {
    activas: activas.map((s) => s.id),
    cuantas: activas.length,
    de: SECCIONES_MP.length,
    rutinas: d.rutinasManosPies.length,
    hoy: rutinasDeHoyMP(estado, { hoy }).length,
    conRecordatorio: activas.filter((s) => d.secciones[s.id].recordatorio).length,
    registros: d.registrosManosPies.length,
    // ⚠️ Sin nada registrado NO hay última: `null`, no una fecha inventada.
    ultimo: d.registrosManosPies[0]?.fecha || null,
    productos: d.productos.length,
    seguimiento: d.seguimiento,
  };
}

/** ⚠️ Una línea para la portada. `null` si no ha activado nada. */
export function lineaMP(estado) {
  const r = resumenMP(estado);
  if (r.cuantas === 0) return null;
  return seccionesActivas(estado).map((s) => s.icono).join(' ');
}

export function textosDeMP() {
  return [
    ...Object.values(TEXTOS_MP),
    ...SECCIONES_MP.flatMap((s) => [s.nombre, s.titulo]),
    ...LONGITUDES_UNAS.map((l) => l.nombre),
    ...Object.values(COSAS_DE_SECCION).flat().map((c) => c.nombre),
    ...FRECUENCIAS_MP.map((f) => f.nombre),
    ...PASOS_MP.map((p) => p.nombre),
    ...PLANTILLAS_MP.map((p) => p.nombre),
    ...Object.values(TEXTOS_ESTADO_DIA),
  ].filter(Boolean);
}

export function auditarMP(estado) {
  const d = datosManosPies(estado);
  return {
    // Decisión 1 — ni un motor, ni un catálogo, ni una papelera, ni un calendario.
    motoresNuevos: 0,
    catalogosNuevos: 0,
    papelerasNuevas: 0,
    calendariosNuevos: 0,
    motorRutinas: 'motorRutinas.js',
    catalogoProductos: 'catalogoParaCuerpo (EH F19)',
    // Decisión 3 — un interruptor por sección, y son los de la F18.
    interruptores: IDS_SECCIONES_MP.filter((id) => PARTES_HIGIENE.some((p) => p.id === id)).length,
    interruptoresPropios: 0,
    // Decisión 4 — dos listas dentro del mismo módulo, con nombres distintos.
    coleccionesPropias: ['rutinasManosPies', 'registrosManosPies'],
    // Decisión 5 — y ni un diagnóstico.
    textosClinicos: textosDeMP().filter((t) => !sinDiagnostico(t)),
    // Apartado 9 + D2-02.
    rachas: 0, puntos: 0, niveles: 0,
    // Sin IA, como todo el bloque.
    usaIA: 0,
    secciones: SECCIONES_MP.length,
    rutinas: d.rutinasManosPies.length,
  };
}

export function panelMP(estado, { hoy = todayISO() } = {}) {
  const d = datosManosPies(estado);
  return {
    titulo: TEXTOS_MP.titulo,
    sub: TEXTOS_MP.sub,
    // Apartado 1 — las tres plaquitas, cada una con su interruptor.
    secciones: SECCIONES_MP.map((s) => ({
      ...s,
      activa: seccionActiva(estado, s.id),
      config: d.secciones[s.id],
      cosas: cosasDeSeccion(s.id).map((c) => ({ ...c, puesta: d.secciones[s.id].cosas[c.id] === true })),
      // Solo uñas tiene longitud y segunda frecuencia (apartados 2 y 3).
      longitudes: s.id === SECCION_UNAS ? LONGITUDES_UNAS : [],
      rutinas: d.rutinasManosPies.filter((r) => r.seccion === s.id).length,
    })),
    frecuencias: FRECUENCIAS_MP,
    vacio: seccionesActivas(estado).length === 0 ? TEXTOS_MP.vacio : null,
    plantillas: plantillasSugeridasMP(estado),
    rutinas: d.rutinasManosPies
      .filter((r) => seccionActiva(estado, r.seccion))
      .map((r) => ({
        ...r,
        linea: `${r.pasos.length} ${r.pasos.length === 1 ? 'paso' : 'pasos'}`,
        seccionNombre: seccionMP(r.seccion)?.nombre || '',
        frecuenciaNombre: frecuenciaMP(r.frecuencia)?.nombre || '',
      })),
    hoy: rutinasDeHoyMP(estado, { hoy }).map((r) => checklistMP(estado, r.id, { hoy })),
    seguimiento: d.seguimiento,
    preguntaSeguimiento: TEXTOS_MP.preguntaSeguimiento,
    historial: d.seguimiento ? historialMP(estado) : [],
    productos: productosDeMP(estado),
    catalogo: catalogoParaCuerpo(estado),
    resumen: resumenMP(estado, { hoy }),
    independientes: TEXTOS_MP.independientes,
    sinRachas: TEXTOS_MP.sinRachas,
  };
}

export { PALABRAS_CLINICAS, sinDiagnostico, TEXTOS_ESTADO_DIA, MODULO_HIGIENE };
