/* ═══════════════════════════════════════════════════════════════════════════
   FITNESS 4/8 — LA MIGRACIÓN M1 (versión 1 → 2) (ARQUITECTURA_TECNICA.md §14)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 Solo código y pruebas: **no se ha ejecutado contra ningún dato real**. Corre
   cuando la aplicación carga un Fitness de la versión 1, sobre lo crudo y antes de
   la puerta de carga (`migrarFitness`, FIT F41), y su resultado llega a la cuenta
   después de guardar la copia de seguridad (`App.jsx`, §14.5).

   Principios (§14.1): **aditiva** (no borra ni renombra nada), **idempotente**
   (cada paso comprueba si el campo ya existe), **validada** antes de usarse (si
   algo no cuadra lanza, y `migrarFitness` devuelve lo de antes tal cual) y sin
   asociar datos ambiguos: **no toca ninguna sesión**.

   Lo que hace (§14.3):
   1. Añade, si faltan, `rutinas: []` y `predeterminadasRetiradas`.
   2. `planActivo`: su `inicioCiclo` con la regla de siempre (§7.6): lunes de su
      `desde` si es una semana de siete días predeterminada; `desde` si no.
   3. Cada tramo de `planesAnteriores`: igual, y a cada día de entreno de un tramo
      predeterminado le pone su `plantillaId` (`<día>-plantilla`); a los de una
      plantilla usada como plan, esa plantilla.
   4. `cumplimientoDesde` = la fecha de la migración (PD-09: lo de antes no se
      pinta en rojo ni en pendiente; es reversible: basta con cambiar la fecha).
   5. Nada más: ni sesiones, ni plantillas, ni objetivos, ni clasificaciones, ni
      rangos, ni favoritos, ni cuarentena, ni planes.

   ⚠️ `preferencias.progresion` (§14.3, punto 1) **no se añade aquí**: es de la
   Fase 5 (PD-13 sin resolver) y una clave de primer nivel que falta no se pierde.
   ═══════════════════════════════════════════════════════════════════════════ */

import { todayISO, fechaValida, addDays } from './helpers';
import { diaDeFecha } from './horario';
import { idPlantillaDeDia, idDiaDePlantilla, CATALOGO_PLANES } from './planes';
import { planificadoEnFecha, planActivoCompleto } from './tuPlan';
import { planesAnterioresDe, planActivoDe } from './planes';

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : null);

const lunesDe = (fecha) => {
  const d = diaDeFecha(fecha);
  return d ? addDays(fecha, -(d - 1)) : '';
};

/** El día 1 del ciclo de una activación o de un tramo, con la MISMA regla con la
 *  que hoy se lee (§7.6), para que ningún día cambie: la activa de una rutina suya
 *  cuenta desde que se activó (`planActivoCompleto`); cualquier otra de siete días
 *  es la semana, con el lunes como día 1 (`posicionDelDia`); el resto, desde que
 *  se activó. La validación del final lo comprueba fecha a fecha. */
function inicioCicloDe(a, numDias, { activa = false } = {}) {
  if (fechaValida(texto(a.inicioCiclo))) return texto(a.inicioCiclo);
  if (!fechaValida(texto(a.desde))) return '';
  if (activa && a.origen === 'rutina') return texto(a.desde);
  return numDias === 7 ? lunesDe(a.desde) : texto(a.desde);
}

/** Lo que cuenta la validación: si algo de esto cambia, la migración no se aplica. */
export function huellaDeFitness(f) {
  const g = objeto(f) || {};
  const sesiones = lista(g.sesiones).filter(objeto);
  const series = sesiones.flatMap((s) => lista(objeto(s.origen)?.ejercicios).flatMap((e) => lista(objeto(e)?.series)));
  const suma = (k) => series.reduce((n, x) => n + (Number(objeto(x)?.hecho?.[k]) || 0), 0);
  return {
    sesiones: sesiones.length,
    series: series.length,
    hechas: series.filter((x) => objeto(x)?.estado === 'hecha').length,
    reps: suma('reps'),
    peso: Math.round(suma('peso') * 1000) / 1000,
    plantillas: lista(g.plantillas).length,
    objetivos: lista(g.objetivos).length,
    clasificaciones: lista(g.clasificaciones).length,
    cuarentena: lista(g.cuarentena).length,
    ejercicios: lista(g.ejercicios).length,
    tramos: lista(g.planesAnteriores).map((t) => `${texto(objeto(t)?.planId)}|${texto(objeto(t)?.desde)}|${texto(objeto(t)?.hasta)}|${lista(objeto(t)?.dias).map((d) => texto(objeto(d)?.id)).join(',')}`).join(';'),
  };
}

