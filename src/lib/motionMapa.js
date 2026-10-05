import { ANIMACIONES_HC, MAX_ANIMACION_MS } from './pulidoHC';
import { tokensRaiz, resolverDuraciones, TOPES_ESCALA } from './motion';

/* ═══════════════════════════════════════════════════════════════════════════
   MOTION SYSTEM · FASE 0 — AUDITORÍA TOTAL, ARQUITECTURA Y PLAN MAESTRO
   ═══════════════════════════════════════════════════════════════════════════

   Josué pasó el 2026-10-04 un documento de 17 913 líneas con 21 fases para
   construir *"el sistema de movimiento de Jos Style"*, y las fases venían
   desordenadas (la 16 abre el archivo y la 0 está en la línea 4046). El índice
   con la línea de cada una está en `docs/13_MOTION_SYSTEM_ORDEN.md`.

   La F0 pide, antes de animar nada, **entender lo que hay** (apartado 1: *"No
   asumas cómo funciona. Inspecciona realmente"*) y dejarlo escrito:
   inventario, MOTION_MAP, jerarquía, presupuesto, lenguaje por contexto,
   tokens, ajustes, persistencia y plan. Eso es este archivo, y su regla es la
   de siempre de este proyecto: **lo que dice se comprueba contra los archivos
   de verdad**. `escanearCss` y `escanearVista` leen `index.css` y las vistas, y
   `auditarMotion` cruza lo que encuentran con el mapa: una animación nueva que
   nadie haya mapeado pone la suite roja. Así la regla permanente del apartado
   19 —*"TODO LO NUEVO HEREDA MOTION"*— no es una frase: es una prueba.

   🚨 **LO QUE YA EXISTÍA, Y NO SE TIRA** (apartado 1: *"Respeta lo que ya
   funciona"*). JosStyle ya tiene un lenguaje de movimiento, aunque nadie lo
   había llamado así:
     · **una sola curva**, `--ease-premium` (Fase N2), que usan las 35 reglas
       animadas de `index.css`;
     · **un catálogo de animaciones**, `ANIMACIONES_HC` (E3 F14, ampliado en
       la FIT F37), con su duración comprobada contra el CSS;
     · **una escalera de escalas al pulsar** en `ui.jsx` (EH F50);
     · **dos reglas globales de movimiento reducido**: la del sistema y la de
       Ajustes (`data-reducir-movimiento`, `data-animaciones`).
   El mapa de esta fase **se apoya en `ANIMACIONES_HC`**: cada entrada que
   corresponde a una de sus animaciones lo dice (`catalogo`), y la duración de
   las dos se compara. Un segundo catálogo con otras duraciones sería el fallo
   que la FIT F37 ya cazó (420 frente a 340).

   ⚠️ **ESTA FASE NO CAMBIA NINGUNA PANTALLA.** Es el mapa y el plan. Lo que
   encuentra roto lo deja escrito con la fase que lo arregla (`HALLAZGOS_F0`),
   y la deuda que mide no puede crecer desde hoy (`DEUDA_F0`).
   =========================================================================== */

const lista = (x) => (Array.isArray(x) ? x : []);

/* ───────────────────────────────────────────────────────────────────────────
   1 · LA JERARQUÍA (apartado 4)

   *"No todo debe tener la misma intensidad."* Seis niveles, y cada uno dice
   hasta dónde puede llegar: la duración máxima sale de lo que JosStyle ya usa
   en cada clase de movimiento (medido en `index.css`), no de un número nuevo.
   ─────────────────────────────────────────────────────────────────────────── */
export const NIVELES_MOTION = [
  { nivel: 0, id: 'static', nombre: 'Estático', maxMs: 0, uso: 'Lo que no comunica nada al moverse: texto, etiquetas, iconos decorativos, la estructura de una pantalla.' },
  { nivel: 1, id: 'micro', nombre: 'Micro', maxMs: 220, uso: 'Respuesta inmediata al dedo: pulsar, marcar, cambiar un interruptor, rotar un chevron. Casi imperceptible: se nota si falta, no si está.' },
  { nivel: 2, id: 'soft', nombre: 'Suave', maxMs: 340, uso: 'Algo aparece, se va o cambia de sitio: una pantalla, una tarjeta, un aviso, una hoja, una barra que avanza.' },
  { nivel: 3, id: 'premium', nombre: 'Protagonista', maxMs: 420, uso: 'El movimiento ES la información: la portada de un área que entra en cascada, el progreso de un objetivo, un mes que cambia.' },
  { nivel: 4, id: 'hero', nombre: 'Momento', maxMs: 620, uso: 'Algo importante acaba de pasar y merece verse: subir de rango, terminar un entrenamiento, una racha que sube.' },
  { nivel: 5, id: 'signature', nombre: 'Firma', maxMs: 900, uso: 'Lo único que es solo de JosStyle. Muy poco: el «+1» de una racha. Si aparece en todas partes deja de ser una firma.' },
];

export const nivelMotion = (n) => NIVELES_MOTION.find((x) => x.nivel === n) || null;

/* ───────────────────────────────────────────────────────────────────────────
   2 · EL PRESUPUESTO (apartado 5)

   *"MUCHO DETALLE ≠ MUCHO MOVIMIENTO."* Cada límite sale de lo que ya hay y
   funciona: la portada de un área anima su cabecera y cinco tarjetas a la vez
   (seis elementos) con 80 ms entre una y otra, y eso es el tope de lo que se
   permite, no el punto de partida.
   ─────────────────────────────────────────────────────────────────────────── */
export const PRESUPUESTO_MOTION = {
  simultaneosMax: 6,
  staggerPasoMaxMs: 80,
  staggerElementosMax: 6,
  staggerTotalMaxMs: 400,
  duracionNormalMaxMs: 340,
  duracionTransicionMaxMs: 420,
  /* El tope de una animación que no se repite es el de la E3 F14: un solo
     número para toda la aplicación. */
  duracionAbsolutaMaxMs: MAX_ANIMACION_MS,
  reglas: [
    { cuando: 'spring', si: 'Solo cuando el movimiento lo provoca el dedo y tiene que soltarse con su velocidad: arrastrar una hoja, soltar un deslizamiento.', no: 'Nunca en una entrada o salida que no ha tocado nadie: ahí un rebote es teatro.' },
    { cuando: 'blur', si: 'Fijo, como material: la barra de abajo, una tarjeta de cristal, el velo de una hoja.', no: 'Nunca animado (es lo más caro que hay en un iPhone) y nunca una franja que tape el fondo sin motivo —la v3.129.1 quitó la de los hubs—.' },
    /* 🔓 MS F1 — la F0 escribió un solo techo (1,03) y la llama de una racha late a 1,35 desde la
       E3 F2: las dos cosas son ciertas para cosas distintas. Una SUPERFICIE no pasa de 1,03 ni entra
       desde menos de 0,95; una MARCA pequeña (llama, ✓, estrella) puede latir hasta 1,35, porque
       mide 16 px y el pulso es el mensaje. Los topes viven en `TOPES_ESCALA` (motion.js). */
    { cuando: 'scale', si: `Pulsar (0,90–0,99, la escalera de \`ui.jsx\`); una superficie entra desde ${TOPES_ESCALA.superficie.min} como poco y crece hasta ${TOPES_ESCALA.superficie.max} como mucho; una marca pequeña late hasta ${TOPES_ESCALA.marca.max}.`, no: 'Nunca una superficie por encima de 1,03, y nunca un elemento que crece para llamar la atención.' },
    { cuando: 'parallax', si: 'En ningún sitio de JosStyle hoy.', no: 'Mueve el fondo contra el contenido, que es justo lo que marea a quien tiene sensibilidad vestibular, y no explica nada en una aplicación de datos.' },
    { cuando: 'bucle infinito', si: 'Solo mientras algo está cargando de verdad (el latido del esqueleto, el giro de «Pensando…»).', no: 'Nunca para adornar.' },
  ],
};

/* ───────────────────────────────────────────────────────────────────────────
   3 · EL LENGUAJE POR CONTEXTO (apartado 6)

   *"Analiza Jos Style y define el lenguaje definitivo tú mismo."* Por los ids
   de verdad de `AREAS_NAV` y de los módulos (App.jsx), así una pantalla nueva
   hereda el carácter de su área sin que nadie lo escriba.
   ─────────────────────────────────────────────────────────────────────────── */
export const CONTEXTOS_MOTION = [
  { id: 'inicio', ambito: ['hoy'], caracter: 'Calmado', nivelMax: 3, regla: 'Es lo primero que ve cada mañana: nada compite con lo que tiene que hacer hoy. Entra una vez y se queda quieto.' },
  { id: 'bienestar', ambito: ['area-salud', 'salud', 'sueno', 'nutricion', 'estilo-hombre'], caracter: 'Orgánico', nivelMax: 3, regla: 'Cambios suaves y continuos: una barra que se llena, una gráfica que se dibuja. Nada que salte.' },
  { id: 'entreno', ambito: ['entreno'], caracter: 'Con energía', nivelMax: 4, regla: 'Un punto más rápido en lo que se toca durante un entrenamiento (marcar una serie, terminar un descanso) y un momento visible al subir de rango. Ni confeti ni gamificación infantil (FIT F37).' },
  { id: 'vida', ambito: ['area-vida', 'estudios', 'productividad', 'mente', 'biblioteca', 'diario'], caracter: 'Ordenado', nivelMax: 3, regla: 'Lo que se completa se nota (tarea, hábito, rutina); lo que se lee no se mueve.' },
  { id: 'gestion', ambito: ['area-gestion', 'organizacion', 'economia', 'negocio', 'armario', 'numeros'], caracter: 'Preciso', nivelMax: 2, regla: 'Cifras que cambian sin adornos: el número es el protagonista, no su animación.' },
  { id: 'ajustes', ambito: ['ajustes'], caracter: 'Discreto', nivelMax: 1, regla: 'Casi nada se mueve: un interruptor que cambia y poco más. Es donde se decide cuánto se mueve el resto.' },
  { id: 'exito', ambito: [], caracter: 'Satisfacción', nivelMax: 4, regla: 'Una marca que entra y se queda. Nunca confeti ni partículas.' },
  { id: 'error', ambito: [], caracter: 'Claro y sin agresividad', nivelMax: 2, regla: 'Aparece donde está el problema y se queda hasta que se resuelve. Sin sacudidas violentas ni rojo que parpadea.' },
];

export const contextoDe = (id) => CONTEXTOS_MOTION.find((c) => c.ambito.includes(id)) || null;

