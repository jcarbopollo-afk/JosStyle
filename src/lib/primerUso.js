// ============================================================================
// EH · Fase 40/65 — PRIMER USO Y CONFIGURACIÓN INICIAL
//
// *"Nada de cuestionarios interminables. El usuario empieza con lo mínimo y va
// construyendo su espacio poco a poco."*
//
// Y la condición de finalización: *"Entrar → elegir lo que interesa → empezar.
// Y si no quiere configurar nada: **no pasa absolutamente nada**."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ LA MITAD DE ESTA FASE YA ESTABA CONSTRUIDA, Y NO SE REHACE.** La
// primera entrada (apartado 1), el *"¿qué te interesa?"* (2), el **Saltar** (3),
// la configuración progresiva (4), la pantalla resultante (6), el volver a
// configurar (9), el *"ahora no"* (12) y el volver más tarde (13) son
// `configuracionInicial.js` (F3), `estadoPantalla` (F1) y la entrada de tres
// plaquitas de la F30. Rehacerlas sería la cuarta lista que prohíbe D2-07. Aquí
// se **declaran** con `YA_CONSTRUIDO`, y hay pruebas que comprueban que siguen
// funcionando.
//
// **2. ⚠️ LO NUEVO ES EL TUTORIAL** (apartados 14 y 15): cuatro pantallas —
// plaquitas, personalización, conexiones y ocultar/desactivar—, **se puede
// saltar**, y **se recuerda** para no volver a enseñarlo. Se guarda el estado,
// no el contenido.
//
// **3. ⚠️ UNA IDEA. UNA.** (apartado 7: *"no bombardear. Como máximo: 💡 una
// idea para empezar. Y: Cerrar."*) Y **no se escribe un catálogo nuevo**: la
// idea sale de `descubrir()` (F33), que ya sabe qué módulos tiene encendidos.
// Cerrarla es local a la bienvenida: la tarjeta **sigue existiendo** en
// ✨ Descubrir, porque cerrar no es descartar.
//
// **4. ⚠️ APRENDER CON EL USO NO ACTIVA NADA** (apartado 8: *"pero no
// automáticamente activar nada"*). `sugerenciaPorUso()` mira lo que **de verdad
// usa** —no lo que tiene encendido— y propone; `aceptarSugerencia()` escribe
// **solo con `confirmado`**. Decimoctavo `aplicarPlan` del proyecto.
//
// **5. ⚠️ "AÑADIR A ESTILO" ES ACTIVAR EL MÓDULO QUE YA LO LEE** (apartados 10
// y 11: *"esto significa crear la referencia, **no duplicar los datos**"*). El
// armario lo lee `armarioEnEstiloHombre.js` desde la F5 y los datos globales los
// lee `leerDato()` desde la F4: no hay nada que importar, y por eso esta fase
// **no copia ni un campo**. Hay una prueba que lo comprueba comparando los dos
// almacenes antes y después.
//
// **6. ⚠️ NI UN PORCENTAJE, NI UNA TAREA PENDIENTE** (apartado 5: *"no
// utilizar 'tu perfil está al 20%'. No queremos que parezca una tarea
// pendiente."*). `auditarPrimerUso()` barre todos los textos de esta fase y de
// la F3 buscando porcentajes y palabras de deber.
// ============================================================================

import {
  normalizarEstiloHombre, guardarConfig, moduloEH, IDS_EH, MODULOS_EH, estadoPantalla,
} from './estiloDeHombre';
import { MODULO_ANFITRION } from './miEstilo';
import { activarModulo } from './gestionEstilo';
/* ⚠️ Decisión 1 — lo que ya existe se llama, no se rehace. */
import {
  estadoAsistente, iniciarAsistente, omitirAsistente, terminarAsistente,
  modificarConfiguracion, loQueYaSabemos, TEXTO_OMITIR,
} from './configuracionInicial';
/* ⚠️ Decisión 3 — la idea sale del catálogo que ya existe (F33). */
import { descubrir } from './descubrir';
/* Decisión 4 — "lo que de verdad usa" se le pregunta a cada módulo. */
import { datosPerfumes } from './perfumes';
import { accesorios as accesoriosDe, deseosAccesorios } from './accesorios';
import { datosGustos } from './gustos';
import { datosRutinasPiel } from './rutinasPiel';
import { datosPelo } from './rutinasPelo';
import { todayISO } from './helpers';

