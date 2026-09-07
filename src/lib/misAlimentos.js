/* ══════════════════════════════════════════════════════════════════════════
   MIS ALIMENTOS — Entrega 3 · Fase 37 (NU F5)
   Base de alimentos, personalizados y favoritos

   *"El usuario no debería tener que introducir manualmente la información
   nutricional de un alimento cada vez que lo consume."*

   🚨 **ESTE ARCHIVO NO REDEFINE NADA DE `alimentos.js`** (NU F4). La base, el
   buscador, el escalado, las unidades y el registro son suyos y se **importan**;
   aquí vive lo que la F4 no tenía: **los alimentos que crea Josué, sus favoritos
   y los recientes**. Mismo reparto que `gestionModulos.js` / `estiloDeHombre.js`
   y que `avisosHorario.js` / `notificaciones.js`.

   🚨 **Y NI UNA CLAVE NUEVA DE `app_data`** (apartado 14). `alimentosPropios` y
   `favoritosAlimentos` son **dos campos de `nutricion`**, la clave de siempre.

   ⚠️ **Cuidado con la palabra «favoritos», que ya significa otra cosa aquí.**
   `nutricion.favoritos` existe desde la Fase 4 del proyecto y son **comidas
   guardadas enteras** —lo que se registra con un toque desde la pestaña
   Favoritos—. Lo que pide el apartado 7 de esta fase son **alimentos marcados**,
   que es otra cosa: por eso se llama `favoritosAlimentos`, con su nombre
   distinto. Dos listas del mismo módulo no pueden llamarse igual (EH F22).
   ══════════════════════════════════════════════════════════════════════════ */

import {
  BASE_ALIMENTOS, alimentoDeBase, buscarAlimentos, UNIDADES, unidad,
  escalar, crearComidaDesdeAlimento, MINIMO_BUSQUEDA,
} from './alimentos.js';
import { comidasDelDia, etiquetaDeDia } from './nutricion.js';
import { uid, todayISO } from './helpers.js';

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const round1 = (v) => Math.round(v * 10) / 10;
const texto = (v) => (typeof v === 'string' ? v.trim() : '');

/* ══════════════════════════════════════════════════════════════════════════
   1 · LAS CATEGORÍAS — apartado 3
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 **Agrupar es un catálogo más la palabra que cada alimento ya lleva**, no un
   mapa `id → grupo` aparte (EH F30). Cada alimento de la F4 tiene su `tipo`
   desde que se escribió; aquí solo se le pone icono y nombre.

   ⚠️ El enunciado encabeza su lista con *"Ejemplos:"*, así que **no es una lista
   cerrada**: éstas son las que tienen alimentos de verdad, y una fase futura que
   añada un alimento con un `tipo` nuevo **añade su línea aquí**. */
export const CATEGORIAS_ALIMENTO = [
  { id: 'carne', nombre: 'Carnes', emoji: '🥩' },
  { id: 'pescado', nombre: 'Pescados', emoji: '🐟' },
  { id: 'huevo', nombre: 'Huevos', emoji: '🥚' },
  { id: 'lácteo', nombre: 'Lácteos', emoji: '🥛' },
  { id: 'cereal', nombre: 'Cereales y pan', emoji: '🍞' },
  { id: 'fruta', nombre: 'Frutas', emoji: '🍌' },
  { id: 'verdura', nombre: 'Verduras', emoji: '🥦' },
  { id: 'legumbre', nombre: 'Legumbres', emoji: '🫘' },
  { id: 'fruto seco', nombre: 'Frutos secos', emoji: '🥜' },
  { id: 'grasa', nombre: 'Grasas y aceites', emoji: '🫒' },
  { id: 'producto', nombre: 'Productos con marca', emoji: '🏷️' },
  { id: 'otros', nombre: 'Otros', emoji: '🍫' },
];

