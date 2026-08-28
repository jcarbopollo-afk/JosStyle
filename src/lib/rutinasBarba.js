// ============================================================================
// EH · Fase 21/65 — BARBA Y AFEITADO: RUTINAS Y SEGUIMIENTO
//
// *"Ahora convertimos el perfil de la fase anterior en algo realmente
// utilizable… pero siempre de forma opcional y sencilla."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ TODO ESTO YA EXISTE.** Rutinas, plantillas, checklist, omitir,
// historial, calendario y papelera los construyeron F8 y F14, y `motorRutinas.js`
// los tiene extraídos desde F14 precisamente para esto. Esta fase **llama**: sus
// tres plantillas, sus etiquetas de frecuencia y sus cuatro aspectos son lo
// único suyo. Si algún día hace falta un cuarto módulo con rutinas, llama ahí.
//
// **2. ⚠️ OMITIR ES UNA TERCERA COSA** (apartado 7: *"Omitir hoy. **Sin
// penalización**"*). Ni hecho ni pendiente, y **sale de la cuenta del día**: una
// rutina de cuatro pasos con uno omitido y tres hechos está HECHA. Lo resuelve
// `checklistGenerico`, y esto no lo reescribe.
//
// **3. ⚠️ EL PERFILADO NO ES UNA CUARTA COSA: ES UNA RUTINA.** El apartado 4
// pide *"un apartado específico ✂️ Perfilado"* con cuatro frecuencias, y las
// cuatro son las que ya sabe hacer el motor (`cada_x` y `dias`). Un segundo
// mecanismo de "cada cuánto" habría sido el tercero del proyecto, después de
// `frecuenciaDeCorte()` y `frecuenciaDeAfeitado()`.
//
// **4. ⚠️ NUNCA UN SEGUNDO CALENDARIO** (apartado 14, con esas palabras: *"debe
// aparecer en el calendario general. **No crear un calendario de barba**"*).
// `eventosDeBarba()` deriva del motor y devuelve la misma forma de evento que el
// Armario y que Skincare. Y **nunca se materializa una ocurrencia** (regla 11).
//
// **5. ⚠️ NI UNA PAPELERA PROPIA** (apartado 19). Eliminar una rutina o un
// registro pasa por `papelera.js`, que ya existe: dos líneas de catálogo, y ni
// una función nueva. Cuarta vez que un módulo entra ahí sin tocar el motor.
//
// **6. ⚠️ Y LAS SUGERENCIAS NO DIAGNOSTICAN** (apartado 15: *"no recomendar
// tratamientos médicos"*). Son tres reglas sobre lo que él ha registrado, cada
// una con su `requiere` —`motorRecomendaciones.js`, de F16—, y una prueba barre
// sus textos con `PALABRAS_CLINICAS`.
//
// ⚠️ **Lo único que esta fase guarda de nuevo son los registros del apartado 9:**
// cómo fue, cuatro valoraciones de 1 a 5 y una nota. Todo lo demás —cuántas
// veces se ha hecho, cada cuánto toca, qué productos usa— **se deriva**.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { MODULO_BARBA, datosBarba, parteActivaBarba, productosDeBarba, catalogoParaBarba } from './perfilBarba';
import { PALABRAS_CLINICAS, sinDiagnostico } from './perfilPiel';
import { reglaAplicable } from './motorRecomendaciones';
import {
  normalizarRutinaGenerica, tocaEnFechaGenerico, normalizarHechos,
  alternarPaso, alternarOmitido, marcarTodo, checklistGenerico,
  historialGenerico, eventosDeRutinas, impactoEliminarRutina, estadoDelDia,
  ESTADOS_RUTINA_DIA, TEXTOS_ESTADO_DIA, DIAS_HISTORIAL,
} from './motorRutinas';
import { prepararEliminacion, prepararRestauracion } from './papelera';
import { uid, todayISO } from './helpers';

/* ⚠️ **El interruptor es `rutinas`, no `afeitado`.** Colgarlo del afeitado dejó
   sin rutinas a quien solo gestiona la barba, y el apartado 3 pide justo lo
   contrario: *"RUTINA DE BARBA: si tiene barba, 🧔 Cuidado de barba"*. */
export const PARTE_RUTINAS_BARBA = 'rutinas';
export const PARTE_SEGUIMIENTO_BARBA = 'seguimiento';

