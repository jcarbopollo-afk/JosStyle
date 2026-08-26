// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 1 — Arquitectura del sistema de fondos.
//
// EL FONDO ES UN ELEMENTO PROPIO, NO "UNA IMAGEN DETRÁS"
// El apartado 2 es explícito: la aplicación no debe tratar una fotografía como
// una imagen colocada detrás de la interfaz. Tiene que haber un sistema
// centralizado que sepa qué fondo está activo, cuál usa, cómo se muestra, con
// qué configuración y qué colores usa la interfaz encima.
//
// ESTO AMPLÍA EL SISTEMA DE APARIENCIA, NO COMPITE CON ÉL (apartado 5)
// Ya existen `COLORS` (singleton mutable), `aplicarTema()` y `colorEngine.js`.
// El fondo NO los sustituye ni los duplica: se guarda dentro de `apariencia`,
// que es donde ya viven tema, densidad, radio y alto contraste, y se resuelve
// en el mismo sitio y en el mismo momento. La cadena que manda es la del
// apartado 5:
//
//   apariencia global → claro/oscuro → colores → FONDO → botones → tarjetas…
//
// LO QUE ESTA FASE NO HACE, A PROPÓSITO (apartado 16)
// Ni detector de colores, ni recomendaciones, ni editor fotográfico, ni
// filtros, ni presets, ni análisis de contraste automático, ni editor de
// degradados. Todo eso son las fases 2-12. Aquí se construye la base para que
// quepan sin rehacer nada — por eso el modelo declara desde hoy campos que
// todavía nadie escribe (`analisis`, `paleta`, `recomendacion`).
//
// Y ESO NO ES ADORNO: regla 5 del proyecto — `loadData` NO fusiona con el
// valor por defecto. Un campo que aparezca en la Fase 5 no lo tendrá la
// configuración ya guardada, y arreglarlo entonces exige una migración a mano.
// Declararlo hoy, vacío, cuesta cero y evita eso. Es la misma decisión que se
// tomó con las 21 propiedades de la prenda en AR Fase 1.
// ---------------------------------------------------------------------------
import { isValidHex, normalizeHex, NEGRO, BLANCO } from './colorEngine';

/* ===========================================================================
   TIPOS DE FONDO (apartado 3)
   =========================================================================== */

// Los cinco del apartado 3, desde el primer día. `implementado: false` es
// información para la interfaz, no un "próximamente" pintado en pantalla: la
// regla 8 del proyecto prohíbe enseñar controles decorativos, así que Ajustes
// solo ofrece los que ya funcionan, y los demás existen aquí para que el
// modelo y `resolverFondo` sepan tratarlos cuando lleguen sus fases.
export const TIPOS_FONDO = [
  { id: 'ninguno', label: 'Sin fondo', descripcion: 'El fondo normal de JosStyle.', implementado: true },
  { id: 'color', label: 'Color sólido', descripcion: 'Un color liso a tu gusto.', implementado: true },
  { id: 'degradado', label: 'Degradado', descripcion: 'Dos colores fundidos.', implementado: true },
  { id: 'foto', label: 'Fotografía', descripcion: 'Una foto tuya.', implementado: true },
  { id: 'predeterminado', label: 'Incluido', descripcion: 'Uno de los fondos de JosStyle.', implementado: true },
];

export const tipoDeFondo = (id) => TIPOS_FONDO.find((t) => t.id === id) || TIPOS_FONDO[0];

/* ===========================================================================
   FONDOS INCLUIDOS (apartado 3-E)
   =========================================================================== */

// Fondos que trae la app. Son degradados definidos con los TOKENS del tema, no
// con hex sueltos, por dos motivos: la regla 2 del proyecto prohíbe un hex
// fuera de `tokens.js`, y —más importante— así un fondo incluido sigue el tema
// claro/oscuro y el acento de Josué en vez de imponer un color ajeno.
//
// `token` nombra de dónde sale cada color en el momento de pintar; nada se
// congela aquí.
export const FONDOS_INCLUIDOS = [
  { id: 'acento_suave', label: 'Acento suave', de: 'accent', a: 'bg', angulo: 160, fuerza: 0.18 },
  { id: 'acento_intenso', label: 'Acento intenso', de: 'accent', a: 'bg', angulo: 160, fuerza: 0.38 },
  { id: 'secundario', label: 'Secundario', de: 'secondary', a: 'bg', angulo: 200, fuerza: 0.22 },
  { id: 'terciario', label: 'Terciario', de: 'tertiary', a: 'bg', angulo: 200, fuerza: 0.22 },
  { id: 'profundidad', label: 'Profundidad', de: 'surface2', a: 'bg', angulo: 180, fuerza: 1 },
];

