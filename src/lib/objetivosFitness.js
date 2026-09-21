import { todayISO } from './helpers';
import { TIPOS_OBJETIVO, tipoObjetivo } from './fitness';
import {
  metricasDeEjercicio, validarObjetivo, valorActual, conseguido, estadoDeObjetivo,
  progresoDeObjetivo, listaDeObjetivos, anadirObjetivo, editarObjetivo, cancelarObjetivo,
  ESTADOS_VISIBLES,
} from './objetivosProgreso';
import { aparicionesDeEjercicio } from './progresion';
import { ejercicioPorId, nombreCompleto, progresionesDe } from './ejercicios';
import { etiquetaDeFecha } from './historial';

/* ===========================================================================
   ENTREGA 4 · FASE 30/45 — SISTEMA AVANZADO DE OBJETIVOS FITNESS

   *"Convertir los objetivos de Fitness en un sistema completo de seguimiento"*,
   con su criterio de finalización: crear → entrenar → registrar → actualizar →
   alcanzar → **marcarlo automáticamente** → conservar el histórico.

   🚨 **LOS OBJETIVOS YA EXISTEN Y SON LA F14** (`objetivosProgreso.js`, clave
   `fitness.objetivos`), y el apartado 2 lo ordena: *"Si el proyecto ya tiene
   campos equivalentes: REUTILIZARLOS. No crear duplicados."* Modelo,
   validación, unidades, progreso desde la mejor marca real, estados, filtros,
   edición, cancelación y borrado **son suyos** y no se reescriben aquí: están
   en `YA_LO_RESUELVE_LA_F14`, guardados como **funciones importadas**.

   🚨 **Y AQUÍ NO SE PREDICE NADA** (contexto y apartado 34, tres veces): ni
   *"lo conseguirás en 12 días"*, ni una velocidad de progreso, ni una fecha.
   Solo lo que el dato sostiene: cuánto falta, y desde cuándo.
   =========================================================================== */

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LO QUE YA RESOLVÍA LA F14 (y por eso no se escribe aquí)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ Se guardan **las funciones**, no sus nombres: renombrar una rompe la
   compilación (FIT F27 y F29). Trece de los cuarenta y cinco apartados de esta
   fase los cierra la F14 sin tocar una línea. */

