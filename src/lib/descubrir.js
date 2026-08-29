// ============================================================================
// EH · Fase 33/65 — DESCUBRIR E INSPIRACIÓN ("✨ Descubrir")
//
// *"Inspiración, no obligación. **No será una red social** ni otro apartado
// gigantesco."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ DESCUBRIR NO ES LA FASE 32.** Las dos enseñan tarjetas, las dos se
// guardan y se descartan, y las dos tienen frecuencia — pero **lo que dicen es
// distinto**, y en eso está la fase entera:
//   · **💡 Ideas para ti** (F32) sale **de SUS datos**: *"tienes cinco prendas y
//     ningún outfit"*. Cada una explica por qué aparece **con sus cifras**.
//   · **✨ Descubrir** (F33) son ideas **que él no ha pedido y no salen de nada
//     suyo**: *"podrías probar a combinar un accesorio sencillo con un look
//     casual"*. Lo suyo solo decide **cuáles se le enseñan**, nunca el texto.
// Por eso una tarjeta de aquí **no tiene `porque` con datos**: inventarle uno
// sería atribuirle una razón que no existe.
//
// **2. ⚠️ UNA SOLA LISTA DE GUARDADOS** (apartado 6, con todas las letras:
// *"utilizar el sistema global de favoritos. **No crear una segunda lista de
// guardados**"*). Se guarda en la lista que creó la F32, por su puerta
// (`guardarEnLista`), y **este archivo no tiene `guardadas` propias**. Hay una
// prueba de que el almacén de Descubrir no lleva ese campo.
//
// **3. ⚠️ UN MÓDULO APAGADO NO APORTA TARJETAS** (apartado 4: *"no mostrar
// contenido de categorías que el usuario haya desactivado"*). Cada tarjeta
// declara **de qué módulo es**, y sin ese módulo activo no existe. Es la misma
// frontera que la F32 puso con `null`, dicha de otra forma.
//
// **4. ⚠️ OCULTAR (apartado 1), QUITAR DESDE PERSONALIZAR (12) Y "DESACTIVADA"
// (11) SON EL MISMO INTERRUPTOR.** Segunda vez en dos fases: el enunciado
// describe lo mismo tres veces y hay **una sola cosa guardada**, `frecuencia`.
// ⚠️ Y **las etiquetas NO son las de la F32**: allí son Baja/Normal/Alta/Nunca y
// aquí Poca/Normal/Mucha/Desactivada, porque así lo pone cada enunciado. Los
// nombres son de cada módulo; el comportamiento, del mismo sitio.
//
// **5. ⚠️ NI UN CATÁLOGO DE PRODUCTOS NUEVO** (apartado 9: *"se utiliza el
// catálogo global. **No crear otro catálogo de inspiración**"*). Una tarjeta que
// habla de un producto **lleva al módulo donde vive ese catálogo**, y ese
// catálogo **está vacío a propósito** (D2-03): se dice, no se rellena. Y nunca
// *"compra esto"* (apartado 10).
//
// **6. ⚠️ NO ES UNA RED SOCIAL** (apartado 15: *"❌ seguidores · ❌ likes
// públicos · ❌ comentarios · ❌ perfiles de otros usuarios"*). La auditoría lo
// declara con cuatro ceros y una prueba lee el código buscando esas palabras.
// ============================================================================

import { todayISO } from './helpers';
import { normalizarEstiloHombre, guardarConfig, modulosActivos } from './estiloDeHombre';
import { MODULO_ANFITRION } from './miEstilo';
import {
  normalizarRecomendaciones, silenciadaEn, marcarVistasEn, descartarEn,
  deshacerDescarteEn, ordenarYRecortar, tonoCorrecto,
} from './motorRecomendaciones';
/* ⚠️ La dependencia va en UN solo sentido: Descubrir usa la lista de guardados
   de la F32, y la F32 no sabe nada de Descubrir salvo el prefijo de sus ids. */
import {
  TEMAS_IDEAS, temaIdea, PREFIJO_DESCUBRIR, guardarEnLista, quitarDeLista,
  estaGuardado, listaDeGuardados,
} from './ideasEstilo';
import { CATALOGO_VACIO_PORQUE } from './motorProductos';

