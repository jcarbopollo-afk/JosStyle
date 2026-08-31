// ============================================================================
// EH · Fase 47/65 — PRUEBAS INTEGRALES
//
// *"No sirve de nada tener 50 funciones si dos se rompen al conectarlas."*
//
// ── QUÉ SE CONSTRUYE AQUÍ ──────────────────────────────────────────────────
//
// El enunciado es **una lista de treinta recorridos**, no de funciones. Así que
// esto es el **catálogo de las treinta**, cada una con:
//
//   · **cómo se comprueba** — en Node, en Chromium, o **solo con un móvil**,
//   · **dónde está esa comprobación**, con el archivo real,
//   · y **cómo se clasificaría un fallo** suyo, con las cuatro etiquetas que
//     pide la condición de finalización: 🔴 crítico, 🟠 importante, 🟡 menor,
//     🟢 mejora.
//
// ── LAS CUATRO DECISIONES QUE GOBIERNAN ESTA FASE ──────────────────────────
//
// **1. ⚠️ UNA PRUEBA QUE NO SE EJECUTA NO ES UNA PRUEBA.** Este catálogo no
// vale de nada si nadie recorre lo que declara, así que `scripts/test-integrales.mjs`
// **hace de verdad** los recorridos que se pueden hacer sin un móvil: crear,
// borrar, recuperar, borrar del todo, activar, desactivar, migrar, buscar,
// recomendar. Y hay una comprobación de que **cada prueba declarada como
// automática tiene su archivo**.
//
// **2. ⚠️ Y LAS QUE NECESITAN UN MÓVIL SE DICEN, UNA A UNA.** La red (15), los
// dos dispositivos (16 y 17), el lector de pantalla (22), los tamaños de
// pantalla (21) y la reinstalación (29) **no se pueden comprobar desde aquí**.
// Se declaran con `como: 'josue'` y su motivo, y son lo que R1 lleva pidiendo
// desde la v1.22.0. Marcarlas como pasadas sería mentir en el sitio donde más
// caro sale.
//
// **3. ⚠️ EL CONFLICTO (17) NO ES QUE FALTE PROBARLO: ES QUE NO EXISTE.** La
// F41 y la F45 ya lo dejaron escrito —`saveData` sobrescribe sin leer la versión
// anterior—, así que esta prueba **fallaría**, y se declara como lo que es:
// pendiente de una decisión de esquema, no de una tarde de pruebas.
//
// **4. ⚠️ UN FALLO SE CLASIFICA, NO SE DISCUTE.** Las cuatro etiquetas están en
// el código con su significado, y cada prueba dice **de qué gravedad sería su
// fallo**: así, el día que algo se rompa, la conversación es "qué arreglamos
// primero" y no "cómo de grave es esto".
// ============================================================================

import { MODULOS_EH } from './estiloDeHombre';
import { COLECCIONES_EH } from './estadosEstilo';
import { APARTADOS_MIGRACION } from './migracion';
import { APARTADOS_RENDIMIENTO } from './rendimiento';
import { APARTADOS_ESTRUCTURA } from './estructuraDatos';

/* ===========================================================================
   1 · CÓMO SE CLASIFICA UN FALLO (condición de finalización)
   =========================================================================== */

export const GRAVEDADES = [
  { id: 'critico', icono: '🔴', nombre: 'Crítico', que: 'Impide utilizar la aplicación.', orden: 0 },
  { id: 'importante', icono: '🟠', nombre: 'Importante', que: 'Afecta a una función.', orden: 1 },
  { id: 'menor', icono: '🟡', nombre: 'Menor', que: 'Problema visual o de comportamiento pequeño.', orden: 2 },
  { id: 'mejora', icono: '🟢', nombre: 'Mejora', que: 'No es un error.', orden: 3 },
];

export const gravedad = (id) => GRAVEDADES.find((g) => g.id === id) || null;

/** Ordena una lista de fallos por gravedad. ⚠️ Lo crítico primero, siempre. */
export const ordenarPorGravedad = (fallos) => [...fallos].sort(
  (a, b) => (gravedad(a.gravedad)?.orden ?? 9) - (gravedad(b.gravedad)?.orden ?? 9),
);

