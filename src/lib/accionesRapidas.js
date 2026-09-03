// ============================================================================
// EH · Fase 61/65 — ACCIONES RÁPIDAS E INTELIGENTES
//
// *"Si una acción habitual necesita cinco pantallas, está mal diseñada."*
//
// Y la condición de finalización: *"Ver → decidir → actuar, sin navegar
// innecesariamente. La interfaz debe sentirse rápida, pero nunca confusa."*
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. 🚨 LOS GESTOS DE LOS APARTADOS 5 Y 6 NO SE CONSTRUYEN, Y EL APARTADO 16
// EXPLICA POR QUÉ.** Deslizar y mantener pulsado ya los descartó la **F50**: mover
// una plaquita se hace **con flechas**, que funcionan con el lector de pantalla y
// no dependen del pulso. Y el apartado 16 de esta misma fase lo respalda: *"todas
// las acciones rápidas deben poder utilizarse sin depender exclusivamente de
// gestos; debe existir una alternativa visible"*. Un gesto oculto que es la única
// forma de hacer algo no es una acción rápida: es una acción escondida.
//
// **2. ⚠️ LOS TOQUES SON LOS DE LA F51.** El apartado 17 pide medir *"¿cuántos
// toques hacen falta?"* con objetivo **1–3 para las frecuentes**, y eso ya está
// medido contra los componentes reales de la pantalla. Aquí se **importa**
// `RECORRIDOS` y se comprueba el objetivo; escribir una segunda tabla de toques
// sería tener dos números para la misma acción.
//
// **3. ⚠️ UNA ACCIÓN SE OFRECE SOLO DONDE SIRVE** (apartado 4: *"no mostrar
// 'crear objetivo' si no aporta nada en ese contexto"*). Cada tipo de elemento
// declara **sus** acciones. Un perfume no necesita "convertir en objetivo", y
// enseñárselo es ruido que hay que leer para descartarlo.
//
// **4. ⚠️ NO SE CONFIRMA LO QUE SE PUEDE DESHACER** (apartado 11). Ocultar no
// pregunta; borrar del todo, sí. Poner un aviso delante de cada toque enseña a
// darle a "Sí" sin leer, y entonces el aviso que importaba tampoco se lee — la
// misma lección que la F51 escribió en sus resbalones.
//
// **5. 🚨 Y LO QUE NO EXISTE SE DICE.** El "Deshacer" de unos segundos del
// apartado 12 **no está**: lo que hay es la papelera de treinta días, que es más
// fuerte pero **cuesta tres toques en vez de uno**. Y las acciones en lote del
// apartado 13 tampoco. Las dos se declaran como pendientes con su motivo, en vez
// de dar por hecho que la papelera "ya lo cubre".
// ============================================================================

import { normalizarEstiloHombre, moduloEH, IDS_EH } from './estiloDeHombre';
import { RECORRIDOS, recorrido, toquesDe, maximoDe, TIPOS_DE_ACCION, demasiadoLargos } from './experienciaReal';
import { MICROINTERACCIONES, microinteraccion, noExisten } from './microinteracciones';
import { ACCESOS_DISPONIBLES, accesoRapido } from './pantallaEH';
import { CATALOGO_PAPELERA, RETENCION_PAPELERA_DIAS } from './papelera';
import { ACCIONES_POSIBLES } from './contextual';
import { proponer, puedeLaIA } from './iaEstilo';
import { DURACION_FEEDBACK_MS } from './estadosEstilo';

/* ===========================================================================
   1 · LAS ACCIONES QUE MÁS SE USAN (apartado 1)
   =========================================================================== */

