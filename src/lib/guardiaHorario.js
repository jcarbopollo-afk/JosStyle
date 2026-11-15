/**
 * 🛡 HORARIOS · FASE 4, A-BIS — LA GUARDIA DEL HORARIO (docs/19 §17.2, especificación A-bis consolidada).
 *
 * Lo que hace, en una frase: saber si una copia antigua de la aplicación (sin la guardia de versión de la
 * entrega A) ha escrito `horarioTop` encima de lo que ya tenía la guardia, y no dejar que la entrega B empiece
 * sin saberlo. Para eso:
 *   · cada escritura de la A-bis pone `version: 1` en `horarioTop` y, fuera del arranque, un **testigo**
 *     (`{ formato, desde, ultimaEscritura, revision, base, aparato }`, §1). Una copia antigua lo borra al guardar,
 *     porque su normalizador tira lo que no conoce;
 *   · cada aparato tiene su fila `horarioGuardia:<aparato>` en `app_data` (§2), escrita con una escritura
 *     condicional sobre su última operación (§5) y que solo CRECE en sus listas;
 *   · al cargar, se clasifica lo que hay (§6.3 y §6.6): E1 solo con un **testigo válido presente** (concepto 2);
 *     con un testigo demostrado antes, su falta es una pérdida (B) o un caso ambiguo (C), y se registra;
 *   · un evaluador puro dice si se cumplen las cinco condiciones de la B (§9).
 *
 * Reglas que este archivo cumple (y `scripts/test-guardia-horario.mjs` comprueba):
 *   · 🚨 **Nada pendiente en el aparato** (C-84, MS F16): lo único local es el id del aparato (el mismo que usa el
 *     historial de versiones, con UNA sola instancia del almacén). Lo que se intenta escribir vive en memoria.
 *   · 🚨 **Lo que no se confirma no se da por hecho**: una escritura solo está confirmada si, al releer, aparece
 *     su `id` (o lo que escribió). Un reintento usa los mismos `opId` e `id`, y nunca crea un registro nuevo.
 *   · 🚨 **Nunca escribe `horarioTop`**: ni al cargar ni en ningún momento. Solo prepara el valor que guarda la
 *     aplicación cuando él guarda algo (`prepararEscritura`).
 *   · Las listas de la fila (`detecciones`, `retiradas`, `resoluciones`, `testigo.intenciones`) solo crecen, y lo
 *     que esta versión no conoce de la fila se conserva (`cumpleInvariante`).
 *
 * ⚠️ Es una HOJA del árbol de imports (solo importa `historialVersiones.js`, que también lo es): la importan
 * `supabase.js` y `sincronizacion.js` para rechazar sus claves. Quien habla con Supabase es el «transporte»
 * (`transporteDeGuardia` en `supabase.js`), que se le pasa al controlador.
 */
import { almacenDelNavegador } from './historialVersiones';

/* ═══════════════════════════════════════════════════════════════════════════
   0 · CONSTANTES Y CLAVES
   =========================================================================== */
export const PREFIJO_GUARDIA_HORARIO = 'horarioGuardia:';
/** El formato de la fila y el del testigo. Uno mayor que estos es de una versión más nueva: no se interpreta. */
export const FORMATO_GUARDIA = 1;
export const FORMATO_TESTIGO = 1;
/** La `version` que escribe la A-bis en `horarioTop` (la que ya conoce la guardia de la entrega A). */
export const VERSION_ESCRITA_HORARIO = 1;
/** Dentro de una escritura, como mucho dos intentos; después, «conflicto repetido» (§5). */
export const INTENTOS_GUARDIA = 2;
/** Una visita es reciente si es de los últimos 30 días (condición 4, §9). */
export const DIAS_VISITA_RECIENTE = 30;
/** Las decisiones de una resolución que esta versión reconoce. Las escribe la entrega corta (C-3); una que no
 *  esté aquí NO cuenta (§2). ⚠️ Provisional: la entrega corta fija su lista definitiva. */
export const DECISIONES_RESOLUCION = Object.freeze(['resuelta']);
export const CLASES_INCIDENCIA = Object.freeze({ perdida: 'B', ambigua: 'C' });
export const MOTIVOS_INCIDENCIA = Object.freeze(['testigo_ausente', 'testigo_ilegible', 'fila_ausente']);
/** Los motivos de solo lectura que añade la A-bis (§8). El motivo de la entrega A tiene prioridad sobre ellos. */
export const MOTIVOS_BLOQUEO_GUARDIA = Object.freeze({
  comprobando: 'guardia_comprobando',
  noVerificable: 'guardia_no_verificable',
  incidencia: 'guardia_incidencia_sin_confirmar',
});
export const esMotivoDeGuardia = (m) => Object.values(MOTIVOS_BLOQUEO_GUARDIA).includes(m);

/** Las claves que NUNCA pueden escribirse con `saveData` ni entrar en su cola (§4). */
export function esClaveDeGuardiaHorario(clave) {
  return typeof clave === 'string' && (
    clave === 'horarioGuardia' || clave.startsWith(PREFIJO_GUARDIA_HORARIO)
    || clave === 'horarioAparatos' || clave.startsWith('horarioAparatos:')
  );
}
export const claveDeGuardia = (aparato) => `${PREFIJO_GUARDIA_HORARIO}${aparato}`;

/* ═══════════════════════════════════════════════════════════════════════════
   1 · PIEZAS PEQUEÑAS: objetos, copia, texto canónico, huella, uuid, fechas
   =========================================================================== */
const esObjeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const tiene = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const copiar = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

/** JSON con las claves ordenadas en todos los niveles y las listas en su orden (§2, la huella). */
export function textoCanonico(v) {
  if (v === null || v === undefined || typeof v !== 'object') {
    const t = JSON.stringify(v === undefined ? null : v);
    return t === undefined ? 'null' : t;
  }
  if (Array.isArray(v)) return `[${v.map((x) => textoCanonico(x)).join(',')}]`;
  const claves = Object.keys(v).filter((k) => v[k] !== undefined).sort();
  return `{${claves.map((k) => `${JSON.stringify(k)}:${textoCanonico(v[k])}`).join(',')}}`;
}

