/**
 * 🕰 HORARIOS · EL ALMACENAMIENTO DEL HISTORIAL DE VERSIONES (docs/19 §18.9).
 *
 * Una fila de `app_data` por aparato (`horarioVersiones:<aparato>`) que solo CRECE: cada operación (crear una
 * versión, eliminarla con una marca, renombrarla) se añade al final y nunca se quita ni se cambia. Se escribe con
 * una **escritura condicional** sobre la última operación de la fila (`value->>ultimaOperacion = <base>`), que es
 * lo que impide que una escritura vieja, repetida o de otra instalación con el mismo id pise nada. Probado contra
 * un PostgREST real en la prueba de nivel 3 y en `scripts/test-historial-versiones-postgrest.mjs`.
 *
 * Reglas que este archivo cumple (y sus pruebas comprueban):
 *   · 🚨 **Nada pendiente en el aparato** (MS F16, decisión de Josué): lo único local son tres claves —el id del
 *     aparato, la última operación ya CONFIRMADA y las sesiones de esta instalación—. La operación que se está
 *     intentando vive en memoria, y al cerrar la app desaparece.
 *   · 🚨 **Lo que no se confirma no se da por hecho**: `confirmada` solo sale si, al releer, el `opId` está en el
 *     servidor. Si no se puede saber, `sin_confirmar`; si consta que no se aplicó, `no_aplicada`.
 *   · **Version.id = opId** de su creación, y la vista cuenta cada `opId` una vez aunque esté en varias filas.
 *   · Una versión **automática** no se puede eliminar ni renombrar por ningún camino, y eliminar exige
 *     `confirmado: true`.
 *   · La identificación de aparatos y sesiones es **orientativa**: solo reparte filas. La integridad no depende de
 *     ella.
 *
 * ⚠️ Es una HOJA del árbol de imports (no importa nada): la usan `supabase.js` y `sincronizacion.js`, que también
 * son hojas. Quien habla con Supabase es `supabase.js` (el «transporte»); aquí solo se decide.
 */

export const PREFIJO_HISTORIAL_VERSIONES = 'horarioVersiones:';

/** Las claves que NUNCA pueden escribirse con `saveData` ni entrar en su cola (docs/19 §18.9). */
export function esClaveDeHistorialVersiones(clave) {
  return typeof clave === 'string' && clave.startsWith(PREFIJO_HISTORIAL_VERSIONES);
}

/** Lo único que este sistema guarda en el aparato: identificadores y lo ya confirmado. Nada pendiente. */
export const CLAVES_LOCALES_HISTORIAL = Object.freeze(['aparato', 'confirmada', 'sesiones']);
export const PREFIJO_LOCAL_HISTORIAL = 'josstyle:historialVersiones:';
export const TOPE_SESIONES_HISTORIAL = 200;
/** Dentro del candado, como mucho un intento más tras un conflicto (docs/19 §18.9): si vuelve a fallar, se para. */
export const INTENTOS_HISTORIAL = 2;
export const TIPOS_OPERACION_HISTORIAL = Object.freeze(['crear', 'eliminar', 'renombrar']);
export const MOTIVOS_AUTOMATICOS = Object.freeze(['confirmacion', 'restauracion', 'migracion']);

const esTexto = (x) => typeof x === 'string' && x.length > 0;
const esEnteroPositivo = (x) => Number.isInteger(x) && x >= 1;

/* ───────────────────────────────────────────────────────────────────────────
   1 · VALIDAR LO QUE LLEGA (respuestas incompletas o filas ilegibles)

   Una fila que no tiene la forma esperada no se enseña, no se usa como base y NO SE TOCA: se aparta en la vista
   como ilegible. Con la forma: `secuencia` es la última `n`, `ultimaOperacion` es su `opId`, las `n` van de 1 en
   1 y no hay dos operaciones con el mismo `opId` dentro de una fila.
   ─────────────────────────────────────────────────────────────────────────── */
export function operacionValida(o) {
  if (!o || typeof o !== 'object' || !esTexto(o.opId) || !esEnteroPositivo(o.n)) return false;
  if (!TIPOS_OPERACION_HISTORIAL.includes(o.tipo)) return false;
  if (o.tipo === 'crear') return !!o.version && typeof o.version === 'object' && o.version.id === o.opId && esTexto(o.version.motivo);
  if (o.tipo === 'eliminar') return esTexto(o.versionId);
  return esTexto(o.versionId) && typeof o.nombre === 'string';
}

