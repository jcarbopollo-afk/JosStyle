// ============================================================================
// EH · Fase 4/65 — SISTEMA DE DATOS, PERFIL Y REUTILIZACIÓN GLOBAL
//
// *"Un dato debe existir una sola vez y poder ser utilizado por todos los
// módulos que lo necesiten."*
//
// ── LA DECISIÓN QUE LO SOSTIENE TODO ───────────────────────────────────────
//
// **Una sola función lee, venga el dato de donde venga.** `leerDato()` resuelve
// igual el peso —que vive en Salud— que el tipo de piel —que vivirá aquí—, y
// devuelve la misma forma. Así, cuando llegue la fase 13 y Skincare necesite
// los dos, **no tendrá que saber cuál es cuál**: si tuviera que distinguirlos,
// tarde o temprano alguien pediría el peso por el camino equivocado y acabaría
// habiendo dos.
//
// Y su gemela: **`guardarDato()` se NIEGA a escribir un dato global** (apartado
// 3). No lo ignora en silencio: devuelve un error que dice dónde se edita. Es la
// regla *"no puede existir Perfil → 72 kg, Estilo de hombre → 70 kg"* escrita
// como código en vez de como recordatorio.
//
// ── LO QUE ESTA FASE NO HACE ───────────────────────────────────────────────
//
// *"No crear todavía todos los campos específicos. Solo preparar la
// arquitectura."* Así que el registro tiene los datos que la propia
// especificación nombra —tipo de piel, tipo de pelo, tallas, preferencias— y
// **ni uno inventado**. Añadir uno nuevo es añadir una línea (apartado 17).
// ============================================================================

import { normalizarEstiloHombre, moduloEH, IDS_EH } from './estiloDeHombre';
import { DATOS_GLOBALES_EH, datoGlobalEH, CLASES_DATO, seDebePreguntar } from './configuracionInicial';
import { todayISO } from './helpers';

/* ===========================================================================
   1 · LAS CATEGORÍAS (apartado 1)
   ===========================================================================
   Las que enumera el enunciado, con sus nombres. Son etiquetas para agrupar en
   una pantalla, igual que las categorías de módulos de la Fase 2: **no tienen
   estado y no se guardan**. */

export const CATEGORIAS_DATO = [
  { id: 'perfil', nombre: 'Perfil', icono: '👤' },
  { id: 'fisico', nombre: 'Características físicas', icono: '📏' },
  { id: 'tallas', nombre: 'Tallas', icono: '👕' },
  { id: 'estilo', nombre: 'Preferencias de estilo', icono: '✨' },
  { id: 'actividad', nombre: 'Actividad', icono: '🏃' },
  { id: 'objetivos', nombre: 'Objetivos', icono: '🎯' },
  { id: 'cuidado', nombre: 'Preferencias de cuidado', icono: '🧴' },
  { id: 'productos', nombre: 'Preferencias de productos', icono: '🛒' },
  { id: 'general', nombre: 'Configuración general', icono: '⚙️' },
];

export const categoriaDato = (id) => CATEGORIAS_DATO.find((c) => c.id === id) || null;

/* ===========================================================================
   2 · EL REGISTRO DE DATOS PROPIOS (apartados 4, 5 y 17)
   ===========================================================================
   *"Sí habrá información que pertenezca exclusivamente a este apartado… Pero
   deben estar organizados por módulo."*

   ⚠️ **Solo están los que la especificación nombra.** Tipo de piel (apartados 6
   y 7), tipo de pelo y preferencia de corte (apartado 4), preferencia de
   textura (apartados 4 y 17), sensibilidad (17), productos sin perfume y ropa
   oversize (5), y la talla de una prenda (4). Ni uno inventado: cada fase
   añadirá los suyos, **y añadir uno es añadir una línea**.

   Cada entrada declara:
   - `categoria` — dónde se agrupa.
   - `clase` — necesario / preferencia / opcional (F3, apartado 11).
   - `usan` — qué módulos lo comparten. ⚠️ **Esto es el apartado 7**: si dos
     módulos declaran el mismo dato, el segundo no lo vuelve a preguntar.
   - `historial` — si guarda su evolución (apartado 9). Casi ninguno la
     necesita, y ponérsela a todos llenaría el guardado de ruido.
   - `privado` — si merece la protección del apartado 11.
   - `desde` — en qué fase empieza a usarse de verdad. */

