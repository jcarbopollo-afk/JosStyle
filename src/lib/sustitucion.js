import {
  ejercicioPorId, CATALOGO_EJERCICIOS, normalizarEjercicioCompleto, musculoPrincipal, baseDe,
  variantesDe, nombreCompleto, ranura, materialDe, sinMaterial,
  ENTORNOS, EQUIPAMIENTO, DIFICULTADES, TIPOS_EJERCICIO,
  PATRONES_MOVIMIENTO, FAMILIAS_PATRON, patronMovimiento, familiaPatron,
  entorno as entornoPorId, equipo as equipoPorId, dificultad as dificultadPorId,
} from './ejercicios';
import { GRUPOS_MUSCULARES, subgrupoMuscular } from './fitness';

/* Entrega 4 · Fase 33/45 — «Sistema avanzado de sustitución de ejercicios».
   ═══════════════════════════════════════════════════════════════════════════

   *"Cuando el usuario pulse «Reemplazar ejercicio» el sistema debe encontrar
   alternativas realmente compatibles. Una sustitución NO significa que dos
   ejercicios sean idénticos. Debe existir una jerarquía de compatibilidad."*

   ───────────────────────────────────────────────────────────────────────────
   1 · SUSTITUIR YA EXISTÍA, EN TRES SITIOS, Y NO SE ESCRIBE UN CUARTO
   ───────────────────────────────────────────────────────────────────────────

   · **La F2** dejó en cada ejercicio sus `sustitutos` y sus `variantes`, y su
     `base` si es una variante.
   · **La F7** sustituye en la sesión en vivo con `sustituirEjercicio`, que
     apunta `sustituyeA` y **no puede tocar ni el plan ni la plantilla**: recibe
     la sesión y devuelve la sesión.
   · **La F9** los ordenaba con `sustitutosCompatibles` (familia, declarados y
     el resto del grupo), y **la F3** cambia de variante en el constructor.

   Así que esto **no es un segundo buscador de sustitutos**: es el motor que
   los tres llaman. `sustitutosCompatibles` (F9) pasa a pedírselo a
   `getExerciseReplacements`, `sustituirEjercicio` (F7) le pide la
   configuración, y el constructor sustituye con la misma función. Con dos
   motores, el entrenamiento en vivo y el constructor propondrían cosas
   distintas para el mismo press de banca.

   ───────────────────────────────────────────────────────────────────────────
   2 · LO QUE FALTABA ERA UN DATO: EL PATRÓN DE MOVIMIENTO
   ───────────────────────────────────────────────────────────────────────────

   El apartado 3 pide considerar el patrón y el 4 enumera los suyos, y el
   catálogo no lo tenía: el músculo principal **no distingue** un press de
   banca de unos fondos (los dos son pectoral medio). Así que cada ejercicio
   lleva ahora `patron` en su línea, y `PATRONES_MOVIMIENTO` vive en
   `ejercicios.js`. ⚠️ **Isométrico, explosivo y skill no son patrones** —ya los
   dicen `tipos` y `explosivo`—, y el propio apartado 4 manda reutilizarlos:
   aquí son **modalidades** (`modalidadesDe`).

   ───────────────────────────────────────────────────────────────────────────
   3 · CUATRO NIVELES, Y SE DECIDEN CON PUERTAS, NO CON UNA NOTA
   ───────────────────────────────────────────────────────────────────────────

   Una suma de puntos sola habría puesto el press en máquina como «Muy similar»
   al de barra —mismo patrón, mismo músculo, mismo tipo—, y el apartado 5 dice
   que es **Similar**. Lo que los separa no es cuántos puntos tienen, sino
   **qué comparten**: el de mancuernas es una versión del mismo ejercicio y el
   de máquina no. Así que el nivel sale de condiciones que se leen
   (`nivelDeCompatibilidad`) y la puntuación **solo ordena dentro del nivel**,
   que es lo que dice el apartado 33: *"La puntuación es interna."*

   · **Muy similar** — mismo patrón, mismo músculo principal, misma forma de
     medirse y misma modalidad, lo mismo de lateralidad, dificultad a un paso
     como mucho, y además **de la misma familia o con el mismo material**.
   · **Similar** — mismo patrón, mismo grupo principal y misma forma de medirse.
   · **Alternativa** — comparte el patrón, el grupo, la familia o el catálogo
     lo declara sustituto.
   · **Poco recomendable** — se parece poco, o **en este entrenamiento no se
     puede hacer**: el apartado 6 prohíbe *"recomendar automáticamente una
     máquina de gimnasio dentro de un entrenamiento de casa"*, y el apartado 2
     dice que este nivel no se enseña normalmente.

   ⚠️ **La forma de medirse separa al press de banca de las flexiones**: una
   lleva carga externa y la otra es tu peso. Es la clase de la F11 —carga,
   repeticiones, tiempo—, y por eso las flexiones son **Alternativa**, como
   dice el ejemplo del apartado 5.

   ───────────────────────────────────────────────────────────────────────────
   4 · EL MATERIAL: LO QUE SE SABE Y LO QUE NO
   ───────────────────────────────────────────────────────────────────────────

   El entorno de cada ejercicio es un dato limpio desde la F2 —`entornos` dice
   dónde se puede hacer—, así que *"¿se puede en casa?"* se contesta con él.
   El equipamiento, no tanto: la lista de la F2 mezcla lo imprescindible con
   las alternativas («banco, silla, mancuernas» en la búlgara). Así que «no
   tengo banco» se lee con los **grupos** de `EQUIPAMIENTO` —la silla ocupa el
   sitio del banco—, y lo que no se puede decidir **se quita de más antes que
   proponer algo que no puede hacer** (`DECISIONES_FIT33`).

   ───────────────────────────────────────────────────────────────────────────
   5 · CADA SISTEMA CONSERVA SU FUENTE DE VERDAD
   ───────────────────────────────────────────────────────────────────────────

   Sustituir **cambia un `exerciseId`** en la sesión en curso, en el borrador
   del constructor o en una plantilla, y nada más. El historial, el progreso,
   los rangos, la clasificación y los objetivos **leen por `exerciseId` desde
   su fase**, así que ninguno necesita una línea de código para no mezclarse:
   el press de mancuernas del 15 de septiembre es un press de mancuernas, y el
   de barra del 12 sigue siendo el de barra. `LO_QUE_NO_SE_TRANSFIERE` lo
   declara y la suite lo mide sistema por sistema. */

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LOS CATÁLOGOS
   ═══════════════════════════════════════════════════════════════════════════ */

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const lista = (v) => (Array.isArray(v) ? v : []);
const enteroONull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
};

/** Apartado 2 — los cuatro niveles. `visible` es el *"Solo mostrar
 *  normalmente"*: el cuarto existe, se cuenta y se puede pedir, pero no sale
 *  solo. Y `frase` es la del apartado 10: *"Alternativa similar"*, nunca
 *  *"Es exactamente igual"*. */
export const NIVELES_COMPATIBILIDAD = [
  { id: 'muy_similar', nombre: 'Muy similar', orden: 1, visible: true, frase: 'Alternativa muy parecida.' },
  { id: 'similar', nombre: 'Similar', orden: 2, visible: true, frase: 'Alternativa similar.' },
  { id: 'alternativa', nombre: 'Alternativa', orden: 3, visible: true, frase: 'Otra forma de trabajarlo.' },
  { id: 'poco_recomendable', nombre: 'Poco recomendable', orden: 4, visible: false, frase: 'Se parece poco.' },
];
export const nivelCompatibilidad = (id) => NIVELES_COMPATIBILIDAD.find((n) => n.id === id) || null;
export const NIVELES_VISIBLES = NIVELES_COMPATIBILIDAD.filter((n) => n.visible).map((n) => n.id);

