import { uid, todayISO } from './helpers';
import { rachaActual } from './rachas';

/* Entrega 4 · Fase 1/45 — «Fundación arquitectónica del módulo Fitness».
   ═══════════════════════════════════════════════════════════════════════════

   El enunciado pide cimientos, no funciones: entrada al módulo, tres áreas,
   arquitectura interna, modelos de datos, persistencia, componentes
   reutilizables, estados vacíos y responsive. Y lo dice dos veces con todas las
   letras: *"NO quiero que intentes implementar todavía todo Fitness"* y
   *"Esta fase debe construir los CIMIENTOS"*.

   Este archivo es la capa de **lógica y datos**. La pantalla vive en
   `src/views/FitnessView.jsx` y no calcula nada por su cuenta: el reparto de
   siempre en JosStyle (`src/lib/` decide, `src/views/` dibuja).

   ───────────────────────────────────────────────────────────────────────────
   1 · LO QUE SE INSPECCIONÓ ANTES DE ESCRIBIR UNA LÍNEA (apartado 1)
   ───────────────────────────────────────────────────────────────────────────

   El apartado 1 son trece preguntas sobre el proyecto y pide expresamente *"NO
   cambies nada todavía. Primero entiende la arquitectura existente"*. Las
   respuestas están en `INVENTARIO`, abajo, con nombres reales de archivo — no
   como descripción, sino como la lista de lo que esta fase **reutiliza**.

   Y de esa inspección salieron dos hallazgos que cambian la fase entera:

   🚨 **LAS FOTOS DE PROGRESO YA EXISTEN.** El área PROGRESO del apartado 11 es
   *"seguimiento visual mediante fotografías"*, y eso es `saludFotos`: la sube
   `uploadProgressPhoto()` —el nombre de la función lo dice—, vive en el bucket
   de Supabase con sus políticas, tiene fecha y nota, se borra con su archivo y
   puede estar protegida con PIN. Su estado vacío dice literalmente *"Todavía no
   has subido ninguna foto de progreso"*. Crear una lista `progreso` al lado
   habría dejado **las fotos que Josué ya tiene invisibles en la pantalla que se
   llama Progreso**, que es el fallo de la E3 F16 (notas), la E3 F36 (alimentos)
   y la E3 F41 (apps de Estudios) por cuarta vez.

   🚨 **EL MÓDULO DE ENTRENAMIENTO YA EXISTE.** `entreno` es la clave de
   navegación y `calistenia` la de datos: siete habilidades con nivel,
   progresión, récords, sesiones y vídeos, más los partidos de fútbol. Fitness
   **no nace al lado**: nace **siendo** ese módulo, que se amplía. Por eso no
   hay ni una migración de datos en esta fase y no se pierde nada de lo que
   Josué lleva registrado.

   ───────────────────────────────────────────────────────────────────────────
   2 · LA CONTRADICCIÓN CON D2-02, ANOTADA COMO C-33 (regla 49)
   ───────────────────────────────────────────────────────────────────────────

   El apartado 22 fija *"Rangos: 10 niveles"*, y **D2-02 dice que no hay niveles
   fuera de Sonido y Rachas**. Se construye, y ésta es la lectura que respeta
   las dos, escrita para que se pueda discutir:

   Lo que D2-02 prohíbe es **gamificar la aplicación**: puntos por usarla,
   monedas, niveles que se suben abriendo pantallas. Un rango de Fitness no es
   eso. Es una **medida de lo que levanta o hace su cuerpo**, derivada de los
   ejercicios que él registre, exactamente como un estándar de fuerza: no se
   gana usando la aplicación, no se canjea, no desbloquea nada y **no existe
   hasta que haya ejercicios clasificados** (`SIN_RANGO`). Ni XP, ni monedas, ni
   recompensas: hay una comprobación que barre este archivo buscando esas
   palabras. Queda anotado en `docs/03` como **C-33** y **se le dice a Josué**;
   si él prefiere otra cosa, se cambia el catálogo y ya está.

   ───────────────────────────────────────────────────────────────────────────
   3 · LO QUE ESTA FASE NO CONSTRUYE
   ───────────────────────────────────────────────────────────────────────────

   El apartado 23 lo enumera y el 27 lo remata: *"NO empieces automáticamente a
   construir el catálogo de ejercicios"*. Está en `NO_EN_FIT1`, con la fase que
   lo traerá, en vez de omitido — un informe que solo enumera lo verde miente
   por omisión (E3 F46). */

/* ═══════════════════════════════════════════════════════════════════════════
   1 · EL INVENTARIO: LAS TRECE PREGUNTAS DEL APARTADO 1, CONTESTADAS
   ═══════════════════════════════════════════════════════════════════════════

   `reutiliza` es lo que responde al apartado 2 (*"Si algo ya existe y funciona,
   NO lo dupliques"*). Hay una comprobación que exige que cada línea nombre un
   archivo que exista de verdad: un inventario que solo se cuenta a sí mismo no
   demuestra nada (EH F42). */
