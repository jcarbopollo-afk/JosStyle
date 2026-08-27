// ============================================================================
// EH · Fase 1/65 — ARQUITECTURA BASE Y SISTEMA MODULAR
//
// *"Esta fase debe preparar la infraestructura para que las siguientes fases
// puedan añadir funcionalidades sin duplicar sistemas existentes."*
//
// Es el primer archivo del último bloque de la Entrega 2, y el más grande: 65
// fases van a colgar de aquí. Así que lo único que importa de verdad es que
// **añadir un módulo nuevo sea añadir una línea a una lista**, no editar seis
// archivos (apartado 11: *"no crear una solución rígida del tipo `if skincare…
// if hair… if fitness…`"*).
//
// ── LAS CUATRO REGLAS QUE SOSTIENEN LAS 64 FASES SIGUIENTES ────────────────
//
// **1. Desactivar NO borra** (apartado 7). *"Simplemente `activo = false`. Si
// posteriormente vuelve a activarlo, sus datos siguen ahí."* Es la promesa que
// hace que Josué se atreva a probar módulos, y la que más fácil se rompe: basta
// con que una fase futura "limpie" al desactivar.
//
// **2. Estilo de Hombre NO copia los datos globales** (apartado 10). Peso,
// perfil, objetivos, sueño, entrenamientos, calendario y rachas **ya existen**
// en JosStyle. Cuando una fase futura los necesite, los LEE. Copiarlos daría dos
// pesos distintos el día que se corrija uno.
//
// **3. Un módulo nuevo no rompe los que hay** (apartado 15, test 7). Los
// módulos guardados que ya no existen en el catálogo se descartan al cargar, y
// los del catálogo que no están en lo guardado aparecen apagados. Ninguna de las
// dos cosas revienta.
//
// **4. La barra inferior sigue con cinco pestañas** (regla 10 del proyecto).
// Estilo de Hombre entra en un área existente, no en la barra.
//
// ── LO QUE ESTA FASE NO HACE, Y ESTÁ DICHO EN EL ENUNCIADO ─────────────────
//
// *"MUY IMPORTANTE. En esta fase NO desarrollar todavía: Skincare, Pelo, Barba,
// Productos, Hábitos, Rutinas, Salud, Educación, Wearables, Recomendaciones,
// Afiliados, etc."* Aquí solo está la infraestructura. Los módulos son **fichas
// con nombre e icono**, sin una sola pantalla propia.
// ============================================================================

import { todayISO } from './helpers';

/* ===========================================================================
   1 · EL CATÁLOGO
   ===========================================================================
   *"Estos módulos son la estructura inicial. Las funcionalidades internas se
   desarrollarán en fases posteriores."*

   ⚠️ **Añadir un módulo es añadir una línea aquí.** Nada más. Ni un `if`, ni
   una pantalla, ni tocar el normalizador: es lo que pide el apartado 11 y lo
   que tiene que seguir siendo verdad dentro de sesenta fases.

   `fase` dice en cuál se construye su contenido. No es decoración: es lo que
   permite que la pantalla diga la verdad sobre lo que todavía está vacío, en
   vez de enseñar una plaquita que no lleva a ninguna parte (regla 8). */

/* ── Las categorías (EH F2, apartado 3) ────────────────────────────────────
   *"Como habrá muchos módulos, no queremos una lista interminable."* Y a
   renglón seguido: *"Estas categorías son principalmente organizativas. No
   deben convertirse en sistemas duplicados."*

   Por eso son una etiqueta en el catálogo y **nada más**: no tienen estado, no
   se guardan, no se activan ni se desactivan. Una categoría sin módulos
   simplemente no se pinta. */
export const CATEGORIAS_EH = [
  { id: 'estilo', nombre: 'Estilo', icono: '👕' },
  { id: 'cuidado', nombre: 'Cuidado', icono: '🧴' },
  { id: 'fisico', nombre: 'Físico', icono: '🏋️' },
  { id: 'salud', nombre: 'Salud', icono: '❤️' },
  { id: 'bienestar', nombre: 'Bienestar', icono: '🧠' },
  { id: 'conocimiento', nombre: 'Conocimiento', icono: '📚' },
  { id: 'compras', nombre: 'Compras', icono: '🛒' },
];

