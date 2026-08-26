// ============================================================================
// HT · Fase 4/12 — CONFIGURACIÓN AVANZADA DE COLUMNAS, FILAS Y BLOQUES
//
// *"HORARIO TOP no debe asumir cómo tiene que ser un horario. El usuario debe
// poder decidir cómo quiere estructurarlo."* (apartado 1)
//
// Y la regla que gobierna la fase entera, el apartado 63:
//
//   *"Toda función avanzada deberá cumplir: **no complicar la interfaz básica.**
//   La potencia debe aparecer cuando el usuario la necesita."*
//
// Por eso nada de aquí cambia lo que ve alguien que solo quiere su horario de
// clases: tocar una celda y escribir sigue siendo tocar una celda y escribir. Lo
// de este archivo son **opciones**, y todas tienen un valor por defecto que es
// exactamente el comportamiento de HT F3.
//
// ── EL PUNTO CRÍTICO (apartados 30, 31 y 32) ───────────────────────────────
//
// *"Si el usuario modifica 08:00–09:00 por 08:30–09:30 y ya existen actividades
// dentro, el sistema deberá comprobar los posibles conflictos. **No se deben
// mover datos silenciosamente.**"*
//
// Es lo mismo que el apartado 52 de la fase anterior, en otra escala: cambiar la
// estructura puede romper bloques sin que nadie se dé cuenta. Aquí se resuelve
// igual — `impactoDeCambio` calcula qué se rompe **antes** de escribir, y quien
// llama decide.
// ============================================================================

import { uid, todayISO } from './helpers';
import {
  normalizarHorarioTop, normalizarHorarioObj, TIPOS_COLUMNA, TIPOS_FILA,
  tipoColumna, tipoFila, normalizarHora, minutosDe, duracionMinutos,
  seSolapan, diaDeFecha, lunesDe, nombreDeActividad, crearColumna, crearFila,
  normalizarBloque, DIAS_SEMANA,
} from './horario';
import { columnasDe, filasDe, contarEnColumna, conflictosCon } from './horarioEditor';

/* ===========================================================================
   1 · CICLOS: SEMANAS A/B Y ROTACIONES (apartados 10 y 11)
   ===========================================================================
   *"El sistema no deberá limitarse a A/B. Podrá prepararse para: Semana A/B,
   Semana 1/2/3, ciclo de 4 semanas, turnos, rotaciones."*

   Un ciclo son **N semanas que se repiten**, y cada columna dice a cuál
   pertenece con su `grupo`. Lo que hace que funcione sin guardar nada es lo
   mismo que la alternancia de HT F2: **se cuenta desde una fecha ancla**, no se
   guarda "esta semana toca la A". Un contador guardado se desincroniza en cuanto
   pasa una semana sin abrir la app — y un horario que enseña la semana
   equivocada es peor que no tener horario. */

export const DEFAULT_CICLO = { semanas: 1, ancla: '', nombres: [] };

export function normalizarCiclo(guardado) {
  const g = guardado || {};
  const n = Number(g.semanas);
  // Entre 1 y 8: un ciclo de 1 es "no hay ciclo", y por encima de 8 semanas
  // nadie recuerda en cuál está — sería una función que no se puede usar.
  //
  // Un número fuera de rango se ACOTA, no se descarta: devolver 1 apagaría el
  // ciclo entero por un dedazo, y las clases alternas desaparecerían sin que
  // nada lo explicara.
  const semanas = Number.isFinite(n) && n >= 1 ? Math.min(8, Math.floor(n)) : 1;
  const nombres = (Array.isArray(g.nombres) ? g.nombres : []).map((x) => String(x).trim()).filter(Boolean);
  return {
    semanas,
    ancla: /^\d{4}-\d{2}-\d{2}$/.test(g.ancla || '') ? g.ancla : '',
    // Sin nombres, A/B/C…: es lo que espera cualquiera con semanas alternas.
    nombres: nombres.length >= semanas ? nombres.slice(0, semanas) : Array.from({ length: semanas }, (_, i) => nombres[i] || String.fromCharCode(65 + i)),
  };
}

export const hayCiclo = (ciclo) => normalizarCiclo(ciclo).semanas > 1;

