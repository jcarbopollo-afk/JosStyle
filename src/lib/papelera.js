// ---------------------------------------------------------------------------
// Entrega 2 · ME Fase 3 — Papelera global ("Eliminados recientemente").
//
// QUÉ RESUELVE
// Hasta ahora, borrar algo lo borraba. Existía el deshacer de 10 pasos, pero es
// un histórico compartido por toda la app: si borras una tarea y después
// registras tres cosas más, ya no puedes recuperarla. La especificación pide una
// papelera de verdad, con retención y recuperación explícita.
//
// POR QUÉ ES UN SISTEMA GLOBAL Y NO UNO POR MÓDULO
// La especificación es tajante: "debe construirse como un sistema global y
// reutilizable, no como una solución aislada para los módulos actuales". Los 22
// handlers de borrado de App.jsx siguen todos exactamente el mismo patrón:
//
//     MODULO.COLECCION.filter((x) => x.id !== id)
//
// Así que la papelera se modela sobre esa forma: módulo + colección + id. Añadir
// un módulo futuro a la papelera es añadir una entrada a CATALOGO_PAPELERA, sin
// tocar ni el motor ni la interfaz.
//
// QUÉ GUARDA CADA ENTRADA
// El objeto original completo, no una etiqueta de "borrado" (requisito explícito
// de la especificación): id original, tipo, módulo, colección, fecha de creación
// si se conoce, fecha de eliminación, la posición que ocupaba en la lista, y los
// datos íntegros. Con eso la recuperación es real: el elemento vuelve a su sitio,
// en su orden, con sus relaciones intactas — no se recrea una copia nueva.
// ---------------------------------------------------------------------------

import { uid, todayISO } from './helpers';

// Retención por defecto. La especificación pide que sea fácil de cambiar y que
// exista la opción de "conservar hasta que yo lo elimine": eso es el valor 0.
export const RETENCION_PAPELERA_DIAS = 30;
export const OPCIONES_RETENCION = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
  { value: 0, label: 'Hasta que yo lo borre' },
];

export const DEFAULT_PAPELERA = { elementos: [], retencionDias: RETENCION_PAPELERA_DIAS };

