// ============================================================================
// HT · Fase 2/12 — MODELO DE DATOS, CLOUD Y SUPABASE
//
// *"El objetivo no es crear simplemente una tabla llamada horarios. El objetivo
// es construir una estructura capaz de soportar múltiples horarios, asignaturas,
// bloques, calendario, tareas, excepciones, material, mochila, recurrencias,
// prioridades, notificaciones, sincronización, IA, historial y varios
// dispositivos."* (apartado 1)
//
// ── EL APARTADO QUE DECIDE DÓNDE VA TODO (el 51) ───────────────────────────
//
// *"HORARIO TOP no podrá crear una arquitectura incompatible con los demás
// módulos. Antes de implementar las tablas definitivas se deberá comprobar:
// nombres de tablas, convenciones de IDs, autenticación, RLS, timestamps,
// estructura de usuarios, sistema de almacenamiento, patrones de Supabase
// existentes, sistema de sincronización. **La implementación final deberá
// adaptarse a la arquitectura global del Sistema Personal.**"*
//
// Comprobado, y esta es la conclusión: **JosStyle no tiene una tabla por
// entidad.** Tiene UNA, `app_data`, una fila por usuario y clave, con RLS por
// `auth.uid()`, que usan los veintiún módulos. Las trece tablas que propone el
// apartado 45 serían el segundo sistema de persistencia del proyecto y trece
// bloques de SQL que Josué tendría que ejecutar a mano desde el iPhone.
//
// Así que se adaptan, que es lo que el apartado 51 manda. Cada "tabla"
// conceptual es una lista dentro de la clave `horarioTop`, y lo que en
// PostgreSQL serían restricciones son aquí funciones que se ejecutan de verdad:
//
//   apartado 3, 33-35 · user_id y RLS   → las políticas de `app_data`, y el
//                                          modelo **no tiene campo user_id**:
//                                          no hay ninguno que falsear.
//   apartado 4 · UUID                    → `uid()`, el mismo de toda la app.
//   apartado 36 · índices                → `construirIndices()`, mapas que se
//                                          calculan una vez por consulta.
//   apartado 37 · created_at/updated_at  → en cada entidad, desde HT F1.
//   apartado 38 · soft delete            → **la papelera de ME F3**, que ya es
//                                          el borrado reversible del proyecto.
//                                          Un `deleted_at` propio sería un
//                                          segundo sistema de recuperación.
//   apartado 49 · validaciones           → `validar*`, aquí abajo.
//
// ── LO QUE ESTA FASE NO CONSTRUYE (apartado 53) ────────────────────────────
//
// Ni editor visual, ni cuadrícula interactiva, ni drag & drop, ni interfaz, ni
// mochila inteligente, ni notificaciones, ni automatizaciones de IA. De la
// mochila y del calendario queda **el modelo y la derivación**, que es lo que
// los apartados 27, 28 y 31 piden expresamente: que sean *"una consecuencia de
// los datos existentes y no una lista completamente independiente"*.
// ============================================================================

import { uid, todayISO, addDays } from './helpers';
import {
  normalizarHorarioTop, normalizarHorarioObj, normalizarActividad, normalizarBloque,
  resolverDia, lineaDelDia, horarioVigente, fechaValida, normalizarHora,
  duracionMinutos, prioridad, pesoPrioridad, nombreDeActividad, diaDeFecha,
} from './horario';

/* ===========================================================================
   1 · MATERIALES (apartados 25 y 26)
   ===========================================================================
   *"No todos los materiales pertenecen exclusivamente a una asignatura. Por ello
   se recomienda una tabla intermedia: subject_materials, con quantity, required
   y notes."*

   Es una mejora real sobre HT F1, donde el material era una lista de textos
   dentro de la actividad. Con textos, "Libreta" en Biología y "Libreta" en
   Matemáticas eran dos cosas distintas que solo se parecían al escribirlas; con
   entidades son la misma, y la mochila puede decir *"una libreta, para las dos"*
   en vez de pedir dos.

   Y el enlace lleva `obligatorio`, que es lo que separa *"tienes que llevarlo"*
   de *"si acaso"* — sin eso la mochila de un día con cinco clases sería una
   lista de veinte cosas sin jerarquía. */

