/* Entrega 4 · Fase 42/45 — «Auditoría visual y acabado premium de fitness».
   ═══════════════════════════════════════════════════════════════════════════

   *"Fitness debe parecer diseñado como UN ÚNICO PRODUCTO y no como muchas
   pantallas desarrolladas independientemente."* Y el «IMPORTANTE» que manda
   sobre todo lo demás: **"Esta fase NO debe añadir funcionalidades importantes.
   NO cambiar: lógica, datos, fórmulas, RankEngine, ProgressEngine, GoalEngine,
   persistencia."**

   ── LA IDEA QUE HACE QUE ESTO NO SE QUEDE VIEJO ──────────────────────────
   Una auditoría visual escrita a mano —*"los bordes son redondeados, los
   títulos destacan"*— caduca en dos fases. Así que lo que se declara aquí es
   **la escala que Fitness ya usa**, medida sobre sus 32 archivos, y lo que se
   comprueba es que **nada se salga de ella**. El sistema visual no se inventó
   en esta fase: `COLORS` (con su modo oscuro y su alto contraste), los
   componentes de `ui.jsx`, `RankBadge`, las animaciones de la F37, la Safe
   Area de la E3 F1 y el foco de la F39 ya estaban. Lo que había eran
   **salidas de la escala**, y cada una está en `HECHO_F42` con su motivo:

     · cuatro listas de meses escritas a mano y un cuarto formato de fecha;
     · emojis haciendo de icono (📝 en tres notas, 🔒 en la privacidad);
     · un texto de 9 px en cinco sitios y uno de «12 px» que es `text-xs`;
     · un radio que no usaba nadie más, dos espaciados de letra sueltos y dos
       pesos «extrabold» en letra de 11 y 12 px;
     · cuatro oscuridades distintas para el velo de una hoja y dos botones de
       cerrar diferentes;
     · las miniaturas de las fotos, cuadradas en la galería y 3:4 en Progreso;
     · el acento como color de TEXTO por debajo del contraste AA con seis de
       los doce acentos en oscuro y siete en claro —el de serie incluido—;
     · y «sesión» y «rutina» donde el resto de Fitness dice «entrenamiento» y
       «plantilla».

   ⚠️ **Y nada de eso toca un dato.** Ni una fórmula, ni un campo guardado, ni
   un motor: la prueba de la fase importa los motores y comprueba que no se
   han movido (el «IMPORTANTE»).
   ═══════════════════════════════════════════════════════════════════════════ */

import { COLORS, CAPAS } from '../tokens';
import { ensureContrast, isValidHex } from './colorEngine';
import { FORMATOS_FECHA } from './fechasFitness';

/* ═══════════════════════════════════════════════════════════════════════════
   1 · EL SISTEMA VISUAL (apartados 3-12, 40-45 y 63)
   ═══════════════════════════════════════════════════════════════════════════
   ⚠️ **Apartado 63: *"Si todavía no existe un sistema suficientemente
   centralizado: crear tokens… Utilizar CSS variables/theme existente si lo
   hay."*** Lo hay: `COLORS` es el tema (y se muta en `aplicarTema`, así que
   una vista lo hereda sin cambiar de import) y Tailwind es la escala. Lo que
   se declara aquí es **qué papel juega cada pieza**, para que la siguiente
   pantalla elija de la lista en vez de inventar. */

export const SUPERFICIES = [
  { rol: 'background', token: 'COLORS.bg', que: 'El fondo de la aplicación.' },
  { rol: 'surface', token: 'COLORS.surface', que: 'Las tarjetas (`Card` de ui.jsx) y las hojas.' },
  { rol: 'surfaceElevated', token: 'COLORS.surface2', que: 'Lo que va dentro de una tarjeta: pastillas, celdas, campos.' },
  { rol: 'surfacePressed', token: 'COLORS.interactionActive', que: 'El toque, junto a la escala de `fit-pulsable` (F37).' },
  { rol: 'border', token: 'COLORS.border / COLORS.borderAlpha', que: 'Un borde de 1 px, sutil (apartado 12).' },
  { rol: 'text', token: 'COLORS.text', que: 'El texto principal.' },
  { rol: 'textSecondary', token: 'COLORS.textMuted', que: 'El secundario: 5,4:1 o más sobre las tres superficies, en claro y en oscuro.' },
  { rol: 'disabled', token: 'COLORS.textDisabled', que: 'Lo apagado (derivado del acento en `buildRolesFromAccent`).' },
];

/* Apartado 6 — los papeles de la letra, con la clase que les corresponde. */
export const ESCALA_TEXTO = [
  { rol: 'Display', clases: ['text-2xl', 'text-3xl', 'text-4xl'], uso: 'La cifra que manda: el reloj del entrenamiento, el rango, un récord.' },
  { rol: 'H1', clases: ['text-xl'], uso: 'El título de una pantalla o de una hoja.' },
  { rol: 'H2', clases: ['text-lg'], uso: 'El título de una sección grande.' },
  { rol: 'H3', clases: ['text-base'], uso: 'El título de una tarjeta.' },
  { rol: 'Body', clases: ['text-sm'], uso: 'El texto de lectura.' },
  { rol: 'Body secondary', clases: ['text-xs'], uso: 'La línea de detalle.' },
  { rol: 'Label', clases: ['text-[11px]'], uso: 'Los rótulos pequeños, en mayúsculas si hace falta.' },
  { rol: 'Caption', clases: ['text-[10px]'], uso: 'El dato más pequeño: una etiqueta, una unidad.' },
];
export const CLASES_TEXTO = ESCALA_TEXTO.flatMap((e) => e.clases);

/* Apartado 58 — dónde se permiten las MAYÚSCULAS: en los rótulos pequeños. */
export const TEXTO_PEQUENO = ['text-[10px]', 'text-[11px]', 'text-xs'];

