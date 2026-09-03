// Fase 1 del Calendario Universal — motor puro (sin UI, sin estado propio), mismo espíritu que
// colorEngine.js/predicciones.js/correlaciones.js: funciones deterministas sobre datos que ya
// existen. Se separan de CalendarView.jsx a propósito para que una futura Fase 2 (integración con
// otros módulos, "Próximamente") pueda reutilizar este mismo motor sin reescribir la lógica de
// fechas — ver `eventosFuturos`, que no se usa todavía en ninguna vista de esta fase.
import { TIPOS_EVENTO_CALENDARIO } from '../tokens';
/* 🐛 Para pasar un Date a fecha ISO **local**. Ver el comentario de
   `siguienteOcurrencia`: usar `toISOString` aquí rompía las tres recurrencias. */
import { fechaLocalISO } from './helpers';

// mes: 0-11 (convención de Date de JS). Día 0 del mes siguiente = último día del mes actual —
// así se resuelve solo, sin tablas fijas de 28/30/31 ni casos especiales para años bisiestos
// (new Date gestiona el 29 de febrero por su cuenta).
export function diasDelMes(anio, mes) {
  return new Date(anio, mes + 1, 0).getDate();
}

// Índice de 0 (lunes) a 6 (domingo) del día 1 del mes. getDay() de JS devuelve 0 para domingo,
// así que se rota para que la semana visual empiece en lunes (convención española/europea).
export function primerDiaSemanaMes(anio, mes) {
  const diaJs = new Date(anio, mes, 1).getDay(); // 0 domingo .. 6 sábado
  return (diaJs + 6) % 7; // 0 lunes .. 6 domingo
}

export function isoDeFecha(anio, mes, dia) {
  const mm = String(mes + 1).padStart(2, '0');
  const dd = String(dia).padStart(2, '0');
  return `${anio}-${mm}-${dd}`;
}

// Celdas de la cuadrícula mensual: `null` para el hueco antes del día 1 (sin número, no
// interactivo — más simple y sin ambigüedad que mostrar de forma no navegable días de otro mes),
// luego un objeto `{ dia, fecha }` por cada día real del mes. El número de filas resultante varía
// solo (4-6) según cuántos huecos haga falta — no se asume que todos los meses miden igual.
export function celdasMes(anio, mes) {
  const total = diasDelMes(anio, mes);
  const offset = primerDiaSemanaMes(anio, mes);
  const celdas = Array(offset).fill(null);
  for (let dia = 1; dia <= total; dia++) celdas.push({ dia, fecha: isoDeFecha(anio, mes, dia) });
  return celdas;
}

// Eventos de un día concreto, ordenados: primero los de día completo, luego el resto por hora de
// inicio ascendente (los que no tienen hora — no debería pasar salvo dato antiguo/incompleto —
// se quedan al principio de su grupo).
export function eventosDelDia(eventos, fechaISO) {
  return eventos
    .filter((e) => e.fecha === fechaISO)
    .sort((a, b) => {
      if (a.todoElDia && !b.todoElDia) return -1;
      if (!a.todoElDia && b.todoElDia) return 1;
      return (a.horaInicio || '').localeCompare(b.horaInicio || '');
    });
}

// Para los indicadores compactos de la cuadrícula mensual (spec apartado 4: "no llenar las
// celdas con textos largos, usar indicadores compactos, ej. ● ● ●"): tipos de evento distintos
// presentes ese día, como máximo 3 — nunca la cuenta exacta de eventos, que podría saturar la celda.
export function tiposDelDia(eventos, fechaISO) {
  const tipos = [...new Set(eventos.filter((e) => e.fecha === fechaISO).map((e) => e.tipo))];
  return tipos.slice(0, 3);
}

// Resumen contextual al seleccionar un día (spec apartado 5/6, ej. "3 eventos · 2 hábitos · 1
// objetivo"): total primero, luego el desglose por tipo presente ese día — siempre en el orden
// fijo de TIPOS_EVENTO_CALENDARIO, para que el orden del resumen no "salte" según qué se creó
// primero. `null` si el día no tiene nada, para que la vista decida cómo mostrarlo vacío.
export function resumenDelDia(eventos, fechaISO) {
  const delDia = eventosDelDia(eventos, fechaISO);
  if (delDia.length === 0) return null;
  const partes = [`${delDia.length} ${delDia.length === 1 ? 'evento' : 'eventos'}`];
  TIPOS_EVENTO_CALENDARIO.forEach((t) => {
    const n = delDia.filter((e) => e.tipo === t.id).length;
    if (n > 0) partes.push(`${n} ${n === 1 ? t.label.toLowerCase() : t.labelPlural}`);
  });
  return partes.join(' · ');
}

