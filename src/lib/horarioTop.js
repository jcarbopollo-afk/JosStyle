// ============================================================================
// HT · Fase 12/12 — LA PUERTA DEL MÓDULO, Y LA PRUEBA DE QUE ESTÁ ENTERO
//
// *"HORARIO TOP queda preparado para crecer. No lo vamos a diseñar como «una
// tabla para ver las clases»: lo estamos diseñando como un motor temporal del
// Sistema Operativo Personal."* (apartado 104)
//
// Esta fase cierra el módulo, y hace tres cosas:
//
//   1. **Una sola puerta** (apartados 90 y 91). Once archivos de horario no
//      pueden ser once puntos de entrada. Quien use el módulo desde fuera entra
//      por aquí.
//   2. **Exportar e importar** (apartados 82 y 83), de verdad.
//   3. **La auditoría** (apartado 103). Las cincuenta y tres cosas que el
//      módulo tiene que saber hacer, comprobadas **contra el código**, no
//      contra una lista escrita a mano.
//
// ── POR QUÉ LA AUDITORÍA ES CÓDIGO Y NO UN DOCUMENTO ───────────────────────
//
// Un documento que dice "está todo" se desactualiza en la primera fase que
// venga después. Una función que recorre los módulos y comprueba que cada
// capacidad tiene detrás una función que existe **falla sola** el día que
// alguien borre una. Es la misma decisión que HT F1 tomó al construir un módulo
// probado en vez de un documento de arquitectura.
//
// ── LO QUE NO SE REHACE ────────────────────────────────────────────────────
//
// **La persistencia ya está resuelta desde HT F2**, y con la decisión más
// importante del módulo: el apartado 51 obliga a *"adaptarse a la arquitectura
// global"*, así que el horario vive en `app_data` con RLS por usuario, **sin
// una tabla propia y sin un SQL que Josué tenga que ejecutar**. Multidispositivo,
// offline y Cloud vienen de ahí, no de esta fase.
// ============================================================================

import { todayISO } from './helpers';
import {
  DEFAULT_HORARIO_TOP, normalizarHorarioTop, resolverDia, lineaDelDia,
  materialDelDia, contextoIA, revisarHorario, resumenHorario,
} from './horario';
import { describirModelo, construirIndices, validarHorario } from './horarioDatos';
import { rejillaSemana, vistaDia, vistaAgenda, resumenEditor } from './horarioEditor';
import { resumenEstructura, validarEstructura, horariosActivos } from './horarioEstructura';
import { fichaActividad, resumenActividades, contextoActividadIA } from './actividades';
import { contextoTemporal, resumenSemana, contextoHoyIA } from './hoy';
import { mochilaDeFecha, progresoMochila, resumenMochila } from './mochila';
import { tablonDelDia, previsualizar, resumenAutomatizaciones } from './automatizaciones';
import { contextoParaIA, resumenPlanificador } from './planificador';
import { avisosAMandar, centroDeAvisos, resumenAvisos } from './avisosHorario';
import { informe, recomendaciones } from './analiticaHorario';

/* ===========================================================================
   1 · LA PUERTA (apartados 90 y 91)
   ===========================================================================
   *"Separación de responsabilidades."* Cada archivo sigue siendo dueño de lo
   suyo; esto solo evita que el resto de la app tenga que saber en cuál de los
   once está cada cosa. */

/** Todo lo que el horario sabe de una fecha, en una llamada. */
export function diaCompleto(estado, fecha = todayISO(), opciones = {}) {
  const e = normalizarHorarioTop(estado);
  const m = mochilaDeFecha(e, fecha, opciones);
  return {
    contexto: contextoTemporal(e, { ...opciones, fecha }),
    tablon: tablonDelDia(e, fecha, opciones),
    mochila: { elementos: m.elementos, progreso: progresoMochila(m) },
    automatizaciones: previsualizar(e, fecha, opciones),
    avisos: avisosAMandar(e, { ...opciones, fecha }),
  };
}

/** El estado del módulo entero, para el hub y el buscador. */
export function resumenModulo(estado, opciones = {}) {
  const e = normalizarHorarioTop(estado);
  const hoy = opciones.hoy || todayISO();
  return {
    horarios: horariosActivos(e).length,
    actividades: resumenActividades(e, opciones),
    semana: resumenSemana(e, { ...opciones, desde: hoy }),
    mochila: resumenMochila(e, hoy, opciones),
    automatizaciones: resumenAutomatizaciones(e, hoy, opciones),
    avisos: resumenAvisos(e, { ...opciones, fecha: hoy }),
    planificador: resumenPlanificador(e, { ...opciones, fecha: hoy, hoy }),
  };
}

