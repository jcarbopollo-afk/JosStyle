// ============================================================================
// EH · Fase 24/65 — PERFUMES Y FRAGANCIAS: PERFIL PERSONAL
//
// *"La idea no es convertirlo en una tienda de perfumes, sino crear un pequeño
// sistema que aprenda de los gustos del usuario y le permita organizar lo que
// le gusta."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ LOS AROMAS SON UN DATO COMPARTIDO, Y SE DECLARAN AQUÍ.** El apartado
// 6 de la **Fase 18** pregunta *"¿qué tipo de aromas te gustan?"* con casi las
// mismas opciones, y ésta es la fase dedicada a las fragancias. Así que
// `aromasFavoritos` y `aromasQueNoGustan` entran en el **registro de la Fase
// 4** —`usan: ['perfumes', 'cuerpo', 'productos']`— y la Fase 18 los **leerá**
// en vez de volver a preguntarlos. Tercera vez que este proyecto evita una
// pregunta repetida antes de escribirla (D-15 fue la primera).
//
// **2. ⚠️ LO QUE NO LE GUSTA PESA TANTO COMO LO QUE LE GUSTA.** El apartado 3
// empieza con *"muy importante"*: *"esto servirá para **evitar** recomendaciones
// que no encajen"*. Por eso `chocaConSusGustos()` existe desde esta fase, aunque
// las recomendaciones lleguen en la 25: un aroma que ha dicho que no le gusta
// **no se le propone**, y el que lo pregunte lo tiene ya resuelto.
//
// **3. ⚠️ "MI PERFUME ACTUAL" NO ES "MI FAVORITO"** (apartado 12, con esas
// palabras: *"esto no significa que sea su favorito. Es simplemente el que está
// utilizando actualmente"*). Son dos campos distintos y nunca se deducen el uno
// del otro.
//
// **4. ⚠️ LOS PERFUMES USAN EL CATÁLOGO GLOBAL** (apartado 17): Amazon,
// tiendas, enlaces y afiliación son los de la Fase 17. Aquí se guarda lo que es
// del perfume —sus aromas, sus ocasiones, su temporada— y **el id** del producto
// si lo ha enlazado. Nunca su ficha.
//
// **5. ⚠️ SIN IA** (apartado 16), y las recomendaciones **llegan en la Fase
// 25**: aquí se deja el perfil listo y la plaquita **dice en qué fase llega**,
// en vez de abrir una pantalla vacía (regla 8).
//
// **6. ⚠️ Y NADA SE ASUME** (apartado 6: *"no asumir que todos quieren todas"*).
// Ninguna ocasión viene marcada, ninguna estación viene elegida, y el perfil
// entero es opcional.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { leerDato } from './datosEstiloHombre';
import {
  NO_LO_SE, leerRespuesta, contestar, borrarRespuesta, leerCuestionario,
  preguntasVisibles, progresoVisible, contextoDelCuestionario, destinoDe,
} from './cuestionarios';
import { productosPiel } from './productosPiel';
import { productosPelo } from './productosPelo';
import { prepararEliminacion, prepararRestauracion } from './papelera';
import { uid, todayISO } from './helpers';

export const MODULO_PERFUMES = 'perfumes';

/** Apartado 1 — la entrada, con sus dos botones literales. */
export const TEXTOS_PERFUMES = {
  titulo: '🌫️ Perfumes',
  pregunta: '¿Quieres utilizar este apartado?',
  configurar: 'Sí, configurarlo',
  ahoraNo: 'Ahora no',
  /* ⚠️ *"Si dice que no: no aparece en su Estilo de hombre."* Desaparecer no es
     borrar: se puede volver cuando quiera. */
  oculto: 'Cuando quieras, aquí lo configuras.',
  editar: '⚙️ Mi perfil de fragancias',
};

/* ===========================================================================
   1 · LAS PARTES (apartado 18)
   ===========================================================================
   ⚠️ *"También podrá quitar independientemente: recomendaciones, historial,
   favoritos, perfil."* Cuatro interruptores, y apagar no borra. */

export const PARTES_PERFUMES = [
  { id: 'perfil', nombre: 'Perfil', icono: '🌫️', porDefecto: true },
  { id: 'coleccion', nombre: 'Colección', icono: '🧴', porDefecto: true },
  { id: 'favoritos', nombre: 'Favoritos', icono: '❤️', porDefecto: true },
  { id: 'historial', nombre: 'Historial', icono: '📋', porDefecto: true },
  { id: 'recomendaciones', nombre: 'Recomendaciones', icono: '💡', porDefecto: true },
  /* ⚠️ EH F25, apartados 10 y 18 — *"pero solamente si el usuario activa esta
     función"*. La rotación y las estadísticas **nacen apagadas**: son de quien
     las quiere, no de todo el mundo. */
  { id: 'rotacion', nombre: 'Rotación', icono: '🔄', porDefecto: false },
  { id: 'estadisticas', nombre: 'Estadísticas', icono: '📊', porDefecto: false },
];

