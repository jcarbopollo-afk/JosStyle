/**
 * 🛡 HORARIOS · E1-R, R3 — LA INTEGRACIÓN DE LA OPERACIÓN PROTEGIDA EN HORARIOS Y ESTUDIOS (docs/19 §18.17).
 *
 * Lógica pura, sin pantalla ni red. La usan `App.jsx` (que manda las operaciones por el escritor de R2,
 * `escritorOperaciones.js`) y las pruebas:
 *   · **borrar una asignatura** (`prepararBorradoAsignatura`): ella, lo que cuelga de ella (exámenes, horas, temas,
 *     entregas y eventos), su entrada de la papelera y, si está en el horario, sus clases. Con clases va en UNA
 *     operación protegida (todo o nada); sin clases, como siempre (H-13: «sin clases, el borrado sigue igual»);
 *   · **Deshacer como operación inversa** (`invertirCambios`, `prepararDeshacerOperacion`): lo que la operación quitó
 *     vuelve si no existe, lo que añadió se quita si sigue igual, y el horario vuelve con su condición. Calculada de
 *     los cambios que se APLICARON, no de una foto de la pantalla;
 *   · **H-12, el bloqueo selectivo de Estudios** (`bloqueosDeEstudios`, `cambioTocaBloqueadas`): mientras una
 *     operación sobre una asignatura X está pendiente o retenida por un conflicto, solo se bloquean los cambios que
 *     tocan X o lo que cuelga de ella. Se decide COMPARANDO lo que llega con lo que hay, no mirando qué pantalla lo
 *     pide, y no se guarda en ningún sitio: sale de las operaciones vivas del escritor (sin operación, sin bloqueo);
 *   · **H-13** (`asignaturaEnHorario`): con Horarios en solo lectura, una asignatura que está en el horario no se
 *     borra —se haría a medias— y se dice por qué, con el acceso a Horario.
 *
 * ⚠️ Las puertas de carga de `estudios` y `papelera` viven aquí (`normalizarEstudiosCargados`,
 * `normalizarPapeleraCargada`): son las que usa `App.jsx` al cargar Y las que la operación usa para comparar lo
 * guardado con lo que se ve (`prepararCambios`). Si fueran dos, las condiciones saldrían falsas.
 */
import { prepararEliminacion, conArrastrados, DEFAULT_PAPELERA } from './papelera';
import { normalizarHorarioTop } from './horario';
import { limpiarHorarioDeAsignatura } from './usosAsignatura';
import { normalizarAppsDe } from './estudiosApps';
import { normalizarAsignaturasDe } from './asignaturas';
import { normalizarFechasDe } from './fechasAcademicas';
import { aplicarCambios, igualJson } from './operacionesProtegidas';

/** Las listas de Estudios que cuelgan de una asignatura (por `asignaturaId`): se van con ella y vuelven con ella. */
export const COLECCIONES_DE_ASIGNATURA = Object.freeze(['examenes', 'horas', 'temas', 'entregas', 'eventos']);

/** La puerta de carga de `estudios` (la misma de `App.jsx` desde la E3 F41). */
export const normalizarEstudiosCargados = (v) => normalizarFechasDe(normalizarAsignaturasDe(normalizarAppsDe(v)));
/** La puerta de carga de `papelera` (sin la purga de lo caducado, que solo se hace al abrir). */
export const normalizarPapeleraCargada = (v) => ({ ...DEFAULT_PAPELERA, ...(v && typeof v === 'object' && !Array.isArray(v) ? v : {}) });

const lista = (v, c) => (v && Array.isArray(v[c]) ? v[c] : []);
const esObjeto = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * ¿Está la asignatura en el horario? `enHorario` si borrarla cambia el horario (tiene una actividad, y con ella sus
 * clases y sus excepciones); `bloques`, cuántas clases tiene. Sin horario, nada.
 */
export function asignaturaEnHorario(horarioTop, asignaturaId) {
  if (!asignaturaId) return { enHorario: false, bloques: 0 };
  const e = normalizarHorarioTop(horarioTop);
  const limpio = limpiarHorarioDeAsignatura(horarioTop, asignaturaId, { confirmado: true });
  const bloques = e.bloques.length - limpio.bloques.length;
  const enHorario = bloques > 0 || e.actividades.length !== limpio.actividades.length || e.excepciones.length !== limpio.excepciones.length;
  return { enHorario, bloques };
}

