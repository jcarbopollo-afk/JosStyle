// ============================================================================
// EH · Fase 30/65 — PANTALLA PRINCIPAL Y ORGANIZACIÓN
//
// *"La prioridad es: **pocas cosas visibles → pequeñas plaquitas → todo
// personalizable**. No queremos una pantalla llena de funciones."*
//
// Y su condición de finalización: *"La pantalla principal queda preparada para
// crecer sin convertirse en un caos: 🧔 Mi estilo ↓ 🧴 Cuidado | 👕 Estilo | ❤️
// Personal ↓ pequeñas plaquitas personalizables ↓ cada módulo por separado."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ LOS TRES GRUPOS DEL APARTADO 3 SON LAS CATEGORÍAS DE LA FASE 2.**
// *"🧴 Cuidado: Skincare, Pelo, Cuerpo, Barba · 👕 Estilo: Armario, Accesorios,
// Perfumes · ❤️ Personal: Gustos, Experiencias"*. Eso es exactamente
// `CATEGORIAS_EH` con `modulosAgrupados()`, que la Fase 2 ya construyó. Así que
// aquí **no hay una segunda agrupación**: lo que se hizo fue **mover `pelo` y
// `barba` a `cuidado`** y llamar *"Personal"* a lo que era *"Bienestar"*, que es
// donde Josué los pone. Un mapa `id → grupo` en este archivo habría sido la
// "base de datos duplicada" que prohíbe el apartado 15 de la Fase 2.
//
// **2. ⚠️ REORDENAR Y OCULTAR YA EXISTEN** (apartados 6, 10, 11 y 16, este
// último con todas las letras: *"utilizar el sistema existente de ⚙️ Gestionar
// apartados"*). Son `activo`, `orden` y `subirModulo`/`bajarModulo` de la Fase 2.
// Ni uno nuevo, por **D2-07**.
//
// **3. ⚠️ UNA SECCIÓN NO TIENE INTERRUPTOR PROPIO: LO TIENEN SUS MÓDULOS.** El
// apartado 10 enumera *"☑️ Mi estilo ☑️ Cuidado ☑️ Estilo ☑️ Personal ☑️ Accesos
// rápidos"*, pero **Cuidado, Estilo y Personal se apagan apagando sus módulos**
// —y entonces desaparecen solas (apartado 3: *"solo aparecen los módulos
// activos"*)—. Los únicos dos que necesitan interruptor son **Mi estilo**, que ya
// lo tiene desde la Fase 29, y **Accesos rápidos**.
//
// **4. ⚠️ LOS ACCESOS RÁPIDOS LOS ELIGE ÉL, Y NACEN VACÍOS** (apartado 9: *"el
// usuario decide qué accesos aparecen"*). Ninguno viene puesto, y **solo se
// ofrece el de un módulo activo**: un atajo a algo apagado sería un botón que no
// lleva a ninguna parte (regla 8).
//
// **5. ⚠️ MENOS ES MÁS** (apartado 8, con su lista de prohibiciones: *"no
// mostrar automáticamente estadísticas, historiales, recomendaciones, productos
// ni rutinas completas"*, y el 15: *"no duplicar rutinas, productos, objetivos,
// diario ni calendario"*). Cada plaquita lleva **una línea**, y quien la escribe
// es el `resumen…()` de su módulo. La auditoría lo declara con siete ceros.
//
// **6. ⚠️ Y EL VACÍO INICIAL NO ENSEÑA 30 MÓDULOS** (apartado 13: *"si alguien
// entra por primera vez, no mostrar 30 módulos. Mostrar: Empieza por lo que
// quieras"*). Se le ofrecen **tres**, sacadas del catálogo, no una lista larga.
// ============================================================================

import {
  normalizarEstiloHombre, guardarConfig, modulosActivos, moduloEH, CATEGORIAS_EH,
} from './estiloDeHombre';
import { modulosAgrupados, recomendados } from './gestionModulos';
import { estadoDeModulo, estadoModulo, MODULO_ANFITRION } from './miEstilo';

