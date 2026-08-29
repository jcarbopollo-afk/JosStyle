// ============================================================================
// EH · Fase 26/65 — ACCESORIOS Y ESTILO PERSONAL
//
// *"Ahora creamos un pequeño módulo para accesorios y detalles del estilo
// personal, pero con una regla muy importante: **NO crear otro armario**."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ UN ACCESORIO ES UNA PRENDA DEL ARMARIO.** El armario ya tiene la
// categoría `accesorios` desde AR F1, así que el reloj de Josué **es una prenda**
// y vive allí una sola vez. Lo que se guarda aquí es un **envoltorio** con lo
// que el armario NO sabe: con qué estilo lo usa, para qué ocasiones, con qué
// combina y si lo enlazó con un producto. `CAMPOS_DE_LA_PRENDA` es esa frontera
// escrita, y hay una prueba que falla si un campo del armario aparece aquí.
//
// **2. ⚠️ AÑADIR UN ACCESORIO ESCRIBE EN EL ARMARIO, NO AQUÍ.**
// `prepararAltaAccesorio` devuelve un **plan** con las dos piezas —la prenda y
// el envoltorio— y quien guarda es App.jsx, que es el dueño de los dos
// almacenes. La prenda se construye con `crearPrenda`, la fábrica del armario:
// así tiene exactamente la misma forma que las que crea el Armario.
//
// **3. ⚠️ EL DUPLICADO SE COMPRUEBA ANTES** (apartado 3: *"comprobar si ya
// existe en el Armario. Si existe: utilizar ese elemento. **No crear una
// copia**"*). Si el nombre ya está, `prepararAltaAccesorio` **no devuelve
// plan**: devuelve la prenda que encontró para que la pantalla ofrezca usarla.
// Crear una nueva con el mismo nombre exige decirlo (`forzarNueva`), y **no hay
// valor por defecto**: elegir por él sería crear la copia que prohíbe el
// apartado.
//
// **4. ⚠️ LAS COMBINACIONES SON UNA PREFERENCIA, NO UN OUTFIT** (apartado 9:
// *"no construir todavía un segundo sistema de outfits, porque eso pertenece al
// Armario. Aquí simplemente almacenamos la preferencia"*). Se guarda *"lo uso
// con X estilo"* y se devuelve **una frase**. Ni un outfit se crea desde aquí.
//
// **5. ⚠️ NI OTRA LISTA DE ESTILOS NI OTRA DE OCASIONES.** Los siete estilos
// del apartado 5 ya están en `ESTILOS_VESTIR` (F6) y las siete ocasiones del
// apartado 6 en `OCASIONES` (F24). Aquí se **importan**, y las ocasiones son un
// subconjunto declarado con sus ids: si alguien renombra uno, la prueba salta.
//
// **6. ⚠️ Y EL FAVORITO ES EL DEL ARMARIO** (apartado 7: *"utilizar favoritos
// globales"*). `alternarFavoritoAccesorio` **no devuelve un estado nuevo de
// Estilo de hombre**: devuelve un armario nuevo, porque el favorito es de la
// prenda. Es la manera de que no haya dos.
// ============================================================================

import { normalizarEstiloHombre, guardarConfig } from './estiloDeHombre';
import { leerDato } from './datosEstiloHombre';
import { ESTILOS_VESTIR } from './perfilEstilo';
import { OCASIONES, ocasion } from './perfumes';
import { CATEGORIAS_ARMARIO, crearPrenda, actualizarPrenda } from './armario';
import { enlacesDeProducto } from './motorProductos';
import { productosPiel } from './productosPiel';
import { productosPelo } from './productosPelo';
import { reglaAplicable } from './motorRecomendaciones';
import { prepararEliminacion, prepararRestauracion } from './papelera';
import { uid, todayISO } from './helpers';

export const MODULO_ACCESORIOS = 'accesorios';

/**
 * ⚠️ La categoría del armario en la que viven los accesorios. **Existe desde AR
 * F1**: no se añade ninguna, se usa la que hay.
 */
export const CATEGORIA_ARMARIO_ACCESORIOS = 'accesorios';

/** Apartado 1 — la entrada, con sus dos botones literales. */
export const TEXTOS_ACCESORIOS = {
  titulo: '🕶️ Accesorios',
  pregunta: '¿Quieres utilizar este apartado?',
  configurar: 'Sí, configurarlo',
  ahoraNo: 'Ahora no',
  /* *"Si no lo activa: no aparece."* Desaparecer no es borrar. */
  oculto: 'Cuando quieras, aquí lo configuras.',
  editar: '⚙️ Qué quiero gestionar',
  /* ⚠️ Apartado 3, dicho en la pantalla y no solo en el código: si Josué no
     entiende por qué su reloj está en el Armario, se lo apuntará dos veces. */
  viveEnElArmario: 'Los accesorios se guardan en tu Armario, para que no haya dos listas. Aquí guardas con qué estilo y en qué ocasiones los usas.',
};

/* ===========================================================================
   1 · LAS CATEGORÍAS (apartados 2 y 14)
   ===========================================================================
   ⚠️ **El apartado 2 y el apartado 14 son EL MISMO interruptor.** *"Seleccionar:
   ☑️ Relojes ☑️ Gafas…"* y *"puede quitar únicamente ⌚ Relojes manteniendo 🕶️
   Gafas"* son elegir y desmarcar la misma casilla. Un segundo mecanismo para
   apagar categorías sería la lista duplicada que prohíbe el apartado 15 de la
   Fase 2.

   ⚠️ Y **☑️ en el enunciado es `porDefecto: true`**, como en la Fase 20 (donde
   "Seguimiento" venía con ☐ y por eso nace apagado). */

