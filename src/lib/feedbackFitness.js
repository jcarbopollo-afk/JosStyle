import { ANIMACIONES_HC } from './pulidoHC';
import { AVISOS_ACCION, avisoDe } from './accionesHoyAgenda';
import { rangoEfectivoDeEjercicio, rangoGlobalEfectivo } from './motorRangos';
import { ejerciciosDeSesion } from './entrenamiento';
import { ejercicioPorId, nombreCompleto } from './ejercicios';
import { nivelRango } from './fitness';

/* Entrega 4 · Fase 37/45 — «Microinteracciones y feedback premium de Fitness».
   ═══════════════════════════════════════════════════════════════════════════

   *"Esta fase NO debe añadir funcionalidades nuevas importantes. NO cambiar la
   lógica de datos."* Y casi todo lo que pide **ya existía**, así que lo que
   hay aquí es poco a propósito:

   · 🔓 **La curva ya existía** (`--ease-premium`, Fase N2), y también **el
     movimiento reducido**: las dos reglas globales de `index.css` —la del
     sistema y la de Ajustes— llevan cualquier animación a 0,01 ms (apartados
     3 y 40). Una animación de Fitness que viva en `index.css` las cumple sola.
   · 🔓 **El aviso reutilizable ya existía**: `AvisoAccion` (E3 F9), con su
     catálogo `AVISOS_ACCION`. La F37 le añade los de Fitness y un estilo de
     error (apartados 24 y 25), en vez de escribir un segundo sistema.
   · 🔓 **La escalera de escalas al tocar es de `ui.jsx`** (EH F50) y es
     deliberada; una tarjeta de Fitness usa el escalón de las filas (0,98).
   · 🔓 **«Pregunta 2 de 7»** es de la F17, **«En lugar de X · solo en este
     entrenamiento»** de la F33, y **el doble toque** lo resuelve la forma del
     dato: guardar un entrenamiento es idempotente (F8), guardar una plantilla
     sustituye por id (F3) y crear un objetivo igual avisa del duplicado (F30).

   Lo nuevo: once animaciones declaradas en `ANIMACIONES_HC` con su clase de
   duración, la auditoría que las mide contra `index.css` y contra las
   pantallas, el aviso de subir de rango (apartado 14) y el guardado que por
   fin **lee si ha ido bien** (apartados 18, 25 y 28). */

const lista = (x) => (Array.isArray(x) ? x : []);

/* ═══════════════════════════════════════════════════════════════════════════
   1 · DURACIONES Y CURVA (apartados 2 y 3)
   ═══════════════════════════════════════════════════════════════════════════ */

export const DURACIONES_FIT = {
  micro: { nombre: 'Microinteracción', min: 120, max: 220 },
  pantalla: { nombre: 'Transición de pantalla', min: 180, max: 300 },
  tarjeta: { nombre: 'Expansión de tarjeta', min: 200, max: 300 },
};

/** La curva de toda la aplicación desde la Fase N2. Ni una propia. */
export const CURVA_FIT = 'var(--ease-premium)';

/** El escalón de las filas de la escalera de `ui.jsx` (EH F50), que cae dentro
 *  del 0,98-0,99 del apartado 5. */
export const ESCALA_PULSAR = 0.98;
export const RANGO_ESCALA_PULSAR = { min: 0.98, max: 0.99 };

export const animacionesFitness = () => ANIMACIONES_HC.filter((a) => a.fitness === true);

