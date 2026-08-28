// ============================================================================
// EH · Fase 25/65 — PERFUMES: RECOMENDACIONES, OCASIONES Y ROTACIÓN
//
// *"Ahora hacemos que el apartado de perfumes pase de ser simplemente un
// registro a ser realmente útil: qué perfume usar → cuándo → por qué. Todo
// mediante reglas y preferencias del usuario. **Sin IA**."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ NO ES UNA PUNTUACIÓN, ES UNA EXPLICACIÓN.** El apartado 7 dibuja la
// recomendación con su porqué: *"encaja con tus preferencias y lo has marcado
// como adecuado para ocasiones nocturnas"*. Así que `recomendarPerfume()`
// devuelve **los motivos por los que sale**, y quien no tiene ninguno no sale.
//
// **2. ⚠️ "OTRA OPCIÓN" TIENE MEMORIA** (apartado 8: *"no repetir continuamente
// uno que el usuario haya descartado"*). Los descartes se guardan **por
// ocasión**, no en general: descartar un perfume para una cita no lo descarta
// para el gimnasio. Y caducan, como en `motorRecomendaciones`.
//
// **3. ⚠️ LA ROTACIÓN Y LAS ESTADÍSTICAS SON OPT-IN** (apartados 10, 17 y 18,
// los tres con esas palabras: *"pero solamente si el usuario activa esta
// función"*, *"solo si el usuario activa seguimiento"*). Nacen apagadas y, si
// lo están, estas funciones devuelven `null` — no una lista vacía que la
// pantalla tendría que interpretar.
//
// **4. ⚠️ LA COMPARACIÓN ES LA DEL MOTOR DE PRODUCTOS** (F17). Cuarta tabla del
// proyecto, y ni una línea nueva de mecánica: el tope de tres, la raya para lo
// que no se sabe y la regla de que **la comparación no elige** ya están ahí.
// Lo único de esta fase son sus cuatro filas.
//
// **5. ⚠️ "NO REPETIR" NO CASTIGA** (apartado 11). Un perfume usado hace poco
// **baja de sitio**, no desaparece: si es el único que encaja, se propone igual
// y se dice que lo usó hace nada. Esconderlo sería decidir por él.
//
// **6. ⚠️ Y LA COMPRA ES LA DEL CATÁLOGO GLOBAL** (apartados 14 y 15): tienda,
// precio, enlace y afiliación salen de la ficha de la Fase 17 a través del
// `productoId`. Aquí **no hay ni un precio guardado**.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import {
  MODULO_PERFUMES, datosPerfumes, parteActivaPerfumes, perfumes, perfume,
  OCASIONES, ocasion, TEMPORADAS, temporada, INTENSIDADES, AROMAS, aroma,
  DISPONIBILIDADES, disponibilidad, catalogoParaPerfumes, chocaConSusGustos,
  contextoPerfumes, editarPerfume,
} from './perfumes';
import { compararGenerico, MAX_COMPARAR, enlacesDeProducto } from './motorProductos';
import { diasDesde } from './motorRecomendaciones';
import { uid, todayISO, addDays } from './helpers';

export const PARTE_RECOMENDACIONES_PERFUME = 'recomendaciones';
export const PARTE_ROTACION = 'rotacion';
export const PARTE_ESTADISTICAS = 'estadisticas';

/* ===========================================================================
   1 · LO QUE SE PREGUNTA ANTES DE RECOMENDAR (apartados 5 y 6)
   ===========================================================================
   ⚠️ *"¿Para qué lo necesitas?"* y *"¿cuándo?"*. **Se elige una**, no se deduce
   del reloj: el que va a una cita el martes por la mañana sabe mejor que
   nosotros para qué lo quiere. */

/** Apartado 5 — las ocho del enunciado, que son ocho de las diez de la F24. */
export const OCASIONES_RECOMENDAR = ['diario', 'estudios', 'trabajo', 'cita', 'fiesta', 'noche', 'eventos', 'deporte']
  .map((id) => ocasion(id)).filter(Boolean);

/**
 * Apartado 6 — las cuatro. ⚠️ **No son las tres de la F24**: aquí aparece
 * *"entretiempo"*, que allí no estaba. Se declara el puente para que un perfume
 * de "primavera/verano" siga saliendo cuando pregunta por calor.
 */
