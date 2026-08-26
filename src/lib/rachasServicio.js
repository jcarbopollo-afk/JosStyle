// ============================================================================
// RA · Fase 2/4 — PERSISTENCIA, SEGURIDAD Y SINCRONIZACIÓN
//
// *"Continúa exactamente desde la FASE 1. NO rehagas el motor de rachas si ya
// funciona correctamente."* — así que aquí no se recalcula nada: todo lo que
// necesite un número llama a `rachas.js`. Esto es la capa de ENCIMA.
//
// ── LA DECISIÓN DE ARQUITECTURA, Y POR QUÉ ─────────────────────────────────
//
// El apartado 3 propone tablas `streaks` / `streak_days` en Supabase, y a
// continuación dice: *"No copies estos nombres obligatoriamente si el proyecto
// ya utiliza otra convención."* El apartado 1 lo remata: *"No dupliques sistemas
// existentes. Si ya existe una abstracción para acceso a Supabase, reutilízala."*
//
// JosStyle tiene una: **una sola tabla `app_data`**, una fila por usuario y
// clave, con RLS por `auth.uid()`, que usan los veinte módulos. Montar tablas
// propias solo para las rachas sería el segundo sistema de persistencia del
// proyecto, y obligaría a Josué a ejecutar un tercer bloque de SQL —ya tiene dos
// pendientes— sin el cual las rachas dejarían de funcionar.
//
// Así que las rachas viven en `app_data` bajo la clave `rachas`. Lo que en el
// apartado 5 son políticas RLS y en el 6 una restricción `UNIQUE`, aquí son:
//
//   · **Aislamiento entre usuarios** — las políticas de `app_data` ya vigentes.
//     Y es más fuerte que "no confiar en el user_id del cliente" (apartado 4):
//     **el cliente no manda ningún user_id**, porque no hay ninguno en el
//     modelo. No existe forma de pedir la racha de otro.
//   · **`UNIQUE(streak_id, local_date)`** (apartado 6) — la clave lógica
//     `racha + día` de la Fase 1, aplicada en este servicio, que es el único
//     sitio del proyecto que escribe cumplimientos. El apartado lo admite
//     expresamente: *"siempre que encaje con el modelo final."*
//   · **Contadores no manipulables** (apartado 11) — no hay `current_streak` ni
//     `longest_streak` que enviar. No se guardan. Mandar `{currentStreak: 9999}`
//     no tiene dónde aterrizar.
//
// ── LO QUE ESTE ARCHIVO ES ─────────────────────────────────────────────────
//
// El servicio central del apartado 14: **el único sitio que escribe rachas.**
// Dashboard, Productividad, Centro de Rachas y lo que venga después llaman aquí;
// ninguno toca `supabase.from(...)` ni recalcula por su cuenta.
// ============================================================================

import { todayISO, addDays, uid } from './helpers';
import {
  DEFAULT_RACHAS, normalizarRacha, crearRacha as construirRacha, tipoRacha,
  claseDeRegla, registrarCumplimiento, anularCumplimiento, indicePorFecha,
  rachaActual, mejorRacha, historialDeRachas, estadoRacha, resumenRacha,
  rachaGlobal, estadoDeDia, ESTADOS_DIA, ESTADOS_RACHA,
  resumenHabito, rachaDeHabito,
} from './rachas';

