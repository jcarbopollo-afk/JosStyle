// ============================================================================
// HT · Fase 3/12 — EDITOR VISUAL: las operaciones
//
// *"El usuario ve una cuadrícula sencilla. El sistema se encarga de toda la
// complejidad."* (apartado 1)
//
// Este archivo es la complejidad. Cada gesto del editor —crear una columna,
// mover un bloque, duplicar un día— es aquí **una función pura que recibe el
// estado y devuelve otro**. La pantalla (`HorarioView.jsx`) solo llama y pinta.
//
// Esa separación no es estética: es lo que permite probar "duplicar el lunes en
// el martes" o "detectar que dos clases chocan" con Node, sin un navegador. Y es
// lo que hace que el apartado 65 —*"estado local para respuesta inmediata"*— sea
// gratis: como nada aquí toca la red, cada operación devuelve el estado nuevo al
// instante y la persistencia va detrás.
//
// ── LO QUE **NO** SE CONSTRUYE, PORQUE YA EXISTE ───────────────────────────
//
// · **Autoguardado** (apartados 36 y 71). La app guarda en cada cambio desde la
//   Fase 2 del Prompt Maestro. Montar un segundo autoguardado con su propio
//   debounce daría dos sistemas escribiendo la misma clave.
// · **Deshacer** (apartados 38 y 39). `snapshotAndSave` + `undo` ya existen y
//   cubren *"eliminar bloque, mover bloque, cambiar color, eliminar fila,
//   eliminar columna"* — literalmente la lista del apartado 38. Cada operación
//   de aquí entra por ahí, así que deshacer funciona sin escribir una línea.
// · **Colores e iconos** (apartados 30 y 32). `ACCENTS` y los iconos de
//   Personalización. Un segundo catálogo de color se saldría del sistema de
//   temas (regla 2).
//
// ── LO MÁS DELICADO: EL APARTADO 52 ────────────────────────────────────────
//
// *"Será importante diferenciar modificar el horario recurrente de modificar
// solamente este día."*
//
// Es el error más fácil de cometer y el más caro: cambiar "Matemáticas" de las
// 08:00 a las 09:00 porque hoy hubo un cambio, y cargarse todos los lunes del
// curso. Aquí se resuelve en `ALCANCES`: la misma edición va a `bloques` o a
// `excepciones` según lo que se pida, y **nunca hay un valor por defecto
// silencioso** — quien llame tiene que decirlo.
// ============================================================================

import { uid, todayISO } from './helpers';
import {
  normalizarHorarioTop, normalizarHorarioObj, normalizarBloque, normalizarActividad,
  crearHorario, crearColumna, crearFila, crearBloque, crearActividad, crearExcepcion,
  normalizarHora, minutosDe, duracionMinutos, diaDeFecha, DIAS_SEMANA,
  resolverDia, seSolapan, nombreDeActividad, cuadriculaInicial,
} from './horario';

/* ===========================================================================
   1 · PLANTILLAS (apartados 2 y 3)
   ===========================================================================
   *"La plantilla únicamente será un punto de partida. Todo deberá poder
   modificarse posteriormente."*

   Por eso una plantilla no es un tipo de horario ni se guarda en ninguna parte:
   es la cuadrícula con la que se empieza, y en cuanto se crea deja de existir. */
export const PLANTILLAS_HORARIO = [
  { id: 'colegio', label: 'Colegio', sub: 'Lunes a viernes, 08:00–14:00', dias: [1, 2, 3, 4, 5], desde: 8, hasta: 14 },
  { id: 'semana', label: 'Semana completa', sub: 'Los siete días', dias: [1, 2, 3, 4, 5, 6, 7], desde: 8, hasta: 14 },
  { id: 'tarde', label: 'Tardes', sub: 'Lunes a viernes, 16:00–21:00', dias: [1, 2, 3, 4, 5], desde: 16, hasta: 21 },
  // *"Desde cero: cuadrícula vacía."* Sin columnas ni filas, para quien quiera
  // construirlo todo — un horario de "Semana A / Semana B", por ejemplo.
  { id: 'vacio', label: 'Desde cero', sub: 'Sin días ni franjas', dias: [], desde: 0, hasta: 0 },
];

