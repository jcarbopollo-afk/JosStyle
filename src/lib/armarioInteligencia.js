// ---------------------------------------------------------------------------
// Entrega 2 · AR Fase 4 — Anti-repetición, estadísticas y recomendaciones.
//
// ES UN MÓDULO APARTE, PERO NO UN SISTEMA APARTE
// Todo lo que hay aquí se apoya en lo que ya construyeron las fases 1-3
// (`usosDePrenda`, `usosDeOutfit`, `diasDesde`, `noDisponiblesDeOutfit`,
// `indiceUso*`…). No recalcula ni una sola relación por su cuenta: si mañana
// cambia cómo se deduce el uso de una prenda, cambia en un sitio y aquí se
// entera solo. Vive en su propio archivo porque `armario.js` ya son 900 líneas
// de modelo de datos, y esto es otra cosa: son CONCLUSIONES sobre ese modelo.
//
// LA REGLA QUE MANDA EN ESTA FASE: NADA DE INTELIGENCIA FINGIDA
// El apartado 25 prohíbe expresamente la IA de moda, y el 22 pide que el
// sistema sepa cuándo NO tiene datos suficientes. Así que:
//
//   · Todo sale de reglas sobre el historial real. Ninguna llamada a la IA.
//     (También lo exige la regla 7 del proyecto: la IA analiza y sugiere, no
//     decide, y nunca se dispara sola.)
//   · Toda recomendación viene con sus MOTIVOS, en texto, sacados de los
//     mismos números que la ordenaron. Si no se puede explicar, no se enseña.
//   · Con menos de `USOS_MINIMOS` registros no se recomienda: se dice que
//     todavía no hay datos suficientes. Fingir un patrón con dos usos sería
//     exactamente lo que el apartado 22 prohíbe.
//
// SIN CONTADORES, OTRA VEZ (apartado 1)
// La Fase 3 quitó los contadores guardados. Esta fase NO los reintroduce por
// la puerta de atrás: los índices que usa se construyen al vuelo, se
// consultan y se tiran al acabar el render. Nunca se guardan, así que nunca
// se desincronizan.
// ---------------------------------------------------------------------------
import {
  usosDeOutfit, diasDesde, textoUltimoUso, indiceUsoOutfits,
  indiceUsoPrendas, prendasNoDisponiblesDeOutfit,
} from './armario';
import { todayISO } from './helpers';

/* ===========================================================================
   PERÍODOS (apartado 15)
   =========================================================================== */

// `dias: null` es "todo el historial"; `anoActual` se resuelve contra el 1 de
// enero del año que se esté mirando, no contra "hace 365 días" — son cosas
// distintas y el apartado las pide por separado.
export const PERIODOS_ARMARIO = [
  { id: '7', label: '7 días', dias: 7 },
  { id: '30', label: '30 días', dias: 30 },
  { id: '90', label: '90 días', dias: 90 },
  { id: 'ano', label: 'Este año', dias: null, anoActual: true },
  { id: 'todo', label: 'Todo', dias: null },
];

/**
 * Traduce un período a la fecha "desde" que le corresponde.
 *
 * Devuelve `null` cuando no hay límite inferior ("Todo"), que es distinto de
 * `undefined`: quien llama necesita distinguir "sin filtro" de "no calculado".
 * El período `personalizado` lo aporta quien llama con su propio `desde`.
 */
export function desdeDelPeriodo(periodoId, hoyISO, desdePersonalizado) {
  if (periodoId === 'personalizado') return desdePersonalizado || null;
  const p = PERIODOS_ARMARIO.find((x) => x.id === periodoId);
  if (!p) return null;
  const hoy = hoyISO || todayISO();
  if (p.anoActual) return `${hoy.slice(0, 4)}-01-01`;
  if (p.dias === null) return null;
  const d = new Date(`${hoy}T00:00:00`);
  d.setDate(d.getDate() - p.dias);
  return d.toLocaleDateString('sv-SE');
}

/** Recorta el historial a un período. Sin `desde`, devuelve la lista tal cual. */
export function usosDelPeriodo(usos, desde, hasta) {
  if (!desde && !hasta) return usos || [];
  return (usos || []).filter((u) => (!desde || u.fecha >= desde) && (!hasta || u.fecha <= hasta));
}