// Catálogo de qué se puede enviar a la papelera.
//
//   modulo      — clave de app_data
//   coleccion   — sub-lista dentro del módulo (null si el módulo ES la lista, como `sueno`)
//   tipo        — cómo se llama un elemento de esta colección, en singular y para el usuario
//   campos      — de dónde sacar el texto identificativo, en orden de preferencia
//   privado     — si el módulo está protegido por PIN, la etiqueta se oculta mientras esté bloqueado
//
// NO están aquí, a propósito: fotos de Salud, vídeos de Calistenia y archivos de
// Biblioteca. Sus datos viven en Supabase Storage, y mandarlos a la papelera
// exigiría NO borrar el archivo — dejando ficheros huérfanos si después se vacía
// la papelera desde otro dispositivo. Es el mismo motivo por el que ya estaban
// fuera del sistema de deshacer. Documentado como límite, no como olvido.
export const CATALOGO_PAPELERA = {
  'sueno': { modulo: 'sueno', coleccion: null, tipo: 'Registro de sueño', campos: ['fecha'], icono: 'sueno' },
  'futbol': { modulo: 'futbol', coleccion: null, tipo: 'Partido', campos: ['rival', 'resultado', 'fecha'], icono: 'entreno' },
  'economia.movimientos': { modulo: 'economia', coleccion: 'movimientos', tipo: 'Movimiento', campos: ['concepto', 'fecha'], icono: 'economia' },
  'salud.medidas': { modulo: 'salud', coleccion: 'medidas', tipo: 'Medida', campos: ['fecha'], icono: 'salud' },
  'salud.historial': { modulo: 'salud', coleccion: 'historial', tipo: 'Entrada médica', campos: ['descripcion', 'tipo'], icono: 'salud' },
  'nutricion.comidas': { modulo: 'nutricion', coleccion: 'comidas', tipo: 'Comida', campos: ['nombre'], icono: 'nutricion' },
  'estudios.programas': { modulo: 'estudios', coleccion: 'programas', tipo: 'Programa de estudios', campos: ['nombre'], icono: 'estudios' },
  'estudios.asignaturas': { modulo: 'estudios', coleccion: 'asignaturas', tipo: 'Asignatura', campos: ['nombre'], icono: 'estudios' },
  'estudios.examenes': { modulo: 'estudios', coleccion: 'examenes', tipo: 'Examen', campos: ['tema'], icono: 'estudios' },
  'estudios.horas': { modulo: 'estudios', coleccion: 'horas', tipo: 'Horas de estudio', campos: ['fecha'], icono: 'estudios' },
  'armario.prendas': { modulo: 'armario', coleccion: 'prendas', tipo: 'Prenda', campos: ['nombre'], icono: 'armario' },
  'armario.outfits': { modulo: 'armario', coleccion: 'outfits', tipo: 'Outfit', campos: ['nombre'], icono: 'armario' },
  // Un uso es un día concreto del historial. Va a la papelera como todo lo demás porque
  // borrarlo cambia las estadísticas del armario entero (una prenda pasa de "usada 12
  // veces" a 11), y eso tiene que poder deshacerse.
  'armario.usos': { modulo: 'armario', coleccion: 'usos', tipo: 'Uso', campos: ['fecha'], icono: 'armario' },
  // FO Fase 12 — las apariencias guardadas. Es una lista PLANA (`coleccion: null`),
  // como `sueno` o `futbol`: `temasGuardados` es un array de primer nivel, no una
  // colección dentro de un módulo. La papelera ya lo soportaba desde ME F3.
  //
  // Va aquí y no en un sistema propio de eliminados porque el apartado 2 pide
  // "Ajustes → Eliminados recientemente" — que ya existe y ya tiene retención,
  // recuperación, borrado definitivo y vaciado con confirmación. Crear otro al lado
  // habría dejado dos papeleras en la misma pantalla de Ajustes.
  'temasGuardados': { modulo: 'temasGuardados', coleccion: null, tipo: 'Apariencia guardada', campos: ['nombre'], icono: 'ajustes' },
  'negocio.proyectos': { modulo: 'negocio', coleccion: 'proyectos', tipo: 'Proyecto', campos: ['nombre'], icono: 'negocio' },
  'productividad.habitos': { modulo: 'productividad', coleccion: 'habitos', tipo: 'Hábito', campos: ['nombre'], icono: 'productividad' },
  'productividad.rutinas': { modulo: 'productividad', coleccion: 'rutinas', tipo: 'Rutina', campos: ['nombre'], icono: 'productividad' },
  'productividad.tareas': { modulo: 'productividad', coleccion: 'tareas', tipo: 'Tarea', campos: ['texto'], icono: 'productividad' },
  'productividad.metas': { modulo: 'productividad', coleccion: 'metas', tipo: 'Meta', campos: ['nombre'], icono: 'productividad' },
  'objetivos.lista': { modulo: 'objetivos', coleccion: 'lista', tipo: 'Objetivo', campos: ['texto'], icono: 'objetivos' },
  'calendario.eventos': { modulo: 'calendario', coleccion: 'eventos', tipo: 'Evento', campos: ['titulo'], icono: 'calendario' },
  'diario.entradas': { modulo: 'diario', coleccion: 'entradas', tipo: 'Entrada del diario', campos: ['fecha'], icono: 'diario' },
  'biblioteca.apuntes': { modulo: 'biblioteca', coleccion: 'apuntes', tipo: 'Apunte', campos: ['titulo'], icono: 'biblioteca' },
  'biblioteca.enlaces': { modulo: 'biblioteca', coleccion: 'enlaces', tipo: 'Enlace', campos: ['titulo'], icono: 'biblioteca' },
  'fe.servicio': { modulo: 'fe', coleccion: 'servicio', tipo: 'Servicio', campos: ['tipo', 'fecha'], icono: 'fe' },
  'fe.eventos': { modulo: 'fe', coleccion: 'eventos', tipo: 'Evento de fe', campos: ['titulo'], icono: 'fe' },
  'fe.diario': { modulo: 'fe', coleccion: 'diario', tipo: 'Entrada espiritual', campos: ['fecha'], icono: 'fe' },
  'fe.objetivos': { modulo: 'fe', coleccion: 'objetivos', tipo: 'Objetivo de fe', campos: ['texto'], icono: 'fe' },
  'bienestar.registros': { modulo: 'bienestar', coleccion: 'registros', tipo: 'Tiempo de uso', campos: ['app', 'categoria'], icono: 'bienestar' },
  'bienestar.reflexiones': { modulo: 'bienestar', coleccion: 'reflexiones', tipo: 'Reflexión', campos: ['fecha'], icono: 'bienestar' },
  // Relación va a la papelera como todo lo demás, pero marcada como privada: su
  // etiqueta no se muestra mientras el módulo esté bloqueado. Ver `describirEntrada`.
  // EH F15, apartado 13 — *"y si JC Fitness ya tiene Eliminados recientemente,
  // utilizar ese sistema en lugar de crear otro"*. Es literalmente lo que dice
  // el comentario de arriba: añadir un módulo a la papelera es añadir una línea
  // aquí. El motor es genérico sobre la lista que se le pase, así que los
  // registros de piel —que viven dentro de la `config` de Skincare— entran sin
  // tocar ni una función.
  'skincare.registros': { modulo: 'skincare', coleccion: 'registros', tipo: 'Registro de piel', campos: ['fecha'], icono: 'skincare' },
  /* ⚠️ EH F21, apartado 19 — *"si elimina una rutina, un registro o un producto
     asociado, utilizar 🗑️ Eliminados recientemente global. **No crear papelera
     propia**"*. Cuarta vez que un módulo entra aquí **sin tocar ni una función
     del motor**: dos líneas de catálogo y ya está. */
  'barba.rutinas': { modulo: 'barba', coleccion: 'rutinas', tipo: 'Rutina de barba', campos: ['nombre'], icono: 'barba' },
  'barba.registros': { modulo: 'barba', coleccion: 'registros', tipo: 'Registro de barba', campos: ['fecha'], icono: 'barba' },
  /* ⚠️ EH F23, apartado 16 — *"cualquier eliminación utilizará 🗑️ Eliminados
     recientemente global"*. Tres líneas más, y ni una función nueva. */
  'sonrisa.rutinas': { modulo: 'sonrisa', coleccion: 'rutinas', tipo: 'Rutina de higiene bucal', campos: ['nombre'], icono: 'sonrisa' },
  'sonrisa.revisiones': { modulo: 'sonrisa', coleccion: 'revisiones', tipo: 'Revisión dental', campos: ['fecha'], icono: 'sonrisa' },
  'sonrisa.registros': { modulo: 'sonrisa', coleccion: 'registros', tipo: 'Registro de higiene bucal', campos: ['fecha'], icono: 'sonrisa' },
  // ⚠️ EH F24 — la colección de perfumes y su historial, a la papelera de siempre.
  'perfumes.perfumes': { modulo: 'perfumes', coleccion: 'perfumes', tipo: 'Perfume', campos: ['nombre'], icono: 'perfumes' },
  'perfumes.historial': { modulo: 'perfumes', coleccion: 'historial', tipo: 'Uso de perfume', campos: ['fecha'], icono: 'perfumes' },
  /* ⚠️ EH F26 — a la papelera de siempre. Un accesorio guardado aquí es SU
     ENVOLTORIO de estilo: el nombre y la foto son de la prenda, que sigue en el
     Armario, así que la etiqueta sale de su nota o de su fecha. */
  'accesorios.accesorios': { modulo: 'accesorios', coleccion: 'accesorios', tipo: 'Accesorio', campos: ['nota', 'creadoEn'], icono: 'accesorios' },
  /* ⚠️ EH F27, apartado 14 — *"eliminados recientemente GLOBAL. No crear
     papelera propia"*. Una línea, como todos. */
  'gustos.entradas': { modulo: 'gustos', coleccion: 'entradas', tipo: 'Gusto o interés', campos: ['nombre'], icono: 'gustos' },
  'accesorios.deseos': { modulo: 'accesorios', coleccion: 'deseos', tipo: 'Accesorio que quiere comprar', campos: ['nombre'], icono: 'accesorios' },
  'relacion.fechas': { modulo: 'relacion', coleccion: 'fechas', tipo: 'Fecha importante', campos: ['etiqueta'], icono: 'relacion', privado: true },
};

