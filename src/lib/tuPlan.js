import { todayISO, addDays } from './helpers';
/* ⚠️ Los días de la semana y «qué día cae esta fecha» ya existen desde HT F1, y
   se calculan **en local** —que es la trampa del UTC por séptima vez—. Escribir
   aquí una segunda lista de lunes-a-domingo sería la de siempre: dos catálogos
   que acaban diciendo cosas distintas. */
import { DIAS_SEMANA, diaDeFecha } from './horario';
/* ⚠️ `diasEntre` existe DOS veces y no significan lo mismo: la de `rachas.js`
   cuenta incluyendo los dos extremos (+1) y la de `hoy.js` la diferencia
   entera, que es la que hace falta aquí — hoy es cero (FIT F4). */
import { diasEntre } from './hoy';
import { planARutina, distribucionMuscular, duracionEstimada } from './constructor';
import { fichaDePlantilla } from './plantillas';
import {
  CATALOGO_PLANES, planPorId, planActivoDe, fichaDePlan, fichaDeDia, lineasDeDia,
  rutinaDelPlan, diasDeEntreno,
} from './planes';

/* Entrega 4 · Fase 6/45 — «Tu Plan».
   ═══════════════════════════════════════════════════════════════════════════

   El criterio de finalización pide entrar en *Fitness → Entrenamiento* y
   encontrar **Tu Plan → Próximo entrenamiento → Semana → Tus plantillas**
   *"realmente conectados"*, pudiendo *elegir un plan → verlo → consultar su
   semana → abrir sus sesiones → cambiar de plan → acceder a sus plantillas*
   *"sin que ninguna de estas acciones sea un simple mockup"*.

   ───────────────────────────────────────────────────────────────────────────
   1 · LO QUE YA EXISTÍA (el enunciado lo pide antes de tocar nada)
   ───────────────────────────────────────────────────────────────────────────

   *"Antes de modificar nada, inspecciona cuidadosamente lo construido en las
   fases anteriores. Reutiliza modelos, componentes, cálculos y persistencia
   existentes."* Y aquí está casi todo:

   🚨 **EL PLAN ACTIVO YA SE GUARDA** (`fitness.planActivo`, FIT F5): el id, el
   origen y **la fecha de activación** que pide el apartado 17. No hay que
   guardar nada nuevo — ni una estructura semanal aparte, que sería una copia
   del plan (apartado 24: *"No crear otra solución paralela"*).

   🚨 **LA DISTRIBUCIÓN Y LA DURACIÓN SE CALCULAN** desde la F3, y el detalle de
   una sesión es `lineasDeDia()` de la F5. El apartado 9 lo pide con esas
   palabras: *"Reutilizar el detalle creado para planes/plantillas. No crear un
   tercer sistema diferente para representar ejercicios."*

   🚨 **Y LOS DÍAS DE LA SEMANA SON LOS DE `horario.js`** (HT F1), con
   `diaDeFecha()` calculado en local. Una segunda lista de L-M-X-J-V-S-D es
   exactamente el duplicado que este proyecto lleva veinte fases evitando.

   ───────────────────────────────────────────────────────────────────────────
   2 · CÓMO SE SABE QUÉ TOCA HOY, Y POR QUÉ SON DOS REGLAS
   ───────────────────────────────────────────────────────────────────────────

   Ésta es la pieza de la que cuelga la pantalla entera, y el enunciado pide dos
   cosas que **no se resuelven igual**:

   - El apartado 7 dibuja la semana como *"L — Push · M — Pull · X — Descanso…"*:
     el día del plan **es** el día de la semana.
   - El apartado 14 exige que funcione con *"2, 3, 4, 5, 6 o 7 días"* y con una
     *"Rutina personal"* de una sola sesión (apartado 18: el plan activo puede
     ser **una plantilla suya**).

   Con siete días las dos cosas coinciden; con tres, no hay forma de repartir
   tres sesiones en siete casillas sin inventarse cuáles. Así que:

   🚨 **UN PLAN DE SIETE DÍAS ES LA SEMANA** —su día 1 es el lunes—, **y
   cualquier otro CICLA desde la fecha de activación**. Los diecisiete planes de
   la biblioteca tienen siete, así que el caso normal es exactamente el dibujo
   del apartado 7; y una rutina de una sesión toca todos los días desde que la
   activó, que es lo único que se puede afirmar de ella.

   ⚠️ Y el ciclo **necesita la fecha de activación**: sin ella devuelve `null` y
   la pantalla no dibuja la semana. Es el apartado 16 literal: *"No inventar una
   semana si todavía no existe una fecha de inicio."*

   ───────────────────────────────────────────────────────────────────────────
   3 · LOS ESTADOS QUE SE PUEDEN AFIRMAR, Y EL QUE NO
   ───────────────────────────────────────────────────────────────────────────

   El apartado 8 enumera cinco —próximo, actual, completado, descanso, futuro— y
   **a continuación prohíbe uno**: *"todavía no existe el historial completo de
   entrenamientos. Por tanto, no inventes entrenamientos completados […] mostrar
   únicamente estados que puedan determinarse con seguridad."*

   Así que `completado` **existe en el catálogo con `disponible: false`** y
   `estadoDeDia` no lo devuelve jamás. El día que la F8 guarde sesiones, se
   enciende una línea. Declararlo es lo que impide que la fase siguiente escriba
   un sexto estado sin enterarse de que éste ya estaba pensado. */

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const lista = (v) => (Array.isArray(v) ? v : []);

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LOS ESTADOS DE UN DÍA (apartado 8)
   ═══════════════════════════════════════════════════════════════════════════ */

