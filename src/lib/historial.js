import { todayISO, addDays, fechaValida } from './helpers';
import { ejerciciosDeSesion, filasDeSeries } from './entrenamiento';
import { resumenDeSesion, fechaLarga, volumenDeSesion } from './finalizacion';
import { resumenPlanificado, resumenRealizado, cabeceraDeEjercicio } from './entrenamientoUx';
import { ENTORNOS } from './ejercicios';
import { planPorId, planActivoDe, CATALOGO_PLANES } from './planes';
/* 🔓 FIT F11 — la comparación con la vez anterior, discreta (su apartado 34). */
import { comparacionEnSesion } from './progresion';

/* Entrega 4 · Fase 10/45 — «Historial de entrenamientos y detalle de sesiones».
   ═══════════════════════════════════════════════════════════════════════════

   *"El usuario debe poder consultar fácilmente: ¿Qué entrenamientos he hecho? y
   entrar en uno para responder: ¿Qué hice exactamente ese día?"* Y el apartado
   1 fija de dónde sale todo: *"exclusivamente de las WorkoutSession realmente
   completadas. No inventar estadísticas."*

   🚨 **NI UN MODELO NUEVO** (apartado 3). El historial es una **lectura** de
   `fitness.sesiones`, la clave de la F1 que la F7 llena y la F8 completa. No
   hay una lista de «entrenamientos hechos» aparte que se pueda desincronizar:
   una sesión que la F8 guarda aparece aquí sin que nadie la añada (apartado 37),
   y una que se descarta no aparece sin que nadie la quite (apartado 38).

   🚨 **Y NI UNA CUENTA NUEVA.** Duración, series, volumen fiable y ejercicios
   sustituidos ya los calcula `resumenDeSesion` de la F8, y planificado frente a
   realizado ya lo dice la F9. Aquí se ordenan, se filtran y se agrupan — si el
   historial contara las series por su cuenta, el resumen de la F8 y esta
   pantalla podrían decir dos números distintos del mismo entrenamiento. */

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const pad = (n) => String(n).padStart(2, '0');
/* ⚠️ Local, nunca `toISOString()`: la trampa del UTC (invariante 12). */
const isoLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const esISO = (v) => /^\d{4}-\d{2}-\d{2}$/.test(texto(v));

/* ═══════════════════════════════════════════════════════════════════════════
   1 · QUÉ SESIONES ENTRAN (apartados 4, 37 y 38)
   ═══════════════════════════════════════════════════════════════════════════ */

/** 🚨 Solo las completadas. Ni en curso, ni pausadas, ni «finalizando» sin
 *  guardar, ni descartadas. ⚠️ Y una parcial SÍ entra (apartado 4: *"20
 *  planificadas, 16 realizadas: la sesión aparece igualmente"*): lo que decide
 *  es que él la guardó, no cuántas series hizo. */
export const ESTADO_DEL_HISTORIAL = 'completada';

