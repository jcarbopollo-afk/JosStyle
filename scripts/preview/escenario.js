/* ═══════════════════════════════════════════════════════════════════════════
   PREVIEW DE FITNESS — el escenario de prueba (solo para la preview local)
   ═══════════════════════════════════════════════════════════════════════════
   Datos de ejemplo para revisar el rediseño sin una cuenta real. Se construyen
   con las MISMAS funciones que usan las pantallas (rutinas cíclicas, sesiones,
   recuperación), con las fechas contadas desde hoy, y se guardan solo en el
   navegador de quien abre la preview (ver `supabaseSimulado.js`). Nada de esto
   entra en el build de producción: solo lo importa `vite.preview.config.mjs`.

   La rutina «Rutina de prueba» (Push · Pull · Descanso) empezó hace 9 días:
   hace 9 Push ✓ · hace 8 Pull ✓ · hace 7 descanso respetado · hace 6 Push parcial ·
   hace 5 Pull sin hacer, recuperado hace 4 (que era descanso: sacrificado) ·
   hace 3 Push ✓ · hace 2 Pull sin hacer (pendiente) · hace 1 descanso · hoy Push.
   Y dos sesiones de antes del seguimiento con una plantilla «Torso (prueba)» que
   ya no existe, con el mismo press de banca: para la evolución por plantilla. */

import {
  crearRutinaCiclica, configurarDia, guardarRutinaCiclica, activarRutina, plantillaDisponible,
} from '../../src/lib/rutinasCiclicas';
import { idPlantillaDeDia } from '../../src/lib/planes';
import { planActivoCompleto } from '../../src/lib/tuPlan';
import { planARutina } from '../../src/lib/constructor';
import { normalizarFitnessConSesiones, empezarSesion, guardarSesion } from '../../src/lib/entrenamiento';
import { prepararSesionNueva, sesionParaRecuperar, opcionesDeRecuperacion } from '../../src/lib/cumplimientoFitness';

const dia = (hoy, n) => { const d = new Date(`${hoy}T12:00:00`); d.setDate(d.getDate() - n); return d.toLocaleDateString('sv-SE'); };
const PUSH = idPlantillaDeDia('ppl-estetico-dia-1');
const PULL = idPlantillaDeDia('ppl-estetico-dia-2');

let reloj = Date.now() - 20 * 86400000;
function terminar(s, { parcial = false, reps = 8, peso = 40, nota = '' } = {}) {
  reloj += 3_600_000;
  let n = 0;
  const ejercicios = s.origen.ejercicios.map((e, i) => ({
    ...e,
    notas: i === 0 && nota ? nota : e.notas,
    series: e.series.map((x) => {
      n += 1;
      const hecha = !parcial || n <= 2;
      return hecha ? { ...x, estado: 'hecha', hecho: { reps, duracion: null, peso } } : x;
    }),
  }));
  return { ...s, origen: { ...s.origen, ejercicios }, estado: 'completada', iniciadaEn: reloj - 3_000_000, terminadaEn: reloj, guardadaEn: reloj };
}

function entrenar(f, fecha, plantillaId, opciones = {}) {
  const pl = plantillaDisponible(f, plantillaId);
  const rutina = planARutina(pl);
  const resuelto = planActivoCompleto(f);
  const delPlan = resuelto && resuelto.plan ? resuelto.plan.dias.find((d) => d.plantillaId === pl.id) : null;
  const s = empezarSesion({
    nombre: pl.nombre, lineas: rutina.lineas, ahora: reloj, hoy: fecha,
    planId: delPlan ? resuelto.activo.planId : pl.id, origenTipo: delPlan ? resuelto.origen : 'plantilla', origenId: delPlan ? delPlan.id : pl.id,
  });
  const r = prepararSesionNueva(f, s, { hoy: fecha });
  return r.ok ? guardarSesion(f, terminar(r.sesion, opciones)) : f;
}

function recuperar(f, fechaPerdida, hoyDeRecuperar) {
  const p = opcionesDeRecuperacion(f, { hoy: hoyDeRecuperar }).recuperables.find((x) => x.fecha === fechaPerdida);
  if (!p) return f;
  const s = sesionParaRecuperar(f, p, { hoy: hoyDeRecuperar, ahora: reloj });
  const r = s ? prepararSesionNueva(f, s, { hoy: hoyDeRecuperar, recuperar: p }) : null;
  return r && r.ok ? guardarSesion(f, terminar(r.sesion)) : f;
}

/** Una sesión libre de una plantilla que ya no existe (la evolución por plantilla). */
function libreAntigua(f, fecha, reps) {
  const lineas = planARutina(plantillaDisponible(f, PUSH)).lineas;
  const s = empezarSesion({ nombre: 'Torso (prueba)', lineas, ahora: reloj, hoy: fecha, planId: 'preview-torso', origenTipo: 'plantilla', origenId: 'preview-torso' });
  return guardarSesion(f, { ...terminar(s, { reps, peso: 35 }), fecha });
}

export function escenarioDeFitness(hoy) {
  let r = crearRutinaCiclica({ nombre: 'Rutina de prueba', duracion: 3 });
  r = configurarDia(r, r.dias[0].id, { tipo: 'entreno', plantillaId: PUSH });
  r = configurarDia(r, r.dias[1].id, { tipo: 'entreno', plantillaId: PULL });
  r = configurarDia(r, r.dias[2].id, { tipo: 'descanso' });
  let f = normalizarFitnessConSesiones({});
  f = libreAntigua(f, dia(hoy, 14), 10);
  f = libreAntigua(f, dia(hoy, 12), 11);
  const g = guardarRutinaCiclica(f, r, { hoy: dia(hoy, 9) });
  if (!g.ok) return f;
  const a = activarRutina(g.fitness, g.rutina.id, { hoy: dia(hoy, 9), confirmado: true });
  if (!a.ok) return g.fitness;
  f = { ...a.fitness, cumplimientoDesde: dia(hoy, 9), version: 3, preferencias: { progresion: 'progresivo' } };
  f = entrenar(f, dia(hoy, 9), PUSH, { reps: 8, nota: 'Codos cerrados, buena técnica' });
  f = entrenar(f, dia(hoy, 8), PULL, { reps: 10 });
  f = entrenar(f, dia(hoy, 6), PUSH, { parcial: true, reps: 9 });
  f = recuperar(f, dia(hoy, 5), dia(hoy, 4));
  f = entrenar(f, dia(hoy, 3), PUSH, { reps: 9, nota: 'Subir peso la próxima' });
  return normalizarFitnessConSesiones(f);
}

/** Dos rachas: la de entrenamiento (la lleva Fitness) y una de sueño, a mano. */
export function escenarioDeRachas(hoy) {
  const ahora = new Date().toISOString();
  return {
    definiciones: [
      { id: 'preview-entreno', tipo: 'training', nombre: 'Entrenar', icono: 'entreno', regla: { clase: 'diaria' }, creadaEn: dia(hoy, 30), activa: true },
      { id: 'preview-sueno', tipo: 'sleep', nombre: 'Dormir 8 horas', icono: 'sueno', regla: { clase: 'diaria' }, creadaEn: dia(hoy, 30), activa: true },
    ],
    eventos: [1, 2, 3, 4].map((n) => ({ id: `preview-s${n}`, rachaId: 'preview-sueno', fecha: dia(hoy, n), valor: 1, registradoEn: ahora, origen: 'manual', origenId: null })),
    pendientes: [],
  };
}