export const plantilla = (id) => PLANTILLAS_HORARIO.find((p) => p.id === id) || PLANTILLAS_HORARIO[0];

/** Crea el horario ya con su cuadrícula. Un solo paso, como pide el apartado 2. */
export function crearDesdePlantilla(estado, { nombre = '', tipo = 'escolar', plantillaId = 'colegio', periodo = '', hoy = todayISO() } = {}) {
  const e = normalizarHorarioTop(estado);
  const p = plantilla(plantillaId);
  const base = crearHorario({ nombre, tipo, periodo, hoy });

  const columnas = p.dias.map((dia, i) => crearColumna({ dia, posicion: i }));
  const filas = [];
  for (let h = p.desde; h < p.hasta; h++) {
    filas.push(crearFila({ inicio: `${String(h).padStart(2, '0')}:00`, fin: `${String(h + 1).padStart(2, '0')}:00`, posicion: h - p.desde }));
  }

  const horario = normalizarHorarioObj({ ...base, columnas, filas });
  return { estado: { ...e, horarios: [...e.horarios, horario] }, horario };
}

/* ===========================================================================
   2 · COLUMNAS (apartados 8, 9 y 10)
   ===========================================================================
   *"Antes de eliminar una columna con información se deberá solicitar
   confirmación. **Nunca se deberán borrar bloques silenciosamente.**"*

   La confirmación es de la pantalla; lo que hace falta desde aquí es **saber
   cuánto se va a perder**, y por eso `contarEnColumna` existe y se llama antes
   de borrar nada. Y el apartado 40 dice que una columna vacía puede borrarse sin
   preguntar — con este dato, la pantalla puede distinguir los dos casos. */

export const contarEnColumna = (estado, columnaId) =>
  normalizarHorarioTop(estado).bloques.filter((b) => b.columnaId === columnaId).length;

export function anadirColumna(estado, horarioId, datos = {}) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    horarios: e.horarios.map((h) => (h.id !== horarioId ? h : {
      ...h,
      columnas: [...h.columnas, crearColumna({ ...datos, posicion: h.columnas.length })],
    })),
  };
}

export function editarColumna(estado, horarioId, columnaId, cambios = {}) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    horarios: e.horarios.map((h) => (h.id !== horarioId ? h : {
      ...h,
      columnas: h.columnas.map((c) => (c.id === columnaId ? { ...c, ...cambios, id: c.id } : c)),
    })),
  };
}

/** Apartado 9 — ocultar no es borrar. Los bloques siguen ahí. */
export const alternarColumna = (estado, horarioId, columnaId) => {
  const e = normalizarHorarioTop(estado);
  const col = e.horarios.find((h) => h.id === horarioId)?.columnas.find((c) => c.id === columnaId);
  return editarColumna(e, horarioId, columnaId, { visible: !col?.visible });
};

/**
 * Apartado 10 — mover una columna. En móvil el arrastre es incómodo, así que la
 * operación es "muévela un puesto", que se puede ofrecer como un botón
 * (apartado 26: *"los gestos nunca serán la única forma"*).
 */
export function moverColumna(estado, horarioId, columnaId, direccion) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    horarios: e.horarios.map((h) => {
      if (h.id !== horarioId) return h;
      const orden = [...h.columnas].sort((a, b) => a.posicion - b.posicion);
      const i = orden.findIndex((c) => c.id === columnaId);
      const j = i + (direccion === 'izquierda' ? -1 : 1);
      if (i < 0 || j < 0 || j >= orden.length) return h;   // en el borde, no pasa nada
      [orden[i], orden[j]] = [orden[j], orden[i]];
      return { ...h, columnas: orden.map((c, k) => ({ ...c, posicion: k })) };
    }),
  };
}

/** Las columnas en su orden, y solo las visibles si se pide. */
export function columnasDe(horario, { soloVisibles = false } = {}) {
  const h = normalizarHorarioObj(horario);
  return h.columnas
    .filter((c) => !soloVisibles || c.visible !== false)
    .sort((a, b) => a.posicion - b.posicion);
}

/* ===========================================================================
   3 · FILAS (apartados 11, 12, 13 y 14)
   =========================================================================== */

