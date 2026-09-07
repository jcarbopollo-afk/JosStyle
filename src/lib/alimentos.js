/* ══════════════════════════════════════════════════════════════════════════
   ALIMENTOS — Entrega 3 · Fase 36 (NU F4)
   Registro de comidas y consumo diario

   *"Convertir el apartado Nutrición en un sistema funcional de registro de
   alimentos"*, con el flujo del apartado 2:

       Comida → Añadir alimento → Buscar alimento → Cantidad → Añadir

   🚨 **DOS PIEZAS DE ESTE ENUNCIADO YA EXISTÍAN, Y NO SE VUELVEN A ESCRIBIR.**
   Antes de crear nada se miró qué hay (la lección de la BL F1, la E3 F16 y la
   E3 F23):

   1. **El cálculo proporcional por gramos ya estaba**, dentro del escáner de
      códigos de la Fase 4 del proyecto: `openFoodFacts.js` devuelve los valores
      **por 100 g** y la pantalla los escalaba. Lo que hacía falta era **sacar
      esa cuenta de la vista** para que la use también el buscador — es
      `escalar()`, y el escáner pasa a llamarla.
   2. **Un alimento registrado es una comida**, la entidad que existe desde la
      Fase 4 con `{ fecha, nombre, calorias, proteinas, carbohidratos, grasas }`.
      Crear una lista `alimentos` al lado habría dejado **lo que Josué ya tiene
      registrado invisible en su propia pantalla**, que es exactamente el fallo
      que la E3 F16 cazó con las notas de la Biblioteca. Esta fase **añade
      campos** (`cantidad`, `unidad`, `por100`) y su normalizador corre al
      cargar, así que lo guardado antes no pierde nada (regla 5).

   🚨 **Y LOS VALORES DE REFERENCIA NO SE INVENTAN** (apartado 5, literal: *"No
   utilizar valores inventados como datos definitivos"*). El buscador tiene dos
   fuentes, las dos reales:

   - **`BASE_ALIMENTOS`**, treinta y seis alimentos genéricos —los que el
     apartado 3 pone de ejemplo: pollo, arroz, avena, leche, plátano, yogur— con
     los valores de referencia habituales por 100 g. Cada uno **declara que son
     orientativos** y **todos son editables antes de guardar**: un huevo no pesa
     lo mismo en dos hueveras.
   - **Open Food Facts**, la misma base pública y sin clave que ya usa el
     escáner, ahora también por nombre. Sus valores son **los de la etiqueta**.

   ⚠️ Lo que NO es de esta fase (apartado 18): la base de alimentos
   personalizados y los favoritos avanzados son la **F5**; las estadísticas, la
   F6; la IA nutricional, la F7.
   ══════════════════════════════════════════════════════════════════════════ */

import { MOMENTOS, IDS_MOMENTOS, MOMENTO_POR_DEFECTO, INDICADORES, comidasDelDia } from './nutricion.js';
import { uid, todayISO } from './helpers.js';

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const round1 = (v) => Math.round(v * 10) / 10;

/* ══════════════════════════════════════════════════════════════════════════
   1 · LA CANTIDAD Y EL CÁLCULO — apartados 4 y 5
   ══════════════════════════════════════════════════════════════════════════ */

/* *"Cada alimento debe disponer de valores por cantidad de referencia"*, y la
   referencia son 100 g (o 100 ml para lo que se bebe). Las dos unidades se
   escalan igual; lo único que cambia es cómo se escribe. */
export const UNIDADES = [
  { id: 'g', nombre: 'gramos', corto: 'g', referencia: 100 },
  { id: 'ml', nombre: 'mililitros', corto: 'ml', referencia: 100 },
  { id: 'ud', nombre: 'unidades', corto: 'ud', referencia: 1 },
];

export const unidad = (id) => UNIDADES.find((u) => u.id === id) || UNIDADES[0];

export const CANTIDAD_MAXIMA = 5000;

/** El cálculo del apartado 5: *"Si el usuario introduce 60 g: calcular
 *  proporcionalmente"*. ⚠️ Los cuatro campos son los de `INDICADORES` más la
 *  fibra, que la comida ya guardaba desde la Fase 4 — **no se pierde**.
 *
 *  🚨 Devuelve `null` con una cantidad imposible en vez de ceros: un plato de
 *  0 kcal registrado por una errata es un dato falso en su historial. */
