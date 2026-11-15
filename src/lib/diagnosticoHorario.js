// ============================================================================
// HORARIOS · FASE 4, ENTREGA A — EL DIAGNÓSTICO DE SOLO LECTURA (`docs/19` §12.2)
//
// `diagnosticoHorarios(crudo)` mira lo que llegó de la cuenta **tal cual, sin
// normalizar**, y cuenta lo que hay y lo que el rediseño tendrá que tratar antes
// de migrar nada (`docs/19` §0.2, N1–N6, y §12.4). Lo llama el panel de solo
// lectura de la pantalla de Horario, en el iPhone de Josué, con los datos que la
// aplicación YA ha cargado (TP-4): ni una consulta nueva, ni SQL, ni red.
//
// 🚨 ES UNA FUNCIÓN PURA, Y NO ESCRIBE NADA:
//   · no importa `supabase.js`, ni `saveData`, ni ninguna pantalla;
//   · no modifica `crudo` (trabaja sobre lo que lee; la única copia que hace es
//     la normalización en memoria que usa para los choques, y no sale de aquí);
//   · no devuelve ningún dato personal entero: nombres de campos, recuentos y
//     fechas, nunca el texto de una nota ni un título.
//
// Distingue tres cosas, como pide la entrega:
//   · `recuentos`    — lo observado, sin juicio;
//   · `hallazgos`    — lo que conviene mirar, con su gravedad:
//                        `riesgo` → lo que la carga de hoy transforma o pierde al
//                                   guardar (N2–N5, P12): la entrega B lo migrará;
//                        `aviso`  → se conserva, pero probablemente no hace lo que
//                                   parece (no se ve, choca, apunta a nada);
//                        `info`   → un dato a tener en cuenta para el rediseño;
//   · `limitaciones` — lo que este diagnóstico NO puede saber.
// ============================================================================

import {
  normalizarHorarioTop, conflictosDelDia, guardiaDeVersionHorario, versionDeHorario, VERSION_HORARIO,
  CAMPOS_CONOCIDOS_HORARIO, CAMPOS_DE_LA_GUARDIA_HORARIO, TIPOS_EXCEPCION, CLASES_RECURRENCIA, VISTAS_ACTIVIDAD, estructuraDeHorario, tipoDeValor,
} from './horario';
import { todayISO, addDays, horaValida, fechaValida } from './helpers';

/** Días que se recorren para contar los choques: dos semanas cubren las alternas. */
export const DIAS_DIAGNOSTICO = 14;

export const GRAVEDADES_DIAGNOSTICO = Object.freeze([
  { id: 'riesgo', nombre: 'Se transforma al cargar' },
  { id: 'aviso', nombre: 'Conviene revisarlo' },
  { id: 'info', nombre: 'Para tener en cuenta' },
]);

const esObjeto = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const lista = (x) => (Array.isArray(x) ? x : []);
/* Cuántos hay en una colección: `null` si NO es una lista (no se puede contar, y
   decir «0» la presentaría como vacía). Ausente o guardada como `null`, 0. */
const cuenta = (x) => (Array.isArray(x) ? x.length : x === null || x === undefined ? 0 : null);
/**
 * El estado de una colección TAL CUAL SE GUARDÓ, sin convertir nada:
 *   · `ausente`        — no está (un campo que una versión anterior no tenía);
 *   · `nula`           — guardada como `null`: no tiene nada que se pueda perder;
 *   · `vacia`          — una lista sin elementos;
 *   · `con_elementos`  — una lista con elementos;
 *   · `ilegible`       — no es una lista: no se puede contar, y NUNCA se presenta como vacía.
 */
export function estadoDeColeccion(v) {
  if (v === undefined) return 'ausente';
  if (v === null) return 'nula';
  if (!Array.isArray(v)) return 'ilegible';
  return v.length ? 'con_elementos' : 'vacia';
}

