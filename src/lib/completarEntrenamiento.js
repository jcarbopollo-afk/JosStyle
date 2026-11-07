/* ═══════════════════════════════════════════════════════════════════════════
   FITNESS 4/8 — «COMPLETAR ENTRENAMIENTO» (D-03)
   ═══════════════════════════════════════════════════════════════════════════

   Para un entrenamiento que hizo y no registró en directo. Rehecho sobre el
   modelo de la Fase 2 (la PR #2 no se fusiona: su idea se conserva, su código no
   se trae).

   🚨 Lo que dice D-03, punto por punto:
   - **Simula todas las series hechas**: la sesión lleva la fotografía de la
     plantilla (F7) y TODAS sus series en `estado: 'hecha'`.
   - **Completa, nunca parcial**: `completadaCon: 'completar'` hace que el grado
     sea `completa` (`gradoDeSesion`).
   - **Cuenta como realizado** a efectos de disciplina y de caducidad.
   - **No inventa nada**: `hecho` de cada serie se queda VACÍO (ni pesos, ni
     repeticiones, ni tiempos), y la sesión no tiene duración (no se sabe cuánto
     duró). La progresión no la puede comparar con nada (`hecho` vacío).
   - **Identificada**: `completadaCon: 'completar'`.
   - **Una por fecha**: pasa por `prepararSesionNueva`, la misma comprobación que
     «Empezar».

   🔓 PD-02 (provisional): se puede completar **hoy o un día pasado** —lo que
   hacía la PR #2— y la sesión cuenta **en esa fecha** (la fecha real que él
   declara, prompt 4 §9). Nunca un día futuro. Con `recuperar` (desde la tarjeta
   de recuperación, solo hoy) es una recuperación.
   ═══════════════════════════════════════════════════════════════════════════ */

import { todayISO, fechaValida, addDays } from './helpers';
import { CATALOGO_PLANES, diaARutina } from './planes';
import { planActivoCompleto } from './tuPlan';
import { planARutina } from './constructor';
import { empezarSesion } from './entrenamiento';
import { diaYMes } from './fechasFitness';
import { prepararSesionNueva, sesionParaRecuperar } from './cumplimientoFitness';

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

export const TEXTOS_COMPLETAR = Object.freeze({
  boton: 'Completar entrenamiento',
  titulo: 'Completar entrenamiento',
  subtitulo: 'Para un entrenamiento que ya has hecho y no registraste en directo.',
  elegir: '¿Qué entrenamiento hiciste?',
  fecha: '¿Qué día?',
  confirmar: 'Completar entrenamiento',
  cancelar: 'Cancelar',
  sinDetalles: 'Se guarda completo, con todas sus series hechas, pero sin pesos, repeticiones ni tiempos: no se inventa nada que no hayas apuntado.',
  vacioTitulo: 'No tienes entrenamientos para elegir',
  vacioTexto: 'Activa una rutina o crea una plantilla, y podrás completar sus entrenamientos.',
  guardado: 'Entrenamiento registrado',
  marca: 'Completado con «Completar entrenamiento»',
});

/** «hoy», «ayer» o «el 19 de octubre». */
export function etiquetaDelDia(fecha, hoy = todayISO()) {
  if (!fechaValida(fecha)) return '';
  if (fecha === hoy) return 'hoy';
  return fecha === addDays(hoy, -1) ? 'ayer' : `el ${diaYMes(fecha)}`;
}

/**
 * Lo que se puede completar: los días de entreno de la rutina activa y sus
 * plantillas propias. Son los mismos que se pueden EMPEZAR (FitnessView), con los
 * mismos ids, así que la clasificación (prevista, libre) es la misma.
 */
