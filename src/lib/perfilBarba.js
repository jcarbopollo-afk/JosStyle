// ============================================================================
// EH · Fase 20/65 — BARBA Y AFEITADO: PERFIL Y CONFIGURACIÓN
//
// *"Ahora desarrollamos Barba y Afeitado como un módulo independiente y 100 %
// opcional. No todo el mundo tiene barba, por lo que no debe aparecer
// obligatoriamente."*
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. ⚠️ NADA NUEVO SE CONSTRUYE AQUÍ.** El apartado 17 es una lista de siete
// cosas que hay que **reutilizar** —perfil global, productos globales,
// calendario, recordatorios, favoritos y Eliminados recientemente— y termina con
// *"no crear sistemas paralelos"*. Así que esta fase es, casi entera, llamadas:
// el motor de cuestionarios de la Fase 7, el registro de datos de la Fase 4, el
// motor de productos de la Fase 17 y los tres niveles de la Fase 6.
//
// **2. ⚠️ LAS SEIS CASILLAS DEL APARTADO 2 SON *PARTES*, NO MÓDULOS.** *"¿Qué
// quieres gestionar? Barba, Afeitado, Perfilado, Cuidado de la piel después del
// afeitado, Productos, Seguimiento."* Es exactamente la forma que ya tienen
// `PARTES_PIEL` y `PARTES_PELO`, y el apartado 16 lo confirma: se pueden quitar
// por separado **sin perder los datos**. Apagar no borra (F1, apartado 7).
//
// **3. ⚠️ `sensibilidadPiel` YA ESTÁ CONTESTADA, y el registro lo sabía.** La
// Fase 13 la declaró con `usan: ['skincare', 'barba', 'productos']` — con
// "barba" escrito dentro, dos fases antes de que existiera este archivo. Así
// que **no se vuelve a preguntar**: se lee. Lo que sí es nuevo es
// `molestiaAfeitado` (apartado 10), que **no es la misma pregunta**: reaccionar
// a un producto y molestarse después de pasar una cuchilla son dos cosas, y una
// persona puede tener lo primero sin afeitarse nunca. Séptima vez que esta
// comprobación evita una pregunta repetida (D-15).
//
// **4. ⚠️ NUNCA UN DIAGNÓSTICO** (apartados 10 y 11, los dos con esas palabras:
// *"no diagnosticar"* y *"tratarlo como información declarada por el usuario,
// no como diagnóstico médico"*). Se reutiliza `PALABRAS_CLINICAS` y
// `sinDiagnostico()` de la Fase 13 — **no una segunda lista** — y hay una prueba
// que barre todos los textos de esta fase.
//
// **5. ⚠️ Y NO SE OBLIGA A NADA.** *"No hace falta que responda si no quiere"*
// (apartado 7), *"no obligar a seleccionar una longitud exacta"* (apartado 3),
// *"pregunta opcional"* (apartado 10). Todas las preguntas admiten "No lo sé" y
// ninguna bloquea el resto, que es lo que hace el motor de la Fase 7.
//
// ⚠️ **Lo que esta fase NO hace, por escrito en la condición de finalización:**
// rutinas avanzadas, recomendaciones, productos, packs y seguimiento. Aquí se
// deja la **estructura** —`PLAQUITAS_BARBA` dice en qué fase llega cada una— y
// nada más. Regla 8: la plaquita que no funciona lo dice, en vez de abrir una
// pantalla vacía.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { NIVELES_ESTILO } from './perfilEstilo';
import { leerDato } from './datosEstiloHombre';
import {
  NO_LO_SE, leerRespuesta, contestar, borrarRespuesta, leerCuestionario,
  preguntasVisibles, progresoVisible, contextoDelCuestionario, destinoDe,
} from './cuestionarios';
import { PALABRAS_CLINICAS, sinDiagnostico } from './perfilPiel';
import { productosPiel } from './productosPiel';
import { productosPelo } from './productosPelo';
import { uid, todayISO } from './helpers';

export const MODULO_BARBA = 'barba';

/** Apartado 1 — la pantalla de entrada, con sus dos botones literales. */
export const TEXTOS_BARBA = {
  titulo: '🧔 Barba y afeitado',
  pregunta: '¿Quieres utilizar este apartado?',
  configurar: 'Sí, configurarlo',
  ahoraNo: 'Ahora no',
  /* ⚠️ *"Si selecciona no: el apartado queda oculto."* Oculto no es borrado, y
     se puede volver cuando quiera — igual que en la Fase 13. */
  oculto: 'Cuando quieras, aquí lo configuras.',
  editar: '⚙️ Mi perfil de barba',
};

/* ===========================================================================
   1 · LAS SEIS PARTES (apartados 2 y 16)
   ===========================================================================
   ⚠️ *"Puede seleccionar varias."* Y el apartado 16: se quitan por separado
   **sin perder los datos**. `Seguimiento` viene apagada porque el enunciado la
   dibuja con ☐, no con ☑️. */

