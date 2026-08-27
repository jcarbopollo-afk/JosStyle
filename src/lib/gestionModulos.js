// ============================================================================
// EH · Fase 2/65 — SISTEMA DE GESTIÓN Y PERSONALIZACIÓN DE MÓDULOS
//
// *"El usuario decide qué quiere ver y qué no. No debemos mostrar 30
// funcionalidades a alguien que solo quiere utilizar 5."*
//
// La Fase 1 dejó el catálogo y el interruptor. Esta fase construye **la
// pantalla de gestión de verdad**: categorías, buscador, orden, confirmación al
// apagar, recomendados y los casos límite del apartado 17.
//
// ── POR QUÉ ESTE ARCHIVO NO REDEFINE NADA ──────────────────────────────────
//
// El apartado 15 es tajante: *"La gestión de módulos debe ser una única fuente
// de verdad. No crear `skincareSettings` en un lugar distinto simplemente para
// saber si Skincare está activo."*
//
// Así que aquí **no hay catálogo, ni lista de categorías, ni un segundo sitio
// donde viva `activo`**. Todo eso está en `estiloDeHombre.js`, y este archivo
// solo lee de allí y devuelve estructuras para pintar. Encender y apagar sigue
// siendo `alternarModulo`; el orden sigue siendo `reordenar`. Este archivo
// **decide qué hay que llamar**, igual que `avisosHorario.js` decide y
// `notificaciones.js` manda.
//
// ── LO QUE SE ARREGLÓ DE LA FASE 1 AL LEER EL APARTADO 17 ──────────────────
//
// *"Módulo eliminado del catálogo en una futura actualización → los datos no
// deben borrarse automáticamente."* El normalizador de la Fase 1 descartaba el
// módulo entero, y con la regla 5 (`saveData` sobrescribe) eso **borraba su
// `config` en el siguiente guardado**. Corregido en `estiloDeHombre.js` con la
// cuarentena `retirados`. Es la cuarta vez que este proyecto tropieza con el
// mismo fallo de normalizador, y la primera en que la especificación avisaba.
// ============================================================================

import {
  MODULOS_EH, CATEGORIAS_EH, categoriaEH, moduloEH, IDS_EH,
  normalizarEstiloHombre, todosLosModulos, modulosActivos, reordenar,
} from './estiloDeHombre';

/* ===========================================================================
   1 · AGRUPACIÓN POR CATEGORÍAS (apartado 3)
   ===========================================================================
   *"Como habrá muchos módulos, no queremos una lista interminable."*

   ⚠️ **Una categoría vacía NO se devuelve.** El propio apartado dice que las
   categorías *"no deben convertirse en sistemas duplicados"*: son una etiqueta,
   no una entidad. Un encabezado "❤️ Salud" con nada debajo es un hueco que hay
   que explicar, y la regla 8 prohíbe justamente eso. */

export function modulosAgrupados(estado, { soloActivos = false } = {}) {
  const todos = todosLosModulos(estado);
  return CATEGORIAS_EH
    .map((cat) => ({
      ...cat,
      modulos: todos
        .filter((m) => m.categoria === cat.id && (!soloActivos || m.activo))
        .sort((a, b) => a.orden - b.orden),
    }))
    .filter((c) => c.modulos.length > 0)
    .map((c) => ({
      ...c,
      activos: c.modulos.filter((m) => m.activo).length,
      total: c.modulos.length,
    }));
}

/** Un módulo del catálogo que se quedara sin categoría no desaparecería sin
 *  avisar: esto lo dice, y hay una prueba de que hoy la lista está vacía. */
export function modulosSinCategoria() {
  const ids = new Set(CATEGORIAS_EH.map((c) => c.id));
  return MODULOS_EH.filter((m) => !ids.has(m.categoria)).map((m) => m.id);
}

/* ===========================================================================
   2 · BUSCADOR DE MÓDULOS (apartado 12)
   ===========================================================================
   *"Buscar: pelo → 💇 Pelo, 🧔 Barba."*

   El ejemplo del enunciado es el que obliga a que haya `terminos`: buscando
   "pelo" tiene que salir **también Barba**, y su nombre no contiene la palabra.
   Sin sinónimos esto sería un `includes` sobre el nombre y el ejemplo fallaría. */

