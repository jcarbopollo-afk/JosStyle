// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 9 — Legibilidad y contraste inteligente.
//
// LA FILOSOFÍA, literal del apartado 1:
//   "Libertad total para personalizar, pero con protección inteligente para que
//    la interfaz siga siendo usable."
//
// Y el apartado 7 la concreta: **detectar y corregir son cosas distintas**.
// Este archivo DETECTA y PROPONE. No cambia nada por su cuenta. Aplicar una
// corrección es siempre una decisión de quien mira, salvo que haya encendido
// expresamente el modo automático (apartado 8).
//
// EL PROBLEMA DIFÍCIL: ¿CONTRA QUÉ SE MIDE?
// Con una fotografía de fondo no hay un color de fondo único. Lo que hay detrás
// de un texto es la tarjeta translúcida encima de la foto encima del tema.
// Medir contra `COLORS.bg` daría un número que no describe lo que se ve, y sería
// peor que no medir: un aviso falso enseña a ignorar los avisos.
//
// Por eso `fondoEfectivo` compone las capas de verdad, en el mismo orden en que
// se pintan: tema → foto → luz → overlay → tarjeta. Y con el análisis de la Fase
// 5 se puede además medir POR ZONA (apartado 16), porque el contraste cambia
// dentro de la misma imagen.
//
// NO REINVENTA NADA DE COLOR: `contrastRatio`, `ensureContrast` y `mix` son de
// `colorEngine.js`.
// ---------------------------------------------------------------------------
import { contrastRatio, ensureContrast, mix, relativeLuminance, NEGRO, BLANCO } from './colorEngine';

/* ===========================================================================
   UMBRALES
   =========================================================================== */

// WCAG AA: 4.5 para texto normal, 3 para texto grande y para elementos gráficos.
// Un icono pequeño necesita MÁS que un texto grande (apartado 15), así que no se
// usa el tamaño de fuente como única referencia: cada comprobación trae el suyo.
export const UMBRALES = {
  textoPrincipal: 4.5,
  textoSecundario: 3,
  icono: 3,
  boton: 4.5,
  // Dos superficies consecutivas no necesitan "contraste" de lectura, pero sí
  // distinguirse (apartado 17).
  //
  // El número es bajo a propósito, y hay un motivo concreto: **JosStyle separa sus
  // tarjetas del fondo con el BORDE, no con el relleno**. La superficie real es
  // apenas más clara que el fondo (1,07 en oscuro, 1,10 en claro) y aun así se ve
  // perfectamente, porque cada tarjeta lleva su borde. Exigir más marcaría la
  // propia apariencia de fábrica como un problema — y un aviso falso enseña a
  // ignorar los avisos, que es peor que no avisar.
  separacion: 1.04,
  // Cuánto tiene que aportar el borde para que valga como separación por sí solo.
  separacionBorde: 1.15,
};

export const NIVELES = {
  bien: 'bien',
  justo: 'justo',
  mal: 'mal',
};

function nivelDe(ratio, minimo) {
  if (ratio >= minimo) return NIVELES.bien;
  if (ratio >= minimo * 0.75) return NIVELES.justo;
  return NIVELES.mal;
}

/* ===========================================================================
   EL FONDO EFECTIVO (apartados 3 y 16)
   =========================================================================== */

/**
 * Compone el color que de verdad hay detrás de un elemento, capa a capa.
 *
 * `zona` (apartado 16) elige qué parte de la fotografía se mira: el contraste
 * cambia dentro de la misma imagen, y un texto arriba no está sobre el mismo
 * color que un botón abajo. Sin análisis se usa el color medio, que es lo mejor
 * que se puede decir con lo que hay.
 *
 * `sobreTarjeta` distingue el texto de dentro de una tarjeta (la mayoría) del
 * texto directamente sobre el fondo.
 */
