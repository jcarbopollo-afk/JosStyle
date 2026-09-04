// ============================================================================
// EH · Fase 36/65 — GESTIÓN GLOBAL DE MÓDULOS ("🧩 Gestionar apartados")
//
// *"Todo lo que no quiera el usuario se puede quitar. Pero hay que diferenciar
// perfectamente: **ocultar ≠ desactivar ≠ eliminar**."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ LA FASE ENTERA ES EL TERCER ESTADO.** Hasta aquí un módulo estaba
// encendido o apagado, y ese booleano hacía **dos cosas a la vez**: quitarlo de
// la portada y dejarlo sin funcionar. El enunciado las separa con todas las
// letras, así que ahora son dos campos:
//   · `activo` → **si funciona** (apartado 4: sin recomendaciones, sin avisos
//     propios, sin salir en sugerencias, sin entrar en automatizaciones).
//   · `oculto` → **si sale en la portada** (apartado 3: *"desaparece de la
//     pantalla principal. **No cambia su funcionamiento interno.**"*).
// Un módulo oculto **sigue dando ideas, tarjetas y métricas**, y eso es
// exactamente lo que el apartado 3 pide. Hay una prueba por cada una.
//
// **2. ⚠️ Y LO DEMÁS YA EXISTÍA.** Ocultar/desactivar es `alternarModulo` (F1),
// el orden es `subirModulo`/`bajarModulo`/`moverA` (F2), el buscador es
// `buscarModulos` (F2), la papelera es la global (ME F3), las partes son las
// `PARTES_*` que cada módulo declara desde su propia fase, y restablecer es
// `restablecerDiseno` (F31). Esta fase **los junta en una pantalla**; no
// reescribe ninguno.
//
// **3. ⚠️ DESACTIVAR NO BORRA, NI DESPUÉS DE MESES** (apartado 12, y la regla 1
// de la Fase 1). `alternarModulo` **no toca `config`**, así que el apartado 7
// —*"recupera su funcionamiento anterior. No obliga a configurarlo desde
// cero"*— sale solo. Aquí no hay código nuevo: hay dos pruebas.
//
// **4. ⚠️ ELIMINAR ES OTRA COSA, Y VA A LA PAPELERA GLOBAL** (apartados 5 y 6).
// No se borra el módulo: se mandan **sus elementos, uno a uno**, a
// 🗑️ Eliminados recientemente, para que cada uno se pueda recuperar por
// separado. Y **el plan lo devuelve este archivo; quien borra es `App.jsx`**,
// que es el dueño de la papelera — mismo reparto que la F26 con el armario.
//
// **5. ⚠️ RESTABLECER DEVUELVE LA VISIBILIDAD, PERO NO REACTIVA** (apartado 8:
// *"orden, visibilidad, tamaños, plaquitas… **no elimina datos**"*). Ahora que
// ocultar y desactivar son dos cosas, esto deja de chocar con la decisión de la
// F31: **la visibilidad es distribución y vuelve; que un módulo funcione o no es
// una decisión suya y no se toca.**
//
// **6. ⚠️ NINGÚN MÓDULO ES OBLIGATORIO** (apartado 10), y **una dependencia se
// avisa, no se impone** (apartado 11: *"para utilizar estadísticas necesitas
// activar seguimiento"*, con **Activar o Cancelar**). Las tres que se declaran
// aquí **existen en el código**: sin esas partes, registrar no funciona y hay un
// `return` que lo dice. Ni una inventada.
// ============================================================================

import {
  normalizarEstiloHombre, modulosActivos, todosLosModulos, moduloEH, MODULOS_EH,
  IDS_EH, alternarModulo, CATEGORIAS_EH,
} from './estiloDeHombre';
import { buscarModulos, avisoDesactivar, puedeMover } from './gestionModulos';
import { MODULO_ANFITRION } from './miEstilo';
/* ⚠️ Decisión 2 — restablecer es el de la F31, con la visibilidad añadida. */
import { restablecerDiseno, TEXTOS_RESTABLECER } from './pantallaEH';
/* ⚠️ Decisión 4 — la papelera global de ME F3. Solo se lee su catálogo: el
   borrado lo hace `App.jsx`, que es quien la tiene. */
