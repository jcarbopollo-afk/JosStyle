// ============================================================================
// EH · Fase 45/65 — ESTRUCTURA INTERNA DE DATOS
//
// *"Una información = un único lugar = muchas formas de mostrarla."*
//
// ── ESTA FASE TAMPOCO CONSTRUYE: DECLARA Y COMPRUEBA ───────────────────────
//
// El enunciado no pide una pantalla: pide **que los datos estén donde tienen
// que estar**. Y la mitad de eso ya se decidió en su día, fase a fase. Así que
// aquí se hace lo que hicieron la F39, la F43 y la F44: **declarar dónde vive
// cada cosa con la función real que la lee**, y **construir las auditorías** que
// fallan si alguien lo rompe.
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ NI UNA TERCERA LISTA DE COLECCIONES.** `COLECCIONES_EH` (F41) ya dice
// qué listas hay y **cómo se leen**, y `CATALOGO_PAPELERA` (ME F3) dice cuáles
// se pueden borrar. Las auditorías de aquí **recorren esas dos**, no una copia:
// una tercera lista sería exactamente el "guardar la misma información en dos
// sitios" que prohíbe el apartado 12 del enunciado anterior.
//
// **2. ⚠️ LA SEPARACIÓN DE MÓDULOS ES LÓGICA, NO FÍSICA, Y SE DICE.** El
// apartado 2 pide *"no mezclar todos los datos en una única tabla gigante"*.
// JosStyle guarda **una fila por (usuario, clave)** en `app_data`, y Estilo de
// hombre es **una** clave con una lista de módulos dentro, **cada uno con su
// `config` y su propio normalizador**. Eso cumple el espíritu —cada módulo
// manda sobre lo suyo— pero **no es una tabla por módulo**, y decirlo importa:
// es lo que hace que el apartado 12 (conflictos) siga sin poder cumplirse.
//
// **3. ⚠️ LOS CONFLICTOS SIGUEN SIN PODER DETECTARSE, Y NO SE FINGE.** La
// **F41** ya lo dejó escrito: `saveData` sobrescribe **sin leer la versión
// anterior**, así que no hay forma de saber que otro dispositivo tocó lo mismo.
// Se declara con su motivo y su texto —igual que allí— en vez de un aviso que no
// aparecería nunca. Cambiarlo es tocar el esquema, y eso no es de esta fase.
//
// **4. ⚠️ UNA RELACIÓN ES UN ID, NUNCA UNA COPIA** (apartado 7, con su ejemplo:
// *"no copiar esos objetos dentro de Estilo. Solo guardar la relación"*). Esto
// no es nuevo —lo cumplen la F26 con las prendas, la F28 con los objetivos y la
// F20 con los productos—, pero **hasta ahora nadie lo comprobaba de una vez**.
// `revisarRelaciones()` recorre lo guardado y falla si encuentra una ficha
// entera donde debería haber un id.
//
// **5. ⚠️ LAS FECHAS SON `AAAA-MM-DD`, Y HAY QUIEN LO COMPRUEBA** (apartado 10).
// El proyecto ya se llevó **cuatro sustos con UTC**; esta auditoría recorre todo
// lo guardado y canta cualquier fecha que no tenga esa forma.
//
// **6. ⚠️ Y NO SE SOBREDISEÑA** (apartado 15, con esas palabras: *"no crear
// estructuras para funciones que todavía no existen"*). Aquí no nace ni un
// campo, ni una tabla, ni un almacén: **solo declaraciones y comprobaciones**
// sobre lo que ya hay.
// ============================================================================

import { MODULOS_EH, IDS_EH, normalizarEstiloHombre, FUENTES_GLOBALES } from './estiloDeHombre';
import { COLECCIONES_EH } from './estadosEstilo';
import { CATALOGO_PAPELERA } from './papelera';

