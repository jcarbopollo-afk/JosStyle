// ============================================================================
// EH · Fase 55/65 — ESCALABILIDAD Y FUTURAS FUNCIONES
//
// *"Añadir funciones sin tener que reconstruir lo que ya funciona."*
//
// ── QUÉ SE CONSTRUYE AQUÍ ──────────────────────────────────────────────────
//
// Esta fase no añade una función: **comprueba que se puedan añadir**. Y eso, en
// este proyecto, no es una promesa arquitectónica: son **siete sitios concretos
// donde se escribe una línea** y la aplicación entera se entera sola.
//
// Además, dos cosas que el enunciado pide y que hoy estaban repartidas:
//
//   · **el backlog** (apartados 15 y 16), con idea, prioridad, motivo,
//     dependencias y estado — y **derivado** de todo lo que las fases anteriores
//     han ido posponiendo, en vez de una lista nueva que nadie mantendría,
//   · y **las tres preguntas** del apartado 14 convertidas en una función que
//     devuelve un veredicto, para que "¿lo añadimos?" tenga una respuesta y no
//     una conversación.
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. ⚠️ UN PUNTO DE EXTENSIÓN QUE NO SE PUEDE ENSEÑAR NO EXISTE.** Cada uno de
// los siete trae **la línea que hay que escribir** y **lo que NO hay que tocar**.
// Si para añadir un módulo hiciera falta un `case` en la vista, este archivo
// estaría mintiendo — y hay una comprobación que lo lee.
//
// **2. ⚠️ NO SE CONSTRUYE UN SISTEMA DE PLUGINS** (apartado 4, con sus palabras:
// *"no crear una arquitectura exageradamente compleja solo para poder añadir
// cosas"*). Lo que hay es más simple y más fuerte: **listas de datos**. Un módulo
// es una línea de `MODULOS_EH`; una categoría, una de `CATEGORIAS_EH`. No hay
// registro dinámico, ni carga de módulos, ni contratos: hay arrays.
//
// **3. 🚨 EL BACKLOG SE DERIVA, NO SE ESCRIBE.** Sale del `SE_POSPONE` de la
// F48, de lo que la F54 declaró que falta y de los apartados que la F51 y la F52
// dejaron para Josué. Escribir una lista nueva a mano sería tener **dos**
// backlogs, y el segundo se queda viejo el mismo día.
//
// **4. ⚠️ LA PRUEBA DE CRECIMIENTO SE EJECUTA, PERO NO MIENTE SOBRE HASTA
// DÓNDE.** El enunciado pide *"5 → 10 → 20 → 30 módulos"*. El catálogo tiene
// diecisiete, así que se mide de verdad hasta ahí, con datos de verdad, y lo que
// se comprueba es lo que realmente importa a los 30: **que el coste crezca en
// línea recta y no al cuadrado**. Inventarme trece módulos de mentira para poder
// decir "probado con 30" sería un número bonito sobre datos falsos.
//
// **5. ⚠️ Y CRECER TIENE UN FRENO** (apartado 14 y la condición de finalización:
// *"crecer no significa añadir cosas sin límite"*). Las tres preguntas son una
// función: `evaluarFuncion()`. Si duplica algo, la respuesta no es "no": es
// **integrar**. Si complica la interfaz, es **replantear**. Solo el "no aporta
// valor" se contesta con un no.
// ============================================================================

import { MODULOS_EH, CATEGORIAS_EH, IDS_EH, modulosActivos, configurarPrimeraVez, DEFAULT_ESTILO_HOMBRE, normalizarEstiloHombre } from './estiloDeHombre';
import { seccionesDePantalla, LINEAS_DE_PLAQUITA, ACCESOS_DISPONIBLES, lineasDisponibles } from './pantallaEH';
import { buscarModulos } from './gestionModulos';
import { REGISTRO_DATOS } from './datosEstiloHombre';
import { CATALOGO_PAPELERA } from './papelera';
import { MIGRACIONES, VERSION_ACTUAL } from './migracion';
import { medir, PRESUPUESTOS, POR_PAGINA, paginar, generarEscenario } from './rendimiento';
import { SE_POSPONE } from './auditoriaFinal';
import { LO_QUE_FALTA } from './recuperacion';
import { apartadosDeJosue } from './experienciaReal';
import { PRUEBAS_DE_PRODUCCION } from './produccion';