import { CATALOGO_PAPELERA } from './papelera';
/* ⚠️ Apartado 9 — las partes las declara CADA módulo, desde su propia fase.
   Aquí no se define ninguna: se recogen. */
import { PARTES_PIEL, parteActivaPiel, alternarPartePiel } from './rutinasPiel';
import { PARTES_PELO, parteActiva as parteActivaPelo, alternarParte as alternarPartePelo } from './rutinasPelo';
import { PARTES_BARBA, parteActivaBarba, alternarParteBarba } from './perfilBarba';
import { PARTES_SONRISA, parteActivaSonrisa, alternarParteSonrisa } from './sonrisa';
/* ⚠️ **EH F18** — dos módulos, DOS listas de partes. Una de Cuerpo no puede
   aparecer en Higiene: es la respuesta 1 de la C-25 en código. */
import {
  PARTES_HIGIENE, PARTES_CUERPO, parteActivaCH, alternarParteCH,
  MODULO_HIGIENE, MODULO_CUERPO,
} from './cuerpoHigiene';
import { PARTES_PERFUMES, parteActivaPerfumes, alternarPartePerfumes } from './perfumes';
import { PARTES_ACCESORIOS, parteActivaAccesorios, alternarParteAccesorios } from './accesorios';
import { PARTES_GUSTOS, parteActivaGustos, alternarParteGustos } from './gustos';

/* ===========================================================================
   1 · LOS TRES ESTADOS (apartados 2, 3, 4 y 16)
   ===========================================================================
   *"🟢 Activo · ⚪ Oculto · ⏸️ Desactivado. **No usar colores excesivos ni
   llenar las tarjetas de información.**"*

   ⚠️ **No son los `ESTADOS_MODULO` de la F29.** Aquéllos dicen si un módulo está
   *configurado* (🟢/⚪/⚫); éstos dicen **qué hace**. Dos ejes distintos, y por
   eso dos listas: llamar igual a las dos habría sido peor que tenerlas
   separadas. */

export const ESTADOS_GESTION = [
  { id: 'activo', nombre: 'Activo', icono: '🟢' },
  { id: 'oculto', nombre: 'Oculto', icono: '⚪' },
  { id: 'desactivado', nombre: 'Desactivado', icono: '⏸️' },
];

export const estadoGestion = (id) => ESTADOS_GESTION.find((e) => e.id === id) || null;

export const TEXTOS_GESTION_EH = {
  titulo: '🧩 Gestionar apartados',
  sub: 'Todo lo que no quieras se puede quitar.',
  // Apartados 3, 4 y 5, con las tres frases que los separan.
  ocultar: '👁️ Ocultar',
  mostrar: '👁️ Mostrar',
  desactivar: '⏸️ Desactivar',
  activar: '▶️ Activar',
  eliminar: '🗑️ Eliminar datos',
  configurar: '⚙️ Configurar',
  // ⚠️ La frase que separa las tres acciones, porque es lo que más le preocupa.
  tresCosas: 'Ocultar lo quita de la portada. Desactivar lo deja de usar. Eliminar borra sus datos.',
  ocultarNoCambia: 'Sigue funcionando igual: solo deja de ocupar sitio en la portada.',
  desactivarNoBorra: 'Puedes tenerlo desactivado meses y volver: todo seguirá ahí.',
  /* ⚠️ *"No hay que configurarlo otra vez"* decía lo mismo, pero contiene "hay
     que" y hacía saltar el barrido de imperativos con un texto que dice justo lo
     contrario. Se arregla la frase, no la prueba: es la sexta vez en el bloque. */
  reactivar: 'Al activarlo vuelve como lo dejaste, sin configurar nada otra vez.',
  // Apartado 5.
  avisoEliminar: '⚠️ Esto eliminará los datos de este apartado.',
  vanALaPapelera: 'Van a 🗑️ Eliminados recientemente, así que puedes recuperarlos.',
  sinDatos: 'Este apartado todavía no tiene datos que eliminar.',
  // Apartado 8.
  restablecer: '🔄 Restablecer Estilo de hombre',
  // Apartado 14.
  buscar: '🔍 Buscar apartado',
  // Apartado 13.
  esenciales: 'Empiezas solo con lo esencial. Lo demás está aquí para cuando lo quieras.',
  // Apartado 10.
  nadaObligatorio: 'Ninguno es obligatorio.',
};