/**
 * Qué semana del ciclo toca en una fecha. Devuelve el índice (0-based) y su
 * nombre, o `null` si el horario no tiene ciclo.
 *
 * Sin ancla no se adivina: se devuelve la primera. Adivinar sería peor que no
 * alternar, porque haría desaparecer clases sin motivo aparente.
 */
export function semanaDelCiclo(ciclo, fecha) {
  const c = normalizarCiclo(ciclo);
  if (c.semanas <= 1) return null;
  if (!c.ancla) return { indice: 0, nombre: c.nombres[0], sinAncla: true };
  const semanas = Math.round((new Date(`${lunesDe(fecha)}T00:00:00`) - new Date(`${lunesDe(c.ancla)}T00:00:00`)) / 604800000);
  // El módulo de un negativo en JavaScript es negativo, así que una fecha
  // anterior al ancla daría un índice imposible. Se corrige sumando.
  const indice = ((semanas % c.semanas) + c.semanas) % c.semanas;
  return { indice, nombre: c.nombres[indice], sinAncla: false };
}

/**
 * El ciclo guardado en el propio horario. Vive ahí y no en un ajuste global
 * porque dos horarios (instituto y entrenamientos) pueden alternar distinto.
 */
export const cicloDe = (horario) => normalizarCiclo(normalizarHorarioObj(horario).ciclo);

/** Guardar el ciclo de un horario. Un ciclo de 1 semana se borra: es "no hay ciclo". */
export function guardarCiclo(estado, horarioId, datos) {
  const e = normalizarHorarioTop(estado);
  const c = normalizarCiclo(datos);
  return {
    ...e,
    horarios: e.horarios.map((h) => (h.id === horarioId ? { ...h, ciclo: c.semanas > 1 ? c : null } : h)),
  };
}

/** Las columnas que tocan una fecha, respetando el ciclo por `grupo`. */
export function columnasDeLaFecha(horario, fecha, ciclo) {
  const h = normalizarHorarioObj(horario);
  const dia = diaDeFecha(fecha);
  const visibles = columnasDe(h, { soloVisibles: true }).filter((c) => c.dia === dia);
  // Sin ciclo explícito se usa el del horario, para que quien solo tenga el
  // horario delante no tenga que acordarse de pasarlo aparte.
  const semana = semanaDelCiclo(ciclo === undefined ? h.ciclo : ciclo, fecha);
  if (!semana) return visibles;
  // Una columna sin grupo vale para todas las semanas del ciclo: es lo que
  // permite tener "Lunes" fijo y solo "Miércoles A/B" alternando.
  return visibles.filter((c) => !c.grupo || c.grupo === semana.nombre);
}

/** Los grupos que existen en un horario, en orden de aparición. */
export function gruposDe(horario) {
  const vistos = [];
  for (const c of columnasDe(horario)) if (c.grupo && !vistos.includes(c.grupo)) vistos.push(c.grupo);
  return vistos;
}

/* ===========================================================================
   2 · IMPACTO DE UN CAMBIO ESTRUCTURAL (apartados 30, 31, 32 y 45)
   ===========================================================================
   *"Cambiar esta estructura afectará a 7 bloques. ¿Qué quieres hacer?"* Y el 45:
   *"No se deberá ocultar el impacto de la acción."*

   Estas funciones **no escriben nada**. Dicen qué pasaría. */

/** Qué se pierde al eliminar una columna. */
export function impactoEliminarColumna(estado, horarioId, columnaId) {
  const e = normalizarHorarioTop(estado);
  const bloques = e.bloques.filter((b) => b.horarioId === horarioId && b.columnaId === columnaId);
  const ids = new Set(bloques.map((b) => b.id));
  return {
    bloques: bloques.length,
    // Las excepciones cuentan aparte: son cambios que Josué apuntó a mano un día
    // concreto, y perderlos sin avisar es peor que perder el bloque.
    excepciones: e.excepciones.filter((x) => x.bloqueId && ids.has(x.bloqueId)).length,
    seguro: bloques.length === 0,
  };
}