export function registroValido(fila) {
  if (!fila || !esClaveDeHistorialVersiones(fila.key)) return false;
  const v = fila.value;
  if (!v || typeof v !== 'object' || v.formato !== 1 || !esTexto(v.aparato) || !Array.isArray(v.operaciones)) return false;
  if (!v.operaciones.length || !esEnteroPositivo(v.secuencia) || v.secuencia !== v.operaciones.length) return false;
  const vistos = new Set();
  for (let i = 0; i < v.operaciones.length; i++) {
    const o = v.operaciones[i];
    if (!operacionValida(o) || o.n !== i + 1 || vistos.has(o.opId)) return false;
    vistos.add(o.opId);
  }
  return v.ultimaOperacion === v.operaciones[v.operaciones.length - 1].opId;
}

/* ───────────────────────────────────────────────────────────────────────────
   2 · LA VISTA FUSIONADA

   Todas las filas a la vez. Cada `opId` cuenta UNA vez aunque esté en varias filas (se rehízo tras cambiar de
   id, o dos instalaciones compartieron fila): no se borra nada para conseguirlo. Si dos copias del mismo `opId`
   no dicen lo mismo, no se elige una en silencio: se apuntan en `distintas` para «Revisión».

   🚨 Lo que viene de una fila que no se entiende NUNCA decide nada por sí solo (auditorías del 2026-11-09):
     · Las operaciones de las filas VÁLIDAS mandan siempre. Lo recuperado de una fila dañada no sustituye a una
       operación válida (crear, renombrar o eliminar) aunque comparta su `opId`: si dice lo mismo, no aporta nada;
       si dice otra cosa, es un conflicto.
     · De una fila de formato 1 dañada solo se leen las marcas de eliminación completas (con `opId` y `versionId`,
       y todas sus copias dentro de la fila idénticas campo a campo). Y NO eliminan: son ELIMINACIONES DUDOSAS. La
       versión sigue visible, con la marca apuntada para «Revisión». Con los datos actuales no hay forma de saber
       si su `versionId` es el que se quería eliminar (la marca no lleva nada que lo compruebe).
     · Una fila de un formato futuro (número mayor que 1) es una versión desconocida de este almacenamiento: no se
       interpreta NADA de ella y es de solo lectura (el escritor no escribe nunca en una fila así).
     · Un `opId` con copias que no dicen lo mismo es un CONFLICTO, y no se resuelve eligiendo la primera copia: una
       eliminación o un renombre en conflicto no se aplican; una creación en conflicto se enseña marcada
       (`enConflicto`), con todas sus variantes en `conflictos`, para no hacer desaparecer una versión.
     · El resultado no depende del orden en que lleguen las filas (el servidor no lo garantiza).
     · Las versiones automáticas no se eliminan nunca: ni con una marca válida (`marcasIgnoradas`) ni con una dudosa.
       Basta con que UNA variante de su creación sea automática para que toda la identidad quede protegida.
     · Cada versión dice qué la deja sin resolver (`afectadaPor`: opId, origen y motivo): una creación con variantes
       incompatibles, un renombre o una eliminación en conflicto que la nombran por `versionId`, una marca recuperada
       en conflicto que la nombra o una eliminación dudosa. Una marca dudosa que comparte `opId` con una creación
       válida afecta a la versión que NOMBRA, no a esa creación. El escritor no renombra ni elimina una versión
       afectada.
     · `completa` dice si se entendieron todas las filas; `definitiva`, si además no hay conflictos ni
       eliminaciones dudosas. Una vista que no es definitiva no se presenta como si lo fuera. Lo desconocido no se
       descarta: la fila queda como está en el servidor y se describe en `detalleIlegibles`.
   ─────────────────────────────────────────────────────────────────────────── */
/* JSON con las claves ordenadas: dos copias de lo mismo dan el mismo texto aunque sus claves vengan en otro orden. */
const canonico = (x) => JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.keys(v).sort().map((c) => [c, v[c]])) : v));
/* Lo que HACE una operación (sin `n`, `base`, `sesion` ni `en`, que cambian legítimamente al reenviarla a otra fila). */
const sentidoDe = (o) => canonico(o.tipo === 'crear'
  ? { t: o.tipo, v: o.version }
  : { t: o.tipo, id: o.versionId, nombre: o.nombre ?? null, s: o.sustituye ?? null });
const porTexto = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const ordenados = (xs) => [...new Set(xs)].sort(porTexto);

