// ============================================================================
// SO · Los archivos de audio REALES, contra su ficha
//
// 🚨 Hasta aquí, la ficha de cada sonido —duración mínima y máxima, peso, nombre—
// existía y se probaba... **contra números escritos a mano en el propio test**.
// Nadie miraba los archivos. El 2026-09-04 Josué empezó a producirlos en FL
// Studio y quedó claro lo que faltaba: un `ui_toggle_off` de 400 ms habría pasado
// todas las pruebas del proyecto.
//
// Esto abre los MP3 de `public/sonidos/` y mide su duración de verdad.
//
// ⚠️ Sin ffmpeg ni ffprobe: la duración se saca leyendo las cabeceras de trama
// del propio MP3. `verificar.sh` no puede depender de nada que no esté en el
// repositorio, o dejaría de correr en otra máquina.
// ============================================================================

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { validarArchivo, listaDeArchivos, queFalta, FORMATO, MAX_KB } from '../src/lib/especificacionSonidos.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const CARPETA = join(RAIZ, 'public/sonidos');

let n = 0; let fallos = 0;
const ok = (c, m) => { n += 1; if (c) console.log(`  ✓ ${m}`); else { fallos += 1; console.log(`  ✗ ${m}`); } };

/* Tablas del estándar MPEG audio. Solo hacen falta las de MPEG1/2 Layer III,
   que es lo que produce cualquier exportación a MP3. */
const BITRATES = {
  1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0], // MPEG1 L3
  2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0], // MPEG2/2.5 L3
};
const FRECUENCIAS = { 3: [44100, 48000, 32000], 2: [22050, 24000, 16000], 0: [11025, 12000, 8000] };

/**
 * Duración de un MP3 en milisegundos, recorriendo sus tramas.
 *
 * ⚠️ Se recorre trama a trama en vez de dividir bytes entre bitrate: con un
 * archivo de 100 ms, una cabecera ID3 de 2 KB falsearía el cálculo por completo.
 */
function duracionMp3(ruta) {
  const b = readFileSync(ruta);
  let i = 0;
  // Saltar ID3v2 si lo hay: 'ID3' + versión + flags + 4 bytes de tamaño sincroseguro.
  if (b.length > 10 && b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) {
    i = 10 + ((b[6] & 0x7f) << 21 | (b[7] & 0x7f) << 14 | (b[8] & 0x7f) << 7 | (b[9] & 0x7f));
  }
  let muestras = 0; let sr = 0; let tramas = 0; let retardo = 0; let relleno = 0;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff || (b[i + 1] & 0xe0) !== 0xe0) { i += 1; continue; } // no es sincronismo
    const versionId = (b[i + 1] >> 3) & 0x03;
    const capa = (b[i + 1] >> 1) & 0x03;
    const bitrateIdx = (b[i + 2] >> 4) & 0x0f;
    const frecIdx = (b[i + 2] >> 2) & 0x03;
    const padding = (b[i + 2] >> 1) & 0x01;
    if (versionId === 1 || capa !== 1 || bitrateIdx === 0 || bitrateIdx === 15 || frecIdx === 3) { i += 1; continue; }

    const mpeg1 = versionId === 3;
    const kbps = BITRATES[mpeg1 ? 1 : 2][bitrateIdx];
    const frec = FRECUENCIAS[versionId][frecIdx];
    const porTrama = mpeg1 ? 1152 : 576;
    const largo = Math.floor((porTrama / 8) * kbps * 1000 / frec) + padding;
    if (largo <= 4) { i += 1; continue; }

    /* 🐛 **La primera trama puede no ser audio.** Si lleva la etiqueta Xing/Info
       es una cabecera de información, y contarla añadía 26 ms fantasma.

       Y dentro de ella, la subetiqueta LAME dice cuántas muestras de relleno
       metió el codificador **al principio y al final**. El reproductor las
       descarta; contarlas no. Sin esto, el medidor daba 216 ms para un archivo
       que dura 150, y seis sonidos correctos aparecían como pasados de largo.

       Se comprobó contra `ffprobe`: con esta corrección coinciden al ms. */
    if (tramas === 0) {
      const cab = b.subarray(i, i + Math.min(largo, 512));
      const xing = cab.indexOf('Xing') >= 0 || cab.indexOf('Info') >= 0;
      if (xing) {
        for (const marca of ['LAME', 'Lavc', 'Lavf']) {
          const p = cab.indexOf(marca);
          if (p >= 0 && p + 24 <= cab.length) {
            const d = p + 21;
            retardo = (cab[d] << 4) | (cab[d + 1] >> 4);
            relleno = ((cab[d + 1] & 0x0f) << 8) | cab[d + 2];
            break;
          }
        }
        i += largo;
        sr = frec;
        continue; // no suma muestras: no es audio
      }
    }

    muestras += porTrama; sr = frec; tramas += 1;
    i += largo;
  }
  const utiles = Math.max(0, muestras - retardo - relleno);
  return { ms: sr ? Math.round(utiles / sr * 1000) : 0, tramas };
}