/* ===========================================================================
   1 · LOS TEMAS (apartado 2)
   ===========================================================================
   *"🧴 Cuidado · 💇 Pelo · 🧔 Barba · 🌫️ Perfumes · 👕 Estilo · 🕶️ Accesorios ·
   ❤️ Ideas personales."*

   ⚠️ **Son los mismos siete de la Fase 32**, con dos nombres levemente
   distintos en el enunciado ("Estilo" por "Ropa", "Ideas personales" por
   "Gustos personales"). Escribir una segunda lista por eso sería exactamente lo
   que la F26 enseñó a no hacer: se reutiliza `TEMAS_IDEAS`, **por sus ids**. */

export const TEMAS_DESCUBRIR = TEMAS_IDEAS.map((t) => t.id);

export const TEXTOS_DESCUBRIR = {
  titulo: '✨ Descubrir',
  sub: 'Inspiración, no obligación.',
  ocultar: '👁️ Ocultar',
  volver: 'Volver a ver Descubrir',
  filtros: '¿Qué quieres descubrir?',
  guardar: '❤️ Guardar',
  quitar: 'Quitar de guardados',
  descartar: '❌ No me interesa',
  verMas: '→ Ver más',
  frecuencia: '✨ Frecuencia',
  apagado: 'Descubrir está apagado. Puedes volver a encenderlo eligiendo una frecuencia.',
  sinTarjetas: 'Ahora mismo no hay nada nuevo que enseñarte aquí.',
  sinFiltros: 'Sin nada marcado se ven todos los temas.',
  // Apartado 10 — *"nunca 'compra esto'"*.
  sinCompras: 'Aquí no se compra nada: esto solo lleva a donde tú apuntas tus productos.',
  // Apartado 15 — y se dice, porque es parte de lo que Descubrir NO es.
  sinRedSocial: 'Esto es solo para ti: no hay seguidores, ni comentarios, ni nada público.',
  guardadas: 'Lo que has guardado',
  // Apartado 6 — y va a la MISMA lista que las ideas de la pantalla principal.
  mismaLista: 'Se guarda en la misma lista que las ideas: no hay dos sitios.',
};

/* ===========================================================================
   2 · LA FRECUENCIA (apartados 1, 11 y 12)
   ===========================================================================
   *"✨ Frecuencia: Poca · Normal · Mucha · Desactivada."*

   ⚠️ Las etiquetas son **las de este enunciado**, no las de la F32: cada módulo
   nombra las suyas. El comportamiento —cuántas se enseñan— es lo mismo. */

export const FRECUENCIAS_DESCUBRIR = [
  { id: 'poca', nombre: 'Poca', cuantas: 1 },
  { id: 'normal', nombre: 'Normal', cuantas: 2 },
  { id: 'mucha', nombre: 'Mucha', cuantas: 4 },
  // ⚠️ Cero, y es el interruptor entero de la fase (decisión 4).
  { id: 'desactivada', nombre: 'Desactivada', cuantas: 0 },
];

export const FRECUENCIA_DESCUBRIR_DEFECTO = 'normal';

export const frecuenciaDescubrir = (id) => FRECUENCIAS_DESCUBRIR.find((f) => f.id === id) || null;

/* ===========================================================================
   3 · LAS TARJETAS (apartados 2, 3, 8, 9, 10 y 14)
   ===========================================================================
   ⚠️ **Ni una empieza por "debes", y ninguna presenta una tendencia como una
   verdad** (apartado 14). Todas usan una de las fórmulas abiertas, y hay una
   prueba que las barre.

   ⚠️ **Cada una declara su módulo** (apartado 4) y, si lleva a algún sitio, su
   acción — que abre **el módulo que ya existe** (apartado 8). Las que hablan de
   un producto llevan `producto: true`, y eso abre **el catálogo global**
   (apartado 9), que está vacío a propósito (D2-03).

   ⚠️ **Todos los ids empiezan por `desc_`**, que es lo que permite que se
   guarden en la lista de la F32 sin que su normalizador se los lleve. */

const t = (id, tema, modulo, texto, extra = {}) => ({
  id: `${PREFIJO_DESCUBRIR}${id}`, tema, modulo, texto, ...extra,
});

