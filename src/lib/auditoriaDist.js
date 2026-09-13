/* ===========================================================================
   DIST F2 — LA AUDITORÍA DE LA REORGANIZACIÓN
   ===========================================================================

   Josué, después de DIST F1: *"quiero que hagas una auditoría completa de lo
   realizado […] El objetivo es detectar y corregir errores, enlaces rotos,
   duplicados o funcionalidades que hayan quedado mal conectadas."* Y con dos
   límites: *"No cambies la arquitectura definida en la Fase 1. No añadas nuevas
   funcionalidades."*

   🚨 **ASÍ QUE ESTE ARCHIVO NO CONSTRUYE NADA: COMPARA.** Y compara contra algo
   que hasta ahora no estaba escrito en ninguna parte — **el árbol que él pasó,
   literal**. `comprobar-navegacion.mjs` ya vigila que la navegación sea
   coherente *consigo misma* (que nada quede huérfano), pero eso seguiría en
   verde si mañana alguien moviera Armario a Vida: sería coherente y **no sería
   lo que Josué pidió**. Aquí está el encargo, y la aplicación se mide contra él.

   🚨 **Y SE EJECUTA, NO SE DESCRIBE** (EH F42, E3 F46): cada casilla se calcula
   sobre los catálogos de verdad, y las pruebas incluyen casos que la ponen
   **roja**. Una auditoría que no puede fallar no sirve, y una que parece
   vigilar algo es peor, porque nadie vuelve a mirarla.
   =========================================================================== */

import { AGRUPADORES, APPS_DE_AGRUPADORES, agrupadorDeApp } from './agrupadores.js';
import { IDS_MINI_APPS_PR } from './productividad.js';
import { IDS_APPS_NUMEROS } from './numeros.js';

/* ---------------------------------------------------------------------------
   EL ÁRBOL, COMO LO ESCRIBIÓ JOSUÉ.

   ⚠️ Copiado de su encargo, incluida la quinta pestaña. Si una fase futura
   quiere mover algo de sitio, **esto es lo que hay que cambiar primero**: así
   queda constancia de que fue una decisión y no un descuido.
   --------------------------------------------------------------------------- */
export const ARBOL_DIST = {
  pestanas: ['Inicio', 'Bienestar', 'Vida', 'Gestión', 'Ajustes'],
  areas: [
    { id: 'area-salud', nombre: 'Bienestar', modulos: ['salud', 'sueno', 'nutricion', 'entreno', 'estilo-hombre'] },
    { id: 'area-vida', nombre: 'Vida', modulos: ['estudios', 'productividad', 'mente', 'biblioteca', 'diario'] },
    { id: 'area-gestion', nombre: 'Gestión', modulos: ['organizacion', 'economia', 'negocio', 'armario', 'numeros'] },
  ],
  /* Lo que va DENTRO de cada agrupador, también literal. */
  dentroDe: {
    mente: ['fe', 'relacion', 'bienestar'],
    organizacion: ['tareas', 'calendario', 'horario'],
    numeros: ['estadisticas', 'predicciones', 'logros'],
    productividad: ['rachas'],
  },
  /* Los rótulos que él pidió cambiar, con el nombre viejo al lado para que se
     vea que es un renombrado y no un módulo nuevo. */
  renombrados: [
    { id: 'salud', antes: 'Mi salud', ahora: 'Salud física' },
    { id: 'estilo-hombre', antes: 'Estilo de hombre', ahora: 'Imagen personal' },
    { id: 'numeros', antes: 'Números', ahora: 'Progreso' },
  ],
  /* Y la categoría que desaparece. */
  eliminada: { id: 'area-mas', nombre: 'Además' },
};

/* ---------------------------------------------------------------------------
   1 · ¿La navegación es la que él pidió?
   --------------------------------------------------------------------------- */
