/* ═══════════════════════════════════════════════════════════════════════════
   MS F20 — EL SELLADO: CONSOLIDACIÓN, CONTRATOS Y EL INFORME FINAL

   *"Esta es la última fase. No consiste en añadir más efectos. Consiste en
   convertir todo lo construido durante las fases anteriores en una
   infraestructura"* (líneas 3118–4045 de `especificaciones/ORIGINAL_MOTION_SYSTEM.txt`).

   Diecinueve fases dejaron cada una su motor, su auditoría, su suite y su sección
   del recorrido. Lo que faltaba era decirlo **una vez**, en el orden en que se lee,
   y que cada «toda animación nueva debe…» del enunciado tenga detrás algo que se
   EJECUTA y se pone rojo. Por eso aquí casi no hay reglas nuevas: hay
   **contratos** que citan la auditoría que ya los vigila, **antipatrones** que se
   le pasan a esa auditoría con su ejemplo malo, y un **sellado** que se calcula de
   todo lo anterior —`MOTION SYSTEM — SEALED` solo si todo sale a cero—.

   Lo que sí nace aquí, porque el apartado 57 lo exige (*"Si alguna regla o
   infraestructura todavía no existe: implementarla ahora"*):
     · `desplazamientosSinToken`: un `translate`/`scale` con un número escrito a
       mano en `index.css` no se quedaba quieto en Reducido y no lo cazaba nadie;
     · `piezasSinRevisarLimpieza`: tres piezas usaban temporizadores u observadores
       sin estar en la revisión de limpieza de la F11 (ya están);
     · `exportacionesMuertas` y `auditarDuplicacion`: lo muerto y lo repetido, entre
       todos los archivos del sistema a la vez;
     · `auditoriaFuenteFinal` (apartado 46): las diez búsquedas del enunciado sobre
       todo lo que pinta, con cada aparición clasificada o en rojo.

   ⚠️ La aplicación NO importa este archivo (capa «auditorías», C-68): lo leen la
   suite de la F20 y el informe. Y sus ejemplos malos van dentro de cadenas: las
   auditorías que leen código quitan las cadenas, y `ARCHIVOS_CON_EJEMPLOS` (F19)
   lo declara.
   ═══════════════════════════════════════════════════════════════════════════ */
import {
  DURACIONES_MOTION, CURVAS_MOTION, SPRINGS_MOTION, DISTANCIAS_MOTION, ESCALAS_MOTION, OPACIDADES_MOTION,
  PULSOS_MOTION, TOPES_ESCALA, MODOS_MOTION, PRESETS_MOTION, muestrearSpring,
} from './motion';
import {
  PRIORIDADES_MOTION, resolverConflicto, CATEGORIAS_TOKENS, PIEZAS_DE_MOVIMIENTO, auditarOrquestacion,
} from './orquestadorMotion';
import { CAPAS_Z, NIVELES_PROFUNDIDAD, REGLAS_PROFUNDIDAD, auditarProfundidad } from './profundidad';
import { TIPOS_NAVEGACION } from './transicionNavegacion';
import { CLASES_DE_CIFRA, MAPA_DATOS } from './datosMotion';
import { MAPA_ASINCRONO, ESTADOS_ASINCRONOS } from './estadosAsincronos';
import { CONTEXTOS_FISICOS, CLASES_AREA_SEGURA, UMBRAL_TECLADO } from './responsiveMotion';
import { UMBRALES_GESTO } from './umbralesGesto';
import { ESTADOS_GESTO, JERARQUIA_MUELLES, MUELLES_EN_USO, SOBREPASO_MAXIMO, sobrepasoDe } from './fisicaMotion';
import { BUCLES_INFINITOS, EJEMPLOS_MALOS_F12, auditarAccesibilidadMotion } from './accesibilidadMotion';
import { auditarCosteMotion } from './rendimientoMotion';
import { auditarEstadosInteraccion } from './estadosInteraccion';
import { auditarMotion } from './motionMapa';
import {
  GUARDARRAILES_MOTION, TOKENS_DE_RESERVA, SISTEMAS_AUDITADOS, auditoriaTotalMotion, codigoQuePinta,
} from './pulidoMotion';
import { CAPAS_MOTION, REGLA_QA_PERMANENTE, MATRIZ_QA_MOTION, auditoriaQA, literalesSueltos } from './qaMotion';

const lista = (x) => (Array.isArray(x) ? x : []);
const sinComentariosCss = (css) => String(css || '').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
const sinComentariosJs = (src) => String(src || '')
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, a) => a + ' '.repeat(m.length - a.length));
/* Lo que el código HACE, sin lo que el código DICE: vacía comentarios, cadenas, plantillas y expresiones
   regulares, conservando las comillas, el código de dentro de un `${…}` y los saltos de línea. Con
   expresiones regulares no se puede: este proyecto mete comillas invertidas dentro de comillas simples por
   todas partes, y un `replace` las empareja mal. Es un lexer pequeño, carácter a carácter. */
const ANTES_DE_REGEX = new Set(['', '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^']);
export function soloCodigo(src) {
  const s = String(src || '');
  let out = '';
  let i = 0;
  let previo = '';
  const llaves = [];
  const blanco = (ch) => (ch === '\n' ? '\n' : ' ');
  /* El cuerpo de una plantilla, desde donde se esté hasta su comilla de cierre o hasta un `${` (cuyo código se
     recorre como código; su `}` vuelve aquí). */
  const cuerpoDePlantilla = () => {
    while (i < s.length) {
      if (s[i] === '\\') { out += blanco(s[i]) + blanco(s[i + 1] || ''); i += 2; continue; }
      if (s[i] === '`') { out += '`'; i += 1; previo = 'x'; return; }
      if (s[i] === '$' && s[i + 1] === '{') { out += '${'; i += 2; llaves.push(0); previo = '{'; return; }
      out += blanco(s[i]); i += 1;
    }
  };
  while (i < s.length) {
    const ch = s[i];
    const sig = s[i + 1];
    if (ch === '/' && sig === '/') { while (i < s.length && s[i] !== '\n') { out += ' '; i += 1; } continue; }
    if (ch === '/' && sig === '*') { const fin = s.indexOf('*/', i + 2); const j = fin === -1 ? s.length : fin + 2; for (; i < j; i += 1) out += blanco(s[i]); continue; }
    if (ch === "'" || ch === '"') {
      out += ch; i += 1;
      while (i < s.length && s[i] !== ch && s[i] !== '\n') { if (s[i] === '\\') { out += ' '; i += 1; } out += blanco(s[i] || ''); i += 1; }
      if (s[i] === ch) { out += ch; i += 1; }
      previo = 'x'; continue;
    }
    if (ch === '`') { out += '`'; i += 1; cuerpoDePlantilla(); continue; }
    if (ch === '/' && ANTES_DE_REGEX.has(previo)) {
      out += '/'; i += 1; let clase = false;
      while (i < s.length && s[i] !== '\n') {
        if (s[i] === '\\') { out += '  '; i += 2; continue; }
        if (s[i] === '[') clase = true; else if (s[i] === ']') clase = false; else if (s[i] === '/' && !clase) break;
        out += ' '; i += 1;
      }
      if (s[i] === '/') { out += '/'; i += 1; }
      previo = 'x'; continue;
    }
    if (llaves.length && ch === '}' && llaves[llaves.length - 1] === 0) { llaves.pop(); out += '}'; i += 1; cuerpoDePlantilla(); continue; }
    if (llaves.length && ch === '{') llaves[llaves.length - 1] += 1;
    if (llaves.length && ch === '}') llaves[llaves.length - 1] -= 1;
    out += ch; i += 1;
    if (!/\s/.test(ch)) previo = /[\w$)\].]/.test(ch) ? 'x' : ch;
  }
  return out;
}
const sinCadenas = (src) => soloCodigo(src);
const lineaDe = (src, i) => src.slice(0, i).split('\n').length;
const exportaNombre = (src, nombre) => new RegExp(`export\\s+(?:const|function|let|class)\\s+${nombre}\\b|export\\s*\\{[^}]*\\b${nombre}\\b[^}]*\\}`).test(String(src || ''));

/* ───────────────────────────────────────────────────────────────────────────
   1 · LA AUDITORÍA FINAL (apartado 1): qué hay, por categoría, en archivos reales
   ─────────────────────────────────────────────────────────────────────────── */
export const INVENTARIO_F20 = Object.freeze([
  { categoria: 'tokens', archivos: ['src/lib/motion.js', 'src/index.css'] },
  { categoria: 'engines', archivos: ['src/lib/motion.js'] },
  { categoria: 'orchestrators', archivos: ['src/lib/orquestadorMotion.js'] },
  { categoria: 'hooks', archivos: ['src/components/motion.jsx', 'src/components/navegacionMotion.js', 'src/components/responsiveMotion.js', 'src/components/capasMotion.js'] },
  { categoria: 'utilities', archivos: ['src/lib/microinteraccionesMotion.js', 'src/lib/umbralesGesto.js', 'src/lib/continuidad.js'] },
  { categoria: 'CSS', archivos: ['src/index.css'] },
  { categoria: 'animations', archivos: ['src/index.css', 'src/lib/motionMapa.js'] },
  { categoria: 'transitions', archivos: ['src/lib/transicionNavegacion.js', 'src/components/continuidad.jsx'] },
  { categoria: 'springs', archivos: ['src/lib/motion.js', 'src/lib/fisicaMotion.js'] },
  { categoria: 'gestures', archivos: ['src/lib/gestosMotion.js', 'src/components/gestosMotion.jsx'] },
  { categoria: 'layout motion', archivos: ['src/lib/layoutMotion.js', 'src/components/layoutMotion.jsx'] },
  { categoria: 'navigation motion', archivos: ['src/lib/transicionNavegacion.js', 'src/components/navegacionMotion.js'] },
  { categoria: 'data motion', archivos: ['src/lib/datosMotion.js', 'src/components/motion.jsx'] },
  { categoria: 'async motion', archivos: ['src/lib/estadosAsincronos.js', 'src/lib/sincronizacion.js', 'src/components/estadosAsincronos.jsx'] },
  { categoria: 'responsive motion', archivos: ['src/lib/responsiveMotion.js', 'src/components/responsiveMotion.js'] },
  { categoria: 'accessibility', archivos: ['src/lib/accesibilidadMotion.js', 'src/components/accesibilidadMotion.jsx'] },
  { categoria: 'performance tooling', archivos: ['src/lib/rendimientoMotion.js'] },
]);

/* ───────────────────────────────────────────────────────────────────────────
   2 · EL MAPA DEFINITIVO (apartado 2): la cadena del enunciado, con los nombres
   que existen. *"No inventar nombres que no existan"*: `simbolosQueNoExisten`
   busca cada uno exportado en su archivo.
   ─────────────────────────────────────────────────────────────────────────── */