export const EPOCAS = [
  { id: 'calor', nombre: 'Calor', icono: '☀️', deLaF24: ['calor', 'todo'] },
  { id: 'entretiempo', nombre: 'Entretiempo', icono: '🌤️', deLaF24: ['calor', 'frio', 'todo'] },
  { id: 'frio', nombre: 'Frío', icono: '❄️', deLaF24: ['frio', 'todo'] },
  { id: 'todo', nombre: 'Todo el año', icono: '🌍', deLaF24: ['calor', 'frio', 'todo'] },
];

export const epoca = (id) => EPOCAS.find((e) => e.id === id) || null;

/** Apartado 11 — cuánto evitar repetir. ⚠️ *"Opcional."* */
export const ESPERAS = [
  { id: 'dos', nombre: '2 días', dias: 2 },
  { id: 'tres', nombre: '3 días', dias: 3 },
  { id: 'semana', nombre: '1 semana', dias: 7 },
  { id: 'personalizado', nombre: 'Personalizado', dias: null },
];

export const espera = (id) => ESPERAS.find((e) => e.id === id) || null;

/** Apartado 10 — los días que puede tener una rotación. */
export const DIAS_SEMANA = [
  { id: 1, nombre: 'Lunes' }, { id: 2, nombre: 'Martes' }, { id: 3, nombre: 'Miércoles' },
  { id: 4, nombre: 'Jueves' }, { id: 5, nombre: 'Viernes' }, { id: 6, nombre: 'Sábado' },
  { id: 0, nombre: 'Domingo' },
];

/* ===========================================================================
   2 · EL ALMACÉN DE ESTA FASE
   ===========================================================================
   ⚠️ Tres cosas, y ni una más: los descartes (para "otra opción"), la rotación
   y la espera. Todo lo demás —qué se recomienda, cuál usa más— **se deriva**. */

export const DIAS_DESCARTE = 30;

export const DEFAULT_RECS_PERFUME = {
  // Apartado 8 — qué descartó, y **para qué ocasión**.
  descartes: [],
  // Apartado 10 — día de la semana → perfume. Vacío si no la usa.
  rotacion: {},
  // Apartado 11 — cuánto esperar antes de repetir. `null` = no le importa.
  espera: null,
  esperaDias: null,
};

export function normalizarDescartePerfume(g) {
  const d = g || {};
  if (typeof d.perfumeId !== 'string' || typeof d.fecha !== 'string') return null;
  return {
    id: d.id || uid(),
    perfumeId: d.perfumeId,
    // ⚠️ `null` es un descarte general; con ocasión, solo para esa.
    ocasion: ocasion(d.ocasion) ? d.ocasion : null,
    fecha: d.fecha,
  };
}

export function normalizarRecsPerfume(guardado, idsValidos = null) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const vale = (id) => (idsValidos === null ? true : idsValidos.includes(id));
  const rotacion = {};
  Object.entries(g.rotacion && typeof g.rotacion === 'object' ? g.rotacion : {})
    .forEach(([k, v]) => {
      const dia = Number(k);
      // ⚠️ Un día que apunta a un perfume borrado no se guarda: mentiría.
      if (DIAS_SEMANA.some((d) => d.id === dia) && vale(v)) rotacion[dia] = v;
    });
  const dias = Number(g.esperaDias);
  return {
    descartes: (Array.isArray(g.descartes) ? g.descartes : [])
      .map(normalizarDescartePerfume).filter((d) => d && vale(d.perfumeId)),
    rotacion,
    espera: espera(g.espera) ? g.espera : null,
    // ⚠️ `Number(null)` es 0 y `Number.isInteger(0)` es `true`: el 0 no espera.
    esperaDias: Number.isInteger(dias) && dias > 0 ? dias : null,
  };
}

export const datosRecsPerfume = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_PERFUMES);
  return normalizarRecsPerfume(mod?.config?.recomendaciones, perfumes(estado).map((p) => p.id));
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_PERFUMES, { recomendaciones: datos });

/* ===========================================================================
   3 · LA COLECCIÓN (apartados 1, 3 y 4)
   =========================================================================== */

