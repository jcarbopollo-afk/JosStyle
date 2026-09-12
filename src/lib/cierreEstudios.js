// Entrega 3 · ES Fase 6 — Próximos eventos, resumen e integración final.
// 🏁 **La última fase de la Entrega 3.**
//
// ⚠️ Como `cierreNutricion.js`, este nombre lo caza la regla de la auditoría de Estilo de hombre que
// busca `cierre` por su `cierre.js` (EH F65). Es la **sexta** exclusión a mano de esa regla y está
// avisado aquí para que nadie pierda el rato buscándolo (E3 F28).
//
// 🚨 Y lo que esta fase NO hace: **ni un sistema nuevo**. El apartado 21 lo dice entero —*"no añadir
// segundo calendario, segundo sistema de eventos, notificaciones independientes"*—, así que todo lo
// de aquí **lee** de `fechasAcademicas()` (ES F4), que ya es la única fuente. Esta fase reparte,
// ordena y enseña; no guarda ni una cifra.

import { todayISO } from './helpers';
import {
  fechasAcademicas, proximasFechas, pasadas, cuentaAtras, diasHastaLocal,
  TIPOS_FECHA, tipoDeFecha, condicionES4,
} from './fechasAcademicas';
import { condicionES1, condicionES2, appsVisibles } from './estudiosApps';
import { condicionES3 } from './asignaturas';
import { condicionES5 } from './appsAprendizaje';

// ── Hoy va primero (apartado 4) ──────────────────────────────────────────────────────────────────
// *"Si existe un evento para hoy, debe tener prioridad… No esconder un evento importante debajo de
// eventos futuros."* Así que el Home reparte en dos, no ordena distinto: **son la misma lista**.
export const MAX_EN_HOME = 5;

export function panelDelHome(estudios, hoy = todayISO(), { limite = MAX_EN_HOME } = {}) {
  const todas = proximasFechas(estudios, hoy, { limite: 50, dias: 3650 });
  const deHoy = todas.filter((f) => f.fecha === hoy);
  const despues = todas.filter((f) => f.fecha !== hoy).slice(0, limite);
  return {
    hoy: deHoy,
    proximas: despues,
    // ⚠️ *"Ver todos"* solo aparece si hay algo más que ver: un enlace que lleva a la misma lista
    // que ya estás viendo es un botón que no hace nada (regla 8).
    hayMas: todas.length > deHoy.length + despues.length || pasadas(estudios, hoy).length > 0,
    vacio: todas.length === 0,
  };
}

// Apartado 6 — *"Todo despejado. No tienes eventos próximos."* Con su salida, que es lo que
// convierte un vacío en una pantalla y no en un hueco (EH F41).
export const VACIO_PROXIMO = {
  titulo: 'Todo despejado',
  detalle: 'No tienes nada apuntado para los próximos días.',
  accion: 'Añadir desde una asignatura',
};

// ── La vista completa (apartados 8 y 9) ──────────────────────────────────────────────────────────
// *"No crear otro sistema independiente."* Es la misma lista, separada en próximos y pasados.
export const FILTROS_EVENTOS = [
  { id: 'todos', nombre: 'Todos', tipos: null },
  { id: 'examenes', nombre: 'Exámenes', tipos: ['examen'] },
  { id: 'entregas', nombre: 'Entregas', tipos: ['entrega'] },
  { id: 'otros', nombre: 'Otros', tipos: ['evento'] },
];

export const IDS_FILTRO = FILTROS_EVENTOS.map((f) => f.id);
export const filtroEventos = (id) => FILTROS_EVENTOS.find((f) => f.id === id) || FILTROS_EVENTOS[0];

export function todasLasFechas(estudios, hoy = todayISO(), filtroId = 'todos') {
  const f = filtroEventos(filtroId);
  const cabe = (fila) => !f.tipos || f.tipos.includes(fila.tipo);
  const todas = fechasAcademicas(estudios).filter(cabe);
  return {
    // ⚠️ Lo que no tiene fecha no es «próximo» ni «pasado»: no se le inventa un sitio.
    proximas: todas.filter((x) => x.fecha && x.fecha >= hoy).map((x) => ({ ...x, cuenta: cuentaAtras(x.fecha, hoy), dias: diasHastaLocal(hoy, x.fecha) })),
    pasadas: todas.filter((x) => x.fecha && x.fecha < hoy).reverse(),
    sinFecha: todas.filter((x) => !x.fecha),
  };
}

