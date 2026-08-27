// ============================================================================
// EH · Fase 13/65 — SKINCARE: PERFIL DE PIEL Y CONFIGURACIÓN INICIAL
//
// *"Sin IA. Sin diagnósticos médicos. El usuario decide siempre. Todo es
// opcional."* — el enunciado, antes de pedir nada.
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. El motor ya existe.** El apartado 2 dice *"aquí sí utilizaremos el
// sistema de formularios que preparamos anteriormente"*, y eso es
// `cuestionarios.js` (F7). Skincare trae **su array de preguntas**, no su motor.
// Y por tanto trae gratis: "No lo sé" como respuesta legítima y exclusiva, el
// progreso que es un recuento y no una nota, y —lo importante— **la regla que
// decide dónde se guarda cada respuesta**.
//
// **2. ⚠️ El apartado 15 ya es código, y ya estaba escrito.** *"Antes de
// preguntar, comprobar la información ya registrada. Si un dato compatible ya
// existe, reutilizarlo. No preguntar dos veces."* El registro de la Fase 4 **ya
// declaraba `tipoPiel` y `sensibilidadPiel` como datos de esta fase**
// (`desde: 13`) compartidos con Productos, Barba y Cuerpo. Así que esas dos
// respuestas van solas a la capa compartida: no hay un `if` que lo decida, lo
// decide `destinoDe()`. Lo mismo con `sinPerfume`, que Cuerpo y Productos
// comparten.
//
// **3. El formulario adaptativo vive en el motor** (apartado 14). Se le ha
// añadido `cuando` a la forma de una pregunta y `preguntasVisibles()` al motor,
// no un `if` en la pantalla de Skincare: Barba, Cuerpo, Manos y Perfumes van a
// querer lo mismo, y una pregunta que se esconde con un `if` en el JSX es una
// pregunta que nadie puede comprobar. ⚠️ Y **esconder no es borrar**: si dice
// que no usa productos, las preguntas de productos desaparecen y **sus
// respuestas de antes siguen ahí**.
//
// **4. ⚠️ Objetivos de cuidado, NUNCA diagnósticos** (apartado 4, con la
// advertencia en el propio enunciado). Se pregunta *"¿qué te gustaría mejorar o
// cuidar?"*, no *"¿qué te pasa?"*. Es la misma regla de la Fase 7, y hay una
// prueba que recorre todos los textos buscando vocabulario clínico.
//
// **5. ⚠️ Apartado 17 — esto NO va a la IA.** *"No enviar estos datos a una IA.
// No crear perfiles externos."* Hay una prueba que comprueba que este archivo no
// puede llamar a nada, y otra que el contexto que entrega **no sale de aquí**.
//
// ⚠️ Y lo que esta fase **NO** construye, porque el enunciado lo prohíbe con esas
// palabras: rutinas, seguimiento, recomendaciones, productos, packs e
// integración. *"Todavía no implementar esas funciones dentro de esta fase."*
// ============================================================================

import { normalizarEstiloHombre, guardarConfig, moduloEH } from './estiloDeHombre';
import { NIVELES_ESTILO } from './perfilEstilo';
import { datoDelRegistro } from './datosEstiloHombre';
import {
  NO_LO_SE, leerRespuesta, contestar, borrarRespuesta, leerCuestionario,
  preguntasVisibles, progresoVisible, contextoDelCuestionario,
  auditarCuestionario, destinoDe,
} from './cuestionarios';
import { uid, todayISO } from './helpers';

export const MODULO_PIEL = 'skincare';

/** Apartado 1 — la pantalla de entrada, con sus dos botones. */
export const TEXTOS_PIEL = {
  titulo: 'Tu cuidado de la piel',
  sub: 'Personaliza este apartado según tus necesidades.',
  configurar: 'Configurar',
  ahoraNo: 'Ahora no',
  // ⚠️ *"Ahora no"* no es un estado degradado: es una decisión suya, y se puede
  // volver cuando quiera. Igual que omitir el asistente en la Fase 3.
  omitido: 'Cuando quieras, aquí lo configuras.',
  editar: '⚙️ Mi perfil de piel',
};

