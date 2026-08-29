// ============================================================================
// EH · Fase 32/65 — RECOMENDACIONES GENERALES DE ESTILO ("💡 Ideas para ti")
//
// *"Esto es subjetivo. Son recomendaciones, no reglas."* Y su lista de lo que
// NO puede haber: *"❌ Tienes que hacer esto · ❌ Tu estilo correcto es este ·
// ❌ Puntuaciones que juzguen al usuario"*. Solo: *"💡 Podrías probar…"*
//
// ── LAS SEIS DECISIONES QUE GOBIERNAN ESTA FASE ────────────────────────────
//
// **1. ⚠️ EL MOTOR YA EXISTE.** `motorRecomendaciones.js` (F16, extraído de F9)
// trae `reglaAplicable` con su regla de oro, el descarte con motivos y
// caducidad, las guardadas, las vistas, la lista de palabras prohibidas y
// `ordenarYRecortar`. Esta fase **no escribe un cuarto `if`**, ni una segunda
// lista de palabras prohibidas, ni otro `descartarEn`. Lo que aporta es un
// **contexto que cruza todos los módulos**, que es justo lo que las tres
// anteriores no hacían: `recomendacionesPelo` mira el pelo, `recomendacionesPiel`
// la piel y `recomendacionesPerfumes` los perfumes; ésta mira **los siete temas
// del apartado 2 a la vez**.
//
// **2. ⚠️ OCULTAR LA PLAQUITA, DESACTIVAR EL SISTEMA Y "NUNCA" SON EL MISMO
// INTERRUPTOR.** El apartado 1 pide *"👁️ Ocultar"*, el 16 *"desde
// personalización se puede desactivar completamente"* y el 7 pone **"Nunca"**
// entre las frecuencias. Son tres formas de decir lo mismo, así que hay **una
// sola cosa guardada**: `frecuencia`. Es la lección de la F26 —*"antes de crear
// un segundo mecanismo, comprobar si el enunciado describe el mismo dos veces"*—.
//
// **3. ⚠️ NO SE REPITE LO QUE OTRO MÓDULO YA RECOMIENDA** (prueba 13: *"que no
// aparecen recomendaciones contradictorias"*). Skincare, Pelo y Perfumes tienen
// **su propio motor**, con datos más finos que los de aquí. Así que las ideas de
// esta fase son **cruzadas** —lo que un módulo no puede ver solo— y, cuando lo
// que toca es una idea de un módulo concreto, **llevan allí** en vez de
// escribirla otra vez. Tres reglas existen solo para eso, y lo dicen.
//
// **4. ⚠️ SOLO INFORMACIÓN QUE ÉL HA DADO** (apartado 9: *"no asumir
// características que no conocemos"*). Quien lo garantiza es `requiere` del
// motor: **una regla sin requisitos declarados no se aplica NUNCA**, porque se
// dispararía con el contexto vacío. Y un módulo apagado deja sus datos en `null`,
// que no es cero: no saber cuántas prendas tiene y saber que tiene cero son dos
// cosas distintas.
//
// **5. ⚠️ CADA ACCIÓN LLEVA A UN MÓDULO QUE YA EXISTE** (apartados 11 a 14:
// *"abrir el catálogo global"*, *"no crear otro sistema de outfits"*, *"utilizar
// el módulo correspondiente"*, *"abrir el Diario existente. No crear otro"*).
// Una regla declara su `accion` con destino y zona; quien navega es
// `navegarDesdeHoy`, la única navegación con enlace directo de la aplicación.
//
// **6. ⚠️ Y NO HAY UN SISTEMA DE FAVORITOS GLOBALES** (apartado 15). Lo que hay
// son favoritos **por módulo** —`prenda.favorita`, `perfume.favorito`,
// `gusto.favorito`— y las `guardadas` del motor de recomendaciones, que es
// exactamente "guardar una idea". Se usa esa, y **la pantalla dice dónde están**
// en vez de fingir un sistema global que no existe (regla 8).
// ============================================================================

import { todayISO } from './helpers';
import {
  normalizarEstiloHombre, guardarConfig, modulosActivos,
} from './estiloDeHombre';
import { MODULO_ANFITRION } from './miEstilo';
import {
  DEFAULT_RECOMENDACIONES, normalizarRecomendaciones, reglaAplicable, silenciadaEn,
  marcarVistasEn, descartarEn, deshacerDescarteEn, guardarEn, quitarGuardadaEn,
  ordenarYRecortar, tonoCorrecto, PALABRAS_PROHIBIDAS,
} from './motorRecomendaciones';
/* ⚠️ Cada dato se le pide a su módulo, con el `resumen…()` que ya existe. Ni un
   recuento nuevo, ni una copia (la misma frontera de la F29 y la F30). */
import { leerCampo } from './perfilEstilo';
import { resumenEstiloArmario } from './armarioEnEstiloHombre';
import { resumenRutinasPiel } from './rutinasPiel';
import { resumenPelo } from './rutinasPelo';
import { resumenBarba } from './perfilBarba';
import { resumenPerfumes } from './perfumes';
import { resumenAccesorios } from './accesorios';
import { resumenGustos } from './gustos';