export const TIPOS_MATERIAL = [
  { id: 'libro', label: 'Libro' },
  { id: 'libreta', label: 'Libreta' },
  { id: 'material', label: 'Material' },
  { id: 'ropa', label: 'Ropa' },
  { id: 'dispositivo', label: 'Dispositivo' },
  { id: 'otro', label: 'Otro' },
];

export function crearMaterial({ nombre = '', tipo = 'otro', icono = '', color = '', descripcion = '', hoy = todayISO() } = {}) {
  return normalizarMaterial({ id: uid(), nombre, tipo, icono, color, descripcion, activo: true, creadoEn: hoy, actualizadoEn: hoy });
}

export function normalizarMaterial(guardado) {
  const g = guardado || {};
  return {
    id: g.id || uid(),
    nombre: (g.nombre || '').trim(),
    tipo: TIPOS_MATERIAL.some((t) => t.id === g.tipo) ? g.tipo : 'otro',
    icono: (g.icono || '').trim(),
    color: (g.color || '').trim(),
    descripcion: (g.descripcion || '').trim(),
    activo: g.activo !== false,
    creadoEn: g.creadoEn || null,
    actualizadoEn: g.actualizadoEn || g.creadoEn || null,
  };
}

/** El enlace actividad ↔ material. La "tabla intermedia" del apartado 26. */
export function crearEnlaceMaterial({ actividadId, materialId, cantidad = 1, obligatorio = true, notas = '' } = {}) {
  return normalizarEnlaceMaterial({ id: uid(), actividadId, materialId, cantidad, obligatorio, notas });
}

export function normalizarEnlaceMaterial(guardado) {
  const g = guardado || {};
  const n = Number(g.cantidad);
  return {
    id: g.id || uid(),
    actividadId: g.actividadId || null,
    materialId: g.materialId || null,
    // Una cantidad de cero o negativa no significa nada: si no hace falta, el
    // enlace no existe. Se acota a 1 en vez de guardar un número imposible.
    cantidad: Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1,
    obligatorio: g.obligatorio !== false,
    notas: (g.notas || '').trim(),
  };
}

/* ===========================================================================
   2 · CONFIGURACIÓN DEL USUARIO (apartado 43)
   ===========================================================================
   *"La personalización del horario deberá almacenarse por usuario. Esto
   permitirá personalizar la experiencia sin alterar los datos reales."*

   Solo lo que es del horario. **Densidad y tamaño de texto NO están aquí**
   aunque el apartado los mencione: existen desde la Fase A3 para toda la app, y
   duplicarlos daría dos ajustes que dicen cosas distintas sobre lo mismo. */
export const DEFAULT_CONFIG_HORARIO = {
  vista: 'semana',          // 'semana' | 'dia'
  inicioSemana: 1,          // lunes, como en España
  formato24h: true,
  mostrarAulas: true,
  mostrarIconos: true,
  mostrarColores: true,
  mostrarHuecos: false,
  horarioPorDefecto: null,
};

export function normalizarConfigHorario(guardada) {
  const g = guardada || {};
  const inicio = Number(g.inicioSemana);
  return {
    ...DEFAULT_CONFIG_HORARIO,
    ...g,
    vista: g.vista === 'dia' ? 'dia' : 'semana',
    inicioSemana: inicio >= 1 && inicio <= 7 ? Math.floor(inicio) : 1,
    formato24h: g.formato24h !== false,
    mostrarAulas: g.mostrarAulas !== false,
    mostrarIconos: g.mostrarIconos !== false,
    mostrarColores: g.mostrarColores !== false,
    mostrarHuecos: !!g.mostrarHuecos,
    horarioPorDefecto: g.horarioPorDefecto || null,
  };
}

/* ===========================================================================
   3 · EL ESTADO COMPLETO (apartado 45)
   =========================================================================== */

