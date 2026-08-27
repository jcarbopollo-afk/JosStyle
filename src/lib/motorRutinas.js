// ============================================================================
// EL MOTOR DE RUTINAS (nace en EH F14, extraído de EH F8)
//
// ── POR QUÉ EXISTE ESTE ARCHIVO ────────────────────────────────────────────
//
// La Fase 8 construyó rutinas de pelo: pasos, frecuencia, lista del día,
// historial y eventos de calendario. La **Fase 14 pide exactamente la misma
// máquina para Skincare**, y su apartado 19 se titula *"NO DUPLICAR"*.
//
// Copiar `rutinasPelo.js` habría sido el segundo sistema de siempre — y además
// el segundo sitio donde arreglar el mismo fallo. Así que lo genérico se ha
// **extraído aquí**, y los dos módulos lo usan: Pelo pasa su catálogo de pasos,
// Skincare el suyo, y el cálculo de qué toca hoy es **uno solo**.
//
// Las pruebas de la Fase 8 (171 comprobaciones) son la red que demuestra que la
// extracción no cambió nada de lo que ya funcionaba.
//
// ── LA DECISIÓN QUE HACE QUE ESTO ENCAJE ───────────────────────────────────
//
// ⚠️ **La lista de frecuencias es de cada módulo; el COMPORTAMIENTO es de aquí.**
// La Fase 8 ofrecía cinco opciones y la Fase 14 pide seis —*"Diario, Días
// concretos, Varias veces por semana, Semanal, Cada X días, Personalizado"*—,
// pero **debajo solo hay cuatro reglas distintas**: todos los días, unos días de
// la semana, cada X días, y ninguno por su cuenta.
//
// *"Días concretos"*, *"varias veces por semana"* y *"semanal"* son tres formas
// de decir "estos días de la semana". Se guardan con su id propio —Josué eligió
// esa palabra y esa palabra se conserva— y cada una declara **de qué tipo es**.
// Así una fase futura puede añadir la etiqueta que quiera sin tocar el cálculo.
//
// ⚠️ Y como en la Fase 8: **una rutina guarda su REGLA, nunca sus fechas**
// (regla 11 del proyecto). Nada se materializa.
// ============================================================================

import { uid, todayISO } from './helpers';

/* ===========================================================================
   1 · LOS CUATRO COMPORTAMIENTOS
   =========================================================================== */

export const TIPOS_FRECUENCIA = ['diaria', 'dias', 'cada_x', 'ninguna'];

/**
 * ⚠️ **El único sitio donde se decide si una rutina toca un día.** Pelo y
 * Skincare llaman aquí; si mañana Barba tiene rutinas, llamará aquí también.
 *
 * `tipoDe(frecuenciaId)` lo aporta cada módulo desde su propia lista.
 */
export function tocaEnFechaGenerico(rutina, fechaISO, tipoDe) {
  const r = rutina || {};
  if (r.activa === false) return false;
  if (r.desde && fechaISO < r.desde) return false;

  const dia = new Date(`${fechaISO}T00:00:00`).getDay();
  switch (tipoDe(r.frecuencia)) {
    case 'diaria': return true;
    case 'dias': return (r.dias || []).includes(dia);
    case 'cada_x': {
      // Sin fecha de inicio no hay desde dónde contar, y **no se inventa una**:
      // arrancar la cuenta "hoy" haría que la rutina cambiara de días cada vez
      // que se abre la pantalla.
      if (!r.desde) return false;
      const dias = Math.round((new Date(`${fechaISO}T00:00:00`) - new Date(`${r.desde}T00:00:00`)) / 86400000);
      return dias >= 0 && r.cada >= 1 && dias % r.cada === 0;
    }
    /* ⚠️ "Personalizada" no toca ningún día por su cuenta: es una rutina que se
       hace cuando se quiere. Inventarle un calendario sería justo lo que la
       opción existe para evitar. */
    default: return false;
  }
}

