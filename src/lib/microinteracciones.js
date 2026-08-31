// ============================================================================
// EH · Fase 50/65 — MICROINTERACCIONES Y ANIMACIONES
//
// *"Cada acción debe tener una respuesta visual clara, rápida y elegante."*
//
// ── QUÉ SE CONSTRUYE AQUÍ ──────────────────────────────────────────────────
//
// El enunciado no pide funciones: pide **que cada gesto se sienta igual en toda
// la aplicación**. Y eso, en este proyecto, ya está casi todo resuelto por los
// componentes globales — así que lo que se construye es **la declaración de las
// veinticuatro microinteracciones** con dónde vive cada una, y **el revisor de
// consistencia** que comprueba lo que el apartado 22 pide con esas palabras:
// *"una misma acción debe comportarse igual en todo Estilo"*.
//
// ── LAS CINCO DECISIONES QUE GOBIERNAN ESTA FASE ───────────────────────────
//
// **1. ⚠️ EL FEEDBACK AL TOCAR NO ES DE ESTILO DE HOMBRE: ES DE JOSSTYLE.**
// Los `active:scale` viven en `ui.jsx`, y la vista de Estilo de hombre **no
// tiene ni uno propio**. Eso es lo que hace que tocar una plaquita se sienta
// igual que tocar cualquier otra cosa de la aplicación, y hay una comprobación
// que falla si alguien se escribe el suyo.
//
// **2. ⚠️ Y LA ESCALERA DE ESCALAS ES DELIBERADA, NO UN DESCUIDO.** `ui.jsx`
// usa `0.96` en las tarjetas grandes, `95` en los botones, `[0.98]` en las filas
// y `90` en los iconos pequeños: cuanto más pequeño es el elemento, más se nota
// el apretón. Se declara **para que nadie la "arregle"** dejándolo todo igual.
//
// **3. ⚠️ VOLVER ES SIEMPRE LO MISMO.** Cincuenta y una pantallas, cincuenta y
// un botones idénticos: `ArrowLeft size={16}` con `aria-label="Volver"`. La
// comprobación cuenta los dos y falla si se separan — es la forma más barata de
// que nadie invente un segundo "atrás".
//
// **4. ⚠️ ARRASTRAR NO SE CONSTRUYE, Y SE DICE POR QUÉ.** Los apartados 2 y 3
// piden mantener pulsado y arrastrar para mover una plaquita. **Eso ya está
// resuelto con flechas** desde la Personalización (Fase 19 del Prompt Maestro) y
// ME F2, y las flechas funcionan con el lector de pantalla y con el pulgar en un
// iPhone. Añadir arrastre encima sería un segundo mecanismo para la misma
// acción — justo lo que la F48 acaba de terminar de quitar.
//
// **5. ⚠️ Y NINGUNA ANIMACIÓN GRATUITA** (apartado 23, con esas palabras). Cada
// una de las que hay tiene una función declarada —confirmar, orientar, conectar
// o suavizar—, y la que no la tenga no debería estar.
// ============================================================================

import { ESTADOS_EH, TARJETAS_DE_CARGA, DURACION_FEEDBACK_MS } from './estadosEstilo';
import { REGLAS_RENDIMIENTO } from './rendimiento';

/* ===========================================================================
   1 · PARA QUÉ SIRVE UNA ANIMACIÓN (apartado 23)
   =========================================================================== */

export const FUNCIONES_ANIMACION = [
  { id: 'confirmar', que: 'Decir que algo ha pasado.' },
  { id: 'orientar', que: 'Decir dónde estás o de dónde vienes.' },
  { id: 'conectar', que: 'Unir lo que tocas con lo que se abre.' },
  { id: 'suavizar', que: 'Evitar que algo aparezca de golpe.' },
];

export const funcionAnimacion = (id) => FUNCIONES_ANIMACION.find((f) => f.id === id) || null;

/* ===========================================================================
   2 · LAS VEINTICUATRO (apartados 1 a 24)
   ===========================================================================
   ⚠️ Cada una con **dónde vive** y **para qué sirve**. Y la que no existe, con
   su motivo — que aquí no es "falta tiempo", sino "ya está resuelto de otra
   forma" (decisión 4). */