export const DEFAULT_HORARIO_DATOS = {
  horarios: [],
  actividades: [],
  bloques: [],
  excepciones: [],
  // HT F5 · apartado 64 — los grupos de actividades. Va aquí porque
  // `normalizarDatos` extiende `normalizarHorarioTop`: si una de las dos formas
  // no lo conoce, las dos dejan de describir el mismo estado.
  grupos: [],
  materiales: [],
  enlacesMaterial: [],
  mochila: [],
  // HT F7 — mochilas múltiples, inventario, kits, dependencias y reglas.
  mochilas: [],
  inventario: {},
  kits: [],
  dependencias: {},
  reglas: [],
  // HT F8 — actividades hechas de verdad, reglas y su historial.
  completadas: [],
  automatizaciones: [],
  historialAuto: [],
  config: DEFAULT_CONFIG_HORARIO,
};

export function normalizarDatos(guardado) {
  const g = guardado || {};
  const base = normalizarHorarioTop(g);
  return {
    ...base,
    materiales: (Array.isArray(g.materiales) ? g.materiales : []).map(normalizarMaterial),
    enlacesMaterial: (Array.isArray(g.enlacesMaterial) ? g.enlacesMaterial : [])
      .map(normalizarEnlaceMaterial)
      .filter((x) => x.actividadId && x.materialId),
    // Un item a mano NO tiene `materialId` —no sale de ningún material— así que
    // exigirlo lo borraba en el primer guardado. Lo que hace falta de verdad es
    // que tenga fecha y algo con lo que identificarlo.
    mochila: (Array.isArray(g.mochila) ? g.mochila : []).map(normalizarItemMochila).filter((x) => x.fecha && (x.materialId || x.nombre)),
    config: normalizarConfigHorario(g.config),
  };
}

/* ===========================================================================
   4 · MIGRACIÓN DESDE HT F1
   ===========================================================================
   En F1 el material era `actividad.material: ['Libro', 'Libreta']`. Aquí son
   entidades. La migración convierte los textos en materiales reutilizables **y
   une los repetidos**: si "Libreta" aparecía en tres asignaturas, sale UN
   material con tres enlaces, no tres materiales iguales.

   Es idempotente: pasarla dos veces no duplica nada, porque busca por nombre
   antes de crear. */
export function migrarMaterialesF1(datos) {
  const d = normalizarDatos(datos);
  const materiales = [...d.materiales];
  const enlaces = [...d.enlacesMaterial];
  const porNombre = new Map(materiales.map((m) => [m.nombre.toLowerCase(), m]));

  for (const act of d.actividades) {
    for (const texto of act.material) {
      const clave = texto.toLowerCase();
      let material = porNombre.get(clave);
      if (!material) {
        material = crearMaterial({ nombre: texto });
        materiales.push(material);
        porNombre.set(clave, material);
      }
      const yaEnlazado = enlaces.some((x) => x.actividadId === act.id && x.materialId === material.id);
      if (!yaEnlazado) enlaces.push(crearEnlaceMaterial({ actividadId: act.id, materialId: material.id }));
    }
  }
  // La lista de textos se conserva: es el dato original de Josué y borrarlo
  // haría la migración irreversible. `materialDeActividad` ya prefiere las
  // entidades cuando existen, así que no se lee dos veces.
  return { ...d, materiales, enlacesMaterial: enlaces };
}

/**
 * El material de una actividad, resuelto. **Las entidades mandan**; los textos
 * de F1 son el respaldo para una actividad que aún no se ha migrado.
 */
export function materialDeActividad(datos, actividadId) {
  const d = normalizarDatos(datos);
  const enlaces = d.enlacesMaterial.filter((x) => x.actividadId === actividadId);
  if (enlaces.length) {
    return enlaces
      .map((x) => {
        const m = d.materiales.find((v) => v.id === x.materialId);
        return m && m.activo ? { ...x, nombre: m.nombre, tipo: m.tipo, icono: m.icono } : null;
      })
      .filter(Boolean);
  }
  const act = d.actividades.find((a) => a.id === actividadId);
  return (act?.material || []).map((nombre) => ({ id: null, actividadId, materialId: null, nombre, cantidad: 1, obligatorio: true, notas: '' }));
}