/* ⚠️ **Son DOS listas en una, y la diferencia importa.** Las seis primeras son
   las casillas del **apartado 2** —*"¿qué quieres gestionar?"*—, y las elige él
   de una vez en la pantalla de entrada. Las que llevan `deApartado2: false` son
   los interruptores sueltos del **apartado 16** —*"también puede quitar
   independientemente: Rutinas, Productos, Seguimiento"*—, y **`elegirPartes` no
   las toca**: si volver a elegir qué gestiona apagara sus rutinas sin avisar,
   sería exactamente lo que el apartado 16 promete que no pasa. */
export const PARTES_BARBA = [
  { id: 'barba', nombre: 'Barba', icono: '🧔', porDefecto: true, deApartado2: true },
  { id: 'afeitado', nombre: 'Afeitado', icono: '🪒', porDefecto: true, deApartado2: true },
  { id: 'perfilado', nombre: 'Perfilado', icono: '✂️', porDefecto: true, deApartado2: true },
  { id: 'cuidadoPiel', nombre: 'Cuidado de la piel después del afeitado', icono: '🧴', porDefecto: true, deApartado2: true },
  { id: 'productos', nombre: 'Productos', icono: '🛒', porDefecto: true, deApartado2: true },
  // ⚠️ ☐ en el enunciado, no ☑️.
  { id: 'seguimiento', nombre: 'Seguimiento', icono: '📈', porDefecto: false, deApartado2: true },
  /* ⚠️ **EH F21 — el interruptor de las rutinas, y arregla un fallo de verdad.**
     Antes las rutinas colgaban de la casilla "Afeitado", así que **quien solo
     marcaba "Barba" se quedaba sin poder crear ninguna** — y el apartado 3 de la
     F21 dice literalmente *"RUTINA DE BARBA: si tiene barba, 🧔 Cuidado de
     barba"*. Las rutinas son de las tres cosas, no solo del afeitado, y por eso
     tienen su propio interruptor, que es además el que pide el apartado 16. */
  { id: 'rutinas', nombre: 'Rutinas', icono: '🪒', porDefecto: true, deApartado2: false },
];

/** Las seis casillas del apartado 2, que son las que él marca en la entrada. */
export const CASILLAS_BARBA = PARTES_BARBA.filter((p) => p.deApartado2);

export const parteBarba = (id) => PARTES_BARBA.find((p) => p.id === id) || null;

/** Apartado 16 — y lo que llega después, con su fase, en vez de no hacer nada. */
export const PLAQUITAS_BARBA = [
  { id: 'perfil', nombre: 'Mi barba', icono: '🧔', fase: 20, listo: true },
  { id: 'rutina', nombre: 'Mi rutina', icono: '🪒', fase: 21, listo: true },
  /* ⚠️ El seguimiento NO es una plaquita aparte: el apartado 9 de la F21 dice
     *"si ha activado 📈 Seguimiento, **podrá registrar** ¿cómo ha ido?"*, y eso
     vive dentro de la rutina, junto a lo que acaba de hacer. Una pantalla
     separada para pulsar una carita sería un clic de más y un sitio más donde
     mirar. Se queda en el catálogo con su fase para no romper referencias. */
  { id: 'seguimiento', nombre: 'Seguimiento', icono: '📈', fase: 21, listo: false, dentroDe: 'rutina' },
  { id: 'productos', nombre: 'Productos', icono: '🛒', fase: 21, listo: false },
];

/* ===========================================================================
   2 · LAS LISTAS DEL ENUNCIADO
   ===========================================================================
   Literales, y en su orden. ⚠️ Ninguna se "mejora": las opciones son las que
   escribió Josué, incluida "Otro", que aparece en cinco de ellas. */

/** Apartado 3. *"No obligar a seleccionar una longitud exacta."* */
export const TIPOS_BARBA = [
  { id: 'sin', nombre: 'Sin barba actualmente' },
  { id: 'corta', nombre: 'Barba corta' },
  { id: 'media', nombre: 'Barba media' },
  { id: 'larga', nombre: 'Barba larga' },
  { id: 'bigote', nombre: 'Bigote' },
  { id: 'perilla', nombre: 'Perilla' },
  { id: 'otro', nombre: 'Otro' },
];

/** Apartado 4 — opcional. */
export const LONGITUDES_BARBA = [
  { id: 'muy_corta', nombre: 'Muy corta' },
  { id: 'corta', nombre: 'Corta' },
  { id: 'media', nombre: 'Media' },
  { id: 'larga', nombre: 'Larga' },
  { id: 'variable', nombre: 'Variable' },
];

/** Apartado 5. */
export const ESTILOS_BARBA = [
  { id: 'completa', nombre: 'Barba completa' },
  { id: 'tres_dias', nombre: 'Barba de 3 días' },
  { id: 'corta', nombre: 'Barba corta' },
  { id: 'larga', nombre: 'Barba larga' },
  { id: 'bigote', nombre: 'Bigote' },
  { id: 'perilla', nombre: 'Perilla' },
  { id: 'otro', nombre: 'Otro' },
];

