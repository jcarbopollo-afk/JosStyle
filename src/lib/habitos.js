// ══════════════════════════════════════════════════════════════════════════
// ENTREGA 3 · FASE 24 (PR F2) — PRODUCTIVIDAD: HÁBITOS
// ══════════════════════════════════════════════════════════════════════════
//
// *"El usuario debe poder entrar, ver inmediatamente qué hábitos tiene que hacer
//  hoy y marcarlos con un toque."*
//
// 🚨 **AQUÍ NO SE CALCULA NI UNA RACHA.** El motor es `rachas.js` (RA F1), y
//    todo lo que tenga que ver con rachas, historial, porcentajes y estados de
//    día sale de `resumenHabito()`. Escribir un segundo cálculo es exactamente
//    cómo se acaba con la pantalla de Hábitos diciendo 15 y el Centro de Rachas
//    16 — el problema que la RA F1 se propuso no volver a tener. Hay pruebas que
//    leen este archivo y fallan si aparece un bucle de fechas propio.
//
// 🚨 **Y LAS DOS FRECUENCIAS NUEVAS SON DEL MOTOR, NO DE AQUÍ.** El enunciado
//    pide *"todos los días / días concretos / X veces por semana"*, y las dos
//    últimas no existían. Se han añadido a `CLASES_REGLA` —`dias_concretos` y
//    `veces_por_semana`—, con un quinto estado de día, `NO_TOCA`, que es lo que
//    cumple el apartado más importante de la fase: *"No implementar una lógica
//    absurda de perder la racha… **la lógica debe respetar la frecuencia
//    configurada**"*. Sin él, un hábito de tres días por semana perdería la racha
//    cada martes.
//
//    ⚠️ Es el reparto de EH F14: **la lista de frecuencias es del módulo, el
//    comportamiento es del motor.** Cada línea de `FRECUENCIAS_HABITO` declara la
//    regla que le corresponde; ninguna reimplementa nada.
//
// ⏸ **Y UNA CONTRADICCIÓN DEL ENUNCIADO, ANOTADA COMO C-29** (regla 49). Pide
//    *"un registro separado para las completaciones/historial. **No guardar todo
//    el historial dentro de un único campo del hábito**"*… y tres párrafos
//    después: *"Utiliza el sistema de persistencia que actualmente tenga el
//    proyecto… **No crear una segunda base de datos. No crear almacenamiento
//    paralelo innecesario**"*.
//
//    Manda la segunda, y no es una decisión propia: la primera describe una base
//    de datos con tablas, y **JosStyle no tiene ninguna** — `app_data` guarda una
//    fila por (usuario, clave) con un JSON dentro. Una "tabla" de completaciones
//    sería otra lista dentro del **mismo** JSON, que habría que sincronizar a mano
//    y que dejaría marcas colgando de hábitos borrados (la lección de E3 F20 con
//    las etiquetas). Y movería el suelo de `rachas.js`, `rachasHoy.js` (E3 F2),
//    `hoy.js` y `puntuacion.js`, que leen `habito.historial` desde la Fase 6.
//    **Se le pregunta a Josué al cerrar el turno; no bloquea nada.**

import { todayISO, fechaLocalISO, uid } from './helpers.js';
import {
  CLASES_REGLA, describirRegla, resumenHabito, alternarHabito, rachaDeHabito,
  eventosDeHistorial, estadoDeDia, ESTADOS_DIA, indicePorFecha,
  diaDeLaSemana, diasDeRegla, vecesDeRegla, tocaEseDia, lunesDe,
  NOMBRES_DIA, NOMBRES_DIA_CORTOS, REGLA_HABITO,
} from './rachas.js';
import { addDays } from './helpers.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const txt = (s) => (typeof s === 'string' ? s : '');

/* Se reexportan las piezas del motor que la pantalla necesita, para que no tenga
   que importar de dos sitios. ⚠️ `export { X }`, nunca `export … from`: eso no
   crea binding local y este archivo también las usa (EH F17). */
export {
  describirRegla, resumenHabito, alternarHabito, estadoDeDia, ESTADOS_DIA,
  NOMBRES_DIA, NOMBRES_DIA_CORTOS, diaDeLaSemana, diasDeRegla, vecesDeRegla,
};

