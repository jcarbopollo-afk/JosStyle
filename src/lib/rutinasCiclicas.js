import { uid, todayISO, fechaValida, addDays } from './helpers';
import {
  normalizarRutinaCiclica, normalizarRetiradas, normalizarWorkoutExercise,
  DURACION_RUTINA, TIPOS_DIA_RUTINA,
} from './fitness';
import { diaDeFecha } from './horario';
import { diasEntre } from './hoy';
import {
  CATALOGO_PLANES, idPlantillaDeDia, planActivoDe, usarPlan, quitarPlanActivo,
  estructuraDelPlan, conElTramoCerrado, crearPlanActivo,
} from './planes';
import { nombreDeCopia, duplicarPlantilla } from './plantillas';

/* ═══════════════════════════════════════════════════════════════════════════
   FITNESS 3/8 — LAS RUTINAS CÍCLICAS Y LA BIBLIOTECA DE PLANTILLAS
   ═══════════════════════════════════════════════════════════════════════════

   El diseño está en `docs/15_FITNESS/ARQUITECTURA_TECNICA.md` (§5–§7 y §10). Lo
   esencial, para quien abra este archivo:

   - **Rutina** = un ciclo de 1 a 30 días; cada día es de entrenamiento (con UNA
     plantilla, que puede repetirse en otros días) o de descanso. Al acabar el
     último día vuelve al primero. Guarda **ids de plantilla**, nunca ejercicios.
   - **Lo predeterminado vive en el código**: las 17 rutinas son los planes de
     `catalogoPlanes.js` con sus mismos ids, y sus 63 días de entrenamiento son
     plantillas predeterminadas (`<id del día>-plantilla`). Se leen de ahí.
   - **Copia al escribir** (AT-03): editar o borrar una predeterminada guarda una
     copia **con el mismo id** en `fitness.rutinas` / `fitness.plantillas`, y la
     copia gana a la del código. Borrarla apunta su id en
     `predeterminadasRetiradas`, para que no vuelva cuando la papelera la purgue.
   - **Nada de lo que se puede calcular se guarda** (AT-04): qué plantilla está en
     uso y dónde, el día del ciclo, la duración (es el número de días).
   - **No escribe**: devuelve el `fitness` siguiente y `App.jsx` lo guarda (regla 5:
     siempre el objeto entero). Y nada sin `confirmado` cuando hay algo que perder.

   🚨 **Lo de hoy sigue funcionando igual**: un predeterminado sin tocar se ve, se
   activa y se entrena exactamente como antes (los mismos días, los mismos nombres,
   las mismas líneas), y sus semanas se siguen leyendo por día de la semana. */

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const lista = (v) => (Array.isArray(v) ? v : []);
const objeto = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

export { DURACION_RUTINA, TIPOS_DIA_RUTINA };

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LO PREDETERMINADO (del código)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Una plantilla predeterminada: el día de entrenamiento de un plan del catálogo,
 *  con la forma de una plantilla suya (`crearWorkoutPlan`) para que la biblioteca,
 *  el constructor y el entrenamiento la traten igual. ⚠️ Su nombre es el del día
 *  («Push»): así Tu Plan dice lo mismo que antes; la biblioteca añade de qué
 *  rutina viene (`meta.origenPlan`). */
function plantillaDeDia(plan, dia) {
  return {
    id: idPlantillaDeDia(dia.id),
    nombre: texto(dia.nombre) || 'Entrenamiento',
    descripcion: '',
    entorno: texto(plan.entorno),
    frecuencia: null,
    duracion: null,
    thumbnail: '',
    ejercicios: lista(dia.lineas).map(normalizarWorkoutExercise).filter(Boolean),
    meta: {
      origen: 'predeterminada', origenPlan: plan.id, origenDia: dia.id,
      entornos: plan.entorno ? [plan.entorno] : [], bloques: [],
    },
    creadoEn: '',
    editadoEn: '',
  };
}

/** Una rutina predeterminada: el plan del catálogo con sus ids, y cada día
 *  apuntando a su plantilla predeterminada. Los datos de la tarjeta (entorno,
 *  objetivo, nivel…) van en `meta`, que es donde los lee la biblioteca. */
function rutinaDePlan(plan) {
  return {
    id: plan.id,
    nombre: plan.nombre,
    descripcion: texto(plan.descripcion),
    origen: 'predeterminada',
    basePredeterminada: null,
    dias: lista(plan.dias).map((d) => (d.descanso
      ? { id: d.id, tipo: 'descanso', plantillaId: null, ...(texto(d.nombre) ? { nombre: texto(d.nombre) } : {}) }
      : { id: d.id, tipo: 'entreno', plantillaId: idPlantillaDeDia(d.id) })),
    meta: {
      subtitulo: texto(plan.subtitulo), entorno: texto(plan.entorno), objetivo: texto(plan.objetivo),
      dificultad: texto(plan.dificultad), paraQuien: texto(plan.paraQuien), tags: lista(plan.tags),
    },
    creadoEn: '',
    editadoEn: '',
  };
}

