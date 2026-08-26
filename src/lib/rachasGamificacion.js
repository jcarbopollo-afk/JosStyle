// ============================================================================
// RA · Fase 3/4 — GAMIFICACIÓN, HITOS, LOGROS Y PROGRESIÓN
//
// *"NO modifiques innecesariamente el motor de rachas de las fases anteriores.
// La gamificación debe consumir los datos existentes."* (apartado 1)
//
// Así que esto es una capa ENCIMA. No calcula ni una racha: se las pide al motor
// de RA F1 a través del servicio de RA F2. Si se borrara este archivo entero,
// las rachas seguirían funcionando exactamente igual.
//
//     Actividad → Racha → Progreso → Hito → Logro → Feedback visual
//                 ─────────────────   ────────────   ─────────────
//                   RA F1 y F2          esto          RA F4
//
// ── LA FRASE QUE MARCA EL TONO (apartado 23) ───────────────────────────────
//
// *"No quiero que el usuario sienta «tengo que usar la app para ganar puntos».
// Quiero que sienta «estoy progresando en mi vida y la app me ayuda a verlo»."*
//
// De ahí salen tres decisiones que se notan en el código:
//
//   1. **No hay XP ni niveles.** Los apartados 14 y 15 los dejan en condicional
//      (*"no conviertas automáticamente las rachas en niveles si no es
//      necesario"*, *"si decides preparar XP"*), y no es necesario: no hay nada
//      que gastar ni con qué compararse. Un contador de XP sin uso sería un
//      control decorativo, que es lo que prohíbe la regla 8. Lo que sí queda es
//      el punto de enganche: los eventos llevan los días y el hito, que es todo
//      lo que necesitaría una capa de XP futura. Y D2-02 obliga a que, si
//      llegara, se quede dentro de Rachas y Sonido.
//   2. **Doce logros, no ciento.** *"Prefiero una base sólida y extensible"*
//      (apartado 16). Añadir uno es una entrada más en la tabla de abajo.
//   3. **Las celebraciones se reservan.** Los tres niveles del apartado 24 están
//      definidos, y la mayoría de los días no dan ninguno.
//
// ── LO QUE NO ESTÁ AQUÍ (apartado 35) ──────────────────────────────────────
//
// Ni diseño visual, ni Centro de Rachas, ni calendario, ni confeti, ni sonidos,
// ni vibraciones, ni notificaciones, ni tienda, ni ranking. Esto define los
// datos y los eventos; RA F4 los pinta.
// ============================================================================

import { todayISO, uid } from './helpers';
import { ESTADOS_DIA, ESTADOS_RACHA, estadoDeDia, indicePorFecha } from './rachas';
import { HITOS, normalizarEstado, panelRacha, panelRachas, recalcularRacha } from './rachasServicio';

/* ===========================================================================
   1 · HITOS (apartados 2, 3 y 7)
   ===========================================================================
   *"NO codifiques estos números directamente por todas partes. Crea una
   configuración central: STREAK_MILESTONES."*

   Es la de `rachasServicio.js`, reexportada aquí con el nombre de la
   especificación. **Una sola lista**, no dos que se puedan desincronizar. Vive
   allí y no aquí para que el servicio no dependa de su propia capa superior.

   Y el apartado 3: los hitos **no** llevan lógica por módulo. Son días, y una
   racha de entreno de 30 llega al mismo hito que una de sueño de 30. */
export const STREAK_MILESTONES = HITOS;

/* Apartado 24 — tres niveles de celebración. La mayoría de los días no dan
   ninguno: es lo que impide que celebrar deje de significar nada.

   `micro` no está aquí a propósito: no es un hito, es lo que pasa al cumplir un
   día normal, y lo emite `CELEBRACIONES.micro` desde los eventos. */
export const NIVELES_CELEBRACION = { MICRO: 'micro', MEDIA: 'media', GRANDE: 'grande' };