export function fondoEfectivo({ colors, fondo, analisis, zona = 'centro', sobreTarjeta = true }) {
  const c = colors || {};
  let base = c.bg || NEGRO;

  const f = fondo || {};
  if (f.activo && f.tipo !== 'ninguno') {
    if (f.tipo === 'color' && f.color) base = f.color;
    else if (f.tipo === 'degradado' && f.degradado?.de) base = mix(f.degradado.de, f.degradado.a || base, 0.5);
    else if (f.tipo === 'foto') {
      // El color de la foto EN ESA ZONA, no el de toda la foto.
      base = colorDeZona(analisis, zona) || base;
    }

    // La opacidad del propio fondo lo mezcla con el del tema.
    if (f.opacidad != null && f.opacidad < 100) base = mix(base, c.bg || base, f.opacidad / 100);

    // La luz: negativo acerca al negro, positivo al blanco.
    if (f.luminosidad) {
      base = f.luminosidad < 0
        ? mix(NEGRO, base, Math.abs(f.luminosidad) / 100)
        : mix(BLANCO, base, f.luminosidad / 100);
    }

    // El overlay, con su color o el del tema.
    if (f.overlay?.intensidad) {
      base = mix(f.overlay.color || c.bg || base, base, f.overlay.intensidad / 100);
    }
  }

  // Y por último la tarjeta, que es lo que está justo detrás de casi todo el texto.
  if (sobreTarjeta) {
    const alfa = c.__superficieAlfa != null ? c.__superficieAlfa : 100;
    base = alfa >= 100 ? (c.surface || base) : mix(c.surface || base, base, alfa / 100);
  }
  return base;
}

/** El color dominante de una zona concreta de la fotografía (apartado 16). */
function colorDeZona(analisis, zona) {
  if (!analisis || !analisis.colores?.length) return analisis?.medio || null;
  // Los colores que de verdad viven en esa zona; si no hay ninguno, el medio.
  const deLaZona = analisis.colores.filter((x) => x.zona === zona);
  if (!deLaZona.length) return analisis.medio || analisis.dominante?.hex || null;
  // El de más peso de esa zona: es el que más superficie ocupa DETRÁS del texto.
  return [...deLaZona].sort((a, b) => b.peso - a.peso)[0].hex;
}

/* ===========================================================================
   LA REVISIÓN (apartados 2, 4, 13, 14, 15 y 17)
   =========================================================================== */

/**
 * Revisa la apariencia entera y devuelve los problemas encontrados.
 *
 * Cada problema trae:
 *   · `que` — qué elemento es, en castellano y sin tecnicismos (apartado 5);
 *   · `ratio` y `minimo` — los números, para quien quiera verlos;
 *   · `nivel` — bien / justo / mal;
 *   · `arreglo` — QUÉ cambiar exactamente y a qué valor (apartado 6).
 *
 * El `arreglo` toca **solo el parámetro problemático**: el apartado 6 es
 * explícito en que corregir el texto no debe cambiar la fotografía, ni los
 * colores principales, ni el preset.
 */