/* ===========================================================================
   1 · LOS SIETE TEMAS (apartado 2)
   ===========================================================================
   *"🧴 Cuidado · 💇 Pelo · 🧔 Barba · 🌫️ Perfumes · 👕 Ropa · 🕶️ Accesorios ·
   ❤️ Gustos personales."* Los siete, con sus iconos, y **por su id de módulo**
   donde lo tienen: si alguien renombra uno del catálogo, aquí salta la prueba. */

export const TEMAS_IDEAS = [
  { id: 'cuidado', nombre: 'Cuidado', icono: '🧴', modulo: 'skincare' },
  { id: 'pelo', nombre: 'Pelo', icono: '💇', modulo: 'pelo' },
  { id: 'barba', nombre: 'Barba', icono: '🧔', modulo: 'barba' },
  { id: 'perfumes', nombre: 'Perfumes', icono: '🌫️', modulo: 'perfumes' },
  { id: 'ropa', nombre: 'Ropa', icono: '👕', modulo: 'estilo' },
  { id: 'accesorios', nombre: 'Accesorios', icono: '🕶️', modulo: 'accesorios' },
  { id: 'gustos', nombre: 'Gustos personales', icono: '❤️', modulo: 'gustos' },
];

export const temaIdea = (id) => TEMAS_IDEAS.find((t) => t.id === id) || null;

export const TEXTOS_IDEAS = {
  titulo: '💡 Ideas para ti',
  // Apartado 1 — y si no la quiere, se va.
  ocultar: '👁️ Ocultar',
  volver: 'Volver a ver las ideas',
  // Apartado 10 — el tono, dicho también en la propia pantalla.
  aviso: 'Son ideas, no reglas. Aquí no hay una forma correcta de vestir ni de cuidarse.',
  // Apartado 8.
  porque: 'Por qué aparece',
  // Apartado 15 — y dónde acaban, porque no hay favoritos globales (decisión 6).
  guardar: '❤️ Guardar',
  guardadas: 'Ideas guardadas',
  dondeSeGuardan: 'Las ideas que guardes se quedan aquí, en esta misma pantalla.',
  // Apartado 14.
  diario: '📝 Escribir en Diario',
  // Apartado 17.
  borrarHistorial: 'Borrar el historial de ideas',
  historialNoBorra: 'Solo se borra lo que se te ha enseñado y lo que dijiste de cada idea. Tus rutinas, productos y preferencias no se tocan.',
  // Cuando no hay ninguna que encaje: se dice, no se rellena (regla 8).
  sinIdeas: 'Ahora mismo no hay ninguna idea que encaje con lo que nos has contado.',
  apagado: 'Las ideas están apagadas. Puedes volver a encenderlas eligiendo una frecuencia.',
  verMas: 'Ver más',
};

/* ===========================================================================
   2 · LA FRECUENCIA (apartados 1, 7 y 16)
   ===========================================================================
   *"No bombardear al usuario. Configurar: 🔔 Frecuencia de sugerencias. Baja ·
   Normal · Alta · Nunca. Por defecto: Normal."*

   ⚠️ **Y es el interruptor entero de la fase** (decisión 2): "Nunca" es lo que
   hacen el *"👁️ Ocultar"* del apartado 1 y el *"desactivar completamente"* del
   16. Un booleano aparte para cada uno serían tres formas de apagar lo mismo,
   con la garantía de que un día dirían cosas distintas. */

export const FRECUENCIAS_IDEAS = [
  { id: 'baja', nombre: 'Baja', cuantas: 1 },
  { id: 'normal', nombre: 'Normal', cuantas: 3 },
  { id: 'alta', nombre: 'Alta', cuantas: 5 },
  // ⚠️ Cero, no "esconder": apagado y vacío son dos cosas (lección de la F25).
  { id: 'nunca', nombre: 'Nunca', cuantas: 0 },
];

export const FRECUENCIA_POR_DEFECTO = 'normal';

export const frecuenciaIdeas = (id) => FRECUENCIAS_IDEAS.find((f) => f.id === id) || null;

/* ===========================================================================
   3 · LAS REGLAS
   ===========================================================================
   ⚠️ Todas declaran `requiere`, **o no se aplican nunca** (motor, F16). Todas
   traen su `porque` entero —*"por qué aparece"*, apartado 8— y su `texto`
   empieza por una de las fórmulas del apartado 10.

   ⚠️ Y las tres que llevan a otro módulo (`cuidado_ideas_piel`, `pelo_ideas`,
   `perfumes_ideas`) están aquí **para NO repetir** lo que ese módulo ya
   recomienda con datos mejores (decisión 3). */

/** Las cuatro fórmulas del apartado 10, literales. Nunca *"debes"*. */
export const FORMULAS_IDEAS = ['Podrías', 'Podrían', 'Quizá te interese', 'Una opción sería', 'Si te gusta'];

const veces = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

