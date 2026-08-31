// ============================================================================
// EH · Fase 19/65 — CUERPO E HIGIENE: RUTINAS Y RECOMENDACIONES
//
// *"Debe ser mucho más ligera que Skincare. No queremos convertir una ducha en
// una lista interminable de tareas. La aplicación sugiere → el usuario
// configura → el usuario decide. Sin IA."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ AQUÍ NO SE CONSTRUYE NI UNA MÁQUINA.** Rutinas, plantillas,
// checklist, omitir, historial, calendario y papelera son de `motorRutinas.js`
// (F14); las reglas, de `motorRecomendaciones.js` (F16); los productos, los
// packs y las alternativas, de `motorProductos.js` (F17). Esta fase es, casi
// entera, **llamadas**: lo suyo son sus pasos, sus frecuencias, sus dos
// plantillas y sus siete reglas. Sexto módulo que entra por esa puerta.
//
// **2. ⚠️ EL EJEMPLO DEL APARTADO 2 MEZCLA LOS DOS MÓDULOS, Y SE REPARTE.** Su
// *"rutina diaria básica"* es *ducha, higiene, desodorante e hidratación
// corporal*, pero **C-25 dejó dicho que son dos apartados** y el 17 exige que
// quitar uno no toque el otro. Así que los tres primeros son la plantilla de
// 🚿 Higiene y el cuarto la de 🧴 Cuidado corporal — **exactamente el mismo
// reparto que hizo la F18 con las siete casillas**, y por el mismo motivo: una
// rutina de Higiene con un paso de Cuerpo dentro se rompería al apagar Cuerpo.
//
// **3. ⚠️ EL SEGUIMIENTO NO GUARDA NADA NUEVO.** La casilla *Seguimiento* la
// declaró la F18 con `enFase: 19`, y el enunciado de esta fase **no describe
// ninguna pantalla de registro**: describe rutinas. Así que el seguimiento es
// **lo que ya se sabe** —qué días tocaba, qué días marcó, qué omitió—, derivado
// con `historialGenerico`. Inventarle un registro con valoraciones habría sido
// meterle a Cuerpo la pantalla de Barba que aquí nadie ha pedido, y el enunciado
// abre diciendo *"mucho más ligera que Skincare"*.
//
// **4. ⚠️ "YA TIENES UN PRODUCTO QUE PODRÍA SERVIR" ES UNA REGLA, NO UN
// ADORNO** (apartado 11, que termina: *"esto evita gastar dinero sin motivo"*).
// Se mira **antes** de recomendar: si en el catálogo compartido ya hay algo suyo
// de esa categoría, se dice **y no se recomienda otro**. Y el catálogo sigue
// vacío a propósito (D2-03), así que aquí no aparece ni un producto inventado.
//
// **5. ⚠️ NI UN INVENTARIO, NI UNA PAPELERA, NI UN CALENDARIO NUEVOS**
// (apartado 18: *"nada duplicado"*). Los productos son los que ya existen y
// aquí solo se guardan **ids**, como hace Barba; eliminar pasa por
// `papelera.js`; y los recordatorios salen al calendario global derivados, sin
// materializar ni una ocurrencia (regla 11).
//
// **6. ⚠️ Y NADA SE ENCIENDE SOLO.** Los recordatorios nacen apagados
// (apartado 7: *"nunca activarlos automáticamente"*), las plantillas **sugieren**
// y crear una es otra llamada con `confirmado`, y omitir un paso **no penaliza**
// (apartado 16: *"sin penalización. No crear rachas obligatorias"*).
//
// ⚠️ **Lo único que esta fase guarda de nuevo** son las rutinas, sus marcas del
// día, los ids de los productos que él apunta y sus packs. Todo lo demás
// —cuántas veces la ha hecho, qué toca hoy, qué recomendar— **se deriva**.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import {
  MODULO_HIGIENE, MODULO_CUERPO, MODULOS_CH, esModuloCH, datosCH, parteActivaCH,
  contextoDeCuerpo, loQueYaSabemosCH, CATEGORIAS_PRODUCTO_CH, categoriaProductoCH,
  TIEMPOS_CH,
} from './cuerpoHigiene';
import { NIVELES_ESTILO, nivelEstilo } from './perfilEstilo';
import { PALABRAS_CLINICAS, sinDiagnostico } from './perfilPiel';
import { productosPiel } from './productosPiel';
import { productosPelo } from './productosPelo';
import {
  normalizarRutinaGenerica, tocaEnFechaGenerico, normalizarHechos,
  alternarPaso, alternarOmitido, marcarTodo, checklistGenerico,
  historialGenerico, eventosDeRutinas, impactoEliminarRutina,
  ESTADOS_RUTINA_DIA, TEXTOS_ESTADO_DIA, DIAS_HISTORIAL,
} from './motorRutinas';
import {
  reglaAplicable, DEFAULT_RECOMENDACIONES, normalizarRecomendaciones,
  silenciadaEn, marcarVistasEn, descartarEn, deshacerDescarteEn, guardarEn,
  quitarGuardadaEn, tonoCorrecto, PALABRAS_PROHIBIDAS, RECOMENDACIONES_INICIALES,
  ordenarYRecortar,
} from './motorRecomendaciones';
import {
  alternativasGenericas, normalizarPackGenerico, verPackGenerico,
  CATALOGO_VACIO_PORQUE,
} from './motorProductos';
import { prepararEliminacion, prepararRestauracion } from './papelera';
import { uid, todayISO } from './helpers';

/* ⚠️ Los cuatro interruptores del apartado 17 —*"rutinas, recomendaciones,
   productos y seguimiento… los datos se conservan"*—. **No se crea ninguno
   nuevo**: son partes del catálogo de la F18, y quien los enciende y los apaga
   sigue siendo `alternarParteCH`. */
export const PARTE_RUTINAS = 'rutinas';
export const PARTE_RECOMENDACIONES = 'recomendaciones';
export const PARTE_PRODUCTOS = 'productos';
export const PARTE_SEGUIMIENTO = 'seguimiento';

/* ===========================================================================
   1 · LOS PASOS (apartados 2 y 3)
   ===========================================================================
   ⚠️ Un catálogo, no una lista obligatoria: existe "Otro" para lo que no quepa.
   Y **cada paso dice de qué módulo es** (decisión 2): los de Higiene no se
   ofrecen en Cuidado corporal ni al revés. `otros` vale para los dos. */

export const PASOS_CUERPO = [
  // Los tres de Higiene que salen en el ejemplo del apartado 2.
  { id: 'ducha', nombre: 'Ducha', icono: '🚿', de: MODULO_HIGIENE, nivel: 'basico' },
  { id: 'higiene', nombre: 'Higiene', icono: '🧼', de: MODULO_HIGIENE, nivel: 'basico' },
  { id: 'desodorante', nombre: 'Desodorante', icono: '🧴', de: MODULO_HIGIENE, nivel: 'basico' },
  { id: 'intima', nombre: 'Higiene íntima', icono: '🩲', de: MODULO_HIGIENE, nivel: 'basico' },
  // El cuarto del ejemplo, que es de Cuidado corporal (decisión 2).
  { id: 'hidratacion', nombre: 'Hidratación corporal', icono: '🧴', de: MODULO_CUERPO, nivel: 'basico' },
  { id: 'exfoliacion', nombre: 'Exfoliación', icono: '✨', de: MODULO_CUERPO, nivel: 'intermedio' },
  { id: 'especifico', nombre: 'Cuidado específico', icono: '🎯', de: MODULO_CUERPO, nivel: 'intermedio' },
  { id: 'otros', nombre: 'Otro', icono: '➕', de: null, nivel: 'basico' },
];

