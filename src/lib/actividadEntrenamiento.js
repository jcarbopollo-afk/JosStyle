import { todayISO, addDays, fechaValida } from './helpers';
import { sinDuplicadosPorId } from './fitness';
import {
  sesionesDelHistorial, fichaDeHistorial, historialPorReciente, etiquetaDeFecha, contadorTexto,
  sesionesPorDia,
} from './historial';
import { RANGOS_GRAFICA, periodo as periodoDelCatalogo, inicioDePeriodo } from './progresoEjercicios';
import { planActivoCompleto, posicionDelDia, planificadoEnFecha } from './tuPlan';
import { DIAS_SEMANA, diaDeFecha } from './horario';
import { CATALOGO_PLANES, planesAnterioresDe } from './planes';
import { celdasMes } from './calendario';
import { MESES } from './finalizacion';

/* Entrega 4 · Fase 31/45 — «Consistencia y actividad de entrenamiento».
   ═══════════════════════════════════════════════════════════════════════════

   *"¿Cuándo entrené por última vez? ¿Cuántos entrenamientos he hecho? ¿Cuántos
   hice esta semana? ¿Cómo está siendo mi constancia? ¿Qué días suelo entrenar?
   ¿Estoy siguiendo mi planificación?"* — **sin convertir estos datos en una
   puntuación artificial** (apartado 1).

   🚨 **NI UNA LISTA NUEVA, NI UN CONTADOR GUARDADO** (apartados 2, 18, 34 y 41:
   *"Todo basado exclusivamente en WorkoutSession y el plan existente. No
   duplicar datos."*). Esto es una **lectura** de `fitness.sesiones` a través
   del historial de la F10 —la misma puerta: completadas, con las parciales
   dentro y las descartadas fuera— y del plan activo de la F6. Así *"al terminar
   una sesión, el resumen debe actualizarse inmediatamente"* (apartado 33) no hay
   que programarlo: una sesión que la F8 guarda **ya está** en la lista que se
   lee, y una que se borra ya no está. Es la F15, la F22, la F24, la F28 y la
   F30 por sexta vez: lo que se puede derivar no se guarda.

   🚨 **Y LA RACHA NO ES DE AQUÍ** (apartado 16: *"NO crear todavía una racha
   global independiente. Si Jos Style ya tiene un sistema de streak: no
   duplicarlo"*). La lleva el motor de rachas (`rachas.js`, tipo `training`),
   que no guarda ni un contador y escribe **solo** desde `rachasServicio.js`
   (RA F1 y F2). Esta librería **ni lo importa**, y hay una comprobación que lee
   sus imports. Un segundo recuento de días seguidos diría un número distinto del
   de la pantalla de Rachas el primer día.

   ⚠️ **Y LA F31 DESTAPÓ CUATRO FALLOS DE ANTES, arreglados donde nacían** (no
   aquí, que habría sido taparlos):
     · «7 días» contaba **ocho** en toda Fitness → `inicioDePeriodo` (F12).
     · `PERIODOS_HISTORIAL` era **un segundo catálogo** (90/180 días) → subconjunto
       por ids del de la F12 (F22).
     · La «última sesión» de la F28 era **la más antigua** → `historialPorReciente`.
     · Una sesión guardada sin fecha **se mudaba a hoy en cada carga**, y una
       repetida contaba doble → la puerta de carga (F1/F7). */

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const decimal = (n) => String(n).replace('.', ',');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LO QUE YA EXISTÍA (apartados 2, 5, 12, 16, 18 y 22)
   ═══════════════════════════════════════════════════════════════════════════
   🚨 **LAS FUNCIONES, NO SUS NOMBRES** (FIT F27 y F29): renombrar una rompe la
   compilación, y hay una comprobación de que `y.es.name === y.nombre`. */

