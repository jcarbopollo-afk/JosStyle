import { uid } from './helpers';
import {
  GRUPOS_MUSCULARES, subgrupoMuscular, TODOS_LOS_SUBGRUPOS, normalizarFitness,
} from './fitness';
import { CATALOGO_BRUTO } from './catalogoEjercicios';

/* Entrega 4 · Fase 2/45 — «Sistema y catálogo maestro de ejercicios».
   ═══════════════════════════════════════════════════════════════════════════

   El enunciado lo dice en la primera línea del objetivo: este catálogo va a ser
   *"la fuente de verdad para prácticamente todo Fitness"* — rutinas, planes,
   sesiones, historial, rangos, sustituciones y la IA leerán de aquí. Así que lo
   que importa no es la cantidad, sino que **la forma del dato aguante las 43
   fases que vienen detrás** sin tener que rehacerla.

   ───────────────────────────────────────────────────────────────────────────
   1 · LA UNIDAD ES EL EJERCICIO, Y ESO NO ES UNA FRASE
   ───────────────────────────────────────────────────────────────────────────

   *"NO diseñes el sistema alrededor de «pecho», «espalda», etc."* (apartado 22
   de la F1, repetido en el objetivo de ésta). Aquí eso significa que **no hay
   ni una lista `ejerciciosDePecho`**: la relación grupo → ejercicios se
   **deriva** de las implicaciones de cada ejercicio, que es lo que ya hacía
   `grupoConEjercicios` en la F1. Una lista guardada por grupo se quedaría vieja
   en cuanto alguien corrigiera un porcentaje.

   ───────────────────────────────────────────────────────────────────────────
   2 · ENTORNO Y EQUIPAMIENTO SON DOS COSAS (apartado 7)
   ───────────────────────────────────────────────────────────────────────────

   El enunciado se para expresamente en esto: *"No confundas entorno con
   equipamiento"*. Un ejercicio de **calistenia** puede necesitar **anillas**;
   uno de **casa**, **mancuernas**; uno de **gym**, **polea**. Son dos campos
   independientes y los dos son listas: las dominadas valen en gimnasio y en
   calistenia, y las flexiones valen en los tres sitios.

   Esto es lo que va a permitir, en una fase posterior, la adaptación de rutinas
   —*"esto en casa no lo puedes hacer, prueba con esto otro"*—, así que **ni un
   ejercicio se queda sin declararlo**: hay una comprobación por cada uno.

   ───────────────────────────────────────────────────────────────────────────
   3 · LOS PORCENTAJES SUMAN 100 Y LA PRUEBA LO MIDE (apartado 5)
   ───────────────────────────────────────────────────────────────────────────

   *"La suma de porcentajes de un ejercicio debe ser: 100 %"*, y el apartado 29
   lo pone como validación obligatoria. No son verdad científica —el propio
   enunciado dice que son *"una estimación funcional coherente"*— pero **sí
   tienen que cuadrar**, porque la distribución muscular y el cálculo de rangos
   se apoyan en ellos. `auditarCatalogo()` los suma uno a uno.

   ⚠️ Y cada implicación lleva su **papel** (principal, secundario,
   estabilizador): sin él, un 20 % de tríceps en un press de banca pesaría lo
   mismo que un 20 % de tríceps en un press francés, y no es lo mismo.

   ───────────────────────────────────────────────────────────────────────────
   4 · UN EJERCICIO NO ES SIEMPRE SERIES × REPETICIONES (apartados 14 y 15)
   ───────────────────────────────────────────────────────────────────────────

   *"NO diseñes el modelo pensando únicamente en repeticiones"*. Un L-sit, una
   plancha o un front lever se miden en **segundos**; una carrera, en
   **distancia**. Por eso cada ejercicio declara sus `medidas`, y el
   entrenamiento en vivo de una fase posterior sabrá qué campo pedir.

   ⚠️ **`explosivo` es un campo aparte de `tipos`** aunque parezca redundante:
   el apartado 15 lo pide para que el sistema **no trate un muscle-up como
   hipertrofia convencional**, y eso es una propiedad del movimiento, no una
   categoría de entrenamiento.

   ───────────────────────────────────────────────────────────────────────────
   5 · LOS IDS SON ESTABLES Y NO SALEN DE UN ÍNDICE (apartado 21)
   ───────────────────────────────────────────────────────────────────────────

   *"únicos; estables; predecibles; independientes del texto mostrado. No
   utilices índices de arrays como IDs."* Son ranuras en minúsculas y sin
   acentos —`press-banca-barra`, `dominada-prona`—, así que **renombrar el
   ejercicio no cambia su id** y lo que ya esté guardado en una sesión, un plan
   o un rango sigue apuntando a él.

   ⚠️ **Y por eso los ejercicios del catálogo NO viven en `app_data`.** Son
   datos de la aplicación, como `GRUPOS_MUSCULARES`: guardarlos por usuario
   significaría que una corrección de un porcentaje no le llega nunca a quien ya
   tiene cuenta. Lo que sí vive en `app_data` es **lo que se cree Josué**
   (`fitness.ejercicios`, de la F1), y `ejercicioPorId` mira en los dos sitios.

   ───────────────────────────────────────────────────────────────────────────
   6 · NI UNA URL INVENTADA (apartado 22)
   ───────────────────────────────────────────────────────────────────────────

   *"No inventes vídeos, URLs, imágenes externas, estadísticas, marcas […] No
   quiero enlaces falsos que posteriormente provoquen errores."* Ni un
   ejercicio trae `video`, `thumbnail` ni `ilustracion` con contenido: los
   campos existen y valen `null`, y hay una comprobación que barre el catálogo
   entero buscando `http`. Es la regla 8 del proyecto y D2-03 otra vez. */

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LOS CATÁLOGOS DE APOYO
   ═══════════════════════════════════════════════════════════════════════════ */

