/* ===========================================================================
   ENTREGA 4 · FASE 26/45 — EL PROGRESO FÍSICO EN FOTOS

   🚨 **LAS FOTOS DE PROGRESO YA EXISTEN, Y ESTO NO CREA UNA SEGUNDA LISTA.**
   Son **`saludFotos`** desde la Fase 3: la sube `uploadProgressPhoto()`, el
   archivo vive en el bucket privado **`progreso`**, se firma con
   `getSignedPhotoUrl()` y se borra con `deleteProgressPhoto()`. Está declarado
   en `MAPEO_EXISTENTE` (`fitness.js`) desde la FIT F1. Una lista nueva habría
   dejado **las fotos que Josué ya tiene invisibles en la pantalla que se llama
   Progreso**, que es la lección más repetida de este proyecto.

   🔓 **Y LA FIT F12 DEJÓ LA PESTAÑA ESPERANDO A ESTA FASE**, con esas palabras:
   *"la F12 pide dejar la estructura lista para el sistema de fotos sin
   construirlo"*. Es la F4 y la F6 con «Empezar entrenamiento» otra vez: era una
   espera, no una exclusión.

   🚨 **Y NO HACE FALTA NINGÚN SQL DE JOSUÉ** (a diferencia del `media` de la
   FIT F8, que pedía un sexto bucket que no existía): `progreso` está creado y
   se usa todos los días.
   =========================================================================== */

import { fechaLocalISO, todayISO, uid } from './helpers.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ═══════════════════════════════════════════════════════════════════════════
   1 · EL MODELO (apartados 2, 3 y 21)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * 🚨 **EL APARTADO 2 ENUMERA NUEVE CAMPOS Y TRES YA EXISTÍAN CON OTRO NOMBRE.**
 * El enunciado propone `imageReference`, `photoDate` y `note`; lo guardado desde
 * la Fase 3 es `path`, `fecha` y `nota`, y **ésos los leen `deleteFoto(id, path)`
 * en `App.jsx`, `getSignedPhotoUrl(f.path)` y el bloque de Salud**. Renombrarlos
 * habría roto las tres cosas para no ganar nada: el apartado dice *"utilizar o
 * adaptar"*, y adaptarlo es conservar los nombres que ya funcionan.
 *
 * Lo que sí es nuevo: `createdAt`, `tags`, `createdFromWorkoutId`, `visibility`
 * y `actualizadaEn`.
 */
export const CAMPOS_QUE_YA_EXISTIAN = [
  { pide: 'imageReference', es: 'path', porque: 'Lo leen `deleteFoto(id, path)`, `getSignedPhotoUrl` y el bloque de Salud desde la Fase 3.' },
  { pide: 'photoDate', es: 'fecha', porque: 'Ya guardaba el día de la foto. Lo que faltaba no era el campo: era poder editarlo (apartado 3).' },
  { pide: 'note', es: 'nota', porque: 'Igual, y lo pinta el bloque de Salud.' },
];

/** Apartado 21 — *"Por defecto: Private"*, y de momento es el único valor. */
export const VISIBILIDAD_PRIVADA = 'private';

/**
 * ⚠️ **Y NO HAY NINGUNA FUNCIÓN QUE LO CAMBIE** (apartados 21 y 41). El modelo
 * queda *"preparado para futuro"*, que es lo que pide el apartado, pero un
 * selector de visibilidad con un solo valor sería un control decorativo
 * (regla 8) — y «compartir» está en la lista de lo prohibido.
 */
export const VISIBILIDADES = [{ id: VISIBILIDAD_PRIVADA, nombre: 'Privada', disponible: true }];

/** Apartado 19 — *"No hacer obligatorio clasificar cada foto"*. */
export const TAGS_FOTO = [
  { id: 'frontal', nombre: 'Frontal' },
  { id: 'lateral', nombre: 'Lateral' },
  { id: 'espalda', nombre: 'Espalda' },
  { id: 'relajado', nombre: 'Relajado' },
  { id: 'pose', nombre: 'Pose' },
];
export const tagFoto = (id) => TAGS_FOTO.find((t) => t.id === id) || null;

/**
 * 🚨 Apartado 3 — **`photoDate` y `createdAt` son dos cosas**: *"el usuario
 * puede subir hoy una fotografía tomada hace meses"*. `fecha` es el día de la
 * foto (editable) y `createdAt` cuándo la subió (no se toca nunca).
 */