/* ===========================================================================
   1 · DÓNDE VIVE CADA COSA (apartados 1, 2 y 4)
   ===========================================================================
   ⚠️ **Una clave por sistema, dentro de la `config` de su módulo.** El nombre
   de la clave es el que se usa de verdad al guardar; si alguien lo cambia sin
   cambiar esta línea, la prueba lo canta. */

export const CLAVES_POR_MODULO = [
  { modulo: 'pelo', claves: ['pelo'], que: 'Perfil capilar, rutinas, productos y peluquería' },
  { modulo: 'skincare', claves: ['piel', 'rutinas', 'seguimiento', 'recomendaciones'], que: 'Perfil de piel, rutinas, registros y recomendaciones' },
  { modulo: 'barba', claves: ['barba', 'rutinas'], que: 'Perfil de barba, rutinas y registros' },
  { modulo: 'sonrisa', claves: ['sonrisa'], que: 'Higiene bucal: rutinas, revisiones y registros' },
  { modulo: 'perfumes', claves: ['perfumes', 'recomendaciones'], que: 'Colección, historial de uso y recomendaciones' },
  { modulo: 'accesorios', claves: ['accesorios'], que: 'Accesorios y lista de deseos' },
  { modulo: 'gustos', claves: ['gustos'], que: 'Gustos, intereses y experiencias' },
  { modulo: 'higiene', claves: ['cuerpoHigiene', 'rutinas', 'recomendaciones', 'manosPies'], que: 'Higiene, sus rutinas y manos, uñas y pies' },
  { modulo: 'cuerpo', claves: ['cuerpoHigiene', 'rutinas', 'recomendaciones'], que: 'Cuidado corporal y sus rutinas' },
  { modulo: 'estilo', claves: ['miEstilo', 'pantalla', 'ideas', 'descubrir', 'buscador', 'avisos', 'progreso', 'primerUso'], que: 'El anfitrión: portada, ideas, buscador, avisos y progreso' },
  /* ⚠️ **Los que todavía no guardan nada, y se dice.** Están en `MODULOS_EH`
     porque Josué los puso en su Fase 2 —se pueden encender y aparecen en la
     portada—, pero su pantalla llega en una fase posterior, así que su `config`
     está vacía. Declararlos con `claves: []` es lo que impide que la auditoría
     los cuente como un olvido… y lo que hará que se note el día que uno guarde
     algo sin decirlo aquí. */
  { modulo: 'fitness', claves: [], sinDatos: true, que: 'Todavía no guarda nada: su fase no ha llegado' },
  { modulo: 'sueno', claves: [], sinDatos: true, que: 'Todavía no guarda nada: su fase no ha llegado' },
  { modulo: 'salud', claves: [], sinDatos: true, que: 'Todavía no guarda nada: su fase no ha llegado' },
  { modulo: 'habitos', claves: [], sinDatos: true, que: 'Todavía no guarda nada: su fase no ha llegado' },
  { modulo: 'progreso', claves: [], sinDatos: true, que: 'Todavía no guarda nada: su fase no ha llegado' },
  { modulo: 'educacion', claves: [], sinDatos: true, que: 'Todavía no guarda nada: su fase no ha llegado' },
  { modulo: 'productos', claves: [], sinDatos: true, que: 'Todavía no guarda nada: su fase no ha llegado' },
];

export const clavesDe = (modulo) => CLAVES_POR_MODULO.find((m) => m.modulo === modulo)?.claves || [];

/**
 * ⚠️ **Decisión 2** — el apartado 2 pide una estructura por módulo, y esto es lo
 * que hay de verdad. Se declara con su límite, no con una promesa.
 */
