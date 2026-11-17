/**
 * 🧯 DESHACER SIN PISAR LO QUE SE GUARDÓ DESPUÉS (correcciones F-2, F-3 y C-89, 2026-11-17).
 *
 * Lógica pura, sin pantalla ni red. La usan `App.jsx` (`snapshotAndSave` apunta en cada paso lo que cambió y `undo` lo
 * deshace) y `scripts/test-deshacer-por-cambios.mjs`.
 *
 * EL PROBLEMA QUE RESUELVE
 * Un paso de Deshacer guarda la foto de los módulos ANTES del cambio, y `undo` los volvía a escribir TODOS enteros,
 * también los que el paso no tocó. Eso solo es correcto si todo lo que cambia un módulo pasa por un paso de Deshacer, y
 * muchas claves también se guardan FUERA de los pasos (inventario en C-89, `docs/03`):
 *   · `fitness` (entrenar, editar una plantilla, activar una rutina), `temasGuardados` (guardar, renombrar, importar);
 *   · `productividad` (las sesiones, la configuración y el pomodoro en curso, el contador, las rutinas hechas y la que
 *     está en curso), `objetivos` (la fecha de la última revisión), `gamificacionRachas` (los logros conseguidos);
 *   · `papelera` (eliminar definitivamente, vaciar, la retención, lo caducado al abrir);
 *   · y cualquier módulo: «Borrar los datos» de Privacidad, las operaciones protegidas de Estudios, otro aparato.
 * Volver a escribir la foto entera borraba lo guardado después (un pomodoro, un logro, una revisión) o resucitaba lo
 * eliminado definitivamente.
 *
 * LA SOLUCIÓN (para TODAS las claves que cambia un paso, salvo el horario, que tiene su escritor protegido)
 * El paso apunta QUÉ CAMBIÓ en cada clave, elemento a elemento (`calcularCambios` de R2, el formato de las operaciones
 * protegidas, con la posición de lo quitado y el orden de antes), y Deshacer aplica su inversa SOBRE LO QUE HAY AHORA:
 *   · lo que el paso quitó vuelve a su posición (si ya está, igual, no hace falta; distinto, es un conflicto);
 *   · lo que el paso añadió se quita si sigue igual (si ya no está, no hace falta; cambiado, conflicto);
 *   · lo que el paso cambió vuelve si sigue como lo dejó el paso (si no, conflicto);
 *   · el orden solo se deshace en un paso que solo reordenó.
 * Lo que el paso no tocó (otras claves, otros elementos, otros campos) no se toca. Si hay un conflicto, NO se deshace
 * nada (todo se calcula antes de escribir) y se dice.
 * Si una clave no se puede expresar por elementos (un campo que desaparece, una forma rara), el paso apunta la HUELLA
 * del resultado: se vuelve a la foto solo si la clave sigue exactamente como la dejó el paso.
 */
import { calcularCambios, aplicarCambios, igualJson } from './operacionesProtegidas';
import { textoCanonico } from './guardiaHorario';

/** Formato de lo apuntado en el paso. */
export const FORMATO_CAMBIOS_PASO = 1;

/** Las claves que NO se deshacen por cambios: el horario va por su escritor protegido (E1), con su condición. */
export const CLAVES_FUERA_DE_CAMBIOS = Object.freeze(['horarioTop']);

const esObjeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
/* Una lista en la raíz (`sueno`, `futbol`, `temasGuardados`) se compara dentro de un objeto: el mismo cálculo. */
const envolver = (v) => (Array.isArray(v) ? { lista: v } : v);
const desenvolver = (eraLista, v) => (eraLista ? (Array.isArray(v && v.lista) ? v.lista : []) : v);
const obtener = (v, camino) => {
  let x = v;
  for (const seg of camino) x = esObjeto(x) ? x[seg] : undefined;
  return x;
};
const ids = (l) => (Array.isArray(l) ? l.filter(esObjeto).map((e) => e.id) : []);

