// ============================================================================
// EH · Fase 41/65 — ESTADOS VACÍOS, CARGA, ERRORES Y RECUPERACIÓN
//
// *"Hacer que Estilo de hombre nunca parezca roto, aunque no haya datos, falle
// una conexión o algo tarde en cargar. La regla: **todo estado debe tener una
// respuesta clara**."*
//
// Y la condición de finalización: *"El usuario siempre sabrá **qué ha pasado →
// qué puede hacer → qué ha ocurrido con sus datos**."* Por eso cada línea de
// `ESTADOS_EH` tiene exactamente esas tres cosas.
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ UN ESTADO ES UNA LÍNEA, NO UN `if` EN UNA PANTALLA.** `ESTADOS_EH` es
// una línea por apartado con su icono, su título, su explicación y **sus
// opciones**; y `COLECCIONES_EH`, una línea por lista con su vacío y su
// "+ Añadir". Una pantalla que quiera decir *"todavía no tienes nada"* llama
// aquí. Si cada una escribiera el suyo, la mitad acabaría sin botón.
//
// **2. ⚠️ TRES DE LOS ESTADOS DEL ENUNCIADO NO SE PUEDEN DETECTAR HOY, Y SE
// DICE.** El error de guardado (6), el estado de la sincronización (8) y el
// conflicto entre dispositivos (9) necesitan algo que **JosStyle no tiene**:
// `saveData` se traga su error y sube sin leer la versión de antes, así que
// desde aquí no hay forma de saber que algo falló ni de ver dos versiones. Se
// declaran con `detectable: false` y su motivo, en vez de pintar un aviso que no
// aparecería nunca (regla 8) — el mismo criterio que la F39 con los favoritos
// globales. **Sus textos están escritos**, para que el día que exista el
// mecanismo no haya que inventarlos.
//
// **3. ⚠️ Y NO SE MONTA UNA COLA DE ESCRITURA.** RA F2 lo dejó escrito: una cola
// offline solo vale **si reintentar es idempotente**, y ahí lo es porque un
// cumplimiento reenviado tres veces sigue siendo un día. Aquí **no lo es**:
// añadir un perfume dos veces son dos perfumes. Así que sin conexión se
// **enseña lo que hay** y se dice, que es lo que pide el apartado 5, y no se
// promete guardar lo que no se puede guardar.
//
// **4. ⚠️ UN DATO CORRUPTO NO ROMPE LA PANTALLA** (apartado 14), y para verlo
// **hay que mirar lo GUARDADO, no lo normalizado**. El primer intento leía las
// colecciones con su `datos*()` de siempre… que ya había descartado el registro
// malo en silencio, así que no encontraba nunca nada: un aviso decorativo, que
// es justo lo que prohíbe la regla 8. Cada colección declara **dónde vive en
// crudo** (`crudo`) y **su normalizador de elemento**, y el registro que no
// sobrevive se marca **solo él**, con los demás enseñándose igual.
//
// **5. ⚠️ ANTES DE BORRAR SE DICE ADÓNDE VA** (apartado 15), y **solo cuando es
// verdad**: `avisoDeBorrado()` mira el catálogo de la papelera global (ME F3).
// Prometer *"podrás recuperarlo"* de algo que no va a la papelera sería mentir.
//
// **6. ⚠️ EL PERMISO SE PIDE UNA VEZ** (apartado 12: *"nunca pedir permisos
// repetidamente"*). Si el navegador ya dijo que no, aquí **no se vuelve a
// pedir**: se dice que se activa desde Ajustes y ya está.
// ============================================================================

