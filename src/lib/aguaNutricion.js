/* ============================================================================
   💧 EL OBJETIVO DIARIO DE AGUA (P2, 2026-10-18)

   Josué: *"un objetivo diario personalizable y una jarra visual animada que
   muestre cuánto ha bebido respecto a su objetivo"*.

   Lo que YA había y no se toca:
   · el registro: `nutricion.agua`, un mapa `{ 'AAAA-MM-DD': ml }` desde la Fase 4,
     con vasos de `VASO_ML` (250 ml) que suman y restan. Guarda el TOTAL del día,
     no cada vaso, así que recargar o sincronizar no puede contar uno dos veces;
   · el día: la fecha local de `todayISO()` (helpers), la de todo JosStyle.

   Lo nuevo es solo el objetivo, en `nutricion.objetivoAgua`:
   · `ml: null` → se usa la PROPUESTA, que se calcula en el momento (no se guarda:
     si cambia su peso, la propuesta lo sigue mientras él no ponga la suya);
   · `ml: número` → la suya, que manda siempre (apartado 2).

   🚨 EL CRITERIO, Y POR QUÉ ES ÉSTE (apartado 5). La EFSA (2010) da como ingesta
   adecuada de agua TOTAL unos 2,5 L al día para chicos de 14 años en adelante, y
   alrededor de un 20 % llega con la comida: unos **2 L para beber**. Ajustado al
   tamaño, eso son unos **30 ml por kilo** de bebida. Con actividad se suda más,
   así que el nivel de actividad que él ya eligió en sus objetivos de Nutrición
   (NU F3) suma un poco. ⚠️ **El objetivo corporal (perder, mantener, ganar) NO
   cuenta**: la hipertrofia no exige beber una cantidad concreta, y subir las
   calorías no sube el agua (apartado 2). Todo se acota entre 1,5 y 3,5 L y se
   redondea a vasos. Es una **estimación orientativa**, no una prescripción, y se
   dice así en pantalla.
   ⚠️ Y lo que se mide es el agua que **registra aquí**, no su hidratación total
   (la comida y otras bebidas también cuentan): también se dice.
   =========================================================================== */
import { VASO_ML } from '../tokens';

export const CRITERIO_AGUA = Object.freeze({
  mlPorKg: 30,
  porDefecto: 2000,
  minimo: 1500,
  maximo: 3500,
  redondeo: VASO_ML,
  /* Lo que suma cada nivel de actividad de NU F3 (los ids de `NIVELES_ACTIVIDAD`). */
  extraPorActividad: Object.freeze({ sedentario: 0, ligero: 0, moderado: 250, intenso: 500, muy_alto: 500 }),
  /* Lo que se acepta a mano: ni medio litro es un objetivo, ni seis litros uno razonable. */
  manualMin: 500,
  manualMax: 6000,
  pesoMin: 30,
  pesoMax: 250,
});

export const TEXTOS_AGUA = Object.freeze({
  orientativo: 'Es una estimación orientativa, no una indicación médica. Cuenta el agua que registras aquí; la comida y otras bebidas también hidratan.',
  conPeso: (kg) => `Propuesto con tu peso (${String(kg).replace('.', ',')} kg)`,
  conPesoYActividad: (kg) => `Propuesto con tu peso (${String(kg).replace('.', ',')} kg) y tu actividad`,
  sinPeso: 'Propuesta general: añade tu peso en Ajustes → Perfil para ajustarla a ti',
  manual: 'Tu objetivo',
  alcanzado: 'Objetivo cumplido',
  fueraDeRango: 'Pon un objetivo entre 0,5 y 6 litros.',
  noEsNumero: 'Escribe los litros con un número, por ejemplo 2,25.',
});

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

const redondearAVasos = (ml) => Math.round(ml / CRITERIO_AGUA.redondeo) * CRITERIO_AGUA.redondeo;
const acotar = (ml) => Math.min(CRITERIO_AGUA.maximo, Math.max(CRITERIO_AGUA.minimo, ml));

/** Un peso que vale como dato (el mismo listón que la altura y el peso de Ajustes). */
export function pesoValido(peso) {
  const p = num(peso);
  return p !== null && p >= CRITERIO_AGUA.pesoMin && p <= CRITERIO_AGUA.pesoMax ? p : null;
}

/**
 * La propuesta, con de dónde sale.
 * @returns {{ ml: number, base: 'peso' | 'general', peso: number|null, extra: number, texto: string }}
 */
export function propuestaDeAgua({ peso = null, actividad = null } = {}) {
  const p = pesoValido(peso);
  const extra = CRITERIO_AGUA.extraPorActividad[actividad] || 0;
  if (p === null) {
    return { ml: CRITERIO_AGUA.porDefecto, base: 'general', peso: null, extra: 0, texto: TEXTOS_AGUA.sinPeso };
  }
  const ml = acotar(redondearAVasos(p * CRITERIO_AGUA.mlPorKg + extra));
  return { ml, base: 'peso', peso: p, extra, texto: extra ? TEXTOS_AGUA.conPesoYActividad(p) : TEXTOS_AGUA.conPeso(p) };
}