/* ===========================================================================
   1 · LAS LISTAS DEL ENUNCIADO
   ===========================================================================
   Literales, y en su orden. */

export const TIPOS_PIEL = [
  { id: 'normal', nombre: 'Normal' },
  { id: 'seca', nombre: 'Seca' },
  { id: 'grasa', nombre: 'Grasa' },
  { id: 'mixta', nombre: 'Mixta' },
  { id: 'sensible', nombre: 'Sensible' },
];

/**
 * ⚠️ Apartado 4, con su advertencia literal: *"estas opciones son objetivos de
 * cuidado, **no diagnósticos**"*. Por eso la pregunta es *"¿qué te gustaría
 * mejorar o cuidar?"* y no *"¿qué problemas tienes?"*, y por eso ninguna opción
 * lleva un nombre clínico.
 */
export const NECESIDADES_PIEL = [
  { id: 'hidratacion', nombre: 'Hidratación' },
  { id: 'sequedad', nombre: 'Sequedad' },
  { id: 'grasa', nombre: 'Exceso de grasa' },
  { id: 'brillos', nombre: 'Brillos' },
  { id: 'sensibilidad', nombre: 'Sensibilidad' },
  { id: 'textura', nombre: 'Textura' },
  { id: 'apagado', nombre: 'Aspecto apagado' },
  { id: 'poros', nombre: 'Poros visibles' },
  { id: 'imperfecciones', nombre: 'Imperfecciones' },
  { id: 'marcas', nombre: 'Marcas' },
  { id: 'solar', nombre: 'Protección solar' },
  { id: 'general', nombre: 'Cuidado general' },
  { id: 'otro', nombre: 'Otro' },
];

/** Apartado 6 — *"no asumir que todo el mundo quiere una rutina facial completa"*. */
export const ZONAS_PIEL = [
  { id: 'cara', nombre: 'Cara' },
  { id: 'frente', nombre: 'Frente' },
  { id: 'nariz', nombre: 'Nariz' },
  { id: 'mejillas', nombre: 'Mejillas' },
  { id: 'ojos', nombre: 'Contorno de ojos' },
  { id: 'labios', nombre: 'Labios' },
  { id: 'cuello', nombre: 'Cuello' },
  { id: 'cuerpo', nombre: 'Cuerpo' },
];

/** Apartado 7 — una sola prioridad, *"para ordenar posteriormente"*. */
export const PRIORIDADES_PIEL = [
  { id: 'hidratacion', nombre: 'Hidratación' },
  { id: 'imperfecciones', nombre: 'Cuidado de imperfecciones' },
  { id: 'proteccion', nombre: 'Protección' },
  { id: 'mantener', nombre: 'Mantener la piel cuidada' },
];

/**
 * Apartado 8. ⚠️ **No son las mismas cinco opciones que `tiempoPelo` (F7)**, y
 * eso importa: allí eran menos de 5 / 5–10 / 10–20 / más de 20; aquí el
 * enunciado pide menos de 2 / 2–5 / 5–10 / más de 10. Otra escala, otro asunto
 * —la piel, no el pelo— y por tanto **otra pregunta de verdad**, no una
 * duplicación. Comprobado con una prueba, porque la duplicación del apartado 5
 * de la Fase 12 se parecía mucho a esto y no lo era.
 */
export const TIEMPOS_PIEL = [
  { id: 'menos_2', nombre: 'Menos de 2 minutos', minutos: 2 },
  { id: '2_5', nombre: '2–5 minutos', minutos: 5 },
  { id: '5_10', nombre: '5–10 minutos', minutos: 10 },
  { id: 'mas_10', nombre: 'Más de 10 minutos', minutos: 20 },
  // ⚠️ `null`, no un número grande.
  { id: 'igual', nombre: 'Me da igual', minutos: null },
];

/**
 * Apartado 9 — *"esto conecta directamente con el sistema de niveles"*, y el
 * sistema de niveles es `NIVELES_ESTILO` (F6). ⚠️ **Se importan sus ids y sus
 * iconos**, como en la Fase 12; los nombres y las frases son los del enunciado.
 */