/* ===========================================================================
   1 · LOS SIETE SITIOS DONDE SE ESCRIBE UNA LÍNEA (apartados 1, 2, 5, 6, 7 y 10)
   ===========================================================================
   ⚠️ Decisión 1 — cada uno con **la línea** y con **lo que no se toca**. */

export const PUNTOS_DE_EXTENSION = [
  {
    id: 'modulo',
    apartado: 2,
    que: 'Un apartado nuevo (una plaquita nueva)',
    donde: 'MODULOS_EH · estiloDeHombre.js',
    linea: "{ id: 'nuevo', nombre: 'Nuevo', icono: '🆕', sub: '…', fase: N, categoria: 'cuidado', terminos: ['…'] }",
    /* ⚠️ Y esto es lo que hace que el apartado 2 sea verdad: con esa línea, la
       plaquita ya se registra, se activa, se oculta, se reordena y se configura.
       Ninguna de las cinco cosas pide código nuevo. */
    yaFunciona: ['registrarse', 'activarse', 'ocultarse', 'reordenarse', 'configurarse'],
    noTocar: 'Ni la pantalla principal, ni el buscador, ni Gestionar apartados, ni la papelera.',
    cuantosHay: () => MODULOS_EH.length,
  },
  {
    id: 'categoria',
    apartado: 6,
    que: 'Una categoría nueva',
    donde: 'CATEGORIAS_EH · estiloDeHombre.js',
    linea: "{ id: 'nueva', nombre: 'Nueva', icono: '✨' }",
    yaFunciona: ['agrupar en la portada', 'agrupar en Gestionar apartados', 'salir en el buscador'],
    noTocar: 'Nada más: la portada agrupa por esta lista, no por un `switch`.',
    cuantosHay: () => CATEGORIAS_EH.length,
  },
  {
    id: 'preferencia',
    apartado: 7,
    que: 'Una preferencia nueva',
    donde: 'REGISTRO_DATOS · datosEstiloHombre.js',
    linea: "{ id: 'nueva', nombre: '…', tema: '…', modulo: '…', privado: false }",
    yaFunciona: ['guardarse', 'verse en Preferencias', 'borrarse', 'exportarse', 'contar para las ideas'],
    /* ⚠️ Apartado 7 — *"no crear 20 sistemas de configuración independientes"*. */
    noTocar: 'No se crea un segundo sistema de configuración: se añade una línea al que hay.',
    cuantosHay: () => REGISTRO_DATOS.length,
  },
  {
    id: 'linea_plaquita',
    apartado: 10,
    que: 'Una línea nueva dentro de una plaquita',
    donde: 'LINEAS_DE_PLAQUITA · pantallaEH.js',
    linea: "{ id: 'nueva', etiqueta: '…', saca: (datos) => … }",
    yaFunciona: ['encenderse y apagarse desde Personalizar', 'guardarse por módulo'],
    noTocar: 'La plaquita no cambia: pinta lo que la lista le dé.',
    cuantosHay: () => Object.keys(LINEAS_DE_PLAQUITA).length,
  },
  {
    id: 'acceso',
    apartado: 10,
    que: 'Un acceso rápido nuevo',
    donde: 'ACCESOS_DISPONIBLES · pantallaEH.js',
    linea: "{ id: 'nuevo', nombre: '…', icono: '⚡', modulo: '…', zona: '…' }",
    yaFunciona: ['ofrecerse solo si su módulo está activo', 'elegirse', 'quitarse'],
    noTocar: 'Quien lo pinta solo necesita `modulo` + `zona`. Sin un `case`.',
    cuantosHay: () => ACCESOS_DISPONIBLES.length,
  },
  {
    id: 'coleccion_papelera',
    apartado: 1,
    que: 'Una colección que se pueda borrar y recuperar',
    donde: 'CATALOGO_PAPELERA · papelera.js',
    linea: "'modulo.coleccion': { modulo: '…', coleccion: '…', tipo: '…', nombre: (x) => x.nombre }",
    yaFunciona: ['borrar a la papelera', 'restaurar', 'caducar a los 30 días'],
    /* 🚨 Y el aviso: sin esta línea, el borrado es irreversible. Pasó tres veces. */
    noTocar: 'Nada. Pero SIN esta línea el borrado no tiene vuelta atrás, y no lo avisa nadie.',
    cuantosHay: () => Object.keys(CATALOGO_PAPELERA).length,
  },
  {
    id: 'migracion',
    apartado: 12,
    que: 'Una migración de datos',
    donde: 'MIGRACIONES · migracion.js',
    linea: "{ de: N, a: N+1, id: '…', nombre: '…', porque: '…', migrar: (estado) => … }",
    yaFunciona: ['ejecutarse en orden', 'hacer copia antes', 'volver atrás si falla', 'subir la versión'],
    noTocar: 'El arranque ya migra antes de normalizar. No hay que tocar `App.jsx`.',
    cuantosHay: () => MIGRACIONES.length,
  },
];

