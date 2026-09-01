// ============================================================================
// EH · Fase 53/65 — DOCUMENTACIÓN TÉCNICA Y MANTENIMIENTO
//
// *"Si dentro de meses queremos modificar Estilo de hombre, Claude debe poder
// entender rápidamente cómo funciona sin rehacer todo el análisis."*
//
// ── QUÉ SE CONSTRUYE AQUÍ ──────────────────────────────────────────────────
//
// Un documento —`docs/08_ESTILO_DE_HOMBRE_TECNICO.md`— y, sobre todo, **lo que
// hace que ese documento no se quede viejo**: este archivo, del que el documento
// sale, y una prueba que compara los dos. Porque el apartado 2 pide *"y
// mantenerlo actualizado"*, y esa frase, sin nada que la obligue, es la que no
// se cumple nunca.
//
// ── LAS CUATRO DECISIONES QUE GOBIERNAN ESTA FASE ──────────────────────────
//
// **1. 🚨 LA DOCUMENTACIÓN SE DERIVA DEL CÓDIGO, NO SE ESCRIBE AL LADO.** El
// mapa de módulos sale de `MODULOS_EH`. Las fuentes de datos, de
// `FUENTES_GLOBALES`. Los estados, de `ESTADOS_GESTION` más la papelera. Las
// migraciones, de la F46. El backlog, del `SE_POSPONE` de la F48. **Nada de esto
// se teclea dos veces**, así que el día que alguien añada un módulo, el
// documento lo tiene sin tocarlo — y si el documento se queda corto, la prueba
// se pone roja.
//
// **2. ⚠️ Y HAY UNA PRUEBA QUE LEE EL DOCUMENTO.** `auditarDocumentacion()` abre
// el `.md` de verdad y comprueba que están **los diecisiete módulos**, **las
// doce dependencias globales**, **los cuatro estados** y **las once reglas**. Un
// documento técnico que nadie comprueba es una foto de cómo era el proyecto el
// día que se escribió.
//
// **3. ⚠️ LO QUE NO SE USA TAMBIÉN SE DOCUMENTA, Y CON SU MOTIVO.** El apartado 3
// pide listar doce sistemas globales, y Estilo de hombre **no usa todos**. Decir
// solo los que sí sería dejar al siguiente preguntándose si el Diario se le
// olvidó a alguien o es una decisión. Está escrito: es una decisión, y de la
// F47.
//
// **4. ⚠️ Y EL MANUAL DE MANTENIMIENTO CONTESTA PREGUNTAS, NO DESCRIBE COSAS.**
// El apartado 18 no pide un resumen: pide *"qué hacer si falla una migración,
// si aparece un duplicado, si se rompe una integración"*. Así que son cuatro
// preguntas con cuatro respuestas que se pueden ejecutar.
// ============================================================================

import { MODULOS_EH, CATEGORIAS_EH, categoriaEH, IDS_EH, FUENTES_GLOBALES, VERSION_EH } from './estiloDeHombre';
import { ESTADOS_GESTION, DONDE_VIVEN, CLAVES_PAPELERA_EH } from './gestionEstilo';
import { CATALOGO_PAPELERA, RETENCION_PAPELERA_DIAS } from './papelera';
import { MIGRACIONES, VERSION_ACTUAL } from './migracion';
import { SE_POSPONE, RESPUESTA_FINAL } from './auditoriaFinal';
import { PRUEBAS_INTEGRALES, GRAVEDADES } from './pruebasIntegrales';
import { CHECKLIST_PUBLICACION, PLAN_DE_VUELTA_ATRAS } from './produccion';
import { APARTADOS_EXPERIENCIA } from './experienciaReal';
import { CLAVES_POR_MODULO } from './estructuraDatos';

/* ===========================================================================
   1 · QUÉ HACE Y QUÉ NO HACE (apartado 1)
   ===========================================================================
   ⚠️ Decisión 1 — esto ya lo contestó la **F48** con esas palabras. Se importa. */

