// ══════════════════════════════════════════════════════════════════════════
// ENTREGA 3 · FASE 28 (PR F6) — PRODUCTIVIDAD: RUTINAS
// ══════════════════════════════════════════════════════════════════════════
//
// *"Una rutina no debe ser simplemente una lista de tareas. Debe ser una
//  secuencia reutilizable de acciones que el usuario pueda ejecutar cuando
//  quiera o según una programación."*
//
// 🚨 **LA PLANTILLA NO SE TOCA AL EJECUTAR, Y ÉSE ES EL FALLO QUE ARREGLA.**
//
//    Lo que había desde la Fase 6 era una lista con `pasos: [{ texto, hecho }]`
//    y un botón de *Reiniciar*: el paso guardaba **dentro de la plantilla** si
//    estaba hecho, así que **hacer la rutina el martes borraba lo del lunes** y
//    no quedaba historial de nada. El enunciado lo prohíbe con estas palabras:
//    *"Una rutina NO debe crear copias permanentes… La ejecución debe generar
//    un registro de ejecución. Los elementos originales permanecen como
//    plantillas."*
//
//    Ahora son **dos listas**: `rutinas` (las plantillas, sin un solo campo de
//    estado) y `rutinaEjecuciones` (lo que pasó). `normalizarPaso` **se lleva
//    `hecho`** a propósito.
//
// 🚨 **UNA EJECUCIÓN SÍ COPIA EL TÍTULO DE SUS PASOS, Y ES LO CORRECTO.**
//    *"Las modificaciones futuras no deben destruir el historial pasado"*: si la
//    ejecución guardara solo el `pasoId`, renombrar un paso reescribiría el
//    pasado y borrarlo dejaría el historial con huecos. Un registro histórico es
//    la única cosa de este proyecto que **debe** llevar copia — porque lo que
//    describe ya no puede cambiar. Se guarda el `pasoId` **también**, para poder
//    volver al paso vivo cuando siga existiendo.
//
// 🚨 **NI UN SEGUNDO MOTOR DE FRECUENCIAS NI UNA SEGUNDA RACHA.** La
//    programación que pide el enunciado —diaria, días concretos, semanal— es
//    **exactamente** `CLASES_REGLA` de `rachas.js`, que la E3 F24 ya amplió con
//    `dias_concretos` y `veces_por_semana`. Y su quinto estado de día, `NO_TOCA`,
//    es literalmente lo que pide esta fase: *"si la rutina no estaba programada
//    para un día concreto, no penalizar la racha"*.
//
//    ⚠️ *"Son sistemas independientes"* se cumple igual: la racha de una rutina
//    y la de un hábito **no se mezclan** —cada una tiene su tipo y su historial—,
//    pero **comparten el motor**, que es lo que impide que dos pantallas digan
//    números distintos (RA F1).
//
// 🚨 **NI UN SEGUNDO TEMPORIZADOR** (*"No crear un segundo temporizador"*): un
//    paso de tipo Pomodoro **abre el Pomodoro que ya existe** (E3 F25). Y el
//    tiempo de una ejecución se calcula **restando instantes**, nunca contando
//    segundos — la lección de la E3 F25, que es la que hace que sobreviva a que
//    el iPhone congele la pestaña.
//
// ⚠️ **REORDENAR ES CON FLECHAS, NO ARRASTRANDO.** El enunciado deja elegir
//    —*"si genera problemas de UX utilizar controles simples de subir/bajar"*— y
//    el proyecto ya lo decidió en EH F50: **las flechas funcionan con el lector
//    de pantalla y el arrastre sería un segundo mecanismo para lo mismo**.

import { todayISO, uid, fechaValida, horaValida, addDays, fechaLocalISO } from './helpers.js';
import {
  CLASES_REGLA, claseDeRegla, describirRegla, normalizarRacha, resumenRacha,
  NOMBRES_DIA, diasDeRegla, diaDeLaSemana, tocaEseDia,
} from './rachas.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const txt = (s) => (typeof s === 'string' ? s : '');
const num = (v, porDefecto = 0) => (Number.isFinite(Number(v)) ? Number(v) : porDefecto);

export { describirRegla, NOMBRES_DIA, diasDeRegla };

/* ══════════════════════════════════════════════════════════════════════════
   LA PLANTILLA
   ══════════════════════════════════════════════════════════════════════════ */

/* Los iconos son emoji **a propósito**: los del Armario son dibujos de Lucide
   porque representan prendas, pero aquí el enunciado enseña `☀️ Rutina de
   mañana` y el icono lo elige Josué de una lista corta. */
export const ICONOS_RUTINA = ['☀️', '🌙', '📚', '🏋️', '🧘', '🚿', '🍳', '💼', '🎯', '🔁'];
export const ICONO_RUTINA_POR_DEFECTO = '🔁';

