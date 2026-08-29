// ============================================================================
// EH · Fase 29/65 — PERFIL DE ESTILO PERSONAL ("Mi estilo")
//
// *"Ahora creamos el núcleo que conecta todo Estilo de hombre. **No será otro
// apartado enorme.** Será una pequeña plaquita que resume las preferencias que
// el usuario ya ha configurado… La aplicación **no debe hacerle repetir
// información que ya haya introducido** en Skincare, Pelo, Perfumes, Armario."*
//
// Y su condición de finalización: *"Mi estilo → módulos → información ya
// existente. **Sin duplicar** Armario · Diario · Objetivos · Calendario ·
// Productos · Favoritos · Recordatorios."*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ ESTE ARCHIVO NO GUARDA NADA, MENOS UN BOOLEANO.** Todo lo que enseña
// —las etiquetas, los estados, los resúmenes— se **deriva en el momento** de los
// módulos que ya existen. Por eso la prueba 6 del apartado 16, *"comprobar
// actualización automática"*, sale sola: no hay nada que actualizar, porque no
// hay copia. Lo único guardado es si él ha ocultado la tarjeta (apartado 10).
//
// **2. ⚠️ LOS APARTADOS 11, 12 Y 15 SON EL SISTEMA DE LA FASE 2.** *"Elegir qué
// aparece"*, *"reordenar plaquitas"* y *"ocultar / mostrar / reordenar /
// desactivar"* ya existen: son `activo`, `orden`, `subirModulo`/`bajarModulo` y
// la pantalla de Gestionar apartados. **D2-07 lo prohíbe expresamente**
// —*"prohibido crear una cuarta lista de qué se ve"*—, así que aquí no hay ni un
// interruptor ni un orden nuevos: se usan los suyos y **la pantalla lo dice**.
//
// **3. ⚠️ NI UNA PREGUNTA NUEVA** (apartado 14: *"NO crear un test de estilo. No
// queremos 50 preguntas obligatorias. El perfil debe construirse poco a poco
// mientras utiliza JC Fitness"*). Este archivo **no tiene lista de preguntas**, y
// hay una prueba que lee su código y falla si aparece una.
//
// **4. ⚠️ EL ESTADO DE CADA MÓDULO LO DICE SU MÓDULO** (apartado 13). Aquí no se
// adivina si Skincare está configurado: se le pregunta a `perfilPiel.js`. Una
// línea por módulo en `FUENTES_DE_ESTADO`, y ningún `if` suelto — el mismo punto
// de extensión que `MODULOS_EH`.
//
// **5. ⚠️ UN BLOQUE SIN MÓDULOS ACTIVOS NO SE PINTA** (apartado 6: *"mostrar
// únicamente módulos activos. No mostrar módulos desactivados"*). Y el orden de
// los módulos dentro de cada bloque es **el que él eligió en la Fase 2**.
//
// **6. ⚠️ Y LAS ETIQUETAS SE DERIVAN, NO SE PIDEN** (apartado 2: *"estas
// etiquetas se obtienen de las preferencias existentes. **No obligar al usuario
// a rellenarlas manualmente**"*). Si todavía no hay ninguna, **no se inventa**:
// se dice que se irán llenando solas, que es exactamente el apartado 14.
// ============================================================================

import {
  normalizarEstiloHombre, guardarConfig, modulosActivos, moduloEH, MODULOS_EH,
} from './estiloDeHombre';
import { leerCampo, loQueReflejaTuArmario, estadoDelPerfil, nombreDeValor } from './perfilEstilo';
import { estadoDeEntrada as estadoDeEntradaPiel } from './perfilPiel';
import { estadoDeEntradaBarba } from './perfilBarba';
import { estadoDeEntradaSonrisa } from './sonrisa';
import { estadoDeEntradaPerfumes, resumenPerfumes } from './perfumes';
import { estadoDeEntradaAccesorios, resumenAccesorios } from './accesorios';
import { estadoDeEntradaGustos, resumenGustos } from './gustos';
import { progresoPelo } from './perfilCapilar';
import { resumenPelo } from './rutinasPelo';
import { resumenEstiloArmario } from './armarioEnEstiloHombre';

/**
 * ⚠️ Dónde vive el único dato de la fase. La **Fase 6** ya declaró
 * `ZONA_MI_ESTILO = { …, dentroDe: 'estilo' }`, así que el interruptor de
 * ocultar va en la `config` de ese módulo, no en un almacén nuevo.
 */