/** La huella de un valor: la de `jsonb` (el orden de las claves no cuenta), resumida (cyrb53). */
export function huella(v) {
  const t = textoCanonico(v === undefined ? null : v);
  let h1 = 0xdeadbeef; let h2 = 0x41c6ce57;
  for (let i = 0; i < t.length; i += 1) {
    const c = t.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}:${t.length}`;
}

/**
 * Lo que cambió un paso en una clave, para poder deshacerlo sin pisar lo de después. Siempre devuelve un registro:
 *   · `{ formato, lista, cambios }` — por elementos (cada quitado con su `posicion`; si cambió el orden, `ordenAntes`);
 *   · `{ formato, entero: true, huella }` — si no se puede por elementos: se deshace solo si nada cambió después.
 */
export function cambiosDeUnPaso(antes, despues) {
  const esLista = Array.isArray(antes) || Array.isArray(despues);
  const comparables = esLista ? Array.isArray(antes) && Array.isArray(despues) : esObjeto(antes) && esObjeto(despues);
  const a = envolver(antes);
  const c = comparables ? calcularCambios(a, envolver(despues)) : { ok: false };
  if (!c.ok) return { formato: FORMATO_CAMBIOS_PASO, entero: true, huella: huella(despues) };
  const cambios = c.cambios.map((cb) => {
    if (cb.fijar) return cb;
    const l = obtener(a, cb.camino);
    const r = { ...cb };
    if (cb.quitar) r.quitar = cb.quitar.map((x) => ({ ...x, posicion: (Array.isArray(l) ? l : []).findIndex((e) => esObjeto(e) && e.id === x.id) }));
    if (cb.orden) r.ordenAntes = ids(l);
    return r;
  });
  return { formato: FORMATO_CAMBIOS_PASO, lista: esLista, cambios };
}

/**
 * Deshace lo apuntado sobre el valor de AHORA. `antes` es lo que la foto del paso guardó (solo hace falta para un
 * registro `entero`). `{ ok: true, valor }` o `{ ok: false, motivo, fallo? }`:
 *   · `sin_cambios`: no hay registro (un paso de una versión anterior): no se sabe qué deshacer;
 *   · `no_invertible`: lo apuntado no se puede invertir con seguridad;
 *   · `cambiado`: lo que cambió el paso se ha modificado después: deshacerlo lo pisaría.
 */
export function deshacerConCambios(actual, registro, { antes } = {}) {
  if (!registro || registro.formato !== FORMATO_CAMBIOS_PASO) return { ok: false, motivo: registro ? 'no_invertible' : 'sin_cambios' };
  if (registro.entero) {
    if (antes === undefined) return { ok: false, motivo: 'no_invertible' };
    return huella(actual) === registro.huella ? { ok: true, valor: antes } : { ok: false, motivo: 'cambiado' };
  }
  if (!Array.isArray(registro.cambios)) return { ok: false, motivo: 'no_invertible' };
  if (registro.lista ? !Array.isArray(actual) : !esObjeto(actual)) return { ok: false, motivo: 'cambiado' };
  const base = envolver(actual);
  const inversa = [];
  for (const cb of registro.cambios) {
    if (!cb || !Array.isArray(cb.camino)) return { ok: false, motivo: 'no_invertible' };
    if (cb.fijar) {
      const obj = obtener(base, cb.camino);
      const f = [];
      for (const x of cb.fijar) {
        if (!x || !('igual' in x)) return { ok: false, motivo: 'no_invertible' };
        const ahora = esObjeto(obj) && x.campo in obj ? obj[x.campo] : null;
        if (igualJson(ahora, x.igual)) continue;                                   // ya está como antes
        if (!igualJson(ahora, x.valor)) return { ok: false, motivo: 'cambiado', fallo: { campo: x.campo } };
        f.push({ campo: x.campo, igual: x.valor, valor: x.igual });
      }
      if (f.length) inversa.push({ camino: cb.camino, fijar: f });
      continue;
    }
    const col = obtener(base, cb.camino);
    const lista = Array.isArray(col) ? col : [];
    const porId = new Map(lista.filter(esObjeto).map((e) => [e.id, e]));
    const r = { camino: cb.camino };
    /* Lo que el paso añadió: se quita si sigue igual; si ya no está, no hace falta. */
    const quitar = [];
    for (const x of cb.anadir || []) {
      const e = porId.get(x.elemento.id);
      if (!e) continue;
      if (!igualJson(e, x.elemento)) return { ok: false, motivo: 'cambiado', fallo: { id: x.elemento.id } };
      quitar.push({ id: x.elemento.id, igual: e });
    }
    /* Lo que el paso cambió: vuelve si sigue como lo dejó el paso; si ya está como antes, no hace falta. */
    const reemplazar = [];
    for (const x of cb.reemplazar || []) {
      const e = porId.get(x.id);
      if (e && igualJson(e, x.igual)) continue;
      if (!e || !igualJson(e, x.nuevo)) return { ok: false, motivo: 'cambiado', fallo: { id: x.id } };
      reemplazar.push({ id: x.id, igual: e, nuevo: x.igual });
    }
    /* Lo que el paso quitó: vuelve a su sitio; si ya está igual, no hace falta; distinto, conflicto. */
    const anadir = [];
    for (const x of [...(cb.quitar || [])].sort((p, q) => (p.posicion ?? Infinity) - (q.posicion ?? Infinity))) {
      const e = porId.get(x.id);
      if (e) { if (igualJson(e, x.igual)) continue; return { ok: false, motivo: 'cambiado', fallo: { id: x.id } }; }
      anadir.push(Number.isInteger(x.posicion) && x.posicion >= 0 ? { elemento: x.igual, posicion: x.posicion } : { elemento: x.igual });
    }
    if (quitar.length) r.quitar = quitar;
    if (reemplazar.length) r.reemplazar = reemplazar;
    if (anadir.length) r.anadir = anadir;
    /* El orden solo se deshace en un paso que solo reordenó (añadir y quitar ya devuelven cada cosa a su sitio), y solo
       si lo que el paso ordenó sigue en ese orden. */
    if (cb.orden && !cb.anadir && !cb.quitar && Array.isArray(cb.ordenAntes)) {
      const presentes = new Set(ids(lista));
      const delPaso = new Set(cb.orden);
      const ahoraOrden = ids(lista).filter((id) => delPaso.has(id));
      if (ahoraOrden.join('\u0000') !== cb.orden.filter((id) => presentes.has(id)).join('\u0000')) return { ok: false, motivo: 'cambiado', fallo: { orden: cb.camino } };
      r.orden = cb.ordenAntes;
    }
    if (Object.keys(r).length > 1) inversa.push(r);
  }
  const res = aplicarCambios(base, inversa, 'deshacer');
  if (res.fallo) return { ok: false, motivo: 'cambiado', fallo: res.fallo };
  return { ok: true, valor: desenvolver(registro.lista, res.nuevo) };
}