export const QUE_HACE = RESPUESTA_FINAL.hace;
export const QUE_NO_HACE = RESPUESTA_FINAL.noHace;
export const LA_REGLA = RESPUESTA_FINAL.regla;

export const COMO_ESTA_ORGANIZADO = [
  { capa: 'Datos', que: 'Una clave de Supabase, `estiloHombre`, con un objeto por módulo.', donde: 'src/lib/estiloDeHombre.js' },
  { capa: 'Catálogo', que: 'Los módulos son LÍNEAS de `MODULOS_EH`. Añadir uno es añadir una línea.', donde: 'src/lib/estiloDeHombre.js' },
  { capa: 'Motores', que: 'Rutinas, recomendaciones, productos y cuestionarios: compartidos, nunca duplicados.', donde: 'src/lib/motor*.js' },
  { capa: 'Pantalla', que: 'Una vista con un componente por apartado.', donde: 'src/views/EstiloHombreView.jsx' },
  { capa: 'Revisores', que: 'Las fases 43-53 no añaden funciones: comprueban las que hay.', donde: 'src/lib/{privacidad,rendimiento,coherenciaVisual,...}' },
];

/* ===========================================================================
   2 · EL MAPA DE MÓDULOS (apartado 2)
   ===========================================================================
   🚨 Decisión 1 — **derivado**. Si mañana `MODULOS_EH` crece, este mapa crece
   solo, y la prueba obliga a que el documento lo recoja. */

export function mapaDeModulos() {
  return CATEGORIAS_EH
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      icono: c.icono,
      modulos: MODULOS_EH.filter((m) => m.categoria === c.id).map((m) => ({
        id: m.id, nombre: m.nombre, icono: m.icono, fase: m.fase,
      })),
    }))
    .filter((c) => c.modulos.length > 0);
}

/** Las pantallas que no son un módulo, pero están. */
export const PANTALLAS_TRANSVERSALES = [
  { id: 'descubrir', nombre: 'Descubrir', fase: 32, que: 'Tarjetas de ideas que se pueden rechazar.' },
  { id: 'preferencias', nombre: 'Preferencias', fase: 38, que: 'Lo que ha contestado, editable y borrable.' },
  { id: 'buscador', nombre: 'Buscador', fase: 39, que: 'Busca en todos los apartados a la vez.' },
  { id: 'gestionar', nombre: 'Gestionar apartados', fase: 36, que: 'Encender, apagar, ocultar y reordenar.' },
  { id: 'progreso', nombre: 'Progreso', fase: 35, que: 'Métricas sin puntuaciones ni porcentajes.' },
  { id: 'mis_datos', nombre: 'Mis datos', fase: 43, que: 'Qué se guarda, cómo se exporta y cómo se borra.' },
];

/* ===========================================================================
   3 · LAS DEPENDENCIAS GLOBALES (apartado 3)
   ===========================================================================
   *"Calendario, Objetivos, Tareas, Notificaciones, Favoritos, Productos,
   Diario, Armario, Eliminados, Búsqueda, Autenticación, Sincronización."*

   ⚠️ Decisión 3 — **las doce, incluidas las que NO se usan**, con su motivo. */