export const REGLAS_IDEAS = [
  /* ── 👕 Ropa ─────────────────────────────────────────────────────────── */
  {
    id: 'ropa_primer_outfit',
    tema: 'ropa', peso: 3,
    titulo: 'Tu primer outfit',
    texto: 'Podrías montar un outfit con lo que ya tienes apuntado.',
    requiere: ['prendas', 'outfits'],
    cuando: (c) => c.prendas >= 5 && c.outfits === 0,
    porque: (c) => `Lo hemos pensado porque tienes ${veces(c.prendas, 'prenda apuntada', 'prendas apuntadas')} y todavía ningún outfit.`,
    accion: { etiqueta: 'Abrir Armario', destino: 'armario', zona: null },
  },
  {
    id: 'ropa_sin_estilos',
    tema: 'ropa', peso: 2,
    titulo: 'Qué estilos te gustan',
    texto: 'Podrías decirnos qué estilos te gustan: las ideas se afinan solas.',
    requiere: ['prendas'],
    cuando: (c) => c.prendas >= 3 && c.estilosFavoritos.length === 0,
    porque: (c) => `Lo hemos pensado porque ya tienes ${veces(c.prendas, 'prenda', 'prendas')} y todavía no nos has contado qué estilos te gustan.`,
    accion: { etiqueta: 'Abrir Mi estilo', destino: 'miEstilo', zona: null },
  },

  /* ── 🧴 Cuidado ──────────────────────────────────────────────────────── */
  {
    id: 'cuidado_sin_rutina',
    tema: 'cuidado', peso: 2,
    titulo: 'Una rutina corta',
    texto: 'Podrías empezar por una rutina de dos pasos y ampliarla si te apetece.',
    requiere: ['rutinasPiel'],
    cuando: (c) => c.rutinasPiel === 0,
    porque: () => 'Lo hemos pensado porque tienes Skincare encendido y todavía no has creado ninguna rutina.',
    accion: { etiqueta: 'Abrir rutina', destino: 'skincare', zona: 'rutina' },
  },
  {
    id: 'cuidado_ideas_piel',
    tema: 'cuidado', peso: 1,
    titulo: 'Ideas hechas a tu piel',
    texto: 'Quizá te interese mirar las ideas que tiene Skincare: allí son más concretas que aquí.',
    requiere: ['rutinasPiel'],
    cuando: (c) => c.rutinasPiel > 0,
    porque: (c) => `Lo hemos pensado porque ya tienes ${veces(c.rutinasPiel, 'rutina de piel', 'rutinas de piel')}, y ese módulo sabe de tu piel cosas que aquí no miramos.`,
    accion: { etiqueta: 'Abrir Skincare', destino: 'skincare', zona: 'recomendaciones' },
  },
  {
    id: 'cuidado_y_pelo',
    tema: 'cuidado', peso: 3, cruzada: true,
    titulo: 'Lo mismo, con el pelo',
    texto: 'Podrías montar también una rutina de pelo, ya que la de piel la tienes cogida.',
    requiere: ['rutinasPiel', 'rutinasPelo'],
    cuando: (c) => c.rutinasPiel > 0 && c.rutinasPelo === 0,
    porque: (c) => `Lo hemos pensado porque tienes ${veces(c.rutinasPiel, 'rutina de piel', 'rutinas de piel')} y ninguna de pelo.`,
    accion: { etiqueta: 'Abrir rutina', destino: 'pelo', zona: 'rutina' },
  },

  /* ── 💇 Pelo ─────────────────────────────────────────────────────────── */
  {
    id: 'pelo_sin_productos',
    tema: 'pelo', peso: 2,
    titulo: 'Apuntar lo que usas',
    texto: 'Podrías apuntar los productos que ya usas con el pelo.',
    requiere: ['rutinasPelo', 'productosPelo'],
    cuando: (c) => c.rutinasPelo > 0 && c.productosPelo === 0,
    porque: (c) => `Lo hemos pensado porque tienes ${veces(c.rutinasPelo, 'rutina de pelo', 'rutinas de pelo')} y ningún producto apuntado.`,
    accion: { etiqueta: 'Abrir Pelo', destino: 'pelo', zona: 'productos' },
  },
  {
    id: 'pelo_ideas',
    tema: 'pelo', peso: 1,
    titulo: 'Ideas hechas a tu pelo',
    texto: 'Quizá te interese mirar las ideas que tiene Pelo, hechas con tu perfil capilar.',
    requiere: ['rutinasPelo'],
    cuando: (c) => c.rutinasPelo > 0,
    porque: () => 'Lo hemos pensado porque ya has configurado tu pelo, y ese módulo tiene ideas hechas con eso.',
    accion: { etiqueta: 'Abrir Pelo', destino: 'pelo', zona: 'recomendaciones' },
  },

  /* ── 🧔 Barba ────────────────────────────────────────────────────────── */
  {
    id: 'barba_sin_productos',
    tema: 'barba', peso: 2,
    titulo: 'Lo que usas al afeitarte',
    texto: 'Podrías apuntar lo que usas al afeitarte, para tenerlo todo junto.',
    requiere: ['gestionaBarba', 'productosBarba'],
    cuando: (c) => c.gestionaBarba === true && c.productosBarba === 0,
    porque: () => 'Lo hemos pensado porque has configurado tu barba y todavía no has apuntado ningún producto.',
    accion: { etiqueta: 'Abrir Barba', destino: 'barba', zona: 'productos' },
  },
  {
    id: 'barba_y_piel',
    tema: 'barba', peso: 3, cruzada: true,
    titulo: 'Después del afeitado',
    texto: 'Podrías apuntar en tu rutina de piel el paso de después del afeitado.',
    requiere: ['gestionaBarba', 'rutinasPiel'],
    cuando: (c) => c.gestionaBarba === true && c.rutinasPiel > 0,
    porque: () => 'Lo hemos pensado porque gestionas la barba y ya tienes una rutina de piel donde encaja.',
    accion: { etiqueta: 'Abrir rutina', destino: 'skincare', zona: 'rutina' },
  },

  /* ── 🌫️ Perfumes ─────────────────────────────────────────────────────── */
  {
    id: 'perfumes_por_ocasion',
    tema: 'perfumes', peso: 2,
    titulo: 'Cuál para cada momento',
    texto: 'Podrías decir cuál te pones en cada ocasión, y elegir deja de ser una decisión.',
    requiere: ['perfumes', 'ocasionesAsignadas'],
    cuando: (c) => c.perfumes >= 2 && c.ocasionesAsignadas === 0,
    porque: (c) => `Lo hemos pensado porque tienes ${veces(c.perfumes, 'perfume', 'perfumes')} y ninguno asignado a una ocasión.`,
    accion: { etiqueta: 'Abrir Perfumes', destino: 'perfumes', zona: null },
  },
  {
    id: 'perfumes_ideas',
    tema: 'perfumes', peso: 1,
    titulo: 'Ideas con tu colección',
    texto: 'Quizá te interese mirar las ideas que tiene Perfumes, que miran tu colección entera.',
    requiere: ['perfumes'],
    cuando: (c) => c.perfumes >= 3,
    porque: (c) => `Lo hemos pensado porque ya tienes ${veces(c.perfumes, 'perfume', 'perfumes')} apuntados.`,
    accion: { etiqueta: 'Abrir Perfumes', destino: 'perfumes', zona: 'recomendaciones' },
  },

  /* ── 🕶️ Accesorios ───────────────────────────────────────────────────── */
  {
    id: 'accesorios_con_outfit',
    tema: 'accesorios', peso: 3, cruzada: true,
    titulo: 'Un detalle con el outfit',
    texto: 'Podrías añadir uno de tus accesorios a un outfit que ya tengas montado.',
    requiere: ['accesorios', 'outfits'],
    cuando: (c) => c.accesorios > 0 && c.outfits > 0,
    porque: (c) => `Lo hemos pensado porque tienes ${veces(c.accesorios, 'accesorio', 'accesorios')} y ${veces(c.outfits, 'outfit', 'outfits')}.`,
    accion: { etiqueta: 'Abrir Armario', destino: 'armario', zona: null },
  },
  {
    id: 'accesorios_vacio',
    tema: 'accesorios', peso: 1,
    titulo: 'Lo que ya llevas puesto',
    texto: 'Podrías apuntar el reloj o las gafas que ya usas: cuentan como accesorios.',
    requiere: ['accesorios'],
    cuando: (c) => c.accesorios === 0,
    porque: () => 'Lo hemos pensado porque tienes Accesorios encendido y todavía no has apuntado ninguno.',
    accion: { etiqueta: 'Abrir Accesorios', destino: 'accesorios', zona: null },
  },

  /* ── ❤️ Gustos personales ────────────────────────────────────────────── */
  {
    id: 'gustos_por_hacer',
    tema: 'gustos', peso: 2,
    titulo: 'Ponerle fecha a algo',
    texto: 'Podrías ponerle fecha a una de las cosas que quieres hacer.',
    requiere: ['porHacer'],
    cuando: (c) => c.porHacer > 0,
    porque: (c) => `Lo hemos pensado porque tienes ${veces(c.porHacer, 'cosa apuntada', 'cosas apuntadas')} en "Quiero hacer".`,
    accion: { etiqueta: 'Abrir Mis gustos', destino: 'gustos', zona: null },
  },
  {
    id: 'gustos_a_objetivo',
    tema: 'gustos', peso: 3, cruzada: true,
    titulo: 'Convertirlo en objetivo',
    texto: 'Una opción sería convertir una de esas cosas en un objetivo, si te apetece seguirla de cerca.',
    requiere: ['porHacer', 'objetivos'],
    cuando: (c) => c.porHacer > 0 && c.objetivos === 0,
    porque: (c) => `Lo hemos pensado porque tienes ${veces(c.porHacer, 'cosa', 'cosas')} en "Quiero hacer" y ningún objetivo puesto.`,
    accion: { etiqueta: 'Abrir Objetivos', destino: 'objetivos', zona: null },
  },
];