/* ── Las frecuencias ──────────────────────────────────────────────────────

   *"Opciones: Todos los días · Días concretos · X veces por semana."*

   ⚠️ Cada línea dice **qué regla del motor la implementa**. Añadir una frecuencia
   es añadir una línea aquí y su clase en `CLASES_REGLA`; ni un `if` en la
   pantalla, que es lo que no se puede comprobar. */
export const FRECUENCIAS_HABITO = [
  {
    id: 'diaria',
    nombre: 'Todos los días',
    ayuda: 'Cuenta cada día. Se perdona un fallo suelto para no romper la racha por un mal día.',
    /* ⚠️ **Es la de siempre**: `diaria_con_gracia`, la que Josué ya tiene desde la
       Fase 8. Cambiarla por la estricta le rompería rachas vivas sin avisar. */
    regla: () => ({ ...REGLA_HABITO }),
    pide: 'nada',
  },
  {
    id: 'dias',
    nombre: 'Días concretos',
    ayuda: 'Elige los días de la semana. Los demás no cuentan ni rompen la racha.',
    regla: (opciones) => ({ clase: 'dias_concretos', dias: diasDeRegla({ dias: opciones?.dias }) }),
    pide: 'dias',
  },
  {
    id: 'semanal',
    nombre: 'Veces por semana',
    ayuda: 'Elige cuántas veces por semana. Los días los pones tú.',
    regla: (opciones) => ({ clase: 'veces_por_semana', veces: vecesDeRegla({ veces: opciones?.veces }) }),
    pide: 'veces',
  },
];

export const frecuenciaHabito = (id) => FRECUENCIAS_HABITO.find((f) => f.id === id) || FRECUENCIAS_HABITO[0];
export const FRECUENCIA_POR_DEFECTO = 'diaria';

/** De la regla guardada a la frecuencia que la pantalla enseña. Un hábito de
 *  antes de esta fase no tiene regla, así que es «todos los días» — que es
 *  exactamente como se ha comportado siempre. */
export function frecuenciaDe(habito) {
  const clase = habito?.regla?.clase;
  if (clase === 'dias_concretos') return frecuenciaHabito('dias');
  if (clase === 'veces_por_semana') return frecuenciaHabito('semanal');
  return frecuenciaHabito('diaria');
}

/** La regla efectiva de un hábito. Sin regla guardada, la de siempre. */
export const reglaDe = (habito) => (habito?.regla || { ...REGLA_HABITO });

/* ── Categorías e iconos ──────────────────────────────────────────────────

   *"Categoría. Opcional."* Las seis del enunciado, y **opcional de verdad**: un
   hábito sin categoría es válido y no se le pone una por defecto. */
export const CATEGORIAS_HABITO = [
  { id: 'salud', nombre: 'Salud' },
  { id: 'estudios', nombre: 'Estudios' },
  { id: 'fitness', nombre: 'Fitness' },
  { id: 'productividad', nombre: 'Productividad' },
  { id: 'personal', nombre: 'Personal' },
  { id: 'otros', nombre: 'Otros' },
];

export const categoriaHabito = (id) => CATEGORIAS_HABITO.find((c) => c.id === id) || null;

/* *"Icono. Seleccionable."* Nombres de Lucide; los componentes van en la vista,
   como `MINI_APPS`/`ICONOS_MINI_APP`. **Nada de emojis** (E3 F3). */
export const ICONOS_HABITO = [
  { id: 'Flame', nombre: 'Constancia' },
  { id: 'Droplet', nombre: 'Agua' },
  { id: 'BookOpen', nombre: 'Leer' },
  { id: 'Dumbbell', nombre: 'Ejercicio' },
  { id: 'Moon', nombre: 'Descanso' },
  { id: 'Apple', nombre: 'Comida' },
  { id: 'Brain', nombre: 'Estudio' },
  { id: 'Heart', nombre: 'Bienestar' },
];

export const ICONO_HABITO_POR_DEFECTO = 'Flame';
export const iconoHabitoValido = (id) => ICONOS_HABITO.some((i) => i.id === id);

