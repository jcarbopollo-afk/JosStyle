// ============================================================================
// EH · Fase 34/65 — PERFIL Y PREFERENCIAS AVANZADAS ("⚙️ Mis preferencias")
//
// *"No es otro formulario gigante. Es el lugar donde el usuario puede ver y
// modificar las preferencias que ha ido configurando. **Tú tienes el control de
// tus datos y preferencias.**"*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ EL APARTADO 15 ES EL REGISTRO DE LA FASE 4, PALABRA POR PALABRA.**
// *"La información debe tener una única fuente de verdad. Por ejemplo: tipo de
// perfume → Perfumes. **No**: tipo de perfume → Mi estilo + Perfumes. 'Mi
// estilo' simplemente lo muestra."* Eso es `REGISTRO_DATOS` con `leerDato()`,
// que existe desde la Fase 4. Así que **aquí no se guarda ni una preferencia**:
// se leen, se dice dónde se cambian y se puede borrar una. Este archivo **no
// tiene almacén propio**, y hay una prueba que lo comprueba.
//
// **2. ⚠️ "MIS PREFERENCIAS" YA ESTABA ESCRITA.** La Fase 27 la construyó como
// vista de solo lectura sobre el registro (`misPreferencias()`), por el mismo
// motivo. Esta fase **la reutiliza y la agrupa** por los siete temas del
// apartado 2; escribir una segunda sería la cuarta lista de preferencias del
// proyecto. Es la quinta vez que este registro evita un duplicado.
//
// **3. ⚠️ LOS SIETE GRUPOS DEL APARTADO 2 SON LOS SIETE TEMAS DE LA FASE 32.**
// *"👕 Ropa · 💇 Pelo · 🧴 Cuidado · 🧔 Barba · 🌫️ Perfumes · 🕶️ Accesorios ·
// ❤️ Gustos."* Son exactamente `TEMAS_IDEAS`, y cada uno ya declara **su
// módulo**, que es adonde lleva "Editar" (apartados 2 y 3). Tercera vez que se
// reutiliza esa lista en tres fases.
//
// **4. ⚠️ EL INTERRUPTOR DEL APARTADO 7 VIVE DONDE SURTE EFECTO.** *"💡 Usar mis
// preferencias para recomendaciones"* es un ajuste de las recomendaciones, así
// que se guarda en el almacén de la Fase 32 y esta pantalla **solo lo enseña**:
// una sola fuente de verdad, que es el apartado 15 aplicado a sí mismo. Y **al
// apagarlo las preferencias siguen guardadas**: lo que cambia es que dejan de
// usarse.
//
// **5. ⚠️ OCULTAR Y ELIMINAR SON DOS ACCIONES DISTINTAS** (apartado 12, con esas
// palabras). Ocultar es `alternarModulo`, que **no toca `config`** desde la Fase
// 1 — por eso el apartado 13 (*"al volver a activar, recuperar la configuración
// anterior"*) sale solo, sin código. Eliminar es otra cosa, y pide confirmación.
//
// **6. ⚠️ Y "ELIMINAR DATOS DE ESTILO DE HOMBRE" NO TOCA OTROS MÓDULOS**
// (apartado 10). El armario, el diario, los objetivos y el calendario son de
// otros; lo que se borra se **enumera antes**, y lo que NO se borra también.
// Nada de "borrar todo" sin decir qué es todo.
// ============================================================================

import {
  normalizarEstiloHombre, modulosActivos, moduloEH, MODULOS_EH,
} from './estiloDeHombre';
import { MODULO_ANFITRION, ESTADOS_MODULO, estadoModulo, estadoDeModulo } from './miEstilo';
import {
  REGISTRO_DATOS, datoDelRegistro, leerDato, eliminarDato, modulosQueUsan,
  datosPrivados, DEFAULT_DATOS_EH,
} from './datosEstiloHombre';
/* ⚠️ Decisión 2 — la vista de solo lectura de la Fase 27, tal cual. Vive en
   `gustos.js` porque allí nació; traérsela sería la segunda copia. */
import { misPreferencias } from './gustos';
/* ⚠️ Decisiones 3 y 4 — los siete temas y el interruptor son de la Fase 32. */
import { TEMAS_IDEAS, temaIdea, usaPreferencias, alternarUsarPreferencias } from './ideasEstilo';