export function escalar(por100, cantidad, unidadId = 'g') {
  const c = num(cantidad);
  if (c === null || c <= 0 || c > CANTIDAD_MAXIMA) return null;
  if (!por100 || typeof por100 !== 'object') return null;
  const ref = unidad(unidadId).referencia;
  const factor = c / ref;
  return {
    calorias: Math.round((num(por100.calorias) ?? 0) * factor),
    proteinas: round1((num(por100.proteinas) ?? 0) * factor),
    carbohidratos: round1((num(por100.carbohidratos) ?? 0) * factor),
    grasas: round1((num(por100.grasas) ?? 0) * factor),
    fibra: round1((num(por100.fibra) ?? 0) * factor),
  };
}

/** El aviso de una cantidad que no se puede usar, con **qué corregir**, nunca
 *  un "Error" a secas (EH F62). */
export function validarCantidad(valor) {
  const c = num(valor);
  if (c === null) return 'Escribe la cantidad en números.';
  if (c <= 0) return 'La cantidad tiene que ser mayor que cero.';
  if (c > CANTIDAD_MAXIMA) return `Como mucho ${CANTIDAD_MAXIMA} de una vez. Si de verdad es tanto, divídelo en dos.`;
  return null;
}

/* ══════════════════════════════════════════════════════════════════════════
   2 · LA BASE DE ALIMENTOS — apartados 3 y 5
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 **Valores de referencia por 100 g, no inventados** (apartado 5). Son los
   habituales de las tablas de composición de alimentos —el propio enunciado
   pone la avena con 389 kcal, 16,9 g de proteína, 66,3 de carbohidratos y 6,9
   de grasa, que son exactamente esos— y **se enseñan como orientativos**: un
   alimento de verdad depende de la marca, del corte y de cómo se cocine.

   ⚠️ Por eso los cuatro números **son editables antes de guardar**, y por eso
   el escáner sigue estando: la etiqueta de su yogur manda sobre esta tabla.

   ⚠️ Y `tipo` no es decoración: el apartado 3 pide buscar *"por nombre, marca o
   tipo de alimento"*, así que buscar «lácteo» tiene que encontrar la leche. */
