import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync } from 'node:fs';
import { validateExerciseCatalog, resumenDeValidacion, cuantos } from './src/lib/validacionCatalogo.js';

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

/* 🔓 FIT F35, apartado 26 — **un catálogo roto no se despliega.** Antes de
   compilar se valida el catálogo de ejercicios en bruto: con un error (un id
   repetido, un porcentaje imposible, una referencia que no existe, un ciclo de
   progresiones) el build **para** y Vercel no publica; con avisos (sin imagen,
   contenido incompleto) sigue, porque un aviso no puede parar un despliegue
   (apartado 27). Solo aquí se puede comprobar que una ruta de `public/` existe
   de verdad: el navegador no puede mirar el disco.

   ⚠️ Solo en `build` (`apply`): en desarrollo lo hace `main.jsx`, en la
   consola, sin tumbar el servidor. */
export function validarCatalogoAlCompilar({ bruto } = {}) {
  return {
    name: 'josstyle-validar-catalogo',
    apply: 'build',
    buildStart() {
      const publico = new URL('./public/', import.meta.url);
      /* `bruto` solo lo pasa la prueba, para demostrar que un catálogo roto
         PARA el build; sin él se valida el de verdad. */
      const v = validateExerciseCatalog(bruto, {
        existeRecurso: (ruta) => existsSync(new URL(`.${ruta}`, publico)),
      });
      console.log(`\n${resumenDeValidacion(v)}\n`);
      if (!v.valid) {
        this.error(`El catálogo de ejercicios tiene ${cuantos(v.errors.length, 'error', 'errores')}:\n${v.errors.map((e) => `  ✗ ${e.mensaje}`).join('\n')}`);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), validarCatalogoAlCompilar()],
  define: {
    __JOSSTYLE_VERSION__: JSON.stringify(version),
    __JOSSTYLE_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
  },
});
