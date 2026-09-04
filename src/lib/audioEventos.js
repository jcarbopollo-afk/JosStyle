// ============================================================================
// SO · Fase 3/5 — EL CATÁLOGO COMPLETO Y LA JERARQUÍA
//
// *"Si ocurren varios eventos simultáneamente, no quiero cinco sonidos
// superpuestos. […] El sistema deberá seleccionar el evento sonoro dominante."*
//
// ── LO QUE AÑADE ESTA FASE ─────────────────────────────────────────────────
//
// SO F1 dejó **17 eventos** y cuatro prioridades (`LOW`…`CRITICAL`), que era lo
// que hacía falta para el motor. Esta fase trae lo que faltaba:
//
//   · **El catálogo entero** que pide la especificación (42 eventos).
//   · **La escala de 0 a 5** con la que se elige el dominante.
//   · **La progresión de la racha**: el milestone de 7 y el de 365 **no pueden
//     ser el mismo sonido más alto** (*"debe existir una evolución real de la
//     identidad sonora"*).
//
// ⚠️ **No se redefine nada de SO F1.** Los 17 de allí siguen siendo los que el
// motor conoce; aquí se añaden los que faltaban y se traducen los nombres de la
// especificación a los del proyecto. Dos catálogos que se separan es lo que la
// regla de F1 (apartado 30) prohíbe expresamente.
//
// ── LA CONTRADICCIÓN QUE YA TENÍA DECISIÓN ─────────────────────────────────
//
// La especificación lista `xp_small`, `xp_medium`, `xp_large` y `level_up`.
// Pero **RA F3 decidió no construir XP ni niveles**: los apartados 14 y 15 de
// Rachas los dejaban en condicional (*"si decides preparar XP"*) y no hacía
// falta — sin nada que gastar, un contador de XP es un control decorativo
// (regla 8).
//
// D2-02 lo respalda: *"XP y niveles solo dentro de Sonido/Rachas, sin salir de
// ahí"*. Así que los eventos **existen en el catálogo** —para que el día que
// haya XP suene sin tocar nada— y **hoy no los emite nadie**. Está dicho aquí y
// hay una prueba que lo comprueba, en vez de dejar un evento fantasma.
// ============================================================================

import { EVENTOS_SONIDO } from './audio';

/* ===========================================================================
   1 · LA ESCALA DE 0 A 5
   ===========================================================================
   *"5 = Grand Achievement · 4 = Personal Record / Major Milestone ·
   3 = Level Up / Achievement · 2 = Reward / Streak · 1 = Normal Feedback ·
   0 = UI"* */

export const NIVELES = [
  { n: 0, id: 'ui', label: 'Interfaz' },
  { n: 1, id: 'feedback', label: 'Confirmación' },
  { n: 2, id: 'recompensa', label: 'Racha o recompensa' },
  { n: 3, id: 'logro', label: 'Logro o subida de nivel' },
  { n: 4, id: 'record', label: 'Récord o gran hito' },
  { n: 5, id: 'grande', label: 'Gran logro' },
];

export const nivelDe = (n) => NIVELES.find((x) => x.n === n) || NIVELES[0];

/* ===========================================================================
   2 · EL CATÁLOGO COMPLETO
   ===========================================================================
   Los nombres son los de la especificación, en minúsculas. Cada uno apunta a un
   evento del motor (SO F1) y trae su nivel de la escala de arriba.

   ⚠️ `motor: null` significa **"todavía no lo emite nadie"**, y es información,
   no un hueco: es lo que permite saber qué falta por conectar sin buscarlo. */

