// ============================================================================
// EH · Fase 18/65 — CUERPO E HIGIENE MASCULINA: CONFIGURACIÓN Y PERFIL
//
// *"Debe ser mucho más sencillo que Skincare, porque no queremos llenar Estilo
// de hombre de funciones que no todo el mundo necesita."*
//
// ── LA DECISIÓN QUE DESBLOQUEÓ ESTA FASE ───────────────────────────────────
//
// 🚨 **Estuvo parada desde v1.67.0 por C-25**, y la resolvió Josué: la Fase 2
// pone *Higiene* y *Cuidado corporal* como **dos** módulos del catálogo, y las
// Fases 18 y 19 los tratan como **uno solo**. Contestó las tres preguntas:
//
//   1. **Dos apartados separados**, como escribió en la Fase 2.
//   2. ***Cuidado de manos* y *Cuidado de pies* son la Fase 22.** Aquí solo se
//      encienden.
//   3. **Se sigue llamando *Higiene***, no *Aseo*.
//
// Así que `MODULOS_EH` **no cambia** —siguen siendo dos líneas con sus dos
// interruptores—, y el apartado 17 de esta fase se cumple **literalmente**:
// *"puede quitar 🚿 Higiene diaria sin quitar 🧴 Cuidado corporal"*.
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ LAS SIETE CASILLAS SE REPARTEN, NO SE FUNDEN.** El apartado 1 lista
// siete cosas en una sola pantalla; con dos módulos, cada uno enseña **las
// suyas**. `PARTES_HIGIENE` y `PARTES_CUERPO` son **dos listas**, y hay una
// prueba de que ninguna casilla se queda sin módulo y ninguna está en las dos.
//
// **2. ⚠️ Y ESO CIERRA UN SOLAPE DEL PROPIO ENUNCIADO.** Su apartado 1 pone
// *Desodorante*, *Cuidado de manos* y *Cuidado de pies* como casillas sueltas,
// pero su apartado 3 las mete **dentro de "Higiene diaria"**. Con el reparto de
// arriba las cuatro son partes de `higiene` y no hay que elegir: la casilla es
// el interruptor, y `COSAS_DE_HIGIENE_DIARIA` es lo que se configura dentro.
//
// **3. ⚠️ AQUÍ NO SE PREGUNTA LO QUE YA SE SABE** (apartado 2, con esas
// palabras). Los aromas ya los declaró la F24 en el registro de la F4 **con
// `cuerpo` dentro de su `usan`**, justo previendo esto; `sinPerfume` lo declaró
// la F17 igual; y `sensibilidadPiel` está desde la F13. **Se leen, no se
// vuelven a preguntar** — cuarta vez que el registro evita una pregunta
// repetida antes de escribirla.
//
// **4. ⚠️ NI UN CATÁLOGO DE PRODUCTOS NUEVO** (apartado 15, con todas las
// letras: *"no crear «Catálogo corporal 2»"*). Es `motorProductos.js` (F17), y
// lo que se queda aquí son **sus categorías**. El catálogo global sigue vacío a
// propósito (D2-03).
//
// **5. ⚠️ NUNCA UN DIAGNÓSTICO** (apartado 7: *"no realizar diagnósticos"*). Se
// reutilizan `PALABRAS_CLINICAS` y `sinDiagnostico()` de la F13 —no una segunda
// lista— y hay una prueba que barre todos los textos. Esta fase habla de
// *higiene íntima* y de *rozaduras*, así que el barrido importa más que nunca:
// se pregunta **qué quiere cuidar**, no qué le pasa.
//
// **6. ⚠️ Y LO QUE ESTA FASE NO HACE**: rutinas, recomendaciones y seguimiento
// son la **F19**, y manos/uñas/pies son la **F22**. Aquí se deja la estructura y
// cada plaquita dice en qué fase llega, en vez de abrir una pantalla vacía
// (regla 8).
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { NIVELES_ESTILO } from './perfilEstilo';
import { leerDato } from './datosEstiloHombre';
import {
  NO_LO_SE, leerRespuesta, contestar, borrarRespuesta, leerCuestionario,
  preguntasVisibles, progresoVisible, contextoDelCuestionario,
} from './cuestionarios';
import { PALABRAS_CLINICAS, sinDiagnostico } from './perfilPiel';
import { CATALOGO_VACIO_PORQUE } from './motorProductos';
import { todayISO } from './helpers';

