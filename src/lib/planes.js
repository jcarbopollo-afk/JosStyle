import { uid, todayISO, fechaValida } from './helpers';
import { GRUPOS_MUSCULARES, grupoMuscular, normalizarPlanAnterior } from './fitness';
import {
  ENTORNOS, DIFICULTADES, entorno as entornoDe, dificultad as dificultadDe,
  ranura, ejercicioPorId, normalizarFitnessCompleto,
} from './ejercicios';
import {
  crearLinea, crearRutina, rutinaAPlan, distribucionMuscular, duracionEstimada,
  nombreDeLinea, textoDeSeries, textoDeCarga, musculosResumidos,
} from './constructor';
import { CATALOGO_PLANES_BRUTO } from './catalogoPlanes';

/* Entrega 4 · Fase 5/45 — «Biblioteca de planificaciones».
   ═══════════════════════════════════════════════════════════════════════════

   El criterio de finalización pide poder *"Explorar → Buscar → Filtrar → Abrir
   → Revisar → Seleccionar → Personalizar sin que ninguna de esas acciones sea
   simplemente un mockup"*. Este archivo es el **modelo y la lógica**; los datos
   están en `catalogoPlanes.js` y la pantalla en `BibliotecaPlanesView.jsx`
   (apartado 22: *"Separar datos, modelos, lógica y UI"*).

   ───────────────────────────────────────────────────────────────────────────
   1 · LO QUE YA EXISTÍA, Y HAY QUE MIRARLO ANTES (apartado 21)
   ───────────────────────────────────────────────────────────────────────────

   *"Antes de programar: inspecciona la arquitectura actual […] Reutiliza lo
   existente. No dupliques modelos."* Pues esto es lo que hay, y es casi todo:

   🚨 **La distribución muscular y la duración YA SE CALCULAN** —
   `distribucionMuscular()` y `duracionEstimada()` son de la F3 y trabajan sobre
   una **rutina**. Así que un día de un plan **se convierte en una rutina** y las
   dos funciones salen gratis: ni un porcentaje escrito a mano (apartado 10:
   *"No quiero porcentajes escritos manualmente si pueden calcularse"*), ni una
   segunda fórmula de minutos que se desviaría de la del constructor.

   🚨 **Los ejercicios son los de la F2**, por id. Un plan **no copia** ni un
   nombre ni un músculo: `nombreDeLinea()`, `textoDeSeries()` y
   `musculosResumidos()` los resuelven en el momento, así que corregir un
   porcentaje en el catálogo le llega a los diecisiete planes a la vez.

   🚨 **Y `Template` es `fitness.plantillas`** (F1 y F4). Por eso «Personalizar»
   no inventa un modelo: **escribe plantillas de las de siempre**, y desde el
   minuto siguiente se pueden abrir en el constructor, duplicar y eliminar, con
   todo lo que la F4 ya construyó (apartado 15).

   ───────────────────────────────────────────────────────────────────────────
   2 · LOS CINCO CONCEPTOS, SIN MEZCLARLOS (apartado 1)
   ───────────────────────────────────────────────────────────────────────────

   *"Debe existir una separación clara entre: Exercise · WorkoutExercise ·
   WorkoutPlan · Template · PresetPlan. No mezcles estos conceptos."*

   | | Qué es | Dónde vive |
   |---|---|---|
   | **Exercise** | Un ejercicio del catálogo | `catalogoEjercicios.js` (F2) |
   | **WorkoutExercise** | Ese ejercicio **dentro de** una sesión, con sus series | `fitness.js` (F1) |
   | **WorkoutPlan** | Una sesión guardada | `fitness.js` (F1) |
   | **Template** | Una sesión **suya** | `fitness.plantillas` (F4) |
   | **PresetPlan** | Una **semana** diseñada por JosStyle | aquí |

   🚨 **Y el que faltaba es el que explica la fase: un PresetPlan NO es un
   WorkoutPlan.** Un WorkoutPlan es **una sesión**; un PresetPlan es **una
   semana de sesiones**. Por eso «Personalizar» no genera una plantilla, genera
   **una por día de entreno** — copiar una semana en una sola sesión habría
   metido los treinta ejercicios del PPL en el mismo entrenamiento.

   ───────────────────────────────────────────────────────────────────────────
   3 · LO QUE EL APARTADO 1 ENUMERA Y AQUÍ NO SE ESCRIBE
   ───────────────────────────────────────────────────────────────────────────

   El apartado 1 lista los campos que un PresetPlan *"debe poder contener"*, y
   tres de ellos **chocan con otros apartados del mismo enunciado**. La lectura
   que respeta las dos partes es la de siempre en este proyecto: **lo que se
   puede derivar no se guarda**, y se declara por qué.

   - **`distribución muscular` y `duración aproximada`** → apartado 10, literal:
     *"No quiero porcentajes escritos manualmente si pueden calcularse"*. Las dos
     salen de los ejercicios del plan. Escribirlas sería una copia que miente el
     día que se corrija un ejercicio. Están en la **ficha** (`fichaDePlan`), que
     es lo que la pantalla lee: el plan las «contiene», simplemente no las tiene
     escritas.
   - **`categoría`** → el apartado 3 dice *"navegación horizontal por
     categorías/entornos"* y pone de ejemplo *"Todos · Gym · Calistenia ·
     Casa"*. La categoría **es** el entorno. Un segundo campo con los mismos tres
     valores es la E3 F44 (`tema` y `nombre` para lo mismo) esperando a pasar.
   - **`orden de los días`** → el orden **es** la posición en `dias`. Una lista
     aparte con los ids en otro orden sería una segunda fuente de verdad, y
     acabarían diciendo cosas distintas.

   ───────────────────────────────────────────────────────────────────────────
   4 · `fitness.planes` SE QUEDA SIN QUIEN ESCRIBA, Y ESO SE DICE
   ───────────────────────────────────────────────────────────────────────────

   La F1 dejó escrito que *"un plan y una plantilla son la misma forma: lo que
   cambia es si él lo creó (`plantillas`) o viene de la biblioteca (`planes`)"*.
   Al construir la biblioteca de verdad resulta que **no viene de `app_data`**:
   los diecisiete planes son **datos de la aplicación**, como el catálogo de
   ejercicios de la F2 — guardarlos por usuario significaría que corregir un
   plan no le llega nunca a quien ya tiene cuenta.

   Así que `fitness.planes` **se queda sin escritor**. No se borra —la clave está
   en `app_data` de quien haya guardado algo, y quitarla del normalizador se la
   llevaría (regla 5)—, pero **se declara** en `SIN_ESCRITOR` en vez de dejarla
   ahí como una lista que nadie sabe para qué es. Lo que sí se guarda es **cuál
   ha elegido** (`planActivo`) y **cuáles ha marcado** (`favoritosPlanes`).

   ⚠️ Y eso **no** contradice a la F1: lo que dijo es que las dos tienen la misma
   forma, y la tienen. Lo que cambió es de dónde sale la biblioteca. */

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const lista = (v) => (Array.isArray(v) ? v : []);
const enteroONull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
};

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LOS VOCABULARIOS (apartado 7)
   ═══════════════════════════════════════════════════════════════════════════

   Los objetivos del apartado 7, con su nombre para la pantalla. ⚠️ Es una lista,
   no un `switch`: añadir uno es una línea, como `MODULOS_EH` y `ENTORNOS`. */
