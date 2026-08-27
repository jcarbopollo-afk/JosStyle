// ============================================================================
// EH · Fase 5/65 — ESTILO + ARMARIO: INTEGRACIÓN CON EL SISTEMA EXISTENTE
//
// El enunciado empieza con tres avisos seguidos, y los tres dicen lo mismo:
//
//   ⚠️ NO reconstruir el armario.
//   ⚠️ NO duplicar sus datos.
//   ⚠️ NO crear un segundo sistema de ropa.
//
// Así que **este archivo no guarda ni una prenda**. Ni un outfit, ni un uso, ni
// una marca, ni una ocasión. Todo eso vive en `armario.js` y
// `armarioInteligencia.js` desde la Entrega 2 · AR F1-F4, y aquí solo se lee.
//
// ── LO ÚNICO QUE ESTA FASE AÑADE DE VERDAD ─────────────────────────────────
//
// **1. La plaquita lleva al armario que ya existe** (apartado 1). No a una
// pantalla equivalente: al mismo módulo, con los mismos datos.
//
// **2. Un perfil de tallas, y uno solo** (apartado 3 y Test 8). El armario ya
// sabe qué talla gasta Josué —lo dice cada prenda— así que **se deriva de ahí**,
// y lo guardado en la capa de datos de la Fase 4 solo rellena los huecos. Si los
// dos existen y no coinciden, **se avisa del choque en vez de elegir en
// silencio**.
//
// **3. Recomendaciones sin IA** (apartados 6, 7 y 11), y encima **sin escribir**:
// aquí no hay una sola función que modifique el armario. El apartado 7 lo pide
// —*"una recomendación nunca debe convertirse automáticamente en una
// modificación del armario"*— y la forma de garantizarlo no es acordarse: es que
// la capacidad no exista.
//
// ⚠️ El motor de recomendación **tampoco se reescribe**: `recomendarOutfits()` es
// de AR F4 y ya sabe de repetición, disponibilidad y olvido. Lo que se añade es
// la capa de preferencias de estilo por encima.
// ============================================================================

import {
  CATEGORIAS_ARMARIO, COLORES_ARMARIO, OCASIONES_OUTFIT, ESTADOS_PRENDA,
  ZONAS_OUTFIT, marcasDe, conteoPorCategoria, resumenArmario, colorDe, categoriaDe,
} from './armario';
import { recomendarOutfits } from './armarioInteligencia';
import { estaActivo, normalizarEstiloHombre } from './estiloDeHombre';
import { leerDato, guardarDato, TEXTO_SIN_DATO, ACCION_ANADIR } from './datosEstiloHombre';
import { todayISO } from './helpers';

/* ===========================================================================
   1 · A DÓNDE LLEVA LA PLAQUITA (apartado 1)
   ===========================================================================
   *"Debe abrir el sistema de armario que ya existe. No crear una nueva pantalla
   equivalente."*

   El id es el del módulo de JosStyle, el mismo que usa la barra de navegación.
   Aquí no hay una vista nueva que pintar. */

export const MODULO_EH_ESTILO = 'estilo';
export const DESTINO_ARMARIO = 'armario';

/**
 * Apartado 10 — si el apartado está apagado, la plaquita no aparece **pero el
 * armario de JosStyle sigue intacto y accesible por su sitio de siempre**. Eso
 * es lo que el enunciado llama *"el sistema global de armario sigue intacto si
 * existe fuera de este apartado"*.
 */
export function accesoAlArmario(estado) {
  const visible = estaActivo(estado, MODULO_EH_ESTILO);
  return {
    visible,
    destino: DESTINO_ARMARIO,
    // ⚠️ Nunca `null` cuando está apagado: sigue existiendo, solo que fuera.
    fuera: !visible,
    nota: visible ? '' : 'El armario sigue en su sitio de siempre, con todo lo que tienes guardado.',
  };
}

/* ===========================================================================
   2 · LO QUE HAY (apartado 2 · Tests 1, 7 y 9)
   ===========================================================================
   *"Comprobar que se conservan: prendas, categorías, tallas, marcas, colores,
   paletas, preferencias, ocasiones, niveles, combinaciones…"*

   ⚠️ **Esto no copia nada.** Es un recuento derivado, calculado en cada llamada,
   igual que los eventos del Calendario (regla 11). Si mañana Josué borra una
   prenda, esto lo dice sin que nadie tenga que sincronizar nada. */

