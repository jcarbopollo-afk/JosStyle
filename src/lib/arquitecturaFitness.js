/* ─────────────────────────────────────────────────────────────────────────
   Entrega 4 · FIT F44/45 — LIMPIEZA ARQUITECTÓNICA Y DEUDA TÉCNICA.

   *"NO hacer una reescritura completa. NO cambiar la funcionalidad. NO cambiar
   las fórmulas."* Y su regla principal: *"Primero INSPECCIONAR. No refactorizar
   automáticamente solo porque algo «podría estar mejor»."*

   Así que esto es, primero, **el mapa** (apartado 2): qué capa es cada archivo
   de Fitness, qué motor decide cada cosa y por dónde viajan los datos. Y
   después, **las auditorías que mantienen limpio lo que se limpió**: cada una
   lee el código de verdad —la prueba se lo da de disco— y devuelve lo que
   encuentra con su archivo y su línea, así que una regresión pone la suite roja
   el mismo día. Cada una trae su ejemplo malo en la prueba (EH F42: una
   auditoría que no puede fallar no sirve).

   ⚠️ **Lo limpiado no movió ni un número**: el mismo escenario de 60 sesiones
   por los motores con el código de antes y el de después da la misma salida,
   byte a byte (como en la F40 y la F42).

   Es una librería de AUDITORÍA: importa los motores para guardar sus
   funciones (renombrar una rompe la compilación, FIT F27) y ningún motor la
   importa a ella.
   ───────────────────────────────────────────────────────────────────────── */

import { rangoEfectivoDeEjercicio, rangoEfectivoDeGrupo, rangoGlobalEfectivo } from './motorRangos';
import { progresoDeEjercicio, aparicionesDeEjercicio, mejorHistorico } from './progresion';
import { progresoDeObjetivo, estadoDeObjetivo } from './objetivosProgreso';
import { tuPlan, planificadoEnFecha } from './tuPlan';
import { getDayTrainingStatus } from './planificacionSemanal';
import { adherenciaDelPlan } from './actividadEntrenamiento';
import { getExerciseReplacements } from './sustitucion';
import { prioridadDeEjercicio } from './colaClasificacion';
import { puntuacionDeRespuesta } from './clasificacion';
import { explicacionDeRango } from './explicacionRangos';
import { normalizarFitnessConSesiones, empezarSesion, pausarSesion, reanudarSesion, descartarSesion } from './entrenamiento';
import { pasarAFinalizacion, guardarEntrenamiento, descartarEntrenamiento } from './finalizacion';
import { migrarFitness } from './persistenciaFitness';
import { decimal } from './numerosFitness';
import { fechaLarga } from './fechasFitness';

/* ═══════════════════════════════════════════════════════════════════════════
   1 · EL MAPA (apartados 2, 33, 34, 46 y 49)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Cada archivo de Fitness en su capa. Un archivo nuevo va aquí, o la
    auditoría de capas no lo mira (la lección de `ARCHIVOS_FITNESS`, F39). */
export const CAPAS_FITNESS = Object.freeze([
  {
    id: 'datos', nombre: 'Datos del catálogo',
    que: 'Los ejercicios y los planes, como datos: sin lógica y fuera de los componentes (apartados 33 y 34).',
    archivos: ['src/lib/catalogoEjercicios.js', 'src/lib/catalogoPlanes.js'],
  },
  {
    id: 'modelo', nombre: 'Modelo y puerta de carga',
    que: 'La forma de lo guardado, sus constantes y sus normalizadores (regla 5).',
    archivos: ['src/lib/fitness.js', 'src/lib/ejercicios.js', 'src/lib/planes.js', 'src/lib/persistenciaFitness.js'],
  },
  {
    id: 'motores', nombre: 'Motores',
    que: 'Lo que decide: una sola fuente por pregunta (apartados 8-13).',
    archivos: [
      'src/lib/rangos.js', 'src/lib/motorRangos.js', 'src/lib/progresion.js', 'src/lib/objetivosProgreso.js',
      'src/lib/tuPlan.js', 'src/lib/planificacionSemanal.js', 'src/lib/actividadEntrenamiento.js',
      'src/lib/sustitucion.js', 'src/lib/clasificacion.js', 'src/lib/colaClasificacion.js',
      'src/lib/constructor.js', 'src/lib/plantillas.js', 'src/lib/entrenamiento.js', 'src/lib/finalizacion.js',
    ],
  },
  {
    id: 'lecturas', nombre: 'Lecturas (lo que se deriva para una pantalla)',
    que: 'Redactan lo que dicen los motores, sin decidir nada nuevo: los «selectores» del apartado 21.',
    archivos: [
      'src/lib/historial.js', 'src/lib/progresoEjercicios.js', 'src/lib/progresoMuscular.js', 'src/lib/detalleEjercicio.js',
      'src/lib/pantallaRangos.js', 'src/lib/detalleMuscular.js', 'src/lib/explicacionRangos.js',
      'src/lib/contribucionMuscular.js', 'src/lib/historialRangos.js', 'src/lib/siguienteRango.js',
      'src/lib/resumenRangos.js', 'src/lib/resumenProgreso.js', 'src/lib/objetivosFitness.js',
      'src/lib/fotosProgreso.js', 'src/lib/comparadorFotos.js', 'src/lib/bibliotecaEjercicios.js',
      'src/lib/entrenamientoUx.js', 'src/lib/vueltaFitness.js',
    ],
  },
  {
    id: 'utilidades', nombre: 'Utilidades (hojas del árbol)',
    que: 'Fechas y números con un formato por papel; no importan nada de Fitness (apartados 38 y 39).',
    archivos: ['src/lib/fechasFitness.js', 'src/lib/numerosFitness.js'],
  },
  {
    id: 'auditorias', nombre: 'Auditorías y declaraciones',
    que: 'Lo que comprueba el resto y lo que se decidió no hacer; ningún motor las importa.',
    archivos: [
      'src/lib/validacionCatalogo.js', 'src/lib/integracionFitness.js', 'src/lib/feedbackFitness.js',
      'src/lib/movilFitness.js', 'src/lib/robustezFitness.js', 'src/lib/rendimientoFitness.js',
      'src/lib/acabadoFitness.js', 'src/lib/auditoriaFuncionalFitness.js', 'src/lib/arquitecturaFitness.js',
      'src/lib/releaseFitness.js',
    ],
  },
  {
    id: 'pantallas', nombre: 'Pantallas',
    que: 'Dibujan y reparten: piden a las lecturas y a los motores, nunca calculan un rango ni una tendencia (apartado 3).',
    archivos: [
      'src/views/FitnessView.jsx', 'src/views/TrainingView.jsx', 'src/views/TuPlanView.jsx', 'src/views/PlantillasView.jsx',
      'src/views/BibliotecaPlanesView.jsx', 'src/views/ConstructorView.jsx', 'src/views/EjerciciosView.jsx',
      'src/views/EntrenamientoVivoView.jsx', 'src/views/FinalizacionView.jsx', 'src/views/HistorialView.jsx',
      'src/views/ProgresoView.jsx', 'src/views/RangosView.jsx', 'src/views/DetalleMuscularView.jsx',
      'src/views/ClasificacionView.jsx',
    ],
  },
  {
    id: 'componentes', nombre: 'Componentes',
    que: 'Piezas de pantalla; las compartidas de Fitness viven en `piezasFitness.jsx`.',
    archivos: [
      'src/components/rangos.jsx', 'src/components/sustitucion.jsx', 'src/components/objetivosFitness.jsx',
      'src/components/fotosProgreso.jsx', 'src/components/comparadorFotos.jsx', 'src/components/historialRango.jsx',
      'src/components/bibliotecaEjercicios.jsx', 'src/components/detalleEjercicio.jsx', 'src/components/resumenProgreso.jsx',
      'src/components/siguienteRango.jsx', 'src/components/explicacionRango.jsx', 'src/components/contribucionMuscular.jsx',
      'src/components/resumenRangos.jsx', 'src/components/areaSegura.jsx', 'src/components/actividadEntrenamiento.jsx',
      'src/components/planificacionSemanal.jsx', 'src/components/colaClasificacion.jsx', 'src/components/estadosFitness.jsx',
      'src/components/piezasFitness.jsx', 'src/components/iconosFitness.jsx', 'src/components/diagnosticoCatalogo.jsx',
    ],
  },
]);