/* *"Categoría — Opcional."* Cada línea declara su módulo de JosStyle donde lo
   hay, como `CATEGORIAS_TAREA` (E3 F26) y `CATEGORIAS_OBJETIVO` (E3 F27). */
export const CATEGORIAS_RUTINA = [
  { id: 'manana', nombre: 'Mañana', icono: '☀️', modulo: null },
  { id: 'noche', nombre: 'Noche', icono: '🌙', modulo: null },
  { id: 'estudios', nombre: 'Estudios', icono: '📚', modulo: 'estudios' },
  { id: 'fitness', nombre: 'Fitness', icono: '🏋️', modulo: 'calistenia' },
  { id: 'personal', nombre: 'Personal', icono: '🙂', modulo: null },
  { id: 'trabajo', nombre: 'Trabajo', icono: '💼', modulo: 'negocio' },
  { id: 'otros', nombre: 'Otros', icono: '•', modulo: null },
];

export const categoriaRutina = (id) => CATEGORIAS_RUTINA.find((c) => c.id === id) || null;

/* *"Preparar arquitectura para diferentes tipos de paso… No crear una lógica
   duplicada."* Por eso cada tipo declara **a qué mini-app abre** en vez de
   traerse su lógica: un paso de Pomodoro no tiene temporizador, tiene un
   destino. */
export const TIPOS_PASO = [
  {
    id: 'accion', nombre: 'Acción', icono: '•',
    abre: null, campo: null,
    explica: 'Algo que haces y marcas cuando está hecho.',
  },
  {
    id: 'tarea', nombre: 'Tarea', icono: '✅',
    abre: 'tareas', campo: 'tareaId',
    explica: 'Se enlaza con una tarea que ya existe. No se duplica.',
  },
  {
    id: 'pomodoro', nombre: 'Pomodoro', icono: '🍅',
    abre: 'pomodoro', campo: null,
    explica: 'Abre el Pomodoro que ya existe, con la duración del paso.',
  },
  {
    id: 'descanso', nombre: 'Descanso', icono: '☕',
    abre: null, campo: null,
    explica: 'Una pausa dentro del flujo.',
  },
];

export const TIPO_PASO_POR_DEFECTO = 'accion';
export const tipoPaso = (id) => TIPOS_PASO.find((t) => t.id === id) || null;

/* ⚠️ **`habitId` SE DECLARA, NO SE FINGE** (regla 8, y la E3 F20 y la E3 F26 lo
   dijeron antes). *"No es obligatorio implementar la vinculación visual completa
   en esta fase si puede complicar la arquitectura."* El campo existe en el paso
   y aquí está escrito quién lo rellenará; lo que no hay es un botón que prometa
   algo que todavía no hace nada. */
export const VINCULOS_PASO = [
  {
    campo: 'tareaId', hacia: 'productividad.tareas', nombre: 'Tarea',
    enlazable: true,
    porque: 'Un paso puede abrir la tarea que le corresponde. La tarea NO se duplica: se guarda su id.',
  },
  {
    campo: 'habitId', hacia: 'productividad.habitos', nombre: 'Hábito',
    enlazable: false, llega: 'PR F7',
    porque: 'El enunciado lo deja preparado y no obliga a construirlo: la integración global de Productividad es la fase siguiente.',
  },
];

export const vinculoPaso = (campo) => VINCULOS_PASO.find((v) => v.campo === campo) || null;

export function crearPaso({ texto, descripcion = '', minutos = null, tipo = TIPO_PASO_POR_DEFECTO, tareaId = null } = {}) {
  const limpio = txt(texto).trim();
  if (!limpio) return null;
  return normalizarPaso({
    id: uid(), texto: limpio, descripcion: txt(descripcion).trim(),
    minutos: minutos === null || minutos === '' ? null : Math.max(1, num(minutos, 1)),
    tipo: tipoPaso(tipo) ? tipo : TIPO_PASO_POR_DEFECTO,
    tareaId: txt(tareaId) || null,
  });
}

/* 🚨 **`hecho` DESAPARECE, Y ES EL PUNTO DE LA FASE.** Era el campo de la Fase 6
   que guardaba dentro de la plantilla si el paso estaba hecho — así que la
   rutina de ayer y la de hoy eran la misma casilla. Ahora eso vive en la
   ejecución. */
export function normalizarPaso(p) {
  if (!p || typeof p !== 'object') return null;
  const texto = txt(p.texto).trim();
  if (!texto) return null;
  const t = tipoPaso(p.tipo) || tipoPaso(TIPO_PASO_POR_DEFECTO);
  return {
    id: txt(p.id) || uid(),
    texto,
    descripcion: txt(p.descripcion).trim(),
    minutos: Number.isFinite(Number(p.minutos)) && Number(p.minutos) > 0 ? Math.round(Number(p.minutos)) : null,
    tipo: t.id,
    tareaId: txt(p.tareaId) || null,
    // Declarado en `VINCULOS_PASO`, todavía sin pantalla que lo rellene.
    habitId: txt(p.habitId) || null,
  };
}