/** Qué celebración merece un hito. Grande solo para los tres de verdad. */
export function celebracionDeHito(dias) {
  if ([30, 100, 365].includes(dias)) return NIVELES_CELEBRACION.GRANDE;
  if (STREAK_MILESTONES.includes(dias)) return NIVELES_CELEBRACION.MEDIA;
  return NIVELES_CELEBRACION.MICRO;
}

/**
 * Apartado 8 — *"No guardar simplemente daysRemaining = 13, porque cambiaría con
 * el tiempo. Debe derivarse del estado actual."*
 *
 * Y pasado el último hito devuelve `null`, no un objetivo inventado: quien lleve
 * 400 días no tiene "siguiente hito", y decir que sí sería mentir (regla 8).
 */
export function progresoHaciaHito(dias) {
  const objetivo = STREAK_MILESTONES.find((h) => h > dias);
  if (!objetivo) return null;
  const previo = [...STREAK_MILESTONES].reverse().find((h) => h <= dias) || 0;
  return {
    objetivo,
    faltan: objetivo - dias,
    // El porcentaje se mide DESDE el hito anterior, no desde cero: con 17 días y
    // el hito en 30, ir de 14 a 30 es un 19 % recorrido, no un 57 %. Medirlo
    // desde cero haría que la barra apenas se moviera entre 200 y 365.
    progreso: Math.min(100, Math.round(((dias - previo) / (objetivo - previo)) * 100)),
    desde: previo,
  };
}

/* ===========================================================================
   2 · LOGROS (apartados 4, 7, 16, 17, 18 y 19)
   ===========================================================================
   *"Hito ≠ logro. Mantén separados ambos conceptos."*

   Un **hito** es un punto de progreso: 30 días. Un **logro** es una conquista con
   una condición, que puede o no ser una racha — y por eso `condicion` recibe el
   contexto entero y no solo un número. Cuando llegue "haber creado 5 rachas" o
   "cumplir 30 días en un mes natural", será una fila más de esta tabla.

   `AchievementDefinition` (esto, estático y global — apartado 30: *"si
   determinadas definiciones son globales y estáticas, pueden cachearse"*) va
   separado de `UserAchievement` (lo desbloqueado, que sí se guarda). */

/**
 * @typedef {Object} DefinicionLogro
 * @property {string} id
 * @property {string} titulo
 * @property {string} desc
 * @property {'racha'|'record'|'coleccion'} familia
 * @property {boolean} [oculto]      apartado 17 — se revela al desbloquearse
 * @property {boolean} [porRacha]    se desbloquea por CADA racha, no una sola vez
 * @property {(ctx: object) => boolean} condicion
 * @property {(ctx: object) => {actual: number, meta: number}|null} [progreso]
 */

/** Un logro de racha de N días. Doce definiciones salen de aquí sin repetir código. */
const logroDeRacha = (dias, id, titulo, desc) => ({
  id,
  titulo,
  desc,
  familia: 'racha',
  porRacha: true,
  dias,
  condicion: (ctx) => ctx.record >= dias,
  progreso: (ctx) => ({ actual: Math.min(ctx.record, dias), meta: dias }),
});

