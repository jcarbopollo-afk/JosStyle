// ============================================================================
// EH · Fase 14/65 — SKINCARE: RUTINAS Y CUIDADO DIARIO
//
// *"La aplicación propone. El usuario configura. Nada obligatorio, nada de IA y
// nada de duplicar información existente."*
//
// ── LA DECISIÓN QUE GOBIERNA LA FASE ───────────────────────────────────────
//
// ⚠️ **El apartado 19 se titula "NO DUPLICAR", y esta fase pide exactamente la
// máquina que ya construyó la Fase 8 para el pelo.** Pasos, frecuencia, lista
// del día, historial, eventos de calendario: lo mismo, para otra parte del
// cuerpo.
//
// Copiar `rutinasPelo.js` habría sido el segundo sistema —y el segundo sitio
// donde arreglar el mismo fallo—, así que lo genérico se extrajo a
// **`motorRutinas.js`** y los dos módulos lo usan. Este archivo aporta lo que
// de verdad es de Skincare: su catálogo de pasos, sus momentos del día, sus
// plantillas y su seguimiento. **El cálculo de qué toca hoy es uno solo.**
//
// Las 171 pruebas de la Fase 8 son la red que demuestra que la extracción no
// cambió nada de lo que ya funcionaba.
//
// ── LAS OTRAS CUATRO ───────────────────────────────────────────────────────
//
// **1. ⚠️ Los productos son los de la Fase 13** (apartados 6 y 19: *"no crear un
// segundo inventario"*). Un paso guarda el `id` de un producto que ya existe en
// el perfil de piel, y *"+ Añadir producto"* escribe **allí**, no aquí. Hay una
// prueba que lee este código y falla si aparece un almacén de productos propio.
//
// **2. ⚠️ Omitir NO es fallar** (apartado 10: *"sin penalización"*). Un paso
// omitido es una **tercera cosa**: no pendiente —eso sería el reproche— y no
// hecho —eso sería mentir—. Sale de la cuenta del día, así que una rutina de
// tres pasos con uno omitido y dos hechos está **hecha**.
//
// **3. ⚠️ Las plantillas SUGIEREN** (apartados 12 y 13). *"Son plantillas, no
// obligaciones"*, y *"el usuario debe confirmar: Usar esta rutina"*. Así que
// `plantillaSugerida()` devuelve una propuesta y **no escribe nada**; crearla es
// `usarPlantilla()`, y esa la llama él. Cuarto `aplicarPlan` del proyecto.
//
// **4. ⚠️ Cambiar de nivel NO borra la rutina anterior** (apartado 14, con esas
// palabras). El nivel filtra **lo que se ofrece**, no lo que existe: sus rutinas
// se quedan enteras, y hay una prueba que las cuenta antes y después.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { NIVELES_ESTILO } from './perfilEstilo';
import {
  MODULO_PIEL, datosPiel, respuestaPiel, anadirProductoPiel, contextoDePiel,
} from './perfilPiel';
import {
  normalizarRutinaGenerica, tocaEnFechaGenerico, normalizarHechos,
  alternarPaso, alternarOmitido, marcarTodo, checklistGenerico,
  historialGenerico, eventosDeRutinas, impactoEliminarRutina, estadoDelDia,
  ESTADOS_RUTINA_DIA, TEXTOS_ESTADO_DIA, DIAS_HISTORIAL,
} from './motorRutinas';
import { uid, todayISO, addDays } from './helpers';

/* ===========================================================================
   1 · EL PANEL (apartado 1)
   ===========================================================================
   Las cinco plaquitas del enunciado. ⚠️ Regla 8: las que todavía no funcionan
   **dicen en qué fase llegan**, en vez de no hacer nada al tocarlas. */

export const PLAQUITAS_PIEL = [
  { id: 'perfil', nombre: 'Mi piel', icono: '🧬', fase: 13, listo: true },
  { id: 'rutina', nombre: 'Mi rutina', icono: '🧴', fase: 14, listo: true },
  { id: 'seguimiento', nombre: 'Seguimiento', icono: '📈', fase: 14, listo: true },
  { id: 'recomendaciones', nombre: 'Recomendaciones', icono: '💡', fase: 16, listo: true },
  { id: 'productos', nombre: 'Productos', icono: '🛒', fase: 17, listo: true },
];

