/* ===========================================================================
   ENTREGA 4 · FASE 25/45 — EL RESUMEN DE LA PANTALLA DE RANGOS

   🚨 **AQUÍ NO SE CALCULA NI UN RANGO** (apartados 23 y 35: *"NO modificar el
   RankEngine"*, *"El resumen debe consumir exclusivamente el sistema
   existente"*). Esta capa **junta y ordena** lo que ya resuelven la F16
   (`pantallaDeRangos`), la F13 (`resumenMuscular`), la F22 (`historialDeRango`),
   la F23 (`tarjetaSiguienteRango`) y la F24 (`pantallaDeClasificacion`).

   🚨 **Y NO SE GUARDA NINGÚN «dashboard summary»** (apartado 23, literal). Se
   deriva al leer, que es lo que evita que el resumen y el detalle acaben
   diciendo dos cosas — la misma decisión que la F15 con los rangos, la F22 con
   el historial y la F24 con la cola.

   ⚠️ **UNA INSTANTÁNEA, NO OCHO** (apartado 24): cada motor se llama **una
   vez** y de ahí sale todo. Pedir el rango global por tarjeta lo recorrería
   todo siete veces en cada pintado.
   =========================================================================== */

import { GRUPOS_MUSCULARES } from './fitness.js';
import { pantallaDeRangos } from './pantallaRangos.js';
import { resumenMuscular } from './progresoMuscular.js';
import { historialDeRango, resumenDeHistorial } from './historialRangos.js';
import { tarjetaSiguienteRango } from './siguienteRango.js';
import { pantallaDeClasificacion } from './colaClasificacion.js';
import { confianzaExplicada } from './explicacionRangos.js';
import { contribucionesDeMusculo } from './contribucionMuscular.js';

const lista = (x) => (Array.isArray(x) ? x : []);

/** El destino del rango general, escrito una vez (lo comparten F22 y F23). */
export const DESTINO_GLOBAL = { tipo: 'overall', id: '' };

/* ═══════════════════════════════════════════════════════════════════════════
   1 · EN QUÉ ESTADO ESTÁ LA PANTALLA (apartados 19 y 20)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 Apartado 20 — *"No crear cuatro UIs completamente distintas"*. Esto **no
 * elige pantalla**: elige **qué tiene sentido decir**, y los mismos componentes
 * cambian su contenido. Por eso cada estado declara qué bloques puede haber, y
 * no hay un `if` por estado en ninguna vista.
 *
 * ⚠️ Y los umbrales **no son nuevos**: «hay rango global» ya lo decide la F15
 * (tres grupos **y** tres ejercicios) y «hay evolución» la F22. Inventar aquí un
 * «a partir de N sesiones» habría sido un tercer criterio sobre lo mismo.
 */
export const ESTADOS_PANTALLA = [
  {
    id: 'sin_datos',
    nombre: 'Sin datos',
    que: 'Todavía no hay con qué calcular un rango.',
    /* Apartado 4 — la pantalla de inicio, con su CTA y **sin un 0 %**. */
    onboarding: true,
  },
  {
    id: 'primeros_datos',
    nombre: 'Primeros datos',
    que: 'Hay entrenamientos, pero todavía no llegan para un rango general.',
    onboarding: false,
  },
  {
    id: 'completo',
    nombre: 'Datos suficientes',
    que: 'Hay rango general y se puede leer la pantalla entera.',
    onboarding: false,
  },
  {
    id: 'detallado',
    nombre: 'Con recorrido',
    que: 'Además hay historial con cambios, así que se puede hablar de evolución.',
    onboarding: false,
  },
];
export const estadoPantalla = (id) => ESTADOS_PANTALLA.find((e) => e.id === id) || null;

/**
 * ⚠️ «Sin datos» es **ni una sesión ni una clasificación**, no «sin rango»: con
 * ejercicios entrenados y sin rango global todavía hay mucho que enseñar, y
 * mandarle al onboarding sería esconderle lo que ya tiene (apartado 19).
 */