export function inventarioDeEstilo(armario) {
  const a = armario || {};
  const prendas = Array.isArray(a.prendas) ? a.prendas : [];
  const outfits = Array.isArray(a.outfits) ? a.outfits : [];
  const usos = Array.isArray(a.usos) ? a.usos : [];
  const conteo = conteoPorCategoria(prendas);

  return {
    // ⚠️ Se le pasa el armario YA saneado, no el crudo: `resumenArmario` (AR F1)
    // hace `(armario && armario.prendas) || []`, que con un guardado corrupto
    // devuelve la basura tal cual y revienta en el `.filter`. Sanearlo aquí es
    // más honesto que tocar el contrato de una fase cerrada.
    ...resumenArmario({ prendas, outfits, usos }),
    outfits: outfits.length,
    usos: usos.length,
    marcas: marcasDe(prendas).length,
    colores: new Set(prendas.map((p) => p.color).filter(Boolean)).size,
    tallas: new Set(prendas.map((p) => (p.talla || '').trim()).filter(Boolean)).size,
    // ⚠️ Un outfit guarda UNA ocasión (`ocasion`), no una lista. Suponer un
    // array daba cero ocasiones siempre, y en silencio: lo encontró la prueba.
    ocasiones: new Set(outfits.map((o) => o.ocasion).filter(Boolean)).size,
    categoriasConPrendas: Object.keys(conteo).length,
    vacio: prendas.length === 0 && outfits.length === 0,
  };
}

/* ===========================================================================
   3 · ⚠️ UN SOLO PERFIL DE TALLAS (apartado 3 · Test 8)
   ===========================================================================
   *"La aplicación debe reutilizar las tallas que ya conoce. Pero si el usuario
   necesita registrar una talla que todavía no existe: Añadir talla."*
   Y el Test 8: *"No existen dos perfiles de tallas."*

   El armario ya sabe qué gasta Josué: cada prenda lleva la suya. Así que la
   talla **se deriva de ahí**, y lo guardado en la capa de datos de la Fase 4
   solo rellena los huecos.

   ⚠️ **Y si los dos existen y no coinciden, se dice.** Elegir uno en silencio
   sería crear el segundo perfil por la puerta de atrás: Josué vería "M" en un
   sitio y "L" en otro sin saber por qué. */

/* Las tres tallas del ejemplo del enunciado —camiseta, pantalón, zapatillas—
   con las categorías del armario de las que se derivan. Es una vista sobre
   `CATEGORIAS_ARMARIO`, no una segunda clasificación. */
export const TALLAS_ESTILO = [
  { id: 'tallaCamiseta', nombre: 'Camiseta', categorias: ['camisetas', 'camisas', 'polos', 'sudaderas', 'jerseis'] },
  { id: 'tallaPantalon', nombre: 'Pantalón', categorias: ['pantalones', 'shorts', 'chandal'] },
  { id: 'tallaCalzado', nombre: 'Calzado', categorias: ['zapatillas', 'zapatos'] },
];

export const tallaEstilo = (id) => TALLAS_ESTILO.find((t) => t.id === id) || null;

/** La talla que más se repite entre las prendas de esas categorías. */
function tallaDominante(prendas, categorias) {
  const cuenta = new Map();
  (prendas || [])
    .filter((p) => categorias.includes(p.categoria))
    .map((p) => (p.talla || '').trim())
    .filter(Boolean)
    .forEach((t) => cuenta.set(t, (cuenta.get(t) || 0) + 1));
  if (cuenta.size === 0) return { valor: null, prendas: 0, empate: false };
  const orden = [...cuenta.entries()].sort((a, b) => b[1] - a[1]);
  const total = orden.reduce((s, [, n]) => s + n, 0);
  return {
    valor: orden[0][0],
    prendas: orden[0][1],
    de: total,
    // ⚠️ Un empate no es una respuesta: dos tallas con la misma frecuencia
    // significan que el armario no sabe cuál es la suya.
    empate: orden.length > 1 && orden[1][1] === orden[0][1],
  };
}

export const ORIGENES_TALLA = ['armario', 'propia', 'ninguno'];

/**
 * ⚠️ **La única función que responde "qué talla gasta".** Un módulo futuro que
 * lea `prenda.talla` por su cuenta para deducirlo estaría creando el segundo
 * perfil que prohíbe el Test 8.
 */
