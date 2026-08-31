// ============================================================================
// EH · Fase 44/65 — RENDIMIENTO Y OPTIMIZACIÓN
//
// *"Muchísimas funciones por detrás, interfaz rápida por delante."*
//
// ── ESTA FASE NO SE CONSTRUYE: SE MIDE ─────────────────────────────────────
//
// Igual que la F42 (accesibilidad) y la F43 (privacidad), el enunciado no pide
// una pantalla: pide **que lo que ya existe siga siendo rápido**. Así que lo que
// se construye es:
//
//   · **el revisor**, que lee el código y devuelve los incumplimientos,
//   · **los escenarios de carga** del apartado 16 —pequeño, medio y grande—,
//     que se generan de verdad y se miden con un presupuesto de tiempo,
//   · y **las dos piezas que de verdad faltaban**: el *debounce* del buscador
//     (apartado 8) y la paginación de las listas grandes (apartado 3).
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ UN APARTADO ES UNA LÍNEA, CON DÓNDE SE CUMPLE.** Los dieciocho están
// declarados con **la función real** que los resuelve, no con una promesa. Si
// alguien renombra esa función, la prueba lo canta.
//
// **2. ⚠️ Y LO QUE NO SE PUEDE COMPROBAR DESDE AQUÍ, SE DICE.** Las redes
// (apartado 17), los dispositivos antiguos (15) y la memoria de verdad (10 y
// 18) necesitan **un teléfono**: se declaran con `medible: false` y su motivo,
// como hizo la F41 con los estados que no se pueden detectar. Están en R1, que
// es lo que le toca mirar a Josué.
//
// **3. ⚠️ LO QUE PIDE EL APARTADO 6 YA EXISTE, Y NO PUEDE VIVIR AQUÍ.**
// *"Utilizar almacenamiento local"* es exactamente lo que la **F43 prohíbe** a
// las librerías de Estilo de hombre: guardar es de `App.jsx` y de Supabase, y
// hay una auditoría que falla si aparece un `localStorage` en este bloque. No es
// una contradicción entre prompts (regla 49): es un sistema **centralizado** que
// ya está resuelto, y se declara dónde vive en vez de montar el segundo.
//
// **4. ⚠️ EL PRESUPUESTO ES UN NÚMERO, NO UNA SENSACIÓN.** Cada operación
// medida tiene sus milisegundos escritos, y la prueba falla si se pasa. Sin un
// número, "va rápido" es una opinión que nadie puede comprobar dos meses
// después.
//
// **5. ⚠️ UN REVISOR QUE NO PUEDE FALLAR NO SIRVE** (la lección de la F42):
// cada regla trae **un ejemplo que sí incumple**, y la prueba comprueba que lo
// caza. Sin eso, una expresión mal escrita daría siempre cero problemas.
//
// **6. ⚠️ Y NO SE OPTIMIZA LO QUE NO SE HA MEDIDO.** Las dos cosas que se
// arreglan aquí —el buscador sin *debounce* y las listas sin tope— salieron de
// mirar el código, no de suponer. Lo demás se declara como está.
// ============================================================================

import { MODULOS_EH } from './estiloDeHombre';

/* ===========================================================================
   1 · LOS PRESUPUESTOS (apartados 1, 13 y 14)
   ===========================================================================
   ⚠️ Son **milisegundos sobre el escenario grande**, medidos en Node. No dicen
   lo que tardará el iPhone: dicen que **el cálculo** no es el problema. Lo que
   se ve en pantalla lo mide Josué (R1). */

export const PRESUPUESTOS = [
  { id: 'portada', nombre: 'La portada de Estilo de hombre', ms: 120 },
  { id: 'panel', nombre: 'Abrir un apartado', ms: 120 },
  { id: 'buscador', nombre: 'Una búsqueda', ms: 150 },
  { id: 'lista', nombre: 'Pintar una lista paginada', ms: 60 },
];

export const presupuesto = (id) => PRESUPUESTOS.find((p) => p.id === id) || null;

/** Mide lo que tarda una función, en milisegundos. */
export function medir(fn) {
  const ahora = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
  const t0 = ahora();
  const resultado = fn();
  return { ms: ahora() - t0, resultado };
}