import {
  normalizarEstiloHombre, moduloEH, IDS_EH,
} from './estiloDeHombre';
import { estadoDe } from './gestionEstilo';
import { CATALOGO_PAPELERA, claveCatalogo, describirEntrada } from './papelera';
import { permisoNotificaciones } from './notificaciones';
/* Cada colección se lee y se normaliza con lo que YA existe. */
import { datosPerfumes, normalizarPerfume, normalizarPorProbar } from './perfumes';
import { datosAccesorios, normalizarAccesorio, normalizarDeseo } from './accesorios';
import { datosGustos, normalizarEntradaGusto } from './gustos';
import { datosRutinasPiel } from './rutinasPiel';
import { datosPelo } from './rutinasPelo';
import { datosSonrisa } from './sonrisa';

/* ===========================================================================
   1 · EL CATÁLOGO DE ESTADOS (apartados 1-16)
   ===========================================================================
   ⚠️ Cada línea responde a las tres preguntas del enunciado: **qué ha pasado**
   (`titulo`), **qué puede hacer** (`opciones`) y **qué ha ocurrido con sus
   datos** (`datos`). Una opción sin acción de verdad sería un control
   decorativo, así que cada una declara su `accion`. */

export const ESTADOS_EH = [
  {
    apartado: 1, id: 'sin_datos', icono: '📭', detectable: true,
    titulo: 'Todavía no tienes nada aquí',
    datos: 'No se ha perdido nada: es que todavía no has añadido nada.',
    opciones: [{ id: 'anadir', etiqueta: '+ Añadir', accion: 'anadir' }],
  },
  {
    apartado: 2, id: 'primera_vez', icono: '✨', detectable: true,
    titulo: 'Tu colección está vacía',
    datos: 'Puedes añadir lo primero cuando quieras. No hay prisa.',
    opciones: [{ id: 'anadir', etiqueta: '+ Añadir', accion: 'anadir' }],
  },
  {
    apartado: 3, id: 'cargando', icono: '⏳', detectable: true,
    titulo: 'Cargando…',
    datos: 'Tus datos siguen donde estaban.',
    opciones: [],
  },
  {
    apartado: 4, id: 'sin_conexion', icono: '⚠️', detectable: true,
    titulo: 'No hemos podido actualizar tus datos',
    datos: 'Lo que ves es lo último que se cargó. No se ha borrado nada.',
    opciones: [
      { id: 'reintentar', etiqueta: 'Reintentar', accion: 'reintentar' },
      { id: 'seguir', etiqueta: 'Seguir sin conexión', accion: 'cerrar' },
    ],
  },
  {
    apartado: 5, id: 'modo_sin_conexion', icono: '📴', detectable: true,
    titulo: 'Estás sin conexión',
    /* ⚠️ Decisión 3 — se dice la verdad: se puede mirar, no guardar. */
    datos: 'Puedes consultar lo que ya tienes. Para guardar cambios hace falta conexión.',
    opciones: [{ id: 'reintentar', etiqueta: 'Reintentar', accion: 'reintentar' }],
  },
  {
    apartado: 6, id: 'error_guardado', icono: '⚠️', detectable: false,
    titulo: 'No hemos podido guardar este cambio',
    datos: 'Lo que habías escrito sigue en la pantalla.',
    opciones: [
      { id: 'reintentar', etiqueta: 'Reintentar', accion: 'reintentar' },
      { id: 'cancelar', etiqueta: 'Cancelar', accion: 'cerrar' },
    ],
    porque: 'El guardado de JosStyle todavía no avisa de si algo ha fallado, así que desde aquí no hay forma de saberlo.',
  },
  {
    apartado: 8, id: 'sincronizando', icono: '☁️', detectable: false,
    titulo: 'Sincronizando…',
    datos: 'Tus cambios están subiendo.',
    opciones: [],
    porque: 'JosStyle todavía no lleva la cuenta de lo que está subiendo, así que no hay nada que enseñar.',
  },
  {
    apartado: 9, id: 'conflicto', icono: '⚠️', detectable: false,
    titulo: 'Hay cambios diferentes en tus dispositivos',
    datos: 'No se ha perdido ninguna de las dos versiones.',
    opciones: [
      { id: 'mantener', etiqueta: 'Mantener este', accion: 'mantener' },
      { id: 'otro', etiqueta: 'Usar el otro', accion: 'otro' },
      { id: 'revisar', etiqueta: 'Revisar cambios', accion: 'revisar' },
    ],
    porque: 'El guardado sube sin mirar qué había antes, así que no se puede saber si el otro dispositivo cambió lo mismo.',
  },
  {
    apartado: 10, id: 'modulo_desactivado', icono: '⏸️', detectable: true,
    titulo: 'Este apartado está desactivado',
    /* ⚠️ La F36 lo dejó claro: desactivar no borra. */
    datos: 'Lo que tuvieras dentro sigue guardado. Al activarlo vuelve todo.',
    opciones: [
      { id: 'activar', etiqueta: 'Activar', accion: 'activar' },
      { id: 'volver', etiqueta: 'Volver', accion: 'cerrar' },
    ],
  },
  {
    apartado: 11, id: 'elemento_eliminado', icono: '🗑️', detectable: true,
    titulo: 'Este elemento está en Eliminados recientemente',
    datos: 'No se ha borrado del todo: puedes recuperarlo.',
    opciones: [
      { id: 'recuperar', etiqueta: 'Recuperar', accion: 'recuperar' },
      { id: 'volver', etiqueta: 'Volver', accion: 'cerrar' },
    ],
  },
  {
    apartado: 12, id: 'permiso_denegado', icono: '🔒', detectable: true,
    titulo: 'Necesitamos tu permiso para utilizar esta función',
    datos: 'Nada de lo que tienes cambia. Puedes activarlo desde Ajustes.',
    /* ⚠️ Apartado 12 — *"nunca pedir permisos repetidamente"*: si ya dijo que
       no, la única opción es ir a Ajustes. */
    opciones: [{ id: 'ajustes', etiqueta: 'Ir a Ajustes', accion: 'ajustes' }],
  },
  {
    apartado: 13, id: 'error_irrecuperable', icono: '😕', detectable: true,
    titulo: 'No hemos podido cargar este apartado',
    datos: 'Tus datos siguen guardados. Esto es un fallo de la pantalla.',
    opciones: [{ id: 'reintentar', etiqueta: 'Reintentar', accion: 'reintentar' }],
  },
  {
    apartado: 14, id: 'datos_corruptos', icono: '⚠️', detectable: true,
    titulo: 'Este elemento no se puede mostrar',
    /* ⚠️ Y lo importante: lo demás sigue ahí. */
    datos: 'El resto de tus cosas están bien. Solo este no se puede leer.',
    opciones: [{ id: 'eliminar', etiqueta: 'Eliminarlo', accion: 'eliminar' }],
  },
  {
    apartado: 15, id: 'accion_destructiva', icono: '⚠️', detectable: true,
    titulo: '¿Seguro que quieres eliminarlo?',
    datos: 'Podrás recuperarlo desde Eliminados recientemente.',
    opciones: [
      { id: 'eliminar', etiqueta: 'Eliminar', accion: 'eliminar' },
      { id: 'cancelar', etiqueta: 'Cancelar', accion: 'cerrar' },
    ],
  },
];

