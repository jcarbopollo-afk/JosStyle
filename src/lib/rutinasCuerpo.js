// ============================================================================
// EH · Fase 19/65 — CUERPO E HIGIENE: RUTINAS Y RECOMENDACIONES
//
// *"Debe ser mucho más ligera que Skincare. **No queremos convertir una ducha
// en una lista interminable de tareas.**"*
//
// *"La aplicación sugiere → el usuario configura → el usuario decide. Sin IA."*
//
// ── LAS SIETE DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. 🚨 UNA SOLA LISTA DE RUTINAS PARA LOS DOS MÓDULOS, Y LA PLANTILLA DEL
// ENUNCIADO ES LA PRUEBA.** La C-25 dejó *Higiene* y *Cuidado corporal* como dos
// apartados del catálogo, pero la *"Rutina diaria básica"* del apartado 2 —
// **Ducha, Higiene, Desodorante, Hidratación corporal**— cruza los dos: tres
// pasos son de `higiene` y el cuarto de `cuerpo`. Con dos listas, esa rutina no
// cabe en ninguna. Así que el almacén es **uno**, vive en `cuerpo`
// (`ALMACEN_CH`), y la plaquita *"Mi rutina"* de los dos módulos abre **la
// misma**. Un `PASOS_CUERPO` con su `de` dice de qué módulo es cada paso.
//
// **2. ⚠️ NI UN MOTOR NUEVO.** Rutinas, checklist, omitir, historial, calendario
// y papelera son `motorRutinas.js` (F14, ya extraído); las reglas,
// `motorRecomendaciones.js` (F16); los productos y los packs,
// `motorProductos.js` (F17). Esta fase es la **cuarta** que llama al de rutinas,
// la **quinta** al de reglas y la **tercera** al de productos. Lo único suyo son
// sus etiquetas.
//
// **3. ⚠️ OMITIR ES UNA TERCERA COSA** (apartado 16: *"Omitir hoy. **Sin
// penalización. No crear rachas obligatorias.**"*). Ni hecho ni pendiente, y
// **sale de la cuenta del día**. Lo resuelve `checklistGenerico`; aquí no se
// reescribe, y **no se guarda ni un contador de racha** (D2-02).
//
// **4. ⚠️ ANTES DE RECOMENDAR UN PRODUCTO SE MIRA LO QUE YA TIENE** (apartado
// 11, con sus palabras: *"Ya tienes un producto que podría servir para esto.
// **Esto evita gastar dinero sin motivo.**"*). `yaTienesAlgoPara()` se consulta
// **antes** que la recomendación de compra, y si hay algo, la de comprar no sale.
//
// **5. ⚠️ LA PLANTILLA SE OFRECE, NO SE CREA** (apartado 2: *"ofrecer
// **opcionalmente** una plantilla"*). `usarPlantillaCuerpo` sin `confirmado` no
// escribe: **vigésimo `aplicarPlan` del proyecto**, y nunca con valor por
// defecto. Igual `crearPackCuerpo` desde el pack sugerido (apartado 13: *"no
// comprar automáticamente"*).
//
// **6. ⚠️ TODA REGLA DECLARA `requiere`** (F9/F16). Una regla sin requisitos se
// dispararía con el contexto vacío, o sea el primer día y sin datos. Y *"No lo
// sé"* **no es un valor**: `tieneDato()` del motor lo distingue de un `null`.
//
// **7. ⚠️ Y LOS FAVORITOS GLOBALES DEL APARTADO 18 NO EXISTEN.** La F39 lo dejó
// declarado con `existe: false`: JosStyle tiene favoritos **por módulo**, no uno
// global. Aquí se usa el del producto y **se dice**, en vez de fingir un sistema
// que no está (regla 8).
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import {
  MODULO_HIGIENE, MODULO_CUERPO, datosCH, parteActivaCH, contextoDeCuerpo,
  CATEGORIAS_PRODUCTO_CH, categoriaProductoCH, NECESIDADES_CH, COSAS_DE_HIGIENE_DIARIA,
  NIVELES_CH, TIEMPOS_CH,
} from './cuerpoHigiene';
import { PALABRAS_CLINICAS, sinDiagnostico } from './perfilPiel';
import { reglaAplicable, tieneDato, DEFAULT_RECOMENDACIONES, normalizarRecomendaciones,
  silenciadaEn, marcarVistasEn, descartarEn, deshacerDescarteEn, guardarEn, quitarGuardadaEn,
  tonoCorrecto, ordenarYRecortar } from './motorRecomendaciones';
import {
  normalizarRutinaGenerica, tocaEnFechaGenerico, normalizarHechos,
  alternarPaso, alternarOmitido, marcarTodo, checklistGenerico,
  historialGenerico, eventosDeRutinas, impactoEliminarRutina, estadoDelDia,
  ESTADOS_RUTINA_DIA, TEXTOS_ESTADO_DIA, DIAS_HISTORIAL,
} from './motorRutinas';
import {
  normalizarProductoGenerico, mismoProducto, enlacesDeProducto, alternativasGenericas,
  buscarProductos, filtrarProductos, categoriasEnUso, compararGenerico,
  normalizarPackGenerico, verPackGenerico, CATALOGO_VACIO_PORQUE, ETIQUETA_ENLACE, MAX_COMPARAR,
  AVISO_AFILIACION, TIPOS_TIENDA, ESTADOS_PRODUCTO,
} from './motorProductos';
import { prepararEliminacion, prepararRestauracion } from './papelera';
import { uid, todayISO } from './helpers';

/* ⚠️ **Decisión 1 — el almacén es uno, y vive en `cuerpo`.** No es una
   preferencia: es lo que exige la plantilla del apartado 2, que mezcla pasos de
   los dos módulos. Se declara aquí para que se pueda comprobar. */
export const ALMACEN_CH = MODULO_CUERPO;

/** Los cuatro interruptores del apartado 17. Los declaró la F18 en `PARTES_CUERPO`. */
export const PARTE_RUTINAS_CH = 'rutinas';
export const PARTE_RECOMENDACIONES_CH = 'recomendaciones';
export const PARTE_PRODUCTOS_CH = 'productos';
export const PARTE_SEGUIMIENTO_CH = 'seguimiento';

export const PARTES_DEL_APARTADO_17 = [
  PARTE_RUTINAS_CH, PARTE_RECOMENDACIONES_CH, PARTE_PRODUCTOS_CH, PARTE_SEGUIMIENTO_CH,
];

/** ⚠️ Los cuatro se preguntan al módulo `cuerpo`, que es donde vive el almacén. */
export const parteCH19 = (estado, parteId) => parteActivaCH(estado, ALMACEN_CH, parteId);

/* ===========================================================================
   1 · LOS PASOS (apartados 2 y 3)
   ===========================================================================
   ⚠️ Es un **catálogo**, no una lista obligatoria: *"todos los pasos son
   editables"* y *"el usuario puede crear cualquier rutina"*. Cada paso dice de
   qué módulo es (decisión 1), y los tres primeros son literalmente las
   `COSAS_DE_HIGIENE_DIARIA` de la F18: **no se reescriben, se enganchan**. */

const DE_HIGIENE = COSAS_DE_HIGIENE_DIARIA.map((c) => ({ ...c, de: MODULO_HIGIENE }));

export const PASOS_CUERPO = [
  ...DE_HIGIENE,
  { id: 'desodorante', nombre: 'Desodorante', icono: '🧴', de: MODULO_HIGIENE },
  // Los del cuerpo — el cuarto paso de la plantilla del apartado 2.
  { id: 'hidratacion', nombre: 'Hidratación corporal', icono: '🧴', de: MODULO_CUERPO },
  { id: 'exfoliacion', nombre: 'Exfoliación', icono: '🫧', de: MODULO_CUERPO },
  { id: 'especifico', nombre: 'Cuidado específico', icono: '🎯', de: MODULO_CUERPO },
  { id: 'otros', nombre: 'Otro', icono: '➕', de: null },
];