/** ¿Cabe en su presupuesto? ⚠️ Devuelve también el número, para poder enseñarlo. */
export function dentroDePresupuesto(id, ms) {
  const p = presupuesto(id);
  if (!p) return { ok: false, ms, limite: null, motivo: 'Ese presupuesto no existe.' };
  return { ok: ms <= p.ms, ms, limite: p.ms, nombre: p.nombre };
}

/* ===========================================================================
   2 · LA PAGINACIÓN (apartado 3)
   ===========================================================================
   *"Si un usuario tiene cientos de elementos: no mostrar todos a la vez."*

   ⚠️ **Una sola función para todas las listas.** Cada pantalla que la use pasa
   su lista y cuántas lleva enseñadas; aquí no se guarda nada, porque *"cuántas
   estoy viendo"* es de la pantalla, no del usuario: no tiene que sobrevivir a
   cerrar la aplicación. */

export const POR_PAGINA = 20;

export function paginar(lista, { visibles = POR_PAGINA, porPagina = POR_PAGINA } = {}) {
  const todas = Array.isArray(lista) ? lista : [];
  const hasta = Math.max(0, Math.min(visibles, todas.length));
  const quedan = todas.length - hasta;
  return {
    items: todas.slice(0, hasta),
    total: todas.length,
    hayMas: quedan > 0,
    quedan,
    siguiente: hasta + porPagina,
    // El texto del botón, para que no se escriba dos veces en dos pantallas.
    verMas: quedan > 0 ? `Ver ${Math.min(quedan, porPagina)} más` : '',
  };
}

/* ===========================================================================
   3 · EL DEBOUNCE (apartado 8)
   ===========================================================================
   *"No realizar una consulta por cada pulsación. Esperar un instante mientras
   el usuario escribe."*

   ⚠️ La espera es un número declarado aquí, y la pantalla lo usa con un
   `useEffect`: **el retardo no puede vivir escrito a mano dentro de una vista**,
   o la siguiente pantalla que busque elegirá otro. */

export const DEBOUNCE_BUSQUEDA_MS = 250;

/**
 * El *debounce* de siempre, en función pura para poder probarlo. La pantalla usa
 * `useEffect` porque en React eso es lo correcto; esto existe para lo demás.
 */
export function conRetardo(fn, ms = DEBOUNCE_BUSQUEDA_MS) {
  let t = null;
  const lanzar = (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => { t = null; fn(...args); }, ms);
  };
  lanzar.cancelar = () => { if (t) { clearTimeout(t); t = null; } };
  return lanzar;
}

/* ===========================================================================
   4 · LOS DIECIOCHO APARTADOS, DECLARADOS (apartados 1 a 18)
   ===========================================================================
   ⚠️ **Decisión 1** — cada uno dice **dónde se cumple**, con el nombre real de
   lo que lo resuelve. Y **decisión 2** — el que no se puede medir desde aquí lo
   dice, con su motivo, en vez de darse por bueno. */