export const DEPENDENCIAS_GLOBALES = [
  { id: 'calendario', nombre: 'Calendario', usa: true, como: 'Los eventos de las rutinas se derivan; nunca se materializan (regla 11).', donde: 'calendarioIntegracion.js' },
  { id: 'objetivos', nombre: 'Objetivos', usa: true, como: 'Se guarda el id del objetivo, no una copia.', donde: 'objetivosEnEstiloHombre.js' },
  { id: 'tareas', nombre: 'Tareas', usa: true, como: 'Una acción como "Comprar producto X" crea una tarea en Productividad; aquí queda solo su id.', donde: 'integracionEstilo.js' },
  { id: 'notificaciones', nombre: 'Notificaciones', usa: true, como: 'Las genera el sistema global. Estilo de hombre solo dice qué y cuándo.', donde: 'avisosEstilo.js' },
  {
    id: 'favoritos', nombre: 'Favoritos', usa: false,
    porque: '🚨 No hay un sistema global de favoritos: cada módulo tiene los suyos. Unificarlos es una fase (F39), no un arreglo, y está en el backlog de la F48.',
    donde: null,
  },
  { id: 'productos', nombre: 'Productos', usa: true, como: 'El inventario de productos es el de la aplicación, con `motorProductos`.', donde: 'motorProductos.js' },
  {
    id: 'diario', nombre: 'Diario', usa: false,
    porque: 'El puente entre una experiencia y el Diario no lo ha pedido ninguna fase. La F47 lo declaró como lo que es: pendiente, no roto.',
    donde: null,
  },
  { id: 'armario', nombre: 'Armario', usa: true, como: 'Se consultan las prendas; no se copia ninguna.', donde: 'armarioEnEstiloHombre.js' },
  { id: 'eliminados', nombre: 'Eliminados', usa: true, como: 'La papelera global de ME F3. Estilo de hombre NO tiene la suya.', donde: 'papelera.js' },
  { id: 'busqueda', nombre: 'Búsqueda', usa: true, como: 'El índice global, más el buscador propio de la F39 dentro del módulo.', donde: 'indiceBusqueda.js · buscadorEstilo.js' },
  { id: 'autenticacion', nombre: 'Autenticación', usa: true, como: 'La sesión de Supabase. Estilo de hombre no toca el login.', donde: 'supabase.js' },
  { id: 'sincronizacion', nombre: 'Sincronización', usa: true, como: '`loadData` y `saveData`. ⚠️ `saveData` SOBRESCRIBE (regla 5).', donde: 'supabase.js' },
];

export const dependenciaGlobal = (id) => DEPENDENCIAS_GLOBALES.find((d) => d.id === id) || null;
export const dependenciasQueNoSeUsan = () => DEPENDENCIAS_GLOBALES.filter((d) => !d.usa);

/* ===========================================================================
   4 · DÓNDE VIVE CADA DATO (apartado 4)
   ===========================================================================
   *"Perfume → módulo Perfumes. Favorito → sistema global de Favoritos. Fecha →
   Calendario global. Esto evita duplicaciones futuras."*

   🚨 Derivado de `FUENTES_GLOBALES` (lo de fuera) y de `DONDE_VIVEN` (lo de
   dentro). Nadie escribe esta tabla a mano. */

export function fuenteDeCadaDato() {
  const deFuera = Object.entries(FUENTES_GLOBALES).map(([campo, f]) => ({
    dato: campo, vive: 'global', modulo: f.modulo, clave: f.clave, que: f.que,
  }));
  const deDentro = Object.keys(DONDE_VIVEN).map((k) => {
    const [modulo, coleccion] = k.split('.');
    return { dato: coleccion, vive: 'estiloHombre', modulo, clave: `estiloHombre.${k}`, que: null };
  });
  return [...deFuera, ...deDentro];
}

/** ⚠️ La pregunta que evita el duplicado: *"esto, ¿ya existe fuera?"* */
export const REGLA_DE_FUENTE = 'Antes de guardar un dato nuevo, mirar `FUENTES_GLOBALES`. Si ya existe fuera, se consulta; no se copia.';

/* ===========================================================================
   5 · LOS ESTADOS (apartado 5)
   ===========================================================================
   *"🟢 Activo · ⚪ Oculto · ⏸️ Desactivado · 🗑️ Eliminado."*

   ⚠️ Los tres primeros salen de `ESTADOS_GESTION`. El cuarto **no está ahí a
   propósito**: eliminar no es un estado de un módulo, es un estado de un
   elemento, y vive en la papelera. Se añade aquí diciendo eso. */

