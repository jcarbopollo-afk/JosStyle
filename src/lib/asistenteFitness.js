/* Fase 2 · Chatbots — el asistente de Fitness
   ═══════════════════════════════════════════════════════════════════════════

   Solo lee `fitness` y cada cifra sale del motor de la pantalla que la enseña:
   el historial es `historial.js` (F10: solo entrenamientos COMPLETADOS), una
   ficha es `fichaDeHistorial`, el progreso de un ejercicio es
   `progresoDeEjercicio` (F11: compara solo la misma clase —carga, lastre,
   repeticiones o tiempo—), el plan es `tuPlan` (F6/F32) y los objetivos son
   `listaDeObjetivos` (F14/F30). Especificación §8.1.

   🚨 **Un entrenamiento con fecha posterior a hoy no es «el último» ni cuenta
   en un periodo** (CX-19), y se dice cuántos se dejan fuera. Y la calistenia de
   antes **no se lee**: este asistente solo recibe `fitness` (su `lee`). */

import { historialPorReciente, sesionesPorDia, fichaDeHistorial } from './historial';
import { sesionesDelHistorial } from './sesionesCompletadas';
import { progresoDeEjercicio, indiceDeProgresion, TENDENCIAS } from './progresion';
import { tuPlan, ESTADOS_DIA } from './tuPlan';
import { listaDeObjetivos } from './objetivosProgreso';
import { ejerciciosParaLeer, nombreCompleto } from './ejercicios';
import { fechaValida } from './helpers';
import { etiquetaDeDia, etiquetaDeRango, diasDelRango, diaDeLaSemana, diaYMesConversacion } from './fechasConversacion';
import { bTexto, bNota, bCifra, bLista, plural } from './motorConversacion';

const lista = (x) => (Array.isArray(x) ? x : []);
const mayuscula = (t) => (t ? t[0].toUpperCase() + t.slice(1) : t);
const DIAS_CORTOS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const propiosDe = (fitness) => lista((fitness || {}).ejercicios);
const etiquetaP = (p, hoy) => p.etiqueta || etiquetaDeRango(p.desde, p.hasta, hoy);
const FUENTE = 'Fitness · tus entrenamientos completados';

/** Los completados hasta hoy y cuántos tienen una fecha que todavía no ha llegado. */
function completadosHastaHoy(fitness, hoy) {
  const todos = historialPorReciente(fitness);
  return { sesiones: todos.filter((s) => s.fecha <= hoy), futuras: todos.filter((s) => s.fecha > hoy).length };
}

/* Para el progreso, el récord y los objetivos: el `fitness` con solo lo completado HASTA HOY. Un
   entrenamiento con fecha futura no puede ser tu mejor marca de hoy (CX-19). Una copia: no se toca nada. */
function hastaHoy(fitness, hoy) {
  const sesiones = lista((fitness || {}).sesiones);
  const futuras = sesiones.filter((s) => s && s.estado === 'completada' && fechaValida(s.fecha) && s.fecha > hoy).length;
  return { fitness: futuras ? { ...fitness, sesiones: sesiones.filter((s) => !(s && fechaValida(s.fecha) && s.fecha > hoy)) } : fitness, futuras };
}

const notaFuturas = (n) => (n ? [bNota(`${plural(n, 'entrenamiento tiene', 'entrenamientos tienen')} una fecha que todavía no ha llegado y no ${n === 1 ? 'lo cuento' : 'los cuento'}.`)] : []);

function lineaDeFicha(f, hoy) {
  const partes = [f.nombre];
  if (f.duracion) partes.push(f.duracion);
  partes.push(f.seriesTexto);
  return `${DIAS_CORTOS[diaDeLaSemana(f.fecha)]} ${diaYMesConversacion(f.fecha, hoy)}: ${partes.join(' · ')}`;
}

/* ══════════════════════════════════════════════════════════════════════════
   Las capacidades
   ══════════════════════════════════════════════════════════════════════════ */

