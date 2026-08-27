// ============================================================================
// EH · Fase 3/65 — SISTEMA DE PRIMERA CONFIGURACIÓN Y PERFIL DE USUARIO
//
// *"La aplicación debe conocer qué necesita el usuario sin obligarle a rellenar
// un formulario interminable."*
//
// Y, subrayado por el propio enunciado: **"No preguntar información que JC
// Fitness ya conoce."**
//
// ── LAS CUATRO COSAS QUE ESTA FASE DECIDE, Y POR QUÉ ───────────────────────
//
// **1. El asistente guarda por dónde va, no lo que sabe.** El apartado 15 pide
// que si Josué lo abandona a la mitad pueda continuar. Eso son dos campos —el
// paso y la selección en curso— y nada más. Guardar aquí una copia de su peso o
// su altura "para no volver a preguntarlo" sería exactamente lo contrario de lo
// que pide el apartado 7: lo que ya se sabe **se lee**, no se copia.
//
// **2. Se puede saltar en cualquier momento** (apartado 6), y saltárselo no es
// un estado degradado: `omitido` y `terminado` llevan a la misma pantalla, con
// todos los apartados disponibles en Gestionar apartados.
//
// **3. Las preguntas de cada módulo NO se construyen aquí** (apartados 9 y 17):
// *"Esta fase solo construye el sistema que las podrá alojar."* Así que hay un
// registro de **qué datos globales reutiliza cada módulo** y **en qué fase hará
// sus propias preguntas** — y ni un formulario inventado.
//
// **4. Los tres tipos de dato del apartado 11** (necesario / preferencia /
// opcional) existen desde hoy, aunque todavía no haya ningún formulario que los
// use. Es lo que impide que la fase 13 invente su propia clasificación.
// ============================================================================

import { FUENTES_GLOBALES, MODULOS_EH, IDS_EH, moduloEH, normalizarEstiloHombre } from './estiloDeHombre';
import { todayISO } from './helpers';

/* ===========================================================================
   1 · LOS PASOS (apartados 1, 2, 3 y 14)
   ===========================================================================
   Los textos son los del enunciado, literales. No es pedantería: son los que
   Josué escribió, y reescribirlos "mejor" es la forma más silenciosa de que una
   pantalla acabe diciendo algo que él no pidió. */

export const PASOS_ASISTENTE = [
  {
    id: 'bienvenida',
    titulo: 'Estilo de hombre',
    icono: '🧔',
    texto: 'Personaliza este espacio según lo que realmente necesitas. Puedes cambiarlo todo más adelante.',
    boton: 'Empezar',
  },
  {
    id: 'explicacion',
    titulo: 'Tú decides qué aparece',
    icono: '👋',
    texto: 'Estilo de hombre tiene muchas herramientas, pero no tienes que utilizar todas. Elige lo que te interese y podrás añadir o quitar apartados cuando quieras.',
    boton: 'Continuar',
  },
  {
    id: 'seleccion',
    titulo: '¿Qué quieres utilizar?',
    icono: '☑️',
    texto: 'Elige los apartados que te interesen. Puedes cambiarlo cuando quieras.',
    boton: 'Continuar',
  },
  {
    id: 'final',
    titulo: 'Tu espacio está listo',
    icono: '🎉',
    texto: 'Hemos preparado Estilo de hombre según lo que has elegido. Puedes cambiar tus apartados cuando quieras.',
    boton: 'Entrar en Estilo de hombre',
  },
];

export const IDS_PASOS = PASOS_ASISTENTE.map((p) => p.id);
export const pasoAsistente = (id) => PASOS_ASISTENTE.find((p) => p.id === id) || null;

/* ⚠️ El apartado 6 lo llama *"Omitir por ahora"* y lo pone en la lista de
   requisitos, no en la de sugerencias. Está en todos los pasos menos el último,
   donde ya no queda nada que omitir. */
export const TEXTO_OMITIR = 'Omitir por ahora';
export const puedeOmitir = (pasoId) => pasoId !== 'final';