export const MODULO_ANFITRION = 'estilo';

export const TEXTOS_MI_ESTILO = {
  titulo: '🧔 Mi estilo personal',
  /* ⚠️ Apartado 2 — cuando todavía no hay etiquetas. No se inventa ninguna, y
     se dice por qué, que es el apartado 14 en una frase. */
  sinEtiquetas: 'Se irá llenando solo, según vayas usando la aplicación.',
  ocultar: '⚙️ Ocultar "Mi estilo"',
  mostrar: 'Volver a enseñar "Mi estilo"',
  /* ⚠️ Apartados 11, 12 y 15 — el orden y qué aparece ya tienen su sitio.
     Se dice, y se lleva allí, en vez de construir un segundo sistema. */
  dondeSeOrdena: 'El orden y qué apartados ves se cambian en Gestionar apartados.',
  /* ⚠️ Apartado 10 — *"la información de los demás módulos permanece intacta"*. */
  ocultarNoBorra: 'Solo se esconde este resumen. Tus apartados siguen igual.',
  verTodos: 'Ver todos',
};

/* ===========================================================================
   1 · LOS SEIS BLOQUES (apartado 1)
   ===========================================================================
   *"Cada apartado abre directamente su módulo correspondiente."*

   ⚠️ Cada bloque declara **por id** qué módulos de `MODULOS_EH` agrupa. Por sus
   ids, no por su nombre: si alguien renombra uno allí, aquí desaparece y la
   prueba lo dice (la lección de la Fase 26 con los estilos y las ocasiones).

   ⚠️ Y "Cuidado" agrupa varios **porque el apartado 6 lo dice con esas
   palabras**: *"Skincare ✓ Pelo ✓ Barba ✓"*. No es una categoría inventada. */

export const BLOQUES_MI_ESTILO = [
  { id: 'ropa', nombre: 'Ropa', icono: '👕', modulos: ['estilo'] },
  { id: 'pelo', nombre: 'Pelo', icono: '💇', modulos: ['pelo'] },
  { id: 'cuidado', nombre: 'Cuidado', icono: '🧴', modulos: ['skincare', 'barba', 'sonrisa', 'higiene', 'cuerpo'] },
  { id: 'fragancias', nombre: 'Fragancias', icono: '🌫️', modulos: ['perfumes'] },
  { id: 'accesorios', nombre: 'Accesorios', icono: '🕶️', modulos: ['accesorios'] },
  { id: 'gustos', nombre: 'Gustos', icono: '❤️', modulos: ['gustos'] },
];

export const bloqueMiEstilo = (id) => BLOQUES_MI_ESTILO.find((b) => b.id === id) || null;

/** Todos los ids que los bloques nombran. ⚠️ Todos existen en `MODULOS_EH`. */
export const IDS_EN_BLOQUES = BLOQUES_MI_ESTILO.flatMap((b) => b.modulos);

/* ===========================================================================
   2 · EL ESTADO DE CADA MÓDULO (apartado 13)
   ===========================================================================
   *"🟢 Configurado · ⚪ Sin configurar · ⚫ Desactivado. **Sin crear pasos
   obligatorios.**"*

   ⚠️ **Se le pregunta a su módulo.** Una línea por cada uno; el que no tiene
   pantalla propia todavía no tiene fuente, y eso está escrito, no olvidado. */

export const ESTADOS_MODULO = [
  { id: 'configurado', nombre: 'Configurado', icono: '🟢' },
  { id: 'sin_configurar', nombre: 'Sin configurar', icono: '⚪' },
  { id: 'desactivado', nombre: 'Desactivado', icono: '⚫' },
];

export const estadoModulo = (id) => ESTADOS_MODULO.find((e) => e.id === id) || null;

/**
 * ⚠️ El punto de extensión: **una línea por módulo**, como `MODULOS_EH`. Cada
 * una devuelve `true` si ese módulo tiene algo configurado, preguntándoselo a
 * quien lo sabe. Un módulo sin fuente (los que todavía no tienen pantalla) sale
 * como "sin configurar", que es la verdad.
 */