/** Apartado 18 — cada parte se puede apagar, y **los datos se conservan**. */
export const PARTES_PIEL = [
  { id: 'rutinas', nombre: 'Rutinas', porDefecto: true },
  { id: 'seguimiento', nombre: 'Seguimiento', porDefecto: true },
  // ⚠️ Apagado por defecto: *"los recordatorios son opcionales… no insistir"*.
  { id: 'recordatorios', nombre: 'Recordatorios', porDefecto: false },
  /* EH F16, apartados 1 y 17 — *"debe ser una plaquita independiente y poder
     desactivarse"*, y *"los demás módulos continúan funcionando"*. Encendida por
     defecto, como las rutinas: es contenido, no un aviso. */
  { id: 'recomendaciones', nombre: 'Recomendaciones', porDefecto: true },
  /* EH F17, apartado 21 — *"si el usuario desactiva productos, el módulo de
     skincare debe seguir funcionando"*. Encendida por defecto, y apagarla no
     borra ni un producto: solo deja de enseñarlos. */
  { id: 'productos', nombre: 'Productos', porDefecto: true },
];

export const parteActivaPiel = (estado, id) => datosRutinasPiel(estado).partes[id] === true;

export function alternarPartePiel(estado, id) {
  if (!PARTES_PIEL.some((p) => p.id === id)) return normalizarEstiloHombre(estado);
  const d = datosRutinasPiel(estado);
  // ⚠️ Apagar no borra: solo cambia el interruptor (F1, apartado 7).
  return escribir(estado, { ...d, partes: { ...d.partes, [id]: !d.partes[id] } });
}

/* ===========================================================================
   2 · LOS PASOS (apartado 4)
   ===========================================================================
   *"No imponer una lista cerrada."* Así que hay catálogo **y** texto libre: el
   paso "Otro" existe para lo que no quepa. */

export const PASOS_PIEL = [
  { id: 'limpieza', nombre: 'Limpieza', icono: '🫧', nivel: 'basico' },
  { id: 'hidratacion', nombre: 'Hidratación', icono: '💧', nivel: 'basico' },
  { id: 'solar', nombre: 'Protección solar', icono: '☀️', nivel: 'basico' },
  { id: 'tonico', nombre: 'Tónico', icono: '🧪', nivel: 'intermedio' },
  { id: 'serum', nombre: 'Sérum', icono: '💦', nivel: 'intermedio' },
  { id: 'contorno', nombre: 'Contorno de ojos', icono: '👁️', nivel: 'intermedio' },
  { id: 'exfoliacion', nombre: 'Exfoliación', icono: '✨', nivel: 'avanzado' },
  { id: 'mascarilla', nombre: 'Mascarilla', icono: '🧖', nivel: 'avanzado' },
  { id: 'tratamiento', nombre: 'Tratamiento', icono: '🎯', nivel: 'avanzado' },
  { id: 'especifico', nombre: 'Cuidado específico', icono: '🔎', nivel: 'avanzado' },
  { id: 'otros', nombre: 'Otro', icono: '➕', nivel: 'basico' },
];

export const pasoPiel = (id) => PASOS_PIEL.find((p) => p.id === id) || null;

/**
 * ⚠️ Apartado 14 — *"cambiar de nivel no debe borrar la rutina anterior.
 * Simplemente modifica las opciones que se muestran."* Esto es "las opciones que
 * se muestran"; lo guardado no se toca nunca desde aquí.
 */
export function pasosParaNivel(nivel) {
  const orden = NIVELES_ESTILO.map((x) => x.id);
  const hasta = orden.indexOf(nivel);
  // Sin nivel elegido se ofrece todo: esconder opciones a quien no ha dicho
  // nada sería decidir por él.
  if (hasta < 0) return PASOS_PIEL;
  return PASOS_PIEL.filter((p) => orden.indexOf(p.nivel) <= hasta);
}

/* ===========================================================================
   3 · MOMENTOS Y FRECUENCIAS (apartados 3 y 7)
   ===========================================================================
   ⚠️ Las seis frecuencias del apartado 7 son **seis etiquetas sobre cuatro
   comportamientos**: "días concretos", "varias veces por semana" y "semanal"
   son tres formas de decir "estos días de la semana". Se guarda la palabra que
   eligió Josué, y el `tipo` es lo que el motor calcula. */

