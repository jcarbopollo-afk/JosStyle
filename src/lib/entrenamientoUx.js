import {
  ejerciciosDeSesion, marcarSerie, crearDescanso, pausarDescanso, reanudarDescanso,
  restanteDescanso, textoPlanificado,
} from './entrenamiento';
import {
  ejercicioPorId,
  agarre as agarrePorId, tipoEjercicio,
} from './ejercicios';
/* 🔓 FIT F33 — el motor de sustitución, uno para toda la aplicación. */
import { getExerciseReplacements, NIVELES_VISIBLES, nivelCompatibilidad } from './sustitucion';

/* Entrega 4 · Fase 9/45 — «UX avanzada del entrenamiento en vivo».
   ═══════════════════════════════════════════════════════════════════════════

   *"No quiero reconstruir el motor de entrenamiento. La Fase 7 ya creó la
   lógica funcional."* Así que este archivo **no vuelve a hacer nada de lo que
   hace `entrenamiento.js`**: marcar, editar, añadir, omitir, sustituir y el
   cronómetro siguen siendo suyos, y aquí solo vive lo que la F9 añade encima
   —pasos rápidos, el descanso dentro de la sesión, el gesto, los sustitutos
   ordenados por compatibilidad y los textos de planificado frente a realizado—.

   🚨 **Y ni un estado paralelo** (apartado 41): todas las funciones que
   cambian algo reciben **la sesión** y devuelven **la sesión**. Lo que la
   pantalla guarda por su cuenta es solo qué panel está abierto y el texto que
   se está tecleando.

   ───────────────────────────────────────────────────────────────────────────
   LA CONTRADICCIÓN CON LA F7, Y CÓMO SE HA LEÍDO
   ───────────────────────────────────────────────────────────────────────────
   La F7 dejó el descanso como **estado de pantalla** a propósito. La F9 pide lo
   contrario en dos sitios: el apartado 41 lo pone en la lista de cosas con
   *"una única fuente de verdad"*, y el 31 quiere que el estado minimizado
   **enseñe si está descansando**, cosa imposible si el descanso muere al salir.
   Gana la fase posterior (regla 49, anotado y sin parar): el descanso vive en
   `sesion.descanso`. Lo que la F7 quería evitar —un descanso de hace tres horas
   saliendo en pantalla— se sigue cumpliendo con `descansoVisible`. */

const lista = (v) => (Array.isArray(v) ? v : []);
const enteroONull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
};