export const ESTADOS_DIA = [
  { id: 'hoy', nombre: 'Hoy', disponible: true, que: 'El entrenamiento que toca hoy.' },
  { id: 'proximo', nombre: 'Próximo', disponible: true, que: 'El siguiente día de entrenamiento.' },
  { id: 'descanso', nombre: 'Descanso', disponible: true, que: 'Un día sin entrenamiento.' },
  { id: 'futuro', nombre: 'Más adelante', disponible: true, que: 'Un día de entrenamiento que todavía no toca.' },
  { id: 'pasado', nombre: 'Ya pasó', disponible: true, que: 'Un día de esta semana que ya quedó atrás.' },
  /* 🔓 **EL QUINTO, ENCENDIDO POR LA FIT F8.** Nació `disponible: false` porque
     el apartado 8 de la F6 prohíbe inventarse entrenamientos completados y
     entonces no había ni una sesión guardada. Ya las hay, así que el estado se
     enciende — y **sigue sin inventarse nada**: solo lo dice una sesión con
     estado `completada` de ese día. Era una espera, no una exclusión. */
  {
    id: 'completado',
    nombre: 'Completado',
    disponible: true,
    que: 'Ese día hay un entrenamiento guardado. Lo dice la sesión, no el plan.',
    desdeFase: 'Finalización y guardado del entrenamiento (FIT F8)',
  },
];

export const estadoDia = (id) => ESTADOS_DIA.find((e) => e.id === id) || null;
export const ESTADOS_DISPONIBLES = ESTADOS_DIA.filter((e) => e.disponible).map((e) => e.id);

/* ═══════════════════════════════════════════════════════════════════════════
   5 · EL PLAN ACTIVO, VENGA DE DONDE VENGA (apartado 18)
   ═══════════════════════════════════════════════════════════════════════════

   *"Si el usuario selecciona como plan activo una plantilla propia: también
   debe funcionar. No asumir que los planes activos siempre son presets."*

   🚨 **Y una plantilla se ENVUELVE como plan de un día, no se convierte.** La
   F5 dejó escrito que un PresetPlan es una SEMANA y un WorkoutPlan una SESIÓN;
   lo que hace falta aquí es leer las dos con la misma forma, no copiar la
   plantilla ni inventarle seis días de descanso alrededor. ⚠️ El envoltorio se
   construye **en el momento**: no se guarda nada, así que editar la plantilla en
   el constructor cambia el plan activo sola. */

