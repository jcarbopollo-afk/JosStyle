/* ===========================================================================
   ENTREGA 4 · FASE 16/45 — LA PANTALLA DE RANGOS (lo que decide)

   *"NO vuelvas a implementar la lógica de rangos. La UI debe consumir las
   funciones existentes."*

   🚨 **Aquí no se calcula ni un rango.** Todo sale de `src/lib/rangos.js`
   (F15): `rangoGlobal` ya devuelve los ejercicios con rango, los siete grupos
   y la cobertura. Este archivo solo **ordena y redacta** lo que la pantalla
   enseña —los diez rangos con su estado, cuántos ejercicios están
   clasificados, qué frase toca cuando no hay rango— para que `FitnessView` no
   tenga que saber nada de puntuaciones (regla 3: `lib` decide, `views` pinta).

   ⚠️ Y se pide **una sola vez**: `rangoGlobal` recorre todas las sesiones, así
   que la pantalla llama a `pantallaDeRangos` en un `useMemo` y reparte el
   resultado (apartado 22, *"no recalcular todos los rangos varias veces
   durante un mismo render"*).
   =========================================================================== */

import { GRUPOS_MUSCULARES, NIVELES_RANGO, SIN_RANGO, nivelRango } from './fitness.js';
/* El catálogo entero —el de siempre más los suyos— para poder decir «3 de 40». */
import { ejerciciosParaLeer } from './ejercicios.js';
import { RANK_THRESHOLDS, estadoDeRango, progresoHaciaSiguiente } from './rangos.js';
/* 🔓 FIT F19 — el global sale del motor, que es quien decide si un ejercicio
   cuenta por su estimación, por sus entrenamientos o por los dos. */
import { rangoGlobalEfectivo } from './motorRangos.js';
/* FIT F24 — cuántos RECOMIENDA clasificar la cola priorizada, que no es lo
   mismo que cuántos quedan sin clasificar del catálogo entero (apartado 18). */
import { colaDeClasificacion } from './colaClasificacion.js';

const lista = (x) => (Array.isArray(x) ? x : []);

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LO QUE SE DICE CUANDO NO HAY RANGO (apartados 4 y 12)
   ═══════════════════════════════════════════════════════════════════════════
   🚨 Las tres situaciones son distintas y se dicen distinto. «Sin rango» a
   secas dejaría a Josué sin saber si le falta entrenar o le falta variedad:
   con press de banca repetido cien veces **sigue sin haber rango global**, y
   eso hay que explicarlo, no esconderlo detrás de la misma frase. */
export const MOTIVOS_SIN_RANGO = {
  /* ⚠️ La frase de «sin datos» es la que ya escribió la F1 (`SIN_RANGO.que`), no
     una nueva: la pantalla de Fitness y ésta dicen lo mismo con las mismas
     palabras, que es de lo que va el apartado 4 —*"Completa al menos un
     ejercicio"*— sin dejar dos versiones sueltas del mismo aviso. */
  sin_datos: {
    titulo: SIN_RANGO.nombre,
    que: SIN_RANGO.que,
  },
  poca_cobertura: {
    titulo: SIN_RANGO.nombre,
    que: 'Necesitas más ejercicios clasificados para obtener un rango global.',
  },
};