/** Apartado 3 — los once criterios, cada uno con **de dónde se lee**. Ninguno
 *  es un campo nuevo salvo el patrón y la lateralidad, que no existían. */
export const CRITERIOS_COMPATIBILIDAD = [
  { id: 'grupo', nombre: 'Grupo muscular', lee: 'musculoPrincipal(ej).grupoId (F2)' },
  { id: 'subgrupo', nombre: 'Subgrupo muscular', lee: 'el reparto de `musculos` de los dos, músculo a músculo (F2)' },
  { id: 'patron', nombre: 'Patrón de movimiento', lee: '`patron` (F33, en la línea de cada ejercicio)' },
  { id: 'tipo', nombre: 'Tipo de ejercicio', lee: '`tipos`: compuesto o aislamiento (F2)' },
  { id: 'equipamiento', nombre: 'Equipamiento', lee: '`equipamiento` y los grupos de `EQUIPAMIENTO` (F2, F33)' },
  { id: 'entorno', nombre: 'Entorno', lee: '`entornos` (F2)' },
  { id: 'dificultad', nombre: 'Dificultad', lee: '`dificultad` y su `orden` (F2)' },
  { id: 'lateralidad', nombre: 'Unilateral o bilateral', lee: '`unilateral` (F33)' },
  {
    id: 'recorrido',
    nombre: 'Rango de movimiento',
    lee: 'la modalidad estática: `isometrico` en `tipos` o solo `tiempo` en `medidas` (F2)',
    /* ⚠️ Lo único que el catálogo sabe del recorrido es si lo hay: una plancha no
       tiene, un press sí. Un «recorrido parcial» no está escrito en ninguna
       ficha, e inventarlo sería una cifra que nadie ha medido (regla 8). */
    limite: 'El catálogo no guarda si un recorrido es completo o parcial; solo si el ejercicio es estático.',
  },
  { id: 'skill', nombre: 'Skill o progresión', lee: '`habilidad` en `tipos` y las cadenas de `progresiones` (F2)' },
  { id: 'funcion', nombre: 'Función principal', lee: '`tipos` (fuerza, hipertrofia, movilidad) y `explosivo` (F2)' },
];

/** La puntuación interna (apartado 33). **Solo ordena dentro de un nivel**: el
 *  nivel lo deciden las puertas de `nivelDeCompatibilidad`. Constantes
 *  declaradas, como `PESOS` de la F24: nada sale de un número escrito a mano en
 *  mitad de una función. */
export const PESOS_COMPATIBILIDAD = {
  mismoPatron: 25,
  mismaFamiliaDePatron: 8,
  mismoMusculoPrincipal: 15,
  mismoGrupo: 8,
  solapeMuscular: 20,
  mismaMedida: 8,
  mismoTipo: 6,
  mismaFuncion: 5,
  mismoMaterial: 5,
  mismaLateralidad: 3,
  dificultad: 5,
  mismaFamilia: 10,
  declarado: 6,
  mismaProgresion: 6,
  tipoDelEntreno: 3,
};

/** Cuánto trabajo muscular tienen que compartir dos ejercicios del mismo
 *  grupo para ser una alternativa (y no «poco recomendable»). */
export const UMBRAL_SOLAPE_GRUPO = 0.25;

/* Las modalidades del apartado 4 que ya existían (isométrico, explosivo,
   skill). Se leen, no se guardan. */
export const MODALIDADES = [
  { id: 'isometrico', nombre: 'Isométrico', de: '`isometrico` en `tipos`, o se mide solo en tiempo' },
  { id: 'explosivo', nombre: 'Explosivo', de: '`explosivo` (F2)' },
  { id: 'habilidad', nombre: 'Skill', de: '`habilidad` en `tipos`' },
];

/** Qué material cuenta como carga externa. El resto de «peso» es lastre sobre
 *  tu propio cuerpo (unas dominadas lastradas), que es otra clase en la F11. */
const MATERIAL_DE_CARGA = new Set(['barra', 'discos', 'mancuernas', 'kettlebell', 'polea', 'maquina', 'mochila']);

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LO QUE SE LEE DE CADA EJERCICIO
   ═══════════════════════════════════════════════════════════════════════════ */

export const patronDe = (ej) => patronMovimiento(ej?.patron) || null;
export const familiaDePatronDe = (ej) => {
  const p = patronDe(ej);
  return p ? familiaPatron(p.familia) : null;
};

/** Apartado 4 — isométrico, explosivo y skill, **reutilizados** de la F2. */
export function modalidadesDe(ej) {
  const tipos = lista(ej?.tipos);
  const medidas = lista(ej?.medidas);
  const out = [];
  if (tipos.includes('isometrico') || (medidas.includes('tiempo') && !medidas.includes('reps'))) out.push('isometrico');
  if (ej?.explosivo === true || tipos.includes('explosivo')) out.push('explosivo');
  if (tipos.includes('habilidad')) out.push('habilidad');
  return out;
}

/** La forma de medirse: `tiempo`, `carga` (peso externo) o `corporal` (tu peso,
 *  con o sin lastre). Es la clase de la F11 vista desde el catálogo. */
export function claseDeMedida(ej) {
  const medidas = lista(ej?.medidas);
  if (!medidas.includes('reps') && medidas.includes('tiempo')) return 'tiempo';
  if (medidas.includes('peso') && lista(ej?.equipamiento).some((e) => MATERIAL_DE_CARGA.has(e))) return 'carga';
  return 'corporal';
}

/** El modo en el que se registraría (constructor y sesión): un L-sit, en
 *  segundos. Es la regla de `crearLinea` de la F3, en un solo sitio. */
export const modoPropuesto = (ej) => (
  ej && !lista(ej.medidas).includes('reps') && lista(ej.medidas).includes('tiempo') ? 'tiempo' : 'reps'
);

const admiteModo = (ej, modo) => lista(ej?.medidas).includes(modo === 'tiempo' ? 'tiempo' : 'reps');

/* El material que de verdad hace falta vive en `ejercicios.js` desde la F34
   (lo usa también el filtro «Peso corporal»). Se reexporta con `export { }`:
   `export … from` no crea binding local, y aquí se usa (EH F17). */
export { materialDe, sinMaterial };
const grupoDeEquipo = (id) => equipoPorId(id)?.grupo || id;

/** La raíz de la familia de variantes: **la base, o el propio ejercicio**. La
 *  F29 lo dejó escrito: la familia se recorre en los dos sentidos. */
export const raizDe = (ej, propios = []) => (ej ? baseDe(ej, propios) || ej : null);

/** Qué relación de variante hay entre dos ejercicios (apartado 31). */
export function relacionDeVariante(original, candidato, propios = []) {
  if (!original || !candidato || original.id === candidato.id) return null;
  if (candidato.base && candidato.base === original.id) return 'variante';
  if (original.base && original.base === candidato.id) return 'base';
  if (lista(original.variantes).includes(candidato.id)) return 'variante';
  if (lista(candidato.variantes).includes(original.id)) return 'base';
  const a = raizDe(original, propios);
  const b = raizDe(candidato, propios);
  if (a && b && a.id === b.id) return 'hermana';
  return null;
}

