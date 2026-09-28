// ============================================================================
// FIT · Fase 41/45 — PERSISTENCIA, RECUPERACIÓN Y RESILIENCIA DE FITNESS
//
// *"Que el usuario pueda cerrar, recargar, volver a abrir o experimentar un
// fallo sin perder información válida."* Y el «IMPORTANTE» que manda sobre todo
// lo demás: **"NO crear una nueva arquitectura de backend. Utilizar la capa de
// persistencia existente."**
//
// ── LO QUE YA ESTABA, Y ERA CASI TODO ───────────────────────────────────────
//
// Fitness es UNA clave de `app_data` (`fitness`), que se sube entera en cada
// guardado —así que cada guardado ya es atómico: no existe el estado «se guardó
// el ejercicio pero no la sesión» dentro de Fitness—. La sesión en curso vive
// dentro, se recupera al volver (F7) y se guarda en cada cambio (F40, sin
// guardar en cada tecla); terminar es idempotente (F8); descartar toca solo
// esa sesión; los rangos y su historial se derivan (F15, F22) con una caché
// que se tira al cambiar lo que usa (F40); las fotos se guardan como camino
// (F26); los ids son ranuras estables (F2)… `YA_EXISTIA_F41` lo dice línea a
// línea, con la fase que lo resuelve.
//
// ── LO QUE FALTABA (cinco huecos, medidos, no supuestos) ─────────────────────
//
//   1. 🐛 **Lo que la puerta de carga no entiende se TIRABA, y se perdía en el
//      siguiente guardado.** Una sesión sin id, un objetivo sin ejercicio o dos
//      copias de la misma sesión con contenido distinto (gana la última, F31):
//      la otra desaparecía para siempre. Ahora se **aparta** en
//      `fitness.cuarentena`, con su original entero, y no se pinta en ninguna
//      parte (apartados 28, 32, 35 y 36).
//   2. **Fitness tenía versión desde la F1 —`version: 1` en `DEFAULT_FITNESS`—
//      y nada la leía**: no había dónde escribir una migración ni quién la
//      corriera. `MIGRACIONES_FITNESS` + `migrarFitness`, sobre lo CRUDO y antes
//      de normalizar (la lección de la EH F46), con copia antes de tocar y
//      vuelta atrás si algo falla (apartados 26, 27, 28 y 57). ⚠️ Escribí primero
//      que «no tenía versión»: estaba en la línea de al lado.
//   3. **Un guardado sin espacio no se distinguía** de uno sin conexión, y el
//      borrador del constructor callaba si el navegador no lo dejaba escribir
//      (apartados 33 y 34).
//   4. **La exportación de datos no llevaba NADA de Fitness** (apartado 29):
//      ni sesiones, ni plantillas, ni objetivos, ni clasificaciones.
//   5. **Al volver con un entrenamiento reciente faltaba «Finalizar»**
//      (apartado 6; la F39 solo lo ofrecía en uno de hace horas — C-43).
//
// ── LAS DECISIONES ───────────────────────────────────────────────────────────
//
// **1. 🚨 NADA SE TIRA: SE APARTA.** La cuarentena guarda el original tal cual y
// solo lo que la puerta de carga NO dejó pasar, comparando lo crudo con lo
// normalizado por id —no con un segundo criterio de «qué es válido» que acabaría
// diciendo otra cosa que el normalizador (F36)—.
// **2. 🚨 SE MIGRA LO CRUDO, CON COPIA, Y NUNCA HACIA ATRÁS.** Una versión mayor
// que la de este código (otro dispositivo más nuevo) se deja como está: la
// puerta de carga conserva lo que no conoce.
// **3. ⚠️ LA VERSIÓN ES LA DE `DEFAULT_FITNESS`, Y SE LEE EN LO CRUDO.** Un solo
// número (`VERSION_FITNESS` lo importa, no lo repite), y se lee ANTES de la
// puerta de carga: después, el normalizador ya ha puesto la del default y la
// migración no sabría que tiene que correr. Hoy no hay ninguna que correr —de la
// F2 a la F40 todo cambio fue una suma que la puerta de carga absorbe—, y el
// mecanismo se prueba con migraciones de ensayo.
// **4. ⚠️ LO QUE LA ARQUITECTURA NO PERMITE SE DICE** (apartados 49 y 64): dos
// dispositivos o dos pestañas escriben la misma fila y gana el último (EH F41,
// F45, F46 y F54). Detectarlo exige una columna nueva en `app_data`: una
// arquitectura de backend, que el «IMPORTANTE» prohíbe.
// ============================================================================