export const reglaIdea = (id) => REGLAS_IDEAS.find((r) => r.id === id) || null;
export const IDS_REGLAS_IDEAS = REGLAS_IDEAS.map((r) => r.id);

/* ===========================================================================
   4 · EL CONTEXTO (apartado 9)
   ===========================================================================
   *"Utilizar únicamente información que el usuario haya proporcionado:
   preferencias, módulos activos, productos, rutinas, gustos, objetivos. **No
   asumir características que no conocemos.**"*

   ⚠️ **Un módulo apagado deja su dato en `null`, y `null` no es cero.** Sin eso,
   Barba apagada contaría como "cero productos de barba" y dispararía una idea
   sobre algo que él ha decidido no usar. Es la diferencia entre "no lo sé" y
   "sé que no tiene ninguno", y `tieneDato()` del motor la respeta. */

export function contextoIdeas(estado, { armario = null, datosGlobales = {}, objetivos = null } = {}) {
  const e = normalizarEstiloHombre(estado);
  const activos = modulosActivos(e).map((m) => m.id);
  const si = (id, valor) => (activos.includes(id) ? valor() : null);

  const arm = () => resumenEstiloArmario(e, armario, datosGlobales) || {};
  const acc = () => resumenAccesorios(e, armario || { prendas: [], outfits: [], usos: [] });

  return {
    modulos: activos,
    // 👕 Ropa
    prendas: si('estilo', () => arm().total ?? 0),
    outfits: si('estilo', () => arm().outfits ?? 0),
    estilosFavoritos: leerCampo(e, 'estilosFavoritos', datosGlobales).valores,
    // 🧴 Cuidado
    rutinasPiel: si('skincare', () => resumenRutinasPiel(e).rutinas),
    // 💇 Pelo
    rutinasPelo: si('pelo', () => resumenPelo(e).rutinas),
    productosPelo: si('pelo', () => resumenPelo(e).productos),
    // 🧔 Barba
    gestionaBarba: si('barba', () => resumenBarba(e, datosGlobales).estado === 'configurado'),
    productosBarba: si('barba', () => resumenBarba(e, datosGlobales).productos),
    // 🌫️ Perfumes
    perfumes: si('perfumes', () => resumenPerfumes(e, datosGlobales).coleccion),
    ocasionesAsignadas: si('perfumes', () => resumenPerfumes(e, datosGlobales).ocasionesAsignadas),
    // 🕶️ Accesorios
    accesorios: si('accesorios', () => acc().accesorios),
    // ❤️ Gustos
    porHacer: si('gustos', () => resumenGustos(e, datosGlobales).hacer),
    /* ⚠️ Los objetivos son del sistema global (F28): si no llegan, es `null` —
       no cero. Recomendar "todavía no tienes objetivos" sin haberlos mirado
       sería asumir una característica que no conocemos (apartado 9). */
    objetivos: Array.isArray(objetivos?.objetivos)
      ? objetivos.objetivos.filter((o) => !o.cumplido).length
      : (Array.isArray(objetivos) ? objetivos.length : null),
  };
}

