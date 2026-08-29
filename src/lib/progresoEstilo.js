// ============================================================================
// EH · Fase 35/65 — ESTADÍSTICAS Y PROGRESO DE ESTILO ("📊 Mi progreso")
//
// *"Un sistema de estadísticas **muy ligero**. Y aquí hay una regla importante:
// **no todo necesita una estadística**. Estilo de hombre no debe parecer una
// aplicación de análisis."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ LA ESTADÍSTICA ES UNA VISTA CALCULADA, NO LA FUENTE DE DATOS**
// (apartado 13, con esas palabras). Así que **aquí no se guarda ni una cifra**:
// todo se cuenta en el momento sobre los historiales que ya existen. Lo único
// guardado son **sus preferencias de pantalla** —qué métricas quiere ver, qué
// periodo mira y si quiere ver esto— y por eso *"si elimina estadísticas, no
// eliminar los datos originales"* sale solo: no hay nada que eliminar.
//
// **2. ⚠️ NUNCA UNA NOTA Y NUNCA UNA COMPARACIÓN** (apartados 3 y 9). Ni
// *"tu estilo es 73/100"*, ni *"este mes eres mejor que el anterior"*. Se
// enseña **lo que hay**: *"esta semana, 5 rutinas"*. La auditoría lo declara con
// ceros y una prueba barre todos los textos buscando un juicio.
//
// **3. ⚠️ NI UNA RACHA NUEVA NI OTRO SISTEMA DE OBJETIVOS** (apartados 7 y 8).
// La racha es **la global**, y si no la tiene **no se pinta** —mismo criterio
// que la F23—; el objetivo se lee del sistema global por el puente que ya hizo
// la F28. Cero contadores guardados.
//
// **4. ⚠️ OCULTAR (apartado 1) Y QUITAR EL PROGRESO (12) SON EL MISMO
// INTERRUPTOR.** Cuarta vez en cinco fases que un enunciado describe lo mismo
// dos veces: hay **un solo booleano**.
//
// **5. ⚠️ SIN DATOS NO SE INVENTA UNA ESTADÍSTICA** (apartado 10). Un módulo sin
// ni un registro **no enseña un cero**: dice *"todavía no hay suficientes
// datos"*. Cero registrados y ninguno registrado nunca son dos cosas distintas
// —la misma lección de `null` frente a `[]` de la F25—.
//
// **6. ⚠️ Y EL "GRÁFICO" SON OCHO CARACTERES** (apartado 6: *"muy simples. Por
// ejemplo: ▂ ▅ ▆ ▇. **No llenar la pantalla de gráficas**"*). Ni una librería,
// ni un `<canvas>`: una cadena de bloques que se calcula con una división.
// ============================================================================

import { todayISO, addDays } from './helpers';
import { normalizarEstiloHombre, guardarConfig, modulosActivos, IDS_EH } from './estiloDeHombre';
import { MODULO_ANFITRION } from './miEstilo';
/* ⚠️ Decisión 1 — cada cifra sale del historial que ya existe en su módulo. Ni
   un contador nuevo, ni una copia (la frontera de la F29, la F30 y la F32). */
import { datosRutinasPiel } from './rutinasPiel';
import { datosPelo } from './rutinasPelo';
import { datosRutinasBarba } from './rutinasBarba';
import { datosSonrisa } from './sonrisa';
import { datosPerfumes, perfumeActual } from './perfumes';
import { misPreferencias } from './gustos';

/* ===========================================================================
   1 · LA ZONA (apartados 1 y 12)
   =========================================================================== */

export const ZONA_PROGRESO = {
  id: 'progreso',
  nombre: 'Mi progreso',
  icono: '📊',
  dentroDe: MODULO_ANFITRION,
};