/* ───────────────────────────────────────────────────────────────────────────
   4 · LAS CATEGORÍAS DEL INVENTARIO (apartado 2, de la A a la X)
   ─────────────────────────────────────────────────────────────────────────── */
export const CATEGORIAS_MOTION = [
  { id: 'A', nombre: 'Navegación' }, { id: 'B', nombre: 'Pantallas' }, { id: 'C', nombre: 'Secciones' },
  { id: 'D', nombre: 'Tarjetas' }, { id: 'E', nombre: 'Botones' }, { id: 'F', nombre: 'Campos' },
  { id: 'G', nombre: 'Modales' }, { id: 'H', nombre: 'Hojas inferiores' }, { id: 'I', nombre: 'Menús' },
  { id: 'J', nombre: 'Listas' }, { id: 'K', nombre: 'Gráficas' }, { id: 'L', nombre: 'Estadísticas' },
  { id: 'M', nombre: 'Carga' }, { id: 'N', nombre: 'Esqueletos' }, { id: 'O', nombre: 'Estados vacíos' },
  { id: 'P', nombre: 'Errores' }, { id: 'Q', nombre: 'Éxito' }, { id: 'R', nombre: 'Interruptores' },
  { id: 'S', nombre: 'Deslizadores' }, { id: 'T', nombre: 'Gestos' }, { id: 'U', nombre: 'Scroll' },
  { id: 'V', nombre: 'Arrastrar y soltar' }, { id: 'W', nombre: 'Elementos dinámicos' }, { id: 'X', nombre: 'Elementos futuros' },
];

/* ───────────────────────────────────────────────────────────────────────────
   5 · EL MOTION_MAP (apartado 3)

   Una línea por elemento con movimiento —o que debería tenerlo—, con los
   campos que pide el apartado 3. `docs/MOTION_MAP.md` **se genera de aquí**
   (`scripts/generar-motion-map.mjs`): editarlo a mano lo dejaría viejo, y la
   prueba lo compara.

   `estado`:
     · `existe`        — se mueve y está bien;
     · `inconsistente` — se mueve, pero con un valor suelto, otra curva u otra
                         duración que el resto de su clase;
     · `sin_motion`    — debería moverse y aparece o desaparece de golpe;
     · `fuera_de_control` — se mueve y nadie lo gobierna (ni la curva, ni el
                         movimiento reducido).
   `fase`: la del Motion System que lo construye o lo corrige.
   ─────────────────────────────────────────────────────────────────────────── */
/* 🔓 MS F2 — este texto decía *"aparece directamente en su estado final"*, que fue verdad hasta la F1:
   desde entonces Reducido FUNDE sin desplazar (los tokens de distancia y escala valen 0 y 1) y solo
   «Sin movimiento» deja el estado final. Lo cazó la F2 al leer el mapa de la navegación. */
const REDUCIDO_CSS = 'Se funde en su sitio, sin desplazarse ni escalar (en Reducido los tokens de distancia y escala valen 0 y 1, MS F1). Con «Sin movimiento», aparece directamente en su estado final.';
const IGUAL = 'Igual';

const m = (e) => ({
  componente: null, funcion: '', inicial: '—', final: '—', entrada: '—', salida: '—', interaccion: '—',
  transicion: '—', duracion: null, easing: '--ease-premium', spring: null, delay: 0, stagger: null,
  prioridad: 'media', relacion: '—', movil: IGUAL, desktop: IGUAL, reducido: REDUCIDO_CSS,
  clase: null, keyframe: null, catalogo: null, bucle: false, estado: 'existe', fase: null, ...e,
});

