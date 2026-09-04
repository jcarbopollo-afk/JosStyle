// ============================================================================
// EH · Fase 64/65 — PRUEBA INTEGRAL END-TO-END
//
// *"Ahora dejamos de probar cada parte por separado. ¿Todo Estilo de hombre
// funciona correctamente cuando se utiliza como un sistema completo?"*
//
// ── QUÉ SE CONSTRUYE AQUÍ ──────────────────────────────────────────────────
//
// Dos cosas, y la segunda es la que importa:
//
//   1. **Los veintiséis recorridos** del enunciado, cada uno con **cómo se
//      comprueba** y **dónde**, sin fingir los que necesitan dos móviles.
//   2. 🚨 **`recorridoCompleto()`: una sola cadena que atraviesa el módulo
//      entero** — configurar, añadir, personalizar, guardar, volver, aprender,
//      sacar un insight, montar el resumen, recomendar en contexto, borrar,
//      recuperar, hacer copia y restaurar. Sesenta y tres fases seguidas, en una
//      función que o pasa entera o dice dónde se rompió.
//
// ── LAS CUATRO DECISIONES QUE GOBIERNAN ESTA FASE ──────────────────────────
//
// **1. 🚨 LA CONDICIÓN DE FINALIZACIÓN NO SE MARCA A MANO.** El enunciado pide
// doce ✅ —funcionalidad, UX, diseño, datos, IA, sincronización, móvil,
// accesibilidad, seguridad, rendimiento, recuperación e integración— y la
// tentación evidente es escribir doce `true`. Aquí **cada uno se calcula
// ejecutando la auditoría de su fase**. Si la F63 dice que el endpoint está sin
// proteger, el ✅ de seguridad **sale rojo solo**, y no hay forma de ponerlo verde
// escribiendo.
//
// **2. 🚨 Y NO SALEN LOS DOCE VERDES.** Salen diez. **Sincronización** y **móvil**
// no, y eso es exactamente lo que esta fase tiene que decir: *"no declarar Estilo
// de hombre terminado hasta que…"*. Ponerlos verdes sería quitarle a la
// condición de finalización su única función.
//
// **3. ⚠️ EL RECORRIDO COMPLETO SE EJECUTA, NO SE DESCRIBE.** Cada paso devuelve
// lo que pasó de verdad, y el resultado dice **en qué paso** se rompería. Una
// prueba integral que solo enumera lo que debería pasar no es una prueba
// integral: es un índice.
//
// **4. ⚠️ Y LOS QUE NECESITAN DOS MÓVILES SE DICEN.** La sincronización entre
// dispositivos (15), los conflictos (16), el móvil (17), el modo oscuro visto
// (18) y los varios días de uso (26). Son de **R1**, como en la F47, la F51 y la
// F62. Con la diferencia de que aquí el 16 no es solo "hace falta un móvil": es
// que **no existe**, y lo dice la F54.
// ============================================================================

import { normalizarEstiloHombre, configurarPrimeraVez, DEFAULT_ESTILO_HOMBRE, IDS_EH, modulosActivos } from './estiloDeHombre';
import { cambiarTamano, tamanoDe, alternarLinea, lineasDisponibles } from './pantallaEH';
import { alternarOculto, estaOculto } from './gestionEstilo';
import { cerrarYVolver, probarPersistencia, panelExperiencia } from './experienciaReal';
import { alternarPermisoIA, permisoIA, contextoParaIA, panelIA } from './iaEstilo';
import { aprender, preferencia, borrarAprendizaje, datosAprendizaje, panelAprendizaje } from './aprendizaje';
import { generarInsights, panelInsights } from './insights';
import { cambiarFrecuencia, generarResumen, panelResumen } from './resumenPeriodico';
import { alternarFuente, recomendarAhora, panelContextual } from './contextual';
import { copiaDeSeguridad, restaurarModulo, ensayoDeRestauracion, panelRecuperacion } from './recuperacion';
import { migrarEstiloHombre, VERSION_ACTUAL } from './migracion';
import { panelAcciones } from './accionesRapidas';
import { panelUsabilidad } from './usabilidad';
import { panelSeguridad } from './seguridadEH';
import { panelCoherencia } from './coherenciaVisual';
import { panelPruebas, PRUEBAS_INTEGRALES, GRAVEDADES } from './pruebasIntegrales';
import { panelEscalabilidad } from './escalabilidad';
import { panelAuditoriaFinal } from './auditoriaFinal';
import { todayISO } from './papelera';