export const fondoIncluido = (id) => FONDOS_INCLUIDOS.find((f) => f.id === id) || FONDOS_INCLUIDOS[0];

/* ===========================================================================
   MODELO CENTRAL (apartado 4)
   =========================================================================== */

/**
 * El estado único que controla el fondo. Un solo objeto, guardado dentro de
 * `apariencia.fondo`, del que sale TODO lo que se pinta.
 *
 * Los nombres son los del apartado 4 traducidos al castellano que ya usa el
 * resto del proyecto (el apartado permite otra nomenclatura mientras exista la
 * misma capacidad). La correspondencia, para que no haya duda al leer la
 * especificación al lado del código:
 *
 *   type → tipo · source → origen · image → foto · color → color
 *   gradient → degradado · position → posicion · scale → escala
 *   opacity → opacidad · blur → desenfoque · overlay → velo
 *   isActive → activo
 */
export const DEFAULT_FONDO = {
  // --- Qué fondo es ---
  tipo: 'ninguno',          // uno de TIPOS_FONDO
  activo: false,            // apartado 4 `isActive`: se puede tener un fondo configurado y apagado
  incluido: 'acento_suave', // cuál de FONDOS_INCLUIDOS, cuando tipo === 'predeterminado'
  color: '',                // hex, cuando tipo === 'color'
  degradado: { de: '', a: '', angulo: 160 },

  // --- La fotografía (apartado 7 de la Fase 1, apartado 11 de la Fase 2) ---
  foto: {
    id: '',                 // identificador de la fotografía
    path: '',               // ruta en Storage, como las fotos de Salud y Armario
    origen: '',             // 'galeria' | 'camara'
    formato: '',            // tipo MIME, tal cual lo declara el archivo
    ancho: 0,
    alto: 0,
    proporcion: 0,          // ancho/alto: <1 vertical, =1 cuadrada, >1 horizontal
    peso: 0,                // bytes
    anadidaEn: '',          // ISO, para poder ordenar y para la Fase 12
  },

  // --- Cómo se muestra (apartado 4 de la F1, apartados 4-12 de la F3) ---
  //
  // FO Fase 3 sustituyó `posicion` (5 valores fijos) por `encuadre`, dos porcentajes
  // libres. NO conviven: dos formas de decir lo mismo son dos fuentes de verdad, y
  // `normalizarFondo` traduce el `posicion` guardado por v1.36/37 a coordenadas.
  encuadre: { x: 50, y: 50 },   // % del punto de la foto que queda centrado
  escala: 100,              // %
  opacidad: 100,            // % del propio fondo

  desenfoque: 0,            // px

  // Apartados 9 y 10 en UN solo control bipolar en vez de dos deslizadores.
  // Negativo oscurece, positivo aclara, 0 es la foto tal cual. Dos controles para
  // dos mitades del mismo eje se contradicen entre sí en cuanto los dos valen algo
  // —¿qué es "oscurecer 40 y aclarar 30"?— y el apartado 17 pide no llenar la
  // pantalla de controles. El tope de aclarado es menor a propósito (apartado 10:
  // "no debe provocar pérdida exagerada de contraste").
  luminosidad: 0,           // -90 (oscuro) .. +60 (claro)

  // Apartado 12 — la capa superpuesta. `color: ''` significa "el fondo del tema",
  // que es lo que hacía el `velo` de la Fase 1: se conserva ese comportamiento y se
  // le añade poder elegir color. `velo` guardado por v1.36/37 se migra aquí.
  overlay: { color: '', intensidad: 0 },

  // --- Preparado para las fases 4, 5 y 6 (apartados 8 y 9) ---
  // Nadie escribe esto todavía. Existe para que la configuración ya guardada
  // no necesite una migración cuando lleguen esas fases (regla 5).
  // Apartado 20 de la Fase 3 — los ajustes de cada fotografía, por su id, para que
  // volver a una imagen ya usada recupere su encuadre en vez de heredar el de otra.
  ajustesPorFoto: {},

  analisis: null,           // Fase 5: colores detectados en la fotografía
  paleta: null,             // Fase 4/5: paleta derivada
  recomendacion: null,      // Fase 6: apariencia completa recomendada para este fondo
};