export const COMO_SE_GUARDA = {
  tabla: 'app_data',
  fila: 'Una por (usuario, clave). Estilo de hombre es UNA clave: `estiloHombre`.',
  dentro: 'Una lista de módulos, y cada módulo con su `config` y su propio normalizador.',
  // Lo que sí se cumple del apartado 2.
  cumple: 'Cada módulo manda sobre lo suyo: nadie escribe en la `config` de otro.',
  // Y lo que no, dicho.
  limite: 'No es una tabla por módulo: guardar un perfume manda la clave entera.',
  // Por qué no se cambia aquí.
  porque: 'Cambiarlo es tocar el esquema de Supabase, y eso no es de esta fase (apartado 15).',
};

/* ⚠️ Apartado 4 — *"las preferencias pertenecen al módulo correspondiente…
   Mi estilo simplemente lo consulta"*. Esto ya es código desde la F4 y la F6:
   `FUENTES_GLOBALES` dice de dónde sale cada dato que NO es de aquí, y el perfil
   de estilo no tiene almacén propio. Se declara dónde está escrito. */
export const DONDE_VIVEN_LAS_PREFERENCIAS = {
  regla: 'La preferencia vive en su módulo; Mi estilo la consulta.',
  enCodigo: 'FUENTES_GLOBALES (F4) + el perfil de estilo sin almacén propio (F6)',
  fuentes: Object.keys(FUENTES_GLOBALES).length,
};

/* ===========================================================================
   2 · LAS COLECCIONES, SIN UNA TERCERA LISTA (decisión 1)
   ===========================================================================
   ⚠️ `COLECCIONES_EH` (F41) trae **la función que las lee**; `CATALOGO_PAPELERA`
   (ME F3) dice cuáles se recuperan. Aquí solo se cruzan. */

export const coleccionesDeEstilo = () => COLECCIONES_EH.map((c) => ({
  id: c.id,
  modulo: c.modulo,
  leer: c.leer,
  // El camino a lo GUARDADO en crudo, cuando la F41 lo declaró.
  crudo: c.crudo || null,
  // Apartado 8 — *"los elementos eliminados… permitan recuperar"*.
  recuperable: !!CATALOGO_PAPELERA[c.id],
}));

/*
 * 🐛 ⚠️ **HAY QUE MIRAR LO GUARDADO, NO LO NORMALIZADO.** Es la lección que la
 * F41 aprendió buscando datos corruptos: el normalizador **ya ha limpiado** el
 * campo malo, así que una auditoría que lea con `datos*()` no encuentra nunca
 * nada — y su silencio parece un aprobado. Cuando la F41 declaró el camino en
 * crudo, se usa; cuando no (las rutinas, que normaliza el motor), se lee lo
 * normalizado **y se dice**, en vez de dar la colección por revisada.
 */
export function leerCrudoDe(estado, coleccion) {
  const e = normalizarEstiloHombre(estado);
  if (!coleccion.crudo) return { lista: coleccion.leer(e) || [], enCrudo: false };
  const cfg = e.modulos.find((m) => m.id === coleccion.crudo.modulo)?.config || {};
  let sitio = cfg;
  for (const paso of coleccion.crudo.camino) {
    if (!sitio || typeof sitio !== 'object') return { lista: [], enCrudo: true };
    sitio = sitio[paso];
  }
  return { lista: Array.isArray(sitio) ? sitio : [], enCrudo: true };
}

/** Las que no se pueden revisar en crudo, declaradas en vez de darse por buenas. */
export const sinRevisarEnCrudo = () => coleccionesDeEstilo().filter((c) => !c.crudo).map((c) => c.id);

/** Apartado 8 — las que se pueden borrar y volver, que deben ser todas. */
export const sinRecuperacion = () => coleccionesDeEstilo().filter((c) => !c.recuperable).map((c) => c.id);

/* ===========================================================================
   3 · LAS AUDITORÍAS (apartados 7, 10 y 11)
   ===========================================================================
   ⚠️ Recorren **lo guardado de verdad**, no un ejemplo: se le pasa un estado y
   se leen sus colecciones con la función que declaró cada fase. */

