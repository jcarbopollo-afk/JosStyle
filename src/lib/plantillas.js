import { uid, todayISO } from './helpers';
/* ⚠️ `diasEntre` existe DOS veces en el proyecto y no significan lo mismo: la de
   `rachas.js` cuenta días naturales **incluyendo los dos extremos** (+1) y la de
   `hoy.js` cuenta la diferencia entera, que es la que hace falta aquí —hoy es
   cero—. **Antes de importar una función por su nombre, mirar qué devuelve.** */
import { diasEntre } from './hoy';
import { ENTORNOS, entorno as entornoDe, ranura, ejercicioPorId } from './ejercicios';
import {
  crearRutina, planARutina, rutinaAPlan, resumenRutina, nombreDeLinea,
} from './constructor';

/* Entrega 4 · Fase 4/45 — «Gestión de entrenamientos y plantillas propias».
   ═══════════════════════════════════════════════════════════════════════════

   El objetivo lo dice en una línea: *"No quiero simplemente una lista visual.
   Todas las acciones deben funcionar realmente y persistir los cambios"*. Y el
   criterio de finalización lo remata: *Crear → Guardar → Ver → Editar →
   Duplicar → Eliminar*, todo real.

   ───────────────────────────────────────────────────────────────────────────
   1 · LO QUE YA EXISTÍA, Y ES CASI TODO (apartado 2)
   ───────────────────────────────────────────────────────────────────────────

   *"Si la arquitectura creada anteriormente ya tiene una solución equivalente,
   reutilízala en lugar de crear modelos duplicados."* Pues sí la tiene, y hay
   que decirlo claro para no escribir una segunda:

   🚨 **`UserTemplate` ES `fitness.plantillas`.** La F1 dejó escrita la división
   —*"un plan y una plantilla son la misma forma: lo que cambia es si él lo creó
   (`plantillas`) o viene de la biblioteca (`planes`)"*— y la F3 guarda ahí. Un
   modelo `UserTemplate` nuevo al lado habría dejado **lo que Josué ya se ha
   construido invisible en la pantalla que se llama «Tus plantillas»**, que es
   el fallo de la E3 F16, la E3 F36 y la E3 F41 por quinta vez.

   🚨 **Y `Constructor → Plantilla → Constructor` ya es bidireccional** (apartado
   23): `rutinaAPlan()` y `planARutina()` son de la F3, y `guardarRutina()`
   **sustituye por id** en vez de añadir una copia. *"No crear un segundo
   constructor paralelo"* no hay que programarlo: no hay dónde meterlo.

   Lo que esta fase añade es **la gestión**: ver, duplicar, eliminar, buscar,
   filtrar, ordenar y el detalle.

   ───────────────────────────────────────────────────────────────────────────
   2 · ELIMINAR VA A LA PAPELERA, Y POR ESO EL AVISO NO MIENTE (apartado 8)
   ───────────────────────────────────────────────────────────────────────────

   El apartado pide confirmación y *"eliminar de la persistencia"*. En JosStyle
   una lista que se puede borrar **va a `CATALOGO_PAPELERA`** (EH F45): si no,
   se borraría para siempre y la auditoría de ME F4 no lo vería. Así que la
   plantilla se recupera desde *Eliminados recientes*, y **el aviso lo dice** —
   prometer un borrado definitivo de algo que vuelve es mentir en pantalla
   (E3 F26 con las tareas).

   ───────────────────────────────────────────────────────────────────────────
   3 · LO QUE EL ENUNCIADO NOMBRA Y NO EXISTE
   ───────────────────────────────────────────────────────────────────────────

   El apartado 3 pide *"objetivo si existe"* en la tarjeta y el 9 lo repite en el
   detalle — pero el apartado 6, que enumera **todo lo que se puede editar**, no
   lo incluye. O sea que no hay forma de ponerlo: un campo que nadie puede
   rellenar es media función (regla 8, y es el *"1 entrega pendiente"* de la
   E3 F43). Está en `SIN_OBJETIVO` con su motivo, no como un hueco vacío.

   Y *"Empezar entrenamiento"* (apartado 19) **no se pinta**, porque el propio
   enunciado lo autoriza: *"Si esto genera una acción muerta, es preferible NO
   mostrar todavía el botón"*. El motor es la FIT F7. */

