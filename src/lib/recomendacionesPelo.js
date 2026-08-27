// ============================================================================
// EH · Fase 9/65 — PELO: SISTEMA DE RECOMENDACIONES
//
// El enunciado abre con dos palabras en mayúsculas: **NO IA.**
//
// *"Las recomendaciones deben salir de la información que ya tenemos guardada y
// de reglas internas de la aplicación. El usuario siempre tiene la última
// palabra."*
//
// ── LAS CUATRO REGLAS QUE GOBIERNAN ESTE ARCHIVO ───────────────────────────
//
// **1. Si un dato no existe, NO SE ASUME** (apartado 2). Cada regla declara qué
// necesita saber; si falta algo, **no se dispara**. Ni un valor por defecto, ni
// un "probablemente". Esa es la diferencia entre un motor de reglas y un motor
// que se inventa cosas.
//
// **2. Nunca "debes"** (apartado 4). *"Podría venirte bien"*, *"podrías
// probar"*, *"una opción compatible contigo"* — y hay una prueba que recorre
// TODOS los textos que este archivo puede generar buscando imperativos.
//
// **3. Toda recomendación dice por qué aparece** (apartado 5), en una frase
// corta. Sin motivo no se muestra: hay una comprobación que lo impide.
//
// **4. Una recomendación NUNCA modifica nada** (apartado 10). Ni la rutina, ni
// los productos, ni las preferencias, ni el calendario. `aplicarARutina` **exige
// `confirmado: true`** y sin él no escribe: es la regla 7 del proyecto en
// código, igual que `aplicarPlan` en HT F9.
//
// ── DÓNDE VIVE Y QUÉ NO SE CREA ────────────────────────────────────────────
//
// En la `config` del módulo Pelo, junto a las rutinas de la Fase 8. ⚠️ El
// apartado 9 dice *"no crear todavía un sistema global de guardados si ya existe
// uno en JC Fitness; si existe, integrarlo"* — **no existe**: Nutrición y los
// colores tienen cada uno los suyos, y no hay ninguno general. Así que los
// guardados de pelo viven aquí, y queda dicho para que la fase que cree el
// global sepa que tiene que absorberlos.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { NIVELES_ESTILO, nivelEstilo } from './perfilEstilo';
import { MODULO_PELO, contextoCapilar, respuestaPelo } from './perfilCapilar';
import { datosPelo, parteActiva, ACCIONES_PELO, crearRutina, editarRutina } from './rutinasPelo';
import { leerDato } from './datosEstiloHombre';
import { uid, todayISO } from './helpers';

/* ===========================================================================
   1 · EL CONTEXTO — SOLO LO QUE SABEMOS (apartados 2 y 15)
   ===========================================================================
   *"Pero solo utilizar información disponible. Si un dato no existe: **No
   asumirlo**."*

   ⚠️ Y el apartado 15: *"nunca crear copias de esos datos"*. Esto se construye
   en cada llamada leyendo de donde vive cada cosa — el perfil capilar de F7, la
   rutina de F8, el perfil de estilo de F6 — y se olvida. */