export const REGISTRO_DATOS = [
  { id: 'tipoPiel', nombre: 'Tipo de piel', categoria: 'cuidado', clase: 'preferencia', usan: ['skincare', 'productos'], historial: false, desde: 13 },
  { id: 'sensibilidadPiel', nombre: 'Sensibilidad de la piel', categoria: 'cuidado', clase: 'preferencia', usan: ['skincare', 'barba', 'productos'], historial: false, desde: 13 },
  { id: 'tipoPelo', nombre: 'Tipo de pelo', categoria: 'cuidado', clase: 'preferencia', usan: ['pelo', 'productos'], historial: false, desde: 7 },
  { id: 'preferenciaCorte', nombre: 'Preferencia de corte', categoria: 'estilo', clase: 'preferencia', usan: ['pelo'], historial: true, desde: 12 },
  { id: 'preferenciaTextura', nombre: 'Preferencia de textura', categoria: 'estilo', clase: 'opcional', usan: ['pelo', 'estilo', 'productos'], historial: false, desde: 12 },
  { id: 'sinPerfume', nombre: 'Productos sin perfume', categoria: 'productos', clase: 'preferencia', usan: ['skincare', 'cuerpo', 'productos'], historial: false, desde: 17 },
  { id: 'ropaOversize', nombre: 'Prefiere ropa oversize', categoria: 'estilo', clase: 'preferencia', usan: ['estilo'], historial: false, desde: 6 },
  { id: 'tallaCamiseta', nombre: 'Talla de camiseta', categoria: 'tallas', clase: 'necesario', usan: ['estilo'], historial: true, desde: 5 },
  { id: 'tallaPantalon', nombre: 'Talla de pantalón', categoria: 'tallas', clase: 'necesario', usan: ['estilo'], historial: true, desde: 5 },
  { id: 'tallaCalzado', nombre: 'Talla de calzado', categoria: 'tallas', clase: 'necesario', usan: ['estilo'], historial: false, desde: 5 },
  // EH F5, apartado 5 — las preferencias de estilo que el Armario NO tiene.
  // ⚠️ Las que sí tiene (marcas, colores y ocasiones de sus prendas y outfits)
  // **no se declaran aquí**: se derivan de él. Declararlas sería el segundo
  // sistema de ropa que prohíbe el encabezado de la Fase 5.
  { id: 'estilosFavoritos', nombre: 'Estilos favoritos', categoria: 'estilo', clase: 'preferencia', usan: ['estilo'], historial: false, desde: 5 },
  { id: 'coloresFavoritos', nombre: 'Colores favoritos', categoria: 'estilo', clase: 'preferencia', usan: ['estilo', 'productos'], historial: false, desde: 5 },
  { id: 'formalidad', nombre: 'Nivel de formalidad habitual', categoria: 'estilo', clase: 'preferencia', usan: ['estilo'], historial: false, desde: 5 },
];

export const datoDelRegistro = (id) => REGISTRO_DATOS.find((d) => d.id === id) || null;
export const IDS_DATOS = REGISTRO_DATOS.map((d) => d.id);

/** Apartado 7 — quién más usa un dato. Si hay más de uno, no se pregunta dos veces. */
export const modulosQueUsan = (id) => datoDelRegistro(id)?.usan || [];

/** Los datos que un módulo necesita, propios y globales, sin que él sepa cuál es cuál. */
export function datosDe(moduloId) {
  return REGISTRO_DATOS.filter((d) => d.usan.includes(moduloId));
}

/* ===========================================================================
   3 · DÓNDE VIVE CADA COSA (apartados 2 y 3)
   ===========================================================================
   *"Si un dato ya existe en JC Fitness, Estilo de hombre no debe crear una
   copia editable independiente."*

   Tres respuestas posibles, y la función lo dice sin rodeos. */