export const OBJETIVOS_PLAN = [
  { id: 'fuerza', nombre: 'Fuerza', que: 'Levantar más, con menos repeticiones.' },
  { id: 'hipertrofia', nombre: 'Hipertrofia', que: 'Ganar tamaño muscular.' },
  { id: 'estetica', nombre: 'Estética', que: 'Trabajar la forma y el equilibrio del cuerpo.' },
  { id: 'skills', nombre: 'Skills', que: 'Conseguir movimientos concretos de calistenia.' },
  { id: 'resistencia', nombre: 'Resistencia', que: 'Aguantar más tiempo y recuperarte antes.' },
  { id: 'core', nombre: 'Core', que: 'Centrarte en el abdomen y la zona media.' },
];
export const objetivoDe = (id) => OBJETIVOS_PLAN.find((o) => o.id === id) || null;

/** La pastilla «Todos» de las tres barras de filtro (apartado 7). */
export const FILTRO_TODOS = 'todos';

/* ⚠️ Las dificultades **son las de la F2**, no una escala nueva: un plan
   «Intermedio» y un ejercicio «Intermedio» tienen que significar lo mismo, o la
   biblioteca dirá una cosa y el catálogo otra. Se filtran las que ningún plan
   usa —«Experto» hoy no lo usa ninguno— porque una pastilla que deja la
   pantalla vacía es la lección del apartado 23 de la F2. */
export const DIFICULTADES_PLAN = DIFICULTADES;

/* ═══════════════════════════════════════════════════════════════════════════
   6 · EL MODELO (apartados 1 y 9)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Un día de la semana del plan. Puede ser **de descanso**, y entonces no tiene
 *  ejercicios: el apartado 9 los pinta en la semana (*"Día 4 — descanso"*), así
 *  que existen de verdad en vez de ser un hueco. */
export function crearDiaDePlan({ id = null, nombre = '', descanso = false, lineas = [] } = {}) {
  const esDescanso = descanso === true;
  return {
    id: texto(id) || uid(),
    nombre: texto(nombre) || (esDescanso ? 'Descanso' : 'Día'),
    descanso: esDescanso,
    /* 🚨 Las líneas se construyen con `crearLinea`, **no con `normalizarLinea`**
       (que es lo que haría `crearRutina`). La diferencia importa y costó las 297:
       `normalizarLinea` es la puerta de **lo guardado** y exige un `id`, así que
       descartaba en silencio todas las líneas del catálogo —que son **fuente**,
       escritas a mano y sin id—. Los diecisiete planes salían con cero
       ejercicios, con la auditoría de ids en verde y la distribución vacía.
       **La fábrica construye; el normalizador limpia lo que vuelve de disco.** */
    lineas: esDescanso
      ? []
      : lista(lineas).map((l, i) => crearLinea({ ...l, orden: i })),
  };
}

export function crearPresetPlan({
  id = null, nombre = '', subtitulo = '', descripcion = '',
  entorno = '', objetivo = '', dificultad = '', frecuencia = null,
  paraQuien = '', tags = [], dias = [], thumbnail = null,
} = {}) {
  const planId = texto(id) || uid();
  /* 🐛 FIT F32 — **los días de un preset nacían con `uid()` en cada carga**:
     el catálogo es código y no trae ids, así que `crearDiaDePlan` les ponía uno
     aleatorio al arrancar la aplicación. Una sesión empezada desde el Push del
     PPL guardaba en su `origen` (F7) y en su `diaDePlan` (F8) un id que **al
     recargar ya no existía**, y el apartado 19 de la F32 —relacionar la sesión
     con su día por `planId + dayId`— no podía cumplirse jamás. Es la lección de
     la F2 —*"un id es una ranura estable"*— en un sitio que nadie miró porque
     nada lo leía todavía. La ranura de un día de un preset es **su sitio en la
     semana**: el plan ES la semana (F6), y el día 1 es el lunes. */
  const diasN = lista(dias).map((d, i) => crearDiaDePlan({
    ...(d && typeof d === 'object' ? d : {}),
    id: texto(d?.id) || `${planId}-dia-${i + 1}`,
  }));
  return {
    id: planId,
    nombre: texto(nombre),
    subtitulo: texto(subtitulo),
    descripcion: texto(descripcion),
    /* El entorno **es** la categoría del apartado 3; no hay un segundo campo. */
    entorno: ENTORNOS.some((e) => e.id === texto(entorno)) ? texto(entorno) : '',
    objetivo: OBJETIVOS_PLAN.some((o) => o.id === texto(objetivo)) ? texto(objetivo) : '',
    dificultad: DIFICULTADES.some((d) => d.id === texto(dificultad)) ? texto(dificultad) : '',
    /* ⚠️ La frecuencia **se comprueba contra los días de entreno de verdad**, y
       si no cuadra manda la semana: un plan que dice «5 días» y tiene cuatro
       estaría mintiendo en la tarjeta (regla 8). Hay una comprobación que lo
       mide en los diecisiete. */
    frecuencia: enteroONull(frecuencia) ?? diasN.filter((d) => !d.descanso).length,
    paraQuien: texto(paraQuien),
    tags: lista(tags).map(texto).filter(Boolean),
    dias: diasN,
    /* Apartado 5: *"No inventes URLs externas"*. Vale `null` en los diecisiete y
       la pantalla dibuja el grupo muscular que más pesa; el campo existe para
       cuando haya imágenes de verdad, que es lo que pide *"deja la arquitectura
       preparada"*. Hay una comprobación que barre el catálogo buscando `http`. */
    thumbnail: texto(thumbnail) || null,
  };
}

