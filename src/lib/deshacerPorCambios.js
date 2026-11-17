/**
 * 🧯 DESHACER SIN PISAR LO QUE SE GUARDÓ DESPUÉS (corrección F-2 y F-3 de la auditoría de E1-P, 2026-11-17).
 *
 * Lógica pura, sin pantalla ni red. La usan `App.jsx` (`snapshotAndSave` apunta en el paso lo que cambió y `undo` lo
 * deshace) y `scripts/test-deshacer-por-cambios.mjs`.
 *
 * EL PROBLEMA QUE RESUELVE
 * Un paso de Deshacer guarda la foto de los módulos ANTES del cambio, y `undo` los vuelve a escribir enteros. Eso solo
 * es correcto si todo lo que cambia ese módulo pasa por un paso de Deshacer. Dos claves NO cumplen eso:
 *   · `fitness`: borrar o restaurar desde la papelera es un paso, pero entrenar, editar una plantilla o activar una
 *     rutina se guarda directamente (`guardarFitness`). Volver a escribir la foto entera borraría el entrenamiento que
 *     se registró después del paso.
 *   · `temasGuardados`: borrar una apariencia es un paso (va a la papelera), pero guardarla, renombrarla, duplicarla o
 *     importarla se guarda directamente.
 * Por eso `undo` no las restauraba nunca (F-2), y al restaurar la papelera, la entrada de lo borrado desaparecía y el
 * elemento no volvía: se perdía.
 *
 * LA SOLUCIÓN
 * Para esas claves, el paso guarda QUÉ CAMBIÓ, elemento a elemento (`calcularCambios` de R2, el mismo formato que las
 * operaciones protegidas), y Deshacer aplica su inversa SOBRE LO QUE HAY AHORA, con condiciones:
 *   · lo que el paso quitó vuelve a su posición, si no existe ya;
 *   · lo que el paso añadió se quita, si sigue igual;
 *   · lo que el paso cambió vuelve a su valor, si sigue como lo dejó el paso.
 * Si algo de eso ya no se cumple (se cambió después), NO se deshace nada y se dice: nunca se pisa lo posterior.
 * Lo que se guardó después en OTROS elementos (un entrenamiento nuevo) no se toca.
 *
 * Y LA PAPELERA (`papeleraAlDeshacer`)
 * Restaurar la papelera de la foto saca de ella lo que se borró después del paso. Eso es correcto solo si el elemento
 * vuelve a su módulo con el mismo Deshacer. Si su módulo NO se restaura (un paso antiguo sin cambios apuntados, o un
 * módulo que este Deshacer no reescribe), su entrada SE QUEDA: el elemento sigue recuperable. La retención es un ajuste
 * (no un paso): se queda la de ahora.
 */
import { calcularCambios, aplicarCambios } from './operacionesProtegidas';

/** Las claves que también se guardan fuera de los pasos de Deshacer, y por eso se deshacen por cambios. */
export const CLAVES_DESHACER_POR_CAMBIOS = Object.freeze(['fitness', 'temasGuardados']);

/** Formato de lo apuntado en el paso. */
export const FORMATO_CAMBIOS_PASO = 1;

const esObjeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
/* Una lista en la raíz (`temasGuardados`) se compara dentro de un objeto: así vale el mismo cálculo por elementos. */
const envolver = (v) => (Array.isArray(v) ? { lista: v } : v);
const desenvolver = (antesEraLista, v) => (antesEraLista ? (Array.isArray(v && v.lista) ? v.lista : []) : v);
const lista = (v, camino) => {
  let x = v;
  for (const seg of camino) x = esObjeto(x) ? x[seg] : undefined;
  return Array.isArray(x) ? x : [];
};

/**
 * Lo que cambió un paso en una clave, para poder deshacerlo sin pisar lo de después. `null` si no se puede calcular
 * con seguridad (forma distinta, un campo que desaparece): entonces Deshacer no tocará esa clave (y la papelera
 * conservará sus entradas). Cada elemento quitado lleva su posición, para volver a su sitio.
 */