/* Escribir un ejercicio de la sesión, devolviendo la sesión entera (regla 5). */
function conEjercicio(sesion, ejercicioId, fn) {
  const ejs = ejerciciosDeSesion(sesion);
  if (!ejs.some((e) => e.id === ejercicioId)) return sesion;
  return {
    ...sesion,
    origen: { ...(sesion.origen || {}), ejercicios: ejs.map((e) => (e.id === ejercicioId ? fn(e) : e)) },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   1 · EL EJERCICIO ACTIVO (apartados 3 y 24)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Cuántas series pedía el plan. ⚠️ Las que decía **el plan**, no las que
 *  quedan: omitir una no cambia lo que estaba planificado (apartado 24). */
function seriesPlanificadas(ejSesion) {
  const deLinea = enteroONull(ejSesion?.linea?.series);
  if (deLinea) return deLinea;
  return lista(ejSesion?.series).filter((s) => s.origen === 'planificada').length;
}

/** *"4 × 6–10"* (apartados 3 y 24). Vacío si el plan no decía nada: inventarle
 *  un objetivo sería peor que no enseñar ninguno (apartado 39). */
export function resumenPlanificado(ejSesion) {
  if (!ejSesion) return '';
  const n = seriesPlanificadas(ejSesion);
  if (!n) return '';
  const primera = lista(ejSesion.series).find((s) => s.origen === 'planificada') || null;
  const objetivo = primera ? textoPlanificado(primera) : '';
  if (!objetivo) return `${n} ${n === 1 ? 'serie' : 'series'}`;
  return `${n} × ${objetivo}`;
}

/** *"8 / 9 / 8"* — lo que de verdad hizo, serie a serie (apartado 24).
 *  🚨 Solo cuentan las marcadas como hechas: lo escrito sin marcar todavía no es
 *  una serie hecha (FIT F8, apartado 6). */
export function resumenRealizado(ejSesion) {
  const hechas = lista(ejSesion?.series).filter((s) => s.estado === 'hecha');
  if (!hechas.length) return '';
  return hechas.map((s) => {
    if (s.modo === 'tiempo') return s.hecho?.duracion ? `${s.hecho.duracion} s` : '—';
    return s.hecho?.reps ? String(s.hecho.reps) : '—';
  }).join(' / ');
}

/** Lo que enseña la tarjeta del ejercicio (apartado 3): nombre, variante,
 *  agarre, tipo y objetivo — y nada de lo secundario. */
export function cabeceraEnSesion(ejSesion, propios = []) {
  if (!ejSesion) return null;
  const ej = ejercicioPorId(ejSesion.exerciseId, propios);
  const ag = ej?.agarre ? agarrePorId(ej.agarre) : null;
  const tipo = ej ? tipoEjercicio(lista(ej.tipos)[0]) : null;
  return {
    nombre: ej ? ej.nombre : ejSesion.exerciseId,
    variante: ej?.variante || '',
    agarre: ag ? `Agarre ${ag.nombre.toLowerCase()}` : '',
    tipo: tipo ? tipo.nombre : '',
    objetivo: resumenPlanificado(ejSesion),
    realizado: resumenRealizado(ejSesion),
    /* Apartado 25 — un isométrico se mide en tiempo, no en repeticiones. */
    porTiempo: ejSesion.modo === 'tiempo',
  };
}

/** La serie activa (apartado 7): la primera que queda por hacer. ⚠️ `null` si
 *  ya no queda ninguna — no se resalta la última por resaltar algo. */
export function serieActiva(ejSesion) {
  const s = lista(ejSesion?.series).find((x) => x.estado === 'pendiente');
  return s ? s.id : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LOS PASOS RÁPIDOS (apartados 9 y 10)
   ═══════════════════════════════════════════════════════════════════════════
   *"El incremento debe adaptarse al tipo de dato. Peso: +2.5 kg. Repeticiones:
   +1."* Y el tiempo de un isométrico, de cinco en cinco segundos. */

export const PASOS = { peso: 2.5, reps: 1, duracion: 5 };

/**
 * Un toque de − o +. ⚠️ Si el campo está vacío **no se suma a cero**: se parte
 * de lo que decía el plan, que es lo que iba a escribir de todas formas. Un «+»
 * sobre unas repeticiones vacías con el plan en 8 da 8, no 1.
 *
 * ⚠️ Y el peso se redondea a centésimas: sumar 2,5 en coma flotante acaba
 * enseñando 62.50000000001 (apartado 8: *"20, 20.5, 22.5"*).
 */
export function ajustarValor(valor, campo, signo, { base = null } = {}) {
  const paso = PASOS[campo];
  if (!paso) return valor;
  const actual = valor === null || valor === undefined || valor === '' ? null : Number(valor);
  if (actual === null || !Number.isFinite(actual)) {
    if (signo < 0) return null;
    const b = base === null || base === undefined ? null : Number(base);
    return Number.isFinite(b) && b > 0 ? b : paso;
  }
  const siguiente = Math.max(0, actual + (signo < 0 ? -paso : paso));
  return campo === 'peso' ? Math.round(siguiente * 100) / 100 : Math.round(siguiente);
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · COMPLETAR UNA SERIE (apartados 11, 12 y 16)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Marca la serie y, **si el descanso automático está puesto**, lo arranca
 *  (apartado 16). ⚠️ Marcar es `marcarSerie` de la F7: aquí solo se decide qué
 *  pasa después. */
export function completarSerie(sesion, ejercicioId, serieId, ahora = Date.now()) {
  const marcada = marcarSerie(sesion, ejercicioId, serieId, true);
  if (marcada === sesion) return sesion;
  const ej = ejerciciosDeSesion(marcada).find((e) => e.id === ejercicioId);
  if (marcada.descansoAuto === false || !ej || !ej.descanso) return marcada;
  return iniciarDescanso(marcada, ej.descanso, ahora);
}

/** Apartado 12 — ✓ → ○ sin perder el peso ni las repeticiones. Y si había un
 *  descanso corriendo por esa serie, se para: descansar de una serie que no se
 *  ha hecho no tiene sentido. */
export function desmarcarSerie(sesion, ejercicioId, serieId) {
  const s = marcarSerie(sesion, ejercicioId, serieId, false);
  return s === sesion ? sesion : { ...s, descanso: null };
}

export const alternarDescansoAuto = (sesion) => (sesion
  ? { ...sesion, descansoAuto: sesion.descansoAuto === false }
  : sesion);

/* ═══════════════════════════════════════════════════════════════════════════
   4 · EL DESCANSO, DENTRO DE LA SESIÓN (apartados 13-17 y 41)
   ═══════════════════════════════════════════════════════════════════════════
   🚨 **Las cuentas siguen siendo las de la F7** (`crearDescanso`,
   `restanteDescanso`, `pausarDescanso`…). Lo único que cambia es dónde se
   guarda el resultado. */

/** Apartado 17 — los tiempos de un toque. */
export const DESCANSOS_RAPIDOS = [30, 60, 90, 120, 180];
export const DESCANSO_MINIMO = 5;
export const DESCANSO_MAXIMO = 900;

/** Apartado 14 — lo que se suma de un toque. */
export const SUMAS_DESCANSO = [15, 30];

export function iniciarDescanso(sesion, segundos, ahora = Date.now()) {
  if (!sesion) return sesion;
  const s = enteroONull(segundos);
  if (!s || s < 1) return sesion;
  return { ...sesion, descanso: crearDescanso({ segundos: s, ahora }) };
}

export const pausarDescansoSesion = (sesion, ahora = Date.now()) => (sesion?.descanso
  ? { ...sesion, descanso: pausarDescanso(sesion.descanso, ahora) } : sesion);

export const reanudarDescansoSesion = (sesion, ahora = Date.now()) => (sesion?.descanso
  ? { ...sesion, descanso: reanudarDescanso(sesion.descanso, ahora) } : sesion);

/** Apartado 15 — terminarlo a mano. ⚠️ No toca el cronómetro general: son dos
 *  relojes distintos desde la F7. */
export const terminarDescanso = (sesion) => (sesion?.descanso ? { ...sesion, descanso: null } : sesion);

/** Apartado 14 — «+15 s». ⚠️ Sobre un descanso que YA acabó, sumar al total no
 *  serviría: si pasaron 100 s de uno de 90, sumar 15 lo deja igual de acabado.
 *  Así que ahí empieza uno nuevo de 15 s, que es lo que quiere quien lo pulsa. */
export function sumarDescanso(sesion, segundos, ahora = Date.now()) {
  const d = sesion?.descanso;
  const s = enteroONull(segundos);
  if (!d || !s || s < 1) return sesion;
  if (restanteDescanso(d, ahora) === 0) return iniciarDescanso(sesion, s, ahora);
  return { ...sesion, descanso: { ...d, segundos: d.segundos + s } };
}

/** Apartado 17 — cambiar el descanso **de este ejercicio en esta sesión**.
 *  🚨 El plan no se entera: lo que cambia es el snapshot (apartado 17, *"No
 *  modificar permanentemente el plan"*). */
export function cambiarDescansoEjercicio(sesion, ejercicioId, segundos) {
  const s = enteroONull(segundos);
  if (s === null) return sesion;
  const acotado = Math.max(DESCANSO_MINIMO, Math.min(DESCANSO_MAXIMO, s));
  return conEjercicio(sesion, ejercicioId, (e) => ({ ...e, descanso: acotado }));
}

/** Cuánto se sigue enseñando un descanso ya terminado: lo justo para ver que
 *  acabó. Uno de hace tres horas no se pinta (la preocupación de la F7). */
export const MARGEN_DESCANSO_TERMINADO_MS = 60 * 1000;

export function descansoVisible(sesion, ahora = Date.now()) {
  const d = sesion?.descanso;
  if (!d) return null;
  if (restanteDescanso(d, ahora) > 0) return d;
  const fin = d.desde + (d.pausadoMs || 0) + d.segundos * 1000;
  return ahora - fin <= MARGEN_DESCANSO_TERMINADO_MS ? d : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · EL GESTO (apartado 6)
   ═══════════════════════════════════════════════════════════════════════════
   *"Evitar que interfiera con scroll vertical, edición de números, botones,
   sliders. Si técnicamente es necesario: establecer zonas de gesto claras."*

   🚨 Lo es, y la zona es **la tarjeta del ejercicio**: no tiene ni un campo ni
   un botón, así que deslizar ahí no puede tocar un peso por accidente. Y para
   no pelearse con el desplazamiento de la página, un gesto solo cuenta si es
   **claramente horizontal**: más largo que el umbral y bastante más ancho que
   alto. Un dedo que baja en diagonal para hacer scroll no cambia de ejercicio. */

export const UMBRAL_GESTO_PX = 56;
export const PROPORCION_GESTO = 1.5;

/** Deslizar a la izquierda lleva al siguiente, como pasar una página. */
export function direccionDeGesto(dx, dy, { umbral = UMBRAL_GESTO_PX } = {}) {
  const x = Number(dx) || 0;
  const y = Number(dy) || 0;
  if (Math.abs(x) < umbral) return null;
  if (Math.abs(x) < Math.abs(y) * PROPORCION_GESTO) return null;
  return x < 0 ? 'siguiente' : 'anterior';
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · REEMPLAZAR (apartados 21 y 22)
   ═══════════════════════════════════════════════════════════════════════════ */

/** ¿Hay algo registrado que se podría perder? (apartado 22). */
export function tieneDatosRegistrados(ejSesion) {
  if (!ejSesion) return false;
  if (ejSesion.notas) return true;
  return lista(ejSesion.series).some((s) => s.estado === 'hecha'
    || [s.hecho?.peso, s.hecho?.reps, s.hecho?.duracion].some((v) => v !== null && v !== undefined));
}

export const AVISO_REEMPLAZAR = {
  titulo: '¿Reemplazar ejercicio?',
  texto: 'Ya has registrado datos en este ejercicio. Las series se conservan, pero el peso era de este ejercicio y se quita.',
  cancelar: 'Cancelar',
  reemplazar: 'Reemplazar',
};

/**
 * Los sustitutos del apartado 21 de la F9.
 *
 * 🔓 **FIT F33 — ya no los ordena aquí.** La F9 los sacaba de la familia (F3),
 * de los declarados (F2) y del resto del grupo muscular, con su propia
 * puntuación; la F33 *"perfecciona el sistema de sustitución"* con niveles de
 * compatibilidad, patrón de movimiento y contexto, y **un segundo motor al
 * lado diría otra cosa del mismo press de banca**. Así que esto le pide la
 * lista a `getExerciseReplacements` y se queda con los niveles que se enseñan
 * normalmente (el apartado 2 de la F33). La forma `{ ejercicio, motivo }` se
 * conserva, y `motivo` es ahora el nivel —«Muy similar», «Similar»,
 * «Alternativa»—, que es lo que dice por qué sale.
 */
export function sustitutosCompatibles(ejSesion, propios = [], { limite = 12, sesion = null } = {}) {
  const actual = ejSesion ? ejercicioPorId(ejSesion.exerciseId, propios) : null;
  if (!actual) return [];
  return getExerciseReplacements(actual.id, { propios, sesion })
    .filter((x) => NIVELES_VISIBLES.includes(x.compatibilityLevel))
    .slice(0, limite)
    .map((x) => ({
      ...x,
      ejercicio: x.exercise,
      motivo: nivelCompatibilidad(x.compatibilityLevel).nombre,
    }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · LO QUE NO SE CONSTRUYE, Y LO QUE SE HA DECIDIDO
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT9 = [
  { que: 'Historial, gráficas, récords y evolución', porque: 'Apartado 44: es la F10 en adelante.' },
  { que: 'Rangos y rankings musculares', porque: 'Apartado 44: F15 a F25.' },
  { que: 'IA y recomendaciones automáticas', porque: 'Apartado 44, y la regla 7: la IA nunca se dispara sola. Los sustitutos se ORDENAN por datos del catálogo; no se recomienda nada por él.' },
  { que: 'Un minirreproductor flotante por toda la aplicación', porque: 'Apartado 31: *"Si la aplicación permite minimizar"*. No lo permite: el estado compacto es la tarjeta de sesión en curso de Entrenamiento, que ya recupera la sesión exacta y ahora enseña también el descanso. Una barra fija encima de todas las pantallas choca con la zona segura del iPhone (apartado 36) y con las cinco pestañas.' },
  { que: 'Métricas de explosivos (velocidad, potencia)', porque: 'Apartado 26: *"No crear métricas inventadas."* Se registran repeticiones, descanso y notas.' },
  { que: 'Un reproductor de vídeo del tutorial', porque: 'Apartado 19: *"Si no existe vídeo: NO mostrar un reproductor falso."* El catálogo no trae vídeos; el tutorial enseña las instrucciones reales.' },
];

export const DECISIONES_FIT9 = [
  { que: 'El descanso vive en la sesión', porque: 'Apartados 31 y 41, contra lo que decidió la F7. Ver la cabecera de este archivo.' },
  { que: 'Cambiar el descanso afecta a ESTE ejercicio de ESTA sesión', porque: 'El modelo de la F3 guarda el descanso por ejercicio, y el apartado 17 prohíbe tocar el plan.' },
  { que: 'El sonido y la vibración salen del motor de audio', porque: 'Apartado 18. La F7 llamaba a `navigator.vibrate` directamente, saltándose el interruptor de Ajustes, y emitía un evento que no existía.' },
  { que: 'Tutorial y reemplazo se abren bajo la cabecera de la sesión', porque: 'Apartados 20 y 33: con el cronómetro y «Terminar» a la vista, sin abandonar el entrenamiento.' },
];