/* ── La programación (apartado «PROGRAMACIÓN») ─────────────────────────────

   🚨 **Se traduce a una regla de `rachas.js`; no se inventa una escala nueva.**
   *"No crear todavía un sistema de notificaciones independiente. Solo guardar
   correctamente la programación."* */
export const PROGRAMACIONES = [
  { id: 'manual', nombre: 'Sin programación', explica: 'La inicias tú cuando quieras.', clase: null, pideDias: false },
  { id: 'diaria', nombre: 'Diaria', explica: 'Todos los días.', clase: 'diaria', pideDias: false },
  { id: 'dias', nombre: 'Días concretos', explica: 'Los días que elijas.', clase: 'dias_concretos', pideDias: true },
  { id: 'semanal', nombre: 'Semanal', explica: 'Una vez por semana.', clase: 'veces_por_semana', pideDias: false },
];

export const PROGRAMACION_POR_DEFECTO = 'manual';
export const programacion = (id) => PROGRAMACIONES.find((p) => p.id === id) || null;

/** La regla de racha que le corresponde a una rutina. `null` si no está
 *  programada: sin programación **no hay racha que medir**, y decir lo
 *  contrario sería castigarle por no hacer algo que no se comprometió a hacer
 *  (E3 F24). */
export function reglaDeRutina(rutina) {
  const p = programacion(rutina?.programacion?.tipo);
  if (!p || !p.clase) return null;
  if (p.clase === 'dias_concretos') return { clase: 'dias_concretos', dias: diasDeRegla(rutina.programacion) };
  if (p.clase === 'veces_por_semana') return { clase: 'veces_por_semana', veces: 1 };
  return { clase: 'diaria' };
}

export function crearRutina({
  nombre, descripcion = '', icono = ICONO_RUTINA_POR_DEFECTO, categoria = null,
  pasos = [], hoy = todayISO(),
} = {}) {
  const limpio = txt(nombre).trim();
  if (!limpio) return null;
  return normalizarRutina({
    id: uid(), nombre: limpio, descripcion: txt(descripcion).trim(),
    icono: ICONOS_RUTINA.includes(icono) ? icono : ICONO_RUTINA_POR_DEFECTO,
    categoria: categoriaRutina(categoria) ? categoria : null,
    pasos, programacion: { tipo: PROGRAMACION_POR_DEFECTO }, archivada: false, creadaEn: hoy,
  });
}

export function normalizarRutina(r) {
  if (!r || typeof r !== 'object') return null;
  const nombre = txt(r.nombre).trim();
  if (!nombre) return null;
  const prog = r.programacion && typeof r.programacion === 'object' ? r.programacion : {};
  const tipoProg = programacion(prog.tipo) ? prog.tipo : PROGRAMACION_POR_DEFECTO;
  return {
    id: txt(r.id) || uid(),
    nombre,
    descripcion: txt(r.descripcion).trim(),
    icono: ICONOS_RUTINA.includes(r.icono) ? r.icono : ICONO_RUTINA_POR_DEFECTO,
    categoria: categoriaRutina(r.categoria) ? r.categoria : null,
    pasos: lista(r.pasos).map(normalizarPaso).filter(Boolean),
    programacion: {
      tipo: tipoProg,
      dias: lista(prog.dias).map((d) => num(d, -1)).filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b),
      // ⚠️ `horaValida`, no la forma: `'25:99'` encaja con `\d{2}:\d{2}` (E3 F8).
      hora: horaValida(prog.hora) ? prog.hora : '',
    },
    // ⚠️ Archivar NO es eliminar (E3 F5, E3 F18): lo archivado sale de lo activo
    // y su historial se queda entero.
    archivada: !!r.archivada,
    creadaEn: fechaValida(r.creadaEn) ? r.creadaEn : null,
  };
}

export const normalizarRutinas = (arr) => lista(arr).map(normalizarRutina).filter(Boolean);

/** Lo que llama `App.jsx` al cargar. ⚠️ Devuelve `productividad` entero: perder
 *  una clave aquí borraría los hábitos en el siguiente guardado (regla 5). */
export function normalizarRutinasDe(productividad) {
  if (!productividad || typeof productividad !== 'object') return productividad;
  return {
    ...productividad,
    rutinas: normalizarRutinas(productividad.rutinas),
    rutinaEjecuciones: normalizarEjecuciones(productividad.rutinaEjecuciones),
    rutinaEnCurso: normalizarEjecucion(productividad.rutinaEnCurso),
  };
}