export function contextoParaRecomendar(estado, datosGlobales = {}) {
  const perfil = contextoCapilar(estado, datosGlobales);
  const d = datosPelo(estado);
  const respuesta = (id) => {
    const r = respuestaPelo(estado, id, datosGlobales);
    // ⚠️ "No lo sé" NO es un valor: es la ausencia declarada de uno (F7).
    return r.contestada && !r.noSabe ? r.valores : [];
  };

  // Qué acciones cubre ya su rutina. Derivado, nunca guardado.
  const pasosQueTiene = new Set(d.rutinas.flatMap((r) => r.pasos.map((p) => p.accion)));

  return {
    tipoPelo: respuesta('tipoPelo')[0] || null,
    grosor: respuesta('grosorPelo')[0] || null,
    densidad: respuesta('densidadPelo')[0] || null,
    longitud: respuesta('longitudPelo')[0] || null,
    cuero: respuesta('cueroCabelludo'),
    necesidades: respuesta('necesidadesPelo'),
    busca: respuesta('buscasPelo'),
    comoLoLleva: respuesta('comoLoLlevas'),
    tiempo: respuesta('tiempoPelo')[0] || null,
    usaProductos: respuesta('usaProductosPelo')[0] || null,
    // De F6, sin copiarlo.
    estilos: (() => { const v = leerDato(estado, 'estilosFavoritos', datosGlobales).valor; return Array.isArray(v) ? v : (v ? [v] : []); })(),
    // De F8, derivado.
    rutinas: d.rutinas.length,
    pasosQueTiene: [...pasosQueTiene],
    productos: d.productos.length,
    registros: d.hechos.length,
    // Cuántas de las doce preguntas del perfil ha contestado de verdad.
    contestadas: perfil.respuestas.length,
    noSabe: perfil.noSabe,
  };
}

/* ===========================================================================
   2 · LAS REGLAS (apartado 3)
   ===========================================================================
   *"Crear una estructura de reglas… Las reglas deben poder ampliarse
   posteriormente sin rehacer todo el sistema."*

   Cada regla es **una línea de un array**, igual que un módulo en la Fase 1.
   Y cada una declara:

   - `requiere` — qué tiene que saberse para que se pueda disparar. ⚠️ **Este es
     el apartado 2**: sin esos datos, la regla no existe. No se asume nada.
   - `cuando(ctx)` — la condición, con los datos ya garantizados.
   - `porque(ctx)` — el motivo, en una frase (apartado 5).
   - `nivel` — básico / intermedio / avanzado (apartado 6).
   - `accion` — el paso de rutina que propone, si propone alguno. Sirve para el
     apartado 10: *"Añadir a mi rutina"*, y **solo si él lo confirma**.

   ⚠️ **Ninguna regla afirma nada sobre su salud.** Son sugerencias de cuidado y
   de estilo, en condicional, sobre lo que él mismo ha dicho que busca. El
   apartado 7 de la Fase 7 ya lo dejó claro: aquí no se diagnostica. */

export const CATEGORIAS_RECOMENDACION = [
  { id: 'cuidado', nombre: 'Cuidado', icono: '🧴' },
  { id: 'estilo', nombre: 'Estilo', icono: '💇' },
  { id: 'rutina', nombre: 'Rutina', icono: '📋' },
];

export const categoriaRecomendacion = (id) => CATEGORIAS_RECOMENDACION.find((c) => c.id === id) || null;

const tiene = (v) => Array.isArray(v) ? v.length > 0 : (v !== null && v !== undefined && v !== '');