export function crearFotoProgreso({
  path = '', fecha = null, nota = '', tags = [], createdFromWorkoutId = null, ahora = null,
} = {}) {
  const cuando = ahora ? new Date(ahora).toISOString() : new Date().toISOString();
  return {
    id: uid(),
    path: texto(path),
    /* Por defecto, hoy (apartado 3) — y en LOCAL, que es la trampa del UTC. */
    fecha: texto(fecha) || todayISO(),
    nota: texto(nota),
    tags: lista(tags).map(texto).filter((t) => !!tagFoto(t)),
    createdFromWorkoutId: texto(createdFromWorkoutId) || null,
    visibility: VISIBILIDAD_PRIVADA,
    createdAt: cuando,
    actualizadaEn: cuando,
  };
}

/**
 * 🚨 **LA PUERTA DE CARGA, Y HACÍA FALTA** (regla 5). `saludFotos` se cargaba
 * con `loadData(uid, 'saludFotos', [])` **sin normalizar nada**, así que en
 * cuanto esta fase añade cinco campos, el siguiente guardado se los llevaría de
 * todo lo subido antes. Es el fallo del normalizador por enésima vez.
 *
 * ⚠️ Y **lo guardado antes no pierde nada**: una foto de la Fase 3 tiene `id`,
 * `path`, `fecha` y `nota`, y se queda con ellos; lo que no tenía se rellena
 * con lo que significaba —`visibility` privada, sin tags, sin sesión— y
 * `createdAt` **se deduce de su `fecha`**, que es lo único que se sabe: no se
 * inventa una hora que nadie registró.
 */
export function normalizarFotoProgreso(f) {
  const o = f && typeof f === 'object' ? f : {};
  const fecha = texto(o.fecha) || todayISO();
  return {
    id: texto(o.id) || uid(),
    path: texto(o.path),
    fecha,
    nota: texto(o.nota),
    tags: lista(o.tags).map(texto).filter((t) => !!tagFoto(t)),
    createdFromWorkoutId: texto(o.createdFromWorkoutId) || null,
    /* Apartado 21 — cualquier valor raro vuelve a privada, nunca al revés. */
    visibility: VISIBILIDAD_PRIVADA,
    createdAt: texto(o.createdAt) || `${fecha}T00:00:00.000Z`,
    actualizadaEn: texto(o.actualizadaEn) || texto(o.createdAt) || `${fecha}T00:00:00.000Z`,
  };
}

/** ⚠️ Una foto **sin `path` no se puede pintar**: no hay archivo al que apuntar. */
export const normalizarFotosProgreso = (fotos) => lista(fotos)
  .map(normalizarFotoProgreso)
  .filter((f) => !!f.path);

/* ═══════════════════════════════════════════════════════════════════════════
   2 · EDITAR LO QUE SE PUEDE EDITAR (apartados 3 y 18)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ⚠️ **`path`, `id` y `createdAt` no se editan.** Cambiar el camino apuntaría a
 * otro archivo, y `createdAt` es un hecho: cuándo la subió. Lo editable es lo
 * que el usuario escribió — la fecha de la foto, la nota y las etiquetas.
 */