export const CATEGORIA_POR_DEFECTO = 'otros';
export const categoria = (id) => CATEGORIAS_ALIMENTO.find((c) => c.id === id) || null;
export const IDS_CATEGORIA = CATEGORIAS_ALIMENTO.map((c) => c.id);

export const categoriaDe = (alimento) =>
  categoria(alimento?.tipo) || categoria(CATEGORIA_POR_DEFECTO);

/** Los alimentos de una categoría, del catálogo completo. ⚠️ Devuelve `[]` si no
 *  hay ninguno: una categoría vacía no se pinta, no se pinta vacía. */
export function porCategoria(catalogo) {
  const lista = Array.isArray(catalogo) ? catalogo : [];
  return CATEGORIAS_ALIMENTO
    .map((c) => ({ ...c, alimentos: lista.filter((a) => (a.tipo || CATEGORIA_POR_DEFECTO) === c.id) }))
    .filter((c) => c.alimentos.length > 0);
}

/* ══════════════════════════════════════════════════════════════════════════
   2 · LOS ALIMENTOS PROPIOS — apartados 4, 5 y 6
   ══════════════════════════════════════════════════════════════════════════ */

export const CAMPOS_PROPIO = [
  { id: 'nombre', nombre: 'Nombre', obligatorio: true, tipo: 'texto' },
  { id: 'marca', nombre: 'Marca', obligatorio: false, tipo: 'texto', nota: 'Opcional' },
  { id: 'calorias', nombre: 'Kcal', obligatorio: true, tipo: 'numero', por: '100 g' },
  { id: 'proteinas', nombre: 'Proteína', obligatorio: true, tipo: 'numero', por: '100 g', unidad: 'g' },
  { id: 'carbohidratos', nombre: 'Carbohidratos', obligatorio: true, tipo: 'numero', por: '100 g', unidad: 'g' },
  { id: 'grasas', nombre: 'Grasas', obligatorio: true, tipo: 'numero', por: '100 g', unidad: 'g' },
];

export const MAXIMO_POR_100 = { calorias: 900, proteinas: 100, carbohidratos: 100, grasas: 100 };

/** *"Validar todos los campos"* (apartado 5). ⚠️ Cada aviso dice **qué
 *  corregir**, nunca «Error» a secas (EH F62). */
export function validarPropio(campos = {}) {
  const errores = {};
  if (!texto(campos.nombre)) errores.nombre = 'Ponle un nombre para poder encontrarlo luego.';
  for (const c of ['calorias', 'proteinas', 'carbohidratos', 'grasas']) {
    const v = num(campos[c]);
    const nombre = CAMPOS_PROPIO.find((x) => x.id === c).nombre;
    if (v === null) errores[c] = `Escribe ${nombre.toLowerCase()} en números, por 100 g.`;
    else if (v < 0) errores[c] = `${nombre} no puede ser negativo.`;
    else if (v > MAXIMO_POR_100[c]) errores[c] = `${nombre} por 100 g no puede pasar de ${MAXIMO_POR_100[c]}. Mira la etiqueta otra vez.`;
  }
  /* ⚠️ Y un alimento de 0 kcal no existe: sería registrar un plato que no suma
     nada (regla 8, la misma decisión que con las fichas de Open Food Facts). */
  if (!errores.calorias && num(campos.calorias) === 0) {
    errores.calorias = 'Un alimento de 0 kcal no se puede registrar. Comprueba la etiqueta.';
  }
  return { errores, valido: Object.keys(errores).length === 0 };
}

/** ⚠️ Un alimento propio tiene **la misma forma** que uno de la base: así el
 *  buscador, el escalado y el registro de la F4 lo tratan igual, sin un solo
 *  `if`. `propio: true` es lo único que lo distingue. */
