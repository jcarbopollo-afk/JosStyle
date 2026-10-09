/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MOTION SYSTEM · F19 — TESTING EXTREMO, VALIDACIÓN, REGRESIÓN Y MOTION QA
 *  (especificaciones/ORIGINAL_MOTION_SYSTEM.txt, líneas 2242–3117)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * *"Sí, sabemos cómo se mueve la aplicación, por qué se mueve, quién controla ese movimiento y cómo
 * sabemos que sigue funcionando."* Dieciocho fases han dejado cada una su suite de Node y su sección del
 * recorrido de Chromium. Lo que faltaba no era otra prueba de cada pieza: era mirar el sistema ENTERO
 * —lo que ninguna fase podía ver desde la suya— y forzarlo donde se rompen los sistemas de verdad:
 * interrumpido, repetido, a medias, girando, sin datos y con valores imposibles.
 *
 * Este archivo es esa mirada. **No lo importa la aplicación** (está en la capa de auditorías de
 * `CAPAS_MOTION`, y la prueba lo comprueba recorriendo los imports desde `main.jsx`): lo leen
 * `scripts/test-motion-f19.mjs` y el recorrido. Lo que hay:
 *
 *   1 · La infraestructura que ya había (apartado 1), dicha por su nombre.
 *   2 · La matriz de QA (apartados 2 y 54): interacción × estado × dispositivo × entrada × preferencia,
 *       cada fila con DÓNDE se prueba —y la suite busca esa comprobación en su archivo—.
 *   3 · La regresión contra todas las fases (apartado 57): la suite y la sección de cada una.
 *   4 · Los tokens (apartados 4-6): referencias rotas, valores repetidos sin querer y literales sueltos.
 *   5 · Los `@keyframes` (apartado 8): repetidos, sin uso, demasiado complejos o que no reposan.
 *   6 · La propiedad de cada animación (apartado 9): el mapa contra el CSS que la mueve.
 *   7 · Las máquinas de estado (apartado 10), recorridas enteras.
 *   8 · La estabilidad de los muelles (apartado 16), barridos con valores extremos.
 *   9 · La salud del sistema (apartado 68): las capas, contra los imports de verdad.
 *  10 · Lo que se fuerza en el recorrido (apartados 11-15, 18, 19, 31, 33, 34), los modos de prueba
 *       (41-43), los hallazgos clasificados (66), lo revisado y bien, lo que no se hace y la regla
 *       permanente (69).
 *
 * 🚨 **UNA PRUEBA DE ESTA FASE TIENE QUE PODER PONERSE ROJA** (apartado 53, *"no crear tests
 * artificiales que solo comprueben que una función existe"*): cada auditoría trae su ejemplo malo en
 * `EJEMPLOS_MALOS_F19`, y la suite comprueba que lo caza.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import {
  DURACIONES_MOTION, CURVAS_MOTION, SPRINGS_MOTION, DISTANCIAS_MOTION, ESCALAS_MOTION, PULSOS_MOTION,
  OPACIDADES_MOTION, DESENFOQUES_MOTION, muestrearSpring, ESTADOS_PRESENCIA, siguientePresencia,
  tokensRaiz, resolverDuraciones,
} from './motion';
import { MOTION_MAP, escanearCss } from './motionMapa';
import { ESTADOS_GESTO, siguienteEstadoGesto, MUELLES_EN_USO, SOBREPASO_MAXIMO } from './fisicaMotion';
import { ESTADOS_ASINCRONOS, TRANSICIONES_ASINCRONAS, siguienteEstadoAsincrono } from './estadosAsincronos';

/* Quita los comentarios conservando los saltos de línea (el número de línea sigue valiendo, FIT F38). */
const sinComentariosJs = (src) => String(src || '')
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`\\])\/\/.*$/gm, (m, a) => a + ' '.repeat(m.length - a.length));
const sinComentariosCss = (css) => String(css || '').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const lineaDe = (src, i) => String(src).slice(0, i).split('\n').length;

/* ───────────────────────────────────────────────────────────────────────────
   1 · LA INFRAESTRUCTURA QUE YA HABÍA (apartado 1)

   *"Antes de crear nada: analizar… No instalar herramientas innecesarias."* No se instala nada: el
   proyecto ya tiene sus cinco piezas, y la sexta (lint y tipos) no existe a propósito (FIT F35 y F44).
   ─────────────────────────────────────────────────────────────────────────── */
export const INFRAESTRUCTURA_PRUEBAS = Object.freeze([
  { id: 'unitarias', hay: true, que: 'Suites de Node, una por fase, con su propio `ok()`: sin framework', donde: 'scripts/test-motion-f0.mjs … scripts/test-motion-f19.mjs', ejecuta: 'node --import ./scripts/resolver-vite.mjs' },
  { id: 'renderizado', hay: true, que: 'El banco de renderizado: cada vista pintada con `react-dom/server`', donde: 'scripts/smoke.mjs', ejecuta: 'node scripts/smoke.mjs' },
  { id: 'invariantes', hay: true, que: 'Las reglas invariantes del código (imports, hex, overlays, manejadores)', donde: 'scripts/test-imports.mjs', ejecuta: 'node scripts/test-imports.mjs' },
  { id: 'e2e', hay: true, que: 'El recorrido de la aplicación de verdad en Chromium, con Supabase doblado', donde: 'scripts/test-app-real.mjs', ejecuta: 'node scripts/test-app-real.mjs' },
  { id: 'e2e_parcial', hay: true, que: 'Una sección del recorrido sola, para iterar (no sustituye a la pasada entera)', donde: 'scripts/recorrido-parcial.mjs', ejecuta: 'node scripts/recorrido-parcial.mjs "/* ── MS F19" 5301' },
  { id: 'build', hay: true, que: 'El build de Vite, con la validación del catálogo de Fitness dentro (FIT F35)', donde: 'vite.config.js', ejecuta: 'npx vite build' },
  { id: 'puerta', hay: true, que: 'La puerta de todo: build, suites, renderizado, invariantes y recorrido, en verde para subir a `main`', donde: 'scripts/verificar.sh', ejecuta: 'bash scripts/verificar.sh' },
  { id: 'lint', hay: false, que: 'Lint', donde: null, porque: 'JosStyle no tiene lint y no se le añade (FIT F35 y F44): lo que vigilaría lo cazan las reglas invariantes y los barridos de cada fase.' },
  { id: 'tipos', hay: false, que: 'Typecheck', donde: null, porque: 'Es JavaScript con JSDoc (FIT F35, apartado 35): migrar a TypeScript sería el «sobreingenierizar» que el proyecto prohíbe.' },
  { id: 'ci', hay: false, que: 'Integración continua', donde: null, porque: 'No hay `.github/workflows`: Josué despliega con Vercel desde `main`, y lo que llega a `main` pasa antes por `verificar.sh` en verde (CLAUDE.md).' },
  { id: 'visual', hay: false, que: 'Regresión visual por capturas', donde: null, porque: 'No hay infraestructura de capturas (apartado 39: «si el proyecto dispone…»), y el apartado 1 prohíbe instalar herramientas innecesarias. Lo visual se mide con `getComputedStyle` y rectángulos, que no dependen de la hora ni del azar (apartado 40).' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   2 · LA MATRIZ DE QA (apartados 2 y 54)

   Una fila por cosa que hay que probar: qué se hace, en qué estado, en qué aparato, con qué se toca, con
   qué preferencia de movimiento y qué tiene que pasar. Y **dónde se prueba**: `prueba.archivo` y un
   trozo de la comprobación (`prueba.marca`) que la suite BUSCA en ese archivo. Una fila que dice estar
   probada y no se encuentra pone la suite roja (es `FLUJOS_F43`, de Fitness, en el movimiento).
   ─────────────────────────────────────────────────────────────────────────── */
/** El orden de cobertura del apartado 54: de lo que más importa a lo que menos. */
export const PRIORIDADES_QA = Object.freeze(['interaccion_critica', 'navegacion', 'estados', 'responsive', 'accesibilidad', 'decorativo']);

const R = 'scripts/test-app-real.mjs';
const N = 'scripts/test-motion-f19.mjs';
export const MATRIZ_QA_MOTION = Object.freeze([
  { id: 'cambiar_seccion', interaccion: 'Tocar una pestaña de la barra', estado: 'reposo', dispositivo: 'iphone', entrada: 'tacto', preferencia: 'normal', esperado: 'La sección entra con un fundido; una sola pantalla montada.', prioridad: 'navegacion', prueba: { archivo: R, marca: 'MS F2 — cambiar de sección' } },
  { id: 'doble_navegacion', interaccion: 'Dos pestañas seguidas, antes de que acabe la primera', estado: 'en transición', dispositivo: 'iphone', entrada: 'tacto', preferencia: 'normal', esperado: 'Acaba en la segunda, determinista: una sola pantalla y nada a medias.', prioridad: 'navegacion', prueba: { archivo: R, marca: 'MS F19, apartado 13' } },
  { id: 'volver_a_mitad', interaccion: 'Entrar en un módulo y volver mientras entra', estado: 'en transición', dispositivo: 'iphone', entrada: 'tacto', preferencia: 'normal', esperado: 'Vuelve al área sin dejar la pantalla de antes a medio pintar ni un transform puesto.', prioridad: 'navegacion', prueba: { archivo: R, marca: 'MS F19, apartado 14' } },
  { id: 'rafaga_hoja', interaccion: 'Abrir y cerrar el ＋ deprisa', estado: 'abriendo / cerrando', dispositivo: 'iphone', entrada: 'tacto', preferencia: 'normal', esperado: 'Ni una ventana ni una copia que se va colgadas; la aplicación responde a la primera.', prioridad: 'interaccion_critica', prueba: { archivo: R, marca: 'MS F11 — …y la aplicación sigue respondiendo' } },
  { id: 'interruptor_rafaga', interaccion: 'Tocar un interruptor cuatro veces seguidas', estado: 'cambiando', dispositivo: 'iphone', entrada: 'tacto', preferencia: 'normal', esperado: 'Acaba como estaba (cuatro es par), con `aria-checked` igual a lo que se ve.', prioridad: 'interaccion_critica', prueba: { archivo: R, marca: 'MS F19, apartado 12' } },
  { id: 'arrastrar_hoja', interaccion: 'Arrastrar una hoja y soltarla, o volver a agarrarla mientras vuelve', estado: 'arrastrando / volviendo', dispositivo: 'iphone', entrada: 'tacto', preferencia: 'normal', esperado: 'El dedo manda: lo que volvía se cancela y la hoja sigue al dedo desde donde se ve.', prioridad: 'interaccion_critica', prueba: { archivo: R, marca: 'MS F11 — ' } },
  { id: 'gesto_estados', interaccion: 'Empezar, pasar el umbral, cancelar y soltar', estado: 'todas las del gesto', dispositivo: 'cualquiera', entrada: 'tacto', preferencia: 'normal', esperado: 'Nunca un estado imposible; desde cualquiera se vuelve al reposo.', prioridad: 'interaccion_critica', prueba: { archivo: N, marca: 'la máquina del gesto' } },
  { id: 'marcar_tarea', interaccion: 'Completar una tarea', estado: 'pendiente → hecha', dispositivo: 'iphone', entrada: 'tacto', preferencia: 'normal', esperado: 'La marca late al marcarla, nunca al abrir la pantalla.', prioridad: 'interaccion_critica', prueba: { archivo: R, marca: 'MS F18' } },
  { id: 'cifra_estres', interaccion: 'Una cifra que cambia 1 → 20 → 5 → 80 → 40 sin esperar', estado: 'contando', dispositivo: 'cualquiera', entrada: 'datos', preferencia: 'normal', esperado: 'Acaba EXACTAMENTE en 40 y suelta su turno de cuenta.', prioridad: 'estados', prueba: { archivo: R, marca: 'MS F19, apartado 33' } },
  { id: 'lista_estres', interaccion: 'Insertar, borrar, reordenar y filtrar una lista a la vez', estado: 'recolocándose', dispositivo: 'cualquiera', entrada: 'datos', preferencia: 'normal', esperado: 'Las filas acaban en el orden de los datos, sin copias que se van ni transforms puestos.', prioridad: 'estados', prueba: { archivo: R, marca: 'MS F19, apartado 34' } },
  { id: 'desmontar_a_mitad', interaccion: 'Quitar una pieza mientras se anima', estado: 'animando', dispositivo: 'cualquiera', entrada: 'datos', preferencia: 'normal', esperado: 'Ni un error, ni un aviso de React, ni una animación que siga viva.', prioridad: 'estados', prueba: { archivo: R, marca: 'MS F19, apartado 31' } },
  { id: 'carrera_peticiones', interaccion: 'Tres peticiones que contestan en otro orden', estado: 'cargando', dispositivo: 'cualquiera', entrada: 'red', preferencia: 'normal', esperado: 'Gana la última pedida; las de antes no tocan la pantalla.', prioridad: 'estados', prueba: { archivo: N, marca: 'las respuestas viejas no tocan la pantalla' } },
  { id: 'sin_conexion', interaccion: 'Guardar sin conexión y volver a tenerla', estado: 'offline → online', dispositivo: 'iphone', entrada: 'red', preferencia: 'normal', esperado: 'Lo pendiente se dice arriba y se manda solo al volver.', prioridad: 'estados', prueba: { archivo: R, marca: 'MS F16' } },
  { id: 'asincrona_estados', interaccion: 'Cargar, fallar, reintentar, cancelar, guardar, perder la conexión', estado: 'todas las asíncronas', dispositivo: 'cualquiera', entrada: 'red', preferencia: 'normal', esperado: 'Cada estado declarado se alcanza, y desde cualquiera se vuelve al reposo.', prioridad: 'estados', prueba: { archivo: N, marca: 'la máquina asíncrona' } },
  { id: 'muelles_extremos', interaccion: 'Un muelle con velocidades y destinos extremos o imposibles', estado: 'soltando', dispositivo: 'cualquiera', entrada: 'tacto', preferencia: 'normal', esperado: 'Ni un NaN, ni un infinito, ni una oscilación que crece; siempre termina.', prioridad: 'interaccion_critica', prueba: { archivo: N, marca: 'ningún muelle devuelve un fotograma que no sea un número' } },
  { id: 'cambiar_tamano', interaccion: 'Cambiar el tamaño de la ventana una y otra vez', estado: 'reposo', dispositivo: 'escritorio ↔ iphone', entrada: 'ratón', preferencia: 'normal', esperado: 'Nada se sale de lado, nada se queda moviéndose con medidas viejas.', prioridad: 'responsive', prueba: { archivo: R, marca: 'MS F19, apartado 18' } },
  { id: 'girar_con_hoja', interaccion: 'Girar el teléfono con una hoja abierta, tres veces', estado: 'hoja abierta', dispositivo: 'iphone vertical ↔ horizontal', entrada: 'tacto', preferencia: 'normal', esperado: 'Una sola hoja, dentro de la pantalla, en cada orientación.', prioridad: 'responsive', prueba: { archivo: R, marca: 'MS F19, apartado 19' } },
  { id: 'teclado', interaccion: 'Abrir y cerrar el teclado en un formulario', estado: 'escribiendo', dispositivo: 'iphone', entrada: 'teclado en pantalla', preferencia: 'normal', esperado: 'La barra de abajo se aparta y vuelve.', prioridad: 'responsive', prueba: { archivo: R, marca: 'MS F15' } },
  { id: 'scroll_rapido', interaccion: 'Subir y bajar deprisa por un área con cabecera fija', estado: 'desplazando', dispositivo: 'iphone', entrada: 'tacto', preferencia: 'normal', esperado: 'La cabecera sigue fija y sin transform acumulado.', prioridad: 'responsive', prueba: { archivo: R, marca: 'MS F19, apartado 50' } },
  { id: 'reducido_recorrido', interaccion: 'Recorrer la aplicación con «Reducir movimiento»', estado: 'cualquiera', dispositivo: 'iphone', entrada: 'tacto', preferencia: 'reducido', esperado: 'Nada se desplaza ni escala, y lo único que repite sin fin son los bucles declarados.', prioridad: 'accesibilidad', prueba: { archivo: R, marca: 'MS F19, apartado 26' } },
  { id: 'sin_movimiento', interaccion: 'Elegir «Sin movimiento»', estado: 'cualquiera', dispositivo: 'iphone', entrada: 'tacto', preferencia: 'off', esperado: 'Todo aparece en su estado final.', prioridad: 'accesibilidad', prueba: { archivo: R, marca: 'MS F1' } },
  { id: 'foco_al_cerrar', interaccion: 'Cerrar una ventana con el teclado', estado: 'ventana abierta', dispositivo: 'escritorio', entrada: 'teclado', preferencia: 'normal', esperado: 'El foco vuelve a quien la abrió.', prioridad: 'accesibilidad', prueba: { archivo: R, marca: 'MS F12' } },
  { id: 'hover_sin_puntero', interaccion: 'Tocar algo que tiene `hover:` en un iPhone', estado: 'reposo', dispositivo: 'iphone', entrada: 'tacto', preferencia: 'normal', esperado: 'El hover no se queda pegado: solo existe con un puntero de verdad.', prioridad: 'accesibilidad', prueba: { archivo: 'scripts/test-motion-f2.mjs', marca: 'hoverOnlyWhenSupported' } },
  { id: 'recorrido_completo', interaccion: 'Arrancar → Inicio → módulo → detalle → editar → guardar → volver → Ajustes → volver', estado: 'una sesión entera', dispositivo: 'iphone', entrada: 'tacto', preferencia: 'normal', esperado: 'Cada paso con el movimiento de su tipo y ninguno a medias.', prioridad: 'navegacion', prueba: { archivo: R, marca: 'MS F19, apartado 56' } },
  { id: 'camara_lenta', interaccion: 'Ver la aplicación a cámara lenta (desarrollo)', estado: 'cualquiera', dispositivo: 'escritorio', entrada: 'ratón', preferencia: 'normal', esperado: 'Todo lo que se mueve va a un cuarto, y al quitarla vuelve a su ritmo sin escuchadores colgados.', prioridad: 'decorativo', prueba: { archivo: R, marca: 'MS F19, apartados 41 y 42' } },
]);

/** Las filas cuya comprobación no se encuentra en su archivo (o cuyo archivo no está). */
export function matrizSinPrueba(matriz = MATRIZ_QA_MOTION, archivos = {}) {
  return matriz.filter((f) => {
    const src = archivos[f.prueba && f.prueba.archivo];
    return typeof src !== 'string' || !f.prueba.marca || !src.includes(f.prueba.marca);
  });
}

/* ───────────────────────────────────────────────────────────────────────────
   3 · LA REGRESIÓN CONTRA TODAS LAS FASES (apartado 57)

   *"Si la numeración real del repositorio difiere: seguir la estructura existente y no duplicar fases."*
   La lista del enunciado (06 Depth … 18 Brand Polish) es la de otra numeración; la de JosStyle es la del
   índice (`docs/13_MOTION_SYSTEM_ORDEN.md`), de la F0 a la F19, y cada fase tiene su suite —que corre
   `verificar.sh`— y su sección del recorrido. La F0 no tiene sección: no pintó nada.
   ─────────────────────────────────────────────────────────────────────────── */
const fase = (n, tema, sinSeccion = null) => Object.freeze({
  fase: n, tema, suite: `scripts/test-motion-f${n}.mjs`, seccion: sinSeccion ? null : `/* ── MS F${n} `, sinSeccion,
});
export const REGRESION_POR_FASE = Object.freeze([
  fase(0, 'Auditoría, mapa y plan', 'La F0 es el mapa y la auditoría: no pintó nada que recorrer.'),
  fase(1, 'El motor: tokens, modos, velocidades y primitivas'),
  fase(2, 'La navegación'),
  fase(3, 'Las microinteracciones'),
  fase(4, 'Los datos que cambian'),
  fase(5, 'Los gestos'),
  fase(6, 'La profundidad y las capas'),
  fase(7, 'La continuidad espacial'),
  fase(8, 'La física y la interacción directa'),
  fase(9, 'Los estados y el feedback'),
  fase(10, 'El diseño que cambia: listas y desplegables'),
  fase(11, 'El orquestador'),
  fase(12, 'La accesibilidad del movimiento'),
  fase(13, 'El rendimiento'),
  fase(14, 'El lenguaje: curvas, ritmo y firma'),
  fase(15, 'El contexto físico: áreas seguras, girar y el teclado'),
  fase(16, 'Los estados del sistema: carga, error, sin conexión y guardado'),
  fase(17, 'Los datos: cifras, barras, gráficas y rankings'),
  fase(18, 'El pulido: el lenguaje de marca'),
  fase(19, 'El QA: estrés, regresión y salud del sistema'),
  fase(20, 'El sellado: contratos, consolidación y la sesión entera'),
]);

/** Las fases a las que les falta algo: la suite, su línea en `verificar.sh` o su sección del recorrido. */
export function regresionIncompleta({ archivos = {}, verificar = '', recorrido = '' } = {}) {
  const faltas = [];
  REGRESION_POR_FASE.forEach((f) => {
    if (typeof archivos[f.suite] !== 'string') faltas.push({ fase: f.fase, falta: 'suite', donde: f.suite });
    if (!verificar.includes(f.suite)) faltas.push({ fase: f.fase, falta: 'verificar', donde: f.suite });
    if (f.seccion && !recorrido.includes(f.seccion)) faltas.push({ fase: f.fase, falta: 'seccion', donde: f.seccion });
    if (!f.seccion && !f.sinSeccion) faltas.push({ fase: f.fase, falta: 'motivo', donde: 'sinSeccion' });
  });
  return faltas;
}

/* ───────────────────────────────────────────────────────────────────────────
   4 · LOS TOKENS (apartados 4, 5 y 6)

   · **Referencias rotas**: un `var(--algo)` que nadie define —ni `index.css`, ni un `style` o un
     `setProperty` de una pieza—. El CSS no se queja: se queda con el valor inicial, y una duración vacía
     es una animación que no existe. Un `var(--motion-dist-${x})` es un prefijo: vale si algún token
     empieza así.
   · **Valores repetidos sin querer**: dos tokens de la misma familia con el mismo valor: uno de los dos
     sobra, y el día que alguien cambie uno las dos cosas que eran iguales dejarán de serlo.
   · **Literales sueltos**: un `250ms` o un `cubic-bezier(…)` fuera de los tokens. Cada uno que haya se
     clasifica (`correcto` · `legacy`); el que no esté clasificado es `accidental` y pone la suite roja.
   Los tokens que se definen y no usa nadie ya los cuenta la F18 (`tokensSinUso`, con su reserva).
   ─────────────────────────────────────────────────────────────────────────── */
/** Lo que define `index.css` (`--x:`) y lo que ponen las piezas a mano (`'--x':`, `setProperty('--x'`). */
export function variablesDefinidas({ css = '', archivos = {} } = {}) {
  const definidas = new Set([...sinComentariosCss(css).matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  Object.entries(archivos).forEach(([a, src]) => {
    if (!/^src\/.*\.(jsx?|mjs)$/.test(a)) return;
    const limpio = sinComentariosJs(src);
    for (const m of limpio.matchAll(/['"`](--[\w-]+)['"`]\s*:/g)) definidas.add(m[1]);
    for (const m of limpio.matchAll(/setProperty\(\s*['"`](--[\w-]+)/g)) definidas.add(m[1]);
  });
  return definidas;
}

/** Los archivos que escriben `var(--…)` como EJEMPLO de lo que cazan (sus ejemplos malos), no como uso. */
export const ARCHIVOS_CON_EJEMPLOS = Object.freeze([
  'src/lib/qaMotion.js', 'src/lib/pulidoMotion.js', 'src/lib/rendimientoMotion.js', 'src/lib/lenguajeMotion.js',
  'src/lib/motionMapa.js', 'src/lib/accesibilidadMotion.js', 'src/lib/responsiveMotion.js', 'src/lib/datosMotion.js',
  'src/lib/estadosAsincronos.js', 'src/lib/orquestadorMotion.js', 'src/lib/feedbackFitness.js', 'src/lib/acabadoFitness.js',
  'src/lib/contratosMotion.js',
]);

export function referenciasRotas({ css = '', archivos = {} } = {}) {
  const definidas = variablesDefinidas({ css, archivos });
  const rotas = [];
  const mirar = (archivo, limpio) => {
    for (const m of limpio.matchAll(/var\(\s*(--[\w-]+)(\$\{)?/g)) {
      const nombre = m[1];
      const ok = m[2] ? [...definidas].some((d) => d.startsWith(nombre) && d.length > nombre.length) : definidas.has(nombre);
      if (!ok) rotas.push({ archivo, linea: lineaDe(limpio, m.index), variable: m[2] ? `${nombre}\${…}` : nombre });
    }
  };
  mirar('src/index.css', sinComentariosCss(css));
  Object.entries(archivos).forEach(([a, src]) => {
    if (!/^src\/.*\.(jsx?|mjs)$/.test(a) || ARCHIVOS_CON_EJEMPLOS.includes(a)) return;
    mirar(a, sinComentariosJs(src));
  });
  return rotas;
}

/* La familia de un token del CSS: lo que va entre `--motion-` y el último guion (`dur`, `curva`…). La
   curva estándar se llama `--ease-premium` desde la Fase N2 (en `motion.js` es `standard`): es de la familia
   de las curvas. */
const familiaCss = (nombre) => {
  if (nombre === '--ease-premium') return 'curva';
  const m = nombre.match(/^--motion-([a-z]+)-/);
  return m ? m[1] : null;
};

/** Los valores de `:root` que se repiten dentro de una familia: dos nombres para lo mismo, uno sobra. */
export function valoresRepetidosCss(css = '') {
  const raiz = (sinComentariosCss(css).match(/:root\s*\{([^}]*)\}/) || [])[1] || '';
  const tokens = [...raiz.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => ({ nombre: m[1], valor: m[2].replace(/\s+/g, ''), familia: familiaCss(m[1]) }))
    .filter((t) => t.familia);
  const grupos = {};
  tokens.forEach((t) => { (grupos[`${t.familia}|${t.valor}`] = grupos[`${t.familia}|${t.valor}`] || []).push(t.nombre); });
  return Object.entries(grupos).filter(([, n]) => n.length > 1).map(([clave, nombres]) => ({ familia: clave.split('|')[0], valor: clave.split('|')[1], nombres }));
}

/** Lo mismo en las tablas de `motion.js`: dos nombres de una familia con el mismo valor. */
export function valoresRepetidosJs(familias = {
  duracion: DURACIONES_MOTION, curva: CURVAS_MOTION, distancia: DISTANCIAS_MOTION, escala: ESCALAS_MOTION,
  pulso: PULSOS_MOTION, opacidad: OPACIDADES_MOTION, desenfoque: DESENFOQUES_MOTION,
  muelle: Object.fromEntries(Object.entries(SPRINGS_MOTION).map(([k, s]) => [k, JSON.stringify(s)])),
}) {
  const repetidos = [];
  Object.entries(familias).forEach(([familia, tabla]) => {
    const por = {};
    Object.entries(tabla || {}).forEach(([nombre, valor]) => { (por[String(valor)] = por[String(valor)] || []).push(nombre); });
    Object.entries(por).filter(([, n]) => n.length > 1).forEach(([valor, nombres]) => repetidos.push({ familia, valor, nombres }));
  });
  return repetidos;
}

/** Cada literal de tiempo o de curva que hay fuera de los tokens, con su clase y su motivo (apartado 6). */
export const LITERALES_CLASIFICADOS = Object.freeze([
  { archivo: 'src/index.css', texto: 'animation-duration: 0.01ms !important', clase: 'correcto', porque: '«Sin movimiento» (`data-motion=\'off\'`): todo a su estado final sin romper los `animationend` que esperan las piezas (F1, apartado 17). No es un token: es la ausencia de movimiento.' },
  { archivo: 'src/index.css', texto: 'animation-delay: 0ms !important', clase: 'correcto', porque: 'La misma regla de «Sin movimiento»: ni un retraso.' },
  { archivo: 'src/index.css', texto: 'transition-duration: 0.01ms !important', clase: 'correcto', porque: 'La misma regla, para las transiciones.' },
  { archivo: 'src/index.css', texto: 'transition-delay: 0ms !important', clase: 'correcto', porque: 'La misma regla, para los retrasos de las transiciones.' },
  { archivo: 'src/index.css', texto: 'animation-delay: 0ms', clase: 'correcto', porque: 'Quita un retraso (el de la cascada al volver a una pantalla, F2): cero no es una duración que tenga que salir de un token.' },
]);

export function literalesSueltos({ css = '', archivos = {} } = {}) {
  const hallados = [];
  const limpio = sinComentariosCss(css);
  /* Fuera de `:root` y de los bloques de modo/velocidad que DEFINEN tokens. */
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(limpio))) {
    const selector = m[1].trim();
    const cuerpo = m[2];
    if (/^(:root|html\[data-(motion|velocidad)[^\]]*\])$/.test(selector.replace(/\s+/g, ' ')) && /--[\w-]+\s*:/.test(cuerpo)) continue;
    for (const d of cuerpo.matchAll(/\b((?:animation|transition)(?:-[a-z-]+)?)\s*:([^;]+)/g)) {
      const valor = d[2];
      const sinVars = valor.replace(/var\([^)]*\)/g, '');
      const tiempo = sinVars.match(/(?:^|[\s,(])(\d*\.?\d+m?s)\b/);
      const curva = /cubic-bezier\(/.test(sinVars);
      if (!tiempo && !curva) continue;
      const texto = `${d[1]}: ${valor.trim()}`;
      const clasificado = LITERALES_CLASIFICADOS.find((l) => l.archivo === 'src/index.css' && texto.startsWith(l.texto));
      hallados.push({ archivo: 'src/index.css', linea: lineaDe(limpio, m.index + m[1].length), texto, clase: clasificado ? clasificado.clase : 'accidental' });
    }
  }
  Object.entries(archivos).forEach(([a, src]) => {
    if (!/^src\/.*\.(jsx?|mjs)$/.test(a) || a === 'src/lib/motion.js' || ARCHIVOS_CON_EJEMPLOS.includes(a)) return;
    const l = sinComentariosJs(src);
    for (const c of l.matchAll(/cubic-bezier\(/g)) {
      const clasificado = LITERALES_CLASIFICADOS.find((x) => x.archivo === a);
      hallados.push({ archivo: a, linea: lineaDe(l, c.index), texto: 'cubic-bezier(…)', clase: clasificado ? clasificado.clase : 'accidental' });
    }
  });
  return hallados;
}

/* ───────────────────────────────────────────────────────────────────────────
   5 · LOS @keyframes (apartado 8)

   · **Repetidos**: dos `@keyframes` con los mismos fotogramas (comparados sin espacios). Uno sobra.
   · **Sin uso**: ninguna regla los nombra en su `animation`. (La F0 caza los huérfanos de su mapa; esto
     mira el CSS entero.)
   · **Demasiado complejos**: más de `MAXIMO_PARADAS` fotogramas. Una animación de interfaz es ir de un
     sitio a otro, como mucho con una parada en medio para el latido de una marca.
   · **Que no reposan**: una ENTRADA (`backwards`) cuyo último fotograma no es el estado de reposo
     —opacidad 1 y sin transformar—. Al acabar, el elemento salta de ese fotograma a su estilo: el
     «salto final» que el apartado 42 quiere que la cámara lenta enseñe.
   ─────────────────────────────────────────────────────────────────────────── */
export const MAXIMO_PARADAS = 4;

/** Los `@keyframes` del CSS con sus paradas (`from`, `50%`, `to`…) y su cuerpo. */
export function keyframesConCuerpo(css = '') {
  const limpio = sinComentariosCss(css);
  const lista = [];
  const re = /@keyframes\s+([\w-]+)\s*\{/g;
  let m;
  while ((m = re.exec(limpio))) {
    let i = re.lastIndex;
    let prof = 1;
    while (prof && i < limpio.length) { if (limpio[i] === '{') prof += 1; else if (limpio[i] === '}') prof -= 1; i += 1; }
    const cuerpo = limpio.slice(re.lastIndex, i - 1);
    const paradas = [...cuerpo.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((p) => ({ cuando: p[1].trim(), estilo: p[2].replace(/\s+/g, ' ').trim() }));
    lista.push({ nombre: m[1], linea: lineaDe(limpio, m.index), cuerpo: cuerpo.replace(/\s+/g, ''), paradas });
  }
  return lista;
}

/* Si un estilo deja el elemento como está en reposo: sin opacidad o a 1, y sin transformar. */
const transformNeutro = (t) => /^(none|translate[XYZ3d]*\(\s*0(px)?\s*(,\s*0(px)?\s*)*\)|scale[XYZ3d]*\(\s*1\s*(,\s*1\s*)*\)|rotate\(\s*0(deg)?\s*\)|\s|)+$/.test(t.trim());
export function reposaEn(estilo = '') {
  const opac = (estilo.match(/(?:^|;)\s*opacity\s*:\s*([^;]+)/) || [])[1];
  const trans = (estilo.match(/(?:^|;)\s*transform\s*:\s*([^;]+)/) || [])[1];
  return (opac === undefined || Number(opac) === 1) && (trans === undefined || transformNeutro(trans));
}

export function auditarKeyframes(css = '') {
  const kfs = keyframesConCuerpo(css);
  const reglas = escanearCss(css).filter((r) => r.tipo === 'animation' && r.keyframe);
  const repetidos = [];
  const vistos = {};
  kfs.forEach((k) => { (vistos[k.cuerpo] = vistos[k.cuerpo] || []).push(k.nombre); });
  Object.values(vistos).filter((n) => n.length > 1).forEach((nombres) => repetidos.push({ nombres }));
  const sinUso = kfs.filter((k) => !reglas.some((r) => r.keyframe === k.nombre)).map((k) => k.nombre);
  const complejos = kfs.filter((k) => k.paradas.length > MAXIMO_PARADAS).map((k) => ({ nombre: k.nombre, paradas: k.paradas.length }));
  const noReposan = [];
  kfs.forEach((k) => {
    const entradas = reglas.filter((r) => r.keyframe === k.nombre && /\bbackwards\b/.test(r.valor) && !/\binfinite\b/.test(r.valor));
    if (!entradas.length) return;
    const ultima = k.paradas.find((p) => /(^|,)\s*(to|100%)\s*($|,)/.test(p.cuando)) || k.paradas[k.paradas.length - 1];
    if (ultima && !reposaEn(ultima.estilo)) noReposan.push({ nombre: k.nombre, ultima: ultima.estilo, selector: entradas[0].selector });
  });
  return { total: kfs.length, repetidos, sinUso, complejos, noReposan };
}

/* ───────────────────────────────────────────────────────────────────────────
   6 · DE QUIÉN ES CADA ANIMACIÓN (apartado 9)

   *"component → motion system → token → trigger. No permitir ownership ambiguo."* El mapa (F0) dice de
   cada animación su componente o su ubicación, su fase, su duración, su curva, su clase y su keyframe; el
   CSS dice lo que de verdad pasa. Esto los compara: **una clase que el mapa describe con otra duración,
   otra curva u otro `@keyframes` que los que le pone el CSS** es una animación de dueño ambiguo —el
   documento que se lee para saber cómo se mueve algo cuenta otra cosa—. Y una clase que dos entradas
   describen distinto, también. Y una curva que el mapa nombra y el CSS no define.
   ─────────────────────────────────────────────────────────────────────────── */
const normalizarCurva = (c) => String(c || '').replace(/^var\((.*)\)$/, '$1').trim();

/* `escanearCss` (F0) lee `animation:` y `transition:`; una regla que solo cambia la duración
   (`transition-duration: var(--motion-dur-medium)`, la de abrir un `Plegable`) también es de su clase. */
function duracionesSueltas(css) {
  const limpio = sinComentariosCss(css);
  const raiz = tokensRaiz(css);
  const lista = [];
  for (const m of limpio.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const d of m[2].matchAll(/\b(?:animation|transition)-duration\s*:([^;]+)/g)) {
      const ms = (resolverDuraciones(d[1], raiz).match(/\d*\.?\d+m?s\b/g) || []).map((x) => (/ms$/.test(x) ? Number(x.slice(0, -2)) : Number(x.slice(0, -1)) * 1000));
      lista.push({ selector: m[1].replace(/\s+/g, ' ').trim(), ms, curvas: [], keyframe: null });
    }
  }
  return lista;
}

export function auditarPropiedad({ css = '', mapa = MOTION_MAP } = {}) {
  const reglas = [...escanearCss(css), ...duracionesSueltas(css)];
  const definidas = variablesDefinidas({ css });
  const discrepancias = [];
  const porClase = {};
  mapa.forEach((e) => {
    /* Una curva que el mapa nombra como token tiene que existir en el CSS: si no, el documento manda a
       buscar algo que no está (era `--motion-curva-standard`, que es el nombre de `motion.js`). */
    if (e.easing && /^--[\w-]+$/.test(e.easing) && !definidas.has(e.easing)) discrepancias.push({ id: e.id, clase: e.clase || null, campo: 'curva_inexistente', mapa: e.easing, css: null });
    if (!e.clase) return;
    String(e.clase).split(/[\s,·]+/).filter(Boolean).forEach((clase) => {
      (porClase[clase] = porClase[clase] || []).push(e);
      /* Las reglas de esa clase: la suya (`.clase`) primero, y las de contexto (`[data-x] > .clase`). */
      const termina = (sel) => sel.split(',').map((s) => s.trim()).some((s) => new RegExp(`\\.${clase}(?![\\w-])[^\\s>+~]*$`).test(s));
      const suyas = reglas.filter((r) => termina(r.selector));
      if (!suyas.length) return;
      const tiempos = [...new Set(suyas.flatMap((r) => r.ms))];
      if (e.duracion != null && tiempos.length && !tiempos.includes(e.duracion)) {
        discrepancias.push({ id: e.id, clase, campo: 'duracion', mapa: e.duracion, css: tiempos });
      }
      const curvas = [...new Set(suyas.flatMap((r) => r.curvas).map(normalizarCurva))];
      if (e.easing && /^--/.test(e.easing) && curvas.length && !curvas.includes(normalizarCurva(e.easing))) {
        discrepancias.push({ id: e.id, clase, campo: 'curva', mapa: e.easing, css: curvas });
      }
      const keyframes = [...new Set(suyas.map((r) => r.keyframe).filter(Boolean))];
      if (e.keyframe && keyframes.length && !keyframes.includes(e.keyframe)) {
        discrepancias.push({ id: e.id, clase, campo: 'keyframe', mapa: e.keyframe, css: keyframes });
      }
    });
  });
  /* Dos entradas de la misma clase que dicen duraciones distintas: las dos no pueden tener razón. */
  const ambiguas = Object.entries(porClase).filter(([, es]) => es.length > 1 && new Set(es.map((e) => e.duracion).filter((d) => d != null)).size > 1)
    .map(([clase, es]) => ({ clase, entradas: es.map((e) => `${e.id}:${e.duracion}`) }));
  const sinDueno = mapa.filter((e) => !e.componente && !e.ubicacion).map((e) => e.id);
  return { discrepancias, ambiguas, sinDueno };
}

/* ───────────────────────────────────────────────────────────────────────────
   7 · LAS MÁQUINAS DE ESTADO (apartado 10)

   *"Probar estados: idle, loading, success, error, retrying, cancelled."* No uno a uno: recorriendo cada
   máquina ENTERA desde su estado inicial con todos sus eventos. Lo que se busca: un estado declarado al
   que no se llega nunca, un evento que lleva a un estado que no existe, un estado desde el que no se
   puede volver al reposo, y un evento desconocido que cambia algo.
   ─────────────────────────────────────────────────────────────────────────── */
export const MAQUINAS_DE_ESTADO = Object.freeze([
  { id: 'presencia', donde: 'src/lib/motion.js · Presencia', estados: ESTADOS_PRESENCIA, inicial: 'oculto', reposo: ['oculto', 'visible'], eventos: ['mostrar', 'ocultar', 'fin'], siguiente: siguientePresencia },
  { id: 'gesto', donde: 'src/lib/fisicaMotion.js · AsaHoja', estados: ESTADOS_GESTO, inicial: 'quieta', reposo: ['quieta', 'cerrada'], eventos: ['empezar', 'pasarUmbral', 'volverDelUmbral', 'soltarVolver', 'soltarCerrar', 'cancelar', 'fin', 'recuperar'], siguiente: siguienteEstadoGesto },
  { id: 'asincrona', donde: 'src/lib/estadosAsincronos.js', estados: ESTADOS_ASINCRONOS.map((e) => e.id), inicial: 'idle', reposo: ['idle', 'success', 'saved', 'cancelled'], eventos: [...new Set(Object.values(TRANSICIONES_ASINCRONAS).flatMap((t) => Object.keys(t)))], siguiente: siguienteEstadoAsincrono },
]);

export function recorrerMaquina(maq) {
  const estados = new Set(maq.estados);
  const alcanzables = new Set([maq.inicial]);
  const aristas = {};
  const invalidos = [];
  const cola = [maq.inicial];
  while (cola.length) {
    const e = cola.shift();
    aristas[e] = new Set();
    maq.eventos.forEach((ev) => {
      const s = maq.siguiente(e, ev);
      if (!estados.has(s)) { invalidos.push({ desde: e, evento: ev, a: s }); return; }
      aristas[e].add(s);
      if (!alcanzables.has(s)) { alcanzables.add(s); cola.push(s); }
    });
  }
  const llegaAlReposo = (desde) => {
    const vistos = new Set([desde]);
    const pila = [desde];
    while (pila.length) {
      const e = pila.pop();
      if (maq.reposo.includes(e)) return true;
      (aristas[e] || []).forEach((s) => { if (!vistos.has(s)) { vistos.add(s); pila.push(s); } });
    }
    return false;
  };
  const desconocido = [...alcanzables].filter((e) => maq.siguiente(e, '__evento_que_no_existe__') !== e);
  return {
    alcanzables: [...alcanzables],
    inalcanzables: maq.estados.filter((e) => !alcanzables.has(e)),
    invalidos,
    sinVuelta: [...alcanzables].filter((e) => !llegaAlReposo(e)),
    desconocido,
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   8 · LA ESTABILIDAD DE LOS MUELLES (apartado 16)

   *"No NaN, no valores infinitos, no overshoot infinito, no oscillation perpetua, no frame loop
   innecesario."* El último no puede pasar por construcción: un muelle de JosStyle se MUESTREA antes de
   animarse (`muestrearSpring`) y la Web Animations API recibe sus fotogramas —no hay un bucle de
   `requestAnimationFrame` que se quede vivo—. Lo demás se barre: cada muelle, con recorridos de un píxel
   a una pantalla, en los dos sentidos, con la velocidad del dedo a tope, y con entradas imposibles.
   ─────────────────────────────────────────────────────────────────────────── */
export function estabilidadDeMuelle(muelle, opciones = {}) {
  const r = muestrearSpring(muelle, opciones);
  const { desde = 0, hasta = 1 } = opciones;
  const destino = Number.isFinite(hasta) ? hasta : (Number.isFinite(desde) ? desde : 0);
  const origen = Number.isFinite(desde) ? desde : destino;
  const recorrido = Math.abs(destino - origen) || 1;
  const v = r.valores;
  let cruces = 0;
  for (let i = 1; i < v.length; i += 1) if ((v[i - 1] - destino) * (v[i] - destino) < 0) cruces += 1;
  const sobrepaso = destino >= origen ? Math.max(0, Math.max(...v) - destino) / recorrido : Math.max(0, destino - Math.min(...v)) / recorrido;
  return {
    finito: v.every(Number.isFinite) && Number.isFinite(r.duracionMs),
    termina: r.duracionMs <= (Number.isFinite(opciones.maxMs) && opciones.maxMs > 0 ? opciones.maxMs : 1200) + 20 && v[v.length - 1] === destino,
    cruces,
    sobrepaso,
    saltoFinal: v.length > 1 ? Math.abs(v[v.length - 2] - destino) / recorrido : 0,
    fotogramas: v.length,
  };
}

/** Los casos del barrido: cada muelle × recorridos × sentidos × velocidades, y los imposibles. */
export function barridoDeMuelles({ muelles = Object.keys(SPRINGS_MOTION) } = {}) {
  const problemas = [];
  const recorridos = [[0, 1], [0, 100], [100, 0], [0, 900], [-400, 0]];
  const velocidades = [0, 2500, -2500];
  muelles.forEach((id) => {
    recorridos.forEach(([desde, hasta]) => velocidades.forEach((velocidad) => {
      const e = estabilidadDeMuelle(id, { desde, hasta, velocidad, reposo: { distancia: 0.25, velocidad: 5 } });
      if (!e.finito || !e.termina) problemas.push({ id, desde, hasta, velocidad, que: !e.finito ? 'no finito' : 'no termina', e });
      /* Ningún muelle de los que se usan rebota (F8): sin velocidad, ni un cruce del destino. */
      if (velocidad === 0 && MUELLES_EN_USO.includes(id) && (e.cruces > 0 || e.sobrepaso > SOBREPASO_MAXIMO)) problemas.push({ id, desde, hasta, velocidad, que: 'rebota', e });
      /* Con la velocidad del dedo a tope, uno de los que se usan puede pasarse un poco, pero no oscilar
         (cruza como mucho dos veces); `bouncy`, que no usa nadie y rebota a propósito (F8), cuatro. */
      if (e.cruces > (MUELLES_EN_USO.includes(id) ? 2 : 4)) problemas.push({ id, desde, hasta, velocidad, que: 'oscila', e });
    }));
  });
  const imposibles = [
    { desde: 0, hasta: 100, velocidad: NaN }, { desde: NaN, hasta: 100 }, { desde: 0, hasta: Infinity },
    { desde: 0, hasta: 100, velocidad: Infinity }, { desde: 0, hasta: 100, fps: 0 }, { desde: 0, hasta: 100, maxMs: -5 },
  ];
  imposibles.forEach((o) => {
    const e = estabilidadDeMuelle('normal', o);
    if (!e.finito || !e.termina) problemas.push({ id: 'normal', ...o, que: 'entrada imposible', e });
  });
  [{ rigidez: 0, amortiguacion: 0, masa: 1 }, { rigidez: 170, amortiguacion: 26, masa: 0 }, { rigidez: 170, amortiguacion: -5, masa: 1 }].forEach((s) => {
    const e = estabilidadDeMuelle(s, { desde: 0, hasta: 100 });
    if (!e.finito || !e.termina || e.sobrepaso > 0.5) problemas.push({ id: JSON.stringify(s), que: 'muelle imposible', e });
  });
  return problemas;
}

/* ───────────────────────────────────────────────────────────────────────────
   9 · LA SALUD DEL SISTEMA: LAS CAPAS (apartado 68)

   *"Motion Tokens → Motion Engine → Motion Orchestrator → Component / Interaction → Layout / Data /
   Navigation, sin sistemas paralelos innecesarios."* Esa flecha es por dónde pasa una animación, y en
   JosStyle se cumple tal cual: una pieza pide al motor (`motion.js`, con los tokens dentro) y el motor
   anima a través del orquestador. ⚠️ **Los imports van al revés que la flecha, y es lo correcto**
   (C-68): el orquestador no conoce los tokens —recibe valores ya resueltos—, así que es una HOJA del
   árbol (sin imports: lo comprueba la F11), el motor lo importa a él, los sistemas importan el motor y
   las piezas importan los sistemas. Nadie importa hacia arriba, y las auditorías no las importa la
   aplicación. Se comprueba contra los imports de verdad, como `CAPAS_FITNESS` (FIT F44).
   ─────────────────────────────────────────────────────────────────────────── */
export const CAPAS_MOTION = Object.freeze([
  { capa: 0, id: 'hojas', que: 'Lo que no importa nada del movimiento: el orquestador y las tablas compartidas', archivos: ['src/lib/orquestadorMotion.js', 'src/lib/umbralesGesto.js', 'src/lib/microinteraccionesMotion.js', 'src/lib/sincronizacion.js'] },
  { capa: 1, id: 'motor', que: 'Los tokens y el motor (presets, primitivas, contexto)', archivos: ['src/lib/motion.js'] },
  { capa: 2, id: 'sistemas', que: 'Cada sistema sobre el motor: gestos, física, datos, diseño, continuidad, capas, estados, navegación, accesibilidad, contexto físico y rendimiento', archivos: [
    'src/lib/gestosMotion.js', 'src/lib/fisicaMotion.js', 'src/lib/datosMotion.js', 'src/lib/layoutMotion.js', 'src/lib/continuidad.js',
    'src/lib/profundidad.js', 'src/lib/estadosAsincronos.js', 'src/lib/transicionNavegacion.js', 'src/lib/accesibilidadMotion.js',
    'src/lib/responsiveMotion.js', 'src/lib/rendimientoMotion.js',
  ] },
  { capa: 3, id: 'piezas', que: 'Los componentes y hooks que usan las pantallas', archivos: [
    'src/components/motion.jsx', 'src/components/gestosMotion.jsx', 'src/components/layoutMotion.jsx', 'src/components/accesibilidadMotion.jsx',
    'src/components/capasMotion.js', 'src/components/navegacionMotion.js', 'src/components/responsiveMotion.js', 'src/components/vacioMotion.js',
    'src/components/continuidad.jsx', 'src/components/estadosAsincronos.jsx',
  ] },
  { capa: 9, id: 'auditorias', que: 'Lo que mira el sistema desde fuera: el mapa, el lenguaje, el pulido y este QA. La aplicación no lo importa.', archivos: ['src/lib/motionMapa.js', 'src/lib/lenguajeMotion.js', 'src/lib/pulidoMotion.js', 'src/lib/qaMotion.js', 'src/lib/contratosMotion.js'] },
]);
export const capaDe = (archivo) => (CAPAS_MOTION.find((c) => c.archivos.includes(archivo)) || {}).capa;

/** Resuelve un import relativo de un archivo de `src/` al archivo de verdad (con su extensión). */
export function resolverImport(desde, especificador, existe) {
  if (!/^\.\.?\//.test(especificador)) return null;
  const partes = desde.split('/').slice(0, -1);
  especificador.split('/').forEach((p) => { if (p === '..') partes.pop(); else if (p !== '.') partes.push(p); });
  const base = partes.join('/');
  return ['', '.js', '.jsx', '.mjs', '/index.js', '/index.jsx'].map((ext) => base + ext).find((c) => existe(c)) || null;
}

/** El grafo de imports (estáticos y dinámicos) de los archivos de `src/`. */
export function grafoDeImports(archivos = {}) {
  const existe = (a) => typeof archivos[a] === 'string';
  const grafo = {};
  Object.entries(archivos).forEach(([a, src]) => {
    if (!/^src\/.*\.(jsx?|mjs)$/.test(a)) return;
    const limpio = sinComentariosJs(src);
    const especs = [...limpio.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|^\s*import\s+)['"]([^'"]+)['"]/gm)].map((m) => m[1]);
    grafo[a] = [...new Set(especs.map((e) => resolverImport(a, e, existe)).filter(Boolean))];
  });
  return grafo;
}

export function alcanzablesDesde(grafo, raiz = 'src/main.jsx') {
  const vistos = new Set([raiz]);
  const pila = [raiz];
  while (pila.length) (grafo[pila.pop()] || []).forEach((s) => { if (!vistos.has(s)) { vistos.add(s); pila.push(s); } });
  return vistos;
}

export function auditarCapas({ archivos = {} } = {}) {
  const grafo = grafoDeImports(archivos);
  const alcanzables = alcanzablesDesde(grafo);
  const declarados = CAPAS_MOTION.flatMap((c) => c.archivos);
  const haciaArriba = [];
  Object.entries(grafo).forEach(([a, deps]) => {
    const ca = capaDe(a);
    if (ca === undefined) return;
    deps.forEach((d) => {
      const cd = capaDe(d);
      if (cd !== undefined && cd > ca) haciaArriba.push({ archivo: a, capa: ca, importa: d, suCapa: cd });
    });
  });
  const hojasConImports = CAPAS_MOTION.find((c) => c.id === 'hojas').archivos
    .filter((a) => (grafo[a] || []).some((d) => capaDe(d) !== undefined));
  const auditoriasEnLaApp = CAPAS_MOTION.find((c) => c.id === 'auditorias').archivos.filter((a) => alcanzables.has(a));
  const sinUsar = CAPAS_MOTION.filter((c) => c.id !== 'auditorias').flatMap((c) => c.archivos).filter((a) => typeof archivos[a] === 'string' && !alcanzables.has(a));
  const noExisten = declarados.filter((a) => typeof archivos[a] !== 'string');
  /* Un archivo de movimiento (por su nombre) que no está en ninguna capa: un sistema paralelo sin dueño. */
  const fueraDelMapa = Object.keys(archivos).filter((a) => /^src\/(lib|components)\/.*[Mm]otion.*\.(jsx?|mjs)$/.test(a) && !declarados.includes(a));
  return { haciaArriba, hojasConImports, auditoriasEnLaApp, sinUsar, noExisten, fueraDelMapa };
}

/* ───────────────────────────────────────────────────────────────────────────
   10 · LO QUE SE FUERZA EN EL RECORRIDO (apartados 11-15, 18, 19, 26, 31, 33, 34, 50 y 56)

   Lo que solo se ve con fotogramas de verdad. Cada línea dice qué se hace y qué tiene que quedar; la
   sección «MS F19» del recorrido lleva su marca.
   ─────────────────────────────────────────────────────────────────────────── */
export const PRUEBAS_DE_ESTRES = Object.freeze([
  { apartado: 12, que: 'Un interruptor, cuatro toques seguidos', queda: 'Como estaba, con `aria-checked` igual a lo que se ve.' },
  { apartado: 13, que: 'Navegar a A y a B antes de que acabe A', queda: 'En B: una sola pantalla, nada a medias.' },
  { apartado: 14, que: 'Entrar y volver mientras entra', queda: 'En el área, sin la pantalla de antes ni un `transform` puesto.' },
  { apartado: 18, que: 'Cambiar el ancho seis veces seguidas', queda: 'Nada se sale de lado y nada se mueve con medidas viejas.' },
  { apartado: 19, que: 'Girar tres veces con una hoja abierta', queda: 'Una sola hoja, dentro de la pantalla.' },
  { apartado: 26, que: 'Recorrer con «Reducir movimiento»', queda: 'Ni un desplazamiento ni una escala, y solo los bucles declarados.' },
  { apartado: 31, que: 'Desmontar una pieza a media animación', queda: 'Ni un error, ni una animación viva, ni una cuenta reservada.' },
  { apartado: 33, que: 'Una cifra 1 → 20 → 5 → 80 → 40 sin esperar', queda: 'Exactamente 40.' },
  { apartado: 34, que: 'Una lista que inserta, borra, reordena y filtra a la vez', queda: 'Las filas en el orden de los datos, sin copias ni transforms.' },
  { apartado: 50, que: 'Subir y bajar deprisa', queda: 'La cabecera fija, sin transform acumulado.' },
  { apartado: 56, que: 'Una sesión entera', queda: 'Cada paso con el movimiento de su tipo.' },
]);

/* Los modos de prueba del apartado 41: ya estaban, menos la cámara lenta. */
export const MODOS_DE_PRUEBA = Object.freeze([
  { id: 'instantaneo', como: '«Sin movimiento» en Ajustes (`html[data-motion=\'off\']`): todo en su estado final', solo: 'Es un ajuste de verdad: también lo usa Josué.' },
  { id: 'normal', como: 'El de siempre', solo: '—' },
  { id: 'lento', como: 'La velocidad «Lenta» (×1,3)', solo: 'Es un ajuste de verdad, para leer mejor: no para depurar.' },
  { id: 'camara_lenta', como: '`window.__motion.camaraLenta(4)` (hasta ×10): todo a un cuarto, también el CSS', solo: 'Solo en desarrollo y con `localStorage["josstyle:motion-debug"] = "1"`: en producción `window.__motion` no existe.' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   11 · LOS HALLAZGOS, CLASIFICADOS (apartados 66 y 67)

   P0 bloquea la interacción · P1 rompe la experiencia · P2 incoherencia visual · P3 pulido. Todos los de
   esta fase se arreglan en ella (apartado 67): ninguno necesitaba una arquitectura nueva.
   ─────────────────────────────────────────────────────────────────────────── */
export const HALLAZGOS_F19 = Object.freeze([
  { id: 'keyframe_repetido', prioridad: 'P3', que: 'Dos `@keyframes` iguales fotograma a fotograma: `iconoCambia` (de la F18) y `fitSerieHecha`', arreglo: 'Uno solo, `marcaAparece`, para el icono que cambia y el ✓ de una serie.', caza: 'auditarKeyframes → repetidos', resuelto: 19 },
  { id: 'mapa_menus', prioridad: 'P2', que: 'El mapa decía 220 ms para los menús «⋯»; su clase (`despliegue-entra`) va en `fast` (160) desde la F3', arreglo: 'El mapa dice 160.', caza: 'auditarPropiedad → duracion', resuelto: 19 },
  { id: 'mapa_plegable', prioridad: 'P2', que: 'El mapa decía 220 ms para `Plegable`, la duración de antes de la F14 (abre en `medium`, 280, y cierra en `fast`, 160)', arreglo: 'El mapa dice 280, la de abrir, y lo explica.', caza: 'auditarPropiedad → duracion', resuelto: 19 },
  { id: 'mapa_cifras', prioridad: 'P3', que: 'El mapa daba a las cifras la curva `--motion-curva-standard`, un nombre que NO existe en el CSS: la curva estándar es `--ease-premium` (en `motion.js` se llama `standard`). Quien buscara ese token no lo encontraba', arreglo: 'Dice `--ease-premium`, la de la regla.', caza: 'auditarPropiedad → curva_inexistente', resuelto: 19 },
  { id: 'offline_inalcanzable', prioridad: 'P2', que: 'El estado asíncrono «Sin conexión» estaba declarado y ningún evento llevaba a él; la operación de la conexión decía pasar por «Reintentando», que es de una carga', arreglo: '`sinConexion` lleva a él desde el reposo, lo cargado, lo guardado, lo cancelado y lo pendiente; la operación pasa por «Guardando».', caza: 'recorrerMaquina → inalcanzables', resuelto: 19 },
  { id: 'cifra_asoma', prioridad: 'P2', que: '`CifraQueCambia` decidía contar en un `useEffect`, DESPUÉS de pintar: el navegador enseñaba un fotograma con el valor nuevo quieto y luego la cuenta volvía al de antes para subir (400 → 100 → 142…), y un relevo enseñaba el número nuevo un fotograma antes de su fundido. La espera fija de 70 ms del recorrido de la F17 lo tapaba', arreglo: 'Se decide antes de pintar (`useEfectoDeDiseno`, como `useFlip`) y el primer fotograma de una cuenta ya escribe el valor de partida.', caza: 'recorrido «MS F17» fotograma a fotograma + `test-motion-f19` (la cifra decide antes de pintar)', resuelto: 19 },
  { id: 'muelle_imposible', prioridad: 'P3', que: '`muestrearSpring` devolvía fotogramas `NaN` con una velocidad, un origen o un destino que no son números o una masa a 0, una duración `Infinity` con `fps` 0 y una oscilación que crecía con una amortiguación negativa', arreglo: 'Lo que no es un número no entra, y lo que no es un muelle es el `normal`. Ningún camino de la aplicación lo pedía hoy (las velocidades del dedo llegan limpias): por eso es P3.', caza: 'barridoDeMuelles → entrada imposible', resuelto: 19 },
]);

/** Lo que se miró y estaba bien, para no volver a barrerlo. */
export const REVISADO_Y_BIEN_F19 = Object.freeze([
  { que: '`transition: all` (apartado 7)', donde: 'Toda `src/`', por: 'Cero. La F0 lo dejó en su deuda a cero (`transition_all`) y el lenguaje de Fitness lo prohíbe (FIT F37).' },
  { que: 'Literales de tiempo y curvas sueltos (apartado 6)', donde: '`index.css` y `src/`', por: 'Solo los cinco de «Sin movimiento» y el retraso a cero de volver, clasificados como correctos. Ni un `cubic-bezier` fuera de los tokens.' },
  { que: '`@keyframes` sin uso u obsoletos (apartado 8)', donde: '`index.css`', por: 'Ninguno: los treinta y tantos los nombra alguna regla.' },
  { que: 'Valores repetidos en las tablas de `motion.js` (apartado 4)', donde: '`DURACIONES_MOTION` … `SPRINGS_MOTION`', por: 'Ninguno: cada nombre de una familia tiene su valor.' },
  { que: 'Animaciones permanentes y pestaña en segundo plano (apartados 47 y 48)', donde: '`BUCLES_INFINITOS` (F12)', por: 'Solo hay dos bucles —el esqueleto y el giro—, los dos ligados a una carga que acaba, y el navegador no pinta una pestaña escondida: ni el CSS ni la Web Animations API corren. Lo que tiene que ser exacto al volver (relojes) va por marcas de tiempo desde la E3 F25.' },
  { que: 'Escuchadores de scroll (apartados 49 y 50)', donde: '`auditarCosteMotion` (F13)', por: 'Todos `passive`, ninguno anima en el escuchador.' },
  { que: 'Bucles de `requestAnimationFrame` que no acaban (apartado 16)', donde: '`muestrearSpring`', por: 'Un muelle se muestrea antes de animarse: la Web Animations API recibe fotogramas, no hay un bucle vivo.' },
  { que: 'Fugas: temporizadores, escuchadores y observadores (apartado 30)', donde: '`auditarOrquestacion` (F11)', por: 'Cada uno con su limpieza, o declarado con su motivo (`LIMPIEZA_DECLARADA`).' },
  { que: 'Hover en táctil (apartado 24)', donde: '`tailwind.config.js`', por: '`hoverOnlyWhenSupported` (F2): `hover:` solo existe con un puntero de verdad.' },
  { que: 'Calidad por aparato (apartados 45 y 46)', donde: '`CALIDADES_MOTION` (F13)', por: 'La calidad sale del modo elegido, y las rebajas son las que se miden (C-64), nunca por el nombre del aparato.' },
]);

/** Lo que esta fase no hace, y por qué. */
export const NO_EN_F19 = Object.freeze([
  { que: 'Capturas de pantalla para regresión visual (apartados 39 y 40)', porque: 'No hay infraestructura y el apartado 1 prohíbe instalar herramientas innecesarias. Lo visual se mide en el recorrido con estilos calculados y rectángulos, que no dependen de la hora, del azar ni de la red.' },
  { que: 'Lint y typecheck (apartado 61)', porque: 'El proyecto no tiene ni uno ni otro (FIT F35 y F44); fingirlos sería la regla 8. La puerta es `verificar.sh`.' },
  { que: 'Probar en aparatos de gama alta, media y baja (apartado 45)', porque: 'Las pruebas corren en un Chromium. Lo que se puede, se hace: la calidad se rebaja por lo que se mide (F13), y la matriz de tamaños (F15) cubre del iPhone de 320 al escritorio.' },
  { que: 'Un overlay pintado encima de la aplicación (apartado 43)', porque: '*"Si ya existe: mejorarlo."* Ya existe la consola (`window.__motion`, F11): se mejora con `inspeccionarTodo()` y `camaraLenta()`. Un overlay pintado tapa justo lo que se quiere mirar.' },
  { que: 'La pasada a mano (apartado 55)', porque: 'Es de Josué, en su iPhone (R1): tocar, deslizar, girar. El recorrido hace la automática (apartado 56) y la matriz dice qué mirar.' },
]);

/** La regla que queda (apartado 69). */
export const REGLA_QA_PERMANENTE = Object.freeze({
  regla: 'Toda función nueva que se mueva pasa, como mínimo, por: una prueba funcional, una de tamaños, una con «Reducir movimiento», una de rendimiento y una mirada visual.',
  como: [
    'Funcional: su suite de Node, o una comprobación en la de su fase.',
    'Tamaños: la matriz de contextos (`CONTEXTOS_FISICOS`, F15) en el recorrido.',
    'Reducido: su regla en `index.css` se queda quieta en Reducido, y el recorrido lo mide.',
    'Rendimiento: si repinta o recoloca, su línea en `COSTES_DECLARADOS` (F13).',
    'Visual: su entrada en `MOTION_MAP` con duración, curva y clase que coincidan con el CSS (`auditarPropiedad`), y una fila en `MATRIZ_QA_MOTION` si es una interacción.',
  ],
});

/** Los ejemplos que cada auditoría TIENE que cazar (apartado 53: una prueba que no puede fallar no sirve). */
export const EJEMPLOS_MALOS_F19 = Object.freeze({
  referenciaRota: { css: ':root { --motion-dur-fast: 160ms; }\n.x { animation: a var(--motion-dur-rapido) linear; }' },
  repetido: { css: ':root { --motion-dur-fast: 160ms; --motion-dur-rapida: 160ms; }' },
  literal: { css: '.x { transition: opacity 250ms ease; }' },
  keyframeRepetido: { css: '@keyframes a { from { opacity: 0; } to { opacity: 1; } }\n@keyframes b { from { opacity: 0; } to { opacity: 1; } }\n.x { animation: a 1s backwards; }\n.y { animation: b 1s backwards; }' },
  keyframeQueNoReposa: { css: '@keyframes c { from { opacity: 0; } to { opacity: 0.9; transform: translateY(2px); } }\n.z { animation: c 1s backwards; }' },
  keyframeComplejo: { css: '@keyframes d { 0% { opacity: 0; } 20% { opacity: 1; } 40% { opacity: 0; } 60% { opacity: 1; } 80% { opacity: 0; } 100% { opacity: 1; } }\n.w { animation: d 1s; }' },
  propiedad: { css: ':root { --motion-dur-fast: 160ms; --motion-curva-entrance: cubic-bezier(0.16, 1, 0.3, 1); }\n.cosa { animation: a var(--motion-dur-fast) var(--motion-curva-entrance) backwards; }', mapa: [{ id: 'cosa', clase: 'cosa', duracion: 220, easing: '--motion-curva-entrance', keyframe: 'a', ubicacion: 'x' }] },
  maquina: { id: 'rota', estados: ['a', 'b', 'c'], inicial: 'a', reposo: ['a'], eventos: ['ir'], siguiente: (e, ev) => (ev === 'ir' && e === 'a' ? 'b' : (ev === 'ir' && e === 'b' ? 'b' : e)) },
});

/* ───────────────────────────────────────────────────────────────────────────
   12 · DÓNDE SE RESUELVE CADA APARTADO, Y EL INFORME
   ─────────────────────────────────────────────────────────────────────────── */
export const AUDITORIA_F19 = Object.freeze([
  { apartados: [1], donde: '`INFRAESTRUCTURA_PRUEBAS`' },
  { apartados: [2, 54], donde: '`MATRIZ_QA_MOTION` + `PRIORIDADES_QA`, y `matrizSinPrueba` busca cada comprobación' },
  { apartados: [3], donde: 'La suite de la F19 prueba las primitivas por sus PROPIEDADES: el muelle, las curvas, la cascada, la interpolación de una cifra y el FLIP' },
  { apartados: [4, 5], donde: '`referenciasRotas`, `valoresRepetidosCss`, `valoresRepetidosJs` (y los sin uso, `tokensSinUso` de la F18)' },
  { apartados: [6, 7], donde: '`literalesSueltos` con `LITERALES_CLASIFICADOS`; `transition: all`, cero (`REVISADO_Y_BIEN_F19`)' },
  { apartados: [8], donde: '`auditarKeyframes`' },
  { apartados: [9], donde: '`auditarPropiedad`' },
  { apartados: [10], donde: '`MAQUINAS_DE_ESTADO` + `recorrerMaquina`' },
  { apartados: [11, 12, 13, 14, 15], donde: 'La sección «MS F19» del recorrido (y la ráfaga y el agarre de la F11)' },
  { apartados: [16], donde: '`barridoDeMuelles` y el arreglo de `muestrearSpring`' },
  { apartados: [17, 18, 19, 20, 21, 22], donde: '`CONTEXTOS_FISICOS` (F15) y la sección «MS F19» (cambiar el ancho, girar con una hoja)' },
  { apartados: [23, 24, 25], donde: '`hoverOnlyWhenSupported` (F2), el foco de la F12 y el teclado de la F15' },
  { apartados: [26], donde: 'La sección «MS F19»: el recorrido en Reducido mira cada animación viva' },
  { apartados: [27, 28, 29, 30], donde: 'F13 (fotogramas y coste) y F11 (fugas); `REVISADO_Y_BIEN_F19`' },
  { apartados: [31, 32, 33, 34], donde: 'La sección «MS F19»: el laboratorio monta las piezas de verdad y las fuerza' },
  { apartados: [35, 36, 37, 38], donde: 'F16 en el recorrido (sin conexión, guardado) y la suite de la F19 (`crearTurnos`: carrera y navegación)' },
  { apartados: [39, 40], donde: '`NO_EN_F19`' },
  { apartados: [41, 42, 43], donde: '`MODOS_DE_PRUEBA`, `camaraLenta` e `inspeccionarTodo` (orquestador)' },
  { apartados: [44, 45, 46, 47, 48, 49, 50, 51], donde: 'F12, F13 y la sección «MS F19»; ni un error en la consola al final del recorrido (FIT F43)' },
  { apartados: [52, 53], donde: '`verificar.sh` y `EJEMPLOS_MALOS_F19`' },
  { apartados: [55, 56], donde: '`NO_EN_F19` (la pasada a mano es de Josué) y el recorrido completo de la sección «MS F19»' },
  { apartados: [57], donde: '`REGRESION_POR_FASE` + `regresionIncompleta`' },
  { apartados: [58, 59], donde: '`docs/MOTION_SYSTEM.md` y `docs/13_MOTION_SYSTEM_ORDEN.md`' },
  { apartados: [60], donde: 'El keyframe repetido fuera; ni una marca temporal ni código de depuración fuera de `depurando()`' },
  { apartados: [61, 62, 63, 64, 65], donde: '`verificar.sh` en verde, con el recorrido entero' },
  { apartados: [66, 67], donde: '`HALLAZGOS_F19`' },
  { apartados: [68], donde: '`CAPAS_MOTION` + `auditarCapas`' },
  { apartados: [69], donde: '`REGLA_QA_PERMANENTE`' },
]);

/** El informe de todo lo que se mira en Node: cada auditoría con su cuenta, y si queda algo. */
export function auditoriaQA({ css = '', archivos = {}, verificar = '', recorrido = '' } = {}) {
  const keyframes = auditarKeyframes(css);
  const propiedad = auditarPropiedad({ css });
  const maquinas = MAQUINAS_DE_ESTADO.map((m) => ({ id: m.id, ...recorrerMaquina(m) }));
  const capas = auditarCapas({ archivos });
  const literales = literalesSueltos({ css, archivos });
  const partes = {
    referenciasRotas: referenciasRotas({ css, archivos }).length,
    valoresRepetidos: valoresRepetidosCss(css).length + valoresRepetidosJs().length,
    literalesAccidentales: literales.filter((l) => l.clase === 'accidental').length,
    keyframesRepetidos: keyframes.repetidos.length,
    keyframesSinUso: keyframes.sinUso.length,
    keyframesComplejos: keyframes.complejos.length,
    keyframesQueNoReposan: keyframes.noReposan.length,
    propiedadAmbigua: propiedad.discrepancias.length + propiedad.ambiguas.length + propiedad.sinDueno.length,
    maquinasRotas: maquinas.reduce((n, m) => n + m.inalcanzables.length + m.invalidos.length + m.sinVuelta.length + m.desconocido.length, 0),
    muellesInestables: barridoDeMuelles().length,
    capasRotas: capas.haciaArriba.length + capas.hojasConImports.length + capas.auditoriasEnLaApp.length + capas.sinUsar.length + capas.noExisten.length + capas.fueraDelMapa.length,
    matrizSinPrueba: matrizSinPrueba(MATRIZ_QA_MOTION, archivos).length,
    regresionIncompleta: regresionIncompleta({ archivos, verificar, recorrido }).length,
  };
  const total = Object.values(partes).reduce((a, b) => a + b, 0);
  return { partes, total, sano: total === 0 };
}