export const ORIGENES_DATO = ['global', 'propio', 'desconocido'];

export function origenDe(id) {
  if (datoGlobalEH(id)) return 'global';
  if (datoDelRegistro(id)) return 'propio';
  return 'desconocido';
}

/* ===========================================================================
   4 · EL ALMACÉN (apartado 5)
   ===========================================================================
   *"Preferencia → categoría → valor → fecha de modificación."*

   ⚠️ **Sexto campo nuevo de este proyecto.** `normalizarEstiloHombre` lo conoce:
   un campo que el normalizador no conoce lo BORRA en el siguiente guardado
   (regla 5). Van seis, y las cuatro primeras se perdieron. */

export const DEFAULT_DATOS_EH = {};   // { [id]: { valor, actualizadoEn, porModulo, historial: [] } }

function normalizarEntrada(guardada) {
  const g = guardada || {};
  return {
    valor: g.valor === undefined ? null : g.valor,
    actualizadoEn: typeof g.actualizadoEn === 'string' ? g.actualizadoEn : null,
    porModulo: IDS_EH.includes(g.porModulo) ? g.porModulo : null,
    historial: (Array.isArray(g.historial) ? g.historial : [])
      .filter((h) => h && typeof h === 'object' && typeof h.fecha === 'string')
      .map((h) => ({ valor: h.valor === undefined ? null : h.valor, fecha: h.fecha })),
  };
}

/**
 * ⚠️ **Un dato que ya no está en el registro NO se borra.** Va tal cual, igual
 * que la cuarentena de módulos de la Fase 2 y por el mismo motivo: el apartado
 * 12 dice que solo se elimina lo que Josué elimine, y el 17 pide que añadir y
 * quitar tipos de dato no rompa nada.
 */
export function normalizarDatosEH(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const out = {};
  Object.keys(g).forEach((k) => { out[k] = normalizarEntrada(g[k]); });
  return out;
}

const datosDeEstado = (estado) => normalizarDatosEH(normalizarEstiloHombre(estado).datos);

/* ===========================================================================
   5 · LEER (apartados 2, 3, 7 y 15)
   ===========================================================================
   ⚠️ **La misma función para todo.** El módulo que la llama no sabe —ni le hace
   falta— si el dato está en Salud o aquí dentro. Eso es lo que impide que dentro
   de cuarenta fases alguien cree "su" copia del peso porque no supo pedirlo. */

export const TEXTO_SIN_DATO = 'Todavía no tienes esta información.';
export const ACCION_ANADIR = 'Añadir ahora';
export const ACCION_MAS_TARDE = 'Más tarde';

/**
 * Devuelve **siempre** la misma forma, y **nunca** `undefined` ni `null` sueltos
 * en los textos (apartado 15: *"Nunca mostrar errores técnicos al usuario"*).
 */
export function leerDato(estado, id, datosGlobales = {}) {
  const global = datoGlobalEH(id);

  if (global) {
    let valor = null;
    try { valor = global.leer(datosGlobales); } catch { valor = null; }
    const tiene = valor !== null && valor !== '' && valor !== 0;
    return {
      id,
      nombre: global.que,
      origen: 'global',
      valor: tiene ? valor : null,
      tiene,
      // ⚠️ Apartado 3 — aquí no se edita. Se dice dónde.
      editableAqui: false,
      donde: global.donde,
      texto: tiene ? String(valor) : TEXTO_SIN_DATO,
      actualizadoEn: null,
      privado: false,
    };
  }

  const cat = datoDelRegistro(id);
  const entrada = datosDeEstado(estado)[id];
  const tiene = !!entrada && entrada.valor !== null && entrada.valor !== '';
  return {
    id,
    nombre: cat ? cat.nombre : id,
    origen: cat ? 'propio' : 'desconocido',
    valor: tiene ? entrada.valor : null,
    tiene,
    // Apartado 8 — *"Nunca bloquear la información introducida."*
    editableAqui: true,
    donde: 'Estilo de hombre',
    texto: tiene ? String(entrada.valor) : TEXTO_SIN_DATO,
    actualizadoEn: entrada ? entrada.actualizadoEn : null,
    privado: !!cat?.privado,
  };
}