/** El día del ciclo de cada fecha de los últimos 365 días (§14.4, último punto). */
function diasDelCiclo(f, hoy, planes) {
  const resuelto = planActivoCompleto(f, planes);
  const activo = planActivoDe(f);
  const ctx = {
    plan: resuelto && !resuelto.perdido ? resuelto.plan : null,
    desde: activo ? texto(activo.desde) : '',
    planId: activo ? activo.planId : '',
    origen: resuelto ? resuelto.origen : '',
    anteriores: planesAnterioresDe(f),
    hoy,
  };
  const out = [];
  for (let i = 0; i <= 365; i += 1) {
    const fecha = addDays(hoy, -i);
    const p = planificadoEnFecha(fecha, ctx);
    out.push(p ? `${p.planId}|${p.diaId}|${p.descanso ? 'd' : 'e'}` : '-');
  }
  return out.join(';');
}

/** Compara antes y después (§14.4). Devuelve la lista de diferencias. */
export function validarMigracionV2(antes, despues, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const errores = [];
  const ha = huellaDeFitness(antes);
  const hd = huellaDeFitness(despues);
  Object.keys(ha).forEach((k) => { if (ha[k] !== hd[k]) errores.push(`${k}: ${ha[k]} → ${hd[k]}`); });
  if (JSON.stringify(lista(objeto(antes)?.sesiones)) !== JSON.stringify(lista(objeto(despues)?.sesiones))) errores.push('las sesiones han cambiado');
  if (diasDelCiclo(antes, hoy, planes) !== diasDelCiclo(despues, hoy, planes)) errores.push('el día del ciclo de alguna fecha de los últimos 365 días ha cambiado');
  return errores;
}

/**
 * La migración, pura. Recibe una COPIA de lo guardado (`migrarFitness` la hace) y
 * devuelve la forma nueva; si la validación encuentra una diferencia, **lanza**, y
 * `migrarFitness` devuelve lo de antes tal cual con el motivo.
 */
export function migrarV1aV2(crudo, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = objeto(crudo) || {};
  const out = { ...f };
  if (!Array.isArray(out.rutinas)) out.rutinas = [];
  if (!objeto(out.predeterminadasRetiradas)) out.predeterminadasRetiradas = { rutinas: [], plantillas: [] };

  const a = objeto(out.planActivo);
  if (a && texto(a.planId) && !fechaValida(texto(a.inicioCiclo))) {
    const resuelto = planActivoCompleto(f, planes);
    const n = resuelto && resuelto.plan ? lista(resuelto.plan.dias).length : 0;
    const inicio = n ? inicioCicloDe(a, n, { activa: true }) : '';
    if (inicio) out.planActivo = { ...a, inicioCiclo: inicio };
  }

  out.planesAnteriores = lista(out.planesAnteriores).map((t) => {
    const tramo = objeto(t);
    if (!tramo) return t;
    const dias = lista(tramo.dias).map((d) => {
      const dia = objeto(d);
      if (!dia || dia.descanso || texto(dia.plantillaId)) return d;
      if (tramo.origen === 'plantilla') return { ...dia, plantillaId: texto(tramo.planId) || null };
      if (tramo.origen === 'preset' && texto(dia.id)) return { ...dia, plantillaId: idPlantillaDeDia(dia.id) };
      return d;
    });
    const inicio = inicioCicloDe(tramo, dias.length);
    return { ...tramo, dias, ...(inicio && !fechaValida(texto(tramo.inicioCiclo)) ? { inicioCiclo: inicio } : {}) };
  });

  if (!fechaValida(texto(out.cumplimientoDesde))) out.cumplimientoDesde = hoy;

  const errores = validarMigracionV2(f, out, { hoy, planes });
  if (errores.length) throw new Error(`no cuadra después de migrar (${errores.join('; ')})`);
  return out;
}

/** La línea de `MIGRACIONES_FITNESS`. `hoy` se lee al migrar: es la fecha de la migración. */
export const MIGRACION_V1_A_V2 = Object.freeze({
  de: 1,
  a: 2,
  que: 'Fitness 4/8: rutinas y retiradas si faltan, el día 1 del ciclo explícito, la plantilla de cada día de los tramos y la fecha desde la que se evalúa el cumplimiento. No toca ninguna sesión.',
  migrar: (copia) => migrarV1aV2(copia, { hoy: todayISO() }),
});

/** La clave de `app_data` de la copia de seguridad previa (§14.5): misma tabla,
 *  mismas políticas, sin SQL nuevo. Se escribe solo si no existe. */
export const CLAVE_RESPALDO_V1 = 'fitness_respaldo_v1';

/** El id del día de una plantilla como plan (por si una prueba lo necesita). */
export { idDiaDePlantilla };
