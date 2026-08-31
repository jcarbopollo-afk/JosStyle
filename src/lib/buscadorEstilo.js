// ============================================================================
// EH · Fase 37/65 — BUSCADOR Y NAVEGACIÓN INTERNA
//
// *"Muchos módulos por detrás, interfaz sencilla por delante."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ EL APARTADO 11 DECIDE QUÉ SE CONSTRUYE Y QUÉ NO.** *"Si JosStyle ya
// tiene un buscador global, **no crear otro buscador independiente**. La
// búsqueda interna solo será necesaria si aporta una experiencia más rápida."*
//   · Los **módulos** ya los busca `buscarModulos()` (F2), y Estilo de hombre ya
//     está en el índice global (BI F3). Ni una copia de ninguno de los dos.
//   · Lo que **nadie indexa** son sus ELEMENTOS: perfumes, accesorios, gustos,
//     rutinas, productos y preferencias. Eso es lo que aporta esta fase, y es
//     literalmente la lista del apartado 1.
//
// **2. ⚠️ AÑADIR UNA FUENTE ES AÑADIR UNA LÍNEA A `FUENTES_BUSQUEDA`**, como
// `MODULOS_EH` en la F1 o `METRICAS_PROGRESO` en la F35. Cada línea dice de qué
// módulo es, cómo se llama su grupo y **de dónde saca su lista** — siempre del
// `datos*()` que ya existe. Ni un índice guardado, ni una copia de nada.
//
// **3. ⚠️ UN MÓDULO OCULTO O DESACTIVADO SALE, PERO MARCADO, Y NUNCA SE ENCIENDE
// SOLO** (apartados 13 y 14, con esas palabras: *"nunca activarlo
// automáticamente"*). Se apoya en `estadoDe()` de la F36 y devuelve la acción
// como **oferta**, no como efecto: decimosexto `aplicarPlan`.
//
// **4. ⚠️ LO ELIMINADO NO APARECE** (apartado 15). Y sale gratis: lo borrado se
// fue de su lista a la papelera, así que **no hay nada que filtrar**. Lo que sí
// hay es una prueba de que este archivo **no mira la papelera**.
//
// **5. ⚠️ NO HAY FAVORITOS GLOBALES** (apartado 6: *"conectado al sistema
// global. No crear favoritos independientes"*). Lo que hay son favoritos **por
// módulo** —`prenda.favorita`, `perfume.favorito`, `gusto.favorito`— y las
// `guardadas` de la F32. Así que el buscador **lee el favorito de cada módulo**
// y no crea ninguno; la pantalla dice dónde están. Sexta vez de esta lección.
//
// **6. ⚠️ Y "RECIENTES" GUARDA LO QUE ÉL ABRE DESDE AQUÍ, NO POR DÓNDE NAVEGA**
// (apartado 5). La F31 ya decidió que **no existe un registro de uso** y que
// crearlo obligaría a escribir en cada navegación. Esto es otra cosa: un toque
// explícito suyo en un resultado, que es exactamente lo que hace el buscador
// global desde BI F3. Se guardan **ids**, nunca lo que escribió.
// ============================================================================

import {
  normalizarEstiloHombre, guardarConfig, moduloEH, IDS_EH,
} from './estiloDeHombre';
import { buscarModulos } from './gestionModulos';
import { MODULO_ANFITRION } from './miEstilo';
/* ⚠️ Decisión 3 — los tres estados son los de la F36. Ni uno nuevo. */
import {
  estadoDe, estadoGestion, mostrarModulo, activarModulo, TEXTOS_GESTION_EH,
} from './gestionEstilo';
/* ⚠️ Decisión 2 — cada fuente sale del `datos*()` que ya existe. */
import { datosPerfumes } from './perfumes';
import { accesorios as accesoriosDe } from './accesorios';
import { datosGustos } from './gustos';
import { datosRutinasPiel } from './rutinasPiel';
import { datosPelo } from './rutinasPelo';
import { datosRutinasBarba } from './rutinasBarba';
import { datosRutinasCuerpo } from './rutinasCuerpo';
import { datosSonrisa } from './sonrisa';
import {
  PARTES_HIGIENE, PARTES_CUERPO, parteActivaCH, MODULO_HIGIENE, MODULO_CUERPO,
} from './cuerpoHigiene';
import { productosPelo } from './productosPelo';
import { productosPiel } from './productosPiel';
import { misPreferencias } from './gustos';
import { objetivosDeEstilo } from './progresoEstilo';