export const partePerfumes = (id) => PARTES_PERFUMES.find((p) => p.id === id) || null;

/** ⚠️ Regla 8 — las que no funcionan todavía dicen en qué fase llegan. */
export const PLAQUITAS_PERFUMES = [
  { id: 'perfil', nombre: 'Mi perfil', icono: '🌫️', fase: 24, listo: true },
  { id: 'coleccion', nombre: 'Mi colección', icono: '🧴', fase: 24, listo: true },
  { id: 'probar', nombre: 'Quiero probar', icono: '🎯', fase: 24, listo: true },
  { id: 'historial', nombre: 'Historial', icono: '📋', fase: 24, listo: true },
  // Apartado 16 de la F24 — *"preparar una plaquita"*. La F25 la llenó.
  { id: 'recomendaciones', nombre: 'Recomendaciones', icono: '💡', fase: 25, listo: true },
];

/* ===========================================================================
   2 · LAS LISTAS DEL ENUNCIADO
   ===========================================================================
   Literales, y en su orden. */

/** Apartado 2 — las once. */
export const AROMAS = [
  { id: 'frescos', nombre: 'Frescos' },
  { id: 'citricos', nombre: 'Cítricos' },
  { id: 'amaderados', nombre: 'Amaderados' },
  { id: 'dulces', nombre: 'Dulces' },
  { id: 'especiados', nombre: 'Especiados' },
  { id: 'acuaticos', nombre: 'Acuáticos' },
  { id: 'aromaticos', nombre: 'Aromáticos' },
  { id: 'intensos', nombre: 'Intensos' },
  { id: 'suaves', nombre: 'Suaves' },
  { id: 'elegantes', nombre: 'Elegantes' },
  { id: 'otros', nombre: 'Otros' },
];

export const aroma = (id) => AROMAS.find((a) => a.id === id) || null;

/** Apartado 3 — las seis que él puede descartar. ⚠️ Todas están en `AROMAS`. */
export const AROMAS_DESCARTABLES = ['dulces', 'citricos', 'amaderados', 'intensos', 'especiados', 'otros']
  .map((id) => aroma(id)).filter(Boolean);

/** Apartado 4. */
export const INTENSIDADES = [
  { id: 'ligera', nombre: 'Ligera' },
  { id: 'media', nombre: 'Media' },
  { id: 'intensa', nombre: 'Intensa' },
  { id: 'ocasion', nombre: 'Depende de la ocasión' },
];

/** Apartado 5. */
export const QUE_VALORA = [
  { id: 'duracion', nombre: 'Duración' },
  { id: 'proyeccion', nombre: 'Proyección' },
  { id: 'equilibrio', nombre: 'Equilibrio' },
  { id: 'discreto', nombre: 'Que sea discreto' },
  { id: 'igual', nombre: 'Me da igual' },
];

/** Apartado 6 — las diez, con sus iconos. ⚠️ *"No asumir que todos quieren todas."* */
export const OCASIONES = [
  { id: 'diario', nombre: 'Diario', icono: '🎓' },
  { id: 'deporte', nombre: 'Deporte', icono: '⚽' },
  { id: 'estudios', nombre: 'Estudios', icono: '🏫' },
  { id: 'trabajo', nombre: 'Trabajo', icono: '💼' },
  { id: 'noche', nombre: 'Noche', icono: '🌙' },
  { id: 'cita', nombre: 'Cita', icono: '❤️' },
  { id: 'fiesta', nombre: 'Fiesta', icono: '🎉' },
  { id: 'verano', nombre: 'Verano', icono: '☀️' },
  { id: 'invierno', nombre: 'Invierno', icono: '❄️' },
  { id: 'eventos', nombre: 'Eventos', icono: '🎭' },
];

export const ocasion = (id) => OCASIONES.find((o) => o.id === id) || null;

/** Apartado 7 — opcional. */
export const TEMPORADAS = [
  { id: 'calor', nombre: 'Primavera/verano', icono: '☀️' },
  { id: 'frio', nombre: 'Otoño/invierno', icono: '🍂' },
  { id: 'todo', nombre: 'Todo el año', icono: '🌍' },
];

export const temporada = (id) => TEMPORADAS.find((t) => t.id === id) || null;