/* ===========================================================================
   5 · LA MOCHILA (apartados 27 y 28)
   ===========================================================================
   *"La mochila será una consecuencia de los datos existentes y no una lista
   completamente independiente."*

   Por eso `mochilaDelDia` **deriva**: horario del día → actividades → material.
   Lo único que se guarda es lo que no se puede derivar — si Josué ya lo ha
   metido en la mochila (`packed`) y lo que haya añadido a mano.

   La mochila inteligente (avisar, recordar, aprender) es la Fase 7. Aquí está
   el modelo, que es lo que el apartado 28 pide. */

export function normalizarItemMochila(guardado) {
  const g = guardado || {};
  return {
    id: g.id || uid(),
    fecha: fechaValida(g.fecha),
    materialId: g.materialId || null,
    nombre: (g.nombre || '').trim(),
    metido: !!g.metido,
    // Un item a mano no viene de ninguna actividad; uno derivado sí, y así se
    // puede decir para qué hace falta sin volver a recorrer el horario.
    origenActividadId: g.origenActividadId || null,
    manual: !!g.manual,
  };
}

export function mochilaDelDia(datos, fecha, { asignaturas = [], soloObligatorio = false, consumibles = null } = {}) {
  const d = normalizarDatos(datos);
  const eventos = resolverDia(d, fecha, { asignaturas });
  const guardados = d.mochila.filter((m) => m.fecha === fecha);

  const porClave = new Map();
  for (const ev of eventos) {
    if (!ev.actividadId) continue;
    for (const m of materialDeActividad(d, ev.actividadId)) {
      if (soloObligatorio && !m.obligatorio) continue;
      const clave = m.materialId || `texto:${m.nombre.toLowerCase()}`;
      const previo = porClave.get(clave);
      if (previo) {
        // "Libreta, para Biología y Matemáticas" — no dos libretas. Es lo que
        // separa una mochila útil de una lista de veinte cosas repetidas.
        previo.para.push(ev.titulo);
        // HT F7 · apartado 61 — con los CONSUMIBLES es al revés: dos hojas y
        // tres hojas SON cinco hojas. `consumibles` lo aporta `mochila.js`,
        // que es quien tiene el inventario.
        previo.cantidad = consumibles?.has(m.materialId)
          ? previo.cantidad + m.cantidad
          : Math.max(previo.cantidad, m.cantidad);
        previo.obligatorio = previo.obligatorio || m.obligatorio;
      } else {
        porClave.set(clave, {
          materialId: m.materialId,
          nombre: m.nombre,
          cantidad: m.cantidad,
          obligatorio: m.obligatorio,
          para: [ev.titulo],
          origenActividadId: ev.actividadId,
        });
      }
    }
  }

  const derivados = [...porClave.values()].map((x) => {
    const guardado = guardados.find((g) => (g.materialId && g.materialId === x.materialId) || (!g.materialId && g.nombre.toLowerCase() === x.nombre.toLowerCase()));
    return { ...x, para: [...new Set(x.para)].sort(), metido: !!guardado?.metido, manual: false, id: guardado?.id || null };
  });

  // Lo añadido a mano ese día, que no sale de ninguna clase.
  const manuales = guardados
    .filter((g) => g.manual)
    .map((g) => ({ materialId: g.materialId, nombre: g.nombre, cantidad: 1, obligatorio: true, para: [], metido: g.metido, manual: true, id: g.id }));

  return [...derivados, ...manuales].sort((a, b) => (b.obligatorio - a.obligatorio) || a.nombre.localeCompare(b.nombre, 'es'));
}

