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
//
// ── EH · Fase 31/65 — PERSONALIZACIÓN PROFUNDA DE LAS PLAQUITAS ────────────
//
// *"La aplicación se adapta al usuario, no el usuario a la aplicación."*
//
// La Fase 31 vive en la sección 5 de este mismo archivo, porque **casi todo lo
// que su enunciado pide ya estaba**: mover, ocultar, confirmar y "+ Añadir
// apartado" son de la Fase 2; los accesos rápidos, de la 30. Lo nuevo son el
// **tamaño**, el **contenido**, el **límite de accesos visibles** y los dos
// botones de abajo (restablecer y personalizar automáticamente).
//
// ⚠️ **Y el apartado 12 manda sobre dónde se guarda todo eso**: *"cambiar la
// plaquita de Skincare **solo cambia su representación** en Estilo de hombre.
// **No modifica la configuración interna de Skincare**."* Así que `tamanos` y
// `contenido` van en el almacén de la pantalla, junto a los accesos, y **nunca**
// dentro de la `config` del módulo al que describen.
// ============================================================================

import {
  normalizarEstiloHombre, guardarConfig, modulosActivos, moduloEH, CATEGORIAS_EH,
  MODULOS_EH, IDS_EH, reordenar,
} from './estiloDeHombre';
import { modulosAgrupados, recomendados } from './gestionModulos';
import { estadoDeModulo, estadoModulo, MODULO_ANFITRION } from './miEstilo';
/* ⚠️ EH F31, apartado 5 — **cada línea sale del `resumen…()` de su módulo**.
   Ni un dato nuevo, ni una copia: es la misma frontera que la Fase 30 puso para
   la línea única de la plaquita, solo que ahora él elige cuántas ve. */
import { resumenEstiloArmario } from './armarioEnEstiloHombre';
import { progresoPelo } from './perfilCapilar';
import { resumenPelo } from './rutinasPelo';
import { resumenPiel } from './perfilPiel';
import { resumenRutinasPiel } from './rutinasPiel';
import { resumenProductosPiel } from './productosPiel';
import { resumenBarba } from './perfilBarba';
import { resumenSonrisa } from './sonrisa';
/* ⚠️ **EH F18** — y su línea sale de `lineaCH()`, no de un dato nuevo. */
import { lineaCH, resumenCH, MODULO_HIGIENE, MODULO_CUERPO } from './cuerpoHigiene';
import { resumenPerfumes } from './perfumes';
import { resumenAccesorios } from './accesorios';
import { resumenGustos } from './gustos';

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
  // ── F31 ──
  // Apartado 7 — el remedio que da el propio enunciado cuando hay demasiados.
  mostrarTodos: 'Mostrar todos',
  mostrarMenos: 'Mostrar menos',
  // Apartado 5.
  configurarContenido: 'Configurar contenido',
  // Apartado 4.
  tamano: 'Tamaño',
  // Apartado 8 — y se dice, porque es lo que le preocupa.
  ocultarNoBorra: 'Ocultar una plaquita no borra nada: sus datos siguen ahí.',
  listo: 'Listo',
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
      /* ⚠️ **EH F36, apartado 3** — *"ocultar: el módulo desaparece de la
         pantalla principal. **No cambia su funcionamiento interno.**"* Aquí es
         donde eso se hace verdad, y **solo aquí**: el módulo oculto sigue
         estando activo, así que sigue dando ideas (F32), tarjetas (F33) y
         métricas (F35). Filtrarlo también en aquéllas sería confundir ocultar
         con desactivar, que es justo lo que la F36 vino a separar. */
      modulos: cat.modulos.filter((m) => !m.oculto).map((m) => {
        const est = estadoDeModulo(e, m.id, { armario, datosGlobales });
        return {
          ...m,
          estado: est,
          /* Apartado 5 — *"pero **no llenar la pantalla de indicadores**"*: solo se
             marca el que está sin configurar. El que ya lo está no necesita nada. */
          insignia: est === 'sin_configurar' ? estadoModulo(est) : null,
          // ⚠️ F31 — su tamaño y sus líneas, las que él haya elegido.
          tamano: tamanoDe(e, m.id),
          lineas: contenidoDePlaquita(e, m.id, { armario, datosGlobales }),
          /* ⚠️ Y si el módulo **declara** líneas. Sin esto, la pantalla no puede
             distinguir *"las he apagado todas"* de *"este módulo todavía no
             tiene ninguna", y enseñaría el resumen de la F30 en el primer caso:
             justo lo que él acaba de decir que no quiere ver. */
          tieneLineas: lineasDisponibles(m.id).length > 0,
        };
      }),
      posicion: Math.min(...cat.modulos.filter((m) => !m.oculto).map((m) => posicion(m.id)), Infinity),
    }))
    // ⚠️ Y una sección cuyos módulos están TODOS ocultos tampoco se pinta.
    .filter((cat) => cat.modulos.length > 0)
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