// Las cinco posiciones fijas de la Fase 1, ahora solo como TABLA DE MIGRACIÓN: la
// Fase 3 las sustituyó por un encuadre libre. Se conservan para poder traducir lo
// guardado por v1.36/37, y como atajos en la interfaz del editor.
export const POSICIONES_FONDO = [
  { id: 'centro', label: 'Centro', x: 50, y: 50 },
  { id: 'arriba', label: 'Arriba', x: 50, y: 0 },
  { id: 'abajo', label: 'Abajo', x: 50, y: 100 },
  { id: 'izquierda', label: 'Izquierda', x: 0, y: 50 },
  { id: 'derecha', label: 'Derecha', x: 100, y: 50 },
];

export const posicionDeFondo = (id) => POSICIONES_FONDO.find((p) => p.id === id) || POSICIONES_FONDO[0];

/**
 * Normaliza cualquier configuración de fondo, venga de donde venga.
 *
 * Existe por la regla 5: `loadData` no fusiona con el valor por defecto, así
 * que una configuración guardada por una versión anterior llega sin los campos
 * nuevos. Esto los repone SIN pisar lo que el usuario sí tenía, y de paso acota
 * los números al rango en que significan algo — un `escala: 4000` guardado por
 * error no puede dejar la app inutilizable.
 */
export function normalizarFondo(guardado) {
  const g = guardado || {};
  const f = { ...DEFAULT_FONDO, ...g };
  return {
    ...f,
    tipo: TIPOS_FONDO.some((t) => t.id === f.tipo) ? f.tipo : 'ninguno',
    activo: !!f.activo,
    color: isValidHex(f.color) ? normalizeHex(f.color) : '',
    degradado: { ...DEFAULT_FONDO.degradado, ...(f.degradado || {}) },
    foto: { ...DEFAULT_FONDO.foto, ...(f.foto || {}) },
    encuadre: encuadreNormalizado(f),
    escala: acotar(f.escala, 100, 100, 300),
    opacidad: acotar(f.opacidad, 100, 0, 100),
    desenfoque: acotar(f.desenfoque, 0, 0, 40),
    luminosidad: acotar(f.luminosidad, 0, -90, 60),
    overlay: {
      color: isValidHex(f.overlay?.color) ? normalizeHex(f.overlay.color) : '',
      // Migración de v1.36/37: el `velo` de la Fase 1 era exactamente esto con el
      // color del tema. Se mira `g` (lo GUARDADO) y no `f` (lo ya fusionado con el
      // valor por defecto), porque `f.overlay` siempre existe —lo pone el default—
      // con `intensidad: 0`, y `??` no salta con 0. Mirando `f` la migración no se
      // habría ejecutado nunca y el velo de quien lo tuviera puesto desaparecería.
      intensidad: acotar(g.overlay ? g.overlay.intensidad : g.velo, 0, 0, 90),
    },
    ajustesPorFoto: f.ajustesPorFoto && typeof f.ajustesPorFoto === 'object' ? f.ajustesPorFoto : {},
    // FO Fase 5 — el análisis se conserva tal cual. Va sellado con el id de su
    // fotografía (`analisisValidoPara`), así que no hace falta invalidarlo aquí:
    // si la foto cambia, el sello deja de coincidir y se vuelve a analizar solo.
    analisis: f.analisis || null,
    // `posicion` ya no forma parte del modelo: se ha traducido a `encuadre` arriba.
    posicion: undefined,
  };
}

/**
 * El encuadre, traduciendo lo que hiciera falta.
 *
 * Un fondo guardado por v1.36/37 trae `posicion: 'arriba'` y ningún `encuadre`. Se
 * convierte una vez, aquí, en vez de dejar que las dos formas convivan: dos maneras
 * de decir dónde va la foto son dos fuentes de verdad, y ya se sabe cómo acaba eso.
 */
function encuadreNormalizado(f) {
  if (f.encuadre && Number.isFinite(Number(f.encuadre.x))) {
    return { x: acotar(f.encuadre.x, 50, 0, 100), y: acotar(f.encuadre.y, 50, 0, 100) };
  }
  const p = POSICIONES_FONDO.find((x) => x.id === f.posicion);
  return p ? { x: p.x, y: p.y } : { x: 50, y: 50 };
}

function acotar(valor, porDefecto, min, max) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return porDefecto;
  return Math.min(max, Math.max(min, n));
}