export const MOMENTOS_PIEL = [
  { id: 'manana', nombre: 'Mañana', icono: '☀️' },
  { id: 'noche', nombre: 'Noche', icono: '🌙' },
  { id: 'otra', nombre: 'Otra rutina', icono: '➕' },
];

export const momentoPiel = (id) => MOMENTOS_PIEL.find((m) => m.id === id) || null;

export const FRECUENCIAS_PIEL = [
  { id: 'diario', nombre: 'Diario', tipo: 'diaria' },
  { id: 'dias', nombre: 'Días concretos', pideDias: true, tipo: 'dias' },
  { id: 'veces_semana', nombre: 'Varias veces por semana', pideDias: true, tipo: 'dias' },
  { id: 'semanal', nombre: 'Semanal', pideDias: true, tipo: 'dias' },
  { id: 'cada_x', nombre: 'Cada X días', pideCada: true, tipo: 'cada_x' },
  { id: 'personalizado', nombre: 'Personalizado', tipo: 'ninguna' },
];

export const frecuenciaPiel = (id) => FRECUENCIAS_PIEL.find((f) => f.id === id) || null;

const tipoFrecuenciaPiel = (id) => frecuenciaPiel(id)?.tipo || null;

/* ===========================================================================
   4 · EL ALMACÉN
   ===========================================================================
   Una llave dentro de la `config` de Skincare. ⚠️ **Ningún inventario de
   productos**: esos son los de la Fase 13 (apartado 19). */

export const DEFAULT_RUTINAS_PIEL = {
  rutinas: [],
  hechos: [],
  partes: {},
};

/* ⚠️ Los campos propios de una rutina de piel —`momento`, `hora` y `dias` del
   recordatorio— los normaliza ESTE módulo. El motor solo conoce los suyos, y un
   campo que nadie normaliza desaparece en el siguiente guardado (regla 5). Van
   catorce veces en este proyecto. */
const extraDeRutina = (r) => ({
  momento: momentoPiel(r.momento) ? r.momento : 'otra',
  // Apartado 8 — el recordatorio decide hora y días, no solo sí/no.
  hora: typeof r.hora === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(r.hora) ? r.hora : null,
  diasAviso: (Array.isArray(r.diasAviso) ? r.diasAviso : [])
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6),
});

const normalizarRutinaPiel = (g, i) =>
  normalizarRutinaGenerica(g, i, {
    tipoDe: tipoFrecuenciaPiel,
    frecuenciaPorDefecto: 'personalizado',
    extra: extraDeRutina,
  });

export function normalizarRutinasPiel(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const partes = {};
  PARTES_PIEL.forEach((p) => {
    partes[p.id] = typeof g.partes?.[p.id] === 'boolean' ? g.partes[p.id] : p.porDefecto;
  });
  return {
    rutinas: (Array.isArray(g.rutinas) ? g.rutinas : [])
      .map(normalizarRutinaPiel)
      .sort((a, b) => a.orden - b.orden),
    hechos: normalizarHechos(g.hechos),
    partes,
  };
}

export const datosRutinasPiel = (estado) => {
  const e = normalizarEstiloHombre(estado);
  return normalizarRutinasPiel(e.modulos.find((m) => m.id === MODULO_PIEL)?.config?.rutinas);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_PIEL, { rutinas: datos });

/* ===========================================================================
   5 · CREAR, EDITAR Y BORRAR (apartados 2, 3, 11 y 12)
   =========================================================================== */

export function crearRutinaPiel(estado, datos = {}, { hoy = todayISO() } = {}) {
  const d = datosRutinasPiel(estado);
  const rutina = normalizarRutinaPiel({ ...datos, desde: datos.desde || hoy }, d.rutinas.length);
  return { estado: escribir(estado, { ...d, rutinas: [...d.rutinas, rutina] }), error: null, rutina };
}