/* ===========================================================================
   1 · NORMALIZAR EL TEXTO
   ===========================================================================
   ⚠️ Sin tildes y en minúsculas, para que *"perfume"* encuentre *"Perfumé"* y
   *"bar…"* encuentre Barba (apartado 3: **sin terminar la palabra**). Es la
   misma idea que `normalizar()` del índice global; aquí se queda en tres
   líneas porque no hace falta más, y así este archivo no arrastra el índice
   entero para comparar dos cadenas. */

export const limpiar = (t) => String(t || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .trim();

/** Apartado 3 — *"bar…"* encuentra Barba: basta con que empiece o contenga. */
export const encaja = (texto, consulta) => {
  const c = limpiar(consulta);
  return c.length > 0 && limpiar(texto).includes(c);
};

/* ===========================================================================
   2 · LAS FUENTES (apartados 1 y 2)
   ===========================================================================
   *"Buscará entre: módulos, productos, rutinas, perfumes, accesorios,
   preferencias, gustos y objetivos relacionados."*

   ⚠️ **Una línea por fuente.** `lista(estado, ctx)` devuelve `{ id, nombre,
   favorito }` por elemento, siempre desde el `datos*()` de su módulo — nunca de
   un índice guardado, que se quedaría viejo en cuanto él borrase algo. */

const nombresDe = (arr, campo = 'nombre') => (Array.isArray(arr) ? arr : [])
  .filter((x) => x && typeof x[campo] === 'string')
  .map((x) => ({ id: x.id, nombre: x[campo], favorito: x.favorito === true || x.favorita === true }));

export const FUENTES_BUSQUEDA = [
  {
    id: 'perfumes', modulo: 'perfumes', grupo: 'Mis perfumes', icono: '🌫️', zona: null,
    lista: (e) => nombresDe(datosPerfumes(e).perfumes),
  },
  {
    id: 'porProbar', modulo: 'perfumes', grupo: 'Quiero probar', icono: '🎯', zona: null,
    lista: (e) => nombresDe(datosPerfumes(e).porProbar),
  },
  {
    id: 'accesorios', modulo: 'accesorios', grupo: 'Accesorios', icono: '🕶️', zona: null,
    lista: (e, { armario }) => nombresDe(accesoriosDe(e, armario || { prendas: [], outfits: [], usos: [] })),
  },
  {
    id: 'gustos', modulo: 'gustos', grupo: 'Mis gustos', icono: '❤️', zona: null,
    lista: (e) => nombresDe(datosGustos(e).entradas),
  },
  {
    id: 'rutinasPiel', modulo: 'skincare', grupo: 'Rutinas de cuidado', icono: '🧴', zona: 'rutina',
    lista: (e) => nombresDe(datosRutinasPiel(e).rutinas),
  },
  {
    id: 'rutinasPelo', modulo: 'pelo', grupo: 'Rutinas de pelo', icono: '💇', zona: 'rutina',
    lista: (e) => nombresDe(datosPelo(e).rutinas),
  },
  {
    id: 'rutinasBarba', modulo: 'barba', grupo: 'Rutinas de barba', icono: '🧔', zona: 'rutinas',
    lista: (e) => nombresDe(datosRutinasBarba(e).rutinas),
  },
  /* ⚠️ **EH F18** — lo que se busca de Higiene y de Cuidado corporal son **sus
     partes**: es lo único que guardan hasta que llegue la F19. */
  {
    id: 'partesHigiene', modulo: 'higiene', grupo: 'Higiene', icono: '🧼', zona: null,
    lista: (e) => PARTES_HIGIENE.filter((p) => parteActivaCH(e, MODULO_HIGIENE, p.id))
      /* ⚠️ El campo es `nombre`, que es lo que lee `buscarEnEstilo`. Con
         `texto` la fuente no habría encontrado nunca nada — y la prueba de que
         cada fuente trae su lista habría pasado igual. */
      .map((p) => ({ id: `hig_${p.id}`, nombre: p.nombre })),
  },
  {
    id: 'partesCuerpo', modulo: 'cuerpo', grupo: 'Cuidado corporal', icono: '🧍', zona: null,
    lista: (e) => PARTES_CUERPO.filter((p) => parteActivaCH(e, MODULO_CUERPO, p.id))
      .map((p) => ({ id: `cue_${p.id}`, nombre: p.nombre })),
  },
  /* ⚠️ **EH F19** — y ahora también sus rutinas, que es lo que él nombra cuando
     busca. Dos fuentes, una por apartado (C-25). */
  {
    id: 'rutinasHigiene', modulo: 'higiene', grupo: 'Rutinas de higiene', icono: '🚿', zona: 'rutinas',
    lista: (e) => nombresDe(datosRutinasCuerpo(e, MODULO_HIGIENE).rutinas),
  },
  {
    id: 'rutinasCuerpo', modulo: 'cuerpo', grupo: 'Rutinas de cuidado corporal', icono: '🧴', zona: 'rutinas',
    lista: (e) => nombresDe(datosRutinasCuerpo(e, MODULO_CUERPO).rutinas),
  },
  {
    id: 'rutinasSonrisa', modulo: 'sonrisa', grupo: 'Rutinas de sonrisa', icono: '😁', zona: null,
    lista: (e) => nombresDe(datosSonrisa(e).rutinas),
  },
  {
    id: 'productosPelo', modulo: 'pelo', grupo: 'Productos de pelo', icono: '🛒', zona: 'productos',
    lista: (e) => nombresDe(productosPelo(e)),
  },
  {
    id: 'productosPiel', modulo: 'skincare', grupo: 'Productos de cuidado', icono: '🛒', zona: 'productos',
    lista: (e) => nombresDe(productosPiel(e)),
  },
  {
    /* ⚠️ Las preferencias son la vista de la F27 sobre el registro de la F4:
       ni una lista nueva. Y se busca por su nombre Y por lo que él contestó. */
    id: 'preferencias', modulo: MODULO_ANFITRION, grupo: 'Mis preferencias', icono: '⚙️', zona: 'preferencias',
    lista: (e, { datosGlobales }) => misPreferencias(e, datosGlobales)
      .filter((p) => p.tiene)
      .map((p) => ({ id: p.id, nombre: `${p.nombre}: ${p.texto}`, favorito: false })),
  },
  {
    /* Apartado 1 — *"objetivos relacionados"*. Del sistema global (F28 y F35). */
    id: 'objetivos', modulo: MODULO_ANFITRION, grupo: 'Objetivos', icono: '🎯', zona: null,
    lista: (e, { objetivos }) => nombresDe(objetivosDeEstilo(objetivos) || [], 'texto'),
  },
];

export const fuenteBusqueda = (id) => FUENTES_BUSQUEDA.find((f) => f.id === id) || null;

export const TEXTOS_BUSCADOR = {
  titulo: '🔍 Buscar en Estilo de hombre',
  // Apartado 4, literal.
  sinResultados: 'No hemos encontrado nada.',
  explorar: 'Explorar todos los apartados',
  // Apartado 5.
  recientes: '🕘 Recientes',
  sinRecientes: 'Aquí aparecerá lo último que abras desde el buscador.',
  // Apartado 6 — y dónde están de verdad, porque no hay favoritos globales.
  favoritos: '❤️ Favoritos',
  dondeEstanFavoritos: 'Los favoritos son los de cada apartado: no hay una lista aparte.',
  soloFavoritos: 'Solo favoritos',
  // Apartados 7, 8 y 9.
  volver: '← Estilo de hombre',
  // Apartado 13.
  oculto: '👁️ Apartado oculto',
  mostrarApartado: 'Mostrar apartado',
  // Apartado 14.
  desactivado: '⏸️ Apartado desactivado',
  activarApartado: 'Activar',
  // Apartado 15.
  eliminadosNoSalen: 'Lo que borraste no sale aquí: está en 🗑️ Eliminados recientemente.',
};

/* ===========================================================================
   3 · BUSCAR (apartados 1, 2, 3, 12, 13 y 14)
   ===========================================================================
   ⚠️ **No escribe nada.** Buscar y abrir son dos llamadas: repintar la pantalla
   no puede ensuciar los recientes. */

export const MAX_POR_GRUPO = 5;

/**
 * Apartado 2 — *"no mezclar todo en una lista caótica"*: **agrupado**, con los
 * módulos primero y después sus elementos, y cada grupo con su icono.
 *
 * Apartado 12 — *"desde Perfumes, priorizar Perfumes… antes que resultados
 * ajenos"*: `desde` sube los grupos de ese módulo al principio. **No esconde
 * nada**: los demás siguen debajo, que es la lección de la F25.
 */
export function buscarEnEstilo(estado, consulta, {
  armario = null, datosGlobales = {}, objetivos = null,
  desde = null, soloFavoritos = false, limite = MAX_POR_GRUPO,
} = {}) {
  const e = normalizarEstiloHombre(estado);
  const c = limpiar(consulta);
  if (c.length === 0) return { consulta: '', grupos: [], total: 0, vacio: false, texto: '' };

  const grupos = [];

  /* ── Los módulos: `buscarModulos()` de la F2, con su estado de la F36 ──── */
  const modulos = buscarModulos(e, consulta).map((m) => {
    const est = estadoDe(e, m.id);
    return {
      id: m.id,
      nombre: m.nombre,
      icono: m.icono,
      modulo: m.id,
      zona: null,
      // Apartados 13 y 14 — sale, pero marcado.
      estado: est,
      insignia: est === 'activo' ? null : estadoGestion(est),
      aviso: est === 'oculto' ? TEXTOS_BUSCADOR.oculto
        : (est === 'desactivado' ? TEXTOS_BUSCADOR.desactivado : null),
      accion: est === 'oculto' ? TEXTOS_BUSCADOR.mostrarApartado
        : (est === 'desactivado' ? TEXTOS_BUSCADOR.activarApartado : null),
      favorito: false,
    };
  });
  /* ⚠️ Con el filtro de favoritos puesto, los MÓDULOS no salen: un apartado no
     es un favorito, y colarlo en "❤️ Favoritos" haría que el filtro pareciera
     roto la primera vez que él lo use. */
  if (modulos.length > 0 && !soloFavoritos) {
    grupos.push({ id: 'modulos', grupo: 'Apartados', icono: '🧩', modulo: null, resultados: modulos.slice(0, limite), total: modulos.length });
  }

  /* ── Y los elementos, uno por fuente ─────────────────────────────────── */
  const ctx = { armario, datosGlobales, objetivos };
  FUENTES_BUSQUEDA.forEach((f) => {
    /* ⚠️ Un módulo DESACTIVADO no aporta elementos: dejó de funcionar (F36,
       apartado 4). Uno **oculto sí**, porque ocultar no cambia nada por dentro
       —y encontrarlo desde el buscador es justo para lo que sirve—. */
    if (IDS_EH.includes(f.modulo) && estadoDe(e, f.modulo) === 'desactivado') return;
    let lista = [];
    try { lista = f.lista(e, ctx) || []; } catch { lista = []; }
    const encontrados = lista
      .filter((x) => encaja(x.nombre, consulta))
      // Apartado 6 — el favorito es el de su módulo, no una lista aparte.
      .filter((x) => !soloFavoritos || x.favorito)
      .map((x) => ({ ...x, modulo: f.modulo, zona: f.zona, icono: f.icono, estado: 'activo', insignia: null, aviso: null, accion: null }));
    if (encontrados.length > 0) {
      grupos.push({ id: f.id, grupo: f.grupo, icono: f.icono, modulo: f.modulo, resultados: encontrados.slice(0, limite), total: encontrados.length });
    }
  });

  /* Apartado 12 — lo del módulo desde el que busca, primero. */
  const ordenados = desde
    ? [...grupos].sort((a, b) => (b.modulo === desde ? 1 : 0) - (a.modulo === desde ? 1 : 0))
    : grupos;

  const total = ordenados.reduce((s, g) => s + g.total, 0);
  return {
    consulta,
    grupos: ordenados,
    total,
    vacio: total === 0,
    // Apartado 4 — y su salida, para que no se quede en un callejón.
    texto: total === 0 ? TEXTOS_BUSCADOR.sinResultados : '',
  };
}

/**
 * Apartados 13 y 14 — ⚠️ **decimosexto `aplicarPlan`: sin `confirmado` no
 * enciende nada.** *"Nunca activarlo automáticamente."*
 */
export function resolverApartado(estado, id, { confirmado = false } = {}) {
  const e = normalizarEstiloHombre(estado);
  const est = estadoDe(e, id);
  if (est === null || est === 'activo') return { estado: e, aplicado: false, aviso: null };
  const aviso = {
    titulo: est === 'oculto' ? TEXTOS_BUSCADOR.oculto : TEXTOS_BUSCADOR.desactivado,
    texto: est === 'oculto'
      ? `${moduloEH(id)?.nombre} está oculto de tu pantalla principal.`
      : `${moduloEH(id)?.nombre} está desactivado, así que ahora mismo no funciona.`,
    // ⚠️ Y se dice que sus datos siguen ahí, que es lo que le preocupa (F36).
    nota: TEXTOS_GESTION_EH.desactivarNoBorra,
    confirmar: est === 'oculto' ? TEXTOS_BUSCADOR.mostrarApartado : TEXTOS_BUSCADOR.activarApartado,
    cancelar: 'Cancelar',
  };
  if (!confirmado) return { estado: e, aplicado: false, aviso };
  return {
    estado: est === 'oculto' ? mostrarModulo(e, id) : activarModulo(e, id),
    aplicado: true,
    aviso: null,
  };
}

/* ===========================================================================
   4 · LOS RECIENTES (apartado 5)
   ===========================================================================
   *"Opcionalmente: 🕘 Recientes. **Solo las últimas cosas utilizadas.**"*

   ⚠️ **Se guardan IDS de módulo, y solo al abrir algo DESDE AQUÍ** (decisión 6).
   Ni lo que escribió —que sería guardar sus búsquedas— ni un espía de
   navegación, que es lo que la F31 se negó a inventar. */

export const MAX_RECIENTES = 4;

export const DEFAULT_BUSCADOR = { recientes: [] };

export function normalizarBuscador(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    // ⚠️ Solo módulos que existen: uno retirado del catálogo no revive.
    recientes: (Array.isArray(g.recientes) ? g.recientes : [])
      .filter((id) => IDS_EH.includes(id))
      .slice(0, MAX_RECIENTES),
  };
}