/** Una fila de un formato posterior al que entiende esta copia de la app. */
export const esFormatoFuturo = (fila) => !!fila && !!fila.value && typeof fila.value === 'object'
  && Number.isInteger(fila.value.formato) && fila.value.formato > 1;

/* De una fila de formato 1 que no es válida entera: las marcas de eliminación legibles (todas sus copias dentro de
   la fila idénticas en TODOS los campos) y los `opId` repetidos con copias distintas (señal de daño: el escritor
   nunca escribe dos veces el mismo `opId` en una fila). */
function marcasDeFilaDanada(fila) {
  const v = fila && fila.value;
  const fuera = { marcas: [], repetidas: [] };
  if (!esClaveDeHistorialVersiones(fila && fila.key) || !v || typeof v !== 'object' || v.formato !== 1 || !Array.isArray(v.operaciones)) return fuera;
  const porOpId = new Map();
  for (const o of v.operaciones) {
    if (!o || typeof o !== 'object' || !esTexto(o.opId)) continue;
    const lista = porOpId.get(o.opId) || [];
    lista.push(o); porOpId.set(o.opId, lista);
  }
  for (const [opId, copias] of porOpId) {
    const distintas = new Set(copias.map(canonico));
    if (distintas.size !== 1) {
      if (copias.some((o) => o.tipo === 'eliminar')) fuera.repetidas.push({ opId, variantes: [...distintas].sort(porTexto).map((t) => JSON.parse(t)) });
      continue;
    }
    if (copias[0].tipo === 'eliminar' && operacionValida(copias[0])) fuera.marcas.push(copias[0]);
  }
  return fuera;
}