export const COMPLEJIDADES_PIEL = NIVELES_ESTILO.map((x) => ({
  ...x,
  nombre: { basico: 'Básica', intermedio: 'Intermedia', avanzado: 'Completa' }[x.id],
  frase: {
    basico: 'Pocos pasos.',
    intermedio: 'Varios productos.',
    avanzado: 'Quiero profundizar.',
  }[x.id],
}));

export const complejidadPiel = (id) => COMPLEJIDADES_PIEL.find((x) => x.id === id) || null;

export const USO_PRODUCTOS = [
  { id: 'si', nombre: 'Sí' },
  { id: 'no', nombre: 'No' },
  { id: 'algunos', nombre: 'Algunos' },
];

/** Apartado 11. *"Sin perfume"* no está aquí: es un dato compartido (apartado 15). */
export const PREFERENCIAS_PRODUCTO_PIEL = [
  { id: 'ligera', nombre: 'Textura ligera' },
  { id: 'cremosa', nombre: 'Textura cremosa' },
  { id: 'minimalista', nombre: 'Productos minimalistas' },
  { id: 'economico', nombre: 'Productos económicos' },
  { id: 'premium', nombre: 'Productos premium' },
  { id: 'farmacia', nombre: 'Farmacia' },
  { id: 'marcas', nombre: 'Marcas concretas' },
];

/** Apartado 12 — *"no obligar a introducir una cantidad exacta"*. */
export const PRESUPUESTOS_PIEL = [
  { id: 'bajo', nombre: 'Bajo' },
  { id: 'medio', nombre: 'Medio' },
  { id: 'alto', nombre: 'Alto' },
  { id: 'sin', nombre: 'Sin preferencia' },
];

export const USO_SOLAR = [
  { id: 'si', nombre: 'Sí' },
  { id: 'no', nombre: 'No' },
  { id: 'a_veces', nombre: 'A veces' },
];

/* ===========================================================================
   2 · LAS PREGUNTAS (apartados 3 a 13)
   ===========================================================================
   ⚠️ **`cuando` es el apartado 14**: cuatro preguntas solo aparecen si tienen
   sentido. Y el reparto entre la capa compartida y la `config` **no se decide
   aquí**: lo decide `destinoDe()` mirando el registro de la Fase 4, que ya
   declaraba `tipoPiel`, `sensibilidadPiel` y `sinPerfume`. */

export const SECCIONES_PIEL = [
  { id: 'piel', nombre: 'Tu piel' },
  { id: 'cuidado', nombre: 'Qué quieres cuidar' },
  { id: 'rutina', nombre: 'Cómo la quieres' },
  { id: 'productos', nombre: 'Productos' },
];

