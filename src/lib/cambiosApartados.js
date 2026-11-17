/**
 * 🛡 HORARIOS · E1-R, R4 — CAMBIOS APARTADOS (docs/19 §18.18).
 *
 * Lógica pura, sin pantalla ni red. Una copia apartada es una operación manual ENTERA que el servidor apartó porque
 * chocaba con lo que había (R1, H-08): está en la tabla `copias_apartadas` hasta que él decida. Aquí se decide:
 *   · **qué es** (`describirCopia`): cuándo, desde qué aparato, de qué tipo y cuánto ocupa;
 *   · **qué contiene** (`resumenDeOperacion`), dicho con palabras, sin aplicar nada;
 *   · **cuánto ocupan** (`textoDelEspacio`): el tamaño LÓGICO de los datos guardados, que es lo único que la aplicación
 *     puede medir. Nunca se dice que se «libera» espacio en disco: al eliminar una copia deja de contar en los datos al
 *     momento, y la base de datos reutiliza el hueco más adelante (el tamaño físico no baja al momento, H-21);
 *   · **cómo se recuperaría hoy** (`prepararRecuperacion`): una operación NUEVA calculada sobre lo que hay AHORA en la
 *     cuenta, que manda el escritor de R2 como cualquier otra (todo o nada, con sus condiciones):
 *       – borrar una asignatura se REPITE sobre los datos de hoy (si ya no está, no hay nada que recuperar);
 *       – el resto se recupera ELEMENTO A ELEMENTO con la condición de lo que había: lo que ya está como en la copia
 *         se salta, lo que sigue como estaba se aplica, y si algo cambió después en otro aparato NO se recupera nada
 *         (nunca se pisa un cambio posterior y nunca se recupera una parte suelta);
 *       – una copia sin el detalle por elementos del horario (de antes de R4) solo se recupera si ya no hay nada que
 *         cambiar; si no, se puede ver y eliminar, pero no recuperar.
 * Nada se borra solo: eliminar una copia es SIEMPRE una acción suya (`protegido_copia_eliminar`), también después de
 * recuperarla.
 *
 * 🛟 R5 (docs/19 §18.19) — dos tipos más, que no son una operación sino un valor ENTERO que guardó el servidor:
 *   · `rescate` (H-22): lo que había antes de que una versión anterior de JosStyle guardara encima a ciegas, con lo que
 *     escribió (`antes`, `despues`);
 *   · `version_antigua` (H-23): lo que una versión anterior intentó guardar y el servidor apartó sin aplicar, con lo que
 *     había entonces (`intentado`, `vigente`).
 * No son UN cambio suyo sino lo que dejó o quiso dejar otra versión, así que no se recuperan enteras: se recuperan
 * ELEMENTO A ELEMENTO, eligiendo él (`prepararRecuperacion` con `elegidas`), y solo lo que sigue como lo encontró la
 * copia; lo que cambió después no se puede elegir (nunca se pisa). Las de Estudios y Eliminados recientes se ven y se
 * eliminan, pero no se recuperan desde aquí (su protección es E1-S y E1-P).
 */
import { aplicarCambio, igualJson, CAMPOS_DE_MARCA_HORARIO, cambiosDelHorario, calcularCambios } from './operacionesProtegidas';
import { prepararBorradoAsignatura, normalizarEstudiosCargados, normalizarPapeleraCargada, asignaturaEnHorario } from './asignaturaProtegida';
import { normalizarHorarioTop } from './horario';

/** Las claves que se leen de la cuenta para preparar una recuperación (las que puede tocar una operación). */
export const CLAVES_RECUPERACION = Object.freeze(['horarioTop', 'estudios', 'papelera']);

const esObjeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const tiene = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const copiar = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
const lista = (v) => (Array.isArray(v) ? v : []);

/* ═══════════════════════════════════════════════════════════════════════════
   1 · LOS TEXTOS
   =========================================================================== */
export const TIPOS_COPIA = Object.freeze({
  conflicto: 'Choque con otro aparato',
  version_antigua: 'De una versión antigua de JosStyle',
  rescate: 'Rescate',
});

export const TITULOS_OPERACION = Object.freeze({
  editar_horario: 'Un cambio de tu horario',
  borrar_asignatura: 'Borrar una asignatura',
  deshacer: 'Deshacer un cambio',
  recuperar_copia: 'Recuperar un cambio apartado',
  aviso_automatico: 'Un ajuste automático del horario',
});

/** Por qué el servidor la apartó (el motivo de la condición que falló, `fallo.motivo`). */
export const MOTIVOS_APARTADA = Object.freeze({
  revision: 'Tu horario había cambiado en otro aparato antes de que llegara.',
  elemento_distinto: 'Algo que tocaba había cambiado en otro aparato.',
  elemento_ausente: 'Algo que tocaba ya no estaba: se había borrado en otro aparato.',
  elemento_existe: 'Algo que añadía ya existía.',
  campo_distinto: 'Un ajuste que tocaba había cambiado en otro aparato.',
  camino_ausente: 'Lo que tocaba ya no estaba.',
  caducada: 'Llegó demasiado tarde.',
});

/** Los estados de una copia en la pantalla. */
export const ESTADOS_COPIA = Object.freeze({
  pendiente: { id: 'pendiente', nombre: 'Pendiente', explica: 'Se puede recuperar.' },
  recuperada: { id: 'recuperada', nombre: 'Ya está en tu cuenta', explica: 'Todo lo de esta copia ya está como en ella: no hay nada que recuperar. Puedes eliminarla.' },
  no_recuperable: { id: 'no_recuperable', nombre: 'No se puede recuperar', explica: 'Recuperarla pisaría cambios posteriores. Puedes verla y eliminarla.' },
  sin_comprobar: { id: 'sin_comprobar', nombre: 'Sin comprobar', explica: 'No se ha podido leer lo que hay ahora en tu cuenta.' },
  eliminada: { id: 'eliminada', nombre: 'Eliminada', explica: 'Esta copia ya no ocupa espacio en tus datos. La base de datos reutiliza ese hueco en su mantenimiento.' },
});

/** Por qué no se puede recuperar (en la pantalla, junto al estado). */
export const MOTIVOS_NO_RECUPERABLE = Object.freeze({
  conflicto_posterior: 'Algo de lo que tocaba cambió después en otro aparato. Recuperarla lo pisaría, así que no se recupera nada.',
  sin_detalle: 'Esta copia es de antes de que JosStyle guardara el detalle de cada cambio, y tu horario ha cambiado desde entonces: recuperarla pisaría lo de ahora.',
  ilegible: 'Esta copia no se puede leer con esta versión de JosStyle.',
  tipo_desconocido: 'Esta versión de JosStyle no sabe recuperar este tipo de copia. Puedes verla y eliminarla.',
  todo_cambio: 'Todo lo que se podría recuperar cambió después: recuperarlo pisaría lo de ahora, así que no se toca. Puedes verla y eliminarla.',
  clave_sin_recuperacion: 'Las copias de Estudios y de Eliminados recientes se pueden ver y eliminar, pero no recuperar desde aquí. Lo que contiene no se pierde mientras no la elimines.',
});

