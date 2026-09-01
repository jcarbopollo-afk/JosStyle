// ============================================================================
// EH · Fase 52/65 — PREPARACIÓN PARA PRODUCCIÓN
//
// *"De 'funciona en desarrollo' a 'está preparado para entrar en la JC Fitness
// real'. Esta fase no añade funciones nuevas."*
//
// ── QUÉ SE CONSTRUYE AQUÍ ──────────────────────────────────────────────────
//
// Una fase de publicar no se construye: **se comprueba**. Y lo que hay que
// comprobar es incómodo, porque la mitad de lo que el enunciado da por hecho
// —tres entornos, monitorización, despliegue gradual— **no existe en este
// proyecto**, y la otra mitad son cosas que solo puede hacer Josué con su móvil
// y su cuenta. Así que esto es:
//
//   · **lo que hay de verdad**, con su nombre: qué entornos existen, qué
//     variables, qué tablas, qué políticas,
//   · **lo que no existe**, dicho una a una y con el riesgo que eso deja,
//   · **la lista de publicación** del apartado 15, con **cómo se comprueba cada
//     línea** y el comando que la comprueba,
//   · y **el plan de vuelta atrás** del apartado 14, con pasos que se pueden
//     ejecutar, no con una promesa.
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. 🚨 NO HAY ENTORNO DE PRUEBAS, Y ESO SE DICE EN LA PRIMERA LÍNEA.** El
// apartado 1 pide tres entornos y prohíbe *"probar migraciones destructivas
// directamente sobre producción"*. Aquí hay **un** proyecto de Supabase: el de
// Josué. Los despliegues de vista previa de Vercel apuntan **a la misma base de
// datos**, así que no son un entorno de pruebas: son producción con otra URL.
// Inventarse un `ENTORNOS` de tres líneas donde uno de los tres no existe sería
// escribir en el documento de publicar la mentira más cara de todas.
//
// **2. 🚨 Y LO QUE ENCONTRÓ AL MIRAR LA RECUPERACIÓN (apartado 12): guardar
// podía fallar y no se enteraba nadie.** `saveData` se tragaba el error con un
// `console.error` y no devolvía nada. Sin conexión, con el servidor caído o con
// una política mal puesta, la aplicación **seguía como si se hubiera guardado**.
// Ahora devuelve `{ ok, error }`. ⚠️ Pero **el aviso de la interfaz sigue sin
// encenderse**, y por eso `error_guardado` sigue con `detectable: false`: esta
// fase deja la mitad que faltaba para poder hacerlo, no lo da por hecho.
//
// **3. ⚠️ LA LISTA DE PUBLICACIÓN NO SE MARCA SOLA.** Cada línea del apartado 15
// dice **cómo se comprueba**: siete con un comando que se ejecuta, cuatro con el
// móvil de Josué. Las cuatro **no se marcan aquí**, ni siquiera "porque
// seguramente funcionen". Una lista de publicación con casillas marcadas por
// buena voluntad es peor que no tenerla.
//
// **4. ⚠️ ESTILO DE HOMBRE NO NECESITA NI UNA LÍNEA DE SQL.** Sesenta y cinco
// fases y **cero cambios de esquema**: todo vive en la clave `estiloHombre` de
// la tabla que ya existía. Eso convierte el apartado 3 en una comprobación de lo
// que ya hay, y el apartado 5 —*"migraciones una por una y en orden"*— en las de
// datos de la **F46**, que sí existen.
//
// **5. ⚠️ Y LO QUE YA CONTESTARON OTRAS FASES SE IMPORTA.** Los secretos (2) los
// busca `privacidadEstilo` desde la F43; la copia y la vuelta atrás de los datos
// (4 y 5) las hizo la F46; el rendimiento (10) lo mide la F44; y las cuatro
// gravedades del apartado 17 son las de la F47. Aquí se **usan**, no se
// reescriben.
// ============================================================================

import { CLAVES_POR_MODULO, COMO_SE_GUARDA } from './estructuraDatos';
import { MIGRACIONES, VERSION_ACTUAL, migrarEstiloHombre, restaurarCopia, tipoDeUsuario } from './migracion';
import { GRAVEDADES, gravedad, ordenarPorGravedad } from './pruebasIntegrales';
import { PRESUPUESTOS } from './rendimiento';
import { buscarSecretos, PATRONES_SECRETO } from './privacidadEstilo';
import { ESTADOS_EH, estadoEH } from './estadosEstilo';