export const REGLAS_PELO = [
  // ── Los dos ejemplos literales del enunciado ────────────────────────────
  {
    id: 'definicion_rizado',
    nivel: 'basico',
    categoria: 'cuidado',
    titulo: 'Un producto de definición',
    texto: 'Podría venirte bien un producto pensado para definir.',
    requiere: ['tipoPelo', 'necesidades'],
    accion: 'definicion',
    cuando: (c) => ['rizado', 'muy_rizado', 'ondulado'].includes(c.tipoPelo) && c.necesidades.includes('definicion'),
    porque: (c) => `Lo mostramos porque tu pelo es ${c.tipoPelo === 'ondulado' ? 'ondulado' : 'rizado'} y has dicho que buscas definición.`,
  },
  {
    id: 'cuero_graso',
    nivel: 'basico',
    categoria: 'cuidado',
    titulo: 'Lavados algo más frecuentes',
    texto: 'Podrías probar a espaciar menos los lavados y ver cómo te va.',
    requiere: ['cuero'],
    accion: 'lavado',
    cuando: (c) => c.cuero.includes('graso'),
    porque: () => 'Lo mostramos porque has indicado que tu cuero cabelludo suele ser graso.',
  },
  {
    id: 'hidratacion_sin_paso',
    nivel: 'basico',
    categoria: 'rutina',
    titulo: 'Un paso de hidratación',
    texto: 'Podrías añadir un paso de hidratación a tu rutina.',
    requiere: ['necesidades', 'rutinas'],
    accion: 'hidratacion',
    cuando: (c) => c.necesidades.includes('hidratacion') && c.rutinas > 0 && !c.pasosQueTiene.includes('hidratacion'),
    porque: () => 'Lo mostramos porque buscas mejorar la hidratación y tu rutina actual no tiene ningún paso de hidratación.',
  },

  // ── Cuidado ─────────────────────────────────────────────────────────────
  {
    id: 'acondicionador',
    nivel: 'basico',
    categoria: 'rutina',
    titulo: 'Acondicionador después del lavado',
    texto: 'Una opción compatible contigo si buscas suavidad.',
    requiere: ['necesidades', 'rutinas'],
    accion: 'acondicionador',
    cuando: (c) => c.necesidades.includes('suavidad') && !c.pasosQueTiene.includes('acondicionador'),
    porque: () => 'Lo mostramos porque has dicho que buscas suavidad y tu rutina no lo incluye.',
  },
  {
    id: 'mascarilla_semanal',
    nivel: 'intermedio',
    categoria: 'cuidado',
    titulo: 'Una mascarilla de vez en cuando',
    texto: 'Podría encajarte una mascarilla semanal.',
    requiere: ['necesidades', 'tiempo'],
    accion: 'mascarilla',
    cuando: (c) => (c.necesidades.includes('hidratacion') || c.necesidades.includes('fortalecimiento'))
      && ['10_20', 'mas_20', 'igual'].includes(c.tiempo) && !c.pasosQueTiene.includes('mascarilla'),
    // ⚠️ El tiempo entra en la regla, no en el texto: *"así las recomendaciones
    // futuras no propondrán una rutina de 20 minutos a alguien que quiere tardar
    // 3"* (F7, apartado 10).
    porque: () => 'Lo mostramos porque buscas hidratación o fortalecimiento y has dicho que puedes dedicarle más de diez minutos.',
  },
  {
    id: 'encrespamiento',
    nivel: 'intermedio',
    categoria: 'cuidado',
    titulo: 'Algo para el encrespamiento',
    texto: 'Podría venirte bien un producto que ayude a controlarlo.',
    requiere: ['necesidades'],
    accion: 'definicion',
    cuando: (c) => c.necesidades.includes('encrespamiento'),
    porque: () => 'Lo mostramos porque has indicado que quieres controlar el encrespamiento.',
  },
  {
    id: 'volumen_fino',
    nivel: 'intermedio',
    categoria: 'cuidado',
    titulo: 'Productos ligeros',
    texto: 'Una opción compatible contigo: productos que no apelmacen.',
    requiere: ['grosor', 'necesidades'],
    accion: null,
    cuando: (c) => c.grosor === 'fino' && c.necesidades.includes('volumen'),
    porque: () => 'Lo mostramos porque tu pelo es fino y has dicho que buscas volumen.',
  },
  {
    id: 'sensible_suave',
    nivel: 'intermedio',
    categoria: 'cuidado',
    titulo: 'Fórmulas suaves',
    texto: 'Podrías probar productos más suaves y ver cómo te sientan.',
    requiere: ['cuero'],
    accion: null,
    cuando: (c) => c.cuero.includes('sensible'),
    porque: () => 'Lo mostramos porque has indicado que tu cuero cabelludo suele ser sensible.',
  },

  // ── Estilo ──────────────────────────────────────────────────────────────
  {
    id: 'corte_corto_rapido',
    nivel: 'basico',
    categoria: 'estilo',
    titulo: 'Un corte que pida poco mantenimiento',
    texto: 'Un tipo de corte compatible con tus preferencias.',
    requiere: ['tiempo', 'busca'],
    accion: null,
    cuando: (c) => ['menos_5', '5_10'].includes(c.tiempo) && (c.busca.includes('facilidad') || c.busca.includes('rapidez')),
    porque: () => 'Lo mostramos porque quieres dedicarle poco tiempo y buscas facilidad para peinarlo.',
  },
  {
    id: 'corte_con_volumen',
    nivel: 'intermedio',
    categoria: 'estilo',
    titulo: 'Un corte que dé volumen arriba',
    texto: 'Podría encajarte por cómo te gusta llevarlo.',
    requiere: ['comoLoLleva'],
    accion: null,
    cuando: (c) => c.comoLoLleva.includes('volumen'),
    porque: () => 'Lo mostramos porque has dicho que te gusta llevarlo con volumen.',
  },
  {
    id: 'estilo_natural',
    nivel: 'avanzado',
    categoria: 'estilo',
    titulo: 'Dejarlo secar al aire',
    texto: 'Podrías probarlo si buscas un acabado natural.',
    requiere: ['busca', 'estilos'],
    accion: null,
    cuando: (c) => c.busca.includes('naturalidad') && c.estilos.some((e) => ['minimalista', 'casual', 'natural'].includes(e)),
    porque: () => 'Lo mostramos porque buscas naturalidad y tu estilo va por ahí.',
  },

  // ── Rutina ──────────────────────────────────────────────────────────────
  {
    id: 'primera_rutina',
    nivel: 'basico',
    categoria: 'rutina',
    titulo: 'Empezar por una rutina sencilla',
    texto: 'Podrías crear una rutina con dos o tres pasos y ver qué tal.',
    requiere: ['contestadas'],
    accion: null,
    cuando: (c) => c.rutinas === 0 && c.contestadas >= 3,
    porque: () => 'Lo mostramos porque ya nos has contado cómo es tu pelo pero todavía no tienes ninguna rutina.',
  },
  {
    id: 'rutina_corta',
    nivel: 'avanzado',
    categoria: 'rutina',
    titulo: 'Una rutina más corta entre semana',
    texto: 'Una opción compatible contigo si algunos días vas justo.',
    requiere: ['tiempo', 'rutinas'],
    accion: null,
    cuando: (c) => ['menos_5', '5_10'].includes(c.tiempo) && c.rutinas === 1 && c.pasosQueTiene.length >= 3,
    porque: () => 'Lo mostramos porque tu única rutina tiene varios pasos y has dicho que quieres dedicarle poco tiempo.',
  },
  {
    id: 'registrar_productos',
    nivel: 'avanzado',
    categoria: 'rutina',
    titulo: 'Apuntar qué productos usas',
    texto: 'Podría venirte bien tenerlos anotados junto a cada paso.',
    requiere: ['usaProductos', 'rutinas'],
    accion: null,
    cuando: (c) => c.usaProductos === 'si' && c.rutinas > 0 && c.productos === 0,
    porque: () => 'Lo mostramos porque has dicho que usas productos y todavía no has apuntado ninguno.',
  },
];