export const PREGUNTAS_PIEL = [
  {
    id: 'tipoPiel',
    seccion: 'piel',
    apartado: 3,
    // ⚠️ *"¿Cómo describirías tu piel?"*, no *"¿qué problema tienes?"*.
    titulo: '¿Cómo describirías tu piel?',
    opciones: TIPOS_PIEL,
  },
  {
    id: 'sensibilidadPiel',
    seccion: 'piel',
    apartado: 5,
    titulo: '¿Tu piel suele reaccionar fácilmente a productos?',
    opciones: [{ id: 'si', nombre: 'Sí' }, { id: 'no', nombre: 'No' }],
  },
  {
    id: 'queMolesta',
    seccion: 'piel',
    apartado: 5,
    titulo: '¿Qué suele molestarte?',
    ayuda: 'Opcional. Lo que hayas notado, sin más.',
    opciones: [
      { id: 'alcohol', nombre: 'Alcohol' },
      { id: 'perfume', nombre: 'Perfume' },
      { id: 'exfoliantes', nombre: 'Exfoliantes' },
      { id: 'sol', nombre: 'El sol' },
      { id: 'frio', nombre: 'El frío' },
      { id: 'otro', nombre: 'Otra cosa' },
    ],
    multiple: true,
    // ⚠️ Apartado 5 — solo si ha dicho que sí. Y apartado 14: no se le pregunta
    // qué le molesta a quien acaba de decir que no le molesta nada.
    cuando: (r) => (r.sensibilidadPiel || []).includes('si'),
  },
  {
    id: 'necesidadesPiel',
    seccion: 'cuidado',
    apartado: 4,
    titulo: '¿Qué te gustaría mejorar o cuidar?',
    opciones: NECESIDADES_PIEL,
    multiple: true,
  },
  {
    id: 'zonasPiel',
    seccion: 'cuidado',
    apartado: 6,
    titulo: '¿Qué zonas quieres cuidar?',
    opciones: ZONAS_PIEL,
    multiple: true,
  },
  {
    id: 'prioridadPiel',
    seccion: 'cuidado',
    apartado: 7,
    titulo: '⭐ ¿Qué es lo más importante para ti?',
    opciones: PRIORIDADES_PIEL,
  },
  {
    id: 'tiempoPiel',
    seccion: 'rutina',
    apartado: 8,
    titulo: '¿Cuánto tiempo quieres dedicar a tu cuidado?',
    opciones: TIEMPOS_PIEL,
  },
  {
    id: 'complejidadPiel',
    seccion: 'rutina',
    apartado: 9,
    titulo: '¿Qué tipo de rutina prefieres?',
    opciones: COMPLEJIDADES_PIEL.map((x) => ({ id: x.id, nombre: `${x.icono} ${x.nombre}`, ayuda: x.frase })),
  },
  {
    id: 'solarPiel',
    seccion: 'rutina',
    apartado: 13,
    titulo: '☀️ ¿Usas protección solar?',
    opciones: USO_SOLAR,
  },
  {
    id: 'usaProductos',
    seccion: 'productos',
    apartado: 10,
    titulo: '¿Utilizas actualmente productos de skincare?',
    opciones: USO_PRODUCTOS,
  },
  {
    id: 'sinPerfume',
    seccion: 'productos',
    apartado: 11,
    titulo: '¿Prefieres productos sin perfume?',
    opciones: [{ id: 'si', nombre: 'Sí' }, { id: 'no', nombre: 'No' }],
    /* ⚠️ Apartado 14 — a quien no usa productos no se le pregunta qué productos
       prefiere. El ejemplo del enunciado es literalmente este. */
    cuando: (r) => !(r.usaProductos || []).includes('no'),
  },
  {
    id: 'preferenciasProducto',
    seccion: 'productos',
    apartado: 11,
    titulo: '¿Cómo los prefieres?',
    opciones: PREFERENCIAS_PRODUCTO_PIEL,
    multiple: true,
    cuando: (r) => !(r.usaProductos || []).includes('no'),
  },
  {
    id: 'presupuestoPiel',
    seccion: 'productos',
    apartado: 12,
    titulo: '¿Qué presupuesto quieres utilizar, más o menos?',
    ayuda: 'Opcional, y sin cifras exactas.',
    opciones: PRESUPUESTOS_PIEL,
    cuando: (r) => !(r.usaProductos || []).includes('no'),
  },
];

export const preguntaPiel = (id) => PREGUNTAS_PIEL.find((p) => p.id === id) || null;

/* ===========================================================================
   3 · LEER Y CONTESTAR
   ===========================================================================
   Todo pasa por el motor de la Fase 7. Este archivo no guarda una respuesta por
   su cuenta ni una sola vez. */

export const respuestaPiel = (estado, id, datosGlobales = {}) =>
  leerRespuesta(estado, MODULO_PIEL, preguntaPiel(id) || { id }, datosGlobales);

export const contestarPiel = (estado, id, valor, opts) =>
  contestar(estado, MODULO_PIEL, preguntaPiel(id) || { id, opciones: [] }, valor, opts);

export const borrarPiel = (estado, id, opts) =>
  borrarRespuesta(estado, MODULO_PIEL, preguntaPiel(id) || { id }, opts);

export const perfilPiel = (estado, datosGlobales = {}) =>
  leerCuestionario(estado, MODULO_PIEL, PREGUNTAS_PIEL, datosGlobales);