export const MOTION_MAP = [
  /* ── A · Navegación ── */
  m({ id: 'pestanas_barra', nombre: 'Pestaña activa de la barra de abajo', categoria: 'A', nivel: 1, ubicacion: 'src/App.jsx · src/index.css', componente: 'nav.nav-segura', clase: 'nav-tab-icon', funcion: 'Decir en qué área estás.', inicial: 'Gris', final: 'Color de acento', interaccion: 'Tocar una pestaña: el icono se encoge un poco mientras se pulsa (MS F2)', transicion: 'color, transform', duracion: 220, prioridad: 'alta', relacion: 'Cambia a la vez que la pastilla viaja (nav-indicador) y entra la sección (nav-seccion).', reducido: 'El color cambia igual; el icono no se encoge.', fase: 2 }),
  m({ id: 'indicador_barra', nombre: 'Indicador de la pestaña activa', categoria: 'A', nivel: 2, ubicacion: 'src/App.jsx · src/index.css', componente: 'nav.nav-segura', clase: 'nav-indicador', funcion: 'Una sola pastilla que viaja hasta la pestaña nueva, en vez de apagarse en una y encenderse en otra (apartado 3).', inicial: 'Bajo la pestaña de antes', final: 'Bajo la pestaña nueva', interaccion: 'Tocar una pestaña, o entrar en un módulo de otra área', transicion: 'transform `medium` con la curva `emphasized`; opacity `fast`', duracion: 280, easing: '--motion-curva-emphasized', prioridad: 'alta', relacion: 'Su sitio sale de `indiceDePestana` (transicionNavegacion.js), el mismo criterio que el color de la pestaña.', reducido: 'No viaja: aparece en la pestaña nueva.', fase: 2 }),
  m({ id: 'barra_volver', nombre: 'Barra de «Volver»', categoria: 'A', nivel: 2, ubicacion: 'src/index.css', clase: 'back-bar', keyframe: 'backBarIn', funcion: 'Aparece al entrar en un módulo para salir de él.', inicial: 'Opacidad 0, 8 px a la izquierda', final: 'En su sitio', entrada: 'Fundido + desplazamiento corto', interaccion: 'Pulsar: opacidad y fondo 160 ms', transicion: 'opacity, transform', duracion: 220, prioridad: 'alta', relacion: 'Acompaña a module-enter.', fase: 2 }),
  /* ── B · Pantallas ── */
  m({ id: 'entrada_modulo', nombre: 'Entrar en un módulo', categoria: 'B', nivel: 2, ubicacion: 'src/index.css · src/App.jsx', clase: 'module-enter', keyframe: 'moduleSlideIn', catalogo: 'entrada_pantalla', funcion: 'Que la pantalla nueva llegue desde la derecha en vez de aparecer: un nivel más hondo.', inicial: 'Opacidad 0, desplazada a la derecha y al 0,98', final: 'En su sitio', entrada: 'Desliza + fundido + escala', salida: 'Ninguna: la anterior desaparece de golpe', transicion: 'opacity, transform', duracion: 340, prioridad: 'alta', relacion: '🔓 MS F2 — solo al ENTRAR (`tipoDeNavegacion`): volver y cambiar de sección tienen su propio movimiento. Y termina con `backwards`: no deja un transform puesto.', fase: 2 }),
  m({ id: 'volver_pantalla', nombre: 'Volver a una pantalla', categoria: 'B', nivel: 2, ubicacion: 'src/index.css · src/App.jsx · src/components/navegacionMotion.js', clase: 'nav-vuelve', keyframe: 'navVuelve', funcion: 'Que volver se lea como volver, no como entrar otra vez (apartado 6).', inicial: 'Medio visible, 8 px a la izquierda', final: 'En su sitio, al scroll de antes', entrada: 'Desde el lado del que salió, más corto y sin escala; lo ya visto no repite su entrada', transicion: 'opacity, transform', duracion: 220, prioridad: 'alta', relacion: 'Las entradas de `ENTRADAS_QUE_NO_SE_REPITEN` se terminan en el acto (Web Animations API).', fase: 2 }),
  m({ id: 'cambio_seccion', nombre: 'Cambiar de sección con la barra de abajo', categoria: 'B', nivel: 2, ubicacion: 'src/index.css · src/App.jsx', clase: 'nav-seccion', keyframe: 'navSeccion', funcion: 'Las secciones son hermanas: un fundido con un leve ascenso, sin desplazamiento lateral (apartado 5).', inicial: 'Medio visible, 8 px abajo', final: 'En su sitio, arriba', entrada: 'Fundido corto', transicion: 'opacity, transform', duracion: 220, prioridad: 'alta', relacion: 'Empieza medio visible para que no haya un instante vacío entre una sección y otra (apartado 28).', fase: 2 }),
  m({ id: 'cambio_contenido', nombre: 'Otra pestaña dentro de una pantalla', categoria: 'C', nivel: 1, ubicacion: 'src/index.css · src/components/motion.jsx (CambioDeContenido)', clase: 'contenido-cambia', keyframe: 'contenidoCambia', funcion: 'Una transición de CONTENIDO, no de página (apartado 15): cambia lo de dentro, no el sitio.', inicial: 'Medio visible', final: 'Visible', entrada: 'Fundido corto, sin moverse', transicion: 'opacity', duracion: 160, prioridad: 'media', relacion: 'La F10 añade lo que recoloca una lista (filtros, orden, periodo).', reducido: 'Igual: ya es solo un fundido.', fase: 2 }),
  m({ id: 'portada_area', nombre: 'Portada de un área: la cascada de tarjetas', categoria: 'B', nivel: 3, ubicacion: 'src/views/HubView.jsx · src/index.css', componente: 'HubView', clase: 'hub-card', keyframe: 'hubCardIn', funcion: 'Que los cinco módulos del área entren de arriba abajo.', inicial: 'Opacidad 0, 14 px abajo, 0,97', final: 'En su sitio', entrada: 'Cascada', transicion: 'opacity, transform', duracion: 420, stagger: 60, prioridad: 'alta', relacion: 'Después de la cabecera (hub-header).', fase: 10 }),
  m({ id: 'cabecera_area', nombre: 'Cabecera de un área (ÁREA / Vida)', categoria: 'B', nivel: 2, ubicacion: 'src/views/HubView.jsx · src/index.css', componente: 'HubView', clase: 'hub-header', keyframe: 'hubHeaderIn', funcion: 'Primero el título y luego las tarjetas.', inicial: 'Opacidad 0, 8 px arriba', final: 'En su sitio', entrada: 'Fundido corto', transicion: 'opacity, transform', duracion: 280, prioridad: 'media', relacion: 'Se queda fija al desplazar (SC F1) y sin fondo desde la v3.129.1.', fase: 2 }),
  m({ id: 'expandir_tarjeta_area', nombre: 'Tocar un módulo de la portada', categoria: 'D', nivel: 2, ubicacion: 'src/views/HubView.jsx · src/index.css', clase: 'hub-card-expanding', keyframe: 'hubCardExpand', funcion: 'La tarjeta crece un poco y se abre su módulo.', inicial: '0,97', final: '1,03 con brillo y sombra', interaccion: 'Tocar', transicion: 'transform, filter, box-shadow', duracion: 160, prioridad: 'alta', relacion: 'La navegación espera el mismo token (`duracionMs(\'fast\')`, MS F1), no un número escrito aparte.', fase: 7 }),
  m({ id: 'pulsar_tarjeta_area', nombre: 'Pulsar un módulo de la portada (y las demás retroceden)', categoria: 'D', nivel: 1, ubicacion: 'src/index.css · src/views/HubView.jsx', componente: 'HubView', funcion: 'Respuesta al dedo antes de abrir el módulo.', inicial: '1', final: '0,97, más clara y con sombra; las demás al 0,98 y medio transparentes', interaccion: 'Mantener pulsado', transicion: 'transform, filter, box-shadow, opacity', duracion: 160, prioridad: 'alta', relacion: 'Anima `filter` y `box-shadow`, que no son baratos en un iPhone (la F13 lo mide). 🐛 Hasta la MS F3 la entrada (`hubCardIn`) terminaba con `both` y su último fotograma ganaba a `:active` y a `.hub-card-receding`: ni encogía ni las demás retrocedían.', fase: 3 }),
  m({ id: 'icono_tarjeta_area', nombre: 'El icono de un módulo de la portada al pulsarlo', categoria: 'D', nivel: 1, ubicacion: 'src/index.css', clase: 'hub-card-icon', funcion: 'Un pellizco de escala extra sobre el de la tarjeta.', inicial: '1', final: '1,08', interaccion: 'Mantener pulsado', transicion: 'transform', duracion: 160, relacion: 'Va con «Pulsar un módulo de la portada».', fase: 3 }),
  m({ id: 'pantalla_fitness', nombre: 'Una pantalla de Fitness aparece', categoria: 'B', nivel: 2, ubicacion: 'src/index.css', clase: 'fit-entra', keyframe: 'fitEntra', catalogo: 'fit_entra', funcion: 'Cambiar de área dentro de Fitness.', inicial: 'Opacidad 0, 6 px abajo', final: 'En su sitio', transicion: 'opacity, transform', duracion: 220, fase: 2 }),
  /* ── C · Secciones ── */
  m({ id: 'acordeon_inicio', nombre: 'Acordeones de Inicio (situación actual y puntuación)', categoria: 'C', nivel: 2, ubicacion: 'src/views/DashboardView.jsx', componente: 'IndicadorContexto · TarjetaPuntuacion', funcion: 'Abrir y cerrar el detalle sin medir la altura a mano.', inicial: 'grid-template-rows 0fr', final: '1fr', interaccion: 'Tocar la cabecera', transicion: 'grid-template-rows `medium` + opacidad `medium`/`ultraFast` (MS F1: `transicion()`)', duracion: 280, prioridad: 'media', relacion: 'Sin hueco en Safari desde la SC F1 (minHeight: 0).', fase: 9 }),
  m({ id: 'chevron', nombre: 'Chevron que gira al desplegar', categoria: 'C', nivel: 1, ubicacion: 'src/components/motion.jsx (ChevronDespliegue) · src/index.css', componente: 'ChevronDespliegue', clase: 'chevron-gira', funcion: 'Decir si una sección está abierta.', inicial: 'Hacia abajo (o a la derecha)', final: 'Hacia arriba (o abajo)', interaccion: 'Tocar', transicion: 'transform `normal` con la curva de JosStyle', duracion: 220, relacion: 'MS F3: los veintitrés desplegables usan el mismo icono que gira; veinte cambiaban un icono por otro de golpe.', reducido: 'Llega a su sitio sin girar.', fase: 3 }),
  m({ id: 'despliegue', nombre: 'Lo que aparece al abrir un desplegable o un menú', categoria: 'C', nivel: 1, ubicacion: 'src/index.css · los desplegables con ChevronDespliegue y el ⋯ de las plantillas', clase: 'despliegue-entra', keyframe: 'despliegueEntra', funcion: 'Que el contenido aparezca desde el borde que lo abrió, no plantado (apartado 14).', inicial: 'Invisible, 4 px más arriba', final: 'En su sitio', entrada: 'Fundido corto y un leve descenso', transicion: 'opacity, transform', duracion: 160, relacion: 'Cerrar recolocando el resto es la F10 (C-54).', reducido: 'Solo el fundido.', fase: 3 }),
  m({ id: 'pestana_elegida', nombre: 'El color de una pestaña al elegirla', categoria: 'C', nivel: 1, ubicacion: 'src/components/ui.jsx (ToggleTab) · src/index.css', componente: 'ToggleTab', clase: 'pestana-cambia', funcion: 'Que la pestaña y su contenido cambien como una sola acción (apartado 24).', inicial: 'Gris', final: 'Acento', interaccion: 'Tocar una pestaña', transicion: 'background-color, color, border-color', duracion: 160, relacion: 'Al mismo ritmo que `contenido-cambia` (F2).', reducido: 'Igual: ya es solo color.', fase: 3 }),
  /* ── D · Tarjetas ── */
  m({ id: 'pulsar_tarjeta', nombre: 'Pulsar una tarjeta o un botón (la escalera de escalas)', categoria: 'D', nivel: 1, ubicacion: 'src/components/ui.jsx · src/index.css (`[class*=active:scale]`)', componente: 'Card, PrimaryBtn, GhostBtn, chips…', funcion: 'Respuesta inmediata al dedo.', inicial: '1', final: '0,90–0,99 según el tamaño', interaccion: 'Mantener pulsado', transicion: 'transform: al pulsar `ultrafast` con la curva de JosStyle; al soltar `normal` con la curva `entrance`, que llega y se posa sin rebotar (MS F3)', duracion: 220, prioridad: 'alta', relacion: 'MS F3: 57 de los 138 no tenían transición y saltaban. Fitness usa su propio escalón (fit-pulsable).', reducido: 'No encoge: baja la opacidad al 0,72.', fase: 3 }),
  m({ id: 'pulsar_borrar', nombre: 'Pulsar una papelera', categoria: 'E', nivel: 1, ubicacion: 'src/components/ui.jsx (BotonBorrar, BotonBorrarDefinitivo) · src/index.css', componente: 'BotonBorrar', clase: 'toque-destructivo', funcion: 'Lo destructivo responde sin encoger (apartado 28).', inicial: 'Opacidad 1', final: '0,72', interaccion: 'Pulsar', transicion: 'opacity', duracion: 160, relacion: 'La misma regla que `fit-contenido` (FIT F37), para toda la aplicación.', reducido: 'Igual: ya es solo opacidad.', fase: 3 }),
  m({ id: 'pulsar_fitness', nombre: 'Pulsar una tarjeta de Fitness', categoria: 'D', nivel: 1, ubicacion: 'src/index.css', clase: 'fit-pulsable', catalogo: 'fit_pulsar', funcion: 'El escalón 0,98 de la escalera.', inicial: '1', final: '0,98', interaccion: 'Pulsar', transicion: 'transform', duracion: 160, fase: 3 }),
  m({ id: 'pulsar_destructivo', nombre: 'Pulsar algo destructivo en Fitness', categoria: 'E', nivel: 1, ubicacion: 'src/index.css', clase: 'fit-contenido', catalogo: 'fit_contenido', funcion: 'Lo destructivo no escala: baja la opacidad.', inicial: 'Opacidad 1', final: '0,72', interaccion: 'Pulsar', transicion: 'opacity', duracion: 160, fase: 3 }),
  m({ id: 'tarjeta_destacada', nombre: 'Tarjeta destacada al llegar por un enlace (objetivo, tarea)', categoria: 'D', nivel: 2, ubicacion: 'ObjectivesView · ProductivityView', funcion: 'Señalar a qué tarjeta te ha llevado un enlace.', inicial: 'Sin borde', final: 'Anillo del acento', transicion: 'box-shadow `medium` (MS F1: `transicion()`)', duracion: 280, fase: 7 }),
  m({ id: 'tarjeta_lista_entra', nombre: 'Tarjetas de una lista que entran en cascada (Biblioteca, Productividad, Nutrición, Salud)', categoria: 'J', nivel: 3, ubicacion: 'LibraryView · ProductivityView · NutritionView · HealthView', funcion: 'Que una lista no aparezca de golpe.', entrada: 'Cascada con la animación de la portada', transicion: 'opacity, transform', duracion: 420, stagger: 60, relacion: 'Una sola cadencia y como mucho seis escalones: `escalonado(i)` del motor (MS F1). Antes eran 60, 70 y 80 ms y dos funciones.', fase: 10 }),
  /* ── E · Botones ── */
  m({ id: 'favorito', nombre: 'Marcar un favorito', categoria: 'E', nivel: 1, ubicacion: 'src/index.css', clase: 'favorito-guardado', keyframe: 'favoritoPulso', funcion: 'La marca late una vez al ponerla (nunca al quitarla ni al abrir la pantalla).', interaccion: 'Marcar como favorito', componente: 'LatidoAlMarcar', transicion: 'transform', duracion: 220, relacion: 'MS F3: en las trece marcas de la aplicación; antes solo en dos de la Biblioteca, y latía también al quitarla.', reducido: 'No late: el pulso vale 1, y el color ya lo dice.', fase: 3 }),
  m({ id: 'pensando', nombre: '«Pensando…» y los botones que esperan', categoria: 'M', nivel: 1, bucle: true, ubicacion: 'src/components/ui.jsx · BarcodeScanner', funcion: 'Que se vea que algo está trabajando.', transicion: 'Giro continuo (`animate-spin` de Tailwind)', duracion: 1000, easing: 'linear', relacion: 'Es de los pocos bucles infinitos permitidos (presupuesto).', fase: 16 }),
  /* ── F · Campos ── */
  m({ id: 'campos', nombre: 'Campos de texto al enfocar', categoria: 'F', nivel: 0, ubicacion: 'src/components/ui.jsx', componente: 'TextInput, Textarea', funcion: 'Enfocar un campo.', transicion: 'Ninguna: el anillo de foco aparece de golpe', estado: 'sin_motion', fase: 9 }),
  /* ── G · Modales y H · Hojas ── */
  m({ id: 'hoja_fitness', nombre: 'Una hoja de Fitness entra desde abajo', categoria: 'H', nivel: 2, ubicacion: 'src/lib/acabadoFitness.js (HOJA) · src/index.css', clase: 'hoja-entra', keyframe: 'calendarSheetIn', catalogo: 'hoja_entra', funcion: 'Las hojas de Fitness suben y su velo se oscurece.', inicial: 'Abajo', final: 'En su sitio', entrada: 'Sube', salida: 'Ninguna: desaparece de golpe', duracion: 220, relacion: 'Comparte la animación con las hojas del Calendario.', estado: 'inconsistente', fase: 6 }),
  m({ id: 'velo_hoja', nombre: 'El fondo de una hoja se oscurece', categoria: 'G', nivel: 2, ubicacion: 'src/index.css', clase: 'fondo-entra', keyframe: 'fondoEntra', catalogo: 'fondo_entra', funcion: 'Separar la hoja de lo de detrás.', inicial: 'Transparente', final: 'Velo (en Ultra, además, lo de detrás desenfocado y fijo)', duracion: 220, fase: 6 }),
  m({ id: 'hoja_calendario', nombre: 'Hojas del Calendario', categoria: 'H', nivel: 2, ubicacion: 'src/views/CalendarView.jsx · src/index.css', clase: 'calendar-sheet', keyframe: 'calendarSheetIn', funcion: 'Crear o editar un evento.', entrada: 'Sube', salida: 'Ninguna', duracion: 220, estado: 'inconsistente', fase: 6 }),
  m({ id: 'modales_resto', nombre: 'El resto de ventanas y hojas (unas 40 en 18 archivos)', categoria: 'G', nivel: 0, ubicacion: 'App.jsx, ui.jsx, LibraryView, ArmarioView, EstiloHombreView, CalendarView, quickAdd…', funcion: 'Confirmaciones, formularios, buscador, papelera, visor de fotos.', entrada: 'Ninguna: aparecen de golpe', salida: 'Ninguna: desaparecen de golpe', prioridad: 'alta', estado: 'sin_motion', fase: 6 }),
  m({ id: 'aviso_anadido', nombre: 'El aviso de «añadido» (y los de Fitness)', categoria: 'Q', nivel: 2, ubicacion: 'src/index.css', clase: 'aviso-entra', keyframe: 'avisoEntra', catalogo: 'aviso', funcion: 'Confirmar una acción sin pararte.', entrada: 'Sube y aparece', salida: 'Ninguna', duracion: 280, fase: 9 }),
  /* ── I · Menús ── */
  m({ id: 'menus', nombre: 'Menús «⋯» y desplegables', categoria: 'I', nivel: 0, ubicacion: 'HoyView, BibliotecaPlanesView, PlantillasView…', funcion: 'Acciones de un elemento.', entrada: 'Ninguna', salida: 'Ninguna', estado: 'sin_motion', fase: 6 }),
  /* ── J · Listas ── */
  m({ id: 'tarea_hecha', nombre: 'Completar una tarea', categoria: 'J', nivel: 2, ubicacion: 'src/index.css', clase: 'tarea-hecha', keyframe: 'tareaHecha', catalogo: 'completar', funcion: 'Que se note que se ha completado.', duracion: 280, fase: 9 }),
  m({ id: 'habito_hecho', nombre: 'Completar un hábito', categoria: 'J', nivel: 2, ubicacion: 'src/index.css', clase: 'habito-hecho', keyframe: 'habitoHecho', catalogo: 'habito_hecho', funcion: 'El hábito de hoy hecho.', duracion: 280, fase: 9 }),
  m({ id: 'rutina_fin', nombre: 'Terminar una rutina', categoria: 'Q', nivel: 3, ubicacion: 'src/index.css', clase: 'rutina-fin', keyframe: 'rutinaFin', catalogo: 'rutina_fin', funcion: 'Cerrar una rutina entera.', duracion: 420, fase: 9 }),
  m({ id: 'serie_hecha', nombre: 'Marcar una serie', categoria: 'J', nivel: 1, ubicacion: 'src/index.css', clase: 'fit-serie-hecha', keyframe: 'fitSerieHecha', catalogo: 'fit_serie', funcion: 'Una serie del entrenamiento en vivo hecha.', duracion: 160, fase: 9 }),
  m({ id: 'borrar_elemento', nombre: 'Borrar o añadir un elemento de una lista', categoria: 'J', nivel: 0, ubicacion: 'Toda la aplicación', funcion: 'Lo que se va a la papelera y lo que se crea.', entrada: 'Ninguna', salida: 'Ninguna: la lista salta', prioridad: 'alta', estado: 'sin_motion', fase: 10 }),
  /* ── K · Gráficas ── */
  m({ id: 'graficas_recharts', nombre: 'Gráficas de Recharts (Salud, Nutrición, Sueño)', categoria: 'K', nivel: 3, ubicacion: 'HealthView · NutritionView · SleepView · src/lib/datosMotion.js', componente: 'LineChart', funcion: 'Dibujar los datos.', entrada: 'La línea se dibuja una vez, en `cinematic`, con la curva de JosStyle', interaccion: 'Cambiar de periodo o de semana: la misma gráfica interpola a los datos nuevos, no se rehace', transicion: 'JavaScript de la librería, gobernado por el motor (`animacionDeGrafica`, `useAnimacionDeGrafica`)', duracion: 420, easing: '--ease-premium (la `standard` del motor)', prioridad: 'alta', relacion: 'MS F4: antes 1,5 s con su curva y sin obedecer a «Reducir movimiento» (hallazgo `graficas_sin_control`). El tooltip, en `fast`.', reducido: 'No se dibuja: la línea aparece en su sitio.', fase: 4 }),
  m({ id: 'cifra_sube', nombre: 'Una cifra que sube', categoria: 'K', nivel: 1, ubicacion: 'src/components/motion.jsx (CifraQueCambia) · src/index.css', componente: 'CifraQueCambia', clase: 'cifra-sube', keyframe: 'cifraSube', funcion: 'Que se vea QUÉ ha cambiado y hacia dónde (apartados 2 y 6).', inicial: 'Medio visible, 4 px más abajo', final: 'En su sitio', interaccion: 'El dato cambia (un registro, un toque, una carga)', transicion: 'opacity, transform', duracion: 220, relacion: 'El preset `dataChange`. Las cifras principales CUENTAN en vez de relevarse (puntuación, progreso, calorías, saldo); nunca al aparecer.', reducido: 'Solo el fundido; una cuenta pasa a relevo.', fase: 4 }),
  m({ id: 'cifra_baja', nombre: 'Una cifra que baja', categoria: 'K', nivel: 1, ubicacion: 'src/components/motion.jsx (CifraQueCambia) · src/index.css', componente: 'CifraQueCambia', clase: 'cifra-baja', keyframe: 'cifraBaja', funcion: 'Lo mismo, desde arriba: bajar no es un error, y no se pinta de rojo (apartado 6).', inicial: 'Medio visible, 4 px más arriba', final: 'En su sitio', interaccion: 'El dato cambia', transicion: 'opacity, transform', duracion: 220, reducido: 'Solo el fundido.', fase: 4 }),
  m({ id: 'vacio', nombre: 'Un estado vacío', categoria: 'K', nivel: 1, ubicacion: 'src/components/ui.jsx (EmptyHint) · src/index.css', componente: 'EmptyHint', clase: 'vacio-entra', keyframe: 'vacioEntra', funcion: 'Entrar sin ser protagonista (apartado 14).', inicial: 'Invisible, 4 px más abajo', final: 'En su sitio', transicion: 'opacity, transform', duracion: 160, reducido: 'Solo el fundido.', fase: 4 }),
  m({ id: 'graficas_propias', nombre: 'Gráficas propias en SVG (Fitness, Sueño)', categoria: 'K', nivel: 0, ubicacion: 'GraficaProgreso y similares', funcion: 'Progreso de un ejercicio, sueño de la semana.', entrada: 'Ninguna', estado: 'sin_motion', fase: 17 }),
  /* ── L · Estadísticas ── */
  m({ id: 'barras_progreso_css', nombre: 'Barras de progreso con su clase (Hoy, Biblioteca, Nutrición, Fitness)', categoria: 'L', nivel: 3, ubicacion: 'src/index.css', clase: 'barra-progreso', catalogo: 'progreso_dia', funcion: 'Que la barra avance en vez de saltar.', transicion: 'width', duracion: 340, relacion: 'Cuatro clases con tres tokens: barra-progreso `slow`, nu-progreso y progreso-libro `cinematic`, fit-barra `medium`. Ya son tokens (MS F1); que digan uno solo es de la F17.', estado: 'inconsistente', fase: 17 }),
  m({ id: 'barras_progreso_sueltas', nombre: 'Barras de progreso escritas en la vista (Objetivos, Productividad, Rachas, Bienestar digital)', categoria: 'L', nivel: 3, ubicacion: 'ObjectivesView · ProductivityView · RachasView · WellbeingView', funcion: 'Lo mismo que las de arriba.', transicion: 'width `slow` con la curva de JosStyle (MS F1: `transicion()`; antes 0,3 / 0,35 / 0,4 / 0,5 s con `ease`)', duracion: 340, estado: 'inconsistente', fase: 17 }),
  m({ id: 'aro_progreso', nombre: 'El aro de progreso de `ui.jsx`', categoria: 'L', nivel: 3, ubicacion: 'src/components/ui.jsx', componente: 'ProgressRing', funcion: 'Un porcentaje en círculo.', transicion: 'stroke-dashoffset `cinematic` (MS F1; antes 1 s con `ease`, por encima del tope)', duracion: 420, fase: 17 }),
  m({ id: 'aro_pomodoro', nombre: 'El aro del temporizador', categoria: 'L', nivel: 2, ubicacion: 'src/index.css', clase: 'aro-pomodoro', catalogo: 'aro_pomodoro', funcion: 'El tiempo que queda.', transicion: 'stroke-dashoffset lineal (es un reloj)', duracion: 280, easing: '--motion-curva-linear', fase: 17 }),
  m({ id: 'cifras', nombre: 'Cifras que cambian (rachas, kcal, puntuación, saldo)', categoria: 'L', nivel: 0, ubicacion: 'Toda la aplicación', funcion: 'Un número que sube o baja.', transicion: 'Ninguna: el número cambia de golpe', estado: 'sin_motion', fase: 17 }),
  /* ── M · Carga y N · Esqueletos ── */
  m({ id: 'esqueleto', nombre: 'El latido del esqueleto', categoria: 'N', nivel: 1, bucle: true, ubicacion: 'src/index.css', clase: 'esqueleto', keyframe: 'latido', catalogo: 'esqueleto', funcion: 'Que la pantalla de carga tenga la forma de Hoy y respire.', transicion: 'opacity en bucle', duracion: 1400, relacion: 'Bucle permitido: solo mientras carga.', fase: 16 }),
  /* ── O · Vacíos y P · Errores ── */
  m({ id: 'vacios', nombre: 'Estados vacíos', categoria: 'O', nivel: 0, ubicacion: 'EmptyHint y cada vista', funcion: 'Decir que aún no hay nada y qué hacer.', entrada: 'Ninguna', estado: 'sin_motion', fase: 16 }),
  m({ id: 'errores', nombre: 'Avisos de error (guardado, archivo, conexión)', categoria: 'P', nivel: 0, ubicacion: 'AvisoAccion y cada vista', funcion: 'Decir qué ha fallado y qué hacer.', entrada: 'La del aviso (aviso-entra) cuando es un aviso; ninguna cuando es una línea en la pantalla', estado: 'sin_motion', fase: 16 }),
  /* ── Q · Éxito ── */
  m({ id: 'entreno_guardado', nombre: 'El entrenamiento guardado', categoria: 'Q', nivel: 2, ubicacion: 'src/index.css', clase: 'exito-entra', keyframe: 'exitoEntra', catalogo: 'entreno_guardado', funcion: 'La marca de la pantalla de éxito.', duracion: 280, fase: 9 }),
  m({ id: 'libro_terminado', nombre: 'Terminar un libro', categoria: 'Q', nivel: 3, ubicacion: 'src/index.css', clase: 'celebracion-libro', keyframe: 'celebracionLibro', funcion: 'El libro pasa a Terminado.', duracion: 340, fase: 9 }),
  m({ id: 'descanso_fin', nombre: 'Termina el descanso', categoria: 'Q', nivel: 2, ubicacion: 'src/index.css', clase: 'fit-descanso-fin', keyframe: 'fitDescansoFin', catalogo: 'fit_descanso', funcion: 'Avisar de que toca la siguiente serie.', duracion: 280, fase: 9 }),
  m({ id: 'rango_sube', nombre: 'Subir de rango', categoria: 'Q', nivel: 4, ubicacion: 'src/index.css', clase: 'fit-rango-sube', keyframe: 'fitRangoSube', catalogo: 'fit_rango_sube', funcion: 'El momento de un rango nuevo.', duracion: 280, fase: 17 }),
  m({ id: 'racha_sube', nombre: 'La llama de una racha que sube', categoria: 'Q', nivel: 4, ubicacion: 'src/index.css', clase: 'fuego-sube', keyframe: 'fuegoSube', funcion: 'La racha de hoy cuenta.', duracion: 620, relacion: 'No está en ANIMACIONES_HC, pero desde la MS F1 su duración es el token `momento` y el mapa la mide.', fase: 17 }),
  m({ id: 'racha_mas_uno', nombre: 'El «+1» de una racha', categoria: 'Q', nivel: 5, ubicacion: 'src/index.css', clase: 'racha-mas-uno', keyframe: 'masUnoSube', funcion: 'La firma de JosStyle: un día más.', duracion: 900, relacion: 'La única animación de nivel firma; su duración es el token `firma` (MS F1).', fase: 18 }),
  /* ── R · Interruptores ── */
  m({ id: 'interruptor_ui', nombre: 'El interruptor (la bola)', categoria: 'R', nivel: 1, ubicacion: 'src/components/ui.jsx (Switch, PistaInterruptor) · src/index.css', componente: 'Switch', clase: 'interruptor-bola', funcion: 'Encender o apagar algo.', inicial: 'A la izquierda', final: 'A la derecha', interaccion: 'Tocar: al pulsar se estira hacia donde va', transicion: 'transform `normal` con la curva `entrance`; color `normal`', duracion: 220, easing: '--motion-curva-entrance', relacion: 'MS F3: uno solo para toda la aplicación. Eran tres —el de `ui.jsx`, seis dibujados a mano y cuatro filas— y movían la bola con `left`.', reducido: 'Salta a su sitio; solo se funde el color.', fase: 3 }),
  m({ id: 'interruptor_pista', nombre: 'El interruptor (la pista), suelto o dentro de una fila', categoria: 'R', nivel: 1, ubicacion: 'src/components/ui.jsx (Switch, PistaInterruptor) · src/index.css', componente: 'PistaInterruptor', clase: 'interruptor', funcion: 'Lo mismo que el Switch, cuando la fila entera es lo que se toca (Todo el día, Avisarme, Repetir cada año, la legibilidad).', inicial: 'Gris', final: 'Acento', interaccion: 'Tocar la fila', transicion: 'background-color, border-color `normal`', duracion: 220, relacion: 'La fila lleva `role="switch"` y `aria-checked`.', reducido: 'Igual: ya es solo color.', fase: 3 }),
  /* ── S · Deslizadores ── */
  m({ id: 'deslizadores', nombre: 'Deslizadores (`input type=range`)', categoria: 'S', nivel: 0, ubicacion: 'SettingsView y otros', funcion: 'Elegir un valor.', transicion: 'Los del navegador', estado: 'existe', fase: 5 }),
  /* ── T · Gestos y U · Scroll ── */
  m({ id: 'cambiar_ejercicio', nombre: 'Deslizar para cambiar de ejercicio', categoria: 'T', nivel: 1, ubicacion: 'src/views/EntrenamientoVivoView.jsx · src/index.css', clase: 'fit-miniatura', catalogo: 'fit_miniatura', funcion: 'Pasar al ejercicio siguiente en el entrenamiento en vivo.', interaccion: 'Deslizar en horizontal (umbral, `pan-y`)', transicion: 'width, padding y colores `normal`', duracion: 220, relacion: 'Sin seguir al dedo: el cambio ocurre al soltar.', fase: 8 }),
  m({ id: 'comparador', nombre: 'El divisor del comparador de fotos', categoria: 'T', nivel: 1, ubicacion: 'src/components/comparadorFotos.jsx', funcion: 'Arrastrar para comparar dos fotos.', interaccion: 'Arrastrar: sigue al dedo (requestAnimationFrame)', transicion: 'Directa, sin animación: es el dedo', fase: 8 }),
  m({ id: 'rebote', nombre: 'El rebote de la página', categoria: 'U', nivel: 1, ubicacion: 'El navegador (Safari)', funcion: 'Arrastrar más allá del principio o del final.', interaccion: 'Arrastrar', transicion: 'La del sistema', relacion: 'Se quedó (v3.129.1): en su iPhone los hubs caben y es lo único que los mueve.', reducido: 'Lo decide iOS.', fase: 5 }),
  m({ id: 'fundido_cabecera', nombre: 'Las tarjetas se desvanecen al pasar bajo la cabecera de un área', categoria: 'U', nivel: 1, ubicacion: 'src/components/fundidoBajoCabecera.js', funcion: 'Que la cabecera transparente no se lea encima de una tarjeta.', interaccion: 'Desplazar', transicion: 'Máscara que sigue al desplazamiento (una vez por fotograma)', duracion: 0, easing: 'Directa: es el dedo', reducido: 'Igual: no es una animación, es recortar lo que está detrás del título.', fase: 10 }),
  /* ── V · Arrastrar y soltar ── */
  m({ id: 'reordenar', nombre: 'Reordenar (flechas en lugar de arrastrar)', categoria: 'V', nivel: 0, ubicacion: 'Pantalla principal, Imagen personal', funcion: 'Mover algo de sitio.', interaccion: 'Flechas: el arrastre sería un segundo mecanismo (EH F50)', transicion: 'Ninguna: salta a su sitio nuevo', estado: 'sin_motion', fase: 10 }),
  /* ── W · Dinámicos ── */
  m({ id: 'cambio_mes', nombre: 'Cambiar de mes en el Calendario', categoria: 'W', nivel: 2, ubicacion: 'src/index.css', clase: 'calendar-month-grid', keyframe: 'calendarMonthIn', catalogo: 'cambio_mes', funcion: 'Que el mes nuevo entre.', duracion: 220, fase: 10 }),
  m({ id: 'progreso_libro', nombre: 'El progreso de un libro', categoria: 'W', nivel: 3, ubicacion: 'src/index.css', clase: 'progreso-libro', funcion: 'La barra de páginas leídas.', transicion: 'width', duracion: 420, fase: 17 }),
  m({ id: 'progreso_nutricion', nombre: 'El progreso de un macro', categoria: 'W', nivel: 3, ubicacion: 'src/index.css', clase: 'nu-progreso', catalogo: 'progreso_nutricion', funcion: 'Lo consumido frente al objetivo.', transicion: 'width', duracion: 420, fase: 17 }),
  m({ id: 'barra_fitness', nombre: 'Una barra de progreso de Fitness', categoria: 'W', nivel: 3, ubicacion: 'src/index.css', clase: 'fit-barra', catalogo: 'fit_barra', funcion: 'Rangos, objetivos y cobertura.', transicion: 'width', duracion: 280, fase: 17 }),
  m({ id: 'muestra_ajustes', nombre: 'La muestra de «Ver cómo se mueve» en Ajustes', categoria: 'R', nivel: 3, ubicacion: 'src/views/SettingsView.jsx (AjusteMovimiento)', componente: 'AjusteMovimiento', funcion: 'Ver la diferencia entre modos y velocidades sin ir a buscarla (MS F1).', entrada: 'La cascada de la portada, con el modo y la velocidad elegidos', interaccion: 'Tocar «Ver cómo se mueve» la repite', duracion: 420, stagger: 60, fase: 1 }),
  /* ── X · Lo que viene ── */
  m({ id: 'futuros', nombre: 'Todo lo que se añada a partir de hoy', categoria: 'X', nivel: 0, ubicacion: '—', funcion: 'Apartado 19: hereda el Motion System sin que nadie lo pida.', relacion: '`auditarMotion` pone la suite roja si aparece una animación que no está en este mapa, y la deuda medida (`DEUDA_F0`) no puede crecer.', estado: 'existe', reducido: '—', fase: 0 }),
];