export function revisarLegibilidad({ colors, fondo, analisis, tema, accent }) {
  const c = { ...(colors || {}) };
  // La transparencia de la tarjeta hace falta para componer el fondo, y vive en
  // el tema, no en COLORS. Se pasa por un campo interno en vez de cambiar la
  // firma de `fondoEfectivo`, que ya usan varios sitios.
  c.__superficieAlfa = tema?.superficieAlfa ?? 100;

  const problemas = [];
  const revisar = (id, que, color, fondoDe, minimo, arreglo) => {
    if (!color || !fondoDe) return;
    const ratio = Number(contrastRatio(color, fondoDe).toFixed(2));
    const nivel = nivelDe(ratio, minimo);
    if (nivel === NIVELES.bien) return;
    problemas.push({ id, que, color, fondo: fondoDe, ratio, minimo, nivel, ...arreglo });
  };

  // --- Texto sobre tarjeta (apartado 4) ---
  const trasTarjeta = fondoEfectivo({ colors: c, fondo, analisis, zona: 'centro', sobreTarjeta: true });
  revisar('texto', 'El texto de las tarjetas', c.text, trasTarjeta, UMBRALES.textoPrincipal, {
    campo: 'texto',
    donde: 'tema',
    valor: ensureContrast(c.text, trasTarjeta, UMBRALES.textoPrincipal),
  });
  revisar('textoSecundario', 'El texto secundario', c.textMuted, trasTarjeta, UMBRALES.textoSecundario, {
    campo: 'textoSecundario',
    donde: 'tema',
    valor: ensureContrast(c.textMuted, trasTarjeta, UMBRALES.textoSecundario),
  });

  // --- Botones (apartado 14): que no desaparezcan contra el fondo ---
  revisar('boton', 'El texto de los botones', c.textOnAccent, accent || c.accent, UMBRALES.boton, {
    campo: 'accent', donde: 'accent',
    valor: ensureContrast(accent || c.accent, c.textOnAccent || BLANCO, UMBRALES.boton),
  });
  revisar('botonFondo', 'Los botones sobre el fondo', accent || c.accent, trasTarjeta, UMBRALES.icono, {
    campo: 'accent', donde: 'accent',
    valor: ensureContrast(accent || c.accent, trasTarjeta, UMBRALES.icono),
  });

  // --- Navegación (apartado 13). Va ABAJO, así que se mira la zona de abajo ---
  const trasNav = fondoEfectivo({ colors: c, fondo, analisis, zona: 'abajo', sobreTarjeta: false });
  const navBg = c.navBgAlpha && c.navBgAlpha !== c.navBg
    ? mix(c.navBg || c.surface, trasNav, (tema?.navegacionAlfa ?? 100) / 100)
    : (c.navBg || c.surface);
  revisar('iconoActivo', 'Los iconos de la barra inferior', c.iconActive || accent, navBg, UMBRALES.icono, {
    campo: 'iconoActivo', donde: 'tema',
    valor: ensureContrast(c.iconActive || accent, navBg, UMBRALES.icono),
  });
  revisar('iconoInactivo', 'Los iconos apagados de la barra', c.iconMuted || c.textMuted, navBg, UMBRALES.icono, {
    campo: 'iconoInactivo', donde: 'tema',
    valor: ensureContrast(c.iconMuted || c.textMuted, navBg, UMBRALES.icono),
  });

  // --- Apartado 17: dos superficies consecutivas que no se distinguen ---
  //
  // Se miran LAS DOS vías por las que una tarjeta se separa del fondo: su relleno
  // y su borde. La app usa la segunda —relleno casi idéntico, borde visible—, así
  // que comprobar solo el relleno marcaría la apariencia de fábrica como rota.
  // Solo hay problema cuando fallan las dos.
  const separacion = Number(contrastRatio(c.surface || NEGRO, c.bg || NEGRO).toFixed(2));
  const alfaBorde = (tema?.bordeAlfa ?? 100) / 100;
  // Un borde translúcido separa menos: se mide el borde ya mezclado con lo que
  // tiene detrás, que es como se ve de verdad.
  const bordeVisible = alfaBorde >= 1 ? (c.border || c.surface) : mix(c.border || c.surface, c.surface || c.bg, alfaBorde);
  const separacionPorBorde = Number(contrastRatio(bordeVisible, c.bg || NEGRO).toFixed(2));
  if (separacion < UMBRALES.separacion && separacionPorBorde < UMBRALES.separacionBorde) {
    problemas.push({
      id: 'separacion',
      que: 'Las tarjetas y el fondo',
      color: c.surface, fondo: c.bg,
      ratio: Math.max(separacion, separacionPorBorde), minimo: UMBRALES.separacionBorde, nivel: NIVELES.mal,
      // Aquí NO se toca un color: se sugiere marcar más el borde, que es la
      // solución que respeta la estética (apartado 12: no resolverlo todo
      // cambiando el texto).
      campo: 'bordeAlfa', donde: 'tema', valor: 100,
    });
  }

  return {
    problemas,
    hayProblemas: problemas.length > 0,
    graves: problemas.filter((p) => p.nivel === NIVELES.mal).length,
  };
}

/* ===========================================================================
   PROPUESTAS SOBRE LA FOTOGRAFÍA (apartados 10, 11 y 12)
   =========================================================================== */

/**
 * Cuando el problema es la fotografía, cambiar el texto es la peor solución: la
 * app entera dejaría de seguir su propio tema por una imagen. El apartado 12 lo
 * dice — "no intentar resolver todos los problemas modificando el texto".
 *
 * Así que se proponen ajustes DEL FONDO, que dejan los colores en paz:
 *
 *   · foto clara + tema oscuro → oscurecerla un poco (apartado 10);
 *   · foto oscura + tema claro → aclararla;
 *   · foto con mucho detalle → un desenfoque ligero (apartado 11).
 *
 * Devuelve propuestas, nunca cambios aplicados (apartado 7).
 */