/* ⚠️ **EH F31, apartado 11** — *"guardar individualmente: orden, visibilidad,
   tamaño, contenido, accesos rápidos"*. El orden y la visibilidad ya son de la
   Fase 2 (`orden` y `activo` de cada módulo). Los otros tres viven aquí.

   ⚠️ Y **apartado 12**: *"cambiar la plaquita de Skincare **solo cambia su
   representación**… no modifica la configuración interna de Skincare"*. Por eso
   `tamanos` y `contenido` van en ESTE almacén, indexados por id de módulo, y
   nunca dentro de la `config` de cada módulo. Hay una prueba de que tocar la
   plaquita de Skincare deja su `config` intacta. */
export const DEFAULT_PANTALLA = { accesos: [], verAccesos: true, tamanos: {}, contenido: {} };

export function normalizarPantalla(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const tamanos = {};
  const guardadosT = g.tamanos && typeof g.tamanos === 'object' ? g.tamanos : {};
  Object.keys(guardadosT).forEach((id) => {
    /* ⚠️ Un módulo que ya no existe, o un tamaño inventado, **no se guarda**: se
       queda sin entrada y cae en "mediana", que es el defecto. */
    if (IDS_EH.includes(id) && tamanoPlaquita(guardadosT[id])) tamanos[id] = guardadosT[id];
  });
  const contenido = {};
  const guardadosC = g.contenido && typeof g.contenido === 'object' ? g.contenido : {};
  Object.keys(guardadosC).forEach((id) => {
    if (!IDS_EH.includes(id) || !Array.isArray(guardadosC[id])) return;
    const suyas = lineasDisponibles(id).map((l) => l.id);
    /* ⚠️ La entrada existe aunque quede vacía: "no quiero ninguna línea" y
       "todavía no lo he tocado" son dos cosas distintas (lección de la F25). */
    contenido[id] = guardadosC[id].filter((l) => suyas.includes(l));
  });
  return {
    /* ⚠️ Solo los que existen: uno guardado de una versión anterior del catálogo
       no revive un botón que ya no lleva a ningún sitio. */
    accesos: (Array.isArray(g.accesos) ? g.accesos : []).filter((id) => !!accesoRapido(id)),
    verAccesos: typeof g.verAccesos === 'boolean' ? g.verAccesos : true,
    tamanos,
    contenido,
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
   5 · EH F31 — PERSONALIZACIÓN PROFUNDA DE LAS PLAQUITAS
   ===========================================================================
   *"La aplicación se adapta al usuario, no el usuario a la aplicación."* Y su
   regla: *"si el usuario no quiere algo, lo puede quitar. Y si después lo
   quiere, lo puede volver a activar. **Sin perder sus datos**."*

   ⚠️ **Casi todo lo que el enunciado pide YA EXISTE**, y esta fase no lo repite:
     · apartado 1 (⋮ Personalizar) y 2 (mover / ocultar / configurar) → Fase 2
     · apartado 3 (arrastrar a una posición) → `moverA()`, escrita para esto
     · apartado 6 (accesos rápidos) → `ACCESOS_DISPONIBLES` de la Fase 30
     · apartado 9 (+ Añadir apartado, con los ocultos) → `paraAnadir()`
     · apartado 16 (confirmar antes de quitar) → `avisoDesactivar()`
     · apartado 13 (eliminados) → la papelera global de ME F3
   Lo nuevo son cuatro cosas: **tamaño**, **contenido**, **el límite de accesos**
   y los dos botones de abajo (restablecer y personalizar automáticamente). */

/* ── 5.1 · TAMAÑO (apartado 4) ────────────────────────────────────────────
   *"Permitir determinados tamaños predefinidos: Pequeña · Mediana · Grande.
   **No permitir tamaños completamente libres que puedan romper el diseño.**"*

   ⚠️ Por eso son tres, con sus columnas escritas: la pantalla no recibe un
   número, recibe uno de estos tres. */

export const TAMANOS_PLAQUITA = [
  { id: 'pequena', nombre: 'Pequeña', icono: '▫️', columnas: 1, conLineas: false },
  { id: 'mediana', nombre: 'Mediana', icono: '◻️', columnas: 1, conLineas: true },
  { id: 'grande', nombre: 'Grande', icono: '⬜', columnas: 2, conLineas: true },
];

export const TAMANO_POR_DEFECTO = 'mediana';

export const tamanoPlaquita = (id) => TAMANOS_PLAQUITA.find((t) => t.id === id) || null;

/** El tamaño de una plaquita. ⚠️ Lo que no esté guardado es **mediana**. */
export function tamanoDe(estado, moduloId) {
  const guardado = datosPantalla(estado).tamanos[moduloId];
  return tamanoPlaquita(guardado) || tamanoPlaquita(TAMANO_POR_DEFECTO);
}

/** ⚠️ Un tamaño que no está en la lista **no se escribe**: no se rompe el diseño. */
export function cambiarTamano(estado, moduloId, tamanoId) {
  if (!IDS_EH.includes(moduloId) || !tamanoPlaquita(tamanoId)) return normalizarEstiloHombre(estado);
  const d = datosPantalla(estado);
  const tamanos = { ...d.tamanos };
  // Poner el defecto es quitar la excepción, no guardar una copia de la norma.
  if (tamanoId === TAMANO_POR_DEFECTO) delete tamanos[moduloId];
  else tamanos[moduloId] = tamanoId;
  return escribir(estado, { ...d, tamanos });
}

/* ── 5.2 · CONTENIDO (apartado 5) ─────────────────────────────────────────
   *"Dentro de cada plaquita: Configurar contenido. El usuario puede decidir qué
   información aparece. Ejemplo: Skincare ☑️ Rutina actual ☑️ Próximo
   recordatorio ☐ Productos ☐ Estadísticas"*

   ⚠️ **Una línea por módulo**, igual que `FUENTES_DE_ESTADO` en la Fase 29 y
   `MODULOS_EH` en la Fase 1: cada módulo declara qué puede enseñar, y **cada
   línea sale de su propio `resumen…()`**. Ni un dato nuevo, ni una copia
   (apartado 15 de la Fase 30).

   ⚠️ Y **la principal viene puesta; las extras, apagadas**. Eso es lo que
   concilia esta fase con el *"no mostrar automáticamente estadísticas,
   historiales, recomendaciones, productos ni rutinas completas"* de la Fase 30:
   automáticamente no, pero **él puede**.

   ⚠️ Un módulo que todavía no tiene pantalla **no aparece aquí**, y la de
   personalizar lo dice, en vez de enseñar casillas que no hacen nada (regla 8). */

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

export const LINEAS_DE_PLAQUITA = {
  estilo: [
    {
      id: 'prendas',
      nombre: 'Prendas y outfits',
      principal: true,
      texto: (e, { armario, datosGlobales }) => {
        const r = resumenEstiloArmario(e, armario, datosGlobales);
        if (!r || r.vacio) return 'Todavía sin prendas';
        return plural(r.total, 'prenda', 'prendas')
          + (r.outfits > 0 ? ` · ${plural(r.outfits, 'outfit', 'outfits')}` : '');
      },
    },
    {
      id: 'tallas',
      nombre: 'Tallas',
      texto: (e, { armario, datosGlobales }) => {
        const r = resumenEstiloArmario(e, armario, datosGlobales);
        if (!r || !r.tallasTotal) return null;
        return `${r.tallasConocidas} de ${r.tallasTotal} tallas`;
      },
    },
  ],
  pelo: [
    {
      id: 'rutina',
      nombre: 'Rutina actual',
      principal: true,
      texto: (e, { datosGlobales }) => {
        const r = resumenPelo(e);
        if (r.rutinas > 0) return plural(r.rutinas, 'rutina', 'rutinas');
        const p = progresoPelo(e, datosGlobales);
        return p.sinEmpezar ? 'Configura tu perfil' : `${p.contestadas} de ${p.total} contestadas`;
      },
    },
    {
      id: 'recordatorio',
      nombre: 'Hoy',
      // ⚠️ Sin nada hoy, `null`: la línea no se pinta en vez de decir "0 de 0".
      texto: (e) => {
        const r = resumenPelo(e);
        return r.hoy > 0 ? `Hoy ${r.hechasHoy}/${r.hoy}` : null;
      },
    },
    {
      id: 'productos',
      nombre: 'Productos',
      texto: (e) => {
        const r = resumenPelo(e);
        return r.productos > 0 ? plural(r.productos, 'producto', 'productos') : null;
      },
    },
  ],
  /* ⚠️ Las cuatro del ejemplo del apartado 5, con sus nombres. */
  skincare: [
    {
      id: 'rutina',
      nombre: 'Rutina actual',
      principal: true,
      texto: (e, { datosGlobales }) => {
        const r = resumenRutinasPiel(e);
        if (r.rutinas > 0) return plural(r.rutinas, 'rutina', 'rutinas');
        const p = resumenPiel(e, datosGlobales);
        if (p.estado === 'sin_configurar') return 'Configura tu perfil';
        if (p.estado === 'ahora_no') return 'Cuando quieras';
        return `${p.contestadas} de ${p.total} contestadas`;
      },
    },
    {
      id: 'recordatorio',
      nombre: 'Próximo recordatorio',
      texto: (e) => {
        const r = resumenRutinasPiel(e);
        return r.hoy > 0 ? `Hoy ${r.hechasHoy}/${r.hoy}` : null;
      },
    },
    {
      id: 'productos',
      nombre: 'Productos',
      texto: (e, { datosGlobales }) => {
        const r = resumenProductosPiel(e, datosGlobales);
        return r.productos > 0 ? plural(r.productos, 'producto', 'productos') : null;
      },
    },
    {
      id: 'estadisticas',
      nombre: 'Estadísticas',
      texto: (e) => {
        const r = resumenRutinasPiel(e);
        // ⚠️ Un día sin registrar NO EXISTE (F15): sin registros, no hay línea.
        return r.registros > 0 ? plural(r.registros, 'registro', 'registros') : null;
      },
    },
  ],
  barba: [
    {
      id: 'perfil',
      nombre: 'Estado',
      principal: true,
      texto: (e, { datosGlobales }) => {
        const r = resumenBarba(e, datosGlobales);
        if (r.estado === 'sin_configurar') return 'Si quieres, configúralo';
        if (r.estado === 'ahora_no') return 'Cuando quieras';
        if (r.estado === 'eligiendo') return 'Personalízalo';
        return `${r.contestadas} de ${r.total} contestadas`;
      },
    },
    {
      id: 'nivel',
      nombre: 'Nivel',
      texto: (e, { datosGlobales }) => resumenBarba(e, datosGlobales).nivel || null,
    },
    {
      id: 'productos',
      nombre: 'Productos',
      texto: (e, { datosGlobales }) => {
        const r = resumenBarba(e, datosGlobales);
        return r.productos > 0 ? plural(r.productos, 'producto', 'productos') : null;
      },
    },
  ],
  /* ⚠️ **EH F18** — los dos, con la misma forma: cuántas partes tiene puestas.
     Sale de `lineaCH()`, que es del módulo. */
  higiene: [
    {
      id: 'partes',
      nombre: 'Qué utilizas',
      principal: true,
      texto: (e) => lineaCH(e, MODULO_HIGIENE) || 'Si quieres, configúralo',
    },
  ],
  cuerpo: [
    {
      id: 'partes',
      nombre: 'Qué utilizas',
      principal: true,
      texto: (e) => lineaCH(e, MODULO_CUERPO) || 'Si quieres, configúralo',
    },
  ],
  sonrisa: [
    {
      id: 'rutina',
      nombre: 'Rutina actual',
      principal: true,
      texto: (e) => {
        const r = resumenSonrisa(e);
        if (r.estado === 'sin_configurar') return 'Si quieres, configúralo';
        if (r.estado === 'ahora_no') return 'Cuando quieras';
        if (r.rutinas === 0) return 'Crea tu rutina';
        return plural(r.rutinas, 'rutina', 'rutinas')
          + (r.hoy > 0 ? ` · ${r.hechasHoy}/${r.hoy} hoy` : '');
      },
    },
    {
      id: 'revision',
      nombre: 'Próxima revisión',
      // ⚠️ Sin fecha guardada, `null`: no se inventa ninguna (F23).
      texto: (e) => (resumenSonrisa(e).proximaRevision ? `Revisión ${resumenSonrisa(e).proximaRevision}` : null),
    },
    {
      id: 'productos',
      nombre: 'Productos',
      texto: (e) => {
        const r = resumenSonrisa(e);
        return r.productos > 0 ? plural(r.productos, 'producto', 'productos') : null;
      },
    },
  ],
  perfumes: [
    {
      id: 'coleccion',
      nombre: 'Mi colección',
      principal: true,
      texto: (e, { datosGlobales }) => {
        const r = resumenPerfumes(e, datosGlobales);
        if (r.estado === 'sin_configurar') return 'Si quieres, configúralo';
        if (r.estado === 'ahora_no') return 'Cuando quieras';
        if (r.coleccion === 0) return 'Añade los tuyos';
        return plural(r.coleccion, 'perfume', 'perfumes');
      },
    },
    {
      id: 'actual',
      nombre: 'El que llevas ahora',
      // ⚠️ `null` si no ha dicho cuál usa: no se elige uno por él (F24).
      texto: (e, { datosGlobales }) => {
        const a = resumenPerfumes(e, datosGlobales).actual;
        return a ? `Ahora ${a}` : null;
      },
    },
    {
      id: 'favoritos',
      nombre: 'Favoritos',
      texto: (e, { datosGlobales }) => {
        const r = resumenPerfumes(e, datosGlobales);
        return r.favoritos > 0 ? plural(r.favoritos, 'favorito', 'favoritos') : null;
      },
    },
  ],
  accesorios: [
    {
      id: 'cuantos',
      nombre: 'Mis accesorios',
      principal: true,
      texto: (e, { armario }) => {
        const r = resumenAccesorios(e, armario || { prendas: [], outfits: [], usos: [] });
        if (r.estado === 'sin_configurar') return 'Si quieres, configúralo';
        if (r.estado === 'ahora_no') return 'Cuando quieras';
        if (r.accesorios === 0) return 'Añade los tuyos';
        return plural(r.accesorios, 'accesorio', 'accesorios');
      },
    },
    {
      id: 'enUso',
      nombre: 'Los que llevas puestos',
      texto: (e, { armario }) => {
        const r = resumenAccesorios(e, armario || { prendas: [], outfits: [], usos: [] });
        return r.enUso > 0 ? `${r.enUso} puestos` : null;
      },
    },
    {
      id: 'favoritos',
      nombre: 'Favoritos',
      texto: (e, { armario }) => {
        const r = resumenAccesorios(e, armario || { prendas: [], outfits: [], usos: [] });
        return r.favoritos > 0 ? plural(r.favoritos, 'favorito', 'favoritos') : null;
      },
    },
  ],
  gustos: [
    {
      id: 'cuantos',
      nombre: 'Lo que has apuntado',
      principal: true,
      texto: (e, { datosGlobales }) => {
        const r = resumenGustos(e, datosGlobales);
        if (r.estado === 'sin_configurar') return 'Si quieres, configúralo';
        if (r.estado === 'ahora_no') return 'Cuando quieras';
        if (r.total === 0) {
          return r.sueltos > 0 ? `${r.sueltos} por completar` : 'Cuéntanos qué te gusta';
        }
        return plural(r.total, 'cosa', 'cosas');
      },
    },
    {
      id: 'hacer',
      nombre: 'Quiero hacer',
      texto: (e, { datosGlobales }) => {
        const r = resumenGustos(e, datosGlobales);
        return r.hacer > 0 ? `${r.hacer} por hacer` : null;
      },
    },
    {
      id: 'favoritos',
      nombre: 'Favoritos',
      texto: (e, { datosGlobales }) => {
        const r = resumenGustos(e, datosGlobales);
        return r.favoritos > 0 ? plural(r.favoritos, 'favorito', 'favoritos') : null;
      },
    },
  ],
};

/** ⚠️ Un módulo sin pantalla propia todavía **no tiene líneas**, y se dice. */
export const lineasDisponibles = (moduloId) =>
  (LINEAS_DE_PLAQUITA[moduloId] || []).map(({ id, nombre, principal = false }) => ({ id, nombre, principal }));

export const SIN_LINEAS = 'Este apartado todavía no tiene nada que enseñar aquí.';

/** Lo que viene puesto de fábrica: **solo la principal**. */
export const lineasPorDefecto = (moduloId) =>
  lineasDisponibles(moduloId).filter((l) => l.principal).map((l) => l.id);

/**
 * Qué líneas tiene encendidas. ⚠️ **Sin entrada guardada, el defecto**; con una
 * entrada vacía, ninguna — que es una decisión suya, no un hueco.
 */
export function lineasActivas(estado, moduloId) {
  const d = datosPantalla(estado);
  return moduloId in d.contenido ? d.contenido[moduloId] : lineasPorDefecto(moduloId);
}

export function alternarLinea(estado, moduloId, lineaId) {
  const suyas = lineasDisponibles(moduloId).map((l) => l.id);
  if (!suyas.includes(lineaId)) return normalizarEstiloHombre(estado);
  const activas = lineasActivas(estado, moduloId);
  const d = datosPantalla(estado);
  const nuevas = activas.includes(lineaId)
    ? activas.filter((x) => x !== lineaId)
    // ⚠️ Se guardan en el orden del catálogo, no en el de los toques.
    : suyas.filter((x) => activas.includes(x) || x === lineaId);
  return escribir(estado, { ...d, contenido: { ...d.contenido, [moduloId]: nuevas } });
}

/**
 * Lo que se pinta dentro de la plaquita. ⚠️ Una línea encendida cuyo texto sale
 * `null` **no se pinta**: es la diferencia entre "no hay nada que decir" y "0".
 */
export function contenidoDePlaquita(estado, moduloId, { armario = null, datosGlobales = {} } = {}) {
  const e = normalizarEstiloHombre(estado);
  const activas = lineasActivas(e, moduloId);
  const tam = tamanoDe(e, moduloId);
  // Apartado 4 — la pequeña es solo icono y nombre.
  if (!tam.conLineas) return [];
  return (LINEAS_DE_PLAQUITA[moduloId] || [])
    .filter((l) => activas.includes(l.id))
    .map((l) => {
      let texto = null;
      try { texto = l.texto(e, { armario, datosGlobales }); } catch { texto = null; }
      return { id: l.id, nombre: l.nombre, texto: texto || null };
    })
    .filter((l) => !!l.texto);
}

/* ── 5.3 · LÍMITE DE ACCESOS RÁPIDOS (apartado 7) ─────────────────────────
   *"No permitir crear 50 accesos rápidos. Si hay demasiados: **Mostrar todos**.
   Así la pantalla sigue limpia."*

   ⚠️ El límite es de lo que **se pinta**, que es el remedio que el propio
   enunciado da. Un tope de cuántos puede elegir por encima de los que hay en el
   catálogo sería un control que no salta nunca (regla 8). */

export const MAX_ACCESOS_VISIBLES = 4;

export function accesosVisibles(estado, { todos = false } = {}) {
  const lista = accesosActivos(estado);
  // ⚠️ Apagada y vacía son dos cosas: si la zona está apagada, `null`.
  if (lista === null) return null;
  if (todos || lista.length <= MAX_ACCESOS_VISIBLES) {
    return { lista, ocultos: 0, hayMas: false, total: lista.length };
  }
  return {
    lista: lista.slice(0, MAX_ACCESOS_VISIBLES),
    ocultos: lista.length - MAX_ACCESOS_VISIBLES,
    hayMas: true,
    total: lista.length,
  };
}

/* ── 5.4 · RESTABLECER DISEÑO (apartado 10) ───────────────────────────────
   *"🔄 Restablecer diseño. Pregunta: ¿Quieres recuperar la distribución
   predeterminada? Opciones: Cancelar · Restablecer. **Esto no elimina datos.**"*

   ⚠️ Décimo `aplicarPlan` del proyecto: **sin `confirmado` no escribe**.
   ⚠️ Y **no reactiva lo que él apagó**: apagar Barba fue una decisión suya, no
   "distribución". Volver a encenderlo sería decidir por él, y la pantalla lo
   dice con una frase junto al "esto no elimina datos" del enunciado. */

export const TEXTOS_RESTABLECER = {
  titulo: '🔄 Restablecer diseño',
  pregunta: '¿Quieres recuperar la distribución predeterminada?',
  noBorra: 'Esto no elimina datos.',
  noReactiva: 'Los apartados que quitaste siguen quitados: eso lo decidiste tú.',
  confirmar: 'Restablecer',
  cancelar: 'Cancelar',
};

export function restablecerDiseno(estado, { confirmado = false } = {}) {
  const e = normalizarEstiloHombre(estado);
  if (!confirmado) return { estado: e, aplicado: false, aviso: TEXTOS_RESTABLECER };
  const activos = modulosActivos(e).map((m) => m.id);
  // El orden de fábrica es el del catálogo, contado solo entre los que él tiene.
  const orden = MODULOS_EH.map((m) => m.id).filter((id) => activos.includes(id));
  const conOrden = reordenar(e, orden);
  // Tamaños, contenido y accesos vuelven a lo de fábrica. `activo` no se toca.
  return { estado: escribir(conOrden, { ...DEFAULT_PANTALLA }), aplicado: true, aviso: null };
}

/* ── 5.5 · PERSONALIZAR AUTOMÁTICAMENTE (apartado 17) ─────────────────────
   *"✨ Personalizar automáticamente. Esto **puede** organizar las plaquitas
   según el uso reciente. Pero: **solo si el usuario lo solicita**."*

   ⚠️ **No existe ningún registro de uso**, y crearlo obligaría a escribir en
   cada navegación. Así que no se finge: se ordena por lo que sí se puede saber
   sin inventar nada —lo configurado primero, lo vacío al final— **y la pantalla
   dice ese criterio con estas palabras**. Undécimo `aplicarPlan`. */

export const CRITERIO_AUTOMATICO =
  'Primero los apartados que ya tienes configurados, después los que están vacíos '
  + 'y al final los que todavía no tienen contenido en la aplicación. '
  + 'No se mira cuándo abriste cada uno: eso no se guarda en ningún sitio.';

export const TEXTOS_AUTOMATICO = {
  titulo: '✨ Personalizar automáticamente',
  criterio: CRITERIO_AUTOMATICO,
  confirmar: 'Ordenar así',
  cancelar: 'Cancelar',
  sinCambios: 'Ya están en ese orden.',
};

/** El grupo de cada módulo: 0 configurado · 1 vacío · 2 todavía sin pantalla. */
function grupoAutomatico(estado, id, ctx) {
  if (!LINEAS_DE_PLAQUITA[id]) return 2;
  return estadoDeModulo(estado, id, ctx) === 'configurado' ? 0 : 1;
}

export function personalizarAutomaticamente(
  estado, { armario = null, datosGlobales = {}, confirmado = false } = {},
) {
  const e = normalizarEstiloHombre(estado);
  const ctx = { armario, datosGlobales };
  const actuales = modulosActivos(e).map((m) => m.id);
  const propuesta = [...actuales].sort((a, b) => {
    const g = grupoAutomatico(e, a, ctx) - grupoAutomatico(e, b, ctx);
    // ⚠️ Empate: se queda como estaba. Nunca se baraja lo que él ya ordenó.
    return g !== 0 ? g : actuales.indexOf(a) - actuales.indexOf(b);
  });
  const cambia = JSON.stringify(propuesta) !== JSON.stringify(actuales);
  if (!confirmado) {
    return {
      estado: e,
      aplicado: false,
      propuesta,
      cambia,
      aviso: { ...TEXTOS_AUTOMATICO, cambia },
    };
  }
  return { estado: reordenar(e, propuesta), aplicado: true, propuesta, cambia, aviso: null };
}

/* ── 5.6 · MOVER A UNA POSICIÓN (apartados 3 y 15) ────────────────────────
   *"Mantener pulsada una plaquita ↕️ y moverla. La nueva posición se guarda
   automáticamente."*

   ⚠️ **La función ya existe**: `moverA(estado, id, indice)` de la Fase 2, cuyo
   comentario dice literalmente *"el que usará el drag & drop"*. Aquí solo se
   declaran los textos, para que la pantalla no invente los suyos. Las flechas se
   mantienen: en un iPhone son lo que funciona siempre, y esto se suma. */

export const TEXTOS_MOVER = {
  mover: '⋮⋮ Mover',
  eligiendo: 'Elige dónde ponerlo.',
  aqui: 'Aquí',
  cancelar: 'Dejarlo donde estaba',
};

/* ===========================================================================
   6 · RESUMEN, AUDITORÍA Y PANEL
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
    // F31 — cuántas plaquitas ha tocado él, y cuántas líneas se pintan.
    conTamanoPropio: Object.keys(datosPantalla(estado).tamanos).length,
    conContenidoPropio: Object.keys(datosPantalla(estado).contenido).length,
    lineas: todos.reduce((s, m) => s + (m.lineas?.length || 0), 0),
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
    /* ⚠️ **F31** — lo que guarda esta pantalla, por su nombre en vez de por una
       cuenta: una cifra exacta es una bomba de relojería en cuanto una fase
       añade lo suyo con todo el derecho (pasó tres veces en este bloque). */
    datosGuardados: Object.keys(DEFAULT_PANTALLA),
    /* ⚠️ F31, apartado 12 — cuántas de esas cosas se escriben dentro de la
       `config` de OTRO módulo. Cero: la presentación es de la pantalla. */
    escrituraEnOtrosModulos: 0,
    /* ⚠️ F31 — cuántas líneas extra vienen encendidas de fábrica. Cero: es lo
       que concilia el apartado 5 con el "menos es más" del apartado 8. */
    lineasExtraPorDefecto: Object.keys(LINEAS_DE_PLAQUITA)
      .reduce((s, id) => s + lineasPorDefecto(id).length - 1, 0),
    // F31, apartado 17 — cuántos registros de uso se guardan. Ninguno.
    registrosDeUso: 0,
    grupos: CATEGORIAS_EH.length,
    accesos: ACCESOS_DISPONIBLES.length,
    tamanos: TAMANOS_PLAQUITA.length,
  };
}