/* ===========================================================================
   2 · LA FORMA DE UNA RUTINA
   ===========================================================================
   ⚠️ Los campos que el motor entiende. Un módulo puede añadir los suyos con
   `extra`, y **entonces es él quien tiene que normalizarlos** — o el siguiente
   guardado se los lleva (regla 5). Van diez veces en este proyecto. */

export function normalizarRutinaGenerica(g, i, { tipoDe, frecuenciaPorDefecto = 'personalizada', extra = null } = {}) {
  const r = g || {};
  const frecuencia = tipoDe(r.frecuencia) ? r.frecuencia : frecuenciaPorDefecto;
  const base = {
    id: r.id || uid(),
    nombre: (r.nombre || '').trim() || 'Rutina',
    pasos: (Array.isArray(r.pasos) ? r.pasos : []).map((p) => ({
      id: p?.id || uid(),
      accion: p?.accion || 'otros',
      nombre: (p?.nombre || '').trim(),
      productoId: p?.productoId || null,
    })),
    frecuencia,
    // Días de la semana, 0 = domingo. Solo cuentan si la frecuencia los usa.
    dias: (Array.isArray(r.dias) ? r.dias : []).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6),
    cada: Number.isFinite(Number(r.cada)) && Number(r.cada) >= 1 ? Math.floor(Number(r.cada)) : 2,
    duracion: Number.isFinite(Number(r.duracion)) && Number(r.duracion) > 0 ? Math.floor(Number(r.duracion)) : null,
    activa: r.activa !== false,
    // ⚠️ Apagado por defecto, siempre. Los dos enunciados lo piden con las
    // mismas palabras: *"los recordatorios son opcionales"*, *"no insistir"*.
    recordatorio: r.recordatorio === true,
    desde: typeof r.desde === 'string' ? r.desde : null,
    orden: Number.isFinite(Number(r.orden)) ? Number(r.orden) : i,
  };
  return extra ? { ...base, ...extra(r) } : base;
}

/* ===========================================================================
   3 · EL DÍA
   ===========================================================================
   ⚠️ **Un día sin hacer NO es un fallo.** Los dos enunciados lo dicen: *"no
   queremos 'Has fallado'. Simplemente 'Pendiente'"* (F8) y *"no convertirlo en
   una competición, no castigar al usuario"* (F14). */

export const ESTADOS_RUTINA_DIA = ['pendiente', 'a_medias', 'hecha'];

export const TEXTOS_ESTADO_DIA = {
  pendiente: 'Pendiente',
  a_medias: 'Empezada',
  hecha: 'Hecha',
};

export function estadoDelDia(hechos, total) {
  if (hechos === 0) return 'pendiente';
  return hechos >= total && total > 0 ? 'hecha' : 'a_medias';
}

/* ===========================================================================
   4 · EL REGISTRO DE LO HECHO
   ===========================================================================
   ⚠️ **Derivado, no guardado en la rutina.** Un `hecho: true` dentro del paso se
   queda marcado mañana; un registro con fecha, no. */

export function normalizarHecho(g) {
  const h = g || {};
  if (typeof h.fecha !== 'string' || !h.rutinaId) return null;
  return {
    rutinaId: h.rutinaId,
    fecha: h.fecha,
    pasos: [...new Set((Array.isArray(h.pasos) ? h.pasos : []).filter((x) => typeof x === 'string'))],
    /* ⚠️ **F14, apartado 10 — *"omitir hoy, sin penalización"*.** Un paso
       omitido NO es un paso pendiente ni un paso hecho: es una tercera cosa, y
       tiene que serlo, porque contarlo como pendiente sería el reproche que el
       apartado prohíbe y contarlo como hecho sería mentir. */
    omitidos: [...new Set((Array.isArray(h.omitidos) ? h.omitidos : []).filter((x) => typeof x === 'string'))],
  };
}

export const normalizarHechos = (lista) =>
  (Array.isArray(lista) ? lista : []).map(normalizarHecho).filter(Boolean);