/**
 * Qué pasa al cambiar las horas de una franja (apartados 30 y 32).
 *
 * Devuelve tres listas, y la distinción importa: **los bloques NO se mueven con
 * la fila.** Un bloque guarda sus propias horas (HT F2, apartado 14), así que
 * cambiar la fila solo cambia la rejilla. Lo que puede pasar es que un bloque
 * deje de encajar en ninguna franja — y eso hay que decirlo antes.
 */
export function impactoCambiarFila(estado, horarioId, filaId, { inicio, fin }) {
  const e = normalizarHorarioTop(estado);
  const horario = e.horarios.find((h) => h.id === horarioId);
  if (!horario) return { ok: false, motivo: 'Ese horario no existe.' };
  const fila = horario.filas.find((f) => f.id === filaId);
  if (!fila) return { ok: false, motivo: 'Esa franja no existe.' };

  const nueva = { inicio: normalizarHora(inicio) || fila.inicio, fin: normalizarHora(fin) || fila.fin };
  if (!duracionMinutos(nueva.inicio, nueva.fin)) return { ok: false, motivo: 'Esas horas no son válidas.' };

  const delHorario = e.bloques.filter((b) => b.horarioId === horarioId);
  const dentroAntes = delHorario.filter((b) => seSolapan(b, fila));
  const dentroDespues = delHorario.filter((b) => seSolapan(b, nueva));
  const otrasFilas = horario.filas.filter((f) => f.id !== filaId && f.tipo === 'hora');

  // Los que se quedan sin ninguna franja debajo: los que estaban en esta y ya no
  // están en ninguna. Son los que hay que enseñar antes de confirmar.
  const huerfanos = dentroAntes.filter((b) => !dentroDespues.includes(b) && !otrasFilas.some((f) => seSolapan(b, f)));

  return {
    ok: true,
    afectados: dentroAntes.length,
    siguenDentro: dentroDespues.length,
    huerfanos: huerfanos.map((b) => ({ id: b.id, inicio: b.inicio, fin: b.fin })),
    // Apartado 34 — dos filas solapadas. Se advierte, no se corrige.
    solapaCon: otrasFilas.filter((f) => seSolapan(f, nueva)).map((f) => ({ id: f.id, inicio: f.inicio, fin: f.fin })),
    seguro: huerfanos.length === 0,
  };
}

/** Apartado 33 — la validación estructural completa. Informa, no toca nada. */
export function validarEstructura(estado, horarioId) {
  const e = normalizarHorarioTop(estado);
  const horario = e.horarios.find((h) => h.id === horarioId);
  if (!horario) return { ok: false, problemas: [{ tipo: 'sin_horario' }] };
  const problemas = [];

  const cols = columnasDe(horario);
  const filas = filasDe(horario).filter((f) => f.tipo === 'hora');

  // Posiciones únicas.
  if (new Set(cols.map((c) => c.posicion)).size !== cols.length) problemas.push({ tipo: 'posiciones_columna_repetidas' });
  if (new Set(filasDe(horario).map((f) => f.posicion)).size !== filasDe(horario).length) problemas.push({ tipo: 'posiciones_fila_repetidas' });
  // Identificadores únicos.
  if (new Set(cols.map((c) => c.id)).size !== cols.length) problemas.push({ tipo: 'ids_columna_repetidos' });

  // Horas coherentes.
  for (const f of filas) {
    if (!duracionMinutos(f.inicio, f.fin)) problemas.push({ tipo: 'fila_sin_horas', id: f.id });
  }
  // Apartado 34 — filas solapadas.
  for (let i = 0; i < filas.length; i++) {
    for (let j = i + 1; j < filas.length; j++) {
      if (seSolapan(filas[i], filas[j])) problemas.push({ tipo: 'filas_solapadas', ids: [filas[i].id, filas[j].id] });
    }
  }
  // Bloques que apuntan a una columna que ya no existe.
  const ids = new Set(cols.map((c) => c.id));
  for (const b of e.bloques.filter((x) => x.horarioId === horarioId)) {
    if (!ids.has(b.columnaId)) problemas.push({ tipo: 'bloque_sin_columna', id: b.id });
    if (conflictosCon(e, b, { ignorarId: b.id }).length) problemas.push({ tipo: 'bloque_en_conflicto', id: b.id });
  }
  // Un horario sin ninguna columna de día no resuelve nunca a una fecha. No es
  // un error —puede ser un tablero de proyectos— pero conviene saberlo.
  if (!cols.some((c) => c.dia)) problemas.push({ tipo: 'sin_columnas_de_dia', aviso: true });

  return { ok: problemas.filter((p) => !p.aviso).length === 0, problemas };
}