const sinTildes = (s) => (s || '').toString().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export function buscarModulos(estado, texto) {
  const q = sinTildes(texto);
  const todos = todosLosModulos(estado);
  if (!q) return todos;

  return todos
    .map((m) => {
      const nombre = sinTildes(m.nombre);
      const sub = sinTildes(m.sub);
      const cat = sinTildes(categoriaEH(m.categoria)?.nombre);
      const terminos = (m.terminos || []).map(sinTildes);

      // La puntuación existe para que "pelo" ponga Pelo por delante de Barba,
      // no para inventar relevancia: son cuatro casos y están escritos.
      let punto = 0;
      if (nombre === q) punto = 100;
      else if (nombre.startsWith(q)) punto = 80;
      else if (nombre.includes(q)) punto = 60;
      else if (terminos.some((t) => t === q)) punto = 50;
      else if (terminos.some((t) => t.startsWith(q))) punto = 40;
      else if (sub.includes(q)) punto = 30;
      else if (cat.includes(q)) punto = 20;
      else if (terminos.some((t) => t.includes(q))) punto = 10;

      return { ...m, punto };
    })
    .filter((m) => m.punto > 0)
    .sort((a, b) => b.punto - a.punto || a.orden - b.orden);
}

/** Lo mismo, pero agrupado, para que el buscador y el listado se pinten igual. */
export function resultadosAgrupados(estado, texto) {
  const encontrados = buscarModulos(estado, texto);
  return CATEGORIAS_EH
    .map((cat) => ({
      ...cat,
      modulos: encontrados.filter((m) => m.categoria === cat.id),
    }))
    .filter((c) => c.modulos.length > 0)
    .map((c) => ({ ...c, activos: c.modulos.filter((m) => m.activo).length, total: c.modulos.length }));
}

/* ===========================================================================
   3 · CONFIRMACIÓN AL DESACTIVAR (apartado 6)
   ===========================================================================
   *"Para módulos que puedan contener información importante… Para módulos
   sencillos puede utilizarse una desactivación directa. La aplicación debe
   poder definir qué módulos necesitan confirmación."*

   El "puede definirlo" está en el catálogo: `confirmar: true`.

   ⚠️ **Pero el aviso solo sale si hay algo que perder.** Un cartel que dice
   *"tus datos no se eliminarán"* cuando el módulo está vacío no protege nada:
   enseña a pulsar "Desactivar" sin leer, y entonces no sirve el día que sí
   importa. Así que se declara el módulo como importante **y** se comprueba si
   tiene datos guardados.

   `tieneDatos` es un parámetro para que una fase futura que guarde sus datos
   fuera de `config` pueda decir cómo se mira, en vez de que esto adivine. */

export const necesitaConfirmacion = (id) => !!moduloEH(id)?.confirmar;

export function moduloTieneDatos(estado, id, tieneDatos = null) {
  if (typeof tieneDatos === 'function') return !!tieneDatos(id);
  const e = normalizarEstiloHombre(estado);
  const m = e.modulos.find((x) => x.id === id);
  return !!m && Object.keys(m.config || {}).length > 0;
}

/**
 * Devuelve el aviso que hay que enseñar, o `null` si se puede apagar directo.
 * La pantalla no decide: pregunta.
 */
export function avisoDesactivar(estado, id, { tieneDatos = null } = {}) {
  if (!IDS_EH.includes(id)) return null;
  if (!necesitaConfirmacion(id)) return null;
  if (!moduloTieneDatos(estado, id, tieneDatos)) return null;

  const m = moduloEH(id);
  return {
    titulo: 'Desactivar apartado',
    texto: `${m.nombre} dejará de aparecer en tu Estilo de hombre, pero tus datos no se eliminarán.`,
    confirmar: 'Desactivar',
    cancelar: 'Cancelar',
  };
}

/* ===========================================================================
   4 · ORDEN (apartado 9)
   ===========================================================================
   *"Si implementar drag & drop en esta fase complica innecesariamente la
   arquitectura, puede utilizarse inicialmente ↑ Subir ↓ Bajar. Pero la
   estructura de datos debe quedar preparada para drag & drop posteriormente."*

   La estructura ya lo está desde la Fase 1: cada módulo guarda su `orden`, y
   `reordenar(estado, [ids])` acepta la lista entera de una vez — que es
   exactamente lo que suelta un drag & drop. Subir y bajar son **la misma
   función con la lista intercambiada de dos en dos**, no un segundo sistema.

   ⚠️ **Se mueve dentro de los ACTIVOS.** Si "subir" saltara por encima de un
   módulo apagado, Josué vería una plaquita que no se mueve al pulsar la flecha,
   porque el que ha adelantado no se pinta. */