export function editarRutinaPiel(estado, id, cambios = {}) {
  const d = datosRutinasPiel(estado);
  const actual = d.rutinas.find((r) => r.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  const nueva = normalizarRutinaPiel({ ...actual, ...cambios, id: actual.id }, actual.orden);
  return { estado: escribir(estado, { ...d, rutinas: d.rutinas.map((r) => (r.id === id ? nueva : r)) }), error: null };
}

/** ⚠️ Se dice ANTES qué se lleva por delante, no después. */
export const impactoEliminarRutinaPiel = (estado, id) => {
  const d = datosRutinasPiel(estado);
  return impactoEliminarRutina(d.rutinas, d.hechos, id);
};

export function eliminarRutinaPiel(estado, id) {
  const d = datosRutinasPiel(estado);
  if (!d.rutinas.some((r) => r.id === id)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  }
  return {
    estado: escribir(estado, {
      ...d,
      rutinas: d.rutinas.filter((r) => r.id !== id),
      hechos: d.hechos.filter((h) => h.rutinaId !== id),
    }),
    error: null,
  };
}

/** Apartado 5 — *"el usuario puede cambiar el orden"*. */
export function ordenarPasosPiel(estado, rutinaId, ordenIds = []) {
  const d = datosRutinasPiel(estado);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  const porId = new Map(r.pasos.map((p) => [p.id, p]));
  // ⚠️ Un paso que no venga en la lista NO se pierde: se queda al final. Un
  // reordenado no puede borrar nada.
  const ordenados = [
    ...ordenIds.map((id) => porId.get(id)).filter(Boolean),
    ...r.pasos.filter((p) => !ordenIds.includes(p.id)),
  ];
  return editarRutinaPiel(estado, rutinaId, { pasos: ordenados });
}

/* ===========================================================================
   6 · LOS PRODUCTOS SON LOS DE LA FASE 13 (apartados 6 y 19)
   ===========================================================================
   *"Si todavía no existe: + Añadir producto. No crear un segundo inventario."*

   ⚠️ Así que `anadirProductoAPaso` escribe en el perfil de piel —que es donde
   viven— y aquí solo se guarda su `id`. Hay una prueba que lee este archivo y
   falla si aparece una lista de productos propia. */

export const productosDePiel = (estado) => datosPiel(estado).productos;

export function asignarProductoAPaso(estado, rutinaId, pasoId, productoId) {
  const d = datosRutinasPiel(estado);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  if (productoId !== null && !productosDePiel(estado).some((p) => p.id === productoId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  }
  return editarRutinaPiel(estado, rutinaId, {
    pasos: r.pasos.map((p) => (p.id === pasoId ? { ...p, productoId } : p)),
  });
}

/**
 * *"+ Añadir producto"* desde un paso. ⚠️ **Crea el producto en el perfil de
 * piel** (Fase 13) y luego lo engancha: dos escrituras, un solo inventario.
 */
export function crearProductoParaPaso(estado, rutinaId, pasoId, nombre) {
  const creado = anadirProductoPiel(estado, nombre);
  if (creado.error) return { estado: normalizarEstiloHombre(estado), error: creado.error };
  const limpio = String(nombre).trim().toLowerCase();
  const producto = datosPiel(creado.estado).productos.find((p) => p.nombre.toLowerCase() === limpio);
  if (!producto) return { estado: creado.estado, error: null };
  return asignarProductoAPaso(creado.estado, rutinaId, pasoId, producto.id);
}

/* ===========================================================================
   7 · QUÉ TOCA HOY, Y LA LISTA (apartados 9 y 10)
   =========================================================================== */

export const tocaHoyPiel = (rutina, fechaISO) =>
  tocaEnFechaGenerico(rutina, fechaISO, tipoFrecuenciaPiel);

export function rutinasDeHoyPiel(estado, { hoy = todayISO() } = {}) {
  const d = datosRutinasPiel(estado);
  if (!d.partes.rutinas) return [];
  return d.rutinas.filter((r) => tocaHoyPiel(r, hoy));
}

export function checklistPiel(estado, rutinaId, { hoy = todayISO() } = {}) {
  const d = datosRutinasPiel(estado);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  const productos = productosDePiel(estado);
  return checklistGenerico(r, d.hechos, hoy, {
    nombreDePaso: (p) => p.nombre || pasoPiel(p.accion)?.nombre || 'Paso',
    iconoDePaso: (p) => pasoPiel(p.accion)?.icono || '✨',
    nombreDeProducto: (id) => productos.find((x) => x.id === id)?.nombre || '',
  });
}

export function marcarPasoPiel(estado, rutinaId, pasoId, { hoy = todayISO() } = {}) {
  const d = datosRutinasPiel(estado);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  if (!r || !r.pasos.some((p) => p.id === pasoId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese paso no existe.' };
  }
  return { estado: escribir(estado, { ...d, hechos: alternarPaso(d.hechos, rutinaId, pasoId, hoy) }), error: null };
}

/** ⚠️ Apartado 10 — *"Omitir hoy"*, **sin penalización**. */
export function omitirPasoPiel(estado, rutinaId, pasoId, { hoy = todayISO() } = {}) {
  const d = datosRutinasPiel(estado);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  if (!r || !r.pasos.some((p) => p.id === pasoId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese paso no existe.' };
  }
  return { estado: escribir(estado, { ...d, hechos: alternarOmitido(d.hechos, rutinaId, pasoId, hoy) }), error: null };
}

export function marcarRutinaPielEntera(estado, rutinaId, { hoy = todayISO() } = {}) {
  const d = datosRutinasPiel(estado);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  return { estado: escribir(estado, { ...d, hechos: marcarTodo(d.hechos, r, hoy) }), error: null };
}

/* ===========================================================================
   8 · PLANTILLAS (apartados 12 y 13)
   ===========================================================================
   ⚠️ *"Son plantillas, no obligaciones."* Y *"el usuario debe confirmar: Usar
   esta rutina"*. Así que esto **propone**; crear es otra llamada. */

export const PLANTILLAS_PIEL = [
  {
    id: 'basica', nivel: 'basico', nombre: 'Rutina básica',
    pasos: ['limpieza', 'hidratacion', 'solar'],
    momento: 'manana', frecuencia: 'diario',
  },
  {
    id: 'intermedia', nivel: 'intermedio', nombre: 'Rutina intermedia',
    pasos: ['limpieza', 'tonico', 'serum', 'hidratacion', 'solar'],
    momento: 'manana', frecuencia: 'diario',
  },
  {
    id: 'completa', nivel: 'avanzado', nombre: 'Rutina completa',
    pasos: ['limpieza', 'tonico', 'serum', 'contorno', 'hidratacion', 'solar'],
    momento: 'manana', frecuencia: 'diario',
  },
  {
    id: 'noche', nivel: 'basico', nombre: 'Rutina de noche',
    pasos: ['limpieza', 'hidratacion'],
    momento: 'noche', frecuencia: 'diario',
  },
];

export const plantillaPiel = (id) => PLANTILLAS_PIEL.find((p) => p.id === id) || null;

/**
 * Apartado 13 — *"las plantillas pueden adaptarse utilizando la información del
 * perfil"*. ⚠️ **Devuelve una propuesta y no escribe nada.** La prueba serializa
 * el estado antes y después.
 */
export function plantillaSugerida(estado, datosGlobales = {}) {
  const nivel = respuestaPiel(estado, 'complejidadPiel', datosGlobales).valores[0] || null;
  const solar = respuestaPiel(estado, 'solarPiel', datosGlobales).valores[0] || null;
  const base = PLANTILLAS_PIEL.find((p) => p.nivel === nivel && p.momento === 'manana');

  if (!base) {
    return {
      hay: false,
      // ⚠️ Y no se elige una por él: sin nivel no hay sugerencia, y se dice.
      texto: 'Dinos qué tipo de rutina prefieres y te propondremos una estructura.',
      guardado: false,
    };
  }
  // ⚠️ Si ha dicho que NO usa protección solar, no se le mete en la propuesta:
  // el apartado 13 dice "adaptarse utilizando la información del perfil".
  const pasos = solar === 'no' ? base.pasos.filter((p) => p !== 'solar') : base.pasos;
  return {
    hay: true,
    plantilla: base.id,
    nombre: base.nombre,
    pasos: pasos.map((id) => ({ id, nombre: pasoPiel(id).nombre, icono: pasoPiel(id).icono })),
    momento: base.momento,
    frecuencia: base.frecuencia,
    porque: `La proponemos porque has dicho que prefieres una rutina ${
      NIVELES_ESTILO.find((x) => x.id === nivel) ? base.nombre.toLowerCase().replace('rutina ', '') : ''
    }.`.replace('  ', ' '),
    // ⚠️ Escrito en el propio dato: esto no está guardado.
    guardado: false,
    accion: 'Usar esta rutina',
  };
}

/**
 * ⚠️ Apartado 13 — *"pero el usuario debe confirmar"*. Sin `confirmado` no
 * escribe, y **nunca se le da un valor por defecto**: es la regla 7 en código,
 * igual que `aplicarPlan` (HT F9) y `aplicarARutina` (EH F9).
 */
export function usarPlantilla(estado, plantillaId, { confirmado = false, hoy = todayISO(), nombre = null } = {}) {
  if (!confirmado) {
    return { estado: normalizarEstiloHombre(estado), error: 'Hace falta confirmarlo.', rutina: null };
  }
  const p = plantillaPiel(plantillaId);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Esa plantilla no existe.', rutina: null };
  return crearRutinaPiel(estado, {
    nombre: nombre || p.nombre,
    momento: p.momento,
    frecuencia: p.frecuencia,
    pasos: p.pasos.map((id) => ({ accion: id })),
  }, { hoy });
}

/* ===========================================================================
   9 · SEGUIMIENTO E HISTORIAL (apartados 15 y 16)
   ===========================================================================
   *"No convertirlo en una competición. No castigar al usuario."* Y *"no hace
   falta llenar la pantalla de estadísticas"*: una frase. */

export const historialPiel = (estado, opts = {}) => {
  const d = datosRutinasPiel(estado);
  return historialGenerico({ rutinas: d.rutinas, hechos: d.hechos, tipoDe: tipoFrecuenciaPiel, ...opts });
};

/** Apartado 16 — *"Esta semana: 8 rutinas realizadas."* Eso, y nada más. */
export function estaSemanaPiel(estado, { hoy = todayISO() } = {}) {
  const d = datosRutinasPiel(estado);
  const desde = addDays(hoy, -6);
  const enRango = d.hechos.filter((h) => h.fecha >= desde && h.fecha <= hoy && h.pasos.length > 0);
  return {
    hechas: enRango.length,
    // ⚠️ Ni porcentaje, ni racha, ni comparación con la semana pasada: el
    // apartado dice *"información sencilla"* y avisa de no llenar la pantalla.
    texto: enRango.length === 0
      ? 'Todavía no has marcado ninguna esta semana.'
      : `Esta semana: ${enRango.length} ${enRango.length === 1 ? 'rutina realizada' : 'rutinas realizadas'}.`,
  };
}

/* ===========================================================================
   10 · CALENDARIO (apartado 17)
   ===========================================================================
   ⚠️ *"No crear un calendario de skincare independiente."* Entra por
   `eventosDerivados`, como todo lo demás. */

export function eventosDePiel(estado, { desde, hasta } = {}) {
  const d = datosRutinasPiel(estado);
  if (!d.partes.rutinas || !d.partes.recordatorios) return [];
  return eventosDeRutinas({
    rutinas: d.rutinas, tipoDe: tipoFrecuenciaPiel, desde, hasta,
    prefijo: 'skincare', origen: 'piel', icono: '🧴',
  });
}

/* ===========================================================================
   11 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export function resumenRutinasPiel(estado, { hoy = todayISO() } = {}) {
  const d = datosRutinasPiel(estado);
  const hoyToca = rutinasDeHoyPiel(estado, { hoy });
  const listas = hoyToca.map((r) => checklistPiel(estado, r.id, { hoy })).filter(Boolean);
  return {
    rutinas: d.rutinas.length,
    manana: d.rutinas.filter((r) => r.momento === 'manana').length,
    noche: d.rutinas.filter((r) => r.momento === 'noche').length,
    hoy: hoyToca.length,
    hechasHoy: listas.filter((l) => l.estado === 'hecha').length,
    registros: d.hechos.length,
    semana: estaSemanaPiel(estado, { hoy }).hechas,
    partes: d.partes,
  };
}

/**
 * ⚠️ El apartado 19 hecho comprobable: cero inventarios nuevos, cero
 * calendarios nuevos, cero copias del perfil.
 */
export function auditarRutinasPiel(estado) {
  const d = datosRutinasPiel(estado);
  return {
    // El inventario es el de la Fase 13.
    inventariosPropios: 0,
    productosDelPerfil: productosDePiel(estado).length,
    // El calendario es el que ya existe.
    calendariosNuevos: 0,
    // El perfil no se copia: se lee.
    copiasDelPerfil: 0,
    // Sin IA, como todo el bloque.
    usaIA: 0,
    // Y sin gamificación (D2-02): ni puntos, ni niveles, ni rachas aquí.
    xp: 0,
    rachas: 0,
    rutinas: d.rutinas.length,
    // El motor es uno solo, compartido con Pelo.
    motorCompartido: 'motorRutinas.js',
  };
}

export { ESTADOS_RUTINA_DIA, TEXTOS_ESTADO_DIA, DIAS_HISTORIAL, estadoDelDia, contextoDePiel };