/* ── El modelo ────────────────────────────────────────────────────────────

   El enunciado enumera los campos. Se construyen los que existen de verdad en
   esta arquitectura:

   · `user_id` **no es un campo**: la fila de `app_data` es del usuario, y ahí es
     donde vive el aislamiento (EH F43). Guardarlo dentro sería una copia que no
     protege nada.
   · `frequency` y `target` son **la regla**, que es lo que el motor entiende.
     Guardarlos aparte crearía dos fuentes de verdad sobre cuándo toca un hábito.
   · `active` → `activo`, para pausar sin borrar.
   · Y `historial` se queda donde estaba, por C-29. */
export const MAX_NOMBRE_HABITO = 120;

export const CAMPOS_HABITO = [
  'id', 'nombre', 'icono', 'categoria', 'regla', 'activo', 'historial', 'fecha', 'actualizado',
];

export function nombreHabitoValido(n) {
  return typeof n === 'string' && n.trim().length > 0 && n.trim().length <= MAX_NOMBRE_HABITO;
}

/** La regla que corresponde a una frecuencia y sus opciones. */
export function reglaDeFrecuencia(idFrecuencia, opciones = {}) {
  return frecuenciaHabito(idFrecuencia).regla(opciones);
}

/**
 * *"Nombre… Ejemplo: «Leer 20 minutos»"*. Sin nombre no se crea nada.
 *
 * ⚠️ **Y una frecuencia de «días concretos» sin ningún día no se acepta**: sería
 * un hábito que no toca nunca, y su racha no podría avanzar jamás.
 */
export function crearHabito({
  nombre, icono = ICONO_HABITO_POR_DEFECTO, categoria = null,
  frecuencia = FRECUENCIA_POR_DEFECTO, dias = [], veces = 1,
} = {}) {
  if (!nombreHabitoValido(nombre)) return null;
  const regla = reglaDeFrecuencia(frecuencia, { dias, veces });
  if (regla.clase === 'dias_concretos' && diasDeRegla(regla).length === 0) return null;
  const ahora = fechaLocalISO(new Date());
  return {
    id: uid(),
    nombre: nombre.trim(),
    icono: iconoHabitoValido(icono) ? icono : ICONO_HABITO_POR_DEFECTO,
    categoria: categoriaHabito(categoria) ? categoria : null,
    regla,
    activo: true,
    historial: {},
    fecha: ahora,
    actualizado: ahora,
  };
}

/* ── El normalizador ──────────────────────────────────────────────────────

   ⚠️ **Y es la vigesimosegunda vez de la misma lección.** Un hábito de la Fase 6
   es `{ id, nombre, historial }`; ésta le añade cinco campos. Sin ponerlos aquí,
   el primer guardado desde la pantalla nueva se llevaría por delante el icono, la
   categoría, la regla y el pausado de los hábitos que Josué ya tenga (regla 5).

   🚨 Y **un hábito de antes se queda exactamente como estaba**: sin `regla`, su
   frecuencia es la diaria con margen, que es como se ha comportado siempre. Una
   migración que le pusiera otra regla le rompería rachas vivas sin avisar. */
export function normalizarHabito(h) {
  if (!h || typeof h !== 'object') return null;
  const nombre = txt(h.nombre).trim();
  if (!nombre) return null;
  const fecha = txt(h.fecha);
  const clase = CLASES_REGLA[h?.regla?.clase] ? h.regla.clase : null;
  let regla;
  if (clase === 'dias_concretos') regla = { clase, dias: diasDeRegla(h.regla) };
  else if (clase === 'veces_por_semana') regla = { clase, veces: vecesDeRegla(h.regla) };
  else regla = { ...REGLA_HABITO };

  const historial = {};
  const guardado = h.historial && typeof h.historial === 'object' ? h.historial : {};
  for (const f of Object.keys(guardado)) if (guardado[f]) historial[f] = true;

  return {
    id: typeof h.id === 'string' && h.id ? h.id : uid(),
    nombre: nombre.slice(0, MAX_NOMBRE_HABITO),
    icono: iconoHabitoValido(h.icono) ? h.icono : ICONO_HABITO_POR_DEFECTO,
    categoria: categoriaHabito(h.categoria) ? h.categoria : null,
    regla,
    activo: h.activo !== false,
    historial,
    fecha,
    actualizado: txt(h.actualizado) || fecha,
  };
}

