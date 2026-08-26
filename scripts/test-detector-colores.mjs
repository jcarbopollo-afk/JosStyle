// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 5 — pruebas del detector de colores.
//
// Se construyen imágenes sintéticas píxel a píxel (un array RGBA, igual que el
// que devuelve `getImageData`), así que todo esto corre con Node sin navegador.
//
// Lo que más importa comprobar son las dos promesas difíciles:
//
//   1. Apartado 8 — FRECUENCIA ≠ UTILIDAD. Una foto casi toda negra con un
//      pequeño azul eléctrico tiene que dar el azul como acento, no el negro.
//   2. Apartado 17 — ninguna fotografía, por rara que sea, puede producir una
//      configuración rota.
// ---------------------------------------------------------------------------
import {
  LADO_ANALISIS, MAX_COLORES, TONOS, SATURACIONES, tonoDe, saturacionDe, esNeutro,
  analizarPixeles, analisisValidoPara, sellarAnalisis, describirColor,
} from '../src/lib/detectorColores.js';

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

console.log('\n═══ FO Fase 5 — detector de colores ═══\n');

/* Construye una imagen: `zonas` es una lista de [color, cuántos píxeles]. */
function imagen(zonas, ancho = 40) {
  const pixeles = [];
  for (const [hex, n] of zonas) {
    const v = parseInt(hex.replace('#', ''), 16);
    for (let i = 0; i < n; i++) pixeles.push((v >> 16) & 255, (v >> 8) & 255, v & 255, 255);
  }
  const alto = Math.ceil((pixeles.length / 4) / ancho);
  return { datos: new Uint8ClampedArray(pixeles), ancho, alto };
}

/* --- Clasificación (apartados 5, 6 y 7) --- */
{
  comprobar('Los 3 tonos del apartado 5', TONOS.length === 3);
  comprobar('Las 4 saturaciones del apartado 6', SATURACIONES.length === 4);
  comprobar('El negro es oscuro', tonoDe('#000000') === 'oscuro');
  comprobar('El blanco es claro', tonoDe('#FFFFFF') === 'claro');
  comprobar('Un gris medio es medio', tonoDe('#808080') === 'medio');
  comprobar('Un rojo puro es vivo', saturacionDe('#FF0000') === 'vivo');
  comprobar('Un gris es neutro', saturacionDe('#808080') === 'neutro');
  comprobar('Un azul apagado es apagado o moderado', ['apagado', 'moderado'].includes(saturacionDe('#5C7E9A')));
  comprobar('El gris se detecta como neutro', esNeutro('#808080') === true);
  comprobar('El blanco y el negro también', esNeutro('#FFFFFF') && esNeutro('#000000'));
  comprobar('Un rojo puro no es neutro', esNeutro('#FF0000') === false);
  comprobar('El análisis se hace sobre una miniatura', LADO_ANALISIS <= 128);
}

/* --- Apartado 3: colores dominantes --- */
{
  const { datos, ancho, alto } = imagen([['#FF0000', 600], ['#0000FF', 300], ['#00FF00', 100]]);
  const p = analizarPixeles(datos, ancho, alto);
  comprobar('Detecta varios colores, no solo uno', p.colores.length >= 3, String(p.colores.length));
  comprobar('No devuelve más de los previstos', p.colores.length <= MAX_COLORES);
  comprobar('El dominante es el que más ocupa', p.dominante.hex.startsWith('#F'), p.dominante.hex);
  comprobar('El peso del dominante es el mayor', p.colores[0].peso >= p.colores[1].peso);
  comprobar('Los pesos suman aproximadamente 1',
    Math.abs(p.colores.reduce((a, c) => a + c.peso, 0) - 1) < 0.02);
  comprobar('Cada color trae su clasificación', p.colores.every((c) => c.tono && c.saturacion && 'neutro' in c));
  comprobar('...su luminosidad y saturación numéricas', p.colores.every((c) => Number.isFinite(c.luminosidad) && Number.isFinite(c.saturacionValor)));
  comprobar('...y dónde aparece (apartado 9)', p.colores.every((c) => ['arriba', 'centro', 'abajo'].includes(c.zona)));
  comprobar('El análisis lleva su fecha', !!p.analizadaEn);
}