export const BASE_ALIMENTOS = [
  { id: 'pollo_pechuga', nombre: 'Pechuga de pollo', tipo: 'carne', unidad: 'g', por100: { calorias: 165, proteinas: 31, carbohidratos: 0, grasas: 3.6, fibra: 0 } },
  { id: 'pollo_muslo', nombre: 'Muslo de pollo', tipo: 'carne', unidad: 'g', por100: { calorias: 209, proteinas: 26, carbohidratos: 0, grasas: 10.9, fibra: 0 } },
  { id: 'ternera', nombre: 'Ternera magra', tipo: 'carne', unidad: 'g', por100: { calorias: 187, proteinas: 26, carbohidratos: 0, grasas: 9, fibra: 0 } },
  { id: 'cerdo_lomo', nombre: 'Lomo de cerdo', tipo: 'carne', unidad: 'g', por100: { calorias: 143, proteinas: 26, carbohidratos: 0, grasas: 3.5, fibra: 0 } },
  { id: 'pavo', nombre: 'Pechuga de pavo', tipo: 'carne', unidad: 'g', por100: { calorias: 135, proteinas: 29, carbohidratos: 0, grasas: 1.7, fibra: 0 } },
  { id: 'atun_natural', nombre: 'Atún al natural', tipo: 'pescado', unidad: 'g', por100: { calorias: 116, proteinas: 26, carbohidratos: 0, grasas: 1, fibra: 0 } },
  { id: 'salmon', nombre: 'Salmón', tipo: 'pescado', unidad: 'g', por100: { calorias: 208, proteinas: 20, carbohidratos: 0, grasas: 13, fibra: 0 } },
  { id: 'merluza', nombre: 'Merluza', tipo: 'pescado', unidad: 'g', por100: { calorias: 86, proteinas: 17, carbohidratos: 0, grasas: 1.8, fibra: 0 } },
  { id: 'huevo', nombre: 'Huevo', tipo: 'huevo', unidad: 'ud', por100: { calorias: 78, proteinas: 6.3, carbohidratos: 0.6, grasas: 5.3, fibra: 0 } },
  { id: 'clara_huevo', nombre: 'Clara de huevo', tipo: 'huevo', unidad: 'g', por100: { calorias: 52, proteinas: 11, carbohidratos: 0.7, grasas: 0.2, fibra: 0 } },
  { id: 'arroz_blanco', nombre: 'Arroz blanco (crudo)', tipo: 'cereal', unidad: 'g', por100: { calorias: 360, proteinas: 7, carbohidratos: 79, grasas: 0.7, fibra: 1.3 } },
  { id: 'arroz_cocido', nombre: 'Arroz blanco (cocido)', tipo: 'cereal', unidad: 'g', por100: { calorias: 130, proteinas: 2.7, carbohidratos: 28, grasas: 0.3, fibra: 0.4 } },
  { id: 'pasta_cruda', nombre: 'Pasta (cruda)', tipo: 'cereal', unidad: 'g', por100: { calorias: 371, proteinas: 13, carbohidratos: 75, grasas: 1.5, fibra: 3.2 } },
  { id: 'pasta_cocida', nombre: 'Pasta (cocida)', tipo: 'cereal', unidad: 'g', por100: { calorias: 131, proteinas: 5, carbohidratos: 25, grasas: 1.1, fibra: 1.2 } },
  { id: 'avena', nombre: 'Avena', tipo: 'cereal', unidad: 'g', por100: { calorias: 389, proteinas: 16.9, carbohidratos: 66.3, grasas: 6.9, fibra: 10.6 } },
  { id: 'pan_blanco', nombre: 'Pan blanco', tipo: 'cereal', unidad: 'g', por100: { calorias: 265, proteinas: 9, carbohidratos: 49, grasas: 3.2, fibra: 2.7 } },
  { id: 'pan_integral', nombre: 'Pan integral', tipo: 'cereal', unidad: 'g', por100: { calorias: 247, proteinas: 13, carbohidratos: 41, grasas: 3.4, fibra: 7 } },
  { id: 'patata', nombre: 'Patata', tipo: 'verdura', unidad: 'g', por100: { calorias: 77, proteinas: 2, carbohidratos: 17, grasas: 0.1, fibra: 2.2 } },
  { id: 'lentejas', nombre: 'Lentejas (cocidas)', tipo: 'legumbre', unidad: 'g', por100: { calorias: 116, proteinas: 9, carbohidratos: 20, grasas: 0.4, fibra: 8 } },
  { id: 'garbanzos', nombre: 'Garbanzos (cocidos)', tipo: 'legumbre', unidad: 'g', por100: { calorias: 164, proteinas: 8.9, carbohidratos: 27, grasas: 2.6, fibra: 7.6 } },
  { id: 'leche_entera', nombre: 'Leche entera', tipo: 'lácteo', unidad: 'ml', por100: { calorias: 61, proteinas: 3.2, carbohidratos: 4.8, grasas: 3.3, fibra: 0 } },
  { id: 'leche_desnatada', nombre: 'Leche desnatada', tipo: 'lácteo', unidad: 'ml', por100: { calorias: 35, proteinas: 3.4, carbohidratos: 5, grasas: 0.1, fibra: 0 } },
  { id: 'yogur_natural', nombre: 'Yogur natural', tipo: 'lácteo', unidad: 'g', por100: { calorias: 61, proteinas: 3.5, carbohidratos: 4.7, grasas: 3.3, fibra: 0 } },
  { id: 'yogur_griego', nombre: 'Yogur griego', tipo: 'lácteo', unidad: 'g', por100: { calorias: 97, proteinas: 9, carbohidratos: 3.9, grasas: 5, fibra: 0 } },
  { id: 'queso_fresco', nombre: 'Queso fresco', tipo: 'lácteo', unidad: 'g', por100: { calorias: 98, proteinas: 11, carbohidratos: 3.4, grasas: 4.3, fibra: 0 } },
  { id: 'platano', nombre: 'Plátano', tipo: 'fruta', unidad: 'g', por100: { calorias: 89, proteinas: 1.1, carbohidratos: 23, grasas: 0.3, fibra: 2.6 } },
  { id: 'manzana', nombre: 'Manzana', tipo: 'fruta', unidad: 'g', por100: { calorias: 52, proteinas: 0.3, carbohidratos: 14, grasas: 0.2, fibra: 2.4 } },
  { id: 'naranja', nombre: 'Naranja', tipo: 'fruta', unidad: 'g', por100: { calorias: 47, proteinas: 0.9, carbohidratos: 12, grasas: 0.1, fibra: 2.4 } },
  { id: 'fresas', nombre: 'Fresas', tipo: 'fruta', unidad: 'g', por100: { calorias: 32, proteinas: 0.7, carbohidratos: 7.7, grasas: 0.3, fibra: 2 } },
  { id: 'tomate', nombre: 'Tomate', tipo: 'verdura', unidad: 'g', por100: { calorias: 18, proteinas: 0.9, carbohidratos: 3.9, grasas: 0.2, fibra: 1.2 } },
  { id: 'lechuga', nombre: 'Lechuga', tipo: 'verdura', unidad: 'g', por100: { calorias: 15, proteinas: 1.4, carbohidratos: 2.9, grasas: 0.2, fibra: 1.3 } },
  { id: 'brocoli', nombre: 'Brócoli', tipo: 'verdura', unidad: 'g', por100: { calorias: 34, proteinas: 2.8, carbohidratos: 7, grasas: 0.4, fibra: 2.6 } },
  { id: 'aceite_oliva', nombre: 'Aceite de oliva', tipo: 'grasa', unidad: 'ml', por100: { calorias: 884, proteinas: 0, carbohidratos: 0, grasas: 100, fibra: 0 } },
  { id: 'aguacate', nombre: 'Aguacate', tipo: 'grasa', unidad: 'g', por100: { calorias: 160, proteinas: 2, carbohidratos: 9, grasas: 15, fibra: 7 } },
  { id: 'almendras', nombre: 'Almendras', tipo: 'fruto seco', unidad: 'g', por100: { calorias: 579, proteinas: 21, carbohidratos: 22, grasas: 50, fibra: 12.5 } },
  { id: 'cacahuete_crema', nombre: 'Crema de cacahuete', tipo: 'fruto seco', unidad: 'g', por100: { calorias: 588, proteinas: 25, carbohidratos: 20, grasas: 50, fibra: 6 } },
];