/* ===========================================================================
   1 · LOS ENTORNOS QUE HAY (apartado 1)
   ===========================================================================
   *"Debe existir una separación clara entre 🧪 Desarrollo · 🧪 Pruebas · 🟢
   Producción. Nunca probar migraciones destructivas directamente sobre
   producción."*

   🚨 ⚠️ **Decisión 1.** Aquí hay dos entornos y medio, no tres. Se dicen. */

export const ENTORNOS = [
  {
    id: 'desarrollo',
    icono: '🧪',
    nombre: 'Desarrollo',
    existe: true,
    donde: 'El ordenador, con `npm run dev`',
    variables: '.env / .env.local',
    baseDeDatos: 'La MISMA de Supabase, con la cuenta de Josué',
    /* ⚠️ Y esto es lo importante: desarrollo **no tiene su propia base**. */
    aviso: 'Escribe en los datos de verdad. Para probar sin tocarlos está el simulador de `test-app-real.mjs`, que intercepta las llamadas a Supabase.',
  },
  {
    id: 'pruebas',
    icono: '🧪',
    nombre: 'Pruebas',
    existe: false,
    donde: null,
    variables: null,
    baseDeDatos: null,
    porque: 'No hay un segundo proyecto de Supabase. Los despliegues de vista previa de Vercel apuntan a la misma base, así que no son un entorno de pruebas: son producción con otra URL.',
    riesgo: 'Una migración destructiva no se puede ensayar. Por eso la F46 hace COPIA antes de tocar nada y sabe volver atrás: es lo que sustituye al entorno que falta.',
  },
  {
    id: 'produccion',
    icono: '🟢',
    nombre: 'Producción',
    existe: true,
    donde: 'Vercel',
    variables: 'Environment Variables del proyecto en Vercel',
    baseDeDatos: 'Supabase, proyecto de Josué',
    aviso: 'El `schema.sql` lo ejecuta él a mano desde el panel de Supabase. No hay migraciones de base de datos automáticas, y Estilo de hombre no necesita ninguna.',
  },
];

export const entorno = (id) => ENTORNOS.find((e) => e.id === id) || null;
export const entornosQueFaltan = () => ENTORNOS.filter((e) => !e.existe);

/* ===========================================================================
   2 · LAS VARIABLES Y LOS SECRETOS (apartado 2)
   ===========================================================================
   *"Las claves privadas no están en el frontend. No existen secretos dentro del
   código."*

   ⚠️ La regla que lo gobierna todo: **una variable con prefijo `VITE_` acaba
   dentro del JavaScript que se descarga el navegador.** Cualquiera puede leerla.
   Así que el prefijo no es un detalle de nombre: es la frontera. */

export const VARIABLES = [
  {
    id: 'VITE_SUPABASE_URL', secreta: false, prefijoVite: true, donde: 'navegador',
    que: 'La dirección del proyecto de Supabase.',
    porque: 'No es un secreto: va en cada petición y se ve en la pestaña de red.',
  },
  {
    id: 'VITE_SUPABASE_ANON_KEY', secreta: false, prefijoVite: true, donde: 'navegador',
    que: 'La clave pública ("anon") de Supabase.',
    /* ⚠️ Y ésta es la que asusta y no debe: es pública **por diseño**, y lo que
       la hace segura es RLS, no el secreto. Si RLS estuviera mal, esconderla no
       arreglaría nada. */
    porque: 'Es pública por diseño. Lo que protege los datos son las políticas de RLS, no que esta clave esté escondida.',
  },
  {
    id: 'ANTHROPIC_API_KEY', secreta: true, prefijoVite: false, donde: 'servidor',
    que: 'La clave de la IA.',
    porque: '🚨 Ésta sí es un secreto, y cuesta dinero. Vive SOLO en `api/ask-ai.js`, que se ejecuta en el servidor de Vercel. Con prefijo `VITE_` se publicaría en el navegador de cualquiera.',
  },
  {
    id: 'ANTHROPIC_MODEL', secreta: false, prefijoVite: false, donde: 'servidor',
    que: 'Qué modelo usa la IA.',
    porque: 'Existe para cambiar de modelo desde el panel de Vercel sin tocar código.',
  },
];