export const ESTADOS_DOC = [
  ...ESTADOS_GESTION.map((e) => ({
    ...e,
    de: 'modulo',
    que: {
      activo: 'Se usa y se ve en la pantalla principal.',
      oculto: 'No se ve, pero SIGUE FUNCIONANDO: da ideas, tarjetas y métricas.',
      desactivado: 'Apagado. **No borra nada**: su `config` se conserva entera.',
    }[e.id],
  })),
  {
    id: 'eliminado', nombre: 'Eliminado', icono: '🗑️', de: 'elemento',
    que: `Está en la papelera global, con ${RETENCION_PAPELERA_DIAS} días para volver.`,
  },
];

export const estadoDoc = (id) => ESTADOS_DOC.find((e) => e.id === id) || null;

/* ===========================================================================
   6 · CÓMO SE ELIMINA (apartado 6)
   ===========================================================================
   *"Así ningún desarrollador futuro implementará accidentalmente una
   eliminación irreversible."* 🚨 Y ya pasó **tres veces** en este proyecto: la
   F51 encontró tres colecciones que se borraban sin papelera. */

export const CICLO_DE_ELIMINACION = [
  { paso: 1, que: 'Eliminar', como: '`eliminarConPapelera(...)` — nunca un `filter` a mano.' },
  { paso: 2, que: 'Eliminados recientemente', como: `La papelera global, ${RETENCION_PAPELERA_DIAS} días.` },
  { paso: 3, que: 'Recuperar', como: '`restaurar(...)`, que devuelve el elemento a su colección.' },
  { paso: 4, que: 'Eliminar definitivamente', como: 'Solo desde la papelera, y solo a mano.' },
];

export const AVISO_ELIMINACION = '🚨 Una colección nueva que se pueda borrar necesita su entrada en `CATALOGO_PAPELERA`. Sin ella, el borrado es IRREVERSIBLE y no lo avisa nadie: ya pasó con las rutinas de Skincare, las de Pelo y los perfumes por probar.';

export const coleccionesConPapelera = () => CLAVES_PAPELERA_EH.length;
export const coleccionesTotalesEnLaPapelera = () => Object.keys(CATALOGO_PAPELERA).length;

/* ===========================================================================
   7 · LA ESTRUCTURA DE DATOS (apartado 7)
   =========================================================================== */

export const ESTRUCTURA = {
  tabla: 'app_data (user_id uuid, key text, value jsonb, updated_at timestamptz)',
  clavePrimaria: '(user_id, key)',
  claveDeEsteModulo: 'estiloHombre',
  identificadores: 'Cada elemento lleva un `id` propio, sellado por la migración v1→v2 de la F46.',
  version: VERSION_EH,
  versionDelEsquemaDeDatos: VERSION_ACTUAL,
  indices: 'Ninguno aparte de la clave primaria: todas las consultas son por (user_id, key).',
  relaciones: '`user_id` referencia a `auth.users(id)` con `on delete cascade`.',
  /* ⚠️ Apartado 7 — *"sin incluir secretos ni credenciales"*. */
  sinSecretos: 'Aquí no hay ni una clave, ni una URL de proyecto, ni un token. Las variables están en `PUBLICAR.md` por su nombre, sin su valor.',
  modulosConClave: Object.keys(CLAVES_POR_MODULO).length,
};

/* ===========================================================================
   8 · LAS MIGRACIONES (apartado 8)
   ===========================================================================
   *"Versión anterior → versión nueva → cambios realizados."* Derivado de la F46. */

export function registroDeMigraciones() {
  return MIGRACIONES.map((m) => ({
    de: m.de, a: m.a, id: m.id, que: m.nombre, porque: m.porque,
  }));
}