export const datosBuscador = (estado) => {
  const e = normalizarEstiloHombre(estado);
  return normalizarBuscador(e.modulos.find((m) => m.id === MODULO_ANFITRION)?.config?.buscador);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_ANFITRION, { buscador: datos });

/** Al abrir un resultado. ⚠️ El más reciente primero, y sin repetirse. */
export function apuntarReciente(estado, moduloId) {
  if (!IDS_EH.includes(moduloId)) return normalizarEstiloHombre(estado);
  const d = datosBuscador(estado);
  const recientes = [moduloId, ...d.recientes.filter((x) => x !== moduloId)].slice(0, MAX_RECIENTES);
  return escribir(estado, { ...d, recientes });
}

export const olvidarRecientes = (estado) => escribir(estado, { ...datosBuscador(estado), recientes: [] });

/** Los que se pintan, con su nombre y su estado. */
export function recientesDe(estado) {
  const e = normalizarEstiloHombre(estado);
  return datosBuscador(e).recientes
    .map((id) => {
      const cat = moduloEH(id);
      if (!cat) return null;
      const est = estadoDe(e, id);
      return { ...cat, estado: est, insignia: est === 'activo' ? null : estadoGestion(est) };
    })
    .filter(Boolean);
}

/* ===========================================================================
   5 · LA NAVEGACIÓN (apartados 7, 8, 9 y 10)
   ===========================================================================
   *"← Estilo de hombre… Estilo → Perfumes → Mi colección… detalle → colección →
   módulo → Estilo. **No sacar al usuario accidentalmente de JosStyle.**"*

   ⚠️ **Las migas son una FUNCIÓN, no un estado guardado.** Se calculan de dónde
   está; guardarlas sería un segundo sistema de navegación que se desincroniza a
   la primera. Y el "volver" es la lista al revés, sin el último. */