/* --- APARTADO 8: LA PRUEBA QUE DEFINE ESTA FASE --- */
{
  // El ejemplo literal del apartado: "una fotografía predominantemente negra con
  // un pequeño elemento azul eléctrico. El azul podría ser mucho más interesante
  // como color de acento que un gris predominante".
  const { datos, ancho, alto } = imagen([['#0A0A0A', 950], ['#0080FF', 50]]);
  const p = analizarPixeles(datos, ancho, alto);

  comprobar('CLAVE · El dominante es el negro, que ocupa el 95 %', p.dominante.tono === 'oscuro');
  comprobar('CLAVE · Pero el ACENTO es el azul, que ocupa el 5 %',
    !p.acento.neutro && p.acento.saturacionValor > 0.5, `${p.acento.hex} sat=${p.acento.saturacionValor}`);
  comprobar('CLAVE · El acento NO es el color más frecuente', p.acento.hex !== p.dominante.hex);
  comprobar('CLAVE · ...y su interés es mayor pese a ocupar mucho menos',
    p.acento.interes > p.dominante.interes && p.acento.peso < p.dominante.peso);
  comprobar('El negro sí es el neutro de la paleta', p.neutro && p.neutro.neutro === true);
}

/* --- Apartado 4: la paleta estructurada --- */
{
  const { datos, ancho, alto } = imagen([['#1B3A5C', 400], ['#E8A33D', 250], ['#7F7F7F', 200], ['#F2F2F2', 100], ['#0D0D0D', 50]]);
  const p = analizarPixeles(datos, ancho, alto);
  for (const papel of ['dominante', 'acento', 'secundario', 'neutro', 'claro', 'oscuro']) {
    comprobar(`La paleta trae "${papel}"`, papel in p);
  }
  comprobar('El claro es más luminoso que el oscuro', p.claro.luminosidad > p.oscuro.luminosidad);
  comprobar('El neutro es neutro de verdad', p.neutro.neutro === true);
  comprobar('El acento no es neutro', p.acento.neutro === false);
  // Dos colores casi iguales no son una paleta: el secundario tiene que
  // diferenciarse del acento.
  if (p.secundario) {
    comprobar('El secundario se distingue del acento', p.secundario.hex !== p.acento.hex);
  } else {
    comprobar('Sin un segundo color distinto, el secundario es null (no inventado)', p.secundario === null);
  }
  comprobar('Hay color medio calculado', !!p.medio);
  comprobar('Se considera suficiente', p.suficiente === true);
}

/* --- APARTADO 17: fotografías problemáticas. Nunca una configuración rota --- */
{
  const casos = [
    ['toda negra', imagen([['#000000', 1000]])],
    ['toda blanca', imagen([['#FFFFFF', 1000]])],
    ['gris plano', imagen([['#808080', 1000]])],
    ['extremadamente oscura', imagen([['#050505', 900], ['#0A0A0A', 100]])],
    ['extremadamente clara', imagen([['#FAFAFA', 900], ['#F5F5F5', 100]])],
    ['dos colores nada más', imagen([['#FF0000', 500], ['#00FF00', 500]])],
    ['un solo píxel', imagen([['#123456', 1]], 1)],
    ['saturadísima', imagen([['#FF0000', 250], ['#00FF00', 250], ['#0000FF', 250], ['#FFFF00', 250]])],
  ];
  for (const [nombre, img] of casos) {
    const p = analizarPixeles(img.datos, img.ancho, img.alto);
    const ok = p && Array.isArray(p.colores) && 'dominante' in p && 'monocromatica' in p && 'suficiente' in p;
    comprobar(`Una foto ${nombre} no rompe nada`, ok);
  }
  // Y las entradas imposibles.
  comprobar('Sin datos devuelve una paleta válida y vacía', analizarPixeles(null, 0, 0).colores.length === 0);
  comprobar('...marcada como insuficiente', analizarPixeles(null, 0, 0).suficiente === false);
  comprobar('Datos vacíos tampoco revientan', analizarPixeles(new Uint8ClampedArray([]), 10, 10).suficiente === false);
}