/* ===========================================================================
   9 · LOS COMPONENTES QUE SE REUTILIZAN (apartado 9)
   ===========================================================================
   *"Plaquitas, modales, buscador, selectores, botones, estados vacíos. No crear
   componentes duplicados sin motivo."*

   ⚠️ Cada uno nombra **el componente real**, y la prueba comprueba que existe.
   Una lista de nombres bonitos que no se corresponden con nada es peor que
   ninguna lista: manda a buscar algo que no está. */

export const COMPONENTES_REUTILIZABLES = [
  { id: 'plaquitas', nombre: 'Plaquitas', componente: 'Plaquita', vive: 'EstiloHombreView.jsx' },
  /* ⚠️ **No hay un componente de modal común, y eso también se documenta.** Lo
     que hay es una regla invariante: cualquier capa a pantalla completa se pinta
     con `createPortal`. Inventar aquí el nombre de un componente que no existe
     mandaría al siguiente a buscarlo. */
  { id: 'modales', nombre: 'Modales', componente: 'createPortal', vive: 'react-dom · regla invariante del proyecto' },
  { id: 'buscador', nombre: 'Buscador', componente: 'BuscadorEstiloEH', vive: 'EstiloHombreView.jsx' },
  { id: 'selectores', nombre: 'Selectores', componente: 'SelectInput', vive: 'ui.jsx' },
  { id: 'botones', nombre: 'Botones', componente: 'PrimaryButton', vive: 'ui.jsx' },
  { id: 'vacios', nombre: 'Estados vacíos', componente: 'VacioEH', vive: 'EstiloHombreView.jsx' },
];

export const componenteReutilizable = (id) => COMPONENTES_REUTILIZABLES.find((c) => c.id === id) || null;

/* ===========================================================================
   10 · LAS REGLAS DE DISEÑO (apartado 10)
   ===========================================================================
   *"Siempre utilizar los tokens globales de JC Fitness."* */

export const REGLAS_DE_DISENO = [
  { id: 'colores', que: 'Colores', regla: 'Solo `COLORS`. Ni un hex suelto, y nunca desestructurar el objeto: es un singleton mutable.', fase: 'invariante' },
  { id: 'texto_sobre_acento', que: 'Texto sobre el acento', regla: '`COLORS.textOnAccent`, nunca `#fff`: con un acento claro sería blanco sobre claro.', fase: 'F49' },
  { id: 'espaciados', que: 'Espaciados', regla: 'Los de Tailwind que ya usa el resto de la aplicación. `-m-1.5` es la única excepción, y es de la F42 (área táctil de 44 px).', fase: 'F49' },
  { id: 'tipografia', que: 'Tipografía', regla: 'Los tamaños del resto de JosStyle. Nada por debajo de lo que la F42 fijó como legible.', fase: 'F42' },
  { id: 'iconos', que: 'Iconos', regla: 'Emoji para los módulos, `lucide-react` para la interfaz. Volver es siempre `ArrowLeft size={16}`.', fase: 'F50' },
  { id: 'bordes', que: 'Bordes', regla: 'Los radios del resto de la aplicación. `rounded-t-3xl` y `rounded-3xl` son la misma familia.', fase: 'F49' },
  { id: 'animaciones', que: 'Animaciones', regla: 'Nada por encima de 500 ms, nada decorativo, y `active:scale` vive en `ui.jsx`, no en la vista.', fase: 'F50' },
  { id: 'oscuro', que: 'Modo oscuro', regla: 'Sale solo si no hay colores literales. Verlo sigue siendo cosa de Josué.', fase: 'F49' },
];

/* ===========================================================================
   11 · LAS REGLAS DE UX (apartado 11)
   ===========================================================================
   ⚠️ Las seis, con sus palabras. */

