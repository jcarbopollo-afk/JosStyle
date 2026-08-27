// ============================================================================
// EH · Fase 7/65 — PELO: PERFIL CAPILAR Y NECESIDADES
//
// *"Esta fase se centra únicamente en conocer las características y preferencias
// del usuario."* Cuidados, rutinas, cortes, productos, recomendaciones y
// calendario llegan en las fases 8-12. Aquí solo se pregunta.
//
// ── LO QUE ESTA FASE NO CONSTRUYE, Y ESTÁ DICHO ────────────────────────────
//
// El enunciado lo repite tres veces: *"No crear todavía el calendario"* (12),
// *"no preguntar todavía qué productos utiliza en profundidad"* (11), *"no
// implementar todavía esa lógica"* (17). Así que aquí no hay inventario de
// productos, ni calendario, ni una sola recomendación.
//
// ── LAS DOS DECISIONES QUE IMPORTAN ────────────────────────────────────────
//
// **1. Las doce preguntas son datos, no código.** Están en un array; el motor de
// `cuestionarios.js` hace el resto. Skincare (13), Barba (20) y Manos (22)
// traerán el suyo **sin tocar una línea de aquí**.
//
// **2. `tipoPelo` NO se guarda aquí.** Está en `REGISTRO_DATOS` desde la Fase 4
// porque lo comparten Pelo y Productos, así que el motor lo manda solo a la capa
// compartida. Las otras once son de este módulo y van a su `config`, que
// `alternarModulo` nunca toca — y eso es lo que hace pasar los Tests 7 y 8.
//
// ⚠️ *"No diagnosticar problemas"* (apartado 7). Se pregunta qué quiere cuidar,
// no qué le pasa. La diferencia no es de matiz: un adolescente de 16 años no
// necesita una aplicación diciéndole que tiene un problema.
// ============================================================================

import {
  NO_LO_SE, normalizarPregunta, opcionesDe, leerRespuesta, contestar, borrarRespuesta,
  leerCuestionario, progresoCuestionario, estadoCuestionario, contextoDelCuestionario,
  auditarCuestionario, destinoDe, nombreDeOpcion,
} from './cuestionarios';
import { estaActivo } from './estiloDeHombre';

export const MODULO_PELO = 'pelo';

/* ===========================================================================
   1 · LAS DOCE PREGUNTAS (apartados 2-13)
   ===========================================================================
   Literales del enunciado, con sus opciones tal y como las escribió Josué.

   ⚠️ **`noLoSe: false` solo donde el enunciado NO lo ofrece.** El apartado 14 es
   tajante —*"'No lo sé' debe ser siempre una opción válida cuando corresponda.
   Nunca obligar a inventar una respuesta"*— pero "cuando corresponda" también
   es parte de la frase: preguntar cada cuánto se corta el pelo ya tiene su
   *"Cuando lo necesito"*, y añadirle un "no lo sé" al lado sería ruido. */

