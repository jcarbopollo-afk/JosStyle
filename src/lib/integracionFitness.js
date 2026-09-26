import { ejercicioPorId } from './ejercicios';
import { subgrupoMuscular } from './fitness';
import { validateExerciseCatalog } from './validacionCatalogo';
import { guardarRutina } from './constructor';
import { usarPlan } from './planes';
import { planificadoEnFecha } from './tuPlan';
import { empezarSesion, sesionActiva, ejerciciosDeSesion, guardarSesion } from './entrenamiento';
import { guardarEntrenamiento } from './finalizacion';
import { sesionesDelHistorial } from './historial';
import { progresoDeEjercicio } from './progresion';
import { progresoDeGrupo } from './progresoMuscular';
import { progresoDeObjetivo } from './objetivosProgreso';
import { rangoEfectivoDeEjercicio, rangoGlobalEfectivo } from './motorRangos';
import { contribucionDeEjercicio } from './contribucionMuscular';
import { historialDeRango } from './historialRangos';
import { resumenDeActividad } from './actividadEntrenamiento';
import { relacionConElDia } from './planificacionSemanal';
import { getExerciseReplacements } from './sustitucion';
import { fichaDeBiblioteca } from './bibliotecaEjercicios';
import { sesionDeFoto } from './fotosProgreso';
import { clasificarEjercicio } from './clasificacion';

/* Entrega 4 · Fase 36/45 — «Integración global del sistema fitness».
   ═══════════════════════════════════════════════════════════════════════════

   *"NO queremos crear nuevas funcionalidades grandes. Queremos conectar
   correctamente las existentes."* Así que esta librería **no calcula nada
   propio**: declara, con las funciones de verdad importadas, **qué función
   contesta cada pregunta** de Fitness, **qué pantalla lleva a cuál y dónde está
   cableado**, y cómo se enteran las pantallas de que algo ha cambiado. Y trae
   una auditoría que mira los datos de Josué de un extremo a otro.

   ───────────────────────────────────────────────────────────────────────────
   LO QUE LA FASE ENCONTRÓ, Y SE ARREGLÓ DONDE NACÍA
   ───────────────────────────────────────────────────────────────────────────

   · 🐛 **Historial → ejercicio no existía** (apartados 13 y 14): el detalle de
     una sesión sabía llevar al progreso de un ejercicio (`onVerEjercicio`),
     pero *Entrenamiento → Historial* y la sesión abierta desde *Tu Plan* no se
     lo pasaban. Solo funcionaba entrando por Progreso.
   · 🐛 **Foto → entrenamiento no existía** (apartados 30 y 31): el visor de la
     F26 enseña el entrenamiento de una foto como enlace si le llega `onSesion`,
     y Progreso no se lo pasaba: salía como texto muerto.
   · 🐛 **El rango medía el pasado con el peso corporal de hoy** (apartado 39):
     cambiar de peso reescribía los rangos de hace meses —y la evolución de la
     F22—. La sesión guarda ahora su peso corporal con el snapshot (F7).
   · 🐛 **Un fallo al pintar una pestaña se llevaba la aplicación** (apartado
     47): no había ni un límite de error. Ahora cada área de Fitness tiene el
     suyo (`AreaSegura`).
   · ⚠️ **Lógica duplicada** (apartado 52): la regla del peso corporal válido
     estaba escrita dos veces, idéntica, en la F15 y la F17. Ahora vive una vez
     (`pesoCorporalValido`, en `fitness.js`).
   · 🔓 **Añadir a la sesión en curso** (apartado 17): desde la ficha de un
     ejercicio se podía añadir a una plantilla o a uno nuevo, no a lo que está
     entrenando. `anadirEjercicioASesion` (F7) lo hace sin tocar ni el catálogo
     ni la plantilla. */

/* ═══════════════════════════════════════════════════════════════════════════
   1 · UNA FUNCIÓN POR PREGUNTA (apartados 1, 2, 45 y 52)
   ═══════════════════════════════════════════════════════════════════════════

   Cada línea guarda **la función importada**, no su nombre: renombrar una
   rompe la compilación, y la prueba comprueba que `es.name` es la que dice.
   Si una fase futura necesita una de estas respuestas, **llama aquí**. */