/** ⚠️ Apartado 14 — lo que de verdad se le enseña ahora mismo. */
export const preguntasDePiel = (estado, datosGlobales = {}) =>
  preguntasVisibles(estado, MODULO_PIEL, PREGUNTAS_PIEL, datosGlobales);

export const progresoPiel = (estado, datosGlobales = {}) =>
  progresoVisible(estado, MODULO_PIEL, PREGUNTAS_PIEL, datosGlobales);

/* ⚠️ **Un solo vocabulario de estado, no dos.** Aquí había un
   `estadoPerfilPiel` que devolvía las palabras del motor (`contestado`) y un
   `estadoDeEntrada` que devolvía las suyas (`configurado`): dos nombres para lo
   mismo dentro del mismo archivo, que es cómo se acaba comparando contra la
   palabra equivocada. Manda `estadoDeEntrada` —el único que sabe de "Ahora no"
   (apartado 1), que el motor no puede conocer— y el del motor se queda dentro. */

/** Apartado 2 — *"dividido en pequeñas secciones… no un formulario gigante"*. */
export function seccionesDePiel(estado, datosGlobales = {}) {
  const visibles = preguntasDePiel(estado, datosGlobales);
  return SECCIONES_PIEL
    .map((s) => {
      const suyas = visibles.filter((q) => preguntaPiel(q.id)?.seccion === s.id);
      return {
        ...s,
        preguntas: suyas,
        contestadas: suyas.filter((q) => q.contestada).length,
        total: suyas.length,
      };
    })
    // Una sección que se ha quedado sin preguntas visibles no se enseña vacía.
    .filter((s) => s.total > 0);
}

/* ===========================================================================
   4 · ⚠️ EL APARTADO 15 — LO QUE NO SE PREGUNTA DOS VECES
   ===========================================================================
   *"Antes de preguntar: comprobar la información ya registrada. Si un dato
   compatible ya existe: reutilizarlo. No preguntar dos veces."*

   No hace falta un mecanismo nuevo: el registro de la Fase 4 **ya declaraba**
   `tipoPiel`, `sensibilidadPiel` y `sinPerfume` como datos compartidos de esta
   fase. `destinoDe()` los manda solo a la capa común, y `leerDato()` los
   encuentra vengan de donde vengan. Esto solo lo hace visible. */

export function loQueYaSabemosDeTuPiel(estado, datosGlobales = {}) {
  return PREGUNTAS_PIEL
    .filter((p) => destinoDe(p.id) === 'compartido')
    .map((p) => {
      const r = respuestaPiel(estado, p.id, datosGlobales);
      const reg = datoDelRegistro(p.id);
      return {
        id: p.id,
        titulo: p.titulo,
        nombre: reg.nombre,
        contestada: r.contestada,
        etiquetas: r.etiquetas,
        // Con quién se comparte, para poder decírselo en vez de que parezca
        // que la respuesta se ha ido a otro sitio sin avisar.
        conQuien: reg.usan.filter((m) => m !== MODULO_PIEL).map((m) => moduloEH(m)?.nombre || m),
      };
    });
}

/* ===========================================================================
   5 · SUS PRODUCTOS DE AHORA (apartado 10)
   ===========================================================================
   ⚠️ *"Pero no obligar a introducirlos todos."* Y el enunciado cierra con
   *"todavía no implementar"* rutinas, productos y packs, así que esto es
   **una lista de nombres**, no un catálogo: ni marca, ni precio, ni tienda, ni
   valoración. Eso lo construye una fase posterior. */

export const DEFAULT_PIEL = {
  // apartado 1 — pulsó "Ahora no". Es una respuesta, no un hueco.
  ahoraNo: false,
  productos: [],   // [{ id, nombre }]
  editado: null,   // apartado 16 — cuándo tocó el perfil por última vez
};

function normalizarProductoPiel(g) {
  const nombre = String((g || {}).nombre || '').trim();
  if (!nombre) return null;
  return { id: (g || {}).id || uid(), nombre };
}

export function normalizarPiel(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    ahoraNo: g.ahoraNo === true,
    productos: (Array.isArray(g.productos) ? g.productos : []).map(normalizarProductoPiel).filter(Boolean),
    editado: typeof g.editado === 'string' ? g.editado : null,
  };
}