/* ===========================================================================
   1 · LOS PASOS (apartados 2 y 3)
   ===========================================================================
   ⚠️ *"El usuario puede eliminar cualquier paso"* (apartado 2) y *"no imponer
   ninguno"* (apartado 3). Así que esto es un **catálogo**, no una lista
   obligatoria, y existe "Otro" para lo que no quepa. */

export const PASOS_BARBA = [
  // Los cuatro del apartado 2, en su orden.
  { id: 'preparar', nombre: 'Preparar', icono: '💧', de: 'afeitado' },
  { id: 'afeitar', nombre: 'Afeitar', icono: '🪒', de: 'afeitado' },
  { id: 'limpiar', nombre: 'Limpiar', icono: '🚿', de: 'afeitado' },
  { id: 'cuidar', nombre: 'Cuidado posterior', icono: '🧴', de: 'afeitado' },
  // Los cinco del apartado 3.
  { id: 'limpieza', nombre: 'Limpieza', icono: '🧼', de: 'barba' },
  { id: 'acondicionar', nombre: 'Acondicionamiento', icono: '🫧', de: 'barba' },
  { id: 'hidratar', nombre: 'Hidratación', icono: '💧', de: 'barba' },
  { id: 'peinar', nombre: 'Peinado', icono: '🪮', de: 'barba' },
  { id: 'perfilar', nombre: 'Perfilado', icono: '✂️', de: 'barba' },
  { id: 'otros', nombre: 'Otro', icono: '➕', de: null },
];

export const pasoBarba = (id) => PASOS_BARBA.find((p) => p.id === id) || null;

/* ===========================================================================
   2 · LAS FRECUENCIAS (apartados 4 y 5)
   ===========================================================================
   ⚠️ **La lista es del módulo; el comportamiento es del motor** (F14). Las
   cuatro del apartado 4 —*"cada 3 días, cada semana, cada 2 semanas,
   personalizado"*— se declaran con el `tipo` que ya sabe hacer el motor, y ahí
   se acaba lo que hay que escribir. */

export const FRECUENCIAS_BARBA = [
  { id: 'diaria', nombre: 'Diario', tipo: 'diaria' },
  { id: 'tres_dias', nombre: 'Cada 3 días', tipo: 'cada_x', cada: 3 },
  { id: 'semanal', nombre: 'Cada semana', tipo: 'cada_x', cada: 7 },
  { id: 'quincenal', nombre: 'Cada 2 semanas', tipo: 'cada_x', cada: 14 },
  { id: 'dias', nombre: 'Días concretos', tipo: 'dias', pideDias: true },
  { id: 'personalizado', nombre: 'Personalizado', tipo: 'ninguna' },
];

export const frecuenciaBarba = (id) => FRECUENCIAS_BARBA.find((f) => f.id === id) || null;

const tipoFrecuenciaBarba = (id) => frecuenciaBarba(id)?.tipo || null;

/** Apartado 5 — *"momento"*. Las mismas tres etiquetas que usa Skincare. */
export const MOMENTOS_BARBA = [
  { id: 'manana', nombre: 'Por la mañana', icono: '🌅' },
  { id: 'noche', nombre: 'Por la noche', icono: '🌙' },
  { id: 'cualquiera', nombre: 'Cuando toque', icono: '🕐' },
];

export const momentoBarba = (id) => MOMENTOS_BARBA.find((m) => m.id === id) || null;

/* ===========================================================================
   3 · LAS PLANTILLAS (apartados 1, 2 y 3)
   ===========================================================================
   ⚠️ *"Ofrecer también: Rutina básica **como plantilla opcional**."* Opcional
   quiere decir que **usarla es una llamada aparte**: `usarPlantillaBarba` la
   escribe, y verla no escribe nada. Séptimo `aplicarPlan` del proyecto. */

export const PLANTILLAS_BARBA = [
  {
    id: 'afeitado',
    nombre: 'Afeitado',
    icono: '🪒',
    // ⚠️ Los cuatro pasos del apartado 2, tal cual.
    pasos: ['preparar', 'afeitar', 'limpiar', 'cuidar'],
    frecuencia: 'tres_dias',
    // Solo se ofrece a quien gestiona el afeitado.
    requiere: 'afeitado',
  },
  {
    id: 'barba',
    nombre: 'Cuidado de barba',
    icono: '🧔',
    // ⚠️ Los cinco del apartado 3, y *"no imponer ninguno"*: se pueden quitar.
    pasos: ['limpieza', 'acondicionar', 'hidratar', 'peinar', 'perfilar'],
    frecuencia: 'diaria',
    requiere: 'barba',
  },
  {
    id: 'perfilado',
    nombre: 'Perfilado',
    icono: '✂️',
    // Apartado 4 — el apartado específico, que es una rutina de un paso.
    pasos: ['perfilar'],
    frecuencia: 'semanal',
    requiere: 'perfilado',
  },
];