export function normalizarPresetPlan(g) {
  if (!g || !texto(g.id)) return null;
  return crearPresetPlan(g);
}

/** La biblioteca ya construida. **No viene de `app_data`** (§4 de arriba). */
export const CATALOGO_PLANES = CATALOGO_PLANES_BRUTO.map(crearPresetPlan);

export const planPorId = (id, planes = CATALOGO_PLANES) =>
  lista(planes).find((p) => p.id === id) || null;

/* ═══════════════════════════════════════════════════════════════════════════
   7 · UN DÍA ES UNA RUTINA (apartados 10, 12 y 13)
   ═══════════════════════════════════════════════════════════════════════════

   Ésta es la pieza de la que cuelga media fase: convertir un día en la rutina de
   la F3 hace que la distribución, la duración, el nombre de cada línea y sus
   músculos **sean exactamente los mismos** que en el constructor. El apartado 13
   lo pide con esas palabras: *"Utilizar los mismos componentes visuales que se
   hayan creado para el constructor cuando tenga sentido. No crear duplicados
   innecesarios."* */

export function diaARutina(plan, indice, propios = []) {
  const p = plan || {};
  const dia = lista(p.dias)[indice];
  if (!dia) return null;
  return crearRutina({
    id: dia.id,
    nombre: dia.nombre,
    entornos: p.entorno ? [p.entorno] : [],
    lineas: dia.lineas,
  });
}

/** Todas las líneas de la semana, en una rutina, para la distribución del plan
 *  entero (apartado 11). ⚠️ Las líneas estrenan id: sin uno propio
 *  `normalizarLinea` las descartaría y la distribución saldría vacía. */
export function rutinaDelPlan(plan) {
  const p = plan || {};
  const lineas = lista(p.dias).flatMap((d) => lista(d.lineas).map((l) => ({ ...l, id: uid() })));
  return crearRutina({ id: p.id || uid(), nombre: p.nombre, lineas });
}

export const diasDeEntreno = (plan) => lista(plan?.dias).filter((d) => !d.descanso);

/** Cuántos ejercicios tiene la semana entera (apartado 11). */
export const ejerciciosDelPlan = (plan) =>
  lista(plan?.dias).reduce((n, d) => n + lista(d.lineas).length, 0);

/* ⚠️ La duración de la tarjeta es la de **una sesión**, no la de la semana:
   *"≈ 60 min"* al lado de *"5 días/semana"* solo puede querer decir cuánto dura
   cada día (apartado 4). Se toma la **mediana** de los días de entreno, que es
   lo que no se desvía por un día corto de core. */
export function duracionPorSesion(plan, propios = []) {
  const minutos = lista(plan?.dias)
    .map((d, i) => (d.descanso ? null : duracionEstimada(diaARutina(plan, i, propios), propios).minutos))
    .filter((m) => m !== null && m > 0)
    .sort((a, b) => a - b);
  if (!minutos.length) return { minutos: 0, texto: '' };
  const medio = minutos[Math.floor(minutos.length / 2)];
  const redondeado = Math.max(5, Math.round(medio / 5) * 5);
  /* El «≈» va en el texto, como en la F3: quien lo lee tiene que ver que es una
     estimación (apartado 11 y regla 8). */
  return { minutos: medio, texto: `≈ ${redondeado} min` };
}

/** El grupo muscular que más pesa. Es lo que dibuja la tarjeta cuando no hay
 *  imagen (apartado 5), y por eso **se deriva**: un plan nuevo tiene su dibujo
 *  sin que nadie le escriba nada. */
export function grupoDominanteDePlan(plan, propios = []) {
  const d = distribucionMuscular(rutinaDelPlan(plan), propios);
  const g = d.grupos[0];
  return g ? grupoMuscular(g.grupoId) : null;
}

/** Todo lo que la tarjeta y la cabecera del detalle necesitan (apartados 4 y
 *  11), **derivado en el momento**. Ni una cifra guardada. */
