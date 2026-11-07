/* ═══════════════════════════════════════════════════════════════════════════
   FITNESS 5/8 — LA MIGRACIÓN M2 (versión 2 → 3)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 Solo código y pruebas: **no se ha ejecutado contra ningún dato real**.

   Por qué hay una versión 3 aunque casi no cambie nada (ARQUITECTURA §11.4,
   H-09): las repeticiones pasan a admitir medias (8,5). Una aplicación de la
   Fase 4 (versión 2) las redondearía al guardar (su normalizador hacía
   `Math.round`). Con el número subido, esa aplicación encuentra una 3 y **no
   guarda** (guardia de versión, AT-08): lo guardado no se estropea.

   Lo que hace, aditivo e idempotente:
   1. `preferencias.progresion = 'manual'` si falta (el modo de siempre: nada
      cambia para él hasta que elija otro).
   2. Nada más: ni una sesión, ni una serie, ni una plantilla. Los enteros que
      hay guardados ya valen como repeticiones (no hay que convertir nada).

   Valida con la huella de la M1 y lanza si algo cambia: `migrarFitness`
   devuelve entonces lo de antes tal cual.
   ═══════════════════════════════════════════════════════════════════════════ */

import { huellaDeFitness } from './migracionFitnessV2';

const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);

export function migrarV2aV3(crudo) {
  const f = objeto(crudo) || {};
  const pref = objeto(f.preferencias) || {};
  const out = { ...f, preferencias: { ...pref, progresion: typeof pref.progresion === 'string' && pref.progresion ? pref.progresion : 'manual' } };
  const a = huellaDeFitness(f);
  const d = huellaDeFitness(out);
  const distintos = Object.keys(a).filter((k) => a[k] !== d[k]);
  if (distintos.length) throw new Error(`no cuadra después de migrar (${distintos.join(', ')})`);
  if (JSON.stringify(f.sesiones || []) !== JSON.stringify(out.sesiones || [])) throw new Error('las sesiones han cambiado');
  return out;
}

export const MIGRACION_V2_A_V3 = Object.freeze({
  de: 2,
  a: 3,
  que: 'Fitness 5/8: el modo de progresión (Manual si falta). Sube la versión para que una aplicación de la Fase 4 no redondee las medias repeticiones al guardar. No toca ninguna sesión.',
  migrar: (copia) => migrarV2aV3(copia),
});