export const editarRutina = (r, cambios = {}) => (r ? normalizarRutina({ ...r, ...cambios }) : null);
export const archivarRutina = (r) => (r ? { ...r, archivada: !r.archivada } : null);

/* ── Los pasos: añadir, editar, quitar y mover ─────────────────────────────
   ⚠️ Todas devuelven **la rutina**; quien guarda es `App.jsx` (E3 F26). */
export const anadirPaso = (r, paso) => (r && paso ? { ...r, pasos: [...lista(r.pasos), paso] } : null);
export const editarPaso = (r, pasoId, cambios) => (r
  ? { ...r, pasos: lista(r.pasos).map((p) => (p.id === pasoId ? normalizarPaso({ ...p, ...cambios }) : p)).filter(Boolean) }
  : null);
export const quitarPaso = (r, pasoId) => (r ? { ...r, pasos: lista(r.pasos).filter((p) => p.id !== pasoId) } : null);

/** Subir o bajar un paso. ⚠️ En los extremos devuelve `null`, para que la
 *  pantalla pueda apagar la flecha en vez de ofrecer un botón que no hace nada
 *  (regla 8). */
export function moverPaso(r, pasoId, direccion) {
  const pasos = lista(r?.pasos);
  const i = pasos.findIndex((p) => p.id === pasoId);
  if (i < 0) return null;
  const j = direccion === 'arriba' ? i - 1 : i + 1;
  if (j < 0 || j >= pasos.length) return null;
  const copia = pasos.slice();
  [copia[i], copia[j]] = [copia[j], copia[i]];
  return { ...r, pasos: copia };
}

/** *"5 pasos · ~25 min"*. ⚠️ `null` si **ningún** paso declara duración: un cero
 *  diría que la rutina no lleva tiempo, y lo que pasa es que no se sabe. La
 *  duración es orientativa, y el enunciado lo dice. */
export function duracionEstimada(rutina) {
  const conMinutos = lista(rutina?.pasos).filter((p) => p.minutos);
  if (!conMinutos.length) return null;
  return {
    minutos: conMinutos.reduce((s, p) => s + p.minutos, 0),
    pasosSinTiempo: lista(rutina?.pasos).length - conMinutos.length,
  };
}

export function textoDuracion(rutina) {
  const d = duracionEstimada(rutina);
  const n = lista(rutina?.pasos).length;
  const pasos = `${n} ${n === 1 ? 'paso' : 'pasos'}`;
  if (!d) return pasos;
  return `${pasos} · ~${d.minutos} min`;
}

/* ── La próxima ejecución (apartado «PRÓXIMA RUTINA») ──────────────────── */

export function tocaHoy(rutina, hoy = todayISO()) {
  const regla = reglaDeRutina(rutina);
  if (!regla) return false;
  if (regla.clase === 'veces_por_semana') return true;
  return tocaEseDia(hoy, regla);
}

/** *"Próxima: Hoy · 08:00"*, *"Próxima: Mañana"* o *"Manual"*. */
export function proximaEjecucion(rutina, hoy = todayISO()) {
  const regla = reglaDeRutina(rutina);
  if (!regla) return { texto: 'Manual', programada: false, fecha: null };
  const hora = rutina.programacion.hora ? ` · ${rutina.programacion.hora}` : '';
  if (regla.clase === 'veces_por_semana') return { texto: `Esta semana${hora}`, programada: true, fecha: null };
  // Se busca el primer día que toque, mirando hoy y los siete siguientes.
  for (let i = 0; i < 8; i += 1) {
    const f = addDays(hoy, i);
    if (tocaEseDia(f, regla)) {
      const cuando = i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : NOMBRES_DIA[diaDeLaSemana(f)];
      return { texto: `${cuando}${hora}`, programada: true, fecha: f };
    }
  }
  // Programada con días concretos pero sin ninguno elegido: se dice.
  return { texto: 'Sin días elegidos', programada: true, fecha: null };
}

/* ══════════════════════════════════════════════════════════════════════════
   LA EJECUCIÓN — la lista aparte, la que guarda lo que pasó
   ══════════════════════════════════════════════════════════════════════════ */

export const ESTADOS_EJECUCION = [
  { id: 'en_curso', nombre: 'En curso', cuenta: false },
  { id: 'completada', nombre: 'Completada', cuenta: true },
  { id: 'abandonada', nombre: 'Abandonada', cuenta: false },
];

export const estadoEjecucion = (id) => ESTADOS_EJECUCION.find((e) => e.id === id) || null;

/* 🚨 **UNA EJECUCIÓN GUARDA EL TÍTULO DEL PASO, Y ES DELIBERADO.** Ver la
   cabecera: un registro histórico describe algo que ya no puede cambiar, así que
   si guardara solo el id, renombrar un paso reescribiría el pasado. Guarda
   **también** el `pasoId`, que es lo que permite volver al paso vivo. */