export const RAIZ = 'Estilo';

export function migas(moduloId = null, zona = null) {
  const camino = [{ id: 'raiz', nombre: RAIZ, modulo: null, zona: null }];
  const cat = moduloId ? moduloEH(moduloId) : null;
  if (cat) camino.push({ id: cat.id, nombre: cat.nombre, modulo: cat.id, zona: null });
  if (cat && zona) camino.push({ id: `${cat.id}:${zona}`, nombre: zona, modulo: cat.id, zona });
  return camino;
}

/**
 * Apartado 9 — *"detalle → colección → módulo → Estilo"*. ⚠️ Devuelve **el paso
 * anterior**, o la raíz; **nunca `null`**, que es como se sale de la aplicación
 * sin querer.
 */
export function atras(moduloId = null, zona = null) {
  const camino = migas(moduloId, zona);
  return camino.length > 1 ? camino[camino.length - 2] : camino[0];
}

/**
 * Apartado 10 — *"al volver: regresar exactamente al punto anterior"*. ⚠️ Es un
 * dato de la sesión, no algo guardado: adónde va y de dónde viene.
 */
export const enlaceAOtroModulo = (destino, desdeModulo = null, desdeZona = null) => ({
  destino,
  volverA: { modulo: desdeModulo, zona: desdeZona },
  etiqueta: `Abrir ${destino === 'armario' ? 'Armario' : (destino === 'diario' ? 'Diario' : (destino === 'calendario' ? 'Calendario' : destino))}`,
});