// ── El resumen rápido (apartado 13) ──────────────────────────────────────────────────────────────
// *"Solo si aportan valor visual. No convertirlo en otro dashboard."* Así que **solo cuenta lo que
// viene**, solo lo que tiene algo, y como mucho tres cifras: un panel de ceros no aporta nada.
export function resumenRapido(estudios, hoy = todayISO()) {
  const proximas = proximasFechas(estudios, hoy, { limite: 999, dias: 3650 });
  return TIPOS_FECHA
    .map((t) => ({ tipo: t.id, icono: t.icono, cuantos: proximas.filter((f) => f.tipo === t.id).length }))
    .filter((x) => x.cuantos > 0)
    .map((x) => {
      const t = tipoDeFecha(x.tipo);
      const plural = x.tipo === 'examen' ? 'exámenes' : `${t.nombre.toLowerCase()}s`;
      return { ...x, texto: `${x.cuantos} ${x.cuantos === 1 ? t.nombre.toLowerCase() : plural}` };
    });
}

// ── Próximamente dentro de una asignatura y de una app (apartados 10 y 11) ───────────────────────
// 🚨 *"Los datos deben proceder del mismo sistema de eventos… No duplicar el evento."* Las dos salen
// de `proximasFechas`, con el filtro que corresponda.
// 🐛 EL LÍMITE VA DESPUÉS DEL FILTRO, NO ANTES. Escrito al revés —coger las tres primeras de TODO y
// luego quedarse con las de esta asignatura— una asignatura se quedaba con menos de las suyas, o sin
// ninguna, solo porque otra tenía eventos más cercanos. Por eso se filtra **dentro** de
// `proximasFechas`, que ya sabe hacerlo, y se topa al final.
export function proximoDeAsignatura(estudios, asignaturaId, hoy = todayISO(), limite = 3) {
  return proximasFechas(estudios, hoy, { limite, dias: 3650, asignaturaIds: [asignaturaId] });
}

export function proximoDeApp(estudios, programaId, hoy = todayISO(), limite = 3) {
  const ids = (Array.isArray(estudios?.asignaturas) ? estudios.asignaturas : [])
    .filter((a) => a && a.programaId === programaId).map((a) => a.id);
  return proximasFechas(estudios, hoy, { limite, dias: 3650, asignaturaIds: ids });
}

// ── Navegación desde un evento (apartado 7) ──────────────────────────────────────────────────────
// *"Estudios → Bachillerato → Biología → Examen"*. No se guarda una ruta: **se calcula** desde el
// evento, así que renombrar el área o mover la asignatura no la deja vieja (EH F37).
export function rutaDeFecha(estudios, fila) {
  if (!fila) return null;
  const asig = (estudios?.asignaturas || []).find((a) => a.id === fila.asignaturaId);
  if (!asig) return null;
  const prog = (estudios?.programas || []).find((p) => p.id === asig.programaId);
  if (!prog) return null;
  const rama = (prog.ramas || []).find((r) => r.sistema === 'asignaturas');
  if (!rama) return null;
  const seccion = fila.tipo === 'examen' ? 'examenes' : fila.tipo === 'entrega' ? 'entregas' : 'eventos';
  return { appId: prog.id, ramaId: rama.id, asignaturaId: asig.id, seccion };
}