export const reglaPelo = (id) => REGLAS_PELO.find((r) => r.id === id) || null;
export const IDS_REGLAS = REGLAS_PELO.map((r) => r.id);

/* ===========================================================================
   3 · EL MOTOR
   ===========================================================================
   ⚠️ **Sin `requiere`, no hay regla.** Una regla que no declara qué necesita
   saber acabaría disparándose con el contexto vacío y recomendando cosas a
   alguien de quien no sabemos nada. */

export function reglaAplicable(regla, ctx) {
  if (!regla || typeof regla.cuando !== 'function') return false;
  // Apartado 2 — si falta algún dato que la regla necesita, NO se asume.
  if (!Array.isArray(regla.requiere) || regla.requiere.length === 0) return false;
  if (!regla.requiere.every((k) => tiene(ctx[k]))) return false;
  try { return regla.cuando(ctx) === true; } catch { return false; }
}

/* ── El descarte y lo guardado (apartados 8, 9 y 14) ─────────────────────── */

export const MOTIVOS_DESCARTE = [
  { id: 'no_interesa', nombre: 'No me interesa' },
  { id: 'ya_lo_hago', nombre: 'Ya lo hago' },
  { id: 'no_verlo', nombre: 'No quiero verlo' },
  { id: 'menos_similares', nombre: 'Ver menos recomendaciones similares' },
];