export const MAPA_DEFINITIVO = Object.freeze([
  { nivel: 'Motion Tokens', que: 'Duraciones, distancias, escalas, opacidades, cascada y desenfoques: en JavaScript y, los mismos valores, en `:root` de `index.css` (`--motion-*`).',
    simbolos: [['src/lib/motion.js', 'DURACIONES_MOTION'], ['src/lib/motion.js', 'DISTANCIAS_MOTION'], ['src/lib/motion.js', 'ESCALAS_MOTION'], ['src/lib/motion.js', 'OPACIDADES_MOTION'], ['src/lib/motion.js', 'STAGGER_MOTION']] },
  { nivel: 'Motion Curves', que: 'Seis curvas, cada una con su papel (llega, aparece, sale, abre y cierra, momento, reloj).',
    simbolos: [['src/lib/motion.js', 'CURVAS_MOTION'], ['src/lib/lenguajeMotion.js', 'ROLES_MOTION']] },
  { nivel: 'Motion Physics', que: 'Los muelles, muestreados antes de animar, y lo que decide un gesto al soltar.',
    simbolos: [['src/lib/motion.js', 'SPRINGS_MOTION'], ['src/lib/motion.js', 'muestrearSpring'], ['src/lib/fisicaMotion.js', 'JERARQUIA_MUELLES'], ['src/lib/gestosMotion.js', 'decidirSoltar'], ['src/lib/umbralesGesto.js', 'UMBRALES_GESTO']] },
  { nivel: 'Motion Engine', que: 'El contexto (modo y velocidad), los presets y las primitivas que traducen un token a una animación.',
    simbolos: [['src/lib/motion.js', 'contextoMotion'], ['src/lib/motion.js', 'PRESETS_MOTION'], ['src/lib/motion.js', 'transicion'], ['src/lib/motion.js', 'escalonado'], ['src/lib/motion.js', 'animar']] },
  { nivel: 'Motion Orchestrator', que: 'Quién manda cuando dos quieren lo mismo, las secuencias y el dedo por encima de todo.',
    simbolos: [['src/lib/orquestadorMotion.js', 'animarOrquestado'], ['src/lib/orquestadorMotion.js', 'resolverConflicto'], ['src/lib/orquestadorMotion.js', 'planificarLinea'], ['src/lib/orquestadorMotion.js', 'tomarControl']] },
  { nivel: 'Interaction / Component', que: 'Las piezas que usan las pantallas.',
    simbolos: [['src/components/motion.jsx', 'Presencia'], ['src/components/motion.jsx', 'CifraQueCambia'], ['src/components/motion.jsx', 'LatidoAlMarcar'], ['src/components/motion.jsx', 'IconoQueCambia'], ['src/components/motion.jsx', 'ChevronDespliegue'], ['src/components/layoutMotion.jsx', 'ListaAnimada'], ['src/components/layoutMotion.jsx', 'Plegable'], ['src/components/gestosMotion.jsx', 'AsaHoja']] },
  { nivel: 'Navigation / Layout / Data / Async', que: 'Los sistemas: navegación, continuidad, capas, listas, datos, estados del sistema, contexto físico y accesibilidad.',
    simbolos: [['src/lib/transicionNavegacion.js', 'tipoDeNavegacion'], ['src/lib/continuidad.js', 'MAPA_TRANSICIONES'], ['src/components/capasMotion.js', 'useCapasMotion'], ['src/lib/layoutMotion.js', 'planDeLista'], ['src/lib/datosMotion.js', 'CLASES_DE_CIFRA'], ['src/lib/estadosAsincronos.js', 'MAPA_ASINCRONO'], ['src/lib/responsiveMotion.js', 'CONTEXTOS_FISICOS'], ['src/lib/accesibilidadMotion.js', 'intensidadDe']] },
  { nivel: 'Visual Output', que: 'Lo que se pinta: las clases de `index.css` y los dos atributos de `<html>` que escribe `App.jsx` (`data-motion`, `data-velocidad`).',
    simbolos: [['src/lib/motion.js', 'atributoMotion'], ['src/lib/motion.js', 'velocidadMotion'], ['src/lib/motionMapa.js', 'MOTION_MAP']] },
]);

/** Los nombres del mapa que no existen exportados en su archivo (apartado 2: ni uno inventado). */
export function simbolosQueNoExisten(archivos = {}) {
  return MAPA_DEFINITIVO.flatMap((n) => n.simbolos
    .filter(([a, nombre]) => typeof archivos[a] !== 'string' || !exportaNombre(archivos[a], nombre))
    .map(([a, nombre]) => ({ nivel: n.nivel, archivo: a, nombre })));
}

/* ───────────────────────────────────────────────────────────────────────────
   3 · UNA SOLA FUENTE POR CATEGORÍA (apartado 3)

   No hay una tabla nueva: las categorías viven en `CATEGORIAS_TOKENS` (F11) y
   aquí se dice qué AUDITORÍA cazaría una segunda fuente de cada una —sin eso,
   «hay una sola» sería una promesa—.
   ─────────────────────────────────────────────────────────────────────────── */
export const FUENTE_UNICA = Object.freeze([
  { pide: 'durations', categoria: 'duration', segunda: 'Una duración escrita a mano: `literalesSueltos` (F19) en el CSS y en el código, y la deuda de la F0 en las vistas.' },
  { pide: 'easings', categoria: 'easing', segunda: 'Un `cubic-bezier` fuera de los tokens: `literalesSueltos` (F19) y `curvasAjenas` (F0).' },
  { pide: 'springs', categoria: 'spring', segunda: 'Un objeto con `rigidez` y `amortiguacion` fuera de `motion.js`: `auditoriaFuenteFinal` (esta fase).' },
  { pide: 'motion distances', categoria: 'distance', segunda: 'Un `translate` con píxeles escritos a mano en `index.css`: `desplazamientosSinToken` (esta fase).' },
  { pide: 'intensity', categoria: 'motion intensity', segunda: 'Una pantalla que pregunta por su cuenta a `matchMedia`: `auditarAccesibilidadMotion` → `reducir_por_su_cuenta` (F12).' },
  { pide: 'depth', categoria: 'depth', segunda: 'Un `z-index` con número, un velo, un desenfoque o una sombra escritos a mano: `auditarProfundidad` (F6).' },
  { pide: 'stagger', categoria: 'stagger', segunda: 'Una vista que calcula su propio retraso de cascada: la comprobación de la F1, y `literalesSueltos`.' },
  { pide: 'responsive rules', categoria: 'responsive', segunda: 'Un `left` en el `style` de algo fijo, un `86vh` o un escuchador de `resize`: `auditarResponsive` (F15).' },
]);

/** Las categorías que no tienen su fuente declarada, o cuyo nombre no existe donde dice. */
export function fuenteUnicaRota(archivos = {}) {
  return FUENTE_UNICA.flatMap((f) => {
    const c = CATEGORIAS_TOKENS.find((x) => x.categoria === f.categoria);
    if (!c) return [{ pide: f.pide, falta: 'categoria' }];
    if (typeof archivos[c.donde] === 'string' && !exportaNombre(archivos[c.donde], c.nombre)) return [{ pide: f.pide, falta: 'nombre', donde: c.donde, nombre: c.nombre }];
    return [];
  });
}

/* ───────────────────────────────────────────────────────────────────────────
   4 y 5 · LO REPETIDO Y LO MUERTO (apartados 4 y 5)

   Entre TODOS los archivos del sistema a la vez —cada fase miraba los suyos—.
   · Un nombre exportado por dos archivos de movimiento: importar el que no es
     devuelve otra cosa sin fallar (FIT F36).
   · Dos muelles con la misma física, o dos presets que hacen lo mismo.
   · Una exportación que no lee nadie: ni otro archivo, ni una prueba, ni el
     propio archivo. **Se busca por palabras**, también en `scripts/`, porque
     *"no eliminar código que pueda estar siendo utilizado dinámicamente sin
     comprobarlo"*.
   ─────────────────────────────────────────────────────────────────────────── */
export const archivosDelSistema = () => CAPAS_MOTION.flatMap((c) => c.archivos);

export function auditarDuplicacion({ archivos = {} } = {}) {
  const porNombre = new Map();
  archivosDelSistema().forEach((a) => {
    const src = archivos[a];
    if (typeof src !== 'string') return;
    for (const m of sinCadenas(sinComentariosJs(src)).matchAll(/export\s+(?:const|function|let|class)\s+(\w+)/g)) {
      if (!porNombre.has(m[1])) porNombre.set(m[1], []);
      porNombre.get(m[1]).push(a);
    }
  });
  const nombresRepetidos = [...porNombre].filter(([, as]) => new Set(as).size > 1).map(([nombre, as]) => ({ nombre, archivos: [...new Set(as)] }));
  const firma = (s) => `${s.rigidez}/${s.amortiguacion}/${s.masa}`;
  const muelles = Object.entries(SPRINGS_MOTION);
  const muellesIguales = muelles.flatMap(([a, sa], i) => muelles.slice(i + 1).filter(([, sb]) => firma(sa) === firma(sb)).map(([b]) => [a, b]));
  const sinTexto = ({ que, ...resto }) => JSON.stringify(resto);
  const presets = Object.entries(PRESETS_MOTION);
  const presetsIguales = presets.flatMap(([a, pa], i) => presets.slice(i + 1).filter(([, pb]) => sinTexto(pa) === sinTexto(pb)).map(([b]) => [a, b]));
  return { nombresRepetidos, muellesIguales, presetsIguales };
}

/** Los dos archivos que NOMBRAN a propósito lo retirado (para vigilar que no vuelva): de ellos cuenta su
 *  código, no sus cadenas —si no, `COSTES` seguiría «vivo» por la línea que comprueba que se fue—. */
export const NOMBRAN_LO_RETIRADO = Object.freeze(['src/lib/contratosMotion.js', 'scripts/test-motion-f20.mjs']);

/** Las exportaciones de los archivos del sistema que no nombra nadie más que su propia declaración. */
export function exportacionesMuertas({ archivos = {}, otros = {} } = {}) {
  const palabras = (src) => {
    const cuenta = new Map();
    for (const w of String(src || '').match(/[A-Za-z_$][\w$]*/g) || []) cuenta.set(w, (cuenta.get(w) || 0) + 1);
    return cuenta;
  };
  const todos = { ...otros, ...archivos };
  const indice = Object.fromEntries(Object.entries(todos)
    .map(([a, s]) => [a, palabras(NOMBRAN_LO_RETIRADO.includes(a) ? sinCadenas(sinComentariosJs(s)) : s)]));
  return archivosDelSistema().flatMap((a) => {
    const src = archivos[a];
    if (typeof src !== 'string') return [];
    const propios = [...sinCadenas(sinComentariosJs(src)).matchAll(/export\s+(?:const|function|let|class)\s+(\w+)/g)].map((m) => m[1]);
    return propios
      .filter((n) => (indice[a].get(n) || 0) <= 1 && !Object.entries(indice).some(([b, p]) => b !== a && p.has(n)))
      .map((nombre) => ({ archivo: a, nombre }));
  });
}

/* ───────────────────────────────────────────────────────────────────────────
   6 · EL LEGADO: KEEP · MIGRATE · REMOVE (apartados 6 y 7)

   Lo que había antes del Motion System, una línea por cosa. *"No reescribir la
   aplicación completa"*: lo que funciona y ya obedece al sistema se queda; lo que
   duplicaba algo se migró en su fase; lo que no lee nadie se quita aquí. Cada
   REMOVE y cada MIGRATE lleva su comprobación de que ya no está.
   ─────────────────────────────────────────────────────────────────────────── */