export const ACCIONES = [
  { id: 'anadir', icono: '➕', nombre: 'Añadir', reversible: true, confirma: false },
  { id: 'guardar', icono: '💾', nombre: 'Guardar', reversible: true, confirma: false },
  { id: 'favorito', icono: '❤️', nombre: 'Marcar favorito', reversible: true, confirma: false },
  { id: 'completar', icono: '✅', nombre: 'Completar', reversible: true, confirma: false },
  { id: 'ocultar', icono: '🙈', nombre: 'Ocultar', reversible: true, confirma: false },
  { id: 'buscar', icono: '🔍', nombre: 'Buscar', reversible: true, confirma: false },
  { id: 'abrir', icono: '📂', nombre: 'Abrir', reversible: true, confirma: false },
  {
    /* ⚠️ Compartir está en la lista del enunciado, y **no existe** (F59). Se
       queda con su marca en vez de desaparecer de la lista sin explicación. */
    id: 'compartir', icono: '📤', nombre: 'Compartir', reversible: true, confirma: false, existe: false,
    porque: 'JC Fitness no tiene sistema de compartición. Lo que hay es exportar Mis datos, y lo lanza él.',
  },
  { id: 'recuperar', icono: '♻️', nombre: 'Recuperar', reversible: true, confirma: false },
  /* 🚨 La única que confirma: la que no tiene vuelta atrás (apartado 11). */
  {
    id: 'eliminar_definitivo', icono: '🗑️', nombre: 'Eliminar definitivamente',
    reversible: false, confirma: true,
  },
];

export const accionRapida = (id) => ACCIONES.find((a) => a.id === id) || null;
export const accionesQueExisten = () => ACCIONES.filter((a) => a.existe !== false);

/** 🚨 Decisión 4 — solo confirma lo que no se puede deshacer. */
export const lasQueConfirman = () => ACCIONES.filter((a) => a.confirma).map((a) => a.id);

/* ===========================================================================
   2 · DÓNDE APARECEN (apartados 2, 3 y 7)
   ===========================================================================
   *"Las acciones más importantes pueden aparecer directamente en la pantalla
   principal, sin obligar a entrar en el módulo."* */

export const EN_LA_PORTADA = {
  /* ⚠️ Ya existen desde la **F29**: son los accesos rápidos, y los elige él. */
  son: 'Los accesos rápidos de la F29 (⚡), que él enciende y ordena.',
  cuantos: ACCESOS_DISPONIBLES.length,
  /* 🚨 Apartado 3 — *"no mostrar veinte opciones"*. */
  maxVisibles: 4,
  eligeEl: true,
};

/** Apartado 3 — lo que el botón + ofrece **de Estilo de hombre**, y nada más. */
export const BOTON_MAS = [
  { id: 'perfume', icono: '🌫️', nombre: 'Perfume', modulo: 'perfumes' },
  { id: 'producto', icono: '🧴', nombre: 'Producto', modulo: 'skincare' },
  { id: 'preferencia', icono: '⚙️', nombre: 'Preferencia', modulo: null },
  { id: 'nota', icono: '📝', nombre: 'Nota', modulo: 'gustos' },
];

export const MAX_BOTON_MAS = 4;

/* ===========================================================================
   3 · LAS ACCIONES DE CADA COSA (apartado 4) — decisión 3
   ===========================================================================
   *"Mostrar las acciones que realmente tienen sentido para ese elemento."* */

export const ACCIONES_POR_ELEMENTO = {
  perfume: ['favorito', 'editar', 'eliminar'],
  producto: ['favorito', 'editar', 'eliminar'],
  rutina: ['completar', 'editar', 'eliminar'],
  registro: ['editar', 'eliminar'],
  modulo: ['abrir', 'ocultar', 'desactivar'],
  idea: ['guardar', 'no_interesa'],
  eliminado: ['recuperar', 'eliminar_definitivo'],
};

/** ⚠️ Lo que NO se enseña en un elemento pequeño, aunque exista en la app. */
export const NO_EN_UN_ELEMENTO = ['objetivo', 'tarea', 'compartir'];

export function accionesDe(tipo) {
  return ACCIONES_POR_ELEMENTO[tipo] || [];
}

/** 🚨 La comprobación del apartado 4: ninguna ficha ofrece ruido. */
export const conRuido = () => Object.entries(ACCIONES_POR_ELEMENTO)
  .filter(([, lista]) => lista.some((a) => NO_EN_UN_ELEMENTO.includes(a)))
  .map(([tipo]) => tipo);

/* ===========================================================================
   4 · LOS GESTOS QUE NO HAY (apartados 5, 6 y 16) — 🚨 decisión 1
   =========================================================================== */