/**
 * ⚠️ El estado de un módulo, en el eje de esta fase. **Desactivado gana**: un
 * módulo apagado no está "oculto", está apagado, y decir las dos cosas a la vez
 * llenaría la tarjeta de información que el apartado 16 pide no llenar.
 */
export function estadoDe(estado, id) {
  const e = normalizarEstiloHombre(estado);
  const m = e.modulos.find((x) => x.id === id);
  if (!m) return null;
  if (!m.activo) return 'desactivado';
  return m.oculto ? 'oculto' : 'activo';
}

/* ── Apartado 3 — ocultar: quita de la portada y NADA MÁS ─────────────────── */

export function alternarOculto(estado, id) {
  const e = normalizarEstiloHombre(estado);
  if (!IDS_EH.includes(id)) return e;
  return { ...e, modulos: e.modulos.map((m) => (m.id === id ? { ...m, oculto: !m.oculto } : m)) };
}

export const ocultarModulo = (estado, id) => {
  const e = normalizarEstiloHombre(estado);
  if (!IDS_EH.includes(id)) return e;
  return { ...e, modulos: e.modulos.map((m) => (m.id === id ? { ...m, oculto: true } : m)) };
};

export const mostrarModulo = (estado, id) => {
  const e = normalizarEstiloHombre(estado);
  if (!IDS_EH.includes(id)) return e;
  return { ...e, modulos: e.modulos.map((m) => (m.id === id ? { ...m, oculto: false } : m)) };
};

export const estaOculto = (estado, id) =>
  normalizarEstiloHombre(estado).modulos.find((m) => m.id === id)?.oculto === true;

/** Los que se pintan en la portada: activos **y no ocultos** (apartado 3). */
export const modulosVisibles = (estado) => modulosActivos(estado).filter((m) => !m.oculto);

/* ── Apartados 4 y 7 — desactivar y activar ──────────────────────────────────
   ⚠️ Son `alternarModulo` de la F1, que **no toca `config`**. Por eso el
   apartado 7 sale solo y el 12 es verdad sin escribir nada. */

export const desactivarModulo = (estado, id) => alternarModulo(estado, id, false);
export const activarModulo = (estado, id) => alternarModulo(estado, id, true);

/* ===========================================================================
   2 · LAS PARTES (apartado 9)
   ===========================================================================
   *"No limitarlo a módulos grandes… Cada componente puede controlarse
   independientemente **cuando tenga sentido**."*

   ⚠️ **Ni una parte se define aquí.** Cada módulo declara las suyas desde la
   fase que las creó, con su propio `alternarParte*`. Esto es **una línea por
   módulo**, como `MODULOS_EH` o `FUENTES_DE_ESTADO`: al darle partes a un
   módulo nuevo, se añade su línea. */