export const categoriaEH = (id) => CATEGORIAS_EH.find((c) => c.id === id) || null;

/* ⚠️ **Cada módulo lleva TODO lo suyo en su línea**, y esa es la razón de que
   la Fase 2 pudiera añadir categoría, confirmación, recomendación y términos de
   búsqueda **sin tocar nada más que estas trece líneas**.

   Un segundo mapa `id → categoría` en otro archivo sería exactamente la "base
   de datos duplicada" que prohíbe el apartado 15 de la Fase 2, y se separaría
   de esta el día que alguien añada un módulo y se olvide del otro sitio.

   - `categoria` — para agrupar en Gestionar apartados (F2, apartado 3).
   - `confirmar` — si al apagarlo hay que preguntar (F2, apartado 6).
   - `recomendado` — si aparece en "También puedes añadir" (F2, apartado 11).
   - `terminos` — sinónimos para el buscador (F2, apartado 12). Por eso "pelo"
     encuentra también Barba, que es el ejemplo literal del enunciado. */
export const MODULOS_EH = [
  { id: 'estilo', nombre: 'Estilo y armario', icono: '👕', sub: 'Cómo vestir', fase: 2, categoria: 'estilo', confirmar: true, terminos: ['ropa', 'armario', 'outfit', 'vestir', 'prendas', 'moda'] },
  { id: 'pelo', nombre: 'Pelo', icono: '💇', sub: 'Corte y cuidado', fase: 12, categoria: 'estilo', confirmar: true, terminos: ['pelo', 'cabello', 'corte', 'peluqueria', 'peluquería', 'champu', 'champú'] },
  { id: 'barba', nombre: 'Barba', icono: '🧔', sub: 'Afeitado y forma', fase: 15, categoria: 'estilo', confirmar: true, terminos: ['barba', 'pelo', 'afeitado', 'afeitar', 'bigote', 'cuchilla'] },
  { id: 'skincare', nombre: 'Skincare', icono: '🧴', sub: 'Mi cuidado facial', fase: 6, categoria: 'cuidado', confirmar: true, recomendado: true, terminos: ['piel', 'cara', 'facial', 'crema', 'acne', 'acné', 'rutina'] },
  { id: 'higiene', nombre: 'Higiene', icono: '🧼', sub: 'Rutina diaria', fase: 18, categoria: 'cuidado', terminos: ['higiene', 'ducha', 'dientes', 'boca', 'manos', 'uñas', 'unas'] },
  { id: 'cuerpo', nombre: 'Cuidado corporal', icono: '🧍', sub: 'De cuello para abajo', fase: 21, categoria: 'cuidado', terminos: ['cuerpo', 'corporal', 'piel', 'desodorante', 'perfume', 'colonia'] },
  { id: 'fitness', nombre: 'Fitness', icono: '🏋️', sub: 'Físico y postura', fase: 26, categoria: 'fisico', terminos: ['fisico', 'físico', 'postura', 'entrenar', 'gimnasio', 'musculo', 'músculo'] },
  { id: 'sueno', nombre: 'Sueño', icono: '😴', sub: 'Descanso y aspecto', fase: 30, categoria: 'fisico', terminos: ['sueño', 'sueno', 'dormir', 'descanso', 'ojeras', 'cansancio'] },
  { id: 'salud', nombre: 'Salud', icono: '🧬', sub: 'Lo que se nota fuera', fase: 33, categoria: 'salud', confirmar: true, terminos: ['salud', 'medico', 'médico', 'revision', 'revisión', 'dental', 'vista'] },
  { id: 'habitos', nombre: 'Hábitos y rutinas', icono: '🧠', sub: 'Lo de cada día', fase: 37, categoria: 'bienestar', recomendado: true, terminos: ['habito', 'hábito', 'habitos', 'hábitos', 'rutina', 'rutinas', 'constancia'] },
  { id: 'progreso', nombre: 'Progreso', icono: '📊', sub: 'Cómo vas', fase: 45, categoria: 'bienestar', confirmar: true, terminos: ['progreso', 'evolucion', 'evolución', 'fotos', 'estadisticas', 'estadísticas'] },
  { id: 'educacion', nombre: 'Educación', icono: '📚', sub: 'Aprender a cuidarte', fase: 50, categoria: 'conocimiento', recomendado: true, terminos: ['educacion', 'educación', 'guias', 'guías', 'aprender', 'consejos'] },
  { id: 'productos', nombre: 'Productos', icono: '🛒', sub: 'Lo que usas', fase: 55, categoria: 'compras', confirmar: true, terminos: ['productos', 'comprar', 'compras', 'marcas', 'farmacia'] },
];