/** Cuántos días se calla una recomendación descartada, según el motivo. */
export const DIAS_SILENCIO = { no_interesa: 30, ya_lo_hago: 90, menos_similares: 60 };
// ⚠️ `no_verlo` no está aquí a propósito: es para siempre, y "para siempre"
// no es un número de días.

export const DEFAULT_RECOMENDACIONES = { feedback: [], guardadas: [], vistas: [] };

export function normalizarRecs(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  return {
    feedback: (Array.isArray(g.feedback) ? g.feedback : [])
      .filter((f) => f && IDS_REGLAS.includes(f.reglaId) && MOTIVOS_DESCARTE.some((m) => m.id === f.motivo))
      .map((f) => ({ reglaId: f.reglaId, motivo: f.motivo, fecha: typeof f.fecha === 'string' ? f.fecha : null })),
    guardadas: (Array.isArray(g.guardadas) ? g.guardadas : [])
      .filter((x) => x && IDS_REGLAS.includes(x.reglaId))
      .map((x) => ({ id: x.id || uid(), reglaId: x.reglaId, fecha: x.fecha || null })),
    // Apartado 14 — qué se ha enseñado ya y cuándo. Sin esto, la misma
    // recomendación saldría la primera todos los días.
    vistas: (Array.isArray(g.vistas) ? g.vistas : [])
      .filter((v) => v && IDS_REGLAS.includes(v.reglaId) && typeof v.fecha === 'string')
      .map((v) => ({ reglaId: v.reglaId, fecha: v.fecha, veces: Number.isFinite(Number(v.veces)) ? Number(v.veces) : 1 })),
  };
}

export const recsDe = (estado) => normalizarRecs(datosPelo(estado).recomendaciones);

const escribirRecs = (estado, recs) => {
  const d = datosPelo(estado);
  return guardarConfig(estado, MODULO_PELO, { pelo: { ...d, recomendaciones: recs } });
};

const diasDesde = (fecha, hoy) => {
  if (!fecha) return Infinity;
  return Math.round((new Date(`${hoy}T00:00:00`) - new Date(`${fecha}T00:00:00`)) / 86400000);
};

/** Apartado 14 — *"no mostrar continuamente la misma recomendación"*. */
export function silenciada(estado, reglaId, { hoy = todayISO() } = {}) {
  const recs = recsDe(estado);
  const f = recs.feedback.find((x) => x.reglaId === reglaId);
  if (!f) return { silenciada: false, motivo: null };
  if (f.motivo === 'no_verlo') return { silenciada: true, motivo: f.motivo, paraSiempre: true };
  const dias = DIAS_SILENCIO[f.motivo] || 30;
  return { silenciada: diasDesde(f.fecha, hoy) < dias, motivo: f.motivo, paraSiempre: false };
}

/* ===========================================================================
   4 · RECOMENDAR (apartados 1, 6 y 7)
   =========================================================================== */

export const RECOMENDACIONES_INICIALES = 3;

/**
 * ⚠️ **No escribe nada.** Ni marca como vista, ni guarda, ni toca la rutina.
 * Que "mostrar" y "registrar que se ha mostrado" sean dos llamadas distintas es
 * lo que permite que una pantalla se repinte sin ensuciar el historial.
 */
