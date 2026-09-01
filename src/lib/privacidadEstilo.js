// ============================================================================
// EH · Fase 43/65 — SEGURIDAD, PRIVACIDAD Y CONTROL DE DATOS
//
// *"Los datos son del usuario y debe poder decidir qué ocurre con ellos."*
//
// Y la condición de finalización, que es una lista de cosas que **no** hay que
// hacer: *"Estilo de hombre no crea sistemas paralelos de 🔐 contraseñas,
// 🗑️ papelera, 📤 exportación, ☁️ sincronización ni 👤 cuentas. Todo se
// centraliza."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ ESTA FASE SE COMPRUEBA, NO SE CONSTRUYE.** Lo que pide el enunciado es
// que **no exista** nada: ni un PIN propio, ni una papelera propia, ni una
// exportación propia, ni un guardado propio. Así que lo que se construye es la
// **auditoría que lo demuestra**, leyendo el código de las veintiocho librerías
// de Estilo de hombre. Y la pantalla que se lo enseña a Josué.
//
// **2. 🚨 Y ENCONTRÓ UNO DE VERDAD.** `loaded` se ponía a `true` una sola vez y
// **no volvía a bajar nunca**: al cerrar sesión y entrar con otra cuenta, la
// aplicación se pintaba **con los datos del usuario anterior** hasta que Supabase
// contestaba. Es exactamente lo que prohíbe el apartado 15. Arreglado en
// `App.jsx`, con una comprobación que lee el código para que no vuelva.
//
// **3. ⚠️ EL AISLAMIENTO ES DE LA BASE DE DATOS, NO DE LA PANTALLA** (apartados
// 1, 2 y 10). Las cuatro políticas de `app_data` son `auth.uid() = user_id`, y
// se comprueban **leyendo `supabase/schema.sql`**: una política del tipo
// `auth.uid() IS NOT NULL` dejaría a cualquiera leer la fila de cualquiera, y por
// eso la auditoría la busca expresamente.
//
// **4. ⚠️ LO QUE NO VIAJA, NO VIAJA** (apartados 5 y 11). El perfil de piel lleva
// escrito `paraIA: false` desde la F13, las notas privadas del horario no entran
// en el contexto desde HT F5, y la F34 dejó `estiloHombre` **fuera de
// `currentState`** justo para que no llegara a la IA. Aquí se junta todo en una
// lista y se comprueba que sigue siendo verdad.
//
// **5. ⚠️ NI UN SECRETO EN EL CLIENTE** (apartado 10). La clave de Anthropic vive
// en la función de Vercel (`api/ask-ai.js`); el navegador solo llama a
// `/api/ask-ai`. La auditoría busca claves escritas a mano en `src/`.
//
// **6. ⚠️ Y LO QUE NO EXISTE SE DICE.** JosStyle **no tiene analítica** (apartado
// 12) ni un sistema de afiliación (11, y D2-03 lo prohíbe), así que no hay nada
// que restringir: se declara con su motivo, en vez de escribir una política
// sobre algo que no ocurre.
// ============================================================================

import { REGISTRO_DATOS, datoDelRegistro } from './datosEstiloHombre';
import { CATALOGO_PAPELERA } from './papelera';
import { MODULOS_EH, IDS_EH } from './estiloDeHombre';
import { CATALOGO_VACIO_PORQUE, AVISO_AFILIACION } from './motorProductos';

/* ===========================================================================
   1 · LOS SISTEMAS QUE NO SE DUPLICAN (condición de finalización)
   ===========================================================================
   ⚠️ Una línea por sistema, con **dónde vive** y **qué NO puede aparecer** en
   las librerías de Estilo de hombre. La auditoría busca esos patrones en el
   código de verdad. */