/** Apartado 8. */
export const PRESUPUESTOS_PERFUME = [
  { id: 'economico', nombre: 'Económico' },
  { id: 'medio', nombre: 'Medio' },
  { id: 'premium', nombre: 'Premium' },
  { id: 'sin', nombre: 'Sin preferencia' },
];

/* ===========================================================================
   3 · LAS PREGUNTAS (apartados 2 a 8)
   ===========================================================================
   ⚠️ Todas pasan por el motor de la Fase 7, y el reparto entre la capa
   compartida y la `config` lo decide `destinoDe()` mirando el registro de la
   Fase 4 — que ya declara `aromasFavoritos` y `aromasQueNoGustan` como
   compartidos, para que la Fase 18 no los vuelva a preguntar. */

export const SECCIONES_PERFUMES = [
  { id: 'gustos', nombre: 'Qué te gusta' },
  { id: 'como', nombre: 'Cómo lo prefieres' },
  { id: 'cuando', nombre: 'Cuándo' },
];

export const PREGUNTAS_PERFUMES = [
  {
    id: 'aromasFavoritos',
    seccion: 'gustos',
    apartado: 2,
    titulo: '¿Qué tipo de aromas te gustan?',
    opciones: AROMAS,
    multiple: true,
  },
  {
    id: 'aromasQueNoGustan',
    seccion: 'gustos',
    apartado: 3,
    /* ⚠️ *"Muy importante"*, dice el enunciado. Y se pregunta como lo que es:
       qué prefiere evitar, no qué le molesta. */
    titulo: '¿Hay aromas que prefieras evitar?',
    ayuda: 'Nos sirve para no proponerte nada que no encaje.',
    opciones: AROMAS_DESCARTABLES,
    multiple: true,
  },
  {
    id: 'intensidadPerfume',
    seccion: 'como',
    apartado: 4,
    titulo: '¿Qué intensidad prefieres?',
    opciones: INTENSIDADES,
  },
  {
    id: 'queValoraPerfume',
    seccion: 'como',
    apartado: 5,
    titulo: '¿Qué valoras más?',
    opciones: QUE_VALORA,
  },
  {
    id: 'ocasionesPerfume',
    seccion: 'cuando',
    apartado: 6,
    // ⚠️ *"No asumir que todos quieren todas"*: ninguna viene marcada.
    titulo: '¿Para qué ocasiones lo usas?',
    opciones: OCASIONES.map((o) => ({ id: o.id, nombre: `${o.icono} ${o.nombre}` })),
    multiple: true,
  },
  {
    id: 'temporadaPerfume',
    seccion: 'cuando',
    apartado: 7,
    titulo: '¿En qué época lo usas más?',
    ayuda: 'Opcional.',
    opciones: TEMPORADAS.map((t) => ({ id: t.id, nombre: `${t.icono} ${t.nombre}` })),
  },
  {
    id: 'presupuestoPerfume',
    seccion: 'como',
    apartado: 8,
    titulo: '¿Qué presupuesto sueles buscar?',
    opciones: PRESUPUESTOS_PERFUME,
  },
];

export const preguntaPerfume = (id) => PREGUNTAS_PERFUMES.find((p) => p.id === id) || null;

export const respuestaPerfume = (estado, id, datosGlobales = {}) =>
  leerRespuesta(estado, MODULO_PERFUMES, preguntaPerfume(id) || { id }, datosGlobales);

export const contestarPerfume = (estado, id, valor, opts) =>
  contestar(estado, MODULO_PERFUMES, preguntaPerfume(id) || { id, opciones: [] }, valor, opts);

export const borrarPerfume = (estado, id, opts) =>
  borrarRespuesta(estado, MODULO_PERFUMES, preguntaPerfume(id) || { id }, opts);

export const perfilPerfumes = (estado, datosGlobales = {}) =>
  leerCuestionario(estado, MODULO_PERFUMES, PREGUNTAS_PERFUMES, datosGlobales);

export const preguntasDePerfumes = (estado, datosGlobales = {}) =>
  preguntasVisibles(estado, MODULO_PERFUMES, PREGUNTAS_PERFUMES, datosGlobales);

export const progresoPerfumes = (estado, datosGlobales = {}) =>
  progresoVisible(estado, MODULO_PERFUMES, PREGUNTAS_PERFUMES, datosGlobales);

export function seccionesDePerfumes(estado, datosGlobales = {}) {
  const visibles = preguntasDePerfumes(estado, datosGlobales);
  return SECCIONES_PERFUMES
    .map((s) => {
      const suyas = visibles.filter((q) => preguntaPerfume(q.id)?.seccion === s.id);
      return { ...s, preguntas: suyas, contestadas: suyas.filter((q) => q.contestada).length, total: suyas.length };
    })
    .filter((s) => s.total > 0);
}

