// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 4 — pruebas del sistema avanzado de colores.
//
// Lo que más importa aquí no son los colores en sí (eso ya estaba probado desde
// las fases V1-V4), sino las tres promesas nuevas:
//
//   1. Restablecer colores NO toca la fotografía (apartado 15).
//   2. Colores y fondo se guardan por separado (apartado 16).
//   3. La transparencia LLEGA a los tokens de verdad, y al 100 % no cambia nada.
//
// Y dos fallos concretos que estas pruebas existen para que no vuelvan:
// el token que se queda pegado del render anterior, y el alfa que se guarda
// pero no se aplica.
// ---------------------------------------------------------------------------
import { COLORS, DEFAULT_TEMA_PERSONALIZADO, DEFAULT_APARIENCIA, aplicarTema } from '../src/tokens.js';
import { ensureContrast, contrastRatio } from '../src/lib/colorEngine.js';
import {
  CAMPOS_COLOR, CAMPOS_ALFA, MAX_SOMBRAS, normalizarTema, restablecerColores,
  tieneColoresPersonalizados, aplicarPresetColor, coloresYFondoSonIndependientes,
} from '../src/lib/temaColores.js';

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

console.log('\n═══ FO Fase 4 — sistema avanzado de colores ═══\n');

const ACENTO = '#4C8DFF';

/* --- Apartados 3-10: el modelo cubre lo que pide la especificación --- */
{
  for (const campo of ['secundario', 'terciario', 'fondo', 'superficie', 'texto', 'bordes',
    'textoSecundario', 'iconoActivo', 'iconoInactivo', 'navegacionFondo', 'superficieAlfa', 'navegacionAlfa']) {
    comprobar(`El tema declara "${campo}"`, campo in DEFAULT_TEMA_PERSONALIZADO);
  }
  comprobar('Los 4 estados siguen ahí', Object.keys(DEFAULT_TEMA_PERSONALIZADO.estados).length === 4);
  // Apartado 9: iconos activos e inactivos por separado. Forzar un solo color
  // para los dos destruye la jerarquía, que es lo que el apartado pide no hacer.
  comprobar('Iconos activo e inactivo son campos distintos',
    'iconoActivo' in DEFAULT_TEMA_PERSONALIZADO && 'iconoInactivo' in DEFAULT_TEMA_PERSONALIZADO);
  // Por defecto, TODO opaco: sin tocar nada, la app se ve exactamente igual que antes.
  comprobar('Por defecto todo es opaco: no cambia nada de lo anterior',
    DEFAULT_TEMA_PERSONALIZADO.superficieAlfa === 100 && DEFAULT_TEMA_PERSONALIZADO.navegacionAlfa === 100);
  comprobar('Y ningún color viene impuesto', CAMPOS_COLOR.every((k) => DEFAULT_TEMA_PERSONALIZADO[k] === null));
}

/* --- Regla 5: un tema guardado antes de esta fase --- */
{
  const antiguo = { secundario: '#ff0000', estados: { positive: '#00ff00' } };
  const n = normalizarTema(antiguo);
  comprobar('Un tema antiguo conserva lo que tenía', n.secundario === '#FF0000');
  comprobar('...normalizado', n.estados.positive === '#00FF00');
  comprobar('...y recupera los campos nuevos', n.superficieAlfa === 100 && 'iconoActivo' in n);
  comprobar('Un tema nulo devuelve el de fábrica', normalizarTema(null).superficieAlfa === 100);
  comprobar('Un color inválido se descarta', normalizarTema({ texto: 'azul' }).texto === null);
  comprobar('Un alfa absurdo se acota por arriba', normalizarTema({ superficieAlfa: 900 }).superficieAlfa === 100);
  // El suelo no es 0: una tarjeta invisible sobre una foto deja de leerse.
  comprobar('...y por abajo NO llega a 0, para que se siga leyendo', normalizarTema({ superficieAlfa: 0 }).superficieAlfa === 20);
  comprobar('Un alfa no numérico cae en opaco', normalizarTema({ navegacionAlfa: 'mucho' }).navegacionAlfa === 100);
}