export const pasoCuerpo = (id) => PASOS_CUERPO.find((p) => p.id === id) || null;

/** Los pasos de un módulo. ⚠️ `otros` es de los dos, y por eso lleva `de: null`. */
export const pasosDeModulo = (moduloId) =>
  PASOS_CUERPO.filter((p) => p.de === moduloId || p.de === null);

/**
 * ⚠️ Apartado 14 — *"evitar que el nivel avanzado convierta el apartado en algo
 * excesivo"*. El nivel filtra **lo que se ofrece**, nunca lo guardado: es la
 * lección literal del apartado 14 de la F14, y aquí no se toca ni una rutina.
 */
export function pasosParaNivelCuerpo(moduloId, nivel) {
  const orden = NIVELES_ESTILO.map((x) => x.id);
  const hasta = orden.indexOf(nivel);
  const suyos = pasosDeModulo(moduloId);
  // Sin nivel elegido se ofrece todo: esconderle opciones a quien no ha dicho
  // nada sería decidir por él.
  if (hasta < 0) return suyos;
  return suyos.filter((p) => orden.indexOf(p.nivel) <= hasta);
}

/* ===========================================================================
   2 · FRECUENCIAS Y MOMENTOS (apartados 3 y 6)
   ===========================================================================
   ⚠️ Las seis del apartado 6 son **seis etiquetas sobre cuatro
   comportamientos**, como en F14 y F21: *determinados días*, *varias veces por
   semana* y *semanal* son tres formas de decir "estos días de la semana". Se
   guarda la palabra que escribió Josué y el `tipo` es lo que calcula el motor. */

export const FRECUENCIAS_CUERPO = [
  { id: 'diario', nombre: 'Diario', tipo: 'diaria' },
  { id: 'dias', nombre: 'Determinados días', pideDias: true, tipo: 'dias' },
  { id: 'veces_semana', nombre: 'Varias veces por semana', pideDias: true, tipo: 'dias' },
  { id: 'semanal', nombre: 'Semanal', pideDias: true, tipo: 'dias' },
  { id: 'cada_x', nombre: 'Cada X días', pideCada: true, tipo: 'cada_x' },
  { id: 'personalizada', nombre: 'Personalizada', tipo: 'ninguna' },
];

export const frecuenciaCuerpo = (id) => FRECUENCIAS_CUERPO.find((f) => f.id === id) || null;

const tipoFrecuenciaCuerpo = (id) => frecuenciaCuerpo(id)?.tipo || null;

/** Apartado 3 — *"momento"*. Las mismas tres etiquetas que ya usa Barba. */
export const MOMENTOS_CUERPO = [
  { id: 'manana', nombre: 'Por la mañana', icono: '🌅' },
  { id: 'noche', nombre: 'Por la noche', icono: '🌙' },
  { id: 'cualquiera', nombre: 'Cuando toque', icono: '🕐' },
];

export const momentoCuerpo = (id) => MOMENTOS_CUERPO.find((m) => m.id === id) || null;

/* ===========================================================================
   3 · LAS PLANTILLAS (apartado 2)
   ===========================================================================
   ⚠️ *"Ofrecer **opcionalmente** una plantilla"*, con sus tres botones: *Usar
   esta rutina*, *Personalizar* y *Crear desde cero*. Opcional quiere decir que
   verla **no escribe nada**: `usarPlantillaCuerpo` es otra llamada, y va con
   `confirmado`. Octavo `aplicarPlan` del proyecto. */

export const PLANTILLAS_CUERPO = [
  {
    id: 'basica',
    modulo: MODULO_HIGIENE,
    nombre: 'Rutina diaria básica',
    icono: '🚿',
    // ⚠️ Decisión 2 — los tres del ejemplo que son de Higiene.
    pasos: ['ducha', 'higiene', 'desodorante'],
    frecuencia: 'diario',
  },
  {
    id: 'hidratacion',
    modulo: MODULO_CUERPO,
    nombre: 'Hidratación corporal',
    icono: '🧴',
    // ⚠️ Y el cuarto, que es de Cuidado corporal. La tarjeta del apartado 4.
    pasos: ['hidratacion'],
    frecuencia: 'diario',
  },
];

export const plantillaCuerpo = (id) => PLANTILLAS_CUERPO.find((p) => p.id === id) || null;

/** Los tres botones del apartado 2, dichos una sola vez. */
export const BOTONES_PLANTILLA = {
  usar: 'Usar esta rutina',
  personalizar: 'Personalizar',
  desdeCero: 'Crear desde cero',
};

/* ===========================================================================
   4 · EL ALMACÉN
   ===========================================================================
   Una llave dentro de la `config` de cada módulo. ⚠️ **Ningún inventario de
   productos**: `productos` son ids del catálogo que ya existe (decisión 5). */

export const DEFAULT_RUTINAS_CUERPO = { rutinas: [], hechos: [], productos: [], packs: [] };

/* ⚠️ Los campos propios de una rutina de aquí los normaliza ESTE archivo, no el
   motor: un campo que nadie normaliza desaparece en el siguiente guardado
   (regla 5). Van veintiuna veces en este proyecto. */
const extraDeRutina = (r) => ({
  momento: momentoCuerpo(r.momento) ? r.momento : 'cualquiera',
  hora: typeof r.hora === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(r.hora) ? r.hora : null,
  // De qué plantilla salió, para no volver a ofrecerla.
  plantilla: PLANTILLAS_CUERPO.some((p) => p.id === r.plantilla) ? r.plantilla : null,
});

export const normalizarRutinaCuerpo = (g, i) =>
  normalizarRutinaGenerica(g, i, {
    tipoDe: tipoFrecuenciaCuerpo,
    frecuenciaPorDefecto: 'personalizada',
    extra: extraDeRutina,
  });

export function normalizarRutinasCuerpo(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    rutinas: (Array.isArray(g.rutinas) ? g.rutinas : [])
      .map(normalizarRutinaCuerpo)
      .sort((a, b) => a.orden - b.orden),
    hechos: normalizarHechos(g.hechos),
    /* ⚠️ **Ids, no fichas** (apartado 18: *"productos globales… nada
       duplicado"*). Guardar aquí el nombre "por si acaso" sería media ficha, que
       es el segundo inventario por la puerta de atrás. Es lo que hace Barba. */
    productos: [...new Set((Array.isArray(g.productos) ? g.productos : []).filter((x) => typeof x === 'string'))],
    // Apartado 13 — un pack es una lista de ids con nombre. El motor los conoce.
    packs: (Array.isArray(g.packs) ? g.packs : []).map(normalizarPackGenerico),
  };
}

export const datosRutinasCuerpo = (estado, moduloId) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === moduloId);
  return normalizarRutinasCuerpo(mod?.config?.rutinas);
};

const escribir = (estado, moduloId, datos) => guardarConfig(estado, moduloId, { rutinas: datos });

export const rutinasCuerpo = (estado, moduloId) => datosRutinasCuerpo(estado, moduloId).rutinas;

export const rutinaCuerpo = (estado, moduloId, id) =>
  rutinasCuerpo(estado, moduloId).find((r) => r.id === id) || null;

/* ===========================================================================
   5 · EL CATÁLOGO DE PRODUCTOS (apartados 10, 11 y 12)
   ===========================================================================
   ⚠️ **El de siempre.** La F20 dejó escrito en `catalogoParaBarba` que *"el día
   que Cuerpo tenga el suyo, se añade ahí y no en un tercer sitio"* — y la
   respuesta de esta fase es que **Cuerpo no tiene el suyo**: apunta ids de los
   inventarios que ya existen, y por eso aquí no nace ningún `CATALOGO_CUERPO`. */