/**
 * Prepara el borrado de una asignatura: `estudios` sin ella ni lo suyo, `papelera` con UNA entrada que lo lleva todo
 * (restaurarla lo devuelve entero), y el horario limpio si estaba en él. No escribe nada. `null` si no existe.
 */
export function prepararBorradoAsignatura({ estudios, papelera, horarioTop, id, ahoraISO = new Date().toISOString() }) {
  const resultado = prepararEliminacion(estudios, 'estudios', 'asignaturas', id, ahoraISO);
  if (!resultado) return null;
  const asignatura = lista(estudios, 'asignaturas').find((a) => a && a.id === id) || null;
  const arrastrados = COLECCIONES_DE_ASIGNATURA.map((c) => ({ coleccion: c, elementos: lista(estudios, c).filter((x) => x && x.asignaturaId === id) }));
  const entrada = conArrastrados(resultado.entrada, arrastrados);
  const estudiosDespues = { ...resultado.moduloActualizado };
  for (const c of COLECCIONES_DE_ASIGNATURA) if (Array.isArray(estudios && estudios[c])) estudiosDespues[c] = estudios[c].filter((x) => !(x && x.asignaturaId === id));
  const pap = normalizarPapeleraCargada(papelera);
  const { enHorario, bloques } = asignaturaEnHorario(horarioTop, id);
  return {
    estudios: estudiosDespues,
    papelera: { ...pap, elementos: [...pap.elementos, entrada] },
    horario: enHorario ? limpiarHorarioDeAsignatura(horarioTop, id, { confirmado: true }) : null,
    entrada, enHorario, bloques,
    asunto: { asignaturaId: id, nombre: asignatura ? asignatura.nombre || null : null, accion: 'borrar' },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   DESHACER COMO OPERACIÓN INVERSA
   =========================================================================== */

/**
 * La inversa de unos cambios ya aplicados: lo que se quitó se vuelve a añadir (con su valor guardado, el de su
 * condición), lo que se añadió se quita si sigue igual, lo reemplazado vuelve a su valor anterior si sigue con el
 * nuevo y lo fijado vuelve a su valor si sigue con el que se puso. El orden de una lista no se deshace: no lleva
 * condición y pisaría el de otro aparato. `null` si algo no se puede invertir con seguridad (un fijar sin condición).
 */
export function invertirCambios(cambios) {
  const inversa = [];
  for (const cb of cambios || []) {
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
    if (cb.quitar) r.anadir = cb.quitar.map((x) => ({ elemento: x.igual }));
    if (Object.keys(r).length > 1) inversa.push(r);
  }
  return inversa;
}

/** Por ids, en la pantalla: lo que se va a quitar o reemplazar está, y lo que se va a añadir no. La igualdad la
 *  decide el servidor con lo guardado; esto solo evita mandar algo que ya se sabe que no puede aplicarse. */
function cabeEnPantalla(valor, cambios) {
  for (const cb of cambios) {
    if (cb.fijar) continue;
    const l = cb.camino.length === 1 ? lista(valor, cb.camino[0]) : null;
    if (!l) return false;
    const ids = new Set(l.filter(esObjeto).map((e) => e.id));
    if ((cb.quitar || []).some((x) => !ids.has(x.id))) return false;
    if ((cb.reemplazar || []).some((x) => !ids.has(x.id))) return false;
    if ((cb.anadir || []).some((x) => ids.has(x.elemento.id))) return false;
  }
  return true;
}

/**
 * Prepara Deshacer de un paso que fue una operación protegida (`paso.operacion`: `{ tipo, asunto, horarioAntes,
 * claves: [{ clave, cambios }] }`, los cambios que se APLICARON). Devuelve `{ ok: true, horario, claves: [{ clave,
 * antes, despues }] }` para `guardarOperacion`, o `{ ok: false, motivo }`:
 *   · `sin_datos`: el paso no trae lo necesario;
 *   · `no_invertible`: un cambio que no se puede deshacer con seguridad;
 *   · `cambiado`: en pantalla ya no está como lo dejó la operación (otra cosa lo cambió): no se manda nada.
 * `pantalla`: `{ estudios, papelera }` tal como se ven ahora.
 */
export function prepararDeshacerOperacion(paso, pantalla) {
  const op = paso && paso.operacion;
  if (!op || !Array.isArray(op.claves) || !esObjeto(op.horarioAntes)) return { ok: false, motivo: 'sin_datos' };
  const claves = [];
  for (const c of op.claves) {
    const inversa = invertirCambios(c.cambios);
    if (!inversa) return { ok: false, motivo: 'no_invertible' };
    const antes = pantalla && pantalla[c.clave];
    if (!esObjeto(antes)) return { ok: false, motivo: 'sin_datos' };
    if (!cabeEnPantalla(antes, inversa)) return { ok: false, motivo: 'cambiado' };
    const r = aplicarCambios(antes, inversa, c.clave, { sinCondiciones: true });
    if (r.fallo) return { ok: false, motivo: 'cambiado' };
    /* 🐛 Sin normalizar: lo que vuelve es EXACTAMENTE lo que estaba guardado (el valor de su condición al quitarlo). Con la
       puerta de carga por medio volvía con los campos que ella añade, y no era lo de antes (lo destapó el nivel 3, con
       datos guardados por una versión anterior). La pantalla lo normaliza al recibirlo (`alAplicar` de App.jsx). */
    claves.push({ clave: c.clave, antes, despues: r.nuevo });
  }
  return { ok: true, horario: op.horarioAntes, claves };
}

/** ¿El paso de Deshacer fue una operación que esta pantalla todavía no ha visto aplicarse del todo? (Sus cambios no
 *  se pueden deshacer mientras su operación siga viva: H-12 lo sustituye por «Descartar mi cambio».) */
export const pasoDeOperacion = (paso) => !!(paso && paso.operacion && Array.isArray(paso.operacion.claves));

/* ═══════════════════════════════════════════════════════════════════════════
   H-12 · EL BLOQUEO SELECTIVO DE ESTUDIOS
   =========================================================================== */

export const TEXTOS_BLOQUEO_ESTUDIOS = Object.freeze({
  borrar: { pendiente: 'Se está borrando: pendiente de guardar', conflicto: 'Borrado retenido por un conflicto en tu horario' },
  restaurar: { pendiente: 'Se está restaurando: pendiente de guardar', conflicto: 'Restauración retenida por un conflicto en tu horario' },
  crear: { pendiente: 'Se está guardando con su clase: pendiente de guardar', conflicto: 'Retenida por un conflicto en tu horario' },
});

/**
 * Las asignaturas bloqueadas ahora, de lo que enseña el escritor (`vista().asuntos`): `Map(asignaturaId → { motivo:
 * 'pendiente' | 'conflicto', accion, nombre, marca })`. Un conflicto pesa más que un pendiente sobre la misma.
 */
export function bloqueosDeEstudios(asuntos) {
  const m = new Map();
  for (const a of asuntos || []) {
    if (!a || !a.asignaturaId) continue;
    const motivo = a.estado === 'conflicto' ? 'conflicto' : 'pendiente';
    const previo = m.get(a.asignaturaId);
    if (previo && previo.motivo === 'conflicto') continue;
    const textos = TEXTOS_BLOQUEO_ESTUDIOS[a.accion] || TEXTOS_BLOQUEO_ESTUDIOS.borrar;
    m.set(a.asignaturaId, { motivo, accion: a.accion || 'borrar', nombre: a.nombre || null, marca: textos[motivo] });
  }
  return m;
}

/* Lo de una lista que es de X: la propia X (en `asignaturas`) o lo que cuelga de ella (`asignaturaId`). */
const deX = (v, c, x) => lista(v, c).filter((e) => esObjeto(e) && (c === 'asignaturas' ? e.id === x : e.asignaturaId === x));

/**
 * ¿Toca este cambio de `estudios` (de `antes` a `despues`) alguna asignatura bloqueada? Devuelve el id de la primera
 * que toca, o `null`. Toca X si cambia X (editarla, ocultarla, sacarla de un programa, borrarla, añadirla) o algo que
 * cuelga de ella (añadir, editar, marcar o borrar uno de sus exámenes, horas, temas, entregas o eventos; restaurarlo
 * desde la papelera). Lo demás de Estudios sigue libre.
 */
export function cambioTocaBloqueadas(antes, despues, bloqueadas) {
  if (!bloqueadas || !bloqueadas.size || !esObjeto(despues)) return null;
  for (const x of bloqueadas.keys()) {
    for (const c of ['asignaturas', ...COLECCIONES_DE_ASIGNATURA]) {
      if (!igualJson(deX(antes, c, x), deX(despues, c, x))) return x;
    }
  }
  return null;
}