/** Apartado 3 — *"esto permite gestionar la colección"*. */
export function ponerDisponibilidad(estado, id, valor) {
  if (valor !== null && !disponibilidad(valor)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa disponibilidad no existe.' };
  }
  return editarPerfume(estado, id, { disponibilidad: valor });
}

export function ponerIntensidadPerfume(estado, id, valor) {
  if (valor !== null && !INTENSIDADES.some((x) => x.id === valor)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa intensidad no existe.' };
  }
  return editarPerfume(estado, id, { intensidad: valor });
}

/**
 * Apartado 1 — *"pequeñas tarjetas… **no mostrar información excesiva de
 * golpe**"*. Así que la tarjeta trae lo justo: nombre, nota y disponibilidad.
 */
export function coleccionPerfumes(estado) {
  if (!parteActivaPerfumes(estado, 'coleccion')) return [];
  return perfumes(estado).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    marca: p.marca,
    // ⚠️ Sin valoración NO se pone un 0: se deja `null` y la tarjeta no la pinta.
    valoracion: p.valoracion,
    favorito: p.favorito,
    disponibilidad: disponibilidad(p.disponibilidad),
  }));
}

/** ⚠️ *"Terminado"* sigue en la colección: es historia, no basura. */
export const perfumesDisponibles = (estado) =>
  perfumes(estado).filter((p) => p.disponibilidad !== 'terminado');

/* ===========================================================================
   4 · LA RECOMENDACIÓN (apartados 7 y 8)
   ===========================================================================
   ⚠️ **Sin IA**, y **cada perfume dice por qué sale**. Lo que no encaja con
   nada no se propone, y lo que él dijo que prefiere evitar tampoco. */

const usadoHace = (historial, perfumeId, hoy) => {
  const ultimo = historial.find((u) => u.perfumeId === perfumeId);
  return ultimo ? diasDesde(ultimo.fecha, hoy) : null;
};

export function puntuarPerfume(p, ctx) {
  /* ⚠️ Cada motivo es una **frase entera**, no un trozo detrás de "Encaja con":
     el ejemplo del apartado 7 es *"encaja con tus preferencias **y** lo has
     marcado como adecuado para ocasiones nocturnas"*, o sea dos oraciones
     unidas. Y en ese orden, que es como se lee bien. */
  const motivos = [];
  let peso = 0;

  // Sus aromas favoritos, del perfil de la Fase 24.
  const suyos = p.tipo.filter((t) => ctx.gustan.includes(t));
  if (suyos.length > 0) {
    peso += 3;
    motivos.push(`encaja con tus preferencias (${suyos.map((t) => aroma(t)?.nombre.toLowerCase()).filter(Boolean).join(' y ')})`);
  }
  // Apartado 5 — la ocasión que ha pedido.
  if (ctx.ocasion && p.ocasiones.includes(ctx.ocasion)) {
    peso += 4;
    motivos.push(`lo has marcado como adecuado para ${ocasion(ctx.ocasion)?.nombre.toLowerCase()}`);
  }
  // Apartado 6 — la época.
  if (ctx.epoca && p.temporada && epoca(ctx.epoca)?.deLaF24.includes(p.temporada)) {
    peso += 2;
    motivos.push(`va bien para ${epoca(ctx.epoca)?.nombre.toLowerCase()}`);
  }
  // La intensidad que prefiere.
  if (ctx.intensidad && ctx.intensidad !== 'ocasion' && p.intensidad === ctx.intensidad) {
    peso += 2;
    motivos.push('tiene la intensidad que sueles preferir');
  }
  // Y lo que él ha puntuado bien.
  if (p.valoracion !== null && p.valoracion >= 4) {
    peso += 1;
    motivos.push(`tú le has puesto ${p.valoracion} de 5`);
  }
  if (p.favorito) { peso += 1; motivos.push('es uno de tus favoritos'); }
  return { peso, motivos };
}

/**
 * Apartado 7 — la recomendación, con su porqué. Y el 8: `saltar` es cuántas
 * veces ha pedido *"otra opción"*, así que se devuelve la siguiente compatible.
 */
