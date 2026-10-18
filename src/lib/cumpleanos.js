/* ============================================================================
   🎂 CUMPLEAÑOS — la cuarta sección de Mente (2026-10-18)

   Josué: *"un apartado «Cumpleaños» dentro de Mente, al mismo nivel que sus otras
   tres"*. Nombre y fecha obligatorios, tipo de relación opcional; ver, editar y
   eliminar; que se repita cada año sin duplicarse; que salga en el Calendario; y
   que se active y desactive como las demás secciones, sin perder nada.

   🚨 **SE GUARDA LA FECHA ORIGINAL, NUNCA LA PRÓXIMA.** Un cumpleaños es `dia`,
   `mes` y, si lo sabe, `anio`. La próxima celebración **se calcula** cada vez
   (`proximoCumpleanos`) y el Calendario la saca del MISMO motor de recurrencias
   que ya usa Relación (`recurrencia: { frecuencia: 'anual' }` y
   `expandirRecurrentes`): no se materializa ni una ocurrencia (regla 11), así
   que recalcular no puede duplicar nada. Y el año en que se apuntó no aparece en
   ningún sitio: no hay forma de confundirlo con la próxima fecha.

   ⚠️ **EL AÑO ES OPCIONAL** porque de mucha gente se sabe el día y no el año.
   Sin año no se dice qué edad cumple, y el 29 de febrero vale. Con año, la fecha
   tiene que existir de verdad (un 29 de febrero solo en bisiesto) y no puede ser
   futura: nadie ha nacido mañana.

   ⚠️ **EL 29 DE FEBRERO SE CELEBRA EL 28 LOS AÑOS QUE NO SON BISIESTOS**, que es
   lo que ya hace `ocurrenciaDesdeAncla` en `calendario.js` (v3.1.1). Aquí se
   usa la misma regla para que la pantalla y el Calendario digan el mismo día:
   hay una prueba que los compara.

   ⚠️ **NO VA A LA IA NI A `currentState`**: son nombres y fechas de otras
   personas. Entra en la exportación aparte (como Fitness, FIT F41) y en
   Eliminados recientemente como cualquier lista que se borra (EH F45).
   =========================================================================== */

import { uid, todayISO, fechaLocalISO } from './helpers';

export const DEFAULT_CUMPLEANOS = Object.freeze({ lista: [], apartados: [] });

export const MAX_NOMBRE_CUMPLE = 60;
export const MAX_RELACION_CUMPLE = 30;
export const ANIO_MINIMO = 1900;

/* Sugerencias, no un catálogo cerrado: la relación se guarda como texto y él puede
   escribir la suya (la lección de las categorías de una idea, E3 F19). */
export const RELACIONES_SUGERIDAS = Object.freeze(['Amigo', 'Familia', 'Pareja', 'Compañero', 'Otro']);

export const MESES = Object.freeze([
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]);

/* Un año sirve de ancla en el Calendario cuando no se sabe el de nacimiento.
   Bisiesto a propósito: así un 29 de febrero sin año se ancla en un 29 que existe. */
export const ANIO_ANCLA_SIN_ANIO = 2000;

const txt = (x) => (typeof x === 'string' ? x : '');
const entero = (x) => {
  if (x === null || x === undefined || x === '') return null;
  const n = typeof x === 'number' ? x : Number(String(x).trim());
  return Number.isInteger(n) ? n : NaN;
};

export const esBisiesto = (a) => (a % 4 === 0 && a % 100 !== 0) || a % 400 === 0;

/** Días de un mes (1-12). Sin año, febrero tiene 29: la fecha puede existir. */
export function diasDelMes(mes, anio = null) {
  if (!Number.isInteger(mes) || mes < 1 || mes > 12) return 0;
  if (mes === 2) return anio === null || anio === undefined ? 29 : (esBisiesto(anio) ? 29 : 28);
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mes - 1];
}

const dos = (n) => String(n).padStart(2, '0');
const iso = (a, m, d) => `${String(a).padStart(4, '0')}-${dos(m)}-${dos(d)}`;