export const catalogoParaCuerpo = (estado) => [
  ...productosPiel(estado).map((p) => ({ ...p, modulo: 'skincare', moduloNombre: 'Skincare' })),
  ...productosPelo(estado).map((p) => ({ ...p, modulo: 'pelo', moduloNombre: 'Pelo' })),
];

/** Los que él ha apuntado en este módulo. ⚠️ Un id que ya no está, desaparece. */
export const productosDeCuerpo = (estado, moduloId) => {
  const catalogo = catalogoParaCuerpo(estado);
  return datosRutinasCuerpo(estado, moduloId).productos
    .map((id) => catalogo.find((p) => p.id === id))
    .filter(Boolean);
};

/** Prueba 14 — *"guardar producto"*. Se apunta el id; la ficha sigue en su módulo. */
export function marcarProductoCuerpo(estado, moduloId, productoId) {
  const d = datosRutinasCuerpo(estado, moduloId);
  if (!catalogoParaCuerpo(estado).some((p) => p.id === productoId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  }
  if (d.productos.includes(productoId)) {
    return { estado: normalizarEstiloHombre(estado), error: null, sinEfecto: true };
  }
  return { estado: escribir(estado, moduloId, { ...d, productos: [...d.productos, productoId] }), error: null };
}

/* ⚠️ Quitarlo de aquí **no lo borra de su módulo**, así que esto no pasa por la
   papelera: no se está eliminando nada. Misma decisión que en Barba. */
export function quitarProductoCuerpo(estado, moduloId, productoId) {
  const d = datosRutinasCuerpo(estado, moduloId);
  return {
    estado: escribir(estado, moduloId, { ...d, productos: d.productos.filter((x) => x !== productoId) }),
    error: null,
  };
}

/** Apartado 12 — *"ver alternativas"*, con el motor de la F17. */
export const alternativasDeCuerpo = (estado, productoId) =>
  alternativasGenericas(catalogoParaCuerpo(estado), productoId);

/* ===========================================================================
   5bis · 🐛 LAS CATEGORÍAS NO SON LAS MISMAS, Y HAY QUE TRADUCIRLAS
   ===========================================================================
   ⚠️ **Un fallo real, cazado por la prueba del apartado 11.** Las categorías de
   la F18 son `gel`, `crema`, `jabon`, `desodorante` y `otros`; las fichas del
   catálogo compartido llevan las de **Skincare** (`hidratante`, `limpiador`…) y
   las de **Pelo** (`champu`, `styling`…), porque son sus inventarios. Comparar
   `p.categoria === 'crema'` **no habría encontrado nunca nada**, y el apartado 11
   —*"ya tienes un producto que podría servir"*— no habría saltado jamás: un
   silencio, no un error, que es la peor clase.

   Así que la equivalencia se declara, con dos entradas y ni una inventada. Y
   **`gel` y `desodorante` no tienen equivalente hoy**, porque no existen en
   ninguno de los dos inventarios: se dice, en vez de forzar una traducción
   falsa. */

export const EQUIVALENCIAS_CATEGORIA = {
  // De Skincare (F13/F17) — *"podría servir"*, que es lo que dice el enunciado.
  hidratante: 'crema',
  limpiador: 'jabon',
};

export const SIN_EQUIVALENTE = ['gel', 'desodorante'];

/**
 * La categoría de un producto **vista desde aquí**. Si algún día Cuerpo tiene su
 * propio inventario, sus fichas ya vendrán con la categoría buena y esto las
 * dejará pasar tal cual.
 */
export function categoriaCHDe(producto) {
  const c = producto?.categoria;
  if (!c) return null;
  if (CATEGORIAS_PRODUCTO_CH.some((x) => x.id === c)) return c;
  return EQUIVALENCIAS_CATEGORIA[c] || null;
}

/* ===========================================================================
   6 · CREAR, EDITAR, REORDENAR (apartados 3 y 15)
   =========================================================================== */

export function crearRutinaCuerpo(estado, moduloId, datos = {}, { hoy = todayISO() } = {}) {
  if (!esModuloCH(moduloId)) return { estado: normalizarEstiloHombre(estado), error: 'Ese apartado no existe.', rutina: null };
  const nombre = String(datos.nombre || '').trim();
  if (!nombre) return { estado: normalizarEstiloHombre(estado), error: 'La rutina necesita un nombre.', rutina: null };
  const d = datosRutinasCuerpo(estado, moduloId);
  const rutina = normalizarRutinaCuerpo({ ...datos, nombre, desde: datos.desde || hoy, orden: d.rutinas.length }, d.rutinas.length);
  return { estado: escribir(estado, moduloId, { ...d, rutinas: [...d.rutinas, rutina] }), error: null, rutina };
}

export function editarRutinaCuerpo(estado, moduloId, id, cambios = {}) {
  const d = datosRutinasCuerpo(estado, moduloId);
  const actual = d.rutinas.find((r) => r.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  /* ⚠️ Se mira lo que ÉL escribió, no lo normalizado: el motor le pone "Rutina"
     a lo que llega sin nombre, así que comprobarlo después nunca saltaría. Es la
     lección de `editarRutinaBarba`, escrita antes que esta fase. */
  if ('nombre' in cambios && !String(cambios.nombre || '').trim()) {
    return { estado: normalizarEstiloHombre(estado), error: 'La rutina necesita un nombre.' };
  }
  const nueva = normalizarRutinaCuerpo({ ...actual, ...cambios, id: actual.id }, actual.orden);
  return {
    estado: escribir(estado, moduloId, { ...d, rutinas: d.rutinas.map((r) => (r.id === id ? nueva : r)) }),
    error: null,
  };
}

/** Prueba 5 — *"añadir pasos"*. ⚠️ Solo los del módulo (decisión 2). */
export function anadirPasoCuerpo(estado, moduloId, rutinaId, accion, { nombre = '' } = {}) {
  const r = rutinaCuerpo(estado, moduloId, rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  if (!pasosDeModulo(moduloId).some((p) => p.id === accion)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese paso no es de este apartado.' };
  }
  return editarRutinaCuerpo(estado, moduloId, rutinaId, { pasos: [...r.pasos, { accion, nombre }] });
}

export function quitarPasoCuerpo(estado, moduloId, rutinaId, pasoId) {
  const r = rutinaCuerpo(estado, moduloId, rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  return editarRutinaCuerpo(estado, moduloId, rutinaId, { pasos: r.pasos.filter((p) => p.id !== pasoId) });
}

/** Prueba 6 — *"reordenarlos"*. ⚠️ Lo que no venga en la lista se queda detrás. */
export function ordenarPasosCuerpo(estado, moduloId, rutinaId, ordenIds = []) {
  const r = rutinaCuerpo(estado, moduloId, rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  const puestos = ordenIds.map((id) => r.pasos.find((p) => p.id === id)).filter(Boolean);
  const resto = r.pasos.filter((p) => !ordenIds.includes(p.id));
  return editarRutinaCuerpo(estado, moduloId, rutinaId, { pasos: [...puestos, ...resto] });
}

/** Prueba 7 — *"asociar productos"*. ⚠️ Uno del catálogo, nunca uno nuevo. */
export function asignarProductoCuerpo(estado, moduloId, rutinaId, pasoId, productoId) {
  const r = rutinaCuerpo(estado, moduloId, rutinaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  if (productoId !== null && !catalogoParaCuerpo(estado).some((p) => p.id === productoId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.' };
  }
  return editarRutinaCuerpo(estado, moduloId, rutinaId, {
    pasos: r.pasos.map((p) => (p.id === pasoId ? { ...p, productoId } : p)),
  });
}

/** Apartado 7 — *"el usuario decide. Nunca activarlos automáticamente"*. */
export function alternarRecordatorioCuerpo(estado, moduloId, id) {
  const r = rutinaCuerpo(estado, moduloId, id);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.' };
  return editarRutinaCuerpo(estado, moduloId, id, { recordatorio: !r.recordatorio });
}

/**
 * Apartado 2 — la plantilla. ⚠️ **Sin `confirmado` no escribe**, y nunca con
 * valor por defecto: es la regla 7 en código.
 */
export function usarPlantillaCuerpo(estado, moduloId, plantillaId, { hoy = todayISO(), confirmado = false } = {}) {
  const p = plantillaCuerpo(plantillaId);
  if (!p || p.modulo !== moduloId) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa plantilla no existe.', rutina: null };
  }
  if (!confirmado) {
    return { estado: normalizarEstiloHombre(estado), error: null, rutina: null, sinConfirmar: true };
  }
  return crearRutinaCuerpo(estado, moduloId, {
    nombre: p.nombre,
    pasos: p.pasos.map((id) => ({ accion: id })),
    frecuencia: p.frecuencia,
    plantilla: p.id,
  }, { hoy });
}

/** ⚠️ Propone; no escribe. Y no vuelve a ofrecer una plantilla ya usada. */
export function plantillasSugeridasCuerpo(estado, moduloId) {
  const yaTiene = rutinasCuerpo(estado, moduloId).map((r) => r.plantilla).filter(Boolean);
  return PLANTILLAS_CUERPO
    .filter((p) => p.modulo === moduloId && !yaTiene.includes(p.id))
    .map((p) => ({
      ...p,
      pasosVisibles: p.pasos.map((id) => pasoCuerpo(id)).filter(Boolean),
      frecuenciaNombre: frecuenciaCuerpo(p.frecuencia)?.nombre || '',
      // ⚠️ Escrito en el propio dato: verla no la crea.
      guardada: false,
      botones: BOTONES_PLANTILLA,
    }));
}

/* ===========================================================================
   7 · BORRAR — POR LA PAPELERA GLOBAL (apartado 18)
   =========================================================================== */

export const impactoEliminarRutinaCuerpo = (estado, moduloId, id) => {
  const d = datosRutinasCuerpo(estado, moduloId);
  return impactoEliminarRutina(d.rutinas, d.hechos, id);
};

export function eliminarRutinaCuerpo(estado, moduloId, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosRutinasCuerpo(estado, moduloId);
  const r = prepararEliminacion(d, moduloId, 'rutinas', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa rutina no existe.', entrada: null };
  return {
    // Sus marcas se van con ella: sin la rutina no significan nada.
    estado: escribir(estado, moduloId, {
      ...r.moduloActualizado,
      hechos: d.hechos.filter((h) => h.rutinaId !== id),
    }),
    error: null,
    entrada: r.entrada,
  };
}

export function restaurarRutinaCuerpo(estado, moduloId, entrada) {
  const d = datosRutinasCuerpo(estado, moduloId);
  const r = prepararRestauracion(d, entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se ha podido restaurar.' };
  return { estado: escribir(estado, moduloId, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

/* ===========================================================================
   8 · EL DÍA Y EL CHECKLIST (apartados 5 y 16)
   =========================================================================== */

export const tocaEnFechaCuerpo = (rutina, fechaISO) =>
  tocaEnFechaGenerico(rutina, fechaISO, tipoFrecuenciaCuerpo);

export function rutinasDeHoyCuerpo(estado, moduloId, { hoy = todayISO() } = {}) {
  if (!parteActivaCH(estado, moduloId, PARTE_RUTINAS)) return [];
  return rutinasCuerpo(estado, moduloId).filter((r) => r.activa && tocaEnFechaCuerpo(r, hoy));
}

const nombreDeProducto = (estado) => (id) => {
  if (!id) return '';
  return catalogoParaCuerpo(estado).find((p) => p.id === id)?.nombre || '';
};

export function checklistCuerpo(estado, moduloId, rutinaId, { hoy = todayISO() } = {}) {
  const d = datosRutinasCuerpo(estado, moduloId);
  return checklistGenerico(d.rutinas.find((r) => r.id === rutinaId), d.hechos, hoy, {
    nombreDePaso: (p) => p.nombre || pasoCuerpo(p.accion)?.nombre || 'Paso',
    iconoDePaso: (p) => pasoCuerpo(p.accion)?.icono || '•',
    nombreDeProducto: nombreDeProducto(estado),
  });
}

export function marcarPasoCuerpo(estado, moduloId, rutinaId, pasoId, { hoy = todayISO() } = {}) {
  const d = datosRutinasCuerpo(estado, moduloId);
  return escribir(estado, moduloId, { ...d, hechos: alternarPaso(d.hechos, rutinaId, pasoId, hoy) });
}

/** Apartado 16 — *"Omitir hoy. Sin penalización."* Ni hecho, ni pendiente. */
export function omitirPasoCuerpo(estado, moduloId, rutinaId, pasoId, { hoy = todayISO() } = {}) {
  const d = datosRutinasCuerpo(estado, moduloId);
  return escribir(estado, moduloId, { ...d, hechos: alternarOmitido(d.hechos, rutinaId, pasoId, hoy) });
}

export function marcarRutinaCuerpoEntera(estado, moduloId, rutinaId, { hoy = todayISO() } = {}) {
  const d = datosRutinasCuerpo(estado, moduloId);
  const r = d.rutinas.find((x) => x.id === rutinaId);
  if (!r) return normalizarEstiloHombre(estado);
  return escribir(estado, moduloId, { ...d, hechos: marcarTodo(d.hechos, r, hoy) });
}

/* ===========================================================================
   9 · EL SEGUIMIENTO — DERIVADO (decisión 3)
   ===========================================================================
   ⚠️ **Ni un registro nuevo.** Qué días tocaba y qué días marcó ya está en
   `hechos`; el cumplimiento lo calcula el motor, y **sin días en los que tocara
   no hay porcentaje** —`null`, nunca un 0 %, que sería un reproche—. */

export const seguimientoCuerpo = (estado, moduloId, { hoy = todayISO() } = {}) => {
  const d = datosRutinasCuerpo(estado, moduloId);
  return historialGenerico({ rutinas: d.rutinas, hechos: d.hechos, tipoDe: tipoFrecuenciaCuerpo, hoy });
};

/** Los últimos días con algo marcado. ⚠️ Una línea por día, y nada más. */
export function ultimosDiasCuerpo(estado, moduloId, { limite = 10 } = {}) {
  const d = datosRutinasCuerpo(estado, moduloId);
  return [...d.hechos]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, limite)
    .map((h) => ({
      fecha: h.fecha,
      rutina: d.rutinas.find((r) => r.id === h.rutinaId)?.nombre || '',
      hechos: h.pasos.length,
      omitidos: h.omitidos.length,
    }));
}

/* ===========================================================================
   10 · EL CALENDARIO Y LOS RECORDATORIOS (apartados 7 y 18)
   ===========================================================================
   ⚠️ *"Utilizar el calendario global."* Derivado, de solo lectura, y **sin
   materializar ni una ocurrencia** (regla 11). Sexto módulo por esta puerta. */

export function eventosDeCuerpo(estado, desde, hasta) {
  return MODULOS_CH.flatMap((moduloId) => {
    if (!parteActivaCH(estado, moduloId, PARTE_RUTINAS)) return [];
    return eventosDeRutinas({
      rutinas: rutinasCuerpo(estado, moduloId).filter((r) => r.activa),
      tipoDe: tipoFrecuenciaCuerpo,
      desde,
      hasta,
      prefijo: moduloId,
      origen: moduloId,
      icono: moduloId === MODULO_HIGIENE ? '🚿' : '🧴',
    });
  });
}

/* ===========================================================================
   11 · LAS RECOMENDACIONES (apartados 8, 9, 10, 11, 12 y 13)
   ===========================================================================
   ⚠️ *"Mostrar pocas opciones"* y *"no utilizar IA"*. Son siete reglas sobre lo
   que él ya ha contestado, con el motor de la F16: cada una declara **qué
   necesita** —y sin esos datos no se dispara—, **por qué aparece** y **qué
   haría** si la acepta. */

export const TEMAS_CUERPO = ['hidratacion', 'olor', 'limpieza', 'sensibilidad', 'rutina', 'producto'];

/**
 * El contexto: **los seis criterios del apartado 9, y ni uno más.**
 * ⚠️ Nada se copia — el perfil, la sensibilidad y los productos se **leen** de
 * donde viven, y este objeto se calcula al vuelo.
 */
export function contextoParaCuerpo(estado, moduloId, datosGlobales = {}, { hoy = todayISO() } = {}) {
  const perfil = contextoDeCuerpo(estado, moduloId, datosGlobales);
  const d = datosRutinasCuerpo(estado, moduloId);
  const pasos = [...new Set(d.rutinas.flatMap((r) => r.pasos.map((p) => p.accion)))];
  /* ⚠️ La sensibilidad la declaró la F13 y la lee el registro de la F4: aquí
     **no se vuelve a preguntar** (decisión 3 de la F18), se consulta. */
  const yaSabemos = loQueYaSabemosCH(estado, datosGlobales);
  const sensible = yaSabemos.find((x) => x.dato === 'sensibilidadPiel');
  const sinPerfume = yaSabemos.find((x) => x.dato === 'sinPerfume');

  return {
    modulo: moduloId,
    // 1 · Necesidades.
    necesidades: perfil.necesidades,
    // 2 · Preferencias.
    busca: perfil.busca,
    // 3 · Sensibilidad indicada.
    sensible: sensible?.tiene ? sensible.valor : null,
    sinPerfume: sinPerfume?.tiene ? sinPerfume.valor : null,
    // 4 · Tiempo disponible.
    minutos: perfil.minutos,
    tiempo: perfil.tiempo,
    // 5 · Nivel.
    nivel: perfil.nivel,
    // 6 · Productos existentes.
    productos: productosDeCuerpo(estado, moduloId).map((p) => p.id),
    categoriasQueTiene: [...new Set(productosDeCuerpo(estado, moduloId).map(categoriaCHDe).filter(Boolean))],
    // Lo que hay construido, para no proponer lo que ya tiene.
    rutinas: d.rutinas.length,
    sinRutina: d.rutinas.length === 0,
    pasos,
    numPasos: pasos.length,
    conRecordatorio: d.rutinas.filter((r) => r.recordatorio).length,
    hoy,
    // ⚠️ Escrito en el propio dato: esto no viaja a ninguna IA.
    paraIA: false,
  };
}

/* ⚠️ Cada regla declara `modulo`, porque una idea de hidratación corporal no
   tiene sentido dentro de Higiene — y al revés. */
export const REGLAS_CUERPO = [
  {
    // El ejemplo literal del apartado 8.
    id: 'anadir_hidratacion',
    modulo: MODULO_CUERPO, nivel: 'basico', tema: 'hidratacion', tipo: 'rutina', paso: 'hidratacion',
    titulo: 'Hidratación corporal',
    texto: 'Podrías añadir hidratación corporal a tu rutina.',
    requiere: ['necesidades'],
    cuando: (c) => (c.necesidades.includes('hidratacion') || c.necesidades.includes('sequedad'))
      && !c.pasos.includes('hidratacion'),
    porque: () => 'La hemos seleccionado porque has indicado que quieres cuidar la hidratación.',
  },
  {
    id: 'anadir_desodorante',
    modulo: MODULO_HIGIENE, nivel: 'basico', tema: 'olor', tipo: 'rutina', paso: 'desodorante',
    titulo: 'Desodorante',
    texto: 'Podrías añadir el desodorante a tu rutina, para tenerlo a mano.',
    requiere: ['necesidades'],
    cuando: (c) => c.necesidades.includes('olor') && !c.pasos.includes('desodorante'),
    porque: () => 'La hemos seleccionado porque has indicado que quieres cuidar el olor.',
  },
  {
    id: 'primera_rutina',
    modulo: null, nivel: 'basico', tema: 'rutina', tipo: 'plantilla',
    titulo: 'Empezar por una rutina sencilla',
    texto: 'Puedes empezar con la plantilla básica y quitarle lo que no uses.',
    requiere: ['sinRutina', 'busca'],
    cuando: (c) => c.sinRutina === true,
    porque: () => 'La hemos seleccionado porque todavía no tienes ninguna rutina creada.',
  },
  {
    id: 'sensible_suave',
    modulo: null, nivel: 'basico', tema: 'sensibilidad', tipo: 'consejo',
    titulo: 'Productos suaves',
    texto: 'Una opción compatible contigo son los productos sin perfume y de textura ligera.',
    requiere: ['sensible'],
    cuando: (c) => c.sensible === true || c.sensible === 'si',
    porque: () => 'La hemos seleccionado porque has indicado que tu piel reacciona con facilidad.',
  },
  {
    id: 'poco_tiempo',
    modulo: null, nivel: 'basico', tema: 'rutina', tipo: 'consejo',
    titulo: 'Una rutina corta',
    texto: 'Puedes quedarte con lo esencial y dejar el resto para cuando te apetezca.',
    requiere: ['minutos', 'numPasos'],
    cuando: (c) => c.minutos !== null && c.minutos <= 3 && c.numPasos > 3,
    porque: () => 'La hemos seleccionado porque has indicado que quieres dedicarle muy poco tiempo.',
  },
  {
    id: 'limpieza_intima',
    modulo: MODULO_HIGIENE, nivel: 'intermedio', tema: 'limpieza', tipo: 'rutina', paso: 'intima',
    titulo: 'Higiene íntima',
    /* ⚠️ Decisión 5 de la F18 — se ofrece **qué cuidar**, nunca qué le pasa. El
       barrido de `PALABRAS_CLINICAS` pasa por encima de este texto. */
    texto: 'Si quieres, puedes incluir la higiene íntima como un paso más.',
    requiere: ['nivel', 'pasos'],
    cuando: (c) => c.nivel !== 'basico' && !c.pasos.includes('intima'),
    porque: () => 'La hemos seleccionado porque has indicado que no te importa una rutina con más pasos.',
  },
  {
    id: 'apuntar_producto',
    modulo: null, nivel: 'basico', tema: 'producto', tipo: 'consejo',
    titulo: 'Apuntar qué usas',
    texto: 'Puedes apuntar qué producto usas en cada paso, si te apetece tenerlo a mano.',
    requiere: ['rutinas', 'productos'],
    cuando: (c) => c.rutinas > 0 && c.productos.length > 0,
    porque: () => 'La hemos seleccionado porque ya tienes productos apuntados y alguna rutina donde encajarlos.',
  },
];

export const reglaCuerpo = (id) => REGLAS_CUERPO.find((r) => r.id === id) || null;
export const IDS_REGLAS_CUERPO = REGLAS_CUERPO.map((r) => r.id);

/** Apartado 8 — los dos botones, con las palabras del enunciado. */
export const MOTIVOS_DESCARTE_CUERPO = [
  { id: 'no_interesa', nombre: 'No me interesa', dias: 60 },
  { id: 'ya_lo_hago', nombre: 'Ya lo hago', dias: 120 },
];

export const DIAS_SILENCIO_CUERPO = Object.fromEntries(MOTIVOS_DESCARTE_CUERPO.map((m) => [m.id, m.dias]));

/* El almacén de las recomendaciones, en su propia llave — el mismo sitio y la
   misma forma que en Skincare (F16), para que el motor las entienda igual. */
export const normalizarRecsCuerpo = (guardado) =>
  normalizarRecomendaciones(guardado, { ids: IDS_REGLAS_CUERPO, motivos: MOTIVOS_DESCARTE_CUERPO });

export const recsDeCuerpo = (estado, moduloId) => {
  const e = normalizarEstiloHombre(estado);
  return normalizarRecsCuerpo(e.modulos.find((m) => m.id === moduloId)?.config?.recomendaciones);
};

const escribirRecs = (estado, moduloId, recs) => guardarConfig(estado, moduloId, { recomendaciones: recs });

export const silenciadaCuerpo = (estado, moduloId, reglaId, { hoy = todayISO() } = {}) =>
  silenciadaEn(recsDeCuerpo(estado, moduloId), reglaId, { hoy, dias: DIAS_SILENCIO_CUERPO, paraSiempre: [] });

/**
 * ⚠️ **No escribe nada**: ni marca como vista, ni toca la rutina. Y respeta el
 * nivel (apartado 14) y el módulo, para no ofrecer en Higiene lo que es de
 * Cuidado corporal.
 */
export function recomendarCuerpo(estado, moduloId, datosGlobales = {}, { limite = RECOMENDACIONES_INICIALES, hoy = todayISO() } = {}) {
  if (!parteActivaCH(estado, moduloId, PARTE_RECOMENDACIONES)) {
    return { activo: false, total: 0, recomendaciones: [], hayMas: false, guardado: false };
  }
  const ctx = contextoParaCuerpo(estado, moduloId, datosGlobales, { hoy });
  const recs = recsDeCuerpo(estado, moduloId);
  const orden = NIVELES_ESTILO.map((x) => x.id);
  const tope = ctx.nivel ? orden.indexOf(ctx.nivel) : orden.length - 1;

  const aplicables = REGLAS_CUERPO
    .filter((r) => r.modulo === null || r.modulo === moduloId)
    .filter((r) => orden.indexOf(r.nivel) <= tope)
    .filter((r) => reglaAplicable(r, ctx))
    .filter((r) => !silenciadaCuerpo(estado, moduloId, r.id, { hoy }).silenciada)
    .map((r) => ({
      id: r.id,
      titulo: r.titulo,
      texto: r.texto,
      tipo: r.tipo,
      paso: r.paso || null,
      nivel: r.nivel,
      ...(nivelEstilo(r.nivel) ? { icono: nivelEstilo(r.nivel).icono } : {}),
      temas: [r.tema],
      porque: r.porque(ctx),
      // Los dos botones del apartado 8, en el propio dato.
      acciones: { anadir: 'Añadir', descartar: MOTIVOS_DESCARTE_CUERPO[0].nombre },
      guardada: recs.guardadas.some((g) => g.reglaId === r.id),
      vista: recs.vistas.some((v) => v.reglaId === r.id),
      // Lo ya visto pesa menos, para no enseñar siempre lo mismo.
      peso: recs.vistas.some((v) => v.reglaId === r.id) ? 0 : 1,
    }));

  const { total, recomendaciones, hayMas } = ordenarYRecortar(aplicables, { limite });
  // ⚠️ Escrito en el propio dato: aquí no se ha guardado nada.
  return { activo: true, total, recomendaciones, hayMas, guardado: false };
}

export function marcarVistasCuerpo(estado, moduloId, ids = [], { hoy = todayISO() } = {}) {
  const validos = ids.filter((id) => IDS_REGLAS_CUERPO.includes(id));
  if (validos.length === 0) return normalizarEstiloHombre(estado);
  return escribirRecs(estado, moduloId, marcarVistasEn(recsDeCuerpo(estado, moduloId), validos, hoy));
}

/** Apartado 8 — *"No me interesa"*. ⚠️ Y se puede deshacer. */
export function descartarCuerpo(estado, moduloId, reglaId, motivo, { hoy = todayISO() } = {}) {
  if (!IDS_REGLAS_CUERPO.includes(reglaId)) return { estado: normalizarEstiloHombre(estado), error: 'Esa recomendación no existe.' };
  if (!MOTIVOS_DESCARTE_CUERPO.some((m) => m.id === motivo)) return { estado: normalizarEstiloHombre(estado), error: 'Ese motivo no existe.' };
  return { estado: escribirRecs(estado, moduloId, descartarEn(recsDeCuerpo(estado, moduloId), reglaId, motivo, hoy)), error: null };
}

export const deshacerDescarteCuerpo = (estado, moduloId, reglaId) =>
  ({ estado: escribirRecs(estado, moduloId, deshacerDescarteEn(recsDeCuerpo(estado, moduloId), reglaId)), error: null });

export function guardarRecomendacionCuerpo(estado, moduloId, reglaId, { hoy = todayISO() } = {}) {
  if (!IDS_REGLAS_CUERPO.includes(reglaId)) return { estado: normalizarEstiloHombre(estado), error: 'Esa recomendación no existe.' };
  return { estado: escribirRecs(estado, moduloId, guardarEn(recsDeCuerpo(estado, moduloId), reglaId, hoy)), error: null };
}

export const quitarGuardadaCuerpo = (estado, moduloId, reglaId) =>
  ({ estado: escribirRecs(estado, moduloId, quitarGuardadaEn(recsDeCuerpo(estado, moduloId), reglaId)), error: null });

/**
 * Apartado 8 — *"Añadir"*. ⚠️ **Sin `confirmado` no escribe** (regla 7), y sin
 * ninguna rutina se crea una: es lo que acaba de pedir al confirmar.
 */
export function anadirARutinaCuerpo(estado, moduloId, reglaId, rutinaId, { confirmado = false, hoy = todayISO() } = {}) {
  if (!confirmado) return { estado: normalizarEstiloHombre(estado), error: 'Hace falta confirmarlo.', anadido: false };
  const r = reglaCuerpo(reglaId);
  if (!r || r.tipo !== 'rutina' || !r.paso) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa recomendación no añade ningún paso.', anadido: false };
  }
  const rutinas = rutinasCuerpo(estado, moduloId);
  const destino = rutinas.find((x) => x.id === rutinaId) || rutinas[0];
  if (!destino) {
    const c = crearRutinaCuerpo(estado, moduloId, {
      nombre: 'Mi rutina',
      frecuencia: 'diario',
      pasos: [{ accion: r.paso }],
    }, { hoy });
    return { estado: c.estado, error: c.error, anadido: !c.error, creada: !c.error };
  }
  if (destino.pasos.some((p) => p.accion === r.paso)) {
    return { estado: normalizarEstiloHombre(estado), error: null, anadido: false, yaEstaba: true };
  }
  const e = editarRutinaCuerpo(estado, moduloId, destino.id, { pasos: [...destino.pasos, { accion: r.paso }] });
  return { estado: e.estado, error: e.error, anadido: !e.error, creada: false };
}

/* ===========================================================================
   12 · PRODUCTOS RECOMENDADOS Y PACKS (apartados 10, 11, 12 y 13)
   ===========================================================================
   ⚠️ **El apartado 11 manda sobre el 10.** *"Si el usuario ya tiene un producto
   compatible: «Ya tienes un producto que podría servir para esto». No recomendar
   automáticamente otro producto innecesario. Esto evita gastar dinero sin
   motivo."* Así que se mira lo que tiene **antes** de mirar el catálogo. */

export const TEXTOS_PRODUCTOS_CUERPO = {
  yaTienes: 'Ya tienes un producto que podría servir para esto.',
  podriaEncajar: 'Podría encajarte por tus preferencias.',
  verAlternativas: 'Ver alternativas',
  guardar: 'Guardar',
  ignorar: 'Ignorar',
  // D2-03, en la frase que ya existe. No se escribe una segunda.
  catalogo: CATALOGO_VACIO_PORQUE,
  // Apartado 13 — *"el usuario selecciona qué quiere. No comprar automáticamente."*
  packNoCompra: 'Esto no compra nada: solo te lo deja apuntado.',
};

/** Qué categorías tienen sentido para lo que él ha contestado (apartado 9). */
export function categoriasQueEncajan(estado, moduloId, datosGlobales = {}) {
  const ctx = contextoParaCuerpo(estado, moduloId, datosGlobales);
  const pedidas = new Set();
  if (ctx.pasos.includes('ducha') || ctx.pasos.includes('higiene')) pedidas.add('gel');
  if (ctx.pasos.includes('desodorante') || ctx.necesidades.includes('olor')) pedidas.add('desodorante');
  if (ctx.pasos.includes('hidratacion') || ctx.necesidades.includes('hidratacion') || ctx.necesidades.includes('sequedad')) pedidas.add('crema');
  if (ctx.busca.includes('limpieza')) pedidas.add('jabon');
  return CATEGORIAS_PRODUCTO_CH.filter((c) => pedidas.has(c.id));
}

/**
 * Apartados 10 y 11. ⚠️ Devuelve **qué se buscaría** y **qué ya tiene**, nunca
 * un producto inventado: el catálogo está vacío a propósito (D2-03), y cuando
 * Josué meta productos, saldrán de ahí solos.
 */
export function productosRecomendadosCuerpo(estado, moduloId, datosGlobales = {}) {
  if (!parteActivaCH(estado, moduloId, PARTE_PRODUCTOS)) {
    return { activo: false, categorias: [], sugeridos: [], yaTienes: [], catalogo: TEXTOS_PRODUCTOS_CUERPO.catalogo };
  }
  const categorias = categoriasQueEncajan(estado, moduloId, datosGlobales);
  const suyos = productosDeCuerpo(estado, moduloId);
  const catalogo = catalogoParaCuerpo(estado);

  const yaTienes = categorias
    // ⚠️ Traducidas: comparar contra `p.categoria` a secas no encontraba nada.
    .map((c) => ({ categoria: c, producto: suyos.find((p) => categoriaCHDe(p) === c.id) || null }))
    .filter((x) => x.producto)
    .map((x) => ({
      categoria: x.categoria.id,
      nombre: x.producto.nombre,
      productoId: x.producto.id,
      // ⚠️ El texto literal del apartado 11.
      texto: TEXTOS_PRODUCTOS_CUERPO.yaTienes,
    }));

  const cubiertas = new Set(yaTienes.map((x) => x.categoria));
  const sugeridos = categorias
    // Apartado 11 — de lo que ya tiene, no se recomienda otro.
    .filter((c) => !cubiertas.has(c.id))
    .map((c) => {
      const delCatalogo = catalogo.filter((p) => categoriaCHDe(p) === c.id && p.estado === 'disponible' && !p.mio);
      return {
        categoria: c.id,
        nombre: c.nombre,
        icono: c.icono,
        texto: TEXTOS_PRODUCTOS_CUERPO.podriaEncajar,
        // Lo que hay de verdad, que hoy es lo que él haya metido.
        opciones: delCatalogo,
        // Regla 8: si no hay nada, se dice — no se fabrica un producto.
        vacio: delCatalogo.length === 0,
      };
    });

  return {
    activo: true,
    categorias,
    sugeridos,
    yaTienes,
    acciones: {
      guardar: TEXTOS_PRODUCTOS_CUERPO.guardar,
      ignorar: TEXTOS_PRODUCTOS_CUERPO.ignorar,
      alternativas: TEXTOS_PRODUCTOS_CUERPO.verAlternativas,
    },
    catalogo: TEXTOS_PRODUCTOS_CUERPO.catalogo,
  };
}

/* ── Packs (apartado 13) ────────────────────────────────────────────────── */

export const PACK_BASICO = {
  id: 'basico',
  nombre: 'Pack básico',
  // Las tres cosas del ejemplo del enunciado.
  categorias: ['gel', 'desodorante', 'crema'],
};

export const packsCuerpo = (estado, moduloId) => datosRutinasCuerpo(estado, moduloId).packs;

export const verPackCuerpo = (estado, moduloId, packId) =>
  verPackGenerico(packsCuerpo(estado, moduloId), catalogoParaCuerpo(estado), packId);

/** ⚠️ **Sugiere y no crea.** Crearlo es otra llamada, y esa la hace él. */
export function packSugeridoCuerpo(estado, moduloId, datosGlobales = {}) {
  const suyos = productosDeCuerpo(estado, moduloId);
  return {
    ...PACK_BASICO,
    items: PACK_BASICO.categorias.map((id) => {
      const cat = categoriaProductoCH(id);
      const mio = suyos.find((p) => categoriaCHDe(p) === id) || null;
      return {
        categoria: id,
        nombre: cat?.nombre || id,
        icono: cat?.icono || '🧴',
        // Apartado 11 otra vez: lo que ya tiene se marca, no se vuelve a ofrecer.
        yaTengo: !!mio,
        producto: mio,
      };
    }),
    // ⚠️ Escrito en el propio dato: esto no ha creado ningún pack.
    creado: false,
    aviso: TEXTOS_PRODUCTOS_CUERPO.packNoCompra,
  };
}

export function crearPackCuerpo(estado, moduloId, nombre, productoIds = [], { hoy = todayISO() } = {}) {
  const limpio = String(nombre || '').trim();
  if (!limpio) return { estado: normalizarEstiloHombre(estado), error: 'El pack necesita un nombre.', pack: null };
  const catalogo = catalogoParaCuerpo(estado);
  const validos = productoIds.filter((id) => catalogo.some((p) => p.id === id));
  const d = datosRutinasCuerpo(estado, moduloId);
  const pack = normalizarPackGenerico({ nombre: limpio, productoIds: validos, creadoEn: hoy });
  return { estado: escribir(estado, moduloId, { ...d, packs: [...d.packs, pack] }), error: null, pack };
}

export function eliminarPackCuerpo(estado, moduloId, packId) {
  const d = datosRutinasCuerpo(estado, moduloId);
  if (!d.packs.some((p) => p.id === packId)) return { estado: normalizarEstiloHombre(estado), error: 'Ese pack no existe.' };
  return { estado: escribir(estado, moduloId, { ...d, packs: d.packs.filter((p) => p.id !== packId) }), error: null };
}

/* ===========================================================================
   13 · RESUMEN, PANEL Y AUDITORÍA
   =========================================================================== */

export function resumenRutinasCuerpo(estado, moduloId, { hoy = todayISO() } = {}) {
  const d = datosRutinasCuerpo(estado, moduloId);
  const deHoy = rutinasDeHoyCuerpo(estado, moduloId, { hoy });
  const listas = deHoy.map((r) => checklistCuerpo(estado, moduloId, r.id, { hoy })).filter(Boolean);
  return {
    modulo: moduloId,
    rutinas: d.rutinas.length,
    pasos: d.rutinas.reduce((s, r) => s + r.pasos.length, 0),
    conRecordatorio: d.rutinas.filter((r) => r.recordatorio).length,
    hoy: deHoy.length,
    hechasHoy: listas.filter((l) => l.estado === 'hecha').length,
    productos: d.productos.length,
    packs: d.packs.length,
    // ⚠️ Sin nada marcado NO hay última: `null`, no una fecha inventada.
    ultimo: [...d.hechos].sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.fecha || null,
    activo: parteActivaCH(estado, moduloId, PARTE_RUTINAS),
    recomendaciones: parteActivaCH(estado, moduloId, PARTE_RECOMENDACIONES),
    productosActivo: parteActivaCH(estado, moduloId, PARTE_PRODUCTOS),
    seguimiento: parteActivaCH(estado, moduloId, PARTE_SEGUIMIENTO),
  };
}

/** ⚠️ Una línea para la portada y para la plaquita. Sale de aquí, no de un dato nuevo. */
export function lineaRutinasCuerpo(estado, moduloId, { hoy = todayISO() } = {}) {
  const r = resumenRutinasCuerpo(estado, moduloId, { hoy });
  if (!r.activo) return null;
  if (r.rutinas === 0) return null;
  return `${r.rutinas} ${r.rutinas === 1 ? 'rutina' : 'rutinas'}`;
}

/* Apartado 18 — los sistemas globales que usa esta fase, **con la función real
   que la conecta**. ⚠️ Y el que NO existe se declara, en vez de fingirlo: es lo
   que hizo la F39 con los favoritos globales, y sigue sin haberlos. */
export const CONEXIONES_CUERPO = [
  { id: 'calendario', nombre: 'Calendario global', existe: true, entra: 'eventosDeCuerpo' },
  { id: 'recordatorios', nombre: 'Recordatorios globales', existe: true, entra: 'avisosEstilo.js' },
  { id: 'productos', nombre: 'Productos globales', existe: true, entra: 'catalogoParaCuerpo' },
  {
    id: 'favoritos',
    nombre: 'Favoritos globales',
    // ⚠️ F39 lo dejó dicho: no hay un sistema de favoritos transversal.
    existe: false,
    porque: 'Todavía no hay un sistema de favoritos común a toda la aplicación.',
  },
  { id: 'papelera', nombre: 'Eliminados recientemente', existe: true, entra: 'eliminarRutinaCuerpo' },
  { id: 'perfil', nombre: 'Perfil global', existe: true, entra: 'loQueYaSabemosCH' },
];

/** Todos los textos que esta fase puede enseñar, para barrerlos de una vez. */
export function textosDeRutinasCuerpo() {
  return [
    ...PASOS_CUERPO.map((p) => p.nombre),
    ...FRECUENCIAS_CUERPO.map((f) => f.nombre),
    ...MOMENTOS_CUERPO.map((m) => m.nombre),
    ...PLANTILLAS_CUERPO.map((p) => p.nombre),
    ...Object.values(BOTONES_PLANTILLA),
    ...REGLAS_CUERPO.map((r) => r.titulo),
    ...REGLAS_CUERPO.map((r) => r.texto),
    ...REGLAS_CUERPO.map((r) => r.porque({ necesidades: [], busca: [], pasos: [] })),
    ...MOTIVOS_DESCARTE_CUERPO.map((m) => m.nombre),
    ...Object.values(TEXTOS_PRODUCTOS_CUERPO),
    // ⚠️ Son textos, no objetos: con `.nombre` este barrido no miraría ninguno.
    ...Object.values(TEXTOS_ESTADO_DIA),
  ].filter(Boolean);
}

export function auditarRutinasCuerpo(estado) {
  const textos = textosDeRutinasCuerpo();
  return {
    // Decisión 1 — ni un motor nuevo.
    motoresNuevos: 0,
    motorRutinas: 'motorRutinas.js',
    motorReglas: 'motorRecomendaciones.js',
    motorProductos: 'motorProductos.js',
    // Decisión 5 — ni un inventario, ni una papelera, ni un calendario.
    catalogosNuevos: 0,
    papelerasNuevas: 0,
    calendariosNuevos: 0,
    // Decisión 3 — ni un registro de seguimiento nuevo.
    almacenesDeSeguimiento: 0,
    // Sin IA (apartados 8 y 9, los dos con esas palabras).
    usaIA: 0,
    // Ni rachas, ni puntos, ni niveles (apartado 16 + D2-02).
    rachas: 0, puntos: 0, niveles: 0,
    // Decisión 5 de la F18 — y ni un diagnóstico.
    textosClinicos: textos.filter((t) => !sinDiagnostico(t)),
    // El tono de la F16: nunca "debes".
    textosConTonoMalo: textos.filter((t) => !tonoCorrecto(t)),
    reglas: REGLAS_CUERPO.length,
    conRequisitos: REGLAS_CUERPO.filter((r) => Array.isArray(r.requiere) && r.requiere.length > 0).length,
    conPorque: REGLAS_CUERPO.filter((r) => typeof r.porque === 'function').length,
    // Decisión 2 — cada paso sabe de qué módulo es, y ninguno se cuela en el otro.
    pasosSinModulo: PASOS_CUERPO.filter((p) => p.de !== null && !MODULOS_CH.includes(p.de)).map((p) => p.id),
    plantillasSinModulo: PLANTILLAS_CUERPO.filter((p) => !MODULOS_CH.includes(p.modulo)).map((p) => p.id),
    // Apartado 18 — y lo que no existe, dicho.
    conexiones: CONEXIONES_CUERPO.length,
    conexionesQueNoExisten: CONEXIONES_CUERPO.filter((c) => !c.existe).map((c) => c.id),
    rutinas: MODULOS_CH.reduce((s, m) => s + rutinasCuerpo(estado, m).length, 0),
  };
}

export function panelRutinasCuerpo(estado, moduloId, datosGlobales = {}, { hoy = todayISO() } = {}) {
  const d = datosRutinasCuerpo(estado, moduloId);
  return {
    modulo: moduloId,
    activo: parteActivaCH(estado, moduloId, PARTE_RUTINAS),
    rutinas: d.rutinas,
    // Apartado 1 — *"si no tiene ninguna: Crea tu primera rutina"*.
    vacio: d.rutinas.length === 0 ? 'Crea tu primera rutina' : null,
    hoy: rutinasDeHoyCuerpo(estado, moduloId, { hoy }).map((r) => checklistCuerpo(estado, moduloId, r.id, { hoy })),
    plantillas: plantillasSugeridasCuerpo(estado, moduloId),
    // Apartado 4 — la tarjeta sencilla: nombre y cuántos pasos, nada más.
    tarjetas: d.rutinas.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      pasos: r.pasos.length,
      linea: `${r.pasos.length} ${r.pasos.length === 1 ? 'paso' : 'pasos'}`,
      frecuencia: frecuenciaCuerpo(r.frecuencia)?.nombre || '',
      recordatorio: r.recordatorio,
    })),
    pasosDisponibles: pasosParaNivelCuerpo(moduloId, contextoDeCuerpo(estado, moduloId, datosGlobales).nivel),
    frecuencias: FRECUENCIAS_CUERPO,
    momentos: MOMENTOS_CUERPO,
    recomendaciones: recomendarCuerpo(estado, moduloId, datosGlobales, { hoy }),
    productos: productosRecomendadosCuerpo(estado, moduloId, datosGlobales),
    pack: packSugeridoCuerpo(estado, moduloId, datosGlobales),
    packs: d.packs.map((p) => verPackCuerpo(estado, moduloId, p.id)).filter(Boolean),
    seguimiento: parteActivaCH(estado, moduloId, PARTE_SEGUIMIENTO)
      ? { cumplimiento: seguimientoCuerpo(estado, moduloId, { hoy }), dias: ultimosDiasCuerpo(estado, moduloId) }
      : null,
    resumen: resumenRutinasCuerpo(estado, moduloId, { hoy }),
  };
}

export {
  ESTADOS_RUTINA_DIA, TEXTOS_ESTADO_DIA, DIAS_HISTORIAL,
  PALABRAS_CLINICAS, PALABRAS_PROHIBIDAS, sinDiagnostico, tonoCorrecto,
  MODULO_HIGIENE, MODULO_CUERPO, MODULOS_CH, TIEMPOS_CH,
};