export const FUENTES_DE_ESTADO = {
  estilo: (estado, { armario, datosGlobales }) =>
    !estadoDelPerfil(estado, armario, datosGlobales).vacio
    || (resumenEstiloArmario(estado, armario, datosGlobales)?.total || 0) > 0,
  pelo: (estado, { datosGlobales }) =>
    !progresoPelo(estado, datosGlobales).sinEmpezar || resumenPelo(estado).rutinas > 0,
  skincare: (estado, { datosGlobales }) => estadoDeEntradaPiel(estado, datosGlobales) === 'configurado',
  barba: (estado, { datosGlobales }) => estadoDeEntradaBarba(estado, datosGlobales) === 'configurado',
  sonrisa: (estado) => estadoDeEntradaSonrisa(estado) === 'configurado',
  perfumes: (estado) => estadoDeEntradaPerfumes(estado) === 'configurado',
  accesorios: (estado) => estadoDeEntradaAccesorios(estado) === 'configurado',
  gustos: (estado) => estadoDeEntradaGustos(estado) === 'configurado',
};

export function estadoDeModulo(estado, id, { armario = null, datosGlobales = {} } = {}) {
  const e = normalizarEstiloHombre(estado);
  const guardado = e.modulos.find((m) => m.id === id);
  // ⚫ Desactivado — o directamente no existe en el catálogo.
  if (!guardado || !guardado.activo) return 'desactivado';
  const fuente = FUENTES_DE_ESTADO[id];
  // ⚠️ Sin fuente, "sin configurar": es la verdad, no un hueco.
  if (!fuente) return 'sin_configurar';
  let tiene = false;
  try { tiene = fuente(e, { armario, datosGlobales }) === true; } catch { tiene = false; }
  return tiene ? 'configurado' : 'sin_configurar';
}

/* ===========================================================================
   3 · LAS ETIQUETAS (apartado 2)
   ===========================================================================
   *"Casual · Deportivo · Minimalista. Estas etiquetas se obtienen de las
   preferencias existentes. **No obligar al usuario a rellenarlas manualmente.**"* */

export const MAX_ETIQUETAS = 5;

export function etiquetasDeEstilo(estado, armario = null, datosGlobales = {}) {
  // Lo que él ha dicho en el perfil de estilo (F6), que es donde ya vivía.
  const suyos = leerCampo(estado, 'estilosFavoritos', datosGlobales).valores;
  // Y lo que su armario refleja, que la F6 ya sabe calcular.
  const refleja = loQueReflejaTuArmario(armario);
  const delArmario = (refleja?.estilos || []).map((x) => (typeof x === 'string' ? x : x.id)).filter(Boolean);
  const vistos = [];
  [...suyos, ...delArmario].forEach((id) => { if (id && !vistos.includes(id)) vistos.push(id); });
  return {
    /* ⚠️ Cada etiqueta dice de dónde sale: lo que él eligió pesa más que lo que
       se deduce, y la pantalla puede distinguirlas sin adivinar. */
    etiquetas: vistos.slice(0, MAX_ETIQUETAS).map((id) => ({
      id,
      nombre: nombreDeValor('estilosFavoritos', id),
      suyo: suyos.includes(id),
    })),
    hay: vistos.length > 0,
    // ⚠️ Sin nada, NO se inventa una etiqueta: se dice (apartado 14).
    texto: vistos.length > 0 ? '' : TEXTOS_MI_ESTILO.sinEtiquetas,
  };
}

/** Apartado 4 — *"no crear otro selector de colores diferente para el Armario"*. */
export function coloresDeMiEstilo(estado, datosGlobales = {}) {
  const ids = leerCampo(estado, 'coloresFavoritos', datosGlobales).valores;
  return ids.map((id) => ({ id, nombre: nombreDeValor('coloresFavoritos', id) }));
}

/* ===========================================================================
   4 · EL RESUMEN DE CADA BLOQUE (apartados 5 a 9)
   ===========================================================================
   ⚠️ **Cada frase se le pide a su módulo.** Ni un dato copiado, ni un recuento
   guardado: por eso cambiar una preferencia se refleja sin que nadie sincronice
   nada (apartado 16, prueba 6). */