/** La frase del apartado 4 según por qué no hay rango. */
export function explicacionSinRango(global) {
  if (!global || !global.sinRango) return null;
  return MOTIVOS_SIN_RANGO[global.motivo] || MOTIVOS_SIN_RANGO.sin_datos;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LA COBERTURA (apartado 5)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ *"Esto NO representa progreso físico. Representa cantidad de información
   disponible"*. Por eso la frase dice **«con datos»** y no «completado», y por
   eso la barra lleva su propia etiqueta en la pantalla. */
export function textoDeCobertura(cobertura) {
  const c = cobertura || {};
  const grupos = Number(c.grupos) || 0;
  const total = Number(c.total) || GRUPOS_MUSCULARES.length;
  return {
    texto: `${grupos} de ${total} grupos con datos`,
    fraccion: total > 0 ? Math.max(0, Math.min(1, grupos / total)) : 0,
    grupos,
    total,
    ejercicios: Number(c.ejercicios) || 0,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LOS DIEZ RANGOS (apartados 7 y 8)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Los diez, en orden, con su estado y la puntuación a la que empiezan.
 *
 * ⚠️ **Contradicción entre fases, resuelta y anotada.** La F15 (apartado 5)
 * dice que *no es necesario mostrar el número*, y su lista de exclusiones
 * prohíbe enseñar la puntuación; la F16 (apartado 8) pide *"Score necesario:
 * XXXX"* al abrir un rango. Lectura elegida: **el umbral de la escala sí, la
 * puntuación de Josué no**. El umbral es una propiedad fija del rango (como el
 * nombre), igual para todos; su puntuación es el dato personal que la F15
 * quería callar, y sigue sin aparecer en ningún sitio.
 */
export function escalaDeRangos(actual = null) {
  return NIVELES_RANGO.map((n) => ({
    ...n,
    estado: estadoDeRango(n.orden, actual),
    /* El umbral en el que empieza este rango. El primero empieza en 0: no es
       «necesitas 0 puntos», es «con cualquier dato ya estás dentro». */
    umbral: RANK_THRESHOLDS[n.orden - 1],
  }));
}

/** Lo que enseña la hoja del apartado 8 al tocar un rango. */
export function detalleDeRango(orden, actual = null) {
  const n = nivelRango(orden);
  if (!n) return null;
  const estado = estadoDeRango(orden, actual);
  const mensajes = {
    actual: 'Es tu rango ahora mismo.',
    conseguido: 'Ya lo has superado.',
    bloqueado: 'Continúa mejorando tu rendimiento para alcanzarlo.',
    no_disponible: 'Clasifica ejercicios para saber dónde estás en la escala.',
  };
  return { ...n, estado, umbral: RANK_THRESHOLDS[orden - 1], mensaje: mensajes[estado] };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · CLASIFICAR EJERCICIOS (apartado 9)
   ═══════════════════════════════════════════════════════════════════════════
   *"Debe indicar cuántos ejercicios tienen rango y cuántos todavía no."*

   🚨 **Clasificado = tiene rango de verdad**, es decir, tiene series marcadas
   que la F11 sabe medir. No vale contar los que aparecen en alguna sesión: un
   ejercicio apuntado y no hecho no está clasificado, y decir que sí sería
   exactamente el «dato falso» que prohíbe el apartado 25. */
export function clasificacionDeEjercicios(global, propios = [], fitness = null) {
  const clasificados = lista(global && global.ejercicios).length;
  /* 🔓 FIT F35, apartado 37: un archivado con rango se sigue contando, así que
     también entra en el total — si no, «101 de 100». */
  const total = ejerciciosParaLeer(lista(propios), lista(global && global.ejercicios).map((e) => e && e.exerciseId)).length;
  /* 🔓 **FIT F24, apartado 18 — el contador pasa a ser el de RECOMENDADOS.** La
     F17 ya lo había acotado a la tanda de catorce para no prometer cien
     preguntas; el apartado 18 va un paso más allá: el número que se enseña es
     el que el sistema **espera** que conteste, no lo que queda. El recuento de
     arriba («0 de 100 clasificados») sí es del catálogo entero: son dos números
     distintos y miden cosas distintas. */
  const recomendados = fitness ? colaDeClasificacion(fitness, { propios: lista(propios) }).cola.length : 0;
  return {
    clasificados,
    total,
    restantes: Math.max(0, total - clasificados),
    recomendados,
    texto: `${clasificados} de ${total} clasificados`,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LOS RANKINGS MUSCULARES (apartados 11 a 15)
   ═══════════════════════════════════════════════════════════════════════════
   El orden es el **anatómico del catálogo** —brazos, piernas, espalda, pecho,
   hombros, abdominales, cuello—, que ya es el del apartado 14. 🚨 Nunca por
   puntuación: *"el usuario debe reconocer fácilmente siempre dónde está cada
   grupo"*, y una lista que se reordena sola esconde justo el grupo flojo. */
export function rankingsMusculares(global) {
  const porId = new Map(lista(global && global.grupos).map((g) => [g.id, g]));
  return GRUPOS_MUSCULARES.map((g) => {
    const r = porId.get(g.id) || null;
    const sinRango = !r || r.sinRango;
    return {
      id: g.id,
      nombre: g.nombre,
      sinRango,
      rango: sinRango ? null : r.rango,
      /* ⚠️ Apartado 12 — un grupo sin datos dice «Sin rango» y «Sin datos», no
         un rango 1 de consolación ni un 0 %. */
      nombreRango: sinRango ? SIN_RANGO.nombre : r.nombre,
      provisional: !sinRango && !!r.provisional,
      ejercicios: sinRango ? 0 : r.ejercicios,
      dataPoints: sinRango ? 0 : r.dataPoints,
      datos: sinRango ? 'Sin datos' : `${r.ejercicios} ${r.ejercicios === 1 ? 'ejercicio' : 'ejercicios'}`,
      siguiente: sinRango ? null : progresoHaciaSiguiente(r.score),
      subgrupos: lista(r && r.subgrupos),
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · TODO JUNTO, UNA SOLA VEZ (apartado 22)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Lo que la pantalla necesita, pidiendo `rangoGlobal` **una vez**.
 *
 * ⚠️ Con datos corruptos no se cae: `rangoGlobal` ya ignora lo que no entiende
 * y aquí todo lo que se lee va con su valor por defecto (apartado 21,
 * *"mostrar únicamente los elementos válidos"*).
 */
export function pantallaDeRangos(fitness, { propios = [], perfil = null } = {}) {
  const global = rangoGlobalEfectivo(fitness || {}, { propios: lista(propios), perfil });
  const nivel = global.sinRango ? null : nivelRango(global.rango);
  return {
    global,
    nivel,
    /* La descripción corta del apartado 3: la del propio rango, que ya viene
       escrita en la F1, no una frase nueva por cada pantalla. */
    descripcion: nivel ? nivel.que : null,
    sinRango: explicacionSinRango(global),
    cobertura: textoDeCobertura(global.cobertura),
    /* Apartado 6 — el camino al siguiente solo existe si hay rango. */
    siguiente: global.sinRango ? null : progresoHaciaSiguiente(global.score),
    escala: escalaDeRangos(global.sinRango ? null : global.rango),
    clasificacion: clasificacionDeEjercicios(global, propios, fitness || {}),
    musculos: rankingsMusculares(global),
  };
}

/* Lo que esta fase NO trae, para que la siguiente no lo dé por hecho. */
export const NO_EN_FIT16 = [
  { que: 'El cuestionario de clasificación', porque: 'Apartado 9: *"en esta fase NO construir todavía el cuestionario"*. La sección cuenta cuántos hay clasificados y no ofrece un botón que no clasifique nada (regla 8 del proyecto: nada decorativo).' },
  { que: 'La anatomía ilustrada con vista frontal y posterior', porque: 'Apartado 10: *"utilizar la ilustración anatómica existente si ya existe"*. No existe: el proyecto no tiene ese dibujo y no se inventa uno. «Tu cuerpo» usa los iconos reales del catálogo, y cada uno lleva al detalle de la F13, que sí funciona.' },
  { que: 'Anatomía interactiva, IA, leaderboard, XP y logros', porque: 'Apartado 26.' },
  { que: 'Enseñar la puntuación de Josué', porque: 'F15, apartado 5. Los umbrales de la escala sí se ven (apartado 8 de esta fase); su puntuación no.' },
];

export const DECISIONES_FIT16 = [
  { que: 'La pantalla pide `rangoGlobal` una vez y reparte', porque: 'Apartado 22 y regla 3: `rangoGlobal` ya devuelve grupos, ejercicios y cobertura; volver a pedirlos por sección recorrería las sesiones ocho veces.' },
  { que: 'Tocar un grupo muscular abre el detalle de la F13 en Progreso', porque: 'Apartado 15: *"no duplicar pantallas"*. Rangos manda el foco y Progreso lo abre, igual que el foco de Inicio abre Entrenamiento.' },
  { que: 'Sin ilustración anatómica, «Tu cuerpo» son los siete iconos del catálogo', porque: 'Apartado 10: *"no crear botones que parezcan funcionar y no hagan nada"*. Los iconos llevan al detalle real, así que son entrada, no decoración.' },
];
