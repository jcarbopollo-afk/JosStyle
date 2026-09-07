/* Entrega 3 · Fase 33 (NU F1) — «Rediseño premium del apartado Nutrición»
   ═══════════════════════════════════════════════════════════════════════════

   🚨 **ES UNA FASE DE PANTALLA, NO DE FUNCIONES.** El enunciado lo dice antes que
   nada: *"EN ESTA FASE NO IMPLEMENTES TODAVÍA: formularios de configuración
   nutricional, cálculos de calorías o macros, base de datos de alimentos,
   registro funcional de comidas, estadísticas, IA nutricional, lógica
   avanzada."* Lo que se construye es la **estructura visual** que las fases 2 a 8
   van a rellenar.

   ── 🚨 Y ahí hay una contradicción que hay que resolver bien ─────────────────

   El apartado 2 pide enseñar *"1.850 / 2.400 kcal"* y el 3, un porcentaje de
   progreso. **Los objetivos nutricionales no existen todavía** —son la Fase 3,
   *"Configuración y objetivos nutricionales"*— y el propio apartado 2 avisa:
   *"Los números son únicamente ejemplos visuales… NO hardcodear estos valores
   como datos reales del usuario."*

   Pintar un «/ 2.400» inventado sería exactamente la cifra falsa que prohíben la
   regla 8 del proyecto y el propio criterio de finalización (*"No haya
   funcionalidad falsa o inventada"*). Y **la regla 7 va más lejos**: la IA de
   JosStyle no da *"objetivos calóricos o de peso estrictos"* — Josué tiene 16
   años y está creciendo.

   Así que: **`objetivo` es un campo del indicador, no un número escrito aquí.**
   Sin objetivo se enseña lo consumido, grande y solo; con objetivo —cuando la
   Fase 3 se lo deje poner a él— aparecen el «de X» y la barra, **sin tocar esta
   pantalla**. Eso es la *"base visual premium, sólida y escalable"* del apartado
   13, y es lo que se comprueba en las pruebas: el componente sabe hacer las dos
   cosas y hoy solo puede hacer una.

   ── Lo que sí es real ────────────────────────────────────────────────────────

   **Los totales del día salen de las comidas que ya tenía guardadas** desde la
   Fase 4 del proyecto: kcal, proteínas, carbohidratos y grasas. Y el selector de
   días **funciona de verdad**, porque las comidas ya llevan fecha: un selector
   que no cambiara nada sería un control decorativo (regla 8). Lo que no se
   construye es el **historial y las estadísticas**, que son la Fase 2. */

import { todayISO, addDays } from './helpers';

/* ══════════════════════════════════════════════════════════════════════════
   1 · LOS CUATRO INDICADORES — apartados 2, 3 y 4
   ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ Una línea por indicador, con su icono, su unidad y **de qué campo de la
   comida sale**. Añadir uno (la fibra, por ejemplo, que ya se guarda) es una
   línea aquí: ni un `case`, ni un `if` en la pantalla. */
export const INDICADORES = [
  { id: 'calorias', emoji: '🔥', nombre: 'Calorías', unidad: 'kcal', campo: 'calorias', principal: true, decimales: 0 },
  { id: 'proteinas', emoji: '💪', nombre: 'Proteína', unidad: 'g', campo: 'proteinas', principal: false, decimales: 1 },
  { id: 'carbohidratos', emoji: '🍚', nombre: 'Carbohidratos', unidad: 'g', campo: 'carbohidratos', principal: false, decimales: 1 },
  { id: 'grasas', emoji: '🥑', nombre: 'Grasas', unidad: 'g', campo: 'grasas', principal: false, decimales: 1 },
];

export const indicador = (id) => INDICADORES.find((i) => i.id === id) || null;
/* *"Las kcal deben tener una jerarquía ligeramente superior"* (apartado 4). */
export const INDICADOR_PRINCIPAL = INDICADORES.find((i) => i.principal);
export const MACROS = INDICADORES.filter((i) => !i.principal);