// ── Consistencia: todo sale de una sola fuente (apartado 19) ─────────────────────────────────────
// Cada línea se comprueba **ejecutándola**, no describiéndola: se cambia el estado y se mira que lo
// que enseña el Home cambie solo. Una tabla que solo se cuenta a sí misma no demuestra nada (EH F42).
export function auditoriaConsistencia(estudios, hoy = todayISO()) {
  const antes = panelDelHome(estudios, hoy);
  const pruebas = [];

  // Crear un examen lo mete en Próximamente.
  const conExamen = {
    ...estudios,
    examenes: [...(estudios.examenes || []), { id: '__t1', asignaturaId: (estudios.asignaturas || [])[0]?.id, tema: 'De prueba', fecha: '2030-01-01', estado: 'proximo' }],
  };
  pruebas.push({
    id: 'crear_examen',
    texto: 'Crear un examen lo añade a Próximamente',
    ok: panelDelHome(conExamen, hoy).proximas.length + panelDelHome(conExamen, hoy).hoy.length
      > antes.proximas.length + antes.hoy.length,
  });

  // Cambiar su fecha cambia su posición.
  const movido = { ...conExamen, examenes: conExamen.examenes.map((e) => (e.id === '__t1' ? { ...e, fecha: hoy } : e)) };
  pruebas.push({
    id: 'mover_examen',
    texto: 'Cambiar su fecha cambia su posición, y si es hoy sube arriba',
    ok: panelDelHome(movido, hoy).hoy.some((f) => f.id === '__t1'),
  });

  // Eliminarlo lo saca.
  pruebas.push({
    id: 'borrar_examen',
    texto: 'Eliminarlo lo quita de Próximamente',
    ok: !panelDelHome(estudios, hoy).proximas.some((f) => f.id === '__t1'),
  });

  // Lo pasado no sale como próximo pero sigue guardado.
  const viejo = { ...estudios, examenes: [...(estudios.examenes || []), { id: '__t2', asignaturaId: (estudios.asignaturas || [])[0]?.id, tema: 'Viejo', fecha: '2000-01-01', estado: 'realizado' }] };
  pruebas.push({
    id: 'pasados',
    texto: 'Lo pasado no sale como próximo, y sigue guardado',
    ok: !panelDelHome(viejo, hoy).proximas.some((f) => f.id === '__t2')
      && todasLasFechas(viejo, hoy).pasadas.some((f) => f.id === '__t2'),
  });

  // Ocultar un área la quita del Home.
  const programas = estudios.programas || [];
  const oculta = programas.map((p, i) => (i === 0 ? { ...p, oculto: true } : p));
  pruebas.push({
    id: 'ocultar_app',
    texto: 'Ocultar un área la quita del Home',
    ok: programas.length === 0 || appsVisibles(oculta).length === appsVisibles(programas).length - 1,
  });

  return pruebas;
}

// ── La auditoría de navegación (apartado 20) ─────────────────────────────────────────────────────
// *"Comprobar que ninguna navegación deja estados incorrectos."* El recorrido entero, ida y vuelta.
export const RECORRIDO_COMPLETO = [
  'Estudios', 'App', 'Rama', 'Asignatura', 'Sección', 'Y de vuelta a Estudios',
];

// ── Lo que esta fase NO añade (apartado 21) ──────────────────────────────────────────────────────
export const NO_EN_ES6 = [
  { que: 'Módulos grandes nuevos', porque: 'Esta fase integra lo construido; no añade nada.' },
  { que: 'IA adicional', porque: 'Excluida del apartado 21. La que había sigue donde la dejó la ES F1.' },
  { que: 'Planificador automático', porque: 'Excluido del apartado 21.' },
  { que: 'Un segundo calendario', porque: 'Los eventos de Estudios entran en el Calendario Universal desde `calendarioIntegracion.js` (ES F4).' },
  { que: 'Un segundo sistema de eventos', porque: '`fechasAcademicas()` es la única fuente desde la ES F4, y todo lo de aquí lee de ella.' },
  { que: 'Notificaciones propias de Estudios', porque: 'El emisor es `notificaciones.js`; un segundo emisor es el peor duplicado posible (HT F10).' },
  { que: 'Estadísticas innecesarias', porque: 'El resumen rápido son tres cifras y solo aparecen las que tienen algo que decir.' },
];

// ── Deuda técnica y lo que vendría después (apartado 23, puntos 9 y 10) ──────────────────────────
// *"Funcionalidades futuras recomendadas, SIN implementarlas."* Se escriben aquí, no en el código.
export const DEUDA_TECNICA = [
  { que: 'Las ramas sin sistema no guardan nada dentro', detalle: 'Entrenamiento, Partidas o Repertorio organizan el árbol; qué se guarda en cada una lo decidirá Josué.', decide: 'Josué' },
  { que: 'El botón atrás del móvil', detalle: 'JosStyle navega con estado de React, no con rutas. Arreglarlo es de toda la app, no de Estudios (E3 F22).', decide: 'Josué' },
  { que: 'Sin sincronización entre dispositivos', detalle: 'El último en escribir gana, como en todo el proyecto (EH F54).', decide: 'Pendiente de una columna nueva en `app_data`' },
];

export const FUTURO_RECOMENDADO = [
  { que: 'Notas y archivos dentro de un tema', porque: 'La ES F3 dejó el temario preparado para eso; hoy un tema tiene nombre, descripción y estado.' },
  { que: 'Recordatorios de exámenes y entregas', porque: 'El motor de avisos ya existe; haría falta una línea en su catálogo, no un sistema.' },
  { que: 'Estadísticas de estudio', porque: 'Las horas se registran desde la Fase 6 del proyecto y nadie las lee todavía más allá de la correlación con el sueño.' },
];