export const capaDe = (ruta) => CAPAS_FITNESS.find((c) => c.archivos.includes(ruta)) || null;
export const ARCHIVOS_DEL_MAPA = Object.freeze(CAPAS_FITNESS.flatMap((c) => c.archivos));

/** Los motores de los apartados 8 a 13, cada uno con LA función que decide.
    Son las funciones importadas: renombrar una rompe la compilación. */
export const MOTORES_FITNESS = Object.freeze([
  { id: 'rangos', apartado: 8, nombre: 'RankEngine', archivo: 'src/lib/motorRangos.js', funciones: [rangoEfectivoDeEjercicio, rangoEfectivoDeGrupo, rangoGlobalEfectivo, explicacionDeRango] },
  { id: 'progreso', apartado: 9, nombre: 'ProgressEngine', archivo: 'src/lib/progresion.js', funciones: [progresoDeEjercicio, aparicionesDeEjercicio, mejorHistorico] },
  { id: 'objetivos', apartado: 10, nombre: 'GoalEngine', archivo: 'src/lib/objetivosProgreso.js', funciones: [progresoDeObjetivo, estadoDeObjetivo] },
  { id: 'planificacion', apartado: 11, nombre: 'PlanningEngine', archivo: 'src/lib/tuPlan.js', funciones: [tuPlan, planificadoEnFecha, getDayTrainingStatus, adherenciaDelPlan] },
  { id: 'sustitucion', apartado: 12, nombre: 'ReplacementEngine', archivo: 'src/lib/sustitucion.js', funciones: [getExerciseReplacements] },
  { id: 'clasificacion', apartado: 13, nombre: 'ClassificationEngine', archivo: 'src/lib/colaClasificacion.js', funciones: [prioridadDeEjercicio, puntuacionDeRespuesta] },
  { id: 'persistencia', apartado: 18, nombre: 'Persistencia', archivo: 'src/lib/entrenamiento.js', funciones: [normalizarFitnessConSesiones, migrarFitness] },
  { id: 'formatos', apartado: 38, nombre: 'Fechas y números', archivo: 'src/lib/fechasFitness.js', funciones: [fechaLarga, decimal] },
]);

/** Apartado 61 — el ciclo de vida de una sesión, que es lo que más cuesta
    leer repartido en dos librerías. Cada paso es UNA función, y toda sesión
    que cambia de estado se guarda con `guardarSesion`, que sustituye por id
    (F7): por eso guardar dos veces deja una sola (F8, apartado 17). */
export const CICLO_DE_SESION = Object.freeze([
  { estado: 'planificada', entra: null, fase: 'F1', que: 'El valor por defecto del modelo. Ninguna pantalla crea una así: empezar la crea ya en curso.' },
  { estado: 'en_curso', entra: empezarSesion, fase: 'F7', que: 'Congela el snapshot de la plantilla o del día del plan: la estructura, nunca el ejercicio (guarda su `exerciseId`).' },
  { estado: 'pausada', entra: pausarSesion, sale: reanudarSesion, fase: 'F7', que: 'El motor la sabe llevar —el reloj descuenta lo parado—, pero la pantalla del entrenamiento en vivo (F9) solo pausa el DESCANSO. Se queda: cambiar los estados guardados es lo que la F44 no hace.' },
  { estado: 'finalizando', entra: pasarAFinalizacion, fase: 'F8', que: 'El reloj se para al entrar, no al guardar; es el estado que deja revisar sin perder nada ni dar por hecho lo que él no ha confirmado.' },
  { estado: 'completada', entra: guardarEntrenamiento, fase: 'F8', que: 'La única que leen el historial, el progreso, los objetivos, la actividad y el rango. Idempotente: una completada se devuelve tal cual.' },
  { estado: 'descartada', entra: descartarEntrenamiento, tambien: descartarSesion, fase: 'F7 y F8', que: 'Desde el resumen o desde la sesión en curso, siempre con `confirmado`. No cuenta en ninguna parte.' },
]);

/** El flujo principal (apartado 49): cada paso lee del anterior y ninguno
    guarda una copia de lo que puede derivar (F15, F22, F24, F28). */