/** Clave de catálogo a partir de módulo y colección. */
export function claveCatalogo(modulo, coleccion) {
  return coleccion ? `${modulo}.${coleccion}` : modulo;
}

/** Lee la lista real de un módulo, tenga o no sub-colección. */
function leerLista(valorModulo, coleccion) {
  if (!coleccion) return Array.isArray(valorModulo) ? valorModulo : [];
  const l = valorModulo && valorModulo[coleccion];
  return Array.isArray(l) ? l : [];
}

/** Devuelve el módulo con la lista sustituida, respetando su forma. */
function escribirLista(valorModulo, coleccion, lista) {
  if (!coleccion) return lista;
  return { ...(valorModulo || {}), [coleccion]: lista };
}

/**
 * Prepara el envío de un elemento a la papelera.
 *
 * No muta nada: devuelve el módulo ya sin el elemento y la entrada de papelera
 * lista para añadir, para que quien llame decida cómo guardarlo.
 *
 * @returns {{ moduloActualizado, entrada } | null}  null si el elemento no existe.
 */
export function prepararEliminacion(valorModulo, modulo, coleccion, id, ahoraISO) {
  const lista = leerLista(valorModulo, coleccion);
  const indice = lista.findIndex((x) => x && x.id === id);
  if (indice === -1) return null;

  const original = lista[indice];
  const meta = CATALOGO_PAPELERA[claveCatalogo(modulo, coleccion)];

  const entrada = {
    id: uid(),
    modulo,
    coleccion: coleccion || null,
    tipo: meta ? meta.tipo : 'Elemento',
    icono: meta ? meta.icono : modulo,
    privado: !!(meta && meta.privado),
    idOriginal: original.id,
    // La posición que ocupaba, para devolverlo EXACTAMENTE donde estaba y no al final.
    indice,
    // `creadoEn` si el elemento lo tenía; si no, su fecha, que es lo más parecido.
    creadoEn: original.creadoEn || original.fecha || null,
    eliminadoEn: ahoraISO || new Date().toISOString(),
    // El objeto íntegro. La especificación lo pide así: "no almacenar simplemente
    // una etiqueta que diga eliminado".
    datos: original,
  };

  return {
    moduloActualizado: escribirLista(valorModulo, coleccion, lista.filter((_, i) => i !== indice)),
    entrada,
  };
}

