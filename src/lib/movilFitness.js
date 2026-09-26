/* ═══════════════════════════════════════════════════════════════════════════
   FIT F38 — UX móvil extrema y optimización para iPhone
   ═══════════════════════════════════════════════════════════════════════════

   *"Esta fase NO añade funcionalidades grandes. […] NO rediseñar Fitness desde
   cero. […] No modificar RankEngine, ProgressEngine, GoalEngine, WorkoutSession,
   ExerciseCatalog, TrainingActivity."*

   Casi todo lo que pide ya estaba, y está dicho en `YA_EXISTIA_F38` con dónde vive:
   la Safe Area (E3 F1), las zonas de toque (EH F42), el gesto que no se pelea
   con el scroll (F9), los temporizadores con marcas de tiempo (E3 F25 y F7), el
   entrenamiento que se recupera al volver (F7), el sonido y la vibración del
   bus (F9), el movimiento reducido (F37) y la lista de veinte en veinte (F34).

   Lo que faltaba es poco y concreto:

   · **«Última vez: 20 kg × 10»** en el entrenamiento en vivo (apartado 12). La
     F11 dejó escrita `ultimaVez()` *"para una fase futura"*: ésta. Es solo una
     referencia: no rellena ni marca nada.
   · **Los campos de número y de búsqueda** con su teclado, sin autocorrector
     ni autocompletado y con la tecla de Intro adecuada (apartados 8, 27 y 28).
   · **Las hojas caben en la pantalla** (22 y 23): un tope de altura con la
     altura VISIBLE del iPhone (`dvh`) y scroll dentro. La de un rango no
     tenía ni tope ni scroll: con la letra grande del sistema o un texto
     largo se habría salido por arriba, sin forma de leer el final.
   · **Volver a una lista deja donde estaba** (32), con `useScrollAlVolver`.
   · **Las miniaturas se cargan cuando se ven** (40 y 41).
   · Y **una auditoría que lee los archivos de Fitness** para que nada de esto
     se pierda la próxima vez que alguien toque una pantalla. */
import { ultimaVez } from './progresion.js';
import { etiquetaDeFecha } from './historial.js';
import { revisarPantalla } from './accesibilidadEH.js';
import { todayISO } from './helpers.js';

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LOS CAMPOS (apartados 8, 9, 11, 27 y 28)
   ═══════════════════════════════════════════════════════════════════════════
   El `inputMode` ya lo ponía cada campo (F7 y F9). Lo que faltaba es lo que
   el iPhone añade por su cuenta: el autocorrector convierte «L-sit» en «Lista»,
   el autocompletado ofrece un «62» de otro formulario encima del teclado, y la
   mayúscula automática estorba en un buscador. Un objeto compartido: si se
   escribe en cada campo, el siguiente se lo deja. */
export const PROPS_CAMPO_NUMERICO = Object.freeze({
  autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false, enterKeyHint: 'done',
});
export const PROPS_CAMPO_BUSQUEDA = Object.freeze({
  autoComplete: 'off', autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false, enterKeyHint: 'search',
});

/* ═══════════════════════════════════════════════════════════════════════════
   2 · «ÚLTIMA VEZ» (apartado 12)
   ═══════════════════════════════════════════════════════════════════════════
   *"Mostrar opcionalmente «Última vez: 20 kg × 10» solo como referencia. No
   introducir automáticamente un dato como realizado."* Sale de `ultimaVez()`
   (F11), que ya deja fuera la sesión que se está haciendo, y la fecha la dice
   `etiquetaDeFecha()` (F10) — «Hoy», «Ayer» o el día. Sin vez anterior, `null`:
   no se inventa ninguna. */