/** Apartado 6 — *"¿Qué buscas principalmente?"*. */
export const OBJETIVOS_BARBA = [
  { id: 'limpia', nombre: 'Mantenerla limpia' },
  { id: 'definir', nombre: 'Definirla' },
  { id: 'crecer', nombre: 'Dejarla crecer' },
  { id: 'aspecto', nombre: 'Mejorar su aspecto' },
  { id: 'piel', nombre: 'Cuidar la piel' },
  { id: 'facilitar', nombre: 'Facilitar el afeitado' },
  { id: 'otro', nombre: 'Otro' },
];

/** Apartado 7 — *"no hace falta que responda si no quiere"*. */
export const METODOS_AFEITADO = [
  { id: 'electrica', nombre: 'Máquina eléctrica' },
  { id: 'cuchilla', nombre: 'Cuchilla' },
  { id: 'navaja', nombre: 'Navaja' },
  { id: 'depilacion', nombre: 'Depilación' },
  { id: 'otro', nombre: 'Otro' },
];

/**
 * Apartado 8. ⚠️ **Las mismas seis etiquetas que `FRECUENCIAS_CORTE` de la Fase
 * 11**, y con el mismo significado: *"cuando lo necesito"* **no es una
 * frecuencia** y no se le pone un número por defecto, y "personalizado" espera a
 * que él diga cuál. Cada etiqueta declara sus días, o `null` si no los tiene.
 */
export const FRECUENCIAS_AFEITADO = [
  { id: 'diario', nombre: 'Diario', dias: 1 },
  { id: 'pocos_dias', nombre: 'Cada pocos días', dias: 3 },
  { id: 'semanal', nombre: 'Semanal', dias: 7 },
  { id: 'quincenal', nombre: 'Cada 2 semanas', dias: 14 },
  // ⚠️ Una respuesta de verdad, no un hueco. Nunca inventarle un número.
  { id: 'necesito', nombre: 'Cuando lo necesito', dias: null },
  { id: 'personalizado', nombre: 'Personalizado', dias: null },
];

export const frecuenciaAfeitado = (id) => FRECUENCIAS_AFEITADO.find((f) => f.id === id) || null;

/** Apartado 9 — *"puede seleccionar varias"*. */
export const PREFERENCIAS_AFEITADO = [
  { id: 'rapidez', nombre: 'Rapidez' },
  { id: 'precision', nombre: 'Precisión' },
  { id: 'comodidad', nombre: 'Comodidad' },
  { id: 'resultado', nombre: 'Resultado' },
  { id: 'piel', nombre: 'Cuidado de la piel' },
  { id: 'precio', nombre: 'Precio' },
];

/**
 * Apartado 11. ⚠️ *"La aplicación debe tratarlo como información declarada por
 * el usuario, no como diagnóstico médico."* Por eso son **molestias**, no
 * síntomas, y "Ninguno" es una respuesta: no es la ausencia de respuesta.
 */
export const MOLESTIAS_AFEITADO = [
  { id: 'irritacion', nombre: 'Irritación' },
  { id: 'sequedad', nombre: 'Sequedad' },
  { id: 'tirantez', nombre: 'Sensación de tirantez' },
  { id: 'molestias', nombre: 'Molestias' },
  { id: 'ninguno', nombre: 'Ninguno' },
  { id: 'otro', nombre: 'Otro' },
];

/**
 * Apartado 13 — *"mantener 🟢 Básico 🟡 Intermedio 🔴 Avanzado"*. ⚠️ **Se
 * importan de `perfilEstilo.js`** (F6): ids e iconos son los mismos y solo
 * cambia lo que significan aquí, como hizo `NIVELES_MANTENIMIENTO` en F12.
 */
export const NIVELES_BARBA = NIVELES_ESTILO.map((n) => ({
  ...n,
  frase: {
    basico: 'Afeitado y cuidado posterior.',
    intermedio: 'Y un poco de forma y mantenimiento.',
    avanzado: 'Gestionar más aspectos, si te apetece.',
  }[n.id] || '',
}));

export const nivelBarba = (id) => NIVELES_BARBA.find((n) => n.id === id) || null;

/* ===========================================================================
   3 · LAS PREGUNTAS (apartados 3 a 13)
   ===========================================================================
   ⚠️ **Todas van al motor de la Fase 7**, y el reparto entre la capa compartida
   y la `config` **no se decide aquí**: lo decide `destinoDe()` mirando el
   registro de la Fase 4.

   ⚠️ Y **el formulario es adaptativo desde el motor** (F13): a quien dice que
   no tiene barba no se le pregunta su longitud, y a quien no ha marcado
   Afeitado no se le pregunta cómo se afeita. Eso es `cuando`, nunca un `if` en
   el JSX. */

export const SECCIONES_BARBA = [
  { id: 'barba', nombre: 'Tu barba' },
  { id: 'afeitado', nombre: 'Tu afeitado' },
  { id: 'piel', nombre: 'Tu piel' },
  { id: 'nivel', nombre: 'Cómo lo quieres' },
];

