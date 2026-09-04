// ============================================================================
// EH · Fase 63/65 — SEGURIDAD, PRIVACIDAD Y CONTROL DE DATOS
//
// *"El usuario debe tener control sobre sus datos y JC Fitness debe almacenar
// únicamente lo necesario."*
//
// Y la condición de finalización: *"Privacidad por diseño. **No añadir seguridad
// al final.** La seguridad debe formar parte de arquitectura → base de datos →
// backend → IA → interfaz."*
//
// ── QUÉ SE CONSTRUYE AQUÍ ──────────────────────────────────────────────────
//
// La **F43** ya revisó la privacidad de Estilo de hombre: qué guarda, que no
// duplica el PIN ni la papelera ni la exportación, y que lo privado no viaja.
// Ésta es la revisión **de seguridad**, con veinte apartados, y mira sitios que
// la F43 no miró: **el endpoint de la IA**, la validación, las inyecciones, el
// borrado de cuenta y los registros.
//
// ── 🚨 Y ENCONTRÓ EL FALLO MÁS CARO DE TODO EL PROYECTO ────────────────────
//
// **`api/ask-ai.js` no pide quién eres.** No tiene autenticación, ni límite de
// uso, ni comprobaba el tamaño de lo que le mandan. Cualquiera que sepa la URL
// —`https://…vercel.app/api/ask-ai`— puede llamarlo desde una terminal y
// **gastar el dinero de Josué** en la API de Anthropic, todas las veces que
// quiera.
//
// No es una vulnerabilidad de datos: no se puede leer nada de nadie con eso. Es
// una **factura**. Y el apartado 14 lo pide con estas cuatro palabras:
// *"autenticación, autorización, límites de uso, protección de endpoints"*.
//
// ── LAS CUATRO DECISIONES QUE GOBIERNAN ESTA FASE ──────────────────────────
//
// **1. 🚨 SE ARREGLA LO QUE SE PUEDE ARREGLAR SIN ROMPER NADA, Y SE DICE EL
// RESTO.** Esta fase pone **límites de tamaño** en el endpoint (apartado 15: *"no
// confiar en datos enviados desde el cliente"*), que es holgado para lo que la
// aplicación manda y no cambia nada. La **autenticación no se pone desde aquí**:
// afecta a toda la aplicación, no solo a Estilo de hombre, y una fase de este
// módulo no decide por el resto. Queda como 🔴, con el arreglo escrito.
//
// > 🚨 **Y así fue: se escribió, se le enseñó a Josué, y Josué decidió.** El 4 de
// > septiembre de 2026 dijo que se cerrara, y se cerró — el arreglo era el que
// > está escrito arriba, palabra por palabra. Esta fase no lo hizo por su cuenta
// > y por eso pudo hacerse bien: `HALLAZGO_ENDPOINT` lleva el cómo y el qué sigue
// > abierto (el límite por usuario vive en memoria, no en Supabase). Lo de arriba
// > se queda tal cual: es el registro de lo que había.
//
// **2. ⚠️ EL AISLAMIENTO NO ES DE LA PANTALLA, ES DE LA BASE DE DATOS.**
// (Apartado 3: *"nunca confiar únicamente en que la interfaz oculte
// información"*.) Las cuatro políticas de `app_data` son `auth.uid() = user_id`,
// comprobadas leyendo el `schema.sql`. Sin ellas, esconder un botón no protege
// absolutamente nada.
//
// **3. ⚠️ LO INFERIDO SE BORRA SIN PERDER LO SUYO** (apartado 7). Ya lo hizo la
// **F57**: `borrarAprendizaje()` se lleva las deducciones y deja los perfumes,
// las rutinas y los registros. Aquí se comprueba, no se rehace.
//
// **4. 🚨 Y LA PRUEBA FINAL SE INTENTA DE VERDAD** (apartado 20). Cinco ataques
// —leer datos de otro, cambiar un id ajeno, llamar sin autorización, mandar basura
// y manipular la petición— y para cada uno **qué lo para**. Los que no se pueden
// intentar desde aquí se dicen.
// ============================================================================