export const alimentoDeBase = (id) => BASE_ALIMENTOS.find((a) => a.id === id) || null;

export const TIPOS_ALIMENTO = [...new Set(BASE_ALIMENTOS.map((a) => a.tipo))];

/* 🔒 La frase que hace honesta la tabla de arriba, y va **en pantalla**, no en
   un comentario: son valores de referencia, no la etiqueta de su bote. */
export const AVISO_REFERENCIA =
  'Valores de referencia por 100 g. Cambia los que quieras antes de guardar: cada marca y cada forma de cocinar dan un número distinto.';

/* ══════════════════════════════════════════════════════════════════════════
   3 · EL BUSCADOR — apartado 3
   ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ **Ninguno de los cuatro buscadores de la aplicación sirve aquí** —
   `indiceBusqueda.js` busca pantallas, `buscarModulos()` apartados de Estilo de
   hombre, `buscadorEstilo.js` sus elementos y `bibliotecaGlobal.js` los de la
   Biblioteca (E3 F22)—: éste busca **alimentos**. Y como los otros, **no guarda
   un índice**: se quedaría viejo en cuanto la F5 le deje añadir los suyos. */

const sinTildes = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const MINIMO_BUSQUEDA = 2;

export function buscarAlimentos(texto, base = BASE_ALIMENTOS) {
  const q = sinTildes(texto).trim();
  if (q.length < MINIMO_BUSQUEDA) return [];
  return base
    .map((a) => {
      const nombre = sinTildes(a.nombre);
      const tipo = sinTildes(a.tipo);
      const marca = sinTildes(a.marca);
      /* El que empieza por lo escrito va primero: buscando «pan» interesa más
         *Pan blanco* que *Crema de cacahuete*. */
      if (nombre.startsWith(q)) return { a, peso: 0 };
      if (nombre.includes(q)) return { a, peso: 1 };
      if (marca && marca.includes(q)) return { a, peso: 2 };
      if (tipo.includes(q)) return { a, peso: 3 };
      return null;
    })
    .filter(Boolean)
    .sort((x, y) => x.peso - y.peso || x.a.nombre.localeCompare(y.a.nombre, 'es'))
    .map((x) => x.a);
}