/** Marcar o desmarcar algo de la mochila. Lo único que la mochila guarda. */
export function marcarEnMochila(datos, fecha, { materialId = null, nombre = '', metido = true, manual = false, origenActividadId = null } = {}) {
  const d = normalizarDatos(datos);
  const coincide = (m) => m.fecha === fecha && ((materialId && m.materialId === materialId) || (!materialId && m.nombre.toLowerCase() === (nombre || '').trim().toLowerCase()));
  const resto = d.mochila.filter((m) => !coincide(m));
  const previo = d.mochila.find(coincide);
  return {
    ...d,
    mochila: [...resto, normalizarItemMochila({
      id: previo?.id, fecha, materialId, nombre, metido, manual: manual || previo?.manual, origenActividadId,
    })],
  };
}

/**
 * La mochila guarda un item por día, así que crece sin fin. Esto la poda.
 * Lo derivado no se pierde —se vuelve a derivar—; lo que se olvida es solo el
 * "ya lo he metido" de días que pasaron.
 */
export function podarMochila(datos, { hoy = todayISO(), diasAtras = 30 } = {}) {
  const d = normalizarDatos(datos);
  const limite = addDays(hoy, -diasAtras);
  return { ...d, mochila: d.mochila.filter((m) => m.fecha >= limite) };
}

/* ===========================================================================
   6 · EL CALENDARIO (apartados 20, 21 y 22)
   ===========================================================================
   *"HORARIO TOP deberá integrarse con el sistema global de calendario. **No se
   recomienda crear un calendario completamente independiente.**"* Y el apartado
   22: *"Un bloque recurrente del horario no debería convertirse automáticamente
   en miles de registros físicos."*

   JosStyle ya tiene ese calendario común: `calendarioIntegracion.js`, donde cada
   módulo aporta eventos DERIVADOS con `origen` y `origenId` —exactamente los
   `source` y `source_id` del apartado 21— y el Calendario nunca los guarda
   (regla 11 del proyecto).

   Así que esto no crea `calendar_events`: produce la aportación del horario a la
   tabla que ya existe, calculada al vuelo para el rango que se pida. */
export function eventosDeHorario(datos, { asignaturas = [], desde = todayISO(), dias = 14 } = {}) {
  const d = normalizarDatos(datos);
  const salida = [];
  for (let i = 0; i < dias; i++) {
    const fecha = addDays(desde, i);
    for (const ev of resolverDia(d, fecha, { asignaturas })) {
      salida.push({
        // Sin id propio: es derivado. El id estable es el del bloque más la
        // fecha, que es lo que permite reconocerlo entre renders sin guardarlo.
        id: `horario:${ev.bloqueId || 'extra'}:${fecha}`,
        fecha,
        hora: ev.inicio,
        horaFin: ev.fin,
        titulo: ev.titulo,
        lugar: ev.ubicacion,
        origen: 'horario',
        origenId: ev.bloqueId || null,
        color: ev.color,
        prioridad: ev.prioridad,
        cambiado: ev.origen !== 'horario',
      });
    }
  }
  return salida;
}

/* ===========================================================================
   7 · HOY, CON TODAS LAS FUENTES (apartados 31 y 32)
   ===========================================================================
   *"HOY no debería tener una tabla independiente con copias de todos los datos.
   Será una vista lógica/agregadora."*

   El ejemplo del apartado 32 mezcla horario, calendario, tareas y recordatorios
   en una sola experiencia. Las fuentes de fuera se pasan como parámetro en vez
   de importarlas: así este módulo no depende de Productividad ni de Estudios, y
   la Fase 6 podrá añadir fuentes **sin tocar esta función**.

   Se ordena por hora, y lo que no tiene hora va al final agrupado — que es como
   se lee una agenda, no intercalado a las 00:00. */