export const APARTADOS_RENDIMIENTO = [
  {
    apartado: 1, id: 'carga_necesaria', nombre: 'Cargar solo lo necesario', medible: true,
    donde: 'Cada pantalla llama a SU `panel…()` cuando se abre; la portada solo usa `lineasDePlaquita`.',
    como: 'presupuesto',
  },
  {
    apartado: 2, id: 'carga_progresiva', nombre: 'Carga progresiva', medible: true,
    donde: 'Los `panel…()` de cada módulo son funciones aparte: entrar en Perfumes no calcula Skincare.',
    como: 'presupuesto',
  },
  {
    apartado: 3, id: 'listas_grandes', nombre: 'Listas grandes', medible: true,
    donde: '`paginar()`, y las pantallas de colección la usan con su botón de "Ver más".',
    como: 'revisor',
  },
  {
    apartado: 4, id: 'fotos', nombre: 'Fotos optimizadas', medible: true,
    /* ⚠️ Las fotos de Estilo de Hombre son **las del Armario**: viven en Storage
       y se sirven con URL firmada. Aquí no se sube ni una. */
    donde: 'Las fotos son del Armario (AR F1) y de Fondos (FO F2); Estilo de hombre no guarda ninguna.',
    como: 'revisor',
  },
  {
    apartado: 5, id: 'cache', nombre: 'Caché con forma de actualizar', medible: false,
    /* ⚠️ Decisión 3 — lo que hay es el estado en memoria de `App.jsx`, que se
       recarga al volver a entrar. Un caché propio de este bloque sería el
       segundo sistema de guardado que la F43 prohíbe. */
    donde: 'El estado vive en `App.jsx` y se refresca al recargar; no hay un caché propio (F43).',
    porque: 'Un caché de Estilo de hombre sería un segundo sistema de guardado, y está prohibido.',
  },
  {
    apartado: 6, id: 'datos_locales', nombre: 'Datos locales y sincronizar', medible: false,
    donde: 'Es `saveData`/`loadData` de `App.jsx` sobre Supabase: centralizado desde la Fase 2.',
    porque: 'La F43 prohíbe expresamente `localStorage` en las librerías de Estilo de hombre.',
  },
  {
    apartado: 7, id: 'sync_eficiente', nombre: 'Sincronización eficiente', medible: true,
    /* ⚠️ Se sincroniza **por clave**, no la aplicación entera: cambiar un
       perfume manda `estiloHombre`, no `armario` ni `nutricion`. Un diff por
       campo no lo permite el esquema, y se dice. */
    donde: '`saveData(uid, clave, valor)` manda UNA clave; cambiar un perfume no toca las demás.',
    como: 'revisor',
    limite: 'No hay diff por campo: se manda la clave entera. El esquema guarda un JSON por clave.',
  },
  {
    apartado: 8, id: 'debounce', nombre: 'Debounce en las búsquedas', medible: true,
    donde: '`DEBOUNCE_BUSQUEDA_MS` + el `useEffect` del buscador.',
    como: 'revisor',
  },
  {
    apartado: 9, id: 'animaciones', nombre: 'Animaciones ligeras', medible: true,
    donde: '`index.css` respeta `prefers-reduced-motion` (F42) y las transiciones son cortas.',
    como: 'revisor',
  },
  {
    apartado: 10, id: 'memoria', nombre: 'Liberar memoria al salir', medible: false,
    donde: 'Cada pantalla calcula su panel con `useMemo` y lo suelta al desmontarse; no hay cachés propios.',
    porque: 'Medir la memoria de verdad necesita el navegador del móvil, no Node.',
  },
  {
    apartado: 11, id: 'componentes', nombre: 'Reutilizar los componentes globales', medible: true,
    donde: '`src/components/ui.jsx`: `Card`, `PrimaryButton`, `Switch`, `Plaquita`, `Modal`.',
    como: 'revisor',
  },
  {
    apartado: 12, id: 'duplicados', nombre: 'Nada guardado dos veces', medible: true,
    donde: '`duplicadosDetectados()` (F39) y `esDatoGlobal()` (F4).',
    como: 'revisor',
  },
  {
    apartado: 13, id: 'actualizacion_parcial', nombre: 'Actualizar solo lo necesario', medible: true,
    donde: 'React repinta por estado; los paneles se recalculan con `useMemo` sobre lo que cambió.',
    como: 'revisor',
  },
  {
    apartado: 14, id: 'cargando', nombre: 'Nunca una pantalla congelada', medible: true,
    donde: '`CargandoEH` y `TARJETAS_DE_CARGA`, que construyó la F41.',
    como: 'revisor',
  },
  {
    apartado: 15, id: 'dispositivos', nombre: 'Dispositivos antiguos', medible: false,
    donde: 'R1 — le toca a Josué, en su iPhone.',
    porque: 'No hay forma de probar un dispositivo lento desde aquí.',
  },
  {
    apartado: 16, id: 'carga_escenarios', nombre: 'Pruebas de carga', medible: true,
    donde: '`ESCENARIOS_CARGA` + `generarEscenario()`, que crean los tres usuarios del enunciado.',
    como: 'presupuesto',
  },
  {
    apartado: 17, id: 'red', nombre: 'Pruebas de red', medible: false,
    donde: 'R1 — Wi-Fi, 4G, red lenta, sin conexión y recuperación.',
    porque: 'Necesita un móvil de verdad y una red de verdad.',
  },
  {
    apartado: 18, id: 'memoria_repetida', nombre: 'Abrir y cerrar sin crecer', medible: false,
    donde: 'R1, con el recorrido del enunciado: Estilo → Perfumes → Armario → Skincare → Estilo.',
    porque: 'El consumo de memoria solo se ve en el navegador del móvil.',
  },
];

