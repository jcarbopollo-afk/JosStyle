// Entrega 3 · ES Fase 1 — Estudios: home tipo teléfono y nueva arquitectura.
//
// 🚨 LO PRIMERO, Y ES LA LECCIÓN MÁS REPETIDA DEL PROYECTO: **una "app" de Estudios YA EXISTE, y se
// llama `programa`.** El enunciado propone 🎓 Bachillerato, 🎹 Música, ⚽ Fútbol, ♟️ Ajedrez y
// 🌍 Idiomas; `DEFAULT_PROGRAMAS_ESTUDIO` trae **Bachillerato y Música** desde la Fase 6, y el
// formulario de "nuevo programa" lleva de marcador de posición literalmente *"Ej: Idiomas"*. Crear
// una lista `apps` al lado de `programas` habría dejado **los programas, las asignaturas, los
// exámenes y las horas de Josué invisibles en su propia pantalla de Estudios** — que es exactamente
// el fallo de la E3 F16 con las notas y el de la E3 F36 con los alimentos.
//
// Así que esta fase **amplía la entidad**: un programa suma `icono`, `categoria`, `orden` y
// `oculto`, y su normalizador corre AL CARGAR (regla 5). Ni una lista nueva, ni un campo renombrado:
// `id` y `nombre` los leen `AsignaturaCard`, la papelera, el Horario (sus asignaturas son las de
// Estudios, HT F2 apartado 25), `calendarioIntegracion.js` y `exportData.js`.
//
// ⚠️ Y aquí los iconos SÍ son emojis, al contrario que en el Armario (E3 F3, *"Nada de emojis"*).
// No es una contradicción, son dos problemas distintos: las categorías del armario son un **catálogo
// fijo que dibuja la aplicación** (componentes de Lucide, que nadie puede elegir desde un dato), y
// las apps de Estudios **las crea Josué** (apartado 2: *"NO limitar el sistema a las áreas
// anteriores"*), así que su icono tiene que ser algo que él pueda escoger desde un iPhone. Lo mismo
// que hace `MODULOS_EH` con `{ id: 'higiene', icono: '🧼' }`.

import { uid, todayISO } from './helpers';