export const INVENTARIO = [
  { pregunta: 'Framework', respuesta: 'Vite + React 18, sin TypeScript', donde: 'package.json' },
  { pregunta: 'Routing', respuesta: 'No hay router: la navegación es estado de React, con pila de origen', donde: 'src/lib/navegacion.js' },
  { pregunta: 'Cómo se crea un módulo', respuesta: 'Una línea en MORE_NAV, una en su área de AREAS_NAV y un case en el switch', donde: 'src/App.jsx' },
  { pregunta: 'Navegación', respuesta: 'Cinco pestañas abajo (Inicio · Bienestar · Vida · Gestión · Ajustes) y hubs de área', donde: 'src/views/HubView.jsx' },
  { pregunta: 'Componentes reutilizables', respuesta: 'Card, SectionTitle, ToggleTab, PrimaryButton, GhostBtn, EmptyHint, Field, TextInput, Select', donde: 'src/components/ui.jsx' },
  { pregunta: 'Estilos', respuesta: 'Tailwind + el singleton COLORS; ni un hex suelto fuera de tokens.js', donde: 'src/tokens.js' },
  { pregunta: 'Iconos', respuesta: 'lucide-react, componentes importados en la vista', donde: 'src/views/FitnessView.jsx' },
  { pregunta: 'Estado', respuesta: 'useState en App.jsx, un estado por clave de datos', donde: 'src/App.jsx' },
  { pregunta: 'Almacenamiento', respuesta: 'Supabase: tabla app_data, una fila por (usuario, clave), con loadData/saveData', donde: 'src/lib/supabase.js' },
  { pregunta: 'Tema oscuro', respuesta: 'Sí: aplicarTema() y los presets de apariencia', donde: 'src/tokens.js' },
  { pregunta: 'Responsive y PWA', respuesta: 'Mobile first, safe areas en CSS y manifiesto propio', donde: 'src/index.css' },
  { pregunta: 'Convenciones', respuesta: 'Catálogo de datos en src/lib/, iconos y JSX en src/views/, pruebas en scripts/', donde: 'CLAUDE.md' },
  { pregunta: 'Fotos de progreso', respuesta: 'Ya existen: saludFotos, con su bucket, su fecha, su nota y su PIN opcional', donde: 'src/views/HealthView.jsx' },
];

/* Lo que Fitness **lee** de otros módulos en vez de guardarlo otra vez. Es el
   `MAPEO_EXISTENTE` de la E3 F16, y cada línea dice dónde vive el dato, quién
   lo gestiona y por qué no se copia aquí.

   ⚠️ **No se copia ni un campo.** Fitness enseña cuántas fotos hay y lleva a
   donde se gestionan; no las guarda, no las duplica y no se salta su PIN —
   quien decide si están protegidas es Ajustes, no esta pantalla. */