export const moduloEH = (id) => MODULOS_EH.find((m) => m.id === id) || null;
export const IDS_EH = MODULOS_EH.map((m) => m.id);

/* ===========================================================================
   2 · LA CONFIGURACIÓN
   ===========================================================================
   *"Identificador del módulo, nombre, estado activo/inactivo, orden,
   configuración específica futura, versión del módulo si fuera necesaria."*
   (apartado 8)

   ⚠️ **El nombre NO se guarda**, aunque el enunciado lo liste: está en el
   catálogo, y guardarlo daría dos nombres distintos el día que se corrija una
   errata. Se guarda el `id`, que es lo único que no se puede deducir.

   Y `config` existe vacío desde hoy (apartado 8: *"configuración específica
   futura"*): es lo que permite que la Fase 6 le añada sus ajustes a Skincare
   sin cambiar esta forma. */

export const VERSION_EH = 1;

export const DEFAULT_ESTILO_HOMBRE = {
  configurado: false,       // ¿ha pasado ya por la primera configuración?
  modulos: [],              // [{ id, activo, orden, config, version }]
  // ⚠️ EH F2, apartado 17 — la cuarentena. Ver `normalizarEstiloHombre`.
  retirados: [],            // módulos guardados que ya no están en el catálogo
  // ⚠️ EH F3, apartado 15 — por dónde va el asistente de primera configuración.
  // Solo el paso y la selección en curso: lo que ya sabemos de Josué se LEE de
  // su módulo, no se copia aquí (apartado 7).
  asistente: { paso: null, seleccion: [], estado: 'nunca', empezadoEn: null, terminadoEn: null },
  // ⚠️ EH F4 — la capa de datos compartidos. Aquí SOLO van los datos propios de
  // Estilo de Hombre (tipo de piel, tallas, preferencias). Lo que ya existe en
  // JosStyle —peso, altura, nombre— NO se copia nunca (apartado 3).
  datos: {},
  version: VERSION_EH,
  creadoEn: null,
};

function normalizarModulo(guardado, i) {
  const g = guardado || {};
  return {
    id: g.id,
    activo: g.activo !== false,
    orden: Number.isFinite(Number(g.orden)) ? Number(g.orden) : i,
    // Apartado 8 — el hueco para lo que venga, sin tener que migrar nada.
    config: g.config && typeof g.config === 'object' ? g.config : {},
    version: Number.isFinite(Number(g.version)) ? Number(g.version) : 1,
  };
}