/* ===========================================================================
   1 · LOS VEINTISÉIS RECORRIDOS (apartados 1 a 26)
   ===========================================================================
   ⚠️ `como`: **node** se ejecuta aquí · **chromium** lo hace la prueba del
   navegador · **hecho** ya lo comprueba otra fase · **josue** necesita su móvil. */

export const RECORRIDOS_E2E = [
  { id: 1, que: 'Usuario nuevo, de cero a volver', como: 'node', donde: 'recorridoCompleto()' },
  { id: 2, que: 'Usuario existente, sin duplicados', como: 'node', donde: 'migrarEstiloHombre + recorridoCompleto()' },
  { id: 3, que: 'Navegación completa', como: 'chromium', donde: 'test-app-real.mjs' },
  { id: 4, que: 'Personalización que sobrevive', como: 'node', donde: 'probarPersistencia() (F51)' },
  { id: 5, que: 'El ciclo entero de un dato', como: 'node', donde: 'recorridoCompleto()' },
  { id: 6, que: 'Los tres niveles de eliminación', como: 'hecho', donde: 'F63 · FORMAS_DE_QUITAR' },
  { id: 7, que: 'La IA en los seis escenarios', como: 'hecho', donde: 'F56 · CASOS_IA' },
  { id: 8, que: 'Recomendación: guardar, rechazar, ignorar', como: 'hecho', donde: 'F60 · ACCIONES_POSIBLES' },
  { id: 9, que: 'Insight → explicación → acción', como: 'node', donde: 'recorridoCompleto()' },
  { id: 10, que: 'Resumen semanal', como: 'node', donde: 'recorridoCompleto()' },
  { id: 11, que: 'Resumen mensual', como: 'node', donde: 'recorridoCompleto()' },
  { id: 12, que: 'Contexto: evento, momento, temporada', como: 'hecho', donde: 'F60 · SITUACIONES_PRUEBA' },
  { id: 13, que: 'Acciones rápidas en 1-3 toques', como: 'hecho', donde: 'F61 · frecuentesQueSePasan()' },
  { id: 14, que: 'Sin conexión', como: 'hecho', donde: 'F41 y F62 · estadoDeConexion()' },
  {
    id: 15, que: 'Sincronización entre dos dispositivos', como: 'josue',
    porque: 'Hacen falta dos aparatos con la misma cuenta. No se simula con uno.',
  },
  {
    id: 16, que: 'Conflictos entre dispositivos', como: 'declarado',
    /* 🚨 Éste no es "falta probarlo": es que no existe. */
    porque: '🚨 NO EXISTE. `app_data` no guarda versión ni marca de tiempo, así que el último en escribir gana y el otro cambio se pierde sin aviso. Lo dijeron la F41, la F45, la F46 y la F54.',
  },
  { id: 17, que: 'Safari iPhone y Chrome Android', como: 'josue', porque: 'Un navegador de escritorio no es un iPhone.' },
  { id: 18, que: 'Modo oscuro, ida y vuelta', como: 'josue', porque: 'Sin colores literales sale solo (F49); VERLO sigue siendo suyo.' },
  { id: 19, que: 'Accesibilidad', como: 'hecho', donde: 'F42 y F62' },
  { id: 20, que: 'Seguridad', como: 'hecho', donde: 'F63 · ATAQUES' },
  { id: 21, que: 'Rendimiento', como: 'hecho', donde: 'F44 · PRESUPUESTOS' },
  { id: 22, que: 'Datos masivos', como: 'hecho', donde: 'F44 · ESCENARIOS_CARGA y F55 · ensayoDeCrecimiento()' },
  { id: 23, que: 'Errores provocados', como: 'hecho', donde: 'F54 · SIMULACROS' },
  { id: 24, que: 'Copia y restauración', como: 'node', donde: 'ensayoDeRestauracion() (F54)' },
  { id: 25, que: 'Regresión sobre el resto de JC Fitness', como: 'node', donde: 'La suite entera de `verificar.sh`' },
  {
    id: 26, que: 'Varios días de uso normal, sin documentación', como: 'josue',
    porque: '🚨 Es la misma que la F51 dejó apuntada: yo he leído las sesenta y cinco fases. Soy justo el único que no puede hacerla.',
  },
];