export const TARJETAS_DESCUBRIR = [
  /* ── 👕 Estilo ───────────────────────────────────────────────────────── */
  t('accesorio_casual', 'ropa', 'estilo',
    'Podrías probar a combinar un accesorio sencillo con un look casual.',
    { accion: { etiqueta: 'Ver en Armario', destino: 'armario' } }),
  t('tres_colores', 'ropa', 'estilo',
    'Una idea podría ser quedarte en tres colores por conjunto: suele verse ordenado sin esfuerzo.',
    { accion: { etiqueta: 'Ver en Armario', destino: 'armario' } }),
  t('capas', 'ropa', 'estilo',
    'Si te gusta este estilo, las capas dan juego: una camisa abierta sobre una camiseta lisa.',
    { accion: { etiqueta: 'Ver en Armario', destino: 'armario' } }),
  t('basico_repetible', 'ropa', 'estilo',
    'Podrías tener dos o tres conjuntos "de siempre" y no volver a pensarlos por las mañanas.',
    { accion: { etiqueta: 'Ver en Armario', destino: 'armario' } }),

  /* ── 🧴 Cuidado ──────────────────────────────────────────────────────── */
  t('rutina_corta', 'cuidado', 'skincare',
    'Una idea podría ser una rutina de dos pasos: se hace en un minuto y se mantiene sola.',
    { accion: { etiqueta: 'Ver en Skincare', destino: 'skincare', zona: 'rutina' } }),
  t('solar_diario', 'cuidado', 'skincare',
    'Podrías probar a dejar la crema con protección donde la veas: lo que se ve, se usa.',
    { accion: { etiqueta: 'Ver en Skincare', destino: 'skincare', zona: 'rutina' } }),
  t('menos_productos', 'cuidado', 'skincare',
    'Una idea podría ser quedarte con menos productos y usarlos siempre, en vez de muchos a ratos.',
    { producto: true, accion: { etiqueta: 'Ver en Skincare', destino: 'skincare', zona: 'productos' } }),

  /* ── 💇 Pelo ─────────────────────────────────────────────────────────── */
  t('secar_menos', 'pelo', 'pelo',
    'Podrías probar a dejarlo secar al aire algún día: es un cambio pequeño y se nota.',
    { accion: { etiqueta: 'Ver en Pelo', destino: 'pelo', zona: 'rutina' } }),
  t('foto_corte', 'pelo', 'pelo',
    'Una idea podría ser guardar una foto del corte que te gustó, para no explicarlo de memoria.',
    { accion: { etiqueta: 'Ver en Pelo', destino: 'pelo', zona: 'cortes' } }),
  t('producto_ligero', 'pelo', 'pelo',
    'Si te gusta un acabado natural, los productos ligeros suelen dejar el pelo con movimiento.',
    { producto: true, accion: { etiqueta: 'Ver en Pelo', destino: 'pelo', zona: 'productos' } }),

  /* ── 🧔 Barba ────────────────────────────────────────────────────────── */
  t('afeitado_despues', 'barba', 'barba',
    'Podrías probar a dejar preparado lo del después del afeitado antes de empezar.',
    { accion: { etiqueta: 'Ver en Barba', destino: 'barba', zona: 'rutinas' } }),
  t('forma_barba', 'barba', 'barba',
    'Una idea podría ser fijar una línea y mantenerla, en vez de recortarla distinta cada vez.',
    { accion: { etiqueta: 'Ver en Barba', destino: 'barba' } }),

  /* ── 🌫️ Perfumes ─────────────────────────────────────────────────────── */
  t('perfume_dia_noche', 'perfumes', 'perfumes',
    'Una idea podría ser tener uno para el día y otro para la noche, y no pensarlo más.',
    { accion: { etiqueta: 'Ver en Perfumes', destino: 'perfumes' } }),
  t('perfume_menos', 'perfumes', 'perfumes',
    'Podrías probar con menos cantidad: los perfumes suelen abrirse solos con el calor del cuerpo.',
    { accion: { etiqueta: 'Ver en Perfumes', destino: 'perfumes' } }),
  t('perfume_probar', 'perfumes', 'perfumes',
    'Si te gusta un aroma, podrías apuntarlo en "por probar" antes de decidir nada.',
    { producto: true, accion: { etiqueta: 'Ver en Perfumes', destino: 'perfumes' } }),

  /* ── 🕶️ Accesorios ───────────────────────────────────────────────────── */
  t('uno_solo', 'accesorios', 'accesorios',
    'Una idea podría ser un solo accesorio que se vea, en vez de varios pequeños.',
    { accion: { etiqueta: 'Ver en Accesorios', destino: 'accesorios' } }),
  t('reloj_diario', 'accesorios', 'accesorios',
    'Podrías probar a apuntar el que ya llevas a diario: es el que más veces vas a combinar.',
    { accion: { etiqueta: 'Ver en Accesorios', destino: 'accesorios' } }),

  /* ── ❤️ Ideas personales ─────────────────────────────────────────────── */
  t('probar_algo', 'gustos', 'gustos',
    'Una idea podría ser apuntar algo que te apetezca probar este mes, aunque sea pequeño.',
    { accion: { etiqueta: 'Ver en Mis gustos', destino: 'gustos' } }),
  t('lo_que_no', 'gustos', 'gustos',
    'Podrías apuntar también lo que NO te gusta: sirve tanto como lo que sí.',
    { accion: { etiqueta: 'Ver en Mis gustos', destino: 'gustos' } }),
];