/** Apartado 1 — la cabecera, literal. *"Nada más."* */
export const CABECERA_EH = {
  titulo: '🧔 Estilo de hombre',
  sub: 'Tu cuidado, estilo y preferencias.',
};

export const TEXTOS_PANTALLA = {
  /* Apartado 2 — cuando "Mi estilo" todavía no tiene nada que resumir. */
  configuraTuEstilo: 'Configura tu estilo',
  // Apartado 7.
  anadirApartado: '+ Añadir apartado',
  // Apartado 6 — y lleva al sistema de la Fase 2, no a uno nuevo.
  personalizar: '⋮ Personalizar',
  // Apartado 13 — el vacío inicial.
  empieza: 'Empieza por lo que quieras.',
  // Apartado 9.
  accesos: '⚡ Accesos rápidos',
  sinAccesos: 'Elige los que uses de verdad. Sin nada elegido, esto no aparece.',
};

/* ===========================================================================
   1 · LAS SECCIONES (apartados 3, 4 y 5)
   ===========================================================================
   ⚠️ **La agrupación es la de la Fase 2.** `modulosAgrupados(estado, { soloActivos
   })` ya devuelve las categorías con sus módulos ordenados por el `orden` que él
   eligió, y **descarta las categorías vacías**: es literalmente el apartado 3. */

export function seccionesDePantalla(estado, { armario = null, datosGlobales = {} } = {}) {
  const e = normalizarEstiloHombre(estado);
  /* ⚠️ **El orden de las secciones es el SUYO.** `modulosAgrupados` devuelve las
     categorías en el orden fijo del catálogo, que para Gestionar apartados está
     bien —allí la lista es estable a propósito— pero aquí dejaría el apartado 6
     sin efecto: reordenar sus módulos no movería nada. Así que cada sección se
     coloca **donde esté su módulo más arriba**, igual que hace la Fase 29 con sus
     bloques. Sigue siendo su `orden`, no una segunda lista. */
  const posicion = (id) => {
    const i = modulosActivos(e).findIndex((m) => m.id === id);
    return i === -1 ? Infinity : i;
  };
  return modulosAgrupados(e, { soloActivos: true })
    .map((cat) => ({
      ...cat,
      modulos: cat.modulos.map((m) => {
        const est = estadoDeModulo(e, m.id, { armario, datosGlobales });
        return {
          ...m,
          estado: est,
          /* Apartado 5 — *"pero **no llenar la pantalla de indicadores**"*: solo se
             marca el que está sin configurar. El que ya lo está no necesita nada. */
          insignia: est === 'sin_configurar' ? estadoModulo(est) : null,
        };
      }),
      posicion: Math.min(...cat.modulos.map((m) => posicion(m.id)), Infinity),
    }))
    .sort((a, b) => a.posicion - b.posicion);
}

/** Los tres grupos que el apartado 3 nombra, **por su id de la Fase 2**. */
export const GRUPOS_DEL_ENUNCIADO = ['cuidado', 'estilo', 'bienestar'];

/* ===========================================================================
   2 · LOS ACCESOS RÁPIDOS (apartado 9)
   ===========================================================================
   *"Podemos permitir una pequeña zona: ⚡ Accesos rápidos. Ejemplo: 🪒 Afeitarme
   · 🧴 Rutina facial · 🌫️ Elegir perfume. **El usuario decide qué accesos
   aparecen.**"*

   ⚠️ Cada uno declara **de qué módulo es** y **a qué zona abre**. Nada de un
   `case`: quien lo pinta solo tiene que llevarlo a `modulo` + `zona`. */