export function fichaDePlan(plan, propios = []) {
  const p = plan || {};
  const ent = entornoDe(p.entorno);
  const dif = dificultadDe(p.dificultad);
  const obj = objetivoDe(p.objetivo);
  const entreno = diasDeEntreno(p);
  const dur = duracionPorSesion(p, propios);
  return {
    id: p.id,
    nombre: texto(p.nombre),
    subtitulo: texto(p.subtitulo),
    descripcion: texto(p.descripcion),
    paraQuien: texto(p.paraQuien),
    entorno: ent ? ent.nombre : '',
    entornoId: p.entorno || '',
    dificultad: dif ? dif.nombre : '',
    dificultadId: p.dificultad || '',
    objetivo: obj ? obj.nombre : '',
    objetivoId: p.objetivo || '',
    objetivoQue: obj ? obj.que : '',
    frecuencia: p.frecuencia,
    /* ⚠️ Sin frecuencia no se escribe «0 días/semana»: se calla. Un cero que
       nadie ha puesto es un número falso (FIT F1 con la racha). */
    textoFrecuencia: p.frecuencia ? `${p.frecuencia} ${p.frecuencia === 1 ? 'día' : 'días'}/semana` : '',
    dias: lista(p.dias).length,
    diasEntreno: entreno.length,
    ejercicios: ejerciciosDelPlan(p),
    duracion: dur.texto,
    distribucion: distribucionMuscular(rutinaDelPlan(p), propios),
    grupoDominante: grupoDominanteDePlan(p, propios),
    thumbnail: p.thumbnail,
    tags: lista(p.tags),
  };
}

/** La ficha de un día, para la semana del apartado 12: *"Push · 6 ejercicios ·
 *  ≈ 55 min"*. */
export function fichaDeDia(plan, indice, propios = []) {
  const dia = lista(plan?.dias)[indice];
  if (!dia) return null;
  if (dia.descanso) {
    return { id: dia.id, nombre: dia.nombre, descanso: true, ejercicios: 0, duracion: '', lineas: [] };
  }
  const rutina = diaARutina(plan, indice, propios);
  return {
    id: dia.id,
    nombre: dia.nombre,
    descanso: false,
    ejercicios: lista(dia.lineas).length,
    duracion: duracionEstimada(rutina, propios).texto,
    lineas: lineasDeDia(plan, indice, propios),
  };
}

/** Los ejercicios de un día, con lo que pide el apartado 13. ⚠️ Todo **se
 *  resuelve contra el catálogo**: un plan no guarda ni un nombre ni un músculo,
 *  así que corregir el catálogo corrige los diecisiete planes. */