export const TEXTOS_PROGRESO = {
  titulo: '📊 Mi progreso',
  // Apartado 4 — el encabezado del resumen, según el periodo.
  esta: { semana: 'Esta semana', mes: 'Este mes', personalizado: 'En estas fechas' },
  ocultar: '👁️ Ocultar',
  volver: 'Volver a ver mi progreso',
  apagado: 'El progreso está apagado. Todo lo demás sigue funcionando igual.',
  // Apartado 10 — y esto es lo que se dice en vez de inventar un número.
  sinDatos: 'Todavía no hay suficientes datos.',
  // Apartado 11.
  queVer: 'Qué quieres ver',
  nadaElegido: 'No has elegido ninguna métrica, así que aquí no sale nada.',
  // Apartado 13 — lo que más le preocupa, dicho.
  noBorraDatos: 'Quitar una métrica no borra nada: esto solo es una vista de lo que ya tienes.',
  // Apartado 3.
  sinNotas: 'Aquí no hay notas ni porcentajes: solo lo que has registrado.',
  // Apartado 14.
  privado: 'Esto es solo tuyo. No se comparte con nadie.',
  // Apartado 5.
  periodo: 'Periodo',
};

/* ===========================================================================
   2 · LOS PERIODOS (apartado 5)
   ===========================================================================
   *"Semana · Mes · Personalizado. **No mostrar gráficos enormes.**"* */

export const PERIODOS_PROGRESO = [
  { id: 'semana', nombre: 'Semana', dias: 7 },
  { id: 'mes', nombre: 'Mes', dias: 30 },
  { id: 'personalizado', nombre: 'Personalizado', dias: null },
];

export const periodoProgreso = (id) => PERIODOS_PROGRESO.find((p) => p.id === id) || null;

export const PERIODO_POR_DEFECTO = 'semana';

/** El rango de fechas que toca mirar. ⚠️ Sin fechas propias, cae en la semana. */
export function rangoDe(datos, { hoy = todayISO() } = {}) {
  const p = periodoProgreso(datos.periodo) || periodoProgreso(PERIODO_POR_DEFECTO);
  if (p.id !== 'personalizado') {
    return { desde: addDays(hoy, -(p.dias - 1)), hasta: hoy, dias: p.dias, periodo: p.id };
  }
  const desde = datos.desde || addDays(hoy, -6);
  const hasta = datos.hasta || hoy;
  // ⚠️ Al revés no revienta: se ordenan.
  const [a, b] = desde <= hasta ? [desde, hasta] : [hasta, desde];
  const dias = Math.max(1, Math.round((new Date(`${b}T00:00:00`) - new Date(`${a}T00:00:00`)) / 86400000) + 1);
  return { desde: a, hasta: b, dias, periodo: 'personalizado' };
}

const enRango = (fecha, { desde, hasta }) =>
  typeof fecha === 'string' && fecha >= desde && fecha <= hasta;

/* ===========================================================================
   3 · LAS MÉTRICAS (apartados 2 y 11)
   ===========================================================================
   *"Solo datos que realmente aporten algo."* Y cada una declara:
     · `modulo` — sin ese módulo activo, la métrica no existe (apartado 11).
     · `tipo` — `periodo` cuenta sucesos entre dos fechas y puede pintar su
       barrita; `total` es un recuento que no depende del periodo; `texto` es
       una frase, como *"el más usado"*.
     · `fuente(estado, ctx)` — **la lista original**, para saber si hay datos.
     · `porDefecto` — las cuatro casillas del ejemplo del apartado 11.

   ⚠️ **Añadir una métrica es añadir una línea aquí**, como `MODULOS_EH` en la
   F1 o `LINEAS_DE_PLAQUITA` en la F31. Ni un `case`, ni un `if` aparte.

   ⚠️ Y una nota honesta: el apartado 2 pide separar *"afeitados"* de
   *"perfilados"* en Barba, pero **eso no se guarda como categoría**: el registro
   de la F21 tiene un campo `que` de texto libre. Así que se cuenta lo que hay
   —los registros— en vez de inventar una clasificación (regla 8). */

