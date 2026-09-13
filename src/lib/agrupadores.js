/* ===========================================================================
   AGRUPADORES — Mente y Organización
   ===========================================================================

   Josué (DIST F1): *"Crear el módulo Mente. Dentro de Mente deben quedar
   agrupadas las funcionalidades actualmente relacionadas con Fe, Relación y
   Bienestar digital"*, y *"Crear este módulo [Organización] como agrupador de
   Tareas, Calendario y Horario"*. Y en la misma frase: *"No inventes nuevas
   funcionalidades; reutiliza las existentes y reorganízalas."*

   🚨 **ASÍ QUE ESTE ARCHIVO NO CONSTRUYE NI UNA PANTALLA.** Las seis existen
   —`FaithView`, `RelationView`, `WellbeingView`, `TareasTab`, `CalendarView`,
   `HorarioView`— y siguen siendo exactamente las mismas: lo único que cambia es
   que **se entra por un sitio en vez de por seis**. Es `numeros.js` (NAV F1)
   otra vez, y antes la E3 F23 con Productividad y la E3 F16 con la Biblioteca:
   *antes de rediseñar un apartado, mirar si sus piezas ya existen.*

   🚨 **Y NO GUARDA NI UN DATO.** No hay clave nueva en `app_data`, no hay
   normalizador y no hay nada que migrar. `fe`, `relacion`, `bienestar`,
   `productividad`, `calendario` y `horarioTop` siguen siendo las claves de
   siempre, con lo que Josué tenga dentro. **Un área es una lista de ids:
   reorganizarla es navegación, no datos** (E3 F23, NAV F1).

   ⚠️ **NO ES UNA CUARTA LISTA DE «QUÉ SE VE»** (D2-07). Estos catálogos dicen
   qué hay DENTRO de cada agrupadora; quién se ve en Inicio y en qué orden lo
   siguen diciendo `MORE_NAV`, `AREAS_NAV` y la personalización de la Fase 19.

   ⚠️ El icono va en `ICONOS_AGRUPADORES` (`src/components/iconosAgrupadores.jsx`),
   no aquí: uno es un catálogo de datos y el otro de componentes de React, el
   mismo reparto que `APPS_NUMEROS` / `ICONOS_NUMEROS` (NAV F1),
   `MINI_APPS` / `ICONOS_MINI_APP` (E3 F16) y `CATEGORIAS_ARMARIO` /
   `ICONOS_CATEGORIA` (E3 F3). Un icono que falte ahí sale como un hueco y **no
   falla en ninguna parte**.
   =========================================================================== */

/* ---------------------------------------------------------------------------
   MENTE — Vida → Mente

   Josué: *"La intención es que Mente sea un espacio de bienestar
   mental/personal dentro de Vida."*

   ⚠️ Los ids son **los de siempre** (`fe`, `relacion`, `bienestar`), y eso no es
   casualidad: son las claves de `app_data`, y además los leen la personalización
   de la Fase 19, los presets de `tokens.js`, `resumenesHub.js` y el catálogo de
   la papelera. Renombrarlos habría roto todo eso a la vez sin que fallara nada
   visible — **renombrar lo que se ve y renombrar lo que se guarda son dos cosas
   distintas** (E3 F30).
   --------------------------------------------------------------------------- */
export const APPS_MENTE = [
  {
    id: 'fe',
    nombre: 'Fe',
    desc: 'Oración, gratitud y servicio',
    vacio: 'Todavía no has registrado nada aquí',
  },
  {
    /* 🚨 **RELACIÓN ES LA ÚNICA PROTEGIDA, Y ESO NO ES UN DETALLE DE PANTALLA.**
       La regla 6 del proyecto exige `PinGate` sobre el módulo entero. Hasta esta
       fase el PIN lo ponía `App.jsx` mirando la PESTAÑA (`tab === 'relacion'`),
       así que meter Relación dentro de Mente **habría hecho desaparecer el PIN**
       —la pestaña pasa a ser `mente`— y su contenido se habría abierto solo.
       Por eso la protección viaja en el catálogo: quien pinta el panel está
       obligado a mirar este campo, y hay una comprobación que lo exige. */
    id: 'relacion',
    nombre: 'Relación',
    desc: 'Fechas, detalles y álbum',
    vacio: 'Privado: se abre con tu PIN',
    protegida: true,
  },
  {
    /* ⚠️ El módulo se llama `bienestar` en `app_data` desde que existe, y su
       pantalla se titula «Bienestar digital» desde la E3 F30 para no chocar con
       el área. Aquí dentro ya no hay choque posible —el área es Vida y la
       agrupadora es Mente—, pero el nombre se queda: es como Josué lo conoce. */
    id: 'bienestar',
    nombre: 'Bienestar digital',
    desc: 'Tiempo de pantalla y concentración',
    vacio: 'Registra tu tiempo de uso para verlo aquí',
  },
];

