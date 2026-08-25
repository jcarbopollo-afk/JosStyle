// ---------------------------------------------------------------------------
// Puntuación diaria — el "punto intermedio entre informativo y juego" que pedía
// la Fase 20 del Prompt Maestro.
//
// POR QUÉ EXISTE ESTE ARCHIVO
// La puntuación anterior vivía suelta dentro de DashboardView y era esto:
//
//     let score = 30;
//     if (ultimoSueno) score += 25;                                  // sueno[último], no el de hoy
//     if (habilidadesActivas > 0 || futbol.length > 0) score += 25;  // "alguna vez"
//     if (economia.movimientos.length > 0) score += 20;              // "alguna vez"
//
// Ninguna de las tres condiciones miraba la fecha. En cuanto Josué registraba
// un sueño, subía una habilidad y anotaba un movimiento, la puntuación se
// quedaba clavada en 100 para siempre — mientras la etiqueta debajo seguía
// diciendo "Puntuación de hoy". Era un dato falso en la pantalla principal.
//
// CÓMO FUNCIONA AHORA
// La puntuación es el porcentaje de tus hábitos de registro que has cumplido
// HOY, contando únicamente las áreas que de verdad usas.
//
// "Que de verdad usas" es la parte importante: un área solo cuenta si tiene
// datos previos. Si Josué nunca ha registrado una comida, Nutrición no aparece
// en el cálculo y no le penaliza. Así la puntuación mide constancia real, no
// cuántos módulos de la app tiene abiertos.
//
// REGLAS QUE RESPETA (docs/01_ESPECIFICACION_MAESTRA.md §11)
//   · Regla 33/34 — no sobregamificar: sin puntos acumulables, sin niveles, sin
//     monedas, sin premios. Es una foto del día, se reinicia cada mañana sola y
//     no se guarda en ninguna parte.
//   · Regla 8 — la IA aconseja, no decide: esto no es IA, es aritmética que
//     Josué puede comprobar a ojo.
//   · Honestidad: devuelve el desglose completo, así que la interfaz siempre
//     puede explicar de dónde sale el número en vez de mostrarlo a secas.
//
// No guarda nada, no tiene clave en Supabase y no toca ningún otro módulo:
// mismo criterio de "módulo solo lectura" que correlaciones.js/predicciones.js.
// ---------------------------------------------------------------------------

import { todayISO, addDays } from './helpers';