export function planDePlantilla(plantilla, propios = []) {
  const p = plantilla && typeof plantilla === 'object' ? plantilla : null;
  if (!p || !texto(p.id)) return null;
  const rutina = planARutina(p);
  const ficha = fichaDePlantilla(p, propios);
  return {
    id: p.id,
    nombre: texto(p.nombre) || 'Sin nombre',
    subtitulo: 'Una rutina tuya',
    descripcion: texto(p.descripcion),
    entorno: (rutina?.entornos || [])[0] || '',
    objetivo: '',
    dificultad: '',
    /* ⚠️ Una rutina de una sesión **no anuncia una frecuencia**: él decide
       cuántos días a la semana la hace, y escribirle «1 día/semana» sería
       inventarle un compromiso (regla 8). */
    frecuencia: null,
    paraQuien: '',
    tags: [],
    thumbnail: null,
    propia: true,
    dias: [{
      id: `${p.id}-dia`,
      nombre: texto(p.nombre) || 'Entrenamiento',
      descanso: false,
      lineas: lista(rutina?.lineas),
    }],
    /* Lo que la pantalla necesita y no está en el modelo de plan. */
    ejerciciosPlantilla: ficha ? ficha.ejercicios : 0,
  };
}

/** El plan activo resuelto, sea de la biblioteca o suyo. Devuelve también **de
 *  dónde salió**, porque la pantalla lo dice y las acciones cambian. */