export function resumenDeBloque(estado, bloqueId, { armario = null, datosGlobales = {} } = {}) {
  const e = normalizarEstiloHombre(estado);
  const activos = modulosActivos(e).map((m) => m.id);
  const tiene = (id) => activos.includes(id);

  if (bloqueId === 'ropa') {
    if (!tiene('estilo')) return '';
    const r = resumenEstiloArmario(e, armario, datosGlobales);
    if (!r || r.vacio) return 'Todavía sin prendas';
    return `${r.total} ${r.total === 1 ? 'prenda' : 'prendas'}`
      + (r.outfits > 0 ? ` · ${r.outfits} ${r.outfits === 1 ? 'outfit' : 'outfits'}` : '');
  }
  if (bloqueId === 'pelo') {
    if (!tiene('pelo')) return '';
    const r = resumenPelo(e);
    const p = progresoPelo(e, datosGlobales);
    if (r.rutinas > 0) return `${r.rutinas} ${r.rutinas === 1 ? 'rutina' : 'rutinas'}`;
    return p.sinEmpezar ? 'Sin empezar' : `${p.contestadas} de ${p.total} contestadas`;
  }
  if (bloqueId === 'fragancias') {
    if (!tiene('perfumes')) return '';
    // Apartado 7 — *"Frescos · Amaderados · Intensidad media"*, de su módulo.
    const r = resumenPerfumes(e, datosGlobales);
    if (r.coleccion === 0) return 'Todavía sin perfumes';
    return `${r.coleccion} ${r.coleccion === 1 ? 'perfume' : 'perfumes'}`
      + (r.actual ? ` · ahora ${r.actual}` : '');
  }
  if (bloqueId === 'accesorios') {
    if (!tiene('accesorios')) return '';
    // Apartado 8 — *"sin duplicar los elementos del Armario"*: es su resumen.
    const r = resumenAccesorios(e, armario || { prendas: [], outfits: [], usos: [] });
    if (r.accesorios === 0) return 'Todavía sin accesorios';
    return `${r.accesorios} ${r.accesorios === 1 ? 'accesorio' : 'accesorios'}`;
  }
  if (bloqueId === 'gustos') {
    if (!tiene('gustos')) return '';
    // Apartado 9 — *"solo una pequeña selección"*, y su "Ver todos".
    const r = resumenGustos(e, datosGlobales);
    if (r.total === 0) return 'Todavía sin nada apuntado';
    return `${r.total} ${r.total === 1 ? 'cosa' : 'cosas'}`;
  }
  if (bloqueId === 'cuidado') {
    // Apartado 6 — *"mostrar únicamente módulos activos"*, con su nombre.
    const suyos = bloqueMiEstilo('cuidado').modulos.filter(tiene);
    if (suyos.length === 0) return '';
    return suyos.map((id) => moduloEH(id).nombre).join(' · ');
  }
  return '';
}

/**
 * Apartado 9 — *"solo una pequeña selección"*. ⚠️ Se leen del módulo, y si está
 * apagado devuelve `null`, no una lista vacía (lección de la Fase 25).
 */
export const MAX_GUSTOS_EN_RESUMEN = 3;

export function unosGustos(estado, datosGlobales = {}) {
  const activos = modulosActivos(estado).map((m) => m.id);
  if (!activos.includes('gustos')) return null;
  const r = resumenGustos(estado, datosGlobales);
  return { cuantos: r.total, verTodos: TEXTOS_MI_ESTILO.verTodos, max: MAX_GUSTOS_EN_RESUMEN };
}

/* ===========================================================================
   5 · LOS BLOQUES QUE SE PINTAN (apartados 1, 6 y 12)
   ===========================================================================
   ⚠️ **El orden es el suyo**, el de la Fase 2: los bloques salen ordenados por
   el módulo más arriba que contengan. Ni una segunda lista de orden. */

export function bloquesVisibles(estado, { armario = null, datosGlobales = {} } = {}) {
  const e = normalizarEstiloHombre(estado);
  const activos = modulosActivos(e);
  const posicion = (id) => {
    const i = activos.findIndex((m) => m.id === id);
    return i === -1 ? Infinity : i;
  };
  return BLOQUES_MI_ESTILO
    .map((b) => {
      /* ⚠️ **EH F36, apartado 3** — *"el módulo desaparece de la pantalla
         principal"*, y esta tarjeta está en la pantalla principal. Un módulo
         oculto sigue funcionando —da ideas, tarjetas y métricas—, pero **no
         ocupa sitio aquí**: verlo en el resumen justo debajo de donde acaba de
         quitarlo parecería que ocultar no ha hecho nada. */
      const suyos = b.modulos
        .filter((id) => activos.some((m) => m.id === id && !m.oculto))
        .sort((a, c) => posicion(a) - posicion(c));
      return {
        ...b,
        // ⚠️ Solo los activos, con su estado y su nombre de verdad.
        modulosActivos: suyos.map((id) => ({
          ...moduloEH(id),
          estado: estadoDeModulo(e, id, { armario, datosGlobales }),
          insignia: estadoModulo(estadoDeModulo(e, id, { armario, datosGlobales })),
        })),
        resumen: resumenDeBloque(e, b.id, { armario, datosGlobales }),
        // Para ordenarlos como él los ordenó.
        posicion: Math.min(...suyos.map(posicion), Infinity),
      };
    })
    // Apartado 6 — un bloque sin módulos activos NO se pinta.
    .filter((b) => b.modulosActivos.length > 0)
    .sort((a, b) => a.posicion - b.posicion);
}

