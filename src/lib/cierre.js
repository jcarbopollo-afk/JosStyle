// ============================================================================
// EH · Fase 65/65 — CIERRE, CONGELACIÓN Y ENTREGA FINAL
//
// *"Esta es la última fase de Estilo de hombre. No vamos a añadir funciones
// nuevas."*
//
// Y la condición final: *"Cuando esta fase termine, Estilo de hombre queda
// cerrado como módulo funcional. No significa que jamás pueda evolucionar.
// Significa que tenemos una **BASE ESTABLE v1.0**."*
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. 🚨 EL INFORME FINAL SE CALCULA, COMO LAS DOCE DE LA F64.** El apartado 18
// pide nueve líneas con ✅ / 🟡 / 🔴, y la tentación es escribir nueve ✅. Aquí
// cada una **sale de `condicionFinal()`**, que a su vez ejecuta la auditoría de
// cada fase. El informe no es una opinión sobre el módulo: es su estado.
//
// **2. 🚨 Y NO SALEN NUEVE VERDES.** Sale **un 🟡**: el móvil. Nadie ha abierto
// esto en un iPhone, y el apartado 17 es explícito — *"si algo falla: **no
// ocultarlo**. Registrarlo como pendiente."* Un informe de cierre con todo en
// verde sería el único sitio donde mentir sale gratis y cuesta caro después.
//
// **3. ⚠️ CONGELAR NO ES PROHIBIR: ES DECIR QUÉ SÍ SE PUEDE TOCAR** (apartado 1).
// Se cierra a funciones nuevas y se deja abierto a **correcciones, errores y
// ajustes imprescindibles**. Con la lista de qué cuenta como cada cosa, para que
// "esto es un ajuste imprescindible" no sea una excusa para añadir una pantalla.
//
// **4. ⚠️ EL INVENTARIO FINAL SE DERIVA.** Lo terminado, lo pendiente, lo
// bloqueado y lo futuro salen del `backlog()` de la F55, del `SE_POSPONE` de la
// F48 y de los `PENDIENTES` de la F61 — no de una lista nueva que se quedaría
// vieja el mismo día que se escribe.
//
// **5. 🚨 Y LO BLOQUEADO SE DISTINGUE DE LO PENDIENTE.** *"🔴 BLOQUEADO: lo que
// depende de otro sistema de JC Fitness."* No es lo mismo *"falta hacerlo"* que
// *"no se puede hacer desde aquí"*. El endpoint sin autenticación, los conflictos
// entre dispositivos y el backup global son **bloqueados**: los tres esperan una
// decisión que no es de este módulo.
// ============================================================================

import { MODULOS_EH, IDS_EH, VERSION_EH } from './estiloDeHombre';
import { condicionFinal, LAS_DOCE, recorridoCompleto, RECORRIDOS_E2E } from './pruebaFinal';
import { backlog, PRIORIDADES } from './escalabilidad';
import { SE_POSPONE, SISTEMAS_REVISADOS, RESPUESTA_FINAL } from './auditoriaFinal';
import { PENDIENTES as PENDIENTES_F61 } from './accionesRapidas';
import { HALLAZGO_ENDPOINT } from './seguridadEH';
import { LO_QUE_FALTA } from './recuperacion';
import { DEPENDENCIAS_GLOBALES, SECCIONES_DOC, DOCUMENTO } from './documentacionEH';
import { PARA_JOSUE } from './usabilidad';
import { GRAVEDADES } from './pruebasIntegrales';
import { todayISO } from './papelera';

/* ===========================================================================
   1 · LA CONGELACIÓN (apartados 1 y 15) — decisión 3
   =========================================================================== */

export const CONGELADO = true;

export const NO_SE_PUEDE = [
  { id: 'funciones', que: 'Funciones nuevas', icono: '❌' },
  { id: 'modulos', que: 'Módulos nuevos', icono: '❌' },
  { id: 'arquitectura', que: 'Cambios de arquitectura innecesarios', icono: '❌' },
];

export const SI_SE_PUEDE = [
  { id: 'correccion', que: 'Corregir algo que está mal', ejemplo: 'Un texto que se corta, una cuenta que sale al revés.' },
  { id: 'error', que: 'Arreglar un error', ejemplo: 'Algo que revienta o pierde datos.' },
  {
    id: 'ajuste', que: 'Un ajuste imprescindible',
    /* ⚠️ Y con el listón alto, para que no se convierta en la puerta de atrás. */
    ejemplo: 'Encender el aviso de "no se pudo guardar" (F52), que es la única cosa marcada como imprescindible en el backlog.',
    listonAlto: 'Si hace falta una pantalla nueva para hacerlo, no es un ajuste: es una función.',
  },
];

export const REGLA_DE_CAMBIO = 'Cualquier cambio futuro parte de esta versión y pasa por `bash scripts/verificar.sh` antes de darse por hecho.';

