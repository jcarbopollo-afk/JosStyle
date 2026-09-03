// ============================================================================
// EH · Fase 54/65 — BACKUP, RESTAURACIÓN Y RECUPERACIÓN AVANZADA
//
// *"Un error nunca debería convertirse automáticamente en una pérdida
// irreversible de información."*
//
// ── QUÉ SE CONSTRUYE AQUÍ ──────────────────────────────────────────────────
//
// La condición de finalización pide **cuatro niveles** de recuperación, y tres
// ya existían de fases anteriores. Lo que faltaba es el tercero, y es el que se
// construye aquí:
//
//   1. 🗑️ **Un elemento** → la papelera global (ME F3). Existía.
//   2. 🔄 **La configuración** → restablecer diseño (F31) y estilo (F36). Existía.
//   3. ♻️ **Un módulo entero** → **`restaurarModulo()`, nuevo en esta fase.**
//   4. ☁️ **Todo** → una copia de seguridad. Existía a medias (la de la F46).
//
// Y dos cosas más que el enunciado pide y no había: **validar antes de
// importar** (apartado 15) y **dejar registro de lo que se recupera** (18).
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. 🚨 NO HAY SISTEMA GLOBAL DE COPIAS, Y EL ENUNCIADO YA LO SOSPECHABA.** El
// apartado 1 dice *"Estilo de hombre debe formar parte del sistema global de
// copias"* y el 2 empieza con **"cuando exista el sistema global"**. Pues no
// existe: JC Fitness no hace copias automáticas de nada. Lo que hay es la
// exportación a CSV/XLSX (apartado 14) y la copia que la F46 hace antes de
// migrar. Y el enunciado es tajante en la otra dirección: *"no crear un sistema
// de backup completamente separado"*. Así que aquí **no se construye uno**: se
// construye la pieza que sí es de este módulo —restaurar **su** estado— y se
// deja escrito, con su nombre, lo que le falta a la aplicación entera.
//
// **2. ⚠️ RESTAURAR UN MÓDULO NO PUEDE TOCAR A LOS DEMÁS** (apartados 5 y 7).
// *"Si solo se ha perdido un perfume, no obligar a restaurar toda JC Fitness."*
// `restaurarModulo` copia **la `config` de un solo módulo** desde la copia y
// deja el resto exactamente como estaba, incluidos el orden, lo oculto y lo
// activo de los demás. Hay una prueba que lo comprueba campo a campo.
//
// **3. ⚠️ IMPORTAR SIN VALIDAR ES PEOR QUE NO IMPORTAR** (apartado 15). Meter un
// JSON cualquiera en `estiloHombre` con `saveData` —que **sobrescribe**— es la
// forma más rápida de perderlo todo de una vez. `validarCopia()` mira que sea de
// este módulo, de una versión que se entienda y con la forma correcta **antes**
// de dejar que nadie la escriba. ⚠️ Y hay que decirlo claro: **la pantalla de
// importar no existe todavía**. Esto es la puerta con cerradura; el que la abra
// tendrá que ponerla, y encontrará la cerradura ya puesta.
//
// **4. ⚠️ EL HISTORIAL DE VERSIONES (apartado 9) NO SE PUEDE HACER HOY, Y NO ES
// PEREZA.** *"Hoy — 19:30 · Ayer — 22:10 · Hace 3 días"* exige **guardar las
// versiones anteriores**, y `app_data` guarda **una fila por (usuario, clave)**:
// no hay dónde ponerlas. Es la misma decisión de esquema que la F41, la F45 y la
// F46 dejaron abierta, y por eso los conflictos entre dispositivos (11 y 12)
// tampoco se detectan. Se declara con ese motivo, no con un "pendiente".
//
// **5. ⚠️ Y UN REGISTRO DE RECUPERACIÓN NO PUEDE LLEVAR DATOS PERSONALES**
// (apartado 18). Se apunta **qué operación, cuándo y cuántos elementos**. Nunca
// el nombre de un perfume ni el texto de una nota: un registro que sirva para
// investigar un problema no necesita saber qué se llamaba lo que se perdió, y
// convertirlo en una copia de los datos es justo lo que el apartado 13 prohíbe.
// ============================================================================

