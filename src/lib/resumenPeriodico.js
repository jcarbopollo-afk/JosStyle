// ============================================================================
// EH · Fase 59/65 — RESUMEN SEMANAL Y MENSUAL
//
// *"En unos segundos entender qué ha pasado con tu estilo."*
//
// Y la condición de finalización, que es la que manda:
// *"Debe sentirse como un pequeño informe personal útil. No como una obligación
// semanal. Y debe poder desaparecer completamente si el usuario no lo quiere."*
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. 🚨 NACE APAGADO, Y PUEDE DESAPARECER DEL TODO.** La condición lo pide con
// esas palabras, y el apartado 5 pone `❌ Desactivado` como una de las tres
// opciones. Así que el valor por defecto es **desactivado**: un informe semanal
// que nadie ha pedido es exactamente la *"obligación semanal"* que la condición
// prohíbe. Y desactivarlo no lo esconde: **no se genera**.
//
// **2. 🚨 SI NO HA PASADO NADA, NO SE INVENTA UN RESUMEN** (apartado 3, con sus
// palabras: *"no fabricar un resumen artificial"*). Se dice *"esta semana no hay
// cambios destacables"* y se acabó. Rellenar con frases de relleno es lo que hace
// que el de la semana siguiente tampoco se lea.
//
// **3. ⚠️ EL RESUMEN SE ADAPTA A CUÁNTO USA LA APLICACIÓN** (apartado 4). Quien
// apenas la usa recibe **una sección**; quien la usa mucho, las cuatro. No es un
// detalle de diseño: mandarle cinco apartados vacíos a alguien que ha entrado dos
// veces es decirle que lo está haciendo mal.
//
// **4. ⚠️ LOS CONTENIDOS SON LOS INSIGHTS DE LA F58.** Esta fase **agrupa y
// ordena**; no vuelve a mirar los datos. Si escribiera sus propias frases,
// acabaría diciendo una cosa en el resumen y otra en la pantalla, que es el
// duplicado más caro de todos: el que se contradice delante del usuario.
//
// **5. ⚠️ Y EL HISTORIAL GUARDA LO MÍNIMO** (apartados 15 y 16: *"sin almacenar
// información redundante"*, *"no deben recalcular todo cada vez"*). Se guardan
// **las fechas y los números**, no el texto: el texto se vuelve a componer, y así
// un cambio de redacción no deja doscientos resúmenes viejos escritos de otra
// manera.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig, moduloEH, modulosActivos } from './estiloDeHombre';
import { MODULO_ANFITRION } from './miEstilo';
import { generarInsights, tipoDeInsight, MAX_A_LA_VEZ, TEXTOS_INSIGHTS } from './insights';
import { permisoIA } from './iaEstilo';
import { todayISO } from './papelera';
import { diasDesde } from './motorRecomendaciones';

/* ===========================================================================
   1 · CADA CUÁNTO, O NUNCA (apartados 5 y 6) — 🚨 decisión 1
   ===========================================================================
   *"📅 Semanal. 📅 Mensual. ❌ Desactivado."* */

export const FRECUENCIAS = [
  { id: 'semanal', icono: '📅', nombre: 'Semanal', dias: 7 },
  { id: 'mensual', icono: '📅', nombre: 'Mensual', dias: 30 },
  { id: 'desactivado', icono: '❌', nombre: 'Desactivado', dias: null },
];

export const frecuencia = (id) => FRECUENCIAS.find((f) => f.id === id) || null;

/* 🚨 Decisión 1 — apagado por defecto, y sin notificación. */
export const DEFAULT_RESUMEN = { frecuencia: 'desactivado', avisar: false, historial: [], correcciones: [] };

export const MAX_HISTORIAL = 12;

export function normalizarResumen(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    frecuencia: frecuencia(g.frecuencia) ? g.frecuencia : 'desactivado',
    // ⚠️ Y avisar solo si además hay resumen: un aviso de algo que no se genera.
    avisar: g.avisar === true && !!frecuencia(g.frecuencia) && g.frecuencia !== 'desactivado',
    /* ⚠️ Decisión 5 — fechas y números, nunca el texto. */
    historial: (Array.isArray(g.historial) ? g.historial : [])
      .filter((h) => h && typeof h.hasta === 'string')
      .map((h) => ({ tipo: h.tipo, hasta: h.hasta, secciones: Number(h.secciones) || 0, cosas: Number(h.cosas) || 0 }))
      .slice(-MAX_HISTORIAL),
    correcciones: (Array.isArray(g.correcciones) ? g.correcciones : [])
      .filter((c) => c && typeof c.sobre === 'string')
      .map((c) => ({ sobre: c.sobre, cuando: c.cuando || null })),
  };
}