/** Apartado 12 — cuántos bloques caen dentro de esa franja. Se cuenta ANTES de borrar. */
export function contarEnFila(estado, horarioId, fila) {
  const e = normalizarHorarioTop(estado);
  const f = { inicio: normalizarHora(fila?.inicio), fin: normalizarHora(fila?.fin) };
  if (!f.inicio || !f.fin) return 0;
  return e.bloques.filter((b) => b.horarioId === horarioId && seSolapan(b, f)).length;
}

export function anadirFila(estado, horarioId, { inicio = '', fin = '', etiqueta = '' } = {}) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    horarios: e.horarios.map((h) => {
      if (h.id !== horarioId) return h;
      const orden = [...h.filas].sort((a, b) => a.posicion - b.posicion);
      // Sin horas, la franja nueva continúa a la última: es lo que espera quien
      // pulsa "+ Añadir franja" cuatro veces seguidas montando su horario.
      const ultima = orden[orden.length - 1];
      const i = normalizarHora(inicio) || ultima?.fin || '08:00';
      const f = normalizarHora(fin) || sumarMinutos(i, ultima ? duracionMinutos(ultima.inicio, ultima.fin) || 60 : 60);
      return { ...h, filas: [...h.filas, crearFila({ inicio: i, fin: f, etiqueta, posicion: h.filas.length })] };
    }),
  };
}

/** `HH:MM` + minutos, sin pasarse de las 23:59. */
export function sumarMinutos(hora, minutos) {
  const m = minutosDe(hora);
  if (m === null) return '';
  const total = Math.min(23 * 60 + 59, m + (Number(minutos) || 0));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function editarFila(estado, horarioId, filaId, { inicio, fin, etiqueta } = {}) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    horarios: e.horarios.map((h) => (h.id !== horarioId ? h : {
      ...h,
      filas: h.filas.map((f) => {
        if (f.id !== filaId) return f;
        const i = inicio !== undefined ? (normalizarHora(inicio) || f.inicio) : f.inicio;
        const fi = fin !== undefined ? (normalizarHora(fin) || f.fin) : f.fin;
        // Apartado 13: *"la interfaz deberá validar que las horas sean
        // coherentes"*. Aquí se impide guardar una franja que acaba antes de
        // empezar, en vez de confiar en que la pantalla se acuerde.
        if (!duracionMinutos(i, fi)) return f;
        return { ...f, inicio: i, fin: fi, etiqueta: etiqueta !== undefined ? String(etiqueta).trim() : f.etiqueta };
      }),
    })),
  };
}

/**
 * Borrar una franja **no borra los bloques que caen en ella.**
 *
 * Las filas son la rejilla visual; los bloques guardan sus propias horas (HT F2,
 * apartado 14). Quitar la fila de las 10:00 no puede hacer desaparecer la clase
 * de las 10:00 — seguiría existiendo, solo que sin una línea donde apoyarse.
 * Quien quiera borrarlos los borra a mano, y por eso `contarEnFila` avisa.
 */
export function eliminarFila(estado, horarioId, filaId) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    horarios: e.horarios.map((h) => (h.id !== horarioId ? h : {
      ...h,
      filas: h.filas.filter((f) => f.id !== filaId).map((f, i) => ({ ...f, posicion: i })),
    })),
    bloques: e.bloques.map((b) => (b.filaId === filaId ? { ...b, filaId: null } : b)),
  };
}

export const filasDe = (horario) => normalizarHorarioObj(horario).filas.slice().sort((a, b) => a.posicion - b.posicion);

/* ===========================================================================
   4 · CONFLICTOS (apartados 28 y 29)
   ===========================================================================
   *"La opción predeterminada deberá evitar conflictos."*

   Así que `colocarBloque` los comprueba **antes** y devuelve el choque en vez de
   escribir. Forzar existe, pero hay que pedirlo: `{ forzar: true }`. */

export function conflictosCon(estado, bloque, { ignorarId = null } = {}) {
  const e = normalizarHorarioTop(estado);
  const b = normalizarBloque(bloque);
  if (!duracionMinutos(b.inicio, b.fin)) return [];
  return e.bloques.filter((x) => x.id !== ignorarId
    && x.horarioId === b.horarioId
    && x.columnaId === b.columnaId
    && seSolapan(x, b));
}