const registroDe = (hechos, rutinaId, fecha) =>
  hechos.find((h) => h.rutinaId === rutinaId && h.fecha === fecha) || null;

/** Marcar y desmarcar es la misma acción: un toque. */
export function alternarPaso(hechos, rutinaId, pasoId, fecha) {
  const actual = registroDe(hechos, rutinaId, fecha);
  const otros = hechos.filter((h) => !(h.rutinaId === rutinaId && h.fecha === fecha));
  const pasos = actual?.pasos || [];
  const nuevo = {
    rutinaId,
    fecha,
    pasos: pasos.includes(pasoId) ? pasos.filter((p) => p !== pasoId) : [...pasos, pasoId],
    // Marcar un paso lo quita de los omitidos: no puede estar hecho y omitido.
    omitidos: (actual?.omitidos || []).filter((p) => p !== pasoId),
  };
  return nuevo.pasos.length === 0 && nuevo.omitidos.length === 0 ? otros : [...otros, nuevo];
}

/** ⚠️ F14, apartado 10 — *"hoy no quiero hacer este paso"*, sin penalización. */
export function alternarOmitido(hechos, rutinaId, pasoId, fecha) {
  const actual = registroDe(hechos, rutinaId, fecha);
  const otros = hechos.filter((h) => !(h.rutinaId === rutinaId && h.fecha === fecha));
  const omitidos = actual?.omitidos || [];
  const nuevo = {
    rutinaId,
    fecha,
    // Omitir un paso lo quita de los hechos, por lo mismo.
    pasos: (actual?.pasos || []).filter((p) => p !== pasoId),
    omitidos: omitidos.includes(pasoId) ? omitidos.filter((p) => p !== pasoId) : [...omitidos, pasoId],
  };
  return nuevo.pasos.length === 0 && nuevo.omitidos.length === 0 ? otros : [...otros, nuevo];
}

/** Marcar la rutina entera, o desmarcarla si ya lo estaba. */
export function marcarTodo(hechos, rutina, fecha) {
  const actual = registroDe(hechos, rutina.id, fecha);
  const otros = hechos.filter((h) => !(h.rutinaId === rutina.id && h.fecha === fecha));
  const todos = rutina.pasos.map((p) => p.id);
  const yaEstaban = todos.length > 0 && todos.every((p) => (actual?.pasos || []).includes(p));
  if (yaEstaban) return otros;
  return [...otros, { rutinaId: rutina.id, fecha, pasos: todos, omitidos: [] }];
}

/**
 * La lista del día, con el estado de cada paso derivado del registro.
 * `nombreDePaso(paso)` y `iconoDePaso(paso)` los aporta cada módulo desde su
 * catálogo: el motor no sabe qué es "Limpieza" ni qué es "Champú".
 */
export function checklistGenerico(rutina, hechos, fecha, { nombreDePaso, iconoDePaso, nombreDeProducto }) {
  if (!rutina) return null;
  const registro = registroDe(hechos, rutina.id, fecha);
  const marcados = registro?.pasos || [];
  const omitidos = registro?.omitidos || [];
  const pasos = rutina.pasos.map((p) => ({
    ...p,
    etiqueta: nombreDePaso(p),
    icono: iconoDePaso(p),
    hecho: marcados.includes(p.id),
    omitido: omitidos.includes(p.id),
    producto: nombreDeProducto ? nombreDeProducto(p.productoId) : '',
  }));
  /* ⚠️ Un paso omitido **sale de la cuenta**, no cuenta como fallo: una rutina
     de tres pasos con uno omitido y dos hechos está HECHA. Es literalmente lo
     que pide "sin penalización". */
  const cuentan = pasos.filter((p) => !p.omitido);
  return {
    id: rutina.id,
    nombre: rutina.nombre,
    fecha,
    pasos,
    hechos: marcados.length,
    omitidos: omitidos.length,
    total: rutina.pasos.length,
    estado: estadoDelDia(cuentan.filter((p) => p.hecho).length, cuentan.length),
  };
}

