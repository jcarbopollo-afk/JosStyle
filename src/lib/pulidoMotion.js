/* ===========================================================================
   pulidoMotion.js — MOTION SYSTEM · FASE 18: el lenguaje de JosStyle, pulido
   y comprobado como un todo

   *"Que alguien pueda utilizar Jos Style durante unos minutos y percibir que
   todas las partes de la aplicación pertenecen al mismo sistema."* Esta fase no
   añade animaciones (apartado 49: *"Premium no significa más animaciones"*):
   revisa lo que construyeron la F0 a la F17 y lo deja dicho en un sitio.

   Lo que hay aquí:
     1 · La personalidad, la temperatura y lo que se evita (apartados 4, 5 y 49-51).
     2 · El lenguaje, familia por familia (apartados 9-30): cada regla con la
         PIEZA que la cumple, y la prueba busca esa pieza en el código.
     3 · La jerarquía, el presupuesto y la primera impresión (apartados 45-48).
     4 · La auditoría total (apartado 1): las auditorías de cada fase, pasadas a
         la vez sobre todo el código que pinta — cada una se había probado sobre
         los archivos de su fase, y así se escondía lo de `App.jsx`.
     5 · El inventario (apartado 2): el censo de la F11, ampliado.
     6 · Los atípicos (apartado 3): lo que esta fase encontró, convertido en reglas.
     7 · Los tokens (apartado 53): cuáles no usa nadie, y por qué siguen.
     8 · Los guardarraíles y la regla permanente (apartados 55 y 64).

   ⚠️ Nada aquí es un valor nuevo: son ids de los tokens de la F1 y nombres de las
   piezas que ya existen. Este archivo NO lo importa la aplicación: es de las
   pruebas y de quien vaya a añadir movimiento (docs/MOTION_SYSTEM.md lo cita).
   =========================================================================== */
import {
  DURACIONES_MOTION, CURVAS_MOTION, SPRINGS_MOTION, DISTANCIAS_MOTION, ESCALAS_MOTION, PULSOS_MOTION,
  OPACIDADES_MOTION, DESENFOQUES_MOTION, PRESETS_MOTION, TOPES_ESCALA, STAGGER_MOTION, varDuracion, varCurva,
  auditarTokensCss,
} from './motion';
import { MOTION_MAP, auditarMotion } from './motionMapa';
import { auditarLenguaje } from './lenguajeMotion';
import { censoMotion, auditarOrquestacion, PRESUPUESTO_ORQUESTADOR } from './orquestadorMotion';
import { MUELLES_EN_USO, muelleSinRebote, SOBREPASO_MAXIMO } from './fisicaMotion';
import { auditarAccesibilidadMotion } from './accesibilidadMotion';
import { auditarCosteMotion } from './rendimientoMotion';
import { auditarProfundidad } from './profundidad';
import { auditarLayout } from './layoutMotion';
import { auditarComponentesMotion, CLASES_LATIDO } from './microinteraccionesMotion';
import { auditarEstadosInteraccion } from './estadosInteraccion';
import { auditarResponsive } from './responsiveMotion';
import { auditarAsincronia } from './estadosAsincronos';
import { auditarDatos } from './datosMotion';
import { CAPAS_MOTION } from './qaMotion';

/* ───────────────────────────────────────────────────────────────────────────
   1 · LA PERSONALIDAD Y LA TEMPERATURA (apartados 4, 5, 49, 50 y 51)

   La F14 ya escribió la firma (`FIRMA_MOTION`) y la temperatura en una frase.
   La F18 dice cada rasgo con la regla que lo GARANTIZA: un rasgo sin una
   comprobación detrás es un adjetivo.
   ─────────────────────────────────────────────────────────────────────────── */
export const PERSONALIDAD_MOTION = Object.freeze([
  { rasgo: 'precisión', como: 'Cada curva tiene un papel y cada duración una talla: lo que llega decelera largo y se posa sin rebote.', garantia: 'auditarLenguaje (F14)' },
  { rasgo: 'control', como: 'Ningún muelle de los que se usan se pasa de su sitio, y lo que sigue al dedo lo manda el dedo.', garantia: 'muelleSinRebote (F8) y tomarControl (F11)' },
  { rasgo: 'calma', como: 'Distancias cortas (4 a 24 px) y escalas contenidas: las cosas se desplazan lo justo para decir de dónde vienen.', garantia: 'DISTANCIAS_MOTION y TOPES_ESCALA (F1)' },
  { rasgo: 'tecnología', como: 'Un solo motor, sin librería: `index.css` con tokens y la Web Animations API por el orquestador.', garantia: 'auditarOrquestacion (F11) y el package.json (F0)' },
  { rasgo: 'premium', como: 'Menos y mejor: un solo momento de firma (el «+1» de una racha) y ni un efecto que no diga algo.', garantia: 'NIVELES_MOTION (F0): la Firma es una' },
  { rasgo: 'claridad', como: 'El movimiento nunca es lo único que dice algo: cada estado lleva su texto, y Reducido no pierde información.', garantia: 'auditarAccesibilidadMotion (F12)' },
  { rasgo: 'energía contenida', como: 'Lo que responde al dedo empieza en `ultraFast`; lo que se va dura menos que lo que llega.', garantia: 'auditarLenguaje: parejas de entrada y salida (F14)' },
]);