/* ===========================================================================
   PRIORIDAD (apartado 6)
   =========================================================================== */

/**
 * Decide qué fondo se pinta de verdad. La cadena del apartado 6:
 *
 *   fondo elegido por el usuario
 *     ↓ si no existe o no se puede pintar
 *   fondo predeterminado
 *     ↓ si tampoco
 *   fondo normal de JosStyle
 *
 * "Nunca debe aparecer un fondo vacío, roto o indefinido" — literal del
 * apartado. Por eso esta función NUNCA devuelve null: el peor caso es
 * `{ tipo: 'ninguno' }`, que es el fondo de siempre y siempre se puede pintar.
 *
 * `motivo` dice por qué se ha caído al siguiente escalón. No es para enseñarlo
 * en pantalla: es para que la Fase 2 pueda avisar de que una foto ya no está
 * en vez de dejar a Josué mirando un fondo liso sin saber qué ha pasado.
 */
export function resolverFondo(fondo, { urlFoto } = {}) {
  const f = normalizarFondo(fondo);
  const sinFondo = { ...f, tipo: 'ninguno', motivo: null };

  if (!f.activo) return { ...sinFondo, motivo: f.tipo === 'ninguno' ? null : 'desactivado' };

  switch (f.tipo) {
    case 'color':
      // Un color inválido o vacío no se pinta: se cae al fondo normal.
      return f.color ? { ...f, motivo: null } : { ...sinFondo, motivo: 'color_invalido' };

    case 'degradado': {
      const de = isValidHex(f.degradado.de) ? normalizeHex(f.degradado.de) : '';
      const a = isValidHex(f.degradado.a) ? normalizeHex(f.degradado.a) : '';
      return de && a
        ? { ...f, degradado: { ...f.degradado, de, a }, motivo: null }
        : { ...sinFondo, motivo: 'degradado_invalido' };
    }

    case 'foto':
      // La URL la firma quien llama (Storage, una hora, como Salud y Armario).
      // Sin URL no hay foto que pintar: se baja al fondo incluido, que siempre
      // funciona, en vez de dejar un hueco.
      if (urlFoto) return { ...f, urlFoto, motivo: null };
      return { ...f, tipo: 'predeterminado', urlFoto: null, motivo: 'foto_no_disponible' };

    case 'predeterminado':
      return { ...f, motivo: null };

    case 'ninguno':
    default:
      return sinFondo;
  }
}

/* ===========================================================================
   CÓMO SE PINTA (apartados 11 y 13)
   =========================================================================== */

/**
 * Traduce un fondo YA RESUELTO a estilos CSS.
 *
 * Recibe `colors` en vez de importar el singleton `COLORS` a propósito: así
 * esta función es pura y se puede probar con Node sin montar React ni tocar el
 * tema global. Es la misma razón por la que el resto de motores del proyecto
 * (`armario.js`, `armarioInteligencia.js`) no importan nada de la interfaz.
 *
 * Devuelve `null` cuando no hay nada que pintar — el fondo normal de la app ya
 * lo pinta `COLORS.bg`, y devolver una capa transparente encima sería una capa
 * de más en cada render para no hacer nada.
 */
export function estilosDeFondo(resuelto, colors) {
  if (!resuelto || resuelto.tipo === 'ninguno') return null;
  const c = colors || {};

  const comun = {
    opacity: resuelto.opacidad / 100,
    filter: resuelto.desenfoque > 0 ? `blur(${resuelto.desenfoque}px)` : undefined,
    // Un desenfoque recorta los bordes de la capa y deja ver el fondo de debajo
    // como un halo. Se agranda la capa lo justo para que el recorte caiga fuera.
    transform: resuelto.desenfoque > 0 ? `scale(${1 + resuelto.desenfoque / 100})` : undefined,
  };

  switch (resuelto.tipo) {
    case 'color':
      return { ...comun, background: resuelto.color };

    case 'degradado':
      return { ...comun, background: `linear-gradient(${resuelto.degradado.angulo}deg, ${resuelto.degradado.de}, ${resuelto.degradado.a})` };

    case 'predeterminado': {
      const inc = fondoIncluido(resuelto.incluido);
      const de = c[inc.de] || c.accent || c.bg;
      const a = c[inc.a] || c.bg;
      // `fuerza` mezcla con el fondo del tema en vez de sustituirlo: un fondo
      // incluido acompaña al tema, no lo tapa.
      return {
        ...comun,
        background: `linear-gradient(${inc.angulo}deg, ${mezclarCss(de, a, inc.fuerza)}, ${a})`,
      };
    }

    case 'foto':
      return {
        ...comun,
        backgroundImage: `url("${resuelto.urlFoto}")`,
        // `cover` con la escala como zoom encima. Nunca `100% 100%`, que sí
        // deformaría: el apartado 7 dice que la relación de aspecto original se
        // conserva siempre.
        backgroundSize: resuelto.escala === 100 ? 'cover' : `${resuelto.escala}%`,
        // Los dos porcentajes del encuadre libre (apartados 5 y 6 de la Fase 3).
        // En CSS, `background-position: X% Y%` alinea el punto X%/Y% de la imagen
        // con el punto X%/Y% del contenedor, que es justo lo que hace falta para
        // "decidir qué parte de la fotografía queda visible".
        backgroundPosition: `${resuelto.encuadre.x}% ${resuelto.encuadre.y}%`,
        backgroundRepeat: 'no-repeat',
      };

    default:
      return null;
  }
}