export const variable = (id) => VARIABLES.find((v) => v.id === id) || null;

/** 🚨 La comprobación que importa: **ninguna variable secreta con prefijo `VITE_`.** */
export const secretasExpuestas = () => VARIABLES.filter((v) => v.secreta && v.prefijoVite).map((v) => v.id);

/**
 * ⚠️ Y la de verdad, contra el código: una variable de servidor **no puede
 * aparecer en `src/`**, porque todo lo de `src/` se descarga el navegador.
 */
export function variablesDeServidorEnElNavegador(fuentes = {}) {
  const deServidor = VARIABLES.filter((v) => v.donde === 'servidor').map((v) => v.id);
  const malos = [];
  Object.entries(fuentes).forEach(([nombre, texto]) => {
    deServidor.forEach((id) => {
      if (String(texto || '').includes(id)) malos.push({ archivo: nombre, variable: id });
    });
  });
  return malos;
}

/* ===========================================================================
   3 · LA BASE DE DATOS (apartado 3)
   ===========================================================================
   *"Comprobar tablas, relaciones, índices, permisos, políticas de acceso y
   versionado del esquema."*

   ⚠️ Decisión 4 — **Estilo de hombre no añade ni una línea de SQL**. Las 65
   fases caben en la clave `estiloHombre` de la tabla que ya existía. Así que
   esto no es una migración pendiente: es un inventario de lo que ya está. */

export const SIN_SQL_NUEVO = true;

export const REVISION_BASE_DE_DATOS = [
  {
    id: 'tablas', que: 'Tablas', estado: 'ok',
    hay: 'Una: `app_data` (user_id, key, value jsonb, updated_at).',
    busca: /create table if not exists app_data/,
  },
  {
    id: 'relaciones', que: 'Relaciones', estado: 'ok',
    hay: '`user_id` referencia a `auth.users(id)` con `on delete cascade`: si se borra la cuenta, se van los datos.',
    busca: /references auth\.users\(id\) on delete cascade/,
  },
  {
    id: 'indices', que: 'Índices', estado: 'ok',
    /* ⚠️ No hay índices aparte, y no hacen falta: **todas** las consultas son
       por (user_id, key), que es exactamente la clave primaria. */
    hay: 'La clave primaria `(user_id, key)`. No hay más, y no hacen falta: todas las consultas son por esas dos columnas.',
    busca: /primary key \(user_id, key\)/,
  },
  {
    id: 'permisos', que: 'Permisos', estado: 'ok',
    hay: 'RLS activado en `app_data`.',
    busca: /alter table app_data enable row level security/,
  },
  {
    id: 'politicas', que: 'Políticas de acceso', estado: 'ok',
    hay: 'Cuatro, una por operación, todas con `auth.uid() = user_id`. Ninguna del tipo permisivo.',
    busca: /auth\.uid\(\) = user_id/,
  },
  {
    id: 'buckets', que: 'Archivos', estado: 'ok',
    hay: 'Cinco buckets privados, con una carpeta por usuario y URLs firmadas. Estilo de hombre no usa ninguno.',
    busca: /storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/,
  },
  {
    id: 'version_esquema', que: 'Versionado del esquema', estado: 'parcial',
    hay: 'El de los DATOS existe desde la F46 (`schema_version`, v2). El de la BASE DE DATOS no: `schema.sql` es un archivo que se ejecuta a mano.',
    busca: null,
    /* ⚠️ Y un detalle que muerde de verdad al ejecutarlo dos veces. */
    aviso: '⚠️ Los `create policy` del archivo NO llevan `if not exists`: volver a ejecutar el archivo entero da error de política duplicada. Cada bloque dice "ejecuta SOLO éste", y hay que hacerle caso.',
  },
];

export const revisionBD = (id) => REVISION_BASE_DE_DATOS.find((r) => r.id === id) || null;

/** Comprueba de verdad el `schema.sql`, no la lista de arriba. */
export function revisarEsquema(sql) {
  const texto = String(sql || '');
  return REVISION_BASE_DE_DATOS
    .filter((r) => r.busca)
    .map((r) => ({ id: r.id, encontrado: r.busca.test(texto) }));
}

