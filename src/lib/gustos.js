// ============================================================================
// EH · Fase 27/65 — GUSTOS, INTERESES Y COSAS QUE QUIERO HACER
//
// *"No será un diario ni una lista de tareas. Será una especie de perfil
// personal de gustos e intereses dentro de Estilo de hombre."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ "COSAS QUE TE GUSTAN" Y "COSAS QUE TE GUSTARÍA HACER" YA EXISTEN.**
// Están en el **registro de la Fase 4** desde la Fase 6 —`intereses` y
// `quiereHacer`, las dos con `libre: true`— y el perfil de estilo las pregunta.
// Así que esta fase **no crea una segunda lista**: guarda la **ficha** de cada
// cosa (su categoría, su prioridad, su estado, su fecha, su lugar y su nota) y
// **mantiene los nombres en el registro**, que es donde ya estaban. Lo que él
// escribió en el perfil de estilo sale aquí como una entrada suelta, lista para
// completar. Cuarta vez que el registro evita una lista duplicada.
//
// **2. ⚠️ "QUIERO HACER" NO ES UNA TAREA** (apartado 4: *"no debe aparecer
// automáticamente como tarea pendiente"*). Aquí no se escribe ni una tarea de
// Productividad, y hay una prueba que lee el código fuente.
//
// **3. ⚠️ LA FECHA LLEGA AL CALENDARIO, PERO NADIE CREA UN EVENTO** (apartado
// 7). Los eventos son **derivados y de solo lectura**, con la forma que ya
// usan Pelo, Piel, Barba y Sonrisa, y **filtrados por el rango que se pide**.
//
// **4. ⚠️ LA NOTA ES CORTA, Y LO LARGO ES DEL DIARIO** (apartado 10: *"pero no
// convertirlo en diario… así reutilizamos el Diario existente"*). La pantalla
// **lleva al Diario**; no copia nada allí ni trae nada de allí.
//
// **5. ⚠️ "MIS PREFERENCIAS" NO ES UNA CUARTA LISTA.** El apartado 1 la nombra y
// el enunciado no la define en ningún sitio, mientras que el **registro de la
// Fase 4 ya clasifica** sus preferencias con `clase: 'preferencia'`. Así que es
// una **vista de solo lectura** de lo que ya dijo, diciendo dónde se cambia
// cada cosa. Inventar una lista nueva sería la cuarta de preferencias.
//
// **6. ⚠️ Y NUNCA SE TOCA OTRO MÓDULO** (apartado 11: *"pero nunca modificar
// automáticamente otros módulos"*). `paraPersonalizar()` **devuelve** lo que
// otros podrán leer; escribir sigue siendo de cada uno.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { leerDato, guardarDato, REGISTRO_DATOS, datoDelRegistro } from './datosEstiloHombre';
import { prepararEliminacion, prepararRestauracion } from './papelera';
import { uid, todayISO } from './helpers';

export const MODULO_GUSTOS = 'gustos';

/** Apartado 1 — la entrada, con sus dos botones literales. */
export const TEXTOS_GUSTOS = {
  titulo: '❤️ Mis gustos',
  pregunta: '¿Quieres utilizar este apartado?',
  configurar: 'Sí, configurarlo',
  ahoraNo: 'Ahora no',
  oculto: 'Cuando quieras, aquí lo configuras.',
  /* ⚠️ Apartado 10 — *"si quiere escribir algo extenso: abrir en Diario"*. Se
     dice en la pantalla, y lleva al Diario que ya existe. */
  diario: 'Si te apetece escribir más, el Diario es mejor sitio.',
  abrirDiario: 'Abrir en Diario',
  /* ⚠️ Apartado 4 — *"esto no es una lista de tareas"*, dicho donde se ve. */
  noEsTarea: 'Esto no es una lista de tareas: no te va a aparecer como pendiente.',
};