export const estadoEH = (id) => ESTADOS_EH.find((e) => e.id === id) || null;
export const ESTADOS_DETECTABLES = ESTADOS_EH.filter((e) => e.detectable);
export const ESTADOS_SIN_MECANISMO = ESTADOS_EH.filter((e) => !e.detectable);

/* ⚠️ Apartado 16 — *"mensajes pequeños y temporales"*. Ni un modal para decir
   que algo se ha guardado. */
export const MENSAJES_HECHO = {
  guardado: '✓ Guardado',
  actualizado: '✓ Actualizado',
  recuperado: '✓ Recuperado',
  eliminado: '✓ Eliminado',
  activado: '✓ Activado',
};

export const DURACION_FEEDBACK_MS = 2000;

/* Apartado 3 — *"pequeñas tarjetas de carga… evitar spinners enormes"*. */
export const TARJETAS_DE_CARGA = 3;

export const TEXTOS_ESTADOS = {
  problemas: 'Hay algo que no se puede leer',
  sinProblemas: 'Todo se lee bien.',
  noSePuedeRecuperar: 'Esto no va a Eliminados recientemente: al borrarlo, se borra.',
  siSePuedeRecuperar: 'Podrás recuperarlo desde Eliminados recientemente.',
  permisoYaPedido: 'Ya lo has decidido antes. Se cambia desde los ajustes del teléfono.',
};