/* ===========================================================================
   CUÁNTOS DATOS HACEN FALTA (apartados 21 y 22)
   =========================================================================== */

// Por debajo de esto no se recomienda nada. No es un número mágico: con menos
// de cinco usos repartidos entre varios outfits, "el que hace más tiempo que
// no usas" es casi siempre "el que registraste primero", y eso no es un
// patrón, es el orden de entrada de los datos.
export const USOS_MINIMOS_RECOMENDACION = 5;

// Para las estadísticas basta con uno: contar tres usos es contar tres usos,
// no hace falta un patrón. Lo que no se enseña es un ranking vacío.
export const USOS_MINIMOS_ESTADISTICAS = 1;

export function hayDatosSuficientes(usos, minimo = USOS_MINIMOS_ESTADISTICAS) {
  return (usos || []).length >= minimo;
}

/* ===========================================================================
   ESTADÍSTICAS DE OUTFITS (apartado 3)
   =========================================================================== */

const porNombre = (a, b) => String(a?.nombre || '').localeCompare(String(b?.nombre || ''), 'es');

/**
 * Todo lo que el apartado 3 pide, en una pasada.
 *
 * `masUsado` y `menosUsado` se calculan **solo entre los outfits que se han
 * usado**: "el menos utilizado" de un armario con 10 outfits sin estrenar
 * sería cualquiera de los 10 empatados a cero, que no dice nada. Los que
 * nunca se han usado tienen su propia lista, que es la información útil.
 */
export function estadisticasOutfits(usos, outfits, { hoyISO } = {}) {
  const lista = outfits || [];
  const indice = indiceUsoOutfits(usos);
  const conUso = lista
    .map((o) => ({ outfit: o, veces: indice.get(o.id)?.veces || 0, ultima: indice.get(o.id)?.ultima || null }))
    .filter((x) => x.veces > 0);
  const nuncaUsados = lista.filter((o) => !indice.has(o.id));

  const porVeces = [...conUso].sort((a, b) => b.veces - a.veces || porNombre(a.outfit, b.outfit));
  // El último outfit usado sale de la fecha más reciente del historial, no del
  // orden de la lista de outfits.
  const ultimo = [...conUso].sort((a, b) => String(b.ultima).localeCompare(String(a.ultima)))[0] || null;

  return {
    total: lista.length,
    usados: conUso.length,
    nuncaUsados,
    masUsado: porVeces[0] || null,
    menosUsado: porVeces.length ? porVeces[porVeces.length - 1] : null,
    ultimoUsado: ultimo,
    rankingMas: porVeces.slice(0, 5),
    // De menos a más, pero solo entre los usados, por el motivo de arriba.
    rankingMenos: [...porVeces].reverse().slice(0, 5),
    textoUltimo: ultimo ? textoUltimoUso(ultimo.ultima, hoyISO) : null,
  };
}

/* ===========================================================================
   ESTADÍSTICAS DE PRENDAS (apartado 4)
   =========================================================================== */

/**
 * Lo mismo para prendas, con la diferencia que importa: **el uso de una prenda
 * se deriva de los outfits en los que aparece** (apartado 4, con su ejemplo
 * literal del vaquero gris: 3 usos en un outfit + 5 en otro = 8, y sigue
 * siendo UNA prenda). Eso ya lo resuelve `indiceUsoPrendas`; aquí solo se
 * ordena y se agrupa.
 */
export function estadisticasPrendas(usos, outfits, prendas, { hoyISO } = {}) {
  const lista = prendas || [];
  const indice = indiceUsoPrendas(usos, outfits);
  const conUso = lista
    .map((p) => ({ prenda: p, veces: indice.get(p.id)?.veces || 0, ultima: indice.get(p.id)?.ultima || null }))
    .filter((x) => x.veces > 0);
  const nuncaUsadas = lista.filter((p) => !indice.has(p.id));

  const porVeces = [...conUso].sort((a, b) => b.veces - a.veces || porNombre(a.prenda, b.prenda));
  const porFecha = [...conUso].sort((a, b) => String(b.ultima).localeCompare(String(a.ultima)));

  return {
    total: lista.length,
    usadas: conUso.length,
    nuncaUsadas,
    rankingMas: porVeces.slice(0, 5),
    rankingMenos: [...porVeces].reverse().slice(0, 5),
    masReciente: porFecha[0] || null,
    // Las que llevan más tiempo sin aparecer en un outfit usado. Las que nunca
    // se han usado NO entran aquí: no tienen "tiempo sin usarse" que medir, y
    // decir "hace 0 días" o inventar una fecha es justo lo que prohíbe el
    // apartado 28 de la Fase 3. Van en `nuncaUsadas`.
    masTiempoSinUsar: [...porFecha].reverse().slice(0, 5).map((x) => ({
      ...x,
      dias: diasDesde(x.ultima, hoyISO),
      texto: textoUltimoUso(x.ultima, hoyISO),
    })),
  };
}