import { normalizarEstiloHombre, IDS_EH } from './estiloDeHombre';
import { LO_QUE_GUARDA, CAMPOS_PRIVADOS, SISTEMAS_CENTRALIZADOS, LIBRERIAS_EH, datosQueNoViajan } from './privacidadEstilo';
import { permisoIA, contextoParaIA, llevaAlgoPrivado } from './iaEstilo';
import { borrarAprendizaje, datosAprendizaje, PANEL_MEMORIA } from './aprendizaje';
import { registrar, registroLimpio, CAMPOS_PROHIBIDOS } from './recuperacion';
import { CATALOGO_PAPELERA, RETENCION_PAPELERA_DIAS } from './papelera';
import { GRAVEDADES, gravedad } from './pruebasIntegrales';

/* ===========================================================================
   1 · QUÉ SE GUARDA, Y QUÉ ES SENSIBLE (apartados 1 y 2)
   =========================================================================== */

export const INVENTARIO = [
  ...LO_QUE_GUARDA.map((x) => ({ ...x, de: 'F43' })),
  {
    id: 'inferencias', icono: '🧠', que: 'Lo que la aplicación ha deducido de ti',
    donde: 'estiloHombre · config.aprendizaje', de: 'F57',
    /* ⚠️ Apartado 7 — separado a propósito de lo que él escribió. */
    esInferido: true,
  },
];

export const SENSIBLES = CAMPOS_PRIVADOS;

export const PROTECCION_EXTRA = {
  que: 'El tipo de piel y la sensibilidad.',
  como: 'No viajan a la IA ni salen en un aviso, ni con el interruptor de la F56 encendido.',
  deLasFases: ['F13', 'F43', 'F56'],
};

export const REGLA_INVENTARIO = 'Nada se guarda porque sea posible. Cada cosa de la lista está porque una fase la necesitaba.';

/* ===========================================================================
   2 · QUIÉN PUEDE LEER QUÉ (apartados 3, 5 y 19) — decisión 2
   =========================================================================== */

export const POLITICAS = ['select propio', 'insert propio', 'update propio', 'delete propio'];

export const CONDICION_RLS = /auth\.uid\(\) = user_id/;

/** ⚠️ Se comprueba sobre el `schema.sql` de verdad, no sobre esta lista. */
export function revisarAislamiento(sql) {
  const soloSQL = String(sql || '').split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  return {
    rlsActivado: /alter table app_data enable row level security/.test(soloSQL),
    politicas: POLITICAS.filter((p) => new RegExp(`create policy "${p}"`).test(soloSQL)),
    /* 🚨 La que de verdad importa: ninguna política permisiva. */
    permisivas: /auth\.uid\(\) IS NOT NULL/i.test(soloSQL),
    cascada: /on delete cascade/.test(soloSQL),
  };
}

/** Apartado 19 — quién puede hacer qué, en una línea por operación. */
export const AUDITORIA_DE_ACCESO = [
  { operacion: 'leer', quien: 'Solo el dueño de la fila', lo_impone: 'RLS · select propio' },
  { operacion: 'crear', quien: 'Solo con su propio user_id', lo_impone: 'RLS · insert propio' },
  { operacion: 'modificar', quien: 'Solo sus filas', lo_impone: 'RLS · update propio' },
  { operacion: 'eliminar', quien: 'Solo sus filas', lo_impone: 'RLS · delete propio' },
];

/* ===========================================================================
   3 · 🚨 EL ENDPOINT DE LA IA (apartados 14 y 15) — decisión 1
   =========================================================================== */

export const ENDPOINT_IA = {
  ruta: '/api/ask-ai',
  /* 🚨 Lo que NO tenía, y se cerró el 4 de septiembre de 2026. Ver
     HALLAZGO_ENDPOINT: no se cree esta bandera y ya está, `auditarSeguridad()`
     lo comprueba leyendo `api/ask-ai.js`. */
  autenticacion: true,
  limiteDeUso: true,
  /* ⚠️ Pero el límite es frágil a propósito, y hay que decirlo: vive en la
     memoria de la instancia de Vercel. Para un bucle de la aplicación sobra;
     para alguien decidido, no. */
  limiteDeUsoEsFragil: 'En memoria, no en Supabase: se salta repartiendo llamadas entre instancias.',
  /* ✅ Lo que sí tiene, desde esta fase. */
  validaEntradas: true,
  ocultaLaClave: true,
  soloPost: true,
};

export const LIMITES_ENTRADA = {
  prompt: 40000,
  system: 20000,
  imagenes: 10,
  porque: 'Holgados para lo que la aplicación manda de verdad. No cambian nada para Josué y ponen un techo a lo que puede costar una llamada.',
};