export const plantillaBarba = (id) => PLANTILLAS_BARBA.find((p) => p.id === id) || null;

/**
 * ⚠️ **Propone; no escribe.** Y solo ofrece las plantillas de lo que él ha dicho
 * que gestiona (apartado 2 de la F20): a quien no se afeita no se le propone una
 * rutina de afeitado.
 */
export function plantillasSugeridasBarba(estado) {
  const d = datosBarba(estado);
  const yaTiene = rutinasBarba(estado).map((r) => r.plantilla).filter(Boolean);
  return PLANTILLAS_BARBA
    .filter((p) => d.partes[p.requiere] === true && !yaTiene.includes(p.id))
    .map((p) => ({
      ...p,
      pasosVisibles: p.pasos.map((id) => pasoBarba(id)).filter(Boolean),
      frecuenciaNombre: frecuenciaBarba(p.frecuencia)?.nombre || '',
      // ⚠️ Escrito en el propio dato: verla no la crea.
      guardada: false,
      accion: 'Usar esta rutina',
    }));
}

export function usarPlantillaBarba(estado, plantillaId, { hoy = todayISO(), confirmado = false } = {}) {
  const p = plantillaBarba(plantillaId);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Esa plantilla no existe.', rutina: null };
  /* ⚠️ **Sin confirmar no escribe** — la regla 7 en código, no una comprobación
     defensiva. Séptimo `aplicarPlan` del proyecto, y nunca con valor por
     defecto: *"como plantilla opcional"*. */
  if (!confirmado) {
    return { estado: normalizarEstiloHombre(estado), error: null, rutina: null, sinConfirmar: true };
  }
  return crearRutinaBarba(estado, {
    nombre: p.nombre,
    pasos: p.pasos.map((id) => ({ accion: id })),
    frecuencia: p.frecuencia,
    cada: p.cada || frecuenciaBarba(p.frecuencia)?.cada,
    plantilla: p.id,
  }, { hoy });
}

/* ===========================================================================
   4 · EL ALMACÉN
   =========================================================================== */

/* ⚠️ Los campos propios de esta fase los normaliza ESTE archivo, no el motor
   (regla 5). Van diecinueve veces en el proyecto. */
const extraDeRutina = (r) => ({
  momento: momentoBarba(r.momento) ? r.momento : 'cualquiera',
  hora: typeof r.hora === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(r.hora) ? r.hora : null,
  // Apartado 16 — favorita, con el sistema global de favoritos.
  favorita: r.favorita === true,
  // De qué plantilla salió, si salió de alguna. Sirve para no ofrecerla dos veces.
  plantilla: PLANTILLAS_BARBA.some((p) => p.id === r.plantilla) ? r.plantilla : null,
});

export const normalizarRutinaBarba = (g, i) =>
  normalizarRutinaGenerica(g, i, {
    tipoDe: tipoFrecuenciaBarba,
    frecuenciaPorDefecto: 'personalizado',
    extra: extraDeRutina,
  });

/**
 * Apartados 9, 10 y 11 — lo ÚNICO que esta fase guarda de nuevo. ⚠️ Todo es
 * opcional: se puede registrar solo "cómo ha ido", solo una nota, o las cuatro
 * valoraciones. Un registro vacío no se guarda.
 */
export const ESCALA_BARBA = [
  { id: 'muy_bien', nombre: 'Muy bien', icono: '😄', valor: 4 },
  { id: 'bien', nombre: 'Bien', icono: '🙂', valor: 3 },
  { id: 'normal', nombre: 'Normal', icono: '😐', valor: 2 },
  { id: 'mal', nombre: 'Mal', icono: '🙁', valor: 1 },
];

export const valorBarba = (id) => ESCALA_BARBA.find((x) => x.id === id) || null;

/** Apartado 10 — los cuatro, de 1 a 5. ⚠️ *"Irritación percibida"*: percibida. */
export const ASPECTOS_BARBA = [
  { id: 'comodidad', nombre: 'Comodidad', icono: '😌' },
  { id: 'resultado', nombre: 'Resultado', icono: '✨' },
  { id: 'irritacion', nombre: 'Irritación percibida', icono: '🔥' },
  { id: 'facilidad', nombre: 'Facilidad', icono: '👌' },
];