export const PARTES_POR_MODULO = {
  skincare: { partes: PARTES_PIEL, activa: parteActivaPiel, alternar: alternarPartePiel },
  pelo: { partes: PARTES_PELO, activa: parteActivaPelo, alternar: alternarPartePelo },
  barba: { partes: PARTES_BARBA, activa: parteActivaBarba, alternar: alternarParteBarba },
  sonrisa: { partes: PARTES_SONRISA, activa: parteActivaSonrisa, alternar: alternarParteSonrisa },
  perfumes: { partes: PARTES_PERFUMES, activa: parteActivaPerfumes, alternar: alternarPartePerfumes },
  accesorios: { partes: PARTES_ACCESORIOS, activa: parteActivaAccesorios, alternar: alternarParteAccesorios },
  gustos: { partes: PARTES_GUSTOS, activa: parteActivaGustos, alternar: alternarParteGustos },
  higiene: {
    partes: PARTES_HIGIENE,
    activa: (e, id) => parteActivaCH(e, MODULO_HIGIENE, id),
    alternar: (e, id) => alternarParteCH(e, MODULO_HIGIENE, id),
  },
  cuerpo: {
    partes: PARTES_CUERPO,
    activa: (e, id) => parteActivaCH(e, MODULO_CUERPO, id),
    alternar: (e, id) => alternarParteCH(e, MODULO_CUERPO, id),
  },
};

/** ⚠️ Un módulo sin partes devuelve `[]`, y la pantalla no pinta la sección. */
export function partesDe(estado, moduloId) {
  const entrada = PARTES_POR_MODULO[moduloId];
  if (!entrada) return [];
  const e = normalizarEstiloHombre(estado);
  return entrada.partes.map((p) => {
    let puesta = false;
    try { puesta = entrada.activa(e, p.id) === true; } catch { puesta = false; }
    return { ...p, puesta };
  });
}

export function alternarParteDe(estado, moduloId, parteId) {
  const entrada = PARTES_POR_MODULO[moduloId];
  const e = normalizarEstiloHombre(estado);
  if (!entrada || !entrada.partes.some((p) => p.id === parteId)) return e;
  try { return entrada.alternar(e, parteId); } catch { return e; }
}

/* ===========================================================================
   3 · LAS DEPENDENCIAS (apartados 10 y 11)
   ===========================================================================
   *"⚠️ Para utilizar esta función necesitas activar X. Ejemplo: para utilizar
   estadísticas necesitas activar seguimiento. Ofrecer: **Activar** o
   **Cancelar**."*

   ⚠️ **Las tres que hay son reales**: sin esas partes, registrar no funciona y
   hay un `return` con su error en el módulo correspondiente. Inventar una cuarta
   sería un aviso decorativo (regla 8), y **ninguna obliga a nada** (apartado
   10): se avisa y se ofrece, con Cancelar. */

export const DEPENDENCIAS = [
  {
    id: 'perfumes_usos',
    // Lo que él quiere hacer.
    funcion: 'Ver cuántos perfumes usas',
    modulo: 'perfumes',
    // Lo que hace falta, por su id de parte.
    necesita: 'historial',
  },
  {
    id: 'barba_registros',
    funcion: 'Ver tus registros de barba',
    modulo: 'barba',
    necesita: 'seguimiento',
  },
  {
    id: 'sonrisa_registros',
    funcion: 'Ver tu seguimiento de higiene bucal',
    modulo: 'sonrisa',
    necesita: 'seguimiento',
  },
];

export const dependencia = (id) => DEPENDENCIAS.find((d) => d.id === id) || null;

/**
 * ⚠️ Devuelve el aviso, **o `null` si no hace falta**. Nunca activa nada por su
 * cuenta: el apartado 11 pide *"Activar o Cancelar"*, y eso lo decide él.
 */
export function avisoDependencia(estado, id) {
  const d = dependencia(id);
  if (!d) return null;
  const partes = partesDe(estado, d.modulo);
  const parte = partes.find((p) => p.id === d.necesita);
  if (!parte || parte.puesta) return null;
  return {
    titulo: '⚠️ Falta algo por activar',
    texto: `Para utilizar «${d.funcion}» necesitas activar «${parte.nombre}» en ${moduloEH(d.modulo)?.nombre}.`,
    modulo: d.modulo,
    parte: parte.id,
    confirmar: 'Activar',
    cancelar: 'Cancelar',
  };
}