/** Las cadenas de progresión de una skill, en los dos sentidos. ⚠️ **Solo el
 *  enlace directo**: que la human flag y la planche pidan las dos un L-sit
 *  antes no las pone en la misma progresión. */
function mismaProgresion(a, b) {
  if (!a || !b) return false;
  return lista(a.progresiones).includes(b.id) || lista(b.progresiones).includes(a.id);
}

/** Todo el material que pide es de los que se tienen en casa (el `casero` de
 *  la F2). */
const todoCasero = (ej) => materialDe(ej).every((x) => equipoPorId(x)?.casero === true);

/** El reparto de cada uno, en fracciones que suman 1. */
function reparto(ej) {
  const ms = lista(ej?.musculos).filter((m) => (m.porcentaje || 0) > 0);
  const total = ms.reduce((n, m) => n + m.porcentaje, 0) || 1;
  return new Map(ms.map((m) => [m.subgrupoId, m.porcentaje / total]));
}

/** Cuánto trabajo muscular comparten, de 0 a 1: la suma del mínimo de cada
 *  subgrupo. Un press de banca y unas flexiones comparten casi todo; un curl y
 *  una sentadilla, nada. */
export function solapeMuscular(a, b) {
  const ra = reparto(a);
  const rb = reparto(b);
  let s = 0;
  for (const [k, v] of ra) if (rb.has(k)) s += Math.min(v, rb.get(k));
  return Math.round(s * 1000) / 1000;
}

const funcionesDe = (ej) => lista(ej?.tipos).filter((t) => ['fuerza', 'hipertrofia', 'movilidad', 'explosivo', 'habilidad'].includes(t));
const tipoEstructural = (ej) => (lista(ej?.tipos).includes('aislamiento') ? 'aislamiento'
  : lista(ej?.tipos).includes('compuesto') ? 'compuesto' : null);

/* ═══════════════════════════════════════════════════════════════════════════
   3 · EL CONTEXTO (apartado 34)
   ═══════════════════════════════════════════════════════════════════════════

   *"La misma sustitución puede ser diferente según el contexto."* Se aceptan
   los nombres del enunciado —`environment`, `equipment`, `workoutType`,
   `currentConfiguration`, `liveSession`, `plan`, `template`— y los de la casa.
   ⚠️ **Todo es opcional**: sin contexto, el nivel es el de los dos ejercicios
   y la disponibilidad es `null` —no se sabe—, nunca «disponible». */

const entornoValido = (e) => !!entornoPorId(texto(e));

/** Los ids de los ejercicios de un entrenamiento, venga de donde venga. */
function idsDelEntrenamiento({ sesion, plantilla, plan, rutina }) {
  const deSesion = lista(sesion?.origen?.ejercicios).map((e) => e?.exerciseId);
  const dePlantilla = lista(plantilla?.ejercicios).map((l) => l?.exerciseId);
  const deRutina = lista(rutina?.lineas).map((l) => l?.exerciseId);
  const dePlan = lista(plan?.ejercicios).map((l) => l?.exerciseId);
  return [...new Set([...deSesion, ...dePlantilla, ...deRutina, ...dePlan].map(texto).filter(Boolean))];
}

export function contextoDeSustitucion(ctx = {}, { original = null } = {}) {
  const c = ctx || {};
  const sesion = c.sesion || c.liveSession || null;
  const plantilla = c.plantilla || c.template || null;
  const plan = c.plan || null;
  const rutina = c.rutina || null;
  const propios = lista(c.propios);
  /* El entorno: el que se diga, el de la sesión (F10) o el de la plantilla o
     rutina. Una rutina puede ser de varios (F3, apartado 3): vale cualquiera. */
  const entornos = [...new Set([
    ...lista(c.entornos),
    c.entorno, c.environment,
    sesion?.entorno,
    plantilla?.entorno, ...lista(plantilla?.meta?.entornos),
    ...lista(rutina?.entornos),
    plan?.entorno,
  ].map(texto).filter(entornoValido))];
  const explicito = c.equipamiento ?? c.equipment;
  const ejerciciosDelEntreno = idsDelEntrenamiento({ sesion, plantilla, plan, rutina });
  /* Apartado 7 — *"detectar el equipamiento disponible del entrenamiento
     cuando exista"*: el material que ya usan sus **otros** ejercicios está ahí.
     ⚠️ El del ejercicio que se sustituye NO cuenta: si lo cambia porque no hay
     barra, dar la barra por disponible sería justo lo contrario. */
  const fuera = texto(original);
  const detectado = new Set(ejerciciosDelEntreno
    .filter((id) => id !== fuera)
    .flatMap((id) => materialDe(ejercicioPorId(id, propios))));
  return {
    entornos,
    equipamiento: Array.isArray(explicito) ? new Set(explicito.map(texto).filter((e) => !!equipoPorId(e))) : null,
    detectado,
    noTengo: new Set(lista(c.noTengo).map(texto).filter((e) => !!equipoPorId(e))),
    tipoEntreno: texto(c.tipo || c.workoutType) || null,
    configuracion: c.configuracion || c.currentConfiguration || null,
    ejerciciosDelEntreno,
    excluir: new Set(lista(c.excluir).map(texto).filter(Boolean)),
    propios,
  };
}

/** Si un grupo de material está cubierto por un conjunto: el banco lo cubre la
 *  silla, la barra de dominadas las anillas. */
const cubre = (conjunto, id) => [...conjunto].some((x) => x === id || grupoDeEquipo(x) === grupoDeEquipo(id));

/** 🚨 Apartado 7 — *"No tengo barra → excluir ejercicios que requieren
 *  barra"*. Un ejercicio lo requiere si lo lleva en su lista y **no hay en esa
 *  misma lista** otra cosa de su grupo que sí tenga. Si se puede hacer sin
 *  material (lleva «nada» o «suelo»), no le falta nada. */
export function faltaMaterial(ej, noTengo) {
  const nt = noTengo instanceof Set ? noTengo : new Set(lista(noTengo));
  if (!nt.size || sinMaterial(ej)) return [];
  const eq = materialDe(ej);
  return eq.filter((x) => nt.has(x) && !eq.some((y) => y !== x && !nt.has(y) && grupoDeEquipo(y) === grupoDeEquipo(x)));
}

/** ¿Se puede hacer en este entrenamiento? `true`, `false` o `null` si el
 *  contexto no dice nada — y `null` no es «sí». */