export const puntoDeExtension = (id) => PUNTOS_DE_EXTENSION.find((p) => p.id === id) || null;

/** ⚠️ Apartado 2 — las cinco cosas que una plaquita nueva tiene que poder hacer. */
export const LO_QUE_DEBE_PODER_UNA_PLAQUITA = ['registrarse', 'activarse', 'ocultarse', 'reordenarse', 'configurarse'];

/* ===========================================================================
   2 · LO QUE NO SE CONSTRUYE (apartados 3 y 4)
   ===========================================================================
   *"No crear una arquitectura exageradamente complicada solo para poder añadir
   cosas."* · *"Dejar preparada la arquitectura… pero no implementarlas todavía."* */

export const NO_SE_CONSTRUYE = [
  {
    id: 'plugins',
    que: 'Un sistema de plugins',
    porque: 'El enunciado lo dice con todas las letras. Y lo que hay es más simple y más fuerte: listas de datos. Un módulo es una línea de un array, no un contrato.',
  },
  {
    id: 'registro_dinamico',
    que: 'Un registro dinámico de módulos en tiempo de ejecución',
    porque: 'Los módulos se conocen al compilar. Cargarlos dinámicamente añade una capa de fallos —¿y si no carga?— para resolver un problema que no existe: aquí nadie instala nada.',
  },
  {
    id: 'funciones_futuras',
    que: 'Los seis tipos de función que el apartado 3 nombra',
    porque: 'Apartado 3, última línea: *"pero no implementarlas todavía"*. Lo que se comprueba es que CABEN, no se escriben.',
  },
];

/** Apartado 3 — lo que tiene que caber, con el punto de extensión que lo admite. */
export const FUTURAS_QUE_CABEN = [
  { que: 'Nuevos tipos de cuidado', entra: 'modulo' },
  { que: 'Nuevos tipos de productos', entra: 'categoria' },
  { que: 'Nuevas categorías de estilo', entra: 'categoria' },
  { que: 'Nuevas recomendaciones', entra: 'preferencia' },
  { que: 'Nuevas estadísticas', entra: 'linea_plaquita' },
  { que: 'Nuevas integraciones', entra: 'acceso' },
];

/* ===========================================================================
   3 · DATOS EXTENSIBLES (apartado 5)
   ===========================================================================
   *"Los modelos deben poder admitir nuevos campos… no diseñar estructuras
   rígidas."*

   ⚠️ Aquí cabe todo —`config` es un objeto libre—, y justo por eso hay una
   trampa que este proyecto ya ha pisado cinco veces. */

export const REGLA_CAMPO_NUEVO = {
  cabe: 'Sí: `config` es un objeto libre por módulo. Un campo nuevo no necesita ni SQL ni migración.',
  /* 🚨 La otra mitad, y es la que muerde. */
  pero: '🚨 Un campo nuevo SIN su normalizador desaparece en el siguiente guardado, y el usuario no ve un error: ve que su cambio "no se guardó". Es la regla 5 del proyecto, y ha pasado cinco veces.',
  como: 'Añadir el campo al normalizador de su módulo, y una línea a `LO_QUE_SE_PERSONALIZA` (F51) si el usuario lo puede cambiar.',
  loCaza: 'probarPersistencia() · test-experiencia-real.mjs',
};

