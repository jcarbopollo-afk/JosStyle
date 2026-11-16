/**
 * 🛡 HORARIOS · E1-R, R2 — LA OPERACIÓN PROTEGIDA, EN EL CLIENTE (docs/19 §18.15 y §18.16).
 *
 * El servidor (R1, `supabase/horarios-protegido.sql`) guarda una operación ENTERA o no guarda nada. Este archivo es
 * la mitad del cliente de ese contrato, y nada más:
 *   · **la forma** (formato 1): `opId`, `tipo`, `manual`, `aparato`, `versionApp`, `creadaEn`; el **horario** con su
 *     base y su valor con el testigo nuevo (D3); y **claves** (`estudios` y `papelera`, la lista cerrada de R1) con
 *     **cambios por elemento**. `validarOperacion` es el espejo de `protegido_interno.validar`: una operación que el
 *     servidor rechazaría no sale (un fallo del cliente no es un conflicto);
 *   · **los cambios por elemento**: `aplicarCambio` es el espejo de `protegido_interno.aplicar_cambio` (las mismas
 *     condiciones y el mismo orden: quitar, reemplazar, añadir, ordenar; o fijar campos). Sirve para lo que el cliente
 *     tiene que saber hacer igual que el servidor —enseñar el resultado, comprobar una operación antes de mandarla— y,
 *     **sin condiciones**, para llevar una operación ya aplicada a lo pendiente de la cola (`sincronizacion.js`);
 *   · **calcular** qué cambió entre lo que se veía y lo que se ve (`calcularCambios`), y **preparar** las condiciones
 *     con lo GUARDADO, nunca con lo de pantalla (`prepararCambios`): lo de pantalla pasó por los normalizadores y,
 *     comparado con lo guardado, daría conflictos falsos siempre. Si lo guardado, normalizado, no es lo que él vio,
 *     la condición se escribe con lo que vio: entonces es el SERVIDOR quien decide (y aparta) — el cliente nunca
 *     escribe sobre algo que él no ha visto;
 *   · **el protocolo** (`protegido_protocolo`): qué versión habla el servidor, la versión mínima de la aplicación y la
 *     hora del servidor, para fechar las operaciones sin depender del reloj del aparato.
 *
 * Reglas que cumple (y `scripts/test-operaciones-protegidas.mjs` comprueba, también contra el servidor de verdad en
 * `scripts/test-cliente-protegido-postgrest.mjs`):
 *   · 🚨 **ninguna clave se reescribe entera**: lo que no se puede decir por elementos (una lista sin `id`, un campo
 *     que desaparece) se condiciona con `fijar … igual`, o, si ni eso, se niega (`inexpresable`): nunca a ciegas;
 *   · la comparación de igualdad es la de `jsonb` (`textoCanonico`: el orden de las claves de un objeto no cuenta,
 *     el de una lista sí);
 *   · una operación ya preparada **no se vuelve a construir**: un reintento lleva el MISMO objeto (el servidor guarda
 *     su huella, y con otro contenido contestaría `op_distinta`).
 *
 * ⚠️ Es una HOJA del árbol de imports (solo importa `guardiaHorario.js`, que también lo es): la importan el escritor
 * de operaciones y `sincronizacion.js`.
 */
import { textoCanonico, nuevoUuid, compararVersiones } from './guardiaHorario';

/* ═══════════════════════════════════════════════════════════════════════════
   0 · EL CONTRATO
   =========================================================================== */
/** La forma de operación que habla este cliente (la de R1). */
export const FORMATO_OPERACION = 1;
/** La versión del protocolo del servidor que entiende este cliente. Otra cualquiera: solo lectura, nunca a ciegas. */
export const VERSION_PROTOCOLO = 1;
/** Las claves que una operación puede tocar por elementos (además de `horarioTop`). La MISMA lista que
 *  `protegido_interno.claves_permitidas()`: una clave más aquí sin estar allí sería una operación inválida. */
export const CLAVES_POR_ELEMENTOS = Object.freeze(['estudios', 'papelera']);
/** Los tipos de operación. El servidor solo exige un texto no vacío; esta lista es la del diseño (§18.15):
 *  `recuperar_copia` lo usará la pantalla de cambios apartados (R4); los de la Fase 4 y E3 no existen todavía. */