export const FLUJO_DE_DATOS = Object.freeze([
  { paso: 'Catálogo', archivos: 'catalogoEjercicios.js · ejercicios.js · catalogoPlanes.js · planes.js', guarda: 'nada: es código' },
  { paso: 'Plan / plantilla', archivos: 'constructor.js · plantillas.js · planes.js · tuPlan.js', guarda: '`fitness.plantillas`, `fitness.planActivo`, `fitness.planesAnteriores`' },
  { paso: 'Sesión', archivos: 'entrenamiento.js · entrenamientoUx.js · finalizacion.js', guarda: '`fitness.sesiones`, con su snapshot (F7)' },
  { paso: 'Historial', archivos: 'historial.js', guarda: 'nada: lee las sesiones completadas' },
  { paso: 'Progreso · Objetivos · Actividad · Rango', archivos: 'progresion.js · objetivosProgreso.js · actividadEntrenamiento.js · motorRangos.js', guarda: 'solo el objetivo y las estimaciones del cuestionario; todo lo demás se calcula' },
]);

/** Apartados 50 y 51 — la invalidación. */
export const INVALIDACION = Object.freeze({
  estrategia: 'Nada derivado se guarda: terminar una sesión es UNA escritura (`guardarSesion`) y todo lo que depende de ella se recalcula al leer.',
  cachés: 'Las de la F40 cuelgan de un `WeakMap` sobre el objeto que nadie edita (una sesión, el reparto congelado, la lista de sesiones con sus clasificaciones): un `fitness` nuevo las invalida solo.',
  sinEventos: 'No hay un bus de eventos (F36): completar un entrenamiento no dispara «actualizar rango», «actualizar objetivo» ni «actualizar actividad»; esas pantallas leen la misma lista.',
});

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LAS AUDITORÍAS (reciben { ruta: código } y devuelven lo que encuentran)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Quita comentarios conservando los saltos de línea, para que la línea que se
    devuelve sea la de verdad (la lección de la F38). */
function sinComentarios(src) {
  return String(src || '')
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:\\'"`])\/\/.*$/gm, (m, a) => a + ' '.repeat(m.length - a.length));
}
const lineaDe = (src, i) => src.slice(0, i).split('\n').length;
const hallazgos = (archivos, patron, que) => Object.entries(archivos || {}).flatMap(([ruta, src]) => {
  const limpio = sinComentarios(src);
  const out = [];
  const re = new RegExp(patron.source, patron.flags.includes('g') ? patron.flags : `${patron.flags}g`);
  let m;
  while ((m = re.exec(limpio))) out.push({ ruta, linea: lineaDe(limpio, m.index), que: typeof que === 'function' ? que(m) : que });
  return out;
});

/** Apartado 48 — ciclos de imports entre los archivos que se le den. */
export function ciclosDeImports(archivos) {
  const rutas = Object.keys(archivos || {});
  const existe = new Set(rutas);
  const resolver = (desde, spec) => {
    if (!spec.startsWith('.')) return null;
    const base = desde.split('/').slice(0, -1);
    spec.split('/').forEach((t) => { if (t === '..') base.pop(); else if (t !== '.') base.push(t); });
    const r = base.join('/');
    return [r, `${r}.js`, `${r}.jsx`].find((x) => existe.has(x)) || null;
  };
  const grafo = new Map(rutas.map((r) => [r, [...sinComentarios(archivos[r]).matchAll(/^\s*(?:import|export)\s[^;]*?from\s+'([^']+)'/gm)]
    .map((m) => resolver(r, m[1])).filter(Boolean)]));
  /* Tarjan: cada componente fuertemente conexo de más de un archivo es un ciclo. */
  let n = 0; const idx = new Map(); const bajo = new Map(); const pila = []; const enPila = new Set(); const ciclos = [];
  const visitar = (v) => {
    idx.set(v, n); bajo.set(v, n); n += 1; pila.push(v); enPila.add(v);
    for (const w of grafo.get(v) || []) {
      if (!idx.has(w)) { visitar(w); bajo.set(v, Math.min(bajo.get(v), bajo.get(w))); }
      else if (enPila.has(w)) bajo.set(v, Math.min(bajo.get(v), idx.get(w)));
    }
    if (bajo.get(v) === idx.get(v)) {
      const comp = [];
      let w;
      do { w = pila.pop(); enPila.delete(w); comp.push(w); } while (w !== v);
      if (comp.length > 1) ciclos.push(comp.sort());
    }
  };
  rutas.forEach((r) => { if (!idx.has(r)) visitar(r); });
  return ciclos;
}

/** Apartado 19 — `localStorage`, `sessionStorage` o IndexedDB dentro de una
    pantalla o un componente. El borrador del constructor (F3) vive en su
    librería, que es la capa que puede tocarlos. */
export const almacenamientoDirecto = (archivos) =>
  hallazgos(archivos, /\b(localStorage|sessionStorage|indexedDB)\b/, (m) => `${m[1]} en una pantalla`);

/** Apartado 40 — un `catch` vacío sin decir por qué, o un `.catch(() => {})`.
    Se busca en el código EN BRUTO —con un comentario dentro, el bloque sí dice
    por qué, y quitarlo lo dejaría vacío—, y lo que cae DENTRO de un comentario
    no cuenta: la cabecera de esta misma función nombra el patrón para decir
    que no se hace (la lección de la EH F38 con `new Notification`). */