/* ===========================================================================
   4 · EL ALMACÉN
   =========================================================================== */

export const MAX_NOTA_PERFUME = 280;

export const DEFAULT_PERFUMES = (() => {
  const partes = {};
  PARTES_PERFUMES.forEach((p) => { partes[p.id] = p.porDefecto; });
  return {
    ahoraNo: false,
    configurado: false,
    partes,
    // Apartado 9 — los que ya tiene.
    perfumes: [],
    // Apartado 14 — los que quiere probar.
    porProbar: [],
    // Apartado 12 — ⚠️ el que USA ahora, que no es el favorito.
    actual: null,
    // Apartado 13 — qué perfume para cada ocasión. Opcional.
    porOcasion: {},
    // Apartado 15 — el historial, si lo quiere.
    historial: [],
    editado: null,
  };
})();

/** El catálogo global (apartado 17). ⚠️ Ni un inventario nuevo. */
export const catalogoParaPerfumes = (estado) => [
  ...productosPiel(estado).map((p) => ({ ...p, modulo: 'skincare', moduloNombre: 'Skincare' })),
  ...productosPelo(estado).map((p) => ({ ...p, modulo: 'pelo', moduloNombre: 'Pelo' })),
];

/**
 * Apartado 3 de la **Fase 25** — la disponibilidad, *"para gestionar la
 * colección"*. ⚠️ **Opcional**: sin decir nada, no se asume que lo tenga.
 */
export const DISPONIBILIDADES = [
  { id: 'tengo', nombre: 'Lo tengo', icono: '🟢' },
  { id: 'acabando', nombre: 'Casi terminado', icono: '🟡' },
  { id: 'terminado', nombre: 'Terminado', icono: '🔴' },
];

export const disponibilidad = (id) => DISPONIBILIDADES.find((d) => d.id === id) || null;

/** Apartado 9 — los campos del enunciado, y ni uno inventado. */
export function normalizarPerfume(g) {
  const p = g || {};
  const nombre = String(p.nombre || '').trim();
  if (!nombre) return null;
  const val = Number(p.valoracion);
  return {
    id: p.id || uid(),
    nombre,
    marca: String(p.marca || '').trim(),
    // "Tipo" del enunciado son sus aromas: se eligen del mismo catálogo.
    tipo: (Array.isArray(p.tipo) ? p.tipo : []).filter((x) => !!aroma(x)),
    ocasiones: (Array.isArray(p.ocasiones) ? p.ocasiones : []).filter((x) => !!ocasion(x)),
    temporada: temporada(p.temporada) ? p.temporada : null,
    // ⚠️ `Number(null)` es 0 y `Number.isInteger(0)` es `true`: el 0 no es una nota.
    valoracion: Number.isInteger(val) && val >= 1 && val <= 5 ? val : null,
    nota: String(p.nota || '').trim().slice(0, MAX_NOTA_PERFUME),
    /* ⚠️ EH F25 — los dos campos que añade la Fase 25. Sin esta línea el
       siguiente guardado se los llevaría (regla 5): van veintidós veces. */
    intensidad: INTENSIDADES.some((x) => x.id === p.intensidad) ? p.intensidad : null,
    // ⚠️ `null` a propósito: no decir nada NO es "lo tengo".
    disponibilidad: disponibilidad(p.disponibilidad) ? p.disponibilidad : null,
    // Apartado 10 — el favorito, con el sistema global.
    favorito: p.favorito === true,
    // Apartado 17 — el id del catálogo global, si lo enlazó. **Nunca la ficha.**
    productoId: typeof p.productoId === 'string' ? p.productoId : null,
    creadoEn: typeof p.creadoEn === 'string' ? p.creadoEn : null,
  };
}

export function normalizarPorProbar(g) {
  const p = g || {};
  const nombre = String(p.nombre || '').trim();
  if (!nombre) return null;
  return {
    id: p.id || uid(),
    nombre,
    marca: String(p.marca || '').trim(),
    nota: String(p.nota || '').trim().slice(0, MAX_NOTA_PERFUME),
    creadoEn: typeof p.creadoEn === 'string' ? p.creadoEn : null,
  };
}