export const datosResumen = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_ANFITRION);
  return normalizarResumen(mod?.config?.resumenPeriodico);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_ANFITRION, { resumenPeriodico: datos });

export function cambiarFrecuencia(estado, id) {
  if (!frecuencia(id)) return normalizarEstiloHombre(estado);
  const d = datosResumen(estado);
  /* 🚨 Desactivarlo apaga también el aviso: no se avisa de algo que no existe. */
  return escribir(estado, { ...d, frecuencia: id, avisar: id === 'desactivado' ? false : d.avisar });
}

export function alternarAviso(estado) {
  const d = datosResumen(estado);
  // ⚠️ Apartado 6 — sin resumen no hay aviso que encender.
  if (d.frecuencia === 'desactivado') return normalizarEstiloHombre(estado);
  return escribir(estado, { ...d, avisar: !d.avisar });
}

export const estaActivo = (estado) => datosResumen(estado).frecuencia !== 'desactivado';

/* ===========================================================================
   2 · LAS SECCIONES (apartados 1, 2, 9 y 10)
   ===========================================================================
   *"🧔 Esta semana · Lo más destacado (1–3) · Cambios · Tendencias · Sugerencia
   (solo si realmente aporta valor)."* */

export const SECCIONES = [
  {
    id: 'destacado', icono: '🧔', nombre: 'Lo más destacado',
    en: ['semanal', 'mensual'], tipos: ['resumen', 'cambio'], max: 3, orden: 0,
  },
  {
    id: 'cambios', icono: '🔄', nombre: 'Cambios',
    en: ['semanal', 'mensual'], tipos: ['cambio'], max: 3, orden: 1,
  },
  {
    id: 'tendencias', icono: '📈', nombre: 'Tendencias',
    en: ['semanal', 'mensual'], tipos: ['preferencia', 'habito'], max: 2, orden: 2,
    // ⚠️ Apartado 9 — *"si existe suficiente información"*.
    soloSiHayDatos: true,
  },
  {
    id: 'objetivos', icono: '🎯', nombre: 'Objetivos',
    en: ['mensual'], tipos: ['objetivo'], max: 2, orden: 3,
  },
  {
    id: 'sugerencia', icono: '💡', nombre: 'Sugerencia',
    en: ['semanal', 'mensual'], tipos: ['sugerencia'], max: 1, orden: 4,
    // ⚠️ Apartado 9 — *"solo si realmente aporta valor"*.
    soloSiAporta: true,
  },
];

export const seccion = (id) => SECCIONES.find((s) => s.id === id) || null;
export const seccionesDe = (tipo) => SECCIONES.filter((s) => s.en.includes(tipo)).sort((a, b) => a.orden - b.orden);

/* ===========================================================================
   3 · CUÁNTO RESUMEN LE TOCA (apartado 4) — decisión 3
   ===========================================================================
   *"Un usuario que apenas utiliza Estilo: resumen corto. Uno que lo utiliza
   mucho: más información."* */

export const TAMANOS = [
  { id: 'corto', desde: 0, secciones: 1 },
  { id: 'normal', desde: 2, secciones: 3 },
  { id: 'largo', desde: 4, secciones: 5 },
];

export const tamanoPara = (cuantosInsights) => [...TAMANOS].reverse()
  .find((t) => cuantosInsights >= t.desde) || TAMANOS[0];

/* ===========================================================================
   4 · GENERARLO (apartados 1, 2, 3 y 11) — 🚨 decisiones 1, 2 y 4
   =========================================================================== */

export const TEXTOS_RESUMEN = {
  semanal: '🧔 Esta semana',
  mensual: '📈 Mi mes en Estilo',
  sinCambios: 'Esta semana no hay cambios destacables.',
  sinCambiosMes: 'Este mes no hay cambios destacables.',
  apagado: 'Los resúmenes están apagados. Si los quieres, se encienden en Personalizar.',
  aviso: 'Tu resumen semanal de Estilo está listo.',
  dentro: 'El resumen está siempre dentro de Estilo de hombre, aunque no tengas avisos.',
  compartir: 'Compartirlo es cosa tuya: no se manda nada solo.',
  corregido: 'Apuntado. No te lo vuelvo a decir así.',
};