/**
 * El resumen de una colección INTERNA (la que va dentro de cada horario, actividad o clase)
 * sobre todos sus contenedores: cuántas listas hay en cada estado, cuántos elementos se leen
 * y cuántos no (un elemento de otro tipo del que la guardia espera).
 * `total` es el número de elementos solo si TODO se pudo leer; si una lista o un elemento no
 * se puede leer, es `null` («No se puede leer»): un recuento parcial se leería como completo.
 * `padreIlegible` dice que la colección PRINCIPAL que la contiene (horarios, actividades o
 * clases) no se pudo leer entera: entonces no se sabe cuántas internas hay, y el total
 * también es `null`, nunca el 0 de no haber visto ningún contenedor.
 */
export function resumenDeColeccionInterna(contenedores, campo, quiere = 'objeto', { padreIlegible = false } = {}) {
  const r = { campo, padreIlegible, listas: 0, ausentes: 0, nulas: 0, vacias: 0, conElementos: 0, ilegibles: 0, elementos: 0, elementosIlegibles: 0, total: 0 };
  for (const c of contenedores) {
    const estado = estadoDeColeccion(c[campo]);
    if (estado === 'ausente') { r.ausentes += 1; continue; }
    if (estado === 'nula') { r.nulas += 1; continue; }
    if (estado === 'ilegible') { r.ilegibles += 1; continue; }
    r.listas += 1;
    if (estado === 'vacia') { r.vacias += 1; continue; }
    r.conElementos += 1;
    for (const x of c[campo]) {
      if (x === null || x === undefined) continue;
      const vale = quiere === 'texto' ? typeof x === 'string' : esObjeto(x);
      if (vale) r.elementos += 1; else r.elementosIlegibles += 1;
    }
  }
  r.total = padreIlegible || r.ilegibles || r.elementosIlegibles ? null : r.elementos;
  return r;
}

/** Hasta seis rutas, para enseñar dónde está lo que falla sin un muro de texto. */
const algunas = (rutas) => (rutas.length > 6 ? `${rutas.slice(0, 6).join(', ')} y ${rutas.length - 6} más` : rutas.join(', '));
const tieneId = (x) => esObjeto(x) && typeof x.id === 'string' && x.id.trim() !== '';

/** Bytes de un valor en JSON (UTF-8), o `null` si no se puede medir. */
export function bytesDe(valor) {
  if (valor === undefined) return 0;
  try {
    const texto = JSON.stringify(valor);
    if (texto === undefined) return 0;
    return new TextEncoder().encode(texto).length;
  } catch {
    // Un valor que no se puede pasar a JSON (un ciclo) no se puede medir: se dice.
    return null;
  }
}

/** Ids que aparecen más de una vez en una lista. */
function repetidos(items) {
  const vistos = new Map();
  for (const x of items) if (tieneId(x)) vistos.set(x.id, (vistos.get(x.id) || 0) + 1);
  return [...vistos.values()].filter((n) => n > 1).reduce((s, n) => s + n - 1, 0);
}

/** Nombres de los campos que esta versión no conoce, por tipo de entidad. Solo nombres. */
function camposDesconocidosDe(items, conocidas) {
  const nombres = new Set();
  for (const x of items) if (esObjeto(x)) for (const k of Object.keys(x)) if (!conocidas.includes(k)) nombres.add(k);
  return [...nombres].sort();
}

/**
 * El diagnóstico de lo que hay guardado en `horarioTop`.
 *
 * @param crudo       lo que devolvió `loadData` para `horarioTop`, SIN normalizar.
 * @param asignaturas las asignaturas de Estudios (para saber si una actividad apunta a una que existe).
 *                    `null` = no se sabe, y esa comprobación no se hace.
 * @param cargaFallida `true` si la carga de `horarioTop` falló: entonces `crudo` es el valor por
 *                    defecto, no lo de la cuenta, y no se diagnostica nada.
 */
