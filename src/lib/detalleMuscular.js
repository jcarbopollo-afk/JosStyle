/* ===========================================================================
   ENTREGA 4 · FASE 18/45 — EL DETALLE DE UN GRUPO MUSCULAR (lo que decide)

   *"El usuario debe poder entender de dónde procede su rango muscular."*

   La pantalla contesta dos cosas: **qué nivel tengo en este grupo** y **de
   dónde sale**. Y las dos salen de lo que ya existe:

   - el rango del grupo y de cada subgrupo → `rangos.js` (F15),
   - la tendencia y la última marca de cada ejercicio → `progresion.js` (F11)
     a través de las señales de `progresoMuscular.js` (F13),
   - qué ejercicios tocan un músculo y cuánto → **el catálogo** (F2), nunca una
     lista escrita a mano (apartado 8: *"esto es obligatorio para evitar
     inconsistencias"*).

   🚨 **Aquí no se calcula ni un rango ni una tendencia** (apartados 9 y 24).
   Este archivo junta, ordena y cuenta.

   ⚠️ **Y no se inventa ausencia de datos como mal rendimiento** (apartado 14):
   un subgrupo sin entrenar dice «Sin datos», no «Novato» ni «0 %».
   =========================================================================== */

import { GRUPOS_MUSCULARES, subgrupoMuscular } from './fitness.js';
import { todayISO } from './helpers.js';
import { ejercicioPorId, todosLosEjercicios } from './ejercicios.js';
import { senalesDeEjercicios, ejerciciosDeMusculo, repartoMuscular } from './progresoMuscular.js';
import { progresoHaciaSiguiente, rangoDeGrupo, rangoDeSubgrupo, rangosDeEjercicios } from './rangos.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

export const grupoMuscular = (id) => GRUPOS_MUSCULARES.find((g) => g.id === texto(id)) || null;

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LOS EJERCICIOS QUE TOCAN UN MÚSCULO (apartados 6, 7, 8 y 21)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Cuánto implica un ejercicio a un grupo o subgrupo, **según el catálogo**. */
export function implicacionEn(ejercicio, { grupoId = null, subgrupoId = null } = {}) {
  return repartoMuscular(ejercicio)
    .filter((x) => (subgrupoId ? x.subgrupoId === subgrupoId : x.grupoId === grupoId))
    .reduce((n, x) => n + x.peso, 0);
}

/* Apartado 7 — *"un ejercicio puede contribuir a varios músculos"*, así que no
   se dice «las dominadas SON de dorsales»: se dice cuánto ponen ahí. */
export function textoContribucion(ejercicio, { grupoId = null, subgrupoId = null } = {}) {
  const peso = implicacionEn(ejercicio, { grupoId, subgrupoId });
  if (!(peso > 0)) return '';
  const nombre = subgrupoId ? (subgrupoMuscular(subgrupoId)?.nombre || subgrupoId) : (grupoMuscular(grupoId)?.nombre || grupoId);
  return `${nombre} · ${Math.round(peso * 100)} %`;
}

/**
 * La lista de ejercicios de un músculo, con su tendencia (F11), su última
 * marca y lo que aporta al músculo.
 *
 * 🚨 Salen **todos los del catálogo que lo tocan**, no solo los entrenados: es
 * lo que permite decir «4 de 18 con datos» sin inventarse el denominador, y lo
 * que hace que el filtro «Sin datos» tenga sentido (apartados 13 y 20).
 *
 * ⚠️ Orden del apartado 21: primero los que tienen datos —y entre ellos, los
 * más recientes—, después los que no. Nunca solo alfabético: lo que importa es
 * lo que está entrenando ahora.
 */
export function ejerciciosDelMusculo(fitness, { grupoId = null, subgrupoId = null } = {}, { propios = [], hoy = todayISO(), perfil = null } = {}) {
  const filtro = subgrupoId ? { subgrupoId } : { grupoId };
  const senales = senalesDeEjercicios(fitness || {}, { rango: 'todo', hoy, propios: lista(propios) });
  const conDatos = ejerciciosDeMusculo(senales, filtro);
  const vistos = new Set(conDatos.map((x) => x.exerciseId));

  /* Los del catálogo que tocan el músculo y todavía no ha entrenado. */
  const sinDatos = todosLosEjercicios(lista(propios))
    .filter((ej) => !vistos.has(ej.id) && implicacionEn(ej, { grupoId, subgrupoId }) > 0)
    .map((ej) => ({
      exerciseId: ej.id,
      nombre: ej.nombre,
      existe: true,
      estado: 'sin_datos',
      estadoNombre: 'Sin datos',
      simbolo: '—',
      ultima: '',
      anterior: '',
      cambio: '',
      fecha: '',
      veces: 0,
      implicacion: Math.round(implicacionEn(ej, { grupoId, subgrupoId }) * 100),
    }))
    .sort((a, b) => b.implicacion - a.implicacion || a.nombre.localeCompare(b.nombre));

  const conRango = new Map(rangosDeEjercicios(fitness || {}, { propios: lista(propios), perfil }).map((r) => [r.exerciseId, r]));

  return [...conDatos, ...sinDatos].map((x) => {
    const ej = ejercicioPorId(x.exerciseId, lista(propios));
    const r = conRango.get(x.exerciseId) || null;
    return {
      ...x,
      /* Apartado 27 — una sesión vieja puede nombrar un ejercicio que ya no está
         en el catálogo. No se rompe la pantalla y no se le inventa un músculo:
         se dice. */
      existe: !!ej,
      nombre: ej ? ej.nombre : x.nombre,
      aviso: ej ? null : 'Ejercicio no disponible',
      contribucion: ej ? textoContribucion(ej, { grupoId, subgrupoId }) : '',
      rango: r && !r.sinRango ? r.rango : null,
      /* De dónde sale ese rango: entrenándolo o estimándolo (F17). */
      fuente: r ? r.fuente : null,
      estimado: !!(r && !r.sinRango && r.fuente === 'cuestionario'),
    };
  })
    /* ⚠️ Estable y con un criterio: primero lo que tiene tendencia (ya venía
       ordenado por la F13), después lo estimado —que también sostiene el
       rango— y al final lo que no ha tocado nunca. */
    .sort((a, b) => {
      const peso = (e) => (['mejora', 'estable', 'descenso'].includes(e.estado) ? 0 : (e.estimado ? 1 : 2));
      return peso(a) - peso(b);
    });
}