export const CATALOGO = {
  // ── 0 · Interfaz ──────────────────────────────────────────────────────────
  ui_click: { nivel: 0, motor: 'UI_CLICK' },
  ui_toggle_on: { nivel: 0, motor: 'UI_TOGGLE' },
  ui_toggle_off: { nivel: 0, motor: 'UI_TOGGLE_OFF' },
  /* 🚨 Iba a `UI_CLICK`: abrir un panel sonaba igual que pulsar un botón, y los
     dos archivos de abrir de la biblioteca no se habrían oído nunca. */
  ui_open: { nivel: 0, motor: 'UI_OPEN' },
  ui_close: { nivel: 0, motor: 'UI_BACK' },

  // ── 1 · Confirmaciones ────────────────────────────────────────────────────
  success: { nivel: 1, motor: 'SUCCESS' },
  error: { nivel: 1, motor: 'ACTION_ERROR' },
  warning: { nivel: 1, motor: 'ACTION_WARNING' },
  save: { nivel: 1, motor: 'ACTION_SAVED' },
  task_complete: { nivel: 1, motor: 'ACTION_COMPLETED' },
  habit_complete: { nivel: 1, motor: 'ACTION_COMPLETED' },
  goal_progress: { nivel: 1, motor: 'ACTION_COMPLETED' },

  // ── 2 · Racha y recompensas ───────────────────────────────────────────────
  streak_start: { nivel: 2, motor: 'STREAK_STARTED' },
  streak_increment: { nivel: 2, motor: 'STREAK_CONTINUED' },
  streak_at_risk: { nivel: 2, motor: 'STREAK_CONTINUED' },
  streak_recovered: { nivel: 2, motor: 'STREAK_STARTED' },
  // ⚠️ El "congelar racha" NO existe en RA F1-F4: el motor deriva la racha del
  // historial y no tiene comodines. Queda en el catálogo por si algún día se
  // añade, y hoy no lo emite nadie.
  streak_freeze_used: { nivel: 2, motor: null, sinEmisor: 'No hay comodines de racha (RA F1).' },
  reward_small: { nivel: 2, motor: null, sinEmisor: 'No hay sistema de recompensas (D2-02).' },
  reward_medium: { nivel: 2, motor: null, sinEmisor: 'No hay sistema de recompensas (D2-02).' },

  // ── 3 · Logros y niveles ──────────────────────────────────────────────────
  achievement_unlocked: { nivel: 3, motor: 'ACHIEVEMENT_UNLOCKED' },
  badge_unlocked: { nivel: 3, motor: 'ACHIEVEMENT_UNLOCKED' },
  goal_complete: { nivel: 3, motor: 'GOAL_COMPLETED' },
  reward_major: { nivel: 3, motor: null, sinEmisor: 'No hay sistema de recompensas (D2-02).' },
  // ⚠️ XP y niveles: **RA F3 decidió no construirlos** (ver la cabecera).
  xp_small: { nivel: 1, motor: null, sinEmisor: 'No hay XP: RA F3 no lo construyó (D2-02).' },
  xp_medium: { nivel: 2, motor: null, sinEmisor: 'No hay XP: RA F3 no lo construyó (D2-02).' },
  xp_large: { nivel: 3, motor: null, sinEmisor: 'No hay XP: RA F3 no lo construyó (D2-02).' },
  level_up: { nivel: 3, motor: null, sinEmisor: 'No hay niveles: RA F3 no los construyó (D2-02).' },

  // ── 4 · Récords y grandes hitos ───────────────────────────────────────────
  /* ⚠️ El récord GANA a un milestone del mismo nivel. La especificación pone el
     caso: tarea → XP → nivel → milestone 30 → récord, y dice que suena
     PERSONAL_RECORD. Sin `desempate`, el milestone ganaba por tener más días,
     que es justo lo contrario. */
  personal_record: { nivel: 4, motor: 'NEW_RECORD', desempate: 1000 },
  streak_milestone_03: { nivel: 2, motor: 'STREAK_MILESTONE', dias: 3 },
  streak_milestone_07: { nivel: 3, motor: 'STREAK_MILESTONE', dias: 7 },
  streak_milestone_14: { nivel: 3, motor: 'STREAK_MILESTONE', dias: 14 },
  streak_milestone_21: { nivel: 3, motor: 'STREAK_MILESTONE', dias: 21 },
  streak_milestone_30: { nivel: 4, motor: 'STREAK_MILESTONE', dias: 30 },
  streak_milestone_50: { nivel: 4, motor: 'STREAK_MILESTONE', dias: 50 },
  streak_milestone_75: { nivel: 4, motor: 'STREAK_MILESTONE', dias: 75 },
  streak_milestone_100: { nivel: 5, motor: 'STREAK_MILESTONE', dias: 100 },
  streak_milestone_180: { nivel: 5, motor: 'STREAK_MILESTONE', dias: 180 },
  streak_milestone_365: { nivel: 5, motor: 'STREAK_MILESTONE', dias: 365 },

  // ── 5 · Lo más grande ─────────────────────────────────────────────────────
  grand_achievement: { nivel: 5, motor: 'MAJOR_GOAL_COMPLETED' },

  // ── Sistema ───────────────────────────────────────────────────────────────
  sync_complete: { nivel: 0, motor: 'UI_SUCCESS' },
  connection_lost: { nivel: 1, motor: 'ACTION_ERROR' },
  connection_restored: { nivel: 1, motor: 'UI_SUCCESS' },
};

export const definicion = (id) => CATALOGO[id] || null;

/** Los eventos que hoy no puede emitir nadie, con el motivo. */
export const sinEmisor = () => Object.entries(CATALOGO)
  .filter(([, d]) => !d.motor)
  .map(([id, d]) => ({ id, motivo: d.sinEmisor || 'Todavía sin conectar.' }));

/** Los que sí están conectados al motor de SO F1. */
export const conectados = () => Object.entries(CATALOGO)
  .filter(([, d]) => !!d.motor && !!EVENTOS_SONIDO[d.motor])
  .map(([id, d]) => ({ id, motor: d.motor, nivel: d.nivel }));