const lista = (v) => (Array.isArray(v) ? v : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LOS CATÁLOGOS DE LA PANTALLA (apartados 14, 15 y 16)
   ═══════════════════════════════════════════════════════════════════════════ */

/* Apartado 14: *"Como mínimo: más recientes, más antiguas, nombre A-Z, nombre
   Z-A. No hace falta crear un sistema complejo."* Ni uno más. */
export const ORDENACIONES = [
  { id: 'recientes', nombre: 'Más recientes' },
  { id: 'antiguas', nombre: 'Más antiguas' },
  { id: 'az', nombre: 'Nombre A-Z' },
  { id: 'za', nombre: 'Nombre Z-A' },
];
export const ORDEN_POR_DEFECTO = 'recientes';

/* Apartado 15: *"Si hay suficientes plantillas para que tenga sentido"*. Con
   tres en pantalla, un buscador estorba más de lo que ayuda. ⚠️ Y la lección de
   la E3 F24 al revés: una salida que solo existe cuando ya tienes muchos no es
   una salida — aquí no es una salida, es un atajo, y por eso sí puede esperar. */
export const MINIMO_PARA_BUSCAR = 4;

/* Apartado 16. ⚠️ Los entornos NO se redefinen: son los tres de la F2, y
   «Todos» es la ausencia de filtro, no un cuarto entorno. */
export const FILTRO_TODOS = 'todos';
export const filtrosDeEntorno = () => [
  { id: FILTRO_TODOS, nombre: 'Todos' },
  ...ENTORNOS.map((e) => ({ id: e.id, nombre: e.nombre })),
];

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LEER UNA PLANTILLA
   ═══════════════════════════════════════════════════════════════════════════ */

export const plantillasDe = (fitness) => lista((fitness || {}).plantillas);
export const plantillaPorId = (plantillas, id) =>
  lista(plantillas).find((p) => p && p.id === texto(id)) || null;

/* Apartado 11: *"Editado hace 2 días"*. ⚠️ Y **nunca «hace 20 min»**: lo que se
   guarda es el día, sin hora, así que decir minutos sería inventarse una
   precisión que el dato no tiene (E3 F22). */
export function textoEditado(plan, hoy = todayISO()) {
  const cuando = texto(plan?.editadoEn) || texto(plan?.creadoEn);
  if (!cuando) return '';
  const dias = diasEntre(cuando, hoy);
  if (dias <= 0) return 'Editado hoy';
  if (dias === 1) return 'Editado ayer';
  return `Editado hace ${dias} días`;
}

/* El *thumbnail* del apartado 3. 🚨 **No es una imagen inventada**: es el grupo
   muscular que más pesa en la propia rutina, sacado de `distribucionMuscular`.
   Un placeholder derivado dice algo; una foto de banco de imágenes, no. */
export function grupoDominante(plan, propios = []) {
  const r = resumenRutina(planARutina(plan) || crearRutina({}), propios);
  return r.distribucion.grupos[0] || null;
}

/* Todo lo que la tarjeta y el detalle necesitan, en una llamada — y **todo
   derivado** (apartados 10 y 11: la distribución y la duración se recalculan,
   no se guardan). */
export function fichaDePlantilla(plan, propios = [], hoy = todayISO()) {
  const rutina = planARutina(plan);
  if (!rutina) return null;
  const resumen = resumenRutina(rutina, propios);
  const entornos = rutina.entornos.map((e) => entornoDe(e)?.nombre).filter(Boolean);
  return {
    id: rutina.id,
    nombre: rutina.nombre || 'Sin nombre',
    descripcion: rutina.descripcion,
    entornos,
    entornoIds: rutina.entornos,
    ejercicios: resumen.ejercicios,
    duracion: resumen.duracion,
    distribucion: resumen.distribucion,
    grupo: resumen.distribucion.grupos[0] || null,
    editado: textoEditado(plan, hoy),
    /* Apartado 24: una plantilla **sin ejercicios** es un caso real —se puede
       guardar una y luego quitárselos todos desde el constructor— y no puede
       dejar la tarjeta en blanco. */
    vacia: resumen.ejercicios === 0,
  };
}

/* Apartado 9: las filas del detalle. ⚠️ Un ejercicio que ya no está en el
   catálogo **se dice**, no rompe la plantilla entera (apartado 24). */
export function lineasDePlantilla(plan, propios = []) {
  const rutina = planARutina(plan);
  if (!rutina) return [];
  return rutina.lineas.map((l) => ({
    ...l,
    nombre: nombreDeLinea(l, propios),
    existe: !!ejercicioPorId(l.exerciseId, propios),
  }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · BUSCAR, FILTRAR Y ORDENAR (apartados 14, 15 y 16)
   ═══════════════════════════════════════════════════════════════════════════

   ⚠️ Los tres **leen**: ni uno guarda nada. Qué orden está puesto y qué se está
   buscando son estado de la pantalla, no un dato (EH F40). */

export function buscarPlantillas(plantillas, consulta) {
  const q = ranura(consulta);
  if (!q) return lista(plantillas);
  /* `ranura()` es la de la F2: sin acentos y sin mayúsculas, porque nadie
     escribe «Hipertrofia» con tilde en un iPhone (apartado 15). */
  return lista(plantillas).filter((p) => ranura(p?.nombre || '').includes(q));
}

export function filtrarPlantillas(plantillas, entornoId) {
  if (!entornoId || entornoId === FILTRO_TODOS) return lista(plantillas);
  return lista(plantillas).filter((p) => {
    const r = planARutina(p);
    return r ? r.entornos.includes(entornoId) : false;
  });
}

export function ordenarPlantillas(plantillas, orden = ORDEN_POR_DEFECTO) {
  const copia = [...lista(plantillas)];
  const cuando = (p) => texto(p?.editadoEn) || texto(p?.creadoEn) || '';
  const nombre = (p) => ranura(p?.nombre || '');
  switch (orden) {
    case 'antiguas': return copia.sort((a, b) => cuando(a).localeCompare(cuando(b)));
    case 'az': return copia.sort((a, b) => nombre(a).localeCompare(nombre(b)));
    case 'za': return copia.sort((a, b) => nombre(b).localeCompare(nombre(a)));
    default: return copia.sort((a, b) => cuando(b).localeCompare(cuando(a)));
  }
}

/** Lo que la pantalla pinta, con los tres aplicados en el orden que importa. */
export function plantillasVisibles(plantillas, { consulta = '', entorno = FILTRO_TODOS, orden = ORDEN_POR_DEFECTO } = {}) {
  return ordenarPlantillas(filtrarPlantillas(buscarPlantillas(plantillas, consulta), entorno), orden);
}

/* Apartado 16: el filtro trabaja *"sobre los datos reales"*, así que cada
   pastilla puede decir cuántas quedarían — y la que dejaría cero se apaga, como
   en el catálogo de la F2. */
export function contarPorEntorno(plantillas) {
  const cuenta = { [FILTRO_TODOS]: lista(plantillas).length };
  for (const e of ENTORNOS) cuenta[e.id] = filtrarPlantillas(plantillas, e.id).length;
  return cuenta;
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · DUPLICAR (apartado 7)
   ═══════════════════════════════════════════════════════════════════════════

   *"La copia debe tener un nuevo ID […] Pero cualquier modificación posterior de
   la copia NO debe modificar la original. Esto debe comprobarse explícitamente."*

   🚨 **Y el id nuevo no basta: las LÍNEAS también necesitan el suyo.** Con las
   líneas compartiendo id, editar una serie en la copia editaría la del original
   —es el fallo que la F3 ya evitó al duplicar dentro de una rutina—. Como
   `crearRutina` construye cada línea con `crearLinea`, que llama a `uid()`, la
   copia sale independiente por construcción; hay una comprobación que lo mide
   línea a línea en vez de fiarse. */
export const SUFIJO_COPIA = 'Copia';

export function nombreDeCopia(nombre) {
  const base = texto(nombre) || 'Sin nombre';
  return `${base} — ${SUFIJO_COPIA}`;
}

export function duplicarPlantilla(plantillas, id, hoy = todayISO()) {
  const actuales = lista(plantillas);
  const original = plantillaPorId(actuales, id);
  if (!original) return { ok: false, plantillas: actuales, copia: null };
  const rutina = planARutina(original);
  /* Sin `id`, `crearRutina` pone uno nuevo — y `normalizarLinea` le da uno nuevo
     a cada línea, porque `crearLinea` llama a `uid()`. */
  /* 🚨 Cada línea estrena id. Sin esto `normalizarLinea` las descartaría —exige
     un id— y la copia saldría **vacía**; y con el id del original, editar una
     serie en la copia editaría la del original. */
  const copiaRutina = crearRutina({
    nombre: nombreDeCopia(rutina.nombre),
    descripcion: rutina.descripcion,
    entornos: rutina.entornos,
    lineas: rutina.lineas.map((l) => ({ ...l, id: uid() })),
    bloques: rutina.bloques,
    meta: rutina.meta,
  });
  const copia = { ...rutinaAPlan(copiaRutina), creadoEn: hoy, editadoEn: hoy };
  const i = actuales.findIndex((p) => p.id === original.id);
  const siguientes = [...actuales];
  siguientes.splice(i + 1, 0, copia);
  return { ok: true, plantillas: siguientes, copia };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · ELIMINAR (apartado 8)
   ═══════════════════════════════════════════════════════════════════════════

   El patrón `aplicarPlan` del proyecto, que ya va por más de veinte: **sin
   `confirmado` no toca nada**. Y quien borra de verdad es `App.jsx` con
   `eliminarConPapelera`, la única puerta (ME F3). */
export function planEliminarPlantilla(plantillas, id, { confirmado = false } = {}) {
  const actuales = lista(plantillas);
  const plan = plantillaPorId(actuales, id);
  if (!plan) return { ok: false, motivo: 'Esa plantilla ya no está.', aviso: null, plantillas: actuales };
  const aviso = avisoDeEliminar(plan);
  if (!confirmado) return { ok: false, motivo: 'confirmacion', aviso, plantillas: actuales };
  return { ok: true, motivo: null, aviso, plantillas: actuales.filter((p) => p.id !== plan.id) };
}

/* ⚠️ El aviso dice **lo que se lleva** y **que vuelve**: la plantilla va a
   Eliminados recientes (EH F45), así que prometer que no se puede deshacer sería
   mentir en pantalla (E3 F26). */
export function avisoDeEliminar(plan) {
  const rutina = planARutina(plan);
  const cuantos = rutina ? rutina.lineas.length : 0;
  return {
    titulo: '¿Eliminar esta plantilla?',
    que: cuantos === 0
      ? `«${texto(plan?.nombre) || 'Sin nombre'}» dejará de estar en Tus plantillas.`
      : `«${texto(plan?.nombre) || 'Sin nombre'}» dejará de estar en Tus plantillas, con sus ${cuantos} ${cuantos === 1 ? 'ejercicio' : 'ejercicios'}.`,
    vuelve: 'Se queda en Eliminados recientes por si te arrepientes.',
    cancelar: 'Cancelar',
    eliminar: 'Eliminar',
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · EL ESTADO VACÍO Y LO QUE NO SE PINTA
   ═══════════════════════════════════════════════════════════════════════════ */

/* Apartado 13, con sus palabras. ⚠️ Y **con salida**: un vacío sin botón es una
   pantalla rota (EH F41), y aquí el botón lleva al constructor que ya existe. */
export const ESTADO_VACIO_PLANTILLAS = {
  titulo: 'Aún no tienes plantillas',
  texto: 'Construye tu primera rutina y aparecerá aquí.',
  accion: 'Crear entrenamiento',
};

export const SIN_OBJETIVO = {
  que: 'El «objetivo» de una plantilla',
  loPide: 'Los apartados 3 y 9 lo enseñan en la tarjeta y en el detalle.',
  porque: 'El apartado 6 enumera TODO lo que se puede editar de una plantilla —nombre, descripción, entorno, ejercicios, orden, series, repeticiones, rangos, duración isométrica, peso, descanso y notas— y el objetivo no está. Un campo que nadie puede rellenar es media función (regla 8).',
};

export const NO_EN_FIT4 = [
  { que: 'La biblioteca de planes prediseñados', porque: 'El contexto lo excluye expresamente. Es la FIT F5, y por eso `fitness.planes` sigue vacía.' },
  { que: 'El entrenamiento en vivo', porque: 'El contexto lo excluye. Es la FIT F7.' },
  { que: 'El botón «Empezar entrenamiento»', porque: 'Apartado 19: *"Si esto genera una acción muerta, es preferible NO mostrar todavía el botón"*. Sin motor, sería exactamente eso.' },
  { que: 'El historial avanzado', porque: 'El contexto lo excluye. Es la FIT F10.' },
  { que: 'Rangos y Progreso', porque: 'El contexto los excluye. Son las FIT F15 y siguientes.' },
  { que: 'La IA', porque: 'El contexto la excluye, y la regla 7 exige que nunca se dispare sola.' },
  { que: 'Un modelo `UserTemplate` nuevo', porque: 'Apartado 2: ya existe y es `fitness.plantillas`, de la F1. Uno nuevo dejaría lo suyo invisible.' },
  { que: 'Un segundo constructor', porque: 'Apartado 23: la integración es bidireccional con el de la F3, por `planARutina` y `rutinaAPlan`.' },
];