function ultimo(datos, { hoy }) {
  const fitness = datos.fitness || {};
  const { sesiones, futuras } = completadosHastaHoy(fitness, hoy);
  if (!sesiones.length) {
    return { sinDatos: true, bloques: [bTexto('Todavía no tienes ningún entrenamiento completado en Fitness.'), ...notaFuturas(futuras)], fuente: FUENTE };
  }
  const f = fichaDeHistorial(sesiones[0], { fitness, propios: propiosDe(fitness), hoy });
  const hace = diasDelRango(f.fecha, hoy) - 1;
  const bloques = [
    bTexto(`Tu último entrenamiento fue ${etiquetaDeDia(f.fecha, hoy)}: ${f.nombre}.`),
    bCifra('Duración', f.duracion || 'no se sabe', f.duracion ? 'calculo' : 'dato'),
    bCifra('Series hechas', f.seriesTexto, 'dato'),
    bCifra('Ejercicios', f.ejerciciosTexto, 'dato'),
  ];
  if (hace > 1) bloques.push(bCifra('Desde entonces', plural(hace, 'día', 'días'), 'calculo'));
  bloques.push(...notaFuturas(futuras));
  return { bloques, fuente: FUENTE };
}

function dia(datos, { periodo, hoy }) {
  const fitness = datos.fitness || {};
  const fecha = periodo.desde;
  const delDia = (sesionesPorDia(sesionesDelHistorial(fitness)).get(fecha) || []);
  const cuando = etiquetaDeDia(fecha, hoy);
  if (!delDia.length) {
    const antes = historialPorReciente(fitness).find((s) => s.fecha < fecha);
    return {
      sinDatos: true,
      bloques: [bTexto(`No tienes ningún entrenamiento completado ${cuando}.`),
        bNota(antes ? `El anterior fue ${etiquetaDeDia(antes.fecha, hoy)}.` : 'No hay ninguno antes de esa fecha.')],
      fuente: FUENTE,
    };
  }
  const fichas = delDia.map((s) => fichaDeHistorial(s, { fitness, propios: propiosDe(fitness), hoy }));
  if (fichas.length === 1) {
    const f = fichas[0];
    return {
      bloques: [bTexto(`${mayuscula(cuando)} completaste ${f.nombre}.`), bCifra('Duración', f.duracion || 'no se sabe', f.duracion ? 'calculo' : 'dato'), bCifra('Series hechas', f.seriesTexto, 'dato'), bCifra('Ejercicios', f.ejerciciosTexto, 'dato')],
      fuente: FUENTE,
    };
  }
  return { bloques: [bTexto(`${mayuscula(cuando)} completaste ${fichas.length} entrenamientos:`), bLista(fichas.map((f) => lineaDeFicha(f, hoy)))], fuente: FUENTE };
}

function cuantos(datos, { periodo, hoy }) {
  const fitness = datos.fitness || {};
  if (periodo.tipo === 'dia') return dia(datos, { periodo, hoy });
  const { sesiones, futuras } = completadosHastaHoy(fitness, hoy);
  const dentro = sesiones.filter((s) => s.fecha >= periodo.desde && s.fecha <= periodo.hasta);
  const etiqueta = etiquetaP(periodo, hoy);
  if (!dentro.length) {
    const antes = sesiones.find((s) => s.fecha < periodo.desde);
    return { sinDatos: true, bloques: [bTexto(`No tienes entrenamientos completados ${etiqueta}.`), bNota(antes ? `El último antes fue ${etiquetaDeDia(antes.fecha, hoy)}.` : 'Todavía no tienes ninguno antes.'), ...notaFuturas(futuras)], fuente: FUENTE };
  }
  const dias = sesionesPorDia(dentro).size;
  const fichas = dentro.map((s) => fichaDeHistorial(s, { fitness, propios: propiosDe(fitness), hoy }));
  const bloques = [
    bTexto(`${mayuscula(etiqueta)} has completado ${plural(dentro.length, 'entrenamiento', 'entrenamientos')}${dias !== dentro.length ? ` en ${plural(dias, 'día', 'días')}` : ''}.`),
    bCifra('Entrenamientos', String(dentro.length), 'dato'),
    bCifra('Días con entrenamiento', `${dias} de ${diasDelRango(periodo.desde, periodo.hasta)}`, 'dato'),
    bLista(fichas.map((f) => lineaDeFicha(f, hoy))),
  ];
  if (periodo.recortado) bloques.push(bNota('Cuento hasta hoy: lo que queda del periodo todavía no ha pasado.'));
  bloques.push(bNota('Un día sin entrenamiento apuntado no se cuenta como descanso: solo que no hay nada registrado.'));
  bloques.push(...notaFuturas(futuras));
  return { bloques, fuente: `${FUENTE} ${etiqueta}` };
}

