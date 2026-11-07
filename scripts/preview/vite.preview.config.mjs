/* ═══════════════════════════════════════════════════════════════════════════
   PREVIEW DE FITNESS — la configuración de Vite de la preview local
   ═══════════════════════════════════════════════════════════════════════════
   La misma aplicación que la de producción (`vite.config.js`), con tres cambios:
   1. `@supabase/supabase-js` es el simulado (`supabaseSimulado.js`): ningún dato
      real, ni una petición a Supabase.
   2. Sale a `dist-preview/`, nunca a `dist/` (lo que publica Vercel).
   3. Una etiqueta «PREVIEW» y el título de la pestaña lo dicen.
   Uso: `npx vite build --config scripts/preview/vite.preview.config.mjs` y
   `npx vite preview --config scripts/preview/vite.preview.config.mjs --port 4321`. */

import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const raiz = fileURLToPath(new URL('../../', import.meta.url));
const { version } = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));

const etiquetaPreview = () => ({
  name: 'josstyle-etiqueta-preview',
  transformIndexHtml(html) {
    return html
      .replace(/<title>([^<]*)<\/title>/, '<title>$1 · PREVIEW</title>')
      .replace('</body>', '<div aria-hidden="true" style="position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 86px);z-index:2147483647;pointer-events:none;font:600 10px/1 system-ui,sans-serif;letter-spacing:.06em;padding:4px 8px;border-radius:999px;background:rgba(0,0,0,.55);color:#fff">PREVIEW · DATOS DE PRUEBA EN ESTE NAVEGADOR</div></body>');
  },
});

export default defineConfig({
  root: raiz,
  /* Ni `.env` ni `.env.local`: la preview no conoce ninguna clave real. */
  envDir: fileURLToPath(new URL('./', import.meta.url)),
  plugins: [react(), etiquetaPreview()],
  resolve: {
    alias: [{ find: /^@supabase\/supabase-js$/, replacement: fileURLToPath(new URL('./supabaseSimulado.js', import.meta.url)) }],
  },
  define: {
    __JOSSTYLE_VERSION__: JSON.stringify(`${version}-preview-fitness`),
    __JOSSTYLE_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('https://preview.invalid'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('preview'),
  },
  build: { outDir: fileURLToPath(new URL('../../dist-preview/', import.meta.url)), emptyOutDir: true },
  preview: { host: '0.0.0.0', strictPort: true },
});