/**
 * Un problema, dicho como se le dice a una persona. Los `tipo` de arriba son
 * para el código; lo que ve Josué no puede ser `filas_solapadas` (regla 9).
 */
const TEXTOS_PROBLEMA = {
  sin_horario: 'Ese horario ya no existe.',
  posiciones_columna_repetidas: 'Hay días que se pisan en el orden. Muévelos otra vez para arreglarlo.',
  posiciones_fila_repetidas: 'Hay franjas que se pisan en el orden. Muévelas otra vez para arreglarlo.',
  ids_columna_repetidos: 'Hay dos días repetidos.',
  fila_sin_horas: 'Hay una franja sin horas.',
  filas_solapadas: 'Dos franjas se solapan.',
  bloque_sin_columna: 'Hay una clase en un día que ya no existe.',
  bloque_en_conflicto: 'Hay dos clases a la misma hora el mismo día.',
  sin_columnas_de_dia: 'Ninguna columna es un día de la semana, así que este horario no aparecerá en tu día.',
};

export const describirProblema = (p) => TEXTOS_PROBLEMA[p?.tipo] || 'Hay algo raro en la estructura.';

/* ===========================================================================
   3 · INTERVALOS (apartados 28 y 29)
   ===========================================================================
   *"Esto será solamente una ayuda para crear la estructura. Los bloques seguirán
   pudiendo tener horarios específicos."*

   Genera filas regulares de golpe, que es lo que evita crear ocho franjas a
   mano. Y **no fuerza nada**: los bloques que ya existan conservan sus horas. */
export const INTERVALOS = [30, 45, 50, 55, 60, 90];

export function generarFranjas({ desde = '08:00', hasta = '14:00', intervalo = 60, descanso = 0 } = {}) {
  const inicio = minutosDe(desde);
  const fin = minutosDe(hasta);
  const paso = Number(intervalo) > 0 ? Math.floor(intervalo) : 60;
  if (inicio === null || fin === null || fin <= inicio) return [];

  const salida = [];
  let cursor = inicio;
  let n = 0;
  // El tope existe porque un intervalo de 1 minuto sobre doce horas daría 720
  // filas y dejaría la app inservible (apartado 20: *"evitar que una
  // configuración extrema destruya la usabilidad"*).
  while (cursor + paso <= fin && n < 40) {
    salida.push(crearFila({ inicio: aHora(cursor), fin: aHora(cursor + paso), posicion: n }));
    cursor += paso + (Number(descanso) || 0);
    n++;
  }
  return salida;
}

const aHora = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

/** Sustituye la rejilla de horas por otra. Devuelve el impacto ANTES de aplicar. */
export function impactoRegenerarFranjas(estado, horarioId, franjas) {
  const e = normalizarHorarioTop(estado);
  const bloques = e.bloques.filter((b) => b.horarioId === horarioId);
  const huerfanos = bloques.filter((b) => !franjas.some((f) => seSolapan(b, f)));
  return { bloques: bloques.length, huerfanos: huerfanos.length, seguro: huerfanos.length === 0 };
}

export function regenerarFranjas(estado, horarioId, franjas) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    horarios: e.horarios.map((h) => (h.id === horarioId ? { ...h, filas: franjas } : h)),
    // Los bloques NO se tocan: siguen con sus horas. Es lo que impide que
    // cambiar la rejilla mueva datos en silencio (apartado 30).
    bloques: e.bloques.map((b) => (b.horarioId === horarioId ? { ...b, filaId: null } : b)),
  };
}

/* ===========================================================================
   4 · DUPLICAR Y ARCHIVAR HORARIOS (apartados 25, 55, 56 y 57)
   ===========================================================================
   *"Duplicar horario para nuevo periodo: 2026/27 → 2027/28. El sistema podrá
   conservar estructura, colores, iconos y asignaturas."*

   Y el 56: *"Cuando un horario deje de utilizarse: **archivar en lugar de
   eliminar**."* */

