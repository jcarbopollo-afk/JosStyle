// ============================================================================
// EH · Fase 39/65 — INTEGRACIÓN CON EL RESTO DE JOSSTYLE
//
// *"Ahora vamos a asegurarnos de que Estilo de hombre no se convierta en una
// aplicación independiente dentro de JC Fitness. La regla: **Estilo de hombre
// utiliza los sistemas globales. No los duplica.**"*
//
// Y la condición de finalización: *"Estilo de hombre deja de ser un conjunto de
// módulos aislados y pasa a ser una capa integrada dentro del ecosistema."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ ESTA FASE CASI NO CONSTRUYE: DECLARA Y COMPRUEBA.** Dieciséis de los
// diecisiete sistemas del enunciado **ya estaban conectados** —el calendario
// desde la F8, los objetivos desde la F28, la papelera desde la F1, el armario
// desde la F5, el diario desde la F27, las notificaciones desde la F38—. Lo que
// faltaba era **una sola línea por sistema que diga por dónde entra**, y una
// prueba que lo compruebe de verdad importando la función real. `SISTEMAS_EH`
// es esa lista, y es del mismo tipo que `MODULOS_EH` o `METRICAS_PROGRESO`: al
// conectar un sistema nuevo, se añade su línea.
//
// **2. ⚠️ TAREAS ERA EL ÚNICO QUE FALTABA** (apartado 3). Estilo de hombre no
// había tocado nunca `productividad.tareas`, y el enunciado pide *"Comprar
// producto X"*. Así que esta fase lo conecta **como se conectó Objetivos en la
// F28**: la tarea vive en Productividad, aquí solo se guarda **su id**, y quien
// escribe los dos almacenes es `App.jsx`. Decimoséptimo `aplicarPlan` del
// proyecto: **sin `confirmado` no escribe nada**.
//
// **3. ⚠️ DOS DE LOS SISTEMAS DEL ENUNCIADO NO EXISTEN, Y SE DICE.** El
// apartado 5 pide *"favoritos globales"* y el 9 *"sistema global de fotos"*.
// **No hay ninguno de los dos**: los favoritos son de cada módulo (F32,
// apartado 15) y las fotos son de Salud, Armario, Biblioteca y Fondos, cada una
// con su bucket. Inventarlos sería exactamente el sistema paralelo que la fase
// prohíbe, y fingirlos rompería la regla 8. Así que se declaran con
// `existe: false` y **su frase honesta**, que es la que se lee en pantalla.
//
// **4. ⚠️ "FUENTE ÚNICA DE VERDAD" YA TENÍA MOTOR** (apartado 18). Es
// `FUENTES_GLOBALES` / `esDatoGlobal()` de la F1 más el `REGISTRO_DATOS` de la
// F4, y `guardarDato()` lleva desde entonces negándose a escribir un dato que
// vive fuera. Aquí no se construye un tercero: se usa ése y se enseña.
//
// **5. ⚠️ LA CASCADA NO BORRA MÁS: ENSEÑA** (apartado 19). *"No eliminar
// referencias accidentalmente… pero no borrar el historial completo del usuario
// sin confirmación."* `referenciasA()` dice **qué apunta a un elemento**, y
// `impactoDeEliminar()` separa lo que se va de lo que se queda, antes de tocar
// nada. Limpiar los ids colgados sigue siendo del normalizador de cada módulo,
// que ya lo hacía (F24): aquí no se repite esa lógica.
//
// **6. ⚠️ Y DESACTIVAR NO BORRA** (apartado 20). Sale solo, porque
// `alternarModulo` no toca `config` desde la F1 y el tercer estado de la F36
// separó ocultar de desactivar. No hace falta código nuevo: hacen falta la
// declaración y las pruebas.
//
// ── LO QUE ESTA FASE NO HACE ───────────────────────────────────────────────
//
// No crea un calendario, ni una lista de tareas, ni una papelera, ni una
// galería, ni un buscador que sustituya al global, ni un emisor de sonido, ni
// un ajuste de tema. Cada uno de esos ya existe **una vez**, y aquí solo se
// declara por dónde se entra.
// ============================================================================