/* Apartado 7 — tres pesos, y el más fuerte solo a partir de `text-sm`: un
   «extrabold» a 11 px es una mancha, no un título. */
export const PESOS = ['font-normal', 'font-semibold', 'font-bold', 'font-extrabold'];
export const PESO_FUERTE = 'font-extrabold';

/* Apartado 10 — cinco radios, no quince. */
export const RADIOS = [
  { rol: 'small', clase: 'rounded-lg', uso: 'Pastillas pequeñas y celdas.' },
  { rol: 'medium', clase: 'rounded-xl', uso: 'Botones, campos y filas.' },
  { rol: 'large', clase: 'rounded-2xl', uso: 'Tarjetas.' },
  { rol: 'sheet', clase: 'rounded-3xl', uso: 'Las hojas (arriba en el móvil, las cuatro esquinas en una pantalla ancha).' },
  { rol: 'pill', clase: 'rounded-full', uso: 'Chips, avatares y botones redondos.' },
];

/* Apartado 9 — la escala de espaciado es la de Tailwind (4 px), y Fitness usa
   solo estos pasos: 2, 4, 6, 8, 10, 12, 14, 16, 20 y 24 px (y 0). */
export const PASOS_ESPACIADO = ['0', '0.5', '1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6'];

/* Apartado 58 — un solo espaciado de letra para los rótulos en mayúsculas. */
export const TRACKING = 'tracking-wider';

/* ═══════════════════════════════════════════════════════════════════════════
   2 · EL ACENTO COMO TEXTO (apartados 5, 55 y 56)
   ═══════════════════════════════════════════════════════════════════════════
   🐛 El acento es un color de marca, elegido para fondos y botones. Como color
   de TEXTO pequeño se quedaba por debajo de 4,5:1 —el mínimo AA— con **seis de
   los doce acentos en oscuro** (el de serie, «Azul metálico», da 4,27) y
   **siete en claro** («Dorado» da 2,4). Fitness lo usa como texto en más de un
   centenar de sitios: el nombre del rango, «Ahora», los totales.

   `acentoLegible(accent)` devuelve **el mismo tono**, aclarado u oscurecido lo
   justo para llegar a 4,5:1 sobre `surface2` —la superficie con menos
   contraste de las tres, en los dos temas— con `ensureContrast`, la red de
   seguridad que `aplicarTema` ya usa para el texto. Si ya llega, **es el
   mismo color**. ⚠️ **Solo para texto e iconos**: un botón sigue pintado con
   el acento de verdad, porque su texto lo elige `textOnAccent`. */

export const CONTRASTE_TEXTO = 4.5;
const memoAcento = new Map();