export function tallaDe(estado, tallaId, armario, datosGlobales = {}) {
  const cat = tallaEstilo(tallaId);
  if (!cat) return { id: tallaId, valor: null, origen: 'ninguno', texto: TEXTO_SIN_DATO, conflicto: null };

  const delArmario = tallaDominante((armario || {}).prendas, cat.categorias);
  const guardada = leerDato(estado, tallaId, datosGlobales);

  // El armario manda cuando puede responder sin empate.
  if (delArmario.valor && !delArmario.empate) {
    return {
      id: tallaId,
      nombre: cat.nombre,
      valor: delArmario.valor,
      origen: 'armario',
      texto: delArmario.valor,
      de: `${delArmario.prendas} de ${delArmario.de} prendas`,
      // ⚠️ El choque se enseña, no se resuelve solo.
      conflicto: guardada.tiene && String(guardada.valor).trim() !== delArmario.valor
        ? { guardada: guardada.valor, armario: delArmario.valor }
        : null,
    };
  }

  if (guardada.tiene) {
    return {
      id: tallaId, nombre: cat.nombre, valor: guardada.valor, origen: 'propia',
      texto: String(guardada.valor), de: 'La que has indicado', conflicto: null,
    };
  }

  return {
    id: tallaId, nombre: cat.nombre, valor: null, origen: 'ninguno',
    // Apartado 8 — la frase del enunciado, casi literal.
    texto: `No tenemos registrada tu talla de ${cat.nombre.toLowerCase()}.`,
    de: '', conflicto: null, accion: 'Añadir talla',
  };
}

export function perfilDeTallas(estado, armario, datosGlobales = {}) {
  return TALLAS_ESTILO.map((t) => tallaDe(estado, t.id, armario, datosGlobales));
}

/**
 * *"Añadir talla"* (apartado 3). Escribe en la capa de la Fase 4, que es el
 * único sitio donde se guarda una talla propia — y por tanto sigue habiendo un
 * solo perfil.
 */
export function guardarTalla(estado, tallaId, valor, { hoy = todayISO() } = {}) {
  if (!tallaEstilo(tallaId)) return { estado: normalizarEstiloHombre(estado), error: 'Esa talla no existe.' };
  return guardarDato(estado, tallaId, String(valor).trim(), { modulo: MODULO_EH_ESTILO, hoy });
}

/* ===========================================================================
   4 · EL PERFIL FÍSICO (apartados 4 y 14)
   ===========================================================================
   *"No crear un segundo perfil físico. Utilizar siempre la capa de datos
   compartida creada en la Fase 4."*

   Por eso esto es una llamada a `leerDato()` y nada más: si algún día alguien
   cambia dónde vive la altura, esto se entera solo. */

export const DATOS_FISICOS_ESTILO = ['altura', 'peso', 'nacimiento'];

export function perfilFisicoParaEstilo(estado, datosGlobales = {}) {
  return DATOS_FISICOS_ESTILO.map((id) => leerDato(estado, id, datosGlobales));
}

/* ===========================================================================
   5 · PREFERENCIAS DE ESTILO (apartados 5 y 13)
   ===========================================================================
   *"Mantener las preferencias ya desarrolladas: estilos favoritos, colores,
   paletas, marcas, ocasiones, nivel/formalidad, preferencias personales."*

   ⚠️ **Las que el armario ya tiene se DERIVAN de él** —marcas, colores y
   ocasiones salen de sus prendas y sus outfits— y solo se guardan aquí las que
   no existían: estilos favoritos, colores favoritos y formalidad. Declarar aquí
   las marcas sería el segundo sistema de ropa que prohíbe el encabezado. */

export const PREFERENCIAS_PROPIAS = ['estilosFavoritos', 'coloresFavoritos', 'formalidad', 'ropaOversize', 'preferenciaTextura'];

export function preferenciasDeEstilo(estado, armario, datosGlobales = {}) {
  const prendas = (armario || {}).prendas || [];
  const outfits = (armario || {}).outfits || [];
  return {
    // Derivadas del armario. Cero copias.
    marcas: marcasDe(prendas),
    coloresUsados: [...new Set(prendas.map((p) => p.color).filter(Boolean))]
      .map((id) => colorDe(id)).filter(Boolean),
    ocasiones: [...new Set(outfits.map((o) => o.ocasion).filter(Boolean))]
      .map((id) => OCASIONES_OUTFIT.find((o) => o.id === id)).filter(Boolean),
    // Guardadas en la capa de la Fase 4.
    propias: PREFERENCIAS_PROPIAS.map((id) => leerDato(estado, id, datosGlobales)),
  };
}

