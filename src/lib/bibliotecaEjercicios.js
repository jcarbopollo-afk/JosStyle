import { todayISO } from './helpers';
import { GRUPOS_MUSCULARES, subgrupoMuscular } from './fitness';
import {
  ejercicioPorId, todosLosEjercicios, musculosDe, musculoPrincipal, nombreCompleto, progresionesDe,
  buscarEjercicios, filtrarEjercicios, recuentos, materialDe, sinMaterial,
  ENTORNOS, EQUIPAMIENTO, DIFICULTADES, FILTRO_PESO_CORPORAL,
  equipo as equipoPorId, entorno as entornoPorId, dificultad as dificultadPorId, papel as papelPorId,
  tipoEjercicio, agarre as agarrePorId,
} from './ejercicios';
import { crearRutina, anadirEjercicio, planARutina, guardarRutina, variantesDeLinea } from './constructor';
import { getExerciseReplacements, NIVELES_VISIBLES, relacionDeVariante, raizDe } from './sustitucion';
import { historialPorReciente } from './historial';
import { ejerciciosDeSesion, sesionActiva, anadirEjercicioASesion, guardarSesion } from './entrenamiento';
import { aparicionesDeEjercicio } from './progresion';
import {
  detalleCompletoDeEjercicio, EJERCICIO_ARCHIVADO, TEXTO_ARCHIVADO, TEXTO_ARCHIVADO_EN_CATALOGO,
} from './detalleEjercicio';
import { claseDePregunta } from './clasificacion';
import { estadoDeDato } from './colaClasificacion';
import { paginar, POR_PAGINA } from './rendimiento';

/* Entrega 4 · Fase 34/45 — «Biblioteca y detalle avanzado de ejercicios».
   ═══════════════════════════════════════════════════════════════════════════

   *"El catálogo es la fuente de verdad de los ejercicios. No duplicar
   información en componentes, planes o sesiones."* (el contexto de la fase).

   ───────────────────────────────────────────────────────────────────────────
   1 · LA BIBLIOTECA YA EXISTÍA, Y LA FICHA TAMBIÉN, DOS VECES
   ───────────────────────────────────────────────────────────────────────────

   · **`EjerciciosView` (F2)** es el catálogo con buscador, filtros con
     recuento y tarjetas; desde la F3 es además el selector del constructor, y
     desde la F33 el de la sustitución. Es la `ExerciseLibrary` del apartado 31.
   · **`DetalleEjercicio` (F2)** es la ficha: músculos con su papel y su
     porcentaje, técnica, errores, consejos, base, variantes, progresiones y
     alternativas. Es la `ExerciseDetail`.
   · **La F29** tiene el detalle de PROGRESO de un ejercicio, con cuatro de los
     componentes del apartado 31 ya escritos (`ExerciseGoalPreview`,
     `ExerciseRankPreview`, `ExerciseVariants` y el resumen de rendimiento), y
     `detalleCompletoDeEjercicio`, que junta progreso, rango, objetivo e
     historial **sin calcular nada**.

   Así que aquí **no se escribe una segunda biblioteca ni un tercer detalle**:
   se amplían los de la F2 con lo que faltaba, y lo personal se pide a la F29.

   ───────────────────────────────────────────────────────────────────────────
   2 · LO QUE FALTABA
   ───────────────────────────────────────────────────────────────────────────

   · **Buscar por agarre, material, músculo y etiquetas** (apartado 3): se
     amplía `buscarEjercicios` (F2), con el texto buscable guardado por objeto.
   · **«Peso corporal» y «cable»** como filtro y como palabra (apartado 4).
   · **Recientes, favoritos y categorías** en la pantalla principal (apartado 2)
     — los recientes **se derivan** del historial, no se guardan (E3 F37).
   · **Los favoritos de ejercicios**, que no existían: `favoritosEjercicios`,
     una lista de ids como `favoritosPlanes` (F5), en el modelo y con su
     normalizador (regla 5).
   · **Las alternativas de la F33** en la ficha, en vez de la lista cruda de la
     F2 (apartado 20: *"Utilizar getExerciseReplacements() de Fase 33. No
     duplicar la lógica."*).
   · **La progresión como cadena** (apartado 18) y **las variantes en los dos
     sentidos** (apartado 19, y es la F29 otra vez).
   · **Añadir a entrenamiento** (apartado 21), por la puerta de la F3/F4.
   · **Tu progreso, tu objetivo y tu rango** (apartados 23-26), de la F29. */

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const lista = (v) => (Array.isArray(v) ? v : []);

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LA LISTA SEGURA (apartado 37)
   ═══════════════════════════════════════════════════════════════════════════

   *"No permitir que un dato corrupto rompa la biblioteca completa."* Un id
   repetido —uno suyo que se llame igual que uno del catálogo— se enseña una
   vez (gana el del catálogo, que es lo que devuelve `ejercicioPorId`), y uno
   sin id o sin nombre no se pinta. */
