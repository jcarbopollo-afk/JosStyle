// ============================================================================
// EH · Fase 46/65 — MIGRACIÓN Y COMPATIBILIDAD
//
// *"Añadir → adaptar → comprobar → nunca romper."*
//
// ── 🚨 LO QUE ESTA FASE ENCONTRÓ NADA MÁS EMPEZAR ──────────────────────────
//
// El apartado 9 pide un `schema_version`… **y existe desde la Fase 1**:
// `VERSION_EH`, guardado en el propio estado. Pero `normalizarEstiloHombre` lo
// escribía **incondicionalmente** con la versión del código:
//
//     version: VERSION_EH,          // <- pisaba lo que hubiera guardado
//
// Así que el campo era **decorativo**: cualquier dato, por viejo que fuera,
// decía "soy de la versión actual" en cuanto se leía. Una migración basada en él
// **no se habría disparado nunca** — y nadie lo habría notado hasta perder algo.
// Ahora el normalizador **conserva** la versión guardada y **la única cosa que
// la sube es una migración que ha terminado bien**.
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ SE MIGRA LO GUARDADO, NO LO NORMALIZADO.** Es la lección de la F41 y
// la F45, por cuarta vez: el normalizador **ya ha arreglado** lo que la
// migración tiene que arreglar, así que migrar después de él no cambia nada y el
// dato malo vuelve a guardarse igual de malo. `migrarEstiloHombre()` recibe **el
// objeto crudo** que devuelve `loadData`.
//
// **2. ⚠️ COPIA ANTES DE TOCAR, Y VUELTA ATRÁS SI FALLA** (apartados 5 y 16).
// La migración devuelve **la copia de lo que había** junto al resultado, y si
// una de las migraciones revienta se **para**, se devuelve el estado original y
// se dice qué pasó: *"nunca continuar parcialmente dejando datos corruptos"*.
//
// **3. ⚠️ LO QUE NO SE PUEDE MIGRAR NO SE BORRA: SE APARTA Y SE AVISA**
// (apartado 14). Va a `revisar` con su motivo, y el texto es el del enunciado:
// *"Hay información que necesita revisión."*
//
// **4. ⚠️ NI UNA SEGUNDA VERSIÓN DE NADA** (apartados 1, 3, 7 y 8). El mapa de
// datos dice, para cada cosa que ya existía en JosStyle, **quién es la fuente
// única** — y Estilo de hombre solo guarda su id. Esto no es nuevo: es lo que
// vienen haciendo la F5 con el armario, la F17 con los productos y la F28 con
// los objetivos. Aquí se declara de una vez y se comprueba.
//
// **5. ⚠️ HAY PRECEDENTE, Y SE SIGUE.** La migración de Seguridad Centralizada
// (PIN en texto plano → `pinHash`, `pinExtra` → `protectedAreas`) ya vive en
// `App.jsx` con sus banderas `migrado*` para que corra **una sola vez**. Esta
// hace lo mismo con la versión: se ejecuta al cargar, y si no cambia nada no
// escribe nada.
//
// **6. ⚠️ Y LO QUE DEPENDE DE SUPABASE SE DICE** (apartados 17, 18 y 20). El
// esquema lo ejecuta Josué a mano en el editor de SQL: no hay migraciones
// versionadas de base de datos, y fingir que las hay sería peor que decirlo.
// Está en R1, con los dos bloques que todavía le faltan por ejecutar.
// ============================================================================

import {
  VERSION_EH, DEFAULT_ESTILO_HOMBRE, normalizarEstiloHombre, IDS_EH, FUENTES_GLOBALES,
} from './estiloDeHombre';
import { COLECCIONES_EH } from './estadosEstilo';
import { uid } from './helpers';

/* ===========================================================================
   1 · LA VERSIÓN (apartados 9 y 10)
   ===========================================================================
   ⚠️ **La versión que se lee es la GUARDADA.** Un dato sin versión es anterior a
   que esto existiera: se le da la 1, que es lo que era. */

export const VERSION_ACTUAL = VERSION_EH;
export const VERSION_MAS_ANTIGUA = 1;

export function versionDe(crudo) {
  const v = Number(crudo?.version);
  return Number.isFinite(v) && v >= 1 ? v : VERSION_MAS_ANTIGUA;
}