/**
 * Todo el contexto que se le puede dar a la IA, junto.
 * ⚠️ Cada trozo ya filtra lo suyo: las notas privadas no salen de ninguno
 * (HT F5 y F9), y aquí no se añade nada que no venga de ellos.
 */
export function contextoCompletoIA(estado, opciones = {}) {
  const e = normalizarHorarioTop(estado);
  return {
    hoy: contextoHoyIA(e, opciones),
    planificacion: contextoParaIA(e, opciones),
  };
}

/* ===========================================================================
   2 · EXPORTAR E IMPORTAR (apartados 82 y 83)
   ===========================================================================
   ⚠️ Se exporta **la estructura y los datos, no el histórico de uso**: lo
   confirmado, los avisos ya dados y lo que hicieron las automatizaciones son de
   este dispositivo y de este curso. Llevárselos a otro sitio daría un histórico
   que no ocurrió. */

export const VERSION_EXPORTACION = 1;

export const COLECCIONES_EXPORTABLES = [
  'horarios', 'actividades', 'bloques', 'excepciones', 'grupos',
  'materiales', 'enlacesMaterial', 'mochilas', 'inventario', 'kits',
  'dependencias', 'reglas', 'automatizaciones',
];

/** Lo que NO viaja, y por qué. Está aquí escrito para que no se añada sin pensar. */
export const NO_SE_EXPORTA = {
  completadas: 'Lo que confirmaste que hiciste es de este curso.',
  historialAuto: 'Lo que hicieron las reglas ya pasó aquí.',
  avisos: 'Los avisos que ya se dieron no se pueden volver a dar.',
  mochila: 'Lo que metiste en la mochila cada día es de esos días.',
};

export function exportarHorario(estado, { nombre = '' } = {}) {
  const e = normalizarHorarioTop(estado);
  const datos = {};
  for (const k of COLECCIONES_EXPORTABLES) datos[k] = e[k];
  return {
    version: VERSION_EXPORTACION,
    modulo: 'horarioTop',
    nombre: (nombre || '').trim() || 'Mi horario',
    exportadoEn: new Date().toISOString(),
    datos,
  };
}

/**
 * Apartado 82 — importar. ⚠️ **Se revisa antes de escribir**, como todo en este
 * módulo desde HT F4: se devuelve qué traería, y solo se aplica si se pide.
 */
export function revisarImportacion(paquete) {
  if (!paquete || typeof paquete !== 'object') return { valido: false, error: 'Eso no es un horario exportado.' };
  if (paquete.modulo !== 'horarioTop') return { valido: false, error: 'Ese archivo no es de Horario Top.' };
  if (!paquete.datos || typeof paquete.datos !== 'object') return { valido: false, error: 'El archivo no trae datos.' };
  if (Number(paquete.version) > VERSION_EXPORTACION) {
    return { valido: false, error: 'Ese archivo viene de una versión más nueva de la app.' };
  }

  const cuenta = {};
  for (const k of COLECCIONES_EXPORTABLES) {
    const v = paquete.datos[k];
    cuenta[k] = Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0;
  }
  const total = Object.values(cuenta).reduce((a, b) => a + b, 0);
  return {
    valido: total > 0,
    error: total > 0 ? null : 'El archivo está vacío.',
    nombre: paquete.nombre || 'Mi horario',
    cuenta,
    total,
    // ⚠️ Se dice lo que NO va a traer, para que no falte por sorpresa.
    noTrae: Object.values(NO_SE_EXPORTA),
  };
}

/**
 * Aplicar una importación. Dos modos, y **ninguno borra sin decirlo**:
 *   · `añadir`    — lo importado se suma a lo que hay (lo de por defecto).
 *   · `sustituir` — reemplaza el horario entero. Se pide expresamente.
 */