export const MODULO_HIGIENE = 'higiene';
export const MODULO_CUERPO = 'cuerpo';

/* ===========================================================================
   1 · LAS SIETE CASILLAS, REPARTIDAS (apartado 1 + C-25)
   ===========================================================================
   *"¿Qué quieres utilizar?"* — y con dos módulos, cada uno enseña las suyas.

   ⚠️ `deApartado1` marca las que salen en esa pantalla de bienvenida, igual que
   `deApartado2` en Barba (F21): **una casilla de "qué quieres utilizar" no es
   un interruptor de apartado**, y volver a elegir no puede apagar nada por la
   espalda.

   ⚠️ Y `enFase` dice **dónde se configura de verdad**: las de manos y pies
   llevan 22 porque Josué decidió que aquí solo se encienden. */

export const PARTES_HIGIENE = [
  { id: 'higieneDiaria', nombre: 'Higiene diaria', icono: '🚿', porDefecto: true, deApartado1: true, enFase: 18 },
  { id: 'desodorante', nombre: 'Desodorante', icono: '🧴', porDefecto: true, deApartado1: true, enFase: 18 },
  // ⚠️ C-25, respuesta 2 — la casilla enciende; la pantalla es la Fase 22.
  { id: 'manos', nombre: 'Cuidado de manos', icono: '🤲', porDefecto: true, deApartado1: true, enFase: 22 },
  { id: 'pies', nombre: 'Cuidado de pies', icono: '🦶', porDefecto: true, deApartado1: true, enFase: 22 },
  /* ⚠️ **F19, apartado 17** — *"desde Gestionar apartados se pueden desactivar
     independientemente: rutinas, recomendaciones, productos y seguimiento"*.
     No son casillas del apartado 1: son interruptores, y por eso `deApartado1`
     es `false` — volver a elegir "qué utilizo" no puede apagarlos por la
     espalda. Higiene no lleva `seguimiento`: esa casilla es del apartado 1 y la
     F18 la puso en Cuidado corporal, que es donde la escribió Josué. */
  { id: 'rutinas', nombre: 'Rutinas', icono: '📋', porDefecto: true, deApartado1: false, enFase: 19 },
  { id: 'recomendaciones', nombre: 'Recomendaciones', icono: '💡', porDefecto: true, deApartado1: false, enFase: 19 },
  { id: 'productos', nombre: 'Productos', icono: '🧴', porDefecto: true, deApartado1: false, enFase: 19 },
];

export const PARTES_CUERPO = [
  { id: 'cuidadoCorporal', nombre: 'Cuidado corporal', icono: '🧍', porDefecto: true, deApartado1: true, enFase: 18 },
  { id: 'especifico', nombre: 'Cuidado específico', icono: '🎯', porDefecto: true, deApartado1: true, enFase: 18 },
  // ⚠️ ☐ en el enunciado, no ☑️.
  { id: 'seguimiento', nombre: 'Seguimiento', icono: '📈', porDefecto: false, deApartado1: true, enFase: 19 },
  /* La rutina no es una casilla del apartado 1: es lo que construye la F19, y
     tiene su propio interruptor para que apagarla no apague el módulo entero. */
  { id: 'rutinas', nombre: 'Rutinas', icono: '📋', porDefecto: true, deApartado1: false, enFase: 19 },
  // ⚠️ F19, apartado 17 — los otros dos interruptores, con el mismo criterio.
  { id: 'recomendaciones', nombre: 'Recomendaciones', icono: '💡', porDefecto: true, deApartado1: false, enFase: 19 },
  { id: 'productos', nombre: 'Productos', icono: '🧴', porDefecto: true, deApartado1: false, enFase: 19 },
];

export const PARTES_DE = { [MODULO_HIGIENE]: PARTES_HIGIENE, [MODULO_CUERPO]: PARTES_CUERPO };
export const MODULOS_CH = [MODULO_HIGIENE, MODULO_CUERPO];
export const esModuloCH = (id) => MODULOS_CH.includes(id);
export const partesDeModulo = (moduloId) => PARTES_DE[moduloId] || [];
export const parteCH = (moduloId, id) => partesDeModulo(moduloId).find((p) => p.id === id) || null;

/**
 * ⚠️ Apartado 3 — lo que se configura **dentro** de "Higiene diaria". Es una
 * lista de cosas, no de interruptores: el interruptor es la casilla de arriba.
 * Sin esto, el desodorante estaría en dos sitios (ver decisión 2).
 */