export function ultimaVezEnVivo(fitness, exerciseId, { propios = [], sesionId = null, hoy = todayISO() } = {}) {
  if (!exerciseId) return null;
  const u = ultimaVez(fitness || {}, exerciseId, { propios, antesDe: sesionId });
  if (!u || !u.texto) return null;
  return { texto: `Última vez: ${u.texto}`, cuando: etiquetaDeFecha(u.fecha, hoy), series: u.series || '', fecha: u.fecha };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · EN QUÉ PANTALLAS SE PRUEBA (apartados 29 y 51)
   ═══════════════════════════════════════════════════════════════════════════
   *"No asumir que una única resolución representa todos los móviles."* El
   recorrido abre Fitness en cada una y mide que la página no se salga de lado. */
export const DISPOSITIVOS_DE_PRUEBA = [
  { id: 'iphone-pequeno', nombre: 'iPhone pequeño', ancho: 320, alto: 568 },
  { id: 'iphone-se', nombre: 'iPhone SE', ancho: 375, alto: 667 },
  { id: 'iphone', nombre: 'iPhone estándar', ancho: 393, alto: 852 },
  { id: 'iphone-grande', nombre: 'iPhone grande', ancho: 430, alto: 932 },
  { id: 'horizontal', nombre: 'iPhone en horizontal', ancho: 667, alto: 375 },
  { id: 'ipad', nombre: 'iPad', ancho: 768, alto: 1024 },
  { id: 'escritorio', nombre: 'Escritorio', ancho: 1280, alto: 900 },
];

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LA AUDITORÍA, SOBRE LOS ARCHIVOS DE VERDAD
   ═══════════════════════════════════════════════════════════════════════════ */

/* Quitar comentarios —también los de JSX— para no contar lo que se promete en
   uno (la lección de siempre: SC F1, NAVO F1, F38…). */
const sinComentarios = (src) => String(src || '')
  /* Cada comentario deja sus saltos de línea: así la línea que se informa es
     la del archivo, no la del texto ya limpio. */
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''))
  .replace(/^\s*\/\/.*$/gm, '');

/* Las etiquetas de un tipo, de `<input` hasta su `/>`. Un `>` suelto dentro
   de una función flecha no las corta. */
const etiquetas = (src, nombre) => {
  const limpio = sinComentarios(src);
  const res = [];
  const re = new RegExp(`<${nombre}\\b`, 'g');
  let m;
  while ((m = re.exec(limpio))) {
    const fin = limpio.indexOf('/>', m.index);
    if (fin < 0) break;
    res.push({ tag: limpio.slice(m.index, fin + 2), linea: limpio.slice(0, m.index).split('\n').length });
  }
  return res;
};
const camposDe = (src) => [...etiquetas(src, 'input'), ...etiquetas(src, 'TextInput')];