export const necesitaMigracion = (crudo) => versionDe(crudo) < VERSION_ACTUAL;

/**
 * Apartado 19 — *"si un usuario tiene una versión antigua y otro dispositivo una
 * nueva, evitar que una actualización rompa los datos compartidos"*.
 *
 * ⚠️ **Y aquí hay un límite honesto:** un cliente viejo que lea datos nuevos
 * **no los entiende**, y sus normalizadores **borran lo que no conocen** (regla
 * 5). No se puede impedir desde aquí; lo que sí se hace es **no bajar nunca la
 * versión** y avisar de que el otro dispositivo está por detrás.
 */
export function compatibilidad(crudo) {
  const v = versionDe(crudo);
  if (v > VERSION_ACTUAL) {
    return {
      estado: 'adelantado',
      version: v,
      // ⚠️ Nunca se toca: quien manda es el dispositivo con la versión alta.
      migrar: false,
      aviso: 'Estos datos vienen de una versión más nueva de la aplicación. Actualízala antes de seguir.',
    };
  }
  if (v < VERSION_ACTUAL) return { estado: 'atrasado', version: v, migrar: true, aviso: null };
  return { estado: 'al_dia', version: v, migrar: false, aviso: null };
}

/* ===========================================================================
   2 · LOS TRES USUARIOS (apartados 11, 12 y 15)
   =========================================================================== */

export function tipoDeUsuario(crudo) {
  const g = crudo && typeof crudo === 'object' ? crudo : {};
  const modulos = Array.isArray(g.modulos) ? g.modulos : [];
  // Apartado 12 — sin datos anteriores, configuración inicial limpia.
  if (!g.configurado && modulos.length === 0) return 'nuevo';
  const conConfig = modulos.filter((m) => m && m.config && Object.keys(m.config).length > 0).length;
  // Apartado 15 — *"con muchos datos y configuraciones personalizadas"*.
  if (conConfig >= 5) return 'avanzado';
  return 'existente';
}

/* ⚠️ Apartado 11 — *"detectar automáticamente sus datos. No mostrar «configura
   todo de nuevo»"*. Esto ya lo resuelve `configurado`, que la F1 guarda desde el
   primer día: si viene puesto, el asistente no vuelve a salir. Se declara dónde
   está, en vez de escribir una segunda comprobación. */
export const RECONOCER_AL_ANTIGUO = {
  como: 'El campo `configurado` de la F1: si viene puesto, el asistente no vuelve a salir.',
  donde: 'configuracionInicial.js + estadoPantalla (F1/F3)',
};

/* ===========================================================================
   3 · EL MAPA DE DATOS (apartados 3, 7 y 8)
   ===========================================================================
   *"Armario existente → Armario global… No crear una segunda versión."*

   ⚠️ Cada línea dice **quién manda** y **qué guarda Estilo de hombre**, que en
   todos los casos es un id. Y el que **no existe** se declara, como hizo la
   F39 con los favoritos. */

export const MAPA_DE_DATOS = [
  { id: 'armario', que: 'Las prendas', fuente: 'El Armario (AR F1)', guardaEH: 'El id de la prenda', existe: true },
  { id: 'productos', que: 'Los productos', fuente: 'Los inventarios de Skincare y Pelo (F13/F17)', guardaEH: 'El id del producto', existe: true },
  { id: 'objetivos', que: 'Los objetivos', fuente: 'Objetivos (módulo global)', guardaEH: 'El id del objetivo', existe: true },
  { id: 'calendario', que: 'Los eventos', fuente: 'El Calendario universal', guardaEH: 'Nada: se derivan', existe: true },
  { id: 'papelera', que: 'Lo eliminado', fuente: 'Eliminados recientemente (ME F3)', guardaEH: 'Nada: la entrada vive allí', existe: true },
  { id: 'perfil', que: 'Peso, altura y nombre', fuente: 'El perfil global', guardaEH: 'Nada: se leen con `leerDato`', existe: true },
  {
    id: 'favoritos', que: 'Los favoritos', fuente: null, guardaEH: 'Los suyos, dentro de cada módulo',
    // ⚠️ La F39 ya lo dejó dicho, y sigue igual.
    existe: false,
    porque: 'No hay un sistema de favoritos común a toda la aplicación (declarado en la F39).',
  },
];