export const REGLAS_UX = [
  { id: 'nada_obligatorio', regla: 'Nada obligatorio.', porque: 'Ningún apartado se enciende solo, y ninguno hace falta para que funcione otro.' },
  { id: 'todo_ocultable', regla: 'Todo lo posible se puede ocultar.', porque: 'La pantalla es suya: qué aparece, en qué orden y de qué tamaño.' },
  { id: 'ocultar_no_elimina', regla: 'Ocultar no elimina.', porque: 'Un módulo oculto sigue dando ideas, tarjetas y métricas. Solo deja de pintarse.' },
  { id: 'desactivar_no_elimina', regla: 'Desactivar no elimina.', porque: '`alternarModulo` no toca `config`. Volver a encenderlo devuelve todo.' },
  { id: 'recomendaciones_subjetivas', regla: 'Recomendaciones subjetivas.', porque: 'Se sugiere, no se diagnostica. Ni una palabra médica.' },
  { id: 'no_duplicar', regla: 'No duplicar sistemas globales.', porque: 'La papelera, el calendario, las tareas y los productos son los de JosStyle.' },
];

/* ===========================================================================
   12 · NOTIFICACIONES (apartado 12) · 13 · PRIVACIDAD (apartado 13)
   =========================================================================== */

export const NOTIFICACIONES_DOC = {
  queGenera: 'Recordatorios de rutinas, avisos de seguimiento y sugerencias por uso.',
  queUsa: 'El sistema global de notificaciones. Estilo de hombre no habla con el navegador.',
  requiereActivacion: '🚨 TODAS. Cada recordatorio nace APAGADO y lo enciende él. Nunca se pide el permiso dos veces.',
  frecuencia: 'Configurable desde ⋮ Personalizar → Avisos.',
};

export const PRIVACIDAD_DOC = {
  queSeGuarda: 'Lo que él escribe: rutinas, registros, productos, perfumes, gustos y las respuestas de los cuestionarios.',
  comoSeProtege: 'RLS en Supabase (`auth.uid() = user_id`) y, si lo enciende, el PIN de la aplicación.',
  comoSeElimina: 'Por elemento (papelera), por módulo, o Estilo de hombre entero desde Mis datos.',
  comoSeExporta: 'Desde Mis datos, en JSON, con todo lo que hay.',
  queNoSale: 'Nada sale del dispositivo salvo a Supabase. La IA solo recibe lo que él manda, y no se le manda un registro entero.',
};

/* ===========================================================================
   14 · LAS PRUEBAS (apartado 14)
   =========================================================================== */

export const SUITE_DE_PRUEBAS = {
  comando: 'bash scripts/verificar.sh',
  que: 'Build de Vite, las comprobaciones de Node, los casos de renderizado, las reglas invariantes y la aplicación de verdad en Chromium.',
  integrales: PRUEBAS_INTEGRALES.length,
  navegador: 'scripts/test-app-real.mjs',
  regla: '⚠️ Cada cambio en Estilo de hombre pasa por ahí ANTES de darse por hecho. Una fase sin su archivo de pruebas no está terminada.',
};

/* ===========================================================================
   15 · HISTORIAL (apartado 15) · 16 · BACKLOG (apartado 16)
   =========================================================================== */

export const HISTORIAL = {
  donde: 'CHANGELOG.md, una entrada por fase, y `docs/02_ORDEN_DE_FASES.md`, una fila por versión.',
  formato: 'vX.Y.0 — EH Fase N/65: qué se construyó, qué se decidió y qué se encontró.',
  regla: '⚠️ Una fase sin entrada en el CHANGELOG no está terminada.',
};

/** ⚠️ Decisión 1 — el backlog **es** el de la F48. No hay una segunda lista. */
export const IDEAS_FUTURAS = SE_POSPONE;

/* ===========================================================================
   17 · LA REGLA PARA CLAUDE (apartado 17)
   =========================================================================== */

export const REGLA_PARA_CLAUDE = 'Antes de modificar Estilo de hombre: leer `docs/08_ESTILO_DE_HOMBRE_TECNICO.md` y comprobar las dependencias globales. Si el dato ya vive fuera, se consulta; no se copia.';