export const DEFINICIONES_LOGRO = [
  logroDeRacha(1, 'primer_dia', 'El primer día', 'Cumple una racha un día'),
  logroDeRacha(7, 'primera_llama', 'Primera llama', 'Siete días seguidos'),
  logroDeRacha(14, 'dos_semanas', 'Dos semanas', 'Catorce días seguidos'),
  logroDeRacha(30, 'imparable', 'Imparable', 'Treinta días seguidos'),
  logroDeRacha(50, 'medio_centenar', 'Medio centenar', 'Cincuenta días seguidos'),
  logroDeRacha(100, 'leyenda', 'Leyenda', 'Cien días seguidos'),
  logroDeRacha(365, 'un_ano', 'Un año entero', 'Trescientos sesenta y cinco días seguidos'),

  // Apartado 16 — "Récord": superar la mejor marca anterior. No es un número
  // fijo, así que no tiene barra de progreso: nadie sabe cuánto le falta para
  // batirse a sí mismo hasta que lo hace.
  {
    id: 'nuevo_record',
    titulo: 'Mejor que nunca',
    desc: 'Supera tu propio récord en una racha',
    familia: 'record',
    porRacha: true,
    condicion: (ctx) => ctx.batiendoRecord === true,
  },

  // Apartado 16 — "Constancia": no es una racha seguida, es cumplir mucho aunque
  // se falle. Premia volver, que es lo contrario de castigar el fallo.
  {
    id: 'constancia',
    titulo: 'Constancia',
    desc: 'Cumple 30 días en total en una misma racha',
    familia: 'coleccion',
    porRacha: true,
    condicion: (ctx) => ctx.diasCumplidos >= 30,
    progreso: (ctx) => ({ actual: Math.min(ctx.diasCumplidos, 30), meta: 30 }),
  },
  {
    id: 'vuelta',
    titulo: 'Volver a empezar',
    desc: 'Empieza una racha nueva después de perder otra',
    familia: 'coleccion',
    porRacha: true,
    condicion: (ctx) => ctx.tramos >= 2,
  },

  // Estos dos miran TODAS las rachas a la vez, no una: por eso `porRacha` es falso.
  {
    id: 'varias_frentes',
    titulo: 'En varios frentes',
    desc: 'Mantén tres rachas vivas a la vez',
    familia: 'coleccion',
    condicion: (ctx) => ctx.rachasVivas >= 3,
    progreso: (ctx) => ({ actual: Math.min(ctx.rachasVivas, 3), meta: 3 }),
  },
  // Apartado 17 — el único oculto. Se enseña como "???" hasta que se consigue,
  // porque contarlo antes convertiría un descubrimiento en una tarea.
  {
    id: 'sin_fallar_un_mes',
    titulo: 'Mes perfecto',
    desc: 'Un mes entero sin fallar un solo día en ninguna racha',
    familia: 'coleccion',
    oculto: true,
    condicion: (ctx) => ctx.rachaGlobal >= 30,
  },
];

export const definicionLogro = (id) => DEFINICIONES_LOGRO.find((d) => d.id === id) || null;

export const ESTADOS_LOGRO = { BLOQUEADO: 'locked', DESBLOQUEADO: 'unlocked' };

/**
 * Apartado 5 — *"user_id + achievement_id debe ser único."*
 *
 * El usuario está implícito (los datos son suyos y no hay `user_id` en el
 * modelo, desde RA F2), así que la clave única es `logro + racha`. La racha entra
 * porque un logro `porRacha` se consigue una vez **por cada** racha: llegar a 30
 * días entrenando y a 30 días estudiando son dos conquistas, no una repetida.
 */
export const claveLogro = (definicionId, rachaId) => `${definicionId}::${rachaId || 'global'}`;

/* ===========================================================================
   3 · EL CONTEXTO — de dónde salen los datos, y por qué no se puede hacer trampa
   ===========================================================================
   Apartado 27, ANTI-EXPLOIT: *"No permitas que el usuario desbloquee logros
   simplemente modificando valores desde el frontend. `currentStreak = 1000` no
   debe desbloquear automáticamente un logro sin que exista evidencia real de los
   días correspondientes."*

   Esto se cumple por construcción y no por vigilancia: el contexto **no acepta
   ningún número de fuera**. Lo pide todo al servicio, que a su vez lo deriva del
   historial de cumplimientos. Un `currentStreak` inyectado en el objeto guardado
   ni siquiera se lee — `normalizarRacha` lo descartó al cargar (RA F1) y aquí no
   hay ninguna vía por la que pudiera entrar. */
function contextoDeRacha(estado, racha, hoy) {
  const resumen = panelRacha(estado, racha.id, hoy);
  if (!resumen) return null;
  return {
    rachaId: racha.id,
    nombre: racha.nombre,
    actual: resumen.actual,
    record: resumen.record,
    diasCumplidos: resumen.diasCumplidos,
    batiendoRecord: resumen.batiendoRecord,
    tramos: resumen.tramos.length,
    estado: resumen.estado,
  };
}

