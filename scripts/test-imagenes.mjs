// ---------------------------------------------------------------------------
// Entrega 2 · FO Fase 11 — pruebas de optimización de imágenes.
//
// Lo que se comprueba aquí es la parte que decide: qué tamaño debe tener la
// copia y cuándo NO hay que tocar nada. El redimensionado en sí necesita un
// `<canvas>` y solo lo puede ver Josué en su iPhone.
//
// Las dos reglas que más importan:
//   · Nunca agrandar: escalar hacia arriba no añade detalle, solo peso.
//   · La proporción no se toca. Deformar una foto de fondo es peor que no
//     optimizarla.
// ---------------------------------------------------------------------------
import {
  LADO_FONDO, LADO_MINIATURA, CALIDAD, calcularDimensiones, ahorroDe,
  urlEnCache, guardarUrl, olvidarUrl, urlFirmada,
} from '../src/lib/imagenes.js';

let fallos = 0;
const comprobar = (nombre, ok, detalle = '') => {
  if (ok) console.log(`  ✓ ${nombre}`);
  else { console.error(`  ✗ ${nombre}${detalle ? ' → ' + detalle : ''}`); fallos++; }
};

console.log('\n═══ FO Fase 11 — optimización de imágenes ═══\n');

/* --- Apartados 3 y 4: qué tamaño debe tener la copia --- */
{
  comprobar('El lado del fondo cubre una pantalla de móvil con margen', LADO_FONDO >= 1400);
  comprobar('La miniatura es mucho más pequeña', LADO_MINIATURA < LADO_FONDO / 4);
  comprobar('La calidad JPEG es razonable', CALIDAD > 0.7 && CALIDAD < 0.95);

  // Una foto de iPhone 15: 4032×3024, unos 4 MB. Es el caso real.
  const d = calcularDimensiones(4032, 3024, LADO_FONDO);
  comprobar('Una foto de iPhone se reduce', d.redimensionar === true);
  comprobar('...al lado máximo por el lado largo', d.ancho === LADO_FONDO, String(d.ancho));
  // Y esta es LA regla: la proporción no se toca.
  comprobar('CLAVE · La proporción se conserva exactamente',
    Math.abs((d.ancho / d.alto) - (4032 / 3024)) < 0.005, `${d.ancho}x${d.alto}`);

  // Vertical: el lado largo es el alto.
  const v = calcularDimensiones(3024, 4032, LADO_FONDO);
  comprobar('En una foto vertical, el lado largo es el alto', v.alto === LADO_FONDO && v.ancho < v.alto);
  comprobar('...y la proporción también se conserva',
    Math.abs((v.ancho / v.alto) - (3024 / 4032)) < 0.005, `${v.ancho}x${v.alto}`);

  // Panorámica extrema.
  const pano = calcularDimensiones(6000, 1000, LADO_FONDO);
  comprobar('Una panorámica se reduce por el ancho', pano.ancho === LADO_FONDO);
  comprobar('...sin dejar el alto en cero', pano.alto >= 1, String(pano.alto));

  // NUNCA agrandar: escalar hacia arriba no añade detalle, solo peso.
  const pequena = calcularDimensiones(800, 600, LADO_FONDO);
  comprobar('CLAVE · Una imagen ya pequeña NO se agranda', pequena.redimensionar === false);
  comprobar('...y se devuelve con sus medidas', pequena.ancho === 800 && pequena.alto === 600);
  const justa = calcularDimensiones(LADO_FONDO, 900, LADO_FONDO);
  comprobar('Una imagen justo en el límite tampoco se toca', justa.redimensionar === false);

  // Entradas imposibles.
  comprobar('Sin medidas no se inventa un tamaño', calcularDimensiones(0, 0, LADO_FONDO).redimensionar === false);
  comprobar('...y devuelve ceros, no NaN', calcularDimensiones(0, 0, LADO_FONDO).ancho === 0);
  comprobar('Medidas negativas tampoco revientan', calcularDimensiones(-100, -50, LADO_FONDO).ancho === 0);
  comprobar('Medidas no numéricas tampoco', calcularDimensiones('mucho', 'poco', LADO_FONDO).ancho === 0);

  // La miniatura usa el mismo cálculo con otro objetivo.
  const m = calcularDimensiones(4032, 3024, LADO_MINIATURA);
  comprobar('La miniatura sale del mismo cálculo', m.ancho === LADO_MINIATURA);
  comprobar('...y es mucho más ligera de pintar', m.ancho * m.alto < (LADO_FONDO * LADO_FONDO) / 10);
}

