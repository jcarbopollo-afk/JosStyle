// Motor mínimo de correlaciones entre módulos. Se crea en la Fase 6 para la primera correlación
// real del proyecto (sueño → horas de estudio), pero está pensado desde el nombre de archivo y
// la forma de las funciones para reutilizarse en la Fase 16 (Estadísticas y correlaciones), donde
// se espera que aparezcan más pares de módulos (sueño-ánimo, entreno-energía, etc.).
//
// Principio igual que en el resto de la IA de la app: esto solo calcula y muestra datos — nunca
// decide nada por el usuario, y cualquier lectura ("parece que..." ) debe poder señalar el dato
// concreto en el que se basa.

import { calcularDuracion, fechaValida } from './helpers';
import { fechasDeEntreno } from './fechasDeEntreno';
/* Fase 1C — la semana empieza el lunes y se calcula en local: la del motor de rachas, que
   solo importa helpers (sin ciclos). */
import { lunesDe } from './rachas';

const lista = (v) => (Array.isArray(v) ? v : []);

/* 🐛 Fase 1B — `Number(null)` es 0 y `Number(undefined)` es NaN: un ánimo o unas horas que
   no están no son un cero (la lección de la E3 F31). Se descartan, no se cuentan. */
const numeroFinito = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const mediaDe = (valores) => (valores.length
  ? Math.round((valores.reduce((s, v) => s + v, 0) / valores.length) * 10) / 10
  : null);

/**
 * Cruza dos series por fecha (mismo día) y devuelve solo los pares donde hay dato en ambas series.
 * Genérica a propósito: no sabe nada de sueño ni de estudio, para poder reutilizarse con
 * cualquier otro par de módulos en el futuro motor de correlaciones (Fase 16).
 * ⚠️ Recorre cada elemento de A: si A puede traer varios registros del mismo día, se agrupa
 * por día ANTES de cruzar (`horasDeEstudioPorDia`, `animoPorDia`) — si no, un día cuenta varias
 * veces (CX-11).
 */
export function cruzarPorFecha(serieA, fechaKeyA, valorA, serieB, fechaKeyB, valorB) {
  const mapaB = {};
  lista(serieB).forEach((item) => {
    if (!item) return;
    const v = valorB(item);
    if (v !== undefined && v !== null) mapaB[item[fechaKeyB]] = v;
  });
  return lista(serieA)
    .filter(Boolean)
    .map((item) => ({ fecha: item[fechaKeyA], a: valorA(item), b: mapaB[item[fechaKeyA]] }))
    .filter((p) => p.a !== undefined && p.a !== null && p.b !== undefined && p.b !== null);
}

/* ═══════════════════════════════════════════════════════════════════════════
   🐛 Fase 1B · CX-11 — LA UNIDAD ES EL DÍA, NO EL REGISTRO
   ═══════════════════════════════════════════════════════════════════════════
   Estudios apunta una entrada de horas **por asignatura** (`onAddHoras`), así que tres
   asignaturas un día eran tres «días con datos» y la media salía por entrada: 1,5 h donde
   había estudiado 3. Se suma por día antes de cruzar, y el Diario se agrupa igual (una entrada
   por día por diseño, pero una importación puede traer dos: su ánimo se promedia). */

/** Las horas de estudio de cada día: la suma de todas sus asignaturas. Fecha local válida y un
 *  número de verdad; lo demás no cuenta. */
export function horasDeEstudioPorDia(horas) {
  const porDia = new Map();
  for (const h of lista(horas)) {
    if (!h || !fechaValida(h.fecha)) continue;
    const n = numeroFinito(h.horas);
    if (n === null || n < 0) continue;
    porDia.set(h.fecha, (porDia.get(h.fecha) || 0) + n);
  }
  /* Redondeo a centésimas solo para quitar el ruido de coma flotante (0,1 + 0,2). */
  return [...porDia].map(([fecha, total]) => ({ fecha, horas: Math.round(total * 100) / 100 }));
}

/** 🔓 Fase 1C — ¿es un ánimo de la escala? El Diario guarda el `valor` de `ESTADOS_ANIMO`
 *  (`tokens.js`): un **número entero del 1 al 5**, y la propia pantalla del Diario solo
 *  reconoce esos (`e.valor === entrada.animo`). Así que se acepta exactamente eso: ni un
 *  booleano (`Number(true)` es 1), ni un texto («4»), ni una lista (`Number([4])` es 4), ni un
 *  3,5 que el Diario pintaría como «Normal». */