// Fase 2 — usado por el panel "Próximamente" de CalendarView.jsx y por la tarjeta del hub "Vida"
// (resumenesHub.js): eventos desde una fecha, dentro de una ventana de días, ordenados
// cronológicamente.
export function eventosFuturos(eventos, desdeISO, dias) {
  const desde = new Date(`${desdeISO}T00:00:00`);
  const hasta = new Date(desde);
  hasta.setDate(hasta.getDate() + dias);
  return eventos
    .filter((e) => {
      const f = new Date(`${e.fecha}T00:00:00`);
      return f >= desde && f <= hasta;
    })
    .sort((a, b) => (a.fecha === b.fecha ? (a.horaInicio || '').localeCompare(b.horaInicio || '') : a.fecha.localeCompare(b.fecha)));
}

/* 🚨 🐛 **El fallo más caro del calendario, y llevaba aquí desde la Fase 3.**
 *
 * Esto devolvía `d.toISOString().slice(0, 10)`. `new Date('2026-06-01T00:00:00')`
 * es **medianoche LOCAL**, y `toISOString()` la pasa a UTC restando el huso: en
 * España (UTC+1/+2) el resultado **retrocede un día**. Las tres consecuencias,
 * comprobadas ejecutándolo antes de tocar nada:
 *
 *   · 🚨 **Un evento DIARIO no avanzaba nunca**: devolvía la misma fecha, la serie
 *     generaba **500 copias del mismo día** hasta agotar el tope de seguridad, y
 *     no aparecía en ningún otro día del mes.
 *   · 🚨 **Uno SEMANAL avanzaba 6 días, no 7** — 1, 7, 13, 19, 25…: un "todos los
 *     lunes" se iba caminando hacia atrás por la semana.
 *   · 🚨 **Y uno MENSUAL del día 31** saltaba de enero **al 2 de marzo**.
 *
 * Quinta vez que este proyecto pisa la misma trampa (motorRutinas,
 * calendarioIntegracion, avisosEstilo y las pruebas de Estilo de hombre). La
 * regla, otra vez: **una fecha local se saca con `fechaLocalISO`, nunca con
 * `toISOString`.**
 */
function siguienteOcurrencia(fechaISO, frecuencia) {
  const d = new Date(`${fechaISO}T00:00:00`);
  if (frecuencia === 'diaria') d.setDate(d.getDate() + 1);
  else if (frecuencia === 'semanal') d.setDate(d.getDate() + 7);
  else if (frecuencia === 'mensual') d.setMonth(d.getMonth() + 1);
  else if (frecuencia === 'anual') d.setFullYear(d.getFullYear() + 1);
  else return null; // frecuencia desconocida — no debería pasar, corta la serie por seguridad
  return fechaLocalISO(d);
}

/**
 * 🐛 La ocurrencia **número `n` contada desde el ancla**, para mensual y anual.
 *
 * Se recorta al último día del mes cuando el mes de destino es más corto —el 31
 * de enero cae el 28 de febrero— pero **la siguiente vuelve a querer ser 31**,
 * porque siempre se cuenta desde el original. Encadenar `setMonth(+1)` hacía lo
 * contrario: el recorte se quedaba pegado y la serie entera se torcía.
 */
function ocurrenciaDesdeAncla(anclaISO, frecuencia, n) {
  const [anio, mes, dia] = anclaISO.split('-').map(Number);
  if (frecuencia === 'mensual') {
    const total = (mes - 1) + n;
    const a = anio + Math.floor(total / 12);
    const m = ((total % 12) + 12) % 12;              // 0-11
    const ultimo = new Date(a, m + 1, 0).getDate();  // día 0 del mes siguiente
    return isoDeFecha(a, m, Math.min(dia, ultimo));
  }
  if (frecuencia === 'anual') {
    const a = anio + n;
    const ultimo = new Date(a, mes, 0).getDate();    // último día de ese mismo mes
    return isoDeFecha(a, mes - 1, Math.min(dia, ultimo));
  }
  return null;
}