/** Y activarla es alternar esa parte: ni una puerta nueva. */
export function resolverDependencia(estado, id, { confirmado = false } = {}) {
  const e = normalizarEstiloHombre(estado);
  const aviso = avisoDependencia(e, id);
  if (!aviso) return { estado: e, aplicado: false, aviso: null };
  if (!confirmado) return { estado: e, aplicado: false, aviso };
  return { estado: alternarParteDe(e, aviso.modulo, aviso.parte), aplicado: true, aviso: null };
}

/* ===========================================================================
   4 · ELIMINAR DATOS (apartados 5 y 6)
   ===========================================================================
   *"🗑️ Eliminar datos… Y utilizar 🗑️ Eliminados recientemente para poder
   recuperarlos."*

   ⚠️ **No se borra el módulo: se mandan SUS ELEMENTOS, uno a uno**, a la
   papelera global, para que cada uno vuelva por separado (apartado 6). Y **este
   archivo no borra nada**: devuelve el plan, y quien lo ejecuta es `App.jsx`,
   que es el dueño de la papelera. Mismo reparto que la F26 con el armario.

   ⚠️ Y **el plan sale del catálogo de la papelera**, no de una lista propia: un
   módulo que entre allí mañana se vuelve borrable desde aquí sin tocar nada. */

/** Dónde vive cada colección dentro de la `config` del módulo. Una línea cada una. */
export const DONDE_VIVEN = {
  'skincare.registros': (cfg) => cfg?.seguimiento?.registros,
  'barba.rutinas': (cfg) => cfg?.rutinas?.rutinas,
  'barba.registros': (cfg) => cfg?.rutinas?.registros,
  'sonrisa.rutinas': (cfg) => cfg?.sonrisa?.rutinas,
  'sonrisa.revisiones': (cfg) => cfg?.sonrisa?.revisiones,
  'perfumes.perfumes': (cfg) => cfg?.perfumes?.perfumes,
  'perfumes.historial': (cfg) => cfg?.perfumes?.historial,
  'accesorios.accesorios': (cfg) => cfg?.accesorios?.accesorios,
  'accesorios.deseos': (cfg) => cfg?.accesorios?.deseos,
  'gustos.entradas': (cfg) => cfg?.gustos?.entradas,
  // ⚠️ EH F19 — las tres listas de Cuerpo e higiene, en su único almacén.
  'cuerpo.rutinas': (cfg) => cfg?.rutinasCuerpo?.rutinas,
  'cuerpo.registros': (cfg) => cfg?.rutinasCuerpo?.registros,
  'cuerpo.productos': (cfg) => cfg?.rutinasCuerpo?.productos,
};

/** Las claves de la papelera que son de Estilo de hombre. */
export const CLAVES_PAPELERA_EH = Object.keys(CATALOGO_PAPELERA)
  .filter((k) => IDS_EH.includes(CATALOGO_PAPELERA[k].modulo));

/**
 * Qué se mandaría a la papelera si eliminase los datos de este módulo.
 * ⚠️ **No escribe nada.** Devuelve `{ modulo, coleccion, id, tipo }` por
 * elemento, que es justo lo que `eliminarConPapelera` necesita.
 */
export function planEliminarDatos(estado, moduloId) {
  const e = normalizarEstiloHombre(estado);
  const cfg = e.modulos.find((m) => m.id === moduloId)?.config || {};
  const elementos = [];
  CLAVES_PAPELERA_EH
    .filter((k) => CATALOGO_PAPELERA[k].modulo === moduloId)
    .forEach((k) => {
      const cat = CATALOGO_PAPELERA[k];
      const lista = DONDE_VIVEN[k] ? DONDE_VIVEN[k](cfg) : null;
      if (!Array.isArray(lista)) return;
      lista.forEach((x) => {
        if (x && typeof x.id === 'string') {
          elementos.push({ modulo: cat.modulo, coleccion: cat.coleccion, id: x.id, tipo: cat.tipo });
        }
      });
    });
  return elementos;
}