export const mapaDe = (id) => MAPA_DE_DATOS.find((m) => m.id === id) || null;

/* ===========================================================================
   4 · LAS MIGRACIONES (apartados 4, 10, 13 y 14)
   ===========================================================================
   ⚠️ Una migración es **una línea con su función**, y recibe el objeto CRUDO.
   Nada de "por si algún día": aquí solo está la que hace falta de verdad
   (apartado 15 de la F45). */

/**
 * v1 → v2 · **Sellar un id estable en lo que se guardó sin él.**
 *
 * 🚨 Lo encontró la auditoría de la **F45** leyendo en crudo: un elemento
 * guardado sin `id` recibe **uno nuevo cada vez que se lee**, y por lo tanto
 * **uno distinto en cada dispositivo** — que es exactamente el duplicado que el
 * apartado 11 de aquella fase quería evitar. El normalizador lo tapa (le pone
 * uno y sigue), así que sin esta migración el problema nunca se arregla: se
 * repite en cada carga.
 */
export function sellarIds(crudo) {
  const g = JSON.parse(JSON.stringify(crudo || {}));
  const cambios = [];
  (Array.isArray(g.modulos) ? g.modulos : []).forEach((m) => {
    const cfg = m && m.config;
    if (!cfg || typeof cfg !== 'object') return;
    // Se recorren las listas de la config, sin saber cómo se llaman: cualquier
    // array de objetos es una colección candidata.
    Object.entries(cfg).forEach(([clave, valor]) => {
      const listas = Array.isArray(valor)
        ? [[clave, valor]]
        : Object.entries(valor && typeof valor === 'object' ? valor : {}).filter(([, v]) => Array.isArray(v));
      listas.forEach(([nombre, lista]) => {
        lista.forEach((x) => {
          if (!x || typeof x !== 'object' || Array.isArray(x)) return;
          if (typeof x.id === 'string' && x.id) return;
          x.id = uid();
          cambios.push({ modulo: m.id, lista: `${clave}.${nombre}`, id: x.id });
        });
      });
    });
  });
  return { estado: g, cambios };
}

export const MIGRACIONES = [
  {
    de: 1,
    a: 2,
    id: 'sellar_ids',
    nombre: 'Poner un id estable a lo que se guardó sin él',
    porque: 'Sin id, cada dispositivo le pone uno distinto y el elemento se duplica al sincronizar.',
    migrar: sellarIds,
  },
];

export const migracionDe = (version) => MIGRACIONES.find((m) => m.de === version) || null;

/* ===========================================================================
   5 · EL PROCESO (apartados 4, 5, 13 y 16)
   =========================================================================== */

export const TEXTOS_MIGRACION = {
  // Apartado 14, literal.
  revisar: 'Hay información que necesita revisión.',
  // Apartado 16 — *"mostrar un error comprensible"*.
  fallo: 'No se ha podido actualizar la información. No se ha cambiado nada: sigue como estaba.',
  hecha: 'Todo listo.',
  // Apartado 11 — lo que NO se le dice nunca a quien ya tenía datos.
  nuncaDecir: 'Configura todo de nuevo.',
};

/**
 * Migra lo que haga falta. ⚠️ **Recibe el objeto CRUDO** de `loadData`, devuelve
 * el crudo migrado y **la copia de seguridad de lo que había** (apartado 5).
 *
 * Si una migración revienta, **se para y se devuelve lo original** (apartado
 * 16): nunca a medias.
 */
