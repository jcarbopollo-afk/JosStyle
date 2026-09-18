/* ===========================================================================
   ENTREGA 4 · FASE 20/45 — POR QUÉ TENGO ESTE RANGO (lo que decide)

   *"El usuario debe poder entender «¿por qué tengo este rango?» y «¿qué tendría
   que mejorar para alcanzar el siguiente?»"*

   🚨 **Esta fase no cambia ni una fórmula** (apartado 0 y 26): lee lo que ya
   calculan el motor (F19), los rangos (F15) y la progresión (F11), y lo
   convierte en frases que se puedan leer sin saber cómo funciona por dentro.

   🚨 **Y es conservadora a propósito** (apartados 1 y 9): *"no decir «te faltan
   5 kg» si el sistema no puede garantizarlo"*. Lo que se dice es qué sostiene
   el rango y qué hay que mejorar; lo que no se sabe, no se promete.
   =========================================================================== */

import { GRUPOS_MUSCULARES, SIN_RANGO, NIVELES_RANGO, nivelRango, subgrupoMuscular } from './fitness.js';
import { RANK_THRESHOLDS, PUNTUACION_MAXIMA, CONFIANZA } from './rangos.js';
import {
  rangoEfectivoDeEjercicio, rangoEfectivoDeGrupo, rangoEfectivoDeSubgrupo,
  rangoGlobalEfectivo, rangosEfectivos, evolucionDeRango, fuenteRango,
} from './motorRangos.js';
import { ejercicioPorId } from './ejercicios.js';
import { ejerciciosDelMusculo, resumenDeTendencias, grupoMuscular } from './detalleMuscular.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LAS PALABRAS (apartados 11 a 14)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ *"No hace falta mencionar algoritmos"*. Cada fuente y cada confianza tiene
   una frase, escrita una vez y usada en las tres explicaciones. */

export const TEXTO_FUENTE = {
  cuestionario: {
    titulo: 'Clasificación inicial',
    que: 'Se actualizará con tus entrenamientos.',
  },
  combinado: {
    titulo: 'Tu clasificación inicial y tu rendimiento reciente',
    que: 'Cuantos más entrenamientos registres, menos pesa la estimación.',
  },
  entrenamiento: {
    titulo: 'Tus entrenamientos',
    que: 'Calculado solo con lo que has hecho de verdad.',
  },
};

/* Los tres niveles de la F15, con una frase que explica qué significan. 🚨 Sin
   porcentajes inventados (apartado 14). */
export const TEXTO_CONFIANZA = {
  baja: { titulo: 'Confianza limitada', que: 'Todavía hay pocos datos detrás de este nivel.' },
  media: { titulo: 'Confianza media', que: 'Hay datos suficientes para hacerse una idea.' },
  alta: { titulo: 'Confianza alta', que: 'Hay datos recientes de sobra para estimar tu nivel.' },
};
export const confianzaExplicada = (id) => TEXTO_CONFIANZA[texto(id)] || null;

/* ═══════════════════════════════════════════════════════════════════════════
   2 · DÓNDE ESTÁ DENTRO DE SU RANGO (apartado 20)
   ═══════════════════════════════════════════════════════════════════════════
   *"El usuario puede mejorar sin subir inmediatamente de rango. Esto evita que
   el sistema parezca binario."* */