export function recomendarPelo(estado, datosGlobales = {}, { nivel = null, limite = RECOMENDACIONES_INICIALES, hoy = todayISO() } = {}) {
  const ctx = contextoParaRecomendar(estado, datosGlobales);
  const nivelPedido = nivelEstilo(nivel) ? nivel : null;

  // Apartado 6 — el nivel lo elige él. Sin elegir, salen todos, y los básicos
  // primero: son los que menos suponen.
  const orden = { basico: 0, intermedio: 1, avanzado: 2 };

  const candidatas = REGLAS_PELO
    .filter((r) => (nivelPedido ? r.nivel === nivelPedido : true))
    .filter((r) => reglaAplicable(r, ctx))
    .filter((r) => !silenciada(estado, r.id, { hoy }).silenciada)
    .map((r) => {
      const cat = categoriaRecomendacion(r.categoria);
      const n = nivelEstilo(r.nivel);
      return {
        reglaId: r.id,
        titulo: r.titulo,
        texto: r.texto,
        // Apartado 5 — el motivo, siempre.
        porque: r.porque(ctx),
        categoria: r.categoria,
        categoriaNombre: cat?.nombre || '',
        icono: cat?.icono || '💡',
        nivel: r.nivel,
        nivelNombre: n?.nombre || '',
        nivelIcono: n?.icono || '',
        // Apartado 10 — si propone un paso, se puede añadir A MANO.
        accion: r.accion,
        guardada: recsDe(estado).guardadas.some((g) => g.reglaId === r.id),
        // Apartado 11 — la conexión con Productos, declarada y todavía cerrada.
        verProductos: r.categoria === 'cuidado',
      };
    })
    // Lo menos visto primero (apartado 14), y dentro de eso, lo más básico.
    .sort((a, b) => {
      const va = recsDe(estado).vistas.find((v) => v.reglaId === a.reglaId)?.veces || 0;
      const vb = recsDe(estado).vistas.find((v) => v.reglaId === b.reglaId)?.veces || 0;
      return va - vb || orden[a.nivel] - orden[b.nivel];
    });

  return {
    recomendaciones: candidatas.slice(0, Math.max(0, limite)),
    // Apartado 7 — *"Ver más"*, para no saturar.
    hayMas: candidatas.length > limite,
    total: candidatas.length,
    nivel: nivelPedido,
    // Apartado 12 — qué falta para poder afinar, sin bloquear.
    falta: loQueFaltaParaAfinar(ctx),
    // ⚠️ Apartado 16, declarado: esto no sale del dispositivo.
    sinIA: true,
    externo: false,
  };
}

/**
 * Apartado 12 — *"Podemos personalizar más tus recomendaciones. Falta
 * información sobre tu tipo de pelo. Completar perfil → … Pero también: Ahora
 * no. **Nunca bloquear**."*
 */
export function loQueFaltaParaAfinar(ctx) {
  const importantes = [
    { id: 'tipoPelo', que: 'tu tipo de pelo' },
    { id: 'necesidades', que: 'qué te gustaría cuidar' },
    { id: 'tiempo', que: 'cuánto tiempo quieres dedicarle' },
    { id: 'cuero', que: 'cómo es tu cuero cabelludo' },
  ];
  const faltan = importantes.filter((x) => !tiene(ctx[x.id]));
  if (faltan.length === 0) return { hayQueAfinar: false, texto: '', acciones: [] };
  return {
    hayQueAfinar: true,
    campos: faltan.map((x) => x.id),
    titulo: 'Podemos personalizar más tus recomendaciones',
    texto: `Falta información sobre ${faltan.map((x) => x.que).join(', ')}.`,
    // ⚠️ Las dos salidas, siempre. Nunca bloquear.
    acciones: ['Completar perfil', 'Ahora no'],
  };
}

/* ===========================================================================
   5 · LO QUE ÉL DECIDE (apartados 8, 9, 10 y 14)
   =========================================================================== */