export function acentoLegible(accent) {
  if (typeof accent !== 'string' || !isValidHex(accent)) return accent;
  const fondo = COLORS.surface2;
  if (typeof fondo !== 'string' || !isValidHex(fondo)) return accent;
  const clave = `${accent}|${fondo}`;
  if (!memoAcento.has(clave)) memoAcento.set(clave, ensureContrast(accent, fondo, CONTRASTE_TEXTO));
  return memoAcento.get(clave);
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · LAS HOJAS Y LAS CONFIRMACIONES (apartados 38 y 39)
   ═══════════════════════════════════════════════════════════════════════════
   *"No tener cinco estilos diferentes de modal. Unificar."* Había seis
   cajas con **cuatro velos** (0,5, 0,55 y 0,6 de negro), dos anchos para la
   misma hoja, una que en una pantalla ancha se quedaba pegada abajo y **dos
   botones de cerrar** distintos. Quedan tres familias, cada una por algo:

     · **hoja**: contenido que se lee (el porqué de un rango, su historial,
       la sustitución). Abajo en el móvil, centrada en una pantalla ancha.
     · **confirmación**: una pregunta corta con dos respuestas, centrada.
     · **visor**: una foto o una comparación, a pantalla completa y sobre
       negro (`CAPAS.escenarioFoto`), como en Fotos del iPhone.

   ⚠️ **Sin asa** (apartado 38 la enumera): ninguna hoja de Fitness se
   arrastra, y un asa promete un gesto. Un control que no hace nada es la
   regla 8. Se cierran con su botón, tocando fuera o con Escape (F39). */

export const HOJA = {
  velo: 'fixed inset-0 z-50 flex items-end sm:items-center justify-center fondo-entra',
  veloConfirmacion: 'fixed inset-0 z-50 flex items-end sm:items-center justify-center px-3 pb-3 sm:pb-0 fondo-entra',
  caja: 'w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 hoja-entra hoja-movil dialogo-caja',
  confirmacion: 'w-full max-w-sm rounded-3xl p-5 space-y-4 hoja-entra hoja-movil dialogo-caja',
  visor: 'fixed inset-0 z-50 flex flex-col fondo-entra dialogo-caja',
  /* Sitio para la barra de inicio del iPhone (F38, apartado 47). */
  abajo: 'calc(var(--safe-bottom) + 1.25rem)',
  fondoVelo: CAPAS.veloHoja,
};

/* El botón de cerrar de una hoja: el mismo en todas (lo pinta `BotonCerrarHoja`). */
export const CERRAR_HOJA = { clase: 'p-2 rounded-full shrink-0 toque-44', icono: 16 };

/**
 * 🔓 **El código de una pantalla con las clases de `HOJA` escritas en su sitio.**
 * Las auditorías de la F20, la F33, la F37, la F38 y la F39 leen los archivos
 * buscando `fondo-entra`, `hoja-movil`, `dialogo-caja` o `fixed inset-0`, y desde
 * esta fase esas clases viven UNA vez, aquí. Lo que protegen sigue igual —toda
 * hoja entra, tiene tope, deja sitio a la barra y va por portal—, así que se les
 * da el código **como lo ve el navegador**: `className={HOJA.caja}` pasa a ser
 * `className="w-full max-w-md …"`. ⚠️ No es aflojarlas: una hoja sin `HOJA` y sin
 * sus clases sigue saliendo roja, y la prueba de la fase lo comprueba.
 */
const CONSTANTES_DE_CLASE = {
  ...Object.fromEntries(Object.entries(HOJA).map(([k, v]) => [`HOJA.${k}`, v])),
  'CERRAR_HOJA.clase': CERRAR_HOJA.clase,
};
const valorDe = (nombre) => CONSTANTES_DE_CLASE[nombre];
export function fuenteResuelta(src) {
  return String(src || '')
    .replace(/className=\{`([^`]*)`\}/g, (m, t) => {
      const piezas = [...t.matchAll(/\$\{([A-Z_]+\.[a-zA-Z]+)\}/g)];
      if (!piezas.length || piezas.some((p) => valorDe(p[1]) === undefined) || /\$\{(?![A-Z_]+\.[a-zA-Z]+\})/.test(t)) return m;
      return `className="${t.replace(/\$\{([A-Z_]+\.[a-zA-Z]+)\}/g, (x, n) => valorDe(n))}"`;
    })
    .replace(/className=\{([A-Z_]+\.[a-zA-Z]+)\}/g, (m, n) => (valorDe(n) === undefined ? m : `className="${valorDe(n)}"`))
    /* Y en un estilo (`paddingBottom: HOJA.abajo`), como el literal que era. */
    .replace(/(:\s*)(HOJA\.[a-zA-Z]+)\b/g, (m, dos, n) => (valorDe(n) === undefined ? m : `${dos}'${valorDe(n)}'`));
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · LAS FOTOS (apartados 21, 22 y 32)
   ═══════════════════════════════════════════════════════════════════════════
   Las miniaturas eran cuadradas en la galería y en el selector del
   comparador, y 3:4 en la tira de Progreso. Quedan **cuadradas en los tres
   sitios**, que es como enseña una rejilla de fotos el propio iPhone; la foto
   entera se ve al abrirla, sin recortar (`object-contain`). Ninguna se estira:
   `object-cover` recorta la miniatura, nunca la deforma. */
export const MINIATURA_FOTO = 'aspect-square object-cover';

/* ═══════════════════════════════════════════════════════════════════════════
   5 · UNA PALABRA POR CONCEPTO (apartado 57)
   ═══════════════════════════════════════════════════════════════════════════
   *"Utilizar siempre los mismos términos… no alternar arbitrariamente entre
   Workout, Sesión, Rutina cuando representan el mismo concepto."* En Fitness
   el entrenamiento que se hace se llama **entrenamiento** (la pestaña, el
   historial, «Empezar entrenamiento») y lo que él se construye es una
   **plantilla** («Tus plantillas»). Por dentro el dato se sigue llamando
   `sesion` —es la clave guardada desde la F7, y los ids no se renombran (FIT
   F1)—; lo que cambia es lo que se lee. */

export const TERMINOS_FITNESS = [
  { concepto: 'Lo que se entrena y queda en el historial', se_dice: 'entrenamiento', no: ['sesión', 'sesiones', 'workout', 'workouts'] },
  { concepto: 'Lo que él se construye y reutiliza', se_dice: 'plantilla', no: ['rutina', 'rutinas'] },
];

const PALABRA_QUE_CHOCA = /\b(sesi[oó]n(?:es)?|workouts?|rutinas?)\b/gi;

/** Las palabras de `TERMINOS_FITNESS` que no deberían leerse, en un texto ya pintado. */
export function terminosQueChocan(texto) {
  return [...String(texto || '').matchAll(PALABRA_QUE_CHOCA)].map((m) => m[0]);
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · LA AUDITORÍA (apartados 6-12, 30-33, 38, 42-45, 53, 58, 59 y 63)
   ═══════════════════════════════════════════════════════════════════════════
   Recibe el código de las pantallas y el CSS —la prueba los lee de disco—, así
   que se le puede dar un ejemplo malo y ver que se pone roja (EH F42: una
   auditoría que no puede fallar no sirve). ⚠️ Quita los comentarios
   **conservando los saltos de línea**: el número de línea que devuelve tiene
   que apuntar al sitio (F38), y un comentario que explica una regla no la
   incumple (la lección de siempre). */

const sinComentarios = (src) => String(src || '')
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''))
  .replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

const lineaDe = (src, i) => src.slice(0, i).split('\n').length;

/* Todas las cadenas de `className="…"` o `className={'…'}`, con su línea. */
function clases(src) {
  const out = [];
  const re = /className=(?:"([^"]*)"|\{\s*'([^']*)'\s*\}|\{`([^`]*)`\})/g;
  let m;
  while ((m = re.exec(src))) out.push({ clases: (m[1] ?? m[2] ?? m[3] ?? ''), linea: lineaDe(src, m.index) });
  return out;
}

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2B50}\u{2B55}\u{23E9}-\u{23FA}\u{231A}\u{231B}]/u;

