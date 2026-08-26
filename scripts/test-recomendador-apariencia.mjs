// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 6 — pruebas del sistema "Recomendado".
//
// Las dos que más importan:
//
//   · Apartado 8 — las propuestas tienen que ser REALMENTE distintas. El
//     apartado lo dice con un ejemplo: azul #123456, azul #123457 y azul
//     #123458 no son tres opciones, son una.
//   · Apartado 7 — ninguna propuesta puede salir con texto ilegible.
//
// Y la que hace que todo lo demás sea seguro: volver atrás tiene que recuperar
// EXACTAMENTE la apariencia anterior (apartado 12).
// ---------------------------------------------------------------------------
import {
  ESTRATEGIAS, generarPropuestas, aplicarPropuesta, guardarApariencia, sonDistintas,
} from '../src/lib/recomendadorApariencia.js';
import { DEFAULT_TEMA_PERSONALIZADO, COLORS_OSCURO, COLORS_CLARO } from '../src/tokens.js';
import { contrastRatio, hexToHsl } from '../src/lib/colorEngine.js';

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

console.log('\n═══ FO Fase 6 — sistema "Recomendado" ═══\n');

const color = (hex, extra = {}) => ({
  hex, peso: 0.3, tono: 'medio', saturacion: 'moderado', neutro: false,
  saturacionValor: 0.5, luminosidad: 0.5, interes: 0.4, zona: 'centro', ...extra,
});

// Una foto azul, como el ejemplo del apartado 5.
const AZUL = {
  colores: [color('#1B4F8C'), color('#8CA9C4'), color('#2B2B2B', { neutro: true, saturacionValor: 0 })],
  dominante: color('#1B4F8C'),
  acento: color('#1B7FD4', { saturacionValor: 0.78, interes: 0.6 }),
  secundario: color('#8CA9C4'),
  neutro: color('#2B2B2B', { neutro: true, saturacionValor: 0 }),
  claro: color('#8CA9C4', { luminosidad: 0.66 }),
  oscuro: color('#101820', { luminosidad: 0.08 }),
  medio: '#3A5F86', monocromatica: false, suficiente: true,
};

// Y una en blanco y negro, que según la Fase 5 NO tiene acento.
const GRIS = {
  colores: [color('#1A1A1A', { neutro: true, saturacionValor: 0 }), color('#8A8A8A', { neutro: true, saturacionValor: 0 })],
  dominante: color('#1A1A1A', { neutro: true }),
  acento: null, secundario: null,
  neutro: color('#8A8A8A', { neutro: true }),
  claro: color('#8A8A8A'), oscuro: color('#1A1A1A'),
  medio: '#4A4A4A', monocromatica: true, suficiente: true,
};

/* --- Apartado 3: varias propuestas, no una --- */
{
  const r = generarPropuestas(AZUL, DEFAULT_TEMA_PERSONALIZADO);
  comprobar('Se generan varias propuestas', r.posible && r.propuestas.length >= 3, String(r.propuestas.length));
  comprobar('Hay al menos las estrategias declaradas', ESTRATEGIAS.length >= 3);
  comprobar('Cada propuesta tiene nombre y descripción', r.propuestas.every((p) => p.nombre && p.descripcion));
  comprobar('...y un id único', new Set(r.propuestas.map((p) => p.id)).size === r.propuestas.length);
}

/* --- Apartado 4: cada propuesta es un tema COMPLETO --- */
{
  const [p] = generarPropuestas(AZUL, DEFAULT_TEMA_PERSONALIZADO).propuestas;
  comprobar('La propuesta trae color principal', !!p.accent);
  comprobar('...secundario y terciario', !!p.tema.secundario && !!p.tema.terciario);
  comprobar('...transparencia de tarjetas', p.tema.superficieAlfa > 0 && p.tema.superficieAlfa <= 100);
  comprobar('...transparencia de la barra', p.tema.navegacionAlfa > 0);
  comprobar('...overlay del fondo', 'intensidad' in p.overlay);
  comprobar('...y el texto legible sobre el acento', !!p.textoSobreAcento);
  comprobar('Trae muestras para poder enseñarla sin aplicarla', p.muestras.length >= 3);
  // El overlay es del FONDO, no del tema: son dos sitios distintos (FO F4).
  comprobar('El overlay NO se cuela dentro del tema', !('overlay' in p.tema));
}