export function dentroDelRango(score, orden) {
  if (typeof score !== 'number' || !orden) return null;
  const desde = RANK_THRESHOLDS[orden - 1];
  const hasta = orden < RANK_THRESHOLDS.length ? RANK_THRESHOLDS[orden] : PUNTUACION_MAXIMA;
  const ancho = hasta - desde;
  const fraccion = ancho > 0 ? Math.max(0, Math.min(1, (score - desde) / ancho)) : 1;
  const nivel = nivelRango(orden);
  return {
    fraccion,
    /* ⚠️ Tres zonas y ninguna cifra: el número es interno (F15, apartado 5). */
    texto: fraccion >= 0.75
      ? `Cerca del siguiente rango, dentro de ${nivel.nombre}`
      : (fraccion >= 0.3 ? `Progresando dentro de ${nivel.nombre}` : `Empezando dentro de ${nivel.nombre}`),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · QUÉ HACER PARA SUBIR (apartados 1, 9 y 10)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 **Conservador a propósito.** No se dice *"te faltan 5 kg"* porque el
 * sistema no puede garantizarlo: la puntuación mezcla la mejor de cinco
 * sesiones, la dificultad del ejercicio y —en los de carga— el peso corporal.
 * Lo que sí se puede decir con honradez es **qué falta**: datos, variedad o
 * rendimiento.
 */
export function siguientePaso({ sinRango = false, motivo = null, fuente = null, siguiente = null, ambito = 'ejercicio' }) {
  const donde = { global: 'tu nivel general', grupo: 'este grupo', subgrupo: 'este músculo', ejercicio: 'este ejercicio' }[ambito] || 'esto';
  if (sinRango) {
    return motivo === 'poca_cobertura'
      ? { texto: 'Entrena ejercicios de otras zonas para que haya con qué comparar.', accion: 'entrenar' }
      : { texto: `Entrena o clasifica ${donde} para empezar a medirlo.`, accion: 'clasificar' };
  }
  if (fuente === 'cuestionario') {
    return { texto: 'Registra entrenamientos: en cuanto los haya, el nivel se calculará con ellos.', accion: 'entrenar' };
  }
  if (siguiente && !siguiente.siguiente) {
    return { texto: 'Estás en el rango más alto de la escala.', accion: null };
  }
  if (fuente === 'combinado') {
    return { texto: 'Necesitas más entrenamientos para confirmar el siguiente rango.', accion: 'entrenar' };
  }
  /* ⚠️ Y se dice según dónde se esté: «los ejercicios que más pesan aquí» no
     significa nada en la ficha de UN ejercicio. */
  return ambito === 'ejercicio'
    ? { texto: 'Mejora tu marca en este ejercicio, con la medida que le corresponda.', accion: 'entrenar' }
    : { texto: 'Mejora tu rendimiento en los ejercicios que más pesan aquí.', accion: 'entrenar' };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · EL CAMINO Y LA COMPARACIÓN (apartados 16 a 19)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Los diez rangos con el actual marcado. ⚠️ Sin fechas inventadas: no se
 *  guarda cuándo subió, así que no se dice (apartado 16). */
export function caminoDeRangos(actual) {
  return NIVELES_RANGO.map((n) => ({
    orden: n.orden,
    nombre: n.nombre,
    estado: actual === null || actual === undefined
      ? 'pendiente'
      : (n.orden < actual ? 'pasado' : (n.orden === actual ? 'actual' : 'pendiente')),
  }));
}

/**
 * Comparar con antes, **solo si hay con qué** (apartado 17). Se usa la
 * evolución que calcula el motor (F19): el rango que había antes de la última
 * sesión frente al de ahora. Si solo hay una sesión, no se compara.
 */
export function comparacionDeRango(fitness, exerciseId, { propios = [], perfil = null } = {}) {
  const evolucion = evolucionDeRango(fitness, exerciseId, { propios, perfil });
  if (evolucion.length < 2) return null;
  const antes = evolucion[evolucion.length - 2];
  const ahora = evolucion[evolucion.length - 1];
  if (antes.rango === null || ahora.rango === null) return null;
  if (ahora.rango > antes.rango) {
    return {
      cambio: 'subida',
      antes: nivelRango(antes.rango).nombre,
      ahora: nivelRango(ahora.rango).nombre,
      texto: 'Subida de rango',
    };
  }
  if (ahora.rango < antes.rango) {
    return {
      cambio: 'bajada',
      antes: nivelRango(antes.rango).nombre,
      ahora: nivelRango(ahora.rango).nombre,
      /* ⚠️ Apartado 18 — sin dramatizar, y sin confundir rendimiento con
         cuerpo: *"no decir «has empeorado físicamente»"*. */
      texto: 'Tu rendimiento reciente está por debajo del nivel anterior.',
    };
  }
  /* Apartado 19 — seguir igual no es no progresar. */
  return { cambio: 'estable', antes: nivelRango(antes.rango).nombre, ahora: nivelRango(ahora.rango).nombre, texto: 'Rango estable' };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LAS TRES EXPLICACIONES (apartados 4, 5 y 6)
   ═══════════════════════════════════════════════════════════════════════════
   Las tres devuelven **la misma forma**, porque las pinta el mismo componente
   (apartado 2: *"debe reutilizar el mismo componente"*). */

function base({ ambito, titulo, r, evidencias, cobertura, acciones, motivo = null }) {
  const sinRango = !r || r.sinRango;
  const nivel = sinRango ? null : nivelRango(r.rango);
  const fuente = sinRango ? null : (r.fuente || null);
  return {
    ambito,
    titulo,
    sinRango,
    rango: sinRango ? null : r.rango,
    nombre: sinRango ? SIN_RANGO.nombre : r.nombre,
    /* La descripción del nivel es la que escribió la F1: una sola en la app. */
    descripcion: nivel ? nivel.que : 'Necesitamos más información para clasificarlo.',
    siguiente: sinRango ? null : r.siguiente,
    dentro: sinRango ? null : dentroDelRango(r.score, r.rango),
    fuente,
    fuenteTexto: fuente ? TEXTO_FUENTE[fuente] : null,
    confianza: sinRango ? null : r.confianza,
    confianzaTexto: sinRango ? null : confianzaExplicada(r.confianza),
    provisional: !sinRango && !!r.provisional,
    cobertura: cobertura || null,
    evidencias: lista(evidencias).filter(Boolean),
    paso: siguientePaso({ sinRango, motivo, fuente, siguiente: sinRango ? null : r.siguiente, ambito }),
    camino: caminoDeRangos(sinRango ? null : r.rango),
    acciones: acciones || {},
  };
}

/** Apartado 6 — por qué tengo este rango en un ejercicio. */
export function explicacionDeEjercicio(fitness, exerciseId, { propios = [], perfil = null } = {}) {
  const ej = ejercicioPorId(texto(exerciseId), lista(propios));
  const r = rangoEfectivoDeEjercicio(fitness || {}, exerciseId, { propios, perfil });
  const comparacion = r.sinRango ? null : comparacionDeRango(fitness || {}, exerciseId, { propios, perfil });
  const tendencias = { mejora: '↑ Mejorando', estable: '→ Estable', descenso: '↓ Descenso' };
  return {
    ...base({
      ambito: 'ejercicio',
      titulo: ej ? ej.nombre : texto(exerciseId),
      r,
      /* 🚨 Apartado 7 — la métrica que corresponde al ejercicio y ninguna más:
         nada de «18 kg» en algo que solo se mide en segundos. La escribe la
         F11, que sabe en qué clase está cada aparición. */
      evidencias: [
        r.mejorMarca ? { etiqueta: 'Mejor resultado', valor: r.mejorMarca } : null,
        r.tendencia && tendencias[r.tendencia] ? { etiqueta: 'Tendencia', valor: tendencias[r.tendencia] } : null,
        r.dataPoints > 0 ? { etiqueta: 'Sesiones comparables', valor: String(r.dataPoints) } : null,
      ],
      cobertura: null,
      acciones: { progreso: !!ej },
    }),
    comparacion,
  };
}

/** Apartado 5 — por qué tengo este rango en un músculo. */
export function explicacionDeMusculo(fitness, { grupoId = null, subgrupoId = null } = {}, { propios = [], perfil = null } = {}) {
  const esGrupo = !subgrupoId;
  const nombre = esGrupo
    ? (grupoMuscular(grupoId)?.nombre || texto(grupoId))
    : (subgrupoMuscular(subgrupoId)?.nombre || texto(subgrupoId));
  const r = esGrupo
    ? rangoEfectivoDeGrupo(fitness || {}, grupoId, { propios, perfil })
    : rangoEfectivoDeSubgrupo(fitness || {}, subgrupoId, { propios, perfil });
  const ejercicios = ejerciciosDelMusculo(fitness || {}, { grupoId, subgrupoId }, { propios, perfil });
  const resumen = resumenDeTendencias(ejercicios);
  /* Los que de verdad sostienen el rango, con su flecha: es lo que el apartado
     5 enseña debajo del nivel. */
  const relevantes = ejercicios
    .filter((e) => e.rango !== null)
    .slice(0, 5)
    .map((e) => ({ nombre: e.nombre, estado: e.estado, simbolo: { mejora: '↑', estable: '→', descenso: '↓' }[e.estado] || '—', ultima: e.ultima }));
  return {
    ...base({
      ambito: esGrupo ? 'grupo' : 'subgrupo',
      titulo: nombre,
      r: r && !r.sinRango ? { ...r, siguiente: r.siguiente || null } : r,
      evidencias: [
        r.sinRango ? null : { etiqueta: 'Ejercicios con datos', valor: `${r.ejercicios}` },
        resumen.mejorando > 0 ? { etiqueta: 'Mejorando', valor: `${resumen.mejorando}` } : null,
        resumen.descenso > 0 ? { etiqueta: 'En descenso', valor: `${resumen.descenso}` } : null,
      ],
      cobertura: { texto: resumen.cobertura, fraccion: resumen.total > 0 ? resumen.conDatos / resumen.total : 0 },
      acciones: { musculo: true },
    }),
    relevantes,
  };
}

/** Apartado 4 — por qué tengo este rango global. */
export function explicacionGlobal(fitness, { propios = [], perfil = null } = {}) {
  const g = rangoGlobalEfectivo(fitness || {}, { propios, perfil });
  const conDatos = lista(g.grupos).filter((x) => !x.sinRango);
  /* *"Mayor contribución"*: los grupos con más puntuación, que son los que
     tiran de la media. ⚠️ Sin porcentajes inventados: solo el orden. */
  const mayores = [...conDatos].sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.nombreMusculo);
  const ejerciciosTotales = lista(g.ejercicios).length;
  return {
    ...base({
      ambito: 'global',
      titulo: 'Rango general',
      r: g.sinRango ? g : { ...g, siguiente: g.sinRango ? null : (g.siguiente || null) },
      motivo: g.motivo,
      evidencias: [
        { etiqueta: 'Grupos con datos', valor: `${g.cobertura.grupos} de ${g.cobertura.total}` },
        ejerciciosTotales > 0 ? { etiqueta: 'Ejercicios clasificados', valor: `${ejerciciosTotales}` } : null,
        mayores.length ? { etiqueta: 'Mayor contribución', valor: mayores.join(', ') } : null,
      ],
      cobertura: {
        texto: `${g.cobertura.grupos} de ${g.cobertura.total} grupos con datos`,
        fraccion: g.cobertura.total > 0 ? g.cobertura.grupos / g.cobertura.total : 0,
      },
      acciones: { musculos: true },
    }),
    grupos: GRUPOS_MUSCULARES.map((x) => {
      const r = lista(g.grupos).find((y) => y.id === x.id) || null;
      return { id: x.id, nombre: x.nombre, rango: r && !r.sinRango ? r.rango : null };
    }),
  };
}

/** El global necesita su `siguiente`, que el motor no calcula: lo añade aquí
 *  quien lo pide, con la misma función que todo lo demás. */
export function explicacionDeRango(fitness, destino, opciones = {}) {
  const d = destino || {};
  if (d.tipo === 'ejercicio') return explicacionDeEjercicio(fitness, d.id, opciones);
  if (d.tipo === 'grupo') return explicacionDeMusculo(fitness, { grupoId: d.id }, opciones);
  if (d.tipo === 'subgrupo') return explicacionDeMusculo(fitness, { subgrupoId: d.id }, opciones);
  return explicacionGlobal(fitness, opciones);
}

export const NO_EN_FIT20 = [
  { que: 'IA explicativa y predicciones («llegarás a Élite en 20 días»)', porque: 'Apartado 31, literal.' },
  { que: 'Decir cuánto falta exactamente («te faltan 5 kg»)', porque: 'Apartado 9: el sistema no puede garantizarlo —la puntuación mezcla la mejor de cinco sesiones, la dificultad y el peso corporal—, así que se dice qué mejorar, no cuánto.' },
  { que: 'El historial de cuándo subió de rango', porque: 'Apartado 16: no se guarda, y no se inventan fechas. Lo que sí es real es la comparación con antes de la última sesión, que se calcula.' },
  { que: 'Comparación con otros, XP, logros, retos y avisos', porque: 'Apartado 31.' },
];

export const DECISIONES_FIT20 = [
  { que: 'La explicación no calcula: recibe lo que ya calculan la F15 y la F19', porque: 'Apartados 3 y 26: una segunda fórmula acabaría contradiciendo a la primera.' },
  { que: 'La comparación sale de `evolucionDeRango` (F19), no de un historial guardado', porque: 'Apartado 17: hay que comparar con algo fiable, y recalcular el rango anterior con las mismas reglas es más fiable que guardar un número viejo que nadie actualiza.' },
  { que: 'La puntuación sigue sin enseñarse, ni siquiera aquí', porque: 'El apartado 20 la usa en su ejemplo, pero la F15 pidió no mostrarla. Se enseña **dónde está dentro del rango** —empezando, progresando, cerca del siguiente— que es lo que esa sección quiere decir sin dar un número que nadie sabe interpretar.' },
];