import { normalizarEstiloHombre, moduloEH, IDS_EH, VERSION_EH } from './estiloDeHombre';
import { restaurarCopia, versionDe, compatibilidad, VERSION_ACTUAL } from './migracion';
import { CATALOGO_PAPELERA, RETENCION_PAPELERA_DIAS, todayISO } from './papelera';
import { restablecerEstilo, CLAVES_PAPELERA_EH } from './gestionEstilo';
import { restablecerDiseno } from './pantallaEH';
import { GRAVEDADES, gravedad } from './pruebasIntegrales';
import { CAIDAS, PLAN_DE_VUELTA_ATRAS } from './produccion';

/* ===========================================================================
   1 · LOS CUATRO NIVELES (condición de finalización)
   ===========================================================================
   *"Elemento eliminado → recuperación rápida. Configuración modificada
   accidentalmente → restablecer. Problema de módulo → restauración específica.
   Problema grave → restauración mediante backup."*

   ⚠️ Cada nivel dice **con qué se hace** y **de qué fase viene**. El que no
   existía es el 3, y es el que trae esta fase. */

export const NIVELES = [
  {
    nivel: 1,
    icono: '🗑️',
    id: 'elemento',
    cuando: 'Se ha borrado una cosa sin querer.',
    con: 'La papelera global: Eliminados recientemente → Recuperar.',
    funcion: 'restaurar (papelera.js)',
    existe: true,
    deLaFase: 'ME F3',
    toques: 3,
  },
  {
    nivel: 2,
    icono: '🔄',
    id: 'configuracion',
    cuando: 'Ha cambiado el orden, los tamaños o lo que se ve, y quiere lo de antes.',
    con: 'Restablecer diseño, o restablecer Estilo de hombre entero.',
    funcion: 'restablecerDiseno · restablecerEstilo',
    existe: true,
    deLaFase: 'F31 y F36',
    /* ⚠️ Y lo importante del nivel 2: **no borra ni un dato**. */
    noBorra: true,
  },
  {
    nivel: 3,
    icono: '♻️',
    id: 'modulo',
    cuando: 'Un apartado se ha quedado hecho un lío: su configuración, sus rutinas, sus registros.',
    con: 'Restaurar SOLO ese módulo desde una copia, sin tocar los demás.',
    funcion: 'restaurarModulo (F54)',
    existe: true,
    deLaFase: 'F54 — es lo que faltaba',
    nuevo: true,
  },
  {
    nivel: 4,
    icono: '☁️',
    id: 'completo',
    cuando: 'Algo grave: una migración que salió mal, datos dañados.',
    con: 'Volver a la copia entera, avisando antes de qué se pierde.',
    funcion: 'restaurarTodo (F54) · restaurarCopia (F46)',
    existe: true,
    deLaFase: 'F46 y F54',
  },
];

export const nivel = (id) => NIVELES.find((n) => n.id === id) || null;

/* ===========================================================================
   2 · LO QUE NO EXISTE, CON SU NOMBRE (apartados 1, 2, 9, 11 y 12)
   ===========================================================================
   🚨 Decisión 1 y decisión 4. */