export const SISTEMAS_CENTRALIZADOS = [
  {
    id: 'contrasenas', icono: '🔐', nombre: 'Contraseñas y PIN',
    vive: 'Ajustes · seguridad (pin.js y PinGate)',
    // ⚠️ Apartado 4 — *"no crear contraseñas o PIN independientes para cada apartado"*.
    prohibido: /crearPinHash|verificarPin|pinHash\s*[:=]|solicitarPin/,
  },
  {
    id: 'papelera', icono: '🗑️', nombre: 'Eliminados recientemente',
    vive: 'papelera.js (ME F3)',
    // Usar la global está bien; tener la suya, no.
    prohibido: /DEFAULT_PAPELERA_[A-Z]|papeleraDeEstilo|CATALOGO_PAPELERA_EH\s*=\s*\{/,
  },
  {
    id: 'exportacion', icono: '📤', nombre: 'Exportar mis datos',
    vive: 'exportData.js',
    prohibido: /exportCSV\s*\(|exportXLSX\s*\(|new Blob\(|createObjectURL/,
  },
  {
    id: 'sincronizacion', icono: '☁️', nombre: 'Guardado y sincronización',
    vive: 'supabase.js · app_data',
    prohibido: /saveData\s*\(|loadData\s*\(|localStorage|sessionStorage|indexedDB/i,
  },
  {
    id: 'cuentas', icono: '👤', nombre: 'Tu cuenta',
    vive: 'supabase.js · auth',
    prohibido: /signIn\s*\(|signUp\s*\(|signOut\s*\(|supabase\.auth/,
  },
];

export const sistemaCentralizado = (id) => SISTEMAS_CENTRALIZADOS.find((s) => s.id === id) || null;

/** Las librerías de Estilo de hombre, que son las que no pueden duplicar nada. */
export const LIBRERIAS_EH = [
  'estiloDeHombre', 'gestionModulos', 'configuracionInicial', 'datosEstiloHombre',
  'armarioEnEstiloHombre', 'perfilEstilo', 'cuestionarios', 'rutinasPelo',
  'recomendacionesPelo', 'productosPelo', 'peluqueria', 'perfilCapilar', 'cortesPelo',
  'perfilPiel', 'rutinasPiel', 'seguimientoPiel', 'recomendacionesPiel', 'productosPiel',
  'motorRutinas', 'motorRecomendaciones', 'motorProductos', 'perfilBarba', 'rutinasBarba',
  'sonrisa', 'perfumes', 'recomendacionesPerfumes', 'accesorios', 'gustos',
  'objetivosEnEstiloHombre', 'miEstilo', 'pantallaEH', 'ideasEstilo', 'descubrir',
  'preferenciasEstilo', 'progresoEstilo', 'gestionEstilo', 'buscadorEstilo',
  'avisosEstilo', 'integracionEstilo', 'primerUso', 'estadosEstilo', 'accesibilidadEH',
  // EH F18, F19 y F22 — llegaron después de la auditoría, y entran en ella.
  'cuerpoHigiene', 'rutinasCuerpo', 'manosPies',
  /* 🐛 ⚠️ **EH F48** — y las cinco de las fases de revisión, que se habían
     quedado fuera. Una librería que no está en esta lista **no la mira nadie**:
     ni la auditoría de privacidad (F43) ni la de duplicados de esta fase. Lo
     encontró la comprobación que compara la lista con lo que hay en `src/lib`. */
  'rendimiento', 'estructuraDatos', 'migracion', 'pruebasIntegrales', 'auditoriaFinal',
  'privacidadEstilo',
  /* 🐛 ⚠️ **EH F53** — y las CINCO de las fases de revisión siguientes, que se
     habían vuelto a quedar fuera. La comprobación de la F48 solo cazó
     `documentacionEH` porque su expresión busca nombres que acaban en `EH`:
     `coherenciaVisual`, `microinteracciones`, `experienciaReal` y `produccion`
     **no acaban en nada reconocible**, así que llevaban cuatro fases sin que
     las mirara ni la auditoría de privacidad ni la de duplicados. La misma
     lección otra vez: un detector que solo caza lo que se parece a lo de antes
     deja de cazar en cuanto cambian los nombres. */
  'coherenciaVisual', 'microinteracciones', 'experienciaReal', 'produccion',
  'documentacionEH',
];

/* ===========================================================================
   2 · LO QUE ESTILO DE HOMBRE GUARDA (apartado 1)
   ===========================================================================
   *"Toda la información de Estilo de hombre pertenece a la cuenta del usuario.
   No son públicos."* */

export const LO_QUE_GUARDA = [
  { id: 'preferencias', icono: '⚙️', que: 'Tus preferencias de estilo', donde: 'estiloHombre · datos' },
  { id: 'perfumes', icono: '🌫️', que: 'Tus perfumes y cuándo los usas', donde: 'estiloHombre · perfumes' },
  { id: 'accesorios', icono: '🕶️', que: 'Tus accesorios', donde: 'el Armario, referenciado desde aquí' },
  { id: 'gustos', icono: '❤️', que: 'Lo que te gusta y lo que quieres hacer', donde: 'estiloHombre · gustos' },
  { id: 'rutinas', icono: '🧴', que: 'Tus rutinas y lo que has hecho', donde: 'estiloHombre · cada apartado' },
  { id: 'guardadas', icono: '💡', que: 'Las ideas que has guardado', donde: 'estiloHombre · ideas' },
  { id: 'historiales', icono: '📈', que: 'Tus registros de seguimiento', donde: 'estiloHombre · cada apartado' },
];

/*
 * ⚠️ Apartado 5 — lo que **no puede salir** en un aviso ni viajar a la IA.
 *
 * ⚠️ `paraIA: false` **no vive en el registro de la F4**: vive en el propio dato
 * que devuelve cada módulo (`perfilPiel.js` lo escribió en la F13, apartado 17).
 * Así que aquí se declara **qué campos del registro forman ese perfil**, y la
 * prueba comprueba las dos cosas: que la lista no está vacía y que el módulo
 * sigue marcando su dato como privado.
 */
export const CAMPOS_PRIVADOS = [
  'tipoPiel', 'sensibilidadPiel',
];

export function datosQueNoViajan() {
  return CAMPOS_PRIVADOS
    .map((id) => datoDelRegistro(id))
    .filter(Boolean)
    .map((d) => ({ id: d.id, nombre: d.nombre, usan: d.usan || [] }));
}

/** ¿Puede este dato salir en una notificación? (apartado 5) */
export function puedeSalirEnUnAviso(datoId) {
  const d = datoDelRegistro(datoId);
  if (!d) return { puede: false, porque: 'No es un dato del registro.' };
  if (CAMPOS_PRIVADOS.includes(datoId)) {
    return { puede: false, porque: 'Es de lo más privado que guardas: no sale de la aplicación.' };
  }
  return { puede: true, porque: null };
}

/* ===========================================================================
   3 · LO QUE NO EXISTE, DICHO (apartados 11 y 12)
   =========================================================================== */

export const NO_EXISTE = [
  {
    apartado: 11, id: 'afiliacion', nombre: 'Afiliación',
    porque: AVISO_AFILIACION,
  },
  {
    apartado: 12, id: 'analitica', nombre: 'Analítica',
    porque: 'JosStyle no mide lo que haces dentro de la aplicación: no hay nada que recoger ni que desactivar.',
  },
];

export const TEXTOS_PRIVACIDAD = {
  titulo: '🔒 Tus datos',
  sub: 'Todo lo de Estilo de hombre es tuyo y va con tu cuenta.',
  soloTuyo: 'Solo tú puedes verlo: se guarda con tu cuenta, no en el teléfono.',
  entreDispositivos: 'Por eso lo ves igual en el móvil y en el ordenador.',
  alCerrarSesion: 'Al cerrar sesión deja de estar disponible aquí, y vuelve al entrar de nuevo.',
  /* Apartados 6, 7 y 8 — la papelera global, con sus palabras. */
  alBorrar: 'Lo que borras va a Eliminados recientemente, y puedes recuperarlo.',
  definitivo: 'Esta acción no se puede deshacer.',
  /* Apartado 9. */
  exportar: 'Puedes descargar una copia de todo desde Ajustes.',
  /* Apartado 13. */
  borrarCuenta: 'Si algún día borras tu cuenta, esto se va con ella.',
  /* Apartado 4 — ni un PIN propio. */
  sinPinPropio: 'No hay una contraseña aparte para este apartado: la de JosStyle vale para todo.',
  /* Apartado 5. */
  loMasPrivado: 'Lo más privado no sale nunca de la aplicación: ni en un aviso, ni a la IA.',
};

/* ===========================================================================
   4 · LA AUDITORÍA
   ===========================================================================
   ⚠️ Recibe los archivos ya leídos —esta librería no toca el disco— y devuelve
   qué sistema estaría duplicando cada uno. */

/* 🐛 ⚠️ **EH F48 — un revisor no puede señalarse a sí mismo.** Un comentario no
   es código —eso ya estaba—, pero **tampoco lo son las reglas ni los textos**:
   una regla que busca cierto patrón no ejecuta ese patrón, y una línea que
   EXPLICA dónde vive el guardado no guarda nada. En cuanto `privacidadEstilo.js`,
   `auditoriaFinal.js` y `rendimiento.js` entraron en la lista de librerías, los
   revisores empezaron a cazarse entre ellos.

   ⚠️ **Y por eso son DOS limpiadores, no uno.** Para los sistemas duplicados,
   una cadena de texto es documentación. Para los **secretos** es justo al revés:
   una clave filtrada vive **dentro de una cadena**, y borrarlas dejaría pasar lo
   único que se busca. Duodécima vez que una comprobación salta con algo que
   estaba bien — y la primera en que arreglarla mal habría roto otra. */
export const sinComentarios = (t) => String(t || '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

/**
 * Solo código: sin comentarios, **sin las reglas declaradas** y **sin textos**.
 * ⚠️ Lo usan los dos revisores de sistemas duplicados (este y el de la F48); el
 * buscador de secretos usa `sinComentarios`, porque una clave filtrada vive
 * justo dentro de una cadena.
 */
export const sinReglas = (t) => sinComentarios(t)
  .replace(/(?:prohibido|busca|patron)\s*[:=]\s*\/(?:\\.|[^/])+\/[gimsuy]*/gi, '')
  .replace(/PATRONES?_[A-Z_]+\s*=\s*\[[\s\S]*?\];/g, '');

export const soloCodigo = (t) => sinReglas(t)
  .replace(/`[^`]*`/g, '``')
  .replace(/'(?:[^'\\]|\\.)*'/g, "''")
  .replace(/"(?:[^"\\]|\\.)*"/g, '""');

/**
 * ¿Alguna librería de Estilo de hombre monta un sistema paralelo?
 * `fuentes` es `{ nombreDelArchivo: contenido }`.
 */
export function auditarDuplicados(fuentes = {}) {
  const problemas = [];
  Object.entries(fuentes).forEach(([archivo, contenido]) => {
    // ⚠️ Solo código: ni comentarios, ni reglas, ni textos (ver arriba).
    const limpio = soloCodigo(contenido);
    SISTEMAS_CENTRALIZADOS.forEach((s) => {
      if (s.prohibido.test(limpio)) {
        problemas.push({ archivo, sistema: s.id, vive: s.vive });
      }
    });
  });
  return problemas;
}

/**
 * ⚠️ El aislamiento de verdad: las políticas de `app_data`. Se le pasa el
 * contenido de `supabase/schema.sql`.
 */
export const OPERACIONES_RLS = ['select', 'insert', 'update', 'delete'];

export function revisarAislamiento(schemaSql) {
  /* 🐛 ⚠️ **Sin los comentarios de SQL.** El propio `schema.sql` explica en una
     línea `--` que ninguna política es del tipo permisivo `auth.uid() IS NOT
     NULL`… y buscar esa frase en el archivo entero saltaba **con la frase que
     promete lo contrario**. Es la **undécima vez** en este proyecto que una
     comprobación salta con algo que estaba bien. */
  const sql = String(schemaSql || '')
    .replace(/--.*$/gm, '')
    .toLowerCase();
  const bloque = sql.slice(sql.indexOf('app_data'));
  const conRls = /alter table app_data enable row level security/.test(sql);
  const faltan = OPERACIONES_RLS.filter((op) => {
    const re = new RegExp(`for ${op}[^;]*auth\\.uid\\(\\)\\s*=\\s*user_id`, 's');
    return !re.test(bloque);
  });
  // ⚠️ La política peligrosa: cualquiera autenticado leyendo la fila de cualquiera.
  const permisivas = /auth\.uid\(\)\s+is\s+not\s+null/.test(bloque);
  return {
    rlsActivada: conRls,
    faltan,
    permisivas,
    // Todo bien = RLS puesta, las cuatro operaciones atadas al usuario y ninguna permisiva.
    aislado: conRls && faltan.length === 0 && !permisivas,
  };
}

/** ⚠️ Apartado 10 — ni una clave escrita a mano en el navegador. */
export const PATRONES_SECRETO = [
  /* ⚠️ Con guiones y guiones bajos: una clave de Anthropic de verdad empieza por
     `sk-ant-api03-…`, y un patrón que solo aceptara letras y números **se
     quedaría en "sk-ant" y no la reconocería**. La comprobación de seguridad que
     no reconoce lo que busca es peor que no tenerla. */
  /sk-[a-zA-Z0-9_-]{16,}/,
  /ANTHROPIC_API_KEY\s*[:=]\s*['"][^'"]+['"]/,
  /service_role/i,
  /SUPABASE_SERVICE/i,
];

export function buscarSecretos(fuentes = {}) {
  const encontrados = [];
  Object.entries(fuentes).forEach(([archivo, contenido]) => {
    /* ⚠️ Sin comentarios y **sin el propio rulebook**: una clave filtrada vive
       dentro de una cadena —así que las cadenas NO se tocan aquí—, pero los
       patrones que la buscan están escritos en este mismo archivo, y sin quitar
       esa lista el escáner se denuncia a sí mismo (EH F48). */
    const limpio = sinReglas(contenido);
    PATRONES_SECRETO.forEach((re, i) => {
      if (re.test(limpio)) encontrados.push({ archivo, patron: i });
    });
  });
  return encontrados;
}

export function auditarPrivacidad({ fuentes = {}, schemaSql = '', app = '' } = {}) {
  const aislamiento = revisarAislamiento(schemaSql);
  const limpioApp = sinComentarios(app);
  return {
    sistemas: SISTEMAS_CENTRALIZADOS.length,
    duplicados: auditarDuplicados(fuentes),
    secretos: buscarSecretos(fuentes),
    aislamiento,
    // ⚠️ Decisión 2 — el arreglo de la sesión, comprobado sobre el código.
    reinicioDeSesion: /setLoaded\(false\)/.test(limpioApp)
      && /\[session\?\.user\?\.id\]/.test(limpioApp),
    // Lo que Estilo de hombre guarda, y lo que no sale nunca.
    guarda: LO_QUE_GUARDA.length,
    noViajan: datosQueNoViajan().map((d) => d.id),
    // Lo que no existe y por eso no hay nada que restringir.
    noExiste: NO_EXISTE.map((x) => x.id),
    // Todas las colecciones de Estilo de hombre están en la papelera GLOBAL.
    enPapeleraGlobal: Object.keys(CATALOGO_PAPELERA).filter((k) => IDS_EH.includes(CATALOGO_PAPELERA[k].modulo)).length,
    catalogoVacio: typeof CATALOGO_VACIO_PORQUE === 'string' && CATALOGO_VACIO_PORQUE.length > 0,
  };
}

export function textosDePrivacidad() {
  return [
    ...Object.values(TEXTOS_PRIVACIDAD),
    ...LO_QUE_GUARDA.map((x) => x.que),
    ...SISTEMAS_CENTRALIZADOS.map((x) => x.nombre),
    ...NO_EXISTE.map((x) => x.porque),
  ];
}

export function panelPrivacidad() {
  return {
    titulo: TEXTOS_PRIVACIDAD.titulo,
    sub: TEXTOS_PRIVACIDAD.sub,
    guarda: LO_QUE_GUARDA,
    // Dónde vive cada sistema, para que se vea que no hay ninguno aquí dentro.
    sistemas: SISTEMAS_CENTRALIZADOS.map((s) => ({ id: s.id, icono: s.icono, nombre: s.nombre, vive: s.vive })),
    // Lo más privado, que no sale ni en un aviso.
    noViajan: datosQueNoViajan(),
    loMasPrivado: TEXTOS_PRIVACIDAD.loMasPrivado,
    noExiste: NO_EXISTE,
    avisos: [
      TEXTOS_PRIVACIDAD.soloTuyo,
      TEXTOS_PRIVACIDAD.entreDispositivos,
      TEXTOS_PRIVACIDAD.alCerrarSesion,
      TEXTOS_PRIVACIDAD.alBorrar,
      TEXTOS_PRIVACIDAD.exportar,
      TEXTOS_PRIVACIDAD.sinPinPropio,
      TEXTOS_PRIVACIDAD.borrarCuenta,
    ],
  };
}

export { MODULOS_EH };