export const datosPiel = (estado) => {
  const e = normalizarEstiloHombre(estado);
  return normalizarPiel(e.modulos.find((m) => m.id === MODULO_PIEL)?.config?.piel);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_PIEL, { piel: datos });

export function anadirProductoPiel(estado, nombre) {
  const limpio = String(nombre || '').trim();
  if (!limpio) return { estado: normalizarEstiloHombre(estado), error: 'El producto necesita un nombre.' };
  const d = datosPiel(estado);
  if (d.productos.some((p) => p.nombre.toLowerCase() === limpio.toLowerCase())) {
    return { estado: normalizarEstiloHombre(estado), error: null, sinEfecto: true };
  }
  return { estado: escribir(estado, { ...d, productos: [...d.productos, { id: uid(), nombre: limpio }] }), error: null };
}

export function quitarProductoPiel(estado, id) {
  const d = datosPiel(estado);
  return { estado: escribir(estado, { ...d, productos: d.productos.filter((p) => p.id !== id) }), error: null };
}

/** Apartado 1 — *"Ahora no"*. Se guarda para no volver a plantarle la pantalla. */
export const decirAhoraNo = (estado) => ({ estado: escribir(estado, { ...datosPiel(estado), ahoraNo: true }), error: null });

/** Y volver, cuando quiera. Apartado 16: *"puede cambiar cualquier respuesta"*. */
export const volverAConfigurar = (estado, { hoy = todayISO() } = {}) =>
  ({ estado: escribir(estado, { ...datosPiel(estado), ahoraNo: false, editado: hoy }), error: null });

/* ===========================================================================
   6 · LOS TRES ESTADOS DE LA ENTRADA (apartado 1)
   =========================================================================== */

export const ESTADOS_PIEL = ['sin_configurar', 'ahora_no', 'a_medias', 'configurado'];

export function estadoDeEntrada(estado, datosGlobales = {}) {
  const p = progresoPiel(estado, datosGlobales);
  if (p.contestadas > 0) return p.todasContestadas ? 'configurado' : 'a_medias';
  // ⚠️ "Ahora no" solo manda mientras no haya contestado nada: si luego contesta
  // algo, el estado real es el que dicen sus respuestas.
  return datosPiel(estado).ahoraNo ? 'ahora_no' : 'sin_configurar';
}

/* ===========================================================================
   7 · ⚠️ EL TONO — OBJETIVOS DE CUIDADO, NUNCA UN DIAGNÓSTICO
   ===========================================================================
   Apartado 4 lo dice con esas palabras, y el objetivo de la fase lo repite:
   *"sin diagnósticos médicos"*. */

export const PALABRAS_CLINICAS = [
  'diagnóstico', 'diagnostico', 'patología', 'patologia', 'dermatitis', 'acné',
  'acne', 'eccema', 'psoriasis', 'rosácea', 'rosacea', 'enfermedad', 'síntoma',
  'sintoma', 'tratamiento médico', 'padeces', 'sufres', 'trastorno', 'lesión',
  'lesion', 'cura', 'curar',
];

export function sinDiagnostico(texto) {
  const t = String(texto || '').toLowerCase();
  return !PALABRAS_CLINICAS.some((p) => t.includes(p));
}

/** Todos los textos que esta fase puede enseñar. Para poder barrerlos de una vez. */
export function textosDePiel() {
  return [
    ...Object.values(TEXTOS_PIEL),
    ...PREGUNTAS_PIEL.map((p) => p.titulo),
    ...PREGUNTAS_PIEL.map((p) => p.ayuda || ''),
    ...PREGUNTAS_PIEL.flatMap((p) => p.opciones.map((o) => o.nombre)),
    ...COMPLEJIDADES_PIEL.map((x) => x.frase),
    ...SECCIONES_PIEL.map((s) => s.nombre),
  ].filter(Boolean);
}