/* ===========================================================================
   5 · LAS ACCIONES (apartados 4, 5 y 6)
   ===========================================================================
   *"Me interesa · No me interesa · Ya lo hago. Esto permite aprender de las
   preferencias sin IA."*

   ⚠️ **"Me interesa" NO silencia**: es lo contrario de un descarte. Se guarda,
   para que la idea pese más y siga saliendo, que es lo que él acaba de pedir.
   ⚠️ **"No me interesa" evita las equivalentes** (apartado 5: *"además, evitar
   recomendaciones equivalentes cuando tenga sentido"*), y "tenga sentido" son
   las del mismo tema: es el `porTema` que la F16 ya usa para Skincare. */

export const ACCIONES_IDEA = [
  { id: 'interesa', nombre: 'Me interesa', icono: '👍', silencia: false },
  { id: 'no_interesa', nombre: 'No me interesa', icono: '❌', silencia: true, dias: 90, porTema: true },
  { id: 'ya_lo_hago', nombre: 'Ya lo hago', icono: '✅', silencia: true, dias: 180 },
];

export const accionIdea = (id) => ACCIONES_IDEA.find((a) => a.id === id) || null;

/** Los que el motor conoce como motivos de descarte: los que silencian. */
export const MOTIVOS_IDEAS = ACCIONES_IDEA.filter((a) => a.silencia).map((a) => ({ id: a.id, nombre: a.nombre, dias: a.dias }));

export const DIAS_SILENCIO_IDEAS = Object.fromEntries(MOTIVOS_IDEAS.map((m) => [m.id, m.dias]));

/* ===========================================================================
   6 · EL ALMACÉN (apartados 3 y 17)
   ===========================================================================
   ⚠️ Va en la `config` del módulo anfitrión, junto a "Mi estilo" (F29) y la
   pantalla (F30/F31): esta fase cruza todos los módulos, así que no es de
   ninguno. Y **`recomendaciones` es lo del motor, tal cual**: ni un formato
   propio. */

export const DEFAULT_IDEAS = {
  frecuencia: FRECUENCIA_POR_DEFECTO,
  recomendaciones: DEFAULT_RECOMENDACIONES,
};

/**
 * ⚠️ **EH F33, apartado 6** — *"utilizar el sistema global de favoritos. **No
 * crear una segunda lista de guardados**."* Descubrir guarda **en esta misma
 * lista**, así que su normalizador tiene que aceptar sus ids, o el siguiente
 * guardado se los llevaría (regla 5): sería la vigesimoséptima vez.
 *
 * El prefijo vive aquí y no en `descubrir.js` porque **la dependencia va en un
 * solo sentido**: Descubrir importa este archivo, no al revés. Importarlo desde
 * aquí para leer sus ids sería un ciclo.
 */