/* ===========================================================================
   3 · EL EVENTO DOMINANTE
   ===========================================================================
   *"Completar tarea → +XP → subir de nivel → alcanzar milestone → nuevo récord.
   El sistema deberá seleccionar el evento sonoro dominante. En este ejemplo:
   PERSONAL_RECORD."*

   ⚠️ Esto **no sustituye** al cooldown de SO F1: aquel evita que veinte toques
   den veinte sonidos; esto elige cuál de los cinco que pasan a la vez suena.
   Son dos problemas distintos y hacen falta los dos. */

export function dominante(eventos = []) {
  const validos = (eventos || [])
    .map((e) => (typeof e === 'string' ? e : e?.id || e?.tipo))
    .map((id) => ({ id, def: definicion(id) }))
    .filter((x) => x.def);
  if (!validos.length) return null;

  return validos.reduce((mejor, x) => {
    if (!mejor) return x;
    if (x.def.nivel > mejor.def.nivel) return x;
    /* A igual nivel manda el más específico: un milestone de 365 días pesa más
       que uno de 30. Y `desempate` está por encima de los días, que es lo que
       hace que el récord gane a un milestone del mismo nivel. */
    const peso = (d) => (d.desempate || 0) + (d.dias || 0);
    if (x.def.nivel === mejor.def.nivel && peso(x.def) > peso(mejor.def)) return x;
    return mejor;
  }, null).id;
}

/**
 * Lo que se manda al motor cuando pasan varias cosas a la vez: **un solo
 * sonido**, y la lista entera de lo ocurrido para que la interfaz sí pueda
 * enseñarlo todo (*"la interfaz puede mostrar visualmente todos los
 * acontecimientos, pero el audio debe mantener jerarquía"*).
 */
export function resolverSimultaneos(eventos = []) {
  const gana = dominante(eventos);
  if (!gana) return { sonar: null, motor: null, silenciados: [], nivel: null };
  const def = definicion(gana);
  return {
    sonar: gana,
    motor: def.motor,
    nivel: def.nivel,
    // ⚠️ Se dice cuáles se han callado, no se pierden: la pantalla los enseña.
    silenciados: eventos
      .map((e) => (typeof e === 'string' ? e : e?.id || e?.tipo))
      .filter((id) => id !== gana && definicion(id)),
    // Un evento sin emisor no puede sonar, pero tampoco se traga en silencio.
    sinSonido: !def.motor,
  };
}

/* ===========================================================================
   4 · LA PROGRESIÓN DE LA RACHA
   ===========================================================================
   *"Los milestones deben ser progresivamente más especiales. No quiero
   simplemente el mismo sonido con más volumen. Debe existir una evolución real
   de la identidad sonora."*

   ⚠️ Traducido a algo comprobable: **el nivel tiene que subir con los días.**
   Hay una prueba que recorre los once milestones y falla si dos consecutivos
   bajan de nivel. */

export const MILESTONES = Object.entries(CATALOGO)
  .filter(([id]) => id.startsWith('streak_milestone_'))
  .map(([id, d]) => ({ id, dias: d.dias, nivel: d.nivel }))
  .sort((a, b) => a.dias - b.dias);

/** El evento sonoro de una racha de N días, o `streak_increment` si no es hito. */
export function eventoDeRacha(dias, { esNuevo = false, esRecord = false } = {}) {
  // ⚠️ El récord es INDEPENDIENTE del milestone (la especificación lo dice
  // expresamente): *"has alcanzado un milestone"* y *"has superado tu propio
  // récord"* son acontecimientos diferentes, y el récord pesa más.
  if (esRecord) return 'personal_record';
  if (esNuevo || dias === 1) return 'streak_start';
  const hito = MILESTONES.find((m) => m.dias === dias);
  return hito ? hito.id : 'streak_increment';
}

/** ¿Sube de verdad la identidad sonora con los días? */
export function progresionCoherente() {
  for (let i = 1; i < MILESTONES.length; i++) {
    if (MILESTONES[i].nivel < MILESTONES[i - 1].nivel) return false;
  }
  // Y de punta a punta tiene que haber subido: si todos fueran nivel 3, el de
  // 365 días sonaría igual que el de 7, que es justo lo que se prohíbe.
  return MILESTONES[MILESTONES.length - 1].nivel > MILESTONES[0].nivel;
}

/* ===========================================================================
   5 · RESUMEN
   =========================================================================== */
export function resumenCatalogo() {
  const total = Object.keys(CATALOGO).length;
  const sin = sinEmisor();
  return {
    total,
    conectados: total - sin.length,
    sinEmisor: sin,
    porNivel: NIVELES.map((n) => ({
      ...n,
      cuantos: Object.values(CATALOGO).filter((d) => d.nivel === n.n).length,
    })),
    milestones: MILESTONES.length,
    progresionCoherente: progresionCoherente(),
  };
}