export const COSAS_DE_HIGIENE_DIARIA = [
  { id: 'ducha', nombre: 'Ducha', icono: '🚿' },
  { id: 'corporal', nombre: 'Higiene corporal', icono: '🧼' },
  { id: 'intima', nombre: 'Higiene íntima', icono: '🩲' },
];

/* ===========================================================================
   2 · LAS LISTAS DEL ENUNCIADO (apartados 4, 5, 6, 8, 9 y 10)
   =========================================================================== */

/** Apartado 4 — *"¿Qué buscas principalmente?"* */
export const QUE_BUSCA = [
  { id: 'limpieza', nombre: 'Sensación de limpieza' },
  { id: 'olor', nombre: 'Olor agradable' },
  { id: 'hidratacion', nombre: 'Hidratación' },
  { id: 'piel', nombre: 'Cuidado de piel' },
  { id: 'rapidez', nombre: 'Rapidez' },
  { id: 'sencillos', nombre: 'Productos sencillos' },
  { id: 'premium', nombre: 'Productos premium' },
  { id: 'precio', nombre: 'Precio' },
  { id: 'otro', nombre: 'Otro' },
];

/** Apartado 5 — las categorías de producto. ⚠️ **Del motor de la F17**, no un catálogo. */
export const CATEGORIAS_PRODUCTO_CH = [
  { id: 'gel', nombre: 'Gel de ducha', icono: '🚿' },
  { id: 'crema', nombre: 'Crema corporal', icono: '🧴' },
  { id: 'jabon', nombre: 'Jabón', icono: '🧼' },
  { id: 'desodorante', nombre: 'Desodorante', icono: '🧴' },
  { id: 'otros', nombre: 'Otros', icono: '🧴' },
];

export const categoriaProductoCH = (id) => CATEGORIAS_PRODUCTO_CH.find((c) => c.id === id) || null;

/** Apartado 8 — *"¿Hay algo que quieras cuidar especialmente?"* */
export const NECESIDADES_CH = [
  { id: 'sequedad', nombre: 'Sequedad' },
  { id: 'hidratacion', nombre: 'Hidratación' },
  { id: 'olor', nombre: 'Olor' },
  { id: 'rozaduras', nombre: 'Rozaduras' },
  { id: 'sensible', nombre: 'Piel sensible' },
  { id: 'manos', nombre: 'Manos' },
  { id: 'pies', nombre: 'Pies' },
  { id: 'otro', nombre: 'Otro' },
];

/** Apartado 9 — cuánto tiempo quiere dedicarle. */
export const TIEMPOS_CH = [
  { id: 'muy_poco', nombre: 'Muy poco', minutos: 3 },
  { id: 'poco', nombre: 'Poco', minutos: 5 },
  { id: 'normal', nombre: 'Normal', minutos: 10 },
  { id: 'da_igual', nombre: 'No me importa', minutos: null },
];

/* ⚠️ Apartado 10 — *"mantener el sistema global"*. Son los de la F6: se
   importan, no se reescriben. Y *"no convertir la higiene básica en algo
   excesivamente complejo"*: el nivel solo abre más opciones. */
export const NIVELES_CH = NIVELES_ESTILO;

/* ===========================================================================
   3 · LAS PREGUNTAS (apartados 4 a 10)
   ===========================================================================
   ⚠️ Es un **array de preguntas** para `cuestionarios.js` (F7), no un motor
   nuevo. Y `cuando` recibe las respuestas y el contexto del módulo (F20). */

export const SECCIONES_CH = [
  { id: 'preferencias', nombre: 'Qué buscas', icono: '🎯' },
  { id: 'productos', nombre: 'Productos', icono: '🧴' },
  { id: 'piel', nombre: 'Tu piel', icono: '🧍' },
  { id: 'ritmo', nombre: 'Tu ritmo', icono: '⏱️' },
];