export function planActivoCompleto(fitness, planes = CATALOGO_PLANES) {
  const activo = planActivoDe(fitness);
  if (!activo) return null;
  const propios = lista((fitness || {}).ejercicios);

  if (activo.origen === 'plantilla') {
    const plantilla = lista((fitness || {}).plantillas).find((x) => x.id === activo.planId);
    const plan = plantilla ? planDePlantilla(plantilla, propios) : null;
    return { plan, activo, origen: 'plantilla', perdido: !plan };
  }
  const plan = planPorId(activo.planId, planes);
  /* ⚠️ `perdido` no es lo mismo que «no hay plan» (apartado 25): hay uno
     elegido y **ya no se puede enseñar**, así que la pantalla ofrece elegir
     otro en vez de fingir que nunca eligió nada. */
  return { plan, activo, origen: 'preset', perdido: !plan };
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LA SEMANA (apartados 7, 8, 14 y 16)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Qué día del plan cae en una fecha. Las dos reglas de §2, en una función.
 *  ⚠️ Devuelve `null` cuando no se puede saber — nunca un cero de oficio. */
export function posicionDelDia(plan, fecha, desde = '') {
  const dias = lista(plan?.dias);
  if (!dias.length || !fecha) return null;
  /* Siete días: el plan ES la semana, y su día 1 es el lunes (apartado 7). */
  if (dias.length === 7) {
    const d = diaDeFecha(fecha);
    return d ? d - 1 : null;
  }
  /* Cualquier otro número cicla desde que lo activó. Sin fecha de activación no
     hay ciclo posible, y el apartado 16 prohíbe inventárselo. */
  if (!desde) return null;
  const n = diasEntre(desde, fecha);
  if (n < 0) return null;
  return ((n % dias.length) + dias.length) % dias.length;
}

/** Las siete casillas de la semana, cada una con su día del plan y su estado.
 *  ⚠️ Siempre **la semana que contiene hoy**, empezando en lunes (E3 F10). */
/** 🔓 FIT F8 — qué días tienen un entrenamiento guardado. ⚠️ **Se pregunta a las
 *  sesiones, no al plan**: el plan dice lo que TOCA, y que algo se hiciera solo
 *  lo puede decir un registro suyo (apartado 8 de la F6). Y solo cuentan las
 *  `completada`: una descartada no es un entrenamiento hecho. */
export function diasEntrenados(sesiones = []) {
  const dias = new Set();
  for (const s of lista(sesiones)) {
    if (s && s.estado === 'completada' && s.fecha) dias.add(s.fecha);
  }
  return dias;
}

export function semanaDelPlan(plan, { hoy = todayISO(), desde = '', propios = [], sesiones = [] } = {}) {
  const entrenados = diasEntrenados(sesiones);
  const dias = lista(plan?.dias);
  if (!dias.length) return [];
  const diaHoy = diaDeFecha(hoy);
  if (!diaHoy) return [];
  /* 🚨 Apartado 16, literal: *"No inventar una semana si todavía no existe una
     fecha de inicio."* Un plan que no sea de siete días **solo** se puede
     repartir ciclando desde que lo activó, así que sin esa fecha no hay semana
     que dibujar — y la pantalla lo dice en vez de pintar siete huecos. */
  if (dias.length !== 7 && !desde) return [];
  const lunes = addDays(hoy, -(diaHoy - 1));

  /* El primer día de entreno que queda por delante es «Próximo»; los demás,
     «Más adelante». Se calcula recorriendo, no adivinando. */
  let yaHayProximo = false;
  return DIAS_SEMANA.map((d, i) => {
    const fecha = addDays(lunes, i);
    const pos = posicionDelDia(plan, fecha, desde);
    const dia = pos === null ? null : dias[pos];
    const esHoy = fecha === hoy;
    const pasado = fecha < hoy;
    /* 🚨 Un día ANTERIOR a la activación no es un descanso: es un día en el que
       este plan todavía no existía, y llamarlo «Descanso» sería inventarse que
       ese día tocaba descansar. Fue un fallo real de esta misma fase: con un
       plan activado un martes, el lunes de esa semana salía como descanso. */
    const antesDeEmpezar = !!desde && fecha < desde;

    /* 🔓 FIT F8 — un día con entrenamiento guardado es «Completado», y eso gana
       a «Hoy» y a «Ya pasó»: es lo único que se sabe de cierto de ese día.
       ⚠️ Pero **no gana a «Descanso» ni a un día anterior a la activación**: si
       entrenó un día que el plan no pedía, ese día sigue siendo descanso del
       plan, y decir «Completado» afirmaría que cumplió algo que no tocaba. */
    const entrenado = entrenados.has(fecha);

    let estado;
    if (antesDeEmpezar) estado = 'pasado';
    else if (!dia || dia.descanso) estado = 'descanso';
    else if (entrenado) estado = 'completado';
    else if (esHoy) estado = 'hoy';
    else if (pasado) estado = 'pasado';
    else if (!yaHayProximo) { estado = 'proximo'; yaHayProximo = true; }
    else estado = 'futuro';

    return {
      fecha,
      dia: d.dia,
      corto: d.corto,
      etiqueta: d.label,
      esHoy,
      entrenado,
      fueraDelPlan: antesDeEmpezar,
      indice: antesDeEmpezar ? null : pos,
      nombre: antesDeEmpezar || !dia ? '' : dia.nombre,
      /* ⚠️ Y por eso `descanso` es `false`: no se afirma nada de ese día. */
      descanso: antesDeEmpezar ? false : (!dia || !!dia.descanso),
      ejercicios: antesDeEmpezar || !dia ? 0 : lista(dia.lineas).length,
      duracion: !antesDeEmpezar && dia && !dia.descanso && pos !== null
        ? duracionEstimada({ lineas: dia.lineas }, propios).texto
        : '',
      estado,
    };
  });
}

/* Apartado 15: *"Los días sin entrenamiento deben representarse claramente […]
   No mostrar un CTA de entrenamiento en un día de descanso."* */
export const DESCANSO_HOY = {
  titulo: 'Hoy toca descansar',
  texto: 'Recupera y prepárate para la próxima sesión.',
};

/** El próximo entrenamiento (apartado 5): el de hoy si hoy toca, y si no el
 *  siguiente día de entreno de la semana. ⚠️ Devuelve `null` si esta semana no
 *  queda ninguno — inventarse el de la semana que viene sería adivinar cuándo
 *  vuelve a empezar el ciclo. */
export function proximoEntrenamiento(plan, { hoy = todayISO(), desde = '', propios = [], sesiones = [] } = {}) {
  /* 🔓 FIT F8 — recibe las sesiones **por el mismo motivo que la semana**: si
     no, las dos dirían cosas distintas del mismo día. Con el entrenamiento de
     hoy ya guardado, ese día pasa a «Completado» y lo siguiente que toca es el
     día de después — que es lo que hace un tracker de verdad, y lo contrario
     —ofrecerle «Empezar» el que acaba de terminar— sería raro.
     ⚠️ Y no le impide entrenar otra vez: la semana sigue siendo pulsable. */
  const semana = semanaDelPlan(plan, { hoy, desde, propios, sesiones });
  const casilla = semana.find((d) => d.estado === 'hoy') || semana.find((d) => d.estado === 'proximo');
  if (!casilla || casilla.indice === null) return null;

  const ficha = fichaDeDia(plan, casilla.indice, propios);
  if (!ficha || ficha.descanso) return null;
  const distribucion = distribucionMuscular({ lineas: lista(plan.dias[casilla.indice].lineas) }, propios);
  return {
    ...casilla,
    /* *"Hoy"* o *"Mañana"* o el nombre del día: el apartado 5 pide el día, y
       decir «martes» cuando es mañana se lee peor que «Mañana». */
    cuando: casilla.esHoy ? 'Hoy' : (casilla.fecha === addDays(hoy, 1) ? 'Mañana' : casilla.etiqueta),
    sesion: ficha,
    /* Los músculos principales del apartado 5, derivados. */
    musculos: distribucion.grupos.slice(0, 3).map((g) => g.nombre),
    /* La posición dentro de la semana, también del apartado 5. */
    posicion: `Día ${casilla.indice + 1} de ${lista(plan.dias).length}`,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · LA FICHA DEL PLAN ACTIVO Y SU DISTRIBUCIÓN (apartados 3 y 10)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Lo que la cabecera enseña (apartado 3: *"No sobrecargar la cabecera"*).
 *  ⚠️ Todo derivado, y lo único guardado que se lee es **desde cuándo**. */
export function cabeceraDelPlan(plan, activo, propios = []) {
  if (!plan) return null;
  const base = plan.propia
    ? {
      nombre: plan.nombre,
      subtitulo: plan.subtitulo,
      entorno: '',
      dificultad: '',
      objetivo: '',
      textoFrecuencia: '',
      diasEntreno: 1,
      ejercicios: plan.ejerciciosPlantilla || lista(plan.dias[0]?.lineas).length,
      duracion: duracionEstimada({ lineas: lista(plan.dias[0]?.lineas) }, propios).texto,
    }
    : (() => {
      const f = fichaDePlan(plan, propios);
      return {
        nombre: f.nombre,
        subtitulo: f.subtitulo,
        entorno: f.entorno,
        dificultad: f.dificultad,
        objetivo: f.objetivo,
        textoFrecuencia: f.textoFrecuencia,
        diasEntreno: f.diasEntreno,
        ejercicios: f.ejercicios,
        duracion: f.duracion,
      };
    })();

  return {
    ...base,
    propia: !!plan.propia,
    desde: texto(activo?.desde),
    /* Apartado 17: la fecha de activación se ENSEÑA, porque es lo que explica
       desde cuándo lo sigue. ⚠️ Y si no la tiene, no se dice nada — lo guardado
       antes de la F5 no tiene fecha y no se le inventa una. */
    textoDesde: texto(activo?.desde) ? `Activo desde el ${formatoCorto(activo.desde)}` : '',
  };
}

function formatoCorto(iso) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}

/** La distribución de la SEMANA entera (apartado 10), derivada del plan.
 *  ⚠️ Es la misma función de la F3: *"Utilizar los cálculos existentes."* */
export function distribucionSemanal(plan, propios = []) {
  if (!plan) return { total: 0, grupos: [], subgrupos: [] };
  return distribucionMuscular(rutinaDelPlan(plan), propios);
}

/** El apartado 10 avisa: *"No hace falta mostrar todos los porcentajes si eso
 *  satura la pantalla."* Se enseñan los que pesan, y el resto se resume. */
export const GRUPOS_EN_RESUMEN = 5;

export function resumenDistribucion(plan, propios = [], cuantos = GRUPOS_EN_RESUMEN) {
  const d = distribucionSemanal(plan, propios);
  const grupos = d.grupos.slice(0, cuantos);
  const resto = d.grupos.slice(cuantos).reduce((a, g) => a + g.porcentaje, 0);
  return { grupos, resto, total: d.grupos.length };
}

/* ═══════════════════════════════════════════════════════════════════════════
   8 · TUS PLANTILLAS, EN PEQUEÑO (apartados 11, 12 y 13)
   ═══════════════════════════════════════════════════════════════════════════

   🚨 *"No duplicar toda la funcionalidad de gestión aquí"* (apartado 11) y
   *"No mezclar ambas listas […] Una plantilla no se convierte automáticamente
   en plan activo"* (apartado 13). Así que esto devuelve **las tres últimas con
   su ficha**, y quien gestiona sigue siendo `PlantillasView` (F4). */
export const PLANTILLAS_EN_TU_PLAN = 3;

export function plantillasParaTuPlan(fitness, propios = [], cuantas = PLANTILLAS_EN_TU_PLAN) {
  const todas = lista((fitness || {}).plantillas);
  const ordenadas = [...todas].sort((a, b) => {
    const cuando = (p) => texto(p?.editadoEn) || texto(p?.creadoEn) || '';
    return cuando(b).localeCompare(cuando(a));
  });
  const activo = planActivoDe(fitness);
  return {
    total: todas.length,
    /* *"Ver todas"* solo si queda alguna fuera: un botón que lleva a la lista
       que ya estás viendo no hace nada (E3 F46, regla 8). */
    hayMas: todas.length > cuantas,
    plantillas: ordenadas.slice(0, cuantas).map((p) => {
      const f = fichaDePlantilla(p, propios);
      return {
        id: p.id,
        nombre: f ? f.nombre : texto(p.nombre),
        ejercicios: f ? f.ejercicios : 0,
        duracion: f ? f.duracion : '',
        entorno: f ? (f.entornos || []).join(' · ') : '',
        /* Para que la pantalla pueda decir cuál es la que está activa en vez de
           ofrecer «Usar como plan» sobre la que ya lo es. */
        esActiva: !!activo && activo.origen === 'plantilla' && activo.planId === p.id,
      };
    }),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   9 · LOS ESTADOS DE LA PANTALLA (apartados 2, 25 y 26)
   ═══════════════════════════════════════════════════════════════════════════ */

/* Apartado 2, con sus palabras y sus dos salidas. */
export const SIN_PLAN = {
  titulo: 'Aún no tienes un plan',
  texto: 'Elige una planificación o crea tu propia rutina para empezar.',
  explorar: 'Explorar planes',
  crear: 'Crear entrenamiento',
};

/* Apartado 25: *"Si el plan activo completo deja de existir: mostrar un estado
   de recuperación y permitir elegir otro plan."* ⚠️ Y se dice **qué ha pasado**,
   no un «Error» a secas (EH F62). */
export const PLAN_PERDIDO = {
  titulo: 'Tu plan ya no está disponible',
  texto: 'La planificación que seguías ya no existe. Puedes elegir otra sin perder tus plantillas.',
  accion: 'Explorar planes',
};

/* ═══════════════════════════════════════════════════════════════════════════
   10 · TODO JUNTO: LO QUE LEE LA PANTALLA
   ═══════════════════════════════════════════════════════════════════════════

   Una sola función, para que la vista no tenga que orquestar nada — y para que
   la prueba mida lo mismo que se pinta. */
export function tuPlan(fitness, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const propios = lista((fitness || {}).ejercicios);
  const resuelto = planActivoCompleto(fitness, planes);
  const plantillas = plantillasParaTuPlan(fitness, propios);

  if (!resuelto) return { estado: 'sin_plan', plan: null, plantillas, propios };
  if (resuelto.perdido) {
    return { estado: 'perdido', plan: null, activo: resuelto.activo, plantillas, propios };
  }

  const { plan, activo, origen } = resuelto;
  const desde = texto(activo.desde);
  const sesiones = lista((fitness || {}).sesiones);
  const semana = semanaDelPlan(plan, { hoy, desde, propios, sesiones });
  const proximo = proximoEntrenamiento(plan, { hoy, desde, propios, sesiones });
  const casillaHoy = semana.find((d) => d.esHoy) || null;

  return {
    estado: 'activo',
    plan,
    origen,
    activo,
    cabecera: cabeceraDelPlan(plan, activo, propios),
    semana,
    proximo,
    /* Apartado 15: hoy es descanso, y entonces NO hay CTA de entrenamiento. */
    descansoHoy: !!casillaHoy && casillaHoy.descanso,
    distribucion: resumenDistribucion(plan, propios),
    plantillas,
    propios,
    /* ⚠️ Sin fecha de activación y con un plan que no sea de siete días, la
       semana sale vacía — y se dice por qué en vez de dejar un hueco. */
    sinSemana: semana.length === 0,
  };
}

/** Los ejercicios de un día, para la sesión del apartado 9. ⚠️ **Es la función
 *  de la F5**: *"No crear un tercer sistema diferente para representar
 *  ejercicios."* */
export function sesionDelDia(plan, indice, propios = []) {
  if (!plan || indice === null || indice === undefined) return null;
  const ficha = fichaDeDia(plan, indice, propios);
  if (!ficha) return null;
  return {
    ...ficha,
    lineas: lineasDeDia(plan, indice, propios),
    distribucion: distribucionMuscular({ lineas: lista(plan.dias[indice]?.lineas) }, propios),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   11 · LO QUE NO SE CONSTRUYE, CON SU MOTIVO (apartados 16 y 28)
   ═══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_FIT6 = [
  { que: 'El entrenamiento en vivo, el cronómetro y el registro de series', porque: 'Apartado 28. El CTA del apartado 6 es *"Ver entrenamiento"* y abre el detalle: *"No crear botones muertos."*' },
  /* 🔓 Cumplido por la FIT F8: se queda escrito con su fecha, como la entrada de
     `DESVIACIONES` de DIST F2 — borrarlo dejaría la pregunta viva y la respuesta
     perdida, que es cómo este proyecto acabó con la mentira de los sonidos
     escrita en tres sitios. */
  { que: 'El estado «Completado» de un día', porque: 'Apartado 8: sin historial de sesiones no se puede afirmar que entrenó.', resueltoEn: 'FIT F8 — ya hay sesiones guardadas, así que el estado se encendió.' },
  { que: 'La semana del plan, el progreso y la adherencia', porque: 'Apartado 16: *"No implementar todavía lógica avanzada de progresión."* La fecha de activación ya está guardada para cuando toque.' },
  { que: 'El historial de sesiones y las fotos de progreso', porque: 'Apartado 28. Las fotos, además, ya existen en Salud (`saludFotos`, FIT F1): no se duplican.' },
  { que: 'Rangos, Progreso, IA y recomendaciones automáticas', porque: 'Apartado 28, y la regla 7: la IA nunca se dispara sola.' },
  { que: 'Una semana inventada sin fecha de activación', porque: 'Apartado 16, literal. Un plan que no sea de siete días y no tenga `desde` no dibuja semana: se dice.' },
];

/* ⚠️ Lo que el apartado 16 pide **dejar preparado**, con dónde está ya. Escrito
   para que la fase que lo necesite no vuelva a construirlo (EH F55). */
export const PREPARADO_PARA = [
  { que: 'La sesión actual y el día actual del plan', donde: '`posicionDelDia()` y `semanaDelPlan()`, con su estado por día.' },
  { que: 'La última sesión realizada', donde: 'Falta: la guardará `fitness.sesiones`, que existe vacía desde la F1.' },
  { que: 'La próxima sesión', donde: '`proximoEntrenamiento()`.' },
  { que: 'El número de semanas desde que empezó', donde: '`planActivo.desde` (F5) más `diasEntre()`. No se enseña todavía (apartado 16).' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   12 · LA AUDITORÍA DEL APARTADO 29
   ═══════════════════════════════════════════════════════════════════════════

   Se **ejecuta** sobre el plan que se le pase, no se describe: una casilla
   puesta a `true` a mano es una auditoría que no puede fallar (EH F42). */
export function auditarTuPlan(fitness, { hoy = todayISO(), planes = CATALOGO_PLANES } = {}) {
  const problemas = [];
  const v = tuPlan(fitness, { hoy, planes });

  if (v.estado === 'activo') {
    if (!v.cabecera?.nombre) problemas.push({ que: 'El plan activo no tiene nombre que enseñar.' });
    if (!v.semana.length) problemas.push({ que: 'No se puede dibujar la semana del plan activo.' });
    if (v.semana.length && !v.semana.some((d) => d.esHoy)) {
      problemas.push({ que: 'La semana no marca ningún día como hoy.' });
    }
    const conEntreno = v.semana.filter((d) => !d.descanso && !d.fueraDelPlan);
    if (conEntreno.length && !v.proximo && !v.descansoHoy) {
      problemas.push({ que: 'Hay días de entrenamiento y no se identifica ninguno como próximo.' });
    }
    if (v.proximo && !v.proximo.sesion?.ejercicios) {
      problemas.push({ que: 'El próximo entrenamiento no enseña ni un ejercicio.' });
    }
    if (!v.distribucion.grupos.length) {
      problemas.push({ que: 'No se puede calcular la distribución semanal.' });
    }
    if (v.semana.some((d) => !ESTADOS_DISPONIBLES.includes(d.estado))) {
      problemas.push({ que: 'Un día de la semana tiene un estado que no se puede afirmar.' });
    }
  }
  return { ok: problemas.length === 0, problemas, estado: v.estado };
}
