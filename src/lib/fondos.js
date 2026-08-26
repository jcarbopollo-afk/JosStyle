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
import { isValidHex, normalizeHex } from './colorEngine';

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

  // --- Cómo se muestra (apartado 4) ---
  posicion: 'centro',       // ver POSICIONES_FONDO
  escala: 100,              // %
  opacidad: 100,            // % del propio fondo
  desenfoque: 0,            // px
  velo: 0,                  // % de scrim entre el fondo y la interfaz (apartado 4 `overlay`)

  // --- Preparado para las fases 4, 5 y 6 (apartados 8 y 9) ---
  // Nadie escribe esto todavía. Existe para que la configuración ya guardada
  // no necesite una migración cuando lleguen esas fases (regla 5).
  analisis: null,           // Fase 5: colores detectados en la fotografía
  paleta: null,             // Fase 4/5: paleta derivada
  recomendacion: null,      // Fase 6: apariencia completa recomendada para este fondo
};

export const POSICIONES_FONDO = [
  { id: 'centro', label: 'Centro', css: 'center center' },
  { id: 'arriba', label: 'Arriba', css: 'center top' },
  { id: 'abajo', label: 'Abajo', css: 'center bottom' },
  { id: 'izquierda', label: 'Izquierda', css: 'left center' },
  { id: 'derecha', label: 'Derecha', css: 'right center' },
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
  const f = { ...DEFAULT_FONDO, ...(guardado || {}) };
  return {
    ...f,
    tipo: TIPOS_FONDO.some((t) => t.id === f.tipo) ? f.tipo : 'ninguno',
    activo: !!f.activo,
    color: isValidHex(f.color) ? normalizeHex(f.color) : '',
    degradado: { ...DEFAULT_FONDO.degradado, ...(f.degradado || {}) },
    foto: { ...DEFAULT_FONDO.foto, ...(f.foto || {}) },
    posicion: POSICIONES_FONDO.some((p) => p.id === f.posicion) ? f.posicion : 'centro',
    escala: acotar(f.escala, 100, 100, 300),
    opacidad: acotar(f.opacidad, 100, 0, 100),
    desenfoque: acotar(f.desenfoque, 0, 0, 40),
    velo: acotar(f.velo, 0, 0, 90),
  };
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
        backgroundSize: resuelto.escala === 100 ? 'cover' : `${resuelto.escala}%`,
        backgroundPosition: posicionDeFondo(resuelto.posicion).css,
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
  if (!resuelto || resuelto.tipo === 'ninguno' || !resuelto.velo) return null;
  return { background: (colors || {}).bg || 'transparent', opacity: resuelto.velo / 100 };
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
    posicion: orientacion === 'vertical' ? 'arriba' : 'centro',
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