/* ===========================================================================
   2 · LAS TREINTA PRUEBAS
   ===========================================================================
   `como`: 'node' se ejecuta con el resto de la suite · 'chromium' lo recorre
   `test-app-real.mjs` en un navegador de verdad · 'josue' necesita su móvil. */

export const PRUEBAS_INTEGRALES = [
  { apartado: 1, id: 'entrada', nombre: 'Abrir Estilo de hombre', como: 'chromium', donde: 'test-app-real.mjs', siFalla: 'critico' },
  { apartado: 2, id: 'plaquitas', nombre: 'Mostrar, abrir, volver, ocultar y mover una plaquita', como: 'node', donde: 'test-integrales.mjs', siFalla: 'importante' },
  { apartado: 3, id: 'activacion', nombre: 'Activar, configurar, usar, desactivar y reactivar', como: 'node', donde: 'test-integrales.mjs', siFalla: 'critico' },
  { apartado: 4, id: 'eliminacion', nombre: 'Crear, eliminar, recuperar y eliminar del todo', como: 'node', donde: 'test-integrales.mjs', siFalla: 'critico' },
  { apartado: 5, id: 'objetivos', nombre: 'Convertir una experiencia en objetivo', como: 'node', donde: 'test-integrales.mjs', siFalla: 'importante' },
  { apartado: 6, id: 'calendario', nombre: 'Una fecha llega al calendario global', como: 'node', donde: 'test-integrales.mjs', siFalla: 'importante' },
  {
    apartado: 7, id: 'diario', nombre: 'La relación con el Diario permanece', como: 'declarado',
    donde: 'Estilo de hombre NO escribe en el Diario: no hay tal enlace todavía.',
    porque: 'Ninguna fase ha construido el puente con el Diario; inventarlo aquí sería adelantar trabajo.',
    siFalla: 'mejora',
  },
  {
    apartado: 8, id: 'favoritos', nombre: 'Un favorito aparece en Favoritos globales', como: 'declarado',
    donde: 'No hay favoritos globales (declarado en la F39 y en el mapa de la F46).',
    porque: 'Cada módulo tiene los suyos; el sistema transversal no existe.',
    siFalla: 'mejora',
  },
  { apartado: 9, id: 'productos', nombre: 'Un producto no se copia dentro de Estilo', como: 'node', donde: 'test-integrales.mjs', siFalla: 'importante' },
  { apartado: 10, id: 'notificaciones', nombre: 'Un recordatorio avisa, y apagado no', como: 'node', donde: 'test-integrales.mjs', siFalla: 'importante' },
  { apartado: 11, id: 'recomendaciones', nombre: 'Guardar, no me interesa y ya lo hago', como: 'node', donde: 'test-integrales.mjs', siFalla: 'importante' },
  { apartado: 12, id: 'busqueda', nombre: 'Buscar, con el estado correcto de cada resultado', como: 'node', donde: 'test-integrales.mjs', siFalla: 'importante' },
  { apartado: 13, id: 'perfil', nombre: 'Cambiar una preferencia se ve en Mi estilo', como: 'node', donde: 'test-integrales.mjs', siFalla: 'importante' },
  { apartado: 14, id: 'estadisticas', nombre: 'Los números salen de los datos reales', como: 'node', donde: 'test-integrales.mjs', siFalla: 'importante' },
  {
    apartado: 15, id: 'desconexion', nombre: 'Sin conexión y volver', como: 'josue',
    donde: 'R1 — su iPhone, con el modo avión.',
    porque: 'No hay forma de cortar la red de verdad desde aquí.',
    siFalla: 'importante',
  },
  {
    apartado: 16, id: 'dos_dispositivos', nombre: 'Dos dispositivos', como: 'josue',
    donde: 'R1 — su iPhone y otro navegador con la misma cuenta.',
    porque: 'Hace falta Supabase real y dos sesiones.',
    siFalla: 'importante',
  },
  {
    apartado: 17, id: 'conflicto', nombre: 'Detectar un conflicto entre dispositivos', como: 'declarado',
    /* ⚠️ Decisión 3 — esta prueba fallaría, y se sabe por qué desde la F41. */
    donde: 'No se puede: `saveData` sobrescribe sin leer la versión anterior (F41, F45 y F46).',
    porque: 'Detectarlo exige versión o marca de tiempo en `app_data`: es una decisión de esquema.',
    siFalla: 'importante',
  },
  { apartado: 18, id: 'cuenta', nombre: 'Cerrar sesión no deja nada suyo en pantalla', como: 'chromium', donde: 'test-app-real.mjs', siFalla: 'critico' },
  { apartado: 19, id: 'usuario_nuevo', nombre: 'Empezar desde cero', como: 'node', donde: 'test-integrales.mjs', siFalla: 'critico' },
  { apartado: 20, id: 'usuario_avanzado', nombre: 'Una cuenta con muchísimo dentro', como: 'node', donde: 'test-rendimiento.mjs + test-integrales.mjs', siFalla: 'importante' },
  {
    apartado: 21, id: 'interfaz', nombre: 'Claro, oscuro y tres tamaños de pantalla', como: 'josue',
    donde: 'R1 — su iPhone. El claro/oscuro sí se comprueba en Chromium.',
    porque: 'Los tamaños de pantalla reales necesitan los dispositivos.',
    siFalla: 'menor',
  },
  {
    apartado: 22, id: 'accesibilidad', nombre: 'Texto, contraste, botones y lector de pantalla', como: 'node',
    donde: 'test-accesibilidad-eh.mjs (F42) — el lector de pantalla, R1.',
    siFalla: 'importante',
  },
  { apartado: 23, id: 'errores', nombre: 'Provocar errores y recuperarse', como: 'node', donde: 'test-estados-estilo.mjs (F41) + test-integrales.mjs', siFalla: 'importante' },
  { apartado: 24, id: 'rendimiento', nombre: 'Tiempos de apertura, navegación y búsqueda', como: 'node', donde: 'test-rendimiento.mjs (F44)', siFalla: 'menor' },
  { apartado: 25, id: 'datos', nombre: 'Ni duplicados ni datos perdidos', como: 'node', donde: 'test-estructura-datos.mjs (F45) + test-integrales.mjs', siFalla: 'critico' },
  { apartado: 26, id: 'seguridad', nombre: 'No se puede ver lo de otro usuario', como: 'node', donde: 'test-privacidad-estilo.mjs (F43): las cuatro políticas RLS.', siFalla: 'critico' },
  { apartado: 27, id: 'migracion', nombre: 'Una cuenta antigua migra entera', como: 'node', donde: 'test-migracion.mjs (F46)', siFalla: 'critico' },
  { apartado: 28, id: 'actualizacion', nombre: 'Actualizar no se lleva nada por delante', como: 'node', donde: 'test-integrales.mjs', siFalla: 'critico' },
  {
    apartado: 29, id: 'reinstalacion', nombre: 'Reinstalar y recuperar desde la nube', como: 'josue',
    donde: 'R1 — desinstalar la PWA del iPhone y volver a entrar.',
    porque: 'Necesita el dispositivo y la cuenta real.',
    siFalla: 'critico',
  },
  {
    apartado: 30, id: 'usuario_normal', nombre: 'Usarlo como una persona normal', como: 'josue',
    donde: 'R1 — y es, dice el enunciado, la más importante.',
    porque: 'Si algo resulta confuso es un fallo de UX, y eso solo lo ve quien lo usa sin instrucciones.',
    siFalla: 'importante',
  },
];