/* ===========================================================================
   6 · RESUMEN, AUDITORÍA, TEXTOS Y PANEL
   =========================================================================== */

export function resumenBuscador(estado, consulta, opciones = {}) {
  const r = buscarEnEstilo(estado, consulta, opciones);
  return {
    total: r.total,
    grupos: r.grupos.length,
    vacio: r.vacio,
    recientes: datosBuscador(estado).recientes.length,
    fuentes: FUENTES_BUSQUEDA.length,
  };
}

export function auditarBuscador() {
  return {
    // Apartado 11 — buscadores globales nuevos. Cero: el de BI F3 sigue siendo el único.
    buscadoresGlobales: 0,
    // Apartado 11 — y ni una copia de la búsqueda de módulos de la F2.
    busquedasDeModulos: 0,
    // Apartado 6 — listas de favoritos propias. Cero: los de cada módulo.
    favoritosNuevos: 0,
    // Apartado 15 — sitios donde se mira la papelera. Ninguno.
    papeleraConsultada: 0,
    // Apartados 13 y 14 — activaciones automáticas. Ninguna.
    activacionesAutomaticas: 0,
    // Apartado 5 — lo que se guarda son ids, nunca lo que escribió.
    consultasGuardadas: 0,
    // Un índice guardado se quedaría viejo en cuanto él borrase algo.
    indicesGuardados: 0,
    fuentes: FUENTES_BUSQUEDA.length,
    datosGuardados: Object.keys(DEFAULT_BUSCADOR),
  };
}