export function agendaDelDia(datos, fecha, { asignaturas = [], ahora = null, tareas = [], eventos = [], recordatorios = [] } = {}) {
  const d = normalizarDatos(datos);
  const linea = lineaDelDia(d, fecha, { asignaturas, ahora });

  const conHora = [];
  const sinHora = [];
  const meter = (item) => (normalizarHora(item.hora) ? conHora : sinHora).push(item);

  for (const ev of linea.eventos) {
    conHora.push({ tipo: 'clase', hora: ev.inicio, horaFin: ev.fin, titulo: ev.titulo, lugar: ev.ubicacion, prioridad: ev.prioridad, color: ev.color, cambiado: ev.origen !== 'horario' });
  }
  for (const t of tareas) meter({ tipo: 'tarea', hora: t.hora || '', titulo: t.titulo, prioridad: t.prioridad || 'normal', fuente: t.fuente || null });
  for (const e of eventos) meter({ tipo: 'evento', hora: e.hora || '', horaFin: e.horaFin || '', titulo: e.titulo, lugar: e.lugar || '', prioridad: e.prioridad || 'normal' });
  for (const r of recordatorios) meter({ tipo: 'recordatorio', hora: r.hora || '', titulo: r.titulo, prioridad: r.prioridad || 'normal' });

  conHora.sort((a, b) => (normalizarHora(a.hora) || '').localeCompare(normalizarHora(b.hora) || '') || pesoPrioridad(b.prioridad) - pesoPrioridad(a.prioridad));
  // Lo que no tiene hora se ordena por importancia: es lo que hace que HOY
  // "no muestre simplemente una lista enorme" (apartado 15 de F1).
  sinHora.sort((a, b) => pesoPrioridad(b.prioridad) - pesoPrioridad(a.prioridad));

  return {
    fecha,
    libre: linea.libre,
    enCurso: linea.enCurso,
    siguiente: linea.siguiente,
    conHora,
    sinHora,
    total: conHora.length + sinHora.length,
    material: mochilaDelDia(d, fecha, { asignaturas }),
  };
}

/* ===========================================================================
   8 · ÍNDICES (apartado 36)
   ===========================================================================
   *"Se deberán preparar índices para las consultas más frecuentes: user_id,
   schedule_id, date, start_at, subject_id, is_active."*

   En una tabla de Postgres son índices; aquí, mapas. El efecto es el mismo y el
   motivo también: que HOY siga siendo rápido cuando haya tres cursos de
   historial. `user_id` no está porque no existe — todo el estado es del usuario
   autenticado (apartado 3). */
export function construirIndices(datos) {
  const d = normalizarDatos(datos);
  const bloquesPorHorario = new Map();
  const bloquesPorColumna = new Map();
  const bloquesPorActividad = new Map();
  const excepcionesPorFecha = new Map();
  const materialPorActividad = new Map();

  const meter = (mapa, clave, valor) => {
    if (!clave) return;
    if (!mapa.has(clave)) mapa.set(clave, []);
    mapa.get(clave).push(valor);
  };

  for (const b of d.bloques) {
    meter(bloquesPorHorario, b.horarioId, b);
    meter(bloquesPorColumna, b.columnaId, b);
    meter(bloquesPorActividad, b.actividadId, b);
  }
  for (const x of d.excepciones) meter(excepcionesPorFecha, x.fecha, x);
  for (const l of d.enlacesMaterial) meter(materialPorActividad, l.actividadId, l);

  return {
    bloquesPorHorario, bloquesPorColumna, bloquesPorActividad, excepcionesPorFecha, materialPorActividad,
    horariosActivos: d.horarios.filter((h) => h.activo),
    actividadesActivas: d.actividades.filter((a) => a.estado === 'activa'),
  };
}

/* ===========================================================================
   9 · VALIDACIONES (apartado 49)
   ===========================================================================
   *"El backend deberá validar: horarios pertenecientes al usuario, fechas
   válidas, horas válidas, relaciones existentes, permisos, entidades activas,
   conflictos cuando corresponda. La interfaz puede ayudar al usuario, pero el
   backend deberá ser la autoridad final."*

   Aquí no hay backend propio: la autoridad final es Supabase con su RLS, que ya
   impide tocar la fila de otro. Lo que sí puede —y debe— comprobarse antes de
   escribir es la coherencia, y eso es esto. Devuelven el motivo, no lanzan, para
   que la interfaz pueda decirlo con una frase corta (regla 8).

   "Pertenece al usuario" no se valida porque **no puede fallar**: el estado ES
   el del usuario autenticado, no hay otro del que sacar un horario. */