/**
 * Apartado 6 — *"Cuando un módulo necesite un dato que todavía no existe, debe
 * poder solicitarlo."* Esto es lo que la pantalla enseña en ese caso: nunca un
 * `undefined`, siempre una frase y dos salidas.
 */
export function solicitarDato(estado, id, datosGlobales = {}) {
  const d = leerDato(estado, id, datosGlobales);
  if (d.tiene) return null;                       // no hay nada que pedir
  if (d.origen === 'global') {
    // ⚠️ No se pide aquí: se dice dónde se rellena. Pedirlo aquí crearía la
    // copia que prohíbe el apartado 3.
    return { id, texto: TEXTO_SIN_DATO, aqui: false, donde: d.donde, acciones: [ACCION_MAS_TARDE] };
  }
  return { id, nombre: d.nombre, texto: TEXTO_SIN_DATO, aqui: true, donde: null, acciones: [ACCION_ANADIR, ACCION_MAS_TARDE] };
}

/* ===========================================================================
   6 · ESCRIBIR (apartados 3, 5, 9 y 10)
   =========================================================================== */

export const MOTIVOS_RECHAZO_DATO = {
  global: 'Ese dato vive fuera de Estilo de hombre y se edita allí.',
  desconocido: 'Ese dato no está en el registro.',
};

/**
 * ⚠️ **Se niega a escribir un dato global.** El apartado 3 lo dice con un
 * ejemplo: *"No puede existir Perfil → 72 kg, Estilo de hombre → 70 kg"*.
 *
 * Y no falla en silencio: devuelve `error` y `donde`, para que la pantalla
 * pueda mandar a Josué al sitio correcto en vez de tragarse el guardado.
 */