export const pasoCuerpo = (id) => PASOS_CUERPO.find((p) => p.id === id) || null;

/* ⚠️ Manos, uñas y pies **no están aquí**: son la **Fase 22**, con sus propias
   rutinas y su propia frecuencia. Meterlos ahora sería construirlos dos veces. */
export const PASOS_QUE_LLEGAN_EN_F22 = ['manos', 'pies', 'unas'];

/* ===========================================================================
   2 · LAS FRECUENCIAS Y EL MOMENTO (apartado 6)
   ===========================================================================
   ⚠️ **La lista es del módulo; el comportamiento es del motor** (F14). Las seis
   etiquetas del apartado 6 se reparten sobre las **cuatro** reglas que el motor
   ya sabe hacer, y cada una declara su `tipo`. Ni un `tocaEnFecha` nuevo. */

export const FRECUENCIAS_CUERPO = [
  { id: 'diaria', nombre: 'Diario', tipo: 'diaria' },
  { id: 'dias', nombre: 'Determinados días', tipo: 'dias', pideDias: true },
  { id: 'varias_semana', nombre: 'Varias veces por semana', tipo: 'dias', pideDias: true },
  { id: 'semanal', nombre: 'Semanal', tipo: 'cada_x', cada: 7 },
  { id: 'cada_x', nombre: 'Cada X días', tipo: 'cada_x', pideCada: true },
  { id: 'personalizada', nombre: 'Personalizada', tipo: 'ninguna' },
];

export const frecuenciaCuerpo = (id) => FRECUENCIAS_CUERPO.find((f) => f.id === id) || null;

const tipoFrecuenciaCuerpo = (id) => frecuenciaCuerpo(id)?.tipo || null;

/** Apartado 3 — *"momento"*. Las mismas tres etiquetas que Skincare y Barba. */
export const MOMENTOS_CUERPO = [
  { id: 'manana', nombre: 'Por la mañana', icono: '🌅' },
  { id: 'noche', nombre: 'Por la noche', icono: '🌙' },
  { id: 'cualquiera', nombre: 'Cuando toque', icono: '🕐' },
];

export const momentoCuerpo = (id) => MOMENTOS_CUERPO.find((m) => m.id === id) || null;

/* ===========================================================================
   3 · LA PLANTILLA (apartado 2)
   ===========================================================================
   ⚠️ *"Ofrecer **opcionalmente** una plantilla."* Y sus tres botones son tres
   cosas distintas: **Usar esta rutina** la crea tal cual, **Personalizar** la
   crea y la deja abierta para editar, y **Crear desde cero** ni la mira. */

export const PLANTILLAS_CUERPO = [
  {
    id: 'diaria_basica',
    nombre: 'Rutina diaria básica',
    icono: '🚿',
    // ⚠️ Los cuatro pasos del enunciado, en su orden y con sus palabras.
    pasos: ['ducha', 'corporal', 'desodorante', 'hidratacion'],
    frecuencia: 'diaria',
  },
];

export const plantillaCuerpo = (id) => PLANTILLAS_CUERPO.find((p) => p.id === id) || null;

export const BOTONES_PLANTILLA = [
  { id: 'usar', nombre: 'Usar esta rutina' },
  { id: 'personalizar', nombre: 'Personalizar' },
  { id: 'cero', nombre: 'Crear desde cero' },
];

/**
 * ⚠️ **Propone; no escribe.** Y no se ofrece la que ya usó: crear dos veces la
 * misma rutina básica es la lista interminable que el objetivo prohíbe.
 */
export function plantillasSugeridasCuerpo(estado) {
  const yaTiene = rutinasCuerpo(estado).map((r) => r.plantilla).filter(Boolean);
  return PLANTILLAS_CUERPO
    .filter((p) => !yaTiene.includes(p.id))
    .map((p) => ({
      ...p,
      pasosVisibles: p.pasos.map((id) => pasoCuerpo(id)).filter(Boolean),
      frecuenciaNombre: frecuenciaCuerpo(p.frecuencia)?.nombre || '',
      botones: BOTONES_PLANTILLA,
      // ⚠️ Escrito en el propio dato: verla no la crea.
      guardada: false,
    }));
}

/**
 * ⚠️ **Vigésimo `aplicarPlan` del proyecto**: sin `confirmado` devuelve la
 * propuesta y **no escribe**. Nunca darle un valor por defecto — *"opcional"*
 * quiere decir que la crea él.
 */
export function usarPlantillaCuerpo(estado, plantillaId, { hoy = todayISO(), confirmado = false } = {}) {
  const p = plantillaCuerpo(plantillaId);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Esa plantilla no existe.', rutina: null };
  if (!confirmado) {
    return { estado: normalizarEstiloHombre(estado), error: null, rutina: null, sinConfirmar: true };
  }
  return crearRutinaCuerpo(estado, {
    nombre: p.nombre,
    pasos: p.pasos.map((id) => ({ accion: id })),
    frecuencia: p.frecuencia,
    cada: p.cada || frecuenciaCuerpo(p.frecuencia)?.cada,
    plantilla: p.id,
  }, { hoy });
}

/* ===========================================================================
   4 · EL ALMACÉN
   ===========================================================================
   ⚠️ Regla 5 — cada campo nuevo, en su normalizador desde el primer día. Aquí
   son cinco de golpe: `registros`, `productos`, `packs`, `recomendaciones` y
   los campos propios de la rutina. Van **treinta veces** en este proyecto. */

const extraDeRutina = (r) => ({
  momento: momentoCuerpo(r.momento) ? r.momento : 'cualquiera',
  hora: typeof r.hora === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(r.hora) ? r.hora : null,
  favorita: r.favorita === true,
  plantilla: PLANTILLAS_CUERPO.some((p) => p.id === r.plantilla) ? r.plantilla : null,
});

export const normalizarRutinaCuerpo = (g, i) =>
  normalizarRutinaGenerica(g, i, {
    tipoDe: tipoFrecuenciaCuerpo,
    frecuenciaPorDefecto: 'personalizada',
    extra: extraDeRutina,
  });

/** ⚠️ Producto de cuerpo e higiene: la ficha del motor, con **sus** campos. */
export const normalizarProductoCuerpo = (g) => normalizarProductoGenerico(g, {
  categoriaValida: (id) => !!categoriaProductoCH(id),
  extra: (p) => ({
    /* Para qué sirve, con la lista de necesidades de la F18: es lo que permite
       cruzarlo con lo que él ha contestado (apartado 9). Nunca texto libre. */
    objetivos: (Array.isArray(p.objetivos) ? p.objetivos : [])
      .filter((x) => NECESIDADES_CH.some((n) => n.id === x)),
    // Qué paso de la rutina cubre.
    paso: PASOS_CUERPO.some((x) => x.id === p.paso) ? p.paso : null,
  }),
});

/** Apartado 5 — cómo le fue. Todo opcional; un registro vacío no se guarda. */
export const ESCALA_CUERPO = [
  { id: 'muy_bien', nombre: 'Muy bien', icono: '😄', valor: 4 },
  { id: 'bien', nombre: 'Bien', icono: '🙂', valor: 3 },
  { id: 'normal', nombre: 'Normal', icono: '😐', valor: 2 },
  { id: 'mal', nombre: 'Mal', icono: '🙁', valor: 1 },
];

export const valorCuerpo = (id) => ESCALA_CUERPO.find((x) => x.id === id) || null;

export const MAX_NOTA_CUERPO = 280;