export const PREGUNTAS_PELO = [
  {
    id: 'tipoPelo',                        // ⚠️ compartido con Productos (F4)
    titulo: '¿Cómo es tu pelo?',
    apartado: 2,
    opciones: [
      { id: 'liso', nombre: 'Liso' },
      { id: 'ondulado', nombre: 'Ondulado' },
      { id: 'rizado', nombre: 'Rizado' },
      { id: 'muy_rizado', nombre: 'Muy rizado' },
    ],
  },
  {
    id: 'grosorPelo',
    titulo: 'Grosor',
    apartado: 3,
    opciones: [
      { id: 'fino', nombre: 'Fino' },
      { id: 'medio', nombre: 'Medio' },
      { id: 'grueso', nombre: 'Grueso' },
    ],
  },
  {
    id: 'densidadPelo',
    titulo: 'Densidad',
    apartado: 4,
    opciones: [
      { id: 'baja', nombre: 'Baja' },
      { id: 'media', nombre: 'Media' },
      { id: 'alta', nombre: 'Alta' },
    ],
  },
  {
    id: 'longitudPelo',
    titulo: 'Longitud actual',
    apartado: 5,
    opciones: [
      { id: 'muy_corto', nombre: 'Muy corto' },
      { id: 'corto', nombre: 'Corto' },
      { id: 'medio', nombre: 'Medio' },
      { id: 'largo', nombre: 'Largo' },
      { id: 'muy_largo', nombre: 'Muy largo' },
    ],
    // Él sabe cómo lo lleva ahora mismo. Ofrecerle "no lo sé" aquí sobra.
    noLoSe: false,
  },
  {
    id: 'cueroCabelludo',
    titulo: '¿Cómo suele ser tu cuero cabelludo?',
    apartado: 6,
    // *"Permitir seleccionar más de una cuando tenga sentido."*
    multiple: true,
    opciones: [
      { id: 'normal', nombre: 'Normal' },
      { id: 'graso', nombre: 'Graso' },
      { id: 'seco', nombre: 'Seco' },
      { id: 'sensible', nombre: 'Sensible' },
    ],
  },
  {
    id: 'necesidadesPelo',
    titulo: '¿Qué te gustaría cuidar o mejorar?',
    apartado: 7,
    multiple: true,
    // ⚠️ *"No diagnosticar problemas."* Por eso la pregunta es qué quiere
    // cuidar, no qué le falla, y no hay ninguna opción con forma de síntoma.
    opciones: [
      { id: 'hidratacion', nombre: 'Hidratación' },
      { id: 'grasa', nombre: 'Control del exceso de grasa' },
      { id: 'volumen', nombre: 'Volumen' },
      { id: 'definicion', nombre: 'Definición' },
      { id: 'suavidad', nombre: 'Suavidad' },
      { id: 'brillo', nombre: 'Brillo' },
      { id: 'encrespamiento', nombre: 'Control del encrespamiento' },
      { id: 'fortalecimiento', nombre: 'Fortalecimiento' },
      { id: 'otro', nombre: 'Otro' },
    ],
    noLoSe: false,
  },
  {
    id: 'buscasPelo',
    titulo: '¿Qué buscas principalmente con tu pelo?',
    apartado: 8,
    multiple: true,
    opciones: [
      { id: 'cuidado', nombre: 'Tenerlo más cuidado' },
      { id: 'estilo', nombre: 'Conseguir determinado estilo' },
      { id: 'facilidad', nombre: 'Facilidad para peinarlo' },
      { id: 'volumen', nombre: 'Volumen' },
      { id: 'definicion', nombre: 'Definición' },
      { id: 'naturalidad', nombre: 'Naturalidad' },
      { id: 'rapidez', nombre: 'Rapidez' },
      { id: 'otro', nombre: 'Otro' },
    ],
    noLoSe: false,
  },
  {
    id: 'comoLoLlevas',
    titulo: '¿Cómo te gusta llevar el pelo?',
    apartado: 9,
    multiple: true,
    ayuda: 'Servirá para las recomendaciones de corte.',
    opciones: [
      { id: 'corto', nombre: 'Corto' },
      { id: 'medio', nombre: 'Medio' },
      { id: 'largo', nombre: 'Largo' },
      { id: 'volumen', nombre: 'Con volumen' },
      { id: 'atras', nombre: 'Hacia atrás' },
      { id: 'delante', nombre: 'Hacia delante' },
      { id: 'natural', nombre: 'Natural' },
      { id: 'otro', nombre: 'Otro' },
    ],
    noLoSe: false,
  },
  {
    id: 'tiempoPelo',
    titulo: '¿Cuánto tiempo quieres dedicarle normalmente?',
    apartado: 10,
    // ⚠️ La más útil de las doce, según el propio enunciado: *"así las
    // recomendaciones futuras no propondrán una rutina de 20 minutos a alguien
    // que quiere tardar 3"*.
    opciones: [
      { id: 'menos_5', nombre: 'Menos de 5 min' },
      { id: '5_10', nombre: '5–10 min' },
      { id: '10_20', nombre: '10–20 min' },
      { id: 'mas_20', nombre: 'Más de 20 min' },
      { id: 'igual', nombre: 'Me da igual' },
    ],
    noLoSe: false,
  },
  {
    id: 'usaProductosPelo',
    titulo: '¿Utilizas productos para el pelo?',
    apartado: 11,
    // *"No preguntar todavía qué productos utiliza en profundidad."* Tres
    // opciones, y el inventario en la fase 10.
    opciones: [
      { id: 'si', nombre: 'Sí' },
      { id: 'no', nombre: 'No' },
      { id: 'algunos', nombre: 'Algunos' },
    ],
    noLoSe: false,
  },
  {
    id: 'dondeCorte',
    titulo: '¿Dónde sueles cortarte el pelo?',
    apartado: 12,
    opciones: [
      { id: 'peluqueria', nombre: 'Peluquería' },
      { id: 'barberia', nombre: 'Barbería' },
      { id: 'casa', nombre: 'En casa' },
      { id: 'otro', nombre: 'Otro' },
    ],
    noLoSe: false,
  },
  {
    id: 'frecuenciaCorte',
    titulo: '¿Cada cuánto sueles cortártelo?',
    apartado: 13,
    ayuda: 'Se usará para el calendario de peluquería, que llega en la fase 11.',
    opciones: [
      { id: 'semana', nombre: 'Cada semana' },
      { id: '2_semanas', nombre: 'Cada 2 semanas' },
      { id: '3_semanas', nombre: 'Cada 3 semanas' },
      { id: 'mes', nombre: 'Cada mes' },
      { id: '2_meses', nombre: 'Cada 2 meses' },
      { id: 'necesito', nombre: 'Cuando lo necesito' },
      { id: 'otro', nombre: 'Otro' },
    ],
    noLoSe: false,
  },
];

