// Fase 2 del Calendario Universal — "todo elemento relevante de la aplicación que tenga una
// dimensión temporal puede aparecer en el calendario, sin duplicar el dato" (spec del prompt del
// Calendario). Este archivo NO guarda nada nuevo en Supabase: calcula, en cada render, eventos de
// SOLO LECTURA a partir de datos que ya viven en otros módulos — mismo espíritu que
// resumenesHub.js/predicciones.js/correlaciones.js. Al recalcularse siempre desde el estado real
// (nunca copiarse a `calendario.eventos`), quedan resueltos gratis dos requisitos del prompt:
// "evitar duplicados" (no hay una segunda copia que pueda desincronizarse) y "si modificas algo
// desde su módulo, se actualiza el calendario" (se recalcula en el siguiente render, sin código
// de sincronización explícito).
//
// Cada evento derivado comparte la misma forma que un evento real de `calendario.eventos` (mismos
// campos que consumen `eventosDelDia`/`tiposDelDia`/`resumenDelDia`/`eventosFuturos` de
// calendario.js, así que no hace falta tocar ese motor) más `soloLectura: true` y `origen`/
// `origenId` apuntando al dato real — `origen` coincide a propósito con el id de pestaña real de
// App.jsx (`objetivos`/`estudios`/`entreno`/`productividad`), así CalendarView puede abrir el
// módulo de origen con el mismo `setTab` que ya usa el resto de la navegación, sin una tabla de
// traducción aparte.
import { prediccionObjetivo } from './predicciones';

// Objetivos con plazo estimable (prediccionObjetivo, Fase 17) y todavía no cumplidos — un
// objetivo ya marcado como cumplido no aporta nada al calendario, solo ruido. El plazo es una
// ESTIMACIÓN calculada (fechaCreacion + duración del plazo elegido), nunca una fecha que Josué
// haya introducido a mano — se deja explícito en las notas del propio evento para no dar una
// falsa sensación de precisión.
function eventosDeObjetivos(objetivos) {
  if (!objetivos) return [];
  return objetivos.lista
    .filter((o) => !o.cumplido)
    .map((o) => {
      const p = prediccionObjetivo(o);
      if (!p.suficientesDatos) return null;
      return {
        id: `objetivos:${o.id}`,
        titulo: o.texto,
        fecha: p.fechaLimiteISO,
        todoElDia: true,
        horaInicio: null,
        horaFin: null,
        tipo: 'objetivo',
        notas: `Plazo estimado (${o.plazo} desde que se creó)${p.superado ? ' — ya superado' : ''}`,
        ubicacion: '',
        origen: 'objetivos',
        origenId: o.id,
        soloLectura: true,
      };
    })
    .filter(Boolean);
}

// Exámenes de Estudios — la única fecha realmente puntual y fiable de ese módulo (las horas
// estudiadas son un registro diario acumulado, no un "evento" del día; incluirlas saturaría el
// calendario sin aportar nada que el propio módulo de Estudios no muestre ya mejor).
function eventosDeEstudios(estudios) {
  if (!estudios) return [];
  const nombreAsignatura = (id) => estudios.asignaturas.find((a) => a.id === id)?.nombre || '';
  return estudios.examenes.map((ex) => ({
    id: `estudios:${ex.id}`,
    titulo: `Examen — ${nombreAsignatura(ex.asignaturaId)}${ex.tema ? `: ${ex.tema}` : ''}`,
    fecha: ex.fecha,
    todoElDia: true,
    horaInicio: null,
    horaFin: null,
    tipo: 'estudio',
    notas: ex.notaObjetivo ? `Objetivo: ${ex.notaObjetivo}` : '',
    ubicacion: '',
    origen: 'estudios',
    origenId: ex.id,
    soloLectura: true,
  }));
}