/**
 * Mezcla dos colores en CSS puro, sin tocar el motor de color.
 *
 * `color-mix` lo entienden Safari 16.2+ y todos los navegadores actuales; el
 * iPhone de Josué lo soporta. Si algún día no estuviera, el `linear-gradient`
 * entero se ignora y queda el fondo del tema — que es exactamente el
 * comportamiento que pide el apartado 6: nunca un fondo roto.
 */
const mezclarCss = (a, b, t) => `color-mix(in oklab, ${a} ${Math.round(t * 100)}%, ${b})`;

/**
 * El velo entre el fondo y la interfaz (apartado 4, `overlay`).
 *
 * Va en su propia capa, no en la del fondo, por un motivo concreto: el velo NO
 * debe desenfocarse ni escalarse con la fotografía. Si compartieran capa, subir
 * el desenfoque difuminaría también el velo y dejaría de proteger la lectura,
 * que es justo para lo que existe.
 *
 * Se pinta con `COLORS.bg`, así que en tema claro aclara y en oscuro oscurece,
 * sin decidir nada por su cuenta.
 */
export function estilosDeVelo(resuelto, colors) {
  if (!resuelto || resuelto.tipo === 'ninguno') return null;
  const { color, intensidad } = resuelto.overlay || {};
  if (!intensidad) return null;
  // `color: ''` significa "el fondo del tema", que es lo que hacía el velo de la
  // Fase 1: así el overlay por defecto sigue aclarando en tema claro y oscureciendo
  // en oscuro, sin decidir nada por su cuenta.
  return { background: color || (colors || {}).bg || 'transparent', opacity: intensidad / 100 };
}

/**
 * FO Fase 3, apartados 9 y 10 — oscurecer o aclarar la fotografía.
 *
 * Va en una TERCERA capa, y no mezclado con el overlay, porque son cosas
 * distintas: esto ajusta la luz de la foto (blanco o negro puros), el overlay la
 * tiñe hacia un color. Juntarlos obligaría a elegir uno de los dos, y la
 * especificación pide los dos por separado (apartados 9, 10 y 12).
 *
 * Tampoco se hace con `filter: brightness()` sobre la capa de la foto: eso
 * también apagaría el overlay que va encima, y "oscurecer la foto" no debe
 * oscurecer una capa que no es la foto.
 */
export function estilosDeLuminosidad(resuelto) {
  if (!resuelto || resuelto.tipo === 'ninguno' || !resuelto.luminosidad) return null;
  const l = resuelto.luminosidad;
  // `NEGRO`/`BLANCO` de `colorEngine`, no un hex escrito aquí. No son colores de
  // interfaz —oscurecer es acercar al negro en tema claro Y en oscuro— así que no
  // pertenecen a `tokens.js`; viven en el motor de color, y así el mismo par lo
  // usan esta capa y el auditor de legibilidad sin escribirlo dos veces.
  return {
    background: l < 0 ? NEGRO : BLANCO,
    opacity: Math.abs(l) / 100,
  };
}

/* ===========================================================================
   CAMBIAR Y RESTABLECER (apartados 13 y 14)
   =========================================================================== */

/**
 * La función central de "seleccionar fondo" del apartado 13. Devuelve una
 * configuración nueva; no muta nada ni guarda nada — de eso se encarga quien
 * llama, con el `saveData` que ya existe (apartado 12: no crear una segunda
 * base de datos).
 *
 * Elegir un tipo lo ACTIVA, salvo 'ninguno'. Es lo que espera cualquiera: si
 * tocas "Color sólido" y no pasa nada hasta que además pulses un interruptor
 * aparte, el control parece roto.
 */