export function editarFotoProgreso(fotos, id, cambios = {}, { ahora = null } = {}) {
  const objetivo = texto(id);
  return lista(fotos).map((f) => {
    if (f.id !== objetivo) return f;
    const siguiente = { ...f };
    if (cambios.fecha !== undefined) siguiente.fecha = texto(cambios.fecha) || f.fecha;
    if (cambios.nota !== undefined) siguiente.nota = texto(cambios.nota);
    if (cambios.tags !== undefined) siguiente.tags = lista(cambios.tags).map(texto).filter((t) => !!tagFoto(t));
    siguiente.actualizadaEn = ahora ? new Date(ahora).toISOString() : new Date().toISOString();
    return siguiente;
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LA GALERÍA, AGRUPADA POR DÍA (apartados 9 y 10)
   ═══════════════════════════════════════════════════════════════════════════ */

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

/** El rótulo del apartado 10: **«12 SEPTIEMBRE 2026»**, en su forma corta. */
export function etiquetaDeDia(iso) {
  const s = texto(iso);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  return `${Number(m[3])} ${MESES[Number(m[2]) - 1] || ''} ${m[1]}`;
}

/**
 * 🚨 Apartado 10 — varias fotos del mismo día **se agrupan**, y el apartado 6
 * exige que **cada una siga siendo un registro independiente**: aquí se agrupan
 * para verlas, no para guardarlas. La lista sigue siendo plana.
 *
 * ⚠️ Apartado 9 — **más reciente primero**, y a igualdad de día manda el orden
 * de subida **descendente**: determinista, sin depender de dónde estaba en el
 * array.
 */
export function diasDeFotos(fotos) {
  const porDia = new Map();
  normalizarFotosProgreso(fotos).forEach((f) => {
    if (!porDia.has(f.fecha)) porDia.set(f.fecha, []);
    porDia.get(f.fecha).push(f);
  });
  return [...porDia.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .map(([fecha, dentro]) => {
      const ordenadas = dentro.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : a.id.localeCompare(b.id)));
      /* La nota del día es la primera que haya escrito, no una inventada. */
      const conNota = ordenadas.find((f) => !!f.nota) || null;
      return {
        fecha,
        etiqueta: etiquetaDeDia(fecha),
        fotos: ordenadas,
        cuantas: ordenadas.length,
        /* Apartado 9 — *"número de fotos del mismo día"*, en palabras. */
        texto: ordenadas.length === 1 ? '1 foto' : `${ordenadas.length} fotos`,
        nota: conNota ? conNota.nota : '',
      };
    });
}

/** La lista plana en el mismo orden que la galería: la que recorre el visor. */
export const fotosEnOrden = (fotos) => diasDeFotos(fotos).flatMap((d) => d.fotos);

export const fotoPorId = (fotos, id) => fotosEnOrden(fotos).find((f) => f.id === texto(id)) || null;

/**
 * Apartado 11 — *"navegación entre fotografías"*. Devuelve las vecinas en el
 * orden de la galería, y `null` en los extremos: **no se da la vuelta**, porque
 * en una línea temporal eso te llevaría de la más nueva a la más vieja sin
 * decírtelo.
 */
export function vecinasDeFoto(fotos, id) {
  const orden = fotosEnOrden(fotos);
  const i = orden.findIndex((f) => f.id === texto(id));
  if (i < 0) return { anterior: null, siguiente: null, posicion: 0, total: orden.length };
  return {
    anterior: i > 0 ? orden[i - 1] : null,
    siguiente: i < orden.length - 1 ? orden[i + 1] : null,
    posicion: i + 1,
    total: orden.length,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LA COMPARACIÓN (apartados 13, 14, 15 y 25)
   ═══════════════════════════════════════════════════════════════════════════ */

export const MINIMO_PARA_COMPARAR = 2;
/** Apartado 25, literal — y **no se desactiva la sección entera**. */
export const FALTA_OTRA_FOTO = 'Necesitas otra foto para comparar.';

/**
 * 🚨 Apartado 14 — **ANTES y DESPUÉS los decide la FECHA, no el orden en que
 * las eligió**. Si marca primero la de septiembre y luego la de junio, la de
 * junio sigue siendo el «antes»: al revés la comparación diría que ha ido hacia
 * atrás en el tiempo.
 *
 * 🚨 Y **ni una palabra sobre el cuerpo** (apartados 14 y 41): *"No decir: has
 * ganado X músculo. No hacer análisis corporal."* Lo único que se afirma son
 * las dos fechas y cuánto tiempo pasó entre ellas, que es aritmética.
 */
export function compararFotos(fotos, idA, idB) {
  const a = fotoPorId(fotos, idA);
  const b = fotoPorId(fotos, idB);
  if (!a || !b) return { hay: false, motivo: 'faltan', antes: null, despues: null, texto: '' };
  if (a.id === b.id) return { hay: false, motivo: 'misma', antes: null, despues: null, texto: '' };
  const [antes, despues] = a.fecha <= b.fecha ? [a, b] : [b, a];
  return {
    hay: true,
    motivo: null,
    antes,
    despues,
    etiquetaAntes: etiquetaDeDia(antes.fecha),
    etiquetaDespues: etiquetaDeDia(despues.fecha),
    dias: diasEntreFechas(antes.fecha, despues.fecha),
    texto: textoDeDistancia(diasEntreFechas(antes.fecha, despues.fecha)),
  };
}

/** ⚠️ En LOCAL (`T00:00:00`), que es la trampa del UTC por enésima vez. */
export function diasEntreFechas(desde, hasta) {
  const a = new Date(`${texto(desde)}T00:00:00`);
  const b = new Date(`${texto(hasta)}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b - a) / 86400000);
}

/**
 * ⚠️ Cuánto tiempo pasó, **sin interpretar nada**. Es el apartado 14: la
 * distancia entre dos fechas es un hecho; lo que haya pasado con su cuerpo, no.
 */
export function textoDeDistancia(dias) {
  if (typeof dias !== 'number' || dias < 0) return '';
  if (dias === 0) return 'El mismo día';
  if (dias === 1) return '1 día de diferencia';
  if (dias < 31) return `${dias} días de diferencia`;
  const meses = Math.round(dias / 30);
  if (meses < 12) return meses === 1 ? '1 mes de diferencia' : `${meses} meses de diferencia`;
  const anios = Math.floor(dias / 365);
  return anios === 1 ? 'Más de un año de diferencia' : `Más de ${anios} años de diferencia`;
}

/** Apartado 17 — *"una selección sencilla: Fecha, Foto"*, sin calendario. */
export function opcionesParaComparar(fotos) {
  return fotosEnOrden(fotos).map((f) => ({
    id: f.id,
    fecha: f.fecha,
    etiqueta: etiquetaDeDia(f.fecha),
    nota: f.nota,
    path: f.path,
  }));
}

export const puedeComparar = (fotos) => normalizarFotosProgreso(fotos).length >= MINIMO_PARA_COMPARAR;

/* ═══════════════════════════════════════════════════════════════════════════
   5 · TAMAÑO Y ORIENTACIÓN (apartados 7 y 8)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 8 — *"no utilizar una resolución absurda"*, y tampoco destruirla. */
export const LADO_MAXIMO = 1600;
export const CALIDAD_JPEG = 0.86;

/**
 * El cálculo del apartado 8, **aparte del navegador para poder comprobarlo**:
 * se reduce solo si hace falta, conservando la proporción. Nunca se agranda una
 * foto pequeña —eso no mejora nada y multiplica el peso—.
 */
export function dimensionesOptimizadas(ancho, alto, { lado = LADO_MAXIMO } = {}) {
  const a = Number(ancho) || 0;
  const b = Number(alto) || 0;
  if (a <= 0 || b <= 0) return { ancho: 0, alto: 0, reducida: false };
  const mayor = Math.max(a, b);
  if (mayor <= lado) return { ancho: a, alto: b, reducida: false };
  const factor = lado / mayor;
  return { ancho: Math.round(a * factor), alto: Math.round(b * factor), reducida: true };
}

/**
 * 🚨 **LA ORIENTACIÓN NO SE ROTA A MANO** (apartado 7). Safari de iOS y
 * Chromium aplican el EXIF por su cuenta desde que `image-orientation:
 * from-image` es el valor inicial, así que **un rotador propio giraría dos
 * veces** la foto del iPhone de Josué — que es el único dispositivo donde esto
 * se usa. Lo que sí hace falta es no perderla al redimensionar: por eso el
 * escalado usa `createImageBitmap` con `imageOrientation: 'from-image'`, que la
 * respeta, y si el navegador no lo soporta **se sube el archivo tal cual**.
 * ⚠️ Peor una foto sin comprimir que una foto girada.
 */
export const ORIENTACION = {
  seRota: false,
  porque: 'Safari de iOS y Chromium ya aplican el EXIF (`image-orientation: from-image`). Rotarla aquí la giraría dos veces.',
  alRedimensionar: "createImageBitmap(file, { imageOrientation: 'from-image' })",
  siNoSePuede: 'Se sube el archivo original sin tocar: mejor sin comprimir que girada.',
};

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LOS ESTADOS (apartados 24, 25, 26, 28 y 29)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Apartado 24, con sus palabras. */
export const VACIO_FOTOS = {
  titulo: 'Empieza a registrar tu progreso',
  que: 'Guarda una foto ahora y podrás comparar tu evolución con el tiempo.',
  cta: 'Añadir primera foto',
};

/** Apartados 28 y 29 — y los dos dicen qué ha pasado, no «Error» a secas. */
export const ERRORES_FOTO = {
  guardar: {
    titulo: 'No se ha podido guardar la foto.',
    que: 'No se ha subido nada. Comprueba la conexión y vuelve a intentarlo.',
  },
  leer: {
    titulo: 'Esta foto no se puede mostrar ahora.',
    que: 'El archivo no está disponible. Las demás siguen bien.',
  },
};

export const ESTADOS_FOTOS = [
  { id: 'vacio', nombre: 'Sin fotos', que: 'Todavía no hay ninguna.' },
  { id: 'una', nombre: 'Una foto', que: 'Se ve normalmente; para comparar hace falta otra.' },
  { id: 'varias', nombre: 'Varias fotos', que: 'Galería por días y comparación disponibles.' },
];
export const estadoFotos = (id) => ESTADOS_FOTOS.find((e) => e.id === id) || null;

/**
 * 🚨 Apartado 26 — con muchas fotos **no se cargan todas a resolución máxima**.
 * Cuántas se piden firmadas de golpe vive aquí, no escrito a mano en la vista.
 */
export const FOTOS_POR_TANDA = 12;

/**
 * Todo lo que la pantalla necesita, de una sola llamada.
 *
 * ⚠️ **No guarda nada**: la galería, los días y el estado se derivan de
 * `saludFotos` en el momento, como todo lo demás de esta entrega.
 */
export function pantallaDeFotos(fotos, { comparando = null } = {}) {
  const limpias = normalizarFotosProgreso(fotos);
  const dias = diasDeFotos(limpias);
  const estado = limpias.length === 0 ? 'vacio' : (limpias.length === 1 ? 'una' : 'varias');
  return {
    fotos: limpias,
    orden: fotosEnOrden(limpias),
    dias,
    total: limpias.length,
    estado: estadoFotos(estado),
    vacio: limpias.length === 0 ? VACIO_FOTOS : null,
    /* Apartado 25 — la sección de comparar **existe siempre**; lo que cambia es
       si se puede usar o hay que decir que falta otra foto. */
    comparacion: {
      disponible: puedeComparar(limpias),
      aviso: puedeComparar(limpias) ? null : FALTA_OTRA_FOTO,
      opciones: opcionesParaComparar(limpias),
      resultado: comparando ? compararFotos(limpias, comparando.a, comparando.b) : null,
    },
    /* Apartado 9 — la línea de la pestaña, contada de verdad. */
    texto: limpias.length === 0
      ? 'Sin fotos de progreso'
      : `${limpias.length} ${limpias.length === 1 ? 'foto' : 'fotos'} · ${dias.length} ${dias.length === 1 ? 'día' : 'días'}`,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · LA SESIÓN ASOCIADA (apartados 20 y 33)
   ═══════════════════════════════════════════════════════════════════════════ */

export const TRAS_ENTRENAR = 'Después de entrenamiento';

/**
 * 🚨 Apartado 33 — *"la foto debe seguir existiendo aunque posteriormente la
 * sesión se elimine. En ese caso: el enlace simplemente queda sin asociación"*.
 * Por eso esto **no limpia el campo** y **no borra la foto**: devuelve si la
 * sesión sigue estando. Limpiarlo en el normalizador habría borrado el dato de
 * que esa foto se hizo después de entrenar.
 */
export function sesionDeFoto(foto, fitness) {
  const id = texto(foto && foto.createdFromWorkoutId);
  if (!id) return { hay: false, sesionId: null, existe: false, texto: '' };
  const sesiones = lista(fitness && fitness.sesiones);
  const existe = sesiones.some((s) => s && s.id === id);
  return { hay: true, sesionId: id, existe, texto: TRAS_ENTRENAR };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · AUDITORÍA (y una que SÍ se puede poner roja)
   ═══════════════════════════════════════════════════════════════════════════ */

export function casillasDeFotos(pantalla) {
  const p = pantalla || {};
  const orden = lista(p.orden);
  const dias = lista(p.dias);
  return [
    { id: 'sin_copias', ok: orden.every((f) => !!f.path), que: 'Cada foto apunta a su archivo, y ninguna guarda la imagen dentro' },
    { id: 'privadas', ok: orden.every((f) => f.visibility === VISIBILIDAD_PRIVADA), que: 'Todas las fotos son privadas' },
    { id: 'sin_url', ok: orden.every((f) => !Object.prototype.hasOwnProperty.call(f, 'url')), que: 'Ninguna guarda una URL firmada, que caduca en una hora' },
    { id: 'orden', ok: dias.every((d, i) => i === 0 || dias[i - 1].fecha > d.fecha), que: 'Los días van de más reciente a más antiguo' },
    { id: 'agrupadas', ok: dias.reduce((n, d) => n + d.cuantas, 0) === orden.length, que: 'La agrupación por día no pierde ni duplica ninguna' },
    {
      id: 'comparar_sin_bloquear',
      ok: !!p.comparacion && (p.comparacion.disponible || !!p.comparacion.aviso),
      que: 'Con una sola foto la comparación lo dice, en vez de desaparecer',
    },
  ];
}

export function auditarFotos(fotos, opciones = {}) {
  const pantalla = pantallaDeFotos(fotos, opciones);
  const casillas = casillasDeFotos(pantalla);
  return { casillas, ok: casillas.every((c) => c.ok), pantalla };
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · LO QUE NO SE CONSTRUYE, Y POR QUÉ
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT26 = [
  {
    que: 'Cualquier análisis del cuerpo: grasa, masa muscular, reconocimiento o recomendaciones físicas',
    porque: 'El apartado 41 los enumera uno por uno y el contexto abre con «No utilizar IA para analizar el cuerpo». La comparación solo dice dos fechas y cuánto tiempo pasó.',
  },
  {
    que: 'Compartir, público, seguidores o red social',
    porque: 'Apartados 21 y 41. `visibility` nace privada y no existe ninguna función que la cambie: un selector con un solo valor sería un control decorativo (regla 8).',
  },
  {
    que: 'Una papelera para las fotos',
    porque: 'Apartado 23: «si la arquitectura ya dispone de undo, utilizarla; si no, no crear un sistema complejo». Las fotos están FUERA del deshacer a propósito desde la Fase 3 —implican un archivo real en Storage y deshacer dejaría un huérfano sin referencia—, así que el aviso dice la verdad: no se puede deshacer (apartado 22).',
  },
  {
    que: 'Un rotador de EXIF propio',
    porque: 'Apartado 7. Safari de iOS y Chromium ya aplican la orientación, así que rotarla aquí la giraría DOS veces en el único dispositivo donde se usa esto.',
  },
  {
    que: 'Filtros estéticos o edición de fotografías',
    porque: 'Apartado 41, literal.',
  },
  {
    que: 'Una segunda lista de fotos',
    porque: 'Son `saludFotos` desde la Fase 3, declarado en MAPEO_EXISTENTE desde la FIT F1. Una lista nueva dejaría invisible lo que Josué ya tiene subido.',
  },
];

export const DECISIONES_FIT26 = [
  {
    que: 'Tres de los nueve campos del apartado 2 ya existían con otro nombre',
    porque: '`imageReference` es `path`, `photoDate` es `fecha` y `note` es `nota`, y los leen `deleteFoto`, `getSignedPhotoUrl` y el bloque de Salud. El apartado dice «utilizar o adaptar»: adaptarlo es conservar los nombres que ya funcionan.',
  },
  {
    que: 'El bloque de fotos de Salud se queda donde está',
    porque: 'Es la misma lista, así que no hay duplicación de datos, y quitarlo rompería un apartado que funciona — «no implementar» no es «quitar» (E3 F34). Fitness añade el diario visual completo; Salud conserva la subida rápida que él ya usa.',
  },
  {
    que: 'La galería de Fitness lleva la MISMA protección que la de Salud',
    porque: 'Las fotos están detrás de `fotos_privadas` porque lo eligió Josué. La fase no menciona el PIN, pero el apartado 38 dice «no exponer fotografías»: una segunda puerta sin PIN sería saltarse por la espalda su propia seguridad. Anotado como C-35 en docs/03.',
  },
  {
    que: 'ANTES y DESPUÉS los decide la fecha, no el orden de selección',
    porque: 'Apartado 14. Si marca primero la de septiembre y luego la de junio, la de junio sigue siendo el «antes»: al revés la comparación diría que ha ido hacia atrás en el tiempo.',
  },
  {
    que: '`saludFotos` estrena normalizador',
    porque: 'Se cargaba sin normalizar nada, así que los cinco campos nuevos se los habría llevado el siguiente guardado (regla 5). Y lo guardado antes no pierde nada: `createdAt` se deduce de su `fecha`, que es lo único que se sabe de ella.',
  },
];

export default pantallaDeFotos;