function contextoGlobal(estado, hoy) {
  const panel = panelRachas(estado, hoy);
  return {
    rachasVivas: panel.rachas.filter((r) => r.actual > 0).length,
    rachaGlobal: panel.global.actual,
    rachasTotales: panel.rachas.length,
  };
}

/* ===========================================================================
   4 · ESTADO PERSISTIDO DE LA GAMIFICACIÓN (apartados 6 y 29)
   ===========================================================================
   *"Si el usuario alcanza 30 días y después actualiza la aplicación, no debe
   volver a desbloquearlo. Debe existir un estado persistente."*

   Dos listas, y nada más:

     desbloqueados — los logros conseguidos, con su fecha. `UserAchievement`.
     hitos         — qué hitos ya se anunciaron, por racha. Es lo que resuelve el
                     apartado 12: pasar de 9 a 10 días no puede emitir el hito
                     tres veces. Un evento derivado del estado se emitiría cada
                     vez que alguien mirase; apuntarlo lo convierte en una vez.

   Va dentro de la misma clave `rachas` de `app_data`, con la misma decisión y
   los mismos motivos que RA F2 (apartado 29: *"No uses exactamente estos nombres
   si contradicen las convenciones existentes"*). Sin tabla nueva, sin SQL nuevo,
   con el aislamiento por usuario que ya dan las políticas de `app_data`. */

export function normalizarGamificacion(guardado) {
  const g = guardado || {};
  const hitos = {};
  for (const [rachaId, lista] of Object.entries(g.hitos || {})) {
    if (Array.isArray(lista)) hitos[rachaId] = [...new Set(lista.filter((n) => Number.isFinite(n)))].sort((a, b) => a - b);
  }
  return {
    desbloqueados: (Array.isArray(g.desbloqueados) ? g.desbloqueados : [])
      .filter((l) => l && l.definicionId && definicionLogro(l.definicionId))
      .map((l) => ({
        id: l.id || uid(),
        definicionId: l.definicionId,
        rachaId: l.rachaId || null,
        desbloqueadoEn: l.desbloqueadoEn || null,
      }))
      // Apartado 5: la clave lógica es única. Si una copia restaurada trae el
      // mismo logro dos veces, se queda uno.
      .filter((l, i, todos) => todos.findIndex((x) => claveLogro(x.definicionId, x.rachaId) === claveLogro(l.definicionId, l.rachaId)) === i),
    hitos,
  };
}

export const GAMIFICACION_INICIAL = { desbloqueados: [], hitos: {} };

/* ===========================================================================
   5 · EVALUACIÓN (apartados 11, 12, 32)
   ===========================================================================
   *"No quiero que cada componente tenga que descubrir por su cuenta qué ha
   ocurrido. Debe existir una capa central."*

   `evaluar()` es esa capa. Se llama una vez, devuelve **qué ha cambiado** y el
   estado nuevo. Los eventos que devuelve son solo los NUEVOS: los hitos ya
   anunciados y los logros ya desbloqueados no vuelven a salir. */

export const EVENTOS_GAMIFICACION = {
  STREAK_STARTED: 'STREAK_STARTED',
  STREAK_CONTINUED: 'STREAK_CONTINUED',
  STREAK_MILESTONE_REACHED: 'STREAK_MILESTONE_REACHED',
  STREAK_PERSONAL_RECORD: 'STREAK_PERSONAL_RECORD',
  STREAK_BROKEN: 'STREAK_BROKEN',
  ACHIEVEMENT_UNLOCKED: 'ACHIEVEMENT_UNLOCKED',
};

/**
 * @param {object} estado         el estado de rachas (RA F2)
 * @param {object} gamificacion   lo desbloqueado hasta ahora
 * @returns {{gamificacion: object, eventos: object[]}}
 */