export function textosDePantalla() {
  return [
    ...Object.values(CABECERA_EH),
    ...Object.values(TEXTOS_PANTALLA),
    ...ACCESOS_DISPONIBLES.map((a) => a.nombre),
    // F31 — los suyos, para que el barrido los mire también.
    ...Object.values(TEXTOS_RESTABLECER),
    ...Object.values(TEXTOS_AUTOMATICO),
    ...Object.values(TEXTOS_MOVER),
    ...TAMANOS_PLAQUITA.map((t) => t.nombre),
    ...Object.values(LINEAS_DE_PLAQUITA).flatMap((ls) => ls.map((l) => l.nombre)),
    SIN_LINEAS,
  ].filter((t) => typeof t === 'string' && t.length > 0);
}

export function panelPantalla(estado, { armario = null, datosGlobales = {}, todosLosAccesos = false } = {}) {
  const secciones = seccionesDePantalla(estado, { armario, datosGlobales });
  return {
    cabecera: CABECERA_EH,
    secciones,
    accesos: accesosActivos(estado),
    // F31, apartado 7 — los que caben, y cuántos quedan detrás de "Mostrar todos".
    visibles: accesosVisibles(estado, { todos: todosLosAccesos }),
    accesosDisponibles: accesosDisponibles(estado),
    verAccesos: datosPantalla(estado).verAccesos,
    paraAnadir: paraAnadir(estado),
    inicial: secciones.length === 0 ? empiezaPorLoQueQuieras(estado) : null,
    resumen: resumenPantalla(estado, { armario, datosGlobales }),
  };
}