export const LEGADO_MOTION = Object.freeze([
  { id: 'ease_premium', que: 'La curva `--ease-premium` (Fase N2)', decision: 'KEEP', porque: 'Es la curva estándar del sistema: `motion.js` la llama `standard` y el CSS la sigue nombrando así. Renombrarla tocaría treinta reglas para nada.' },
  { id: 'module_enter', que: '`module-enter`, la entrada de pantalla (Fase N1/N2)', decision: 'KEEP', porque: 'Es la entrada de la navegación de la F2 (`TIPOS_NAVEGACION.entrar`).' },
  { id: 'animaciones_hc', que: '`ANIMACIONES_HC`, el catálogo de la E3 F14', decision: 'KEEP', porque: 'El mapa se apoya en él y compara sus duraciones (F0): un segundo catálogo con otras duraciones es lo que la FIT F37 cazó.' },
  { id: 'escalera_pulsar', que: 'La escalera `active:scale-*` de `ui.jsx` (EH F50)', decision: 'KEEP', porque: 'La gobierna `index.css` desde la F3 (`ESCALAS_AL_TOCAR`): pulsa en `ultrafast`, vuelve con `entrance` y en Reducido no encoge.' },
  { id: 'feedback_fitness', que: 'Las animaciones de Fitness (`feedbackFitness.js`, FIT F37)', decision: 'KEEP', porque: 'Viven en `index.css`, están en el mapa y terminan con `backwards`: ya hablan el mismo lenguaje.' },
  { id: 'microinteracciones_eh', que: '`microinteracciones.js` (EH F50)', decision: 'KEEP', porque: 'No anima: es el catálogo de respuestas de Imagen personal. La pieza de movimiento es `microinteraccionesMotion.js` (F3).' },
  { id: 'barras_alias', que: '`fit-barra` y `nu-progreso`', decision: 'KEEP', porque: 'Son la misma barra que `barra-progreso` (F17), con el mismo ritmo: renombrarlas tocaría Fitness y Nutrición para nada.' },
  { id: 'tres_interruptores', que: 'Los tres interruptores escritos a mano', decision: 'MIGRATE', fase: 3, porque: 'Uno solo, `Switch` / `PistaInterruptor` (F3).' },
  { id: 'graficas_recharts', que: 'Las gráficas de Recharts con su animación de serie', decision: 'MIGRATE', fase: 4, porque: 'Piden su movimiento al motor con `useAnimacionDeGrafica` (F4).' },
  { id: 'ventanas_de_golpe', que: 'Las ventanas que aparecían de golpe', decision: 'MIGRATE', fase: 6, porque: '`useCapasMotion` les da entrada y salida (F6).' },
  { id: 'data_animaciones', que: 'El atributo `data-animaciones` y su regla de «Sin movimiento»', decision: 'REMOVE', fase: 20, porque: 'Repetía `data-motion=\'off\'`: `desactivadas` ES `off`. Dos atributos para un estado son dos sistemas.' },
  { id: 'data_reducir', que: 'El atributo `data-reducir-movimiento`', decision: 'REMOVE', fase: 20, porque: 'Lo escribía `App.jsx` y desde la F1 no lo leía nadie: «Reducir movimiento» va dentro de `data-motion`.' },
  { id: 'feedback_racha', que: 'Los 900 ms del «+1» de una racha (`DURACION_FEEDBACK_MS`, E3 F2)', decision: 'MIGRATE', fase: 20, porque: 'Eran el token `firma` escrito a mano, y no seguían a la velocidad: la espera sale ahora del token (`esperaDelFeedback`).' },
  { id: 'exportaciones_muertas', que: '`COSTES` (F13) y tres alias de la F14 (`MUELLES_DEL_LENGUAJE`, `NIVELES_DEL_LENGUAJE`, `CURVAS_DEL_LENGUAJE`)', decision: 'REMOVE', fase: 20, porque: 'No los leía nadie: ni otro archivo, ni una prueba, ni el documento.' },
]);

/** Lo que el legado dice que ya no está y sigue estando. */
export function legadoPendiente({ css = '', archivos = {} } = {}) {
  const app = String(archivos['src/App.jsx'] || '');
  const cssLimpio = sinComentariosCss(css);
  const sigue = {
    data_animaciones: /data-animaciones=/.test(cssLimpio) || /dataset\.animaciones\s*=/.test(app),
    data_reducir: /dataset\.reducirMovimiento\s*=/.test(app),
    exportaciones_muertas: [['src/lib/rendimientoMotion.js', 'COSTES'], ['src/lib/lenguajeMotion.js', 'MUELLES_DEL_LENGUAJE'], ['src/lib/lenguajeMotion.js', 'NIVELES_DEL_LENGUAJE'], ['src/lib/lenguajeMotion.js', 'CURVAS_DEL_LENGUAJE']]
      .some(([a, n]) => exportaNombre(archivos[a], n)),
    feedback_racha: /DURACION_FEEDBACK_MS\s*=\s*\d/.test(String(archivos['src/lib/rachasHoy.js'] || ''))
      || /setTimeout\([^;]*DURACION_FEEDBACK_MS\)/.test(String(archivos['src/views/RachasView.jsx'] || '')),
    tres_interruptores: false,
    graficas_recharts: false,
    ventanas_de_golpe: false,
  };
  return LEGADO_MOTION.filter((l) => l.decision !== 'KEEP' && sigue[l.id]).map((l) => l.id);
}

/* ───────────────────────────────────────────────────────────────────────────
   7 bis · LO QUE EL APARTADO 57 MANDA IMPLEMENTAR: dos huecos reales
   ─────────────────────────────────────────────────────────────────────────── */

/** Un `translate` o un `scale` con un valor escrito a mano en `index.css`. En Reducido las DISTANCIAS van a
 *  cero y las ESCALAS a uno (F1): un número a mano se seguiría moviendo. El reposo (`0`, `1`, `-50%` para
 *  centrar) no se mueve y se admite. */
export function desplazamientosSinToken(css = '') {
  const limpio = sinComentariosCss(css);
  const out = [];
  for (const m of limpio.matchAll(/\b(translate[XYZ3d]*|scale[XYZ3d]*)\(([^)]*)\)/g)) {
    const args = m[2];
    if (/var\(/.test(args)) continue;
    const partes = args.split(',').map((p) => p.trim()).filter(Boolean);
    const esTranslate = /^translate/.test(m[1]);
    const mueve = partes.some((p) => (esTranslate ? /^-?\d*\.?\d+(px|rem|em|vh|vw)$/.test(p) && parseFloat(p) !== 0 : Number(p) !== 1));
    if (mueve) out.push({ linea: lineaDe(limpio, m.index), texto: m[0] });
  }
  return out;
}

/** Las piezas del mapa de capas que usan temporizadores, fotogramas, escuchadores u observadores y no están
 *  en la revisión de limpieza de la F11 (`PIEZAS_DE_MOVIMIENTO`): sin ella, una fuga no la vería nadie. */