/**
 * ⚠️ **El apartado 15, test 7, hecho código**: *"añadir un módulo nuevo
 * posteriormente no debe romper los existentes"*.
 *
 * Lo guardado que ya no está en el catálogo **sale de la lista** (un módulo que
 * se retiró: nadie sabría pintarlo), y lo del catálogo que no está guardado
 * **aparece apagado** (uno que se añadió después). Las dos cosas pasan solas,
 * sin migración.
 *
 * ⚠️⚠️ **EH F2, apartado 17 — "Módulo eliminado del catálogo en una futura
 * actualización: los datos NO deben borrarse automáticamente."**
 *
 * En la Fase 1 el módulo retirado se descartaba entero, y con la regla 5 del
 * proyecto (*`saveData` sobrescribe, no fusiona*) eso significaba que **el
 * siguiente guardado se llevaba su `config` para siempre**. Es la cuarta vez que
 * aparece el mismo fallo del normalizador en este proyecto, y esta vez lo dice
 * la propia especificación antes de que ocurra.
 *
 * Ahora va a `retirados`: fuera de la lista que se pinta, pero guardado. Si el
 * módulo vuelve al catálogo, `restaurarRetirados` lo devuelve con sus datos.
 *
 * ⚠️ **Y se quitan los duplicados** (apartado 17: *"usuario pulsa muchas veces
 * rápidamente → no debe duplicar módulos"*). **Manda la última entrada** —que es
 * la intención más reciente— pero las `config` de todas **se fusionan**: perder
 * ajustes por un guardado a medias es justo lo que este bloque intenta evitar.
 * El sitio en la lista sigue siendo el de la primera, para que reordenar y
 * deduplicar no se peleen.
 */
function deduplicar(lista) {
  const porId = new Map();
  lista.forEach((m) => {
    const previo = porId.get(m.id);
    if (!previo) { porId.set(m.id, m); return; }
    porId.set(m.id, { ...m, config: { ...previo.config, ...m.config } });
  });
  return [...porId.values()];
}

export function normalizarEstiloHombre(guardado) {
  const g = guardado || {};
  const todos = deduplicar((Array.isArray(g.modulos) ? g.modulos : [])
    .map(normalizarModulo)
    .filter((m) => typeof m.id === 'string' && m.id));

  const guardados = todos.filter((m) => IDS_EH.includes(m.id));
  const fuera = todos.filter((m) => !IDS_EH.includes(m.id));

  const vistos = new Set(guardados.map((m) => m.id));
  const nuevos = MODULOS_EH
    .filter((m) => !vistos.has(m.id))
    // Un módulo que aparece en una fase futura nace APAGADO: encenderlo solo
    // sería decidir por Josué qué quiere usar.
    .map((m, i) => ({ id: m.id, activo: false, orden: guardados.length + i, config: {}, version: 1 }));

  // La cuarentena arrastra lo que ya hubiera, sin volver a meterlo en la lista.
  const previos = deduplicar((Array.isArray(g.retirados) ? g.retirados : [])
    .map(normalizarModulo)
    .filter((m) => typeof m.id === 'string' && m.id && !IDS_EH.includes(m.id)));

  return {
    configurado: !!g.configurado,
    modulos: [...guardados, ...nuevos],
    retirados: deduplicar([...previos, ...fuera]),
    // ⚠️ EH F3 — quinta vez que se añade un campo a una entidad de este
    // proyecto, y la primera en que no se olvida el normalizador. La forma la
    // decide `normalizarAsistente` en `configuracionInicial.js`; aquí solo se
    // arrastra tal cual para no importar en círculo. Un campo que el
    // normalizador no conoce lo BORRA en el siguiente guardado (regla 5).
    asistente: g.asistente && typeof g.asistente === 'object'
      ? g.asistente
      : { ...DEFAULT_ESTILO_HOMBRE.asistente },
    // ⚠️ EH F4 — sexto campo. La forma la decide `normalizarDatosEH` en
    // `datosEstiloHombre.js`; aquí solo se arrastra, para no importar en
    // círculo. Un campo que el normalizador no conoce se pierde (regla 5).
    datos: g.datos && typeof g.datos === 'object' && !Array.isArray(g.datos) ? g.datos : {},
    version: VERSION_EH,
    creadoEn: g.creadoEn || null,
  };
}

/**
 * Apartado 17 — si un módulo retirado vuelve al catálogo, **vuelve con sus
 * datos**, no desde cero. Se llama sola desde `normalizarEstiloHombre`… no:
 * se llama a mano, porque devolver datos a la lista es una decisión, no una
 * limpieza. La pantalla la ofrece cuando `retiradosQueVuelven` no está vacío.
 */