export function opcionesParaCompletar(fitness, { propios = null, planes = CATALOGO_PLANES } = {}) {
  const f = objeto(fitness);
  const mios = propios || lista(f.ejercicios);
  const out = [];
  const resuelto = planActivoCompleto(f, planes);
  if (resuelto && resuelto.plan && !resuelto.perdido && resuelto.origen !== 'plantilla') {
    lista(resuelto.plan.dias).forEach((d, indice) => {
      if (!d || d.descanso || d.sinPlantilla || !texto(d.id)) return;
      const rutina = diaARutina(resuelto.plan, indice, mios);
      if (!rutina || !lista(rutina.lineas).length) return;
      out.push({
        clave: `dia|${resuelto.activo.planId}|${d.id}`,
        nombre: texto(d.nombre) || 'Entrenamiento',
        detalle: `${texto(resuelto.plan.nombre) || 'Tu rutina'} · Día ${indice + 1}`,
        planId: resuelto.activo.planId,
        origenTipo: resuelto.origen,
        origenId: d.id,
        lineas: rutina.lineas,
        entorno: texto(resuelto.plan.entorno),
      });
    });
  }
  lista(f.plantillas).forEach((p) => {
    if (!p || !texto(p.id)) return;
    const rutina = planARutina(p);
    if (!rutina || !lista(rutina.lineas).length) return;
    out.push({
      clave: `plantilla|${p.id}`,
      nombre: texto(p.nombre) || 'Entrenamiento',
      detalle: 'Tu plantilla',
      planId: p.id,
      origenTipo: 'plantilla',
      origenId: p.id,
      lineas: rutina.lineas,
      entorno: texto(p.entorno),
    });
  });
  return out;
}

/** Todas las series hechas, sin un solo valor: la «simulación» de D-03. */
function conTodasHechas(sesion) {
  const ejercicios = lista(objeto(sesion.origen).ejercicios).map((e) => ({
    ...e,
    series: lista(e.series).map((s) => ({ ...s, estado: 'hecha', hecho: { reps: null, duracion: null, peso: null } })),
  }));
  return { ...sesion, origen: { ...sesion.origen, ejercicios } };
}

/**
 * Comprueba y construye. Devuelve `{ ok, motivo, mensaje, aviso, sesion }`; sin
 * `ok` no hay nada que guardar (`aviso` trae lo que hay ese día si estaba ocupado).
 */
export function completarEntrenamiento(fitness, {
  opcion = null, recuperar = null, fecha = '', hoy = todayISO(), ahora = Date.now(),
  propios = null, planes = CATALOGO_PLANES, pesoCorporal = null,
} = {}) {
  const f = objeto(fitness);
  const dia = recuperar ? hoy : texto(fecha) || hoy;
  if (!fechaValida(dia)) return { ok: false, motivo: 'fecha_invalida', mensaje: 'Elige un día que exista.', aviso: null, sesion: null };
  if (dia > hoy) return { ok: false, motivo: 'fecha_futura', mensaje: 'Ese día todavía no ha llegado: solo puedes completar entrenamientos de hoy o de días pasados.', aviso: null, sesion: null };
  let base = null;
  if (recuperar) {
    base = sesionParaRecuperar(f, recuperar, { hoy, ahora, propios, planes, pesoCorporal });
    if (!base) return { ok: false, motivo: 'no_recuperable', mensaje: 'Ese entrenamiento ya no se puede recuperar.', aviso: null, sesion: null };
  } else {
    if (!opcion || !lista(opcion.lineas).length) return { ok: false, motivo: 'sin_entrenamiento', mensaje: 'Elige qué entrenamiento hiciste.', aviso: null, sesion: null };
    base = empezarSesion({
      nombre: opcion.nombre, lineas: opcion.lineas, planId: opcion.planId, origenTipo: opcion.origenTipo,
      origenId: opcion.origenId, ahora, hoy: dia, propios: propios || lista(f.ejercicios), entorno: opcion.entorno, pesoCorporal,
    });
  }
  const r = prepararSesionNueva(f, base, { hoy, planes, recuperar, completadaCon: 'completar' });
  if (!r.ok) {
    const mensaje = r.aviso ? r.aviso.texto
      : r.motivo === 'no_recuperable' ? 'Ese entrenamiento ya no se puede recuperar.' : 'No se puede registrar.';
    return { ok: false, motivo: r.motivo, mensaje, aviso: r.aviso, sesion: null };
  }
  /* Sin duración: no se sabe cuánto duró, y un reloj inventado sería un dato falso. */
  const sesion = {
    ...conTodasHechas(r.sesion),
    estado: 'completada', iniciadaEn: null, terminadaEn: null, pausadaEn: null, pausadoMs: 0, guardadaEn: ahora,
  };
  return { ok: true, motivo: null, mensaje: null, aviso: null, sesion };
}
