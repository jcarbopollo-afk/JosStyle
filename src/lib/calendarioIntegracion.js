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
// App.jsx (`objetivos`/`estudios`/`entreno`/`productividad`/`relacion`), así CalendarView puede
// abrir el módulo de origen con el mismo `setTab` que ya usa el resto de la navegación, sin una
// tabla de traducción aparte.
import { prediccionObjetivo } from './predicciones';
import { TIPOS_FECHA_RELACION } from '../tokens';
import { eventosDePelo } from './rutinasPelo';
import { eventosDePeluqueria } from './peluqueria';
import { eventosDePiel } from './rutinasPiel';
import { eventosDeBarba } from './rutinasBarba';
import { eventosDeSonrisa } from './sonrisa';

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

// Fechas importantes de Relación (cumpleaños, aniversario...) — a diferencia del resto de fuentes
// de este archivo, cada fecha puede llevar `repetir: true`, así que aquí no se genera un evento
// puntual sino uno con `recurrencia: { frecuencia: 'anual', hasta: null }`: se reutiliza tal cual
// el mismo motor de recurrencia que ya usa el propio Calendario para sus eventos manuales
// (`expandirRecurrentes`, lib/calendario.js) — CalendarView lo llama sobre TODOS los eventos
// (propios + derivados) sin distinguir su origen, así que un derivado con `recurrencia` se expande
// gratis, sin tocar ese motor ni CalendarView.jsx. `origenId` sigue apuntando al `id` real de la
// fecha en `relacion.fechas` (nunca se duplica el dato), y el título ya incluye el nombre de la
// pareja para cumpleaños (spec: "🎂 Cumpleaños de María") sin guardar ese nombre por separado.
//
// **Privacidad**: esta función recibe `relacion` ya decidido por quien la llama (App.jsx) — si
// Relación está protegida por PIN y no se ha desbloqueado en la sesión actual, App.jsx pasa
// `relacion: null` y aquí no se genera ningún evento, ni siquiera el indicador discreto del día.
// Así se respeta exactamente el mismo límite de autorización que ya protege la pestaña Relación,
// en vez de duplicar o reinventar la comprobación aquí.
function eventosDeRelacion(relacion) {
  if (!relacion) return [];
  const nombrePareja = relacion.nombre?.trim();
  return (relacion.fechas || []).map((f) => {
    const tipo = TIPOS_FECHA_RELACION.find((t) => t.id === f.tipo) || TIPOS_FECHA_RELACION[TIPOS_FECHA_RELACION.length - 1];
    const titulo = tipo.id === 'cumpleanos' && nombrePareja
      ? `${tipo.emoji} Cumpleaños de ${nombrePareja}`
      : `${tipo.emoji} ${f.etiqueta}`;
    const evento = {
      id: `relacion:${f.id}`,
      titulo,
      fecha: f.fecha,
      todoElDia: true,
      horaInicio: null,
      horaFin: null,
      tipo: 'fecha_importante',
      notas: '',
      ubicacion: '',
      origen: 'relacion',
      origenId: f.id,
      soloLectura: true,
    };
    if (f.repetir) evento.recurrencia = { frecuencia: 'anual', hasta: null };
    return evento;
  });
}

// AR Fase 3 — el historial de uso del Armario, visto desde el Calendario Universal.
//
// Regla 11 del proyecto: el Calendario NUNCA duplica el dato de otro módulo. Aquí eso se cumple
// literalmente — la única fuente de verdad sigue siendo `armario.usos`, y estos eventos se
// generan al vuelo en cada render, no se guardan en `calendario.eventos` ni se sincronizan.
// Borrar un uso desde el Armario lo hace desaparecer del Calendario en el mismo render, sin
// ningún código de limpieza, porque nunca hubo una segunda copia que limpiar.
//
// El título sale del outfit REFERENCIADO (`u.outfitId`), no de un nombre copiado dentro del uso:
// si Josué renombra "Casual Gris" a "Casual gris claro", el calendario del mes pasado se entera
// solo. Un uso cuyo outfit ya no existe (borrado, aún en la papelera) no genera evento: no se
// inventa un título para algo que no se puede abrir.
function eventosDeArmario(armario) {
  if (!armario) return [];
  const porId = new Map((armario.outfits || []).map((o) => [o.id, o]));
  return (armario.usos || []).reduce((acc, u) => {
    const outfit = porId.get(u.outfitId);
    if (!outfit) return acc;
    acc.push({
      id: `armario:${u.id}`,
      titulo: `👕 ${outfit.nombre}`,
      fecha: u.fecha,
      todoElDia: !u.hora,
      horaInicio: u.hora || null,
      horaFin: null,
      tipo: 'personal',
      notas: u.notas || '',
      ubicacion: u.lugar || '',
      origen: 'armario',
      origenId: u.id,
      soloLectura: true,
    });
    return acc;
  }, []);
}