/* Dónde se puede hacer (apartados 2 y 7). Es una LISTA en cada ejercicio: las
   dominadas son de gimnasio y de calistenia a la vez. */
export const ENTORNOS = [
  { id: 'gym', nombre: 'Gimnasio', que: 'Con máquinas, barras y discos.' },
  { id: 'calistenia', nombre: 'Calistenia', que: 'Con tu propio peso, en barras y paralelas.' },
  { id: 'casa', nombre: 'Casa', que: 'Sin material, o con lo que tengas a mano.' },
];

/* Qué hace falta (apartado 2, con su lista de ejemplos). Estructurado, no texto
   libre: *"No uses simplemente un texto libre cuando sea posible utilizar
   valores estructurados"*. */
export const EQUIPAMIENTO = [
  { id: 'ninguno', nombre: 'Nada', casero: true },
  { id: 'suelo', nombre: 'Suelo', casero: true },
  { id: 'barra', nombre: 'Barra', casero: false },
  { id: 'discos', nombre: 'Discos', casero: false },
  { id: 'mancuernas', nombre: 'Mancuernas', casero: true },
  { id: 'kettlebell', nombre: 'Kettlebell', casero: true },
  { id: 'banco', nombre: 'Banco', casero: false },
  { id: 'polea', nombre: 'Polea', casero: false },
  { id: 'maquina', nombre: 'Máquina', casero: false },
  { id: 'anillas', nombre: 'Anillas', casero: false },
  { id: 'barra-dominadas', nombre: 'Barra de dominadas', casero: true },
  { id: 'paralelas', nombre: 'Paralelas', casero: false },
  { id: 'banda', nombre: 'Banda elástica', casero: true },
  { id: 'silla', nombre: 'Silla', casero: true },
  { id: 'lastre', nombre: 'Lastre', casero: false },
  { id: 'mochila', nombre: 'Mochila', casero: true },
];

export const DIFICULTADES = [
  { id: 'principiante', nombre: 'Principiante', orden: 1 },
  { id: 'intermedio', nombre: 'Intermedio', orden: 2 },
  { id: 'avanzado', nombre: 'Avanzado', orden: 3 },
  { id: 'experto', nombre: 'Experto', orden: 4 },
];

/* La clasificación funcional del apartado 4. Un ejercicio puede llevar varias:
   un press de banca es compuesto **y** de fuerza **y** de hipertrofia. */
export const TIPOS_EJERCICIO = [
  { id: 'compuesto', nombre: 'Compuesto', que: 'Mueve varias articulaciones a la vez.' },
  { id: 'aislamiento', nombre: 'Aislamiento', que: 'Se centra en un músculo.' },
  { id: 'fuerza', nombre: 'Fuerza', que: 'Cargas altas, pocas repeticiones.' },
  { id: 'hipertrofia', nombre: 'Hipertrofia', que: 'Volumen para crecer.' },
  { id: 'isometrico', nombre: 'Isométrico', que: 'Se aguanta una posición.' },
  { id: 'explosivo', nombre: 'Explosivo', que: 'Velocidad y potencia.' },
  { id: 'movilidad', nombre: 'Movilidad', que: 'Rango de movimiento y control.' },
  { id: 'habilidad', nombre: 'Habilidad', que: 'Se entrena la técnica, no el músculo.' },
];