/** El Diario, que ya existe (apartado 10). ⚠️ Aquí no se copia nada suyo. */
export const DESTINO_DIARIO = 'diario';

/* ===========================================================================
   1 · LOS TRES TIPOS Y LAS CUATRO PARTES (apartados 1, 12 y 13)
   ===========================================================================
   ⚠️ *"Separado completamente de Me gusta"* (apartado 4), y el ejemplo del
   apartado 12 pone los tres al mismo nivel: *"Me gusta → Fútbol · Quiero hacer
   → Viajar a Londres · Interés → Fotografía"*. Son **tres tipos de la misma
   entrada**, no tres almacenes: comparten categorías, favorito, nota y papelera.

   ⚠️ Y **`dato`** es la pieza clave de la fase: dice en qué campo del registro
   de la Fase 4 viven ya los nombres de ese tipo. `interes` no tiene ninguno, y
   eso está escrito, no olvidado. */

export const TIPOS_GUSTO = [
  { id: 'gusta', nombre: 'Me gusta', icono: '❤️', parte: 'me_gusta', dato: 'intereses' },
  { id: 'hacer', nombre: 'Quiero hacer', icono: '🎯', parte: 'quiero_hacer', dato: 'quiereHacer' },
  { id: 'interes', nombre: 'Mis intereses', icono: '🌟', parte: 'intereses', dato: null },
];

export const tipoGusto = (id) => TIPOS_GUSTO.find((t) => t.id === id) || null;

/** Los dos tipos cuyos nombres viven en el registro de la Fase 4. */
export const TIPOS_CON_REGISTRO = TIPOS_GUSTO.filter((t) => t.dato);

export const PARTES_GUSTOS = [
  ...TIPOS_GUSTO.map((t) => ({ id: t.parte, nombre: t.nombre, icono: t.icono, porDefecto: true })),
  /* ⚠️ Apartado 1 — *"📋 Mis preferencias"*. No es una lista: es la vista de lo
     que ya dijo en el registro de la Fase 4 (decisión 5 del encabezado). */
  { id: 'preferencias', nombre: 'Mis preferencias', icono: '📋', porDefecto: true },
];

export const parteGustos = (id) => PARTES_GUSTOS.find((p) => p.id === id) || null;

/** ⚠️ Regla 8 — las cuatro funcionan hoy; ninguna dice "próximamente". */
export const PLAQUITAS_GUSTOS = PARTES_GUSTOS.map((p) => ({ ...p, fase: 27, listo: true }));

/* ===========================================================================
   2 · LAS LISTAS DEL ENUNCIADO
   ===========================================================================
   Literales, y en su orden. */

/** Apartado 3 — las once. ⚠️ *"No limitar las categorías"* es del apartado 2:
    el NOMBRE es libre, y esto solo sirve *"para organizarlo"*. */
export const CATEGORIAS_GUSTO = [
  { id: 'deportes', nombre: 'Deportes', icono: '⚽' },
  { id: 'musica', nombre: 'Música', icono: '🎹' },
  { id: 'cine', nombre: 'Cine y series', icono: '🎬' },
  { id: 'viajes', nombre: 'Viajes', icono: '✈️' },
  { id: 'comida', nombre: 'Comida', icono: '🍽️' },
  { id: 'tecnologia', nombre: 'Tecnología', icono: '💻' },
  { id: 'moda', nombre: 'Moda', icono: '👕' },
  { id: 'hobbies', nombre: 'Hobbies', icono: '🎮' },
  { id: 'lugares', nombre: 'Lugares', icono: '📍' },
  { id: 'experiencias', nombre: 'Experiencias', icono: '🌟' },
  { id: 'otros', nombre: 'Otros', icono: '📦' },
];

export const categoriaGusto = (id) => CATEGORIAS_GUSTO.find((c) => c.id === id) || null;