/* Una cuenta con su palabra en singular o plural. Cuatro líneas que evitan
   *"1 perfumes"*, que es de las cosas que hacen que algo parezca sin terminar. */
const cuenta = (n, singular, plural) => `${n} ${n === 1 ? singular : plural}`;

/* ===========================================================================
   1 · LO QUE YA ESTABA CONSTRUIDO (apartados 1-4, 6, 9, 12 y 13)
   ===========================================================================
   ⚠️ Una línea por apartado, con **la función de verdad** que lo resuelve. Es
   la misma idea que `SISTEMAS_EH` de la F39: si una fase futura borra una de
   ellas, esto deja de compilar. */

export const YA_CONSTRUIDO = [
  { apartado: 1, que: 'La primera entrada', donde: 'estadoPantalla', desde: 'EH F1' },
  { apartado: 2, que: '¿Qué te interesa?', donde: 'iniciarAsistente', desde: 'EH F3' },
  { apartado: 3, que: 'Saltar', donde: 'omitirAsistente', desde: 'EH F3' },
  { apartado: 4, que: 'Configuración progresiva', donde: 'activarModulo', desde: 'EH F1' },
  { apartado: 6, que: 'La pantalla resultante', donde: 'terminarAsistente', desde: 'EH F3' },
  { apartado: 9, que: 'Volver a configurar', donde: 'modificarConfiguracion', desde: 'EH F3' },
  { apartado: 12, que: 'Ahora no', donde: 'omitirAsistente', desde: 'EH F3' },
  { apartado: 13, que: 'Volver más tarde', donde: 'estadoAsistente', desde: 'EH F3' },
];

/* Las funciones reales, para que `YA_CONSTRUIDO` sea una comprobación y no una
   lista de nombres sueltos. */
const FUNCIONES_YA = {
  estadoPantalla, iniciarAsistente, omitirAsistente, terminarAsistente,
  modificarConfiguracion, activarModulo, estadoAsistente,
};

export const TEXTOS_PRIMER_USO = {
  titulo: '🧔 Estilo de hombre',
  sub: 'Tu espacio para cuidar tu imagen, descubrir tu estilo y organizar tus preferencias.',
  empezar: 'Empezar',
  ahoraNo: 'Ahora no',
  saltar: TEXTO_OMITIR,
  listo: 'Tu Estilo está listo.',
  /* Apartado 7 — una, y con su Cerrar. */
  ideaTitulo: '💡 Una idea para empezar',
  cerrar: 'Cerrar',
  /* Apartado 14 */
  comoFunciona: '❔ ¿Cómo funciona?',
  siguiente: 'Siguiente',
  saltarTutorial: 'Saltar',
  terminarTutorial: 'Entendido',
  repetir: 'Volver a verlo',
  /* Apartado 10 */
  yaTienes: 'Ya tienes información que podemos utilizar.',
  anadir: 'Añadir a Estilo',
  /* ⚠️ Apartado 11 — con todas las letras, para que nadie lo confunda. */
  sinDuplicar: 'No se copia nada: Estilo lo lee de donde ya está.',
  yaEsta: 'Ya lo estás usando aquí.',
  nadaQueTraer: 'Todavía no hay nada de otros apartados que traer.',
  /* Apartado 8 */
  sugerencia: '¿Quieres añadir',
  noGracias: 'No, gracias',
  /* Apartado 12 — y no se insiste. */
  sinPresion: 'Puedes dejarlo para otro día. No hace falta configurar nada.',
};

