/* ===========================================================================
   NÚMEROS — el apartado donde vive lo cuantificable
   ===========================================================================

   Josué: *"Considero que Estadísticas + Predicciones + Logros tienen mucho más
   sentido agrupados dentro de un apartado llamado NÚMEROS"*, y a continuación:
   *"No quiero que inventes funcionalidades innecesarias. Reorganiza lo que ya
   existe."*

   🚨 **ASÍ QUE ESTE ARCHIVO NO CONSTRUYE NI UNA PANTALLA NUEVA.** Las tres ya
   existen —`StatsView`, `PredictionsView`, `AchievementsView`— y siguen siendo
   exactamente las mismas: lo único que cambia es que **se entra por un sitio en
   vez de por tres**. Es la lección de la E3 F23 con Productividad y la de la
   E3 F16 con la Biblioteca: *antes de rediseñar un apartado, mirar si sus
   piezas ya existen* — aquí existían las tres, así que la fase es la pantalla y
   la navegación, no el contenido.

   🚨 **Y NO GUARDA NI UNA CIFRA.** No hay clave nueva en `app_data`, no hay
   normalizador y no hay nada que migrar: las tres sub-apps ya derivaban sus
   números de los módulos originales, y las líneas de esta pantalla también. Una
   estadística guardada miente en cuanto Josué borra un registro (E3 F13,
   EH F35).

   ⚠️ **NO ES UNA CUARTA LISTA DE «QUÉ SE VE»** (D2-07). `APPS_NUMEROS` dice qué
   hay dentro de Números; quién se ve en Inicio y en qué orden lo siguen
   diciendo `MORE_NAV`, `AREAS_NAV` y la personalización de la Fase 19.
   =========================================================================== */

import { fechasDeEntreno } from './fechasDeEntreno';

/* ---------------------------------------------------------------------------
   Las tres sub-apps.

   ⚠️ Los ids son **los de siempre** (`estadisticas`, `predicciones`, `logros`),
   y eso no es casualidad: los leen `resumenesHub.js`, la personalización de la
   Fase 19, los presets de `tokens.js`, `experienciaReal.js` y `auditoriaFinal.js`.
   Renombrarlos habría roto las cinco cosas a la vez sin que fallara nada
   visible — es la lección de la E3 F30: **renombrar lo que se ve y renombrar lo
   que se guarda son dos cosas distintas.**

   ⚠️ El icono va en `ICONOS_NUMEROS` (`src/components/iconosNumeros.jsx`), no
   aquí: uno es un catálogo de datos y el otro de componentes de React, el mismo
   reparto que `MINI_APPS` / `ICONOS_MINI_APP` (E3 F16) y que
   `CATEGORIAS_ARMARIO` / `ICONOS_CATEGORIA` (E3 F3).
   --------------------------------------------------------------------------- */
export const APPS_NUMEROS = [
  {
    id: 'estadisticas',
    nombre: 'Estadísticas',
    desc: 'Correlaciones entre lo que registras',
    // Lo que se enseña en la plaquita cuando todavía no hay con qué calcular.
    vacio: 'Registra unos días y aparecerán las correlaciones',
  },
  {
    id: 'predicciones',
    nombre: 'Predicciones',
    desc: 'Estimaciones a partir de tus datos',
    vacio: 'Hacen falta datos para estimar nada',
  },
  {
    id: 'logros',
    nombre: 'Logros',
    desc: 'Insignias y mapa de vida',
    vacio: 'Tus insignias aparecerán aquí',
  },
];

export const IDS_APPS_NUMEROS = APPS_NUMEROS.map((a) => a.id);

/* 🏷️ DIST F1 — **el apartado se llama «Progreso»**, y el nombre vive aquí, no
   escrito a mano en la pantalla. Josué: *"El antiguo agrupamiento/nombre que
   pueda existir para estas funciones debe adaptarse a Progreso."*
   ⚠️ **El id sigue siendo `numeros`**, y el archivo también: son la clave que
   leen los presets de `tokens.js`, `experienciaReal.js`, `auditoriaFinal.js` y
   `resumenesHub.js`. Renombrar lo que se ve y renombrar lo que se guarda son
   dos cosas distintas (E3 F30) — y ésa es la razón de que esta constante exista
   en vez de tres literales sueltos: el próximo renombrado llega solo. */
export const NOMBRE_PROGRESO = 'Progreso';
export const SUBTITULO_PROGRESO = 'Todo lo que se puede medir de lo que haces.';

export function appNumeros(id) {
  return APPS_NUMEROS.find((a) => a.id === id) || null;
}

/* ---------------------------------------------------------------------------
   Lo que NO entra aquí, declarado — y por qué.

   Josué: *"Cualquier otra información cuantificable/evolutiva que ya exista en
   la aplicación y encaje naturalmente ahí."* La tentación era traerse Rachas y
   Progreso, y las dos serían un error:

   ⚠️ **Rachas es un módulo con su propia pantalla y su propio motor** (RA F1-F4),
   y sobre todo **se registra desde ella**: no es solo mirar un número. Meterla
   aquí la sacaría de Vida, que es donde él la puso, y esta fase no mueve nada
   que no se le haya pedido.
   --------------------------------------------------------------------------- */