/* --- Apartados 7 y 12: la transparencia LLEGA a los tokens --- */
{
  // Al 100 %, el token translúcido es EXACTAMENTE el sólido: sin tocar nada, nada cambia.
  aplicarTema('oscuro', false, ACENTO, normalizarTema(null));
  comprobar('Al 100 %, la superficie translúcida es el color sólido', COLORS.surfaceAlpha === COLORS.surface);
  comprobar('...y la barra también', COLORS.navBgAlpha === COLORS.navBg);

  // Por debajo, rgba de verdad. Este es el fallo que la prueba evita: guardar el
  // alfa y que no llegue a ningún token sería un ajuste que no hace nada.
  aplicarTema('oscuro', false, ACENTO, normalizarTema({ superficieAlfa: 60 }));
  comprobar('Con alfa, la superficie pasa a rgba', COLORS.surfaceAlpha.startsWith('rgba('), COLORS.surfaceAlpha);
  comprobar('...con la opacidad pedida', COLORS.surfaceAlpha.includes('0.6'), COLORS.surfaceAlpha);
  comprobar('...y surface2 también', COLORS.surface2Alpha.startsWith('rgba('));
  comprobar('El color sólido NO se toca: sigue disponible', COLORS.surface.startsWith('#'));

  aplicarTema('oscuro', false, ACENTO, normalizarTema({ navegacionAlfa: 40 }));
  comprobar('La barra de navegación acepta su propia transparencia', COLORS.navBgAlpha.includes('0.4'), COLORS.navBgAlpha);
  comprobar('...independiente de la de las tarjetas', COLORS.surfaceAlpha === COLORS.surface);
}

/* --- Apartado 22: el tema claro/oscuro no destruye lo personalizado --- */
{
  const tema = normalizarTema({ superficieAlfa: 50, iconoActivo: '#FF0000' });
  aplicarTema('oscuro', false, ACENTO, tema);
  const oscuro = COLORS.surfaceAlpha;
  aplicarTema('claro', false, ACENTO, tema);
  const claro = COLORS.surfaceAlpha;
  comprobar('La transparencia se aplica en los dos temas', oscuro.startsWith('rgba(') && claro.startsWith('rgba('));
  comprobar('...sobre el color de superficie de CADA tema', oscuro !== claro);
  comprobar('El icono personalizado sobrevive al cambio de tema', COLORS.iconActive === '#FF0000');
  comprobar('La configuración guardada no ha cambiado', tema.superficieAlfa === 50);
}

/* --- EL FALLO DEL TOKEN PEGADO --- */
{
  // `Object.assign(COLORS, base)` sobrescribe las claves de `base`, pero NO borra
  // las que no están en él. `iconActive`, `iconMuted` y `navBg` no existen en
  // COLORS_OSCURO/CLARO, así que sin limpiarlos antes se quedarían del render
  // anterior: quitar un color personalizado parecería no funcionar.
  aplicarTema('oscuro', false, ACENTO, normalizarTema({ iconoActivo: '#FF0000', navegacionFondo: '#00FF00' }));
  comprobar('Un icono personalizado se aplica', COLORS.iconActive === '#FF0000');
  comprobar('...y un fondo de barra también', COLORS.navBg === '#00FF00');

  aplicarTema('oscuro', false, ACENTO, normalizarTema(null));
  comprobar('QUITARLO LO QUITA DE VERDAD: no se queda pegado del render anterior',
    COLORS.iconActive !== '#FF0000', COLORS.iconActive);
  comprobar('...y la barra vuelve a su color', COLORS.navBg !== '#00FF00', COLORS.navBg);
  // Y el valor de reserva es sensato, no undefined suelto en un style.
  comprobar('El icono activo cae en el acento', COLORS.iconActive === ACENTO);
  comprobar('El icono inactivo cae en el texto atenuado', COLORS.iconMuted === COLORS.textMuted);
  comprobar('La barra cae en la superficie del tema', COLORS.navBg === COLORS.surface);
}