import { nombreDeEjercicio } from './ejercicios.js';
import { historialDeRango } from './historialRangos.js';
import { sesionesDelHistorial } from './historial.js';
import { resumenDeSesion } from './finalizacion.js';
import { AVISOS_ACCION } from './accionesHoyAgenda.js';
import { tipoObjetivo, DEFAULT_FITNESS, LISTAS_EN_CUARENTENA, MOTIVOS_CUARENTENA, normalizarCuarentena } from './fitness.js';

/* La cuarentena vive con el modelo (`fitness.js`), y se reexporta: con
   `export { }` y no con `export … from`, que no crea binding local (EH F17). */
export { LISTAS_EN_CUARENTENA, MOTIVOS_CUARENTENA, normalizarCuarentena };

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const esObjeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const hoyISO = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/* ═══════════════════════════════════════════════════════════════════════════
   1 · DÓNDE VIVE CADA COSA (apartado 1)
   ═══════════════════════════════════════════════════════════════════════════
   *"No debe existir una segunda copia desconocida de cada dato."* Una línea por
   entidad del apartado, con dónde se guarda y cómo se recupera. La prueba
   comprueba que cada clave existe de verdad. */
export const FUENTES_PERSISTENCIA = [
  { entidad: 'Exercise catalog', donde: 'código (`CATALOGO_EJERCICIOS`, F2) · lo propio en `fitness.ejercicios`', clave: 'ejercicios', recupera: 'El catálogo viene con la aplicación; lo propio, con Fitness' },
  { entidad: 'WorkoutPlan', donde: 'código (`PLANES`, F5): los oficiales no se guardan y nada los modifica', clave: null, recupera: 'Siempre iguales: «Personalizar» crea plantillas, no toca el plan (F5)' },
  { entidad: 'UserTemplate', donde: '`fitness.plantillas` (F3, F4)', clave: 'plantillas', recupera: 'Con Fitness; borrar va por la papelera (F4)' },
  { entidad: 'WorkoutSession', donde: '`fitness.sesiones`, con su snapshot (F7)', clave: 'sesiones', recupera: 'Con Fitness; el historial lee las completadas (F10)' },
  { entidad: 'ProgressGoal', donde: '`fitness.objetivos` (F14, F30): solo el objetivo', clave: 'objetivos', recupera: 'Con Fitness; conseguido y progreso se derivan (C-37)' },
  { entidad: 'ProgressPhoto', donde: 'clave `saludFotos` + archivo en el bucket privado `progreso` (F26)', clave: null, recupera: 'Se guarda el camino, nunca una URL: la firma se pide al verla' },
  { entidad: 'ExerciseClassification', donde: '`fitness.clasificaciones` (F17)', clave: 'clasificaciones', recupera: 'Con Fitness; cada respuesta se guarda al contestarla' },
  { entidad: 'RankHistory', donde: 'no se guarda: se deriva de sesiones y clasificaciones (F22)', clave: null, recupera: 'Se recalcula, así que no puede duplicar eventos tras recargar (apartado 24)' },
  { entidad: 'activePlan', donde: '`fitness.planActivo` { planId, origen, desde } y `fitness.planesAnteriores` (F6, F32)', clave: 'planActivo', recupera: 'Con Fitness: Tu Plan lo lee al entrar' },
  { entidad: 'activeWorkout', donde: 'la sesión de `fitness.sesiones` en curso o pausada (`sesionActiva`, F7): su `id` es el activeSessionId', clave: 'sesiones', recupera: '«Tienes un entrenamiento en curso» con Continuar, Finalizar y Descartar' },
  { entidad: 'Borrador del constructor', donde: '`localStorage` («fitness-borrador-rutina», F3): del dispositivo, no de la cuenta', clave: null, recupera: '«Tienes un entrenamiento a medias» con Continuar y Descartar' },
  { entidad: 'Cuarentena', donde: '`fitness.cuarentena` (F41): lo que la puerta de carga no entendió, con su original', clave: 'cuarentena', recupera: 'No se pinta: se conserva para no perderlo' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LA VERSIÓN Y LAS MIGRACIONES (apartados 26, 27, 28 y 57)
   ═══════════════════════════════════════════════════════════════════════════ */

/** La de `DEFAULT_FITNESS` (FIT F1): un solo número. Subirla es subir ésa Y
 *  añadir aquí su migración; la prueba comprueba que cuadren. */
export const VERSION_FITNESS = DEFAULT_FITNESS.version;
export const PRIMERA_VERSION = 1;

/**
 * Una línea por salto de versión: `{ de, a, que, migrar }`. ⚠️ **Puras**:
 * reciben una copia y devuelven la forma nueva; no guardan nada (la versión
 * nueva llega a la cuenta con el siguiente guardado, como todo lo demás).
 *
 * **Vacía, y es correcto**: toda la historia de Fitness está en la versión 1.
 * Cada fase de la F2 a la F40 AÑADIÓ campos, y la puerta de carga los absorbe
 * sin reescribir lo guardado (`entorno` → `entornos` en la F2, la fecha de una
 * sesión en la F31…). Una migración hace falta el día que un campo cambie de
 * forma o de significado, y entonces va aquí.
 */
export const MIGRACIONES_FITNESS = [];

/** La versión de lo guardado. Sin campo —o con uno que no es un entero— es la
 *  primera: la F1 la escribió desde el primer guardado. */
export function versionDeFitness(crudo) {
  const v = esObjeto(crudo) ? crudo.version : undefined;
  return Number.isInteger(v) && v >= PRIMERA_VERSION ? v : PRIMERA_VERSION;
}

/* Los ids de cada lista: una migración que los cambie o pierda uno es un fallo. */
function idsDe(f) {
  return LISTAS_EN_CUARENTENA.map((k) => lista(f && f[k]).map((x) => (esObjeto(x) ? texto(x.id) : '')).filter(Boolean).sort().join(',')).join('|');
}

/**
 * ⚠️ **El mismo patrón que `migrarEstiloHombre` (EH F46), no la misma función**:
 * aquélla lleva dentro el default, la versión y las migraciones de Imagen
 * personal. Y el nombre es `versionDeFitness` porque `versionDe` ya es suyo.
 *
 * Detecta la versión, migra paso a paso, valida y devuelve el resultado.
 *
 * 🚨 **Nunca destruye** (apartado 28): trabaja sobre una copia; si una migración
 * lanza, devuelve algo que no es un objeto o cambia un id, devuelve **lo que había
 * tal cual** y el motivo. Y una versión **mayor** que la de este código se deja
 * como está (`futura`): no se migra hacia atrás.
 */
export function migrarFitness(crudo, { migraciones = MIGRACIONES_FITNESS, hasta = VERSION_FITNESS } = {}) {
  const original = esObjeto(crudo) ? crudo : {};
  const desde = versionDeFitness(original);
  if (desde > hasta) return { fitness: original, migrada: false, futura: true, desde, hasta: desde, error: null };
  if (desde === hasta) return { fitness: original, migrada: false, futura: false, desde, hasta, error: null };
  let actual;
  try {
    actual = JSON.parse(JSON.stringify(original));
  } catch (e) {
    return { fitness: original, migrada: false, futura: false, desde, hasta: desde, error: 'Lo guardado no se puede copiar para migrarlo.' };
  }
  const ids = idsDe(original);
  let v = desde;
  while (v < hasta) {
    const m = migraciones.find((x) => x.de === v);
    if (!m) return { fitness: original, migrada: false, futura: false, desde, hasta: desde, error: `Falta la migración de la versión ${v}.` };
    let siguiente;
    try {
      siguiente = m.migrar(actual);
    } catch (e) {
      return { fitness: original, migrada: false, futura: false, desde, hasta: desde, error: `La migración ${m.de} → ${m.a} ha fallado: ${(e && e.message) || e}` };
    }
    if (!esObjeto(siguiente)) return { fitness: original, migrada: false, futura: false, desde, hasta: desde, error: `La migración ${m.de} → ${m.a} no devolvió un Fitness.` };
    if (idsDe(siguiente) !== ids) return { fitness: original, migrada: false, futura: false, desde, hasta: desde, error: `La migración ${m.de} → ${m.a} cambiaba o perdía ids: no se aplica.` };
    actual = { ...siguiente, version: m.a };
    v = m.a;
  }
  return { fitness: actual, migrada: true, futura: false, desde, hasta: v, error: null };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LA CUARENTENA (apartados 28, 32, 35 y 36)
   ═══════════════════════════════════════════════════════════════════════════
   🐛 **Lo que la puerta de carga no entiende se descartaba, y el siguiente
   guardado lo borraba de la cuenta.** Es correcto no pintarlo —una sesión sin id
   no se puede abrir, ni borrar, ni comparar—, pero perderlo no: *"conservar
   originales"* (36), *"preservar los datos originales cuando sea posible"* (28).

   ⚠️ **No hay un segundo criterio de «qué es válido».** Se compara lo crudo con
   lo que dejó pasar el normalizador, por id: lo que no está, se aparta. Así el
   día que la puerta de carga cambie, la cuarentena la sigue sola.

   ⚠️ **Y dos copias con el mismo id y distinto contenido** (dos dispositivos, una
   restauración sobre una copia vieja): la puerta de carga se queda con la última
   (F31) y la otra **se aparta**, en vez de desaparecer. Dos copias idénticas no
   son un conflicto: sobra una y no se guarda nada. Es la estrategia conservadora
   del apartado 32: no sobrescribir en silencio. */
/**
 * `crudo` es lo que llegó (ya migrado) y `normalizado` lo que devolvió la puerta
 * de carga. Devuelve el `fitness` que se usa —el normalizado con su cuarentena—
 * y los apartados NUEVOS, para poder avisar en desarrollo.
 */
export function apartarLoQueNoCarga(crudo, normalizado, { ahora = Date.now() } = {}) {
  const c = esObjeto(crudo) ? crudo : {};
  const n = esObjeto(normalizado) ? normalizado : {};
  const previa = normalizarCuarentena(c.cuarentena);
  const firmas = new Set(previa.map((x) => `${x.de}|${JSON.stringify(x.original)}`));
  const nuevos = [];
  const desde = hoyISO(ahora);
  const apartar = (de, motivo, original) => {
    const firma = `${de}|${JSON.stringify(original)}`;
    if (firmas.has(firma)) return;
    firmas.add(firma);
    nuevos.push({ de, motivo, original, desde });
  };
  for (const de of LISTAS_EN_CUARENTENA) {
    const crudos = lista(c[de]).filter(esObjeto);
    const cuantos = new Map();
    lista(n[de]).forEach((x) => { const id = esObjeto(x) ? texto(x.id) : ''; if (id) cuantos.set(id, (cuantos.get(id) || 0) + 1); });
    const pasaron = new Set(cuantos.keys());
    const ultimaPorId = new Map();
    crudos.forEach((x) => { const id = texto(x.id); if (id) ultimaPorId.set(id, x); });
    crudos.forEach((x) => {
      const id = texto(x.id);
      if (!id) { apartar(de, 'sin_id', x); return; }
      if (!pasaron.has(id)) {
        /* Una clasificación es UNA por ejercicio (F17): si pasó otra del mismo
           ejercicio, ésta no estaba mal, estaba repetida. */
        const otra = de === 'clasificaciones' && lista(n.clasificaciones).some((y) => y && y.exerciseId === x.exerciseId);
        apartar(de, otra ? 'repetido' : 'no_se_entiende', x);
        return;
      }
      /* Si la puerta de carga dejó pasar las dos copias, no se ha perdido nada. */
      if (cuantos.get(id) > 1) return;
      const ganadora = ultimaPorId.get(id);
      if (ganadora !== x && JSON.stringify(ganadora) !== JSON.stringify(x)) apartar(de, 'repetido', x);
    });
  }
  const cuarentena = [...previa, ...nuevos];
  return { fitness: { ...n, cuarentena }, nuevos };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · CUANDO UN GUARDADO NO LLEGA (apartados 33 y 34)
   ═══════════════════════════════════════════════════════════════════════════
   *"Si el navegador/entorno no puede guardar por falta de espacio: detectar el
   error cuando sea posible. Mostrar: «Hay poco espacio disponible para guardar
   estos datos.» No borrar datos automáticamente."* Lo que se puede reconocer:
   la cuota del navegador (`QuotaExceededError`) y el «demasiado grande» del
   servidor (413, el límite de fila de Postgres). El resto sigue siendo el
   «No se ha podido guardar» de la F37. */
/* El texto vive UNA vez, en el catálogo del aviso (E3 F9). */
export const SIN_ESPACIO = AVISOS_ACCION.guardado_sin_espacio.texto;

export function motivoDeFallo(error) {
  if (!error) return null;
  const e = typeof error === 'object' ? error : { message: String(error) };
  const nombre = texto(e.name);
  const codigo = String(e.code ?? '');
  const estado = Number(e.status ?? e.statusCode);
  const mensaje = [e.message, e.details, e.hint, e.error].filter((x) => typeof x === 'string').join(' ');
  if (nombre === 'QuotaExceededError' || nombre === 'NS_ERROR_DOM_QUOTA_REACHED' || codigo === '22' || codigo === '1014'
    || estado === 413 || codigo === '54000' || codigo === '413'
    || /quota|exceed|too large|payload|row is too big|no space|sin espacio/i.test(mensaje)) return 'sin_espacio';
  if (/failed to fetch|network|networkerror|load failed|offline|timeout/i.test(mensaje)) return 'sin_conexion';
  return 'otro';
}

/** Qué aviso del catálogo de la E3 F9 (`AVISOS_ACCION`) toca. */
export const avisoDeFallo = (error) => (motivoDeFallo(error) === 'sin_espacio' ? 'guardado_sin_espacio' : 'guardado_fallido');

/* ═══════════════════════════════════════════════════════════════════════════
   5 · FITNESS EN LA EXPORTACIÓN DE DATOS (apartado 29)
   ═══════════════════════════════════════════════════════════════════════════
   *"Si el proyecto ya tiene exportación de datos: Fitness debe integrarse con
   ella. No crear un exportador paralelo."* Filas con la forma de siempre
   (`modulo`, `fecha`, `detalle`, `valor`, `extra`), como las de Imagen personal
   (EH F34). ⚠️ **Las fotos, solo sus referencias y solo si no están detrás del
   PIN** (C-35): quien llama pasa `fotos: null` si lo están. La imagen no sale
   nunca: vive en un bucket privado y se firma al verla. */
export function filasDeFitnessParaExportar(fitness, { fotos = null, propios = null } = {}) {
  const f = esObjeto(fitness) ? fitness : {};
  const pr = propios || lista(f.ejercicios);
  const nombre = (id) => nombreDeEjercicio(texto(id), pr);
  const filas = [];
  sesionesDelHistorial(f).forEach((s) => {
    const r = resumenDeSesion(s, { propios: pr });
    const ejs = lista(s.origen && s.origen.ejercicios).map((l) => nombre(l.exerciseId)).filter(Boolean);
    filas.push({
      modulo: 'Fitness (entrenamiento)',
      fecha: s.fecha || '',
      detalle: texto(s.nombre) || 'Entrenamiento',
      /* 🐛 `resumenDeSesion` devuelve `seriesCompletadas` y la duración ya
         escrita («1 h», o nada si no es creíble, F39): leer `seriesHechas`
         exportaba «0 series» en cada entrenamiento. Lo cazó su prueba. */
      valor: `${r.seriesCompletadas ?? 0} series${r.duracion ? ` · ${r.duracion}` : ''}`,
      extra: ejs.join(', '),
    });
  });
  /* ⚠️ Una plantilla guardada lleva sus líneas en `ejercicios` (el modelo de la
     F1); `lineas` es la rutina del constructor mientras se edita. */
  lista(f.plantillas).forEach((p) => {
    const ls = lista(p.ejercicios);
    filas.push({
      modulo: 'Fitness (plantilla)', fecha: '', detalle: texto(p.nombre) || 'Plantilla',
      valor: `${ls.length} ${ls.length === 1 ? 'ejercicio' : 'ejercicios'}`, extra: ls.map((l) => nombre(l.exerciseId)).join(', '),
    });
  });
  lista(f.planesAnteriores).forEach((t) => filas.push({
    modulo: 'Fitness (plan anterior)', fecha: texto(t.desde), detalle: texto(t.planId), valor: `hasta ${texto(t.hasta)}`, extra: '',
  }));
  if (f.planActivo && f.planActivo.planId) {
    filas.push({ modulo: 'Fitness (plan activo)', fecha: texto(f.planActivo.desde), detalle: texto(f.planActivo.planId), valor: texto(f.planActivo.origen), extra: '' });
  }
  lista(f.objetivos).forEach((o) => {
    const t = tipoObjetivo(o.tipo);
    filas.push({
      modulo: 'Fitness (objetivo)',
      fecha: Number.isFinite(o.creadoEn) ? hoyISO(o.creadoEn) : '',
      detalle: nombre(o.exerciseId),
      valor: o.valor === null || o.valor === undefined ? (t ? t.nombre : '') : `${o.valor} ${texto(o.unidad)}`.trim(),
      extra: texto(o.estado),
    });
  });
  lista(f.clasificaciones).forEach((c) => filas.push({
    modulo: 'Fitness (estimación de nivel)',
    fecha: Number.isFinite(c.actualizadoEn) ? hoyISO(c.actualizadoEn) : Number.isFinite(c.creadoEn) ? hoyISO(c.creadoEn) : '',
    detalle: nombre(c.exerciseId),
    valor: c.puntuacion === null || c.puntuacion === undefined ? '' : String(c.puntuacion),
    extra: 'estimación del cuestionario, no un entrenamiento',
  }));
  /* Los rangos históricos son los CAMBIOS del rango global (F22): derivados,
     con su fecha real, y los mismos que enseña la aplicación. */
  lista(historialDeRango(f, { tipo: 'overall', id: '' }, { propios: pr }).cambios).forEach((c) => filas.push({
    modulo: 'Fitness (rango)', fecha: c.fecha, detalle: 'Rango global', valor: `${c.desdeNombre} → ${c.hastaNombre}`, extra: c.fuenteNombre || '',
  }));
  lista(fotos).forEach((foto) => filas.push({
    modulo: 'Fitness (foto de progreso)', fecha: texto(foto.fecha), detalle: lista(foto.tags).join(', ') || 'Foto',
    valor: '', extra: texto(foto.nota),
  }));
  return filas;
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LO QUE YA EXISTÍA, LO QUE NO SE HACE Y LO DECIDIDO
   ═══════════════════════════════════════════════════════════════════════════ */

export const YA_EXISTIA_F41 = [
  { apartado: 2, que: 'Guardado atómico', donde: 'Fitness es UNA clave de `app_data` que se sube entera en cada guardado: no hay estados a medias dentro de ella' },
  { apartado: 3, que: 'La sesión activa se guarda a menudo, sin cada render', donde: 'Cada cambio (F7) y lo escrito una vez (F40)' },
  { apartado: 4, que: 'Los datos críticos del entrenamiento en vivo', donde: 'La sesión guarda id, inicio, ejercicio actual (`actual`), series, pesos, repeticiones, segundos, estado, notas, sustituciones y descanso (F7, F9, F33)' },
  { apartado: 5, que: 'Recargar a mitad y seguir', donde: '`sesionActiva` + «Continuar entrenamiento» (F7)' },
  { apartado: 7, que: 'Solo se promete lo guardado', donde: 'Lo que no llegó a guardarse no se recupera, y el aviso de la F37 dice cuándo un guardado falla' },
  { apartado: 8, que: 'Un estado activo identificable', donde: 'La sesión con `estado` en curso o pausada; su `id` es el activeSessionId. Guardar además un campo aparte sería una segunda copia que puede desincronizarse (F36)' },
  { apartado: 9, que: 'Activa → completada', donde: '`finalizando` → `completada` (F8); la sesión deja de estar activa porque cambia su estado' },
  { apartado: 10, que: 'Terminar dos veces no crea dos', donde: 'Una completada se devuelve tal cual y `guardarSesion` sustituye por id (F8, apartado 17)' },
  { apartado: 11, que: 'Dos guardados casi a la vez', donde: 'Mismo id → la misma sesión; y lo que se confirma tarde va sobre la sesión de ahora (F40)' },
  { apartado: 12, que: 'Descartar solo toca esa sesión', donde: '`descartarSesion` cambia el estado de UNA sesión (F7)' },
  { apartado: 13, que: 'Plantillas', donde: 'Crear, editar, duplicar con ids nuevos y borrar por la papelera (F3, F4)' },
  { apartado: 14, que: 'Los planes oficiales no se tocan', donde: 'Viven en el código; «Personalizar» crea plantillas nuevas (F5)' },
  { apartado: 15, que: 'El plan activo', donde: '`planActivo` { planId, origen, desde } (F6): el id, el tipo (biblioteca o plantilla) y la fecha de activación' },
  { apartado: 16, que: 'Cambiar de plan no reescribe el pasado', donde: '`planesAnteriores` (F32, C-39)' },
  { apartado: 17, que: 'El historial tras recargar', donde: 'Lee las completadas de `fitness.sesiones` (F10): no hay una segunda lista que se pueda desviar' },
  { apartado: 18, que: 'El histórico se entiende aunque cambie el catálogo', donde: 'El snapshot (F7) y `nombreSinCatalogo` (F39)' },
  { apartado: 19, que: 'Objetivos', donde: 'Crear, editar, cancelar y borrar (F14, F30); el conseguido se deriva (C-37)' },
  { apartado: 20, que: 'Fotos: referencia, fecha, nota, etiquetas y sesión', donde: '`path`, `fecha`, `nota`, `tags` y `createdFromWorkoutId` (F26)' },
  { apartado: 21, que: 'La URL temporal no es la referencia', donde: 'Se guarda el camino; la vista previa usa una URL del archivo que se revoca (F26, F40)' },
  { apartado: 22, que: 'Nada de imágenes en el estado', donde: 'El archivo va al bucket `progreso` (F26)' },
  { apartado: 23, que: 'Clasificaciones', donde: '`fitness.clasificaciones`, cada respuesta al contestarla (F17)' },
  { apartado: 24, que: 'El historial de rangos no duplica al recargar', donde: 'Se deriva (F22): no hay eventos guardados que duplicar' },
  { apartado: 25, que: 'La caché no manda sobre lo guardado', donde: 'Cachés en `WeakMap` sobre objetos que no cambian, y la del historial se tira al cambiar sesiones, clasificaciones o propios (F40)' },
  { apartado: 37, que: 'Autoguardado', donde: 'Borrador del constructor (F3), la sesión (F7) y lo escrito (F40)' },
  { apartado: 38, que: 'Un borrador no es una plantilla', donde: 'El borrador vive en `localStorage`, aparte de `fitness.plantillas` (F3)' },
  { apartado: 40, que: 'Recuperar el constructor', donde: '«Tienes un entrenamiento a medias» con Continuar y Descartar (F3)' },
  { apartado: 41, que: 'Recuperar la clasificación', donde: 'Cada respuesta se guarda al contestarla y la cola vuelve donde estaba (F17, F24)' },
  { apartado: 42, que: 'Formularios que se recuperan', donde: 'Los dos donde más duele perder algo: el constructor (borrador, F3) y la nota del entrenamiento en vivo (F7, F40). El resto son campos cortos que se guardan al pulsar' },
  { apartado: 43, que: 'Fechas estables', donde: 'Día local `AAAA-MM-DD` y marcas de tiempo en milisegundos (`fechaLocalISO`, siete veces el UTC)' },
  { apartado: 44, que: 'Cambio de zona horaria', donde: 'Las marcas son milisegundos absolutos: representan el mismo momento en cualquier zona. El día de una sesión es el día local en que se hizo, y no se reescribe' },
  { apartado: 45, que: 'Cambios de hora', donde: 'Marcas absolutas; un reloj que va hacia atrás no da duraciones negativas (`duracionSesion`)' },
  { apartado: 46, que: 'Ids estables', donde: 'Ranuras (F2); la puerta de carga no inventa ids, descarta (y ahora aparta)' },
  { apartado: 47, que: 'Sin «Sin datos» antes de cargar', donde: 'La pantalla de carga con la forma de Hoy hasta tener los datos (E3 F14)' },
  { apartado: 53, que: 'Un error de guardado provocado', donde: 'El doble de Supabase sabe fallar (`FALLAR_ESCRITURA`, F37): ni éxito falso, ni datos que desaparecen, y «Reintentar»' },
  { apartado: 59, que: 'Sin «guardar todo constantemente»', donde: 'Lo de la F40 sigue: lo escrito se guarda una vez, y la migración y la cuarentena corren una vez por carga' },
];

/** Lo que construye esta fase, con sus apartados. Con `YA_EXISTIA_F41` y
 *  `NO_EN_FIT41`, la prueba comprueba que no queda ninguno sin decir. */
export const HECHO_F41 = [
  { apartados: [1], que: '`FUENTES_PERSISTENCIA`: dónde vive cada entidad y cómo se recupera' },
  { apartados: [6], que: '«Finalizar» también en la sesión reciente al volver (C-43)' },
  { apartados: [26, 27, 57], que: '`migrarFitness` sobre la versión de la F1, con copia y validando ids' },
  { apartados: [28, 32, 35, 36], que: 'La cuarentena: lo que la puerta de carga no entiende se aparta con su original, y se avisa en desarrollo' },
  { apartados: [29], que: 'Fitness en la exportación global, con las fotos solo si no están detrás del PIN' },
  { apartados: [33, 34], que: '«Hay poco espacio…» cuando es eso, y el constructor dice si su borrador no se ha podido guardar' },
  { apartados: [39], que: 'Un borrador vacío se retira en vez de ofrecerse' },
  { apartados: [43, 46], que: 'La foto de progreso sin id o sin fecha ya no cambia en cada carga' },
  { apartados: [51, 52, 54, 55, 56, 58], que: 'El recorrido de recuperación, interrupciones, duplicados y datos corruptos (`test-persistencia-fitness`, recorrido)' },
];

export const NO_EN_FIT41 = [
  { que: 'Detectar dos pestañas o dos dispositivos que escriben a la vez (apartados 32 y 49)', porque: 'Todos escriben la misma fila de `app_data` y gana el último (EH F41, F45, F46 y F54). Detectarlo exige una columna de versión en la tabla: una arquitectura de backend, que el «IMPORTANTE» de esta fase prohíbe. Y en su iPhone la aplicación instalada y Safari no comparten almacenamiento: los eventos de una pestaña no llegarían a la otra.' },
  { que: 'Importar datos de Fitness (apartados 30 y 31)', porque: 'JosStyle no tiene importación global (solo la copia de Imagen personal, EH F54). Lo que sí restaura —la papelera— no duplica: si el id ya existe, se queda el que hay.' },
  { que: 'SSR o hidratación (apartado 48)', porque: 'La aplicación no se renderiza en el servidor, y la fase dice no introducirlo.' },
  { que: 'Garantizar lo escrito en los últimos 0,7 s antes de cerrar a la fuerza (apartado 7)', porque: 'Al esconderse la página se guarda al momento (F40), pero si el sistema mata la aplicación en ese instante la petición puede no salir. *"No prometer recuperación de cambios que todavía no habían sido persistidos."*' },
  { que: 'Escuchar el evento `storage` (apartado 50)', porque: 'Lo único de Fitness en `localStorage` es el borrador del constructor, y se lee al entrar en Fitness, que es cuando se ofrece. En su iPhone la aplicación instalada y Safari no comparten almacenamiento, así que no hay otra pestaña que lo cambie por detrás.' },
  { que: 'Caducidad de los borradores por tiempo (apartado 39)', porque: 'El único borrador es el del constructor, y uno viejo con ejercicios sigue siendo trabajo suyo: se ofrece. Solo se limpia el que no tiene nada (sin ejercicios ni nombre).' },
];

export const DECISIONES_FIT41 = [
  { id: 'apartar_no_tirar', texto: 'Lo que la puerta de carga no entiende se aparta con su original; nunca se tira (apartados 28 y 36).' },
  { id: 'migrar_lo_crudo', texto: 'Se migra lo crudo, con copia, validando los ids, y nunca hacia atrás (apartados 27, 28 y 57). La versión es la de la F1; hoy no hay ninguna migración que correr.' },
  { id: 'sin_backend_nuevo', texto: 'Ni una tabla ni una columna: la capa de persistencia es la de siempre (su «IMPORTANTE»).' },
  { id: 'finalizar_al_volver', texto: 'Al volver con un entrenamiento en curso, Continuar, Finalizar y Descartar, reciente o no (apartado 6, C-43).' },
  { id: 'sin_cambiar_modelos', apartados: [60, 61], texto: 'Ni una función cambia de comportamiento ni un modelo de forma: el único campo nuevo es `cuarentena`, y la versión es la que ya puso la F1.' },
];