/* 🚨 El hallazgo de la fase, escrito para que no se pierda. */
export const HALLAZGO_ENDPOINT = {
  id: 'endpoint_sin_auth',
  gravedad: 'importante',
  que: '`/api/ask-ai` no pedía quién eres. Cualquiera que supiera la URL podía llamarlo y gastar el dinero de Josué en la API de Anthropic.',
  noEs: 'Una fuga de datos: con eso no se puede leer nada de nadie.',
  esUna: 'Una factura.',
  arreglo: 'Comprobar en la función el token de Supabase que ya manda el navegador (cabecera Authorization) y rechazar sin él. Y un límite por usuario.',
  porQueNoSeHaceAqui: '⚠️ Ese endpoint lo usan Nutrición, Calistenia, Biblioteca y el resto. Ponerle autenticación desde una fase de Estilo de hombre habría sido decidir por toda la aplicación, y hecho mal deja la IA rota en seis módulos. Era una decisión de Josué.',
  loQueSiSeHaHecho: 'Los límites de tamaño del apartado 15: un texto enorme o veinte imágenes ya se rechazan.',

  /* 🚨 **Cerrado.** Josué lo decidió el 4 de septiembre de 2026: se le presentó
     como lo que era —un gasto, no una fuga— y dijo que se cerrara. Lo de arriba
     no se toca: es el registro de lo que había, y de por qué no se hizo antes. */
  resuelto: true,
  cuando: '2026-09-04',
  loDecidio: 'Josué',
  comoSeCerro: '`api/ask-ai.js` le pregunta a Supabase de quién es el token de la cabecera `Authorization`, que `src/lib/ai.js` ya manda en sus tres llamadas. Sin token válido: 401, y no se llama a Anthropic.',
  /* ⚠️ Lo que NO queda cerrado, dicho aquí para que nadie lo dé por hecho. */
  loQueSigueAbierto: 'El límite por usuario vive en memoria, y Vercel levanta y tira instancias: para un límite de verdad haría falta una tabla en Supabase. Para en seco lo que de verdad puede pasar —un bucle de la aplicación, una pestaña reintentando sola—, no a alguien decidido a saltárselo.',
  seProbo: 'scripts/test-endpoint-ia.mjs, incluida la comprobación de que Supabase caído devuelve 503 y NO deja pasar.',
};

/* ===========================================================================
   4 · LAS ENTRADAS DEL USUARIO (apartado 16)
   ===========================================================================
   *"Todo texto introducido por el usuario debe tratarse como contenido no
   confiable."* */