export const MICROINTERACCIONES = [
  { apartado: 1, id: 'tocar', nombre: 'Tocar una plaquita', existe: true, funcion: 'confirmar', donde: '`active:scale` de `ui.jsx`: el mismo de toda la aplicación.' },
  {
    apartado: 2, id: 'mantener', nombre: 'Mantener pulsado para mover', existe: false,
    donde: 'Se mueve con flechas ↑↓ desde Personalizar (Prompt Maestro F19 + ME F2).',
    porque: 'Las flechas ya lo resuelven, funcionan con lector de pantalla y no dependen del pulso.',
  },
  {
    apartado: 3, id: 'arrastrar', nombre: 'Arrastrar', existe: false,
    donde: 'Lo mismo: las flechas.',
    porque: 'Añadir arrastre sería un segundo mecanismo para la misma acción (la lección de la F48).',
  },
  { apartado: 4, id: 'anadir', nombre: 'Añadir un módulo', existe: true, funcion: 'suavizar', donde: '`.module-enter` en `index.css`; React repinta solo lo que cambia.' },
  { apartado: 5, id: 'ocultar', nombre: 'Ocultar', existe: true, funcion: 'confirmar', donde: '`alternarModulo` + el estado ⚪ Oculto de Gestionar apartados (F36).' },
  { apartado: 6, id: 'desactivar', nombre: 'Desactivar', existe: true, funcion: 'confirmar', donde: 'El mismo sitio: cambia el estado y **no desaparece** del gestor.' },
  { apartado: 7, id: 'recuperar', nombre: 'Recuperar de Eliminados', existe: true, funcion: 'confirmar', donde: '`restaurar*` + la papelera global, que devuelve el elemento a su sitio.' },
  { apartado: 8, id: 'guardar', nombre: 'Guardar un favorito', existe: true, funcion: 'confirmar', donde: '`HechoEH` (F41), que se va solo a los dos segundos.' },
  { apartado: 9, id: 'eliminar', nombre: 'Eliminar', existe: true, funcion: 'confirmar', donde: 'El impacto antes, la papelera después: *"Se borrará X y 3 días registrados."*' },
  { apartado: 10, id: 'tamano', nombre: 'Cambiar el tamaño de una plaquita', existe: true, funcion: 'suavizar', donde: '`personalizacion` (F31): la rejilla se recoloca sola.' },
  { apartado: 11, id: 'abrir', nombre: 'Abrir un módulo', existe: true, funcion: 'conectar', donde: 'Un cambio de estado, sin animación que retrase el acceso.' },
  { apartado: 12, id: 'volver', nombre: 'Volver', existe: true, funcion: 'orientar', donde: 'El mismo botón en las 51 pantallas: `ArrowLeft` con `aria-label="Volver"`.' },
  { apartado: 13, id: 'buscador', nombre: 'El buscador', existe: true, funcion: 'confirmar', donde: 'El campo responde con cada tecla; la búsqueda espera 250 ms (F44).' },
  { apartado: 14, id: 'filtros', nombre: 'Filtros', existe: true, funcion: 'confirmar', donde: 'Estado local: cambian sin bloquear nada.' },
  { apartado: 15, id: 'selectores', nombre: 'Casillas y selectores', existe: true, funcion: 'confirmar', donde: '`Switch` y las casillas: `aria-pressed` cambia en el mismo toque.' },
  {
    apartado: 16, id: 'sliders', nombre: 'Deslizantes', existe: false,
    donde: 'Estilo de hombre no tiene ninguno.',
    porque: 'Nada de lo que se configura aquí es un número continuo: son listas y casillas.',
  },
  { apartado: 17, id: 'errores', nombre: 'Errores', existe: true, funcion: 'orientar', donde: 'Un texto pequeño junto a lo que falló (F41), sin animaciones alarmantes.' },
  { apartado: 18, id: 'exito', nombre: 'Éxito', existe: true, funcion: 'confirmar', donde: '`HechoEH`: un ✓ pequeño y temporal.' },
  { apartado: 19, id: 'carga', nombre: 'Carga', existe: true, funcion: 'suavizar', donde: '`CargandoEH` con sus tarjetas de esqueleto (F41).' },
  { apartado: 20, id: 'reducir', nombre: 'Reducir movimiento', existe: true, funcion: 'suavizar', donde: '`prefers-reduced-motion` en `index.css`, desde la F42.' },
  { apartado: 21, id: 'velocidad', nombre: 'Animaciones cortas', existe: true, funcion: 'suavizar', donde: 'La regla de la F44: nada de medio segundo o más.' },
  { apartado: 22, id: 'consistencia', nombre: 'La misma acción, el mismo gesto', existe: true, funcion: 'orientar', donde: '`revisarConsistencia()`, aquí mismo.' },
  { apartado: 23, id: 'sin_gratuitas', nombre: 'Ninguna animación gratuita', existe: true, funcion: 'orientar', donde: 'Cada una de esta lista declara para qué sirve.' },
  { apartado: 24, id: 'recorrido', nombre: 'Recorrerlas todas', existe: true, funcion: 'confirmar', donde: 'Las 447 comprobaciones en Chromium: tocar, abrir, marcar, volver.' },
];

export const microinteraccion = (id) => MICROINTERACCIONES.find((m) => m.id === id) || null;
export const noExisten = () => MICROINTERACCIONES.filter((m) => !m.existe);

/* ===========================================================================
   3 · LA ESCALERA DEL APRETÓN (decisión 2)
   ===========================================================================
   ⚠️ Cuanto más pequeño es el elemento, más se nota. Está declarado para que
   nadie lo "arregle" dejándolo todo igual. */