function ordenVisible(estado) {
  return modulosActivos(estado).map((m) => m.id);
}

function mover(estado, id, delta) {
  const e = normalizarEstiloHombre(estado);
  const visible = ordenVisible(e);
  const i = visible.indexOf(id);
  const j = i + delta;
  if (i === -1 || j < 0 || j >= visible.length) return e;   // ya está en el borde
  const nuevo = [...visible];
  [nuevo[i], nuevo[j]] = [nuevo[j], nuevo[i]];
  return reordenar(e, nuevo);
}

export const subirModulo = (estado, id) => mover(estado, id, -1);
export const bajarModulo = (estado, id) => mover(estado, id, +1);

/** El que usará el drag & drop: "este módulo pasa a la posición N". */
export function moverA(estado, id, indice) {
  const e = normalizarEstiloHombre(estado);
  const visible = ordenVisible(e);
  const i = visible.indexOf(id);
  if (i === -1) return e;
  const destino = Math.max(0, Math.min(visible.length - 1, Math.floor(Number(indice))));
  if (!Number.isFinite(destino) || destino === i) return e;
  const nuevo = [...visible];
  nuevo.splice(i, 1);
  nuevo.splice(destino, 0, id);
  return reordenar(e, nuevo);
}

/** Para pintar las flechas apagadas en los extremos en vez de que no hagan nada. */
export function puedeMover(estado, id) {
  const visible = ordenVisible(estado);
  const i = visible.indexOf(id);
  return { arriba: i > 0, abajo: i !== -1 && i < visible.length - 1, posicion: i, de: visible.length };
}

/* ===========================================================================
   5 · MÓDULOS RECOMENDADOS (apartado 11)
   ===========================================================================
   *"Podemos mostrar opcionalmente una pequeña sección ✨ También puedes añadir…
   Pero esto debe ser informativo, nunca obligatorio. **No utilizar IA.** Las
   recomendaciones pueden estar definidas mediante reglas internas."*

   Dos reglas, escritas, y ninguna más:
   1. Solo se recomienda lo que está **apagado** (recomendar lo que ya usa es
      ruido).
   2. Entre los apagados, primero los marcados `recomendado` en el catálogo y
      después los que **antes tendrán contenido** (`fase` más baja), porque
      recomendar hoy algo que llega en la fase 55 es prometer.

   Y **no sale nada** si no ha configurado todavía o si lo tiene todo encendido:
   una sección vacía con un título es peor que ninguna sección. */

export const MAX_RECOMENDADOS = 3;

export function recomendados(estado, { max = MAX_RECOMENDADOS } = {}) {
  const e = normalizarEstiloHombre(estado);
  if (!e.configurado) return [];
  return todosLosModulos(e)
    .filter((m) => !m.activo)
    .sort((a, b) => (b.recomendado ? 1 : 0) - (a.recomendado ? 1 : 0) || a.fase - b.fase)
    .slice(0, Math.max(0, max));
}

/* ===========================================================================
   6 · FICHA DEL MÓDULO (apartado 13)
   ===========================================================================
   *"Al pulsar sobre un módulo desde la gestión, puede aparecer una pequeña
   descripción… No entrar todavía en el módulo funcional."*

   ⚠️ Por eso la ficha lleva `contenido: false` y **dice en qué fase llega**: es
   la regla 8 otra vez. Enseñar una ficha que sugiere que hay algo detrás cuando
   no lo hay es exactamente el control decorativo que el proyecto prohíbe. */

export function fichaModulo(estado, id) {
  const cat = moduloEH(id);
  if (!cat) return null;
  const e = normalizarEstiloHombre(estado);
  const guardado = e.modulos.find((m) => m.id === id) || { activo: false, orden: 0, config: {} };
  const categoria = categoriaEH(cat.categoria);
  return {
    ...cat,
    activo: !!guardado.activo,
    estadoTexto: guardado.activo ? 'Activado' : 'Desactivado',
    categoria: categoria ? categoria.nombre : '',
    categoriaIcono: categoria ? categoria.icono : '',
    // Hoy ninguno tiene contenido: se construye en su fase, y aquí se dice cuál.
    contenido: false,
    avisoContenido: `El contenido de este apartado llega en la fase ${cat.fase}.`,
    confirmarAlApagar: necesitaConfirmacion(id),
    tieneDatos: moduloTieneDatos(e, id),
  };
}