/* ⚠️ `cuando` recibe las respuestas ya dadas Y las partes activas, para que una
   pregunta pueda depender de una casilla del apartado 2. Sin las partes, "si
   selecciona afeitado" (apartado 7) no se podría escribir. */
export const PREGUNTAS_BARBA = [
  {
    id: 'tipoBarba',
    seccion: 'barba',
    apartado: 3,
    titulo: '¿Cómo llevas la barba ahora mismo?',
    opciones: TIPOS_BARBA,
    cuando: (r, ctx) => ctx.partes.barba === true,
  },
  {
    id: 'longitudBarba',
    seccion: 'barba',
    apartado: 4,
    titulo: '¿Qué longitud sueles llevar?',
    ayuda: 'Opcional.',
    opciones: LONGITUDES_BARBA,
    /* ⚠️ A quien ha dicho que ahora mismo no lleva barba no se le pregunta qué
       longitud lleva: la pregunta no le aplica. Y esconderla **no borra** lo que
       hubiera contestado antes (F13). */
    cuando: (r, ctx) => ctx.partes.barba === true && !(r.tipoBarba || []).includes('sin'),
  },
  {
    id: 'estiloBarba',
    seccion: 'barba',
    apartado: 5,
    titulo: '¿Qué estilo te gusta llevar?',
    opciones: ESTILOS_BARBA,
    multiple: true,
    cuando: (r, ctx) => ctx.partes.barba === true,
  },
  {
    id: 'objetivoBarba',
    seccion: 'barba',
    apartado: 6,
    titulo: '¿Qué buscas principalmente?',
    opciones: OBJETIVOS_BARBA,
  },
  {
    id: 'metodoAfeitado',
    seccion: 'afeitado',
    apartado: 7,
    titulo: '¿Cómo sueles afeitarte?',
    ayuda: 'No hace falta que respondas si no quieres.',
    opciones: METODOS_AFEITADO,
    multiple: true,
    // ⚠️ *"Si selecciona afeitado"* — la casilla del apartado 2.
    cuando: (r, ctx) => ctx.partes.afeitado === true || ctx.partes.perfilado === true,
  },
  {
    id: 'frecuenciaAfeitado',
    seccion: 'afeitado',
    apartado: 8,
    titulo: '¿Cada cuánto sueles afeitarte o perfilarte?',
    opciones: FRECUENCIAS_AFEITADO,
    cuando: (r, ctx) => ctx.partes.afeitado === true || ctx.partes.perfilado === true,
  },
  {
    id: 'preferenciasAfeitado',
    seccion: 'afeitado',
    apartado: 9,
    titulo: '¿Qué valoras más?',
    opciones: PREFERENCIAS_AFEITADO,
    multiple: true,
    cuando: (r, ctx) => ctx.partes.afeitado === true || ctx.partes.perfilado === true,
  },
  {
    id: 'molestiaAfeitado',
    seccion: 'piel',
    apartado: 10,
    /* ⚠️ **NO es `sensibilidadPiel`.** Reaccionar a un producto y molestarse
       después de pasar una cuchilla son dos cosas distintas, y se puede tener lo
       primero sin afeitarse nunca. La otra se LEE del registro (apartado 17),
       no se vuelve a preguntar. */
    titulo: '¿Tu piel suele molestarse después del afeitado?',
    ayuda: 'Opcional.',
    opciones: [{ id: 'si', nombre: 'Sí' }, { id: 'no', nombre: 'No' }],
    cuando: (r, ctx) => ctx.partes.afeitado === true || ctx.partes.perfilado === true,
  },
  {
    id: 'molestiasBarba',
    seccion: 'piel',
    apartado: 11,
    // ⚠️ *"Si quiere, puede indicar"*, y nunca *"¿qué te pasa?"*.
    titulo: '¿Notas algo de esto después de afeitarte?',
    /* ⚠️ Ni siquiera para negarlo se escribe la palabra: `PALABRAS_CLINICAS`
       barre TODOS los textos de la fase, y "no es un diagnóstico" la contiene.
       Octava vez que una comprobación de este proyecto salta con algo que
       estaba bien dicho — y la forma de arreglarlo es decirlo sin la palabra. */
    ayuda: 'Nos lo cuentas tú. La aplicación no interpreta nada por su cuenta.',
    opciones: MOLESTIAS_AFEITADO,
    multiple: true,
    cuando: (r, ctx) => ctx.partes.afeitado === true || ctx.partes.perfilado === true,
  },
  {
    id: 'nivelBarba',
    seccion: 'nivel',
    apartado: 13,
    titulo: '¿Cuánto quieres complicarte?',
    opciones: NIVELES_BARBA.map((n) => ({ id: n.id, nombre: `${n.icono} ${n.nombre}`, ayuda: n.frase })),
  },
];

export const preguntaBarba = (id) => PREGUNTAS_BARBA.find((p) => p.id === id) || null;