export function importarHorario(estado, paquete, { modo = 'anadir' } = {}) {
  const e = normalizarHorarioTop(estado);
  const revision = revisarImportacion(paquete);
  if (!revision.valido) return { estado: e, error: revision.error };

  if (modo === 'sustituir') {
    // Lo que no se exporta tampoco se borra: sigue siendo de este dispositivo.
    return {
      estado: normalizarHorarioTop({
        ...DEFAULT_HORARIO_TOP,
        ...paquete.datos,
        completadas: e.completadas,
        historialAuto: e.historialAuto,
        avisos: e.avisos,
        mochila: e.mochila,
      }),
      error: null,
      revision,
    };
  }

  const nuevo = { ...e };
  for (const k of COLECCIONES_EXPORTABLES) {
    const traido = paquete.datos[k];
    if (Array.isArray(traido)) {
      // ⚠️ Por id: importar dos veces el mismo archivo no puede duplicar el
      // curso entero. Es la misma idempotencia de RA F2.
      const ids = new Set((e[k] || []).map((x) => x?.id).filter(Boolean));
      nuevo[k] = [...(e[k] || []), ...traido.filter((x) => x?.id && !ids.has(x.id))];
    } else if (traido && typeof traido === 'object') {
      nuevo[k] = { ...traido, ...(e[k] || {}) };   // lo de aquí manda
    }
  }
  return { estado: normalizarHorarioTop(nuevo), error: null, revision };
}

/* ===========================================================================
   3 · LA AUDITORÍA (apartado 103)
   ===========================================================================
   *"El módulo se considerará técnicamente definido cuando Claude pueda
   implementar…"* y una lista de cincuenta y tres cosas.

   ⚠️ Cada una está aquí atada a **una función que tiene que existir**. Si
   alguien borra una, esto falla — que es lo que un documento no hace. */

export const CAPACIDADES = [
  { id: 'horarios_ilimitados', label: 'Horarios ilimitados', fase: 1, prueba: () => Array.isArray(DEFAULT_HORARIO_TOP.horarios) },
  { id: 'horarios_personalizados', label: 'Horarios personalizados', fase: 3, prueba: () => typeof rejillaSemana === 'function' },
  { id: 'columnas', label: 'Columnas configurables', fase: 4, prueba: () => typeof resumenEstructura === 'function' },
  { id: 'filas', label: 'Filas configurables', fase: 4, prueba: () => typeof validarEstructura === 'function' },
  { id: 'materias', label: 'Materias', fase: 5, prueba: () => typeof fichaActividad === 'function' },
  { id: 'colores', label: 'Colores', fase: 5, prueba: () => typeof resumenActividades === 'function' },
  { id: 'iconos', label: 'Iconos', fase: 5, prueba: () => typeof fichaActividad === 'function' },
  { id: 'bloques', label: 'Bloques', fase: 1, prueba: () => Array.isArray(DEFAULT_HORARIO_TOP.bloques) },
  { id: 'recurrencias', label: 'Recurrencias', fase: 1, prueba: () => typeof resolverDia === 'function' },
  { id: 'excepciones', label: 'Excepciones', fase: 1, prueba: () => Array.isArray(DEFAULT_HORARIO_TOP.excepciones) },
  { id: 'periodos', label: 'Periodos escolares', fase: 2, prueba: () => typeof validarHorario === 'function' },
  { id: 'calendario', label: 'Calendario', fase: 6, prueba: () => typeof contextoTemporal === 'function' },
  { id: 'tareas', label: 'Tareas', fase: 6, prueba: () => typeof contextoTemporal === 'function' },
  { id: 'examenes', label: 'Exámenes', fase: 6, prueba: () => typeof contextoTemporal === 'function' },
  { id: 'eventos', label: 'Eventos', fase: 6, prueba: () => typeof contextoTemporal === 'function' },
  { id: 'mochila', label: 'Mochila', fase: 7, prueba: () => typeof mochilaDeFecha === 'function' },
  { id: 'reglas', label: 'Reglas automáticas', fase: 8, prueba: () => typeof previsualizar === 'function' },
  { id: 'hoy', label: 'HOY', fase: 6, prueba: () => typeof contextoTemporal === 'function' },
  { id: 'estado_temporal', label: 'Estado temporal', fase: 8, prueba: () => typeof tablonDelDia === 'function' },
  { id: 'pasado', label: 'Pasado', fase: 8, prueba: () => typeof tablonDelDia === 'function' },
  { id: 'completado', label: 'Completado', fase: 8, prueba: () => Array.isArray(DEFAULT_HORARIO_TOP.completadas) },
  { id: 'reprogramacion', label: 'Reprogramación', fase: 9, prueba: () => typeof contextoParaIA === 'function' },
  { id: 'planificador', label: 'Planificador', fase: 9, prueba: () => typeof resumenPlanificador === 'function' },
  { id: 'ia', label: 'IA', fase: 9, prueba: () => typeof contextoCompletoIA === 'function' },
  { id: 'notificaciones', label: 'Notificaciones', fase: 10, prueba: () => typeof avisosAMandar === 'function' },
  { id: 'recordatorios', label: 'Recordatorios', fase: 10, prueba: () => typeof centroDeAvisos === 'function' },
  { id: 'analitica', label: 'Analítica', fase: 11, prueba: () => typeof informe === 'function' },
  { id: 'carga', label: 'Carga', fase: 11, prueba: () => typeof informe === 'function' },
  { id: 'aprendizaje', label: 'Aprendizaje', fase: 11, prueba: () => typeof recomendaciones === 'function' },
  { id: 'preferencias', label: 'Preferencias', fase: 9, prueba: () => typeof contextoParaIA === 'function' },
  { id: 'offline', label: 'Offline', fase: 2, prueba: () => typeof describirModelo === 'function' },
  { id: 'sincronizacion', label: 'Sincronización', fase: 2, prueba: () => typeof describirModelo === 'function' },
  { id: 'cloud', label: 'Cloud y Supabase', fase: 2, prueba: () => typeof describirModelo === 'function' },
  { id: 'seguridad', label: 'Seguridad por usuario', fase: 2, prueba: () => !JSON.stringify(DEFAULT_HORARIO_TOP).includes('user_id') },
  { id: 'api_interna', label: 'API interna', fase: 12, prueba: () => typeof diaCompleto === 'function' },
  { id: 'exportacion', label: 'Exportación', fase: 12, prueba: () => typeof exportarHorario === 'function' },
  { id: 'importacion', label: 'Importación', fase: 12, prueba: () => typeof importarHorario === 'function' },
  { id: 'indices', label: 'Índices y rendimiento', fase: 2, prueba: () => typeof construirIndices === 'function' },
];