export function ejerciciosDeBiblioteca(propios = []) {
  const vistos = new Set();
  return todosLosEjercicios(propios).filter((e) => {
    if (!e || !texto(e.id) || !texto(e.nombre) || vistos.has(e.id)) return false;
    vistos.add(e.id);
    return true;
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · BUSCAR Y FILTRAR (apartados 3-6)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Las filas de filtros del apartado 4, en su orden: entorno, material,
 *  dificultad, tipo y músculo. Los tipos son los ocho que enumera, por ids del
 *  catálogo de la F2. */
export const TIPOS_DEL_FILTRO = ['fuerza', 'hipertrofia', 'aislamiento', 'compuesto', 'isometrico', 'explosivo', 'movilidad', 'habilidad'];
export const FILAS_FILTRO_BIBLIOTECA = [
  { id: 'entorno', nombre: 'Dónde' },
  { id: 'equipo', nombre: 'Material' },
  { id: 'dificultad', nombre: 'Dificultad' },
  { id: 'tipo', nombre: 'Tipo' },
  { id: 'grupo', nombre: 'Músculo' },
];
export const TEXTO_LIMPIAR_FILTROS = 'Limpiar filtros';

/** Apartados 3 y 5 — buscar y filtrar de una vez. **Todos** los filtros activos
 *  a la vez (apartado 5), uno por fila. */
export function consultarBiblioteca({ consulta = '', filtros = {}, propios = [] } = {}) {
  const f = filtros || {};
  const encontrados = texto(consulta)
    ? buscarEjercicios(consulta, propios).filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)
    : ejerciciosDeBiblioteca(propios);
  const resultado = filtrarEjercicios(encontrados, {
    entornos: f.entorno ? [f.entorno] : null,
    equipamiento: f.equipo ? [f.equipo] : null,
    grupo: f.grupo || null,
    dificultad: f.dificultad || null,
    tipos: f.tipo ? [f.tipo] : null,
  });
  return { encontrados, resultado, cuenta: recuentos(encontrados), hayFiltros: Object.values(f).some(Boolean) };
}

/** Las pastillas de cada fila, con cuántos quedarían. ⚠️ Un material que no
 *  aparece en ningún ejercicio no se ofrece: un filtro que siempre deja la
 *  pantalla vacía es un control decorativo (FIT F5, apartado 7). */
export function opcionesDeFiltroBiblioteca(cuenta) {
  const c = cuenta || {};
  return {
    entorno: ENTORNOS.map((e) => ({ id: e.id, nombre: e.nombre, cuantos: (c.entornos || {})[e.id] || 0 })),
    equipo: [
      { ...FILTRO_PESO_CORPORAL, cuantos: (c.equipamiento || {})[FILTRO_PESO_CORPORAL.id] || 0 },
      ...EQUIPAMIENTO.filter((e) => !e.sinMaterial)
        .map((e) => ({ id: e.id, nombre: e.id === 'polea' ? 'Polea (cable)' : e.nombre, cuantos: (c.equipamiento || {})[e.id] || 0 })),
    ].filter((o) => o.cuantos > 0),
    dificultad: DIFICULTADES.map((d) => ({ id: d.id, nombre: d.nombre, cuantos: (c.dificultades || {})[d.id] || 0 })),
    tipo: TIPOS_DEL_FILTRO.map((id) => ({ id, nombre: tipoEjercicio(id)?.nombre || id, cuantos: (c.tipos || {})[id] || 0 }))
      .filter((o) => o.cuantos > 0),
    grupo: GRUPOS_MUSCULARES.map((g) => ({ id: g.id, nombre: g.nombre, cuantos: (c.grupos || {})[g.id] || 0 })),
  };
}

/** Apartado 33 — *"renderizado limitado si es necesario"*: la lista se pinta
 *  de 20 en 20 con `paginar()` de EH F44, que ya escribe su «Ver 20 más». */
export const POR_PAGINA_BIBLIOTECA = POR_PAGINA;
export const paginaDeBiblioteca = (resultado, visibles = POR_PAGINA) => paginar(resultado, { visibles });

/* ═══════════════════════════════════════════════════════════════════════════
   3 · RECIENTES, FAVORITOS Y CATEGORÍAS (apartados 2 y 22)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Los últimos ejercicios que ha entrenado, sin repetir. 🚨 **Se derivan del
 *  historial** (F10/F31), no se guardan: una lista guardada se quedaría vieja
 *  en cuanto borre una sesión (E3 F37). */
export function recientesDeBiblioteca(fitness, { propios = [], limite = 6 } = {}) {
  const out = [];
  const vistos = new Set();
  for (const s of historialPorReciente(fitness || {})) {
    for (const e of ejerciciosDeSesion(s)) {
      const id = texto(e?.exerciseId);
      if (!id || vistos.has(id)) continue;
      vistos.add(id);
      const ej = ejercicioPorId(id, propios);
      if (ej) out.push(ej);
      if (out.length >= limite) return out;
    }
  }
  return out;
}

export const favoritosDeEjercicios = (fitness) => lista((fitness || {}).favoritosEjercicios);
export const esFavoritoEjercicio = (fitness, id) => favoritosDeEjercicios(fitness).includes(texto(id));

/** ♡ / ♥ del apartado 22. Devuelve **el `fitness` entero** (regla 5). ⚠️ Solo
 *  ese id: *"No transferirlos automáticamente a variantes"*, y cada variante es
 *  otro ejercicio con otro id. Uno que no existe no se marca. */
export function alternarFavoritoEjercicio(fitness, exerciseId, { propios = [] } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const id = texto(exerciseId);
  if (!id || !ejercicioPorId(id, propios)) return f;
  const actuales = favoritosDeEjercicios(f);
  return {
    ...f,
    favoritosEjercicios: actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id],
  };
}

export function favoritosDeBiblioteca(fitness, { propios = [] } = {}) {
  return favoritosDeEjercicios(fitness).map((id) => ejercicioPorId(id, propios)).filter(Boolean);
}

/** Explorar por categorías: los siete grupos, por su músculo principal, y las
 *  habilidades aparte, que no son un grupo. Cada una lleva el filtro que pone. */
export function categoriasDeBiblioteca(propios = []) {
  const todos = ejerciciosDeBiblioteca(propios);
  const grupos = GRUPOS_MUSCULARES.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    cuantos: todos.filter((e) => musculoPrincipal(e)?.grupoId === g.id).length,
    filtro: { grupo: g.id },
  }));
  const habilidades = {
    id: 'habilidades', nombre: 'Habilidades',
    cuantos: todos.filter((e) => lista(e.tipos).includes('habilidad')).length,
    filtro: { tipo: 'habilidad' },
  };
  return [...grupos, habilidades].filter((c) => c.cuantos > 0);
}