export function cambiosDeUnPaso(antes, despues) {
  const esLista = Array.isArray(antes) || Array.isArray(despues);
  if (esLista && !(Array.isArray(antes) && Array.isArray(despues))) return null;
  if (!esLista && !(esObjeto(antes) && esObjeto(despues))) return null;
  const a = envolver(antes);
  const c = calcularCambios(a, envolver(despues));
  if (!c.ok) return null;
  const cambios = c.cambios.map((cb) => {
    if (!cb.quitar) return cb;
    const l = lista(a, cb.camino);
    return { ...cb, quitar: cb.quitar.map((x) => ({ ...x, posicion: l.findIndex((e) => esObjeto(e) && e.id === x.id) })) };
  });
  return { formato: FORMATO_CAMBIOS_PASO, lista: esLista, cambios };
}

/**
 * La inversa de lo apuntado, con condiciones (la de R3 añadía al final y no deshacía `orden`: aquí lo quitado vuelve a
 * su posición). `null` si algo no se puede invertir.
 */
export function inversaDeUnPaso(registro) {
  if (!registro || registro.formato !== FORMATO_CAMBIOS_PASO || !Array.isArray(registro.cambios)) return null;
  const inversa = [];
  for (const cb of registro.cambios) {
    if (!cb || !Array.isArray(cb.camino)) return null;
    if (cb.fijar) {
      const f = [];
      for (const x of cb.fijar) {
        if (!x || !('igual' in x)) return null;
        f.push({ campo: x.campo, igual: x.valor, valor: x.igual });
      }
      inversa.push({ camino: cb.camino, fijar: f });
      continue;
    }
    const r = { camino: cb.camino };
    if (cb.anadir) r.quitar = cb.anadir.map((x) => ({ id: x.elemento.id, igual: x.elemento }));
    if (cb.reemplazar) r.reemplazar = cb.reemplazar.map((x) => ({ id: x.id, igual: x.nuevo, nuevo: x.igual }));
    /* De la posición más baja a la más alta: así cada uno cae donde estaba. */
    if (cb.quitar) {
      r.anadir = [...cb.quitar].sort((x, y) => (x.posicion ?? Infinity) - (y.posicion ?? Infinity))
        .map((x) => (Number.isInteger(x.posicion) && x.posicion >= 0 ? { elemento: x.igual, posicion: x.posicion } : { elemento: x.igual }));
    }
    if (Object.keys(r).length > 1) inversa.push(r);
  }
  return inversa;
}

/**
 * Deshace lo apuntado sobre el valor de AHORA. `{ ok: true, valor }` o `{ ok: false, motivo, fallo? }`:
 *   · `sin_cambios`: el paso no trae nada apuntado de esta clave (Deshacer no la toca);
 *   · `no_invertible`: lo apuntado no se puede invertir con seguridad;
 *   · `cambiado`: lo que el paso cambió se ha cambiado después (no se deshace nada: pisaría lo posterior).
 */
export function deshacerConCambios(actual, registro) {
  if (!registro) return { ok: false, motivo: 'sin_cambios' };
  const inversa = inversaDeUnPaso(registro);
  if (!inversa) return { ok: false, motivo: 'no_invertible' };
  if (registro.lista ? !Array.isArray(actual) : !esObjeto(actual)) return { ok: false, motivo: 'cambiado' };
  const r = aplicarCambios(envolver(actual), inversa, 'deshacer');
  if (r.fallo) return { ok: false, motivo: 'cambiado', fallo: r.fallo };
  return { ok: true, valor: desenvolver(registro.lista, r.nuevo) };
}

/**
 * La papelera que deja Deshacer: la de la foto del paso, salvo que
 *   · las entradas que hay AHORA y no en la foto se quedan si el elemento NO vuelve a su módulo con este Deshacer
 *     (`vuelve(entrada)` es falso): así nunca se pierde algo que ya no está en su módulo;
 *   · la retención es la de ahora (es un ajuste, no un paso: volver a una más corta podría caducar lo que él quería
 *     conservar).
 */
export function papeleraAlDeshacer(delPaso, actual, vuelve) {
  const base = esObjeto(delPaso) ? delPaso : {};
  const ahora = esObjeto(actual) ? actual : {};
  const enPaso = Array.isArray(base.elementos) ? base.elementos : [];
  const ids = new Set(enPaso.filter(esObjeto).map((e) => e.id));
  const quedan = (Array.isArray(ahora.elementos) ? ahora.elementos : [])
    .filter((e) => esObjeto(e) && !ids.has(e.id) && !vuelve(e));
  const r = { ...base, elementos: [...enPaso, ...quedan] };
  if ('retencionDias' in ahora) r.retencionDias = ahora.retencionDias;
  return r;
}