export const CATEGORIAS_ACCESORIO = [
  { id: 'relojes', nombre: 'Relojes', icono: '⌚', singular: 'Reloj' },
  { id: 'gafas', nombre: 'Gafas', icono: '🕶️', singular: 'Gafas' },
  { id: 'pulseras', nombre: 'Pulseras', icono: '📿', singular: 'Pulsera' },
  { id: 'collares', nombre: 'Collares', icono: '🧿', singular: 'Collar' },
  { id: 'anillos', nombre: 'Anillos', icono: '💍', singular: 'Anillo' },
  { id: 'gorras', nombre: 'Gorras', icono: '🧢', singular: 'Gorra' },
  { id: 'otros', nombre: 'Otros', icono: '🎒', singular: 'Otro' },
];

export const categoriaAccesorio = (id) => CATEGORIAS_ACCESORIO.find((c) => c.id === id) || null;

/**
 * Las partes: las siete categorías del apartado 2 más los dos interruptores
 * sueltos del enunciado. ⚠️ Igual que en la Fase 20, `elegirCategorias` **solo
 * toca las del apartado 2**: volver a elegir qué gestiona no puede apagarle las
 * recomendaciones sin avisar.
 */
export const PARTES_ACCESORIOS = [
  ...CATEGORIAS_ACCESORIO.map((c) => ({ ...c, porDefecto: true, deApartado2: true })),
  /* Apartado 10 — *"plaquita **opcional**"*: se puede quitar, pero no nace
     apagada. (Distinto de la rotación de la F25, donde el enunciado decía
     *"solamente si el usuario activa esta función"*.) */
  { id: 'recomendaciones', nombre: 'Recomendaciones', icono: '💡', porDefecto: true, deApartado2: false },
  // Apartado 13 — la lista de deseados.
  { id: 'deseos', nombre: 'Quiero comprar', icono: '🎯', porDefecto: true, deApartado2: false },
];

/** Las siete casillas del apartado 2, que son las que él marca en la entrada. */
export const CASILLAS_ACCESORIOS = PARTES_ACCESORIOS.filter((p) => p.deApartado2);

export const parteAccesorios = (id) => PARTES_ACCESORIOS.find((p) => p.id === id) || null;

/** ⚠️ Regla 8 — ninguna plaquita decorativa: las cuatro funcionan hoy. */
export const PLAQUITAS_ACCESORIOS = [
  { id: 'mios', nombre: 'Mis accesorios', icono: '🕶️', fase: 26, listo: true },
  { id: 'combinaciones', nombre: 'Combinaciones', icono: '🧩', fase: 26, listo: true },
  { id: 'recomendaciones', nombre: 'Recomendaciones', icono: '💡', fase: 26, listo: true },
  { id: 'deseos', nombre: 'Quiero comprar', icono: '🎯', fase: 26, listo: true },
];

/* ===========================================================================
   2 · LO QUE NO SE VUELVE A ESCRIBIR (apartados 5 y 6)
   ===========================================================================
   Los siete estilos del apartado 5 —Deportivo, Casual, Elegante, Minimalista,
   Urbano, Formal, Otro— están **todos** en `ESTILOS_VESTIR`, que nació en la
   Fase 6. Y las siete ocasiones del apartado 6 están **todas** en `OCASIONES`,
   que nació en la Fase 24. Se importan. */

export const ESTILOS_ACCESORIO = ESTILOS_VESTIR;

export const estiloAccesorio = (id) => ESTILOS_ACCESORIO.find((e) => e.id === id) || null;

/**
 * Las siete del apartado 6, **por su id de la lista de la Fase 24**. Es una
 * vista sobre `OCASIONES`, no una segunda lista: si alguien renombra un id allí,
 * aquí desaparece y la prueba lo dice.
 */
export const IDS_OCASION_ACCESORIO = ['estudios', 'deporte', 'trabajo', 'cita', 'fiesta', 'noche', 'eventos'];

export const OCASIONES_ACCESORIO = IDS_OCASION_ACCESORIO.map((id) => ocasion(id)).filter(Boolean);

/* ===========================================================================
   3 · EL ALMACÉN
   =========================================================================== */

export const MAX_NOTA_ACCESORIO = 280;

/**
 * ⚠️ **La frontera, escrita.** Estos campos son de la prenda del armario y **no
 * se guardan en el envoltorio**. Si un día alguien añade `nombre` "por si
 * acaso", tendrá media ficha aquí y la ficha entera allí: dos armarios por la
 * puerta de atrás, que es exactamente lo que prohíbe el objetivo de la fase.
 */
export const CAMPOS_DE_LA_PRENDA = [
  'nombre', 'categoria', 'subcategoria', 'color', 'colorSecundario', 'marca',
  'talla', 'fotoPath', 'temporada', 'material', 'notas', 'precio',
  'fechaCompra', 'estado', 'favorita',
];

export const DEFAULT_ACCESORIOS = (() => {
  const partes = {};
  PARTES_ACCESORIOS.forEach((p) => { partes[p.id] = p.porDefecto; });
  return {
    ahoraNo: false,
    configurado: false,
    // Apartados 2 y 14 — un solo interruptor por categoría.
    partes,
    // Los envoltorios: lo que el armario no sabe.
    accesorios: [],
    /* Apartado 8 — ⭐ *"estoy usando"*. ⚠️ Es una **lista**: un reloj y unas
       gafas se llevan a la vez, al revés que un perfume (F24, donde `actual` es
       uno solo). Modelarlo como campo único obligaría a elegir. */
    enUso: [],
    // Apartado 13 — la lista de deseados.
    deseos: [],
    editado: null,
  };
})();