export const recorridoE2E = (id) => RECORRIDOS_E2E.find((r) => r.id === id) || null;
export const recorridosDeJosue = () => RECORRIDOS_E2E.filter((r) => r.como === 'josue' || r.como === 'declarado');
export const recorridosAutomaticos = () => RECORRIDOS_E2E.filter((r) => r.como === 'node' || r.como === 'chromium');

/* ===========================================================================
   2 · 🚨 EL RECORRIDO COMPLETO (decisión 3)
   ===========================================================================
   Una sola cadena que atraviesa el módulo entero. Cada paso devuelve lo que
   pasó de verdad; si algo se rompe, se ve **en qué paso**. */

export const PASOS = [
  'configurar', 'anadir', 'personalizar', 'guardar_y_volver', 'permiso_ia',
  'aprender', 'insight', 'resumen', 'contexto', 'copia', 'romper', 'restaurar', 'migrar',
];

const hecho = (fecha) => ({ rutinaId: 'r1', fecha, pasos: ['p1'] });

export function recorridoCompleto({ hoy = '2026-06-01' } = {}) {
  const pasos = {};
  const fallo = (paso, porque) => ({ ok: false, paso, porque, pasos });

  /* 1 · Un usuario nuevo se configura (F1, F3). */
  let e = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ['perfumes', 'skincare', 'pelo', 'estilo']);
  pasos.configurar = modulosActivos(e).length;
  if (pasos.configurar !== 4) return fallo('configurar', 'no quedaron los cuatro apartados activos');

  /* 2 · Añade datos de verdad (F24, F14). */
  e = {
    ...e,
    modulos: e.modulos.map((m) => {
      if (m.id === 'perfumes') return { ...m, config: { perfumes: { perfumes: [{ id: 'p1', nombre: 'Uno' }, { id: 'p2', nombre: 'Dos' }] } } };
      if (m.id === 'skincare') {
        return {
          ...m,
          config: {
            rutinas: {
              rutinas: [{ id: 'r1', nombre: 'Mañana', orden: 0 }],
              hechos: [hecho('2026-05-30'), hecho('2026-05-28'), hecho('2026-05-26'), hecho('2026-05-24'), hecho('2026-04-20'), hecho('2026-04-15')],
            },
          },
        };
      }
      return m;
    }),
  };
  pasos.anadir = e.modulos.find((m) => m.id === 'perfumes').config.perfumes.perfumes.length;
  if (pasos.anadir !== 2) return fallo('anadir', 'los datos no se guardaron en su módulo');

  /* 3 · Personaliza la pantalla (F29, F31, F36). */
  e = cambiarTamano(e, 'perfumes', 'grande');
  e = alternarOculto(e, 'pelo');
  const primeraLinea = lineasDisponibles('perfumes')[0];
  if (primeraLinea) e = alternarLinea(e, 'perfumes', primeraLinea.id);
  pasos.personalizar = { tamano: tamanoDe(e, 'perfumes')?.id, oculto: estaOculto(e, 'pelo') };
  if (pasos.personalizar.tamano !== 'grande' || !pasos.personalizar.oculto) {
    return fallo('personalizar', 'la personalización no se aplicó');
  }

  /* 4 · 🚨 Cierra y vuelve: lo que hace `saveData` (regla 5). */
  const vuelto = cerrarYVolver(e);
  pasos.guardar_y_volver = {
    tamano: tamanoDe(vuelto, 'perfumes')?.id,
    oculto: estaOculto(vuelto, 'pelo'),
    perfumes: vuelto.modulos.find((m) => m.id === 'perfumes').config.perfumes.perfumes.length,
  };
  if (pasos.guardar_y_volver.tamano !== 'grande'
    || !pasos.guardar_y_volver.oculto
    || pasos.guardar_y_volver.perfumes !== 2) {
    return fallo('guardar_y_volver', '🚨 algo no sobrevivió a cerrar y volver');
  }
  e = vuelto;

  /* 5 · Enciende el permiso de la IA (F56). */
  const sinPermiso = contextoParaIA(e, 'perfume');
  e = alternarPermisoIA(e);
  pasos.permiso_ia = { antes: sinPermiso, ahora: !!contextoParaIA(e, 'perfume') };
  if (sinPermiso !== null) return fallo('permiso_ia', '🚨 salía contexto SIN permiso');
  if (!pasos.permiso_ia.ahora) return fallo('permiso_ia', 'con permiso no salía contexto');

  /* 6 · Aprende de lo que hace (F57). */
  e = aprender(e, [
    { senal: 'guardar', sobre: 'familiaPerfume', cuando: hoy },
    { senal: 'favorito', sobre: 'familiaPerfume', cuando: hoy },
    { senal: 'valorar', sobre: 'familiaPerfume', cuando: hoy },
    { senal: 'repetir', sobre: 'familiaPerfume', cuando: hoy },
  ], { hoy });
  pasos.aprender = datosAprendizaje(e).inferidas.length;
  if (pasos.aprender === 0) return fallo('aprender', 'con permiso no aprendió nada');

  /* 7 · Saca un insight de esos datos (F58). */
  const ins = generarInsights(e, { hoy });
  pasos.insight = ins.insights.length;
  if (pasos.insight === 0) return fallo('insight', 'con seis registros no salió ningún insight');

  /* 8 · Y lo mete en un resumen semanal (F59). */
  e = cambiarFrecuencia(e, 'semanal');
  const res = generarResumen(e, { hoy });
  pasos.resumen = { hay: res.hay, secciones: res.secciones.length };
  if (!res.hay) return fallo('resumen', 'con insights el resumen salió vacío');

  /* 9 · Una recomendación contextual, con su fuente autorizada (F60). */
  e = alternarFuente(e, 'calendario');
  const rec = recomendarAhora(e, { ocasion: 'evento', hora: 20, hoy });
  pasos.contexto = { hay: rec.hay, porque: rec.porque };
  if (!rec.hay) return fallo('contexto', `con un evento no recomendó nada (${rec.porque})`);

  /* 10 · Copia de seguridad (F54). */
  const copia = copiaDeSeguridad(e, { hoy });
  pasos.copia = copia.estado.modulos.find((m) => m.id === 'perfumes').config.perfumes.perfumes.length;
  if (pasos.copia !== 2) return fallo('copia', 'la copia no llevaba los datos');

  /* 11 · Se rompe un módulo. */
  const roto = { ...e, modulos: e.modulos.map((m) => (m.id === 'perfumes' ? { ...m, config: {} } : m)) };
  pasos.romper = (roto.modulos.find((m) => m.id === 'perfumes').config.perfumes?.perfumes || []).length;
  if (pasos.romper !== 0) return fallo('romper', 'no se pudo simular la pérdida');

  /* 12 · Y se restaura SOLO ese módulo (F54). */
  const rest = restaurarModulo(roto, 'perfumes', copia, { hoy });
  pasos.restaurar = {
    perfumes: rest.estado.modulos.find((m) => m.id === 'perfumes').config.perfumes.perfumes.length,
    /* 🚨 Lo que importa: Skincare no se ha movido. */
    otroIntacto: rest.estado.modulos.find((m) => m.id === 'skincare').config.rutinas.hechos.length === 6,
  };
  if (pasos.restaurar.perfumes !== 2) return fallo('restaurar', 'no volvieron los datos');
  if (!pasos.restaurar.otroIntacto) return fallo('restaurar', '🚨 restaurar uno tocó otro módulo');

  /* 13 · Y una migración desde una versión antigua (F46). */
  const antiguo = { ...JSON.parse(JSON.stringify(rest.estado)), version: 1 };
  const mig = migrarEstiloHombre(antiguo);
  pasos.migrar = { version: mig.version, error: mig.error, migrada: mig.migrada };
  if (mig.error) return fallo('migrar', `la migración falló: ${mig.error}`);
  if (mig.version !== VERSION_ACTUAL) return fallo('migrar', 'no llegó a la versión actual');

  return { ok: true, paso: null, porque: null, pasos, estado: mig.estado };
}