/* ===========================================================================
   2 · EL INVENTARIO FINAL (apartado 2) — decisiones 4 y 5
   ===========================================================================
   *"✅ TERMINADO · 🟡 PENDIENTE · 🔴 BLOQUEADO · 💡 FUTURO."* */

export const ESTADOS_CIERRE = [
  { id: 'terminado', icono: '✅', que: 'Funciona correctamente.' },
  { id: 'pendiente', icono: '🟡', que: 'Todavía necesita trabajo, y se puede hacer aquí.' },
  { id: 'bloqueado', icono: '🔴', que: 'Depende de otro sistema de JC Fitness, o de una decisión de Josué.' },
  { id: 'futuro', icono: '💡', que: 'Deliberadamente no implementado.' },
];

export const estadoCierre = (id) => ESTADOS_CIERRE.find((e) => e.id === id) || null;

/* 🚨 Decisión 5 — lo bloqueado, uno a uno, con de quién depende. */
export const BLOQUEADO = [
  {
    id: 'endpoint_sin_auth',
    que: HALLAZGO_ENDPOINT.que,
    dependeDe: 'Toda la aplicación: ese endpoint lo usan seis módulos más.',
    decide: 'Josué',
    arreglo: HALLAZGO_ENDPOINT.arreglo,
  },
  {
    id: 'conflictos',
    que: 'Detectar conflictos entre dispositivos.',
    dependeDe: 'El esquema de `app_data`: hace falta una columna de versión o marca de tiempo.',
    decide: 'Una decisión de esquema (F41, F45, F46, F54 y F64)',
    arreglo: 'Añadir la columna y una política de resolución. No es un parche.',
  },
  {
    id: 'sistema_global',
    que: 'Un sistema global de copias de seguridad.',
    dependeDe: 'JC Fitness entero. Y el enunciado de la F54 prohíbe crear uno separado.',
    decide: 'Josué',
    arreglo: 'Cuando exista, Estilo de hombre se engancha: ya tiene su `copiaDeSeguridad()`.',
  },
  {
    id: 'favoritos_globales',
    que: 'Un sistema de favoritos común a toda la aplicación.',
    dependeDe: 'Los otros módulos, que hoy tienen los suyos.',
    decide: 'Una fase futura',
    arreglo: 'Unificarlos es una fase, no un arreglo (F39 y F48).',
  },
];

/** 🟡 Pendiente: lo que **sí** se puede hacer aquí, y no se ha hecho. */
export function pendiente() {
  const bloqueados = BLOQUEADO.map((b) => b.id);
  return [
    ...backlog()
      .filter((b) => !bloqueados.includes(b.id) && b.estado !== 'descartado')
      .filter((b) => b.prioridad === 'imprescindible' || b.prioridad === 'importante')
      .map((b) => ({ id: b.id, que: b.idea, prioridad: b.prioridad, de: b.de })),
    ...PENDIENTES_F61.map((p) => ({ id: p.id, que: p.que, prioridad: 'interesante', de: 'F61' })),
  ];
}

/** 💡 Futuro: lo que se decidió no hacer. */
export const futuro = () => SE_POSPONE.map((s) => ({ id: s.id, que: s.que, porque: s.porque }));

/** ✅ Terminado: los apartados del módulo, y las fases de revisión. */
export function terminado() {
  return {
    modulos: MODULOS_EH.length,
    conPantalla: MODULOS_EH.filter((m) => m.fase <= 30).length,
    fases: 65,
    sistemasRevisados: SISTEMAS_REVISADOS.length,
    recorridosE2E: RECORRIDOS_E2E.filter((r) => r.como !== 'josue' && r.como !== 'declarado').length,
  };
}

export function inventarioFinal() {
  return {
    terminado: terminado(),
    pendiente: pendiente(),
    bloqueado: BLOQUEADO,
    futuro: futuro(),
  };
}

/* ===========================================================================
   3 · LA ETIQUETA DE VERSIÓN (apartado 12)
   =========================================================================== */

export const VERSION = {
  nombre: 'JC Fitness — Estilo de hombre v1.0',
  esquemaDeDatos: VERSION_EH,
  fases: '65 de 65',
  estado: 'Base estable. Cerrado a funciones nuevas.',
  dependencias: DEPENDENCIAS_GLOBALES.filter((d) => d.usa).map((d) => d.nombre),
  noUsa: DEPENDENCIAS_GLOBALES.filter((d) => !d.usa).map((d) => d.nombre),
  sql: 'Ninguno. Sesenta y cinco fases y cero cambios de esquema.',
};

export const etiqueta = ({ hoy = todayISO() } = {}) => ({ ...VERSION, fecha: hoy });