export function evaluar(estado, gamificacion, hoy = todayISO()) {
  const e = normalizarEstado(estado);
  const g = normalizarGamificacion(gamificacion);
  const eventos = [];
  const hitos = { ...g.hitos };
  const desbloqueados = [...g.desbloqueados];
  const global = contextoGlobal(e, hoy);

  const desbloquear = (definicion, rachaId, extra = {}) => {
    const clave = claveLogro(definicion.id, rachaId);
    if (desbloqueados.some((l) => claveLogro(l.definicionId, l.rachaId) === clave)) return;   // apartado 6
    desbloqueados.push({ id: uid(), definicionId: definicion.id, rachaId: rachaId || null, desbloqueadoEn: hoy });
    eventos.push({
      tipo: EVENTOS_GAMIFICACION.ACHIEVEMENT_UNLOCKED,
      logroId: definicion.id,
      titulo: definicion.titulo,
      rachaId: rachaId || null,
      celebracion: definicion.dias ? celebracionDeHito(definicion.dias) : NIVELES_CELEBRACION.MEDIA,
      ...extra,
    });
  };

  for (const racha of e.definiciones.filter((r) => r.activa)) {
    const ctx = contextoDeRacha(e, racha, hoy);
    if (!ctx) continue;
    const indice = indicePorFecha(e.eventos, racha.id);
    const hoyCumplido = estadoDeDia(hoy, { indice, regla: racha.regla, hoy }) === ESTADOS_DIA.COMPLETADO;
    const base = { rachaId: racha.id, nombre: racha.nombre, dias: ctx.actual };

    // ── Estado de la racha ────────────────────────────────────────────────
    if (hoyCumplido) {
      // Empezar y continuar son cosas distintas: la primera merece una frase, la
      // segunda un visto. Es el "microfeedback" del apartado 23.
      eventos.push({ tipo: ctx.actual === 1 ? EVENTOS_GAMIFICACION.STREAK_STARTED : EVENTOS_GAMIFICACION.STREAK_CONTINUED, ...base });
    } else if (ctx.actual === 0 && ctx.estado === ESTADOS_RACHA.ROTA) {
      eventos.push({ tipo: EVENTOS_GAMIFICACION.STREAK_BROKEN, ...base, record: ctx.record });
    }

    // ── Hitos (apartado 12): cada uno, una sola vez ───────────────────────
    // Se comprueban TODOS los hitos por debajo de la racha actual, no solo el
    // que coincide exactamente. Si no, abrir la app después de una semana fuera
    // se saltaría los hitos intermedios en silencio.
    const yaAnunciados = hitos[racha.id] || [];
    const alcanzados = STREAK_MILESTONES.filter((h) => h <= ctx.actual && !yaAnunciados.includes(h));
    if (alcanzados.length) {
      hitos[racha.id] = [...yaAnunciados, ...alcanzados].sort((a, b) => a - b);
      for (const h of alcanzados) {
        eventos.push({ tipo: EVENTOS_GAMIFICACION.STREAK_MILESTONE_REACHED, ...base, hito: h, celebracion: celebracionDeHito(h) });
      }
    }

    // ── Récord superado (apartado 10) ─────────────────────────────────────
    if (ctx.batiendoRecord) {
      eventos.push({ tipo: EVENTOS_GAMIFICACION.STREAK_PERSONAL_RECORD, ...base, record: ctx.record });
    }

    // ── Logros de esta racha ──────────────────────────────────────────────
    for (const def of DEFINICIONES_LOGRO.filter((d) => d.porRacha)) {
      if (def.condicion({ ...ctx, ...global })) desbloquear(def, racha.id, { nombre: racha.nombre });
    }
  }

  // ── Logros que miran el conjunto ────────────────────────────────────────
  for (const def of DEFINICIONES_LOGRO.filter((d) => !d.porRacha)) {
    if (def.condicion({ ...global })) desbloquear(def, null);
  }

  return { gamificacion: { desbloqueados, hitos }, eventos };
}

/* ===========================================================================
   6 · CONSULTA — lo que necesitará la interfaz de RA F4
   =========================================================================== */

/**
 * Apartados 18 y 19 — cada logro con su estado y, cuando tenga sentido, su
 * progreso. Un logro oculto sin desbloquear no cuenta de qué va (apartado 17).
 */