/* ===========================================================================
   18 · EL MANUAL DE MANTENIMIENTO (apartado 18)
   ===========================================================================
   ⚠️ Decisión 4 — cuatro preguntas, cuatro respuestas que se pueden ejecutar. */

export const MANTENIMIENTO = [
  {
    id: 'migracion_falla',
    pregunta: '¿Qué hago si falla una migración?',
    respuesta: 'Nada a mano. `migrarEstiloHombre` hace copia ANTES de tocar, y si algo revienta devuelve el estado original con `error`. Para volver atrás desde fuera: `restaurarCopia(copia)`.',
    donde: 'src/lib/migracion.js',
  },
  {
    id: 'duplicado',
    pregunta: '¿Qué hago si aparece un duplicado?',
    respuesta: 'Mirar `SISTEMAS_REVISADOS` (F48): dice quién es el dueño de cada sistema. El duplicado se borra, no se sincroniza — dos sistemas que hacen lo mismo se separan solos con el tiempo.',
    donde: 'src/lib/auditoriaFinal.js',
  },
  {
    id: 'integracion_rota',
    pregunta: '¿Qué hago si se rompe una integración?',
    respuesta: 'Buscarla en `DEPENDENCIAS_GLOBALES`: dice en qué archivo vive el puente. Si lo que falla es un dato, la regla es que Estilo de hombre guarda **el id**, no la copia: el arreglo casi siempre está al otro lado.',
    donde: 'src/lib/documentacionEH.js',
  },
  {
    id: 'que_pruebas',
    pregunta: '¿Qué pruebas ejecuto después de un cambio?',
    respuesta: '`bash scripts/verificar.sh`, entero. No la del archivo que tocaste: entero. Los tres fallos más caros de este proyecto los cazó una prueba de otro sitio.',
    donde: 'scripts/verificar.sh',
  },
];

export const preguntaDeMantenimiento = (id) => MANTENIMIENTO.find((m) => m.id === id) || null;

/* ===========================================================================
   19 · LOS DIECIOCHO APARTADOS, Y DÓNDE SE CONTESTAN
   =========================================================================== */

export const SECCIONES_DOC = [
  { id: 1, nombre: 'Documento del módulo', donde: 'QUE_HACE / QUE_NO_HACE / COMO_ESTA_ORGANIZADO' },
  { id: 2, nombre: 'Mapa de módulos', donde: 'mapaDeModulos()', derivado: true },
  { id: 3, nombre: 'Sistemas globales utilizados', donde: 'DEPENDENCIAS_GLOBALES' },
  { id: 4, nombre: 'Fuente de cada dato', donde: 'fuenteDeCadaDato()', derivado: true },
  { id: 5, nombre: 'Estados', donde: 'ESTADOS_DOC', derivado: true },
  { id: 6, nombre: 'Eliminación', donde: 'CICLO_DE_ELIMINACION' },
  { id: 7, nombre: 'Estructura de datos', donde: 'ESTRUCTURA' },
  { id: 8, nombre: 'Migraciones', donde: 'registroDeMigraciones()', derivado: true },
  { id: 9, nombre: 'Componentes reutilizables', donde: 'COMPONENTES_REUTILIZABLES' },
  { id: 10, nombre: 'Reglas de diseño', donde: 'REGLAS_DE_DISENO' },
  { id: 11, nombre: 'Reglas de UX', donde: 'REGLAS_UX' },
  { id: 12, nombre: 'Notificaciones', donde: 'NOTIFICACIONES_DOC' },
  { id: 13, nombre: 'Privacidad', donde: 'PRIVACIDAD_DOC' },
  { id: 14, nombre: 'Pruebas', donde: 'SUITE_DE_PRUEBAS' },
  { id: 15, nombre: 'Cambios futuros', donde: 'HISTORIAL' },
  { id: 16, nombre: 'Backlog', donde: 'IDEAS_FUTURAS (el SE_POSPONE de la F48)', derivado: true },
  { id: 17, nombre: 'Regla para Claude', donde: 'REGLA_PARA_CLAUDE' },
  { id: 18, nombre: 'Documentación para mantenimiento', donde: 'MANTENIMIENTO' },
];