/* --- Apartado 8: la jerarquía de texto, con red de seguridad --- */
{
  // Un texto secundario ilegible sobre el fondo se corrige solo: el apartado dice
  // "no permitir combinaciones que hagan desaparecer visualmente el texto".
  aplicarTema('oscuro', false, ACENTO, normalizarTema({ textoSecundario: '#0A0C10' }));
  comprobar('Un texto secundario del color del fondo NO se queda invisible',
    COLORS.textMuted !== '#0A0C10', COLORS.textMuted);
  comprobar('El texto principal sigue teniendo contraste', COLORS.text !== COLORS.bg);
}

/* --- ensureContrast: la dirección la decide el FONDO, no el orden relativo --- */
{
  // Este era un fallo preexistente de `colorEngine.js` que destapó FO F6: con
  // `l <= bgL ? -1 : 1`, un color más oscuro que un fondo YA oscuro se oscurecía
  // todavía más, hasta el negro puro, y salía del bucle sin contraste ninguno.
  const casiNegro = ensureContrast('#050508', '#0A0C10', 3);
  comprobar('Un color casi negro sobre fondo oscuro se ACLARA, no se oscurece',
    contrastRatio(casiNegro, '#0A0C10') >= 2.9, `${casiNegro} → ${contrastRatio(casiNegro, '#0A0C10').toFixed(2)}`);
  const casiBlanco = ensureContrast('#FAFAFF', '#F3F4F7', 3);
  comprobar('Un color casi blanco sobre fondo claro se OSCURECE',
    contrastRatio(casiBlanco, '#F3F4F7') >= 2.9, `${casiBlanco} → ${contrastRatio(casiBlanco, '#F3F4F7').toFixed(2)}`);
  // Y los casos normales tienen que seguir comportándose igual que siempre.
  comprobar('Un texto claro sobre fondo oscuro se queda como está',
    ensureContrast('#EDEFF2', '#0A0C10', 4.5) === '#EDEFF2');
  comprobar('Un texto oscuro sobre fondo claro también',
    ensureContrast('#161A21', '#F3F4F7', 4.5) === '#161A21');
}

/* --- Apartado 15: restablecer colores SIN tocar el fondo --- */
{
  const personalizado = normalizarTema({ secundario: '#FF0000', superficieAlfa: 45, iconoActivo: '#00FF00' });
  comprobar('Se detecta que hay colores personalizados', tieneColoresPersonalizados(personalizado) === true);
  comprobar('Un tema de fábrica no lo está', tieneColoresPersonalizados(null) === false);
  comprobar('Solo un alfa distinto ya cuenta', tieneColoresPersonalizados({ superficieAlfa: 80 }) === true);
  comprobar('Solo un estado también', tieneColoresPersonalizados({ estados: { info: '#FF0000' } }) === true);

  const limpio = restablecerColores();
  comprobar('Restablecer devuelve todos los colores', CAMPOS_COLOR.every((k) => limpio[k] === null));
  comprobar('...y la transparencia', limpio.superficieAlfa === 100);
  comprobar('...y los estados', Object.values(limpio.estados).every((v) => v === null));
  // LA garantía del apartado 15: no puede tocar la foto porque ni siquiera la recibe.
  comprobar('RESTABLECER COLORES NO PUEDE TOCAR EL FONDO: no lo recibe',
    restablecerColores.length === 0);
}

/* --- Apartado 16: colores y fondo, guardados por separado --- */
{
  comprobar('Apariencia guarda fondo y colores en claves distintas',
    coloresYFondoSonIndependientes({ ...DEFAULT_APARIENCIA, temaPersonalizado: DEFAULT_TEMA_PERSONALIZADO }) === true);
  comprobar('Si faltara una de las dos, se detecta',
    coloresYFondoSonIndependientes({ fondo: {} }) === false);
  // Y que el fondo no guarde una copia de los colores dentro.
  comprobar('El fondo NO guarda colores de interfaz dentro',
    coloresYFondoSonIndependientes({ fondo: { tipo: 'foto' }, temaPersonalizado: {} }) === true);
  comprobar('Si los mezclara, la prueba lo cazaría',
    coloresYFondoSonIndependientes({ fondo: { secundario: '#FF0000' }, temaPersonalizado: {} }) === false);
}