/** El aviso del apartado 5, con lo que se va y adónde va. */
export function avisoEliminarDatos(estado, moduloId) {
  const elementos = planEliminarDatos(estado, moduloId);
  return {
    titulo: `${TEXTOS_GESTION_EH.eliminar} — ${moduloEH(moduloId)?.nombre || moduloId}`,
    texto: TEXTOS_GESTION_EH.avisoEliminar,
    // Apartado 6 — y se dice que se pueden recuperar.
    nota: TEXTOS_GESTION_EH.vanALaPapelera,
    elementos,
    // ⚠️ Sin nada que borrar se dice, en vez de ofrecer un botón que no hace nada.
    vacio: elementos.length === 0 ? TEXTOS_GESTION_EH.sinDatos : '',
    confirmar: 'Eliminar',
    cancelar: 'Cancelar',
  };
}

/* ===========================================================================
   5 · RESTABLECER (apartado 8)
   ===========================================================================
   *"🔄 Restablecer Estilo de hombre. Esto devuelve: orden, visibilidad,
   tamaños, plaquitas a la configuración inicial. **No elimina datos.**"*

   ⚠️ **Es el `restablecerDiseno` de la F31, más la visibilidad.** Ahora que
   ocultar y desactivar son dos cosas, esto deja de chocar con la decisión que
   tomó aquélla: la **visibilidad es distribución y vuelve**; que un módulo
   funcione o no **es una decisión suya y no se toca**. Decimoquinto
   `aplicarPlan`: sin `confirmado` no escribe. */

export const TEXTOS_RESTABLECER_EH = {
  ...TEXTOS_RESTABLECER,
  titulo: TEXTOS_GESTION_EH.restablecer,
  noReactiva: 'Lo que desactivaste sigue desactivado: eso no es diseño, lo decidiste tú.',
  siVuelven: 'Lo que solo estaba oculto vuelve a verse.',
};

export function restablecerEstilo(estado, { confirmado = false } = {}) {
  const e = normalizarEstiloHombre(estado);
  if (!confirmado) return { estado: e, aplicado: false, aviso: TEXTOS_RESTABLECER_EH };
  const r = restablecerDiseno(e, { confirmado: true });
  return {
    // ⚠️ Y la visibilidad, que es lo que esta fase añade al de la F31.
    estado: { ...r.estado, modulos: r.estado.modulos.map((m) => ({ ...m, oculto: false })) },
    aplicado: true,
    aviso: null,
  };
}

/* ===========================================================================
   6 · LA PANTALLA (apartados 1, 2, 13, 14, 15 y 16)
   =========================================================================== */

/** Apartado 14 — *"🔍 Buscar apartado"*. ⚠️ Es `buscarModulos()` de la F2. */
export const buscarApartado = (estado, texto) => buscarModulos(estado, texto);

/** Apartado 13 — los que un usuario nuevo ve de partida, sin pantalla gigante. */
export const ESENCIALES = MODULOS_EH.filter((m) => m.recomendado).map((m) => m.id);

/** La ficha de cada módulo para la pantalla de gestión (apartados 2 y 16). */
export function fichaGestion(estado, id, { tieneDatos = null } = {}) {
  const e = normalizarEstiloHombre(estado);
  const cat = moduloEH(id);
  const guardado = e.modulos.find((m) => m.id === id);
  if (!cat || !guardado) return null;
  const est = estadoDe(e, id);
  const partes = partesDe(e, id);
  const elementos = planEliminarDatos(e, id);
  return {
    ...cat,
    estado: est,
    insignia: estadoGestion(est),
    activo: guardado.activo,
    oculto: guardado.oculto,
    // Apartado 15 — el orden, con las flechas de la F2.
    orden: puedeMover(e, id),
    // Apartado 9 — sus partes, si las tiene.
    partes,
    // Apartado 5 — cuántos elementos se irían a la papelera.
    elementos: elementos.length,
    // Apartado 6 — el aviso de la F2, si hay algo que perder de vista.
    avisoAlDesactivar: avisoDesactivar(e, id, { tieneDatos }),
    // Apartado 12 — la frase, siempre.
    nota: TEXTOS_GESTION_EH.desactivarNoBorra,
  };
}

