import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

/* 🚨 **La versión, dentro de la aplicación.**
   El 2026-09-07 Josué llevaba días con el sonido mudo en su iPhone y en ningún
   sitio se podía saber **qué versión estaba viendo**. En el PC y en otros dos
   móviles funcionaba; el suyo la tiene añadida a la pantalla de inicio, y en iOS
   eso puede servir la página vieja durante días. Sin este dato no hay forma de
   distinguir "el arreglo no sirve" de "el arreglo no le ha llegado", y las dos
   cosas se investigan de manera opuesta.

   ⚠️ Se lee de `package.json`, que es donde ya vive: una segunda copia escrita a
   mano se quedaría atrás justo el día que hiciera falta. */
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  plugins: [react()],
  define: {
    __JOSSTYLE_VERSION__: JSON.stringify(version),
    __JOSSTYLE_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
  },
});