/* ===========================================================================
   2 · SIN DATOS Y PRIMERA VEZ (apartados 1 y 2)
   ===========================================================================
   *"Nunca mostrar una pantalla completamente vacía."*

   ⚠️ Una línea por colección, con **de dónde se lee**, **qué se dice cuando está
   vacía** y **cómo se llama su botón**. Al añadir una colección con pantalla, se
   añade su línea — como `MODULOS_EH` o `LINEAS_DE_PLAQUITA`. */

export const COLECCIONES_EH = [
  {
    id: 'perfumes.perfumes', modulo: 'perfumes', icono: '🌫️',
    titulo: 'Tu colección está vacía',
    texto: 'Añade tu primer perfume cuando quieras.',
    boton: 'Añadir perfume',
    leer: (e) => datosPerfumes(e).perfumes,
    crudo: { modulo: 'perfumes', camino: ['perfumes', 'perfumes'] },
    normalizar: normalizarPerfume,
  },
  {
    id: 'perfumes.porProbar', modulo: 'perfumes', icono: '🧪',
    titulo: 'Todavía no tienes ninguno por probar',
    texto: 'Aquí se apuntan los que te gustaría oler antes de comprarlos.',
    boton: 'Añadir uno por probar',
    leer: (e) => datosPerfumes(e).porProbar,
    crudo: { modulo: 'perfumes', camino: ['perfumes', 'porProbar'] },
    normalizar: normalizarPorProbar,
  },
  {
    id: 'accesorios.accesorios', modulo: 'accesorios', icono: '🕶️',
    titulo: 'Todavía no tienes accesorios apuntados',
    texto: 'Un reloj, unas gafas o una gorra. Cada uno vive en tu armario.',
    boton: 'Añadir accesorio',
    leer: (e) => datosAccesorios(e).accesorios,
    crudo: { modulo: 'accesorios', camino: ['accesorios', 'accesorios'] },
    normalizar: normalizarAccesorio,
  },
  {
    id: 'accesorios.deseos', modulo: 'accesorios', icono: '💭',
    titulo: 'Todavía no hay nada en tu lista',
    texto: 'Lo que te gustaría tener algún día.',
    boton: 'Añadir a la lista',
    leer: (e) => datosAccesorios(e).deseos,
    crudo: { modulo: 'accesorios', camino: ['accesorios', 'deseos'] },
    normalizar: normalizarDeseo,
  },
  {
    id: 'gustos.entradas', modulo: 'gustos', icono: '❤️',
    titulo: 'Todavía no has apuntado nada',
    texto: 'Lo que te gusta, lo que te interesa y lo que quieres hacer.',
    boton: 'Añadir algo',
    leer: (e) => datosGustos(e).entradas,
    crudo: { modulo: 'gustos', camino: ['gustos', 'entradas'] },
    normalizar: normalizarEntradaGusto,
  },
  {
    id: 'skincare.rutinas', modulo: 'skincare', icono: '🧴',
    titulo: 'Todavía no tienes ninguna rutina de piel',
    texto: 'Una rutina son unos pocos pasos que repites.',
    boton: 'Crear rutina',
    leer: (e) => datosRutinasPiel(e).rutinas,
    /* ⚠️ Las rutinas las normaliza el MOTOR (`motorRutinas.js`, F14) con el
       catálogo de acciones de su módulo, no una función suelta: revisarlas una a
       una desde aquí sería reescribir ese motor. Se declara que no se revisan,
       en vez de fingir que sí. */
    crudo: null,
    normalizar: null,
  },
  {
    id: 'pelo.rutinas', modulo: 'pelo', icono: '💇',
    titulo: 'Todavía no tienes ninguna rutina de pelo',
    texto: 'Lavar, hidratar, peinar: lo que hagas y cada cuánto.',
    boton: 'Crear rutina',
    leer: (e) => datosPelo(e).rutinas,
    crudo: null,
    normalizar: null,
  },
  {
    id: 'sonrisa.rutinas', modulo: 'sonrisa', icono: '🦷',
    titulo: 'Todavía no tienes ninguna rutina de higiene bucal',
    texto: 'Cepillado, hilo, enjuague: lo que hagas y cuándo.',
    boton: 'Crear rutina',
    leer: (e) => datosSonrisa(e).rutinas,
    crudo: null,
    normalizar: null,
  },
];