function rangosDeComentario(s) {
  const r = [];
  const re = /\/\*[\s\S]*?\*\/|(^|[^:\\'"`])\/\/.*$/gm;
  let m;
  while ((m = re.exec(s))) {
    const desde = m.index + (m[1] ? m[1].length : 0);
    r.push([desde, m.index + m[0].length]);
  }
  return r;
}
export function catchSinExplicar(archivos) {
  return Object.entries(archivos || {}).flatMap(([ruta, src]) => {
    const out = [];
    const s = String(src || '');
    const comentarios = rangosDeComentario(s);
    const enComentario = (i) => comentarios.some(([a, b]) => i >= a && i < b);
    const re = /catch\s*(\([^)]*\))?\s*\{\s*\}|\.catch\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/g;
    let m;
    while ((m = re.exec(s))) {
      if (enComentario(m.index)) continue;
      out.push({ ruta, linea: lineaDe(s, m.index), que: 'catch vacío sin explicar' });
    }
    return out;
  });
}

/** Apartado 41 — `console.log`, `.debug` o `.info` olvidados. `console.error`
    sí vale: es el que cuenta el recorrido (F36). */
export const logsSueltos = (archivos) =>
  hallazgos(archivos, /\bconsole\.(log|debug|info)\s*\(/, (m) => `console.${m[1]}`);

/** Apartado 26 — `key={i}` en una lista cuyo orden puede cambiar. Las que se
    permiten están en `CLAVES_POR_POSICION`, con su motivo. */
export const CLAVES_POR_POSICION = Object.freeze([
  { ruta: 'src/components/actividadEntrenamiento.jsx', porque: 'Los puntos de «3 de 5 planificados» y las letras de los días de la semana: listas decorativas de largo fijo, que no se reordenan ni se editan.' },
]);
export function clavesPorPosicion(archivos, { permitidas = CLAVES_POR_POSICION } = {}) {
  const ok = new Set(permitidas.map((p) => p.ruta));
  return hallazgos(archivos, /key=\{(i|idx|index|indice)\}/, (m) => `key={${m[1]}}`).filter((h) => !ok.has(h.ruta));
}

/** Apartado 60 — lo que Fitness importa de fuera de Fitness. SOLO lo declarado
    aquí, con su motivo: utilidades y sistemas compartidos de JosStyle, nunca los
    datos de otro módulo (Economía, Estudios, Armario, Hábitos…). Una
    dependencia nueva que no esté en la lista pone la suite roja. */
export const DEPENDENCIAS_PERMITIDAS = Object.freeze([
  { modulo: 'helpers', porque: 'Utilidades de toda la aplicación: fechas locales, `uid`, `hexToRgba`.' },
  { modulo: 'tokens', porque: 'El tema (`COLORS`, `CAPAS`): la regla 2.' },
  { modulo: 'colorEngine', porque: '`ensureContrast`, del que sale `acentoLegible` (F42).' },
  { modulo: 'ui', porque: 'Los componentes comunes de JosStyle (apartado 59: antes que uno propio).' },
  { modulo: 'hoy', solo: ['diasEntre'], porque: '`diasEntre`, la cuenta de días que usa toda la aplicación.' },
  { modulo: 'horario', solo: ['DIAS_SEMANA', 'diaDeFecha'], porque: '`DIAS_SEMANA` y `diaDeFecha`: la semana que empieza el lunes, la misma en toda la aplicación. Ni una clase del horario.' },
  { modulo: 'calendario', solo: ['celdasMes'], porque: '`celdasMes`: la cuadrícula de un mes (E3 F34: antes de dibujar un mes, mirar si ya hay una). Una función pura sobre fechas: Fitness no lee ni escribe un evento del Calendario (apartado 60).' },
  { modulo: 'rachas', solo: ['rachaActual'], porque: 'La racha de entrenamiento la lleva el motor de rachas (FIT F1, `MAPEO_EXISTENTE`): se lee, nunca se escribe desde aquí.' },
  { modulo: 'rendimiento', porque: '`paginar` y `POR_PAGINA` (EH F44): la paginación de toda la aplicación.' },
  { modulo: 'eventos', solo: ['emitir'], porque: 'El bus de sonido y vibración (SO F3): Fitness emite, el motor decide.' },
  { modulo: 'accionesHoyAgenda', porque: '`AVISOS_ACCION`: los avisos de «guardado» y «no se pudo guardar» de toda la aplicación (F37, F41).' },
  { modulo: 'quickAdd', porque: '`AvisoAccion`, el aviso que pinta esos textos.' },
  { modulo: 'scrollAlVolver', porque: 'Volver a una lista donde estaba (F38).' },
  { modulo: 'dialogoAccesible', porque: 'El foco y el teclado de las hojas (F39).' },
  { modulo: 'supabase', porque: 'Las fotos de progreso son las de Salud (`uploadProgressPhoto`, FIT F26) y los vídeos de calistenia (Fase 2).' },
  { modulo: 'ai', porque: 'El análisis de un vídeo de calistenia (Fase 2), siempre a un toque (regla 7). Ningún motor de Fitness llama a la IA.' },
  { modulo: 'videoFrames', porque: 'Los fotogramas de ese vídeo (Fase 2).' },
  { modulo: 'pulidoHC', porque: 'Solo la auditoría de movimiento (F37) lee sus `ANIMACIONES_HC`.' },
  { modulo: 'accesibilidadEH', porque: 'Solo la auditoría móvil (F38) reutiliza su revisor de accesibilidad.' },
  { modulo: 'umbralesGesto', porque: 'Los umbrales de los gestos del Motion System (MS F5): `entrenamientoUx.js` toma de aquí el de cambiar de ejercicio (FIT F9). Una hoja sin dependencias, así que el motor no se trae la capa visual.' },
  { modulo: 'gestosMotion', porque: 'Las piezas de los gestos del Motion System (MS F5): el asa de una hoja y el deslizar entre ejercicios, en las pantallas. Ningún motor de Fitness lo importa.' },
  { modulo: 'continuidad', porque: 'El elemento compartido del Motion System (MS F7): el nombre de un ejercicio viaja de la biblioteca a su ficha. Solo lo usan las piezas de la biblioteca; ningún motor de Fitness lo importa.' },
  { modulo: 'motion', porque: 'El Motion System de toda la aplicación (MS F1): `transicion()` para una transición en línea, y la auditoría de movimiento (F37) lee sus tokens para medir el CSS. Ningún motor de Fitness lo importa: es capa visual y de auditoría.' },
]);
const baseDe = (spec) => spec.split('/').pop().replace(/\.(jsx?|mjs)$/, '');
/** Y de los módulos de otra área (el horario, el calendario, las rachas), solo
    los nombres declarados en `solo`: la integración va por una interfaz clara
    (apartado 60), y traerse otra cosa pone la suite roja. */
export function dependenciasNoDeclaradas(archivos, { propios = ARCHIVOS_DEL_MAPA, permitidas = DEPENDENCIAS_PERMITIDAS } = {}) {
  const deFitness = new Set(propios.map(baseDe));
  const porModulo = new Map(permitidas.map((p) => [p.modulo, p]));
  const sinDeclarar = hallazgos(archivos, /from\s+'(\.\.?\/[^']+)'/, (m) => baseDe(m[1]))
    .filter((h) => !deFitness.has(h.que) && !porModulo.has(h.que))
    .map((h) => ({ ...h, que: `importa ${h.que}, que no es de Fitness ni está declarado` }));
  const deMas = hallazgos(archivos, /import\s*\{([^}]*)\}\s*from\s+'(\.\.?\/[^']+)'/, (m) => ({ nombres: m[1], modulo: baseDe(m[2]) }))
    .filter((h) => porModulo.get(h.que.modulo)?.solo)
    .flatMap((h) => h.que.nombres.split(',').map((n) => n.trim().split(/\s+as\s+/)[0]).filter(Boolean)
      .filter((n) => !porModulo.get(h.que.modulo).solo.includes(n))
      .map((n) => ({ ruta: h.ruta, linea: h.linea, que: `importa ${n} de ${h.que.modulo}, que solo presta ${porModulo.get(h.que.modulo).solo.join(', ')}` })));
  return [...sinDeclarar, ...deMas];
}