export const GESTOS = [
  {
    id: 'deslizar', apartado: 5, nombre: 'Deslizar', existe: false,
    porque: 'La F50 ya lo decidió: las acciones viven en botones visibles. Un gesto oculto que es la única forma de hacer algo no es rápido, es escondido.',
    alternativa: 'Los botones de la propia ficha.',
  },
  {
    id: 'mantener', apartado: 6, nombre: 'Mantener pulsado', existe: false,
    porque: 'Igual: mover una plaquita se hace con flechas ↑↓, que funcionan con el lector de pantalla y no dependen del pulso.',
    alternativa: 'Las flechas de Personalizar, y el menú de la ficha.',
  },
];

export const gesto = (id) => GESTOS.find((g) => g.id === id) || null;

/**
 * 🚨 Apartado 16 — *"debe existir una alternativa visible"*. Aquí se cumple de
 * la forma más fuerte posible: **la alternativa visible es la única forma**, así
 * que no hay ninguna acción que dependa de un gesto.
 */
export const REGLA_SIN_GESTOS = 'Ninguna acción de Estilo de hombre necesita un gesto. Todas están en un botón que se ve y se puede leer en voz alta.';

export const accionesQueDependenDeUnGesto = () => GESTOS.filter((g) => g.existe).map((g) => g.id);

/* ===========================================================================
   5 · DESDE UNA RECOMENDACIÓN O UN INSIGHT (apartados 8 y 9)
   ===========================================================================
   *"Una recomendación no debe terminar en 'Vale'."* */

export const DESDE_RECOMENDACION = ACCIONES_POSIBLES;

export const DESDE_INSIGHT = [
  { id: 'revisar', icono: '👀', etiqueta: 'Revisar', lleva: 'al apartado del insight' },
  { id: 'ocultar', icono: '🙈', etiqueta: 'Ocultar', lleva: null },
];

/** 🚨 Apartado 8 — que no termine en "Vale": tiene que ofrecer algo que hacer. */
export const terminaEnVale = (acciones) => !Array.isArray(acciones) || acciones.length === 0;

/* ===========================================================================
   6 · LAS ACCIONES GLOBALES (apartado 10)
   ===========================================================================
   *"No crear 'Tareas de Estilo'. Debe ser: Tareas de JC Fitness."* */

export const ACCIONES_GLOBALES = [
  { id: 'tarea', de: 'Productividad', aqui: 'solo su id' },
  { id: 'objetivo', de: 'Objetivos', aqui: 'solo su id' },
  { id: 'evento', de: 'Calendario', aqui: 'nada: se deriva' },
  { id: 'eliminar', de: 'Papelera global', aqui: 'nada: la papelera es la de ME F3' },
];

export const CREA_SISTEMA_PROPIO = false;

/* ===========================================================================
   7 · CONFIRMAR, DESHACER Y EN LOTE (apartados 11, 12 y 13) — decisiones 4 y 5
   =========================================================================== */

export const TEXTOS_ACCIONES = {
  hecho: 'Hecho',
  eliminado: 'Elemento eliminado',
  deshacer: 'Deshacer',
  sinConfirmar: 'Ocultar no pregunta: se deshace con el mismo toque.',
  confirmando: 'Eliminar definitivamente sí pregunta: no tiene vuelta atrás.',
};

/* 🚨 Decisión 5 — lo que el enunciado pide y aquí NO existe. */
export const PENDIENTES = [
  {
    apartado: 12, id: 'deshacer_rapido', que: 'El "Deshacer" de unos segundos',
    existe: false,
    loQueHay: `La papelera global, con ${RETENCION_PAPELERA_DIAS} días para recuperar cualquier cosa.`,
    porque: '🚨 La papelera aguanta treinta días en vez de cinco segundos, pero **cuesta tres toques en vez de uno**. No es lo mismo, y decir que "ya está cubierto" sería tapar un hueco real.',
  },
  {
    apartado: 13, id: 'lote', que: 'Seleccionar varios elementos y actuar sobre todos',
    existe: false,
    loQueHay: 'Cada elemento con sus acciones, de uno en uno.',
    porque: 'El propio apartado dice *"solo en módulos donde realmente aporte valor"*. Con listas de decenas de elementos —no de cientos— y una papelera que recupera lo borrado, todavía no aporta.',
  },
];