/* --- Apartado 18: monocromáticas --- */
{
  const negra = imagen([['#000000', 700], ['#1A1A1A', 300]]);
  const p = analizarPixeles(negra.datos, negra.ancho, negra.alto);
  comprobar('Una foto en blanco y negro se identifica como monocromática', p.monocromatica === true);
  // Y esto es lo honesto: NO se inventa un acento que no existe. La Fase 6
  // podrá buscarlo por otro lado sabiendo que aquí no lo hay.
  comprobar('...y NO se inventa un acento que la foto no tiene', p.acento === null);
  comprobar('...pero sí tiene neutro, que es lo que de verdad hay', p.neutro !== null);

  const color = imagen([['#FF0000', 500], ['#00FF00', 500]]);
  const q = analizarPixeles(color.datos, color.ancho, color.alto);
  comprobar('Una foto con color NO se marca como monocromática', q.monocromatica === false);
}

/* --- Píxeles transparentes: un agujero no es un color --- */
{
  const pixeles = [];
  for (let i = 0; i < 500; i++) pixeles.push(255, 0, 0, 255);   // rojo opaco
  for (let i = 0; i < 500; i++) pixeles.push(0, 0, 0, 0);       // transparente
  const p = analizarPixeles(new Uint8ClampedArray(pixeles), 40, 25);
  comprobar('Los píxeles transparentes NO cuentan como negro',
    p.colores.every((c) => c.tono !== 'oscuro'), p.colores.map((c) => c.hex).join());
  comprobar('...y el rojo sale con todo el peso', p.dominante.peso > 0.4, String(p.dominante.peso));
}

/* --- Apartados 13 y 14: cada análisis con SU fotografía --- */
{
  const fotoA = { id: 'a1' };
  const fotoB = { id: 'b2' };
  const { datos, ancho, alto } = imagen([['#FF0000', 1000]]);
  const analisisA = sellarAnalisis(analizarPixeles(datos, ancho, alto), fotoA);

  comprobar('Un análisis sellado vale para su foto', analisisValidoPara(analisisA, fotoA) === true);
  // ESTE es el fallo que la comprobación evita: cambiar de foto y seguir
  // enseñando la paleta de la anterior.
  comprobar('NO vale para otra fotografía', analisisValidoPara(analisisA, fotoB) === false);
  comprobar('Sin análisis, no vale', analisisValidoPara(null, fotoA) === false);
  comprobar('Sin foto, tampoco', analisisValidoPara(analisisA, null) === false);
  comprobar('Una foto sin id nunca reutiliza un análisis', analisisValidoPara(analisisA, {}) === false);
  comprobar('Sellar null devuelve null', sellarAnalisis(null, fotoA) === null);
}

/* --- Apartado 12: cómo se describe un color --- */
{
  const { datos, ancho, alto } = imagen([['#0080FF', 800], ['#000000', 200]]);
  const p = analizarPixeles(datos, ancho, alto);
  const texto = describirColor(p.dominante);
  comprobar('La descripción dice cuánto ocupa', texto.includes('%'));
  comprobar('...y qué tono es', TONOS.some((t) => texto.includes(t)));
  comprobar('Un color minúsculo se describe sin decir "0 %"',
    describirColor({ peso: 0.002, tono: 'claro', saturacion: 'vivo', neutro: false }).includes('menos del 1 %'));
  comprobar('Sin color, no inventa texto', describirColor(null) === '');
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