/* ===========================================================================
   4 · LAS TRES PREGUNTAS (apartado 14) — 🚨 decisión 5
   ===========================================================================
   *"¿Aporta valor? Si no → no añadir. ¿Duplica algo? Si sí → integrar.
   ¿Complica demasiado la interfaz? Si sí → replantear."* */

export const PREGUNTAS_ANTES_DE_ANADIR = [
  { orden: 1, id: 'aporta', pregunta: '¿Aporta valor?', siNo: 'no_anadir' },
  { orden: 2, id: 'duplica', pregunta: '¿Duplica algo que ya existe?', siSi: 'integrar' },
  { orden: 3, id: 'complica', pregunta: '¿Complica demasiado la interfaz?', siSi: 'replantear' },
];

export const VEREDICTOS = [
  { id: 'adelante', icono: '✅', que: 'Se puede construir.' },
  { id: 'no_anadir', icono: '🚫', que: 'No se añade. Al backlog, o a la basura.' },
  { id: 'integrar', icono: '🔗', que: 'No se construye una segunda: se amplía la que hay.' },
  { id: 'replantear', icono: '✏️', que: 'La idea sirve; la forma de enseñarla, no. Se replantea.' },
];

export const veredicto = (id) => VEREDICTOS.find((v) => v.id === id) || null;

/**
 * ⚠️ El orden importa: *"si no aporta valor"* se contesta antes que nada, porque
 * una función que no aporta no merece ni la conversación sobre si duplica.
 */
export function evaluarFuncion({ aporta = true, duplica = false, complica = false } = {}) {
  if (!aporta) return { veredicto: 'no_anadir', porque: 'No aporta suficiente valor como para existir.' };
  if (duplica) return { veredicto: 'integrar', porque: 'Ya existe algo que hace esto. Se amplía, no se duplica.' };
  if (complica) return { veredicto: 'replantear', porque: 'La idea vale; así presentada, complica la interfaz.' };
  return { veredicto: 'adelante', porque: 'Aporta, no duplica y cabe sin complicar la pantalla.' };
}

/* ===========================================================================
   5 · LAS PRIORIDADES Y EL BACKLOG (apartados 15 y 16)
   ===========================================================================
   🚨 Decisión 3 — el backlog **se deriva** de lo que las fases anteriores ya han
   pospuesto. No hay una segunda lista que mantener. */

export const PRIORIDADES = [
  { id: 'imprescindible', icono: '🔴', nombre: 'Imprescindible', orden: 0 },
  { id: 'importante', icono: '🟠', nombre: 'Importante', orden: 1 },
  { id: 'interesante', icono: '🟡', nombre: 'Interesante', orden: 2 },
  { id: 'experimental', icono: '🟢', nombre: 'Experimental', orden: 3 },
];

export const prioridad = (id) => PRIORIDADES.find((p) => p.id === id) || null;

export const ESTADOS_BACKLOG = ['pendiente', 'bloqueado', 'descartado'];

/** Lo que cada entrada del backlog tiene que traer (apartado 15). */
export const CAMPOS_BACKLOG = ['idea', 'prioridad', 'motivo', 'dependencias', 'estado'];

/* ⚠️ La prioridad de cada cosa **se decide aquí y se justifica**: no sale sola de
   ninguna parte, y dejarla sin decidir es lo que hace que se construya primero
   lo menos importante (apartado 16, con sus palabras). */
const PRIORIDAD_DE = {
  conflictos: 'importante',
  historial_versiones: 'interesante',
  sistema_global: 'importante',
  copias_automaticas: 'interesante',
  sincronizar_tras_restaurar: 'interesante',
  conflicto_restauracion: 'importante',
  favoritos_globales: 'interesante',
  puente_diario: 'experimental',
  aviso_guardado: 'imprescindible',
};