/* ===========================================================================
   2 · EL TUTORIAL (apartados 14 y 15)
   ===========================================================================
   *"Tutorial corto de máximo unas pocas pantallas: 1. Plaquitas.
   2. Personalización. 3. Conexiones con otros módulos. 4. Cómo
   ocultar/desactivar. Puede saltarlo."*

   ⚠️ Cada pantalla cuenta algo **que existe de verdad**: las plaquitas son las
   de la F30, personalizar es la F31, las conexiones son la F39 y ocultar frente
   a desactivar es la F36. Ni una promesa de algo que no esté hecho (regla 8). */

export const PANTALLAS_TUTORIAL = [
  {
    id: 'plaquitas',
    icono: '🧩',
    titulo: 'Cada cosa es una plaquita',
    texto: 'Lo que enciendas aparece aquí como una plaquita. La tocas y entras.',
  },
  {
    id: 'personalizar',
    icono: '⋮',
    titulo: 'Lo colocas como quieras',
    texto: 'En ⋮ Personalizar cambias el orden, el tamaño y qué se ve en cada una.',
  },
  {
    id: 'conexiones',
    icono: '🔗',
    titulo: 'Usa lo que ya tienes',
    texto: 'Tu armario, tu calendario, tus objetivos y tu diario son los de siempre. Aquí no se copian.',
  },
  {
    id: 'ocultar',
    icono: '👁️',
    titulo: 'Ocultar no es desactivar',
    texto: 'Ocultar lo quita de esta pantalla. Desactivar lo apaga. Ninguna de las dos borra nada.',
  },
];

export const IDS_TUTORIAL = PANTALLAS_TUTORIAL.map((p) => p.id);
export const pantallaTutorial = (id) => PANTALLAS_TUTORIAL.find((p) => p.id === id) || null;

/**
 * ⚠️ Apartado 15 — se guarda **si lo vio**, no lo que dice ni dónde va.
 *
 * Y **no hay un estado "viendo"**: que la pantalla esté abierta ahora mismo es
 * de la pantalla, como en el resto de Estilo de hombre. Guardarlo aquí tenía un
 * efecto feo — volver a verlo hacía que `tutorialVisto` dijera que no lo había
 * visto, justo mientras lo estaba viendo.
 */
export const ESTADOS_TUTORIAL = ['nunca', 'visto', 'saltado'];

export const DEFAULT_PRIMER_USO = {
  tutorial: 'nunca',
  paso: 0,
  /* La idea de la bienvenida que ya cerró (apartado 7). Un id, no la tarjeta. */
  ideaCerrada: null,
  /* Los módulos que ya se le ofrecieron y dijo que no (apartado 8). */
  ofrecidos: [],
  rechazados: [],
};

export function normalizarPrimerUso(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const tutorial = ESTADOS_TUTORIAL.includes(g.tutorial) ? g.tutorial : 'nunca';
  const paso = Number.isInteger(g.paso) && g.paso >= 0 && g.paso < PANTALLAS_TUTORIAL.length ? g.paso : 0;
  const soloModulos = (x) => (Array.isArray(x) ? x : []).filter((id) => IDS_EH.includes(id));
  return {
    tutorial,
    paso,
    ideaCerrada: typeof g.ideaCerrada === 'string' ? g.ideaCerrada : null,
    // ⚠️ Un módulo retirado del catálogo no revive (lección de la F2).
    ofrecidos: [...new Set(soloModulos(g.ofrecidos))],
    rechazados: [...new Set(soloModulos(g.rechazados))],
  };
}

export const datosPrimerUso = (estado) => {
  const e = normalizarEstiloHombre(estado);
  return normalizarPrimerUso(e.modulos.find((m) => m.id === MODULO_ANFITRION)?.config?.primerUso);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_ANFITRION, { primerUso: datos });