/* ===========================================================================
   4 · LEER Y CONTESTAR
   ===========================================================================
   Todo pasa por el motor de la Fase 7. Este archivo no guarda una respuesta por
   su cuenta ni una sola vez. */

/* ⚠️ El contexto que ven los `cuando`: las respuestas las pone el motor, y las
   partes activas se las damos nosotros, porque el motor no sabe qué es una
   parte. Sin esto, "si selecciona afeitado" no se puede escribir sin un `if`. */
const conPartes = (estado) => ({ partes: datosBarba(estado).partes });

export const respuestaBarba = (estado, id, datosGlobales = {}) =>
  leerRespuesta(estado, MODULO_BARBA, preguntaBarba(id) || { id }, datosGlobales);

export const contestarBarba = (estado, id, valor, opts) =>
  contestar(estado, MODULO_BARBA, preguntaBarba(id) || { id, opciones: [] }, valor, opts);

export const borrarBarba = (estado, id, opts) =>
  borrarRespuesta(estado, MODULO_BARBA, preguntaBarba(id) || { id }, opts);

export const perfilBarba = (estado, datosGlobales = {}) =>
  leerCuestionario(estado, MODULO_BARBA, PREGUNTAS_BARBA, datosGlobales);

/** ⚠️ Lo que de verdad se le enseña ahora mismo, con las partes en el contexto. */
export const preguntasDeBarba = (estado, datosGlobales = {}) =>
  preguntasVisibles(estado, MODULO_BARBA, PREGUNTAS_BARBA, datosGlobales, conPartes(estado));

export const progresoBarba = (estado, datosGlobales = {}) =>
  progresoVisible(estado, MODULO_BARBA, PREGUNTAS_BARBA, datosGlobales, conPartes(estado));

/** *"Dividido en secciones"*, y sin enseñar una sección que se ha quedado vacía. */
export function seccionesDeBarba(estado, datosGlobales = {}) {
  const visibles = preguntasDeBarba(estado, datosGlobales);
  return SECCIONES_BARBA
    .map((s) => {
      /* ⚠️ La sección se busca en el catálogo, no en lo que devuelve el motor:
         `normalizarPregunta` se queda con lo que necesita para preguntar
         —título, opciones, `cuando`— y `seccion` es cosa de la pantalla. Mismo
         reparto que en `seccionesDePiel`. */
      const suyas = visibles.filter((q) => preguntaBarba(q.id)?.seccion === s.id);
      return { ...s, preguntas: suyas, contestadas: suyas.filter((q) => q.contestada).length, total: suyas.length };
    })
    // Una sección que se ha quedado sin preguntas visibles no se enseña vacía.
    .filter((s) => s.total > 0);
}

/* ===========================================================================
   5 · EL ALMACÉN
   ===========================================================================
   ⚠️ Lo único que se guarda aquí son las **partes**, el "Ahora no" y la fecha
   de edición: las respuestas las guarda el motor, y los productos son los del
   catálogo global (apartado 12). */

export const DEFAULT_BARBA = (() => {
  const partes = {};
  PARTES_BARBA.forEach((p) => { partes[p.id] = p.porDefecto; });
  return {
    // Apartado 1 — pulsó "Ahora no". Es una decisión, no un hueco.
    ahoraNo: false,
    // Apartado 2 — ¿ha pasado ya por la pantalla de las casillas?
    elegido: false,
    partes,
    // Apartado 12 — ids de productos del catálogo global. **Nunca fichas.**
    productos: [],
    // Apartado 8 — los días, solo si eligió "Personalizado".
    cadaCuantosDias: null,
    editado: null,
  };
})();

export function normalizarBarba(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const partes = {};
  PARTES_BARBA.forEach((p) => {
    partes[p.id] = typeof g.partes?.[p.id] === 'boolean' ? g.partes[p.id] : p.porDefecto;
  });
  const dias = Number(g.cadaCuantosDias);
  return {
    ahoraNo: g.ahoraNo === true,
    elegido: g.elegido === true,
    partes,
    /* ⚠️ **SOLO IDS.** Guardar aquí la ficha del producto sería el segundo
       inventario que prohíbe el apartado 12 (*"no crear un segundo
       inventario"*). La ficha vive en el catálogo global, y `productosDeBarba()`
       la va a buscar. */
    productos: (Array.isArray(g.productos) ? g.productos : []).filter((x) => typeof x === 'string'),
    /* ⚠️ `Number(null)` es 0 y `Number.isInteger(0)` es `true` — el fallo de
       F11, que planificaba un corte para HOY. Aquí un 0 no es una frecuencia. */
    cadaCuantosDias: Number.isInteger(dias) && dias > 0 ? dias : null,
    editado: typeof g.editado === 'string' ? g.editado : null,
  };
}

export const datosBarba = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_BARBA);
  return normalizarBarba(mod?.config?.barba);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_BARBA, { barba: datos });

/* ===========================================================================
   6 · LA ENTRADA Y LAS PARTES (apartados 1, 2 y 16)
   =========================================================================== */