export const coleccionEH = (id) => COLECCIONES_EH.find((c) => c.id === id) || null;

const leerColeccion = (e, c) => {
  try { const l = c.leer(e); return Array.isArray(l) ? l : []; } catch { return []; }
};

/**
 * ⚠️ Lo GUARDADO, sin pasar por ningún normalizador. Es la única forma de ver un
 * registro roto: el normalizador de la colección ya lo habría tirado.
 */
const leerCrudo = (estado, c) => {
  if (!c.crudo) return null;
  const e = normalizarEstiloHombre(estado);
  const cfg = e.modulos.find((m) => m.id === c.crudo.modulo)?.config || {};
  let sitio = cfg;
  for (const paso of c.crudo.camino) {
    if (!sitio || typeof sitio !== 'object') return null;
    sitio = sitio[paso];
  }
  return Array.isArray(sitio) ? sitio : null;
};

/**
 * Qué enseñar en una lista. ⚠️ **Nunca devuelve "nada"**: si está vacía, trae su
 * título, su explicación y su botón (apartados 1 y 2).
 */
export function estadoDeColeccion(estado, coleccionId) {
  const c = coleccionEH(coleccionId);
  if (!c) return null;
  const e = normalizarEstiloHombre(estado);
  const lista = leerColeccion(e, c);
  if (lista.length > 0) return { vacia: false, total: lista.length, coleccion: c.id };
  const base = estadoEH('primera_vez');
  return {
    vacia: true,
    total: 0,
    coleccion: c.id,
    icono: c.icono,
    titulo: c.titulo,
    texto: c.texto,
    boton: c.boton,
    // Lo que ha pasado con sus datos: nada, porque todavía no hay.
    datos: base.datos,
  };
}

/** Todas, para poder comprobar de una vez que ninguna se queda muda. */
export const estadosVacios = (estado) =>
  COLECCIONES_EH.map((c) => ({ id: c.id, ...estadoDeColeccion(estado, c.id) }));

/* ===========================================================================
   3 · DATOS CORRUPTOS (apartado 14)
   ===========================================================================
   *"No romper toda la pantalla. Mostrar el resto de información y marcar
   únicamente ese elemento como problemático."*

   ⚠️ El normalizador de una colección **descarta** lo que no entiende, en
   silencio. Aquí se hace al revés: se pasa cada registro por su normalizador de
   elemento y **el que no sobrevive se enseña marcado**. */

export function elementosProblematicos(estado, coleccionId) {
  const c = coleccionEH(coleccionId);
  if (!c || typeof c.normalizar !== 'function' || !c.crudo) {
    return { revisables: false, buenos: [], malos: [], hayProblemas: false };
  }
  // ⚠️ Lo guardado. Con `datos*()` esto no encontraría nunca nada.
  const crudo = leerCrudo(estado, c);
  if (crudo === null) return { revisables: true, buenos: [], malos: [], hayProblemas: false };
  const buenos = [];
  const malos = [];
  crudo.forEach((x, i) => {
    let bueno = null;
    try { bueno = c.normalizar(x); } catch { bueno = null; }
    if (bueno) buenos.push(bueno);
    else malos.push({ posicion: i, id: (x && typeof x.id === 'string') ? x.id : null });
  });
  return { revisables: true, buenos, malos, hayProblemas: malos.length > 0 };
}