/* ── Lo guardado ──────────────────────────────────────────────────────────── */
export const DEFAULT_OBJETIVO_AGUA = Object.freeze({ ml: null, fecha: null });

const mlManualValido = (v) => {
  const n = num(v);
  if (n === null) return null;
  const r = Math.round(n);
  return r >= CRITERIO_AGUA.manualMin && r <= CRITERIO_AGUA.manualMax ? r : null;
};

export function normalizarObjetivoAgua(o) {
  const x = o && typeof o === 'object' ? o : {};
  return {
    ...x,
    ml: mlManualValido(x.ml),
    fecha: typeof x.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.fecha) ? x.fecha : null,
  };
}

/** El agua de un día que vale: un número ≥ 0. Lo demás (texto, negativo, NaN) no cuenta. */
export function mlDelDia(agua, fecha) {
  const v = agua && typeof agua === 'object' ? agua[fecha] : null;
  const n = num(v);
  return n !== null && n >= 0 ? Math.round(n) : 0;
}

/** El registro entero, limpio: se quedan las fechas con un número válido (regla 5:
 *  nada que tenga sentido se pierde; lo que no, no se pinta como `NaN`). */
export function normalizarAgua(agua) {
  const a = agua && typeof agua === 'object' && !Array.isArray(agua) ? agua : {};
  return Object.fromEntries(
    Object.entries(a)
      .filter(([f, v]) => /^\d{4}-\d{2}-\d{2}$/.test(f) && num(v) !== null && num(v) >= 0)
      .map(([f, v]) => [f, Math.round(num(v))]),
  );
}

/**
 * El objetivo que vale hoy: el suyo si lo puso, si no la propuesta.
 * @returns {{ ml: number, manual: boolean, propuesta: object, texto: string }}
 */
export function objetivoDeAgua(nutricion, perfil) {
  const n = nutricion && typeof nutricion === 'object' ? nutricion : {};
  const guardado = normalizarObjetivoAgua(n.objetivoAgua);
  const actividad = n.objetivos && n.objetivos.configurado ? n.objetivos.actividad : null;
  const propuesta = propuestaDeAgua({ peso: perfil && perfil.peso, actividad });
  if (guardado.ml !== null) return { ml: guardado.ml, manual: true, propuesta, texto: TEXTOS_AGUA.manual };
  return { ml: propuesta.ml, manual: false, propuesta, texto: propuesta.texto };
}

/** Lo que escribe a mano, en litros («2,25», «2.5», «3»). */
export function validarObjetivoAgua(valor) {
  const n = num(valor);
  if (n === null) return { ok: false, error: TEXTOS_AGUA.noEsNumero };
  const ml = Math.round(n * 1000);
  if (ml < CRITERIO_AGUA.manualMin || ml > CRITERIO_AGUA.manualMax) return { ok: false, error: TEXTOS_AGUA.fueraDeRango };
  return { ok: true, ml };
}

/** El objeto que se guarda: el suyo, o `null` para volver a la propuesta. */
export function guardarObjetivoAgua(ml, hoy) {
  return ml === null ? { ...DEFAULT_OBJETIVO_AGUA } : { ml: mlManualValido(ml), fecha: hoy || null };
}

/**
 * El progreso del día frente a su objetivo.
 * `porcentaje` es el REAL (puede pasar de 100: no se esconde lo que bebió);
 * `relleno` es lo que se pinta en la jarra (0 a 1).
 */
export function progresoAgua(ml, objetivoMl) {
  const bebido = Math.max(0, Math.round(num(ml) || 0));
  const objetivo = num(objetivoMl) && num(objetivoMl) > 0 ? Math.round(num(objetivoMl)) : null;
  if (!objetivo) return { ml: bebido, objetivo: null, porcentaje: null, relleno: 0, alcanzado: false, exceso: 0, faltan: null };
  const porcentaje = Math.round((bebido / objetivo) * 100);
  return {
    ml: bebido,
    objetivo,
    porcentaje,
    relleno: Math.min(1, bebido / objetivo),
    alcanzado: bebido >= objetivo,
    exceso: Math.max(0, bebido - objetivo),
    faltan: Math.max(0, objetivo - bebido),
  };
}

/** «1,25 L», «2 L», «0,5 L»: sin ceros de más. */
export function textoDeLitros(ml) {
  const l = Math.round((num(ml) || 0) / 10) / 100;
  return `${String(l).replace('.', ',')} L`;
}

/** La frase de debajo de la jarra. */
export function fraseDeAgua(p) {
  if (!p || p.objetivo === null) return '';
  if (p.exceso > 0) return `${textoDeLitros(p.exceso)} por encima de tu objetivo`;
  if (p.alcanzado) return TEXTOS_AGUA.alcanzado;
  const vasos = Math.ceil(p.faltan / VASO_ML);
  return `Te faltan ${textoDeLitros(p.faltan)} (${vasos} ${vasos === 1 ? 'vaso' : 'vasos'})`;
}