export function piezasSinRevisarLimpieza({ archivos = {} } = {}) {
  return CAPAS_MOTION.filter((c) => c.id !== 'auditorias').flatMap((c) => c.archivos)
    .filter((a) => typeof archivos[a] === 'string' && !PIEZAS_DE_MOVIMIENTO.includes(a))
    .filter((a) => /\b(setTimeout|requestAnimationFrame|addEventListener)\(|new \w*Observer\(/.test(sinCadenas(sinComentariosJs(archivos[a]))));
}

/* ───────────────────────────────────────────────────────────────────────────
   8-26 · LOS CONTRATOS

   Cada contrato del enunciado, con lo que exige, cómo se cumple en JosStyle y
   SUS GARANTÍAS: qué lo vigila de verdad. Una garantía es una de estas cosas, y
   `contratosSinGarantia` comprueba que existe:
     · `auditoria:<id>` — un sistema de `SISTEMAS_AUDITADOS` (F18), que corre sobre todo lo que pinta;
     · `qa:<parte>` — una cuenta de `auditoriaQA` (F19);
     · `f20:<parte>` — una cuenta de `auditoriaSellado` (esta fase);
     · `recorrido:<marca>` — una sección o una comprobación del recorrido de Chromium;
     · `suite:<archivo>` — una suite que corre `verificar.sh`.
   ─────────────────────────────────────────────────────────────────────────── */
export const GRUPOS_PRIORIDAD = Object.freeze([
  { id: 'P0', nombre: 'Interacción crítica', prioridades: ['critica', 'gesto'] },
  { id: 'P1', nombre: 'Navegación y estado', prioridades: ['navegacion', 'estado'] },
  { id: 'P2', nombre: 'Contextual', prioridades: ['layout', 'micro'] },
  { id: 'P3', nombre: 'Decorativa', prioridades: ['decorativa'] },
]);

export const NIVELES_DE_PROFUNDIDAD_F20 = Object.freeze([
  { pide: 'base', nivel: 0, capa: 'base' },
  { pide: 'raised', nivel: 1, capa: 'elevado' },
  { pide: 'floating', nivel: 2, capa: 'flotante' },
  { pide: 'overlay', nivel: 3, capa: 'capa' },
  { pide: 'modal', nivel: 4, capa: 'capa' },
  { pide: 'system', nivel: 5, capa: 'alerta' },
]);

export const CONTRATOS_MOTION = Object.freeze([
  { apartado: 8, id: 'motion', nombre: 'Contrato de una animación', exige: ['trigger', 'intent', 'priority', 'motion type', 'duration', 'curve/spring', 'accessibility', 'performance', 'interruptibility'],
    como: 'Su línea del `MOTION_MAP` lleva `interaccion` (trigger), `funcion` (intent), `prioridad`, `categoria` y `nivel` (tipo), `duracion`, `easing`/`spring`, `reducido` (accesibilidad) y su coste si repinta (`COSTES_DECLARADOS`); se interrumpe por el CSS o por `animarOrquestado`.',
    garantias: ['auditoria:mapa', 'qa:propiedadAmbigua', 'f20:mapaIncompleto'] },
  { apartado: 9, id: 'componente', nombre: 'Contrato de un componente', exige: ['tokens', 'reduced motion', 'interrupción', 'limpieza', 'responsive', 'sin movimiento innecesario'],
    como: 'Usa una pieza de `motion.jsx`/`layoutMotion.jsx`/`gestosMotion.jsx` o una clase de `index.css`; sus recursos se limpian al desmontar.',
    garantias: ['qa:literalesAccidentales', 'auditoria:accesibilidad', 'auditoria:orquestacion', 'f20:piezasSinRevisar', 'auditoria:responsive', 'auditoria:pulido'] },
  { apartado: 10, id: 'navegacion', nombre: 'Contrato de navegación', exige: ['dirección', 'contexto', 'push/pop', 'back', 'shared element', 'restoration', 'reduced motion'],
    como: '`tipoDeNavegacion` decide entrar (push), volver (pop) o sección; la continuidad apunta su origen (`MAPA_TRANSICIONES`); el scroll se recuerda por pantalla y lo de dentro no repite su entrada al volver.',
    garantias: ['f20:navegacionIncompleta', 'suite:scripts/test-motion-f2.mjs', 'recorrido:/* ── MS F2 ', 'recorrido:/* ── MS F7 '] },
  { apartado: 11, id: 'datos', nombre: 'Contrato de un dato que cambia', exige: ['valor inicial', 'cambio', 'actualización', 'error', 'loading', 'accesibilidad'],
    como: 'Una clase de `CLASES_DE_CIFRA` (nunca cuenta al aparecer, acaba en su texto exacto, decoración para VoiceOver mientras cuenta); su carga y su error son de `MAPA_ASINCRONO`.',
    garantias: ['auditoria:datos', 'f20:datosIncompletos', 'recorrido:/* ── MS F17 '] },
  { apartado: 12, id: 'asincrono', nombre: 'Contrato de una operación asíncrona', exige: ['idle', 'loading', 'success', 'error', 'saving', 'syncing', 'offline', 'retrying', 'cancelled', 'rollback'],
    como: 'Cada operación entra en `MAPA_ASINCRONO` con sus estados, y su máquina se recorre entera (F19). «Rollback» es lo pendiente que se queda con su último valor (F16): no hay una deshacer en el servidor.',
    garantias: ['auditoria:asincronia', 'qa:maquinasRotas', 'f20:asincronoIncompleto'] },
  { apartado: 13, id: 'responsive', nombre: 'Contrato responsive', exige: ['mobile', 'tablet', 'desktop', 'portrait', 'landscape', 'keyboard', 'safe areas'],
    como: 'La matriz `CONTEXTOS_FISICOS` (F15) cubre del iPhone de 320 al escritorio y en horizontal; el teclado es `data-teclado` y las áreas seguras son clases.',
    garantias: ['auditoria:responsive', 'f20:responsiveIncompleto', 'recorrido:/* ── MS F15 '] },
  { apartado: 14, id: 'accesibilidad', nombre: 'Contrato de accesibilidad', exige: ['prefers-reduced-motion', 'el significado se mantiene'],
    como: 'Reducido funde en su sitio (las distancias a cero, las escalas a uno) y el significado lo dicen el texto y el estado, nunca solo el movimiento (F12).',
    garantias: ['auditoria:accesibilidad', 'f20:desplazamientosSinToken', 'recorrido:/* ── MS F12 '] },
  { apartado: 15, id: 'rendimiento', nombre: 'Contrato de rendimiento', exige: ['sin layout ni paint innecesarios', 'sin blur caro', 'sin sombras excesivas', 'sin JS continuo', 'sin estado de React innecesario'],
    como: '`transform` y `opacity`; lo que repinta se declara en `COSTES_DECLARADOS`; una sombra se funde; nada de desenfoques animados ni `will-change`.',
    garantias: ['auditoria:rendimiento', 'recorrido:/* ── MS F13 '] },
  { apartado: 16, id: 'gesto', nombre: 'Contrato de un gesto', exige: ['input', 'threshold', 'velocity', 'cancellation', 'snap', 'interruption', 'reduced motion'],
    como: '`UMBRALES_GESTO` (arranque, velocidad, distancia de cierre), la máquina `ESTADOS_GESTO` (vuelve al soltar sin pasar el umbral), `tomarControl` para el dedo y, en Reducido, sin muelle al soltar.',
    garantias: ['f20:gestoIncompleto', 'qa:maquinasRotas', 'recorrido:/* ── MS F5 ', 'recorrido:/* ── MS F8 '] },
  { apartado: 17, id: 'z_index', nombre: 'Contrato de z-index', exige: ['el sistema existente', 'ni un 99999'],
    como: 'Las capas tienen nombre (`CAPAS_Z`): `z-capa`, `z-flotante`…',
    garantias: ['auditoria:profundidad'] },
  { apartado: 18, id: 'profundidad', nombre: 'Contrato de profundidad', exige: ['base', 'raised', 'floating', 'overlay', 'modal', 'system'],
    como: 'Los seis niveles de `NIVELES_PROFUNDIDAD` (F6), cada uno con su capa, su sombra y su desenfoque.',
    garantias: ['auditoria:profundidad', 'f20:profundidadIncompleta'] },
  { apartado: 19, id: 'prioridad', nombre: 'Contrato de prioridad', exige: ['P0', 'P1', 'P2', 'P3', 'lo de abajo nunca bloquea lo de arriba'],
    como: 'Los siete pesos del orquestador agrupados en P0–P3 (`GRUPOS_PRIORIDAD`); `resolverConflicto` hace que lo de menos peso CEDA y lo de más INTERRUMPA.',
    garantias: ['f20:prioridadesQueBloquean', 'suite:scripts/test-motion-f11.mjs'] },
  { apartado: 20, id: 'interrupcion', nombre: 'Contrato de interrupción', exige: ['al navegar', 'al cambiar de estado', 'al cerrar', 'al volver', 'al empezar otra interacción'],
    como: 'Una transición de CSS sale de donde está; una de JavaScript, del fotograma que se ve (`animarOrquestado`); girar o cambiar el ancho asienta lo que viaja (`asentarMovimiento`).',
    garantias: ['recorrido:MS F19, apartado 13', 'recorrido:MS F19, apartado 14', 'recorrido:/* ── MS F20 '] },
  { apartado: 21, id: 'limpieza', nombre: 'Contrato de limpieza', exige: ['timers', 'RAF', 'listeners', 'observers', 'subscriptions', 'animation callbacks'],
    como: 'Cada pieza limpia lo suyo al desmontar (`auditarOrquestacion`), y toda pieza que lo use entra en esa revisión.',
    garantias: ['auditoria:orquestacion', 'f20:piezasSinRevisar', 'f20:fuenteFinal', 'recorrido:MS F19, apartado 31'] },
  { apartado: 22, id: 'visibilidad', nombre: 'Contrato de visibilidad', exige: ['pausar, reducir o detener lo continuo que no se ve'],
    como: 'Solo hay dos bucles (`BUCLES_INFINITOS`), los dos ligados a una carga que acaba, quietos en Reducido; el navegador no pinta una pestaña escondida.',
    garantias: ['auditoria:accesibilidad', 'f20:buclesSinDeclarar'] },
  { apartado: 23, id: 'fondo', nombre: 'Contrato de fondo', exige: ['ni shimmer', 'ni parallax', 'ni gradientes animados', 'ni partículas', 'ni bucles sin motivo'],
    como: 'Ningún `@keyframes` repite sin fin fuera de `BUCLES_INFINITOS`; ni un parallax (F14).',
    garantias: ['auditoria:accesibilidad', 'f20:buclesSinDeclarar'] },
  { apartado: 24, id: 'reducido', nombre: 'Contrato de Reducido', exige: ['full motion', 'reduced motion', 'static', 'mantener el significado'],
    como: 'Tres escalones de verdad: los modos con desplazamiento (Normal, Premium, Ultra), Reducido (fundidos en su sitio) y «Sin movimiento» (estático). Reducir no es apagar (F1).',
    garantias: ['f20:reducidoIncompleto', 'f20:desplazamientosSinToken', 'recorrido:MS F19, apartado 26'] },
  { apartado: 25, id: 'pruebas', nombre: 'Contrato de pruebas', exige: ['funcional', 'responsive', 'reduced motion', 'interacción', 'regresión visual si importa'],
    como: 'La regla del QA de la F19 (`REGLA_QA_PERMANENTE`) y su matriz (`MATRIZ_QA_MOTION`).',
    garantias: ['qa:matrizSinPrueba', 'qa:regresionIncompleta'] },
  { apartado: 26, id: 'documentacion', nombre: 'Contrato de documentación', exige: ['actualizar MOTION_SYSTEM.md con cada arquitectura nueva', 'decisiones, no líneas'],
    como: '`docs/MOTION_SYSTEM.md` es la fuente oficial, con los quince temas del apartado 48; `docs/MOTION_MAP.md` se genera.',
    garantias: ['f20:documentacionIncompleta'] },
]);

/* ───────────────────────────────────────────────────────────────────────────
   29 · LOS ANTIPATRONES (apartado 29)

   Los diez del enunciado. Cuatro ya eran guardarraíles de la F18 y se usan con
   su ejemplo (`guardarrail`); los otros seis traen el suyo. `cazar` EJECUTA la
   auditoría sobre el ejemplo malo: un antipatrón «documentado» que nadie caza
   sería solo una frase.
   ─────────────────────────────────────────────────────────────────────────── */
const guardarrail = (id) => GUARDARRAILES_MOTION.find((g) => g.id === id) || { ejemplo: {} };
/* Los ejemplos malos se importan de su auditoría: copiados aquí, las auditorías que leen todo `src/` los
   encontrarían en ESTE archivo como si fueran código (un ejemplo de una violación no es una violación, EH F48). */
const ejemploZ = (REGLAS_PROFUNDIDAD.find((r) => r.id === 'z_numerico') || {}).ejemploMalo || '';
export const ANTIPATRONES_MOTION = Object.freeze([
  { id: 'duracion_al_azar', no: 'random duration', guardarrail: 'duracion_suelta', caza: '`auditarMotion` → deuda en línea (F0) y `literalesSueltos` (F19)',
    cazar: ({ css }) => auditarMotion({ css, vistas: guardarrail('duracion_suelta').ejemplo.vistas }).deudaQueCrece.some((d) => /linea/.test(d.tipo))
      && literalesSueltos({ css: '.x { transition: opacity 250ms ease; }' }).some((l) => l.clase === 'accidental') },
  { id: 'curva_al_azar', no: 'random easing', guardarrail: 'curva_suelta', caza: '`auditarMotion` → `curvasAjenas` (F0)',
    cazar: ({ css }) => auditarMotion({ css: `${css}\n${guardarrail('curva_suelta').ejemplo.css}`, vistas: {} }).curvasAjenas.length > 0 },
  { id: 'transition_all', no: 'transition: all', guardarrail: 'transition_all', caza: '`auditarMotion` → deuda `transition_all` (F0) y `auditarCosteMotion` → `transicion_de_todo` (F13)',
    cazar: ({ css }) => auditarMotion({ css, vistas: guardarrail('transition_all').ejemplo.vistas }).deudaQueCrece.some((d) => d.tipo === 'transition_all')
      && auditarCosteMotion({ css: '.algo { transition: all var(--motion-dur-fast) var(--ease-premium); }', fuentes: {} }).problemas.some((p) => p.regla === 'transicion_de_todo') },
  { id: 'z_arbitrario', no: 'z-index arbitrary', caza: '`auditarProfundidad` → `z_numerico` (F6), con el ejemplo de su regla',
    cazar: () => !!ejemploZ && auditarProfundidad({ vistas: { 'src/views/X.jsx': ejemploZ }, css: '' }).some((h) => h.regla === 'z_numerico') },
  { id: 'motor_por_componente', no: 'per-component motion engine', guardarrail: 'segundo_sistema', caza: '`auditarOrquestacion` → `anima_por_su_cuenta` (F11)',
    cazar: () => auditarOrquestacion({ archivos: guardarrail('segundo_sistema').ejemplo.archivos }).cuentas.anima_por_su_cuenta > 0 },
  { id: 'raf_sin_control', no: 'uncontrolled RAF', caza: '`auditarOrquestacion` → `sin_limpieza` (F11) y `piezasSinRevisarLimpieza` (esta fase) para una pieza nueva',
    cazar: () => auditarOrquestacion({ archivos: { 'src/components/motion.jsx': 'let id = requestAnimationFrame(paso);\nfunction paso() { id = requestAnimationFrame(paso); }' } }).cuentas.sin_limpieza > 0
      && piezasSinRevisarLimpieza({ archivos: { 'src/components/vacioMotion.js': '', 'src/lib/datosMotion.js': 'const t = requestAnimationFrame(f);' } }).includes('src/lib/datosMotion.js') },
  { id: 'animacion_permanente', no: 'permanent animation', caza: '`auditarAccesibilidadMotion` → `bucle_sin_estrategia` (F12)',
    cazar: () => auditarAccesibilidadMotion({ css: EJEMPLOS_MALOS_F12.bucle, archivos: {} }).cuentas.bucle_sin_estrategia > 0 },
  { id: 'sin_reducido', no: 'motion without reduced-motion', caza: '`desplazamientosSinToken` (esta fase) y `auditarAccesibilidadMotion` → `scroll_suave_a_mano` (F12)',
    cazar: () => desplazamientosSinToken('@keyframes entra { from { transform: translateY(12px); } to { transform: none; } }').length > 0
      && auditarAccesibilidadMotion({ css: '', archivos: { 'src/views/X.jsx': EJEMPLOS_MALOS_F12.scrollSuave } }).cuentas.scroll_suave_a_mano > 0 },
  { id: 'animacion_que_bloquea', no: 'blocking animation', caza: '`resolverConflicto` (F11): una animación en marcha de menos peso NO detiene a la nueva de más peso (la interrumpe); y un botón que espera no se apaga (`auditarEstadosInteraccion`, F9)',
    cazar: () => resolverConflicto({ prioridad: 'decorativa', propiedades: ['transform'], sistema: 'motor' }, { prioridad: 'navegacion', propiedades: ['transform'], sistema: 'navegacion' }).accion === 'interrumpe'
      && auditarEstadosInteraccion({ vistas: { 'src/views/X.jsx': "<PrimaryButton disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</PrimaryButton>" } }).cuentas.cargando_a_mano > 0 },
  { id: 'adorno_sobre_interaccion', no: 'decorative motion over interaction', caza: '`resolverConflicto` (F11): lo decorativo CEDE ante el gesto, y el dedo toma el control (`tomarControl`)',
    cazar: () => resolverConflicto({ prioridad: 'gesto', propiedades: ['transform'], sistema: 'gestos' }, { prioridad: 'decorativa', propiedades: ['transform'], sistema: 'motor' }).accion === 'cede' },
]);

export const antipatronesQueNoSeCazan = ({ css = '' } = {}) => ANTIPATRONES_MOTION.filter((a) => {
  try { return !a.cazar({ css }); } catch { return true; }
}).map((a) => a.id);

/* ───────────────────────────────────────────────────────────────────────────
   30 · LA REVISIÓN FINAL DE LOS TOKENS (apartado 30)

   *"Adaptar nombres a los tokens reales"*: cada nombre del enunciado, con el de
   JosStyle. Y el que no tiene equivalente se dice (un `spring` no es una curva de
   CSS: es una física que se muestrea en JavaScript).
   ─────────────────────────────────────────────────────────────────────────── */
export const REVISION_TOKENS = Object.freeze({
  duracion: [['instant', 'instant'], ['micro', 'ultraFast'], ['short', 'fast'], ['standard', 'normal'], ['long', 'slow'], ['contextual', 'momento']],
  curva: [['standard', 'standard'], ['enter', 'entrance'], ['exit', 'exit'], ['emphasized', 'emphasized'], ['spring', null]],
  distancia: [['micro', 'micro'], ['short', 'small'], ['medium', 'medium'], ['large', 'large']],
  escala: [['press', 'normal'], ['contextual', 'subtle'], ['modal', 'superficie'], ['emphasis', 'marca']],
  opacidad: [['subtle', 'subtle'], ['standard', 'visible'], ['hidden', 'hidden']],
});
const TABLA_DE = {
  duracion: DURACIONES_MOTION, curva: CURVAS_MOTION, distancia: DISTANCIAS_MOTION, opacidad: OPACIDADES_MOTION,
  escala: { ...ESCALAS_MOTION, ...TOPES_ESCALA },
};
const VARIABLE_DE = { duracion: 'dur', curva: 'curva', distancia: 'dist', opacidad: 'opac', escala: 'escala' };

/** Los nombres reales de la revisión que no existen en `motion.js` o —si son tokens de CSS— en `:root`. */
export function tokensRevisadosQueNoExisten(css = '') {
  const limpio = sinComentariosCss(css);
  const faltan = [];
  Object.entries(REVISION_TOKENS).forEach(([familia, pares]) => pares.forEach(([pide, real]) => {
    if (real === null) return;
    if (!(real in TABLA_DE[familia])) { faltan.push({ familia, pide, real, falta: 'motion.js' }); return; }
    /* En el CSS los nombres van en minúsculas (`ultraFast` → `--motion-dur-ultrafast`). */
    const enCss = familia === 'escala' && TOPES_ESCALA[real] ? true : new RegExp(`--motion-${VARIABLE_DE[familia]}-${real.toLowerCase()}\\s*:`).test(limpio)
      || (familia === 'curva' && real === 'standard' && /--ease-premium\s*:/.test(limpio));
    if (!enCss) faltan.push({ familia, pide, real, falta: 'index.css' });
  }));
  return faltan;
}

/* ───────────────────────────────────────────────────────────────────────────
   31 · LOS MUELLES (apartado 31): cada uno con su propósito, ninguno eterno, y
   los que se usan sin rebote. `bouncy` no lo usa nadie y SE QUEDA: la F1 exige
   los cinco y la F8 lo usa como el contraejemplo medido de lo que rebota —sin él
   `muelleSinRebote` no podría ponerse rojo—. Es su propósito (C-69).
   ─────────────────────────────────────────────────────────────────────────── */
export const REPOSO_MAXIMO_MS = 1100;
export function muellesSinProposito() {
  return Object.keys(SPRINGS_MOTION).flatMap((id) => {
    const problemas = [];
    const papel = JERARQUIA_MUELLES.find((j) => j.muelle === id);
    if (!papel && !TOKENS_DE_RESERVA[`muelle.${id}`]) problemas.push('sin_proposito');
    const m = muestrearSpring(id, { desde: 0, hasta: 1 });
    if (!(m.duracionMs > 0 && m.duracionMs <= REPOSO_MAXIMO_MS)) problemas.push('reposo_eterno');
    if (MUELLES_EN_USO.includes(id) && sobrepasoDe(id) > SOBREPASO_MAXIMO) problemas.push('rebota');
    return problemas.map((p) => ({ muelle: id, problema: p, duracionMs: m.duracionMs }));
  });
}

/* ───────────────────────────────────────────────────────────────────────────
   Las comprobaciones de cada contrato que no tenía ya una auditoría propia
   ─────────────────────────────────────────────────────────────────────────── */
export const CAMPOS_CONTRATO_MAPA = Object.freeze(['interaccion', 'funcion', 'prioridad', 'categoria', 'nivel', 'duracion', 'easing', 'reducido']);
export function comprobacionesDeContrato({ css = '', mapa } = {}) {
  const entradas = lista(mapa);
  const mapaIncompleto = entradas.filter((e) => CAMPOS_CONTRATO_MAPA.some((c) => e[c] === undefined || e[c] === '')).map((e) => e.id);
  const navegacionIncompleta = ['entrar', 'volver', 'seccion'].filter((t) => {
    const n = TIPOS_NAVEGACION[t];
    return !n || !n.clase || !n.preset || !n.movimiento || !n.scroll || !PRESETS_MOTION[n.preset] || !new RegExp(`\\.${n.clase}\\b`).test(css);
  });
  const datosIncompletos = [
    ...CLASES_DE_CIFRA.filter((c) => !c.id || !c.como || (c.modo !== undefined && !['cuenta', 'relevo', 'quieta', null].includes(c.modo))).map((c) => c.id || '?'),
    ...(lista(MAPA_DATOS).length ? [] : ['MAPA_DATOS vacío']),
  ];
  const conocidos = new Set(ESTADOS_ASINCRONOS.map((e) => e.id));
  const asincronoIncompleto = MAPA_ASINCRONO.filter((o) => !lista(o.estados).length || o.estados.some((e) => !conocidos.has(e))
    || !o.estados.some((e) => ['success', 'saved'].includes(e))).map((o) => o.id);
  const ids = CONTEXTOS_FISICOS.map((c) => c.id);
  const responsiveIncompleto = [
    ...(ids.some((i) => /^iphone/.test(i)) ? [] : ['mobile']), ...(ids.some((i) => /^ipad/.test(i)) ? [] : ['tablet']),
    ...(ids.some((i) => /^escritorio/.test(i)) ? [] : ['desktop']), ...(ids.includes('horizontal') ? [] : ['landscape']),
    ...(Number.isFinite(UMBRAL_TECLADO) ? [] : ['keyboard']), ...(lista(CLASES_AREA_SEGURA).length ? [] : ['safe areas']),
  ];
  const gestoIncompleto = [
    ...['arranque', 'velocidadCierre', 'distanciaCierre', 'distanciaCambio', 'bordeSistema'].filter((k) => !Number.isFinite(UMBRALES_GESTO[k])),
    ...['arrastrando', 'umbral', 'volviendo', 'cerrando'].filter((e) => !ESTADOS_GESTO.includes(e)),
  ];
  const capas = new Set(CAPAS_Z.map((c) => c.id));
  const profundidadIncompleta = NIVELES_DE_PROFUNDIDAD_F20.filter((p) => !capas.has(p.capa) || !NIVELES_PROFUNDIDAD.some((n) => n.nivel === p.nivel)).map((p) => p.pide);
  const pesos = PRIORIDADES_MOTION.map((p) => p.id);
  const agrupadas = GRUPOS_PRIORIDAD.flatMap((g) => g.prioridades);
  const prioridadesQueBloquean = [
    ...pesos.filter((p) => !agrupadas.includes(p)).map((p) => `sin grupo: ${p}`),
    ...pesos.flatMap((a) => pesos.filter((b) => b !== a).flatMap((b) => {
      const r = resolverConflicto({ prioridad: a, propiedades: ['transform'], sistema: 'x' }, { prioridad: b, propiedades: ['transform'], sistema: 'y' });
      const pa = PRIORIDADES_MOTION.find((p) => p.id === a).peso;
      const pb = PRIORIDADES_MOTION.find((p) => p.id === b).peso;
      return pb > pa && r.accion !== 'interrumpe' ? [`${a} bloquea a ${b}`] : [];
    })),
  ];
  const conInfinito = [...sinComentariosCss(css).matchAll(/animation\s*:[^;{}]*\binfinite\b[^;{}]*;/g)]
    .map((m) => (m[0].match(/animation\s*:\s*([\w-]+)/) || [])[1]).filter(Boolean);
  const buclesSinDeclarar = [...new Set(conInfinito)].filter((k) => !BUCLES_INFINITOS.some((b) => b.keyframe === k));
  const conDesplazamiento = MODOS_MOTION.filter((m) => m.espacial).map((m) => m.id);
  const reducidoIncompleto = [
    ...(conDesplazamiento.length ? [] : ['full motion']),
    ...(MODOS_MOTION.some((m) => m.id === 'reducido' && !m.espacial && m.intensidad === 0) ? [] : ['reduced motion']),
    ...(MODOS_MOTION.some((m) => m.id === 'off') ? [] : ['static']),
  ];
  return { mapaIncompleto, navegacionIncompleta, datosIncompletos, asincronoIncompleto, responsiveIncompleto, gestoIncompleto, profundidadIncompleta, prioridadesQueBloquean, buclesSinDeclarar, reducidoIncompleto };
}

/* ───────────────────────────────────────────────────────────────────────────
   33-39 · LAS REVISIONES FINALES: cada cosa que el enunciado manda comprobar,
   con la suite y la sección del recorrido que la prueban.
   ─────────────────────────────────────────────────────────────────────────── */
const rev = (apartado, que, items, suite, seccion) => Object.freeze({ apartado, que, items, suite, seccion });
export const REVISIONES_FINALES = Object.freeze([
  rev(33, 'Transiciones', ['forward', 'back', 'modal', 'sheet', 'popover', 'tab', 'detail', 'shared element'], 'scripts/test-motion-f7.mjs', '/* ── MS F7 '),
  rev(33, 'Transiciones (navegación)', ['forward', 'back', 'tab'], 'scripts/test-motion-f2.mjs', '/* ── MS F2 '),
  rev(33, 'Transiciones (capas)', ['modal', 'sheet', 'popover'], 'scripts/test-motion-f6.mjs', '/* ── MS F6 '),
  rev(34, 'Gestos', ['touch', 'pointer', 'swipe', 'drag', 'dismiss', 'snap', 'cancellation'], 'scripts/test-motion-f8.mjs', '/* ── MS F8 '),
  rev(35, 'Datos', ['counters', 'charts', 'progress', 'ranking', 'filtering', 'sorting', 'realtime'], 'scripts/test-motion-f17.mjs', '/* ── MS F17 '),
  rev(36, 'Asíncrono', ['loading', 'error', 'retry', 'saving', 'sync', 'offline', 'reconnect', 'rollback'], 'scripts/test-motion-f16.mjs', '/* ── MS F16 '),
  rev(37, 'Responsive', ['mobile', 'tablet', 'desktop', 'portrait', 'landscape', 'keyboard', 'safe areas', 'viewport changes'], 'scripts/test-motion-f15.mjs', '/* ── MS F15 '),
  rev(38, 'Accesibilidad', ['reduced motion', 'focus', 'keyboard', 'screen reader semantics', 'touch targets', 'no motion-dependent information'], 'scripts/test-motion-f12.mjs', '/* ── MS F12 '),
  rev(39, 'Rendimiento', ['frame rate', 'main thread', 'memory', 'RAF', 'layout', 'paint', 'GPU', 'battery', 'low-end'], 'scripts/test-motion-f13.mjs', '/* ── MS F13 '),
  rev(40, 'La sesión entera, en cuatro tamaños, en Reducido, interrumpida y medida (apartados 40-44)', ['journey', 'interruption', 'responsive', 'reduced motion', 'performance'], 'scripts/test-motion-f20.mjs', '/* ── MS F20 '),
]);
export const revisionesSinPrueba = ({ archivos = {}, verificar = '', recorrido = '' } = {}) => REVISIONES_FINALES
  .filter((r) => typeof archivos[r.suite] !== 'string' || !verificar.includes(r.suite) || !recorrido.includes(r.seccion))
  .map((r) => `${r.apartado} · ${r.que}`);

/* ───────────────────────────────────────────────────────────────────────────
   46 · LA ÚLTIMA BÚSQUEDA DEL CÓDIGO (apartado 46)

   Las diez búsquedas del enunciado sobre todo lo que PINTA (vistas, componentes,
   `App.jsx`). Cada aparición o la clasifica una regla del sistema, o está
   declarada aquí con su motivo, o sale en rojo. Lo que miran otras auditorías se
   cuenta con ellas (`z-index` es la F6, `will-change` la F13, `cubic-bezier` la F19).
   ─────────────────────────────────────────────────────────────────────────── */
export const RAF_DECLARADOS = Object.freeze([
  { archivo: 'src/views/LibraryView.jsx', porque: 'Devolver el foco y el cursor al editor tras el repintado: un solo fotograma, no anima nada.' },
  { archivo: 'src/components/navegacionMotion.js', porque: 'Un segundo intento de poner el scroll, guardado por la clave de la pantalla (F11, `LIMPIEZA_DECLARADA`).' },
  { archivo: 'src/components/continuidad.jsx', porque: 'Un fotograma para corregir el viaje con el scroll del padre (F11, `LIMPIEZA_DECLARADA`).' },
]);
export const RELOJES_DECLARADOS = Object.freeze([
  { archivo: 'src/views/EntrenamientoVivoView.jsx', porque: 'El reloj de la sesión: redibuja el número, la cuenta va por marcas de tiempo (E3 F25).' },
  { archivo: 'src/views/DashboardView.jsx', porque: 'La hora de Hoy: redibuja el número del reloj, no anima nada.' },
  { archivo: 'src/views/ProductivityView.jsx', porque: 'El Pomodoro y su anillo: redibujan, la cuenta va por marcas de tiempo (E3 F25).' },
  { archivo: 'src/views/HorarioView.jsx', porque: 'El minuto del horario (lo que está sonando ahora).' },
  { archivo: 'src/views/WellbeingView.jsx', porque: 'El tiempo de uso de la sesión: redibuja la cifra, no anima nada.' },
]);
/** Un `setTimeout` corto (menos de un segundo, o con un token) en lo que pinta: podría ser una espera de animación
 *  escrita a mano. Los que hay, con su motivo; uno nuevo sin motivo sale en rojo. */
export const ESPERAS_DECLARADAS = Object.freeze([
  { archivo: 'src/views/EntrenamientoVivoView.jsx', porque: 'Esperar a que suba el teclado del iPhone antes de centrar el campo (FIT F9, apartado 37), y a que React pinte la fila activa al acabar el descanso. Ninguna es una animación nuestra.' },
  { archivo: 'src/views/HubView.jsx', porque: 'La tarjeta crece y DESPUÉS navega: la espera es `esperaDeExpansion()`, un token (`fast`, F7).' },
  { archivo: 'src/components/accesibilidadMotion.jsx', porque: 'El anuncio de navegación se vacía y se vuelve a escribir para que VoiceOver lo lea otra vez (F12).' },
  { archivo: 'src/components/layoutMotion.jsx', porque: 'Las redes de seguridad de una copia que sale y de un desplegable: su duración es un token más un margen (F10).' },
  { archivo: 'src/components/capasMotion.js', porque: 'La red de seguridad de la copia de una capa que se va (F6).' },
  { archivo: 'src/components/gestosMotion.jsx', porque: 'El rescate de una hoja que su dueño no cerró (F5, apartado 37).' },
  { archivo: 'src/components/estadosAsincronos.jsx', porque: 'Volver a mirar un estado cuando toca (`revisarEn`, F16): no anima, decide qué decir.' },
  { archivo: 'src/views/RachasView.jsx', porque: 'El «+1» se desmonta cuando acaba su animación: `esperaDelFeedback`, el token `firma` a la velocidad elegida (F20).' },
]);

export function auditoriaFuenteFinal({ archivos = {} } = {}) {
  const pintan = codigoQuePinta(archivos);
  const porPatron = { 'transition:': 0, 'animation:': 0, '@keyframes': 0, requestAnimationFrame: 0, setTimeout: 0, setInterval: 0, 'cubic-bezier': 0, spring: 0, 'z-index': 0, 'will-change': 0 };
  const sinClasificar = [];
  Object.entries(pintan).forEach(([a, src]) => {
    if (!/^src\//.test(a)) return;
    const codigo = sinComentariosJs(src);
    const sinTextos = sinCadenas(codigo);
    for (const m of codigo.matchAll(/\btransition\s*:\s*([^,}\n][^\n]*)/g)) {
      porPatron['transition:'] += 1;
      if (!/transicion\(|'none'|"none"/.test(m[1])) sinClasificar.push({ archivo: a, linea: lineaDe(codigo, m.index), patron: 'transition:', texto: m[0].slice(0, 80) });
    }
    for (const m of codigo.matchAll(/\banimation\s*:\s*['"`]/g)) { porPatron['animation:'] += 1; sinClasificar.push({ archivo: a, linea: lineaDe(codigo, m.index), patron: 'animation:' }); }
    for (const m of codigo.matchAll(/@keyframes/g)) { porPatron['@keyframes'] += 1; sinClasificar.push({ archivo: a, linea: lineaDe(codigo, m.index), patron: '@keyframes' }); }
    const rafs = (sinTextos.match(/\brequestAnimationFrame\(/g) || []).length;
    porPatron.requestAnimationFrame += rafs;
    if (rafs && !/\bcancelAnimationFrame\(/.test(sinTextos) && !RAF_DECLARADOS.some((d) => d.archivo === a)) sinClasificar.push({ archivo: a, patron: 'requestAnimationFrame', texto: 'sin cancelar ni declarar' });
    const intervalos = (sinTextos.match(/\bsetInterval\(/g) || []).length;
    porPatron.setInterval += intervalos;
    if (intervalos && (!/\bclearInterval\(/.test(sinTextos) || !RELOJES_DECLARADOS.some((d) => d.archivo === a))) sinClasificar.push({ archivo: a, patron: 'setInterval', texto: 'un intervalo que no es un reloj declarado o no se limpia' });
    for (const m of codigo.matchAll(/\bsetTimeout\(/g)) {
      porPatron.setTimeout += 1;
      let prof = 0; let i = m.index + m[0].length; let ultimaComa = -1;
      for (; i < codigo.length; i += 1) {
        const ch = codigo[i];
        if ('([{'.includes(ch)) prof += 1;
        else if (')]}'.includes(ch)) { if (prof === 0) break; prof -= 1; } else if (ch === ',' && prof === 0) ultimaComa = i;
      }
      const retraso = ultimaComa === -1 ? '' : codigo.slice(ultimaComa + 1, i).trim();
      const numero = /^\d+$/.test(retraso) ? Number(retraso) : null;
      /* Corta: un número de menos de un segundo, o un retraso que sale de un token de movimiento. Un plazo de
         lectura (dos segundos para leer un aviso) o el autoguardado no son esperas de animación. */
      const corto = (numero !== null && numero > 0 && numero < 1000) || /duracionMs\(|esperaDe\w*\(|esperaDeExpansion|\bms\s*\+|\+\s*\d+$|revisarEn/.test(retraso);
      if (corto && !ESPERAS_DECLARADAS.some((d) => d.archivo === a)) sinClasificar.push({ archivo: a, linea: lineaDe(codigo, m.index), patron: 'setTimeout', texto: `espera corta sin declarar (${retraso})` });
    }
    for (const m of sinTextos.matchAll(/\brigidez\s*:\s*\d/g)) { porPatron.spring += 1; sinClasificar.push({ archivo: a, linea: lineaDe(sinTextos, m.index), patron: 'spring', texto: 'un muelle fuera de motion.js' }); }
    porPatron['cubic-bezier'] += (codigo.match(/cubic-bezier\(/g) || []).length;
    porPatron['z-index'] += (sinTextos.match(/\bzIndex\b|\bz-\d+\b/g) || []).length;
    porPatron['will-change'] += (sinTextos.match(/\bwillChange\b|will-change\s*:/g) || []).length;
  });
  /* Los tres que vigila otra auditoría sobre lo mismo: si dicen cero, el recuento de arriba se queda en
     informativo; si no, sus hallazgos están ya en `auditoriaTotalMotion` y en `auditoriaQA`. */
  return { porPatron, sinClasificar, archivos: Object.keys(pintan).length };
}

/* ───────────────────────────────────────────────────────────────────────────
   27, 28 y 48 · LA DOCUMENTACIÓN: las siete preguntas, los diez ejemplos y los
   quince temas, buscados en `docs/MOTION_SYSTEM.md`.
   ─────────────────────────────────────────────────────────────────────────── */
export const PREGUNTAS_DX = Object.freeze([
  { pregunta: '¿Dónde están los tokens?', respuesta: '`src/lib/motion.js` y, con los mismos valores, `:root` de `src/index.css` (`--motion-*`). Un token nuevo va a los dos sitios.' },
  { pregunta: '¿Cómo creo una transición?', respuesta: "Una clase de `index.css` con `var(--motion-dur-…)` y su curva, o `transicion('width', 'medium')` en el `style`. Nunca un número." },
  { pregunta: '¿Cómo hago un spring?', respuesta: "`muestrearSpring('normal', { desde, hasta, velocidad })` y sus fotogramas a `animarOrquestado`; la masa elige el muelle (`muelleDe`). Ninguno en uso rebota." },
  { pregunta: '¿Cómo respeto reduced motion?', respuesta: 'Con los tokens: en Reducido las distancias valen 0 y las escalas 1, así que una regla que los usa se funde en su sitio. Para JavaScript, `intensidadDe(ctx)`; para llevar la vista a algo, `desplazarHasta`.' },
  { pregunta: '¿Cómo creo una animación de navegación?', respuesta: 'No se crea: `App.jsx` pinta cada pantalla en su contenedor y `tipoDeNavegacion` decide entrar, volver o sección. Una pantalla nueva navega bien sin hacer nada.' },
  { pregunta: '¿Cómo animo datos?', respuesta: '`<CifraQueCambia valor={n}>{texto}</CifraQueCambia>` (su clase en `CLASES_DE_CIFRA`), `barra-progreso` para una barra y `useAnimacionDeGrafica()` para una gráfica.' },
  { pregunta: '¿Cómo pruebo motion?', respuesta: 'Su suite de Node, una sección del recorrido (tamaños y Reducido) y su línea en `MATRIZ_QA_MOTION`; `auditoriaQA` y `auditoriaSellado` tienen que salir a cero. `bash scripts/verificar.sh`.' },
]);

export const EJEMPLOS_DEL_PROYECTO = Object.freeze([
  { ejemplo: 'button press', donde: 'src/components/ui.jsx', simbolo: 'PrimaryButton', como: 'La escalera `active:scale-*` la gobierna `index.css` (F3); lo destructivo lleva `toque-destructivo`.' },
  { ejemplo: 'modal', donde: 'src/components/capasMotion.js', simbolo: 'useCapasMotion', como: 'Un portal `fixed inset-0 z-capa` con `CAPAS.veloHoja`; su entrada y su salida las pone `useCapasMotion` según sea hoja o ventana (F6).' },
  { ejemplo: 'sheet', donde: 'src/components/gestosMotion.jsx', simbolo: 'AsaHoja', como: '`<AsaHoja cajaRef onCerrar>` con la misma función que su botón de cerrar (F5).' },
  { ejemplo: 'navigation', donde: 'src/lib/transicionNavegacion.js', simbolo: 'tipoDeNavegacion', como: 'Entrar desde la derecha, volver desde la izquierda, cambiar de sección con un fundido (F2).' },
  { ejemplo: 'card → detail', donde: 'src/components/continuidad.jsx', simbolo: 'Compartido', como: 'Una tarjeta que ES lo que abre crece hasta su pantalla (`useContenedorDesdeOrigen`); lo mismo en dos sitios lleva `<Compartido id>` (F7).' },
  { ejemplo: 'counter', donde: 'src/components/motion.jsx', simbolo: 'CifraQueCambia', como: 'Cuenta la principal, releva el resto, nunca al aparecer, y decide antes de pintar (F4, F17 y F19).' },
  { ejemplo: 'loading', donde: 'src/components/accesibilidadMotion.jsx', simbolo: 'GiroDeCarga', como: 'Un giro siempre con su texto; un botón que espera es `estado="cargando"` (F9); una pantalla que carga, su esqueleto (E3 F14).' },
  { ejemplo: 'success', donde: 'src/components/motion.jsx', simbolo: 'LatidoAlMarcar', como: 'El ✓ late al ponerlo, nunca al abrir (F18); el aviso de «hecho» entra con `Presencia`.' },
  { ejemplo: 'error', donde: 'src/components/ui.jsx', simbolo: 'MensajeDeCampo', como: 'El campo lleva `aria-invalid` y su mensaje con `aria-describedby`; nada tiembla (F9).' },
  { ejemplo: 'gesture', donde: 'src/components/gestosMotion.jsx', simbolo: 'useDeslizarParaCambiar', como: 'Con `touch-action: pan-y`; las decisiones son del motor (`decidirCambio`) y los umbrales de `UMBRALES_GESTO` (F5 y F8).' },
]);
export const ejemplosQueNoExisten = (archivos = {}) => EJEMPLOS_DEL_PROYECTO
  .filter((e) => !exportaNombre(archivos[e.donde], e.simbolo)).map((e) => e.ejemplo);

/** Los quince temas del apartado 48, con lo que tiene que encontrarse en `docs/MOTION_SYSTEM.md`. */
export const TEMAS_DOCUMENTACION = Object.freeze([
  ['arquitectura', /^## 9 · La arquitectura/m], ['tokens', /^## 7 · Los tokens/m], ['engines', /Motion Engine|el motor/i],
  ['orchestration', /^## 8\.10 · El orquestador/m], ['navigation', /^## 8\.1 · Cómo se mueve la navegación/m],
  ['gestures', /^## 8\.4 · Cómo responde algo que se arrastra/m], ['layout', /^## 8\.9 · El diseño que cambia/m],
  ['data', /^## 8\.16 · Datos que cambian/m], ['async', /^## 8\.15 · Estados del sistema/m],
  ['responsive', /^## 8\.14 · Responsive/m], ['accessibility', /^## 8\.11 · Accesibilidad/m],
  ['performance', /^## 8\.12 · Rendimiento/m], ['testing', /^## Motion QA/m],
  ['contracts', /^## Los contratos/m], ['anti-patterns', /^## Los antipatrones/m],
]);
export function documentacionIncompleta(doc = '') {
  const texto = String(doc || '');
  return [
    ...TEMAS_DOCUMENTACION.filter(([, re]) => !re.test(texto)).map(([t]) => `tema:${t}`),
    ...PREGUNTAS_DX.filter((p) => !texto.includes(p.pregunta)).map((p) => `pregunta:${p.pregunta}`),
    ...EJEMPLOS_DEL_PROYECTO.filter((e) => !texto.includes(`**${e.ejemplo}**`)).map((e) => `ejemplo:${e.ejemplo}`),
    ...ANTIPATRONES_MOTION.filter((a) => !texto.includes(a.no)).map((a) => `antipatron:${a.no}`),
    ...(/MOTION SYSTEM — SEALED/.test(texto) ? [] : ['sellado']),
  ];
}

/* ───────────────────────────────────────────────────────────────────────────
   50 · LO QUE NO SE PUEDE RESOLVER SIN UNA REFACTORIZACIÓN MAYOR, DICHO
   ─────────────────────────────────────────────────────────────────────────── */
export const LIMITACIONES_MOTION = Object.freeze([
  { id: 'atras_del_sistema', que: 'El gesto de atrás de Safari sale de la aplicación', porque: 'JosStyle navega con estado de React, sin `history.pushState`. Arreglarlo es la navegación de toda la aplicación (E3 F22, C-53): lo decide Josué.' },
  { id: 'deslizar_para_volver', que: 'No se desliza desde el borde para volver', porque: 'Solo se pinta la pantalla de arriba: no hay una de debajo que enseñar mientras el dedo arrastra (C-56).' },
  { id: 'regresion_visual', que: 'No hay capturas de pantalla comparadas', porque: 'No hay infraestructura y el apartado 1 de la F19 prohíbe instalar herramientas innecesarias: lo visual se mide con estilos calculados y rectángulos.' },
  { id: 'lint_tipos', que: 'Ni lint ni typecheck', porque: 'El proyecto no tiene ni uno ni otro (C-48): fingirlos sería la regla 8. La puerta es `verificar.sh`.' },
  { id: 'iphone_de_verdad', que: 'Las pruebas corren en Chromium y la aplicación se usa en un iPhone', porque: 'Tocar, deslizar y girar con el dedo lo tiene que mirar Josué (R1). Lo que Safari resuelve distinto vive en `safari.js`.' },
  { id: 'renders_innecesarios', que: 'No se cuentan los repintados de React', porque: 'Sin el Profiler en producción no hay una medida honesta; lo que sí se mide es que el reloj repinte el número y no la pantalla (FIT F40) y que lo que arrastra el dedo no pase por el estado de React (F5).' },
]);

/* ───────────────────────────────────────────────────────────────────────────
   54, 55 y 62 · LAS REGLAS QUE QUEDAN, Y DÓNDE TIENEN QUE ESTAR ESCRITAS
   ─────────────────────────────────────────────────────────────────────────── */
export const REGLAS_PERMANENTES_F20 = Object.freeze([
  { apartado: 54, regla: 'Antes de crear motion nuevo, buscar primero si existe un patrón equivalente dentro del Motion System. Si existe, reutilizarlo; si no, extender el sistema central. Nunca una solución paralela sin una razón arquitectónica clara.', marca: 'ANTES DE CREAR MOTION NUEVO, SE BUSCA EL PATRÓN QUE YA EXISTE' },
  { apartado: 55, regla: 'Jos Style nunca sacrifica claridad, interacción o rendimiento por una animación. Motion es infraestructura de experiencia, no decoración.', marca: 'MOTION ES INFRAESTRUCTURA, NO DECORACIÓN' },
  { apartado: 62, regla: 'Si una funcionalidad necesita movimiento, primero se inspecciona el Motion System, se reutilizan sus primitivas y solo se amplían sus abstracciones si hace falta. No «esta feature necesita su propia animación», sino «esta feature tiene que integrarse en el lenguaje que ya existe».', marca: 'UNA FUNCIONALIDAD NUEVA SE INTEGRA EN EL LENGUAJE QUE YA EXISTE' },
  { apartado: 63, regla: 'La regla permanente de motion: toda funcionalidad nueva o ampliada se integra sola con el Motion System —entrada, salida, toque, carga, transición y microinteracción—, limpia, sutil y coherente; nada excesivo ni que ralentice; el sistema es la arquitectura central y se extiende, nunca se duplica.', marca: 'MOTION SYSTEM — SEALED' },
]);
export const reglasSinEscribir = (claude = '') => REGLAS_PERMANENTES_F20.filter((r) => !String(claude).includes(r.marca)).map((r) => r.apartado);

/* ───────────────────────────────────────────────────────────────────────────
   58-60 · EL SELLADO: todo lo anterior a la vez, y el estado se CALCULA
   ─────────────────────────────────────────────────────────────────────────── */
export function auditoriaSellado({ css = '', archivos = {}, otros = {}, verificar = '', recorrido = '', doc = '', claude = '', mapa = [] } = {}) {
  const total = auditoriaTotalMotion({ css, archivos });
  const qa = auditoriaQA({ css, archivos, verificar, recorrido });
  const dup = auditarDuplicacion({ archivos });
  const contrato = comprobacionesDeContrato({ css, mapa });
  const fuente = auditoriaFuenteFinal({ archivos });
  const partes = {
    auditoriaTotal: total.total,
    auditoriaQA: qa.total,
    simbolosInexistentes: simbolosQueNoExisten(archivos).length,
    fuenteUnica: fuenteUnicaRota(archivos).length,
    duplicacion: dup.nombresRepetidos.length + dup.muellesIguales.length + dup.presetsIguales.length,
    exportacionesMuertas: exportacionesMuertas({ archivos, otros }).length,
    legadoPendiente: legadoPendiente({ css, archivos }).length,
    desplazamientosSinToken: desplazamientosSinToken(css).length,
    piezasSinRevisar: piezasSinRevisarLimpieza({ archivos }).length,
    mapaIncompleto: contrato.mapaIncompleto.length,
    navegacionIncompleta: contrato.navegacionIncompleta.length,
    datosIncompletos: contrato.datosIncompletos.length,
    asincronoIncompleto: contrato.asincronoIncompleto.length,
    responsiveIncompleto: contrato.responsiveIncompleto.length,
    gestoIncompleto: contrato.gestoIncompleto.length,
    profundidadIncompleta: contrato.profundidadIncompleta.length,
    prioridadesQueBloquean: contrato.prioridadesQueBloquean.length,
    buclesSinDeclarar: contrato.buclesSinDeclarar.length,
    reducidoIncompleto: contrato.reducidoIncompleto.length,
    antipatronesSinCazar: antipatronesQueNoSeCazan({ css }).length,
    tokensRevisados: tokensRevisadosQueNoExisten(css).length,
    muelles: muellesSinProposito().length,
    revisionesSinPrueba: revisionesSinPrueba({ archivos, verificar, recorrido }).length,
    fuenteFinal: fuente.sinClasificar.length,
    ejemplosQueNoExisten: ejemplosQueNoExisten(archivos).length,
    documentacionIncompleta: documentacionIncompleta(doc).length,
    reglasSinEscribir: reglasSinEscribir(claude).length,
  };
  const suma = Object.values(partes).reduce((a, b) => a + b, 0);
  return { partes, total: suma, sellado: suma === 0, estado: suma === 0 ? 'MOTION SYSTEM — SEALED' : 'SIN SELLAR' };
}

/** Las garantías de cada contrato que no resuelven a nada que exista. */
export function contratosSinGarantia({ verificar = '', recorrido = '', archivos = {} } = {}) {
  const auditorias = new Set(SISTEMAS_AUDITADOS.map((s) => s.id));
  const partesQA = new Set(Object.keys(auditoriaQA({ css: '', archivos: {}, verificar: '', recorrido: '' }).partes));
  const partesF20 = new Set(Object.keys(auditoriaSellado({ archivos: {} }).partes));
  const nombres = { mapaIncompleto: 1, navegacionIncompleta: 1, datosIncompletos: 1, asincronoIncompleto: 1, responsiveIncompleto: 1, gestoIncompleto: 1, profundidadIncompleta: 1, prioridadesQueBloquean: 1, buclesSinDeclarar: 1, reducidoIncompleto: 1, desplazamientosSinToken: 1, piezasSinRevisar: 1, fuenteFinal: 1, documentacionIncompleta: 1 };
  return CONTRATOS_MOTION.flatMap((c) => c.garantias.filter((g) => {
    const [tipo, ...resto] = g.split(':');
    const id = resto.join(':');
    if (tipo === 'auditoria') return !auditorias.has(id);
    if (tipo === 'qa') return !partesQA.has(id);
    if (tipo === 'f20') return !partesF20.has(id) || !nombres[id];
    if (tipo === 'recorrido') return !recorrido.includes(id);
    if (tipo === 'suite') return typeof archivos[id] !== 'string' || !verificar.includes(id);
    return true;
  }).map((g) => `${c.apartado}:${g}`));
}

/** El informe final (apartado 59): corto, útil para la próxima vez, y con el estado calculado. */
export function informeFinal(sellado) {
  return {
    consolidado: ['Un mapa definitivo con los nombres reales (`MAPA_DEFINITIVO`)', 'Una sola fuente por categoría, con quién caza la segunda (`FUENTE_UNICA` sobre `CATEGORIAS_TOKENS`)', 'Diecinueve contratos atados a las auditorías que los vigilan', 'Los diez antipatrones, cazados con su ejemplo', '«Sin movimiento» en un solo atributo (`data-motion`)'],
    eliminado: LEGADO_MOTION.filter((l) => l.decision === 'REMOVE').map((l) => l.que),
    creado: ['`desplazamientosSinToken`', '`piezasSinRevisarLimpieza`', '`exportacionesMuertas` y `auditarDuplicacion`', '`auditoriaFuenteFinal`', '`auditoriaSellado` e `informeFinal`', 'La sección «MS F20» del recorrido: la sesión entera en cuatro tamaños, en Reducido, interrumpida y medida'],
    pruebas: ['`bash scripts/verificar.sh` entero: build, todas las suites de Node, el banco de renderizado, las reglas invariantes y el recorrido de Chromium'],
    encontrado: HALLAZGOS_F20.map((h) => h.que),
    solucionado: HALLAZGOS_F20.filter((h) => h.resuelto === 20).map((h) => h.id),
    limitaciones: LIMITACIONES_MOTION.map((l) => l.que),
    estado: sellado && sellado.sellado ? 'MOTION SYSTEM — SEALED' : 'SIN SELLAR',
  };
}

/* ───────────────────────────────────────────────────────────────────────────
   LO QUE ENCONTRÓ LA FASE, Y LO QUE NO HACE
   ─────────────────────────────────────────────────────────────────────────── */
export const HALLAZGOS_F20 = Object.freeze([
  { id: 'limpieza_sin_revisar', que: 'Tres piezas —`sincronizacion.js`, `rendimientoMotion.js` y `components/accesibilidadMotion.jsx`— usaban temporizadores, escuchadores u observadores y la revisión de limpieza de la F11 no las miraba: su lista se escribió antes de que existieran.', resuelto: 20 },
  { id: 'limpieza_contaba_cadenas', que: 'La revisión de limpieza contaba el `addEventListener` de un EJEMPLO escrito dentro de una cadena (el de la F13): no quitaba las cadenas.', resuelto: 20 },
  { id: 'dos_atributos_off', que: '«Sin movimiento» tenía dos atributos con la misma regla (`data-motion=\'off\'` y `data-animaciones=\'desactivadas\'`) y `data-reducir-movimiento` se escribía sin que lo leyera nadie.', resuelto: 20 },
  { id: 'exportaciones_muertas', que: 'Cuatro exportaciones que no leía nadie: `COSTES` y tres alias de la F14.', resuelto: 20 },
  { id: 'desplazamiento_sin_token', que: 'Nada impedía un `translate` con píxeles escritos a mano en `index.css`, que no se quedaría quieto en Reducido (hoy no hay ninguno).', resuelto: 20 },
  { id: 'feedback_racha_cortado', que: 'El «+1» de una racha se desmontaba a los 900 ms escritos a mano aunque su animación (el token `firma`) durara más con la velocidad «Pausada»: se cortaba al 77 %, todavía a la vista.', resuelto: 20 },
  { id: 'arquitectura_vieja', que: 'La descripción de la arquitectura de la F0 seguía diciendo `html[data-animaciones=…]`.', resuelto: 20 },
]);

export const NO_EN_F20 = Object.freeze([
  { que: 'Más efectos (misión)', porque: '*"No consiste en añadir más efectos."* Ni un keyframe, ni un token, ni un preset nuevos.' },
  { que: 'Una reescritura (apartado 7)', porque: '*"No convertir esta fase en una migración destructiva."* Lo que funciona y obedece al sistema se queda (`LEGADO_MOTION`, KEEP).' },
  { que: 'Quitar `bouncy` (apartado 31)', porque: 'La F1 exige los cinco muelles y la F8 lo usa como contraejemplo medido: sin él, `muelleSinRebote` no podría ponerse rojo (C-69).' },
  { que: 'Una Fase 21 (apartado 61)', porque: '*"No generar una FASE 21 del Motion System."* Lo que venga entra como extensión, arreglo, refactor o funcionalidad nueva dentro de esta arquitectura.' },
  { que: 'Contar repintados de React (apartado 44)', porque: 'Sin el Profiler no hay una medida honesta (`LIMITACIONES_MOTION`); se miden los fotogramas largos, que la sesión no deje nada vivo y que el DOM vuelva al tamaño de antes.' },
]);

/** Dónde se resuelve cada apartado (1-63). */
export const AUDITORIA_F20 = Object.freeze([
  { apartados: [1], donde: '`INVENTARIO_F20`' },
  { apartados: [2], donde: '`MAPA_DEFINITIVO` + `simbolosQueNoExisten`' },
  { apartados: [3], donde: '`FUENTE_UNICA` sobre `CATEGORIAS_TOKENS` (F11) + `fuenteUnicaRota`' },
  { apartados: [4], donde: '`auditarDuplicacion`, más los keyframes y valores repetidos de la F19' },
  { apartados: [5], donde: '`exportacionesMuertas` (y se retiraron cuatro), keyframes sin uso (F19), tokens sin uso (F18)' },
  { apartados: [6, 7], donde: '`LEGADO_MOTION` + `legadoPendiente`' },
  { apartados: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26], donde: '`CONTRATOS_MOTION` + `contratosSinGarantia` + `comprobacionesDeContrato`' },
  { apartados: [27, 28], donde: '`PREGUNTAS_DX` y `EJEMPLOS_DEL_PROYECTO`, en `docs/MOTION_SYSTEM.md`' },
  { apartados: [29], donde: '`ANTIPATRONES_MOTION` + `antipatronesQueNoSeCazan`' },
  { apartados: [30], donde: '`REVISION_TOKENS` + `tokensRevisadosQueNoExisten`' },
  { apartados: [31], donde: '`muellesSinProposito` (C-69 para `bouncy`)' },
  { apartados: [32], donde: '`auditarProfundidad` en `auditoriaTotalMotion` y `NIVELES_DE_PROFUNDIDAD_F20`' },
  { apartados: [33, 34, 35, 36, 37, 38, 39], donde: '`REVISIONES_FINALES` + `revisionesSinPrueba`' },
  { apartados: [40, 41, 42, 43, 44], donde: 'La sección «MS F20» del recorrido' },
  { apartados: [45, 58], donde: '`bash scripts/verificar.sh` (lint y typecheck no existen: `LIMITACIONES_MOTION`)' },
  { apartados: [46], donde: '`auditoriaFuenteFinal`' },
  { apartados: [47], donde: 'El recorrido: ni un error ni un aviso en la consola, ni una promesa sin atender (`pageerror`)' },
  { apartados: [48], donde: '`TEMAS_DOCUMENTACION` + `documentacionIncompleta`' },
  { apartados: [49], donde: '`CHANGELOG.md` dice FINALIZADO solo con el sellado en verde' },
  { apartados: [50], donde: '`LIMITACIONES_MOTION`' },
  { apartados: [51, 52, 53], donde: 'Ni una abstracción nueva que no cace algo; `API_MOTION` (F18) y los contratos son lo que necesita una función nueva' },
  { apartados: [54, 55, 62], donde: '`REGLAS_PERMANENTES_F20` + `reglasSinEscribir` sobre `CLAUDE.md`' },
  { apartados: [56, 57], donde: 'El sellado: cada criterio con su auditoría, y lo que faltaba implementado aquí' },
  { apartados: [59], donde: '`informeFinal`' },
  { apartados: [60], donde: '`auditoriaSellado` → `estado`' },
  { apartados: [61, 63], donde: '`NO_EN_F20` (sin Fase 21)' },
]);