export const METRICAS_PROGRESO = [
  {
    id: 'piel_hechas',
    nombre: 'Rutinas de cuidado hechas',
    icono: '🧴', modulo: 'skincare', tipo: 'periodo', porDefecto: true,
    fuente: (e) => datosRutinasPiel(e).hechos,
    fecha: (x) => x.fecha,
  },
  {
    id: 'piel_rutinas',
    nombre: 'Rutinas de cuidado configuradas',
    icono: '🧴', modulo: 'skincare', tipo: 'total', porDefecto: false,
    fuente: (e) => datosRutinasPiel(e).rutinas,
  },
  {
    id: 'pelo_hechas',
    nombre: 'Rutinas de pelo hechas',
    icono: '💇', modulo: 'pelo', tipo: 'periodo', porDefecto: true,
    fuente: (e) => datosPelo(e).hechos,
    fecha: (x) => x.fecha,
  },
  {
    id: 'barba_registros',
    nombre: 'Registros de barba',
    icono: '🧔', modulo: 'barba', tipo: 'periodo', porDefecto: true,
    fuente: (e) => datosRutinasBarba(e).registros,
    fecha: (x) => x.fecha,
  },
  {
    id: 'barba_hechas',
    nombre: 'Rutinas de barba hechas',
    icono: '🧔', modulo: 'barba', tipo: 'periodo', porDefecto: false,
    fuente: (e) => datosRutinasBarba(e).hechos,
    fecha: (x) => x.fecha,
  },
  {
    id: 'sonrisa_hechas',
    nombre: 'Rutinas de sonrisa hechas',
    icono: '😁', modulo: 'sonrisa', tipo: 'periodo', porDefecto: false,
    fuente: (e) => datosSonrisa(e).hechos,
    fecha: (x) => x.fecha,
  },
  {
    id: 'perfumes_usos',
    nombre: 'Perfumes utilizados',
    icono: '🌫️', modulo: 'perfumes', tipo: 'periodo', porDefecto: true,
    fuente: (e) => datosPerfumes(e).historial,
    fecha: (x) => x.fecha,
  },
  {
    id: 'perfumes_favoritos',
    nombre: 'Perfumes favoritos',
    icono: '🌫️', modulo: 'perfumes', tipo: 'total', porDefecto: false,
    fuente: (e) => datosPerfumes(e).perfumes.filter((p) => p.favorito),
  },
  {
    id: 'perfumes_top',
    nombre: 'El que más usas',
    icono: '🌫️', modulo: 'perfumes', tipo: 'texto', porDefecto: false,
    fuente: (e) => datosPerfumes(e).historial,
    // ⚠️ Se calcula sobre el periodo, no sobre "siempre": es lo que él mira.
    texto: (e, ctx, rango) => {
      const d = datosPerfumes(e);
      const cuenta = {};
      d.historial.filter((h) => enRango(h.fecha, rango)).forEach((h) => {
        cuenta[h.perfumeId] = (cuenta[h.perfumeId] || 0) + 1;
      });
      const top = Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0];
      if (!top) return null;
      const p = d.perfumes.find((x) => x.id === top[0]);
      return p ? `${p.nombre} (${top[1]})` : null;
    },
  },
  {
    id: 'estilo_usos',
    nombre: 'Veces que te has vestido con algo apuntado',
    icono: '👕', modulo: 'estilo', tipo: 'periodo', porDefecto: false,
    // ⚠️ El armario es de otro almacén: llega por el contexto, no se importa.
    fuente: (e, { armario }) => (Array.isArray(armario?.usos) ? armario.usos : []),
    fecha: (x) => x.fecha,
  },
  {
    id: 'estilo_preferencias',
    nombre: 'Preferencias configuradas',
    icono: '👕', modulo: 'estilo', tipo: 'total', porDefecto: false,
    fuente: (e, { datosGlobales }) => misPreferencias(e, datosGlobales).filter((p) => p.tiene),
  },
];

export const metricaProgreso = (id) => METRICAS_PROGRESO.find((m) => m.id === id) || null;
export const IDS_METRICAS = METRICAS_PROGRESO.map((m) => m.id);
export const METRICAS_POR_DEFECTO = METRICAS_PROGRESO.filter((m) => m.porDefecto).map((m) => m.id);

/* ===========================================================================
   4 · EL ALMACÉN (apartados 1, 5, 11, 12 y 13)
   ===========================================================================
   ⚠️ **Ni una cifra guardada** (decisión 1): solo qué quiere ver, qué periodo
   mira y si quiere ver esto. Va en la `config` del módulo anfitrión, con "Mi
   estilo" (F29), la pantalla (F30/F31), las ideas (F32) y Descubrir (F33). */

export const DEFAULT_PROGRESO = {
  ver: true,
  metricas: METRICAS_POR_DEFECTO,
  periodo: PERIODO_POR_DEFECTO,
  desde: null,
  hasta: null,
};

const fechaOk = (v) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);