/* --- APARTADO 8: LAS PROPUESTAS SON REALMENTE DISTINTAS --- */
{
  const { propuestas } = generarPropuestas(AZUL, DEFAULT_TEMA_PERSONALIZADO);
  // Ni dos acentos iguales.
  comprobar('CLAVE · No hay dos propuestas con el mismo acento',
    new Set(propuestas.map((p) => p.accent)).size === propuestas.length,
    propuestas.map((p) => p.accent).join());
  // Y no solo distintos: perceptiblemente distintos.
  let todasDistintas = true;
  for (let i = 0; i < propuestas.length; i++) {
    for (let j = i + 1; j < propuestas.length; j++) {
      if (!sonDistintas(propuestas[i], propuestas[j])) todasDistintas = false;
    }
  }
  comprobar('CLAVE · Y son distintas de verdad, no #123456 vs #123457', todasDistintas);
  // La de contraste tiene que ir por el lado opuesto del círculo.
  const eq = propuestas.find((p) => p.estrategia === 'equilibrada');
  const co = propuestas.find((p) => p.estrategia === 'contraste');
  const d = Math.abs(hexToHsl(eq.accent).h - hexToHsl(co.accent).h);
  comprobar('La propuesta "con contraste" usa el tono opuesto', (d > 180 ? 360 - d : d) > 90, String(Math.round(d)));
  // La serena tiene que estar de verdad más apagada.
  const se = propuestas.find((p) => p.estrategia === 'serena');
  comprobar('La propuesta "serena" está menos saturada que la equilibrada',
    hexToHsl(se.accent).s < hexToHsl(eq.accent).s, `${hexToHsl(se.accent).s.toFixed(0)} vs ${hexToHsl(eq.accent).s.toFixed(0)}`);
  // Y la serena deja ver más la foto: si no, no es serena.
  comprobar('...y deja ver MÁS la fotografía', se.tema.superficieAlfa < eq.tema.superficieAlfa);
  const inten = propuestas.find((p) => p.estrategia === 'intensa');
  comprobar('La "intensa" tapa más la foto que la serena', inten.tema.superficieAlfa > se.tema.superficieAlfa);
}

/* --- APARTADO 7: ninguna propuesta ilegible --- */
{
  // Se prueban colores base horribles a propósito: casi negro y casi blanco.
  const extremos = [
    ['casi negro', { ...AZUL, acento: color('#050508', { saturacionValor: 0.4, luminosidad: 0.02 }) }],
    ['casi blanco', { ...AZUL, acento: color('#FAFAFF', { saturacionValor: 0.4, luminosidad: 0.98 }) }],
    ['saturadísimo', { ...AZUL, acento: color('#FF00FF', { saturacionValor: 1, luminosidad: 0.5 }) }],
  ];
  for (const [nombre, analisis] of extremos) {
    for (const oscuro of [true, false]) {
      const { propuestas } = generarPropuestas(analisis, DEFAULT_TEMA_PERSONALIZADO, { modoOscuro: oscuro });
      const fondo = oscuro ? COLORS_OSCURO.bg : COLORS_CLARO.bg;
      const ok = propuestas.every((p) => contrastRatio(p.accent, fondo) >= 2.9);
      comprobar(`Un acento ${nombre} sale legible en tema ${oscuro ? 'oscuro' : 'claro'}`, ok,
        propuestas.map((p) => `${p.accent}:${contrastRatio(p.accent, fondo).toFixed(1)}`).join(' '));
    }
  }
}

/* --- Apartado 5: se parte de la foto, no de colores al azar --- */
{
  const { propuestas } = generarPropuestas(AZUL, DEFAULT_TEMA_PERSONALIZADO);
  const eq = propuestas.find((p) => p.estrategia === 'equilibrada');
  const tonoFoto = hexToHsl(AZUL.acento.hex).h;
  const tonoProp = hexToHsl(eq.accent).h;
  const d = Math.abs(tonoFoto - tonoProp);
  comprobar('La propuesta equilibrada mantiene el tono de la foto', (d > 180 ? 360 - d : d) < 30, String(Math.round(d)));
  // Determinista: la misma foto da siempre lo mismo, o no se podría probar.
  const otra = generarPropuestas(AZUL, DEFAULT_TEMA_PERSONALIZADO);
  comprobar('Generar dos veces da lo mismo: no es aleatorio',
    JSON.stringify(propuestas.map((p) => p.accent)) === JSON.stringify(otra.propuestas.map((p) => p.accent)));
}