/** ¿Cae la duración de una animación dentro del rango de su clase? */
export function dentroDeSuRango(a) {
  const r = a && DURACIONES_FIT[a.tipo];
  return !!r && a.ms >= r.min && a.ms <= r.max;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LEER index.css (para que el catálogo no mienta)
   ═══════════════════════════════════════════════════════════════════════════ */

const sinComentariosCss = (css) => String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');

/** Los bloques cuyo selector contiene `.clase` (sin `:active` ni variantes). */
export function reglasDeClase(css, clase) {
  const limpio = sinComentariosCss(css);
  const re = new RegExp(`([^{}]*\\.${clase.replace(/[-]/g, '\\-')}(?![\\w-])[^{}]*)\\{([^}]*)\\}`, 'g');
  const salida = [];
  for (const m of limpio.matchAll(re)) salida.push({ selector: m[1].trim(), cuerpo: m[2] });
  return salida;
}

/** La duración más larga que `index.css` le da a una clase, en ms, o `null`. */
export function duracionEnCss(css, clase) {
  const ms = reglasDeClase(css, clase)
    .filter((r) => !/:active|:hover|:focus/.test(r.selector))
    .flatMap((r) => [...r.cuerpo.matchAll(/(?:animation|transition)\s*:[^;]*/g)].map((d) => d[0]))
    .flatMap((d) => [...d.matchAll(/(\d+(?:\.\d+)?)ms/g)].map((x) => Number(x[1])));
  return ms.length ? Math.max(...ms) : null;
}

/** ¿Usa la clase la curva de la aplicación en todas sus animaciones? */
export function usaLaCurva(css, clase) {
  const decl = reglasDeClase(css, clase)
    .flatMap((r) => [...r.cuerpo.matchAll(/(?:animation|transition)\s*:[^;]*/g)].map((d) => d[0]));
  return decl.length > 0 && decl.every((d) => d.includes(CURVA_FIT));
}

/** 🚨 `both` o `forwards` dejan puesto el `transform` del último fotograma, y
 *  eso convierte el elemento en el bloque contenedor de sus hijos `fixed` (la
 *  nota de `.module-enter`). Las de Fitness terminan con `backwards`. */
export function dejaRastro(css, clase) {
  return reglasDeClase(css, clase)
    .some((r) => /animation\s*:[^;]*\b(both|forwards)\b/.test(r.cuerpo));
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LO QUE NO SE PERMITE EN UNA PANTALLA DE FITNESS (apartados 46 y 47)
   ═══════════════════════════════════════════════════════════════════════════ */

export const EXCESOS = [
  { id: 'duracion_larga', que: 'Una transición de medio segundo o más', patron: /\bduration-(?:[5-9]\d{2}|1\d{3})\b/ },
  { id: 'transicion_todo', que: '`transition-all`: anima también lo que no debe moverse', patron: /\btransition-all\b/ },
  { id: 'movimiento_continuo', que: 'Una animación que no para (rebote, latido, giro)', patron: /\banimate-(?:bounce|ping|pulse|spin)\b/ },
  { id: 'confeti', que: 'Confeti o celebración arcade', patron: /confet(?:i|ti)/i },
];

/** Los excesos de una pantalla, con su línea. Se barre el código SIN los
 *  comentarios: un comentario que diga «sin confeti» no es confeti. */
export function excesosEn(codigo) {
  const lineas = String(codigo || '')
    .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((l) => l.replace(/\/\/.*$/, ''));
  const salida = [];
  lineas.forEach((l, i) => {
    EXCESOS.forEach((e) => { if (e.patron.test(l)) salida.push({ exceso: e.id, linea: i + 1 }); });
  });
  return salida;
}

/** Las pantallas y piezas de Fitness que la auditoría recorre. */
export const ARCHIVOS_FITNESS = [
  'src/views/FitnessView.jsx', 'src/views/EntrenamientoVivoView.jsx', 'src/views/FinalizacionView.jsx',
  'src/views/HistorialView.jsx', 'src/views/ProgresoView.jsx', 'src/views/RangosView.jsx',
  'src/views/DetalleMuscularView.jsx', 'src/views/EjerciciosView.jsx', 'src/views/ConstructorView.jsx',
  'src/views/PlantillasView.jsx', 'src/views/BibliotecaPlanesView.jsx', 'src/views/TuPlanView.jsx',
  'src/views/ClasificacionView.jsx', 'src/components/rangos.jsx', 'src/components/sustitucion.jsx',
  'src/components/objetivosFitness.jsx', 'src/components/fotosProgreso.jsx', 'src/components/comparadorFotos.jsx',
  'src/components/historialRango.jsx', 'src/components/bibliotecaEjercicios.jsx', 'src/components/detalleEjercicio.jsx',
  'src/components/resumenProgreso.jsx', 'src/components/siguienteRango.jsx', 'src/components/explicacionRango.jsx',
  'src/components/contribucionMuscular.jsx', 'src/components/resumenRangos.jsx', 'src/components/areaSegura.jsx',
  /* 🐛 FIT F39 — tres componentes de Fitness se habían quedado fuera de esta
     lista, así que las auditorías de la F37 y la F38 no los miraban nunca:
     la actividad (F31), la semana planificada (F32) y la cola de
     clasificación (F24). Y los dos respaldos de la F39. */
  'src/components/actividadEntrenamiento.jsx', 'src/components/planificacionSemanal.jsx',
  'src/components/colaClasificacion.jsx', 'src/components/estadosFitness.jsx',
  /* FIT F42 — el botón de cerrar que comparten todas las hojas. */
  'src/components/piezasFitness.jsx',
];

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LA AUDITORÍA (apartados 40, 46, 47 y 53)
   ═══════════════════════════════════════════════════════════════════════════
   Recibe el CSS y el código de las pantallas —la prueba los lee de disco—, así
   que se puede alimentar con un ejemplo malo y ver que se pone roja. */
export function auditarMovimiento({ css = '', archivos = {} } = {}) {
  const fit = animacionesFitness();
  const todas = ANIMACIONES_HC.filter((a) => !a.repetida);
  const conCss = todas.filter((a) => duracionEnCss(css, a.clase) !== null);
  const desfasadas = conCss.filter((a) => duracionEnCss(css, a.clase) !== a.ms).map((a) => `${a.clase}: ${a.ms} declarados, ${duracionEnCss(css, a.clase)} en el CSS`);
  const fueraDeRango = fit.filter((a) => !dentroDeSuRango(a)).map((a) => a.clase);
  const sinCurva = fit.filter((a) => !usaLaCurva(css, a.clase)).map((a) => a.clase);
  const conRastro = fit.filter((a) => dejaRastro(css, a.clase)).map((a) => a.clase);
  const codigo = Object.values(archivos).join('\n');
  const sinUso = fit.filter((a) => !new RegExp(`\\b${a.clase}\\b`).test(codigo)).map((a) => a.clase);
  const excesos = Object.entries(archivos)
    .flatMap(([ruta, src]) => excesosEn(src).map((e) => `${ruta.split('/').pop()}:${e.linea} ${e.exceso}`));
  const limpio = sinComentariosCss(css);
  const reducido = /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?animation-duration:\s*0\.01ms/.test(limpio)
    && /data-reducir-movimiento='true'\][\s\S]*?transition-duration:\s*0\.01ms/.test(limpio);
  const casillas = [
    { id: 'duraciones_ciertas', ok: desfasadas.length === 0, dato: desfasadas.join('; ') || `${conCss.length} medidas` },
    { id: 'rangos_del_apartado_2', ok: fit.length > 0 && fueraDeRango.length === 0, dato: fueraDeRango.join(', ') || `${fit.length} en su rango` },
    { id: 'una_sola_curva', ok: sinCurva.length === 0, dato: sinCurva.join(', ') || 'todas con --ease-premium' },
    { id: 'sin_rastro_de_transform', ok: conRastro.length === 0, dato: conRastro.join(', ') || 'todas con backwards' },
    { id: 'todas_se_usan', ok: sinUso.length === 0, dato: sinUso.join(', ') || 'ninguna declarada sin usar' },
    { id: 'sin_excesos', ok: excesos.length === 0, dato: excesos.slice(0, 8).join('; ') || 'ninguno' },
    { id: 'movimiento_reducido', ok: reducido, dato: reducido ? 'sistema y Ajustes' : 'falta una de las dos reglas' },
  ];
  return { casillas, ok: casillas.every((c) => c.ok) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LOS AVISOS DE FITNESS (apartados 24 y 25)
   ═══════════════════════════════════════════════════════════════════════════
   Viven en `AVISOS_ACCION` (E3 F9), el catálogo del aviso que ya existía. Aquí
   solo se dice cuáles son de Fitness y dónde salen. */
export const AVISOS_FITNESS = [
  { id: 'plan_activado', donde: 'Al usar un plan de la biblioteca (apartado 36)' },
  { id: 'cambios_guardados', donde: 'Al guardar un entrenamiento en el constructor' },
  { id: 'plantilla_duplicada', donde: 'Al duplicar una plantilla' },
  { id: 'guardado_fallido', donde: 'Cuando un guardado de Fitness no llega a tu cuenta (apartado 25)' },
  { id: 'guardado_sin_espacio', donde: 'Cuando no llega porque no queda espacio (FIT F41, apartado 34)' },
];

export const avisoFitness = (id) => (AVISOS_FITNESS.some((a) => a.id === id) ? avisoDe(id) : null);
export const avisosFitnessEnCatalogo = () => AVISOS_FITNESS.every((a) => !!AVISOS_ACCION[a.id]);

/** El resultado de un guardado, venga como venga: `saveData` devuelve
 *  `{ ok, error }` (EH F52), y una llamada sin promesa se da por buena porque no
 *  hay nada que leer — lo contrario sería inventarse un fallo. */
export function resultadoDeGuardado(r) {
  if (r && typeof r === 'object' && r.ok === false) return { ok: false, error: r.error || null };
  return { ok: true, error: null };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · SUBIR DE RANGO (apartados 14 y 41)
   ═══════════════════════════════════════════════════════════════════════════
   *"Si después de una sesión el usuario sube de rango: mostrar un feedback
   especial pero elegante."* 🚨 **No se calcula nada nuevo**: es el motor de la
   F19 preguntado dos veces —sin esta sesión y con ella—. Solo cuenta una SUBIDA
   de verdad (el rango antes existía y ahora es mayor): el primer rango de un
   ejercicio no se celebra, porque saldría en cada primer entrenamiento. Y un
   cambio de puntuación dentro del mismo rango no es subir (F22, apartado 7). */
export function subidasDeRango(fitness, sesion, { propios = [], perfil = null } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  if (!sesion || !sesion.id || sesion.estado !== 'completada') return { ejercicios: [], global: null, hay: false };
  const sesiones = lista(f.sesiones);
  const sin = { ...f, sesiones: sesiones.filter((s) => s && s.id !== sesion.id) };
  const con = sesiones.some((s) => s && s.id === sesion.id) ? f : { ...f, sesiones: [...sesiones, sesion] };
  const ids = [...new Set(ejerciciosDeSesion(sesion).map((e) => e && e.exerciseId).filter(Boolean))];
  const ejercicios = ids.map((id) => {
    const antes = rangoEfectivoDeEjercicio(sin, id, { propios, perfil });
    const despues = rangoEfectivoDeEjercicio(con, id, { propios, perfil });
    if (antes.sinRango || despues.sinRango || !(despues.rango > antes.rango)) return null;
    const ej = ejercicioPorId(id, propios);
    return {
      exerciseId: id,
      nombre: ej ? nombreCompleto(ej) : id,
      de: antes.rango,
      a: despues.rango,
      texto: `de ${nivelRango(antes.rango).nombre} a ${nivelRango(despues.rango).nombre}`,
    };
  }).filter(Boolean);
  const gA = rangoGlobalEfectivo(sin, { propios, perfil });
  const gD = rangoGlobalEfectivo(con, { propios, perfil });
  const global = !gA.sinRango && !gD.sinRango && gD.rango > gA.rango
    ? { de: gA.rango, a: gD.rango, texto: `de ${nivelRango(gA.rango).nombre} a ${nivelRango(gD.rango).nombre}` }
    : null;
  return { ejercicios, global, hay: ejercicios.length > 0 || !!global };
}

/** Apartados 18, 25 y 28 — lo que dice la pantalla de éxito si el guardado
 *  no llega a la cuenta. ⚠️ No promete que esté «guardado en el teléfono»:
 *  `setFitness` no escribe en ningún sitio que sobreviva a cerrar la
 *  aplicación, y decirlo sería inventarse una copia local que no existe. */
export const TEXTOS_GUARDADO = {
  fallo: 'No se ha podido guardar en tu cuenta',
  detalle: 'El entrenamiento sigue en esta pantalla. Vuelve a intentarlo antes de cerrar la aplicación.',
  reintentar: 'Reintentar',
  reintentando: 'Guardando…',
  /* FIT F41, apartado 34 — si lo que falta es espacio, se dice eso. */
  sinEspacio: AVISOS_ACCION.guardado_sin_espacio.texto,
};

export const TEXTOS_SUBIDA = {
  titulo: 'Has subido de rango',
  global: 'Tu rango general',
};

/* ═══════════════════════════════════════════════════════════════════════════
   7 · LO QUE YA EXISTÍA, LO QUE NO SE HACE Y LO DECIDIDO
   ═══════════════════════════════════════════════════════════════════════════ */

export const YA_EXISTIA = [
  { apartado: 3, que: 'La curva de la aplicación', donde: '`--ease-premium` en index.css (Fase N2)' },
  { apartado: 5, que: 'La escala al tocar', donde: 'La escalera de ui.jsx (EH F50)' },
  { apartado: 24, que: 'El aviso reutilizable', donde: '`AvisoAccion` + `AVISOS_ACCION` (E3 F9)' },
  { apartado: 26, que: 'El esqueleto de carga', donde: '`Esqueleto` y `LoadingScreen` (E3 F14)' },
  { apartado: 29, que: 'El doble toque', donde: 'Idempotencia del dato: F8 (guardar), F3 (plantilla por id) y F30 (objetivo duplicado)' },
  { apartado: 37, que: 'Ejercicio A → ejercicio B', donde: '«En lugar de X · solo en este entrenamiento» (F33)' },
  { apartado: 38, que: '«Pregunta 2 de 7»', donde: '`ClassificationProgress` (F17)' },
  { apartado: 40, que: 'El movimiento reducido', donde: 'Las reglas globales de index.css: sistema y Ajustes' },
];

export const NO_EN_FIT37 = [
  { que: 'Animar el cierre de hojas y diálogos (apartado 22)', porque: 'Cerrar con animación obliga a retrasar el desmontaje; el apartado 50 pide aguantar «cerrar un modal durante la transición» y el 46 no retrasar nada. Entran con animación y se cierran al instante.' },
  { que: 'Arrastrar una hoja para cerrarla (apartado 23)', porque: '«Cuando ya exista soporte»: no existe en ninguna hoja de la aplicación, y construirlo es una función nueva.' },
  { que: 'Cabeceras que reaccionan al scroll (apartado 34)', porque: '«Solo si ya encaja con el diseño actual»: Fitness no tiene cabecera que encoja, y la de la SC F1 ya es fija.' },
  { que: 'Esqueletos dentro de Fitness (apartados 26 y 27)', porque: 'Los datos de Fitness llegan con la carga de la aplicación, que ya dibuja su esqueleto (E3 F14); dentro no hay una carga de estructura conocida que dure. Las fotos tienen su propio hueco mientras se firman (F26).' },
  { que: 'Dibujar las gráficas al aparecer (apartado 17)', porque: 'Son SVG de la F12 y la F29 que se repintan al cambiar de periodo; animar el trazo en cada cambio es lo que el propio apartado desaconseja con muchos puntos.' },
  { que: 'Conservar el scroll al volver (apartado 32)', porque: 'La navegación es por estado de React (E3 F22) y no guarda posiciones; hacerlo es estructural. Sí se conservan la búsqueda y los filtros de la biblioteca, porque la ficha se abre dentro de la misma pantalla (F34).' },
  { que: 'Animar la racha cuando sube (apartado 35)', porque: '«Puede tener»: para saber que ha subido habría que recordar el número de antes, y la racha no guarda ni un contador — se deriva del historial (RA F1, apartado 24). La cabecera se vuelve a montar al volver del entrenamiento, así que un recuerdo de pantalla no lo vería nunca.' },
  { que: 'Abrir y cerrar listas que se expanden (apartado 12)', porque: '«En listas donde exista expansión»: ninguna lista de Fitness se expande. Los acordeones de la aplicación ya abren con su transición de filas (SC F1).' },
  { que: 'Cambiar la transición de entrada de los módulos (`module-enter`)', porque: 'Es de toda la aplicación (Fase N2, 340 ms): cambiarla desde una fase de Fitness cambiaría todas las pantallas (la lección de `.hub-card` en SC F1).' },
];

export const DECISIONES_FIT37 = [
  { que: 'Toda animación de Fitness vive en index.css y termina con backwards', porque: 'Así cumple «Reducir movimiento» sola y no deja un transform que rompa los `fixed` de dentro.' },
  { que: 'La pantalla de éxito dice si el guardado ha llegado a tu cuenta', porque: 'Apartados 18, 25 y 28: «Guardando…» mientras se sube, y si falla, el aviso va junto a la acción con «Reintentar». Decir «guardado» sin saberlo sería la regla 8.' },
  { que: 'Con el guardado fallido no se celebra la subida de rango', porque: 'Sale de una sesión que todavía no está en su cuenta y al recargar desaparecería; se enseña cuando «Reintentar» la deja guardada, y ese mismo guardado retira el aviso de error.' },
  { que: 'Solo se celebra una subida de rango de verdad', porque: 'El primer rango de un ejercicio saldría en cada primer entrenamiento, y un cambio dentro del mismo rango no es subir (F22).' },
];