export const seccionDoc = (id) => SECCIONES_DOC.find((s) => s.id === id) || null;

export const DOCUMENTO = 'docs/08_ESTILO_DE_HOMBRE_TECNICO.md';

export const TEXTOS_DOC = {
  condicion: 'Quien vuelva dentro de meses debe poder entender: qué existe → dónde está → cómo funciona → con qué se conecta → qué no debe tocarse.',
  porQue: 'Si dentro de meses queremos modificar Estilo de hombre, hay que poder entenderlo sin rehacer todo el análisis.',
  actualizado: 'El documento se deriva del código. Si el código cambia y el documento no lo recoge, la prueba se pone roja.',
};

/* ===========================================================================
   20 · LA PRUEBA QUE LEE EL DOCUMENTO (decisión 2)
   =========================================================================== */

/**
 * 🚨 Abre el `.md` de verdad y comprueba que **no se ha quedado corto**: los
 * módulos, las dependencias, los estados y las reglas tienen que estar todos.
 */
export function auditarDocumentacion(texto = '') {
  const t = String(texto);
  const falta = (lista, saca) => lista.filter((x) => !t.includes(saca(x)));
  return {
    modulosQueFaltan: falta(MODULOS_EH, (m) => m.nombre).map((m) => m.id),
    dependenciasQueFaltan: falta(DEPENDENCIAS_GLOBALES, (d) => d.nombre).map((d) => d.id),
    estadosQueFaltan: falta(ESTADOS_DOC, (e) => e.nombre).map((e) => e.id),
    reglasQueFaltan: falta(REGLAS_UX, (r) => r.regla).map((r) => r.id),
    componentesQueFaltan: falta(COMPONENTES_REUTILIZABLES, (c) => c.componente).map((c) => c.id),
    mantenimientoQueFalta: falta(MANTENIMIENTO, (m) => m.pregunta).map((m) => m.id),
    // Apartado 17 — y la regla para quien venga, escrita.
    sinReglaParaClaude: !t.includes('leer `docs/08_ESTILO_DE_HOMBRE_TECNICO.md`'),
    // Apartado 7 — *"sin incluir secretos ni credenciales"*.
    conSecretos: /eyJ[A-Za-z0-9_-]{20,}|sk-ant-[A-Za-z0-9_-]{10,}/.test(t),
  };
}

export function panelDocumentacion(texto = '') {
  const a = auditarDocumentacion(texto);
  return {
    ...a,
    secciones: SECCIONES_DOC,
    modulos: mapaDeModulos(),
    dependencias: DEPENDENCIAS_GLOBALES,
    estados: ESTADOS_DOC,
    migraciones: registroDeMigraciones(),
    ideas: IDEAS_FUTURAS,
    mantenimiento: MANTENIMIENTO,
    /* 🎯 El veredicto: **el documento está al día con el código**. */
    alDia: a.modulosQueFaltan.length === 0
      && a.dependenciasQueFaltan.length === 0
      && a.estadosQueFaltan.length === 0
      && a.reglasQueFaltan.length === 0
      && a.componentesQueFaltan.length === 0
      && a.mantenimientoQueFalta.length === 0
      && !a.sinReglaParaClaude
      && !a.conSecretos,
    condicion: TEXTOS_DOC.condicion,
  };
}

export { MODULOS_EH, IDS_EH, CATEGORIAS_EH, categoriaEH, FUENTES_GLOBALES, ESTADOS_GESTION,
  CATALOGO_PAPELERA, MIGRACIONES, SE_POSPONE, GRAVEDADES, CHECKLIST_PUBLICACION,
  PLAN_DE_VUELTA_ATRAS, APARTADOS_EXPERIENCIA, PRUEBAS_INTEGRALES };