/* ===========================================================================
   2 · EL ESTADO DEL ASISTENTE (apartado 15)
   ===========================================================================
   *"Si el usuario abandona durante la configuración: no perder los datos ya
   introducidos. Cuando vuelva: Continuar configuración o Empezar de nuevo."*

   ⚠️ **Solo dos cosas se guardan**: por dónde iba y qué llevaba marcado. Todo
   lo demás —lo que ya sabemos de él— se lee de su sitio cada vez. */

export const DEFAULT_ASISTENTE = {
  paso: null,          // null = nunca lo ha abierto
  seleccion: [],       // lo que lleva marcado en el paso 3
  estado: 'nunca',     // nunca | en_curso | terminado | omitido
  empezadoEn: null,
  terminadoEn: null,
};

export const ESTADOS_ASISTENTE = ['nunca', 'en_curso', 'terminado', 'omitido'];

/**
 * ⚠️ **Añadir un campo a `estiloHombre` obliga a enseñárselo al normalizador**,
 * o el siguiente guardado se lo lleva (regla 5). Ha pasado cuatro veces en este
 * proyecto. Por eso `normalizarAsistente` vive aquí pero lo llama
 * `normalizarEstiloHombre`, que es quien de verdad manda.
 */
export function normalizarAsistente(guardado) {
  const g = guardado || {};
  const paso = IDS_PASOS.includes(g.paso) ? g.paso : null;
  const estado = ESTADOS_ASISTENTE.includes(g.estado) ? g.estado : 'nunca';
  return {
    paso,
    seleccion: (Array.isArray(g.seleccion) ? g.seleccion : []).filter((id) => IDS_EH.includes(id)),
    // Un estado 'en_curso' sin paso es un guardado a medias: se trata como nunca
    // empezado, que es lo único que no miente.
    estado: estado === 'en_curso' && !paso ? 'nunca' : estado,
    empezadoEn: g.empezadoEn || null,
    terminadoEn: g.terminadoEn || null,
  };
}

const asistenteDe = (estado) => normalizarAsistente(normalizarEstiloHombre(estado).asistente);

/** Los tres casos del apartado 15, resueltos aquí y no con `if` en la vista. */
export function estadoAsistente(estado) {
  const e = normalizarEstiloHombre(estado);
  const a = normalizarAsistente(e.asistente);
  // Alguien que configuró antes de que existiera el asistente (Fase 1 y 2) no
  // tiene que volver a pasar por él.
  if (a.estado === 'nunca' && e.configurado) return 'terminado';
  return a.estado;
}

export const puedeContinuar = (estado) => estadoAsistente(estado) === 'en_curso';

/* ===========================================================================
   3 · MOVERSE POR EL ASISTENTE
   ===========================================================================
   ⚠️ Ninguna de estas funciones enciende ni apaga un módulo. La selección vive
   en el asistente hasta que `terminar()` la aplica: así, abandonar a la mitad no
   deja media configuración puesta. */

/**
 * ⚠️ **En SU orden, no en el del catálogo.** `terminarAsistente` reescribe el
 * `orden` de cada módulo a partir de la posición en la selección, así que si
 * esto devolviera los activos en orden de catálogo, entrar en "Modificar mi
 * configuración" y confirmar **sin cambiar nada** le reordenaría las plaquitas
 * en silencio. Es la regla de siempre: nada se mueve solo.
 */
const activosEnOrden = (e) => e.modulos
  .filter((m) => m.activo)
  .slice()
  .sort((a, b) => a.orden - b.orden)
  .map((m) => m.id);

const conAsistente = (estado, cambios) => {
  const e = normalizarEstiloHombre(estado);
  return { ...e, asistente: normalizarAsistente({ ...normalizarAsistente(e.asistente), ...cambios }) };
};