export const entradaMotion = (id) => MOTION_MAP.find((e) => e.id === id) || null;

/* ───────────────────────────────────────────────────────────────────────────
   6 · LO QUE LA AUDITORÍA ENCONTRÓ (apartados 1, 20 y 23)

   Cada hallazgo dice **qué se ve** y qué fase lo arregla. Esta fase no lo
   arregla: es el mapa. Pero no se queda sin dueño.
   ─────────────────────────────────────────────────────────────────────────── */
export const HALLAZGOS_F0 = [
  { id: 'niveles_decorativos', resuelto: 1, fase: 1, que: 'Tres de los cuatro niveles de «Animaciones» de Ajustes no hacen nada', seVe: 'Completa, Reducida y Mínima se ven exactamente igual; solo «Desactivadas» cambia algo. La propia pantalla lo confiesa: «Hoy la app tiene pocas animaciones propias». Es un control decorativo (regla 8).' },
  { id: 'graficas_sin_control', resuelto: 4, fase: 4, que: 'Las gráficas de Recharts animan 1,5 s y no obedecen a «Reducir movimiento»', seVe: 'Salud, Nutrición y Sueño dibujan su gráfica durante segundo y medio aunque tenga activado reducir movimiento: Recharts anima por JavaScript y las reglas de index.css no lo alcanzan.' },
  { id: 'duraciones_sueltas', resuelto: 1, fase: 1, que: 'Duraciones escritas a mano en las vistas, con otra curva', seVe: 'Las barras de progreso se mueven a siete ritmos distintos —0,3 / 0,35 / 0,4 / 0,5 s escritos en las vistas con `ease`, y 280, 380 y 420 ms en index.css— y el aro de progreso tarda 1 s: la misma cosa se mueve a un ritmo distinto en cada pantalla.' },
  { id: 'tres_interruptores', resuelto: 3, fase: 3, que: 'Tres interruptores distintos', seVe: 'El Switch de ui.jsx (200 ms, curva común), los escritos a mano en Calendario y Relación (150 ms, sin curva) y seis en Ajustes con `transition-all`. Los tres animan `left`, que obliga al navegador a recalcular el diseño.' },
  { id: 'dos_curvas', resuelto: 1, fase: 14, que: 'Dos curvas conviviendo', seVe: 'Todo index.css usa --ease-premium, pero las 80 clases `transition-transform` y las 26 `transition` de Tailwind usan la curva por defecto de Tailwind (y 150 ms): el pulsar de un botón y el de una tarjeta de Fitness no frenan igual.' },
  { id: 'modales_de_golpe', fase: 6, que: 'Casi ninguna ventana anima', seVe: 'De unas cuarenta ventanas y hojas, solo las de Fitness y las del Calendario entran; ninguna sale con transición. El resto aparece y desaparece de golpe.' },
  { id: 'listas_que_saltan', fase: 10, que: 'Las listas saltan al añadir o borrar', seVe: 'Borrar una tarea o añadir una comida hace que el resto de la lista salte de sitio sin transición.' },
  { id: 'cifras_de_golpe', fase: 17, que: 'Las cifras cambian de golpe', seVe: 'Rachas, kcal, saldo y puntuación cambian sin transición; las barras sí se mueven, los números que las acompañan no.' },
  { id: 'cadencias', resuelto: 1, fase: 10, que: 'Cinco cadencias para la misma cascada', seVe: '60, 70 y 80 ms escritos a mano y dos funciones (`retrasoDeTarjeta`, `retrasoDeTarjetaPR`) para el mismo efecto.' },
  { id: 'mismo_numero_dos_sitios', resuelto: 1, fase: 1, que: 'El mismo número escrito en dos sitios', seVe: 'Tocar un módulo de la portada: la animación dura 190 ms en index.css y la navegación espera 190 ms escritos aparte en HubView (EXPAND_MS). Si uno cambia, el otro no se entera.' },
  { id: 'fuera_del_catalogo', resuelto: 1, fase: 1, que: 'Animaciones que el tope de la E3 F14 no mide', seVe: 'La llama (620 ms) y el «+1» de las rachas (900 ms), la entrada de la portada (420 ms), la cabecera, la barra de volver, la expansión de una tarjeta, el favorito y el libro terminado no están en ANIMACIONES_HC, así que nadie comprobaba su duración.' },
  { id: 'reducido_rompe', resuelto: 1, fase: 12, que: 'Movimiento reducido = movimiento cero', seVe: 'Las dos reglas globales llevan TODO a 0,01 ms. El apartado 13 pide conservar el feedback, la jerarquía y la orientación con alternativas menos dinámicas (un fundido corto en vez de un desplazamiento), no quitarlo todo.' },
];

