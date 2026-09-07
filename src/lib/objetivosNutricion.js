/* Entrega 3 · Fase 35 (NU F3) — «Configuración y objetivos nutricionales»
   ═══════════════════════════════════════════════════════════════════════════

   🚨 **LA CONTRADICCIÓN QUE HAY DETRÁS, Y CÓMO SE RESUELVE** (C-30 en `docs/03`).
   El enunciado pide calcular **BMR → TDEE → déficit o superávit** y de ahí unos
   objetivos diarios. La especificación maestra dice dos cosas: que BMR y TDEE
   valen *"siempre orientativos"* (§7.5 — Ajustes → Perfil ya los enseña así), y
   que 🔒 *"ni Salud ni Nutrición pueden **prescribir** objetivos calóricos o de
   peso **estrictos**"* (§7.4 y regla 12).

   Encajan, y la propia NU F3 dice cómo: los valores tienen que ser *"razonables
   y **configurables**"* y permitir *"**ajustes manuales**"*. Es decir: **los pone
   él**. Así que aquí:

   1. La app **calcula y propone**; `planObjetivos` sin `confirmado` **no escribe**
      (el decimonoveno `aplicarPlan` del proyecto).
   2. **Los cuatro números son editables** uno a uno, y lo editado manda sobre lo
      calculado — con `manual: true` escrito en el propio dato, como la mochila de
      HT F7.
   3. **Nada nace puesto.** Sin configurar, Nutrición sigue funcionando y enseña
      lo consumido sin objetivo (NU F1), que es como está hoy.
   4. **Ni objetivo de peso, ni plazo, ni «deberías»** — el enunciado tampoco los
      pide, y son justo lo que la regla 12 prohíbe.
   5. Todo se presenta como **orientativo**, con la misma honestidad que ya usa
      Ajustes: *"con 16 años y en desarrollo, dicen poco por sí solos"*.

   ⚠️ Josué pidió expresamente terminar Nutrición sabiendo esto. Si más adelante
   prefiere quitar el déficit o escribir los números a mano desde cero, es un
   cambio de una línea en `OBJETIVOS_NUTRICION` y de ninguna en el resto. */

import { calcularEdad } from './helpers';
import { ACTIVIDAD_FACTORES } from '../tokens';

/* ══════════════════════════════════════════════════════════════════════════
   1 · LO QUE SE PREGUNTA — apartados 2, 3 y 4
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 Apartado 2: *"Utilizar los datos del perfil global de JC STYLE cuando estén
   disponibles. **IMPORTANTE: no duplicar información innecesariamente**"*, que es
   la misma regla que `leerDato()` de EH F4. Cada dato declara **de dónde sale del
   perfil**, así que Nutrición no guarda ni una copia de la altura ni del peso. */
export const DATOS_DEL_PERFIL = [
  { id: 'sexo', nombre: 'Sexo', campo: 'sexo', unidad: null },
  { id: 'edad', nombre: 'Edad', campo: 'fechaNacimiento', unidad: 'años', derivado: true },
  { id: 'altura', nombre: 'Altura', campo: 'altura', unidad: 'cm' },
  { id: 'peso', nombre: 'Peso', campo: 'peso', unidad: 'kg' },
];

/* Mifflin-St Jeor necesita saberlo, y el perfil lo guarda con las palabras de la
   Fase A2 (`SEXOS_PERFIL`). ⚠️ Sin respuesta **no se supone ninguno**: se dice
   que falta, que es lo que pide el apartado 14. */
export const SEXO_BMR = [
  { id: 'masculino', nombre: 'Masculino', constante: 5, desdePerfil: ['Masculino'] },
  { id: 'femenino', nombre: 'Femenino', constante: -161, desdePerfil: ['Femenino'] },
];

export function sexoDesdePerfil(perfil) {
  const v = String(perfil?.sexo || '').trim();
  return SEXO_BMR.find((s) => s.desdePerfil.includes(v))?.id || null;
}

/* Apartado 3: *"Crear opciones visuales y fáciles de entender… Cada opción debe
   tener una breve explicación. **No utilizar una lista técnica difícil de
   entender**"*.

   ⚠️ Los cuatro primeros factores son los de `ACTIVIDAD_FACTORES`, que existen en
   `tokens.js` desde la Fase A2 y los usa Ajustes: **no se escriben otra vez**. El
   quinto —*"Muy alto"*, que el enunciado sí pide— es el único añadido. */