/** El conflicto, ya contado, para que la pantalla lo diga sin recorrer nada. */
export function describirConflicto(estado, choques, { asignaturas = [] } = {}) {
  const e = normalizarHorarioTop(estado);
  return choques.map((b) => {
    const act = e.actividades.find((a) => a.id === b.actividadId);
    return {
      id: b.id,
      titulo: act ? nombreDeActividad(act, asignaturas) : (b.titulo || 'Sin nombre'),
      inicio: b.inicio,
      fin: b.fin,
    };
  });
}

/* ===========================================================================
   5 · BLOQUES: crear, editar, mover, duplicar, borrar (apartados 15-27)
   =========================================================================== */

/**
 * Apartado 16 — **la creación rápida**, que es la que decide si montar un
 * horario son minutos o media hora:
 *
 *   *"Tocar celda → escribir «Matemáticas» → Enter. El sistema podrá: buscar si
 *   ya existe, si existe reutilizarla, si no crearla, asignar el bloque, aplicar
 *   automáticamente su color y guardar."*
 *
 * Los seis pasos, en una llamada. Y el que de verdad importa es el segundo:
 * **reutilizar**. Sin él, "Matemáticas" el lunes y "Matemáticas" el jueves serían
 * dos actividades distintas con dos colores distintos, y el apartado 25 de HT F1
 * —no duplicar— se rompería en el primer horario.
 */
export function crearBloqueRapido(estado, { horarioId, columnaId, filaId = null, inicio, fin, texto = '', asignaturas = [], forzar = false, hoy = todayISO() }) {
  const e = normalizarHorarioTop(estado);
  const nombre = (texto || '').trim();
  if (!nombre) return { estado: e, error: 'Escribe un nombre.' };

  const horario = e.horarios.find((h) => h.id === horarioId);
  if (!horario) return { estado: e, error: 'Ese horario no existe.' };
  const fila = filaId ? horario.filas.find((f) => f.id === filaId) : null;
  const i = normalizarHora(inicio) || fila?.inicio || '';
  const f = normalizarHora(fin) || fila?.fin || '';
  if (!duracionMinutos(i, f)) return { estado: e, error: 'Faltan las horas de esa franja.' };

  // 1-3 · buscar, reutilizar o crear.
  let actividades = e.actividades;
  let actividad = buscarActividad(e, nombre, asignaturas);
  if (!actividad) {
    // 5 · el color se asigna solo (apartado 30, "color automático"): que Josué
    // tenga que elegir uno por asignatura convertiría seis clases en seis
    // decisiones antes de haber escrito nada.
    actividad = crearActividad({ nombre, tipo: horario.tipo === 'escolar' ? 'asignatura' : 'otro', color: colorAutomatico(e), hoy });
    actividades = [...actividades, actividad];
  }

  // 4 · el bloque.
  const bloque = crearBloque({ horarioId, columnaId, filaId, actividadId: actividad.id, inicio: i, fin: f, hoy });
  const choques = conflictosCon(e, bloque);
  if (choques.length && !forzar) {
    return { estado: e, error: 'Ahí ya hay otra cosa.', conflictos: choques, propuesta: bloque, actividad };
  }

  return { estado: { ...e, actividades, bloques: [...e.bloques, bloque] }, bloque, actividad, error: null };
}

/**
 * Apartados 17 y 18 — el autocompletado. Busca por nombre, y **también entre las
 * asignaturas de Estudios**: escribir "Bio" tiene que encontrar la Biología que
 * Josué ya creó allí, o el apartado 25 de HT F1 no serviría de nada en la
 * práctica.
 */
export function buscarActividad(estado, texto, asignaturas = []) {
  const e = normalizarHorarioTop(estado);
  const q = (texto || '').trim().toLowerCase();
  if (!q) return null;
  return e.actividades.find((a) => nombreDeActividad(a, asignaturas).toLowerCase() === q) || null;
}

export function sugerencias(estado, texto, { asignaturas = [], limite = 5 } = {}) {
  const e = normalizarHorarioTop(estado);
  const q = (texto || '').trim().toLowerCase();
  if (!q) return [];
  const vistos = new Set();
  const salida = [];

  const meter = (id, nombre, origen) => {
    const clave = nombre.toLowerCase();
    if (vistos.has(clave)) return;
    vistos.add(clave);
    salida.push({ id, nombre, origen });
  };

  // Las actividades del horario primero: son las que ya tienen color e icono.
  for (const a of e.actividades) {
    const n = nombreDeActividad(a, asignaturas);
    if (n.toLowerCase().startsWith(q)) meter(a.id, n, 'horario');
  }
  // Y después las de Estudios que todavía no están en el horario.
  for (const s of asignaturas || []) {
    if ((s.nombre || '').toLowerCase().startsWith(q)) meter(s.id, s.nombre, 'estudios');
  }
  return salida.slice(0, limite);
}