/** Lo que dice la pantalla de las condiciones y de lo que pasa después (todo en un sitio, para el barrido). */
export const TEXTOS_CAMBIOS_APARTADOS = Object.freeze({
  titulo: 'Cambios apartados',
  subtitulo: 'Lo que no se pudo guardar porque chocaba con otro aparato, y lo que se guardó a salvo de versiones anteriores de JosStyle. Nada se borra solo.',
  cargando: 'Leyendo tus cambios apartados…',
  vacio: 'No tienes cambios apartados.',
  sinConexion: 'Sin conexión: no se pueden leer tus cambios apartados. Vuelve a intentarlo cuando tengas red.',
  sesion: 'Tu sesión ha caducado. Vuelve a entrar para ver tus cambios apartados.',
  sinFunciones: 'Tu cuenta todavía no tiene lo que hace falta para guardar cambios apartados, así que no hay ninguno que ver.',
  error: 'No se han podido leer tus cambios apartados.',
  reintentar: 'Reintentar',
  inspeccionar: 'Ver qué contiene',
  ocultar: 'Ocultar',
  recuperar: 'Recuperar…',
  recuperarConfirmar: 'Recuperar ahora',
  recuperarExplica: 'Se guarda como un cambio nuevo sobre lo que hay ahora en tu cuenta, con las mismas comprobaciones que cualquier otro: si algo cambia mientras tanto, no se pisa.',
  recuperando: 'Recuperando…',
  recuperada: 'Recuperado. La copia sigue aquí por si la quieres conservar: elimínala cuando quieras.',
  recuperadaConflicto: 'No se ha podido recuperar: algo cambió en otro aparato justo ahora. Tu horario enseña el aviso con sus dos salidas.',
  recuperacionCambio: 'Lo que hay en tu cuenta ha cambiado desde que lo revisaste. Vuelve a revisarlo antes de recuperar.',
  recuperarNoAhora: 'Ahora no se puede recuperar: espera a que se guarde tu último cambio del horario.',
  recuperarConConflicto: 'Primero elige qué hacer con el aviso de tu horario.',
  recuperarSoloLectura: 'Horarios está en solo lectura: no se puede recuperar nada hasta que se resuelva su aviso.',
  recuperarPendiente: 'Todavía no ha llegado a tu cuenta: se guardará en cuanto haya conexión.',
  eliminar: 'Eliminar…',
  eliminarConfirma: 'Se elimina de verdad y no se puede recuperar. Lo que hay en tu cuenta no cambia.',
  eliminarSi: 'Eliminar la copia',
  eliminarNo: 'Cancelar',
  eliminando: 'Eliminando…',
  eliminadaYaNoEstaba: 'Ya no estaba: se eliminó en otro aparato.',
  errorAccion: 'No se ha podido hacer. Vuelve a intentarlo.',
  espacioExplica: 'Es el tamaño de los datos guardados, no el espacio en disco. Al eliminar una copia deja de contar aquí al momento; la base de datos reutiliza ese hueco más adelante, pero su tamaño en disco no baja al momento.',
  elegirExplica: 'Elige qué quieres recuperar. Solo se puede elegir lo que sigue como lo encontró la copia: lo que cambió después no se toca.',
  elegirTodo: 'Elegir todo lo que se puede',
  elegirNada: 'Quitar la selección',
  recuperarElegidos: 'Recuperar lo elegido…',
  elegidosNinguno: 'Elige al menos una cosa para recuperar.',
  piezaHecha: 'Ya está así.',
  piezaChoque: 'Cambió después: no se toca.',
  avisoVersionAntiguaUna: 'Una versión anterior de JosStyle intentó guardar un cambio en tu horario que no se aplicó. Está a salvo en Cambios apartados: ahí decides qué recuperar.',
  avisoVersionAntiguaVarias: 'Una versión anterior de JosStyle intentó guardar {n} cambios en tu horario que no se aplicaron. Están a salvo en Cambios apartados: ahí decides qué recuperar.',
  avisoVer: 'Ver',
  nueva: 'Nueva',
  esteAparato: 'Este aparato',
  otroAparato: 'Otro aparato',
});

/** Por qué no se pudo leer (lo que devuelve el transporte cuando no hay `ok`): la clave de su texto. */
export function motivoDeLectura(r) {
  if (!r) return 'error';
  if (r.sinFunciones) return 'sinFunciones';
  if (r.sesion) return 'sesion';
  if (r.sinRespuesta) return 'sinConexion';
  return 'error';
}