export const tutorialVisto = (estado) => ['visto', 'saltado'].includes(datosPrimerUso(estado).tutorial);

/**
 * Empezar por el principio. ⚠️ **No toca la memoria**: se puede volver a ver
 * siempre (prueba 12) y seguir constando como visto.
 */
export function verTutorial(estado) {
  return escribir(estado, { ...datosPrimerUso(estado), paso: 0 });
}

/** Avanzar. Al pasar de la última pantalla, queda **visto**. */
export function avanzarTutorial(estado) {
  const d = datosPrimerUso(estado);
  const siguiente = d.paso + 1;
  if (siguiente >= PANTALLAS_TUTORIAL.length) {
    return escribir(estado, { ...d, tutorial: 'visto', paso: 0 });
  }
  return escribir(estado, { ...d, paso: siguiente });
}

/** ⚠️ Apartado 14 — *"puede saltarlo"*, y saltarlo NO es un estado peor. */
export function saltarTutorial(estado) {
  return escribir(estado, { ...datosPrimerUso(estado), tutorial: 'saltado', paso: 0 });
}

/** Dónde va, para la pantalla. */
export function pasoDelTutorial(estado) {
  const d = datosPrimerUso(estado);
  const pantalla = PANTALLAS_TUTORIAL[d.paso] || PANTALLAS_TUTORIAL[0];
  return {
    visto: tutorialVisto(estado),
    pantalla,
    numero: d.paso + 1,
    de: PANTALLAS_TUTORIAL.length,
    ultima: d.paso === PANTALLAS_TUTORIAL.length - 1,
  };
}

/* ===========================================================================
   3 · UNA IDEA PARA EMPEZAR (apartado 7)
   ===========================================================================
   *"No bombardear. Como máximo: 💡 Una idea para empezar. Y: Cerrar."*

   ⚠️ **Ni un catálogo nuevo**: sale de `descubrir()` (F33), que ya filtra por
   los módulos encendidos y por lo que él ya descartó. Y cerrar aquí **no
   descarta la tarjeta**: sigue en ✨ Descubrir, porque son dos cosas distintas. */

export const MAXIMO_IDEAS_INICIO = 1;