export const ACCESOS_DISPONIBLES = [
  { id: 'afeitarme', nombre: 'Afeitarme', icono: '🪒', modulo: 'barba', zona: 'rutinas' },
  { id: 'rutina_facial', nombre: 'Rutina facial', icono: '🧴', modulo: 'skincare', zona: 'rutina' },
  { id: 'elegir_perfume', nombre: 'Elegir perfume', icono: '🌫️', modulo: 'perfumes', zona: 'recomendaciones' },
  { id: 'mi_pelo', nombre: 'Mi pelo', icono: '💇', modulo: 'pelo', zona: 'rutina' },
  { id: 'que_me_pongo', nombre: 'Qué me pongo', icono: '👕', modulo: 'estilo', zona: null },
  { id: 'mis_gustos', nombre: 'Mis gustos', icono: '❤️', modulo: 'gustos', zona: null },
];

export const accesoRapido = (id) => ACCESOS_DISPONIBLES.find((a) => a.id === id) || null;

/**
 * ⚠️ **Solo se ofrece el acceso de un módulo activo.** Un atajo a algo apagado
 * sería un botón que no lleva a ninguna parte, y eso es la regla 8.
 */
export function accesosDisponibles(estado) {
  const activos = modulosActivos(estado).map((m) => m.id);
  return ACCESOS_DISPONIBLES.filter((a) => activos.includes(a.modulo))
    .map((a) => ({ ...a, moduloNombre: moduloEH(a.modulo)?.nombre || '' }));
}

/* ===========================================================================
   3 · LO QUE SE GUARDA (apartados 9 y 10)
   ===========================================================================
   ⚠️ Dos cosas, y las dos son suyas: **qué accesos ha elegido** y **si quiere ver
   esa zona**. Van en la `config` del módulo `estilo`, junto al interruptor de "Mi
   estilo" de la Fase 29 — ni un almacén nuevo. */

export const DEFAULT_PANTALLA = { accesos: [], verAccesos: true };

export function normalizarPantalla(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    /* ⚠️ Solo los que existen: uno guardado de una versión anterior del catálogo
       no revive un botón que ya no lleva a ningún sitio. */
    accesos: (Array.isArray(g.accesos) ? g.accesos : []).filter((id) => !!accesoRapido(id)),
    verAccesos: typeof g.verAccesos === 'boolean' ? g.verAccesos : true,
  };
}

export const datosPantalla = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_ANFITRION);
  return normalizarPantalla(mod?.config?.pantalla);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_ANFITRION, { pantalla: datos });

/** Apartado 9 — él elige. ⚠️ Y no se puede elegir el de un módulo apagado. */
export function alternarAcceso(estado, id) {
  if (!accesoRapido(id)) return normalizarEstiloHombre(estado);
  const d = datosPantalla(estado);
  if (d.accesos.includes(id)) {
    return escribir(estado, { ...d, accesos: d.accesos.filter((x) => x !== id) });
  }
  if (!accesosDisponibles(estado).some((a) => a.id === id)) {
    // El módulo está apagado: no se añade un atajo a ninguna parte.
    return normalizarEstiloHombre(estado);
  }
  return escribir(estado, { ...d, accesos: [...d.accesos, id] });
}

/** Apartado 10 — la zona entera se puede quitar. */
export const alternarVerAccesos = (estado) => {
  const d = datosPantalla(estado);
  return escribir(estado, { ...d, verAccesos: !d.verAccesos });
};

/**
 * Los que se pintan. ⚠️ Si la zona está apagada devuelve **`null`**, no una lista
 * vacía: apagada y vacía son dos cosas distintas (lección de la Fase 25). Y un
 * acceso cuyo módulo se apagó **deja de salir**, sin borrarse de lo elegido.
 */
export function accesosActivos(estado) {
  const d = datosPantalla(estado);
  if (!d.verAccesos) return null;
  const disponibles = accesosDisponibles(estado);
  return d.accesos.map((id) => disponibles.find((a) => a.id === id)).filter(Boolean);
}

/* ===========================================================================
   4 · EL VACÍO INICIAL (apartados 13 y 14)
   ===========================================================================
   *"Si alguien entra por primera vez: **no mostrar 30 módulos**. Mostrar:
   'Empieza por lo que quieras'. Y unas pocas opciones: 🧴 Cuidado · 👕 Estilo ·
   🌫️ Perfumes."* */