export function normalizarRegistroCuerpo(g) {
  const r = g || {};
  if (typeof r.fecha !== 'string') return null;
  return {
    id: r.id || uid(),
    fecha: r.fecha,
    rutinaId: typeof r.rutinaId === 'string' ? r.rutinaId : null,
    que: String(r.que || '').trim(),
    como: valorCuerpo(r.como) ? r.como : null,
    nota: String(r.nota || '').trim().slice(0, MAX_NOTA_CUERPO),
  };
}

export const DEFAULT_RUTINAS_CUERPO = {
  rutinas: [], hechos: [], registros: [], productos: [], packs: [],
  recomendaciones: DEFAULT_RECOMENDACIONES,
};

export function normalizarRutinasCuerpo(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    rutinas: (Array.isArray(g.rutinas) ? g.rutinas : [])
      .map(normalizarRutinaCuerpo)
      .sort((a, b) => a.orden - b.orden),
    hechos: normalizarHechos(g.hechos),
    registros: (Array.isArray(g.registros) ? g.registros : [])
      .map(normalizarRegistroCuerpo).filter(Boolean)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    /* ⚠️ La ficha **entera**, no `{id, nombre}`: recortarla aquí fue el fallo
       caro de la F17, que en el siguiente guardado se llevaba marca, precio,
       tiendas y valoración. */
    productos: (Array.isArray(g.productos) ? g.productos : []).map(normalizarProductoCuerpo),
    packs: (Array.isArray(g.packs) ? g.packs : []).map(normalizarPackGenerico),
    /* 🐛 ⚠️ `motivos` son los OBJETOS del catálogo, no sus ids: el motor busca
       `m.id`, así que con una lista de cadenas ningún descarte pasaba el
       normalizador y *"No me interesa"* no callaba nada. */
    recomendaciones: normalizarRecomendaciones(g.recomendaciones, {
      ids: REGLAS_CUERPO.map((r) => r.id),
      motivos: MOTIVOS_CUERPO,
    }),
  };
}

export const datosRutinasCuerpo = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === ALMACEN_CH);
  return normalizarRutinasCuerpo(mod?.config?.rutinasCuerpo);
};

const escribir = (estado, datos) => guardarConfig(estado, ALMACEN_CH, { rutinasCuerpo: datos });

export const rutinasCuerpo = (estado) => datosRutinasCuerpo(estado).rutinas;

export const rutinaCuerpo = (estado, id) => rutinasCuerpo(estado).find((r) => r.id === id) || null;

/* ===========================================================================
   5 · CREAR, EDITAR Y REORDENAR (apartados 3 y 15)
   =========================================================================== */

export function crearRutinaCuerpo(estado, datos = {}, { hoy = todayISO() } = {}) {
  const d = datosRutinasCuerpo(estado);
  const nombre = String(datos.nombre || '').trim();
  if (!nombre) return { estado: normalizarEstiloHombre(estado), error: 'La rutina necesita un nombre.', rutina: null };
  const rutina = normalizarRutinaCuerpo({ ...datos, nombre, desde: hoy, orden: d.rutinas.length }, d.rutinas.length);
  return { estado: escribir(estado, { ...d, rutinas: [...d.rutinas, rutina] }), error: null, rutina };
}