export const PREGUNTAS_CH = [
  {
    id: 'queBuscaCuerpo',
    seccion: 'preferencias',
    apartado: 4,
    titulo: '¿Qué buscas principalmente?',
    ayuda: 'Puedes marcar varias.',
    multiple: true,
    opciones: QUE_BUSCA,
  },
  {
    id: 'productosCuerpo',
    seccion: 'productos',
    apartado: 5,
    titulo: '¿Qué sueles usar?',
    ayuda: 'Opcional. Sirve para afinar las ideas más adelante.',
    multiple: true,
    opciones: CATEGORIAS_PRODUCTO_CH,
  },
  {
    id: 'necesidadesCuerpo',
    seccion: 'piel',
    apartado: 8,
    /* ⚠️ Decisión 5 — *"¿qué quieres cuidar?"*, nunca *"¿qué te pasa?"*. */
    titulo: '¿Hay algo que quieras cuidar especialmente?',
    ayuda: 'Opcional.',
    multiple: true,
    opciones: NECESIDADES_CH,
  },
  {
    id: 'tiempoCuerpo',
    seccion: 'ritmo',
    apartado: 9,
    titulo: '¿Cuánto tiempo quieres dedicarle?',
    opciones: TIEMPOS_CH,
  },
  {
    id: 'nivelCuerpo',
    seccion: 'ritmo',
    apartado: 10,
    titulo: '¿Cuánto quieres complicarte?',
    ayuda: 'El nivel solo abre más opciones. Ninguna es obligatoria.',
    opciones: NIVELES_CH,
  },
];

export const preguntaCH = (id) => PREGUNTAS_CH.find((p) => p.id === id) || null;
export const IDS_PREGUNTAS_CH = PREGUNTAS_CH.map((p) => p.id);

/*
 * ⚠️ **Decisión 3 — lo que NO se pregunta aquí porque ya está contestado.**
 * Cada línea dice el dato del registro de la F4 y **quién lo preguntó**. La
 * pantalla lo enseña con su origen y con dónde se cambia, en vez de repetirlo.
 */
export const YA_CONTESTADO = [
  { dato: 'aromasFavoritos', apartado: 6, donde: 'Perfumes', desde: 'EH F24' },
  { dato: 'aromasQueNoGustan', apartado: 6, donde: 'Perfumes', desde: 'EH F24' },
  { dato: 'sinPerfume', apartado: 6, donde: 'Skincare', desde: 'EH F17' },
  { dato: 'sensibilidadPiel', apartado: 7, donde: 'Skincare', desde: 'EH F13' },
];

/** Lo que ya sabemos, leído del registro. ⚠️ **No se copia**: se lee. */
export function loQueYaSabemosCH(estado, datosGlobales = {}) {
  const e = normalizarEstiloHombre(estado);
  return YA_CONTESTADO.map((x) => {
    const l = leerDato(e, x.dato, datosGlobales);
    return {
      ...x,
      tiene: l?.tiene === true,
      valor: l?.valor ?? null,
      nombre: l?.nombre || x.dato,
    };
  });
}

/* ===========================================================================
   4 · EL ALMACÉN (uno por módulo, porque son dos módulos)
   =========================================================================== */

export const DEFAULT_CH = (() => {
  const base = { ahoraNo: false, configurado: false, editado: null };
  return base;
})();

const partesPorDefecto = (moduloId) => {
  const partes = {};
  partesDeModulo(moduloId).forEach((p) => { partes[p.id] = p.porDefecto; });
  return partes;
};

/**
 * ⚠️ **Un normalizador por módulo, con SUS partes.** Una parte de Cuerpo no
 * puede colarse en Higiene ni al revés — es la lección de la F2 aplicada aquí:
 * lo que no está en el catálogo de ese módulo, no revive.
 */
export function normalizarCH(guardado, moduloId) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const partes = {};
  partesDeModulo(moduloId).forEach((p) => {
    partes[p.id] = typeof g.partes?.[p.id] === 'boolean' ? g.partes[p.id] : p.porDefecto;
  });
  const cosas = {};
  COSAS_DE_HIGIENE_DIARIA.forEach((c) => {
    cosas[c.id] = moduloId === MODULO_HIGIENE ? g.cosas?.[c.id] === true : false;
  });
  return {
    ahoraNo: g.ahoraNo === true,
    configurado: g.configurado === true,
    editado: typeof g.editado === 'string' ? g.editado : null,
    partes,
    // Solo Higiene guarda esto; en Cuerpo queda vacío y no estorba.
    cosas,
  };
}

export const datosCH = (estado, moduloId) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === moduloId);
  return normalizarCH(mod?.config?.cuerpoHigiene, moduloId);
};

const escribir = (estado, moduloId, datos) =>
  guardarConfig(estado, moduloId, { cuerpoHigiene: datos });

/* ===========================================================================
   5 · LA ENTRADA Y LAS PARTES (apartados 1, 2 y 17)
   =========================================================================== */