/**
 * Copia un horario entero: columnas, filas, bloques y su configuración. **Las
 * actividades NO se copian**, se comparten: Matemáticas del curso que viene es
 * la misma Matemáticas, con su color y su profesor, y duplicarlas rompería el
 * apartado 25 de HT F1 en el peor momento — al empezar un curso.
 */
export function duplicarHorario(estado, horarioId, { nombre = '', periodo = '', desde = '', hasta = '', hoy = todayISO() } = {}) {
  const e = normalizarHorarioTop(estado);
  const original = e.horarios.find((h) => h.id === horarioId);
  if (!original) return { estado: e, error: 'Ese horario no existe.' };

  // Los ids nuevos se mapean para que los bloques sigan apuntando a la columna
  // correcta de la copia y no a la del original.
  const mapaColumnas = new Map();
  const columnas = original.columnas.map((c) => {
    const nuevoId = uid();
    mapaColumnas.set(c.id, nuevoId);
    return { ...c, id: nuevoId };
  });
  const mapaFilas = new Map();
  const filas = original.filas.map((f) => {
    const nuevoId = uid();
    mapaFilas.set(f.id, nuevoId);
    return { ...f, id: nuevoId };
  });

  const copia = normalizarHorarioObj({
    ...original, id: uid(),
    nombre: (nombre || '').trim() || `${original.nombre} (copia)`,
    periodo: periodo || original.periodo,
    desde, hasta,
    columnas, filas,
    porDefecto: false,
    creadoEn: hoy, actualizadoEn: hoy,
  });

  const bloques = e.bloques
    .filter((b) => b.horarioId === horarioId)
    .map((b) => normalizarBloque({
      ...b, id: uid(), horarioId: copia.id,
      columnaId: mapaColumnas.get(b.columnaId) || null,
      filaId: b.filaId ? mapaFilas.get(b.filaId) || null : null,
      creadoEn: hoy, actualizadoEn: hoy,
    }));

  return {
    // Las EXCEPCIONES no se copian: son cambios de días concretos del curso
    // pasado, y arrastrarlas al nuevo sería copiar "el 12 de marzo no hubo
    // clase" a un año en el que sí la hay.
    estado: { ...e, horarios: [...e.horarios, copia], bloques: [...e.bloques, ...bloques] },
    horario: copia, copiados: bloques.length, error: null,
  };
}

/** Archivar = desactivar y marcar. El histórico se conserva entero. */
export function archivarHorario(estado, horarioId, archivado = true) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    horarios: e.horarios.map((h) => (h.id === horarioId ? { ...h, activo: !archivado, archivado } : h)),
  };
}

export const horariosActivos = (estado) => normalizarHorarioTop(estado).horarios.filter((h) => h.activo && !h.archivado);
export const horariosArchivados = (estado) => normalizarHorarioTop(estado).horarios.filter((h) => h.archivado);

/* ===========================================================================
   5 · PLANTILLAS PERSONALIZADAS (apartado 26)
   ===========================================================================
   *"El usuario podrá guardar una estructura como plantilla."*

   Una plantilla guarda **la estructura y nada más**: ni bloques, ni actividades,
   ni excepciones. Si guardara los bloques, sería un horario duplicado con otro
   nombre — y para eso ya está `duplicarHorario`. */
export function guardarComoPlantilla(horario, { nombre = '' } = {}) {
  const h = normalizarHorarioObj(horario);
  return {
    id: uid(),
    nombre: (nombre || '').trim() || h.nombre,
    tipo: h.tipo,
    // Los ids se quitan: al usar la plantilla se generan nuevos, o dos horarios
    // creados con ella compartirían id de columna y los bloques se mezclarían.
    columnas: h.columnas.map(({ id, ...c }) => c),
    filas: h.filas.map(({ id, ...f }) => f),
    creadaEn: todayISO(),
  };
}