/* --- Contar el ahorro sin inventarlo --- */
{
  const a = ahorroDe(4 * 1024 * 1024, 400 * 1024);
  comprobar('Un ahorro grande se cuenta', a && a.pct >= 85, JSON.stringify(a));
  comprobar('...con los dos tamaños a la vista', a.texto.includes('MB') && a.texto.includes('KB'));
  // Si no hay ahorro, no se dice "0 %": no se dice nada.
  comprobar('Sin ahorro no se inventa un número', ahorroDe(1000, 1000) === null);
  comprobar('Si la copia pesa más, tampoco', ahorroDe(1000, 2000) === null);
  comprobar('Un ahorro de menos del 5 % no merece mencionarse', ahorroDe(1000, 970) === null);
  comprobar('Sin datos, null', ahorroDe(0, 0) === null);
}

/* --- Apartado 6: la caché de URLs firmadas --- */
{
  olvidarUrl();
  comprobar('Una ruta sin firmar no está en caché', urlEnCache('u/1.jpg') === null);

  guardarUrl('u/1.jpg', 'https://x/1', 3600 * 1000);
  comprobar('Una URL guardada se recupera', urlEnCache('u/1.jpg') === 'https://x/1');
  comprobar('Otra ruta sigue sin estar', urlEnCache('u/2.jpg') === null);

  // Una URL a punto de caducar NO se entrega: se pide otra. Si no, se entregaría
  // una que expira mientras la imagen se está descargando.
  guardarUrl('u/3.jpg', 'https://x/3', 30 * 1000);   // caduca en 30 s
  comprobar('CLAVE · Una URL a punto de caducar NO se entrega', urlEnCache('u/3.jpg') === null);
  guardarUrl('u/4.jpg', 'https://x/4', 5 * 60 * 1000);
  comprobar('...pero una con margen de sobra sí', urlEnCache('u/4.jpg') === 'https://x/4');

  comprobar('Se puede olvidar una ruta concreta', (olvidarUrl('u/1.jpg'), urlEnCache('u/1.jpg')) === null);
  comprobar('...y la de al lado sigue', urlEnCache('u/4.jpg') === 'https://x/4');
  guardarUrl('', 'https://x/5');
  comprobar('Una ruta vacía no ensucia la caché', urlEnCache('') === null);
}

/* --- Y lo que la caché evita: pedir dos veces lo mismo --- */
{
  olvidarUrl();
  let llamadas = 0;
  const firmar = async (p) => { llamadas += 1; return `https://firmada/${p}`; };

  const a = await urlFirmada('u/9.jpg', firmar);
  const b = await urlFirmada('u/9.jpg', firmar);
  comprobar('La primera vez se firma', a === 'https://firmada/u/9.jpg');
  comprobar('CLAVE · La segunda NO vuelve a pedir la firma', llamadas === 1, `${llamadas} llamadas`);
  comprobar('...y devuelve lo mismo', b === a);

  await urlFirmada('u/10.jpg', firmar);
  comprobar('Otra foto sí se firma', llamadas === 2);

  // Si la firma falla, no se cachea un null: la próxima vez se reintenta.
  const fallona = async () => null;
  comprobar('Una firma fallida devuelve null', await urlFirmada('u/11.jpg', fallona) === null);
  comprobar('...y NO se guarda, así que se reintenta', urlEnCache('u/11.jpg') === null);
  comprobar('Sin ruta no se llama a firmar', await urlFirmada('', firmar) === null && llamadas === 2);
}

console.log(fallos === 0 ? '\n  Todo correcto.\n' : `\n  ${fallos} fallo(s).\n`);
process.exit(fallos === 0 ? 0 : 1);