export function seleccionarFondo(fondo, tipo, datos = {}) {
  const base = normalizarFondo(fondo);
  return normalizarFondo({
    ...base,
    ...datos,
    tipo: TIPOS_FONDO.some((t) => t.id === tipo) ? tipo : base.tipo,
    activo: tipo !== 'ninguno',
  });
}

/** Cambia solo los ajustes de presentación, sin tocar qué fondo es. */
export const ajustarFondo = (fondo, cambios) => normalizarFondo({ ...normalizarFondo(fondo), ...cambios });

/**
 * Apartado 14 — "Restablecer fondo".
 *
 * Vuelve al fondo normal de JosStyle **sin borrar nada**: la foto elegida, el
 * color y los ajustes se conservan tal cual, solo se desactiva. El apartado es
 * explícito ("no debe eliminar definitivamente fotografías ni configuraciones")
 * y encaja con cómo funciona el resto de la app desde ME Fase 3: lo reversible
 * no se destruye.
 */
export function restablecerFondo(fondo) {
  return normalizarFondo({ ...normalizarFondo(fondo), tipo: 'ninguno', activo: false });
}

/** ¿Hay algo configurado a lo que se pueda volver tras restablecer? */
export function tieneFondoGuardado(fondo) {
  const f = normalizarFondo(fondo);
  return !!(f.color || f.foto.path || (f.degradado.de && f.degradado.a));
}

/* ===========================================================================
   FO Fase 2 — LA FOTOGRAFÍA
   =========================================================================== */

// Apartado 5: verticales, horizontales, cuadradas y panorámicas. La proporción
// no es una etiqueta que se guarde: se deduce de las medidas reales, que es lo
// único que no puede mentir.
export const ORIENTACIONES_FOTO = [
  { id: 'vertical', label: 'Vertical' },
  { id: 'cuadrada', label: 'Cuadrada' },
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'panoramica', label: 'Panorámica' },
];

export function orientacionDeFoto(foto) {
  const p = Number(foto?.proporcion);
  if (!Number.isFinite(p) || p <= 0) return null;   // sin medidas no se inventa una
  if (p >= 2) return 'panoramica';
  if (p > 1.05) return 'horizontal';
  if (p < 0.95) return 'vertical';
  return 'cuadrada';
}

/**
 * Los datos de una fotografía recién elegida (apartado 11).
 *
 * `ancho`/`alto` los mide quien llama con la imagen ya cargada — aquí no se
 * toca el DOM para que el motor siga siendo puro y probable con Node.
 */
export function datosDeFoto({ path, origen = 'galeria', formato = '', ancho = 0, alto = 0, peso = 0 } = {}) {
  const a = Number(ancho) || 0;
  const h = Number(alto) || 0;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    path: path || '',
    origen,
    formato,
    ancho: a,
    alto: h,
    proporcion: h > 0 ? Number((a / h).toFixed(4)) : 0,
    peso: Number(peso) || 0,
    anadidaEn: new Date().toISOString(),
  };
}

/**
 * Apartado 6 — el encuadre inicial razonable, calculado a partir de la foto.
 *
 * No es "centrar y ya": una foto panorámica centrada en una pantalla de móvil
 * (muy vertical) deja fuera casi todo, y una foto muy vertical centrada corta
 * exactamente por donde suele estar lo importante. Así que:
 *
 *   · panorámica → centrada, porque el sujeto suele estar en medio y a lo ancho;
 *   · muy vertical → anclada ARRIBA, que es donde está el cielo/el rostro en la
 *     inmensa mayoría de fotos de móvil, en vez de cortar por la cintura;
 *   · el resto → centrada.
 *
 * `cover` siempre: el apartado 5 dice que la imagen NUNCA debe deformarse.
 * Por eso la escala inicial es 100, que en `estilosDeFondo` significa `cover`.
 */
export function encuadreInicial(foto) {
  const orientacion = orientacionDeFoto(foto);
  return {
    encuadre: { x: 50, y: orientacion === 'vertical' ? 0 : 50 },
    escala: 100,
  };
}