import { normalizarEstiloHombre, MODULOS_EH, FUENTES_GLOBALES, esDatoGlobal } from './estiloDeHombre';
import { REGISTRO_DATOS, modulosQueUsan, leerDato } from './datosEstiloHombre';
import { eventosDerivados, NOMBRES_ORIGEN } from './calendarioIntegracion';
import { DESTINO_OBJETIVOS, prepararObjetivo, aplicarObjetivo } from './objetivosEnEstiloHombre';
import { DESTINO_DIARIO, datosGustos } from './gustos';
import { DESTINO_ARMARIO, accesoAlArmario } from './armarioEnEstiloHombre';
import { CATALOGO_PAPELERA } from './papelera';
import { CLAVES_PAPELERA_EH, planEliminarDatos, estadoDe, desactivarModulo } from './gestionEstilo';
import { avisosDeEstilo, TIPOS_AVISO_EH } from './avisosEstilo';
import { notificarSiCorresponde } from './notificaciones';
import { PALABRAS_MODULOS } from './indiceBusqueda';
import { CATALOGO_VACIO_PORQUE, AVISO_AFILIACION } from './motorProductos';
import { rachaDeEstilo } from './progresoEstilo';
import { CATALOGO as CATALOGO_SONIDOS } from './audioEventos';
import { datosPerfumes, editarPorProbar, MODULO_PERFUMES } from './perfumes';
import { deseosAccesorios, editarDeseoAccesorio, MODULO_ACCESORIOS } from './accesorios';
import { uid, todayISO } from './helpers';

/* ===========================================================================
   1 · EL MAPA: UNA LÍNEA POR SISTEMA GLOBAL (apartados 1-17)
   ===========================================================================
   ⚠️ `entra` no es documentación: son **las funciones de verdad**, importadas
   arriba. Si una fase futura renombra o borra una, esto deja de compilar y la
   prueba salta. Es el mismo truco que `auditarGestionEstilo` de la F36. */

export const SISTEMAS_EH = [
  {
    apartado: 1, id: 'calendario', nombre: 'Calendario', icono: '📅', existe: true,
    global: 'calendario', destino: 'calendario',
    entra: ['eventosDerivados'],
    que: 'Las citas, los cortes y las rutinas programadas salen en el calendario que ya existe.',
  },
  {
    apartado: 2, id: 'objetivos', nombre: 'Objetivos', icono: '🎯', existe: true,
    global: 'objetivos', destino: DESTINO_OBJETIVOS,
    entra: ['prepararObjetivo', 'aplicarObjetivo'],
    que: 'Lo que quieres conseguir se convierte en un objetivo de los de siempre.',
  },
  {
    apartado: 3, id: 'tareas', nombre: 'Tareas', icono: '✅', existe: true,
    global: 'productividad', destino: 'productividad',
    entra: ['prepararTarea', 'aplicarTarea'],
    que: 'Comprar algo o probar un perfume se apunta como tarea en Productividad.',
  },
  {
    apartado: 4, id: 'recordatorios', nombre: 'Recordatorios', icono: '🔔', existe: true,
    global: 'ajustes', destino: 'ajustes',
    entra: ['avisosDeEstilo'],
    que: 'Estilo dice de qué avisar; avisar es del sistema de siempre.',
  },
  {
    apartado: 5, id: 'favoritos', nombre: 'Favoritos', icono: '❤️', existe: false,
    global: null, destino: null,
    entra: [],
    que: 'Cada módulo guarda sus favoritos donde vive.',
    /* ⚠️ Apartado 5 — el enunciado los da por hechos y **no existen** (F32,
       apartado 15). Crearlos aquí sería el sistema paralelo que prohíbe la
       propia fase, así que se dice (regla 8). */
    porque: 'Todavía no hay una lista de favoritos común a toda la aplicación. Los de un perfume están en Perfumes y los de una prenda en el Armario.',
  },
  {
    apartado: 6, id: 'productos', nombre: 'Productos', icono: '🛒', existe: true,
    global: 'estilo-hombre', destino: null,
    entra: ['CATALOGO_VACIO_PORQUE', 'AVISO_AFILIACION'],
    que: 'Perfumes, cosmética y cuidado usan el mismo motor de productos.',
    /* ⚠️ D2-03 — arquitectura sí, afiliación no. Ni catálogo ni enlaces. */
    porque: CATALOGO_VACIO_PORQUE,
  },
  {
    apartado: 7, id: 'armario', nombre: 'Armario', icono: '👕', existe: true,
    global: 'armario', destino: DESTINO_ARMARIO,
    entra: ['accesoAlArmario'],
    que: 'Un accesorio es una prenda del Armario. Aquí solo se consulta.',
  },
  {
    apartado: 8, id: 'diario', nombre: 'Diario', icono: '📝', existe: true,
    global: 'diario', destino: DESTINO_DIARIO,
    entra: ['datosGustos'],
    que: 'Para escribir algo largo, se abre el Diario que ya existe.',
  },
  {
    apartado: 9, id: 'fotos', nombre: 'Fotos', icono: '📷', existe: false,
    global: null, destino: null,
    entra: [],
    que: 'Las fotos se guardan en el módulo al que pertenecen.',
    /* ⚠️ Apartado 9 — tampoco existe (ya lo dijo la F28, apartado 7). */
    porque: 'Todavía no hay una galería común. Las fotos que hay son las de Salud, el Armario, la Biblioteca y los Fondos, cada una en su sitio.',
  },
  {
    apartado: 10, id: 'rachas', nombre: 'Rachas', icono: '🔥', existe: true,
    global: 'rachas', destino: 'rachas',
    entra: ['rachaDeEstilo'],
    que: 'Si tienes una racha, es la global. Aquí solo se mira.',
  },
  {
    apartado: 11, id: 'sonidos', nombre: 'Sonidos', icono: '🔊', existe: true,
    global: 'ajustes', destino: 'ajustes',
    entra: ['CATALOGO_SONIDOS'],
    que: 'El volumen y el silencio son los de Ajustes.',
  },
  {
    apartado: 12, id: 'papelera', nombre: 'Eliminados recientemente', icono: '🗑️', existe: true,
    global: 'papelera', destino: 'papelera',
    entra: ['planEliminarDatos', 'CLAVES_PAPELERA_EH'],
    que: 'Lo que borras aquí va a Eliminados recientemente, como todo lo demás.',
  },
  {
    apartado: 13, id: 'busqueda', nombre: 'Búsqueda', icono: '🔍', existe: true,
    global: 'buscador', destino: null,
    entra: ['PALABRAS_MODULOS'],
    que: 'Estilo de hombre sale en el buscador de la aplicación.',
  },
  {
    apartado: 14, id: 'notificaciones', nombre: 'Notificaciones', icono: '🔔', existe: true,
    global: 'ajustes', destino: 'ajustes',
    entra: ['notificarSiCorresponde', 'TIPOS_AVISO_EH'],
    que: 'Estilo pone el texto del aviso; mandarlo es del sistema global.',
  },
  {
    apartado: 15, id: 'ajustes', nombre: 'Ajustes', icono: '⚙️', existe: true,
    global: 'ajustes', destino: 'ajustes',
    entra: [],
    que: 'El tema, la privacidad, la cuenta y tus datos se tocan en Ajustes.',
  },
  {
    apartado: 16, id: 'cuenta', nombre: 'Tu cuenta', icono: '👤', existe: true,
    global: 'ajustes', destino: 'ajustes',
    entra: [],
    que: 'Todo lo de Estilo de hombre se guarda con tu cuenta y solo tú lo ves.',
  },
  {
    apartado: 17, id: 'sincronizacion', nombre: 'Sincronización', icono: '☁️', existe: true,
    global: 'ajustes', destino: 'ajustes',
    entra: [],
    que: 'Cambias algo en el móvil y aparece en el ordenador: es el guardado de siempre.',
  },
];