// Sesiones de calistenia (una por habilidad y fecha) y partidos de fútbol — ambos ya registrados
// con fecha real en Entrenamiento. Son registros de algo que YA ocurrió, no una convocatoria
// futura — igual de legítimo como dato temporal (spec: "si algo ocurre en una fecha determinada,
// puede aparecer en el calendario"), útil sobre todo para ver de un vistazo cuántos días se ha
// entrenado en un mes concreto.
function eventosDeEntrenamiento(calistenia, futbol) {
  const eventos = [];
  if (calistenia) {
    Object.entries(calistenia).forEach(([skill, data]) => {
      (data.sesiones || []).forEach((s) => {
        eventos.push({
          id: `entreno:calistenia:${skill}:${s.id}`,
          titulo: `Calistenia — ${skill}`,
          fecha: s.fecha,
          todoElDia: true,
          horaInicio: null,
          horaFin: null,
          tipo: 'entrenamiento',
          notas: '',
          ubicacion: '',
          origen: 'entreno',
          origenId: s.id,
          soloLectura: true,
        });
      });
    });
  }
  (futbol || []).forEach((p) => {
    eventos.push({
      id: `entreno:futbol:${p.id}`,
      titulo: 'Partido de fútbol',
      fecha: p.fecha,
      todoElDia: true,
      horaInicio: null,
      horaFin: null,
      tipo: 'entrenamiento',
      notas: p.nota || '',
      ubicacion: '',
      origen: 'entreno',
      origenId: p.id,
      soloLectura: true,
    });
  });
  return eventos;
}

// Tareas de Productividad con fecha límite — la pieza de ese módulo con fecha propia y sentido
// real de "evento puntual" (a diferencia de Hábitos/Rutinas/Metas, ver nota más abajo). Solo las
// pendientes: una tarea ya hecha no necesita seguir ocupando un día en el calendario.
function eventosDeTareas(productividad) {
  if (!productividad) return [];
  return productividad.tareas
    .filter((t) => t.fechaLimite && !t.hecha)
    .map((t) => ({
      id: `productividad:${t.id}`,
      titulo: t.texto,
      fecha: t.fechaLimite,
      todoElDia: true,
      horaInicio: null,
      horaFin: null,
      tipo: 'recordatorio',
      notas: '',
      ubicacion: '',
      origen: 'productividad',
      origenId: t.id,
      soloLectura: true,
    }));
}

// Fuentes deliberadamente NO integradas en esta fase, documentado con la misma honestidad que el
// resto del proyecto (nunca simular algo que el modelo de datos actual no sostiene de verdad):
//
// - Hábitos y Rutinas (Productividad): el prompt del Calendario los pide explícitamente, pero
//   ninguno de los dos tiene una fecha ni una periodicidad propia en el modelo de datos real —
//   un hábito es "historial: {fecha: true}" (marcas de cuándo SE HIZO, no de cuándo TOCA) y una
//   rutina no tiene fecha en absoluto. Mapearlos exigiría o bien inventar una fecha (falso: se
//   verían "programados" un día que nadie eligió) o construir un motor de recurrencia real
//   (repetir cada día/semana/mes) — eso es explícitamente trabajo de Fase 3 ("eventos recurrentes
//   avanzados"), no de esta fase. En su lugar se han incluido las Tareas de Productividad
//   (`eventosDeTareas`), que sí tienen una fecha límite real y son el dato de ese módulo más
//   cercano en espíritu a "algo con fecha propia que quieres ver en el calendario".
// - Metas de Productividad (distintas de Objetivos): tampoco tienen fecha, solo un periodo
//   (Diaria/Semanal/Mensual/Anual) y un progreso — mismo motivo que Hábitos/Rutinas.
// - Recordatorios: no existen como módulo propio en la app — ya están cubiertos desde la Fase 1,
//   Josué los crea directamente en el calendario (tipo "Recordatorio").
// - Fechas importantes de Relación: **excluidas a propósito por privacidad**, no por limitación
//   técnica. Relación es el único módulo protegido por PIN de principio a fin en toda la app (ver
//   HANDOFF.md, currentState/exportData en App.jsx) — el Calendario, tal y como está construido,
//   no pide PIN para abrirse. Traer esas fechas aquí sin PIN sería una regresión de privacidad
//   real (cualquiera que abra el calendario vería el nombre de la pareja y sus fechas), así que
//   se ha dejado fuera aunque el prompt del Calendario lo pida explícitamente. Si Josué quiere
//   verlo igualmente, la vía honesta es una fase futura que proteja específicamente esas entradas
//   con el mismo PinGate, no mezclarlas sin más con el resto de eventos.
export function eventosDerivados({ objetivos, estudios, calistenia, futbol, productividad }) {
  return [
    ...eventosDeObjetivos(objetivos),
    ...eventosDeEstudios(estudios),
    ...eventosDeEntrenamiento(calistenia, futbol),
    ...eventosDeTareas(productividad),
  ];
}

// Nombre legible del módulo de origen — solo para el botón "Abrir en..." del detalle de un
// evento de solo lectura en CalendarView.jsx.
export const NOMBRES_ORIGEN = {
  objetivos: 'Objetivos',
  estudios: 'Estudios',
  entreno: 'Entrenamiento',
  productividad: 'Productividad',
};
