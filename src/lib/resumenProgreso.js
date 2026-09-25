import { todayISO } from './helpers';
import { sesionesDelHistorial, contadorTexto, etiquetaDeFecha, ultimaDelHistorial } from './historial';
import { entrenamientosEnPeriodo } from './actividadEntrenamiento';
import {
  tarjetasDeProgreso, ordenarTarjetas, estadoProgreso, COMPARABLES as ESTADOS_COMPARABLES,
  RANGOS_GRAFICA, inicioDePeriodo,
} from './progresoEjercicios';
import { resumenMuscular, fitnessEnPeriodo, AVISO_RENDIMIENTO } from './progresoMuscular';
import { listaDeObjetivos, valorActual } from './objetivosProgreso';
import { rangoGlobalEfectivo } from './motorRangos';
import { historialDeRango, resumenDeHistorial } from './historialRangos';
import { DESTINO_GLOBAL, evolucionReciente } from './resumenRangos';
import {
  fotosEnOrden, etiquetaDeDia, compararFotos, puedeComparar, MINIMO_PARA_COMPARAR,
  FALTA_OTRA_FOTO, ERRORES_FOTO,
} from './fotosProgreso';
import { orientacionDeFoto } from './comparadorFotos';

/* ===========================================================================
   ENTREGA 4 · FASE 28/45 — INTEGRACIÓN COMPLETA DEL PROGRESO FÍSICO
   ===========================================================================

   *"Conectar NO significa mezclarlas matemáticamente"* (contexto del enunciado),
   y el apartado 10 lo dice con el ejemplo prohibido: *"Fotos + fuerza + rangos =
   progreso físico 82 %. Eso sería una métrica inventada."*

   🚨 **UNA FASE DE INTEGRACIÓN REPARTE LO QUE HAY, NO AÑADE UN SISTEMA**
   (E3 F46, apartado 21, y aquí es el apartado 21 otra vez: *"No guardar
   `progressOverview` como un objeto independiente"*). Los seis bloques de esta
   pantalla **leen de seis motores que ya existen** y ninguno vuelve a calcular
   nada:

     · Entrenamientos → `historial.js` (F10)
     · Ejercicios     → `progresoEjercicios.js` (F12), que a su vez solo ordena
                        lo que decidió `progresion.js` (F11)
     · Músculos       → `progresoMuscular.js` (F13)
     · Objetivos      → `objetivosProgreso.js` (F14)
     · Rangos         → `motorRangos.js` (F19) + `historialRangos.js` (F22)
     · Fotos          → `fotosProgreso.js` (F26) + `comparadorFotos.js` (F27)

   🚨 **Y CADA BLOQUE DECLARA DE QUÉ MOTOR SALE, CON UNA SOLA FUENTE** — es la
   forma mecánica de demostrar el apartado 10: si ningún bloque lee de dos
   sitios, no hay ningún número que mezcle dos sistemas. Hay una comprobación
   que lo recorre.

   🚨 **ESTO NO GUARDA NADA** (apartado 21): ni clave en `app_data`, ni
   normalizador, ni `saveData`. Es la F15 con los rangos, la F22 con el
   historial y la F24 con la cola, por cuarta vez en esta entrega — y de ahí
   sale gratis el apartado 23: *"después de guardar un entrenamiento… el resumen
   debe actualizarse"*. **No hay nada que invalidar porque no hay copia.**
   =========================================================================== */

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LO QUE YA EXISTÍA (y por eso esta fase no lo escribe)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ La lección de la F23, la F24 y la F25 por cuarta vez: antes de escribir un
   bloque, mirar si su motor ya está. Aquí **estaban los seis**, y además la
   navegación del apartado 1 —las cinco secciones de Progreso— la creó la F12.
   Lo que faltaba era el centro que las junta. */

