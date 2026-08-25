// Compila scripts/smoke-vistas.jsx con esbuild (Node no entiende JSX) y lo ejecuta.
//   node scripts/smoke.mjs
import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
import { rmSync } from 'node:fs';

const salida = new URL('../node_modules/.cache/jc-smoke.mjs', import.meta.url);

await build({
  entryPoints: [new URL('./smoke-vistas.jsx', import.meta.url).pathname],
  outfile: salida.pathname,
  bundle: true,
  format: 'esm',
  platform: 'node',
  jsx: 'automatic',
  // Las dependencias de npm se dejan externas: se resuelven desde node_modules
  // al ejecutar, igual que hace Vite en desarrollo.
  packages: 'external',
  logLevel: 'error',
  plugins: [{
    // pdfjs-dist y @zxing/library solo funcionan dentro de un navegador, y
    // pdfText.js usa además `?url`, una sintaxis propia de Vite que Node no
    // entiende. Para una prueba de humo de RENDERIZADO no hacen falta: se
    // sustituyen por stubs vacíos. Si alguna vista dependiera de ellos para
    // pintarse, el propio render fallaría y la prueba lo detectaría.
    name: 'stub-solo-navegador',
    setup(b) {
      const soloNavegador = /(^pdfjs-dist|^@zxing\/library|\?url$)/;
      b.onResolve({ filter: soloNavegador }, (args) => ({ path: args.path, namespace: 'stub' }));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
        contents: 'export default {}; export const getDocument = () => ({ promise: Promise.resolve({ numPages: 0 }) }); export const GlobalWorkerOptions = {}; export class BrowserMultiFormatReader {}',
        loader: 'js',
      }));
    },
  }],
});

try {
  await import(pathToFileURL(salida.pathname).href);
} finally {
  rmSync(salida.pathname, { force: true });
}