/* ===========================================================================
   4 · LO QUE HAY QUE HACER ANTES DE TOCAR NADA (apartados 4, 5 y 6)
   ===========================================================================
   *"📦 Copia de seguridad… Ejecutarlas una por una y en orden… Nada de lo
   existente debe desaparecer por incorporar Estilo."*

   ⚠️ Decisión 5 — la copia, la migración y la vuelta atrás **ya existen**: las
   hizo la F46. Aquí solo se comprueba que están enganchadas y que Estilo de
   hombre **no toca las claves de nadie más**. */

export const CLAVE_DE_ESTILO = 'estiloHombre';

/** Apartado 6 — lo que ya tenía Josué y **no puede desaparecer**. */
export const DATOS_QUE_NO_SE_TOCAN = [
  { id: 'preferencias', nombre: 'Preferencias', clave: 'ajustes' },
  { id: 'armario', nombre: 'Armario', clave: 'armario' },
  { id: 'productos', nombre: 'Productos', clave: 'nutricion' },
  { id: 'favoritos', nombre: 'Favoritos', clave: 'varias, cada módulo el suyo' },
  { id: 'objetivos', nombre: 'Objetivos', clave: 'objetivos' },
  { id: 'rutinas', nombre: 'Rutinas', clave: 'entrenamiento' },
  { id: 'configuracion', nombre: 'Configuración', clave: 'ajustes' },
];

/**
 * 🚨 ⚠️ **La comprobación que de verdad protege el apartado 6.** Estilo de
 * hombre escribe en **una sola clave**. Si una fase futura guardara en la de
 * otro módulo, `saveData` **sobrescribiría** lo que hubiera (regla 5) y el
 * usuario perdería el armario entero sin un solo error por pantalla.
 */
