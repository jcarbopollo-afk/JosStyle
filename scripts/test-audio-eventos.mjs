// ============================================================================
// SO · Fase 3/5 — Pruebas del catálogo y la jerarquía
//
// Las tres cosas que la especificación pide y que se pueden romper en silencio:
//   1. **No suenan cinco sonidos a la vez**: se elige el dominante.
//   2. **El récord es INDEPENDIENTE del milestone.**
//   3. **La progresión de la racha SUBE de verdad**: el de 365 no puede sonar
//      igual que el de 7.
//
// Y una de honestidad: **los eventos que hoy no emite nadie están declarados
// con su motivo**, en vez de quedarse como huecos fantasma.
// ============================================================================

import {
  NIVELES, nivelDe, CATALOGO, definicion, sinEmisor, conectados,
  dominante, resolverSimultaneos, MILESTONES, eventoDeRacha,
  progresionCoherente, resumenCatalogo,
} from '../src/lib/audioEventos.js';
import { EVENTOS_SONIDO, eventoCanonico } from '../src/lib/audio.js';

let fallos = 0;
function comprobar(nombre, condicion, detalle = '') {
  if (condicion) { console.log(`  ✓ ${nombre}`); return; }
  fallos++;
  console.log(`  ✗ ${nombre}${detalle ? ` — ${detalle}` : ''}`);
}

/* ===========================================================================
   EL CATÁLOGO
   =========================================================================== */
console.log('\n═══ El catálogo completo ═══\n');
{
  comprobar('Existe la escala de 0 a 5', NIVELES.length === 6 && NIVELES[5].n === 5);
  comprobar('Un nivel inventado no revienta', nivelDe(99).n === 0);

  // La especificación lista exactamente 42: 5 de interfaz, 4 de confirmación,
  // 4 de tarea/objetivo, 3 de XP, 5 de nivel/recompensa/insignia, 2 de racha,
  // 10 milestones, 4 de estado de racha, 2 de logro y 3 de sistema.
  comprobar('Está el catálogo entero que pide la especificación (42)', Object.keys(CATALOGO).length === 42);
  comprobar('Están los de interfaz', !!definicion('ui_click') && !!definicion('ui_toggle_on'));
  comprobar('Los de confirmación', !!definicion('success') && !!definicion('save'));
  comprobar('Los diez milestones de racha', MILESTONES.length === 10);
  comprobar('Y los de sistema', !!definicion('sync_complete') && !!definicion('connection_lost'));

  comprobar('⚠️ CLAVE · Cada evento conectado apunta a uno que EXISTE en el motor de SO F1',
    conectados().every((c) => !!EVENTOS_SONIDO[c.motor]));
  comprobar('⚠️ CLAVE · No se ha creado un segundo catálogo: se traduce al de F1',
    conectados().length > 20);

  const sin = sinEmisor();
  comprobar('⚠️ CLAVE · Los eventos que hoy NO emite nadie están declarados', sin.length > 0);
  comprobar('⚠️ CLAVE · ...cada uno CON SU MOTIVO, en vez de ser un hueco fantasma',
    sin.every((s) => s.motivo.length > 10));
  comprobar('CLAVE · XP y niveles están, y se dice que RA F3 no los construyó (D2-02)',
    sin.filter((s) => /xp|level/.test(s.id)).every((s) => /D2-02|RA F3/.test(s.motivo)));
  comprobar('CLAVE · Y el congelar racha, que no existe en RA F1',
    sin.some((s) => s.id === 'streak_freeze_used'));

  comprobar('Un evento inventado no existe', definicion('zzz') === null);
}

/* ===========================================================================
   EL EVENTO DOMINANTE
   =========================================================================== */