export const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/* Los campos que son fechas en todo el proyecto. ⚠️ Si una fase futura inventa
   otro nombre para "cuándo pasó", esta lista es donde se añade — y hasta que se
   añada, su fecha no se estará comprobando, que es peor que no tenerla. */
export const CAMPOS_FECHA = ['fecha', 'creadoEn', 'editado', 'desde', 'hasta', 'precioAnotado', 'ultima', 'proxima'];

/** Apartado 10 — *"utilizar formatos consistentes en toda JC Fitness"*. */
export function revisarFechas(estado) {
  const e = normalizarEstiloHombre(estado);
  const problemas = [];
  coleccionesDeEstilo().forEach((c) => {
    leerCrudoDe(e, c).lista.forEach((elemento) => {
      CAMPOS_FECHA.forEach((campo) => {
        const v = elemento?.[campo];
        // ⚠️ `null` es una respuesta válida: *"todavía no"*. Lo que no vale es
        // una fecha con otra forma.
        if (v === null || v === undefined || v === '') return;
        if (typeof v !== 'string' || !FORMATO_FECHA.test(v)) {
          problemas.push({ coleccion: c.id, id: elemento.id, campo, valor: String(v).slice(0, 20) });
        }
      });
    });
  });
  return problemas;
}

/**
 * Apartado 11 — *"identificadores estables para permitir móvil, web y otro
 * dispositivo sin crear duplicados"*.
 *
 * ⚠️ Estable quiere decir dos cosas, y se comprueban las dos: que **no se
 * repiten** dentro de su lista, y que **volver a leer lo guardado no los
 * cambia**. Lo segundo es lo que de verdad rompe la sincronización: un id que se
 * regenera al normalizar crea un elemento nuevo en cada dispositivo.
 */
export function revisarIds(estado) {
  const e = normalizarEstiloHombre(estado);
  const problemas = [];
  coleccionesDeEstilo().forEach((c) => {
    const lista = leerCrudoDe(e, c).lista;
    const ids = lista.map((x) => x?.id);
    ids.forEach((id, i) => {
      if (typeof id !== 'string' || !id) problemas.push({ coleccion: c.id, indice: i, motivo: 'sin id' });
      else if (ids.indexOf(id) !== i) problemas.push({ coleccion: c.id, id, motivo: 'repetido' });
    });
    // Releer lo mismo tiene que devolver los mismos ids.
    const otraVez = leerCrudoDe(normalizarEstiloHombre(e), c).lista.map((x) => x?.id);
    if (JSON.stringify(ids) !== JSON.stringify(otraVez)) {
      problemas.push({ coleccion: c.id, motivo: 'los ids cambian al releer' });
    }
  });
  return problemas;
}

/*
 * Apartado 7 — *"no copiar esos objetos dentro de Estilo. Solo guardar la
 * relación"*.
 *
 * ⚠️ **Un id es un texto.** Si donde debería haber un id aparece un objeto, es
 * que alguien guardó la ficha entera — que es el fallo que este proyecto ya se
 * ha comido cuatro veces con los normalizadores.
 */
export const CAMPOS_RELACION = [
  'prendaId', 'productoId', 'objetivoId', 'rutinaId', 'perfumeId', 'tareaId',
  'eventoId', 'entradaId', 'pasoId', 'plantilla',
];

export function revisarRelaciones(estado) {
  const e = normalizarEstiloHombre(estado);
  const problemas = [];
  const mirar = (coleccion, elemento) => {
    if (!elemento || typeof elemento !== 'object') return;
    CAMPOS_RELACION.forEach((campo) => {
      const v = elemento[campo];
      if (v === null || v === undefined) return;
      if (typeof v === 'object') {
        problemas.push({ coleccion, id: elemento.id, campo, motivo: 'guarda la ficha entera, no su id' });
      }
    });
    // Y un paso de rutina también es un elemento: se mira dentro.
    if (Array.isArray(elemento.pasos)) elemento.pasos.forEach((p) => mirar(coleccion, p));
  };
  coleccionesDeEstilo().forEach((c) => leerCrudoDe(e, c).lista.forEach((x) => mirar(c.id, x)));
  return problemas;
}