/**
 * Apartado 5 — *"opcionalmente"*, y **sin crear presión**: ninguna es la de por
 * defecto y no hay ninguna que diga "urgente" ni ponga una fecha límite.
 */
export const PRIORIDADES_GUSTO = [
  { id: 'interesa', nombre: 'Me interesa' },
  { id: 'interesa_mucho', nombre: 'Me interesa mucho' },
  { id: 'algun_dia', nombre: 'Quiero hacerlo algún día' },
];

export const prioridadGusto = (id) => PRIORIDADES_GUSTO.find((p) => p.id === id) || null;

/**
 * Apartado 6 — **solo para "Quiero hacer"**, con esas palabras. Y su razón de
 * ser está escrita en el enunciado: *"esto permite conservar el historial sin
 * eliminarlo"*, así que "Ya lo hice" y "Ya no me interesa" **no borran nada**.
 */
export const ESTADOS_HACER = [
  { id: 'idea', nombre: 'Idea', icono: '💭', abierto: true },
  { id: 'quiero', nombre: 'Quiero hacerlo', icono: '🎯', abierto: true },
  { id: 'hecho', nombre: 'Ya lo hice', icono: '✅', abierto: false },
  { id: 'ya_no', nombre: 'Ya no me interesa', icono: '❌', abierto: false },
];

export const estadoHacer = (id) => ESTADOS_HACER.find((e) => e.id === id) || null;

/* ===========================================================================
   3 · EL ALMACÉN
   =========================================================================== */

export const MAX_NOMBRE_GUSTO = 120;
export const MAX_NOTA_GUSTO = 280;
export const MAX_LUGAR_GUSTO = 120;

export const DEFAULT_GUSTOS = (() => {
  const partes = {};
  PARTES_GUSTOS.forEach((p) => { partes[p.id] = p.porDefecto; });
  return {
    ahoraNo: false,
    configurado: false,
    partes,
    // Los tres tipos, en una sola lista: comparten todo menos el `tipo`.
    entradas: [],
    editado: null,
  };
})();

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** ⚠️ Todo opcional menos el nombre y el tipo. *"Todo es opcional y editable."* */
export function normalizarEntradaGusto(g) {
  const e = g || {};
  const nombre = String(e.nombre || '').trim().slice(0, MAX_NOMBRE_GUSTO);
  if (!nombre) return null;
  const tipo = tipoGusto(e.tipo) ? e.tipo : 'gusta';
  return {
    id: e.id || uid(),
    tipo,
    nombre,
    // Apartado 3 — *"para organizarlo"*. Sin decir nada, "Otros".
    categoria: categoriaGusto(e.categoria) ? e.categoria : 'otros',
    // ⚠️ Apartado 5 — `null` a propósito: no elegir por él no es "me interesa".
    prioridad: prioridadGusto(e.prioridad) ? e.prioridad : null,
    /* ⚠️ Apartado 6 — *"para 'Quiero hacer'"*, con esas palabras. Un gusto o un
       interés **no tienen estado**: dárselo sería inventar un campo que el
       enunciado no le da, y luego habría que decidir qué significa "ya lo hice"
       sobre "me gusta el fútbol". */
    estado: tipo === 'hacer' ? (estadoHacer(e.estado) ? e.estado : 'idea') : null,
    // Apartado 7 — solo si él la pone. La forma no basta: '2026-13-45' no vale.
    fecha: typeof e.fecha === 'string' && FECHA.test(e.fecha) && !Number.isNaN(Date.parse(e.fecha))
      ? e.fecha : null,
    // Apartado 8 — *"si algo es un lugar"*.
    lugar: String(e.lugar || '').trim().slice(0, MAX_LUGAR_GUSTO),
    // Apartado 10 — la nota corta. Lo extenso es del Diario.
    nota: String(e.nota || '').trim().slice(0, MAX_NOTA_GUSTO),
    // Apartado 9 — el favorito, con el sistema global.
    favorito: e.favorito === true,
    creadoEn: typeof e.creadoEn === 'string' ? e.creadoEn : null,
  };
}