export const TIPOS_OPERACION = Object.freeze(['editar_horario', 'aviso_automatico', 'borrar_asignatura', 'deshacer', 'recuperar_copia']);
/** Los estados con los que contesta `protegido_aplicar`, y `protegido_estado` (`desconocida`). */
export const ESTADOS_SERVIDOR = Object.freeze(['aplicada', 'conflicto', 'caducada', 'invalida', 'sin_sesion', 'desconocida']);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esObjeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const tiene = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const copiar = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
/** Igualdad de `jsonb`: el orden de las claves de un objeto no cuenta; el de una lista, sí. */
export const igualJson = (a, b) => textoCanonico(a === undefined ? null : a) === textoCanonico(b === undefined ? null : b);
const congelar = (v) => {
  if (v && typeof v === 'object') { Object.values(v).forEach(congelar); Object.freeze(v); }
  return v;
};

/* ═══════════════════════════════════════════════════════════════════════════
   1 · CREAR Y VALIDAR
   =========================================================================== */
/** Un `opId` nuevo (uuid v4 de `crypto`; nunca `Math.random`). Sin aleatoriedad segura, `null`: no hay operación. */
export const nuevoOpId = (crypto = globalThis.crypto) => nuevoUuid(crypto);

/**
 * Construye una operación CONGELADA (`Object.freeze` en todos los niveles): una vez creada, su contenido no cambia, y
 * así un reintento manda exactamente lo mismo. `horario` es `{ base, baseExiste, valor }` (el valor con su testigo
 * nuevo) o se omite; `claves` es `[{ clave, cambios, inicial? }]`, solo las que tienen algún cambio.
 */
export function crearOperacion({ opId, tipo, manual, aparato = null, versionApp = null, creadaEn, horario = null, claves = [] } = {}) {
  const op = { formato: FORMATO_OPERACION, opId, tipo, manual, aparato, versionApp, creadaEn };
  if (horario) op.horario = { base: horario.base === undefined ? null : horario.base, baseExiste: horario.baseExiste, valor: copiar(horario.valor) };
  const conCambios = (claves || []).filter((c) => c && Array.isArray(c.cambios) && c.cambios.length);
  if (conCambios.length) op.claves = conCambios.map((c) => ({ clave: c.clave, cambios: copiar(c.cambios), ...(c.inicial !== undefined ? { inicial: copiar(c.inicial) } : {}) }));
  return congelar(op);
}

const caminoValido = (camino) => Array.isArray(camino) && camino.every((s) => typeof s === 'string' || (esObjeto(s) && typeof s.id === 'string'));
const esTimestampValido = (t) => typeof t === 'string' && !Number.isNaN(Date.parse(t));

/**
 * El espejo de `protegido_interno.validar`: `null` si el servidor la aceptaría, o el MISMO motivo que daría él
 * (`forma`, `formato`, `opId`, `tipo`, `manual`, `creadaEn`, `horario`, `horario_revision`, `horario_base`,
 * `horario_baseExiste`, `horario_revision_repetida`, `claves`, `clave`, `clave_no_permitida`, `clave_repetida`,
 * `inicial`, `cambios`, `cambio`, `camino`, `cambio_mezclado`, `cambio_vacio`, `camino_lista`, `quitar`, `reemplazar`,
 * `anadir`, `anadir_posicion`, `orden`, `fijar`, `vacia`). La prueba de nivel 3 compara los dos lados.
 */