export const MAPEO_EXISTENTE = [
  {
    modelo: 'ProgressPhoto',
    yaEs: 'saludFotos',
    campos: ['id', 'fecha', 'path', 'nota'],
    gestionaEn: 'salud',
    seccion: 'fotos',
    porque: 'Las sube uploadProgressPhoto() desde la Fase 3, con su archivo en Storage, su fecha, su nota y su PIN opcional. Una segunda lista dejaría las suyas invisibles en la pantalla que se llama Progreso.',
  },
  {
    modelo: 'Habilidades de calistenia',
    yaEs: 'calistenia',
    campos: ['nivel', 'progresion', 'prs', 'sesiones'],
    gestionaEn: 'entreno',
    seccion: 'habilidades',
    porque: 'Siete habilidades con su progresión, sus récords, sus sesiones y sus vídeos desde la Fase 2. El área ENTRENAMIENTO las enseña renderizando su pantalla, no copiándolas (E3 F23).',
  },
  {
    modelo: 'Racha de entrenamiento',
    yaEs: 'rachas',
    campos: ['definiciones', 'eventos'],
    gestionaEn: 'rachas',
    seccion: 'training',
    porque: 'El motor de rachas no guarda contadores: todo se deriva del historial. Un contador propio en la cabecera diría un número distinto del de la pantalla de Rachas (E3 F2).',
  },
  {
    modelo: 'La línea del hub y de Inicio',
    yaEs: 'resumenesHub',
    campos: ['linea1', 'linea2', 'estado'],
    gestionaEn: 'entreno',
    seccion: 'calcularResumenModulo',
    porque: 'La escribe desde la Fase 19 y dice cosas mejores que las que sabría decir esta librería —"2 habilidades activas · Última sesión hoy"—. Un segundo resumen sería la cuarta lista que prohíbe D2-07, y las dos acabarían diciendo cosas distintas.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LAS TRES ÁREAS (apartados 5 y 22)
   ═══════════════════════════════════════════════════════════════════════════

   *"Áreas principales: Rangos · Progreso · Entrenamiento"*, fijado como
   decisión de producto en el apartado 22. Son **tres**, no cuatro: lo que ya
   existe —las habilidades de calistenia y los partidos— entra **dentro** de
   ENTRENAMIENTO, que es su sitio, en vez de abrir una cuarta pestaña que
   contradiría esa decisión.

   El `icono` es un nombre, no un componente: los componentes de lucide viven en
   la vista, como `CATEGORIAS_ARMARIO` / `ICONOS_CATEGORIA` (E3 F3). Un icono
   que falte allí sale como un hueco y no falla en ninguna parte, así que hay
   una comprobación que cruza las dos listas. */
export const AREAS_FITNESS = [
  {
    id: 'rangos',
    label: 'Rangos',
    icono: 'rangos',
    que: 'Tu nivel físico por grupo muscular, calculado a partir de los ejercicios que registres.',
  },
  {
    id: 'progreso',
    label: 'Progreso',
    icono: 'progreso',
    que: 'La evolución visual, con las fotos de progreso y sus fechas.',
  },
  {
    id: 'entrenamiento',
    label: 'Entrenamiento',
    icono: 'entrenamiento',
    que: 'Planes, plantillas y sesiones: el centro del módulo.',
  },
];

export const AREA_INICIAL = 'entrenamiento';

export const areaFitness = (id) => AREAS_FITNESS.find((a) => a.id === id) || null;

/* ⚠️ **Cuál está abierta ahora NO se guarda.** Es la lección de la EH F40: una
   pantalla abierta es de la pantalla, no del almacén. Guardarla haría que
   volver a Fitness te dejara donde lo dejaste hace dos semanas en vez de en lo
   que estás entrenando hoy, y `DEFAULT_FITNESS` no tiene el campo para que
   nadie caiga en la tentación. */
export const NO_SE_GUARDA = [
  { que: 'El área abierta', porque: 'Es estado de la pantalla, no un dato (EH F40).' },
  { que: 'La racha', porque: 'La deriva el motor de rachas del historial real; un contador propio se desviaría (RA F1).' },
  { que: 'El número de fotos de progreso', porque: 'Se cuenta de saludFotos en el momento; una copia mentiría en cuanto borre una.' },
  { que: 'El rango de un grupo muscular', porque: 'Se calcula de los ejercicios clasificados. Lo dice el apartado 9: nada de progreso ficticio.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   3 · GRUPOS Y SUBGRUPOS MUSCULARES (apartados 9 y 10)
   ═══════════════════════════════════════════════════════════════════════════

   El apartado 10 pide dejarlos *"definidos conceptualmente desde esta fase"* y
   *"representados mediante tipos/modelos reutilizables"*, porque el 22 dice que
   la anatomía será un sistema compartido entre Rangos y Entrenamiento en vivo.
   Esta lista es ese sistema: una sola, leída por los dos.

   El orden es el del apartado 9 (Brazos · Piernas · Espalda · Pecho · Hombros ·
   Abdominales · Cuello), que es el orden en que se pintan los rankings. */
export const GRUPOS_MUSCULARES = [
  {
    id: 'brazos',
    nombre: 'Brazos',
    icono: 'brazos',
    subgrupos: [
      { id: 'biceps', nombre: 'Bíceps' },
      { id: 'triceps', nombre: 'Tríceps' },
      { id: 'antebrazo', nombre: 'Antebrazo' },
    ],
  },
  {
    id: 'piernas',
    nombre: 'Piernas',
    icono: 'piernas',
    subgrupos: [
      { id: 'cuadriceps', nombre: 'Cuádriceps' },
      { id: 'isquios', nombre: 'Isquios' },
      { id: 'gluteos', nombre: 'Glúteos' },
      { id: 'gemelos', nombre: 'Gemelos' },
    ],
  },
  {
    id: 'espalda',
    nombre: 'Espalda',
    icono: 'espalda',
    subgrupos: [
      { id: 'dorsales', nombre: 'Dorsales' },
      { id: 'trapecio', nombre: 'Trapecio' },
      { id: 'erectores', nombre: 'Erectores y lumbar' },
    ],
  },
  {
    id: 'pecho',
    nombre: 'Pecho',
    icono: 'pecho',
    subgrupos: [
      { id: 'pectoral-superior', nombre: 'Pectoral superior' },
      { id: 'pectoral-medio', nombre: 'Pectoral medio e inferior' },
    ],
  },
  {
    id: 'hombros',
    nombre: 'Hombros',
    icono: 'hombros',
    subgrupos: [
      { id: 'deltoide-anterior', nombre: 'Deltoide anterior' },
      { id: 'deltoide-lateral', nombre: 'Deltoide lateral' },
      { id: 'deltoide-posterior', nombre: 'Deltoide posterior' },
    ],
  },
  {
    id: 'abdominales',
    nombre: 'Abdominales',
    icono: 'abdominales',
    subgrupos: [
      { id: 'recto-abdominal', nombre: 'Recto abdominal' },
      { id: 'oblicuos', nombre: 'Oblicuos' },
      { id: 'core-profundo', nombre: 'Core profundo' },
    ],
  },
  {
    id: 'cuello',
    nombre: 'Cuello',
    icono: 'cuello',
    subgrupos: [
      { id: 'cervical', nombre: 'Flexores, extensores y musculatura cervical' },
    ],
  },
];

export const grupoMuscular = (id) => GRUPOS_MUSCULARES.find((g) => g.id === id) || null;

export function subgrupoMuscular(id) {
  for (const g of GRUPOS_MUSCULARES) {
    const s = (g.subgrupos || []).find((x) => x.id === id);
    if (s) return { ...s, grupoId: g.id, grupo: g.nombre };
  }
  return null;
}

/* Todos los subgrupos en una lista plana, con su grupo. Lo necesitan la
   clasificación de ejercicios y la anatomía, y calcularlo aquí una vez evita
   que cada pantalla escriba su propio doble bucle. */
export const TODOS_LOS_SUBGRUPOS = GRUPOS_MUSCULARES.flatMap((g) =>
  (g.subgrupos || []).map((s) => ({ ...s, grupoId: g.id, grupo: g.nombre }))
);

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LOS DIEZ NIVELES DE RANGO (apartados 9 y 22)
   ═══════════════════════════════════════════════════════════════════════════

   Diez, como fija el apartado 22. Los nombres son de **rendimiento físico**, no
   de juego: es lo que mantiene en pie D2-02 (ver la cabecera, C-33). No hay
   ninguna palabra de premio ni de moneda, y hay una prueba que lo comprueba.

   `orden` va de 1 a 10 y es lo que se guarda en un `MuscleRank`: renombrar un
   nivel no puede romper lo que Josué ya tenga calculado. */
export const NIVELES_RANGO = [
  { orden: 1, id: 'iniciacion', nombre: 'Iniciación', que: 'Empezando con el movimiento.' },
  { orden: 2, id: 'principiante', nombre: 'Principiante', que: 'Técnica en construcción.' },
  { orden: 3, id: 'novato', nombre: 'Novato', que: 'Movimiento controlado con carga ligera.' },
  { orden: 4, id: 'intermedio-bajo', nombre: 'Intermedio bajo', que: 'Base de fuerza asentada.' },
  { orden: 5, id: 'intermedio', nombre: 'Intermedio', que: 'Rendimiento medio para tu peso corporal.' },
  { orden: 6, id: 'intermedio-alto', nombre: 'Intermedio alto', que: 'Por encima de la media.' },
  { orden: 7, id: 'avanzado', nombre: 'Avanzado', que: 'Años de trabajo constante.' },
  { orden: 8, id: 'muy-avanzado', nombre: 'Muy avanzado', que: 'Rendimiento alto y sostenido.' },
  { orden: 9, id: 'experto', nombre: 'Experto', que: 'Nivel de competición amateur.' },
  { orden: 10, id: 'elite', nombre: 'Élite', que: 'Lo más alto de la escala.' },
];

/* El estado del apartado 9 cuando todavía no hay nada que medir. **No es el
   nivel 0**: es la ausencia de nivel, y por eso un `MuscleRank` sin datos
   guarda `nivel: null` y no un cero. `Number(null)` es 0 y ya ha costado cuatro
   fallos reales en este proyecto. */
export const SIN_RANGO = {
  nombre: 'Sin Rango',
  que: 'Completa ejercicios para comenzar a establecer tu nivel.',
};

export const nivelRango = (orden) => NIVELES_RANGO.find((n) => n.orden === orden) || null;

export function nombreDeRango(orden) {
  const n = nivelRango(orden);
  return n ? n.nombre : SIN_RANGO.nombre;
}

/* Un nivel está bloqueado si está por encima del que tiene. Con `null` —sin
   rango— **todos** lo están, que es lo que pide el apartado 9: *"los niveles no
   desbloqueados pueden aparecer visualmente como bloqueados/inactivos"*, y sin
   pintar progreso que no existe. */
export function estadoDeNivel(nivel, actual) {
  if (actual === null || actual === undefined) return 'bloqueado';
  if (nivel.orden < actual) return 'completado';
  if (nivel.orden === actual) return 'actual';
  return 'bloqueado';
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LOS MODELOS (apartado 13)
   ═══════════════════════════════════════════════════════════════════════════

   Siete modelos, y el apartado 25 pide que sean *"tipos reales"*, no un
   comentario: cada uno tiene su **fábrica** y su **normalizador**, y el
   normalizador corre al cargar desde `App.jsx` (regla 5). Así no son código
   muerto —`normalizarFitness` los llama— y el día que la fase que los llene
   guarde el primero, ya está validado.

   `MODELOS` declara cuál construye cada fase, como `RELACIONES_FUTURAS` de la
   E3 F26: un modelo vacío **declarado** es arquitectura; uno vacío y callado es
   media función (regla 8). */

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const lista = (v) => (Array.isArray(v) ? v : []);
const numeroONull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const enteroONull = (v) => {
  const n = numeroONull(v);
  return n === null ? null : Math.trunc(n);
};

/* ── Exercise ──────────────────────────────────────────────────────────────
   La unidad fundamental, y el apartado 22 lo subraya: *"NO diseñes el sistema
   alrededor de grupos musculares genéricos"*. Un ejercicio apunta a sus
   músculos con `implicacion` —qué porcentaje de él es cada subgrupo—, que es lo
   que después permite clasificar y calcular rangos. */
export function crearEjercicio({
  nombre = '', variante = '', entorno = '', equipamiento = [], musculos = [],
  tutorial = '', recurso = '', anatomia = null,
} = {}) {
  return {
    id: uid(),
    nombre: texto(nombre),
    variante: texto(variante),
    entorno: texto(entorno),
    equipamiento: lista(equipamiento).map(texto).filter(Boolean),
    musculos: normalizarImplicacion(musculos),
    tutorial: texto(tutorial),
    recurso: texto(recurso),
    anatomia: anatomia || null,
  };
}

/* Un subgrupo que ya no existe se descarta aquí, no en la pantalla: un id
   colgado es una implicación que nadie puede dibujar (EH F24). */
export function normalizarImplicacion(musculos) {
  return lista(musculos)
    .map((m) => ({
      subgrupoId: texto(m?.subgrupoId),
      porcentaje: numeroONull(m?.porcentaje),
    }))
    .filter((m) => m.subgrupoId && subgrupoMuscular(m.subgrupoId));
}

export function normalizarEjercicio(g) {
  if (!g || !g.id) return null;
  return { ...crearEjercicio(g), id: g.id };
}

/* ── MuscleGroup ───────────────────────────────────────────────────────────
   No tiene fábrica: los grupos **no los crea el usuario**, son el catálogo
   `GRUPOS_MUSCULARES` de arriba. Lo que sí hace falta es la vista que pide el
   apartado 13 —grupo con sus subgrupos y sus ejercicios relacionados—, y se
   **deriva** de los ejercicios en vez de guardarse: una lista guardada de "qué
   ejercicios son de pecho" se queda vieja en cuanto él edite uno. */
export function grupoConEjercicios(grupoId, ejercicios) {
  const g = grupoMuscular(grupoId);
  if (!g) return null;
  const ids = new Set((g.subgrupos || []).map((s) => s.id));
  return {
    ...g,
    ejercicios: lista(ejercicios).filter((e) =>
      lista(e?.musculos).some((m) => ids.has(m.subgrupoId))
    ),
  };
}

/* ── WorkoutExercise ───────────────────────────────────────────────────────
   Un ejercicio **dentro** de un plan o de una sesión: apunta al catálogo por
   `exerciseId` y guarda lo suyo. Nunca copia el nombre — renombrar el ejercicio
   tiene que renombrarlo en los veinte sitios donde esté (la lección de AS F1).

   `series`, `repeticiones`, `peso` y `descanso` son `null` mientras él no los
   escriba: un cero diría que levantó cero kilos. */
export function crearWorkoutExercise({
  exerciseId = '', orden = 0, series = null, repeticiones = null,
  peso = null, descanso = null, notas = '', config = {},
} = {}) {
  return {
    id: uid(),
    exerciseId: texto(exerciseId),
    orden: enteroONull(orden) ?? 0,
    series: enteroONull(series),
    repeticiones: enteroONull(repeticiones),
    peso: numeroONull(peso),
    descanso: enteroONull(descanso),
    notas: texto(notas),
    config: config && typeof config === 'object' ? config : {},
  };
}

export function normalizarWorkoutExercise(g) {
  if (!g || !g.id) return null;
  return { ...crearWorkoutExercise(g), id: g.id };
}

/* ── WorkoutPlan ───────────────────────────────────────────────────────────
   Un plan y una plantilla son la misma forma: lo que cambia es si él lo creó
   (`plantillas`) o viene de la biblioteca (`planes`). Dos formas distintas
   habrían obligado a convertir al guardar una plantilla como plan. */
export function crearWorkoutPlan({
  nombre = '', descripcion = '', entorno = '', frecuencia = null,
  duracion = null, thumbnail = '', ejercicios = [], meta = {},
} = {}) {
  return {
    id: uid(),
    nombre: texto(nombre),
    descripcion: texto(descripcion),
    entorno: texto(entorno),
    frecuencia: enteroONull(frecuencia),
    duracion: enteroONull(duracion),
    thumbnail: texto(thumbnail),
    ejercicios: lista(ejercicios).map(normalizarWorkoutExercise).filter(Boolean),
    meta: meta && typeof meta === 'object' ? meta : {},
  };
}

export function normalizarWorkoutPlan(g) {
  if (!g || !g.id) return null;
  return { ...crearWorkoutPlan(g), id: g.id };
}

/* ── WorkoutSession ────────────────────────────────────────────────────────
   Lo que de verdad pasó. `planId` puede ser `null`: una sesión suelta, sin
   plan, tiene que poder existir.

   ⚠️ **La duración NO se guarda.** Sale de la hora de inicio y la de fin, como
   la del sueño en la E3 F31: guardarla sería una copia que miente en cuanto
   corrija una hora. */
export const ESTADOS_SESION = ['planificada', 'en_curso', 'completada', 'descartada'];

export function crearWorkoutSession({
  planId = null, nombre = '', fecha = todayISO(), inicio = null, fin = null,
  ejercicios = [], notas = '', descripcion = '', estado = 'planificada',
} = {}) {
  return {
    id: uid(),
    planId: planId || null,
    nombre: texto(nombre),
    fecha: texto(fecha) || todayISO(),
    inicio: inicio || null,
    fin: fin || null,
    ejercicios: lista(ejercicios).map(normalizarWorkoutExercise).filter(Boolean),
    notas: texto(notas),
    descripcion: texto(descripcion),
    estado: ESTADOS_SESION.includes(estado) ? estado : 'planificada',
  };
}

export function normalizarWorkoutSession(g) {
  if (!g || !g.id) return null;
  return { ...crearWorkoutSession(g), id: g.id };
}

/* Minutos entre el inicio y el fin, o `null` si falta alguno. No inventa una
   duración por defecto: una sesión sin hora de fin **no dura una hora**
   (E3 F13, apartados 11 y 12). */
export function duracionDeSesion(sesion) {
  const a = minutosDeHora(sesion?.inicio);
  const b = minutosDeHora(sesion?.fin);
  if (a === null || b === null) return null;
  const d = b - a;
  return d >= 0 ? d : d + 24 * 60;
}

export function minutosDeHora(hhmm) {
  if (typeof hhmm !== 'string') return null;
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  /* La forma no basta: '25:99' encaja con el patrón y colocaría la sesión fuera
     del día. Ya pasó con las horas del Calendario (E3 F8). */
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/* ── MuscleRank ────────────────────────────────────────────────────────────
   El rango de un grupo. `nivel` es `null` mientras no haya ejercicios
   clasificados: eso es `SIN_RANGO`, no el nivel 1.

   El **cálculo** es de una fase posterior (el apartado 9 lo dice: *"En esta
   fase todavía NO implementes el cálculo de rangos"*). Lo que existe ya es la
   forma del dato y su normalizador. */
export function crearMuscleRank({ grupoId = '', nivel = null, puntuacion = null, clasificados = [] } = {}) {
  return {
    grupoId: texto(grupoId),
    nivel: enteroONull(nivel),
    puntuacion: numeroONull(puntuacion),
    clasificados: lista(clasificados).map(texto).filter(Boolean),
  };
}

export function normalizarMuscleRank(g) {
  if (!g || !grupoMuscular(texto(g.grupoId))) return null;
  const r = crearMuscleRank(g);
  /* Un nivel fuera de la escala es un dato corrupto, no un nivel: se deja sin
     rango en vez de pintar una insignia que no existe. */
  if (r.nivel !== null && !nivelRango(r.nivel)) r.nivel = null;
  return r;
}

/* El catálogo de modelos, con quién los llena. Cada `normalizador` es la
   **función importada**, no su nombre: renombrar una rompe la compilación en
   vez de dejar una tabla mintiendo (EH F64). */
export const MODELOS = [
  { nombre: 'Exercise', fabrica: crearEjercicio, normalizador: normalizarEjercicio, guardaEn: 'ejercicios', llena: 'FIT F2 — catálogo de ejercicios' },
  { nombre: 'MuscleGroup', fabrica: null, normalizador: null, guardaEn: null, llena: 'Ya lleno: es el catálogo GRUPOS_MUSCULARES, no lo crea el usuario' },
  { nombre: 'WorkoutExercise', fabrica: crearWorkoutExercise, normalizador: normalizarWorkoutExercise, guardaEn: 'dentro de planes y sesiones', llena: 'FIT — constructor de entrenamientos' },
  { nombre: 'WorkoutPlan', fabrica: crearWorkoutPlan, normalizador: normalizarWorkoutPlan, guardaEn: 'planes y plantillas', llena: 'FIT — biblioteca y plantillas' },
  { nombre: 'WorkoutSession', fabrica: crearWorkoutSession, normalizador: normalizarWorkoutSession, guardaEn: 'sesiones', llena: 'FIT — entrenamiento en vivo e historial' },
  { nombre: 'ProgressPhoto', fabrica: null, normalizador: null, guardaEn: null, llena: 'Ya existe: es saludFotos (ver MAPEO_EXISTENTE)' },
  { nombre: 'MuscleRank', fabrica: crearMuscleRank, normalizador: normalizarMuscleRank, guardaEn: 'rangos', llena: 'FIT — algoritmo de rangos' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   6 · EL ALMACÉN (apartados 14 y 15)
   ═══════════════════════════════════════════════════════════════════════════

   El apartado 14 dice *"Primero comprueba cómo persiste datos actualmente Jos
   Style. Si ya existe un sistema adecuado: UTILÍZALO. No crees otro sistema
   paralelo"*, y pide que la interfaz no dependa de `localStorage` ni de ningún
   mecanismo concreto.

   Existe y se usa: la tabla `app_data`, una fila por (usuario, clave), con sus
   cuatro políticas `auth.uid() = user_id`. Fitness es **una clave más**,
   `fitness`, y la pantalla no sabe de dónde sale: recibe props de `App.jsx`.
   El reparto que pide el apartado —interfaz → lógica → almacenamiento— es el
   que ya tiene la aplicación entera.

   ⚠️ **El estado inicial está limpio** (apartado 15): ni un plan de ejemplo, ni
   un ejercicio de muestra, ni un rango puesto a mano. */
export const CLAVE_FITNESS = 'fitness';

export const DEFAULT_FITNESS = {
  version: 1,
  ejercicios: [],
  planes: [],
  plantillas: [],
  sesiones: [],
  rangos: [],
};

/* Regla 5: `loadData` no fusiona con el default y `saveData` sobrescribe, así
   que el normalizador devuelve **el objeto entero** y cada lista pasa por el
   normalizador de su modelo. Un campo nuevo que no esté aquí se lo lleva el
   siguiente guardado — van más de veinte veces en este proyecto. */
export function normalizarFitness(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    ...DEFAULT_FITNESS,
    ...g,
    version: enteroONull(g.version) ?? DEFAULT_FITNESS.version,
    ejercicios: lista(g.ejercicios).map(normalizarEjercicio).filter(Boolean),
    planes: lista(g.planes).map(normalizarWorkoutPlan).filter(Boolean),
    plantillas: lista(g.plantillas).map(normalizarWorkoutPlan).filter(Boolean),
    sesiones: lista(g.sesiones).map(normalizarWorkoutSession).filter(Boolean),
    rangos: lista(g.rangos).map(normalizarMuscleRank).filter(Boolean),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · LO QUE SE ENSEÑA (apartados 6, 9, 11, 12 y 17)
   ═══════════════════════════════════════════════════════════════════════════

   El apartado 17 es tajante: nunca una pantalla en blanco, nunca un gráfico
   vacío, nunca números inventados, nunca botones sin función que parezcan
   rotos. Y el 6: *"Nunca inventes estadísticas del usuario"*.

   Todo lo de aquí se **deriva** en el momento. No hay ni una cifra guardada. */

/* La racha de la cabecera. El apartado 6 ofrece enseñar *"0 días"* como estado
   neutro, y **no se hace**: JosStyle ya tiene un motor de rachas, así que un
   cero propio sería un número falso justo el día que él lleve cuatro seguidos.
   Se lee la racha de entrenamiento de verdad y, **si no la tiene definida, no
   se pinta nada** — es el apartado 10 de la EH F23, palabra por palabra. */
export function rachaDeFitness(rachas, hoy = todayISO()) {
  /* ⚠️ Y una racha **archivada** no cuenta: `activa !== false` es lo que usa el
     propio motor, así que Fitness pregunta igual que la pantalla de Rachas. Con
     un criterio distinto, las dos dirían números distintos de lo mismo. */
  const definiciones = lista(rachas?.definiciones)
    .filter((d) => d?.tipo === 'training' && d?.activa !== false);
  if (definiciones.length === 0) return null;
  const eventos = lista(rachas?.eventos);
  const dias = Math.max(...definiciones.map((d) => rachaActual(eventos, d, hoy)));
  return { dias, texto: `${dias} ${dias === 1 ? 'día' : 'días'}` };
}

/* Los estados vacíos de las tres áreas, con el texto literal que pide cada
   apartado y **su salida**: un vacío sin salida es una pantalla rota (EH F41).
   `accion` dice a dónde lleva el botón; `null` es «no hay botón», nunca un
   botón que no hace nada (regla 8). */
export const ESTADOS_VACIOS = {
  rangos: {
    titulo: SIN_RANGO.nombre,
    texto: SIN_RANGO.que,
    accion: null,
    porque: 'El CTA de clasificar existe, pero declarado: CTA_CLASIFICAR dice que llega más adelante en vez de ofrecer un botón que no clasifica nada.',
  },
  progreso: {
    titulo: 'Tu progreso',
    texto: 'Todavía no has añadido fotografías de progreso.',
    accion: { texto: 'Añadir foto', lleva: 'salud', seccion: 'fotos' },
    porque: 'Las fotos de progreso se gestionan en Salud física desde la Fase 3, con su archivo, su fecha y su PIN. El botón lleva allí en vez de fingir una subida que esta fase no construye.',
  },
  entrenamiento: {
    /* ⚠️ No se llama «Tu Plan» aunque el apartado 12 titule así la zona: ese
       rótulo ya lo lleva la sección, y repetirlo dos veces en la misma pantalla
       es la redundancia de la E3 F30 («Salud → Salud»). */
    titulo: 'Todavía no tienes un plan',
    texto: 'Aquí aparecerá el entrenamiento que estés siguiendo.',
    accion: null,
    porque: 'El constructor es de una fase posterior (apartado 12), y un botón «Crear» que no crea nada sería un control decorativo.',
  },
};

/* El CTA del apartado 9. Lo pide con nombre y todo —*"Clasificar ejercicios"*—
   y a la vez deja la puerta abierta: *"o un estado equivalente que no implique
   datos ficticios"*, porque *"la funcionalidad real de clasificación se
   construirá en una fase posterior"*.

   Así que existe y **se ve**, pero declarado: sin catálogo de ejercicios, el
   *"· 0 restantes"* sería un contador de una lista que no existe todavía, y un
   botón que abre la nada es el control decorativo de la regla 8. Es lo mismo
   que hace `RAMAS_ESTUDIOS` en la E3 F41 con Trabajos y Progreso. */
export const CTA_CLASIFICAR = {
  texto: 'Clasificar ejercicios',
  existe: false,
  porque: 'La clasificación necesita el catálogo de ejercicios, que es la fase siguiente.',
  mientrasTanto: 'Disponible cuando el catálogo de ejercicios esté construido.',
};

/* Los accesos del área de Entrenamiento (apartado 12). `existe: false` no los
   esconde: se enseñan diciendo que llegan más adelante, que es lo contrario de
   un botón muerto. */
export const ACCESOS_ENTRENAMIENTO = [
  { id: 'planificaciones', nombre: 'Planificaciones', que: 'La biblioteca de planes.', existe: false, enFase: 'Una fase posterior de Fitness' },
  { id: 'plantillas', nombre: 'Tus plantillas', que: 'Las rutinas que te crees tú.', existe: false, enFase: 'Una fase posterior de Fitness' },
  { id: 'habilidades', nombre: 'Habilidades', que: 'Calistenia: progresión, récords, sesiones y vídeos.', existe: true, enFase: null },
];

/* El resumen del área PROGRESO. Cuenta las fotos que hay de verdad, así que la
   pantalla **no puede decirle que no tiene ninguna teniendo cinco**. */
export function resumenProgreso(fotos) {
  const n = lista(fotos).length;
  if (n === 0) return { vacio: true, texto: ESTADOS_VACIOS.progreso.texto, cuantas: 0 };
  return {
    vacio: false,
    cuantas: n,
    texto: `${n} ${n === 1 ? 'foto' : 'fotos'} de progreso, en Salud física.`,
  };
}

/* El resumen del área ENTRENAMIENTO. Suma lo que hay en Fitness **y** lo que ya
   existe en calistenia: si contara solo lo suyo, diría «sin entrenamientos» a
   alguien con siete habilidades en marcha. Es la lección de la E3 F22 —un
   contador que solo mira una de sus dos listas— antes de que pase. */
export function resumenEntrenamiento(fitness, calistenia) {
  const f = fitness || DEFAULT_FITNESS;
  const sesionesCal = Object.values(calistenia || {}).reduce(
    (n, s) => n + lista(s?.sesiones).length, 0
  );
  const habilidadesActivas = Object.values(calistenia || {}).filter(
    (s) => lista(s?.sesiones).length > 0 || lista(s?.progresion).length > 0
  ).length;
  const planes = lista(f.planes).length + lista(f.plantillas).length;
  const sesiones = lista(f.sesiones).length + sesionesCal;
  return { planes, sesiones, habilidadesActivas };
}

/* ⚠️ **Y AQUÍ NO HAY UNA LÍNEA DE HUB.** La plaquita de Bienestar y la tarjeta de
   Inicio las escribe `calcularResumenModulo('entreno', …)` desde la Fase 19, y
   dice cosas mejores que las que sabría decir esta librería: *"2 habilidades
   activas · Última sesión hoy"*. Escribir aquí un segundo resumen sería la
   cuarta lista de D2-07 y las dos acabarían diciendo cosas distintas — está
   declarado en `MAPEO_EXISTENTE` y hay una comprobación que barre este archivo
   buscando una segunda. */

/* ═══════════════════════════════════════════════════════════════════════════
   8 · LO QUE NO SE CONSTRUYE EN ESTA FASE (apartados 23 y 27)
   ═══════════════════════════════════════════════════════════════════════════ */
export const NO_EN_FIT1 = [
  { que: 'Catálogo de ejercicios', porque: 'Apartado 23, primera línea. Es la FIT F2 y el apartado 27 prohíbe adelantarla.' },
  { que: 'Vídeos y tutoriales', porque: 'Apartado 23. El modelo Exercise ya tiene el campo; no hay contenido.' },
  { que: 'Anatomía en 3D', porque: 'Apartado 23. Lo que existe es el catálogo de grupos y subgrupos, que es lo que pide el 10.' },
  { que: 'Constructor de entrenamientos', porque: 'Apartado 23. La estructura está; la pantalla no.' },
  { que: 'Biblioteca de rutinas y planes', porque: 'Apartado 23, y el 12 pide solo el acceso preparado.' },
  { que: 'Entrenamiento en vivo, cronómetro y descanso', porque: 'Apartado 23.' },
  { que: 'Registro de kilos y repeticiones', porque: 'Apartado 23. WorkoutExercise ya los admite, en null hasta que los escriba.' },
  { que: 'Historial de sesiones', porque: 'Apartado 23.' },
  { que: 'Gestión real de fotografías y comparación', porque: 'Apartado 11 y 23. Las fotos ya se gestionan en Salud física, y esta pantalla lleva allí.' },
  { que: 'Clasificación de ejercicios y algoritmo de rangos', porque: 'Apartados 9 y 23. Los diez niveles y los siete grupos están definidos; el cálculo no.' },
  { que: 'IA y adaptación automática', porque: 'Apartado 22: se añade más adelante.' },
  { que: 'Funciones sociales', porque: 'Apartado 22: no se implementan inicialmente.' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   9 · LA CONDICIÓN DE FINALIZACIÓN (apartados 26 y «criterio de éxito»)
   ═══════════════════════════════════════════════════════════════════════════

   Se **calcula** leyendo el código de verdad. Nadie pone una casilla a `true`:
   si una está roja, es que lo está (EH F64). */
export function condicionFIT1({ app = '', vista = '', tokens = '' } = {}) {
  const casillas = [
    {
      id: 'entrada',
      que: 'Se entra a Fitness desde la navegación que ya existe, sin crear una nueva',
      ok: /label:\s*'Fitness'/.test(app) && /case\s+'entreno'/.test(app),
    },
    {
      id: 'tres-areas',
      que: 'Las tres áreas son Rangos, Progreso y Entrenamiento',
      ok: AREAS_FITNESS.length === 3
        && AREAS_FITNESS.map((a) => a.id).join(',') === 'rangos,progreso,entrenamiento',
    },
    {
      id: 'grupos',
      que: 'Los siete grupos musculares del apartado 9, con sus subgrupos',
      ok: GRUPOS_MUSCULARES.length === 7
        && GRUPOS_MUSCULARES.every((g) => (g.subgrupos || []).length > 0),
    },
    {
      id: 'niveles',
      que: 'Diez niveles de rango, del 1 al 10',
      ok: NIVELES_RANGO.length === 10
        && NIVELES_RANGO.every((n, i) => n.orden === i + 1),
    },
    {
      id: 'modelos',
      que: 'Los siete modelos del apartado 13 están declarados',
      ok: MODELOS.length === 7
        && MODELOS.every((m) => typeof m.nombre === 'string' && m.nombre.length > 0),
    },
    {
      id: 'persistencia',
      que: 'Usa app_data, la persistencia que ya existe, con una clave propia',
      ok: CLAVE_FITNESS === 'fitness'
        && new RegExp(`loadData\\(uidUser, '${CLAVE_FITNESS}'`).test(app),
    },
    {
      id: 'estado-limpio',
      que: 'El estado inicial no trae ni un dato de ejemplo',
      ok: Object.values(DEFAULT_FITNESS).every((v) => !Array.isArray(v) || v.length === 0),
    },
    {
      id: 'sin-duplicar',
      que: 'No hay una segunda lista de fotos de progreso ni una segunda de habilidades',
      ok: !/progreso:\s*\[/.test(JSON.stringify(DEFAULT_FITNESS))
        && !Object.keys(DEFAULT_FITNESS).includes('fotos')
        && !Object.keys(DEFAULT_FITNESS).includes('habilidades'),
    },
    {
      id: 'vacios',
      que: 'Las tres áreas tienen estado vacío escrito, y ninguno es una pantalla en blanco',
      ok: AREAS_FITNESS.every((a) => {
        const v = ESTADOS_VACIOS[a.id];
        return v && v.titulo && v.texto;
      }),
    },
    {
      id: 'sin-gamificar',
      que: 'Ni XP, ni monedas, ni recompensas: un rango es una medida (C-33)',
      ok: !PALABRAS_DE_JUEGO.some((p) => textosDeFitness().some((t) => p.re.test(String(t)))),
    },
    {
      id: 'una-vista',
      que: 'La pantalla de Fitness no calcula: importa lo que necesita de esta librería',
      ok: /from '\.\.\/lib\/fitness'/.test(vista),
    },
    {
      id: 'sin-hex',
      que: 'Ni un color escrito a mano: los colores salen de tokens.js (regla 2)',
      ok: !/#[0-9a-fA-F]{6}/.test(vista) && tokens.length > 0,
    },
  ];
  return { casillas, completo: casillas.every((c) => c.ok) };
}

/* Las palabras que D2-02 prohíbe. Se buscan en **los textos que ve Josué**, no
   en el código: este archivo las nombra a propósito dos párrafos más arriba
   para explicar que no están, y un barrido del archivo entero saltaría con la
   frase que hace la promesa. Van veintidós veces en este proyecto. */
/* 🐛 **Y van con límite de palabra por un motivo real: «Experto» contiene
   «xp».** La primera versión buscaba subcadenas y ponía roja la escala entera
   con el código bien — es la lección de la EH F40 (`uid()` que contenía «xp»)
   otra vez, ahora en un nombre de verdad. Una regla que salta con lo correcto
   es peor que no tenerla: enseña a no mirar los avisos. */
export const PALABRAS_DE_JUEGO = [
  { palabra: 'xp', re: /\bxp\b/i },
  { palabra: 'monedas', re: /\bmonedas?\b/i },
  { palabra: 'puntos por', re: /\bpuntos\s+por\b/i },
  { palabra: 'recompensa', re: /\brecompensas?\b/i },
  { palabra: 'premio', re: /\bpremios?\b/i },
  { palabra: 'desbloquear', re: /\bdesbloque\w+\b/i },
];

export function textosDeFitness() {
  return [
    ...AREAS_FITNESS.flatMap((a) => [a.label, a.que]),
    ...NIVELES_RANGO.flatMap((n) => [n.nombre, n.que]),
    ...GRUPOS_MUSCULARES.flatMap((g) => [g.nombre, ...(g.subgrupos || []).map((s) => s.nombre)]),
    SIN_RANGO.nombre, SIN_RANGO.que,
    ...Object.values(ESTADOS_VACIOS).flatMap((v) => [v.titulo, v.texto, v.accion?.texto].filter(Boolean)),
    ...ACCESOS_ENTRENAMIENTO.flatMap((a) => [a.nombre, a.que]),
    CTA_CLASIFICAR.texto, CTA_CLASIFICAR.mientrasTanto,
  ];
}