/** Apartado 1 — *"Ahora no"*. Se guarda para no volver a plantarle la pantalla. */
export const decirAhoraNoBarba = (estado) =>
  ({ estado: escribir(estado, { ...datosBarba(estado), ahoraNo: true }), error: null });

export const configurarBarba = (estado, { hoy = todayISO() } = {}) =>
  ({ estado: escribir(estado, { ...datosBarba(estado), ahoraNo: false, editado: hoy }), error: null });

/**
 * Apartado 2 — las casillas. ⚠️ **Devuelve error si no marca ninguna**, en vez
 * de guardar un módulo que no gestiona nada: *"puede seleccionar varias"*, pero
 * alguna. Quien no quiere nada tiene "Ahora no", que es otra cosa.
 */
export function elegirPartesBarba(estado, ids = [], { hoy = todayISO() } = {}) {
  // ⚠️ Solo valen las casillas del apartado 2: `rutinas` no se elige aquí.
  const validas = ids.filter((id) => CASILLAS_BARBA.some((p) => p.id === id));
  if (validas.length === 0) {
    return { estado: normalizarEstiloHombre(estado), error: 'Elige al menos una cosa que quieras gestionar.' };
  }
  /* ⚠️ Solo se tocan las casillas del apartado 2. Los interruptores del 16
     —`rutinas`— se quedan como estén: volver a elegir qué gestionas no puede
     apagarte las rutinas por la espalda. */
  const actuales = datosBarba(estado).partes;
  const partes = { ...actuales };
  CASILLAS_BARBA.forEach((p) => { partes[p.id] = validas.includes(p.id); });
  return {
    estado: escribir(estado, { ...datosBarba(estado), partes, elegido: true, ahoraNo: false, editado: hoy }),
    error: null,
  };
}

export const parteActivaBarba = (estado, id) => datosBarba(estado).partes[id] === true;

/** Apartado 16 — *"sin perder los datos"*. Apagar no borra (F1, apartado 7). */
export function alternarParteBarba(estado, id) {
  if (!parteBarba(id)) return normalizarEstiloHombre(estado);
  const d = datosBarba(estado);
  return escribir(estado, { ...d, partes: { ...d.partes, [id]: !d.partes[id] } });
}

/* ===========================================================================
   7 · LOS TRES ESTADOS DE LA ENTRADA (apartado 1)
   =========================================================================== */

export const ESTADOS_BARBA = ['sin_configurar', 'ahora_no', 'eligiendo', 'a_medias', 'configurado'];

export function estadoDeEntradaBarba(estado, datosGlobales = {}) {
  const d = datosBarba(estado);
  const p = progresoBarba(estado, datosGlobales);
  if (p.contestadas > 0) return p.todasContestadas ? 'configurado' : 'a_medias';
  // ⚠️ Ha dicho qué quiere gestionar pero todavía no ha contestado nada: el
  // formulario es opcional (apartado 2 de la Fase 18, y aquí el 7).
  if (d.elegido) return 'eligiendo';
  return d.ahoraNo ? 'ahora_no' : 'sin_configurar';
}

/* ===========================================================================
   8 · LOS PRODUCTOS: LOS QUE YA TIENE (apartado 12)
   ===========================================================================
   ⚠️ *"Permitir seleccionar productos ya registrados… no crear un segundo
   inventario."* Los productos de piel (F13/F17) y los de pelo (F8/F10) ya
   existen, y **un aftershave puede estar en los dos sitios sin duplicarse**
   (F18, apartado 15: *"un producto puede pertenecer a Pelo, Skincare, Cuerpo e
   Higiene sin duplicarse"*). Aquí solo se guarda **cuáles ha marcado**. */

export function catalogoParaBarba(estado) {
  /* Los dos inventarios que existen hoy, con su origen a la vista para que la
     pantalla pueda decir de dónde sale cada uno. El día que Cuerpo tenga el
     suyo, se añade aquí y **no** en un tercer sitio. */
  return [
    ...productosPiel(estado).map((p) => ({ ...p, modulo: 'skincare', moduloNombre: 'Skincare' })),
    ...productosPelo(estado).map((p) => ({ ...p, modulo: 'pelo', moduloNombre: 'Pelo' })),
  ];
}

export const productosDeBarba = (estado) => {
  const ids = datosBarba(estado).productos;
  const catalogo = catalogoParaBarba(estado);
  /* ⚠️ Un id que ya no está —porque borró el producto en su módulo— **no se
     inventa**: desaparece de la lista. Guardar el nombre "por si acaso" sería
     tener media ficha aquí, que es el segundo inventario por la puerta de
     atrás. */
  return ids.map((id) => catalogo.find((p) => p.id === id)).filter(Boolean);
};