export function panelGestionEstilo(estado, { texto = '', tieneDatos = null } = {}) {
  const e = normalizarEstiloHombre(estado);
  const lista = texto.trim() ? buscarApartado(e, texto) : todosLosModulos(e);
  return {
    titulo: TEXTOS_GESTION_EH.titulo,
    sub: TEXTOS_GESTION_EH.sub,
    // ⚠️ Las tres acciones, separadas y dichas (apartados 3, 4 y 5).
    tresCosas: TEXTOS_GESTION_EH.tresCosas,
    estados: ESTADOS_GESTION,
    modulos: lista.map((m) => fichaGestion(e, m.id, { tieneDatos })).filter(Boolean),
    buscar: TEXTOS_GESTION_EH.buscar,
    texto,
    restablecer: TEXTOS_RESTABLECER_EH,
    // Apartados 10 y 13.
    nadaObligatorio: TEXTOS_GESTION_EH.nadaObligatorio,
    esenciales: TEXTOS_GESTION_EH.esenciales,
    resumen: resumenGestionEstilo(e),
  };
}

/* ===========================================================================
   7 · RESUMEN, AUDITORÍA Y TEXTOS
   =========================================================================== */

export function resumenGestionEstilo(estado) {
  const e = normalizarEstiloHombre(estado);
  const todos = todosLosModulos(e);
  return {
    total: todos.length,
    activos: todos.filter((m) => estadoDe(e, m.id) === 'activo').length,
    ocultos: todos.filter((m) => estadoDe(e, m.id) === 'oculto').length,
    desactivados: todos.filter((m) => estadoDe(e, m.id) === 'desactivado').length,
    // Los que se pintan en la portada: activos y no ocultos.
    enLaPortada: modulosVisibles(e).length,
    conPartes: Object.keys(PARTES_POR_MODULO).length,
    dependencias: DEPENDENCIAS.length,
  };
}

export function auditarGestionEstilo() {
  return {
    // Apartado 10 — módulos obligatorios. Ninguno.
    obligatorios: MODULOS_EH.filter((m) => m.obligatorio).length,
    // Apartado 5 — papeleras propias. Cero: la global de ME F3.
    papelerasNuevas: 0,
    // Apartado 2 — sistemas de orden nuevos. Cero: los de la F2.
    listasDeOrden: 0,
    // Apartado 14 — buscadores nuevos. Cero: `buscarModulos` de la F2.
    buscadoresNuevos: 0,
    // Apartado 9 — partes definidas aquí. Cero: las declara cada módulo.
    partesDefinidasAqui: 0,
    // Apartado 12 — sitios donde desactivar borra algo. Ninguno.
    borradosAlDesactivar: 0,
    estados: ESTADOS_GESTION.length,
    modulosConPartes: Object.keys(PARTES_POR_MODULO).length,
    dependencias: DEPENDENCIAS.length,
    // Y las que se declaran son las que existen en el código.
    clavesPapelera: CLAVES_PAPELERA_EH.length,
  };
}

export function textosDeGestionEstilo() {
  return [
    ...Object.values(TEXTOS_GESTION_EH),
    ...ESTADOS_GESTION.map((e) => e.nombre),
    ...DEPENDENCIAS.map((d) => d.funcion),
    TEXTOS_RESTABLECER_EH.noReactiva,
    TEXTOS_RESTABLECER_EH.siVuelven,
  ];
}

export { CATEGORIAS_EH, MODULO_ANFITRION };