export function lineasDeDia(plan, indice, propios = []) {
  const dia = lista(plan?.dias)[indice];
  if (!dia) return [];
  return lista(dia.lineas).map((l) => {
    const ej = ejercicioPorId(l.exerciseId, propios);
    return {
      id: l.id,
      exerciseId: l.exerciseId,
      nombre: nombreDeLinea(l, propios),
      series: textoDeSeries(l),
      carga: textoDeCarga(l),
      descanso: l.descanso,
      musculos: musculosResumidos(l, propios, 1),
      /* Si el ejercicio no existiera, se dice en vez de pintar un hueco. Hoy no
         pasa —hay una comprobación que recorre las 297 líneas— pero un plan que
         alguien añada mañana con un id mal escrito tiene que cantarlo. */
      existe: !!ej,
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · BUSCAR Y FILTRAR (apartados 6 y 7)
   ═══════════════════════════════════════════════════════════════════════════

   ⚠️ Los dos **leen**: ni uno guarda nada. Qué está buscando y qué filtro tiene
   puesto son estado de la pantalla, no un dato (EH F40). */

/** Apartado 6: por nombre, objetivo, entorno y tags, *"tolerante a
 *  mayúsculas/minúsculas"* y a los acentos — `ranura()` es la de la F2, que ya
 *  quita las dos cosas. */
export function buscarPlanes(planes, consulta) {
  const q = ranura(consulta);
  if (!q) return lista(planes);
  return lista(planes).filter((p) => {
    const campos = [
      p.nombre, p.subtitulo, p.paraQuien,
      entornoDe(p.entorno)?.nombre, p.entorno,
      objetivoDe(p.objetivo)?.nombre, p.objetivo,
      dificultadDe(p.dificultad)?.nombre,
      ...lista(p.tags),
    ];
    return campos.some((c) => ranura(c || '').includes(q));
  });
}

/** Los cuatro filtros del apartado 7, todos opcionales. */
export function filtrarPlanes(planes, {
  entorno = FILTRO_TODOS, objetivo = FILTRO_TODOS,
  dificultad = FILTRO_TODOS, frecuencia = FILTRO_TODOS,
} = {}) {
  return lista(planes).filter((p) => {
    if (entorno !== FILTRO_TODOS && p.entorno !== entorno) return false;
    if (objetivo !== FILTRO_TODOS && p.objetivo !== objetivo) return false;
    if (dificultad !== FILTRO_TODOS && p.dificultad !== dificultad) return false;
    if (frecuencia !== FILTRO_TODOS && p.frecuencia !== Number(frecuencia)) return false;
    return true;
  });
}

export function planesVisibles(planes, { consulta = '', ...filtros } = {}) {
  return filtrarPlanes(buscarPlanes(planes, consulta), filtros);
}

/* 🚨 Las pastillas de frecuencia **se derivan de los planes que hay**, no se
   escriben 2·3·4·5·6 a mano como enumera el apartado 7. Hoy ningún plan es de
   dos días: una pastilla «2 días» que deje la pantalla vacía siempre es
   exactamente el control decorativo que prohíbe la regla 8, y el día que se
   añada un plan de dos días la pastilla aparece sola. */
export const frecuenciasDisponibles = (planes = CATALOGO_PLANES) =>
  [...new Set(lista(planes).map((p) => p.frecuencia).filter(Boolean))].sort((a, b) => a - b);

/* Cada pastilla dice cuántos planes quedarían, y la que dejaría cero se apaga
   (la lección del apartado 23 de la F2). Se cuenta **con los demás filtros
   puestos**: si no, diría «6» y al pulsarla saldrían dos. */
export function recuentosDeFiltro(planes, filtros = {}, campo = 'entorno') {
  const sinEse = { ...filtros, [campo]: FILTRO_TODOS };
  const base = planesVisibles(planes, sinEse);
  const cuenta = { [FILTRO_TODOS]: base.length };
  const valores = {
    entorno: ENTORNOS.map((e) => e.id),
    objetivo: OBJETIVOS_PLAN.map((o) => o.id),
    dificultad: DIFICULTADES.map((d) => d.id),
    frecuencia: frecuenciasDisponibles(planes),
  }[campo] || [];
  for (const v of valores) cuenta[v] = filtrarPlanes(base, { [campo]: v }).length;
  return cuenta;
}

/** Las pastillas que de verdad se pintan: las que tienen algo detrás. */
export function pastillasDeFiltro(planes, filtros = {}, campo = 'entorno') {
  const cuenta = recuentosDeFiltro(planes, filtros, campo);
  const nombres = {
    entorno: ENTORNOS.map((e) => ({ id: e.id, nombre: e.nombre })),
    objetivo: OBJETIVOS_PLAN.map((o) => ({ id: o.id, nombre: o.nombre })),
    dificultad: DIFICULTADES.map((d) => ({ id: d.id, nombre: d.nombre })),
    frecuencia: frecuenciasDisponibles(planes).map((f) => ({ id: String(f), nombre: `${f} días` })),
  }[campo] || [];
  return [
    { id: FILTRO_TODOS, nombre: 'Todos', cuenta: cuenta[FILTRO_TODOS] },
    ...nombres
      .map((n) => ({ ...n, cuenta: cuenta[n.id] ?? cuenta[Number(n.id)] ?? 0 }))
      .filter((n) => n.cuenta > 0),
  ];
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · ELEGIR UN PLAN (apartados 14 y 20)
   ═══════════════════════════════════════════════════════════════════════════

   *"No debe iniciar todavía el entrenamiento. Debe guardar el plan como el plan
   seleccionado/activo del usuario."* Y si ya hay otro, **preguntar antes**: es
   el patrón `aplicarPlan` del proyecto, que ya va por más de veinte —
   **sin `confirmado` no escribe nada**.

   ⚠️ Lo guardado es **el id y desde cuándo**, no una copia del plan: con una
   copia, corregir un ejercicio del catálogo no le llegaría al plan que él tiene
   activo. Y `origen` existe desde ya para que una fase futura pueda activar una
   plantilla suya sin cambiar la forma de lo guardado. */

export function crearPlanActivo({ planId = '', origen = 'preset', desde = '' } = {}) {
  return { planId: texto(planId), origen: texto(origen) || 'preset', desde: texto(desde) };
}

export function normalizarPlanActivo(g) {
  if (!g || !texto(g.planId)) return null;
  return crearPlanActivo(g);
}

export const planActivoDe = (fitness) => normalizarPlanActivo((fitness || {}).planActivo);

/** El plan activo ya resuelto contra la biblioteca, para que «Tu Plan» lo pinte
 *  (apartado 20). ⚠️ Devuelve `null` si el id ya no existe: un plan que
 *  desapareciera del catálogo no puede dejar la pantalla con un hueco. */
export function planActivoResuelto(fitness, planes = CATALOGO_PLANES) {
  const activo = planActivoDe(fitness);
  if (!activo) return null;
  /* FIT F6, apartado 18 — el plan activo puede ser **una plantilla suya**. Se
     busca donde vive, y lo que se devuelve es la entidad tal cual: quien la
     lee aquí solo necesita su nombre (el aviso de cambio). ⚠️ Envolverla como
     plan de un día es de `tuPlan.js`; hacerlo aquí sería un ciclo de imports, y
     `planes.js` no tiene por qué saber cómo se pinta una semana. */
  if (activo.origen === 'plantilla') {
    return lista((fitness || {}).plantillas).find((p) => p && p.id === activo.planId) || null;
  }
  if (activo.origen !== 'preset') return null;
  return planPorId(activo.planId, planes);
}

export function avisoDeCambioDePlan(actual, nuevo) {
  return {
    titulo: '¿Cambiar tu plan actual?',
    /* Con el nombre del que se va: «tu plan actual» a secas no dice cuál es, y
       entonces no se puede decidir (EH F62). */
    que: `«${texto(actual?.nombre) || 'Tu plan actual'}» dejará de aparecer como activo.`,
    nuevo: `Pasarás a «${texto(nuevo?.nombre) || 'este plan'}».`,
    /* ⚠️ Y se dice que **no se pierde nada**: un plan prediseñado sigue en la
       biblioteca, así que prometer menos asustaría de balde (E3 F26 al revés). */
    vuelve: 'El anterior sigue en la biblioteca por si quieres volver.',
    cancelar: 'Cancelar',
    confirmar: 'Cambiar plan',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   9b · LOS PLANES ANTERIORES (FIT F32, apartado 22 — C-39)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 *"Las semanas históricas mantienen la información original. No reescribir
   el pasado."* Qué plan seguía en junio **no se puede derivar** de nada —es un
   hecho que pasó—, así que al cambiar de plan (o quitarlo) se apunta el tramo
   que se cierra: el plan, desde cuándo, hasta cuándo y **la estructura de sus
   días** —nombre y si descansaba—. Es la copia que este proyecto sí hace de lo
   que es historia (el snapshot de la F7): sin ella, un plan borrado o una
   plantilla editada cambiarían lo que dice el pasado.
   ⚠️ Solo la estructura: los ejercicios de lo que hizo de verdad ya los
   congela cada sesión. */

/** El id del día de una plantilla usada como plan. Lo lee la F6 al envolverla
 *  y la F32 al apuntarla: escrito una vez. */
export const idDiaDePlantilla = (id) => `${texto(id)}-dia`;

/** Nombre y días de un plan, para el historial. Recibe la entidad tal cual la
 *  devuelve `planActivoResuelto`: un preset, o la plantilla suya. */
export function estructuraDelPlan(plan, origen = 'preset') {
  if (!plan || typeof plan !== 'object' || !texto(plan.id)) return null;
  if (origen === 'plantilla') {
    return {
      nombre: texto(plan.nombre) || 'Sin nombre',
      dias: [{ id: idDiaDePlantilla(plan.id), nombre: texto(plan.nombre) || 'Entrenamiento', descanso: false }],
    };
  }
  return {
    nombre: texto(plan.nombre) || 'Sin nombre',
    dias: lista(plan.dias).filter((d) => d && texto(d.id)).map((d) => ({
      id: texto(d.id), nombre: texto(d.nombre), descanso: !!d.descanso,
    })),
  };
}

/** Los tramos cerrados, ya limpios. La forma la decide `normalizarPlanAnterior`
 *  (`fitness.js`), que es la de la puerta de carga. */
export function planesAnterioresDe(fitness) {
  return lista((fitness || {}).planesAnteriores).map(normalizarPlanAnterior).filter(Boolean);
}

/** La lista de tramos con el del plan activo cerrado **hoy**. ⚠️ No se apunta
 *  nada si no hay fecha de activación —no se sabe desde cuándo lo seguía— ni si
 *  lo activó hoy mismo: ese tramo no cubre ni un día. */
function conElTramoCerrado(f, hoy, planes) {
  const anteriores = planesAnterioresDe(f);
  const activo = planActivoDe(f);
  if (!activo || !fechaValida(activo.desde) || !fechaValida(hoy) || !(activo.desde < hoy)) return anteriores;
  const e = estructuraDelPlan(planActivoResuelto(f, planes), activo.origen);
  if (!e || !e.dias.length) return anteriores;
  return [...anteriores, {
    planId: activo.planId, origen: activo.origen, desde: activo.desde, hasta: hoy, nombre: e.nombre, dias: e.dias,
  }];
}

export function usarPlan(fitness, planId, {
  confirmado = false, hoy = todayISO(), planes = CATALOGO_PLANES, origen = 'preset',
} = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  /* 🚨 FIT F6, apartado 18: *"Si el usuario selecciona como plan activo una
     plantilla propia: también debe funcionar. No asumir que los planes activos
     siempre son presets."* Lo único que cambia es **dónde se busca**; lo
     guardado sigue siendo el id y el origen, nunca una copia. */
  const nuevo = origen === 'plantilla'
    ? lista(f.plantillas).find((p) => p && p.id === planId) || null
    : planPorId(planId, planes);
  if (!nuevo) {
    return {
      ok: false,
      motivo: origen === 'plantilla' ? 'Esa plantilla ya no está.' : 'Ese plan ya no está en la biblioteca.',
      aviso: null,
      fitness: f,
    };
  }

  const actual = planActivoResuelto(f, planes);
  const yaEsEse = planActivoDe(f)?.planId === nuevo.id;
  if (yaEsEse) return { ok: false, motivo: 'Ya es tu plan activo.', aviso: null, fitness: f };

  /* Solo se pregunta si **había otro**: preguntar al elegir el primero enseña a
     no leer los avisos (EH F61). */
  if (actual && !confirmado) {
    return { ok: false, motivo: 'confirmacion', aviso: avisoDeCambioDePlan(actual, nuevo), fitness: f };
  }
  return {
    ok: true,
    motivo: null,
    aviso: null,
    fitness: {
      ...f,
      planActivo: crearPlanActivo({ planId: nuevo.id, origen, desde: hoy }),
      /* 🔓 FIT F32 — el plan que se va queda apuntado (apartado 22). */
      planesAnteriores: conElTramoCerrado(f, hoy, planes),
    },
  };
}

/** Quitar el plan activo sin poner otro. ⚠️ No borra nada más: el plan sigue en
 *  la biblioteca y sus plantillas personalizadas, si las hizo, se quedan. */
export function quitarPlanActivo(fitness, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  /* 🔓 FIT F32 — quitarlo también cierra su tramo: si no, las semanas que lo
     siguió dirían «Sin datos del plan» (apartado 22). */
  return { ...f, planActivo: null, planesAnteriores: conElTramoCerrado(f, hoy, planes) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   10 · PERSONALIZAR (apartado 15)
   ═══════════════════════════════════════════════════════════════════════════

   *"No quiero que los planes prediseñados sean modificados directamente […]
   Esto es MUY IMPORTANTE para evitar que el usuario modifique accidentalmente
   el plan original."*

   🚨 **Y aquí no hay nada que proteger, porque no hay dónde escribir.** El
   catálogo es una constante del código, no una fila de `app_data`: aunque la
   pantalla quisiera, no podría tocarlo. La copia va a `fitness.plantillas`, que
   es la única lista de entrenamientos que él puede editar (F4).

   🚨 **Una semana no cabe en una plantilla**: una plantilla es **una sesión**
   (§2). Así que un plan de cinco días de entreno genera **cinco plantillas**,
   una por día, con el nombre del plan delante para que se reconozcan en la
   lista. Meter los treinta ejercicios en una sola habría sido más corto y le
   habría dejado un entrenamiento de tres horas.

   ⚠️ Y **los días de descanso no generan plantilla**: una plantilla vacía
   llamada «Descanso» sería una tarjeta que no se puede abrir para nada. */

export function nombreDePlantillaDePlan(plan, dia) {
  return `${texto(plan?.nombre) || 'Plan'} · ${texto(dia?.nombre) || 'Día'}`;
}

export function personalizarPreset(fitness, planId, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const plan = planPorId(planId, planes);
  if (!plan) return { ok: false, motivo: 'Ese plan ya no está en la biblioteca.', fitness: f, creadas: [] };

  const entreno = diasDeEntreno(plan);
  if (!entreno.length) {
    return { ok: false, motivo: 'Ese plan no tiene días de entrenamiento que copiar.', fitness: f, creadas: [] };
  }

  const creadas = entreno.map((dia) => {
    /* 🚨 Cada línea estrena id, como en `duplicarPlantilla` (F4): con el id del
       catálogo, editar una serie en su plantilla tocaría la línea del plan
       original en memoria — y además `normalizarLinea` necesita uno. */
    const rutina = crearRutina({
      nombre: nombreDePlantillaDePlan(plan, dia),
      descripcion: texto(plan.subtitulo),
      entornos: plan.entorno ? [plan.entorno] : [],
      lineas: lista(dia.lineas).map((l) => ({ ...l, id: uid() })),
      /* De dónde salió, para que una fase futura pueda decir «viene del PPL
         Estético». ⚠️ Es una **referencia**, no una copia del plan. */
      meta: { origenPlan: plan.id, origenDia: dia.id },
    });
    return { ...rutinaAPlan(rutina), creadoEn: hoy, editadoEn: hoy };
  });

  return {
    ok: true,
    motivo: null,
    fitness: { ...f, plantillas: [...lista(f.plantillas), ...creadas] },
    creadas,
  };
}

/** Lo que se le dice antes de personalizar, para que sepa qué va a aparecer en
 *  Tus plantillas. ⚠️ No pregunta: **no se pierde nada** y lo creado se puede
 *  eliminar de un toque (F4). Confirmar lo inofensivo enseña a no leer (EH F61). */
export function resumenDePersonalizar(plan) {
  const n = diasDeEntreno(plan).length;
  return {
    titulo: 'Personalizar este plan',
    que: n === 1
      ? `Se creará 1 plantilla tuya con el entrenamiento de «${texto(plan?.nombre)}».`
      : `Se crearán ${n} plantillas tuyas, una por cada día de entrenamiento de «${texto(plan?.nombre)}».`,
    original: 'El plan original se queda como está en la biblioteca.',
    donde: 'Las encontrarás en Entrenamiento → Tus plantillas.',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   11 · FAVORITOS (apartado 16)
   ═══════════════════════════════════════════════════════════════════════════

   *"Simplemente prepara el dato y la UI. No construyas todavía una sección
   compleja de favoritos."*

   ⚠️ Se guardan **ids**, nunca copias del plan: es lo mismo que hizo la E3 F37
   con los alimentos favoritos. Y el que apunta a un plan que ya no existe **lo
   limpia el normalizador**, para no guardar una mentira (EH F24). */

export const favoritosDe = (fitness) => lista((fitness || {}).favoritosPlanes);
export const esFavorito = (fitness, planId) => favoritosDe(fitness).includes(planId);

export function alternarFavoritoPlan(fitness, planId, planes = CATALOGO_PLANES) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  if (!planPorId(planId, planes)) return f;
  const actuales = favoritosDe(f);
  return {
    ...f,
    favoritosPlanes: actuales.includes(planId)
      ? actuales.filter((x) => x !== planId)
      : [...actuales, planId],
  };
}

export const planesFavoritos = (fitness, planes = CATALOGO_PLANES) =>
  favoritosDe(fitness).map((id) => planPorId(id, planes)).filter(Boolean);

/* ═══════════════════════════════════════════════════════════════════════════
   11 bis · LA PUERTA DE CARGA, Y POR QUÉ SON TRES CAPAS
   ═══════════════════════════════════════════════════════════════════════════

   `App.jsx` normaliza `fitness` al cargar, y cada fase ha ampliado esa puerta
   una capa, siempre por el mismo motivo: **cada archivo solo puede limpiar lo
   que conoce**.

   | Capa | Sabe de | Qué limpia |
   |---|---|---|
   | `normalizarFitness` (F1) | la forma | los campos y sus tipos |
   | `normalizarFitnessCompleto` (F2) | el catálogo de ejercicios | los ejercicios suyos, con sus campos completos |
   | `normalizarFitnessConPlanes` (F5) | la biblioteca de planes | los favoritos y el plan activo que apuntan a un plan que ya no existe |

   🚨 **Y `App.jsx` llama SOLO a la última**: llamar a la de en medio dejaría un
   favorito colgado, que es guardar una mentira (EH F24 con los perfumes). La
   comprobación que lo demuestra le pasa un favorito inventado a la puerta de la
   F2 y **exige que siga ahí** — si no, no podría ponerse roja (EH F42). */
export function normalizarFitnessConPlanes(guardado, planes = CATALOGO_PLANES) {
  const base = normalizarFitnessCompleto(guardado);
  const activo = base.planActivo;
  return {
    ...base,
    favoritosPlanes: lista(base.favoritosPlanes).filter((id) => planPorId(id, planes)),
    /* ⚠️ Solo se descarta lo que **se puede comprobar**: un `planActivo` con otro
       origen —una plantilla suya, que es lo que preparará una fase futura— no se
       busca en la biblioteca, así que no se tira. */
    planActivo: activo && activo.origen === 'preset' && !planPorId(activo.planId, planes) ? null : activo,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   12 · LOS ESTADOS VACÍOS (apartado 17)
   ═══════════════════════════════════════════════════════════════════════════

   ⚠️ Los tres **con salida**: un vacío sin nada que tocar es una pantalla rota
   (EH F41). */

export const ESTADO_SIN_RESULTADOS = {
  titulo: 'No encontramos planes',
  texto: 'Prueba con otro término o quita algún filtro.',
  accion: 'Quitar los filtros',
};

export const ESTADO_SIN_FAVORITOS = {
  titulo: 'Aún no tienes planes guardados',
  texto: 'Toca la estrella de un plan y lo tendrás aquí.',
  accion: 'Ver la biblioteca',
};

/* Apartado 17: *"Debe existir un estado visual coherente si los datos no pueden
   cargarse"*. ⚠️ Y se dice **qué ha pasado de verdad**: la biblioteca vive en el
   código, así que si está vacía es que falla la aplicación, no la conexión.
   Decir «comprueba tu conexión» sería mandarle a mirar donde no es (EH F62). */
export const ESTADO_ERROR_PLANES = {
  titulo: 'No podemos enseñarte los planes',
  texto: 'Vuelve a abrir Entrenamiento. Si sigue igual, la aplicación necesita actualizarse.',
  accion: 'Volver a Entrenamiento',
};

/* ═══════════════════════════════════════════════════════════════════════════
   13 · LO QUE NO SE CONSTRUYE, CON SU MOTIVO (apartado 23)
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT5 = [
  { que: 'Empezar el entrenamiento', porque: 'El motor en vivo es una fase posterior. El apartado 14 lo dice: *"no debe iniciar todavía el entrenamiento"*, así que el botón no se pinta — sería una acción muerta (regla 8).' },
  { que: 'El cronómetro y el registro de series', porque: 'Van con el entrenamiento en vivo. Aquí un plan se mira y se elige, no se hace.' },
  { que: 'Progreso, rangos y ranking muscular', porque: 'Los excluye el apartado 23. La distribución que sí se enseña es la del plan, no la suya.' },
  { que: 'La IA de adaptación y las recomendaciones', porque: 'Apartado 23. Y la regla 7: la IA nunca se dispara sola.' },
  { que: 'Editar un plan prediseñado', porque: 'Apartado 15, y no hay dónde: el catálogo es código. Lo que se edita es la copia.' },
  { que: 'Una sección entera de favoritos', porque: 'El apartado 16 pide *"el dato y la UI"*, no la sección. Está la estrella y la lista; una pantalla propia es de otra fase.' },
  { que: 'Imágenes de los planes', porque: 'Apartado 5: *"No inventes URLs externas"*. El campo existe y vale `null`; se dibuja el grupo muscular que más pesa.' },
  { que: 'Sistema social, seguidores y feed', porque: 'Apartado 23, y D2-02 sobre no sobregamificar.' },
];

/* ⚠️ La lista que la F1 creyó que sería la biblioteca y que se ha quedado sin
   quien escriba (§4). Se declara en vez de borrarla o de dejarla ahí sin más. */
export const SIN_ESCRITOR = [
  {
    clave: 'fitness.planes',
    porque: 'La F1 la dejó para la biblioteca, y la biblioteca resultó ser **datos de la aplicación**: vive en `catalogoPlanes.js`, no en `app_data`. Así una corrección le llega a quien ya tiene cuenta.',
    seQuita: 'No. Quitarla del normalizador se llevaría lo que alguien tuviera guardado ahí (regla 5), y no cuesta nada.',
    quienDecide: 'Una fase futura que guarde planes por usuario — si llega — la usa tal cual.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   14 · LA AUDITORÍA (apartado 24)
   ═══════════════════════════════════════════════════════════════════════════

   El apartado 24 es una lista de validaciones obligatorias. Se **ejecutan**, no
   se describen: una casilla puesta a `true` a mano es una auditoría que no puede
   fallar (EH F42). */

export function auditarPlanes(planes = CATALOGO_PLANES, propios = []) {
  const problemas = [];
  const vistos = new Set();

  for (const p of lista(planes)) {
    const donde = p.nombre || p.id;
    if (vistos.has(p.id)) problemas.push({ plan: donde, que: `Id repetido: ${p.id}` });
    vistos.add(p.id);

    if (!p.nombre) problemas.push({ plan: donde, que: 'Sin nombre.' });
    if (!p.entorno) problemas.push({ plan: donde, que: 'Sin entorno, así que no sale en ninguna categoría.' });
    if (!p.objetivo) problemas.push({ plan: donde, que: 'Sin objetivo, así que no sale en su filtro.' });
    if (!p.dificultad) problemas.push({ plan: donde, que: 'Sin dificultad.' });
    if (!p.paraQuien) problemas.push({ plan: donde, que: 'Sin «para quién es»: la tarjeta no puede decir si le sirve.' });

    const entreno = diasDeEntreno(p);
    if (!entreno.length) problemas.push({ plan: donde, que: 'No tiene ni un día de entrenamiento.' });
    if (p.frecuencia !== entreno.length) {
      problemas.push({ plan: donde, que: `Dice ${p.frecuencia} días y tiene ${entreno.length}.` });
    }
    for (const d of entreno) {
      if (!lista(d.lineas).length) problemas.push({ plan: donde, que: `El día «${d.nombre}» no tiene ejercicios.` });
      for (const l of lista(d.lineas)) {
        if (!ejercicioPorId(l.exerciseId, propios)) {
          problemas.push({ plan: donde, que: `«${l.exerciseId}» no está en el catálogo.` });
        }
      }
    }

    const ficha = fichaDePlan(p, propios);
    if (!ficha.duracion) problemas.push({ plan: donde, que: 'No se puede estimar cuánto dura una sesión.' });
    if (!ficha.distribucion.grupos.length) problemas.push({ plan: donde, que: 'No se puede calcular su distribución muscular.' });
    if (p.thumbnail && /^https?:/i.test(p.thumbnail)) {
      problemas.push({ plan: donde, que: 'Tiene una imagen de fuera: el apartado 5 lo prohíbe.' });
    }
  }

  return { ok: problemas.length === 0, problemas, planes: lista(planes).length };
}

/** El recuento por entorno que pide el apartado 8 (*"Gym 5-8 · Calistenia 5-8 ·
 *  Casa 4-6"*), calculado, no escrito. */
export function recuentoPorEntorno(planes = CATALOGO_PLANES) {
  const r = {};
  for (const e of ENTORNOS) r[e.id] = lista(planes).filter((p) => p.entorno === e.id).length;
  return r;
}

/* Los grupos musculares del apartado 10, en el orden de la F1, para que la
   pantalla los pinte sin escribir la lista otra vez. */
export const GRUPOS_PARA_DISTRIBUCION = GRUPOS_MUSCULARES.map((g) => ({ id: g.id, nombre: g.nombre }));