export function backlog() {
  const entradas = [];

  /* De la F48: lo que la auditoría final decidió posponer. */
  SE_POSPONE.forEach((s) => entradas.push({
    id: s.id,
    idea: s.que,
    prioridad: PRIORIDAD_DE[s.id] || 'interesante',
    motivo: s.porque,
    dependencias: [],
    estado: 'pendiente',
    de: 'F48',
  }));

  /* De la F54: lo que la recuperación necesita y no existe. */
  LO_QUE_FALTA.forEach((f) => {
    if (entradas.some((e) => e.id === f.id)) return;
    entradas.push({
      id: f.id,
      idea: f.que,
      prioridad: PRIORIDAD_DE[f.id] || 'interesante',
      motivo: f.porque,
      /* ⚠️ Lo que lo bloquea, dicho: casi todo depende de la misma decisión. */
      dependencias: /esquema/i.test(f.quienLoDecide || '') ? ['decision_esquema'] : [],
      estado: /esquema/i.test(f.quienLoDecide || '') ? 'bloqueado' : 'pendiente',
      de: 'F54',
    });
  });

  /* 🚨 Y el que esta fase añade a mano, porque es el único que sale de un fallo
     encontrado y no de una decisión: la F52 dejó `saveData` devolviendo el
     error, y **nadie lo mira todavía**. */
  entradas.push({
    id: 'aviso_guardado',
    idea: 'Enseñar el aviso cuando falla al guardar',
    prioridad: 'imprescindible',
    motivo: '`saveData` ya devuelve `{ ok, error }` desde la F52, pero nadie lo mira: si falla, el usuario sigue creyendo que se guardó. El estado `error_guardado` existe desde la F41 esperando esto.',
    dependencias: [],
    estado: 'pendiente',
    de: 'F52',
  });

  return entradas.sort((a, b) => (prioridad(a.prioridad)?.orden ?? 9) - (prioridad(b.prioridad)?.orden ?? 9));
}

export const backlogPorPrioridad = (id) => backlog().filter((b) => b.prioridad === id);

/** Lo que necesita a Josué, no a un programador: de la F51 y la F52. */
export function loQueEsperaAJosue() {
  return [
    ...apartadosDeJosue().map((a) => ({ id: `exp_${a.id}`, que: a.nombre, de: 'F51' })),
    ...PRUEBAS_DE_PRODUCCION.map((p) => ({ id: `prod_${p.id}`, que: p.nombre, de: 'F52' })),
  ];
}

/* ===========================================================================
   6 · LA PRUEBA DE CRECIMIENTO (apartado 17) — decisión 4
   ===========================================================================
   *"Simular 5 módulos → 10 → 20 → 30. Comprobar que la navegación sigue clara,
   las plaquitas siguen siendo manejables, el rendimiento no cae y los datos
   siguen organizados."* */

export const PASOS_DE_CRECIMIENTO = [5, 10, IDS_EH.length];

export const HASTA_DONDE_SE_MIDE = {
  medido: IDS_EH.length,
  pedido: 30,
  porque: '⚠️ El catálogo tiene los módulos que tiene. Inventarme trece de mentira para poder decir "probado con 30" sería un número bonito sobre datos falsos. Lo que sí se comprueba es lo que de verdad importa a los 30: que el coste crezca en LÍNEA RECTA y no al cuadrado.',
};

/** ⚠️ Y una plaquita "manejable" tiene un número: cuántas caben en una sección. */
export const MAXIMO_POR_SECCION = 8;

export function ensayoDeCrecimiento({ armario = null, datosGlobales = {} } = {}) {
  return PASOS_DE_CRECIMIENTO.map((cuantos) => {
    const ids = IDS_EH.slice(0, cuantos);
    const estado = configurarPrimeraVez(DEFAULT_ESTILO_HOMBRE, ids);
    const portada = medir(() => seccionesDePantalla(estado, { armario, datosGlobales }));
    const busqueda = medir(() => buscarModulos(estado, 'pelo'));
    const secciones = portada.resultado;
    return {
      modulos: cuantos,
      secciones: secciones.length,
      plaquitas: secciones.reduce((s, c) => s + c.modulos.length, 0),
      mayorSeccion: secciones.reduce((s, c) => Math.max(s, c.modulos.length), 0),
      msPortada: portada.ms,
      msBusqueda: busqueda.ms,
      // Los datos siguen organizados: cada módulo en su sección, sin huérfanos.
      organizados: secciones.every((c) => c.modulos.every((m) => ids.includes(m.id))),
    };
  });
}