export const esAnimoValido = (v) => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5;

/** El ánimo de cada día del Diario (1 a 5, la escala de `ESTADOS_ANIMO`). Una entrada sin ánimo
 *  o con un valor que no es de la escala no cuenta; dos el mismo día se promedian. */
export function animoPorDia(entradas) {
  const porDia = new Map();
  for (const e of lista(entradas)) {
    if (!e || !fechaValida(e.fecha)) continue;
    if (!esAnimoValido(e.animo)) continue;
    const n = e.animo;
    const d = porDia.get(e.fecha) || { suma: 0, n: 0 };
    d.suma += n;
    d.n += 1;
    porDia.set(e.fecha, d);
  }
  return [...porDia].map(([fecha, d]) => ({ fecha, animo: d.suma / d.n }));
}

const duracionDeSueno = (s) => calcularDuracion(s.horaDormir, s.horaDespertar);

/**
 * Primera correlación real del proyecto: ¿los días con más horas de estudio coinciden con noches
 * de sueño más largas la noche anterior? Umbral simple y explicable (7h), no un modelo estadístico
 * complejo — coherente con el tono "prudente y directo" que debe tener la IA de toda la app.
 * Exige al menos 2 días de cada grupo (sueño largo / sueño corto) antes de mostrar nada, para no
 * sacar conclusiones con casi ningún dato.
 * ⚠️ «La noche anterior» con la misma fecha es correcto (CX-10): el sueño se apunta por la mañana
 * y lleva la fecha de ese día.
 */
export function correlacionSuenoEstudio(sueno, horas) {
  const pares = cruzarPorFecha(horasDeEstudioPorDia(horas), 'fecha', (h) => h.horas, sueno, 'fecha', duracionDeSueno);
  // Se descartan los registros de sueño sin horas válidas: `null < 7` es `true` en
  // JavaScript, así que sin este filtro un registro incompleto se contaría como una
  // noche corta y falsearía la correlación entera.
  const conHoras = pares.filter((p) => p.b !== null);
  const buenSueno = conHoras.filter((p) => p.b >= 7);
  const suenoCorto = conHoras.filter((p) => p.b < 7);

  return {
    pares,
    suficientesDatos: buenSueno.length >= 2 && suenoCorto.length >= 2,
    mediaHorasConBuenSueno: mediaDe(buenSueno.map((p) => p.a)),
    mediaHorasConSuenoCorto: mediaDe(suenoCorto.map((p) => p.a)),
    diasBuenSueno: buenSueno.length,
    diasSuenoCorto: suenoCorto.length,
  };
}

/**
 * Fase 16 — segunda correlación: ¿duermo mejor influye en cómo me siento al día siguiente
 * (ánimo del Diario, mismo día)? Mismo umbral de 7h y mismo criterio de "al menos 2 días en
 * cada grupo" que la correlación de arriba, por coherencia.
 */