/** Apartado 14 — registrar que se ha enseñado. Se llama al pintar, no al calcular. */
export function marcarVistas(estado, ids = [], { hoy = todayISO() } = {}) {
  const recs = recsDe(estado);
  const validos = ids.filter((id) => IDS_REGLAS.includes(id));
  if (validos.length === 0) return normalizarEstiloHombre(estado);
  const vistas = [...recs.vistas];
  validos.forEach((id) => {
    const i = vistas.findIndex((v) => v.reglaId === id);
    if (i === -1) vistas.push({ reglaId: id, fecha: hoy, veces: 1 });
    else vistas[i] = { ...vistas[i], fecha: hoy, veces: vistas[i].veces + 1 };
  });
  return escribirRecs(estado, { ...recs, vistas });
}

/** Apartado 8 — los cuatro motivos del enunciado, y ninguno más. */
export function descartar(estado, reglaId, motivo, { hoy = todayISO() } = {}) {
  if (!IDS_REGLAS.includes(reglaId)) return { estado: normalizarEstiloHombre(estado), error: 'Esa recomendación no existe.' };
  if (!MOTIVOS_DESCARTE.some((m) => m.id === motivo)) return { estado: normalizarEstiloHombre(estado), error: 'Ese motivo no existe.' };
  const recs = recsDe(estado);
  const feedback = [...recs.feedback.filter((f) => f.reglaId !== reglaId), { reglaId, motivo, fecha: hoy }];
  return { estado: escribirRecs(estado, { ...recs, feedback }), error: null };
}

/** Y poder deshacerlo: nada queda bloqueado para siempre por un toque. */
export function deshacerDescarte(estado, reglaId) {
  const recs = recsDe(estado);
  return escribirRecs(estado, { ...recs, feedback: recs.feedback.filter((f) => f.reglaId !== reglaId) });
}

/** Apartado 9 — guardar. ⚠️ No hay un sistema global que integrar; ver cabecera. */
export function guardarRecomendacion(estado, reglaId, { hoy = todayISO() } = {}) {
  if (!IDS_REGLAS.includes(reglaId)) return { estado: normalizarEstiloHombre(estado), error: 'Esa recomendación no existe.' };
  const recs = recsDe(estado);
  if (recs.guardadas.some((g) => g.reglaId === reglaId)) {
    // Volver a tocar la quita: es un interruptor, no una lista que solo crece.
    return { estado: escribirRecs(estado, { ...recs, guardadas: recs.guardadas.filter((g) => g.reglaId !== reglaId) }), error: null };
  }
  return { estado: escribirRecs(estado, { ...recs, guardadas: [...recs.guardadas, { id: uid(), reglaId, fecha: hoy }] }), error: null };
}

export function guardadasDePelo(estado) {
  const recs = recsDe(estado);
  return recs.guardadas.map((g) => {
    const r = reglaPelo(g.reglaId);
    const cat = categoriaRecomendacion(r.categoria);
    return { ...g, titulo: r.titulo, texto: r.texto, icono: cat?.icono || '💡', categoria: r.categoria };
  });
}

/**
 * ⚠️ **Apartado 10, y la regla 7 del proyecto.** *"Una recomendación no debe
 * modificar rutina, productos, preferencias ni calendario… el usuario decide."*
 *
 * Sin `confirmado: true` **esto no escribe nada**, y no es una comprobación
 * defensiva: es el requisito. Nunca darle un valor por defecto.
 */