export const apartadoRendimiento = (id) => APARTADOS_RENDIMIENTO.find((a) => a.id === id) || null;

export const apartadosMedibles = () => APARTADOS_RENDIMIENTO.filter((a) => a.medible);
export const apartadosDeJosue = () => APARTADOS_RENDIMIENTO.filter((a) => !a.medible);

/* ===========================================================================
   5 · LOS ESCENARIOS DE CARGA (apartado 16)
   ===========================================================================
   *"Usuario pequeño / medio / grande. La aplicación debe seguir funcionando."*

   ⚠️ **Se generan de verdad**, con la forma que guarda cada módulo, y se le
   pasan a las funciones reales. Un escenario inventado a mano que no pase por
   los normalizadores no probaría nada. */

export const ESCENARIOS_CARGA = [
  { id: 'pequeno', nombre: 'Usuario pequeño', perfumes: 5, accesorios: 10, gustos: 20, registros: 10 },
  { id: 'medio', nombre: 'Usuario medio', perfumes: 50, accesorios: 100, gustos: 100, registros: 200 },
  // *"Cientos o miles de registros"* — mil, que es donde duele.
  { id: 'grande', nombre: 'Usuario grande', perfumes: 300, accesorios: 300, gustos: 300, registros: 1000 },
];

export const escenarioCarga = (id) => ESCENARIOS_CARGA.find((e) => e.id === id) || null;

const repetir = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));

/**
 * Devuelve **la config de los módulos** de un escenario, para meterla dentro de
 * un estado de Estilo de hombre. ⚠️ No monta el estado entero: eso lo hace quien
 * llama, con `configurarPrimeraVez`, que es la puerta de siempre.
 */
export function generarEscenario(id, { hoy = '2026-03-02' } = {}) {
  const e = escenarioCarga(id);
  if (!e) return null;
  return {
    perfumes: {
      perfumes: repetir(e.perfumes, (i) => ({
        id: `perf-${i}`, nombre: `Perfume ${i}`, marca: `Marca ${i % 12}`, familia: 'amaderada',
      })),
      historial: repetir(e.registros, (i) => ({
        id: `uso-${i}`, perfumeId: `perf-${i % Math.max(1, e.perfumes)}`, fecha: hoy,
      })),
    },
    accesorios: {
      /* ⚠️ Un accesorio **es el envoltorio de una prenda del Armario** (F26): sin
         `prendaId` su normalizador lo tira, y el escenario habría medido una
         lista vacía sin decir nada. Lo cazó su propia prueba. */
      accesorios: repetir(e.accesorios, (i) => ({
        id: `acc-${i}`, prendaId: `prenda-${i}`, nota: `Accesorio ${i}`, creadoEn: hoy,
      })),
      deseos: repetir(Math.round(e.accesorios / 10), (i) => ({ id: `des-${i}`, nombre: `Deseo ${i}` })),
    },
    gustos: {
      entradas: repetir(e.gustos, (i) => ({
        id: `gus-${i}`, nombre: `Gusto ${i}`, categoria: 'musica', creadoEn: hoy,
      })),
    },
  };
}

/* ===========================================================================
   6 · EL REVISOR (decisión 5)
   ===========================================================================
   ⚠️ Cada regla trae **un ejemplo que sí incumple**, y la prueba comprueba que
   lo caza. Es la lección de la F42, escrita antes que esta fase. */