/**
 * Añade a una entrada los elementos que se borraron EN CASCADA con ella.
 *
 * Caso real: borrar una asignatura borra también sus exámenes y sus horas de estudio, para no
 * dejar registros huérfanos apuntando a algo que ya no existe. Si la papelera solo guardara la
 * asignatura, recuperarla devolvería una asignatura vacía y los exámenes se habrían perdido para
 * siempre — que es justo lo que la especificación quiere evitar ("recupera sus relaciones cuando
 * sea posible", "cuidado con las relaciones").
 *
 * @param entrada     la entrada devuelta por `prepararEliminacion`
 * @param arrastrados [{ coleccion, elementos: [...] }] listas de lo que cayó con ella
 */
export function conArrastrados(entrada, arrastrados) {
  const relacionados = (arrastrados || [])
    .filter((a) => a && Array.isArray(a.elementos) && a.elementos.length > 0)
    .map((a) => ({ coleccion: a.coleccion, elementos: a.elementos }));
  return relacionados.length ? { ...entrada, relacionados } : entrada;
}

/**
 * Devuelve un elemento de la papelera a su módulo, en su posición original.
 *
 * Si la lista ha cambiado de tamaño desde entonces, se inserta en el índice más
 * cercano posible; si ya existe un elemento con el mismo id (por ejemplo tras un
 * deshacer), no se duplica.
 *
 * @returns {{ moduloActualizado } | null}  null si no se puede restaurar.
 */