export function recomendarPerfume(estado, { ocasion: oc = null, epoca: ep = null, hoy = todayISO(), saltar = 0, datosGlobales = {} } = {}) {
  if (!parteActivaPerfumes(estado, PARTE_RECOMENDACIONES_PERFUME)) {
    return { activo: false, hay: false, perfume: null, porque: '', texto: '', total: 0 };
  }
  const d = datosPerfumes(estado);
  const recs = datosRecsPerfume(estado);
  const perfil = contextoPerfumes(estado, datosGlobales);
  const ctx = {
    ocasion: oc,
    epoca: ep,
    gustan: perfil.gustan,
    intensidad: perfil.intensidad,
  };

  /* ⚠️ Fuera lo terminado, lo que choca con lo que dijo evitar, y lo que
     descartó **para esta ocasión** (apartado 8), mientras no caduque. */
  const descartados = recs.descartes
    .filter((x) => (x.ocasion === null || x.ocasion === oc) && diasDesde(x.fecha, hoy) < DIAS_DESCARTE)
    .map((x) => x.perfumeId);

  // ⚠️ Sin nombre propio esto sombreaba a `espera()`, la función del catálogo.
  const diasEspera = recs.espera === 'personalizado' ? recs.esperaDias : (espera(recs.espera)?.dias ?? null);

  const candidatos = perfumesDisponibles(estado)
    .filter((p) => !descartados.includes(p.id))
    .filter((p) => !chocaConSusGustos(estado, p.tipo, datosGlobales).choca)
    .map((p) => {
      const { peso, motivos } = puntuarPerfume(p, ctx);
      const hace = usadoHace(d.historial, p.id, hoy);
      /* ⚠️ Apartado 11 — usado hace poco **BAJA**, no desaparece: si es el único
         que encaja, se propone igual y se dice. Esconderlo sería decidir por él. */
      const reciente = diasEspera !== null && hace !== null && hace < diasEspera;
      return { ...p, peso: reciente ? peso - 5 : peso, motivos, hace, reciente };
    })
    .filter((p) => p.motivos.length > 0);

  candidatos.sort((a, b) => b.peso - a.peso || a.nombre.localeCompare(b.nombre));

  if (candidatos.length === 0) {
    return {
      activo: true, hay: false, perfume: null, porque: '', total: 0,
      /* ⚠️ Y se dice por qué no hay: sin datos no se inventa una recomendación. */
      texto: perfumesDisponibles(estado).length === 0
        ? 'Añade algún perfume a tu colección y te ayudamos a elegir.'
        : 'Con lo que sabemos todavía no podemos proponerte ninguno. Cuéntanos para qué lo quieres.',
    };
  }

  // Apartado 8 — *"el siguiente perfume compatible"*.
  const elegido = candidatos[Math.min(saltar, candidatos.length - 1)];
  return {
    activo: true,
    hay: true,
    perfume: elegido,
    // ⚠️ El porqué, con la forma del ejemplo del enunciado.
    porque: `${mayuscula(enumerar(elegido.motivos))}.`,
    aviso: elegido.reciente ? `Lo usaste hace ${elegido.hace} ${elegido.hace === 1 ? 'día' : 'días'}.` : '',
    titulo: oc ? `${ocasion(oc)?.icono || ''} Para ${ocasion(oc)?.nombre.toLowerCase()}` : 'Para hoy',
    total: candidatos.length,
    // ⚠️ Y se dice si hay más, para que "otra opción" no sea un botón que miente.
    hayMas: candidatos.length > saltar + 1,
    guardado: false,
  };
}

const enumerar = (xs) => (xs.length < 2 ? (xs[0] || '') : `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}`);

const mayuscula = (t) => (t ? t[0].toUpperCase() + t.slice(1) : '');