export const TEXTOS_CH = {
  [MODULO_HIGIENE]: {
    titulo: '🧼 Higiene',
    entrada: '¿Qué quieres utilizar?',
    sub: 'Lo del día a día: ducha, limpieza y desodorante.',
  },
  [MODULO_CUERPO]: {
    titulo: '🧍 Cuidado corporal',
    entrada: '¿Qué quieres utilizar?',
    sub: 'La piel de cuello para abajo: hidratación y lo que quieras cuidar.',
  },
  continuar: 'Continuar',
  ahoraNo: 'Ahora no',
  configurar: 'Configurar mi cuidado',
  saltar: 'Saltármelo',
  /* Apartado 2 — *"el formulario será opcional y podrá saltarse"*. */
  opcional: 'Todo esto es opcional. Puedes dejarlo y volver cuando quieras.',
  /* Apartado 1 — *"no mostrar posteriormente lo que no haya seleccionado"*. */
  soloLoTuyo: 'Solo verás lo que hayas marcado.',
  /* Apartado 2 — y lo que ya sabemos. */
  yaLoSabemos: 'Esto ya lo sabemos, no hace falta que lo repitas',
  /* ⚠️ C-25 y apartado 17 — los dos son independientes, y se dice. */
  sonDos: 'Higiene y Cuidado corporal son dos apartados. Puedes quitar uno y quedarte con el otro.',
  /* Apartado 10. */
  nivelSuave: 'El nivel solo abre más opciones. Nada se vuelve obligatorio.',
  /* Apartado 15 + D2-03. */
  catalogo: CATALOGO_VACIO_PORQUE,
  /* Decisión 6 — lo que llega en otra fase, dicho (regla 8). */
  enOtraFase: 'Esto llega más adelante.',
};

export const textoDeModulo = (moduloId) => TEXTOS_CH[moduloId] || TEXTOS_CH[MODULO_HIGIENE];

/** Apartado 1 — *"Ahora no"*, y no se le vuelve a plantar la pantalla. */
export const decirAhoraNoCH = (estado, moduloId) =>
  escribir(estado, moduloId, { ...datosCH(estado, moduloId), ahoraNo: true });

/** Terminó la pantalla de bienvenida. */
export const configurarCH = (estado, moduloId, { hoy = todayISO() } = {}) =>
  escribir(estado, moduloId, { ...datosCH(estado, moduloId), configurado: true, ahoraNo: false, editado: hoy });

export const parteActivaCH = (estado, moduloId, parteId) =>
  datosCH(estado, moduloId).partes[parteId] === true;

/**
 * ⚠️ Apartado 17 — *"cada componente debe ser independiente"*. Y la lección de
 * la F21: esto toca **una** casilla, nunca el interruptor del módulo.
 */
export function alternarParteCH(estado, moduloId, parteId) {
  if (!parteCH(moduloId, parteId)) return normalizarEstiloHombre(estado);
  const d = datosCH(estado, moduloId);
  return escribir(estado, moduloId, { ...d, partes: { ...d.partes, [parteId]: !d.partes[parteId] } });
}

/**
 * Elegir de golpe en la pantalla de bienvenida. ⚠️ **Solo toca las casillas del
 * apartado 1**: las que no salen ahí —las rutinas de la F19— se quedan como
 * estaban. Es `elegirPartes` de la F21, con su misma lección.
 */
export function elegirPartesCH(estado, moduloId, ids, { hoy = todayISO() } = {}) {
  const d = datosCH(estado, moduloId);
  const elegidas = Array.isArray(ids) ? ids : [];
  const partes = { ...d.partes };
  partesDeModulo(moduloId)
    .filter((p) => p.deApartado1)
    .forEach((p) => { partes[p.id] = elegidas.includes(p.id); });
  return escribir(estado, moduloId, { ...d, partes, configurado: true, ahoraNo: false, editado: hoy });
}

/** Apartado 3 — lo de dentro de "Higiene diaria". Solo en Higiene. */
export function alternarCosaHigiene(estado, cosaId) {
  if (!COSAS_DE_HIGIENE_DIARIA.some((c) => c.id === cosaId)) return normalizarEstiloHombre(estado);
  const d = datosCH(estado, MODULO_HIGIENE);
  return escribir(estado, MODULO_HIGIENE, { ...d, cosas: { ...d.cosas, [cosaId]: !d.cosas[cosaId] } });
}

export const ESTADOS_ENTRADA_CH = ['sin_configurar', 'ahora_no', 'configurado'];