export const YA_LO_RESUELVE = [
  { nombre: 'sesionesDelHistorial', es: sesionesDelHistorial, fase: 'F10', resuelve: 'Qué sesiones cuentan (apartados 2 y 15): las `completada`, con las parciales dentro y las descartadas fuera.' },
  { nombre: 'fichaDeHistorial', es: fichaDeHistorial, fase: 'F10', resuelve: 'Nombre, duración y si fue parcial (apartados 3, 15 y 17) — la misma tarjeta que el historial, sin contar series aparte.' },
  { nombre: 'historialPorReciente', es: historialPorReciente, fase: 'F10 (arreglada en la F31)', resuelve: 'El orden: el último entrenamiento y los recientes (apartados 3 y 17).' },
  { nombre: 'inicioDePeriodo', es: inicioDePeriodo, fase: 'F12 (sacada a una función en la F31)', resuelve: '«Las mismas convenciones temporales del resto de Fitness» (apartado 5).' },
  { nombre: 'planActivoCompleto', es: planActivoCompleto, fase: 'F6', resuelve: 'El plan activo, sea de la biblioteca o una plantilla suya (apartado 11).' },
  { nombre: 'posicionDelDia', es: posicionDelDia, fase: 'F6', resuelve: 'Qué día del plan cae en cada fecha, con la estructura real del plan (apartado 12).' },
  { nombre: 'diaDeFecha', es: diaDeFecha, fase: 'HT F1', resuelve: 'La semana empieza el LUNES, en local — la convención que ya tenía la aplicación (apartado 22).' },
  { nombre: 'celdasMes', es: celdasMes, fase: 'Calendario Universal', resuelve: 'La cuadrícula del mes (apartado 7), con el hueco antes del día 1 ya resuelto (E3 F34).' },
  { nombre: 'sinDuplicadosPorId', es: sinDuplicadosPorId, fase: 'F1 (añadida en la F31)', resuelve: 'Una sesión guardada dos veces no son dos (apartado 23), en la puerta de carga.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   2 · EL TIEMPO (apartados 5, 21 y 22)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 **El día de una sesión es el día LOCAL en que EMPEZÓ** (`sesion.fecha`, que
   `empezarSesion` pone con `todayISO()` en la F7). Por eso *"entrenamiento
   justo antes de medianoche"* (apartado 39) es del día en que lo empezó aunque
   lo guarde a las 00:40, y *"justo después"* es del día siguiente. Es lo mismo
   que ya usan el historial, Tu Plan, la progresión y el calendario: con otra
   regla, el mismo entrenamiento saldría el 12 en una pantalla y el 13 en otra.

   ⚠️ Y la semana empieza el **lunes**, que es la convención que ya había
   (`diaDeFecha`, HT F1; `rangoDeFecha` de la F10; RA F1). El apartado 22 lo
   pide literal: *"Si Jos Style ya tiene una configuración global:
   REUTILIZARLA"*. */

/** Los cuatro del apartado 5 —«7 días · 30 días · 3 meses · Todo»— son **los
 *  de la F28**, del catálogo único de la F12. Ni un catálogo más. */
export const PERIODOS_ACTIVIDAD = RANGOS_GRAFICA;
export const PERIODO_ACTIVIDAD_POR_DEFECTO = 'todo';
export const periodoActividad = (id) => PERIODOS_ACTIVIDAD.find((p) => p.id === texto(id))
  || PERIODOS_ACTIVIDAD.find((p) => p.id === PERIODO_ACTIVIDAD_POR_DEFECTO);

/** El lunes de la semana de una fecha, o `null` si la fecha no es válida. */
export function lunesDe(iso) {
  if (!fechaValida(iso)) return null;
  return addDays(iso, -(diaDeFecha(iso) - 1));
}

/** Días naturales entre dos fechas locales, contando los dos extremos. */
function diasIncluidos(desde, hasta) {
  if (!fechaValida(desde) || !fechaValida(hasta) || desde > hasta) return 0;
  const a = new Date(`${desde}T00:00:00`);
  const b = new Date(`${hasta}T00:00:00`);
  /* ⚠️ `Math.round`: un cambio de hora de octubre mete un día de 25 horas. */
  return Math.round((b - a) / 86400000) + 1;
}

/** *"12 de septiembre"* (apartado 37). */
export function diaYMes(iso) {
  if (!fechaValida(iso)) return '';
  const [, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · QUÉ SESIONES ENTRAN (apartados 2, 15, 23 y 24)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Todas las del historial, sin repetidas por id. */
export function sesionesDeActividad(fitness) {
  return sinDuplicadosPorId(sesionesDelHistorial(fitness));
}

/** 🚨 Apartado 24 — *"Si no existe ninguno [timestamp]: no incluir la sesión en
 *  cálculos temporales. No romper el resumen."* Una sesión sin fecha válida
 *  **sigue contando en el total** —existe y está en el historial— pero no cae
 *  en ningún día, ninguna semana ni ningún periodo. */
export const conFecha = (s) => fechaValida(texto(s && s.fecha));

/** Las sesiones agrupadas por su día y, dentro de él, **en el orden en que
 *  las hizo** — no en el que estén guardadas: *«Core y Push»* si hizo Core por
 *  la mañana, aunque Push se guardara antes. 🔓 FIT F32 — la agrupación se mudó
 *  a `historial.js` (`sesionesPorDia`) para que la semana del plan use la
 *  misma: dos agrupaciones acabarían ordenando distinto el mismo día. */
const porDia = (sesiones) => sesionesPorDia(sesiones);

/* ═══════════════════════════════════════════════════════════════════════════
   4 · CADA DÍA (apartados 6, 12, 28, 29 y 37)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 **«SIN REGISTRO» NO ES «DESCANSO»** (apartados 28 y 29, dos veces). Un día
   sin sesión **no se sabe** qué fue: pudo descansar, pudo entrenar sin apuntarlo
   o pudo jugar un partido. Lo único que autoriza a decir «descanso» es **el
   plan**, y solo cuando el plan lo dice de ese día — y aun así se dice
   *«descanso del plan»*, que es de quién es la información. Y ni un color
   agresivo, ni un «fallo» (apartado 6: *"No interpretar — = fracaso"*). */

export const ESTADOS_ACTIVIDAD = [
  { id: 'entrenado', nombre: 'Entrenamiento', simbolo: '●', que: 'Hay al menos un entrenamiento guardado ese día.' },
  /* 🔓 FIT F32, apartado 5 — decía «Descanso del plan». La F32 va más lejos:
     ni siquiera un día sin sesión en el plan se afirma como descanso, *"porque
     puede haber entrenamiento libre"*. El id no cambia: es la forma del dato. */
  { id: 'descanso', nombre: 'Sin entrenamiento planificado', simbolo: '○', que: 'Tu plan no tenía entrenamiento ese día y no hay ninguno guardado. Lo dice el plan, y no afirma que descansaras.' },
  { id: 'sin_registro', nombre: 'Sin entrenamiento registrado', simbolo: '—', que: 'No hay ningún entrenamiento guardado. No significa que descansaras.' },
  { id: 'futuro', nombre: 'Todavía no ha llegado', simbolo: '·', que: 'Un día que aún no ha pasado: no se afirma nada de él.' },
];
export const estadoActividad = (id) => ESTADOS_ACTIVIDAD.find((e) => e.id === id) || null;

/** Qué dice el plan de una fecha: su nombre si toca entrenar, `descanso` si
 *  no tiene sesión, o nada si no se puede saber. ⚠️ Un día anterior a su
 *  activación **no es un día sin plan**: el plan no existía (FIT F6).
 *  🔓 FIT F32 — la respuesta es la de `planificadoEnFecha` (`tuPlan.js`), la
 *  misma que usa la semana del plan: con dos, el mismo día diría una cosa en
 *  Progreso y otra en Tu Plan. Y ahora lee también **el plan que había
 *  entonces** (apartado 22 de la F32), no solo el activo. */
function planDeLaFecha(contexto, fecha) {
  const p = contexto ? planificadoEnFecha(fecha, contexto) : null;
  /* Una plantilla como plan no tiene días fijos: no se dice que tocara (apartado 13). */
  if (!p || p.libre) return { nombre: '', descanso: false };
  /* Un tramo en el que se sabe que no había plan tampoco tenía sesión. */
  if (p.sinPlan || p.descanso) return { nombre: '', descanso: true };
  return { nombre: p.nombre, descanso: false };
}

/** 🔓 FIT F32 — el contexto con el que se lee **cada fecha**: el plan activo
 *  —sea de la biblioteca o suyo— y los anteriores. ⚠️ No es `contextoDelPlan`:
 *  aquél solo existe con una frecuencia definida, porque es el del bloque de
 *  seguimiento (apartado 13); para decir qué tenía el plan un día basta con
 *  saber qué plan había. */
function contextoDeFechas(fitness, planes, hoy) {
  const r = planActivoCompleto(fitness, planes);
  const vale = !!r && !r.perdido && !!r.plan;
  return {
    plan: vale ? r.plan : null,
    desde: vale && fechaValida(texto(r.activo.desde)) ? texto(r.activo.desde) : '',
    planId: vale ? r.activo.planId : '',
    origen: vale ? r.origen : '',
    anteriores: planesAnterioresDe(fitness),
    hoy,
  };
}

export function diaDeActividad(fecha, { sesionesDelDia = [], hoy = todayISO(), contextoPlan = null } = {}) {
  const futuro = fecha > hoy;
  const sesiones = lista(sesionesDelDia);
  const delPlan = futuro ? { nombre: '', descanso: false } : planDeLaFecha(contextoPlan, fecha);
  let estado;
  if (sesiones.length) estado = 'entrenado';
  else if (futuro) estado = 'futuro';
  else if (delPlan.descanso) estado = 'descanso';
  else estado = 'sin_registro';

  const nombres = sesiones.map((s) => texto(s.nombre) || 'Entrenamiento');
  const e = estadoActividad(estado);
  /* 🚨 Apartado 37 — *"12 de septiembre — entrenamiento Push"*: la etiqueta
     lleva la palabra, no solo el punto. */
  const que = estado === 'entrenado'
    ? (sesiones.length > 1 ? `${sesiones.length} entrenamientos: ${nombres.join(' y ')}` : `entrenamiento ${nombres[0]}`)
    : e.nombre.toLowerCase();
  const dia = diaDeFecha(fecha);
  return {
    fecha,
    dia,
    corto: DIAS_SEMANA[dia - 1]?.corto || '',
    nombreDia: DIAS_SEMANA[dia - 1]?.label || '',
    numero: Number(fecha.slice(8, 10)),
    esHoy: fecha === hoy,
    futuro,
    estado,
    simbolo: e.simbolo,
    sesiones: sesiones.map((s) => ({ id: s.id, nombre: texto(s.nombre) || 'Entrenamiento' })),
    /* Apartado 12 — lo que el plan decía de ese día, para enseñarlo al lado:
       **no** para medir si lo cumplió en ese día exacto. */
    planificado: delPlan.nombre,
    etiqueta: `${diaYMes(fecha)} — ${que}`,
    /* Apartado 30 — solo un día con entrenamiento lleva a algo. */
    navegable: sesiones.length > 0,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · EL PLAN (apartados 11-14, 25, 26 y 31)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 **SOLO CON UNA FRECUENCIA CLARAMENTE DEFINIDA** (apartado 13: *"Si no puede
   calcularse correctamente: ocultar este bloque"*). Un plan de la biblioteca la
   tiene —su semana es la del plan, F5 y F6—; **una plantilla suya activada como
   plan no**: la F6 dejó escrito que *"una rutina de una sesión no anuncia una
   frecuencia: él decide cuántos días a la semana la hace"*, y ciclándola desde
   que la activó saldrían **siete planificadas a la semana**, que es inventarle
   un compromiso. Ahí el bloque no existe.

   🚨 **REALIZADAS SON SUS ENTRENAMIENTOS DE LA SEMANA, NO LOS DÍAS EXACTOS DEL
   PLAN** (apartado 12: *"Si se entrenó el martes en lugar del lunes: NO marcar
   automáticamente como incumplimiento"*). Por eso se cuentan sesiones, y no
   casillas del plan acertadas. ⚠️ Y **cuentan todas** —también una plantilla que
   no es del plan, o una parcial—: son entrenamientos de verdad (apartado 14), y
   atarlas al `planId` castigaría hacer otra rutina el día que tocaba Push.

   🚨 **Y NUNCA UN PORCENTAJE** (apartado 14: *"no «133 % cumplimiento»"*). Con
   más sesiones que planificadas se dice *«5 entrenamientos · 4 planificados»*.

   ⚠️ **Solo desde que lo activó**: si lo activó el miércoles, el lunes no tenía
   nada planificado, y una sesión del lunes no era «de este plan». Contarla
   daría «3 / 2». */

/** El plan activo, **solo si su semana está definida**; si no, `null` — y
 *  entonces ni hay bloque del plan ni hay un día que se llame «descanso». */
export function contextoDelPlan(fitness, planes = CATALOGO_PLANES) {
  const r = planActivoCompleto(fitness, planes);
  if (!r || r.perdido || !r.plan) return null;
  const frecuencia = Number(r.plan.frecuencia);
  if (r.origen !== 'preset' || !Number.isInteger(frecuencia) || frecuencia < 1) return null;
  const desde = fechaValida(texto(r.activo.desde)) ? texto(r.activo.desde) : '';
  /* Un plan que no es de siete días solo se reparte ciclando desde que lo
     activó; sin esa fecha no hay semana (F6, apartado 16). */
  if (lista(r.plan.dias).length !== 7 && !desde) return null;
  return { plan: r.plan, origen: r.origen, desde, nombre: texto(r.plan.nombre), planId: r.activo.planId };
}

/** El seguimiento del plan en una semana, o `null` si no se puede calcular. */
export function adherenciaDelPlan(contexto, { lunes, hoy, porFecha }) {
  if (!contexto || !lunes) return null;
  const domingo = addDays(lunes, 6);
  const desde = contexto.desde && contexto.desde > lunes ? contexto.desde : lunes;
  if (desde > domingo) return null;

  const dias = [];
  for (let f = desde; f <= domingo; f = addDays(f, 1)) {
    /* ⚠️ Con su `hoy`: sin fecha de activación, el plan cubre desde la semana
       de HOY, y el reloj del dispositivo no es el hoy que se le pasa (F32). */
    const p = planDeLaFecha({ ...contexto, hoy }, f);
    if (p.nombre) dias.push({ fecha: f, nombre: p.nombre, corto: DIAS_SEMANA[diaDeFecha(f) - 1].corto });
  }
  if (!dias.length) return null;

  let realizadas = 0;
  for (let f = desde; f <= domingo && f <= hoy; f = addDays(f, 1)) realizadas += (porFecha.get(f) || []).length;
  const planificadas = dias.length;
  const hechasDelPlan = Math.min(realizadas, planificadas);
  const extra = Math.max(0, realizadas - planificadas);
  return {
    plan: contexto.nombre,
    planificadas,
    realizadas,
    /* Apartado 19 — `completedPlannedSessions`: las del plan cubiertas por
       entrenamientos de verdad, **sin pasar de las planificadas**. */
    hechasDelPlan,
    extra,
    dias,
    /* *"3 / 4 sesiones planificadas"*; y con sesiones de más, los dos números
       por separado — nunca uno encima del otro como si fuera una nota. */
    texto: extra > 0
      ? `${contadorTexto(realizadas)} · ${planificadas} ${planificadas === 1 ? 'planificado' : 'planificados'}`
      : `${realizadas} / ${planificadas} ${planificadas === 1 ? 'sesión planificada' : 'sesiones planificadas'}`,
    /* Apartado 12 — L Push · X Pull · V Legs, la estructura real. */
    detalle: dias.map((d) => `${d.corto} ${d.nombre}`).join(' · '),
    desdeActivacion: desde !== lunes,
  };
}

/** Cuántos entrenamientos caen en un periodo. 🚨 **La usa también el bloque de
 *  entrenamientos de la F28**: dos recuentos del mismo «7 días» en la misma
 *  pantalla acabarían diciendo dos números. */
export function entrenamientosEnPeriodo(fitness, { periodo = PERIODO_ACTIVIDAD_POR_DEFECTO, hoy = todayISO() } = {}) {
  const inicio = inicioDePeriodo(periodoDelCatalogo(periodoActividad(periodo).id).dias, hoy);
  return sesionesDeActividad(fitness)
    .filter((s) => conFecha(s) && (!inicio || s.fecha >= inicio) && s.fecha <= hoy);
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · CONSTANCIA Y FRECUENCIA (apartados 8, 9 y 10)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 **UNA FRASE, NO UN PORCENTAJE** (apartado 8: *"«Entrenaste 8 de los
   últimos 14 días.» NO convertirla en «Consistencia 82 %»"*). No hay una
   definición formal de consistencia en JosStyle, así que no se inventa una.

   ⚠️ **Y NO CUENTA DÍAS DE ANTES DE EMPEZAR**: si registró su primer
   entrenamiento hace cinco días, *«2 de los últimos 30 días»* sería verdad y
   engañaría —veinticinco de esos días no tiene ningún registro que pudiera
   tener—. Entonces dice *«2 de los 5 días desde tu primer entrenamiento»*.

   🚨 **LA MEDIA, SOLO CON SEMANAS COMPLETAS** (apartado 9: *"No utilizar semanas
   parciales de forma engañosa"*): de lunes a domingo, **sin la semana en
   curso** y sin semanas enteramente anteriores a su primer entrenamiento. Y
   solo con **dos o más** (*"solo cuando exista suficiente historial"*): con una
   sola, la «media» sería el número de esa semana con otro nombre. */

export const SEMANAS_MINIMAS_MEDIA = 2;

export function constancia(porFecha, { inicio, hoy, primera, periodoNombre }) {
  if (!primera) return null;
  const recortado = !inicio || primera > inicio;
  const desde = recortado ? primera : inicio;
  const total = diasIncluidos(desde, hoy);
  if (!total) return null;
  let activos = 0;
  for (const f of porFecha.keys()) if (f >= desde && f <= hoy) activos += 1;
  let frase;
  if (recortado) {
    frase = total === 1
      ? 'Hoy es tu primer entrenamiento registrado.'
      : `Entrenaste ${activos} de los ${total} días desde tu primer entrenamiento.`;
  } else if (total > 31) {
    /* «40 de los últimos 91 días» es exacto y no se lee: el periodo se llama
       «3 meses», y así se dice. */
    frase = `Entrenaste ${activos} ${activos === 1 ? 'día' : 'días'} en los últimos ${periodoNombre}.`;
  } else {
    frase = `Entrenaste ${activos} de los últimos ${total} días.`;
  }
  return { activos, total, desde, recortado, frase };
}

export function mediaSemanal(sesiones, { inicio, hoy, primera }) {
  if (!primera) return { media: null, semanas: 0, motivo: 'Todavía no hay entrenamientos.' };
  const lunesActual = lunesDe(hoy);
  const primerLunes = lunesDe(primera);
  /* La primera semana que cuenta: la del primer entrenamiento, o la primera
     que empieza dentro del periodo. */
  let desde = primerLunes;
  if (inicio) {
    const lunesInicio = lunesDe(inicio);
    const completa = lunesInicio === inicio ? inicio : addDays(lunesInicio, 7);
    if (completa > desde) desde = completa;
  }
  const semanas = [];
  for (let l = desde; l < lunesActual; l = addDays(l, 7)) semanas.push(l);
  if (semanas.length < SEMANAS_MINIMAS_MEDIA) {
    return {
      media: null,
      semanas: semanas.length,
      motivo: `La media semanal aparece con ${SEMANAS_MINIMAS_MEDIA} semanas completas en el periodo.`,
    };
  }
  const hasta = addDays(lunesActual, -1);
  const n = sesiones.filter((s) => conFecha(s) && s.fecha >= desde && s.fecha <= hasta).length;
  const media = Math.round((n / semanas.length) * 10) / 10;
  return {
    media,
    semanas: semanas.length,
    entrenamientos: n,
    texto: `Media: ${decimal(media)} entrenamientos/semana`,
    detalle: `En ${semanas.length} semanas completas, sin contar la semana en curso.`,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · LA TARJETA DE UNA SESIÓN (apartados 3, 15, 17 y 25)
   ═══════════════════════════════════════════════════════════════════════════ */

export const RECIENTES_MAX = 4;
export const ESTADO_COMPLETA = 'Completa';
export const ESTADO_PARCIAL = 'Parcial';

/** 🚨 Es la ficha del historial (F10), no una segunda: el nombre es **el que
 *  quedó en la sesión** (el snapshot de la F7), así que un plan borrado o
 *  cambiado no le quita nombre (apartados 25 y 26). */
export function tarjetaDeSesion(sesion, { fitness = {}, planes = CATALOGO_PLANES, hoy = todayISO() } = {}) {
  const f = fichaDeHistorial(sesion, { fitness, propios: lista(fitness.ejercicios), planes, hoy });
  if (!f) return null;
  return {
    id: f.id,
    nombre: texto(f.nombre) || 'Entrenamiento',
    fecha: f.fecha,
    etiquetaFecha: f.etiquetaFecha,
    /* 🔓 FIT F32 — la hora a la que empezó (la de la ficha del historial): con
       dos sesiones el mismo día es lo que las distingue (su apartado 21). */
    hora: f.hora || '',
    /* ⚠️ Sin duración fiable, vacío: la F31 arregló que dijera «menos de 1 min»
       de una sesión sin marcas (apartado 39). */
    duracion: f.duracion,
    parcial: f.parcial,
    /* Apartado 15 — un indicador discreto, y la completa también dice lo que es. */
    estado: f.parcial ? ESTADO_PARCIAL : ESTADO_COMPLETA,
    etiqueta: [f.etiquetaFecha, texto(f.nombre) || 'Entrenamiento', f.duracion, f.parcial ? 'parcial' : ''].filter(Boolean).join(', '),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · LA FUNCIÓN CENTRAL (apartados 19 y 20)
   ═══════════════════════════════════════════════════════════════════════════ */

export const SIN_ENTRENAMIENTOS = 'Sin entrenamientos todavía';

/** Los seis campos que pide el apartado 19, con el nombre que tienen aquí.
 *  🚨 *"Solo devolver campos que puedan calcularse realmente"*: el que no se
 *  puede, **no está** en el objeto — ni `null`, ni cero. */
export const CAMPOS_APARTADO_19 = [
  { pide: 'lastWorkout', es: 'ultimoEntrenamiento' },
  { pide: 'workoutsInPeriod', es: 'entrenamientosEnPeriodo' },
  { pide: 'activeDays', es: 'diasActivos' },
  { pide: 'averagePerWeek', es: 'mediaSemanal' },
  { pide: 'plannedSessions', es: 'sesionesPlanificadas' },
  { pide: 'completedPlannedSessions', es: 'sesionesPlanificadasHechas' },
];

/**
 * `getTrainingActivitySummary(period)` (apartado 20). Recibe el periodo y,
 * opcionalmente, el catálogo de planes, y **devuelve datos derivados**: ningún
 * componente cuenta nada.
 */
export function resumenDeActividad(fitness, {
  periodo = PERIODO_ACTIVIDAD_POR_DEFECTO, hoy = todayISO(), planes = CATALOGO_PLANES,
  recientes = RECIENTES_MAX,
} = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const todas = sesionesDeActividad(f);
  const fechadas = todas.filter(conFecha);
  const porFecha = porDia(fechadas);
  const ordenadas = sinDuplicadosPorId(historialPorReciente(f));
  const p = periodoActividad(periodo);
  const inicio = inicioDePeriodo(periodoDelCatalogo(p.id).dias, hoy);
  const primera = fechadas.reduce((m, s) => (!m || s.fecha < m ? s.fecha : m), null);
  const contexto = contextoDelPlan(f, planes);
  const fechas = contextoDeFechas(f, planes, hoy);

  /* Apartado 6 — la semana que contiene hoy, de lunes a domingo. */
  const lunes = lunesDe(hoy);
  const dias = DIAS_SEMANA.map((_, i) => {
    const fecha = addDays(lunes, i);
    return diaDeActividad(fecha, { sesionesDelDia: porFecha.get(fecha) || [], hoy, contextoPlan: fechas });
  });
  const enSemana = (desde, hasta) => fechadas.filter((s) => s.fecha >= desde && s.fecha <= hasta).length;
  const estaSemana = enSemana(lunes, hoy);
  const semanaPasada = enSemana(addDays(lunes, -7), addDays(lunes, -1));

  const ultima = ordenadas[0] ? tarjetaDeSesion(ordenadas[0], { fitness: f, planes, hoy }) : null;
  const enPeriodo = entrenamientosEnPeriodo(f, { periodo: p.id, hoy });
  const diasActivos = new Set(enPeriodo.map((s) => s.fecha)).size;
  const cons = constancia(porFecha, { inicio, hoy, primera, periodoNombre: p.nombre });
  const media = mediaSemanal(fechadas, { inicio, hoy, primera });
  const plan = adherenciaDelPlan(contexto, { lunes, hoy, porFecha });

  const campos = {};
  if (ultima) campos.ultimoEntrenamiento = ultima;
  if (todas.length) {
    campos.entrenamientosEnPeriodo = enPeriodo.length;
    campos.diasActivos = diasActivos;
  }
  if (media.media !== null) campos.mediaSemanal = media.media;
  if (plan) {
    campos.sesionesPlanificadas = plan.planificadas;
    campos.sesionesPlanificadasHechas = plan.hechasDelPlan;
  }

  return {
    hay: todas.length > 0,
    vacio: SIN_ENTRENAMIENTOS,
    total: todas.length,
    totalTexto: todas.length ? contadorTexto(todas.length) : '',
    /* Apartado 24 — lo que no puede ir a ningún día se dice, no se esconde. */
    sinFecha: todas.length - fechadas.length,
    avisoSinFecha: todas.length - fechadas.length > 0
      ? `${todas.length - fechadas.length === 1 ? 'Un entrenamiento no tiene fecha y no aparece' : `${todas.length - fechadas.length} entrenamientos no tienen fecha y no aparecen`} en el calendario.`
      : '',
    ultimo: ultima,
    semana: {
      desde: lunes,
      hasta: addDays(lunes, 6),
      entrenamientos: estaSemana,
      /* Apartado 10 — *"3 entrenamientos · semana en curso"*: la semana de hoy
         nunca ha terminado, así que se dice siempre. */
      texto: `${estaSemana ? contadorTexto(estaSemana) : 'Ninguno todavía'} · semana en curso`,
      enCurso: true,
      dias,
      anterior: { entrenamientos: semanaPasada, texto: `La semana pasada: ${contadorTexto(semanaPasada)}` },
    },
    periodo: {
      id: p.id,
      nombre: p.nombre,
      desde: inicio,
      hasta: hoy,
      entrenamientos: enPeriodo.length,
      diasActivos,
      texto: todas.length ? `${contadorTexto(enPeriodo.length)} · ${p.id === 'todo' ? 'desde el principio' : `últimos ${p.nombre}`}` : '',
    },
    constancia: cons,
    frecuencia: media.media !== null ? media : null,
    frecuenciaMotivo: media.media === null ? media.motivo : '',
    plan,
    recientes: ordenadas.slice(0, recientes).map((s) => tarjetaDeSesion(s, { fitness: f, planes, hoy })).filter(Boolean),
    hayMasRecientes: ordenadas.length > recientes,
    campos,
  };
}

/** El nombre que pide el apartado 20, para quien lo busque así. */
export const getTrainingActivitySummary = resumenDeActividad;

/* ═══════════════════════════════════════════════════════════════════════════
   9 · LA VISTA MENSUAL (apartado 7)
   ═══════════════════════════════════════════════════════════════════════════
   *"Opcionalmente… Los días con entrenamiento pueden tener una marca discreta.
   No utilizar colores agresivos."* Una marca, ni un número ni un color por
   intensidad: un «mapa de calor» sería otra forma de puntuar. */

export function mesDeActividad(fitness, { mes = null, hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const clave = /^\d{4}-\d{2}$/.test(texto(mes)) ? texto(mes) : hoy.slice(0, 7);
  const [anio, m] = clave.split('-').map(Number);
  const porFecha = porDia(sesionesDeActividad(f).filter(conFecha));
  const fechas = contextoDeFechas(f, planes, hoy);
  const celdas = celdasMes(anio, m - 1).map((c) => (c
    ? diaDeActividad(c.fecha, { sesionesDelDia: porFecha.get(c.fecha) || [], hoy, contextoPlan: fechas })
    : null));
  const entrenados = celdas.filter((c) => c && c.estado === 'entrenado').length;
  const anterior = m === 1 ? `${anio - 1}-12` : `${anio}-${String(m - 1).padStart(2, '0')}`;
  const siguiente = m === 12 ? `${anio + 1}-01` : `${anio}-${String(m + 1).padStart(2, '0')}`;
  return {
    mes: clave,
    titulo: `${MESES[m - 1].charAt(0).toUpperCase()}${MESES[m - 1].slice(1)} ${anio}`,
    celdas,
    diasConEntrenamiento: entrenados,
    texto: `${entrenados} ${entrenados === 1 ? 'día' : 'días'} con entrenamiento`,
    anterior,
    siguiente,
    /* No se navega hacia meses que todavía no han empezado: estarían vacíos
       por definición. */
    haySiguiente: siguiente <= hoy.slice(0, 7),
  };
}

/** Las sesiones de un día, para cuando hay más de una (apartado 30). */
export function sesionesDelDiaDeActividad(fitness, fecha, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  return sinDuplicadosPorId(historialPorReciente(f))
    .filter((s) => s.fecha === fecha)
    .map((s) => tarjetaDeSesion(s, { fitness: f, planes, hoy }))
    .filter(Boolean);
}

/* ═══════════════════════════════════════════════════════════════════════════
   10 · LO QUE NO SE CONSTRUYE, Y LO QUE SE DECIDIÓ
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT31 = [
  { que: 'Una puntuación o un porcentaje de consistencia', porque: 'Apartados 8 y 40: no hay una definición formal, así que se dice con una frase.' },
  { que: 'Una racha de entrenamiento propia', porque: 'Apartado 16. La lleva el motor de rachas (`rachas.js`, tipo `training`) y escribe solo `rachasServicio.js`; esta librería ni lo importa.' },
  { que: 'Predicciones, IA, recomendaciones, penalizaciones, XP, recompensas o clasificaciones', porque: 'Apartado 40, literal.' },
  { que: 'Un porcentaje de cumplimiento del plan', porque: 'Apartado 14: «4 entrenamientos», no «133 %». Los dos números se dicen por separado.' },
  { que: 'Colores por intensidad en el calendario', porque: 'Apartados 7 y 27: una marca discreta; un mapa de calor sería otra forma de puntuar.' },
  { que: 'Eventos de actividad guardados', porque: 'Apartados 18 y 34: todo sale del historial, así que toda sesión de la actividad está en el Historial y no hay nada que sincronizar.' },
];

export const DECISIONES_FIT31 = [
  { que: 'El día de una sesión es el día local en que empezó', porque: 'Apartados 21 y 39. Es `sesion.fecha`, lo que ya usan el historial, Tu Plan y la progresión: con otra regla, el mismo entrenamiento saldría en dos días distintos.' },
  { que: 'Los campos del apartado 2 son los que ya existían', porque: '`startTime` es `iniciadaEn`, `endTime` `terminadaEn`, `status` `estado`, `source` `origen`, `environment` `entorno`, `dayId` `diaDePlan` y `completedAt` `guardadaEn` (F7, F8 y F10). El apartado dice «y cualquier campo existente equivalente».' },
  { que: '«Realizadas» cuenta todos sus entrenamientos de la semana', porque: 'Apartados 12 y 14: una sesión el martes en vez del lunes, o una rutina que no es del plan, es un entrenamiento de verdad.' },
  { que: 'Sin frecuencia definida, el bloque del plan no existe', porque: 'Apartado 13. Una plantilla suya activada como plan no anuncia cuántos días (F6).' },
  { que: 'La constancia no cuenta días anteriores a su primer entrenamiento', porque: 'Apartado 9, aplicado también a la frase: sería verdad y engañaría.' },
  { que: 'La media semanal solo con semanas completas, y al menos dos', porque: 'Apartado 9: «solo cuando exista suficiente historial» y «no utilizar semanas parciales de forma engañosa».' },
  { que: 'El periodo del resumen es el de Progreso', porque: 'Apartado 5. En Resumen ya hay un selector de periodo (F28) con los mismos cuatro; un segundo selector en la misma pantalla diría dos cosas a la vez.' },
  { que: 'La semana, el último entrenamiento y el plan no cambian con el periodo', porque: '«Esta semana» es esta semana mire el periodo que mire, igual que la última foto de la F28.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   11 · LA AUDITORÍA (apartado 41)
   ═══════════════════════════════════════════════════════════════════════════ */

/** ⚠️ El tercer argumento es para poder ponerla ROJA (EH F42): una auditoría
 *  que calcula su propia entrada no puede fallar nunca. */
export function auditarActividad(fitness, opciones = {}, resumen = null) {
  const r = resumen || resumenDeActividad(fitness, opciones);
  const delHistorial = sesionesDelHistorial(fitness);
  const ids = new Set(delHistorial.map((s) => s.id));
  const vistas = [
    ...(r.ultimo ? [r.ultimo.id] : []),
    ...r.recientes.map((x) => x.id),
    ...r.semana.dias.flatMap((d) => d.sesiones.map((s) => s.id)),
  ];
  const masReciente = delHistorial.filter(conFecha).reduce((m, s) => (!m || s.fecha > m ? s.fecha : m), null);
  /* 🔓 FIT F32 — un día sin sesión en el plan puede venir del activo o de uno
     anterior; lo que no puede es salir sin ningún plan del que venir. */
  const ctx = contextoDeFechas(fitness || {}, opciones.planes || CATALOGO_PLANES, opciones.hoy || todayISO());
  const sinPlan = !ctx.plan && !ctx.anteriores.length;
  const casillas = [
    { id: 'cuando', texto: 'Cuándo entrenó: la última es la más reciente', ok: !masReciente || (!!r.ultimo && r.ultimo.fecha === masReciente) },
    { id: 'cuanto', texto: 'Cuánto: una sesión, una vez', ok: r.total === ids.size },
    { id: 'distribucion', texto: 'Cómo se distribuye: siete días, de lunes a domingo', ok: r.semana.dias.length === 7 && r.semana.dias[0].dia === 1 },
    { id: 'historial', texto: 'Toda sesión de la actividad está en el Historial', ok: vistas.every((id) => ids.has(id)) },
    { id: 'sin_puntuacion', texto: 'Ni un porcentaje ni una puntuación', ok: !/%/.test(JSON.stringify(
      [r.semana.texto, r.periodo.texto, r.constancia?.frase, r.frecuencia?.texto, r.plan?.texto],
    )) },
    { id: 'sin_descanso_inventado', texto: 'Sin ningún plan, ningún día dice «sin entrenamiento planificado»', ok: !sinPlan || r.semana.dias.every((d) => d.estado !== 'descanso') },
  ];
  return { casillas, ok: casillas.every((c) => c.ok) };
}

export default resumenDeActividad;