export function auditarArbol({ moreNav = [], areasNav = [] } = {}) {
  const ids = moreNav.map((m) => m.id);
  const problemas = [];

  for (const esperada of ARBOL_DIST.areas) {
    const real = areasNav.find((a) => a.id === esperada.id);
    if (!real) {
      problemas.push({ que: `Falta el área ${esperada.nombre}`, donde: esperada.id });
      continue;
    }
    const suyos = real.modulos || [];
    for (const m of esperada.modulos) {
      if (!suyos.includes(m)) problemas.push({ que: `${esperada.nombre} debería contener «${m}»`, donde: esperada.id });
    }
    for (const m of suyos) {
      if (!esperada.modulos.includes(m)) problemas.push({ que: `${esperada.nombre} contiene «${m}», que no está en el encargo`, donde: esperada.id });
    }
  }

  // El área que Josué eliminó no puede haber vuelto.
  if (areasNav.some((a) => a.id === ARBOL_DIST.eliminada.id)) {
    problemas.push({ que: `El área «${ARBOL_DIST.eliminada.nombre}» sigue existiendo`, donde: ARBOL_DIST.eliminada.id });
  }

  /* 🚨 Ajustes es la quinta pestaña: tiene que existir como módulo y **NO**
     estar dentro de ningún área, o se vería dos veces. */
  if (!ids.includes('ajustes')) problemas.push({ que: 'Ajustes no existe como módulo', donde: 'ajustes' });
  if (areasNav.some((a) => (a.modulos || []).includes('ajustes'))) {
    problemas.push({ que: 'Ajustes está dentro de un área además de ser pestaña: se vería dos veces', donde: 'ajustes' });
  }

  return { ok: problemas.length === 0, problemas };
}

/* ---------------------------------------------------------------------------
   2 · ¿Lo reubicado está donde él dijo, y en UN solo sitio?

   *"No deben existir copias duplicadas en otras secciones."*
   --------------------------------------------------------------------------- */
export function auditarReubicados({ moreNav = [], areasNav = [] } = {}) {
  const ids = moreNav.map((m) => m.id);
  const problemas = [];

  for (const [contenedor, hijos] of Object.entries(ARBOL_DIST.dentroDe)) {
    for (const hijo of hijos) {
      /* Dónde está de verdad: una sub-app de agrupador, una mini-app de
         Productividad o una sub-app de Progreso. */
      const real = agrupadorDeApp(hijo)
        || (IDS_MINI_APPS_PR.includes(hijo) ? 'productividad' : null)
        || (IDS_APPS_NUMEROS.includes(hijo) ? 'numeros' : null);
      if (real !== contenedor) {
        problemas.push({ que: `«${hijo}» debería estar dentro de «${contenedor}»`, esta: real || 'en ninguna parte' });
      }
      // Y no puede estar ADEMÁS suelto en la navegación.
      if (ids.includes(hijo)) {
        problemas.push({ que: `«${hijo}» está dentro de «${contenedor}» Y suelto en la navegación`, esta: 'duplicado' });
      }
      if (areasNav.some((a) => (a.modulos || []).includes(hijo))) {
        problemas.push({ que: `«${hijo}» está dentro de «${contenedor}» Y en un área`, esta: 'duplicado' });
      }
    }
  }

  return { ok: problemas.length === 0, problemas };
}

/* ---------------------------------------------------------------------------
   3 · ¿Ninguna ruta anidada es un callejón sin salida?

   Josué: *"No conviertas las nuevas agrupaciones en callejones sin salida"*, y
   la jerarquía que pide es **sección → módulo → submódulo**.

   🚨 Lo que se comprueba es que **cada hijo sepa quién es su padre**: de ahí
   sale la barra de volver y el resaltado de la pestaña. Un hijo sin padre se
   abre sin salida — que es literalmente lo que él prohíbe.
   --------------------------------------------------------------------------- */
export function auditarVueltaAtras({ areasNav = [] } = {}) {
  const problemas = [];
  const areaDe = (id) => areasNav.find((a) => (a.modulos || []).includes(id));

  for (const [contenedor, hijos] of Object.entries(ARBOL_DIST.dentroDe)) {
    if (!areaDe(contenedor)) {
      problemas.push({ que: `«${contenedor}» no está en ningún área: sus hijos no sabrían a dónde volver` });
      continue;
    }
    for (const hijo of hijos) {
      const padre = agrupadorDeApp(hijo)
        || (IDS_MINI_APPS_PR.includes(hijo) ? 'productividad' : null)
        || (IDS_APPS_NUMEROS.includes(hijo) ? 'numeros' : null);
      if (!padre) problemas.push({ que: `«${hijo}» no tiene padre declarado: se abriría sin barra de volver` });
      else if (!areaDe(padre)) problemas.push({ que: `El padre de «${hijo}» («${padre}») no está en ningún área` });
    }
  }

  return { ok: problemas.length === 0, problemas };
}