/* ===========================================================================
   7 · ESTADO VACÍO (apartado 10)
   ===========================================================================
   *"Si el usuario desactiva todos los módulos: 🧔 Tu espacio está vacío… No
   debe aparecer una pantalla rota ni una cuadrícula vacía."*

   El estado ya lo calcula `estadoPantalla()` en la Fase 1. Aquí solo vive el
   texto, junto al resto de textos de gestión, para que no haya dos sitios donde
   se escriba lo mismo. */

export const TEXTOS_GESTION = {
  cabecera: 'Personaliza tu espacio',
  ayuda: 'Activa solamente los apartados que quieras utilizar. Puedes modificarlos cuando quieras.',
  vacioTitulo: 'Tu espacio está vacío',
  vacioTexto: 'No tienes ningún apartado activo.',
  vacioAccion: 'Gestionar apartados',
  buscar: 'Buscar apartado',
  sinResultados: 'Ningún apartado con ese nombre.',
  recomendadosTitulo: 'También puedes añadir',
};

/* ===========================================================================
   8 · RESUMEN DE LA GESTIÓN
   =========================================================================== */

export function resumenGestion(estado) {
  const e = normalizarEstiloHombre(estado);
  const todos = todosLosModulos(e);
  const activos = todos.filter((m) => m.activo);
  return {
    activos: activos.length,
    total: todos.length,
    categorias: modulosAgrupados(e).length,
    categoriasTotales: CATEGORIAS_EH.length,
    // Cuántos apartados apagados quedan por si quiere más. Sin empujar.
    disponibles: todos.length - activos.length,
    recomendados: recomendados(e).length,
    // ⚠️ Módulos guardados de una versión anterior del catálogo. Hoy: ninguno.
    retirados: (e.retirados || []).length,
    puedeReordenar: activos.length > 1,
  };
}

/* ===========================================================================
   9 · LO QUE ESTA FASE NO HACE
   ===========================================================================
   *"Todavía NO desarrollar el contenido interno de los módulos."*

   Y una decisión que sí conviene dejar escrita, porque se va a repetir en las
   63 fases que quedan:

   ⚠️ **El apartado 3 enumera, dentro de las categorías, módulos que no están en
   el catálogo**: Nutrición, Recuperación, Salud preventiva, Salud dental, Salud
   visual y Objetivos. No se han añadido, y no es un olvido:

   - **Nutrición, Sueño y Objetivos ya son módulos enteros de JosStyle.** Crear
     copias dentro de Estilo de Hombre es literalmente lo que prohíben el
     apartado 10 de la Fase 1 y el 15 de esta.
   - **Las tres de salud** (preventiva, dental, visual) son subdivisiones del
     módulo `salud`, cuyo contenido se construye en la fase 33. Partirlo en tres
     hoy sería decidir por adelantado la forma de una fase que no toca.

   Las categorías están las siete, con sus nombres e iconos: si una fase futura
   añade uno de esos módulos, entra en su categoría **con una línea**, que es
   justo lo que la Fase 1 dejó preparado. */

export const MODULOS_DEL_ENUNCIADO_NO_CREADOS = [
  { nombre: 'Nutrición', categoria: 'fisico', motivo: 'Ya es un módulo de JosStyle. Se leerá, no se copiará.' },
  { nombre: 'Recuperación', categoria: 'fisico', motivo: 'Parte del contenido de Fitness (fase 26).' },
  { nombre: 'Salud preventiva', categoria: 'salud', motivo: 'Parte de Salud (fase 33).' },
  { nombre: 'Salud dental', categoria: 'salud', motivo: 'Parte de Higiene (fase 18) y Salud (fase 33).' },
  { nombre: 'Salud visual', categoria: 'salud', motivo: 'Parte de Salud (fase 33).' },
  { nombre: 'Objetivos', categoria: 'bienestar', motivo: 'Ya es un módulo de JosStyle. Se leerá, no se copiará.' },
];