export const PREFIJO_DESCUBRIR = 'desc_';

export const idGuardable = (id) =>
  !!reglaIdea(id) || (typeof id === 'string' && id.startsWith(PREFIJO_DESCUBRIR) && id.length > PREFIJO_DESCUBRIR.length);

export function normalizarIdeas(guardado) {
  const g = guardado && typeof guardado === 'object' ? guardado : {};
  const propias = normalizarRecomendaciones(g.recomendaciones, {
    ids: IDS_REGLAS_IDEAS, motivos: MOTIVOS_IDEAS,
  });
  /* ⚠️ `feedback` y `vistas` son de las ideas de la F32 y se validan contra su
     catálogo. `guardadas`, en cambio, es **la lista compartida**: admite también
     las tarjetas de Descubrir. Cada sistema resuelve las suyas al pintarlas. */
  const todas = normalizarRecomendaciones(g.recomendaciones, { ids: null, motivos: MOTIVOS_IDEAS });
  return {
    frecuencia: frecuenciaIdeas(g.frecuencia) ? g.frecuencia : FRECUENCIA_POR_DEFECTO,
    recomendaciones: {
      ...propias,
      guardadas: todas.guardadas.filter((x) => idGuardable(x.reglaId)),
    },
  };
}

export const datosIdeas = (estado) => {
  const e = normalizarEstiloHombre(estado);
  return normalizarIdeas(e.modulos.find((m) => m.id === MODULO_ANFITRION)?.config?.ideas);
};

const escribir = (estado, datos) => guardarConfig(estado, MODULO_ANFITRION, { ideas: datos });

const escribirRecs = (estado, recs) => escribir(estado, { ...datosIdeas(estado), recomendaciones: recs });

/* ── Apartados 1, 7 y 16 — el único interruptor ──────────────────────────── */

export function cambiarFrecuencia(estado, id) {
  if (!frecuenciaIdeas(id)) return normalizarEstiloHombre(estado);
  return escribir(estado, { ...datosIdeas(estado), frecuencia: id });
}

/** *"👁️ Ocultar"* (apartado 1) y *"desactivar completamente"* (16) son esto. */
export const ocultarIdeas = (estado) => cambiarFrecuencia(estado, 'nunca');

/** Y volver es elegir una frecuencia; sin decir cuál, la de por defecto. */
export const mostrarIdeas = (estado, id = FRECUENCIA_POR_DEFECTO) =>
  cambiarFrecuencia(estado, frecuenciaIdeas(id) && id !== 'nunca' ? id : FRECUENCIA_POR_DEFECTO);

export const ideasApagadas = (estado) => datosIdeas(estado).frecuencia === 'nunca';

/* ===========================================================================
   7 · ¿ESTÁ CALLADA? (apartados 3, 5 y 6)
   ===========================================================================
   ⚠️ *"No repetirla continuamente"* (apartado 3) y *"evitar recomendaciones
   equivalentes"* (apartado 5). Lo primero son las `vistas` del motor; lo
   segundo, el descarte por tema. */

/** Cuántos días se calla una idea solo por haberse enseñado ya. */
export const DIAS_TRAS_VERLA = 7;

export function silenciadaIdea(estado, reglaId, { hoy = todayISO() } = {}) {
  const recs = datosIdeas(estado).recomendaciones;
  const propia = silenciadaEn(recs, reglaId, { hoy, dias: DIAS_SILENCIO_IDEAS, paraSiempre: [] });
  if (propia.silenciada) return propia;

  /* ⚠️ "No me interesa" calla también las del mismo tema, que es lo que
     "equivalentes" significa aquí. Sin esto, descartar una haría salir otra
     igual al día siguiente y el botón no significaría nada. */
  const tema = reglaIdea(reglaId)?.tema;
  const porTema = recs.feedback.find(
    (f) => accionIdea(f.motivo)?.porTema && reglaIdea(f.reglaId)?.tema === tema,
  );
  if (porTema) {
    const s = silenciadaEn(recs, porTema.reglaId, { hoy, dias: DIAS_SILENCIO_IDEAS, paraSiempre: [] });
    if (s.silenciada) return { ...s, porTema: true };
  }
  return propia;
}

/* ===========================================================================
   8 · RECOMENDAR (apartados 1, 2, 3, 8 y 10)
   ===========================================================================
   ⚠️ **No escribe nada**: mostrar y registrar que se ha mostrado son dos
   llamadas distintas, para que repintar la pantalla no ensucie el historial.
   Es la misma regla que la F9 y la F16. */