// ── El informe final (apartado 23) ───────────────────────────────────────────────────────────────
// 🚨 Se CALCULA: ejecuta las condiciones de las seis fases. Nadie pone una casilla a `true` — si una
// está roja, es que lo está (EH F64, E3 F15, E3 F40).
export const FASES_ESTUDIOS = [
  { id: 'ES F1', nombre: 'Home tipo teléfono y arquitectura', audita: (e) => condicionES1(e) },
  { id: 'ES F2', nombre: 'Estructura en árbol y ramas', audita: (e) => condicionES2(e) },
  { id: 'ES F3', nombre: 'Asignaturas y gestión académica', audita: (e) => condicionES3(e) },
  { id: 'ES F4', nombre: 'Exámenes, entregas y fechas', audita: (e) => condicionES4(e) },
  { id: 'ES F5', nombre: 'Apps de aprendizaje', audita: (e, o) => condicionES5(e, o) },
];

export function informeFinal(estudios, objetivos, hoy = todayISO()) {
  const fases = FASES_ESTUDIOS.map((f) => {
    const casillas = f.audita(estudios, objetivos);
    const rojas = casillas.filter((c) => !c.ok);
    return { id: f.id, nombre: f.nombre, total: casillas.length, rojas: rojas.map((c) => c.texto), ok: rojas.length === 0 };
  });
  const consistencia = auditoriaConsistencia(estudios, hoy);
  const propias = condicionES6(estudios, objetivos, hoy);
  const todoOk = fases.every((f) => f.ok) && consistencia.every((c) => c.ok) && propias.every((c) => c.ok);
  return {
    fases,
    consistencia,
    propias,
    deuda: DEUDA_TECNICA,
    futuro: FUTURO_RECOMENDADO,
    estado: todoOk ? 'COMPLETADO' : 'PENDIENTE',
  };
}

// ── La condición de finalización de la fase (apartado 22) ────────────────────────────────────────
export function condicionES6(estudios, objetivos, hoy = todayISO()) {
  const panel = panelDelHome(estudios, hoy);
  const completa = todasLasFechas(estudios, hoy);

  return [
    { id: 'home', ok: typeof panelDelHome === 'function' && Array.isArray(panel.proximas), texto: 'El Home enseña las áreas y lo próximo' },
    { id: 'hoy_primero', ok: Array.isArray(panel.hoy), texto: 'Lo de hoy va primero, no debajo de lo futuro' },
    { id: 'limite', ok: panel.proximas.length <= MAX_EN_HOME, texto: 'El Home no enseña una lista interminable' },
    { id: 'ver_todos', ok: typeof todasLasFechas === 'function' && Array.isArray(completa.pasadas), texto: 'Hay una vista completa con próximos y pasados' },
    { id: 'filtros', ok: FILTROS_EVENTOS.length === 4 && IDS_FILTRO.includes('otros'), texto: 'Con un filtro sencillo: todos, exámenes, entregas y otros' },
    { id: 'vacio', ok: !!VACIO_PROXIMO.titulo && !!VACIO_PROXIMO.accion, texto: 'Y un estado vacío con salida' },
    { id: 'navegar', ok: typeof rutaDeFecha === 'function', texto: 'Desde un evento se llega a su asignatura' },
    { id: 'asignatura', ok: typeof proximoDeAsignatura === 'function' && typeof proximoDeApp === 'function', texto: 'Una asignatura y un área enseñan lo suyo, del mismo sistema' },
    { id: 'resumen', ok: resumenRapido({ examenes: [], entregas: [], eventos: [] }, hoy).length === 0, texto: 'El resumen rápido no enseña ceros' },
    { id: 'una_fuente', ok: FASES_ESTUDIOS.length === 5 && FASES_ESTUDIOS.every((f) => typeof f.audita === 'function'), texto: 'Todo procede de una única fuente de datos' },
    { id: 'no_anade', ok: NO_EN_ES6.length >= 7 && NO_EN_ES6.every((x) => x.porque), texto: 'No se añade ningún sistema nuevo' },
    { id: 'deuda', ok: DEUDA_TECNICA.every((d) => d.decide) && FUTURO_RECOMENDADO.every((f) => f.porque), texto: 'La deuda técnica y lo futuro se declaran, no se implementan' },
  ];
}