export function guardarDato(estado, id, valor, { modulo = null, hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  const origen = origenDe(id);

  if (origen !== 'propio') {
    return {
      estado: e,
      error: MOTIVOS_RECHAZO_DATO[origen],
      donde: origen === 'global' ? datoGlobalEH(id).donde : null,
    };
  }

  const cat = datoDelRegistro(id);
  const datos = normalizarDatosEH(e.datos);
  const previo = datos[id] || normalizarEntrada(null);

  // Apartado 9 — historial solo donde el registro lo pide.
  const historial = cat.historial && previo.valor !== null && previo.valor !== valor
    ? [...previo.historial, { valor: previo.valor, fecha: previo.actualizadoEn || hoy }]
    : previo.historial;

  return {
    estado: {
      ...e,
      datos: {
        ...datos,
        // Apartado 10 — la fecha de actualización, para poder decir después
        // "actualizado hace 3 meses".
        [id]: { valor, actualizadoEn: hoy, porModulo: IDS_EH.includes(modulo) ? modulo : previo.porModulo, historial },
      },
    },
    error: null,
    donde: null,
  };
}

/**
 * Apartado 12 — *"Si el usuario elimina un dato propio… No eliminar datos
 * globales de JC Fitness desde aquí."*
 *
 * ⚠️ Con el historial: borrar un dato y dejar su rastro sería no borrarlo.
 */
export function eliminarDato(estado, id) {
  const e = normalizarEstiloHombre(estado);
  const origen = origenDe(id);
  if (origen === 'global') {
    return { estado: e, error: 'Ese dato es de JosStyle y no se borra desde aquí.', donde: datoGlobalEH(id).donde };
  }
  const datos = normalizarDatosEH(e.datos);
  if (!(id in datos)) return { estado: e, error: null, donde: null, sinEfecto: true };
  const { [id]: quitado, ...resto } = datos;
  return { estado: { ...e, datos: resto }, error: null, donde: null, sinEfecto: false };
}

/** Apartado 9 — la evolución, para los datos que la tengan declarada. */
export function historialDe(estado, id) {
  const cat = datoDelRegistro(id);
  if (!cat || !cat.historial) return [];
  const entrada = datosDeEstado(estado)[id];
  if (!entrada) return [];
  return [...entrada.historial, ...(entrada.valor !== null ? [{ valor: entrada.valor, fecha: entrada.actualizadoEn }] : [])];
}

/* ===========================================================================
   7 · ANTIGÜEDAD (apartado 10)
   ===========================================================================
   *"Tipo de piel — Actualizado hace 3 meses. Esto permitirá posteriormente
   detectar información posiblemente antigua."*

   ⚠️ **Detectar, no juzgar.** Devuelve los días y una frase; no dice "deberías
   actualizarlo". Esa es la misma línea que se trazó en la analítica del Horario
   (HT F11): describir, no reprochar. */

export const DIAS_POSIBLEMENTE_ANTIGUO = 180;

export function antiguedadDato(estado, id, { hoy = todayISO() } = {}) {
  const entrada = datosDeEstado(estado)[id];
  if (!entrada || !entrada.actualizadoEn) return { dias: null, texto: '', antiguo: false };
  const dias = Math.max(0, Math.round((new Date(`${hoy}T00:00:00`) - new Date(`${entrada.actualizadoEn}T00:00:00`)) / 86400000));
  const meses = Math.floor(dias / 30);
  let texto;
  if (dias === 0) texto = 'Actualizado hoy';
  else if (dias === 1) texto = 'Actualizado ayer';
  else if (dias < 30) texto = `Actualizado hace ${dias} días`;
  else if (meses === 1) texto = 'Actualizado hace 1 mes';
  else if (meses < 12) texto = `Actualizado hace ${meses} meses`;
  else texto = `Actualizado hace más de ${Math.floor(dias / 365)} ${Math.floor(dias / 365) === 1 ? 'año' : 'años'}`;
  return { dias, texto, antiguo: dias >= DIAS_POSIBLEMENTE_ANTIGUO };
}

/* ===========================================================================
   8 · DEPENDENCIAS (apartado 14)
   ===========================================================================
   *"Productos → necesita preferencias de Skincare. Si Skincare está desactivado:
   NO debe romper Productos."*

   ⚠️ Y esa es la palabra que importa: **no romper**. Lo que devuelve esto no es
   un error, es la frase que el enunciado escribe: *"Añade tus preferencias de
   piel para personalizar estas recomendaciones."* */

export function dependenciasDe(moduloId) {
  // Un módulo depende de otro si comparten un dato que el otro también usa.
  const mios = datosDe(moduloId).map((d) => d.id);
  const otros = new Set();
  mios.forEach((id) => modulosQueUsan(id).forEach((m) => { if (m !== moduloId) otros.add(m); }));
  return [...otros];
}

/**
 * El estado de un dato que un módulo necesita: lo tiene, no lo tiene, o lo
 * tiene otro módulo que está apagado. **Ninguno de los tres es un error.**
 */
export function estadoDependencia(estado, moduloId, datoId, datosGlobales = {}) {
  const e = normalizarEstiloHombre(estado);
  const d = leerDato(e, datoId, datosGlobales);
  const cat = datoDelRegistro(datoId);
  if (d.tiene) return { listo: true, texto: '', accion: null };

  // ⚠️ El dato sigue disponible aunque el módulo que lo suele rellenar esté
  // apagado: los datos no dependen de que su módulo esté encendido (apartado 13).
  const nombreDato = (cat ? cat.nombre : d.nombre).toLowerCase();
  return {
    listo: false,
    texto: d.origen === 'global'
      ? `Añade ${nombreDato} en ${d.donde} para personalizar esto.`
      : `Añade ${nombreDato} para personalizar esto.`,
    accion: d.origen === 'global' ? null : ACCION_ANADIR,
  };
}

/** Lo que le falta a un módulo para dar recomendaciones completas. Sin romperse. */
export function loQueLeFalta(estado, moduloId, datosGlobales = {}) {
  return datosDe(moduloId)
    .map((d) => ({ id: d.id, nombre: d.nombre, clase: d.clase, ...estadoDependencia(estado, moduloId, d.id, datosGlobales) }))
    .filter((d) => !d.listo);
}

/* ===========================================================================
   9 · PRIVACIDAD (apartado 11)
   ===========================================================================
   *"Cuando un módulo utilice un dato compartido: no debe crear una copia
   innecesaria. Además, si un dato es especialmente privado, deberá seguir las
   protecciones que ya existan en la aplicación."*

   Hoy **ningún dato del registro está marcado como privado**, y decirlo es más
   honesto que fingir un sistema de protección que no protege nada todavía. Lo
   que sí existe es el filtro, para que la fase que marque uno no tenga que
   construirlo — y para que nadie mande a la IA algo que no debe. */

export function datosCompartibles(estado, datosGlobales = {}) {
  return REGISTRO_DATOS
    .filter((d) => !d.privado)
    .map((d) => leerDato(estado, d.id, datosGlobales))
    .filter((d) => d.tiene);
}

export const datosPrivados = () => REGISTRO_DATOS.filter((d) => d.privado).map((d) => d.id);

/* ===========================================================================
   10 · VISTA DE CONJUNTO
   =========================================================================== */

/** Todo lo que sabemos, propio y global, agrupado por categoría. Para "Mis datos". */
export function todosLosDatos(estado, datosGlobales = {}) {
  const propios = REGISTRO_DATOS.map((d) => ({ ...leerDato(estado, d.id, datosGlobales), categoria: d.categoria, clase: d.clase }));
  const globales = DATOS_GLOBALES_EH.map((d) => ({ ...leerDato(estado, d.campo, datosGlobales), categoria: 'perfil', clase: 'necesario' }));
  const todos = [...globales, ...propios];
  return CATEGORIAS_DATO
    .map((c) => ({ ...c, datos: todos.filter((d) => d.categoria === c.id) }))
    .filter((c) => c.datos.length > 0);
}

export function resumenDatos(estado, datosGlobales = {}) {
  const propios = REGISTRO_DATOS.map((d) => leerDato(estado, d.id, datosGlobales));
  const globales = DATOS_GLOBALES_EH.map((d) => leerDato(estado, d.campo, datosGlobales));
  const antiguos = REGISTRO_DATOS.filter((d) => antiguedadDato(estado, d.id).antiguo);
  return {
    propios: propios.filter((d) => d.tiene).length,
    propiosTotal: REGISTRO_DATOS.length,
    globales: globales.filter((d) => d.tiene).length,
    globalesTotal: DATOS_GLOBALES_EH.length,
    // ⚠️ Cuántos se reutilizan entre módulos: es el apartado 7 en una cifra.
    compartidos: REGISTRO_DATOS.filter((d) => d.usan.length > 1).length,
    antiguos: antiguos.length,
    conHistorial: REGISTRO_DATOS.filter((d) => d.historial).length,
    privados: datosPrivados().length,
  };
}

/**
 * ⚠️ Apartado 7 en código — *"¿Qué tipo de piel tienes?" … "Ya tenemos ese
 * dato"*. Un módulo pregunta antes de preguntar.
 */
export function hayQuePreguntar(estado, id, datosGlobales = {}) {
  const origen = origenDe(id);
  if (origen === 'global') return seDebePreguntar(id, datosGlobales);
  const d = leerDato(estado, id, datosGlobales);
  if (d.tiene) {
    const otros = modulosQueUsan(id).map((m) => moduloEH(m)?.nombre).filter(Boolean);
    return {
      preguntar: false,
      motivo: otros.length > 1 ? `Ya lo tenemos, y lo comparten ${otros.join(' y ')}.` : 'Ya lo tenemos.',
      donde: 'Estilo de hombre',
      valor: d.valor,
    };
  }
  return { preguntar: true, motivo: 'Todavía no lo has indicado.', donde: null };
}

/** Las clases de dato vienen de la Fase 3: no se redefinen aquí. */
export { CLASES_DATO };