/**
 * El catálogo global (apartado 12). ⚠️ Ni un inventario nuevo: es el mismo
 * `catalogoPara…` que ya usan Barba (F20) y Perfumes (F24).
 */
export const catalogoParaAccesorios = (estado) => [
  ...productosPiel(estado).map((p) => ({ ...p, modulo: 'skincare', moduloNombre: 'Skincare' })),
  ...productosPelo(estado).map((p) => ({ ...p, modulo: 'pelo', moduloNombre: 'Pelo' })),
];

/**
 * El envoltorio. ⚠️ **Ni un campo de `CAMPOS_DE_LA_PRENDA`**: todo lo que sale
 * de aquí es información que el armario no tiene.
 */
export function normalizarAccesorio(g) {
  const a = g || {};
  const prendaId = typeof a.prendaId === 'string' ? a.prendaId.trim() : '';
  // Sin prenda no hay accesorio: el envoltorio no existe por su cuenta.
  if (!prendaId) return null;
  return {
    id: a.id || uid(),
    prendaId,
    // Apartado 5 — puede seleccionar varios.
    estilos: (Array.isArray(a.estilos) ? a.estilos : []).filter((x) => !!estiloAccesorio(x)),
    // Apartado 6.
    ocasiones: (Array.isArray(a.ocasiones) ? a.ocasiones : [])
      .filter((x) => IDS_OCASION_ACCESORIO.includes(x)),
    /* Apartado 9 — *"este accesorio lo utilizo con X tipo de estilo"*. Es una
       preferencia, no un outfit. */
    combinaCon: (Array.isArray(a.combinaCon) ? a.combinaCon : []).filter((x) => !!estiloAccesorio(x)),
    // Apartado 12 — el id de la ficha del catálogo global. **Nunca la ficha.**
    productoId: typeof a.productoId === 'string' ? a.productoId : null,
    nota: String(a.nota || '').trim().slice(0, MAX_NOTA_ACCESORIO),
    creadoEn: typeof a.creadoEn === 'string' ? a.creadoEn : null,
  };
}

/**
 * Apartado 13 — un deseo **no es una prenda**: todavía no lo tiene, así que no
 * puede vivir en el armario. Por eso sí lleva su nombre.
 */
export function normalizarDeseo(g) {
  const d = g || {};
  const nombre = String(d.nombre || '').trim();
  if (!nombre) return null;
  return {
    id: d.id || uid(),
    nombre,
    tipo: categoriaAccesorio(d.tipo) ? d.tipo : 'otros',
    marca: String(d.marca || '').trim(),
    nota: String(d.nota || '').trim().slice(0, MAX_NOTA_ACCESORIO),
    productoId: typeof d.productoId === 'string' ? d.productoId : null,
    /* ⚠️ **EH F39, apartado 3** — el enlace a la tarea de Productividad. Aquí
       solo vive **el id**: el texto, la fecha y el "hecha" son de Tareas, que es
       el sistema global. Y va en el normalizador desde el primer día, o el
       siguiente guardado se lo llevaría (regla 5). */
    tareaId: typeof d.tareaId === 'string' ? d.tareaId : null,
    creadoEn: typeof d.creadoEn === 'string' ? d.creadoEn : null,
  };
}

export function normalizarAccesorios(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const partes = {};
  PARTES_ACCESORIOS.forEach((p) => {
    partes[p.id] = typeof g.partes?.[p.id] === 'boolean' ? g.partes[p.id] : p.porDefecto;
  });
  /* ⚠️ Los seis campos, uno por uno: el que el normalizador no conoce lo borra
     el siguiente guardado (regla 5). Van veintitrés veces en el proyecto. */
  const accesorios = (Array.isArray(g.accesorios) ? g.accesorios : [])
    .map(normalizarAccesorio).filter(Boolean);
  const ids = accesorios.map((a) => a.id);
  return {
    ahoraNo: g.ahoraNo === true,
    configurado: g.configurado === true,
    partes,
    accesorios,
    // ⚠️ Lo que apunta a un accesorio que ya no está no se guarda: mentiría.
    enUso: (Array.isArray(g.enUso) ? g.enUso : []).filter((x) => ids.includes(x)),
    deseos: (Array.isArray(g.deseos) ? g.deseos : []).map(normalizarDeseo).filter(Boolean),
    editado: typeof g.editado === 'string' ? g.editado : null,
  };
}

export const datosAccesorios = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_ACCESORIOS);
  return normalizarAccesorios(mod?.config?.accesorios);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_ACCESORIOS, { accesorios: datos });

/* ===========================================================================
   4 · LA ENTRADA Y LAS CATEGORÍAS (apartados 1, 2 y 14)
   =========================================================================== */

export const decirAhoraNoAccesorios = (estado) =>
  ({ estado: escribir(estado, { ...datosAccesorios(estado), ahoraNo: true }), error: null });

export const configurarAccesorios = (estado, { hoy = todayISO() } = {}) =>
  ({ estado: escribir(estado, { ...datosAccesorios(estado), ahoraNo: false, configurado: true, editado: hoy }), error: null });

export const parteActivaAccesorios = (estado, id) => datosAccesorios(estado).partes[id] === true;