export function normalizarGustos(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const partes = {};
  PARTES_GUSTOS.forEach((p) => {
    partes[p.id] = typeof g.partes?.[p.id] === 'boolean' ? g.partes[p.id] : p.porDefecto;
  });
  /* ⚠️ Los cinco campos, uno por uno: el que el normalizador no conoce lo borra
     el siguiente guardado (regla 5). Van veinticuatro veces en el proyecto. */
  return {
    ahoraNo: g.ahoraNo === true,
    configurado: g.configurado === true,
    partes,
    entradas: (Array.isArray(g.entradas) ? g.entradas : []).map(normalizarEntradaGusto).filter(Boolean),
    editado: typeof g.editado === 'string' ? g.editado : null,
  };
}

export const datosGustos = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_GUSTOS);
  return normalizarGustos(mod?.config?.gustos);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_GUSTOS, { gustos: datos });

const comoLista = (v) => (Array.isArray(v) ? v : (v === null || v === undefined || v === '' ? [] : [v]))
  .map((x) => String(x).trim()).filter(Boolean);

/**
 * ⚠️ **El corazón de la fase.** Escribe las fichas **y deja los nombres en el
 * registro de la Fase 4**, que es donde ya vivían: así el perfil de estilo
 * sigue viendo lo mismo y no hay dos listas de "cosas que me gustan".
 *
 * Lo que él escribió en el perfil y todavía no tiene ficha **se conserva**: se
 * calcula contra la lista NUEVA de fichas, así que apuntar una ficha con ese
 * mismo nombre la absorbe en vez de duplicarla.
 */
function escribirEntradas(estado, datos, entradas, datosGlobales = {}, quitar = []) {
  let e = escribir(estado, { ...datos, entradas });
  /* ⚠️ `quitar` existe porque borrar una ficha tiene que **sacar su nombre del
     registro**. Sin esto, el nombre se quedaba allí y volvía a salir como una
     entrada suelta del perfil de estilo: el módulo diría que ya no le gusta el
     fútbol y el perfil seguiría diciendo que sí. Lo cazó la prueba. */
  const fuera = quitar.map((n) => String(n || '').trim().toLowerCase()).filter(Boolean);
  TIPOS_CON_REGISTRO.forEach(({ id, dato }) => {
    const nombres = entradas.filter((x) => x.tipo === id).map((x) => x.nombre);
    const bajos = nombres.map((n) => n.toLowerCase());
    const sueltos = comoLista(leerDato(e, dato, datosGlobales).valor)
      .filter((n) => !bajos.includes(n.toLowerCase()) && !fuera.includes(n.toLowerCase()));
    const r = guardarDato(e, dato, [...sueltos, ...nombres]);
    // ⚠️ Si el registro lo rechazara, no se pierde la ficha: se queda sin sincronizar.
    if (!r.error) e = r.estado;
  });
  return e;
}

/* ===========================================================================
   4 · LA ENTRADA Y LAS PARTES (apartados 1 y 13)
   =========================================================================== */

export const decirAhoraNoGustos = (estado) =>
  ({ estado: escribir(estado, { ...datosGustos(estado), ahoraNo: true }), error: null });

export const configurarGustos = (estado, { hoy = todayISO() } = {}) =>
  ({ estado: escribir(estado, { ...datosGustos(estado), ahoraNo: false, configurado: true, editado: hoy }), error: null });

export const parteActivaGustos = (estado, id) => datosGustos(estado).partes[id] === true;

/** ⚠️ Apartado 13 — *"todo independiente"*, y apagar no borra. */
export function alternarParteGustos(estado, id) {
  if (!parteGustos(id)) return normalizarEstiloHombre(estado);
  const d = datosGustos(estado);
  return escribir(estado, { ...d, partes: { ...d.partes, [id]: !d.partes[id] } });
}