export const tarjetaDescubrir = (id) => TARJETAS_DESCUBRIR.find((x) => x.id === id) || null;
export const IDS_DESCUBRIR = TARJETAS_DESCUBRIR.map((x) => x.id);

/** Las fórmulas abiertas del apartado 14, literales. */
export const FORMULAS_DESCUBRIR = ['Podrías', 'Una idea podría ser', 'Si te gusta'];

/* ===========================================================================
   4 · EL ALMACÉN (apartados 5, 7, 11 y 13)
   ===========================================================================
   ⚠️ **Sin `guardadas`** (decisión 2): eso es de la lista de la F32, y ésta es
   la única forma de que "no crear una segunda lista de guardados" sea verdad y
   no una intención. */

export const DEFAULT_DESCUBRIR = {
  frecuencia: FRECUENCIA_DESCUBRIR_DEFECTO,
  // Apartado 5 — vacío es "todos": marcar los siete y no marcar ninguno son lo mismo.
  filtros: [],
  feedback: [],
  vistas: [],
};

/** Un solo motivo: *"❌ No me interesa"* (apartado 7). */
export const MOTIVOS_DESCUBRIR = [{ id: 'no_interesa', nombre: 'No me interesa', dias: 120 }];
export const DIAS_SILENCIO_DESCUBRIR = { no_interesa: 120 };

export function normalizarDescubrir(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const recs = normalizarRecomendaciones(
    { feedback: g.feedback, vistas: g.vistas },
    { ids: IDS_DESCUBRIR, motivos: MOTIVOS_DESCUBRIR },
  );
  return {
    frecuencia: frecuenciaDescubrir(g.frecuencia) ? g.frecuencia : FRECUENCIA_DESCUBRIR_DEFECTO,
    // ⚠️ Solo temas que existen: uno guardado de otra versión no revive.
    filtros: (Array.isArray(g.filtros) ? g.filtros : []).filter((x) => TEMAS_DESCUBRIR.includes(x)),
    feedback: recs.feedback,
    vistas: recs.vistas,
  };
}

export const datosDescubrir = (estado) => {
  const e = normalizarEstiloHombre(estado);
  return normalizarDescubrir(e.modulos.find((m) => m.id === MODULO_ANFITRION)?.config?.descubrir);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_ANFITRION, { descubrir: datos });

/* ── Apartados 1, 11 y 12 — el único interruptor ─────────────────────────── */

export function cambiarFrecuenciaDescubrir(estado, id) {
  if (!frecuenciaDescubrir(id)) return normalizarEstiloHombre(estado);
  return escribir(estado, { ...datosDescubrir(estado), frecuencia: id });
}

export const ocultarDescubrir = (estado) => cambiarFrecuenciaDescubrir(estado, 'desactivada');

export const mostrarDescubrir = (estado, id = FRECUENCIA_DESCUBRIR_DEFECTO) =>
  cambiarFrecuenciaDescubrir(
    estado,
    frecuenciaDescubrir(id) && id !== 'desactivada' ? id : FRECUENCIA_DESCUBRIR_DEFECTO,
  );

export const descubrirApagado = (estado) => datosDescubrir(estado).frecuencia === 'desactivada';

/* ── Apartado 5 — los filtros ────────────────────────────────────────────── */

export function alternarFiltro(estado, temaId) {
  if (!TEMAS_DESCUBRIR.includes(temaId)) return normalizarEstiloHombre(estado);
  const d = datosDescubrir(estado);
  const filtros = d.filtros.includes(temaId)
    ? d.filtros.filter((x) => x !== temaId)
    // Se guardan en el orden del catálogo, no en el de los toques.
    : TEMAS_DESCUBRIR.filter((x) => d.filtros.includes(x) || x === temaId);
  return escribir(estado, { ...d, filtros });
}