/* ===========================================================================
   DIVERSIDAD DEL ARMARIO (apartados 5 y 16)
   =========================================================================== */

/**
 * Qué proporción del armario se está usando de verdad.
 *
 * ES UNA FRACCIÓN, NO UNA PUNTUACIÓN. El apartado 16 avisa: nada de un número
 * arbitrario sin explicación, y si no aporta valor, mejor no implementarlo.
 * Así que esto es literalmente `prendas usadas ÷ prendas que se podían usar`,
 * una división que cualquiera puede rehacer a mano, y viene con el texto que
 * la explica y con los dos números crudos para que se pueda comprobar.
 *
 * El denominador **excluye las prendas no disponibles**: una camiseta que ha
 * estado todo el mes en la lavandería no se ha usado, pero eso no es falta de
 * diversidad, es que no estaba. Contarla bajaría el porcentaje por un motivo
 * que no tiene nada que ver con lo que la métrica quiere decir.
 */
export function diversidadArmario(usos, outfits, prendas, { desde, hasta } = {}) {
  const disponibles = (prendas || []).filter((p) => p.estado === 'disponible');
  const delPeriodo = usosDelPeriodo(usos, desde, hasta);
  const indice = indiceUsoPrendas(delPeriodo, outfits);
  const usadas = disponibles.filter((p) => indice.has(p.id)).length;

  if (disponibles.length === 0) {
    return { porcentaje: null, usadas: 0, base: 0, explicacion: 'Todavía no hay prendas disponibles que medir.' };
  }
  const porcentaje = Math.round((usadas / disponibles.length) * 100);
  return {
    porcentaje,
    usadas,
    base: disponibles.length,
    explicacion: `Has usado ${usadas} de tus ${disponibles.length} prendas disponibles. No cuenta las que están en la lavandería o en reparación.`,
  };
}

/* ===========================================================================
   ANTI-REPETICIÓN (apartado 6)
   =========================================================================== */

// Los umbrales, en un solo sitio y con nombre, para que se puedan discutir sin
// buscarlos por el código. No prohíben nada (apartado 6, literal: "no prohibir
// automáticamente un Outfit"): solo cambian lo que se dice.
export const DIAS_USO_RECIENTE = 3;
export const DIAS_DESCANSADO = 10;

/**
 * Cómo de "descansado" está un outfit. Cuatro estados, ninguno es un veto.
 * `dias` es null cuando nunca se ha usado — y eso es un estado propio, no un
 * cero.
 */
export function estadoRepeticion(dias) {
  if (dias === null || dias === undefined) {
    return { id: 'nunca', etiqueta: 'Sin estrenar', icono: '✨', tono: 'info' };
  }
  if (dias <= DIAS_USO_RECIENTE) {
    return { id: 'reciente', etiqueta: 'Usado hace poco', icono: '⚠️', tono: 'warning' };
  }
  if (dias < DIAS_DESCANSADO) {
    return { id: 'medio', etiqueta: 'Usado esta semana', icono: '·', tono: 'muted' };
  }
  return { id: 'descansado', etiqueta: 'Hace tiempo que no lo usas', icono: '✓', tono: 'positive' };
}

/** El estado de un outfit concreto, con su texto de "hace X días" ya resuelto. */
export function repeticionDeOutfit(usos, outfit, hoyISO) {
  const suyos = usosDeOutfit(usos, outfit.id);
  const ultima = suyos.length ? suyos[0].fecha : null;
  const dias = diasDesde(ultima, hoyISO);
  return { veces: suyos.length, ultima, dias, texto: textoUltimoUso(ultima, hoyISO), estado: estadoRepeticion(dias) };
}