/* ===========================================================================
   8 · EL CONTEXTO PARA LAS FASES QUE VIENEN
   ===========================================================================
   ⚠️ **Apartado 17 — esto no sale de aquí.** *"No enviar estos datos a una IA.
   No crear perfiles externos."* Este objeto existe para que las fases 14 a 17
   —rutinas, seguimiento, recomendaciones y productos— tengan de dónde leer, y
   lleva escrito que no viaja. */

export function contextoDePiel(estado, datosGlobales = {}) {
  const ctx = contextoDelCuestionario(estado, MODULO_PIEL, PREGUNTAS_PIEL, datosGlobales);
  const val = (id) => {
    const r = respuestaPiel(estado, id, datosGlobales);
    return r.contestada && !r.noSabe ? r.valores : [];
  };
  return {
    ...ctx,
    tipoPiel: val('tipoPiel')[0] || null,
    sensible: val('sensibilidadPiel')[0] === 'si',
    molestias: val('queMolesta'),
    necesidades: val('necesidadesPiel'),
    zonas: val('zonasPiel'),
    prioridad: val('prioridadPiel')[0] || null,
    tiempo: val('tiempoPiel')[0] || null,
    minutos: TIEMPOS_PIEL.find((t) => t.id === val('tiempoPiel')[0])?.minutos ?? null,
    nivel: val('complejidadPiel')[0] || null,
    solar: val('solarPiel')[0] || null,
    usaProductos: val('usaProductos')[0] || null,
    sinPerfume: val('sinPerfume')[0] === 'si',
    preferencias: val('preferenciasProducto'),
    presupuesto: val('presupuestoPiel')[0] || null,
    productos: datosPiel(estado).productos.map((p) => p.nombre),
    // ⚠️ Apartado 17, escrito en el propio dato.
    paraIA: false,
    privado: true,
  };
}

/* ===========================================================================
   9 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export function resumenPiel(estado, datosGlobales = {}) {
  const p = progresoPiel(estado, datosGlobales);
  return {
    ...p,
    estado: estadoDeEntrada(estado, datosGlobales),
    productos: datosPiel(estado).productos.length,
    nivel: complejidadPiel(respuestaPiel(estado, 'complejidadPiel', datosGlobales).valores[0])?.nombre || null,
    // Los tres que se comparten, para que se vea que no son de aquí.
    compartidas: PREGUNTAS_PIEL.filter((q) => destinoDe(q.id) === 'compartido').length,
  };
}

/**
 * ⚠️ Lo que esta fase NO construye, declarado. El enunciado cierra con *"todavía
 * no implementar esas funciones dentro de esta fase"*, y esto lo hace
 * comprobable en vez de dejarlo a la buena voluntad.
 */
export function auditarPiel() {
  return {
    ...auditarCuestionario(MODULO_PIEL, PREGUNTAS_PIEL),
    preguntas: PREGUNTAS_PIEL.length,
    adaptativas: PREGUNTAS_PIEL.filter((p) => typeof p.cuando === 'function').length,
    secciones: SECCIONES_PIEL.length,
    // Lo que llega después, y en qué fase.
    rutinas: 0,
    seguimiento: 0,
    recomendaciones: 0,
    catalogo: 0,
    packs: 0,
    // Apartado 17.
    usaIA: false,
    perfilesExternos: 0,
    nota: 'Las rutinas, el seguimiento, las recomendaciones y los productos llegan en las fases 14 a 17.',
  };
}

/** Todo lo que la pantalla necesita, en una llamada. */
export function panelPiel(estado, datosGlobales = {}) {
  return {
    estado: estadoDeEntrada(estado, datosGlobales),
    textos: TEXTOS_PIEL,
    secciones: seccionesDePiel(estado, datosGlobales),
    progreso: progresoPiel(estado, datosGlobales),
    yaSabemos: loQueYaSabemosDeTuPiel(estado, datosGlobales).filter((x) => x.contestada),
    productos: datosPiel(estado).productos,
    // ⚠️ Si ha dicho que no usa productos, la pantalla no tiene que deducirlo.
    pideProductos: respuestaPiel(estado, 'usaProductos', datosGlobales).valores[0] !== 'no',
    nota: auditarPiel().nota,
  };
}

export { NO_LO_SE };