// Fuentes deliberadamente NO integradas en esta fase, documentado con la misma honestidad que el
// resto del proyecto (nunca simular algo que el modelo de datos actual no sostiene de verdad):
//
// - Hábitos y Rutinas (Productividad): el prompt del Calendario los pide explícitamente, pero
//   ninguno de los dos tiene una fecha ni una periodicidad propia en el modelo de datos real —
//   un hábito es "historial: {fecha: true}" (marcas de cuándo SE HIZO, no de cuándo TOCA) y una
//   rutina no tiene fecha en absoluto. Mapearlos exigiría o bien inventar una fecha (falso: se
//   verían "programados" un día que nadie eligió) o decidir una periodicidad que la rutina no
//   declara hoy. En su lugar se han incluido las Tareas de Productividad (`eventosDeTareas`), que
//   sí tienen una fecha límite real y son el dato de ese módulo más cercano en espíritu a "algo
//   con fecha propia que quieres ver en el calendario".
// - Metas de Productividad (distintas de Objetivos): tampoco tienen fecha, solo un periodo
//   (Diaria/Semanal/Mensual/Anual) y un progreso — mismo motivo que Hábitos/Rutinas.
// - Recordatorios: no existen como módulo propio en la app — ya están cubiertos desde la Fase 1,
//   Josué los crea directamente en el calendario (tipo "Recordatorio").
export function eventosDerivados({ objetivos, estudios, calistenia, futbol, productividad, relacion, armario, estiloHombre, desde, hasta }) {
  return [
    ...eventosDeObjetivos(objetivos),
    ...eventosDeEstudios(estudios),
    ...eventosDeEntrenamiento(calistenia, futbol),
    ...eventosDeTareas(productividad),
    ...eventosDeRelacion(relacion),
    ...eventosDeArmario(armario),
    // EH F8, apartado 17 — *"No crear un segundo calendario. Debe utilizarse el
    // calendario existente."* Las rutinas de pelo entran por aquí como todo lo
    // demás: ⚠️ **derivadas y de solo lectura** (regla 11), calculadas de su
    // regla. Necesitan un rango porque una rutina "cada 3 días" no tiene un
    // número finito de ocurrencias — y no se materializa ninguna.
    ...(estiloHombre && desde && hasta ? eventosDePelo(estiloHombre, { desde, hasta }) : []),
    // EH F11, apartado 6 — *"El evento debe poder aparecer en el calendario
    // global. No crear un segundo calendario."* ⚠️ **Una cita, no una serie**:
    // el próximo corte es un plan concreto, así que no necesita rango — a
    // diferencia de las rutinas, que son una regla sin fin.
    ...(estiloHombre ? eventosDePeluqueria(estiloHombre) : []),
    // EH F14, apartado 17 — *"no crear un calendario de skincare
    // independiente"*. Las rutinas de piel entran por la misma puerta que las
    // de pelo, con la misma forma y el mismo motor.
    ...(estiloHombre && desde && hasta ? eventosDePiel(estiloHombre, { desde, hasta }) : []),
    /* EH F21, apartado 14 — *"debe aparecer en el calendario general. **No crear
       un calendario de barba**"*. Tercer módulo de Estilo de Hombre que entra
       por esta misma puerta, con la misma forma y el mismo motor. */
    ...(estiloHombre && desde && hasta ? eventosDeBarba(estiloHombre, desde, hasta) : []),
    /* EH F23, apartado 15 — *"nunca crear un calendario dental independiente"*.
       Cuarto módulo de Estilo de Hombre por esta misma puerta. */
    ...(estiloHombre && desde && hasta ? eventosDeSonrisa(estiloHombre, desde, hasta) : []),
  ];
}

// Nombre legible del módulo de origen — solo para el botón "Abrir en..." del detalle de un
// evento de solo lectura en CalendarView.jsx.
export const NOMBRES_ORIGEN = {
  pelo: 'Pelo',
  piel: 'Skincare',
  barba: 'Barba y afeitado',
  sonrisa: 'Sonrisa',
  objetivos: 'Objetivos',
  estudios: 'Estudios',
  entreno: 'Entrenamiento',
  productividad: 'Productividad',
  relacion: 'Relación',
  armario: 'Armario',
};