export function iniciarAsistente(estado, { hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  const a = normalizarAsistente(e.asistente);
  return conAsistente(e, {
    paso: a.paso || 'bienvenida',
    estado: 'en_curso',
    empezadoEn: a.empezadoEn || hoy,
    // Al retomar, la selección de partida es la que ya tuviera guardada, y si
    // no, lo que hoy esté encendido: apartado 16 — modificar no borra.
    seleccion: a.seleccion.length > 0 ? a.seleccion : activosEnOrden(e),
  });
}

export function irAPaso(estado, pasoId) {
  if (!IDS_PASOS.includes(pasoId)) return normalizarEstiloHombre(estado);
  return conAsistente(estado, { paso: pasoId, estado: 'en_curso' });
}

export function avanzar(estado) {
  const a = asistenteDe(estado);
  const i = IDS_PASOS.indexOf(a.paso);
  if (i === -1) return iniciarAsistente(estado);
  if (i >= IDS_PASOS.length - 1) return normalizarEstiloHombre(estado);  // el final no avanza
  return irAPaso(estado, IDS_PASOS[i + 1]);
}

export function retroceder(estado) {
  const a = asistenteDe(estado);
  const i = IDS_PASOS.indexOf(a.paso);
  if (i <= 0) return normalizarEstiloHombre(estado);   // de la bienvenida no se retrocede
  return irAPaso(estado, IDS_PASOS[i - 1]);
}

/* ── La selección (apartados 3, 4 y 5) ───────────────────────────────────── */

export function marcarEnSeleccion(estado, id) {
  if (!IDS_EH.includes(id)) return normalizarEstiloHombre(estado);
  const a = asistenteDe(estado);
  const seleccion = a.seleccion.includes(id) ? a.seleccion.filter((x) => x !== id) : [...a.seleccion, id];
  return conAsistente(estado, { seleccion });
}

/** Apartado 4 — *"pero no debe ser la opción predeterminada"*: es un botón. */
export const seleccionarTodos = (estado) => conAsistente(estado, { seleccion: [...IDS_EH] });
export const limpiarSeleccion = (estado) => conAsistente(estado, { seleccion: [] });

/** Apartado 5 — *"7 apartados seleccionados"*. Ni una cifra gigante ni un %. */
export function contadorSeleccion(estado) {
  const n = asistenteDe(estado).seleccion.length;
  return {
    n,
    texto: n === 0 ? 'Ningún apartado seleccionado'
      : `${n} ${n === 1 ? 'apartado seleccionado' : 'apartados seleccionados'}`,
    todos: n === IDS_EH.length,
    ninguno: n === 0,
  };
}

/* ── Terminar y omitir (apartados 6 y 14) ────────────────────────────────── */

/**
 * ⚠️ **Aplica la selección Y marca configurado.** Es el único sitio donde el
 * asistente escribe en los módulos, y respeta el apartado 16: **no borra
 * `config` de nada**, ni siquiera de los que quedan apagados.
 */
export function terminarAsistente(estado, { hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  const a = normalizarAsistente(e.asistente);
  return {
    ...e,
    configurado: true,
    creadoEn: e.creadoEn || hoy,
    modulos: e.modulos.map((m) => ({
      ...m,                                   // ⚠️ `config` intacto (apartado 16)
      activo: a.seleccion.includes(m.id),
      orden: a.seleccion.includes(m.id) ? a.seleccion.indexOf(m.id) : m.orden,
    })),
    asistente: normalizarAsistente({ ...a, paso: 'final', estado: 'terminado', terminadoEn: hoy }),
  };
}

/**
 * Apartado 6 — *"Si el usuario no quiere configurar nada: se puede saltar, no se
 * rompe nada, puede configurarlo posteriormente desde Gestionar apartados."*
 *
 * ⚠️ Omitir **marca `configurado`**. Si no, la próxima vez que entrara le
 * saldría otra vez la bienvenida, que es justo lo que significa "saltárselo".
 * Y **no enciende nada**: entra en la pantalla vacía del apartado 10 de F2, que
 * ya sabe qué decir.
 */
export function omitirAsistente(estado, { hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  const a = normalizarAsistente(e.asistente);
  return {
    ...e,
    configurado: true,
    creadoEn: e.creadoEn || hoy,
    asistente: normalizarAsistente({ ...a, estado: 'omitido', terminadoEn: hoy }),
  };
}

/**
 * Apartado 15 — *"Empezar de nuevo"*. ⚠️ Reinicia **el asistente**, no los
 * módulos: los datos de cada apartado siguen donde estaban. Es la diferencia
 * entre "volver a elegir" y "perderlo todo", y el enunciado pide la primera.
 */
export function reiniciarAsistente(estado, { hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  return { ...e, asistente: normalizarAsistente({ paso: 'bienvenida', estado: 'en_curso', empezadoEn: hoy }) };
}

/**
 * Apartado 16 — *"Desde Gestionar apartados debe existir: Modificar mi
 * configuración. Pero esto no debe borrar datos."*
 *
 * Entra directo en la selección, con lo que hoy está encendido ya marcado.
 */
export function modificarConfiguracion(estado, { hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  const a = normalizarAsistente(e.asistente);
  return {
    ...e,
    asistente: normalizarAsistente({
      ...a,
      paso: 'seleccion',
      estado: 'en_curso',
      empezadoEn: a.empezadoEn || hoy,
      seleccion: activosEnOrden(e),
    }),
  };
}

/* ===========================================================================
   4 · LO QUE YA SABEMOS (apartados 7 y 12)
   ===========================================================================
   *"Antes de crear formularios, comprobar los datos existentes… No volver a
   preguntarlos. La aplicación debe reutilizarlos."*

   La Fase 1 declaró **dónde vive** cada dato global (`FUENTES_GLOBALES`). Aquí
   se añade lo que faltaba: **cómo se lee y si está relleno**.

   ⚠️ **Nada de esto se guarda dentro de Estilo de Hombre.** `datosGlobales` se
   le pasa desde fuera, se mira, y se olvida. Copiarlo daría dos pesos distintos
   el día que se corrija uno — que es el apartado 10 de la Fase 1. */

export const CLASES_DATO = ['necesario', 'preferencia', 'opcional'];

export const DESCRIPCION_CLASE = {
  necesario: 'Imprescindible para que una función funcione.',
  preferencia: 'Mejora las recomendaciones.',
  opcional: 'Puede dejarse vacío.',
};

/**
 * Los datos que JosStyle **ya conoce** y que por tanto no se preguntan nunca
 * aquí. El enunciado los enumera: *"Nombre. Edad. Sexo cuando corresponda.
 * Peso. Altura. Objetivos. Datos de entrenamiento."*
 *
 * `leer` recibe el estado global de JosStyle y devuelve el valor o `null`.
 */
export const DATOS_GLOBALES_EH = [
  { campo: 'nombre', que: 'Tu nombre', donde: 'Perfil', leer: (g) => g?.perfil?.nombre || null },
  { campo: 'nacimiento', que: 'Tu edad', donde: 'Perfil', leer: (g) => g?.perfil?.fechaNacimiento || null },
  { campo: 'sexo', que: 'Sexo', donde: 'Perfil', leer: (g) => g?.perfil?.sexo || null },
  { campo: 'altura', que: 'Tu altura', donde: 'Perfil', leer: (g) => g?.perfil?.altura || null },
  {
    campo: 'peso',
    que: 'Tu peso',
    donde: 'Perfil y Salud',
    // ⚠️ Dos sitios y un orden: la última medida de Salud es más reciente que el
    // peso del perfil. Si no hay ninguna, vale el del perfil.
    leer: (g) => {
      const medidas = Array.isArray(g?.salud?.medidas) ? g.salud.medidas : [];
      const conPeso = medidas.filter((m) => Number.isFinite(Number(m?.peso)));
      if (conPeso.length > 0) return Number(conPeso[conPeso.length - 1].peso);
      return g?.perfil?.peso || null;
    },
  },
  {
    campo: 'objetivos',
    que: 'Tus objetivos',
    donde: 'Objetivos',
    leer: (g) => {
      const lista = Array.isArray(g?.objetivos?.lista) ? g.objetivos.lista : [];
      return lista.length > 0 ? lista.length : (g?.perfil?.objetivoPrincipal || null);
    },
  },
  {
    campo: 'entrenamiento',
    que: 'Tu entrenamiento',
    donde: 'Calistenia',
    leer: (g) => {
      const c = g?.calistenia;
      if (!c || typeof c !== 'object') return null;
      const sesiones = Object.values(c).reduce((s, h) => s + (Array.isArray(h?.sesiones) ? h.sesiones.length : 0), 0);
      return sesiones > 0 ? sesiones : null;
    },
  },
  {
    campo: 'sueno',
    que: 'Tu descanso',
    donde: 'Sueño',
    leer: (g) => (Array.isArray(g?.sueno) && g.sueno.length > 0 ? g.sueno.length : null),
  },
];

export const datoGlobalEH = (campo) => DATOS_GLOBALES_EH.find((d) => d.campo === campo) || null;

/** Apartado 7 — lo que ya sabemos, con su origen, y lo que no. Sin copiar nada. */
export function loQueYaSabemos(datosGlobales) {
  const sabidos = [];
  const faltan = [];
  DATOS_GLOBALES_EH.forEach((d) => {
    let valor = null;
    try { valor = d.leer(datosGlobales); } catch { valor = null; }
    const ficha = { campo: d.campo, que: d.que, donde: d.donde, valor };
    if (valor !== null && valor !== '' && valor !== 0) sabidos.push(ficha);
    else faltan.push(ficha);
  });
  return { sabidos, faltan, total: DATOS_GLOBALES_EH.length };
}

/**
 * ⚠️ La comprobación que impide que una fase futura pregunte lo que ya sabemos.
 * Devuelve *"no lo preguntes, está en Perfil"* con el sitio exacto.
 */
export function seDebePreguntar(campo, datosGlobales) {
  const d = datoGlobalEH(campo);
  if (!d) {
    // No es global: sí se pregunta, y por eso existen las fases de cada módulo.
    const fuente = FUENTES_GLOBALES[campo];
    return fuente
      ? { preguntar: false, motivo: `Ya existe en ${fuente.que}.`, donde: fuente.modulo }
      : { preguntar: true, motivo: 'No es un dato que JosStyle tenga ya.', donde: null };
  }
  let valor = null;
  try { valor = d.leer(datosGlobales); } catch { valor = null; }
  if (valor !== null && valor !== '' && valor !== 0) {
    return { preguntar: false, motivo: `Ya está en ${d.donde}.`, donde: d.donde, valor };
  }
  return { preguntar: true, motivo: `Está vacío en ${d.donde}.`, donde: d.donde };
}

/* ===========================================================================
   5 · QUÉ NECESITA CADA MÓDULO (apartados 8, 9 y 17)
   ===========================================================================
   *"NO IMPLEMENTAR TODAVÍA LOS FORMULARIOS INTERNOS… Esta fase solo construye el
   sistema que las podrá alojar."*

   Así que aquí **no hay ni una pregunta escrita**. Lo que hay es, por módulo:

   - `usa` — qué datos globales reutilizará. **Eso es lo que NO se le va a
     preguntar**, y es el apartado 12 hecho lista.
   - `pregunta` — si tendrá preguntas propias, y en qué fase. Un número, no un
     formulario.

   Inventarme aquí "¿cuál es tu tipo de piel?" con sus cinco opciones sería
   construir la fase 13 desde la 3, y encima mal. */

export const NECESIDADES_MODULO = Object.fromEntries(MODULOS_EH.map((m) => [m.id, {
  usa: ({
    estilo: [],
    pelo: [],
    barba: ['nacimiento'],
    skincare: [],
    higiene: [],
    cuerpo: [],
    fitness: ['peso', 'altura', 'entrenamiento', 'objetivos'],
    sueno: ['sueno'],
    salud: ['nacimiento', 'sexo', 'peso', 'altura'],
    habitos: [],
    progreso: ['peso', 'altura'],
    educacion: [],
    productos: [],
  })[m.id] || [],
  pregunta: m.fase,
}]));

/**
 * Apartado 8 — *"Si el usuario selecciona un módulo que necesita información
 * adicional, no mostrar todos los formularios juntos."*
 *
 * Devuelve, para lo que ha elegido, **qué le queda por configurar y cuándo**.
 * Hoy la respuesta es "todos, en su fase", y la pantalla lo dice así en vez de
 * abrir un formulario que no existe (regla 8).
 */
export function configuracionPendiente(estado, datosGlobales) {
  const e = normalizarEstiloHombre(estado);
  const activos = e.modulos.filter((m) => m.activo).map((m) => m.id);
  return activos.map((id) => {
    const cat = moduloEH(id);
    const nec = NECESIDADES_MODULO[id] || { usa: [], pregunta: null };
    const reutiliza = nec.usa
      .map((campo) => seDebePreguntar(campo, datosGlobales))
      .filter((r) => !r.preguntar);
    return {
      id,
      nombre: cat.nombre,
      icono: cat.icono,
      fase: nec.pregunta,
      // ⚠️ Lo que NO se le preguntará porque ya se sabe (apartado 12).
      reutiliza: reutiliza.length,
      // Hoy ningún módulo tiene sus preguntas construidas, y se dice.
      listo: false,
      texto: `Se configura en la fase ${nec.pregunta}.`,
    };
  });
}

/* ===========================================================================
   6 · MIS DATOS (apartado 13)
   ===========================================================================
   *"Desde cada módulo debe poder existir posteriormente una opción tipo ⚙️ Mis
   datos para modificar las respuestas. No queremos que las respuestas iniciales
   queden bloqueadas para siempre."*

   ⚠️ Y aquí hay una decisión que conviene dejar escrita: **lo que vive en otro
   módulo se edita en otro módulo**. "Mis datos" enseña el peso y dice que está
   en Salud; no ofrece un campo para cambiarlo aquí, porque entonces habría dos
   sitios donde se edita el mismo dato y uno de los dos acabaría mintiendo. */

export function misDatos(estado, datosGlobales) {
  const { sabidos, faltan } = loQueYaSabemos(datosGlobales);
  const e = normalizarEstiloHombre(estado);
  return {
    // Lo de fuera: se enseña y se dice dónde se cambia.
    globales: [...sabidos, ...faltan].map((d) => ({
      ...d,
      sabido: d.valor !== null && d.valor !== '' && d.valor !== 0,
      editableAqui: false,
      donde: d.donde,
    })),
    // Lo de dentro: lo que cada módulo haya guardado en su `config`. Hoy, nada.
    porModulo: e.modulos
      .filter((m) => Object.keys(m.config || {}).length > 0)
      .map((m) => ({ id: m.id, nombre: moduloEH(m.id)?.nombre || m.id, campos: Object.keys(m.config).length })),
    sabidos: sabidos.length,
    porSaber: faltan.length,
  };
}

/* ===========================================================================
   7 · RESUMEN
   =========================================================================== */

export function resumenAsistente(estado, datosGlobales) {
  const e = normalizarEstiloHombre(estado);
  const a = normalizarAsistente(e.asistente);
  const est = estadoAsistente(e);
  const conocidos = loQueYaSabemos(datosGlobales);
  const i = IDS_PASOS.indexOf(a.paso);
  return {
    estado: est,
    paso: a.paso,
    // 1 de 4, para una barrita discreta. El apartado 5 pide justo lo contrario
    // de un porcentaje grande.
    numero: i === -1 ? 0 : i + 1,
    de: IDS_PASOS.length,
    seleccionados: a.seleccion.length,
    puedeContinuar: est === 'en_curso',
    yaSabemos: conocidos.sabidos.length,
    deTotal: conocidos.total,
    pendientes: est === 'terminado' || est === 'omitido' ? configuracionPendiente(e, datosGlobales).length : 0,
  };
}