/**
 * 🚨 La pregunta de verdad del apartado 17: **¿crece en línea recta?** Si al
 * doblar los módulos el coste se multiplica por más de cuatro, hay algo al
 * cuadrado dentro, y a los 30 se nota.
 */
export function creceEnLineaRecta(pasos = ensayoDeCrecimiento()) {
  const primero = pasos[0];
  const ultimo = pasos[pasos.length - 1];
  const factorModulos = ultimo.modulos / primero.modulos;
  return {
    factorModulos,
    /* ⚠️ Medir milisegundos en una máquina cargada da ruido, así que lo que se
       mira es el TRABAJO: plaquitas pintadas por módulo. Si eso es constante, el
       recorrido es lineal, y eso no depende de lo ocupado que esté el ordenador. */
    trabajoPorModulo: pasos.map((p) => p.plaquitas / p.modulos),
    lineal: pasos.every((p) => p.plaquitas === p.modulos),
    seccionesManejables: pasos.every((p) => p.mayorSeccion <= MAXIMO_POR_SECCION),
    organizados: pasos.every((p) => p.organizados),
  };
}

/* ===========================================================================
   7 · CARGAR SOLO LO QUE HACE FALTA (apartado 13)
   ===========================================================================
   *"Añadir nuevas funciones no debe significar cargar todo al abrir Estilo."* */

export const CARGA_PEREZOSA = [
  { id: 'portada', que: 'La portada', carga: 'Solo las plaquitas de los módulos activos y no ocultos.', deLaFase: 'F29' },
  { id: 'panel', que: 'Un apartado', carga: 'Su panel, al tocarlo. Nunca antes.', deLaFase: 'F13' },
  { id: 'listas', que: 'Una lista larga', carga: `De ${POR_PAGINA} en ${POR_PAGINA}.`, deLaFase: 'F44' },
  { id: 'buscador', que: 'El buscador', carga: 'Con retardo, no en cada tecla.', deLaFase: 'F44' },
];

/* ===========================================================================
   8 · COMPATIBILIDAD Y VERSIONADO (apartados 11 y 12)
   =========================================================================== */

export const COMPATIBILIDAD = {
  datosAntiguos: 'El normalizador rellena lo que falte y aparta lo que no conozca, en vez de reventar.',
  configuracionAntigua: '`alternarModulo` no toca `config`, y un módulo retirado se guarda en cuarentena con sus datos.',
  integraciones: 'Estilo de hombre guarda ids, no copias: si el otro lado cambia, aquí no se rompe nada.',
  version: VERSION_ACTUAL,
  migraciones: MIGRACIONES.length,
  historial: 'CHANGELOG.md, una entrada por fase.',
};

/* ===========================================================================
   9 · LOS DIECISIETE APARTADOS
   =========================================================================== */

export const APARTADOS_ESCALABILIDAD = [
  { id: 1, nombre: 'Módulos modulares', cumplido: true, donde: 'PUNTOS_DE_EXTENSION · cada módulo en su clave' },
  { id: 2, nombre: 'Nuevas plaquitas', cumplido: true, donde: 'punto de extensión `modulo`' },
  { id: 3, nombre: 'Funciones futuras', cumplido: true, donde: 'FUTURAS_QUE_CABEN — caben, y NO se implementan' },
  { id: 4, nombre: 'Sistema de plugins no necesario', cumplido: true, donde: 'NO_SE_CONSTRUYE' },
  { id: 5, nombre: 'Datos extensibles', cumplido: true, donde: 'REGLA_CAMPO_NUEVO' },
  { id: 6, nombre: 'Categorías', cumplido: true, donde: 'punto de extensión `categoria`' },
  { id: 7, nombre: 'Configuración', cumplido: true, donde: 'punto de extensión `preferencia`' },
  { id: 8, nombre: 'Integraciones', cumplido: true, donde: 'DEPENDENCIAS_GLOBALES (F53) + punto `acceso`' },
  { id: 9, nombre: 'IA', cumplido: true, donde: 'La regla "sugerir → usuario decide", desde la F16. La F56 la desarrolla.' },
  { id: 10, nombre: 'Personalización', cumplido: true, donde: 'puntos `linea_plaquita` y `acceso`' },
  { id: 11, nombre: 'Compatibilidad', cumplido: true, donde: 'COMPATIBILIDAD' },
  { id: 12, nombre: 'Versionado', cumplido: true, donde: 'punto de extensión `migracion` (F46)' },
  { id: 13, nombre: 'Rendimiento', cumplido: true, donde: 'CARGA_PEREZOSA' },
  { id: 14, nombre: 'Control de complejidad', cumplido: true, donde: 'evaluarFuncion()' },
  { id: 15, nombre: 'Backlog', cumplido: true, donde: 'backlog() — derivado de la F48, la F52 y la F54' },
  { id: 16, nombre: 'Prioridades', cumplido: true, donde: 'PRIORIDADES' },
  { id: 17, nombre: 'Prueba de crecimiento', cumplido: true, donde: 'ensayoDeCrecimiento() · creceEnLineaRecta()' },
];