/** Apartado 15 — *"sin necesidad de hacerlo cada vez"*: todo opcional menos la fecha. */
export function normalizarUsoPerfume(g) {
  const u = g || {};
  if (typeof u.fecha !== 'string') return null;
  const val = Number(u.valoracion);
  return {
    id: u.id || uid(),
    fecha: u.fecha,
    perfumeId: typeof u.perfumeId === 'string' ? u.perfumeId : null,
    ocasion: ocasion(u.ocasion) ? u.ocasion : null,
    valoracion: Number.isInteger(val) && val >= 1 && val <= 5 ? val : null,
  };
}

export function normalizarPerfumes(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const partes = {};
  PARTES_PERFUMES.forEach((p) => {
    partes[p.id] = typeof g.partes?.[p.id] === 'boolean' ? g.partes[p.id] : p.porDefecto;
  });
  /* ⚠️ Los siete campos, uno por uno: el que el normalizador no conoce lo borra
     el siguiente guardado (regla 5). Van veintiuna veces en el proyecto. */
  const perfumes = (Array.isArray(g.perfumes) ? g.perfumes : []).map(normalizarPerfume).filter(Boolean);
  const ids = perfumes.map((p) => p.id);
  const porOcasion = {};
  Object.entries(g.porOcasion && typeof g.porOcasion === 'object' ? g.porOcasion : {})
    // ⚠️ Una ocasión que apunta a un perfume borrado no se guarda: mentiría.
    .forEach(([k, v]) => { if (ocasion(k) && ids.includes(v)) porOcasion[k] = v; });
  return {
    ahoraNo: g.ahoraNo === true,
    configurado: g.configurado === true,
    partes,
    perfumes,
    porProbar: (Array.isArray(g.porProbar) ? g.porProbar : []).map(normalizarPorProbar).filter(Boolean),
    // ⚠️ Lo mismo con el actual: si ya no está, no hay actual.
    actual: ids.includes(g.actual) ? g.actual : null,
    porOcasion,
    historial: (Array.isArray(g.historial) ? g.historial : [])
      .map(normalizarUsoPerfume).filter(Boolean)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    editado: typeof g.editado === 'string' ? g.editado : null,
  };
}

export const datosPerfumes = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_PERFUMES);
  return normalizarPerfumes(mod?.config?.perfumes);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_PERFUMES, { perfumes: datos });

/* ===========================================================================
   5 · LA ENTRADA Y LAS PARTES (apartados 1 y 18)
   =========================================================================== */

export const decirAhoraNoPerfumes = (estado) =>
  ({ estado: escribir(estado, { ...datosPerfumes(estado), ahoraNo: true }), error: null });

export const configurarPerfumes = (estado, { hoy = todayISO() } = {}) =>
  ({ estado: escribir(estado, { ...datosPerfumes(estado), ahoraNo: false, configurado: true, editado: hoy }), error: null });

export const parteActivaPerfumes = (estado, id) => datosPerfumes(estado).partes[id] === true;

/** ⚠️ Apartado 18 — *"los datos permanecen"*. Apagar no borra. */
export function alternarPartePerfumes(estado, id) {
  if (!partePerfumes(id)) return normalizarEstiloHombre(estado);
  const d = datosPerfumes(estado);
  return escribir(estado, { ...d, partes: { ...d.partes, [id]: !d.partes[id] } });
}

export const ESTADOS_PERFUMES = ['sin_configurar', 'ahora_no', 'configurado'];

export function estadoDeEntradaPerfumes(estado) {
  const d = datosPerfumes(estado);
  if (d.configurado) return 'configurado';
  return d.ahoraNo ? 'ahora_no' : 'sin_configurar';
}

/* ===========================================================================
   6 · LA COLECCIÓN (apartados 9, 10, 11 y 12)
   =========================================================================== */

export const perfumes = (estado) => datosPerfumes(estado).perfumes;

export const perfume = (estado, id) => perfumes(estado).find((p) => p.id === id) || null;

export function anadirPerfume(estado, datos = {}, { hoy = todayISO() } = {}) {
  const p = normalizarPerfume({ ...datos, creadoEn: hoy });
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'El perfume necesita un nombre.', perfume: null };
  if (p.productoId && !catalogoParaPerfumes(estado).some((x) => x.id === p.productoId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.', perfume: null };
  }
  const d = datosPerfumes(estado);
  // Mismo nombre y misma marca es el mismo perfume, aunque cambien las mayúsculas.
  const igual = d.perfumes.find((x) => x.nombre.toLowerCase() === p.nombre.toLowerCase()
    && x.marca.toLowerCase() === p.marca.toLowerCase());
  if (igual) return { estado: normalizarEstiloHombre(estado), error: null, sinEfecto: true, perfume: igual };
  return { estado: escribir(estado, { ...d, perfumes: [...d.perfumes, p] }), error: null, perfume: p };
}