/** Lo mismo, con el aviso ya montado para la pantalla. */
export function avisoDeCorrupto(estado, coleccionId) {
  const r = elementosProblematicos(estado, coleccionId);
  if (!r.revisables || !r.hayProblemas) return null;
  const base = estadoEH('datos_corruptos');
  return {
    ...base,
    cuantos: r.malos.length,
    // ⚠️ Y lo que de verdad importa: cuántos SÍ se ven, dicho en el propio
    // texto. (Antes iba en un campo `texto` aparte que tapaba a `datos`, y la
    // pantalla acababa sin la única frase que tranquiliza.)
    siguenBien: r.buenos.length,
    datos: `${base.datos} Se siguen viendo ${r.buenos.length}.`,
  };
}

/* ===========================================================================
   4 · MÓDULO DESACTIVADO Y ELEMENTO ELIMINADO (apartados 10 y 11)
   =========================================================================== */

/** ⚠️ El estado lo dice la F36, no un `if` nuevo. */
export function estadoDeAcceso(estado, moduloId) {
  if (!IDS_EH.includes(moduloId)) return null;
  const situacion = estadoDe(estado, moduloId);
  if (situacion !== 'desactivado') return null;
  const base = estadoEH('modulo_desactivado');
  const m = moduloEH(moduloId);
  return { ...base, modulo: moduloId, nombre: m ? m.nombre : moduloId, icono: m ? m.icono : base.icono };
}

/**
 * ¿Está en la papelera? ⚠️ Se busca en la papelera **global** (ME F3): Estilo de
 * hombre no tiene la suya, y por eso esto recibe la de la aplicación.
 */
export function estadoDeEliminado(papelera, modulo, coleccion, id) {
  const elementos = Array.isArray(papelera?.elementos) ? papelera.elementos : [];
  const entrada = elementos.find((x) => x
    && x.modulo === modulo
    && (x.coleccion || null) === (coleccion || null)
    && x.id === id);
  if (!entrada) return null;
  const base = estadoEH('elemento_eliminado');
  const cat = CATALOGO_PAPELERA[claveCatalogo(modulo, coleccion)] || null;
  return {
    ...base,
    entrada,
    tipo: cat ? cat.tipo : 'Elemento',
    descripcion: describirEntrada(entrada),
  };
}

/* ===========================================================================
   5 · ACCIONES DESTRUCTIVAS (apartado 15)
   ===========================================================================
   *"Explicar: 'podrás recuperarlo desde Eliminados recientemente' **cuando
   corresponda**."*

   ⚠️ Y solo cuando corresponde de verdad: se mira el catálogo de la papelera. */

export function avisoDeBorrado(modulo, coleccion = null, { nombre = null } = {}) {
  const cat = CATALOGO_PAPELERA[claveCatalogo(modulo, coleccion)] || null;
  const base = estadoEH('accion_destructiva');
  return {
    ...base,
    tipo: cat ? cat.tipo : 'Elemento',
    nombre,
    aPapelera: !!cat,
    // ⚠️ Prometer que se recupera algo que no va a la papelera sería mentir.
    datos: cat ? TEXTOS_ESTADOS.siSePuedeRecuperar : TEXTOS_ESTADOS.noSePuedeRecuperar,
  };
}

/* ===========================================================================
   6 · CONEXIÓN Y PERMISOS (apartados 4, 5 y 12)
   =========================================================================== */

/** ⚠️ Fuera del navegador no hay `navigator`: se da por buena la conexión. */
export function hayConexion() {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.onLine !== 'boolean') return true;
    return navigator.onLine;
  } catch { return true; }
}

export function estadoDeConexion() {
  if (hayConexion()) return null;
  const base = estadoEH('modo_sin_conexion');
  return { ...base };
}