/** Lo que el apartado 4 prohíbe, y quién lo impide. */
export const EVITAR_MOTION = Object.freeze([
  { que: 'Rebotes infantiles', impide: `Ningún muelle en uso se pasa más de un ${SOBREPASO_MAXIMO * 100} % (\`muelleSinRebote\`), y \`bouncy\` no lo usa nadie (F8).` },
  { que: 'Exageración', impide: `Una superficie no pasa de ${TOPES_ESCALA.superficie.max} ni entra desde menos de ${TOPES_ESCALA.superficie.min} (\`TOPES_ESCALA\`, F1).` },
  { que: 'Movimiento elástico', impide: 'Las seis curvas de la F1 son de deceleración o aceleración: ninguna se pasa del 1 (`CURVAS_MOTION`).' },
  { que: 'Animaciones de marketing', impide: 'Ni confeti, ni bucles decorativos: cada bucle está en `BUCLES_INFINITOS` con su motivo y su regla de Reducido (F12).' },
  { que: 'Efectos gratuitos', impide: 'Una regla animada sin línea en el `MOTION_MAP` (con su función) pone la suite roja (F0).' },
]);

/* Apartado 5 — *"Jos Style debe situarse principalmente en: preciso + responsive + controlado."* Dos
   rasgos fríos y uno cálido, y cada uno con lo que lo hace así. */
export const TEMPERATURA_JOSSTYLE = Object.freeze({
  frio: ['preciso', 'controlado'],
  calido: ['responsive', 'humano'],
  josstyle: [
    { rasgo: 'preciso', lado: 'frio', como: 'La curva estándar (`--ease-premium`) y la duración de su talla: nada llega tarde ni se pasa.' },
    { rasgo: 'responsive', lado: 'calido', como: 'Pulsar empieza en `ultraFast` (F3) y el dedo manda sobre cualquier animación (`tomarControl`, F11).' },
    { rasgo: 'controlado', lado: 'frio', como: 'Muelles críticos (F8), una cascada de seis escalones como mucho (F1) y un presupuesto de animaciones a la vez (F11).' },
  ],
  queNo: 'Humano en el sentido de juguetón (rebotes, gelatina, personajes): JosStyle es una herramienta.',
});

/* ───────────────────────────────────────────────────────────────────────────
   2 · EL LENGUAJE DE JOSSTYLE, FAMILIA POR FAMILIA (apartados 9-30)

   Cada familia del enunciado con su regla y la PIEZA que la cumple: un preset de
   `motion.js`, una clase de `index.css` o un componente. La prueba busca cada
   pieza donde dice que está: una regla cuya pieza desaparece se pone roja.
   ─────────────────────────────────────────────────────────────────────────── */
const preset = (nombre) => ({ tipo: 'preset', nombre });
const clase = (nombre) => ({ tipo: 'clase', nombre });
const comp = (nombre, archivo) => ({ tipo: 'componente', nombre, archivo });