/** Apartado 39 — un número con coma escrito a mano, fuera de `decimal`. Los
    que se quedan tienen otro papel, y lo dicen. */
export const COMAS_PERMITIDAS = Object.freeze([
  { ruta: 'src/lib/numerosFitness.js', porque: 'Es `decimal`, la única.' },
  { ruta: 'src/lib/comparadorFotos.js', porque: 'El zoom del comparador lleva SIEMPRE un decimal («1,5×», «2,0×»): es un factor, no una marca, y quitarle el cero cambiaría lo que se lee (F27).' },
  { ruta: 'src/views/ProgresoView.jsx', porque: 'El valor inicial del campo de un objetivo al editarlo: es lo que él escribió, y redondearlo le cambiaría el dato al guardar.' },
]);
export function comasADesmano(archivos, { permitidas = COMAS_PERMITIDAS } = {}) {
  const ok = new Set(permitidas.map((p) => p.ruta));
  return hallazgos(archivos, /\.replace\(\s*['"]\.['"]\s*,\s*['"],['"]\s*\)/, 'coma decimal escrita a mano: `decimal` de numerosFitness.js')
    .filter((h) => !ok.has(h.ruta));
}

/** Apartado 31 — un import que el archivo no usa. Se mira el código sin
    comentarios y sin la propia línea del import; un uso como propiedad
    (`x.nombre`) no cuenta, y `React` en un `.jsx` sí (lo usa el JSX). La
    primera pasada de un lint de verdad encontró veinticinco. */
export function importsSinUso(archivos) {
  return Object.entries(archivos || {}).flatMap(([ruta, src]) => {
    const limpio = sinComentarios(src);
    const out = [];
    for (const m of limpio.matchAll(/^\s*import\s+([^'";]+?)\s+from\s+'[^']+';?/gm)) {
      const clausula = m[1];
      const nombres = [];
      const porDefecto = clausula.match(/^([A-Za-z_$][\w$]*)\s*(,|$)/);
      if (porDefecto) nombres.push(porDefecto[1]);
      const todo = clausula.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
      if (todo) nombres.push(todo[1]);
      const llaves = clausula.match(/\{([^}]*)\}/);
      if (llaves) llaves[1].split(',').map((x) => x.trim()).filter(Boolean)
        .forEach((x) => { const partes = x.split(/\s+as\s+/); nombres.push((partes[1] || partes[0]).trim()); });
      /* El `...` de una expansión SÍ es un uso: se quita antes de descartar `x.nombre`. */
      const resto = (limpio.slice(0, m.index) + ' '.repeat(m[0].length) + limpio.slice(m.index + m[0].length)).replace(/\.\.\./g, '   ');
      nombres
        .filter((n) => !(n === 'React' && /\.jsx$/.test(ruta)))
        .filter((n) => !new RegExp(`(^|[^\\w$.])${n.replace(/\$/g, '\\$')}(?![\\w$])`).test(resto))
        .forEach((n) => out.push({ ruta, linea: lineaDe(limpio, m.index), que: `importa ${n} y no lo usa` }));
    }
    return out;
  });
}

/** Apartado 57 — un componente que solo pinta el banco de renderizado. La
    F44 encontró ocho: uno (`VacioFitness`, F1) se retiró porque ya no lo usaba
    nada; los otros siete los nombró el enunciado de su fase como piezas
    reutilizables («preparar componentes simples si son necesarios»), así que
    se quedan, pero DICHO: qué pinta la pantalla en su lugar. Unirlos cambiaría
    el aspecto que dejó la F42, y eso no es de una fase de limpieza. Un
    componente nuevo que ninguna pantalla pinte pone la suite roja. */
export const COMPONENTES_SIN_PANTALLA = Object.freeze([
  { componente: 'RankStatus', archivo: 'src/components/rangos.jsx', fase: 'F15', enSuLugar: 'La etiqueta de confianza de la F20 (`RankConfidence`) y la línea de estado de cada tarjeta de Rangos.' },
  { componente: 'RankProgress', archivo: 'src/components/rangos.jsx', fase: 'F15', enSuLugar: '`RankNextLevelBar` (F23), la barra de la tarjeta del siguiente rango, con su porcentaje al lado. La F23 decía reutilizar ésta y no lo hizo.' },
  { componente: 'MuscleContribution', archivo: 'src/views/DetalleMuscularView.jsx', fase: 'F18', enSuLugar: 'La lista de contribución de la F21 (`contribucionMuscular.jsx`), que dice además cuánto aporta cada ejercicio.' },
  { componente: 'GoalProgress', archivo: 'src/components/objetivosFitness.jsx', fase: 'F30', enSuLugar: 'El detalle del objetivo de la F14 (`DetalleObjetivo`), ampliado en la F30 con la distancia: «Te faltan 3 reps».' },
  { componente: 'GoalEmpty', archivo: 'src/components/objetivosFitness.jsx', fase: 'F30', enSuLugar: 'El vacío de «Mis objetivos» (`OBJETIVOS_VACIO`, F14), con su botón de crear.' },
  { componente: 'GoalCompletion', archivo: 'src/components/objetivosFitness.jsx', fase: 'F30', enSuLugar: 'El «Objetivo conseguido» del detalle y la pantalla de éxito de la F8, que lo dice con `objetivosQueConsigueLaSesion` (F14).' },
  { componente: 'MissingData', archivo: 'src/components/estadosFitness.jsx', fase: 'F39', enSuLugar: 'El «—» que escribe cada pantalla cuando `duracionCreible()` o el volumen devuelven `null`.' },
]);
const limpiarCodigo = (src) => sinComentarios(src).replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, "''");
export function componentesSinPantalla(componentes, produccion) {
  const usos = Object.fromEntries(Object.entries(produccion || {}).map(([r, s]) => {
    const c = new Map();
    for (const t of limpiarCodigo(s).match(/[A-Za-z_$][\w$]*/g) || []) c.set(t, (c.get(t) || 0) + 1);
    return [r, c];
  }));
  return Object.entries(componentes || {}).flatMap(([ruta, src]) => [...String(src || '').matchAll(/^export (?:default )?function ([A-Z]\w*)/gm)]
    .map((m) => m[1])
    .filter((n) => {
      const porDefecto = new RegExp(`export default ${n}\\b`).test(src) ? 1 : 0;
      const propio = ((usos[ruta] && usos[ruta].get(n)) || 0) > 1 + porDefecto;
      return !propio && !Object.entries(usos).some(([r, c]) => r !== ruta && c.get(n));
    })
    .map((componente) => ({ ruta, componente })));
}

/** Apartado 45 — dos librerías de Fitness que exportan el MISMO nombre con
    significados distintos. Un `export { x }` que reexporta el de otra es el
    mismo, y se permite (EH F17). Las tablas que declaran lo que ya existía o lo
    que queda preparado se llaman igual en cada fase a propósito. */
export const NOMBRES_DE_DECLARACION = /^(YA_[A-Z_]+|PREPARADO_PARA|NO_EN_FIT\d+|DECISIONES_FIT\d+|HECHO_F\d+)$/;
export function nombresRepetidos(librerias) {
  const donde = new Map();
  Object.entries(librerias || {}).forEach(([ruta, src]) => {
    const limpio = sinComentarios(src);
    for (const m of limpio.matchAll(/^export (?:async )?(?:function|const|let|class) (\w+)/gm)) {
      if (NOMBRES_DE_DECLARACION.test(m[1])) continue;
      if (!donde.has(m[1])) donde.set(m[1], []);
      donde.get(m[1]).push(ruta);
    }
  });
  return [...donde.entries()].filter(([, r]) => r.length > 1).map(([nombre, rutas]) => ({ nombre, rutas }));
}

/** Apartado 57 — exportaciones que no usa nadie, ni una pantalla ni una prueba. */
export function exportacionesSinUso(librerias, todos) {
  const tokens = Object.fromEntries(Object.entries(todos || {}).map(([r, s]) => {
    const c = new Map();
    for (const t of String(s || '').match(/[A-Za-z_$][\w$]*/g) || []) c.set(t, (c.get(t) || 0) + 1);
    return [r, c];
  }));
  return Object.entries(librerias || {}).flatMap(([ruta, src]) => [...String(src || '').matchAll(/^export (?:async )?(?:function|const|let|class) (\w+)/gm)]
    .map((m) => m[1])
    .filter((n) => !((tokens[ruta] && tokens[ruta].get(n)) > 1)
      && !Object.entries(tokens).some(([r, c]) => r !== ruta && c.get(n)))
    .map((nombre) => ({ ruta, nombre })));
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LO QUE SE HIZO, LO QUE SE MIRÓ Y ESTABA BIEN, Y LO QUE NO
   ═══════════════════════════════════════════════════════════════════════════ */

export const ELIMINADO_F44 = Object.freeze([
  { que: '`sustitutosSugeridos` (entrenamiento.js, F7)', porque: 'Era una segunda forma de decidir qué es compatible al sustituir; desde la F33 lo decide `getExerciseReplacements` y la pantalla lo pide por `sustitutosCompatibles`. Apartado 12.' },
  { que: '`reiniciarDescanso` y `descansoTerminado` (entrenamiento.js, F7)', porque: 'Superados por la F9: la pantalla reinicia con `iniciarDescanso`, que guarda el descanso en la sesión, y el fin lo dice `restanteDescanso`.' },
  { que: '`sustitucionesDe` (sustitucion.js)', porque: 'Un alias de `getExerciseReplacements`: dos nombres para la misma función (apartado 45).' },
  { que: '`aplicarGuardado` (finalizacion.js)', porque: 'Decía ser «lo que llama la pantalla» y no lo llamaba nadie. Las pruebas hacen ahora las dos llamadas de verdad.' },
  { que: '`planEliminarPlantilla` (plantillas.js)', porque: 'Una segunda definición de «borrar una plantilla»: la de verdad es la confirmación de la pantalla y la papelera de `App.jsx`.' },
  { que: '`TOPE_ESCALA`, `GRUPOS_TOTALES`, `DESTACADOS_MIN`, `NO_HAY_EDICION`, `familiaDePatronDe`, `nombreDePatron`, `nombreDeSubgrupo`', porque: 'Nadie los usaba: ni una pantalla ni una prueba (apartado 57).' },
  { que: 'La copia de `grupoMuscular` en detalleMuscular.js', porque: 'La misma función que la de fitness.js, escrita otra vez; ahora se reexporta la de allí.' },
  { que: 'Siete copias de «número con coma decimal»', porque: 'Cuatro redondeaban a dos decimales y tres no (apartado 39). Ahora es `decimal` de `numerosFitness.js`, con su prueba de que ninguna vuelve (`comasADesmano`).' },
  { que: 'La octava: el «% de peso» de la comparación en la ficha de un ejercicio', porque: 'Ya venía redondeado a un decimal, así que se lee igual; ahora pasa por `decimal` como las otras siete.' },
  { que: '28 imports y 2 variables que nadie usaba, en 16 archivos', porque: 'Los encontró un lint pasado una vez (apartado 31); ahora los caza `importsSinUso` en cada pasada.' },
  { que: '`VacioFitness` (FitnessView, F1)', porque: 'El vacío de las áreas de la F1: desde que cada área es su pantalla no lo pintaba nadie, ni una prueba.' },
  { que: 'La fórmula del fin del descanso en la pantalla del entrenamiento en vivo', porque: 'Repetía la de `restanteDescanso`: ahora es `finDelDescanso` (apartado 3).' },
]);

export const RENOMBRADO_F44 = Object.freeze([
  { antes: 'ESTADOS_PANTALLA (resumenRangos.js)', despues: 'ESTADOS_PANTALLA_RANGOS', porque: 'La F39 tiene otros `ESTADOS_PANTALLA` (LOADING, READY…).' },
  { antes: 'BLOQUES (resumenRangos.js · resumenProgreso.js)', despues: 'BLOQUES_RANGOS · BLOQUES_PROGRESO', porque: 'Dos catálogos de bloques distintos con el mismo nombre.' },
  { antes: 'PESOS (colaClasificacion.js · acabadoFitness.js)', despues: 'PESOS_PRIORIDAD · PESOS_LETRA', porque: 'Los pesos de la cola de clasificación y los de la letra.' },
  { antes: 'PAPELES (contribucionMuscular.js)', despues: 'NOMBRE_DE_PAPEL', porque: 'Es un mapa id → nombre; `PAPELES` es la lista de la F2.' },
  { antes: 'VISIBILIDADES (fotosProgreso.js)', despues: 'VISIBILIDADES_FOTO', porque: 'Las de una sesión (F8) son otra lista, con otros campos.' },
  { antes: 'PUNTOS_MINIMOS_GRAFICA (historialRangos.js)', despues: 'PUNTOS_PARA_GRAFICA_RANGO', porque: 'Vale 4 y el de la F12 vale 3: dos reglas distintas con el mismo nombre.' },
]);

export const CENTRALIZADO_F44 = Object.freeze([
  { que: 'La explicación de un rango se pide por `explicacionDeRango`', porque: 'Es la puerta única de la F20 (su apartado 2), y Rangos y el detalle muscular llamaban cada uno a su función.' },
]);

/** Lo que se inspeccionó y ya estaba bien (sin esta lista, la siguiente sesión
    lo vuelve a barrer, como dijo la SF F1). */
export const REVISADO_Y_BIEN_F44 = Object.freeze([
  { apartado: 48, que: 'Ciclos de imports', porque: 'Ni uno en todo `src/`: se comprueba en cada pasada.' },
  { apartado: 19, que: 'Almacenamiento directo en pantallas', porque: 'Ninguna pantalla de Fitness toca `localStorage`; el borrador del constructor vive en su librería.' },
  { apartado: 40, que: 'Errores tragados', porque: 'Todo `catch` de Fitness dice por qué, o devuelve el error (F37 y F41).' },
  { apartado: 41, que: 'Logs', porque: 'Ni un `console.log`.' },
  { apartados: [27, 28, 29, 30], que: 'Escuchadores, temporizadores, URLs temporales y suscripciones', porque: 'Los vigila la F40 (`intervalosSinLimpiar`, `escuchadoresSinQuitar`, `urlsSinRevocar`).' },
  { apartado: 42, que: 'Herramientas de diagnóstico', porque: 'El de la F35 solo existe con `esDesarrollo()`.' },
  { apartado: 20, que: 'Cachés', porque: 'Las de la F40 dicen qué guardan y de qué dependen, y cada una tiene su prueba de que devuelve lo mismo que sin ella.' },
  { apartado: 22, que: 'Estado global duplicado', porque: 'La sesión en curso, el plan activo y los resúmenes se derivan: ni una copia en el estado de React (F7, F28).' },
  { apartado: 12, que: '`sustitutosDe` (ejercicios.js, F2)', porque: 'Lee la lista `sustitutos` que declara cada ejercicio del catálogo: es el dato que usa el motor de la F33, no un segundo motor. Lo usan sus pruebas y se queda (apartado 57).' },
  { apartado: 5, que: 'Hooks', porque: 'Los cinco de Fitness hacen una cosa cada uno y ninguno guarda: `useAhora` (el tic del reloj, F40), `useDialogoAccesible` (el foco, F39), `useScrollAlVolver` (la posición, F38), `useUrlsFirmadas` (firmar fotos, F26) y `useComparador` (el estado del comparador, F27). Lo comprueba `CATALOGO_HOOKS`.' },
  { apartado: 6, que: 'Servicios', porque: 'No hay una capa de servicios, y no hace falta: guardar es `guardarFitness` de `App.jsx` sobre `saveData`, y cada motor es una librería de funciones (apartado 6: «no crear servicios artificiales si una función sencilla es suficiente»).' },
  { apartado: 58, que: 'Flags', porque: 'Uno solo, y no es temporal: `esDesarrollo()` esconde el diagnóstico del catálogo en el build (F35). Ni una función duplicada detrás de un flag viejo.' },
  { apartado: 24, que: 'Efectos', porque: 'Un lint de verdad da cinco avisos de dependencias en tres efectos, y los tres son a propósito: van por la CLAVE —el id del ejercicio actual, los ids de los vídeos a comparar, el foco que llega de Inicio—, no por el objeto que se rehace en cada pintado. El cuarto, en Progreso, sí era real y se arregló (`SIN_PROPIOS`).' },
  { apartado: 31, que: 'Lint', porque: 'El proyecto no tiene lint y no se le añade (apartado 40 de la F45: ni una dependencia sin necesidad). Se pasó UNA vez, fuera del proyecto —ESLint 9 con las reglas recomendadas y las de los hooks sobre los 84 archivos del mapa—: ni una regla de hooks rota, ni un nombre sin declarar, ni un `catch` vacío; 28 imports y 2 variables sin usar, retirados. Lo que se queda vigilándolo es `importsSinUso`, en cada pasada.' },
  { apartado: 14, que: 'TypeScript', porque: 'El proyecto es JavaScript con JSDoc (FIT F35, apartado 35): no hay `any` ni `as unknown as` que limpiar.' },
]);

/** Apartados 43 y 44 — las pruebas críticas, cada una con la suite que la
    cubre. Las suites ya van agrupadas por motor y por fase; lo que faltaba era
    decir cuál protege cada cosa, y comprobar que existe y que se ejecuta. */
export const PRUEBAS_CRITICAS = Object.freeze([
  { que: 'Completar una sesión', suite: 'scripts/test-finalizacion.mjs' },
  { que: 'Guardar dos veces deja una sola sesión', suite: 'scripts/test-finalizacion.mjs' },
  { que: 'Persistir la sesión y recuperarla', suite: 'scripts/test-entrenamiento.mjs' },
  { que: 'La puerta de carga, la cuarentena y las migraciones', suite: 'scripts/test-persistencia-fitness.mjs' },
  { que: 'RankEngine', suite: 'scripts/test-motor-rangos.mjs' },
  { que: 'ProgressEngine', suite: 'scripts/test-progresion.mjs' },
  { que: 'GoalEngine', suite: 'scripts/test-objetivos-progreso.mjs' },
  { que: 'ReplacementEngine', suite: 'scripts/test-sustitucion.mjs' },
  { que: 'PlanningEngine', suite: 'scripts/test-planificacion-semanal.mjs' },
  { que: 'Los flujos completos, con la puerta de carga entre paso y paso', suite: 'scripts/test-auditoria-fitness.mjs' },
]);

/** Apartado 5 — los hooks de Fitness, y dónde viven. Ninguno puede tocar lo
    guardado: un hook que guarda mezcla la pantalla con la persistencia.
    ⚠️ No es `HOOKS_FITNESS` de la F40: aquélla es la lista de los dos ARCHIVOS
    de ganchos que su auditoría lee además de `ARCHIVOS_FITNESS`. Lo cazó esta
    misma auditoría al estrenarse (un nombre, un significado). */
export const CATALOGO_HOOKS = Object.freeze([
  { hook: 'useAhora', archivo: 'src/views/EntrenamientoVivoView.jsx', hace: 'Repinta el número del reloj, no la pantalla (F40).' },
  { hook: 'useDialogoAccesible', archivo: 'src/components/dialogoAccesible.js', hace: 'El foco y el teclado de una hoja (F39).' },
  { hook: 'useScrollAlVolver', archivo: 'src/components/scrollAlVolver.js', hace: 'Volver a una lista donde estaba (F38).' },
  { hook: 'useUrlsFirmadas', archivo: 'src/components/fotosProgreso.jsx', hace: 'Firma las fotos que se ven, y marca la que no carga (F26 y F27).' },
  { hook: 'useComparador', archivo: 'src/components/comparadorFotos.jsx', hace: 'El estado del comparador: modo, lados, zoom (F27).' },
]);

export const PENDIENTES_F44 = Object.freeze([
  { que: '`ProgresoView.jsx` tiene 1 500 líneas', porque: 'Son una docena de componentes de Progreso, con sus comentarios. Partirlo es mover código sin ganar nada que la F44 pida: apartado 46 («no hacer una reorganización masiva si no aporta valor»).' },
  { que: 'Estados de sesión como cadenas', porque: '`ESTADOS_SESION` existe y la puerta de carga no deja pasar uno desconocido (`crearWorkoutSession`, F1); sustituir sus treinta comparaciones en diez archivos por constantes sería la reescritura que el apartado prohíbe.' },
  { que: 'Una pila de navegación común a Fitness', porque: 'La dejó escrita la F43 (apartado 68).' },
]);

export const NO_EN_FIT44 = Object.freeze([
  { que: 'IA, social, XP, leaderboard, estadísticas nuevas, recomendaciones, predicciones', porque: 'Apartado 64.' },
  { que: 'Rediseñar Fitness', porque: 'Apartado 63: lo hizo la F42.' },
  { que: 'Migrar a TypeScript', porque: 'Apartado 56 y FIT F35: sería sobreingeniería para una PWA personal.' },
]);

export const DECISIONES_FIT44 = Object.freeze([
  { que: 'Se retira una función solo si nada de producción la usa Y hay otra que hace lo mismo, o si no la usa nadie', porque: 'Apartado 57: «eliminar únicamente después de confirmar que no se utilizan». Las que solo usan las pruebas para construir escenarios (`olvidarClasificacion`, `pausarSesion`) se quedan.' },
  { que: 'Un nombre repetido se renombra en la librería que lo usa menos', porque: 'Menos cambios y el mismo resultado: cada nombre, un significado.' },
  { que: 'Las utilidades de fechas y números son hojas del árbol', porque: 'Las puede importar cualquier archivo de Fitness sin crear un ciclo (F42).' },
]);

/** La auditoría de la fase: lo que tiene que dar cero. */
export function auditarArquitectura({ todos = {}, fitness = {}, pantallas = {}, librerias = {}, produccion = null } = {}) {
  const src = produccion || Object.fromEntries(Object.entries(todos).filter(([r]) => r.startsWith('src/')));
  const declarados = new Set(COMPONENTES_SIN_PANTALLA.map((c) => `${c.archivo}#${c.componente}`));
  const casillas = [
    { id: 'sin_ciclos', que: 'Ni un ciclo de imports en `src/`', hallado: ciclosDeImports(todos) },
    { id: 'sin_almacenamiento', que: 'Ninguna pantalla de Fitness toca el almacenamiento', hallado: almacenamientoDirecto(pantallas) },
    { id: 'sin_catch_vacio', que: 'Ni un `catch` vacío sin explicar', hallado: catchSinExplicar(fitness) },
    { id: 'sin_logs', que: 'Ni un `console.log`', hallado: logsSueltos(fitness) },
    { id: 'claves_estables', que: 'Ninguna lista reordenable con `key={i}`', hallado: clavesPorPosicion(pantallas) },
    { id: 'dependencias', que: 'Fitness solo importa de fuera lo declarado (ni Economía, ni Estudios, ni Armario, ni Hábitos)', hallado: dependenciasNoDeclaradas(fitness) },
    { id: 'un_nombre', que: 'Un nombre exportado, un significado', hallado: nombresRepetidos(librerias) },
    { id: 'una_coma', que: 'Los decimales se escriben con `decimal`', hallado: comasADesmano(fitness) },
    { id: 'sin_imports_muertos', que: 'Ni un import que el archivo no use', hallado: importsSinUso(fitness) },
    { id: 'componentes_pintados', que: 'Ni un componente que solo pinte el banco de renderizado sin estar declarado', hallado: componentesSinPantalla(pantallas, src).filter((c) => !declarados.has(`${c.ruta}#${c.componente}`)) },
    { id: 'sin_muertos', que: 'Ni una exportación que no use nadie', hallado: exportacionesSinUso(librerias, todos) },
  ];
  return { ok: casillas.every((c) => c.hallado.length === 0), casillas };
}