/**
 * Apartado 12 — no cargar una imagen gigantesca si no hace falta.
 *
 * Esto NO es la optimización avanzada (esa es la Fase 11): es la comprobación
 * mínima honesta para no dejar que un archivo de 40 MB entre en el sistema y
 * bloquee un iPhone. Devuelve el motivo en texto para poder decírselo al
 * usuario en vez de fallar en silencio.
 */
export const MAX_PESO_FONDO = 12 * 1024 * 1024;   // 12 MB
export const FORMATOS_FONDO = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export function validarFotoFondo(file) {
  if (!file) return { ok: false, motivo: 'No se ha elegido ninguna imagen.' };
  // El tipo puede venir vacío en algunos navegadores; entonces no se rechaza por
  // formato, porque rechazar una foto válida es peor que aceptar una rara.
  if (file.type && !FORMATOS_FONDO.includes(file.type)) {
    return { ok: false, motivo: 'Ese archivo no es una imagen que pueda usar de fondo.' };
  }
  if (file.size > MAX_PESO_FONDO) {
    const mb = (file.size / 1024 / 1024).toFixed(1);
    return { ok: false, motivo: `La imagen pesa ${mb} MB y el máximo son 12 MB. Prueba con otra.` };
  }
  return { ok: true, motivo: null };
}

/**
 * Apartado 7 — aplicar la fotografía. Es `seleccionarFondo('foto')` más el
 * encuadre inicial del apartado 6, en una sola operación para que no se pueda
 * aplicar una foto sin encuadrar.
 *
 * Apartado 14, y es la parte que importa: **NO borra el color ni el degradado**.
 * Elegir una foto no puede tirar la configuración de color que Josué tenía, y
 * `seleccionarFondo` ya conserva todo lo que no se le pide cambiar.
 */
export function aplicarFoto(fondo, foto) {
  const datos = { ...DEFAULT_FONDO.foto, ...(foto || {}) };
  return seleccionarFondo(fondo, 'foto', { foto: datos, ...encuadreInicial(datos) });
}

/**
 * Apartado 9 — "Quitar foto".
 *
 * Vuelve al fondo anterior según la lógica de la Fase 1, y **la fotografía no
 * se elimina definitivamente**: se conserva en el modelo por si la Fase 12
 * implementa recuperación, exactamente como pide el apartado. Lo que cambia es
 * qué está activo.
 *
 * Si había un color o un degradado configurados, se vuelve a ellos —eso es "el
 * fondo anterior"—; si no había nada, al fondo normal de JosStyle.
 */
export function quitarFoto(fondo) {
  const f = normalizarFondo(fondo);
  if (f.color) return seleccionarFondo(f, 'color');
  if (f.degradado.de && f.degradado.a) return seleccionarFondo(f, 'degradado');
  return restablecerFondo(f);
}

/* ===========================================================================
   FO Fase 3 — EL EDITOR
   =========================================================================== */

// Qué cuenta como "ajuste de presentación". Está en un solo sitio y con nombre
// porque lo usan tres cosas distintas —restablecer, cambiar de foto y guardar los
// ajustes por foto— y si cada una tuviera su propia lista, acabarían discrepando.
export const AJUSTES_PRESENTACION = ['encuadre', 'escala', 'opacidad', 'desenfoque', 'luminosidad', 'overlay'];

// Los ajustes que describen DÓNDE está la foto. Son propios de esa imagen
// concreta: el encuadre bueno de un retrato vertical no significa nada en una
// panorámica.
const AJUSTES_GEOMETRICOS = ['encuadre', 'escala'];

/** Los valores "de fábrica" de la presentación, sacados del propio DEFAULT_FONDO. */
export function ajustesPorDefecto() {
  const out = {};
  for (const k of AJUSTES_PRESENTACION) {
    out[k] = typeof DEFAULT_FONDO[k] === 'object' && DEFAULT_FONDO[k] !== null
      ? { ...DEFAULT_FONDO[k] }
      : DEFAULT_FONDO[k];
  }
  return out;
}

/** Extrae solo los ajustes de presentación de un fondo. */
export function ajustesDe(fondo) {
  const f = normalizarFondo(fondo);
  const out = {};
  for (const k of AJUSTES_PRESENTACION) {
    out[k] = typeof f[k] === 'object' && f[k] !== null ? { ...f[k] } : f[k];
  }
  return out;
}