export function recomendarIdeas(estado, { armario = null, datosGlobales = {}, objetivos = null, hoy = todayISO(), limite = null } = {}) {
  const e = normalizarEstiloHombre(estado);
  const d = datosIdeas(e);
  const frec = frecuenciaIdeas(d.frecuencia);
  const guardadas = d.recomendaciones.guardadas
    .map((g) => ({ ...reglaIdea(g.reglaId), guardadaEl: g.fecha }))
    .filter((x) => !!x.id);

  // Apartado 7 y 16 — "Nunca" es cero. Y las guardadas siguen siendo suyas.
  if (frec.cuantas === 0) {
    return {
      apagada: true, frecuencia: d.frecuencia, total: 0,
      ideas: [], hayMas: false, guardadas, texto: TEXTOS_IDEAS.apagado,
    };
  }

  const ctx = contextoIdeas(e, { armario, datosGlobales, objetivos });
  const candidatas = REGLAS_IDEAS
    .filter((r) => reglaAplicable(r, ctx))
    // ⚠️ Apartado 3 — lo enseñado hace poco no se repite.
    .filter((r) => !silenciadaIdea(e, r.id, { hoy }).silenciada)
    .filter((r) => {
      const v = d.recomendaciones.vistas.find((x) => x.reglaId === r.id);
      if (!v) return true;
      return (new Date(`${hoy}T00:00:00`) - new Date(`${v.fecha}T00:00:00`)) / 86400000 >= DIAS_TRAS_VERLA;
    })
    .map((r) => {
      let porque = '';
      try { porque = r.porque(ctx) || ''; } catch { porque = ''; }
      return {
        id: r.id,
        tema: r.tema,
        temaNombre: temaIdea(r.tema)?.nombre || '',
        icono: temaIdea(r.tema)?.icono || '💡',
        titulo: r.titulo,
        texto: r.texto,
        // Apartado 8 — *"cada recomendación DEBE incluir por qué aparece"*.
        porque,
        accion: r.accion || null,
        cruzada: r.cruzada === true,
        peso: r.peso || 0,
        temas: [r.tema],
        guardada: d.recomendaciones.guardadas.some((g) => g.reglaId === r.id),
      };
    })
    /* ⚠️ **La que no sabe explicarse no se propone** (apartado 8, y la lección
       de la F25). Un motivo vacío convierte una idea en una nota suelta. */
    .filter((x) => x.porque.length > 0);

  const { total, recomendaciones, hayMas } = ordenarYRecortar(candidatas, { limite: limite || frec.cuantas });
  return {
    apagada: false,
    frecuencia: d.frecuencia,
    total,
    ideas: recomendaciones,
    hayMas,
    guardadas,
    texto: total === 0 ? TEXTOS_IDEAS.sinIdeas : '',
  };
}

/* ===========================================================================
   9 · REGISTRAR LO QUE HACE CON UNA IDEA (apartados 4, 5, 6 y 15)
   =========================================================================== */

export function marcarVistas(estado, ids = [], { hoy = todayISO() } = {}) {
  const validos = ids.filter((id) => !!reglaIdea(id));
  if (validos.length === 0) return normalizarEstiloHombre(estado);
  return escribirRecs(estado, marcarVistasEn(datosIdeas(estado).recomendaciones, validos, hoy));
}

/**
 * Las tres del apartado 4. ⚠️ **"Me interesa" no silencia**: guarda la idea, que
 * es lo que él está pidiendo al pulsarlo. Las otras dos sí, con sus plazos.
 */
export function responderIdea(estado, reglaId, accionId, { hoy = todayISO() } = {}) {
  const e = normalizarEstiloHombre(estado);
  if (!reglaIdea(reglaId)) return { estado: e, error: 'Esa idea no existe.' };
  const a = accionIdea(accionId);
  if (!a) return { estado: e, error: 'Esa respuesta no existe.' };
  const recs = datosIdeas(e).recomendaciones;
  if (!a.silencia) return { estado: escribirRecs(e, guardarEn(recs, reglaId, hoy)), error: null };
  return { estado: escribirRecs(e, descartarEn(recs, reglaId, accionId, hoy)), error: null };
}

/** ⚠️ Todo descarte se puede deshacer: un toque no condena una idea. */
export const deshacerRespuesta = (estado, reglaId) =>
  escribirRecs(estado, deshacerDescarteEn(datosIdeas(estado).recomendaciones, reglaId));

/* Apartado 15 — ❤️ Guardar. Sin sistema de favoritos globales al que enchufarse
   (decisión 6), se usan las `guardadas` del motor, que es lo que ya existía.

   ⚠️ **Y es UNA sola lista** (F33, apartado 6: *"no crear una segunda lista de
   guardados"*): estas tres funciones son la puerta, y Descubrir entra por ella. */

export const listaDeGuardados = (estado) => datosIdeas(estado).recomendaciones.guardadas;

export const estaGuardado = (estado, id) => listaDeGuardados(estado).some((g) => g.reglaId === id);

export const guardarEnLista = (estado, id, { hoy = todayISO() } = {}) =>
  (idGuardable(id)
    ? escribirRecs(estado, guardarEn(datosIdeas(estado).recomendaciones, id, hoy))
    : normalizarEstiloHombre(estado));

export const quitarDeLista = (estado, id) =>
  escribirRecs(estado, quitarGuardadaEn(datosIdeas(estado).recomendaciones, id));

export const guardarIdea = (estado, reglaId, opciones) =>
  (reglaIdea(reglaId) ? guardarEnLista(estado, reglaId, opciones) : normalizarEstiloHombre(estado));