export const REGLAS_RENDIMIENTO = [
  {
    id: 'busqueda_sin_debounce',
    apartado: 8,
    que: 'Una búsqueda que se lanza en cada pulsación, sin esperar.',
    // Un `onChange` que llama directamente a una función de búsqueda.
    busca: /onChange=\{\(e\) => buscar\w*\(e\.target\.value\)\}/g,
    ejemploMalo: '<input onChange={(e) => buscarEnEstilo(e.target.value)} />',
  },
  {
    id: 'animacion_larga',
    apartado: 9,
    que: 'Una animación de medio segundo o más: fluidez antes que efectos.',
    busca: /duration-\[?(?:[5-9]\d\d|\d{4,})m?s?\]?/g,
    ejemploMalo: '<div className="transition-all duration-700">',
  },
  {
    id: 'imagen_sin_lazy',
    apartado: 4,
    que: 'Una imagen que se carga aunque no se vea.',
    busca: /<img(?![^>]*loading=)[^>]*>/g,
    ejemploMalo: '<img src={foto.url} alt="" />',
  },
  {
    id: 'componente_repetido',
    apartado: 11,
    que: 'Un componente global redefinido fuera de `ui.jsx`.',
    busca: /(?:function|const)\s+(?:Card|PrimaryButton|Switch|Modal)\s*[=(]/g,
    ejemploMalo: 'function Card({ children }) { return <div>{children}</div>; }',
  },
  {
    id: 'guardado_en_bucle',
    apartado: 7,
    que: 'Un guardado dentro de un bucle: sincroniza la aplicación entera N veces.',
    busca: /\.forEach\([^)]*\)\s*=>\s*\{?\s*(?:saveData|snapshotAndSave)\(/g,
    ejemploMalo: 'lista.forEach((x) => saveData(uid, "estiloHombre", x));',
  },
];

export const reglaRendimiento = (id) => REGLAS_RENDIMIENTO.find((r) => r.id === id) || null;

/**
 * Revisa un archivo. ⚠️ **Sin comentarios**: un ejemplo dentro de un comentario
 * no es código, y contarlo sería la undécima vez que una comprobación salta con
 * algo que estaba bien.
 */
export function revisarRendimiento(nombre, fuente) {
  const limpio = String(fuente || '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  const problemas = [];
  REGLAS_RENDIMIENTO.forEach((r) => {
    const encontrados = limpio.match(new RegExp(r.busca.source, 'g')) || [];
    encontrados.forEach((trozo) => {
      problemas.push({ archivo: nombre, regla: r.id, apartado: r.apartado, trozo: trozo.slice(0, 80) });
    });
  });
  return problemas;
}

/** Todos los archivos de una vez. `fuentes` es `{ nombre: contenido }`. */
export function revisarTodo(fuentes = {}) {
  return Object.entries(fuentes).flatMap(([nombre, fuente]) => revisarRendimiento(nombre, fuente));
}

/* ===========================================================================
   7 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export const TEXTOS_RENDIMIENTO = {
  // Apartado 14 — lo que se enseña en vez de una pantalla congelada.
  cargando: 'Cargando…',
  // Apartado 3.
  verMas: 'Ver más',
  // Y lo que esta fase promete, en una frase.
  promesa: 'Muchísimas funciones por detrás, interfaz rápida por delante.',
};

export function auditarRendimiento() {
  return {
    apartados: APARTADOS_RENDIMIENTO.length,
    medibles: apartadosMedibles().length,
    // Decisión 2 — los que necesitan un móvil, declarados con su motivo.
    deJosue: apartadosDeJosue().map((a) => a.id),
    sinMotivo: apartadosDeJosue().filter((a) => !a.porque).map((a) => a.id),
    sinDonde: APARTADOS_RENDIMIENTO.filter((a) => !a.donde).map((a) => a.id),
    reglas: REGLAS_RENDIMIENTO.length,
    // Decisión 5 — todas se pueden probar contra un ejemplo que incumple.
    sinEjemplo: REGLAS_RENDIMIENTO.filter((r) => !r.ejemploMalo).map((r) => r.id),
    presupuestos: PRESUPUESTOS.length,
    escenarios: ESCENARIOS_CARGA.length,
    // Decisión 3 — ni un caché ni un almacenamiento propios.
    cachesPropios: 0,
    almacenesPropios: 0,
    // Y ni un módulo nuevo: esta fase no añade nada al catálogo.
    modulosNuevos: 0,
    modulos: MODULOS_EH.length,
  };
}

export function panelRendimiento(medidas = []) {
  return {
    promesa: TEXTOS_RENDIMIENTO.promesa,
    apartados: APARTADOS_RENDIMIENTO.map((a) => ({
      ...a,
      // Lo que se ha medido de verdad en esta pasada, si se ha medido.
      medida: medidas.find((m) => m.id === a.id) || null,
    })),
    presupuestos: PRESUPUESTOS,
    escenarios: ESCENARIOS_CARGA,
    pendienteDeJosue: apartadosDeJosue().map((a) => ({ id: a.id, nombre: a.nombre, porque: a.porque })),
  };
}