export function estadoDeEntradaCH(estado, moduloId) {
  const d = datosCH(estado, moduloId);
  if (d.configurado) return 'configurado';
  return d.ahoraNo ? 'ahora_no' : 'sin_configurar';
}

/* ===========================================================================
   6 · EL CUESTIONARIO (apartados 2 y 4 a 10)
   ===========================================================================
   ⚠️ Las preguntas son **las mismas para los dos módulos** y se guardan en el
   registro compartido cuando toca: el motor de la F7 decide dónde va cada
   respuesta, no esta fase. El módulo que las hace es el que esté abierto. */

export const respuestaCH = (estado, moduloId, id, datosGlobales = {}) =>
  leerRespuesta(estado, moduloId, preguntaCH(id) || { id }, datosGlobales);

export const contestarCH = (estado, moduloId, id, valor, opts) =>
  contestar(estado, moduloId, preguntaCH(id) || { id, opciones: [] }, valor, opts);

export const borrarCH = (estado, moduloId, id, opts) =>
  borrarRespuesta(estado, moduloId, preguntaCH(id) || { id }, opts);

export const perfilCH = (estado, moduloId, datosGlobales = {}) =>
  leerCuestionario(estado, moduloId, PREGUNTAS_CH, datosGlobales);

const contextoDe = (estado, moduloId) => ({ partes: datosCH(estado, moduloId).partes, modulo: moduloId });

export const preguntasDeCH = (estado, moduloId, datosGlobales = {}) =>
  preguntasVisibles(estado, moduloId, PREGUNTAS_CH, datosGlobales, contextoDe(estado, moduloId));

export const progresoCH = (estado, moduloId, datosGlobales = {}) =>
  progresoVisible(estado, moduloId, PREGUNTAS_CH, datosGlobales, contextoDe(estado, moduloId));

export function seccionesDeCH(estado, moduloId, datosGlobales = {}) {
  const visibles = preguntasDeCH(estado, moduloId, datosGlobales);
  return SECCIONES_CH
    .map((s) => {
      /* ⚠️ La sección se busca **en el catálogo**, no en lo que devuelve el
         motor: `normalizarPregunta` se queda con lo que necesita para preguntar
         —título, opciones, `cuando`— y `seccion` es cosa de la pantalla. Mismo
         reparto que en `seccionesDeBarba` y `seccionesDePiel`; filtrar por
         `q.seccion` dejaba TODAS las secciones vacías. */
      const suyas = visibles.filter((q) => preguntaCH(q.id)?.seccion === s.id);
      return { ...s, preguntas: suyas, contestadas: suyas.filter((q) => q.contestada).length, total: suyas.length };
    })
    // Una sección sin preguntas visibles no se enseña vacía.
    .filter((s) => s.total > 0);
}

/**
 * El contexto para la F19 y las ideas. ⚠️ **No lleva nada que no sea suyo**: los
 * aromas y la sensibilidad se leen del registro cuando hagan falta, no se
 * copian aquí (decisión 3).
 */
export function contextoDeCuerpo(estado, moduloId, datosGlobales = {}) {
  const ctx = contextoDelCuestionario(estado, moduloId, PREGUNTAS_CH, datosGlobales);
  const val = (id) => {
    const r = respuestaCH(estado, moduloId, id, datosGlobales);
    return r.contestada && !r.noSabe ? r.valores : [];
  };
  const d = datosCH(estado, moduloId);
  return {
    ...ctx,
    modulo: moduloId,
    partes: d.partes,
    busca: val('queBuscaCuerpo'),
    productos: val('productosCuerpo'),
    necesidades: val('necesidadesCuerpo'),
    tiempo: val('tiempoCuerpo')[0] || null,
    minutos: TIEMPOS_CH.find((t) => t.id === val('tiempoCuerpo')[0])?.minutos ?? null,
    nivel: val('nivelCuerpo')[0] || null,
  };
}

/* ===========================================================================
   7 · LAS PLAQUITAS Y LO QUE LLEGA DESPUÉS (decisión 6)
   =========================================================================== */