export function retiradosQueVuelven(estado) {
  const g = estado || {};
  return (Array.isArray(g.retirados) ? g.retirados : []).filter((m) => IDS_EH.includes(m?.id));
}

export function restaurarRetirados(estado) {
  const g = estado || {};
  const vuelven = retiradosQueVuelven(g);
  if (vuelven.length === 0) return normalizarEstiloHombre(g);
  return normalizarEstiloHombre({
    ...g,
    modulos: [...(Array.isArray(g.modulos) ? g.modulos : []), ...vuelven],
    retirados: (Array.isArray(g.retirados) ? g.retirados : []).filter((m) => !IDS_EH.includes(m?.id)),
  });
}

/* ===========================================================================
   3 · LEER EL ESTADO
   =========================================================================== */

/** Los módulos activos, en su orden, con los datos del catálogo ya puestos. */
export function modulosActivos(estado) {
  const e = normalizarEstiloHombre(estado);
  return e.modulos
    .filter((m) => m.activo)
    .sort((a, b) => a.orden - b.orden)
    .map((m) => ({ ...moduloEH(m.id), ...m }));
}

/** Todos, activos o no — para la pantalla de gestionar. */
export function todosLosModulos(estado) {
  const e = normalizarEstiloHombre(estado);
  return MODULOS_EH.map((cat) => {
    const guardado = e.modulos.find((m) => m.id === cat.id);
    return { ...cat, ...(guardado || { activo: false, orden: 99, config: {}, version: 1 }) };
  }).sort((a, b) => a.orden - b.orden);
}

export const estaActivo = (estado, id) => modulosActivos(estado).some((m) => m.id === id);

/* ===========================================================================
   4 · ESCRIBIR
   ===========================================================================
   ⚠️ **Ninguna de estas funciones borra datos de un módulo.** Es el apartado 7,
   y es la regla que hay que releer antes de tocar este archivo en cualquiera de
   las 64 fases siguientes. */

/**
 * Apartados 3 y 4 — la primera configuración. Marca `configurado`, que es lo
 * que hace que la pantalla deje de ofrecer el asistente.
 */