/* ===========================================================================
   TIPOS (apartado 22)
   ===========================================================================

   *"Los tipos del frontend deben corresponder con el modelo real. Evita `any`."*

   **El proyecto no usa TypeScript**: es JavaScript con Vite, y no hay un solo
   `.ts` en `src/`. Meter TypeScript por un módulo obligaría a configurar el
   compilador entero para el resto, que es justo el "duplicar sistemas" que
   prohíbe el apartado 1.

   El equivalente honesto en un proyecto JS es esto: los tipos descritos como
   `@typedef` —que el editor de Josué sí lee— y, sobre todo, **normalizadores que
   se ejecutan de verdad** (`normalizarRacha`, `normalizarEstado`). Un typedef
   avisa; un normalizador impide. Aquí están los dos.

   @typedef {Object} Racha
   @property {string} id
   @property {string} tipo        uno de TIPOS_RACHA
   @property {string} nombre
   @property {string} icono
   @property {Regla}  regla
   @property {string|null} creadaEn
   @property {boolean} activa

   @typedef {Object} Regla
   @property {string} clase       'diaria' | 'diaria_con_gracia' | 'minimo' | 'cantidad'
   @property {number} [valor]
   @property {number} [tolerancia]

   @typedef {Object} Cumplimiento
   @property {string} id
   @property {string} rachaId
   @property {string} fecha         día LÓGICO local (AAAA-MM-DD) — decide la racha
   @property {number} valor
   @property {string} registradoEn  instante real en UTC — solo desempata
   @property {string} origen        'manual' | 'habito' | 'training' | …
   @property {string} [origenId]    id de la actividad que lo generó

   @typedef {Object} EstadoRachas
   @property {Racha[]} definiciones
   @property {Cumplimiento[]} eventos
   @property {Cumplimiento[]} pendientes   cola offline
*/

/** El estado completo, saneado. `loadData` no fusiona con el default (regla 5). */
export function normalizarEstado(guardado) {
  const g = guardado || {};
  return {
    definiciones: (Array.isArray(g.definiciones) ? g.definiciones : []).map(normalizarRacha),
    eventos: (Array.isArray(g.eventos) ? g.eventos : []).filter((e) => e && e.rachaId && e.fecha),
    pendientes: (Array.isArray(g.pendientes) ? g.pendientes : []).filter((e) => e && e.rachaId && e.fecha),
  };
}

export const ESTADO_INICIAL = { ...DEFAULT_RACHAS, pendientes: [] };

/* ===========================================================================
   CREAR UNA RACHA (apartado 9)
   ===========================================================================
   *"Validar usuario; validar tipo; validar regla; evitar configuraciones
   inválidas; no permitas crear rachas huérfanas."*

   El usuario no hace falta validarlo: el estado ES del usuario autenticado, no
   hay otro al que pudiera pertenecer. Lo demás sí, y devolviendo el motivo en
   vez de lanzar, para que la interfaz pueda decirlo con una frase corta. */

export function validarNuevaRacha(estado, { tipo, nombre, regla } = {}) {
  if (!tipoRacha(tipo) || tipoRacha(tipo).id !== tipo) return { ok: false, motivo: 'Ese tipo de racha no existe.' };
  const clase = claseDeRegla(regla);
  if (regla?.clase && clase.id !== regla.clase) return { ok: false, motivo: 'Esa regla no existe.' };
  // Una regla de mínimo o cantidad sin valor no puede cumplirse nunca: cualquier
  // día quedaría fallado para siempre. Es la "configuración inválida" del apartado.
  if ((clase.id === 'minimo' || clase.id === 'cantidad') && !(Number(regla?.valor) > 0)) {
    return { ok: false, motivo: 'Esa regla necesita un objetivo mayor que cero.' };
  }
  const limpio = (nombre || '').trim().toLowerCase();
  if (limpio && normalizarEstado(estado).definiciones.some((r) => r.nombre.trim().toLowerCase() === limpio)) {
    return { ok: false, motivo: 'Ya tienes una racha con ese nombre.' };
  }
  return { ok: true };
}

export function crearRacha(estado, datos = {}, hoy = todayISO()) {
  const e = normalizarEstado(estado);
  const v = validarNuevaRacha(e, datos);
  if (!v.ok) return { estado: e, error: v.motivo, racha: null };
  const racha = construirRacha({ ...datos, hoy });
  return { estado: { ...e, definiciones: [...e.definiciones, racha] }, error: null, racha };
}

/**
 * Borrar una racha se lleva sus cumplimientos. No es opcional: dejarlos sueltos
 * crearía eventos huérfanos que nadie podría consultar ni limpiar nunca.
 */
export function eliminarRacha(estado, rachaId) {
  const e = normalizarEstado(estado);
  return {
    definiciones: e.definiciones.filter((r) => r.id !== rachaId),
    eventos: e.eventos.filter((x) => x.rachaId !== rachaId),
    pendientes: e.pendientes.filter((x) => x.rachaId !== rachaId),
  };
}