export const LO_QUE_FALTA = [
  {
    apartado: 1,
    id: 'sistema_global',
    que: 'Un sistema global de copias de seguridad de JC Fitness',
    porque: 'No existe. Y el enunciado prohíbe expresamente crear uno separado para este módulo, así que aquí NO se construye: se construye la pieza que sí es de Estilo de hombre.',
    loQueHay: 'La exportación a CSV/XLSX (Mis datos) y la copia que la F46 hace antes de migrar.',
    quienLoDecide: 'Josué',
  },
  {
    apartado: 2,
    id: 'copias_automaticas',
    que: 'Copias automáticas según una política',
    porque: 'El propio enunciado empieza con "cuando exista el sistema global". No existe.',
    loQueHay: 'La copia automática antes de migrar, que es el único momento en que hoy se toca todo de golpe.',
    quienLoDecide: 'Josué',
  },
  {
    apartado: 9,
    id: 'historial_versiones',
    que: 'Ver versiones anteriores ("Hoy 19:30 · Ayer 22:10")',
    porque: '🚨 Exige GUARDAR las versiones anteriores, y `app_data` tiene una fila por (usuario, clave): no hay dónde ponerlas. Es una decisión de esquema, no una tarde de trabajo.',
    loQueHay: 'La copia en memoria durante una migración, que dura lo que dura la migración.',
    quienLoDecide: 'Una decisión de esquema (F41, F45, F46)',
  },
  {
    apartado: 11,
    id: 'sincronizar_tras_restaurar',
    que: 'Sincronizar con los demás dispositivos después de restaurar',
    porque: 'Cada dispositivo lee al arrancar y escribe al tocar. No hay aviso entre dispositivos, así que el otro se entera cuando se abre, no antes.',
    loQueHay: 'Al abrir la aplicación en el otro dispositivo, se lee lo restaurado.',
    quienLoDecide: 'Una decisión de esquema',
  },
  {
    apartado: 12,
    id: 'conflicto_restauracion',
    que: 'Avisar de que la restauración reemplaza una versión más reciente',
    porque: '🚨 No se puede saber cuál es más reciente: `app_data` no guarda ni versión ni marca de tiempo por elemento. Es la decisión de esquema que la F41 dejó abierta y que la F45 y la F46 volvieron a encontrarse.',
    loQueHay: 'El aviso de la restauración completa dice lo que se pierde, aunque no pueda comparar fechas.',
    quienLoDecide: 'Una decisión de esquema',
  },
];

export const falta = (id) => LO_QUE_FALTA.find((f) => f.id === id) || null;

/* ===========================================================================
   3 · LA COPIA (apartados 3 y 13)
   ===========================================================================
   *"Antes de migraciones, cambios estructurales, eliminaciones masivas y
   restauraciones: crear una copia previa cuando corresponda."*

   ⚠️ Y el apartado 13: *"las copias deben seguir las mismas medidas de seguridad
   que los datos originales"*. Aquí eso sale gratis y conviene entender por qué:
   la copia **es el mismo objeto**, vive en la misma clave del mismo usuario y no
   sale a ningún sitio nuevo. Un backup que se guardara en otra parte sería una
   segunda puerta a los mismos datos. */

export const MOMENTOS_DE_COPIA = [
  { id: 'migracion', que: 'Antes de una migración', automatica: true, donde: 'migrarEstiloHombre (F46)' },
  { id: 'restauracion', que: 'Antes de restaurar', automatica: true, donde: 'restaurarModulo y restaurarTodo (esta fase)' },
  { id: 'borrado_masivo', que: 'Antes de un borrado masivo', automatica: true, donde: 'eliminarDatosDeEstilo (F43) y planEliminarDatos (F36)' },
  { id: 'cambio_estructural', que: 'Antes de un cambio estructural', automatica: false, donde: 'No hay ninguno pendiente: Estilo de hombre no cambia el esquema.' },
];

/**
 * La copia de seguridad de Estilo de hombre. ⚠️ Lleva **de qué versión es** y
 * **de cuándo**: sin eso, restaurarla a ciegas es lo que el apartado 15 quiere
 * evitar.
 */