export const PLAQUITAS_CH = {
  [MODULO_HIGIENE]: [
    { id: 'partes', nombre: 'Qué utilizo', icono: '☑️', fase: 18 },
    { id: 'perfil', nombre: 'Mi perfil', icono: '📝', fase: 18 },
    { id: 'rutina', nombre: 'Mi rutina', icono: '🚿', fase: 19 },
    // F19, apartado 8 — *"añadir: 💡 Recomendaciones"*.
    { id: 'recomendaciones', nombre: 'Recomendaciones', icono: '💡', fase: 19 },
    { id: 'manosPies', nombre: 'Manos, uñas y pies', icono: '🤲', fase: 22 },
  ],
  [MODULO_CUERPO]: [
    { id: 'partes', nombre: 'Qué utilizo', icono: '☑️', fase: 18 },
    { id: 'perfil', nombre: 'Mi perfil', icono: '📝', fase: 18 },
    { id: 'rutina', nombre: 'Mi rutina', icono: '🧴', fase: 19 },
    { id: 'recomendaciones', nombre: 'Recomendaciones', icono: '💡', fase: 19 },
    { id: 'seguimiento', nombre: 'Seguimiento', icono: '📈', fase: 19 },
  ],
};

export const plaquitasDe = (moduloId) => PLAQUITAS_CH[moduloId] || [];

/* ⚠️ **Qué fases están construidas, en un sitio y no en un `===`.** La F18
   escribió `fase === 18` porque entonces era verdad; la F19 lo habría dejado
   mintiendo en dos sitios a la vez. Cuando llegue la F22, se añade aquí. */
export const FASES_CH_LISTAS = [18, 19];

/* ===========================================================================
   8 · RESUMEN, AUDITORÍA Y PANEL
   =========================================================================== */

export function resumenCH(estado, moduloId, datosGlobales = {}) {
  const d = datosCH(estado, moduloId);
  const p = progresoCH(estado, moduloId, datosGlobales);
  /* ⚠️ **Se cuentan las CASILLAS, no los interruptores.** La línea de la portada
     dice *"qué utilizas"*, que es lo que él marcó en el apartado 1; meter dentro
     los tres interruptores de la F19 —que nacen encendidos— habría cambiado un
     "2 de 4" por un "5 de 7" sin que él tocara nada. */
  const casillas = partesDeModulo(moduloId).filter((x) => x.deApartado1);
  return {
    modulo: moduloId,
    estado: estadoDeEntradaCH(estado, moduloId),
    partesActivas: casillas.filter((x) => d.partes[x.id]).length,
    partes: casillas.length,
    contestadas: p.contestadas,
    // ⚠️ `progresoVisible` lo llama `total`, no `de`.
    de: p.total,
  };
}

/** ⚠️ Una línea para la portada (F30/F31). Sale de aquí, no de un dato nuevo. */
export function lineaCH(estado, moduloId, datosGlobales = {}) {
  const r = resumenCH(estado, moduloId, datosGlobales);
  if (r.estado !== 'configurado') return null;
  return `${r.partesActivas} de ${r.partes} activados`;
}

export function textosDeCH() {
  return [
    ...Object.values(TEXTOS_CH).flatMap((t) => (typeof t === 'string' ? [t] : Object.values(t))),
    ...PREGUNTAS_CH.flatMap((p) => [p.titulo, p.ayuda].filter(Boolean)),
    ...[...PARTES_HIGIENE, ...PARTES_CUERPO].map((p) => p.nombre),
    ...COSAS_DE_HIGIENE_DIARIA.map((c) => c.nombre),
    ...QUE_BUSCA.map((x) => x.nombre),
    ...NECESIDADES_CH.map((x) => x.nombre),
    ...CATEGORIAS_PRODUCTO_CH.map((x) => x.nombre),
    ...TIEMPOS_CH.map((x) => x.nombre),
  ];
}