export const quitarGuardada = (estado, reglaId) => quitarDeLista(estado, reglaId);

/* ===========================================================================
   10 · BORRAR EL HISTORIAL (apartado 17)
   ===========================================================================
   *"El usuario podrá borrar: historial de recomendaciones. **Sin afectar a sus
   rutinas, productos o preferencias.**"*

   ⚠️ Duodécimo `aplicarPlan` del proyecto: **sin `confirmado` no borra nada**.
   ⚠️ Y **lo guardado NO es historial**: lo guardó él a propósito. Se queda, y la
   pantalla lo dice — borrarlo "de paso" sería decidir por él. */

export function borrarHistorialIdeas(estado, { confirmado = false } = {}) {
  const e = normalizarEstiloHombre(estado);
  const d = datosIdeas(e);
  if (!confirmado) {
    return {
      estado: e,
      aplicado: false,
      aviso: {
        titulo: TEXTOS_IDEAS.borrarHistorial,
        texto: TEXTOS_IDEAS.historialNoBorra,
        guardadas: d.recomendaciones.guardadas.length,
        confirmar: 'Borrar',
        cancelar: 'Cancelar',
      },
    };
  }
  return {
    estado: escribirRecs(e, { ...d.recomendaciones, feedback: [], vistas: [] }),
    aplicado: true,
    aviso: null,
  };
}

/* ===========================================================================
   11 · RESUMEN, AUDITORÍA, TEXTOS Y PANEL
   =========================================================================== */

export function resumenIdeas(estado, opciones = {}) {
  const d = datosIdeas(estado);
  const r = recomendarIdeas(estado, opciones);
  return {
    frecuencia: d.frecuencia,
    apagada: r.apagada,
    // ⚠️ Apagada devuelve `null`, no 0: son dos cosas (lección de la F25).
    ideas: r.apagada ? null : r.total,
    guardadas: d.recomendaciones.guardadas.length,
    vistas: d.recomendaciones.vistas.length,
    respondidas: d.recomendaciones.feedback.length,
    reglas: REGLAS_IDEAS.length,
    temas: TEMAS_IDEAS.length,
  };
}

/** La línea de la plaquita, para `LINEAS_DE_PLAQUITA` y la portada. */
export function lineaIdeas(estado, opciones = {}) {
  const r = recomendarIdeas(estado, opciones);
  if (r.apagada) return null;
  if (r.total === 0) return null;
  return `${r.total} ${r.total === 1 ? 'idea' : 'ideas'}`;
}

export function auditarIdeas() {
  return {
    // Apartado 1 — nunca una puntuación que juzgue.
    puntuaciones: 0,
    // Decisión 1 — ni un motor nuevo: el de la F16.
    motoresNuevos: 0,
    // Apartados 11 a 14 — ni un catálogo, ni un armario, ni un diario nuevos.
    catalogosNuevos: 0,
    armariosNuevos: 0,
    diariosNuevos: 0,
    // Decisión 2 — un solo interruptor para el apartado 1, el 7 y el 16.
    interruptores: 1,
    // Apartado 9 — reglas sin `requiere`, que no se aplicarían nunca.
    reglasSinRequisitos: REGLAS_IDEAS.filter((r) => !Array.isArray(r.requiere) || r.requiere.length === 0).length,
    // Apartado 8 — reglas sin explicación.
    reglasSinPorque: REGLAS_IDEAS.filter((r) => typeof r.porque !== 'function').length,
    // Apartado 10 — textos con una palabra prohibida.
    textosConTonoMalo: textosDeIdeas().filter((t) => !tonoCorrecto(t)).length,
    reglas: REGLAS_IDEAS.length,
    temas: TEMAS_IDEAS.length,
    // Lo que guarda: la frecuencia y lo del motor.
    datosGuardados: Object.keys(DEFAULT_IDEAS),
  };
}

/** ⚠️ Solo los textos de las IDEAS: son los que el apartado 10 gobierna. */
export function textosDeIdeas() {
  return [
    ...REGLAS_IDEAS.map((r) => r.titulo),
    ...REGLAS_IDEAS.map((r) => r.texto),
    ...REGLAS_IDEAS.map((r) => r.accion?.etiqueta).filter(Boolean),
  ];
}

export function panelIdeas(estado, opciones = {}) {
  const d = datosIdeas(estado);
  const r = recomendarIdeas(estado, opciones);
  return {
    titulo: TEXTOS_IDEAS.titulo,
    aviso: TEXTOS_IDEAS.aviso,
    ...r,
    frecuencias: FRECUENCIAS_IDEAS,
    acciones: ACCIONES_IDEA,
    temas: TEMAS_IDEAS,
    // Apartado 15 — y dónde acaban, porque no hay favoritos globales.
    dondeSeGuardan: TEXTOS_IDEAS.dondeSeGuardan,
    // Apartado 17.
    puedeBorrarHistorial: d.recomendaciones.vistas.length + d.recomendaciones.feedback.length > 0,
    resumen: resumenIdeas(estado, opciones),
  };
}

export { PALABRAS_PROHIBIDAS, tonoCorrecto };