/**
 * Apartado 13 — "Restablecer": devuelve la fotografía a sus valores originales.
 *
 * **No elimina la fotografía**, solo sus ajustes; el apartado lo subraya. Y el
 * encuadre no vuelve a "centro" a secas sino al **encuadre inicial** que calculó
 * la Fase 2 para esa orientación: para una foto vertical, "original" es anclada
 * arriba, que es como se aplicó. Volver al centro sería restablecer a un estado
 * en el que esa foto no ha estado nunca.
 */
export function restablecerAjustes(fondo) {
  const f = normalizarFondo(fondo);
  return normalizarFondo({ ...f, ...ajustesPorDefecto(), ...encuadreInicial(f.foto) });
}

/** ¿Hay algún ajuste distinto de los de fábrica? Para no ofrecer un botón inerte. */
export function tieneAjustes(fondo) {
  const a = ajustesDe(fondo);
  const base = { ...ajustesPorDefecto(), ...encuadreInicial(normalizarFondo(fondo).foto) };
  return JSON.stringify(a) !== JSON.stringify({ ...ajustesPorDefecto(), ...base });
}

/**
 * Apartado 20 — los ajustes quedan vinculados a SU fotografía.
 *
 * Se guardan por id de foto, así que volver a una imagen que ya se había usado
 * recupera su encuadre en vez de aplicarle el de otra. `aplicarFoto` los restaura
 * solo, más abajo.
 *
 * Se limita a las últimas `MAX_AJUSTES_RECORDADOS` para que este objeto no crezca
 * sin fin dentro de la configuración del usuario, que se guarda entera en cada
 * `saveData`.
 */
export const MAX_AJUSTES_RECORDADOS = 10;

export function recordarAjustes(fondo) {
  const f = normalizarFondo(fondo);
  if (!f.foto.id) return f;
  const memoria = { ...(f.ajustesPorFoto || {}), [f.foto.id]: ajustesDe(f) };
  const ids = Object.keys(memoria);
  if (ids.length > MAX_AJUSTES_RECORDADOS) {
    for (const id of ids.slice(0, ids.length - MAX_AJUSTES_RECORDADOS)) delete memoria[id];
  }
  return { ...f, ajustesPorFoto: memoria };
}

/**
 * Apartado 16 — cambiar de foto desde el editor: *"los ajustes de la fotografía
 * anterior no deben transferirse accidentalmente a la nueva imagen si no tiene
 * sentido hacerlo"*.
 *
 * La línea está en si el ajuste habla de ESA imagen o del gusto de quien mira:
 *
 *   · encuadre y zoom → propios de la imagen. Se recalculan (`encuadreInicial`).
 *     El encuadre bueno de un retrato vertical no significa nada en una
 *     panorámica; heredarlo es exactamente el "accidentalmente" del apartado.
 *   · desenfoque, luminosidad, opacidad y overlay → gusto. Si Josué había puesto
 *     la foto discreta y oscura para leer mejor, sigue queriéndola así con otra
 *     imagen; volver a ajustarlo cada vez sería trabajo repetido sin motivo.
 *
 * Y si esa foto concreta ya tenía ajustes guardados (apartado 20), mandan esos.
 */
export function aplicarFotoConAjustes(fondo, foto) {
  const previo = recordarAjustes(fondo);          // no se pierde lo de la foto anterior
  const datos = { ...DEFAULT_FONDO.foto, ...(foto || {}) };
  const recordados = previo.ajustesPorFoto?.[datos.id];

  const base = recordados
    ? recordados                                   // esta foto ya se había ajustado
    : { ...ajustesDe(previo), ...encuadreInicial(datos) };   // gusto sí, geometría no

  return normalizarFondo({
    ...previo,
    ...base,
    foto: datos,
    tipo: 'foto',
    activo: true,
  });
}

/** ¿Hay una fotografía elegida, esté activa o no? */
export const tieneFoto = (fondo) => !!normalizarFondo(fondo).foto.path;

/** Resumen de una línea para Ajustes. Nunca inventa: si no hay fondo, lo dice. */
export function describirFondo(fondo) {
  const f = normalizarFondo(fondo);
  if (!f.activo || f.tipo === 'ninguno') return 'El fondo normal de JosStyle';
  if (f.tipo === 'color') return `Color sólido ${f.color}`;
  if (f.tipo === 'degradado') return 'Degradado personalizado';
  if (f.tipo === 'predeterminado') return fondoIncluido(f.incluido).label;
  if (f.tipo === 'foto') return f.foto.path ? 'Tu fotografía' : 'Fotografía sin elegir';
  return 'El fondo normal de JosStyle';
}