export function sesionesDelHistorial(fitness) {
  return lista((fitness || {}).sesiones).filter((s) => s && s.id && s.estado === ESTADO_DEL_HISTORIAL);
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · FECHAS (apartados 5 y 39)
   ═══════════════════════════════════════════════════════════════════════════ */

/** *"Hoy"*, *"Ayer"* o *"12 septiembre 2026"*. ⚠️ La fecha de una sesión es la
 *  LOCAL del día que entrenó (`todayISO` en la F7), así que no hay UTC que
 *  corregir: comparar cadenas ISO ya es comparar días. */
export function etiquetaDeFecha(iso, hoy = todayISO()) {
  if (!esISO(iso)) return '';
  if (iso === hoy) return 'Hoy';
  if (iso === addDays(hoy, -1)) return 'Ayer';
  return fechaLarga(iso);
}

/** Cuándo acabó, para ordenar dos sesiones del mismo día. */
const momento = (s) => s?.terminadaEn || s?.iniciadaEn || 0;

/** 🐛 **FIT F31 — «LA ÚLTIMA» SE ORDENA, NO SE LEE DE UNA POSICIÓN.**
 *  `guardarSesion` (F7) añade al **final** de la lista, así que el primer
 *  elemento del historial es **el más antiguo**. El bloque de entrenamientos de
 *  la F28 cogía `sesiones[0]` como «la última» — no se pintaba en ninguna parte y
 *  por eso no se vio, pero la F31 enseña *«Último entrenamiento»* (su apartado
 *  3) y habría dicho la primera que hizo. Por fecha y, el mismo día, por hora.
 *  ⚠️ Una sesión sin fecha válida no puede ser «la última» de nada (apartado 24
 *  de la F31): no se sabe cuándo fue. */
export function historialPorReciente(fitness) {
  return sesionesDelHistorial(fitness)
    .filter((s) => fechaValida(s.fecha))
    .sort((a, b) => (a.fecha === b.fecha ? momento(b) - momento(a) : (a.fecha < b.fecha ? 1 : -1)));
}

export const ultimaDelHistorial = (fitness) => historialPorReciente(fitness)[0] || null;

/* ═══════════════════════════════════════════════════════════════════════════
   3 · ENTORNO Y PLAN (apartados 12 y 13)
   ═══════════════════════════════════════════════════════════════════════════ */

const ENTORNOS_VALIDOS = ENTORNOS.map((e) => e.id);

/** El entorno de una sesión.
 *  🚨 Desde la F10 **se guarda al empezar** (`sesion.entorno`), con el snapshot:
 *  un historial que dependiera del plan se rompería al borrarlo, que es la
 *  lección de la F7. ⚠️ Para las sesiones de antes se deduce del plan o de la
 *  plantilla **si todavía existen**; si no, `null` — y el filtro no se rompe
 *  (apartado 13: *"Si una sesión antigua no tiene entorno: no romper"*). */
export function entornoDeSesion(sesion, fitness = {}, planes = CATALOGO_PLANES) {
  const propio = texto(sesion?.entorno);
  if (ENTORNOS_VALIDOS.includes(propio)) return propio;
  const idOrigen = texto(sesion?.origen?.id);
  const plantilla = lista((fitness || {}).plantillas)
    .find((p) => p && (p.id === texto(sesion?.planId) || p.id === idOrigen));
  if (plantilla && ENTORNOS_VALIDOS.includes(texto(plantilla.entorno))) return texto(plantilla.entorno);
  const plan = texto(sesion?.planId) ? planPorId(texto(sesion.planId), planes) : null;
  if (plan && ENTORNOS_VALIDOS.includes(texto(plan.entorno))) return texto(plan.entorno);
  return null;
}

/** De qué plan salió (apartado 12). ⚠️ «Plan activo» es el de AHORA: una sesión
 *  del plan que tenía en junio es de «otros planes» si ya lo cambió. */
export function relacionConPlan(sesion, fitness = {}) {
  const activo = planActivoDe(fitness);
  const planId = texto(sesion?.planId);
  if (planId && activo && activo.planId === planId) return 'activo';
  if (planId && texto(sesion?.origen?.tipo) !== 'plantilla') return 'otro';
  return 'independiente';
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LOS FILTROS (apartados 10-15, 33 y 34)
   ═══════════════════════════════════════════════════════════════════════════ */

export const FILTROS_FECHA = [
  { id: 'todos', nombre: 'Todas las fechas' },
  { id: 'semana', nombre: 'Esta semana' },
  { id: 'mes', nombre: 'Este mes' },
  { id: 'tres_meses', nombre: 'Últimos 3 meses' },
  { id: 'rango', nombre: 'Elegir fechas' },
];

export const FILTROS_PLAN = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'activo', nombre: 'Plan activo' },
  { id: 'otro', nombre: 'Otros planes' },
  { id: 'independiente', nombre: 'Independientes' },
];

export const FILTROS_ENTORNO = [{ id: 'todos', nombre: 'Todos' }, ...ENTORNOS.map((e) => ({ id: e.id, nombre: e.nombre }))];

/* Apartado 14 — *"No añadir demasiadas opciones innecesarias."* Cuatro. */
export const ORDENES_HISTORIAL = [
  { id: 'recientes', nombre: 'Más recientes' },
  { id: 'antiguos', nombre: 'Más antiguos' },
  { id: 'mas_larga', nombre: 'Mayor duración' },
  { id: 'mas_corta', nombre: 'Menor duración' },
];

export const FILTROS_POR_DEFECTO = Object.freeze({
  busqueda: '', fecha: 'todos', desde: '', hasta: '', plan: 'todos', entorno: 'todos', orden: 'recientes',
});

/** ¿Hay algo que limpiar? (apartado 34). ⚠️ Una búsqueda de solo espacios no
 *  cuenta: no filtra nada. */
export function hayFiltros(f = {}) {
  const x = { ...FILTROS_POR_DEFECTO, ...f };
  return texto(x.busqueda) !== ''
    || x.fecha !== 'todos' || x.plan !== 'todos' || x.entorno !== 'todos' || x.orden !== 'recientes';
}