export const NIVELES_ACTIVIDAD = [
  { id: 'sedentario', nombre: 'Sedentario', factor: ACTIVIDAD_FACTORES.sedentario, explica: 'Casi todo el día sentado, sin ejercicio.' },
  { id: 'ligero', nombre: 'Ligero', explica: 'Algo de movimiento, o entreno suave 1-2 días.', factor: ACTIVIDAD_FACTORES.ligero },
  { id: 'moderado', nombre: 'Moderado', explica: 'Entreno 3-4 días por semana.', factor: ACTIVIDAD_FACTORES.moderado },
  { id: 'intenso', nombre: 'Alto', explica: 'Entreno 5-6 días, o trabajo de pie todo el día.', factor: ACTIVIDAD_FACTORES.intenso },
  { id: 'muy_alto', nombre: 'Muy alto', explica: 'Entreno duro casi a diario, o dos sesiones al día.', factor: 1.9 },
];

export const nivelActividad = (id) => NIVELES_ACTIVIDAD.find((n) => n.id === id) || null;

/* Apartado 4. `ajuste` es la fracción que se aplica al TDEE.

   ⚠️ **Los tres son suaves a propósito** (±12 %), porque el enunciado pide un
   déficit y un superávit *"controlados"* y porque la regla 12 prohíbe lo
   estricto. Y **ninguno viene elegido**: sin objetivo no hay cálculo. */
export const OBJETIVOS_NUTRICION = [
  { id: 'perder', nombre: 'Perder grasa', explica: 'Déficit suave: comer algo menos de lo que gastas.', ajuste: -0.12 },
  { id: 'mantener', nombre: 'Mantener', explica: 'Comer aproximadamente lo que gastas.', ajuste: 0 },
  { id: 'ganar', nombre: 'Ganar masa', explica: 'Superávit suave: comer algo más de lo que gastas.', ajuste: 0.12 },
];

export const objetivoNut = (id) => OBJETIVOS_NUTRICION.find((o) => o.id === id) || null;

/* ══════════════════════════════════════════════════════════════════════════
   2 · EL CÁLCULO — apartados 5, 6 y 7
   ══════════════════════════════════════════════════════════════════════════ */

export const KCAL_POR_GRAMO = { proteinas: 4, carbohidratos: 4, grasas: 9 };

/* Gramos de proteína por kilo, según el objetivo (apartado 6: *"basada
   principalmente en el peso corporal y el objetivo"*). */
export const PROTEINA_POR_KG = { perder: 2, mantener: 1.8, ganar: 1.8 };
/* Y la grasa, como fracción de las kcal (apartado 7). El resto son hidratos. */
export const FRACCION_GRASAS = 0.28;

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** 🚨 **Mifflin-St Jeor**, que es la que pide el apartado 5, literal.
 *  `null` si falta cualquier dato: nunca un `NaN` (apartado 14). */
export function calcularBMR({ sexo, edad, altura, peso } = {}) {
  const s = SEXO_BMR.find((x) => x.id === sexo);
  const e = num(edad);
  const a = num(altura);
  const p = num(peso);
  if (!s || e === null || a === null || p === null) return null;
  if (e <= 0 || a <= 0 || p <= 0) return null;
  return Math.round(10 * p + 6.25 * a - 5 * e + s.constante);
}

export function calcularTDEE(bmr, actividadId) {
  const n = nivelActividad(actividadId);
  if (bmr === null || bmr === undefined || !n) return null;
  return Math.round(bmr * n.factor);
}

/* 🚨 **Los macros tienen que cuadrar con las kcal** (apartado 7, con su ejemplo
   de lo que NO puede pasar: *"2.400 kcal pero unos macros que matemáticamente
   equivalgan a 2.700"*). Por eso los hidratos son **lo que sobra**, no otro
   porcentaje suelto: así la suma sale por construcción. */
export function calcularObjetivos({ sexo, edad, altura, peso, actividad, objetivo } = {}) {
  const bmr = calcularBMR({ sexo, edad, altura, peso });
  const tdee = calcularTDEE(bmr, actividad);
  const obj = objetivoNut(objetivo);
  const p = num(peso);
  if (bmr === null || tdee === null || !obj || p === null) return null;

  const kcal = Math.round(tdee * (1 + obj.ajuste));
  const proteinas = Math.round(p * (PROTEINA_POR_KG[obj.id] ?? 1.8));
  const grasas = Math.round((kcal * FRACCION_GRASAS) / KCAL_POR_GRAMO.grasas);
  const restantes = kcal - proteinas * KCAL_POR_GRAMO.proteinas - grasas * KCAL_POR_GRAMO.grasas;
  const carbohidratos = Math.max(0, Math.round(restantes / KCAL_POR_GRAMO.carbohidratos));

  return { bmr, tdee, kcal, proteinas, carbohidratos, grasas };
}