// Fase 3 (primera pasada) — genera las ocurrencias VIRTUALES de eventos recurrentes dentro de
// [desdeISO, hastaISO], sin guardar ni duplicar nada (mismo espíritu que los eventos derivados de
// calendarioIntegracion.js: se recalcula en cada render, siempre acotado a la ventana visible que
// pide quien llama — mes actual, "Próximamente", una búsqueda...). Un evento sin `recurrencia`
// pasa tal cual (una sola "ocurrencia": él mismo). Cada ocurrencia generada es una copia con
// `fecha` sobrescrita y un id derivado (`${id}:${fecha}`) — nunca el id original repetido, para
// que las claves de React y la detección de "nuevo vs. editar" en CalendarView.jsx no colisionen.
// `eventoOrigenId` apunta siempre al evento real guardado, para poder editar/eliminar la serie
// completa desde cualquier ocurrencia que se toque (no hay edición de una ocurrencia suelta en
// esta primera pasada — editar o eliminar afecta a toda la serie, dicho explícito en el editor).
// Tope de 500 pasos por evento como red de seguridad (nunca un bucle infinito si `hasta` faltara
// o los datos vinieran corruptos) — de sobra para cualquier uso real (500 días diarios ≈ 16 meses,
// 500 semanas ≈ 9 años, 500 meses ≈ 41 años).
export function expandirRecurrentes(eventos, desdeISO, hastaISO) {
  const resultado = [];
  eventos.forEach((ev) => {
    if (!ev.recurrencia || !ev.recurrencia.frecuencia) {
      if (ev.fecha >= desdeISO && ev.fecha <= hastaISO) resultado.push(ev);
      return;
    }
    const { frecuencia } = ev.recurrencia;
    const limite = ev.recurrencia.hasta && ev.recurrencia.hasta < hastaISO ? ev.recurrencia.hasta : hastaISO;
    let fechaActual = ev.fecha;

    // Atajo para diaria/semanal: si el ancla queda muy por detrás de la ventana pedida (ej. un
    // evento diario creado hace meses, visto ahora), salta directo cerca de `desdeISO` con
    // aritmética exacta de días en vez de recorrer un paso a la vez — evita agotar el tope de
    // seguridad de abajo con anclas antiguas y ventanas lejanas. Mensual/anual no necesitan este
    // atajo: el propio tope (500 meses ≈ 41 años, 500 años) ya cubre cualquier caso real.
    if (fechaActual < desdeISO && (frecuencia === 'diaria' || frecuencia === 'semanal')) {
      const pasoDias = frecuencia === 'diaria' ? 1 : 7;
      const diffDias = Math.floor((new Date(`${desdeISO}T00:00:00`) - new Date(`${fechaActual}T00:00:00`)) / 86400000);
      const saltos = Math.max(0, Math.floor(diffDias / pasoDias));
      if (saltos > 0) {
        const d = new Date(`${fechaActual}T00:00:00`);
        d.setDate(d.getDate() + saltos * pasoDias);
        // 🐛 El mismo UTC de arriba: aquí el atajo también aterrizaba un día antes.
        fechaActual = fechaLocalISO(d);
      }
    }

    /* 🐛 ⚠️ **Y mensual/anual se cuentan DESDE EL ANCLA, no paso a paso.**
       Encadenar `setMonth(+1)` arrastra el error: un evento del **31 de enero**
       pasaba a marzo —febrero no tiene 31— y **se quedaba en el día 3 para
       siempre**; uno del **29 de febrero** se iba al 1 de marzo y ya no volvía a
       caer en un 29. Contando desde el ancla, cada ocurrencia sabe qué día
       quería ser y solo se recorta al último día del mes cuando ese mes es más
       corto: 31 ene → 28 feb → **31 mar**, no 3 de marzo. */
    const porAncla = frecuencia === 'mensual' || frecuencia === 'anual';
    let pasos = 0;
    let n = 0;
    while (fechaActual && fechaActual <= limite && pasos < 500) {
      if (fechaActual >= desdeISO) {
        resultado.push({ ...ev, fecha: fechaActual, id: `${ev.id}:${fechaActual}`, eventoOrigenId: ev.id, esOcurrencia: fechaActual !== ev.fecha });
      }
      n += 1;
      fechaActual = porAncla
        ? ocurrenciaDesdeAncla(ev.fecha, frecuencia, n)
        : siguienteOcurrencia(fechaActual, frecuencia);
      pasos++;
    }
  });
  return resultado;
}