/** Un color que no esté ya en uso, y si están todos, el que menos se repite. */
export function colorAutomatico(estado, paleta = PALETA_ACTIVIDADES) {
  const e = normalizarHorarioTop(estado);
  const uso = new Map(paleta.map((c) => [c, 0]));
  for (const a of e.actividades) if (uso.has(a.color)) uso.set(a.color, uso.get(a.color) + 1);
  let mejor = paleta[0];
  for (const [color, n] of uso) if (n < uso.get(mejor)) mejor = color;
  return mejor;
}

/* Apartado 30 — la paleta de las actividades. **No son colores de interfaz**:
   son un dato de la asignatura, como en el Armario el color de una prenda. Por
   eso viven aquí y no en `tokens.js`, y por eso la regla invariante de los hex
   sueltos excluye este archivo igual que excluye `armario.js`. */
export const PALETA_ACTIVIDADES = [
  '#5C7E9A', '#6270A0', '#4F9494', '#5E8C6A', '#A88B4A',
  '#B07156', '#9A5C7E', '#7E5C9A', '#4A7BA8', '#8C7A5E',
];

/**
 * Apartado 20 — editar un bloque. Y aquí entra **lo más delicado de la fase**
 * (apartados 52 y 53): el alcance.
 */
export const ALCANCES = {
  SOLO_ESTE_DIA: 'solo_este_dia',
  TODOS: 'todos',
};

/**
 * *"Matemáticas normalmente lunes 08:00. El usuario puede seleccionar «solo este
 * lunes» y cambiarlo a 09:00. **No deberá modificar todos los lunes.**"*
 *
 * `alcance` es obligatorio y no tiene valor por defecto: si no se dice, no se
 * escribe. Un defecto silencioso sería justo el error que el apartado quiere
 * evitar, y sería irreversible sin darse cuenta.
 */
export function editarBloque(estado, bloqueId, cambios = {}, { alcance = null, fecha = null, forzar = false, motivo = '' } = {}) {
  const e = normalizarHorarioTop(estado);
  const bloque = e.bloques.find((b) => b.id === bloqueId);
  if (!bloque) return { estado: e, error: 'Ese bloque ya no existe.' };
  if (!alcance) return { estado: e, error: 'Falta decir si el cambio es solo de este día o de todos.' };

  if (alcance === ALCANCES.SOLO_ESTE_DIA) {
    if (!fecha) return { estado: e, error: 'Falta la fecha del cambio.' };
    // Un cambio de un día es una EXCEPCIÓN, no una edición: el horario base no
    // se toca, y el martes que viene sigue como estaba (HT F1, apartado 5).
    const previa = e.excepciones.find((x) => x.fecha === fecha && x.bloqueId === bloqueId && x.tipo === 'modificado');
    const excepcion = crearExcepcion({
      fecha, tipo: 'modificado', bloqueId, horarioId: bloque.horarioId, motivo,
      cambios: { ...previa?.cambios, ...cambios },
    });
    return {
      estado: { ...e, excepciones: [...e.excepciones.filter((x) => x.id !== previa?.id), excepcion] },
      excepcion, error: null,
    };
  }

  const nuevo = normalizarBloque({ ...bloque, ...cambios, id: bloque.id, actualizadoEn: new Date().toISOString() });
  if (!duracionMinutos(nuevo.inicio, nuevo.fin)) return { estado: e, error: 'Esas horas no son válidas.' };
  const choques = conflictosCon(e, nuevo, { ignorarId: bloque.id });
  if (choques.length && !forzar) return { estado: e, error: 'Ahí ya hay otra cosa.', conflictos: choques };

  return { estado: { ...e, bloques: e.bloques.map((b) => (b.id === bloqueId ? nuevo : b)) }, bloque: nuevo, error: null };
}