export function propuestasSobreFoto({ fondo, analisis, colors }) {
  const out = [];
  const f = fondo || {};
  if (!f.activo || f.tipo !== 'foto' || !analisis) return out;

  const c = colors || {};
  const fondoDelTema = relativeLuminance(c.bg || NEGRO);
  const luzFoto = analisis.medio ? relativeLuminance(analisis.medio) : null;
  if (luzFoto === null) return out;

  const yaOscurece = (f.luminosidad || 0) < -10;
  const yaAclara = (f.luminosidad || 0) > 10;
  const yaVela = (f.overlay?.intensidad || 0) >= 15;

  // Foto clara con interfaz oscura: el texto claro del tema se pierde encima.
  if (luzFoto > 0.55 && fondoDelTema < 0.35 && !yaOscurece && !yaVela) {
    out.push({
      id: 'oscurecer',
      texto: 'Tu foto es clara y la interfaz es oscura. Oscurecerla un poco ayuda a leer encima.',
      campo: 'luminosidad', donde: 'fondo', valor: -25,
    });
  }
  // Y al revés.
  if (luzFoto < 0.2 && fondoDelTema > 0.6 && !yaAclara && !yaVela) {
    out.push({
      id: 'aclarar',
      texto: 'Tu foto es oscura y la interfaz es clara. Aclararla un poco ayuda a leer encima.',
      campo: 'luminosidad', donde: 'fondo', valor: 25,
    });
  }
  // Apartado 11 — mucho detalle detrás de la interfaz. "Mucho detalle" aquí es
  // "muchos colores repartidos sin que ninguno domine": si el dominante ocupa
  // poco, la imagen es visualmente ruidosa.
  const dominante = analisis.dominante?.peso ?? 1;
  if (dominante < 0.3 && (f.desenfoque || 0) < 4) {
    out.push({
      id: 'desenfocar',
      texto: 'Tu foto tiene mucho detalle. Un desenfoque ligero deja la interfaz más clara sin perderla.',
      campo: 'desenfoque', donde: 'fondo', valor: 6,
    });
  }
  return out;
}

/* ===========================================================================
   CORREGIR (apartados 6, 7 y 8)
   =========================================================================== */

/**
 * Convierte problemas y propuestas en los cambios concretos que hay que hacer,
 * agrupados por dónde viven.
 *
 * **No aplica nada**: devuelve qué habría que cambiar. Quien llama decide, y solo
 * si el usuario lo ha pedido (apartado 7) o ha encendido el modo automático
 * (apartado 8). Es la misma separación que en FO F5 —detectar no es aplicar— y
 * en FO F6 —recomendar no es imponer—.
 */
export function correccionesDe(lista) {
  const cambios = { tema: {}, fondo: {}, accent: null };
  for (const x of lista || []) {
    if (!x || !x.campo) continue;
    if (x.donde === 'tema') cambios.tema[x.campo] = x.valor;
    else if (x.donde === 'fondo') cambios.fondo[x.campo] = x.valor;
    else if (x.donde === 'accent') cambios.accent = x.valor;
  }
  return cambios;
}

/** ¿Hay algo que corregir de verdad? Para no ofrecer un botón que no hace nada. */
export const hayCorrecciones = (cambios) =>
  !!cambios && (Object.keys(cambios.tema).length > 0 || Object.keys(cambios.fondo).length > 0 || !!cambios.accent);

/** Un resumen en una línea, sin tecnicismos (apartado 5). */
export function resumenLegibilidad(revision) {
  if (!revision || !revision.hayProblemas) return 'Todo se lee bien.';
  const n = revision.problemas.length;
  if (revision.graves > 0) {
    return `${revision.graves === 1 ? 'Hay 1 cosa' : `Hay ${revision.graves} cosas`} que cuesta leer.`;
  }
  return `${n === 1 ? 'Hay 1 cosa' : `Hay ${n} cosas`} que se leen justas.`;
}