export function prepararRestauracion(valorModulo, entrada) {
  if (!entrada || !entrada.datos) return null;
  const lista = leerLista(valorModulo, entrada.coleccion);
  if (lista.some((x) => x && x.id === entrada.idOriginal)) {
    // Ya está: no duplicar. Se considera restaurado igualmente para que la entrada
    // salga de la papelera y no quede un fantasma imposible de quitar.
    return { moduloActualizado: valorModulo, yaExistia: true };
  }
  const indice = Math.max(0, Math.min(entrada.indice ?? lista.length, lista.length));
  const siguiente = [...lista.slice(0, indice), entrada.datos, ...lista.slice(indice)];
  let modulo = escribirLista(valorModulo, entrada.coleccion, siguiente);

  // Volver a meter lo que cayó en cascada con este elemento (exámenes y horas de una asignatura,
  // por ejemplo). Se añaden al final de su lista y sin duplicar: su posición exacta importa mucho
  // menos que no perderlos, y el orden dentro de esas listas no es significativo para el usuario.
  for (const grupo of entrada.relacionados || []) {
    const actual = leerLista(modulo, grupo.coleccion);
    const nuevos = grupo.elementos.filter((el) => el && !actual.some((x) => x && x.id === el.id));
    if (nuevos.length) modulo = escribirLista(modulo, grupo.coleccion, [...actual, ...nuevos]);
  }

  return { moduloActualizado: modulo, yaExistia: false };
}

/**
 * Elimina definitivamente las entradas cuya retención ha vencido.
 * Con `retencionDias === 0` no caduca nada ("conservar hasta que yo lo borre").
 */
export function purgarCaducados(papelera, ahoraISO) {
  const dias = papelera?.retencionDias ?? RETENCION_PAPELERA_DIAS;
  const elementos = papelera?.elementos || [];
  if (!dias || elementos.length === 0) return papelera || DEFAULT_PAPELERA;

  const limite = new Date(ahoraISO || new Date().toISOString()).getTime() - dias * 24 * 60 * 60 * 1000;
  const vivos = elementos.filter((e) => {
    const t = new Date(e.eliminadoEn).getTime();
    return !Number.isFinite(t) || t >= limite;   // una fecha corrupta no se borra sola
  });
  return vivos.length === elementos.length ? papelera : { ...papelera, elementos: vivos };
}

/**
 * Texto identificativo de una entrada.
 *
 * `relacionDesbloqueada` respeta la única protección de principio a fin de la app:
 * Relación está detrás de PIN, así que su etiqueta ("Aniversario de María") no puede
 * asomar en una papelera que se abre desde Ajustes sin PIN. Mismo criterio y mismo
 * mecanismo que ya se usó al integrar las fechas de Relación en el Calendario.
 */
export function describirEntrada(entrada, opciones = {}) {
  if (!entrada) return '';
  if (entrada.privado && !opciones.relacionDesbloqueada) return 'Elemento privado';

  const meta = CATALOGO_PAPELERA[claveCatalogo(entrada.modulo, entrada.coleccion)];
  const campos = (meta && meta.campos) || [];
  for (const campo of campos) {
    const v = entrada.datos && entrada.datos[campo];
    if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 60);
    if (typeof v === 'number') return String(v);
  }
  return entrada.tipo || 'Elemento';
}

/** "hace 2 horas", "ayer", "hace 3 días" — como los ejemplos de la especificación. */
export function tiempoDesde(iso, ahoraISO) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const ms = new Date(ahoraISO || new Date().toISOString()).getTime() - t;
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} ${min === 1 ? 'minuto' : 'minutos'}`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
}

/** Días que le quedan a una entrada antes de borrarse sola. `null` si no caduca. */
export function diasRestantes(entrada, retencionDias, ahoraISO) {
  if (!retencionDias) return null;
  const t = new Date(entrada.eliminadoEn).getTime();
  if (!Number.isFinite(t)) return null;
  const transcurridos = (new Date(ahoraISO || new Date().toISOString()).getTime() - t) / (24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil(retencionDias - transcurridos));
}

/** Entradas más recientes primero. */
export function ordenarPapelera(elementos) {
  return [...(elementos || [])].sort((a, b) => String(b.eliminadoEn).localeCompare(String(a.eliminadoEn)));
}

export { todayISO };