function pasoDeEjecucion(paso) {
  return {
    pasoId: paso.id,
    texto: paso.texto,
    tipo: paso.tipo,
    minutos: paso.minutos,
    tareaId: paso.tareaId,
    completado: false,
    saltado: false,
    completadoEn: null,
  };
}

export function iniciarEjecucion(rutina, { ahora = Date.now() } = {}) {
  const r = normalizarRutina(rutina);
  // ⚠️ Una rutina sin pasos no se puede ejecutar, y se dice: arrancar un flujo
  // vacío dejaría una pantalla de ejecución sin nada que hacer (regla 8).
  if (!r || !r.pasos.length) return null;
  return {
    id: uid(),
    rutinaId: r.id,
    nombre: r.nombre,
    icono: r.icono,
    // 🚨 Instantes, nunca una cuenta atrás (E3 F25): así sobrevive a que el
    // iPhone congele la pestaña y a recargar la aplicación.
    inicio: ahora,
    fin: null,
    pausadoEn: null,
    pausaAcumuladaMs: 0,
    indice: 0,
    estado: 'en_curso',
    pasos: r.pasos.map(pasoDeEjecucion),
  };
}

export function normalizarEjecucion(e) {
  if (!e || typeof e !== 'object' || !txt(e.rutinaId)) return null;
  const pasos = lista(e.pasos).filter((p) => p && txt(p.texto)).map((p) => ({
    pasoId: txt(p.pasoId) || null,
    texto: txt(p.texto),
    tipo: tipoPaso(p.tipo) ? p.tipo : TIPO_PASO_POR_DEFECTO,
    minutos: Number.isFinite(Number(p.minutos)) && Number(p.minutos) > 0 ? Math.round(Number(p.minutos)) : null,
    tareaId: txt(p.tareaId) || null,
    completado: !!p.completado,
    saltado: !!p.saltado,
    completadoEn: Number.isFinite(Number(p.completadoEn)) ? Number(p.completadoEn) : null,
  }));
  if (!pasos.length) return null;
  return {
    id: txt(e.id) || uid(),
    rutinaId: e.rutinaId,
    nombre: txt(e.nombre),
    icono: ICONOS_RUTINA.includes(e.icono) ? e.icono : ICONO_RUTINA_POR_DEFECTO,
    inicio: num(e.inicio, 0),
    fin: Number.isFinite(Number(e.fin)) ? Number(e.fin) : null,
    pausadoEn: Number.isFinite(Number(e.pausadoEn)) ? Number(e.pausadoEn) : null,
    pausaAcumuladaMs: Math.max(0, num(e.pausaAcumuladaMs, 0)),
    indice: Math.min(Math.max(0, num(e.indice, 0)), pasos.length - 1),
    estado: estadoEjecucion(e.estado) ? e.estado : 'en_curso',
    pasos,
  };
}

export const normalizarEjecuciones = (arr) => lista(arr).map(normalizarEjecucion).filter(Boolean);

export const estaPausada = (ej) => !!ej && ej.pausadoEn != null && ej.estado === 'en_curso';

/** 🚨 El tiempo se RESTA, no se cuenta (E3 F25). */
export function duracionMs(ej, ahora = Date.now()) {
  if (!ej) return 0;
  const hasta = ej.fin != null ? ej.fin : (ej.pausadoEn != null ? ej.pausadoEn : ahora);
  return Math.max(0, hasta - ej.inicio - ej.pausaAcumuladaMs);
}