export const pendiente = (id) => PENDIENTES.find((p) => p.id === id) || null;

/* ===========================================================================
   8 · LA IA PROPONE, NO HACE (apartado 14)
   =========================================================================== */

export const IA_ACCIONES = {
  puede: 'Proponer una acción: "¿quieres guardar esta preferencia?".',
  /* 🚨 Y las cinco prohibidas de la F56, importadas. */
  noPuede: 'Ejecutarla. Ninguna acción se aplica sola.',
  como: 'proponer() de la F56, con "No guardar" por defecto.',
};

export const iaEjecutaAlgo = () => ['comprar', 'eliminar', 'cambiar_config', 'crear_objetivo', 'cambiar_preferencia']
  .filter((a) => puedeLaIA(a).puede);

/* ===========================================================================
   9 · QUE SE NOTE QUE HA PASADO (apartado 15)
   ===========================================================================
   *"Nunca dejar al usuario preguntándose: ¿lo ha hecho?"* */

export const RESPUESTA_INMEDIATA = {
  feedbackMs: DURACION_FEEDBACK_MS,
  /* ⚠️ Y las tres cosas que ya existen, de la F41 y la F50. */
  hay: ['el ✓ que aparece y se va', 'el estado de carga con tarjetas', 'el feedback al tocar de `ui.jsx`'],
  deLasFases: ['F41', 'F50'],
};

/* ===========================================================================
   10 · LA MEDIDA (apartado 17) — decisión 2
   ===========================================================================
   *"1–3 toques para acciones frecuentes."* */

export const OBJETIVO_TOQUES = 3;

/** ⚠️ Las frecuentes son las `diaria` de la F51. No hay una segunda lista. */
export const FRECUENTES = () => RECORRIDOS.filter((r) => r.tipo === 'diaria');

export const frecuentesQueSePasan = () => FRECUENTES()
  .filter((r) => r.pasos.length > OBJETIVO_TOQUES)
  .map((r) => ({ id: r.id, toques: r.pasos.length }));

/* ===========================================================================
   11 · LOS DIECISIETE APARTADOS
   =========================================================================== */

export const APARTADOS_ACCIONES = [
  { id: 1, nombre: 'Acciones rápidas principales', cumplido: true, donde: 'ACCIONES' },
  { id: 2, nombre: 'Acceso rápido', cumplido: true, donde: 'EN_LA_PORTADA — los accesos de la F29' },
  { id: 3, nombre: 'Botón +', cumplido: true, donde: 'BOTON_MAS — cuatro, no veinte' },
  { id: 4, nombre: 'Acciones contextuales', cumplido: true, donde: 'ACCIONES_POR_ELEMENTO · conRuido()' },
  { id: 5, nombre: 'Deslizar', cumplido: false, donde: 'GESTOS — no existe, y el apartado 16 explica por qué' },
  { id: 6, nombre: 'Mantener pulsado', cumplido: false, donde: 'GESTOS — igual' },
  { id: 7, nombre: 'Atajos', cumplido: true, donde: 'ACCESOS_DISPONIBLES (F29)' },
  { id: 8, nombre: 'Acciones desde recomendaciones', cumplido: true, donde: 'DESDE_RECOMENDACION (F60)' },
  { id: 9, nombre: 'Acciones desde insights', cumplido: true, donde: 'DESDE_INSIGHT (F58)' },
  { id: 10, nombre: 'Acciones globales', cumplido: true, donde: 'ACCIONES_GLOBALES · CREA_SISTEMA_PROPIO = false' },
  { id: 11, nombre: 'Confirmaciones', cumplido: true, donde: 'lasQueConfirman() — solo la irreversible' },
  { id: 12, nombre: 'Deshacer', cumplido: false, donde: 'PENDIENTES · deshacer_rapido' },
  { id: 13, nombre: 'Acciones en lote', cumplido: false, donde: 'PENDIENTES · lote' },
  { id: 14, nombre: 'Acciones inteligentes', cumplido: true, donde: 'IA_ACCIONES · iaEjecutaAlgo()' },
  { id: 15, nombre: 'Velocidad', cumplido: true, donde: 'RESPUESTA_INMEDIATA (F41 y F50)' },
  { id: 16, nombre: 'Accesibilidad', cumplido: true, donde: 'REGLA_SIN_GESTOS' },
  { id: 17, nombre: 'Prueba de toques', cumplido: true, donde: 'FRECUENTES() — los recorridos de la F51' },
];