export const ESCALAS_AL_TOCAR = [
  { donde: 'Tarjeta grande', clase: 'active:scale-[0.96]' },
  { donde: 'Fila de lista', clase: 'active:scale-[0.98]' },
  { donde: 'Botón', clase: 'active:scale-95' },
  { donde: 'Icono pequeño', clase: 'active:scale-90' },
];

/* ===========================================================================
   4 · EL REVISOR DE CONSISTENCIA (apartado 22)
   =========================================================================== */

export const REGLAS_CONSISTENCIA = [
  {
    id: 'volver_igual',
    que: 'Todos los "volver" son el mismo botón.',
    revisa: (vista) => {
      const etiquetas = (vista.match(/aria-label="Volver"/g) || []).length;
      const flechas = (vista.match(/ArrowLeft size=\{16\}/g) || []).length;
      if (etiquetas === 0) return 'no hay ni un botón de volver';
      if (etiquetas !== flechas) return `hay ${etiquetas} "volver" y ${flechas} flechas: alguno es distinto`;
      return null;
    },
  },
  {
    id: 'sin_atras_inventado',
    que: 'Nadie se inventa un segundo "atrás".',
    revisa: (vista) => (/aria-label="(Atrás|Cerrar pantalla|Ir atrás)"/.test(vista)
      ? 'hay un botón de volver con otro nombre' : null),
  },
  {
    id: 'feedback_de_ui',
    que: 'El feedback al tocar es el de JosStyle, no uno propio.',
    /* ⚠️ Decisión 1 — si la vista se escribe su propio `active:scale`, tocar una
       plaquita deja de sentirse como tocar cualquier otra cosa. */
    revisa: (vista) => (/active:scale/.test(vista)
      ? 'la vista se ha escrito su propio feedback al tocar: eso vive en ui.jsx' : null),
  },
  {
    id: 'un_solo_exito',
    que: 'El ✓ de "hecho" es uno solo, y dura lo mismo en todas partes.',
    /* ⚠️ `[^)]*` no vale: el propio `setTimeout` lleva un `)` dentro —
       `setTimeout(() => algo(), 3000)`—, así que la búsqueda se paraba antes de
       llegar al número y **no cazaba nada**. Con `[\s\S]*?` sí. */
    revisa: (vista) => (/setTimeout\([\s\S]{0,80}?\b(1000|1500|3000|4000|5000)\b/.test(vista)
      ? 'hay un feedback con otra duración: la de siempre es DURACION_FEEDBACK_MS' : null),
  },
];

export const reglaConsistencia = (id) => REGLAS_CONSISTENCIA.find((r) => r.id === id) || null;

export function revisarConsistencia(vista) {
  return REGLAS_CONSISTENCIA
    .map((r) => ({ regla: r.id, problema: r.revisa(String(vista || '')) }))
    .filter((x) => !!x.problema);
}

/* ===========================================================================
   5 · AUDITORÍA
   =========================================================================== */

export const TEXTOS_MICRO = {
  regla: 'Cada acción, una respuesta clara, rápida y elegante.',
  // Apartado 23, con sus palabras.
  gratuita: 'Ninguna animación porque queda bonito.',
};

export function auditarMicrointeracciones(vista) {
  return {
    microinteracciones: MICROINTERACCIONES.length,
    // Decisión 4 — las que no existen, con su motivo.
    noExisten: noExisten().map((m) => m.id),
    sinMotivo: noExisten().filter((m) => !m.porque).map((m) => m.id),
    sinDonde: MICROINTERACCIONES.filter((m) => !m.donde).map((m) => m.id),
    // Apartado 23 — y las que existen, con su función.
    sinFuncion: MICROINTERACCIONES.filter((m) => m.existe && !funcionAnimacion(m.funcion)).map((m) => m.id),
    // Apartado 22.
    inconsistencias: revisarConsistencia(vista),
    reglas: REGLAS_CONSISTENCIA.length,
    escalas: ESCALAS_AL_TOCAR.length,
    // Lo que ya existía y esta fase solo declara.
    feedbackMs: DURACION_FEEDBACK_MS,
    tarjetasDeCarga: TARJETAS_DE_CARGA,
    estadosDePantalla: ESTADOS_EH.length,
    // Y la regla de velocidad, que es de la F44: no se escribe una segunda.
    reglaVelocidad: REGLAS_RENDIMIENTO.some((r) => r.id === 'animacion_larga'),
    // Esta fase tampoco construye nada.
    animacionesNuevas: 0,
    pantallasNuevas: 0,
  };
}

export function panelMicrointeracciones(vista) {
  const a = auditarMicrointeracciones(vista);
  return {
    regla: TEXTOS_MICRO.regla,
    microinteracciones: MICROINTERACCIONES.map((m) => ({
      ...m, funcionQue: funcionAnimacion(m.funcion)?.que || null,
    })),
    resueltasDeOtraForma: noExisten(),
    escalas: ESCALAS_AL_TOCAR,
    inconsistencias: a.inconsistencias,
    // ⚠️ Verde solo si no hay ninguna inconsistencia.
    consistente: a.inconsistencias.length === 0,
  };
}