/* Se calculan una vez por catálogo: son datos del código y no cambian. */
const cachePredeterminadas = new WeakMap();
function predeterminadasDe(planes = CATALOGO_PLANES) {
  const clave = lista(planes);
  if (!cachePredeterminadas.has(clave)) {
    const rutinas = clave.map(rutinaDePlan);
    const plantillas = clave.flatMap((p) => lista(p.dias).filter((d) => !d.descanso).map((d) => plantillaDeDia(p, d)));
    cachePredeterminadas.set(clave, { rutinas, plantillas });
  }
  return cachePredeterminadas.get(clave);
}

export const rutinasPredeterminadas = (planes = CATALOGO_PLANES) => predeterminadasDe(planes).rutinas;
export const plantillasPredeterminadas = (planes = CATALOGO_PLANES) => predeterminadasDe(planes).plantillas;
export const esRutinaPredeterminada = (id, planes = CATALOGO_PLANES) => rutinasPredeterminadas(planes).some((r) => r.id === id);
export const esPlantillaPredeterminada = (id, planes = CATALOGO_PLANES) => plantillasPredeterminadas(planes).some((p) => p.id === id);

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LO QUE HAY (lo suyo + lo predeterminado que no ha copiado ni borrado)
   ═══════════════════════════════════════════════════════════════════════════ */

export const retiradasDe = (fitness) => normalizarRetiradas(objeto(fitness).predeterminadasRetiradas);

/** Una lista de lo guardado más lo del código, sin repetir id: la copia guardada
 *  gana, y lo retirado sin copia no se enseña. */
function mezclar(guardadas, delCodigo, retiradas) {
  const ids = new Set(guardadas.map((x) => x.id));
  return [...guardadas, ...delCodigo.filter((x) => !ids.has(x.id) && !retiradas.includes(x.id))];
}

/** Todas las rutinas de su biblioteca. ⚠️ Lo guardado pasa por el normalizador:
 *  una rutina mal formada no llega aquí (se aparta en la cuarentena al cargar). */
export function rutinasDisponibles(fitness, planes = CATALOGO_PLANES) {
  const guardadas = lista(objeto(fitness).rutinas).map(normalizarRutinaCiclica).filter(Boolean);
  return mezclar(guardadas, rutinasPredeterminadas(planes), retiradasDe(fitness).rutinas);
}

export const rutinaDisponible = (fitness, id, planes = CATALOGO_PLANES) =>
  rutinasDisponibles(fitness, planes).find((r) => r.id === texto(id)) || null;

/** Todas las plantillas: las suyas (y las copias de predeterminadas) y las
 *  predeterminadas sin tocar. Cada una dice si es predeterminada. */
export function plantillasDisponibles(fitness, planes = CATALOGO_PLANES) {
  const guardadas = lista(objeto(fitness).plantillas).filter((p) => p && texto(p.id));
  return mezclar(guardadas, plantillasPredeterminadas(planes), retiradasDe(fitness).plantillas);
}

export const plantillaDisponible = (fitness, id, planes = CATALOGO_PLANES) =>
  plantillasDisponibles(fitness, planes).find((p) => p.id === texto(id)) || null;

/** Si una plantilla es predeterminada (la del código o su copia guardada). */
export const plantillaEsPredeterminada = (plantilla, planes = CATALOGO_PLANES) =>
  !!plantilla && (objeto(plantilla.meta).origen === 'predeterminada' || esPlantillaPredeterminada(plantilla.id, planes));

/* ═══════════════════════════════════════════════════════════════════════════
   3 · EN USO (derivado, nunca guardado)
   ═══════════════════════════════════════════════════════════════════════════ */

/** En qué rutinas y días se usa una plantilla. `activa` marca la rutina activa
 *  (prompt 3 §8: distinguir la activa de las demás guardadas). */
export function usoDePlantilla(fitness, plantillaId, planes = CATALOGO_PLANES) {
  const id = texto(plantillaId);
  const activoId = planActivoDe(fitness)?.planId || '';
  const usos = [];
  for (const r of rutinasDisponibles(fitness, planes)) {
    const dias = r.dias.map((d, i) => ({ ...d, numero: i + 1 })).filter((d) => d.tipo === 'entreno' && d.plantillaId === id);
    if (dias.length) usos.push({ rutinaId: r.id, rutinaNombre: r.nombre, activa: r.id === activoId, dias: dias.map((d) => d.numero) });
  }
  return {
    usos,
    enActiva: usos.some((u) => u.activa),
    enOtras: usos.some((u) => !u.activa),
    libre: usos.length === 0,
  };
}