/* ===========================================================================
   4 · 🚨 EL INFORME FINAL (apartado 18) — decisiones 1 y 2
   ===========================================================================
   *"Funcionalidad: ✅/🟡/🔴 · Diseño · UX · Datos · IA · Seguridad ·
   Rendimiento · Móvil · Integración. Y después: pendientes restantes."* */

export const LINEAS_DEL_INFORME = [
  { id: 'funcionalidad', nombre: 'Funcionalidad', de: 'funcionalidad' },
  { id: 'diseno', nombre: 'Diseño', de: 'diseno' },
  { id: 'ux', nombre: 'UX', de: 'ux' },
  { id: 'datos', nombre: 'Datos', de: 'datos' },
  { id: 'ia', nombre: 'IA', de: 'ia' },
  { id: 'seguridad', nombre: 'Seguridad', de: 'seguridad' },
  { id: 'rendimiento', nombre: 'Rendimiento', de: 'rendimiento' },
  { id: 'movil', nombre: 'Móvil', de: 'movil' },
  { id: 'integracion', nombre: 'Integración', de: 'integracion' },
];

/**
 * 🚨 Decisión 1 — cada línea sale de `condicionFinal()`, que ejecuta la
 * auditoría de su fase. Aquí no se escribe ni un ✅.
 *
 * ⚠️ Y hay tres estados, no dos: **🟡 es "funciona pero no se ha comprobado
 * donde importa"**, que es exactamente el caso del móvil. Ponerlo 🔴 diría que
 * está roto —y no lo sabemos— y ponerlo ✅ diría que se ha probado.
 */
export function informeFinal(opciones = {}) {
  const c = condicionFinal(opciones);
  return LINEAS_DEL_INFORME.map((l) => {
    const casilla = c[l.de];
    let estado = 'terminado';
    if (!casilla.ok) {
      /* ⚠️ Bloqueado si depende de otro sistema; pendiente si es cosa de mirar. */
      estado = BLOQUEADO.some((b) => new RegExp(b.id.split('_')[0], 'i').test(l.de)) ? 'bloqueado' : 'pendiente';
      if (l.de === 'sincronizacion') estado = 'bloqueado';
      if (l.de === 'movil') estado = 'pendiente';
    }
    return {
      id: l.id,
      nombre: l.nombre,
      estado,
      icono: estadoCierre(estado).icono,
      de: casilla.de,
      porque: casilla.porque || null,
      matiz: casilla.matiz || null,
    };
  });
}

export const informeEnVerde = (informe) => informe.filter((l) => l.estado === 'terminado').length;

/* ===========================================================================
   5 · LO QUE HAY QUE SABER PARA SEGUIR (apartados 13, 14 y 16)
   =========================================================================== */

export const DOCUMENTACION = {
  tecnica: DOCUMENTO,
  publicar: 'PUBLICAR.md',
  historial: 'CHANGELOG.md',
  fases: 'docs/07_CHECKLIST_ENTREGA2.md',
  apartadosCubiertos: SECCIONES_DOC.length,
};

/** Apartado 14 — el backlog no se queda perdido dentro del código. */
export const BACKLOG_AL_GLOBAL = {
  donde: 'backlog() en `escalabilidad.js`, derivado de la F48, la F52 y la F54.',
  cuantas: backlog().length,
  regla: 'Ninguna idea descartada se queda en un comentario: todas están en esa lista, con prioridad y motivo.',
};

/** Apartado 16 — deja de ser un proyecto aparte. */
export const ES_MODULO_OFICIAL = {
  usa: DEPENDENCIAS_GLOBALES.filter((d) => d.usa).length,
  de: DEPENDENCIAS_GLOBALES.length,
  hace: RESPUESTA_FINAL.hace,
  noHace: RESPUESTA_FINAL.noHace,
  regla: RESPUESTA_FINAL.regla,
};

/* ===========================================================================
   6 · EL CRITERIO DE ENTREGA (apartado 17) — decisión 2
   =========================================================================== */

export const TEXTOS_CIERRE = {
  criterio: 'Solo se marca 🟢 FINALIZADO si se cumplen todos los requisitos. Si algo falla: no se oculta, se registra como pendiente.',
  condicion: 'Estilo de hombre queda cerrado como módulo funcional. No significa que jamás pueda evolucionar: significa que hay una BASE ESTABLE v1.0 sobre la que construir sin volver a empezar.',
  loQueFalta: 'Lo que falta no está escondido: está en el inventario, con quién lo decide y cuál es el arreglo.',
  gracias: 'Sesenta y cinco fases: arquitectura → módulos → personalización → datos → UX → IA → contexto → accesibilidad → seguridad → copias → escalabilidad → pruebas → producción → cierre.',
};

/* ===========================================================================
   7 · LOS DIECIOCHO APARTADOS
   =========================================================================== */