/**
 * Apartado 9 — *"Otros módulos de Estilo de hombre podrán consultar
 * posteriormente información del armario… Pero no debe crear otra copia de esas
 * preferencias."*
 *
 * Esta es esa puerta: **solo lectura**, y calculada al vuelo.
 */
export function preferenciasParaOtrosModulos(estado, armario, datosGlobales = {}) {
  const p = preferenciasDeEstilo(estado, armario, datosGlobales);
  return {
    marcas: p.marcas,
    colores: p.coloresUsados.map((c) => c.id),
    ocasiones: p.ocasiones.map((o) => o.id),
    preferencias: p.propias.filter((d) => d.tiene).map((d) => ({ id: d.id, valor: d.valor })),
    // ⚠️ Se dice, para que nadie se plantee guardarlo: esto se recalcula.
    derivado: true,
  };
}

/* ===========================================================================
   6 · RECOMENDACIONES (apartados 6, 7, 8 y 11)
   ===========================================================================
   *"NO crear aquí un generador de outfits mediante IA. Las recomendaciones deben
   basarse en datos, preferencias, reglas e información del armario."*

   Y el motor ya existe: `recomendarOutfits()` de AR F4 sabe de repetición, de
   prendas no disponibles y de outfits olvidados. Lo que falta es la capa de
   preferencias por encima. */

export const MOTIVOS_SIN_RECOMENDACION = {
  sin_outfits: 'Todavía no has creado ningún outfit.',
  pocos_usos: 'Cuando registres unos cuantos usos podremos sugerirte algo con sentido.',
  modulo_apagado: 'El apartado de Estilo y armario está desactivado.',
};

/**
 * ⚠️ **Ninguna de estas funciones escribe en el armario.** El apartado 7 lo pide
 * —*"una recomendación nunca debe convertirse automáticamente en una
 * modificación del armario"*— y la forma de garantizarlo no es acordarse: es que
 * la capacidad no exista en este archivo. Hay una prueba que lo comprueba.
 */
export function recomendacionesDeEstilo(estado, armario, { hoy = todayISO(), ocasion = null, limite = 3, datosGlobales = {} } = {}) {
  if (!estaActivo(estado, MODULO_EH_ESTILO)) {
    return { suficiente: false, motivo: 'modulo_apagado', texto: MOTIVOS_SIN_RECOMENDACION.modulo_apagado, recomendaciones: [], falta: [] };
  }

  const a = armario || {};
  const base = recomendarOutfits(a.usos || [], a.outfits || [], a.prendas || [], {
    hoyISO: hoy,
    contexto: ocasion ? { ocasion } : {},
    limite,
  });

  const falta = loQueFaltaParaRecomendar(estado, a, datosGlobales);

  if (!base.suficiente) {
    return {
      ...base,
      texto: MOTIVOS_SIN_RECOMENDACION[base.motivo] || 'Todavía no hay información suficiente.',
      // ⚠️ Apartado 7: aunque no haya recomendación, se ofrece qué HACER, no un
      // hueco. Y las dos salidas de siempre.
      acciones: ['Añadir', 'Ignorar'],
      falta,
    };
  }

  const prefs = preferenciasDeEstilo(estado, a, datosGlobales);
  const favoritos = prefs.propias.find((d) => d.id === 'coloresFavoritos');
  const coloresFav = favoritos?.tiene
    ? String(favoritos.valor).toLowerCase().split(/[,;]/).map((x) => x.trim()).filter(Boolean)
    : [];

  return {
    ...base,
    texto: '',
    acciones: ['Añadir', 'Ignorar'],
    falta,
    // La capa que añade esta fase: por qué encaja con lo que le gusta. Reglas,
    // no IA — y si no ha indicado colores favoritos, no se inventa nada.
    recomendaciones: base.recomendaciones.map((r) => ({
      ...r,
      encajaConTusColores: coloresFav.length > 0 && coloresFav.some((c) => (r.motivos || []).join(' ').toLowerCase().includes(c)),
    })),
  };
}