export const normalizarHabitos = (habitos) => lista(habitos).map(normalizarHabito).filter(Boolean);

const tocado = (h, cambios) => ({ ...h, ...cambios, actualizado: fechaLocalISO(new Date()) });

/** *"Cada hábito debe poder editarse."* El historial no se toca al editar: cambiar
 *  el nombre de un hábito no puede borrar lo que ya cumplió. */
export function editarHabito(h, cambios = {}) {
  if (!h) return h;
  const siguiente = { ...h };
  if ('nombre' in cambios) {
    if (!nombreHabitoValido(cambios.nombre)) return h;
    siguiente.nombre = cambios.nombre.trim();
  }
  if ('icono' in cambios && iconoHabitoValido(cambios.icono)) siguiente.icono = cambios.icono;
  if ('categoria' in cambios) siguiente.categoria = categoriaHabito(cambios.categoria) ? cambios.categoria : null;
  if ('frecuencia' in cambios) {
    const regla = reglaDeFrecuencia(cambios.frecuencia, cambios);
    /* Una frecuencia de días concretos sin días no se guarda: dejaría el hábito
       sin poder tocar nunca. Se queda como estaba. */
    if (regla.clase === 'dias_concretos' && diasDeRegla(regla).length === 0) return h;
    siguiente.regla = regla;
  }
  return tocado(h, siguiente);
}

/* ⚠️ *"Pausarse/desactivarse"* es **una tercera cosa**, ni completar ni eliminar:
   un hábito pausado deja de pedirse y **conserva su historial entero**. Es la
   lección de *archivar no es eliminar* (E3 F5 y E3 F18). */
export const pausarHabito = (h) => (h ? tocado(h, { activo: false }) : h);
export const reanudarHabito = (h) => (h ? tocado(h, { activo: true }) : h);

/* ── Qué toca hoy ─────────────────────────────────────────────────────────

   🚨 Todo esto se le pregunta al motor. Aquí no se mira ni un día del calendario
   a mano. */

/** ¿Este hábito pide algo hoy? Un hábito pausado no pide nada. */
export function tocaHoy(habito, hoy = todayISO()) {
  if (!habito || habito.activo === false) return false;
  const regla = reglaDe(habito);
  /* Una regla semanal toca todos los días **mientras queden veces por hacer**:
     «3 veces por semana» no elige los días, los elige él. */
  if (regla.clase === 'veces_por_semana') return vecesQuedanEstaSemana(habito, hoy) > 0;
  return tocaEseDia(hoy, regla);
}

export const hechoHoy = (habito, hoy = todayISO()) => !!(habito?.historial || {})[hoy];

/** Cuántas veces quedan esta semana en un hábito de «X veces por semana». */
export function vecesQuedanEstaSemana(habito, hoy = todayISO()) {
  const regla = reglaDe(habito);
  if (regla.clase !== 'veces_por_semana') return 0;
  const lunes = lunesDe(hoy);
  const hist = habito?.historial || {};
  let hechas = 0;
  for (let d = 0; d < 7; d++) if (hist[addDays(lunes, d)]) hechas++;
  return Math.max(0, vecesDeRegla(regla) - hechas);
}

/* ── El progreso del día ──────────────────────────────────────────────────

   *"Añadir un resumen de progreso del día. Ejemplo: 3 / 5 completados."*

   🚨 **Sin nada que hacer hoy no hay porcentaje.** Un hábito de lunes, miércoles
   y viernes deja el martes sin nada que completar; enseñar «0 %» ese día sería
   inventarse un mal día donde no tocaba nada (E3 F13). Devuelve `null`. */