export const YA_LO_RESUELVE_LA_F14 = [
  { pide: 'Apartado 2 · el modelo ProgressGoal con sus campos', es: progresoDeObjetivo, nombre: 'progresoDeObjetivo' },
  { pide: 'Apartados 7 y 8 · validar el objetivo y su unidad', es: validarObjetivo, nombre: 'validarObjetivo' },
  { pide: 'Apartado 8 · qué se puede medir en cada ejercicio', es: metricasDeEjercicio, nombre: 'metricasDeEjercicio' },
  { pide: 'Apartados 11, 12 y 13 · el progreso real, desde la MEJOR marca', es: valorActual, nombre: 'valorActual' },
  { pide: 'Apartados 15 y 26 · conseguirlo al superar el objetivo', es: conseguido, nombre: 'conseguido' },
  { pide: 'Apartados 18, 19 y 20 · activos, completados y cancelados', es: listaDeObjetivos, nombre: 'listaDeObjetivos' },
  { pide: 'Apartado 5 · crear', es: anadirObjetivo, nombre: 'anadirObjetivo' },
  { pide: 'Apartados 21 y 22 · editar conservando el id', es: editarObjetivo, nombre: 'editarObjetivo' },
  { pide: 'Apartado 20 · cancelar', es: cancelarObjetivo, nombre: 'cancelarObjetivo' },
  { pide: 'Apartado 29 · los tres estados, sin «failed»', es: estadoDeObjetivo, nombre: 'estadoDeObjetivo' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   2 · QUÉ SE PUEDE PEDIR DE UN EJERCICIO (apartados 3 y 6)
   ═══════════════════════════════════════════════════════════════════════════
   Los tres numéricos los decide `metricasDeEjercicio` (F14) y **no se tocan**;
   la habilidad se ofrece *"solo cuando el ejercicio tenga una progresión
   estructurada"* (apartado 3), que en este catálogo es tener `progresiones`. */

export function tiposDeObjetivoPara(ejercicio) {
  if (!ejercicio) return [];
  const numericos = metricasDeEjercicio(ejercicio).map((id) => tipoObjetivo(id)).filter(Boolean);
  const conProgresion = lista(ejercicio.progresiones).length > 0;
  const skill = TIPOS_OBJETIVO.find((t) => t.numerico === false);
  return conProgresion ? [...numericos, skill] : numericos;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · HABILIDADES (apartados 3 y 14)
   ═══════════════════════════════════════════════════════════════════════════
   🚨 *"No inventar valores numéricos para skills"* y *"No mostrar «73 %
   completado» si no existe una escala válida"*.

   ⚠️ **Y en este catálogo las progresiones apuntan HACIA ABAJO**: las de la
   sentadilla pistol son la sentadilla al aire, el step-up y la zancada búlgara
   — los **peldaños previos**, no metas más duras. Así que el objetivo **es el
   ejercicio** y lo que se enseña es qué peldaños ya ha hecho: una lista, nunca
   una fracción. Contar «2 de 3 peldaños = 67 %» sería exactamente la escala
   inventada que el apartado 14 prohíbe. */

export const SIN_PORCENTAJE = 'Una habilidad se consigue o no: no tiene término medio que medir.';

export function progresionDeSkill(fitness, objetivo, { propios = [] } = {}) {
  const ej = ejercicioPorId(objetivo?.exerciseId, propios);
  if (!ej || objetivo?.tipo !== 'skill') return null;
  const peldanos = progresionesDe(ej, propios).map((p) => {
    const apariciones = aparicionesDeEjercicio(fitness, p.id, propios);
    return {
      exerciseId: p.id,
      nombre: nombreCompleto(p),
      hecho: apariciones.length > 0,
      veces: apariciones.length,
    };
  });
  const propia = aparicionesDeEjercicio(fitness, ej.id, propios);
  return {
    exerciseId: ej.id,
    objetivoNombre: nombreCompleto(ej),
    conseguida: propia.length > 0,
    /* El peldaño más avanzado que SÍ ha hecho, para «Progresión actual». */
    actual: [...peldanos].reverse().find((p) => p.hecho) || null,
    peldanos,
    /* 🚨 Ni fracción ni porcentaje: el apartado 14, literal. */
    porcentaje: null,
    sinPorcentaje: SIN_PORCENTAJE,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · CUÁNTO FALTA (apartado 33)
   ═══════════════════════════════════════════════════════════════════════════
   *"Te faltan 3 reps"*, *"Te faltan 5 kg"*, *"Te faltan 13 s"* — **y solo con
   datos fiables**. Sin una marca real no se dice cuánto falta, porque no se
   sabe de dónde parte; y de una habilidad no se dice nunca (apartado 14).

   ⚠️ Y esto NO es el apartado 34: decir lo que falta es aritmética sobre lo que
   ya hay. Decir *cuándo* llegará sería la predicción que prohíbe. */

export function distanciaAlObjetivo(progreso) {
  const p = progreso || {};
  if (!p.numerico || p.sinDatos || p.estado !== 'activo') return '';
  if (typeof p.actual !== 'number' || typeof p.objetivo !== 'number') return '';
  const falta = p.objetivo - p.actual;
  if (falta <= 0) return '';
  const t = tipoObjetivo(p.tipo);
  const n = Math.round(falta * 100) / 100;
  const cifra = String(n).replace('.', ',');
  if (t.id === 'reps') return `Te falta${n === 1 ? '' : 'n'} ${cifra} ${n === 1 ? 'rep' : 'reps'}`;
  return `Te falta${n === 1 ? '' : 'n'} ${cifra} ${t.unidad}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · EL HISTORIAL QUE HA CONTRIBUIDO (apartado 31)
   ═══════════════════════════════════════════════════════════════════════════
   *"Mostrar las sesiones que han contribuido al progreso… Utilizar historial
   existente. No duplicar sesiones."* Son las apariciones de la F11 —las mismas
   que lee todo lo demás—, con el valor de ESTA métrica. */

export function historialDelObjetivo(fitness, objetivo, { propios = [], hoy = todayISO(), limite = null } = {}) {
  if (!objetivo) return [];
  const apariciones = aparicionesDeEjercicio(fitness, objetivo.exerciseId, propios);
  const filas = [];
  for (const a of apariciones) {
    const valor = valorDeAparicion(a, objetivo.tipo);
    if (valor === null) continue;
    filas.push({
      sesionId: a.sesionId,
      fecha: a.fecha,
      fechaTexto: etiquetaDeFecha(a.fecha, hoy),
      valor,
      /* Si esa sesión ya alcanzaba el objetivo, se dice: es la evidencia. */
      alcanza: objetivo.tipo === 'skill' ? true : (typeof objetivo.valor === 'number' && valor >= objetivo.valor),
    });
  }
  return typeof limite === 'number' ? filas.slice(0, Math.max(1, limite)) : filas;
}

/** El mejor valor de UNA aparición para la métrica del objetivo, o `null`. */
function valorDeAparicion(a, tipo) {
  if (!a || !a.mejor) return null;
  if (tipo === 'skill') return 1;
  if (tipo === 'duracion') return a.clase === 'tiempo' ? (a.mejor.duracion ?? null) : null;
  if (tipo === 'peso') return (a.clase === 'carga' || a.clase === 'lastre') ? (a.mejor.peso ?? null) : null;
  return a.clase === 'tiempo' ? null : (a.mejor.reps ?? null);
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · EL GRÁFICO, CON SU LÍNEA DE OBJETIVO (apartado 32)
   ═══════════════════════════════════════════════════════════════════════════
   *"Si existen suficientes datos… y línea objetivo. Pero solo si la métrica es
   numérica. Para skills: no crear gráfico artificial."* */

export const PUNTOS_MINIMOS_OBJETIVO = 3;
export const SIN_GRAFICO_SKILL = 'Una habilidad no se dibuja en una línea.';

export function graficaDelObjetivo(fitness, objetivo, { propios = [], hoy = todayISO() } = {}) {
  const vacia = { puntos: [], mostrar: false, motivo: '', linea: null, unidad: '' };
  if (!objetivo) return vacia;
  if (objetivo.tipo === 'skill') return { ...vacia, motivo: SIN_GRAFICO_SKILL };
  const filas = historialDelObjetivo(fitness, objetivo, { propios, hoy });
  /* De la más antigua a la más reciente, que es como se lee una evolución. */
  const puntos = [...filas].reverse().map((f) => ({ fecha: f.fecha, fechaTexto: f.fechaTexto, valor: f.valor }));
  const t = tipoObjetivo(objetivo.tipo);
  return {
    puntos,
    mostrar: puntos.length >= PUNTOS_MINIMOS_OBJETIVO,
    motivo: puntos.length === 0
      ? 'Todavía no hay registros de este ejercicio.'
      : puntos.length < PUNTOS_MINIMOS_OBJETIVO
        ? 'Hacen falta al menos tres registros para ver la evolución.'
        : '',
    /* La línea del objetivo, que es lo que esta gráfica añade a la de la F12. */
    linea: typeof objetivo.valor === 'number' ? objetivo.valor : null,
    unidad: t.unidad,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · DUPLICADOS (apartado 24)
   ═══════════════════════════════════════════════════════════════════════════
   *"Ya tienes un objetivo igual." Permitir crear otro solo si el usuario
   confirma.* — el patrón `aplicarPlan` de siempre: **sin `confirmado` no se
   escribe**.

   ⚠️ Y «igual» es mismo ejercicio + mismo tipo + mismo valor **entre los
   ACTIVOS**: uno ya conseguido no estorba para volver a proponérselo. */

export const AVISO_DUPLICADO = {
  titulo: 'Ya tienes un objetivo igual',
  texto: 'Puedes crearlo de todas formas, pero tendrás dos iguales en la lista.',
  si: 'Crearlo igualmente',
  no: 'Cancelar',
};

export function objetivoIgual(fitness, datos) {
  const d = datos || {};
  return lista((fitness || {}).objetivos).find((o) => o
    && o.estado === 'activo'
    && o.exerciseId === texto(d.exerciseId)
    && o.tipo === texto(d.tipo)
    && (d.tipo === 'skill' || Number(o.valor) === Number(d.valor))) || null;
}

/**
 * Apartados 5 y 24 — crear, avisando del duplicado. **Sin `confirmado` no
 * escribe nada**: devuelve el aviso y el objetivo que ya existe.
 */
export function crearObjetivoConAviso(fitness, datos, { propios = [], ahora = Date.now(), confirmado = false } = {}) {
  const v = validarObjetivo(datos, { propios });
  if (!v.ok) return { ok: false, motivo: v.motivo, fitness };
  const igual = objetivoIgual(fitness, datos);
  if (igual && !confirmado) {
    return { ok: false, duplicado: true, aviso: AVISO_DUPLICADO, existente: igual, motivo: AVISO_DUPLICADO.titulo, fitness };
  }
  return anadirObjetivo(fitness, datos, { propios, ahora });
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · RECUPERAR UN OBJETIVO CANCELADO (apartado 20)
   ═══════════════════════════════════════════════════════════════════════════
   *"Si se recupera: volver a active sin modificar su historial original."*
   Y eso último **sale gratis**: el historial de un objetivo son las sesiones
   del ejercicio, que esto no toca. Lo único que cambia es su `estado`. */

/**
 * ⚠️ **Devuelve el `fitness`, NO un `{ ok, fitness }`** — porque su hermana
 * `cancelarObjetivo` (F14) hace justo eso, y la vista la llama
 * `onGuardarFitness(cancelarObjetivo(f, id))`. Dos hermanas con firmas
 * distintas no fallan: **callan**, y el guardado escribiría el objeto entero en
 * la clave (E3 F29). Como ella, si no hay nada que hacer devuelve el estado tal
 * cual.
 */
export function reactivarObjetivo(fitness, id, { ahora = Date.now() } = {}) {
  const objetivos = lista((fitness || {}).objetivos);
  const actual = objetivos.find((o) => o.id === id);
  if (!actual || actual.estado !== 'cancelado') return fitness;
  return { ...fitness, objetivos: objetivos.map((o) => (o.id === id ? { ...o, estado: 'activo', actualizadoEn: ahora } : o)) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · LA CELEBRACIÓN (apartado 16)
   ═══════════════════════════════════════════════════════════════════════════
   *"Una microcelebración discreta… Debe sentirse premium."* Y su lista de lo
   prohibido es explícita: confeti exagerado, XP, monedas, leaderboard. */

export const CELEBRACION = {
  titulo: 'Objetivo conseguido',
  cerrar: 'Seguir',
};

/* ═══════════════════════════════════════════════════════════════════════════
   10 · EL DETALLE ENTERO (apartado 30)
   ═══════════════════════════════════════════════════════════════════════════ */

export const FECHA_SUPERADA = 'Fecha objetivo superada';

export function detalleDeObjetivo(fitness, objetivo, { propios = [], hoy = todayISO() } = {}) {
  if (!objetivo) return null;
  const progreso = progresoDeObjetivo(fitness, objetivo, { propios, hoy });
  return {
    ...progreso,
    /* Apartado 33 — cuánto falta, cuando el dato lo sostiene. */
    distancia: distanciaAlObjetivo(progreso),
    /* 🚨 Apartado 28 — se DICE, y se queda EN PROGRESO. Ni «fallido». */
    avisoFecha: progreso.fechaSuperada ? FECHA_SUPERADA : '',
    /* Apartado 31 — las sesiones que han contribuido. */
    historial: historialDelObjetivo(fitness, objetivo, { propios, hoy }),
    /* Apartado 32 — la evolución, con su línea. */
    grafica: graficaDelObjetivo(fitness, objetivo, { propios, hoy }),
    /* Apartado 14 — y si es habilidad, sus peldaños en vez de un porcentaje. */
    skill: progresionDeSkill(fitness, objetivo, { propios }),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   11 · LAS INTEGRACIONES (apartados 35, 36 y 37)
   ═══════════════════════════════════════════════════════════════════════════ */

export const CTA_VER_OBJETIVO = 'Ver objetivo';
export const CTA_CREAR_OBJETIVO = 'Crear objetivo';

/**
 * Apartado 35 — lo que la pantalla de un ejercicio (FIT F29) tiene que poder
 * enseñar: el objetivo si existe, y si no, la puerta para crearlo.
 */
export function objetivoParaEjercicio(fitness, exerciseId, { propios = [], hoy = todayISO() } = {}) {
  const id = texto(exerciseId);
  /* 🐛 **`listaDeObjetivos` devuelve PROGRESOS, no objetivos crudos** — cada uno
     ya ha pasado por `progresoDeObjetivo`. Volver a pasarlo daba `objetivo.valor`
     `undefined` y el texto salía **vacío**, sin fallar. Es la lección de la FORMA
     de lo que devuelve una función, otra vez. Así que aquí se devuelven **los
     dos**: el progreso ya calculado y el objetivo guardado, que es lo que
     necesita quien vaya a editarlo. */
  const progreso = listaDeObjetivos(fitness, { filtro: 'activo', propios, hoy }).objetivos
    .find((o) => o.exerciseId === id) || null;
  const guardado = progreso
    ? lista((fitness || {}).objetivos).find((o) => o.id === progreso.id) || null
    : null;
  return {
    hay: !!progreso,
    progreso,
    guardado,
    cta: progreso ? CTA_VER_OBJETIVO : CTA_CREAR_OBJETIVO,
  };
}

/**
 * 🚨 Apartado 36 — durante un entrenamiento, *"mostrar discretamente"* el
 * objetivo y lo que lleva. **Y nada más**: *"No interferir con la tabla de
 * series. El objetivo no debe modificar automáticamente la rutina."*
 *
 * Por eso devuelve **dos textos y ya**: no hay ninguna serie sugerida, ningún
 * peso propuesto y ninguna función que escriba en la sesión.
 */
export function objetivoEnVivo(fitness, exerciseId, { propios = [], hoy = todayISO() } = {}) {
  /* ⚠️ `progreso` YA viene calculado: recalcularlo era el fallo de arriba. */
  const { progreso } = objetivoParaEjercicio(fitness, exerciseId, { propios, hoy });
  if (!progreso || progreso.estado !== 'activo') return null;
  return {
    id: progreso.id,
    objetivoTexto: progreso.objetivoTexto,
    /* *"Objetivo: 15 reps / Actual: 12"* — y sin marca todavía, nada: un cero
       aquí sería el cero inventado de siempre (regla 8). */
    actualTexto: progreso.sinDatos || !progreso.numerico ? '' : String(progreso.actual),
    numerico: progreso.numerico,
  };
}

/* 🚨 Apartado 37 — el objetivo puede verse junto al rango, **y no lo toca**:
   *"EL OBJETIVO NO MODIFICA EL RANGO. El rango sigue dependiendo
   exclusivamente de RankEngine."* Se declara aquí y hay una comprobación que
   barre este archivo buscando cualquier llamada al motor de rangos. */
export const EL_OBJETIVO_NO_TOCA_EL_RANGO = {
  que: 'Un objetivo no mueve ni un punto de un rango',
  porque: 'Apartado 37, literal. El rango sale solo de `motorRangos.js` (F19) con las sesiones; un objetivo es una intención de Josué, no un dato de rendimiento.',
};

/* ═══════════════════════════════════════════════════════════════════════════
   12 · LO QUE NO SE CONSTRUYE (apartados 4, 17, 29 y 34)
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT30 = [
  { que: 'Predicciones de cuándo se alcanzará un objetivo', porque: 'El contexto y el apartado 34, tres veces: ni «te quedan 3 semanas», ni una fecha, ni una velocidad de progreso.' },
  { que: 'Objetivos generales del tipo «entrenar 4 veces esta semana»', porque: 'Apartado 4, literal: *"pero NO implementarlos todavía si requieren una lógica diferente"*. Y la requieren: no cuelgan de un ejercicio ni salen de una marca.' },
  { que: 'Marcar a mano como conseguido un objetivo de rendimiento', porque: 'Apartado 17: *"Debe existir evidencia real"*. Su excepción la excluye el propio apartado: *"No implementar todavía esa excepción"*.' },
  { que: 'Un estado «fallido»', porque: 'Apartado 29, literal: *"No añadir failed todavía"*. Una fecha vencida se dice y el objetivo sigue en progreso (apartado 28).' },
  { que: 'Un porcentaje para una habilidad', porque: 'Apartado 14: *"No mostrar «73 % completado» si no existe una escala válida"*. Y no existe: las progresiones son peldaños, no una escala.' },
  { que: 'XP, monedas, leaderboard y confeti', porque: 'Apartado 16, y D2-02.' },
];

export const DECISIONES_FIT30 = [
  {
    que: 'El modelo es el de la F14, sin un campo nuevo',
    porque: 'Apartado 2: *"Si el proyecto ya tiene campos equivalentes: REUTILIZARLOS. No crear duplicados."* `targetType` es `tipo`, `targetValue` es `valor`, `targetUnit` es `unidad`, `createdAt` es `creadoEn`, `targetDate` es `fechaObjetivo`, `status` es `estado` y `notes` es `nota`.',
  },
  {
    que: '`completedAt` se DERIVA, no se guarda',
    porque: 'Apartado 15 pide guardarlo, pero la F14 decidió que el objetivo guarda **solo el objetivo**: `conseguidoEn` sale de la sesión que lo superó. Guardarlo sería una copia que mentiría al borrar esa sesión — y entonces el objetivo diría «conseguido» sin evidencia, que es justo lo que prohíbe el apartado 17.',
  },
  {
    que: 'Una sesión posterior PEOR no descompleta un objetivo, y sale gratis',
    porque: 'Apartado 27. `valorActual` devuelve la **mejor marca histórica** (F14), y añadir una sesión peor no baja un máximo: no hace falta ni un candado ni un campo guardado. Hay una comprobación que entrena peor después y mira que siga conseguido.',
  },
  {
    que: 'Una habilidad no tiene valor ni porcentaje, y el objetivo ES el ejercicio',
    porque: 'Apartados 3 y 14. Y en este catálogo las progresiones apuntan hacia ABAJO —los peldaños previos—, así que contar «2 de 3» sería inventar la escala que el apartado 14 prohíbe. Se enseñan los peldaños hechos, y ya.',
  },
  {
    que: '«Cuánto falta» sí, «cuándo llegarás» no',
    porque: 'Apartados 33 y 34. Lo primero es restar dos números que ya existen; lo segundo exige una velocidad de progreso, que es literalmente lo que el apartado 34 prohíbe calcular.',
  },
  {
    que: 'El duplicado avisa y deja crear, sin `confirmado` no escribe',
    porque: 'Apartado 24: *"Permitir crear otro solo si el usuario confirma"*. Es el patrón `aplicarPlan`, y ya van más de veinte.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   13 · LOS COMPONENTES DEL APARTADO 39
   ═══════════════════════════════════════════════════════════════════════════
   *"Crear/reutilizar"*. De los nueve, **cuatro ya estaban escritos** por la
   F14 — es la F23, la F24, la F25 y la F29 por sexta vez. Se declaran por
   nombre y archivo, y la prueba **abre cada uno**. */

export const COMPONENTES_FIT30 = [
  { nombre: 'ProgressGoals', es: 'ObjetivosProgreso', archivo: 'src/views/ProgresoView.jsx', nuevo: false, de: 'FIT F14' },
  { nombre: 'ProgressGoalCard', es: 'TarjetaObjetivo', archivo: 'src/views/ProgresoView.jsx', nuevo: false, de: 'FIT F14' },
  { nombre: 'ProgressGoalDetail', es: 'DetalleObjetivo', archivo: 'src/views/ProgresoView.jsx', nuevo: false, de: 'FIT F14' },
  { nombre: 'ProgressGoalForm', es: 'FormularioObjetivo', archivo: 'src/views/ProgresoView.jsx', nuevo: false, de: 'FIT F14' },
  { nombre: 'ProgressGoalProgress', es: 'GoalProgress', archivo: 'src/components/objetivosFitness.jsx', nuevo: true, de: 'FIT F30' },
  { nombre: 'ProgressGoalHistory', es: 'GoalHistory', archivo: 'src/components/objetivosFitness.jsx', nuevo: true, de: 'FIT F30' },
  { nombre: 'ProgressGoalStatus', es: 'GoalStatus', archivo: 'src/components/objetivosFitness.jsx', nuevo: true, de: 'FIT F30' },
  { nombre: 'ProgressGoalEmpty', es: 'GoalEmpty', archivo: 'src/components/objetivosFitness.jsx', nuevo: true, de: 'FIT F30' },
  { nombre: 'ProgressGoalCompletion', es: 'GoalCompletion', archivo: 'src/components/objetivosFitness.jsx', nuevo: true, de: 'FIT F30' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   14 · AUDITORÍA (apartados 40, 41 y 45)
   ═══════════════════════════════════════════════════════════════════════════ */

export const AUDITORIA_FIT30 = {
  clavesNuevas: 0,
  tablasNuevas: 0,
  /* Apartado 40 — persisten porque viven en `fitness.objetivos`, que `App.jsx`
     guarda y normaliza; nada depende del estado de React. */
  persistencia: 'fitness.objetivos (app_data), normalizada en cada carga',
  /* Apartado 41 — no hay nada que invalidar: el progreso se deriva. */
  invalidacion: 'ninguna: el progreso se calcula al leer, desde las sesiones',
};

/** El criterio de finalización del apartado 45, comprobado sobre datos. */
export function casillasDelCiclo(fitness, objetivo, opciones = {}) {
  const d = objetivo ? detalleDeObjetivo(fitness, objetivo, opciones) : null;
  return [
    { id: 'crear', ok: !!objetivo, que: 'Se puede crear un objetivo' },
    { id: 'progreso', ok: !!d && (d.sinDatos || typeof d.actual === 'number' || !d.numerico), que: 'El progreso sale de los entrenamientos' },
    { id: 'conseguir', ok: !!d && ['activo', 'completado', 'cancelado'].includes(d.estado), que: 'Se marca solo al alcanzarlo' },
    { id: 'historico', ok: !!d && Array.isArray(d.historial), que: 'Se conserva el histórico que lo sostiene' },
    { id: 'sin_prediccion', ok: !!d && !/quedan|conseguirás|semanas/i.test(`${d.distancia} ${d.avisoFecha}`), que: 'Y no se predice nada' },
  ];
}

export function auditarObjetivos(fitness, objetivo, opciones = {}) {
  const casillas = casillasDelCiclo(fitness, objetivo, opciones);
  return { casillas, ok: casillas.every((c) => c.ok) };
}

export { ESTADOS_VISIBLES };
export default detalleDeObjetivo;