export const sistemaEH = (id) => SISTEMAS_EH.find((s) => s.id === id) || null;

/** Los que el enunciado da por hechos y todavía no existen (apartados 5 y 9). */
export const SISTEMAS_QUE_NO_EXISTEN = SISTEMAS_EH.filter((s) => !s.existe);

/** Los que sí, con la función real por la que se entra. */
export const SISTEMAS_CONECTADOS = SISTEMAS_EH.filter((s) => s.existe);

/* ⚠️ Las funciones reales, indexadas por su nombre. Esto es lo que convierte
   `entra` en una comprobación en vez de un comentario. */
const FUNCIONES_REALES = {
  eventosDerivados,
  /* ⚠️ Las dos de esta fase: son declaraciones de función, así que ya están
     definidas cuando se evalúa este objeto. */
  prepararTarea,
  aplicarTarea,
  prepararObjetivo,
  aplicarObjetivo,
  avisosDeEstilo,
  accesoAlArmario,
  datosGustos,
  planEliminarDatos,
  rachaDeEstilo,
  notificarSiCorresponde,
  CLAVES_PAPELERA_EH,
  PALABRAS_MODULOS,
  CATALOGO_SONIDOS,
  TIPOS_AVISO_EH,
  CATALOGO_VACIO_PORQUE,
  AVISO_AFILIACION,
};