/* ===========================================================================
   1 · DÓNDE VIVE (apartado 1)
   ===========================================================================
   *"Dentro de 🧔 Mi estilo añadir ⚙️ Mis preferencias. Aquí se agrupan
   ÚNICAMENTE las preferencias relacionadas con Estilo de hombre."*

   ⚠️ Como `ZONA_MI_ESTILO` en la Fase 6: una zona dentro de una pantalla que ya
   existe, no un apartado principal nuevo. */

export const ZONA_PREFERENCIAS = {
  id: 'preferencias',
  nombre: 'Mis preferencias',
  icono: '⚙️',
  dentroDe: MODULO_ANFITRION,
};

export const TEXTOS_PREFERENCIAS = {
  titulo: '⚙️ Mis preferencias',
  sub: 'Tú tienes el control de tus datos y preferencias.',
  resumen: 'Tus preferencias',
  editar: 'Editar',
  // Apartado 3 — y se dice adónde lleva.
  dondeSeEdita: 'Editar te lleva al sitio donde de verdad se configura.',
  // Apartado 5 — y nada más: ni porcentajes, ni insistir.
  sinConfigurar: 'Sin configurar',
  noInsistir: 'Lo que no hayas configurado se queda así. No hace falta rellenarlo.',
  // Apartado 6.
  seUsaPara: 'Se usa para las ideas que te proponemos.',
  noSeUsa: 'Ahora mismo no se usa para proponerte nada.',
  // Apartado 7.
  interruptor: '💡 Usar mis preferencias para recomendaciones',
  siguenGuardadas: 'Si lo apagas, tus preferencias siguen guardadas: solo dejan de usarse.',
  // Apartado 8.
  eliminarDato: 'Eliminar',
  // Apartado 12.
  ocultarNoEsBorrar: 'Ocultar un apartado y borrar sus datos son dos cosas distintas.',
  // Apartado 13.
  vuelveComoEstaba: 'Si lo vuelves a activar, aparece como lo dejaste.',
  // Apartado 14.
  exportacion: 'Esto se incluye en la exportación de datos de JosStyle.',
  // Apartado 11.
  privacidad: 'Aquí solo se ve lo de Estilo de hombre. Nada de otros apartados.',
};

/* ===========================================================================
   2 · LOS SIETE GRUPOS (apartados 2, 3 y 4)
   ===========================================================================
   ⚠️ **Son los siete temas de la Fase 32**, que ya declaran su módulo. "Editar"
   abre ese módulo: *"cada una abre el módulo original. **No duplicar
   formularios**."* */

export const CATEGORIAS_PREFERENCIAS = TEMAS_IDEAS.map((t) => t.id);

/**
 * ⚠️ **A qué grupo pertenece una preferencia**: al primero de los siete cuyo
 * módulo la USE, según `usan` del registro de la Fase 4. Ni un mapa
 * `dato → grupo` aparte: sería la base de datos duplicada de siempre.
 */
export function temaDeDato(id) {
  const usan = modulosQueUsan(id);
  return TEMAS_IDEAS.find((t) => usan.includes(t.modulo))?.id || null;
}

/**
 * Apartado 4 — *"mostrar algo muy sencillo. **Nada más**."*
 *
 * ⚠️ Cada preferencia sale de `misPreferencias()` (F27), que la lee del registro
 * de la F4 con `leerDato`. Aquí solo se agrupan y se les añade **quién las usa**
 * (apartado 6) y **si se pueden borrar** (apartado 8).
 */
export function preferenciasPorTema(estado, datosGlobales = {}) {
  const e = normalizarEstiloHombre(estado);
  const activos = modulosActivos(e).map((m) => m.id);
  const todas = misPreferencias(e, datosGlobales);

  return TEMAS_IDEAS.map((t) => {
    const suyas = todas
      .filter((p) => temaDeDato(p.id) === t.id)
      .map((p) => ({
        ...p,
        // Apartado 6 — *"el usuario debe poder entenderlo"*.
        usadaPor: modulosQueUsan(p.id).map((m) => moduloEH(m)?.nombre).filter(Boolean),
        // Apartado 8 — cada dato se borra por separado; los globales, en su sitio.
        sePuedeBorrar: p.tiene && eliminarDato(e, p.id).error === null,
      }));
    const conValor = suyas.filter((p) => p.tiene);
    return {
      ...t,
      // Apartado 2 — *"cada una abre el módulo original"*.
      activo: activos.includes(t.modulo),
      preferencias: suyas,
      /* Apartado 4 — la línea del resumen: sus valores, separados por ·.
         ⚠️ Y sin ninguna, "⚪ Sin configurar": ni un porcentaje (apartado 5).
         ⚠️ Pero **"no tiene ninguna" y "no ha rellenado las suyas" son dos
         cosas**: un grupo cuyas preferencias viven dentro de su propio módulo
         —Barba, Accesorios, Gustos— no está "sin configurar", es que **aquí no
         hay nada que enseñar**, y decirlo es más honesto que marcarlo en blanco
         (regla 8). Es la misma distinción que `null` frente a `[]` de la F25. */
      linea: conValor.length > 0
        ? conValor.map((p) => p.texto).join(' · ')
        : (suyas.length === 0
          ? `Se configura dentro de ${moduloEH(t.modulo)?.nombre || t.nombre}`
          : `${estadoModulo('sin_configurar').icono} ${TEXTOS_PREFERENCIAS.sinConfigurar}`),
      // ⚠️ Y se dice cuál de las dos cosas es, para que la pantalla no adivine.
      aqui: suyas.length > 0,
      configuradas: conValor.length,
      total: suyas.length,
    };
  });
}