/** Apartado 8 — *"no repetir continuamente uno que haya descartado"*. */
export function descartarPerfume(estado, perfumeId, { ocasion: oc = null, hoy = todayISO() } = {}) {
  if (!perfume(estado, perfumeId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese perfume no existe.' };
  }
  const d = datosRecsPerfume(estado);
  const descartes = [
    ...d.descartes.filter((x) => !(x.perfumeId === perfumeId && x.ocasion === (ocasion(oc) ? oc : null))),
    normalizarDescartePerfume({ perfumeId, ocasion: oc, fecha: hoy }),
  ].filter(Boolean);
  return { estado: escribir(estado, { ...d, descartes }), error: null };
}

export function deshacerDescartePerfume(estado, perfumeId, { ocasion: oc = null } = {}) {
  const d = datosRecsPerfume(estado);
  return {
    estado: escribir(estado, {
      ...d,
      descartes: d.descartes.filter((x) => !(x.perfumeId === perfumeId && x.ocasion === (ocasion(oc) ? oc : null))),
    }),
    error: null,
  };
}

/* ===========================================================================
   5 · COMPARAR (apartado 9)
   ===========================================================================
   ⚠️ **La tabla es del motor de productos** (F17): tope de tres, raya para lo
   que no se sabe, y **la comparación no elige**. Aquí solo van sus cuatro filas. */

export const FILAS_COMPARACION_PERFUME = [
  { id: 'intensidad', nombre: 'Intensidad' },
  { id: 'ocasion', nombre: 'Ocasión' },
  { id: 'temporada', nombre: 'Temporada' },
  { id: 'valoracion', nombre: 'Valoración' },
];

export function compararPerfumes(estado, ids = []) {
  const todos = perfumes(estado);
  const filas = compararGenerico(todos, ids, {
    intensidad: (p) => INTENSIDADES.find((x) => x.id === p.intensidad)?.nombre,
    ocasion: (p) => p.ocasiones.map((o) => ocasion(o)?.nombre).filter(Boolean).join(', '),
    temporada: (p) => temporada(p.temporada)?.nombre,
    // ⚠️ Sin valoración, una raya: no un 0, que sería una nota que él no puso.
    valoracion: (p) => (p.valoracion === null ? '' : `${p.valoracion}/5`),
  });
  const elegidos = ids.slice(0, MAX_COMPARAR).map((id) => todos.find((p) => p.id === id)).filter(Boolean);
  if (elegidos.length < 2) {
    return { perfumes: elegidos, filas: [], suficiente: false, texto: 'Elige al menos dos para compararlos.' };
  }
  return {
    perfumes: elegidos,
    filas: FILAS_COMPARACION_PERFUME.map((f) => ({ ...f, valores: filas.map((x) => x[f.id]) })),
    suficiente: true,
    texto: '',
    recortado: ids.length > MAX_COMPARAR,
  };
}

/* ===========================================================================
   6 · LA ROTACIÓN (apartados 10 y 11)
   ===========================================================================
   ⚠️ *"Pero **solamente si el usuario activa esta función**."* Si está apagada,
   estas funciones devuelven `null` — no una lista vacía que la pantalla tendría
   que interpretar. */

export function ponerEnRotacion(estado, dia, perfumeId) {
  const n = Number(dia);
  if (!DIAS_SEMANA.some((d) => d.id === n)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese día no existe.' };
  }
  if (perfumeId !== null && !perfume(estado, perfumeId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese perfume no existe.' };
  }
  const d = datosRecsPerfume(estado);
  const rotacion = { ...d.rotacion };
  if (perfumeId === null) delete rotacion[n]; else rotacion[n] = perfumeId;
  return { estado: escribir(estado, { ...d, rotacion }), error: null };
}

export function rotacionPerfumes(estado) {
  // ⚠️ `null`, no `[]`: apagada y vacía son dos cosas distintas.
  if (!parteActivaPerfumes(estado, PARTE_ROTACION)) return null;
  const d = datosRecsPerfume(estado);
  const todos = perfumes(estado);
  return DIAS_SEMANA.map((dia) => ({
    ...dia,
    perfume: todos.find((p) => p.id === d.rotacion[dia.id]) || null,
  }));
}

export function tocaHoyEnRotacion(estado, { hoy = todayISO() } = {}) {
  if (!parteActivaPerfumes(estado, PARTE_ROTACION)) return null;
  const dia = new Date(`${hoy}T00:00:00`).getDay();
  const id = datosRecsPerfume(estado).rotacion[dia];
  return id ? perfume(estado, id) : null;
}

/** Apartado 11 — cuánto esperar antes de repetir. ⚠️ Opcional. */
export function ponerEspera(estado, id, dias = null) {
  if (id !== null && !espera(id)) return { estado: normalizarEstiloHombre(estado), error: 'Esa opción no existe.' };
  const n = Number(dias);
  if (id === 'personalizado' && !(Number.isInteger(n) && n > 0)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Dime cuántos días, con un número.' };
  }
  const d = datosRecsPerfume(estado);
  return {
    estado: escribir(estado, { ...d, espera: id, esperaDias: id === 'personalizado' ? n : null }),
    error: null,
  };
}

/* ===========================================================================
   7 · LAS ESTADÍSTICAS (apartado 17)
   ===========================================================================
   ⚠️ *"Solo si el usuario activa seguimiento… **sin necesidad de estadísticas
   complejas**."* Tres cifras, derivadas del historial, y ni una más. */

export function estadisticasPerfumes(estado, { hoy = todayISO() } = {}) {
  // ⚠️ `null` si no la ha activado: no se enseña nada (apartado 17).
  if (!parteActivaPerfumes(estado, PARTE_ESTADISTICAS)) return null;
  const d = datosPerfumes(estado);
  if (d.perfumes.length === 0) return { hay: false, texto: 'Todavía no tienes perfumes en tu colección.' };

  const usos = {};
  d.historial.forEach((u) => { if (u.perfumeId) usos[u.perfumeId] = (usos[u.perfumeId] || 0) + 1; });
  const conUsos = d.perfumes.map((p) => ({ ...p, usos: usos[p.id] || 0 }));

  const masUsado = [...conUsos].sort((a, b) => b.usos - a.usos)[0];
  const valorados = conUsos.filter((p) => p.valoracion !== null);
  const masValorado = valorados.length > 0
    ? [...valorados].sort((a, b) => b.valoracion - a.valoracion)[0] : null;
  const menosUsado = conUsos.length > 1 ? [...conUsos].sort((a, b) => a.usos - b.usos)[0] : null;

  return {
    hay: true,
    /* ⚠️ Sin ni un uso registrado NO hay "más utilizado": todos empatan a cero,
       y decir que uno es el más usado sería inventarlo. */
    masUsado: masUsado && masUsado.usos > 0 ? { nombre: masUsado.nombre, usos: masUsado.usos } : null,
    masValorado: masValorado ? { nombre: masValorado.nombre, valoracion: masValorado.valoracion } : null,
    menosUsado: menosUsado && masUsado && masUsado.usos > 0 && menosUsado.id !== masUsado.id
      ? { nombre: menosUsado.nombre, usos: menosUsado.usos } : null,
    total: d.perfumes.length,
    registros: d.historial.length,
    texto: d.historial.length === 0 ? 'Cuando apuntes algún uso, aquí verás cuáles usas más.' : '',
  };
}

/* ===========================================================================
   8 · COMPRA Y ALTERNATIVAS (apartados 14 y 15)
   ===========================================================================
   ⚠️ *"Incluyendo enlaces de afiliación cuando corresponda"*: todo eso vive en
   la ficha de la Fase 17, y aquí se llega a través del `productoId`. **Ni un
   precio guardado en este archivo.** */

export function dondeComprarlo(estado, perfumeId) {
  const p = perfume(estado, perfumeId);
  if (!p) return { hay: false, enlaces: [], texto: '' };
  if (!p.productoId) {
    return {
      hay: false,
      enlaces: [],
      // ⚠️ Sin ficha no se inventa una tienda ni un precio.
      texto: 'No lo has enlazado con ningún producto, así que no tenemos dónde verlo.',
    };
  }
  const ficha = catalogoParaPerfumes(estado).find((x) => x.id === p.productoId);
  if (!ficha) return { hay: false, enlaces: [], texto: 'El producto que tenía enlazado ya no está.' };
  const enl = enlacesDeProducto(ficha);
  return {
    hay: !enl.sinEnlaces,
    enlaces: enl.enlaces,
    donde: enl.donde,
    aviso: enl.aviso,
    // El precio sale de la ficha, no de aquí.
    precio: ficha.precio,
    texto: enl.sinEnlaces ? enl.sinEnlacesTexto : '',
  };
}

/**
 * Apartado 15 — *"si el perfume es demasiado caro: buscar alternativas"*,
 * filtrando por presupuesto, familia olfativa, ocasión e intensidad. ⚠️ Salen
 * **de su colección**, que es lo único que existe: no hay catálogo de perfumes.
 */
export function alternativasDePerfume(estado, perfumeId, { presupuesto = null } = {}) {
  const p = perfume(estado, perfumeId);
  if (!p) return { hay: false, alternativas: [], porque: '' };
  const cat = catalogoParaPerfumes(estado);
  const precioDe = (x) => (x.productoId ? cat.find((c) => c.id === x.productoId)?.precio ?? null : null);
  const suyo = precioDe(p);

  const alternativas = perfumesDisponibles(estado)
    .filter((x) => x.id !== perfumeId)
    .map((x) => {
      const motivos = [];
      if (x.tipo.some((t) => p.tipo.includes(t))) motivos.push('comparte familia olfativa');
      if (x.ocasiones.some((o) => p.ocasiones.includes(o))) motivos.push('vale para la misma ocasión');
      if (x.intensidad && x.intensidad === p.intensidad) motivos.push('tiene la misma intensidad');
      const precio = precioDe(x);
      // ⚠️ Y "más barato" solo se dice si se saben LOS DOS precios.
      if (suyo !== null && precio !== null && precio < suyo) motivos.push('cuesta menos');
      return { ...x, precio, motivos };
    })
    .filter((x) => x.motivos.length > 0)
    .filter((x) => (presupuesto === null || x.precio === null || x.precio <= presupuesto));

  alternativas.sort((a, b) => b.motivos.length - a.motivos.length || a.nombre.localeCompare(b.nombre));
  return {
    hay: alternativas.length > 0,
    alternativas,
    porque: alternativas.length === 0
      ? 'De momento no tienes otro parecido en tu colección.'
      : '',
  };
}

/* ===========================================================================
   9 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export function resumenRecsPerfume(estado, { hoy = todayISO() } = {}) {
  const d = datosRecsPerfume(estado);
  const rot = rotacionPerfumes(estado);
  return {
    descartes: d.descartes.length,
    // ⚠️ `null` si la rotación está apagada, no 0.
    rotacion: rot === null ? null : rot.filter((x) => x.perfume).length,
    espera: d.espera,
    esperaDias: d.esperaDias,
    tocaHoy: tocaHoyEnRotacion(estado, { hoy })?.nombre || null,
    coleccion: coleccionPerfumes(estado).length,
    disponibles: perfumesDisponibles(estado).length,
  };
}

export function auditarRecsPerfume() {
  return {
    // Apartado 9 — la tabla es la del motor de productos.
    tablasNuevas: 0,
    motorComparacion: 'motorProductos.js',
    // Apartado 10 — ni una racha, ni una obligación (D2-02).
    rachas: 0, puntos: 0,
    // Apartados 14 y 15 — ni un precio guardado aquí.
    preciosGuardados: 0,
    catalogosNuevos: 0,
    // Sin IA, con esas palabras en el objetivo.
    usaIA: 0,
  };
}

export function textosDeRecsPerfume() {
  return [
    ...OCASIONES_RECOMENDAR.map((o) => o.nombre),
    ...EPOCAS.map((e) => e.nombre),
    ...ESPERAS.map((e) => e.nombre),
    ...DIAS_SEMANA.map((d) => d.nombre),
    ...DISPONIBILIDADES.map((d) => d.nombre),
    ...FILAS_COMPARACION_PERFUME.map((f) => f.nombre),
  ].filter(Boolean);
}

export function panelRecsPerfume(estado, { ocasion: oc = null, epoca: ep = null, hoy = todayISO(), saltar = 0, datosGlobales = {} } = {}) {
  return {
    coleccion: coleccionPerfumes(estado),
    ocasiones: OCASIONES_RECOMENDAR,
    epocas: EPOCAS,
    recomendacion: recomendarPerfume(estado, { ocasion: oc, epoca: ep, hoy, saltar, datosGlobales }),
    rotacion: rotacionPerfumes(estado),
    tocaHoy: tocaHoyEnRotacion(estado, { hoy }),
    esperas: ESPERAS,
    estadisticas: estadisticasPerfumes(estado, { hoy }),
    resumen: resumenRecsPerfume(estado, { hoy }),
  };
}

export { MAX_COMPARAR, DISPONIBILIDADES, disponibilidad, INTENSIDADES };