export function copiaDeSeguridad(estado, { hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  return {
    tipo: 'estiloHombre',
    version: e.version || VERSION_EH,
    fecha: hoy,
    estado: JSON.parse(JSON.stringify(e)),
  };
}

export const esCopia = (c) => !!c && typeof c === 'object' && c.tipo === 'estiloHombre' && !!c.estado;

/* ===========================================================================
   4 · RESTAURAR UN MÓDULO (apartados 5 y 7) — 🚨 lo nuevo de esta fase
   ===========================================================================
   *"Si solo se ha perdido un perfume, no obligar a restaurar toda JC Fitness. La
   recuperación debe ser lo más específica posible."*

   🚨 ⚠️ **Decisión 2.** Esto devuelve **la `config` de un módulo** y no toca
   absolutamente nada más: ni el orden de los demás, ni lo que está oculto, ni lo
   que está activo, ni los datos globales. Y hace su propia copia antes, para que
   restaurar mal también se pueda deshacer. */

export function restaurarModulo(estado, moduloId, copia, { hoy = todayISO() } = {}) {
  const actual = normalizarEstiloHombre(estado);
  const antes = copiaDeSeguridad(actual, { hoy });

  if (!IDS_EH.includes(moduloId)) {
    return { estado: actual, antes, hecho: false, error: 'Ese apartado no existe.' };
  }
  if (!esCopia(copia)) {
    return { estado: actual, antes, hecho: false, error: 'Eso no es una copia de Estilo de hombre.' };
  }

  const guardado = normalizarEstiloHombre(copia.estado);
  const enLaCopia = guardado.modulos.find((m) => m.id === moduloId);
  if (!enLaCopia) {
    return { estado: actual, antes, hecho: false, error: 'La copia no tiene ese apartado.' };
  }

  return {
    /* ⚠️ **Solo `config`.** `activo`, `oculto` y `orden` son de AHORA, no de la
       copia: si él apagó el módulo ayer, restaurar sus rutinas no puede volver a
       encenderlo. Restaurar datos y cambiar la pantalla son dos cosas. */
    estado: {
      ...actual,
      modulos: actual.modulos.map((m) => (m.id === moduloId
        ? { ...m, config: JSON.parse(JSON.stringify(enLaCopia.config || {})) }
        : m)),
    },
    antes,
    hecho: true,
    error: null,
    modulo: moduloId,
    nombre: moduloEH(moduloId)?.nombre || moduloId,
  };
}

/* ===========================================================================
   5 · RESTAURAR TODO (apartado 8)
   ===========================================================================
   *"Solo para situaciones realmente graves. Antes: ⚠️ explicar claramente qué
   información se verá afectada. Y pedir confirmación."*

   ⚠️ La confirmación es un parámetro, como en el resto del proyecto: sin
   `confirmado: true` **no escribe nada** y devuelve el aviso. */

export function loQueSePierde(estado, copia) {
  const actual = normalizarEstiloHombre(estado);
  if (!esCopia(copia)) return null;
  const guardado = normalizarEstiloHombre(copia.estado);
  const conConfig = (e) => e.modulos.filter((m) => Object.keys(m.config || {}).length > 0).map((m) => m.id);
  const ahora = conConfig(actual);
  const enCopia = conConfig(guardado);
  return {
    fecha: copia.fecha,
    /* ⚠️ Lo que se dice antes de confirmar: qué apartados tienen datos ahora que
       la copia no tenía. Es lo más honesto que se puede decir sin poder comparar
       fechas por elemento (ver `LO_QUE_FALTA`). */
    apartadosQueSeQuedanSinDatos: ahora.filter((id) => !enCopia.includes(id))
      .map((id) => moduloEH(id)?.nombre || id),
    apartadosQueVuelven: enCopia.filter((id) => !ahora.includes(id))
      .map((id) => moduloEH(id)?.nombre || id),
    activosAhora: actual.modulos.filter((m) => m.activo).length,
    activosEnLaCopia: guardado.modulos.filter((m) => m.activo).length,
  };
}

export const TEXTOS_RECUPERACION = {
  avisoTodo: 'Esto devuelve Estilo de hombre a como estaba en la copia. Lo que hayas apuntado después no estará.',
  avisoModulo: 'Esto devuelve solo este apartado. El resto se queda como está.',
  sinFechas: 'No se puede comparar cuál es más reciente: la aplicación no guarda la fecha de cada cosa por separado.',
  noBorraDatos: 'Restablecer la pantalla no borra nada: solo devuelve el orden, los tamaños y lo que se ve.',
  nivelMasSencillo: 'Si solo se ha borrado una cosa, la papelera es el camino corto. No hace falta restaurar nada más.',
};

export function restaurarTodo(estado, copia, { confirmado = false, hoy = todayISO() } = {}) {
  const actual = normalizarEstiloHombre(estado);
  const antes = copiaDeSeguridad(actual, { hoy });
  if (!esCopia(copia)) {
    return { estado: actual, antes, hecho: false, error: 'Eso no es una copia de Estilo de hombre.' };
  }
  if (!confirmado) {
    return {
      estado: actual,
      antes,
      hecho: false,
      error: null,
      aviso: TEXTOS_RECUPERACION.avisoTodo,
      pierde: loQueSePierde(actual, copia),
    };
  }
  return {
    estado: normalizarEstiloHombre(restaurarCopia(copia.estado)),
    antes,
    hecho: true,
    error: null,
  };
}

/* ===========================================================================
   6 · VALIDAR ANTES DE IMPORTAR (apartado 15)
   ===========================================================================
   *"Si se permite importar: validar primero los datos. No introducir
   automáticamente información corrupta o incompatible."*

   🚨 ⚠️ **Decisión 3 — y hay que decirlo sin adornos: la pantalla de importar NO
   existe.** Esto es la cerradura, no la puerta. Se construye ahora porque el día
   que alguien haga la puerta, el camino corto será `saveData(uid,
   'estiloHombre', JSON.parse(texto))` — y eso, con un `saveData` que
   **sobrescribe**, es perderlo todo de una vez. */

export const IMPORTAR_EXISTE = false;

export const MOTIVOS_INVALIDA = [
  { id: 'no_json', que: 'No es un JSON que se pueda leer.' },
  { id: 'no_es_copia', que: 'No es una copia de Estilo de hombre.' },
  { id: 'version_futura', que: 'Es de una versión más nueva que esta aplicación.' },
  { id: 'sin_modulos', que: 'No tiene la lista de apartados.' },
  { id: 'modulos_desconocidos', que: 'Trae apartados que aquí no existen.' },
];

export const motivoInvalida = (id) => MOTIVOS_INVALIDA.find((m) => m.id === id) || null;

/**
 * ⚠️ Devuelve `{ valida, motivos, avisos, estado }`. Un **aviso** no impide
 * importar (un módulo desconocido se aparta, como hace el normalizador con los
 * retirados); un **motivo** sí.
 */
export function validarCopia(entrada) {
  const motivos = [];
  const avisos = [];
  let copia = entrada;

  if (typeof entrada === 'string') {
    try { copia = JSON.parse(entrada); } catch { return { valida: false, motivos: ['no_json'], avisos: [], estado: null }; }
  }
  if (!esCopia(copia)) return { valida: false, motivos: ['no_es_copia'], avisos: [], estado: null };

  const v = versionDe(copia.estado);
  if (v > VERSION_ACTUAL) motivos.push('version_futura');
  if (!Array.isArray(copia.estado?.modulos)) motivos.push('sin_modulos');

  const desconocidos = (Array.isArray(copia.estado?.modulos) ? copia.estado.modulos : [])
    .map((m) => m?.id)
    .filter((id) => typeof id === 'string' && id && !IDS_EH.includes(id));
  if (desconocidos.length > 0) avisos.push({ id: 'modulos_desconocidos', cuantos: desconocidos.length });

  return {
    valida: motivos.length === 0,
    motivos,
    avisos,
    version: v,
    compatible: compatibilidad(v),
    /* ⚠️ El estado NO se devuelve si no es válida: así nadie puede escribir por
       error lo que acaba de fallar la validación. */
    estado: motivos.length === 0 ? normalizarEstiloHombre(copia.estado) : null,
  };
}

/* ===========================================================================
   7 · EL REGISTRO (apartado 18)
   ===========================================================================
   *"Las operaciones importantes de recuperación deben quedar registradas… sin
   almacenar información personal innecesaria en esos registros."*

   ⚠️ Decisión 5 — qué, cuándo y cuántos. Nunca qué se llamaba. */

export const OPERACIONES = ['copia', 'restaurar_elemento', 'restaurar_modulo', 'restaurar_todo', 'importar', 'exportar'];

/** ⚠️ Los campos que un registro **nunca** puede llevar. */
export const CAMPOS_PROHIBIDOS = ['nombre', 'texto', 'nota', 'marca', 'foto', 'descripcion', 'valor'];

export function registrar(operacion, { modulo = null, cuantos = null, ok = true, cuando = null } = {}) {
  if (!OPERACIONES.includes(operacion)) return null;
  return {
    operacion,
    /* ⚠️ El id del módulo sí: es del catálogo, lo escribí yo, y sin él el
       registro no sirve para investigar nada. El nombre de lo que había dentro,
       no. */
    modulo: modulo && IDS_EH.includes(modulo) ? modulo : null,
    cuantos: Number.isFinite(cuantos) ? cuantos : null,
    ok: !!ok,
    cuando: cuando || new Date().toISOString(),
  };
}

/** 🚨 La comprobación de que el registro no se ha convertido en una copia. */
export const registroLimpio = (entrada) => !!entrada
  && Object.keys(entrada).every((k) => !CAMPOS_PROHIBIDOS.includes(k));

/* ===========================================================================
   8 · LA PRUEBA DE RESTAURACIÓN (apartado 16)
   ===========================================================================
   *"No basta con crear backups. Hay que comprobar que realmente pueden
   restaurarse: crear datos de prueba → backup → modificar/eliminar →
   restaurar."*

   ⚠️ Y eso es exactamente lo que hace esta función, aquí y no solo en la prueba:
   así se puede ejecutar el día que haga falta comprobarlo de verdad. */

export function ensayoDeRestauracion({ hoy = todayISO() } = {}) {
  // 1 · datos de prueba
  const conDatos = normalizarEstiloHombre({
    configurado: true,
    modulos: [
      { id: 'perfumes', activo: true, orden: 0, config: { perfumes: { perfumes: [{ id: 'a' }, { id: 'b' }] } } },
      { id: 'skincare', activo: true, orden: 1, config: { seguimiento: { registros: [{ id: 'r1' }] } } },
    ],
  });
  // 2 · copia
  const copia = copiaDeSeguridad(conDatos, { hoy });
  // 3 · se pierde lo de un módulo
  const roto = {
    ...conDatos,
    modulos: conDatos.modulos.map((m) => (m.id === 'perfumes' ? { ...m, config: {} } : m)),
  };
  // 4 · se restaura SOLO ese módulo
  const vuelto = restaurarModulo(roto, 'perfumes', copia, { hoy });

  const cuenta = (e, id) => (e.modulos.find((m) => m.id === id)?.config?.perfumes?.perfumes || []).length;
  const registros = (e) => (e.modulos.find((m) => m.id === 'skincare')?.config?.seguimiento?.registros || []).length;

  return {
    antes: cuenta(conDatos, 'perfumes'),
    trasRomper: cuenta(roto, 'perfumes'),
    trasRestaurar: cuenta(vuelto.estado, 'perfumes'),
    /* 🚨 Y lo que de verdad importa del nivel 3: el OTRO módulo no se ha movido. */
    otroModuloIntacto: registros(vuelto.estado) === registros(conDatos),
    hecho: vuelto.hecho,
    seRecupero: cuenta(vuelto.estado, 'perfumes') === cuenta(conDatos, 'perfumes'),
  };
}

/* ===========================================================================
   9 · LOS SIMULACROS (apartado 17)
   ===========================================================================
   *"Simular error de migración, pérdida de conexión, datos dañados, eliminación
   accidental y conflicto de dispositivos. Comprobar recuperación."*

   ⚠️ Los cuatro primeros se recuperan. El quinto **no**, y se dice. */

export const SIMULACROS = [
  {
    id: 'error_migracion', que: 'Error de migración',
    seRecupera: true,
    como: 'La migración hace copia antes de tocar; si algo revienta devuelve el estado original con un error.',
    nivel: 4,
    donde: 'migracion.js · test-migracion.mjs',
  },
  {
    id: 'perdida_conexion', que: 'Pérdida de conexión',
    seRecupera: true,
    como: 'Se detecta con `navigator.onLine` y hay un estado con su aviso. Lo que hay en pantalla se sigue usando.',
    nivel: null,
    donde: 'estadosEstilo.js',
  },
  {
    id: 'datos_danados', que: 'Datos dañados',
    seRecupera: true,
    como: 'El normalizador aparta lo que no entiende en vez de reventar, y `avisoDeCorrupto` lo dice.',
    nivel: 3,
    donde: 'estiloDeHombre.js · estadosEstilo.js',
  },
  {
    id: 'eliminacion_accidental', que: 'Eliminación accidental',
    seRecupera: true,
    como: `La papelera global, con ${RETENCION_PAPELERA_DIAS} días para volver.`,
    nivel: 1,
    donde: 'papelera.js',
  },
  {
    id: 'conflicto_dispositivos', que: 'Conflicto entre dispositivos',
    /* 🚨 Éste no. Y es la cuarta fase que lo dice. */
    seRecupera: false,
    como: 'No se detecta: `app_data` no guarda versión ni marca de tiempo por elemento, así que el último en escribir gana y el otro cambio se pierde sin aviso.',
    porque: 'Es una decisión de esquema abierta desde la F41. Arreglarlo es añadir una columna y una política de resolución, no un parche.',
    nivel: null,
    donde: 'LO_QUE_FALTA · conflicto_restauracion',
  },
];

export const simulacro = (id) => SIMULACROS.find((s) => s.id === id) || null;
export const simulacrosSinRecuperacion = () => SIMULACROS.filter((s) => !s.seRecupera).map((s) => s.id);

/* ===========================================================================
   10 · LOS DIECIOCHO APARTADOS
   =========================================================================== */

export const APARTADOS_RECUPERACION = [
  { id: 1, nombre: 'Backup global', cumplido: false, donde: 'LO_QUE_FALTA · sistema_global' },
  { id: 2, nombre: 'Copias automáticas', cumplido: false, donde: 'LO_QUE_FALTA · copias_automaticas' },
  { id: 3, nombre: 'Backup antes de cambios importantes', cumplido: true, donde: 'MOMENTOS_DE_COPIA' },
  { id: 4, nombre: 'Restauración', cumplido: true, donde: 'restaurarModulo · restaurarTodo' },
  { id: 5, nombre: 'No restaurar toda la app sin necesidad', cumplido: true, donde: 'NIVELES — cuatro, del más pequeño al más grande' },
  { id: 6, nombre: 'Recuperación de un elemento', cumplido: true, donde: 'La papelera global (ME F3)' },
  { id: 7, nombre: 'Recuperación de un módulo', cumplido: true, donde: 'restaurarModulo() — nuevo en esta fase' },
  { id: 8, nombre: 'Restauración completa', cumplido: true, donde: 'restaurarTodo(), con confirmación y aviso' },
  { id: 9, nombre: 'Historial de cambios', cumplido: false, donde: 'LO_QUE_FALTA · historial_versiones' },
  { id: 10, nombre: 'Recuperación de configuración', cumplido: true, donde: 'restablecerDiseno (F31) y restablecerEstilo (F36)' },
  { id: 11, nombre: 'Restauración y sincronización', cumplido: false, donde: 'LO_QUE_FALTA · sincronizar_tras_restaurar' },
  { id: 12, nombre: 'Conflictos de restauración', cumplido: false, donde: 'LO_QUE_FALTA · conflicto_restauracion' },
  { id: 13, nombre: 'Seguridad', cumplido: true, donde: 'La copia es el mismo objeto, en la misma clave del mismo usuario' },
  { id: 14, nombre: 'Exportación', cumplido: true, donde: 'exportData.js + filasParaExportar (F43)' },
  { id: 15, nombre: 'Importación', cumplido: true, donde: 'validarCopia() — la cerradura; la pantalla no existe todavía' },
  { id: 16, nombre: 'Prueba de restauración', cumplido: true, donde: 'ensayoDeRestauracion()' },
  { id: 17, nombre: 'Prueba de desastre', cumplido: true, donde: 'SIMULACROS' },
  { id: 18, nombre: 'Registro', cumplido: true, donde: 'registrar() · registroLimpio()' },
];

export const apartadoRecuperacion = (id) => APARTADOS_RECUPERACION.find((a) => a.id === id) || null;
export const apartadosSinCumplir = () => APARTADOS_RECUPERACION.filter((a) => !a.cumplido);

/* ===========================================================================
   11 · EL PARTE
   =========================================================================== */

export function auditarRecuperacion() {
  const ensayo = ensayoDeRestauracion();
  return {
    niveles: NIVELES.length,
    nivelesQueExisten: NIVELES.filter((n) => n.existe).length,
    // ⚠️ Y ninguno de los que faltan se queda sin decir por qué.
    sinMotivo: LO_QUE_FALTA.filter((f) => !f.porque).map((f) => f.id),
    sinAlternativa: LO_QUE_FALTA.filter((f) => !f.loQueHay).map((f) => f.id),
    faltan: LO_QUE_FALTA.map((f) => f.apartado),
    ensayo,
    simulacrosSinRecuperacion: simulacrosSinRecuperacion(),
    sinCumplir: apartadosSinCumplir().map((a) => a.id),
    sinDonde: APARTADOS_RECUPERACION.filter((a) => !a.donde).map((a) => a.id),
    coleccionesRecuperables: CLAVES_PAPELERA_EH.length,
  };
}

export function panelRecuperacion() {
  const a = auditarRecuperacion();
  return {
    ...a,
    nivelesLista: NIVELES,
    falta: LO_QUE_FALTA,
    simulacros: SIMULACROS,
    apartados: APARTADOS_RECUPERACION,
    gravedades: GRAVEDADES,
    /* 🎯 El veredicto: **los cuatro niveles existen y la restauración se ha
       probado de verdad**. Lo que depende de un sistema global que no existe
       queda fuera, dicho con su nombre. */
    protegido: a.nivelesQueExisten === NIVELES.length
      && a.ensayo.seRecupero
      && a.ensayo.otroModuloIntacto
      && a.sinMotivo.length === 0
      && a.sinDonde.length === 0,
    condicion: 'Elemento eliminado → 🗑️ recuperación rápida. Configuración → 🔄 restablecer. Módulo → ♻️ restauración específica. Problema grave → ☁️ copia. Varios niveles sin complicar el día a día.',
  };
}

export { CATALOGO_PAPELERA, RETENCION_PAPELERA_DIAS, restaurarCopia, restablecerEstilo,
  restablecerDiseno, GRAVEDADES, gravedad, CAIDAS, PLAN_DE_VUELTA_ATRAS, VERSION_ACTUAL };
