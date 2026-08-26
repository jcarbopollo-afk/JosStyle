// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 9 — pruebas de legibilidad y contraste.
//
// Las tres que más importan:
//
//   · El fondo efectivo se COMPONE. Con una foto detrás no hay un color de
//     fondo único, y medir contra `COLORS.bg` daría un número que no describe
//     lo que se ve. Un aviso falso enseña a ignorar los avisos.
//   · Detectar NO es corregir (apartado 7). Nada cambia solo.
//   · Cuando el problema es la foto, la solución NO es cambiar el texto
//     (apartado 12).
// ---------------------------------------------------------------------------
import {
  UMBRALES, NIVELES, fondoEfectivo, revisarLegibilidad, propuestasSobreFoto,
  correccionesDe, hayCorrecciones, resumenLegibilidad,
} from '../src/lib/legibilidad.js';
import { DEFAULT_FONDO } from '../src/lib/fondos.js';
import { DEFAULT_TEMA_PERSONALIZADO, COLORS_OSCURO, COLORS_CLARO } from '../src/tokens.js';
import { contrastRatio, bestReadableText } from '../src/lib/colorEngine.js';

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

console.log('\n═══ FO Fase 9 — legibilidad y contraste ═══\n');

// `textOnAccent` NO se pone a mano: la app lo DERIVA con `bestReadableText`, y
// escribir blanco aquí probaría un color que la app nunca usa (y daría un falso
// positivo, porque el blanco sobre este acento da 4,28 y el derivado 4,54).
const OSCURO = { ...COLORS_OSCURO, accent: '#5C7E9A', textOnAccent: bestReadableText('#5C7E9A'), navBg: COLORS_OSCURO.surface, iconActive: '#5C7E9A', iconMuted: COLORS_OSCURO.textMuted };
const CLARO = { ...COLORS_CLARO, accent: '#5C7E9A', textOnAccent: bestReadableText('#5C7E9A'), navBg: COLORS_CLARO.surface, iconActive: '#5C7E9A', iconMuted: COLORS_CLARO.textMuted };

const col = (hex, zona, peso = 0.4) => ({ hex, zona, peso, neutro: false, saturacionValor: 0.4, luminosidad: 0.5, interes: 0.3 });

const FOTO_CLARA = {
  colores: [col('#F0EDE4', 'arriba', 0.5), col('#E8E2D0', 'centro', 0.3), col('#D8D2C0', 'abajo', 0.2)],
  dominante: col('#F0EDE4', 'arriba', 0.5), medio: '#E9E3D6', monocromatica: false, suficiente: true,
};
const FOTO_OSCURA = {
  colores: [col('#12161C', 'arriba', 0.6), col('#0D1014', 'abajo', 0.4)],
  dominante: col('#12161C', 'arriba', 0.6), medio: '#101419', monocromatica: false, suficiente: true,
};
const FOTO_RUIDOSA = {
  colores: [col('#A03030', 'arriba', 0.18), col('#30A030', 'centro', 0.17), col('#3030A0', 'abajo', 0.17),
    col('#A0A030', 'arriba', 0.16), col('#A030A0', 'centro', 0.16), col('#30A0A0', 'abajo', 0.16)],
  dominante: col('#A03030', 'arriba', 0.18), medio: '#606060', monocromatica: false, suficiente: true,
};