export function escrituraFueraDeSuClave(fuentes = {}) {
  const fuera = [];
  Object.entries(fuentes).forEach(([nombre, texto]) => {
    const claves = [...String(texto || '').matchAll(/saveData\(\s*[A-Za-z0-9_.]+\s*,\s*'([a-zA-Z]+)'/g)]
      .map((m) => m[1]);
    claves.forEach((c) => { if (c !== CLAVE_DE_ESTILO) fuera.push({ archivo: nombre, clave: c }); });
  });
  return fuera;
}

/* ===========================================================================
   5 · LO QUE SOLO PUEDE HACER JOSUÉ (apartados 7, 8, 9 y 10)
   ===========================================================================
   *"Crear una cuenta completamente nueva… Utilizar una cuenta real de pruebas
   con muchos datos… 📱 Safari iPhone · Chrome Android… No confiar únicamente en
   el ordenador de desarrollo."* */

export const PRUEBAS_DE_PRODUCCION = [
  {
    apartado: 7, id: 'cuenta_nueva', nombre: 'Cuenta nueva',
    que: 'Registro → login → Estilo → configuración inicial.',
    como: 'josue',
    porque: 'Crear una cuenta de verdad escribe en Supabase de verdad. El simulador de `test-app-real.mjs` recorre ese camino con una sesión falsa, que es lo más cerca que se puede estar sin serlo.',
    cerca: 'test-app-real.mjs',
  },
  {
    apartado: 8, id: 'cuenta_existente', nombre: 'Cuenta existente con muchos datos',
    que: 'Actualización → migración → sincronización.',
    como: 'josue',
    porque: 'La suya ES la cuenta con muchos datos. La migración de la F46 se prueba aquí con datos inventados; con los suyos, solo puede probarla él.',
    cerca: 'test-migracion.mjs',
  },
  {
    apartado: 9, id: 'movil', nombre: 'Safari iPhone y Chrome Android',
    que: 'Instalación PWA, reapertura, cierre, cambio de conexión, notificaciones.',
    como: 'josue',
    porque: 'Un navegador de escritorio sin conexión no es un iPhone en el metro. Y la PWA solo se instala de verdad desde el móvil.',
    cerca: null,
  },
  {
    apartado: 10, id: 'rendimiento_real', nombre: 'Rendimiento con una conexión normal',
    que: 'Inicio, Estilo, búsqueda, apertura de módulos, sincronización.',
    como: 'josue',
    porque: '*"No confiar únicamente en el ordenador de desarrollo"*, con sus palabras. Los presupuestos de la F44 dicen cuánto es demasiado; medirlo en su red es suyo.',
    cerca: 'rendimiento.js',
  },
];

export const pruebaDeProduccion = (id) => PRUEBAS_DE_PRODUCCION.find((p) => p.id === id) || null;

/* ===========================================================================
   6 · MONITORIZACIÓN (apartado 11)
   ===========================================================================
   *"Si JC Fitness dispone de sistema de monitorización: añadir Estilo de
   hombre… Pero no registrar datos privados innecesarios."*

   ⚠️ El *"si dispone"* del enunciado tiene respuesta, y es **no**. */

export const MONITORIZACION = {
  existe: false,
  hay: 'Los errores de JavaScript en la consola del navegador y los registros de la función `api/ask-ai.js` en Vercel. Nada más.',
  porque: 'JC Fitness no tiene un sistema de monitorización. Añadir uno es meter un servicio externo —y mandarle datos— en la última fase antes de publicar: eso se decide, no se cuela.',
  /* ⚠️ Y si algún día se añade, la regla ya está escrita desde la F43. */
  regla: 'El día que se añada: ni nombres, ni notas, ni fotos, ni el contenido de un registro. Solo qué falló y dónde.',
  seDecide: 'Josué',
};

/* ===========================================================================
   7 · CUANDO ALGO SE CAE (apartado 12)
   ===========================================================================
   *"Simular error de servidor, base de datos inaccesible, pérdida de conexión y
   fallo de sincronización. Comprobar que el usuario puede continuar o
   recuperarse."*

   🚨 ⚠️ **Decisión 2 — aquí es donde salió el fallo de esta fase.** */

export const CAIDAS = [
  {
    id: 'sin_conexion', que: 'Pérdida de conexión',
    hoy: 'Se detecta con `navigator.onLine` y hay un estado con su aviso (F41).',
    puedeSeguir: true,
    avisa: true,
    estado: 'modo_sin_conexion',
  },
  {
    id: 'error_servidor', que: 'Error de servidor',
    hoy: 'La carga devuelve el valor por defecto y la aplicación arranca igual, con lo que hubiera en pantalla.',
    puedeSeguir: true,
    avisa: false,
    estado: 'sin_conexion',
  },
  {
    id: 'bd_inaccesible', que: 'Base de datos temporalmente inaccesible',
    hoy: 'Igual que el anterior: `loadData` devuelve el valor por defecto y lo apunta en la consola.',
    puedeSeguir: true,
    avisa: false,
    estado: 'sin_conexion',
  },
  {
    id: 'fallo_guardado', que: 'Fallo de sincronización al guardar',
    /* 🚨 El hallazgo. Se deja escrito tal cual, con lo que se arregló y lo que
       no, para que nadie lo lea como resuelto. */
    hoy: '🚨 `saveData` se tragaba el error y no devolvía nada: la aplicación seguía como si se hubiera guardado. Desde esta fase DEVUELVE `{ ok, error }`… pero todavía nadie mira ese resultado.',
    puedeSeguir: true,
    avisa: false,
    estado: 'error_guardado',
    arregladoAMedias: true,
  },
];

export const caida = (id) => CAIDAS.find((c) => c.id === id) || null;

/** ⚠️ Las que el usuario **no ve venir**. No es cero, y no se disimula. */
export const caidasSinAviso = () => CAIDAS.filter((c) => !c.avisa).map((c) => c.id);

/* ===========================================================================
   8 · PUBLICAR, Y SABER VOLVER (apartados 13 y 14)
   ===========================================================================
   *"Publicar primero para pruebas… Antes de publicar debe existir 🔙 plan de
   rollback."*

   ⚠️ Un plan de vuelta atrás que no se pueda ejecutar no es un plan. Éstos son
   pasos, con su herramienta y su orden. */

export const DESPLIEGUE_GRADUAL = {
  hay: 'Los despliegues de vista previa de Vercel: cada rama tiene su URL antes de tocar la de producción.',
  limite: '⚠️ Pero apuntan a la MISMA base de datos. Sirven para ver la interfaz nueva, no para ensayar un cambio de datos.',
  como: 'Subir la rama → abrir la URL de vista previa → mirar → promover a producción.',
};

export const PLAN_DE_VUELTA_ATRAS = [
  {
    paso: 1, que: 'El código',
    como: 'En Vercel, "Instant Rollback" al despliegue anterior. Sin tocar el repositorio.',
    cuanto: 'Segundos.',
    herramienta: 'vercel',
  },
  {
    paso: 2, que: 'El repositorio',
    como: '`git revert <commit>` y subir. Nunca `push --force` sobre `main`.',
    cuanto: 'Minutos.',
    herramienta: 'git',
  },
  {
    paso: 3, que: 'Los datos',
    como: '`restaurarCopia(copia)` con la copia que la F46 hace ANTES de migrar.',
    cuanto: 'Inmediato, y no hace falta tocar Supabase a mano.',
    herramienta: 'migracion.js',
  },
  {
    paso: 4, que: 'La base de datos',
    /* ⚠️ Y aquí la verdad incómoda: no hay vuelta atrás automática del esquema. */
    como: 'No hace falta: Estilo de hombre no cambia el esquema. Si alguna vez lo cambiara, habría que escribir el SQL inverso A MANO y probarlo antes.',
    cuanto: '—',
    herramienta: null,
  },
];

/* ===========================================================================
   9 · LA LISTA DE ANTES DE PUBLICAR (apartado 15)
   ===========================================================================
   *"Antes de pulsar publicar: código compilando, tests correctos, migraciones
   revisadas, backup realizado, variables correctas, seguridad comprobada, login
   funcionando, sincronización funcionando, PWA funcionando, modo oscuro
   funcionando, datos antiguos intactos."*

   ⚠️ Decisión 3 — **cada línea dice cómo se comprueba**. Las que necesitan el
   móvil de Josué no se marcan aquí. */

export const CHECKLIST_PUBLICACION = [
  { id: 'compila', que: 'Código compilando', como: 'auto', comando: 'npm run build' },
  { id: 'tests', que: 'Tests correctos', como: 'auto', comando: 'bash scripts/verificar.sh' },
  { id: 'migraciones', que: 'Migraciones revisadas', como: 'auto', comando: 'node scripts/test-migracion.mjs' },
  { id: 'backup', que: 'Backup realizado', como: 'auto', comando: 'La hace `migrarEstiloHombre` sola, antes de tocar nada (F46)' },
  { id: 'variables', que: 'Variables correctas', como: 'auto', comando: 'node scripts/test-produccion.mjs' },
  { id: 'seguridad', que: 'Seguridad comprobada', como: 'auto', comando: 'node scripts/test-privacidad-estilo.mjs' },
  { id: 'login', que: 'Login funcionando', como: 'auto', comando: 'node scripts/test-app-real.mjs' },
  { id: 'sincronizacion', que: 'Sincronización funcionando', como: 'josue', comando: null, porque: 'Contra el Supabase de verdad, desde su cuenta.' },
  { id: 'pwa', que: 'PWA funcionando', como: 'josue', comando: null, porque: 'Instalar en la pantalla de inicio solo se prueba desde el móvil.' },
  { id: 'oscuro', que: 'Modo oscuro funcionando', como: 'josue', comando: null, porque: 'Sin colores literales ya lo comprueba la F49; VERLO sigue siendo suyo.' },
  { id: 'datos_antiguos', que: 'Datos antiguos intactos', como: 'josue', comando: null, porque: 'Solo se ve con sus datos, en su cuenta, después de actualizar.' },
];

export const lineaChecklist = (id) => CHECKLIST_PUBLICACION.find((c) => c.id === id) || null;
export const checklistAutomatico = () => CHECKLIST_PUBLICACION.filter((c) => c.como === 'auto');
export const checklistDeJosue = () => CHECKLIST_PUBLICACION.filter((c) => c.como === 'josue');

/* ===========================================================================
   10 · DESPUÉS DE PUBLICAR (apartados 16, 17 y 18)
   =========================================================================== */

export const DESPUES_DE_PUBLICAR = [
  { id: 'errores', que: 'Revisar errores', donde: 'Consola del navegador y registros de Vercel' },
  { id: 'rendimiento', que: 'Revisar rendimiento', donde: 'Los presupuestos de la F44, en su móvil' },
  { id: 'sincronizacion', que: 'Revisar sincronización', donde: 'Que lo que toca aparezca al volver' },
  { id: 'usuarios', que: 'Revisar problemas de usuarios', donde: 'Él es el usuario: lo que le moleste, se apunta' },
];

/** Apartado 17 — las cuatro gravedades son **las de la F47**, con su reacción. */
export const REACCION_ANTE_ERROR = {
  critico: 'Vuelta atrás o corrección inmediata.',
  importante: 'Corregir rápido.',
  menor: 'Programar la corrección.',
  mejora: 'Al backlog.',
};

/** Apartado 18 — *"no modificar producción impulsivamente"*. */
export const BACKLOG = {
  regla: 'Una idea nueva después de publicar se apunta. No se toca producción por un impulso.',
  donde: 'docs/07_CHECKLIST_ENTREGA2.md y las listas SE_POSPONE de la F48.',
};

export const TEXTOS_PRODUCCION = {
  condicion: 'Preparado para producción es: copia → migración → pruebas → despliegue → monitorización → recuperación. Y sobre todo: si algo sale mal, hay una forma segura de volver atrás.',
  sinEntornoDePruebas: 'No hay entorno de pruebas. Lo que lo sustituye es la copia de seguridad de la F46, y por eso no es negociable.',
  noAnadir: 'Esta fase no añade funciones nuevas.',
};

/* ===========================================================================
   11 · EL PARTE
   =========================================================================== */

export function auditarProduccion({ sql = '', fuentesEH = {} } = {}) {
  return {
    entornosQueFaltan: entornosQueFaltan().map((e) => e.id),
    // 🚨 Y los que faltan tienen que decir el riesgo que dejan, no solo faltar.
    sinRiesgo: entornosQueFaltan().filter((e) => !e.riesgo).map((e) => e.id),
    secretasExpuestas: secretasExpuestas(),
    variablesDeServidorEnElNavegador: variablesDeServidorEnElNavegador(fuentesEH),
    esquema: sql ? revisarEsquema(sql).filter((r) => !r.encontrado).map((r) => r.id) : [],
    escrituraFueraDeSuClave: escrituraFueraDeSuClave(fuentesEH),
    migraciones: MIGRACIONES.length,
    version: VERSION_ACTUAL,
    caidasSinAviso: caidasSinAviso(),
    paraJosue: [
      ...PRUEBAS_DE_PRODUCCION.map((p) => p.apartado),
      ...checklistDeJosue().map((c) => c.id),
    ],
    // Y ninguna de las de Josué se queda sin decir por qué.
    sinMotivo: [
      ...PRUEBAS_DE_PRODUCCION.filter((p) => !p.porque).map((p) => p.id),
      ...checklistDeJosue().filter((c) => !c.porque).map((c) => c.id),
    ],
    pasosDeVueltaAtras: PLAN_DE_VUELTA_ATRAS.length,
  };
}

export function panelProduccion(opciones = {}) {
  const a = auditarProduccion(opciones);
  return {
    ...a,
    entornos: ENTORNOS,
    variables: VARIABLES,
    checklist: CHECKLIST_PUBLICACION,
    plan: PLAN_DE_VUELTA_ATRAS,
    caidas: CAIDAS,
    monitorizacion: MONITORIZACION,
    gravedades: GRAVEDADES,
    /* 🎯 El veredicto: **se puede publicar y se sabe volver**. No incluye lo que
       necesita el móvil de Josué, ni presume de un entorno de pruebas que no
       existe: incluye que lo que falta esté DICHO. */
    listoParaPublicar: a.secretasExpuestas.length === 0
      && a.variablesDeServidorEnElNavegador.length === 0
      && a.esquema.length === 0
      && a.escrituraFueraDeSuClave.length === 0
      && a.sinRiesgo.length === 0
      && a.sinMotivo.length === 0
      && a.pasosDeVueltaAtras > 0,
    condicion: TEXTOS_PRODUCCION.condicion,
  };
}

export { GRAVEDADES, gravedad, ordenarPorGravedad, PRESUPUESTOS, CLAVES_POR_MODULO, COMO_SE_GUARDA,
  MIGRACIONES, migrarEstiloHombre, restaurarCopia, tipoDeUsuario, buscarSecretos, PATRONES_SECRETO,
  ESTADOS_EH, estadoEH };