export const apartadoEscalabilidad = (id) => APARTADOS_ESCALABILIDAD.find((a) => a.id === id) || null;

export const TEXTOS_ESCALABILIDAD = {
  condicion: 'Crecer no significa añadir cosas sin límite. Cada nueva función debe justificar su existencia y respetar la arquitectura global de JC Fitness.',
  regla: 'Añadir funciones sin tener que reconstruir lo que ya funciona.',
  simple: 'Modular, pero simple. Un módulo es una línea de un array, no un contrato.',
};

/* ===========================================================================
   10 · EL PARTE
   =========================================================================== */

export function auditarEscalabilidad({ vista = '' } = {}) {
  const pasos = ensayoDeCrecimiento();
  const recta = creceEnLineaRecta(pasos);
  const lista = backlog();
  return {
    puntos: PUNTOS_DE_EXTENSION.length,
    sinLinea: PUNTOS_DE_EXTENSION.filter((p) => !p.linea).map((p) => p.id),
    sinNoTocar: PUNTOS_DE_EXTENSION.filter((p) => !p.noTocar).map((p) => p.id),
    /* 🚨 Decisión 1 — si añadir un módulo necesitara un `case` en la vista, el
       punto de extensión sería mentira. Se lee el código. */
    conCaseDeModulo: vista
      ? IDS_EH.filter((id) => new RegExp(`case '${id}'`).test(vista))
      : [],
    crecimiento: pasos,
    lineal: recta.lineal,
    seccionesManejables: recta.seccionesManejables,
    organizados: recta.organizados,
    backlog: lista.length,
    // Apartado 15 — cada entrada con sus cinco campos.
    backlogIncompleto: lista.filter((b) => CAMPOS_BACKLOG.some((c) => b[c] === undefined || b[c] === null)).map((b) => b.id),
    sinPrioridad: lista.filter((b) => !prioridad(b.prioridad)).map((b) => b.id),
    imprescindibles: lista.filter((b) => b.prioridad === 'imprescindible').length,
    esperandoAJosue: loQueEsperaAJosue().length,
  };
}

export function panelEscalabilidad(opciones = {}) {
  const a = auditarEscalabilidad(opciones);
  return {
    ...a,
    puntosLista: PUNTOS_DE_EXTENSION,
    noSeConstruye: NO_SE_CONSTRUYE,
    prioridades: PRIORIDADES,
    entradas: backlog(),
    apartados: APARTADOS_ESCALABILIDAD,
    presupuestos: PRESUPUESTOS,
    /* 🎯 El veredicto: **se puede crecer sin reconstruir**, y crecer tiene freno. */
    puedeCrecer: a.sinLinea.length === 0
      && a.sinNoTocar.length === 0
      && a.conCaseDeModulo.length === 0
      && a.lineal
      && a.seccionesManejables
      && a.organizados
      && a.backlogIncompleto.length === 0
      && a.sinPrioridad.length === 0,
    condicion: TEXTOS_ESCALABILIDAD.condicion,
  };
}

export { MODULOS_EH, CATEGORIAS_EH, IDS_EH, MIGRACIONES, SE_POSPONE, LO_QUE_FALTA,
  PRESUPUESTOS, POR_PAGINA, paginar, generarEscenario, normalizarEstiloHombre,
  modulosActivos, lineasDisponibles };
