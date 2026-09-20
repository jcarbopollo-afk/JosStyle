import { todayISO, addDays } from './helpers';
import {
  indiceDeProgresion, progresoDeEjercicio, textoSerie, CLASES,
} from './progresion';
import {
  ejercicioPorId, todosLosEjercicios, musculoPrincipal, nombreCompleto, tipoEjercicio,
} from './ejercicios';
import { fechaLarga } from './finalizacion';
import { sesionesDelHistorial, normalizarBusqueda, etiquetaDeFecha } from './historial';

/* Entrega 4 · Fase 12/45 — «Pantalla de progreso por ejercicio».
   ═══════════════════════════════════════════════════════════════════════════

   *"¿Estoy mejorando?"* — respondido en pantalla, en Fitness → Progreso.

   🚨 **NI UNA COMPARACIÓN AQUÍ** (apartados 13 y 38: *"NO escribir `if current
   > previous` de forma independiente en cada componente"*). Qué es comparable,
   cuál es la mejor serie, la tendencia y el texto del cambio salen de
   `progresion.js` (F11). Este archivo **ordena, filtra, agrupa y prepara para
   pintar** lo que la F11 ya decidió. Si el historial dice *20 kg × 10*, esta
   pantalla dice *20 kg × 10*, porque las dos leen el mismo sitio (apartado 31). */

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LOS ESTADOS QUE VE ÉL (apartados 15 y 36)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ Cada uno con **palabra y símbolo** (apartado 34), y ninguno suena a
   reproche (apartado 15): «Descenso» es un dato, no una nota. */

export const ESTADOS_PROGRESO = [
  { id: 'mejora', nombre: 'Mejorando', simbolo: '↗', orden: 0 },
  { id: 'estable', nombre: 'Estable', simbolo: '→', orden: 1 },
  { id: 'descenso', nombre: 'Descenso', simbolo: '↘', orden: 2 },
  { id: 'primer_registro', nombre: 'Primer registro', simbolo: '•', orden: 3 },
  { id: 'no_comparable', nombre: 'No comparable', simbolo: '≠', orden: 4 },
  { id: 'sin_datos', nombre: 'Sin datos', simbolo: '–', orden: 5 },
];
export const estadoProgreso = (id) => ESTADOS_PROGRESO.find((e) => e.id === id) || ESTADOS_PROGRESO[5];

/** El estado que se enseña, a partir de la comparación de la F11. */
export function estadoDe(progreso) {
  if (!progreso || progreso.nuevo) return 'sin_datos';
  const e = progreso.comparacion?.estado;
  if (e === 'mejora' || e === 'estable' || e === 'descenso' || e === 'primer_registro' || e === 'no_comparable') return e;
  return 'sin_datos';
}
/* ⚠️ Se exporta desde la FIT F28: el resumen del progreso necesita saber qué
   estados son comparables, y escribir una segunda lista allí sería el día que
   una de las dos se quedara vieja. La regla vive aquí, donde se decidió. */
export const COMPARABLES = ['mejora', 'estable', 'descenso'];

/* Apartado 10 — los filtros. «Sin datos» junta lo que no se puede comparar
   todavía: una sola vez o un cambio de medida. */