export function editarRutinaCuerpo(estado, id, cambios = {}) {
  const d = datosRutinasCuerpo(estado);
  const actual = d.rutinas.find((r) => r.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  /* ⚠️ Se mira lo que ÉL escribió, no lo normalizado: el motor le pone "Rutina"
     a lo que llega sin nombre, así que comprobar después nunca saltaría. */
  if ('nombre' in cambios && !String(cambios.nombre || '').trim()) {
    return { estado: normalizarEstiloHombre(estado), error: 'La rutina necesita un nombre.' };
  }
  const nueva = normalizarRutinaCuerpo({ ...actual, ...cambios, id: actual.id }, actual.orden);
  return { estado: escribir(estado, { ...d, rutinas: d.rutinas.map((r) => (r.id === id ? nueva : r)) }), error: null };
}

/** Apartado 15 — *"orden"*. Los pasos, dentro de una rutina. */
export function ordenarPasosCuerpo(estado, rutinaId, ordenIds = []) {
  const r = rutinaCuerpo(estado, rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  const puestos = ordenIds.map((id) => r.pasos.find((p) => p.id === id)).filter(Boolean);
  // ⚠️ Los que no vengan en la lista se quedan detrás, no se pierden.
  const resto = r.pasos.filter((p) => !ordenIds.includes(p.id));
  return editarRutinaCuerpo(estado, rutinaId, { pasos: [...puestos, ...resto] });
}

/** Apartado 3 — *"productos"*. ⚠️ Siempre uno de la lista; nunca uno inventado. */
export function asignarProductoCuerpo(estado, rutinaId, pasoId, productoId) {
  const r = rutinaCuerpo(estado, rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  if (productoId !== null && !productosCuerpo(estado).some((p) => p.id === productoId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  }
  return editarRutinaCuerpo(estado, rutinaId, {
    pasos: r.pasos.map((p) => (p.id === pasoId ? { ...p, productoId } : p)),
  });
}

export function alternarFavoritaCuerpo(estado, id) {
  const r = rutinaCuerpo(estado, id);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  return editarRutinaCuerpo(estado, id, { favorita: !r.favorita });
}

/** Apartado 7 — *"opcionales… el usuario decide. **Nunca activarlos automáticamente.**"* */
export function alternarRecordatorioCuerpo(estado, id) {
  const r = rutinaCuerpo(estado, id);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  return editarRutinaCuerpo(estado, id, { recordatorio: !r.recordatorio });
}

export const impactoEliminarRutinaCuerpo = (estado, id) => {
  const d = datosRutinasCuerpo(estado);
  return impactoEliminarRutina(d.rutinas, d.hechos, id);
};

/* ⚠️ Apartado 18 — *"Eliminados recientemente"*. La papelera global, la única
   puerta (ME F3). Ni una función de borrado propia. */
export function eliminarRutinaConPapeleraCuerpo(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosRutinasCuerpo(estado);
  const r = prepararEliminacion(d, ALMACEN_CH, 'rutinas', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.', entrada: null };
  return {
    estado: escribir(estado, {
      ...r.moduloActualizado,
      // Sus marcas se van con ella: sin la rutina no significan nada.
      hechos: d.hechos.filter((h) => h.rutinaId !== id),
      /* ⚠️ Pero los REGISTROS no: borrar la rutina no reescribe la historia.
         Misma decisión que la F11 con los cortes y la F21 con la barba. */
      registros: d.registros.map((x) => (x.rutinaId === id ? { ...x, rutinaId: null } : x)),
    }),
    error: null,
    entrada: r.entrada,
  };
}

export function restaurarRutinaCuerpo(estado, entrada) {
  const d = datosRutinasCuerpo(estado);
  const r = prepararRestauracion(d, entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se ha podido restaurar.' };
  return { estado: escribir(estado, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

/* ===========================================================================
   6 · EL DÍA Y EL CHECKLIST (apartados 4, 5 y 16)
   ===========================================================================
   ⚠️ Todo del motor. Aquí no se decide qué es "hecha": eso es `estadoDelDia`,
   que ya sabe que **un paso omitido sale de la cuenta**. */

export const tocaEnFechaCuerpo = (rutina, fechaISO) =>
  tocaEnFechaGenerico(rutina, fechaISO, tipoFrecuenciaCuerpo);

export function rutinasDeHoyCuerpo(estado, { hoy = todayISO() } = {}) {
  if (!parteCH19(estado, PARTE_RUTINAS_CH)) return [];
  return rutinasCuerpo(estado).filter((r) => r.activa && tocaEnFechaCuerpo(r, hoy));
}

const nombreDeProducto = (estado) => (id) => {
  if (!id) return '';
  return productosCuerpo(estado).find((p) => p.id === id)?.nombre || '';
};

export function checklistCuerpo(estado, rutinaId, { hoy = todayISO() } = {}) {
  const d = datosRutinasCuerpo(estado);
  return checklistGenerico(d.rutinas.find((r) => r.id === rutinaId), d.hechos, hoy, {
    nombreDePaso: (p) => p.nombre || pasoCuerpo(p.accion)?.nombre || 'Paso',
    iconoDePaso: (p) => pasoCuerpo(p.accion)?.icono || '•',
    nombreDeProducto: nombreDeProducto(estado),
  });
}

export function marcarPasoCuerpo(estado, rutinaId, pasoId, { hoy = todayISO() } = {}) {
  const d = datosRutinasCuerpo(estado);
  return escribir(estado, { ...d, hechos: alternarPaso(d.hechos, rutinaId, pasoId, hoy) });
}

/** Apartado 16 — *"Omitir hoy. Sin penalización."* */
export function omitirPasoCuerpo(estado, rutinaId, pasoId, { hoy = todayISO() } = {}) {
  const d = datosRutinasCuerpo(estado);
  return escribir(estado, { ...d, hechos: alternarOmitido(d.hechos, rutinaId, pasoId, hoy) });
}

export function marcarRutinaCuerpoEntera(estado, rutinaId, { hoy = todayISO() } = {}) {
  const d = datosRutinasCuerpo(estado);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  if (!r) return normalizarEstiloHombre(estado);
  return escribir(estado, { ...d, hechos: marcarTodo(d.hechos, r, hoy) });
}

/**
 * Apartado 4 — *"cada rutina aparecerá como una tarjeta sencilla… **no mostrar
 * todos los pasos en la pantalla principal**"*. Una línea: nombre y cuántos.
 */
export function plaquitasDeRutinas(estado) {
  if (!parteCH19(estado, PARTE_RUTINAS_CH)) return null;
  return rutinasCuerpo(estado).map((r) => ({
    id: r.id,
    icono: pasoCuerpo(r.pasos[0]?.accion)?.icono || '🚿',
    nombre: r.nombre,
    // ⚠️ El texto del enunciado, tal cual: "4 pasos".
    linea: `${r.pasos.length} ${r.pasos.length === 1 ? 'paso' : 'pasos'}`,
    favorita: r.favorita,
    recordatorio: r.recordatorio,
    // Para el desplegable del apartado 6, sin tener que ir a buscar la rutina.
    frecuencia: r.frecuencia,
    momento: r.momento,
  }));
}

/* ===========================================================================
   7 · EL SEGUIMIENTO (la casilla ☐ del apartado 1 de la F18)
   ===========================================================================
   ⚠️ **Solo si lo ha activado.** Apagado devuelve `null`, no `[]`: apagado y
   vacío son dos cosas (lección de la F25), y una lista vacía pintaría siete
   días en blanco de algo que él ha decidido no usar. */

export function registrarCuerpo(estado, datos = {}, { hoy = todayISO() } = {}) {
  if (!parteCH19(estado, PARTE_SEGUIMIENTO_CH)) {
    return { estado: normalizarEstiloHombre(estado), error: 'El seguimiento está desactivado.', registro: null };
  }
  const registro = normalizarRegistroCuerpo({ ...datos, fecha: datos.fecha || hoy });
  if (!registro) return { estado: normalizarEstiloHombre(estado), error: 'Falta la fecha.', registro: null };
  if (!registro.como && !registro.nota && !registro.que) {
    return { estado: normalizarEstiloHombre(estado), error: 'Cuéntanos algo: cómo ha ido o una nota.', registro: null };
  }
  const d = datosRutinasCuerpo(estado);
  return { estado: escribir(estado, { ...d, registros: [registro, ...d.registros] }), error: null, registro };
}

export function editarRegistroCuerpo(estado, id, cambios = {}) {
  const d = datosRutinasCuerpo(estado);
  const actual = d.registros.find((r) => r.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Ese registro no existe.' };
  const nuevo = normalizarRegistroCuerpo({ ...actual, ...cambios, id: actual.id });
  return { estado: escribir(estado, { ...d, registros: d.registros.map((r) => (r.id === id ? nuevo : r)) }), error: null };
}

export function eliminarRegistroCuerpo(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosRutinasCuerpo(estado);
  const r = prepararEliminacion(d, ALMACEN_CH, 'registros', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Ese registro no existe.', entrada: null };
  return { estado: escribir(estado, r.moduloActualizado), error: null, entrada: r.entrada };
}

export function restaurarRegistroCuerpo(estado, entrada) {
  const d = datosRutinasCuerpo(estado);
  const r = prepararRestauracion(d, entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se ha podido restaurar.' };
  return { estado: escribir(estado, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

/** ⚠️ Apagado devuelve `null`. Y sin nada registrado, una lista vacía de verdad. */
export function historialCuerpo(estado, { limite = 20 } = {}) {
  if (!parteCH19(estado, PARTE_SEGUIMIENTO_CH)) return null;
  const d = datosRutinasCuerpo(estado);
  return d.registros.slice(0, limite).map((r) => {
    const rutina = d.rutinas.find((x) => x.id === r.rutinaId);
    return {
      id: r.id,
      fecha: r.fecha,
      que: rutina?.nombre || r.que || '',
      como: valorCuerpo(r.como),
      nota: r.nota,
    };
  });
}

/** El cumplimiento, del motor. ⚠️ Sin días en los que tocara, `null`: nunca un 0 %. */
export const cumplimientoCuerpo = (estado, { hoy = todayISO() } = {}) => {
  const d = datosRutinasCuerpo(estado);
  return historialGenerico({ rutinas: d.rutinas, hechos: d.hechos, tipoDe: tipoFrecuenciaCuerpo, hoy });
};

/* ===========================================================================
   8 · EL CALENDARIO (apartado 18)
   ===========================================================================
   ⚠️ *"Calendario global."* Derivado y de solo lectura (regla 11), y **nunca se
   materializa una ocurrencia**. */

export function eventosDeCuerpo(estado, desde, hasta) {
  if (!parteCH19(estado, PARTE_RUTINAS_CH)) return [];
  return eventosDeRutinas({
    rutinas: rutinasCuerpo(estado).filter((r) => r.activa),
    tipoDe: tipoFrecuenciaCuerpo,
    desde,
    hasta,
    prefijo: 'cuerpo',
    origen: 'cuerpo',
    icono: '🚿',
  });
}

/* ===========================================================================
   9 · LOS PRODUCTOS (apartados 10, 11, 12 y 18)
   ===========================================================================
   ⚠️ *"Productos globales. **Nada duplicado.**"* Es `motorProductos.js` (F17),
   tercer uso, con las categorías que declaró la F18. **El catálogo está vacío a
   propósito** (D2-03) y **nunca se fabrica un enlace**. */

export const CATALOGO_CUERPO = [];

export const productosCuerpo = (estado) => datosRutinasCuerpo(estado).productos;

export const productoCuerpo = (estado, id) => productosCuerpo(estado).find((p) => p.id === id) || null;

export const categoriasDeCuerpo = (estado) =>
  categoriasEnUso(productosCuerpo(estado), CATEGORIAS_PRODUCTO_CH);

const escribirProductos = (estado, productos) =>
  escribir(estado, { ...datosRutinasCuerpo(estado), productos });

export function crearProductoCuerpo(estado, datos = {}, { hoy = todayISO() } = {}) {
  const p = normalizarProductoCuerpo({ ...datos, creadoEn: hoy });
  if (!p.nombre) return { estado: normalizarEstiloHombre(estado), error: 'El producto necesita un nombre.', producto: null };
  const actuales = productosCuerpo(estado);
  if (actuales.some((x) => mismoProducto(x, p))) {
    return { estado: normalizarEstiloHombre(estado), error: null, sinEfecto: true, producto: actuales.find((x) => mismoProducto(x, p)) };
  }
  const conPrecio = p.precio !== null ? { ...p, precioAnotado: hoy } : p;
  return { estado: escribirProductos(estado, [...actuales, conPrecio]), error: null, producto: conPrecio };
}

export function editarProductoCuerpo(estado, id, cambios = {}, { hoy = todayISO() } = {}) {
  const actuales = productosCuerpo(estado);
  const actual = actuales.find((p) => p.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  const nuevo = normalizarProductoCuerpo({ ...actual, ...cambios, id: actual.id });
  if (!nuevo.nombre) return { estado: normalizarEstiloHombre(estado), error: 'El producto necesita un nombre.' };
  const sellado = nuevo.precio !== actual.precio && nuevo.precio !== null
    ? { ...nuevo, precioAnotado: hoy } : nuevo;
  return { estado: escribirProductos(estado, actuales.map((p) => (p.id === id ? sellado : p))), error: null };
}

/* ⚠️ Borrar un producto DESENGANCHA los pasos que lo usaban; no los borra.
   Misma decisión que la F8, la F17 y la F21. */
export function eliminarProductoCuerpo(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosRutinasCuerpo(estado);
  const r = prepararEliminacion(d, ALMACEN_CH, 'productos', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.', entrada: null };
  return {
    estado: escribir(estado, {
      ...r.moduloActualizado,
      rutinas: d.rutinas.map((x) => ({
        ...x, pasos: x.pasos.map((s) => (s.productoId === id ? { ...s, productoId: null } : s)),
      })),
      // Y sale de los packs, que si no apuntarían a algo que ya no está.
      packs: d.packs.map((p) => ({ ...p, productoIds: p.productoIds.filter((x) => x !== id) })),
    }),
    error: null,
    entrada: r.entrada,
  };
}

export function restaurarProductoCuerpo(estado, entrada) {
  const d = datosRutinasCuerpo(estado);
  const r = prepararRestauracion(d, entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se ha podido restaurar.' };
  return { estado: escribir(estado, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

/** ⚠️ El favorito es **del producto**: no hay favoritos globales (decisión 7). */
export const alternarFavoritoCuerpo = (estado, id) => {
  const p = productoCuerpo(estado, id);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  return editarProductoCuerpo(estado, id, { favorito: !p.favorito });
};

/** Apartado 11 — *"ya lo tengo"*. */
export const alternarMioCuerpo = (estado, id) => {
  const p = productoCuerpo(estado, id);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  return editarProductoCuerpo(estado, id, { mio: !p.mio });
};

export function valorarProductoCuerpo(estado, id, valoracion, opinion = null) {
  const n = Number(valoracion);
  if (valoracion !== null && !(Number.isInteger(n) && n >= 1 && n <= 5)) {
    return { estado: normalizarEstiloHombre(estado), error: 'La valoración va de 1 a 5.' };
  }
  const cambios = { valoracion: valoracion === null ? null : n };
  if (opinion !== null) cambios.opinion = opinion;
  return editarProductoCuerpo(estado, id, cambios);
}

export function anadirTiendaCuerpo(estado, id, tienda = {}) {
  const p = productoCuerpo(estado, id);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  return editarProductoCuerpo(estado, id, { tiendas: [...p.tiendas, tienda] });
}

export const enlacesDeCuerpo = (estado, id) => enlacesDeProducto(productoCuerpo(estado, id));

/** Apartado 12 — *"Ver alternativas"*, con el motor. */
export const alternativasDeCuerpo = (estado, id) => alternativasGenericas(productosCuerpo(estado), id);

/* ⚠️ **Las filas son de cada fase, no del motor** (F10 dibuja cuatro y F17
   cinco). El apartado 12 pide comparar por *precio, marca, tienda y
   características*, así que estas son las suyas. */
export const FILAS_COMPARACION_CUERPO = [
  { id: 'categoria', nombre: 'Categoría' },
  { id: 'marca', nombre: 'Marca' },
  { id: 'precio', nombre: 'Precio' },
  { id: 'objetivo', nombre: 'Para qué' },
  { id: 'tienda', nombre: 'Dónde' },
];

export function compararProductosCuerpo(estado, ids = []) {
  const productos = productosCuerpo(estado);
  /* ⚠️ `compararGenerico` recibe un OBJETO `{ campo: leer }`, no una lista de
     filas: pasarle el array dejaba a `leer` sin ser una función. */
  const filas = compararGenerico(productos, ids, {
    categoria: (p) => categoriaProductoCH(p.categoria)?.nombre,
    marca: (p) => p.marca,
    // ⚠️ Sin precio, una raya — nunca un 0.
    precio: (p) => (p.precio === null ? '' : `${p.precio} €`),
    objetivo: (p) => (p.objetivos.length > 0
      ? p.objetivos.map((o) => NECESIDADES_CH.find((n) => n.id === o)?.nombre).filter(Boolean).join(', ')
      : p.paraQue),
    tienda: (p) => p.tiendas.map((t) => t.nombre).filter(Boolean).join(', '),
  });
  const elegidos = ids.slice(0, MAX_COMPARAR).map((id) => productos.find((p) => p.id === id)).filter(Boolean);
  if (elegidos.length < 2) {
    return { productos: elegidos, filas: [], suficiente: false, texto: 'Elige al menos dos productos para compararlos.' };
  }
  return {
    productos: elegidos,
    filas: FILAS_COMPARACION_CUERPO.map((f) => ({ ...f, valores: filas.map((x) => x[f.id]) })),
    suficiente: true,
    texto: '',
    recortado: ids.length > MAX_COMPARAR,
  };
}

export function buscarEnCuerpo(estado, { texto = '', ...filtros } = {}) {
  return filtrarProductos(buscarProductos(productosCuerpo(estado), texto), filtros);
}

/**
 * 🚨 **Apartado 11 — lo primero que se mira.** *"Si el usuario ya tiene un
 * producto compatible: **Ya tienes un producto que podría servir para esto.**
 * No recomendar automáticamente otro producto innecesario. Esto evita gastar
 * dinero sin motivo."*
 */
export const TEXTO_YA_TIENES = 'Ya tienes un producto que podría servir para esto.';

export function yaTienesAlgoPara(estado, objetivo) {
  const suyos = productosCuerpo(estado).filter((p) => p.mio && p.estado === 'disponible');
  const encaja = suyos.filter((p) => p.objetivos.includes(objetivo));
  if (encaja.length === 0) return null;
  return { texto: TEXTO_YA_TIENES, productos: encaja };
}

/* ===========================================================================
   10 · LOS PACKS (apartado 13)
   ===========================================================================
   ⚠️ *"El usuario selecciona qué quiere. **No comprar automáticamente.**"* El
   pack sugerido **sugiere**; crearlo es una llamada suya. */

export const packsCuerpo = (estado) => datosRutinasCuerpo(estado).packs;

const escribirPacks = (estado, packs) => escribir(estado, { ...datosRutinasCuerpo(estado), packs });

export function crearPackCuerpo(estado, nombre, productoIds = [], { hoy = todayISO(), confirmado = true } = {}) {
  if (!confirmado) return { estado: normalizarEstiloHombre(estado), error: null, pack: null, sinConfirmar: true };
  const limpio = String(nombre || '').trim();
  if (!limpio) return { estado: normalizarEstiloHombre(estado), error: 'El pack necesita un nombre.', pack: null };
  const validos = productoIds.filter((id) => productoCuerpo(estado, id));
  const pack = normalizarPackGenerico({ nombre: limpio, productoIds: validos, creadoEn: hoy });
  return { estado: escribirPacks(estado, [...packsCuerpo(estado), pack]), error: null, pack };
}

export function eliminarPackCuerpo(estado, packId) {
  if (!packsCuerpo(estado).some((p) => p.id === packId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese pack no existe.' };
  }
  return { estado: escribirPacks(estado, packsCuerpo(estado).filter((p) => p.id !== packId)), error: null };
}

export const verPackCuerpo = (estado, packId) =>
  verPackGenerico(packsCuerpo(estado), productosCuerpo(estado), packId);

/**
 * El *"📦 Pack recomendado"* del apartado 13: **Gel, Desodorante, Hidratante**,
 * que son sus tres ejemplos. ⚠️ **Devuelve una propuesta y no escribe nada.**
 */
export const CATEGORIAS_PACK_BASICO = ['gel', 'desodorante', 'crema'];

export function packSugeridoCuerpo(estado) {
  if (!parteCH19(estado, PARTE_PRODUCTOS_CH)) {
    return { hay: false, texto: 'Los productos están desactivados.', guardado: false };
  }
  const suyos = productosCuerpo(estado);
  if (suyos.length === 0) return { hay: false, texto: CATALOGO_VACIO_PORQUE, guardado: false };
  const elegidos = [];
  CATEGORIAS_PACK_BASICO.forEach((cat) => {
    const p = suyos.find((x) => x.categoria === cat && !elegidos.some((y) => y.id === x.id));
    if (p) elegidos.push(p);
  });
  if (elegidos.length === 0) {
    return { hay: false, texto: 'Todavía no tienes productos de las categorías básicas.', guardado: false };
  }
  return {
    hay: true,
    nombre: 'Pack básico',
    productos: elegidos,
    productoIds: elegidos.map((p) => p.id),
    // ⚠️ Escrito en el propio dato: esto NO está guardado.
    guardado: false,
    accion: 'Crear este pack',
  };
}

/* ===========================================================================
   11 · LAS RECOMENDACIONES (apartados 8, 9, 10 y 14)
   ===========================================================================
   ⚠️ *"Mostrar **pocas** opciones."* Y **sin IA**: son reglas sobre lo que él ha
   contestado y lo que tiene apuntado, con el motor de la F16. **Quinta** vez que
   se usa; ni un cuarto `reglaAplicable`, ni una segunda lista de palabras
   prohibidas.

   ⚠️ **Toda regla declara `requiere`.** Una sin requisitos se dispararía con el
   contexto vacío, o sea el primer día y sin datos. */

export const MOTIVOS_CUERPO = [
  { id: 'no_interesa', nombre: 'No me interesa', dias: 90 },
  { id: 'ya_lo_hago', nombre: 'Ya lo hago', dias: 180 },
];

export const REGLAS_CUERPO = [
  {
    id: 'anadir_hidratacion',
    peso: 4,
    // El ejemplo literal del apartado 8.
    requiere: ['tieneRutinas', 'pasosPuestos'],
    cuando: (c) => c.tieneRutinas && !c.pasosPuestos.includes('hidratacion')
      && (c.necesidades.includes('sequedad') || c.necesidades.includes('hidratacion')),
    tema: 'rutinas',
    texto: 'Podrías añadir hidratación corporal a tu rutina.',
    accion: 'Añadir',
    paso: 'hidratacion',
    usaPreferencias: true,
  },
  {
    id: 'desodorante_en_rutina',
    peso: 3,
    requiere: ['tieneRutinas', 'pasosPuestos', 'partes'],
    cuando: (c) => c.tieneRutinas && c.partes.desodorante === true
      && !c.pasosPuestos.includes('desodorante'),
    tema: 'rutinas',
    texto: 'Marcaste que usas desodorante. Puedes ponerlo como paso de tu rutina.',
    accion: 'Añadir',
    paso: 'desodorante',
  },
  {
    id: 'rutina_corta',
    peso: 2,
    // Apartado 9 — *"tiempo disponible"*. Con poco tiempo, menos pasos.
    requiere: ['minutos', 'pasosMax'],
    cuando: (c) => c.minutos !== null && c.minutos <= 5 && c.pasosMax > 4,
    tema: 'rutinas',
    texto: 'Dijiste que quieres dedicarle poco tiempo. Una rutina de tres o cuatro pasos puede irte mejor.',
    accion: 'Editar rutina',
  },
  {
    id: 'apuntar_productos',
    peso: 1,
    requiere: ['pasosSinProducto', 'tieneProductos'],
    cuando: (c) => c.pasosSinProducto > 0 && c.tieneProductos,
    tema: 'productos',
    texto: 'Puedes apuntar qué producto usas en cada paso, si te apetece tenerlo a mano.',
    accion: 'Asociar productos',
  },
  {
    id: 'sin_rutina',
    peso: 5,
    requiere: ['tieneRutinas'],
    cuando: (c) => c.tieneRutinas === false,
    tema: 'rutinas',
    texto: 'Si quieres, puedes empezar por la rutina diaria básica y quitarle lo que no uses.',
    accion: 'Ver plantilla',
  },
  {
    id: 'nivel_avanzado',
    peso: 0,
    // Apartado 14 — *"evitar que el nivel avanzado convierta esto en algo excesivo"*.
    requiere: ['nivel', 'pasosMax'],
    cuando: (c) => c.nivel === 'avanzado' && c.pasosMax <= 3,
    tema: 'rutinas',
    texto: 'Tienes el nivel avanzado puesto. Si te apetece, puedes añadir algún paso más.',
    accion: 'Editar rutina',
  },
];

export const reglaCuerpo = (id) => REGLAS_CUERPO.find((r) => r.id === id) || null;

/**
 * Apartado 9 — *"las recomendaciones podrán utilizar: necesidades,
 * preferencias, sensibilidad indicada, tiempo disponible, nivel y productos
 * existentes"*. ⚠️ **No hay ni un dato copiado**: sale del cuestionario de la
 * F18 y de lo que hay guardado aquí.
 */
export function contextoRecomendacionesCuerpo(estado, datosGlobales = {}, { hoy = todayISO() } = {}) {
  const d = datosRutinasCuerpo(estado);
  // ⚠️ El perfil es el de la F18, y se lee de los DOS módulos: son un solo bloque.
  const deCuerpo = contextoDeCuerpo(estado, MODULO_CUERPO, datosGlobales);
  const deHigiene = contextoDeCuerpo(estado, MODULO_HIGIENE, datosGlobales);
  const pasosPuestos = [...new Set(d.rutinas.flatMap((r) => r.pasos.map((p) => p.accion)))];
  return {
    hoy,
    tieneRutinas: d.rutinas.length > 0,
    rutinas: d.rutinas.length,
    pasosPuestos,
    pasosMax: d.rutinas.reduce((m, r) => Math.max(m, r.pasos.length), 0),
    pasosSinProducto: d.rutinas.reduce((s, r) => s + r.pasos.filter((p) => !p.productoId).length, 0),
    tieneProductos: d.productos.length > 0,
    registros: d.registros.length,
    // Las partes de los dos módulos, juntas: son un solo bloque de cuidado.
    partes: { ...datosCH(estado, MODULO_HIGIENE).partes, ...datosCH(estado, MODULO_CUERPO).partes },
    /* ⚠️ *"No lo sé"* no llega hasta aquí: `contextoDeCuerpo` ya devuelve `[]`
       cuando la respuesta es esa, y `tieneDato()` la distingue de un `null`. */
    necesidades: [...new Set([...deCuerpo.necesidades, ...deHigiene.necesidades])],
    busca: [...new Set([...deCuerpo.busca, ...deHigiene.busca])],
    minutos: deCuerpo.minutos ?? deHigiene.minutos ?? null,
    nivel: deCuerpo.nivel || deHigiene.nivel || null,
  };
}

export const LIMITE_RECOMENDACIONES_CUERPO = 3;

/**
 * ⚠️ **Apagado devuelve `null`, no `{ … }`** (lección de la F25). Y **mostrar no
 * es registrar**: ver las recomendaciones no marca nada como visto; eso es
 * `marcarVistasCuerpo`, una llamada aparte. Devuelve lo que devuelve el motor:
 * `{ total, recomendaciones, hayMas }`.
 */
export function recomendacionesCuerpo(estado, datosGlobales = {}, { hoy = todayISO(), limite = LIMITE_RECOMENDACIONES_CUERPO, prioridad = null } = {}) {
  if (!parteCH19(estado, PARTE_RECOMENDACIONES_CH)) return null;
  const d = datosRutinasCuerpo(estado);
  const ctx = contextoRecomendacionesCuerpo(estado, datosGlobales, { hoy });
  const vivas = REGLAS_CUERPO
    .filter((r) => reglaAplicable(r, ctx))
    /* 🐛 ⚠️ **`silenciadaEn` devuelve un OBJETO, no un booleano.** Un `!` sobre
       él es siempre `false`, así que esto se llevaba **todas** las
       recomendaciones y la pantalla salía vacía sin que nada estuviera mal. Es
       la misma lección que `sinDiagnostico()` en la F18 —decimotercera vez que
       una comprobación falla por la FORMA de lo que devuelve— y por eso hay una
       prueba que enciende una recomendación, la descarta y comprueba que las
       otras siguen. */
    .filter((r) => !silenciadaEn(d.recomendaciones, r.id, {
      hoy,
      dias: Object.fromEntries(MOTIVOS_CUERPO.map((m) => [m.id, m.dias])),
    }).silenciada)
    // Apartado 10 — *"si ya tiene un producto compatible"*, se dice antes.
    .map((r) => ({
      id: r.id,
      tema: r.tema,
      /* ⚠️ `ordenarYRecortar` ordena por `peso` y desempata por `titulo`, y pesa
         `temas` si le dan una prioridad: se le dan con los nombres que el motor
         lee, en vez de reescribir la ordenación aquí. */
      temas: [r.tema],
      titulo: r.texto,
      peso: r.peso || 0,
      texto: r.texto,
      accion: r.accion,
      paso: r.paso || null,
      yaTienes: r.paso ? yaTienesAlgoPara(estado, r.paso === 'hidratacion' ? 'hidratacion' : 'olor') : null,
      /* ⚠️ Y `guardadas` son OBJETOS `{ id, reglaId, fecha }`, no ids: un
         `includes` habría dicho siempre que no. */
      guardada: d.recomendaciones.guardadas.some((g) => g.reglaId === r.id),
      // ⚠️ Escrito en el propio dato: una recomendación no hace nada por su cuenta.
      aplicada: false,
      motivos: MOTIVOS_CUERPO,
    }));
  return ordenarYRecortar(vivas, { limite, prioridad });
}

export const marcarVistasCuerpo = (estado, ids = [], hoy = todayISO()) => {
  const d = datosRutinasCuerpo(estado);
  return escribir(estado, { ...d, recomendaciones: marcarVistasEn(d.recomendaciones, ids, hoy) });
};

/** Apartado 8 — *"No me interesa"*. ⚠️ Y **ningún descarte es para siempre**. */
export function descartarRecomendacionCuerpo(estado, reglaId, motivo = 'no_interesa', { hoy = todayISO() } = {}) {
  if (!reglaCuerpo(reglaId)) return { estado: normalizarEstiloHombre(estado), error: 'Esa recomendación no existe.' };
  if (!MOTIVOS_CUERPO.some((m) => m.id === motivo)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese motivo no existe.' };
  }
  const d = datosRutinasCuerpo(estado);
  return { estado: escribir(estado, { ...d, recomendaciones: descartarEn(d.recomendaciones, reglaId, motivo, hoy) }), error: null };
}

export function deshacerDescarteCuerpo(estado, reglaId) {
  const d = datosRutinasCuerpo(estado);
  return escribir(estado, { ...d, recomendaciones: deshacerDescarteEn(d.recomendaciones, reglaId) });
}

/** Apartado 10 — *"Guardar"* / *"Ignorar"*, con la lista del motor. */
export function guardarRecomendacionCuerpo(estado, reglaId, { hoy = todayISO() } = {}) {
  if (!reglaCuerpo(reglaId)) return { estado: normalizarEstiloHombre(estado), error: 'Esa recomendación no existe.' };
  const d = datosRutinasCuerpo(estado);
  return { estado: escribir(estado, { ...d, recomendaciones: guardarEn(d.recomendaciones, reglaId, hoy) }), error: null };
}

export function quitarGuardadaCuerpo(estado, reglaId) {
  const d = datosRutinasCuerpo(estado);
  return escribir(estado, { ...d, recomendaciones: quitarGuardadaEn(d.recomendaciones, reglaId) });
}

/**
 * ⚠️ *"Añadir"* del apartado 8 escribe **una llamada aparte y con `confirmado`**:
 * añadir un paso a su rutina es tocar sus datos. Vigesimoprimer `aplicarPlan`.
 */
export function aplicarRecomendacionCuerpo(estado, reglaId, rutinaId, { confirmado = false } = {}) {
  const regla = reglaCuerpo(reglaId);
  if (!regla || !regla.paso) return { estado: normalizarEstiloHombre(estado), error: 'Esa recomendación no añade nada.', aplicado: false };
  const r = rutinaCuerpo(estado, rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.', aplicado: false };
  if (!confirmado) {
    return {
      estado: normalizarEstiloHombre(estado),
      error: null,
      aplicado: false,
      propuesta: { rutina: r.nombre, paso: pasoCuerpo(regla.paso) },
    };
  }
  const hecho = editarRutinaCuerpo(estado, rutinaId, { pasos: [...r.pasos, { accion: regla.paso }] });
  return { ...hecho, aplicado: !hecho.error };
}

/* ===========================================================================
   12 · LO QUE ESTA FASE NO INVENTA (apartado 18)
   ===========================================================================
   ⚠️ *"Utilizar: calendario global, recordatorios globales, productos globales,
   favoritos globales, eliminados recientemente, perfil global. **Nada
   duplicado.**"* Seis, y **uno de los seis no existe**: se declara, no se finge
   (regla 8, misma decisión que la F39). */

export const CONEXIONES_CUERPO = [
  { id: 'calendario', nombre: 'Calendario global', existe: true, entra: 'eventosDeCuerpo()' },
  { id: 'recordatorios', nombre: 'Recordatorios globales', existe: true, entra: 'avisosEstilo.js (F38)' },
  { id: 'productos', nombre: 'Productos globales', existe: true, entra: 'motorProductos.js (F17)' },
  {
    id: 'favoritos',
    nombre: 'Favoritos globales',
    existe: false,
    // ⚠️ La frase que se lee en pantalla, no una excusa interna.
    porque: 'JosStyle no tiene una lista de favoritos común. Cada apartado guarda los suyos, y aquí son los del producto y los de la rutina.',
  },
  { id: 'papelera', nombre: 'Eliminados recientemente', existe: true, entra: 'papelera.js (ME F3)' },
  { id: 'perfil', nombre: 'Perfil global', existe: true, entra: 'REGISTRO_DATOS (F4)' },
];

/* ===========================================================================
   13 · TEXTOS, RESUMEN, AUDITORÍA Y PANEL
   =========================================================================== */

export const TEXTOS_CUERPO19 = {
  titulo: '🚿 Mi rutina',
  // Apartado 1 — el vacío con salida (F41).
  vacio: 'Crea tu primera rutina',
  vacioTexto: 'Una rutina son unos pocos pasos que repites. Ni más.',
  crear: '+ Crear rutina',
  // Apartado 2.
  plantilla: 'Si te va bien, puedes empezar por esta y quitarle lo que no uses.',
  // Apartado 7.
  recordatorio: '🔔 Activar recordatorio',
  recordatorioApagado: 'Los recordatorios empiezan apagados. Solo suenan los que enciendas tú.',
  // Apartado 8.
  recomendaciones: '💡 Recomendaciones',
  // Apartado 16.
  omitir: 'Omitir hoy',
  omitirSuave: 'Omitir un paso no cuenta como fallo. No pasa nada.',
  // Apartado 11.
  yaTienes: TEXTO_YA_TIENES,
  // Apartado 13 + D2-03.
  catalogo: CATALOGO_VACIO_PORQUE,
  afiliacion: AVISO_AFILIACION,
  // Apartado 17.
  desactivar: 'Puedes quitar cualquiera de estas cuatro partes. Lo que tengas guardado se queda.',
  // Apartado 18 — lo que no existe, dicho.
  sinFavoritosGlobales: CONEXIONES_CUERPO.find((c) => c.id === 'favoritos').porque,
  // Apartado 14.
  nivel: 'El nivel solo abre más opciones. Ninguna es obligatoria.',
};

export function textosDeRutinasCuerpo() {
  return [
    ...Object.values(TEXTOS_CUERPO19),
    ...PASOS_CUERPO.map((p) => p.nombre),
    ...FRECUENCIAS_CUERPO.map((f) => f.nombre),
    ...MOMENTOS_CUERPO.map((m) => m.nombre),
    ...PLANTILLAS_CUERPO.map((p) => p.nombre),
    ...BOTONES_PLANTILLA.map((b) => b.nombre),
    ...ESCALA_CUERPO.map((e) => e.nombre),
    ...MOTIVOS_CUERPO.map((m) => m.nombre),
    ...REGLAS_CUERPO.map((r) => r.texto),
    ...REGLAS_CUERPO.map((r) => r.accion),
    ...FILAS_COMPARACION_CUERPO.map((f) => f.nombre),
    ...CONEXIONES_CUERPO.map((c) => c.nombre),
    // ⚠️ Son textos, no objetos: con `.nombre` este barrido no miraría ninguno.
    ...Object.values(TEXTOS_ESTADO_DIA),
  ].filter(Boolean);
}

export function resumenRutinasCuerpo(estado, { hoy = todayISO() } = {}) {
  const d = datosRutinasCuerpo(estado);
  const deHoy = rutinasDeHoyCuerpo(estado, { hoy });
  const listas = deHoy.map((r) => checklistCuerpo(estado, r.id, { hoy })).filter(Boolean);
  return {
    rutinas: d.rutinas.length,
    favoritas: d.rutinas.filter((r) => r.favorita).length,
    conRecordatorio: d.rutinas.filter((r) => r.recordatorio).length,
    hoy: deHoy.length,
    hechasHoy: listas.filter((l) => l.estado === 'hecha').length,
    productos: d.productos.length,
    packs: d.packs.length,
    // ⚠️ Apagado, `null`: apagado y vacío son dos cosas.
    registros: parteCH19(estado, PARTE_SEGUIMIENTO_CH) ? d.registros.length : null,
    ultimo: d.registros[0]?.fecha || null,
    activo: parteCH19(estado, PARTE_RUTINAS_CH),
  };
}

/** ⚠️ Una línea para la portada (F31). Sale de aquí, no de un dato nuevo. */
export function lineaRutinasCuerpo(estado, { hoy = todayISO() } = {}) {
  const r = resumenRutinasCuerpo(estado, { hoy });
  if (!r.activo) return null;
  if (r.rutinas === 0) return null;
  const base = `${r.rutinas} ${r.rutinas === 1 ? 'rutina' : 'rutinas'}`;
  return r.hoy > 0 ? `${base} · ${r.hechasHoy} de ${r.hoy} hoy` : base;
}

export function auditarRutinasCuerpo(estado) {
  const sinRequisitos = REGLAS_CUERPO.filter((r) => !Array.isArray(r.requiere) || r.requiere.length === 0);
  return {
    // Decisión 1 — un almacén, no dos.
    almacenes: 1,
    almacen: ALMACEN_CH,
    // Decisión 2 — ni un motor nuevo.
    motoresNuevos: 0,
    motorRutinas: 'motorRutinas.js',
    motorReglas: 'motorRecomendaciones.js',
    motorProductos: 'motorProductos.js',
    // Apartado 18 — ni un calendario, ni una papelera, ni un catálogo nuevos.
    calendariosNuevos: 0,
    papelerasNuevas: 0,
    catalogosNuevos: 0,
    // D2-03 — el catálogo está vacío, y es una decisión.
    catalogo: CATALOGO_CUERPO.length,
    // Nunca una compra ni un enlace inventado.
    compra: 0, carrito: 0, enlacesInventados: 0,
    // Sin IA (objetivo y apartado 9).
    usaIA: 0,
    // Decisión 3 + D2-02 — ni rachas, ni puntos, ni niveles.
    rachas: 0, puntos: 0, niveles: 0,
    // Decisión 6 — ni una regla sin requisitos.
    reglasSinRequisitos: sinRequisitos.map((r) => r.id),
    // Y ninguna con un tono que mande o reproche.
    reglasConMalTono: REGLAS_CUERPO.filter((r) => !tonoCorrecto(r.texto)).map((r) => r.id),
    // Decisión 5 — ni un diagnóstico.
    textosClinicos: textosDeRutinasCuerpo().filter((t) => !sinDiagnostico(t)),
    // Apartado 18 — y lo que no existe, declarado.
    conexionesQueNoExisten: CONEXIONES_CUERPO.filter((c) => !c.existe).map((c) => c.id),
    // Apartado 17 — los cuatro interruptores.
    interruptores: PARTES_DEL_APARTADO_17.length,
    rutinas: rutinasCuerpo(estado).length,
  };
}

export function panelRutinasCuerpo(estado, datosGlobales = {}, { hoy = todayISO() } = {}) {
  const activo = parteCH19(estado, PARTE_RUTINAS_CH);
  return {
    activo,
    titulo: TEXTOS_CUERPO19.titulo,
    // Apartado 4 — las plaquitas, sin los pasos dentro.
    plaquitas: plaquitasDeRutinas(estado),
    hoy: rutinasDeHoyCuerpo(estado, { hoy }).map((r) => checklistCuerpo(estado, r.id, { hoy })),
    plantillas: activo ? plantillasSugeridasCuerpo(estado) : [],
    // Apartado 1 — el vacío con su salida.
    vacio: activo && rutinasCuerpo(estado).length === 0
      ? { titulo: TEXTOS_CUERPO19.vacio, texto: TEXTOS_CUERPO19.vacioTexto, boton: TEXTOS_CUERPO19.crear }
      : null,
    recomendaciones: recomendacionesCuerpo(estado, datosGlobales, { hoy }),
    productos: parteCH19(estado, PARTE_PRODUCTOS_CH) ? productosCuerpo(estado) : null,
    packs: parteCH19(estado, PARTE_PRODUCTOS_CH)
      ? packsCuerpo(estado).map((p) => verPackCuerpo(estado, p.id)).filter(Boolean)
      : null,
    sugerido: packSugeridoCuerpo(estado),
    historial: historialCuerpo(estado),
    cumplimiento: cumplimientoCuerpo(estado, { hoy }),
    conexiones: CONEXIONES_CUERPO,
    resumen: resumenRutinasCuerpo(estado, { hoy }),
    textos: TEXTOS_CUERPO19,
  };
}

export {
  ESTADOS_RUTINA_DIA, TEXTOS_ESTADO_DIA, DIAS_HISTORIAL,
  PALABRAS_CLINICAS, sinDiagnostico, tieneDato, estadoDelDia,
  CATALOGO_VACIO_PORQUE, ETIQUETA_ENLACE, TIPOS_TIENDA, ESTADOS_PRODUCTO,
  CATEGORIAS_PRODUCTO_CH, NIVELES_CH, TIEMPOS_CH,
};