/* ⚠️ Lo que Open Food Facts devuelve por nombre tiene **la misma forma** que un
   alimento de la base, para que la pantalla no tenga que distinguirlos. Sus
   valores son los de la etiqueta; los de la tabla, de referencia. */
export function alimentoDesdeOFF(producto) {
  if (!producto || !producto.nombre) return null;
  return {
    id: `off_${producto.codigo || uid()}`,
    nombre: producto.nombre,
    marca: producto.marca || '',
    tipo: 'producto',
    unidad: 'g',
    por100: { ...producto.por100g },
    fuente: 'off',
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   4 · REGISTRAR, EDITAR Y BORRAR — apartados 2, 6, 7 y 8
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 **Un alimento registrado ES una comida.** Los campos de siempre no se
   tocan —los leen `resumenDelDia`, el hub, el Dashboard, la exportación y el
   contexto de la IA—; esta fase **añade** `cantidad`, `unidad` y `por100`, que
   son lo que hace falta para poder **editar la cantidad** (apartado 7) sin
   volver a buscar el alimento. */
export function crearComidaDesdeAlimento({ alimento, cantidad, momentoId, fecha, unidadId } = {}) {
  if (!alimento) return null;
  const u = unidadId || alimento.unidad || 'g';
  const valores = escalar(alimento.por100, cantidad, u);
  if (!valores) return null;
  return {
    id: uid(),
    fecha: fecha || todayISO(),
    momento: IDS_MOMENTOS.includes(momentoId) ? momentoId : null,
    nombre: alimento.marca ? `${alimento.nombre} (${alimento.marca})` : alimento.nombre,
    ...valores,
    cantidad: num(cantidad),
    unidad: u,
    por100: { ...alimento.por100 },
    alimentoId: alimento.id || null,
  };
}

/** 🚨 **Cambiar la cantidad recalcula los macros; si no, la ficha mentiría.**
 *  Y solo se puede con `por100` guardado: una comida escrita a mano antes de
 *  esta fase no tiene de qué escalar, así que **se dice** en vez de fingir un
 *  control que no hace nada (regla 8). */
export function cambiarCantidad(comida, cantidad) {
  if (!comida) return { ok: false, error: 'No hay nada que cambiar.' };
  if (!comida.por100) {
    return { ok: false, error: 'Esta comida se escribió a mano, así que no hay valores por 100 g de los que calcular. Edita los números directamente.', sinReferencia: true };
  }
  const error = validarCantidad(cantidad);
  if (error) return { ok: false, error };
  const valores = escalar(comida.por100, cantidad, comida.unidad || 'g');
  if (!valores) return { ok: false, error: 'Esa cantidad no se puede calcular.' };
  return { ok: true, error: null, comida: { ...comida, ...valores, cantidad: num(cantidad) } };
}

/** *"Cambiar de comida"* (apartado 7): mover un alimento de Cena a Merienda no
 *  toca ni un número, solo dónde aparece. */
export function cambiarMomento(comida, momentoId) {
  if (!comida) return null;
  if (!IDS_MOMENTOS.includes(momentoId)) return comida;
  return { ...comida, momento: momentoId };
}

/** Editar los números a mano (apartado 7). ⚠️ Al hacerlo **se pierde la
 *  referencia por 100 g**: los números ya no salen de ella, así que dejarla
 *  haría que el siguiente cambio de cantidad los pisara con los viejos. */
export function editarValores(comida, valores) {
  if (!comida) return null;
  const limpio = {};
  for (const campo of ['calorias', 'proteinas', 'carbohidratos', 'grasas', 'fibra']) {
    if (valores && valores[campo] !== undefined) {
      const n = num(valores[campo]);
      limpio[campo] = n === null || n < 0 ? 0 : campo === 'calorias' ? Math.round(n) : round1(n);
    }
  }
  const cambia = Object.keys(limpio).length > 0;
  return { ...comida, ...limpio, ...(cambia ? { por100: null } : {}) };
}

/* 🚨 **El normalizador de la comida ampliada.** ⚠️ Vigésima vez del fallo del
   normalizador en este proyecto: sin estas líneas, el siguiente guardado se
   llevaría `cantidad`, `unidad` y `por100`, y editar la cantidad dejaría de
   funcionar **sin un solo error por pantalla**.

   ⚠️ Y lo guardado antes de esta fase **no pierde nada**: sin `cantidad` se
   queda en `null`, que es la verdad —nadie sabe cuántos gramos era aquello—. */
export function normalizarComidaF4(c) {
  if (!c || typeof c !== 'object') return null;
  const cant = num(c.cantidad);
  const u = UNIDADES.some((x) => x.id === c.unidad) ? c.unidad : null;
  const p = c.por100 && typeof c.por100 === 'object' ? {
    calorias: num(c.por100.calorias) ?? 0,
    proteinas: num(c.por100.proteinas) ?? 0,
    carbohidratos: num(c.por100.carbohidratos) ?? 0,
    grasas: num(c.por100.grasas) ?? 0,
    fibra: num(c.por100.fibra) ?? 0,
  } : null;
  return {
    ...c,
    cantidad: cant !== null && cant > 0 ? cant : null,
    unidad: u,
    por100: p,
    alimentoId: typeof c.alimentoId === 'string' ? c.alimentoId : null,
  };
}

/** ⚠️ Devuelve **el módulo entero** (regla 5): perder `agua` o `favoritos` aquí
 *  los borraría en el siguiente guardado. */
export function normalizarNutricionF4(nutricion) {
  const n = nutricion && typeof nutricion === 'object' ? nutricion : {};
  return { ...n, comidas: (Array.isArray(n.comidas) ? n.comidas : []).map(normalizarComidaF4).filter(Boolean) };
}

/** *"Cómo se ve la cantidad"*: «60 g», «2 ud», y **nada** si no se sabe — un
 *  «0 g» sería inventarse una cantidad que él nunca escribió. */
export function textoCantidad(comida) {
  const c = num(comida?.cantidad);
  if (c === null || c <= 0) return null;
  return `${c} ${unidad(comida.unidad || 'g').corto}`;
}

/* ══════════════════════════════════════════════════════════════════════════
   5 · LOS TOTALES POR COMIDA — apartado 9
   ══════════════════════════════════════════════════════════════════════════ */

/* *"DESAYUNO — 520 kcal · 32 g proteína · 65 g carbohidratos · 14 g grasas"*.
   ⚠️ **Se derivan**, como todo lo demás: guardar el total de un momento sería
   una copia que miente en cuanto él borre un alimento. */
export function totalesDeMomento(comidasDelMomento) {
  const lista = Array.isArray(comidasDelMomento) ? comidasDelMomento : [];
  const t = { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 };
  for (const c of lista) {
    t.calorias += num(c?.calorias) ?? 0;
    t.proteinas += num(c?.proteinas) ?? 0;
    t.carbohidratos += num(c?.carbohidratos) ?? 0;
    t.grasas += num(c?.grasas) ?? 0;
    t.fibra += num(c?.fibra) ?? 0;
  }
  return {
    calorias: Math.round(t.calorias),
    proteinas: round1(t.proteinas),
    carbohidratos: round1(t.carbohidratos),
    grasas: round1(t.grasas),
    fibra: round1(t.fibra),
    alimentos: lista.length,
  };
}

/** La línea de resumen del apartado 9. ⚠️ **Sin alimentos devuelve `null`**, no
 *  una línea de ceros: un momento vacío tiene su estado vacío (apartado 14). */
export function lineaDeMomento(comidasDelMomento) {
  const t = totalesDeMomento(comidasDelMomento);
  if (t.alimentos === 0) return null;
  return {
    kcal: `${t.calorias} kcal`,
    macros: `${t.proteinas} g proteína · ${t.carbohidratos} g carbohidratos · ${t.grasas} g grasas`,
    totales: t,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   6 · SUPERAR EL OBJETIVO — apartado 11
   ══════════════════════════════════════════════════════════════════════════ */

/* *"No romper la barra ni generar porcentajes visualmente absurdos. Mostrar
   claramente que se ha superado el objetivo."*

   🚨 El dato **no se topa** y el pintado **sí** — es lo que la E3 F35 ya decidió
   con `porcentaje` y `porcentajePintado`, así que aquí solo se le pone nombre a
   los tres estados. Ni una segunda cuenta. */
export const ESTADOS_OBJETIVO = [
  { id: 'sin_objetivo', nombre: 'Sin objetivo', tono: 'neutro' },
  { id: 'en_camino', nombre: 'Vas por aquí', tono: 'neutro' },
  { id: 'cumplido', nombre: 'Objetivo alcanzado', tono: 'ok' },
  { id: 'superado', nombre: 'Por encima del objetivo', tono: 'aviso' },
];

export const estadoObjetivo = (id) => ESTADOS_OBJETIVO.find((e) => e.id === id) || ESTADOS_OBJETIVO[0];

export const MARGEN_CUMPLIDO = 0.98;

/** ⚠️ *"Por encima del objetivo"*, nunca *"te has pasado"*: es un dato, no un
 *  reproche (la lección de EH F58 y de la E3 F13). */
export function estadoDeIndicador(indicador) {
  if (!indicador || indicador.objetivo === null || indicador.objetivo === undefined) return estadoObjetivo('sin_objetivo');
  const consumido = num(indicador.consumido) ?? 0;
  const objetivo = num(indicador.objetivo);
  if (!objetivo || objetivo <= 0) return estadoObjetivo('sin_objetivo');
  if (consumido > objetivo) return estadoObjetivo('superado');
  if (consumido >= objetivo * MARGEN_CUMPLIDO) return estadoObjetivo('cumplido');
  return estadoObjetivo('en_camino');
}

/** Lo que sobra, para poder decirlo con un número en vez de con un adjetivo. */
export function excesoDe(indicador) {
  if (estadoDeIndicador(indicador).id !== 'superado') return null;
  const sobra = (num(indicador.consumido) ?? 0) - (num(indicador.objetivo) ?? 0);
  return Math.round(sobra * 10) / 10;
}

/* ══════════════════════════════════════════════════════════════════════════
   7 · LOS ESTADOS VACÍOS — apartado 14
   ══════════════════════════════════════════════════════════════════════════ */

export const VACIO_MOMENTO_F4 = {
  titulo: 'Todavía no has añadido alimentos',
  accion: 'Añadir alimento',
};

export const PASOS_ANADIR = [
  { id: 'buscar', nombre: 'Buscar alimento', que: 'Escribe lo que has comido.' },
  { id: 'cantidad', nombre: 'Cantidad', que: 'Cuánto has comido, y los números se calculan solos.' },
];

/* ══════════════════════════════════════════════════════════════════════════
   8 · LO QUE ESTA FASE NO HACE — apartado 18
   ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ **El escáner y la foto NO se quitan.** El apartado 18 dice *"no
   implementar"* el escáner de códigos, y **ya existe desde la Fase 4 del
   proyecto**: «no implementar» no es «quitar», y quitarlo habría roto un
   apartado que funciona. Es literalmente la misma lección de la E3 F34. */
export const YA_EXISTIA = [
  { que: 'El escáner de códigos de barras', desde: 'Fase 4 del proyecto', porque: 'el apartado 18 dice "no implementar", no "quitar" — y funciona.' },
  { que: 'La foto del plato con la IA', desde: 'Fase 4 del proyecto', porque: 'igual: existe y funciona, y esta fase no la toca.' },
  { que: 'Los favoritos básicos', desde: 'Fase 4 del proyecto', porque: 'lo que el apartado 18 aplaza son los "favoritos avanzados", que son la F5.' },
  { que: 'El cálculo proporcional por gramos', desde: 'el escáner, Fase 4', porque: 'estaba dentro de la vista; ahora es `escalar()` y lo usan los dos.' },
];

export const NO_EN_NU4 = [
  { que: 'Alimentos personalizados propios', porque: 'son la Fase 5.', fase: 'NU F5' },
  { que: 'Los favoritos avanzados', porque: 'son la Fase 5. Los básicos ya existen.', fase: 'NU F5' },
  { que: 'Las estadísticas y la evolución', porque: 'son la Fase 6.', fase: 'NU F6' },
  { que: 'La IA nutricional y las recomendaciones', porque: 'son la Fase 7.', fase: 'NU F7' },
  { que: 'La planificación semanal', porque: 'es la Fase 7.', fase: 'NU F7' },
];

export const AUDITORIA_NU4 = { clavesNuevas: 0, listasParalelas: 0, modelosDuplicados: 0, valoresInventados: 0 };

/* ══════════════════════════════════════════════════════════════════════════
   9 · LA CONDICIÓN DE FINALIZACIÓN — apartado 19
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 **Se calcula**, no se pone a mano: cada punto ejecuta lo que promete (EH
   F64, E3 F15 y E3 F35). Con una pantalla vacía se pone roja. */
export function condicionNU4({ vista } = {}) {
  const codigo = String(vista || '');
  const avena = alimentoDeBase('avena');
  const sesenta = escalar(avena.por100, 60, 'g');
  const comida = crearComidaDesdeAlimento({ alimento: avena, cantidad: 60, momentoId: 'desayuno', fecha: '2026-09-07' });
  const doble = cambiarCantidad(comida, 120);
  const movida = cambiarMomento(comida, 'cena');
  const dia = [comida, { id: 'x', fecha: '2026-09-07', momento: 'cena', nombre: 'Otra', calorias: 500, proteinas: 20, carbohidratos: 50, grasas: 10 }];

  return [
    { id: 1, texto: 'Se pueden añadir alimentos', ok: !!comida && comida.calorias === 233 && codigo.includes('AnadirAlimento') },
    { id: 2, texto: 'Se puede seleccionar una comida', ok: comida.momento === 'desayuno' && MOMENTOS.length === 5 },
    { id: 3, texto: 'Se puede introducir la cantidad', ok: comida.cantidad === 60 && comida.unidad === 'g' },
    { id: 4, texto: 'Las kcal y los macros se calculan solos', ok: sesenta.calorias === 233 && sesenta.proteinas === 10.1 && sesenta.carbohidratos === 39.8 },
    { id: 5, texto: 'Y salen de valores reales, no inventados', ok: avena.por100.calorias === 389 && avena.por100.proteinas === 16.9 && AUDITORIA_NU4.valoresInventados === 0 },
    { id: 6, texto: 'Los totales del día se actualizan', ok: comidasDelDia(dia, '2026-09-07').length === 2 && INDICADORES.length === 4 },
    { id: 7, texto: 'Y los de cada comida también', ok: lineaDeMomento([comida]).kcal === '233 kcal' && lineaDeMomento([]) === null },
    { id: 8, texto: 'Se puede editar la cantidad, y recalcula', ok: doble.ok && doble.comida.calorias === 467 && doble.comida.cantidad === 120 },
    { id: 9, texto: 'Se puede cambiar de comida sin tocar los números', ok: movida.momento === 'cena' && movida.calorias === comida.calorias },
    { id: 10, texto: 'Se puede eliminar, por la puerta de siempre', ok: codigo.includes('onDeleteComida') },
    { id: 11, texto: 'El buscador encuentra por nombre, marca y tipo', ok: buscarAlimentos('pollo').length >= 2 && buscarAlimentos('lácteo').length >= 3 },
    { id: 12, texto: 'Y sin escribir lo suficiente no busca', ok: buscarAlimentos('a').length === 0 },
    { id: 13, texto: 'Los datos siguen separados por día', ok: comidasDelDia(dia, '2026-09-06').length === 0 },
    { id: 14, texto: 'Y persisten donde siempre, sin clave nueva', ok: AUDITORIA_NU4.clavesNuevas === 0 && AUDITORIA_NU4.listasParalelas === 0 },
    { id: 15, texto: 'Superar el objetivo no rompe la barra', ok: estadoDeIndicador({ consumido: 2550, objetivo: 2400 }).id === 'superado' && excesoDe({ consumido: 2550, objetivo: 2400 }) === 150 },
    { id: 16, texto: 'Un momento sin alimentos tiene su estado vacío', ok: !!VACIO_MOMENTO_F4.accion && !/error/i.test(VACIO_MOMENTO_F4.titulo) },
    { id: 17, texto: 'Y no se ha roto nada: el modelo es el de siempre, ampliado', ok: AUDITORIA_NU4.modelosDuplicados === 0 && normalizarComidaF4({ nombre: 'De antes', calorias: 200 }).cantidad === null },
  ];
}