/**
 * Apartados 25 y 26 — mover. El arrastre y el "Mover a…" acaban aquí los dos,
 * así que se comportan igual: *"los gestos nunca serán la única forma de
 * realizar una acción importante"*.
 */
export function moverBloque(estado, bloqueId, { columnaId = null, inicio = null, fin = null, forzar = false } = {}) {
  const e = normalizarHorarioTop(estado);
  const bloque = e.bloques.find((b) => b.id === bloqueId);
  if (!bloque) return { estado: e, error: 'Ese bloque ya no existe.' };

  const destino = {
    columnaId: columnaId || bloque.columnaId,
    inicio: normalizarHora(inicio) || bloque.inicio,
    fin: normalizarHora(fin) || bloque.fin,
  };
  // Mover conserva la duración si solo se da la hora de inicio: arrastrar una
  // clase de una hora a otro sitio no puede convertirla en una de diez minutos.
  if (inicio && !fin) destino.fin = sumarMinutos(destino.inicio, duracionMinutos(bloque.inicio, bloque.fin));

  return editarBloque(e, bloqueId, destino, { alcance: ALCANCES.TODOS, forzar });
}

/**
 * Apartado 21 — duplicar. *"El sistema creará el nuevo bloque utilizando la
 * misma actividad."* La misma, no una copia: es lo que hace que cambiar el color
 * de Matemáticas lo cambie en los cuatro días a la vez.
 */
export function duplicarBloque(estado, bloqueId, { columnaId = null, inicio = null, forzar = false, hoy = todayISO() } = {}) {
  const e = normalizarHorarioTop(estado);
  const bloque = e.bloques.find((b) => b.id === bloqueId);
  if (!bloque) return { estado: e, error: 'Ese bloque ya no existe.' };

  const i = normalizarHora(inicio) || bloque.inicio;
  const copia = normalizarBloque({
    ...bloque, id: uid(),
    columnaId: columnaId || bloque.columnaId,
    inicio: i,
    fin: sumarMinutos(i, duracionMinutos(bloque.inicio, bloque.fin)),
    creadoEn: hoy, actualizadoEn: hoy,
  });
  const choques = conflictosCon(e, copia);
  if (choques.length && !forzar) return { estado: e, error: 'Ahí ya hay otra cosa.', conflictos: choques };
  return { estado: { ...e, bloques: [...e.bloques, copia] }, bloque: copia, error: null };
}

export function eliminarBloque(estado, bloqueId) {
  const e = normalizarHorarioTop(estado);
  return {
    ...e,
    bloques: e.bloques.filter((b) => b.id !== bloqueId),
    // Sus excepciones se van con él: sin bloque no significan nada.
    excepciones: e.excepciones.filter((x) => x.bloqueId !== bloqueId),
  };
}

/* ===========================================================================
   6 · OPERACIONES DE DÍA (apartados 23 y 24)
   =========================================================================== */

/** *"Duplicar día: el sistema copiará toda la estructura."* */
export function duplicarDia(estado, horarioId, origenColumnaId, destinoColumnaId, { hoy = todayISO(), forzar = false } = {}) {
  const e = normalizarHorarioTop(estado);
  const aCopiar = e.bloques.filter((b) => b.horarioId === horarioId && b.columnaId === origenColumnaId);
  if (!aCopiar.length) return { estado: e, error: 'Ese día está vacío.', copiados: 0 };

  const yaHay = e.bloques.filter((b) => b.horarioId === horarioId && b.columnaId === destinoColumnaId);
  if (yaHay.length && !forzar) {
    // No se mezcla en silencio: duplicar el lunes sobre un martes que ya tiene
    // clases dejaría un día con el doble de bloques solapados.
    return { estado: e, error: `Ese día ya tiene ${yaHay.length} ${yaHay.length === 1 ? 'bloque' : 'bloques'}.`, copiados: 0, existentes: yaHay.length };
  }

  const copias = aCopiar.map((b) => normalizarBloque({ ...b, id: uid(), columnaId: destinoColumnaId, creadoEn: hoy, actualizadoEn: hoy }));
  // Forzar sustituye, no acumula: es lo que espera quien dice "haz el martes
  // igual que el lunes".
  const resto = forzar ? e.bloques.filter((b) => !(b.horarioId === horarioId && b.columnaId === destinoColumnaId)) : e.bloques;
  return { estado: { ...e, bloques: [...resto, ...copias] }, copiados: copias.length, error: null };
}

