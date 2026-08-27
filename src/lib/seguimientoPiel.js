// ============================================================================
// EH · Fase 15/65 — SKINCARE: SEGUIMIENTO Y EVOLUCIÓN
//
// *"No será un sistema médico ni de diagnóstico. Sirve para observar hábitos y
// percepción personal."*
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. ⚠️ NO se crea otro diario** (apartado 11, con esas palabras). JosStyle ya
// tiene el Diario general, y lo que Josué escriba ahí sobre su piel **sigue
// siendo suyo y de ese módulo**. Aquí solo se guarda *"los datos específicos
// necesarios para este módulo"*: una valoración, unos aspectos y una nota corta.
// Hay una prueba que lee este código y falla si aparece un diario.
//
// **2. ⚠️ NO se crea otra papelera** (apartado 13: *"si JC Fitness ya tiene
// Eliminados recientemente, utilizar ese sistema en lugar de crear otro"*). Y no
// hizo falta tocar el motor de ME F3: es genérico sobre la lista que se le pasa,
// así que basta con **una línea en `CATALOGO_PAPELERA`**.
//
// **3. ⚠️ NO se registra cada día** (apartado 9, que el enunciado marca como
// *"esto es importante"*): nada de *"has perdido tu racha"*, ninguna exigencia
// diaria, ningún hueco pintado como fallo. **Un día sin registrar no existe** —
// no es un cero. Hay pruebas que buscan la palabra en todos los textos.
//
// **4. ⚠️ Las tendencias NUNCA afirman causalidad** (apartados 7 y 12). *"No
// afirmar que un producto ha causado un resultado."* Se enseña *"↑ Mejorando"* y
// *"desde que empezaste a usar X has registrado estas valoraciones"*, y ahí se
// para. Hay una prueba que barre todos los textos buscando verbos de causa.
//
// **5. ⚠️ Sin fotos** (apartado 10) y **sin exportación propia** (apartado 14:
// *"no crear un sistema de exportación independiente"*). `datosParaExportar()`
// **prepara**, no exporta.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { MODULO_PIEL, datosPiel } from './perfilPiel';
import { parteActivaPiel, datosRutinasPiel } from './rutinasPiel';
import { prepararEliminacion, prepararRestauracion } from './papelera';
import { uid, todayISO, addDays } from './helpers';

export const PARTE_SEGUIMIENTO = 'seguimiento';

/* ===========================================================================
   1 · LA VALORACIÓN RÁPIDA (apartado 2)
   ===========================================================================
   ⚠️ *"No quiero registrarlo"* **no es un valor de la escala**: es no registrar.
   Meterlo como una sexta cara lo convertiría en un dato, y entonces habría que
   dibujarlo en la evolución. */

export const ESCALA_PIEL = [
  { id: 'muy_bien', nombre: 'Muy bien', icono: '😄', valor: 5 },
  { id: 'bien', nombre: 'Bien', icono: '🙂', valor: 4 },
  { id: 'normal', nombre: 'Normal', icono: '😐', valor: 3 },
  { id: 'peor', nombre: 'Peor', icono: '🙁', valor: 2 },
  { id: 'muy_mal', nombre: 'Muy mal', icono: '😣', valor: 1 },
];

export const valorEscala = (id) => ESCALA_PIEL.find((x) => x.id === id) || null;

export const TEXTO_NO_REGISTRAR = 'No quiero registrarlo';

/* ===========================================================================
   2 · LOS ASPECTOS (apartado 3)
   ===========================================================================
   Escala de 1 a 5, y **todos opcionales**: se puede registrar solo la cara. */

export const ASPECTOS_PIEL = [
  { id: 'hidratacion', nombre: 'Hidratación' },
  { id: 'grasa', nombre: 'Grasa/brillos' },
  { id: 'textura', nombre: 'Textura' },
  { id: 'comodidad', nombre: 'Sensación de comodidad' },
  { id: 'general', nombre: 'Aspecto general' },
];