/* ───────────────────────────────────────────────────────────────────────────
   7 · LA AUDITORÍA QUE LEE LOS ARCHIVOS

   Recibe el contenido (una librería del navegador no lee del disco; se lo
   pasa la prueba), como `condicionSC` y `condicionSF`.

   ⚠️ La lección de siempre, aplicada desde el principio: un comentario que
   NOMBRA una duración o una curva no es código. Se quitan los comentarios
   **conservando los saltos de línea**, porque lo que se devuelve son números
   de línea (FIT F38).
   ─────────────────────────────────────────────────────────────────────────── */
const sinComentariosCss = (css) => String(css || '').replace(/\/\*[\s\S]*?\*\//g, (x) => x.replace(/[^\n]/g, ' '));
const sinComentariosJs = (src) => String(src || '')
  .replace(/\/\*[\s\S]*?\*\//g, (x) => x.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:\\])\/\/.*$/gm, (x, a) => a + ' '.repeat(x.length - a.length));
const lineaDe = (texto, indice) => texto.slice(0, indice).split('\n').length;

/** Pasa «340ms», «0.4s» o «.35s» a milisegundos. */
export function aMs(valor) {
  const t = String(valor || '').trim();
  const mt = t.match(/^(\d*\.?\d+)(ms|s)$/);
  if (!mt) return null;
  const n = Number(mt[1]);
  return mt[2] === 's' ? Math.round(n * 1000) : Math.round(n);
}

/** Todas las reglas de index.css que animan o transicionan, con su línea. */
export function escanearCss(css = '') {
  const limpio = sinComentariosCss(css);
  /* MS F1 — desde la F1 las reglas usan los tokens (`var(--motion-dur-slow)`): para
     medir milisegundos se sustituyen por su valor de `:root`, que es el de la
     velocidad Normal. */
  const raiz = tokensRaiz(css);
  const reglas = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let mt;
  while ((mt = re.exec(limpio))) {
    const selector = mt[1].replace(/\s+/g, ' ').trim();
    const cuerpo = mt[2];
    const props = cuerpo.match(/\b(animation|transition)\s*:[^;]+/g);
    if (!props || selector.startsWith('@keyframes') || /^(from|to|\d)/.test(selector)) continue;
    props.forEach((p) => {
      const tipo = p.startsWith('animation') ? 'animation' : 'transition';
      const valor = p.replace(/^[a-z-]+\s*:/, '').trim();
      const ms = (resolverDuraciones(valor, raiz).match(/\d*\.?\d+m?s\b/g) || []).map(aMs).filter((x) => x !== null);
      const curvas = (valor.match(/var\(--[a-z-]+\)|cubic-bezier\([^)]*\)|\bease(-in|-out|-in-out)?\b|\blinear\b/g) || [])
        .filter((c) => !/^var\(--motion-(?:dur|retraso)-/.test(c));
      const keyframe = tipo === 'animation' ? (valor.match(/^([A-Za-z][\w-]*)/) || [])[1] || null : null;
      reglas.push({ linea: lineaDe(limpio, mt.index + mt[1].length), selector, tipo, valor, ms, curvas, keyframe });
    });
  }
  return reglas;
}

/** Los nombres de @keyframes declarados en el CSS. */
export function keyframesDe(css = '') {
  return [...sinComentariosCss(css).matchAll(/@keyframes\s+([\w-]+)/g)].map((x) => x[1]);
}

/** Las clases (sin el punto) que aparecen en el selector de una regla. */
const clasesDe = (selector) => [...selector.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((x) => x[1]);

/* El movimiento escrito dentro de una vista o componente. */
const PATRONES_VISTA = [
  /* 🔓 MS F1 — lo que se cuenta es un LITERAL (una duración o una curva escrita a mano), no que
     haya una transición: `transition: transicion('width', 'slow')` usa el motor y no es deuda. */
  { id: 'transicion_en_linea', re: /transition:\s*['`][^'`]*?(?:\d*\.?\d+m?s\b|\bease(?:-in|-out|-in-out)?\b|cubic-bezier)[^'`]*['`]/g, que: 'Una transición con una duración o una curva escrita a mano en el `style` de la vista' },
  { id: 'retraso_en_linea', re: /animationDelay:\s*[^,}\n]+/g, que: 'Un retraso de animación calculado en la vista' },
  { id: 'transition_all', re: /\btransition-all\b/g, que: '`transition-all`: anima cualquier propiedad que cambie, también las caras' },
  { id: 'tailwind_duracion', re: /\bduration-\d+\b/g, que: 'Una duración de Tailwind escrita en la clase' },
  { id: 'tailwind_curva', re: /\bease-(?:in|out|in-out|linear)\b/g, que: 'Una curva de Tailwind escrita en la clase' },
  { id: 'grafica_recharts', re: /<(?:LineChart|BarChart|AreaChart|PieChart|RadarChart|ComposedChart)\b/g, que: 'Una gráfica de Recharts' },
];

/** El movimiento que aparece en el código de una vista, con su línea. */
export function escanearVista(src = '', archivo = '') {
  const limpio = sinComentariosJs(src);
  const out = [];
  PATRONES_VISTA.forEach((p) => {
    p.re.lastIndex = 0;
    let mt;
    while ((mt = p.re.exec(limpio))) {
      out.push({ archivo, linea: lineaDe(limpio, mt.index), tipo: p.id, texto: mt[0].slice(0, 120) });
    }
  });
  return out;
}

/** ¿Lleva una gráfica de Recharts su animación gobernada? (`isAnimationActive`) */
export function graficasSinGobierno(src = '', archivo = '') {
  const limpio = sinComentariosJs(src);
  const series = [...limpio.matchAll(/<(Line|Bar|Area|Pie|Radar)\b[^>]*>/g)];
  return series.filter((x) => !/isAnimationActive/.test(x[0]))
    .map((x) => ({ archivo, linea: lineaDe(limpio, x.index), serie: x[1] }));
}

/* ───────────────────────────────────────────────────────────────────────────
   8 · LA DEUDA MEDIDA, Y NO PUEDE CRECER

   Lo que la F0 contó el 2026-10-04. Es un **trinquete**, no una cuenta exacta
   (la cuenta exacta es la bomba de relojería de EH F21): la prueba exige que
   lo de hoy sea **igual o menor**. Una fase que reduzca la deuda baja aquí su
   número; una vista nueva que escriba su propia duración pone la suite roja.
   ─────────────────────────────────────────────────────────────────────────── */
export const DEUDA_F0 = {
  /* 🔓 MS F1 — de 25 a 0: las transiciones de las vistas piden su duración y su
     curva al motor (`transicion()`). */
  transicion_en_linea: 0,
  /* 🔓 MS F1 — de 13 a 0: el retraso de una cascada es `escalonado(i)`. */
  retraso_en_linea: 0,
  /* 🔓 MS F3 — de 6 a 0: los seis interruptores dibujados a mano son `Switch`
     (hallazgo `tres_interruptores`). En la F1 había bajado de 7 a 6. */
  transition_all: 0,
  /* 🔓 MS F1 — de 2 a 0 y de 1 a 0: la duración por defecto de Tailwind ya es el
     token `fast`, y el comparador usa `transicion()`. */
  tailwind_duracion: 0,
  tailwind_curva: 0,
  grafica_recharts: 3,
  /* 🔓 MS F4 — de 3 a 0: las tres series piden su animación al motor. */
  series_sin_gobierno: 0,
  curvas_ajenas_css: 0,
};

/**
 * La auditoría de la fase. Devuelve lo que no cuadra **con su archivo y su línea**:
 *  · `sinMapa`: una regla de index.css que anima una clase que no está en el MOTION_MAP;
 *  · `keyframesHuerfanos`: un @keyframes que ninguna regla usa;
 *  · `mapaSinCss`: una entrada del mapa que dice tener clase y en el CSS no está;
 *  · `catalogoDistinto`: una entrada que corresponde a ANIMACIONES_HC con otra duración;
 *  · `cuentas`: la deuda de hoy, por tipo, para compararla con `DEUDA_F0`.
 */
export function auditarMotion({ css = '', vistas = {} } = {}) {
  const reglas = escanearCss(css);
  const clasesMapa = new Set(MOTION_MAP.filter((e) => e.clase).map((e) => e.clase));
  /* Las clases que la aplicación anima pero NO son de un elemento: los
     estados de pulsar o de foco de una clase que sí está, y las dos reglas
     globales que llevan todo a 0,01 ms. */
  const sinMapa = reglas.filter((r) => {
    if (/^\*|html\[data-|@media/.test(r.selector) || r.selector === '*, *::before, *::after') return false;
    const clases = clasesDe(r.selector);
    if (clases.length === 0) return false;
    return !clases.some((c) => clasesMapa.has(c));
  }).map((r) => ({ linea: r.linea, selector: r.selector }));

  const usados = new Set(reglas.map((r) => r.keyframe).filter(Boolean));
  const keyframesHuerfanos = keyframesDe(css).filter((k) => !usados.has(k));

  const clasesCss = new Set(reglas.flatMap((r) => clasesDe(r.selector)));
  const mapaSinCss = MOTION_MAP.filter((e) => e.clase && !clasesCss.has(e.clase)).map((e) => e.id);

  const catalogoDistinto = MOTION_MAP.filter((e) => e.catalogo).map((e) => {
    const a = ANIMACIONES_HC.find((x) => x.id === e.catalogo);
    return { id: e.id, catalogo: e.catalogo, mapa: e.duracion, hc: a ? a.ms : null };
  }).filter((x) => x.hc === null || x.hc !== x.mapa);

  const curvasAjenas = reglas.filter((r) => r.curvas.some((c) => c !== 'var(--ease-premium)' && c !== 'linear' && !/^var\(--motion-curva-[a-z]+\)$/.test(c)))
    .map((r) => ({ linea: r.linea, selector: r.selector, curvas: r.curvas }));

  const enVistas = Object.entries(vistas).flatMap(([archivo, src]) => escanearVista(src, archivo));
  const series = Object.entries(vistas).flatMap(([archivo, src]) => graficasSinGobierno(src, archivo));
  const cuentas = {};
  Object.keys(DEUDA_F0).forEach((k) => { cuentas[k] = 0; });
  enVistas.forEach((x) => { cuentas[x.tipo] = (cuentas[x.tipo] || 0) + 1; });
  cuentas.series_sin_gobierno = series.length;
  cuentas.curvas_ajenas_css = curvasAjenas.length;

  const deudaQueCrece = Object.keys(DEUDA_F0).filter((k) => (cuentas[k] || 0) > DEUDA_F0[k])
    .map((k) => ({ tipo: k, hoy: cuentas[k], tope: DEUDA_F0[k] }));

  return { reglas, sinMapa, keyframesHuerfanos, mapaSinCss, catalogoDistinto, curvasAjenas, enVistas, series, cuentas, deudaQueCrece };
}

/* ───────────────────────────────────────────────────────────────────────────
   9 · LOS AJUSTES DE MOVIMIENTO Y DÓNDE SE GUARDAN (apartados 14 y 15)

   *"No añadas controles inútiles. Cada ajuste debe aportar valor real."*
   El selector ya existe (Fase A3) y guarda `apariencia.animaciones`. **Los ids
   guardados no se renombran** (FIT F1: un id es una ranura estable); lo que
   cambia es que cada nivel **haga algo de verdad**.
   ─────────────────────────────────────────────────────────────────────────── */
export const AJUSTES_MOVIMIENTO = {
  dondeSeGuarda: 'apariencia.animaciones, apariencia.velocidadMovimiento y apariencia.reducirMovimiento, dentro de `ajustes` (app_data, Supabase), como el resto de Apariencia. Ni localStorage ni una clave nueva: sería un segundo sistema de persistencia (apartado 15) y el ajuste no viajaría al otro dispositivo.',
  comoLlegaALaPantalla: 'App.jsx los escribe en <html> como data-motion y data-velocidad (MS F1), y el CSS y el motor (`src/lib/motion.js`) los leen de ahí: un solo punto.',
  /* 🔓 MS F1 — lo que la F0 dejó escrito como plan ya es lo que hay: cinco modos que cambian de
     verdad (los de `MODOS_MOTION`), con los ids de siempre para los tres primeros. */
  niveles: [
    { id: 'desactivadas', hoy: 'Sin movimiento', efecto: 'Nada se mueve: todo aparece en su estado final.' },
    { id: 'reducida', hoy: 'Reducido', efecto: 'Sin desplazamientos ni escalas: fundidos que conservan el orden y el feedback (apartado 13).' },
    { id: 'completa', hoy: 'Normal', efecto: 'Todo el lenguaje del Motion System.' },
    { id: 'premium', hoy: 'Premium', efecto: 'Más amplitud en desplazamientos y escalas, misma duración.' },
    { id: 'ultra', hoy: 'Ultra', efecto: 'Lo de Premium con más amplitud, y profundidad: el velo de una hoja desenfoca lo de detrás.' },
  ],
  minima: 'Lo guardado como «minima» (el cuarto nivel de antes) se lee como Reducido y no se reescribe (C-52).',
  premiumYUltra: 'Premium y Ultra se ofrecen desde la MS F1, porque la F1 demuestra en Chromium que cambian lo que se ve (el desplazamiento de una pantalla y de una tarjeta, y el desenfoque del velo) sin pasar del presupuesto. No son «más duración»: la duración es de la velocidad.',
  velocidad: 'Pausada (×1,3), Normal y Rápida (×0,75) multiplican todas las duraciones y retrasos desde un solo sitio (apartado 15).',
  sistemaOperativo: 'Si el iPhone tiene activado «Reducir movimiento», manda sobre Normal, Premium y Ultra: se comporta como «Reducido», nunca como «Sin movimiento» (apartado 13: reducir no es romper). Lo aplica el propio CSS con su @media.',
};

/* ───────────────────────────────────────────────────────────────────────────
   10 · LA ARQUITECTURA DEL MOTOR (apartados 16 y 17) — la decide la F0 y la
   construye la F1.
   ─────────────────────────────────────────────────────────────────────────── */
export const ARQUITECTURA_MOTION = {
  sinLibreria: 'Sin framer-motion ni ninguna librería de animación. El movimiento de JosStyle ya vive en index.css con una curva común y dos reglas de movimiento reducido; una librería sería un segundo sistema al lado del primero (apartado 1: «No reemplaces arquitectura existente simplemente porque exista una alternativa que prefieras») y engordaría un archivo que ya pesa 4,4 MB (C-42).',
  tokens: 'Variables CSS en :root (duraciones, retrasos, distancias, escalas, curvas), con sus valores por nivel en html[data-animaciones=…]. Un solo punto que se cambia y llega a todo el CSS. JavaScript las lee del mismo sitio (getComputedStyle) y las comprueba una prueba que parsea index.css.',
  css: 'Lo que puede ser CSS sigue siendo CSS: entradas, pulsar, barras, cascadas. Así respeta los niveles y el movimiento reducido sin una línea de JavaScript.',
  js: 'Lo que el CSS no puede hacer —salir antes de desmontar, FLIP de una lista que cambia, seguir al dedo y soltar con su velocidad, una cifra que cuenta— va por la Web Animations API del navegador (element.animate), que se interrumpe desde el estado visual actual (apartado 11) y existe en Safari desde la 13.1. Cada animación JS lee el nivel antes de empezar.',
  nada: 'Ni un hex, ni una duración escrita en una vista, ni una curva que no sea un token: lo vigila `auditarMotion` desde hoy.',
};

/* ───────────────────────────────────────────────────────────────────────────
   11 · LA REGLA PERMANENTE (apartado 19)
   ─────────────────────────────────────────────────────────────────────────── */
export const REGLA_HEREDA_MOTION = [
  'Todo lo nuevo —módulo, pantalla, tarjeta, botón, ventana, gráfica, interacción— se mira contra este mapa antes de darlo por terminado.',
  'Usa los tokens, la jerarquía y el contexto que ya existen: ni una duración escrita a mano, ni una curva propia.',
  'Si necesita una animación que todavía no existe: se diseña, se añade al mapa y a index.css, se documenta y se reutiliza.',
  'Una animación que no está en el MOTION_MAP pone la suite roja (`auditarMotion().sinMapa`), y la deuda medida no puede crecer (`DEUDA_F0`).',
];

/* ───────────────────────────────────────────────────────────────────────────
   12 · EL PLAN (apartados 21 y 22)

   El apartado 22 propone 25 fases «como mínimo» y dice que el orden se puede
   cambiar si el análisis lo justifica. **Josué ya lo dio escrito**: son las
   veinte fases del mismo documento. Ése es el plan, en ese orden, y lo que
   aporta la F0 es **qué significa cada una en JosStyle** y dónde se pisan.
   ─────────────────────────────────────────────────────────────────────────── */
export const ROADMAP_MOTION = [
  { fase: 0, titulo: 'Auditoría total, arquitectura y plan maestro', lineas: [4046, 4899], en: 'Este archivo, MOTION_MAP.md, MOTION_SYSTEM.md y el índice de fases.' },
  { fase: 1, titulo: 'Motor de movimiento + tokens + primitivas', lineas: [4900, 5490], en: 'Tokens en index.css por nivel, los cuatro niveles de Ajustes de verdad, las primitivas (presencia, FLIP, interrupción) sobre la Web Animations API y la deuda de duraciones sueltas a cero.' },
  { fase: 2, titulo: 'Navegación, transiciones y continuidad espacial', lineas: [6038, 6770], en: 'La barra de abajo, entrar y volver (dirección según la pila de NAVO F1), hojas y modales como capas de navegación.' },
  { fase: 3, titulo: 'Microinteracciones, componentes y feedback', lineas: [6771, 7586], en: 'Los tres interruptores en uno, la escalera de pulsar con la curva común, chevrons, favoritos, botones que cargan.' },
  { fase: 4, titulo: 'Datos dinámicos, listas, gráficas y estados', lineas: [7587, 8404], en: 'Recharts gobernado por el nivel de movimiento, listas que no saltan, progreso que retrocede bien.' },
  { fase: 5, titulo: 'Física, gestos, touch y comportamiento táctil', lineas: [8405, 9145], en: 'Respuesta táctil, umbrales y conflictos de gestos (el de cambiar de ejercicio, el comparador, el rebote).' },
  { fase: 6, titulo: 'Profundidad, capas, z-index y contexto visual', lineas: [9146, 9922], en: 'Las cuarenta ventanas que aparecen de golpe: un velo y una entrada y salida comunes, y el mapa de capas.' },
  { fase: 7, titulo: 'Continuidad espacial, shared elements y transiciones entre vistas', lineas: [9923, 10687], en: 'Tarjeta → detalle donde tenga sentido (la portada de un área, una plantilla, un ejercicio).' },
  { fase: 8, titulo: 'Física, springs, gestos e interacción directa', lineas: [10688, 11379], en: 'Springs solo donde suelta el dedo; seguir al dedo en lo que se arrastra.' },
  { fase: 9, titulo: 'Microinteracciones, estados y feedback de interfaz', lineas: [11380, 12127], en: 'Los estados de cada control (cargando, éxito, error, vacío) con el mismo lenguaje.' },
  { fase: 10, titulo: 'Layout motion, scroll, listas y contenido dinámico', lineas: [12128, 12784], en: 'Una sola cadencia para las cascadas, listas que no saltan al añadir o borrar, el desplazamiento.' },
  { fase: 11, titulo: 'Orquestación global, coordinación y motion engine avanzado', lineas: [13290, 14127], en: 'Quién manda cuando dos animaciones coinciden; la navegación global del borrador de F11 se cruza con la F2 (C-51).' },
  { fase: 12, titulo: 'Accesibilidad, reduced motion, adaptive motion y calidad de experiencia', lineas: [14966, 15717], en: 'Reducir sin romper: fundidos en vez de desplazamientos, feedback conservado, el del iPhone respetado.' },
  { fase: 13, titulo: 'Rendimiento extremo, GPU, frame budget y optimización', lineas: [15718, 16452], en: 'Solo transform y opacity donde se pueda (los interruptores animan left), blur fijo, medir en Chromium.' },
  { fase: 14, titulo: 'Easings, curvas, ritmo y lenguaje visual del movimiento', lineas: [16453, 17154], en: 'Una familia de curvas a partir de --ease-premium y fuera la curva de serie de Tailwind.' },
  { fase: 15, titulo: 'Motion responsive, orientación, safe areas y multidispositivo', lineas: [17155, 17913], en: 'iPhone de 320 a 430, horizontal, iPad y escritorio, con la Safe Area.' },
  { fase: 16, titulo: 'Estados de sistema, loading, error, offline, sync y transiciones asíncronas', lineas: [1, 759], en: 'Carga, esqueletos, vacíos, errores y guardados con el mismo lenguaje.' },
  { fase: 17, titulo: 'Motion de datos, dashboard, métricas, gráficas y visualización', lineas: [760, 1458], en: 'Cifras que cuentan sin inventar datos intermedios, barras con una sola duración, gráficas propias.' },
  { fase: 18, titulo: 'Motion visual polish, brand language y coherencia sensorial', lineas: [1459, 2241], en: 'La firma de JosStyle y el pase de pulido de todo.' },
  { fase: 19, titulo: 'Testing extremo, validación, regresión y motion QA automatizado', lineas: [2242, 3117], en: 'Las pruebas del movimiento en Node y en Chromium, con trinquetes.' },
  { fase: 20, titulo: 'Finalización, consolidación, contratos y sellado', lineas: [3118, 4045], en: 'Los contratos y el cierre. No hay una fase 21.' },
];

/** Los títulos que se pisan entre fases, y cómo se reparten (C-51). */
export const SOLAPES_ROADMAP = [
  { fases: [2, 7, 11], tema: 'Navegación y transiciones entre vistas', reparto: 'F2: la navegación de cada día (pestañas, entrar, volver, hojas). F7: la continuidad (un elemento que viaja de una pantalla a otra). F11: la orquestación (qué pasa cuando dos coinciden). El borrador de una F11 de «navegación global, back y routing» que trae el documento —cortado a media frase— se cubre con la F2 y con la pila de navegación de NAVO F1.' },
  { fases: [3, 9], tema: 'Microinteracciones', reparto: 'F3: los componentes (interruptor, botón, tarjeta) y su pulsación. F9: los estados de esos componentes (cargando, éxito, error, vacío).' },
  { fases: [5, 8], tema: 'Física y gestos', reparto: 'F5: el gesto en sí (umbral, dirección, conflicto con el scroll). F8: la física al soltar (velocidad, springs, puntos de anclaje).' },
  { fases: [4, 10, 17], tema: 'Listas y datos', reparto: 'F4: que los datos se puedan animar sin mentir (gráficas gobernadas, progreso). F10: el diseño que cambia (FLIP, listas que no saltan, scroll). F17: la capa de datos completa (cifras, dashboards, gráficas propias).' },
  { fases: [14, 18], tema: 'Lenguaje y pulido', reparto: 'F14: las curvas y el ritmo (los tokens definitivos). F18: aplicarlos en un pase de pulido a toda la aplicación.' },
];

/* ───────────────────────────────────────────────────────────────────────────
   13 · EL DOCUMENTO MOTION_MAP.md SALE DE AQUÍ

   `scripts/generar-motion-map.mjs` escribe lo que devuelve esta función en
   `docs/MOTION_MAP.md`, y la prueba lo compara con el archivo: un mapa
   editado a mano o uno que nadie regeneró ponen la suite roja.
   ─────────────────────────────────────────────────────────────────────────── */
const celda = (v) => (v === null || v === undefined || v === '' ? '—' : String(v).replace(/\|/g, '\\|').replace(/\n/g, ' '));
const ms = (v) => (v === null || v === undefined ? '—' : `${v} ms`);

export const ESTADOS_MAPA = {
  existe: '✅ Existe',
  inconsistente: '⚠️ Inconsistente',
  sin_motion: '⬜ Sin movimiento',
  fuera_de_control: '🚨 Fuera de control',
};

export function motionMapMarkdown() {
  const L = [];
  const p = (t = '') => L.push(t);
  p('# MOTION_MAP — el movimiento de JosStyle, elemento a elemento');
  p();
  p('> **Motion System · desde la Fase 0.** Cada elemento que se mueve —o que debería moverse— con lo que pide el');
  p('> apartado 3 de la F0. 🚨 **Este documento se genera desde `src/lib/motionMapa.js`** con');
  p('> `node --import ./scripts/resolver-vite.mjs scripts/generar-motion-map.mjs`. No lo edites a mano: edita');
  p('> el mapa y vuelve a generarlo. `scripts/test-motion-f0.mjs` lo compara y se pone rojo si no coincide.');
  p();
  const cuenta = (e) => MOTION_MAP.filter((x) => x.estado === e).length;
  p(`**${MOTION_MAP.length} elementos**: ${Object.entries(ESTADOS_MAPA).map(([k, v]) => `${v} ${cuenta(k)}`).join(' · ')}.`);
  p();
  p('## Resumen');
  p();
  p('| Elemento | Cat. | Nivel | Duración | Estado | Fase |');
  p('|---|---|---|---|---|---|');
  MOTION_MAP.forEach((e) => {
    const n = nivelMotion(e.nivel);
    p(`| ${celda(e.nombre)} | ${e.categoria} | ${e.nivel} · ${n ? n.nombre : '—'} | ${ms(e.duracion)} | ${ESTADOS_MAPA[e.estado] || e.estado} | F${e.fase} |`);
  });
  p();
  p('## Ficha de cada elemento');
  p();
  CATEGORIAS_MOTION.forEach((c) => {
    const delGrupo = MOTION_MAP.filter((e) => e.categoria === c.id);
    if (delGrupo.length === 0) return;
    p(`### ${c.id} · ${c.nombre}`);
    p();
    delGrupo.forEach((e) => {
      p(`#### ${e.nombre}`);
      p();
      p(`\`${e.id}\` · ${ESTADOS_MAPA[e.estado] || e.estado} · lo trata la **F${e.fase}**`);
      p();
      p('| Campo | Valor |');
      p('|---|---|');
      [
        ['Ubicación', e.ubicacion], ['Componente', e.componente], ['Clase CSS', e.clase && `\`.${e.clase}\``],
        ['@keyframes', e.keyframe && `\`${e.keyframe}\``], ['En ANIMACIONES_HC', e.catalogo && `\`${e.catalogo}\``],
        ['Función', e.funcion], ['Estado inicial', e.inicial], ['Estado final', e.final], ['Entrada', e.entrada],
        ['Salida', e.salida], ['Interacción', e.interaccion], ['Transición', e.transicion], ['Duración', ms(e.duracion)],
        ['Curva', e.easing], ['Spring', e.spring], ['Retraso', e.delay ? `${e.delay} ms` : '—'],
        ['Escalonado', e.stagger ? `${e.stagger} ms entre elementos` : '—'],
        ['Intensidad', `${e.nivel} · ${(nivelMotion(e.nivel) || {}).nombre || '—'}`], ['Prioridad', e.prioridad],
        ['Relación', e.relacion], ['Móvil', e.movil], ['Escritorio', e.desktop], ['Movimiento reducido', e.reducido],
      ].forEach(([k, v]) => p(`| ${k} | ${celda(v)} |`));
      p();
    });
  });
  return `${L.join('\n')}\n`;
}