/** Lo que dice la marca discreta de una tarjeta (`null` si no está asignada). */
export function marcaDeUso(uso) {
  if (!uso || uso.libre) return null;
  if (uso.enActiva) return { id: 'activa', texto: 'En tu rutina activa' };
  return { id: 'otras', texto: uso.usos.length === 1 ? 'En 1 rutina' : `En ${uso.usos.length} rutinas` };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · CREAR, CONFIGURAR Y VALIDAR UNA RUTINA
   ═══════════════════════════════════════════════════════════════════════════ */

export const diaSinConfigurar = () => ({ id: uid(), tipo: null, plantillaId: null });

/** Un borrador: N días **sin asignar** (prompt 3 §4: *"Cada día comenzará sin
 *  asignación"* y *"No se deben crear días automáticamente como descanso"*). */
export function crearRutinaCiclica({ nombre = '', duracion = 7 } = {}) {
  const n = Math.max(DURACION_RUTINA.min, Math.min(DURACION_RUTINA.max, Number.isInteger(duracion) ? duracion : 7));
  return {
    id: uid(), nombre: texto(nombre), descripcion: '', origen: 'propia', basePredeterminada: null,
    dias: Array.from({ length: n }, diaSinConfigurar), meta: {}, creadoEn: '', editadoEn: '',
  };
}

/** Si una duración vale (un entero de 1 a 30). */
export const duracionValida = (n) => Number.isInteger(n) && n >= DURACION_RUTINA.min && n <= DURACION_RUTINA.max;

/** Cambiar el número de días. Crecer añade días **sin configurar** al final;
 *  encoger quita los últimos y dice cuáles estaban configurados, para que la
 *  pantalla lo pregunte antes (`quitados`). Una duración fuera de 1–30 no cambia
 *  nada y lo dice. */
export function cambiarDuracion(rutina, n) {
  const r = objeto(rutina);
  const dias = lista(r.dias);
  if (!duracionValida(n)) {
    return { ok: false, motivo: `Una rutina tiene entre ${DURACION_RUTINA.min} y ${DURACION_RUTINA.max} días.`, rutina: r, quitados: [] };
  }
  if (n >= dias.length) {
    return { ok: true, motivo: null, rutina: { ...r, dias: [...dias, ...Array.from({ length: n - dias.length }, diaSinConfigurar)] }, quitados: [] };
  }
  const quitados = dias.slice(n).map((d, i) => ({ ...d, numero: n + i + 1 })).filter((d) => d.tipo);
  return { ok: true, motivo: null, rutina: { ...r, dias: dias.slice(0, n) }, quitados };
}

/** Configurar un día: entrenamiento con una plantilla, o descanso. ⚠️ Un día tiene
 *  **una** plantilla (prompt 3 §5): asignar otra la sustituye. */
export function configurarDia(rutina, diaId, { tipo, plantillaId = null } = {}) {
  const r = objeto(rutina);
  if (!TIPOS_DIA_RUTINA.includes(tipo)) return r;
  if (tipo === 'entreno' && !texto(plantillaId)) return r;
  return {
    ...r,
    dias: lista(r.dias).map((d) => (d.id === diaId
      ? { id: d.id, tipo, plantillaId: tipo === 'entreno' ? texto(plantillaId) : null }
      : d)),
  };
}

/** Qué impide guardarla, en palabras (nunca un botón apagado, EH F62). */
export function validarRutinaCiclica(rutina, fitness, planes = CATALOGO_PLANES) {
  const r = objeto(rutina);
  const dias = lista(r.dias);
  const problemas = [];
  if (!texto(r.nombre)) problemas.push({ id: 'nombre', que: 'Ponle un nombre a la rutina.' });
  if (!duracionValida(dias.length)) {
    problemas.push({ id: 'duracion', que: `Una rutina tiene entre ${DURACION_RUTINA.min} y ${DURACION_RUTINA.max} días.` });
  }
  const sin = dias.map((d, i) => (d && d.tipo ? null : i + 1)).filter(Boolean);
  if (sin.length) {
    problemas.push({
      id: 'sin_configurar', dias: sin,
      que: sin.length === 1
        ? `Falta decidir el día ${sin[0]}: entrenamiento o descanso.`
        : `Faltan por decidir ${sin.length} días (${sin.join(', ')}): entrenamiento o descanso.`,
    });
  }
  const huerfanos = dias.map((d, i) => (d && d.tipo === 'entreno' && !plantillaDisponible(fitness, d.plantillaId, planes) ? i + 1 : null)).filter(Boolean);
  if (huerfanos.length) {
    problemas.push({
      id: 'sin_plantilla', dias: huerfanos,
      que: huerfanos.length === 1
        ? `El día ${huerfanos[0]} tiene una plantilla que ya no está: elige otra o márcalo como descanso.`
        : `Los días ${huerfanos.join(', ')} tienen una plantilla que ya no está: elige otra o márcalos como descanso.`,
    });
  }
  return { ok: problemas.length === 0, problemas };
}

/** Si se puede activar: válida y con al menos un día de entrenamiento (una
 *  rutina solo de descanso no tendría nada que empezar en Tu Plan). */
export function puedeActivarse(rutina, fitness, planes = CATALOGO_PLANES) {
  const v = validarRutinaCiclica(rutina, fitness, planes);
  if (!v.ok) return { ok: false, motivo: v.problemas[0].que };
  if (!lista(rutina.dias).some((d) => d.tipo === 'entreno')) {
    return { ok: false, motivo: 'Esta rutina solo tiene días de descanso: asígnale al menos un entrenamiento.' };
  }
  return { ok: true, motivo: null };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · EL CICLO (ARQUITECTURA_TECNICA.md §7)
   ═══════════════════════════════════════════════════════════════════════════ */

/** La posición (0…N−1) de una fecha en un ciclo de N días que empieza en `inicio`.
 *  `null` antes del inicio: el ciclo nunca se proyecta hacia atrás. */
export function posicionEnCiclo(n, inicio, fecha) {
  if (!Number.isInteger(n) || n < 1 || !fechaValida(inicio) || !fechaValida(fecha)) return null;
  const d = diasEntre(inicio, fecha);
  if (d < 0) return null;
  return d % n;
}

const lunesDe = (fecha) => {
  const d = diaDeFecha(fecha);
  return d ? addDays(fecha, -(d - 1)) : '';
};

/** El día 1 del ciclo de la activación que hay: el guardado; si no lo tiene, la
 *  regla de siempre —siete días = semana de lunes a domingo; si no, desde que se
 *  activó—, que es la que la migración de la fase 4 dejará escrita (§7.6). */
export function inicioDelCiclo(activo, n, hoy = todayISO()) {
  const a = objeto(activo);
  if (fechaValida(a.inicioCiclo)) return a.inicioCiclo;
  const desde = fechaValida(a.desde) ? a.desde : hoy;
  return n === 7 && a.origen !== 'rutina' ? lunesDe(desde) : desde;
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · DE RUTINA A «PLAN» (lo que leen Tu Plan, la semana y el entrenamiento)
   ═══════════════════════════════════════════════════════════════════════════
   Tu Plan, la semana, la actividad y «Empezar» leen un plan con `dias[]` y sus
   líneas (FIT F6). Una rutina se les da **con esa forma**, en el momento: así no
   hay que tocar ninguna pantalla y editar una plantilla cambia lo que toca hoy
   sin guardar nada más. Un predeterminado sin tocar sale idéntico al de antes. */

export function rutinaComoPlan(fitness, rutina, planes = CATALOGO_PLANES) {
  const r = rutina ? normalizarRutinaCiclica(rutina) || rutina : null;
  if (!r || !texto(r.id)) return null;
  const m = objeto(r.meta);
  const dias = lista(r.dias).map((d) => {
    if (d.tipo !== 'entreno') {
      return { id: d.id, nombre: texto(d.nombre) || 'Descanso', descanso: true, lineas: [], plantillaId: null };
    }
    const pl = plantillaDisponible(fitness, d.plantillaId, planes);
    return pl
      ? { id: d.id, nombre: texto(pl.nombre) || 'Entrenamiento', descanso: false, lineas: lista(pl.ejercicios), plantillaId: pl.id }
      /* Una plantilla que ya no está no deja el día en blanco: se dice. */
      : { id: d.id, nombre: 'Plantilla eliminada', descanso: false, lineas: [], plantillaId: d.plantillaId, sinPlantilla: true };
  });
  return {
    id: r.id,
    nombre: r.nombre,
    subtitulo: texto(m.subtitulo) || (r.origen === 'propia' ? 'Una rutina tuya' : ''),
    descripcion: r.descripcion,
    entorno: texto(m.entorno),
    objetivo: texto(m.objetivo),
    dificultad: texto(m.dificultad),
    frecuencia: dias.filter((d) => !d.descanso).length,
    paraQuien: texto(m.paraQuien),
    tags: lista(m.tags),
    thumbnail: null,
    propia: r.origen === 'propia',
    rutina: true,
    dias,
  };
}

/** La estructura de una rutina para cerrar su tramo (con la plantilla de cada día). */
export const estructuraDeRutina = (fitness, rutina, planes = CATALOGO_PLANES) =>
  estructuraDelPlan(rutinaComoPlan(fitness, rutina, planes), 'rutina');

/** Cómo se guarda la activación de una rutina: las predeterminadas siguen siendo
 *  `'preset'` (así las lee igual una versión anterior de la aplicación) y las suyas
 *  son `'rutina'`. */
export const origenDeActivacion = (rutina) => (rutina && rutina.origen === 'predeterminada' ? 'preset' : 'rutina');

/** La rutina activa, si es una rutina (suya o predeterminada); `null` si no hay o
 *  si lo activo es una plantilla usada como plan (lo de antes, que sigue igual). */
export function rutinaActiva(fitness, planes = CATALOGO_PLANES) {
  const a = planActivoDe(fitness);
  if (!a || a.origen === 'plantilla') return null;
  return rutinaDisponible(fitness, a.planId, planes);
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · ACTIVAR, QUITAR Y EDITAR LA ACTIVA (prompt 3 §11 y ARQUITECTURA §7.3–7.5)
   ═══════════════════════════════════════════════════════════════════════════ */

/** La estructura de lo que está activo ahora, para cerrar su tramo sin perder el
 *  pasado: una rutina se resuelve aquí; lo demás (una plantilla como plan) lo
 *  resuelve `planes.js` como siempre (`null` = que lo resuelva él). */
function estructuraActiva(fitness, planes) {
  const r = rutinaActiva(fitness, planes);
  return r ? estructuraDeRutina(fitness, r, planes) : null;
}

/** Activar una rutina. Pasa por `usarPlan` (F5/F32): el mismo aviso si había otra,
 *  y el tramo de la anterior cerrado con su estructura. Una suya empieza **hoy por
 *  el día 1**; una predeterminada sigue la semana de lunes a domingo, como siempre. */
export function activarRutina(fitness, rutinaId, { confirmado = false, hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = objeto(fitness);
  const r = rutinaDisponible(f, rutinaId, planes);
  if (!r) return { ok: false, motivo: 'Esa rutina ya no está.', aviso: null, fitness: f };
  const puede = puedeActivarse(r, f, planes);
  if (!puede.ok) return { ok: false, motivo: puede.motivo, aviso: null, fitness: f };
  const origen = origenDeActivacion(r);
  const actualR = rutinaActiva(f, planes);
  const res = usarPlan(f, r.id, {
    confirmado, hoy, planes, origen,
    entidad: { id: r.id, nombre: r.nombre },
    actual: actualR ? { nombre: actualR.nombre } : null,
    estructuraActual: estructuraActiva(f, planes),
    inicioCiclo: origen === 'rutina' ? hoy : '',
  });
  return res;
}

/** Quitar la rutina activa, cerrando su tramo con su estructura de verdad. */
export function quitarRutinaActiva(fitness, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = objeto(fitness);
  return quitarPlanActivo(f, { hoy, planes, estructuraActual: estructuraActiva(f, planes) });
}

/** 🚨 Cambiar la estructura de la rutina activa sin reescribir el pasado (§7.5):
 *  se cierra un tramo con la estructura de antes y la activa sigue desde hoy con
 *  un día 1 que **conserva el día de hoy por su id**; si ese día ya no existe, hoy
 *  pasa a ser el día 1. Devuelve el `fitness` con la rutina ya guardada. */
function conLaActivaReanclada(fitness, rutinaNueva, { hoy, planes }) {
  const f = objeto(fitness);
  const a = planActivoDe(f);
  const antes = rutinaActiva(f, planes);
  if (!a || !antes || antes.id !== rutinaNueva.id) return null;
  const nAntes = antes.dias.length;
  const posHoy = posicionEnCiclo(nAntes, inicioDelCiclo(a, nAntes, hoy), hoy);
  const diaHoy = posHoy === null ? null : antes.dias[posHoy];
  const k = diaHoy ? rutinaNueva.dias.findIndex((d) => d.id === diaHoy.id) : -1;
  const inicioCiclo = k >= 0 ? addDays(hoy, -k) : hoy;
  const planesAnteriores = conElTramoCerrado(f, hoy, planes, estructuraDeRutina(f, antes, planes));
  /* El mismo día de la activación no hay tramo que cerrar: se reescribe la
     estructura sin crear uno de cero días (como ya hacía `conElTramoCerrado`). */
  return {
    planActivo: crearPlanActivo({ planId: a.planId, origen: a.origen, desde: a.desde < hoy ? hoy : a.desde, inicioCiclo }),
    planesAnteriores,
  };
}

/** Si cambiar la rutina activa a `nueva` cambia su estructura (días, orden o
 *  plantillas). El nombre o la descripción no la cambian. */
function cambiaLaEstructura(antes, nueva) {
  const firma = (r) => lista(r && r.dias).map((d) => `${d.id}:${d.tipo}:${d.plantillaId || ''}`).join('|');
  return firma(antes) !== firma(nueva);
}

/** Guardar una rutina (nueva o editada). Una predeterminada se guarda como copia
 *  con su mismo id (AT-03). Si es la activa y cambia su estructura, se cierra un
 *  tramo (§7.5). */
export function guardarRutinaCiclica(fitness, rutina, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = objeto(fitness);
  const v = validarRutinaCiclica(rutina, f, planes);
  if (!v.ok) return { ok: false, problemas: v.problemas, fitness: f, rutina: null };
  const r = objeto(rutina);
  const guardadas = lista(f.rutinas);
  const antes = guardadas.find((x) => x && x.id === r.id) || null;
  const predet = esRutinaPredeterminada(r.id, planes);
  const limpia = normalizarRutinaCiclica({
    ...r,
    nombre: texto(r.nombre),
    origen: predet ? 'predeterminada' : 'propia',
    creadoEn: (antes && antes.creadoEn) || texto(r.creadoEn) || hoy,
    editadoEn: hoy,
  });
  if (!limpia) return { ok: false, problemas: [{ id: 'forma', que: 'La rutina no tiene una forma válida.' }], fitness: f, rutina: null };
  const rutinas = antes ? guardadas.map((x) => (x && x.id === limpia.id ? limpia : x)) : [...guardadas, limpia];
  let siguiente = { ...f, rutinas };
  const activaAntes = rutinaActiva(f, planes);
  if (activaAntes && activaAntes.id === limpia.id && cambiaLaEstructura(activaAntes, limpia)) {
    const r2 = conLaActivaReanclada(f, limpia, { hoy, planes });
    if (r2) siguiente = { ...siguiente, ...r2 };
  }
  return { ok: true, problemas: [], fitness: siguiente, rutina: limpia };
}

/** Duplicar: ids nuevos para la rutina y para cada día; las plantillas son las
 *  mismas (una rutina las referencia, no las contiene). La copia siempre es suya. */
export function duplicarRutinaCiclica(fitness, rutinaId, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = objeto(fitness);
  const r = rutinaDisponible(f, rutinaId, planes);
  if (!r) return { ok: false, motivo: 'Esa rutina ya no está.', fitness: f, copia: null };
  const copia = normalizarRutinaCiclica({
    ...r,
    id: uid(),
    nombre: nombreDeCopia(r.nombre),
    origen: 'propia',
    basePredeterminada: r.origen === 'predeterminada' ? r.id : r.basePredeterminada,
    dias: r.dias.map((d) => ({ ...d, id: uid() })),
    creadoEn: hoy,
    editadoEn: hoy,
  });
  return { ok: true, motivo: null, fitness: { ...f, rutinas: [...lista(f.rutinas), copia] }, copia };
}

/** Lo que se abre en el editor: la rutina tal como está (una predeterminada, su
 *  copia de trabajo; se guarda con su mismo id). */
export function rutinaParaEditar(fitness, rutinaId, planes = CATALOGO_PLANES) {
  const r = rutinaDisponible(fitness, rutinaId, planes);
  return r ? { ...r, dias: r.dias.map((d) => ({ ...d })) } : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · ELIMINAR Y RECUPERAR (prompt 3 §9–§10; ARQUITECTURA §10)
   ═══════════════════════════════════════════════════════════════════════════
   Aquí se PREPARA el `fitness` que hace falta antes del borrado; quien manda el
   elemento a Eliminados recientemente es la papelera general (`papelera.js`),
   desde la puerta de Fitness de `App.jsx`. Así la retención, la restauración y el
   vaciado son los de toda la aplicación (D-05). */

const conCopiaGuardada = (lista0, entidad) => (lista0.some((x) => x && x.id === entidad.id) ? lista0 : [...lista0, entidad]);
const conRetirada = (retiradas, campo, id) => ({ ...retiradas, [campo]: [...new Set([...retiradas[campo], id])] });

/** Qué pasa si borra una rutina (para la confirmación). */
export function avisoDeEliminarRutina(fitness, rutinaId, planes = CATALOGO_PLANES) {
  const r = rutinaDisponible(fitness, rutinaId, planes);
  if (!r) return null;
  const activa = planActivoDe(fitness)?.planId === r.id;
  return {
    titulo: activa ? '¿Eliminar tu rutina activa?' : `¿Eliminar «${r.nombre}»?`,
    que: activa
      ? `«${r.nombre}» es tu rutina activa: dejará de estarlo y Tu Plan se quedará sin rutina hasta que actives otra.`
      : 'Dejará de aparecer en tu biblioteca de rutinas.',
    seQueda: 'Tus entrenamientos hechos y tus plantillas no se tocan.',
    vuelve: 'Podrás recuperarla desde Ajustes → Eliminados recientemente.',
    activa,
    confirmar: 'Eliminar rutina',
  };
}

/** Prepara el borrado de una rutina: si es predeterminada, guarda su copia y la
 *  retira (para que no vuelva del código); si es la activa, la desactiva cerrando
 *  su tramo. Después la papelera saca la copia de `fitness.rutinas`. */
export function prepararEliminarRutina(fitness, rutinaId, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = objeto(fitness);
  const r = rutinaDisponible(f, rutinaId, planes);
  if (!r) return { ok: false, fitness: f };
  let siguiente = { ...f, rutinas: conCopiaGuardada(lista(f.rutinas), r) };
  if (esRutinaPredeterminada(r.id, planes)) {
    siguiente = { ...siguiente, predeterminadasRetiradas: conRetirada(retiradasDe(f), 'rutinas', r.id) };
  }
  if (planActivoDe(f)?.planId === r.id) siguiente = quitarRutinaActiva(siguiente, { hoy, planes });
  return { ok: true, fitness: siguiente };
}

/** Qué pasa si borra una plantilla (para la confirmación específica del §9). */
export function avisoDeEliminarPlantillaEnUso(fitness, plantillaId, planes = CATALOGO_PLANES) {
  const pl = plantillaDisponible(fitness, plantillaId, planes);
  if (!pl) return null;
  const uso = usoDePlantilla(fitness, pl.id, planes);
  const activa = uso.usos.find((u) => u.activa) || null;
  const otras = uso.usos.filter((u) => !u.activa);
  const dias = activa ? activa.dias : [];
  return {
    titulo: `¿Eliminar «${pl.nombre}»?`,
    enActiva: !!activa,
    que: activa
      ? `Se usa en tu rutina activa («${activa.rutinaNombre}»): ${dias.length === 1 ? `el día ${dias[0]} pasará` : `los días ${dias.join(', ')} pasarán`} a ser de descanso.`
      : 'Dejará de aparecer en tu biblioteca de plantillas.',
    otras: otras.length
      ? `También está en ${otras.length === 1 ? `«${otras[0].rutinaNombre}»` : `${otras.length} rutinas guardadas`}: no se cambian, y hasta que la recuperes o les asignes otra no se podrán activar.`
      : '',
    seQueda: 'Los entrenamientos que ya hiciste con ella no se tocan.',
    vuelve: 'Podrás recuperarla desde Ajustes → Eliminados recientemente.',
    confirmar: activa ? 'Eliminar y pasar a descanso' : 'Eliminar',
  };
}

/** Prepara el borrado de una plantilla: copia guardada (si es predeterminada) y
 *  retirada; si la rutina activa la usa, sus días pasan a **descanso** (cerrando un
 *  tramo para que el pasado siga diciendo que eran de entreno) y la plantilla se
 *  lleva en `meta.huecos` dónde estaba, para ofrecer devolverla al recuperarla.
 *  ⚠️ Las rutinas que no están activas **no se tocan** (prompt 3 §9). */
export function prepararEliminarPlantilla(fitness, plantillaId, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = objeto(fitness);
  const pl = plantillaDisponible(f, plantillaId, planes);
  if (!pl) return { ok: false, fitness: f, huecos: [] };
  let siguiente = { ...f };
  let huecos = [];
  const activa = rutinaActiva(f, planes);
  if (activa && activa.dias.some((d) => d.tipo === 'entreno' && d.plantillaId === pl.id)) {
    huecos = activa.dias.filter((d) => d.tipo === 'entreno' && d.plantillaId === pl.id)
      .map((d) => ({ rutinaId: activa.id, diaId: d.id, desde: hoy }));
    const nueva = { ...activa, dias: activa.dias.map((d) => (d.tipo === 'entreno' && d.plantillaId === pl.id ? { id: d.id, tipo: 'descanso', plantillaId: null } : d)) };
    const limpia = normalizarRutinaCiclica({ ...nueva, origen: activa.origen, editadoEn: hoy, creadoEn: activa.creadoEn || hoy });
    const rutinas = lista(f.rutinas);
    siguiente.rutinas = rutinas.some((x) => x && x.id === limpia.id)
      ? rutinas.map((x) => (x && x.id === limpia.id ? limpia : x)) : [...rutinas, limpia];
    const r2 = conLaActivaReanclada(f, limpia, { hoy, planes });
    if (r2) siguiente = { ...siguiente, ...r2 };
  }
  const conHuecos = { ...pl, meta: { ...objeto(pl.meta), ...(huecos.length ? { huecos } : {}) } };
  const plantillas = lista(f.plantillas);
  siguiente.plantillas = plantillas.some((x) => x && x.id === pl.id)
    ? plantillas.map((x) => (x && x.id === pl.id ? conHuecos : x)) : [...plantillas, conHuecos];
  if (esPlantillaPredeterminada(pl.id, planes)) {
    siguiente.predeterminadasRetiradas = conRetirada(retiradasDe(f), 'plantillas', pl.id);
  }
  return { ok: true, fitness: siguiente, huecos };
}

/** Los huecos a los que se puede devolver una plantilla recuperada: la rutina
 *  sigue existiendo y ese día **sigue siendo de descanso** (si ya tiene otra
 *  plantilla, no se pisa: prompt 3 §10). */
export function huecosRecuperables(fitness, plantilla, planes = CATALOGO_PLANES) {
  const pl = plantilla && typeof plantilla === 'object' ? plantilla : null;
  if (!pl) return [];
  return lista(objeto(pl.meta).huecos).map((h) => {
    const r = rutinaDisponible(fitness, h && h.rutinaId, planes);
    const i = r ? r.dias.findIndex((d) => d.id === (h && h.diaId)) : -1;
    if (!r || i < 0 || r.dias[i].tipo !== 'descanso') return null;
    return { rutinaId: r.id, rutinaNombre: r.nombre, diaId: r.dias[i].id, numero: i + 1 };
  }).filter(Boolean);
}

/** Lo que se le dice al recuperar una plantilla con huecos (`null` si no hay). */
export function avisoDeHuecos(fitness, plantilla, planes = CATALOGO_PLANES) {
  const h = huecosRecuperables(fitness, plantilla, planes);
  if (!h.length) return null;
  const r = h[0].rutinaNombre;
  const dias = h.map((x) => x.numero);
  return {
    texto: `Antes estaba en «${r}» (${dias.length === 1 ? `día ${dias[0]}` : `días ${dias.join(', ')}`}), que ahora ${dias.length === 1 ? 'es' : 'son'} de descanso.`,
    confirmar: 'Volver a ponerla',
    olvidar: 'Dejarlo como está',
  };
}

/** Quitar la marca de huecos de una plantilla (después de devolverla o de que él
 *  diga que lo deja como está). */
function sinHuecos(f, plantillaId) {
  return {
    ...f,
    plantillas: lista(f.plantillas).map((p) => {
      if (!p || p.id !== plantillaId) return p;
      const { huecos, ...meta } = objeto(p.meta);
      return { ...p, meta };
    }),
  };
}

export const olvidarHuecos = (fitness, plantillaId) => sinHuecos(objeto(fitness), plantillaId);

/** Devolver una plantilla recuperada a sus días, solo donde siga habiendo un
 *  descanso. Si la rutina es la activa, cambiar su estructura cierra un tramo. */
export function devolverAHuecos(fitness, plantillaId, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = objeto(fitness);
  const pl = plantillaDisponible(f, plantillaId, planes);
  const huecos = huecosRecuperables(f, pl, planes);
  if (!pl || !huecos.length) return { ok: false, fitness: f };
  let siguiente = f;
  for (const rutinaId of [...new Set(huecos.map((h) => h.rutinaId))]) {
    const r = rutinaDisponible(siguiente, rutinaId, planes);
    const ids = new Set(huecos.filter((h) => h.rutinaId === rutinaId).map((h) => h.diaId));
    const nueva = { ...r, dias: r.dias.map((d) => (ids.has(d.id) ? { id: d.id, tipo: 'entreno', plantillaId: pl.id } : d)) };
    const g = guardarRutinaCiclica(siguiente, nueva, { hoy, planes });
    if (g.ok) siguiente = g.fitness;
  }
  return { ok: true, fitness: sinHuecos(siguiente, pl.id) };
}

/** Duplicar una plantilla cualquiera, también una predeterminada. Reutiliza
 *  `duplicarPlantilla` (FIT F4: ids nuevos para la plantilla y cada línea, la
 *  configuración de cada línea copiada). ⚠️ Solo se guarda **la copia**: pasarle la
 *  biblioteca entera guardaría las 63 predeterminadas de golpe. La copia es suya
 *  (`meta.origen: 'propia'`) y no hereda los huecos de la original. */
export function duplicarPlantillaDisponible(fitness, plantillaId, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const f = objeto(fitness);
  const pl = plantillaDisponible(f, plantillaId, planes);
  if (!pl) return { ok: false, fitness: f, copia: null };
  const guardadas = lista(f.plantillas);
  const base = guardadas.some((x) => x && x.id === pl.id) ? guardadas : [...guardadas, pl];
  const r = duplicarPlantilla(base, pl.id, hoy);
  if (!r.ok || !r.copia) return { ok: false, fitness: f, copia: null };
  const { huecos, ...metaSinHuecos } = objeto(r.copia.meta);
  const copia = { ...r.copia, meta: { ...metaSinHuecos, origen: 'propia' } };
  const plantillas = r.plantillas
    .filter((x) => x && (guardadas.some((g) => g && g.id === x.id) || x.id === copia.id))
    .map((x) => (x.id === copia.id ? copia : x));
  return { ok: true, fitness: { ...f, plantillas }, copia };
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · LA FICHA DE UNA RUTINA (para la biblioteca)
   ═══════════════════════════════════════════════════════════════════════════ */

export function fichaDeRutina(fitness, rutina, planes = CATALOGO_PLANES) {
  const r = rutina;
  if (!r) return null;
  const entreno = r.dias.filter((d) => d.tipo === 'entreno').length;
  const activo = planActivoDe(fitness);
  const valida = puedeActivarse(r, fitness, planes);
  return {
    id: r.id,
    nombre: r.nombre,
    predeterminada: r.origen === 'predeterminada',
    duracion: r.dias.length,
    entreno,
    descanso: r.dias.length - entreno,
    texto: `${r.dias.length === 1 ? '1 día' : `${r.dias.length} días`} · ${entreno === 1 ? '1 de entrenamiento' : `${entreno} de entrenamiento`}`,
    activa: !!activo && activo.planId === r.id,
    activable: valida.ok,
    motivo: valida.ok ? '' : valida.motivo,
  };
}

/** Sus rutinas (las que ha creado o duplicado), de la más reciente a la más antigua.
 *  Las copias de predeterminadas editadas siguen en la sección de predeterminadas. */
export function rutinasPropias(fitness, planes = CATALOGO_PLANES) {
  return rutinasDisponibles(fitness, planes).filter((r) => r.origen === 'propia')
    .sort((a, b) => (b.editadoEn || '').localeCompare(a.editadoEn || ''));
}

/* Lo que una rutina explica en la pantalla (prompt 3 §12). */
export const EXPLICACIONES_RUTINA = Object.freeze({
  rutina: 'Una rutina es un ciclo de días que se repite: al acabar el último, vuelve al primero.',
  dia: 'Cada día es de entrenamiento —con una de tus plantillas— o de descanso.',
  plantilla: 'Una plantilla es un entrenamiento: sus ejercicios y sus series. Puedes usar la misma en varios días.',
  descanso: 'Un día de descanso no tiene entrenamiento: descansar también es parte de la rutina.',
  enUso: 'Una plantilla «en uso» está asignada a algún día de una rutina.',
});

/** De dónde viene una plantilla predeterminada, para distinguir los varios «Push»
 *  de la biblioteca («de PPL Estético»). `''` en una suya. */
export function origenDePlantilla(plantilla, planes = CATALOGO_PLANES) {
  const m = objeto(plantilla && plantilla.meta);
  if (m.origen !== 'predeterminada' && !esPlantillaPredeterminada(plantilla && plantilla.id, planes)) return '';
  const plan = lista(planes).find((p) => p.id === m.origenPlan);
  return plan ? `de ${plan.nombre}` : 'predeterminada';
}

/** Lo que dice cada día en el editor y en la ficha: «Push», «Descanso» o «Sin decidir». */
export function textoDeDia(fitness, dia, planes = CATALOGO_PLANES) {
  if (!dia || !dia.tipo) return 'Sin decidir';
  if (dia.tipo === 'descanso') return texto(dia.nombre) || 'Descanso';
  const pl = plantillaDisponible(fitness, dia.plantillaId, planes);
  return pl ? (texto(pl.nombre) || 'Entrenamiento') : 'Plantilla eliminada';
}

/** Las predeterminadas que se enseñan en la biblioteca, con la forma de un plan
 *  (la que ya pinta `BibliotecaPlanesView`): sin las que borró, y las que editó en
 *  su versión editada. ⚠️ Una sin tocar es **el mismo objeto del catálogo**. */
export function planesPredeterminadosVisibles(fitness, planes = CATALOGO_PLANES) {
  const guardadas = new Set(lista(objeto(fitness).rutinas).map((r) => r && r.id));
  return rutinasDisponibles(fitness, planes).filter((r) => r.origen === 'predeterminada').map((r) => (
    guardadas.has(r.id) ? rutinaComoPlan(fitness, r, planes) : lista(planes).find((p) => p.id === r.id)
  )).filter(Boolean);
}
