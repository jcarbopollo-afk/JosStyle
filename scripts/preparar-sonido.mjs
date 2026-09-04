// ============================================================================
// Prepara un sonido exportado de FL Studio para entrar en la biblioteca.
//
// FL exporta el compás entero: el sonido dura 80 ms y el archivo 1,9 segundos.
// Esto recorta el silencio, normaliza a -3 dB de pico —el mismo para toda la
// biblioteca, para que al alternar no haya baches— y reencoda a 256k.
//
//   node scripts/preparar-sonido.mjs ui_click_01 ui_click_02
//
// Lee de la carpeta de Descargas y deja el resultado en public/sonidos/.
//
// ⚠️ NO forma parte de verificar.sh: necesita ffmpeg, y la suite no puede
// depender de nada que no esté en el repositorio. Es una herramienta, no una
// prueba. Quien comprueba el resultado es scripts/test-archivos-sonido.mjs, que
// sí es dependency-free.
//
// 🚨 A 256k y sin recorte de agudos por un motivo medido: a 128k se recorta por
// encima de 16 kHz, y ahí es donde vive la diferencia entre las variantes de un
// mismo sonido. Con 128k, ui_click_02 dejaba de distinguirse de ui_click_01.
// ============================================================================
import { execFileSync } from 'node:child_process';
import { readFileSync, unlinkSync } from 'node:fs';

const DESCARGAS = 'C:/Users/clapi/Downloads';
const DESTINO = 'C:/Users/clapi/JosStyle/public/sonidos';
const TMP = 'C:/Users/clapi/AppData/Local/Temp/claude';
const SR = 44100;

/* ⚠️ `--octava` sube el sonido una octava, conservando la duración.
   No es lo mismo que tocar la nota más aguda —el timbre cambia un poco—, así que
   es un rescate, no la forma normal de trabajar. Se añadió el 2026-09-04, cuando
   cuatro sonidos salieron una octava por debajo de lo que hacía falta (la tabla
   de notas daba lo que debía SONAR, y Josué las escribe en el piano roll con el
   instrumento transponiendo) y él ya no tenía FL Studio a mano para rehacerlos.
   El resultado se mide igual que todo lo demás: C#4→G#4 quedó en C#5→G#5. */
const SUBIR_OCTAVA = process.argv.includes('--octava');
const nombres = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (nombres.length === 0) { console.log('uso: node scripts/preparar-sonido.mjs [--octava] <nombre sin .mp3> ...'); process.exit(1); }

for (const n of nombres) {
  let origen = `${DESCARGAS}/${n}.mp3`;

  if (SUBIR_OCTAVA) {
    const subido = `${TMP}/_oct_${n}.mp3`;
    execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-i', origen,
      '-af', 'rubberband=pitch=2', '-codec:a', 'libmp3lame', '-b:a', '320k', '-y', subido]);
    origen = subido;
  }

  const crudo = `${TMP}/_${n}.raw`;
  execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-i', origen, '-ac', '1', '-ar', String(SR), '-f', 's16le', crudo, '-y']);

  const b = readFileSync(crudo);
  const t = b.length / 2;
  const w = Math.round(SR * 0.001);
  let pico = 0; let ini = null; let fin = 0;
  for (let i = 0; i < t; i += w) {
    let p = 0;
    for (let j = i; j < Math.min(i + w, t); j += 1) { const v = Math.abs(b.readInt16LE(j * 2)); if (v > p) p = v; }
    if (p > pico) pico = p;
    if (p && 20 * Math.log10(p / 32768) > -60) { if (ini === null) ini = i / SR * 1000; fin = i / SR * 1000 + 1; }
  }
  unlinkSync(crudo);

  // Arranca 4 ms antes del primer sonido y deja 30 ms de cola para el fundido.
  const desde = Math.max(0, (ini - 4) / 1000);
  const dura = (fin - ini + 26) / 1000;
  const ganancia = (-3 - 20 * Math.log10(pico / 32768)).toFixed(2);
  const fundido = Math.max(0.005, dura - 0.028);

  /* ⚠️ Dos pasadas, y la segunda no es un lujo. El MP3 no reproduce el pico
     exacto de la fuente: se pasa entre 1 y 2 dB según el material. Con una sola
     pasada los `ui_open` salieron a -1,5 dB cuando el resto de la biblioteca
     está a -3, y eso al alternar se oye como un bache. Así que se codifica, se
     mide **el archivo resultante**, y se vuelve a codificar con la diferencia. */
  const codificar = (gan) => execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-ss', desde.toFixed(4), '-t', dura.toFixed(4),
    '-i', origen, '-af', `volume=${gan}dB,afade=t=out:st=${fundido.toFixed(4)}:d=0.025`,
    '-codec:a', 'libmp3lame', '-b:a', '256k', '-cutoff', '20000', '-y', `${DESTINO}/${n}.mp3`]);

  const medir = () => {
    const comp = `${TMP}/_c_${n}.raw`;
    execFileSync('ffmpeg', ['-hide_banner', '-v', 'error', '-i', `${DESTINO}/${n}.mp3`, '-ac', '1', '-ar', String(SR), '-f', 's16le', comp, '-y']);
    const c = readFileSync(comp);
    let pf = 0;
    for (let j = 0; j < c.length / 2; j += 1) { const v = Math.abs(c.readInt16LE(j * 2)); if (v > pf) pf = v; }
    unlinkSync(comp);
    return { db: 20 * Math.log10(pf / 32768), ms: Math.round(c.length / 2 / SR * 1000) };
  };

  codificar(ganancia);
  let r = medir();
  const corregida = (Number(ganancia) + (-3 - r.db)).toFixed(2);
  codificar(corregida);
  r = medir();
  console.log(`${n.padEnd(24)} ${String(r.ms).padStart(4)} ms | pico ${r.db.toFixed(1)} dB`);
}