/* ===========================================================================
   REGISTRAR UN CUMPLIMIENTO (apartados 10, 17, 19)
   ===========================================================================
   *"Debe ser idempotente. Si se ejecuta dos veces para el mismo día:
   resultado = un único cumplimiento."*

   Y el apartado 17: iPhone y ordenador completando el mismo día → **un** día.
   Aquí eso se cumple por construcción, no por suerte: `registrarCumplimiento`
   sustituye por `racha + fecha`, así que da igual cuántas veces llegue el mismo
   evento ni desde dónde.

   La FECHA LÓGICA se decide AQUÍ, antes de persistir (apartado 7), y sale del
   día local del dispositivo. Nunca la calcula el servidor a partir del
   timestamp: eso es exactamente el fallo del apartado 8 —completar a las 00:30 y
   que se archive en el día anterior— que este proyecto ya sufrió de verdad en
   `todayISO` y corrigió en AR F3. */
export function completarDia(estado, { rachaId, fecha = todayISO(), valor = 1, origen = 'manual', origenId = null } = {}) {
  const e = normalizarEstado(estado);
  if (!e.definiciones.some((r) => r.id === rachaId)) {
    // Apartado 9: nada de cumplimientos huérfanos.
    return { estado: e, error: 'Esa racha no existe.' };
  }
  const eventos = registrarCumplimiento(e.eventos, { rachaId, fecha, valor, origen });
  // El origen (apartado 19) va aparte porque el motor de la Fase 1 no lo conoce
  // ni lo necesita: para calcular una racha da igual de dónde salió el día.
  const conOrigen = eventos.map((x) => (x.rachaId === rachaId && x.fecha === fecha ? { ...x, origen, origenId } : x));
  return { estado: { ...e, eventos: conOrigen }, error: null };
}

/** Deshacer un día. Quita el cumplimiento; no lo marca como fallado. */
export function deshacerDia(estado, rachaId, fecha = todayISO()) {
  const e = normalizarEstado(estado);
  return { ...e, eventos: anularCumplimiento(e.eventos, rachaId, fecha) };
}

/* ===========================================================================
   EL ORIGEN Y SU INVALIDACIÓN (apartados 18 y 19)
   ===========================================================================
   *"Entrenamiento → genera cumplimiento → racha = 15. Después se elimina ese
   entrenamiento. La racha no debería permanecer artificialmente en 15."*

   Con contadores guardados eso sería un problema de verdad: habría que acordarse
   de decrementar. Aquí la racha **se deriva**, así que basta con que desaparezca
   el cumplimiento y el número se corrige solo, sin recalcular nada a mano.

   Lo que sí hacía falta —y es lo que añade esta fase— es poder encontrar el
   cumplimiento a partir de la actividad que lo generó. De ahí `origen` +
   `origenId`.

   El acoplamiento con Entrenamiento pertenece a otra fase (*"No acoples todavía
   el entrenamiento completo a esta lógica"*), así que aquí solo queda el
   mecanismo, listo para que quien borre una actividad lo llame. */
export function invalidarPorOrigen(estado, origen, origenId) {
  const e = normalizarEstado(estado);
  if (!origen || !origenId) return e;
  const sobra = (x) => x.origen === origen && x.origenId === origenId;
  return {
    ...e,
    eventos: e.eventos.filter((x) => !sobra(x)),
    pendientes: e.pendientes.filter((x) => !sobra(x)),
  };
}

/** Qué cumplimientos vienen de una actividad concreta. Para poder responder a *"¿por qué se completó esta racha?"* (apartado 20). */
export function cumplimientosDeOrigen(estado, origen, origenId) {
  return normalizarEstado(estado).eventos.filter((x) => x.origen === origen && (!origenId || x.origenId === origenId));
}

/* ===========================================================================
   RECÁLCULO (apartados 12 y 13)
   ===========================================================================
   *"Implementa una función central que pueda reconstruir currentStreak,
   longestStreak, currentStartDate y lastCompletedDate a partir del historial."*

   En este proyecto el recálculo no es una reparación excepcional: **es la única
   forma que hay de saber el número**, porque no se guarda ninguno. Aun así la
   función existe con ese nombre y esa forma, porque es lo que van a llamar las
   restauraciones, las migraciones y la detección de datos corruptos. */