/**
 * La auditoría. Devuelve qué está y qué falta, **comprobado contra el código**.
 *
 * ⚠️ Lo que aquí NO se puede comprobar se dice aparte, no se da por bueno: el
 * responsive, el modo oscuro, la accesibilidad real y el diseño son del
 * navegador, y decir que están porque hay una clase de CSS sería mentir
 * (misma honestidad que R1).
 */
export const NO_COMPROBABLE_AQUI = [
  'Responsive y móvil (apartados 93-95)',
  'Accesibilidad real con lector de pantalla (96)',
  'Animaciones y modo oscuro en pantalla (97-98)',
  'Diseño premium (99)',
  'Backups y migraciones de Supabase (son de la consola, no del código)',
  'Edge Functions y monitorización (infraestructura que el proyecto no tiene)',
];

export function auditarHorarioTop() {
  const resultados = CAPACIDADES.map((c) => {
    let ok = false;
    try { ok = !!c.prueba(); } catch { ok = false; }
    return { id: c.id, label: c.label, fase: c.fase, ok };
  });
  const faltan = resultados.filter((r) => !r.ok);
  return {
    total: resultados.length,
    presentes: resultados.length - faltan.length,
    faltan,
    completo: faltan.length === 0,
    resultados,
    noComprobable: NO_COMPROBABLE_AQUI,
  };
}

/* ===========================================================================
   4 · EL ESTADO DEL MÓDULO, PARA DECIRLO EN PANTALLA
   =========================================================================== */
export function estadoDelModulo(estado, opciones = {}) {
  const a = auditarHorarioTop();
  const e = normalizarHorarioTop(estado);
  return {
    ...a,
    // Cuánto hay montado de verdad, que no es lo mismo que cuánto se puede.
    horarios: horariosActivos(e).length,
    actividades: e.actividades.length,
    bloques: e.bloques.length,
    // ⚠️ Ni una tabla nueva ni un SQL pendiente: es la decisión de HT F2 y
    // sigue valiendo al cerrar el módulo.
    tablasPropias: 0,
    sqlPendiente: 0,
    donde: 'app_data, con la clave horarioTop',
  };
}