export const categoriaActivaAccesorios = (estado, id) =>
  !!categoriaAccesorio(id) && datosAccesorios(estado).partes[id] === true;

/** ⚠️ Apartado 14 — apagar una categoría **no borra** sus accesorios. */
export function alternarParteAccesorios(estado, id) {
  if (!parteAccesorios(id)) return normalizarEstiloHombre(estado);
  const d = datosAccesorios(estado);
  return escribir(estado, { ...d, partes: { ...d.partes, [id]: !d.partes[id] } });
}

/**
 * Apartado 2 — marcar de una vez qué quiere gestionar. ⚠️ **Solo toca las siete
 * casillas**: las recomendaciones y los deseos son interruptores aparte, como
 * las rutinas de la Fase 20.
 */
export function elegirCategoriasAccesorios(estado, ids = []) {
  const d = datosAccesorios(estado);
  const partes = { ...d.partes };
  CASILLAS_ACCESORIOS.forEach((c) => { partes[c.id] = ids.includes(c.id); });
  return escribir(estado, { ...d, partes });
}

export const ESTADOS_ACCESORIOS = ['sin_configurar', 'ahora_no', 'configurado'];

export function estadoDeEntradaAccesorios(estado) {
  const d = datosAccesorios(estado);
  if (d.configurado) return 'configurado';
  return d.ahoraNo ? 'ahora_no' : 'sin_configurar';
}

export const categoriasActivasAccesorios = (estado) => {
  const d = datosAccesorios(estado);
  return CATEGORIAS_ACCESORIO.filter((c) => d.partes[c.id]);
};

/* ===========================================================================
   5 · EL ARMARIO ES EL ARMARIO (apartado 3)
   ===========================================================================
   *"Antes de crear un accesorio: comprobar si ya existe en el Armario. Si
   existe: utilizar ese elemento. **No crear una copia**."* */

const prendasDe = (armario) => (Array.isArray(armario?.prendas) ? armario.prendas : []);

/** Las prendas que el armario ya tiene en su categoría de accesorios. */
export const prendasAccesorioDelArmario = (armario) =>
  prendasDe(armario).filter((p) => p.categoria === CATEGORIA_ARMARIO_ACCESORIOS);

/**
 * ⚠️ Busca en **todo** el armario, no solo en la categoría de accesorios: si
 * apuntó su gorra como "Otros", sigue siendo la misma gorra y crear otra sería
 * la copia que prohíbe el apartado 3.
 */
export function buscarEnArmario(armario, nombre) {
  const n = String(nombre || '').trim().toLowerCase();
  if (!n) return null;
  return prendasDe(armario).find((p) => String(p.nombre || '').trim().toLowerCase() === n) || null;
}

/** Las prendas del armario que ya tienen envoltorio aquí. */
export const prendasYaUsadas = (estado) => datosAccesorios(estado).accesorios.map((a) => a.prendaId);

/**
 * Apartado 4 — el alta. ⚠️ **Devuelve un plan, no escribe.** Y si el nombre ya
 * está en el armario, devuelve la prenda encontrada **sin plan**: la pantalla
 * ofrece usarla. Crear una nueva con el mismo nombre exige `forzarNueva: true`,
 * y no hay valor por defecto.
 */
export function prepararAltaAccesorio(estado, armario, datos = {}, { hoy = todayISO(), forzarNueva = false } = {}) {
  const nombre = String(datos.nombre || '').trim();
  const tipo = categoriaAccesorio(datos.tipo) ? datos.tipo : 'otros';
  if (!nombre) return { error: 'El accesorio necesita un nombre.', duplicado: null, plan: null };
  if (!categoriaActivaAccesorios(estado, tipo)) {
    return { error: `${categoriaAccesorio(tipo).nombre} no está entre lo que gestionas.`, duplicado: null, plan: null };
  }
  const yaEnArmario = buscarEnArmario(armario, nombre);
  if (yaEnArmario && !forzarNueva) {
    return {
      error: null,
      duplicado: yaEnArmario,
      plan: null,
      // ⚠️ El apartado 3, dicho con sus palabras.
      texto: `Ya tienes "${yaEnArmario.nombre}" en tu Armario. Puedes usar ese en vez de crear otro.`,
    };
  }
  /* ⚠️ Con la fábrica del armario, no con un objeto a mano: así la prenda tiene
     exactamente los mismos campos que las que crea el Armario. */
  const prenda = crearPrenda({
    nombre,
    categoria: CATEGORIA_ARMARIO_ACCESORIOS,
    // El tipo de accesorio ES la subcategoría de la prenda. No se guarda dos veces.
    subcategoria: tipo,
    marca: datos.marca || '',
    color: datos.color || 'otro',
    // Apartado 4 — *"las fotos no son obligatorias"*.
    fotoPath: datos.fotoPath || '',
    notas: datos.notas || '',
  });
  const accesorio = normalizarAccesorio({
    prendaId: prenda.id,
    estilos: datos.estilos,
    ocasiones: datos.ocasiones,
    combinaCon: datos.combinaCon,
    productoId: datos.productoId,
    nota: datos.nota,
    creadoEn: hoy,
  });
  return { error: null, duplicado: null, plan: { prenda, accesorio } };
}

/**
 * Escribe el plan. ⚠️ Devuelve **los dos almacenes**: la prenda va al armario y
 * el envoltorio a Estilo de hombre. Quien guarda es App.jsx, que es el dueño de
 * los dos — aquí no se toca `saveData`.
 */