export function recalcularRacha(estado, rachaId, hoy = todayISO()) {
  const e = normalizarEstado(estado);
  const racha = e.definiciones.find((r) => r.id === rachaId);
  if (!racha) return null;
  const tramos = historialDeRachas(e.eventos, racha, hoy);
  const vivo = tramos.find((t) => t.activo) || null;
  return {
    rachaId,
    currentStreak: rachaActual(e.eventos, racha, hoy),
    longestStreak: mejorRacha(e.eventos, racha, hoy),
    currentStartDate: vivo?.inicio || null,
    lastCompletedDate: tramos[0]?.fin || null,
    estado: estadoRacha(e.eventos, racha, hoy),
  };
}

export function recalcularTodo(estado, hoy = todayISO()) {
  const e = normalizarEstado(estado);
  return e.definiciones.map((r) => recalcularRacha(e, r.id, hoy)).filter(Boolean);
}

/**
 * Apartado 10, caso 10 de las pruebas: *"corrupción o discrepancia de contadores
 * → recalculate() debe reconstruir correctamente el estado."*
 *
 * Un dato restaurado de una copia vieja puede traer `currentStreak` pegado al
 * objeto. Esto lo detecta y **lo dice**, en vez de arrastrar en silencio un
 * número que ya no significa nada.
 */
export function revisarIntegridad(estado, hoy = todayISO()) {
  const e = normalizarEstado(estado);
  const problemas = [];

  // Los contadores pegados se buscan en el estado **CRUDO**, no en el normalizado:
  // `normalizarRacha` ya los descarta al pasar, así que mirarlos después de
  // normalizar no encontraría nunca ninguno. Que el motor sea inmune a ellos es
  // bueno; que la revisión no pueda avisar de que venían, no.
  for (const r of (Array.isArray(estado?.definiciones) ? estado.definiciones : [])) {
    const guardado = r?.currentStreak ?? r?.rachaActual ?? r?.longestStreak ?? r?.mejorRacha;
    if (guardado !== undefined) {
      const real = recalcularRacha(e, r.id, hoy);
      problemas.push({
        tipo: 'contador_guardado',
        rachaId: r.id,
        detalle: `"${r.nombre}" trae un contador guardado (${guardado}); el valor real es ${real ? real.currentStreak : 0}.`,
      });
    }
  }

  // Cumplimientos de una racha que ya no existe.
  const ids = new Set(e.definiciones.map((r) => r.id));
  const huerfanos = e.eventos.filter((x) => !ids.has(x.rachaId));
  if (huerfanos.length) {
    problemas.push({ tipo: 'huerfanos', detalle: `${huerfanos.length} cumplimiento(s) de una racha que ya no existe.` });
  }

  // Días duplicados: no deberían poder existir, y si existen es que algo escribió
  // sin pasar por este servicio. El motor ya se queda con el más reciente, así
  // que no rompen nada — pero conviene saberlo.
  const vistos = new Set();
  let duplicados = 0;
  for (const x of e.eventos) {
    const clave = `${x.rachaId}::${x.fecha}`;
    if (vistos.has(clave)) duplicados++;
    vistos.add(clave);
  }
  if (duplicados) problemas.push({ tipo: 'duplicados', detalle: `${duplicados} día(s) duplicado(s).` });

  // Un día en el futuro no puede haberse cumplido.
  const futuros = e.eventos.filter((x) => x.fecha > hoy).length;
  if (futuros) problemas.push({ tipo: 'futuros', detalle: `${futuros} cumplimiento(s) con fecha futura.` });

  return { ok: problemas.length === 0, problemas };
}

/** Deja el estado limpio de lo que `revisarIntegridad` encuentra. */
export function repararEstado(estado, hoy = todayISO()) {
  const e = normalizarEstado(estado);
  const ids = new Set(e.definiciones.map((r) => r.id));
  const porClave = {};
  for (const x of e.eventos) {
    if (!ids.has(x.rachaId) || x.fecha > hoy) continue;
    const clave = `${x.rachaId}::${x.fecha}`;
    const previo = porClave[clave];
    if (!previo || String(x.registradoEn || '') >= String(previo.registradoEn || '')) porClave[clave] = x;
  }
  return {
    // Los contadores pegados se retiran: la fuente de verdad es el historial.
    definiciones: e.definiciones.map(({ currentStreak, longestStreak, rachaActual: _ra, mejorRacha: _mr, ...r }) => normalizarRacha(r)),
    eventos: Object.values(porClave),
    pendientes: e.pendientes.filter((x) => ids.has(x.rachaId)),
  };
}