/** Apartado 10 — *"tolerante a mayúsculas/minúsculas"* y a acentos: «pierna»
 *  encuentra «Piérnas» y «fuerza» encuentra «FUERZA». */
export function normalizarBusqueda(t) {
  return String(t ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** El intervalo de un filtro de fecha, en ISO local, ambos incluidos. `null` =
 *  sin límite. */
export function rangoDeFecha(id, hoy = todayISO(), { desde = '', hasta = '' } = {}) {
  const d = new Date(`${hoy}T00:00:00`);
  if (id === 'semana') {
    /* Semana de lunes a domingo, como el resto de la aplicación (RA F1). */
    const lunes = addDays(hoy, -((d.getDay() + 6) % 7));
    return { desde: lunes, hasta: addDays(lunes, 6) };
  }
  if (id === 'mes') {
    return { desde: `${hoy.slice(0, 7)}-01`, hasta: isoLocal(new Date(d.getFullYear(), d.getMonth() + 1, 0)) };
  }
  if (id === 'tres_meses') {
    return { desde: isoLocal(new Date(d.getFullYear(), d.getMonth() - 3, d.getDate())), hasta: hoy };
  }
  if (id === 'rango') {
    const a = esISO(desde) ? desde : null;
    const b = esISO(hasta) ? hasta : null;
    /* Si las pone al revés, se entiende lo que quería. */
    if (a && b && a > b) return { desde: b, hasta: a };
    return { desde: a, hasta: b };
  }
  return { desde: null, hasta: null };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LA TARJETA (apartados 6, 7 y 32)
   ═══════════════════════════════════════════════════════════════════════════
   🚨 Ligera a propósito (apartado 32): lo que la lista necesita y nada más. Las
   series de cada ejercicio no se preparan hasta que se abre el detalle. */

const nombreEntorno = (id) => ENTORNOS.find((e) => e.id === id)?.nombre || '';

/** 🐛 **FIT F31 (apartado 39: *"sesión sin duración válida"*).** Sin marca de
 *  inicio, o con un fin anterior al inicio, `duracionSesion` (F7) devuelve 0 —
 *  lo correcto para un reloj— y la tarjeta decía **«menos de 1 min»**, que es
 *  afirmar una duración que nadie midió. Una duración se enseña solo si hay las
 *  dos marcas y van en orden; si no, no se dice nada (la regla 8, y es el «—»
 *  de una serie sin registrar). */
export function duracionConocida(sesion) {
  const a = Number(sesion?.iniciadaEn);
  const b = Number(sesion?.terminadaEn);
  return Number.isFinite(a) && a > 0 && Number.isFinite(b) && b >= a;
}

export function fichaDeHistorial(sesion, { fitness = {}, propios = [], planes = CATALOGO_PLANES, hoy = todayISO() } = {}) {
  if (!sesion) return null;
  const r = resumenDeSesion(sesion, { propios, ahora: momento(sesion) || Date.now() });
  const parcial = r.seriesPlanificadas > 0 && r.seriesCompletadas < r.seriesPlanificadas;
  const entorno = entornoDeSesion(sesion, fitness, planes);
  const n = r.ejerciciosHechos;
  return {
    id: sesion.id,
    nombre: r.nombre,
    fecha: sesion.fecha,
    etiquetaFecha: etiquetaDeFecha(sesion.fecha, hoy),
    hora: r.inicio,
    duracion: duracionConocida(sesion) ? r.duracion : '',
    duracionMs: duracionConocida(sesion) ? r.duracionMs : 0,
    momento: momento(sesion),
    ejercicios: n,
    ejerciciosTexto: `${n} ${n === 1 ? 'ejercicio' : 'ejercicios'}`,
    series: r.seriesCompletadas,
    seriesPlanificadas: r.seriesPlanificadas,
    /* 🚨 Apartado 7 — *"16/20 series"* si fue parcial, sin tono negativo: es
       información, no un reproche. Completa, solo *"18 series"*. */
    parcial,
    seriesTexto: parcial
      ? `${r.seriesCompletadas}/${r.seriesPlanificadas} series`
      : `${r.seriesCompletadas} ${r.seriesCompletadas === 1 ? 'serie' : 'series'}`,
    entorno,
    entornoNombre: nombreEntorno(entorno),
    plan: relacionConPlan(sesion, fitness),
    textoBusqueda: normalizarBusqueda(`${r.nombre} ${texto(sesion.descripcion)}`),
  };
}

export const HISTORIAL_VACIO = {
  titulo: 'Aún no tienes entrenamientos',
  texto: 'Completa tu primer entrenamiento para verlo aquí.',
  cta: 'Empezar entrenamiento',
};

export const SIN_RESULTADOS = {
  titulo: 'No hay entrenamientos que coincidan',
  texto: 'Prueba con otra búsqueda o quita algún filtro.',
  limpiar: 'Limpiar filtros',
};

export const contadorTexto = (n) => `${n} ${n === 1 ? 'entrenamiento' : 'entrenamientos'}`;

/** Cuántas tarjetas se pintan de golpe (apartado 32). Con cientos de sesiones,
 *  la lista crece de treinta en treinta al pedirlo. */
export const PAGINA_HISTORIAL = 30;

/**
 * 🚨 La consulta entera, pura: fichas → filtros combinados → orden → grupos.
 *
 * ⚠️ Recibe las fichas ya hechas para que la pantalla las calcule **una vez
 * por cambio de sesiones** y no en cada tecla de la búsqueda (apartado 32).
 */
export function consultarHistorial(fichas, filtros = {}, { hoy = todayISO() } = {}) {
  const f = { ...FILTROS_POR_DEFECTO, ...filtros };
  const todas = lista(fichas).filter(Boolean);
  const q = normalizarBusqueda(f.busqueda);
  const { desde, hasta } = rangoDeFecha(f.fecha, hoy, { desde: f.desde, hasta: f.hasta });

  /* Apartado 33 — combinables: cada filtro recorta lo que dejó el anterior. */
  const filtradas = todas.filter((x) => {
    if (q && !x.textoBusqueda.includes(q)) return false;
    if (desde && (!x.fecha || x.fecha < desde)) return false;
    if (hasta && (!x.fecha || x.fecha > hasta)) return false;
    if (f.plan !== 'todos' && x.plan !== f.plan) return false;
    /* ⚠️ Una sesión sin entorno no desaparece con «Todos», y no entra en uno
       concreto: no se sabe de dónde era, y adivinarlo sería inventar. */
    if (f.entorno !== 'todos' && x.entorno !== f.entorno) return false;
    return true;
  });

  const porFecha = (a, b) => (a.fecha === b.fecha ? a.momento - b.momento : (a.fecha < b.fecha ? -1 : 1));
  const ordenadas = [...filtradas].sort((a, b) => {
    if (f.orden === 'antiguos') return porFecha(a, b);
    if (f.orden === 'mas_larga') return b.duracionMs - a.duracionMs || porFecha(b, a);
    if (f.orden === 'mas_corta') return a.duracionMs - b.duracionMs || porFecha(b, a);
    return porFecha(b, a);
  });

  /* Apartado 5 — agrupar por fecha **solo si el orden es por fecha**: ordenando
     por duración, los grupos saldrían partidos y repetidos. */
  const agrupar = f.orden === 'recientes' || f.orden === 'antiguos';
  const grupos = [];
  if (agrupar) {
    for (const x of ordenadas) {
      const ultimo = grupos[grupos.length - 1];
      if (ultimo && ultimo.fecha === x.fecha) ultimo.fichas.push(x);
      else grupos.push({ fecha: x.fecha, etiqueta: etiquetaDeFecha(x.fecha, hoy), fichas: [x] });
    }
  }

  /* Apartado 12 — *"No crear filtros que no tengan datos reales"*. Se ofrecen
     solo las opciones con al menos una sesión, mirando TODAS (no las ya
     filtradas: si no, elegir «Casa» haría desaparecer «Gimnasio» del selector). */
  const conDatos = (campo, opciones) => opciones.filter((o) => o.id === 'todos' || todas.some((x) => x[campo] === o.id));

  return {
    total: todas.length,
    cuantas: ordenadas.length,
    contador: contadorTexto(ordenadas.length),
    fichas: ordenadas,
    agrupado: agrupar,
    grupos,
    hayFiltros: hayFiltros(f),
    vacio: todas.length === 0,
    sinResultados: todas.length > 0 && ordenadas.length === 0,
    opcionesPlan: conDatos('plan', FILTROS_PLAN),
    opcionesEntorno: conDatos('entorno', FILTROS_ENTORNO),
    rango: { desde, hasta },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · EL DETALLE (apartados 16-27)
   ═══════════════════════════════════════════════════════════════════════════ */

const decimal = (n) => String(n).replace('.', ',');

const ESTADO_SERIE_TEXTO = { hecha: 'Hecha', omitida: 'Omitida', pendiente: 'Sin hacer' };

/** Una serie, lista para leerse (apartados 19, 20 y 22). ⚠️ Un isométrico dice
 *  segundos, nunca repeticiones; y lo que no se registró es «—», no «0». */
export function filaDeSerieHistorial(fila, { corporal = false } = {}) {
  const porTiempo = fila.modo === 'tiempo';
  const peso = fila.hecho?.peso;
  return {
    id: fila.id,
    numero: fila.numero,
    extra: fila.origen === 'anadida',
    estado: fila.estado,
    estadoTexto: ESTADO_SERIE_TEXTO[fila.estado] || fila.estado,
    porTiempo,
    peso: peso !== null && peso !== undefined && peso > 0
      ? `${decimal(peso)} kg`
      : (corporal && fila.estado === 'hecha' ? 'Corporal' : '—'),
    medida: porTiempo
      ? (fila.hecho?.duracion ? `${fila.hecho.duracion} s` : '—')
      : (fila.hecho?.reps ? `${fila.hecho.reps}` : '—'),
  };
}

/** *"8 × peso corporal · 7 × peso corporal"* o *"10 × 60 kg"* (apartado 18).
 *  🚨 «Peso corporal» solo si la línea lo decía (`tipoCarga: 'corporal'`, F3):
 *  un peso que no se apuntó no es peso corporal, es un peso que no se apuntó. */
export function realizadoEnDetalle(ejercicioSesion) {
  const corporal = ejercicioSesion?.linea?.tipoCarga === 'corporal';
  return lista(ejercicioSesion?.series)
    .filter((s) => s.estado === 'hecha')
    .map((s) => {
      if (s.modo === 'tiempo') return s.hecho?.duracion ? `${s.hecho.duracion} s` : '—';
      const reps = s.hecho?.reps ? `${s.hecho.reps}` : '—';
      const p = s.hecho?.peso;
      if (p !== null && p !== undefined && p > 0) return `${reps} × ${decimal(p)} kg`;
      return corporal ? `${reps} × peso corporal` : reps;
    });
}

/** 🔓 FIT F11, apartado 34 — *"+2 reps respecto a la última vez"*, y **solo si
 *  hay una vez anterior comparable**. Un primer registro o un cambio de medida no
 *  dicen nada: no convertir el historial en una pantalla de estadísticas. */
export function comparacionDiscreta(c) {
  if (!c || !['mejora', 'estable', 'descenso'].includes(c.estado)) return null;
  return {
    estado: c.estado,
    texto: c.estado === 'estable' ? 'Igual que la última vez' : `${c.texto} respecto a la última vez`,
  };
}

export function detalleDeSesion(sesion, { fitness = {}, propios = [], planes = CATALOGO_PLANES, hoy = todayISO() } = {}) {
  if (!sesion) return null;
  const r = resumenDeSesion(sesion, { propios, ahora: momento(sesion) || Date.now() });
  const porId = new Map(r.ejercicios.map((e) => [e.id, e]));
  const entorno = entornoDeSesion(sesion, fitness, planes);

  const ejercicios = ejerciciosDeSesion(sesion).map((e) => {
    const res = porId.get(e.id) || {};
    const cab = cabeceraDeEjercicio(e, propios) || {};
    const corporal = e.linea?.tipoCarga === 'corporal';
    return {
      id: e.id,
      /* 🔓 FIT F31, apartado 30 — *"Desde una sesión → ExerciseProgress si
         corresponde"*: hace falta saber cuál es. */
      exerciseId: e.exerciseId,
      nombre: cab.nombre || res.nombre || e.exerciseId,
      variante: [cab.variante, cab.agarre].filter(Boolean).join(' · '),
      estado: res.estado,
      /* *"3/4 series"* (apartado 18). */
      seriesTexto: res.texto || '',
      /* 🚨 Apartado 25 — los dos, con su nombre: lo que decía el plan y lo que hizo. */
      planificado: resumenPlanificado(e),
      realizado: resumenRealizado(e),
      realizadoDetalle: realizadoEnDetalle(e),
      porTiempo: e.modo === 'tiempo',
      notas: texto(e.notas),
      /* Apartado 21 — el que pedía el plan, y el que hizo. */
      sustituido: !!res.sustituido,
      original: res.original || '',
      existe: res.existe !== false,
      filas: filasDeSeries(e).map((f) => filaDeSerieHistorial(f, { corporal })),
      comparacion: comparacionDiscreta(comparacionEnSesion(fitness, sesion.id, e.exerciseId, { propios })),
    };
  });

  const volumen = volumenDeSesion(sesion);
  return {
    id: sesion.id,
    nombre: r.nombre,
    fecha: sesion.fecha,
    fechaTexto: fechaLarga(sesion.fecha),
    etiquetaFecha: etiquetaDeFecha(sesion.fecha, hoy),
    inicio: r.inicio,
    fin: r.fin,
    duracion: duracionConocida(sesion) ? r.duracion : '',
    ejerciciosTexto: `${r.ejerciciosHechos} de ${r.ejercicios.length} ${r.ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}`,
    seriesTexto: r.seriesTexto,
    /* 🚨 Apartado 26 — solo cuando es matemáticamente válido. Es el de la F8,
       que ya deja fuera el peso corporal y los isométricos, y dice de cuántas
       series sale para que el número no parezca el total. */
    volumen: volumen ? {
      texto: volumen.texto,
      nota: volumen.parcial
        ? `De ${volumen.series} ${volumen.series === 1 ? 'serie' : 'series'} con carga. Las demás no se miden en kilos.`
        : '',
    } : null,
    entornoNombre: nombreEntorno(entorno),
    planNombre: texto(sesion.diaDePlan?.nombre) && texto(sesion.diaDePlan?.nombre) !== r.nombre
      ? texto(sesion.diaDePlan.nombre) : '',
    notas: r.notas,
    ejercicios,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · ELIMINAR (apartados 28 y 29)
   ═══════════════════════════════════════════════════════════════════════════
   🚨 **Por la papelera**, como todo lo que se borra en esta aplicación (EH F45
   y la F4 con las plantillas): *"eliminará la sesión del historial"* se cumple
   igual, y equivocarse de tarjeta deja de ser irreversible. Por eso el aviso
   promete que se recupera — y promete solo lo que hace. */

export const AVISO_ELIMINAR_SESION = {
  titulo: '¿Eliminar este entrenamiento?',
  texto: 'Esta acción eliminará la sesión del historial. Podrás recuperarla desde la Papelera.',
  cancelar: 'Cancelar',
  eliminar: 'Eliminar',
};

/** Apartado 29 — *"Si la sesión ya no existe: mostrar un estado coherente."* */
export const SESION_YA_NO_ESTA = {
  titulo: 'Este entrenamiento ya no está',
  texto: 'Puede que lo hayas eliminado. El resto de tu historial sigue aquí.',
  volver: 'Volver al historial',
};

/** La sesión abierta, o `null` si ya no existe o dejó de ser del historial. */
export function sesionDelHistorial(fitness, id) {
  return sesionesDelHistorial(fitness).find((s) => s.id === id) || null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · LO QUE NO SE CONSTRUYE
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT10 = [
  { que: 'Gráficas, récords, evolución, rangos e IA', porque: 'Apartado 45: son la F11 en adelante.' },
  { que: 'Editar una sesión del historial', porque: 'Apartado 30: *"Los datos registrados representan lo que ocurrió."* Solo consulta y eliminación.' },
  { que: 'Compartir', porque: 'Apartado 31: no hay sistema social, y un botón sin función es un botón muerto.' },
  { que: 'La foto o el vídeo de la sesión', porque: 'Apartado 27: se enseña «si existe». No puede existir: no hay dónde guardarla (FIT F8, `MEDIA_PENDIENTE`), así que no se pinta ni un bloque vacío.' },
  { que: 'Un estado de carga y de error propios, con «Reintentar»', porque: 'Apartado 35. El historial no hace una lectura aparte: lee `fitness`, que la aplicación ya cargó al entrar y cuyo fallo ya gestiona. Un «Reintentar» que no tiene nada que reintentar es un control decorativo (regla 8). Los estados «vacío» y «sin resultados» sí están.' },
];

export const DECISIONES_FIT10 = [
  { que: 'El historial vive en Entrenamiento → Historial', porque: 'Apartado 2, y es la sección donde ya están Más planes y Ejercicios. Ni una navegación nueva.' },
  { que: 'Eliminar va a la Papelera', porque: 'Es lo que hace toda la aplicación desde EH F45; el aviso lo dice.' },
  { que: 'El entorno se guarda al empezar', porque: 'Apartado 13. Deducirlo solo del plan se rompería al borrar el plan; las sesiones de antes lo deducen si pueden.' },
  { que: 'Agrupar por fecha solo ordenando por fecha', porque: 'Apartado 5. Ordenando por duración, los grupos saldrían partidos.' },
];