export function validarOperacion(op) {
  if (!esObjeto(op)) return 'forma';
  if (op.formato !== 1) return 'formato';
  if (typeof op.opId !== 'string' || !UUID.test(op.opId)) return 'opId';
  if (typeof op.tipo !== 'string' || !op.tipo.length) return 'tipo';
  if (typeof op.manual !== 'boolean') return 'manual';
  if (typeof op.creadaEn !== 'string' || !esTimestampValido(op.creadaEn)) return 'creadaEn';
  const h = op.horario;
  if (h !== undefined && h !== null) {
    if (!esObjeto(h) || !esObjeto(h.valor) || !esObjeto(h.valor.testigo)) return 'horario';
    const rev = h.valor.testigo.revision;
    if (typeof rev !== 'string' || !rev.length) return 'horario_revision';
    if (tiene(h, 'base') && h.base !== null && typeof h.base !== 'string') return 'horario_base';
    if (typeof h.baseExiste !== 'boolean') return 'horario_baseExiste';
    if ((h.base === undefined ? null : h.base) === rev) return 'horario_revision_repetida';
  }
  if (tiene(op, 'claves') && !Array.isArray(op.claves)) return 'claves';
  const vistas = [];
  for (const c of op.claves || []) {
    if (!esObjeto(c) || typeof c.clave !== 'string') return 'clave';
    if (!CLAVES_POR_ELEMENTOS.includes(c.clave)) return 'clave_no_permitida';
    if (vistas.includes(c.clave)) return 'clave_repetida';
    vistas.push(c.clave);
    if (tiene(c, 'inicial') && !esObjeto(c.inicial)) return 'inicial';
    if (!Array.isArray(c.cambios) || !c.cambios.length) return 'cambios';
    for (const cb of c.cambios) {
      if (!esObjeto(cb)) return 'cambio';
      if (!caminoValido(tiene(cb, 'camino') ? cb.camino : [])) return 'camino';
      const colecc = ['quitar', 'reemplazar', 'anadir', 'orden'].some((k) => tiene(cb, k));
      if (colecc && tiene(cb, 'fijar')) return 'cambio_mezclado';
      if (!colecc && !tiene(cb, 'fijar')) return 'cambio_vacio';
      if (colecc && !(cb.camino || []).length) return 'camino_lista';
      for (const x of cb.quitar || []) if (!esObjeto(x) || typeof x.id !== 'string' || !tiene(x, 'igual')) return 'quitar';
      for (const x of cb.reemplazar || []) {
        if (!esObjeto(x) || typeof x.id !== 'string' || !tiene(x, 'igual') || !esObjeto(x.nuevo) || x.nuevo.id !== x.id) return 'reemplazar';
      }
      for (const x of cb.anadir || []) {
        if (!esObjeto(x) || !esObjeto(x.elemento) || typeof x.elemento.id !== 'string') return 'anadir';
        if (tiene(x, 'posicion') && typeof x.posicion !== 'number') return 'anadir_posicion';
      }
      if (tiene(cb, 'orden') && (!Array.isArray(cb.orden) || cb.orden.some((s) => typeof s !== 'string'))) return 'orden';
      if (tiene(cb, 'fijar')) {
        if (!Array.isArray(cb.fijar)) return 'fijar';
        for (const x of cb.fijar) if (!esObjeto(x) || typeof x.campo !== 'string' || !tiene(x, 'valor')) return 'fijar';
      }
    }
  }
  if ((h === undefined || h === null) && !(op.claves || []).length) return 'vacia';
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · APLICAR UN CAMBIO (el espejo de `protegido_interno.aplicar_cambio`)
   =========================================================================== */
const indice = (col, id) => (Array.isArray(col) ? col.findIndex((e) => esObjeto(e) && e.id === id) : -1);

function caminoExiste(valor, camino) {
  let v = valor;
  for (const seg of camino) {
    if (typeof seg === 'string') {
      if (v === null || v === undefined) { v = undefined; continue; }
      if (!esObjeto(v)) return false;
      v = v[seg];
    } else {
      if (!Array.isArray(v)) return false;
      const i = indice(v, seg.id);
      if (i < 0) return false;
      v = v[i];
    }
  }
  return true;
}

function obtener(valor, camino) {
  let v = valor;
  for (const seg of camino) {
    if (v === null || v === undefined) return undefined;
    if (typeof seg === 'string') { if (!esObjeto(v)) return undefined; v = v[seg]; } else {
      if (!Array.isArray(v)) return undefined;
      const i = indice(v, seg.id);
      if (i < 0) return undefined;
      v = v[i];
    }
  }
  return v;
}

function poner(valor, camino, nuevo) {
  if (!camino.length) return nuevo;
  const [seg, ...resto] = camino;
  if (typeof seg === 'string') {
    const base = esObjeto(valor) ? valor : {};
    return { ...base, [seg]: poner(base[seg], resto, nuevo) };
  }
  const i = indice(valor, seg.id);
  const lista = valor.slice();
  lista[i] = poner(valor[i], resto, nuevo);
  return lista;
}

/**
 * Aplica UN cambio a un valor, en memoria, sin tocar el original: `{ nuevo, fallo }`. Con una condición que falla,
 * `fallo` es el mismo objeto que daría el servidor (`{ motivo, clave, camino, id | campo }`) y `nuevo` es el valor de
 * antes. `sinCondiciones: true` aplica lo que se pueda sin comprobar nada (quitar lo que esté, reemplazar lo que
 * esté, añadir lo que falte, fijar): es para llevar una operación YA APLICADA en la cuenta a lo pendiente de la cola,
 * nunca para escribir en la cuenta.
 */
export function aplicarCambio(valor, cambio, clave, { sinCondiciones = false } = {}) {
  const camino = Array.isArray(cambio && cambio.camino) ? cambio.camino : [];
  const falla = (motivo, extra = {}) => ({ nuevo: valor, fallo: { motivo, clave, camino, ...extra } });
  if (!caminoExiste(valor, camino)) return sinCondiciones ? { nuevo: valor, fallo: null } : falla('camino_ausente');

  if (tiene(cambio, 'fijar')) {
    let obj = obtener(valor, camino);
    if (obj === null || obj === undefined) obj = {};
    if (!esObjeto(obj)) return sinCondiciones ? { nuevo: valor, fallo: null } : falla('camino_no_es_objeto');
    obj = { ...obj };
    for (const x of cambio.fijar) {
      if (!sinCondiciones && tiene(x, 'igual') && !igualJson(tiene(obj, x.campo) ? obj[x.campo] : null, x.igual)) return falla('campo_distinto', { campo: x.campo });
      obj[x.campo] = copiar(x.valor);
    }
    return { nuevo: poner(valor, camino, obj), fallo: null };
  }

  let col = obtener(valor, camino);
  if (col === null || col === undefined) col = [];
  if (!Array.isArray(col)) return sinCondiciones ? { nuevo: valor, fallo: null } : falla('camino_no_es_lista');
  col = col.slice();
  for (const x of cambio.quitar || []) {
    const i = indice(col, x.id);
    if (i < 0) { if (sinCondiciones) continue; return falla('elemento_ausente', { id: x.id }); }
    if (!sinCondiciones && !igualJson(col[i], x.igual)) return falla('elemento_distinto', { id: x.id });
    col.splice(i, 1);
  }
  for (const x of cambio.reemplazar || []) {
    const i = indice(col, x.id);
    if (i < 0) { if (sinCondiciones) continue; return falla('elemento_ausente', { id: x.id }); }
    if (!sinCondiciones && !igualJson(col[i], x.igual)) return falla('elemento_distinto', { id: x.id });
    col[i] = copiar(x.nuevo);
  }
  for (const x of cambio.anadir || []) {
    if (indice(col, x.elemento.id) >= 0) { if (sinCondiciones) continue; return falla('elemento_existe', { id: x.elemento.id }); }
    const pos = tiene(x, 'posicion') ? Math.max(0, Math.floor(x.posicion)) : null;
    if (pos === null || pos >= col.length) col.push(copiar(x.elemento));
    else col.splice(pos, 0, copiar(x.elemento));
  }
  if (Array.isArray(cambio.orden)) {
    const lugar = (e) => { const p = esObjeto(e) ? cambio.orden.indexOf(e.id) : -1; return p < 0 ? Number.MAX_SAFE_INTEGER : p; };
    col = col.map((e, o) => ({ e, o })).sort((a, b) => (lugar(a.e) - lugar(b.e)) || (a.o - b.o)).map((x) => x.e);
  }
  return { nuevo: poner(valor, camino, col), fallo: null };
}

/** Aplica todos los cambios de una clave en orden. Al primer fallo para y devuelve el valor de antes con el fallo. */
export function aplicarCambios(valor, cambios, clave, opciones = {}) {
  let v = valor;
  for (const cb of cambios || []) {
    const r = aplicarCambio(v, cb, clave, opciones);
    if (r.fallo) return { nuevo: valor, fallo: r.fallo };
    v = r.nuevo;
  }
  return { nuevo: v, fallo: null };
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · CALCULAR LOS CAMBIOS Y PREPARAR SUS CONDICIONES
   =========================================================================== */
/** ¿Se puede comparar esta lista elemento a elemento? Todos objetos, con `id` de texto, sin repetir. */
export function listaPorElementos(lista) {
  if (!Array.isArray(lista)) return false;
  const ids = new Set();
  for (const e of lista) {
    if (!esObjeto(e) || typeof e.id !== 'string' || ids.has(e.id)) return false;
    ids.add(e.id);
  }
  return true;
}

/**
 * Qué cambió entre dos valores de una clave (objetos), en la forma que entiende el servidor. Cada campo de primer
 * nivel:
 *   · dos listas comparables por elementos → `{ camino: [campo], quitar, reemplazar, anadir, orden? }` (`igual` es el
 *     elemento de `antes`; `prepararCambios` lo cambia por el guardado);
 *   · cualquier otra diferencia → `fijar` en la raíz, con su `igual` (nunca a ciegas);
 *   · un campo que desaparece no se puede decir sin reescribir la clave: `{ ok: false, motivo: 'campo_quitado' }`.
 * Devuelve `{ ok: true, cambios }` (vacío si no cambió nada) o `{ ok: false, motivo, campo }`.
 */
export function calcularCambios(antes, despues) {
  const a = esObjeto(antes) ? antes : {};
  if (!esObjeto(despues)) return { ok: false, motivo: 'no_es_objeto' };
  const cambios = [];
  const fijar = [];
  for (const campo of Object.keys(a)) {
    if (a[campo] !== undefined && (!tiene(despues, campo) || despues[campo] === undefined)) return { ok: false, motivo: 'campo_quitado', campo };
  }
  for (const campo of Object.keys(despues)) {
    const va = tiene(a, campo) ? a[campo] : undefined;
    const vd = despues[campo];
    if (vd === undefined || igualJson(va, vd)) continue;
    if (listaPorElementos(va === undefined ? [] : va) && listaPorElementos(vd)) {
      const antesL = va === undefined ? [] : va;
      const idsD = new Set(vd.map((e) => e.id));
      const porIdA = new Map(antesL.map((e) => [e.id, e]));
      const quitar = antesL.filter((e) => !idsD.has(e.id)).map((e) => ({ id: e.id, igual: copiar(e) }));
      const reemplazar = vd.filter((e) => porIdA.has(e.id) && !igualJson(porIdA.get(e.id), e))
        .map((e) => ({ id: e.id, igual: copiar(porIdA.get(e.id)), nuevo: copiar(e) }));
      const anadir = vd.filter((e) => !porIdA.has(e.id)).map((e) => ({ elemento: copiar(e) }));
      const resultado = [...antesL.filter((e) => idsD.has(e.id)).map((e) => e.id), ...anadir.map((x) => x.elemento.id)];
      const orden = vd.map((e) => e.id);
      const cambio = { camino: [campo] };
      if (quitar.length) cambio.quitar = quitar;
      if (reemplazar.length) cambio.reemplazar = reemplazar;
      if (anadir.length) cambio.anadir = anadir;
      if (resultado.join('\u0000') !== orden.join('\u0000')) cambio.orden = orden;
      if (Object.keys(cambio).length > 1) cambios.push(cambio);
    } else {
      fijar.push({ campo, igual: va === undefined ? null : copiar(va), valor: copiar(vd) });
    }
  }
  if (fijar.length) cambios.push({ camino: [], fijar });
  return { ok: true, cambios };
}

/**
 * Prepara los cambios de una clave para mandarlos: las condiciones salen de lo GUARDADO (`guardado`, tal como lo
 * devuelve `protegido_leer`), no de lo que se ve. Para cada elemento que se quita o se reemplaza, y para cada campo
 * que se fija:
 *   · si lo guardado, pasado por `normalizar`, es lo que él vio (`antes`), la condición es lo guardado tal cual (así
 *     el servidor encuentra lo que espera aunque la pantalla lo enseñe normalizado);
 *   · si no (otro aparato lo cambió, o todavía no llegó un guardado de este), la condición es LO QUE ÉL VIO: el
 *     servidor no lo encontrará y la operación no se aplicará (y, si es manual, se apartará). Nunca se escribe sobre
 *     algo que él no ha visto, y el cliente no decide el conflicto por su cuenta.
 * `normalizar(valorCrudo)` es la puerta de carga de esa clave en la aplicación (la que produjo `antes`). Devuelve
 * `{ ok, cambios, inicial?, motivo? }`; sin cambios, `cambios` vacío.
 */
export function prepararCambios({ antes, despues, guardado = { existe: false, valor: null }, normalizar = (v) => v } = {}) {
  const calc = calcularCambios(antes, despues);
  if (!calc.ok) return { ok: false, motivo: calc.motivo, campo: calc.campo };
  const crudo = guardado && guardado.existe && esObjeto(guardado.valor) ? guardado.valor : {};
  let normal;
  try { normal = normalizar(copiar(crudo)); } catch { normal = null; }
  const elementoGuardado = (campo, id) => {
    const lista = crudo[campo];
    const i = indice(lista, id);
    return i < 0 ? undefined : lista[i];
  };
  const elementoNormal = (campo, id) => {
    const lista = esObjeto(normal) ? normal[campo] : undefined;
    const i = indice(lista, id);
    return i < 0 ? undefined : lista[i];
  };
  const condicion = (vio, guardadoEl, normalEl) => (guardadoEl !== undefined && normalEl !== undefined && igualJson(normalEl, vio) ? copiar(guardadoEl) : copiar(vio));
  const cambios = calc.cambios.map((cb) => {
    if (cb.fijar) {
      return {
        camino: [],
        fijar: cb.fijar.map((x) => {
          const g = tiene(crudo, x.campo) ? crudo[x.campo] : null;
          const n = esObjeto(normal) && tiene(normal, x.campo) ? normal[x.campo] : null;
          return { campo: x.campo, igual: igualJson(n, x.igual) ? copiar(g) : copiar(x.igual), valor: x.valor };
        }),
      };
    }
    const campo = cb.camino[0];
    const r = { camino: cb.camino };
    if (cb.quitar) r.quitar = cb.quitar.map((x) => ({ id: x.id, igual: condicion(x.igual, elementoGuardado(campo, x.id), elementoNormal(campo, x.id)) }));
    if (cb.reemplazar) r.reemplazar = cb.reemplazar.map((x) => ({ id: x.id, igual: condicion(x.igual, elementoGuardado(campo, x.id), elementoNormal(campo, x.id)), nuevo: x.nuevo }));
    if (cb.anadir) r.anadir = cb.anadir;
    if (cb.orden) r.orden = cb.orden;
    return r;
  });
  return { ok: true, cambios, ...(guardado && guardado.existe ? {} : { inicial: {} }) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · EL PROTOCOLO Y LA HORA DEL SERVIDOR
   =========================================================================== */
/**
 * Lo que contesta `protegido_protocolo()`, leído. `{ ok: true, desfaseMs, reglas, versionMinima }` si este cliente
 * puede escribir; si no, `{ ok: false, motivo }`:
 *   · `protocolo_distinto`: el servidor habla otra versión;
 *   · `version_antigua`: esta aplicación es más vieja que la mínima («Recarga la aplicación»);
 *   · `protocolo_ilegible`: la respuesta no se entiende.
 * `desfaseMs` es lo que hay que sumar al reloj del aparato para tener la hora del servidor (medida a la mitad del
 * viaje de la petición).
 */
export function leerProtocolo(resp, { versionApp = null, enviadoEn = Date.now(), recibidoEn = Date.now() } = {}) {
  if (!esObjeto(resp) || !Number.isInteger(resp.version)) return { ok: false, motivo: 'protocolo_ilegible' };
  if (resp.version !== VERSION_PROTOCOLO) return { ok: false, motivo: 'protocolo_distinto', version: resp.version };
  const minima = typeof resp.versionMinima === 'string' && resp.versionMinima ? resp.versionMinima : null;
  if (minima && (!versionApp || compararVersiones(String(versionApp), minima) < 0)) return { ok: false, motivo: 'version_antigua', versionMinima: minima };
  const ahora = typeof resp.ahora === 'string' ? Date.parse(resp.ahora) : NaN;
  const desfaseMs = Number.isNaN(ahora) ? 0 : Math.round(ahora - (enviadoEn + recibidoEn) / 2);
  return { ok: true, desfaseMs, reglas: esObjeto(resp.reglas) ? { ...resp.reglas } : {}, versionMinima: minima };
}

/** La hora del servidor según el desfase medido: con la que se fecha `creadaEn` (TP-12). */
export const horaDelServidor = (desfaseMs = 0, ahora = Date.now()) => new Date(ahora + (Number(desfaseMs) || 0)).toISOString();