/* ---------------------------------------------------------------------------
   4 · ¿Se ha perdido algún dato por el camino?

   🚨 **La comprobación honesta no es «los datos están bien»** —eso no se puede
   saber desde aquí—, sino **que ni una clave de `app_data` haya cambiado de
   nombre**. Reorganizar la navegación no puede tocar ninguna, y si alguna se
   hubiera renombrado, lo guardado quedaría huérfano sin que fallara nada.
   --------------------------------------------------------------------------- */
export const CLAVES_QUE_NO_SE_TOCAN = [
  'salud', 'sueno', 'nutricion', 'calistenia', 'futbol',
  'estudios', 'negocio', 'productividad', 'objetivos', 'diario',
  'fe', 'biblioteca', 'relacion', 'bienestar', 'rachas',
  'economia', 'armario', 'horarioTop', 'calendario', 'estiloHombre',
];

export function auditarClaves(codigoApp = '') {
  const problemas = CLAVES_QUE_NO_SE_TOCAN
    .filter((clave) => !new RegExp(`['"\`]${clave}['"\`]`).test(codigoApp))
    .map((clave) => ({ que: `La clave «${clave}» ya no aparece en App.jsx: lo guardado quedaría huérfano` }));
  return { ok: problemas.length === 0, problemas };
}

/* ---------------------------------------------------------------------------
   5 · ¿Queda alguna referencia visible al nombre viejo?

   Josué: *"no debe quedar ninguna referencia visible a «Estilo de hombre» si
   forma parte del nombre de este módulo"*.

   ⚠️ **Los comentarios del código NO cuentan, y es a propósito** (NAV F2): ahí
   el nombre viejo se conserva para que quien lea *«Estilo de hombre»* en un
   comentario sepa de qué módulo se habla, igual que el proyecto conserva *JC
   Fitness*. Lo que no puede quedar es en **lo que Josué ve**.
   --------------------------------------------------------------------------- */
export const NOMBRES_VIEJOS = ['Estilo de hombre', 'Mi salud'];

export function auditarNombresViejos(textoEnPantalla = '') {
  const problemas = NOMBRES_VIEJOS
    .filter((n) => new RegExp(n, 'i').test(textoEnPantalla))
    .map((n) => ({ que: `Se lee «${n}» en pantalla, y es un nombre retirado` }));
  return { ok: problemas.length === 0, problemas };
}

/* ---------------------------------------------------------------------------
   6 · ¿Se repite algún icono entre conceptos distintos?

   Josué: *"Evita reutilizar el mismo icono para conceptos diferentes cuando
   exista una alternativa clara."*

   ⚠️ Recibe pares `{ id, icono }` de quien los tenga (la navegación los tiene
   como componentes, así que quien llama pasa su nombre). Repetir un icono es
   lo que hacía que Hábitos y Rachas parecieran el mismo apartado (NAV F4).
   --------------------------------------------------------------------------- */
export function auditarIconos(pares = []) {
  const porIcono = new Map();
  for (const { id, icono } of pares) {
    if (!icono) continue;
    porIcono.set(icono, [...(porIcono.get(icono) || []), id]);
  }
  const problemas = [...porIcono.entries()]
    .filter(([, quienes]) => quienes.length > 1)
    .map(([icono, quienes]) => ({ que: `El icono «${icono}» lo usan ${quienes.join(', ')}` }));
  return { ok: problemas.length === 0, problemas };
}

/* ---------------------------------------------------------------------------
   El informe, con todas las casillas CALCULADAS.
   --------------------------------------------------------------------------- */