export const CONTRA_INYECCIONES = [
  {
    id: 'html',
    riesgo: 'Que un texto suyo se ejecute como HTML',
    lo_para: 'React escapa todo lo que se pinta con `{}`. Y no hay ni un `dangerouslySetInnerHTML` en el proyecto.',
    comprobable: true,
    busca: /dangerouslySetInnerHTML/,
  },
  {
    id: 'sql',
    riesgo: 'Que un texto suyo cambie una consulta',
    lo_para: 'No se escribe SQL: se usa el cliente de Supabase, que manda los valores aparte de la consulta.',
    comprobable: true,
    busca: /\bfrom\s*\(\s*`|execute\s*\(|rpc\s*\(\s*`/,
  },
  {
    id: 'ia',
    riesgo: 'Que un texto suyo mande instrucciones a la IA',
    /* ⚠️ Aquí la respuesta honesta no es "está resuelto". */
    lo_para: 'Nada, y no hace falta: la IA solo le contesta a él. Que se dé instrucciones a sí mismo no le hace daño a nadie.',
    comprobable: false,
  },
];

export function revisarInyecciones(fuentes = {}) {
  const salida = [];
  CONTRA_INYECCIONES.filter((c) => c.comprobable).forEach((c) => {
    Object.entries(fuentes).forEach(([nombre, texto]) => {
      if (c.busca.test(String(texto || ''))) salida.push({ id: c.id, archivo: nombre });
    });
  });
  return salida;
}

/* ===========================================================================
   5 · LO INFERIDO Y LO SUYO (apartado 7) — decisión 3
   =========================================================================== */

export function separacionDeDatos(estado) {
  const e = normalizarEstiloHombre(estado);
  const antes = datosAprendizaje(e);
  const despues = datosAprendizaje(borrarAprendizaje(e));
  return {
    inferidasAntes: antes.inferidas.length,
    inferidasDespues: despues.inferidas.length,
    /* 🚨 Lo que importa: los módulos y su `config` siguen enteros. */
    modulosAntes: e.modulos.length,
    modulosDespues: borrarAprendizaje(e).modulos.length,
    deLaFase: 'F57',
  };
}

/* ===========================================================================
   6 · LAS TRES FORMAS DE QUITAR ALGO (apartados 8 y 9)
   =========================================================================== */

export const FORMAS_DE_QUITAR = [
  {
    id: 'ocultar', icono: '⚪', que: 'Ocultar',
    borra: false, reversible: true, confirma: false,
    detalle: 'Deja de verse. Sigue funcionando por dentro.',
  },
  {
    id: 'temporal', icono: '🗑️', que: 'Eliminar (a la papelera)',
    borra: false, reversible: true, confirma: false,
    detalle: `Va a Eliminados recientemente, con ${RETENCION_PAPELERA_DIAS} días para volver.`,
  },
  {
    id: 'definitivo', icono: '🔥', que: 'Eliminar definitivamente',
    borra: true, reversible: false, confirma: true,
    detalle: 'No vuelve. Se explica qué se borra y se pide confirmación.',
    /* 🚨 Apartado 9 — *"no hacerlo accidentalmente mediante un swipe"*. */
    porGesto: false,
  },
];

export const formaDeQuitar = (id) => FORMAS_DE_QUITAR.find((f) => f.id === id) || null;

/* ===========================================================================
   7 · REGISTROS Y DATOS LOCALES (apartados 12 y 13)
   =========================================================================== */

export const REGISTROS = {
  queSeApunta: 'Qué operación, cuándo y cuántos elementos.',
  queNo: CAMPOS_PROHIBIDOS,
  deLaFase: 'F54',
};

export const DATOS_LOCALES = [
  {
    id: 'sesion', que: 'El token de sesión de Supabase', donde: 'localStorage',
    esSecreto: true,
    porque: 'Lo pone la librería de Supabase, es cómo se mantiene la sesión, y caduca. No es de Estilo de hombre.',
  },
  {
    id: 'avisos', que: 'La marca de "ya te avisé hoy"', donde: 'localStorage',
    esSecreto: false,
    porque: 'Una fecha. Por dispositivo a propósito.',
  },
  {
    /* 🚨 Y lo importante: Estilo de hombre **no guarda nada local**. */
    id: 'estiloHombre', que: 'Los datos de Estilo de hombre', donde: 'Supabase, no el dispositivo',
    esSecreto: false,
    porque: 'La F43 lo comprueba leyendo el código: ninguna librería de Estilo de hombre toca `localStorage`.',
  },
];

export const SECRETOS_LOCALES = () => DATOS_LOCALES.filter((d) => d.esSecreto).map((d) => d.id);

/* ===========================================================================
   8 · BORRADO DE CUENTA Y COPIAS (apartados 17 y 18)
   =========================================================================== */

export const BORRADO_DE_CUENTA = {
  que: 'Se borra la fila de `auth.users`.',
  /* ⚠️ Y esto es lo que hace que no quede nada huérfano, sin código extra. */
  arrastra: '`on delete cascade` en `app_data.user_id`: se van TODAS sus claves, incluida `estiloHombre`.',
  huerfano: 'Nada. Ni una fila queda sin dueño.',
  comprobable: true,
  loQueFalta: 'Los archivos de Storage (fotos, vídeos) no se borran con la cascada: eso hay que mirarlo aparte, y no es de Estilo de hombre, que no usa ningún bucket.',
};

export const COPIAS = {
  donde: 'La copia que hace la F46 antes de migrar, en memoria.',
  seguridad: 'Es el mismo objeto, del mismo usuario, en la misma clave. No abre una segunda puerta.',
  retencion: 'Dura lo que dura la migración.',
  deLaFase: 'F46 y F54',
};

/* ===========================================================================
   9 · LA PRUEBA FINAL (apartado 20) — 🚨 decisión 4
   =========================================================================== */

export const ATAQUES = [
  {
    id: 'leer_de_otro', que: 'Acceder a los datos de otro usuario',
    loPara: 'La política `select propio`: la consulta devuelve cero filas, no un error.',
    seProbaraAqui: false,
    porque: 'Hace falta una segunda cuenta de verdad y una petición a Supabase. Es de R1.',
  },
  {
    id: 'cambiar_id', que: 'Modificar un id ajeno',
    loPara: 'La política `update propio`. Y el cliente **no manda `user_id`**: lo pone la sesión.',
    seProbaraAqui: false,
    porque: 'Igual: hace falta la base de datos de verdad.',
  },
  {
    id: 'endpoint_sin_auth', que: 'Consultar un endpoint sin autorización',
    /* 🚨 Éste era el hallazgo de la fase y NO se paraba. Cerrado el 4 de
       septiembre de 2026 por decisión de Josué. Ver HALLAZGO_ENDPOINT. */
    loPara: 'El token de sesión de Supabase, comprobado en el servidor. Sin él, `/api/ask-ai` devuelve 401 y no llama a Anthropic.',
    seProbaraAqui: true,
    pasa: true,
  },
  {
    id: 'datos_invalidos', que: 'Enviar datos inválidos',
    loPara: 'El normalizador: lo que no entiende lo aparta en vez de reventar. Y desde esta fase, los límites de tamaño del endpoint.',
    seProbaraAqui: true,
    pasa: true,
  },
  {
    id: 'manipular_peticion', que: 'Manipular la petición',
    loPara: 'RLS otra vez: da igual lo que mande el cliente, la fila se elige por `auth.uid()`.',
    seProbaraAqui: false,
    porque: 'Hace falta interceptar una petición real.',
  },
];

export const ataque = (id) => ATAQUES.find((a) => a.id === id) || null;
export const ataquesQueNoSeParan = () => ATAQUES.filter((a) => a.pasa === false).map((a) => a.id);

/* ===========================================================================
   10 · LOS VEINTE APARTADOS
   =========================================================================== */

export const APARTADOS_SEGURIDAD = [
  { id: 1, nombre: 'Inventario de datos', cumplido: true, donde: 'INVENTARIO' },
  { id: 2, nombre: 'Datos sensibles', cumplido: true, donde: 'SENSIBLES · PROTECCION_EXTRA' },
  { id: 3, nombre: 'Acceso', cumplido: true, donde: 'revisarAislamiento() sobre el schema.sql' },
  { id: 4, nombre: 'Autenticación', cumplido: true, donde: 'La cuenta global. No hay un segundo login (F43)' },
  { id: 5, nombre: 'Autorización', cumplido: true, donde: 'Las cuatro políticas de RLS' },
  { id: 6, nombre: 'IA', cumplido: true, donde: 'contextoParaIA() — solo lo de la pregunta (F56)' },
  { id: 7, nombre: 'Memoria', cumplido: true, donde: 'separacionDeDatos() — borrar lo inferido deja lo suyo (F57)' },
  { id: 8, nombre: 'Eliminación', cumplido: true, donde: 'FORMAS_DE_QUITAR — las tres, distintas' },
  { id: 9, nombre: 'Eliminación definitiva', cumplido: true, donde: 'Confirma, y NO se hace con un gesto' },
  { id: 10, nombre: 'Exportación', cumplido: true, donde: 'exportData.js + filasParaExportar (F43)' },
  { id: 11, nombre: 'Privacidad de IA', cumplido: true, donde: 'El interruptor de la F56 y el panel de la F57' },
  { id: 12, nombre: 'Datos locales', cumplido: true, donde: 'DATOS_LOCALES — EH no guarda nada local' },
  { id: 13, nombre: 'Logs', cumplido: true, donde: 'REGISTROS — sin un solo dato personal (F54)' },
  { id: 14, nombre: 'Seguridad de API', cumplido: true, donde: 'HALLAZGO_ENDPOINT — cerrado el 2026-09-04: token de Supabase comprobado en el servidor y límite por usuario' },
  { id: 15, nombre: 'Validación', cumplido: true, donde: 'LIMITES_ENTRADA en api/ask-ai.js, nuevos en esta fase' },
  { id: 16, nombre: 'Inyecciones', cumplido: true, donde: 'revisarInyecciones()' },
  { id: 17, nombre: 'Borrado de cuenta', cumplido: true, donde: 'BORRADO_DE_CUENTA — `on delete cascade`' },
  { id: 18, nombre: 'Copias de seguridad', cumplido: true, donde: 'COPIAS' },
  { id: 19, nombre: 'Auditoría', cumplido: true, donde: 'AUDITORIA_DE_ACCESO' },
  { id: 20, nombre: 'Prueba final', cumplido: true, donde: 'ATAQUES — los cinco, con qué los para' },
];

export const apartadoSeguridad = (id) => APARTADOS_SEGURIDAD.find((a) => a.id === id) || null;

export const CONDICION = 'Privacidad por diseño. La seguridad forma parte de la arquitectura, la base de datos, el backend, la IA y la interfaz — no se añade al final.';

/* ===========================================================================
   11 · EL PARTE
   =========================================================================== */

export function auditarSeguridad({ sql = '', api = '', fuentes = {} } = {}) {
  const aislamiento = sql ? revisarAislamiento(sql) : null;
  const sep = separacionDeDatos({});
  return {
    inventario: INVENTARIO.length,
    sensibles: SENSIBLES.length,
    // Decisión 2
    rlsActivado: aislamiento ? aislamiento.rlsActivado : null,
    politicas: aislamiento ? aislamiento.politicas.length : 0,
    politicasPermisivas: aislamiento ? aislamiento.permisivas : null,
    cascada: aislamiento ? aislamiento.cascada : null,
    // 🚨 Decisión 1
    endpointSinAuth: ENDPOINT_IA.autenticacion === false,
    endpointValida: api ? /LIMITE_PROMPT/.test(api) && /demasiado larga/.test(api) : null,
    /* 🚨 Se lee del archivo de verdad, no de la bandera de arriba. Si alguien
       quita la comprobación del token, esto se pone en falso solo. */
    endpointPideSesion: api ? /auth\/v1\/user/.test(api) && /status\(401\)/.test(api) : null,
    endpointFrena: api ? /status\(429\)/.test(api) : null,
    // Apartado 16
    inyecciones: revisarInyecciones(fuentes),
    // Decisión 3
    borrarInferidoDejaLoSuyo: sep.modulosAntes === sep.modulosDespues,
    // Apartado 12
    secretosLocales: SECRETOS_LOCALES(),
    // 🚨 Decisión 4
    ataquesQueNoSeParan: ataquesQueNoSeParan(),
    sinDonde: APARTADOS_SEGURIDAD.filter((a) => !a.donde).map((a) => a.id),
    sinCumplir: APARTADOS_SEGURIDAD.filter((a) => !a.cumplido).map((a) => a.id),
  };
}

export function panelSeguridad(opciones = {}) {
  const a = auditarSeguridad(opciones);
  return {
    ...a,
    inventarioLista: INVENTARIO,
    formasDeQuitar: FORMAS_DE_QUITAR,
    ataques: ATAQUES,
    hallazgo: HALLAZGO_ENDPOINT,
    apartados: APARTADOS_SEGURIDAD,
    gravedades: GRAVEDADES,
    /* 🎯 El veredicto: **los datos están protegidos donde importa** —en la base
       de datos— y lo que falta está dicho, no escondido. El endpoint queda como
       🟠 con su arreglo escrito: contarlo como verde sería el error de esta
       fase entera. */
    protegido: a.rlsActivado === true
      && a.politicas === 4
      && a.politicasPermisivas === false
      && a.cascada === true
      && a.inyecciones.length === 0
      && a.borrarInferidoDejaLoSuyo
      && a.endpointValida === true
      && a.endpointPideSesion === true
      && a.sinDonde.length === 0,
    /* 🚨 El hallazgo sigue estando aquí —es el registro—, pero ya no está
       pendiente: `pendienteDeJosue` se calcula, para que el panel no pueda
       seguir diciendo que falta algo que ya se hizo. */
    hallazgo: HALLAZGO_ENDPOINT,
    pendienteDeJosue: HALLAZGO_ENDPOINT.resuelto ? null : HALLAZGO_ENDPOINT,
    condicion: CONDICION,
  };
}

export { LO_QUE_GUARDA, CAMPOS_PRIVADOS, SISTEMAS_CENTRALIZADOS, LIBRERIAS_EH, datosQueNoViajan,
  permisoIA, contextoParaIA, llevaAlgoPrivado, borrarAprendizaje, PANEL_MEMORIA,
  registrar, registroLimpio, CAMPOS_PROHIBIDOS, CATALOGO_PAPELERA, RETENCION_PAPELERA_DIAS,
  GRAVEDADES, gravedad, IDS_EH };