function plan(datos, { periodo, hoy }) {
  const fitness = datos.fitness || {};
  const tp = tuPlan(fitness, { hoy });
  if (tp.estado === 'sin_plan') return { sinDatos: true, bloques: [bTexto('No tienes un plan activo. En «Tu Plan» puedes elegir uno o usar una de tus plantillas.')], fuente: 'Fitness · Tu Plan' };
  if (tp.estado === 'perdido') return { sinDatos: true, bloques: [bTexto('El plan que tenías activo ya no existe, así que no sé qué toca. Puedes elegir otro en «Tu Plan».')], fuente: 'Fitness · Tu Plan' };
  const fecha = periodo ? periodo.desde : hoy;
  const casilla = lista(tp.semana).find((d) => d.fecha === fecha) || null;
  const nombrePlan = tp.plan && tp.plan.nombre ? tp.plan.nombre : 'tu plan';
  const proximo = tp.proximo;
  const textoProximo = proximo ? `${proximo.cuando}: ${proximo.sesion && proximo.sesion.nombre ? proximo.sesion.nombre : proximo.nombre || 'entrenamiento'}${proximo.duracion ? ` (${proximo.duracion})` : ''}` : null;
  const bloques = [];
  if (!casilla) {
    bloques.push(bTexto(`Solo veo la semana actual de ${nombrePlan}.`));
    if (textoProximo) bloques.push(bCifra('El próximo', textoProximo, 'lectura'));
    return { bloques, fuente: `Fitness · Tu Plan (${nombrePlan})` };
  }
  const cuando = etiquetaDeDia(fecha, hoy);
  if (casilla.fueraDelPlan) bloques.push(bTexto(`${mayuscula(cuando)} es antes de que empezaras ${nombrePlan}.`));
  else if (casilla.estado === 'completado') bloques.push(bTexto(`${mayuscula(cuando)} ya completaste el entrenamiento: ${lista(casilla.realizadas).length ? lista(casilla.realizadas).map((s) => fichaDeHistorial(s, { fitness, propios: propiosDe(fitness), hoy }).nombre).join(', ') : casilla.nombre}.`));
  else if (casilla.descanso) bloques.push(bTexto(`${mayuscula(cuando)} ${nombrePlan} no tiene entrenamiento planificado. Si entrenas por tu cuenta, contará como entrenamiento extra.`));
  else bloques.push(bTexto(`${mayuscula(cuando)} toca ${casilla.nombre || 'entrenar'}${casilla.ejercicios ? ` (${plural(casilla.ejercicios, 'ejercicio', 'ejercicios')}${casilla.duracion ? `, ${casilla.duracion}` : ''})` : ''}.`));
  const estado = ESTADOS_DIA.find((e) => e.id === casilla.estado);
  if (estado && !casilla.fueraDelPlan) bloques.push(bCifra('Según tu plan', estado.nombre, 'lectura'));
  if (textoProximo && !(casilla.estado === 'hoy' && proximo && proximo.esHoy)) bloques.push(bCifra('El próximo', textoProximo, 'lectura'));
  return { bloques, fuente: `Fitness · Tu Plan (${nombrePlan})` };
}

function ejercicio(datos, { entidad, hoy }) {
  const { fitness, futuras } = hastaHoy(datos.fitness || {}, hoy);
  const p = progresoDeEjercicio(fitness, entidad.id, { propios: propiosDe(fitness) });
  if (p.nuevo || !p.ultima) {
    return { sinDatos: true, bloques: [bTexto(`Todavía no has registrado ${entidad.nombre} en ningún entrenamiento completado.`), ...notaFuturas(futuras)], fuente: FUENTE };
  }
  const tendencia = TENDENCIAS.find((t) => t.id === p.tendencia) || TENDENCIAS[TENDENCIAS.length - 1];
  const bloques = [
    bTexto(`La última vez que hiciste ${entidad.nombre} fue ${etiquetaDeDia(p.ultima.fecha, hoy)}: ${p.ultima.texto}.`),
    bCifra('Mejor serie de ese día', p.ultima.mejor || '—', 'dato'),
  ];
  if (p.anterior) bloques.push(bCifra('La vez anterior comparable', `${p.anterior.texto} (${etiquetaDeDia(p.anterior.fecha, hoy)})`, 'dato'));
  bloques.push(bCifra('Tendencia', tendencia.nombre, 'lectura', p.comparacion && p.comparacion.texto && p.comparacion.texto !== tendencia.nombre ? p.comparacion.texto : null));
  bloques.push(bCifra('Veces registrado', String(p.veces), 'dato'));
  if (p.cambioDeMedida) bloques.push(bNota('La última vez lo hiciste de otra forma (otra medida o con lastre), así que no lo comparo con la anterior.'));
  bloques.push(bNota('La tendencia sale de la regla de Progreso: compara con la última vez que lo hiciste de la misma forma.'));
  bloques.push(...notaFuturas(futuras));
  return { bloques, fuente: `Fitness · ${plural(p.veces, 'entrenamiento', 'entrenamientos')} con este ejercicio` };
}