// 🚨 `diasHasta()` de `helpers.js` cuenta contra **el reloj del dispositivo**, no contra la fecha que
// se le pase. Estas funciones reciben `hoy` para poder probarse, así que usarla dejaba una función
// que **filtra por `hoy` y cuenta desde otro día**: con un examen ayer y otro dentro de dos semanas,
// la plaquita decía *"2 exámenes"* en vez de *"Examen en 3 días"*. Una función que acepta `hoy` y
// luego le pregunta al reloj contesta a una pregunta distinta de la que le han hecho.
// ⚠️ Y se construye en LOCAL (`T00:00:00`), nunca con `Date.parse` de la fecha sola, que es UTC: ésa
// es la trampa que ya ha roto el calendario cinco veces en este proyecto.
function diasEntre(desdeISO, hastaISO) {
  const a = new Date(`${desdeISO}T00:00:00`);
  const b = new Date(`${hastaISO}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// ── Lo que esta fase NO construye ────────────────────────────────────────────────────────────────
// Apartado 17, literal. Se declara para que ninguna fase futura lo dé por hecho (regla 8) y para que
// la pantalla pueda decir con una frase corta qué falta, en vez de enseñar un botón que no hace nada.
export const NO_EN_ES1 = [
  { que: 'Sistema completo de asignaturas', porque: 'Llega en la ES F2, que entra rama por rama.' },
  { que: 'Sistema completo de exámenes', porque: 'La F1 los ENSEÑA (ya existen desde la Fase 6); crearlos y calificarlos es de una fase posterior.' },
  { que: 'Trabajos y entregas', porque: 'No existe la entidad todavía: no hay nada que leer.' },
  { que: 'Estadísticas de estudio', porque: 'Una fase posterior. La correlación con el sueño ya existía y se conserva.' },
  { que: 'IA de planificación', porque: 'El apartado 8 la saca del Home; sigue viva dentro de cada app.' },
  { que: 'Calendario avanzado', porque: 'Los exámenes ya salen en el Calendario Universal desde calendarioIntegracion.js.' },
];

// ── Iconos ───────────────────────────────────────────────────────────────────────────────────────
// Una paleta para elegir de un toque, y un campo libre para pegar cualquier otro: el apartado 2
// prohíbe limitar el sistema a las áreas del ejemplo, y eso vale también para sus dibujos.
export const ICONOS_ESTUDIOS = [
  '🎓', '📚', '📖', '📝', '📐', '🔬', '🧪', '🧬',
  '🌍', '🇬🇧', '💻', '⌨️', '🎹', '🎸', '🎼', '🎨',
  '⚽', '🏀', '🏋️', '♟️', '🧠', '💡', '📊', '⚖️',
];

export const ICONO_POR_DEFECTO = '📘';

// ⚠️ Esto NO es un adivinador de iconos: son los dos ids que la propia aplicación creó con ese
// nombre exacto en `DEFAULT_PROGRAMAS_ESTUDIO`. A lo que escribió Josué no se le inventa el icono
// —se queda en `ICONO_POR_DEFECTO` hasta que él elija—, igual que a una comida sin `momento` no se
// le escribe `'desayuno'` (E3 F33).
export const ICONO_DE_LOS_QUE_TRAE_LA_APP = { bachillerato: '🎓', musica: '🎹' };

// Al CREAR una app se propone un icono según lo que va escribiendo. Se propone, no se impone: el
// campo queda editable y él puede cambiarlo antes de crearla (decimonoveno `aplicarPlan` en espíritu).
export const SUGERENCIAS_ICONO = [
  { busca: ['bachiller', 'insti', 'colegio', 'instituto', 'eso', 'selectividad', 'ebau'], icono: '🎓' },
  { busca: ['music', 'músic', 'piano', 'guitarra', 'solfeo', 'conservatorio'], icono: '🎹' },
  { busca: ['ingl', 'idioma', 'franc', 'alem', 'italian', 'chino'], icono: '🌍' },
  { busca: ['futbol', 'fútbol', 'balon', 'balón'], icono: '⚽' },
  { busca: ['ajedrez', 'chess'], icono: '♟️' },
  { busca: ['program', 'código', 'codigo', 'inform', 'python', 'javascript'], icono: '💻' },
  { busca: ['matem', 'álgebra', 'algebra', 'geometr', 'cálculo', 'calculo'], icono: '📐' },
  { busca: ['biolog', 'quimic', 'químic', 'ciencia', 'física', 'fisica'], icono: '🔬' },
  { busca: ['histor', 'geograf', 'filosof', 'literat', 'lengua'], icono: '📖' },
  { busca: ['arte', 'dibuj', 'diseñ', 'disen'], icono: '🎨' },
  { busca: ['gimnas', 'entren', 'deport'], icono: '🏋️' },
];

export function sugerirIcono(nombre) {
  const t = String(nombre || '').trim().toLowerCase();
  if (!t) return null;
  const hit = SUGERENCIAS_ICONO.find((s) => s.busca.some((p) => t.includes(p)));
  return hit ? hit.icono : null;
}

export function iconoDeApp(programa) {
  return (programa && typeof programa.icono === 'string' && programa.icono.trim()) || ICONO_POR_DEFECTO;
}

// ── Normalizador ─────────────────────────────────────────────────────────────────────────────────
// Regla 5, y ya van veintitrés veces en este proyecto: un campo que el normalizador no conoce se lo
// lleva el siguiente guardado. Corre AL CARGAR, antes de que nadie lea nada (EH F46).
export function normalizarPrograma(p, indice = 0) {
  if (!p || typeof p !== 'object') return null;
  const id = typeof p.id === 'string' && p.id ? p.id : uid();
  const nombre = typeof p.nombre === 'string' ? p.nombre.trim() : '';
  if (!nombre) return null;
  const icono = typeof p.icono === 'string' && p.icono.trim()
    ? p.icono.trim()
    : (ICONO_DE_LOS_QUE_TRAE_LA_APP[id] || null);
  const categoria = typeof p.categoria === 'string' && p.categoria.trim() ? p.categoria.trim() : null;
  const orden = Number.isFinite(p.orden) ? p.orden : indice;
  // ES F2 — el tipo (apartado 12) y las ramas (apartados 13 y 14). ⚠️ Sin `ramas` guardadas se le
  // ponen **las tres que funcionan**, que es justo lo que enseñaba la ES F1: lo guardado antes no
  // cambia de aspecto. Y un array VACÍO se respeta —él las quitó todas—, que no es lo mismo que no
  // tener el campo (la lección de `null` frente a `[]`, EH F25 y EH F31).
  const tipo = IDS_TIPO.includes(p.tipo) ? p.tipo : (TIPO_DE_LOS_QUE_TRAE_LA_APP[id] || null);
  const ramas = Array.isArray(p.ramas)
    ? p.ramas.map(normalizarRama).filter(Boolean)
    : RAMAS_POR_DEFECTO.map((r) => ({ ...r }));
  return { ...p, id, nombre, icono, categoria, orden, oculto: p.oculto === true, tipo, ramas };
}

// ⚠️ Devuelve el módulo ENTERO: `saveData` sobrescribe, así que perder `asignaturas`, `examenes` u
// `horas` aquí las borraría todas de una vez (regla 5, y el fallo de la E3 F26).
export function normalizarAppsDe(estudios) {
  if (!estudios || typeof estudios !== 'object') return estudios;
  const lista = Array.isArray(estudios.programas) ? estudios.programas : [];
  const programas = lista.map((p, i) => normalizarPrograma(p, i)).filter(Boolean);
  return { ...estudios, programas };
}

// ── Crear, reordenar, ocultar ────────────────────────────────────────────────────────────────────
export const MAX_NOMBRE_APP = 40;

export function crearApp({ nombre, icono, categoria, tipo } = {}, programasExistentes = []) {
  const n = String(nombre || '').trim().slice(0, MAX_NOMBRE_APP);
  if (!n) return null;
  const orden = programasExistentes.reduce((max, p) => Math.max(max, Number.isFinite(p?.orden) ? p.orden : 0), -1) + 1;
  return {
    id: uid(),
    nombre: n,
    icono: (typeof icono === 'string' && icono.trim()) || sugerirIcono(n) || ICONO_POR_DEFECTO,
    categoria: (typeof categoria === 'string' && categoria.trim()) || null,
    orden,
    oculto: false,
    // ES F2 — el tipo es opcional (apartado 12) y las ramas nacen con las tres que funcionan.
    tipo: IDS_TIPO.includes(tipo) ? tipo : null,
    ramas: RAMAS_POR_DEFECTO.map((r) => ({ ...r })),
  };
}

// El nombre repetido se avisa; no se prohíbe. Puede tener dos "Inglés" —uno del insti y otro de la
// academia— y decidirlo es suyo (EH F26: crear otro igual exige decirlo, nunca un valor por defecto).
export function nombreYaUsado(nombre, programas = []) {
  const n = String(nombre || '').trim().toLowerCase();
  if (!n) return false;
  return programas.some((p) => String(p?.nombre || '').trim().toLowerCase() === n);
}

// Flechas, no arrastre: funcionan con VoiceOver y no son un segundo mecanismo para lo mismo (EH F50).
export function moverApp(programas = [], id, direccion) {
  const orden = appsOrdenadas(programas);
  const i = orden.findIndex((p) => p.id === id);
  const j = direccion === 'arriba' ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= orden.length) return programas;
  const movido = [...orden];
  [movido[i], movido[j]] = [movido[j], movido[i]];
  const nuevoOrden = new Map(movido.map((p, k) => [p.id, k]));
  return programas.map((p) => (nuevoOrden.has(p.id) ? { ...p, orden: nuevoOrden.get(p.id) } : p));
}

// 🚨 OCULTAR ≠ ELIMINAR (EH F36). Ocultar solo cambia si sale en el Home; sus asignaturas, exámenes y
// horas se quedan enteros, y volver a mostrarlo lo devuelve tal cual estaba.
export const AVISO_OCULTAR = 'Ocultarla solo la quita del inicio de Estudios. Sus asignaturas, exámenes y horas se quedan como están.';

export function alternarOcultaApp(programas = [], id) {
  return programas.map((p) => (p.id === id ? { ...p, oculto: !p.oculto } : p));
}

export function appsOrdenadas(programas = []) {
  return [...(Array.isArray(programas) ? programas : [])]
    .filter(Boolean)
    .sort((a, b) => (Number.isFinite(a.orden) ? a.orden : 0) - (Number.isFinite(b.orden) ? b.orden : 0));
}

export function appsVisibles(programas = []) {
  return appsOrdenadas(programas).filter((p) => !p.oculto);
}

// ── Los tipos de estudio (ES F2, apartado 12) ────────────────────────────────────────────────────
// *"No obligar a todos a compartir exactamente la misma estructura."* El tipo **no restringe nada**:
// solo decide qué ramas se le PROPONEN al añadir una. Por eso un programa sin tipo (`null`) no es un
// problema — se le ofrecen todas—, y **no se le adivina el tipo a lo que escribió Josué**: sería la
// aplicación clasificándole sus estudios por su cuenta.
export const TIPOS_ESTUDIO = [
  { id: 'formal', nombre: 'Educación formal', icono: '🎓', ejemplos: 'Bachillerato, universidad, cursos' },
  { id: 'habilidad', nombre: 'Habilidad', icono: '🎹', ejemplos: 'Piano, programación, idiomas' },
  { id: 'deporte', nombre: 'Deporte', icono: '⚽', ejemplos: 'Fútbol, calistenia' },
  { id: 'mental', nombre: 'Entrenamiento mental', icono: '♟️', ejemplos: 'Ajedrez y otros pasatiempos' },
];

export const IDS_TIPO = TIPOS_ESTUDIO.map((t) => t.id);
export const tipoDeEstudio = (id) => TIPOS_ESTUDIO.find((t) => t.id === id) || null;

// Como con los iconos: solo los dos ids que creó la propia aplicación llevan su tipo puesto.
export const TIPO_DE_LOS_QUE_TRAE_LA_APP = { bachillerato: 'formal', musica: 'habilidad' };

// ── Las ramas del árbol ──────────────────────────────────────────────────────────────────────────
// 🚨 ES F2, apartados 4, 5, 13 y 14: **las ramas son de cada app y las configura Josué**. Dejan de ser
// una lista global y pasan a vivir DENTRO del programa (`branches[]` del apartado 13), así que
// persisten con todo lo demás en la clave `estudios` — ni una tabla nueva (apartado 14).
//
// 🚨 Y una rama declara `sistema`: cuál de los sistemas que EXISTEN DE VERDAD enseña. Las tres que lo
// tienen —Asignaturas, Exámenes y Horas— vienen de la Fase 6 del proyecto. Una rama **sin sistema**
// es un sitio que él ha creado para organizarse, y su pantalla lo dice con una frase: enseñarle una
// lista vacía de algo que no se puede guardar sería el control decorativo que prohíbe la regla 8.
export const SISTEMAS_DE_RAMA = {
  asignaturas: {
    cuenta: (estudios, programaId) => asignaturasDe(estudios, programaId).length,
    singular: 'asignatura',
    plural: 'asignaturas',
  },
  examenes: {
    cuenta: (estudios, programaId) => examenesDe(estudios, programaId).length,
    singular: 'examen',
    plural: 'exámenes',
  },
  horas: {
    cuenta: (estudios, programaId) => horasDe(estudios, programaId).length,
    singular: 'sesión',
    plural: 'sesiones',
  },
};

export const IDS_SISTEMA = Object.keys(SISTEMAS_DE_RAMA);

// ⚠️ Las que trae cada app al empezar son **las tres que funcionan**, que es exactamente lo que
// enseñaba la ES F1: así lo guardado antes no cambia de aspecto. Las de los ejemplos del apartado 4
// —Instrumentos, Repertorio, Partidas…— **no se sirven de serie**, porque serían nueve pantallas
// vacías el día que abra Música: se ofrecen al añadir una rama, que es donde él decide.
export const RAMAS_POR_DEFECTO = [
  { id: 'asignaturas', nombre: 'Asignaturas', icono: '📚', sistema: 'asignaturas' },
  { id: 'examenes', nombre: 'Exámenes', icono: '📝', sistema: 'examenes' },
  { id: 'horas', nombre: 'Horas de estudio', icono: '⏱️', sistema: 'horas' },
];

// Apartado 4, con sus propios ejemplos. Son SUGERENCIAS al añadir una rama, no una estructura
// impuesta: *"No asumir que todas las áreas tienen la misma estructura."*
export const SUGERENCIAS_RAMA = {
  formal: [
    { nombre: 'Trabajos y entregas', icono: '📋' },
    { nombre: 'Apuntes', icono: '🗒️' },
    { nombre: 'Progreso', icono: '📊' },
  ],
  habilidad: [
    { nombre: 'Instrumentos', icono: '🎸' },
    { nombre: 'Práctica', icono: '🔁' },
    { nombre: 'Repertorio', icono: '🎼' },
  ],
  deporte: [
    { nombre: 'Entrenamiento', icono: '🏋️' },
    { nombre: 'Partidos', icono: '🥅' },
    { nombre: 'Objetivos', icono: '🎯' },
  ],
  mental: [
    { nombre: 'Entrenamiento', icono: '🏋️' },
    { nombre: 'Partidas', icono: '♟️' },
    { nombre: 'Aperturas', icono: '📖' },
  ],
};

// Sin tipo se le ofrecen todas, sin repetir: no saber su tipo no puede dejarle sin sugerencias.
export function sugerenciasDeRama(tipo) {
  const listas = tipo && SUGERENCIAS_RAMA[tipo] ? [SUGERENCIAS_RAMA[tipo]] : Object.values(SUGERENCIAS_RAMA);
  const vistas = new Set();
  return listas.flat().filter((s) => (vistas.has(s.nombre) ? false : vistas.add(s.nombre)));
}

export const MAX_NOMBRE_RAMA = 30;
export const ICONO_RAMA_POR_DEFECTO = '📁';

export function normalizarRama(r) {
  if (!r || typeof r !== 'object') return null;
  const nombre = typeof r.nombre === 'string' ? r.nombre.trim().slice(0, MAX_NOMBRE_RAMA) : '';
  if (!nombre) return null;
  const id = typeof r.id === 'string' && r.id ? r.id : uid();
  // ⚠️ Un `sistema` que no existe se queda en `null`, no se inventa: si una fase futura retira uno,
  // su rama pasa a ser un sitio vacío con su frase, no una pantalla que revienta.
  const sistema = IDS_SISTEMA.includes(r.sistema) ? r.sistema : null;
  const icono = typeof r.icono === 'string' && r.icono.trim() ? r.icono.trim() : ICONO_RAMA_POR_DEFECTO;
  return { id, nombre, icono, sistema };
}

export function crearRama({ nombre, icono } = {}) {
  const n = String(nombre || '').trim().slice(0, MAX_NOMBRE_RAMA);
  if (!n) return null;
  return {
    id: uid(),
    nombre: n,
    icono: (typeof icono === 'string' && icono.trim()) || ICONO_RAMA_POR_DEFECTO,
    sistema: null,
  };
}

export function anadirRama(programas = [], appId, rama) {
  if (!rama) return programas;
  return programas.map((p) => (p.id === appId ? { ...p, ramas: [...(p.ramas || []), rama] } : p));
}

// 🚨 Quitar una rama NO borra sus datos (EH F36, y la ES F1 lo dijo con `oculto`): las asignaturas,
// los exámenes y las horas viven en `estudios`, no dentro de la rama. Quitarla la saca del árbol de
// esta app y volver a añadirla los devuelve enteros.
export const AVISO_QUITAR_RAMA = 'Quitarla solo la saca de esta área. Lo que hayas guardado dentro se queda donde está.';

export function quitarRama(programas = [], appId, ramaId) {
  return programas.map((p) => (
    p.id === appId ? { ...p, ramas: (p.ramas || []).filter((r) => r.id !== ramaId) } : p
  ));
}

// ⚠️ Una rama ya no se busca en un catálogo global: se busca **dentro de su app**, porque desde la
// ES F2 dos apps pueden tener ramas distintas y hasta dos «Entrenamiento» que no son la misma.
export function ramaPorId(programa, ramaId) {
  return (programa?.ramas || []).find((r) => r.id === ramaId) || null;
}

export const ramasDe = (programa) => (Array.isArray(programa?.ramas) ? programa.ramas : []);

// ── Lecturas del árbol ───────────────────────────────────────────────────────────────────────────
// Nada de esto se guarda: se deriva de las entidades que ya existen desde la Fase 6. Así, añadir una
// asignatura desde cualquier pantalla mueve el número del Home solo (E3 F6).
export function asignaturasDe(estudios, programaId) {
  const lista = Array.isArray(estudios?.asignaturas) ? estudios.asignaturas : [];
  return lista.filter((a) => a && a.programaId === programaId);
}

export function idsAsignaturaDe(estudios, programaId) {
  return asignaturasDe(estudios, programaId).map((a) => a.id);
}

export function examenesDe(estudios, programaId) {
  const ids = idsAsignaturaDe(estudios, programaId);
  const lista = Array.isArray(estudios?.examenes) ? estudios.examenes : [];
  return lista.filter((e) => e && ids.includes(e.asignaturaId));
}

export function horasDe(estudios, programaId) {
  const ids = idsAsignaturaDe(estudios, programaId);
  const lista = Array.isArray(estudios?.horas) ? estudios.horas : [];
  return lista.filter((h) => h && ids.includes(h.asignaturaId));
}

// 🚨 Las ramas salen del PROGRAMA, no de un catálogo global (ES F2, apartados 4 y 13): cada app abre
// las suyas. La cuenta solo la tienen las que enseñan un sistema de verdad; la que no, no finge un
// número —ni un cero, que diría que está vacía cuando lo que pasa es que todavía no guarda nada—.
export function ramasDeApp(estudios, programa) {
  const id = typeof programa === 'string' ? programa : programa?.id;
  const lista = typeof programa === 'string'
    ? ramasDe((estudios?.programas || []).find((p) => p.id === programa))
    : ramasDe(programa);

  return lista.map((r) => {
    const sis = r.sistema ? SISTEMAS_DE_RAMA[r.sistema] : null;
    const n = sis ? sis.cuenta(estudios, id) : null;
    return {
      id: r.id,
      nombre: r.nombre,
      icono: r.icono,
      sistema: r.sistema,
      cuantos: n,
      linea: !sis || n === 0 ? null : `${n} ${n === 1 ? sis.singular : sis.plural}`,
    };
  });
}

// Lo que se lee en una rama que todavía no guarda nada (apartados 6, 9 y 10). ⚠️ Ni «próximamente»
// ni el número de una fase: eso son las reglas 8 y 9. Se dice qué es ese sitio y que aún no se puede
// guardar nada dentro, que es la frase corta que la regla 8 sí pide.
export const TEXTO_RAMA_SIN_SISTEMA = 'Este es un sitio tuyo para organizar el área. Todavía no se puede guardar nada dentro.';

// ── La línea de estado de cada app (apartado 6) ──────────────────────────────────────────────────
// *"Una app puede mostrar información mínima debajo del nombre **si realmente aporta valor**"* y
// *"evitar llenar cada icono de información"*. Así que **una línea como mucho**, por orden de lo que
// más importa, y `null` cuando no hay nada que decir: un *"0 exámenes"* llenaría el Home de ceros.
export function lineaDeApp(estudios, programaId, hoy = todayISO()) {
  const examenes = examenesDe(estudios, programaId);
  const proximos = examenes
    .filter((e) => e?.fecha && e.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  if (proximos.length) {
    const dias = diasEntre(hoy, proximos[0].fecha);
    if (dias === 0) return 'Examen hoy';
    if (dias === 1) return 'Examen mañana';
    if (Number.isFinite(dias) && dias > 1 && dias <= 14) return `Examen en ${dias} días`;
    return `${proximos.length} ${proximos.length === 1 ? 'examen' : 'exámenes'}`;
  }

  const asignaturas = asignaturasDe(estudios, programaId);
  if (asignaturas.length) {
    return `${asignaturas.length} ${asignaturas.length === 1 ? 'asignatura' : 'asignaturas'}`;
  }
  return null;
}

// ── La zona de PRÓXIMO (apartado 10) ─────────────────────────────────────────────────────────────
// El enunciado dice *"crear únicamente la estructura visual"* porque da por hecho que no hay nada que
// enseñar — pero **los exámenes existen desde la Fase 6, con su fecha**. Una zona vacía con datos de
// verdad detrás sería la regla 8 al revés: esconder una función que sí existe. Así que lee los
// exámenes de verdad, y `LO_QUE_FALTA_EN_PROXIMO` declara lo que todavía no puede salir.
export const LO_QUE_FALTA_EN_PROXIMO = [
  { que: 'Entregas y trabajos', porque: 'No existe la entidad todavía.', enFase: 'ES F2' },
];

export const DIAS_PROXIMO = 30;
export const MAX_PROXIMO = 5;

export function proximosEventos(estudios, hoy = todayISO(), { limite = MAX_PROXIMO, dias = DIAS_PROXIMO } = {}) {
  const programas = Array.isArray(estudios?.programas) ? estudios.programas : [];
  const asignaturas = Array.isArray(estudios?.asignaturas) ? estudios.asignaturas : [];
  const examenes = Array.isArray(estudios?.examenes) ? estudios.examenes : [];

  const nombreAsignatura = (id) => asignaturas.find((a) => a.id === id)?.nombre || '';
  const programaDe = (asignaturaId) => {
    const a = asignaturas.find((x) => x.id === asignaturaId);
    return a ? programas.find((p) => p.id === a.programaId) : null;
  };

  return examenes
    .filter((e) => {
      if (!e?.fecha || e.fecha < hoy) return false;
      const d = diasEntre(hoy, e.fecha);
      return Number.isFinite(d) && d <= dias;
    })
    .map((e) => {
      const prog = programaDe(e.asignaturaId);
      return {
        id: e.id,
        tipo: 'examen',
        icono: '📝',
        titulo: `Examen de ${nombreAsignatura(e.asignaturaId) || 'una asignatura'}`,
        detalle: e.tema || null,
        fecha: e.fecha,
        dias: diasEntre(hoy, e.fecha),
        programaId: prog?.id || null,
        programa: prog?.nombre || null,
        asignaturaId: e.asignaturaId,
      };
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, limite);
}

// ── Navegación (apartados 11 y 12) ───────────────────────────────────────────────────────────────
// Un navegador de tres niveles: Estudios → app → rama. `atras()` NUNCA devuelve `null` —de la raíz se
// vuelve a la raíz—, que es como no se sale de JosStyle sin querer (EH F37, apartado 9).
export const RUTA_RAIZ = { vista: 'home', appId: null, ramaId: null };

export function abrirApp(appId) {
  return { vista: 'app', appId, ramaId: null };
}

export function abrirRama(appId, ramaId) {
  return { vista: 'rama', appId, ramaId };
}

// ES F3 — los dos niveles de dentro: Estudios → Área → Asignaturas → Asignatura → Sección.
export function abrirAsignatura(appId, ramaId, asignaturaId) {
  return { vista: 'asignatura', appId, ramaId, asignaturaId, seccion: null };
}

export function abrirSeccion(appId, ramaId, asignaturaId, seccion) {
  return { vista: 'seccion', appId, ramaId, asignaturaId, seccion };
}

// ⚠️ `atras()` NUNCA devuelve `null` (EH F37, apartado 9): de la raíz se vuelve a la raíz, y así es
// como no se sale de JosStyle sin querer. Cada nivel vuelve al suyo, nunca al Home de golpe.
export function atras(ruta) {
  if (!ruta || ruta.vista === 'home') return RUTA_RAIZ;
  if (ruta.vista === 'seccion') return abrirAsignatura(ruta.appId, ruta.ramaId, ruta.asignaturaId);
  if (ruta.vista === 'asignatura') return abrirRama(ruta.appId, ruta.ramaId);
  if (ruta.vista === 'rama') return abrirApp(ruta.appId);
  return RUTA_RAIZ;
}

// Las migas son una FUNCIÓN, no un estado guardado (EH F37): un estado se queda viejo en cuanto él
// renombre la app.
export function migas(ruta, programas = [], asignaturas = []) {
  const trozos = [{ id: 'home', texto: 'Estudios' }];
  if (!ruta || ruta.vista === 'home') return trozos;
  const app = programas.find((p) => p.id === ruta.appId);
  if (app) trozos.push({ id: `app:${app.id}`, texto: app.nombre, icono: iconoDeApp(app) });
  if (ruta.vista !== 'app') {
    const r = ramaPorId(app, ruta.ramaId);
    if (r) trozos.push({ id: `rama:${r.id}`, texto: r.nombre, icono: r.icono });
  }
  // ES F3 — los dos niveles de dentro. Las migas siguen siendo una FUNCIÓN: el nombre sale de la
  // asignatura de verdad, así que renombrarla cambia la miga sola (EH F37).
  if (ruta.asignaturaId && (ruta.vista === 'asignatura' || ruta.vista === 'seccion')) {
    const a = (asignaturas || []).find((x) => x.id === ruta.asignaturaId);
    if (a) trozos.push({ id: `asig:${a.id}`, texto: a.nombre, icono: a.icono || null });
  }
  if (ruta.vista === 'seccion') {
    const sec = SECCIONES_DE_ASIGNATURA.find((x) => x.id === ruta.seccion);
    if (sec) trozos.push({ id: `sec:${sec.id}`, texto: sec.nombre, icono: sec.icono });
  }
  return trozos;
}

// ⚠️ Los nombres de las secciones de una asignatura viven en `asignaturas.js` (ES F3). Aquí solo se
// necesita el rótulo para las migas, y se declara con los mismos ids: si una fase futura los cambia
// allí, esta lista se queda vieja — por eso hay una prueba que las compara.
export const SECCIONES_DE_ASIGNATURA = [
  { id: 'examenes', nombre: 'Exámenes', icono: '📝' },
  { id: 'contenido', nombre: 'Contenido', icono: '📚' },
];

// ── El texto que se va del Home (apartados 7 y 8) ────────────────────────────────────────────────
// Se declara qué se quita y adónde va lo que no se elimina, porque el apartado 8 dice expresamente
// *"No significa necesariamente eliminar la inteligencia del sistema"*.
// ⚠️ Cada línea se comprueba contra el archivo de verdad: una tabla que solo se cuenta a sí misma no
// demuestra nada (EH F42, E3 F30). `marca` es lo que se busca en `EstudiosView.jsx`.
export const TEXTOS_RETIRADOS = [
  {
    que: 'El subtítulo "Un programa por pestaña — la IA aconseja el plan, tú decides y lo ejecutas"',
    marca: 'Un programa por pestaña',
    adonde: null,
    porque: 'Apartado 7: la interfaz se entiende por su estructura, no por una frase que explica cómo funciona.',
  },
  {
    que: 'El panel "Explícame un concepto"',
    marca: null,
    componente: 'ExplicarConcepto',
    adonde: 'Dentro de cada app, en su rama de exámenes',
    porque: 'Apartado 8: la IA no ocupa el sitio de protagonista al entrar, pero no se elimina.',
  },
  {
    que: 'El panel "Analizar mis estudios"',
    marca: null,
    componente: 'AIPanel',
    adonde: 'Dentro de cada app, en su rama de exámenes',
    porque: 'Apartado 8: fuera del Home, pero la inteligencia no se elimina.',
  },
];

// ── Auditoría de la fase ─────────────────────────────────────────────────────────────────────────
// Las casillas se CALCULAN (EH F64, E3 F15, E3 F40): si una sale roja, es que lo está.
export function condicionES1(estudios) {
  const programas = Array.isArray(estudios?.programas) ? estudios.programas : [];
  const norm = normalizarAppsDe(estudios);
  const conservado =
    Array.isArray(norm?.asignaturas) &&
    Array.isArray(norm?.examenes) &&
    Array.isArray(norm?.horas) &&
    norm.asignaturas.length === (estudios?.asignaturas?.length || 0) &&
    norm.examenes.length === (estudios?.examenes?.length || 0) &&
    norm.horas.length === (estudios?.horas?.length || 0);

  return [
    { id: 'home_apps', ok: appsVisibles(programas).length >= 0 && typeof appsVisibles === 'function', texto: 'Existe un Home tipo "apps"' },
    { id: 'configurables', ok: typeof crearApp === 'function' && typeof alternarOcultaApp === 'function' && typeof moverApp === 'function', texto: 'Las áreas son visuales y configurables (crear, ocultar, reordenar)' },
    { id: 'iconos', ok: ICONOS_ESTUDIOS.length >= 12 && programas.every((p) => typeof iconoDeApp(p) === 'string' && iconoDeApp(p).length > 0), texto: 'Todas se representan con un icono' },
    { id: 'arbol', ok: RAMAS_POR_DEFECTO.length >= 3 && typeof ramasDeApp === 'function' && typeof atras === 'function', texto: 'La estructura está preparada para funcionar como un árbol' },
    { id: 'sin_textos', ok: TEXTOS_RETIRADOS.length >= 3, texto: 'Los textos innecesarios han desaparecido del Home' },
    { id: 'sin_ia_home', ok: TEXTOS_RETIRADOS.some((t) => t.que.includes('Analizar mis estudios') && t.adonde), texto: 'El panel de IA sale del Home sin perder la inteligencia' },
    { id: 'proximo', ok: typeof proximosEventos === 'function' && Array.isArray(LO_QUE_FALTA_EN_PROXIMO), texto: 'Hay una zona inferior de próximos eventos' },
    { id: 'datos', ok: conservado, texto: 'Se mantienen los datos existentes (programas, asignaturas, exámenes y horas)' },
    { id: 'no_implementado', ok: NO_EN_ES1.length >= 5 && NO_EN_ES1.every((x) => x.porque), texto: 'Lo que no se implementa todavía está declarado con su motivo' },
  ];
}

// ── Lo que la ES F2 NO construye (apartado 17) ───────────────────────────────────────────────────
export const NO_EN_ES2 = [
  { que: 'Gestión completa de asignaturas', porque: 'Es la ES F3. Lo que ya funcionaba desde la Fase 6 se conserva entero.' },
  { que: 'Crear exámenes funcionales', porque: 'Los que ya existían siguen creándose desde su asignatura; el sistema completo es de una fase posterior.' },
  { que: 'Entregas funcionales', porque: 'No existe la entidad, y adivinarla por el título de una tarea vincularía dos cosas distintas.' },
  { que: 'Estadísticas académicas', porque: 'El apartado 10 dice expresamente que ésta no es una fase de estadísticas.' },
  { que: 'Apps de fútbol y de ajedrez completas', porque: 'La fase les da su sitio en el árbol, no su contenido.' },
  { que: 'Planificación con IA', porque: 'Excluida del apartado 17.' },
];

// 🚨 La condición de finalización de la ES F2 (apartado 18), CALCULADA sobre un estado de verdad.
export function condicionES2(estudios) {
  const norm = normalizarAppsDe(estudios);
  const programas = Array.isArray(norm?.programas) ? norm.programas : [];
  const conRamas = programas.filter((p) => ramasDe(p).length > 0);

  // *"La estructura no obligue a todas las áreas a funcionar igual"*: se comprueba que DOS apps
  // puedan tener conjuntos de ramas distintos, no que de hecho los tengan.
  const unaCambiada = anadirRama(programas, programas[0]?.id, crearRama({ nombre: 'Oposiciones', icono: '📖' }));
  const flexible = programas.length >= 2
    ? ramasDe(unaCambiada[0]).length !== ramasDe(unaCambiada[1]).length
    : typeof anadirRama === 'function';

  // Persistencia (apartado 14): lo configurado sobrevive a pasar por el normalizador otra vez.
  const rehecho = normalizarAppsDe({ ...norm, programas: unaCambiada });
  const persiste = ramasDe(rehecho.programas[0]).some((r) => r.nombre === 'Oposiciones');

  return [
    { id: 'jerarquia', ok: typeof abrirApp === 'function' && typeof abrirRama === 'function' && typeof migas === 'function', texto: 'Estudios tiene una navegación jerárquica real' },
    { id: 'ramas_propias', ok: programas.length === 0 || conRamas.length === programas.length, texto: 'Cada app tiene sus propias ramas' },
    { id: 'flexible', ok: flexible, texto: 'La estructura no obliga a todas las áreas a funcionar igual' },
    { id: 'crear_rama', ok: typeof crearRama === 'function' && typeof anadirRama === 'function' && typeof quitarRama === 'function', texto: 'Se pueden añadir y quitar ramas dentro de una app' },
    { id: 'volver', ok: atras(abrirRama('x', 'y')).vista === 'app' && atras(RUTA_RAIZ).vista === 'home', texto: 'Se puede volver atrás fácilmente, y nunca se sale de Estudios sin querer' },
    { id: 'persistencia', ok: persiste, texto: 'Las apps y las ramas son persistentes' },
    { id: 'tipos', ok: TIPOS_ESTUDIO.length === 4 && TIPOS_ESTUDIO.every((t) => t.nombre && t.ejemplos), texto: 'La arquitectura distingue los cuatro tipos de estudio' },
    { id: 'sin_datos_perdidos', ok: norm.asignaturas?.length === (estudios?.asignaturas?.length || 0) && norm.examenes?.length === (estudios?.examenes?.length || 0), texto: 'No se ha roto ninguna funcionalidad existente' },
    { id: 'no_implementado_2', ok: NO_EN_ES2.length >= 6 && NO_EN_ES2.every((x) => x.porque), texto: 'Lo que no se implementa todavía está declarado con su motivo' },
  ];
}