export function correlacionSuenoAnimo(sueno, entradasDiario) {
  const pares = cruzarPorFecha(animoPorDia(entradasDiario), 'fecha', (d) => d.animo, sueno, 'fecha', duracionDeSueno);
  // Se descartan los registros de sueño sin horas válidas: `null < 7` es `true` en
  // JavaScript, así que sin este filtro un registro incompleto se contaría como una
  // noche corta y falsearía la correlación entera.
  const conHoras = pares.filter((p) => p.b !== null);
  const buenSueno = conHoras.filter((p) => p.b >= 7);
  const suenoCorto = conHoras.filter((p) => p.b < 7);

  return {
    pares,
    suficientesDatos: buenSueno.length >= 2 && suenoCorto.length >= 2,
    mediaAnimoConBuenSueno: mediaDe(buenSueno.map((p) => p.a)),
    mediaAnimoConSuenoCorto: mediaDe(suenoCorto.map((p) => p.a)),
    diasBuenSueno: buenSueno.length,
    diasSuenoCorto: suenoCorto.length,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   🐛 Fase 1B · CX-09 — ENTRENAR Y ÁNIMO LEE LOS ENTRENAMIENTOS DE VERDAD
   ═══════════════════════════════════════════════════════════════════════════
   Solo leía `calistenia[habilidad].sesiones`, que desde la v3.158.0 ya no se puede registrar:
   con entrenamientos de Fitness decía «0 días con sesión», y con calistenia vieja metía los días
   de Fitness en «sin entreno» y **podía invertir la conclusión**. Los días con entreno salen
   ahora de `fechasDeEntreno` (Fitness completados + las fechas de la calistenia de antes, cada
   día una vez).

   🚨 Y solo cuentan los días del Diario **desde el primer entrenamiento registrado** (la regla
   de la constancia de la FIT F31): antes de registrar ninguno no se sabe si entrenaba, y
   contarlos como «sin entreno» sería verdad en el dato y engañaría en la conclusión.

   🐛 Fase 1C — y por la misma razón, **tampoco después de dejar de registrar**. La auditoría
   lo reprodujo: dos semanas apuntando entrenamientos hace cuatro meses y el Diario seguido
   hasta hoy daban «5 días con entreno, ánimo 4 · 115 sin entreno, ánimo 3,1»: el grupo «sin»
   eran los meses en los que no apuntaba, no los días en que descansaba. No tener un
   entrenamiento registrado **no dice que no entrenara**. Así que un día del Diario solo entra
   en la comparación si cae en el **periodo en el que se sabe que apuntaba**:
     · entre el primer y el último día con un entrenamiento registrado, y
     · en una **semana (lunes a domingo) con al menos un entrenamiento registrado**.
   Una semana sin ninguno no se puede leer —¿descanso o un hueco en el registro?—, así que
   sus días no son ni «con» ni «sin»: quedan fuera y se cuentan aparte (`diasFuera`). La
   semana es la unidad de la constancia de la FIT F31 y del plan (F6). El precio es honesto:
   una semana entera de descanso real tampoco cuenta, y el mínimo de tres días por grupo no
   cambia. Nada de esto dice que entrenar cause el ánimo: compara dos grupos de días. */

/**
 * Fase 16 — tercera correlación: los días que entreno, ¿el ánimo del Diario ese mismo día tiende
 * a ser distinto? Exige al menos 3 días en cada grupo (con entreno / sin entreno) — algo más que
 * el resto porque aquí se compara contra "el resto de mis días", un grupo casi siempre más grande
 * y variado.
 */
export const DIAS_MINIMOS_POR_GRUPO_ENTRENO = 3;

export function correlacionEntrenoAnimo({ fitness = null, calistenia = null } = {}, entradasDiario = []) {
  const entreno = fechasDeEntreno({ fitness, calistenia });
  const semanasConEntreno = new Set([...entreno.todas].map((f) => lunesDe(f)));
  const desdeElPrimero = entreno.primera
    ? animoPorDia(entradasDiario).filter((d) => d.fecha >= entreno.primera)
    : [];
  const enPeriodo = (d) => d.fecha <= entreno.ultima && semanasConEntreno.has(lunesDe(d.fecha));
  const dias = desdeElPrimero.filter(enPeriodo);
  const conEntreno = dias.filter((d) => entreno.todas.has(d.fecha));
  const sinEntreno = dias.filter((d) => !entreno.todas.has(d.fecha));
  const semanasComparadas = new Set(dias.map((d) => lunesDe(d.fecha)));

  return {
    suficientesDatos: conEntreno.length >= DIAS_MINIMOS_POR_GRUPO_ENTRENO && sinEntreno.length >= DIAS_MINIMOS_POR_GRUPO_ENTRENO,
    mediaAnimoConEntreno: mediaDe(conEntreno.map((d) => d.animo)),
    mediaAnimoSinEntreno: mediaDe(sinEntreno.map((d) => d.animo)),
    diasConEntreno: conEntreno.length,
    diasSinEntreno: sinEntreno.length,
    desde: entreno.primera,
    hasta: entreno.ultima,
    semanasComparadas: semanasComparadas.size,
    /* Días del Diario, desde el primer entrenamiento, que no se comparan: semanas sin ningún
       entrenamiento registrado o después del último. */
    diasFuera: desdeElPrimero.length - dias.length,
    diasEntrenoFitness: entreno.deFitness,
    conCalisteniaAnterior: entreno.deCalistenia > 0,
  };
}