export function crearDesdePlantillaPropia(estado, plantillaPropia, { nombre = '', hoy = todayISO() } = {}) {
  const e = normalizarHorarioTop(estado);
  const p = plantillaPropia || {};
  const horario = normalizarHorarioObj({
    id: uid(),
    nombre: (nombre || '').trim() || p.nombre || 'Horario',
    tipo: p.tipo || 'personalizado',
    columnas: (p.columnas || []).map((c) => ({ ...c, id: uid() })),
    filas: (p.filas || []).map((f) => ({ ...f, id: uid() })),
    activo: true, creadoEn: hoy, actualizadoEn: hoy,
  });
  return { estado: { ...e, horarios: [...e.horarios, horario] }, horario };
}

/* ===========================================================================
   6 · PREFERENCIAS VISUALES: LOCALES, NO DE LA NUBE (apartados 19-23 y 59)
   ===========================================================================
   *"El usuario prefiere un zoom del 90 % en su móvil. **Eso no debería
   modificar necesariamente la vista del horario en su ordenador.**"*

   Es una distinción que el proyecto no tenía: todo se sincroniza. Aquí hay una
   razón real para no hacerlo — el zoom que va bien en un iPhone de 4,7" no es el
   que va bien en un portátil, y sincronizarlo haría que cada dispositivo
   estropeara la vista del otro.

   Van a `localStorage`, que es por dispositivo por definición. Y **nada de esto
   toca los datos**: quitarlo todo deja el horario intacto. */

export const DEFAULT_VISUAL = {
  densidad: 'normal',       // 'compacto' | 'normal' | 'comodo'
  zoom: 100,                // 60-140
  vista: 'semana',
  horarioAbierto: null,
  columnasOcultas: [],
  filtroActividades: [],
  filtroHorarios: [],
};

export const DENSIDADES = [
  { id: 'compacto', label: 'Compacto', alto: 34 },
  { id: 'normal', label: 'Normal', alto: 46 },
  { id: 'comodo', label: 'Cómodo', alto: 62 },
];

export const densidad = (id) => DENSIDADES.find((d) => d.id === id) || DENSIDADES[1];

export function normalizarVisual(guardado) {
  const g = guardado || {};
  const z = Number(g.zoom);
  return {
    ...DEFAULT_VISUAL,
    ...g,
    densidad: densidad(g.densidad).id,
    // 60-140: por debajo no se lee y por encima no cabe una columna entera.
    // *"Evitar que una configuración extrema destruya la usabilidad."*
    zoom: Number.isFinite(z) ? Math.max(60, Math.min(140, Math.round(z))) : 100,
    columnasOcultas: Array.isArray(g.columnasOcultas) ? g.columnasOcultas.filter((x) => typeof x === 'string') : [],
    filtroActividades: Array.isArray(g.filtroActividades) ? g.filtroActividades.filter((x) => typeof x === 'string') : [],
    filtroHorarios: Array.isArray(g.filtroHorarios) ? g.filtroHorarios.filter((x) => typeof x === 'string') : [],
  };
}

const CLAVE_VISUAL = 'josstyle.horario.visual';

export function leerVisual() {
  try {
    if (typeof localStorage === 'undefined') return normalizarVisual(null);
    return normalizarVisual(JSON.parse(localStorage.getItem(CLAVE_VISUAL) || '{}'));
  } catch { return normalizarVisual(null); }
}

export function guardarVisual(visual) {
  const v = normalizarVisual(visual);
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(CLAVE_VISUAL, JSON.stringify(v));
  } catch { /* modo privado, cuota llena: son preferencias, no datos */ }
  return v;
}

/**
 * Apartado 23 — *"Ajustar a pantalla"*. Con muchas columnas, el ancho que cabe.
 * Nunca por debajo de 64 px: una columna más estrecha no deja leer ni "Mat".
 */
export function anchoAjustado(nColumnas, anchoDisponible) {
  if (!nColumnas || !anchoDisponible) return 0;
  return Math.max(64, Math.floor(anchoDisponible / nColumnas));
}

/* ===========================================================================
   7 · FILTROS Y BÚSQUEDA (apartados 39, 40 y 41)
   ===========================================================================
   Los filtros son visuales, así que viven en las preferencias locales. Lo que
   está aquí es cómo se aplican. */