/* --- El fondo efectivo se compone, capa a capa --- */
{
  // Sin fondo, lo que hay detrás del texto es la superficie del tema.
  const sinFondo = fondoEfectivo({ colors: OSCURO, fondo: DEFAULT_FONDO });
  comprobar('Sin fondo, detrás del texto está la tarjeta', sinFondo === OSCURO.surface, sinFondo);
  comprobar('Sin tarjeta, está el fondo del tema',
    fondoEfectivo({ colors: OSCURO, fondo: DEFAULT_FONDO, sobreTarjeta: false }) === OSCURO.bg);

  // Con un color de fondo y tarjeta translúcida, se mezclan.
  const conColor = fondoEfectivo({
    colors: { ...OSCURO, __superficieAlfa: 50 },
    fondo: { ...DEFAULT_FONDO, tipo: 'color', activo: true, color: '#FF0000' },
  });
  comprobar('Una tarjeta translúcida deja pasar el color del fondo', conColor !== OSCURO.surface && conColor !== '#FF0000', conColor);

  // Y con foto, se usa el color de LA ZONA, no el de toda la imagen.
  const arriba = fondoEfectivo({ colors: { ...OSCURO, __superficieAlfa: 30 }, fondo: { ...DEFAULT_FONDO, tipo: 'foto', activo: true }, analisis: FOTO_RUIDOSA, zona: 'arriba' });
  const abajo = fondoEfectivo({ colors: { ...OSCURO, __superficieAlfa: 30 }, fondo: { ...DEFAULT_FONDO, tipo: 'foto', activo: true }, analisis: FOTO_RUIDOSA, zona: 'abajo' });
  comprobar('CLAVE · El contraste se mide POR ZONA, no con el color medio', arriba !== abajo, `${arriba} vs ${abajo}`);

  // El overlay y la luz también cuentan.
  const conVelo = fondoEfectivo({
    colors: OSCURO, fondo: { ...DEFAULT_FONDO, tipo: 'foto', activo: true, overlay: { color: '#000000', intensidad: 80 } },
    analisis: FOTO_CLARA, sobreTarjeta: false,
  });
  comprobar('El overlay oscurece el fondo efectivo',
    contrastRatio(conVelo, '#FFFFFF') > contrastRatio('#E9E3D6', '#FFFFFF'), conVelo);
  const conLuz = fondoEfectivo({
    colors: OSCURO, fondo: { ...DEFAULT_FONDO, tipo: 'foto', activo: true, luminosidad: -70 },
    analisis: FOTO_CLARA, sobreTarjeta: false,
  });
  comprobar('Oscurecer la foto también', contrastRatio(conLuz, '#FFFFFF') > 2, conLuz);
  comprobar('Un fondo apagado no cuenta',
    fondoEfectivo({ colors: OSCURO, fondo: { ...DEFAULT_FONDO, tipo: 'color', color: '#FF0000', activo: false }, sobreTarjeta: false }) === OSCURO.bg);
  comprobar('Sin nada, no revienta', !!fondoEfectivo({ colors: null, fondo: null }));
}

/* --- Apartado 2: la revisión --- */
{
  // La apariencia de fábrica tiene que estar limpia. Si no, el sistema estaría
  // avisando de la propia app, y nadie haría caso al aviso.
  const r = revisarLegibilidad({ colors: OSCURO, fondo: DEFAULT_FONDO, tema: DEFAULT_TEMA_PERSONALIZADO, accent: OSCURO.accent });
  comprobar('La apariencia de fábrica NO da avisos', r.hayProblemas === false, JSON.stringify(r.problemas.map((p) => p.id)));
  comprobar('...y lo dice en una línea', resumenLegibilidad(r) === 'Todo se lee bien.');
  const rc = revisarLegibilidad({ colors: CLARO, fondo: DEFAULT_FONDO, tema: DEFAULT_TEMA_PERSONALIZADO, accent: CLARO.accent });
  comprobar('El tema claro de fábrica tampoco', rc.hayProblemas === false, JSON.stringify(rc.problemas.map((p) => p.id)));
}

/* --- Apartados 3 y 4: se detecta lo que de verdad no se lee --- */
{
  // Texto casi del color de la tarjeta.
  const malo = { ...OSCURO, text: '#14171D' };
  const r = revisarLegibilidad({ colors: malo, fondo: DEFAULT_FONDO, tema: DEFAULT_TEMA_PERSONALIZADO, accent: malo.accent });
  const p = r.problemas.find((x) => x.id === 'texto');
  comprobar('Un texto del color de la tarjeta se detecta', !!p);
  comprobar('...con su nivel', p.nivel === NIVELES.mal);
  comprobar('...y en castellano, sin tecnicismos', p.que === 'El texto de las tarjetas');
  comprobar('...con los números a la vista', p.ratio < UMBRALES.textoPrincipal && p.minimo === UMBRALES.textoPrincipal);
  // Apartado 6 — el arreglo toca SOLO el parámetro problemático.
  comprobar('El arreglo dice qué campo cambiar', p.campo === 'texto' && p.donde === 'tema');
  comprobar('...y a qué valor, ya legible', contrastRatio(p.valor, p.fondo) >= UMBRALES.textoPrincipal, `${p.valor}`);
  comprobar('El resumen lo cuenta sin tecnicismos', resumenLegibilidad(r).includes('cuesta leer'));

  // Un texto que se lee justo pero no fatal.
  const justo = { ...OSCURO, textMuted: '#3A4048' };
  const rj = revisarLegibilidad({ colors: justo, fondo: DEFAULT_FONDO, tema: DEFAULT_TEMA_PERSONALIZADO, accent: justo.accent });
  comprobar('Un texto secundario flojo también se detecta', rj.problemas.some((x) => x.id === 'textoSecundario'));
}