export const YA_EXISTIA = [
  {
    pide: 'Apartado 1 · Resumen, Ejercicios, Músculos, Fotos, Objetivos',
    es: 'SECCIONES_PROGRESO',
    donde: 'src/views/ProgresoView.jsx (FIT F12)',
    porque: 'Las cinco secciones están desde la F12, con Músculos (F13), Objetivos (F14) y Fotos (F26). Esta fase llena el Resumen; no crea una pantalla nueva (apartado 19).',
  },
  {
    pide: 'Apartado 16 · 7 días, 30 días, 3 meses, Todo',
    es: 'RANGOS_GRAFICA',
    donde: 'src/lib/progresoEjercicios.js (FIT F12)',
    porque: 'Son exactamente los cuatro periodos que pide el apartado. Un segundo catálogo acabaría desviándose del de la gráfica.',
  },
  {
    pide: 'Apartado 7 · la comparación rápida',
    es: 'compararFotos',
    donde: 'src/lib/fotosProgreso.js (FIT F26)',
    porque: 'ANTES y DESPUÉS los decide la FECHA, no quién elige primero (F26, apartado 14). Aquí solo se eligen las dos fotos.',
  },
  {
    pide: 'Apartado 9 · rango global y su evolución',
    es: 'evolucionReciente',
    donde: 'src/lib/resumenRangos.js (FIT F25)',
    porque: 'Distingue subir de rango de progresar dentro del mismo (F22, apartado 7). Volver a decidirlo aquí daría dos frases distintas del mismo cambio.',
  },
  {
    pide: 'Apartado 28 · el estado con símbolo Y palabra',
    es: 'estadoProgreso',
    donde: 'src/lib/progresoEjercicios.js (FIT F12)',
    porque: '«↗ Mejorando» ya viene con las dos cosas: ni el color ni la flecha van solos.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LOS PERIODOS (apartado 16)
   ═══════════════════════════════════════════════════════════════════════════
   🚨 **UN PERIODO FILTRA LO QUE SE VE, NUNCA LO QUE SE CALCULA** cuando el
   cálculo depende de la historia entera. Es la lección de la F22 (apartado 23)
   y su límite está escrito en el propio apartado 16: *"NO modifican: Rangos
   actuales, objetivos, datos históricos"*.

   ⚠️ Y hay dos casos, los dos correctos:
     · **Recortar las sesiones SÍ es lo suyo** en Ejercicios y Músculos: ahí se
       mide la actividad del periodo, y `fitnessEnPeriodo` (F13) es justo eso.
     · **Recortarlas sería un fallo** en Rangos y Objetivos: la puntuación es la
       mejor de las últimas cinco sesiones, así que el rango de septiembre
       depende de las de julio; y un objetivo conseguido en mayo sigue
       conseguido en el filtro de 7 días. */

export const PERIODOS_RESUMEN = RANGOS_GRAFICA;
export const PERIODO_POR_DEFECTO = 'todo';
export const periodoResumen = (id) => PERIODOS_RESUMEN.find((p) => p.id === texto(id))
  || PERIODOS_RESUMEN.find((p) => p.id === PERIODO_POR_DEFECTO);

/** *"3 en los últimos 7 días"* — nunca *"3 esta semana"*, que es otra cosa: una
 *  semana natural empieza el lunes y esto son los últimos siete días. */
export const EN_PERIODO = {
  '7d': 'en los últimos 7 días',
  '30d': 'en los últimos 30 días',
  '3m': 'en los últimos 3 meses',
};

/** Qué bloques recorta el periodo y cuáles no, **declarado y comprobable**. */
export const LO_QUE_EL_PERIODO_NO_TOCA = [
  { bloque: 'rango', porque: 'Apartado 16: «NO modifican los Rangos actuales». Y la puntuación es la mejor de las últimas cinco sesiones (F19), así que recortar la entrada daría un rango que nunca ha tenido (F22, apartado 23).' },
  { bloque: 'objetivos', porque: 'Apartado 16: «NO modifican los objetivos». Un objetivo conseguido hace cuatro meses sigue conseguido al mirar los últimos 7 días.' },
  { bloque: 'fotos', porque: 'La última foto es la última, mire el periodo que mire: esconderla sería decir que no hay ninguna.' },
  { bloque: 'entrenamientos', porque: 'El total es el total (apartado 3: «12 entrenamientos registrados»). El periodo añade una segunda línea, no cambia la primera.' },
];
export const EL_PERIODO_RECORTA = ['ejercicios', 'musculos', 'timeline'];

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LOS LÍMITES (apartado 26)
   ═══════════════════════════════════════════════════════════════════════════
   *"No mostrar más de: 2–4 ejercicios, 2–4 músculos, 1–3 objetivos, 1–3
   fotos"*, y *"Ver todo"* cuando haga falta. */

export const EJERCICIOS_RESUMEN_MAX = 4;
export const MUSCULOS_RESUMEN_MAX = 4;
export const OBJETIVOS_RESUMEN_MAX = 3;
export const FOTOS_RESUMEN_MAX = 3;
export const TIMELINE_RESUMEN_MAX = 12;
export const VER_TODO = 'Ver todo';

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LOS BLOQUES Y SU ORDEN (apartados 2, 20 y 25)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ El apartado 25 propone un orden y termina con *"adapta el orden a la
   arquitectura actual si existe una solución mejor"*. El que va aquí es el
   suyo con **una diferencia**: los ejercicios suben por delante de las fotos,
   porque la sección se llama «Tu progreso» y lo que la pantalla contesta
   primero es *«¿estoy mejorando?»* — la pregunta de la F12. Las fotos siguen
   arriba del todo de lo visual, inmediatamente después.

   🚨 **Y CADA BLOQUE LEE DE UN SOLO MOTOR.** Eso es el apartado 10 en forma
   comprobable: sin un bloque que lea dos fuentes no puede existir un número que
   las mezcle. */

export const BLOQUES = [
  { id: 'rango', nombre: 'Tu rango', fuente: 'motorRangos.js (F19/F22)', orden: 0, destino: 'rangos', apartado: 9 },
  { id: 'entrenamientos', nombre: 'Entrenamientos', fuente: 'historial.js (F10)', orden: 1, destino: 'historial', apartado: 3 },
  { id: 'ejercicios', nombre: 'Ejercicios en progreso', fuente: 'progresoEjercicios.js (F12)', orden: 2, destino: 'ejercicios', apartado: 4 },
  { id: 'fotos', nombre: 'Progreso físico', fuente: 'fotosProgreso.js (F26)', orden: 3, destino: 'fotos', apartado: 6 },
  { id: 'musculos', nombre: 'Progreso muscular', fuente: 'progresoMuscular.js (F13)', orden: 4, destino: 'musculos', apartado: 5 },
  { id: 'objetivos', nombre: 'Tus objetivos', fuente: 'objetivosProgreso.js (F14)', orden: 5, destino: 'objetivos', apartado: 8 },
  { id: 'timeline', nombre: 'Línea temporal', fuente: 'las cinco de arriba, sin mezclarlas', orden: 6, destino: null, apartado: 13 },
];
export const bloqueResumen = (id) => BLOQUES.find((b) => b.id === texto(id)) || null;

/* ═══════════════════════════════════════════════════════════════════════════
   5 · ENTRENAMIENTOS (apartado 3)
   ═══════════════════════════════════════════════════════════════════════════ */

export function bloqueEntrenamientos(fitness, { periodo = PERIODO_POR_DEFECTO, hoy = todayISO() } = {}) {
  const sesiones = sesionesDelHistorial(fitness);
  const total = sesiones.length;
  const p = periodoResumen(periodo);
  /* Apartado 3 — *"Opcionalmente «3 esta semana» solo si el periodo está
     claramente definido"*. Con «Todo» no hay segunda línea: no hay periodo.
     🔓 FIT F31 — y el recuento es **el de la actividad**: dos recuentos del mismo
     «7 días» en la misma pantalla acabarían diciendo dos números. */
  const enPeriodo = p.dias ? entrenamientosEnPeriodo(fitness, { periodo: p.id, hoy }).length : null;
  /* 🐛 FIT F31 — era `sesiones[0]`, que es la MÁS ANTIGUA: se guardan al final. */
  const ultima = ultimaDelHistorial(fitness);
  return {
    id: 'entrenamientos',
    hay: total > 0,
    total,
    /* *"12 entrenamientos registrados"* — el contador es el del historial. */
    texto: total ? `${contadorTexto(total)} registrados` : '',
    enPeriodo,
    textoPeriodo: enPeriodo !== null && EN_PERIODO[p.id] ? `${enPeriodo} ${EN_PERIODO[p.id]}` : '',
    ultima: ultima ? { id: ultima.id, nombre: texto(ultima.nombre) || 'Entrenamiento', fecha: ultima.fecha, etiqueta: etiquetaDeFecha(ultima.fecha, hoy) } : null,
    destino: 'historial',
    vacio: 'Todavía no has guardado ningún entrenamiento.',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · EJERCICIOS (apartado 4)
   ═══════════════════════════════════════════════════════════════════════════
   🚨 *"Utilizar exclusivamente la lógica de Fase 11/12. No crear una métrica
   nueva de «progreso»."* Así que aquí no hay ni una comparación: se piden las
   tarjetas de la F12 —que salen de la F11— y **se cortan a cuatro**. */

export function bloqueEjercicios(fitness, {
  propios = [], periodo = PERIODO_POR_DEFECTO, hoy = todayISO(), max = EJERCICIOS_RESUMEN_MAX,
} = {}) {
  const f = fitnessEnPeriodo(fitness, periodo, hoy);
  const tarjetas = tarjetasDeProgreso(f, { propios });
  /* Solo lo que la F11 puede comparar: un primer registro no es una tendencia. */
  const comparables = ordenarTarjetas(tarjetas).filter((t) => ESTADOS_COMPARABLES.includes(t.estado));
  const ejercicios = comparables.slice(0, Math.max(1, max)).map((t) => ({
    exerciseId: t.exerciseId,
    nombre: t.nombre,
    estado: t.estado,
    estadoNombre: t.estadoNombre,
    simbolo: t.simbolo,
    ultima: t.ultima,
    /* 🚨 **EL CAMBIO REAL NO SE PIERDE AL REDISEÑAR** (E3 F43: *"retirar una
       pantalla no puede llevarse sus funciones"*). El Resumen de la F12 enseñaba
       «62,5 kg × 8 → 62,5 kg × 10», y el apartado 4 de esta fase solo pide el
       nombre y la tendencia: enseñar las dos cosas es más, no menos — y sale de
       la MISMA tarjeta de la F12, sin una métrica nueva. */
    anterior: t.anterior,
    cambio: t.cambio,
    /* Apartado 28 — símbolo **y** palabra, nunca el color solo. */
    etiqueta: `${t.simbolo} ${t.estadoNombre}`,
  }));
  return {
    id: 'ejercicios',
    hay: ejercicios.length > 0,
    ejercicios,
    total: comparables.length,
    hayMas: comparables.length > ejercicios.length,
    conRegistros: tarjetas.length,
    destino: 'ejercicios',
    vacio: tarjetas.length
      ? 'Repite alguno de tus ejercicios para poder comparar.'
      : 'Registra un entrenamiento para empezar a ver tu progreso.',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · MÚSCULOS (apartado 5)
   ═══════════════════════════════════════════════════════════════════════════
   🚨 *"No mostrar porcentaje de «desarrollo muscular»"*, y la F13 ya lo dice en
   su propio aviso: esto mide el rendimiento de los ejercicios, no el tamaño del
   músculo. El aviso se reenvía, no se reescribe.

   ⚠️ **Un grupo sin datos no ocupa un hueco de la vista previa.** El apartado 5
   lo enseña en su ejemplo («Cuello · Sin datos») pero el apartado 2 manda *"no
   mostrar métricas vacías"* y el 26 acota a cuatro: gastar uno de los cuatro en
   un grupo que no dice nada deja fuera uno que sí. Los siete están enteros en
   la sección Músculos, a un toque. */

export function bloqueMusculos(fitness, {
  propios = [], periodo = PERIODO_POR_DEFECTO, hoy = todayISO(), max = MUSCULOS_RESUMEN_MAX,
} = {}) {
  const m = resumenMuscular(fitness, { rango: periodo, hoy, propios });
  const conDatos = m.grupos
    .filter((g) => g.ejerciciosConDatos > 0)
    .sort((a, b) => b.ejerciciosConDatos - a.ejerciciosConDatos || a.nombre.localeCompare(b.nombre));
  const grupos = conDatos.slice(0, Math.max(1, max)).map((g) => ({
    id: g.id,
    nombre: g.nombre,
    icono: g.icono,
    estado: g.estado,
    estadoNombre: g.estadoNombre,
    simbolo: g.simbolo,
    etiqueta: `${g.simbolo} ${g.estadoNombre}`,
    pocaInformacion: g.pocaInformacion,
    resumen: g.resumen,
  }));
  return {
    id: 'musculos',
    hay: grupos.length > 0,
    grupos,
    total: conDatos.length,
    hayMas: conDatos.length > grupos.length,
    /* El aviso es el de la F13, tal cual (apartado 5). */
    aviso: AVISO_RENDIMIENTO,
    destino: 'musculos',
    vacio: m.hayEjercicios
      ? 'Todavía no hay ejercicios comparables en este periodo.'
      : 'Registra un entrenamiento para ver qué músculos trabajas.',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · FOTOS Y COMPARACIÓN RÁPIDA (apartados 6 y 7)
   ═══════════════════════════════════════════════════════════════════════════ */

export const CTA_FOTOS = 'Ver progreso';
export const CTA_COMPARAR = 'Comparar progreso';
export const FOTOS_NO_DISPONIBLES = 'Fotos no disponibles ahora mismo.';

/**
 * 🚨 Apartado 7 — *"No seleccionar automáticamente fotos incompatibles"*, y
 * *"por defecto: más antigua disponible + más reciente disponible"*.
 *
 * Incompatible aquí significa **encuadres distintos declarados**, que es lo
 * único que se sabe: la orientación es una etiqueta de la F26 (frontal, lateral
 * o espalda). Así que si la más reciente declara la suya, el «antes» es la más
 * antigua **con esa misma orientación**; si ninguna la declara, se usa la más
 * antigua a secas — porque **sin etiqueta no se afirma ni que coinciden ni que
 * no** (F27, apartado 13: *"si no existe, no inventarlo"*).
 */
export function comparacionRapida(fotos) {
  const orden = fotosEnOrden(fotos);
  if (orden.length < MINIMO_PARA_COMPARAR) {
    return { hay: false, motivo: 'faltan', antesId: null, despuesId: null, texto: FALTA_OTRA_FOTO, cta: null };
  }
  const despues = orden[0];
  const masAntigua = orden[orden.length - 1];
  const o = orientacionDeFoto(despues);
  /* Ojo: se recorre desde el final, así que la primera que encaje es la más
     antigua de esa orientación. */
  const compatible = o
    ? [...orden].reverse().find((f) => f.id !== despues.id && orientacionDeFoto(f) && orientacionDeFoto(f).id === o.id)
    : null;
  const antes = compatible || masAntigua;
  const c = compararFotos(fotos, antes.id, despues.id);
  if (!c.hay) return { hay: false, motivo: c.motivo, antesId: null, despuesId: null, texto: FALTA_OTRA_FOTO, cta: null };
  return {
    hay: true,
    motivo: null,
    antesId: c.antes.id,
    despuesId: c.despues.id,
    etiquetaAntes: c.etiquetaAntes,
    etiquetaDespues: c.etiquetaDespues,
    /* ⚠️ Lo único que se afirma es cuánto tiempo pasó (F26, apartado 41). */
    texto: c.texto,
    mismaOrientacion: !!compatible,
    orientacion: compatible && o ? o.nombre : null,
    cta: CTA_COMPARAR,
  };
}

/**
 * ⚠️ `error` es el apartado 30: si las fotos no se pueden leer, este bloque lo
 * dice **y los demás siguen enteros**. Quien lo sabe es la pantalla, que es
 * quien firma las URL (F26/F27).
 */
export function bloqueFotos(fotos, { max = FOTOS_RESUMEN_MAX, error = false } = {}) {
  if (error) {
    return {
      id: 'fotos',
      hay: false,
      error: true,
      aviso: FOTOS_NO_DISPONIBLES,
      detalle: ERRORES_FOTO.leer.texto,
      recientes: [],
      total: 0,
      ultima: null,
      anterior: null,
      comparacion: { hay: false, motivo: 'error', antesId: null, despuesId: null, texto: '', cta: null },
      destino: 'fotos',
      cta: CTA_FOTOS,
      vacio: '',
    };
  }
  const orden = fotosEnOrden(fotos);
  const ficha = (f) => (f ? { id: f.id, path: f.path, fecha: f.fecha, etiqueta: etiquetaDeDia(f.fecha), nota: f.nota } : null);
  return {
    id: 'fotos',
    hay: orden.length > 0,
    error: false,
    aviso: '',
    total: orden.length,
    /* Apartado 6 — última, anterior si existe, y la fecha. */
    ultima: ficha(orden[0] || null),
    anterior: ficha(orden[1] || null),
    recientes: orden.slice(0, Math.max(1, max)).map(ficha),
    hayMas: orden.length > Math.max(1, max),
    comparacion: comparacionRapida(fotos),
    puedeComparar: puedeComparar(fotos),
    destino: 'fotos',
    cta: CTA_FOTOS,
    /* Apartado 18, literal. */
    vacio: 'Empieza a registrar tu progreso visual.',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · OBJETIVOS (apartado 8)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ *"No crear objetivos nuevos desde este resumen"*: aquí no hay ni un botón
   de crear. Se ven, se tocan y se abre el suyo, que es el de la F14. */

export function bloqueObjetivos(fitness, { propios = [], hoy = todayISO(), max = OBJETIVOS_RESUMEN_MAX } = {}) {
  const r = listaDeObjetivos(fitness, { filtro: 'activo', propios, hoy });
  const objetivos = r.objetivos.slice(0, Math.max(1, max));
  return {
    id: 'objetivos',
    hay: objetivos.length > 0,
    objetivos,
    total: r.activos,
    completados: r.completados,
    hayMas: r.activos > objetivos.length,
    destino: 'objetivos',
    vacio: r.completados
      ? 'No tienes objetivos activos ahora mismo.'
      : 'Ponte un objetivo para seguir tu progreso.',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   10 · RANGO (apartado 9)
   ═══════════════════════════════════════════════════════════════════════════
   *"Mostrar opcionalmente el rango global actual y un pequeño indicador de
   evolución"*, y al pulsarlo → Rangos.

   🚨 **NI UNA PUNTUACIÓN AQUÍ.** El score existe en el motor y se enseña en su
   pantalla (F16/F25), pero en un resumen que junta seis sistemas un número
   suelto de 0 a 1000 es justo lo que el apartado 10 llama métrica inventada:
   cualquiera lo leería como *«mi progreso físico va por 520»*. */

export function bloqueRango(fitness, { propios = [], perfil = null } = {}) {
  const global = rangoGlobalEfectivo(fitness, { propios, perfil });
  const historial = historialDeRango(fitness, DESTINO_GLOBAL, { propios, perfil });
  const evolucion = evolucionReciente(resumenDeHistorial(historial));
  return {
    id: 'rango',
    hay: !global.sinRango,
    rango: global.rango,
    nombre: global.nombre,
    provisional: !!global.provisional,
    confianzaNombre: global.confianzaNombre || null,
    cobertura: global.cobertura || null,
    /* Lo que ya decidió la F25: subir de rango y progresar dentro del mismo son
       dos frases distintas, y aquí solo se reenvía la que toque. */
    evolucion,
    ultimoCambio: historial.ultimoCambio || null,
    destino: 'rangos',
    vacio: 'Entrena varios grupos musculares para calcular tu rango.',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   11 · LA LÍNEA TEMPORAL (apartados 12, 13, 14 y 15)
   ═══════════════════════════════════════════════════════════════════════════
   🚨 *"No almacenar necesariamente una timeline duplicada. Derivarla de las
   fuentes existentes."* — y aquí no es «no necesariamente»: **no se almacena**.
   Cada evento sale del registro que ya existe, así que borrar una foto o una
   sesión lo quita de la línea sin que nadie limpie nada (apartado 23).

   ⚠️ *"Pero solo incluir eventos reales. No inventar eventos intermedios"*
   (apartado 12): no hay relleno entre dos fechas, ni un punto por cada día. */

export const TIPOS_EVENTO = [
  { id: 'photo', nombre: 'Foto', filtro: 'fotos', fuente: 'saludFotos (F26)' },
  { id: 'workout', nombre: 'Entrenamiento', filtro: 'entrenamientos', fuente: 'fitness.sesiones (F10)' },
  { id: 'rankChange', nombre: 'Cambio de rango', filtro: 'rangos', fuente: 'historialRangos.js (F22)' },
  { id: 'goalCompleted', nombre: 'Objetivo conseguido', filtro: 'objetivos', fuente: 'fitness.objetivos (F14)' },
  { id: 'goalCreated', nombre: 'Nuevo objetivo', filtro: 'objetivos', fuente: 'fitness.objetivos (F14)' },
];
export const tipoEvento = (id) => TIPOS_EVENTO.find((t) => t.id === texto(id)) || null;

/** Apartado 15 — *"No hacer un sistema complejo"*: cinco pastillas. */
export const FILTROS_TIMELINE = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'fotos', nombre: 'Fotos' },
  { id: 'entrenamientos', nombre: 'Entrenamientos' },
  { id: 'rangos', nombre: 'Rangos' },
  { id: 'objetivos', nombre: 'Objetivos' },
];
export const SIN_EVENTOS = 'Todavía no hay nada que enseñar aquí.';
export const SIN_EVENTOS_FILTRO = 'No hay eventos de este tipo en este periodo.';

const msDeISO = (iso) => {
  const d = new Date(`${texto(iso)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
};
const isoDeMs = (ms) => {
  const d = new Date(Number(ms));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('sv-SE');
};

/**
 * Todos los eventos reales, **sin filtrar ni cortar**: el periodo y el filtro
 * son del apartado 15 y 16, y se aplican al mirar (`timelineDeProgreso`).
 */
export function eventosDelProgreso(fitness, fotos, { propios = [], perfil = null } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const eventos = [];

  /* — Fotos — */
  fotosEnOrden(fotos).forEach((foto) => {
    eventos.push({
      id: `photo-${foto.id}`,
      tipo: 'photo',
      fecha: foto.fecha,
      /* Apartado 14 — el desempate a igualdad de día. `createdAt` es cuándo la
         subió, que es lo único que ordena dos fotos del mismo día. */
      ts: Date.parse(foto.createdAt) || msDeISO(foto.fecha),
      titulo: 'Foto de progreso',
      detalle: texto(foto.nota),
      referencia: { destino: 'fotos', id: foto.id },
    });
  });

  /* — Entrenamientos — */
  sesionesDelHistorial(f).forEach((s) => {
    eventos.push({
      id: `workout-${s.id}`,
      tipo: 'workout',
      fecha: s.fecha,
      ts: Number(s.terminadaEn) || Number(s.guardadaEn) || msDeISO(s.fecha),
      titulo: texto(s.nombre) || 'Entrenamiento',
      detalle: '',
      referencia: { destino: 'sesion', id: s.id },
    });
  });

  /* — Cambios de rango — 🚨 son los de la F22, que además ya garantiza que un
     cambio existe **solo si cambió el rango**, nunca por moverse el score. */
  const historial = historialDeRango(f, DESTINO_GLOBAL, { propios, perfil });
  lista(historial.cambios).forEach((c) => {
    eventos.push({
      id: `rank-${c.id}`,
      tipo: 'rankChange',
      fecha: c.fecha,
      ts: msDeISO(c.fecha),
      titulo: c.sentido === 'subida' ? `Nuevo rango: ${c.hastaNombre}` : `Cambio de rango: ${c.hastaNombre}`,
      detalle: `${c.desdeNombre} → ${c.hastaNombre}`,
      sentido: c.sentido,
      referencia: { destino: 'rangos', id: '' },
    });
  });

  /* — Objetivos: creados y conseguidos — */
  lista(f.objetivos).forEach((o) => {
    if (!o || !o.id) return;
    const creado = isoDeMs(o.creadoEn);
    if (creado) {
      eventos.push({
        id: `goalnew-${o.id}`,
        tipo: 'goalCreated',
        fecha: creado,
        ts: Number(o.creadoEn) || msDeISO(creado),
        titulo: 'Nuevo objetivo',
        detalle: '',
        referencia: { destino: 'objetivos', id: o.id },
      });
    }
    /* ⚠️ Conseguido tiene **fecha real**: la de la sesión en la que lo superó,
       que es la que devuelve `valorActual` (F14). Un objetivo cancelado no
       cuenta, y uno sin datos tampoco: no se inventa el día. */
    if (o.estado === 'cancelado') return;
    const actual = valorActual(f, o, { propios });
    const logrado = !!actual && typeof o.valor === 'number' && actual.valor >= o.valor;
    if (logrado && actual.fecha) {
      eventos.push({
        id: `goaldone-${o.id}`,
        tipo: 'goalCompleted',
        fecha: actual.fecha,
        ts: msDeISO(actual.fecha),
        titulo: 'Objetivo conseguido',
        detalle: '',
        referencia: { destino: 'objetivos', id: o.id },
      });
    }
  });

  /* ⚠️ **Una fecha posterior a hoy NO se descarta.** Josué puede fechar una
     foto a mano, y un registro suyo es un registro: esconderlo sería quitarle
     de la línea algo que sí existe, sin decírselo (regla 8). Lo único que se
     descarta es una fecha que no tiene forma de fecha. */
  return eventos
    .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(texto(e.fecha)))
    .map((e) => ({
      ...e,
      etiqueta: etiquetaDeDia(e.fecha),
      tipoNombre: tipoEvento(e.tipo).nombre,
    }))
    /* Apartado 14 — más reciente primero; a igual fecha, la marca de tiempo. */
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.ts - a.ts));
}

/** El nombre del ejercicio de un objetivo, para la línea del evento. */
export function detallarEventosDeObjetivo(eventos, objetivos) {
  const porId = new Map(lista(objetivos).map((o) => [o.id, o]));
  return lista(eventos).map((e) => {
    if (e.tipo !== 'goalCompleted' && e.tipo !== 'goalCreated') return e;
    const o = porId.get(e.referencia.id);
    return o ? { ...e, detalle: `${o.nombre} · ${o.objetivoTexto}` } : e;
  });
}

/**
 * Lo que se ve: el filtro del apartado 15 y el periodo del 16, **sobre la
 * lista ya calculada**. Recortar aquí es correcto: una línea temporal es una
 * vista, no un cálculo.
 */
export function timelineDeProgreso(eventos, {
  filtro = 'todos', periodo = PERIODO_POR_DEFECTO, hoy = todayISO(), limite = TIMELINE_RESUMEN_MAX,
} = {}) {
  const todos = lista(eventos);
  const p = periodoResumen(periodo);
  const desde = inicioDePeriodo(p.dias, hoy);
  const enPeriodo = desde ? todos.filter((e) => e.fecha >= desde) : todos;
  const filtrados = filtro === 'todos'
    ? enPeriodo
    : enPeriodo.filter((e) => tipoEvento(e.tipo) && tipoEvento(e.tipo).filtro === filtro);
  const visibles = filtrados.slice(0, Math.max(1, limite));
  return {
    id: 'timeline',
    hay: visibles.length > 0,
    eventos: visibles,
    total: filtrados.length,
    hayMas: filtrados.length > visibles.length,
    filtro,
    periodo: p.id,
    /* ⚠️ Vacío por filtro y vacío del todo no son lo mismo: uno se arregla
       quitando el filtro y el otro registrando algo. */
    vacio: todos.length === 0 ? SIN_EVENTOS : SIN_EVENTOS_FILTRO,
    /* Cuántos hay de cada tipo, para no ofrecer una pastilla que deja la lista
       vacía sin avisar (FIT F2, apartado 23). */
    porFiltro: FILTROS_TIMELINE.map((x) => ({
      ...x,
      cuantos: x.id === 'todos' ? enPeriodo.length : enPeriodo.filter((e) => tipoEvento(e.tipo).filtro === x.id).length,
    })),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   12 · ESTADOS, ONBOARDING Y ERRORES (apartados 17, 18, 29 y 30)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Los seis del apartado 29. ⚠️ El de carga **no lo devuelve esta librería** y
 *  está declarado a propósito: los datos de Fitness llegan con la sesión, así
 *  que quien enseña el esqueleto es la pantalla de carga de la aplicación
 *  (E3 F14). Decir que aquí hay un estado «cargando» sería inventarlo. */
export const ESTADOS_RESUMEN = [
  { id: 'cargando', nombre: 'Cargando', deLaPantalla: true, donde: 'LoadingScreen y `Esqueleto` (E3 F14): `app_data` se carga entero al entrar.' },
  { id: 'vacio', nombre: 'Sin datos todavía' },
  { id: 'parcial', nombre: 'Con datos parciales' },
  { id: 'completo', nombre: 'Con datos' },
  { id: 'error_parcial', nombre: 'Una fuente no está disponible' },
  { id: 'error_general', nombre: 'No se ha podido calcular' },
];
export const estadoResumen = (id) => ESTADOS_RESUMEN.find((e) => e.id === texto(id)) || null;

/** Apartado 17 — *"Tu progreso empieza aquí."*, con sus tres salidas. */
export const ONBOARDING = {
  titulo: 'Tu progreso empieza aquí.',
  texto: 'Registra un entrenamiento, añade una foto o ponte un objetivo: lo que hagas empezará a aparecer en esta pantalla.',
  acciones: [
    { id: 'entrenar', texto: 'Añadir entrenamiento', necesita: 'entrenar' },
    { id: 'foto', texto: 'Añadir foto', necesita: 'foto' },
    { id: 'objetivo', texto: 'Crear objetivo', necesita: 'objetivo' },
  ],
};

/**
 * ⚠️ Regla 8 — una acción que no puede funcionar **no se pinta**. «Añadir foto»
 * necesita que la galería pueda escribir, y «Crear objetivo» que se pueda
 * guardar: sin eso serían dos botones muertos.
 */
export function accionesDeOnboarding(puede = {}) {
  return ONBOARDING.acciones.filter((a) => !!puede[a.necesita]);
}

export const ERROR_GENERAL = {
  titulo: 'No hemos podido calcular tu progreso.',
  texto: 'Puede ser un dato guardado que no se entiende. Tus entrenamientos y tus fotos siguen ahí.',
  cta: 'Reintentar',
};

/**
 * 🚨 Apartado 30 — *"Un error en Fotos no debe impedir mostrar
 * Entrenamientos"*. Cada bloque se calcula **por separado y envuelto**, como
 * `panelSeguro` en Productividad (E3 F29): uno que reviente se queda con su
 * aviso y los otros cinco siguen enteros.
 */
export function bloqueSeguro(id, calcular) {
  try {
    return { ok: true, bloque: calcular(), aviso: '' };
  } catch (e) {
    const b = bloqueResumen(id);
    return {
      ok: false,
      bloque: { id, hay: false, error: true, vacio: '' },
      aviso: `${b ? b.nombre : 'Esta sección'} no está disponible ahora mismo.`,
    };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   13 · EL CENTRO DE SEGUIMIENTO (apartados 1, 2, 19, 21 y 34)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `ProgressOverview` en datos.
 *
 * 🚨 **NI UNA CIFRA QUE MEZCLE DOS BLOQUES** (apartados 10 y 33). Lo que
 * devuelve esta función son seis bloques y una línea temporal; no hay un
 * `progresoFisico`, ni un porcentaje global, ni una puntuación combinada, y hay
 * una casilla de auditoría que lo comprueba recorriendo las claves.
 */
export function centroDeProgreso(fitness, fotos = [], {
  propios = [], perfil = null, periodo = PERIODO_POR_DEFECTO, hoy = todayISO(),
  filtroTimeline = 'todos', errorFotos = false, puede = {},
} = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  try {
    const calculados = [
      bloqueSeguro('rango', () => bloqueRango(f, { propios, perfil })),
      bloqueSeguro('entrenamientos', () => bloqueEntrenamientos(f, { periodo, hoy })),
      bloqueSeguro('ejercicios', () => bloqueEjercicios(f, { propios, periodo, hoy })),
      bloqueSeguro('fotos', () => bloqueFotos(fotos, { error: errorFotos })),
      bloqueSeguro('musculos', () => bloqueMusculos(f, { propios, periodo, hoy })),
      bloqueSeguro('objetivos', () => bloqueObjetivos(f, { propios, hoy })),
    ];
    const porId = new Map(calculados.map((c) => [c.bloque.id, c]));
    const objetivosBloque = porId.get('objetivos').bloque;
    const eventos = detallarEventosDeObjetivo(
      eventosDelProgreso(f, errorFotos ? [] : fotos, { propios, perfil }),
      listaDeObjetivos(f, { filtro: 'todos', propios, hoy }).objetivos,
    );
    const timeline = timelineDeProgreso(eventos, { filtro: filtroTimeline, periodo, hoy });

    const conDatos = calculados.filter((c) => c.ok && c.bloque.hay).length;
    const fallidos = calculados.filter((c) => !c.ok);
    const avisos = [
      ...fallidos.map((c) => c.aviso),
      ...(errorFotos ? [FOTOS_NO_DISPONIBLES] : []),
    ];
    const estado = fallidos.length ? 'error_parcial'
      : conDatos === 0 ? 'vacio'
        : conDatos === calculados.length ? 'completo' : 'parcial';

    return {
      error: null,
      estado,
      estadoNombre: estadoResumen(estado).nombre,
      periodo: periodoResumen(periodo).id,
      periodos: PERIODOS_RESUMEN,
      /* El orden del apartado 25, escrito **una sola vez**: ninguna pantalla
         decide la jerarquía (F25 con `RankDashboard`). */
      orden: BLOQUES.filter((b) => b.id !== 'timeline').map((b) => b.id),
      bloques: Object.fromEntries(calculados.map((c) => [c.bloque.id, c.bloque])),
      timeline,
      avisos,
      /* Apartado 17 — solo cuando no hay absolutamente nada. */
      onboarding: conDatos === 0 && !fallidos.length
        ? { ...ONBOARDING, acciones: accionesDeOnboarding(puede) }
        : null,
      /* Apartado 18 — con datos parciales, lo que falta se dice en su bloque y
         el resto se enseña entero. */
      parcial: estado === 'parcial',
      objetivosActivos: objetivosBloque.total || 0,
    };
  } catch (e) {
    return {
      error: { ...ERROR_GENERAL, detalle: (e && e.message) || '' },
      estado: 'error_general',
      estadoNombre: estadoResumen('error_general').nombre,
      periodo: periodoResumen(periodo).id,
      periodos: PERIODOS_RESUMEN,
      orden: [],
      bloques: {},
      timeline: { id: 'timeline', hay: false, eventos: [], total: 0, hayMas: false, filtro: 'todos', periodo: periodoResumen(periodo).id, vacio: SIN_EVENTOS, porFiltro: [] },
      avisos: [],
      onboarding: null,
      parcial: false,
      objetivosActivos: 0,
    };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   14 · LO QUE NO SE CONSTRUYE (apartados 11 y 33)
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT28 = [
  { que: 'Una métrica global de progreso físico', porque: 'Apartado 10, con su ejemplo: «Fotos + fuerza + rangos = progreso físico 82 %. Eso sería una métrica inventada.»' },
  { que: 'Correlaciones automáticas', porque: 'Apartado 11: «Desde que entrenas más has ganado músculo» no se puede afirmar con estos datos. Esta fase conecta navegación y contexto.' },
  { que: 'Predicciones y análisis corporal', porque: 'Apartado 33, y la F26 ya lo prohibía para las fotos (su apartado 41).' },
  { que: 'IA', porque: 'Apartado 33. Todo lo que se enseña sale de multiplicar y ordenar datos que ya existen.' },
  { que: 'Comparación social, leaderboard, XP y gamificación', porque: 'Apartado 33, y D2-02.' },
  { que: 'Crear objetivos desde el resumen', porque: 'Apartado 8: «No crear objetivos nuevos desde este resumen». Se abre el suyo, en su sección.' },
  { que: 'La puntuación del rango (0-1000)', porque: 'Existe en el motor y se enseña en Rangos (F16/F25). En un resumen que junta seis sistemas, un número suelto se leería como la métrica global que prohíbe el apartado 10.' },
  { que: 'Una timeline guardada', porque: 'Apartado 13: «Derivarla de las fuentes existentes». Guardarla obligaría a limpiar eventos falsos al borrar un dato (F22, apartado 18).' },
];

export const DECISIONES_FIT28 = [
  {
    que: 'Los seis motores se llaman; ninguno se reescribe',
    porque: 'Contexto del enunciado: «Cada sistema mantiene su propia lógica». Y cada bloque declara su fuente única en BLOQUES, que es la forma comprobable del apartado 10.',
  },
  {
    que: 'Un grupo muscular sin datos no ocupa un hueco de la vista previa',
    porque: 'El apartado 5 lo enseña en su ejemplo, pero el 2 manda «no mostrar métricas vacías» y el 26 acota a cuatro. Los siete están en la sección Músculos, a un toque.',
  },
  {
    que: 'El periodo recorta Ejercicios, Músculos y la línea temporal; no toca Rango ni Objetivos',
    porque: 'Apartado 16, literal. Y es la F22 (apartado 23) frente a la F13: recortar sesiones es correcto para medir la actividad de un periodo y un fallo para calcular un rango.',
  },
  {
    que: 'La comparación rápida elige la más antigua de la MISMA orientación cuando la hay',
    porque: 'Apartado 7: «No seleccionar automáticamente fotos incompatibles». Y sin etiqueta no se afirma ni que coinciden ni que no (F27, apartado 13), así que se usa la más antigua a secas.',
  },
  {
    que: 'Las acciones del onboarding que no pueden funcionar no se pintan',
    porque: 'Regla 8. «Añadir foto» necesita que la galería pueda escribir; sin eso sería un botón muerto en el iPhone de Josué.',
  },
  {
    que: 'No hace falta invalidar nada tras guardar, borrar o conseguir algo',
    porque: 'Apartado 23. Al no guardarse el resumen, el siguiente render lo recalcula desde las fuentes: es la F15 con los rangos y la F24 con la cola otra vez.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   15 · AUDITORÍA (apartados 31, 32 y 34)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ Recibe el resumen ya calculado a propósito (EH F42): así una prueba puede
   darle uno fabricado y ver las casillas ponerse rojas. */

/** Las claves que **nunca** puede tener un bloque: serían la métrica mezclada. */
export const CLAVES_PROHIBIDAS = ['progresoFisico', 'puntuacionGlobal', 'indiceProgreso', 'score', 'puntuacion'];

/** 🚨 La prueba mecánica del apartado 10, sobre el resumen de verdad. */
export function mezclaFuentes(resumen) {
  const bloques = (resumen && resumen.bloques) || {};
  const malas = [];
  Object.entries(bloques).forEach(([id, b]) => {
    Object.keys(b || {}).forEach((k) => {
      if (CLAVES_PROHIBIDAS.includes(k)) malas.push(`${id}.${k}`);
    });
  });
  /* Y ninguna clave del propio resumen puede ser una cifra combinada. */
  Object.keys(resumen || {}).forEach((k) => {
    if (CLAVES_PROHIBIDAS.includes(k)) malas.push(k);
  });
  return { hay: malas.length > 0, claves: malas };
}

export function casillasDeIntegracion(resumen) {
  const r = resumen || {};
  const b = r.bloques || {};
  const mezcla = mezclaFuentes(r);
  const fuentes = BLOQUES.filter((x) => x.id !== 'timeline');
  return [
    { id: 'conecta', ok: fuentes.length === 6, que: 'Conecta entrenamientos, ejercicios, músculos, rangos, objetivos y fotos' },
    { id: 'una_fuente', ok: fuentes.every((x) => !!x.fuente && !x.fuente.includes('+')), que: 'Cada bloque lee de un solo motor' },
    { id: 'sin_metrica', ok: !mezcla.hay, que: 'No existe ninguna métrica global inventada', detalle: mezcla.claves.join(', ') },
    { id: 'no_guarda', ok: AUDITORIA_FIT28.guardaAlgo === false, que: 'El resumen no se guarda: se deriva' },
    { id: 'periodo', ok: LO_QUE_EL_PERIODO_NO_TOCA.length === 4 && EL_PERIODO_RECORTA.length === 3, que: 'El periodo filtra la vista y no toca rangos ni objetivos' },
    { id: 'limites', ok: EJERCICIOS_RESUMEN_MAX <= 4 && MUSCULOS_RESUMEN_MAX <= 4 && OBJETIVOS_RESUMEN_MAX <= 3 && FOTOS_RESUMEN_MAX <= 3, que: 'El resumen no satura (apartado 26)' },
    { id: 'timeline', ok: TIPOS_EVENTO.length === 5, que: 'La línea temporal tiene los cinco tipos de evento' },
    { id: 'parcial', ok: !!b.entrenamientos, que: 'Un error en una fuente no esconde las demás' },
    { id: 'navegacion', ok: fuentes.every((x) => x.id === 'timeline' || !!x.destino), que: 'Cada bloque lleva a su módulo (apartado 19)' },
    { id: 'sin_ia', ok: NO_EN_FIT28.length === 8, que: 'Ni IA, ni correlaciones, ni predicciones, ni gamificación' },
  ];
}

export const AUDITORIA_FIT28 = {
  tablasNuevas: 0,
  clavesNuevas: 0,
  politica: 'auth.uid() = user_id',
  /* 🚨 El apartado 21 en una línea, con una prueba que lee el código fuente. */
  guardaAlgo: false,
  normalizador: false,
  fuentes: BLOQUES.map((b) => ({ bloque: b.id, fuente: b.fuente })),
};

export function auditarIntegracion(fitness, fotos = [], opciones = {}) {
  const r = centroDeProgreso(fitness, fotos, opciones);
  const casillas = casillasDeIntegracion(r);
  return { resumen: r, casillas, ok: casillas.every((c) => c.ok) };
}

export default centroDeProgreso;