export function validarBloque(datos, bloque) {
  const d = normalizarDatos(datos);
  const b = normalizarBloque(bloque);
  const horario = d.horarios.find((h) => h.id === b.horarioId);
  if (!horario) return { ok: false, motivo: 'Ese horario no existe.' };
  if (!horario.columnas.some((c) => c.id === b.columnaId)) return { ok: false, motivo: 'Esa columna no es de este horario.' };
  if (!b.inicio || !b.fin) return { ok: false, motivo: 'Falta la hora de inicio o de fin.' };
  if (!duracionMinutos(b.inicio, b.fin)) return { ok: false, motivo: 'La hora de fin tiene que ser posterior a la de inicio.' };
  if (b.actividadId && !d.actividades.some((a) => a.id === b.actividadId)) return { ok: false, motivo: 'Esa actividad ya no existe.' };
  if (b.filaId && !horario.filas.some((f) => f.id === b.filaId)) return { ok: false, motivo: 'Esa franja no es de este horario.' };
  return { ok: true };
}

export function validarExcepcion(datos, excepcion) {
  const d = normalizarDatos(datos);
  const x = excepcion || {};
  if (!fechaValida(x.fecha)) return { ok: false, motivo: 'Esa fecha no es válida.' };
  if (x.tipo !== 'dia_libre' && x.tipo !== 'anadido' && !d.bloques.some((b) => b.id === x.bloqueId)) {
    return { ok: false, motivo: 'Ese bloque ya no existe.' };
  }
  const i = x.cambios?.inicio; const f = x.cambios?.fin;
  if ((i || f) && !duracionMinutos(i, f)) return { ok: false, motivo: 'Las horas del cambio no son válidas.' };
  if (x.tipo === 'anadido' && !(x.cambios?.titulo || x.cambios?.actividadId)) {
    return { ok: false, motivo: 'Dile qué se añade.' };
  }
  return { ok: true };
}

export function validarHorario(datos, horario) {
  const d = normalizarDatos(datos);
  // El nombre se mira en el objeto CRUDO: `normalizarHorarioObj` lo rellena con
  // la etiqueta del tipo cuando viene vacío, así que después de normalizar nunca
  // falta y la comprobación no encontraría nunca nada. Misma trampa que la
  // revisión de integridad de RA F2.
  if (!(horario?.nombre || '').trim()) return { ok: false, motivo: 'Ponle un nombre.' };
  const h = normalizarHorarioObj(horario);
  if (h.desde && h.hasta && h.hasta < h.desde) return { ok: false, motivo: 'La fecha de fin es anterior a la de inicio.' };
  const repe = d.horarios.some((x) => x.id !== h.id && x.nombre.toLowerCase() === h.nombre.toLowerCase());
  if (repe) return { ok: false, motivo: 'Ya tienes un horario con ese nombre.' };
  return { ok: true };
}

/* ===========================================================================
   10 · CONFLICTOS ENTRE DISPOSITIVOS (apartados 39 y 40)
   ===========================================================================
   *"Dispositivo A modifica Matemáticas → 09:00. Dispositivo B modifica
   Matemáticas → 10:00. La arquitectura deberá tener información suficiente para
   detectar el conflicto. **No se deberá sobrescribir información silenciosamente
   sin criterio.**"*

   La información suficiente es `actualizadoEn`, que cada entidad guarda desde
   HT F1. Con eso se puede decir *"esto lo cambió otro dispositivo después de que
   tú lo abrieras"* antes de escribir encima.

   Detecta y avisa. **No resuelve**: la política de resolución es una decisión de
   producto —quién gana, o si se pregunta— y el apartado la deja para después. */