/* --- Apartado 14: botones que desaparecen --- */
{
  const malo = { ...OSCURO, accent: '#0C0F14' };
  const r = revisarLegibilidad({ colors: malo, fondo: DEFAULT_FONDO, tema: DEFAULT_TEMA_PERSONALIZADO, accent: malo.accent });
  comprobar('Un botón del color del fondo se detecta', r.problemas.some((x) => x.id === 'botonFondo'));
}

/* --- Apartado 13: la barra inferior, y se mira la zona de ABAJO --- */
{
  const malo = { ...OSCURO, iconActive: '#131720', navBg: '#12151B' };
  const r = revisarLegibilidad({ colors: malo, fondo: DEFAULT_FONDO, tema: DEFAULT_TEMA_PERSONALIZADO, accent: malo.accent });
  const p = r.problemas.find((x) => x.id === 'iconoActivo');
  comprobar('Un icono de la barra invisible se detecta', !!p);
  comprobar('...con umbral de icono, más exigente que el de texto grande', p.minimo === UMBRALES.icono);
  comprobar('...y su arreglo apunta al campo correcto', p.campo === 'iconoActivo' && p.donde === 'tema');
}

/* --- Apartado 17: dos superficies que no se distinguen --- */
{
  // Una tarjeta del color del fondo pero CON borde se sigue viendo: queda
  // perfilada. El problema es cuando desaparecen las dos vías de separación.
  const igual = { ...OSCURO, surface: OSCURO.bg, border: OSCURO.bg };
  const r = revisarLegibilidad({ colors: igual, fondo: DEFAULT_FONDO, tema: DEFAULT_TEMA_PERSONALIZADO, accent: igual.accent });
  const p = r.problemas.find((x) => x.id === 'separacion');
  comprobar('Tarjeta y fondo iguales, y sin borde, se detectan', !!p);
  comprobar('...pero con borde visible no se avisa (la app funciona así)',
    !revisarLegibilidad({ colors: { ...OSCURO, surface: OSCURO.bg }, fondo: DEFAULT_FONDO, tema: DEFAULT_TEMA_PERSONALIZADO, accent: OSCURO.accent })
      .problemas.some((x) => x.id === 'separacion'));
  // Y aquí NO se toca un color: se sugiere marcar el borde, que respeta la
  // estética de la foto (apartado 12).
  comprobar('...y la solución NO es cambiar un color, es marcar el borde', p.campo === 'bordeAlfa' && p.valor === 100);

  // Y lo que evita el falso positivo: la app separa sus tarjetas con el BORDE, no
  // con el relleno (1,07 de contraste entre superficie y fondo, y se ve perfecto).
  // Comprobar solo el relleno marcaría la apariencia de fábrica como rota.
  comprobar('Un relleno casi igual NO es problema si el borde separa',
    !revisarLegibilidad({ colors: OSCURO, fondo: DEFAULT_FONDO, tema: DEFAULT_TEMA_PERSONALIZADO, accent: OSCURO.accent })
      .problemas.some((x) => x.id === 'separacion'));
}