/* ===========================================================================
   PRENDAS MUY REPETIDAS (apartado 10)
   =========================================================================== */

export const DIAS_VENTANA_REPETICION = 14;
export const VECES_PARA_REPETIDA = 4;

/**
 * "Has utilizado esta prenda 8 veces recientemente" — información, no
 * prohibición (apartado 10, literal). Solo mira la ventana reciente: una
 * prenda con 40 usos en dos años no está sobreutilizada, es una prenda que
 * te gusta.
 */
export function prendasMuyRepetidas(usos, outfits, prendas, { hoyISO, dias = DIAS_VENTANA_REPETICION, minimo = VECES_PARA_REPETIDA } = {}) {
  const desde = desdeHace(dias, hoyISO);
  const indice = indiceUsoPrendas(usosDelPeriodo(usos, desde), outfits);
  return (prendas || [])
    .map((p) => ({ prenda: p, veces: indice.get(p.id)?.veces || 0 }))
    .filter((x) => x.veces >= minimo)
    .sort((a, b) => b.veces - a.veces || porNombre(a.prenda, b.prenda))
    .map((x) => ({ ...x, dias, texto: `La has usado ${x.veces} veces en los últimos ${dias} días.` }));
}

/** Fecha de hace N días, en día local. Igual que el resto del proyecto. */
function desdeHace(dias, hoyISO) {
  const d = new Date(`${hoyISO || todayISO()}T00:00:00`);
  d.setDate(d.getDate() - dias);
  return d.toLocaleDateString('sv-SE');
}

/* ===========================================================================
   COMBINACIONES REPETIDAS (apartado 11)
   =========================================================================== */

/**
 * Detecta el mismo CONJUNTO DE PRENDAS repetido, aunque esté guardado en
 * outfits distintos.
 *
 * Por qué no basta con contar usos por outfit: si Josué duplicó "Casual Gris"
 * y le cambió el nombre, tiene dos outfits con exactamente la misma ropa. Por
 * separado parecen dos outfits poco usados; juntos son la misma combinación
 * repetida diez veces, que es lo que el apartado quiere enseñar.
 *
 * La huella es la lista de ids **ordenada**, para que el orden en que se
 * eligieron las prendas no cree combinaciones falsamente distintas.
 *
 * NO crea outfits nuevos (lo prohíbe el apartado): solo cuenta.
 */
export function combinacionesRepetidas(usos, outfits, prendas, { minimo = 3, hoyISO } = {}) {
  const porId = new Map((outfits || []).map((o) => [o.id, o]));
  const grupos = new Map();

  for (const u of usos || []) {
    const outfit = porId.get(u.outfitId);
    if (!outfit || !(outfit.prendaIds || []).length) continue;
    const huella = [...new Set(outfit.prendaIds)].sort().join('|');
    const grupo = grupos.get(huella) || { huella, veces: 0, ultima: null, outfits: new Map(), prendaIds: [...new Set(outfit.prendaIds)].sort() };
    grupo.veces += 1;
    if (!grupo.ultima || u.fecha > grupo.ultima) grupo.ultima = u.fecha;
    grupo.outfits.set(outfit.id, outfit);
    grupos.set(huella, grupo);
  }

  return [...grupos.values()]
    .filter((g) => g.veces >= minimo)
    .sort((a, b) => b.veces - a.veces)
    .map((g) => ({
      huella: g.huella,
      veces: g.veces,
      ultima: g.ultima,
      texto: textoUltimoUso(g.ultima, hoyISO),
      outfits: [...g.outfits.values()],
      prendas: g.prendaIds.map((id) => (prendas || []).find((p) => p.id === id)).filter(Boolean),
    }));
}

/* ===========================================================================
   OLVIDADOS E INFRAUTILIZADAS (apartados 12 y 13)
   =========================================================================== */

export const DIAS_OLVIDADO = 30;

/**
 * Outfits que existen y casi no se usan (apartado 12). Dos casos distintos,
 * los dos legítimos: pocos usos, o mucho tiempo desde el último.
 *
 * Los que nunca se han usado NO entran: son "sin estrenar", que es otra cosa y
 * tiene su propia lista en `estadisticasOutfits().nuncaUsados`. Mezclarlos
 * haría que un outfit creado ayer apareciera como "olvidado".
 */