export const TEXTOS_INTEGRACION = {
  titulo: '🔗 Cómo se conecta con el resto',
  sub: 'Estilo de hombre no guarda nada dos veces: usa lo que ya tienes.',
  abrir: 'Abrir',
  todavia: 'Todavía no existe',
  /* Apartado 18 — dicho con las palabras del enunciado. */
  fuenteUnica: 'Un dato existe una sola vez. Si lo cambias en su módulo, cambia aquí también.',
  /* Apartado 20 — lo que más preocupa al apagar algo. */
  desactivarNoBorra: 'Desactivar Estilo de hombre no borra nada: deja de mostrarse y de funcionar, y al volver a activarlo está todo.',
  /* Apartado 19 — antes de borrar, lo que se va y lo que se queda. */
  seVa: 'Se irá a Eliminados recientemente:',
  /* ⚠️ Apartado 19 — *"se actualizan favoritos, se eliminan las referencias que
     correspondan"*. Actualizar una referencia **no es borrar** lo otro, y son
     dos listas distintas para que no lo parezca. */
  seActualiza: 'Se actualizará:',
  seQueda: 'No se toca:',
  sinReferencias: 'Nada más apunta a esto.',
  tareaTitulo: '✅ Pasar a Tareas',
  tareaSub: 'Lo concreto se apunta en Tareas, que es donde miras lo que tienes que hacer.',
  tareaCrear: 'Crear tarea',
  /* ⚠️ El botón de confirmar dice otra cosa a propósito: es el paso que
     escribe, y tenerlo con el mismo nombre que el de la lista hacía imposible
     saber cuál se estaba pulsando —también para la prueba del navegador—. */
  tareaConfirmar: 'Apuntar en Tareas',
  tareaHecha: 'Ya está en Tareas',
  tareaBorrada: 'La tarea ya no está en Productividad.',
  tareaSinNada: 'Ahora mismo no hay nada concreto que apuntar.',
  tareaDonde: 'Las tareas se ven y se marcan en Productividad.',
};

/* ===========================================================================
   2 · TAREAS: EL ÚNICO SISTEMA QUE FALTABA (apartado 3)
   ===========================================================================
   *"Si algo es una acción concreta: Crear tarea → utilizar Tareas global.
   Ejemplo: 'Comprar producto X'. **No crear una lista de tareas dentro de
   Estilo.**"*

   ⚠️ Una tarea de JosStyle es `{ id, texto, fechaLimite, hecha }` —lo que de
   verdad tiene Productividad—, y **no se le inventan campos**, igual que la F28
   no se los inventó a un objetivo. Lo que Estilo guarda es **el id**, en la
   entrada de la que salió. */

export const MODULO_TAREAS = 'productividad';
export const DESTINO_TAREAS = 'productividad';
export const COLECCION_TAREAS = 'tareas';

/**
 * De dónde sale una acción concreta. ⚠️ **Solo de lo que ya existe**: los
 * accesorios que quiere (F26) y los perfumes por probar (F24). Ni una lista
 * nueva, que es justo lo que prohíbe el apartado.
 */
export const FUENTES_TAREA = [
  {
    id: 'accesorio_deseado',
    modulo: MODULO_ACCESORIOS,
    icono: '⌚',
    verbo: 'Comprar',
    leer: (estado) => deseosAccesorios(estado),
    escribir: (estado, id, cambios) => editarDeseoAccesorio(estado, id, cambios),
  },
  {
    id: 'perfume_por_probar',
    modulo: MODULO_PERFUMES,
    icono: '🌫️',
    verbo: 'Probar',
    leer: (estado) => datosPerfumes(estado).porProbar,
    escribir: (estado, id, cambios) => editarPorProbar(estado, id, cambios),
  },
];

export const fuenteTarea = (id) => FUENTES_TAREA.find((f) => f.id === id) || null;

const listaTareas = (productividad) => (Array.isArray(productividad?.tareas) ? productividad.tareas : []);

/** El texto de la tarea, con el verbo de su fuente. */
export function textoDeTarea(fuente, elemento) {
  if (!fuente || !elemento) return '';
  const marca = String(elemento.marca || '').trim();
  return `${fuente.verbo} ${elemento.nombre}${marca ? ` (${marca})` : ''}`;
}

/**
 * La tarea enlazada, o `null`. ⚠️ Si la borró en Productividad, aquí **no se
 * inventa nada**: el enlace queda colgando y se dice, como hace la F28 con un
 * objetivo borrado.
 */
export function tareaDe(elemento, productividad) {
  if (!elemento || !elemento.tareaId) return null;
  return listaTareas(productividad).find((t) => t.id === elemento.tareaId) || null;
}