/** Apartado 3 — adónde lleva "Editar". ⚠️ Es el módulo del tema, no otra cosa. */
export const dondeSeEdita = (temaId) => temaIdea(temaId)?.modulo || null;

/* ===========================================================================
   3 · EL INTERRUPTOR (apartado 7)
   ===========================================================================
   ⚠️ **Se guarda en el almacén de la Fase 32**, que es donde surte efecto: aquí
   solo se lee y se conmuta. Una copia local sería el duplicado que el apartado
   15 prohíbe, aplicado a la propia fase. */

export const preferenciasEnUso = (estado) => usaPreferencias(estado);

export const alternarPreferenciasEnUso = (estado) => alternarUsarPreferencias(estado);

/* ===========================================================================
   4 · BORRAR UNA PREFERENCIA (apartado 8)
   ===========================================================================
   *"Cada dato debe poder eliminarse individualmente. **No borrar todo el
   perfil.**"*

   ⚠️ Es `eliminarDato()` de la Fase 4, que **se niega a borrar un dato global**
   y dice dónde se edita. Ni una puerta nueva. */

export function borrarPreferencia(estado, id) {
  if (!datoDelRegistro(id)) {
    return { estado: normalizarEstiloHombre(estado), error: 'Esa preferencia no existe.', donde: null };
  }
  return eliminarDato(estado, id);
}

/* ===========================================================================
   5 · RESTABLECER UNA CATEGORÍA (apartado 9)
   ===========================================================================
   *"🔄 Restablecer preferencias de Perfumes. ¿Quieres eliminar las preferencias
   configuradas en esta categoría? **Con confirmación.**"*

   ⚠️ Decimotercer `aplicarPlan` del proyecto: **sin `confirmado` no borra nada**,
   y antes enumera exactamente cuáles se van. */

export function restablecerCategoria(estado, temaId, { confirmado = false, datosGlobales = {} } = {}) {
  const e = normalizarEstiloHombre(estado);
  const tema = temaIdea(temaId);
  if (!tema) return { estado: e, aplicado: false, aviso: null, error: 'Esa categoría no existe.' };

  const grupo = preferenciasPorTema(e, datosGlobales).find((g) => g.id === temaId);
  const borrables = grupo.preferencias.filter((p) => p.sePuedeBorrar);

  if (!confirmado) {
    return {
      estado: e,
      aplicado: false,
      error: null,
      aviso: {
        titulo: `🔄 Restablecer preferencias de ${tema.nombre}`,
        pregunta: '¿Quieres eliminar las preferencias configuradas en esta categoría?',
        // ⚠️ Se dice exactamente cuáles, por su nombre: nada de "todo".
        cuales: borrables.map((p) => p.nombre),
        // Y lo que NO se toca.
        nota: 'Solo se borran estas preferencias. Tus rutinas, productos y lo que hayas apuntado siguen igual.',
        confirmar: 'Restablecer',
        cancelar: 'Cancelar',
      },
    };
  }
  const nuevo = borrables.reduce((acc, p) => eliminarDato(acc, p.id).estado, e);
  return { estado: nuevo, aplicado: true, aviso: null, error: null };
}

/* ===========================================================================
   6 · ELIMINAR LOS DATOS DE ESTILO DE HOMBRE (apartados 10 y 12)
   ===========================================================================
   *"🗑️ Eliminar datos de Estilo de hombre. Con una confirmación fuerte. **Debe
   aclarar exactamente qué se eliminará. No borrar datos de otros módulos** salvo
   que el usuario lo confirme expresamente."*

   ⚠️ **Nunca se tocan otros módulos**, ni con confirmación: el armario, el
   diario, los objetivos y el calendario tienen su propio borrado, y ofrecerlo
   desde aquí sería un segundo camino para lo mismo. Se dice qué queda fuera. */