/* Apartado 9. *"No todos los ejercicios necesitan agarre"*: el campo es `null`
   cuando no aplica, y eso no es un hueco, es la respuesta. */
export const AGARRES = [
  { id: 'prono', nombre: 'Prono', que: 'Palmas hacia fuera.' },
  { id: 'supino', nombre: 'Supino', que: 'Palmas hacia ti.' },
  { id: 'neutro', nombre: 'Neutro', que: 'Palmas enfrentadas.' },
  { id: 'mixto', nombre: 'Mixto', que: 'Una de cada.' },
  { id: 'cerrado', nombre: 'Cerrado', que: 'Manos juntas.' },
  { id: 'medio', nombre: 'Medio', que: 'A la anchura de los hombros.' },
  { id: 'ancho', nombre: 'Ancho', que: 'Más abiertas que los hombros.' },
  { id: 'libre', nombre: 'Libre', que: 'Como te resulte cómodo.' },
];

/* El papel de cada músculo dentro del ejercicio (apartado 5). `peso` no se usa
   todavía: lo usará el cálculo de rangos, y está aquí para que ese día no haya
   que inventarse una escala nueva. */
export const PAPELES = [
  { id: 'principal', nombre: 'Principal', peso: 1 },
  { id: 'secundario', nombre: 'Secundario', peso: 0.5 },
  { id: 'estabilizador', nombre: 'Estabilizador', peso: 0.25 },
];

/* Qué se apunta de una serie (apartados 14 y 15). Un ejercicio declara las
   suyas, y el entrenamiento en vivo sabrá qué campos pedir. */
export const MEDIDAS = [
  { id: 'reps', nombre: 'Repeticiones', unidad: 'reps' },
  { id: 'peso', nombre: 'Peso', unidad: 'kg' },
  { id: 'tiempo', nombre: 'Tiempo', unidad: 's' },
  { id: 'distancia', nombre: 'Distancia', unidad: 'm' },
];

export const entorno = (id) => ENTORNOS.find((e) => e.id === id) || null;
export const equipo = (id) => EQUIPAMIENTO.find((e) => e.id === id) || null;
export const dificultad = (id) => DIFICULTADES.find((d) => d.id === id) || null;
export const tipoEjercicio = (id) => TIPOS_EJERCICIO.find((t) => t.id === id) || null;
export const agarre = (id) => AGARRES.find((a) => a.id === id) || null;
export const papel = (id) => PAPELES.find((p) => p.id === id) || null;
export const medida = (id) => MEDIDAS.find((m) => m.id === id) || null;

/* ═══════════════════════════════════════════════════════════════════════════
   2 · EL MODELO, AMPLIADO DE FORMA COMPATIBLE (apartado 1)
   ═══════════════════════════════════════════════════════════════════════════

   *"Si los modelos de la Fase 1 necesitan ampliarse […] amplíalos de forma
   compatible. No rompas las funcionalidades anteriores."*

   El `Exercise` de la F1 tenía `id`, `nombre`, `variante`, `entorno`,
   `equipamiento`, `musculos`, `tutorial`, `recurso` y `anatomia`. Aquí **no se
   renombra ni uno**: se añaden los que faltaban y `entorno` —que era una cadena—
   se absorbe en `entornos`, la lista, **desde el normalizador**. Es
   `absorberColeccionId` de la BL F7 y `programaIds` de AS F1 otra vez: lo
   guardado no se pierde ni se mueve, y no quedan dos fuentes de verdad. */

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const lista = (v) => (Array.isArray(v) ? v : []);
const numeroONull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const idsDe = (v, catalogo) => lista(v).map(texto).filter((x) => catalogo.some((c) => c.id === x));

/* Una ranura estable a partir del nombre (apartado 21). Solo se usa para
   PROPONER el id de un ejercicio que se cree desde la aplicación; los del
   catálogo lo llevan escrito, porque un id no puede cambiar si alguien corrige
   una tilde del nombre. */