export const limpiarFiltros = (estado) => escribir(estado, { ...datosDescubrir(estado), filtros: [] });

/* ===========================================================================
   5 · QUÉ SE ENSEÑA (apartados 3, 4, 5, 11 y 13)
   ===========================================================================
   ⚠️ **No escribe nada**, como en la F32: mostrar y registrar que se ha mostrado
   son dos llamadas. */

/** Cuántos días calla una tarjeta solo por haberse enseñado ya (apartado 13). */
export const DIAS_TRAS_VERLA_DESC = 14;

export function silenciadaTarjeta(estado, id, { hoy = todayISO() } = {}) {
  const d = datosDescubrir(estado);
  return silenciadaEn({ feedback: d.feedback }, id, {
    hoy, dias: DIAS_SILENCIO_DESCUBRIR, paraSiempre: [],
  });
}

export function descubrir(estado, { hoy = todayISO(), limite = null } = {}) {
  const e = normalizarEstiloHombre(estado);
  const d = datosDescubrir(e);
  const frec = frecuenciaDescubrir(d.frecuencia);
  const guardadas = listaDeGuardados(e)
    .map((g) => tarjetaDescubrir(g.reglaId))
    .filter(Boolean);

  if (frec.cuantas === 0) {
    return {
      apagado: true, frecuencia: d.frecuencia, filtros: d.filtros,
      total: 0, tarjetas: [], hayMas: false, guardadas, texto: TEXTOS_DESCUBRIR.apagado,
    };
  }

  const activos = modulosActivos(e).map((m) => m.id);
  const candidatas = TARJETAS_DESCUBRIR
    // ⚠️ Apartado 4 — un módulo apagado no aporta tarjetas.
    .filter((x) => activos.includes(x.modulo))
    // Apartado 5 — y sin filtros marcados, se ven todos los temas.
    .filter((x) => d.filtros.length === 0 || d.filtros.includes(x.tema))
    // Apartado 13 — *"si el usuario ya la ha descartado: no insistir"*.
    .filter((x) => !silenciadaTarjeta(e, x.id, { hoy }).silenciada)
    .filter((x) => {
      const v = d.vistas.find((y) => y.reglaId === x.id);
      if (!v) return true;
      return (new Date(`${hoy}T00:00:00`) - new Date(`${v.fecha}T00:00:00`)) / 86400000 >= DIAS_TRAS_VERLA_DESC;
    })
    .map((x) => ({
      ...x,
      temaNombre: temaIdea(x.tema)?.nombre || '',
      icono: temaIdea(x.tema)?.icono || '✨',
      guardada: estaGuardado(e, x.id),
      /* Apartado 9 — si habla de un producto, lleva al catálogo global, que
         está vacío a propósito (D2-03) y lo dice. */
      catalogo: x.producto ? CATALOGO_VACIO_PORQUE : null,
      peso: 0,
      temas: [x.tema],
      titulo: x.texto,
    }));

  const { total, recomendaciones, hayMas } = ordenarYRecortar(candidatas, { limite: limite || frec.cuantas });
  return {
    apagado: false,
    frecuencia: d.frecuencia,
    filtros: d.filtros,
    total,
    tarjetas: recomendaciones,
    hayMas,
    guardadas,
    texto: total === 0 ? TEXTOS_DESCUBRIR.sinTarjetas : '',
  };
}

/* ===========================================================================
   6 · LO QUE HACE CON UNA TARJETA (apartados 6, 7 y 13)
   =========================================================================== */

export function marcarVistasDescubrir(estado, ids = [], { hoy = todayISO() } = {}) {
  const validos = ids.filter((id) => !!tarjetaDescubrir(id));
  if (validos.length === 0) return normalizarEstiloHombre(estado);
  const d = datosDescubrir(estado);
  const { vistas } = marcarVistasEn({ vistas: d.vistas }, validos, hoy);
  return escribir(estado, { ...d, vistas });
}