/* --- APARTADOS 10, 11 y 12: cuando el problema es la foto --- */
{
  const conFoto = { ...DEFAULT_FONDO, tipo: 'foto', activo: true };

  // Foto clara + interfaz oscura → oscurecer la foto, NO cambiar el texto.
  const p1 = propuestasSobreFoto({ fondo: conFoto, analisis: FOTO_CLARA, colors: OSCURO });
  comprobar('Foto clara con interfaz oscura: se propone oscurecerla', p1.some((x) => x.id === 'oscurecer'));
  const osc = p1.find((x) => x.id === 'oscurecer');
  comprobar('CLAVE · La solución toca el FONDO, no el texto', osc.donde === 'fondo' && osc.campo === 'luminosidad');
  comprobar('...y lo explica sin tecnicismos', osc.texto.includes('oscurecerla') || osc.texto.includes('Oscurecerla'));

  // Foto oscura + interfaz clara → aclarar.
  const p2 = propuestasSobreFoto({ fondo: conFoto, analisis: FOTO_OSCURA, colors: CLARO });
  comprobar('Foto oscura con interfaz clara: se propone aclararla', p2.some((x) => x.id === 'aclarar'));

  // Apartado 11 — mucho detalle → desenfoque ligero.
  const p3 = propuestasSobreFoto({ fondo: conFoto, analisis: FOTO_RUIDOSA, colors: OSCURO });
  comprobar('Una foto con mucho detalle: se propone desenfoque', p3.some((x) => x.id === 'desenfocar'));

  // Y lo importante: si YA está resuelto, no se insiste.
  const yaOscura = { ...conFoto, luminosidad: -40 };
  comprobar('Si ya la habías oscurecido, no se vuelve a proponer',
    !propuestasSobreFoto({ fondo: yaOscura, analisis: FOTO_CLARA, colors: OSCURO }).some((x) => x.id === 'oscurecer'));
  const yaVelada = { ...conFoto, overlay: { color: '', intensidad: 40 } };
  comprobar('Si ya tenías overlay, tampoco', 
    !propuestasSobreFoto({ fondo: yaVelada, analisis: FOTO_CLARA, colors: OSCURO }).some((x) => x.id === 'oscurecer'));
  const yaBorrosa = { ...conFoto, desenfoque: 10 };
  comprobar('Si ya la habías desenfocado, tampoco', 
    !propuestasSobreFoto({ fondo: yaBorrosa, analisis: FOTO_RUIDOSA, colors: OSCURO }).some((x) => x.id === 'desenfocar'));

  // Sin foto no hay nada que proponer.
  comprobar('Sin fotografía no se propone nada', propuestasSobreFoto({ fondo: DEFAULT_FONDO, analisis: FOTO_CLARA, colors: OSCURO }).length === 0);
  comprobar('Sin análisis tampoco', propuestasSobreFoto({ fondo: conFoto, analisis: null, colors: OSCURO }).length === 0);
}

/* --- APARTADO 7: detectar NO es corregir --- */
{
  const malo = { ...OSCURO, text: '#14171D', iconActive: '#131720' };
  const r = revisarLegibilidad({ colors: malo, fondo: DEFAULT_FONDO, tema: DEFAULT_TEMA_PERSONALIZADO, accent: malo.accent });

  // La revisión no muta nada.
  comprobar('CLAVE · Revisar NO cambia los colores', malo.text === '#14171D');

  const cambios = correccionesDe(r.problemas);
  comprobar('Las correcciones se agrupan por dónde viven', 'tema' in cambios && 'fondo' in cambios && 'accent' in cambios);
  comprobar('...y siguen sin aplicarse: son una propuesta', malo.text === '#14171D');
  comprobar('El texto está entre lo que se propone cambiar', 'texto' in cambios.tema);
  comprobar('hayCorrecciones lo detecta', hayCorrecciones(cambios) === true);
  comprobar('Sin problemas, no hay nada que corregir', hayCorrecciones(correccionesDe([])) === false);
  comprobar('Una lista nula no revienta', hayCorrecciones(correccionesDe(null)) === false);

  // Las propuestas sobre la foto entran por el mismo camino.
  const props = propuestasSobreFoto({ fondo: { ...DEFAULT_FONDO, tipo: 'foto', activo: true }, analisis: FOTO_CLARA, colors: OSCURO });
  const cf = correccionesDe(props);
  comprobar('Las propuestas sobre la foto van al fondo, no al tema',
    Object.keys(cf.fondo).length > 0 && Object.keys(cf.tema).length === 0);
}

/* --- Apartado 9: el usuario manda --- */
{
  // Un color de bajo contraste NO se bloquea: se avisa. Se comprueba que la
  // revisión lo deja pasar como problema en vez de impedirlo o cambiarlo.
  const insistente = { ...OSCURO, text: '#20242C' };
  const r = revisarLegibilidad({ colors: insistente, fondo: DEFAULT_FONDO, tema: DEFAULT_TEMA_PERSONALIZADO, accent: insistente.accent });
  comprobar('Un color flojo se avisa, no se impide', r.hayProblemas === true && insistente.text === '#20242C');
  comprobar('...y el aviso trae su arreglo por si lo quiere', r.problemas[0].valor !== undefined);
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