export function informeDIST({ moreNav = [], areasNav = [], codigoApp = '', textoEnPantalla = '', iconos = [] } = {}) {
  const casillas = [
    { id: 'arbol', texto: 'La navegación es exactamente la que pidió Josué', ...auditarArbol({ moreNav, areasNav }) },
    { id: 'reubicados', texto: 'Lo reubicado está donde él dijo, y en un solo sitio', ...auditarReubicados({ moreNav, areasNav }) },
    { id: 'vuelta', texto: 'Ninguna ruta anidada es un callejón sin salida', ...auditarVueltaAtras({ areasNav }) },
    { id: 'claves', texto: 'Ni una clave de `app_data` ha cambiado de nombre', ...auditarClaves(codigoApp) },
    { id: 'nombres', texto: 'No queda ningún nombre retirado en pantalla', ...auditarNombresViejos(textoEnPantalla) },
    { id: 'iconos', texto: 'Ningún icono se repite entre conceptos distintos', ...auditarIconos(iconos) },
  ];
  return {
    casillas,
    ok: casillas.every((c) => c.ok),
    problemas: casillas.flatMap((c) => (c.problemas || []).map((p) => ({ ...p, casilla: c.id }))),
  };
}

/* ---------------------------------------------------------------------------
   ⏸ DONDE LO CONSTRUIDO NO COINCIDE CON EL ENUNCIADO, Y POR QUÉ.

   🚨 Esto es lo que de verdad ha encontrado la auditoría, y no se arregla por
   cuenta propia: **su encargo choca consigo mismo**, y él dio la regla para ese
   caso — *"Si algo de esta especificación entra en conflicto con la
   arquitectura actual, adapta la implementación **sin romper funcionalidades
   existentes**."* Se deja como está, se declara, y lo decide Josué.
   --------------------------------------------------------------------------- */
export const DESVIACIONES = [
  {
    que: 'Los hubs de Bienestar, Vida y Gestión siguen siendo una lista vertical de tarjetas anchas, no una cuadrícula de icono y nombre',
    pidio: 'Presentación tipo mini-app: icono, nombre debajo, cuadrícula limpia. Y «evitar listas verticales interminables de módulos».',
    porque: 'Cada tarjeta del hub lleva DOS líneas de resumen derivadas —«2 tareas pendientes», «1 clase hoy»— que existen desde la Fase N1 y se calculan en `resumenesHub.js`. '
      + 'Una cuadrícula compacta de icono y nombre no tiene sitio para ellas, así que cumplir el apartado al pie de la letra habría BORRADO una funcionalidad, '
      + 'que es lo que el mismo encargo prohíbe. Y con cinco módulos por área la lista no es «interminable»: son cinco filas.',
    donde: 'src/views/HubView.jsx',
    hecho: 'La cuadrícula tipo mini-app SÍ está, en las agrupadoras nuevas (Mente, Organización y Progreso), que no tienen líneas de resumen que perder.',
    decide: 'Josué: si prefiere la cuadrícula en los hubs, se hace y se pierden las dos líneas de cada módulo.',
  },
];

/* ---------------------------------------------------------------------------
   Lo que esta auditoría NO puede comprobar, declarado.

   Un informe que solo enumera lo verde miente por omisión (E3 F46).
   --------------------------------------------------------------------------- */
export const FUERA_DEL_ALCANCE = [
  {
    que: 'Que los datos de Josué sigan ahí de verdad',
    porque: 'Viven en su Supabase, que queda fuera de las comprobaciones (R1). Lo que sí se comprueba es que ninguna clave haya cambiado de nombre, que es lo que los dejaría huérfanos.',
    decide: 'Josué, abriéndola en su iPhone',
  },
  {
    que: 'Cómo se ve en un iPhone de verdad',
    porque: 'El recorrido mide anchos en Chromium a 375 px, que es el ancho, pero no es Safari ni es su letra del sistema.',
    decide: 'Josué, abriéndola en su iPhone',
  },
  {
    que: 'El botón atrás del móvil',
    porque: 'JosStyle navega con estado de React, no con rutas, así que el gesto de atrás sale de la aplicación. Está declarado desde la E3 F22 y sigue pendiente de decisión.',
    decide: 'Josué',
  },
];