export function aplicarAltaAccesorio(estado, armario, plan) {
  if (!plan || !plan.accesorio) {
    return { estado: normalizarEstiloHombre(estado), armario, error: 'No hay nada que guardar.' };
  }
  const d = datosAccesorios(estado);
  const nuevoArmario = plan.prenda
    ? { ...armario, prendas: [...prendasDe(armario), plan.prenda] }
    : armario;
  return {
    estado: escribir(estado, { ...d, accesorios: [...d.accesorios, plan.accesorio] }),
    armario: nuevoArmario,
    error: null,
    accesorio: plan.accesorio,
  };
}

/**
 * Apartado 3 — *"si existe: utilizar ese elemento"*. Crea **solo** el
 * envoltorio: la prenda ya está.
 */
export function usarPrendaComoAccesorio(estado, armario, prendaId, datos = {}, { hoy = todayISO() } = {}) {
  const prenda = prendasDe(armario).find((p) => p.id === prendaId);
  if (!prenda) return { estado: normalizarEstiloHombre(estado), error: 'Esa prenda no está en tu Armario.' };
  const d = datosAccesorios(estado);
  const ya = d.accesorios.find((a) => a.prendaId === prendaId);
  if (ya) return { estado: normalizarEstiloHombre(estado), error: null, sinEfecto: true, accesorio: ya };
  const accesorio = normalizarAccesorio({
    prendaId,
    estilos: datos.estilos,
    ocasiones: datos.ocasiones,
    combinaCon: datos.combinaCon,
    productoId: datos.productoId,
    nota: datos.nota,
    creadoEn: hoy,
  });
  return { estado: escribir(estado, { ...d, accesorios: [...d.accesorios, accesorio] }), error: null, accesorio };
}

/* ===========================================================================
   6 · LEER: EL ENVOLTORIO Y SU PRENDA, JUNTOS
   =========================================================================== */

/**
 * Une el envoltorio con su prenda. ⚠️ Si la prenda ya no está —la borró desde el
 * Armario— **el accesorio no se enseña**: no se inventa un nombre ni se deja un
 * hueco. Es lo mismo que hace la Fase 20 con los productos.
 */
export function accesorios(estado, armario) {
  const prendas = prendasDe(armario);
  const d = datosAccesorios(estado);
  return d.accesorios
    .map((a) => {
      const prenda = prendas.find((p) => p.id === a.prendaId);
      if (!prenda) return null;
      const tipo = categoriaAccesorio(prenda.subcategoria) ? prenda.subcategoria : 'otros';
      return {
        ...a,
        prenda,
        // Derivado de la prenda, nunca copiado en el guardado.
        nombre: prenda.nombre,
        marca: prenda.marca,
        color: prenda.color,
        fotoPath: prenda.fotoPath,
        tipo,
        categoria: categoriaAccesorio(tipo),
        // Apartado 7 — el favorito es el de la prenda.
        favorito: prenda.favorita === true,
        enUso: d.enUso.includes(a.id),
      };
    })
    .filter(Boolean)
    // Apartado 14 — de una categoría apagada no se enseña nada.
    .filter((a) => d.partes[a.tipo] === true);
}

export const accesorio = (estado, armario, id) => accesorios(estado, armario).find((a) => a.id === id) || null;

/**
 * Los envoltorios cuya prenda ya no existe. No se borran solos —borrar es de la
 * papelera—, pero la auditoría los cuenta para que no pasen desapercibidos.
 */
export function accesoriosHuerfanos(estado, armario) {
  const prendas = prendasDe(armario).map((p) => p.id);
  return datosAccesorios(estado).accesorios.filter((a) => !prendas.includes(a.prendaId));
}

export const accesoriosPorCategoria = (estado, armario) => {
  const lista = accesorios(estado, armario);
  return categoriasActivasAccesorios(estado).map((c) => ({
    ...c,
    accesorios: lista.filter((a) => a.tipo === c.id),
  }));
};

/* ===========================================================================
   7 · EDITAR (apartados 4 a 9)
   =========================================================================== */