function record(datos, { entidad, hoy }) {
  const { fitness, futuras } = hastaHoy(datos.fitness || {}, hoy);
  const p = progresoDeEjercicio(fitness, entidad.id, { propios: propiosDe(fitness) });
  if (!p.mejor) return { sinDatos: true, bloques: [bTexto(`Todavía no tienes ninguna marca de ${entidad.nombre}: no aparece en ningún entrenamiento completado hasta hoy.`), ...notaFuturas(futuras)], fuente: FUENTE };
  return {
    bloques: [
      bTexto(`Tu mejor marca en ${entidad.nombre} es ${p.mejor.texto}, ${etiquetaDeDia(p.mejor.fecha, hoy)}.`),
      bCifra('Mejor marca', p.mejor.texto, 'calculo', `entre ${plural(p.veces, 'vez', 'veces')}`),
      bNota('Comparo solo las veces que lo hiciste de la misma forma (con peso, con lastre, por repeticiones o por tiempo), como la pantalla de Progreso.'),
    ],
    fuente: `Fitness · ${plural(p.veces, 'entrenamiento', 'entrenamientos')} con este ejercicio`,
  };
}

function objetivos(datos, { entidad, hoy }) {
  const { fitness } = hastaHoy(datos.fitness || {}, hoy);
  const l = listaDeObjetivos(fitness, { propios: propiosDe(fitness), hoy });
  let visibles = lista(l.objetivos);
  if (entidad) visibles = visibles.filter((o) => o.exerciseId === entidad.id);
  if (!visibles.length) {
    return { sinDatos: true, bloques: [bTexto(entidad ? `No tienes ningún objetivo de ${entidad.nombre}.` : 'No tienes objetivos de Fitness. Puedes crearlos en Progreso → Objetivos.')], fuente: 'Fitness · tus objetivos' };
  }
  const activos = visibles.filter((o) => o.estado === 'activo');
  const conseguidos = visibles.filter((o) => o.estado === 'completado');
  const items = visibles.map((o) => `${o.nombre} · ${o.metrica}: ${o.progresoTexto || o.objetivoTexto} (${o.estadoNombre})`);
  return {
    bloques: [
      bTexto(`Tienes ${plural(activos.length, 'objetivo activo', 'objetivos activos')}${conseguidos.length ? ` y ${plural(conseguidos.length, 'conseguido', 'conseguidos')}` : ''}.`),
      bLista(items),
      bNota('El progreso sale de tus entrenamientos completados: tu mejor marca frente a lo que te pusiste.'),
    ],
    fuente: 'Fitness · tus objetivos',
  };
}

/* ── Las entidades: los ejercicios, con los que tienen historia primero ───── */
function entidades(datos) {
  const fitness = datos.fitness || {};
  const propios = propiosDe(fitness);
  let indice;
  try { indice = indiceDeProgresion(fitness, propios); } catch { indice = new Map(); }
  const conHistoria = [...indice.keys()];
  const reciente = (id) => {
    const a = lista(indice.get(id));
    const f = a.length && fechaValida(a[0].fecha) ? a[0].fecha : null;
    return f ? Number(f.replace(/-/g, '')) : 0;
  };
  return {
    ejercicio: ejerciciosParaLeer(propios, conHistoria).map((ej) => ({
      tipo: 'ejercicio', id: ej.id, nombre: nombreCompleto(ej),
      alias: [ej.nombre, ej.nombreTecnico, ej.nombreCorto].filter(Boolean),
      reciente: reciente(ej.id),
    })),
  };
}