export const NO_EN_NUMEROS = [
  {
    que: 'Rachas',
    porque: 'Tiene pantalla propia y SE REGISTRA desde ella; Números solo mira. Y vive en Vida, que es donde Josué la puso.',
    donde: 'Área Vida → Rachas',
  },
  {
    que: 'Progreso de Estilo',
    porque: 'Son las métricas de un módulo concreto, no de toda la aplicación. Viven dentro de su apartado (EH F35).',
    donde: 'Bienestar → su apartado de estilo',
  },
  {
    que: 'Las estadísticas de cada módulo',
    porque: 'Nutrición, Sueño, Productividad y Estudios tienen las suyas, calculadas con datos que solo ellos entienden. Duplicarlas aquí sería el segundo cálculo que acaba diciendo un número distinto.',
    donde: 'Dentro de cada módulo',
  },
];

/* ---------------------------------------------------------------------------
   Lo que NO se guarda, declarado (E3 F13, EH F35).
   --------------------------------------------------------------------------- */
export const NO_SE_GUARDA = {
  clave: null,
  porque: 'Números no tiene almacén propio: es una pantalla que agrupa tres vistas que ya derivaban sus cifras de los módulos originales. Una cifra guardada aquí mentiría en cuanto él borre un registro.',
};

/* ---------------------------------------------------------------------------
   El resumen de la pantalla.

   ⚠️ **No inventa un número global.** La lección de la E3 F29 (apartado 13): un
   porcentaje único sobre cosas que no se miden igual no significa nada. Lo que
   se dice es cuántas de las tres tienen algo que enseñar hoy, que es un dato
   que sí existe.
   --------------------------------------------------------------------------- */

/* 🐛 Fase 1B (CX-15) — **ESTADÍSTICAS NO VEÍA EL DIARIO, Y NO ERA SOLO ESO.** `hayDatosPara`
   medía `largo(x)` —la longitud de una lista— sobre módulos que **no son listas**: `diario` es
   `{ entradas }`, `objetivos` es `{ lista, ultimaRevision }` y `calistenia` un objeto por
   habilidad. Los tres daban 0 siempre, así que con cinco entradas de Diario y ninguna noche el hub
   decía que Estadísticas no tenía datos; Predicciones miraba además el historial MÉDICO de Salud,
   que no usa ninguna de sus tarjetas, y no miraba Fitness. Ahora cada sub-app declara **las series
   que lee su pantalla**, con la forma que tienen de verdad, y «tiene datos» es que alguna tenga
   algo. Solo se cuenta si hay elementos —un booleano—: no se lee ni un texto, y Relación no está. */
const listaDe = (x) => (Array.isArray(x) ? x : []);
const hayEn = (x) => listaDe(x).length > 0;
const objetoDe = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const SERIE_ENTRENAMIENTOS = {
  serie: 'Días con entrenamiento (Fitness y la calistenia de antes)',
  hay: (s) => fechasDeEntreno({ fitness: s.fitness, calistenia: s.calistenia }).todas.size > 0,
};

export const SERIES_DE_NUMEROS = Object.freeze({
  /* Las tres correlaciones de `StatsView`: sueño ↔ estudio, sueño ↔ ánimo, entreno ↔ ánimo. */
  estadisticas: [
    { serie: 'Noches de sueño', hay: (s) => hayEn(s.sueno) },
    { serie: 'Entradas del Diario', hay: (s) => hayEn(objetoDe(s.diario).entradas) },
    { serie: 'Horas de estudio', hay: (s) => hayEn(objetoDe(s.estudios).horas) },
    SERIE_ENTRENAMIENTOS,
  ],
  /* Las seis tarjetas de `PredictionsView`. */
  predicciones: [
    { serie: 'Objetivos', hay: (s) => hayEn(objetoDe(s.objetivos).lista) },
    { serie: 'Hábitos', hay: (s) => hayEn(objetoDe(s.productividad).habitos) },
    { serie: 'Medidas de Salud', hay: (s) => hayEn(objetoDe(s.salud).medidas) },
    SERIE_ENTRENAMIENTOS,
    { serie: 'Movimientos de Economía', hay: (s) => hayEn(objetoDe(s.economia).movimientos) },
    { serie: 'Exámenes', hay: (s) => hayEn(objetoDe(s.estudios).examenes) },
  ],
  /* Lo que cuentan las insignias de `calcularLogros` (`logros.js`). */
  logros: [
    { serie: 'Hábitos', hay: (s) => hayEn(objetoDe(s.productividad).habitos) },
    { serie: 'Entradas del Diario', hay: (s) => hayEn(objetoDe(s.diario).entradas) },
    { serie: 'Objetivos', hay: (s) => hayEn(objetoDe(s.objetivos).lista) },
    { serie: 'Sesiones de concentración', hay: (s) => hayEn(objetoDe(s.bienestar).sesiones) },
    { serie: 'Servicio de Fe', hay: (s) => hayEn(objetoDe(s.fe).servicio) },
    { serie: 'Comidas', hay: (s) => hayEn(objetoDe(s.nutricion).comidas) },
    { serie: 'Medidas de Salud', hay: (s) => hayEn(objetoDe(s.salud).medidas) },
    { serie: 'Récords de la calistenia de antes', hay: (s) => Object.values(objetoDe(s.calistenia)).some((sk) => hayEn(sk && sk.prs)) },
    /* 🔓 Fase 1C — «Primer PR» lee también los entrenamientos de Fitness (un récord es superar
       una marca anterior): son una serie de esta pantalla. */
    { serie: 'Entrenamientos de Fitness (para «Primer PR»)', hay: (s) => fechasDeEntreno({ fitness: s.fitness }).deFitness > 0 },
    { serie: 'Movimientos de Economía', hay: (s) => hayEn(objetoDe(s.economia).movimientos) },
    { serie: 'Noches de sueño', hay: (s) => hayEn(s.sueno) },
  ],
});