export function textosDeBuscador() {
  return [...Object.values(TEXTOS_BUSCADOR), ...FUENTES_BUSQUEDA.map((f) => f.grupo)];
}

export function panelBuscador(estado, consulta = '', opciones = {}) {
  const r = buscarEnEstilo(estado, consulta, opciones);
  const recientes = recientesDe(estado);
  return {
    titulo: TEXTOS_BUSCADOR.titulo,
    ...r,
    // Apartado 5 — y sin nada abierto todavía, se dice.
    recientes,
    tituloRecientes: TEXTOS_BUSCADOR.recientes,
    sinRecientes: recientes.length === 0 ? TEXTOS_BUSCADOR.sinRecientes : '',
    // Apartado 6 — y dónde están los favoritos de verdad.
    favoritos: TEXTOS_BUSCADOR.favoritos,
    dondeEstanFavoritos: TEXTOS_BUSCADOR.dondeEstanFavoritos,
    // Apartado 4 — la salida cuando no hay nada.
    explorar: TEXTOS_BUSCADOR.explorar,
    // Apartado 15.
    eliminadosNoSalen: TEXTOS_BUSCADOR.eliminadosNoSalen,
    // Apartados 7 y 8.
    volver: TEXTOS_BUSCADOR.volver,
    migas: migas(opciones.desde || null, opciones.zona || null),
    resumen: resumenBuscador(estado, consulta, opciones),
  };
}