export function outfitsOlvidados(usos, outfits, { hoyISO, dias = DIAS_OLVIDADO } = {}) {
  const indice = indiceUsoOutfits(usos);
  return (outfits || [])
    .map((o) => {
      const datos = indice.get(o.id);
      if (!datos) return null;
      const d = diasDesde(datos.ultima, hoyISO);
      return d !== null && d >= dias
        ? { outfit: o, veces: datos.veces, ultima: datos.ultima, dias: d, texto: textoUltimoUso(datos.ultima, hoyISO) }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.dias - a.dias);
}

/**
 * Prendas que podrías volver a usar (apartado 13). Nunca usadas primero
 * —son las que más se están desaprovechando— y después las que llevan más
 * tiempo sin aparecer en un outfit.
 *
 * Las no disponibles quedan fuera: sugerir una prenda que está en la
 * lavandería no es una sugerencia, es un despiste.
 */
export function prendasInfrautilizadas(usos, outfits, prendas, { hoyISO, dias = DIAS_OLVIDADO, limite = 8 } = {}) {
  const indice = indiceUsoPrendas(usos, outfits);
  const disponibles = (prendas || []).filter((p) => p.estado === 'disponible');

  const nunca = disponibles
    .filter((p) => !indice.has(p.id))
    .sort(porNombre)
    .map((p) => ({ prenda: p, veces: 0, ultima: null, dias: null, motivo: 'Todavía no la has usado' }));

  const olvidadas = disponibles
    .map((p) => {
      const datos = indice.get(p.id);
      if (!datos) return null;
      const d = diasDesde(datos.ultima, hoyISO);
      return d !== null && d >= dias
        ? { prenda: p, veces: datos.veces, ultima: datos.ultima, dias: d, motivo: textoUltimoUso(datos.ultima, hoyISO) }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.dias - a.dias);

  return [...nunca, ...olvidadas].slice(0, limite);
}

/* ===========================================================================
   RECOMENDACIÓN (apartados 7, 8, 9 y 22)
   =========================================================================== */

// Los pesos de la recomendación, con nombre y en un solo sitio. Cada uno se
// corresponde con una frase que el usuario acaba leyendo: si un peso no se
// puede explicar en una línea, sobra.
const PESO = {
  DIA_SIN_USAR: 2,          // cada día que lleva sin usarse, hasta el tope
  TOPE_DIAS: 60,            // más allá de dos meses, "hace mucho" ya no crece
  SIN_ESTRENAR: 90,         // un outfit que nunca se ha usado merece salir
  NO_DISPONIBLE: -140,      // apartado 9: nunca como primera opción
  MISMO_LUGAR: 45,          // apartado 8: señal, no filtro
  MISMA_OCASION: 40,
  MISMA_PERSONA: 25,
  MISMA_ESTACION: 20,
  FAVORITO: 12,
  MUY_REPETIDO: -30,        // por cada uso en la ventana reciente
};

/**
 * Recomienda outfits ordenados, cada uno con sus motivos en texto.
 *
 * NO DECIDE NADA: devuelve una lista puntuada y explicada. Quien la lee sigue
 * pudiendo ponerse lo que quiera — el apartado 6 lo dice expresamente, y la
 * regla 7 del proyecto también.
 *
 * `contexto` es opcional (apartado 7: sin contexto, solo historial +
 * disponibilidad + tiempo). Cuando llega, **suma señales, nunca excluye**
 * (apartado 8, literal: "NO excluir automáticamente otros Outfits"). Ni
 * siquiera las prendas no disponibles excluyen: penalizan tan fuerte que
 * cualquier alternativa completa gana, que es justo lo que pide el apartado 9.
 */
export function recomendarOutfits(usos, outfits, prendas, { hoyISO, contexto = {}, limite = 3 } = {}) {
  const hoy = hoyISO || todayISO();
  const lista = outfits || [];

  if (lista.length === 0) {
    return { suficiente: false, motivo: 'sin_outfits', recomendaciones: [] };
  }
  // Apartado 22: saber cuándo NO hay información suficiente, y decirlo.
  if ((usos || []).length < USOS_MINIMOS_RECOMENDACION) {
    return {
      suficiente: false,
      motivo: 'pocos_usos',
      faltan: USOS_MINIMOS_RECOMENDACION - (usos || []).length,
      recomendaciones: [],
    };
  }

  const indice = indiceUsoOutfits(usos);
  const desdeReciente = desdeHace(DIAS_VENTANA_REPETICION, hoy);
  const recientes = indiceUsoOutfits(usosDelPeriodo(usos, desdeReciente));

  const puntuados = lista.map((outfit) => {
    const datos = indice.get(outfit.id);
    const dias = datos ? diasDesde(datos.ultima, hoy) : null;
    // La LISTA, no el número: hace falta para poder nombrarlas en la interfaz.
    const noDisponibles = prendasNoDisponiblesDeOutfit(outfit, prendas);
    const motivos = [];
    let puntos = 0;

    // --- 1. Tiempo desde el último uso -------------------------------------
    if (dias === null) {
      puntos += PESO.SIN_ESTRENAR;
      motivos.push('todavía no lo has usado nunca');
    } else {
      puntos += Math.min(dias, PESO.TOPE_DIAS) * PESO.DIA_SIN_USAR;
      if (dias >= DIAS_DESCANSADO) motivos.push(`hace ${dias} días que no lo usas`);
      else if (dias <= DIAS_USO_RECIENTE) motivos.push(`lo usaste hace ${dias === 0 ? 'hoy mismo' : `${dias} ${dias === 1 ? 'día' : 'días'}`}`);
    }

    // --- 2. Disponibilidad (apartado 9) ------------------------------------
    if (noDisponibles.length > 0) {
      puntos += PESO.NO_DISPONIBLE;
      motivos.push(`${noDisponibles.length} ${noDisponibles.length === 1 ? 'prenda no está disponible' : 'prendas no están disponibles'}`);
    } else if ((outfit.prendaIds || []).length > 0) {
      motivos.push('todas sus prendas están disponibles');
    }

    // --- 3. Repetición reciente (apartado 6) -------------------------------
    const vecesRecientes = recientes.get(outfit.id)?.veces || 0;
    if (vecesRecientes > 1) {
      puntos += vecesRecientes * PESO.MUY_REPETIDO;
      motivos.push(`lo has usado ${vecesRecientes} veces en los últimos ${DIAS_VENTANA_REPETICION} días`);
    }

    // --- 4. Contexto, como señal (apartado 8) ------------------------------
    if (contexto.lugar) {
      // Cuenta lo que dice el HISTORIAL, no solo el campo `lugar` del outfit:
      // si lo has llevado tres veces a la universidad, eso es más fuerte que
      // una etiqueta que pusiste al crearlo. Se miran los dos.
      const enEseLugar = usosDeOutfit(usos, outfit.id).filter((u) => norm(u.lugar) === norm(contexto.lugar)).length;
      if (enEseLugar > 0) {
        puntos += PESO.MISMO_LUGAR;
        motivos.push(`ya lo has llevado a ${contexto.lugar}`);
      } else if (norm(outfit.lugar) === norm(contexto.lugar)) {
        puntos += PESO.MISMO_LUGAR;
        motivos.push(`lo guardaste como outfit de ${contexto.lugar}`);
      }
    }
    if (contexto.ocasion && outfit.ocasion === contexto.ocasion) {
      puntos += PESO.MISMA_OCASION;
      motivos.push('encaja con la ocasión');
    }
    if (contexto.persona) {
      const conEsaPersona = usosDeOutfit(usos, outfit.id)
        .filter((u) => (u.personas || []).some((x) => norm(x) === norm(contexto.persona))).length;
      const guardadoConEsaPersona = (outfit.personas || []).some((x) => norm(x) === norm(contexto.persona));
      if (conEsaPersona > 0 || guardadoConEsaPersona) {
        puntos += PESO.MISMA_PERSONA;
        motivos.push(`lo has llevado con ${contexto.persona}`);
      }
    }
    if (contexto.estacion && outfit.estacion === contexto.estacion) {
      puntos += PESO.MISMA_ESTACION;
      motivos.push('es de esta temporada');
    }
    if (outfit.favorito) {
      puntos += PESO.FAVORITO;
      motivos.push('es uno de tus favoritos');
    }

    return {
      outfit,
      puntos,
      dias,
      veces: datos?.veces || 0,
      ultima: datos?.ultima || null,
      noDisponibles,
      motivos,
      estado: estadoRepeticion(dias),
    };
  });

  const ordenados = puntuados.sort((a, b) => b.puntos - a.puntos || porNombre(a.outfit, b.outfit));
  return { suficiente: true, motivo: null, recomendaciones: ordenados.slice(0, limite) };
}

// Mismo criterio que `armario.js`: sin acentos ni mayúsculas, porque el lugar y
// las personas los escribe Josué a mano y no va a teclear igual dos veces.
const norm = (s) => String(s || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/* ===========================================================================
   PANEL INTELIGENTE (apartado 14)
   =========================================================================== */

/**
 * Las frases de "Tu armario hoy", generadas a partir de los números reales.
 *
 * Cada frase solo aparece si su dato existe: sin outfits usados esta semana no
 * se dice "0 outfits esta semana", simplemente no está esa línea. Devuelve una
 * lista vacía cuando no hay nada que decir, y quien la pinta enseña entonces
 * el estado vacío del apartado 21.
 */
export function panelInteligente(armario, { hoyISO } = {}) {
  const hoy = hoyISO || todayISO();
  const usos = armario?.usos || [];
  const outfits = armario?.outfits || [];
  const prendas = armario?.prendas || [];
  const frases = [];

  const estaSemana = usosDelPeriodo(usos, desdeHace(7, hoy));
  if (estaSemana.length > 0) {
    const distintos = new Set(estaSemana.map((u) => u.outfitId)).size;
    frases.push({
      id: 'semana',
      texto: `Has registrado ${estaSemana.length} ${estaSemana.length === 1 ? 'uso' : 'usos'} esta semana, con ${distintos} ${distintos === 1 ? 'outfit distinto' : 'outfits distintos'}.`,
    });
  }

  const est = estadisticasOutfits(usos, outfits, { hoyISO: hoy });
  if (est.masUsado && est.masUsado.veces > 1) {
    frases.push({
      id: 'mas_usado',
      texto: `Tu outfit más usado es ${est.masUsado.outfit.nombre}, con ${est.masUsado.veces} usos.`,
      outfitId: est.masUsado.outfit.id,
    });
  }

  const olvidados = outfitsOlvidados(usos, outfits, { hoyISO: hoy });
  if (olvidados.length > 0) {
    frases.push({
      id: 'olvidado',
      texto: `Llevas ${olvidados[0].dias} días sin usar ${olvidados[0].outfit.nombre}.`,
      outfitId: olvidados[0].outfit.id,
    });
  }

  // El índice se construye UNA vez, fuera del filtro. Dentro, reconstruiría el
  // historial entero por cada prenda del armario — que es exactamente el coste
  // que el apartado 18 pide evitar con cientos de prendas y miles de usos.
  const indicePrendas = indiceUsoPrendas(usos, outfits);
  const sinEstrenar = prendas.filter((p) => p.estado === 'disponible' && !indicePrendas.has(p.id));
  if (sinEstrenar.length > 0) {
    frases.push({
      id: 'sin_estrenar',
      texto: `Hay ${sinEstrenar.length} ${sinEstrenar.length === 1 ? 'prenda que todavía no has usado' : 'prendas que todavía no has usado'}.`,
    });
  }

  const repetidas = prendasMuyRepetidas(usos, outfits, prendas, { hoyISO: hoy });
  if (repetidas.length > 0) {
    frases.push({
      id: 'repetida',
      texto: `${repetidas[0].prenda.nombre}: ${repetidas[0].texto}`,
      prendaId: repetidas[0].prenda.id,
    });
  }

  return frases;
}

/**
 * Resumen de una línea para el hub de Gestión y para la cabecera. Se apoya en
 * lo de arriba, no recalcula nada.
 */
export function resumenInteligencia(armario, hoyISO) {
  const usos = armario?.usos || [];
  const div = diversidadArmario(usos, armario?.outfits, armario?.prendas, { desde: desdeHace(30, hoyISO) });
  return {
    hayDatos: usos.length >= USOS_MINIMOS_ESTADISTICAS,
    puedeRecomendar: usos.length >= USOS_MINIMOS_RECOMENDACION,
    diversidad: div.porcentaje,
  };
}