export const LENGUAJE_JOSSTYLE = Object.freeze([
  { id: 'entrada', apartado: 9, regla: 'Una entrada combina la opacidad con UNA cosa más: un desplazamiento corto o una escala de superficie. Nunca las cuatro (opacidad, desplazamiento, escala y profundidad) a la vez.', piezas: [preset('pageEnter'), preset('cardEnter'), preset('toastEnter')] },
  { id: 'salida', apartado: 10, regla: 'Una salida es más corta que su entrada y acelera hacia fuera (`exit`): nadie espera a que algo se vaya.', piezas: [preset('pageExit'), preset('modalExit'), preset('toastExit')] },
  { id: 'modal', apartado: 11, regla: 'Una ventana es un portal con `z-capa` y el velo de `CAPAS`; su entrada y su salida las pone `useCapasMotion`, nunca la vista.', piezas: [comp('useCapasMotion', 'src/components/capasMotion.js'), preset('modalEnter')] },
  { id: 'hoja', apartado: 12, regla: 'Una hoja es física: sube desde abajo, se arrastra por su asa con la misma función que su botón de cerrar y, al soltarla, vuelve con un muelle sin rebote.', piezas: [comp('AsaHoja', 'src/components/gestosMotion.jsx'), clase('hoja-entra'), preset('sheetEnter')] },
  { id: 'popover', apartado: 13, regla: 'Un panel colgado de un botón aparece junto a él, deprisa y sin recorrido (`flotante-cabe` lo mantiene dentro de la pantalla).', piezas: [clase('flotante-cabe'), preset('modalEnter')] },
  { id: 'tooltip', apartado: 14, regla: 'No hay tooltips: en el iPhone no hay puntero que se pose, y la información va escrita en la pantalla (regla 8).', piezas: [], existe: false },
  { id: 'toast', apartado: 15, regla: 'Un aviso entra, dice, y se va, desde abajo o arriba, sin tapar la pantalla: `Presencia` con `toastEnter` y `toastExit`.', piezas: [comp('Presencia', 'src/components/motion.jsx'), comp('AvisoAccion', 'src/components/quickAdd.jsx'), clase('aviso-entra')] },
  { id: 'navegacion', apartado: 16, regla: 'Navegar es moverse dentro de un espacio: entrar viene de la derecha y cambiar de sección es un fundido entre hermanas. Ninguna vista lo decide.', piezas: [clase('module-enter'), clase('nav-seccion'), preset('sectionSwitch')] },
  { id: 'atras', apartado: 17, regla: 'Volver es distinto de entrar: llega desde la izquierda, más corto, sin escala, con el scroll de antes y sin repetir las entradas.', piezas: [clase('nav-vuelve'), preset('pageBack')] },
  { id: 'pestanas', apartado: 18, regla: 'Una pestaña mueve tres cosas a la vez: el indicador viaja, lo de dentro se funde y la pestaña cambia de estado.', piezas: [clase('nav-indicador'), comp('CambioDeContenido', 'src/components/motion.jsx')] },
  { id: 'boton', apartado: 19, regla: 'Todos los botones pulsan igual (la escalera de `active:scale`), esperan igual (`estado="cargando"`, sin apagarse) y aciertan o fallan con su texto.', piezas: [comp('TextoDeBoton', 'src/components/ui.jsx'), preset('press')] },
  { id: 'iconos', apartado: 20, regla: 'Un icono que cambia de sentido no salta: el chevron gira (es el mismo) y play ↔ pausa, ⋯ ↔ ✕ o ＋ ↔ ✓ aparecen en el sitio del de antes.', piezas: [comp('ChevronDespliegue', 'src/components/motion.jsx'), comp('IconoQueCambia', 'src/components/motion.jsx'), clase('icono-cambia')] },
  { id: 'microinteracciones', apartado: 21, regla: 'Interruptores, casillas, chips y marcas: un interruptor es `Switch`, una marca late solo al ponerla.', piezas: [comp('Switch', 'src/components/ui.jsx'), comp('PistaInterruptor', 'src/components/ui.jsx'), comp('LatidoAlMarcar', 'src/components/motion.jsx')] },
  { id: 'formularios', apartado: 22, regla: 'El foco cambia el borde (ni un píxel de letra), el error se dice debajo del campo sin que tiemble.', piezas: [clase('campo'), comp('MensajeDeCampo', 'src/components/ui.jsx')] },
  { id: 'exito', apartado: 23, regla: 'Lo que sale bien se marca en su sitio y una vez: la casilla de una tarea o de un hábito late al marcarla (nunca al abrir la pantalla), y lo guardado se dice en un aviso.', piezas: [comp('LatidoAlMarcar', 'src/components/motion.jsx'), clase('tarea-hecha'), clase('habito-hecho'), preset('success')] },
  { id: 'error', apartado: 24, regla: 'Un error se dice con palabras donde pasó —bajo el campo, en el botón, arriba si no se guardó—; nunca con un temblor.', piezas: [comp('MensajeDeCampo', 'src/components/ui.jsx'), comp('IndicadorDeSincronizacion', 'src/components/estadosAsincronos.jsx')] },
  { id: 'carga', apartado: 25, regla: 'Esqueleto, giro, botón que espera y pantalla que tarda son una sola familia: el mismo latido, el texto al lado y nunca un giro mudo.', piezas: [comp('Esqueleto', 'src/components/ui.jsx'), comp('GiroDeCarga', 'src/components/accesibilidadMotion.jsx'), comp('TextoDeBoton', 'src/components/ui.jsx')] },
  { id: 'datos', apartado: 26, regla: 'Una cifra cambia por su clase (la principal cuenta), las barras van todas al mismo ritmo y una gráfica interpola sin rehacerse.', piezas: [comp('CifraQueCambia', 'src/components/motion.jsx'), clase('barra-progreso'), comp('useAnimacionDeGrafica', 'src/components/motion.jsx')] },
  { id: 'profundidad', apartado: 27, regla: 'Las capas tienen nombre y la sombra o el desenfoque salen de su función: lo que está más arriba entra después y se va antes.', piezas: [comp('useCapasMotion', 'src/components/capasMotion.js')] },
  { id: 'listas', apartado: 30, regla: 'Lo que aparece se revela por jerarquía: primero lo principal, después lo demás, y una cascada de seis escalones como mucho.', piezas: [comp('ListaAnimada', 'src/components/layoutMotion.jsx'), comp('Plegable', 'src/components/layoutMotion.jsx')] },
]);

/* ───────────────────────────────────────────────────────────────────────────
   3 · LA JERARQUÍA, EL PRESUPUESTO Y LA PRIMERA IMPRESIÓN (apartados 45-48)

   Los cuatro niveles del enunciado son grupos de las siete prioridades de la F11
   (`PRIORIDADES_MOTION`), no una escala nueva.
   ─────────────────────────────────────────────────────────────────────────── */
export const JERARQUIA_F18 = Object.freeze([
  { nivel: 1, id: 'critico', nombre: 'Crítico', prioridades: ['critica', 'navegacion'] },
  { nivel: 2, id: 'interaccion', nombre: 'Interacción', prioridades: ['gesto', 'micro'], nota: 'Lo que responde al dedo no espera a nada: pulsar es CSS (`:active`) y no compite con ninguna animación, y lo que sigue al dedo toma el control (`tomarControl`) por encima de cualquier peso (apartado 32).' },
  { nivel: 3, id: 'contextual', nombre: 'Contextual', prioridades: ['estado', 'layout'] },
  { nivel: 4, id: 'decorativo', nombre: 'Decorativo', prioridades: ['decorativa'] },
]);