export const aspectoBarba = (id) => ASPECTOS_BARBA.find((a) => a.id === id) || null;

export const MAX_NOTA_BARBA = 280;

export const DEFAULT_RUTINAS_BARBA = { rutinas: [], hechos: [], registros: [] };

export function normalizarRegistroBarba(g) {
  const r = g || {};
  if (typeof r.fecha !== 'string') return null;
  const aspectos = {};
  ASPECTOS_BARBA.forEach((a) => {
    const v = Number(r.aspectos?.[a.id]);
    // ⚠️ `Number(null)` es 0 y `Number.isInteger(0)` es `true`: el 0 no vale.
    if (Number.isInteger(v) && v >= 1 && v <= 5) aspectos[a.id] = v;
  });
  return {
    id: r.id || uid(),
    fecha: r.fecha,
    // Qué hizo: una rutina suya, o simplemente "afeitado".
    rutinaId: typeof r.rutinaId === 'string' ? r.rutinaId : null,
    que: (r.que || '').trim(),
    como: valorBarba(r.como) ? r.como : null,
    aspectos,
    nota: String(r.nota || '').trim().slice(0, MAX_NOTA_BARBA),
  };
}

export function normalizarRutinasBarba(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    rutinas: (Array.isArray(g.rutinas) ? g.rutinas : [])
      .map(normalizarRutinaBarba)
      .sort((a, b) => a.orden - b.orden),
    hechos: normalizarHechos(g.hechos),
    /* ⚠️ **`registros` es el campo nuevo de esta fase, y va aquí.** Sin esta
       línea el siguiente guardado se los llevaría (regla 5). Es la vez número
       diecinueve que este proyecto se topa con lo mismo. */
    registros: (Array.isArray(g.registros) ? g.registros : [])
      .map(normalizarRegistroBarba).filter(Boolean)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
  };
}

export const datosRutinasBarba = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_BARBA);
  return normalizarRutinasBarba(mod?.config?.rutinas);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_BARBA, { rutinas: datos });

export const rutinasBarba = (estado) => datosRutinasBarba(estado).rutinas;

export const rutinaBarba = (estado, id) => rutinasBarba(estado).find((r) => r.id === id) || null;

/* ===========================================================================
   5 · CREAR, EDITAR Y REORDENAR (apartado 5)
   =========================================================================== */

export function crearRutinaBarba(estado, datos = {}, { hoy = todayISO() } = {}) {
  const d = datosRutinasBarba(estado);
  const nombre = String(datos.nombre || '').trim();
  if (!nombre) return { estado: normalizarEstiloHombre(estado), error: 'La rutina necesita un nombre.', rutina: null };
  const rutina = normalizarRutinaBarba({ ...datos, nombre, desde: hoy, orden: d.rutinas.length }, d.rutinas.length);
  return { estado: escribir(estado, { ...d, rutinas: [...d.rutinas, rutina] }), error: null, rutina };
}