/* --- Apartados 14 y 17: presets sin perder la foto ni la transparencia --- */
{
  const actual = normalizarTema({ superficieAlfa: 40, secundario: '#FF0000' });
  const preset = { secundario: '#0000FF', texto: '#FFFFFF' };
  const tras = aplicarPresetColor(actual, preset);
  comprobar('Un preset cambia los colores', tras.secundario === '#0000FF' && tras.texto === '#FFFFFF');
  // Lo que importa: un preset de COLOR no puede volver las tarjetas opacas y
  // taparle a Josué la fotografía que acaba de poner.
  comprobar('UN PRESET DE COLOR NO TAPA LA FOTOGRAFÍA: conserva la transparencia', tras.superficieAlfa === 40);
  comprobar('Si el preset sí declara transparencia, manda el preset',
    aplicarPresetColor(actual, { ...preset, superficieAlfa: 100 }).superficieAlfa === 100);
  comprobar('Un preset vacío no revienta', !!aplicarPresetColor(actual, null));
  // Apartado 17: foto + colores personalizados a la vez es explícitamente válido.
  comprobar('Hay un alfa por cada superficie personalizable', CAMPOS_ALFA.length === 3);
}

/* --- FO Fase 7: los campos que la Fase 4 dejó sin control --- */
{
  // Estos cuatro existían en el modelo desde FO F4 pero no tenían forma de tocarse:
  // se podían guardar y no había control. La Fase 7 les pone uno en el constructor.
  for (const campo of ['textoSecundario', 'iconoActivo', 'iconoInactivo', 'navegacionFondo']) {
    comprobar(`"${campo}" es editable a mano`, CAMPOS_COLOR.includes(campo));
  }
  comprobar('El borde tiene su propia transparencia', CAMPOS_ALFA.includes('bordeAlfa'));
  comprobar('Las sombras existen en el modelo', 'sombras' in DEFAULT_TEMA_PERSONALIZADO);
  comprobar('...y de fábrica están apagadas', DEFAULT_TEMA_PERSONALIZADO.sombras === 0);
  comprobar('Una sombra absurda se acota', normalizarTema({ sombras: 999 }).sombras === MAX_SOMBRAS);
  comprobar('...y una negativa también', normalizarTema({ sombras: -50 }).sombras === 0);
  comprobar('Una sombra cuenta como personalización', tieneColoresPersonalizados({ sombras: 10 }) === true);
  comprobar('Restablecer también las apaga', restablecerColores().sombras === 0);

  // Que lleguen a los tokens de verdad, que es lo que distingue un ajuste real de
  // uno que se guarda y no hace nada.
  aplicarTema('oscuro', false, ACENTO, normalizarTema(null));
  comprobar('Sin sombra, la tarjeta no lleva ninguna', COLORS.cardShadow === 'none');
  comprobar('Al 100 %, el borde translúcido es el borde sólido', COLORS.borderAlpha === COLORS.border);

  aplicarTema('oscuro', false, ACENTO, normalizarTema({ sombras: 24, bordeAlfa: 50 }));
  comprobar('Con sombra, la tarjeta la recibe', COLORS.cardShadow.includes('px'), COLORS.cardShadow);
  comprobar('El borde se vuelve translúcido', COLORS.borderAlpha.startsWith('rgba('), COLORS.borderAlpha);
  comprobar('...a la opacidad pedida', COLORS.borderAlpha.includes('0.5'), COLORS.borderAlpha);
  comprobar('El borde sólido sigue disponible', COLORS.border.startsWith('#'));
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