// Un área entra en el cálculo solo si `usa` es true (Josué tiene datos ahí).
// `hecho` responde a "¿lo he registrado hoy?".
// `etiqueta` es lo que ve el usuario en el desglose.
function construirAreas(estado, hoy) {
  // Los valores por defecto de la desestructuración solo cubren `undefined`, nunca
  // `null` — y `loadData` puede devolver `null` para una clave que aún no existe.
  // Por eso cada acceso se normaliza a mano en vez de confiar en `= {}`.
  const e = estado || {};
  const lista = (v) => (Array.isArray(v) ? v : []);
  const obj = (v) => (v && typeof v === 'object' ? v : {});

  const sueno = lista(e.sueno);
  const futbol = lista(e.futbol);
  const calistenia = obj(e.calistenia);
  const nutricion = obj(e.nutricion);
  const productividad = obj(e.productividad);
  const diario = obj(e.diario);
  const estudios = obj(e.estudios);
  const salud = obj(e.salud);

  const comidas = lista(nutricion.comidas);
  const agua = obj(nutricion.agua);
  const habitos = lista(productividad.habitos);
  const tareas = lista(productividad.tareas);
  const entradas = lista(diario.entradas);
  const horas = lista(estudios.horas);
  const medidas = lista(salud.medidas);

  // Todas las sesiones de calistenia de las 7 habilidades, unificadas.
  const sesionesCalistenia = Object.values(calistenia).flatMap((s) => lista(s && s.sesiones));

  // El sueño se registra por la mañana pero describe la noche anterior, así que
  // se acepta tanto el registro de hoy como el de ayer: a las 9 de la mañana,
  // haber anotado el sueño de anoche cuenta como hecho.
  const ayer = addDays(hoy, -1);

  return [
    {
      id: 'sueno',
      etiqueta: 'Sueño',
      usa: sueno.length > 0,
      hecho: sueno.some((r) => r.fecha === hoy || r.fecha === ayer),
    },
    {
      id: 'entreno',
      etiqueta: 'Entrenamiento',
      usa: sesionesCalistenia.length > 0 || futbol.length > 0,
      hecho: sesionesCalistenia.some((s) => s.fecha === hoy) || futbol.some((p) => p.fecha === hoy),
    },
    {
      id: 'nutricion',
      etiqueta: 'Nutrición',
      usa: comidas.length > 0 || Object.keys(agua).length > 0,
      hecho: comidas.some((c) => c.fecha === hoy) || (agua[hoy] || 0) > 0,
    },
    {
      id: 'habitos',
      etiqueta: 'Hábitos',
      // Con hábitos, "hecho" exige haberlos marcado TODOS: es su propósito.
      usa: habitos.length > 0,
      hecho: habitos.length > 0 && habitos.every((h) => !!obj(h && h.historial)[hoy]),
    },
    {
      id: 'tareas',
      etiqueta: 'Tareas',
      // Solo cuenta si hay algo que vencía hoy o antes; si no hay nada pendiente
      // para hoy, el área no entra en el cálculo (no se puede "cumplir" la nada).
      usa: tareas.some((t) => !t.hecha && t.fechaLimite && t.fechaLimite <= hoy),
      hecho: false, // si hay vencidas sin hacer, por definición no está cumplido
    },
    {
      id: 'diario',
      etiqueta: 'Diario',
      usa: entradas.length > 0,
      hecho: entradas.some((e) => e.fecha === hoy),
    },
    {
      id: 'estudios',
      etiqueta: 'Estudio',
      usa: horas.length > 0,
      hecho: horas.some((h) => h.fecha === hoy),
    },
    {
      id: 'salud',
      etiqueta: 'Salud',
      // Las medidas no son diarias: pedir una cada día sería absurdo. Cuenta como
      // cumplido mientras la última tenga menos de una semana.
      usa: medidas.length > 0,
      hecho: medidas.some((m) => m.fecha >= addDays(hoy, -6)),
    },
  ];
}

/**
 * Calcula la puntuación del día.
 *
 * @param   {object} estado  Los módulos tal y como viven en App.jsx.
 * @param   {string} [hoyISO] Día a calcular (por defecto, hoy). Sirve para probarlo.
 * @returns {{ valor:number|null, hechos:number, total:number, detalle:Array, hayDatos:boolean }}
 *          `valor` es 0-100, o `null` cuando todavía no hay ningún área en uso —
 *          en ese caso la interfaz debe decirlo, nunca enseñar un 0 desmotivador
 *          a alguien que acaba de instalar la app.
 */
export function puntuacionDelDia(estado, hoyISO) {
  const hoy = hoyISO || todayISO();
  const areas = construirAreas(estado, hoy);
  const enUso = areas.filter((a) => a.usa);

  if (enUso.length === 0) {
    return { valor: null, hechos: 0, total: 0, detalle: [], hayDatos: false };
  }

  const hechos = enUso.filter((a) => a.hecho).length;
  return {
    valor: Math.round((hechos / enUso.length) * 100),
    hechos,
    total: enUso.length,
    detalle: enUso.map(({ id, etiqueta, hecho }) => ({ id, etiqueta, hecho })),
    hayDatos: true,
  };
}

/**
 * Frase corta que explica la puntuación. Informativa y sin juzgar: describe lo
 * que falta, nunca reprocha lo que no se ha hecho.
 */
export function mensajePuntuacion(resultado) {
  if (!resultado.hayDatos) {
    return 'Registra algo hoy y aquí verás cómo va tu día';
  }
  const pendientes = resultado.detalle.filter((d) => !d.hecho);
  if (pendientes.length === 0) return 'Día completo — todo lo que sigues está al día';
  if (pendientes.length === 1) return `Te queda ${pendientes[0].etiqueta.toLowerCase()}`;
  if (pendientes.length === 2) {
    return `Te quedan ${pendientes[0].etiqueta.toLowerCase()} y ${pendientes[1].etiqueta.toLowerCase()}`;
  }
  return `Te quedan ${pendientes.length} cosas por registrar hoy`;
}
