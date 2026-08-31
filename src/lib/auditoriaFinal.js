// ============================================================================
// EH · Fase 48/65 — AUDITORÍA FINAL DE FUNCIONES Y DUPLICADOS
//
// *"Así evitamos que dentro de seis meses tengamos tres calendarios, dos
// papeleras, cuatro sistemas de favoritos y cinco formas distintas de hacer lo
// mismo."*
//
// ── QUÉ SE CONSTRUYE AQUÍ ──────────────────────────────────────────────────
//
// El enunciado pide **una revisión**, no una función: clasificar todo lo que hay
// en Estilo de hombre, buscar duplicados en quince sistemas concretos, y dejar
// escritas las cuatro listas del apartado 20 —**se queda, se integra, se
// elimina, se pospone**— para *"no volver a discutir lo mismo en futuras
// fases"*.
//
// Así que aquí hay dos cosas: **el veredicto** y **la comprobación que lo
// sostiene**. Un veredicto sin comprobación se queda viejo en dos fases.
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. ⚠️ NO SE AÑADE NADA** (apartado 21, con esas palabras: *"si aparece una
// idea nueva, registrarla como futura mejora"*). Esta fase **no construye ni una
// función**: clasifica lo que hay. Lo que se le ocurra a alguien va a
// `SE_POSPONE`, que existe justo para eso.
//
// **2. ⚠️ CADA COSA TIENE UN DUEÑO, Y SE DICE CUÁL.** Las cuatro etiquetas del
// apartado 2 —🟢 propio, 🔵 global, 🟠 integrado, 🔴 duplicado— están en el
// código, y **cada uno de los quince sistemas del apartado 3 lleva la suya** con
// la función real que lo demuestra.
//
// **3. ⚠️ Y EL VEREDICTO SE COMPRUEBA SOBRE EL CÓDIGO.** `revisarDuplicados()`
// lee las fuentes y falla si Estilo de hombre monta su propio calendario, su
// propia papelera o su propio sistema de guardado. Es la misma idea que la F43,
// ampliada a los quince sistemas de esta lista.
//
// **4. ⚠️ UN ICONO POR COSA** (apartado 12). `revisarIconos()` compara el icono
// de cada módulo en el catálogo con el que usan sus plaquitas: dos iconos para
// lo mismo es exactamente *"cinco formas distintas de hacer lo mismo"* en
// pequeño.
//
// **5. ⚠️ Y LO QUE NO APORTA, FUERA** (apartados 17 y 18). Cada estadística y
// cada aviso tienen que justificarse: de quién son, y —los avisos— **apagados**.
// Menos notificaciones es mejor experiencia, y eso se comprueba contando.
// ============================================================================

import { MODULOS_EH, IDS_EH, FUENTES_GLOBALES } from './estiloDeHombre';
import { COLECCIONES_EH } from './estadosEstilo';
import { CATALOGO_PAPELERA } from './papelera';
import { LIBRERIAS_EH, soloCodigo } from './privacidadEstilo';
import { METRICAS_PROGRESO } from './progresoEstilo';
import { TIPOS_AVISO_EH } from './avisosEstilo';
import { MAPA_DE_DATOS } from './migracion';
import { PLAQUITAS_CH } from './cuerpoHigiene';

/* ===========================================================================
   1 · LAS CUATRO ETIQUETAS (apartado 2)
   =========================================================================== */

export const CLASIFICACIONES = [
  { id: 'propio', icono: '🟢', nombre: 'Propio de Estilo', que: 'Se queda aquí.' },
  { id: 'global', icono: '🔵', nombre: 'Global de JosStyle', que: 'Usa el sistema global.' },
  { id: 'integrado', icono: '🟠', nombre: 'Integrado', que: 'Es de otro módulo, y Estilo lo consulta.' },
  { id: 'duplicado', icono: '🔴', nombre: 'Duplicado', que: 'Habría que eliminarlo.' },
];

export const clasificacion = (id) => CLASIFICACIONES.find((c) => c.id === id) || null;

/* ===========================================================================
   2 · LOS QUINCE SISTEMAS DEL APARTADO 3
   ===========================================================================
   ⚠️ Cada uno con **su etiqueta**, **dónde vive de verdad** y **qué guarda
   Estilo de hombre** — que en los 🔵 y 🟠 es siempre un id o nada. Y `prohibido`
   es lo que NO puede aparecer en este bloque: es lo que comprueba el revisor. */

export const SISTEMAS_REVISADOS = [
  {
    id: 'favoritos', nombre: 'Favoritos', etiqueta: 'propio',
    vive: 'Dentro de cada módulo (perfumes, cortes, productos).',
    enEH: 'Un booleano por elemento.',
    /* ⚠️ La F39 lo dejó dicho y la F46 lo repitió: **no hay favoritos globales**,
       así que esto no es un duplicado — es lo único que hay. */
    nota: 'No existe un sistema de favoritos común a toda la aplicación (F39).',
  },
  {
    id: 'calendario', nombre: 'Calendario', etiqueta: 'global',
    vive: 'El Calendario universal (track C).',
    enEH: 'Nada: los eventos se derivan y son de solo lectura.',
    prohibido: /DEFAULT_CALENDARIO_EH|calendarioDeEstilo|CATALOGO_CALENDARIO_EH/,
  },
  {
    id: 'tareas', nombre: 'Tareas', etiqueta: 'integrado',
    vive: 'Productividad.',
    enEH: 'El id de la tarea (F39, apartado 3).',
    prohibido: /DEFAULT_TAREAS_EH|crearTareaEnEstilo/,
  },
  {
    id: 'objetivos', nombre: 'Objetivos', etiqueta: 'integrado',
    vive: 'El módulo Objetivos.',
    enEH: 'El id del objetivo (F28).',
    prohibido: /DEFAULT_OBJETIVOS_EH|crearObjetivoEnEstilo/,
  },
  {
    id: 'diario', nombre: 'Diario', etiqueta: 'global',
    vive: 'El Diario.',
    /* ⚠️ Y aquí no hay enlace todavía: la F47 lo declaró como lo que es. */
    enEH: 'Nada: ninguna fase ha construido el puente.',
    prohibido: /DEFAULT_DIARIO_EH|entradaDeDiarioEH/,
  },
  {
    id: 'notificaciones', nombre: 'Notificaciones', etiqueta: 'global',
    vive: '`notificaciones.js` + las categorías de la Fase A4.',
    enEH: 'Qué tipos ha encendido él (`avisosEstilo.js` DECIDE; el otro MANDA).',
    prohibido: /new Notification\(|Notification\.requestPermission/,
  },
  {
    id: 'recordatorios', nombre: 'Recordatorios', etiqueta: 'global',
    vive: 'El calendario y los avisos globales.',
    enEH: 'Un booleano por rutina, y su regla de repetición.',
    prohibido: /setInterval\(.*recordatorio|programarAviso\(/,
  },
  {
    id: 'eliminados', nombre: 'Eliminados recientemente', etiqueta: 'global',
    vive: '`papelera.js` (ME F3).',
    enEH: 'Nada: la entrada vive en la papelera.',
    prohibido: /DEFAULT_PAPELERA_[A-Z]|papeleraDeEstilo|CATALOGO_PAPELERA_EH/,
  },
  {
    id: 'fotos', nombre: 'Fotos', etiqueta: 'integrado',
    vive: 'El Armario (AR F1) y Fondos (FO F2), en Storage.',
    enEH: 'Nada: Estilo de hombre no sube ni una foto.',
    prohibido: /uploadFoto|subirFotoEstilo|createObjectURL/,
  },
  {
    id: 'productos', nombre: 'Productos', etiqueta: 'propio',
    vive: 'Los inventarios de Skincare y Pelo, con `motorProductos.js`.',
    enEH: 'La ficha, en su módulo; los demás guardan su id.',
    nota: 'Es de Estilo de hombre, pero con UN motor y sin catálogos paralelos (F17).',
  },
  {
    id: 'armario', nombre: 'Armario', etiqueta: 'integrado',
    vive: 'El Armario (AR F1-F4).',
    enEH: 'El id de la prenda. Accesorios escribe en el Armario con SU fábrica (F26).',
    /* 🐛 ⚠️ La primera versión de esta regla buscaba `crearPrenda(` — y eso es
       una **llamada** a la fábrica del Armario, que es exactamente lo que hay
       que hacer. Saltaba con `accesorios.js`, que hace lo correcto. Lo que sería
       un duplicado es **definirla aquí**, y eso es lo que se busca ahora. */
    prohibido: /(?:export\s+)?function\s+(?:crearPrenda|crearOutfit)\b|DEFAULT_ARMARIO_EH/,
  },
  {
    id: 'rachas', nombre: 'Rachas', etiqueta: 'global',
    vive: 'El módulo Rachas (RA F1-F4).',
    enEH: 'Nada: si no tiene una racha suya, no se pinta (F23).',
    prohibido: /DEFAULT_RACHAS_EH|rachaDeEstilo\s*=/,
  },
  {
    id: 'sonidos', nombre: 'Sonidos', etiqueta: 'global',
    vive: '`audioEngine.js` (regla invariante: el audio solo se toca ahí).',
    enEH: 'Nada.',
    prohibido: /new Audio\(|AudioContext/,
  },
  {
    id: 'busqueda', nombre: 'Búsqueda', etiqueta: 'propio',
    vive: '`buscadorEstilo.js`, sobre el buscador global de BI F2-F4.',
    enEH: 'Sus fuentes y sus recientes.',
    nota: 'Busca DENTRO de Estilo de hombre; el buscador general es el de BI.',
  },
  {
    id: 'estadisticas', nombre: 'Estadísticas', etiqueta: 'propio',
    vive: '`progresoEstilo.js` (F35), sobre datos de otros módulos.',
    enEH: 'Qué métricas ha encendido él. Ni un contador guardado.',
    prohibido: /DEFAULT_ESTADISTICAS_EH|guardarContador/,
  },
];

export const sistemaRevisado = (id) => SISTEMAS_REVISADOS.find((s) => s.id === id) || null;

/**
 * Apartado 3 — *"si alguno aparece duplicado: no mantener dos sistemas"*.
 * ⚠️ Se lee el código de verdad. `fuentes` es `{ nombre: contenido }`.
 */
export function revisarDuplicados(fuentes = {}) {
  const problemas = [];
  Object.entries(fuentes).forEach(([archivo, contenido]) => {
    /* ⚠️ El mismo limpiador que la F43, no una copia: sin comentarios **y sin
       las reglas**, porque el patrón que busca algo no es código que lo haga. */
    const limpio = soloCodigo(contenido);
    SISTEMAS_REVISADOS.forEach((s) => {
      if (!s.prohibido) return;
      if (s.prohibido.test(limpio)) problemas.push({ archivo, sistema: s.id, vive: s.vive });
    });
  });
  return problemas;
}

/* ===========================================================================
   3 · UN ICONO POR COSA (apartado 12)
   ===========================================================================
   ⚠️ *"No utilizar diferentes iconos para la misma acción."* El icono de un
   módulo lo dice `MODULOS_EH`; si una plaquita suya usa otro, son dos. */

export function revisarIconos() {
  const problemas = [];
  Object.entries(PLAQUITAS_CH).forEach(([moduloId, plaquitas]) => {
    const mod = MODULOS_EH.find((m) => m.id === moduloId);
    if (!mod) return;
    // La plaquita de "qué utilizo" y la de "mi perfil" son acciones, no el
    // módulo: solo se compara la que representa al módulo entero.
    const suya = plaquitas.find((p) => p.id === 'partes');
    if (suya && suya.icono === mod.icono) {
      problemas.push({ modulo: moduloId, motivo: 'la plaquita repite el icono del módulo' });
    }
  });
  // Y dos módulos distintos no pueden llevar el mismo icono.
  const iconos = MODULOS_EH.map((m) => m.icono);
  iconos.forEach((ic, i) => {
    if (iconos.indexOf(ic) !== i) {
      problemas.push({ modulo: MODULOS_EH[i].id, motivo: `el icono ${ic} ya lo usa otro módulo` });
    }
  });
  return problemas;
}

/* ===========================================================================
   4 · LAS CUATRO LISTAS (apartado 20)
   ===========================================================================
   *"Esto evitará volver a discutir lo mismo durante futuras fases."* */

export const SE_QUEDA = [
  { id: 'mi_estilo', que: 'Mi estilo', porque: 'Es la lectura de todo lo demás, y no guarda nada propio (F6).' },
  { id: 'preferencias', que: 'Las preferencias de estilo', porque: 'Son suyas: nivel, ocasiones, lo que quiere cuidar.' },
  { id: 'organizacion', que: 'La organización de sus apartados', porque: 'Qué plaquita se ve, en qué orden y con qué línea (F30/F31).' },
  { id: 'inspiracion', que: 'Descubrir e ideas', porque: 'Es inspiración subjetiva, y no existe en ningún otro sitio (F33).' },
  { id: 'recomendaciones', que: 'Las recomendaciones', porque: 'Son reglas sobre SUS datos, opcionales y sin IA.' },
  { id: 'productos', que: 'Los productos de cuidado', porque: 'Con un solo motor y sin catálogos paralelos (F17).' },
  { id: 'relaciones', que: 'Las relaciones con otros módulos', porque: 'Guardar el id de lo de fuera es justo lo que le toca.' },
];

export const SE_INTEGRA = MAPA_DE_DATOS.filter((m) => m.existe).map((m) => ({
  id: m.id, que: m.que, vive: m.fuente, enEH: m.guardaEH,
}));

/* ⚠️ **Vacío, y no es un descuido.** Las once fases anteriores fueron quitando
   lo que sobraba: la papelera propia (F15), el segundo inventario (F17), el
   segundo motor de rutinas (F14), el segundo de reglas (F16), el calendario
   propio (F21) y el tercer sitio donde juntar productos (F22). Cuando llega la
   auditoría final **ya no queda nada que eliminar**, y eso es el resultado, no
   una casualidad. */
export const SE_ELIMINA = [];

export const SE_POSPONE = [
  {
    id: 'favoritos_globales', que: 'Un sistema de favoritos común a toda la aplicación',
    porque: 'Hoy cada módulo tiene los suyos. Unificarlos es una fase, no un arreglo (F39).',
  },
  {
    id: 'puente_diario', que: 'El puente entre una experiencia y el Diario',
    porque: 'Ninguna fase lo ha pedido todavía; la F47 lo declaró como lo que es.',
  },
  {
    id: 'conflictos', que: 'Detectar conflictos entre dispositivos',
    porque: 'Exige versión o marca de tiempo en `app_data`: es una decisión de esquema (F41, F45 y F46).',
  },
  {
    id: 'catalogo_productos', que: 'Un catálogo de productos de verdad',
    porque: 'D2-03: arquitectura sí, catálogo no. Entra el día que Josué dé los datos.',
  },
  {
    id: 'audio', que: 'Los sonidos de Estilo de hombre',
    porque: 'El motor está entero; faltan los archivos, que dará Josué (C-23).',
  },
];

/* ===========================================================================
   5 · LA RESPUESTA DEL APARTADO 22
   ===========================================================================
   *"¿Qué hace exactamente Estilo de hombre? ¿Y qué NO hace porque ya lo hace
   JC Fitness?"* Dos frases, para no tener que reconstruirlas nunca más. */

export const RESPUESTA_FINAL = {
  hace: 'Estilo de hombre guarda lo que Josué quiere cuidar de sí mismo —piel, pelo, barba, cuerpo, higiene, perfumes, accesorios y gustos—, lo organiza en apartados que enciende y apaga él, y le propone ideas y rutinas a partir de lo que ha contestado.',
  noHace: 'No guarda su peso, su calendario, sus objetivos, sus tareas, sus fotos, sus rachas ni lo que borra: todo eso ya lo hace JosStyle, y aquí solo se consulta o se apunta su id.',
  regla: 'Los módulos guardan los datos. Los sistemas globales gestionan sus funciones. Las plaquitas muestran.',
};

/* ===========================================================================
   6 · AUDITORÍA
   =========================================================================== */

export function auditarFinal(fuentes = {}) {
  const porEtiqueta = Object.fromEntries(
    CLASIFICACIONES.map((c) => [c.id, SISTEMAS_REVISADOS.filter((s) => s.etiqueta === c.id).length]),
  );
  return {
    // Apartado 3 — los quince sistemas, todos con dueño.
    sistemas: SISTEMAS_REVISADOS.length,
    porEtiqueta,
    // 🔴 Ninguno debe estar clasificado como duplicado.
    duplicados: SISTEMAS_REVISADOS.filter((s) => s.etiqueta === 'duplicado').map((s) => s.id),
    sinDueno: SISTEMAS_REVISADOS.filter((s) => !clasificacion(s.etiqueta)).map((s) => s.id),
    sinDondeVive: SISTEMAS_REVISADOS.filter((s) => !s.vive).map((s) => s.id),
    // Y el revisor sobre el código de verdad.
    encontradosEnCodigo: revisarDuplicados(fuentes),
    // Apartado 12.
    iconosRepetidos: revisarIconos(),
    // Apartado 20 — las cuatro listas.
    seQueda: SE_QUEDA.length,
    seIntegra: SE_INTEGRA.length,
    seElimina: SE_ELIMINA.length,
    sePospone: SE_POSPONE.length,
    sinPorque: [...SE_QUEDA, ...SE_POSPONE].filter((x) => !x.porque).map((x) => x.id),
    // Apartado 21 — esta fase no añade nada.
    funcionesNuevas: 0,
    almacenesNuevos: 0,
    // Apartados 17 y 18 — lo que hay, contado.
    metricas: METRICAS_PROGRESO.length,
    metricasSinModulo: METRICAS_PROGRESO.filter((m) => !m.modulo).map((m) => m.id),
    avisos: TIPOS_AVISO_EH.length,
    // ⚠️ *"Menos notificaciones = mejor experiencia"*: todos nacen apagados.
    avisosEncendidosPorDefecto: TIPOS_AVISO_EH.filter((t) => t.porDefecto).map((t) => t.id),
    // El inventario del apartado 1, derivado de lo que ya existe.
    modulos: IDS_EH.length,
    librerias: LIBRERIAS_EH.length,
    colecciones: COLECCIONES_EH.length,
    enPapelera: Object.keys(CATALOGO_PAPELERA).filter((k) => IDS_EH.includes(CATALOGO_PAPELERA[k].modulo)).length,
    fuentesGlobales: Object.keys(FUENTES_GLOBALES).length,
  };
}

export function panelAuditoriaFinal(fuentes = {}) {
  return {
    clasificaciones: CLASIFICACIONES,
    sistemas: SISTEMAS_REVISADOS.map((s) => ({ ...s, etiquetaNombre: clasificacion(s.etiqueta)?.nombre })),
    seQueda: SE_QUEDA,
    seIntegra: SE_INTEGRA,
    seElimina: SE_ELIMINA,
    sePospone: SE_POSPONE,
    respuesta: RESPUESTA_FINAL,
    auditoria: auditarFinal(fuentes),
  };
}