export function progresoDelDia(habitos, hoy = todayISO()) {
  const activos = lista(habitos).filter((h) => h && h.activo !== false);
  const tocan = activos.filter((h) => tocaHoy(h, hoy) || hechoHoy(h, hoy));
  if (tocan.length === 0) return { hechos: 0, total: 0, porcentaje: null, hayQueHacer: false };
  const hechos = tocan.filter((h) => hechoHoy(h, hoy)).length;
  return {
    hechos,
    total: tocan.length,
    porcentaje: Math.round((hechos / tocan.length) * 100),
    hayQueHacer: true,
  };
}

/* ── Estadísticas de un hábito ────────────────────────────────────────────

   *"Cumplimiento · Racha actual · Mejor racha · Total de veces completado ·
   Historial."*

   🚨 **Todas salen de `resumenHabito`**, el del motor. Ni una se recalcula. */
export function estadisticasHabito(habito, hoy = todayISO()) {
  const r = resumenHabito(habito, hoy);
  const regla = reglaDe(habito);
  /* 🐛 **`resumenRacha` DESPARRAMA sus estadísticas en el primer nivel** —
     `...estadisticasRacha(...)`—, no las anida bajo `.estadisticas`. Leerlo mal
     devolvía `undefined` y reventaba al pedirle un campo. Es la lección de EH F18:
     antes de leer un campo de una función de otra fase, mirar qué devuelve. */
  return {
    rachaActual: r.actual,
    mejorRacha: r.record,
    /* La unidad importa: en «X veces por semana» la racha son SEMANAS, y decir
       "3 días" sería mentir. */
    unidad: regla.clase === 'veces_por_semana' ? 'semana' : 'dia',
    totalCompletado: r.diasCumplidos,
    porcentaje: r.porcentaje,
    primerDia: r.primerDia,
    estado: r.estado,
  };
}

/** El texto de una racha, con su unidad. `null` sin racha: **una racha de cero no
 *  se pinta**, no se enseña un cero apagado. */
export function textoRacha(habito, hoy = todayISO()) {
  const e = estadisticasHabito(habito, hoy);
  if (!e.rachaActual) return null;
  const n = e.rachaActual;
  if (e.unidad === 'semana') return `${n} ${n === 1 ? 'semana' : 'semanas'}`;
  return `${n} ${n === 1 ? 'día' : 'días'}`;
}

/* ── El historial visual ──────────────────────────────────────────────────

   *"L M X J V S D · ✓ ✓ ✓ ✕ ✓ ✓ ✓ … la visualización debe ser compacta y
   bonita."*

   ⚠️ Los estados salen de `estadoDeDia` del motor, incluido el `NO_TOCA` nuevo:
   un martes de un hábito de lunes y miércoles **no es una equis**, es un hueco. */
export function semanaDe(habito, hoy = todayISO()) {
  const racha = rachaDeHabito(habito);
  const indice = indicePorFecha(eventosDeHistorial(racha.id, habito?.historial), racha.id);
  const lunes = lunesDe(hoy);
  const regla = reglaDe(habito);
  return NOMBRES_DIA_CORTOS.map((letra, i) => {
    const fecha = addDays(lunes, i);
    return { letra, fecha, esHoy: fecha === hoy, estado: estadoDeDia(fecha, { indice, regla, hoy }) };
  });
}

/** Las últimas N semanas, para el mapa de calor. Compacto a propósito: *"no
 *  crear todavía estadísticas globales complejas"*. */
export const SEMANAS_HISTORIAL = 8;

export function historialCompacto(habito, hoy = todayISO(), semanas = SEMANAS_HISTORIAL) {
  const racha = rachaDeHabito(habito);
  const indice = indicePorFecha(eventosDeHistorial(racha.id, habito?.historial), racha.id);
  const regla = reglaDe(habito);
  const primerLunes = addDays(lunesDe(hoy), -7 * (Math.max(1, semanas) - 1));
  const salida = [];
  for (let s = 0; s < Math.max(1, semanas); s++) {
    const lunes = addDays(primerLunes, s * 7);
    salida.push({
      lunes,
      dias: Array.from({ length: 7 }, (_, i) => {
        const fecha = addDays(lunes, i);
        return { fecha, estado: estadoDeDia(fecha, { indice, regla, hoy }) };
      }),
    });
  }
  return salida;
}