export const preguntaPelo = (id) => PREGUNTAS_PELO.find((p) => p.id === id) || null;
export const IDS_PELO = PREGUNTAS_PELO.map((p) => p.id);

/* ===========================================================================
   2 · LA ENTRADA (apartado 1)
   ===========================================================================
   *"Tu perfil capilar — Cuéntanos un poco sobre tu pelo para poder personalizar
   este apartado. Configurar → o Ahora no. **El usuario puede saltárselo.**"* */

export const TEXTOS_PELO = {
  titulo: 'Tu perfil capilar',
  texto: 'Cuéntanos un poco sobre tu pelo para poder personalizar este apartado.',
  configurar: 'Configurar',
  ahoraNo: 'Ahora no',
  editar: 'Mi perfil capilar',
  // Apartado 2 — *"posteriormente podremos ofrecer información educativa"*.
  // Se dice cuándo, no "próximamente" (regla 8).
  educativo: 'Cuando llegue el apartado de educación podrás salir de dudas sin tener que adivinarlo.',
};

/* ===========================================================================
   3 · LA API DEL MÓDULO
   ===========================================================================
   Todo pasa por el motor. Aquí solo se le pasa `MODULO_PELO` y las preguntas,
   para que ninguna pantalla tenga que acordarse de los dos. */

export const perfilCapilar = (estado, datosGlobales = {}) =>
  leerCuestionario(estado, MODULO_PELO, PREGUNTAS_PELO, datosGlobales);

export const respuestaPelo = (estado, id, datosGlobales = {}) =>
  leerRespuesta(estado, MODULO_PELO, preguntaPelo(id) || { id }, datosGlobales);

export const contestarPelo = (estado, id, valor, opts) =>
  contestar(estado, MODULO_PELO, preguntaPelo(id) || { id, opciones: [] }, valor, opts);

export const borrarPelo = (estado, id, opts) =>
  borrarRespuesta(estado, MODULO_PELO, preguntaPelo(id) || { id }, opts);

export const progresoPelo = (estado, datosGlobales = {}) =>
  progresoCuestionario(estado, MODULO_PELO, PREGUNTAS_PELO, datosGlobales);

export const estadoPerfilCapilar = (estado, datosGlobales = {}) =>
  estadoCuestionario(estado, MODULO_PELO, PREGUNTAS_PELO, datosGlobales);

/**
 * Apartado 17 — *"Según tus características y preferencias…"*.
 *
 * ⚠️ Esto **no recomienda nada**, y el enunciado lo prohíbe expresamente: *"No
 * implementar todavía esa lógica."* Entrega lo contestado, en limpio, para que
 * las fases 8-12 no tengan que volver a leer ids.
 */
export const contextoCapilar = (estado, datosGlobales = {}) =>
  contextoDelCuestionario(estado, MODULO_PELO, PREGUNTAS_PELO, datosGlobales);

/**
 * Apartado 2 — *"si selecciona 'No lo sé' no debemos obligarle a determinarlo.
 * Posteriormente podremos ofrecer información educativa."*
 *
 * Esto dice **sobre qué** podría ofrecerse, sin ofrecerla todavía.
 */
export function dudasDelPerfil(estado, datosGlobales = {}) {
  return perfilCapilar(estado, datosGlobales)
    .filter((q) => q.noSabe)
    .map((q) => ({ id: q.id, titulo: q.titulo, fase: 9 }));
}

/**
 * Apartados 16 y Test 9 — qué de este perfil pueden usar otros módulos, y
 * cuáles. ⚠️ Solo lo compartido: lo de `config` es de Pelo.
 */
export function loQueCompartePelo(estado, datosGlobales = {}) {
  return PREGUNTAS_PELO
    .filter((p) => destinoDe(p.id) === 'compartido')
    .map((p) => ({ ...respuestaPelo(estado, p.id, datosGlobales), pregunta: p.titulo }));
}

export function resumenPerfilCapilar(estado, datosGlobales = {}) {
  const prog = progresoPelo(estado, datosGlobales);
  const aud = auditarCuestionario(MODULO_PELO, PREGUNTAS_PELO);
  return {
    ...prog,
    estado: estadoPerfilCapilar(estado, datosGlobales),
    activo: estaActivo(estado, MODULO_PELO),
    dudas: dudasDelPerfil(estado, datosGlobales).length,
    compartidas: aud.compartidas.length,
    // ⚠️ Cero: ni calendario, ni inventario de productos, ni recomendaciones.
    // El enunciado lo prohíbe tres veces y conviene que se vea.
    recomendaciones: 0,
  };
}

export { NO_LO_SE, opcionesDe, nombreDeOpcion, auditarCuestionario };