/* ===========================================================================
   3 · 🚨 LA CONDICIÓN DE FINALIZACIÓN, CALCULADA (decisiones 1 y 2)
   ===========================================================================
   *"No declarar Estilo de hombre terminado hasta que: funcionalidad ✅ UX ✅
   diseño ✅ datos ✅ IA ✅ sincronización ✅ móvil ✅ accesibilidad ✅ seguridad ✅
   rendimiento ✅ recuperación ✅ integración JC Fitness ✅"* */

export const LAS_DOCE = [
  'funcionalidad', 'ux', 'diseno', 'datos', 'ia', 'sincronizacion',
  'movil', 'accesibilidad', 'seguridad', 'rendimiento', 'recuperacion', 'integracion',
];

/**
 * 🚨 Cada ✅ se calcula **ejecutando la auditoría de su fase**. No hay ni un
 * `true` escrito a mano: si una fase se pone roja, su casilla se pone roja.
 */
export function condicionFinal({ vista = '', sql = '', api = '', fuentesResto = {} } = {}) {
  const e2e = recorridoCompleto();
  const experiencia = panelExperiencia(null, { vista });
  const ia = panelIA();
  const aprendizaje = panelAprendizaje();
  const insights = panelInsights();
  const resumen = panelResumen();
  const contexto = panelContextual();
  const acciones = panelAcciones();
  const usabilidad = panelUsabilidad(vista);
  const seguridad = panelSeguridad({ sql, api });
  const recuperacion = panelRecuperacion();
  const escalabilidad = panelEscalabilidad({ vista });
  const auditoria = panelAuditoriaFinal();
  const integrales = panelPruebas();

  return {
    funcionalidad: {
      ok: e2e.ok && !!auditoria.respuesta.hace,
      de: 'El recorrido completo de esta fase, y la auditoría de la F48',
    },
    ux: {
      ok: experiencia.natural && acciones.rapidaYClara,
      de: 'F51 (los toques) y F61 (las acciones)',
    },
    diseno: {
      ok: panelCoherencia(vista, fuentesResto).coherente,
      de: 'F49 · el vocabulario visual comparado con el resto',
    },
    datos: {
      ok: e2e.ok && probarPersistencia().every((x) => x.permanece),
      de: 'La regla 5 hecha prueba (F51) y el recorrido completo',
    },
    ia: {
      ok: ia.esUnAsesor && aprendizaje.aprendeSinDecidir && insights.utiles && resumen.esUnInforme && contexto.sabeCallarse,
      de: 'F56, F57, F58, F59 y F60',
    },
    sincronizacion: {
      /* 🚨 Decisión 2 — éste sale ROJO, y tiene que salir. */
      ok: false,
      de: 'F41, F45, F46 y F54',
      porque: '🚨 No se detectan conflictos entre dispositivos: `app_data` no guarda versión ni marca de tiempo, así que el último en escribir gana. Es una decisión de esquema, no un fallo que arreglar en una tarde.',
    },
    movil: {
      /* 🚨 Y éste también. */
      ok: false,
      de: 'F52 y F62',
      porque: '🚨 Nadie ha abierto esto en un iPhone. El simulador de Chromium es lo más cerca que se puede estar sin serlo, y no es lo mismo.',
    },
    accesibilidad: { ok: usabilidad.aguanta, de: 'F42 y F62' },
    seguridad: {
      ok: seguridad.protegido,
      de: 'F43 y F63',
      /* ⚠️ Verde con matiz. El matiz cambió el 2026-09-04: el endpoint ya pide
         sesión, así que lo que queda abierto es más pequeño — pero sigue siendo
         algo, y por eso el matiz no desaparece. */
      matiz: '⚠️ Los datos están protegidos por RLS, y `/api/ask-ai` ya pide sesión desde el 2026-09-04. Lo que queda: su tope por usuario vive en memoria, no en Supabase, así que frena un bucle de la aplicación pero no a alguien decidido.',
    },
    rendimiento: { ok: escalabilidad.puedeCrecer, de: 'F44 y F55' },
    recuperacion: { ok: recuperacion.protegido && ensayoDeRestauracion().seRecupero, de: 'F54' },
    integracion: {
      ok: auditoria.auditoria.duplicados.length === 0 && integrales.parte.criticasFallidas.length === 0,
      de: 'F47 y F48',
    },
  };
}