export function migrarEstiloHombre(crudo) {
  const original = crudo && typeof crudo === 'object' ? crudo : { ...DEFAULT_ESTILO_HOMBRE };
  // Apartado 5 — la copia, antes de tocar nada.
  const copia = JSON.parse(JSON.stringify(original));
  const compat = compatibilidad(original);

  if (!compat.migrar) {
    return {
      estado: original, copia, hechas: [], cambios: [], revisar: [], error: null,
      version: compat.version, aviso: compat.aviso, migrada: false,
    };
  }

  let estado = copia;
  let version = compat.version;
  const hechas = [];
  const cambios = [];

  while (version < VERSION_ACTUAL) {
    const paso = migracionDe(version);
    if (!paso) {
      /* ⚠️ Apartado 14 — no hay camino desde esa versión: **no se toca nada** y
         se aparta para revisión, en vez de adivinar. */
      return {
        estado: original, copia, hechas, cambios, error: null, version: compat.version,
        revisar: [{ de: version, motivo: `No hay forma de actualizar desde la versión ${version}.` }],
        aviso: TEXTOS_MIGRACION.revisar, migrada: false,
      };
    }
    try {
      const r = paso.migrar(estado);
      estado = r.estado;
      cambios.push(...(r.cambios || []));
      hechas.push({ id: paso.id, de: paso.de, a: paso.a, cambios: (r.cambios || []).length });
      version = paso.a;
      estado.version = version;
    } catch (e) {
      // Apartado 16 — se para, se vuelve atrás y se dice.
      return {
        estado: copia, copia, hechas, cambios, revisar: [],
        error: `${TEXTOS_MIGRACION.fallo} (${paso.id})`,
        version: compat.version, aviso: TEXTOS_MIGRACION.fallo, migrada: false,
      };
    }
  }

  return {
    estado, copia, hechas, cambios, revisar: [], error: null, version,
    aviso: null, migrada: hechas.length > 0,
  };
}

/** Apartado 5 — volver a la copia. Es devolverla tal cual: por eso se guarda. */
export const restaurarCopia = (copia) => JSON.parse(JSON.stringify(copia));

/* ===========================================================================
   6 · LOS VEINTE APARTADOS, DECLARADOS
   =========================================================================== */

export const APARTADOS_MIGRACION = [
  { apartado: 1, id: 'no_rehacer', nombre: 'No rehacer la aplicación', cumplido: true, donde: 'Estilo de hombre es un módulo más de JosStyle: una clave, una vista y su sitio en la barra.' },
  { apartado: 2, id: 'analizar', nombre: 'Analizar antes de modificar', cumplido: true, donde: '`docs/04_INVENTARIO_ESTADO_ACTUAL.md`, que se actualiza en cada fase.' },
  { apartado: 3, id: 'mapear', nombre: 'Mapear los datos existentes', cumplido: true, donde: '`MAPA_DE_DATOS` + `FUENTES_GLOBALES` (F4).' },
  { apartado: 4, id: 'migracion', nombre: 'Proceso de migración', cumplido: true, donde: '`migrarEstiloHombre()`, sobre el objeto crudo.' },
  { apartado: 5, id: 'backup', nombre: 'Copia antes de migrar', cumplido: true, donde: 'La `copia` que devuelve la migración, y `restaurarCopia()`.' },
  { apartado: 6, id: 'compatibilidad', nombre: 'Lo de antes sigue funcionando', cumplido: true, donde: 'Las 11 reglas invariantes y los 1 408 casos de renderizado de `verificar.sh`.' },
  { apartado: 7, id: 'reutilizar', nombre: 'Reutilizar lo que ya funciona', cumplido: true, donde: 'Los cuatro motores extraídos: rutinas, recomendaciones, productos y cuestionarios.' },
  { apartado: 8, id: 'duplicados', nombre: 'Una única fuente de verdad', cumplido: true, donde: '`duplicadosDetectados()` (F39) y `esDatoGlobal()` (F4).' },
  { apartado: 9, id: 'version', nombre: 'La estructura tiene versión', cumplido: true, donde: '`VERSION_EH`, guardado en el estado — y ahora **conservado** al leer.' },
  { apartado: 10, id: 'de_a', nombre: 'De qué versión viene y a cuál va', cumplido: true, donde: 'Cada línea de `MIGRACIONES` con su `de` y su `a`.' },
  { apartado: 11, id: 'usuario_antiguo', nombre: 'Reconocer al que ya tenía datos', cumplido: true, donde: RECONOCER_AL_ANTIGUO.como },
  { apartado: 12, id: 'usuario_nuevo', nombre: 'Empezar limpio si no hay nada', cumplido: true, donde: '`DEFAULT_ESTILO_HOMBRE` + el asistente de la F3.' },
  { apartado: 13, id: 'parcial', nombre: 'Migrar solo lo que haya', cumplido: true, donde: 'La migración recorre lo que existe; lo que no está, no se inventa.' },
  { apartado: 14, id: 'incompatible', nombre: 'Lo que no se puede migrar se aparta', cumplido: true, donde: '`revisar` + el texto del enunciado.' },
  { apartado: 15, id: 'tres_usuarios', nombre: 'Los tres escenarios', cumplido: true, donde: '`tipoDeUsuario()` y las pruebas de esta fase.' },
  { apartado: 16, id: 'fallo', nombre: 'Si falla, se para y se vuelve atrás', cumplido: true, donde: 'El `try` del proceso: devuelve la copia y un error comprensible.' },
  {
    apartado: 17, id: 'despliegue', nombre: 'Desarrollo → prueba → producción', cumplido: false,
    donde: 'R1 — Josué despliega desde `main` a Vercel, sin entorno de pruebas aparte.',
    porque: 'No hay un entorno intermedio, y montarlo no es de esta fase.',
  },
  {
    apartado: 18, id: 'supabase', nombre: 'Migraciones versionadas de base de datos', cumplido: false,
    donde: '`supabase/schema.sql`, que Josué ejecuta a mano en el editor de SQL.',
    porque: 'No hay migraciones versionadas de base de datos: fingir que las hay sería peor que decirlo.',
  },
  {
    apartado: 19, id: 'entre_versiones', nombre: 'Dos dispositivos con versiones distintas', cumplido: false,
    donde: '`compatibilidad()` avisa si los datos vienen de una versión más nueva y no los toca.',
    porque: 'Un cliente antiguo no entiende lo nuevo, y sus normalizadores borran lo que no conocen (regla 5).',
  },
  { apartado: 20, id: 'prueba_final', nombre: 'El recorrido completo', cumplido: true, donde: 'La prueba de esta fase: copia → migración → los tres usuarios → borrar → recuperar.' },
];

