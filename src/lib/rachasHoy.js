/* ===========================================================================
   ENTREGA 3 · FASE 2 — RACHAS: MANTENIMIENTO DIARIO Y FEEDBACK DE RECOMPENSA
   ===========================================================================

   *"El apartado Rachas actual está funcionando muy bien y NO debe ser
   rediseñado. […] La prioridad de esta fase es añadir una capa muy pequeña de
   mantenimiento diario + recompensa visual."*

   Eso es literalmente lo que hay aquí, y por eso es un archivo de treinta
   líneas útiles y no un módulo:

   🚨 **ESTE ARCHIVO NO ESCRIBE NADA.** Ni una función que sume un día, ni una
   que registre, ni una que toque el estado. El apartado 9 lo dice con todas las
   letras: *"No crear un botón independiente para 'sumar racha'. La racha debe
   seguir dependiendo del registro real de la acción correspondiente"*, y el 10
   remata: *"si el usuario ya registra un hábito desde Hábitos, ese registro
   debe ser suficiente"*. Quien escribe sigue siendo `rachasServicio.js` (RA F2),
   el único sitio del proyecto que puede.

   ⚠️ **Y NO CALCULA RACHAS.** Los números salen de `panelRachas` y
   `panelHabitos`, que ya existen desde RA F1 y RA F4. Aquí solo se juntan las
   dos listas y se cuenta cuántas necesitan una acción HOY — que es la pregunta
   nueva que hace esta fase y que no contestaba nadie.

   ⚠️ **Las dos listas se juntan a propósito, y sin duplicar.** Un hábito de
   Productividad tiene su racha (`rachaDeHabito`, RA F1) y una racha del Centro
   de Rachas es otra cosa; las dos son "algo que mantener hoy" para Josué, así
   que en la pantalla de Hoy van juntas. Lo que NO se hace es contar dos veces la
   misma: cada entrada lleva su `origen` y su id, y los ids no se solapan porque
   vienen de dos almacenes distintos.
   =========================================================================== */

import { todayISO } from './helpers';
import { ESTADOS_DIA } from './rachas';
import { panelRachas, panelHabitos } from './rachasServicio';

/* Los dos estados del apartado 5. Son TEXTOS, no objetos — la lección de EH F21,
   donde leer `.nombre` de una cadena dejó media pantalla en blanco. */
export const TEXTOS_MANTENIMIENTO = {
  pendiente: 'Mantén tus rachas',
  completado: 'Rachas mantenidas',
};

/** Cuántas rachas piden una acción hoy, y cuántas ya están hechas.
 *
 *  Devuelve `null` cuando no hay ninguna racha activa — apartado 2, y es `null`
 *  y no un objeto con ceros a propósito: la lección de EH F25. Un cero pintaría
 *  "0 por mantener hoy" todos los días en el Dashboard de alguien que no usa
 *  rachas, que es justo *"que el Dashboard no se llene de elementos
 *  innecesarios"*. */
export function mantenimientoHoy(rachas, habitos, hoy = todayISO()) {
  const deRachas = panelRachas(rachas, hoy).rachas
    .map((r) => ({ id: r.id, nombre: r.nombre, actual: r.actual, estadoHoy: r.estadoHoy, origen: 'racha' }));
  const deHabitos = panelHabitos(habitos, hoy).rachas
    .map((r) => ({ id: r.habitoId, nombre: r.nombre, actual: r.actual, estadoHoy: r.estadoHoy, origen: 'habito' }));

  // ⚠️ Solo las que hoy PIDEN algo o ya se han hecho hoy. Una racha semanal cuyo
  // día no es hoy tiene `estadoHoy: 'futuro'` o `'perdido'`, y meterla en "por
  // mantener hoy" sería pedirle a Josué algo que hoy no toca.
  const lista = [...deRachas, ...deHabitos].filter(
    (r) => r.estadoHoy === ESTADOS_DIA.PENDIENTE || r.estadoHoy === ESTADOS_DIA.COMPLETADO,
  );
  if (lista.length === 0) return null;

  const pendientes = lista.filter((r) => r.estadoHoy === ESTADOS_DIA.PENDIENTE);
  const completadas = lista.filter((r) => r.estadoHoy === ESTADOS_DIA.COMPLETADO);

  return {
    lista,
    total: lista.length,
    pendientes: pendientes.length,
    completadas: completadas.length,
    nombresPendientes: pendientes.map((r) => r.nombre),
    todoHecho: pendientes.length === 0,
  };
}

/** La frase del bloque, con las palabras del apartado 5. */
export function textoMantenimiento(m) {
  if (!m) return null;
  return m.todoHecho
    ? { titulo: TEXTOS_MANTENIMIENTO.completado, detalle: `${m.completadas}/${m.total} completadas` }
    : {
      titulo: TEXTOS_MANTENIMIENTO.pendiente,
      detalle: `${m.pendientes} ${m.pendientes === 1 ? 'racha necesita' : 'rachas necesitan'} registro`,
    };
}

/* ===========================================================================
   EL FEEDBACK DE SUBIR LA RACHA (apartados 6, 7 y 8)
   ===========================================================================

   *"Cuando el usuario registra correctamente una acción que mantiene una racha,
   debe existir una pequeña recompensa visual. […] La animación debe ser rápida
   y elegante. NO hacer una animación exageradamente larga."*

   ⚠️ **Esto compara dos números, no guarda nada.** Un "ya te celebré esto" en
   disco sería un contador, y el motor de rachas lleva desde RA F1 sin guardar ni
   uno: todo se deriva del historial. Quien llama tiene el número de antes en el
   render anterior, que es donde vive esa información de verdad.

   ⚠️ **Y no es gamificación** (D2-02): no hay puntos, ni niveles, ni monedas.
   Es un "+1" que se apaga en 900 ms — el apartado 7 pide expresamente que sea
   corto. */
export const DURACION_FEEDBACK_MS = 900;

export function feedbackDeSubida(antes, despues) {
  // ⚠️ `null` no es cero (EH F32): si no sabemos cómo estaba antes —primera
  // pintada, racha recién creada— no hay subida que celebrar, porque no hay
  // nada con qué comparar. Celebrarlo igual sería inventarse un logro.
  if (antes === null || antes === undefined) return null;
  if (!Number.isFinite(antes) || !Number.isFinite(despues)) return null;
  if (despues <= antes) return null;
  return {
    dias: despues,
    subida: despues - antes,
    texto: `+${despues - antes}`,
    // El apartado 8 quiere el número de días a la vista, no solo el "+1".
    textoDias: `${despues} ${despues === 1 ? 'día' : 'días'}`,
  };
}