/* ===========================================================================
   5 · EL HISTORIAL
   ===========================================================================
   ⚠️ **Sin días en los que tocara NO hay cumplimiento**, ni 0 ni 100. Decir
   "0 %" de algo que nunca tocó es el mismo reproche que "has fallado". */

export const DIAS_HISTORIAL = 30;

export function historialGenerico({ rutinas, hechos, tipoDe, hoy = todayISO(), dias = DIAS_HISTORIAL }) {
  const desde = new Date(`${hoy}T00:00:00`);
  desde.setDate(desde.getDate() - dias);
  const desdeISO = desde.toISOString().slice(0, 10);

  return rutinas.map((r) => {
    let tocaba = 0;
    for (let i = 0; i <= dias; i += 1) {
      const d = new Date(`${desdeISO}T00:00:00`);
      d.setDate(d.getDate() + i);
      if (tocaEnFechaGenerico(r, d.toISOString().slice(0, 10), tipoDe)) tocaba += 1;
    }
    const suyos = hechos.filter((h) => h.rutinaId === r.id && h.fecha >= desdeISO && h.fecha <= hoy);
    const hechas = suyos.filter((h) => h.pasos.length > 0).length;
    return {
      id: r.id,
      nombre: r.nombre,
      hechas,
      tocaba,
      // ⚠️ `null`, no 0.
      cumplimiento: tocaba === 0 ? null : Math.round((hechas / tocaba) * 100),
      // F14, apartado 15 — parcial es una tercera cosa, no media rutina fallada.
      parciales: suyos.filter((h) => h.pasos.length > 0 && h.pasos.length < r.pasos.length).length,
      omitidas: suyos.filter((h) => h.pasos.length === 0 && h.omitidos.length > 0).length,
    };
  });
}

/* ===========================================================================
   6 · EL CALENDARIO
   ===========================================================================
   ⚠️ **Nunca un segundo calendario** (regla 11; F8 apartado 17 y F14 apartado
   17 lo dicen con las mismas palabras). La misma forma de evento que el
   Armario, para que encaje sin adaptadores. */

export function eventosDeRutinas({ rutinas, tipoDe, desde, hasta, prefijo, origen, icono = '✨' }) {
  if (!desde || !hasta) return [];
  const eventos = [];
  const fin = new Date(`${hasta}T00:00:00`);
  for (let d = new Date(`${desde}T00:00:00`); d <= fin; d.setDate(d.getDate() + 1)) {
    const fecha = d.toISOString().slice(0, 10);
    rutinas.forEach((r) => {
      if (!r.recordatorio || !tocaEnFechaGenerico(r, fecha, tipoDe)) return;
      eventos.push({
        id: `${prefijo}:${r.id}:${fecha}`,
        titulo: `${icono} ${r.nombre}`,
        fecha,
        todoElDia: true,
        horaInicio: r.hora || null,
        horaFin: null,
        tipo: 'recordatorio',
        notas: '',
        ubicacion: '',
        origen,
        origenId: r.id,
        soloLectura: true,
      });
    });
  }
  return eventos;
}

/* ===========================================================================
   7 · BORRAR — DICIENDO ANTES QUÉ SE LLEVA
   =========================================================================== */

export function impactoEliminarRutina(rutinas, hechos, id) {
  const r = rutinas.find((x) => x.id === id);
  if (!r) return null;
  const registros = hechos.filter((h) => h.rutinaId === id).length;
  return {
    nombre: r.nombre,
    registros,
    // ⚠️ Se dice antes, no después.
    texto: registros === 0
      ? `Se borrará "${r.nombre}".`
      : `Se borrará "${r.nombre}" y ${registros} ${registros === 1 ? 'día registrado' : 'días registrados'}.`,
    confirmar: 'Eliminar',
    cancelar: 'Cancelar',
  };
}