export function filtrarBloques(estado, bloques, { actividades = [], horarios = [] } = {}) {
  let salida = bloques;
  if (actividades.length) salida = salida.filter((b) => actividades.includes(b.actividadId));
  if (horarios.length) salida = salida.filter((b) => horarios.includes(b.horarioId));
  return salida;
}

/**
 * Apartado 41 — *"Buscar: Biología → aparecen todos los bloques relacionados."*
 * Busca en el nombre, el aula, el profesor y las etiquetas, que es lo que el
 * apartado enumera.
 */
export function buscarEnHorario(estado, texto, { asignaturas = [] } = {}) {
  const e = normalizarHorarioTop(estado);
  const q = (texto || '').trim().toLowerCase();
  if (!q) return [];

  return e.bloques
    .map((b) => {
      const act = e.actividades.find((a) => a.id === b.actividadId) || null;
      const titulo = act ? nombreDeActividad(act, asignaturas) : (b.titulo || '');
      const campos = [titulo, b.ubicacion, act?.ubicacion, act?.persona, ...(b.etiquetas || [])]
        .filter(Boolean).join(' ').toLowerCase();
      return campos.includes(q) ? { ...b, titulo, actividad: act } : null;
    })
    .filter(Boolean);
}

/* ===========================================================================
   8 · SELECCIÓN Y OPERACIONES MASIVAS (apartados 24, 43 y 44)
   ===========================================================================
   *"Seleccionar Matemáticas lunes, martes y jueves → cambiar color → todos."*

   La selección es una lista de ids y vive en la pantalla; lo que está aquí son
   las operaciones, que son las que tienen que ser correctas. */

export function seleccionDeColumna(estado, horarioId, columnaId) {
  return normalizarHorarioTop(estado).bloques
    .filter((b) => b.horarioId === horarioId && b.columnaId === columnaId).map((b) => b.id);
}

export function seleccionDeFila(estado, horarioId, fila) {
  return normalizarHorarioTop(estado).bloques
    .filter((b) => b.horarioId === horarioId && seSolapan(b, fila)).map((b) => b.id);
}

export function seleccionDeActividad(estado, horarioId, actividadId) {
  return normalizarHorarioTop(estado).bloques
    .filter((b) => b.horarioId === horarioId && b.actividadId === actividadId).map((b) => b.id);
}

/** Borrar varios de golpe, con sus excepciones. */
export function eliminarSeleccion(estado, ids) {
  const e = normalizarHorarioTop(estado);
  const set = new Set(ids || []);
  return {
    ...e,
    bloques: e.bloques.filter((b) => !set.has(b.id)),
    excepciones: e.excepciones.filter((x) => !x.bloqueId || !set.has(x.bloqueId)),
  };
}

/**
 * Cambiar el color de varios. ⚠️ **Cambia el color de los BLOQUES, no el de la
 * asignatura** — es el `color_override` de HT F2.
 *
 * La diferencia importa y es la del apartado 31: cambiar el color de Matemáticas
 * afecta a todos sus bloques, presentes y futuros; cambiar el de tres bloques
 * concretos, solo a esos tres. Quien seleccione tres bloques quiere lo segundo.
 */
export function colorearSeleccion(estado, ids, color) {
  const e = normalizarHorarioTop(estado);
  const set = new Set(ids || []);
  return { ...e, bloques: e.bloques.map((b) => (set.has(b.id) ? { ...b, colorPropio: (color || '').trim() } : b)) };
}

/** Mover varios a otra columna. Los conflictos se devuelven, no se ignoran. */
export function moverSeleccion(estado, ids, columnaId, { forzar = false } = {}) {
  const e = normalizarHorarioTop(estado);
  const set = new Set(ids || []);
  const movidos = e.bloques.filter((b) => set.has(b.id)).map((b) => ({ ...b, columnaId }));

  if (!forzar) {
    const resto = e.bloques.filter((b) => !set.has(b.id));
    const choques = movidos.filter((m) => resto.some((r) => r.columnaId === columnaId && r.horarioId === m.horarioId && seSolapan(r, m)));
    if (choques.length) return { estado: e, error: `${choques.length} ${choques.length === 1 ? 'bloque choca' : 'bloques chocan'} con lo que ya hay.`, conflictos: choques.length };
  }
  return { estado: { ...e, bloques: e.bloques.map((b) => (set.has(b.id) ? { ...b, columnaId } : b)) }, movidos: movidos.length, error: null };
}