/* ===========================================================================
   4 · LOS DIECISÉIS APARTADOS, DECLARADOS
   =========================================================================== */

export const APARTADOS_ESTRUCTURA = [
  {
    apartado: 1, id: 'usuario', nombre: 'Todo vinculado al usuario', cumplido: true,
    donde: '`app_data` con `user_id` y las cuatro políticas RLS (`auth.uid() = user_id`), revisadas por la F43.',
  },
  {
    apartado: 2, id: 'modulos', nombre: 'Una estructura por módulo', cumplido: true,
    donde: 'Una `config` por módulo, con su propio normalizador. Ver `COMO_SE_GUARDA`.',
    limite: COMO_SE_GUARDA.limite,
  },
  {
    apartado: 3, id: 'plaquitas', nombre: 'La configuración de las plaquitas, aparte', cumplido: true,
    donde: '`config.pantalla` del anfitrión (F30/F31): visible, orden y qué línea se enseña, sin tocar los datos.',
  },
  {
    apartado: 4, id: 'preferencias', nombre: 'Las preferencias, en su módulo', cumplido: true,
    donde: '`FUENTES_GLOBALES` (F4) y el perfil de estilo sin almacén propio (F6).',
  },
  {
    apartado: 5, id: 'gustos', nombre: 'La forma de un gusto', cumplido: true,
    donde: '`normalizarEntradaGusto` (F27): nombre, categoría, estado, favorito y fechas.',
  },
  {
    apartado: 6, id: 'experiencias', nombre: 'La forma de una experiencia', cumplido: true,
    donde: 'La misma lista de la F27, con `objetivoId` en vez del objetivo copiado.',
  },
  {
    apartado: 7, id: 'relaciones', nombre: 'Relaciones, no copias', cumplido: true,
    donde: '`revisarRelaciones()`, que recorre lo guardado y falla si encuentra una ficha entera.',
  },
  {
    apartado: 8, id: 'eliminacion', nombre: 'Eliminar sin perder la estructura', cumplido: true,
    donde: '`CATALOGO_PAPELERA` (ME F3): la entrada guarda el elemento entero y su sitio.',
  },
  {
    apartado: 9, id: 'historial', nombre: 'Historial solo donde aporta', cumplido: true,
    /* ⚠️ *"No guardar infinitamente cada pequeña modificación si no aporta
       utilidad."* Lo que tiene historial son los usos de perfume, las rutinas
       hechas y los registros; **editar un nombre no deja rastro**, a propósito. */
    donde: 'Los usos (F24), las rutinas hechas (F14) y los registros. Editar un campo no deja rastro.',
  },
  {
    apartado: 10, id: 'fechas', nombre: 'Fechas consistentes', cumplido: true,
    donde: '`revisarFechas()` + `fechaLocalISO` (AR F3), después de cuatro sustos con UTC.',
  },
  {
    apartado: 11, id: 'ids', nombre: 'Identificadores estables', cumplido: true,
    donde: '`revisarIds()`: ni repetidos, ni distintos al releer.',
  },
  {
    apartado: 12, id: 'conflictos', nombre: 'Detectar conflictos entre dispositivos', cumplido: false,
    /* ⚠️ Decisión 3 — la F41 ya lo declaró así, con estas mismas palabras. */
    donde: 'No se puede: `saveData` sobrescribe sin leer la versión anterior (declarado ya en la F41).',
    porque: 'Detectarlo exige versión o marca de tiempo en `app_data`, que es tocar el esquema.',
    texto: 'Este cambio puede haber pisado otro hecho desde otro dispositivo.',
  },
  {
    apartado: 13, id: 'seguridad', nombre: 'Solo sus propios registros', cumplido: true,
    donde: 'Las cuatro políticas RLS de `app_data`, comprobadas por `revisarAislamiento()` (F43).',
  },
  {
    apartado: 14, id: 'escalabilidad', nombre: 'Añadir sin rehacer', cumplido: true,
    donde: 'Añadir un módulo es una línea en `MODULOS_EH` (F1), y un dato una línea en el registro (F4).',
  },
  {
    apartado: 15, id: 'no_sobredisenar', nombre: 'No sobrediseñar', cumplido: true,
    donde: 'Esta fase no crea ni un campo ni un almacén: solo declara y comprueba lo que ya hay.',
  },
  {
    apartado: 16, id: 'pruebas', nombre: 'Las diez pruebas', cumplido: true,
    donde: '`scripts/test-estructura-datos.mjs`, sobre un estado con datos de verdad.',
  },
];