export const APARTADOS_CIERRE = [
  { id: 1, nombre: 'Congelar funcionalidades', donde: 'CONGELADO · NO_SE_PUEDE · SI_SE_PUEDE' },
  { id: 2, nombre: 'Inventario final', donde: 'inventarioFinal()' },
  { id: 3, nombre: 'Comprobar que no haya duplicados', donde: 'F48 · SISTEMAS_REVISADOS' },
  { id: 4, nombre: 'Revisión de diseño', donde: 'F49 · panelCoherencia()' },
  { id: 5, nombre: 'Revisión de UX', donde: 'F51 · panelExperiencia()' },
  { id: 6, nombre: 'Revisión de datos', donde: 'F64 · recorridoCompleto()' },
  { id: 7, nombre: 'Revisión de IA', donde: 'F56, F57, F58, F59 y F60' },
  { id: 8, nombre: 'Revisión de seguridad', donde: 'F63 · panelSeguridad()' },
  { id: 9, nombre: 'Revisión multidispositivo', donde: '🟡 R1 — nadie lo ha abierto en un móvil' },
  { id: 10, nombre: 'Rendimiento final', donde: 'F44 y F55' },
  { id: 11, nombre: 'Backup final', donde: 'La etiqueta de esta versión, y el repositorio' },
  { id: 12, nombre: 'Etiquetar versión', donde: 'VERSION · etiqueta()' },
  { id: 13, nombre: 'Documentación final', donde: 'DOCUMENTACION · docs/08 y docs/09' },
  { id: 14, nombre: 'Backlog futuro', donde: 'BACKLOG_AL_GLOBAL' },
  { id: 15, nombre: 'No romper lo terminado', donde: 'REGLA_DE_CAMBIO' },
  { id: 16, nombre: 'Integración con JC Fitness', donde: 'ES_MODULO_OFICIAL' },
  { id: 17, nombre: 'Criterio de entrega', donde: 'TEXTOS_CIERRE.criterio' },
  { id: 18, nombre: 'Informe final', donde: 'informeFinal()' },
];

export const apartadoCierre = (id) => APARTADOS_CIERRE.find((a) => a.id === id) || null;

/* ===========================================================================
   8 · EL PARTE
   =========================================================================== */

export function auditarCierre(opciones = {}) {
  const informe = informeFinal(opciones);
  const inv = inventarioFinal();
  const e2e = recorridoCompleto();
  return {
    congelado: CONGELADO,
    // Decisión 1 — nueve líneas, calculadas
    lineas: informe.length,
    verdes: informeEnVerde(informe),
    // 🚨 Decisión 2 — y no son nueve
    noVerdes: informe.filter((l) => l.estado !== 'terminado').map((l) => l.id),
    sinMotivo: informe.filter((l) => l.estado !== 'terminado' && !l.porque).map((l) => l.id),
    // Decisión 5
    bloqueados: inv.bloqueado.length,
    bloqueadosSinDueno: inv.bloqueado.filter((b) => !b.decide || !b.arreglo).map((b) => b.id),
    pendientes: inv.pendiente.length,
    futuras: inv.futuro.length,
    // Todo lo del inventario tiene estado
    estados: ESTADOS_CIERRE.length,
    // El recorrido de la F64 sigue pasando
    e2eOk: e2e.ok,
    // Apartado 16
    dependenciasUsadas: ES_MODULO_OFICIAL.usa,
    sinDonde: APARTADOS_CIERRE.filter((a) => !a.donde).map((a) => a.id),
  };
}

export function panelCierre(opciones = {}) {
  const a = auditarCierre(opciones);
  const informe = informeFinal(opciones);
  return {
    ...a,
    informe,
    inventario: inventarioFinal(),
    version: etiqueta(opciones),
    documentacion: DOCUMENTACION,
    apartados: APARTADOS_CIERRE,
    gravedades: GRAVEDADES,
    /* 🎯 El veredicto: **cerrado y entregado, con lo que falta dicho**. No es
       "todo perfecto": es que **nada está escondido**. Un cierre honesto es el
       que se puede leer dentro de seis meses sin sorpresas. */
    entregado: a.congelado
      && a.lineas === 9
      && a.sinMotivo.length === 0
      && a.bloqueadosSinDueno.length === 0
      && a.e2eOk
      && a.sinDonde.length === 0,
    criterio: TEXTOS_CIERRE.criterio,
    condicion: TEXTOS_CIERRE.condicion,
  };
}

export { MODULOS_EH, IDS_EH, VERSION_EH, LAS_DOCE, condicionFinal, backlog, PRIORIDADES,
  SE_POSPONE, HALLAZGO_ENDPOINT, LO_QUE_FALTA, DEPENDENCIAS_GLOBALES, PARA_JOSUE,
  GRAVEDADES, todayISO, RESPUESTA_FINAL };