/* ===========================================================================
   9 · REORDENACIÓN MASIVA (apartado 24)
   =========================================================================== */
export function reordenarColumnas(estado, horarioId, ordenIds) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    horarios: e.horarios.map((h) => {
      if (h.id !== horarioId) return h;
      const porId = new Map(h.columnas.map((c) => [c.id, c]));
      // Las que no vengan en el orden se ponen detrás, en vez de desaparecer.
      const ordenadas = (ordenIds || []).map((id) => porId.get(id)).filter(Boolean);
      const resto = h.columnas.filter((c) => !(ordenIds || []).includes(c.id));
      return { ...h, columnas: [...ordenadas, ...resto].map((c, i) => ({ ...c, posicion: i })) };
    }),
  };
}

export function reordenarFilas(estado, horarioId, ordenIds) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    horarios: e.horarios.map((h) => {
      if (h.id !== horarioId) return h;
      const porId = new Map(h.filas.map((f) => [f.id, f]));
      const ordenadas = (ordenIds || []).map((id) => porId.get(id)).filter(Boolean);
      const resto = h.filas.filter((f) => !(ordenIds || []).includes(f.id));
      return { ...h, filas: [...ordenadas, ...resto].map((f, i) => ({ ...f, posicion: i })) };
    }),
  };
}

/* ===========================================================================
   10 · BLOQUEO Y METADATOS (apartados 8, 37 y 38)
   =========================================================================== */

export function bloquearColumna(estado, horarioId, columnaId, bloqueada = true) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    horarios: e.horarios.map((h) => (h.id !== horarioId ? h : {
      ...h, columnas: h.columnas.map((c) => (c.id === columnaId ? { ...c, bloqueada } : c)),
    })),
  };
}

/** Una columna bloqueada no se toca. Lo comprueban las operaciones que escriben. */
export function columnaBloqueada(estado, columnaId) {
  const e = normalizarHorarioTop(estado);
  for (const h of e.horarios) {
    const c = h.columnas.find((x) => x.id === columnaId);
    if (c) return !!c.bloqueada;
  }
  return false;
}

/** Los metadatos del apartado 37, con la zona horaria de los apartados 53 y 54. */
export function actualizarMetadatos(estado, horarioId, datos = {}) {
  const e = normalizarHorarioTop(estado);
  const permitidos = ['nombre', 'descripcion', 'tipo', 'icono', 'color', 'periodo', 'zonaHoraria', 'desde', 'hasta', 'porDefecto'];
  return {
    ...e,
    horarios: e.horarios.map((h) => {
      if (h.id !== horarioId) return h;
      const cambios = {};
      for (const k of permitidos) if (datos[k] !== undefined) cambios[k] = datos[k];
      return normalizarHorarioObj({ ...h, ...cambios, actualizadoEn: new Date().toISOString() });
    }),
  };
}

/** La zona horaria del dispositivo. Se guarda al crear, para no perderla al viajar. */
export const zonaHorariaActual = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; }
};

/* ===========================================================================
   11 · RESUMEN DE LA ESTRUCTURA
   =========================================================================== */
export function resumenEstructura(estado, horarioId) {
  const e = normalizarHorarioTop(estado);
  const horario = e.horarios.find((h) => h.id === horarioId);
  if (!horario) return null;
  const cols = columnasDe(horario);
  const filas = filasDe(horario);
  return {
    columnas: cols.length,
    visibles: cols.filter((c) => c.visible !== false).length,
    bloqueadas: cols.filter((c) => c.bloqueada).length,
    grupos: gruposDe(horario),
    filas: filas.length,
    conHora: filas.filter((f) => f.tipo === 'hora').length,
    sinHora: filas.filter((f) => f.tipo !== 'hora').length,
    tiposColumna: [...new Set(cols.map((c) => c.tipo))],
    validacion: validarEstructura(e, horarioId),
  };
}