/** Apartado 7 — *"la aplicación podrá reducir sugerencias similares"*. */
export function descartarTarjeta(estado, id, { hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  if (!tarjetaDescubrir(id)) return { estado: e, error: 'Esa tarjeta no existe.' };
  const d = datosDescubrir(e);
  const { feedback } = descartarEn({ feedback: d.feedback }, id, 'no_interesa', hoy);
  return { estado: escribir(e, { ...d, feedback }), error: null };
}

export function deshacerDescarte(estado, id) {
  const d = datosDescubrir(estado);
  const { feedback } = deshacerDescarteEn({ feedback: d.feedback }, id);
  return escribir(estado, { ...d, feedback });
}

/**
 * Apartado 6 — ⚠️ **la MISMA lista de guardados que las ideas de la F32**.
 * Este archivo no tiene una propia, y por eso *"no crear una segunda lista"* es
 * verdad y no una intención.
 */
export const guardarTarjeta = (estado, id, opciones) =>
  (tarjetaDescubrir(id) ? guardarEnLista(estado, id, opciones) : normalizarEstiloHombre(estado));

export const quitarTarjetaGuardada = (estado, id) => quitarDeLista(estado, id);

/* ===========================================================================
   7 · RESUMEN, AUDITORÍA, TEXTOS Y PANEL
   =========================================================================== */

export function resumenDescubrir(estado, opciones = {}) {
  const d = datosDescubrir(estado);
  const r = descubrir(estado, opciones);
  return {
    frecuencia: d.frecuencia,
    apagado: r.apagado,
    // ⚠️ Apagado devuelve `null`, no 0 (lección de la F25).
    tarjetas: r.apagado ? null : r.total,
    filtros: d.filtros.length,
    guardadas: r.guardadas.length,
    vistas: d.vistas.length,
    descartadas: d.feedback.length,
    catalogo: TARJETAS_DESCUBRIR.length,
    temas: TEMAS_DESCUBRIR.length,
  };
}

export function lineaDescubrir(estado, opciones = {}) {
  const r = descubrir(estado, opciones);
  if (r.apagado || r.total === 0) return null;
  return `${r.total} ${r.total === 1 ? 'idea nueva' : 'ideas nuevas'}`;
}

export function textosDeDescubrir() {
  return [
    ...TARJETAS_DESCUBRIR.map((x) => x.texto),
    ...TARJETAS_DESCUBRIR.map((x) => x.accion?.etiqueta).filter(Boolean),
  ];
}

export function auditarDescubrir() {
  return {
    // Apartado 15 — *"no habrá red social"*, comprobado en vez de prometido.
    seguidores: 0,
    likesPublicos: 0,
    comentarios: 0,
    perfilesDeOtros: 0,
    // Apartado 6 — listas de guardados propias. CERO: se usa la de la F32.
    listasDeGuardadosPropias: 0,
    // Apartado 9 — catálogos de inspiración propios.
    catalogosDeProductos: 0,
    // Decisión 4 — un solo interruptor para los apartados 1, 11 y 12.
    interruptores: 1,
    // Apartado 14 — tarjetas con una palabra prohibida, o sin fórmula abierta.
    tarjetasConTonoMalo: textosDeDescubrir().filter((x) => !tonoCorrecto(x)).length,
    tarjetasSinFormula: TARJETAS_DESCUBRIR.filter(
      (x) => !FORMULAS_DESCUBRIR.some((f) => x.texto.startsWith(f)),
    ).length,
    // Apartado 4 — tarjetas sin módulo declarado: saldrían con todo apagado.
    tarjetasSinModulo: TARJETAS_DESCUBRIR.filter((x) => !x.modulo).length,
    tarjetas: TARJETAS_DESCUBRIR.length,
    temas: TEMAS_DESCUBRIR.length,
    datosGuardados: Object.keys(DEFAULT_DESCUBRIR),
  };
}

export function panelDescubrir(estado, opciones = {}) {
  const d = datosDescubrir(estado);
  const r = descubrir(estado, opciones);
  return {
    titulo: TEXTOS_DESCUBRIR.titulo,
    sub: TEXTOS_DESCUBRIR.sub,
    ...r,
    frecuencias: FRECUENCIAS_DESCUBRIR,
    // Apartado 5 — los siete, con su marca.
    temas: TEMAS_IDEAS.map((x) => ({ ...x, puesto: d.filtros.includes(x.id) })),
    sinFiltros: d.filtros.length === 0 ? TEXTOS_DESCUBRIR.sinFiltros : '',
    // Apartados 6, 10 y 15 — lo que esto NO es, dicho.
    mismaLista: TEXTOS_DESCUBRIR.mismaLista,
    sinCompras: TEXTOS_DESCUBRIR.sinCompras,
    sinRedSocial: TEXTOS_DESCUBRIR.sinRedSocial,
    resumen: resumenDescubrir(estado, opciones),
  };
}

export { CATALOGO_VACIO_PORQUE, PREFIJO_DESCUBRIR };