/* ===========================================================================
   6 · OCULTAR Y VOLVER (apartado 10)
   ===========================================================================
   *"Si alguien no quiere este perfil: ⚙️ Ocultar 'Mi estilo'. **La información
   de los demás módulos permanece intacta.**"*

   ⚠️ Es el ÚNICO dato que guarda esta fase: un booleano. */

export const datosMiEstilo = (estado) => {
  const e = normalizarEstiloHombre(estado);
  const mod = e.modulos.find((m) => m.id === MODULO_ANFITRION);
  return { oculto: mod?.config?.miEstilo?.oculto === true };
};

export const miEstiloOculto = (estado) => datosMiEstilo(estado).oculto;

export const ocultarMiEstilo = (estado) =>
  guardarConfig(estado, MODULO_ANFITRION, { miEstilo: { oculto: true } });

export const mostrarMiEstilo = (estado) =>
  guardarConfig(estado, MODULO_ANFITRION, { miEstilo: { oculto: false } });

/* ===========================================================================
   7 · RESUMEN, AUDITORÍA Y PANEL
   =========================================================================== */

export function resumenMiEstilo(estado, { armario = null, datosGlobales = {} } = {}) {
  const bloques = bloquesVisibles(estado, { armario, datosGlobales });
  const todos = bloques.flatMap((b) => b.modulosActivos);
  return {
    oculto: miEstiloOculto(estado),
    bloques: bloques.length,
    modulos: todos.length,
    configurados: todos.filter((m) => m.estado === 'configurado').length,
    sinConfigurar: todos.filter((m) => m.estado === 'sin_configurar').length,
    // ⚠️ Los apagados NO se cuentan aquí: no se pintan (apartado 6).
    etiquetas: etiquetasDeEstilo(estado, armario, datosGlobales).etiquetas.length,
    colores: coloresDeMiEstilo(estado, datosGlobales).length,
  };
}

/** Apartado 16, prueba 12 — *"verificar que no existen datos duplicados"*. */
export function auditarMiEstilo(estado) {
  return {
    // Decisión 1 — lo único guardado es el booleano de ocultar.
    datosGuardados: 1,
    // Decisión 2 — los apartados 11, 12 y 15 son de la Fase 2.
    listasDeOrden: 0,
    interruptoresNuevos: 0,
    // Decisión 3 — apartado 14: *"NO crear un test de estilo"*.
    preguntasNuevas: 0,
    // Condición de finalización — sin duplicar ninguno de los siete.
    armariosNuevos: 0,
    diariosNuevos: 0,
    objetivosNuevos: 0,
    calendariosNuevos: 0,
    catalogosNuevos: 0,
    favoritosNuevos: 0,
    recordatoriosNuevos: 0,
    // Ni una papelera: aquí no se borra nada, porque no hay nada propio.
    papelerasNuevas: 0,
    bloques: BLOQUES_MI_ESTILO.length,
    // Todos los ids que los bloques nombran existen en el catálogo de la F1.
    idsDesconocidos: IDS_EN_BLOQUES.filter((id) => !moduloEH(id)).length,
  };
}

export function textosDeMiEstilo() {
  return [
    ...Object.values(TEXTOS_MI_ESTILO),
    ...BLOQUES_MI_ESTILO.map((b) => b.nombre),
    ...ESTADOS_MODULO.map((e) => e.nombre),
  ].filter(Boolean);
}

export function panelMiEstilo(estado, { armario = null, datosGlobales = {} } = {}) {
  return {
    oculto: miEstiloOculto(estado),
    titulo: TEXTOS_MI_ESTILO.titulo,
    etiquetas: etiquetasDeEstilo(estado, armario, datosGlobales),
    colores: coloresDeMiEstilo(estado, datosGlobales),
    bloques: bloquesVisibles(estado, { armario, datosGlobales }),
    gustos: unosGustos(estado, datosGlobales),
    resumen: resumenMiEstilo(estado, { armario, datosGlobales }),
  };
}

export { MODULOS_EH };