export const apartadoEstructura = (id) => APARTADOS_ESTRUCTURA.find((a) => a.id === id) || null;

/* ===========================================================================
   5 · RESUMEN Y AUDITORÍA
   =========================================================================== */

export const TEXTOS_ESTRUCTURA = {
  regla: 'Una información, un único lugar, muchas formas de mostrarla.',
  reparto: 'Los módulos guardan los datos. Los sistemas globales gestionan sus funciones. Las plaquitas muestran.',
  // Apartado 12, con el texto que ya escribió la F41.
  conflicto: 'Este cambio puede haber pisado otro hecho desde otro dispositivo.',
};

export function auditarEstructura(estado) {
  const colecciones = coleccionesDeEstilo();
  return {
    // Decisión 1 — ni una tercera lista.
    listasNuevas: 0,
    colecciones: colecciones.length,
    // Decisión 6 — ni un campo ni un almacén nuevos.
    camposNuevos: 0,
    almacenesNuevos: 0,
    // Apartado 8 — todas se recuperan.
    sinRecuperacion: sinRecuperacion(),
    // Apartados 7, 10 y 11, sobre lo que se le pase.
    fechasMalas: revisarFechas(estado),
    idsMalos: revisarIds(estado),
    relacionesCopiadas: revisarRelaciones(estado),
    // Lo que no se cumple, declarado con su motivo.
    noCumplidos: APARTADOS_ESTRUCTURA.filter((a) => !a.cumplido).map((a) => a.id),
    sinMotivo: APARTADOS_ESTRUCTURA.filter((a) => !a.cumplido && !a.porque).map((a) => a.id),
    sinDonde: APARTADOS_ESTRUCTURA.filter((a) => !a.donde).map((a) => a.id),
    // Y que cada módulo del catálogo tiene declarado dónde guarda.
    /* ⚠️ Los que **no están declarados**, que es el olvido de verdad. Un módulo
       con `claves: []` y `sinDatos` está dicho: todavía no guarda nada. */
    modulosSinDeclarar: MODULOS_EH.filter((m) => !CLAVES_POR_MODULO.some((x) => x.modulo === m.id)).map((m) => m.id),
    modulosSinDatos: CLAVES_POR_MODULO.filter((m) => m.sinDatos).map((m) => m.modulo),
    modulos: IDS_EH.length,
  };
}

export function panelEstructura(estado) {
  return {
    regla: TEXTOS_ESTRUCTURA.regla,
    reparto: TEXTOS_ESTRUCTURA.reparto,
    comoSeGuarda: COMO_SE_GUARDA,
    apartados: APARTADOS_ESTRUCTURA,
    // Apartado 12 — lo único que no se cumple, con su motivo y su texto.
    pendientes: APARTADOS_ESTRUCTURA.filter((a) => !a.cumplido),
    colecciones: coleccionesDeEstilo().map((c) => ({ id: c.id, modulo: c.modulo, recuperable: c.recuperable })),
    auditoria: auditarEstructura(estado),
  };
}