/**
 * Apartado 8 — *"Si para realizar una recomendación falta una información: 'No
 * tenemos registrada tu talla de pantalón.' Mostrar: Añadir talla. **No obligar
 * al usuario a completar todo su perfil**."*
 *
 * Por eso esto devuelve una lista y no un bloqueo: la recomendación sale igual.
 */
export function loQueFaltaParaRecomendar(estado, armario, datosGlobales = {}) {
  return perfilDeTallas(estado, armario, datosGlobales)
    .filter((t) => t.origen === 'ninguno')
    .map((t) => ({ id: t.id, texto: t.texto, accion: t.accion || ACCION_ANADIR }));
}

/* ===========================================================================
   7 · CONEXIÓN FUTURA CON PRODUCTOS (apartado 12)
   ===========================================================================
   *"Preparar la integración conceptual… No desarrollar todavía afiliación ni
   catálogo. Eso llegará posteriormente."*

   Y D2-03 de Josué lo remacha: **arquitectura sí, afiliación no**. Así que aquí
   hay una declaración de por dónde irá el enlace, y **ni un producto**. */

export const PUENTE_PRODUCTOS = {
  desde: MODULO_EH_ESTILO,
  hacia: 'productos',
  fase: 55,
  // ⚠️ Lo que se le pasará el día que exista. Nada más: ni catálogo, ni enlaces,
  // ni marcas de tienda (D2-03).
  contexto: ['tallas', 'coloresFavoritos', 'estilosFavoritos', 'marcas'],
  disponible: false,
  nota: 'El apartado de Productos se construye en la fase 55.',
};

/* ===========================================================================
   8 · RESUMEN Y AUDITORÍA DE INTEGRACIÓN (apartado 15)
   ===========================================================================
   Los diez tests del enunciado son, casi todos, de la forma *"no se ha
   duplicado nada"*. Eso se puede comprobar de verdad. */

export function auditarIntegracionArmario(estado, armario, datosGlobales = {}) {
  const e = normalizarEstiloHombre(estado);
  const inv = inventarioDeEstilo(armario);
  const tallas = perfilDeTallas(e, armario, datosGlobales);

  return {
    // Test 9 — no hay una segunda base de datos de armario.
    prendasEnEstiloHombre: 0,
    outfitsEnEstiloHombre: 0,
    // Test 7 — sin duplicados. Se cuenta de verdad, no se afirma.
    prendasDuplicadas: (() => {
      const ids = ((armario || {}).prendas || []).map((p) => p.id);
      return ids.length - new Set(ids).size;
    })(),
    // Test 8 — un solo perfil de tallas, y de dónde sale cada una.
    perfilesDeTalla: 1,
    tallasDerivadas: tallas.filter((t) => t.origen === 'armario').length,
    tallasPropias: tallas.filter((t) => t.origen === 'propia').length,
    tallasSinSaber: tallas.filter((t) => t.origen === 'ninguno').length,
    // ⚠️ Los choques se cuentan y se enseñan.
    conflictosDeTalla: tallas.filter((t) => t.conflicto).map((t) => ({ id: t.id, ...t.conflicto })),
    // Tests 5 y 6 — apagar no borra.
    moduloActivo: estaActivo(e, MODULO_EH_ESTILO),
    prendas: inv.total,
    outfits: inv.outfits,
    // Lo que este archivo NO puede comprobar, y se dice (regla 8).
    noComprobableAqui: ['La navegación real en un iPhone (Test 10)'],
  };
}

export function resumenEstiloArmario(estado, armario, datosGlobales = {}) {
  const inv = inventarioDeEstilo(armario);
  const tallas = perfilDeTallas(estado, armario, datosGlobales);
  return {
    ...inv,
    acceso: accesoAlArmario(estado),
    tallasConocidas: tallas.filter((t) => t.valor !== null).length,
    tallasTotal: TALLAS_ESTILO.length,
    conflictos: tallas.filter((t) => t.conflicto).length,
    falta: loQueFaltaParaRecomendar(estado, armario, datosGlobales).length,
  };
}

/* Se reexportan para que una fase futura no caiga en la tentación de
   redefinirlas: son las del armario, y esas son las que hay. */
export { CATEGORIAS_ARMARIO, COLORES_ARMARIO, OCASIONES_OUTFIT, ESTADOS_PRENDA, ZONAS_OUTFIT, categoriaDe };