/** Normaliza un nombre para comparar duplicados: sin acentos, sin mayúsculas, sin espacios de más. */
const clave = (s) => txt(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/* ── Validar el formulario (crear y editar comparten la regla) ──────────────── */
/**
 * @param form   { nombre, dia, mes, anio, relacion } (dia/mes/anio como texto o número)
 * @param lista  los cumpleaños que ya hay, para no apuntar dos veces el mismo
 * @param id     el que se está editando (no choca consigo mismo)
 * @returns { ok, errores: { nombre?, fecha? }, datos }
 */
export function validarCumpleanos(form, { lista = [], id = null, hoy = todayISO() } = {}) {
  const f = form || {};
  const errores = {};
  const nombre = txt(f.nombre).trim().replace(/\s+/g, ' ');
  if (!nombre) errores.nombre = 'Escribe el nombre.';
  else if (nombre.length > MAX_NOMBRE_CUMPLE) errores.nombre = `Como mucho ${MAX_NOMBRE_CUMPLE} caracteres.`;

  const dia = entero(f.dia);
  const mes = entero(f.mes);
  const anio = entero(f.anio);
  const [hA, hM, hD] = String(hoy).split('-').map(Number);
  if (dia === null || mes === null) {
    errores.fecha = 'Elige el día y el mes.';
  } else if (!Number.isInteger(mes) || mes < 1 || mes > 12) {
    errores.fecha = 'Ese mes no existe.';
  } else if (Number.isNaN(anio)) {
    errores.fecha = 'El año tiene que ser un número, o déjalo vacío.';
  } else if (anio !== null && (anio < ANIO_MINIMO || anio > hA)) {
    errores.fecha = `El año tiene que estar entre ${ANIO_MINIMO} y ${hA}, o déjalo vacío.`;
  } else if (!Number.isInteger(dia) || dia < 1 || dia > diasDelMes(mes, anio)) {
    errores.fecha = mes === 2 && dia === 29 && anio !== null
      ? `${anio} no fue bisiesto: no tuvo 29 de febrero.`
      : `Ese día no existe en ${MESES[mes - 1]}.`;
  } else if (anio !== null && iso(anio, mes, dia) > iso(hA, hM, hD)) {
    errores.fecha = 'Esa fecha todavía no ha llegado: un cumpleaños no puede ser de alguien que no ha nacido.';
  }

  const relacion = txt(f.relacion).trim().replace(/\s+/g, ' ').slice(0, MAX_RELACION_CUMPLE) || null;

  if (!errores.nombre && !errores.fecha) {
    const repetido = (lista || []).find((c) => c && c.id !== id && clave(c.nombre) === clave(nombre) && c.dia === dia && c.mes === mes);
    if (repetido) errores.nombre = `Ya tienes apuntado el cumpleaños de ${repetido.nombre} ese día.`;
  }

  const ok = !errores.nombre && !errores.fecha;
  return { ok, errores, datos: ok ? { nombre, dia, mes, anio, relacion } : null };
}

/** El cumpleaños nuevo, o `null` si el formulario no vale. */
export function crearCumpleanos(form, opciones = {}) {
  const v = validarCumpleanos(form, opciones);
  if (!v.ok) return null;
  const ahora = fechaLocalISO(new Date());
  return { id: uid(), ...v.datos, creado: ahora, actualizado: ahora };
}

/**
 * El mismo cumpleaños con los cambios: mismo `id`, mismo `creado`.
 *  · `null` si el formulario no vale (no se guarda nada);
 *  · **el mismo objeto** si no cambia nada (no escribe ni deja un Deshacer vacío).
 */
export function editarCumpleanos(c, form, opciones = {}) {
  if (!c || !c.id) return null;
  const v = validarCumpleanos(form, { ...opciones, id: c.id });
  if (!v.ok) return null;
  const d = v.datos;
  if (d.nombre === c.nombre && d.dia === c.dia && d.mes === c.mes && d.anio === (c.anio ?? null) && d.relacion === (c.relacion ?? null)) return c;
  return { ...c, ...d, actualizado: fechaLocalISO(new Date()) };
}

/** Lo que el formulario enseña al empezar a editar. */
export function formularioDeCumpleanos(c) {
  const x = c || {};
  return {
    nombre: txt(x.nombre),
    dia: Number.isInteger(x.dia) ? String(x.dia) : '',
    mes: Number.isInteger(x.mes) ? String(x.mes) : '',
    anio: Number.isInteger(x.anio) ? String(x.anio) : '',
    relacion: txt(x.relacion),
  };
}

/* ── La próxima celebración ─────────────────────────────────────────────────── */
/** El día que se celebra en un año: el 29 de febrero, el 28 si ese año no es bisiesto
 *  (la misma regla que `ocurrenciaDesdeAncla` de `calendario.js`). */
export function fechaEnAnio(c, anio) {
  if (!c || !Number.isInteger(c.mes) || !Number.isInteger(c.dia) || !Number.isInteger(anio)) return null;
  return iso(anio, c.mes, Math.min(c.dia, diasDelMes(c.mes, anio)));
}

const diasEntre = (a, b) => Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000);

