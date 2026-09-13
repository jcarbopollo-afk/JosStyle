/* ===========================================================================
   NAVEGACIÓN POR ORIGEN — la pila real de por dónde ha pasado
   ===========================================================================

   Josué: *"Si entro desde Inicio a una funcionalidad, por ejemplo Tareas o
   Productividad, y después pulso atrás, la aplicación puede devolverme a otra
   sección como Gestión. Esto no es el comportamiento deseado."*

   🚨 **Y TENÍA RAZÓN HASTA EN EL DIAGNÓSTICO.** La línea que lo causaba era
   ésta, en `App.jsx`:

       const destinoVuelta = vueltaValida ? vueltaValida.desde : areaActual.id;

   O sea: **atrás no sabía de dónde venías, preguntaba a qué área pertenece el
   módulo**. Productividad pertenece a Vida, así que abrirla desde Inicio y
   pulsar atrás te dejaba en Vida — un sitio por el que no habías pasado. No era
   un fallo de Productividad ni de Tareas: era de *todos* los módulos a la vez,
   porque la regla estaba escrita una sola vez y era la equivocada.

   ⚠️ **Y ÉL PIDIÓ EXPRESAMENTE QUE NO SE ARREGLARA CASO POR CASO**: *"No quiero
   solucionar esto añadiendo condiciones independientes… dentro de cada módulo.
   Quiero una solución arquitectónica reutilizable."* Por eso esto es una
   librería con funciones puras y **`App.jsx` no tiene ni un `if` por módulo**:
   cualquier pantalla que se añada mañana hereda el comportamiento sin escribir
   una línea, que es el criterio 6 de su lista de aceptación.

   🚨 **NO ES UN SEGUNDO SISTEMA DE NAVEGACIÓN** (apartado 6, literal: *"Evita
   crear un segundo sistema paralelo de navegación si el router actual puede
   resolverlo correctamente"*). JosStyle **no tiene router**: navega con un
   estado de React (`tab`) desde que existe. Lo que hace esta librería es
   cambiar ese estado de **un id suelto** a **la lista de ids por los que se ha
   pasado**, y `tab` pasa a ser *el último de la lista*. Ni una ruta nueva, ni
   una dependencia, ni una segunda forma de llegar a ningún sitio.

   ⚠️ **Y EL PRECEDENTE YA ESTABA ESCRITO**: `vueltaBusqueda` (BI F4) recordaba
   **un** origen, y solo para el buscador —*"al volver, regresar al punto lógico
   anterior"*—. Funcionaba, y era media solución: un solo nivel y un solo
   camino. Esto es esa misma idea llevada a todos los caminos y a todos los
   niveles, así que `vueltaBusqueda` **desaparece absorbido**, no conviviendo
   al lado (dos memorias del origen acabarían diciendo cosas distintas).

   ---------------------------------------------------------------------------
   LAS DOS NAVEGACIONES, QUE NO SON LA MISMA
   ---------------------------------------------------------------------------

   Apartado 4 de su encargo, y es la distinción que hace que esto funcione:

   - **Navegación principal** — las cinco pestañas de abajo (Inicio · Bienestar ·
     Vida · Gestión · Ajustes). Tocar una **no es entrar en algo**: es cambiar de
     sitio. Así que **reinicia la pila**, no apila. Si apilara, atrás desharía el
     recorrido de pestañas y acabarías dando vueltas — que es justo lo que él
     pide evitar en el apartado 8 (*"que Atrás vuelva continuamente a la misma
     pantalla"*).
   - **Navegación interna** — abrir un módulo desde Inicio o desde un hub. Eso sí
     apila, y atrás desapila.

   ⚠️ **Un módulo abierto dos veces no se apila dos veces** (apartado 8, *"evita
   duplicar entradas innecesariamente"* y *"crear bucles"*). Si el destino ya
   está en la pila, se **vuelve** a él recortando lo que hay por encima, en vez
   de añadir una copia: así Inicio → Productividad → Inicio → Productividad deja
   una pila de dos, no de cuatro.

   =========================================================================== */

/** El fondo de la pila. Nunca se queda vacía: de la raíz se vuelve a la raíz. */
export const RAIZ = 'hoy';

/**
 * Una entrada de la pila: `{ id, foco }`.
 *
 * `foco` es el deep-link que ya existía desde EH F28 (`navegarDesdeHoy(modulo,
 * foco)`) y **no se toca**: viaja con la entrada para que volver a una pantalla
 * la devuelva como estaba, que es el apartado 9 (*"al volver atrás debería
 * conservarse el estado razonable de la pantalla anterior"*).
 */
function entrada(id, foco) {
  return foco ? { id: String(id), foco } : { id: String(id) };
}

/** Normaliza cualquier cosa guardada o pasada a una pila con al menos la raíz. */
export function normalizarPila(pila) {
  const lista = Array.isArray(pila) ? pila : [];
  const limpia = lista
    .map((e) => (e && typeof e === 'object' ? e : { id: e }))
    .filter((e) => e && e.id)
    .map((e) => entrada(e.id, e.foco));
  return limpia.length ? limpia : [entrada(RAIZ)];
}