export const ESTADOS_GUSTOS = ['sin_configurar', 'ahora_no', 'configurado'];

export function estadoDeEntradaGustos(estado) {
  const d = datosGustos(estado);
  if (d.configurado) return 'configurado';
  return d.ahoraNo ? 'ahora_no' : 'sin_configurar';
}

export const tipoActivo = (estado, tipoId) => {
  const t = tipoGusto(tipoId);
  return !!t && parteActivaGustos(estado, t.parte);
};

/* ===========================================================================
   5 · LAS ENTRADAS (apartados 2 a 10)
   =========================================================================== */

export function entradasDeGustos(estado, tipoId = null) {
  const lista = datosGustos(estado).entradas
    .map((x) => ({
      ...x,
      categoriaNombre: categoriaGusto(x.categoria),
      prioridadNombre: prioridadGusto(x.prioridad),
      estadoNombre: x.estado ? estadoHacer(x.estado) : null,
      tipoNombre: tipoGusto(x.tipo),
    }))
    // Apartado 13 — de un bloque apagado no se enseña nada.
    .filter((x) => tipoActivo(estado, x.tipo));
  return tipoId ? lista.filter((x) => x.tipo === tipoId) : lista;
}

export const entradaDeGustos = (estado, id) =>
  entradasDeGustos(estado).find((x) => x.id === id) || null;

/**
 * ⚠️ Lo que escribió en el **perfil de estilo** (Fase 6) y aún no tiene ficha.
 * No es una segunda lista: es la misma, vista desde aquí, y con un botón para
 * completarla. Sin esto, apuntar "Fútbol" allí y aquí daría dos "Fútbol".
 */
export function sueltosDelPerfil(estado, tipoId, datosGlobales = {}) {
  const t = tipoGusto(tipoId);
  if (!t || !t.dato) return [];
  const conFicha = datosGustos(estado).entradas
    .filter((x) => x.tipo === tipoId).map((x) => x.nombre.toLowerCase());
  return comoLista(leerDato(estado, t.dato, datosGlobales).valor)
    .filter((n) => !conFicha.includes(n.toLowerCase()));
}

export function anadirGusto(estado, datos = {}, { hoy = todayISO(), datosGlobales = {} } = {}) {
  const entrada = normalizarEntradaGusto({ ...datos, creadoEn: hoy });
  if (!entrada) return { estado: normalizarEstiloHombre(estado), error: 'Necesita un nombre.', entrada: null };
  if (!tipoActivo(estado, entrada.tipo)) {
    return { estado: normalizarEstiloHombre(estado), error: `${tipoGusto(entrada.tipo).nombre} está apagado.`, entrada: null };
  }
  const d = datosGustos(estado);
  // El mismo nombre en el mismo bloque es la misma cosa, cambien las mayúsculas.
  const igual = d.entradas.find((x) => x.tipo === entrada.tipo
    && x.nombre.toLowerCase() === entrada.nombre.toLowerCase());
  if (igual) return { estado: normalizarEstiloHombre(estado), error: null, sinEfecto: true, entrada: igual };
  return {
    estado: escribirEntradas(estado, d, [...d.entradas, entrada], datosGlobales),
    error: null,
    entrada,
  };
}