/** Apartados 8, 27 y 28 — un campo de número sin las props compartidas. */
export function camposNumericosSinProps(src) {
  return camposDe(src)
    .filter(({ tag }) => /inputMode=(?:"(?:numeric|decimal)"|\{)/.test(tag) || /type="number"/.test(tag))
    .filter(({ tag }) => !/\{\.\.\.PROPS_CAMPO_NUMERICO\}/.test(tag))
    .map(({ linea }) => linea);
}

/** Apartado 28 — un buscador sin las suyas. */
export function busquedasSinProps(src) {
  return camposDe(src)
    .filter(({ tag }) => /(?:aria-label|placeholder)=(?:"|\{`)Buscar/.test(tag))
    .filter(({ tag }) => !/\{\.\.\.PROPS_CAMPO_BUSQUEDA\}/.test(tag))
    .map(({ linea }) => linea);
}

/** Apartados 22 y 23 — toda hoja que entra (`hoja-entra`, F37) cabe: lleva
 *  `hoja-movil` y deja sitio a la barra de inicio del iPhone. */
export function hojasQueNoCaben(src) {
  const limpio = sinComentarios(src);
  const res = [];
  const re = /className=(?:"[^"]*\bhoja-entra\b[^"]*"|\{`[^`]*\bhoja-entra\b[^`]*`\})/g;
  let m;
  while ((m = re.exec(limpio))) {
    const cola = limpio.slice(m.index, m.index + 400);
    const linea = limpio.slice(0, m.index).split('\n').length;
    if (!/\bhoja-movil\b/.test(m[0])) res.push({ linea, falta: 'hoja-movil' });
    else if (!/--safe-bottom/.test(cola)) res.push({ linea, falta: 'safe-bottom' });
  }
  return res;
}

/** Apartados 40 y 41 — una miniatura (`object-cover`) se carga cuando se ve.
 *  ⚠️ La foto que se ABRE (`object-contain`) no: es la que se quiere ya. */
export function miniaturasSinPerezosa(src) {
  return etiquetas(src, 'img')
    .filter(({ tag }) => /object-cover/.test(tag) && !/loading="lazy"/.test(tag))
    .map(({ linea }) => linea);
}

/** Apartados 34, 35 y 36 — ni pulsación larga, ni arrastrar, ni deslizar para
 *  borrar. `draggable={false}` es justo lo contrario, y vale. */
export function gestosEscondidos(src) {
  const limpio = sinComentarios(src);
  const res = [];
  if (/onContextMenu=/.test(limpio)) res.push('pulsacion_larga');
  if (/draggable(?!=\{false\})/.test(limpio) || /onDrag(?:Start|End|Over)?=/.test(limpio)) res.push('arrastrar');
  return res;
}

export const CASILLAS_MOVIL = [
  { id: 'campos_numericos', apartado: 27, texto: 'Cada campo de número abre su teclado, sin autocorrector ni autocompletado' },
  { id: 'busquedas', apartado: 28, texto: 'Cada buscador, sin autocorrector ni mayúscula automática' },
  { id: 'hojas', apartado: 22, texto: 'Cada hoja cabe en la pantalla visible del iPhone y deja sitio a la barra de inicio' },
  { id: 'clase_hoja', apartado: 23, texto: '`hoja-movil` existe: altura visible (`dvh`), scroll dentro y sin arrastrar la página' },
  { id: 'miniaturas', apartado: 40, texto: 'Las miniaturas se cargan cuando se ven' },
  { id: 'sin_gestos_escondidos', apartado: 34, texto: 'Ni pulsación larga, ni arrastrar, ni deslizar para borrar' },
  { id: 'toques', apartado: 33, texto: 'Ni un botón sin nombre ni sin zona de toque (el revisor de la EH F42), también en los componentes' },
];

/**
 * `archivos`: `{ ruta: código }` de Fitness. `css`: `index.css`.
 * Devuelve cada casilla con lo que la pone roja, para que se sepa dónde mirar.
 */
export function auditarMovil({ css = '', archivos = {} } = {}) {
  const por = (fn) => Object.entries(archivos)
    .flatMap(([ruta, src]) => (fn(src) || []).map((x) => ({ ruta, ...(typeof x === 'object' ? x : { dato: x }) })));
  const problemas = {
    campos_numericos: por(camposNumericosSinProps),
    busquedas: por(busquedasSinProps),
    hojas: por(hojasQueNoCaben),
    clase_hoja: /\.hoja-movil\s*\{[^}]*max-height:\s*88dvh[^}]*overflow-y:\s*auto[^}]*overscroll-behavior:\s*contain/.test(css)
      && /\.hoja-movil\s*\{[^}]*max-height:\s*88vh/.test(css) ? [] : [{ ruta: 'src/index.css', dato: '.hoja-movil' }],
    miniaturas: por(miniaturasSinPerezosa),
    sin_gestos_escondidos: por(gestosEscondidos),
    toques: por((src) => revisarPantalla(src).problemas.map((p) => ({ dato: p.regla, linea: p.linea }))),
  };
  const casillas = CASILLAS_MOVIL.map((c) => ({ ...c, ok: problemas[c.id].length === 0, problemas: problemas[c.id] }));
  return { casillas, ok: casillas.every((c) => c.ok) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LO QUE YA EXISTÍA, LO QUE NO SE HACE Y LO DECIDIDO
   ═══════════════════════════════════════════════════════════════════════════ */

export const YA_EXISTIA_F38 = [
  { apartado: 2, que: 'La Safe Area', donde: '`--safe-top`, `--safe-bottom`, `.pantalla-segura`, `.nav-segura` y `.accion-superior` en index.css (E3 F1)' },
  { apartado: 3, que: 'La barra de abajo por encima del Home Indicator', donde: '`.nav-segura` (E3 F1) y la regla de las cinco pestañas' },
  { apartado: 10, que: 'Los pasos − / + junto al campo', donde: '`Paso` en el entrenamiento en vivo (F9), sin sustituir al campo' },
  { apartado: 14, que: 'Deslizar entre ejercicios sin pelearse con el scroll', donde: '`touch-action: pan-y` y el umbral horizontal (F9), con Anterior / Siguiente siempre visibles' },
  { apartado: 15, que: '44 × 44 de zona de toque', donde: '`.toque-44` (E3 F1) y el revisor `revisarPantalla()` (EH F42)' },
  { apartado: 18, que: 'Los nombres largos', donde: 'Se parten en dos líneas en la tarjeta del ejercicio en vivo (`leading-tight`), y el nombre entero va en el `aria-label` de cada tarjeta (F34)' },
  { apartado: 21, que: 'Ni un desbordamiento de lado', donde: '`grid-cols-1` (F34), `flex-wrap` (GE F1) y el recorrido, que mide `scrollWidth` a 375 px' },
  { apartado: 30, que: 'El reloj con la pantalla apagada', donde: 'Marcas de tiempo, nunca un contador que dependa del render (E3 F25 y F7)' },
  { apartado: 31, que: 'Volver tras bloquear el móvil', donde: 'La sesión vive en `fitness.sesiones` y se guarda en cada cambio: al volver, «Continuar entrenamiento» (F7)' },
  { apartado: 35, que: 'Reordenar en el constructor', donde: 'Los botones ↑ / ↓ de cada ejercicio (F3): no hay arrastre que sustituir' },
  { apartado: 37, que: 'La vibración', donde: 'Se emite al bus y el motor respeta 📳 de Ajustes (F9): ninguna pantalla vibra por su cuenta' },
  { apartado: 38, que: 'El sonido del descanso', donde: 'El mismo bus, con el interruptor de sonido de Ajustes (F9 y SO)' },
  { apartado: 39, que: 'Listas largas', donde: 'La biblioteca de veinte en veinte (F34) y el historial por páginas (F10)' },
  { apartado: 46, que: 'El movimiento reducido', donde: 'La F37, comprobada en el recorrido con `prefers-reduced-motion`' },
  { apartado: 49, que: 'Los errores sin salir de contexto', donde: 'El aviso de guardado fallido junto a la acción, con «Reintentar» (F37)' },
];

export const NO_EN_FIT38 = [
  { que: 'Miniaturas de verdad para las fotos (apartados 40 y 41)', porque: 'La F26 sube UNA versión, ya reducida a 1600 px (F27 lo declaró). Una segunda, más pequeña, es otra subida y otro camino en Storage: una función nueva. Lo que sí se hace es que cada miniatura se cargue cuando se ve.' },
  { que: 'Cambiar el tamaño de letra de los formularios (C-32)', porque: 'Los campos del entrenamiento en vivo ya van a 16 px y no hacen zoom. Los demás van a 14 px con el `maximum-scale=1` del viewport, que es la C-32: cambiar el aspecto de todos los formularios lo decide Josué.' },
  { que: 'Cerrar una hoja arrastrándola (apartados 13 y 22)', porque: '«Gesto de cierre si existe»: no existe en ninguna hoja de la aplicación (F37 lo dijo). Todas se cierran tocando fuera o con su botón.' },
  { que: 'Bloquear la orientación (apartado 29)', porque: 'Una aplicación web no puede fijarla en iPhone. Lo que se comprueba es que en horizontal no se rompa.' },
  { que: 'Mantener la pantalla encendida mientras entrena', porque: 'El apartado 30 dice lo contrario: «No asumir que el usuario mantendrá la pantalla activa». El reloj va por marcas de tiempo y al volver se recalcula.' },
  { que: 'Dos columnas en iPad (apartado 42)', porque: '«Cuando tenga sentido» y «mantener la jerarquía móvil»: las rejillas que ya lo hacen (`md:grid-cols-2`) lo siguen haciendo; convertir el resto sería rediseñar, que prohíbe el apartado 56.' },
];

export const DECISIONES_FIT38 = [
  { que: '«Última vez» es texto, nunca un valor puesto en la serie', porque: 'Apartado 12, literal: «No introducir automáticamente un dato como realizado. El usuario debe confirmar/modificar».' },
  { que: 'Las hojas miden su tope con `dvh`, y `vh` detrás como respaldo', porque: 'En Safari `vh` es la altura con la barra escondida: una hoja de 88vh se salía por debajo con la barra a la vista. Los dos valores van en CSS, no en un `style` de React, donde la segunda clave borraría a la primera (SF F1).' },
  { que: 'Al abrir un detalle se empieza arriba; al volver, donde estaba', porque: 'Apartado 32. Lo guardado es de la pantalla (un `ref`), nunca de `app_data` (EH F40).' },
];