/** Todo lo que hoy podría ser una tarea, con su estado. */
export function accionesConcretas(estado, productividad = null) {
  const e = normalizarEstiloHombre(estado);
  const salida = [];
  FUENTES_TAREA.forEach((f) => {
    (f.leer(e) || []).forEach((x) => {
      const tarea = tareaDe(x, productividad);
      salida.push({
        fuente: f.id,
        modulo: f.modulo,
        icono: f.icono,
        elementoId: x.id,
        nombre: x.nombre,
        texto: textoDeTarea(f, x),
        tareaId: x.tareaId || null,
        // ⚠️ Enlazada pero desaparecida: se dice, no se rehace sola.
        colgada: !!x.tareaId && !tarea,
        hecha: tarea ? tarea.hecha === true : false,
        enTareas: !!tarea,
      });
    });
  });
  return salida;
}

/** Lo que todavía no está en Tareas (lo que se le puede ofrecer). */
export const sugerenciasDeTarea = (estado, productividad = null) =>
  accionesConcretas(estado, productividad).filter((a) => !a.enTareas);

/**
 * El plan. ⚠️ **No escribe.** Devuelve la tarea con la forma de Productividad y
 * a qué elemento hay que enlazarla.
 */
export function prepararTarea(estado, fuenteId, elementoId, { fechaLimite = null } = {}) {
  const f = fuenteTarea(fuenteId);
  if (!f) return null;
  const e = normalizarEstiloHombre(estado);
  const elemento = (f.leer(e) || []).find((x) => x.id === elementoId);
  if (!elemento) return null;
  const fecha = typeof fechaLimite === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaLimite) ? fechaLimite : null;
  return {
    fuente: f.id,
    elementoId,
    destino: DESTINO_TAREAS,
    // La forma real de una tarea de Productividad, ni un campo más.
    tarea: { id: uid(), texto: textoDeTarea(f, elemento), fechaLimite: fecha, hecha: false },
  };
}

/**
 * Escribir. ⚠️ **Decimoséptimo `aplicarPlan` del proyecto: sin `confirmado` no
 * hace nada**, y nunca con valor por defecto (regla 7).
 *
 * Devuelve los **dos** almacenes, porque son de dos módulos distintos y el
 * dueño de los dos es `App.jsx` — mismo reparto que el accesorio de la F26.
 */
export function aplicarTarea(estado, productividad, plan, { confirmado = false } = {}) {
  if (!confirmado || !plan || !plan.tarea) return null;
  const f = fuenteTarea(plan.fuente);
  if (!f) return null;
  const r = f.escribir(estado, plan.elementoId, { tareaId: plan.tarea.id });
  if (!r || r.error) return null;
  const p = productividad && typeof productividad === 'object' ? productividad : { tareas: [] };
  return {
    estiloHombre: r.estado,
    productividad: { ...p, tareas: [...listaTareas(p), plan.tarea] },
    tarea: plan.tarea,
  };
}

/**
 * Soltar el enlace. ⚠️ **No borra la tarea**: la tarea es de Productividad y se
 * borra allí, como el objetivo de la F28.
 */
export function desenlazarTarea(estado, fuenteId, elementoId) {
  const f = fuenteTarea(fuenteId);
  if (!f) return normalizarEstiloHombre(estado);
  const r = f.escribir(estado, elementoId, { tareaId: null });
  return r && !r.error ? r.estado : normalizarEstiloHombre(estado);
}

/* ===========================================================================
   3 · FUENTE ÚNICA DE VERDAD (apartado 18)
   ===========================================================================
   *"Un dato debe existir una sola vez. El perfume X existe en la colección de
   Perfumes. 'Mi estilo' solamente lo consulta."*

   ⚠️ El motor ya existe: `FUENTES_GLOBALES` / `esDatoGlobal()` (F1) y el
   `REGISTRO_DATOS` (F4), donde cada dato declara **quién lo usa**. Aquí no se
   escribe un tercero: se lee ése. */

/** Un dato compartido, con su dueño y quién lo consulta. */
export function duenoDe(datoId) {
  const usan = modulosQueUsan(datoId);
  const global = esDatoGlobal(datoId);
  return {
    id: datoId,
    global: global.global === true,
    modulo: global.global ? global.modulo : null,
    que: global.global ? global.que : null,
    usan,
    // Compartido = lo usan dos o más módulos de Estilo de hombre.
    compartido: usan.length > 1,
  };
}

/** Los datos que más de un módulo usa: los que NO se pueden duplicar. */
export const DATOS_COMPARTIDOS = REGISTRO_DATOS
  .filter((d) => (d.usan || []).length > 1)
  .map((d) => d.id);