export const ASISTENTE_FITNESS = {
  id: 'fitness',
  modulo: 'entreno',
  nombre: 'Fitness',
  lee: ['fitness'],
  saludo: '¡Hola! Pregúntame por tus entrenamientos: el último, cuántos llevas, qué toca hoy o cómo vas en un ejercicio.',
  lexico: {
    entrenar: ['entren*', 'entreno', 'entrene', 'gimnasio', 'pesas', 'deporte', 'sesion', 'sesiones', 'workout', 'he ido al gimnasio', 'fui al gimnasio', 'fitness'],
    /* «=que entrene» exacta: «que entreno hoy» es preguntar por el plan, no por lo que hizo. */
    que_hice: ['que hice', '=que entrene', 'que he hecho', 'que he entrenado', 'he entrenado', 'hice algo', 'fui al gimnasio', '=entrene el', '=entrene ayer'],
    veces: ['veces', 'cuantas veces', 'dias', 'cuantos dias', 'cuantos entrenos', 'cuantos entrenamientos'],
    toca: ['que toca', 'me toca', 'toca hoy', 'que entreno hoy', 'que entreno', 'que tengo que entrenar', 'que hago hoy', 'que dia toca'],
    plan: ['plan', 'mi plan', 'plantilla', 'planificado', 'tu plan'],
    progreso: ['como voy', 'como va', 'como llevo', 'progreso', 'progres*', 'evolucion', 'avance', 'como me va', 'tendencia', 'que tal voy', 'ultima vez que hice', 'he mejorado', 'he subido'],
    objetivo: ['objetivo', 'objetivos', 'reto', 'retos', 'meta de', 'metas'],
    ejercicio_generico: ['ejercicio', 'ejercicios'],
  },
  capacidades: [
    { id: 'ultimo', titulo: 'Tu último entrenamiento', ejemplo: '¿Cuándo fue mi último entrenamiento?', senales: { ultimo: 4, entrenar: 2, cuando: 1 }, necesita: [['ultimo']], periodo: null, prioridad: 2, ejecutar: ultimo },
    { id: 'dia', titulo: 'Qué entrenaste un día', ejemplo: '¿Qué entrené ayer?', senales: { que_hice: 3, entrenar: 2 }, necesita: [['entrenar', 'que_hice']], periodo: 'dia', siRango: 'cuantos', porDefecto: 'hoy', prioridad: 3, ejecutar: dia },
    { id: 'cuantos', titulo: 'Cuántos entrenamientos llevas', ejemplo: '¿Cuántas veces he entrenado esta semana?', senales: { entrenar: 2, cuanto: 2, veces: 2 }, necesita: [['entrenar', 'veces']], periodo: 'rango', porDefecto: 'estaSemana', prioridad: 2, ejecutar: cuantos },
    { id: 'plan', titulo: 'Qué toca según tu plan', ejemplo: '¿Qué me toca entrenar hoy?', senales: { toca: 4, plan: 3, proximo: 2, entrenar: 1 }, necesita: [['toca', 'plan', 'proximo']], periodo: 'dia', tiempo: 'futuro', porDefecto: 'hoy', prioridad: 2, cubreObligacion: true, ejecutar: plan },
    { id: 'ejercicio', titulo: 'Cómo vas en un ejercicio', ejemplo: '¿Cómo voy en dominadas pronas?', senales: { progreso: 3, ejercicio_generico: 1, entrenar: 1, ultimo: 1 }, necesita: [], entidad: { tipo: 'ejercicio', obligatoria: true, nombre: 'ejercicio', vacio: 'Todavía no tienes ejercicios en tu historial.' }, periodo: null, prioridad: 2, ejecutar: ejercicio },
    { id: 'record', titulo: 'Tu mejor marca en un ejercicio', ejemplo: '¿Cuál es mi récord en press de banca?', senales: { mejor: 4, ejercicio_generico: 1 }, necesita: [['mejor']], entidad: { tipo: 'ejercicio', obligatoria: true, nombre: 'ejercicio', vacio: 'Todavía no tienes ejercicios en tu historial.' }, periodo: null, prioridad: 1, ejecutar: record },
    { id: 'objetivos', titulo: 'Tus objetivos de Fitness', ejemplo: '¿Cómo van mis objetivos?', senales: { objetivo: 4 }, necesita: [['objetivo']], entidad: { tipo: 'ejercicio', obligatoria: false, nombre: 'ejercicio' }, periodo: null, prioridad: 1, ejecutar: objetivos },
  ],
  entidades,
};