export const FILTROS_PROGRESO = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'mejora', nombre: 'Mejorando' },
  { id: 'estable', nombre: 'Estables' },
  { id: 'descenso', nombre: 'Descenso' },
  { id: 'sin_datos', nombre: 'Sin datos' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LA TARJETA (apartados 6, 7 y 28)
   ═══════════════════════════════════════════════════════════════════════════ */

const nombreClase = (id) => CLASES.find((c) => c.id === id)?.nombre || '';

export function tarjetaDeProgreso(progreso, propios = []) {
  const ej = ejercicioPorId(progreso.exerciseId, propios);
  const principal = ej ? musculoPrincipal(ej) : null;
  const estado = estadoDe(progreso);
  const c = progreso.comparacion || {};
  return {
    exerciseId: progreso.exerciseId,
    nombre: ej ? nombreCompleto(ej) : progreso.nombre,
    existe: !!ej,
    grupo: principal ? principal.grupo : '',
    grupoId: principal ? principal.grupoId : null,
    estado,
    estadoNombre: estadoProgreso(estado).nombre,
    simbolo: estadoProgreso(estado).simbolo,
    /* Apartado 7 — la última marca es la MEJOR serie de la última sesión, que es
       la que la F11 compara. */
    ultima: progreso.ultima ? progreso.ultima.mejor : '',
    anterior: COMPARABLES.includes(estado) && progreso.anterior ? progreso.anterior.mejor : '',
    cambio: COMPARABLES.includes(estado) ? c.texto : '',
    fecha: progreso.ultima ? progreso.ultima.fecha : '',
    veces: progreso.veces,
    textoBusqueda: normalizarBusqueda(`${ej ? nombreCompleto(ej) : progreso.nombre} ${principal ? principal.grupo : ''}`),
  };
}

/** Todas las tarjetas de lo que ha entrenado. ⚠️ Usa el índice de la F11, que
 *  se construye una vez por lista de sesiones (apartado 32). */
export function tarjetasDeProgreso(fitness, { propios = [] } = {}) {
  const indice = indiceDeProgresion(fitness, propios);
  return [...indice.keys()].map((id) => tarjetaDeProgreso(progresoDeEjercicio(fitness, id, { propios }), propios));
}

/** Apartado 8 — primero **lo que tiene información**; dentro, lo más reciente;
 *  y a igual fecha, mejora → estable → descenso. */
export function ordenarTarjetas(tarjetas) {
  return [...lista(tarjetas)].sort((a, b) => {
    const ca = COMPARABLES.includes(a.estado) ? 0 : 1;
    const cb = COMPARABLES.includes(b.estado) ? 0 : 1;
    if (ca !== cb) return ca - cb;
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1;
    return estadoProgreso(a.estado).orden - estadoProgreso(b.estado).orden;
  });
}

/**
 * Apartados 8, 9 y 10 — la lista que se pinta. Con búsqueda, además, los
 * ejercicios del catálogo **que nunca ha hecho**, aparte: *"no debe mezclarse
 * con el listado principal"*.
 */
export function consultarProgreso(tarjetas, { busqueda = '', filtro = 'todos', propios = [] } = {}) {
  const q = normalizarBusqueda(busqueda);
  const filtradas = ordenarTarjetas(tarjetas).filter((t) => {
    if (q && !t.textoBusqueda.includes(q)) return false;
    if (filtro === 'todos') return true;
    if (filtro === 'sin_datos') return !COMPARABLES.includes(t.estado);
    return t.estado === filtro;
  });
  const hechos = new Set(lista(tarjetas).map((t) => t.exerciseId));
  const nuncaHechos = q
    ? todosLosEjercicios(propios)
      .filter((e) => !hechos.has(e.id) && normalizarBusqueda(`${nombreCompleto(e)} ${musculoPrincipal(e)?.grupo || ''}`).includes(q))
      .slice(0, 8)
      .map((e) => ({ exerciseId: e.id, nombre: nombreCompleto(e), grupo: musculoPrincipal(e)?.grupo || '' }))
    : [];
  return { tarjetas: filtradas, nuncaHechos, total: lista(tarjetas).length };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · EL RESUMEN (apartados 3, 4, 5 y 26)
   ═══════════════════════════════════════════════════════════════════════════ */

export const PROGRESO_VACIO = {
  titulo: 'Tu progreso aparecerá aquí',
  texto: 'Completa varios entrenamientos para empezar a comparar tu rendimiento.',
  cta: 'Entrenar ahora',
};

/** Cuántos cambios recientes enseña el resumen (apartado 26). */
export const CAMBIOS_RECIENTES = 5;

export function resumenDeProgreso(fitness, tarjetas) {
  const t = lista(tarjetas);
  const cuenta = (id) => t.filter((x) => x.estado === id).length;
  const comparables = t.filter((x) => COMPARABLES.includes(x.estado)).length;
  return {
    entrenamientos: sesionesDelHistorial(fitness).length,
    mejorando: cuenta('mejora'),
    estables: cuenta('estable'),
    descenso: cuenta('descenso'),
    /* 🚨 Apartado 5 — sin NINGÚN ejercicio comparable, las cifras no se pintan:
       «0 mejorando» con un solo entrenamiento sería una estadística falsa. */
    suficiente: comparables > 0,
    /* Apartado 26 — solo cambios REALES: mejoras con su antes y su después. */
    recientes: ordenarTarjetas(t)
      .filter((x) => x.estado === 'mejora' && x.anterior && x.ultima)
      .slice(0, CAMBIOS_RECIENTES)
      .map((x) => ({ exerciseId: x.exerciseId, nombre: x.nombre, antes: x.anterior, despues: x.ultima, cambio: x.cambio })),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · EL DETALLE (apartados 11-20)
   ═══════════════════════════════════════════════════════════════════════════ */

const decimal = (n) => String(Math.round(n * 100) / 100).replace('.', ',');

/** *"Serie 1 — 20 kg × 10"* (apartado 17). ⚠️ Lo mismo que el historial: las
 *  series HECHAS, con los datos que se guardaron. */
function lineasDeSeries(clase, series) {
  return lista(series).map((s, i) => `Serie ${s.numero || i + 1} — ${textoSerie(clase, s)}`);
}

export const RANGOS_GRAFICA = [
  { id: '7d', nombre: '7 días', dias: 7 },
  { id: '30d', nombre: '30 días', dias: 30 },
  { id: '3m', nombre: '3 meses', dias: 91 },
  { id: 'todo', nombre: 'Todo', dias: null },
];

/* Apartado 22 — qué mide la gráfica, según la clase. Una sola métrica por
   gráfica, con su etiqueta. */
const METRICA_GRAFICA = {
  carga: { campo: 'peso', etiqueta: 'Mejor peso por sesión', unidad: 'kg' },
  lastre: { campo: 'peso', etiqueta: 'Mejor peso añadido por sesión', unidad: 'kg' },
  repeticiones: { campo: 'reps', etiqueta: 'Mejores repeticiones por sesión', unidad: 'reps' },
  tiempo: { campo: 'duracion', etiqueta: 'Mejor tiempo por sesión', unidad: 's' },
};

/** Cuántos puntos hacen falta para que una gráfica diga algo (apartado 23):
 *  con 1 no hay línea, y con 2 ya lo dice la comparación de arriba. */
export const PUNTOS_MINIMOS_GRAFICA = 3;

/**
 * La gráfica (apartados 21-24). 🚨 **Solo la clase de la última vez**: si antes
 * lo hacía sin lastre y ahora con lastre, mezclar repeticiones y kilos en una
 * línea sería dibujar dos cosas distintas como si fueran una (apartado 22).
 */
export function graficaDeProgreso(progreso, { rango = 'todo', hoy = todayISO() } = {}) {
  const ultima = progreso?.apariciones?.[0];
  if (!ultima) return { puntos: [], mostrar: false, etiqueta: '', unidad: '' };
  const m = METRICA_GRAFICA[ultima.clase];
  const r = RANGOS_GRAFICA.find((x) => x.id === rango) || RANGOS_GRAFICA[3];
  const desde = r.dias ? addDays(hoy, -r.dias) : null;
  const puntos = progreso.apariciones
    .filter((a) => a.clase === ultima.clase && a.mejor && (!desde || a.fecha >= desde))
    .map((a) => ({
      sesionId: a.sesionId,
      fecha: a.fecha,
      fechaTexto: fechaLarga(a.fecha),
      valor: a.mejor[m.campo],
      texto: textoSerie(a.clase, a.mejor),
    }))
    .filter((p) => typeof p.valor === 'number' && Number.isFinite(p.valor))
    .reverse();
  return {
    puntos,
    mostrar: puntos.length >= PUNTOS_MINIMOS_GRAFICA,
    etiqueta: m.etiqueta,
    unidad: m.unidad,
    clase: ultima.clase,
    /* Para decir por qué no hay gráfica, en vez de dejar un hueco. */
    motivo: puntos.length === 0 ? 'No hay registros en este periodo.'
      : puntos.length < PUNTOS_MINIMOS_GRAFICA ? 'Hacen falta al menos tres registros para ver la evolución.' : '',
  };
}

/** Coordenadas de la gráfica, puras, para que el componente solo dibuje.
 *  ⚠️ Con todos los valores iguales, la línea va en medio en vez de dividir
 *  entre cero. */
export function geometriaGrafica(puntos, { ancho = 320, alto = 140, margen = 16 } = {}) {
  const l = lista(puntos);
  if (!l.length) return [];
  const valores = l.map((p) => p.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const utilAncho = ancho - margen * 2;
  const utilAlto = alto - margen * 2;
  return l.map((p, i) => ({
    ...p,
    x: margen + (l.length === 1 ? utilAncho / 2 : (i / (l.length - 1)) * utilAncho),
    y: max === min ? alto / 2 : margen + (1 - (p.valor - min) / (max - min)) * utilAlto,
  }));
}

export function detalleDeProgreso(fitness, exerciseId, { propios = [], rango = 'todo', hoy = todayISO() } = {}) {
  const p = progresoDeEjercicio(fitness, exerciseId, { propios });
  const ej = ejercicioPorId(texto(exerciseId), propios);
  const principal = ej ? musculoPrincipal(ej) : null;
  const tipo = ej ? tipoEjercicio(lista(ej.tipos)[0]) : null;
  const estado = estadoDe(p);
  const c = p.comparacion || {};
  const clase = p.ultima ? p.ultima.clase : null;
  return {
    exerciseId: p.exerciseId,
    /* Apartado 20 — la variante, a la vista: «Dominada · Supina». */
    nombre: ej ? nombreCompleto(ej) : p.nombre,
    existe: !!ej,
    tipo: tipo ? tipo.nombre : '',
    grupo: principal ? principal.grupo : '',
    medida: nombreClase(clase),
    estado,
    estadoNombre: estadoProgreso(estado).nombre,
    simbolo: estadoProgreso(estado).simbolo,
    ultima: p.ultima ? { texto: p.ultima.mejor, fecha: p.ultima.fecha, fechaTexto: etiquetaDeFecha(p.ultima.fecha, hoy) } : null,
    /* Apartado 13 — Anterior ↓ Actual, **solo si son comparables**. */
    comparacion: COMPARABLES.includes(estado) && p.anterior ? {
      antes: p.anterior.mejor,
      antesFecha: etiquetaDeFecha(p.anterior.fecha, hoy),
      despues: p.ultima.mejor,
      resultado: c.texto,
      porcentaje: c.cambios?.peso?.porcentaje ?? null,
    } : null,
    /* Apartado 18 — si cambió la forma de medirlo, se dice. */
    avisoMedida: estado === 'no_comparable' ? 'La última vez lo hiciste de otra forma (con otro peso o sin él), así que no se compara con la anterior.' : '',
    mejor: p.mejor ? { texto: p.mejor.texto, fecha: etiquetaDeFecha(p.mejor.fecha, hoy), sesionId: p.mejor.sesionId } : null,
    /* Apartado 14 — con una sola vez, «Primer registro» en vez de un «mejor» que
       es la única marca que hay. */
    soloUna: p.veces === 1,
    historial: lista(p.apariciones).map((a) => ({
      sesionId: a.sesionId,
      fecha: a.fecha,
      fechaTexto: etiquetaDeFecha(a.fecha, hoy),
      resumen: textoSerie(a.clase, a.mejor),
      medida: nombreClase(a.clase),
      series: lineasDeSeries(a.clase, a.series),
    })),
    grafica: graficaDeProgreso(p, { rango, hoy }),
    veces: p.veces,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LO QUE NO SE CONSTRUYE
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT12 = [
  { que: 'Rangos, rankings musculares, IA, predicciones y récords avanzados', porque: 'Apartado 43.' },
  { que: 'La sección de fotos completa', porque: 'Apartado 2: *"En esta fase NO construir todavía el sistema completo de fotos"*. La pestaña Fotos existe y cuenta las de Salud física, que es donde viven.' },
  { que: 'Porcentajes en las tarjetas', porque: 'F11, apartado 24: son secundarios. Solo aparecen en el detalle, y solo con carga.' },
  { que: 'Gráfica con uno o dos registros', porque: 'Apartado 23: con uno no hay línea, y con dos ya lo dice la comparación.' },
];