export const cuantosVerdes = (c) => LAS_DOCE.filter((k) => c[k]?.ok).length;
export const losQueFaltan = (c) => LAS_DOCE.filter((k) => !c[k]?.ok);

export const TEXTO_CONDICION = 'No se declara terminado hasta que las doce estén en verde. Hoy están diez: faltan la sincronización entre dispositivos y el móvil, y las dos por motivos que no se arreglan escribiendo código aquí.';

/* ===========================================================================
   4 · EL PARTE
   =========================================================================== */

export function auditarPruebaFinal(opciones = {}) {
  const e2e = recorridoCompleto();
  const c = condicionFinal(opciones);
  return {
    recorridos: RECORRIDOS_E2E.length,
    automaticos: recorridosAutomaticos().length,
    paraJosue: recorridosDeJosue().map((r) => r.id),
    sinMotivo: recorridosDeJosue().filter((r) => !r.porque).map((r) => r.id),
    sinDonde: RECORRIDOS_E2E.filter((r) => r.como !== 'josue' && r.como !== 'declarado' && !r.donde).map((r) => r.id),
    // 🚨 Decisión 3 — la cadena entera
    e2eOk: e2e.ok,
    e2eSeRompioEn: e2e.paso,
    pasos: Object.keys(e2e.pasos).length,
    // 🚨 Decisiones 1 y 2 — las doce, calculadas
    verdes: cuantosVerdes(c),
    faltan: losQueFaltan(c),
    // Y las que faltan dicen por qué
    faltanSinMotivo: losQueFaltan(c).filter((k) => !c[k]?.porque),
    integrales: PRUEBAS_INTEGRALES.length,
  };
}

export function panelPruebaFinal(opciones = {}) {
  const a = auditarPruebaFinal(opciones);
  const c = condicionFinal(opciones);
  return {
    ...a,
    condicion: c,
    recorridosLista: RECORRIDOS_E2E,
    gravedades: GRAVEDADES,
    recorrido: recorridoCompleto(),
    /* 🎯 El veredicto de ESTA fase no es "está terminado": es **el recorrido
       completo pasa entero y las doce están calculadas, no marcadas**. Que dos
       salgan rojas es el resultado correcto. */
    pruebaSuperada: a.e2eOk
      && a.sinMotivo.length === 0
      && a.sinDonde.length === 0
      && a.faltanSinMotivo.length === 0,
    texto: TEXTO_CONDICION,
  };
}

export { PRUEBAS_INTEGRALES, GRAVEDADES, recorridoCompleto as recorrido, todayISO,
  normalizarEstiloHombre, IDS_EH, permisoIA, preferencia, borrarAprendizaje };