/* ── Filtros ──────────────────────────────────────────────────────────────

   *"Todos · Hoy · Completados · Pendientes. **No sobrecargar la interfaz.**"* */
export const FILTROS_HABITOS = [
  { id: 'hoy', label: 'Hoy' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'completados', label: 'Completados' },
  { id: 'todos', label: 'Todos' },
];

export const FILTRO_HABITOS_POR_DEFECTO = 'hoy';

export function filtrarHabitos(habitos, filtro = FILTRO_HABITOS_POR_DEFECTO, hoy = todayISO()) {
  const todos = lista(habitos);
  /* ⚠️ Los pausados solo salen en "Todos": si aparecieran en "Hoy" pedirían algo
     que Josué ha decidido no hacer. */
  const activos = todos.filter((h) => h && h.activo !== false);
  if (filtro === 'todos') return todos;
  if (filtro === 'completados') return activos.filter((h) => hechoHoy(h, hoy));
  if (filtro === 'pendientes') return activos.filter((h) => tocaHoy(h, hoy) && !hechoHoy(h, hoy));
  return activos.filter((h) => tocaHoy(h, hoy) || hechoHoy(h, hoy));
}

/* ── El estado vacío ──────────────────────────────────────────────────────

   Los textos del enunciado, palabra por palabra. ⚠️ Con su botón: un vacío sin
   salida es una pantalla rota (EH F41). */
export const VACIO_HABITOS = {
  titulo: 'Empieza a construir tu constancia',
  frase: 'Los pequeños hábitos repetidos crean grandes cambios.',
  boton: 'Crear mi primer hábito',
};

/** El vacío de un filtro no es el vacío de la mini-app: con hábitos creados pero
 *  ninguno para hoy, lo que hay que decir es otra cosa. */
export function vacioDeFiltro(filtro, hoy = todayISO()) {
  if (filtro === 'completados') return 'Todavía no has completado ninguno hoy.';
  if (filtro === 'pendientes') return 'No te queda ninguno pendiente hoy.';
  if (filtro === 'hoy') return 'Hoy no te toca ninguno. Descansa.';
  return 'No tienes hábitos.';
}

/* ── Lo que Hoy podrá pedir ───────────────────────────────────────────────

   *"Preparar la información necesaria para que posteriormente el Dashboard/Hoy
   pueda mostrar… **Pero NO rehacer completamente Hoy en esta fase.**"*

   ⚠️ Así que esto **es una función de lectura**, no una pantalla: devuelve los
   números que Hoy pediría, sin escribir ni un texto suyo. `hoy.js` (HT F6) sigue
   siendo quien compone lo del día. */
export function paraHoy(habitos, hoy = todayISO()) {
  const p = progresoDelDia(habitos, hoy);
  const activos = lista(habitos).filter((h) => h && h.activo !== false);
  const pendientes = activos.filter((h) => tocaHoy(h, hoy) && !hechoHoy(h, hoy));
  /* La racha destacada es la más larga que esté viva, y `null` si no hay ninguna:
     nunca un cero (E3 F13). */
  let destacada = null;
  for (const h of activos) {
    const e = estadisticasHabito(h, hoy);
    if (e.rachaActual > 0 && (!destacada || e.rachaActual > destacada.dias)) {
      destacada = { id: h.id, nombre: h.nombre, dias: e.rachaActual, unidad: e.unidad };
    }
  }
  return {
    pendientes: pendientes.length,
    completados: p.hechos,
    total: p.total,
    porcentaje: p.porcentaje,
    rachaDestacada: destacada,
  };
}

export const HOY_NO_SE_REHACE = {
  rehecho: false,
  porQue: 'El enunciado lo prohíbe en esta fase. `paraHoy()` devuelve los números; quien compone lo del día sigue siendo `hoy.js` (HT F6).',
};