/**
 * Cuándo es el siguiente, contando hoy: si hoy es su cumpleaños, es hoy.
 * @returns { fecha, dias, esHoy, edad } — `edad` (la que cumple) solo si se sabe el año.
 */
export function proximoCumpleanos(c, hoy = todayISO()) {
  if (!c || !Number.isInteger(c.mes) || !Number.isInteger(c.dia)) return null;
  const anioHoy = Number(String(hoy).slice(0, 4));
  if (!Number.isInteger(anioHoy)) return null;
  let anio = anioHoy;
  let fecha = fechaEnAnio(c, anio);
  if (fecha < hoy) { anio += 1; fecha = fechaEnAnio(c, anio); }
  const edad = Number.isInteger(c.anio) && anio - c.anio >= 1 ? anio - c.anio : null;
  const dias = diasEntre(hoy, fecha);
  return { fecha, dias, esHoy: dias === 0, edad };
}

/** La lista ordenada por cuándo llega cada uno (el de hoy primero). */
export function ordenarPorProximo(lista, hoy = todayISO()) {
  return (lista || [])
    .map((c) => ({ c, p: proximoCumpleanos(c, hoy) }))
    .filter((x) => x.p)
    .sort((a, b) => a.p.dias - b.p.dias || clave(a.c.nombre).localeCompare(clave(b.c.nombre)))
    .map((x) => ({ ...x.c, proximo: x.p }));
}

/** «Hoy», «Mañana», «En 5 días» o la fecha; con lo que cumple si se sabe. */
export function textoDelProximo(p) {
  if (!p) return '';
  const cuando = p.dias === 0 ? 'Hoy' : p.dias === 1 ? 'Mañana' : p.dias <= 30 ? `En ${p.dias} días` : null;
  const [, m, d] = p.fecha.split('-').map(Number);
  const fecha = `${d} de ${MESES[m - 1]}`;
  const base = cuando ? `${cuando} · ${fecha}` : fecha;
  return p.edad ? `${base} · cumple ${p.edad}` : base;
}

/** «12 de mayo de 2008» o «12 de mayo» sin año. */
export function textoDeLaFecha(c) {
  if (!c || !Number.isInteger(c.mes) || !Number.isInteger(c.dia)) return '';
  return `${c.dia} de ${MESES[c.mes - 1]}${Number.isInteger(c.anio) ? ` de ${c.anio}` : ''}`;
}

/* ── El Calendario ──────────────────────────────────────────────────────────── */
/**
 * Un evento por cumpleaños, derivado y de solo lectura (regla 11), con la misma
 * forma que las fechas de Relación: anclado en la fecha original y repetido cada
 * año por `expandirRecurrentes`. Desactivado, no sale ninguno (sus datos siguen).
 */