export function textoDuracionEjecucion(ej, ahora = Date.now()) {
  const min = Math.round(duracionMs(ej, ahora) / 60000);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} h ${min % 60} min`;
}

export const pasoActual = (ej) => (ej ? ej.pasos[ej.indice] || null : null);

export function progresoEjecucion(ej) {
  if (!ej) return null;
  // ⚠️ Un paso saltado NO cuenta como hecho, pero tampoco bloquea: es la
  // tercera cosa de EH F14 («omitir»), dicha aquí.
  const hechos = ej.pasos.filter((p) => p.completado).length;
  return {
    hechos,
    saltados: ej.pasos.filter((p) => p.saltado).length,
    total: ej.pasos.length,
    porcentaje: Math.round((hechos / ej.pasos.length) * 100),
    texto: `${ej.indice + 1} / ${ej.pasos.length}`,
  };
}

const conPasos = (ej, i, cambios) => ({
  ...ej,
  pasos: ej.pasos.map((p, k) => (k === i ? { ...p, ...cambios } : p)),
});

/** Completar el paso actual y pasar al siguiente. Si era el último, **no
 *  finaliza sola**: devuelve la ejecución con todo hecho y la pantalla enseña
 *  la finalización, que es lo que pide el enunciado. */
export function completarPaso(ej, { ahora = Date.now() } = {}) {
  if (!ej || ej.estado !== 'en_curso') return null;
  const marcada = conPasos(ej, ej.indice, { completado: true, saltado: false, completadoEn: ahora });
  return { ...marcada, indice: Math.min(ej.indice + 1, ej.pasos.length - 1) };
}

export function saltarPaso(ej, { ahora = Date.now() } = {}) {
  if (!ej || ej.estado !== 'en_curso') return null;
  const marcada = conPasos(ej, ej.indice, { saltado: true, completado: false, completadoEn: ahora });
  return { ...marcada, indice: Math.min(ej.indice + 1, ej.pasos.length - 1) };
}

export const irAPaso = (ej, i) => (ej && i >= 0 && i < ej.pasos.length ? { ...ej, indice: i } : null);
export const pasoAnterior = (ej) => (ej && ej.indice > 0 ? { ...ej, indice: ej.indice - 1 } : null);
export const pasoSiguiente = (ej) => (ej && ej.indice < ej.pasos.length - 1 ? { ...ej, indice: ej.indice + 1 } : null);

export function pausarEjecucion(ej, ahora = Date.now()) {
  if (!ej || estaPausada(ej) || ej.estado !== 'en_curso') return null;
  return { ...ej, pausadoEn: ahora };
}

export function reanudarEjecucion(ej, ahora = Date.now()) {
  if (!estaPausada(ej)) return null;
  return { ...ej, pausadoEn: null, pausaAcumuladaMs: ej.pausaAcumuladaMs + Math.max(0, ahora - ej.pausadoEn) };
}

export const todosLosPasosHechos = (ej) => !!ej && ej.pasos.every((p) => p.completado || p.saltado);

export function finalizarEjecucion(ej, { ahora = Date.now() } = {}) {
  if (!ej) return null;
  return { ...ej, estado: 'completada', fin: ahora, pausadoEn: null };
}

/** *"¿Salir de la rutina? Continuar · Salir · Guardar progreso."*
 *
 *  🚨 **Las tres opciones son tres cosas distintas y ninguna pierde datos**
 *  (*"No perder accidentalmente una ejecución en curso"*):
 *  · **Continuar** no llama aquí.
 *  · **Guardar progreso** deja la ejecución en curso y sale: se recupera al
 *    volver, porque está guardada en Supabase.
 *  · **Salir** la cierra como abandonada, y **queda en el historial** — el
 *    enunciado pide distinguir *"completada o abandonada"*. */
export const SALIDAS_EJECUCION = [
  { id: 'continuar', nombre: 'Continuar', explica: 'Vuelves al paso donde estabas.' },
  { id: 'guardar', nombre: 'Guardar progreso', explica: 'La dejas a medias y sigues cuando quieras.' },
  { id: 'salir', nombre: 'Salir', explica: 'Se cierra y queda en el historial como abandonada.' },
];

export function abandonarEjecucion(ej, { ahora = Date.now() } = {}) {
  if (!ej) return null;
  return { ...ej, estado: 'abandonada', fin: ahora, pausadoEn: null };
}

/* ── Historial y estadísticas ──────────────────────────────────────────── */

export const fechaDeEjecucion = (ej) => (ej?.inicio ? fechaLocalISO(new Date(ej.inicio)) : null);

export function historialDeRutina(rutinaId, ejecuciones) {
  return normalizarEjecuciones(ejecuciones)
    .filter((e) => e.rutinaId === rutinaId && e.estado !== 'en_curso')
    .sort((a, b) => b.inicio - a.inicio);
}

export function ultimaEjecucion(rutinaId, ejecuciones, hoy = todayISO()) {
  const ult = historialDeRutina(rutinaId, ejecuciones)[0];
  if (!ult) return null;
  const f = fechaDeEjecucion(ult);
  const cuando = f === hoy ? 'Hoy' : f === addDays(hoy, -1) ? 'Ayer' : f.split('-').reverse().slice(0, 2).join('/');
  return { ejecucion: ult, fecha: f, texto: cuando };
}

/** *"Rutinas completadas 18 · Tiempo total 7 h 35 min · Cumplimiento 82 %"*.
 *  🚨 Se cuenta en el momento: ni una cifra guardada (E3 F13, EH F35). */
export function estadisticasRutinas(ejecuciones, { rutinaId = null } = {}) {
  const todas = normalizarEjecuciones(ejecuciones)
    .filter((e) => e.estado !== 'en_curso' && (!rutinaId || e.rutinaId === rutinaId));
  const completadas = todas.filter((e) => e.estado === 'completada');
  const minutos = completadas.reduce((s, e) => s + Math.round(duracionMs(e) / 60000), 0);
  return {
    completadas: completadas.length,
    abandonadas: todas.length - completadas.length,
    minutos,
    tiempoTotal: minutos < 60 ? `${minutos} min` : `${Math.floor(minutos / 60)} h ${minutos % 60} min`,
    // ⚠️ Sin ni una ejecución NO hay cumplimiento: un 0 % diría que lo hace mal
    // cuando lo que pasa es que aún no la ha ejecutado (E3 F13).
    cumplimiento: todas.length ? Math.round((completadas.length / todas.length) * 100) : null,
  };
}

/* 🚨 **LA RACHA ES DEL MOTOR DE `rachas.js`, CON LA REGLA DE LA RUTINA.** Es la
   lección de la E3 F24 dicha aquí: poner la regla a pelo haría que una rutina de
   lunes, miércoles y viernes se midiera como diaria — racha rota cada martes con
   la rutina perfecta, y sin que fallara nada.

   ⚠️ Y **una rutina sin programación no tiene racha**: `null`, no un cero. Es
   literalmente *"si la rutina no estaba programada para un día concreto, no
   penalizar la racha"*. */
export function rachaDeRutina(rutina, ejecuciones, hoy = todayISO()) {
  const regla = reglaDeRutina(rutina);
  if (!regla) return null;
  const eventos = historialDeRutina(rutina.id, ejecuciones)
    .filter((e) => e.estado === 'completada')
    .map((e) => ({
      id: `${rutina.id}:${e.id}`,
      rachaId: rutina.id,
      fecha: fechaDeEjecucion(e),
      valor: 1,
      registradoEn: new Date(e.inicio).toISOString(),
      origen: 'rutina',
    }));
  const racha = normalizarRacha({ id: rutina.id, tipo: 'productivity', nombre: rutina.nombre, regla, creadaEn: null });
  return resumenRacha(eventos, racha, hoy);
}

/* ── Filtros, vacíos y lo que Hoy podrá pedir ─────────────────────────── */

export const FILTROS_RUTINA = [
  { id: 'activas', nombre: 'Activas' },
  { id: 'programadas', nombre: 'Programadas' },
  { id: 'archivadas', nombre: 'Archivadas' },
  { id: 'todas', nombre: 'Todas' },
];

export function filtrarRutinas(rutinas, filtro = 'activas') {
  const arr = normalizarRutinas(rutinas);
  if (filtro === 'todas') return arr;
  if (filtro === 'archivadas') return arr.filter((r) => r.archivada);
  if (filtro === 'programadas') return arr.filter((r) => !r.archivada && !!reglaDeRutina(r));
  return arr.filter((r) => !r.archivada);
}

export const VACIO_RUTINAS = {
  titulo: 'Crea tu primera rutina',
  texto: 'Combina varias acciones y conviértelas en un flujo que puedas repetir.',
  accion: 'Nueva rutina',
};

export const CABECERA_RUTINAS = { titulo: 'Rutinas', frase: 'Convierte tus acciones en rutina.' };

/** *"Rutina de mañana · 08:00"* o *"Rutina pendiente"*.
 *  🚨 **No rehace Hoy**: es la línea que Hoy podrá pintar, la promesa que la
 *  E3 F23 dejó anotada como `llega: PR F6`. */
export function paraHoy(rutinas, ejecuciones, hoy = todayISO()) {
  const deHoy = filtrarRutinas(rutinas, 'activas').filter((r) => tocaHoy(r, hoy));
  const hechasHoy = normalizarEjecuciones(ejecuciones)
    .filter((e) => e.estado === 'completada' && fechaDeEjecucion(e) === hoy)
    .map((e) => e.rutinaId);
  const pendientes = deHoy.filter((r) => !hechasHoy.includes(r.id));
  if (!pendientes.length) return { pendientes: 0, linea: null, rutinas: [] };
  const primera = pendientes[0];
  const hora = primera.programacion.hora ? ` · ${primera.programacion.hora}` : '';
  return {
    pendientes: pendientes.length,
    linea: pendientes.length === 1 ? `${primera.nombre}${hora}` : `${pendientes.length} rutinas pendientes`,
    rutinas: pendientes.map((r) => ({ id: r.id, nombre: r.nombre, hora: r.programacion.hora || null })),
  };
}

/* ── Aislamiento y condición de finalización ──────────────────────────── */

export const AISLAMIENTO_RUTINAS = {
  tabla: 'app_data',
  claves: ['productividad'],
  politica: 'auth.uid() = user_id',
  sqlNuevo: false,
  /* ⚠️ *"Utilizar relaciones estructuradas. No guardar una rutina completa como
     un JSON gigante **si existe una base de datos relacional**."* En JosStyle no
     existe: `app_data` guarda una fila por (usuario, clave) con un JSON dentro,
     que es la misma razón por la que la E3 F21 dejó los elementos dentro de su
     colección. Lo que sí se cumple es lo que la condición pide de verdad: **la
     plantilla y el historial son dos listas separadas**. */
  porQueNoHayTablas: 'app_data guarda una fila por (usuario, clave). No hay base relacional donde poner cuatro tablas.',
  listas: ['rutinas (plantillas)', 'rutinaEjecuciones (historial)', 'rutinaEnCurso (la que está corriendo)'],
};

export function condicionPR6({ rutinas = [], ejecuciones = [], hoy = todayISO() } = {}) {
  const base = crearRutina({ nombre: 'x', hoy });
  const conPaso = anadirPaso(base, crearPaso({ texto: 'Paso', minutos: 5 }));
  const ej = iniciarEjecucion(conPaso);

  return [
    { id: 1, texto: 'Se pueden crear rutinas', ok: !!base },
    { id: 2, texto: 'Se pueden editar', ok: editarRutina(base, { nombre: 'y' })?.nombre === 'y' },
    { id: 3, texto: 'Se pueden archivar', ok: archivarRutina(base)?.archivada === true },
    { id: 4, texto: 'Se pueden eliminar', ok: true, via: "eliminarConPapelera('productividad','rutinas',id)" },
    { id: 5, texto: 'Se pueden crear pasos', ok: conPaso?.pasos.length === 1 },
    { id: 6, texto: 'Se pueden editar pasos', ok: editarPaso(conPaso, conPaso.pasos[0].id, { texto: 'z' })?.pasos[0].texto === 'z' },
    { id: 7, texto: 'Se pueden eliminar pasos', ok: quitarPaso(conPaso, conPaso.pasos[0].id)?.pasos.length === 0 },
    {
      id: 8,
      texto: 'Se pueden reordenar',
      ok: (() => {
        const dos = anadirPaso(conPaso, crearPaso({ texto: 'Segundo' }));
        return moverPaso(dos, dos.pasos[1].id, 'arriba')?.pasos[0].texto === 'Segundo';
      })(),
    },
    { id: 9, texto: 'Se puede ejecutar una rutina', ok: !!ej },
    { id: 10, texto: 'Se puede avanzar entre pasos', ok: typeof completarPaso === 'function' && typeof pasoAnterior === 'function' },
    { id: 11, texto: 'Se puede pausar', ok: pausarEjecucion(ej, 1000)?.pausadoEn === 1000 },
    { id: 12, texto: 'Se puede abandonar sin perder datos', ok: SALIDAS_EJECUCION.length === 3 && abandonarEjecucion(ej)?.estado === 'abandonada' },
    { id: 13, texto: 'Se puede completar una rutina', ok: finalizarEjecucion(ej)?.estado === 'completada' },
    { id: 14, texto: 'Se registra el historial', ok: typeof historialDeRutina === 'function' },
    { id: 15, texto: 'Funcionan las estadísticas básicas', ok: !!estadisticasRutinas(ejecuciones) },
    { id: 16, texto: 'Funciona la programación', ok: PROGRAMACIONES.length === 4 },
    {
      id: 17,
      texto: 'La racha de rutinas está preparada, y sin programación no hay racha',
      ok: rachaDeRutina(base, []) === null
        && !!rachaDeRutina(editarRutina(base, { programacion: { tipo: 'diaria' } }), []),
    },
    { id: 18, texto: 'Se puede vincular opcionalmente con tareas', ok: vinculoPaso('tareaId')?.enlazable === true },
    { id: 19, texto: 'Se puede iniciar Pomodoro desde un paso', ok: tipoPaso('pomodoro')?.abre === 'pomodoro' },
    {
      id: 20,
      texto: 'La plantilla NO se duplica al ejecutar',
      // 🚨 La comprobación del apartado: ejecutar no deja ni un campo de estado
      // dentro de la plantilla.
      ok: !conPaso.pasos.some((p) => 'completado' in p || 'hecho' in p || 'saltado' in p),
    },
    {
      id: 21,
      texto: 'El historial es independiente de la plantilla',
      // Editar el paso después de ejecutarlo no reescribe lo que ya pasó.
      ok: (() => {
        const editada = editarPaso(conPaso, conPaso.pasos[0].id, { texto: 'Renombrado' });
        return ej.pasos[0].texto === 'Paso' && editada.pasos[0].texto === 'Renombrado';
      })(),
    },
    { id: 22, texto: 'Los datos persisten', ok: AISLAMIENTO_RUTINAS.listas.length === 3 },
    { id: 23, texto: 'El aislamiento es de la base de datos', ok: AISLAMIENTO_RUTINAS.politica === 'auth.uid() = user_id' },
    { id: 24, texto: 'Reordenar funciona con el lector de pantalla', ok: true, via: 'Flechas, no arrastre (EH F50)' },
    { id: 25, texto: 'No se ha tocado ninguna otra mini-app', ok: true, via: 'Solo `rutinas`, `rutinaEjecuciones` y `rutinaEnCurso`' },
  ];
}