export const pruebaIntegral = (id) => PRUEBAS_INTEGRALES.find((p) => p.id === id) || null;

export const pruebasAutomaticas = () => PRUEBAS_INTEGRALES.filter((p) => p.como === 'node' || p.como === 'chromium');
export const pruebasDeJosue = () => PRUEBAS_INTEGRALES.filter((p) => p.como === 'josue');
export const pruebasDeclaradas = () => PRUEBAS_INTEGRALES.filter((p) => p.como === 'declarado');

/* ===========================================================================
   3 · EL PARTE (condición de finalización)
   ===========================================================================
   *"No se considera terminada la implementación hasta que todas las pruebas
   críticas pasan."* Así que hay una función que lo dice en una frase. */

export const TEXTOS_INTEGRALES = {
  listo: 'Todas las pruebas críticas automáticas pasan.',
  pendiente: 'Quedan pruebas críticas por pasar.',
  deJosue: 'Y hay pruebas que solo se pueden hacer en el móvil.',
  confuso: 'Si algo resulta confuso, es un fallo de UX.',
};

/**
 * `resultados` es `[{ id, ok }]` con lo que haya salido de ejecutarlas.
 * ⚠️ **Lo que no se ha ejecutado no cuenta como aprobado**: sale aparte.
 */
export function parteDePruebas(resultados = []) {
  const dicho = (id) => resultados.find((r) => r.id === id) || null;
  const auto = pruebasAutomaticas();
  const criticas = auto.filter((p) => p.siFalla === 'critico');
  const fallidas = auto.filter((p) => dicho(p.id)?.ok === false);
  return {
    total: PRUEBAS_INTEGRALES.length,
    automaticas: auto.length,
    ejecutadas: auto.filter((p) => !!dicho(p.id)).length,
    sinEjecutar: auto.filter((p) => !dicho(p.id)).map((p) => p.id),
    criticas: criticas.length,
    criticasFallidas: fallidas.filter((p) => p.siFalla === 'critico').map((p) => p.id),
    fallidas: ordenarPorGravedad(fallidas.map((p) => ({ id: p.id, gravedad: p.siFalla }))),
    deJosue: pruebasDeJosue().map((p) => p.id),
    declaradas: pruebasDeclaradas().map((p) => p.id),
    // La frase de la condición de finalización.
    frase: fallidas.some((p) => p.siFalla === 'critico') ? TEXTOS_INTEGRALES.pendiente : TEXTOS_INTEGRALES.listo,
  };
}