/* ---------------------------------------------------------------------------
   ORGANIZACIÓN — Gestión → Organización

   Josué: *"Tareas debe quedar dentro de Organización, no dentro de
   Productividad."*

   🔓 **Y ESO CIERRA LA C-31**, la contradicción que llevaba abierta desde el
   2026-09-12. Él pedía Tareas y Rutinas en Gestión y Objetivos y Hábitos en
   Vida, pero las cuatro eran mini-apps de Productividad, que es UNA pantalla
   (E3 F23), así que repartirlas exigía partir el lanzador — justo lo que su
   encargo prohibía. Aquí lo resuelve él mismo y con precisión: **Tareas sale a
   Organización y las demás se quedan.** No hacía falta adivinarlo.

   ⚠️ Tareas **no cambia de sitio en los datos**: sigue en `productividad.tareas`,
   que es la única fuente que leen Hoy, la Agenda, el Calendario y la vista
   semanal (E3 F26). Lo que se mueve es por dónde se entra.
   --------------------------------------------------------------------------- */
export const APPS_ORGANIZACION = [
  {
    id: 'tareas',
    nombre: 'Tareas',
    desc: 'Organiza lo que tienes que hacer',
    vacio: 'Sin tareas pendientes',
  },
  {
    id: 'calendario',
    nombre: 'Calendario',
    desc: 'Mes, día y agenda',
    vacio: 'Nada apuntado todavía',
  },
  {
    id: 'horario',
    nombre: 'Horario',
    desc: 'Tus clases y tu semana',
    vacio: 'Todavía no has creado un horario',
  },
];

/* ---------------------------------------------------------------------------
   Las dos agrupadoras, en una lista.

   ⚠️ **Progreso NO está aquí, y es a propósito.** Es el `numeros` de NAV F1 con
   su etiqueta nueva: ya tiene su catálogo (`numeros.js`) y su pantalla
   (`NumbersView`), las dos funcionando. Duplicarlas aquí habría dejado dos
   versiones de la misma cosa — que es exactamente lo que estas agrupadoras
   existen para evitar.
   --------------------------------------------------------------------------- */
export const AGRUPADORES = [
  {
    id: 'mente',
    nombre: 'Mente',
    desc: 'Tu espacio de bienestar mental',
    apps: APPS_MENTE,
  },
  {
    id: 'organizacion',
    nombre: 'Organización',
    desc: 'Lo que tienes que hacer y cuándo',
    apps: APPS_ORGANIZACION,
  },
];

export const IDS_AGRUPADORES = AGRUPADORES.map((a) => a.id);

export function agrupador(id) {
  return AGRUPADORES.find((a) => a.id === id) || null;
}

/* Todas las sub-apps de todas las agrupadoras, aplanadas. */
export const APPS_DE_AGRUPADORES = AGRUPADORES.flatMap((g) =>
  g.apps.map((a) => ({ ...a, agrupador: g.id })));

export function appDeAgrupador(appId) {
  return APPS_DE_AGRUPADORES.find((a) => a.id === appId) || null;
}

/* Dónde vive ahora un módulo que antes tenía pestaña propia. Lo usa la
   navegación para saber a qué agrupadora volver, y el buscador para llevar al
   sitio correcto. */
export function agrupadorDeApp(appId) {
  const a = appDeAgrupador(appId);
  return a ? a.agrupador : null;
}

/* ¿Esta sub-app exige PIN? Una sola pregunta, para que nadie lo decida por su
   cuenta mirando el id. */
export const appProtegida = (appId) => Boolean(appDeAgrupador(appId)?.protegida);

/* ---------------------------------------------------------------------------
   Lo que NO se ha movido, declarado — y por qué.

   Un informe que solo enumera lo verde miente por omisión (E3 F46).
   --------------------------------------------------------------------------- */
export const NO_SE_MUEVE = [
  {
    que: 'Los datos de los seis módulos agrupados',
    porque: 'Sus claves de `app_data` son las de siempre. Moverlas rompería la papelera, '
      + 'los resúmenes de Inicio y la exportación a cambio de nada.',
  },
  {
    que: 'La personalización de la Fase 19 (orden y ocultos)',
    porque: 'Está indexada por id de módulo, y ni un id cambia.',
  },
  {
    que: 'El PIN de Relación',
    porque: 'Sigue siendo incondicional (regla 6). Lo que cambia es dónde se aplica: '
      + 'antes lo ponía la pestaña, ahora el panel de Mente.',
  },
  {
    que: 'Las palabras del buscador',
    porque: 'Un módulo que deja de tener pestaña muda sus palabras a quien lo contiene; '
      + 'nunca se borran (E3 F23, NAV F1).',
  },
];