/** Lo que SÍ se borra: los apartados de Estilo de hombre y sus datos. */
export function loQueSeBorra(estado) {
  const e = normalizarEstiloHombre(estado);
  const conConfig = e.modulos.filter((m) => Object.keys(m.config || {}).length > 0);
  return {
    modulos: conConfig.map((m) => moduloEH(m.id)?.nombre).filter(Boolean),
    // Las preferencias propias del registro de la F4 que estén guardadas.
    preferencias: Object.keys(e.datos || {}).map((id) => datoDelRegistro(id)?.nombre).filter(Boolean),
    retirados: (e.retirados || []).length,
  };
}

/** ⚠️ Lo que NO se borra, **con su nombre**: es la mitad de la confirmación. */
export const LO_QUE_NO_SE_BORRA = [
  'Tu armario (prendas, outfits y su historial)',
  'Tu diario',
  'Tus objetivos',
  'Tu calendario',
  'Tus fotos y tus fondos',
];

export const TEXTO_BORRADO_FUERTE = 'Esto vacía Estilo de hombre entero y no se puede deshacer.';

/**
 * ⚠️ Decimocuarto `aplicarPlan`: **sin `confirmado` no borra**, y el aviso
 * enumera lo que se va y lo que se queda.
 */
export function eliminarDatosDeEstilo(estado, { confirmado = false } = {}) {
  const e = normalizarEstiloHombre(estado);
  if (!confirmado) {
    return {
      estado: e,
      aplicado: false,
      aviso: {
        titulo: '🗑️ Eliminar datos de Estilo de hombre',
        texto: TEXTO_BORRADO_FUERTE,
        seBorra: loQueSeBorra(e),
        seQueda: LO_QUE_NO_SE_BORRA,
        confirmar: 'Eliminar',
        cancelar: 'Cancelar',
      },
    };
  }
  return {
    estado: {
      ...e,
      /* ⚠️ **Se vacía la `config` de cada módulo, no la lista de módulos**: qué
         apartados tiene encendidos es una decisión suya, no un dato — y el
         apartado 12 separa las dos cosas con todas las letras. */
      modulos: e.modulos.map((m) => ({ ...m, config: {} })),
      datos: { ...DEFAULT_DATOS_EH },
      retirados: [],
    },
    aplicado: true,
    aviso: null,
  };
}

/* ===========================================================================
   7 · OCULTAR NO ES BORRAR (apartados 12 y 13)
   ===========================================================================
   ⚠️ *"Si un módulo está desactivado: **sus datos permanecen**. El usuario puede
   decidir: ocultar módulo, o eliminar datos. **Son acciones diferentes.**"* Y el
   apartado 13 —*"al volver a activar, recuperar la configuración anterior"*—
   **sale solo**, porque `alternarModulo` no toca `config` desde la Fase 1. Aquí
   no hay código nuevo: hay dos frases y dos pruebas. */

export function accionesDeModulo(estado, moduloId, datosGlobales = {}) {
  const e = normalizarEstiloHombre(estado);
  const guardado = e.modulos.find((m) => m.id === moduloId);
  if (!guardado) return null;
  const tieneDatos = Object.keys(guardado.config || {}).length > 0;
  return {
    id: moduloId,
    nombre: moduloEH(moduloId)?.nombre || '',
    activo: guardado.activo,
    estado: estadoDeModulo(e, moduloId, datosGlobales),
    tieneDatos,
    // Las dos acciones, dichas como dos.
    ocultar: { etiqueta: guardado.activo ? 'Ocultar apartado' : 'Volver a mostrarlo', borra: false },
    borrar: { etiqueta: 'Eliminar sus datos', borra: true, hayAlgo: tieneDatos },
    nota: TEXTOS_PREFERENCIAS.ocultarNoEsBorrar,
    vuelve: TEXTOS_PREFERENCIAS.vuelveComoEstaba,
  };
}

/* ===========================================================================
   8 · LO QUE VA A LA EXPORTACIÓN (apartado 14)
   ===========================================================================
   *"Si JosStyle ya dispone de 📤 Exportar datos, Estilo de hombre debe incluir
   sus datos dentro de esa exportación. **No crear otro sistema de
   exportación.**"*

   ⚠️ Así que esto **no exporta nada**: devuelve filas con la misma forma que las
   demás (`modulo`, `fecha`, `detalle`, `valor`, `extra`) y quien las escribe es
   `exportData.js`, que ya existía. Y **lo privado no sale** (apartado 11). */