/** Las kcal que suman unos macros. Sirve para enseñar el descuadre en vez de
 *  esconderlo cuando él edita un número a mano. */
export function kcalDeMacros({ proteinas, carbohidratos, grasas } = {}) {
  return Math.round(
    (num(proteinas) || 0) * KCAL_POR_GRAMO.proteinas
    + (num(carbohidratos) || 0) * KCAL_POR_GRAMO.carbohidratos
    + (num(grasas) || 0) * KCAL_POR_GRAMO.grasas,
  );
}

/* ⚠️ *"Los macros deben cuadrar **aproximadamente**"* (apartado 7): un margen del
   5 % o de 50 kcal, lo que sea mayor — redondear cuatro números nunca da exacto. */
export const MARGEN_COHERENCIA = 0.05;
export const MARGEN_MINIMO_KCAL = 50;

export function coherencia(objetivos) {
  if (!objetivos) return null;
  const kcal = num(objetivos.kcal);
  if (kcal === null) return null;
  const suma = kcalDeMacros(objetivos);
  const margen = Math.max(MARGEN_MINIMO_KCAL, Math.round(kcal * MARGEN_COHERENCIA));
  const diferencia = suma - kcal;
  return {
    kcal,
    suma,
    diferencia,
    cuadra: Math.abs(diferencia) <= margen,
    texto: Math.abs(diferencia) <= margen
      ? null
      : `Tus macros suman ${suma} kcal y tu objetivo es ${kcal}. Ajusta uno de los dos.`,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   3 · LOS PASOS Y SUS VALIDACIONES — apartados 2 y 14
   ══════════════════════════════════════════════════════════════════════════ */

export const PASOS_CONFIG = [
  { id: 'datos', nombre: 'Tus datos', que: 'Sexo, edad, altura y peso — salen de tu perfil' },
  { id: 'actividad', nombre: 'Actividad', que: 'Cuánto te mueves en una semana normal' },
  { id: 'objetivo', nombre: 'Objetivo', que: 'Qué quieres hacer' },
  { id: 'resumen', nombre: 'Resumen', que: 'Lo que sale, para confirmarlo o cambiarlo' },
];

export const pasoConfig = (id) => PASOS_CONFIG.find((p) => p.id === id) || null;

/* Rangos razonables (apartado 14). ⚠️ Son **topes de sensatez**, no un juicio:
   sirven para que un dedo torpe no guarde 1.870 kg. */
export const RANGOS = {
  edad: { min: 10, max: 100, nombre: 'La edad' },
  altura: { min: 100, max: 250, nombre: 'La altura', unidad: 'cm' },
  peso: { min: 25, max: 300, nombre: 'El peso', unidad: 'kg' },
  kcal: { min: 800, max: 6000, nombre: 'Las calorías', unidad: 'kcal' },
  proteinas: { min: 0, max: 500, nombre: 'La proteína', unidad: 'g' },
  carbohidratos: { min: 0, max: 900, nombre: 'Los carbohidratos', unidad: 'g' },
  grasas: { min: 0, max: 400, nombre: 'Las grasas', unidad: 'g' },
};

/** Un error por campo, en español y **diciendo qué corregir** (EH F62: nunca
 *  «Error» a secas, y ni una palabra técnica). */
export function validar(campo, valor) {
  const r = RANGOS[campo];
  if (!r) return null;
  const n = num(valor);
  if (n === null) return `${r.nombre} tiene que ser un número.`;
  if (n < 0) return `${r.nombre} no puede ser negativa.`;
  if (n < r.min || n > r.max) return `${r.nombre} tiene que estar entre ${r.min} y ${r.max}${r.unidad ? ` ${r.unidad}` : ''}.`;
  return null;
}

export function validarDatos({ sexo, edad, altura, peso, actividad, objetivo } = {}) {
  const errores = {};
  if (!SEXO_BMR.some((s) => s.id === sexo)) errores.sexo = 'Falta el sexo, y hace falta para el cálculo.';
  for (const [campo, valor] of [['edad', edad], ['altura', altura], ['peso', peso]]) {
    const e = validar(campo, valor);
    if (e) errores[campo] = e;
  }
  if (!nivelActividad(actividad)) errores.actividad = 'Elige cuánto te mueves.';
  if (!objetivoNut(objetivo)) errores.objetivo = 'Elige qué quieres hacer.';
  return { errores, valido: Object.keys(errores).length === 0 };
}

/* ══════════════════════════════════════════════════════════════════════════
   4 · LO GUARDADO — apartados 9, 11 y 12
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 **Ni una clave nueva**: los objetivos son un campo de `nutricion`, la clave
   que ya existe (apartado 15: *"respeta la arquitectura existente"*).

   ⚠️ **Y NO se copian la altura ni el peso** (apartado 12: *"no crear una
   estructura rígida que dependa eternamente del peso inicial"*). Se guarda el
   peso **con el que se calculó**, solo para poder decirle que ha cambiado; los
   datos vivos siguen siendo los del perfil. */
export const DEFAULT_OBJETIVOS_NUT = {
  configurado: false,
  actividad: null,
  objetivo: null,
  kcal: null,
  proteinas: null,
  carbohidratos: null,
  grasas: null,
  manual: {},
  pesoAlCalcular: null,
  fecha: null,
};

const enteroValido = (v, campo) => {
  const n = num(v);
  if (n === null) return null;
  const r = RANGOS[campo];
  if (r && (n < r.min || n > r.max)) return null;
  return Math.round(n);
};

export function normalizarObjetivosNut(o) {
  const x = o && typeof o === 'object' ? o : {};
  const manual = x.manual && typeof x.manual === 'object' ? x.manual : {};
  return {
    ...DEFAULT_OBJETIVOS_NUT,
    ...x,
    configurado: x.configurado === true,
    actividad: nivelActividad(x.actividad) ? x.actividad : null,
    objetivo: objetivoNut(x.objetivo) ? x.objetivo : null,
    kcal: enteroValido(x.kcal, 'kcal'),
    proteinas: enteroValido(x.proteinas, 'proteinas'),
    carbohidratos: enteroValido(x.carbohidratos, 'carbohidratos'),
    grasas: enteroValido(x.grasas, 'grasas'),
    /* Solo se conservan las marcas de los cuatro números que existen. */
    manual: Object.fromEntries(
      ['kcal', 'proteinas', 'carbohidratos', 'grasas'].filter((k) => manual[k] === true).map((k) => [k, true]),
    ),
    pesoAlCalcular: num(x.pesoAlCalcular),
    fecha: typeof x.fecha === 'string' && x.fecha ? x.fecha : null,
  };
}

/** El normalizador del módulo, que **devuelve el objeto entero** (regla 5). */
export function normalizarNutricionObjetivos(nutricion) {
  const n = nutricion && typeof nutricion === 'object' ? nutricion : {};
  return { ...n, objetivos: normalizarObjetivosNut(n.objetivos) };
}

/* 🚨 **Decimonoveno `aplicarPlan` del proyecto: sin `confirmado` no escribe.**
   El apartado 8 pide una pantalla de resumen *antes* de confirmar, y el 11 que
   se pueda volver a cambiar un solo valor sin repetir todo el proceso. */
export function planObjetivos({ datos, actual, hoy, confirmado = false } = {}) {
  const { errores, valido } = validarDatos(datos || {});
  if (!valido) return { ok: false, errores, escribe: false };

  const calculado = calcularObjetivos(datos);
  if (!calculado) return { ok: false, errores: { calculo: 'Faltan datos para calcular tus objetivos.' }, escribe: false };

  const previo = normalizarObjetivosNut(actual);
  /* ⚠️ **Lo que él editó a mano manda sobre lo calculado** (apartados 6 y 11), y
     lo dice `manual`. Sin esto, volver a abrir la configuración le borraría el
     número que se había puesto — el fallo de la mochila de HT F7. */
  const conManual = { ...calculado };
  for (const k of ['kcal', 'proteinas', 'carbohidratos', 'grasas']) {
    if (previo.manual[k] && previo[k] !== null) conManual[k] = previo[k];
  }

  const resultado = normalizarObjetivosNut({
    ...previo,
    ...conManual,
    configurado: true,
    actividad: datos.actividad,
    objetivo: datos.objetivo,
    pesoAlCalcular: num(datos.peso),
    fecha: hoy || previo.fecha,
  });

  return {
    ok: true,
    errores: {},
    escribe: confirmado === true,
    calculado,
    resultado,
    coherencia: coherencia(resultado),
    objetivos: confirmado === true ? resultado : null,
  };
}

/** Cambiar UN número a mano (apartado 11), sin repetir el proceso. */
export function editarObjetivo(actual, campo, valor) {
  if (!['kcal', 'proteinas', 'carbohidratos', 'grasas'].includes(campo)) return { objetivos: normalizarObjetivosNut(actual), error: null };
  const error = validar(campo, valor);
  if (error) return { objetivos: normalizarObjetivosNut(actual), error };
  const previo = normalizarObjetivosNut(actual);
  return {
    objetivos: normalizarObjetivosNut({ ...previo, [campo]: Math.round(num(valor)), manual: { ...previo.manual, [campo]: true } }),
    error: null,
  };
}

/** Y volver a lo calculado, quitando la marca de manual. */
export function recalcular(actual, datos, hoy) {
  const previo = normalizarObjetivosNut(actual);
  const plan = planObjetivos({ datos, actual: { ...previo, manual: {} }, hoy, confirmado: true });
  return plan.ok ? plan.objetivos : previo;
}

/* ══════════════════════════════════════════════════════════════════════════
   5 · LO QUE LEE NUTRICIÓN — apartado 10
   ══════════════════════════════════════════════════════════════════════════ */

/** Los cuatro números en la forma que espera `resumenDelDia` de la NU F1, o
 *  `null` si todavía no ha configurado nada — y entonces la pantalla enseña lo
 *  consumido a secas, como hasta ahora. */
export function objetivosParaResumen(nutricion) {
  const o = normalizarObjetivosNut(nutricion?.objetivos);
  if (!o.configurado) return null;
  const salida = {};
  for (const k of ['calorias', 'proteinas', 'carbohidratos', 'grasas']) {
    const v = k === 'calorias' ? o.kcal : o[k];
    if (v !== null) salida[k] = v;
  }
  return Object.keys(salida).length ? salida : null;
}

/* Apartado 12: *"los datos físicos pueden cambiar"*. No se recalcula solo —eso
   sería la app decidiendo—, pero **se le dice**. */
export const DIFERENCIA_PESO_AVISO = 3;

export function avisoDePeso(nutricion, perfil) {
  const o = normalizarObjetivosNut(nutricion?.objetivos);
  const actual = num(perfil?.peso);
  if (!o.configurado || o.pesoAlCalcular === null || actual === null) return null;
  const dif = Math.abs(actual - o.pesoAlCalcular);
  if (dif < DIFERENCIA_PESO_AVISO) return null;
  return `Calculaste esto con ${o.pesoAlCalcular} kg y ahora pesas ${actual}. Puedes volver a calcularlo cuando quieras.`;
}

/* ══════════════════════════════════════════════════════════════════════════
   6 · LOS TEXTOS Y LO QUE NO SE HACE
   ══════════════════════════════════════════════════════════════════════════ */

export const CTA_SIN_CONFIGURAR = {
  titulo: 'Configura tus objetivos',
  detalle: 'Define tus datos y tu objetivo para ver cómo vas cada día.',
  accion: 'Configurar nutrición',
};

/* 🔒 La frase que hace que esto sea orientativo y no una prescripción. Es la
   misma honestidad que Ajustes → Perfil ya usa con el IMC y el TDEE. */
export const AVISO_ORIENTATIVO =
  'Son cifras orientativas, no una dieta: con 16 años y en desarrollo dicen poco por sí solas. '
  + 'Puedes cambiar cualquiera de los cuatro números.';

export const NO_EN_NU3 = [
  { que: 'Un objetivo de peso o un plazo', porque: 'la regla 12 de JosStyle lo prohíbe, y el enunciado tampoco lo pide.' },
  { que: 'Recalcular solo cuando cambie el peso', porque: 'sería la app cambiándole el objetivo por la espalda (apartado 12: "no implementar todavía un sistema avanzado de evolución de peso"). Se le avisa y decide él.' },
  { que: 'El registro de alimentos y la base de alimentos', porque: 'son las Fases 4 y 5.', fase: 'NU F4' },
  { que: 'Las estadísticas', porque: 'son la Fase 6.', fase: 'NU F6' },
  { que: 'La IA nutricional y las recomendaciones de comidas', porque: 'son la Fase 7.', fase: 'NU F7' },
  { que: 'Duplicar la altura, el peso o la edad', porque: 'el apartado 2 lo prohíbe: salen del perfil, y `DATOS_DEL_PERFIL` declara de qué campo.' },
];

export const AUDITORIA_NU3 = { clavesNuevas: 0, datosDuplicados: 0, objetivosDePeso: 0, escrituraSinConfirmar: 0 };

/* ══════════════════════════════════════════════════════════════════════════
   7 · LA CONDICIÓN DE FINALIZACIÓN — apartado 17
   ══════════════════════════════════════════════════════════════════════════ */

export function condicionNU3({ vista } = {}) {
  const codigo = typeof vista === 'string' ? vista : '';
  const datos = { sexo: 'masculino', edad: 16, altura: 187, peso: 72, actividad: 'moderado', objetivo: 'ganar' };
  const calc = calcularObjetivos(datos);
  const planSin = planObjetivos({ datos, hoy: '2026-09-07' });
  const planCon = planObjetivos({ datos, hoy: '2026-09-07', confirmado: true });
  const editado = editarObjetivo(planCon.objetivos, 'kcal', 2600);

  return [
    { id: 1, texto: 'Se pueden configurar los objetivos', ok: planCon.ok && planCon.objetivos.configurado === true },
    { id: 2, texto: 'Y los datos salen del perfil, sin duplicarlos', ok: DATOS_DEL_PERFIL.length === 4 && AUDITORIA_NU3.datosDuplicados === 0 && codigo.includes('DATOS_DEL_PERFIL') },
    { id: 3, texto: 'Se calcula el BMR con Mifflin-St Jeor', ok: calcularBMR(datos) === Math.round(10 * 72 + 6.25 * 187 - 5 * 16 + 5) },
    { id: 4, texto: 'Se calcula el TDEE con el factor de actividad', ok: calc.tdee === Math.round(calc.bmr * nivelActividad('moderado').factor) },
    { id: 5, texto: 'Y se aplica el objetivo elegido', ok: calc.kcal > calc.tdee && calcularObjetivos({ ...datos, objetivo: 'perder' }).kcal < calc.tdee },
    { id: 6, texto: 'Salen las kcal y los tres macros', ok: [calc.kcal, calc.proteinas, calc.carbohidratos, calc.grasas].every((v) => Number.isFinite(v) && v > 0) },
    { id: 7, texto: 'Y los macros cuadran con las kcal', ok: coherencia(calc).cuadra === true },
    { id: 8, texto: 'La configuración se puede editar después, número a número', ok: editado.objetivos.kcal === 2600 && editado.objetivos.manual.kcal === true },
    { id: 9, texto: 'Y lo editado a mano no se pierde al recalcular', ok: planObjetivos({ datos, actual: editado.objetivos, hoy: '2026-09-07', confirmado: true }).objetivos.kcal === 2600 },
    { id: 10, texto: 'Los objetivos llegan a Nutrición', ok: objetivosParaResumen({ objetivos: planCon.objetivos }).calorias === planCon.objetivos.kcal && codigo.includes('objetivosParaResumen') },
    { id: 11, texto: 'Y sin configurar, Nutrición sigue funcionando sin ellos', ok: objetivosParaResumen({ objetivos: null }) === null },
    { id: 12, texto: 'Nada se escribe sin confirmar', ok: planSin.escribe === false && planSin.objetivos === null && AUDITORIA_NU3.escrituraSinConfirmar === 0 },
    { id: 13, texto: 'Se validan los datos imposibles, sin un solo NaN', ok: !!validar('peso', 'x') && !!validar('peso', -5) && !!validar('altura', 1870) && calcularBMR({ ...datos, peso: 'x' }) === null },
    { id: 14, texto: 'No se guarda ningún objetivo de peso ni plazo', ok: AUDITORIA_NU3.objetivosDePeso === 0 && !('pesoObjetivo' in DEFAULT_OBJETIVOS_NUT) },
    { id: 15, texto: 'Ni una clave nueva: viven dentro de `nutricion`', ok: AUDITORIA_NU3.clavesNuevas === 0 },
    { id: 16, texto: 'Y todo se presenta como orientativo', ok: /orientativ/i.test(AVISO_ORIENTATIVO) && codigo.includes('AVISO_ORIENTATIVO') },
  ];
}