export function detectarConflicto(local, remoto) {
  const a = local || {};
  const b = remoto || {};
  if (!a.id || a.id !== b.id) return null;
  const ta = a.actualizadoEn || a.creadoEn || '';
  const tb = b.actualizadoEn || b.creadoEn || '';
  if (!ta || !tb || ta === tb) return null;
  // Los campos que de verdad chocan. Comparar el objeto entero daría conflicto
  // por un `actualizadoEn` distinto, que es precisamente lo que se está usando
  // para detectarlo.
  const campos = ['inicio', 'fin', 'titulo', 'actividadId', 'columnaId', 'ubicacion', 'nombre'];
  const distintos = campos.filter((c) => c in a && c in b && a[c] !== b[c]);
  if (!distintos.length) return null;
  return { id: a.id, campos: distintos, masReciente: tb > ta ? 'remoto' : 'local', local: ta, remoto: tb };
}

/** Los conflictos de dos listas. Para una sincronización futura. */
export function conflictosEntre(locales, remotos) {
  const porId = new Map((remotos || []).map((r) => [r.id, r]));
  return (locales || []).map((l) => detectarConflicto(l, porId.get(l.id))).filter(Boolean);
}

/* ===========================================================================
   11 · BORRADO REVERSIBLE (apartado 38)
   ===========================================================================
   *"Para determinadas entidades será preferible no eliminarlas físicamente
   inmediatamente. Se podrá utilizar `deleted_at`."*

   El proyecto ya tiene su borrado reversible: **la papelera de ME F3**, con
   retención configurable, restauración y purga. Un `deleted_at` propio del
   horario sería un segundo sistema de recuperación con sus propias reglas — y el
   apartado 51 dice explícitamente que hay que adaptarse a lo que existe.

   Esto es lo que la papelera necesita saber del horario. Registrar las
   colecciones en `CATALOGO_PAPELERA` es lo único que hace falta para que
   funcionen el borrar, el restaurar y la retención. */
export const COLECCIONES_PAPELERA_HORARIO = [
  { modulo: 'horarioTop', coleccion: 'horarios', tipo: 'Horario', campos: ['nombre'] },
  { modulo: 'horarioTop', coleccion: 'actividades', tipo: 'Actividad', campos: ['nombre'] },
  { modulo: 'horarioTop', coleccion: 'bloques', tipo: 'Bloque', campos: ['titulo'] },
  { modulo: 'horarioTop', coleccion: 'materiales', tipo: 'Material', campos: ['nombre'] },
];

/* ===========================================================================
   12 · RESUMEN DEL MODELO, PARA LA DOCUMENTACIÓN VIVA
   ===========================================================================
   El apartado 52 pide dejar definido el modelo técnico. Esta función lo dice
   **leyendo el estado real**, no una lista escrita a mano que se quedaría
   desfasada en la primera fase que añada una entidad. */
export function describirModelo(datos) {
  const d = normalizarDatos(datos);
  return [
    { entidad: 'horarios', n: d.horarios.length, clave: 'id', relacion: null },
    { entidad: 'columnas', n: d.horarios.reduce((n, h) => n + h.columnas.length, 0), clave: 'id', relacion: 'horarios' },
    { entidad: 'filas', n: d.horarios.reduce((n, h) => n + h.filas.length, 0), clave: 'id', relacion: 'horarios' },
    { entidad: 'actividades', n: d.actividades.length, clave: 'id', relacion: 'estudios.asignaturas' },
    { entidad: 'bloques', n: d.bloques.length, clave: 'id', relacion: 'horarios + columnas + actividades' },
    { entidad: 'excepciones', n: d.excepciones.length, clave: 'id', relacion: 'bloques' },
    { entidad: 'materiales', n: d.materiales.length, clave: 'id', relacion: null },
    { entidad: 'enlacesMaterial', n: d.enlacesMaterial.length, clave: 'actividadId+materialId', relacion: 'actividades + materiales' },
    { entidad: 'mochila', n: d.mochila.length, clave: 'fecha+materialId', relacion: 'materiales' },
  ];
}

export { horarioVigente, nombreDeActividad, diaDeFecha, prioridad };