/* ===========================================================================
   CACHE LOCAL Y OFFLINE (apartados 15 y 16)
   ===========================================================================
   *"El cache local no debe convertirse en la fuente definitiva de verdad."* y
   *"no construyas un sistema offline gigantesco si corresponde a otra parte de
   la arquitectura global."*

   El cache ya existe y no hay que inventarlo: JosStyle guarda el estado en React
   y lo sube con `saveData`, así que la pantalla pinta al instante y la subida va
   detrás. Lo que faltaba era la **cola**: si `saveData` falla por falta de
   conexión, el cumplimiento se queda apuntado y se reintenta.

   Es pequeño a propósito, y funciona por una única razón: **reintentar es
   idempotente**. Un cumplimiento que se reenvía tres veces sigue siendo un día.
   Sin esa propiedad, una cola offline infla rachas; con ella, no puede. */

export function encolar(estado, cumplimiento) {
  const e = normalizarEstado(estado);
  const clave = `${cumplimiento.rachaId}::${cumplimiento.fecha}`;
  const sinDuplicar = e.pendientes.filter((x) => `${x.rachaId}::${x.fecha}` !== clave);
  return { ...e, pendientes: [...sinDuplicar, { ...cumplimiento, encoladoEn: new Date().toISOString() }] };
}

/**
 * Reaplica la cola sobre el estado. Devuelve el estado ya con los pendientes
 * integrados y la cola vacía.
 *
 * Se llama al recuperar la conexión. Como cada entrada pasa por
 * `completarDia`, aplicar la cola dos veces da el mismo resultado que aplicarla
 * una: es la propiedad que hace que una mala conexión no pueda estropear un
 * récord (apartado 20 de la Fase 1).
 */
export function vaciarCola(estado) {
  const e = normalizarEstado(estado);
  let acumulado = { ...e, pendientes: [] };
  for (const p of e.pendientes) {
    const { estado: siguiente } = completarDia(acumulado, p);
    acumulado = siguiente;
  }
  return acumulado;
}

export const hayPendientes = (estado) => normalizarEstado(estado).pendientes.length > 0;

/* ===========================================================================
   CONSULTA — lo que llaman las pantallas (apartados 14 y 24)
   ===========================================================================
   *"Evita que cada componente llame directamente a Supabase"* y *"no
   recalcules todas las rachas constantemente."*

   Una sola llamada devuelve el panel entero. Quien la use puede memoizarla con
   `useMemo` sobre `estado` y `hoy`, que es lo que hace `useRachas`. */

export function panelRachas(estado, hoy = todayISO()) {
  const e = normalizarEstado(estado);
  const rachas = e.definiciones.filter((r) => r.activa).map((r) => resumenRacha(e.eventos, r, hoy));
  return {
    rachas,
    // La principal es la más larga viva; si no hay ninguna viva, la de mejor récord.
    principal: rachas.slice().sort((a, b) => (b.actual - a.actual) || (b.record - a.record))[0] || null,
    global: rachaGlobal(e.eventos, e.definiciones, hoy),
    pendientesDeSincronizar: e.pendientes.length,
  };
}

export function panelRacha(estado, rachaId, hoy = todayISO()) {
  const e = normalizarEstado(estado);
  const racha = e.definiciones.find((r) => r.id === rachaId);
  return racha ? resumenRacha(e.eventos, racha, hoy) : null;
}

/* ===========================================================================
   EVENTOS PARA NOTIFICACIONES Y GAMIFICACIÓN (apartados 25 y 26)
   ===========================================================================
   *"No implementes todavía el sistema completo de notificaciones. Pero deja
   eventos claros que posteriormente puedan generar streak_at_risk,
   streak_completed, streak_broken, streak_milestone."*

   Esto **describe** lo que pasa; no notifica, no suena y no celebra nada. Es una
   lectura del estado, así que llamarlo dos veces no produce dos avisos: quien
   quiera avisar decidirá cuándo, en su fase.

   Los hitos son solo números de referencia, no logros: no dan XP, ni nivel, ni
   medalla (apartado 26 y D2-02). */
