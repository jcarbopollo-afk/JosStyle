/* ═══════════════════════════════════════════════════════════════════════════
   FIT F39 — Accesibilidad, estados límite y robustez de Fitness
   ═══════════════════════════════════════════════════════════════════════════

   *"Fitness debe funcionar correctamente no solo con datos perfectos. […] La
   interfaz nunca debe quedar rota."* Y a la vez: *"NO añadir funcionalidades
   grandes. NO cambiar las fórmulas de progreso/rangos. NO cambiar el modelo de
   datos salvo que sea estrictamente necesario"*.

   Así que esta fase no construye pantallas: **mide** las que hay con datos que
   no son perfectos y arregla lo que encuentra. Aquí vive lo que hace falta
   para medir —`textoRoto()`, que busca lo que el apartado 2 prohíbe ver— y la
   declaración de dónde se resuelve cada estado límite. */
import { SIN_RANGO } from './fitness.js';
import { MOTIVOS_SIN_RANGO } from './pantallaRangos.js';
import { HISTORIAL_VACIO, SIN_RESULTADOS } from './historial.js';
import { ESTADO_SIN_RESULTADOS } from './planes.js';
import { ESTADO_VACIO_PLANTILLAS } from './plantillas.js';
import { VACIOS_COLA } from './colaClasificacion.js';
import { ESTADOS_RESUMEN } from './resumenProgreso.js';
import { ESTADOS_FOTOS } from './fotosProgreso.js';
import { SIN_PLAN } from './tuPlan.js';
import { TEXTO_LIMPIAR_FILTROS } from './bibliotecaEjercicios.js';
import { ESTADOS_DETALLE, VACIOS_DETALLE } from './detalleEjercicio.js';
import { OBJETIVOS_VACIO } from './objetivosProgreso.js';

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LO QUE NUNCA SE VE (apartado 2)
   ═══════════════════════════════════════════════════════════════════════════
   *"Nunca mostrar: NaN, undefined, null, [object Object], porcentajes
   imposibles, fechas inválidas"*. Se busca en el HTML que sale de pintar una
   pantalla: en el TEXTO que se lee y en los ESTILOS, donde un `width: NaN%`
   rompe una barra sin que se lea nada raro. */
export const PROHIBIDOS_A_LA_VISTA = [
  { id: 'nan', texto: 'NaN', patron: /\bNaN\b/ },
  { id: 'undefined', texto: 'undefined', patron: /\bundefined\b/ },
  { id: 'null', texto: 'null', patron: /\bnull\b/ },
  { id: 'objeto', texto: '[object Object]', patron: /\[object Object\]/ },
  { id: 'fecha_invalida', texto: 'Invalid Date', patron: /Invalid Date/ },
  { id: 'infinito', texto: 'Infinity', patron: /\bInfinity\b/ },
];

/** El texto que se lee de un trozo de HTML: sin etiquetas, sin estilos ni
 *  scripts y con las entidades convertidas en espacios. */
export function textoVisible(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ');
}

/** Los porcentajes que se leen y no pueden existir: negativos o por encima de
 *  100 (apartado 29: *"no mostrar -120 % ni 145 %"*). ⚠️ Solo para pantallas
 *  donde un porcentaje es una parte de un todo: un zoom al 180 % existe. */
export function porcentajesImposibles(texto) {
  const malos = [];
  for (const m of String(texto || '').matchAll(/(-?\d+(?:[.,]\d+)?)\s?%/g)) {
    const v = Number(m[1].replace(',', '.'));
    if (v < 0 || v > 100) malos.push(m[0].trim());
  }
  return malos;
}

/**
 * Lo que está roto a la vista en un trozo de HTML, con un poco de contexto
 * para poder encontrarlo. Lista vacía = nada roto.
 * `{ porcentajes }`: si también se miran los porcentajes (por defecto, sí).
 */