export function normalizarProgreso(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    ver: typeof g.ver === 'boolean' ? g.ver : true,
    /* ⚠️ Sin entrada guardada, las de fábrica; con una lista vacía, ninguna —
       que es una decisión suya, no un hueco (lección de la F25 y la F31). */
    metricas: Array.isArray(g.metricas)
      ? g.metricas.filter((id) => IDS_METRICAS.includes(id))
      : [...METRICAS_POR_DEFECTO],
    periodo: periodoProgreso(g.periodo) ? g.periodo : PERIODO_POR_DEFECTO,
    desde: fechaOk(g.desde),
    hasta: fechaOk(g.hasta),
  };
}

export const datosProgreso = (estado) => {
  const e = normalizarEstiloHombre(estado);
  return normalizarProgreso(e.modulos.find((m) => m.id === MODULO_ANFITRION)?.config?.progreso);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_ANFITRION, { progreso: datos });

/* ── Apartados 1 y 12 — el único interruptor ─────────────────────────────── */

export const progresoVisible = (estado) => datosProgreso(estado).ver === true;

export const ocultarProgreso = (estado) => escribir(estado, { ...datosProgreso(estado), ver: false });

export const mostrarProgreso = (estado) => escribir(estado, { ...datosProgreso(estado), ver: true });

/* ── Apartado 11 — qué métricas quiere ver ───────────────────────────────── */

export function alternarMetrica(estado, id) {
  if (!metricaProgreso(id)) return normalizarEstiloHombre(estado);
  const d = datosProgreso(estado);
  const metricas = d.metricas.includes(id)
    ? d.metricas.filter((x) => x !== id)
    // Se guardan en el orden del catálogo, no en el de los toques.
    : IDS_METRICAS.filter((x) => d.metricas.includes(x) || x === id);
  return escribir(estado, { ...d, metricas });
}

/* ── Apartado 5 — el periodo ─────────────────────────────────────────────── */

export function cambiarPeriodo(estado, id, { desde = null, hasta = null } = {}) {
  if (!periodoProgreso(id)) return normalizarEstiloHombre(estado);
  const d = datosProgreso(estado);
  return escribir(estado, {
    ...d,
    periodo: id,
    desde: id === 'personalizado' ? (fechaOk(desde) ?? d.desde) : null,
    hasta: id === 'personalizado' ? (fechaOk(hasta) ?? d.hasta) : null,
  });
}

/* ===========================================================================
   5 · EL "GRÁFICO" (apartado 6)
   ===========================================================================
   *"Muy simples. Por ejemplo: ▂ ▅ ▆ ▇. **No llenar la pantalla de gráficas.**"*

   ⚠️ Ocho caracteres y una división. Ni una librería, ni un `<canvas>`, ni un
   SVG: una cadena. Y **como mucho catorce barras**, para que un mes no salga
   como una pared de bloques en un iPhone. */

export const BLOQUES = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
export const MAX_BARRAS = 14;

export function barrita(cuentas = []) {
  if (cuentas.length === 0) return '';
  const max = Math.max(...cuentas);
  // ⚠️ Todo a cero no dibuja una línea de mínimos: no dibuja nada.
  if (max === 0) return '';
  const paso = Math.max(1, Math.ceil(cuentas.length / MAX_BARRAS));
  const agrupadas = [];
  for (let i = 0; i < cuentas.length; i += paso) {
    agrupadas.push(cuentas.slice(i, i + paso).reduce((s, x) => s + x, 0));
  }
  const maxG = Math.max(...agrupadas, 1);
  return agrupadas
    .map((c) => (c === 0 ? BLOQUES[0] : BLOQUES[Math.min(BLOQUES.length - 1, Math.ceil((c / maxG) * (BLOQUES.length - 1)))]))
    .join('');
}

/* ===========================================================================
   6 · CALCULAR (apartados 2, 4, 9 y 10)
   ===========================================================================
   ⚠️ **No escribe nada**: es una vista calculada (apartado 13). */