export const HITOS = [7, 14, 30, 50, 100, 365];

export const EVENTOS_RACHA = {
  EN_RIESGO: 'streak_at_risk',
  COMPLETADA: 'streak_completed',
  ROTA: 'streak_broken',
  HITO: 'streak_milestone',
};

/** El siguiente hito y cuánto falta. Sin hito siguiente devuelve null, no un número inventado. */
export function siguienteHito(dias) {
  const objetivo = HITOS.find((h) => h > dias);
  return objetivo ? { objetivo, faltan: objetivo - dias, progreso: Math.round((dias / objetivo) * 100) } : null;
}

export function eventosDeRacha(estado, hoy = todayISO()) {
  const e = normalizarEstado(estado);
  const salida = [];

  for (const racha of e.definiciones.filter((r) => r.activa)) {
    const indice = indicePorFecha(e.eventos, racha.id);
    const dias = rachaActual(e.eventos, racha, hoy);
    const estadoHoy = estadoDeDia(hoy, { indice, regla: racha.regla, hoy });
    const base = { rachaId: racha.id, nombre: racha.nombre, dias };

    if (estadoHoy === ESTADOS_DIA.COMPLETADO) {
      salida.push({ tipo: EVENTOS_RACHA.COMPLETADA, ...base });
      // El hito se anuncia el día que se alcanza, no todos los días después.
      if (HITOS.includes(dias)) salida.push({ tipo: EVENTOS_RACHA.HITO, ...base, hito: dias });
    } else if (dias > 0) {
      // Viva pero con hoy sin cumplir. NO es "rota" (apartado 8 de la Fase 1):
      // es en riesgo, y solo lo será hasta que termine el día.
      salida.push({ tipo: EVENTOS_RACHA.EN_RIESGO, ...base });
    } else if (estadoRacha(e.eventos, racha, hoy) === ESTADOS_RACHA.ROTA) {
      salida.push({ tipo: EVENTOS_RACHA.ROTA, ...base, ultimo: historialDeRachas(e.eventos, racha, hoy)[0]?.fin || null });
    }
  }
  return salida;
}

/* ===========================================================================
   LOS HÁBITOS, A TRAVÉS DEL MISMO SERVICIO (apartado 14)
   ===========================================================================
   *"Todos deben utilizar el servicio central."*

   Los hábitos de Productividad guardan su historial en su propio módulo desde la
   Fase 8, y en RA F1 se decidió **no migrarlo**: es dato real de Josué y moverlo
   no aporta nada. Pero eso no puede significar que tengan su propio camino.

   Se resuelve leyéndolos a través de este servicio, que los adapta. La regla
   sigue siendo una sola: quien quiera saber una racha, la pide aquí. */
export function panelHabitos(habitos, hoy = todayISO()) {
  const lista = (habitos || []).map((h) => ({ ...resumenHabito(h, hoy), habitoId: h.id }));
  return {
    rachas: lista,
    principal: lista.slice().sort((a, b) => (b.actual - a.actual) || (b.record - a.record))[0] || null,
  };
}

/** Los mismos eventos del apartado 25, para los hábitos. */
export function eventosDeHabitos(habitos, hoy = todayISO()) {
  const salida = [];
  for (const h of habitos || []) {
    const r = resumenHabito(h, hoy);
    const base = { rachaId: h.id, nombre: h.nombre, dias: r.actual };
    if (r.estadoHoy === ESTADOS_DIA.COMPLETADO) {
      salida.push({ tipo: EVENTOS_RACHA.COMPLETADA, ...base });
      if (HITOS.includes(r.actual)) salida.push({ tipo: EVENTOS_RACHA.HITO, ...base, hito: r.actual });
    } else if (r.actual > 0) {
      salida.push({ tipo: EVENTOS_RACHA.EN_RIESGO, ...base });
    } else if (r.estado === ESTADOS_RACHA.ROTA) {
      salida.push({ tipo: EVENTOS_RACHA.ROTA, ...base, ultimo: r.ultimoDia });
    }
  }
  return salida;
}

export { rachaDeHabito, resumenHabito };