/** ¿Se puede recuperar ahora? `null` si sí; si no, el texto de por qué (de lo que enseña el escritor, `vista()`). */
export function motivoParaNoRecuperar({ escritor, soloLectura }) {
  if (soloLectura) return TEXTOS_CAMBIOS_APARTADOS.recuperarSoloLectura;
  if (!escritor) return TEXTOS_CAMBIOS_APARTADOS.recuperarNoAhora;
  if (escritor.conflicto) return TEXTOS_CAMBIOS_APARTADOS.recuperarConConflicto;
  if (escritor.enCola || escritor.guardando || escritor.estado !== 'en_orden') return TEXTOS_CAMBIOS_APARTADOS.recuperarNoAhora;
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · DESCRIBIR UNA COPIA Y EL ESPACIO
   =========================================================================== */
/** Bytes dichos para leer: «menos de 1 KB», «unos 12 KB», «unos 1,4 MB». Sin número válido, `null`. */
export function tamanoLegible(bytes) {
  const n = Number(bytes);
  if (bytes === null || bytes === undefined || bytes === '' || !Number.isFinite(n) || n < 0) return null;
  if (n < 1024) return 'menos de 1 KB';
  if (n < 1024 * 1024) return `unos ${Math.round(n / 1024)} KB`;
  return `unos ${(n / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];
/** «16 nov 2026, 10:32» en la hora del aparato. Sin fecha válida, `null`. */
export function fechaDeCopia(iso) {
  if (typeof iso !== 'string') return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

/** Una fila de la tabla (sin el contenido) dicha para la lista. `aparato`: el id de este aparato. */
export function describirCopia(fila, { aparato = null } = {}) {
  if (!esObjeto(fila) || typeof fila.id !== 'string') return null;
  const meta = esObjeto(fila.meta) ? fila.meta : {};
  const tipoOperacion = typeof meta.tipoOperacion === 'string' ? meta.tipoOperacion : null;
  const motivo = esObjeto(meta.motivo) ? meta.motivo.motivo : null;
  /* R5 — una copia de rescate o de versión antigua no es una operación: su título sale de la clave y de lo que pasó. */
  if (esCopiaCompleta(fila)) {
    const clave = typeof meta.clave === 'string' ? meta.clave : null;
    return {
      id: fila.id,
      tipo: fila.tipo,
      tipoTexto: TIPOS_COPIA[fila.tipo],
      tipoOperacion: null,
      titulo: tituloDeCopiaCompleta(fila.tipo, clave, meta.accion),
      fecha: fechaDeCopia(meta.creadaEn) || fechaDeCopia(fila.creada_en) || 'Sin fecha',
      deEsteAparato: !!aparato && fila.aparato === aparato,
      aparatoTexto: !!aparato && fila.aparato === aparato ? TEXTOS_CAMBIOS_APARTADOS.esteAparato : TEXTOS_CAMBIOS_APARTADOS.otroAparato,
      tamano: Number.isFinite(Number(fila.tamano)) ? Number(fila.tamano) : null,
      tamanoTexto: tamanoLegible(fila.tamano),
      nueva: fila.vista === false,
      motivo: null,
      motivoTexto: MOTIVOS_COPIA_COMPLETA[fila.tipo],
      claves: clave ? [clave] : [],
      conHorario: clave === 'horarioTop',
    };
  }
  return {
    id: fila.id,
    tipo: fila.tipo,
    tipoTexto: TIPOS_COPIA[fila.tipo] || 'Copia apartada',
    tipoOperacion,
    titulo: TITULOS_OPERACION[tipoOperacion] || 'Un cambio apartado',
    fecha: fechaDeCopia(meta.creadaEn) || fechaDeCopia(fila.creada_en) || 'Sin fecha',
    deEsteAparato: !!aparato && fila.aparato === aparato,
    aparatoTexto: !!aparato && fila.aparato === aparato ? TEXTOS_CAMBIOS_APARTADOS.esteAparato : TEXTOS_CAMBIOS_APARTADOS.otroAparato,
    tamano: Number.isFinite(Number(fila.tamano)) ? Number(fila.tamano) : null,
    tamanoTexto: tamanoLegible(fila.tamano),
    nueva: fila.vista === false,
    motivo,
    motivoTexto: MOTIVOS_APARTADA[motivo] || null,
    claves: lista(meta.claves).filter((k) => typeof k === 'string'),
    conHorario: meta.conHorario !== false,
  };
}

/**
 * El espacio, desde `protegido_espacio` (bytes de `pg_column_size`: el tamaño LÓGICO de lo guardado). Devuelve la
 * línea y su explicación, o `null` si no se sabe. 🚨 Nunca habla de disco liberado.
 */
export function textoDelEspacio(espacio) {
  if (!esObjeto(espacio) || espacio.medida !== 'logica' || !esObjeto(espacio.copias)) return null;
  const cuantas = Number(espacio.copias.cuantas);
  const bytes = Number(espacio.copias.bytes);
  if (!Number.isFinite(cuantas) || !Number.isFinite(bytes)) return null;
  if (cuantas === 0) return { linea: 'Tus cambios apartados no ocupan nada en tus datos guardados.', explica: TEXTOS_CAMBIOS_APARTADOS.espacioExplica, cuantas: 0, bytes: 0 };
  const t = tamanoLegible(bytes);
  return {
    linea: `Tus cambios apartados ocupan ${t} de datos guardados (${cuantas} ${cuantas === 1 ? 'copia' : 'copias'}).`,
    explica: TEXTOS_CAMBIOS_APARTADOS.espacioExplica,
    cuantas, bytes,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · QUÉ CONTIENE UNA OPERACIÓN (sin aplicar nada)
   =========================================================================== */
/* Cada lista con su nombre (singular, plural) y su género, para decir «1 clase quitada» y «1 examen quitado». */
const NOMBRES_LISTA = Object.freeze({
  horarioTop: { bloques: ['clase', 'clases', 'f'], actividades: ['actividad', 'actividades', 'f'], excepciones: ['excepción', 'excepciones', 'f'], horarios: ['horario', 'horarios', 'm'] },
  estudios: { asignaturas: ['asignatura', 'asignaturas', 'f'], examenes: ['examen', 'exámenes', 'm'], horas: ['sesión de estudio', 'sesiones de estudio', 'f'], temas: ['tema', 'temas', 'm'], entregas: ['entrega', 'entregas', 'f'], eventos: ['evento', 'eventos', 'm'], programas: ['área', 'áreas', 'f'] },
  papelera: { elementos: ['entrada de Eliminados recientes', 'entradas de Eliminados recientes', 'f'] },
});
const generoDe = (clave, campo) => (((NOMBRES_LISTA[clave] || {})[campo] || [])[2] === 'f' ? 'f' : 'm');
/** «quitada», «quitados»… con el género de la lista y el número. */
const participio = (raiz, clave, campo, n) => `${raiz}${generoDe(clave, campo) === 'f' ? 'a' : 'o'}${n === 1 ? '' : 's'}`;
const NOMBRES_CLAVE = Object.freeze({ horarioTop: 'Horario', estudios: 'Estudios', papelera: 'Eliminados recientes' });

const nombreDe = (clave, campo, n) => {
  const par = (NOMBRES_LISTA[clave] || {})[campo];
  if (par) return n === 1 ? par[0] : par[1];
  return n === 1 ? `elemento de ${campo}` : `elementos de ${campo}`;
};
const nombreElemento = (e) => (esObjeto(e) && typeof e.nombre === 'string' && e.nombre.trim() ? e.nombre.trim()
  : esObjeto(e) && typeof e.tema === 'string' && e.tema.trim() ? e.tema.trim() : null);

/** Los cambios de una clave dichos con palabras: «2 clases quitadas, 1 añadida». */
function frasesDeCambios(clave, cambios) {
  const porLista = new Map();
  let ajustes = 0;
  const marcas = [];
  for (const cb of lista(cambios)) {
    if (!esObjeto(cb)) continue;
    if (Array.isArray(cb.fijar)) { ajustes += cb.fijar.length; continue; }
    if (esObjeto(cb.conjunto)) {
      const campo = String(lista(cb.camino)[0] || '');
      const an = lista(cb.conjunto.anadir).length; const qu = lista(cb.conjunto.quitar).length;
      if (clave === 'horarioTop' && campo === 'completadas') {
        if (an) marcas.push(`${an} ${an === 1 ? 'clase marcada' : 'clases marcadas'} como ${an === 1 ? 'hecha' : 'hechas'}`);
        if (qu) marcas.push(`${qu} ${qu === 1 ? 'clase desmarcada' : 'clases desmarcadas'}`);
      } else {
        if (an) marcas.push(`${an} ${an === 1 ? 'valor añadido' : 'valores añadidos'} en ${campo}`);
        if (qu) marcas.push(`${qu} ${qu === 1 ? 'valor quitado' : 'valores quitados'} en ${campo}`);
      }
      continue;
    }
    const campo = String(lista(cb.camino)[lista(cb.camino).length - 1] || '');
    const acc = porLista.get(campo) || { quitar: [], anadir: [], reemplazar: 0 };
    for (const x of lista(cb.quitar)) acc.quitar.push(x && x.igual);
    for (const x of lista(cb.anadir)) acc.anadir.push(x && x.elemento);
    acc.reemplazar += lista(cb.reemplazar).length;
    porLista.set(campo, acc);
  }
  const frases = [];
  for (const [campo, a] of porLista) {
    const nombres = (arr) => arr.map(nombreElemento).filter(Boolean).slice(0, 3);
    if (a.quitar.length) {
      const ns = nombres(a.quitar);
      frases.push(`${a.quitar.length} ${nombreDe(clave, campo, a.quitar.length)} ${participio('quitad', clave, campo, a.quitar.length)}${ns.length ? ` (${ns.join(', ')})` : ''}`);
    }
    if (a.anadir.length) {
      const ns = nombres(a.anadir);
      frases.push(`${a.anadir.length} ${nombreDe(clave, campo, a.anadir.length)} ${participio('añadid', clave, campo, a.anadir.length)}${ns.length ? ` (${ns.join(', ')})` : ''}`);
    }
    if (a.reemplazar) frases.push(`${a.reemplazar} ${nombreDe(clave, campo, a.reemplazar)} ${participio('cambiad', clave, campo, a.reemplazar)}`);
  }
  frases.push(...marcas);
  if (ajustes) frases.push(`${ajustes} ${ajustes === 1 ? 'ajuste' : 'ajustes'}`);
  return frases;
}

/** El nombre de la asignatura que borra una operación (de su `quitar` en `estudios.asignaturas`), o `null`. */
export function asignaturaQueBorra(op) {
  if (!esObjeto(op)) return null;
  const c = lista(op.claves).find((x) => x && x.clave === 'estudios');
  if (!c) return null;
  for (const cb of lista(c.cambios)) {
    if (esObjeto(cb) && lista(cb.camino).length === 1 && cb.camino[0] === 'asignaturas' && lista(cb.quitar).length) {
      const x = cb.quitar[0];
      if (x && typeof x.id === 'string') return { id: x.id, nombre: nombreElemento(x.igual) };
    }
  }
  return null;
}

/** El título de la copia ya con su contenido: «Borrar la asignatura Biología». */
export function tituloConContenido(op) {
  if (!esObjeto(op)) return 'Un cambio apartado';
  if (op.tipo === 'borrar_asignatura') {
    const a = asignaturaQueBorra(op);
    if (a && a.nombre) return `Borrar la asignatura ${a.nombre}`;
  }
  return TITULOS_OPERACION[op.tipo] || 'Un cambio apartado';
}

/**
 * Lo que contiene una operación, clave a clave, sin aplicar nada: `[{ clave, nombre, frases }]`. El horario, de su
 * cambio por elementos; sin él, se dice que la copia trae el horario entero sin detalle.
 */
export function resumenDeOperacion(op) {
  if (!esObjeto(op)) return [];
  const res = [];
  if (esObjeto(op.horario)) {
    if (Array.isArray(op.horario.cambios)) {
      const f = frasesDeCambios('horarioTop', op.horario.cambios);
      res.push({ clave: 'horarioTop', nombre: NOMBRES_CLAVE.horarioTop, frases: f.length ? f : ['sin cambios en sus clases ni en sus ajustes'] });
    } else res.push({ clave: 'horarioTop', nombre: NOMBRES_CLAVE.horarioTop, frases: ['el horario entero (esta copia no trae el detalle de cada cambio)'] });
  }
  for (const c of lista(op.claves)) {
    if (!c || typeof c.clave !== 'string') continue;
    res.push({ clave: c.clave, nombre: NOMBRES_CLAVE[c.clave] || c.clave, frases: frasesDeCambios(c.clave, c.cambios) });
  }
  return res;
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · RECUPERAR SIN PISAR LO POSTERIOR
   =========================================================================== */
function obtenerEn(valor, camino) {
  let v = valor;
  for (const seg of lista(camino)) {
    if (typeof seg === 'string') { if (!esObjeto(v)) return undefined; v = v[seg]; } else if (esObjeto(seg) && typeof seg.id === 'string') {
      if (!Array.isArray(v)) return undefined;
      v = v.find((e) => esObjeto(e) && e.id === seg.id);
    } else return undefined;
    if (v === undefined) return undefined;
  }
  return v;
}
const enLista = (col, id) => (Array.isArray(col) ? col.find((e) => esObjeto(e) && e.id === id) : undefined);

/**
 * Parte un cambio en piezas de UN elemento (o un campo) y clasifica cada una contra `valor`:
 *   · `aplicable`: sigue como estaba (su condición se cumple): recuperarla no pisa nada;
 *   · `hecha`: ya está como la dejaría la copia: se salta;
 *   · `choque`: cambió después en otro aparato (o desapareció lo que tocaba): recuperarla lo pisaría.
 */
export function clasificarCambios(valor, cambios) {
  const piezas = [];
  for (const cb of lista(cambios)) {
    if (!esObjeto(cb)) { piezas.push({ estado: 'choque', motivo: 'ilegible', cambio: cb }); continue; }
    const camino = lista(cb.camino);
    if (Array.isArray(cb.fijar)) {
      const obj = obtenerEn(valor, camino);
      for (const x of cb.fijar) {
        const pieza = { camino, fijar: [x] };
        const actual = esObjeto(obj) && tiene(obj, x.campo) ? obj[x.campo] : null;
        if (igualJson(actual, x.valor)) piezas.push({ estado: 'hecha', cambio: pieza });
        else if (camino.length && obj === undefined) piezas.push({ estado: 'choque', motivo: 'camino_ausente', cambio: pieza });
        else if (!tiene(x, 'igual') || igualJson(actual, x.igual)) piezas.push({ estado: 'aplicable', cambio: pieza });
        else piezas.push({ estado: 'choque', motivo: 'campo_distinto', campo: x.campo, cambio: pieza });
      }
      continue;
    }
    if (esObjeto(cb.conjunto)) {
      /* Un conjunto (una lista de valores simples): añadir lo que falta y quitar lo que está. Nunca choca: lo que
         ya está como lo dejaría la copia se salta, y lo de otro aparato no se toca. */
      const actual = obtenerEn(valor, camino);
      const hay = new Set((Array.isArray(actual) ? actual : []).map(String));
      if (actual !== undefined && !Array.isArray(actual)) { piezas.push({ estado: 'choque', motivo: 'camino_no_es_lista', cambio: cb }); continue; }
      for (const x of lista(cb.conjunto.anadir)) piezas.push({ estado: hay.has(String(x)) ? 'hecha' : 'aplicable', cambio: { camino, conjunto: { anadir: [x], quitar: [] } } });
      for (const x of lista(cb.conjunto.quitar)) piezas.push({ estado: hay.has(String(x)) ? 'aplicable' : 'hecha', cambio: { camino, conjunto: { anadir: [], quitar: [x] } } });
      continue;
    }
    const col = obtenerEn(valor, camino);
    const colAusente = col === undefined && camino.length > 1;
    for (const x of lista(cb.quitar)) {
      const pieza = { camino, quitar: [x] };
      const e = enLista(col, x.id);
      if (colAusente || e === undefined) piezas.push({ estado: 'hecha', cambio: pieza });
      else if (igualJson(e, x.igual)) piezas.push({ estado: 'aplicable', cambio: pieza });
      else piezas.push({ estado: 'choque', motivo: 'elemento_distinto', id: x.id, cambio: pieza });
    }
    for (const x of lista(cb.reemplazar)) {
      const pieza = { camino, reemplazar: [x] };
      const e = enLista(col, x.id);
      if (e === undefined) piezas.push({ estado: 'choque', motivo: 'elemento_ausente', id: x.id, cambio: pieza });
      else if (igualJson(e, x.nuevo)) piezas.push({ estado: 'hecha', cambio: pieza });
      else if (igualJson(e, x.igual)) piezas.push({ estado: 'aplicable', cambio: pieza });
      else piezas.push({ estado: 'choque', motivo: 'elemento_distinto', id: x.id, cambio: pieza });
    }
    for (const x of lista(cb.anadir)) {
      const pieza = { camino, anadir: [x] };
      const id = esObjeto(x.elemento) ? x.elemento.id : null;
      const e = enLista(col, id);
      if (colAusente) piezas.push({ estado: 'choque', motivo: 'camino_ausente', cambio: pieza });
      else if (e === undefined) piezas.push({ estado: 'aplicable', cambio: pieza });
      else if (igualJson(e, x.elemento)) piezas.push({ estado: 'hecha', cambio: pieza });
      else piezas.push({ estado: 'choque', motivo: 'elemento_existe', id, cambio: pieza });
    }
    /* El orden de una lista no se recupera: no lleva condición y pisaría el de otro aparato. */
  }
  return piezas;
}

/** Aplica las piezas aplicables, una a una y CON su condición (si una falla, no se recupera nada). */
function aplicarPiezas(valor, piezas, clave) {
  let v = copiar(esObjeto(valor) ? valor : {});
  for (const p of piezas) {
    if (p.estado !== 'aplicable') continue;
    if (esObjeto(p.cambio.conjunto)) {
      const campo = lista(p.cambio.camino)[0];
      if (lista(p.cambio.camino).length !== 1 || typeof campo !== 'string') return { nuevo: null, fallo: { motivo: 'camino_no_es_lista', clave } };
      const actual = Array.isArray(v[campo]) ? v[campo] : [];
      const quitar = new Set(lista(p.cambio.conjunto.quitar).map(String));
      const anadir = lista(p.cambio.conjunto.anadir).filter((x) => !actual.map(String).includes(String(x)));
      v = { ...v, [campo]: [...actual.filter((x) => !quitar.has(String(x))), ...anadir] };
      continue;
    }
    const r = aplicarCambio(v, p.cambio, clave);
    if (r.fallo) return { nuevo: null, fallo: r.fallo };
    v = r.nuevo;
  }
  return { nuevo: v, fallo: null };
}

const sinMarcas = (v) => {
  if (!esObjeto(v)) return {};
  const o = { ...v };
  for (const k of CAMPOS_DE_MARCA_HORARIO) delete o[k];
  return o;
};
const leida = (x) => (esObjeto(x) ? { existe: !!x.existe, valor: x.existe ? x.valor : null } : { existe: false, valor: null });

const noRecuperable = (motivo, detalle = null) => ({ estado: 'no_recuperable', motivo, texto: MOTIVOS_NO_RECUPERABLE[motivo], detalle });

/**
 * Cómo se recuperaría HOY una copia (`fila`, con su `contenido`, que es la operación entera) sobre lo que hay ahora en
 * la cuenta (`actual`: `{ horarioTop, estudios, papelera }`, cada una `{ existe, valor }` tal como las devuelve
 * `protegido_leer`). No escribe nada. Devuelve:
 *   · `{ estado: 'recuperable', horario, claves: [{ clave, antes, despues, normalizar }], asunto, resumen }`: lo que
 *     hay que mandar por el escritor (`guardarOperacion`, tipo `recuperar_copia`) y lo que cambiará, con palabras;
 *   · `{ estado: 'ya_aplicada', resumen }`: todo lo de la copia ya está en la cuenta;
 *   · `{ estado: 'no_recuperable', motivo, texto, detalle }`: recuperarla pisaría algo posterior, o no se puede leer.
 */
export function prepararRecuperacion({ fila, actual, ahoraISO = new Date().toISOString(), elegidas = null } = {}) {
  if (!esObjeto(fila)) return noRecuperable('ilegible');
  if (esCopiaCompleta(fila)) return prepararCopiaCompleta({ fila, actual, elegidas });
  if (fila.tipo !== 'conflicto') return noRecuperable('tipo_desconocido');
  const op = fila.contenido;
  if (!esObjeto(op) || op.formato !== 1 || (op.horario !== undefined && op.horario !== null && !esObjeto(op.horario))) return noRecuperable('ilegible');
  const h = leida(actual && actual.horarioTop);
  const est = leida(actual && actual.estudios);
  const pap = leida(actual && actual.papelera);

  /* ── Borrar una asignatura: se REPITE sobre los datos de hoy. ── */
  const borrada = op.tipo === 'borrar_asignatura' ? asignaturaQueBorra(op) : null;
  if (borrada) {
    const estN = normalizarEstudiosCargados(est.valor || {});
    const papN = normalizarPapeleraCargada(pap.valor || {});
    const sigue = lista(estN.asignaturas).find((a) => a && a.id === borrada.id);
    const enHorario = h.existe ? asignaturaEnHorario(h.valor, borrada.id) : { enHorario: false, bloques: 0 };
    if (!sigue && !enHorario.enHorario) {
      return { estado: 'ya_aplicada', resumen: [borrada.nombre ? `La asignatura ${borrada.nombre} ya no está en tu cuenta.` : 'Esa asignatura ya no está en tu cuenta.'] };
    }
    if (!sigue) {
      /* Sin la asignatura pero con clases suyas en el horario: no se adivina qué pasó; se deja como está. */
      return noRecuperable('conflicto_posterior', 'La asignatura ya no está, pero quedan clases suyas en el horario.');
    }
    const plan = prepararBorradoAsignatura({ estudios: estN, papelera: papN, horarioTop: h.valor, id: borrada.id, ahoraISO });
    if (!plan) return noRecuperable('ilegible');
    const nombre = sigue.nombre || borrada.nombre || 'esa asignatura';
    const arr = (plan.entrada.relacionados || []).map((r) => `${r.elementos.length} ${nombreDe('estudios', r.coleccion, r.elementos.length)}`);
    const resumen = [
      `Se borrará la asignatura ${nombre} tal como está ahora${arr.length ? `, con ${arr.join(', ')}` : ''}.`,
      ...(plan.enHorario ? [`También se quitarán ${plan.bloques === 1 ? 'su clase' : `sus ${plan.bloques} clases`} del horario.`] : []),
      'Irá a Eliminados recientes, de donde se puede restaurar.',
    ];
    return {
      estado: 'recuperable',
      horario: plan.horario || copiar(h.valor) || {},
      claves: [
        { clave: 'estudios', antes: estN, despues: plan.estudios, normalizar: normalizarEstudiosCargados },
        { clave: 'papelera', antes: papN, despues: plan.papelera, normalizar: normalizarPapeleraCargada },
      ],
      asunto: { asignaturaId: borrada.id, nombre, accion: 'borrar' },
      resumen,
    };
  }

  /* ── El resto: elemento a elemento, con la condición de lo que había. ── */
  let aplicables = 0;
  let horarioNuevo = h.existe ? copiar(h.valor) : null;
  const resumen = [];
  if (esObjeto(op.horario)) {
    if (Array.isArray(op.horario.cambios)) {
      /* Por la misma puerta de carga con la que el escritor calculó el cambio (la de la pantalla). */
      const base = sinMarcas(h.existe && esObjeto(h.valor) ? normalizarHorarioTop(h.valor) : {});
      const piezas = clasificarCambios(base, op.horario.cambios);
      const choque = piezas.find((p) => p.estado === 'choque');
      if (choque) return noRecuperable('conflicto_posterior', textoDeChoque('horarioTop', choque));
      const ap = piezas.filter((p) => p.estado === 'aplicable');
      if (ap.length) {
        const r = aplicarPiezas(base, piezas, 'horarioTop');
        if (r.fallo) return noRecuperable('conflicto_posterior');
        horarioNuevo = { ...(esObjeto(h.valor) ? h.valor : {}), ...r.nuevo };
        aplicables += ap.length;
        resumen.push(`Horario: ${frasesDeCambios('horarioTop', ap.map((p) => p.cambio)).join(', ')}.`);
      }
    } else if (!igualJson(sinMarcas(h.existe && esObjeto(h.valor) ? normalizarHorarioTop(h.valor) : {}), sinMarcas(esObjeto(op.horario.valor) ? normalizarHorarioTop(op.horario.valor) : {}))) {
      return noRecuperable('sin_detalle');
    }
  }
  const claves = [];
  for (const c of lista(op.claves)) {
    if (!c || !['estudios', 'papelera'].includes(c.clave)) return noRecuperable('ilegible');
    const leidaC = c.clave === 'estudios' ? est : pap;
    const antes = leidaC.existe && esObjeto(leidaC.valor) ? leidaC.valor : (esObjeto(c.inicial) ? c.inicial : {});
    const piezas = clasificarCambios(antes, c.cambios);
    const choque = piezas.find((p) => p.estado === 'choque');
    if (choque) return noRecuperable('conflicto_posterior', textoDeChoque(c.clave, choque));
    const ap = piezas.filter((p) => p.estado === 'aplicable');
    if (!ap.length) continue;
    const r = aplicarPiezas(antes, piezas, c.clave);
    if (r.fallo) return noRecuperable('conflicto_posterior');
    aplicables += ap.length;
    /* `antes` es lo GUARDADO tal cual (no lo de la pantalla): la condición de cada elemento sale de ahí. */
    claves.push({ clave: c.clave, antes: copiar(antes), despues: r.nuevo, normalizar: (v) => v });
    resumen.push(`${NOMBRES_CLAVE[c.clave]}: ${frasesDeCambios(c.clave, ap.map((p) => p.cambio)).join(', ')}.`);
  }
  if (!aplicables) return { estado: 'ya_aplicada', resumen: ['Todo lo de esta copia ya está como en ella.'] };
  const toca = asignaturaQueToca(op);
  return {
    estado: 'recuperable',
    horario: horarioNuevo || {},
    claves,
    asunto: toca ? { asignaturaId: toca.id, nombre: toca.nombre, accion: 'restaurar' } : null,
    resumen,
  };
}

function textoDeChoque(clave, p) {
  const quien = NOMBRES_CLAVE[clave] || clave;
  const campo = lista(p.cambio && p.cambio.camino);
  const que = campo.length ? nombreDe(clave, String(campo[campo.length - 1]), 1) : 'ajuste';
  if (p.motivo === 'elemento_ausente') return `${quien}: una ${que} que tocaba se borró después.`;
  if (p.motivo === 'elemento_existe') return `${quien}: ya hay otra ${que} con el mismo identificador.`;
  if (p.motivo === 'campo_distinto' || (p.cambio && p.cambio.fijar)) return `${quien}: un ajuste que tocaba cambió después.`;
  return `${quien}: una ${que} que tocaba cambió después.`;
}

/** La primera asignatura que toca una operación (para el bloqueo de Estudios mientras se recupera, H-12). */
function asignaturaQueToca(op) {
  const c = lista(op.claves).find((x) => x && x.clave === 'estudios');
  if (!c) return null;
  for (const cb of lista(c.cambios)) {
    if (!esObjeto(cb) || lista(cb.camino)[0] !== 'asignaturas') continue;
    const x = lista(cb.anadir)[0] || lista(cb.quitar)[0] || lista(cb.reemplazar)[0];
    const e = x && (x.elemento || x.igual || x.nuevo);
    if (esObjeto(e) && typeof e.id === 'string') return { id: e.id, nombre: nombreElemento(e) };
  }
  return null;
}

/** El estado de la copia en la pantalla, de lo que dijo `prepararRecuperacion` (o `null`: sin comprobar). */
export function estadoDeCopia(preparacion) {
  if (!preparacion) return ESTADOS_COPIA.sin_comprobar;
  if (preparacion.estado === 'recuperable' || preparacion.estado === 'por_elementos') return ESTADOS_COPIA.pendiente;
  if (preparacion.estado === 'ya_aplicada') return ESTADOS_COPIA.recuperada;
  return ESTADOS_COPIA.no_recuperable;
}

/**
 * ¿Recuperarían lo mismo? Si al confirmar no sale lo mismo que en la vista previa, es que la cuenta cambió entretanto
 * y se vuelve a enseñar: nunca se recupera algo distinto de lo que él revisó.
 */
export function mismaRecuperacion(a, b) {
  if (!a || !b || a.estado !== 'recuperable' || b.estado !== 'recuperable') return false;
  const forma = (p) => [sinMarcas(p.horario), (p.claves || []).map((c) => [c.clave, c.despues])];
  return igualJson(forma(a), forma(b));
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · R5 — LAS COPIAS DE RESCATE Y DE VERSIÓN ANTIGUA (un valor entero, no una operación)
   =========================================================================== */
/** ¿Es una copia de la red de rescate (H-22) o del apartado de versiones antiguas (H-23)? */
export const esCopiaCompleta = (fila) => esObjeto(fila) && (fila.tipo === 'rescate' || fila.tipo === 'version_antigua');

/** Por qué existe (en la lista, debajo del título). */
export const MOTIVOS_COPIA_COMPLETA = Object.freeze({
  rescate: 'Se guardó a salvo: una versión anterior de JosStyle guardó encima sin comprobar lo que había.',
  version_antigua: 'No se aplicó: llegó de una versión anterior de JosStyle, que guarda sin comprobar lo que hay.',
});

/** «Tu horario: lo que había antes de que una versión anterior guardara encima». */
export function tituloDeCopiaCompleta(tipo, clave, accion = 'escritura') {
  const quien = NOMBRES_CLAVE[clave] || 'Tus datos';
  if (tipo === 'rescate') {
    return accion === 'borrado'
      ? `${quien}: lo que había antes de que una versión anterior lo borrara`
      : `${quien}: lo que había antes de que una versión anterior guardara encima`;
  }
  return `${quien}: lo que intentó guardar una versión anterior`;
}

const NORMALIZADORES_CLAVE = Object.freeze({ horarioTop: normalizarHorarioTop, estudios: normalizarEstudiosCargados, papelera: normalizarPapeleraCargada });

/**
 * Desde dónde y hacia dónde va la copia: `desde` es lo que hay que cambiar (lo que escribió la versión anterior, o lo
 * que había cuando intentó guardar) y `hacia` lo que trae la copia (lo que había antes, o lo que intentó guardar).
 * `null` si no se puede leer.
 */
export function lecturaDeCopiaCompleta(fila) {
  if (!esCopiaCompleta(fila)) return null;
  const c = fila.contenido;
  if (!esObjeto(c) || c.formato !== 1 || !CLAVES_RECUPERACION.includes(c.clave)) return null;
  if (fila.tipo === 'rescate') {
    if (!esObjeto(c.antes) || (c.despues !== null && c.despues !== undefined && !esObjeto(c.despues))) return null;
    return { clave: c.clave, desde: esObjeto(c.despues) ? c.despues : null, hacia: c.antes, borrado: !esObjeto(c.despues) };
  }
  if (!esObjeto(c.intentado) || (c.vigente !== null && c.vigente !== undefined && !esObjeto(c.vigente))) return null;
  return { clave: c.clave, desde: esObjeto(c.vigente) ? c.vigente : null, hacia: c.intentado, borrado: false };
}

/**
 * Las diferencias de la copia, por elementos, de `desde` a `hacia`, las dos por la puerta de carga de su clave (como
 * las ve la pantalla). Un campo que la copia no tiene no se cuenta: quitar un campo entero no se puede expresar sin
 * reescribir la clave, y no se hace. `{ clave, cambios, desde, hacia }` o `null`.
 */
export function cambiosDeCopiaCompleta(fila) {
  const l = lecturaDeCopiaCompleta(fila);
  if (!l) return null;
  const norm = NORMALIZADORES_CLAVE[l.clave];
  let desde; let hacia;
  try {
    desde = sinMarcas(l.desde ? norm(copiar(l.desde)) : {});
    hacia = sinMarcas(norm(copiar(l.hacia)));
  } catch { return null; }
  for (const k of Object.keys(desde)) if (!tiene(hacia, k) || hacia[k] === undefined) delete desde[k];
  let cambios;
  if (l.clave === 'horarioTop') cambios = cambiosDelHorario(desde, hacia);
  else {
    const r = calcularCambios(desde, hacia);
    cambios = r.ok ? r.cambios.map((cb) => { if (!Array.isArray(cb.orden)) return cb; const { orden, ...resto } = cb; return resto; })
      .filter((cb) => ['quitar', 'reemplazar', 'anadir', 'fijar'].some((k) => tiene(cb, k))) : null;
  }
  if (!Array.isArray(cambios)) return null;
  return { clave: l.clave, cambios, desde, hacia, borrado: l.borrado };
}

/** El nombre con el que se reconoce un elemento: la actividad y las horas de una clase, el nombre de lo demás. */
function nombreDePieza(clave, campo, e, contexto) {
  if (!esObjeto(e)) return null;
  if (clave === 'horarioTop' && campo === 'bloques') {
    const act = [contexto.hacia, contexto.desde].map((v) => (esObjeto(v) ? enLista(v.actividades, e.actividadId) : undefined)).find(Boolean);
    const nombre = (esObjeto(act) && typeof act.nombre === 'string' && act.nombre.trim()) || (typeof e.titulo === 'string' && e.titulo.trim()) || null;
    const horas = typeof e.inicio === 'string' && typeof e.fin === 'string' ? `${e.inicio}–${e.fin}` : null;
    if (nombre && horas) return `«${nombre}» (${horas})`;
    return nombre ? `«${nombre}»` : horas ? `de ${horas}` : null;
  }
  if (clave === 'horarioTop' && campo === 'excepciones' && typeof e.fecha === 'string') return `del ${e.fecha}`;
  const n = nombreElemento(e);
  return n ? `«${n}»` : null;
}

/** Una pieza dicha como lo que haría recuperarla: «Volver a poner la clase «Física» (08:00–09:00)». */
export function textoDePieza(tipo, clave, cambio, contexto = {}) {
  const rescate = tipo === 'rescate';
  const camino = lista(cambio && cambio.camino);
  if (esObjeto(cambio && cambio.conjunto)) {
    const campo = String(camino[0] || '');
    const an = lista(cambio.conjunto.anadir).length; const qu = lista(cambio.conjunto.quitar).length;
    if (clave === 'horarioTop' && campo === 'completadas') {
      if (an) return `${rescate ? 'Volver a marcar' : 'Marcar'} como hecha ${an === 1 ? 'una clase' : `${an} clases`}`;
      return `${rescate ? 'Volver a desmarcar' : 'Desmarcar'} ${qu === 1 ? 'una clase' : `${qu} clases`}`;
    }
    return an ? `${rescate ? 'Volver a añadir' : 'Añadir'} un valor en ${campo}` : `${rescate ? 'Volver a quitar' : 'Quitar'} un valor de ${campo}`;
  }
  if (cambio && Array.isArray(cambio.fijar)) {
    const campo = cambio.fijar[0] && cambio.fijar[0].campo;
    return rescate ? `Volver a dejar «${campo}» como estaba` : `Dejar «${campo}» como lo guardaba la versión anterior`;
  }
  const campo = String(camino[camino.length - 1] || '');
  const par = (NOMBRES_LISTA[clave] || {})[campo];
  const art = generoDe(clave, campo) === 'f' ? 'la' : 'el';
  const sing = par ? par[0] : 'elemento';
  const x = lista(cambio && (cambio.anadir || cambio.quitar || cambio.reemplazar))[0] || {};
  const e = x.elemento || x.nuevo || x.igual;
  const nombre = nombreDePieza(clave, campo, e, contexto);
  const cosa = `${art} ${sing}${nombre ? ` ${nombre}` : ''}`;
  if (cambio.anadir) return rescate ? `Volver a poner ${cosa}` : `Añadir ${cosa}`;
  if (cambio.quitar) return rescate ? `Quitar ${cosa}, que puso la versión anterior` : `Quitar ${cosa}`;
  return rescate ? `Volver a dejar ${cosa} como estaba` : `Dejar ${cosa} como lo guardaba la versión anterior`;
}

/** Qué contiene una copia de rescate o de versión antigua, dicho como en `resumenDeOperacion`. */
function resumenDeCopiaCompleta(fila) {
  const x = cambiosDeCopiaCompleta(fila);
  if (!x) return [];
  const nombre = NOMBRES_CLAVE[x.clave] || x.clave;
  const frases = frasesDeCambios(x.clave, x.cambios);
  let frase;
  if (fila.tipo === 'rescate') {
    const queEs = x.borrado ? 'lo que había antes de que una versión anterior lo borrara' : 'lo que había antes de que una versión anterior guardara encima';
    frase = frases.length ? `${queEs}. Recuperarlo todo supondría: ${frases.join(', ')}` : `${queEs}. No hay diferencias con lo que guardó encima`;
  } else {
    frase = frases.length ? `lo que intentó guardar una versión anterior. Aplicarlo todo supondría: ${frases.join(', ')}` : 'lo que intentó guardar una versión anterior. No hay diferencias con lo que había entonces';
  }
  return [{ clave: x.clave, nombre, frases: [frase] }];
}

/** Qué contiene CUALQUIER copia (la operación de un conflicto, o el valor de un rescate o de una versión antigua). */
export function resumenDeCopia(fila) {
  if (!esObjeto(fila)) return [];
  if (esCopiaCompleta(fila)) return resumenDeCopiaCompleta(fila);
  return resumenDeOperacion(fila.contenido);
}

/**
 * Cómo se recuperaría hoy una copia de rescate o de versión antigua. Sin `elegidas`, las piezas para que él elija:
 * `{ estado: 'por_elementos', piezas: [{ id, estado, texto, motivo }] }` (o `ya_aplicada` si todo está ya así, o
 * `no_recuperable` si todo cambió después). Con `elegidas` (ids de pieza), el plan para mandar (`recuperable`, como
 * en R4: `horario`, `claves`, `resumen`) SOLO si todas las elegidas siguen sin cambiar; si no, `no_recuperable`.
 */
function prepararCopiaCompleta({ fila, actual, elegidas }) {
  const x = cambiosDeCopiaCompleta(fila);
  if (!x) return noRecuperable('ilegible');
  if (x.clave !== 'horarioTop') return noRecuperable('clave_sin_recuperacion');
  const h = leida(actual && actual.horarioTop);
  const base = sinMarcas(h.existe && esObjeto(h.valor) ? normalizarHorarioTop(h.valor) : {});
  const contexto = { desde: x.desde, hacia: x.hacia };
  const piezas = clasificarCambios(base, x.cambios).map((p, i) => ({
    id: `p${i}`, estado: p.estado, motivo: p.motivo || null, cambio: p.cambio,
    texto: textoDePieza(fila.tipo, x.clave, p.cambio, contexto),
  }));
  const aplicables = piezas.filter((p) => p.estado === 'aplicable');
  if (!aplicables.length) {
    if (piezas.some((p) => p.estado === 'choque')) return { ...noRecuperable('todo_cambio'), piezas };
    return { estado: 'ya_aplicada', resumen: ['Todo lo de esta copia ya está como en ella.'], piezas };
  }
  const sel = Array.isArray(elegidas) ? [...new Set(elegidas.filter((id) => typeof id === 'string'))].sort() : [];
  if (!sel.length) return { estado: 'por_elementos', piezas, resumen: [] };
  const elegidasP = piezas.filter((p) => sel.includes(p.id));
  if (elegidasP.length !== sel.length || elegidasP.some((p) => p.estado !== 'aplicable')) {
    return { ...noRecuperable('conflicto_posterior', 'Algo de lo que elegiste cambió después.'), piezas };
  }
  const r = aplicarPiezas(base, elegidasP, 'horarioTop');
  if (r.fallo) return { ...noRecuperable('conflicto_posterior'), piezas };
  return {
    estado: 'recuperable',
    horario: { ...(h.existe && esObjeto(h.valor) ? h.valor : {}), ...r.nuevo },
    claves: [],
    asunto: null,
    resumen: elegidasP.map((p) => `${p.texto}.`),
    elegidas: sel,
    piezas,
  };
}

/** El aviso de lo que una versión anterior intentó guardar y no se aplicó (H-23), de las copias sin ver. `null` si no hay. */
export function avisoDeVersionesAntiguas(filas) {
  const n = lista(filas).filter((f) => esObjeto(f) && f.tipo === 'version_antigua' && f.vista === false).length;
  if (!n) return null;
  return { cuantas: n, texto: n === 1 ? TEXTOS_CAMBIOS_APARTADOS.avisoVersionAntiguaUna : TEXTOS_CAMBIOS_APARTADOS.avisoVersionAntiguaVarias.replace('{n}', String(n)) };
}