export function listaLogros(estado, gamificacion, hoy = todayISO()) {
  const e = normalizarEstado(estado);
  const g = normalizarGamificacion(gamificacion);
  const global = contextoGlobal(e, hoy);
  const contextos = e.definiciones.filter((r) => r.activa).map((r) => contextoDeRacha(e, r, hoy)).filter(Boolean);

  const salida = [];
  for (const def of DEFINICIONES_LOGRO) {
    const relevantes = def.porRacha ? contextos : [null];
    for (const ctx of relevantes) {
      const rachaId = ctx?.rachaId || null;
      const conseguido = g.desbloqueados.find((l) => claveLogro(l.definicionId, l.rachaId) === claveLogro(def.id, rachaId));
      const desbloqueado = !!conseguido;
      // El progreso se calcula solo si el logro lo ofrece Y hay contra qué
      // medirlo. Nunca se inventa una barra para un logro que no tiene meta.
      const progreso = def.progreso && (ctx || !def.porRacha) ? def.progreso({ ...(ctx || {}), ...global }) : null;
      salida.push({
        id: def.id,
        clave: claveLogro(def.id, rachaId),
        // Apartado 17: hasta desbloquearlo, un logro oculto es "???".
        titulo: def.oculto && !desbloqueado ? '???' : def.titulo,
        desc: def.oculto && !desbloqueado ? 'Un logro por descubrir' : def.desc,
        familia: def.familia,
        oculto: !!def.oculto,
        rachaId,
        rachaNombre: ctx?.nombre || null,
        estado: desbloqueado ? ESTADOS_LOGRO.DESBLOQUEADO : ESTADOS_LOGRO.BLOQUEADO,
        desbloqueadoEn: conseguido?.desbloqueadoEn || null,
        progreso: desbloqueado ? null : progreso,
      });
      if (!def.porRacha) break;
    }
  }
  return salida;
}

/**
 * Apartado 20 — *"No construyas todavía un dashboard estadístico enorme. Solo
 * proporciona datos fiables."* Los ocho que pide, todos derivados.
 */
export function estadisticasGamificacion(estado, gamificacion, hoy = todayISO()) {
  const e = normalizarEstado(estado);
  const g = normalizarGamificacion(gamificacion);
  const panel = panelRachas(e, hoy);

  return {
    diasTotalesCumplidos: panel.rachas.reduce((n, r) => n + r.diasCumplidos, 0),
    mejorRacha: panel.rachas.reduce((n, r) => Math.max(n, r.record), 0),
    rachaActual: panel.principal?.actual || 0,
    rachaGlobal: panel.global.actual,
    // "Rachas completadas" = tramos que llegaron a su fin, no los vivos.
    rachasCompletadas: panel.rachas.reduce((n, r) => n + r.tramos.filter((t) => !t.activo).length, 0),
    hitosAlcanzados: Object.values(g.hitos).reduce((n, l) => n + l.length, 0),
    logrosDesbloqueados: g.desbloqueados.length,
    logrosTotales: listaLogros(e, g, hoy).length,
    porcentajeCumplimiento: panel.rachas.length
      ? Math.round(panel.rachas.reduce((n, r) => n + r.porcentaje, 0) / panel.rachas.length)
      : 0,
  };
}

/**
 * Apartado 21 — *"El sistema debe poder proporcionar el estado de cada día."*
 * Los días de un mes con su estado, listos para el calendario de RA F4. Aquí no
 * se pinta nada: solo se dice qué pasó cada día.
 */