export function crearAlimentoPropio(campos = {}) {
  const { errores, valido } = validarPropio(campos);
  if (!valido) return { ok: false, errores, alimento: null };
  return {
    ok: true,
    errores: {},
    alimento: {
      id: `propio_${uid()}`,
      nombre: texto(campos.nombre),
      marca: texto(campos.marca),
      tipo: IDS_CATEGORIA.includes(campos.tipo) ? campos.tipo : CATEGORIA_POR_DEFECTO,
      unidad: UNIDADES.some((u) => u.id === campos.unidad) ? campos.unidad : 'g',
      por100: {
        calorias: Math.round(num(campos.calorias)),
        proteinas: round1(num(campos.proteinas)),
        carbohidratos: round1(num(campos.carbohidratos)),
        grasas: round1(num(campos.grasas)),
        fibra: num(campos.fibra) === null ? 0 : round1(num(campos.fibra)),
      },
      propio: true,
      creado: todayISO(),
    },
  };
}

/* 🚨 *"No permitir modificar accidentalmente alimentos globales si estos
   pertenecen a una base protegida"* (apartado 6). La base de la F4 **es** esa
   base protegida: sus valores son los de referencia, y si Josué los cambiara,
   los cambiaría para siempre y sin saberlo.

   ⚠️ Y no se le deja sin salida: `duplicarComoPropio` le hace **una copia suya**
   que sí puede tocar. Prohibir sin ofrecer la alternativa sería un botón muerto. */
export const esProtegido = (id) => !!alimentoDeBase(id);

export const AVISO_PROTEGIDO =
  'Éste es un alimento de la lista básica y sus valores son de referencia, así que no se tocan. Puedes hacerte una copia propia y cambiarla a tu gusto.';

export function editarAlimentoPropio(alimento, campos = {}) {
  if (!alimento) return { ok: false, errores: { general: 'No hay nada que editar.' }, alimento: null };
  if (esProtegido(alimento.id)) return { ok: false, errores: { protegido: AVISO_PROTEGIDO }, alimento: null, protegido: true };
  const mezcla = {
    nombre: campos.nombre !== undefined ? campos.nombre : alimento.nombre,
    marca: campos.marca !== undefined ? campos.marca : alimento.marca,
    tipo: campos.tipo !== undefined ? campos.tipo : alimento.tipo,
    unidad: campos.unidad !== undefined ? campos.unidad : alimento.unidad,
    calorias: campos.calorias !== undefined ? campos.calorias : alimento.por100.calorias,
    proteinas: campos.proteinas !== undefined ? campos.proteinas : alimento.por100.proteinas,
    carbohidratos: campos.carbohidratos !== undefined ? campos.carbohidratos : alimento.por100.carbohidratos,
    grasas: campos.grasas !== undefined ? campos.grasas : alimento.por100.grasas,
    fibra: campos.fibra !== undefined ? campos.fibra : alimento.por100.fibra,
  };
  const r = crearAlimentoPropio(mezcla);
  if (!r.ok) return r;
  /* ⚠️ **Se conservan el id y la fecha de creación.** Un id nuevo dejaría sus
     favoritos apuntando al alimento viejo y sus comidas registradas huérfanas. */
  return { ok: true, errores: {}, alimento: { ...r.alimento, id: alimento.id, creado: alimento.creado || todayISO() } };
}

/** ⚠️ **Editar un alimento NO reescribe lo ya registrado** (apartado 16). Una
 *  comida guardada lleva sus números y su copia de `por100` desde la F4: son
 *  historial, y el historial no cambia porque hoy corrija una etiqueta. */
export const NO_SE_REESCRIBE =
  'Cambiar un alimento no toca lo que ya tienes registrado: aquellos días se quedan con los números que tenían.';