/* --- Apartado 13: generar otras --- */
{
  const a = generarPropuestas(AZUL, DEFAULT_TEMA_PERSONALIZADO, { semilla: 0 });
  const b = generarPropuestas(AZUL, DEFAULT_TEMA_PERSONALIZADO, { semilla: 1 });
  comprobar('"Generar otras" da propuestas distintas',
    a.propuestas[0].accent !== b.propuestas[0].accent, `${a.propuestas[0].accent} vs ${b.propuestas[0].accent}`);
  comprobar('...pero igual de completas', b.propuestas.every((p) => p.accent && p.tema.secundario));
  comprobar('...y sigue siendo determinista',
    generarPropuestas(AZUL, DEFAULT_TEMA_PERSONALIZADO, { semilla: 1 }).propuestas[0].accent === b.propuestas[0].accent);
}

/* --- Foto monocromática: la Fase 5 dijo que no hay acento --- */
{
  const conTema = { ...DEFAULT_TEMA_PERSONALIZADO, secundario: '#C77C3A' };
  const r = generarPropuestas(GRIS, conTema);
  comprobar('Una foto en blanco y negro SÍ genera propuestas', r.posible === true);
  // Y lo importante: en vez de inventar un acento, se usa el que Josué ya tenía.
  const tonoSuyo = hexToHsl('#C77C3A').h;
  const tonoProp = hexToHsl(r.propuestas[0].accent).h;
  const d = Math.abs(tonoSuyo - tonoProp);
  comprobar('...partiendo del color que el usuario YA tenía, no de uno inventado',
    (d > 180 ? 360 - d : d) < 40, String(Math.round(d)));
  // Sin nada de nada, se cae al dominante en vez de no proponer.
  const r2 = generarPropuestas(GRIS, DEFAULT_TEMA_PERSONALIZADO);
  comprobar('Sin acento ni preferencia previa, se usa el dominante', r2.posible === true);
  comprobar('...y las propuestas siguen siendo legibles',
    r2.propuestas.every((p) => contrastRatio(p.accent, COLORS_OSCURO.bg) >= 2.9));
}

/* --- Sin análisis: se dice, no se inventa --- */
{
  comprobar('Sin análisis no se recomienda', generarPropuestas(null, DEFAULT_TEMA_PERSONALIZADO).posible === false);
  comprobar('...diciendo el motivo', generarPropuestas(null, DEFAULT_TEMA_PERSONALIZADO).motivo === 'sin_analisis');
  comprobar('Un análisis vacío tampoco', generarPropuestas({ colores: [] }, DEFAULT_TEMA_PERSONALIZADO).posible === false);
  comprobar('Un análisis sin ningún color usable lo dice',
    generarPropuestas({ colores: [color('#123456')], acento: null, secundario: null, dominante: null }, DEFAULT_TEMA_PERSONALIZADO).motivo === 'sin_color');
}

/* --- Apartados 10, 11 y 12: aplicar, probar y volver --- */
{
  const { propuestas } = generarPropuestas(AZUL, DEFAULT_TEMA_PERSONALIZADO);
  const p = propuestas[0];

  const cambios = aplicarPropuesta(p);
  comprobar('Aplicar devuelve las tres piezas por separado',
    'accent' in cambios && 'tema' in cambios && 'overlay' in cambios);
  // Apartado 10: NO toca la fotografía. Y no porque se acuerde: no la recibe.
  comprobar('APLICAR NO PUEDE TOCAR LA FOTOGRAFÍA: no la recibe', aplicarPropuesta.length === 1);
  comprobar('...ni devuelve nada de la foto', !('foto' in cambios) && !('encuadre' in cambios));
  comprobar('Aplicar null no revienta', aplicarPropuesta(null) === null);

  // Apartado 12: volver recupera EXACTAMENTE lo anterior.
  const antes = { accent: '#C77C3A', tema: { ...DEFAULT_TEMA_PERSONALIZADO, secundario: '#123456', superficieAlfa: 55 }, overlay: { color: '#FF0000', intensidad: 40 } };
  const copia = guardarApariencia(antes);
  comprobar('La copia guarda el acento', copia.accent === '#C77C3A');
  comprobar('...el tema entero', copia.tema.secundario === '#123456' && copia.tema.superficieAlfa === 55);
  comprobar('...y el overlay', copia.overlay.intensidad === 40);
  // Copia profunda: si fuera por referencia, probar una propuesta mutaría lo
  // guardado y "volver" no volvería a ninguna parte.
  antes.tema.secundario = '#000000';
  antes.overlay.intensidad = 0;
  comprobar('VOLVER FUNCIONA: la copia es profunda, no una referencia',
    copia.tema.secundario === '#123456' && copia.overlay.intensidad === 40);
  comprobar('Guardar sin nada no revienta', !!guardarApariencia({}).tema);
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