/** *"Vaciar día"* — con el número por delante, para poder avisar (apartado 24). */
export function vaciarDia(estado, horarioId, columnaId) {
  const e = normalizarHorarioTop(estado);
  const ids = new Set(e.bloques.filter((b) => b.horarioId === horarioId && b.columnaId === columnaId).map((b) => b.id));
  return {
    estado: {
      ...e,
      bloques: e.bloques.filter((b) => !ids.has(b.id)),
      excepciones: e.excepciones.filter((x) => !x.bloqueId || !ids.has(x.bloqueId)),
    },
    borrados: ids.size,
  };
}

/* ===========================================================================
   7 · LAS TRES VISTAS (apartados 46, 47, 48 y 49)
   ===========================================================================
   *"La información seguirá procediendo de la misma fuente. **No habrá tres
   horarios independientes.**"*

   Por eso las tres salen de `resolverDia` (HT F1) o de los bloques, y ninguna
   guarda nada suyo. Cambiar una clase la cambia en las tres. */

export const VISTAS_HORARIO = [
  { id: 'semana', label: 'Semana' },
  { id: 'dia', label: 'Día' },
  { id: 'agenda', label: 'Agenda' },
];

/**
 * La cuadrícula de la semana: para cada fila, qué hay en cada columna.
 *
 * Un bloque aparece en la fila con la que **más se solapa**, no en la que
 * coincide exactamente: con franjas irregulares (apartado 14), una clase de
 * 08:00–08:50 no coincide con ninguna fila de una hora, y desaparecería.
 */
export function rejillaSemana(estado, horarioId, { asignaturas = [] } = {}) {
  const e = normalizarHorarioTop(estado);
  const horario = e.horarios.find((h) => h.id === horarioId);
  if (!horario) return { columnas: [], filas: [] };

  const columnas = columnasDe(horario, { soloVisibles: true });
  const filas = filasDe(horario);
  const bloques = e.bloques.filter((b) => b.horarioId === horarioId);

  const celdas = filas.map((fila) => ({
    fila,
    celdas: columnas.map((col) => {
      const dentro = bloques
        .filter((b) => b.columnaId === col.id && seSolapan(b, fila))
        .map((b) => ({ bloque: b, solape: solapeMinutos(b, fila) }))
        .sort((a, b) => b.solape - a.solape);
      return {
        columna: col,
        bloques: dentro.map((x) => decorar(e, x.bloque, asignaturas)),
        // Un choque en la misma celda se ve aquí, sin recorrer nada (apartado 29).
        conflicto: dentro.length > 1,
      };
    }),
  }));

  return { columnas, filas, celdas };
}

const solapeMinutos = (a, b) => {
  const i = Math.max(minutosDe(a.inicio) ?? 0, minutosDe(b.inicio) ?? 0);
  const f = Math.min(minutosDe(a.fin) ?? 0, minutosDe(b.fin) ?? 0);
  return Math.max(0, f - i);
};

/** Un bloque con su nombre, color e icono ya resueltos, listo para pintar. */
function decorar(estado, bloque, asignaturas) {
  const act = estado.actividades.find((a) => a.id === bloque.actividadId) || null;
  return {
    ...bloque,
    titulo: act ? nombreDeActividad(act, asignaturas) : (bloque.titulo || 'Sin nombre'),
    color: bloque.colorPropio || act?.color || '',
    icono: bloque.iconoPropio || act?.icono || '',
    // Apartados 54 y 55: *"solo si el usuario ha configurado el aula"*. Vacío
    // se queda vacío, y la pantalla no pinta una fila con nada dentro.
    aula: bloque.ubicacion || act?.ubicacion || '',
    profesor: act?.persona || '',
    actividad: act,
  };
}

/** Apartado 47 — el modo día, para una fecha concreta. Sale de `resolverDia`. */
export function vistaDia(estado, fecha, { asignaturas = [], horarioId = null } = {}) {
  const eventos = resolverDia(estado, fecha, { asignaturas, horarioId });
  return { fecha, dia: diaDeFecha(fecha), nombreDia: DIAS_SEMANA[(diaDeFecha(fecha) || 1) - 1]?.label || '', eventos };
}