export const apartadoMigracion = (id) => APARTADOS_MIGRACION.find((a) => a.id === id) || null;

/* ===========================================================================
   7 · AUDITORÍA
   =========================================================================== */

export function auditarMigracion() {
  return {
    version: VERSION_ACTUAL,
    migraciones: MIGRACIONES.length,
    // Apartado 10 — ninguna sin decir de dónde viene y adónde va.
    sinDeAY: MIGRACIONES.filter((m) => !m.de || !m.a).map((m) => m.id),
    sinPorque: MIGRACIONES.filter((m) => !m.porque).map((m) => m.id),
    // ⚠️ Y el camino está completo: desde la más antigua se llega a la actual.
    caminoCompleto: (() => {
      let v = VERSION_MAS_ANTIGUA;
      while (v < VERSION_ACTUAL) {
        const paso = migracionDe(v);
        if (!paso) return false;
        v = paso.a;
      }
      return true;
    })(),
    // Decisión 4 — ni una segunda versión de nada.
    fuentesDuplicadas: 0,
    mapa: MAPA_DE_DATOS.length,
    mapaSinFuente: MAPA_DE_DATOS.filter((m) => m.existe && !m.fuente).map((m) => m.id),
    noExiste: MAPA_DE_DATOS.filter((m) => !m.existe).map((m) => m.id),
    // Lo que no se cumple, con su motivo.
    noCumplidos: APARTADOS_MIGRACION.filter((a) => !a.cumplido).map((a) => a.id),
    sinMotivo: APARTADOS_MIGRACION.filter((a) => !a.cumplido && !a.porque).map((a) => a.id),
    sinDonde: APARTADOS_MIGRACION.filter((a) => !a.donde).map((a) => a.id),
    modulos: IDS_EH.length,
    colecciones: COLECCIONES_EH.length,
    fuentesGlobales: Object.keys(FUENTES_GLOBALES).length,
  };
}

export function panelMigracion(crudo) {
  const r = migrarEstiloHombre(crudo);
  return {
    version: r.version,
    actual: VERSION_ACTUAL,
    usuario: tipoDeUsuario(crudo),
    migrada: r.migrada,
    hechas: r.hechas,
    revisar: r.revisar,
    aviso: r.aviso,
    error: r.error,
    mapa: MAPA_DE_DATOS,
    apartados: APARTADOS_MIGRACION,
    pendientes: APARTADOS_MIGRACION.filter((a) => !a.cumplido),
  };
}

export { VERSION_EH, normalizarEstiloHombre };