export function eventosDeCumpleanos(cumpleanos, { activo = true } = {}) {
  if (!activo || !cumpleanos || !Array.isArray(cumpleanos.lista)) return [];
  return cumpleanos.lista
    .filter((c) => c && c.id && Number.isInteger(c.mes) && Number.isInteger(c.dia))
    .map((c) => ({
      id: `cumpleanos:${c.id}`,
      titulo: `🎂 Cumpleaños de ${c.nombre}`,
      fecha: iso(Number.isInteger(c.anio) ? c.anio : ANIO_ANCLA_SIN_ANIO, c.mes, c.dia),
      todoElDia: true,
      horaInicio: null,
      horaFin: null,
      tipo: 'fecha_importante',
      notas: c.relacion || '',
      ubicacion: '',
      origen: 'cumpleanos',
      origenId: c.id,
      soloLectura: true,
      recurrencia: { frecuencia: 'anual', hasta: null },
    }));
}

/** Se ve si Cumpleaños está activo y Mente también: sin Mente no se puede llegar a él. */
export const cumpleanosActivo = (ocultos = []) => !(ocultos || []).includes('cumpleanos') && !(ocultos || []).includes('mente');

/* ── La puerta de carga (regla 5) ───────────────────────────────────────────── */
/* Un cumpleaños que no se entiende no se tira: se aparta (FIT F41), para que el
   siguiente guardado no lo borre de la cuenta. Y uno sin id recibe uno que no
   cambia en cada carga (FIT F41: un valor por defecto que cambia no lo es). */
export function normalizarCumpleanosItem(c) {
  if (!c || typeof c !== 'object') return null;
  const nombre = txt(c.nombre).trim().slice(0, MAX_NOMBRE_CUMPLE);
  const dia = entero(c.dia);
  const mes = entero(c.mes);
  let anio = entero(c.anio);
  if (Number.isNaN(anio) || (anio !== null && (anio < ANIO_MINIMO || anio > 9999))) anio = null;
  if (!nombre || !Number.isInteger(mes) || mes < 1 || mes > 12 || !Number.isInteger(dia) || dia < 1 || dia > diasDelMes(mes, anio)) return null;
  const id = typeof c.id === 'string' && c.id ? c.id : `cumple-${mes}-${dia}-${clave(nombre).replace(/[^a-z0-9]+/g, '-')}`;
  return {
    ...c,
    id, nombre, dia, mes, anio,
    relacion: txt(c.relacion).trim().slice(0, MAX_RELACION_CUMPLE) || null,
    creado: typeof c.creado === 'string' ? c.creado : null,
    actualizado: typeof c.actualizado === 'string' ? c.actualizado : null,
  };
}

export function normalizarCumpleanos(guardado) {
  const g = guardado && typeof guardado === 'object' && !Array.isArray(guardado) ? guardado : {};
  const lista = [];
  const apartados = Array.isArray(g.apartados) ? [...g.apartados] : [];
  const vistos = new Set();
  for (const c of Array.isArray(g.lista) ? g.lista : []) {
    const n = normalizarCumpleanosItem(c);
    if (!n) { if (c !== null && c !== undefined) apartados.push(c); continue; }
    if (vistos.has(n.id)) continue; // dos copias del mismo: cuenta una
    vistos.add(n.id);
    lista.push(n);
  }
  return { ...g, lista, apartados };
}

/* ── La exportación global (fuera de `currentState`) ────────────────────────── */
export function filasDeCumpleanosParaExportar(cumpleanos) {
  return ((cumpleanos && cumpleanos.lista) || []).map((c) => ({
    modulo: 'Cumpleaños',
    fecha: Number.isInteger(c.anio) ? iso(c.anio, c.mes, c.dia) : `--${dos(c.mes)}-${dos(c.dia)}`,
    detalle: c.nombre,
    valor: textoDeLaFecha(c),
    extra: c.relacion || '',
  }));
}