export const FILTROS_EJERCICIOS = [
  { id: 'todos', nombre: 'Todos' },
  { id: 'mejora', nombre: 'Mejorando' },
  { id: 'estable', nombre: 'Estables' },
  { id: 'descenso', nombre: 'Descenso' },
  { id: 'sin_datos', nombre: 'Sin datos' },
];

export function filtrarEjercicios(ejercicios, filtro = 'todos') {
  const f = texto(filtro) || 'todos';
  if (f === 'todos') return lista(ejercicios);
  /* ⚠️ «Sin datos» junta todo lo que no se puede comparar —nuevo, una sola vez,
     cambió de medida—: para quien mira, todo eso es «aquí no hay con qué». */
  if (f === 'sin_datos') return lista(ejercicios).filter((e) => !['mejora', 'estable', 'descenso'].includes(e.estado));
  return lista(ejercicios).filter((e) => e.estado === f);
}

/** El «↑ 3 mejorando · → 1 estable · ↓ 0 en descenso» del apartado 12. */
export function resumenDeTendencias(ejercicios) {
  const l = lista(ejercicios);
  const cuenta = (id) => l.filter((e) => e.estado === id).length;
  const mejorando = cuenta('mejora');
  const estables = cuenta('estable');
  const descenso = cuenta('descenso');
  const conDatos = mejorando + estables + descenso;
  return {
    mejorando,
    estables,
    descenso,
    sinDatos: l.length - conDatos,
    conDatos,
    total: l.length,
    /* Apartado 13 — la cobertura, dicha sin convertir el hueco en un suspenso. */
    cobertura: `${conDatos} de ${l.length} ejercicios con datos`,
    hayAlgo: conDatos > 0,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · CONFIANZA Y TRANSPARENCIA (apartados 15 y 19)
   ═══════════════════════════════════════════════════════════════════════════
   *"Si solamente existe un ejercicio: mostrar «Clasificación basada en 1
   ejercicio». Esto aporta transparencia."* ⚠️ Y sin llenar la pantalla de
   advertencias: una línea, discreta, y solo cuando dice algo. */
export function notaDeConfianza(rango) {
  if (!rango || rango.sinRango) return null;
  if (rango.estimado) return 'Basado en tu clasificación inicial, todavía sin entrenamientos';
  if (rango.ejercicios === 1) return 'Clasificación basada en 1 ejercicio';
  if (rango.confianza === 'baja') return 'Datos limitados';
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · EL DETALLE (apartados 2 a 5, 18)
   ═══════════════════════════════════════════════════════════════════════════ */

const SIN_DATOS_GRUPO = 'Completa ejercicios de este grupo para obtener una clasificación.';

/** El detalle de un grupo: su rango, sus subgrupos y sus ejercicios. */
export function detalleDeGrupo(fitness, grupoId, { propios = [], perfil = null, hoy = todayISO() } = {}) {
  const grupo = grupoMuscular(grupoId);
  if (!grupo) return null;
  /* 🚨 Apartado 31 — los rangos de los ejercicios se piden UNA vez y de ahí
     salen el del grupo y los de sus subgrupos. */
  const conRango = rangosDeEjercicios(fitness || {}, { propios: lista(propios), perfil });
  const rango = rangoDeGrupo(conRango, grupo.id);
  const ejercicios = ejerciciosDelMusculo(fitness, { grupoId: grupo.id }, { propios, perfil, hoy });
  const resumen = resumenDeTendencias(ejercicios);
  const subgrupos = lista(grupo.subgrupos).map((sg) => {
    const r = rangoDeSubgrupo(conRango, sg.id);
    return {
      id: sg.id,
      nombre: sg.nombre,
      sinRango: r.sinRango,
      rango: r.sinRango ? null : r.rango,
      nombreRango: r.nombre,
      ejercicios: r.sinRango ? 0 : r.ejercicios,
      /* Apartado 14 — sin datos, ni barra ni porcentaje: un cero se lee como
         suspenso y lo que pasa es que no lo ha entrenado. */
      siguiente: r.sinRango ? null : progresoHaciaSiguiente(r.score),
      datos: r.sinRango ? 'Sin datos' : `${r.ejercicios} ${r.ejercicios === 1 ? 'ejercicio' : 'ejercicios'}`,
    };
  });
  return {
    id: grupo.id,
    nombre: grupo.nombre,
    que: grupo.que || '',
    rango,
    sinRango: rango.sinRango,
    sinDatosTexto: SIN_DATOS_GRUPO,
    siguiente: rango.sinRango ? null : progresoHaciaSiguiente(rango.score),
    nota: notaDeConfianza(rango),
    subgrupos,
    subgruposConDatos: subgrupos.filter((s) => !s.sinRango).length,
    ejercicios,
    resumen,
    /* La cabecera del apartado 2, en palabras y sin parecer progreso físico. */
    cabecera: [
      /* ⚠️ «Clasificados» son los que SOSTIENEN el rango —los que la F15 ha
         puntuado, entrenados o estimados (F17)—, no los que tienen tendencia:
         con una estimación recién hecha ponía «0 ejercicios clasificados»
         debajo de un rango, que es lo contrario de explicar de dónde sale. */
      `${rango.ejercicios || 0} ${(rango.ejercicios || 0) === 1 ? 'ejercicio clasificado' : 'ejercicios clasificados'}`,
      `${subgrupos.filter((s) => !s.sinRango).length} de ${subgrupos.length} subgrupos con datos`,
    ],
  };
}

/** El detalle de un subgrupo (apartados 6 y 18): su rango y sus ejercicios. */
export function detalleDeSubgrupo(fitness, subgrupoId, { propios = [], perfil = null, hoy = todayISO() } = {}) {
  const sg = subgrupoMuscular(subgrupoId);
  if (!sg) return null;
  const grupo = GRUPOS_MUSCULARES.find((g) => lista(g.subgrupos).some((s) => s.id === sg.id)) || null;
  const conRango = rangosDeEjercicios(fitness || {}, { propios: lista(propios), perfil });
  const rango = rangoDeSubgrupo(conRango, sg.id);
  const ejercicios = ejerciciosDelMusculo(fitness, { subgrupoId: sg.id }, { propios, perfil, hoy });
  const resumen = resumenDeTendencias(ejercicios);
  return {
    id: sg.id,
    nombre: sg.nombre,
    grupoId: grupo ? grupo.id : null,
    grupoNombre: grupo ? grupo.nombre : '',
    rango,
    sinRango: rango.sinRango,
    sinDatosTexto: `Completa ejercicios de ${sg.nombre.toLowerCase()} para obtener una clasificación.`,
    siguiente: rango.sinRango ? null : progresoHaciaSiguiente(rango.score),
    nota: notaDeConfianza(rango),
    ejercicios,
    resumen,
  };
}

export const NO_EN_FIT18 = [
  { que: 'Anatomía 3D, realidad aumentada y selección anatómica', porque: 'Apartados 17 y 32: *"no implementar todavía selección 3D avanzada"*. La cabecera usa el icono real del grupo, y tocar un subgrupo ya abre su detalle, que es la evolución que el apartado 17 pide no bloquear.' },
  { que: 'Leaderboard, comparación con otros, IA, predicciones, XP y logros', porque: 'Apartado 32.' },
  { que: 'Guardar el detalle calculado', porque: 'Apartado 25: se recalcula de ejercicios, relaciones musculares, sesiones, clasificaciones y perfil.' },
  { que: 'Un filtro por tipo de ejercicio', porque: 'Apartado 20: *"no introducir filtros innecesarios"*. Los cinco por estado bastan para encontrar lo que se busca.' },
];

export const DECISIONES_FIT18 = [
  { que: 'La lista enseña TODOS los ejercicios del catálogo que tocan el músculo, no solo los entrenados', porque: 'Apartados 8 y 13: es la única forma de decir «4 de 18 con datos» sin inventarse el denominador, y de que el filtro «Sin datos» sirva para algo — es, además, la lista de por dónde seguir.' },
  { que: 'Rangos → grupo abre ESTE detalle, y no el de Progreso (F13)', porque: 'Contradicción anotada: la F16 mandaba a la F13 para no duplicar pantallas, y la F18 pide un detalle propio de rangos. Contestan preguntas distintas —«qué nivel tengo y de dónde sale» frente a «cómo evoluciona mi rendimiento»— y el de Progreso sigue existiendo igual; lo que NO se duplica es el cálculo: éste consume la F11, la F13 y la F15.' },
  { que: 'Tocar un ejercicio lleva a la pantalla de progreso de la F12', porque: 'Apartado 11: *"no crear otra pantalla de progreso"*.' },
];