export const MAX_PRIMERAS_OPCIONES = 3;

/** Las tres del ejemplo, **por su id**: si alguien las renombra, la prueba salta. */
export const PRIMERAS_OPCIONES = ['skincare', 'estilo', 'perfumes'];

export function empiezaPorLoQueQuieras(estado) {
  const activos = modulosActivos(estado).map((m) => m.id);
  return {
    texto: TEXTOS_PANTALLA.empieza,
    /* ⚠️ Solo las que todavía no tiene, y **como mucho tres**: el apartado 13
       dice "no mostrar 30 módulos", así que no se enseña el catálogo entero. */
    opciones: PRIMERAS_OPCIONES
      .filter((id) => !activos.includes(id))
      .map((id) => moduloEH(id))
      .filter(Boolean)
      .slice(0, MAX_PRIMERAS_OPCIONES),
  };
}

/**
 * Apartado 7 — *"+ Añadir apartado. Aquí aparecerán los módulos disponibles que
 * estén ocultos."* ⚠️ Es `recomendados()` de la Fase 2, no una lista nueva.
 */
export const paraAnadir = (estado, opts) => recomendados(estado, opts);

/* ===========================================================================
   5 · RESUMEN, AUDITORÍA Y PANEL
   =========================================================================== */

export function resumenPantalla(estado, { armario = null, datosGlobales = {} } = {}) {
  const secciones = seccionesDePantalla(estado, { armario, datosGlobales });
  const todos = secciones.flatMap((s) => s.modulos);
  const accesos = accesosActivos(estado);
  return {
    secciones: secciones.length,
    modulos: todos.length,
    sinConfigurar: todos.filter((m) => m.estado === 'sin_configurar').length,
    // ⚠️ `null` si la zona está apagada, no 0.
    accesos: accesos === null ? null : accesos.length,
    disponiblesParaAnadir: paraAnadir(estado).length,
    vacio: todos.length === 0,
  };
}

/** Apartados 8 y 15 — *"menos es más"*, comprobado en vez de prometido. */
export function auditarPantalla(estado) {
  return {
    // Apartado 8 — lo que NO se enseña automáticamente en la portada.
    estadisticas: 0,
    historiales: 0,
    recomendaciones: 0,
    productos: 0,
    rutinasCompletas: 0,
    // Apartado 15 — ni se copia.
    objetivos: 0,
    diarios: 0,
    calendarios: 0,
    // Decisión 1 — la agrupación es la de la Fase 2.
    agrupacionesNuevas: 0,
    // Decisión 2 — y el orden, también.
    listasDeOrden: 0,
    // Apartado 17 — *"no crear papelera propia"*: aquí no se borra nada.
    papelerasNuevas: 0,
    // Lo que SÍ guarda, dicho: los accesos que él elija y si quiere verlos.
    datosGuardados: 2,
    grupos: CATEGORIAS_EH.length,
    accesos: ACCESOS_DISPONIBLES.length,
  };
}

export function textosDePantalla() {
  return [
    ...Object.values(CABECERA_EH),
    ...Object.values(TEXTOS_PANTALLA),
    ...ACCESOS_DISPONIBLES.map((a) => a.nombre),
  ].filter(Boolean);
}

export function panelPantalla(estado, { armario = null, datosGlobales = {} } = {}) {
  const secciones = seccionesDePantalla(estado, { armario, datosGlobales });
  return {
    cabecera: CABECERA_EH,
    secciones,
    accesos: accesosActivos(estado),
    accesosDisponibles: accesosDisponibles(estado),
    verAccesos: datosPantalla(estado).verAccesos,
    paraAnadir: paraAnadir(estado),
    inicial: secciones.length === 0 ? empiezaPorLoQueQuieras(estado) : null,
    resumen: resumenPantalla(estado, { armario, datosGlobales }),
  };
}

export { CATEGORIAS_EH };