/**
 * F31 — lo que necesita la pantalla de "⋮ Personalizar": una fila por módulo
 * activo, con su tamaño, sus líneas y dónde está. ⚠️ El orden y el interruptor
 * siguen siendo los de la Fase 2: aquí solo se leen.
 */
export function panelPersonalizar(estado, { armario = null, datosGlobales = {} } = {}) {
  const e = normalizarEstiloHombre(estado);
  const activos = modulosActivos(e);
  return {
    modulos: activos.map((m, i) => {
      const disponibles = lineasDisponibles(m.id);
      const activas = lineasActivas(e, m.id);
      return {
        ...m,
        posicion: i,
        de: activos.length,
        tamano: tamanoDe(e, m.id),
        tamanos: TAMANOS_PLAQUITA,
        lineas: disponibles.map((l) => ({ ...l, puesta: activas.includes(l.id) })),
        // ⚠️ Regla 8: sin líneas se dice, no se enseñan casillas vacías.
        sinLineas: disponibles.length === 0 ? SIN_LINEAS : null,
        // Apartado 8 — ocultar no borra, y se dice con esas palabras.
        vista: contenidoDePlaquita(e, m.id, { armario, datosGlobales }),
      };
    }),
    textosMover: TEXTOS_MOVER,
    restablecer: TEXTOS_RESTABLECER,
    automatico: TEXTOS_AUTOMATICO,
    // Apartado 7 — se dice cuántos accesos caben antes de "Mostrar todos".
    maxAccesos: MAX_ACCESOS_VISIBLES,
  };
}

export { CATEGORIAS_EH };