export const aspectoPiel = (id) => ASPECTOS_PIEL.find((a) => a.id === id) || null;

export const NIVELES_ASPECTO = [
  { valor: 1, nombre: 'Muy mal' },
  { valor: 2, nombre: 'Mal' },
  { valor: 3, nombre: 'Normal' },
  { valor: 4, nombre: 'Bien' },
  { valor: 5, nombre: 'Muy bien' },
];

/* ===========================================================================
   3 · EL ALMACÉN
   =========================================================================== */

export const DEFAULT_SEGUIMIENTO_PIEL = { registros: [] };

/* ⚠️ **Nada de fotos** (apartado 10) y **nada de un texto largo**: la nota es
   corta a propósito, porque el sitio para escribir es el Diario (apartado 11). */
export const MAX_NOTA_PIEL = 280;

function normalizarRegistro(g) {
  const r = g || {};
  if (typeof r.fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(r.fecha)) return null;
  const aspectos = {};
  ASPECTOS_PIEL.forEach((a) => {
    const v = Number(r.aspectos?.[a.id]);
    // ⚠️ Un aspecto sin valorar NO es un 3: sencillamente no está.
    if (Number.isInteger(v) && v >= 1 && v <= 5) aspectos[a.id] = v;
  });
  return {
    id: r.id || uid(),
    fecha: r.fecha,
    como: valorEscala(r.como) ? r.como : null,
    aspectos,
    nota: String(r.nota || '').trim().slice(0, MAX_NOTA_PIEL),
    // Apartado 5 — un producto de los suyos, por su id. Ningún inventario nuevo.
    productoId: r.productoId || null,
    // Apartado 6 — qué cambió de su rutina, en sus palabras.
    cambio: String(r.cambio || '').trim().slice(0, MAX_NOTA_PIEL),
  };
}

export function normalizarSeguimientoPiel(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    registros: (Array.isArray(g.registros) ? g.registros : [])
      .map(normalizarRegistro).filter(Boolean)
      .sort((a, b) => b.fecha.localeCompare(a.fecha)),
  };
}

export const datosSeguimientoPiel = (estado) => {
  const e = normalizarEstiloHombre(estado);
  return normalizarSeguimientoPiel(e.modulos.find((m) => m.id === MODULO_PIEL)?.config?.seguimiento);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_PIEL, { seguimiento: datos });

/* ===========================================================================
   4 · CREAR, EDITAR Y BORRAR (apartados 2 a 6 y 13)
   =========================================================================== */

/**
 * ⚠️ Un registro **vacío no se guarda**: si no ha dicho ni cómo la nota, ni un
 * aspecto, ni una nota, ni un cambio, no hay nada que registrar. Guardar una
 * fecha sola crearía un dato que luego habría que dibujar en la evolución.
 */