export function auditarCH() {
  const todas = [...PARTES_HIGIENE, ...PARTES_CUERPO];
  const delApartado1 = todas.filter((p) => p.deApartado1);
  /* ⚠️ **Las repetidas se miran entre las CASILLAS, no entre las partes.** Las
     siete del apartado 1 se repartieron y ninguna puede estar en los dos
     módulos; los interruptores del apartado 17 de la F19 —rutinas,
     recomendaciones y productos— **están en los dos a propósito**, porque cada
     apartado apaga los suyos. Mirar la lista entera daba los tres por
     duplicados: es la comprobación la que se quedó vieja, no el catálogo. */
  const ids = delApartado1.map((p) => p.id);
  return {
    // ⚠️ C-25 — dos módulos, y las siete casillas repartidas entre ellos.
    modulos: MODULOS_CH.length,
    casillasDelApartado1: delApartado1.length,
    // Ninguna casilla en los dos módulos a la vez.
    repetidas: ids.filter((x, i) => ids.indexOf(x) !== i),
    // Ni una parte sin módulo.
    sinModulo: [],
    // Decisión 3 — lo que no se vuelve a preguntar, y de dónde sale.
    yaContestado: YA_CONTESTADO.length,
    // ⚠️ Ninguna de esas cuatro tiene pregunta propia aquí.
    preguntasRepetidas: PREGUNTAS_CH.filter((p) => YA_CONTESTADO.some((y) => y.dato === p.id)).map((p) => p.id),
    // Decisión 4 — ni un catálogo nuevo.
    catalogosNuevos: 0,
    // Decisión 5 — y ni un diagnóstico.
    /* ⚠️ `sinDiagnostico()` devuelve un booleano, no un objeto: leerle un
       `.limpio` que no existe daba `undefined`, y **todos los textos salían
       como clínicos**. Duodécima vez que una comprobación falla por la forma de
       lo que devuelve, no por lo que dice. */
    textosClinicos: textosDeCH().filter((t) => !sinDiagnostico(t)),
    // Decisión 6 — lo que llega en otra fase, declarado.
    enFase19: todas.filter((p) => p.enFase === 19).length,
    enFase22: todas.filter((p) => p.enFase === 22).length,
    preguntas: PREGUNTAS_CH.length,
  };
}

export function panelCH(estado, moduloId, datosGlobales = {}) {
  const d = datosCH(estado, moduloId);
  const textos = textoDeModulo(moduloId);
  return {
    modulo: moduloId,
    titulo: textos.titulo,
    sub: textos.sub,
    estado: estadoDeEntradaCH(estado, moduloId),
    entrada: {
      titulo: textos.entrada,
      // Apartado 1 — solo las casillas de esta pantalla, las de este módulo.
      casillas: partesDeModulo(moduloId)
        .filter((p) => p.deApartado1)
        .map((p) => ({ ...p, puesta: d.partes[p.id] === true })),
      continuar: TEXTOS_CH.continuar,
      ahoraNo: TEXTOS_CH.ahoraNo,
      soloLoTuyo: TEXTOS_CH.soloLoTuyo,
    },
    partes: partesDeModulo(moduloId).map((p) => ({ ...p, puesta: d.partes[p.id] === true })),
    // Apartado 3 — solo Higiene.
    cosas: moduloId === MODULO_HIGIENE
      ? COSAS_DE_HIGIENE_DIARIA.map((c) => ({ ...c, puesta: d.cosas[c.id] === true }))
      : [],
    secciones: seccionesDeCH(estado, moduloId, datosGlobales),
    progreso: progresoCH(estado, moduloId, datosGlobales),
    // Decisión 3 — lo que ya sabemos, con dónde se cambia.
    yaSabemos: loQueYaSabemosCH(estado, datosGlobales).filter((x) => x.tiene),
    yaLoSabemosTexto: TEXTOS_CH.yaLoSabemos,
    plaquitas: plaquitasDe(moduloId).map((pl) => ({
      ...pl,
      // Regla 8 — la que todavía no existe lo dice, en vez de abrir un vacío.
      lista: FASES_CH_LISTAS.includes(pl.fase),
      texto: FASES_CH_LISTAS.includes(pl.fase) ? null : TEXTOS_CH.enOtraFase,
    })),
    opcional: TEXTOS_CH.opcional,
    sonDos: TEXTOS_CH.sonDos,
    catalogo: TEXTOS_CH.catalogo,
  };
}

/*
 * ⚠️ **Lo que la F18 NO añadió a los catálogos globales, y por qué.**
 *
 * `METRICAS_PROGRESO` (F35) y `COLECCIONES_EH` (F41) piden **listas** e
 * **historiales**, y la F18 no creaba ninguno: sus partes son booleanos y su
 * perfil son respuestas del registro. Añadir una métrica allí habría sido contar
 * algo que todavía no existía.
 *
 * ✅ **Las dos llegaron con la F19**, que es la que crea las rutinas: sus líneas
 * están en `progresoEstilo.js` y en `estadosEstilo.js`, y la lista de aquí se
 * queda como lo que fue — el aviso que se cumplió.
 */
export const CATALOGOS_QUE_LLEGAN_EN_F19 = ['METRICAS_PROGRESO', 'COLECCIONES_EH'];

export { PALABRAS_CLINICAS, NO_LO_SE, NIVELES_ESTILO };