export function diasDelMes(estado, rachaId, anio, mes, hoy = todayISO()) {
  const e = normalizarEstado(estado);
  const racha = e.definiciones.find((r) => r.id === rachaId);
  if (!racha) return [];
  const indice = indicePorFecha(e.eventos, rachaId);
  const total = new Date(anio, mes, 0).getDate();
  const dias = [];
  for (let d = 1; d <= total; d++) {
    const fecha = `${anio}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dias.push({ fecha, dia: d, estado: estadoDeDia(fecha, { indice, regla: racha.regla, hoy }) });
  }
  return dias;
}

/**
 * Apartado 36 — todo lo que la interfaz de RA F4 necesitará, de una sola pieza y
 * calculado una vez (apartado 30: nada de recalcularlo todo en cada render).
 */
export function panelGamificacion(estado, gamificacion, hoy = todayISO()) {
  const e = normalizarEstado(estado);
  const g = normalizarGamificacion(gamificacion);
  const panel = panelRachas(e, hoy);
  const logros = listaLogros(e, g, hoy);

  return {
    rachas: panel.rachas.map((r) => ({ ...r, hito: progresoHaciaHito(r.actual) })),
    principal: panel.principal ? { ...panel.principal, hito: progresoHaciaHito(panel.principal.actual) } : null,
    global: panel.global,
    logros,
    desbloqueados: logros.filter((l) => l.estado === ESTADOS_LOGRO.DESBLOQUEADO),
    estadisticas: estadisticasGamificacion(e, g, hoy),
  };
}

/* ===========================================================================
   7 · RECÁLCULO Y REVOCACIÓN (apartado 28)
   ===========================================================================
   *"Los logros ya desbloqueados deberían tratarse con cuidado. No borres
   automáticamente el histórico de que un logro fue conseguido solo porque
   posteriormente cambió una actividad. Si existe una necesidad de revocación,
   debe ser una decisión explícita del sistema."*

   **Decisión: un logro no se revoca nunca por sí solo.** Josué cumplió treinta
   días seguidos; corregir después un entrenamiento mal apuntado no deshace
   haberlos cumplido, y quitarle el logro por eso sería castigarle por ordenar sus
   datos. Los números (racha, récord, progreso) sí se corrigen solos, porque se
   derivan — así que no hay incoherencia: lo que cambia es el presente, no lo que
   ya pasó.

   La revocación existe, pero hay que pedirla a mano y solo tiene sentido en un
   caso: **borrar una racha entera**, que se lleva los logros que solo existían
   por ella igual que se lleva sus cumplimientos. */
export function revocarLogro(gamificacion, definicionId, rachaId) {
  const g = normalizarGamificacion(gamificacion);
  const clave = claveLogro(definicionId, rachaId);
  return { ...g, desbloqueados: g.desbloqueados.filter((l) => claveLogro(l.definicionId, l.rachaId) !== clave) };
}

/** Al borrar una racha se van sus logros y sus hitos. Nada queda apuntando al vacío. */
export function olvidarRacha(gamificacion, rachaId) {
  const g = normalizarGamificacion(gamificacion);
  const { [rachaId]: _fuera, ...hitos } = g.hitos;
  return { desbloqueados: g.desbloqueados.filter((l) => l.rachaId !== rachaId), hitos };
}

/**
 * Apartado 28 — qué pasaría si se revisara. **Informa, no toca nada**: dice qué
 * logros ya no cumplirían su condición hoy, para que la decisión sea de quien
 * mire y no del sistema.
 */
export function revisarLogros(estado, gamificacion, hoy = todayISO()) {
  const e = normalizarEstado(estado);
  const g = normalizarGamificacion(gamificacion);
  const global = contextoGlobal(e, hoy);
  const sinRespaldo = [];

  for (const l of g.desbloqueados) {
    const def = definicionLogro(l.definicionId);
    if (!def) continue;
    const racha = l.rachaId ? e.definiciones.find((r) => r.id === l.rachaId) : null;
    if (l.rachaId && !racha) { sinRespaldo.push({ ...l, motivo: 'Su racha ya no existe.' }); continue; }
    const ctx = racha ? contextoDeRacha(e, racha, hoy) : {};
    if (!def.condicion({ ...(ctx || {}), ...global })) {
      sinRespaldo.push({ ...l, titulo: def.titulo, motivo: 'Hoy ya no cumpliría la condición.' });
    }
  }
  // Se devuelven para mirarlos, no para borrarlos. La revocación es explícita.
  return { conservados: g.desbloqueados.length - sinRespaldo.length, sinRespaldo };
}

export { recalcularRacha };