export function configurarPrimeraVez(estado, ids = [], { hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  const elegidos = (Array.isArray(ids) ? ids : []).filter((id) => IDS_EH.includes(id));
  return {
    ...e,
    configurado: true,
    creadoEn: e.creadoEn || hoy,
    modulos: e.modulos.map((m) => ({
      ...m,
      activo: elegidos.includes(m.id),
      // El orden inicial es el que eligió, no el del catálogo.
      orden: elegidos.includes(m.id) ? elegidos.indexOf(m.id) : m.orden,
    })),
  };
}

/**
 * Apartado 7 — activar y desactivar. ⚠️ **`config` se conserva siempre**: es la
 * mitad de "desactivar no borra". La otra mitad es que los datos del módulo
 * viven en su propia clave y nadie los toca aquí.
 */
export function alternarModulo(estado, id, activo = null) {
  const e = normalizarEstiloHombre(estado);
  if (!IDS_EH.includes(id)) return e;
  return {
    ...e,
    modulos: e.modulos.map((m) => (m.id === id
      ? { ...m, activo: activo === null ? !m.activo : !!activo }
      : m)),
  };
}

/** Apartado 9 — el orden de las plaquitas. La arquitectura ya lo soporta. */
export function reordenar(estado, ordenIds = []) {
  const e = normalizarEstiloHombre(estado);
  const orden = (Array.isArray(ordenIds) ? ordenIds : []).filter((id) => IDS_EH.includes(id));
  return {
    ...e,
    // ⚠️ Un módulo que no venga en el orden NO desaparece: se queda detrás.
    // Es el mismo fallo que HT F4 tuvo con las columnas.
    modulos: e.modulos.map((m) => ({
      ...m,
      orden: orden.includes(m.id) ? orden.indexOf(m.id) : orden.length + e.modulos.findIndex((x) => x.id === m.id),
    })),
  };
}

/**
 * Apartado 8 — la configuración específica de cada módulo, para las fases que
 * vienen. Se fusiona, no se sustituye: una fase que guarde su ajuste no puede
 * borrar el de otra.
 */
export function guardarConfig(estado, id, config = {}) {
  const e = normalizarEstiloHombre(estado);
  if (!IDS_EH.includes(id)) return e;
  return {
    ...e,
    modulos: e.modulos.map((m) => (m.id === id ? { ...m, config: { ...m.config, ...config } } : m)),
  };
}

/* ===========================================================================
   5 · LA CONEXIÓN CON JOSSTYLE (apartado 10)
   ===========================================================================
   *"Estilo de hombre NO debe crear una copia de los datos globales."*

   Esto **no lee nada todavía** —no hace falta en la Fase 1— pero declara **de
   dónde saldrá cada cosa** cuando haga falta. Es lo que impide que la Fase 26
   cree su propio registro de peso porque no supo que ya había uno. */

export const FUENTES_GLOBALES = {
  peso: { modulo: 'salud', clave: 'salud', que: 'Las medidas de Salud' },
  perfil: { modulo: 'perfil', clave: 'perfil', que: 'El perfil de Josué' },
  objetivos: { modulo: 'objetivos', clave: 'objetivos', que: 'Los objetivos largos' },
  entrenamientos: { modulo: 'entreno', clave: 'calistenia', que: 'Las sesiones de calistenia' },
  sueno: { modulo: 'sueno', clave: 'sueno', que: 'El registro de sueño' },
  nutricion: { modulo: 'nutricion', clave: 'nutricion', que: 'Las comidas y el agua' },
  diario: { modulo: 'diario', clave: 'diario', que: 'Las entradas del diario' },
  calendario: { modulo: 'calendario', clave: 'calendario', que: 'El calendario universal' },
  rachas: { modulo: 'rachas', clave: 'rachas', que: 'Las rachas (RA F1-F4)' },
  armario: { modulo: 'armario', clave: 'armario', que: 'Las prendas y outfits (AR F1-F4)' },
};

export const fuenteDe = (id) => FUENTES_GLOBALES[id] || null;

/**
 * ⚠️ La comprobación que evita el error del apartado 10: si una fase futura
 * declara que va a guardar algo que **ya existe fuera**, esto lo dice.
 */
export function esDatoGlobal(nombre) {
  const n = (nombre || '').toLowerCase();
  const encontrado = Object.entries(FUENTES_GLOBALES).find(([k]) => n.includes(k));
  return encontrado ? { global: true, ...encontrado[1], campo: encontrado[0] } : { global: false };
}

/* ===========================================================================
   6 · LOS ESTADOS DE LA PANTALLA (apartado 13)
   ===========================================================================
   *"Usuario sin módulos · Usuario con módulos · Módulo desactivado."*

   Se calcula aquí y no en la vista para que se pueda probar: una pantalla que
   decide su propio estado con tres `if` encadenados es donde aparece el cuarto
   caso que nadie contempló. */

export const ESTADOS_PANTALLA = ['sin_configurar', 'sin_modulos', 'con_modulos'];

export function estadoPantalla(estado) {
  const e = normalizarEstiloHombre(estado);
  if (!e.configurado) return 'sin_configurar';
  return modulosActivos(e).length === 0 ? 'sin_modulos' : 'con_modulos';
}

/* ===========================================================================
   7 · RESUMEN
   =========================================================================== */
export function resumenEstiloHombre(estado) {
  const e = normalizarEstiloHombre(estado);
  const activos = modulosActivos(e);
  return {
    configurado: e.configurado,
    estado: estadoPantalla(e),
    activos: activos.length,
    total: MODULOS_EH.length,
    apagados: MODULOS_EH.length - activos.length,
    // ⚠️ Cuántos de los activos tienen contenido de verdad. Hoy: ninguno, y la
    // pantalla lo dice en vez de enseñar plaquitas que no llevan a nada.
    conContenido: 0,
    proximaFase: Math.min(...MODULOS_EH.map((m) => m.fase)),
  };
}