export function textoRoto(html, { porcentajes = true } = {}) {
  const texto = textoVisible(html);
  const estilos = (String(html || '').match(/style="[^"]*"/g) || []).join(' ');
  const rotos = [];
  PROHIBIDOS_A_LA_VISTA.forEach((p) => {
    const m = texto.match(new RegExp(`.{0,40}${p.patron.source}.{0,40}`));
    if (m) rotos.push(`«${p.texto}» en el texto: …${m[0].trim()}…`);
    if (p.patron.test(estilos)) rotos.push(`«${p.texto}» en un estilo`);
  });
  if (porcentajes) porcentajesImposibles(texto).forEach((x) => rotos.push(`porcentaje imposible: ${x}`));
  return rotos;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LA MATRIZ DE ESTADOS (apartados 56 y 57)
   ═══════════════════════════════════════════════════════════════════════════
   *"Crear una matriz de estados para las pantallas principales: LOADING,
   READY, EMPTY, NO_RESULTS, PARTIAL, ERROR. Aplicarla donde tenga sentido."*

   Cada pantalla del apartado 57 dice, para cada estado, **dónde lo resuelve**:
   un texto que vive en un catálogo (se importa: renombrarlo rompe la
   compilación), un texto escrito en una pantalla (la prueba abre el archivo y
   lo busca), o por qué ese estado **no existe** ahí. READY y PARTIAL los pinta
   `scripts/test-robustez-fitness.jsx` con datos completos y corruptos. */
export const ESTADOS_PANTALLA = ['LOADING', 'READY', 'EMPTY', 'NO_RESULTS', 'PARTIAL', 'ERROR'];

const nombreDe = (lista, id) => (lista.find((e) => e.id === id) || {}).nombre || '';

/* Los que son iguales en todas las pantallas se escriben una vez. */
const CARGA = { donde: 'src/App.jsx', muestra: 'LoadingScreen', que: 'Fitness no carga nada por su cuenta: `app_data` llega entero al entrar, con la pantalla de carga de la aplicación (E3 F14).' };
const LISTO = { donde: 'scripts/test-robustez-fitness.jsx', muestra: 'datos corruptos, tras la puerta de carga', que: 'Se pinta con datos completos y corruptos y no enseña nada roto.' };
const ERROR_AREA = { donde: 'src/components/areaSegura.jsx', muestra: 'No se ha podido cargar', que: 'Un fallo al pintar se queda en su área, con «Reintentar» (F36).' };
const sinBusqueda = (porque) => ({ noAplica: porque });

export const MATRIZ_ESTADOS = [
  { pantalla: 'Rangos', estados: {
    LOADING: CARGA, READY: LISTO, ERROR: ERROR_AREA,
    EMPTY: { texto: SIN_RANGO.nombre, que: SIN_RANGO.que },
    PARTIAL: { texto: MOTIVOS_SIN_RANGO.poca_cobertura.que, que: 'Apartado 5: sin cobertura no se inventa un rango global.' },
    NO_RESULTS: sinBusqueda('Rangos no tiene buscador: la escala son los diez rangos, siempre.'),
  } },
  { pantalla: 'Progreso', estados: {
    LOADING: CARGA, READY: LISTO, ERROR: { texto: nombreDe(ESTADOS_RESUMEN, 'error_general') },
    EMPTY: { texto: nombreDe(ESTADOS_RESUMEN, 'vacio') },
    PARTIAL: { texto: nombreDe(ESTADOS_RESUMEN, 'error_parcial'), que: 'Una fuente que falla no se lleva el resto (F28).' },
    NO_RESULTS: { donde: 'src/views/ProgresoView.jsx', muestra: 'No hay ejercicios que coincidan' },
  } },
  { pantalla: 'Fotos', estados: {
    LOADING: { donde: 'src/components/fotosProgreso.jsx', muestra: 'esqueleto', que: 'Mientras se firma cada foto, su hueco es un esqueleto.' },
    READY: LISTO, ERROR: { donde: 'src/components/fotosProgreso.jsx', muestra: 'marcarFallida', que: 'Una foto que no carga lo dice, y SOLO esa (F27).' },
    EMPTY: { texto: (ESTADOS_FOTOS.find((e) => e.id === 'vacio') || {}).que },
    PARTIAL: { texto: (ESTADOS_FOTOS.find((e) => e.id === 'una') || {}).que },
    NO_RESULTS: sinBusqueda('La galería no se filtra: se recorre por días.'),
  } },
  { pantalla: 'Objetivos', estados: {
    LOADING: CARGA, READY: LISTO, ERROR: ERROR_AREA,
    EMPTY: { texto: OBJETIVOS_VACIO.titulo },
    PARTIAL: { donde: 'src/lib/objetivosProgreso.js', muestra: 'Sin datos todavía', que: 'Un objetivo sin registros no es un 0 % (F14, apartado 9 de esta fase).' },
    NO_RESULTS: { donde: 'src/views/ProgresoView.jsx', muestra: 'No hay objetivos con este filtro' },
  } },
  { pantalla: 'Entrenamiento', estados: {
    LOADING: CARGA, READY: LISTO, ERROR: ERROR_AREA,
    EMPTY: { texto: SIN_PLAN.texto },
    PARTIAL: { donde: 'src/lib/entrenamiento.js', muestra: 'Hay un entrenamiento sin terminar', que: 'Apartado 19.' },
    NO_RESULTS: sinBusqueda('La portada de Entrenamiento no busca: busca cada lista que abre.'),
  } },
  { pantalla: 'Tu Plan', estados: {
    LOADING: CARGA, READY: LISTO, ERROR: ERROR_AREA,
    EMPTY: { texto: SIN_PLAN.titulo },
    PARTIAL: { donde: 'src/views/TuPlanView.jsx', muestra: 'Todavía no se puede repartir la semana', que: 'Sin fecha de activación no se dibuja semana (F6).' },
    NO_RESULTS: sinBusqueda('Tu Plan es una semana, no una lista que se filtre.'),
  } },
  { pantalla: 'Planes', estados: {
    LOADING: CARGA, READY: LISTO, ERROR: ERROR_AREA,
    EMPTY: sinBusqueda('La biblioteca de planes es del código (F5): nunca está vacía.'),
    PARTIAL: sinBusqueda('Un plan del catálogo está entero o no está.'),
    NO_RESULTS: { texto: ESTADO_SIN_RESULTADOS.titulo },
  } },
  { pantalla: 'Plantillas', estados: {
    LOADING: CARGA, READY: LISTO, ERROR: ERROR_AREA,
    EMPTY: { texto: ESTADO_VACIO_PLANTILLAS.titulo },
    PARTIAL: { donde: 'src/views/PlantillasView.jsx', muestra: 'Todavía sin ejercicios', que: 'Una plantilla sin ejercicios se dice, no se pinta como un cero.' },
    NO_RESULTS: { donde: 'src/views/PlantillasView.jsx', muestra: 'Buscar una plantilla', que: 'Con el buscador puesto se dice que no hay ninguna que coincida.' },
  } },
  { pantalla: 'Constructor', estados: {
    LOADING: CARGA, READY: LISTO, ERROR: ERROR_AREA,
    EMPTY: { donde: 'src/views/ConstructorView.jsx', muestra: 'Todavía no hay ningún ejercicio' },
    PARTIAL: { donde: 'src/lib/constructor.js', muestra: 'ya no está en el catálogo', que: 'Una línea de un ejercicio que ya no existe se dice al guardar (F3).' },
    NO_RESULTS: sinBusqueda('El constructor elige desde la biblioteca, que tiene su «sin resultados».'),
  } },
  { pantalla: 'Entrenamiento en vivo', estados: {
    LOADING: CARGA, READY: LISTO, ERROR: ERROR_AREA,
    EMPTY: { donde: 'src/views/EntrenamientoVivoView.jsx', muestra: 'No hay ningún entrenamiento en curso' },
    PARTIAL: { donde: 'src/lib/finalizacion.js', muestra: 'No has completado ninguna serie', que: 'Apartado 14.' },
    NO_RESULTS: sinBusqueda('Una sesión no se filtra.'),
  } },
  { pantalla: 'Historial', estados: {
    LOADING: CARGA, READY: LISTO, ERROR: ERROR_AREA,
    EMPTY: { texto: HISTORIAL_VACIO.titulo },
    PARTIAL: { donde: 'src/lib/historial.js', muestra: 'seriesTexto', que: 'Una sesión parcial dice «16/20 series» (apartado 12).' },
    NO_RESULTS: { texto: SIN_RESULTADOS.titulo },
  } },
  { pantalla: 'Biblioteca de ejercicios', estados: {
    LOADING: CARGA, READY: LISTO, ERROR: ERROR_AREA,
    EMPTY: sinBusqueda('El catálogo es del código: nunca está vacío.'),
    PARTIAL: { donde: 'src/components/estadosFitness.jsx', muestra: 'MissingImage', que: 'Una imagen que no carga vuelve al icono de su grupo.' },
    NO_RESULTS: { donde: 'src/views/EjerciciosView.jsx', muestra: 'Ningún ejercicio encaja', que: `Con «${TEXTO_LIMPIAR_FILTROS}» (apartado 31).` },
  } },
  { pantalla: 'Detalle de un ejercicio', estados: {
    LOADING: { texto: nombreDe(ESTADOS_DETALLE, 'cargando') }, READY: LISTO,
    ERROR: { texto: nombreDe(ESTADOS_DETALLE, 'error') },
    EMPTY: { texto: VACIOS_DETALLE.sin_datos },
    PARTIAL: { texto: VACIOS_DETALLE.primer_registro, que: 'Apartado 8: «Primer registro», nunca «estable».' },
    NO_RESULTS: sinBusqueda('Un ejercicio no se filtra; su periodo sí, y dice «No hay registros en este periodo».'),
  } },
  { pantalla: 'Clasificación', estados: {
    LOADING: CARGA, READY: LISTO, ERROR: ERROR_AREA,
    EMPTY: { texto: VACIOS_COLA.sinCandidatos ? VACIOS_COLA.sinCandidatos.titulo : Object.values(VACIOS_COLA).map((v) => v.titulo).find((t) => /Todavía/.test(t)) },
    PARTIAL: { texto: Object.values(VACIOS_COLA).map((v) => v.titulo).find((t) => /saltado/.test(t)) },
    NO_RESULTS: sinBusqueda('La cola no se busca: se ordena sola (F24).'),
  } },
  { pantalla: 'Detalle muscular de un rango', estados: {
    LOADING: CARGA, READY: LISTO, ERROR: ERROR_AREA,
    EMPTY: { texto: SIN_RANGO.nombre },
    PARTIAL: { donde: 'src/lib/detalleMuscular.js', muestra: 'ejercicios con datos', que: 'El «4 de 18 con datos» (F18): los que no ha entrenado se enseñan, no se esconden.' },
    NO_RESULTS: { donde: 'src/views/DetalleMuscularView.jsx', muestra: 'Sin datos', que: 'El filtro «Sin datos» de la F18.' },
  } },
];

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LOS RESPALDOS (apartado 52)
   ═══════════════════════════════════════════════════════════════════════════
   *"No duplicar mensajes en cada pantalla."* Cinco de los siete ya existían. */
export const FALLBACKS_FITNESS = [
  { id: 'MissingImage', donde: 'src/components/estadosFitness.jsx', muestra: 'export function MissingImage', nuevo: true },
  { id: 'MissingData', donde: 'src/components/estadosFitness.jsx', muestra: 'export function MissingData', nuevo: true },
  { id: 'ErrorState', donde: 'src/components/areaSegura.jsx', muestra: 'No se ha podido cargar', nuevo: false },
  { id: 'EmptyState', donde: 'src/components/ui.jsx', muestra: 'export function EmptyHint', nuevo: false },
  { id: 'LoadingState', donde: 'src/components/ui.jsx', muestra: 'export function Esqueleto', nuevo: false },
  { id: 'PersistenceError', donde: 'src/lib/accionesHoyAgenda.js', muestra: 'guardado_fallido', nuevo: false },
  { id: 'NotAvailable', donde: 'src/lib/helpers.js', muestra: 'FECHA_NO_DISPONIBLE', nuevo: false },
];

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LO QUE YA ESTABA (apartados 3-18, 20, 23, 28, 29, 34, 41, 45, 46 y 53)
   ═══════════════════════════════════════════════════════════════════════════ */
export const YA_RESUELTO_F39 = [
  { apartado: 4, que: '0 sesiones no es tendencia negativa', donde: 'F11/F13: sin datos es «sin_datos», nunca «descenso»' },
  { apartado: 5, que: 'Rango sin cobertura', donde: 'F15/F16: `MOTIVOS_SIN_RANGO.poca_cobertura`' },
  { apartado: 6, que: 'Rango provisional', donde: 'F17/F23: «Estimación inicial»' },
  { apartado: 7, que: 'Confianza en tres niveles', donde: 'F15: `CONFIANZA` (baja, media, alta), sin un cuarto' },
  { apartado: 8, que: '«Primer registro»', donde: 'F11/F29: `primer_registro`' },
  { apartado: 9, que: 'Objetivo sin datos', donde: 'F14: `porcentaje: null`, nunca 0' },
  { apartado: 10, que: 'Objetivo vencido', donde: 'F30: `FECHA_SUPERADA`, sin estado «fallido»' },
  { apartado: 11, que: 'Objetivo completado con su resultado', donde: 'F30/C-37: se deriva de la sesión que lo superó' },
  { apartado: 12, que: 'Sesión parcial', donde: 'F10: «16/20 series»' },
  { apartado: 13, que: 'Sesión descartada', donde: 'F8/F10: fuera del historial, la actividad, el progreso y los rangos' },
  { apartado: 14, que: 'Sesión casi vacía', donde: 'F8: `AVISO_SIN_SERIES` con «Seguir entrenando» y «Guardar igualmente»' },
  { apartado: 15, que: 'Doble guardado', donde: 'F8: idempotente por la forma del dato, y el botón no repite mientras guarda' },
  { apartado: 16, que: 'Error de guardado', donde: 'F37: `guardado_fallido`, con «Reintentar» y sin celebrar' },
  { apartado: 18, que: 'Continuar entrenamiento', donde: 'F7: la tarjeta de recuperación' },
  { apartado: 20, que: 'Ejercicio archivado', donde: 'F35: `archivado: true`, fuera de la búsqueda y dentro del historial' },
  { apartado: 23, que: 'Tutorial ausente', donde: 'F34: «Todavía no hay vídeo de este ejercicio», sin reproductor muerto' },
  { apartado: 28, que: 'Peso corporal × repeticiones no es volumen', donde: 'F8/F11: el volumen solo sale de series con peso Y repeticiones' },
  { apartado: 29, que: 'Porcentajes musculares', donde: 'F2: suman 100, y el normalizador descarta lo que no existe' },
  { apartado: 34, que: 'Nunca solo color', donde: 'EH F42: `etiquetaDeEstado()`, y ○/✓ en las series (F9)' },
  { apartado: 41, que: 'Cada campo con su nombre', donde: 'Todos los campos de Fitness llevan `aria-label` o `<label>`: lo comprueba la suite' },
  { apartado: 45, que: 'Movimiento reducido', donde: 'F37: `index.css`, «Reducir movimiento» del sistema y de Ajustes' },
  { apartado: 46, que: 'Zonas de toque', donde: 'EH F42: `revisarPantalla()`, y la F38 lo pasa por Fitness' },
  { apartado: 53, que: 'Límites de error', donde: 'F36: `AreaSegura`, uno por área y otro para Fitness entero' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LO QUE NO SE HACE, DICHO (apartados 35, 47, 50, 62 y 64)
   ═══════════════════════════════════════════════════════════════════════════ */
export const NO_EN_FIT39 = [
  { que: 'Medir el contraste con una herramienta (apartado 35)', porque: 'Los colores salen de `tokens.js` y del tema que elige Josué, y el texto sobre el acento lo calcula `bestReadableText()` (EH F49). Medir el contraste de cada combinación de tema es una auditoría de la aplicación entera, no de Fitness: queda para cuando él pueda mirarlo en su iPhone (R1).' },
  { que: 'Confirmar al salir del formulario de un objetivo o del constructor (apartado 50)', porque: 'El constructor guarda un borrador en el dispositivo y lo ofrece al volver (F3); la clasificación guarda cada respuesta al contestarla y pregunta al salir (F17); la sesión activa no se pierde al salir (F7). Un aviso delante de algo que no se pierde enseña a no leer los avisos (EH F61).' },
  { que: '«Completar serie 2 de 3» (apartado 40)', porque: 'Cada serie ya se llama «Marcar la serie 2 como hecha» y lleva `aria-pressed`: el nombre accesible existe, que es lo que pide el apartado. El ejemplo del enunciado es una forma de decirlo, no un texto obligado.' },
  { que: 'Guardar la posición de un formulario al girar el iPhone (apartado 47)', porque: 'Girar no desmonta nada: el estado de React sigue ahí y la sesión vive en `app_data`. El recorrido lo comprueba girando en mitad de un entrenamiento.' },
  { que: 'IA, predicciones, estadísticas nuevas o gamificación (apartado 62)', porque: 'Literal del enunciado: esta fase arregla lo que hay, no añade funciones. Lo único que nace son dos respaldos y el diálogo accesible.' },
];

export const DECISIONES_FIT39 = [
  { que: 'Un ejercicio que ya no existe se llama por lo que se LEE de su id', porque: 'Apartados 21 y 55. No hay nombre histórico (C-36), y el id pelado es un id técnico: «dominada-prona» se lee «Dominada prona»; uno propio borrado, «Ejercicio no disponible».' },
  { que: 'Una sesión abierta más de seis horas no tiene duración', porque: 'Apartados 19 y 26. Las series no guardan cuándo se marcaron, así que no se sabe cuándo paró: se ofrece terminarla y la duración es «—».' },
  { que: 'El anillo de foco, solo en Fitness y sus hojas', porque: 'Apartado 37. Con el resto de formularios no se cambia el aspecto de nada que esta fase no toca (la C-32 es de Josué).' },
  { que: 'La regla de «nada roto a la vista» se aplica a TODA la aplicación', porque: 'Apartado 2. Cuesta una línea en el banco de renderizado y cazó tres pantallas fuera de Fitness.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LAS AUDITORÍAS SOBRE LOS ARCHIVOS (apartados 22, 36-39)
   ═══════════════════════════════════════════════════════════════════════════
   Reciben el código de un archivo (la prueba lo lee de disco), así que se
   pueden alimentar con un ejemplo malo y ver que se ponen rojas. */

/* Quita los comentarios conservando los saltos de línea: si no, el número de
   línea que se devuelve apunta a otro sitio (F38). */
const sinComentarios = (src) => String(src || '')
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`])\/\/[^\n]*/g, (m, a) => a + ' '.repeat(m.length - a.length));

/** Las etiquetas JSX `<Nombre …>` enteras, respetando llaves y comillas: un
 *  `=>` dentro de un `onChange` no cierra la etiqueta. */
export function etiquetasJsx(src, nombre) {
  const limpio = sinComentarios(src);
  const res = [];
  const re = new RegExp(`<${nombre}\\b`, 'g');
  let m;
  while ((m = re.exec(limpio))) {
    let i = m.index + m[0].length;
    let llaves = 0;
    let comilla = null;
    for (; i < limpio.length; i++) {
      const c = limpio[i];
      if (comilla) { if (c === comilla && limpio[i - 1] !== '\\') comilla = null; continue; }
      if (c === '"' || c === "'" || c === '`') { comilla = c; continue; }
      if (c === '{') llaves++;
      else if (c === '}') llaves--;
      else if (c === '>' && llaves === 0) break;
    }
    res.push({ tag: limpio.slice(m.index, i + 1), linea: limpio.slice(0, m.index).split('\n').length, inicio: m.index });
  }
  return res;
}

/** Apartados 36-38 — un velo `fixed inset-0` en un archivo que no usa el
 *  diálogo accesible, o una hoja sin `role="dialog"` y `aria-modal`. */
export function dialogosSinTeclado(src) {
  const limpio = sinComentarios(src);
  const velos = etiquetasJsx(src, 'div').filter(({ tag }) => /className=(?:"|\{`)fixed inset-0\b/.test(tag));
  if (!velos.length) return [];
  const usaHook = /useDialogoAccesible\(/.test(limpio);
  return velos.flatMap(({ tag, linea }) => {
    const falta = [];
    if (!usaHook) falta.push('useDialogoAccesible');
    if (!/role="dialog"/.test(tag)) falta.push('role="dialog"');
    if (!/aria-modal="true"/.test(tag)) falta.push('aria-modal');
    if (!/aria-label=/.test(tag)) falta.push('aria-label');
    return falta.length ? [{ linea, falta }] : [];
  });
}

/** Apartado 22 — una `<img>` sin respaldo si no carga: saldría el icono de
 *  imagen rota del navegador. `MissingImage` lo lleva de serie. */
export function imagenesSinRespaldo(src) {
  return etiquetasJsx(src, 'img').filter(({ tag }) => !/onError=/.test(tag)).map(({ linea }) => linea);
}

/** Apartado 41 — un campo sin nombre accesible: ni `aria-label`, ni dentro de
 *  un `<label>` o un `<Field>`. El `placeholder` no cuenta. */
export function camposSinNombre(src) {
  const limpio = sinComentarios(src);
  return ['input', 'TextInput', 'textarea', 'Textarea', 'select']
    .flatMap((n) => etiquetasJsx(src, n))
    .filter(({ tag }) => !/aria-label(?:ledby)?=/.test(tag) && !/type="(?:file|hidden)"/.test(tag))
    .filter(({ inicio }) => {
      const antes = limpio.slice(0, inicio);
      const dentro = (abre, cierra) => antes.lastIndexOf(abre) > antes.lastIndexOf(cierra);
      return !dentro('<label', '</label>') && !dentro('<Field', '</Field>');
    })
    .map(({ linea }) => linea);
}

export const CASILLAS_ROBUSTEZ = [
  { id: 'dialogos_con_teclado', apartado: '36-38', que: 'Cada hoja mete el foco dentro, cierra con Escape, lo devuelve y se anuncia como diálogo' },
  { id: 'imagenes_con_respaldo', apartado: 22, que: 'Ninguna imagen se queda rota' },
  { id: 'campos_con_nombre', apartado: 41, que: 'Cada campo tiene nombre accesible' },
];

export function auditarRobustez({ archivos = {} } = {}) {
  const por = (fn) => Object.entries(archivos)
    .flatMap(([ruta, src]) => [].concat(fn(src)).map((x) => `${ruta.split('/').pop()}:${typeof x === 'object' ? `${x.linea} (${x.falta.join(', ')})` : x}`));
  const dialogos = por(dialogosSinTeclado);
  const imagenes = por(imagenesSinRespaldo);
  const campos = por(camposSinNombre);
  const casillas = [
    { id: 'dialogos_con_teclado', ok: dialogos.length === 0, dato: dialogos.join('; ') || 'todas' },
    { id: 'imagenes_con_respaldo', ok: imagenes.length === 0, dato: imagenes.join('; ') || 'todas' },
    { id: 'campos_con_nombre', ok: campos.length === 0, dato: campos.join('; ') || 'todos' },
  ];
  return { casillas, ok: casillas.every((c) => c.ok) };
}