export const apartadoAccion = (id) => APARTADOS_ACCIONES.find((a) => a.id === id) || null;

export const CONDICION = 'Ver → decidir → actuar, sin navegar innecesariamente. Rápida, pero nunca confusa.';

/* ===========================================================================
   12 · EL PARTE
   =========================================================================== */

export function auditarAcciones() {
  return {
    acciones: ACCIONES.length,
    // 🚨 Decisión 4 — solo confirma la que no tiene vuelta atrás.
    confirman: lasQueConfirman(),
    confirmanReversibles: ACCIONES.filter((a) => a.confirma && a.reversible).map((a) => a.id),
    // Decisión 3 — ninguna ficha con ruido.
    conRuido: conRuido(),
    // 🚨 Decisión 1 — ninguna acción depende de un gesto.
    dependenDeUnGesto: accionesQueDependenDeUnGesto(),
    gestosQueNoExisten: GESTOS.filter((g) => !g.existe).map((g) => g.id),
    sinAlternativa: GESTOS.filter((g) => !g.existe && !g.alternativa).map((g) => g.id),
    // Decisión 2 — el objetivo de toques, medido con la F51.
    frecuentes: FRECUENTES().length,
    sePasan: frecuentesQueSePasan(),
    // Apartado 3 — el botón + no enseña veinte cosas.
    botonMasSeVaDeMadre: BOTON_MAS.length > MAX_BOTON_MAS,
    // Apartado 10 — ni un sistema propio.
    creaSistemaPropio: CREA_SISTEMA_PROPIO,
    // Apartado 14 — la IA no ejecuta nada.
    iaEjecuta: iaEjecutaAlgo(),
    // Decisión 5 — lo que falta, con su motivo.
    pendientes: PENDIENTES.map((p) => p.apartado),
    pendientesSinMotivo: PENDIENTES.filter((p) => !p.porque || !p.loQueHay).map((p) => p.id),
    sinDonde: APARTADOS_ACCIONES.filter((a) => !a.donde).map((a) => a.id),
    sinCumplir: APARTADOS_ACCIONES.filter((a) => !a.cumplido).map((a) => a.id),
  };
}

export function panelAcciones() {
  const a = auditarAcciones();
  return {
    ...a,
    accionesLista: ACCIONES,
    porElemento: ACCIONES_POR_ELEMENTO,
    gestos: GESTOS,
    botonMas: BOTON_MAS,
    globales: ACCIONES_GLOBALES,
    pendientesLista: PENDIENTES,
    apartados: APARTADOS_ACCIONES,
    /* 🎯 El veredicto: **ver, decidir y actuar sin dar vueltas**. */
    rapidaYClara: a.confirmanReversibles.length === 0
      && a.conRuido.length === 0
      && a.dependenDeUnGesto.length === 0
      && a.sinAlternativa.length === 0
      && a.sePasan.length === 0
      && !a.botonMasSeVaDeMadre
      && !a.creaSistemaPropio
      && a.iaEjecuta.length === 0
      && a.pendientesSinMotivo.length === 0
      && a.sinDonde.length === 0,
    condicion: CONDICION,
  };
}

export { RECORRIDOS, recorrido, toquesDe, maximoDe, TIPOS_DE_ACCION, demasiadoLargos,
  MICROINTERACCIONES, microinteraccion, noExisten, ACCESOS_DISPONIBLES, accesoRapido,
  CATALOGO_PAPELERA, RETENCION_PAPELERA_DIAS, proponer, puedeLaIA, DURACION_FEEDBACK_MS,
  normalizarEstiloHombre, moduloEH, IDS_EH };