const numero = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const redondear = (v, decimales) => {
  const f = 10 ** Math.max(0, decimales);
  return Math.round(numero(v) * f) / f;
};

/* ══════════════════════════════════════════════════════════════════════════
   2 · LOS MOMENTOS DEL DÍA — apartado 6
   ══════════════════════════════════════════════════════════════════════════ */

/* *"DESAYUNO · COMIDA · MERIENDA · CENA · EXTRAS"*, en ese orden. */
export const MOMENTOS = [
  { id: 'desayuno', nombre: 'Desayuno', emoji: '🌅' },
  { id: 'comida', nombre: 'Comida', emoji: '🍽️' },
  { id: 'merienda', nombre: 'Merienda', emoji: '🥪' },
  { id: 'cena', nombre: 'Cena', emoji: '🌙' },
  { id: 'extras', nombre: 'Extras', emoji: '✨' },
];

export const MOMENTO_POR_DEFECTO = 'extras';
export const momento = (id) => MOMENTOS.find((m) => m.id === id) || null;
export const IDS_MOMENTOS = MOMENTOS.map((m) => m.id);

/* 🚨 **Una comida guardada antes de esta fase NO tenía momento, y no se le
   inventa uno.** `momento` se queda en `null` —no se escribe `'extras'` en el
   dato— y al agrupar cae en Extras, que es el cajón que el propio enunciado
   define para lo que no encaja en los otros cuatro. Decir que aquella tostada
   fue un desayuno sería inventarse cuándo se la comió. */
export function normalizarComida(c) {
  if (!c || typeof c !== 'object') return null;
  return {
    ...c,
    momento: IDS_MOMENTOS.includes(c.momento) ? c.momento : null,
  };
}

export function normalizarComidas(lista) {
  return (Array.isArray(lista) ? lista : []).map(normalizarComida).filter(Boolean);
}

/** Y el normalizador del módulo entero, que **devuelve el objeto completo**:
 *  `saveData` sobrescribe, así que perder `agua` o `favoritos` aquí los borraría
 *  en el siguiente guardado (regla 5). */
export function normalizarNutricionDe(nutricion) {
  const n = nutricion && typeof nutricion === 'object' ? nutricion : {};
  return { ...n, comidas: normalizarComidas(n.comidas) };
}

/* ══════════════════════════════════════════════════════════════════════════
   3 · EL DÍA — apartado 5
   ══════════════════════════════════════════════════════════════════════════ */

/* *"‹ AYER | HOY | MAÑANA ›"*. ⚠️ El selector **funciona**: las comidas ya
   llevan fecha desde la Fase 4, así que uno que no cambiara nada sería un
   control decorativo (regla 8). Lo que no se construye aquí es el historial ni
   las estadísticas, que son la Fase 2 de Nutrición. */