/** Apartado 2 — *"No mostrar demasiados bloques si el usuario todavía no tiene
 *  historial"*: recientes y favoritos **solo si hay**; categorías y catálogo,
 *  siempre. */
export function bloquesDeBiblioteca(fitness, { propios = [] } = {}) {
  const recientes = recientesDeBiblioteca(fitness, { propios });
  const favoritos = favoritosDeBiblioteca(fitness, { propios });
  return [
    ...(recientes.length ? [{ id: 'recientes', titulo: 'Recientes', sub: 'Lo último que has entrenado', ejercicios: recientes }] : []),
    ...(favoritos.length ? [{ id: 'favoritos', titulo: 'Favoritos', sub: 'Los que has marcado', ejercicios: favoritos }] : []),
    { id: 'categorias', titulo: 'Explorar', sub: 'Por grupo muscular', categorias: categoriasDeBiblioteca(propios) },
    { id: 'catalogo', titulo: 'Todos los ejercicios', sub: '' },
  ];
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LA FICHA: LO QUE ES EL EJERCICIO (apartados 8-17)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 9 — los músculos con grupo, subgrupo, porcentaje y papel. ⚠️ Un
 *  porcentaje que no es un número o no es positivo **no se pinta** —un «NaN %»
 *  o un «-10 %» romperían la barra— (apartado 37). */
export const NOTA_PORCENTAJES = 'Son una estimación del reparto del trabajo, no una medición.';

export function musculosDeFicha(ej) {
  return musculosDe(ej)
    .filter((m) => typeof m.porcentaje === 'number' && Number.isFinite(m.porcentaje) && m.porcentaje > 0)
    .sort((a, b) => b.porcentaje - a.porcentaje)
    .map((m) => ({
      subgrupoId: m.subgrupoId,
      subgrupo: m.nombre,
      grupo: m.grupo || subgrupoMuscular(m.subgrupoId)?.grupo || '',
      porcentaje: Math.min(100, Math.round(m.porcentaje)),
      papel: papelPorId(m.papel)?.nombre || '',
      principal: m.papel === 'principal',
    }));
}

/** Apartado 10 — *"Si no necesita equipamiento: Peso corporal"*. ⚠️ Lo que se
 *  puede hacer sin nada **y** con algo (unas zancadas con mancuernas) dice las
 *  dos cosas. */
export function equipamientoDeFicha(ej) {
  const material = materialDe(ej).map((x) => equipoPorId(x)?.nombre || x);
  return sinMaterial(ej) ? [FILTRO_PESO_CORPORAL.nombre, ...material] : material;
}

/** Apartado 13 — las etiquetas que importan, **tres como mucho**: *"No mostrar
 *  8 etiquetas si solo 2 son realmente relevantes"*. «Compuesto» y
 *  «Aislamiento» no entran: dicen cómo es el movimiento, no para qué sirve. */
export const ETIQUETAS_RELEVANTES = ['habilidad', 'isometrico', 'explosivo', 'fuerza', 'hipertrofia', 'movilidad'];
export const MAX_ETIQUETAS = 3;
export function etiquetasDeFicha(ej) {
  const tipos = new Set([...lista(ej?.tipos), ...(ej?.explosivo ? ['explosivo'] : [])]);
  return ETIQUETAS_RELEVANTES.filter((t) => tipos.has(t)).slice(0, MAX_ETIQUETAS)
    .map((t) => tipoEjercicio(t)?.nombre || t);
}

/** Apartado 14 — «Cómo hacerlo», en pasos, **con lo que hay escrito**. El
 *  catálogo guarda la preparación y la ejecución; el «final del movimiento» no
 *  lo tiene ninguna ficha, así que no sale: *"No inventar instrucciones"*. */
export const TITULOS_TECNICA = [
  { campo: 'preparacion', titulo: 'Posición inicial' },
  { campo: 'ejecucion', titulo: 'Ejecución' },
  { campo: 'final', titulo: 'Final del movimiento' },
];
export function tecnicaDeFicha(ej) {
  const ins = ej?.instrucciones || {};
  const pasos = TITULOS_TECNICA
    .filter((t) => texto(ins[t.campo]))
    .map((t, i) => ({ numero: i + 1, titulo: t.titulo, texto: texto(ins[t.campo]) }));
  return {
    pasos,
    respiracion: texto(ins.respiracion),
    errores: lista(ins.errores).map(texto).filter(Boolean),
    consejos: lista(ins.consejos).map(texto).filter(Boolean),
    hay: pasos.length > 0 || !!texto(ins.respiracion) || lista(ins.errores).length > 0 || lista(ins.consejos).length > 0,
  };
}

/** Apartado 17 — el tutorial **solo si el recurso es real**: un archivo de la
 *  propia aplicación (`/…`) con una extensión de vídeo o de imagen. Nada de
 *  enlaces de fuera (F2, apartado 22) ni de un reproductor falso. Si el archivo
 *  no carga, lo dice la propia pantalla (`onError`), que es el «recurso
 *  multimedia roto» del apartado 37. */
const EXT_VIDEO = /\.(mp4|webm|mov)$/i;
const EXT_ANIMACION = /\.(gif|webp|png|jpe?g|svg)$/i;
export function tutorialDeFicha(ej) {
  const t = ej?.tutorial || {};
  const local = (v) => typeof v === 'string' && /^\/[^\s]+$/.test(v) && !v.startsWith('//');
  if (local(t.video) && EXT_VIDEO.test(t.video)) return { tipo: 'video', src: t.video };
  if (local(t.animacion) && EXT_ANIMACION.test(t.animacion)) return { tipo: 'animacion', src: t.animacion };
  return null;
}
export const SIN_TUTORIAL = 'Todavía no hay vídeo de este ejercicio.';
export const TUTORIAL_ROTO = 'No se ha podido cargar el vídeo. La técnica de arriba sigue valiendo.';

/** Apartado 28 — la imagen **solo si es de este ejercicio** y es un archivo de
 *  la aplicación; si no, `null` y se pinta un hueco con el icono de su grupo.
 *  *"No utilizar imágenes aleatorias de otro ejercicio."* */
export function imagenDeFicha(ej) {
  const r = ej?.recursos || {};
  const v = r.ilustracion || r.thumbnail || null;
  return typeof v === 'string' && /^\/[^\s]+\.(png|jpe?g|webp|svg|gif)$/i.test(v) ? v : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · PROGRESIONES, VARIANTES Y ALTERNATIVAS (apartados 18-20)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Apartado 18 — la progresión de una skill, **como cadena**: *Tuck Planche ↓
 * Advanced Tuck ↓ Straddle ↓ Full Planche*.
 *
 * ⚠️ **Las progresiones del catálogo apuntan HACIA ABAJO** (FIT F30): son lo
 * que hay que dominar ANTES. Así que la cadena se monta con la familia de la
 * skill (su raíz y sus variantes, F29) ordenada por **cuántos de la familia
 * pide antes**: la tuck no pide ninguno, la full pide los tres. Lo que se pide
 * de fuera de la familia (un L-sit antes de una planche) va aparte, en
 * «Antes conviene dominar». Sin recursión, así que una progresión circular
 * (apartado 37) no puede colgar la pantalla.
 */
export function progresionDeFicha(ej, propios = []) {
  if (!ej) return null;
  const esSkill = lista(ej.tipos).includes('habilidad');
  const raiz = raizDe(ej, propios);
  const familia = [raiz, ...variantesDeLinea({ exerciseId: raiz.id }, propios)]
    .filter((x, i, arr) => x && arr.findIndex((y) => y.id === x.id) === i);
  const idsFamilia = new Set(familia.map((x) => x.id));
  const conProgresion = familia.filter((x) => lista(x.progresiones).some((p) => idsFamilia.has(p))
    || familia.some((y) => lista(y.progresiones).includes(x.id)));
  const cadena = conProgresion
    .map((x) => ({ ej: x, antes: lista(x.progresiones).filter((p) => idsFamilia.has(p) && p !== x.id).length }))
    /* A igualdad, el más fácil primero: el catálogo no escribe que las
       lastradas vengan después de las pronas, pero su dificultad sí lo dice. */
    .sort((a, b) => a.antes - b.antes
      || (dificultadPorId(a.ej.dificultad)?.orden ?? 1) - (dificultadPorId(b.ej.dificultad)?.orden ?? 1)
      || nombreCompleto(a.ej).localeCompare(nombreCompleto(b.ej), 'es'))
    .map(({ ej: x }) => ({ id: x.id, nombre: nombreCompleto(x), actual: x.id === ej.id }));
  const antes = progresionesDe(ej, propios).filter((p) => !idsFamilia.has(p.id) && p.id !== ej.id)
    .map((p) => ({ id: p.id, nombre: nombreCompleto(p) }));
  /* La CADENA es de las skills (apartado 18: *"Para ejercicios de skill"*); lo
     que se pide antes lo enseña cualquier ficha, como ya hacía la F2. */
  const enCadena = esSkill && cadena.length >= 2 && cadena.some((c) => c.actual);
  if (!enCadena && !antes.length) return null;
  return { cadena: enCadena ? cadena : [], antes };
}

/** Apartado 19 — las variantes, **en los dos sentidos** (la base, las
 *  hermanas y las suyas): unas dominadas neutras son hermanas de las supinas.
 *  Cada una **mantiene su identidad** y abre SU ficha. */
export function variantesDeFicha(ej, propios = []) {
  if (!ej) return [];
  return variantesDeLinea({ exerciseId: ej.id }, propios).map((v) => ({
    id: v.id,
    nombre: nombreCompleto(v),
    relacion: relacionDeVariante(ej, v, propios),
  }));
}

/** Apartado 20 — las alternativas **son la F33**, con su nivel y su motivo.
 *  Las que no se enseñan normalmente (poco recomendables) no salen aquí. */
export const ALTERNATIVAS_EN_FICHA = 4;
export function alternativasDeFicha(ej, { propios = [] } = {}) {
  if (!ej) return { items: [], todas: [], total: 0 };
  const todas = getExerciseReplacements(ej.id, { propios })
    .filter((x) => NIVELES_VISIBLES.includes(x.compatibilityLevel));
  return { items: todas.slice(0, ALTERNATIVAS_EN_FICHA), todas, total: todas.length };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · AÑADIR A ENTRENAMIENTO (apartado 21)
   ═══════════════════════════════════════════════════════════════════════════

   *"Debe permitir: elegir entrenamiento existente, crear uno nuevo. No iniciar
   Live Workout."* Añadir a una plantilla es **la puerta de la F3/F4**: se abre
   como rutina, `anadirEjercicio` le pone la línea con su configuración por
   defecto y `guardarRutina` la guarda **por su id** —así las demás plantillas
   no se tocan—. Crear uno nuevo es una rutina con este ejercicio dentro, que
   se abre en el constructor para terminarla. */
export function entrenamientosParaAnadir(fitness) {
  return lista((fitness || {}).plantillas).filter((p) => p && texto(p.id))
    .map((p) => ({ id: p.id, nombre: texto(p.nombre) || 'Sin nombre', ejercicios: lista(p.ejercicios).length }));
}

export function anadirAEntrenamiento(fitness, plantillaId, exerciseId, { propios = [], hoy = todayISO() } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const ej = ejercicioPorId(texto(exerciseId), propios);
  if (!ej) return { ok: false, motivo: 'Ese ejercicio ya no está en el catálogo.', fitness: f };
  const plantillas = lista(f.plantillas);
  const pl = plantillas.find((p) => p && p.id === texto(plantillaId));
  if (!pl) return { ok: false, motivo: 'Ese entrenamiento ya no existe.', fitness: f };
  const rutina = anadirEjercicio(planARutina(pl), ej.id, { propios });
  const r = guardarRutina(plantillas, rutina, propios, hoy);
  if (!r.ok) return { ok: false, motivo: 'No se ha podido guardar el entrenamiento.', fitness: f };
  return { ok: true, motivo: null, fitness: { ...f, plantillas: r.planes }, plantilla: r.plan };
}

/** 🔓 FIT F36, apartado 17 — *"entrenamiento nuevo, plantilla existente,
 *  sesión actual si existe"*. La sesión en curso, si la hay: la misma de la
 *  tarjeta de recuperación (F7), no otra búsqueda. */
export function sesionParaAnadir(fitness) {
  const s = sesionActiva(fitness);
  return s ? { id: s.id, nombre: texto(s.nombre) || 'Entrenamiento', ejercicios: ejerciciosDeSesion(s).length } : null;
}

/** Y añadirlo a ella, **guardando la sesión por su puerta** (`guardarSesion`,
 *  que sustituye por id: pulsar dos veces no duplica la sesión). */
export function anadirALaSesionEnCurso(fitness, exerciseId, { propios = [] } = {}) {
  const f = fitness && typeof fitness === 'object' ? fitness : {};
  const s = sesionActiva(f);
  if (!s) return { ok: false, motivo: 'No hay ningún entrenamiento en curso.', fitness: f };
  const despues = anadirEjercicioASesion(s, exerciseId, propios);
  if (despues === s) return { ok: false, motivo: 'Ese ejercicio no se puede añadir.', fitness: f };
  return { ok: true, motivo: null, fitness: guardarSesion(f, despues), sesion: despues };
}

/** «Crear uno nuevo»: una rutina sin guardar, con este ejercicio. La guarda él
 *  en el constructor, con su nombre. */
export function rutinaNuevaCon(exerciseId, { propios = [] } = {}) {
  const ej = ejercicioPorId(texto(exerciseId), propios);
  if (!ej) return null;
  return anadirEjercicio(crearRutina({}), ej.id, { propios });
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · LO PERSONAL (apartados 23-26)
   ═══════════════════════════════════════════════════════════════════════════ */

export const SIN_RENDIMIENTO = 'Sin datos de rendimiento todavía.';
export const SIN_CLASIFICACION = 'Sin clasificación';
export const ULTIMOS_EN_FICHA = 3;

/**
 * Lo que la ficha dice de él. 🚨 **Ni un cálculo aquí**: todo sale de
 * `detalleCompletoDeEjercicio` (F29), que a su vez pide a la F11, la F12, la
 * F19, la F23, la F14 y la F8. Sin datos, **ni rango ni progreso ficticios**
 * (apartado 29).
 */
export function personalDeFicha(fitness, exerciseId, { propios = [], perfil = null, hoy = todayISO() } = {}) {
  const d = detalleCompletoDeEjercicio(fitness || {}, exerciseId, { propios, perfil, hoy, limiteHistorial: ULTIMOS_EN_FICHA });
  const ej = ejercicioPorId(exerciseId, propios);
  const conDatos = !d.error && d.veces > 0;
  const estado = ej ? estadoDeDato(fitness || {}, ej.id, { propios }) : null;
  return {
    error: d.error,
    conDatos,
    vacio: conDatos ? '' : SIN_RENDIMIENTO,
    progreso: conDatos ? d.progreso : null,
    tendencia: conDatos ? d.tendencia : null,
    rango: d.rango,
    objetivo: d.objetivo,
    ultimos: conDatos ? lista(d.historial).slice(0, ULTIMOS_EN_FICHA) : [],
    veces: d.veces,
    /* Apartado 25 — «Clasificar» solo si corresponde al sistema que ya existe:
       que la F17 sepa preguntarlo y que no tenga ya datos de sobra (F24). */
    puedeClasificar: !!ej && !d.rango.hay && !!claseDePregunta(ej)
      && (!estado || estado.id !== 'datos_suficientes'),
    sinClasificacion: d.rango.hay ? '' : SIN_CLASIFICACION,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · LA FICHA ENTERA (apartados 8, 27, 29 y 30)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Todo lo que enseña la ficha de un ejercicio, **incluido uno archivado**: si
 * ya no está en el catálogo pero tiene sesiones, se enseña su historia con la
 * etiqueta «Ejercicio archivado» (F29, C-36) y **no se ofrece añadirlo** a un
 * entrenamiento nuevo (apartado 27). ⚠️ Un error en una parte no se lleva la
 * ficha entera (apartado 37).
 */
export function fichaDeBiblioteca(fitness, exerciseId, { propios = [], perfil = null, hoy = todayISO() } = {}) {
  const id = texto(exerciseId);
  const ej = ejercicioPorId(id, propios);
  const seguro = (fn, def) => { try { return fn(); } catch { return def; } };
  const apariciones = seguro(() => aparicionesDeEjercicio(fitness || {}, id, propios), []);
  /* 🔓 FIT F35, apartado 37 — un archivado del catálogo (`archivado: true`)
     se enseña igual que uno que ya no está, pero **con su nombre**. */
  if (!ej || ej.archivado === true) {
    if (!apariciones.length) return { estado: 'no_existe', id, archivado: false };
    return {
      estado: 'archivado',
      id,
      archivado: true,
      nombre: ej ? nombreCompleto(ej) : id,
      etiquetaArchivado: EJERCICIO_ARCHIVADO,
      avisoArchivado: ej ? TEXTO_ARCHIVADO_EN_CATALOGO : TEXTO_ARCHIVADO,
      personal: seguro(() => personalDeFicha(fitness, id, { propios, perfil, hoy }), null),
      acciones: accionesDeFicha({ existe: false, conDatos: true, objetivo: false }),
    };
  }
  const personal = seguro(() => personalDeFicha(fitness, id, { propios, perfil, hoy }), null);
  const principal = musculoPrincipal(ej);
  return {
    estado: 'ok',
    id,
    archivado: false,
    ejercicio: ej,
    nombre: ej.nombre,
    variante: ej.variante || '',
    descripcion: ej.descripcion || '',
    imagen: imagenDeFicha(ej),
    grupoPrincipal: principal ? principal.grupoId : null,
    etiquetas: etiquetasDeFicha(ej),
    musculos: seguro(() => musculosDeFicha(ej), []),
    notaMusculos: NOTA_PORCENTAJES,
    equipamiento: equipamientoDeFicha(ej),
    entornos: lista(ej.entornos).map((x) => entornoPorId(x)?.nombre).filter(Boolean),
    dificultad: dificultadPorId(ej.dificultad)?.nombre || '',
    agarre: agarrePorId(ej.agarre)?.nombre || '',
    tecnica: tecnicaDeFicha(ej),
    tutorial: tutorialDeFicha(ej),
    progresion: seguro(() => progresionDeFicha(ej, propios), null),
    variantes: seguro(() => variantesDeFicha(ej, propios), []),
    alternativas: seguro(() => alternativasDeFicha(ej, { propios }), { items: [], todas: [], total: 0 }),
    favorito: esFavoritoEjercicio(fitness, id),
    personal,
    acciones: accionesDeFicha({
      existe: true,
      conDatos: !!(personal && personal.conDatos),
      objetivo: !!(personal && personal.objetivo && personal.objetivo.hay),
      alternativas: true,
      variantes: true,
    }),
  };
}

/** Apartado 30 — *"Solo mostrar acciones aplicables"*. Quien pinta además
 *  exige que llegue la función que la hace (regla 8). */
export function accionesDeFicha({ existe = true, conDatos = false, objetivo = false, alternativas = false, variantes = false } = {}) {
  return [
    ...(existe ? ['anadir'] : []),
    ...(conDatos ? ['progreso'] : []),
    ...(objetivo ? ['objetivo'] : []),
    ...(alternativas ? ['alternativas'] : []),
    ...(variantes ? ['variantes'] : []),
    ...(existe ? ['favorito'] : []),
  ];
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · LO QUE NO SE CONSTRUYE, LO DECIDIDO Y LA AUDITORÍA
   ═══════════════════════════════════════════════════════════════════════════ */

export const YA_LO_RESUELVE = [
  { que: 'La biblioteca: buscador, filtros con recuento y tarjetas', es: 'EjerciciosView (F2)' },
  { que: 'La ficha: músculos, técnica, errores, consejos, variantes y progresiones', es: 'DetalleEjercicio (F2)' },
  { que: 'Progreso, rango, objetivo e historial de un ejercicio', es: detalleCompletoDeEjercicio },
  { que: 'Las alternativas', es: getExerciseReplacements },
  { que: 'Las variantes en los dos sentidos', es: variantesDeLinea },
  { que: 'Añadir una línea a un entrenamiento', es: anadirEjercicio },
  { que: 'Guardar ese entrenamiento sin tocar los demás', es: guardarRutina },
  { que: 'Pintar la lista de 20 en 20', es: paginar },
];

export const NO_EN_FIT34 = [
  { que: 'IA, ejercicios generados o recomendaciones personalizadas', porque: 'Apartado 40.' },
  { que: 'Análisis corporal, predicciones, social, leaderboard o XP', porque: 'Apartado 40.' },
  { que: 'El «final del movimiento» de la técnica', porque: 'Ninguna ficha del catálogo lo tiene escrito; inventarlo es lo que prohíbe el apartado 14.' },
  { que: 'Imágenes y vídeos', porque: 'No existen todavía (F2, apartado 22): se pinta un hueco y no un reproductor falso (apartados 17 y 28).' },
  { que: 'Un nombre histórico para un ejercicio archivado', porque: 'La sesión guarda solo su id (F3, C-36): se enseña el id con la etiqueta «Ejercicio archivado».' },
  { que: 'Recalcular la dificultad con su progreso', porque: 'Apartado 12: la del catálogo.' },
];

export const DECISIONES_FIT34 = [
  {
    que: 'Los favoritos de ejercicios existen desde esta fase',
    porque: 'El apartado 22 lo deja en «si existe o se decide»; no existían (F33). Se decide que sí, con la forma de `favoritosPlanes` (ids), en el modelo y con normalizador, y el que apunta a algo borrado lo limpia la puerta de carga.',
  },
  {
    que: 'Los recientes se derivan del historial',
    porque: 'Guardarlos haría que un ejercicio de una sesión borrada siguiera saliendo (E3 F37).',
  },
  {
    que: 'Las alternativas de la ficha son las de la F33, no la lista cruda de la F2',
    porque: 'Apartado 20, literal. Los `sustitutos` de la F2 siguen siendo el dato que el motor lee.',
  },
  {
    que: 'La cadena de progresión se ordena por lo que cada paso pide antes',
    porque: 'Las progresiones apuntan hacia abajo (F30). Contar cuántos de la familia pide cada uno da el orden sin recorrer el grafo, así que un ciclo no cuelga nada.',
  },
  {
    que: 'Tres etiquetas como mucho, y sin «compuesto» ni «aislamiento»',
    porque: 'Apartado 13: dicen cómo es el movimiento, no para qué sirve, y ocho etiquetas no dicen nada.',
  },
];

/** La auditoría que se EJECUTA (EH F42). */
export function auditarBiblioteca({ propios = [] } = {}) {
  const todos = ejerciciosDeBiblioteca(propios);
  const conFicha = todos.filter((e) => fichaDeBiblioteca({}, e.id, { propios }).estado === 'ok');
  const casillas = [
    { id: 'todas_las_fichas', ok: conFicha.length === todos.length },
    { id: 'busqueda_con_acentos', ok: consultarBiblioteca({ consulta: 'dominadas', propios }).resultado.some((e) => e.id === 'dominada-prona') },
    { id: 'reset', ok: consultarBiblioteca({ filtros: {}, propios }).resultado.length === todos.length },
    { id: 'sin_rango_ficticio', ok: !personalDeFicha({}, 'press-banca-barra').rango.hay },
    { id: 'alternativas_de_la_f33', ok: alternativasDeFicha(ejercicioPorId('press-banca-barra')).items.every((x) => !!x.compatibilityLevel) },
  ];
  return { casillas, ok: casillas.every((c) => c.ok) };
}