export function filasParaExportar(estado, datosGlobales = {}) {
  const e = normalizarEstiloHombre(estado);
  const privados = datosPrivados();
  const filas = [];

  modulosActivos(e).forEach((m) => {
    filas.push({
      modulo: 'Estilo de hombre',
      fecha: '',
      detalle: moduloEH(m.id)?.nombre || m.id,
      valor: 'activo',
      extra: Object.keys(m.config || {}).length > 0 ? 'configurado' : 'sin configurar',
    });
  });

  REGISTRO_DATOS
    // ⚠️ Apartado 11 — lo marcado como privado no sale de la aplicación.
    .filter((d) => !privados.includes(d.id))
    .forEach((d) => {
      const leido = leerDato(e, d.id, datosGlobales);
      if (!leido.tiene) return;
      filas.push({
        modulo: 'Estilo de hombre (preferencia)',
        fecha: '',
        detalle: d.nombre,
        valor: leido.texto,
        extra: `se usa en: ${modulosQueUsan(d.id).join(', ')}`,
      });
    });

  return filas;
}

/* ===========================================================================
   9 · RESUMEN, AUDITORÍA Y PANEL
   =========================================================================== */

export function resumenPreferencias(estado, datosGlobales = {}) {
  const grupos = preferenciasPorTema(estado, datosGlobales);
  return {
    grupos: grupos.length,
    conAlgo: grupos.filter((g) => g.configuradas > 0).length,
    preferencias: grupos.reduce((s, g) => s + g.total, 0),
    configuradas: grupos.reduce((s, g) => s + g.configuradas, 0),
    usandolas: preferenciasEnUso(estado),
    filasExportadas: filasParaExportar(estado, datosGlobales).length,
  };
}

export function auditarPreferencias() {
  return {
    // Apartado 15 — almacenes propios. CERO: la fuente de verdad es el registro.
    almacenesPropios: 0,
    // Apartado 2 — formularios duplicados. CERO: se abre el módulo original.
    formulariosNuevos: 0,
    // Apartado 5 — *"no queremos gamificar la configuración"*.
    porcentajes: 0,
    barrasDeProgreso: 0,
    // Apartado 14 — sistemas de exportación nuevos.
    exportacionesNuevas: 0,
    // Apartado 10 — módulos ajenos que este borrado toca.
    modulosAjenosBorrados: 0,
    // Apartado 7 — copias del interruptor. UNA, la de la Fase 32.
    interruptores: 1,
    grupos: CATEGORIAS_PREFERENCIAS.length,
    // Las preferencias que el registro declara y esta pantalla agrupa.
    preferencias: REGISTRO_DATOS.filter((d) => d.clase === 'preferencia').length,
    // ⚠️ Y las que no encajan en ninguno de los siete grupos: se verían fuera.
    sinGrupo: REGISTRO_DATOS.filter((d) => d.clase === 'preferencia' && !temaDeDato(d.id)).length,
  };
}

export function textosDePreferencias() {
  return [...Object.values(TEXTOS_PREFERENCIAS), ...LO_QUE_NO_SE_BORRA, TEXTO_BORRADO_FUERTE];
}

export function panelPreferencias(estado, datosGlobales = {}) {
  const grupos = preferenciasPorTema(estado, datosGlobales);
  return {
    zona: ZONA_PREFERENCIAS,
    titulo: TEXTOS_PREFERENCIAS.titulo,
    sub: TEXTOS_PREFERENCIAS.sub,
    grupos,
    // Apartado 7.
    usandolas: preferenciasEnUso(estado),
    interruptor: TEXTOS_PREFERENCIAS.interruptor,
    siguenGuardadas: TEXTOS_PREFERENCIAS.siguenGuardadas,
    // Apartados 5, 11, 12 y 14 — lo que esta pantalla se obliga a decir.
    noInsistir: TEXTOS_PREFERENCIAS.noInsistir,
    privacidad: TEXTOS_PREFERENCIAS.privacidad,
    ocultarNoEsBorrar: TEXTOS_PREFERENCIAS.ocultarNoEsBorrar,
    exportacion: TEXTOS_PREFERENCIAS.exportacion,
    // Apartado 10 — la opción avanzada, con su aviso ya montado.
    borradoTotal: eliminarDatosDeEstilo(estado).aviso,
    resumen: resumenPreferencias(estado, datosGlobales),
  };
}

export { ESTADOS_MODULO, MODULOS_EH };