export function registrarPiel(estado, datos = {}, { hoy = todayISO() } = {}) {
  const r = normalizarRegistro({ ...datos, fecha: datos.fecha || hoy });
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa fecha no vale.', registro: null };
  if (!r.como && Object.keys(r.aspectos).length === 0 && !r.nota && !r.cambio && !r.productoId) {
    return { estado: normalizarEstiloHombre(estado), error: 'No hay nada que registrar.', registro: null };
  }
  if (r.productoId && !datosPiel(estado).productos.some((p) => p.id === r.productoId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.', registro: null };
  }
  const d = datosSeguimientoPiel(estado);
  return { estado: escribir(estado, { ...d, registros: [...d.registros, r] }), error: null, registro: r };
}

export function editarRegistroPiel(estado, id, cambios = {}) {
  const d = datosSeguimientoPiel(estado);
  const actual = d.registros.find((r) => r.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Ese registro no existe.' };
  const nuevo = normalizarRegistro({ ...actual, ...cambios, id: actual.id });
  if (!nuevo) return { estado: normalizarEstiloHombre(estado), error: 'Esa fecha no vale.' };
  return { estado: escribir(estado, { ...d, registros: d.registros.map((r) => (r.id === id ? nuevo : r)) }), error: null };
}

/**
 * ⚠️ Apartado 13 — *"si JC Fitness ya tiene Eliminados recientemente, utilizar
 * ese sistema en lugar de crear otro"*. Devuelve la entrada de papelera que
 * `App.jsx` ya sabe guardar; aquí **no hay una segunda papelera**.
 */
export function eliminarRegistroPiel(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosSeguimientoPiel(estado);
  const r = prepararEliminacion(d, MODULO_PIEL, 'registros', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Ese registro no existe.', entrada: null };
  return { estado: escribir(estado, r.moduloActualizado), error: null, entrada: r.entrada };
}

/** Y volver, con el mismo motor de ME F3. */
export function restaurarRegistroPiel(estado, entrada) {
  const d = datosSeguimientoPiel(estado);
  const r = prepararRestauracion(d, entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se ha podido restaurar.' };
  return { estado: escribir(estado, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

/* ===========================================================================
   5 · CONSULTAR (apartados 8 y 15)
   ===========================================================================
   ⚠️ Apartado 15 — apagar el seguimiento **no borra nada**: los registros dejan
   de mostrarse y vuelven al reactivarlo. */

export const PERIODOS_PIEL = [
  { id: '7', nombre: 'Últimos 7 días', dias: 7 },
  { id: '30', nombre: 'Últimos 30 días', dias: 30 },
  { id: '90', nombre: 'Últimos 3 meses', dias: 90 },
  { id: 'todo', nombre: 'Todo', dias: null },
];

export const periodoPiel = (id) => PERIODOS_PIEL.find((p) => p.id === id) || PERIODOS_PIEL[1];

export function registrosPiel(estado, { periodo = '30', hoy = todayISO() } = {}) {
  if (!parteActivaPiel(estado, PARTE_SEGUIMIENTO)) return [];
  const d = datosSeguimientoPiel(estado);
  const p = periodoPiel(periodo);
  if (p.dias === null) return d.registros;
  const desde = addDays(hoy, -p.dias + 1);
  return d.registros.filter((r) => r.fecha >= desde && r.fecha <= hoy);
}

/** Un registro con sus nombres ya resueltos, para la pantalla. */
export function verRegistroPiel(estado, registro) {
  const productos = datosPiel(estado).productos;
  return {
    ...registro,
    comoInfo: valorEscala(registro.como),
    aspectos: Object.entries(registro.aspectos).map(([id, valor]) => ({
      id, valor, nombre: aspectoPiel(id)?.nombre || id,
      etiqueta: NIVELES_ASPECTO.find((x) => x.valor === valor)?.nombre || '',
    })),
    producto: productos.find((p) => p.id === registro.productoId)?.nombre || '',
  };
}

/* ===========================================================================
   6 · LA EVOLUCIÓN (apartados 7 y 8)
   ===========================================================================
   ⚠️ **Nunca una causa.** *"No afirmar que un producto ha causado un
   resultado."* Se compara la primera mitad del periodo con la segunda y se dice
   qué se ha registrado. Nada más. */

export const MINIMO_PARA_EVOLUCION = 4;

export const TEXTO_SIN_DATOS = 'Todavía no hay suficientes registros para mostrar una evolución.';

export const TENDENCIAS = [
  { id: 'sube', icono: '↑', nombre: 'Mejorando' },
  { id: 'estable', icono: '→', nombre: 'Estable' },
  { id: 'baja', icono: '↓', nombre: 'A la baja' },
];

export const tendencia = (id) => TENDENCIAS.find((t) => t.id === id) || null;

const media = (nums) => (nums.length === 0 ? null : nums.reduce((s, x) => s + x, 0) / nums.length);

function tendenciaDe(valoresViejos, valoresNuevos) {
  const a = media(valoresViejos);
  const b = media(valoresNuevos);
  if (a === null || b === null) return null;
  // ⚠️ Medio punto de margen: sin él, una diferencia de 0,1 se anunciaría como
  // "mejorando", que con cinco registros no significa nada.
  if (b - a > 0.5) return 'sube';
  if (a - b > 0.5) return 'baja';
  return 'estable';
}

export function evolucionPiel(estado, { periodo = '30', hoy = todayISO() } = {}) {
  const regs = registrosPiel(estado, { periodo, hoy });
  if (regs.length < MINIMO_PARA_EVOLUCION) {
    return {
      hay: false,
      registros: regs.length,
      // ⚠️ La frase literal del apartado 8. Y **no es un reproche**: dice que
      // faltan datos, no que él haya fallado.
      texto: TEXTO_SIN_DATOS,
      aspectos: [],
    };
  }
  // Del más antiguo al más nuevo, y partido por la mitad.
  const orden = [...regs].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const mitad = Math.floor(orden.length / 2);
  const viejos = orden.slice(0, mitad);
  const nuevos = orden.slice(mitad);

  const aspectos = ASPECTOS_PIEL.map((a) => {
    const t = tendenciaDe(
      viejos.map((r) => r.aspectos[a.id]).filter(Number.isFinite),
      nuevos.map((r) => r.aspectos[a.id]).filter(Number.isFinite),
    );
    if (!t) return null;
    /* ⚠️ Los campos de la tendencia se copian UNO A UNO, no con un `...`: la
       tendencia también tiene `id` y `nombre` —'sube' y 'Mejorando'— y un spread
       se llevaba por delante los del aspecto. Lo encontró la prueba: la
       hidratación pasaba a llamarse "sube". */
    return { id: a.id, nombre: a.nombre, tendencia: t, icono: tendencia(t).icono, etiqueta: tendencia(t).nombre };
  }).filter(Boolean);

  const comoT = tendenciaDe(
    viejos.map((r) => valorEscala(r.como)?.valor).filter(Number.isFinite),
    nuevos.map((r) => valorEscala(r.como)?.valor).filter(Number.isFinite),
  );

  return {
    hay: true,
    registros: regs.length,
    aspectos,
    // Mismo cuidado que arriba: sin `...`.
    general: comoT ? { tendencia: comoT, icono: tendencia(comoT).icono, etiqueta: tendencia(comoT).nombre } : null,
    // ⚠️ De dónde sale, para que no parezca magia. Y sin una sola causa.
    de: `Comparando tus ${viejos.length} primeros registros con los ${nuevos.length} últimos.`,
    texto: '',
  };
}

/* ===========================================================================
   7 · LO QUE HAS REGISTRADO DESDE QUE USAS X (apartado 12)
   ===========================================================================
   ⚠️ *"Pero no establecer causalidad médica. Simplemente mostrar los datos
   registrados."* Así que esto **cuenta**, no explica. */

export function desdeQueUsas(estado, productoId, { hoy = todayISO() } = {}) {
  const producto = datosPiel(estado).productos.find((p) => p.id === productoId);
  if (!producto) return null;
  const d = datosSeguimientoPiel(estado);
  const primero = [...d.registros].sort((a, b) => a.fecha.localeCompare(b.fecha))
    .find((r) => r.productoId === productoId);
  if (!primero) return { producto: producto.nombre, hay: false, texto: 'Todavía no lo has anotado en ningún registro.' };

  const desde = d.registros.filter((r) => r.fecha >= primero.fecha && r.fecha <= hoy);
  return {
    producto: producto.nombre,
    hay: true,
    desdeFecha: primero.fecha,
    registros: desde.length,
    // ⚠️ La frase del enunciado, y ni una palabra más: ni "gracias a", ni "ha
    // mejorado tu piel", ni "funciona".
    texto: `Desde que empezaste a utilizar ${producto.nombre} has registrado ${desde.length} ${desde.length === 1 ? 'valoración' : 'valoraciones'}.`,
  };
}

/* ===========================================================================
   8 · CAMBIOS DE RUTINA (apartado 6)
   =========================================================================== */

export function cambiosDeRutina(estado, { periodo = 'todo', hoy = todayISO() } = {}) {
  return registrosPiel(estado, { periodo, hoy })
    .filter((r) => r.cambio)
    .map((r) => ({ id: r.id, fecha: r.fecha, cambio: r.cambio }));
}

/* ===========================================================================
   9 · EXPORTACIÓN (apartado 14)
   ===========================================================================
   ⚠️ *"Preparar los datos para que posteriormente puedan incluirse en la
   exportación global. **No crear un sistema de exportación independiente**."*

   Así que esto **prepara**: devuelve los datos en una forma legible. No escribe
   un fichero, no descarga nada y no tiene botón. */

export function datosParaExportar(estado) {
  const d = datosSeguimientoPiel(estado);
  const productos = datosPiel(estado).productos;
  return {
    modulo: MODULO_PIEL,
    coleccion: 'seguimiento',
    registros: d.registros.map((r) => ({
      fecha: r.fecha,
      como: valorEscala(r.como)?.nombre || null,
      aspectos: Object.fromEntries(
        Object.entries(r.aspectos).map(([id, v]) => [aspectoPiel(id)?.nombre || id, v]),
      ),
      nota: r.nota,
      producto: productos.find((p) => p.id === r.productoId)?.nombre || null,
      cambio: r.cambio,
    })),
    // ⚠️ Escrito en el propio dato: esto no exporta, lo entrega.
    exporta: false,
    nota: 'Estos datos entran en la exportación general de JosStyle.',
  };
}

/* ===========================================================================
   10 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export function resumenSeguimientoPiel(estado, { hoy = todayISO() } = {}) {
  const activo = parteActivaPiel(estado, PARTE_SEGUIMIENTO);
  const d = datosSeguimientoPiel(estado);
  const semana = registrosPiel(estado, { periodo: '7', hoy });
  return {
    activo,
    // ⚠️ Los guardados se cuentan aunque esté apagado: apagar no borra.
    guardados: d.registros.length,
    visibles: activo ? d.registros.length : 0,
    semana: semana.length,
    ultimo: d.registros[0]?.fecha || null,
    // ⚠️ Ni racha, ni días seguidos, ni porcentaje de días registrados.
    racha: null,
    texto: d.registros.length === 0
      ? 'Cuando quieras, registra cómo notas tu piel.'
      : `${d.registros.length} ${d.registros.length === 1 ? 'registro' : 'registros'}.`,
  };
}

/** ⚠️ Lo que esta fase NO crea, declarado y comprobable. */
export function auditarSeguimientoPiel(estado) {
  return {
    // Apartado 11 — el Diario general sigue siendo el único diario.
    diariosNuevos: 0,
    // Apartado 13 — la papelera es la de ME F3.
    papelerasNuevas: 0,
    // Apartado 14 — la exportación es la global.
    exportacionesNuevas: 0,
    // Apartado 10 — sin fotos.
    fotos: 0,
    // Apartado 9 — sin rachas, sin obligación diaria.
    rachas: 0,
    obligatorio: false,
    // Sin IA, como todo el bloque.
    usaIA: 0,
    // Apartado 5 — el inventario es el de la Fase 13.
    inventariosNuevos: 0,
    registros: datosSeguimientoPiel(estado).registros.length,
    rutinas: datosRutinasPiel(estado).rutinas.length,
  };
}

export function panelSeguimientoPiel(estado, { periodo = '30', hoy = todayISO() } = {}) {
  const regs = registrosPiel(estado, { periodo, hoy });
  return {
    activo: parteActivaPiel(estado, PARTE_SEGUIMIENTO),
    periodo,
    periodos: PERIODOS_PIEL,
    registros: regs.map((r) => verRegistroPiel(estado, r)),
    evolucion: evolucionPiel(estado, { periodo, hoy }),
    cambios: cambiosDeRutina(estado, { periodo, hoy }),
    productos: datosPiel(estado).productos,
    resumen: resumenSeguimientoPiel(estado, { hoy }),
  };
}