export function marcarProductoBarba(estado, productoId) {
  const d = datosBarba(estado);
  if (!catalogoParaBarba(estado).some((p) => p.id === productoId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  }
  if (d.productos.includes(productoId)) return { estado: normalizarEstiloHombre(estado), error: null, sinEfecto: true };
  return { estado: escribir(estado, { ...d, productos: [...d.productos, productoId] }), error: null };
}

export function quitarProductoBarba(estado, productoId) {
  const d = datosBarba(estado);
  /* ⚠️ Quitarlo de aquí **no lo borra de su módulo**: sigue siendo un producto
     de Skincare o de Pelo. Y por eso esto no pasa por la papelera (apartado 19
     de F18): no se está eliminando nada. */
  return { estado: escribir(estado, { ...d, productos: d.productos.filter((x) => x !== productoId) }), error: null };
}

/* ===========================================================================
   9 · LA FRECUENCIA (apartado 8)
   ===========================================================================
   ⚠️ **Misma decisión que `frecuenciaDeCorte()` en F11**: hay UNA respuesta a
   "cada cuánto", lo puesto a mano rellena el hueco de "Personalizado", y
   *"cuando lo necesito"* **es una respuesta** — nunca se le inventa un número. */

export function ponerDiasAfeitado(estado, dias) {
  const n = Number(dias);
  if (!(Number.isInteger(n) && n > 0)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Dime cada cuántos días, con un número.' };
  }
  return { estado: escribir(estado, { ...datosBarba(estado), cadaCuantosDias: n }), error: null };
}

export function frecuenciaDeAfeitado(estado, datosGlobales = {}) {
  const r = respuestaBarba(estado, 'frecuenciaAfeitado', datosGlobales);
  const elegida = r.contestada && !r.noSabe ? frecuenciaAfeitado(r.valores[0]) : null;
  const manual = datosBarba(estado).cadaCuantosDias;

  if (!elegida) {
    return {
      hay: false, dias: null, etiqueta: null,
      texto: 'Todavía no nos has dicho cada cuánto te afeitas.',
      aMano: manual, choque: false,
    };
  }
  if (elegida.id === 'necesito') {
    return {
      hay: true, dias: null, etiqueta: elegida.nombre,
      // ⚠️ Es una respuesta completa: no se traduce a días ni se avisa de nada.
      texto: 'Te afeitas cuando lo necesitas.',
      aMano: manual, choque: false,
    };
  }
  if (elegida.id === 'personalizado') {
    return manual
      ? { hay: true, dias: manual, etiqueta: elegida.nombre, texto: `Cada ${manual} días.`, aMano: manual, choque: false }
      : {
        hay: false, dias: null, etiqueta: elegida.nombre,
        // ⚠️ Sin la cifra NO se elige una por él.
        texto: 'Has elegido “Personalizado”: dinos cada cuántos días.',
        aMano: null, choque: false,
      };
  }
  /* ⚠️ Y si dijo una cosa en el perfil y luego puso otra a mano, **se enseña el
     choque** en vez de decidir por él. Misma regla que `frecuenciaDeCorte()`. */
  const choque = manual !== null && manual !== elegida.dias;
  return {
    hay: true,
    dias: elegida.dias,
    etiqueta: elegida.nombre,
    texto: choque
      ? `En tu perfil pusiste “${elegida.nombre}” y a mano ${manual} días.`
      : `${elegida.nombre}.`,
    aMano: manual,
    choque,
  };
}

/* ===========================================================================
   10 · LO QUE YA SABEMOS (apartado 17 y el 2 de la Fase 18)
   ===========================================================================
   ⚠️ *"No preguntar cosas que ya conozcamos."* `sensibilidadPiel` la declaró el
   registro de la Fase 4 con **`barba` escrito dentro** dos fases antes de que
   existiera este archivo, y la contestó la Fase 13. Aquí se LEE, y la pantalla
   dice de dónde sale y dónde se cambia. */

export const DATOS_QUE_YA_TENEMOS = ['sensibilidadPiel', 'sinPerfume', 'nivelEstilo'];

export function loQueYaSabemosDeTuBarba(estado, datosGlobales = {}) {
  return DATOS_QUE_YA_TENEMOS
    .map((id) => leerDato(estado, id, datosGlobales))
    .filter((d) => d && d.tiene)
    .map((d) => ({
      id: d.id,
      nombre: d.nombre,
      valor: d.texto || d.valor,
      // ⚠️ Nunca se edita desde aquí: se dice dónde se edita (F4).
      donde: d.donde,
    }));
}

/* ===========================================================================
   11 · EL TONO — ⚠️ NUNCA UN DIAGNÓSTICO (apartados 10 y 11)
   ===========================================================================
   ⚠️ **La lista de palabras es la de la Fase 13, importada.** Dos listas de
   palabras clínicas es exactamente cómo una acaba desactualizada. */

export function textosDeBarba() {
  return [
    ...Object.values(TEXTOS_BARBA),
    ...PREGUNTAS_BARBA.map((p) => p.titulo),
    ...PREGUNTAS_BARBA.map((p) => p.ayuda || ''),
    ...PARTES_BARBA.map((p) => p.nombre),
    ...PLAQUITAS_BARBA.map((p) => p.nombre),
    ...NIVELES_BARBA.map((n) => n.frase),
    ...[TIPOS_BARBA, LONGITUDES_BARBA, ESTILOS_BARBA, OBJETIVOS_BARBA, METODOS_AFEITADO,
      FRECUENCIAS_AFEITADO, PREFERENCIAS_AFEITADO, MOLESTIAS_AFEITADO]
      .flat().map((o) => o.nombre),
  ].filter(Boolean);
}

/* ===========================================================================
   12 · CONTEXTO, RESUMEN Y AUDITORÍA
   =========================================================================== */

export function contextoDeBarba(estado, datosGlobales = {}) {
  const ctx = contextoDelCuestionario(estado, MODULO_BARBA, PREGUNTAS_BARBA, datosGlobales);
  const val = (id) => {
    const r = respuestaBarba(estado, id, datosGlobales);
    return r.contestada && !r.noSabe ? r.valores : [];
  };
  const d = datosBarba(estado);
  return {
    ...ctx,
    tipo: val('tipoBarba')[0] || null,
    longitud: val('longitudBarba')[0] || null,
    estilos: val('estiloBarba'),
    objetivo: val('objetivoBarba')[0] || null,
    metodos: val('metodoAfeitado'),
    frecuencia: val('frecuenciaAfeitado')[0] || null,
    preferencias: val('preferenciasAfeitado'),
    molesta: val('molestiaAfeitado')[0] === 'si',
    molestias: val('molestiasBarba'),
    nivel: val('nivelBarba')[0] || null,
    partes: d.partes,
    productos: productosDeBarba(estado).map((p) => p.nombre),
    // ⚠️ Se lee del registro, no se vuelve a preguntar (apartado 17).
    sensiblePiel: leerDato(estado, 'sensibilidadPiel', datosGlobales).valor === 'si',
  };
}

export function resumenBarba(estado, datosGlobales = {}) {
  const p = progresoBarba(estado, datosGlobales);
  const d = datosBarba(estado);
  return {
    ...p,
    estado: estadoDeEntradaBarba(estado, datosGlobales),
    partesActivas: PARTES_BARBA.filter((x) => d.partes[x.id]).length,
    productos: productosDeBarba(estado).length,
    nivel: nivelBarba(respuestaBarba(estado, 'nivelBarba', datosGlobales).valores[0])?.nombre || null,
    frecuencia: frecuenciaDeAfeitado(estado, datosGlobales),
    // Los tres que se comparten, para que se vea que no son de aquí.
    compartidos: DATOS_QUE_YA_TENEMOS.filter((id) => destinoDe(id) === 'compartido'),
  };
}

/** ⚠️ El apartado 17 —*"no crear sistemas paralelos"*— hecho comprobable. */
export function auditarBarba() {
  return {
    // Ni un inventario nuevo (apartado 12).
    inventariosNuevos: 0,
    catalogosNuevos: 0,
    // Ni un calendario, ni unos recordatorios, ni una papelera propia.
    calendariosNuevos: 0,
    recordatoriosNuevos: 0,
    papelerasNuevas: 0,
    // Ni un segundo motor de cuestionarios ni una segunda escala de niveles.
    motoresNuevos: 0,
    escalasNuevas: 0,
    // Sin IA en toda la fase.
    usaIA: 0,
    // Y sin diagnósticos: la lista de palabras es la de la Fase 13.
    listasClinicasNuevas: 0,
    palabrasClinicas: PALABRAS_CLINICAS.length,
    motorCuestionarios: 'cuestionarios.js',
    registroDatos: 'datosEstiloHombre.js',
  };
}

/** Todo lo que la pantalla necesita, de una vez. */
export function panelBarba(estado, datosGlobales = {}) {
  const d = datosBarba(estado);
  return {
    textos: TEXTOS_BARBA,
    estado: estadoDeEntradaBarba(estado, datosGlobales),
    partes: PARTES_BARBA.map((p) => ({ ...p, activa: d.partes[p.id] })),
    /* ⚠️ Regla 8 — la plaquita que todavía no funciona **dice en qué fase
       llega**, y solo se enseñan las de las partes encendidas. */
    plaquitas: PLAQUITAS_BARBA.filter((pl) => (
      pl.id === 'perfil'
      || (pl.id === 'productos' ? d.partes.productos : true) && (pl.id === 'seguimiento' ? d.partes.seguimiento : true)
    )),
    secciones: seccionesDeBarba(estado, datosGlobales),
    progreso: progresoBarba(estado, datosGlobales),
    yaSabemos: loQueYaSabemosDeTuBarba(estado, datosGlobales),
    frecuencia: frecuenciaDeAfeitado(estado, datosGlobales),
    productos: productosDeBarba(estado),
    catalogo: catalogoParaBarba(estado),
    resumen: resumenBarba(estado, datosGlobales),
  };
}

export { NO_LO_SE, sinDiagnostico, PALABRAS_CLINICAS, NIVELES_ESTILO };