/**
 * ⚠️ Apartado 12 — *"nunca pedir permisos repetidamente"*. Si el navegador ya
 * dijo que no, **aquí no se vuelve a pedir**: se dice dónde se cambia.
 */
export function estadoDePermiso() {
  const permiso = permisoNotificaciones();
  if (permiso === 'granted') return null;
  const base = estadoEH('permiso_denegado');
  return {
    ...base,
    permiso,
    // Si nunca lo ha decidido, todavía se le puede preguntar una vez.
    sePuedePedir: permiso === 'default',
    texto: permiso === 'denied' ? TEXTOS_ESTADOS.permisoYaPedido : base.datos,
  };
}

/* ===========================================================================
   7 · AUDITORÍA
   =========================================================================== */

export function textosDeEstados() {
  return [
    ...ESTADOS_EH.flatMap((e) => [e.titulo, e.datos, ...(e.porque ? [e.porque] : [])]),
    ...ESTADOS_EH.flatMap((e) => e.opciones.map((o) => o.etiqueta)),
    ...COLECCIONES_EH.flatMap((c) => [c.titulo, c.texto, c.boton]),
    ...Object.values(MENSAJES_HECHO),
    ...Object.values(TEXTOS_ESTADOS),
  ];
}

/* ⚠️ *"Nunca decir simplemente: 'Error'."* (apartado 6). Un título que sea solo
   eso —o "Algo ha fallado", o "Ups"— es lo que la fase entera viene a evitar. */
export const TITULOS_VACIOS = /^(error|ups|algo ha (ido mal|fallado)|vaya)\.?$/i;

export function auditarEstados() {
  return {
    estados: ESTADOS_EH.length,
    detectables: ESTADOS_DETECTABLES.length,
    // Los tres que el enunciado da por hechos y hoy no se pueden detectar.
    sinMecanismo: ESTADOS_SIN_MECANISMO.map((e) => e.id),
    // Todos traen las tres respuestas del enunciado.
    sinQuePaso: ESTADOS_EH.filter((e) => !e.titulo).map((e) => e.id),
    sinQueHacer: ESTADOS_EH.filter((e) => e.id !== 'cargando' && e.id !== 'sincronizando' && e.opciones.length === 0).map((e) => e.id),
    sinQuePasaConSusDatos: ESTADOS_EH.filter((e) => !e.datos).map((e) => e.id),
    // Ninguno dice solo "Error".
    titulosVacios: ESTADOS_EH.filter((e) => TITULOS_VACIOS.test(e.titulo)).map((e) => e.id),
    // Ninguna colección se queda muda.
    coleccionesSinVacio: COLECCIONES_EH.filter((c) => !c.titulo || !c.boton).map((c) => c.id),
    colecciones: COLECCIONES_EH.length,
    // ⚠️ Cuántas se pueden revisar de verdad, y cuántas no (y está dicho).
    revisables: COLECCIONES_EH.filter((c) => !!c.crudo && typeof c.normalizar === 'function').length,
    // ⚠️ Decisión 3 — ni una cola de escritura.
    colasDeEscritura: 0,
    tarjetasDeCarga: TARJETAS_DE_CARGA,
  };
}

export function panelEstados(estado, { papelera = null } = {}) {
  const e = normalizarEstiloHombre(estado);
  return {
    conexion: estadoDeConexion(),
    permiso: estadoDePermiso(),
    vacios: estadosVacios(e).filter((x) => x.vacia),
    problemas: COLECCIONES_EH
      .map((c) => avisoDeCorrupto(e, c.id))
      .filter(Boolean),
    // Lo que el enunciado pide y todavía no se puede detectar, con su motivo.
    sinMecanismo: ESTADOS_SIN_MECANISMO.map((x) => ({ id: x.id, titulo: x.titulo, porque: x.porque })),
    papeleraDisponible: Array.isArray(papelera?.elementos),
  };
}

export { CATALOGO_PAPELERA };