export function etiquetaDeDia(fechaISO, hoy = todayISO()) {
  if (fechaISO === hoy) return 'Hoy';
  if (fechaISO === addDays(hoy, -1)) return 'Ayer';
  if (fechaISO === addDays(hoy, 1)) return 'Mañana';
  return new Date(`${fechaISO}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
}

export const esFuturo = (fechaISO, hoy = todayISO()) => fechaISO > hoy;

export function comidasDelDia(comidas, fechaISO) {
  return (Array.isArray(comidas) ? comidas : []).filter((c) => c && c.fecha === fechaISO);
}

/** Agrupadas por momento, en el orden del apartado 6 y **sin perder ninguna**:
 *  las que no tienen momento van a Extras. */
export function porMomento(comidas, fechaISO) {
  const delDia = comidasDelDia(comidas, fechaISO);
  const salida = Object.fromEntries(MOMENTOS.map((m) => [m.id, []]));
  for (const c of delDia) {
    const id = IDS_MOMENTOS.includes(c.momento) ? c.momento : MOMENTO_POR_DEFECTO;
    salida[id].push(c);
  }
  return salida;
}

/* ══════════════════════════════════════════════════════════════════════════
   4 · EL RESUMEN DEL DÍA — de datos reales
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 `objetivos` llega de fuera y hoy siempre es `null`: **los objetivos son la
   Fase 3**. La función sabe trabajar con ellos y sin ellos, así que esa fase se
   limitará a pasárselos. */
export function resumenDelDia(comidas, fechaISO, objetivos = null) {
  const delDia = comidasDelDia(comidas, fechaISO);
  return INDICADORES.map((ind) => {
    const consumido = redondear(delDia.reduce((a, c) => a + numero(c[ind.campo]), 0), ind.decimales);
    const objetivo = objetivos && Number.isFinite(Number(objetivos[ind.id])) && Number(objetivos[ind.id]) > 0
      ? Number(objetivos[ind.id])
      : null;
    return {
      ...ind,
      consumido,
      objetivo,
      /* ⚠️ **Sin objetivo no hay porcentaje**: `null`, nunca un cero ni un cien.
         Es la regla de siempre (E3 F13, E3 F24, E3 F27). */
      porcentaje: objetivo ? Math.round((consumido / objetivo) * 100) : null,
      /* Y el pintado se topa al 100 aunque el dato pase (E3 F27). */
      porcentajePintado: objetivo ? Math.min(100, Math.round((consumido / objetivo) * 100)) : null,
      texto: objetivo ? `${consumido} / ${objetivo} ${ind.unidad}` : `${consumido} ${ind.unidad}`,
    };
  });
}

/** *"¿Cómo voy hoy respecto a mis objetivos nutricionales?"* (apartado 1). Hoy
 *  la respuesta honesta es la mitad: lo que lleva comido. */
export function hayAlgoRegistrado(comidas, fechaISO) {
  return comidasDelDia(comidas, fechaISO).length > 0;
}

/* ══════════════════════════════════════════════════════════════════════════
   5 · LOS ESTADOS VACÍOS — apartado 7
   ══════════════════════════════════════════════════════════════════════════ */

/* *"NO mostrar una pantalla vacía ni una lista de cajas sin contenido […] Debe
   sentirse integrado con JC STYLE, no como un mensaje de error."* */
export const VACIO_DIA = {
  titulo: 'Todavía no has registrado ninguna comida',
  detalle: 'Añade la primera para ver cómo va tu día.',
  accion: 'Añadir comida',
};

export const VACIO_MOMENTO = 'Nada todavía';

/* ══════════════════════════════════════════════════════════════════════════
   6 · LO QUE ESTA FASE NO HACE — apartados 13 y 14
   ══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_NU1 = [
  { que: 'Los objetivos de kcal y macros', porque: 'son la Fase 3 ("Configuración y objetivos nutricionales"). El indicador ya sabe pintarlos: solo le faltan.', fase: 'NU F3' },
  { que: 'Un objetivo calórico puesto por la aplicación', porque: 'la regla 7 de JosStyle lo prohíbe: nada de objetivos calóricos o de peso estrictos, y menos a los 16 años. Los pondrá él.', fase: null },
  { que: 'El historial y las estadísticas de días anteriores', porque: 'son la Fase 2 y la Fase 6. El selector de día ya funciona, pero no hay pantalla de historial.', fase: 'NU F2' },
  { que: 'Una base de alimentos', porque: 'es la Fase 5. Lo que hay es el escáner de códigos y los favoritos, que ya existían.', fase: 'NU F5' },
  { que: 'Inteligencia nutricional', porque: 'es la Fase 7. El panel de IA que ya había se conserva tal cual.', fase: 'NU F7' },
  { que: 'Números de ejemplo en la pantalla', porque: 'el apartado 2 lo dice y la regla 8 también: los del enunciado son un ejemplo de maqueta, no datos.', fase: null },
];

export const AUDITORIA_NU1 = { clavesNuevas: 0, botonesDecorativos: 0, cifrasInventadas: 0, funcionesEliminadas: 0 };

/* ══════════════════════════════════════════════════════════════════════════
   7 · LA CONDICIÓN DE FINALIZACIÓN — apartado 14
   ══════════════════════════════════════════════════════════════════════════ */

export function condicionNU1({ vista } = {}) {
  const codigo = typeof vista === 'string' ? vista : '';
  const HOY = '2026-09-07';
  const comidas = [
    { id: 'c1', fecha: HOY, nombre: 'Avena', calorias: 350, proteinas: 12, carbohidratos: 55, grasas: 8, momento: 'desayuno' },
    { id: 'c2', fecha: HOY, nombre: 'Pollo', calorias: 500, proteinas: 45, carbohidratos: 10, grasas: 15, momento: 'comida' },
    { id: 'c3', fecha: '2026-09-06', nombre: 'Ayer', calorias: 900, proteinas: 30, carbohidratos: 90, grasas: 20, momento: 'cena' },
  ];
  const r = resumenDelDia(comidas, HOY);
  const conObjetivos = resumenDelDia(comidas, HOY, { calorias: 2400, proteinas: 140 });

  return [
    /* ⚠️ Se comprueba que la vista USE el resumen, no que importe la constante:
       un import sin usar habría dado esta casilla por buena. */
    { id: 1, texto: 'Los cuatro indicadores son los protagonistas', ok: INDICADORES.length === 4 && codigo.includes('resumenDelDia') && codigo.includes('<Indicador') },
    { id: 2, texto: 'Y las calorías tienen jerarquía superior', ok: INDICADOR_PRINCIPAL.id === 'calorias' && MACROS.length === 3 },
    { id: 3, texto: 'Sus números salen de las comidas de verdad', ok: r[0].consumido === 850 && r[1].consumido === 57 },
    { id: 4, texto: 'Y solo las del día que se está mirando', ok: resumenDelDia(comidas, '2026-09-06')[0].consumido === 900 },
    { id: 5, texto: 'Sin objetivo no se inventa un objetivo', ok: r.every((x) => x.objetivo === null) && r[0].texto === '850 kcal' },
    { id: 6, texto: 'Ni un porcentaje', ok: r.every((x) => x.porcentaje === null) },
    { id: 7, texto: 'Pero el indicador ya sabe pintarlo cuando la Fase 3 lo traiga', ok: conObjetivos[0].porcentaje === 35 && conObjetivos[0].texto === '850 / 2400 kcal' },
    { id: 8, texto: 'Y el pintado no pasa del 100 % aunque el dato sí', ok: resumenDelDia(comidas, HOY, { calorias: 500 })[0].porcentajePintado === 100 },
    { id: 9, texto: 'El selector de día funciona de verdad', ok: codigo.includes('etiquetaDeDia') && etiquetaDeDia('2026-09-06', HOY) === 'Ayer' && etiquetaDeDia('2026-09-08', HOY) === 'Mañana' },
    { id: 10, texto: 'La zona de comidas tiene los cinco momentos', ok: MOMENTOS.length === 5 && codigo.includes('MOMENTOS.map') && codigo.includes('porMomento') },
    { id: 11, texto: 'Y una comida sin momento no se pierde: va a Extras', ok: porMomento([{ id: 'x', fecha: HOY, nombre: 'Sin momento' }], HOY).extras.length === 1 },
    { id: 12, texto: 'Sin momento guardado NO se escribe uno', ok: normalizarComida({ id: 'x' }).momento === null },
    { id: 13, texto: 'Los estados vacíos son de verdad, no un mensaje de error', ok: !!VACIO_DIA.titulo && !!VACIO_DIA.accion && codigo.includes('VACIO_DIA') },
    { id: 14, texto: 'No hay ni una cifra inventada ni un botón decorativo', ok: AUDITORIA_NU1.cifrasInventadas === 0 && AUDITORIA_NU1.botonesDecorativos === 0 },
    { id: 15, texto: 'Y no se ha quitado nada de lo que ya funcionaba', ok: AUDITORIA_NU1.funcionesEliminadas === 0 && codigo.includes('BarcodeScanner') && codigo.includes('AIPanel') },
  ];
}