export function ranura(nombre) {
  return texto(nombre)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* El tutorial y las instrucciones del apartado 11 y 12. Existen siempre, vacíos
   si no hay nada: así una pantalla puede preguntar `tiene()` en vez de
   comprobar cuatro campos, y **no hay URLs inventadas** (apartado 22). */
export function crearTutorial({ video = null, animacion = null, notas = '' } = {}) {
  return { video: video || null, animacion: animacion || null, notas: texto(notas) };
}

export function crearInstrucciones({
  preparacion = '', ejecucion = '', respiracion = '', errores = [], consejos = [],
} = {}) {
  return {
    preparacion: texto(preparacion),
    ejecucion: texto(ejecucion),
    respiracion: texto(respiracion),
    errores: lista(errores).map(texto).filter(Boolean),
    consejos: lista(consejos).map(texto).filter(Boolean),
  };
}

/* Los recursos visuales del apartado 10. **Todos nacen a `null`**: el enunciado
   permite *"referencias internas o valores vacíos"* y prohíbe expresamente
   inventar enlaces. */
export function crearRecursos({ thumbnail = null, ilustracion = null, anatomia = null } = {}) {
  return { thumbnail: thumbnail || null, ilustracion: ilustracion || null, anatomia: anatomia || null };
}

export function normalizarImplicacionCompleta(musculos) {
  return lista(musculos)
    .map((m) => ({
      subgrupoId: texto(m?.subgrupoId),
      porcentaje: numeroONull(m?.porcentaje),
      papel: papel(texto(m?.papel)) ? texto(m.papel) : 'secundario',
    }))
    .filter((m) => m.subgrupoId && subgrupoMuscular(m.subgrupoId));
}

export function crearEjercicioCompleto({
  id = null, nombre = '', nombreCorto = '', descripcion = '', categoria = '', variante = '',
  base = null, entornos = [], entorno: entornoViejo = '', equipamiento = [],
  dificultad: dif = 'principiante', tipos = [], musculos = [], agarre: ag = null,
  medidas = ['reps'], explosivo = false, progresiones = [], sustitutos = [], variantes = [],
  tutorial = null, instrucciones = null, recursos = null, nombreTecnico = '',
} = {}) {
  return {
    id: texto(id) || ranura(nombre) || uid(),
    nombre: texto(nombre),
    nombreCorto: texto(nombreCorto),
    nombreTecnico: texto(nombreTecnico),
    descripcion: texto(descripcion),
    categoria: texto(categoria),
    variante: texto(variante),
    /* Apartado 8: una variante apunta a su **ejercicio base** en vez de ser un
       ejercicio suelto. Así se puede enseñar el nombre completo, diferenciarlas,
       sustituir una por otra y buscar parecidos — las cuatro cosas que pide. */
    base: texto(base) || null,
    /* ⚠️ El `entorno` en singular de la F1 se absorbe aquí, no se queda al lado. */
    entornos: (() => {
      const l = idsDe(entornos, ENTORNOS);
      const viejo = texto(entornoViejo);
      if (!l.length && viejo && entorno(viejo)) return [viejo];
      return l;
    })(),
    equipamiento: idsDe(equipamiento, EQUIPAMIENTO),
    dificultad: dificultad(texto(dif)) ? texto(dif) : 'principiante',
    tipos: idsDe(tipos, TIPOS_EJERCICIO),
    musculos: normalizarImplicacionCompleta(musculos),
    agarre: agarre(texto(ag)) ? texto(ag) : null,
    medidas: (() => {
      const l = idsDe(medidas, MEDIDAS);
      return l.length ? l : ['reps'];
    })(),
    explosivo: explosivo === true,
    progresiones: lista(progresiones).map(texto).filter(Boolean),
    sustitutos: lista(sustitutos).map(texto).filter(Boolean),
    variantes: lista(variantes).map(texto).filter(Boolean),
    tutorial: crearTutorial(tutorial || {}),
    instrucciones: crearInstrucciones(instrucciones || {}),
    recursos: crearRecursos(recursos || {}),
  };
}

export function normalizarEjercicioCompleto(g) {
  if (!g || !texto(g.id)) return null;
  return crearEjercicioCompleto(g);
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 bis · LA PUERTA DE CARGA DE `fitness` (FIT F3)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 `normalizarFitness` vive en `fitness.js` y normaliza los ejercicios del
   usuario con el modelo REDUCIDO de la F1 — sin `entornos`, sin `medidas`, sin
   `dificultad`, sin `papel` en los músculos—. Cargar por ahí recortaría todo lo
   que añadió la F2 **en cada carga**, y con ello el constructor perdería de qué
   proponer el modo (`medidas`) y cuál es el músculo principal (`papel`).

   No se arregla dentro de `fitness.js`: importar este archivo desde allí sería
   un ciclo. Se arregla teniendo **una sola puerta**, y está aquí, que es donde
   vive el modelo completo. `App.jsx` llama a ésta.

   ⚠️ Si una fase futura amplía el `Exercise`, no hace falta tocar esto: basta
   con que el campo esté en `crearEjercicioCompleto`. */
export function normalizarFitnessCompleto(guardado) {
  const base = normalizarFitness(guardado);
  return {
    ...base,
    ejercicios: lista((guardado || {}).ejercicios)
      .map(normalizarEjercicioCompleto)
      .filter(Boolean),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LAS CONSULTAS DEL APARTADO 17
   ═══════════════════════════════════════════════════════════════════════════

   El enunciado enumera siete preguntas que los datos tienen que poder contestar
   —*"Diseña los datos pensando en estas consultas"*—, y aquí están las siete.
   ⚠️ **Ninguna guarda un índice**: se recorren en el momento, porque un índice
   guardado se queda viejo en cuanto se corrija un porcentaje (E3 F22). */

export function ejercicioPorId(id, propios = []) {
  const i = texto(id);
  if (!i) return null;
  return CATALOGO_EJERCICIOS.find((e) => e.id === i)
    || lista(propios).find((e) => e?.id === i)
    || null;
}

/** Todo el catálogo más lo que se haya creado Josué (la F1 dejó la lista). */
export function todosLosEjercicios(propios = []) {
  return [...CATALOGO_EJERCICIOS, ...lista(propios).map(normalizarEjercicioCompleto).filter(Boolean)];
}

/** Qué músculos trabaja, con su nombre y su grupo ya resueltos. */
export function musculosDe(ejercicio) {
  return lista(ejercicio?.musculos).map((m) => {
    const s = subgrupoMuscular(m.subgrupoId);
    return { ...m, nombre: s ? s.nombre : m.subgrupoId, grupo: s ? s.grupo : '', grupoId: s ? s.grupoId : null };
  });
}

/** El músculo que más porcentaje se lleva. `null` si no tiene ninguno. */
export function musculoPrincipal(ejercicio) {
  const l = musculosDe(ejercicio);
  if (!l.length) return null;
  return l.reduce((a, b) => ((b.porcentaje || 0) > (a.porcentaje || 0) ? b : a));
}

/** Qué ejercicios trabajan un grupo, ordenados por cuánto lo trabajan. */
export function ejerciciosDeGrupo(grupoId, propios = []) {
  const g = GRUPOS_MUSCULARES.find((x) => x.id === grupoId);
  if (!g) return [];
  const ids = new Set((g.subgrupos || []).map((s) => s.id));
  return todosLosEjercicios(propios)
    .map((e) => ({
      ejercicio: e,
      peso: lista(e.musculos).filter((m) => ids.has(m.subgrupoId))
        .reduce((n, m) => n + (m.porcentaje || 0), 0),
    }))
    .filter((x) => x.peso > 0)
    .sort((a, b) => b.peso - a.peso)
    .map((x) => x.ejercicio);
}

/** Lo mismo, por subgrupo. */
export function ejerciciosDeSubgrupo(subgrupoId, propios = []) {
  return todosLosEjercicios(propios)
    .filter((e) => lista(e.musculos).some((m) => m.subgrupoId === subgrupoId))
    .sort((a, b) => {
      const pa = lista(a.musculos).find((m) => m.subgrupoId === subgrupoId)?.porcentaje || 0;
      const pb = lista(b.musculos).find((m) => m.subgrupoId === subgrupoId)?.porcentaje || 0;
      return pb - pa;
    });
}

/** Apartado 16: qué puede sustituir a esto. No inventa nada — lee `sustitutos`. */
export function sustitutosDe(ejercicio, propios = []) {
  return lista(ejercicio?.sustitutos).map((id) => ejercicioPorId(id, propios)).filter(Boolean);
}

/** Apartado 8: las variantes de un ejercicio base, y el base de una variante. */
export function variantesDe(ejercicio, propios = []) {
  const id = texto(ejercicio?.id);
  if (!id) return [];
  const declaradas = lista(ejercicio.variantes).map((x) => ejercicioPorId(x, propios)).filter(Boolean);
  const hijas = todosLosEjercicios(propios).filter((e) => e.base === id);
  const vistos = new Set();
  return [...declaradas, ...hijas].filter((e) => {
    if (vistos.has(e.id)) return false;
    vistos.add(e.id);
    return true;
  });
}

export function baseDe(ejercicio, propios = []) {
  return ejercicio?.base ? ejercicioPorId(ejercicio.base, propios) : null;
}

/** Apartado 13: las progresiones de una habilidad, en orden. */
export function progresionesDe(ejercicio, propios = []) {
  return lista(ejercicio?.progresiones).map((id) => ejercicioPorId(id, propios)).filter(Boolean);
}

/** El nombre completo del apartado 8: «Press de banca · Con mancuernas». */
export function nombreCompleto(ejercicio) {
  if (!ejercicio) return '';
  return ejercicio.variante ? `${ejercicio.nombre} · ${ejercicio.variante}` : ejercicio.nombre;
}

/* El buscador del apartado 23. Sin acentos y sin mayúsculas, porque nadie
   escribe «Dominadas pronas» con tilde en un iPhone. Busca en el nombre, la
   variante, el nombre corto, el técnico y la descripción — así «pull up»
   encuentra las dominadas aunque en pantalla estén en español (apartado 20). */
export function buscarEjercicios(consulta, propios = []) {
  const q = ranura(consulta);
  if (!q) return todosLosEjercicios(propios);
  const trozos = q.split('-').filter(Boolean);
  return todosLosEjercicios(propios).filter((e) => {
    const heno = ranura([e.nombre, e.variante, e.nombreCorto, e.nombreTecnico, e.descripcion, e.categoria].join(' '));
    return trozos.every((t) => heno.includes(t));
  });
}

/* Los filtros del apartado 23. Cada uno es opcional y `null` significa «no
   filtres por esto», nunca «ninguno»: con `[]` la pantalla se quedaría vacía al
   entrar, que es el fallo de `null` frente a `[]` por enésima vez. */
export function filtrarEjercicios(ejercicios, {
  entornos = null, equipamiento = null, grupo = null, subgrupo = null,
  dificultad: dif = null, tipos = null, explosivo = null,
} = {}) {
  const idsGrupo = (() => {
    if (!grupo) return null;
    const g = GRUPOS_MUSCULARES.find((x) => x.id === grupo);
    return g ? new Set((g.subgrupos || []).map((s) => s.id)) : new Set();
  })();
  return lista(ejercicios).filter((e) => {
    if (entornos && entornos.length && !entornos.some((x) => e.entornos.includes(x))) return false;
    if (equipamiento && equipamiento.length && !equipamiento.some((x) => e.equipamiento.includes(x))) return false;
    if (idsGrupo && !lista(e.musculos).some((m) => idsGrupo.has(m.subgrupoId))) return false;
    if (subgrupo && !lista(e.musculos).some((m) => m.subgrupoId === subgrupo)) return false;
    if (dif && e.dificultad !== dif) return false;
    if (tipos && tipos.length && !tipos.some((x) => e.tipos.includes(x))) return false;
    if (explosivo !== null && e.explosivo !== explosivo) return false;
    return true;
  });
}

/** Cuántos hay de cada cosa, para que los filtros puedan decir lo que ofrecen
 *  en vez de dejar al usuario pulsando combinaciones vacías. */
export function recuentos(ejercicios) {
  const l = lista(ejercicios);
  const contar = (clave, catalogo) => Object.fromEntries(
    catalogo.map((c) => [c.id, l.filter((e) => lista(e[clave]).includes(c.id)).length])
  );
  return {
    entornos: contar('entornos', ENTORNOS),
    equipamiento: contar('equipamiento', EQUIPAMIENTO),
    tipos: contar('tipos', TIPOS_EJERCICIO),
    dificultades: Object.fromEntries(DIFICULTADES.map((d) => [d.id, l.filter((e) => e.dificultad === d.id).length])),
    grupos: Object.fromEntries(GRUPOS_MUSCULARES.map((g) => {
      const ids = new Set((g.subgrupos || []).map((s) => s.id));
      return [g.id, l.filter((e) => lista(e.musculos).some((m) => ids.has(m.subgrupoId))).length];
    })),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LA AUDITORÍA DEL CATÁLOGO (apartado 29)
   ═══════════════════════════════════════════════════════════════════════════

   Las cuatro validaciones obligatorias que no se pueden comprobar a ojo con
   noventa ejercicios: ids únicos, porcentajes que suman 100, referencias que
   apuntan a algo que existe y ni un enlace inventado. Se **ejecuta**, no se
   describe (EH F42). */
export function auditarCatalogo(ejercicios = CATALOGO_EJERCICIOS) {
  const l = lista(ejercicios);
  const ids = l.map((e) => e.id);
  const repetidos = ids.filter((x, i) => ids.indexOf(x) !== i);
  const sumaMal = l
    .map((e) => ({ id: e.id, suma: lista(e.musculos).reduce((n, m) => n + (m.porcentaje || 0), 0) }))
    .filter((x) => Math.round(x.suma) !== 100);
  const conocidos = new Set(ids);
  const colgados = [];
  for (const e of l) {
    for (const campo of ['sustitutos', 'progresiones', 'variantes']) {
      for (const ref of lista(e[campo])) {
        if (!conocidos.has(ref)) colgados.push({ id: e.id, campo, ref });
      }
    }
    if (e.base && !conocidos.has(e.base)) colgados.push({ id: e.id, campo: 'base', ref: e.base });
  }
  const sinEntorno = l.filter((e) => !e.entornos.length).map((e) => e.id);
  const sinMusculos = l.filter((e) => !e.musculos.length).map((e) => e.id);
  const sinPrincipal = l.filter((e) => !lista(e.musculos).some((m) => m.papel === 'principal')).map((e) => e.id);
  const subgruposUsados = new Set(l.flatMap((e) => e.musculos.map((m) => m.subgrupoId)));
  const subgruposHuerfanos = TODOS_LOS_SUBGRUPOS.filter((s) => !subgruposUsados.has(s.id)).map((s) => s.id);
  /* ⚠️ El barrido de enlaces mira **el JSON entero** del catálogo: es la única
     forma de que no se cuele uno dentro de un consejo o de una descripción. */
  const conEnlace = l.filter((e) => /https?:\/\//.test(JSON.stringify(e))).map((e) => e.id);
  return {
    total: l.length,
    repetidos,
    sumaMal,
    colgados,
    sinEntorno,
    sinMusculos,
    sinPrincipal,
    subgruposHuerfanos,
    conEnlace,
    ok: repetidos.length === 0 && sumaMal.length === 0 && colgados.length === 0
      && sinEntorno.length === 0 && sinMusculos.length === 0 && sinPrincipal.length === 0
      && conEnlace.length === 0,
  };
}

/* Lo que esta fase NO construye (apartado 27). */
export const NO_EN_FIT2 = [
  { que: 'Constructor de rutinas', porque: 'Apartado 27, primera línea. Es la FIT F3.' },
  { que: 'Biblioteca de planes y plantillas', porque: 'Apartado 27.' },
  { que: 'Entrenamiento en vivo y registro de series', porque: 'Apartado 27.' },
  { que: 'Historial de sesiones', porque: 'Apartado 27.' },
  { que: 'Sistema de rangos y clasificación', porque: 'Apartado 27. Los datos para calcularlos ya están: los porcentajes por músculo.' },
  { que: 'Fotos de progreso', porque: 'Apartado 27, y ya se gestionan en Salud física (FIT F1).' },
  { que: 'IA', porque: 'Apartado 27, y el apartado 22 de la F1 la sitúa más adelante.' },
  { que: 'La pantalla de sustitución', porque: 'Apartado 16: *"NO implementes todavía la pantalla. Solo deja los datos preparados."*' },
  { que: 'Un reproductor de vídeo', porque: 'Apartado 11. El modelo del tutorial está; el contenido no existe y no se inventa (apartado 22).' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   5 · EL CATÁLOGO, YA NORMALIZADO
   ═══════════════════════════════════════════════════════════════════════════

   Los datos en bruto viven en `catalogoEjercicios.js` y pasan **todos** por la
   misma fábrica que usaría un ejercicio creado por Josué. Así no hay dos formas
   del mismo objeto: si el normalizador descarta un subgrupo que no existe o
   rellena un campo que falta, lo hace igual con los del catálogo y con los
   suyos. */
export const CATALOGO_EJERCICIOS = CATALOGO_BRUTO.map(crearEjercicioCompleto);