export function disponibilidad(ej, ctx) {
  const c = ctx && ctx.detectado ? ctx : contextoDeSustitucion(ctx);
  const faltan = faltaMaterial(ej, c.noTengo);
  const fueraDeEntorno = c.entornos.length > 0 && !lista(ej?.entornos).some((e) => c.entornos.includes(e));
  let sinEquipo = [];
  if (c.equipamiento) {
    sinEquipo = sinMaterial(ej) ? [] : materialDe(ej).filter((x) => !cubre(c.equipamiento, x));
    /* Lo que tiene alternativa en su propia lista no falta: con la silla, la
       búlgara no necesita banco. */
    const eq = materialDe(ej);
    sinEquipo = sinEquipo.filter((x) => !eq.some((y) => y !== x && grupoDeEquipo(y) === grupoDeEquipo(x) && cubre(c.equipamiento, y)));
  }
  const sabe = c.entornos.length > 0 || c.noTengo.size > 0 || !!c.equipamiento;
  const disponible = !sabe ? null : (!fueraDeEntorno && faltan.length === 0 && sinEquipo.length === 0);
  /* Y la prioridad del apartado 27: usa material que ya está en el
     entrenamiento, o no necesita ninguno. */
  const material = materialDe(ej);
  const conMaterialDelEntreno = sinMaterial(ej)
    || (c.detectado.size > 0 && material.every((x) => cubre(c.detectado, x)))
    || (!!c.equipamiento && sinEquipo.length === 0);
  return {
    disponible,
    fueraDeEntorno,
    faltan: [...new Set([...faltan, ...sinEquipo])],
    conMaterialDelEntreno,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · COMPARAR DOS EJERCICIOS
   ═══════════════════════════════════════════════════════════════════════════ */

/** Los rasgos que comparten, uno a uno. De aquí salen el nivel, la
 *  puntuación y los motivos, y por eso la explicación **no puede decir algo
 *  que el cálculo no ha mirado**. */
export function rasgosEnComun(original, candidato, propios = []) {
  const po = musculoPrincipal(original);
  const pc = musculoPrincipal(candidato);
  const pa = patronDe(original);
  const pb = patronDe(candidato);
  const difO = dificultadPorId(original?.dificultad)?.orden ?? 1;
  const difC = dificultadPorId(candidato?.dificultad)?.orden ?? 1;
  const matO = materialDe(original);
  const matC = materialDe(candidato);
  const modO = modalidadesDe(original);
  const modC = modalidadesDe(candidato);
  const relacion = relacionDeVariante(original, candidato, propios);
  return {
    mismoPatron: !!pa && !!pb && pa.id === pb.id,
    mismaFamiliaDePatron: !!pa && !!pb && pa.familia === pb.familia,
    mismoMusculoPrincipal: !!po && !!pc && po.subgrupoId === pc.subgrupoId,
    mismoGrupo: !!po && !!pc && !!po.grupoId && po.grupoId === pc.grupoId,
    solape: solapeMuscular(original, candidato),
    mismaMedida: claseDeMedida(original) === claseDeMedida(candidato),
    medidaOriginal: claseDeMedida(original),
    medidaCandidato: claseDeMedida(candidato),
    mismaModalidadEstatica: modO.includes('isometrico') === modC.includes('isometrico'),
    mismaExplosividad: modO.includes('explosivo') === modC.includes('explosivo'),
    skillOriginal: modO.includes('habilidad'),
    skillCandidato: modC.includes('habilidad'),
    mismoTipo: tipoEstructural(original) !== null && tipoEstructural(original) === tipoEstructural(candidato),
    mismaFuncion: funcionesDe(original).some((f) => funcionesDe(candidato).includes(f)),
    mismoMaterial: (matO.length === 0 && matC.length === 0) || matO.some((x) => matC.includes(x)),
    /* ⚠️ «Menos material» no es «menos cosas en la lista»: una máquina es una
       sola palabra y es más material que una barra. Es no necesitar ninguno, o
       necesitar solo lo que se tiene en casa cuando el original no. */
    menosMaterial: matO.length > 0 && (sinMaterial(candidato) || (todoCasero(candidato) && !todoCasero(original))),
    ningunoNecesitaMaterial: matO.length === 0 && matC.length === 0,
    mismaLateralidad: (original?.unilateral === true) === (candidato?.unilateral === true),
    unilateralCandidato: candidato?.unilateral === true,
    distanciaDificultad: difC - difO,
    familia: relacion,
    declarado: lista(original?.sustitutos).includes(candidato?.id) || lista(candidato?.sustitutos).includes(original?.id),
    mismaProgresion: mismaProgresion(original, candidato),
  };
}

/** 🚨 Apartado 2 — el nivel, **con puertas**. `null` es «no es un sustituto».
 *  El contexto entra después (`nivelEnContexto`), para que el nivel de dos
 *  ejercicios no dependa de dónde se esté entrenando. */
export function nivelDeCompatibilidad(r) {
  if (!r) return null;
  const pareceAlgo = r.solape > 0 || r.mismoPatron || !!r.familia || r.declarado;
  if (!pareceAlgo) return null;
  let nivel;
  const lejos = Math.abs(r.distanciaDificultad);
  if (r.mismoPatron && r.mismoMusculoPrincipal && r.mismaMedida && r.mismaModalidadEstatica
    && r.mismaExplosividad && r.mismaLateralidad && lejos <= 1 && (!!r.familia || r.mismoMaterial)) {
    nivel = 'muy_similar';
  } else if (r.mismoPatron && r.mismoGrupo && r.mismaMedida && r.mismaModalidadEstatica) {
    nivel = 'similar';
  } else if (r.mismoPatron || !!r.familia || r.declarado || r.mismaProgresion
    /* Mismo grupo, pero de verdad: unas elevaciones laterales son «hombro» y no
       sustituyen a una planche. Hace falta compartir un cuarto del trabajo. */
    || (r.mismoGrupo && r.solape >= UMBRAL_SOLAPE_GRUPO)) {
    nivel = 'alternativa';
  } else {
    nivel = 'poco_recomendable';
  }
  /* ⚠️ Una skill no sustituye a un ejercicio de fuerza: proponer una planche
     para un press de banca sería de risa. Al revés sí puede ser una
     alternativa (la progresión hacia ella), pero nunca «muy similar». */
  if (r.skillCandidato && !r.skillOriginal && !r.mismaProgresion && !r.familia) nivel = 'poco_recomendable';
  if (r.skillOriginal && !r.skillCandidato && (nivel === 'muy_similar' || nivel === 'similar')) nivel = 'alternativa';
  /* Y dos pasos de dificultad por encima no es «parecido»: es otro ejercicio. */
  if (r.distanciaDificultad >= 2 && nivel !== 'poco_recomendable' && !r.mismaProgresion && !r.familia) {
    nivel = nivel === 'alternativa' ? 'poco_recomendable' : 'alternativa';
  }
  return nivel;
}

/** Apartado 6 — lo que no se puede hacer aquí baja a «Poco recomendable»: no
 *  se esconde del todo (quizá está de viaje con la barra en la mochila), pero
 *  no se le propone solo. */
export function nivelEnContexto(nivel, disp) {
  if (!nivel) return null;
  if (disp && disp.disponible === false) return 'poco_recomendable';
  return nivel;
}

export function puntuacion(r, { candidato = null, ctx = null } = {}) {
  if (!r) return 0;
  const P = PESOS_COMPATIBILIDAD;
  let p = 0;
  if (r.mismoPatron) p += P.mismoPatron;
  else if (r.mismaFamiliaDePatron) p += P.mismaFamiliaDePatron;
  if (r.mismoMusculoPrincipal) p += P.mismoMusculoPrincipal;
  else if (r.mismoGrupo) p += P.mismoGrupo;
  p += P.solapeMuscular * r.solape;
  if (r.mismaMedida) p += P.mismaMedida;
  if (r.mismoTipo) p += P.mismoTipo;
  if (r.mismaFuncion) p += P.mismaFuncion;
  if (r.mismoMaterial) p += P.mismoMaterial;
  if (r.mismaLateralidad) p += P.mismaLateralidad;
  p += Math.max(-P.dificultad, P.dificultad - Math.abs(r.distanciaDificultad) * (P.dificultad / 2));
  if (r.familia) p += P.mismaFamilia;
  if (r.declarado) p += P.declarado;
  if (r.mismaProgresion) p += P.mismaProgresion;
  if (ctx && ctx.tipoEntreno && candidato && lista(candidato.tipos).includes(ctx.tipoEntreno)) p += P.tipoDelEntreno;
  return Math.max(0, Math.min(100, Math.round(p)));
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LA EXPLICACIÓN (apartados 9, 10 y 13)
   ═══════════════════════════════════════════════════════════════════════════

   *"Cada sustitución puede mostrar una explicación breve […] No utilizar
   explicaciones científicas excesivas."* Frases de una línea, y **cada una
   sale de un rasgo que el cálculo ha mirado**. Nunca *"Es exactamente
   igual"*: hay un barrido sobre todos los textos que genera la fase. */

export const EXPRESIONES_PROHIBIDAS = [/exactamente igual/i, /id[eé]ntic/i, /es lo mismo/i, /equivalente/i, /\d+\s*%\s*compatible/i];

const nombreLower = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '');

export function motivosDe(r, original, candidato, disp = null, ctx = null) {
  if (!r) return [];
  const out = [];
  const pa = patronDe(original);
  const fam = pa ? familiaPatron(pa.familia) : null;
  const pc = musculoPrincipal(candidato);
  /* Lo que no se puede hacer aquí va primero: es lo que decide. */
  if (disp && disp.disponible === false) {
    if (disp.fueraDeEntorno && ctx && ctx.entornos.length === 1) {
      out.push(`En ${nombreLower(entornoPorId(ctx.entornos[0])?.nombre || '')} no se puede hacer.`);
    } else if (disp.fueraDeEntorno) {
      out.push('No se puede hacer donde entrenas hoy.');
    }
    if (disp.faltan.length) {
      out.push(`Necesita ${disp.faltan.map((x) => nombreLower(equipoPorId(x)?.nombre || x)).join(' y ')}.`);
    }
  }
  if (r.familia) out.push('Es otra versión del mismo ejercicio.');
  if (r.mismoPatron && pa) out.push(`Trabaja principalmente el mismo patrón: ${pa.nombre.toLowerCase()}.`);
  else if (r.mismaFamiliaDePatron && fam) out.push(`Los dos son de ${fam.nombre}, pero el movimiento no es el mismo.`);
  if (r.mismoMusculoPrincipal && pc) out.push(`Mismo músculo principal: ${nombreLower(pc.nombre)}.`);
  else if (r.mismoGrupo && pc) out.push(`Trabaja el mismo grupo: ${nombreLower(pc.grupo)}.`);
  if (r.menosMaterial) out.push('Alternativa con menor demanda de equipamiento.');
  else if (r.ningunoNecesitaMaterial) out.push('Tampoco necesita material.');
  else if (r.mismoMaterial) out.push('Usa el mismo material.');
  if (!r.mismaMedida) {
    if (r.medidaCandidato === 'tiempo') out.push('Se mide en segundos, no en repeticiones.');
    else if (r.medidaOriginal === 'tiempo') out.push('Se mide en repeticiones, no en segundos.');
    else if (r.medidaCandidato === 'corporal') out.push('Con tu peso corporal, sin carga externa.');
    else out.push('Con carga externa.');
  }
  if (r.declarado && !r.familia && !r.mismoPatron) out.push('Es un sustituto habitual de este ejercicio.');
  if (r.mismaProgresion && !r.familia) out.push('Está en la misma progresión.');
  if (!r.mismaLateralidad) out.push(r.unilateralCandidato ? 'Se trabaja un lado cada vez.' : 'Se trabajan los dos lados a la vez.');
  if (r.distanciaDificultad >= 2) out.push('Bastante más difícil.');
  else if (r.distanciaDificultad === 1) out.push('Algo más difícil.');
  else if (r.distanciaDificultad <= -1) out.push('Algo más fácil.');
  if (!out.length) out.push('Comparte parte del trabajo muscular.');
  return out;
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LA CONFIGURACIÓN (apartados 11, 12 y 13)
   ═══════════════════════════════════════════════════════════════════════════

   · **Se conservan** series, descanso y notas (apartado 11).
   · **La medida** se queda si el nuevo la admite; si no, pasa a la suya —un
     L-sit se mide en segundos—, y entonces las repeticiones **no se copian
     como segundos** (apartado 12): se quedan sin número, que es la
     configuración predeterminada de la F3 (*"un «10» puesto de oficio es un
     dato que él no ha decidido"*), **y se dice** (apartado 13).
   · **El peso no viaja nunca**: 60 kg de barra no dicen nada de unas
     mancuernas (F7). Y el tipo de carga se propone del nuevo.

   ⚠️ *"Recalcular reps/tiempo"* (apartado 13) **no inventa un número**: si la
   medida es la misma, las repeticiones que él puso siguen siendo una
   configuración válida. Lo que se recalcula es la medida y la carga. */

export function tipoDeCargaPropuesto(ej) {
  if (!ej) return 'externo';
  const clase = claseDeMedida(ej);
  if (clase === 'carga') return 'externo';
  if (lista(ej.equipamiento).includes('lastre')) return 'adicional';
  return 'corporal';
}

/** La configuración de un ejercicio de la sesión en vivo, con la forma de una
 *  línea: cuántas series cuentan, cómo se mide y lo que decía su plan. Se lee
 *  del snapshot de la F7 sin importar `entrenamiento.js` (que importa esto). */
export function configuracionDeSesion(ejSesion) {
  const e = ejSesion || {};
  const series = lista(e.series).filter((x) => x && x.estado !== 'omitida');
  const primera = lista(e.series).find((x) => x && x.origen === 'planificada') || series[0] || null;
  const plan = (primera && primera.plan) || {};
  const peso = lista(e.series).map((x) => x?.plan?.peso ?? x?.hecho?.peso ?? null).find((v) => v !== null && v !== undefined) ?? null;
  return {
    series: series.length || null,
    modo: e.modo === 'tiempo' ? 'tiempo' : 'reps',
    repeticiones: plan.reps ?? null,
    repsHasta: plan.repsHasta ?? null,
    duracion: plan.duracion ?? null,
    peso,
    descanso: e.descanso ?? null,
    notas: texto(e.notas),
  };
}

export function configuracionRecomendada(actual, original, nuevo) {
  const a = actual || {};
  const modoActual = a.modo === 'tiempo' ? 'tiempo' : 'reps';
  const modo = admiteModo(nuevo, modoActual) ? modoActual : modoPropuesto(nuevo);
  const cambiaMedida = modo !== modoActual;
  const reps = a.repeticiones ?? a.reps ?? null;
  const conserva = ['series', 'descanso', 'notas'];
  const cambia = [];
  let aviso = null;
  if (cambiaMedida) {
    cambia.push('medida');
    const nombre = nuevo ? nombreCompleto(nuevo) : 'Este ejercicio';
    aviso = modo === 'tiempo'
      ? `${nombre} se mide en segundos: las repeticiones no se han copiado. Pon cuánto tiempo aguantas.`
      : `${nombre} se mide en repeticiones: el tiempo no se ha copiado. Pon cuántas repeticiones.`;
  } else {
    conserva.push(modo === 'tiempo' ? 'tiempo' : 'repeticiones');
  }
  const peso = a.peso ?? null;
  if (peso !== null && peso !== undefined && original && nuevo && original.id !== nuevo.id) cambia.push('peso');
  return {
    series: enteroONull(a.series),
    modo,
    repeticiones: cambiaMedida || modo === 'tiempo' ? null : enteroONull(reps),
    repsHasta: cambiaMedida || modo === 'tiempo' ? null : enteroONull(a.repsHasta),
    duracion: cambiaMedida || modo !== 'tiempo' ? null : enteroONull(a.duracion),
    /* El peso era del otro ejercicio. */
    peso: null,
    tipoCarga: tipoDeCargaPropuesto(nuevo),
    descanso: enteroONull(a.descanso),
    notas: texto(a.notas),
    conserva,
    cambia,
    cambiaMedida,
    predeterminada: cambiaMedida,
    aviso,
    avisoPeso: cambia.includes('peso') ? 'El peso no se copia: era de otro ejercicio.' : null,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · EL ÍNDICE (apartado 36)
   ═══════════════════════════════════════════════════════════════════════════

   *"No recalcular toda la base de ejercicios cada vez."* Los candidatos se
   buscan en un índice por patrón, por familia de patrón y por músculo
   trabajado de verdad (principal o secundario, no los estabilizadores, que
   son casi todos). El del catálogo se construye **una vez**; el de los
   propios, una vez por lista (un `WeakMap` sobre el array). */

let indiceCatalogo = null;
const indicesPropios = new WeakMap();

function construirIndice(ejercicios) {
  const porPatron = new Map();
  const porFamilia = new Map();
  const porSubgrupo = new Map();
  const meter = (mapa, k, id) => {
    if (!k) return;
    if (!mapa.has(k)) mapa.set(k, new Set());
    mapa.get(k).add(id);
  };
  for (const e of ejercicios) {
    const p = patronDe(e);
    meter(porPatron, p?.id, e.id);
    meter(porFamilia, p?.familia, e.id);
    for (const m of lista(e.musculos)) if (m.papel !== 'estabilizador') meter(porSubgrupo, m.subgrupoId, e.id);
  }
  return { porPatron, porFamilia, porSubgrupo, total: ejercicios.length };
}

/* 🔓 FIT F35, apartado 37 — un ejercicio archivado no se propone: sale de los
   dos índices. ⚠️ Y los propios se sacan de SU lista, no recortando
   `todosLosEjercicios` por la longitud del catálogo: sin los archivados, ese
   corte se habría desplazado y un ejercicio del catálogo habría entrado como
   propio (o uno propio se habría quedado fuera). */
const activo = (e) => e && e.archivado !== true;
export function indiceDeSustitucion(propios = []) {
  if (!indiceCatalogo) indiceCatalogo = construirIndice(CATALOGO_EJERCICIOS.filter(activo));
  const l = lista(propios);
  if (!l.length) return { catalogo: indiceCatalogo, propios: null };
  if (!indicesPropios.has(l)) indicesPropios.set(l, construirIndice(l.map(normalizarEjercicioCompleto).filter(activo)));
  return { catalogo: indiceCatalogo, propios: indicesPropios.get(l) };
}

function candidatosDe(original, propios = []) {
  const { catalogo, propios: ip } = indiceDeSustitucion(propios);
  const ids = new Set();
  const p = patronDe(original);
  const subs = lista(original?.musculos).filter((m) => m.papel !== 'estabilizador').map((m) => m.subgrupoId);
  for (const ind of [catalogo, ip].filter(Boolean)) {
    if (p) {
      (ind.porPatron.get(p.id) || []).forEach((id) => ids.add(id));
      (ind.porFamilia.get(p.familia) || []).forEach((id) => ids.add(id));
    }
    for (const s of subs) (ind.porSubgrupo.get(s) || []).forEach((id) => ids.add(id));
  }
  lista(original?.sustitutos).forEach((id) => ids.add(id));
  lista(original?.variantes).forEach((id) => ids.add(id));
  if (original?.base) ids.add(original.base);
  const raiz = raizDe(original, propios);
  if (raiz) variantesDe(raiz, propios).forEach((v) => ids.add(v.id));
  ids.delete(original?.id);
  return [...ids].map((id) => ejercicioPorId(id, propios)).filter(activo);
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · LA LÓGICA CENTRAL (apartados 27, 30 y 33)
   ═══════════════════════════════════════════════════════════════════════════ */

/** La clave del apartado 30: *"No mostrar el mismo ejercicio + la misma
 *  variante varias veces"*. Un ejercicio suyo que se llame igual que uno del
 *  catálogo es el mismo en pantalla. */
export const claveDeDuplicado = (ej) => `${ranura(ej?.nombre)}|${ranura(ej?.variante)}`;

/**
 * 🚨 Apartado 33 — `getExerciseReplacements(exerciseId, context)`.
 *
 * Devuelve **todas** las compatibles, de los cuatro niveles, ordenadas por el
 * apartado 27: muy similares, después lo que se puede hacer con el material
 * del entrenamiento, el mismo patrón, el mismo grupo y el resto. Quien pinta
 * decide qué niveles enseña (`NIVELES_VISIBLES`).
 */
export function getExerciseReplacements(exerciseId, context = {}) {
  const ctx = contextoDeSustitucion(context, { original: exerciseId });
  const propios = ctx.propios;
  const original = ejercicioPorId(texto(exerciseId), propios);
  if (!original) return [];
  const vistos = new Set();
  const salida = candidatosDe(original, propios)
    .filter((c) => !ctx.excluir.has(c.id))
    .map((candidato) => {
      const r = rasgosEnComun(original, candidato, propios);
      const base = nivelDeCompatibilidad(r);
      if (!base) return null;
      const disp = disponibilidad(candidato, ctx);
      const nivel = nivelEnContexto(base, disp);
      const reasons = motivosDe(r, original, candidato, disp, ctx);
      return {
        id: candidato.id,
        exercise: candidato,
        variant: candidato.variante || null,
        relacion: r.familia,
        compatibilityLevel: nivel,
        nivelSinContexto: base,
        compatibilityScore: puntuacion(r, { candidato, ctx }),
        reasons,
        availableEquipment: lista(candidato.equipamiento).map((id) => ({
          id,
          nombre: equipoPorId(id)?.nombre || id,
          disponible: ctx.noTengo.has(id) ? false
            : (equipoPorId(id)?.sinMaterial || ctx.detectado.has(id) || (ctx.equipamiento && ctx.equipamiento.has(id))) ? true
              : null,
        })),
        recommendedConfiguration: configuracionRecomendada(ctx.configuracion, original, candidato),
        disponible: disp.disponible,
        conMaterialDelEntreno: disp.conMaterialDelEntreno,
        mismoPatron: r.mismoPatron,
        mismoGrupo: r.mismoGrupo,
        rasgos: r,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const na = nivelCompatibilidad(a.compatibilityLevel).orden;
      const nb = nivelCompatibilidad(b.compatibilityLevel).orden;
      if (na !== nb) return na - nb;
      const da = a.disponible === true || a.conMaterialDelEntreno ? 0 : 1;
      const db = b.disponible === true || b.conMaterialDelEntreno ? 0 : 1;
      if (da !== db) return da - db;
      if (a.mismoPatron !== b.mismoPatron) return a.mismoPatron ? -1 : 1;
      if (a.mismoGrupo !== b.mismoGrupo) return a.mismoGrupo ? -1 : 1;
      if (a.compatibilityScore !== b.compatibilityScore) return b.compatibilityScore - a.compatibilityScore;
      return nombreCompleto(a.exercise).localeCompare(nombreCompleto(b.exercise), 'es');
    })
    .filter((x) => {
      const k = claveDeDuplicado(x.exercise);
      if (vistos.has(x.id) || vistos.has(k)) return false;
      vistos.add(x.id);
      vistos.add(k);
      return true;
    });
  return salida;
}

/** El nombre de la casa. */
export const sustitucionesDe = getExerciseReplacements;

/**
 * Lo que se enseña al confirmar una elección, venga de la lista o de la
 * búsqueda a mano (apartado 25). Uno elegido a mano que no está entre los
 * compatibles **no lleva nivel**: se le respeta la elección y no se le inventa
 * una compatibilidad que el cálculo no ha dado.
 */
export function sustitucionElegida(exerciseId, exerciseIdNuevo, context = {}) {
  const ctx = contextoDeSustitucion(context, { original: exerciseId });
  const original = ejercicioPorId(texto(exerciseId), ctx.propios);
  const nuevo = ejercicioPorId(texto(exerciseIdNuevo), ctx.propios);
  if (!nuevo || (original && original.id === nuevo.id)) return null;
  const deLaLista = original
    ? getExerciseReplacements(original.id, context).find((x) => x.id === nuevo.id)
    : null;
  if (deLaLista) return deLaLista;
  return {
    id: nuevo.id,
    exercise: nuevo,
    variant: nuevo.variante || null,
    relacion: null,
    compatibilityLevel: null,
    nivelSinContexto: null,
    compatibilityScore: null,
    reasons: ['Elegido a mano.'],
    availableEquipment: [],
    recommendedConfiguration: configuracionRecomendada(ctx.configuracion, original, nuevo),
    disponible: disponibilidad(nuevo, ctx).disponible,
    conMaterialDelEntreno: false,
    mismoPatron: false,
    mismoGrupo: false,
    rasgos: null,
  };
}

/** Cuándo hay que enseñar la confirmación antes de cambiar. ⚠️ **Solo cuando
 *  hay algo que decir** (EH F61: un aviso delante de cada toque enseña a no
 *  leerlos): datos ya registrados (F9), una medida que cambia (apartado 12),
 *  un peso que no se copia, o un objetivo del original (apartado 21). */
export function necesitaConfirmar(item, { conDatos = false, objetivo = null } = {}) {
  if (!item) return false;
  const c = item.recommendedConfiguration || {};
  return !!(conDatos || c.cambiaMedida || c.avisoPeso || objetivo);
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · FILTROS (apartados 7 y 26) Y LA PANTALLA
   ═══════════════════════════════════════════════════════════════════════════ */

/** Los tipos del filtro: la estructura y las modalidades, **por ids** del
 *  catálogo de la F2. */
export const TIPOS_FILTRO = ['compuesto', 'aislamiento', 'isometrico', 'explosivo', 'habilidad'];

export function filtrarSustituciones(items, {
  soloDisponibles = false, entorno = null, dificultad = null, grupo = null, tipo = null,
} = {}) {
  return lista(items).filter((x) => {
    const e = x.exercise;
    if (soloDisponibles && x.disponible === false) return false;
    if (entorno && !lista(e.entornos).includes(entorno)) return false;
    if (dificultad && e.dificultad !== dificultad) return false;
    if (grupo && musculoPrincipal(e)?.grupoId !== grupo) return false;
    if (tipo) {
      const t = [...lista(e.tipos), ...modalidadesDe(e)];
      if (!t.includes(tipo)) return false;
    }
    return true;
  });
}

/** Apartado 26 — *"No sobrecargar la interfaz móvil"*: una fila de filtro
 *  **solo existe si separa algo** (dos valores o más entre lo que hay), y cada
 *  pastilla lleva cuántas quedarían (FIT F2, apartado 23). */
export function opcionesDeFiltro(items) {
  const l = lista(items);
  const contar = (valores, de) => valores
    .map((v) => ({ ...v, cuantos: l.filter((x) => de(x.exercise, v.id)).length }))
    .filter((v) => v.cuantos > 0);
  const filas = {
    entorno: contar(ENTORNOS, (e, id) => lista(e.entornos).includes(id)),
    dificultad: contar(DIFICULTADES, (e, id) => e.dificultad === id),
    grupo: contar(GRUPOS_MUSCULARES.map((g) => ({ id: g.id, nombre: g.nombre })), (e, id) => musculoPrincipal(e)?.grupoId === id),
    tipo: contar(
      TIPOS_FILTRO.map((id) => ({ id, nombre: (TIPOS_EJERCICIO.find((t) => t.id === id) || {}).nombre || id })),
      (e, id) => [...lista(e.tipos), ...modalidadesDe(e)].includes(id),
    ),
  };
  return Object.fromEntries(Object.entries(filas).filter(([, v]) => v.length >= 2));
}

/** El material que se puede marcar como «no lo tengo»: solo el que aparece
 *  en las propuestas —ofrecer «no tengo anillas» cuando ninguna las usa sería
 *  un control que no cambia nada (regla 8)—. */
export function materialDeLasPropuestas(items) {
  const ids = new Set(lista(items).flatMap((x) => materialDe(x.exercise)));
  return EQUIPAMIENTO.filter((e) => ids.has(e.id)).map((e) => ({ id: e.id, nombre: e.nombre }));
}

export const TEXTOS_SUSTITUCION = {
  titulo: 'Reemplazar ejercicio',
  vacio: 'No encontramos una alternativa clara.',
  vacioTexto: 'Puedes elegir cualquier ejercicio del catálogo.',
  buscarTodos: 'Buscar en todos los ejercicios',
  buscarOtro: 'Buscar otro ejercicio',
  soloDisponible: 'Solo disponible',
  verPoco: 'Ver también las poco recomendables',
  ocultarPoco: 'Ocultar las poco recomendables',
  filtros: 'Filtros',
  sinFicha: 'Este ejercicio ya no está en el catálogo, así que no se sabe qué trabajaba. Puedes elegir otro a mano.',
  soloSesion: 'Solo cambia este entrenamiento: el plan, la plantilla y el catálogo no se tocan.',
  soloBorrador: 'Cambia este entrenamiento que estás editando. El ejercicio del catálogo no se toca.',
};

/**
 * Lo que la pantalla de sustitución necesita, ya repartido por niveles. Es
 * `getExerciseReplacements` más los filtros y el apartado 2: lo que no es
 * visible solo se enseña si se pide.
 */
export function pantallaDeSustitucion(exerciseId, context = {}, {
  filtros = {}, verPocoRecomendables = false,
} = {}) {
  const ctx = contextoDeSustitucion(context, { original: exerciseId });
  const original = ejercicioPorId(texto(exerciseId), ctx.propios);
  if (!original) {
    return { estado: 'sin_ficha', original: null, grupos: [], total: 0, ocultas: 0, opciones: {}, material: [], hayNoDisponibles: false, texto: TEXTOS_SUSTITUCION.sinFicha };
  }
  const todas = getExerciseReplacements(original.id, context);
  const filtradas = filtrarSustituciones(todas, filtros);
  const visibles = filtradas.filter((x) => verPocoRecomendables || NIVELES_VISIBLES.includes(x.compatibilityLevel));
  const ocultas = filtradas.length - visibles.length;
  const grupos = NIVELES_COMPATIBILIDAD
    .map((n) => ({ nivel: n, items: visibles.filter((x) => x.compatibilityLevel === n.id) }))
    .filter((g) => g.items.length);
  return {
    estado: visibles.length ? 'ok' : 'vacio',
    original,
    grupos,
    total: visibles.length,
    ocultas,
    opciones: opcionesDeFiltro(todas),
    material: materialDeLasPropuestas(todas),
    hayNoDisponibles: todas.some((x) => x.disponible === false),
    texto: visibles.length ? '' : TEXTOS_SUSTITUCION.vacio,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   10 · LOS OBJETIVOS (apartado 21)
   ═══════════════════════════════════════════════════════════════════════════

   *"Este objetivo pertenece al ejercicio original."* Tres opciones, y **por
   defecto se mantiene**. ⚠️ Mantener no escribe nada: el objetivo ya apunta
   al `exerciseId` original desde la F14, y sustituir no lo cambia. */
export const AVISO_OBJETIVO = {
  titulo: 'Este objetivo pertenece al ejercicio original.',
  mantener: 'Mantener objetivo',
  cancelar: 'Cancelar objetivo',
  crear: 'Crear uno nuevo',
  porDefecto: 'mantener',
};
export const OPCIONES_OBJETIVO = ['mantener', 'cancelar', 'crear'];

/* ═══════════════════════════════════════════════════════════════════════════
   11 · LO QUE NO SE TRANSFIERE, LO QUE NO SE HACE Y LO DECIDIDO
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartados 18-24 y 40 — cada sistema con su fuente de verdad. Cada línea
 *  dice **por qué no hace falta código**: todos leen por `exerciseId`. */
export const LO_QUE_NO_SE_TRANSFIERE = [
  { id: 'historial', apartado: 18, que: 'El historial', porque: 'Sustituir solo toca la sesión en curso; las completadas no se reescriben.' },
  { id: 'progreso', apartado: 19, que: 'El progreso', porque: 'La F11 compara por `exerciseId` y clase: el de mancuernas tiene su gráfica y el de barra la suya.' },
  { id: 'musculos', apartado: 20, que: 'Los músculos', porque: 'Suman al grupo por el catálogo del nuevo (F13), sin una equivalencia de rendimiento.' },
  { id: 'objetivos', apartado: 21, que: 'Los objetivos', porque: 'Apuntan al ejercicio original y, por defecto, se quedan ahí.' },
  { id: 'rangos', apartado: 22, que: 'El rango y el score', porque: 'El motor de la F19 calcula cada ejercicio con sus sesiones.' },
  { id: 'clasificacion', apartado: 23, que: 'La clasificación', porque: 'Vive por `exerciseId` en `fitness.clasificaciones`; el nuevo entra en la cola de la F24 si no la tiene.' },
  { id: 'favoritos', apartado: 24, que: 'Los favoritos', porque: 'Los ejercicios no tienen favoritos: los únicos son los de los planes (F5), y no se tocan.' },
];

export const NO_EN_FIT33 = [
  { que: 'IA para proponer sustitutos', porque: 'Apartado 35: *"determinista, rápido, explicable, testeable"*.' },
  { que: 'Un porcentaje de compatibilidad a la vista', porque: 'Apartado 33: *"La puntuación es interna."*' },
  { que: 'Un segundo buscador de sustitutos', porque: 'Los de la F7, la F9 y la F3 llaman a éste.' },
  { que: 'Un recorrido completo o parcial por ejercicio', porque: 'El catálogo no lo guarda; inventarlo sería una cifra que nadie ha medido (regla 8).' },
  { que: 'Un «Reemplazar» dentro de un plan oficial', porque: 'Apartado 17: se personaliza (F5) y se cambia en la copia.' },
];

export const DECISIONES_FIT33 = [
  {
    que: 'El patrón de movimiento es un campo del ejercicio',
    porque: 'No se deducía de nada: el músculo principal no separa un press de banca de unos fondos. Va en la línea de cada ejercicio (EH F30), no en un mapa aparte.',
  },
  {
    que: 'Isométrico, explosivo y skill son modalidades, no patrones',
    porque: 'Ya existían en `tipos` y `explosivo`; el apartado 4 manda reutilizarlos.',
  },
  {
    que: 'El nivel sale de puertas y la puntuación solo ordena',
    porque: 'Con una suma, el press en máquina salía «Muy similar»; el apartado 5 dice «Similar».',
  },
  {
    que: 'Con el material se quita de más antes que proponer algo imposible',
    porque: 'La lista de la F2 no dice qué es imprescindible. Los grupos de `EQUIPAMIENTO` salvan lo que sí se sabe (la silla por el banco).',
  },
  {
    que: 'Lo que no se puede hacer aquí baja a «Poco recomendable», no desaparece',
    porque: 'Apartado 6: no recomendarlo automáticamente. Sigue ahí si él lo pide, y «Solo disponible» lo quita del todo.',
  },
  {
    que: '«Recalcular» no inventa un número',
    porque: 'Con la misma medida, sus repeticiones siguen siendo válidas (apartado 11). Si cambia la medida, se queda sin número —el constructor tampoco pone uno (F3)— y se avisa (apartado 13).',
  },
  {
    que: 'Un ejercicio archivado es uno que ya no está en el catálogo',
    porque: 'Como candidato no puede salir, porque no hay ficha; como original se enseña con su id en el historial (F29, C-36) y se ofrece la búsqueda a mano.',
  },
  {
    que: 'Del «plan» de una serie de la sesión solo se quita el peso al sustituir',
    porque: 'La F7 lo congela al empezar, y las repeticiones planificadas se quedan: en segundos no se leen como segundos, queda «sin planificar», que es la verdad. El peso sí se quita, porque el «+» parte de él (F9) y era del otro ejercicio; lo que decía la plantilla sigue en `linea`.',
  },
];

/** La auditoría: el catálogo entero tiene patrón, ningún texto promete
 *  equivalencia y el ejemplo del apartado 5 sale como dice el enunciado. */
export function auditarSustitucion() {
  const sinPatron = CATALOGO_EJERCICIOS.filter((e) => !patronDe(e)).map((e) => e.id);
  const ej5 = getExerciseReplacements('press-banca-barra', { entorno: 'gym' });
  const nivel = (id) => ej5.find((x) => x.id === id)?.compatibilityLevel || null;
  const textos = CATALOGO_EJERCICIOS.slice(0, 40)
    .flatMap((e) => getExerciseReplacements(e.id, {}).flatMap((x) => x.reasons));
  const prometeEquivalencia = textos.filter((t) => EXPRESIONES_PROHIBIDAS.some((re) => re.test(t)));
  const casillas = [
    { id: 'patrones', ok: sinPatron.length === 0, detalle: sinPatron },
    { id: 'ejemplo_apartado_5', ok: nivel('press-banca-mancuernas') === 'muy_similar' && nivel('press-maquina-pecho') === 'similar' && nivel('flexion') === 'alternativa' },
    { id: 'sin_equivalencias', ok: prometeEquivalencia.length === 0, detalle: prometeEquivalencia },
    { id: 'sin_si_mismo', ok: CATALOGO_EJERCICIOS.every((e) => !getExerciseReplacements(e.id, {}).some((x) => x.id === e.id)) },
  ];
  return { casillas, ok: casillas.every((c) => c.ok) };
}

/* Para quien necesite el nombre de un patrón o de un subgrupo sin importar dos
   archivos. */
export const nombreDePatron = (id) => patronMovimiento(id)?.nombre || '';
export const nombreDeSubgrupo = (id) => subgrupoMuscular(id)?.nombre || '';
export { PATRONES_MOVIMIENTO, FAMILIAS_PATRON };