export function editarRutinaBarba(estado, id, cambios = {}) {
  const d = datosRutinasBarba(estado);
  const actual = d.rutinas.find((r) => r.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  /* ⚠️ Se mira lo que ÉL escribió, no lo normalizado: el motor le pone "Rutina"
     a lo que llega sin nombre, así que comprobar después nunca saltaría. Borrar
     el nombre a mano es una acción suya, y merece el mismo aviso que al crearla. */
  if ('nombre' in cambios && !String(cambios.nombre || '').trim()) {
    return { estado: normalizarEstiloHombre(estado), error: 'La rutina necesita un nombre.' };
  }
  const nueva = normalizarRutinaBarba({ ...actual, ...cambios, id: actual.id }, actual.orden);
  return { estado: escribir(estado, { ...d, rutinas: d.rutinas.map((r) => (r.id === id ? nueva : r)) }), error: null };
}

/** Apartado 20, prueba 4 — *"reordenarlos"*. Los pasos, dentro de una rutina. */
export function ordenarPasosBarba(estado, rutinaId, ordenIds = []) {
  const r = rutinaBarba(estado, rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  const puestos = ordenIds.map((id) => r.pasos.find((p) => p.id === id)).filter(Boolean);
  // ⚠️ Los que no vengan en la lista se quedan detrás, no se pierden.
  const resto = r.pasos.filter((p) => !ordenIds.includes(p.id));
  return editarRutinaBarba(estado, rutinaId, { pasos: [...puestos, ...resto] });
}

/** Apartado 13 — un producto del catálogo global. ⚠️ Nunca uno nuevo. */
export function asignarProductoBarba(estado, rutinaId, pasoId, productoId) {
  const r = rutinaBarba(estado, rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  if (productoId !== null && !catalogoParaBarba(estado).some((p) => p.id === productoId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  }
  return editarRutinaBarba(estado, rutinaId, {
    pasos: r.pasos.map((p) => (p.id === pasoId ? { ...p, productoId } : p)),
  });
}

/** Apartado 16 — favorita, con el sistema global. */
export function alternarFavoritaBarba(estado, id) {
  const r = rutinaBarba(estado, id);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  return editarRutinaBarba(estado, id, { favorita: !r.favorita });
}

/** Apartado 8 — *"opcional… el usuario decide cuándo"*. Nunca automático. */
export function alternarRecordatorioBarba(estado, id) {
  const r = rutinaBarba(estado, id);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  return editarRutinaBarba(estado, id, { recordatorio: !r.recordatorio });
}

/* ⚠️ Apartado 19 — eliminar pasa por la papelera global, y **antes se dice qué
   se lleva**. El impacto lo calcula el motor; aquí solo se le pasa lo suyo. */
export const impactoEliminarRutinaBarba = (estado, id) => {
  const d = datosRutinasBarba(estado);
  return impactoEliminarRutina(d.rutinas, d.hechos, id);
};

export function eliminarRutinaBarba(estado, id) {
  const d = datosRutinasBarba(estado);
  if (!d.rutinas.some((r) => r.id === id)) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  return {
    estado: escribir(estado, {
      ...d,
      rutinas: d.rutinas.filter((r) => r.id !== id),
      // Sus marcas se van con ella: sin la rutina no significan nada.
      hechos: d.hechos.filter((h) => h.rutinaId !== id),
      /* ⚠️ Pero los REGISTROS no: *"23/08 — Afeitado ⭐ 5/5"* pasó, y borrar la
         rutina no puede reescribir la historia. Se quedan sin `rutinaId`.
         Misma decisión que la F11 con los cortes y las citas. */
      registros: d.registros.map((r) => (r.rutinaId === id ? { ...r, rutinaId: null } : r)),
    }),
    error: null,
  };
}

/* ===========================================================================
   6 · EL DÍA Y EL CHECKLIST (apartados 6 y 7)
   ===========================================================================
   ⚠️ Todo del motor. Aquí no se decide qué es "hecha": eso es `estadoDelDia`. */

export const tocaEnFechaBarba = (rutina, fechaISO) =>
  tocaEnFechaGenerico(rutina, fechaISO, tipoFrecuenciaBarba);

export function rutinasDeHoyBarba(estado, { hoy = todayISO() } = {}) {
  if (!parteActivaBarba(estado, PARTE_RUTINAS_BARBA)) return [];
  return rutinasBarba(estado).filter((r) => r.activa && tocaEnFechaBarba(r, hoy));
}

const nombreDeProducto = (estado) => (id) => {
  if (!id) return '';
  return catalogoParaBarba(estado).find((p) => p.id === id)?.nombre || '';
};

export function checklistBarba(estado, rutinaId, { hoy = todayISO() } = {}) {
  const d = datosRutinasBarba(estado);
  return checklistGenerico(d.rutinas.find((r) => r.id === rutinaId), d.hechos, hoy, {
    nombreDePaso: (p) => p.nombre || pasoBarba(p.accion)?.nombre || 'Paso',
    iconoDePaso: (p) => pasoBarba(p.accion)?.icono || '•',
    nombreDeProducto: nombreDeProducto(estado),
  });
}

export function marcarPasoBarba(estado, rutinaId, pasoId, { hoy = todayISO() } = {}) {
  const d = datosRutinasBarba(estado);
  return escribir(estado, { ...d, hechos: alternarPaso(d.hechos, rutinaId, pasoId, hoy) });
}

/** Apartado 7 — *"Omitir hoy. Sin penalización."* */
export function omitirPasoBarba(estado, rutinaId, pasoId, { hoy = todayISO() } = {}) {
  const d = datosRutinasBarba(estado);
  return escribir(estado, { ...d, hechos: alternarOmitido(d.hechos, rutinaId, pasoId, hoy) });
}

export function marcarRutinaBarbaEntera(estado, rutinaId, { hoy = todayISO() } = {}) {
  const d = datosRutinasBarba(estado);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  if (!r) return normalizarEstiloHombre(estado);
  return escribir(estado, { ...d, hechos: marcarTodo(d.hechos, r, hoy) });
}

/* ===========================================================================
   7 · EL SEGUIMIENTO (apartados 9, 10 y 11)
   ===========================================================================
   ⚠️ **Solo si lo ha activado** (apartados 9 y 17). Y todo dentro es opcional:
   se puede registrar solo la carita, solo una nota, o las cuatro valoraciones. */

export function registrarBarba(estado, datos = {}, { hoy = todayISO() } = {}) {
  if (!parteActivaBarba(estado, PARTE_SEGUIMIENTO_BARBA)) {
    return { estado: normalizarEstiloHombre(estado), error: 'El seguimiento está desactivado.', registro: null };
  }
  const registro = normalizarRegistroBarba({ ...datos, fecha: datos.fecha || hoy });
  if (!registro) return { estado: normalizarEstiloHombre(estado), error: 'Falta la fecha.', registro: null };
  /* ⚠️ Un registro sin nada dentro no se guarda: sería una fila vacía en el
     historial, y el apartado 12 pide que sea sencillo. */
  if (!registro.como && Object.keys(registro.aspectos).length === 0 && !registro.nota) {
    return { estado: normalizarEstiloHombre(estado), error: 'Cuéntanos algo: cómo ha ido, una valoración o una nota.', registro: null };
  }
  const d = datosRutinasBarba(estado);
  return { estado: escribir(estado, { ...d, registros: [registro, ...d.registros] }), error: null, registro };
}

export function editarRegistroBarba(estado, id, cambios = {}) {
  const d = datosRutinasBarba(estado);
  const actual = d.registros.find((r) => r.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Ese registro no existe.' };
  const nuevo = normalizarRegistroBarba({ ...actual, ...cambios, id: actual.id });
  return { estado: escribir(estado, { ...d, registros: d.registros.map((r) => (r.id === id ? nuevo : r)) }), error: null };
}

/* ⚠️ Apartado 19 — **el motor de la papelera GLOBAL**, exactamente como lo usa
   `eliminarRegistroPiel` de la F15. Aquí no se construye nada: se le pasa la
   lista y se devuelve la entrada para que App.jsx la guarde en la papelera de
   siempre, con su retención, su recuperación y su pantalla. */
export function eliminarRegistroBarba(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosRutinasBarba(estado);
  const r = prepararEliminacion(d, MODULO_BARBA, 'registros', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Ese registro no existe.', entrada: null };
  return { estado: escribir(estado, r.moduloActualizado), error: null, entrada: r.entrada };
}

/** Y volver, con el mismo motor de ME F3. */
export function restaurarRegistroBarba(estado, entrada) {
  const d = datosRutinasBarba(estado);
  const r = prepararRestauracion(d, entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se ha podido restaurar.' };
  return { estado: escribir(estado, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

/* ⚠️ Y una rutina eliminada también va a la papelera global (apartado 19). */
export function eliminarRutinaConPapelera(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosRutinasBarba(estado);
  const r = prepararEliminacion(d, MODULO_BARBA, 'rutinas', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.', entrada: null };
  /* Sus marcas se van con ella y sus registros se quedan huérfanos, igual que en
     `eliminarRutinaBarba`: borrar la rutina no puede reescribir la historia. */
  return {
    estado: escribir(estado, {
      ...r.moduloActualizado,
      hechos: d.hechos.filter((h) => h.rutinaId !== id),
      registros: d.registros.map((x) => (x.rutinaId === id ? { ...x, rutinaId: null } : x)),
    }),
    error: null,
    entrada: r.entrada,
  };
}

export function restaurarRutinaBarba(estado, entrada) {
  const d = datosRutinasBarba(estado);
  const r = prepararRestauracion(d, entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se ha podido restaurar.' };
  return { estado: escribir(estado, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

/* ===========================================================================
   8 · EL HISTORIAL (apartado 12)
   ===========================================================================
   ⚠️ *"Debe ser sencillo."* Una línea por registro, con su fecha, qué fue y su
   estrella si la tiene. **Ni medias, ni rachas, ni porcentajes.** */

export function historialBarba(estado, { limite = 20 } = {}) {
  const d = datosRutinasBarba(estado);
  return d.registros.slice(0, limite).map((r) => {
    const rutina = d.rutinas.find((x) => x.id === r.rutinaId);
    const puestas = ASPECTOS_BARBA.map((a) => r.aspectos[a.id]).filter((v) => v !== undefined);
    return {
      id: r.id,
      fecha: r.fecha,
      // Qué fue: la rutina si sigue existiendo, lo que escribió, o nada.
      que: rutina?.nombre || r.que || '',
      como: valorBarba(r.como),
      /* ⚠️ La estrella del ejemplo es la media de lo que él puntuó, y **solo si
         puntuó algo**: sin valoraciones NO hay estrella, ni un 0. */
      estrella: puestas.length > 0
        ? Math.round((puestas.reduce((s, v) => s + v, 0) / puestas.length) * 10) / 10
        : null,
      nota: r.nota,
    };
  });
}

/** El cumplimiento de las rutinas, del motor. ⚠️ Sin días que tocara, `null`. */
export const cumplimientoBarba = (estado, { hoy = todayISO() } = {}) => {
  const d = datosRutinasBarba(estado);
  return historialGenerico({ rutinas: d.rutinas, hechos: d.hechos, tipoDe: tipoFrecuenciaBarba, hoy });
};

/* ===========================================================================
   9 · EL CALENDARIO (apartado 14)
   ===========================================================================
   ⚠️ *"Debe aparecer en el calendario general. **No crear un calendario de
   barba**."* Y **nunca se materializa una ocurrencia** (regla 11): esto es una
   función de lectura sobre las rutinas, y no guarda ni un evento. */

export function eventosDeBarba(estado, desde, hasta) {
  if (!parteActivaBarba(estado, PARTE_RUTINAS_BARBA)) return [];
  return eventosDeRutinas({
    rutinas: rutinasBarba(estado).filter((r) => r.activa),
    tipoDe: tipoFrecuenciaBarba,
    desde,
    hasta,
    prefijo: 'barba',
    // ⚠️ La misma convención que `pelo` y `piel`: una clave corta que
    // `NOMBRES_ORIGEN` sabe traducir para el botón "Abrir en…".
    origen: 'barba',
    icono: '🧔',
  });
}

/* ===========================================================================
   10 · SUGERENCIAS (apartado 15)
   ===========================================================================
   ⚠️ *"No recomendar tratamientos médicos."* Son tres reglas sobre lo que él ha
   registrado, con el motor de F16 —cada una con su `requiere`, y **una regla sin
   requisitos no se aplica nunca**—, y ni una toca la rutina. */

export const SUGERENCIAS_BARBA = [
  {
    id: 'guardar_habitual',
    requiere: ['vecesConLaMisma'],
    cuando: (c) => c.vecesConLaMisma >= 3 && !c.yaFavorita,
    // ⚠️ El texto del ejemplo del enunciado, casi literal.
    texto: 'Llevas varios registros utilizando esta rutina. Si quieres, puedes guardarla como habitual.',
    accion: 'Guardar como favorita',
  },
  {
    id: 'anotar_producto',
    requiere: ['pasosSinProducto', 'tieneProductos'],
    cuando: (c) => c.pasosSinProducto > 0 && c.tieneProductos,
    texto: 'Puedes apuntar qué producto usas en cada paso, si te apetece tenerlo a mano.',
    accion: 'Asociar productos',
  },
  {
    id: 'sin_registros',
    requiere: ['tieneRutinas', 'registros'],
    cuando: (c) => c.tieneRutinas && c.registros === 0 && c.seguimiento,
    texto: 'Si registras cómo va, luego podrás mirar atrás y ver qué te funcionó mejor.',
    accion: 'Registrar cómo ha ido',
  },
];

export function contextoSugerenciasBarba(estado, { hoy = todayISO() } = {}) {
  const d = datosRutinasBarba(estado);
  const cuenta = {};
  d.registros.forEach((r) => { if (r.rutinaId) cuenta[r.rutinaId] = (cuenta[r.rutinaId] || 0) + 1; });
  const masUsada = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0] || null;
  const rutinaMasUsada = masUsada ? d.rutinas.find((r) => r.id === masUsada[0]) : null;
  return {
    hoy,
    tieneRutinas: d.rutinas.length > 0,
    registros: d.registros.length,
    seguimiento: parteActivaBarba(estado, PARTE_SEGUIMIENTO_BARBA),
    vecesConLaMisma: masUsada ? masUsada[1] : 0,
    rutinaMasUsada: rutinaMasUsada || null,
    yaFavorita: rutinaMasUsada?.favorita === true,
    pasosSinProducto: d.rutinas.reduce((s, r) => s + r.pasos.filter((p) => !p.productoId).length, 0),
    tieneProductos: productosDeBarba(estado).length > 0,
  };
}

export function sugerenciasBarba(estado, { hoy = todayISO() } = {}) {
  if (!parteActivaBarba(estado, PARTE_RUTINAS_BARBA)) return [];
  const ctx = contextoSugerenciasBarba(estado, { hoy });
  return SUGERENCIAS_BARBA
    .filter((s) => reglaAplicable(s, ctx))
    .map((s) => ({
      id: s.id,
      texto: s.texto,
      accion: s.accion,
      rutina: s.id === 'guardar_habitual' ? ctx.rutinaMasUsada : null,
      // ⚠️ Escrito en el propio dato: una sugerencia no hace nada por su cuenta.
      aplicada: false,
    }));
}

/* ===========================================================================
   11 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export function resumenRutinasBarba(estado, { hoy = todayISO() } = {}) {
  const d = datosRutinasBarba(estado);
  const deHoy = rutinasDeHoyBarba(estado, { hoy });
  const listas = deHoy.map((r) => checklistBarba(estado, r.id, { hoy })).filter(Boolean);
  return {
    rutinas: d.rutinas.length,
    favoritas: d.rutinas.filter((r) => r.favorita).length,
    conRecordatorio: d.rutinas.filter((r) => r.recordatorio).length,
    hoy: deHoy.length,
    hechasHoy: listas.filter((l) => l.estado === 'hecha').length,
    registros: d.registros.length,
    // ⚠️ Sin nada registrado NO hay última: `null`, no una fecha inventada.
    ultimo: d.registros[0]?.fecha || null,
    activo: parteActivaBarba(estado, PARTE_RUTINAS_BARBA),
    seguimiento: parteActivaBarba(estado, PARTE_SEGUIMIENTO_BARBA),
  };
}

export function auditarRutinasBarba(estado) {
  return {
    // Apartado 14 — ni un calendario de barba.
    calendariosNuevos: 0,
    // Apartado 19 — ni una papelera propia.
    papelerasNuevas: 0,
    // Apartado 13 — ni un catálogo de productos.
    catalogosNuevos: 0,
    // Y ni un motor de rutinas: el de F14.
    motoresNuevos: 0,
    motorRutinas: 'motorRutinas.js',
    motorReglas: 'motorRecomendaciones.js',
    // Sin IA, y sin diagnósticos (apartado 15).
    usaIA: 0,
    listasClinicasNuevas: 0,
    // Ni rachas, ni puntos, ni niveles (D2-02).
    rachas: 0, puntos: 0, niveles: 0,
    rutinas: rutinasBarba(estado).length,
  };
}

/** Todos los textos que esta fase puede enseñar, para barrerlos de una vez. */
export function textosDeRutinasBarba() {
  return [
    ...PASOS_BARBA.map((p) => p.nombre),
    ...FRECUENCIAS_BARBA.map((f) => f.nombre),
    ...MOMENTOS_BARBA.map((m) => m.nombre),
    ...PLANTILLAS_BARBA.map((p) => p.nombre),
    ...ESCALA_BARBA.map((e) => e.nombre),
    ...ASPECTOS_BARBA.map((a) => a.nombre),
    ...SUGERENCIAS_BARBA.map((s) => s.texto),
    ...SUGERENCIAS_BARBA.map((s) => s.accion),
    // ⚠️ Son textos, no objetos: con `.nombre` este barrido no miraba ninguno.
    ...Object.values(TEXTOS_ESTADO_DIA),
  ].filter(Boolean);
}

export function panelRutinasBarba(estado, { hoy = todayISO() } = {}) {
  return {
    activo: parteActivaBarba(estado, PARTE_RUTINAS_BARBA),
    rutinas: rutinasBarba(estado),
    hoy: rutinasDeHoyBarba(estado, { hoy }).map((r) => checklistBarba(estado, r.id, { hoy })),
    plantillas: plantillasSugeridasBarba(estado),
    historial: historialBarba(estado),
    cumplimiento: cumplimientoBarba(estado, { hoy }),
    sugerencias: sugerenciasBarba(estado, { hoy }),
    productos: productosDeBarba(estado),
    resumen: resumenRutinasBarba(estado, { hoy }),
    seguimiento: parteActivaBarba(estado, PARTE_SEGUIMIENTO_BARBA),
  };
}

export {
  ESTADOS_RUTINA_DIA, TEXTOS_ESTADO_DIA, DIAS_HISTORIAL,
  PALABRAS_CLINICAS, sinDiagnostico,
};