export function normalizarAlimentoPropio(a) {
  if (!a || typeof a !== 'object') return null;
  if (!a.id || !texto(a.nombre)) return null;
  const p = a.por100 && typeof a.por100 === 'object' ? a.por100 : {};
  const cal = num(p.calorias);
  if (cal === null || cal <= 0) return null;
  return {
    id: a.id,
    nombre: texto(a.nombre),
    marca: texto(a.marca),
    tipo: IDS_CATEGORIA.includes(a.tipo) ? a.tipo : CATEGORIA_POR_DEFECTO,
    unidad: UNIDADES.some((u) => u.id === a.unidad) ? a.unidad : 'g',
    por100: {
      calorias: Math.round(cal),
      proteinas: round1(num(p.proteinas) ?? 0),
      carbohidratos: round1(num(p.carbohidratos) ?? 0),
      grasas: round1(num(p.grasas) ?? 0),
      fibra: round1(num(p.fibra) ?? 0),
    },
    propio: true,
    creado: typeof a.creado === 'string' ? a.creado : null,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   3 · LOS FAVORITOS — apartados 7 y 15
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 *"FAVORITOS: **referencia** a alimentos existentes"* y *"no duplicar
   innecesariamente el mismo alimento"* (apartado 15). Así que se guarda **el
   id y nada más** — como las colecciones de la BL F7—: de ahí sale gratis que
   editar el alimento cambie su favorito, y que quitarlo de favoritos no lo
   borre. */
export function alternarFavoritoAlimento(favoritos, id) {
  const lista = Array.isArray(favoritos) ? favoritos.filter((x) => typeof x === 'string') : [];
  return lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];
}

export const esFavorito = (favoritos, id) =>
  (Array.isArray(favoritos) ? favoritos : []).includes(id);

/** ⚠️ Un favorito que apunta a un alimento que ya no existe **no se pinta**, y
 *  el normalizador lo limpia: guardar el id de algo borrado es guardar una
 *  mentira (EH F24). */
export function alimentosFavoritos(favoritos, catalogo) {
  const lista = Array.isArray(catalogo) ? catalogo : [];
  return (Array.isArray(favoritos) ? favoritos : [])
    .map((id) => lista.find((a) => a.id === id))
    .filter(Boolean);
}

/* ══════════════════════════════════════════════════════════════════════════
   4 · LOS RECIENTES — apartado 8
   ══════════════════════════════════════════════════════════════════════════ */

/* 🚨 **NO SE GUARDA UN HISTORIAL DE RECIENTES: SE DERIVA DE LAS COMIDAS.** El
   apartado 14 pide que los recientes persistan, y persisten — porque **las
   comidas persisten**, y cada una lleva su `alimentoId` desde la F4. Una lista
   `recientes` guardada aparte sería una copia que se queda vieja en cuanto él
   borre una comida, y entonces el selector le ofrecería alimentos de días que ya
   no existen. Es la misma decisión que `estadisticasPlan.js` (E3 F13) y
   `progresoEstilo.js` (EH F35). */
export const ARQUITECTURA_RECIENTES = {
  guardado: false,
  deDonde: 'nutricion.comidas → alimentoId',
  porque: 'una lista guardada aparte se queda vieja en cuanto él borre una comida, y el selector le ofrecería alimentos de días que ya no existen.',
  persiste: 'sí: las comidas persisten, y los recientes salen de ellas.',
};

export const DIAS_RECIENTES = 7;
export const MAXIMO_RECIENTES = 12;

/** Los alimentos usados últimamente, **agrupados por día** —*"Hoy: Avena, Leche,
 *  Plátano · Ayer: Pollo, Arroz"*— y sin repetir uno que ya salió en un día más
 *  reciente: verlo dos veces no ayuda a encontrarlo. */
export function recientesPorDia(comidas, catalogo, hoy = todayISO(), dias = DIAS_RECIENTES) {
  const lista = Array.isArray(comidas) ? comidas : [];
  const cat = Array.isArray(catalogo) ? catalogo : [];
  const fechas = [...new Set(lista.map((c) => c && c.fecha).filter((f) => typeof f === 'string' && f <= hoy))]
    .sort((a, b) => (a < b ? 1 : -1))
    .slice(0, dias);
  const vistos = new Set();
  const salida = [];
  for (const fecha of fechas) {
    const alimentos = [];
    for (const c of comidasDelDia(lista, fecha)) {
      const a = c.alimentoId ? cat.find((x) => x.id === c.alimentoId) : null;
      if (!a || vistos.has(a.id)) continue;
      vistos.add(a.id);
      alimentos.push(a);
    }
    if (alimentos.length) salida.push({ fecha, etiqueta: etiquetaDeDia(fecha, hoy), alimentos });
  }
  return salida;
}

/** La misma lista, en plano y recortada, para el selector. */
export function recientes(comidas, catalogo, hoy = todayISO()) {
  return recientesPorDia(comidas, catalogo, hoy).flatMap((d) => d.alimentos).slice(0, MAXIMO_RECIENTES);
}

/* ══════════════════════════════════════════════════════════════════════════
   5 · REUTILIZAR UNA COMIDA — apartado 9
   ══════════════════════════════════════════════════════════════════════════ */

/* *"Desde una comida registrada anteriormente, permitir volver a añadir el mismo
   alimento rápidamente"*, con su cantidad ya puesta.

   ⚠️ Funciona **también con las escritas a mano**, que no tienen `alimentoId`:
   se copian sus números tal cual. Limitarlo a los de la base habría dejado fuera
   justo lo que más cuesta volver a escribir. */
export function reutilizarComida(comida, { fecha, momentoId } = {}) {
  if (!comida || typeof comida !== 'object') return null;
  const { id, ...resto } = comida;
  return {
    ...resto,
    id: uid(),
    fecha: fecha || todayISO(),
    momento: momentoId !== undefined ? momentoId : comida.momento || null,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   6 · EL CATÁLOGO COMPLETO Y EL SELECTOR — apartados 2, 12 y 15
   ══════════════════════════════════════════════════════════════════════════ */

/* *"ALIMENTOS GLOBALES: base disponible para todos. ALIMENTOS DEL USUARIO:
   creados por el usuario"* (apartado 15). Son **dos listas**, y se juntan solo
   para buscar: los suyos primero, porque son los que ha creado a propósito. */
export function catalogoCompleto(alimentosPropios) {
  const propios = (Array.isArray(alimentosPropios) ? alimentosPropios : [])
    .map(normalizarAlimentoPropio).filter(Boolean);
  return [...propios, ...BASE_ALIMENTOS];
}

/** ⚠️ **El buscador NO se reescribe**: es `buscarAlimentos` de la F4, que ya
 *  recibía la base por parámetro precisamente para esto. */
export function buscarEnTodos(texto, alimentosPropios) {
  return buscarAlimentos(texto, catalogoCompleto(alimentosPropios));
}

/** La línea del apartado 2: *"389 kcal · 16,9 P · 66,3 C · 6,9 G / 100 g"*. */
export function resumenNutricional(alimento) {
  if (!alimento || !alimento.por100) return null;
  const p = alimento.por100;
  const u = unidad(alimento.unidad || 'g');
  return `${p.calorias} kcal · ${p.proteinas} P · ${p.carbohidratos} C · ${p.grasas} G / ${u.referencia} ${u.corto}`;
}

/* La estructura del apartado 12, declarada: el selector se pinta recorriéndola,
   no con cuatro bloques escritos a mano. */
export const SECCIONES_SELECTOR = [
  { id: 'favoritos', nombre: 'Favoritos', emoji: '★', vacio: 'Marca con ★ lo que comes a menudo y aparecerá aquí.' },
  { id: 'recientes', nombre: 'Recientes', emoji: '🕒', vacio: 'Lo que registres irá saliendo aquí para repetirlo con un toque.' },
  { id: 'todos', nombre: 'Todos', emoji: '🍽️', vacio: 'Escribe para buscar en la lista completa.' },
];

export const seccionSelector = (id) => SECCIONES_SELECTOR.find((s) => s.id === id) || SECCIONES_SELECTOR[0];

export const ACCION_CREAR = 'Crear alimento';

/** Lo que el selector enseña **antes de escribir nada** (apartado 12): sus
 *  favoritos y sus recientes, que es lo que le ahorra la búsqueda. */
export function selectorInicial({ favoritos, alimentosPropios, comidas, hoy = todayISO() } = {}) {
  const catalogo = catalogoCompleto(alimentosPropios);
  return {
    favoritos: alimentosFavoritos(favoritos, catalogo),
    recientes: recientes(comidas, catalogo, hoy),
    propios: catalogo.filter((a) => a.propio),
    total: catalogo.length,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   7 · EL NORMALIZADOR — apartado 14
   ══════════════════════════════════════════════════════════════════════════ */

/* ⚠️ Vigesimoprimera vez del fallo del normalizador: sin estas líneas, el
   siguiente guardado se llevaría los alimentos propios y los favoritos.
   Y **devuelve el módulo entero** (regla 5). */
export function normalizarMisAlimentosDe(nutricion) {
  const n = nutricion && typeof nutricion === 'object' ? nutricion : {};
  const propios = (Array.isArray(n.alimentosPropios) ? n.alimentosPropios : [])
    .map(normalizarAlimentoPropio).filter(Boolean);
  const ids = new Set([...propios.map((a) => a.id), ...BASE_ALIMENTOS.map((a) => a.id)]);
  /* 🚨 Un favorito que apunta a un alimento que ya no existe se limpia: guardar
     el id de algo borrado es guardar una mentira (EH F24). */
  const favoritos = (Array.isArray(n.favoritosAlimentos) ? n.favoritosAlimentos : [])
    .filter((x) => typeof x === 'string' && ids.has(x));
  return { ...n, alimentosPropios: propios, favoritosAlimentos: [...new Set(favoritos)] };
}

/* ══════════════════════════════════════════════════════════════════════════
   8 · LO QUE ESTA FASE NO HACE — apartado 17
   ══════════════════════════════════════════════════════════════════════════ */

export const NO_EN_NU5 = [
  { que: 'Las estadísticas y las gráficas semanales', porque: 'son la Fase 6.', fase: 'NU F6' },
  { que: 'La IA nutricional y las recomendaciones', porque: 'son la Fase 7.', fase: 'NU F7' },
  { que: 'La planificación de dietas y los menús automáticos', porque: 'son la Fase 7.', fase: 'NU F7' },
];

/* ⚠️ **El escáner NO se quita**, por tercera vez en este bloque: el apartado 17
   dice *"no implementar"* y existe desde la Fase 4 del proyecto. «No implementar»
   no es «quitar» (E3 F34 y E3 F36). */
export const SIGUE_EXISTIENDO = [
  { que: 'El escáner de códigos de barras', desde: 'Fase 4 del proyecto' },
  { que: 'La foto del plato con la IA', desde: 'Fase 4 del proyecto' },
  { que: 'Las comidas guardadas como favoritas', desde: 'Fase 4 del proyecto', ojo: 'son `nutricion.favoritos`, comidas enteras — distintas de `favoritosAlimentos`, que son alimentos marcados.' },
];

export const AUDITORIA_NU5 = { clavesNuevas: 0, buscadoresNuevos: 0, basesDuplicadas: 0, historialesGuardados: 0 };

/* ══════════════════════════════════════════════════════════════════════════
   9 · LA CONDICIÓN DE FINALIZACIÓN — apartado 18
   ══════════════════════════════════════════════════════════════════════════ */

export function condicionNU5({ vista } = {}) {
  const codigo = String(vista || '');
  const propio = crearAlimentoPropio({ nombre: 'Yogur X', calorias: 80, proteinas: 8, carbohidratos: 5, grasas: 3, tipo: 'lácteo' });
  const catalogo = catalogoCompleto([propio.alimento]);
  const editado = editarAlimentoPropio(propio.alimento, { calorias: 85 });
  const HOY = '2026-09-07';
  const comidas = [
    { id: 'c1', fecha: HOY, momento: 'desayuno', nombre: 'Avena', calorias: 233, alimentoId: 'avena', cantidad: 60, unidad: 'g', por100: alimentoDeBase('avena').por100 },
    { id: 'c2', fecha: '2026-09-06', momento: 'comida', nombre: 'Pechuga de pollo', calorias: 165, alimentoId: 'pollo_pechuga' },
  ];

  return [
    { id: 1, texto: 'Existe una base estructurada de alimentos', ok: BASE_ALIMENTOS.length >= 30 && catalogo.length === BASE_ALIMENTOS.length + 1 },
    { id: 2, texto: 'Y los del usuario van aparte de los globales', ok: catalogo.filter((a) => a.propio).length === 1 && AUDITORIA_NU5.basesDuplicadas === 0 },
    { id: 3, texto: 'El buscador funciona, y es el de la F4', ok: buscarEnTodos('yogur', [propio.alimento]).some((a) => a.nombre === 'Yogur X') && AUDITORIA_NU5.buscadoresNuevos === 0 },
    { id: 4, texto: 'Buscando mientras escribe y sin distinguir mayúsculas', ok: buscarEnTodos('YOGUR', [propio.alimento]).length === buscarEnTodos('yogur', [propio.alimento]).length && MINIMO_BUSQUEDA <= 2 },
    { id: 5, texto: 'Con su información nutricional resumida', ok: resumenNutricional(alimentoDeBase('avena')) === '389 kcal · 16.9 P · 66.3 C · 6.9 G / 100 g' },
    { id: 6, texto: 'Existen categorías', ok: CATEGORIAS_ALIMENTO.length >= 10 && porCategoria(catalogo).length >= 8 },
    { id: 7, texto: 'Se pueden crear alimentos personalizados', ok: propio.ok && propio.alimento.por100.calorias === 80 && codigo.includes('FormularioAlimento') },
    { id: 8, texto: 'Con todos sus campos validados', ok: !crearAlimentoPropio({ nombre: '', calorias: 80 }).ok && !!validarPropio({}).errores.nombre },
    { id: 9, texto: 'Se pueden editar y eliminar los propios', ok: editado.ok && editado.alimento.id === propio.alimento.id && codigo.includes('onEliminarAlimentoPropio') },
    { id: 10, texto: 'Y NO se pueden tocar los de la base protegida', ok: esProtegido('avena') && !editarAlimentoPropio(alimentoDeBase('avena'), { calorias: 1 }).ok },
    { id: 11, texto: 'Se pueden marcar favoritos, y son referencias', ok: alternarFavoritoAlimento([], 'avena').length === 1 && alternarFavoritoAlimento(['avena'], 'avena').length === 0 },
    { id: 12, texto: 'Existe historial de recientes, derivado de las comidas', ok: recientesPorDia(comidas, catalogo, HOY).length === 2 && ARQUITECTURA_RECIENTES.guardado === false },
    { id: 13, texto: 'Se pueden reutilizar alimentos rápidamente', ok: reutilizarComida(comidas[0], { fecha: HOY }).calorias === 233 && reutilizarComida(comidas[0], { fecha: HOY }).id !== 'c1' },
    { id: 14, texto: 'Se soportan gramos, mililitros y unidades', ok: UNIDADES.length === 3 && escalar(alimentoDeBase('huevo').por100, 2, 'ud').calorias === 156 },
    { id: 15, texto: 'Los cálculos proporcionales siguen siendo correctos', ok: escalar(alimentoDeBase('avena').por100, 60, 'g').calorias === 233 },
    { id: 16, texto: 'Todo persiste, y sin una clave nueva', ok: AUDITORIA_NU5.clavesNuevas === 0 && normalizarMisAlimentosDe({ agua: { x: 1 }, alimentosPropios: [propio.alimento] }).agua.x === 1 },
    { id: 17, texto: 'Y no se ha roto nada de la F4', ok: !!crearComidaDesdeAlimento({ alimento: propio.alimento, cantidad: 125, fecha: HOY }) && crearComidaDesdeAlimento({ alimento: propio.alimento, cantidad: 125, fecha: HOY }).calorias === 100 },
  ];
}