console.log('\n═══ El evento dominante ═══\n');
{
  // ⚠️ El ejemplo LITERAL de la especificación: completar tarea → +XP →
  // subir de nivel → milestone → récord. Debe ganar PERSONAL_RECORD.
  const elCaso = ['task_complete', 'xp_medium', 'level_up', 'streak_milestone_30', 'personal_record'];
  comprobar('⚠️ CRITERIO · El ejemplo de la especificación: gana PERSONAL_RECORD',
    dominante(elCaso) === 'personal_record');

  comprobar('CRITERIO · Un clic de interfaz pierde contra una confirmación',
    dominante(['ui_click', 'save']) === 'save');
  comprobar('CRITERIO · Una confirmación pierde contra una racha',
    dominante(['save', 'streak_increment']) === 'streak_increment');
  comprobar('CRITERIO · Una racha pierde contra un logro',
    dominante(['streak_increment', 'achievement_unlocked']) === 'achievement_unlocked');
  comprobar('CRITERIO · Y un logro pierde contra un gran logro',
    dominante(['achievement_unlocked', 'grand_achievement']) === 'grand_achievement');

  comprobar('⚠️ CLAVE · A IGUAL nivel, gana el más específico: 365 días pesa más que 100',
    dominante(['streak_milestone_100', 'streak_milestone_365']) === 'streak_milestone_365');

  comprobar('Uno solo se devuelve tal cual', dominante(['ui_click']) === 'ui_click');
  comprobar('Sin nada, null', dominante([]) === null);
  comprobar('Con basura, null', dominante(['zzz', 'nada']) === null);
  comprobar('Acepta objetos además de cadenas', dominante([{ id: 'save' }, { tipo: 'ui_click' }]) === 'save');

  const r = resolverSimultaneos(elCaso);
  comprobar('⚠️ CRITERIO · SUENA UNO SOLO', typeof r.sonar === 'string');
  comprobar('CLAVE · ...y apunta a un evento del motor', !!EVENTOS_SONIDO[r.motor]);
  comprobar('⚠️ CLAVE · Los demás NO se pierden: se devuelven para que la pantalla los enseñe',
    r.silenciados.length === 4);
  comprobar('CLAVE · La especificación lo dice: el audio jerarquiza, la interfaz enseña todo',
    r.silenciados.includes('level_up') && r.silenciados.includes('task_complete'));

  const sinSonido = resolverSimultaneos(['xp_small']);
  comprobar('⚠️ CLAVE · Un evento sin emisor se marca, no se traga en silencio',
    sinSonido.sinSonido === true && sinSonido.motor === null);
  comprobar('Sin nada devuelve la forma entera', resolverSimultaneos([]).sonar === null);
}

/* ===========================================================================
   LA PROGRESIÓN DE LA RACHA
   =========================================================================== */
console.log('\n═══ La progresión de la racha ═══\n');
{
  comprobar('⚠️ CRITERIO · La identidad sonora SUBE de verdad con los días', progresionCoherente() === true);
  comprobar('⚠️ CLAVE · El de 365 NO suena igual que el de 7',
    definicion('streak_milestone_365').nivel > definicion('streak_milestone_07').nivel);
  comprobar('CLAVE · Y ningún milestone baja de nivel respecto al anterior',
    MILESTONES.every((m, i) => i === 0 || m.nivel >= MILESTONES[i - 1].nivel));
  comprobar('Los milestones están ordenados por días',
    MILESTONES[0].dias === 3 && MILESTONES[MILESTONES.length - 1].dias === 365);

  comprobar('CRITERIO · El día 1 es "empezar"', eventoDeRacha(1) === 'streak_start');
  comprobar('CRITERIO · Los días normales son "seguir"', eventoDeRacha(5) === 'streak_increment');
  comprobar('CRITERIO · El día 7 es su milestone', eventoDeRacha(7) === 'streak_milestone_07');
  comprobar('CRITERIO · Y el 365 el suyo', eventoDeRacha(365) === 'streak_milestone_365');
  comprobar('Un día que no es hito no inventa uno', eventoDeRacha(8) === 'streak_increment');

  // ⚠️ La distinción que la especificación pide expresamente.
  comprobar('⚠️ CRITERIO · El RÉCORD es independiente del milestone y GANA',
    eventoDeRacha(30, { esRecord: true }) === 'personal_record');
  comprobar('CLAVE · ...también en un día que no es hito', eventoDeRacha(8, { esRecord: true }) === 'personal_record');
  comprobar('CLAVE · Y "empezar" gana a "seguir" cuando la racha es nueva',
    eventoDeRacha(1, { esNuevo: true }) === 'streak_start');
}

/* ===========================================================================
   RESUMEN
   =========================================================================== */
console.log('\n═══ Resumen ═══\n');
{
  const r = resumenCatalogo();
  comprobar('El resumen cuenta el catálogo', r.total === 42 && r.conectados > 20);
  comprobar('...y qué falta por conectar, con motivo', r.sinEmisor.length > 0);
  comprobar('...y el reparto por nivel', r.porNivel.length === 6 && r.porNivel.every((n) => n.cuantos >= 0));
  comprobar('Y confirma que la progresión es coherente', r.progresionCoherente === true);
  comprobar('⚠️ CLAVE · Sin puntos ni niveles de verdad: los eventos existen, el sistema no',
    r.sinEmisor.some((s) => s.id === 'level_up'));
}

console.log('\n  ⚠️ Sin comprobar aquí, y sigue siendo lo mismo desde SO F1: HOY NO SUENA');
console.log('     NADA, porque no hay ni un archivo de audio en el proyecto. Josué los dará');
console.log('     "cuando la web ya tenga todos los botones activos". SO F2 es justo la fase');
console.log('     que los necesita, y sigue esperando.\n');

if (fallos) { console.log(`  ${fallos} fallo(s).\n`); process.exit(1); }
console.log('  Todo correcto.\n');