/** Dónde estás ahora: el último de la pila. */
export function actual(pila) {
  const p = normalizarPila(pila);
  return p[p.length - 1];
}

/** El id de donde estás — lo que hasta ahora era `tab`. */
export function tabDe(pila) {
  return actual(pila).id;
}

/**
 * De dónde vienes, o `null` si estás en la raíz de este recorrido.
 *
 * Es lo que rotula el botón de atrás: **el sitio real del que saliste**, nunca
 * el área a la que pertenece lo que estás viendo.
 */
export function origen(pila) {
  const p = normalizarPila(pila);
  return p.length > 1 ? p[p.length - 2] : null;
}

/**
 * Abrir algo desde donde estás. Apila.
 *
 * - Si ya estás ahí, no hace nada (no se apila una copia de lo mismo).
 * - Si ese destino ya está más abajo en la pila, **se vuelve a él** en vez de
 *   añadir otra entrada: así no se crean bucles ni entradas duplicadas
 *   (apartado 8). ⚠️ Y se conserva el `foco` nuevo si lo trae, porque abrir algo
 *   con un deep-link distinto es abrir otra cosa dentro de la misma pantalla.
 */
export function abrir(pila, destino, foco) {
  const p = normalizarPila(pila);
  const id = String(destino || '');
  if (!id) return p;
  const arriba = p[p.length - 1];
  if (arriba.id === id) {
    // Mismo sitio: solo se refresca el foco si viene uno nuevo.
    return foco ? [...p.slice(0, -1), entrada(id, foco)] : p;
  }
  const yaEsta = p.findIndex((e) => e.id === id);
  if (yaEsta !== -1) return [...p.slice(0, yaEsta), entrada(id, foco)];
  return [...p, entrada(id, foco)];
}

/**
 * Ir a una pestaña de la barra inferior. **Reinicia** la pila.
 *
 * ⚠️ Esto es lo que separa las dos navegaciones del apartado 4. La barra de
 * abajo no "entra" en ningún sitio: cambia de sección, así que el recorrido
 * anterior deja de tener sentido. Con Inicio, además, la pila queda en su
 * estado de arranque.
 */
export function irAPrincipal(pila, destino, foco) {
  const id = String(destino || RAIZ);
  return id === RAIZ ? [entrada(RAIZ, foco)] : [entrada(RAIZ), entrada(id, foco)];
}

/**
 * Atrás. Desapila.
 *
 * ⚠️ **Nunca devuelve una pila vacía** — es la lección de `atras()` en EH F37:
 * *"de la raíz se vuelve a la raíz, y así es como no se sale de JosStyle sin
 * querer"*. En el iPhone eso importa: una pila vacía dejaría la pantalla en
 * blanco sin forma de volver.
 */
export function atras(pila) {
  const p = normalizarPila(pila);
  return p.length > 1 ? p.slice(0, -1) : p;
}

/** ¿Hay a dónde volver? Lo usa la barra de atrás para no pintarse en la raíz. */
export function puedeVolver(pila) {
  return normalizarPila(pila).length > 1;
}

/**
 * El rótulo del botón de atrás: **el nombre de donde vienes**.
 *
 * Recibe la función que sabe traducir un id a nombre, porque los nombres viven
 * en `AREAS_NAV` y `MORE_NAV` (App.jsx) y esta librería no puede importarlos sin
 * crear una dependencia circular — ni debe: lo suyo es el recorrido, no el
 * catálogo.
 */
export function etiquetaDeOrigen(pila, nombreDe) {
  const desde = origen(pila);
  if (!desde) return null;
  const nombre = typeof nombreDe === 'function' ? nombreDe(desde.id) : null;
  return nombre || 'Atrás';
}

/**
 * La ruta legible, para poder comprobarla en una prueba y para depurar.
 * `['hoy', 'productividad']` → `"hoy → productividad"`.
 */
export function ruta(pila) {
  return normalizarPila(pila).map((e) => e.id).join(' → ');
}

/* ---------------------------------------------------------------------------
   Lo que esta librería NO hace, declarado.

   Un informe que solo enumera lo verde miente por omisión (E3 F46).
   --------------------------------------------------------------------------- */
export const NO_HACE = [
  {
    que: 'No guarda nada en `app_data`',
    porque: 'Por dónde has pasado es de la sesión, no un dato tuyo. Guardarlo haría que abrir la app te devolviera a media ruta de anteayer, y además es exactamente lo que la EH F40 se negó a inventar: "qué pantalla está abierta ahora es de la pantalla".',
  },
  {
    que: 'No toca la barra inferior',
    porque: 'Él lo pidió tres veces ("No quiero cambiar la navegación inferior ni su diseño"). Lo único que cambia es que tocarla reinicia el recorrido, que es lo que ya hacía de hecho.',
  },
  {
    que: 'No resuelve el botón atrás del MÓVIL',
    porque: 'Ése es el gesto del sistema y necesita `history.pushState` en toda la app: está declarado como deuda desde la E3 F22 y lo decide Josué. Esto es el botón de atrás DE LA APLICACIÓN, que es lo que él describe en su encargo.',
    decide: 'Josué',
  },
];