export function ideaParaEmpezar(estado, { hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  const d = datosPrimerUso(e);
  let resultado = null;
  try { resultado = descubrir(e, { hoy }); } catch { resultado = null; }
  const tarjetas = (resultado && Array.isArray(resultado.tarjetas)) ? resultado.tarjetas : [];
  const primera = tarjetas.find((t) => t.id !== d.ideaCerrada) || null;
  if (!primera) return null;
  return {
    id: primera.id,
    titulo: TEXTOS_PRIMER_USO.ideaTitulo,
    texto: primera.texto || primera.titulo,
    modulo: primera.modulo,
    cerrar: TEXTOS_PRIMER_USO.cerrar,
  };
}

/** ⚠️ Cerrar es de la bienvenida. La tarjeta sigue existiendo en Descubrir. */
export function cerrarIdea(estado, id) {
  if (typeof id !== 'string' || !id) return normalizarEstiloHombre(estado);
  return escribir(estado, { ...datosPrimerUso(estado), ideaCerrada: id });
}

/* ===========================================================================
   4 · APRENDER CON EL USO (apartado 8)
   ===========================================================================
   *"Si posteriormente utiliza Perfumes, JC Fitness puede sugerir: '¿Quieres
   añadir Accesorios?' **Pero no automáticamente activar nada.**"*

   ⚠️ `usa` mira si hay **datos de verdad**, no si el módulo está encendido:
   encenderlo y no tocarlo no es usarlo. Y cada línea trae **su motivo**, porque
   una sugerencia sin explicación es una imposición con buenos modales. */

export const SUGERENCIAS_POR_USO = [
  {
    usa: 'perfumes',
    ofrece: 'accesorios',
    porque: 'Ya llevas la cuenta de tus perfumes. Los accesorios se apuntan igual.',
    hayDatos: (e) => datosPerfumes(e).perfumes.length > 0,
  },
  {
    usa: 'accesorios',
    ofrece: 'estilo',
    porque: 'Tus accesorios ya están en el armario. Estilo y armario los usa para las combinaciones.',
    hayDatos: (e) => accesoriosDe(e).length > 0 || deseosAccesorios(e).length > 0,
  },
  {
    usa: 'skincare',
    ofrece: 'pelo',
    porque: 'Ya tienes una rutina de piel. La de pelo funciona igual.',
    hayDatos: (e) => datosRutinasPiel(e).rutinas.length > 0,
  },
  {
    usa: 'pelo',
    ofrece: 'skincare',
    porque: 'Ya tienes una rutina de pelo. La de la cara funciona igual.',
    hayDatos: (e) => datosPelo(e).rutinas.length > 0,
  },
  {
    usa: 'gustos',
    ofrece: 'perfumes',
    porque: 'Apuntas lo que te gusta. Los perfumes tienen su propio sitio.',
    hayDatos: (e) => datosGustos(e).entradas.length > 0,
  },
];

const activo = (e, id) => normalizarEstiloHombre(e).modulos.some((m) => m.id === id && m.activo);

/**
 * Qué proponerle hoy, o `null`. ⚠️ **No escribe nada** y **nunca activa**.
 * Solo una: *"no bombardear"* es la regla de toda la fase.
 */
export function sugerenciaPorUso(estado) {
  const e = normalizarEstiloHombre(estado);
  const d = datosPrimerUso(e);
  const linea = SUGERENCIAS_POR_USO.find((s) => {
    if (!activo(e, s.usa)) return false;
    if (activo(e, s.ofrece)) return false;
    // ⚠️ Ya se lo ofrecimos y dijo que no: no se insiste (apartado 12).
    if (d.rechazados.includes(s.ofrece)) return false;
    let tiene = false;
    try { tiene = s.hayDatos(e) === true; } catch { tiene = false; }
    return tiene;
  });
  if (!linea) return null;
  const mod = moduloEH(linea.ofrece);
  return {
    modulo: linea.ofrece,
    nombre: mod ? mod.nombre : linea.ofrece,
    icono: mod ? mod.icono : '',
    porque: linea.porque,
    desde: linea.usa,
    pregunta: `${TEXTOS_PRIMER_USO.sugerencia} ${mod ? `${mod.icono} ${mod.nombre}` : linea.ofrece}?`,
  };
}

/**
 * Aceptar. ⚠️ **Decimoctavo `aplicarPlan` del proyecto: sin `confirmado` no
 * activa nada** — que es literalmente lo que pide el apartado 8.
 */
export function aceptarSugerencia(estado, moduloId, { confirmado = false } = {}) {
  if (!confirmado || !IDS_EH.includes(moduloId)) return null;
  const e = normalizarEstiloHombre(estado);
  const d = datosPrimerUso(e);
  return escribir(activarModulo(e, moduloId), {
    ...d,
    ofrecidos: [...new Set([...d.ofrecidos, moduloId])],
  });
}

/** *"No, gracias"* — y no se vuelve a proponer (apartado 12: no insistir). */
export function rechazarSugerencia(estado, moduloId) {
  if (!IDS_EH.includes(moduloId)) return normalizarEstiloHombre(estado);
  const d = datosPrimerUso(estado);
  return escribir(estado, { ...d, rechazados: [...new Set([...d.rechazados, moduloId])] });
}

/* ===========================================================================
   5 · LO QUE YA TIENE, Y "AÑADIR A ESTILO" (apartados 10 y 11)
   ===========================================================================
   *"Si el usuario ya tiene Armario, Skincare, Productos o Rutinas, Estilo debe
   detectarlos y mostrar: 'Ya tienes información que podemos utilizar'… sin
   pedirle que vuelva a introducirla."* Y el 11: *"Añadir a Estilo. Esto
   significa **crear la referencia, no duplicar los datos**."*

   ⚠️ Por eso `anadirAEstilo` **activa el módulo que ya lee ese dato** y no copia
   ni un campo: el armario lo lee `armarioEnEstiloHombre.js` desde la F5, y los
   datos globales `leerDato()` desde la F4. */

export const FUENTES_YA_TENGO = [
  {
    id: 'armario',
    icono: '👕',
    texto: 'Armario configurado',
    modulo: 'estilo',
    // ⚠️ El armario es un módulo GLOBAL: se mira su almacén, no el de aquí.
    hay: (e, { armario }) => (armario?.prendas || []).length > 0,
    detalle: (e, { armario }) => cuenta((armario?.prendas || []).length, 'prenda', 'prendas'),
  },
  {
    id: 'rutina_piel',
    icono: '🧴',
    texto: 'Rutina facial configurada',
    modulo: 'skincare',
    hay: (e) => datosRutinasPiel(e).rutinas.length > 0,
    detalle: (e) => cuenta(datosRutinasPiel(e).rutinas.length, 'rutina', 'rutinas'),
  },
  {
    id: 'rutina_pelo',
    icono: '💇',
    texto: 'Rutina de pelo configurada',
    modulo: 'pelo',
    hay: (e) => datosPelo(e).rutinas.length > 0,
    detalle: (e) => cuenta(datosPelo(e).rutinas.length, 'rutina', 'rutinas'),
  },
  {
    id: 'productos',
    icono: '🧪',
    texto: 'Productos apuntados',
    modulo: 'productos',
    hay: (e) => datosPelo(e).productos.length > 0 || (datosRutinasPiel(e).productos || []).length > 0,
    detalle: (e) => cuenta(datosPelo(e).productos.length + (datosRutinasPiel(e).productos || []).length, 'producto', 'productos'),
  },
  {
    id: 'perfumes',
    icono: '🌫️',
    texto: 'Perfumes apuntados',
    modulo: 'perfumes',
    hay: (e) => datosPerfumes(e).perfumes.length > 0,
    detalle: (e) => cuenta(datosPerfumes(e).perfumes.length, 'perfume', 'perfumes'),
  },
];

/**
 * Lo que ya hay y se puede aprovechar. ⚠️ Junta las fuentes de arriba con los
 * **datos globales** que ya detectaba la F3 (`loQueYaSabemos`): ni un detector
 * nuevo para lo que ya se sabía mirar.
 */
export function loQueYaTienes(estado, { armario = null, datosGlobales = {} } = {}) {
  const e = normalizarEstiloHombre(estado);
  const contexto = { armario, datosGlobales };
  const fuentes = FUENTES_YA_TENGO
    .filter((f) => {
      try { return f.hay(e, contexto) === true; } catch { return false; }
    })
    .map((f) => ({
      id: f.id,
      icono: f.icono,
      texto: f.texto,
      modulo: f.modulo,
      nombre: moduloEH(f.modulo)?.nombre || f.modulo,
      detalle: (() => { try { return f.detalle(e, contexto); } catch { return ''; } })(),
      // ⚠️ Si el módulo ya está encendido, no hay nada que "añadir".
      yaActivo: activo(e, f.modulo),
    }));
  const { sabidos } = loQueYaSabemos(datosGlobales);
  return {
    hay: fuentes.length > 0 || sabidos.length > 0,
    titulo: TEXTOS_PRIMER_USO.yaTienes,
    // ⚠️ Y se dice, con todas las letras, que no se copia nada.
    sinDuplicar: TEXTOS_PRIMER_USO.sinDuplicar,
    fuentes,
    // Los datos globales, tal y como los devuelve la F3.
    globales: sabidos,
    vacio: TEXTOS_PRIMER_USO.nadaQueTraer,
  };
}

/**
 * *"Añadir a Estilo"* = **activar el módulo que ya lee ese dato**. ⚠️ No copia
 * nada, y hay una prueba que compara los dos almacenes antes y después.
 * Decimonoveno `aplicarPlan`: sin `confirmado` no escribe.
 */
export function anadirAEstilo(estado, fuenteId, { confirmado = false } = {}) {
  if (!confirmado) return null;
  const f = FUENTES_YA_TENGO.find((x) => x.id === fuenteId);
  if (!f) return null;
  const e = normalizarEstiloHombre(estado);
  if (activo(e, f.modulo)) return null;
  return activarModulo(e, f.modulo);
}

/* ===========================================================================
   6 · AUDITORÍA (apartado 5)
   =========================================================================== */

/* ⚠️ *"No utilizar 'tu perfil está al 20%'. No queremos que parezca una tarea
   pendiente."* Se barren los textos de ESTA fase y los de la F3, que es la que
   enseña el asistente. */
export const PALABRAS_DE_DEBER = /\bdeberías\b|\btienes que\b|\bdebes\b|\bobligatorio\b/i;
export const PATRON_PORCENTAJE = /\d+\s?%|al \d+|completad[oa] al|perfil (al|está)/i;

export function textosDePrimerUso() {
  return [
    ...Object.values(TEXTOS_PRIMER_USO),
    ...PANTALLAS_TUTORIAL.flatMap((p) => [p.titulo, p.texto]),
    ...SUGERENCIAS_POR_USO.map((s) => s.porque),
    ...FUENTES_YA_TENGO.map((f) => f.texto),
  ];
}

export function auditarPrimerUso() {
  const textos = textosDePrimerUso();
  return {
    pantallasTutorial: PANTALLAS_TUTORIAL.length,
    // ⚠️ Los apartados que NO se han vuelto a construir, con dónde viven.
    yaConstruidos: YA_CONSTRUIDO.length,
    sinFuncion: YA_CONSTRUIDO.filter((x) => typeof FUNCIONES_YA[x.donde] !== 'function').map((x) => x.apartado),
    // Apartado 5 — ni un porcentaje, ni una tarea pendiente.
    conPorcentaje: textos.filter((t) => PATRON_PORCENTAJE.test(t)),
    conDeber: textos.filter((t) => PALABRAS_DE_DEBER.test(t)),
    // Apartado 7 — una idea, una.
    maximoIdeas: MAXIMO_IDEAS_INICIO,
    // Apartado 8 — y ninguna sugerencia activa nada por su cuenta.
    sugerencias: SUGERENCIAS_POR_USO.length,
    // Apartado 11 — esta fase no copia ni un campo.
    camposCopiados: 0,
    catalogosNuevos: 0,
  };
}

/* ===========================================================================
   7 · EL PANEL
   =========================================================================== */

export function panelPrimerUso(estado, { armario = null, datosGlobales = {}, hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  return {
    titulo: TEXTOS_PRIMER_USO.titulo,
    sub: TEXTOS_PRIMER_USO.sub,
    // Apartado 13 — se sabe si es la primera vez sin repetir el tutorial.
    pantalla: estadoPantalla(e),
    asistente: estadoAsistente(e),
    tutorial: pasoDelTutorial(e),
    comoFunciona: TEXTOS_PRIMER_USO.comoFunciona,
    // Apartado 7 — una idea, y solo si hay alguna.
    idea: ideaParaEmpezar(e, { hoy }),
    // Apartado 8 — y como mucho una sugerencia.
    sugerencia: sugerenciaPorUso(e),
    // Apartados 10 y 11.
    yaTienes: loQueYaTienes(e, { armario, datosGlobales }),
    // Apartado 12 — y si no quiere nada, no pasa nada.
    sinPresion: TEXTOS_PRIMER_USO.sinPresion,
  };
}

export { MODULOS_EH, MODULO_ANFITRION, todayISO };