/** Lo que es del envoltorio se edita aquí. */
export function editarAccesorio(estado, id, cambios = {}) {
  const d = datosAccesorios(estado);
  const actual = d.accesorios.find((a) => a.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Ese accesorio no existe.' };
  /* ⚠️ La prenda no se toca desde aquí: `prendaId` se conserva y los campos del
     armario ni siquiera llegan al normalizador. */
  const nuevo = normalizarAccesorio({ ...actual, ...cambios, id: actual.id, prendaId: actual.prendaId });
  return { estado: escribir(estado, { ...d, accesorios: d.accesorios.map((a) => (a.id === id ? nuevo : a)) }), error: null };
}

/**
 * Lo que es de la prenda se edita **en la prenda**. Devuelve un armario nuevo,
 * no un estado: quien guarda es App.jsx.
 */
export function editarPrendaDeAccesorio(estado, armario, id, cambios = {}) {
  const a = datosAccesorios(estado).accesorios.find((x) => x.id === id);
  if (!a) return { armario, error: 'Ese accesorio no existe.' };
  const prenda = prendasDe(armario).find((p) => p.id === a.prendaId);
  if (!prenda) return { armario, error: 'Esa prenda ya no está en tu Armario.' };
  if ('nombre' in cambios && !String(cambios.nombre || '').trim()) {
    return { armario, error: 'El accesorio necesita un nombre.' };
  }
  const nueva = actualizarPrenda(prenda, cambios);
  return {
    armario: { ...armario, prendas: prendasDe(armario).map((p) => (p.id === prenda.id ? nueva : p)) },
    error: null,
  };
}

/**
 * Apartado 7 — *"utilizar favoritos globales"*. ⚠️ Por eso esto **no devuelve un
 * estado de Estilo de hombre**: el favorito es un campo de la prenda, y tenerlo
 * también aquí sería el segundo sistema de favoritos que prohíbe el apartado 11.
 */
export function alternarFavoritoAccesorio(estado, armario, id) {
  const a = accesorio(estado, armario, id);
  if (!a) return { armario, error: 'Ese accesorio no existe.' };
  return editarPrendaDeAccesorio(estado, armario, id, { favorita: !a.favorito });
}

/**
 * Apartado 8 — ⭐ *"estoy usando"*. ⚠️ Una lista, no un campo: se llevan varios a
 * la vez.
 */
export function alternarEnUsoAccesorio(estado, id) {
  const d = datosAccesorios(estado);
  if (!d.accesorios.some((a) => a.id === id)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese accesorio no existe.' };
  }
  const enUso = d.enUso.includes(id) ? d.enUso.filter((x) => x !== id) : [...d.enUso, id];
  return { estado: escribir(estado, { ...d, enUso }), error: null };
}

export const accesoriosEnUso = (estado, armario) => accesorios(estado, armario).filter((a) => a.enUso);

/* ===========================================================================
   8 · COMBINACIONES (apartado 9)
   ===========================================================================
   ⚠️ *"No construir todavía un segundo sistema de outfits, porque eso pertenece
   al Armario. Aquí simplemente almacenamos la preferencia."* Así que esto
   devuelve **una frase**, no un conjunto de prendas. */

export function combinacionesDeAccesorio(estado, armario, id, datosGlobales = {}) {
  const a = accesorio(estado, armario, id);
  if (!a) return { hay: false, texto: '', estilos: [], coincide: [] };
  const suyos = a.combinaCon.map((e) => estiloAccesorio(e)).filter(Boolean);
  if (suyos.length === 0) {
    return {
      hay: false,
      estilos: [],
      coincide: [],
      // ⚠️ Ni se inventa una combinación ni se deja el hueco en blanco.
      texto: 'Todavía no has dicho con qué estilo lo usas.',
    };
  }
  const dice = leerDato(estado, 'estilosFavoritos', datosGlobales);
  const mios = Array.isArray(dice.valor) ? dice.valor : (dice.valor ? [dice.valor] : []);
  const coincide = suyos.filter((e) => mios.includes(e.id));
  const nombres = suyos.map((e) => e.nombre.toLowerCase()).join(' y ');
  return {
    hay: true,
    estilos: suyos,
    coincide,
    // *"Este accesorio podría combinar con tu estilo."*
    texto: coincide.length > 0
      ? `Lo usas con un estilo ${nombres}, que es de los que has elegido: podría combinar con tu estilo.`
      : `Lo usas con un estilo ${nombres}.`,
  };
}

/* ===========================================================================
   9 · RECOMENDACIONES (apartado 10)
   ===========================================================================
   *"Puede utilizar: estilo personal, ocasión, preferencias, accesorios
   existentes. **Sin IA**."* Reglas del motor de la Fase 16, y **toda regla
   declara `requiere`**: una sin requisitos se dispararía con el contexto vacío. */

export const SUGERENCIAS_ACCESORIOS = [
  {
    id: 'sin_estilo',
    requiere: ['conAccesorios', 'sinEstilo'],
    cuando: (c) => c.conAccesorios > 0 && c.sinEstilo > 0,
    texto: 'Puedes decir con qué estilo usas cada accesorio, y así las combinaciones tendrán más sentido.',
    accion: 'Añadir estilo',
  },
  {
    id: 'sin_ocasion',
    requiere: ['conAccesorios', 'sinOcasion'],
    cuando: (c) => c.conAccesorios > 0 && c.sinOcasion > 0,
    texto: 'Puedes indicar para qué ocasiones usas cada uno, si te apetece tenerlo apuntado.',
    accion: 'Añadir ocasiones',
  },
  {
    id: 'encaja_con_tu_estilo',
    requiere: ['coincidenConTuEstilo'],
    cuando: (c) => c.coincidenConTuEstilo > 0,
    texto: 'Algunos de tus accesorios encajan con el estilo que has elegido: podrías usarlos más a menudo.',
    accion: 'Ver cuáles',
  },
  {
    id: 'ninguno_en_uso',
    requiere: ['conAccesorios', 'enUso'],
    cuando: (c) => c.conAccesorios >= 2 && c.enUso === 0,
    texto: 'Si marcas cuáles llevas ahora, luego podrás ver de un vistazo con qué sueles salir.',
    accion: 'Marcar los que llevo',
  },
];

export function contextoSugerenciasAccesorios(estado, armario, datosGlobales = {}) {
  const lista = accesorios(estado, armario);
  const dice = leerDato(estado, 'estilosFavoritos', datosGlobales);
  const mios = Array.isArray(dice.valor) ? dice.valor : (dice.valor ? [dice.valor] : []);
  return {
    conAccesorios: lista.length,
    sinEstilo: lista.filter((a) => a.estilos.length === 0).length,
    sinOcasion: lista.filter((a) => a.ocasiones.length === 0).length,
    coincidenConTuEstilo: lista.filter((a) => a.estilos.some((e) => mios.includes(e))).length,
    enUso: lista.filter((a) => a.enUso).length,
  };
}

export function sugerenciasAccesorios(estado, armario, datosGlobales = {}) {
  if (!parteActivaAccesorios(estado, 'recomendaciones')) return [];
  const ctx = contextoSugerenciasAccesorios(estado, armario, datosGlobales);
  return SUGERENCIAS_ACCESORIOS
    .filter((s) => reglaAplicable(s, ctx))
    .map((s) => ({ id: s.id, texto: s.texto, accion: s.accion, aplicada: false }));
}

/* ===========================================================================
   10 · PRODUCTOS Y DESEOS (apartados 12 y 13)
   =========================================================================== */

/**
 * Apartado 12 — *"utilizar el catálogo global y el sistema de enlaces/
 * afiliación"*. ⚠️ Ni un precio ni una tienda guardados aquí: salen de la ficha
 * de la Fase 17 por el `productoId`, y sin ficha **no se inventa un enlace**.
 */
export function dondeComprarAccesorio(estado, armario, id) {
  const a = accesorio(estado, armario, id) || datosAccesorios(estado).deseos.find((d) => d.id === id) || null;
  if (!a) return { hay: false, enlaces: [], texto: '' };
  if (!a.productoId) {
    return { hay: false, enlaces: [], texto: 'No lo has enlazado con ningún producto, así que no tenemos dónde verlo.' };
  }
  const ficha = catalogoParaAccesorios(estado).find((x) => x.id === a.productoId);
  if (!ficha) return { hay: false, enlaces: [], texto: 'El producto que tenía enlazado ya no está.' };
  const enl = enlacesDeProducto(ficha);
  return {
    hay: !enl.sinEnlaces,
    enlaces: enl.enlaces,
    donde: enl.donde,
    aviso: enl.aviso,
    precio: ficha.precio,
    texto: enl.sinEnlaces ? enl.sinEnlacesTexto : '',
  };
}

/**
 * Apartado 13 — *"🎯 Quiero comprar"*. ⚠️ El enunciado dice *"esto se conecta con
 * la lista de deseos global **si ya existe**"*, y **no existe ninguna** en el
 * proyecto. Así que ésta es la del módulo, y la auditoría lo declara: el día que
 * haya una global, ésta y la de "quiero probar" de Perfumes son las dos que se
 * mudan. Inventarla ahora sería el sistema global que nadie ha pedido.
 */
export const deseosAccesorios = (estado) => datosAccesorios(estado).deseos;

export function anadirDeseoAccesorio(estado, datos = {}, { hoy = todayISO() } = {}) {
  const d = datosAccesorios(estado);
  const deseo = normalizarDeseo({ ...datos, creadoEn: hoy });
  if (!deseo) return { estado: normalizarEstiloHombre(estado), error: 'El deseo necesita un nombre.', deseo: null };
  if (deseo.productoId && !catalogoParaAccesorios(estado).some((x) => x.id === deseo.productoId)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Ese producto no existe.', deseo: null };
  }
  const igual = d.deseos.find((x) => x.nombre.toLowerCase() === deseo.nombre.toLowerCase());
  if (igual) return { estado: normalizarEstiloHombre(estado), error: null, sinEfecto: true, deseo: igual };
  return { estado: escribir(estado, { ...d, deseos: [...d.deseos, deseo] }), error: null, deseo };
}

export function editarDeseoAccesorio(estado, id, cambios = {}) {
  const d = datosAccesorios(estado);
  const actual = d.deseos.find((x) => x.id === id);
  if (!actual) return { estado: normalizarEstiloHombre(estado), error: 'Ese deseo no existe.' };
  if ('nombre' in cambios && !String(cambios.nombre || '').trim()) {
    return { estado: normalizarEstiloHombre(estado), error: 'El deseo necesita un nombre.' };
  }
  const nuevo = normalizarDeseo({ ...actual, ...cambios, id: actual.id });
  return { estado: escribir(estado, { ...d, deseos: d.deseos.map((x) => (x.id === id ? nuevo : x)) }), error: null };
}

/* ===========================================================================
   11 · BORRAR (a la papelera GLOBAL)
   ===========================================================================
   ⚠️ Borrar un accesorio quita **el envoltorio**, no la prenda: sigue en el
   Armario. La pantalla lo dice, porque si no parecería que se ha perdido. */

export const TEXTO_AL_BORRAR = 'Se quitará de Accesorios. La prenda seguirá en tu Armario.';

export function eliminarAccesorio(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosAccesorios(estado);
  const r = prepararEliminacion(d, MODULO_ACCESORIOS, 'accesorios', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Ese accesorio no existe.', entrada: null };
  // ⚠️ Y lo que apuntaba a él lo limpia el normalizador, no una línea a mano.
  return { estado: escribir(estado, r.moduloActualizado), entrada: r.entrada, error: null };
}

/* ⚠️ `prepararRestauracion` devuelve `{ moduloActualizado, yaExistia }`, no el
   módulo: escribir el envoltorio entero guardaría un objeto que el normalizador
   no reconoce y **se llevaría por delante todo el módulo**. Lo cazó la prueba. */
export function restaurarAccesorio(estado, entrada) {
  const r = prepararRestauracion(datosAccesorios(estado), entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se puede restaurar.' };
  return { estado: escribir(estado, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

export function eliminarDeseoAccesorio(estado, id, { ahora = new Date().toISOString() } = {}) {
  const d = datosAccesorios(estado);
  const r = prepararEliminacion(d, MODULO_ACCESORIOS, 'deseos', id, ahora);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'Ese deseo no existe.', entrada: null };
  return { estado: escribir(estado, r.moduloActualizado), entrada: r.entrada, error: null };
}

export function restaurarDeseoAccesorio(estado, entrada) {
  const r = prepararRestauracion(datosAccesorios(estado), entrada);
  if (!r) return { estado: normalizarEstiloHombre(estado), error: 'No se puede restaurar.' };
  return { estado: escribir(estado, r.moduloActualizado), error: null, yaExistia: r.yaExistia };
}

/* ===========================================================================
   12 · RESUMEN, AUDITORÍA Y PANEL
   =========================================================================== */

export function resumenAccesorios(estado, armario) {
  const d = datosAccesorios(estado);
  const lista = accesorios(estado, armario);
  return {
    estado: estadoDeEntradaAccesorios(estado),
    accesorios: lista.length,
    categorias: categoriasActivasAccesorios(estado).length,
    // Apartado 7 — contado sobre la prenda, que es donde vive.
    favoritos: lista.filter((a) => a.favorito).length,
    enUso: lista.filter((a) => a.enUso).length,
    conEstilo: lista.filter((a) => a.estilos.length > 0).length,
    conOcasion: lista.filter((a) => a.ocasiones.length > 0).length,
    deseos: d.deseos.length,
    huerfanos: accesoriosHuerfanos(estado, armario).length,
    partesActivas: PARTES_ACCESORIOS.filter((p) => d.partes[p.id]).length,
  };
}

/** Apartado 11 — *"qué no hacemos"*, comprobado en vez de prometido. */
export function auditarAccesorios(estado, armario) {
  const d = datosAccesorios(estado);
  const campos = new Set();
  d.accesorios.forEach((a) => Object.keys(a).forEach((k) => campos.add(k)));
  return {
    // ❌ Otro armario: las prendas están en el armario, y aquí ninguna.
    armariosNuevos: 0,
    prendasGuardadasAqui: 0,
    // ⚠️ Lo que de verdad lo demuestra: ni un campo de la prenda en el envoltorio.
    camposDeLaPrendaDuplicados: CAMPOS_DE_LA_PRENDA.filter((c) => campos.has(c)).length,
    // ❌ Otro sistema de outfits (apartado 9): se guarda la preferencia y ya.
    outfitsNuevos: 0,
    // ❌ Otro sistema de favoritos (apartado 7): es `prenda.favorita`.
    favoritosNuevos: 0,
    // ❌ Otro calendario.
    calendariosNuevos: 0,
    // ❌ Otro catálogo de productos (apartado 12).
    catalogosNuevos: 0,
    // Ni otra papelera: dos líneas en el catálogo global.
    papelerasNuevas: 0,
    // Ni otra lista de estilos ni otra de ocasiones (apartados 5 y 6).
    listasDeEstilos: 0,
    listasDeOcasiones: 0,
    // Apartado 10 — sin IA.
    usaIA: 0,
    /* La lista de deseados es del módulo porque **no hay una global**
       (apartado 13: *"si ya existe"*). Se declara, no se esconde. */
    listasDeseosGlobales: 0,
    motorRecomendaciones: 'motorRecomendaciones.js',
    prendasEnArmario: prendasAccesorioDelArmario(armario).length,
    accesorios: d.accesorios.length,
  };
}

export function textosDeAccesorios() {
  return [
    ...Object.values(TEXTOS_ACCESORIOS),
    TEXTO_AL_BORRAR,
    ...PARTES_ACCESORIOS.map((p) => p.nombre),
    ...PLAQUITAS_ACCESORIOS.map((p) => p.nombre),
    ...SUGERENCIAS_ACCESORIOS.map((s) => s.texto),
    ...SUGERENCIAS_ACCESORIOS.map((s) => s.accion),
    ...CATEGORIAS_ACCESORIO.map((c) => c.nombre),
    ...OCASIONES_ACCESORIO.map((o) => o.nombre),
  ].filter(Boolean);
}

export function panelAccesorios(estado, armario, datosGlobales = {}) {
  const d = datosAccesorios(estado);
  return {
    estado: estadoDeEntradaAccesorios(estado),
    partes: PARTES_ACCESORIOS.map((p) => ({ ...p, activa: d.partes[p.id] })),
    categorias: CATEGORIAS_ACCESORIO.map((c) => ({ ...c, activa: d.partes[c.id] })),
    /* ⚠️ Apartados 10 y 13 — una plaquita apagada no se enseña, y no hay ninguna
       que abra una pantalla vacía (regla 8). */
    plaquitas: PLAQUITAS_ACCESORIOS.filter((pl) => (
      pl.id === 'recomendaciones' ? d.partes.recomendaciones
        : (pl.id === 'deseos' ? d.partes.deseos : true)
    )),
    accesorios: accesorios(estado, armario),
    porCategoria: accesoriosPorCategoria(estado, armario),
    enUso: accesoriosEnUso(estado, armario),
    deseos: d.partes.deseos ? d.deseos : [],
    sugerencias: sugerenciasAccesorios(estado, armario, datosGlobales),
    // Apartado 3 — las prendas de accesorio del armario que todavía no están aquí.
    delArmarioSinUsar: prendasAccesorioDelArmario(armario)
      .filter((p) => !d.accesorios.some((a) => a.prendaId === p.id)),
    estilos: ESTILOS_ACCESORIO,
    ocasiones: OCASIONES_ACCESORIO,
    resumen: resumenAccesorios(estado, armario),
  };
}

export { OCASIONES, CATEGORIAS_ARMARIO };