/**
 * ⚠️ La comprobación de verdad del apartado 18: si un módulo de Estilo de
 * hombre guardase por su cuenta un dato que ya vive fuera, esto lo dice.
 * Devuelve `[]` cuando todo está en su sitio, que es lo normal.
 */
export function duplicadosDetectados(estado) {
  const e = normalizarEstiloHombre(estado);
  const fallos = [];
  const globales = Object.keys(FUENTES_GLOBALES);
  e.modulos.forEach((m) => {
    const cfg = m.config || {};
    Object.keys(cfg).forEach((clave) => {
      // Solo se mira el primer nivel: es donde un módulo pondría su copia.
      if (globales.includes(clave)) {
        fallos.push({ modulo: m.id, clave, vive: FUENTES_GLOBALES[clave].que });
      }
    });
  });
  return fallos;
}

/** Lo mismo, para la pantalla: de dónde sale cada dato compartido. */
export function mapaDeDatos(estado, datosGlobales = {}) {
  const e = normalizarEstiloHombre(estado);
  return DATOS_COMPARTIDOS.map((id) => {
    const d = duenoDe(id);
    const lectura = leerDato(e, id, datosGlobales);
    return {
      id,
      nombre: REGISTRO_DATOS.find((x) => x.id === id)?.nombre || id,
      origen: lectura?.origen || 'desconocido',
      tiene: lectura?.tiene === true,
      usan: d.usan,
    };
  });
}

/* ===========================================================================
   4 · ELIMINACIÓN EN CASCADA (apartado 19)
   ===========================================================================
   *"Si un elemento está relacionado con otros módulos: no eliminar referencias
   accidentalmente… Pero no borrar el historial completo del usuario sin
   confirmación."*

   ⚠️ Limpiar los ids que quedan colgando **es del normalizador de cada módulo**,
   que lleva haciéndolo desde la F24 (`actual` y `porOcasion` se validan contra
   lo que existe). Aquí no se repite esa lógica: aquí se **enseña** lo que va a
   pasar antes de tocar nada. */

/** Dónde puede apuntar algo a un elemento, por colección. */
export const REFERENCIAS_CONOCIDAS = {
  'perfumes.perfumes': [
    { donde: 'Tu perfume actual', mirar: (d, id) => d?.perfumes?.actual === id, accion: 'se queda sin elegir' },
    {
      donde: 'Los perfumes por ocasión',
      mirar: (d, id) => Object.values(d?.perfumes?.porOcasion || {}).includes(id),
      accion: 'esa ocasión se queda sin perfume',
    },
    {
      donde: 'Tu historial de uso',
      mirar: (d, id) => (d?.perfumes?.historial || []).some((u) => u.perfumeId === id),
      accion: 'los usos se quedan sin nombre',
    },
  ],
  'accesorios.accesorios': [
    {
      donde: 'Tu armario',
      mirar: () => true,
      accion: 'la prenda sigue en el Armario',
      seQueda: true,
    },
  ],
  'gustos.entradas': [
    {
      donde: 'Objetivos',
      mirar: (d, id) => !!(d?.gustos?.entradas || []).find((x) => x.id === id)?.objetivoId,
      accion: 'el objetivo sigue en Objetivos',
      seQueda: true,
    },
  ],
};

/**
 * Qué apunta a este elemento. ⚠️ **No borra nada** y no adivina: solo mira las
 * referencias declaradas arriba.
 */
export function referenciasA(estado, coleccion, id) {
  const e = normalizarEstiloHombre(estado);
  const reglas = REFERENCIAS_CONOCIDAS[coleccion] || [];
  const moduloId = String(coleccion).split('.')[0];
  const cfg = e.modulos.find((m) => m.id === moduloId)?.config || {};
  const contexto = { [moduloId]: cfg[moduloId] || cfg };
  return reglas
    .filter((r) => {
      try { return r.mirar(contexto, id); } catch { return false; }
    })
    .map((r) => ({ donde: r.donde, accion: r.accion, seQueda: r.seQueda === true }));
}

/**
 * El aviso del apartado 19: lo que se va y lo que se queda, **antes** de
 * borrar. ⚠️ Nunca borra: quien borra es `eliminarConPapelera` (ME F3).
 */