export function calcularMetrica(estado, id, { armario = null, datosGlobales = {}, hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  const m = metricaProgreso(id);
  if (!m) return null;
  const activos = modulosActivos(e).map((x) => x.id);
  // Apartado 11 — sin su módulo activo, la métrica no existe.
  if (!activos.includes(m.modulo)) return null;

  const ctx = { armario, datosGlobales };
  let fuente = [];
  try { fuente = m.fuente(e, ctx) || []; } catch { fuente = []; }
  const rango = rangoDe(datosProgreso(e), { hoy });

  /* ⚠️ Apartado 10 — sin ni un registro **no se enseña un cero**: se dice que
     todavía no hay datos. Cero registrados y ninguno registrado nunca son dos
     cosas distintas, y confundirlas es inventar una estadística. */
  const hayDatos = fuente.length > 0;

  if (m.tipo === 'texto') {
    let texto = null;
    try { texto = m.texto(e, ctx, rango); } catch { texto = null; }
    return {
      id: m.id, nombre: m.nombre, icono: m.icono, modulo: m.modulo, tipo: 'texto',
      hayDatos: hayDatos && !!texto,
      texto: hayDatos && texto ? texto : TEXTOS_PROGRESO.sinDatos,
      valor: null, barrita: '',
    };
  }

  if (m.tipo === 'total') {
    return {
      id: m.id, nombre: m.nombre, icono: m.icono, modulo: m.modulo, tipo: 'total',
      hayDatos,
      valor: hayDatos ? fuente.length : null,
      texto: hayDatos ? `${fuente.length}` : TEXTOS_PROGRESO.sinDatos,
      barrita: '',
    };
  }

  // `periodo` — se cuenta día a día, para poder pintar la barrita.
  const porDia = [];
  for (let i = 0; i < rango.dias; i += 1) {
    const dia = addDays(rango.desde, i);
    porDia.push(fuente.filter((x) => m.fecha(x) === dia).length);
  }
  const total = porDia.reduce((s, x) => s + x, 0);
  return {
    id: m.id, nombre: m.nombre, icono: m.icono, modulo: m.modulo, tipo: 'periodo',
    hayDatos,
    valor: hayDatos ? total : null,
    // ⚠️ Apartado 9 — *"información, no juicio"*: se dice el número y ya.
    texto: hayDatos ? `${total}` : TEXTOS_PROGRESO.sinDatos,
    barrita: hayDatos ? barrita(porDia) : '',
    porDia: hayDatos ? porDia : [],
  };
}

/** Las que él ha elegido y su módulo está activo. */
export function metricasVisibles(estado, opciones = {}) {
  const d = datosProgreso(estado);
  return d.metricas.map((id) => calcularMetrica(estado, id, opciones)).filter(Boolean);
}

/** Todas las que se le pueden ofrecer, con su marca (apartado 11). */
export function metricasDisponibles(estado) {
  const e = normalizarEstiloHombre(estado);
  const activos = modulosActivos(e).map((m) => m.id);
  const d = datosProgreso(e);
  return METRICAS_PROGRESO
    .filter((m) => activos.includes(m.modulo))
    .map((m) => ({ id: m.id, nombre: m.nombre, icono: m.icono, modulo: m.modulo, puesta: d.metricas.includes(m.id) }));
}

/* ===========================================================================
   7 · LA RACHA Y EL OBJETIVO (apartados 7 y 8)
   ===========================================================================
   *"Si el usuario tiene activado el sistema global de rachas: 🔥 12 días. Pero:
   **no crear una racha independiente**."* Y el 7: *"mostrar su progreso desde el
   sistema global. **No crear otro sistema.**"*

   ⚠️ Mismo criterio que la F23: se mira si ya existe una definición suya que
   apunte a un módulo de Estilo de hombre, y **si no la hay se devuelve `null`**.
   Ni se guarda un contador, ni se le propone crearla. */

export function rachaDeEstilo(rachas) {
  const definiciones = Array.isArray(rachas?.definiciones) ? rachas.definiciones : [];
  const suyas = definiciones.filter((r) => r && IDS_EH.includes(r.origen));
  if (suyas.length === 0) return null;
  const eventos = Array.isArray(rachas?.eventos) ? rachas.eventos : [];
  return suyas.map((r) => ({ racha: r, eventos: eventos.filter((e) => e.rachaId === r.id) }));
}

/**
 * Apartado 7 — el objetivo, **del sistema global**. ⚠️ Se le pasa la lista tal
 * cual; si no hay ninguno relacionado, `null`, y no se pinta nada.
 */
export function objetivosDeEstilo(objetivos) {
  const lista = Array.isArray(objetivos?.lista) ? objetivos.lista
    : (Array.isArray(objetivos) ? objetivos : null);
  if (lista === null) return null;
  const suyos = lista.filter((o) => o && o.origen === 'estiloHombre');
  return suyos.length > 0 ? suyos : null;
}

/* ===========================================================================
   8 · RESUMEN, AUDITORÍA, TEXTOS Y PANEL
   =========================================================================== */

export function resumenProgreso(estado, opciones = {}) {
  const d = datosProgreso(estado);
  const visibles = metricasVisibles(estado, opciones);
  return {
    ver: d.ver,
    periodo: d.periodo,
    // ⚠️ Apagado devuelve `null`, no 0 (lección de la F25).
    metricas: d.ver ? visibles.length : null,
    conDatos: visibles.filter((m) => m.hayDatos).length,
    disponibles: metricasDisponibles(estado).length,
    catalogo: METRICAS_PROGRESO.length,
  };
}

export function lineaProgreso(estado, opciones = {}) {
  const d = datosProgreso(estado);
  if (!d.ver) return null;
  const conDatos = metricasVisibles(estado, opciones).filter((m) => m.hayDatos);
  if (conDatos.length === 0) return null;
  return conDatos.slice(0, 3).map((m) => `${m.icono} ${m.texto}`).join(' · ');
}

export function textosDeProgreso() {
  return [
    ...Object.values(TEXTOS_PROGRESO).filter((x) => typeof x === 'string'),
    ...Object.values(TEXTOS_PROGRESO.esta),
    ...METRICAS_PROGRESO.map((m) => m.nombre),
    ...PERIODOS_PROGRESO.map((p) => p.nombre),
  ];
}

export function auditarProgreso() {
  return {
    // Apartado 3 — *"no puntuar al usuario"*.
    puntuaciones: 0,
    porcentajes: 0,
    // Apartado 9 — *"información, no juicio"*.
    comparaciones: 0,
    // Apartado 8 — ni una racha nueva, ni un contador guardado.
    rachasNuevas: 0,
    contadoresGuardados: 0,
    // Apartado 7 — ni otro sistema de objetivos.
    sistemasDeObjetivos: 0,
    // Apartado 13 — datos originales que esta fase borra. Ninguno.
    datosBorrados: 0,
    // Apartado 14 — sitios a los que se manda algo. Ninguno.
    envios: 0,
    // Apartado 6 — librerías de gráficos.
    libreriasDeGrafico: 0,
    // Decisión 4 — un interruptor para los apartados 1 y 12.
    interruptores: 1,
    metricas: METRICAS_PROGRESO.length,
    periodos: PERIODOS_PROGRESO.length,
    // Lo que guarda, por su nombre: preferencias de pantalla, ni una cifra.
    datosGuardados: Object.keys(DEFAULT_PROGRESO),
  };
}

export function panelProgreso(estado, { armario = null, datosGlobales = {}, rachas = null, objetivos = null, hoy = todayISO() } = {}) {
  const d = datosProgreso(estado);
  const rango = rangoDe(d, { hoy });
  const opciones = { armario, datosGlobales, hoy };
  return {
    zona: ZONA_PROGRESO,
    titulo: TEXTOS_PROGRESO.titulo,
    ver: d.ver,
    // Apartado 4 — *"Esta semana: 🧴 5 rutinas…"*
    encabezado: TEXTOS_PROGRESO.esta[rango.periodo] || TEXTOS_PROGRESO.esta.semana,
    rango,
    periodos: PERIODOS_PROGRESO,
    periodo: d.periodo,
    metricas: d.ver ? metricasVisibles(estado, opciones) : [],
    disponibles: metricasDisponibles(estado),
    // Apartados 7 y 8 — del sistema global, y `null` si no los tiene.
    rachas: rachaDeEstilo(rachas),
    objetivos: objetivosDeEstilo(objetivos),
    // Lo que esta pantalla se obliga a decir.
    noBorraDatos: TEXTOS_PROGRESO.noBorraDatos,
    sinNotas: TEXTOS_PROGRESO.sinNotas,
    privado: TEXTOS_PROGRESO.privado,
    vacio: d.metricas.length === 0 ? TEXTOS_PROGRESO.nadaElegido : '',
    apagado: d.ver ? '' : TEXTOS_PROGRESO.apagado,
    resumen: resumenProgreso(estado, opciones),
  };
}