export function estadoDeDatos({ global = null, sesiones = 0, clasificaciones = 0, evolucion = null } = {}) {
  const hayAlgo = (Number(sesiones) || 0) > 0 || (Number(clasificaciones) || 0) > 0;
  if (!hayAlgo) return estadoPantalla('sin_datos');
  if (!global || global.sinRango) return estadoPantalla('primeros_datos');
  if (evolucion && evolucion.hay && (evolucion.subida || evolucion.progresoDentro)) return estadoPantalla('detallado');
  return estadoPantalla('completo');
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · DESTACADOS MUSCULARES (apartados 9, 10 y 11)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 9 — *"Mostrar 2–3 grupos que tengan información útil"*. */
export const DESTACADOS_MAX = 3;
export const DESTACADOS_MIN = 2;

/**
 * 🚨 Apartado 10, literal: *"No llamarlo «mejores músculos». No asumir que un
 * rango superior significa mayor desarrollo físico"*. El rótulo dice de qué
 * habla —de dónde hay información—, y la frase de debajo lo repite en palabras.
 */
export const ETIQUETA_DESTACADOS = 'Destacados';
export const SUBTITULO_DESTACADOS = 'Los grupos de los que más información hay, no los que tienes más desarrollados.';

/**
 * La selección, **determinista** (apartado 9, con esas palabras). El orden es:
 * primero los que tienen rango, luego por rango, luego por cuántos ejercicios
 * con datos tienen, y a igualdad **el orden anatómico del catálogo** — nunca
 * `Math.random` ni el orden en que llegaron.
 *
 * ⚠️ Apartado 11 — un grupo sin datos **dice «Sin datos»**, no un rango de
 * consolación ni un 0 %. Aquí eso sale gratis: los sin rango van al final y
 * solo entran si no hay suficientes con datos, conservando su propio texto.
 */
export function destacadosMusculares(musculos = [], resumen = null, { max = DESTACADOS_MAX } = {}) {
  const orden = new Map(GRUPOS_MUSCULARES.map((g, i) => [g.id, i]));
  const porId = new Map(lista(resumen && resumen.grupos).map((g) => [g.id, g]));
  const candidatos = lista(musculos).map((m) => {
    const p = porId.get(m.id) || null;
    return {
      id: m.id,
      nombre: m.nombre,
      sinRango: !!m.sinRango,
      rango: m.sinRango ? null : m.rango,
      nombreRango: m.nombreRango,
      datos: m.datos,
      ejercicios: m.ejercicios,
      /* 🐛 La tendencia es `estadoNombre` y el símbolo `simbolo` (F13). Leer
         `tendencia` o `tendenciaNombre` daría `undefined` y la línea se
         quedaría muda sin que fallara nada — es la lección de la F23. */
      tendencia: p ? p.estado : 'sin_datos',
      /* 🚨 **Y sin tendencia no se escribe «Sin datos» al lado de un rango**
         (FIT F25). Un grupo entra aquí **porque tiene rango**; con una sola
         sesión la F11 todavía no puede comparar, así que la F13 devuelve
         `sin_datos` —correcto para ella— y la línea habría quedado *«Espalda ·
         Intermedio · Sin datos»*, que es exactamente lo que el apartado 11
         reserva para un grupo **sin** datos. Sin tendencia, `null`: la línea
         desaparece y el rango se queda solo (apartado 13: *"Solo si los datos
         lo permiten"*). */
      tendenciaNombre: p && p.estado !== 'sin_datos' ? p.estadoNombre : null,
      simbolo: p && p.estado !== 'sin_datos' ? p.simbolo : '',
      conDatos: p ? p.ejerciciosConDatos : 0,
      pocaInformacion: p ? !!p.pocaInformacion : false,
    };
  });
  const util = candidatos.filter((c) => !c.sinRango);
  const elegidos = util.slice().sort((a, b) =>
    (b.rango - a.rango)
    || (b.conDatos - a.conDatos)
    || (b.ejercicios - a.ejercicios)
    || ((orden.get(a.id) ?? 99) - (orden.get(b.id) ?? 99)));
  return elegidos.slice(0, Math.max(0, max));
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · EVOLUCIÓN RECIENTE (apartados 7, 8, 17 y 18)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 8 — sin historial se dice, no se inventa una tendencia. */
export const SIN_EVOLUCION = 'Registra más entrenamientos para ver tu evolución.';

/**
 * 🚨 Apartado 7 — *"Solo cuando exista evidencia real"*, y la evidencia la tiene
 * ya la F22: `resumenDeHistorial` distingue **subir de rango** de **progresar
 * dentro del mismo**, que es justo lo que su apartado 7 prohibía confundir. Aquí
 * no se vuelve a decidir: se elige cuál de las dos frases se enseña.
 *
 * ⚠️ Apartado 18 — sin cambio reciente **no hay tarjeta vacía**: `tarjeta` es
 * `null` y el bloque desaparece.
 */
export function evolucionReciente(historialResumen) {
  const r = historialResumen || null;
  if (!r || !r.hay) return { hay: false, texto: SIN_EVOLUCION, tarjeta: null, dentro: null };
  /* Apartado 17 — un cambio de verdad, con su fecha real. */
  const tarjeta = r.subida
    ? {
      titulo: r.subida.sentido === 'subida' ? 'Nuevo rango' : 'Cambio de rango',
      desde: r.subida.desdeNombre,
      hasta: r.subida.hastaNombre,
      fecha: r.subida.fecha,
      sentido: r.subida.sentido,
    }
    : null;
  const texto = tarjeta
    ? `${tarjeta.sentido === 'subida' ? 'Subiste' : 'Cambiaste'} de ${tarjeta.desde} a ${tarjeta.hasta}`
    : (r.textoDentro ? `Has mejorado dentro de ${r.actual.nombre}` : r.sigueEn);
  return { hay: true, texto: texto || r.sigueEn, tarjeta, dentro: r.progresoDentro ? r.textoDentro : null };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · EJERCICIOS DESTACADOS (apartados 12 y 13)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 12 — *"Opcionalmente mostrar 2–4 ejercicios relevantes"*. */
export const EJERCICIOS_MAX = 4;

/**
 * 🚨 Apartado 13 — *"No afirmar causalidad"*. La frase dice de qué músculo sale
 * cada ejercicio y que **muestra evolución reciente**, nunca que sea la razón
 * del rango.
 */
export const ETIQUETA_EJERCICIOS = 'De los grupos destacados, estos son los que más información aportan ahora.';

/**
 * 🚨 **EL RANGO GLOBAL NO TIENE MÚSCULO DEL QUE REPARTIR, Y LA F23 LO DIJO
 * PRIMERO** (FIT F25). `ejerciciosRelevantes` devuelve `null` para `overall` a
 * propósito —*"un ejercicio y el rango global no tienen músculo del que
 * repartir"*—, así que pedírselos a la tarjeta del siguiente rango daba **una
 * lista vacía siempre**, con la sección desaparecida y sin un solo fallo.
 *
 * ⚠️ Lo que sí tiene músculo son **los destacados**, y el apartado 13 lo dibuja
 * exactamente así: *"Espalda está mejorando"* y debajo *"Dominadas y remo
 * muestran evolución reciente"*. Así que se le pregunta a la **F21** —apartado
 * 12, literal: *"Utilizar la lógica de Fase 21"*— por cada grupo destacado, se
 * juntan sin repetir y se cortan a cuatro. Ni un segundo cálculo de
 * contribución, y **nunca solo por score absoluto**: el orden de la F21 pone
 * delante lo reciente y lo que más pesa.
 */
export function ejerciciosDestacados(fitness, destacados = [], { propios = [], perfil = null, max = EJERCICIOS_MAX } = {}) {
  /* 🐛 **Y un ejercicio se atribuye al grupo donde MÁS participa, no al primero
     que lo nombre** (FIT F25). `contribucionesDeMusculo` devuelve a todo el que
     tenga **algo** de ese músculo, así que un press de banca sale también en
     abdominales: quedándose con el primer destacado que lo listara, la pantalla
     decía *«Press de banca · Abdominales»* teniendo Pecho dos líneas más
     arriba. Manda la participación del catálogo (F2), que es el dato. */
  const mejores = new Map();
  lista(destacados).forEach((d, orden) => {
    const c = contribucionesDeMusculo(fitness || {}, { grupoId: d.id }, { propios, perfil });
    lista(c && c.conDatos).forEach((x, posicion) => {
      const previo = mejores.get(x.exerciseId);
      const cand = { ...x, grupoNombre: d.nombre, grupoDestacado: d.id, orden, posicion };
      if (!previo || cand.participacion > previo.participacion) mejores.set(x.exerciseId, cand);
    });
  });
  /* El orden de dentro es el de la F21 —lo reciente y lo que más pesa—, y entre
     grupos manda el destacado que va antes. Determinista, como el apartado 9. */
  const relevantes = [...mejores.values()]
    .sort((a, b) => a.orden - b.orden || a.posicion - b.posicion || a.nombre.localeCompare(b.nombre))
    .slice(0, Math.max(0, max));
  return {
    relevantes,
    etiqueta: relevantes.length ? ETIQUETA_EJERCICIOS : null,
    hay: relevantes.length > 0,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · CLASIFICACIÓN PENDIENTE (apartados 14 y 15)
   ═══════════════════════════════════════════════════════════════════════════ */

export const CTA_CLASIFICACION = 'Continuar clasificación';
export const CLASIFICACION_COMPLETA = 'Clasificación inicial completa';

/**
 * ⚠️ Apartado 15 — con la cola vacía **no se pinta una tarjeta de tarea
 * pendiente**: queda una línea secundaria, o nada. Una tarjeta con un botón que
 * no tiene nada que clasificar sería el control decorativo de la regla 8.
 */
export function promptDeClasificacion(pantallaClas) {
  const p = pantallaClas || null;
  const cuantos = lista(p && p.cola).length;
  if (!cuantos) {
    return { hay: false, pendiente: false, texto: CLASIFICACION_COMPLETA, cta: null, cuantos: 0 };
  }
  return {
    hay: true,
    pendiente: true,
    titulo: 'Clasifica algunos ejercicios',
    texto: `${cuantos} ${cuantos === 1 ? 'recomendado' : 'recomendados'}`,
    cta: CTA_CLASIFICACION,
    cuantos,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · COBERTURA Y CONFIANZA (apartados 5 y 6)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 Apartado 5 — *"La cobertura significa disponibilidad/calidad de datos"*, y
 * el ejemplo de lo que NO se puede decir es literal: *"Has desarrollado el 71 %
 * de tu cuerpo"*. Eso ya lo resolvió la F16 (`textoDeCobertura` dice **«5 de 7
 * grupos con datos»**) y la F20 lo repite debajo de la barra, así que aquí no se
 * escribe una segunda frase: se reenvía la suya.
 *
 * 🐛 **Y la que se reenvía es `datos.cobertura`, no `datos.global.cobertura`**
 * (FIT F25, y es la lección de la FORMA otra vez, la tercera de esta entrega).
 * Las dos existen y las dos tienen `texto`: la cruda dice *«5/7»* y **no trae
 * `fraccion`**, así que `RankCoverage` habría pintado su barra a `NaN%` —con la
 * pantalla entera renderizándose— y el texto en la forma corta que el apartado 5
 * no quiere. La que pasó por la F16 trae las dos cosas.
 */
export const coberturaDelResumen = (datos) => (datos && datos.cobertura) || null;

/** Apartado 6 — *"Mostrar una etiqueta breve"*, y las tres son las de la F20. */
export const ETIQUETAS_CONFIANZA = { baja: 'Datos limitados', media: 'Confianza media', alta: 'Confianza alta' };

/**
 * 🚨 Apartado 6, literal: *"Utilizar la confianza real del RankEngine. No crear
 * una puntuación de confianza nueva"*. La del rango general la agrega
 * `confianzaCombinada` **dentro del motor**, con los tres niveles de siempre; lo
 * único que se hace aquí es elegir el rótulo corto y su frase.
 */
export function confianzaDelResumen(global) {
  const g = global || null;
  if (!g || g.sinRango || !g.confianza) return null;
  return {
    id: g.confianza,
    etiqueta: ETIQUETAS_CONFIANZA[g.confianza] || g.confianzaNombre || '',
    nombre: g.confianzaNombre || '',
    texto: confianzaExplicada(g.confianza),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · LA JERARQUÍA (apartados 2 y 22)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 El orden del apartado 2, **escrito una vez**. Cada bloque declara a dónde
 * lleva su detalle (apartado 22), así que la pantalla no decide ni el orden ni
 * el destino: los lee. Un `if` por bloque en el JSX sería lo que esta tabla
 * viene a evitar.
 */
export const BLOQUES = [
  { id: 'global', nombre: 'Rango general', detalle: 'explicacion' },
  { id: 'siguiente', nombre: 'Siguiente rango', detalle: 'explicacion' },
  { id: 'cobertura', nombre: 'Cobertura y confianza', detalle: 'explicacion' },
  { id: 'evolucion', nombre: 'Evolución reciente', detalle: 'historial' },
  { id: 'musculos', nombre: 'Rangos musculares', detalle: 'musculo' },
  { id: 'ejercicios', nombre: 'Ejercicios relevantes', detalle: 'ejercicio' },
  { id: 'clasificacion', nombre: 'Clasificación pendiente', detalle: 'clasificacion' },
];
export const bloqueRangos = (id) => BLOQUES.find((b) => b.id === id) || null;

/**
 * 🚨 **LOS NUEVE COMPONENTES DEL APARTADO 21, Y CINCO YA ESTABAN ESCRITOS**
 * (FIT F25, y es la FIT F23 otra vez, donde de cinco existían cuatro). El
 * apartado dice *"Crear/reutilizar"* y a continuación *"Evitar componentes
 * duplicados"*, así que esta tabla dice **cuál es cuál** y hay una comprobación
 * que la lee: escribir un `RankConfidenceBadge` propio habría sido un segundo
 * sitio donde se decide cómo se llama «Confianza alta».
 */
export const COMPONENTES_FIT25 = [
  { pide: 'RankDashboard', es: 'RankDashboard', de: 'FIT F25', nuevo: true },
  { pide: 'OverallRankSummary', es: 'RankOverviewCard', de: 'FIT F16', nuevo: false },
  { pide: 'RankCoverageSummary', es: 'RankCoverage', de: 'FIT F20', nuevo: false },
  { pide: 'RankConfidenceBadge', es: 'RankConfidence', de: 'FIT F20', nuevo: false },
  { pide: 'RankEvolutionSummary', es: 'RankHistorySummary', de: 'FIT F22', nuevo: false },
  { pide: 'RankMuscleHighlights', es: 'RankMuscleHighlights', de: 'FIT F25', nuevo: true },
  { pide: 'RankExerciseHighlights', es: 'RankRelevantExercises', de: 'FIT F23', nuevo: false },
  { pide: 'RankClassificationPrompt', es: 'RankClassificationPrompt', de: 'FIT F25', nuevo: true },
  { pide: 'RankNextRankCard', es: 'RankNextLevelCard', de: 'FIT F23', nuevo: false },
];

/* ═══════════════════════════════════════════════════════════════════════════
   7 · TODO JUNTO, UNA SOLA VEZ (apartados 23, 24 y 31)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 31 — si el cálculo falla, se dice y se ofrece reintentar. */
export const ERROR_RANGOS = {
  titulo: 'No hemos podido calcular tus rangos.',
  que: 'Puede ser un dato guardado que no se entiende. Tus entrenamientos siguen ahí.',
  cta: 'Reintentar',
};

/**
 * `RankDashboard` en datos. **Cada motor, una llamada** (apartado 24).
 *
 * 🚨 Apartado 31 — *"No mostrar datos parcialmente corruptos como si fueran
 * correctos"*. Si algo revienta, se devuelve el estado de error entero: no una
 * pantalla a medias con tres tarjetas buenas y cuatro vacías.
 */
export function resumenDeRangos(fitness, { propios = [], perfil = null } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  try {
    const datos = pantallaDeRangos(f, { propios, perfil });
    const muscular = resumenMuscular(f, { propios });
    const historial = historialDeRango(f, DESTINO_GLOBAL, { propios, perfil });
    const evolucion = evolucionReciente(resumenDeHistorial(historial));
    const siguiente = tarjetaSiguienteRango(f, DESTINO_GLOBAL, { propios, perfil });
    const clasificacion = pantallaDeClasificacion(f, { propios });
    const destacados = destacadosMusculares(datos.musculos, muscular);

    const estado = estadoDeDatos({
      global: datos.global,
      sesiones: lista(f.sesiones).length,
      clasificaciones: lista(f.clasificaciones).length,
      evolucion,
    });

    return {
      error: null,
      estado,
      bloques: BLOQUES,
      /* Lo que ya resolvía la F16, tal cual: rango, cobertura, escala y músculos. */
      datos,
      siguiente,
      evolucion,
      destacados,
      ejercicios: ejerciciosDestacados(f, destacados, { propios, perfil }),
      clasificacion: promptDeClasificacion(clasificacion),
      /* ⚠️ La confianza y la cobertura son **las del RankEngine** (apartados 5
         y 6): aquí solo se reenvían para que la pantalla no tenga que ir a
         buscarlas por su cuenta. */
      cobertura: coberturaDelResumen(datos),
      confianza: confianzaDelResumen(datos.global),
    };
  } catch (e) {
    return {
      error: { ...ERROR_RANGOS, detalle: (e && e.message) || '' },
      estado: estadoPantalla('sin_datos'),
      bloques: BLOQUES,
      datos: null,
      siguiente: null,
      evolucion: { hay: false, texto: SIN_EVOLUCION, tarjeta: null, dentro: null },
      destacados: [],
      ejercicios: { relevantes: [], etiqueta: null, hay: false },
      clasificacion: { hay: false, pendiente: false, texto: CLASIFICACION_COMPLETA, cta: null, cuantos: 0 },
      cobertura: null,
      confianza: null,
    };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · AUDITORÍA (y una que SÍ se puede poner roja)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ⚠️ Recibe el resumen ya calculado a propósito (EH F42): así una prueba puede
 * darle uno fabricado y ver las casillas ponerse rojas.
 */
export function casillasDelResumen(resumen) {
  const r = resumen || {};
  const destacados = lista(r.destacados);
  const estado = r.estado || {};
  return [
    { id: 'acotado', ok: destacados.length <= DESTACADOS_MAX, que: `No se destacan más de ${DESTACADOS_MAX} grupos` },
    { id: 'con_datos', ok: destacados.every((d) => !d.sinRango), que: 'Ningún destacado es un grupo sin datos' },
    /* 🚨 Lo que hay que vigilar no es que **haya** tendencia —con una sesión no
       la puede haber—, sino que **nunca se escriba «Sin datos» junto a un rango
       que sí tiene datos**, que es lo que el apartado 11 reserva para otra cosa
       (FIT F25). Y cuando la hay, va en palabras, no solo en símbolo. */
    {
      id: 'sin_datos_no_se_repite',
      ok: destacados.every((d) => d.tendenciaNombre !== 'Sin datos'),
      que: 'Ningún destacado con rango dice «Sin datos» como tendencia',
    },
    {
      id: 'con_tendencia',
      ok: destacados.every((d) => d.tendenciaNombre === null || (typeof d.tendenciaNombre === 'string' && d.tendenciaNombre.length > 0)),
      que: 'La tendencia, cuando existe, va en palabras',
    },
    { id: 'sin_rango_sin_cero', ok: !r.datos || !r.datos.global.sinRango || !r.siguiente || !r.siguiente.barra, que: 'Sin rango general no se pinta ninguna barra' },
    { id: 'estado', ok: !!estadoPantalla(estado.id), que: 'La pantalla declara en qué estado de datos está' },
    { id: 'jerarquia', ok: lista(r.bloques).length === BLOQUES.length, que: 'La jerarquía del apartado 2 llega entera' },
    /* 🐛 La casilla que habría cazado la cobertura cruda: sin `fraccion` la
       barra se pinta a `NaN%` y nadie se entera (FIT F25). */
    {
      id: 'cobertura_pintable',
      ok: !r.cobertura || (typeof r.cobertura.fraccion === 'number' && r.cobertura.fraccion >= 0 && r.cobertura.fraccion <= 1),
      que: 'La cobertura trae una fracción que se puede pintar',
    },
    {
      id: 'confianza_con_rango',
      ok: !r.datos || (r.datos.global.sinRango ? r.confianza === null : !!(r.confianza && r.confianza.etiqueta)),
      que: 'Hay confianza cuando hay rango, y ninguna cuando no lo hay',
    },
  ];
}

export function auditarResumen(fitness, { propios = [], perfil = null } = {}) {
  const resumen = resumenDeRangos(fitness, { propios, perfil });
  const casillas = casillasDelResumen(resumen);
  return { casillas, ok: casillas.every((c) => c.ok), resumen };
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · LO QUE NO SE CONSTRUYE, Y POR QUÉ
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT25 = [
  {
    que: 'Un «dashboard summary» guardado',
    porque: 'El apartado 23 lo prohíbe con esas palabras y explica el motivo: evita inconsistencias. Todo se deriva al leer de los motores que ya existen, que es lo mismo que hacen los rangos (F15), el historial (F22) y la cola (F24).',
  },
  {
    que: 'Una segunda fórmula de progreso, cobertura o confianza',
    porque: 'El apartado 16 dice «No crear otra fórmula» del próximo rango, el 5 que la cobertura la da el sistema y el 6 que se use «la confianza real del RankEngine». Aquí se reenvía lo que devuelven, sin tocar un número.',
  },
  {
    que: 'IA, recomendaciones de entrenamiento o predicciones',
    porque: 'El contexto abre con «NO crear IA» y el apartado 35 las enumera una por una. El resumen describe lo que hay; no propone qué entrenar.',
  },
  {
    que: 'XP, logros, recompensas, competición o comparación social',
    porque: 'Apartado 35, y es D2-02. El rango es una medida, no un premio: no se gana usando la aplicación ni se canjea por nada.',
  },
  {
    que: 'Cuatro pantallas distintas según cuántos datos haya',
    porque: 'El apartado 20 lo dice al revés: «No crear cuatro UIs completamente distintas. Utilizar componentes que cambien su contenido según el estado». Por eso `ESTADOS_PANTALLA` decide qué se puede decir, no qué pantalla se abre.',
  },
  {
    que: 'Confeti, vibración o sonido al subir de rango',
    porque: 'El apartado 30 los excluye expresamente y solo admite la aparición suave de las tarjetas y la transición de las barras, que ya viven en index.css y respetan «Reducir movimiento» solas (E3 F14).',
  },
];

export const DECISIONES_FIT25 = [
  {
    que: 'Seis de los nueve componentes del apartado 21 ya existían',
    porque: 'OverallRankSummary es RankOverviewCard (F16), RankCoverageSummary es RankCoverage (F20), RankConfidenceBadge es RankConfidence (F20), RankEvolutionSummary es RankHistorySummary (F22), RankExerciseHighlights es RankRelevantExercises (F23) y RankNextRankCard es RankNextLevelCard (F23). El apartado dice «Crear/reutilizar» y a continuación «Evitar componentes duplicados»: se reutilizan, y lo nuevo es el contenedor y los dos bloques que no existían.',
  },
  {
    que: 'El rango global no devolvía su confianza, y por eso se le añade al motor',
    porque: 'El apartado 6 pide «la confianza real del RankEngine» y el 35 dice «NO modificar el RankEngine». La lectura que respeta las dos: no se toca ni una fórmula ni un umbral —los tres niveles siguen siendo CONFIANZA de la F15— y lo que se añade es una AGREGACIÓN, `confianzaCombinada`, exactamente como la F22 sacó `fuenteCombinada` por el mismo motivo. Queda anotado como C-34 en docs/03.',
  },
  {
    que: 'Los destacados se añaden y los siete grupos se quedan',
    porque: 'El apartado 9 pide destacar dos o tres y el 27 evita enseñar «7 grupos completos», pero la F16 prometió en su apartado 14 que el usuario «debe reconocer fácilmente siempre dónde está cada grupo» y su lista es compacta y en orden anatómico. La lectura que respeta las dos: los destacados suben arriba con su tendencia —información que la lista no daba— y la lista sigue debajo. No se esconde nada y nadie pierde su grupo.',
  },
  {
    que: 'La escala de los diez rangos baja en la pantalla',
    porque: 'La jerarquía del apartado 2 enumera siete bloques y la escala no es ninguno: es material de referencia, y el apartado 27 quiere que la principal sea un resumen. Sigue estando entera y se abre igual, solo que después de lo que contesta «¿cómo estoy?».',
  },
  {
    que: 'El estado de datos sale de los umbrales que ya existen',
    porque: '«Hay rango general» lo decide la F15 —tres grupos y tres ejercicios— y «hay evolución» la F22. Escribir aquí un «a partir de N sesiones» habría sido un tercer criterio sobre lo mismo, y el día que uno cambiara la pantalla y el motor dirían cosas distintas.',
  },
  {
    que: 'El error devuelve el estado entero, no una pantalla a medias',
    porque: 'El apartado 31 dice «No mostrar datos parcialmente corruptos como si fueran correctos». Con tres tarjetas buenas y cuatro vacías, él creería que eso es su rango.',
  },
];

export default resumenDeRangos;