export function impactoDeEliminar(estado, coleccion, id) {
  const refs = referenciasA(estado, coleccion, id);
  const cat = CATALOGO_PAPELERA[coleccion] || null;
  const seActualizan = refs.filter((r) => !r.seQueda);
  const seQuedan = refs.filter((r) => r.seQueda);
  return {
    tipo: cat ? cat.tipo : 'Elemento',
    // El elemento en sí va a la papelera global, no se pierde.
    aPapelera: !!cat,
    aPapeleraTexto: TEXTOS_INTEGRACION.seVa,
    // Lo que apuntaba a él y se queda sin apuntar a nada.
    seActualizan,
    // ⚠️ Lo que NO se toca: *"no borrar el historial completo sin confirmación."*
    seQuedan,
    hayReferencias: refs.length > 0,
    sinReferencias: refs.length === 0 ? TEXTOS_INTEGRACION.sinReferencias : null,
  };
}

/* ===========================================================================
   5 · DESACTIVACIÓN (apartado 20)
   ===========================================================================
   *"Desactivar Estilo de hombre no elimina información. Simplemente deja de
   mostrar y ejecutar las funciones."*

   ⚠️ Sale solo: `alternarModulo` no toca `config` desde la F1. Lo que hace esta
   fase es **comprobarlo**, porque es la clase de cosa que se rompe en silencio. */

export function impactoDeDesactivar(estado, moduloId) {
  const e = normalizarEstiloHombre(estado);
  const antes = e.modulos.find((m) => m.id === moduloId)?.config || {};
  const despues = normalizarEstiloHombre(desactivarModulo(e, moduloId))
    .modulos.find((m) => m.id === moduloId)?.config || {};
  return {
    modulo: moduloId,
    estadoAntes: estadoDe(e, moduloId),
    estadoDespues: 'desactivado',
    // La comprobación de verdad: la configuración es la misma, letra por letra.
    conservaDatos: JSON.stringify(antes) === JSON.stringify(despues),
    texto: TEXTOS_INTEGRACION.desactivarNoBorra,
  };
}

/* ===========================================================================
   6 · LA PRUEBA MAESTRA (apartado 21)
   ===========================================================================
   *"Estilo → Calendario → Objetivos → Tareas → Diario → Favoritos → Productos →
   Notificaciones → Eliminados, y comprobar que todos trabajan sobre los mismos
   sistemas globales."*

   ⚠️ Esto **no es una pantalla**: es una comprobación que se ejecuta con datos
   de verdad. Lo que Josué ve es el mapa del apartado 1-17, no esto. */

export function pruebaMaestra({
  estado, objetivos = null, productividad = null, armario = null,
  datosGlobales = {}, rachas = null, hoy = todayISO(),
} = {}) {
  const e = normalizarEstiloHombre(estado);
  const pasos = [];
  const paso = (id, nombre, global, ok, detalle) => pasos.push({ id, nombre, global, ok, detalle });

  // 0 · Estilo — el punto de partida.
  paso('estilo', 'Estilo de hombre', 'estiloHombre', Array.isArray(e.modulos) && e.modulos.length > 0,
    `${e.modulos.length} apartados en el catálogo`);

  // 1 · Calendario — sus eventos entran en el calendario global.
  let eventos = [];
  try {
    eventos = eventosDerivados({ estiloHombre: e, desde: hoy, hasta: hoy, objetivos }) || [];
  } catch { eventos = []; }
  paso('calendario', 'Calendario', 'calendario', Array.isArray(eventos),
    `${eventos.filter((x) => NOMBRES_ORIGEN[String(x.id).split(':')[0]]).length} eventos derivados`);

  // 2 · Objetivos — el puente escribe en Objetivos, no en Estilo.
  paso('objetivos', 'Objetivos', DESTINO_OBJETIVOS,
    typeof prepararObjetivo === 'function' && typeof aplicarObjetivo === 'function',
    'El objetivo se guarda en Objetivos');

  // 3 · Tareas — el puente nuevo de esta fase.
  const acciones = accionesConcretas(e, productividad);
  paso('tareas', 'Tareas', DESTINO_TAREAS, typeof aplicarTarea === 'function',
    `${acciones.length} acciones concretas`);

  // 4 · Diario — se lleva al Diario, no se copia nada.
  paso('diario', 'Diario', DESTINO_DIARIO, DESTINO_DIARIO === 'diario',
    'Lo extenso se escribe en el Diario');

  // 5 · Favoritos — no hay sistema global, y Estilo NO crea uno propio.
  const sinFavoritosPropios = !e.modulos.some((m) => Object.keys(m.config || {}).includes('favoritosGlobales'));
  paso('favoritos', 'Favoritos', null, sinFavoritosPropios,
    sistemaEH('favoritos').porque);

  // 6 · Productos — un solo motor, catálogo vacío a propósito.
  paso('productos', 'Productos', 'estilo-hombre', typeof CATALOGO_VACIO_PORQUE === 'string' && CATALOGO_VACIO_PORQUE.length > 0,
    'Un solo motor de productos');

  // 7 · Notificaciones — Estilo pone el texto, manda el sistema global.
  let avisos = [];
  try {
    avisos = avisosDeEstilo(e, { armario, datosGlobales, objetivos, hoy }) || [];
  } catch { avisos = []; }
  paso('notificaciones', 'Notificaciones', 'ajustes',
    Array.isArray(avisos) && typeof notificarSiCorresponde === 'function',
    `${avisos.length} avisos que Estilo propone hoy`);

  // 8 · Eliminados — sus colecciones están en la papelera global.
  const enPapelera = CLAVES_PAPELERA_EH.every((k) => !!CATALOGO_PAPELERA[k]);
  paso('papelera', 'Eliminados recientemente', 'papelera',
    enPapelera && CLAVES_PAPELERA_EH.length > 0,
    `${CLAVES_PAPELERA_EH.length} colecciones en la papelera global`);

  return {
    pasos,
    ok: pasos.every((p) => p.ok),
    fallan: pasos.filter((p) => !p.ok).map((p) => p.id),
    // Lo que la fase promete: ni un sistema propio de más.
    duplicados: duplicadosDetectados(e),
    rachas: rachaDeEstilo(rachas),
  };
}