/**
 * ¿Tiene esta sub-app algo que enseñar con los datos que hay?
 *
 * ⚠️ Se responde **mirando los módulos de verdad**, no un contador guardado.
 * Y con `null` cuando no se puede saber: `null` no es `false` (EH F32).
 */
export function hayDatosPara(id, estado = {}) {
  const s = estado && typeof estado === 'object' ? estado : {};
  const series = SERIES_DE_NUMEROS[id];
  if (!series) return null;
  /* 🐛 Logros devolvía `true` a secas y decía «1 de 3 con datos» con la aplicación vacía:
     una insignia bloqueada no es un dato suyo. Por eso cada sub-app mira sus series. */
  return series.some((x) => x.hay(s));
}

/**
 * Las líneas de la pantalla de Números, una por sub-app.
 *
 * Devuelve `{ id, nombre, desc, linea, hayDatos }`. **Ni una cifra guardada.**
 */
export function panelNumeros(estado = {}) {
  return APPS_NUMEROS.map((a) => {
    const hay = hayDatosPara(a.id, estado);
    return {
      id: a.id,
      nombre: a.nombre,
      desc: a.desc,
      hayDatos: hay,
      linea: hay ? a.desc : a.vacio,
    };
  });
}

/**
 * La línea que Números enseña en el hub de su área, como cualquier otro módulo.
 *
 * ⚠️ Sin datos NO dice «0 de 3»: dice que todavía no hay con qué. Un cero aquí
 * sería inventarse un mal resultado donde lo que pasa es que no ha registrado
 * nada (E3 F13, E3 F24).
 */
export function resumenNumeros(estado = {}) {
  const panel = panelNumeros(estado);
  const conDatos = panel.filter((p) => p.hayDatos === true).length;
  if (conDatos === 0) {
    return { linea1: 'Estadísticas, predicciones y logros', linea2: 'Registra unos días para ver tus números', estado: 'vacio' };
  }
  return {
    linea1: 'Estadísticas, predicciones y logros',
    linea2: `${conDatos} de ${panel.length} con datos`,
    estado: 'info',
  };
}

/* ---------------------------------------------------------------------------
   La auditoría de la fase.

   ⚠️ Se **ejecuta**, no se describe (EH F42, E3 F46): cada casilla se calcula, y
   hay un caso que la pone roja en la prueba.
   --------------------------------------------------------------------------- */
export function condicionNumeros({ moreNav = [], areasNav = [] } = {}) {
  const ids = moreNav.map((m) => m.id);
  /* 🔓 DIST F1 — antes esta auditoría exigía que Números estuviera en `area-mas`,
     y **`area-mas` ya no existe**: Josué la eliminó como categoría. Lo que
     importaba no era esa área concreta sino que el apartado **viva dentro de
     alguna**, o sea que se llegue a él desde la barra inferior en vez de quedar
     flotando sin acceso. Así que la casilla pasa a comprobar eso, que es lo que
     de verdad protegía. Ahora vive en Gestión, con el nombre «Progreso». */
  const areaConNumeros = areasNav.find((a) => (a.modulos || []).includes('numeros'));
  const casillas = [
    {
      id: 'numeros_existe',
      texto: 'Números es un módulo de la navegación',
      ok: ids.includes('numeros'),
    },
    {
      id: 'las_tres_dentro',
      texto: 'Las tres sub-apps viven dentro de Números, no sueltas en el menú',
      ok: IDS_APPS_NUMEROS.every((id) => !ids.includes(id)) && APPS_NUMEROS.length === 3,
    },
    {
      id: 'numeros_en_mas',
      texto: 'El apartado vive dentro de un área, así que se llega a él desde la barra',
      ok: !!areaConNumeros,
    },
    {
      id: 'sin_almacen',
      texto: 'Números no guarda ni una cifra',
      ok: NO_SE_GUARDA.clave === null,
    },
  ];
  return { casillas, ok: casillas.every((c) => c.ok) };
}