export function diagnosticoHorarios(crudo, { asignaturas = null, cargaFallida = false, hoy = todayISO(), dias = DIAS_DIAGNOSTICO } = {}) {
  const limitaciones = [
    'Mira los datos que la aplicación cargó de tu cuenta al abrirse. Si los cambiaste en otro dispositivo después, no lo ve hasta que recargues.',
    'No modifica nada: solo cuenta. Lo que señala se corregirá en una entrega posterior, con copia antes de tocar nada.',
  ];

  if (cargaFallida) {
    return {
      estado: 'sin_cargar', version: null, tamanos: null, recuentos: null, hallazgos: [], camposDesconocidos: {},
      limitaciones: ['El horario no se pudo cargar de tu cuenta, así que no hay nada que diagnosticar. Recarga la aplicación con conexión.'],
    };
  }

  const v = versionDeHorario(crudo);
  const guardia = guardiaDeVersionHorario(crudo);
  const version = { ...v, conocida: VERSION_HORARIO, soloLectura: guardia.soloLectura, motivo: guardia.motivo };
  const forma = estructuraDeHorario(crudo);

  if (!esObjeto(crudo)) {
    const ausente = crudo === null || crudo === undefined;
    return {
      estado: ausente ? 'vacio' : 'no_es_objeto',
      version, tamanos: { horarioTop: bytesDe(crudo) }, recuentos: null, camposDesconocidos: {},
      hallazgos: ausente ? [] : [{
        id: 'no_es_objeto', gravedad: 'riesgo', cantidad: 1,
        titulo: 'Lo guardado no tiene la forma de un horario',
        detalle: `Es ${tipoDeValor(crudo) === 'lista' ? 'una lista' : `un valor de tipo ${tipoDeValor(crudo)}`}, no un objeto. La pantalla lo enseña vacío, pero no se guarda nada encima: lo de tu cuenta se conserva tal cual.`,
      }],
      limitaciones,
    };
  }

  const horariosCrudos = lista(crudo.horarios);
  const horarios = horariosCrudos.filter(esObjeto);
  const bloquesCrudos = lista(crudo.bloques);
  const bloques = bloquesCrudos.filter(esObjeto);
  const excepcionesCrudas = lista(crudo.excepciones);
  const excepciones = excepcionesCrudas.filter(esObjeto);
  const actividadesCrudas = lista(crudo.actividades);
  const actividades = actividadesCrudas.filter(esObjeto);
  const columnas = horarios.flatMap((h) => lista(h.columnas).filter(esObjeto).map((c) => ({ c, h })));
  const filas = horarios.flatMap((h) => lista(h.filas).filter(esObjeto));

  /* 🔎 Las colecciones internas que vigila la guardia, con su estado de verdad. Las listas
     `columnas` y `filas` de arriba solo sirven para buscar anomalías DENTRO de lo que se lee;
     lo que se CUENTA sale de aquí, que distingue vacía de ilegible. */
  /* 🔎 La colección PRINCIPAL que contiene las internas no se puede leer entera si no es una
     lista (`lista()` la deja en `[]`) o si alguno de sus elementos no es un objeto
     (`filter(esObjeto)` lo deja fuera, y lo que llevara dentro no se vería): en los dos casos su
     recuento interno no es 0 ni el parcial de los que sí se leen, es «No se puede leer».
     Ausente, `null` o `[]` sí se leen (no hay contenedores: 0 es la respuesta correcta), y un
     elemento `null` o `undefined` es un hueco, no un elemento malformado: no guarda nada. */
  const ilegible = (v) => estadoDeColeccion(v) === 'ilegible';
  const conElementoMalformado = (v) => Array.isArray(v) && v.some((x) => x !== null && x !== undefined && !esObjeto(x));
  const principalIlegible = (v) => ilegible(v) || conElementoMalformado(v);
  const padre = {
    horarios: { padreIlegible: principalIlegible(crudo.horarios) },
    actividades: { padreIlegible: principalIlegible(crudo.actividades) },
    bloques: { padreIlegible: principalIlegible(crudo.bloques) },
  };
  const internas = {
    columnas: resumenDeColeccionInterna(horarios, 'columnas', 'objeto', padre.horarios),
    filas: resumenDeColeccionInterna(horarios, 'filas', 'objeto', padre.horarios),
    materialActividades: resumenDeColeccionInterna(actividades, 'material', 'texto', padre.actividades),
    aliasActividades: resumenDeColeccionInterna(actividades, 'alias', 'texto', padre.actividades),
    etiquetasActividades: resumenDeColeccionInterna(actividades, 'etiquetas', 'texto', padre.actividades),
    etiquetasClases: resumenDeColeccionInterna(bloques, 'etiquetas', 'texto', padre.bloques),
  };
  /* Si una colección no se puede leer, no se puede afirmar que algo «no existe» en ella:
     esas comprobaciones de referencias se saltan (y se dice). */
  const horariosSinColumnasLegibles = new Set(horarios.filter((h) => ilegible(h.columnas)).map((h) => h.id));
  const referenciasSaltadas = [];

  const horarioPorId = new Map(horarios.filter(tieneId).map((h) => [h.id, h]));
  const columnaPorId = new Map();
  for (const { c, h } of columnas) if (tieneId(c)) columnaPorId.set(`${h.id}::${c.id}`, c);
  const idsActividad = new Set(actividades.filter(tieneId).map((a) => a.id));
  const idsBloque = new Set(bloques.filter(tieneId).map((b) => b.id));

  const hallazgos = [];
  const anotar = (id, gravedad, cantidad, titulo, detalle) => {
    if (cantidad > 0) hallazgos.push({ id, gravedad, cantidad, titulo, detalle });
  };

  // ── La forma: colecciones que no son lo que el normalizador espera ───────
  // Van primero: una colección que no es una lista se leería como vacía, y
  // guardar encima la borraría. Por eso la guardia no deja guardar.
  anotar('colecciones_malformadas', 'riesgo', forma.problemas.length,
    'Partes del horario con una forma que no se puede leer',
    `${algunas(forma.problemas.map((x) => `${x.ruta} (se esperaba ${x.esperado}, hay ${x.encontrado})`))}. La pantalla las enseña vacías, pero no se guarda nada encima: lo de tu cuenta se conserva tal cual.`);
  anotar('colecciones_nulas', 'aviso', forma.nulos.length,
    'Partes del horario guardadas sin contenido',
    `${algunas(forma.nulos)}. Se leen como vacías; no hay nada en ellas que se pueda perder.`);

  // ── Los horarios ────────────────────────────────────────────────────────
  const estadoDe = (h) => (h.archivado ? 'archivados' : h.activo === false ? 'inactivos' : 'activos');
  const porEstado = { activos: 0, archivados: 0, inactivos: 0 };
  for (const h of horarios) porEstado[estadoDe(h)] += 1;

  anotar('horarios_no_objeto', 'riesgo', horariosCrudos.length - horarios.length,
    'Horarios que no se pueden leer', 'Al cargar se convierten en un horario vacío nuevo.');
  anotar('horarios_sin_id', 'riesgo', horarios.filter((h) => !tieneId(h)).length,
    'Horarios sin identificador', 'Reciben uno distinto en cada carga, así que sus clases dejan de encontrarlos.');
  anotar('horarios_id_repetido', 'aviso', repetidos(horarios),
    'Horarios con el identificador repetido', 'Las clases de uno pueden aparecer en el otro.');

  // ── Columnas ────────────────────────────────────────────────────────────
  const diaValido = (c) => Number.isInteger(c.dia) && c.dia >= 1 && c.dia <= 7;
  const columnasSinDia = columnas.filter(({ c }) => !diaValido(c));
  const clavesSinDia = new Set(columnasSinDia.map(({ c, h }) => `${h.id}::${c.id}`));
  const columnasOcultas = new Set(columnas.filter(({ c }) => c.visible === false).map(({ c, h }) => `${h.id}::${c.id}`));
  anotar('columnas_sin_id', 'riesgo', columnas.filter(({ c }) => !tieneId(c)).length,
    'Columnas sin identificador', 'Reciben uno distinto en cada carga y sus clases dejan de caer en ellas.');
  anotar('filas_sin_id', 'riesgo', filas.filter((f) => !tieneId(f)).length,
    'Franjas sin identificador', 'Reciben uno distinto en cada carga.');

  // ── Ciclos (P1) ─────────────────────────────────────────────────────────
  const conCiclo = horarios.filter((h) => esObjeto(h.ciclo) && Number(h.ciclo.semanas) > 1);
  const columnasConGrupo = columnas.filter(({ c }) => typeof c.grupo === 'string' && c.grupo.trim() !== '');
  anotar('ciclos_con_grupo', 'info', conCiclo.length && columnasConGrupo.length ? columnasConGrupo.length : 0,
    'Columnas de un ciclo de semanas',
    'Hoy cada columna con día se repite todas las semanas, aunque sea de la semana B: el rediseño tiene que decidir qué semana es cuál.');

  // ── Reglas (bloques) ────────────────────────────────────────────────────
  const claveDe = (b) => `${b.horarioId}::${b.columnaId}`;
  const sinHorarioOColumna = bloques.filter((b) => !b.horarioId || !b.columnaId);
  const conAmbos = bloques.filter((b) => b.horarioId && b.columnaId);
  anotar('reglas_no_objeto', 'riesgo', bloquesCrudos.length - bloques.length,
    'Clases que no se pueden leer', 'Al cargar se descartan.');
  anotar('reglas_sin_horario_o_columna', 'riesgo', sinHorarioOColumna.length,
    'Clases sin horario o sin día',
    'Al cargar se descartan, y el siguiente guardado las borra de la cuenta.');
  anotar('reglas_sin_id', 'riesgo', bloques.filter((b) => !tieneId(b)).length,
    'Clases sin identificador',
    'Reciben uno distinto en cada carga: un cambio de un solo día deja de encontrarlas.');
  anotar('reglas_id_repetido', 'aviso', repetidos(bloques),
    'Clases con el identificador repetido', 'Editar una puede cambiar la otra.');
  if (ilegible(crudo.horarios)) referenciasSaltadas.push('qué clases son de un horario que ya no existe');
  else anotar('reglas_horario_inexistente', 'aviso', conAmbos.filter((b) => !horarioPorId.has(b.horarioId)).length,
    'Clases de un horario que ya no existe', 'Se guardan, pero no salen en ninguna pantalla.');
  // Una clase de un horario cuyas columnas no se pueden leer NO es de «una columna que ya no existe».
  const columnasLegibles = (b) => !horariosSinColumnasLegibles.has(b.horarioId);
  if (horariosSinColumnasLegibles.size) referenciasSaltadas.push('a qué columna van las clases de los horarios cuyas columnas no se pueden leer');
  anotar('reglas_columna_inexistente', 'aviso',
    conAmbos.filter((b) => horarioPorId.has(b.horarioId) && columnasLegibles(b) && !columnaPorId.has(claveDe(b))).length,
    'Clases de una columna que ya no existe', 'Se guardan, pero no salen en ninguna pantalla.');
  anotar('reglas_en_columna_sin_dia', 'aviso', conAmbos.filter((b) => clavesSinDia.has(claveDe(b))).length,
    'Clases en columnas que no son un día',
    'No caen en ninguna fecha: no salen en Hoy ni en el Calendario.');
  anotar('reglas_en_columna_oculta', 'aviso', conAmbos.filter((b) => columnasOcultas.has(claveDe(b))).length,
    'Clases en columnas ocultas', 'No salen en ninguna fecha mientras la columna siga oculta.');

  const horaMala = (b) => (b.inicio !== undefined && b.inicio !== '' && !horaValida(b.inicio))
    || (b.fin !== undefined && b.fin !== '' && !horaValida(b.fin));
  const finAntes = (b) => horaValida(b.inicio) && horaValida(b.fin) && b.fin <= b.inicio;
  anotar('reglas_hora_invalida', 'aviso', bloques.filter(horaMala).length,
    'Clases con una hora que no es una hora', 'No se pueden colocar en el día.');
  anotar('reglas_fin_antes_de_inicio', 'aviso', bloques.filter(finAntes).length,
    'Clases que terminan antes de empezar (o a la vez)', 'Duran cero o menos.');

  const recurrencias = bloques.map((b) => b.recurrencia).filter((r) => r !== undefined && r !== null);
  const claseRec = (r) => (esObjeto(r) ? r.clase : undefined);
  const recurrenciaConocida = (r) => CLASES_RECURRENCIA.some((c) => c.id === claseRec(r));
  const alternas = recurrencias.filter((r) => claseRec(r) === 'alternas');
  anotar('reglas_alternas', 'info', alternas.length,
    'Clases de semanas alternas', 'El rediseño las convierte en un ciclo de semanas.');
  anotar('reglas_alternas_sin_ancla', 'aviso', alternas.filter((r) => !fechaValida(r.ancla)).length,
    'Clases alternas sin la semana de referencia', 'Sin ella no se sabe en qué semana tocan.');
  anotar('reglas_recurrencia_desconocida', 'riesgo', recurrencias.filter((r) => !recurrenciaConocida(r)).length,
    'Clases con una repetición que esta versión no conoce',
    'Al cargar se leen como «todas las semanas».');

  if (ilegible(crudo.actividades)) referenciasSaltadas.push('qué clases son de una actividad que ya no existe');
  else anotar('reglas_actividad_inexistente', 'aviso',
    bloques.filter((b) => b.actividadId && !idsActividad.has(b.actividadId)).length,
    'Clases de una actividad que ya no existe', 'Se enseñan con su título o como «Sin nombre».');
  // P10 — los bloques que crea el planificador no llevan marca propia (`crearBloque` no
  // guarda `tipo`), así que solo se puede dar un indicio: bloques con título y sin actividad.
  anotar('reglas_sin_actividad', 'info', bloques.filter((b) => !b.actividadId).length,
    'Clases sin actividad',
    'Entre ellas pueden estar los bloques de estudio que añade el planificador: no llevan ninguna marca que los distinga.');

  // ── Excepciones ─────────────────────────────────────────────────────────
  const tipoConocido = (x) => TIPOS_EXCEPCION.some((t) => t.id === x.tipo);
  anotar('excepciones_no_objeto', 'riesgo', excepcionesCrudas.length - excepciones.length,
    'Cambios de un día que no se pueden leer', 'Al cargar se convierten en una cancelación de hoy.');
  anotar('excepciones_fecha_invalida', 'riesgo', excepciones.filter((x) => !fechaValida(x.fecha)).length,
    'Cambios de un día sin una fecha válida', 'Al cargar pasan a la fecha del día en que se abre la aplicación.');
  anotar('excepciones_tipo_desconocido', 'riesgo', excepciones.filter((x) => !tipoConocido(x)).length,
    'Cambios de un día de un tipo que esta versión no conoce', 'Al cargar se leen como «No hay».');
  anotar('excepciones_sin_id', 'riesgo', excepciones.filter((x) => !tieneId(x)).length,
    'Cambios de un día sin identificador', 'Reciben uno distinto en cada carga.');
  if (ilegible(crudo.bloques)) referenciasSaltadas.push('qué cambios de un día son de una clase que ya no existe');
  else anotar('excepciones_clase_inexistente', 'aviso',
    excepciones.filter((x) => x.bloqueId && !idsBloque.has(x.bloqueId)).length,
    'Cambios de un día de una clase que ya no existe', 'No cambian nada.');

  // ── Actividades ─────────────────────────────────────────────────────────
  anotar('actividades_no_objeto', 'riesgo', actividadesCrudas.length - actividades.length,
    'Actividades que no se pueden leer', 'Al cargar se convierten en una actividad vacía nueva.');
  anotar('actividades_sin_id', 'riesgo', actividades.filter((a) => !tieneId(a)).length,
    'Actividades sin identificador', 'Reciben uno distinto en cada carga y sus clases dejan de encontrarlas.');
  anotar('actividades_id_repetido', 'aviso', repetidos(actividades),
    'Actividades con el identificador repetido', 'Sus clases pueden enseñar la que no es.');
  if (Array.isArray(asignaturas)) {
    const idsAsig = new Set(asignaturas.filter(tieneId).map((a) => a.id));
    anotar('actividades_asignatura_inexistente', 'aviso',
      actividades.filter((a) => a.asignaturaId && !idsAsig.has(a.asignaturaId)).length,
      'Actividades de una asignatura que ya no está en Estudios', 'Se enseñan con su nombre guardado.');
  }

  // ── Campos que esta versión no conoce (solo los nombres) ────────────────
  const camposDesconocidos = {
    horarioTop: Object.keys(crudo).filter((k) => !CAMPOS_DE_LA_GUARDIA_HORARIO.includes(k) && !CAMPOS_CONOCIDOS_HORARIO.horarioTop.includes(k)).sort(),
    horario: camposDesconocidosDe(horarios, CAMPOS_CONOCIDOS_HORARIO.horario),
    columna: camposDesconocidosDe(columnas.map(({ c }) => c), CAMPOS_CONOCIDOS_HORARIO.columna),
    fila: camposDesconocidosDe(filas, CAMPOS_CONOCIDOS_HORARIO.fila),
    actividad: camposDesconocidosDe(actividades, CAMPOS_CONOCIDOS_HORARIO.actividad),
    visibilidad: camposDesconocidosDe(actividades.map((a) => a.visibilidad), VISTAS_ACTIVIDAD),
    bloque: camposDesconocidosDe(bloques, CAMPOS_CONOCIDOS_HORARIO.bloque),
    recurrencia: camposDesconocidosDe(recurrencias, CAMPOS_CONOCIDOS_HORARIO.recurrencia),
    excepcion: camposDesconocidosDe(excepciones, CAMPOS_CONOCIDOS_HORARIO.excepcion),
    cambios: camposDesconocidosDe(excepciones.map((x) => x.cambios), CAMPOS_CONOCIDOS_HORARIO.cambios),
  };
  for (const k of Object.keys(camposDesconocidos)) if (!camposDesconocidos[k].length) delete camposDesconocidos[k];
  const totalDesconocidos = Object.values(camposDesconocidos).reduce((s, l) => s + l.length, 0);
  anotar('campos_desconocidos', 'info', totalDesconocidos,
    'Campos que esta versión no conoce',
    'Se conservan tal cual al cargar y al guardar.');

  // ── Choques con la regla de hoy ─────────────────────────────────────────
  // Se usa el MISMO detector que la pantalla (`conflictosDelDia`) sobre una copia
  // normalizada en memoria, día a día: lo que cuenta es lo que la aplicación ve hoy.
  let choques = { pares: 0, ocurrencias: 0, entreHorarios: 0, dias };
  try {
    const norm = normalizarHorarioTop(crudo);
    const pares = new Map();
    for (let i = 0; i < dias; i += 1) {
      const fecha = addDays(hoy, i);
      for (const [a, b] of conflictosDelDia(norm, fecha, { asignaturas: Array.isArray(asignaturas) ? asignaturas : [] })) {
        const ida = a.bloqueId || `+${a.inicio}-${a.fin}`;
        const idb = b.bloqueId || `+${b.inicio}-${b.fin}`;
        const clave = [ida, idb].sort().join('|');
        const previo = pares.get(clave) || { ocurrencias: 0, entreHorarios: a.horarioId !== b.horarioId };
        previo.ocurrencias += 1;
        pares.set(clave, previo);
      }
    }
    choques = {
      pares: pares.size,
      ocurrencias: [...pares.values()].reduce((s, p) => s + p.ocurrencias, 0),
      entreHorarios: [...pares.values()].filter((p) => p.entreHorarios).length,
      dias,
    };
  } catch {
    limitaciones.push('No se han podido contar los choques: algún dato no se deja leer.');
  }
  anotar('choques', 'aviso', choques.pares,
    `Clases que se pisan en los próximos ${dias} días`,
    choques.entreHorarios ? `${choques.entreHorarios} de ellas son entre dos horarios distintos.` : 'Todas dentro del mismo horario.');
  if (conCiclo.length && columnasConGrupo.length) {
    limitaciones.push('Con un ciclo de semanas, los choques pueden incluir clases de semanas distintas: hoy se repiten todas las semanas.');
  }
  limitaciones.push(`Los choques se cuentan en los próximos ${dias} días desde hoy, con la regla que usa hoy la aplicación.`);

  // ── Tamaños ─────────────────────────────────────────────────────────────
  const tamanos = {
    horarioTop: bytesDe(crudo),
    mochila: bytesDe(crudo.mochila),
    completadas: bytesDe(crudo.completadas),
  };

  // Una colección que no es una lista no se cuenta como 0: es `null` («no se puede leer»).
  const recuentos = {
    horarios: { total: cuenta(crudo.horarios), ...porEstado, conCiclo: conCiclo.length },
    // Con una lista de columnas que no se puede leer, ninguna cifra de columnas es completa: `null`.
    columnas: internas.columnas.total === null
      ? { total: null, sinDia: null, ocultas: null, conGrupo: null }
      : { total: columnas.length, sinDia: columnasSinDia.length, ocultas: columnasOcultas.size, conGrupo: columnasConGrupo.length },
    filas: { total: internas.filas.total },
    // El estado de cada colección interna, para quien necesite distinguir vacía de ilegible.
    colecciones: internas,
    reglas: cuenta(crudo.bloques),
    excepciones: cuenta(crudo.excepciones),
    actividades: cuenta(crudo.actividades),
    mochila: cuenta(crudo.mochila),
    completadas: cuenta(crudo.completadas),
    choques,
  };

  if (forma.problemas.length) {
    limitaciones.push('Las cifras de una parte que no se puede leer no se cuentan: salen como «No se puede leer».');
  }
  if (referenciasSaltadas.length) {
    limitaciones.push(`Con una parte que no se puede leer no se comprueba ${referenciasSaltadas.join(', ni ')}.`);
  }
  const orden = { riesgo: 0, aviso: 1, info: 2 };
  hallazgos.sort((a, b) => orden[a.gravedad] - orden[b.gravedad]);

  // Con una colección malformada NO es «vacío»: hay datos, solo que no se pueden leer.
  const vacio = !forma.problemas.length
    && !horariosCrudos.length && !bloquesCrudos.length && !excepcionesCrudas.length && !actividadesCrudas.length;
  return { estado: vacio ? 'vacio' : 'con_datos', version, tamanos, recuentos, hallazgos, camposDesconocidos, limitaciones };
}

/** El texto de un tamaño en bytes, para leerlo. */
export function textoDeTamano(bytes) {
  if (bytes === null || bytes === undefined) return 'No se puede medir';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2).replace('.', ',')} MB`;
}