/**
 * Apartado 48 — la agenda: varios días seguidos, en cronológico. *"La misma
 * información se mostrará de otra manera."* Los días vacíos se incluyen a
 * propósito: en una agenda, un hueco es información.
 */
export function vistaAgenda(estado, { desde = todayISO(), dias = 7, asignaturas = [], horarioId = null } = {}) {
  const salida = [];
  let fecha = desde;
  for (let i = 0; i < dias; i++) {
    salida.push(vistaDia(estado, fecha, { asignaturas, horarioId }));
    fecha = sumarDia(fecha);
  }
  return salida;
}

const sumarDia = (iso) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('sv-SE');
};

/* ===========================================================================
   8 · IMPORTACIÓN, PREPARADA Y NO CONSTRUIDA (apartados 68, 69 y 70)
   ===========================================================================
   *"**Nunca se deberá permitir que una importación automática modifique el
   horario directamente sin revisión.** IA/Importador → datos detectados →
   PREVISUALIZACIÓN → usuario revisa → confirmar → guardar."*

   La importación es de otra fase. Lo que sí queda es la puerta por la que tendrá
   que entrar, y está hecha de forma que **no se pueda saltar la revisión**:
   `previsualizarImportacion` no escribe nada, y `aplicarImportacion` solo acepta
   lo que salió de ella. */
export function previsualizarImportacion(estado, horarioId, filas = [], { asignaturas = [] } = {}) {
  const e = normalizarHorarioTop(estado);
  const horario = e.horarios.find((h) => h.id === horarioId);
  if (!horario) return { ok: false, motivo: 'Ese horario no existe.', propuestas: [] };

  const columnas = columnasDe(horario);
  const propuestas = (filas || []).map((f, i) => {
    const col = columnas.find((c) => c.dia === f.dia || c.nombre.toLowerCase() === String(f.dia || '').toLowerCase());
    const inicio = normalizarHora(f.inicio);
    const fin = normalizarHora(f.fin);
    const problemas = [];
    if (!col) problemas.push('No hay columna para ese día.');
    if (!duracionMinutos(inicio, fin)) problemas.push('Las horas no son válidas.');
    if (!(f.nombre || '').trim()) problemas.push('Falta el nombre.');
    return {
      indice: i,
      nombre: (f.nombre || '').trim(),
      columnaId: col?.id || null,
      inicio, fin,
      // Se dice si la actividad ya existe: importar un horario entero no puede
      // crear una segunda "Matemáticas" (HT F1, apartado 25).
      actividadExistente: buscarActividad(e, f.nombre, asignaturas)?.id || null,
      problemas,
      ok: problemas.length === 0,
    };
  });
  return { ok: propuestas.some((p) => p.ok), propuestas, validas: propuestas.filter((p) => p.ok).length };
}

export function aplicarImportacion(estado, horarioId, previsualizacion, { asignaturas = [], hoy = todayISO() } = {}) {
  let acc = normalizarHorarioTop(estado);
  let creados = 0;
  for (const p of (previsualizacion?.propuestas || []).filter((x) => x.ok)) {
    const r = crearBloqueRapido(acc, {
      horarioId, columnaId: p.columnaId, inicio: p.inicio, fin: p.fin, texto: p.nombre, asignaturas, forzar: true, hoy,
    });
    if (!r.error) { acc = r.estado; creados++; }
  }
  return { estado: acc, creados };
}

/* ===========================================================================
   9 · RESUMEN DEL EDITOR
   =========================================================================== */
export function resumenEditor(estado, horarioId) {
  const e = normalizarHorarioTop(estado);
  const horario = e.horarios.find((h) => h.id === horarioId);
  if (!horario) return null;
  const bloques = e.bloques.filter((b) => b.horarioId === horarioId);
  const conConflicto = new Set();
  for (const b of bloques) for (const c of conflictosCon(e, b, { ignorarId: b.id })) conConflicto.add(c.id);
  return {
    columnas: horario.columnas.length,
    visibles: horario.columnas.filter((c) => c.visible !== false).length,
    filas: horario.filas.length,
    bloques: bloques.length,
    actividades: new Set(bloques.map((b) => b.actividadId).filter(Boolean)).size,
    conflictos: conConflicto.size,
  };
}