/* ── Lo que esta fase NO hace ─────────────────────────────────────────────── */
export const NO_EN_PR2 = [
  { que: 'Pomodoro, Tareas, Metas, Objetivos y Rutinas', llega: 'PR F3 a PR F6' },
  { que: 'El sistema global de estadísticas de Productividad', llega: 'no está previsto en este bloque' },
  { que: 'IA de productividad', llega: 'el enunciado la prohíbe, y la regla 7 dice que la IA nunca se dispara sola' },
  { que: 'Notificaciones avanzadas y recordatorios', llega: 'no está previsto en este bloque' },
  { que: 'Puntos, niveles o monedas por cumplir un hábito', llega: 'nunca: D2-02, no sobregamificar' },
];

/* ── Dónde se guarda ──────────────────────────────────────────────────────── */
export const DONDE_SE_GUARDA_HABITOS = [
  { que: 'Los hábitos y su historial', donde: 'la clave `productividad` de `app_data`, lista `habitos`', nuevo: false },
];

export const AISLAMIENTO_HABITOS = {
  clave: 'productividad',
  politicas: 'Las cuatro de `app_data`: `auth.uid() = user_id`.',
  tablasNuevas: 0,
  porQue: 'Un hábito vive en la fila de `app_data` de su usuario. No existe ninguna consulta por id que pueda alcanzar la de otro.',
};

/* ── La condición de finalización ─────────────────────────────────────────

   🚨 **Se CALCULA.** Nadie pone una casilla a `true`. */
export function condicionPR2(habitos = [], hoy = todayISO()) {
  const hs = normalizarHabitos(habitos);
  const uno = hs[0] || crearHabito({ nombre: 'Ejemplo' });
  /* ⚠️ Marcar y desmarcar se comprueba sobre un hábito **limpio**, no sobre el
     primero que haya: si ése ya estaba marcado hoy, alternarlo lo DESmarca y la
     casilla salía roja con un código perfecto. Una condición no puede depender de
     los datos que se le pasen. */
  const limpio = crearHabito({ nombre: 'Comprobación' });
  return [
    { id: 1, que: 'Se pueden crear hábitos', ok: !!crearHabito({ nombre: 'Leer 20 minutos' }) },
    { id: 2, que: 'Se pueden editar', ok: editarHabito(uno, { nombre: 'Otro' }).nombre === 'Otro' },
    { id: 3, que: 'Se pueden pausar sin perder el historial', ok: Object.keys(pausarHabito(uno).historial || {}).length === Object.keys(uno.historial || {}).length },
    { id: 4, que: 'Se pueden marcar y desmarcar', ok: hechoHoy(alternarHabito(limpio, hoy), hoy) && !hechoHoy(alternarHabito(alternarHabito(limpio, hoy), hoy), hoy) },
    { id: 5, que: 'El progreso del día se deriva, y sin nada que hacer no hay porcentaje', ok: progresoDelDia([], hoy).porcentaje === null },
    { id: 6, que: 'Las rachas respetan la frecuencia configurada', ok: !!CLASES_REGLA.dias_concretos && !!CLASES_REGLA.veces_por_semana && ESTADOS_DIA.NO_TOCA === 'no_toca' },
    { id: 7, que: 'Existe historial visual', ok: semanaDe(uno, hoy).length === 7 && historialCompacto(uno, hoy).length === SEMANAS_HISTORIAL },
    { id: 8, que: 'Existen estadísticas básicas', ok: ['rachaActual', 'mejorRacha', 'totalCompletado', 'porcentaje'].every((k) => k in estadisticasHabito(uno, hoy)) },
    { id: 9, que: 'Los datos persisten donde ya se guardaban', ok: DONDE_SE_GUARDA_HABITOS.every((d) => !d.nuevo) },
    { id: 10, que: 'El aislamiento es de la base de datos', ok: AISLAMIENTO_HABITOS.tablasNuevas === 0 },
    { id: 11, que: 'La información queda preparada para Hoy sin rehacerlo', ok: HOY_NO_SE_REHACE.rehecho === false && typeof paraHoy === 'function' },
    { id: 12, que: 'No se ha desarrollado ninguna de las otras cinco mini-apps', ok: NO_EN_PR2.some((x) => /Pomodoro/.test(x.que)) },
  ];
}

export const pr2Terminada = (habitos, hoy) => condicionPR2(habitos, hoy).every((c) => c.ok);