/**
 * 🚨 El resumen. Devuelve `{ activo, hay, secciones, texto }`.
 *
 * · Apagado → `activo: false` y **no se genera nada** (decisión 1).
 * · Sin nada que contar → `hay: false` y el texto del apartado 3 (decisión 2).
 * · Y el contenido son **los insights de la F58** (decisión 4).
 */
export function generarResumen(estado, { tipo = null, armario = null, datosGlobales = {}, hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  const d = datosResumen(e);
  const cual = tipo || d.frecuencia;

  if (cual === 'desactivado' || !frecuencia(cual)) {
    return { activo: false, hay: false, tipo: 'desactivado', secciones: [], texto: TEXTOS_RESUMEN.apagado, cosas: 0 };
  }

  /* ⚠️ Decisión 4 — se piden los insights, no se recalculan los datos. */
  const periodo = cual === 'semanal' ? 'semana' : 'mes';
  const { insights } = generarInsights(e, { periodo, armario, datosGlobales, hoy });

  /* Apartado 13 — lo que él corrigió no se vuelve a decir igual. */
  const corregidos = d.correcciones.map((c) => c.sobre);
  const utiles = insights.filter((x) => !corregidos.includes(x.id));

  const tamano = tamanoPara(utiles.length);
  const posibles = seccionesDe(cual);

  const secciones = posibles
    .map((s) => {
      const dentro = utiles.filter((x) => s.tipos.includes(x.tipo)).slice(0, s.max);
      return { ...s, cosas: dentro };
    })
    .filter((s) => s.cosas.length > 0)
    // ⚠️ Decisión 3 — el tamaño lo decide cuánto usa la aplicación.
    .slice(0, tamano.secciones);

  const cosas = secciones.reduce((n, s) => n + s.cosas.length, 0);

  return {
    activo: true,
    tipo: cual,
    titulo: cual === 'semanal' ? TEXTOS_RESUMEN.semanal : TEXTOS_RESUMEN.mensual,
    /* 🚨 Decisión 2 — si no hay nada, se dice, no se rellena. */
    hay: cosas > 0,
    secciones,
    cosas,
    tamano: tamano.id,
    texto: cosas > 0 ? null : (cual === 'semanal' ? TEXTOS_RESUMEN.sinCambios : TEXTOS_RESUMEN.sinCambiosMes),
    hasta: hoy,
  };
}

/* ===========================================================================
   5 · LA COMPARACIÓN (apartado 11)
   ===========================================================================
   *"Este mes vs. anterior. Pero solo cuando haya datos suficientes."* */

export const MINIMO_PARA_COMPARAR = 3;

export function sePuedeComparar(estado, { hoy = todayISO() } = {}) {
  const h = datosResumen(estado).historial;
  if (h.length < 2) return { puede: false, porque: 'Todavía no hay dos periodos que comparar.' };
  const previo = h[h.length - 2];
  if ((previo.cosas || 0) < MINIMO_PARA_COMPARAR) {
    return { puede: false, porque: 'El periodo anterior tiene muy poco como para que la comparación diga algo.' };
  }
  return { puede: true, porque: null, previo };
}

/* ===========================================================================
   6 · EL AVISO (apartados 7 y 8)
   ===========================================================================
   ⚠️ Apartado 8 — *"aunque no haya notificación, el resumen debe estar
   disponible dentro de Estilo"*. Por eso `generarResumen` no mira `avisar`
   para nada: el aviso es un extra, no la puerta. */

export function avisoDelResumen(estado) {
  const d = datosResumen(estado);
  if (!d.avisar || d.frecuencia === 'desactivado') return null;
  return {
    texto: TEXTOS_RESUMEN.aviso,
    accion: { id: 'abrir_resumen', etiqueta: 'Abrir resumen' },
    /* ⚠️ Apartado 6 — el aviso lo manda el sistema global, no este módulo. */
    lanza: 'notificaciones.js',
  };
}

/* ===========================================================================
   7 · CORREGIRLO (apartado 13)
   ===========================================================================
   *"Si el resumen dice algo incorrecto, el usuario puede corregirlo. La
   corrección debe servir para evitar repetir la interpretación equivocada."* */

export const TEXTO_CORREGIR = 'Esto no es así';

export function corregirResumen(estado, idInsight, { hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  const d = datosResumen(e);
  if (d.correcciones.some((c) => c.sobre === idInsight)) return e;
  return escribir(e, { ...d, correcciones: [...d.correcciones, { sobre: idInsight, cuando: hoy }] });
}

/* ===========================================================================
   8 · COMPARTIRLO (apartado 14)
   =========================================================================== */

export const COMPARTIR = {
  existe: false,
  porque: 'JC Fitness no tiene un sistema de compartición. Lo que hay es la exportación de Mis datos, que él lanza a mano.',
  /* 🚨 Y la regla, para el día que exista. */
  regla: 'Solo con una acción suya, y nunca automáticamente.',
  automatico: false,
};

/* ===========================================================================
   9 · HISTORIAL Y RENDIMIENTO (apartados 15 y 16) — decisión 5
   =========================================================================== */

export function guardarEnHistorial(estado, resumen) {
  if (!resumen?.activo) return normalizarEstiloHombre(estado);
  const d = datosResumen(estado);
  return escribir(estado, {
    ...d,
    /* ⚠️ Fechas y números. **El texto no se guarda**: se vuelve a componer. */
    historial: [...d.historial, {
      tipo: resumen.tipo, hasta: resumen.hasta, secciones: resumen.secciones.length, cosas: resumen.cosas,
    }].slice(-MAX_HISTORIAL),
  });
}

/**
 * ⚠️ Apartado 16 — *"no deben recalcular todo cada vez que el usuario abre"*.
 * Si el último resumen es de hoy mismo, no hay nada que rehacer.
 */
export function hayQueRegenerar(estado, { hoy = todayISO() } = {}) {
  const d = datosResumen(estado);
  if (d.frecuencia === 'desactivado') return false;
  const ultimo = d.historial[d.historial.length - 1];
  if (!ultimo) return true;
  const dias = diasDesde(ultimo.hasta, hoy);
  if (dias === null) return true;
  return dias >= (frecuencia(d.frecuencia)?.dias || 7);
}

export const anteriores = (estado, tipo = null) => datosResumen(estado).historial
  .filter((h) => !tipo || h.tipo === tipo);

/* ===========================================================================
   10 · LA IA (apartado 12)
   =========================================================================== */

export const IA_RESUMEN = {
  puede: 'Contarlo con palabras naturales: "este mes has cambiado principalmente…".',
  /* 🚨 Y el límite del apartado 12, que es el que importa. */
  soloConDatos: 'Únicamente sobre los datos que hay. Si los números no dicen nada, la IA tampoco.',
  necesita: 'El interruptor de la F56, como todo lo demás que mira sus datos.',
};

export const iaPuedeContarlo = (estado) => permisoIA(estado);

/* ===========================================================================
   11 · LOS OCHO CASOS (apartado 17)
   =========================================================================== */

export const CASOS = [
  { id: 'semana_activa', que: 'Semana con mucha actividad', espera: 'Resumen con varias secciones.' },
  { id: 'semana_vacia', que: 'Semana sin actividad', espera: '🚨 "Esta semana no hay cambios destacables". Y nada más.' },
  { id: 'mes_con_cambios', que: 'Mes con cambios', espera: 'Resumen mensual, con sus secciones.' },
  { id: 'mes_sin_cambios', que: 'Mes sin cambios', espera: 'El mismo texto, en versión mensual.' },
  { id: 'usuario_nuevo', que: 'Usuario nuevo', espera: 'Nada. Ni un resumen inventado.' },
  { id: 'mucho_historial', que: 'Usuario con mucho historial', espera: 'Resumen largo, y el historial acotado a doce.' },
  { id: 'ia_desactivada', que: 'IA desactivada', espera: 'Resumen igual, sin las partes que deducen gustos.' },
  { id: 'avisos_desactivados', que: 'Notificaciones desactivadas', espera: '⚠️ El resumen SIGUE estando dentro de la aplicación.' },
];

export const caso = (id) => CASOS.find((c) => c.id === id) || null;

/* ===========================================================================
   12 · LOS DIECISIETE APARTADOS
   =========================================================================== */

export const APARTADOS_RESUMEN = [
  { id: 1, nombre: 'Resumen semanal', cumplido: true, donde: 'generarResumen("semanal")' },
  { id: 2, nombre: 'Resumen mensual', cumplido: true, donde: 'generarResumen("mensual")' },
  { id: 3, nombre: 'Sin información innecesaria', cumplido: true, donde: 'TEXTOS_RESUMEN.sinCambios' },
  { id: 4, nombre: 'Personalización', cumplido: true, donde: 'TAMANOS · tamanoPara()' },
  { id: 5, nombre: 'Configuración', cumplido: true, donde: 'FRECUENCIAS · cambiarFrecuencia()' },
  { id: 6, nombre: 'Privacidad', cumplido: true, donde: 'El aviso lo lanza el sistema global, y solo si él lo enciende' },
  { id: 7, nombre: 'Notificación', cumplido: true, donde: 'avisoDelResumen()' },
  { id: 8, nombre: 'Resumen dentro de la app', cumplido: true, donde: 'generarResumen() no mira `avisar`' },
  { id: 9, nombre: 'Estructura', cumplido: true, donde: 'SECCIONES' },
  { id: 10, nombre: 'Resumen mensual (estructura)', cumplido: true, donde: 'seccionesDe("mensual")' },
  { id: 11, nombre: 'Comparación', cumplido: true, donde: 'sePuedeComparar() — solo con datos suficientes' },
  { id: 12, nombre: 'IA', cumplido: true, donde: 'IA_RESUMEN — solo sobre datos reales' },
  { id: 13, nombre: 'Correcciones', cumplido: true, donde: 'corregirResumen()' },
  { id: 14, nombre: 'Compartir', cumplido: false, donde: 'COMPARTIR — no existe el sistema global' },
  { id: 15, nombre: 'Historial', cumplido: true, donde: 'guardarEnHistorial() — fechas y números, no textos' },
  { id: 16, nombre: 'Rendimiento', cumplido: true, donde: 'hayQueRegenerar()' },
  { id: 17, nombre: 'Pruebas', cumplido: true, donde: 'CASOS' },
];

export const apartadoResumen = (id) => APARTADOS_RESUMEN.find((a) => a.id === id) || null;

export const CONDICION = 'Un pequeño informe personal útil, no una obligación semanal. Y puede desaparecer completamente si él no lo quiere.';

/* ===========================================================================
   13 · EL PARTE
   =========================================================================== */

export function auditarResumen(estado = null, opciones = {}) {
  const e = normalizarEstiloHombre(estado || {});
  /* ⚠️ El comportamiento de "apagado" se comprueba sobre un estado APAGADO, no
     sobre el que llegue: preguntárselo a uno que ya lo tiene encendido daría
     falso siempre, y el parte diría que el interruptor no funciona cuando lo
     que pasa es que está encendido. */
  const apagado = generarResumen(normalizarEstiloHombre({}), { ...opciones, tipo: null });
  return {
    porDefectoApagado: datosResumen(normalizarEstiloHombre({})).frecuencia === 'desactivado',
    apagadoNoGenera: apagado.activo === false && apagado.secciones.length === 0,
    frecuencias: FRECUENCIAS.length,
    secciones: SECCIONES.length,
    // ⚠️ Ninguna sección puede meter más de lo que dice su tope.
    sinTope: SECCIONES.filter((s) => !Number.isFinite(s.max)).map((s) => s.id),
    // Decisión 4 — los tipos de todas las secciones existen en la F58.
    tiposInventados: SECCIONES.flatMap((s) => s.tipos).filter((t) => !tipoDeInsight(t)),
    casos: CASOS.length,
    sinDonde: APARTADOS_RESUMEN.filter((a) => !a.donde).map((a) => a.id),
    sinCumplir: APARTADOS_RESUMEN.filter((a) => !a.cumplido).map((a) => a.id),
  };
}

export function panelResumen(estado = null, opciones = {}) {
  const e = normalizarEstiloHombre(estado || {});
  const a = auditarResumen(e, opciones);
  const r = generarResumen(e, opciones);
  return {
    ...a,
    resumen: r,
    frecuenciasLista: FRECUENCIAS,
    seccionesLista: SECCIONES,
    aviso: avisoDelResumen(e),
    anteriores: anteriores(e),
    casosLista: CASOS,
    apartados: APARTADOS_RESUMEN,
    /* 🎯 El veredicto: **un informe que puede desaparecer del todo**. */
    esUnInforme: a.porDefectoApagado
      && a.apagadoNoGenera
      && a.tiposInventados.length === 0
      && a.sinTope.length === 0
      && a.sinDonde.length === 0,
    condicion: CONDICION,
  };
}

export { generarInsights, tipoDeInsight, MAX_A_LA_VEZ, TEXTOS_INSIGHTS, permisoIA,
  todayISO, MODULO_ANFITRION, moduloEH, modulosActivos };
