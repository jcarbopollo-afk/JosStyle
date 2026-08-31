// Compila un script JSX con esbuild (Node no entiende JSX) y lo ejecuta.
//   node scripts/smoke.mjs                     → prueba de humo de las vistas
//   node scripts/smoke.mjs test-modulos.jsx    → cualquier otro script JSX de scripts/
import { build } from 'esbuild';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { rmSync } from 'node:fs';

const script = process.argv[2] || 'smoke-vistas.jsx';
/* 🐛 `.pathname` de una URL de archivo devuelve `/C:/...` en Windows, y esbuild
   no resuelve esa ruta: la prueba de humo no llegaba a compilar. `fileURLToPath`
   es lo que existe para esto. Lo cazó la EH F19. */
const salida = new URL('../node_modules/.cache/jc-smoke.mjs', import.meta.url);
const SALIDA = fileURLToPath(salida);

await build({
  entryPoints: [fileURLToPath(new URL(`./${script}`, import.meta.url))],
  outfile: SALIDA,
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
    //
    // `lib/supabase.js` se stubea por un motivo distinto: lee `import.meta.env`
    // al cargarse, y eso solo existe dentro de Vite. Apareció al añadir
    // ArmarioView (AR Fase 1), la primera vista del smoke que toca Storage.
    // Stubearlo es además lo correcto: `renderToString` no ejecuta los efectos,
    // así que una vista NUNCA debería necesitar la red para pintarse — si alguna
    // lo intentara, es un fallo de diseño y esta prueba lo destaparía.
    name: 'stub-solo-navegador',
    setup(b) {
      const soloNavegador = /(^pdfjs-dist|^@zxing\/library|\?url$)/;
      b.onResolve({ filter: soloNavegador }, (args) => ({ path: args.path, namespace: 'stub' }));
      b.onResolve({ filter: /lib\/supabase(\.js)?$/ }, (args) => ({ path: args.path, namespace: 'stub-supabase' }));
      b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
        contents: 'export default {}; export const getDocument = () => ({ promise: Promise.resolve({ numPages: 0 }) }); export const GlobalWorkerOptions = {}; export class BrowserMultiFormatReader {}',
        loader: 'js',
      }));
      b.onLoad({ filter: /.*/, namespace: 'stub-supabase' }, () => ({
        contents: `
          export const supabase = {};
          const nada = async () => null;
          export const getSession = nada, onAuthChange = nada, onAuthEvent = nada;
          export const sendPasswordReset = nada, loadData = nada, saveData = nada, signOut = nada;
          export const uploadProgressPhoto = nada, deleteProgressPhoto = nada, getSignedPhotoUrl = nada;
          export const uploadTrainingVideo = nada, deleteTrainingVideo = nada, getSignedVideoUrl = nada;
          export const uploadBibliotecaArchivo = nada, deleteBibliotecaArchivo = nada, getSignedArchivoUrl = nada;
          export const uploadPrendaFoto = nada, deletePrendaFoto = nada, getSignedPrendaUrl = nada;
        `,
        loader: 'js',
      }));
    },
  }],
});

try {
  await import(pathToFileURL(SALIDA).href);
} finally {
  rmSync(SALIDA, { force: true });
}