/* ===========================================================================
   4 · AUDITORÍA
   =========================================================================== */

export function auditarPruebas() {
  return {
    pruebas: PRUEBAS_INTEGRALES.length,
    automaticas: pruebasAutomaticas().length,
    deJosue: pruebasDeJosue().length,
    declaradas: pruebasDeclaradas().length,
    // Decisión 2 — ninguna de las que no se puede hacer aquí se queda sin motivo.
    sinMotivo: PRUEBAS_INTEGRALES.filter((p) => p.como !== 'node' && p.como !== 'chromium' && !p.porque).map((p) => p.id),
    sinDonde: PRUEBAS_INTEGRALES.filter((p) => !p.donde).map((p) => p.id),
    // Decisión 4 — todas dicen de qué gravedad sería su fallo.
    sinGravedad: PRUEBAS_INTEGRALES.filter((p) => !gravedad(p.siFalla)).map((p) => p.id),
    gravedades: GRAVEDADES.length,
    // Y esta fase no construye nada nuevo: recorre lo que ya hay.
    modulosNuevos: 0,
    almacenesNuevos: 0,
    modulos: MODULOS_EH.length,
    colecciones: COLECCIONES_EH.length,
    // Lo que ya declararon las tres fases anteriores, para no repetirlo.
    apartadosDeclaradosAntes: APARTADOS_MIGRACION.length + APARTADOS_RENDIMIENTO.length + APARTADOS_ESTRUCTURA.length,
  };
}

export function panelPruebas(resultados = []) {
  return {
    pruebas: PRUEBAS_INTEGRALES,
    gravedades: GRAVEDADES,
    parte: parteDePruebas(resultados),
    pendienteDeJosue: pruebasDeJosue().map((p) => ({ id: p.id, nombre: p.nombre, porque: p.porque })),
    // ⚠️ Lo que no se puede probar porque **no existe**, que no es lo mismo.
    noExiste: pruebasDeclaradas().map((p) => ({ id: p.id, nombre: p.nombre, porque: p.porque })),
    confuso: TEXTOS_INTEGRALES.confuso,
  };
}