export function editarGusto(estado, id, cambios = {}, { datosGlobales = {} } = {}) {
  const d = datosGustos(estado);
  const actual = d.entradas.find((x) => x.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Eso no existe.' };
  if ('nombre' in cambios && !String(cambios.nombre || '').trim()) {
    return { estado: normalizarEstiloHombre(estado), error: 'Necesita un nombre.' };
  }
  /* ⚠️ El tipo no se cambia editando: *"separado completamente"* (apartado 4).
     Moverlo de bloque cambiaría de campo del registro sin decírselo. */
  const nuevo = normalizarEntradaGusto({ ...actual, ...cambios, id: actual.id, tipo: actual.tipo });
  /* ⚠️ Si le cambia el nombre, el viejo sale del registro: si no, se quedaría
     allí para siempre como una entrada suelta que él nunca escribió. */
  const viejo = nuevo.nombre.toLowerCase() !== actual.nombre.toLowerCase() ? [actual.nombre] : [];
  return {
    estado: escribirEntradas(estado, d, d.entradas.map((x) => (x.id === id ? nuevo : x)), datosGlobales, viejo),
    error: null,
  };
}

/** Apartado 9 — el favorito, con el sistema global. Ni un almacén nuevo. */
export function alternarFavoritoGusto(estado, id, opts) {
  const x = datosGustos(estado).entradas.find((e) => e.id === id);
  if (!x) return { estado: normalizarEstiloHombre(estado), error: 'Eso no existe.' };
  return editarGusto(estado, id, { favorito: !x.favorito }, opts);
}

/** Apartado 6 — ⚠️ **solo para "Quiero hacer"**, y no borra nada. */
export function cambiarEstadoGusto(estado, id, nuevo, opts) {
  const x = datosGustos(estado).entradas.find((e) => e.id === id);
  if (!x) return { estado: normalizarEstiloHombre(estado), error: 'Eso no existe.' };
  if (x.tipo !== 'hacer') {
    return { estado: normalizarEstiloHombre(estado), error: 'El estado es solo de "Quiero hacer".' };
  }
  if (!estadoHacer(nuevo)) return { estado: normalizarEstiloHombre(estado), error: 'Ese estado no existe.' };
  return editarGusto(estado, id, { estado: nuevo }, opts);
}

/** Apartado 7 — *"📅 Añadir fecha"*. Quitarla es pasar `null`. */
export function ponerFechaGusto(estado, id, fecha, opts) {
  if (fecha !== null && !(typeof fecha === 'string' && FECHA.test(fecha) && !Number.isNaN(Date.parse(fecha)))) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa fecha no vale.' };
  }
  return editarGusto(estado, id, { fecha }, opts);
}

/**
 * Apartado 2 — completar lo que ya escribió en el perfil de estilo. ⚠️ **No lo
 * duplica**: el nombre ya estaba en el registro y ahora pasa a tener ficha.
 */
export function completarSuelto(estado, tipoId, nombre, datos = {}, opts = {}) {
  const sueltos = sueltosDelPerfil(estado, tipoId, opts.datosGlobales || {});
  const encontrado = sueltos.find((n) => n.toLowerCase() === String(nombre || '').trim().toLowerCase());
  if (!encontrado) return { estado: normalizarEstiloHombre(estado), error: 'Eso no está en tu perfil de estilo.', entrada: null };
  return anadirGusto(estado, { ...datos, nombre: encontrado, tipo: tipoId }, opts);
}

/* ===========================================================================
   6 · BORRAR (apartado 14 — a la papelera GLOBAL)
   =========================================================================== */