export function vistaFusionadaDeVersiones(filas) {
  const lista = Array.isArray(filas) ? filas : [];
  const ilegibles = [];
  const detalleIlegibles = [];
  const formatoFuturo = [];
  // 1 · Las filas válidas: cada opId con todas sus copias (y de qué filas viene cada sentido).
  const validas = new Map();       // opId → Map(sentido → { o, filas: [] })
  const recuperadas = new Map();   // opId → Map(sentido → { o, filas: [] })
  const repetidasEnFila = [];      // { opId, fila, variantes }
  let copias = 0;
  const anotar = (mapa, o, key, sentido = sentidoDe(o)) => {
    if (!mapa.has(o.opId)) mapa.set(o.opId, new Map());
    const m = mapa.get(o.opId);
    if (!m.has(sentido)) m.set(sentido, { o, filas: [] });
    m.get(sentido).filas.push(key);
  };
  for (const f of lista) {
    if (registroValido(f)) {
      for (const o of f.value.operaciones) { copias += 1; anotar(validas, o, f.key); }
      continue;
    }
    const key = f && f.key ? f.key : null;
    ilegibles.push(key);
    const total = f && f.value && Array.isArray(f.value.operaciones) ? f.value.operaciones.length : null;
    if (esFormatoFuturo(f)) {
      formatoFuturo.push(key);
      detalleIlegibles.push({ key, motivo: 'formato_futuro', formato: f.value.formato, operacionesSinLeer: total });
      continue;
    }
    const { marcas, repetidas } = marcasDeFilaDanada(f);
    for (const o of marcas) anotar(recuperadas, o, key);
    for (const r of repetidas) repetidasEnFila.push({ ...r, fila: key });
    detalleIlegibles.push({ key, motivo: 'fila_ilegible', marcasLeidas: marcas.length,
      operacionesSinLeer: total == null ? null : total - marcas.length });
  }

  // Qué deja sin resolver a cada versión: versionId → [{ opId, origen, motivo }].
  const afectacion = new Map();
  const objetivoDe = (o) => (o && o.tipo === 'crear' ? (o.version && o.version.id) : o && o.versionId);
  const MOTIVO_POR_TIPO = { crear: 'creacion_en_conflicto', renombrar: 'renombre_en_conflicto', eliminar: 'eliminacion_en_conflicto' };
  const afectar = (versionId, opId, origen, motivo) => {
    if (!esTexto(versionId)) return;
    const lista = afectacion.get(versionId) || [];
    if (!lista.some((x) => x.opId === opId && x.origen === origen && x.motivo === motivo)) lista.push({ opId, origen, motivo });
    afectacion.set(versionId, lista);
  };

  // 2 · Conflictos (nunca se elige una copia por llegar antes) y operaciones limpias de las filas válidas.
  const conflictos = [];
  const describir = (m) => [...m.entries()].sort(([a], [b]) => porTexto(a, b))
    .map(([sentido, x]) => ({ ...JSON.parse(sentido), filas: ordenados(x.filas) }));
  const limpias = [];
  const creacionesEnConflicto = new Map();   // versionId → la variante que se enseña (la primera en orden canónico)
  for (const [opId, m] of validas) {
    if (m.size === 1) { limpias.push([...m.values()][0].o); continue; }
    conflictos.push({ opId, origen: 'filas_validas', variantes: describir(m) });
    for (const x of m.values()) afectar(objetivoDe(x.o), opId, 'filas_validas', MOTIVO_POR_TIPO[x.o.tipo] || 'operacion_en_conflicto');
    const crear = [...m.entries()].filter(([, x]) => x.o.tipo === 'crear').sort(([a], [b]) => porTexto(a, b));
    if (crear.length) creacionesEnConflicto.set(opId, crear[0][1].o.version);
  }
  for (const r of repetidasEnFila) {
    conflictos.push({ opId: r.opId, origen: 'copias_en_fila_ilegible', filas: [r.fila], variantes: r.variantes });
    for (const x of r.variantes) afectar(objetivoDe(x), r.opId, 'copias_en_fila_ilegible', 'marca_recuperada_en_conflicto');
  }
  // Lo recuperado: si el opId existe en una fila válida, manda la válida; si dice otra cosa, es un conflicto.
  const candidatas = [];
  for (const [opId, m] of recuperadas) {
    if (validas.has(opId)) {
      const dicen = validas.get(opId);
      const extra = [...m.keys()].filter((sentido) => !dicen.has(sentido));
      if (extra.length) {
        const todo = new Map([...dicen, ...[...m].filter(([sentido]) => extra.includes(sentido))]);
        conflictos.push({ opId, origen: 'valida_y_recuperada', variantes: describir(todo) });
        // Afecta a lo que nombra la copia RECUPERADA; la operación válida sigue aplicándose (y no se marca por compartir id).
        for (const sentido of extra) afectar(objetivoDe(m.get(sentido).o), opId, 'valida_y_recuperada', 'marca_recuperada_en_conflicto');
      }
      continue;
    }
    if (m.size !== 1) {
      conflictos.push({ opId, origen: 'recuperadas', variantes: describir(m) });
      for (const x of m.values()) afectar(objetivoDe(x.o), opId, 'recuperadas', 'marca_recuperada_en_conflicto');
      continue;
    }
    const [{ o, filas: de }] = [...m.values()];
    candidatas.push({ o, filas: ordenados(de) });
  }

  // 3 · Versiones, eliminaciones válidas y renombres: solo con operaciones limpias de filas válidas.
  const versiones = new Map();
  for (const o of limpias) if (o.tipo === 'crear') versiones.set(o.version.id, o.version);
  for (const [id, v] of creacionesEnConflicto) if (!versiones.has(id)) versiones.set(id, v);
  /* Automática si CUALQUIER variante de su creación (de filas válidas) lo es: toda la identidad queda protegida. */
  const automaticas = new Set();
  for (const [, m] of validas) {
    for (const x of m.values()) if (x.o.tipo === 'crear' && x.o.version && x.o.version.motivo !== 'manual') automaticas.add(x.o.version.id);
  }
  const eliminadas = new Set();
  const marcasIgnoradas = [];
  for (const o of limpias) {
    if (o.tipo !== 'eliminar') continue;
    // Una marca sobre una automática no vale (venga de este aparato o de otro): la versión sigue visible y se avisa.
    if (automaticas.has(o.versionId)) marcasIgnoradas.push(o.opId);
    else eliminadas.add(o.versionId);
  }

  // 4 · Las eliminaciones dudosas: se apuntan, no se aplican.
  const eliminacionesDudosas = candidatas.map(({ o, filas: de }) => {
    const v = versiones.get(o.versionId);
    const objetivo = !v ? (eliminadas.has(o.versionId) ? 'ya_eliminada' : 'desconocida')
      : eliminadas.has(o.versionId) ? 'ya_eliminada'
        : automaticas.has(o.versionId) ? 'automatica' : 'visible';
    return { opId: o.opId, versionId: o.versionId, objetivo, nombre: v ? v.nombre ?? null : null,
      filas: de, en: o.en ?? null, sesion: o.sesion ?? null };
  }).sort((a, b) => porTexto(a.opId, b.opId));
  for (const d of eliminacionesDudosas) afectar(d.versionId, d.opId, 'fila_ilegible', 'eliminacion_dudosa');
  const afectadaPor = (id) => [...(afectacion.get(id) || [])]
    .sort((a, b) => porTexto(a.opId, b.opId) || porTexto(a.origen, b.origen) || porTexto(a.motivo, b.motivo));
  const renombres = limpias.filter((o) => o.tipo === 'renombrar');
  const visibles = [...versiones.values()].filter((v) => !eliminadas.has(v.id)).map((v) => {
    const suyos = v.motivo === 'manual' ? renombres.filter((r) => r.versionId === v.id) : [];
    const sustituidos = new Set(suyos.flatMap((r) => (Array.isArray(r.sustituye) ? r.sustituye : r.sustituye ? [r.sustituye] : [])));
    const cabezas = suyos.filter((r) => !sustituidos.has(r.opId)).sort((a, b) => porTexto(a.opId, b.opId));
    return {
      ...v,
      nombre: cabezas.length === 1 ? cabezas[0].nombre : v.nombre,
      conflictoDeNombre: cabezas.length > 1 ? cabezas.map((c) => c.nombre) : null,
      cabezas: cabezas.map((c) => c.opId),
      protegida: automaticas.has(v.id),
      afectadaPor: afectadaPor(v.id),
      afectada: afectacion.has(v.id),
      enConflicto: afectadaPor(v.id).some((a) => a.motivo !== 'eliminacion_dudosa'),
      eliminacionDudosa: eliminacionesDudosas.filter((d) => d.versionId === v.id).map((d) => d.opId),
    };
  }).sort((a, b) => porTexto(String(a.creadaEn ?? ''), String(b.creadaEn ?? '')) || porTexto(a.id, b.id));

  conflictos.sort((a, b) => porTexto(a.opId, b.opId) || porTexto(a.origen, b.origen));
  const completa = ilegibles.length === 0;
  return {
    visibles,
    eliminadas: ordenados([...eliminadas]),
    eliminacionesDudosas,
    conflictos,
    /* Todas las versiones sin resolver, visibles o no, con lo que las afecta. */
    afectadas: [...afectacion.keys()].sort(porTexto).map((versionId) => ({ versionId, afectadaPor: afectadaPor(versionId) })),
    /* Los `opId` en conflicto (cualquier origen), para quien solo necesita saber si los hay. */
    distintas: ordenados(conflictos.map((c) => c.opId)),
    marcasIgnoradas: ordenados(marcasIgnoradas),
    marcasRecuperadas: ordenados([...recuperadas.keys()]),
    ilegibles: [...ilegibles].sort((a, b) => porTexto(String(a ?? ''), String(b ?? ''))),
    detalleIlegibles: [...detalleIlegibles].sort((a, b) => porTexto(String(a.key ?? ''), String(b.key ?? ''))),
    formatoFuturo: ordenados(formatoFuturo),
    /* `completa: false` = hay filas que esta copia de la app no entiende. `definitiva: false` = además, o en su
       lugar, hay conflictos o eliminaciones dudosas: la lista no se puede presentar como definitiva. */
    completa,
    definitiva: completa && conflictos.length === 0 && eliminacionesDudosas.length === 0,
    operacionesUnicas: validas.size, copias,
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   3 · LO QUE HAY EN EL APARATO (sin nada pendiente) Y EL CANDADO ENTRE PESTAÑAS
   ─────────────────────────────────────────────────────────────────────────── */
/** `localStorage` con cada acceso en `try` (en una ventana privada de Safari, `setItem` lanza: SF F1). Si no se
 *  puede guardar, se recuerda en memoria: el peor caso es un id nuevo en cada apertura, que es seguro. */
export function almacenDelNavegador(prefijo = PREFIJO_LOCAL_HISTORIAL) {
  const memoria = new Map();
  const ls = () => { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch { return null; } };
  return {
    leer(k) {
      if (!CLAVES_LOCALES_HISTORIAL.includes(k)) return null;
      try { const s = ls(); const v = s ? s.getItem(prefijo + k) : null; return v ?? (memoria.has(k) ? memoria.get(k) : null); } catch { return memoria.has(k) ? memoria.get(k) : null; }
    },
    escribir(k, v) {
      if (!CLAVES_LOCALES_HISTORIAL.includes(k)) throw new Error(`Clave local no permitida en el historial: ${k}`);
      memoria.set(k, String(v));
      try { const s = ls(); if (s) s.setItem(prefijo + k, String(v)); } catch { /* sin espacio o ventana privada: queda en memoria */ }
    },
  };
}

/** El candado de las versiones entre pestañas del mismo aparato (`navigator.locks`, Safari 15.4+). Sin él, `null`:
 *  el escritor no escribe y lo dice (docs/19 §18.9). */
export function candadoDelNavegador(nombre = 'josstyle:historialVersiones') {
  try {
    if (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') {
      return (fn) => navigator.locks.request(nombre, fn);
    }
  } catch { /* sin Web Locks */ }
  return null;
}

const nuevoId = () => globalThis.crypto.randomUUID();

/* ───────────────────────────────────────────────────────────────────────────
   4 · EL ESCRITOR CONDICIONAL

   `transporte` es quien habla con Supabase (en la app, `transporteDeVersiones` de `supabase.js`):
     leerPropia(usuario, clave)                   → { ok, valor | null, sinRespuesta?, error? }
     leerTodas(usuario)                           → { ok, filas, sinRespuesta?, error? }
     insertar(usuario, clave, valor)              → { ok, conflicto?, sinRespuesta?, error?, definitivo? }
     actualizarSiBase(usuario, clave, valor, base) → { ok, aplicada, sinRespuesta?, error?, definitivo? }
   Ninguno pasa por `saveData` ni por su cola.

   Resultado de cada operación: `{ estado: 'confirmada' | 'sin_confirmar' | 'no_aplicada', opId, motivo? }`.
   ─────────────────────────────────────────────────────────────────────────── */
export function crearEscritorDeVersiones({
  transporte, usuario, almacen = almacenDelNavegador(), candado = candadoDelNavegador(),
  sesion = nuevoId(), idNuevo = nuevoId, ahora = () => new Date().toISOString(), avisar = () => {},
} = {}) {
  if (!transporte || !esTexto(usuario)) throw new Error('crearEscritorDeVersiones necesita transporte y usuario');
  const leerJSON = (k, d) => { try { const v = almacen.leer(k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const sesiones = leerJSON('sesiones', []);
  if (!Array.isArray(sesiones) || !sesiones.includes(sesion)) {
    almacen.escribir('sesiones', JSON.stringify([...(Array.isArray(sesiones) ? sesiones : []), sesion].slice(-TOPE_SESIONES_HISTORIAL)));
  }
  if (!esTexto(almacen.leer('aparato'))) almacen.escribir('aparato', idNuevo());
  const clave = () => PREFIJO_HISTORIAL_VERSIONES + almacen.leer('aparato');

  /* Solo en memoria (MS F16): la operación que se está intentando, para reintentarla con su mismo opId. */
  const intentos = new Map();
  const cuentas = { aceptadas: 0, rechazadasPorCondicion: 0, conflictosDeInsercion: 0, sinRespuesta: 0,
    reintentosMismaBase: 0, yaAplicadas: 0, cambiosDeId: 0, sinConfirmar: 0, noAplicadas: 0 };

  function cambiarDeId(motivo) {
    almacen.escribir('aparato', idNuevo());
    almacen.escribir('confirmada', 'null');
    cuentas.cambiosDeId += 1;
    avisar({ evento: 'cambio_de_id', motivo });
  }

  /* ORIENTATIVA (docs/19 §18.9): decide si sigue en esta fila o se va a una nueva. Equivocarse no pierde nada. */
  function identidad(valor) {
    const conf = leerJSON('confirmada', null);
    const ses = leerJSON('sesiones', []);
    if (valor == null) return conf ? 'fila_desaparecida' : 'ok';
    if (esFormatoFuturo({ value: valor })) return 'formato_futuro';
    if (!registroValido({ key: clave(), value: valor })) return 'registro_ilegible';
    if (conf && !valor.operaciones.some((o) => o.opId === conf.opId)) return 'confirmada_no_esta';
    const posteriores = conf ? valor.operaciones.filter((o) => o.n > conf.n) : valor.operaciones;
    for (const o of posteriores) if (!intentos.has(o.opId) && !ses.includes(o.sesion)) return 'sesion_desconocida';
    return 'ok';
  }

  const estaEn = (valor, opId) => !!valor && Array.isArray(valor.operaciones) && valor.operaciones.some((o) => o.opId === opId);
  function confirmar(valor, opId) {
    const ultima = valor.operaciones[valor.operaciones.length - 1];
    almacen.escribir('confirmada', JSON.stringify({ opId: ultima.opId, n: ultima.n }));
    intentos.delete(opId);
    return { estado: 'confirmada', opId };
  }
  const sinConfirmar = (opId, motivo) => { cuentas.sinConfirmar += 1; return { estado: 'sin_confirmar', opId, motivo }; };
  /* `conservar`: no se llegó a enviar (sin conexión): se queda en memoria para poder reintentarla con su opId. */
  const noAplicada = (opId, motivo, { conservar = false } = {}) => {
    cuentas.noAplicadas += 1; if (!conservar) intentos.delete(opId); return { estado: 'no_aplicada', opId, motivo };
  };

  /** Después de un envío sin éxito claro: releer y buscar el opId. Es lo que distingue «se aplicó» de «no». */
  async function comprobarTrasEnvio(opId, definitivo, motivo) {
    const r = await transporte.leerPropia(usuario, clave());
    if (r.ok && estaEn(r.valor, opId)) return confirmar(r.valor, opId);
    if (r.ok && definitivo) return noAplicada(opId, motivo);
    return sinConfirmar(opId, motivo);
  }

  async function aplicar(op) {
    if (!operacionValida({ ...op, n: 1 })) return noAplicada(op && op.opId, 'operacion_invalida');
    if (!candado) return noAplicada(op.opId, 'sin_candado');
    return candado(async () => {
      const intento = intentos.get(op.opId) || { op, enviada: null };
      intentos.set(op.opId, intento);
      for (let vuelta = 0; vuelta < INTENTOS_HISTORIAL; vuelta++) {
        let leida = await transporte.leerPropia(usuario, clave());
        /* Sin poder leer: si nunca se envió, consta que no se aplicó; si se envió antes, no se sabe. */
        if (!leida.ok) return intento.enviada ? sinConfirmar(op.opId, 'lectura') : noAplicada(op.opId, leida.sinRespuesta ? 'sin_conexion' : 'lectura', { conservar: true });
        if (estaEn(leida.valor, op.opId)) { cuentas.yaAplicadas += 1; return confirmar(leida.valor, op.opId); }
        /* Antes de escribir NADA (crear, eliminar, renombrar o un reintento): el historial entero tiene que poder
           leerse y entenderse. Con una fila de otro aparato dañada o de un formato posterior, o sin poder leerlo, no
           se escribe. Si ya se envió antes, no se sabe si llegó: «sin confirmar», y sigue en memoria. */
        const global = await leer();
        const bloqueo = !global.ok ? (global.sinRespuesta ? 'sin_conexion' : 'lectura')
          : global.vista.formatoFuturo.length ? 'formato_nuevo'
            : !global.vista.completa ? 'vista_incompleta' : null;
        if (bloqueo) return intento.enviada ? sinConfirmar(op.opId, bloqueo) : noAplicada(op.opId, bloqueo, { conservar: true });
        const id = identidad(leida.valor);
        /* Una fila de un formato posterior es de solo lectura: ni se escribe en ella ni se cambia de id para seguir
           escribiendo como si nada. Hace falta una versión más nueva de la app. */
        if (id === 'formato_futuro') return noAplicada(op.opId, 'formato_nuevo');
        if (id !== 'ok') {
          cambiarDeId(id);
          leida = await transporte.leerPropia(usuario, clave());
          if (!leida.ok) return intento.enviada ? sinConfirmar(op.opId, 'lectura') : noAplicada(op.opId, 'lectura', { conservar: true });
        }
        const valor = leida.valor;
        const base = valor ? valor.ultimaOperacion : null;
        /* Tras una respuesta perdida, si la base no ha cambiado: el MISMO opId, la MISMA base y el MISMO contenido. */
        const mismaBase = intento.enviada && intento.enviada.base === base && intento.enviada.clave === clave();
        if (mismaBase) cuentas.reintentosMismaBase += 1;
        const enviada = mismaBase ? intento.enviada.op : { ...op, n: (valor ? valor.secuencia : 0) + 1, base, sesion };
        intento.enviada = { base, clave: clave(), op: enviada };
        const nuevo = valor
          ? { ...valor, secuencia: enviada.n, ultimaOperacion: enviada.opId, operaciones: [...valor.operaciones, enviada] }
          : { formato: 1, aparato: almacen.leer('aparato'), secuencia: enviada.n, ultimaOperacion: enviada.opId, operaciones: [enviada] };
        if (!valor) {
          const r = await transporte.insertar(usuario, clave(), nuevo);
          if (r.conflicto) { cuentas.conflictosDeInsercion += 1; continue; }
          if (!r.ok) { if (r.sinRespuesta) cuentas.sinRespuesta += 1; return comprobarTrasEnvio(op.opId, !!r.definitivo, r.sinRespuesta ? 'respuesta_perdida' : 'error'); }
        } else {
          const r = await transporte.actualizarSiBase(usuario, clave(), nuevo, base);
          if (!r.ok) { if (r.sinRespuesta) cuentas.sinRespuesta += 1; return comprobarTrasEnvio(op.opId, !!r.definitivo, r.sinRespuesta ? 'respuesta_perdida' : 'error'); }
          if (!r.aplicada) { cuentas.rechazadasPorCondicion += 1; continue; }
        }
        const verificada = await transporte.leerPropia(usuario, clave());
        if (verificada.ok && estaEn(verificada.valor, op.opId)) { cuentas.aceptadas += 1; return confirmar(verificada.valor, op.opId); }
        return sinConfirmar(op.opId, 'verificacion');
      }
      /* Cada intento fue RECHAZADO por la condición (definitivo): no se aplicó. Se para y se dice (docs/19 §18.9), y se
         conserva en memoria para reintentarla con su mismo opId. */
      return noAplicada(op.opId, 'conflictos_repetidos', { conservar: true });
    });
  }

  const nueva = (tipo, datos) => ({ opId: idNuevo(), tipo, ...datos, en: ahora() });

  /** Lee todas las filas y devuelve la vista. Si falla, no hay lista a medias. */
  async function leer() {
    const r = await transporte.leerTodas(usuario);
    if (!r.ok) return { ok: false, sinRespuesta: !!r.sinRespuesta, error: r.error || null };
    return { ok: true, vista: vistaFusionadaDeVersiones(r.filas) };
  }

  /* Eliminar y renombrar solo se aceptan sobre una versión MANUAL, sin nada que la deje sin resolver, y con una
     vista que se ha entendido entera: con filas de un formato posterior o filas dañadas puede haber marcas o
     renombres que esta copia de la app no ve. Una versión protegida (alguna variante automática) o afectada por un
     conflicto o una eliminación dudosa no se toca. Las demás versiones siguen funcionando aunque la vista no sea
     definitiva por un conflicto en otra. */
  async function versionManual(versionId) {
    const r = await leer();
    if (!r.ok) return { error: r.sinRespuesta ? 'sin_conexion' : 'lectura' };
    if (r.vista.formatoFuturo.length) return { error: 'formato_nuevo' };
    if (!r.vista.completa) return { error: 'vista_incompleta' };
    const v = r.vista.visibles.find((x) => x.id === versionId);
    if (!v) return { error: r.vista.eliminadas.includes(versionId) ? 'ya_eliminada' : 'version_desconocida' };
    if (v.protegida || v.motivo !== 'manual') return { error: 'version_automatica' };
    if (v.afectada) return { error: 'version_afectada' };
    return { version: v };
  }

  return {
    clave, sesion, cuentas,
    /** Crea una versión: `motivo` 'manual' o uno automático; `contenido` es lo que se guarda tal cual. */
    async crearVersion({ contenido, motivo = 'manual', nombre = '', resumen = null, huella = null } = {}) {
      if (motivo !== 'manual' && !MOTIVOS_AUTOMATICOS.includes(motivo)) return noAplicada(null, 'motivo_desconocido');
      const op = nueva('crear', {});
      op.version = { id: op.opId, motivo, nombre: String(nombre || ''), creadaEn: op.en, resumen, huella, contenido };
      return aplicar(op);
    },
    async eliminarVersionManual(versionId, { confirmado = false } = {}) {
      if (confirmado !== true) return noAplicada(null, 'sin_confirmacion');
      const r = await versionManual(versionId);
      if (r.error === 'ya_eliminada') return { estado: 'confirmada', opId: null, motivo: 'ya_eliminada' };
      if (r.error) return noAplicada(null, r.error);
      return aplicar(nueva('eliminar', { versionId }));
    },
    async renombrarVersionManual(versionId, nombre) {
      const r = await versionManual(versionId);
      if (r.error) return noAplicada(null, r.error);
      const sustituye = r.version.cabezas.length ? r.version.cabezas : null;
      return aplicar(nueva('renombrar', { versionId, nombre: String(nombre || ''), sustituye }));
    },
    /** Reintentar una operación que quedó «sin confirmar», con el MISMO opId (en memoria). */
    reintentar(opId) {
      const i = intentos.get(opId);
      return i ? aplicar(i.op) : Promise.resolve(noAplicada(opId, 'no_esta_en_memoria'));
    },
    leer,
    enMemoria: () => [...intentos.keys()],
  };
}