console.log('\n🔊 Los archivos de audio, contra su ficha\n');

const presentes = (() => {
  try { return readdirSync(CARPETA).filter((f) => f.endsWith(`.${FORMATO}`)).sort(); } catch { return []; }
})();

if (presentes.length === 0) {
  console.log('  ⏸ No hay ningún archivo todavía. Nada que comprobar, y no es un fallo.\n');
  process.exit(0);
}

console.log(`  ${presentes.length} de ${listaDeArchivos().length} producidos\n`);

for (const nombre of presentes) {
  const ruta = join(CARPETA, nombre);
  const kb = statSync(ruta).size / 1024;
  const { ms, tramas } = duracionMp3(ruta);

  /* 🚨 Si el lector de tramas no encuentra ninguna, NO se da por bueno el
     archivo: se falla. Un medidor que devuelve 0 y se interpreta como "sin
     problemas" es peor que no medir, porque da confianza falsa. */
  ok(tramas > 0, `${nombre} — se puede leer como MP3 (${tramas} tramas)`);

  const r = validarArchivo({ nombre, duracionMs: ms, tamanoKb: kb });
  const ficha = listaDeArchivos().find((a) => a.nombre === nombre);
  const rango = ficha ? `${ficha.minMs}–${ficha.maxMs} ms` : '?';
  ok(r.valido, `${nombre} — ${ms} ms (ficha ${rango}), ${kb.toFixed(1)} KB${r.valido ? '' : ` → ${r.problemas.join(' ')}`}`);
}

/* ⚠️ Y el peso, que la ficha limita a 60 KB por archivo: son sonidos que se
   precargan varios a la vez en un móvil con datos. */
const pesados = presentes.filter((f) => statSync(join(CARPETA, f)).size / 1024 > MAX_KB);
ok(pesados.length === 0, `Ninguno pasa de ${MAX_KB} KB${pesados.length ? ` — ${pesados.join(', ')}` : ''}`);

/* Que no aparezca en la carpeta nada que la biblioteca no declare: un archivo
   con el nombre mal escrito no sonaría nunca, y es un fallo silencioso. */
const declarados = new Set(listaDeArchivos().map((a) => a.nombre));
const intrusos = presentes.filter((f) => !declarados.has(f));
ok(intrusos.length === 0, `Ningún archivo con nombre que la biblioteca no conozca${intrusos.length ? ` — ${intrusos.join(', ')}` : ''}`);

console.log(`\n  Faltan ${queFalta(presentes).faltan.length} de ${listaDeArchivos().length}.\n`);
console.log(`${fallos === 0 ? '  Todo correcto.' : `  ${fallos} fallo(s).`}\n`);
process.exit(fallos === 0 ? 0 : 1);