/* Las reglas. Cada una mira UN archivo y devuelve lo que encuentra. */
export const REGLAS_ACABADO = [
  {
    id: 'escala_de_texto', apartado: 6,
    que: 'Un tamaño de letra fuera de la escala (`ESCALA_TEXTO`): 9 px no se lee, y «12 px» es `text-xs`.',
    mira: (src) => clases(src).flatMap((c) => (c.clases.match(/(?:^|\s)(?:[a-z]+:)?text-(?:\[[^\]]+\]|xs|sm|base|lg|xl|[2-9]xl)(?=\s|$)/g) || [])
      .map((t) => t.trim().replace(/^[a-z]+:/, ''))
      .filter((t) => !CLASES_TEXTO.includes(t))
      .map((t) => ({ linea: c.linea, trozo: t }))),
    ejemploMalo: '<p className="text-[9px] font-bold">Extra</p>',
  },
  {
    id: 'escala_de_radios', apartado: 10,
    que: 'Un radio fuera de los cinco de `RADIOS`.',
    mira: (src) => clases(src).flatMap((c) => (c.clases.match(/(?:^|\s)(?:[a-z]+:)?rounded(?:-(?:t|b|l|r|tl|tr|bl|br))?(?:-(?:\[[^\]]+\]|none|sm|md|lg|xl|2xl|3xl|full))?(?=\s|$)/g) || [])
      .map((t) => t.trim().replace(/^[a-z]+:/, '').replace(/^rounded-(?:t|b|l|r|tl|tr|bl|br)-/, 'rounded-'))
      .filter((t) => !RADIOS.some((r) => r.clase === t))
      .map((t) => ({ linea: c.linea, trozo: t }))),
    ejemploMalo: '<span className="px-1.5 rounded-md">Pecho</span>',
  },
  {
    id: 'peso_fuerte_en_letra_pequena', apartado: 7,
    que: 'Un «extrabold» en letra de 12 px o menos: se reserva para títulos y cifras.',
    mira: (src) => clases(src)
      .filter((c) => c.clases.includes(PESO_FUERTE) && TEXTO_PEQUENO.some((t) => c.clases.split(/\s+/).includes(t)))
      .map((c) => ({ linea: c.linea, trozo: c.clases.slice(0, 60) })),
    ejemploMalo: '<p className="text-[11px] font-extrabold uppercase">Descanso</p>',
  },
  {
    id: 'un_solo_tracking', apartado: 58,
    que: 'Un espaciado de letra distinto de `tracking-wider`.',
    mira: (src) => clases(src).flatMap((c) => (c.clases.match(/\btracking-[a-z[\].0-9-]+/g) || [])
      .filter((t) => t !== TRACKING)
      .map((t) => ({ linea: c.linea, trozo: t }))),
    ejemploMalo: '<p className="uppercase tracking-widest">Descanso</p>',
  },
  {
    id: 'mayusculas_solo_en_rotulos', apartado: 58,
    que: 'MAYÚSCULAS en un texto que no es un rótulo pequeño.',
    mira: (src) => clases(src)
      .filter((c) => /\buppercase\b/.test(c.clases) && !TEXTO_PEQUENO.some((t) => c.clases.split(/\s+/).includes(t)))
      .map((c) => ({ linea: c.linea, trozo: c.clases.slice(0, 60) })),
    ejemploMalo: '<h2 className="text-lg font-bold uppercase">Tu plan</h2>',
  },
  {
    id: 'espaciado_en_la_escala', apartado: 9,
    que: 'Un espaciado fuera de los pasos de `PASOS_ESPACIADO` (un 7, un 9, un valor en píxeles).',
    mira: (src) => clases(src).flatMap((c) => (c.clases.match(/(?:^|\s)-?(?:[a-z]+:)?(?:p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-(?:\[[^\]]+\]|[0-9.]+)(?=\s|$)/g) || [])
      .map((t) => t.trim())
      .filter((t) => !PASOS_ESPACIADO.includes(t.split('-').pop()))
      .map((t) => ({ linea: c.linea, trozo: t }))),
    ejemploMalo: '<div className="p-7 mt-[23px]">',
  },
  {
    id: 'sin_sombras', apartado: 11,
    que: 'Una sombra en una pantalla de Fitness: en oscuro se prefiere el contraste de superficie (la de `Card` la pone el tema).',
    mira: (src) => clases(src).flatMap((c) => (c.clases.match(/\b(?:drop-)?shadow(?:-[a-z0-9[\]]+)?\b/g) || [])
      .map((t) => ({ linea: c.linea, trozo: t }))),
    ejemploMalo: '<div className="shadow-2xl">',
  },
  {
    id: 'sin_hover', apartado: 53,
    /* ⚠️ Tailwind 3 no envuelve `hover:` en `@media (hover: hover)`, así que en
       el iPhone el estado se queda «pegado» después de tocar. JosStyle no usa
       ni un `hover:` en toda la aplicación, y Fitness no va a ser el primero. */
    que: 'Un `hover:`: en el iPhone se queda pegado después de tocar (Tailwind 3).',
    mira: (src) => clases(src).flatMap((c) => (c.clases.match(/\bhover:[^\s]+/g) || []).map((t) => ({ linea: c.linea, trozo: t }))),
    ejemploMalo: '<button className="hover:bg-white/10">',
  },
  {
    id: 'sin_emojis_de_interfaz', apartado: 31,
    que: 'Un emoji haciendo de icono: la familia es lucide (apartado 30).',
    mira: (src) => src.split('\n').flatMap((l, i) => (EMOJI.test(l) ? [{ linea: i + 1, trozo: l.trim().slice(0, 50) }] : [])),
    ejemploMalo: '<p>📝 {notas}</p>',
  },
  {
    id: 'una_familia_de_iconos', apartado: 30,
    que: 'Un icono de otra librería: los de Fitness son de lucide, y los siete grupos musculares, en su misma gramática (`iconosFitness.jsx`, F1).',
    mira: (src) => [...src.matchAll(/import\s+[^;]*from\s+['"]((?:react-icons|@mui|@heroicons|@material|material-icons|@fortawesome|phosphor)[^'"]*)['"]/g)]
      .map((m) => ({ linea: lineaDe(src, m.index), trozo: m[1] })),
    ejemploMalo: "import { MdStar } from 'react-icons/md';",
  },
  {
    id: 'colores_del_tema', apartado: 4,
    que: 'Un color escrito a mano (`#…` o `rgba(…)`): sale de `COLORS`, de `hexToRgba` sobre un token o de `CAPAS` (regla 2).',
    mira: (src) => [...src.matchAll(/['"`](?:#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))['"`]/g)]
      .map((m) => ({ linea: lineaDe(src, m.index), trozo: m[0] })),
    ejemploMalo: "<div style={{ background: 'rgba(0,0,0,0.6)' }}>",
  },
  {
    id: 'acento_como_texto_legible', apartado: 55,
    que: 'El acento como color de texto sin `acentoLegible`: con seis de los doce acentos no llega a 4,5:1.',
    mira: (src) => [...src.matchAll(/\bcolor:\s*([^,}\n]*)/g)]
      .filter((m) => /\baccent\b/.test(m[1].replace(/acentoLegible\(\s*accent\s*\)/g, '')))
      .map((m) => ({ linea: lineaDe(src, m.index), trozo: m[0].slice(0, 60) })),
    ejemploMalo: '<p style={{ color: accent }}>Ahora</p>',
  },
  {
    id: 'acento_en_graficas', apartado: 19,
    que: 'Un trazo o un relleno con el acento sin `acentoLegible`: las tres gráficas dibujan sus datos con el mismo color.',
    mira: (src) => [...src.matchAll(/\b(?:stroke|fill)=\{([^}]*)\}/g)]
      .filter((m) => /\baccent\b/.test(m[1].replace(/acentoLegible\(\s*accent\s*\)/g, '')))
      .map((m) => ({ linea: lineaDe(src, m.index), trozo: m[0].slice(0, 60) })),
    ejemploMalo: '<path d={camino} stroke={accent} />',
  },
  {
    id: 'fechas_de_un_sitio', apartado: 59,
    que: 'Una fecha compuesta por su cuenta: con `toLocaleDateString` o con una lista de meses propia (`fechasFitness.js`).',
    mira: (src) => [...src.matchAll(/toLocaleDateString\(\s*['"]es|Intl\.DateTimeFormat|\[\s*['"](?:ene|ENE|enero|Enero)['"]/g)]
      .map((m) => ({ linea: lineaDe(src, m.index), trozo: m[0] })),
    ejemploMalo: "const MESES = ['ENE', 'FEB'];",
  },
  {
    id: 'imagenes_sin_deformar', apartado: 32,
    que: 'Una imagen con alto y ancho fijos y sin `object-cover` / `object-contain`: se estiraría.',
    mira: (src) => [...src.matchAll(/<(?:img|MissingImage)\b[^>]*?className="([^"]*)"/g)]
      .filter((m) => /\bh-(?:\d|full|\[)/.test(m[1]) && !/\bobject-(?:cover|contain)\b/.test(m[1]))
      .map((m) => ({ linea: lineaDe(src, m.index), trozo: m[1].slice(0, 60) })),
    ejemploMalo: '<img src={u} className="w-16 h-16" />',
  },
  {
    id: 'miniaturas_cuadradas', apartado: 21,
    que: 'Una proporción escrita a mano: las miniaturas de foto son cuadradas (`MINIATURA_FOTO`), y la caja del comparador tiene la suya con nombre.',
    mira: (src) => [...src.matchAll(/aspectRatio:\s*['"`][^'"`]*['"`]/g)]
      .map((m) => ({ linea: lineaDe(src, m.index), trozo: m[0] })),
    ejemploMalo: "<button style={{ aspectRatio: '3 / 4' }}>",
  },
  {
    id: 'pastillas_de_un_sitio', apartado: 42,
    que: 'Una pastilla de filtro o una opción de selector dibujada a mano: son `PastillaFiltro` y `OpcionSegmentada` (piezasFitness.jsx).',
    mira: (src, ruta = '') => (EXCEPCIONES_PASTILLA.some((e) => ruta.endsWith(e.archivo)) ? [] : [...src.matchAll(/<button\b[^>]*?aria-pressed[^>]*?className="([^"]*)"|<button\b[^>]*?className="([^"]*)"[^>]*?aria-pressed/g)]
      /* ⚠️ `px-3(?![.\d])`: «px-3.5» es el botón de favorito, una acción y no un filtro. */
      .filter((m) => /\brounded-full\b[^"]*\bpx-3(?![.\d])|\bpx-3(?![.\d])[^"]*\brounded-full\b|\bh-(?:9|10) px-3 rounded-xl\b/.test(m[1] || m[2] || ''))
      .map((m) => ({ linea: lineaDe(src, m.index), trozo: (m[1] || m[2]).slice(0, 60) }))),
    ejemploMalo: '<button aria-pressed={a} className="px-3 py-1.5 rounded-full text-xs">Gimnasio</button>',
  },
  {
    id: 'velo_de_hoja_unico', apartado: 39,
    que: 'Una hoja con su propio velo o su propia caja: son `HOJA.velo` / `HOJA.caja` (o la confirmación, o el visor).',
    mira: (src) => [...src.matchAll(/className="(fixed inset-0[^"]*)"/g)]
      .map((m) => ({ linea: lineaDe(src, m.index), trozo: m[1].slice(0, 60) })),
    ejemploMalo: '<div className="fixed inset-0 z-50 flex items-end">',
  },
];

export const reglaDeAcabado = (id) => REGLAS_ACABADO.find((r) => r.id === id) || null;

/* ⚠️ Lo que se sale de una regla A PROPÓSITO, con su motivo (EH F49 hizo lo mismo
   con `-m-1.5`): ensanchar la regla hasta que calle es como se le escapa una de
   verdad. */
export const EXCEPCIONES_PASTILLA = [
  { archivo: 'src/components/piezasFitness.jsx', porque: 'Es donde viven las dos piezas.' },
  { archivo: 'src/components/comparadorFotos.jsx', porque: 'Los controles del comparador van en neutro, sin acento: la foto es la protagonista (F27, apartado 22) y el apartado 5 pide no llenar la interfaz de acento.' },
];

/** Lo que incumple un archivo, regla a regla. */
export function revisarArchivo(ruta, fuente) {
  const src = sinComentarios(fuente);
  return REGLAS_ACABADO.flatMap((r) => r.mira(src, ruta).map((h) => ({ archivo: ruta, regla: r.id, apartado: r.apartado, ...h })));
}

/**
 * La auditoría de la fase, sobre los archivos de Fitness y el CSS.
 * Devuelve las casillas —una por regla, y la del CSS— y los hallazgos.
 */
export function auditarAcabado({ archivos = {}, css = '' } = {}) {
  const hallazgos = Object.entries(archivos).flatMap(([ruta, src]) => revisarArchivo(ruta, src));
  const limpio = String(css || '').replace(/\/\*[\s\S]*?\*\//g, '');
  const tabulares = /\.fit-foco[^{]*\{[^}]*font-variant-numeric:\s*tabular-nums/.test(limpio)
    && /\.dialogo-caja[^{]*\{[^}]*font-variant-numeric:\s*tabular-nums/.test(limpio)
    && /\.fit-foco input[^{]*\{[^}]*font-variant-numeric:\s*tabular-nums/.test(limpio);
  const casillas = [
    ...REGLAS_ACABADO.map((r) => {
      const suyos = hallazgos.filter((h) => h.regla === r.id);
      return { id: r.id, apartado: r.apartado, ok: suyos.length === 0, dato: suyos.slice(0, 6).map((h) => `${h.archivo.split('/').pop()}:${h.linea} ${h.trozo}`).join('; ') || 'ninguno' };
    }),
    { id: 'numeros_tabulares', apartado: 8, ok: tabulares, dato: tabulares ? 'Fitness, sus hojas y sus campos' : 'falta la regla en index.css' },
  ];
  return { casillas, hallazgos, ok: casillas.every((c) => c.ok) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · LAS VEINTE PANTALLAS (apartado 60)
   ═══════════════════════════════════════════════════════════════════════════
   Cada una con el archivo que la pinta y dónde se mide: el banco de
   renderizado (con datos buenos, de usuario nuevo y corruptos, F39) y el
   recorrido en Chromium de esta fase, que las abre en oscuro y en claro. */

export const PANTALLAS_F42 = [
  { n: 1, nombre: 'Rangos', archivo: 'src/views/RangosView.jsx' },
  { n: 2, nombre: 'Muscle Rank Detail', archivo: 'src/views/DetalleMuscularView.jsx' },
  { n: 3, nombre: 'Classification', archivo: 'src/views/ClasificacionView.jsx' },
  { n: 4, nombre: 'Progreso', archivo: 'src/views/ProgresoView.jsx' },
  { n: 5, nombre: 'Exercise Progress', archivo: 'src/components/detalleEjercicio.jsx' },
  { n: 6, nombre: 'Fotos', archivo: 'src/components/fotosProgreso.jsx' },
  { n: 7, nombre: 'Comparador', archivo: 'src/components/comparadorFotos.jsx' },
  { n: 8, nombre: 'Objetivos', archivo: 'src/components/objetivosFitness.jsx' },
  { n: 9, nombre: 'Entrenamiento', archivo: 'src/views/FitnessView.jsx' },
  { n: 10, nombre: 'Tu Plan', archivo: 'src/views/TuPlanView.jsx' },
  { n: 11, nombre: 'Planes', archivo: 'src/views/BibliotecaPlanesView.jsx' },
  { n: 12, nombre: 'Plan Detail', archivo: 'src/views/BibliotecaPlanesView.jsx' },
  { n: 13, nombre: 'Templates', archivo: 'src/views/PlantillasView.jsx' },
  { n: 14, nombre: 'Constructor', archivo: 'src/views/ConstructorView.jsx' },
  { n: 15, nombre: 'Exercise Library', archivo: 'src/views/EjerciciosView.jsx' },
  { n: 16, nombre: 'Exercise Detail', archivo: 'src/components/bibliotecaEjercicios.jsx' },
  { n: 17, nombre: 'Live Workout', archivo: 'src/views/EntrenamientoVivoView.jsx' },
  { n: 18, nombre: 'Completion', archivo: 'src/views/FinalizacionView.jsx' },
  { n: 19, nombre: 'History', archivo: 'src/views/HistorialView.jsx' },
  { n: 20, nombre: 'Session Detail', archivo: 'src/views/HistorialView.jsx' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   8 · LO QUE YA EXISTÍA, LO QUE SE HIZO Y LO QUE NO
   ═══════════════════════════════════════════════════════════════════════════ */

export const YA_EXISTIA_F42 = [
  { apartados: [3, 4, 56], que: 'El modo oscuro, el claro y el alto contraste', donde: '`COLORS` + `aplicarTema` (Fase A3 y A7), con `ensureContrast` sobre el texto' },
  { apartados: [5], que: 'El sistema de acentos', donde: '`ACCENTS` y `buildRolesFromAccent` (Personalización F1)' },
  { apartados: [13, 14, 40, 45], que: 'Las tarjetas, los botones y los campos', donde: '`Card`, `PrimaryButton`, `GhostBtn`, `TextInput` de `ui.jsx`, con la escala de `active:scale` (EH F50)' },
  { apartados: [15, 16], que: 'El hexágono del rango, uno solo, en todas las pantallas', donde: '`RankBadge` (F15), con el brillo en su envoltorio (F37)' },
  { apartados: [34], que: 'Un solo esqueleto', donde: '`.esqueleto` de `index.css` y `<Esqueleto>` (E3 F14)' },
  { apartados: [33], que: 'Ni un icono roto ni un rectángulo vacío', donde: '`MissingImage` y `.esqueleto` (F39), y `imagenesSinRespaldo()` caza la imagen nueva que nazca sin respaldo' },
  { apartados: [12], que: 'Bordes sutiles', donde: 'Un píxel de `COLORS.border` (o `borderAlpha`, con su transparencia del tema): ni una tarjeta con borde grueso' },
  { apartados: [35, 36], que: 'Vacíos y errores con el mismo lenguaje', donde: '`EmptyHint`, `MissingData`, `MissingImage` y `AreaSegura` (F36, F39)' },
  { apartados: [37], que: 'Un solo aviso', donde: '`AVISOS_ACCION` y su barra (E3 F9), con `guardado_fallido` y `guardado_sin_espacio` (F37, F41)' },
  { apartados: [47, 48], que: 'La Safe Area y los siete tamaños de pantalla', donde: '`--safe-top`/`--safe-bottom` (E3 F1) y `DISPOSITIVOS_DE_PRUEBA` (F38)' },
  { apartados: [52, 65], que: 'Las animaciones, medidas', donde: '`ANIMACIONES_HC` y `auditarMovimiento` (F37)' },
  { apartados: [54], que: 'El foco', donde: '`.fit-foco :focus-visible` (F39)' },
  { apartados: [55], que: 'Toques de 44 px y movimiento reducido', donde: '`toque-44` (EH F42) y `prefers-reduced-motion` (F37)' },
  { apartados: [65], que: 'Nada pesado', donde: 'Las optimizaciones de la F40: esta fase no añade ni una imagen, ni un desenfoque, ni una sombra' },
  { apartados: [18, 20], que: 'Progreso sin saturar, y los objetivos dentro de él', donde: 'El centro de la F28, donde cada bloque declara UNA fuente, y los objetivos como sección de Progreso (F14, F30)' },
  { apartados: [22], que: 'El comparador con las fotos como protagonistas', donde: 'La F27: a pantalla completa, con las fechas en cada lado y los controles debajo' },
  { apartados: [23, 28], que: 'El entrenamiento en vivo, más enfocado', donde: 'La F9: una tarjeta por ejercicio, la tabla de series y el descanso, sin la barra de abajo' },
  { apartados: [24], que: 'El plan activo, arriba y marcado', donde: 'Tu Plan (F6), con su tarjeta de hoy y la semana (F32)' },
  { apartados: [26, 27], que: 'La biblioteca y la ficha agrupadas por bloques', donde: 'La F34: nombre, músculo y material en la tarjeta; la ficha por bloques plegables' },
  { apartados: [29], que: 'Una acción principal por pantalla', donde: '`PrimaryButton` es uno por pantalla; el resto son `GhostBtn` (ui.jsx)' },
  { apartados: [41], que: 'Los estados de un control', donde: 'Pulsado (`active:scale`, `fit-pulsable`), foco (F39), apagado (`disabled` en ui.jsx, Ajustes · Perfil), cargando (`animate-spin`) y elegido (`aria-pressed`)' },
  { apartados: [42], que: 'Los filtros', donde: 'Una sola pastilla por filtro, con su recuento (F2, F34)' },
  { apartados: [43, 51], que: 'Listas con aire y superficie, no con líneas', donde: 'Filas sobre `surface2` separadas por `gap`, y listas largas de veinte en veinte (F34)' },
  { apartados: [46], que: 'La navegación', donde: 'Las tres pestañas de Fitness, la vuelta de NAVO F1 y la barra de abajo, que no compiten (SC F1)' },
  { apartados: [49], que: 'La densidad', donde: 'La escala de espaciado de Fitness (`PASOS_ESPACIADO`), la misma en todas sus pantallas' },
  { apartados: [60, 66], que: 'Las veinte pantallas, con datos buenos, vacíos y corruptos', donde: '`PANTALLAS_F42`, el banco de renderizado de la F39 y el recorrido de esta fase en oscuro y en claro' },
  { apartados: [61, 62, 64], que: 'Sin quitar información, sin rehacer componentes', donde: 'Se corrigió lo que se salía de la escala; ni un componente sustituido. Lo único nuevo es `BotonCerrarHoja`, que antes estaba escrito dos veces de dos formas' },
  { apartados: [68, 69, 70], que: 'Ni IA, ni gamificación, ni funciones nuevas; build, pruebas e informe', donde: 'Esta fase no añade ni una función: `verificar.sh` en verde y el informe en el CHANGELOG' },
];

/* Lo que mide el recorrido en Chromium, que es lo que no se puede ver leyendo
   el código: lo que el navegador calcula de verdad. */
export const MEDIDO_EN_CHROMIUM = [
  { apartados: [50, 1, 67], que: 'Rangos, Progreso y Entrenamiento con la misma cabecera: tamaño, peso y familia de la letra del título' },
  { apartados: [8, 44], que: 'Las cifras del entrenamiento en vivo, tabulares: el reloj y los campos KG y REPES' },
  { apartados: [5, 55, 56], que: 'El acento legible sobre su superficie, en oscuro y en claro, con el acento de serie' },
  { apartados: [38, 39], que: 'Dos hojas distintas con el mismo velo, el mismo radio y el mismo botón de cerrar' },
  { apartados: [6, 55], que: 'Ninguna letra por debajo de 10 px en las pantallas de Fitness' },
  { apartados: [31, 57], que: 'Ni un emoji ni una palabra de otro concepto en lo que se lee' },
];

export const HECHO_F42 = [
  { apartados: [59], que: '🐛 Cuatro listas de meses y un cuarto formato', como: '`fechasFitness.js`: tres papeles —larga, en frase y etiqueta—, una función cada uno' },
  { apartados: [30, 31], que: '🐛 Emojis haciendo de icono', como: '📝 → `NotebookPen` y 🔒 → `Lock`, de lucide' },
  { apartados: [6, 55], que: '🐛 Texto de 9 px en cinco sitios, y un «12 px» que es `text-xs`', como: 'A 10 px, el paso más pequeño de `ESCALA_TEXTO`' },
  { apartados: [7, 10, 58], que: 'Un radio, dos espaciados de letra y dos pesos fuera de su escala', como: '`rounded-md` → `rounded-lg`; `tracking-wide`/`widest` → `tracking-wider`; «extrabold» a 11 y 12 px → «bold»' },
  { apartados: [38, 39], que: '🐛 Cuatro velos y dos botones de cerrar', como: '`HOJA` y `BotonCerrarHoja`: tres familias (hoja, confirmación y visor)' },
  { apartados: [4, 63], que: 'Los colores de encima de una foto, escritos a mano en cada componente', como: '`CAPAS` en `tokens.js`: no cambian con el tema, así que no son de `COLORS`' },
  { apartados: [21, 32], que: 'Miniaturas cuadradas en dos sitios y 3:4 en otro', como: '`MINIATURA_FOTO`, cuadradas en los tres' },
  { apartados: [5, 55, 56], que: '🐛 El acento como texto por debajo de 4,5:1 con doce de los veinticuatro pares tema × acento', como: '`acentoLegible`, sobre la superficie con menos contraste' },
  { apartados: [8, 44], que: 'Las cifras bailaban en todo lo que no llevaba `tabular-nums` —el iPhone usa cifras proporcionales por defecto—', como: 'Una regla en `index.css` para Fitness, sus hojas y sus campos' },
  { apartados: [57], que: '«Sesión» y «rutina» donde Fitness dice «entrenamiento» y «plantilla»', como: '`TERMINOS_FITNESS`, y el banco de renderizado lo busca en lo que se pinta' },
  { apartados: [42, 64], que: '🐛 La pastilla de un filtro, escrita siete veces con tres radios y dos tamaños —y una sin zona de toque de 44 px—', como: '`PastillaFiltro` y `OpcionSegmentada` (piezasFitness.jsx); `ExerciseFilterChip` (F34) conserva su nombre' },
  { apartados: [19], que: 'La gráfica de objetivos dibujaba los datos con el color del texto y la meta con el acento, al revés que las otras dos', como: 'Los datos con el acento legible y la referencia discontinua y neutra, en las tres' },
  { apartados: [57], que: '«Cerrar la sesión» en Tu Plan se leía como salir de la cuenta', como: '«Cerrar el entrenamiento del día»' },
];

export const NO_EN_FIT42 = [
  { apartado: 25, que: 'Una imagen en cada tarjeta de plan', porque: 'Los planes de la biblioteca (F5) no traen imagen, y un recurso inventado sería la regla 8. La tarjeta lleva su icono de entorno.' },
  { apartado: 17, que: 'Revisar las ilustraciones anatómicas', porque: 'No existen: los campos de anatomía del catálogo valen `null` desde la F2 (*"si los recursos lo permiten"*). Los grupos se dibujan con los iconos de `iconosFitness.jsx`.' },
  { apartado: 38, que: 'Un asa en las hojas', porque: 'Ninguna hoja se arrastra, y un asa promete ese gesto (regla 8). Se cierran con su botón, tocando fuera o con Escape.' },
  { apartado: 53, que: 'Estados `hover` para escritorio', porque: 'Tailwind 3 no los limita a los dispositivos con ratón, así que en el iPhone se quedarían pegados tras tocar —justo lo que el apartado prohíbe—. JosStyle no tiene ni uno.' },
  { apartado: 56, que: 'Probar con brillo bajo, alto y modo noche', porque: 'Es mirar la pantalla del iPhone (R1). Lo que sí se mide es el contraste: el secundario da 5,1:1 o más en los dos temas, y el acento pasa por `acentoLegible`.' },
  { apartado: 62, que: 'Rehacer el comparador con el acento', porque: 'Sus controles van en neutro a propósito (F27): la foto manda. Está en `EXCEPCIONES_PASTILLA`.' },
  { apartado: 2, que: 'Parecerse a Apple Fitness o a Symmetry', porque: '*"NO copiar interfaces"*: se mide la coherencia interna, que es lo que se puede comprobar.' },
];

export const DECISIONES_FIT42 = [
  { id: 'medir_la_escala', apartados: [6, 9, 10, 63], que: 'La escala es la que Fitness ya usaba, medida sobre sus archivos', porque: 'Imponer una nueva cambiaría el aspecto de toda la aplicación por gusto, y el apartado 62 lo prohíbe. Se corrige lo que se sale.' },
  { id: 'fechas_por_papel', apartados: [59], que: 'Tres formatos de fecha, uno por papel', porque: '*"o el formato establecido por Jos Style"*: el de la F8 manda, y el propio enunciado usa «12 SEP» en las miniaturas y «12 de septiembre» en las frases.', formatos: FORMATOS_FECHA.map((f) => f.ejemplo) },
  { id: 'acento_solo_como_texto', apartados: [5, 55], que: 'El acento legible solo cambia el TEXTO y los iconos', porque: 'Un botón sigue con el acento elegido: su texto lo resuelve `textOnAccent`. Y si el acento ya llega a 4,5:1, es el mismo color.' },
  { id: 'terminos_por_fuera', apartados: [57], que: 'Se cambia lo que se lee, nunca un id ni una clave', porque: '`sesion` es la clave guardada desde la F7: renombrarla sería una migración de datos, y el «IMPORTANTE» prohíbe tocar la persistencia (FIT F1: un módulo se renombra por fuera).' },
  { id: 'tabulares_en_css', apartados: [8, 44], que: 'Las cifras tabulares, con una regla y no clase a clase', porque: 'Cada cifra que se añada después las hereda sola; con clases, la siguiente pantalla se olvidaría. ⚠️ Los campos no heredan `font-variant`, y llevan su propia línea.' },
];