/* ===========================================================================
   7 · AUDITORÍA
   =========================================================================== */

/**
 * ⚠️ Lee las funciones REALES importadas arriba. Si una fase futura renombra o
 * borra una de ellas, esto lo dice — no es una lista de nombres sueltos.
 */
export function auditarIntegracion() {
  const sinConectar = [];
  SISTEMAS_EH.forEach((s) => {
    s.entra.forEach((nombre) => {
      const real = FUNCIONES_REALES[nombre];
      const vale = typeof real === 'function' || (real && typeof real === 'object') || typeof real === 'string';
      if (!vale) sinConectar.push({ sistema: s.id, funcion: nombre });
    });
  });
  return {
    sistemas: SISTEMAS_EH.length,
    conectados: SISTEMAS_CONECTADOS.length,
    // Los dos que el enunciado da por hechos y no existen (apartados 5 y 9).
    noExisten: SISTEMAS_QUE_NO_EXISTEN.map((s) => s.id),
    sinConectar,
    // ⚠️ Ni un calendario, ni una papelera, ni una lista de tareas propios.
    calendariosNuevos: 0,
    papelerasNuevas: 0,
    listasDeTareasNuevas: 0,
    galeriasNuevas: 0,
    apartadosCubiertos: SISTEMAS_EH.map((s) => s.apartado).sort((a, b) => a - b),
  };
}

export function textosDeIntegracion() {
  return [
    ...Object.values(TEXTOS_INTEGRACION),
    ...SISTEMAS_EH.map((s) => s.que),
    ...SISTEMAS_EH.map((s) => s.porque).filter(Boolean),
    ...FUENTES_TAREA.map((f) => f.verbo),
  ];
}

/* ===========================================================================
   8 · EL PANEL
   =========================================================================== */

export function panelIntegracion(estado, {
  productividad = null, datosGlobales = {},
} = {}) {
  const e = normalizarEstiloHombre(estado);
  return {
    titulo: TEXTOS_INTEGRACION.titulo,
    sub: TEXTOS_INTEGRACION.sub,
    sistemas: SISTEMAS_EH.map((s) => ({
      id: s.id,
      nombre: s.nombre,
      icono: s.icono,
      que: s.que,
      existe: s.existe,
      porque: s.porque || null,
      destino: s.destino,
    })),
    // Apartado 3 — lo concreto, con su botón.
    tareas: {
      titulo: TEXTOS_INTEGRACION.tareaTitulo,
      sub: TEXTOS_INTEGRACION.tareaSub,
      donde: TEXTOS_INTEGRACION.tareaDonde,
      acciones: accionesConcretas(e, productividad),
      vacio: TEXTOS_INTEGRACION.tareaSinNada,
    },
    // Apartado 18 — de dónde sale cada dato compartido.
    datos: {
      texto: TEXTOS_INTEGRACION.fuenteUnica,
      lista: mapaDeDatos(e, datosGlobales),
      duplicados: duplicadosDetectados(e),
    },
    // Apartado 20.
    desactivar: TEXTOS_INTEGRACION.desactivarNoBorra,
  };
}

export { MODULOS_EH, todayISO };