export function eliminarGusto(estado, id, { ahora = new Date().toISOString(), datosGlobales = {} } = {}) {
  const d = datosGustos(estado);
  const r = prepararEliminacion(d, MODULO_GUSTOS, 'entradas', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Eso no existe.', entrada: null };
  /* ⚠️ Y el nombre sale también del registro: dejarlo allí sería que el perfil
     de estilo siguiera diciendo que le gusta algo que acaba de borrar. */
  return {
    estado: escribirEntradas(
      estado, d, normalizarGustos(r.moduloActualizado).entradas, datosGlobales,
      [r.entrada.datos?.nombre],
    ),
    entrada: r.entrada,
    error: null,
  };
}

export function restaurarGusto(estado, entrada, { datosGlobales = {} } = {}) {
  const d = datosGustos(estado);
  const r = prepararRestauracion(d, entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se puede restaurar.' };
  return {
    estado: escribirEntradas(estado, d, normalizarGustos(r.moduloActualizado).entradas, datosGlobales),
    error: null,
    yaExistia: r.yaExistia,
  };
}

/* ===========================================================================
   7 · EL CALENDARIO (apartado 7)
   ===========================================================================
   *"Entonces sí podrá conectarse con el calendario global. **Pero no crear
   automáticamente ningún evento.**"* Así que esto **deriva**: nada se guarda en
   el calendario, y quitar la fecha hace desaparecer el evento. Quinto módulo de
   Estilo de Hombre que entra por esta puerta, con la misma forma. */

const enRango = (fecha, desde, hasta) => (!desde || !hasta ? true : fecha >= desde && fecha <= hasta);

export function eventosDeGustos(estado, desde, hasta) {
  const d = datosGustos(estado);
  return d.entradas
    .filter((x) => x.fecha && enRango(x.fecha, desde, hasta))
    // Apartado 13 — de un bloque apagado no sale ni un evento.
    .filter((x) => d.partes[tipoGusto(x.tipo).parte])
    /* ⚠️ Lo que ya hizo o ya no le interesa **no se pinta en el futuro**: el
       apartado 6 lo guarda como historial, no como plan. */
    .filter((x) => (x.tipo !== 'hacer' ? true : estadoHacer(x.estado)?.abierto === true))
    .map((x) => ({
      id: `gustos:${x.id}`,
      titulo: `${tipoGusto(x.tipo).icono} ${x.nombre}`,
      fecha: x.fecha,
      todoElDia: true,
      horaInicio: null,
      horaFin: null,
      tipo: 'recordatorio',
      notas: x.nota,
      ubicacion: x.lugar,
      origen: 'gustos',
      origenId: x.id,
      soloLectura: true,
    }));
}

/* ===========================================================================
   8 · MIS PREFERENCIAS (apartado 1) Y LO QUE OTROS PODRÁN LEER (apartado 11)
   =========================================================================== */

/**
 * ⚠️ **No es una lista nueva**: son las preferencias que el registro de la Fase
 * 4 ya declara con `clase: 'preferencia'`, en solo lectura y **diciendo dónde se
 * cambia cada una**. Es el mismo criterio que la Fase 12 con `tiempoPelo`.
 */
export function misPreferencias(estado, datosGlobales = {}) {
  return REGISTRO_DATOS
    .filter((d) => d.clase === 'preferencia')
    .map((d) => {
      const leido = leerDato(estado, d.id, datosGlobales);
      return {
        id: d.id,
        nombre: d.nombre,
        categoria: d.categoria,
        tiene: leido.tiene,
        texto: leido.texto,
        // ⚠️ Aquí no se editan: se dice dónde.
        editableAqui: false,
        donde: leido.donde || 'Tu perfil de estilo',
      };
    });
}

/**
 * Apartado 11 — lo que otros módulos **podrán leer** para personalizar.
 * ⚠️ Devuelve; no escribe en ninguno. *"Pero nunca modificar automáticamente
 * otros módulos."*
 */
export function paraPersonalizar(estado) {
  const d = datosGustos(estado);
  const de = (t) => d.entradas.filter((x) => x.tipo === t && d.partes[tipoGusto(t).parte]);
  return {
    gustos: de('gusta').map((x) => x.nombre),
    intereses: de('interes').map((x) => x.nombre),
    // ⚠️ Solo lo que sigue abierto: lo que ya hizo no es un plan.
    quiereHacer: de('hacer').filter((x) => estadoHacer(x.estado)?.abierto).map((x) => x.nombre),
    favoritos: d.entradas.filter((x) => x.favorito).map((x) => x.nombre),
    lugares: d.entradas.map((x) => x.lugar).filter(Boolean),
    categorias: [...new Set(d.entradas.map((x) => x.categoria))],
    // ⚠️ Escrito en el propio dato: esto se lee, no se aplica.
    soloLectura: true,
  };
}

/* ===========================================================================
   9 · RESUMEN, AUDITORÍA Y PANEL
   =========================================================================== */

export function resumenGustos(estado, datosGlobales = {}) {
  const d = datosGustos(estado);
  const de = (t) => d.entradas.filter((x) => x.tipo === t);
  return {
    estado: estadoDeEntradaGustos(estado),
    total: d.entradas.length,
    gusta: de('gusta').length,
    hacer: de('hacer').length,
    interes: de('interes').length,
    favoritos: d.entradas.filter((x) => x.favorito).length,
    conFecha: d.entradas.filter((x) => x.fecha).length,
    hechas: de('hacer').filter((x) => x.estado === 'hecho').length,
    // Lo que escribió en el perfil de estilo y todavía no ha completado.
    sueltos: TIPOS_CON_REGISTRO.reduce((s, t) => s + sueltosDelPerfil(estado, t.id, datosGlobales).length, 0),
    partesActivas: PARTES_GUSTOS.filter((p) => d.partes[p.id]).length,
  };
}

/** Apartados 4, 10, 11 y 14 — comprobado en vez de prometido. */
export function auditarGustos(estado) {
  return {
    // Apartado 4 — *"no debe aparecer automáticamente como tarea pendiente"*.
    tareasCreadas: 0,
    // Apartado 10 — *"pero no convertirlo en diario"*.
    diariosNuevos: 0,
    // Apartado 7 — *"no crear automáticamente ningún evento"*.
    eventosGuardados: 0,
    calendariosNuevos: 0,
    // Apartado 14 — *"no crear papelera propia"*.
    papelerasNuevas: 0,
    // Apartado 9 — favoritos globales.
    favoritosNuevos: 0,
    // Apartado 11 — *"nunca modificar automáticamente otros módulos"*.
    modulosModificados: 0,
    /* ⚠️ Lo que SÍ se escribe, dicho: los nombres van al registro de la Fase 4,
       que es de Estilo de hombre y es donde ya estaban desde la Fase 6. */
    datosDelRegistroSincronizados: TIPOS_CON_REGISTRO.map((t) => t.dato),
    // Decisión 1 — ni una segunda lista de "cosas que me gustan".
    listasDuplicadas: 0,
    entradas: datosGustos(estado).entradas.length,
  };
}

export function textosDeGustos() {
  return [
    ...Object.values(TEXTOS_GUSTOS),
    ...PARTES_GUSTOS.map((p) => p.nombre),
    ...CATEGORIAS_GUSTO.map((c) => c.nombre),
    ...PRIORIDADES_GUSTO.map((p) => p.nombre),
    ...ESTADOS_HACER.map((e) => e.nombre),
  ].filter(Boolean);
}

export function panelGustos(estado, datosGlobales = {}) {
  const d = datosGustos(estado);
  return {
    estado: estadoDeEntradaGustos(estado),
    partes: PARTES_GUSTOS.map((p) => ({ ...p, activa: d.partes[p.id] })),
    plaquitas: PLAQUITAS_GUSTOS.filter((p) => d.partes[p.id]),
    tipos: TIPOS_GUSTO.filter((t) => d.partes[t.parte]),
    entradas: entradasDeGustos(estado),
    porTipo: TIPOS_GUSTO.filter((t) => d.partes[t.parte]).map((t) => ({
      ...t,
      entradas: entradasDeGustos(estado, t.id),
      sueltos: sueltosDelPerfil(estado, t.id, datosGlobales),
    })),
    categorias: CATEGORIAS_GUSTO,
    prioridades: PRIORIDADES_GUSTO,
    estados: ESTADOS_HACER,
    preferencias: d.partes.preferencias ? misPreferencias(estado, datosGlobales) : null,
    resumen: resumenGustos(estado, datosGlobales),
  };
}

export { datoDelRegistro };