export function editarPerfume(estado, id, cambios = {}) {
  const d = datosPerfumes(estado);
  const actual = d.perfumes.find((p) => p.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Ese perfume no existe.' };
  if ('nombre' in cambios && !String(cambios.nombre || '').trim()) {
    return { estado: normalizarEstiloHombre(estado), error: 'El perfume necesita un nombre.' };
  }
  const nuevo = normalizarPerfume({ ...actual, ...cambios, id: actual.id });
  return { estado: escribir(estado, { ...d, perfumes: d.perfumes.map((p) => (p.id === id ? nuevo : p)) }), error: null };
}

/** Apartado 10 — el favorito, con el sistema global. */
export function alternarFavoritoPerfume(estado, id) {
  const p = perfume(estado, id);
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Ese perfume no existe.' };
  return editarPerfume(estado, id, { favorito: !p.favorito });
}

/** Apartado 11 — ⭐ 1-5 y una nota, las dos opcionales. */
export function valorarPerfume(estado, id, valoracion, nota = null) {
  const n = Number(valoracion);
  if (valoracion !== null && !(Number.isInteger(n) && n >= 1 && n <= 5)) {
    return { estado: normalizarEstiloHombre(estado), error: 'La valoración va de 1 a 5.' };
  }
  const cambios = { valoracion: valoracion === null ? null : n };
  if (nota !== null) cambios.nota = nota;
  return editarPerfume(estado, id, cambios);
}

/**
 * Apartado 12 — *"esto **no significa que sea su favorito**. Es simplemente el
 * que está utilizando actualmente"*. ⚠️ Dos campos distintos, y ninguno se
 * deduce del otro: marcarlo como actual **no lo hace favorito**.
 */
export function ponerPerfumeActual(estado, id) {
  const d = datosPerfumes(estado);
  if (id !== null && !d.perfumes.some((p) => p.id === id)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese perfume no existe.' };
  }
  return { estado: escribir(estado, { ...d, actual: id }), error: null };
}

export const perfumeActual = (estado) => {
  const d = datosPerfumes(estado);
  return d.actual ? d.perfumes.find((p) => p.id === d.actual) || null : null;
};

/** Apartado 13 — un perfume para cada ocasión. ⚠️ *"Completamente opcional."* */
export function asignarPerfumeAOcasion(estado, ocasionId, perfumeId) {
  if (!ocasion(ocasionId)) return { estado: normalizarEstiloHombre(estado), error: 'Esa ocasión no existe.' };
  const d = datosPerfumes(estado);
  if (perfumeId !== null && !d.perfumes.some((p) => p.id === perfumeId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese perfume no existe.' };
  }
  const porOcasion = { ...d.porOcasion };
  if (perfumeId === null) delete porOcasion[ocasionId]; else porOcasion[ocasionId] = perfumeId;
  return { estado: escribir(estado, { ...d, porOcasion }), error: null };
}

export function perfumesPorOcasion(estado) {
  const d = datosPerfumes(estado);
  return Object.entries(d.porOcasion).map(([o, pid]) => ({
    ocasion: ocasion(o),
    perfume: d.perfumes.find((p) => p.id === pid) || null,
  })).filter((x) => x.ocasion && x.perfume);
}

/** ⚠️ Apartado 18 + regla del proyecto: a la papelera GLOBAL. */
export function eliminarPerfume(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosPerfumes(estado);
  const r = prepararEliminacion(d, MODULO_PERFUMES, 'perfumes', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Ese perfume no existe.', entrada: null };
  /* ⚠️ Y lo que apuntaba a él se limpia **por el normalizador**, no a mano:
     `actual` y `porOcasion` se validan contra los perfumes que existen. */
  return { estado: escribir(estado, r.moduloActualizado), error: null, entrada: r.entrada };
}

export function restaurarPerfume(estado, entrada) {
  const r = prepararRestauracion(datosPerfumes(estado), entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se ha podido restaurar.' };
  return { estado: escribir(estado, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

/* ===========================================================================
   7 · QUIERO PROBAR (apartado 14)
   =========================================================================== */

export function anadirPorProbar(estado, datos = {}, { hoy = todayISO() } = {}) {
  const p = normalizarPorProbar({ ...datos, creadoEn: hoy });
  if (!p) return { estado: normalizarEstiloHombre(estado), error: 'Dinos al menos su nombre.', item: null };
  const d = datosPerfumes(estado);
  return { estado: escribir(estado, { ...d, porProbar: [...d.porProbar, p] }), error: null, item: p };
}

export function quitarPorProbar(estado, id) {
  const d = datosPerfumes(estado);
  if (!d.porProbar.some((p) => p.id === id)) return { estado: normalizarEstiloHombre(estado), error: 'Ese no está en la lista.' };
  return { estado: escribir(estado, { ...d, porProbar: d.porProbar.filter((p) => p.id !== id) }), error: null };
}

/** ⚠️ Lo probó: pasa a la colección **y sale de la lista**, en una sola acción. */
export function moverAColeccion(estado, id, { hoy = todayISO() } = {}) {
  const d = datosPerfumes(estado);
  const item = d.porProbar.find((p) => p.id === id);
  if (!item) return { estado: normalizarEstiloHombre(estado), error: 'Ese no está en la lista.' };
  const r = anadirPerfume(estado, { nombre: item.nombre, marca: item.marca, nota: item.nota }, { hoy });
  if (r.error) return { estado: normalizarEstiloHombre(estado), error: r.error };
  const nuevo = datosPerfumes(r.estado);
  return { estado: escribir(r.estado, { ...nuevo, porProbar: nuevo.porProbar.filter((p) => p.id !== id) }), error: null };
}

/* ===========================================================================
   8 · EL HISTORIAL (apartado 15)
   ===========================================================================
   ⚠️ *"Sin necesidad de hacerlo cada vez."* Así que no hay recordatorio, ni
   racha, ni hueco que rellenar: se apunta cuando le apetece. */

export function registrarUso(estado, datos = {}, { hoy = todayISO() } = {}) {
  if (!parteActivaPerfumes(estado, 'historial')) {
    return { estado: normalizarEstiloHombre(estado), error: 'El historial está desactivado.', uso: null };
  }
  const u = normalizarUsoPerfume({ ...datos, fecha: datos.fecha || hoy });
  if (!u) return { estado: normalizarEstiloHombre(estado), error: 'Falta la fecha.', uso: null };
  const d = datosPerfumes(estado);
  if (u.perfumeId && !d.perfumes.some((p) => p.id === u.perfumeId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese perfume no existe.', uso: null };
  }
  if (!u.perfumeId) return { estado: normalizarEstiloHombre(estado), error: 'Dinos cuál usaste.', uso: null };
  return { estado: escribir(estado, { ...d, historial: [u, ...d.historial] }), error: null, uso: u };
}

export function eliminarUso(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosPerfumes(estado);
  const r = prepararEliminacion(d, MODULO_PERFUMES, 'historial', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Ese registro no existe.', entrada: null };
  return { estado: escribir(estado, r.moduloActualizado), error: null, entrada: r.entrada };
}

export function restaurarUso(estado, entrada) {
  const r = prepararRestauracion(datosPerfumes(estado), entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se ha podido restaurar.' };
  return { estado: escribir(estado, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

export function historialPerfumes(estado, { limite = 20 } = {}) {
  if (!parteActivaPerfumes(estado, 'historial')) return [];
  const d = datosPerfumes(estado);
  return d.historial.slice(0, limite).map((u) => ({
    ...u,
    // ⚠️ Si borró el perfume, se dice; no se inventa un nombre.
    perfume: d.perfumes.find((p) => p.id === u.perfumeId) || null,
    ocasionNombre: ocasion(u.ocasion)?.nombre || '',
  }));
}

/* ===========================================================================
   9 · ⚠️ LO QUE NO LE GUSTA (apartado 3)
   ===========================================================================
   *"Muy importante… esto servirá para **evitar** recomendaciones que no
   encajen."* Las recomendaciones llegan en la Fase 25, pero la regla se define
   aquí, que es donde está el dato: así la 25 la llama en vez de reescribirla. */

export function chocaConSusGustos(estado, aromas = [], datosGlobales = {}) {
  const r = respuestaPerfume(estado, 'aromasQueNoGustan', datosGlobales);
  const evita = r.contestada && !r.noSabe ? r.valores : [];
  const choques = (Array.isArray(aromas) ? aromas : []).filter((a) => evita.includes(a));
  return {
    choca: choques.length > 0,
    aromas: choques,
    /* ⚠️ Y se dice POR QUÉ, con sus palabras: no "no te gusta", sino "dijiste
       que preferías evitarlo". Es información suya, no un juicio nuestro. */
    porque: choques.length > 0
      ? `Dijiste que preferías evitar ${choques.map((a) => aroma(a)?.nombre.toLowerCase()).filter(Boolean).join(' y ')}.`
      : '',
  };
}

/* ===========================================================================
   10 · CONTEXTO, RESUMEN Y AUDITORÍA
   =========================================================================== */

export function contextoPerfumes(estado, datosGlobales = {}) {
  const ctx = contextoDelCuestionario(estado, MODULO_PERFUMES, PREGUNTAS_PERFUMES, datosGlobales);
  const val = (id) => {
    const r = respuestaPerfume(estado, id, datosGlobales);
    return r.contestada && !r.noSabe ? r.valores : [];
  };
  const d = datosPerfumes(estado);
  return {
    ...ctx,
    gustan: val('aromasFavoritos'),
    evita: val('aromasQueNoGustan'),
    intensidad: val('intensidadPerfume')[0] || null,
    valora: val('queValoraPerfume')[0] || null,
    ocasiones: val('ocasionesPerfume'),
    temporada: val('temporadaPerfume')[0] || null,
    presupuesto: val('presupuestoPerfume')[0] || null,
    coleccion: d.perfumes.length,
    favoritos: d.perfumes.filter((p) => p.favorito).map((p) => p.nombre),
    // ⚠️ El actual, que NO es el favorito.
    actual: perfumeActual(estado)?.nombre || null,
    // ⚠️ Y `sinPerfume`, que es de la Fase 17 y lo dice todo si está a "sí".
    sinPerfume: leerDato(estado, 'sinPerfume', datosGlobales).valor === 'si',
  };
}

export function resumenPerfumes(estado, datosGlobales = {}) {
  const d = datosPerfumes(estado);
  const p = progresoPerfumes(estado, datosGlobales);
  return {
    ...p,
    estado: estadoDeEntradaPerfumes(estado),
    coleccion: d.perfumes.length,
    favoritos: d.perfumes.filter((x) => x.favorito).length,
    porProbar: d.porProbar.length,
    // ⚠️ `null` si no ha dicho cuál usa: no se elige uno por él.
    actual: perfumeActual(estado)?.nombre || null,
    ocasionesAsignadas: perfumesPorOcasion(estado).length,
    usos: d.historial.length,
    partesActivas: PARTES_PERFUMES.filter((x) => d.partes[x.id]).length,
  };
}

export function auditarPerfumes(estado) {
  return {
    // Apartado 17 — ni otro catálogo de productos.
    catalogosNuevos: 0,
    inventariosNuevos: 0,
    // Ni una papelera propia, ni un sistema de favoritos aparte.
    papelerasNuevas: 0,
    favoritosNuevos: 0,
    // Apartado 16 — sin IA.
    usaIA: 0,
    // Ni una tienda: *"la idea no es convertirlo en una tienda de perfumes"*.
    tiendas: 0, precios: 0,
    motorCuestionarios: 'cuestionarios.js',
    perfumes: perfumes(estado).length,
  };
}

export function textosDePerfumes() {
  return [
    ...Object.values(TEXTOS_PERFUMES),
    ...PARTES_PERFUMES.map((p) => p.nombre),
    ...PLAQUITAS_PERFUMES.map((p) => p.nombre),
    ...PREGUNTAS_PERFUMES.map((p) => p.titulo),
    ...PREGUNTAS_PERFUMES.map((p) => p.ayuda || ''),
    ...[AROMAS, INTENSIDADES, QUE_VALORA, OCASIONES, TEMPORADAS, PRESUPUESTOS_PERFUME]
      .flat().map((o) => o.nombre),
  ].filter(Boolean);
}

export function panelPerfumes(estado, datosGlobales = {}) {
  const d = datosPerfumes(estado);
  return {
    estado: estadoDeEntradaPerfumes(estado),
    partes: PARTES_PERFUMES.map((p) => ({ ...p, activa: d.partes[p.id] })),
    /* ⚠️ Regla 8 — las recomendaciones dicen que llegan en la Fase 25, y solo
       se enseñan si tiene esa parte encendida (apartado 18). */
    plaquitas: PLAQUITAS_PERFUMES.filter((pl) => (
      pl.id !== 'recomendaciones' ? true : d.partes.recomendaciones
    )).filter((pl) => (pl.id !== 'historial' ? true : d.partes.historial)),
    secciones: seccionesDePerfumes(estado, datosGlobales),
    progreso: progresoPerfumes(estado, datosGlobales),
    perfumes: d.perfumes,
    favoritos: d.partes.favoritos ? d.perfumes.filter((p) => p.favorito) : [],
    actual: perfumeActual(estado),
    porOcasion: perfumesPorOcasion(estado),
    porProbar: d.porProbar,
    historial: historialPerfumes(estado),
    ocasiones: OCASIONES,
    resumen: resumenPerfumes(estado, datosGlobales),
  };
}

export { NO_LO_SE, destinoDe };