/** SHA-256 del texto canónico de `horarioTop` en crudo (de `null` si no había fila). Sin `crypto.subtle`, `null`. */
export async function huellaDeHorario(valor, existe = true, crypto = globalThis.crypto) {
  try {
    const subtle = crypto && crypto.subtle;
    if (!subtle || typeof subtle.digest !== 'function' || typeof TextEncoder === 'undefined') return null;
    const datos = new TextEncoder().encode(textoCanonico(existe ? valor : null));
    const h = await subtle.digest('SHA-256', datos);
    return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch { return null; }
}

/** Un uuid: `randomUUID` o, si no está, un v4 hecho con `getRandomValues`. Nunca con `Math.random`. Sin ninguno, `null`. */
export function nuevoUuid(crypto = globalThis.crypto) {
  try { if (crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID(); } catch { /* sigue con el respaldo */ }
  try {
    if (crypto && typeof crypto.getRandomValues === 'function') {
      const b = crypto.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40;
      b[8] = (b[8] & 0x3f) | 0x80;
      const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    }
  } catch { /* sin aleatoriedad segura */ }
  return null;
}

/** La fecha local del aparato (`YYYY-MM-DD`). Nunca `toISOString().slice(0, 10)`: en España da el día anterior. */
export function fechaLocal(d = new Date()) {
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}
const fechaDeMarca = (en) => (typeof en === 'string' ? fechaLocal(new Date(en)) : null);

/* ═══════════════════════════════════════════════════════════════════════════
   2 · LA IDENTIDAD DEL APARATO (§3)
   =========================================================================== */
let almacenUnico = null;
/** UNA sola instancia del almacén para toda la aplicación: su respaldo en memoria es por instancia. */
export function almacenDelAparato() {
  if (!almacenUnico) almacenUnico = almacenDelNavegador();
  return almacenUnico;
}
/** El id del aparato (el mismo que usa el historial de versiones). Si no existe, se crea. Sin forma segura de
 *  crearlo, `null`: entonces no se registra nada y la comprobación es «no verificable». */
export function idDelAparato({ almacen = almacenDelAparato(), crypto = globalThis.crypto } = {}) {
  let id = null;
  try { id = almacen.leer('aparato'); } catch { id = null; }
  if (typeof id === 'string' && id) return id;
  const nuevo = nuevoUuid(crypto);
  if (!nuevo) return null;
  try { almacen.escribir('aparato', nuevo); } catch { return null; }
  return nuevo;
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LOS CUATRO CONCEPTOS DE `horarioTop` Y SU TESTIGO (§6.3, corregido)
   ---------------------------------------------------------------------------
   1 · estructuralmente válido: un objeto, con `version` ausente o 1. NO dice nada del testigo.
   2 · testigo válido presente: estructuralmente válido + `version: 1` + `testigo` objeto con `formato === 1` y
       `revision` de texto no vacío. Es lo ÚNICO que da E1.
   3 · testigo ausente: estructuralmente válido y sin la propiedad `testigo` (o `undefined`).
   4a · ilegible: el valor no es un objeto; o el testigo existe y no es un objeto (o es lista o `null`); o su
        `formato` no es un entero o es menor que 1; o `formato === 1` sin `revision` de texto no vacío; o un
        testigo con forma válida en un `horarioTop` sin `version`.
   4b · formato posterior: `formato` entero mayor que 1 → lectura no verificable.
   `version` se mira como la deja la guardia de la entrega A: si no la reconoce, no se clasifica (§6.5).
   =========================================================================== */
export function conceptoDelHorario(lectura) {
  if (!lectura || !lectura.existe) {
    return { fila: 'ausente', estructural: false, concepto: 'fila_ausente', version: 'ausente', revision: null };
  }
  const v = lectura.valor;
  if (!esObjeto(v)) return { fila: 'presente', estructural: false, concepto: '4a', version: 'ausente', revision: null };
  const conVersion = tiene(v, 'version') && v.version !== null && v.version !== undefined;
  const version = !conVersion ? 'ausente' : (v.version === VERSION_ESCRITA_HORARIO ? 1 : 'no_reconocida');
  if (version === 'no_reconocida') return { fila: 'presente', estructural: false, concepto: 'version_no_reconocida', version, revision: null };
  if (!tiene(v, 'testigo') || v.testigo === undefined) return { fila: 'presente', estructural: true, concepto: '3', version, revision: null };
  const t = v.testigo;
  if (!esObjeto(t)) return { fila: 'presente', estructural: true, concepto: '4a', version, revision: null };
  const f = t.formato;
  if (typeof f === 'number' && Number.isInteger(f) && f > FORMATO_TESTIGO) {
    return { fila: 'presente', estructural: true, concepto: '4b', version, revision: null };
  }
  if (f !== FORMATO_TESTIGO || typeof t.revision !== 'string' || !t.revision) {
    return { fila: 'presente', estructural: true, concepto: '4a', version, revision: null };
  }
  /* Un testigo con forma válida sin `version`: ninguna escritura de la A-bis lo produce. Es 4a. */
  if (version !== 1) return { fila: 'presente', estructural: true, concepto: '4a', version, revision: null };
  return { fila: 'presente', estructural: true, concepto: '2', version, revision: t.revision };
}

/** La `revision` del testigo del estado de la pantalla, si es un testigo válido presente (la `base`, §1). */
export function revisionDelTestigo(valor) {
  if (!esObjeto(valor)) return null;
  const c = conceptoDelHorario({ existe: true, valor });
  return c.concepto === '2' ? c.revision : null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LA FILA `horarioGuardia:<aparato>` (§2)
   =========================================================================== */
const listaDeObjetosConId = (l) => Array.isArray(l) && l.every((x) => esObjeto(x) && typeof x.id === 'string' && !!x.id);

/** ¿Se entiende esta fila? `{ ok: true, fila }` o `{ ok: false, motivo }` (`formato_futuro`, `aparato_distinto`,
 *  `malformada`). Una fila que no se entiende NO se escribe y hace la lectura «no verificable». */
export function leerFilaDeGuardia(clave, valor) {
  if (typeof clave !== 'string' || !clave.startsWith(PREFIJO_GUARDIA_HORARIO)) return { ok: false, motivo: 'malformada' };
  const v = valor;
  if (!esObjeto(v)) return { ok: false, motivo: 'malformada' };
  if (typeof v.formato === 'number' && Number.isInteger(v.formato) && v.formato > FORMATO_GUARDIA) return { ok: false, motivo: 'formato_futuro' };
  if (v.formato !== FORMATO_GUARDIA) return { ok: false, motivo: 'malformada' };
  if (typeof v.aparato !== 'string' || !v.aparato || clave !== claveDeGuardia(v.aparato)) return { ok: false, motivo: 'aparato_distinto' };
  if (!Number.isInteger(v.secuencia) || v.secuencia < 1) return { ok: false, motivo: 'malformada' };
  if (typeof v.ultimaOperacion !== 'string' || !v.ultimaOperacion) return { ok: false, motivo: 'malformada' };
  if (!esObjeto(v.primeraVezA)) return { ok: false, motivo: 'malformada' };
  if (!esObjeto(v.visitas) || !Object.values(v.visitas).every(esObjeto)) return { ok: false, motivo: 'malformada' };
  if (!['detecciones', 'retiradas', 'resoluciones'].every((k) => listaDeObjetosConId(v[k]))) return { ok: false, motivo: 'malformada' };
  if (v.testigo !== undefined) {
    if (!esObjeto(v.testigo)) return { ok: false, motivo: 'malformada' };
    if (v.testigo.intenciones !== undefined && !listaDeObjetosConId(v.testigo.intenciones)) return { ok: false, motivo: 'malformada' };
    for (const k of ['escrito', 'visto']) {
      const x = v.testigo[k];
      if (x !== undefined && x !== null && !esObjeto(x)) return { ok: false, motivo: 'malformada' };
    }
  }
  return { ok: true, fila: v };
}

/** Todas las filas leídas: `{ ok, filas: [valor…] }` o `{ ok: false, motivo }` si alguna no se entiende. */
export function leerFilasDeGuardia(lista) {
  if (!Array.isArray(lista)) return { ok: false, motivo: 'lectura_guardia' };
  const filas = [];
  for (const r of lista) {
    const p = leerFilaDeGuardia(r && r.key, r && r.value);
    if (!p.ok) return { ok: false, motivo: p.motivo === 'formato_futuro' ? 'fila_formato_futuro' : p.motivo === 'aparato_distinto' ? 'fila_aparato_distinto' : 'fila_malformada' };
    filas.push({ ...p.fila, __creada: r.updated_at || null });
  }
  return { ok: true, filas };
}
const sinMeta = (f) => { if (!f) return f; const { __creada, ...resto } = f; return resto; };

const tieneDemostracion = (f) => esObjeto(f.testigo) && (esObjeto(f.testigo.visto) || esObjeto(f.testigo.escrito));
const tieneIntencion = (f) => esObjeto(f.testigo) && Array.isArray(f.testigo.intenciones) && f.testigo.intenciones.length > 0;
const revisionesDe = (f) => {
  if (!esObjeto(f.testigo)) return [];
  const r = [];
  for (const k of ['escrito', 'visto']) {
    const x = f.testigo[k];
    if (!esObjeto(x)) continue;
    for (const e of ['primera', 'ultima']) if (esObjeto(x[e]) && typeof x[e].revision === 'string') r.push(x[e].revision);
  }
  return r;
};
const resueltoPor = (filas, idRegistro) => filas.some((f) => f.resoluciones.some((x) => DECISIONES_RESOLUCION.includes(x.decision)
  && Array.isArray(x.deteccionIds) && x.deteccionIds.includes(idRegistro)));

/** Lo que dicen todas las filas juntas: registros, demostración, intenciones y retiradas. No guarda nada. */
export function resumenDeFilas(filas = []) {
  const registros = [];
  for (const f of filas) for (const d of f.detecciones) registros.push({ ...d, aparato: f.aparato });
  const conocidas = [...new Set(registros.map((r) => r.id))].sort();
  return {
    registros: registros.map((r) => ({ ...r, resuelto: resueltoPor(filas, r.id) })),
    conocidas,
    demostrado: filas.some(tieneDemostracion),
    intencion: filas.some(tieneIntencion),
    intenciones: filas.flatMap((f) => (tieneIntencion(f) ? f.testigo.intenciones.map((i) => ({ ...i, aparato: f.aparato })) : [])),
    retiradas: filas.flatMap((f) => f.retiradas.map((x) => ({ ...x, aparato: f.aparato }))),
    resoluciones: filas.flatMap((f) => f.resoluciones.map((x) => ({ ...x, aparato: f.aparato, reconocida: DECISIONES_RESOLUCION.includes(x.decision) }))),
    revisionesDemostradas: [...new Set(filas.flatMap(revisionesDe))].sort(),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · LA CLASIFICACIÓN (§6.4–§6.7, tabla corregida del §6.6)
   =========================================================================== */
const noVerificable = (motivo) => ({ clase: 'no_verificable', motivo });

const contar = (l) => (Array.isArray(l) ? l.length : null);
export function evidenciaDe(lectura, resumen) {
  const v = lectura && lectura.existe ? lectura.valor : undefined;
  const obj = esObjeto(v);
  const teniaVersion = obj && tiene(v, 'version') && v.version !== null && v.version !== undefined;
  return {
    teniaVersion: !!teniaVersion,
    version: teniaVersion ? v.version : null,
    horarios: obj ? contar(v.horarios) : null,
    reglas: obj ? contar(v.bloques) : null,
    excepciones: obj ? contar(v.excepciones) : null,
    actividades: obj ? contar(v.actividades) : null,
    revisionesDemostradas: resumen.revisionesDemostradas,
  };
}

/**
 * La clasificación de una carga. Entrada (solo lo leído en el servidor):
 *   · `lectura`  — `leerFilasDeGuardia(...)` de TODAS las filas;
 *   · `horario`  — la lectura propia de `horarioTop`: `{ ok, existe, valor }`;
 *   · `guardiaA` — `guardiaDeVersionHorario(...)` de la entrega A (para saber si reconoce `version`);
 *   · `cargaFallida` — si `horarioTop` no se pudo cargar al arrancar;
 *   · `aparato`, `huella`.
 * Devuelve `{ clase: 'no_verificable' | 'sin_clasificar' | 'E1' | 'E2' | 'AI' | 'B' | 'C', … }`.
 */
export function clasificarHorario({ lectura, horario, guardiaA = null, cargaFallida = false, aparato = null, huella = null }) {
  if (!aparato) return noVerificable('sin_aparato');
  if (!lectura || !lectura.ok) return noVerificable((lectura && lectura.motivo) || 'lectura_guardia');
  if (cargaFallida) return noVerificable('horario_sin_cargar');
  if (!horario || !horario.ok) return noVerificable('lectura_horario');
  const resumen = resumenDeFilas(lectura.filas);
  const base = { resumen, demostrado: resumen.demostrado, intencion: resumen.intencion };
  const motivoA = guardiaA && guardiaA.motivo;
  if (motivoA === 'version_futura' || motivoA === 'version_ilegible') return { ...base, clase: 'sin_clasificar', concepto: null };
  const c = conceptoDelHorario(horario);
  if (c.concepto === 'version_no_reconocida') return { ...base, clase: 'sin_clasificar', concepto: c.concepto };
  if (c.concepto === '4b') return { ...noVerificable('testigo_formato_futuro'), concepto: '4b' };
  /* E1 exige el concepto 2: que el horario sea estructuralmente válido nunca basta. */
  if (c.concepto === '2') return { ...base, clase: 'E1', concepto: '2', revision: c.revision };
  if (!resumen.demostrado) return { ...base, clase: resumen.intencion ? 'AI' : 'E2', concepto: c.concepto };
  let claseRegistro;
  let motivoRegistro;
  if (c.concepto === 'fila_ausente') { claseRegistro = 'perdida'; motivoRegistro = 'fila_ausente'; }
  else if (c.concepto === '4a') { claseRegistro = 'perdida'; motivoRegistro = 'testigo_ilegible'; }
  else { claseRegistro = c.version === 1 ? 'ambigua' : 'perdida'; motivoRegistro = 'testigo_ausente'; }
  const supresion = suprimir({ filas: lectura.filas, registros: resumen.registros, aparato, huella });
  return {
    ...base,
    clase: CLASES_INCIDENCIA[claseRegistro], concepto: c.concepto, claseRegistro, motivoRegistro,
    suprimido: !!supresion, suprimidoPor: supresion ? supresion.id : null,
    evidencia: evidenciaDe(horario, resumen), huella,
  };
}

/** La supresión (§6.7), igual para B y C. No se crea un registro nuevo si hay uno D con la misma huella (no nula)
 *  y ningún `visto` lo conoce. Con huella `null`, si la fila propia tiene un registro sin un `visto` posterior. */
export function suprimir({ filas, registros, aparato, huella }) {
  if (huella) {
    const conocidoEnAlgunVisto = (id) => filas.some((f) => esObjeto(f.testigo) && esObjeto(f.testigo.visto)
      && esObjeto(f.testigo.visto.ultima) && Array.isArray(f.testigo.visto.ultima.conocidas) && f.testigo.visto.ultima.conocidas.includes(id));
    return registros.find((d) => d.huella === huella && !conocidoEnAlgunVisto(d.id)) || null;
  }
  const propia = filas.find((f) => f.aparato === aparato);
  if (!propia) return null;
  const visto = esObjeto(propia.testigo) && esObjeto(propia.testigo.visto) && esObjeto(propia.testigo.visto.ultima) ? propia.testigo.visto.ultima : null;
  return propia.detecciones.find((r) => !(visto && Number(visto.secuencia) > Number(r.secuencia))) || null;
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · CONSTRUIR UNA ESCRITURA DE LA FILA: partes idempotentes + el invariante (§2, §5)
   ---------------------------------------------------------------------------
   Una operación es una lista de PARTES; cada una sabe si ya está en la fila (`satisfecha`) y cómo ponerse
   (`aplicar`). Reintentar con lo ya aplicado no cambia nada: así un reintento nunca crea un registro nuevo.
   =========================================================================== */
export function filaNueva({ aparato, versionApp, en }) {
  return {
    formato: FORMATO_GUARDIA, aparato, secuencia: 0, ultimaOperacion: null,
    primeraVezA: { en, versionApp }, etiqueta: null, visitas: {},
    testigo: { intenciones: [] }, detecciones: [], retiradas: [], resoluciones: [],
  };
}
const testigoDe = (fila) => {
  if (!esObjeto(fila.testigo)) fila.testigo = { intenciones: [] };
  if (!Array.isArray(fila.testigo.intenciones)) fila.testigo.intenciones = [];
  return fila.testigo;
};

export function parteVisita({ versionApp, en, fecha }) {
  const ver = String(versionApp);
  return {
    tipo: 'visita',
    satisfecha: (f) => { const v = f && esObjeto(f.visitas) ? f.visitas[ver] : null; return !!(esObjeto(v) && esObjeto(v.ultima) && String(v.ultima.fecha) >= fecha); },
    aplicar: (f, secuencia) => {
      const v = esObjeto(f.visitas[ver]) ? f.visitas[ver] : {};
      const entrada = { en, fecha, secuencia };
      f.visitas = { ...f.visitas, [ver]: { ...v, primera: esObjeto(v.primera) ? v.primera : entrada, ultima: entrada } };
    },
  };
}
export function parteVisto({ revision, conocidas, en }) {
  const lista = [...conocidas].sort();
  return {
    tipo: 'visto',
    satisfecha: (f) => {
      const u = f && esObjeto(f.testigo) && esObjeto(f.testigo.visto) ? f.testigo.visto.ultima : null;
      if (!esObjeto(u)) return false;
      if (String(u.en) > en) return true;
      /* §6.6 — se apunta la primera vez, cuando cambian las conocidas y una vez al día (no por cambiar la revisión). */
      return Array.isArray(u.conocidas) && lista.every((x) => u.conocidas.includes(x)) && fechaDeMarca(u.en) === fechaDeMarca(en);
    },
    aplicar: (f, secuencia) => {
      const t = testigoDe(f);
      const v = esObjeto(t.visto) ? t.visto : {};
      t.visto = { ...v, primera: esObjeto(v.primera) ? v.primera : { revision, secuencia, en }, ultima: { revision, secuencia, en, conocidas: lista } };
    },
  };
}
export function parteEscrito({ revision, en }) {
  return {
    tipo: 'escrito',
    satisfecha: (f) => {
      const u = f && esObjeto(f.testigo) && esObjeto(f.testigo.escrito) ? f.testigo.escrito.ultima : null;
      return esObjeto(u) && (u.revision === revision || String(u.en) > en);
    },
    aplicar: (f, secuencia) => {
      const t = testigoDe(f);
      const e = esObjeto(t.escrito) ? t.escrito : {};
      t.escrito = { ...e, primera: esObjeto(e.primera) ? e.primera : { revision, secuencia, en }, ultima: { revision, secuencia, en } };
    },
  };
}
export function parteIntencion({ id, en }) {
  return {
    tipo: 'intencion', id,
    satisfecha: (f) => !!(f && esObjeto(f.testigo) && Array.isArray(f.testigo.intenciones) && f.testigo.intenciones.some((x) => x && x.id === id)),
    aplicar: (f, secuencia) => { const t = testigoDe(f); t.intenciones = [...t.intenciones, { id, secuencia, en }]; },
  };
}
export function parteRegistro(registro) {
  return {
    tipo: 'registro', id: registro.id,
    satisfecha: (f) => !!(f && Array.isArray(f.detecciones) && f.detecciones.some((x) => x && x.id === registro.id)),
    aplicar: (f, secuencia) => { f.detecciones = [...f.detecciones, { ...registro, secuencia }]; },
  };
}

/** La fila nueva a partir de la recién leída (`actual`, o `null` si no existe), o `null` si no hay nada que
 *  cambiar. Se construye SIEMPRE a partir de lo leído: lo que esta versión no conoce viaja tal cual. */
export function construirFila(actual, partes, { opId, aparato, versionApp, en, fecha }) {
  const nueva = actual ? copiar(sinMeta(actual)) : filaNueva({ aparato, versionApp, en });
  const secuencia = (actual ? actual.secuencia : 0) + 1;
  /* Una fila nueva nace con su visita (`visitas` tiene al menos una). */
  const todas = actual || partes.some((p) => p.tipo === 'visita') ? partes : [parteVisita({ versionApp, en, fecha }), ...partes];
  let cambio = false;
  for (const p of todas) {
    if (!p.satisfecha(nueva)) { p.aplicar(nueva, secuencia); cambio = true; }
  }
  if (!cambio) return null;
  nueva.secuencia = secuencia;
  nueva.ultimaOperacion = opId;
  return nueva;
}

const empiezaPor = (anterior, nueva) => Array.isArray(nueva) && Array.isArray(anterior) && nueva.length >= anterior.length
  && anterior.every((x, i) => textoCanonico(x) === textoCanonico(nueva[i]));
/** El invariante (§2), antes de enviar nada. */
export function cumpleInvariante(actual, nueva) {
  if (!esObjeto(nueva) || nueva.formato !== FORMATO_GUARDIA || typeof nueva.ultimaOperacion !== 'string' || !nueva.ultimaOperacion) return false;
  const listas = (f) => [f.detecciones, f.retiradas, f.resoluciones];
  if (!actual) {
    return nueva.secuencia === 1 && listas(nueva).every(Array.isArray) && esObjeto(nueva.primeraVezA)
      && esObjeto(nueva.visitas) && Object.keys(nueva.visitas).length > 0;
  }
  const a = sinMeta(actual);
  if (nueva.formato !== a.formato || nueva.aparato !== a.aparato) return false;
  if (textoCanonico(nueva.primeraVezA) !== textoCanonico(a.primeraVezA)) return false;
  if (nueva.secuencia !== a.secuencia + 1) return false;
  if (!empiezaPor(a.detecciones, nueva.detecciones) || !empiezaPor(a.retiradas, nueva.retiradas) || !empiezaPor(a.resoluciones, nueva.resoluciones)) return false;
  const intA = esObjeto(a.testigo) && Array.isArray(a.testigo.intenciones) ? a.testigo.intenciones : [];
  const intN = esObjeto(nueva.testigo) && Array.isArray(nueva.testigo.intenciones) ? nueva.testigo.intenciones : [];
  return empiezaPor(intA, intN);
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · EL EVALUADOR DE LA B (§9) — puro, solo lectura
   =========================================================================== */
export const versionComparable = (v) => typeof v === 'string' && /^\d+\.\d+\.\d+$/.test(v);
export function compararVersiones(a, b) {
  const x = a.split('.').map(Number); const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  return 0;
}
const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * `{ condiciones: [{ id, estado: 'cumple' | 'no_cumple' | 'no_verificable', motivo }], cumpleTodas }`.
 * Entrada: `lectura` (de `leerFilasDeGuardia`), `horario` (la lectura propia de ESTA evaluación), `guardiaA`,
 * `pendientes` (escrituras de esta sesión sin confirmar), `versionMinima`, `margenDias`, `ahora`.
 * ⚠️ No lee `testigo.intenciones`: una intención nunca hace pasar la condición 3.
 */
export function evaluarCondicionesB({ lectura, horario, guardiaA = null, pendientes = 0, versionMinima, margenDias, ahora = new Date() }) {
  const nv = (id, motivo) => ({ id, estado: 'no_verificable', motivo });
  const condiciones = [];
  condiciones.push(nv('margen', margenDias === undefined || margenDias === null
    ? 'El margen (margenDias) no está fijado.' : 'Faltan los requisitos de la hora del servidor.'));
  const lecturaOk = !!(lectura && lectura.ok && horario && horario.ok);
  if (!lecturaOk) {
    condiciones.push(nv('incidencias', 'No se han podido leer las filas o el horario.'));
    condiciones.push(nv('testigo', 'No se ha podido leer el horario.'));
    condiciones.push(nv('versiones', 'No se han podido leer las filas.'));
  } else {
    const filas = lectura.filas;
    const r = resumenDeFilas(filas);
    const abiertos = r.registros.filter((x) => !x.resuelto);
    /* 2 · Incidencias: ningún registro (B o C) sin una resolución reconocida que nombre su id. */
    if (abiertos.length) condiciones.push({ id: 'incidencias', estado: 'no_cumple', motivo: `${abiertos.length} incidencia(s) sin resolver.` });
    else if (pendientes > 0) condiciones.push(nv('incidencias', 'Hay escrituras de la guardia sin confirmar.'));
    else condiciones.push({ id: 'incidencias', estado: 'cumple', motivo: 'Ninguna incidencia sin resolver.' });
    /* 3 · Testigo: concepto 2 en la lectura de AHORA y ninguna C sin resolver. */
    const motivoA = guardiaA && guardiaA.motivo;
    const c = conceptoDelHorario(horario);
    const cAbiertas = abiertos.filter((x) => x.clase === 'ambigua');
    if (motivoA === 'version_futura' || motivoA === 'version_ilegible' || c.concepto === 'version_no_reconocida') condiciones.push(nv('testigo', 'La versión del horario no se reconoce.'));
    else if (c.concepto === '4b') condiciones.push(nv('testigo', 'El testigo es de un formato posterior.'));
    else if (c.concepto === '2' && !cAbiertas.length) condiciones.push({ id: 'testigo', estado: 'cumple', motivo: 'Testigo válido presente.' });
    else if (cAbiertas.length) condiciones.push(nv('testigo', 'Hay una situación ambigua sin resolver.'));
    else if (!r.demostrado) condiciones.push(nv('testigo', 'Todavía no hay un testigo demostrado (arranque).'));
    else if (c.concepto === '3' && c.version === 1) condiciones.push(nv('testigo', 'Falta el testigo en una escritura con versión: situación ambigua.'));
    else condiciones.push({ id: 'testigo', estado: 'no_cumple', motivo: 'Falta un testigo demostrado.' });
    /* 4 · Versiones de los aparatos. */
    condiciones.push(condicionVersiones(filas, versionMinima, ahora));
  }
  condiciones.push(nv('confirmacion', 'Tu confirmación no se pide en esta entrega.'));
  return { condiciones, cumpleTodas: condiciones.every((x) => x.estado === 'cumple') };
}

function condicionVersiones(filas, versionMinima, ahora) {
  if (!versionComparable(versionMinima)) return { id: 'versiones', estado: 'no_verificable', motivo: 'La versión mínima (versionMinima) no está fijada.' };
  const t0 = ahora instanceof Date ? ahora.getTime() : Number(ahora);
  const reciente = (en) => { const t = Date.parse(en); return !Number.isFinite(t) || t > t0 || t0 - t <= DIAS_VISITA_RECIENTE * DIA_MS; };
  let noVerificable = false;
  let noCumple = false;
  for (const f of filas) {
    const visitas = Object.entries(f.visitas).map(([ver, v]) => ({ ver, en: esObjeto(v.ultima) ? v.ultima.en : null }));
    const recientes = visitas.filter((v) => reciente(v.en));
    if (recientes.length) {
      for (const v of recientes) {
        if (!versionComparable(v.ver)) noVerificable = true;
        else if (compararVersiones(v.ver, versionMinima) < 0) noCumple = true;
      }
    } else if (visitas.length) {
      const ultima = [...visitas].sort((a, b) => (Date.parse(b.en) || 0) - (Date.parse(a.en) || 0))[0];
      const mala = !versionComparable(ultima.ver) || compararVersiones(ultima.ver, versionMinima) < 0;
      const retirada = filas.some((g) => g.retiradas.some((x) => x.aparatoRetirado === f.aparato && x.secuenciaVista === f.secuencia));
      if (mala && !retirada) noCumple = true;
    }
  }
  if (noCumple) return { id: 'versiones', estado: 'no_cumple', motivo: 'Algún aparato usa una versión anterior a la mínima.' };
  if (noVerificable) return { id: 'versiones', estado: 'no_verificable', motivo: 'Hay una versión que no se puede comparar.' };
  return { id: 'versiones', estado: 'cumple', motivo: 'Todos los aparatos están en la versión mínima o posterior.' };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · TEXTOS (para la pantalla de consulta y los avisos)
   =========================================================================== */
export const TEXTOS_NO_VERIFICABLE = Object.freeze({
  sin_aparato: 'Este aparato no puede crear su identificador.',
  lectura_guardia: 'No se ha podido leer la comprobación de tus aparatos.',
  fila_formato_futuro: 'Un aparato usa una versión más nueva de la comprobación.',
  fila_aparato_distinto: 'La comprobación de un aparato no coincide con su nombre.',
  fila_malformada: 'La comprobación de un aparato no se entiende.',
  horario_sin_cargar: 'Tu horario no se ha podido cargar.',
  lectura_horario: 'No se ha podido leer tu horario para comprobarlo.',
  testigo_formato_futuro: 'Tu horario se guardó con una versión más nueva de la comprobación.',
});
export function textoDelTestigo({ estado, demostrado } = {}) {
  if (estado === 'E2') return 'Inicial';
  if (estado === 'AI') return 'Arranque incompleto (se completará con tu próximo guardado)';
  if (estado === 'C') return 'Situación ambigua';
  if (estado === 'B') return 'Falta un testigo demostrado';
  if (estado === 'E1') return demostrado ? 'Testigo demostrado' : 'Inicial';
  return '—';
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · EL CONTROLADOR DE LA SESIÓN
   ---------------------------------------------------------------------------
   `transporte` (en la app, `transporteDeGuardia` de `supabase.js`):
     leerTodas(usuario)                         → { ok, filas: [{ key, value, updated_at }], sinRespuesta?, error? }
     leerPropia(usuario, clave)                 → { ok, existe, valor, sinRespuesta?, error? }
     insertar(usuario, clave, valor)            → { ok, conflicto?, sinRespuesta?, error?, definitivo? }
     actualizarSiBase(usuario, clave, valor, b) → { ok, aplicada, sinRespuesta?, error?, definitivo? }
     leerHorario(usuario)                       → { ok, existe, valor, sinRespuesta?, error? }
   Estados de una escritura (y de un registro de incidencia): E3 sin enviar, E4 enviada sin respuesta,
   E5 conflicto, E7 conflicto repetido, E6 confirmada en el servidor.
   =========================================================================== */
export function candadoDeGuardia(nombre = 'josstyle:horarioGuardia') {
  try {
    if (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') {
      return (fn) => navigator.locks.request(nombre, fn);
    }
  } catch { /* sin Web Locks: se sigue adelante (§5) */ }
  return null;
}

export function crearGuardiaDeHorario({
  transporte, usuario, versionApp = 'desarrollo', aparato, candado = candadoDeGuardia(),
  ahora = () => new Date(), crypto = globalThis.crypto,
} = {}) {
  const id = aparato === undefined ? idDelAparato({ crypto }) : aparato;
  const clave = id ? claveDeGuardia(id) : null;
  const s = {
    estado: 'E0', motivo: null, entrada: null, comprobando: false, cerrada: false,
    clasificacion: null, lectura: null, horario: null,
    demostradoSesion: false, intencionSesion: false, revisionesSesion: new Set(),
    ops: [], registroOp: null, intencionOp: null,
    demostracion: Promise.resolve(),
  };
  const oyentes = new Set();
  let cadena = Promise.resolve();
  const avisar = () => { if (s.cerrada) return; oyentes.forEach((fn) => { try { fn(); } catch { /* un oyente roto no para a los demás */ } }); };
  const marca = () => { const d = ahora(); return { en: d.toISOString(), fecha: fechaLocal(d) }; };

  const actualizarFilaPropia = (valor) => {
    if (!s.lectura || !s.lectura.ok || !valor) return;
    const otras = s.lectura.filas.filter((f) => f.aparato !== id);
    s.lectura = { ok: true, filas: [...otras, { ...valor, __creada: (s.lectura.filas.find((f) => f.aparato === id) || {}).__creada || null }] };
  };

  const ponerEstado = (op, estado, motivo = null) => { op.estado = estado; op.motivo = motivo; avisar(); };
  const confirmar = (op, fila) => {
    op.estado = 'E6'; op.motivo = null;
    if (op.partes.some((p) => p.tipo === 'intencion')) s.intencionSesion = true;
    if (op.partes.some((p) => p.tipo === 'escrito' || p.tipo === 'visto')) s.demostradoSesion = true;
    actualizarFilaPropia(fila);
    avisar();
    return op;
  };
  const satisfecha = (op, fila) => !!fila && op.partes.every((p) => p.satisfecha(fila));
  const releer = async () => {
    try {
      const r = await transporte.leerPropia(usuario, clave);
      if (!r || !r.ok) return { ok: false };
      if (!r.existe) return { ok: true, fila: null };
      const p = leerFilaDeGuardia(clave, r.valor);
      return p.ok ? { ok: true, fila: p.fila } : { ok: false, motivo: p.motivo };
    } catch { return { ok: false }; }
  };

  /* §5 — el escritor condicional. Nunca lanza: devuelve la operación con su estado. */
  async function ejecutar(op) {
    if (s.cerrada) return op;
    try {
      for (let intento = 1; intento <= INTENTOS_GUARDIA; intento += 1) {
        const leida = await releer();
        if (!leida.ok) return ponerEstado(op, op.enviada ? 'E4' : 'E3', leida.motivo || 'lectura'), op;
        const actual = leida.fila;
        if (satisfecha(op, actual)) return confirmar(op, actual);
        const d = marca();
        const nueva = construirFila(actual, op.partes, { opId: op.opId, aparato: id, versionApp, en: d.en, fecha: d.fecha });
        if (!nueva) return confirmar(op, actual);
        if (!cumpleInvariante(actual, nueva)) return ponerEstado(op, 'E3', 'invariante'), op;
        op.enviada = true;
        ponerEstado(op, 'E4');
        let w;
        try {
          w = actual ? await transporte.actualizarSiBase(usuario, clave, nueva, actual.ultimaOperacion) : await transporte.insertar(usuario, clave, nueva);
        } catch (e) { w = { ok: false, sinRespuesta: true, error: e }; }
        if (w && (w.conflicto || (w.ok && w.aplicada === false))) { ponerEstado(op, 'E5', 'conflicto'); continue; }
        if (!w || w.sinRespuesta || w.ok) {
          const rr = await releer();
          if (rr.ok && satisfecha(op, rr.fila)) return confirmar(op, rr.fila);
          if (!rr.ok || !w || w.sinRespuesta) return ponerEstado(op, 'E4', 'sin_confirmar'), op;
          ponerEstado(op, 'E5', 'conflicto');
          continue;
        }
        return ponerEstado(op, w.definitivo ? 'E3' : 'E4', 'error'), op;
      }
      return ponerEstado(op, 'E7', 'conflicto_repetido'), op;
    } catch {
      return ponerEstado(op, op.enviada ? 'E4' : 'E3', 'error'), op;
    }
  }
  const conCandado = (fn) => (candado ? Promise.resolve(candado(fn)) : fn());
  const encolar = (op) => {
    const p = cadena.then(() => conCandado(() => ejecutar(op))).catch(() => op);
    cadena = p.then(() => undefined, () => undefined);
    return p;
  };
  const nuevaOperacion = (partes, tipo) => {
    const op = { opId: nuevoUuid(crypto), tipo, partes, estado: 'E3', motivo: null, enviada: false };
    s.ops.push(op);
    return op;
  };

  const motivoBloqueo = () => {
    if (s.cerrada) return null;
    if (s.estado === 'E0') return MOTIVOS_BLOQUEO_GUARDIA.comprobando;
    if (s.estado === 'no_verificable') return MOTIVOS_BLOQUEO_GUARDIA.noVerificable;
    if (s.registroOp && s.registroOp.estado !== 'E6') return MOTIVOS_BLOQUEO_GUARDIA.incidencia;
    return null;
  };
  const demostrado = () => s.demostradoSesion || !!(s.clasificacion && s.clasificacion.demostrado);
  const enArranque = () => !demostrado();
  const hayIntencion = () => s.intencionSesion || !!(s.clasificacion && s.clasificacion.intencion);

  /** §6 — la comprobación. Solo desde E0 o desde «no verificable» (un estado que ya bloquea). */
  async function comprobar(entrada = s.entrada || {}) {
    if (s.cerrada || s.comprobando) return vista();
    if (s.estado !== 'E0' && s.estado !== 'no_verificable') return vista();
    s.entrada = entrada;
    s.comprobando = true;
    try {
      const fin = (motivo) => { s.estado = 'no_verificable'; s.motivo = motivo; avisar(); return vista(); };
      if (!id || !clave) return fin('sin_aparato');
      let lt;
      try { lt = await transporte.leerTodas(usuario); } catch { lt = null; }
      if (s.cerrada) return vista();
      if (!lt || !lt.ok) return fin('lectura_guardia');
      const lectura = leerFilasDeGuardia(lt.filas);
      if (!lectura.ok) return fin(lectura.motivo);
      if (entrada.cargaFallida) return fin('horario_sin_cargar');
      let lh;
      try { lh = await transporte.leerHorario(usuario); } catch { lh = null; }
      if (s.cerrada) return vista();
      if (!lh || !lh.ok) return fin('lectura_horario');
      const huella = await huellaDeHorario(lh.valor, lh.existe, crypto);
      const cl = clasificarHorario({ lectura, horario: lh, guardiaA: entrada.guardiaA || null, cargaFallida: !!entrada.cargaFallida, aparato: id, huella });
      if (cl.clase === 'no_verificable') return fin(cl.motivo);
      s.lectura = lectura; s.horario = lh; s.clasificacion = cl;
      s.estado = cl.clase; s.motivo = null;
      const d = marca();
      const partes = [parteVisita({ versionApp, en: d.en, fecha: d.fecha })];
      if (cl.clase === 'E1') partes.push(parteVisto({ revision: cl.revision, conocidas: cl.resumen.conocidas, en: d.en }));
      let registro = null;
      if ((cl.clase === 'B' || cl.clase === 'C') && !cl.suprimido) {
        registro = {
          id: nuevoUuid(crypto), en: d.en, fecha: d.fecha, versionApp: String(versionApp),
          clase: cl.claseRegistro, motivo: cl.motivoRegistro, huella: cl.huella, evidencia: cl.evidencia,
        };
        partes.push(parteRegistro(registro));
      }
      const op = nuevaOperacion(partes, registro ? 'registro' : 'carga');
      if (registro) { op.registro = registro; s.registroOp = op; }
      avisar();
      await encolar(op);
      return vista();
    } finally {
      s.comprobando = false;
      avisar();
    }
  }

  /** §1 y §7 — el valor que guarda la aplicación: `version: 1` siempre; el testigo fuera del arranque o con
   *  una intención confirmada. En E2, el primer guardado pone en marcha la intención (sin esperarla). */
  function prepararEscritura(nuevo, actual) {
    if (s.cerrada || !id || motivoBloqueo() || !esObjeto(nuevo)) return { valor: nuevo, conTestigo: false, arranque: enArranque() };
    const arranque = enArranque();
    const llevaTestigo = !arranque || hayIntencion();
    const valor = { ...nuevo, version: VERSION_ESCRITA_HORARIO };
    let revision = null;
    if (llevaTestigo) {
      revision = nuevoUuid(crypto);
      /* Solo un testigo válido presente (concepto 2) pasa sus campos desconocidos y su «desde»: uno mal formado se sustituye. */
      const anteriorValido = revisionDelTestigo(actual) !== null;
      const anterior = anteriorValido ? actual.testigo : {};
      const d = ahora().toISOString();
      valor.testigo = {
        ...anterior,
        formato: FORMATO_TESTIGO,
        desde: anteriorValido && typeof anterior.desde === 'string' ? anterior.desde : d,
        ultimaEscritura: d,
        revision,
        base: revisionDelTestigo(actual),
        aparato: id,
      };
      if (!revision) delete valor.testigo;
      else s.revisionesSesion.add(revision);
    } else {
      delete valor.testigo;
    }
    if (arranque && !hayIntencion() && !s.intencionOp) {
      const d = marca();
      const op = nuevaOperacion([parteIntencion({ id: nuevoUuid(crypto), en: d.en })], 'intencion');
      s.intencionOp = op;
      encolar(op);
    }
    return { valor, conTestigo: !!valor.testigo, arranque, revision };
  }

  /** §7.5 — después de un guardado con testigo en el arranque, la relectura que lo demuestra. Nunca registra
   *  una incidencia: sin testigo demostrado no puede salir ni B ni C. */
  function despuesDeGuardar(preparado, esperar) {
    if (s.cerrada || !preparado || !preparado.conTestigo || !preparado.arranque) return s.demostracion;
    s.demostracion = s.demostracion.then(async () => {
      try { await esperar; } catch { /* con error o sin respuesta también se relee */ }
      if (s.cerrada || demostrado()) return;
      let lh;
      try { lh = await transporte.leerHorario(usuario); } catch { lh = null; }
      if (s.cerrada || !lh || !lh.ok) return;
      const c = conceptoDelHorario(lh);
      if (c.concepto !== '2') return;
      const d = marca();
      if (s.revisionesSesion.has(c.revision)) {
        await encolar(nuevaOperacion([parteEscrito({ revision: c.revision, en: d.en })], 'escrito'));
      } else {
        let lt;
        try { lt = await transporte.leerTodas(usuario); } catch { lt = null; }
        const lectura = lt && lt.ok ? leerFilasDeGuardia(lt.filas) : null;
        if (!lectura || !lectura.ok) return;
        await encolar(nuevaOperacion([parteVisto({ revision: c.revision, conocidas: resumenDeFilas(lectura.filas).conocidas, en: d.en })], 'visto'));
      }
    }).catch(() => undefined);
    return s.demostracion;
  }

  /** Al volver la conexión o con «Reintentar»: vuelve a comprobar si no se pudo, y reintenta lo que no se
   *  confirmó con sus mismos identificadores. */
  async function reintentar() {
    if (s.cerrada) return vista();
    if (s.estado === 'no_verificable') return comprobar(s.entrada || {});
    const pendientes = s.ops.filter((op) => op.estado !== 'E6');
    await Promise.all(pendientes.map((op) => encolar(op)));
    return vista();
  }

  /** Lo que enseña la pantalla. Una foto: no se edita. */
  function vista() {
    const r = s.lectura && s.lectura.ok ? resumenDeFilas(s.lectura.filas) : null;
    const pendientes = s.ops.filter((op) => op.estado !== 'E6');
    const reg = s.registroOp;
    return {
      estado: s.estado, motivo: s.motivo, aparato: id, versionApp: String(versionApp),
      motivoBloqueo: motivoBloqueo(),
      demostrado: demostrado(), intencion: hayIntencion(), arranque: enArranque(),
      textoTestigo: textoDelTestigo({ estado: s.estado, demostrado: demostrado() }),
      filas: s.lectura && s.lectura.ok ? s.lectura.filas.map(sinMeta) : [],
      creadas: s.lectura && s.lectura.ok ? Object.fromEntries(s.lectura.filas.map((f) => [f.aparato, f.__creada])) : {},
      resumen: r,
      clasificacion: s.clasificacion ? { clase: s.clasificacion.clase, concepto: s.clasificacion.concepto, suprimido: !!s.clasificacion.suprimido } : null,
      registroPendiente: reg && reg.estado !== 'E6' ? { ...reg.registro, estadoEscritura: reg.estado } : null,
      estadoRegistro: reg ? reg.estado : null,
      pendientes: pendientes.length,
      operaciones: s.ops.map((op) => ({ opId: op.opId, tipo: op.tipo, estado: op.estado, motivo: op.motivo })),
    };
  }

  /** §9 — la evaluación con una lectura NUEVA (la de «esta evaluación»). */
  async function evaluar({ versionMinima, margenDias } = {}) {
    let lt = null; let lh = null;
    try { lt = await transporte.leerTodas(usuario); } catch { lt = null; }
    try { lh = await transporte.leerHorario(usuario); } catch { lh = null; }
    const lectura = lt && lt.ok ? leerFilasDeGuardia(lt.filas) : { ok: false };
    return evaluarCondicionesB({
      lectura, horario: lh && lh.ok ? lh : { ok: false }, guardiaA: s.entrada && s.entrada.guardiaA,
      pendientes: s.ops.filter((op) => op.estado !== 'E6').length, versionMinima, margenDias, ahora: ahora(),
    });
  }

  return {
    aparato: id,
    comprobar, prepararEscritura, despuesDeGuardar, reintentar, vista, evaluar, motivoBloqueo,
    suscribir: (fn) => { oyentes.add(fn); return () => oyentes.delete(fn); },
    cerrar: () => { s.cerrada = true; oyentes.clear(); },
    /** Para las pruebas: esperar a que terminen las escrituras y demostraciones en marcha. */
    esperar: async () => { await s.demostracion; await cadena; await s.demostracion; await cadena; },
  };
}