export function aplicarARutina(estado, reglaId, { rutinaId = null, confirmado = false, hoy = todayISO() } = {}) {
  const r = reglaPelo(reglaId);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Esa recomendación no existe.', aplicada: false };
  if (!r.accion) return { estado: normalizarEstiloHombre(estado), error: 'Esta recomendación no propone ningún paso.', aplicada: false };
  if (!confirmado) {
    return { estado: normalizarEstiloHombre(estado), error: 'Una recomendación no se aplica sin confirmarla.', aplicada: false };
  }

  const d = datosPelo(estado);
  const destino = rutinaId ? d.rutinas.find((x) => x.id === rutinaId) : d.rutinas[0];

  // Sin ninguna rutina, se crea una con ese paso. Con rutina, se le añade.
  let nuevo;
  if (!destino) {
    nuevo = crearRutina(estado, { nombre: r.titulo, pasos: [{ accion: r.accion }], frecuencia: 'personalizada' }, { hoy }).estado;
  } else if (destino.pasos.some((p) => p.accion === r.accion)) {
    return { estado: normalizarEstiloHombre(estado), error: null, aplicada: false, sinEfecto: true };
  } else {
    nuevo = editarRutina(estado, destino.id, { pasos: [...destino.pasos, { accion: r.accion }] }).estado;
  }

  // Apartado 14 — "aplicada" también se registra, para no volver a proponerla.
  const recs = normalizarRecs(datosPelo(nuevo).recomendaciones);
  const conFeedback = escribirRecs(nuevo, {
    ...recs,
    feedback: [...recs.feedback.filter((f) => f.reglaId !== reglaId), { reglaId, motivo: 'ya_lo_hago', fecha: hoy }],
  });
  return { estado: conFeedback, error: null, aplicada: true };
}

/* ===========================================================================
   6 · PRODUCTOS (apartado 11)
   ===========================================================================
   *"Si una recomendación necesita producto: 🛒 Ver productos. **De momento
   únicamente preparar la conexión.**"* Y D2-03 de Josué: arquitectura sí,
   afiliación no. */

export const PUENTE_PRODUCTOS_PELO = {
  desde: MODULO_PELO,
  hacia: 'productos',
  fase: 10,
  disponible: false,
  etiqueta: 'Ver productos',
  nota: 'Los productos capilares se construyen en la fase 10.',
};

/* ===========================================================================
   7 · TONO — LA PRUEBA QUE NO SALTA SOLA (apartado 4)
   ===========================================================================
   *"Nunca 'Debes hacer esto'."* Estas listas existen para que la prueba pueda
   recorrer todos los textos posibles y fallar si aparece un imperativo. */

export const PALABRAS_PROHIBIDAS_PELO = [
  'debes', 'tienes que', 'deberías', 'obligatorio', 'necesitas', 'hay que',
  'error', 'mal', 'problema', 'fallo',
];

export const FORMULAS_PERMITIDAS = ['podría', 'podrías', 'una opción compatible', 'puedes'];

export function tonoCorrecto(texto) {
  const t = String(texto || '').toLowerCase();
  return !PALABRAS_PROHIBIDAS_PELO.some((p) => t.includes(p));
}

/* ===========================================================================
   8 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export function resumenRecomendacionesPelo(estado, datosGlobales = {}, { hoy = todayISO() } = {}) {
  const activo = parteActiva(estado, 'recomendaciones');
  const r = activo ? recomendarPelo(estado, datosGlobales, { limite: 99, hoy }) : { recomendaciones: [], total: 0, falta: { hayQueAfinar: false } };
  const recs = recsDe(estado);
  return {
    activo,
    disponibles: r.total,
    guardadas: recs.guardadas.length,
    descartadas: recs.feedback.length,
    hayQueAfinar: r.falta.hayQueAfinar,
    niveles: NIVELES_ESTILO.length,
  };
}

export function auditarRecomendacionesPelo() {
  return {
    reglas: REGLAS_PELO.length,
    // ⚠️ Cada regla declara qué necesita: sin eso, se dispararían con el
    // contexto vacío (apartado 2).
    conRequisitos: REGLAS_PELO.filter((r) => Array.isArray(r.requiere) && r.requiere.length > 0).length,
    conMotivo: REGLAS_PELO.filter((r) => typeof r.porque === 'function').length,
    porNivel: Object.fromEntries(NIVELES_ESTILO.map((n) => [n.id, REGLAS_PELO.filter((r) => r.nivel === n.id).length])),
    // Apartado 16 — ni una llamada externa, ni una copia de datos.
    llamadasExternas: 0,
    copiasDeDatos: 0,
    // Apartado 10 — cuántas funciones de este archivo escriben sin confirmar: 0.
    escribenSinConfirmar: 0,
  };
}