export const FUENTES_DE_VERDAD = [
  { concepto: 'ejercicio', pregunta: 'Qué es un ejercicio: nombre, músculos, material, entorno', es: ejercicioPorId, fase: 'F2' },
  { concepto: 'calidad_catalogo', pregunta: 'Si el catálogo está bien', es: validateExerciseCatalog, fase: 'F35' },
  { concepto: 'plantilla', pregunta: 'Guardar un entrenamiento suyo', es: guardarRutina, fase: 'F3' },
  { concepto: 'plan', pregunta: 'Qué plan sigue', es: usarPlan, fase: 'F5' },
  { concepto: 'planificado', pregunta: 'Qué tocaba un día', es: planificadoEnFecha, fase: 'F32' },
  { concepto: 'sesion', pregunta: 'Empezar un entrenamiento (con su snapshot)', es: empezarSesion, fase: 'F7' },
  { concepto: 'guardado', pregunta: 'Darlo por hecho', es: guardarEntrenamiento, fase: 'F8' },
  { concepto: 'historial', pregunta: 'Qué entrenamientos cuentan', es: sesionesDelHistorial, fase: 'F10' },
  { concepto: 'progreso', pregunta: 'Cómo va un ejercicio', es: progresoDeEjercicio, fase: 'F11' },
  { concepto: 'progreso_muscular', pregunta: 'Cómo va un grupo muscular', es: progresoDeGrupo, fase: 'F13' },
  { concepto: 'objetivo', pregunta: 'Cuánto le falta a un objetivo', es: progresoDeObjetivo, fase: 'F14' },
  { concepto: 'rango', pregunta: 'Qué rango tiene un ejercicio', es: rangoEfectivoDeEjercicio, fase: 'F19' },
  { concepto: 'rango_global', pregunta: 'Qué rango tiene en general', es: rangoGlobalEfectivo, fase: 'F19' },
  { concepto: 'contribucion', pregunta: 'Cuánto aporta un ejercicio a un músculo', es: contribucionDeEjercicio, fase: 'F21' },
  { concepto: 'historial_rango', pregunta: 'Cómo ha evolucionado un rango', es: historialDeRango, fase: 'F22' },
  { concepto: 'clasificacion', pregunta: 'Qué contestó en el cuestionario', es: clasificarEjercicio, fase: 'F17' },
  { concepto: 'actividad', pregunta: 'Cuánto entrena', es: resumenDeActividad, fase: 'F31' },
  { concepto: 'dia_del_plan', pregunta: 'Si una sesión era la de ese día', es: relacionConElDia, fase: 'F32' },
  { concepto: 'sustitucion', pregunta: 'Qué puede sustituir a un ejercicio', es: getExerciseReplacements, fase: 'F33' },
  { concepto: 'ficha', pregunta: 'Todo lo que se sabe de un ejercicio', es: fichaDeBiblioteca, fase: 'F34' },
  { concepto: 'foto', pregunta: 'De qué entrenamiento es una foto', es: sesionDeFoto, fase: 'F26' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LAS CONEXIONES ENTRE PANTALLAS (apartados 13-33 y 48)
   ═══════════════════════════════════════════════════════════════════════════

   Una línea por puerta, con **el archivo y el trozo de código que la cablea**:
   la prueba abre cada archivo y lo busca. Así una puerta que se quede sin
   pasar su función —como las dos que encontró esta fase— se pone roja el
   mismo día (la lección de `onDeleteMovimiento`, E3 F1). */
export const CONEXIONES = [
  { de: 'Historial · sesión', a: 'Progreso de un ejercicio', apartado: 13, archivo: 'src/views/FitnessView.jsx', cableado: /onEliminar=\{onEliminarSesion\}\s*onVerEjercicio=\{onVerProgresoEjercicio\}/, fase: 'F36' },
  { de: 'Tu Plan · sesión', a: 'Progreso de un ejercicio', apartado: 13, archivo: 'src/views/FitnessView.jsx', cableado: /volverEtiqueta="Volver a Tu Plan"\s*onVerEjercicio=\{onVerProgresoEjercicio\}/, fase: 'F36' },
  { de: 'Progreso · sesión', a: 'Progreso de un ejercicio', apartado: 14, archivo: 'src/views/ProgresoView.jsx', cableado: /volverEtiqueta="Volver a Progreso"\s*onVerEjercicio=/, fase: 'F29' },
  { de: 'Progreso de un ejercicio', a: 'La sesión de ese día', apartado: 15, archivo: 'src/views/ProgresoView.jsx', cableado: /onVerSesion=\{\(id\) => setVista\(\{ tipo: 'sesion', id \}\)\}/, fase: 'F29' },
  { de: 'Progreso de un ejercicio', a: 'Su ficha', apartado: 16, archivo: 'src/views/ProgresoView.jsx', cableado: /onVerEjercicio=\{\(\) => setVista\(\{ tipo: 'ejercicio'/, fase: 'F29' },
  { de: 'Ficha', a: 'Entrenamiento nuevo, plantilla o sesión en curso', apartado: 17, archivo: 'src/views/EjerciciosView.jsx', cableado: /onAnadirASesion=\{guardar/, fase: 'F34 + F36' },
  { de: 'Ficha', a: 'Su objetivo, o crear uno', apartado: 18, archivo: 'src/views/EjerciciosView.jsx', cableado: /onCrearObjetivo=\{onCrearObjetivo\}/, fase: 'F34' },
  { de: 'Ficha', a: 'Su progreso y su rango', apartado: 19, archivo: 'src/views/EjerciciosView.jsx', cableado: /onVerProgreso=\{onVerProgreso\}/, fase: 'F34' },
  { de: 'Rango de un músculo', a: 'Progreso de un ejercicio', apartado: 22, archivo: 'src/views/FitnessView.jsx', cableado: /onEjercicio=\{\(id\) => \{ setFocoEjercicio\(id\); setArea\('progreso'\); \}\}/, fase: 'F18' },
  { de: 'Rango de un ejercicio', a: 'Su evolución', apartado: 26, archivo: 'src/views/ProgresoView.jsx', cableado: /onHistorialRango=\{\(\) => setVista\(\{ tipo: 'historialRango'/, fase: 'F29' },
  { de: 'Rango general', a: 'Su evolución', apartado: 26, archivo: 'src/views/RangosView.jsx', cableado: /onHistorial=\{\(\) => setHistorial\(true\)\}/, fase: 'F22' },
  { de: 'Objetivo', a: 'Las sesiones que contribuyeron', apartado: 33, archivo: 'src/views/ProgresoView.jsx', cableado: /<GoalHistory[^>]*onVerSesion=\{onVerSesion\}/, fase: 'F30' },
  { de: 'Foto', a: 'Su entrenamiento', apartado: 30, archivo: 'src/views/ProgresoView.jsx', cableado: /onSesion=\{\(id\) => setVista\(\{ tipo: 'sesion', id \}\)\}/, fase: 'F36' },
  { de: 'Tu Plan · día', a: 'Su sesión', apartado: 11, archivo: 'src/views/FitnessView.jsx', cableado: /onVerSesion=\{\(id\) => setSesionAbierta\(id\)\}/, fase: 'F32' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   3 · CÓMO SE ENTERAN LAS PANTALLAS (apartados 7, 9, 37, 44 y 56)
   ═══════════════════════════════════════════════════════════════════════════

   El apartado 44 pide *"una pequeña capa central fitnessDataChanged() o
   equivalente"* y *"No crear un event bus complejo si no es necesario"*. **El
   equivalente ya existe, y es mejor que un aviso**: nada de Fitness guarda una
   cifra derivada —ni progreso, ni rango, ni actividad, ni racha— y cada
   guardado crea un objeto `fitness` **nuevo**. Las cachés (`progresion.js`,
   `historialRangos.js`, `progresoMuscular.js`, `sustitucion.js`) van en un
   `WeakMap` **por objeto**, así que la siguiente lectura no encuentra la caché y
   recalcula. No hay nada que avisar porque no hay nada viejo que borrar.

   Esta tabla dice qué cambia en el dato con cada evento del apartado y qué
   deja de valer —y la prueba lo EJECUTA: guarda, y mira que cambie—. */
export const EVENTOS_FITNESS = [
  { id: 'WORKOUT_COMPLETED', cambia: 'fitness.sesiones (una pasa a completada)', recalcula: ['historial', 'progreso', 'progreso_muscular', 'objetivo', 'rango', 'rango_global', 'actividad', 'dia_del_plan'] },
  { id: 'WORKOUT_DELETED', cambia: 'fitness.sesiones (una va a la papelera)', recalcula: ['historial', 'progreso', 'progreso_muscular', 'objetivo', 'rango', 'rango_global', 'actividad', 'historial_rango'], noToca: ['foto'] },
  { id: 'PHOTO_ADDED', cambia: 'saludFotos', recalcula: ['foto'] },
  { id: 'GOAL_UPDATED', cambia: 'fitness.objetivos', recalcula: ['objetivo'], noToca: ['rango'] },
  { id: 'CLASSIFICATION_UPDATED', cambia: 'fitness.clasificaciones', recalcula: ['rango', 'rango_global', 'historial_rango'] },
  { id: 'PLAN_CHANGED', cambia: 'fitness.planActivo y fitness.planesAnteriores', recalcula: ['planificado', 'dia_del_plan'], noToca: ['historial'] },
];

/** El `fitness` sin nada guardado que se pueda calcular: la lista de campos
 *  que **sí** se guardan, y la prueba mira que no aparezca otro. */
export const CAMPOS_GUARDADOS = [
  'version', 'ejercicios', 'plantillas', 'planes', 'sesiones', 'objetivos', 'clasificaciones', 'rangos',
  'planActivo', 'planesAnteriores', 'favoritosPlanes', 'favoritosEjercicios',
];

/* Lo que JAMÁS se guarda, porque se deriva (apartados 32, 34, 36 y 51). */
export const DERIVADOS_PROHIBIDOS = [
  'progreso', 'exerciseProgress', 'exerciseStats', 'exerciseHistory', 'exerciseRankData', 'estadisticas',
  'actividad', 'racha', 'streak', 'rangoGlobal', 'historialRangos', 'progresoMuscular',
];

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LO QUE TOCA UNA SESIÓN (apartado 56)
   ═══════════════════════════════════════════════════════════════════════════

   *"Completar serie de curl: actualizar curl → bíceps → brazos → rango
   correspondiente. No recalcular innecesariamente piernas, pecho…"* Durante el
   entrenamiento en vivo **no se recalcula nada de eso**: `FitnessView` pinta la
   sesión a pantalla completa y ni Progreso ni Rangos están montados. Lo que una
   sesión toca, en cambio, sí se puede decir, y es lo que usa la auditoría. */
export function afectadosPorSesion(sesion, propios = []) {
  const ids = [...new Set(ejerciciosDeSesion(sesion).map((e) => e && e.exerciseId).filter(Boolean))];
  const subgrupos = new Set();
  const grupos = new Set();
  ids.forEach((id) => {
    const ej = ejercicioPorId(id, propios);
    (ej ? ej.musculos : []).forEach((m) => {
      subgrupos.add(m.subgrupoId);
      const sg = subgrupoMuscular(m.subgrupoId);
      if (sg) grupos.add(sg.grupoId);
    });
  });
  return { exerciseIds: ids, subgrupos: [...subgrupos], grupos: [...grupos], conocidos: ids.filter((id) => !!ejercicioPorId(id, propios)) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LA AUDITORÍA DE LOS DATOS DE JOSUÉ (apartados 5, 31, 37, 41 y 55)
   ═══════════════════════════════════════════════════════════════════════════

   Mira `fitness` y las fotos de un extremo a otro. ⚠️ Casi nada de esto es un
   error: una sesión de un ejercicio que ya no está es **historia** (C-36), una
   foto de un entrenamiento borrado **se queda** (apartado 31) y un plan borrado
   no invalida sus sesiones (apartado 5). Se cuenta para poder decirlo, no para
   corregirlo: esta función no escribe nada. */
export function auditarDatosFitness(fitness, { propios = [], fotos = [] } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const sesiones = Array.isArray(f.sesiones) ? f.sesiones : [];
  const completadas = sesiones.filter((s) => s && s.estado === 'completada');
  const ids = sesiones.map((s) => s && s.id).filter(Boolean);
  const exerciseIds = [...new Set(completadas.flatMap((s) => ejerciciosDeSesion(s).map((e) => e && e.exerciseId)).filter(Boolean))];
  const archivados = exerciseIds.filter((id) => { const e = ejercicioPorId(id, propios); return !e || e.archivado === true; });
  const activas = sesiones.filter((s) => s && (s.estado === 'en_curso' || s.estado === 'pausada'));
  const idsSesion = new Set(ids);
  const fotosHuerfanas = (Array.isArray(fotos) ? fotos : [])
    .filter((x) => x && x.createdFromWorkoutId && !idsSesion.has(x.createdFromWorkoutId)).map((x) => x.id);
  const objetivosSinEjercicio = (Array.isArray(f.objetivos) ? f.objetivos : [])
    .filter((o) => o && o.exerciseId && !ejercicioPorId(o.exerciseId, propios)).map((o) => o.id);
  const derivados = Object.keys(f).filter((k) => DERIVADOS_PROHIBIDOS.includes(k));
  const casillas = [
    { id: 'ids_unicos', ok: ids.length === idsSesion.size, dato: `${ids.length} sesiones` },
    { id: 'una_sesion_activa', ok: activas.length <= 1, dato: `${activas.length} en curso` },
    { id: 'sin_derivados_guardados', ok: derivados.length === 0, dato: derivados.join(', ') || 'ninguno' },
    { id: 'activa_es_la_del_motor', ok: activas.length === 0 || (sesionActiva(f) && activas.some((s) => s.id === sesionActiva(f).id)), dato: '' },
  ];
  return {
    casillas,
    ok: casillas.every((c) => c.ok),
    /* Lo que se dice y no se corrige. */
    informa: {
      ejerciciosArchivados: archivados,
      fotosDeEntrenamientoBorrado: fotosHuerfanas,
      objetivosDeEjercicioArchivado: objetivosSinEjercicio,
    },
  };
}

/** Guardar una sesión es el único gesto del que cuelgan todas las pantallas:
 *  `guardarSesion` (F7) sustituye por id y devuelve un `fitness` nuevo. */
export const PUERTA_DE_GUARDADO = guardarSesion;

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LO QUE NO SE CONSTRUYE Y LO DECIDIDO
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT36 = [
  { que: 'Un bus de eventos para Fitness', porque: 'Apartado 44: "si la arquitectura actual lo permite" y "no crear un event bus complejo si no es necesario". Ya se recalcula todo al guardar, porque nada derivado se guarda y las cachés van por objeto.' },
  { que: 'Enlaces directos por URL (apartado 49)', porque: 'JosStyle navega con estado, no con rutas: el botón atrás del móvil y las URLs son una decisión pendiente de Josué (E3 F22). Dentro, los focos ya existen: focoEjercicio (F12), focoObjetivo (F33), focoVerObjetivo y ejercicioInicial (F34).' },
  { que: 'Editar una sesión histórica (apartado 38)', porque: 'No se permite hoy, y el apartado dice "no añadirlo ahora". La arquitectura ya está preparada: todo se deriva de la sesión.' },
  { que: 'IA, predicciones, XP, fórmulas o métricas nuevas', porque: 'Apartado 61.' },
  { que: 'Avisar de una pérdida temporal de persistencia (apartado 55)', porque: 'Lo que hay es de antes y aguanta: la sesión en curso se guarda en cada cambio y sobrevive a recargar (F7). Lo que falta es AVISAR si un guardado falla: `saveData` ya devuelve `{ ok, error }` (EH F52) y nadie lo lee todavía. Encenderlo es de toda la aplicación, no de Fitness, y hacerlo aquí sería esconder un cambio grande dentro de esta fase (apartado 62).' },
];

export const DECISIONES_FIT36 = [
  { que: 'La sesión guarda el peso corporal de su día', porque: 'Apartado 39. Es parte del snapshot de la F7; una sesión de antes no lo tiene y usa el del perfil, que es lo único que se sabe.' },
  { que: 'Un límite de error por área, y otro para Fitness entero', porque: 'Apartado 47. Manda el error a la consola (el recorrido lo cuenta) y ofrece «Reintentar»; no esconde el fallo.' },
  { que: 'Lo añadido a la sesión en curso lleva series «añadida»', porque: 'El plan no las pedía: marcarlas «planificada» falsearía el planificado frente a realizado de la F9.' },
];