/** Apartados 46 y 47 — no hace falta un presupuesto nuevo: los que hay, y lo que limita cada uno. */
export const PRESUPUESTOS_F18 = Object.freeze([
  { que: 'Animaciones a la vez en toda la aplicación', donde: 'PRESUPUESTO_ORQUESTADOR (F11)', valor: PRESUPUESTO_ORQUESTADOR.simultaneas, cuando: 'Con más, lo micro y lo decorativo no empiezan.' },
  { que: 'Cifras que cuentan a la vez', donde: 'reservarCuenta (F4/F17)', valor: 4, cuando: 'La quinta se releva en vez de contar.' },
  { que: 'Escalones de una cascada', donde: 'STAGGER_MOTION (F1)', valor: STAGGER_MOTION.escalones, cuando: 'El séptimo elemento entra con el sexto.' },
  { que: 'Una pantalla densa', donde: 'Las listas largas no escalonan más de seis y la cifra principal es UNA por pantalla (F17)', valor: null, cuando: 'Cuanto más hay en pantalla, menos se mueve cada cosa.' },
]);

/** Apartado 48 — lo primero que se ve, cada cosa con su línea del mapa. */
export const PRIMERA_IMPRESION = Object.freeze([
  { momento: 'Abrir la aplicación', mapa: 'esqueleto', como: 'La forma de Hoy late mientras carga (E3 F14), y a los 8 s dice que tarda y deja de latir (F16).' },
  { momento: 'Inicio y la barra de abajo', mapa: 'indicador_barra', como: 'La pastilla viaja a la pestaña nueva y la sección entra con un fundido (F2).' },
  { momento: 'El primer toque', mapa: 'pulsar_tarjeta_area', como: 'La tarjeta encoge al instante (`ultraFast`) y las demás retroceden (F3).' },
  { momento: 'Abrir un detalle', mapa: 'contenedor_desde_tarjeta', como: 'La pantalla crece desde la tarjeta que se tocó (F7).' },
  { momento: 'Abrir una ventana', mapa: 'modales_resto', como: 'El velo y la caja entran como una sola capa (F6).' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   4 · LA AUDITORÍA TOTAL (apartado 1: *"No asumir que todo está correctamente
   integrado"*)

   Cada fase probó su auditoría con los archivos de su fase. Pasadas todas a la
   vez sobre TODO el código que pinta (vistas, componentes, `App.jsx`), la F18
   encontró un botón de `App.jsx` que escribía a mano su «Verificando…»: la F9
   nunca le dio ese archivo. Las librerías (`src/lib/`) no entran: guardan las
   reglas y sus ejemplos malos, que cada auditoría encontraría en sí misma.
   ─────────────────────────────────────────────────────────────────────────── */
const listaDe = (r) => (Array.isArray(r) ? r : (r && (r.hallazgos || r.problemas)) || []);
const deMapa = (r) => [...r.sinMapa, ...r.keyframesHuerfanos, ...r.mapaSinCss, ...r.catalogoDistinto, ...r.curvasAjenas, ...r.deudaQueCrece];

export const SISTEMAS_AUDITADOS = Object.freeze([
  { id: 'mapa', nombre: 'Mapa, transiciones y deuda', fase: 0, correr: ({ css, pintan }) => deMapa(auditarMotion({ css, vistas: pintan })) },
  { id: 'tokens', nombre: 'Motor y tokens', fase: 1, correr: ({ css }) => listaDe(auditarTokensCss(css)) },
  { id: 'componentes', nombre: 'Microinteracciones', fase: 3, correr: ({ pintan }) => listaDe(auditarComponentesMotion({ vistas: pintan })) },
  { id: 'profundidad', nombre: 'Profundidad y capas', fase: 6, correr: ({ css, pintan }) => listaDe(auditarProfundidad({ vistas: pintan, css })) },
  { id: 'fisica', nombre: 'Muelles', fase: 8, correr: () => MUELLES_EN_USO.filter((id) => !muelleSinRebote(id)).map((id) => ({ regla: 'muelle_que_rebota', id })) },
  { id: 'estados', nombre: 'Estados y feedback', fase: 9, correr: ({ pintan }) => listaDe(auditarEstadosInteraccion({ vistas: pintan })) },
  { id: 'layout', nombre: 'Listas y desplegables', fase: 10, correr: ({ pintan }) => listaDe(auditarLayout({ vistas: pintan })) },
  { id: 'orquestacion', nombre: 'Orquestador', fase: 11, correr: ({ pintan }) => listaDe(auditarOrquestacion({ archivos: pintan })) },
  { id: 'accesibilidad', nombre: 'Accesibilidad', fase: 12, correr: ({ css, pintan }) => listaDe(auditarAccesibilidadMotion({ archivos: pintan, css })) },
  { id: 'rendimiento', nombre: 'Rendimiento', fase: 13, correr: ({ css, pintan }) => listaDe(auditarCosteMotion({ css, fuentes: pintan })) },
  { id: 'lenguaje', nombre: 'Curvas, ritmo y firma', fase: 14, correr: ({ css }) => listaDe(auditarLenguaje({ css })) },
  { id: 'responsive', nombre: 'Contexto físico', fase: 15, correr: ({ css, pintan }) => listaDe(auditarResponsive({ archivos: pintan, css })) },
  { id: 'asincronia', nombre: 'Estados del sistema', fase: 16, correr: ({ pintan }) => listaDe(auditarAsincronia({ archivos: pintan })) },
  { id: 'datos', nombre: 'Datos que cambian', fase: 17, correr: ({ pintan }) => listaDe(auditarDatos({ archivos: pintan })) },
  { id: 'pulido', nombre: 'Pulido y lenguaje', fase: 18, correr: ({ css, pintan }) => auditarPulido({ archivos: pintan, css }) },
]);

/** El código que pinta: todo lo que no es una librería de reglas. */
export const codigoQuePinta = (archivos = {}) => Object.fromEntries(Object.entries(archivos)
  .filter(([ruta]) => /\.jsx?$/.test(ruta) && !/(^|\/)src\/lib\//.test(ruta)));

export function auditoriaTotalMotion({ css = '', archivos = {} } = {}) {
  const pintan = codigoQuePinta(archivos);
  const porSistema = SISTEMAS_AUDITADOS.map((s) => {
    const hallazgos = s.correr({ css, pintan });
    return { id: s.id, nombre: s.nombre, fase: s.fase, hallazgos };
  });
  return { porSistema, total: porSistema.reduce((n, s) => n + s.hallazgos.length, 0), archivos: Object.keys(pintan).length };
}

/* ───────────────────────────────────────────────────────────────────────────
   5 · EL INVENTARIO (apartado 2): el censo de la F11, ampliado con lo que se
   anima de cada animación de `index.css` y con el mapa.
   ─────────────────────────────────────────────────────────────────────────── */
const sinComentarios = (src) => String(src || '').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:\\])\/\/[^\n]*/g, '$1');

function keyframesDe(css) {
  const out = {};
  const re = /@keyframes\s+([\w-]+)\s*\{/g;
  let m;
  while ((m = re.exec(css))) {
    let prof = 1; let i = re.lastIndex;
    while (i < css.length && prof > 0) { if (css[i] === '{') prof += 1; else if (css[i] === '}') prof -= 1; i += 1; }
    out[m[1]] = css.slice(re.lastIndex, i - 1);
  }
  return out;
}

export function inventarioMotion({ css = '', archivos = {} } = {}) {
  const limpio = sinComentarios(css);
  const kf = keyframesDe(limpio);
  const porPropiedad = { opacity: 0, transform: 0, filter: 0, otras: 0 };
  Object.values(kf).forEach((cuerpo) => {
    if (/\bopacity\s*:/.test(cuerpo)) porPropiedad.opacity += 1;
    if (/\btransform\s*:/.test(cuerpo)) porPropiedad.transform += 1;
    if (/\bfilter\s*:/.test(cuerpo)) porPropiedad.filter += 1;
    if (/\b(?:width|height|box-shadow|clip-path|background|color)\s*:/.test(cuerpo)) porPropiedad.otras += 1;
  });
  const pintan = codigoQuePinta(archivos);
  const todo = Object.values(pintan).map(sinComentarios).join('\n');
  const n = (re) => (todo.match(re) || []).length;
  const porNivel = {};
  MOTION_MAP.forEach((e) => { porNivel[e.nivel] = (porNivel[e.nivel] || 0) + 1; });
  return {
    ...censoMotion({ css, archivos }),
    keyframesPorPropiedad: porPropiedad,
    hover: n(/\bhover:/g),
    graficas: n(/useAnimacionDeGrafica\(/g),
    cifras: n(/<CifraQueCambia\b/g),
    latidos: n(/<LatidoAlMarcar\b/g),
    iconosQueCambian: n(/<IconoQueCambia\b/g),
    muellesEnUso: [...MUELLES_EN_USO],
    mapa: { lineas: MOTION_MAP.length, porNivel },
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   6 · LOS ATÍPICOS (apartado 3: *"Cada outlier debe evaluarse individualmente"*)

   Lo que la F18 encontró al revisar animación por animación, convertido en
   reglas para que no vuelva:
     · `icono_que_salta` — dos iconos de sentido contrario que se sustituyen de
       golpe (play/pausa, ⋯/✕, ＋/✓) fuera de `IconoQueCambia`;
     · `marca_que_late_al_montar` — la clase de un latido escrita en el icono:
       late al abrir la pantalla, todas las hechas a la vez (pasaba con el ✓ de
       las tareas del Calendario y de Productividad, y con el de los hábitos);
     · `entrada_que_se_queda` — una animación de `index.css` que termina con
       `both` sin necesitarlo (la regla de la F3): su último fotograma se queda
       puesto. Solo lo justifica terminar en otro sitio que el natural.
   ─────────────────────────────────────────────────────────────────────────── */
export const PARES_DE_ICONOS = Object.freeze([
  ['Play', 'Pause'], ['X', 'MoreHorizontal'], ['X', 'Menu'], ['Check', 'Plus'], ['Check', 'Copy'],
]);

/** Las que terminan con `both` a propósito: su final no es su estado natural. */
export const FINALES_QUE_SE_QUEDAN = Object.freeze({
  'racha-mas-uno': 'El «+1» sube y termina invisible: con `backwards` volvería a verse al acabar.',
});

const lineaDe = (src, i) => src.slice(0, i).split('\n').length;

export function auditarPulido({ archivos = {}, css = '' } = {}) {
  const problemas = [];
  Object.entries(archivos).forEach(([ruta, src]) => {
    if (!/\.jsx$/.test(ruta)) return;
    const limpio = sinComentarios(src);
    PARES_DE_ICONOS.forEach(([a, b]) => {
      const re = new RegExp(`\\?\\s*<(${a}|${b})\\b[^>]*\\/>\\s*:\\s*<(${a}|${b})\\b`, 'g');
      let m;
      while ((m = re.exec(limpio))) {
        if (m[1] === m[2]) continue;
        const antes = limpio.slice(Math.max(0, m.index - 220), m.index);
        if (!/<IconoQueCambia\b[^]*$/.test(antes) || /<\/IconoQueCambia>/.test(antes.slice(antes.lastIndexOf('<IconoQueCambia')))) {
          problemas.push({ regla: 'icono_que_salta', archivo: ruta, linea: lineaDe(limpio, m.index), iconos: [m[1], m[2]] });
        }
      }
    });
    const clases = Object.values(CLASES_LATIDO).join('|');
    const reClase = new RegExp(`className=["'{\`][^"'}\`]*\\b(${clases})\\b`, 'g');
    let m2;
    while ((m2 = reClase.exec(limpio))) problemas.push({ regla: 'marca_que_late_al_montar', archivo: ruta, linea: lineaDe(limpio, m2.index), clase: m2[1] });
  });
  const limpioCss = sinComentarios(css);
  const reBoth = /\.([\w-]+)\s*\{[^}]*animation:[^;]*\bboth\b/g;
  let m3;
  while ((m3 = reBoth.exec(limpioCss))) {
    if (!FINALES_QUE_SE_QUEDAN[m3[1]]) problemas.push({ regla: 'entrada_que_se_queda', archivo: 'src/index.css', linea: lineaDe(limpioCss, m3.index), clase: m3[1] });
  }
  return problemas;
}

/** Cada regla con un ejemplo malo que la caza (una regla que no puede ponerse roja no sirve, EH F42). */
export const EJEMPLOS_MALOS_F18 = Object.freeze([
  { regla: 'icono_que_salta', archivos: { 'src/views/X.jsx': '<button>{p ? <Play size={16} /> : <Pause size={16} />}</button>' } },
  { regla: 'marca_que_late_al_montar', archivos: { 'src/views/X.jsx': '{t.hecha ? <CheckCircle2 size={20} className="tarea-hecha" /> : <Circle size={20} />}' } },
  { regla: 'entrada_que_se_queda', css: '.algo-entra { animation: algoEntra var(--motion-dur-fast) var(--ease-premium) both; }' },
]);

/** Lo que se miró uno a uno y se queda como está, con su motivo (apartado 3). */
export const ATIPICOS_REVISADOS = Object.freeze([
  { que: 'El ✓ de una serie hecha en el entrenamiento en vivo (`fit-serie-hecha`)', decision: 'Se queda', porque: 'Es la entrada de la tabla al abrirse y al marcar: la F37 la declaró así, y la tabla se rehace entera al cambiar de ejercicio.' },
  { que: 'El «+1» de una racha termina con `both`', decision: 'Se queda', porque: 'Termina invisible: con `backwards` volvería a verse al acabar (`FINALES_QUE_SE_QUEDAN`).' },
  { que: 'Pausar o reanudar un hábito (`GhostBtn` con su icono)', decision: 'Se queda', porque: 'La palabra cambia con el icono («Pausar» / «Reanudar»): lo que se lee es el texto, y el botón ya cambia en su sitio (F9).' },
  { que: 'Los ✓ de lectura (Historial, Logros, el resumen al terminar, el detalle de un objetivo)', decision: 'No se animan', porque: 'Dicen cómo está algo, no responden a un toque: un latido ahí sería un efecto gratuito (apartado 49).' },
  { que: 'La ✓ que aparece al poner un fondo en Biblioteca', decision: 'Se queda', porque: 'Es una marca de selección que aparece en una fila nueva; no hay un icono anterior del que cambiar.' },
  { que: 'Ningún parallax', decision: 'No se añade', porque: 'Apartado 40: si existe, sutil. No existe, y añadirlo sería movimiento sin información (apartado 49).' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   7 · LOS TOKENS (apartado 53: *"Eliminar tokens sin uso"*)

   `tokensSinUso` mira cada token de la F1 en tres sitios: una `var()` de
   `index.css`, un valor de `PRESETS_MOTION` y una llamada con su nombre
   (`transicion(…, 'slow')`, `desenfoque('medium')`…); los muelles, en los que
   usa alguna masa (`MUELLES_EN_USO`, F8). Los que no usa nadie hoy los EXIGE el
   enunciado de la F1 (apartado 2: siete duraciones, cinco muelles, cinco
   opacidades), así que se quedan, declarados (C-67). Un token sin uso que no
   esté aquí pone la suite roja: el trinquete es que no nazca otro.
   ─────────────────────────────────────────────────────────────────────────── */
export const TOKENS_DE_RESERVA = Object.freeze({
  'duracion.instant': 'La F1 (apartado 2) exige las siete duraciones; «instantáneo» es lo que vale una transición en «Sin movimiento» (0,01 ms) y lo que sigue siendo cero a cualquier velocidad.',
  'opacidad.full': 'La escala de cinco opacidades de la F1 termina en 1; lo que llega a su sitio llega a la opacidad natural, que es esa.',
  'muelle.bouncy': 'La F1 exige los cinco muelles y la F8 lo usa como el ejemplo medido de lo que rebota: `muelleSinRebote` lo distingue. No lo usa ninguna pieza (apartado 39).',
});

const VAR_DE_GRUPO = {
  duracion: (id) => varDuracion(id), curva: (id) => varCurva(id), distancia: (id) => `--motion-dist-${id}`,
  escala: (id) => `--motion-escala-${id}`, pulso: (id) => `--motion-pulso-${id}`, opacidad: (id) => `--motion-opac-${id}`,
  desenfoque: (id) => `--motion-blur-${id}`,
};
const TABLAS_DE_TOKENS = {
  duracion: DURACIONES_MOTION, curva: CURVAS_MOTION, distancia: DISTANCIAS_MOTION, escala: ESCALAS_MOTION,
  pulso: PULSOS_MOTION, opacidad: OPACIDADES_MOTION, desenfoque: DESENFOQUES_MOTION, muelle: SPRINGS_MOTION,
};

export function tokensSinUso({ css = '', archivos = {} } = {}) {
  const presets = JSON.stringify(PRESETS_MOTION);
  /* MS F20 — lo que NOMBRA una auditoría (una tabla de revisión, un ejemplo malo) no es un uso: el sellado revisa
     `instant` uno a uno, y eso no lo pone a moverse nada. Las auditorías son su capa del mapa (F19). */
  const auditorias = (CAPAS_MOTION.find((c) => c.id === 'auditorias') || { archivos: [] }).archivos;
  const codigo = Object.entries(archivos).filter(([r]) => /\.jsx?$/.test(r) && !/src\/lib\/motion\.js$/.test(r) && !auditorias.includes(r)).map(([, s]) => sinComentarios(s)).join('\n');
  const out = [];
  Object.entries(TABLAS_DE_TOKENS).forEach(([grupo, tabla]) => {
    Object.keys(tabla).forEach((id) => {
      if (grupo === 'muelle') { if (!MUELLES_EN_USO.includes(id)) out.push(`${grupo}.${id}`); return; }
      const v = VAR_DE_GRUPO[grupo](id);
      const enCss = css.includes(`var(${v})`);
      const enPreset = new RegExp(`"(?:duracion|curva|opacidad|x|y|escala|pulso|vaiven)":"-?${id}"`).test(presets);
      const enCodigo = new RegExp(`\\(\\s*(?:[^()]*,\\s*)?'${id}'`).test(codigo) || new RegExp(`[A-Z_]+MOTION\\.${id}\\b`).test(codigo);
      if (!enCss && !enPreset && !enCodigo) out.push(`${grupo}.${id}`);
    });
  });
  return out;
}

/* ───────────────────────────────────────────────────────────────────────────
   8 · LOS GUARDARRAÍLES Y LA REGLA PERMANENTE (apartados 54, 55 y 64)

   Cada «No» del apartado 55 con la auditoría que lo caza y un ejemplo malo que
   la prueba le pasa. Ninguno es nuevo: los cuatro ya los vigilaban la F0 y la F11.
   ─────────────────────────────────────────────────────────────────────────── */
export const GUARDARRAILES_MOTION = Object.freeze([
  { id: 'transition_all', no: '`transition: all` sin justificación', caza: 'auditarMotion → deuda `transition_all` (F0)', ejemplo: { vistas: { 'src/views/X.jsx': '<div className="transition-all" />' } } },
  { id: 'duracion_suelta', no: 'Una duración escrita a mano', caza: 'auditarMotion → deuda `transicion_en_linea` (F0)', ejemplo: { vistas: { 'src/views/X.jsx': "<div style={{ transition: 'opacity 300ms' }} />" } } },
  { id: 'curva_suelta', no: 'Un `cubic-bezier` inventado', caza: 'auditarMotion → `curvasAjenas` (F0)', ejemplo: { css: '.x-y { transition: width 300ms cubic-bezier(0.1, 0.2, 0.3, 0.4); }' } },
  /* El ejemplo se escribe sin el literal de la llamada: escrito tal cual, la auditoría de la F11 lo encontraría
     en ESTE archivo (un ejemplo de una violación no es una violación, EH F48). */
  { id: 'segundo_sistema', no: 'Un segundo sistema de movimiento', caza: 'auditarOrquestacion → una animación por libre fuera del orquestador (F11) y el package.json sin librería de animación (F0)', ejemplo: { archivos: { 'src/components/X.jsx': `export function X() { const r = useRef(); useEffect(() => { ${['r.current', 'animate([{ opacity: 0 }, { opacity: 1 }], 200)'].join('.')}; }, []); return null; }` } } },
]);

/** El API para quien empieza (apartado 54): las seis cosas que hacen falta para no estudiar todo el proyecto. */
export const API_MOTION = Object.freeze([
  { quiero: 'Que algo aparezca y desaparezca', uso: '<Presencia visible entrada="toastEnter" salida="toastExit">', donde: 'src/components/motion.jsx' },
  { quiero: 'Animar una propiedad con los tokens', uso: "transicion('width', 'medium') en el style, o una clase de index.css con var(--motion-dur-medium)", donde: 'src/lib/motion.js' },
  { quiero: 'Una lista que él edita', uso: '<ListaAnimada> con data-flip-id={`x-${id}`} en cada fila', donde: 'src/components/layoutMotion.jsx' },
  { quiero: 'Una cifra que cambia', uso: '<CifraQueCambia valor={n}>{texto}</CifraQueCambia>', donde: 'src/components/motion.jsx' },
  { quiero: 'Una marca o un icono que cambia', uso: '<LatidoAlMarcar activo latido="tarea"> · <IconoQueCambia clave={…}>', donde: 'src/components/motion.jsx' },
  { quiero: 'Animar desde JavaScript', uso: "animarOrquestado(el, fotogramas, opciones, { sistema: 'motor' }) — o animar(el, 'modalEnter')", donde: 'src/lib/orquestadorMotion.js · src/lib/motion.js' },
]);

/** Apartado 64 — las nueve preguntas antes de añadir una animación, cada una con quién la contesta. */
export const REGLA_PERMANENTE_MOTION = Object.freeze([
  { pregunta: '¿Qué comunica?', contesta: 'Su línea del `MOTION_MAP` lleva `funcion`: sin función no entra.' },
  { pregunta: '¿Qué interacción mejora?', contesta: 'El campo `interaccion` de su línea del mapa.' },
  { pregunta: '¿Qué sistema existente debería controlar esto?', contesta: '`SISTEMAS_MOTION` y `duenoDeEntrada` (F11).' },
  { pregunta: '¿Existe ya un patrón equivalente?', contesta: '`LENGUAJE_JOSSTYLE` (esta fase) y `API_MOTION`.' },
  { pregunta: '¿Respeta la personalidad de Jos Style?', contesta: '`auditarLenguaje` (F14): curva de su papel, duración de su talla.' },
  { pregunta: '¿Funciona con reduced motion?', contesta: 'El campo `reducido` de su línea, y los tokens de distancia y escala que en Reducido valen 0 y 1 (F1).' },
  { pregunta: '¿Es suficientemente rápida?', contesta: '`ESCALA_MOVIMIENTO` (F14) y el tope del nivel en `NIVELES_MOTION` (F0).' },
  { pregunta: '¿Puede interrumpirse?', contesta: 'Una transición de CSS sale de donde está; una de JavaScript pasa por `animarOrquestado`, que sale de lo que se ve (F11).' },
  { pregunta: '¿Tiene impacto de rendimiento aceptable?', contesta: '`auditarCosteMotion` y `COSTES_DECLARADOS` (F13).' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   9 · LA AUDITORÍA DEL ENUNCIADO Y LO QUE NO SE HACE
   ─────────────────────────────────────────────────────────────────────────── */
export const AUDITORIA_F18 = Object.freeze([
  { apartados: [1], que: 'Auditoría total', queda: '`auditoriaTotalMotion`: quince auditorías, todas a la vez sobre todo el código que pinta. 🐛 Encontró el «Verificando…» escrito a mano del bloqueo de `App.jsx`.' },
  { apartados: [2, 3], que: 'Inventario y atípicos', queda: '`inventarioMotion` (el censo de la F11, ampliado) y `auditarPulido` (iconos que saltan, marcas que laten al abrir, entradas que se quedan puestas).' },
  { apartados: [4, 5, 49, 50, 51], que: 'Personalidad y temperatura', queda: '`PERSONALIDAD_MOTION`, `EVITAR_MOTION` y `TEMPERATURA_JOSSTYLE`, cada rasgo con su garantía.' },
  { apartados: [6, 7, 8], que: 'Curvas, duraciones y distancia', queda: 'Ya los mide `auditarLenguaje` (F14): la F18 los vuelve a pasar en la auditoría total.' },
  { apartados: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 30], que: 'El lenguaje, familia por familia', queda: '`LENGUAJE_JOSSTYLE`, con la pieza de cada familia buscada en el código.' },
  { apartados: [20, 23], que: 'Iconos y éxito', queda: '🔓 `IconoQueCambia` (play ↔ pausa, ⋯ ↔ ✕, ＋ ↔ ✓) y `LatidoAlMarcar latido="tarea" | "habito"`: el ✓ late al marcarlo, no al abrir la pantalla.' },
  { apartados: [45, 46, 47, 48], que: 'Jerarquía, presupuesto, densidad y primera impresión', queda: '`JERARQUIA_F18` (las prioridades de la F11 agrupadas), `PRESUPUESTOS_F18` y `PRIMERA_IMPRESION`.' },
  { apartados: [52, 53, 63], que: 'Consistencia de código, tokens y limpieza', queda: 'Siete entradas que terminaban con `both` pasan a `backwards`; `tokensSinUso` y `TOKENS_DE_RESERVA` (C-67).' },
  { apartados: [54, 55], que: 'API y guardarraíles', queda: '`API_MOTION` y `GUARDARRAILES_MOTION`, cada uno con el ejemplo malo que su auditoría caza.' },
  { apartados: [56, 57], que: 'Depuración e inspección', queda: '`window.__motion.inspeccionar(el)`: nombre, duración y curva con su token, fuente, sistema, prioridad y elemento. Solo en desarrollo.' },
  { apartados: [58], que: 'Documentación final', queda: '«Jos Style Motion Language» en docs/MOTION_SYSTEM.md.' },
  { apartados: [64], que: 'La regla permanente', queda: '`REGLA_PERMANENTE_MOTION`: las nueve preguntas con quién las contesta.' },
]);

export const NO_EN_F18 = Object.freeze([
  { que: 'Un morfismo de trazos entre iconos', porque: 'Lucide dibuja cada icono aparte: no hay trazos que interpolar sin una librería (F0 la prohíbe). El apartado 20 acepta la transición contextual.' },
  { que: 'Tooltips', porque: 'No hay: en el iPhone no hay puntero que se pose, y la información va escrita (regla 8).' },
  { que: 'Parallax', porque: 'Apartado 40: si existe, sutil. No existe, y añadirlo sería movimiento que no informa (apartado 49).' },
  { que: 'Borrar los tokens sin uso', porque: 'Los exige el enunciado de la F1 (C-67): se declaran y el trinquete impide que nazca otro.' },
  { que: 'Lint y typecheck', porque: 'El proyecto no tiene ninguno (FIT F35, C-48). Lo que vigila es la suite de cada fase y estas auditorías.' },
]);

/** Cuántas cosas promete el lenguaje sin pieza (solo el tooltip, que no existe). */
export const familiasSinPieza = () => LENGUAJE_JOSSTYLE.filter((f) => f.existe !== false && !f.piezas.length).map((f) => f.id);
